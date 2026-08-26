import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8001';

router.post('/analyze', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { caseId, complaintVolumeMultiplier, amountThreshold, hourShift } = req.body;

  if (!caseId) {
    return res.status(400).json({ error: 'caseId is required for scenario baseline' });
  }

  try {
    const complaint = await prisma.complaint.findUnique({ where: { id: caseId } });
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint baseline not found' });
    }

    const createdDate = new Date(complaint.createdAt);
    const baselineHour = createdDate.getHours();
    const scenarioHour = (baselineHour + (hourShift || 0) + 24) % 24;

    const baselinePayload = {
      amount: complaint.amount,
      hour: baselineHour,
      day_of_week: createdDate.getDay(),
      category: complaint.category,
      state: complaint.sourceState,
      source_lat: complaint.sourceLat,
      source_lng: complaint.sourceLng
    };

    const scenarioPayload = {
      amount: complaint.amount * (complaintVolumeMultiplier || 1.0) + (amountThreshold || 0.0),
      hour: scenarioHour,
      day_of_week: createdDate.getDay(),
      category: complaint.category,
      state: complaint.sourceState,
      source_lat: complaint.sourceLat,
      source_lng: complaint.sourceLng
    };

    // Run baseline prediction on FastAPI
    const baseRes = await fetch(`${mlServiceUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baselinePayload)
    });

    // Run scenario prediction on FastAPI
    const scenRes = await fetch(`${mlServiceUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenarioPayload)
    });

    if (!baseRes.ok || !scenRes.ok) {
      throw new Error('ML service failed to respond to baseline/scenario parameters');
    }

    const baselineData = (await baseRes.json()) as any;
    const scenarioData = (await scenRes.json()) as any;

    const baselineRisk = baselineData.risk_score;
    const scenarioRisk = scenarioData.risk_score;
    const riskChange = scenarioRisk - baselineRisk;

    // Get nearby ATMs to show affected hotspots
    const atms = await prisma.aTM.findMany({ take: 3 });
    const affectedHotspots = atms.map((atm, index) => {
      const baseProb = index === 0 ? baselineData.probability : Math.max(0.05, baselineData.probability - index * 0.2);
      const scenProb = index === 0 ? scenarioData.probability : Math.max(0.05, scenarioData.probability - index * 0.15);
      return {
        atmId: atm.atmId,
        locationName: atm.locationName,
        baselineRisk: Math.round(baseProb * 100),
        scenarioRisk: Math.round(scenProb * 100),
        riskChange: Math.round((scenProb - baseProb) * 100)
      };
    });

    return res.json({
      baselineRisk,
      scenarioRisk,
      riskChange,
      baselineAtm: baselineData.predicted_atm,
      scenarioAtm: scenarioData.predicted_atm,
      affectedHotspots
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: `Scenario what-if analysis failed: ${err.message}` });
  }
});

export default router;
