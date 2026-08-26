import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const jwtSecret = process.env.JWT_SECRET || 'cyberintel-jwt-secret-key-14c';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await prisma.auditLog.create({
        data: {
          username: email,
          role: 'GUEST',
          action: 'LOGIN_ATTEMPT',
          resource: 'UserSession',
          result: 'FAILED',
          ipAddress
        }
      });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          username: user.email,
          role: user.role,
          action: 'LOGIN_ATTEMPT',
          resource: 'UserSession',
          result: 'FAILED',
          ipAddress
        }
      });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        username: user.email,
        role: user.role,
        action: 'USER_LOGIN',
        resource: 'UserSession',
        result: 'SUCCESS',
        ipAddress
      }
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        bankName: user.bankName
      }
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const ipAddress = req.ip || req.socket.remoteAddress;
  if (req.user) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          username: req.user.email,
          role: req.user.role,
          action: 'USER_LOGOUT',
          resource: 'UserSession',
          result: 'SUCCESS',
          ipAddress
        }
      });
    } catch (err) {
      console.error('Audit log failed during logout:', err);
    }
  }
  return res.json({ message: 'Logout successful' });
});

router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

export default router;
