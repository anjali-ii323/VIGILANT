import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../prisma';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        bankName: true,
        createdAt: true
      }
    });
    return res.json(users);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch users registry' });
  }
});

router.post('/', authenticateToken, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  const { email, password, name, role, bankName } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Email, password, name, and role required' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'User email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        bankName: role === 'BANK' ? bankName : null
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        username: req.user?.email || 'admin',
        role: req.user?.role || 'ADMIN',
        action: 'CREATE_USER',
        resource: `User:${user.id}`,
        result: 'SUCCESS',
        ipAddress
      }
    });

    return res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      bankName: user.bankName
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to register user credentials' });
  }
});

export default router;
