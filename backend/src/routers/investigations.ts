import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all investigations
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { status, page = '1', limit = '10' } = req.query;

  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skip = (pageNum - 1) * limitNum;

  const whereClause: any = {};

  if (status) {
    whereClause.status = status;
  }

  // Bank officers can only view relevant cases (which have alerts for their bank)
  if (req.user?.role === 'BANK') {
    whereClause.case = {
      victimBank: req.user.bankName
    };
  }

  try {
    const total = await prisma.investigation.count({ where: whereClause });
    const list = await prisma.investigation.findMany({
      where: whereClause,
      skip,
      take: limitNum,
      orderBy: { updatedAt: 'desc' },
      include: {
        case: {
          select: { id: true, victimName: true, category: true, amount: true, victimBank: true }
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
      investigations: list
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch investigations list' });
  }
});

// GET investigation details
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const iv = await prisma.investigation.findUnique({
      where: { id },
      include: {
        case: {
          include: {
            transactions: true,
            alerts: true,
            evidence: true
          }
        },
        assignedOfficer: {
          select: { id: true, name: true, email: true, role: true }
        },
        notes: {
          orderBy: { timestamp: 'desc' }
        },
        evidence: true
      }
    });

    if (!iv) {
      return res.status(404).json({ error: `Investigation log ${id} could not be found.` });
    }

    return res.json(iv);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to retrieve investigation case detail' });
  }
});

// POST append note to investigation
router.post('/:id/notes', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;

  if (!content) {
    return res.status(400).json({ error: 'Note content is required' });
  }

  try {
    const iv = await prisma.investigation.findUnique({ where: { id } });
    if (!iv) {
      return res.status(404).json({ error: 'Investigation case not found' });
    }

    const note = await prisma.investigationNote.create({
      data: {
        investigationId: id,
        officerName: req.user?.name || 'System Officer',
        content
      }
    });

    // Update case status if changed
    await prisma.investigation.update({
      where: { id },
      data: { status: 'INVESTIGATE' }
    });

    // Audit log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          username: req.user.email,
          role: req.user.role,
          action: 'ADD_INVESTIGATION_NOTE',
          resource: `Investigation:${id}`,
          result: 'SUCCESS',
          ipAddress
        }
      });
    }

    return res.status(201).json(note);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to save investigation note' });
  }
});

// POST append evidence to case
router.post('/:id/evidence', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, fileType } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;

  if (!title || !fileType) {
    return res.status(400).json({ error: 'Title and fileType required' });
  }

  try {
    const iv = await prisma.investigation.findUnique({ where: { id } });
    if (!iv) {
      return res.status(404).json({ error: 'Investigation case not found' });
    }

    const evidence = await prisma.evidence.create({
      data: {
        caseId: iv.caseId,
        investigationId: id,
        title,
        description: description || '',
        fileType
      }
    });

    // Audit log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          username: req.user.email,
          role: req.user.role,
          action: 'UPLOAD_EVIDENCE',
          resource: `Evidence:${evidence.id}`,
          result: 'SUCCESS',
          ipAddress
        }
      });
    }

    return res.status(201).json(evidence);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to record evidence file' });
  }
});

export default router;
