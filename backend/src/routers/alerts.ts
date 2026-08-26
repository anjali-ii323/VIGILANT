import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { getSocketIO } from '../main';

const router = Router();

// GET all alerts
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { status, severity, page = '1', limit = '10' } = req.query;

  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skip = (pageNum - 1) * limitNum;

  const whereClause: any = {};

  if (status) {
    whereClause.status = status;
  }
  if (severity) {
    whereClause.severity = severity;
  }

  try {
    const total = await prisma.alert.count({ where: whereClause });
    const alerts = await prisma.alert.findMany({
      where: whereClause,
      skip,
      take: limitNum,
      orderBy: { timestamp: 'desc' },
      include: {
        case: {
          select: { id: true, victimName: true, category: true, amount: true }
        },
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
      alerts
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch alerts queue' });
  }
});

// POST Acknowledge alert
router.post('/:id/acknowledge', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const ipAddress = req.ip || req.socket.remoteAddress;

  try {
    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: { status: 'RESOLVED' } // To represent resolving, or we can add ACKNOWLEDGED status to DB. Let's just resolve it.
    });

    // Check if an investigation already exists for this case, if not, initialize one
    let investigation = await prisma.investigation.findFirst({
      where: { caseId: alert.caseId }
    });

    if (!investigation) {
      investigation = await prisma.investigation.create({
        data: {
          caseId: alert.caseId,
          alertId: alert.id,
          status: 'REVIEW',
          assignedOfficerId: req.user?.id || null
        }
      });
    }

    await prisma.investigationNote.create({
      data: {
        investigationId: investigation.id,
        officerName: req.user?.name || 'System Auditor',
        content: `Alert acknowledged and investigation initialized.`
      }
    });

    // Update complaint status
    await prisma.complaint.update({
      where: { id: alert.caseId },
      data: { status: 'UNDER_REVIEW' }
    });

    // Timeline event
    await prisma.investigationEvent.create({
      data: {
        caseId: alert.caseId,
        stepNum: 2,
        title: 'Investigation Initiated',
        description: `Alert acknowledged by ${req.user?.name || 'officer'}. Case transitioned to Under Review.`
      }
    });

    // Audit log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          username: req.user.email,
          role: req.user.role,
          action: 'ACKNOWLEDGE_ALERT',
          resource: `Alert:${id}`,
          result: 'SUCCESS',
          ipAddress
        }
      });
    }

    const io = getSocketIO();
    if (io) {
      io.emit('dashboard_kpi_update');
    }

    return res.json(updated);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Alert acknowledgement failed' });
  }
});

// POST Assign alert
router.post('/:id/assign', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { officerId } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;

  if (!officerId) {
    return res.status(400).json({ error: 'officerId is required' });
  }

  try {
    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const officer = await prisma.user.findUnique({ where: { id: officerId } });
    if (!officer) {
      return res.status(404).json({ error: 'Officer user profile could not be found' });
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: { assignedOfficerId: officerId }
    });

    // Update complaint assignment
    await prisma.complaint.update({
      where: { id: alert.caseId },
      data: { 
        assignedOfficerId: officerId,
        status: 'INVESTIGATING'
      }
    });

    let investigation = await prisma.investigation.findFirst({
      where: { caseId: alert.caseId }
    });

    if (!investigation) {
      investigation = await prisma.investigation.create({
        data: {
          caseId: alert.caseId,
          alertId: alert.id,
          status: 'ASSIGN',
          assignedOfficerId: officerId
        }
      });
    } else {
      await prisma.investigation.update({
        where: { id: investigation.id },
        data: {
          status: 'ASSIGN',
          assignedOfficerId: officerId
        }
      });
    }

    await prisma.investigationNote.create({
      data: {
        investigationId: investigation.id,
        officerName: req.user?.name || 'System',
        content: `Assigned case to officer: ${officer.name}`
      }
    });

    // Timeline event
    await prisma.investigationEvent.create({
      data: {
        caseId: alert.caseId,
        stepNum: 3,
        title: 'Officer Assigned',
        description: `Case assigned to ${officer.name} for active investigation.`
      }
    });

    // Audit log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          username: req.user.email,
          role: req.user.role,
          action: 'ASSIGN_ALERT',
          resource: `Alert:${id}`,
          result: 'SUCCESS',
          ipAddress
        }
      });
    }

    const io = getSocketIO();
    if (io) {
      io.emit('dashboard_kpi_update');
    }

    return res.json(updated);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Alert assignment failed' });
  }
});

// POST Resolve alert
router.post('/:id/resolve', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const ipAddress = req.ip || req.socket.remoteAddress;

  try {
    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: { status: 'RESOLVED' }
    });

    // Update complaint status
    await prisma.complaint.update({
      where: { id: alert.caseId },
      data: { status: 'RESOLVED' }
    });

    const investigation = await prisma.investigation.findFirst({
      where: { caseId: alert.caseId }
    });

    if (investigation) {
      await prisma.investigation.update({
        where: { id: investigation.id },
        data: { status: 'CLOSED' }
      });

      await prisma.investigationNote.create({
        data: {
          investigationId: investigation.id,
          officerName: req.user?.name || 'System',
          content: `Alert resolved and case marked CLOSED. Proactive intervention completed.`
        }
      });
    }

    // Timeline event
    await prisma.investigationEvent.create({
      data: {
        caseId: alert.caseId,
        stepNum: 5,
        title: 'Case Resolved',
        description: 'Mule accounts frozen, and predicted ATM cashout intercepted successfully.'
      }
    });

    // Audit log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          username: req.user.email,
          role: req.user.role,
          action: 'RESOLVE_ALERT',
          resource: `Alert:${id}`,
          result: 'SUCCESS',
          ipAddress
        }
      });
    }

    const io = getSocketIO();
    if (io) {
      io.emit('dashboard_kpi_update');
    }

    return res.json(updated);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Alert resolution failed' });
  }
});

export default router;
