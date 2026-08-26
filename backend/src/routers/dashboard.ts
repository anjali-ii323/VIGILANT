import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.get('/summary', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. KPI Aggregations
    const complaintsToday = await prisma.complaint.count({
      where: { createdAt: { gte: todayStart } }
    });

    const activeInvestigations = await prisma.investigation.count({
      where: { status: { in: ['ALERT', 'REVIEW', 'ASSIGN', 'INVESTIGATE'] } }
    });

    const highRiskHotspots = await prisma.hotspot.count({
      where: { riskLevel: { in: ['HIGH', 'CRITICAL'] } }
    });

    const predictedWithdrawals = await prisma.prediction.count({
      where: { predictedType: 'CASH_OUT' }
    });

    const fundsAtRiskAgg = await prisma.complaint.aggregate({
      _sum: { amount: true },
      where: { status: { not: 'RESOLVED' } }
    });
    const fundsAtRisk = fundsAtRiskAgg._sum.amount || 0.0;

    const alertsGenerated = await prisma.alert.count({
      where: { status: 'ACTIVE' }
    });

    // 2. Chart 1: Complaints over time (grouped by day of week)
    const complaintsRaw = await prisma.complaint.findMany({
      select: { createdAt: true }
    });
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    complaintsRaw.forEach(c => {
      const day = new Date(c.createdAt).getDay();
      weekdayCounts[day]++;
    });
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const complaintsOverTime = weekdays.map((day, idx) => ({
      name: day,
      complaints: weekdayCounts[idx]
    }));

    // 3. Chart 2: Withdrawal trend (grouped by date)
    const txCashouts = await prisma.transaction.findMany({
      where: { transactionType: 'ATM_WITHDRAWAL' },
      select: { timestamp: true, amount: true }
    });
    const dateMap: Record<string, { count: number; sum: number }> = {};
    txCashouts.forEach(tx => {
      const dateStr = new Date(tx.timestamp).toISOString().split('T')[0];
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { count: 0, sum: 0 };
      }
      dateMap[dateStr].count++;
      dateMap[dateStr].sum += tx.amount;
    });
    const withdrawalTrend = Object.keys(dateMap).slice(-7).map(date => ({
      date: date.substring(5), // MM-DD
      withdrawals: dateMap[date].count,
      amount: Math.round(dateMap[date].sum)
    }));

    // 4. Chart 3: Crime category distribution
    const categoriesGroup = await prisma.complaint.groupBy({
      by: ['category'],
      _count: { id: true }
    });
    const categoryDistribution = categoriesGroup.map(item => ({
      name: item.category,
      value: item._count.id
    }));

    // 5. Chart 4: State-wise risk
    const stateGroup = await prisma.complaint.groupBy({
      by: ['sourceState'],
      _count: { id: true },
      _sum: { amount: true }
    });
    const stateWiseRisk = stateGroup.map(item => ({
      state: item.sourceState,
      complaints: item._count.id,
      amount: Math.round(item._sum.amount || 0.0),
      riskScore: item._count.id > 1500 ? 92 : item._count.id > 500 ? 76 : 38
    }));

    // 6. Chart 5: Hour-wise withdrawal pattern
    const hourCounts = Array(24).fill(0);
    txCashouts.forEach(tx => {
      const hour = new Date(tx.timestamp).getHours();
      hourCounts[hour]++;
    });
    const hourWiseWithdrawalPattern = hourCounts.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      withdrawals: count
    }));

    // 7. Chart 6: Risk trend
    const riskTrend = [
      { month: 'Jan', baseline: 35, predicted: 42 },
      { month: 'Feb', baseline: 38, predicted: 45 },
      { month: 'Mar', baseline: 42, predicted: 50 },
      { month: 'Apr', baseline: 40, predicted: 55 },
      { month: 'May', baseline: 45, predicted: 62 },
      { month: 'Jun', baseline: 52, predicted: 68 },
      { month: 'Jul', baseline: 58, predicted: 74 },
    ];

    return res.json({
      metrics: {
        complaintsToday,
        activeInvestigations,
        highRiskHotspots,
        predictedWithdrawals,
        fundsAtRisk,
        alertsGenerated
      },
      charts: {
        complaintsOverTime,
        withdrawalTrend,
        categoryDistribution,
        stateWiseRisk,
        hourWiseWithdrawalPattern,
        riskTrend
      }
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to aggregate dashboard summary metrics' });
  }
});

export default router;
