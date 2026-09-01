import React, { useState } from 'react';
import { 
  FileText, Download, Printer, Shield, Landmark, User, 
  MapPin, CheckCircle2, AlertTriangle, Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Reports: React.FC = () => {
  const { 
    activeCaseId, 
    cases, 
    currentCase, 
    transactions, 
    accounts, 
    addToast 
  } = useApp();

  const [reportType, setReportType] = useState<'CASE' | 'LEDGER' | 'RISK' | 'CASHOUT' | 'DAILY'>('CASE');

  const activeCaseObj = currentCase?.case || cases.find(c => c.case_id === activeCaseId) || cases[0];
  const victimObj = currentCase?.victim;

  const handlePrint = () => {
    addToast("Print Ready", "Preparing official intelligence document for printer/PDF export.", "info");
    window.print();
  };

  const handleExportCSV = () => {
    const headers = "TransactionID,Sender,Receiver,Amount,Type,RiskScore,Timestamp\n";
    const rows = transactions.map(t => 
      `${t.transaction_id},${t.sender_account},${t.receiver_account},${t.amount},${t.transaction_type},${t.risk_score},${t.timestamp}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VIGILANT_${activeCaseId}_Ledger_Extract.csv`;
    a.click();
    addToast("CSV Downloaded", `Exported ${transactions.length} transaction records.`, "success");
  };

  return (
    <div className="space-y-10 animate-fade-in text-text-primary font-sans pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border-subtle pb-6 gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-muted block mb-0.5">
            INTELLIGENCE REPORTS & DOSSIER EXPORTS
          </span>
          <h1 className="text-2xl md:text-3xl font-light text-text-primary">
            Intelligence Report Suite
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-canvas-900 hover:bg-canvas-850 border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-medium rounded transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-steel-400" />
            <span>Export CSV Ledger</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-steel-500 hover:bg-steel-600 text-white font-medium text-xs rounded transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Dossier</span>
          </button>
        </div>
      </div>

      {/* Report Template Selector Tabs */}
      <div className="flex items-center border-b border-border-subtle gap-4 text-xs font-mono">
        {[
          { id: 'CASE', label: 'CASE INVESTIGATION' },
          { id: 'LEDGER', label: 'MONEY TRAIL LEDGER' },
          { id: 'RISK', label: 'ACCOUNT INTELLIGENCE' },
          { id: 'CASHOUT', label: 'CASH-OUT RISK' },
          { id: 'DAILY', label: 'DAILY INTELLIGENCE' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as any)}
            className={`pb-2.5 px-1 font-medium transition-colors border-b-2 text-[11px] ${
              reportType === tab.id
                ? 'border-steel-400 text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Formal Printable Document Card */}
      <div className="p-8 bg-canvas-900 border border-border-subtle rounded space-y-6 text-text-primary max-w-4xl mx-auto shadow-2xl font-sans">
        
        {/* Formal Header */}
        <div className="border-b border-border-strong pb-5 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold font-mono tracking-[0.15em] text-text-primary uppercase">VIGILANT CYBER INTELLIGENCE</span>
            </div>
            <span className="text-[10px] text-text-muted font-mono block">Financial Crime Mitigation &middot; SIH Problem 26184</span>
          </div>

          <div className="text-right font-mono text-xs">
            <span className="text-steel-400 font-semibold block">REF: {activeCaseObj?.case_id}</span>
            <span className="text-[9.5px] text-text-muted block">{new Date().toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        {/* Notice */}
        <div className="p-2 bg-canvas-950 border border-border-subtle text-center text-[10px] font-mono text-text-muted">
          SYNTHETIC SIMULATION INTELLIGENCE RECORD &middot; EVALUATION PURPOSES ONLY
        </div>

        {/* Section 1: Case Summary */}
        <div className="space-y-3 text-xs">
          <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-steel-400 border-b border-border-subtle pb-1">
            I. Executive Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <span className="text-text-muted text-[9.5px] uppercase block">Victim Identity</span>
              <span className="font-semibold text-text-primary font-sans">{victimObj?.name || 'Ramesh Chandra'}</span>
              <span className="text-[10px] text-text-muted block">{victimObj?.bank_name} &middot; {victimObj?.account_number}</span>
            </div>
            <div>
              <span className="text-text-muted text-[9.5px] uppercase block">Disputed Loss</span>
              <span className="font-semibold text-steel-400 text-sm">₹{activeCaseObj?.amount?.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-text-muted text-[9.5px] uppercase block">Assigned Officer</span>
              <span className="text-text-secondary font-sans">{activeCaseObj?.assigned_officer}</span>
            </div>
            <div>
              <span className="text-text-muted text-[9.5px] uppercase block">Status</span>
              <span className="text-threat-critical font-semibold">{activeCaseObj?.current_status}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Money Trail Extract */}
        <div className="space-y-3 text-xs">
          <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-steel-400 border-b border-border-subtle pb-1">
            II. Reconstructed Money Trail ({transactions.length} Hops)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[10.5px]">
              <thead className="text-text-muted border-b border-border-subtle text-[9px] uppercase">
                <tr>
                  <th className="py-2">Tx ID</th>
                  <th className="py-2">Sender</th>
                  <th className="py-2">Receiver</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Method</th>
                  <th className="py-2">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {transactions.map(t => (
                  <tr key={t.transaction_id}>
                    <td className="py-2 text-text-muted">{t.transaction_id}</td>
                    <td className="py-2 text-text-secondary">{t.sender_account}</td>
                    <td className="py-2 text-steel-400">{t.receiver_account}</td>
                    <td className="py-2 font-semibold text-text-primary">₹{t.amount?.toLocaleString('en-IN')}</td>
                    <td className="py-2 text-text-muted">{t.transaction_type}</td>
                    <td className="py-2 text-threat-critical font-semibold">{t.risk_score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Predictive Assessment */}
        <div className="space-y-2 text-xs">
          <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-steel-400 border-b border-border-subtle pb-1">
            III. Interception Assessment
          </h3>
          <p className="text-text-secondary leading-relaxed">
            Machine learning sequential heuristics indicate with <strong>82% confidence</strong> that layered funds are converging towards physical extraction at <strong>ATM Cluster 03 (Dadar West Terminal)</strong>. Estimated lead-time window: <strong>20–40 minutes</strong>.
          </p>
        </div>

        {/* Signatures */}
        <div className="pt-6 border-t border-border-subtle flex justify-between items-end font-mono text-[9.5px] text-text-muted">
          <div>
            <span className="block text-text-secondary">Investigating Officer:</span>
            <span className="font-semibold text-text-primary">Officer Rajesh K. (Cyber Division)</span>
            <span className="block text-[8px]">DIGITALLY AUTHENTICATED</span>
          </div>
          <div>
            <span>Vigilant Intelligence Gateway v2.4</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Reports;
