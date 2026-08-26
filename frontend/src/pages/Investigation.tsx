import React, { useState, useEffect } from 'react';
import { 
  Search, ShieldAlert, Clock, Landmark, User, CreditCard, 
  MapPin, CheckCircle, HelpCircle, ArrowRight, ShieldCheck, X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AuditActivityItem {
  date: string;
  action: string;
  amount: string;
  type: string;
}

interface AuditWithdrawalItem {
  atm: string;
  amount: string;
  time: string;
}

interface AuditAccountInfo {
  account_number: string;
  holder: string;
  phone: string;
  bank: string;
  ifsc: string;
  risk: number;
  classification: string;
  balance: string;
  recentActivity: AuditActivityItem[];
  withdrawals: AuditWithdrawalItem[];
  locationPattern: string;
}

export const Investigation: React.FC = () => {
  const { activeCaseId, accounts, addToast } = useApp();
  const [searchVal, setSearchVal] = useState<string>('');
  const [auditData, setAuditData] = useState<AuditAccountInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Initial lookup of the first case mule when case changes
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const firstMule = accounts.find(a => a.is_mule);
      const accToLoad = firstMule ? firstMule.account_number : accounts[0].account_number;
      setSearchVal(accToLoad);
      fetchAccountLookup(accToLoad);
    } else {
      setSearchVal('');
      setAuditData(null);
    }
  }, [accounts]);

  const fetchAccountLookup = async (accNum: string) => {
    if (!accNum.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const resAcc = await fetch(`/api/accounts/${accNum.trim()}`);
      if (!resAcc.ok) {
        setErrorMsg(`Account ${accNum} could not be located in the database.`);
        setAuditData(null);
        setLoading(false);
        return;
      }
      const acc = await resAcc.json();

      const resRisk = await fetch(`/api/accounts/${accNum.trim()}/risk`);
      const risk = resRisk.ok ? await resRisk.json() : { risk_score: 5.0, risk_factors: {} };

      const resHist = await fetch(`/api/accounts/${accNum.trim()}/history`);
      const history = resHist.ok ? await resHist.json() : [];

      setAuditData({
        account_number: acc.account_number,
        holder: acc.holder_name,
        phone: acc.phone_number,
        bank: acc.bank_name,
        ifsc: acc.ifsc_code,
        risk: Math.round(risk.risk_score),
        classification: acc.classification,
        balance: acc.linked_case_id ? "₹0.00 (Hold Freeze)" : "₹54,000.00 (Active)",
        recentActivity: history.slice(0, 10).map((tx: any) => ({
          date: new Date(tx.timestamp).toLocaleTimeString(),
          action: tx.sender_account === acc.account_number 
            ? `Transfer to ${tx.receiver_account}` 
            : `Deposit from ${tx.sender_account}`,
          amount: `₹${tx.amount.toLocaleString('en-IN')}`,
          type: tx.sender_account === acc.account_number ? 'OUT' : 'IN'
        })),
        withdrawals: history.filter((t: any) => t.receiver_account.startsWith('ATM')).slice(0, 5).map((tx: any) => ({
          atm: tx.receiver_account,
          amount: `₹${tx.amount.toLocaleString('en-IN')}`,
          time: new Date(tx.timestamp).toLocaleTimeString()
        })),
        locationPattern: acc.classification === "HIGH RISK" 
          ? "ATM card withdrawals mismatch registered KYC coordinates. Dadar/Bandra IP logged." 
          : "Access matches standard personal retail profiles."
      });
    } catch (err) {
      setErrorMsg("Connection failure querying National Registry.");
      setAuditData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAccountLookup(searchVal);
  };

  return (
    <div className="space-y-6 text-xs">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-navy-950 font-sans">Entity Investigation Center</h2>
        <p className="text-xs text-slate-500 font-sans mt-0.5">
          Query the National Registry database to audit node profiles, KYC logs, and history sheets.
        </p>
      </div>

      {/* Suggested Case Accounts Badges */}
      {accounts.length > 0 && (
        <div className="bg-slate-50 p-3 rounded border border-slate-200 shadow-sm flex flex-wrap items-center gap-2">
          <span className="text-slate-500 font-medium font-sans">Active Case Nodes:</span>
          {accounts.map((acc) => (
            <button
              key={acc.account_number}
              onClick={() => {
                setSearchVal(acc.account_number);
                fetchAccountLookup(acc.account_number);
              }}
              className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-colors border ${
                searchVal === acc.account_number
                  ? 'bg-navy-950 text-white border-navy-950'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {acc.account_number} ({acc.is_mule ? 'Mule' : 'Victim'})
            </button>
          ))}
        </div>
      )}

      {/* Lookup search box */}
      <form onSubmit={handleLookup} className="bg-white p-4 border rounded shadow-sm flex gap-3 max-w-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Account ID (e.g. MULE-A457)..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded font-mono text-xs focus:outline-none focus:ring-1 focus:ring-navy-600"
          />
        </div>
        <button 
          type="submit"
          className="px-4 py-2 bg-navy-950 text-white font-bold rounded hover:bg-navy-900"
        >
          Run Audit
        </button>
      </form>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg max-w-lg">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center p-12 text-slate-400">Querying National KYC registries...</div>
      ) : auditData ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Account KYC profiling summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-50 p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-start border-b pb-2">
                <div>
                  <h3 className="font-bold text-navy-950 font-mono">{auditData.account_number}</h3>
                  <span className="text-[10px] text-slate-500 font-sans">{auditData.bank}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  auditData.risk >= 80 ? 'bg-red-100 text-red-850' : 'bg-amber-100 text-amber-850'
                }`}>
                  Risk: {auditData.risk}%
                </span>
              </div>

              <div className="space-y-2">
                <div><span className="text-slate-400 block">Holder Name:</span> <span className="font-semibold text-slate-800">{auditData.holder}</span></div>
                <div><span className="text-slate-400 block">KYC Phone Mapping:</span> <span className="font-mono text-slate-800">{auditData.phone}</span></div>
                <div><span className="text-slate-400 block">Bank IFSC Code:</span> <span className="font-mono text-slate-800">{auditData.ifsc}</span></div>
                <div><span className="text-slate-400 block">Registry Classification:</span> <span className="font-bold uppercase text-red-750">{auditData.classification}</span></div>
                <div><span className="text-slate-400 block">Account status:</span> <span className="font-bold text-slate-900">{auditData.balance}</span></div>
              </div>
            </div>

            {/* Location profiling */}
            <div className="bg-slate-50 p-4 border rounded-lg space-y-2">
              <h4 className="font-bold text-navy-950 uppercase text-[9px] tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-navy-700" />
                Geographic / Access anomalies
              </h4>
              <p className="text-slate-655 leading-relaxed text-[11px]">{auditData.locationPattern}</p>
            </div>
          </div>

          {/* Right: History ledger lists & ATM cashouts */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Recent transactions list */}
            <div className="bg-white border rounded shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="p-3 bg-slate-50 border-b flex items-center justify-between">
                <span className="font-bold text-navy-950 uppercase text-[9px] tracking-wider">KYC Transaction Logs</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="divide-y max-h-[300px] overflow-y-auto">
                {auditData.recentActivity.map((act, i) => (
                  <div key={i} className="p-3 hover:bg-slate-50 flex justify-between items-center text-[10.5px]">
                    <div>
                      <div className="font-semibold text-slate-800">{act.action}</div>
                      <span className="text-[9px] text-slate-400 font-mono">{act.date}</span>
                    </div>
                    <span className={`font-bold ${act.type === 'IN' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {act.type === 'IN' ? '+' : '-'} {act.amount}
                    </span>
                  </div>
                ))}
                {auditData.recentActivity.length === 0 && (
                  <p className="p-6 text-center text-slate-400">No transactions recorded.</p>
                )}
              </div>
            </div>

            {/* ATM withdrawals log */}
            <div className="bg-white border rounded shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="p-3 bg-slate-50 border-b flex items-center justify-between">
                <span className="font-bold text-navy-950 uppercase text-[9px] tracking-wider">ATM Cash-out withdrawals</span>
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="divide-y max-h-[300px] overflow-y-auto">
                {auditData.withdrawals.map((w, i) => (
                  <div key={i} className="p-3 hover:bg-slate-50 flex justify-between items-center text-[10.5px]">
                    <div>
                      <div className="font-semibold text-slate-800">{w.atm}</div>
                      <span className="text-[9px] text-slate-400 font-mono">{w.time}</span>
                    </div>
                    <span className="font-bold text-red-700">{w.amount}</span>
                  </div>
                ))}
                {auditData.withdrawals.length === 0 && (
                  <p className="p-6 text-center text-slate-400">No ATM cashout withdrawals recorded.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="p-12 text-center text-slate-450 border border-dashed rounded bg-slate-50">
          Search for an account ID (e.g. MULE-A457, MULE-M221) or click one of the case nodes above to inspect its transaction history.
        </div>
      )}

    </div>
  );
};
export default Investigation;
