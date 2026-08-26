import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET case report summary dynamically (Anti-Mock)
router.get('/case/:caseId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { caseId } = req.params;

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: caseId },
      include: {
        transactions: true,
        alerts: true,
        timelineEvents: true,
        evidence: true
      }
    });

    if (!complaint) {
      return res.status(404).json({ error: `Complaint record ${caseId} does not exist.` });
    }

    const officer = complaint.assignedOfficerId 
      ? await prisma.user.findUnique({ where: { id: complaint.assignedOfficerId } })
      : null;

    const fundsTraced = complaint.transactions
      .filter(tx => tx.receiverAccount.startsWith('MULE'))
      .reduce((sum, tx) => sum + tx.amount, 0);

    const potentiallyWithdrawn = complaint.transactions
      .filter(tx => tx.transactionType === 'ATM_WITHDRAWAL')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const report = {
      reportId: `REP-2026-${complaint.id.split('-').pop() || '001'}`,
      caseId: complaint.id,
      generatedAt: new Date().toISOString(),
      officer: officer ? officer.name : 'System Auditor Rajesh K.',
      victim_profile: {
        name: complaint.victimName,
        phone: complaint.victimPhone,
        bank_name: complaint.victimBank,
        account: complaint.victimAccount,
        disputed_amount: complaint.amount
      },
      financials: {
        reported_amount: complaint.amount,
        current_status: complaint.status,
        funds_traced: Math.round(fundsTraced),
        potentially_withdrawn: Math.round(potentiallyWithdrawn)
      },
      money_trail: complaint.transactions.map(tx => ({
        transaction_id: tx.id,
        from: tx.senderAccount,
        to: tx.receiverAccount,
        amount: tx.amount,
        type: tx.transactionType,
        timestamp: tx.timestamp.toISOString(),
        risk_score: tx.riskScore
      })),
      investigation_timeline: complaint.timelineEvents.map(ev => ({
        timestamp: ev.timestamp.toISOString(),
        step: ev.stepNum,
        action: ev.title,
        details: ev.description
      })),
      active_alerts_count: complaint.alerts.filter(a => a.status === 'ACTIVE').length
    };

    return res.json(report);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to compile case report metrics' });
  }
});

// POST save report log
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { caseId, title, fileType, data } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;

  if (!caseId || !title || !fileType) {
    return res.status(400).json({ error: 'Required parameters caseId, title, and fileType missing' });
  }

  try {
    const reportId = `REP-${Date.now().toString().substring(6)}`;
    const newReport = await prisma.report.create({
      data: {
        id: reportId,
        caseId,
        title,
        fileType,
        generatedBy: req.user?.name || 'Officer',
        data: JSON.stringify(data || {})
      }
    });

    // Audit log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          username: req.user.email,
          role: req.user.role,
          action: 'GENERATE_REPORT',
          resource: `Report:${reportId}`,
          result: 'SUCCESS',
          ipAddress
        }
      });
    }

    return res.status(201).json(newReport);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to record report log' });
  }
});

// GET all reports
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { generatedAt: 'desc' },
      include: {
        case: {
          select: { id: true, victimName: true, category: true }
        }
      }
    });
    return res.json(reports);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to query reports index' });
  }
});

export default router;
