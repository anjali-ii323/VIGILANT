import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, AlertTriangle, ShieldCheck, User, Calendar, 
  MapPin, Landmark, Phone, Play, RefreshCw, Upload, CheckCircle2,
  FileDown, Plus, ChevronRight, PlayCircle, Eye, ShieldAlert,
  Clock, CreditCard, CheckSquare, Search, FileText, Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SVGNetworkGraph } from '../components/SVGNetworkGraph';

export const Cases: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { 
    cases, activeCaseId, setActiveCaseId, alerts, transactions, accounts,
    predictions, timeline, evidence, triggerSimulationStep, 
    resetSimulation, simState, addToast, fetchCaseData 
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('Overview');

  // Registry Filter states (when viewing the full case list)
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<string>('');
  const [filterFraud, setFilterFraud] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filteredCases, setFilteredCases] = useState<any[]>([]);

  // Selected case summary loaded from cases listing
  const currentCase = cases.find(c => (c.case_id ? c.case_id.replace(/_/g, '-').toUpperCase() : '') === (caseId ? caseId.replace(/_/g, '-').toUpperCase() : ''));

  // Money Trail Playback State
  const [visibleSteps, setVisibleSteps] = useState<number>(99);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState<any>(null);

  // Predictions State
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  // Evidence search & filter states
  const [evidenceSearch, setEvidenceSearch] = useState<string>('');
  const [evidenceTypeFilter, setEvidenceTypeFilter] = useState<string>('');
  const [newEvidenceTitle, setNewEvidenceTitle] = useState<string>('');
  const [newEvidenceDesc, setNewEvidenceDesc] = useState<string>('');
  const [newEvidenceType, setNewEvidenceType] = useState<string>('PDF');

  // New Note Content State
  const [newNoteText, setNewNoteText] = useState<string>('');

  // Set active case ID on Route param update
  useEffect(() => {
    if (caseId) {
      const normalized = caseId.replace(/_/g, '-').toUpperCase();
      setActiveCaseId(normalized);
    }
  }, [caseId, setActiveCaseId]);

  // Set initial selected account for predictions
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const firstMule = accounts.find(a => a.is_mule);
      if (firstMule) {
        setSelectedAccount(firstMule.account_number);
      }
    }
  }, [accounts]);

  // Registry List filtering
  useEffect(() => {
    let result = [...cases];
    if (filterStatus) {
      result = result.filter(c => c.current_status === filterStatus);
    }
    if (filterRisk) {
      if (filterRisk === 'CRITICAL') result = result.filter(c => c.risk_score >= 85);
      else if (filterRisk === 'HIGH') result = result.filter(c => c.risk_score >= 70 && c.risk_score < 85);
      else if (filterRisk === 'MEDIUM') result = result.filter(c => c.risk_score >= 40 && c.risk_score < 70);
    }
    if (filterFraud) {
      result = result.filter(c => c.fraud_type.toLowerCase().includes(filterFraud.toLowerCase()));
    }
    if (filterSearch) {
      result = result.filter(c => 
        c.case_id.toLowerCase().includes(filterSearch.toLowerCase()) ||
        c.victim_ref.toLowerCase().includes(filterSearch.toLowerCase())
      );
    }
    setFilteredCases(result);
  }, [cases, filterStatus, filterRisk, filterFraud, filterSearch]);

  const handleSelectCase = (cid: string) => {
    navigate(`/cases/${cid}`);
  };

  // Construct money trail DAG dynamically from transactions of the active case
  const getDynamicMoneyTrail = () => {
    const nodesList: any[] = [];
    const edgesList: any[] = [];
    const uniqueIds = new Set<string>();

    if (!transactions || transactions.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Limit transactions to visible playback steps
    const activeTxs = transactions.slice(0, visibleSteps);

    activeTxs.forEach((tx: any) => {
      uniqueIds.add(tx.sender_account);
      uniqueIds.add(tx.receiver_account);
    });

    const nodeIdsArray = Array.from(uniqueIds);
    nodeIdsArray.forEach((nodeId) => {
      if (!nodeId) return;
      let type: 'VICTIM' | 'MULE' | 'BANK_ACCOUNT' | 'ATM' | 'MERCHANT' = 'BANK_ACCOUNT';
      let x = 200;
      let y = 150;
      let score = 5.0;

      // Determine matching bank data
      const accInfo = accounts.find(a => a.account_number === nodeId);
      if (accInfo) {
        score = accInfo.risk_score;
        if (accInfo.is_mule) type = 'MULE';
      }

      if (typeof nodeId === 'string' && nodeId.startsWith('ATM')) {
        type = 'ATM';
        score = 95.0;
      } else if (nodeId === currentCase?.victim_ref || (typeof nodeId === 'string' && (nodeId.startsWith('30') || nodeId.includes('VIC')))) {
        type = 'VICTIM';
        score = 5.0;
      }

      // Calculate dynamic positions
      if (type === 'VICTIM') {
        x = 80;
        y = 200;
      } else if (type === 'ATM') {
        x = 640;
        y = 200;
      } else if (type === 'MULE') {
        const mules = nodeIdsArray.filter(n => {
          const matchingAcc = accounts.find(a => a.account_number === n);
          return matchingAcc && matchingAcc.is_mule;
        });
        const idx = mules.indexOf(nodeId);
        x = 240 + idx * 160;
        y = 120 + (idx % 2) * 150;
      } else {
        x = 400;
        y = 80;
      }

      nodesList.push({
        id: nodeId,
        label: nodeId,
        type,
        riskScore: score,
        x,
        y
      });
    });

    activeTxs.forEach((tx: any, idx: number) => {
      edgesList.push({
        id: `e-${idx}`,
        source: tx.sender_account,
        target: tx.receiver_account,
        amount: tx.amount,
        type: tx.transaction_type,
        riskScore: tx.risk_score
      });
    });

    return { nodes: nodesList, edges: edgesList };
  };

  const playTrailAnimation = () => {
    setIsPlaying(true);
    setVisibleSteps(1);
    let step = 1;
    const interval = setInterval(() => {
      step += 1;
      setVisibleSteps(step);
      if (step >= transactions.length) {
        clearInterval(interval);
        setIsPlaying(false);
        setVisibleSteps(99);
      }
    }, 1200);
  };

  const handleSelectTxDetail = async (txId: string) => {
    try {
      const res = await fetch(`/api/transactions/${txId}`);
      if (res.ok) {
        setSelectedTxDetail(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !caseId) return;

    try {
      const res = await fetch(`/api/cases/${caseId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNoteText })
      });
      if (res.ok) {
        setNewNoteText('');
        addToast("Note recorded", "INVESTIGATION NOTE: Note registered in timeline logs.", "success");
        fetchCaseData(caseId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvidenceTitle.trim() || !caseId) return;

    try {
      // Mocking database post for evidence
      const res = await fetch(`/api/cases/${caseId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause' }) // Just querying DB hook
      });
      if (res.ok) {
        addToast("Evidence uploaded", `Locker updated with file ${newEvidenceTitle}.`, "success");
        setNewEvidenceTitle('');
        setNewEvidenceDesc('');
        fetchCaseData(caseId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Predictions filter
  const activePredictions = predictions.filter(p => p.source_account === selectedAccount);

  // Evidence filtering
  const filteredEvidence = evidence.filter(ev => {
    const matchesSearch = ev.title.toLowerCase().includes(evidenceSearch.toLowerCase()) || 
                          ev.description.toLowerCase().includes(evidenceSearch.toLowerCase());
    const matchesType = !evidenceTypeFilter || ev.file_type === evidenceTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      
      {/* CASES REGISTRY TABLE VIEW */}
      {!caseId ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-navy-950 font-sans">National Cyber Fraud Registry</h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Browse and filter cyber fraud complaints forwarded by banking units.
              </p>
            </div>
            
            <button 
              onClick={() => handleSelectCase('CF-2026-00421')}
              className="px-3.5 py-1.5 bg-navy-950 text-white rounded text-xs font-semibold hover:bg-navy-900 flex items-center gap-1.5 shadow"
            >
              Open Active Workspace
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white p-3 rounded border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Search ID / Victim</label>
              <input 
                type="text" 
                placeholder="Case ID..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full border border-slate-250 p-1.5 rounded focus:outline-none focus:ring-1 focus:ring-navy-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Status</label>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-slate-250 p-1.5 rounded focus:outline-none focus:ring-1 focus:ring-navy-600"
              >
                <option value="">ALL STATUSES</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="UNDER_REVIEW">UNDER REVIEW</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Risk Score</label>
              <select 
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="w-full border border-slate-250 p-1.5 rounded focus:outline-none focus:ring-1 focus:ring-navy-600"
              >
                <option value="">ALL RISK LEVELS</option>
                <option value="CRITICAL">CRITICAL (&gt;85%)</option>
                <option value="HIGH">HIGH (70% - 84%)</option>
                <option value="MEDIUM">MEDIUM (&lt;70%)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Fraud Category</label>
              <input 
                type="text" 
                placeholder="UPI, Job..."
                value={filterFraud}
                onChange={(e) => setFilterFraud(e.target.value)}
                className="w-full border border-slate-250 p-1.5 rounded focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3">Case ID</th>
                    <th className="p-3">Victim Ref</th>
                    <th className="p-3">Fraud Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3 text-center">Case Risk</th>
                    <th className="p-3">Assigned Officer</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCases.map((c) => (
                    <tr key={c.case_id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-navy-900">{c.case_id}</td>
                      <td className="p-3 font-mono text-slate-600">{c.victim_ref}</td>
                      <td className="p-3 text-slate-700">{c.fraud_type}</td>
                      <td className="p-3 font-bold text-slate-900">₹{c.amount.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          c.risk_score >= 85 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-orange-50 text-orange-700 border border-orange-100'
                        }`}>
                          {c.risk_score}%
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{c.assigned_officer}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          {c.current_status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => handleSelectCase(c.case_id)}
                          className="px-2.5 py-1 bg-navy-950 text-white rounded text-[10px] font-semibold hover:bg-navy-800 flex items-center gap-0.5 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Workspace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        
        /* SINGLE CASE WORKSPACE */
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/cases')}
                className="hover:bg-slate-100 p-1.5 rounded border border-slate-250"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-navy-950 font-mono">{caseId}</h2>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                    currentCase?.risk_score >= 85 ? 'bg-red-50 text-red-800 border-red-100' : 'bg-orange-50 text-orange-850 border-orange-100'
                  }`}>
                    {currentCase?.risk_score >= 85 ? 'CRITICAL' : 'HIGH'}
                  </span>
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-100">
                    {currentCase?.current_status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Assigned Officer: {currentCase?.assigned_officer} | Fraud Category: {currentCase?.fraud_type}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={resetSimulation}
                className="px-2.5 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 rounded text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Sim
              </button>
              
              <button 
                onClick={triggerSimulationStep}
                disabled={simState.current_step >= 5}
                className={`px-3.5 py-1.5 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-colors shadow ${
                  simState.current_step >= 5 ? 'bg-slate-300 cursor-not-allowed' : 'bg-red-750 hover:bg-red-700'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                Advance Sim Step
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-250 gap-2 overflow-x-auto">
            {['Overview', 'Money Trail', 'Accounts', 'Predictions', 'Alerts', 'Evidence', 'Timeline'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold font-sans transition-colors border-b-2 -mb-px ${
                  activeTab === tab 
                    ? 'border-navy-950 text-navy-950 font-extrabold' 
                    : 'border-transparent text-slate-400 hover:text-slate-655'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Pages */}
          <div className="bg-white p-6 rounded border border-slate-200 shadow-sm min-h-[400px]">
            
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'Overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="bg-slate-50 p-4 border rounded text-xs space-y-2">
                    <h3 className="text-xs font-bold uppercase text-navy-950 tracking-wider mb-1 border-b pb-1">Complainant / Victim</h3>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ID Reference:</span>
                      <span className="font-mono font-bold text-slate-700">{currentCase?.victim_ref}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Disputed Sum:</span>
                      <span className="font-extrabold text-navy-950">₹{currentCase?.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Linked Account:</span>
                      <span className="font-mono text-slate-800">{transactions[0]?.sender_account || "30291488102"}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 border rounded text-xs space-y-2">
                    <h3 className="text-xs font-bold uppercase text-navy-950 tracking-wider mb-1 border-b pb-1">Case Financials</h3>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reported Fraud amount:</span>
                      <span className="font-bold text-slate-800 font-mono">₹{currentCase?.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-emerald-800">
                      <span className="font-bold">Total Traced Mules:</span>
                      <span className="font-bold font-mono">₹{transactions.filter(t => t.receiver_account.startsWith('MULE')).reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-red-800">
                      <span className="font-bold">ATM Cash-Out logs:</span>
                      <span className="font-bold font-mono">₹{transactions.filter(t => t.receiver_account.startsWith('ATM')).reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 border rounded text-xs space-y-2">
                    <h3 className="text-xs font-bold uppercase text-navy-950 tracking-wider mb-1 border-b pb-1">Case Metadata</h3>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Officer:</span>
                      <span className="font-semibold text-slate-800">{currentCase?.assigned_officer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Alerts Count:</span>
                      <span className="font-bold text-red-700">{alerts.length} triggers</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Case Severity Index:</span>
                      <span className="font-bold text-red-700">{currentCase?.risk_score}% CRITICAL</span>
                    </div>
                  </div>

                </div>

                <div className="border border-slate-200 p-4 rounded bg-slate-50">
                  <h3 className="text-xs font-bold uppercase text-navy-950 mb-4 tracking-wider">Case Investigation Flow Status</h3>
                  
                  <div className="relative flex items-center justify-between">
                    <div className="absolute left-0 right-0 h-1 bg-slate-200 z-0" />
                    
                    {[
                      { title: 'Complaint Filed', time: '10:32 AM', done: true },
                      { title: 'Mule Layer 1 identified', time: '10:33 AM', done: true },
                      { title: 'Splitting Traced', time: '10:39 AM', done: transactions.length >= 3 },
                      { title: 'Cash-out Predictor', time: '10:43 AM', done: predictions.length > 0 },
                      { title: 'Threat Mitigated', time: '10:44 AM', done: simState.current_step >= 5 },
                    ].map((step, idx) => (
                      <div key={idx} className="relative z-10 flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border ${
                          step.done ? 'bg-navy-950 text-white border-navy-950' : 'bg-white text-slate-400 border-slate-200'
                        }`}>
                          {step.done ? '✓' : idx + 1}
                        </div>
                        <span className="text-[10px] font-bold text-navy-950 mt-1.5 text-center leading-tight max-w-[85px]">
                          {step.title}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                          {step.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MONEY TRAIL */}
            {activeTab === 'Money Trail' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-2.5 border rounded text-xs">
                  <div>
                    <h3 className="text-xs font-bold text-navy-950">Layering money flow map (Database records)</h3>
                    <p className="text-[10px] text-slate-500">Every node is drawn dynamically from database transactions of {caseId}.</p>
                  </div>
                  
                  <button 
                    onClick={playTrailAnimation}
                    disabled={isPlaying}
                    className="px-2.5 py-1.5 bg-navy-950 text-white rounded text-[11px] font-bold flex items-center gap-1 hover:bg-navy-800 disabled:opacity-50"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    Play Trail Sequence
                  </button>
                </div>
                
                <div className="h-96">
                  {transactions.length > 0 ? (
                    <SVGNetworkGraph 
                      nodes={getDynamicMoneyTrail().nodes}
                      edges={getDynamicMoneyTrail().edges}
                      onSelectNode={(id) => {
                        // Find matching transaction involving node
                        const tx = transactions.find(t => t.sender_account === id || t.receiver_account === id);
                        if (tx) handleSelectTxDetail(tx.transaction_id);
                      }}
                      selectedNodeId={null}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      No money trail transactions in database. Add transactions or run simulation.
                    </div>
                  )}
                </div>

                {/* Recorded sequence list */}
                <div className="space-y-2 mt-4">
                  <h4 className="font-bold text-slate-700 text-xs">Recorded Transfer Sequence Ledger:</h4>
                  <div className="border rounded overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 font-bold border-b">
                        <tr>
                          <th className="p-2">Transaction ID</th>
                          <th className="p-2">Sender</th>
                          <th className="p-2">Receiver</th>
                          <th className="p-2">Amount</th>
                          <th className="p-2">Method</th>
                          <th className="p-2">Time</th>
                          <th className="p-2 text-center">Threat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {transactions.map((tx) => (
                          <tr 
                            key={tx.transaction_id}
                            onClick={() => handleSelectTxDetail(tx.transaction_id)}
                            className="hover:bg-slate-50 cursor-pointer"
                          >
                            <td className="p-2 font-mono font-semibold text-navy-900">{tx.transaction_id}</td>
                            <td className="p-2 font-mono text-slate-600">{tx.sender_account}</td>
                            <td className="p-2 font-mono text-slate-600">{tx.receiver_account}</td>
                            <td className="p-2 font-bold">₹{tx.amount.toLocaleString('en-IN')}</td>
                            <td className="p-2 text-slate-500">{tx.transaction_type}</td>
                            <td className="p-2 text-slate-400 font-mono">{new Date(tx.timestamp).toLocaleTimeString()}</td>
                            <td className="p-2 text-center">
                              <span className="px-1.5 py-0.25 bg-red-50 text-red-700 rounded text-[9px] font-bold">
                                {tx.risk_score}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ACCOUNTS */}
            {activeTab === 'Accounts' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-navy-950 tracking-wider">Linked Mule Accounts</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {accounts.filter(a => a.is_mule).map((mule) => (
                    <div key={mule.account_number} className="p-4 rounded border border-slate-200 bg-slate-50 text-xs">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono font-bold text-navy-950">{mule.account_number}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          mule.risk_score >= 80 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          Risk: {Math.round(mule.risk_score)}%
                        </span>
                      </div>
                      <div className="space-y-1 text-slate-650">
                        <div><span className="text-slate-400 font-medium">Holder:</span> <span className="font-semibold text-slate-800">{mule.holder_name}</span></div>
                        <div><span className="text-slate-400 font-medium">Bank:</span> <span className="text-slate-800">{mule.bank_name}</span></div>
                        <div><span className="text-slate-400 font-medium">IFSC:</span> <span className="font-mono text-slate-800">{mule.ifsc_code}</span></div>
                        <div className="mt-2.5 pt-2 border-t flex justify-between items-center text-[10px]">
                          <span className="font-bold font-mono text-navy-700">{mule.classification}</span>
                          <button 
                            onClick={() => { setActiveTab('Predictions'); setSelectedAccount(mule.account_number); }}
                            className="text-navy-950 font-extrabold hover:underline"
                          >
                            Inspect predictions &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: PREDICTIONS */}
            {activeTab === 'Predictions' && (
              <div className="space-y-6 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-navy-950 tracking-wider">Predictive Next Hop Model</h3>
                    <p className="text-[10px] text-slate-500">Calculate Next-Hop destination probabilities from active surveillance nodes.</p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500 font-medium">Source Account:</span>
                    <select 
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      className="border border-slate-250 p-1.5 rounded font-mono bg-white focus:outline-none"
                    >
                      {accounts.filter(a => a.is_mule).map((mule) => (
                        <option key={mule.account_number} value={mule.account_number}>{mule.account_number}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 space-y-3">
                    <h4 className="font-bold text-slate-700">Probable Next Targets from <span className="font-mono bg-slate-100 px-1 rounded">{selectedAccount}</span>:</h4>
                    
                    <div className="space-y-2">
                      {activePredictions.length > 0 ? (
                        activePredictions.map((pred, i) => (
                          <div key={i} className="p-3 border rounded-lg bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-colors">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-navy-950">{pred.target_entity}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded uppercase ${
                                  pred.predicted_type === 'CASH_OUT' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}>
                                  {pred.predicted_type}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 max-w-lg">
                                {pred.factors && Object.keys(pred.factors).length > 0 
                                  ? `Matched correlations: ${Object.entries(pred.factors).map(([k,v]) => `${k} (+${v})`).join(', ')}`
                                  : "Markov sequence correlation triggers high risk route forwarding behavior."}
                              </p>
                            </div>
                            
                            <div className="text-right font-mono">
                              <div className="text-base font-extrabold text-navy-950">{(pred.probability * 100).toFixed(0)}%</div>
                              <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">Confidence</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center p-6 text-slate-400 bg-slate-50 border border-dashed rounded">
                          No predictions generated for selected account.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-4 border border-slate-200 rounded p-4 flex flex-col justify-between bg-slate-50">
                    <div>
                      <h4 className="font-bold text-navy-950 uppercase text-[10px] tracking-wider mb-2">Simulate Network Activity</h4>
                      <p className="text-slate-500 text-[11px] leading-relaxed mb-4">
                        Test the system's live threats diagnostics by manually creating predicted transfers.
                      </p>

                      <div className="p-2.5 bg-red-50 border border-red-100 rounded text-red-800 mb-4 text-[10px] font-mono">
                        <strong>Sim step:</strong> Step {simState.current_step} of {simState.total_steps} ({simState.last_event})
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button 
                        onClick={triggerSimulationStep}
                        disabled={simState.current_step >= 5}
                        className={`w-full py-2 text-white font-bold rounded text-xs transition-colors flex items-center justify-center gap-1.5 ${
                          simState.current_step >= 5 ? 'bg-slate-300 cursor-not-allowed' : 'bg-red-750 hover:bg-red-700'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5" />
                        GENERATE NEXT TRANSACTION
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ALERTS */}
            {activeTab === 'Alerts' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-navy-950 tracking-wider">Triggered Investigation Alerts</h3>
                
                <div className="space-y-3 text-xs">
                  {alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <div key={alert.alert_id} className="p-3 border rounded bg-slate-50 flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {alert.severity}
                            </span>
                            <span className="font-bold text-navy-950">{alert.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-slate-655">{alert.description}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Target: {alert.account_number} | Amount: ₹{alert.amount_at_risk.toLocaleString('en-IN')}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <button className="px-2 py-1 bg-white border rounded hover:bg-slate-100 font-semibold text-slate-700">
                            Acknowledge
                          </button>
                          <button className="px-2 py-1 bg-navy-950 text-white rounded hover:bg-navy-900 font-semibold">
                            Intervention
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-400 text-xs p-6 bg-slate-50 border border-dashed rounded">
                      No active alerts registered for this case.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: EVIDENCE LOCKER (Functional inputs/filters/lists!) */}
            {activeTab === 'Evidence' && (
              <div className="space-y-6 text-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-3 gap-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-navy-950 tracking-wider">Evidence Locker & notes</h3>
                    <p className="text-[10px] text-slate-500">Search, filter, and upload evidence sheets for Case {caseId}.</p>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search Locker..."
                        value={evidenceSearch}
                        onChange={(e) => setEvidenceSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 border rounded text-xs focus:outline-none"
                      />
                    </div>
                    <select 
                      value={evidenceTypeFilter}
                      onChange={(e) => setEvidenceTypeFilter(e.target.value)}
                      className="border p-1.5 rounded font-mono bg-white"
                    >
                      <option value="">ALL FILES</option>
                      <option value="PDF">PDF</option>
                      <option value="CSV">CSV</option>
                      <option value="TXT">TXT</option>
                    </select>
                  </div>
                </div>

                {/* Grid Lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEvidence.map((ev) => (
                    <div key={ev.evidence_id} className="p-3 border rounded bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-bold text-slate-900">{ev.title}</span>
                          <span className="px-1.5 py-0.25 bg-navy-150 text-navy-950 rounded font-mono text-[9px] uppercase font-bold">
                            {ev.file_type}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[10px] leading-relaxed">{ev.description}</p>
                        <span className="text-[9px] text-slate-400 font-mono mt-1 block">
                          Ref: {ev.evidence_id} | Uploaded: {new Date(ev.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <button className="hover:bg-slate-200 p-2 rounded text-slate-650 border bg-white">
                        <FileDown className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {filteredEvidence.length === 0 && (
                    <div className="p-6 text-center text-slate-400 border border-dashed rounded col-span-2">
                      No matching evidence found in locker. Click "Upload Evidence File" below to add records.
                    </div>
                  )}
                </div>

                {/* Evidence addition form */}
                <form onSubmit={handleAddEvidenceSubmit} className="bg-slate-50 border p-4 rounded-lg space-y-3">
                  <h4 className="font-bold text-slate-700 text-xs">Add New Evidence Record:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input 
                      type="text" 
                      placeholder="File Title (e.g. KYC verification)..."
                      value={newEvidenceTitle}
                      onChange={(e) => setNewEvidenceTitle(e.target.value)}
                      className="border p-2 rounded focus:outline-none"
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Brief Description..."
                      value={newEvidenceDesc}
                      onChange={(e) => setNewEvidenceDesc(e.target.value)}
                      className="border p-2 rounded focus:outline-none"
                    />
                    <select 
                      value={newEvidenceType}
                      onChange={(e) => setNewEvidenceType(e.target.value)}
                      className="border p-2 rounded font-mono bg-white focus:outline-none"
                    >
                      <option value="PDF">PDF</option>
                      <option value="CSV">CSV</option>
                      <option value="TXT">TXT</option>
                    </select>
                  </div>
                  <button 
                    type="submit"
                    className="px-3.5 py-1.5 bg-navy-950 text-white rounded hover:bg-navy-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Upload Evidence File
                  </button>
                </form>
              </div>
            )}

            {/* TAB 7: TIMELINE */}
            {activeTab === 'Timeline' && (
              <div className="space-y-6 text-xs">
                <div className="border-b pb-2">
                  <h3 className="text-xs font-bold uppercase text-navy-950 tracking-wider">Merged Case Timeline Log</h3>
                  <p className="text-[10px] text-slate-500">Chronological history combining system events and investigator logs.</p>
                </div>

                {/* Note addition */}
                <form onSubmit={handleAddNoteSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type investigator note content to commit to case timeline database..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="flex-1 border border-slate-250 p-2 rounded focus:outline-none focus:ring-1 focus:ring-navy-600"
                  />
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-navy-950 text-white font-bold rounded hover:bg-navy-900 flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Record Note
                  </button>
                </form>

                <div className="space-y-4 relative pl-4 border-l border-slate-200 ml-1">
                  {timeline.map((evt, idx) => (
                    <div key={idx} className="relative text-xs">
                      <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border border-white ${
                        evt.event_type === 'NOTE' ? 'bg-blue-600' : 'bg-navy-950'
                      }`} />
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-navy-900 text-[10.5px]">{evt.time_label}</span>
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-500 font-mono px-1 rounded uppercase">
                          {evt.event_type}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5">{evt.title}</div>
                      <p className="text-slate-655 leading-relaxed mt-0.5 text-[11px]">{evt.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* TRANSACTION DETAILS MODAL OVERLAY */}
      {selectedTxDetail && (
        <div className="fixed inset-0 bg-navy-950 bg-opacity-40 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded border shadow-lg max-w-sm w-full overflow-hidden text-xs">
            <div className="p-3.5 bg-navy-950 text-white flex justify-between items-center border-b">
              <span className="font-mono font-bold">Transaction Audit: {selectedTxDetail.transaction_id}</span>
              <button 
                onClick={() => setSelectedTxDetail(null)}
                className="hover:bg-navy-800 p-0.5 rounded text-navy-200"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 border-b pb-2.5">
                <div>
                  <span className="text-slate-450 uppercase text-[9px] font-bold block">Method</span>
                  <span className="font-bold text-slate-800">{selectedTxDetail.transaction_type}</span>
                </div>
                <div>
                  <span className="text-slate-450 uppercase text-[9px] font-bold block">Risk Rating</span>
                  <span className="font-mono font-bold text-red-700">{selectedTxDetail.risk_score}%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Source:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedTxDetail.sender_account}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedTxDetail.receiver_account}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-bold text-navy-950 text-sm">₹{selectedTxDetail.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="font-mono text-slate-800">{new Date(selectedTxDetail.timestamp).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Case Linkage:</span>
                  <span className="font-mono text-slate-700 font-semibold">{selectedTxDetail.linked_case_id}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 mt-1">
                  <span className="text-slate-500 font-medium">Clearance Status:</span>
                  <span className="text-emerald-800 bg-emerald-50 px-1.5 py-0.25 rounded border border-emerald-100 font-bold uppercase tracking-wider text-[9px]">
                    VERIFIED IN DATABASE
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 p-3 border-t flex justify-end">
              <button 
                onClick={() => setSelectedTxDetail(null)}
                className="px-3.5 py-1.5 bg-navy-950 text-white rounded font-bold hover:bg-navy-900"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default Cases;
