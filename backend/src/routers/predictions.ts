import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { getSocketIO } from '../main';

const router = Router();
const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8001';

// POST run prediction for a case
router.post('/run', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { caseId } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;

  if (!caseId) {
    return res.status(400).json({ error: 'caseId is required' });
  }

  try {
    // 1. Fetch case/complaint details from DB
    const complaint = await prisma.complaint.findUnique({
      where: { id: caseId }
    });

    if (!complaint) {
      return res.status(404).json({ error: `Complaint ${caseId} does not exist.` });
    }

    // 2. Prep inputs for ML service
    const createdDate = new Date(complaint.createdAt);
    const hour = createdDate.getHours();
    const dayOfWeek = createdDate.getDay();
    
    const payload = {
      amount: complaint.amount,
      hour,
      day_of_week: dayOfWeek,
      category: complaint.category,
      state: complaint.sourceState,
      source_lat: complaint.sourceLat,
      source_lng: complaint.sourceLng
    };

    // 3. Request inference from FastAPI ML Service
    const mlResponse = await fetch(`${mlServiceUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!mlResponse.ok) {
      const errMsg = await mlResponse.text();
      throw new Error(`ML service returned error: ${errMsg}`);
    }

    const prediction = (await mlResponse.json()) as any;

    // 4. Look up ATM details in DB
    const atm = await prisma.aTM.findUnique({
      where: { atmId: prediction.predicted_atm }
    });

    const locationName = atm ? atm.locationName : 'ATM Dadar Terminal 1';
    const city = atm ? atm.city : 'Mumbai';
    const state = atm ? atm.state : 'Maharashtra';
    const lat = atm ? atm.latitude : 19.0210;
    const lng = atm ? atm.longitude : 72.8424;

    // 5. Store Prediction in Database
    const dbPrediction = await prisma.prediction.create({
      data: {
        caseId,
        sourceAccount: complaint.victimAccount,
        targetEntity: prediction.predicted_atm,
        probability: prediction.probability,
        predictedType: 'CASH_OUT',
        timeWindowMins: prediction.time_window.includes('–') ? 180 : 60,
        factors: JSON.stringify(prediction.factors)
      }
    });

    // 6. Create Hotspot Record in Database
    const hotspot = await prisma.hotspot.create({
      data: {
        caseId,
        locationName,
        city,
        state,
        latitude: lat,
        longitude: lng,
        riskScore: parseFloat(prediction.risk_score),
        riskLevel: prediction.risk_level,
        predictedWindowMins: 60,
        factors: JSON.stringify(prediction.factors)
      }
    });

    // 7. Check Risk Level: Generate Alert if HIGH or CRITICAL
    let generatedAlert = null;
    if (prediction.risk_level === 'HIGH' || prediction.risk_level === 'CRITICAL') {
      generatedAlert = await prisma.alert.create({
        data: {
          caseId,
          severity: prediction.risk_level,
          title: 'High-Risk Withdrawal Hotspot Predicted',
          description: `Predictive analytics indicates a ${prediction.risk_score}% probability of fraudulent cash-out at ${locationName} within window ${prediction.time_window}.`,
          accountNumber: complaint.victimAccount,
          amountAtRisk: complaint.amount,
          status: 'ACTIVE'
        }
      });

      // Broadcast alert and notification via Socket.IO
      const io = getSocketIO();
      if (io) {
        io.emit('new_alert', {
          id: generatedAlert.id,
          caseId,
          severity: generatedAlert.severity,
          title: generatedAlert.title,
          description: generatedAlert.description,
          amountAtRisk: generatedAlert.amountAtRisk,
          timestamp: generatedAlert.timestamp.toISOString()
        });
        
        io.emit('dashboard_kpi_update');
      }

      // Add to notifications table
      await prisma.notification.create({
        data: {
          title: generatedAlert.title,
          description: generatedAlert.description,
          severity: generatedAlert.severity,
          caseId,
          status: 'UNREAD'
        }
      });
    }

    // 8. Update timeline event to show prediction occurred
    await prisma.investigationEvent.create({
      data: {
        caseId,
        stepNum: 4,
        title: 'Hotspot Prediction Generated',
        description: `ML model completed inference: Mapped predicted cash-out target to ${locationName} with ${prediction.risk_score}% risk.`
      }
    });

    // 9. Audit Log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          username: req.user.email,
          role: req.user.role,
          action: 'RUN_PREDICTION',
          resource: `Complaint:${caseId}`,
          result: 'SUCCESS',
          ipAddress
        }
      });
    }

    return res.json({
      prediction: dbPrediction,
      hotspot,
      alert: generatedAlert,
      risk_level: prediction.risk_level,
      risk_score: prediction.risk_score,
      probability: prediction.probability,
      time_window: prediction.time_window,
      factors: prediction.factors
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: `ML prediction failed: ${err.message}` });
  }
});

// GET all predictions
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await prisma.prediction.findMany({
      orderBy: { timestamp: 'desc' },
      include: {
        case: {
          select: { id: true, victimName: true, category: true }
        }
      }
    });
    return res.json(list);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to retrieve predictions list' });
  }
});

// GET model accuracy metrics directly from FastAPI
router.get('/metrics', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const metricsResponse = await fetch(`${mlServiceUrl}/metrics`);
    if (!metricsResponse.ok) {
      throw new Error('Failed to retrieve performance metrics from ML microservice');
    }
    const metrics = (await metricsResponse.json()) as any;
    return res.json(metrics);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: `Performance metrics retrieval failed: ${err.message}` });
  }
});

export default router;
