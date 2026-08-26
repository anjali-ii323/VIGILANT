import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, HelpCircle, ArrowRight, Landmark, 
  Search, CheckCircle, Info, RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';

export const RiskIntelligence: React.FC = () => {
  const { accounts, activeCaseId, addToast } = useApp();
  
  // Selected account state
  const [selectedAccNum, setSelectedAccNum] = useState<string>('');
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Auto-select first mule account when active case or accounts list changes
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const firstMule = accounts.find(a => a.is_mule);
      if (firstMule) {
        setSelectedAccNum(firstMule.account_number);
      } else {
        setSelectedAccNum(accounts[0].account_number);
      }
    } else {
      setSelectedAccNum('');
      setRiskData(null);
    }
  }, [accounts]);

  const fetchRiskDetails = async (accNum: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${accNum}/risk`);
      if (res.ok) {
        const data = await res.json();
        setRiskData(data);
      }
    } catch (err) {
      console.error("Failed to load risk analysis:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccNum) {
      fetchRiskDetails(selectedAccNum);
    }
  }, [selectedAccNum]);

  const handleRecalculateRisk = async () => {
    if (!selectedAccNum) return;
    try {
      const res = await fetch(`/api/accounts/${selectedAccNum}/risk/recalculate`, { method: 'POST' });
      if (res.ok) {
        addToast("Risk Recalculated", "Isolation Forest models executed successfully.", "success");
        fetchRiskDetails(selectedAccNum);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Generate dynamic timeseries history based on current score
  const getDynamicHistory = () => {
    if (!riskData) return [];
    const score = Math.round(riskData.risk_score);
    return [
      { date: '10:00', score: Math.round(score * 0.1) },
      { date: '10:15', score: Math.round(score * 0.15) },
      { date: '10:32', score: Math.round(score * 0.45) },
      { date: '10:38', score: Math.round(score * 0.75) },
      { date: '10:44', score: score }
    ];
  };

  const getFactorDescription = (factor: string) => {
    if (factor.includes("splitting")) return "Splits large transfers into multiple sub-transfers below alert limits.";
    if (factor.includes("senders")) return "Receives micro-transactions from multiple distinct UPI handles.";
    if (factor.includes("velocity") || factor.includes("movement")) return "Transfers out >75% of incoming funds within a short window.";
    if (factor.includes("amount")) return "Individual transfers exceed normal baseline volumes by >3x.";
    if (factor.includes("activity") || factor.includes("suspicious")) return "Linked mobile registration matches historical fraud logs.";
    if (factor.includes("Location")) return "Logged ATM withdrawal coordinates mismatch KYC address.";
    return "Dynamic outlier status flagged by Isolation Forest models.";
  };

  return (
    <div className="space-y-6 text-xs">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-3">
        <div>
          <h2 className="text-sm font-bold text-navy-950 font-sans uppercase tracking-wider">Dynamic Risk Audit</h2>
          <p className="text-[10px] text-slate-500">Explainable AI feature weights for active mule nodes.</p>
        </div>
        
        {/* Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Select Account:</span>
          <select 
            value={selectedAccNum}
            onChange={(e) => setSelectedAccNum(e.target.value)}
            className="border border-slate-250 p-1.5 rounded font-mono bg-white focus:outline-none"
          >
            {accounts.map((acc) => (
              <option key={acc.account_number} value={acc.account_number}>
                {acc.account_number} ({acc.is_mule ? 'MULE' : 'VICTIM'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12 text-slate-400">Loading risk features...</div>
      ) : riskData ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel: Risk breakdown */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Score card */}
            <div className="bg-slate-50 p-4 border rounded-lg flex items-center justify-between">
              <div>
                <div className="text-slate-400 uppercase text-[9px] font-bold tracking-wider mb-1">Threat Score Index</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-navy-950 font-mono">{Math.round(riskData.risk_score)}%</span>
                  <span className={`font-bold ${
                    riskData.risk_score >= 80 ? 'text-red-700' : 'text-orange-700'
                  }`}>
                    {riskData.classification}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 max-w-lg leading-relaxed">
                  Threat rating indicates that this account shows behaviour commonly associated with structuring, layering, or cash-outs in the simulated dataset.
                </p>
              </div>
              
              <button 
                onClick={handleRecalculateRisk}
                className="px-3.5 py-2 bg-navy-950 text-white rounded font-bold hover:bg-navy-900 flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Recalculate Audit
              </button>
            </div>

            {/* Feature weights checklist */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Explainable Risk Factors Weight Checklist:</h3>
              <div className="space-y-2">
                {Object.entries(riskData.risk_factors || {}).map(([factor, weight]) => (
                  <div key={factor} className="p-3 border rounded-lg bg-white flex justify-between items-center hover:shadow-sm transition-shadow">
                    <div className="space-y-0.5">
                      <span className="font-bold text-navy-950">{factor}</span>
                      <p className="text-[10px] text-slate-500">{getFactorDescription(factor)}</p>
                    </div>
                    <span className="font-mono font-bold text-red-700 text-sm">+{String(weight)}</span>
                  </div>
                ))}
                {Object.keys(riskData.risk_factors || {}).length === 0 && (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 border border-dashed rounded">
                    Account classified as SAFE. No suspicious anomaly triggers logged.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right panel: Risk history Area chart */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-50 p-4 border rounded-lg space-y-4">
              <div>
                <h3 className="font-bold text-navy-950 uppercase text-[10px] tracking-wider mb-0.5">Surveillance Audits Log</h3>
                <p className="text-[9px] text-slate-550">Risk rating escalation timeline.</p>
              </div>

              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getDynamicHistory()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="date" stroke="#868e96" fontSize={9} />
                    <YAxis stroke="#868e96" fontSize={9} width={20} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                    <Area type="monotone" dataKey="score" stroke="#c92a2a" fill="#ffe3e3" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border rounded-lg text-slate-550 leading-relaxed space-y-2">
              <div className="flex items-center gap-1 text-[10px] font-bold text-navy-950 uppercase tracking-wider">
                <Info className="w-3.5 h-3.5 text-navy-700" />
                Auditor Disclaimer
              </div>
              <p className="text-[10px]">
                Vigilant evaluates risk scores using scikit-learn Isolation Forest classifiers trained on normal and anomalous transactions. These ratings do not constitute legal evidence.
              </p>
            </div>

          </div>

        </div>
      ) : (
        <div className="p-12 text-center text-slate-450 border border-dashed rounded bg-slate-50">
          No account data available for active case {activeCaseId}. Run the database seeder or create new case instances.
        </div>
      )}

    </div>
  );
};
export default RiskIntelligence;
