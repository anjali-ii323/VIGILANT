import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all complaints with paging, sorting, filtering
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { status, category, search, page = '1', limit = '10' } = req.query;

  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skip = (pageNum - 1) * limitNum;

  const whereClause: any = {};

  if (status) {
    whereClause.status = status;
  }
  
  if (category) {
    whereClause.category = category;
  }

  if (search) {
    whereClause.OR = [
      { id: { contains: search as string, mode: 'insensitive' } },
      { victimName: { contains: search as string, mode: 'insensitive' } },
      { victimPhone: { contains: search as string, mode: 'insensitive' } },
      { victimAccount: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  try {
    const total = await prisma.complaint.count({ where: whereClause });
    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedOfficer: {
          select: { name: true, role: true }
        }
      }
    });

    return res.json({
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
      complaints
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch complaints list' });
  }
});

// GET single complaint with full details (Anti-Mock Drill Down)
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        assignedOfficer: {
          select: { id: true, name: true, email: true, role: true }
        },
        transactions: {
          orderBy: { timestamp: 'asc' }
        },
        alerts: {
          orderBy: { timestamp: 'desc' }
        },
        predictions: {
          orderBy: { timestamp: 'desc' }
        },
        hotspots: {
          orderBy: { timestamp: 'desc' }
        },
        timelineEvents: {
          orderBy: { stepNum: 'asc' }
        },
        evidence: {
          orderBy: { timestamp: 'desc' }
        },
        reports: {
          orderBy: { generatedAt: 'desc' }
        },
        investigations: {
          include: {
            notes: {
              orderBy: { timestamp: 'desc' }
            },
            evidence: true
          }
        }
      }
    });

    if (!complaint) {
      return res.status(404).json({ error: `Complaint reference ${id} could not be located.` });
    }

    return res.json(complaint);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch complaint details' });
  }
});

// POST create complaint
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id, victimName, victimPhone, victimAccount, victimBank, amount, category, sourceCity, sourceState, sourceLat, sourceLng } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;

  if (!id || !victimName || !victimAccount || !amount || !category) {
    return res.status(400).json({ error: 'Required complaint parameters missing' });
  }

  try {
    const complaint = await prisma.complaint.create({
      data: {
        id,
        victimName,
        victimPhone,
        victimAccount,
        victimBank,
        amount: parseFloat(amount),
        category,
        sourceCity,
        sourceState,
        sourceLat: parseFloat(sourceLat || '19.076'),
        sourceLng: parseFloat(sourceLng || '72.877'),
        status: 'NEW'
      }
    });

    // Create baseline timeline event
    await prisma.investigationEvent.create({
      data: {
        caseId: id,
        stepNum: 1,
        title: 'Complaint Registered',
        description: `NCRP registered cybercrime complaint ${id} targeting account ${victimAccount}.`
      }
    });

    // Audit Log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          username: req.user.email,
          role: req.user.role,
          action: 'CREATE_COMPLAINT',
          resource: `Complaint:${id}`,
          result: 'SUCCESS',
          ipAddress
        }
      });
    }

    return res.status(201).json(complaint);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to record cybercrime complaint' });
  }
});

// POST Bulk CSV Import Ingestion (Admin/I4C endpoint)
router.post('/ingest', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { data } = req.body; // Expect array of complaint items
  const ipAddress = req.ip || req.socket.remoteAddress;

  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid payload structure. Data array required.' });
  }

  let successCount = 0;
  let rejectedCount = 0;
  const errors: string[] = [];

  for (const item of data) {
    try {
      if (!item.id || !item.amount || !item.category) {
        throw new Error('Missing primary key ID, amount, or category');
      }
      
      // Upsert to handle updates cleanly
      await prisma.complaint.upsert({
        where: { id: item.id },
        update: {
          victimName: item.victimName || 'Anonymous',
          victimPhone: item.victimPhone || 'N/A',
          amount: parseFloat(item.amount),
          category: item.category,
          sourceCity: item.sourceCity || 'Mumbai',
          sourceState: item.sourceState || 'Maharashtra'
        },
        create: {
          id: item.id,
          victimName: item.victimName || 'Anonymous',
          victimPhone: item.victimPhone || 'N/A',
          victimAccount: item.victimAccount || 'N/A',
          victimBank: item.victimBank || 'State Bank of India',
          amount: parseFloat(item.amount),
          category: item.category,
          sourceCity: item.sourceCity || 'Mumbai',
          sourceState: item.sourceState || 'Maharashtra',
          sourceLat: parseFloat(item.sourceLat || '19.076'),
          sourceLng: parseFloat(item.sourceLng || '72.877')
        }
      });

      // Create timeline event if new
      const evCount = await prisma.investigationEvent.count({ where: { caseId: item.id } });
      if (evCount === 0) {
        await prisma.investigationEvent.create({
          data: {
            caseId: item.id,
            stepNum: 1,
            title: 'Complaint Registered',
            description: `Ingested complaint ${item.id} from CSV batch.`
          }
        });
      }

      successCount++;
    } catch (err: any) {
      rejectedCount++;
      errors.push(`Row ID ${item.id || 'Unknown'}: ${err.message}`);
    }
  }

  // Audit Log
  if (req.user) {
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        username: req.user.email,
        role: req.user.role,
        action: 'BATCH_INGEST_COMPLAINTS',
        resource: 'ComplaintRegistry',
        result: 'SUCCESS',
        ipAddress
      }
    });
  }

  return res.json({
    status: 'INGEST_COMPLETED',
    successCount,
    rejectedCount,
    errors
  });
});

// Case-specific nested sub-routes for frontend AppContext compatibility
router.get('/:id/transactions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await prisma.transaction.findMany({
      where: { linkedComplaintId: req.params.id },
      orderBy: { timestamp: 'asc' }
    });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.get('/:id/accounts', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await prisma.account.findMany({
      where: { linkedCaseId: req.params.id }
    });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

router.get('/:id/predictions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await prisma.prediction.findMany({
      where: { caseId: req.params.id },
      orderBy: { timestamp: 'desc' }
    });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

router.get('/:id/alerts', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await prisma.alert.findMany({
      where: { caseId: req.params.id },
      orderBy: { timestamp: 'desc' }
    });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.get('/:id/timeline', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const timelineEvents = await prisma.investigationEvent.findMany({
      where: { caseId: req.params.id },
      orderBy: { stepNum: 'asc' }
    });
    const notes = await prisma.investigationNote.findMany({
      where: { investigation: { caseId: req.params.id } },
      orderBy: { timestamp: 'asc' }
    });

    const timeline = [
      ...timelineEvents.map(e => ({
        timestamp: e.timestamp.toISOString(),
        time_label: e.timestamp.toLocaleTimeString(),
        event_type: 'SYSTEM_EVENT',
        title: e.title,
        description: e.description,
        severity: e.stepNum >= 4 ? 'CRITICAL' : 'WARNING'
      })),
      ...notes.map(n => ({
        timestamp: n.timestamp.toISOString(),
        time_label: n.timestamp.toLocaleTimeString(),
        event_type: 'NOTE',
        title: `Note by ${n.officerName}`,
        description: n.content,
        severity: 'INFO'
      }))
    ];

    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return res.json(timeline);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compile timeline' });
  }
});

router.get('/:id/evidence', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await prisma.evidence.findMany({
      where: { caseId: req.params.id }
    });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch evidence' });
  }
});

router.get('/:id/cashout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const atms = await prisma.aTM.findMany();
    const hotspots = await prisma.hotspot.findMany({ where: { caseId: req.params.id } });
    const zones = atms.map(atm => {
      const hotspot = hotspots.find(h => h.locationName.includes(atm.locationName) || atm.locationName.includes(h.locationName));
      const riskScore = hotspot ? hotspot.riskScore : (atm.riskLevel === 'CRITICAL' ? 88 : atm.riskLevel === 'HIGH' ? 72 : atm.riskLevel === 'MEDIUM' ? 45 : 15);
      const riskColor = riskScore >= 80 ? 'red' : riskScore >= 55 ? 'orange' : riskScore >= 30 ? 'yellow' : 'green';
      return {
        id: atm.atmId,
        location_name: atm.locationName,
        city: atm.city,
        latitude: atm.latitude,
        longitude: atm.longitude,
        risk_score: riskScore,
        risk_level: hotspot ? hotspot.riskLevel : atm.riskLevel,
        risk_color: riskColor,
        predicted_window_mins: hotspot ? hotspot.predictedWindowMins : 60,
        factors: hotspot ? hotspot.factors : { "ATM withdrawal velocity": Math.round(atm.withdrawalVelocity / 10000) }
      };
    });
    return res.json(zones);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compile cashout predictions' });
  }
});

export default router;
