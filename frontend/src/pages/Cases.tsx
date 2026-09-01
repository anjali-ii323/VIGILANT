import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FolderGit2, Search, Filter, Play, ArrowRight, User, 
  Landmark, FileText, CheckCircle2, AlertTriangle, Clock, MapPin, 
  Plus, Trash2, Lock, Zap, ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SVGNetworkGraph } from '../components/SVGNetworkGraph';
import { LeafletMap } from '../components/LeafletMap';

export const Cases: React.FC = () => {
  const { caseId: paramCaseId } = useParams<{ caseId?: string }>();
  const navigate = useNavigate();
  const { 
    cases, 
    activeCaseId, 
    setActiveCaseId, 
    currentCase, 
    transactions, 
    accounts, 
    predictions, 
    timeline, 
    evidence, 
    notes, 
    alerts, 
    addNote, 
    deleteNote, 
    addEvidence, 
    deleteEvidence, 
    createIntervention,
    toggleWatchlist,
    triggerSimulationStep,
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'summary' | 'trail' | 'accounts' | 'predictions' | 'cashout' | 'alerts' | 'evidence' | 'timeline'>('summary');
  
  // Search & Filter State for Case List
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [fraudTypeFilter, setFraudTypeFilter] = useState('ALL');

  // Freeze Modal State
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [freezeAccount, setFreezeAccount] = useState('');
  const [freezeTarget, setFreezeTarget] = useState('');
  const [freezeReason, setFreezeReason] = useState('Rapid fund dissipation following unauthorized electronic transfer.');

  // Note Input State
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('INTELLIGENCE');

  // Evidence Input State
  const [evTitle, setEvTitle] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evType, setEvType] = useState('PDF');
  const [showEvForm, setShowEvForm] = useState(false);

  // Selected Node / Edge State for Graph
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Transaction Replay Step State
  const [replayStep, setReplayStep] = useState<number>(0);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);

  // Synchronize URL Param
  useEffect(() => {
    if (paramCaseId) {
      const cleanId = paramCaseId.trim().toUpperCase().replace(/_/g, '-');
      if (cleanId !== activeCaseId) {
        setActiveCaseId(cleanId);
      }
    }
  }, [paramCaseId, activeCaseId, setActiveCaseId]);

  const activeCaseObj = currentCase?.case || cases.find(c => c.case_id === activeCaseId) || cases[0];
  const victimObj = currentCase?.victim;

  // Filter Cases
  const filteredCases = cases.filter(c => {
    const matchesSearch = !searchQuery || 
      c.case_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.fraud_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.victim_ref.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || 
      (riskFilter === 'CRITICAL' && c.risk_score >= 80) ||
      (riskFilter === 'HIGH' && c.risk_score >= 60 && c.risk_score < 80) ||
      (riskFilter === 'MEDIUM' && c.risk_score < 60);
    const matchesFraud = fraudTypeFilter === 'ALL' || c.fraud_type.includes(fraudTypeFilter);
    return matchesSearch && matchesRisk && matchesFraud;
  });

  // Construct Dynamic Graph Nodes and Edges for Active Case
  const graphNodes = React.useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    const uniqueIds = new Set<string>();
    transactions.forEach(t => {
      if (t.sender_account) uniqueIds.add(t.sender_account);
      if (t.receiver_account) uniqueIds.add(t.receiver_account);
    });

    const list = Array.from(uniqueIds);
    return list.map((nodeId) => {
      const acc = accounts.find(a => a.account_number === nodeId);
      let type: 'VICTIM' | 'MULE' | 'ATM' | 'BANK_ACCOUNT' | 'MERCHANT' = 'BANK_ACCOUNT';
      let riskScore = 5.0;
      let holderName = nodeId;
      let bankName = "Banking Node";

      if (acc) {
        riskScore = acc.risk_score;
        holderName = acc.holder_name;
        bankName = acc.bank_name;
        if (acc.is_mule) type = 'MULE';
        else if (acc.classification === 'MERCHANT') type = 'MERCHANT';
      }

      if (nodeId.startsWith('ATM')) {
        type = 'ATM';
        riskScore = 95.0;
        holderName = "ATM Terminal";
      } else if (nodeId === activeCaseObj?.victim_ref || nodeId.startsWith('30') || nodeId.startsWith('VIC')) {
        type = 'VICTIM';
        riskScore = 5.0;
        holderName = victimObj?.name || "Victim Account";
      }

      let x = 80, y = 180;
      if (type === 'VICTIM') {
        x = 80; y = 180;
      } else if (type === 'ATM') {
        x = 580; y = 180;
      } else if (type === 'MERCHANT') {
        x = 580; y = 80;
      } else if (type === 'MULE') {
        const muleIdx = list.indexOf(nodeId);
        x = 220 + (muleIdx > 0 ? (muleIdx - 1) * 150 : 0);
        y = 90 + (muleIdx % 2) * 180;
      } else {
        x = 340; y = 70;
      }

      return {
        id: nodeId,
        label: `${holderName} (${nodeId})`,
        type,
        riskScore,
        holder_name: holderName,
        bank_name: bankName,
        x,
        y
      };
    });
  }, [transactions, accounts, activeCaseObj, victimObj]);

  const graphEdges = React.useMemo(() => {
    if (!transactions) return [];
    const visibleTxs = isReplaying ? transactions.slice(0, replayStep) : transactions;
    return visibleTxs.map(t => ({
      id: t.transaction_id,
      source: t.sender_account,
      target: t.receiver_account,
      amount: t.amount,
      type: t.transaction_type,
      riskScore: t.risk_score,
      timestamp: t.timestamp
    }));
  }, [transactions, isReplaying, replayStep]);

  // Play Replay
  const handlePlayReplay = () => {
    setIsReplaying(true);
    setReplayStep(1);
    addToast("Transaction Replay Active", "Sequentially stepping through layering transactions...", "info");

    const totalSteps = transactions.length;
    let step = 1;
    const interval = setInterval(() => {
      step++;
      if (step <= totalSteps) {
        setReplayStep(step);
      } else {
        clearInterval(interval);
        setTimeout(() => setIsReplaying(false), 2000);
      }
    }, 1100);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    await addNote(noteContent.trim(), noteCategory);
    setNoteContent('');
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle.trim()) return;
    await addEvidence(evTitle.trim(), evDesc.trim(), evType);
    setEvTitle('');
    setEvDesc('');
    setShowEvForm(false);
  };

  const handleExecuteFreeze = async () => {
    if (!freezeAccount) {
      addToast("Validation Error", "Select a target account to freeze.", "warning");
      return;
    }
    await createIntervention(freezeAccount, freezeTarget || "Canara Bank / NPCI Gateway", "FREEZE_ACCOUNT", freezeReason);
    setIsFreezeModalOpen(false);
  };

  const inspectedAccObj = accounts.find(a => a.account_number === selectedNodeId);

  return (
    <div className="space-y-10 animate-fade-in text-text-primary font-sans pb-16">
      
      {/* 1. CASE WORKSPACE HEADER */}
      <section className="space-y-4 border-b border-border-subtle pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-[0.15em]">
                INVESTIGATION WORKSPACE
              </span>
              <span className="text-border-strong">&middot;</span>
              <span className="text-[10px] font-mono text-steel-400 uppercase tracking-wider">
                {activeCaseObj?.fraud_type}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-light text-text-primary font-sans flex items-center gap-3">
              <span className="font-mono font-semibold text-white">{activeCaseObj?.case_id}</span>
              <span className="text-border-strong">&middot;</span>
              <span className="text-base text-text-secondary">Cyber Fraud Investigation</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const firstMule = accounts.find(a => a.is_mule);
                if (firstMule) {
                  setFreezeAccount(firstMule.account_number);
                  setFreezeTarget(firstMule.bank_name);
                }
                setIsFreezeModalOpen(true);
              }}
              className="px-4 py-2 bg-threat-critical/90 hover:bg-threat-critical text-white font-medium text-xs rounded transition-colors flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Freeze Account</span>
            </button>
          </div>
        </div>

        {/* Horizontal Key Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2 font-mono text-xs">
          <div>
            <span className="text-[9.5px] text-text-muted uppercase block mb-0.5">STATUS</span>
            <span className={`font-semibold ${activeCaseObj?.current_status === 'RESOLVED' ? 'text-emerald-400' : 'text-threat-critical'}`}>
              {activeCaseObj?.current_status}
            </span>
          </div>

          <div>
            <span className="text-[9.5px] text-text-muted uppercase block mb-0.5">THREAT RATING</span>
            <span className="font-semibold text-threat-critical">
              {Math.round(activeCaseObj?.risk_score || 85)}% CRITICAL
            </span>
          </div>

          <div>
            <span className="text-[9.5px] text-text-muted uppercase block mb-0.5">DISPUTED VOLUME</span>
            <span className="font-semibold text-text-primary text-sm">
              ₹{activeCaseObj?.amount.toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <span className="text-[9.5px] text-text-muted uppercase block mb-0.5">ASSIGNED OFFICER</span>
            <span className="text-text-secondary font-sans text-xs">
              {activeCaseObj?.assigned_officer}
            </span>
          </div>
        </div>
      </section>

      {/* 2. 8 EDITORIAL DIVIDER TABS */}
      <section className="space-y-6">
        
        {/* Tab Navigation */}
        <div className="flex items-center border-b border-border-subtle gap-2 overflow-x-auto text-xs font-mono">
          {[
            { id: 'summary', label: 'CASE SUMMARY' },
            { id: 'trail', label: `MONEY TRAIL (${transactions.length})` },
            { id: 'accounts', label: `ACCOUNTS (${accounts.length})` },
            { id: 'predictions', label: `PREDICTION (${predictions.length})` },
            { id: 'cashout', label: 'CASH-OUT RISK' },
            { id: 'alerts', label: `ALERTS (${alerts.length})` },
            { id: 'evidence', label: `EVIDENCE (${evidence.length})` },
            { id: 'timeline', label: `TIMELINE (${timeline.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 px-1 font-medium tracking-wider transition-colors border-b-2 whitespace-nowrap text-[11px] ${
                activeTab === tab.id
                  ? 'border-steel-400 text-text-primary'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: CASE SUMMARY */}
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs font-sans">
            
            {/* Left Complainant Profile (6 cols) */}
            <div className="lg:col-span-6 bg-canvas-900 border border-border-subtle rounded p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <span className="font-semibold text-xs text-text-primary uppercase tracking-wider flex items-center gap-2 font-mono">
                  <User className="w-3.5 h-3.5 text-steel-400" />
                  Complainant & Origin Profile
                </span>
                <span className="text-[8.5px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  VERIFIED CITIZEN
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Victim Name:</span>
                  <span className="font-medium text-text-primary">{victimObj?.name || 'Ramesh Chandra'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Origin Bank & Account:</span>
                  <span className="font-mono text-text-primary">{victimObj?.bank_name} &middot; {victimObj?.account_number}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Disputed Loss:</span>
                  <span className="font-mono font-semibold text-steel-400">₹{activeCaseObj?.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Report Timestamp:</span>
                  <span className="font-mono text-text-secondary">{victimObj?.report_timestamp ? new Date(victimObj.report_timestamp).toLocaleString('en-IN') : '10:32 AM IST'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-muted">City Jurisdiction:</span>
                  <span className="text-text-secondary">{victimObj?.city || 'Mumbai, Maharashtra'}</span>
                </div>
              </div>

              <div className="p-3 bg-canvas-950 border border-border-subtle rounded text-xs text-text-secondary leading-relaxed space-y-1">
                <span className="font-semibold text-text-primary font-mono text-[9.5px] uppercase block">Modus Operandi Summary</span>
                <p>
                  Victim received fraudulent communication regarding pending utility billing. Authorized one-time payment which was immediately routed into Canara Bank mule layer and structure-split across secondary accounts.
                </p>
              </div>
            </div>

            {/* Right Layering Summary (6 cols) */}
            <div className="lg:col-span-6 bg-canvas-900 border border-border-subtle rounded p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <span className="font-semibold text-xs text-text-primary uppercase tracking-wider flex items-center gap-2 font-mono">
                  <ShieldAlert className="w-3.5 h-3.5 text-threat-critical" />
                  Layering Chain Key Indicators
                </span>
                <span className="text-[8.5px] font-mono text-steel-400 bg-steel-500/10 px-1.5 py-0.2 rounded border border-steel-500/20">
                  ML HEURISTICS
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-3 bg-canvas-950 border border-border-subtle rounded">
                  <span className="text-[9px] text-text-muted uppercase block">Layering Depth</span>
                  <span className="text-lg font-semibold text-text-primary">{transactions.length} Hops</span>
                  <span className="text-[8.5px] text-text-muted block mt-0.5">Victim &rarr; Mule &rarr; Cash-Out</span>
                </div>
                <div className="p-3 bg-canvas-950 border border-border-subtle rounded">
                  <span className="text-[9px] text-text-muted uppercase block">Mule Nodes</span>
                  <span className="text-lg font-semibold text-threat-critical">{accounts.filter(a => a.is_mule).length} Accounts</span>
                  <span className="text-[8.5px] text-text-muted block mt-0.5">Canara, PNB, Union Bank</span>
                </div>
              </div>

              <div className="p-3 bg-canvas-950 border border-border-subtle rounded space-y-1">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-semibold text-xs text-threat-critical">PRIORITY CASH-OUT TARGET</span>
                  <span className="text-[9.5px] text-threat-critical font-semibold">88% PROBABILITY</span>
                </div>
                <p className="text-xs text-text-secondary">
                  ATM Cluster 03 (Dadar West Terminal) predicted as final extraction point. Expected withdrawal window: <strong>20–40 minutes</strong>.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('trail')}
                  className="flex-1 py-2 bg-canvas-850 hover:bg-canvas-800 border border-border-subtle text-text-primary text-xs font-medium rounded transition-colors text-center"
                >
                  Inspect Money Trail DAG &rarr;
                </button>
                <button
                  onClick={() => setActiveTab('cashout')}
                  className="flex-1 py-2 bg-canvas-850 hover:bg-canvas-800 border border-border-subtle text-text-primary text-xs font-medium rounded transition-colors text-center"
                >
                  View Cash-Out Map &rarr;
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: MONEY TRAIL */}
        {activeTab === 'trail' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-canvas-900 p-3 border border-border-subtle rounded gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayReplay}
                  disabled={isReplaying}
                  className="px-3 py-1.5 bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white font-medium text-xs font-sans rounded transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3" />
                  <span>{isReplaying ? `Replaying Step ${replayStep}/${transactions.length}...` : 'Play Replay'}</span>
                </button>

                <span className="text-xs font-mono text-text-secondary">
                  {transactions.length} Total Transactions
                </span>
              </div>

              <div className="text-[10px] font-mono text-text-muted">
                Click any node to inspect KYC identity & ledger parameters.
              </div>
            </div>

            <div className="h-[380px] w-full">
              <SVGNetworkGraph
                nodes={graphNodes}
                edges={graphEdges}
                onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
                selectedNodeId={selectedNodeId}
              />
            </div>

            {/* Selected Node Drawer */}
            {selectedNodeId && inspectedAccObj && (
              <div className="p-4 bg-canvas-900 border border-border-strong rounded flex flex-col md:flex-row items-start justify-between gap-4 text-xs animate-fade-in">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-steel-400 text-sm">{inspectedAccObj.account_number}</span>
                    <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-semibold bg-threat-critical/15 text-threat-critical border border-threat-critical/30">
                      {inspectedAccObj.classification}
                    </span>
                  </div>
                  <span className="text-text-secondary block">{inspectedAccObj.holder_name} &middot; {inspectedAccObj.bank_name} ({inspectedAccObj.ifsc_code})</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleWatchlist(inspectedAccObj.account_number, "Flagged during Money Trail inspection", inspectedAccObj.holder_name, inspectedAccObj.bank_name)}
                    className="px-3 py-1.5 bg-canvas-850 hover:bg-canvas-800 border border-border-subtle text-text-secondary text-xs rounded transition-colors"
                  >
                    Watchlist
                  </button>
                  <button
                    onClick={() => {
                      setFreezeAccount(inspectedAccObj.account_number);
                      setFreezeTarget(inspectedAccObj.bank_name);
                      setIsFreezeModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-threat-critical hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                  >
                    Freeze
                  </button>
                  <button onClick={() => setSelectedNodeId(null)} className="text-text-muted hover:text-text-primary text-xs ml-2">
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: ACCOUNTS KYC TABLE */}
        {activeTab === 'accounts' && (
          <div className="bg-canvas-900 border border-border-subtle rounded overflow-hidden">
            <div className="p-3 bg-canvas-950 border-b border-border-subtle flex justify-between items-center text-xs font-mono">
              <span className="font-semibold text-text-primary">Case Entities ({accounts.length})</span>
              <span className="text-text-muted">Verified KYC Extract</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-canvas-950 text-text-muted font-mono text-[9.5px] uppercase border-b border-border-subtle">
                  <tr>
                    <th className="p-3">Account Number</th>
                    <th className="p-3">Holder Name</th>
                    <th className="p-3">Bank Institution</th>
                    <th className="p-3">IFSC Code</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3">Threat Rating</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle font-mono text-xs">
                  {accounts.map((acc) => (
                    <tr key={acc.account_number} className="hover:bg-canvas-850 transition-colors">
                      <td className="p-3 font-semibold text-steel-400">{acc.account_number}</td>
                      <td className="p-3 font-sans text-text-primary">{acc.holder_name}</td>
                      <td className="p-3 text-text-secondary">{acc.bank_name}</td>
                      <td className="p-3 text-text-muted">{acc.ifsc_code}</td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-medium ${
                          acc.is_mule ? 'bg-threat-critical/15 text-threat-critical border border-threat-critical/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {acc.classification}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-text-primary">{Math.round(acc.risk_score)}%</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => toggleWatchlist(acc.account_number, "Added from Case Accounts table", acc.holder_name, acc.bank_name)}
                          className="px-2 py-0.5 bg-canvas-850 hover:bg-canvas-800 text-text-secondary hover:text-text-primary rounded text-[9.5px] border border-border-subtle"
                        >
                          Watch
                        </button>
                        <button
                          onClick={() => {
                            setFreezeAccount(acc.account_number);
                            setFreezeTarget(acc.bank_name);
                            setIsFreezeModalOpen(true);
                          }}
                          className="px-2 py-0.5 bg-threat-critical/20 hover:bg-threat-critical/30 text-threat-critical rounded text-[9.5px] border border-threat-critical/30 font-medium"
                        >
                          Freeze
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: PREDICTIONS */}
        {activeTab === 'predictions' && (
          <div className="space-y-4">
            <div className="p-4 bg-canvas-900 border border-border-subtle rounded flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-text-primary">Destination Forecasting</h3>
                <p className="text-xs text-text-secondary">Markovian Transition Sequence Heuristics Engine</p>
              </div>
              <button
                onClick={triggerSimulationStep}
                className="px-3.5 py-1.5 bg-steel-500 hover:bg-steel-600 text-white font-medium text-xs rounded transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-3 h-3" />
                <span>Simulate Next Hop</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictions.map((prd, idx) => (
                <div key={prd.prediction_id || idx} className="p-4 bg-canvas-900 border border-border-subtle rounded space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9.5px] font-mono uppercase text-steel-400 font-semibold block">{prd.predicted_type}</span>
                      <h4 className="font-semibold text-sm font-mono text-text-primary">{prd.target_entity}</h4>
                    </div>
                    <span className="text-2xl font-semibold font-mono text-steel-400">{(prd.probability * 100).toFixed(0)}%</span>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed">
                    {prd.explanation || 'Predictive sequence correlation matches known mule layering patterns.'}
                  </p>

                  <div className="p-2 bg-canvas-950 border border-border-subtle rounded text-[10px] font-mono text-text-muted flex justify-between">
                    <span>Est. Time Window:</span>
                    <span className="text-text-primary">{prd.time_window_mins} Minutes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: CASHOUT MAP */}
        {activeTab === 'cashout' && (
          <div className="h-[420px] w-full bg-canvas-900 border border-border-subtle rounded overflow-hidden">
            <LeafletMap />
          </div>
        )}

        {/* Tab 6: ALERTS */}
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {alerts.map((al) => (
              <div key={al.alert_id} className="p-4 bg-canvas-900 border border-border-subtle rounded flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-semibold ${
                      al.severity === 'CRITICAL' ? 'bg-threat-critical/20 text-threat-critical border border-threat-critical/30' : 'bg-threat-high/20 text-threat-high border border-threat-high/30'
                    }`}>
                      {al.severity}
                    </span>
                    <span className="font-semibold text-sm text-text-primary font-mono">{al.title}</span>
                  </div>
                  <p className="text-text-secondary leading-relaxed">{al.description}</p>
                  <span className="text-[9.5px] text-text-muted font-mono block">Node: {al.account_number} &middot; Disputed: ₹{al.amount_at_risk?.toLocaleString('en-IN')}</span>
                </div>

                <button
                  onClick={() => {
                    setFreezeAccount(al.account_number);
                    setIsFreezeModalOpen(true);
                  }}
                  className="px-3 py-1 bg-threat-critical hover:bg-red-700 text-white font-medium text-xs rounded transition-colors shrink-0"
                >
                  Intervene &rarr;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 7: EVIDENCE LOCKER */}
        {activeTab === 'evidence' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-canvas-900 p-3 border border-border-subtle rounded">
              <span className="font-mono text-xs font-semibold text-text-primary">Case Evidence Files ({evidence.length})</span>
              <button
                onClick={() => setShowEvForm(!showEvForm)}
                className="px-2.5 py-1 bg-canvas-850 hover:bg-canvas-800 text-text-primary border border-border-subtle rounded text-xs font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Attach Evidence</span>
              </button>
            </div>

            {showEvForm && (
              <form onSubmit={handleAddEvidence} className="p-4 bg-canvas-900 border border-border-strong rounded space-y-3 text-xs">
                <h4 className="font-semibold text-text-primary font-mono">Upload Verified Evidence Record</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9.5px] text-text-muted font-mono uppercase mb-1">Evidence Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Bank Statement Extract"
                      value={evTitle}
                      onChange={(e) => setEvTitle(e.target.value)}
                      className="w-full p-2 bg-canvas-950 border border-border-subtle rounded text-xs text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[9.5px] text-text-muted font-mono uppercase mb-1">File Format</label>
                    <select
                      value={evType}
                      onChange={(e) => setEvType(e.target.value)}
                      className="w-full p-2 bg-canvas-950 border border-border-subtle rounded text-xs text-text-primary font-mono"
                    >
                      <option value="PDF">PDF (Document Record)</option>
                      <option value="CSV">CSV (Ledger Extract)</option>
                      <option value="PNG">PNG (Screenshot)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[9.5px] text-text-muted font-mono uppercase mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Evidence extraction description..."
                    value={evDesc}
                    onChange={(e) => setEvDesc(e.target.value)}
                    className="w-full p-2 bg-canvas-950 border border-border-subtle rounded text-xs text-text-primary"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowEvForm(false)} className="px-3 py-1 text-text-muted text-xs">Cancel</button>
                  <button type="submit" className="px-3 py-1 bg-steel-500 text-white font-medium text-xs rounded">Attach Record</button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evidence.map((ev) => (
                <div key={ev.evidence_id} className="p-3 bg-canvas-900 border border-border-subtle rounded flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-steel-400" />
                      <span className="font-semibold text-xs text-text-primary">{ev.title}</span>
                    </div>
                    <p className="text-text-secondary leading-relaxed">{ev.description}</p>
                    <span className="text-[9px] font-mono text-text-muted block">
                      {ev.file_type} &middot; {ev.file_size || '1.2 MB'} &middot; {ev.hash_checksum || 'SHA256:VERIFIED'}
                    </span>
                  </div>

                  <button
                    onClick={() => deleteEvidence(ev.evidence_id)}
                    className="p-1 text-text-muted hover:text-threat-critical rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3 stroke-[1.7]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 8: TIMELINE & NOTES */}
        {activeTab === 'timeline' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs font-sans">
            
            {/* Notes (6 cols) */}
            <div className="lg:col-span-6 bg-canvas-900 border border-border-subtle rounded p-5 space-y-4">
              <h3 className="font-semibold text-xs text-text-primary font-mono uppercase tracking-wider">Investigation Notes</h3>

              <form onSubmit={handleAddNote} className="space-y-2.5">
                <textarea
                  rows={3}
                  placeholder="Record judicial observations, bank responses, or field updates..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full p-2.5 bg-canvas-950 border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-steel-500"
                />
                <div className="flex justify-between items-center">
                  <select
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value)}
                    className="p-1.5 bg-canvas-950 border border-border-subtle rounded text-[10px] font-mono text-text-secondary"
                  >
                    <option value="INTELLIGENCE">INTELLIGENCE</option>
                    <option value="EVIDENCE">EVIDENCE</option>
                    <option value="ESCALATION">ESCALATION</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-steel-500 hover:bg-steel-600 text-white font-medium text-xs rounded transition-colors"
                  >
                    Save Note
                  </button>
                </div>
              </form>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {notes.map((n) => (
                  <div key={n.note_id} className="p-3 bg-canvas-950 border border-border-subtle rounded space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[9.5px] font-mono text-text-muted">
                      <span className="font-semibold text-steel-400">{n.category || 'INTELLIGENCE'}</span>
                      <div className="flex items-center gap-2">
                        <span>{new Date(n.timestamp).toLocaleTimeString('en-IN')}</span>
                        <button onClick={() => deleteNote(n.note_id)} className="text-text-muted hover:text-threat-critical">
                          <Trash2 className="w-3 h-3 stroke-[1.7]" />
                        </button>
                      </div>
                    </div>
                    <p className="text-text-secondary leading-relaxed">{n.content}</p>
                    <span className="text-[8.5px] text-text-muted font-mono block pt-0.5">Officer: {n.officer}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Milestones (6 cols) */}
            <div className="lg:col-span-6 bg-canvas-900 border border-border-subtle rounded p-5 space-y-4">
              <h3 className="font-semibold text-xs text-text-primary font-mono uppercase tracking-wider">Incident Timeline Milestones</h3>

              <div className="space-y-3 relative border-l border-border-strong ml-2.5 pl-4 font-sans text-xs">
                {timeline.map((ev, idx) => (
                  <div key={ev.event_id || idx} className="relative space-y-0.5">
                    <div className="w-2 h-2 rounded-full bg-steel-400 absolute -left-[21px] top-1 border-2 border-canvas-900" />
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text-primary">{ev.title}</span>
                      <span className="text-[9.5px] font-mono text-text-muted">{new Date(ev.timestamp).toLocaleTimeString('en-IN')}</span>
                    </div>
                    <p className="text-text-secondary leading-relaxed text-[11px]">{ev.description}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </section>

      {/* 3. CASE REPOSITORY EXPLORER TABLE (BELOW WORKSPACE) */}
      <section className="space-y-4 pt-6 border-t border-border-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-[0.15em]">ALL ACTIVE TARGETS</span>
            <h3 className="text-base font-medium text-text-primary font-sans">Case Directory</h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search Cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-canvas-900 border border-border-subtle rounded text-xs font-mono text-text-primary focus:outline-none focus:border-steel-500 w-48"
              />
            </div>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-2.5 py-1 bg-canvas-900 border border-border-subtle rounded text-xs font-mono text-text-secondary focus:outline-none focus:border-steel-500"
            >
              <option value="ALL">ALL RISK</option>
              <option value="CRITICAL">CRITICAL (&gt;=80%)</option>
              <option value="HIGH">HIGH (60-79%)</option>
              <option value="MEDIUM">MEDIUM (&lt;60%)</option>
            </select>
          </div>
        </div>

        <div className="bg-canvas-900 border border-border-subtle rounded overflow-hidden">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-canvas-950 text-text-muted font-mono text-[9.5px] uppercase border-b border-border-subtle">
              <tr>
                <th className="p-3">Case ID</th>
                <th className="p-3">Category</th>
                <th className="p-3">Victim Ref</th>
                <th className="p-3">Disputed Loss</th>
                <th className="p-3">Threat Rating</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-mono text-xs">
              {filteredCases.map((c) => (
                <tr
                  key={c.case_id}
                  onClick={() => {
                    setActiveCaseId(c.case_id);
                    navigate(`/cases/${c.case_id}`);
                  }}
                  className={`cursor-pointer hover:bg-canvas-850 transition-colors ${
                    c.case_id === activeCaseId ? 'bg-steel-500/10' : ''
                  }`}
                >
                  <td className="p-3 font-semibold text-steel-400">{c.case_id}</td>
                  <td className="p-3 font-sans text-text-primary">{c.fraud_type}</td>
                  <td className="p-3 text-text-secondary">{c.victim_ref}</td>
                  <td className="p-3 font-semibold text-text-primary">₹{c.amount?.toLocaleString('en-IN')}</td>
                  <td className="p-3 font-semibold text-threat-critical">{Math.round(c.risk_score)}%</td>
                  <td className="p-3">
                    <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-medium ${
                      c.current_status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-threat-critical/15 text-threat-critical border border-threat-critical/20'
                    }`}>
                      {c.current_status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button className="text-steel-400 hover:text-steel-300 font-medium text-xs">
                      Open Workspace &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FREEZE MODAL */}
      {isFreezeModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-canvas-950/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="w-full max-w-md bg-canvas-900 border border-border-strong rounded p-6 text-text-primary space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-threat-critical" />
                <h3 className="font-semibold text-sm text-text-primary uppercase">Proactive Account Freeze</h3>
              </div>
              <button onClick={() => setIsFreezeModalOpen(false)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Issue an immediate cryptographic freeze lock through the simulated NPCI / Banking Gateway to prevent cash-out dissipation.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[9.5px] text-text-muted font-mono uppercase mb-1">Target Account *</label>
                <select
                  value={freezeAccount}
                  onChange={(e) => setFreezeAccount(e.target.value)}
                  className="w-full p-2 bg-canvas-950 border border-border-subtle rounded text-xs font-mono text-text-primary"
                >
                  {accounts.map(a => (
                    <option key={a.account_number} value={a.account_number}>
                      {a.account_number} ({a.holder_name} - {a.bank_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9.5px] text-text-muted font-mono uppercase mb-1">Target Entity / Bank Gateway</label>
                <input
                  type="text"
                  value={freezeTarget}
                  onChange={(e) => setFreezeTarget(e.target.value)}
                  className="w-full p-2 bg-canvas-950 border border-border-subtle rounded text-xs text-text-primary"
                />
              </div>

              <div>
                <label className="block text-[9.5px] text-text-muted font-mono uppercase mb-1">Judicial Freeze Reason *</label>
                <textarea
                  rows={2}
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  className="w-full p-2 bg-canvas-950 border border-border-subtle rounded text-xs text-text-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
              <button onClick={() => setIsFreezeModalOpen(false)} className="px-3 py-1.5 text-text-muted text-xs">
                Cancel
              </button>
              <button
                onClick={handleExecuteFreeze}
                className="px-4 py-1.5 bg-threat-critical hover:bg-red-700 text-white font-medium text-xs rounded transition-colors"
              >
                Execute Freeze & Resolve
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Cases;
