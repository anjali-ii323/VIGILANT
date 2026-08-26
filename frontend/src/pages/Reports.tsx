import React, { useState, useEffect } from 'react';
import { 
  FileText, FileDown, Printer, RefreshCw, CheckCircle, 
  Landmark, User, ShieldAlert, ArrowRight, BookOpen 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Reports: React.FC = () => {
  const { activeCaseId, addToast } = useApp();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/case/${activeCaseId}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeCaseId]);

  const handleExportCSV = () => {
    if (!reportData || !reportData.money_trail || reportData.money_trail.length === 0) {
      addToast("Export Error", "No transaction records loaded for export.", "error");
      return;
    }
    const headers = "Transaction ID,Sender Account,Receiver Account,Amount (INR),Type,Timestamp,Risk Score (%)\n";
    const rows = reportData.money_trail.map((tx: any) => 
      `"${tx.transaction_id}","${tx.from}","${tx.to}",${tx.amount},"${tx.type}","${tx.timestamp}",${tx.risk_score}`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Vigilant_Report_${reportData.case_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("CSV Exported", "Money trail transaction ledger saved to downloads folder.", "success");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-950 font-sans">Investigation Reports</h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Compile and export verified evidence sheets for legal and bank action.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex gap-2 text-xs">
          <button 
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold rounded flex items-center gap-1.5"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export CSV
          </button>
          
          <button 
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-navy-950 hover:bg-navy-800 text-white font-bold rounded flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* Split details layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        
        {/* Left: Report template preview */}
        <div className="lg:col-span-8 bg-white p-6 border rounded shadow-sm space-y-5 print:border-none print:shadow-none">
          {loading ? (
            <div className="text-center p-12 text-slate-400">Compiling ledger timelines...</div>
          ) : reportData ? (
            <div className="space-y-6">
              
              {/* Report Header block */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-navy-950 tracking-wide font-mono">{reportData.report_id}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Date Compiled: {new Date(reportData.generated_at).toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right">
                  <h1 className="font-black text-xs text-navy-950">VIGILANT REPORT</h1>
                  <p className="text-[9px] text-slate-500 font-mono">Case Target: {reportData.case_id}</p>
                </div>
              </div>

              {/* Victim profile details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 border rounded text-xs space-y-1.5">
                  <h4 className="font-bold text-navy-950 uppercase text-[9px] tracking-wider mb-1">Victim / Complainant</h4>
                  <div>Name: <span className="font-semibold text-slate-800">{reportData.victim_profile.name}</span></div>
                  <div>Phone: <span className="font-mono text-slate-800">{reportData.victim_profile.phone}</span></div>
                  <div>Account: <span className="font-mono text-slate-800">{reportData.victim_profile.account}</span> ({reportData.victim_profile.bank_name})</div>
                </div>

                <div className="bg-slate-50 p-4 border rounded text-xs space-y-1.5">
                  <h4 className="font-bold text-navy-950 uppercase text-[9px] tracking-wider mb-1">Case Financials</h4>
                  <div>Total Fraud Amount: <span className="font-extrabold text-navy-950">₹{reportData.financials.reported_amount.toLocaleString('en-IN')}</span></div>
                  <div>Funds Traced on Mule: <span className="font-bold text-emerald-800">₹{reportData.financials.funds_traced.toLocaleString('en-IN')}</span></div>
                  <div>Potentially Withdrawn: <span className="font-bold text-red-800">₹{reportData.financials.potentially_withdrawn.toLocaleString('en-IN')}</span></div>
                </div>
              </div>

              {/* Transactions Money trail lists */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 uppercase text-[9px] tracking-wider mb-1">Verified Money Trail Ledger</h4>
                <div className="border rounded overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="p-2">Transaction ID</th>
                        <th className="p-2">From Account</th>
                        <th className="p-2">To Account/ATM</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Method</th>
                        <th className="p-2">Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[10.5px]">
                      {reportData.money_trail.map((tx: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 text-slate-500">{tx.transaction_id}</td>
                          <td className="p-2">{tx.from}</td>
                          <td className="p-2 font-semibold">{tx.to}</td>
                          <td className="p-2 font-bold text-slate-900">₹{tx.amount.toLocaleString('en-IN')}</td>
                          <td className="p-2 font-sans">{tx.type}</td>
                          <td className="p-2 text-red-700 font-bold">{tx.risk_score}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Investigation timeline */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 uppercase text-[9px] tracking-wider mb-1">Chronological Action Records</h4>
                <div className="space-y-3 pl-4 border-l border-slate-200">
                  {reportData.investigation_timeline.map((act: any, idx: number) => (
                    <div key={idx} className="space-y-0.5 relative">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-350 border border-white" />
                      <span className="font-mono text-slate-400 text-[10px]">{new Date(act.timestamp).toLocaleTimeString('en-IN')}</span>
                      <p className="text-slate-755 leading-relaxed text-[11px]">{act.action} (Officer: {act.officer})</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-12 grid grid-cols-2 gap-6 text-center text-slate-400 text-[10px] border-t border-dashed">
                <div className="space-y-6">
                  <div className="h-0.5 bg-slate-250 w-32 mx-auto" />
                  <span>Investigating Officer Rajesh K.</span>
                </div>
                <div className="space-y-6">
                  <div className="h-0.5 bg-slate-250 w-32 mx-auto" />
                  <span>National Cyber Crime Portal Authority</span>
                </div>
              </div>

            </div>
          ) : (
            <p className="text-slate-400 text-center">No active report generated.</p>
          )}
        </div>

        {/* Right: Reports list index */}
        <div className="lg:col-span-4 bg-white p-5 border rounded shadow-sm space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-950 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-450" />
              Document Registry
            </h3>
            <p className="text-slate-500 text-[10px] mt-0.5 leading-relaxed">
              Compile summaries representing case audit templates.
            </p>
          </div>

          <div className="space-y-2">
            {[
              { title: 'Case Investigation Report', active: true },
              { title: 'Money Trail Ledger Sheet', active: false },
              { title: 'Suspicious Account Audit', active: false },
              { title: 'ATM Cash-Out Risk Index', active: false }
            ].map((doc, idx) => (
              <button
                key={idx}
                onClick={fetchReport}
                className={`w-full p-2.5 rounded text-left border flex items-center justify-between hover:bg-slate-55 transition-colors ${
                  doc.active ? 'bg-slate-50 font-bold border-navy-300' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                <span>{doc.title}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
export default Reports;
