import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all transactions with filters
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { complaintId, sender, receiver, isSimulated, page = '1', limit = '20' } = req.query;

  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 20;
  const skip = (pageNum - 1) * limitNum;

  const whereClause: any = {};

  if (complaintId) {
    whereClause.linkedComplaintId = complaintId as string;
  }
  if (sender) {
    whereClause.senderAccount = sender as string;
  }
  if (receiver) {
    whereClause.receiverAccount = receiver as string;
  }
  if (isSimulated !== undefined) {
    whereClause.isSimulated = isSimulated === 'true';
  }

  try {
    const total = await prisma.transaction.count({ where: whereClause });
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      skip,
      take: limitNum,
      orderBy: { timestamp: 'desc' },
      include: {
        linkedComplaint: {
          select: { victimName: true, category: true }
        }
      }
    });

    return res.json({
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
      transactions
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to query transactions list' });
  }
});

// GET single transaction
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const tx = await prisma.transaction.findUnique({
      where: { id },
      include: {
        linkedComplaint: true
      }
    });

    if (!tx) {
      return res.status(404).json({ error: `Transaction ${id} not found` });
    }

    return res.json(tx);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to retrieve transaction' });
  }
});

// POST Bulk CSV Import Ingestion (Admin/I4C endpoint)
router.post('/ingest', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { data } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;

  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Data array required.' });
  }

  let successCount = 0;
  let rejectedCount = 0;
  const errors: string[] = [];

  for (const item of data) {
    try {
      if (!item.id || !item.senderAccount || !item.receiverAccount || !item.amount) {
        throw new Error('Missing primary parameters (id, sender, receiver, amount)');
      }
      
      await prisma.transaction.upsert({
        where: { id: item.id },
        update: {
          amount: parseFloat(item.amount),
          transactionType: item.transactionType || 'IMPS',
          riskScore: parseFloat(item.riskScore || '0.0')
        },
        create: {
          id: item.id,
          senderAccount: item.senderAccount,
          receiverAccount: item.receiverAccount,
          amount: parseFloat(item.amount),
          transactionType: item.transactionType || 'IMPS',
          riskScore: parseFloat(item.riskScore || '0.0'),
          isSimulated: item.isSimulated === 'true' || item.isSimulated === true,
          linkedComplaintId: item.linkedComplaintId || null,
          timestamp: item.timestamp ? new Date(item.timestamp) : new Date()
        }
      });

      // Maintain Account profiles on the fly
      const senderExists = await prisma.account.count({ where: { accountNumber: item.senderAccount } });
      if (senderExists === 0) {
        await prisma.account.create({
          data: {
            accountNumber: item.senderAccount,
            holderName: 'Unknown Sender',
            bankName: 'Associated Bank',
            ifscCode: 'IFSC00001',
            phoneNumber: 'N/A'
          }
        });
      }

      const receiverExists = await prisma.account.count({ where: { accountNumber: item.receiverAccount } });
      if (receiverExists === 0) {
        const isMuleFlag = item.receiverAccount.startsWith('MULE');
        await prisma.account.create({
          data: {
            accountNumber: item.receiverAccount,
            holderName: 'Holder Name',
            bankName: 'Associated Bank',
            ifscCode: 'IFSC00002',
            phoneNumber: 'N/A',
            isMule: isMuleFlag,
            classification: isMuleFlag ? 'HIGH_RISK' : 'SAFE',
            riskScore: isMuleFlag ? 85.0 : 5.0,
            linkedCaseId: item.linkedComplaintId || null
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
        action: 'BATCH_INGEST_TRANSACTIONS',
        resource: 'TransactionLedger',
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

export default router;
