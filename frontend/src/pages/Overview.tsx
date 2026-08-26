import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, AlertTriangle, ShieldCheck, Landmark, Shield, 
  MapPin, Clock, ArrowUpRight, Search, Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';

// Hourly money movement mock timeseries
const chartData = [
  { hour: '00:00', amount: 45000 },
  { hour: '02:00', amount: 28000 },
  { hour: '04:00', amount: 15000 },
  { hour: '06:00', amount: 39000 },
  { hour: '08:00', amount: 120000 },
  { hour: '10:00', amount: 245000 },
  { hour: '12:00', amount: 180000 },
  { hour: '14:00', amount: 210000 },
  { hour: '16:00', amount: 290000 },
  { hour: '18:00', amount: 340000 },
  { hour: '20:00', amount: 220000 },
  { hour: '22:00', amount: 110000 }
];

export const Overview: React.FC = () => {
  const { cases, alerts, setActiveCaseId } = useApp();
  const navigate = useNavigate();

  // Dynamic KPI Metric states
  const [metrics, setMetrics] = useState({
    active_cases: 0,
    high_risk_accounts: 0,
    funds_under_risk_inr: 0,
    active_alerts: 0,
    predicted_cash_out_zones: 0,
    cases_requiring_action: 0
  });

  useEffect(() => {
    const loadSummaryMetrics = async () => {
      try {
        const res = await fetch('/api/reports/summary');
        if (res.ok) {
          const data = await res.json();
          setMetrics({
            active_cases: data.metrics.active_cases,
            high_risk_accounts: data.metrics.high_risk_accounts,
            funds_under_risk_inr: data.metrics.funds_under_risk_inr,
            active_alerts: data.metrics.active_alerts,
            predicted_cash_out_zones: data.metrics.predicted_cash_out_zones,
            cases_requiring_action: Math.round(data.metrics.active_cases * 0.28) || 6
          });
        }
      } catch (err) {
        console.error("Summary API failed:", err);
      }
    };
    loadSummaryMetrics();
  }, [cases, alerts]);

  const handleCaseClick = (caseId: string) => {
    setActiveCaseId(caseId);
    navigate(`/cases/${caseId}`); // Open specific case workspace
  };

  // Priority case records list
  const priorityCases = cases.slice(0, 5);
  
  // High-risk active alerts list
  const activeAlertsList = alerts.filter(a => a.status === 'ACTIVE').slice(0, 4);

  return (
    <div className="space-y-6">
      
      {/* 1. Header block */}
      <div>
        <h2 className="text-xl font-bold text-navy-950 font-sans">Financial Cybercrime Intelligence</h2>
        <p className="text-xs text-slate-500 font-sans mt-0.5">
          Monitor suspicious fund movement and identify potential cash-out risks.
        </p>
      </div>

      {/* 2. Top Metric Cards (Dynamic Links) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div 
          onClick={() => navigate('/cases')}
          className="bg-white p-3 rounded border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-navy-500 hover:shadow transition-all group"
        >
          <span className="text-[10px] text-slate-500 font-medium group-hover:text-navy-950 flex items-center justify-between">
            Active Cases
            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-navy-950" />
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-xl font-bold text-navy-950 font-mono">{metrics.active_cases}</span>
            <span className="text-[9px] font-mono text-slate-400 font-bold">Registry</span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/risk')}
          className="bg-white p-3 rounded border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-red-500 hover:shadow transition-all group"
        >
          <span className="text-[10px] text-slate-500 font-medium group-hover:text-red-700 flex items-center justify-between">
            High-Risk Accounts
            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-red-700" />
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-xl font-bold text-red-700 font-mono">{metrics.high_risk_accounts}</span>
            <span className="text-[9px] font-mono text-red-500 font-bold">Mules</span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/cases')}
          className="bg-white p-3 rounded border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-orange-500 hover:shadow transition-all group"
        >
          <span className="text-[10px] text-slate-500 font-medium group-hover:text-orange-700 flex items-center justify-between">
            Funds Under Risk
            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-orange-700" />
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-base font-bold text-orange-700 font-mono">
              ₹{(metrics.funds_under_risk_inr / 10000000).toFixed(2)} Cr
            </span>
            <span className="text-[9px] font-mono text-orange-500 font-bold">Disputed</span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/alerts')}
          className="bg-white p-3 rounded border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-red-500 hover:shadow transition-all group"
        >
          <span className="text-[10px] text-slate-500 font-medium group-hover:text-red-650 flex items-center justify-between">
            Active Alerts
            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-red-650" />
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-xl font-bold text-red-600 font-mono">{metrics.active_alerts}</span>
            <span className="text-[9px] font-mono text-red-500 font-bold">Active</span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/cashout')}
          className="bg-white p-3 rounded border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-navy-500 hover:shadow transition-all group"
        >
          <span className="text-[10px] text-slate-500 font-medium group-hover:text-navy-950 flex items-center justify-between">
            Cash-Out Clusters
            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-navy-950" />
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-xl font-bold text-navy-600 font-mono">{metrics.predicted_cash_out_zones}</span>
            <span className="text-[9px] font-mono text-slate-400 font-bold">Zones</span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/cases')}
          className="bg-white p-3 rounded border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-amber-500 hover:shadow transition-all group"
        >
          <span className="text-[10px] text-slate-500 font-medium group-hover:text-amber-800 flex items-center justify-between">
            Action Needed
            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-amber-800" />
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-xl font-bold text-amber-700 font-mono">{metrics.cases_requiring_action}</span>
            <span className="text-[9px] font-mono text-amber-500 font-bold">Critical</span>
          </div>
        </div>

      </div>

      {/* 3. Hourly Money Velocity Timeseries Area Chart */}
      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm text-xs">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Hourly Fund Routing Velocity (₹ INR)</span>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold uppercase">
            <Activity className="w-3.5 h-3.5 text-navy-600" />
            Live Surveillance feed
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
              <XAxis dataKey="hour" stroke="#868e96" fontSize={10} />
              <YAxis 
                stroke="#868e96" 
                fontSize={10} 
                tickFormatter={(tick) => `₹${(tick / 1000).toFixed(0)}k`} 
              />
              <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Amount']} />
              <Line type="monotone" dataKey="amount" stroke="#1d3557" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Priority Cases Grid list & Active Alerts lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="font-bold text-navy-950 uppercase text-[10px] tracking-wider">Priority Incident Registry</span>
              <button 
                onClick={() => navigate('/cases')}
                className="text-[10px] text-navy-900 font-extrabold hover:underline"
              >
                View Case Registry &rarr;
              </button>
            </div>
            
            <div className="divide-y divide-slate-100">
              {priorityCases.map((c) => (
                <div 
                  key={c.case_id}
                  onClick={() => handleCaseClick(c.case_id)}
                  className="p-3.5 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-navy-900">{c.case_id}</span>
                      <span className="text-[10px] text-slate-500">{c.fraud_type}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Assigned: {c.assigned_officer}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-slate-800">₹{c.amount.toLocaleString('en-IN')}</div>
                    <span className={`px-1.5 py-0.25 text-[8.5px] rounded font-bold uppercase font-mono ${
                      c.risk_score >= 80 ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                    }`}>
                      Risk: {c.risk_score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="font-bold text-navy-950 uppercase text-[10px] tracking-wider">Active Alarms Queue</span>
              <button 
                onClick={() => navigate('/alerts')}
                className="text-[10px] text-navy-900 font-extrabold hover:underline"
              >
                Manage &rarr;
              </button>
            </div>
            
            <div className="divide-y divide-slate-100">
              {activeAlertsList.length > 0 ? (
                activeAlertsList.map((alert) => (
                  <div key={alert.alert_id} className="p-3 flex flex-col gap-1 hover:bg-slate-50">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-slate-700">{alert.alert_id}</span>
                      <span className={`px-1.5 py-0.25 rounded text-[8.5px] font-bold ${
                        alert.severity === 'CRITICAL' ? 'bg-red-50 text-red-750' : 'bg-amber-50 text-amber-750'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800">{alert.title}</div>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{alert.description}</p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400">
                  No active critical alarms.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
export default Overview;
