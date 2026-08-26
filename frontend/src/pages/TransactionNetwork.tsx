import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Eye, ShieldAlert, CheckCircle2, ChevronRight, X, 
  MapPin, Landmark, HelpCircle, ArrowRight, Share2, Filter, Info,
  TrendingUp, Activity, AlertTriangle, Landmark as BankIcon, DollarSign, Calendar, Compass, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SVGNetworkGraph } from '../components/SVGNetworkGraph';

export const TransactionNetwork: React.FC = () => {
  const { addToast } = useApp();
  
  // Cases list loaded from database
  const [casesList, setCasesList] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('CF-2026-00421');
  const [currentCase, setCurrentCase] = useState<any>(null);

  // Network dataset loaded for the selected case
  const [caseTransactions, setCaseTransactions] = useState<any[]>([]);
  const [caseAccounts, setCaseAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Graph rendering nodes & edges
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);

  // Search input & error state
  const [nodeSearch, setNodeSearch] = useState<string>('');
  const [searchError, setSearchError] = useState<string | null>(null);

  // Filters state
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>('ALL');
  const [filterAccountType, setFilterAccountType] = useState<string>('ALL');
  const [filterAmountMin, setFilterAmountMin] = useState<string>('ALL');

  // Sidebar inspection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [inspectedAccount, setInspectedAccount] = useState<any>(null);
  const [inspectedRisk, setInspectedRisk] = useState<any>(null);
  const [inspectedPrediction, setInspectedPrediction] = useState<any>(null);
  const [inspectedTxs, setInspectedTxs] = useState<any[]>([]);

  // Selected edge state (Transaction details modal)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedTxDetail, setSelectedTxDetail] = useState<any>(null);

  // Fetch all cases in database on mount
  const fetchAllCases = async () => {
    try {
      const res = await fetch('/api/cases');
      if (res.ok) {
        const data = await res.json();
        setCasesList(data);
        if (data.length > 0) {
          // If active case in context is set, use it, else default to first
          const defaultId = data[0].case_id;
          setSelectedCaseId(defaultId);
        }
      }
    } catch (err) {
      console.error("Failed to load cases list:", err);
    }
  };

  useEffect(() => {
    fetchAllCases();
  }, []);

  // Fetch transaction network dataset for selected Case ID
  const fetchCaseNetwork = useCallback(async (caseId: string) => {
    setLoading(true);
    try {
      // 1. Load current case details
      const resCase = await fetch(`/api/cases/${caseId}`);
      if (resCase.ok) {
        setCurrentCase(await resCase.json());
      }

      // 2. Load case transactions
      const resTxs = await fetch(`/api/cases/${caseId}/transactions`);
      if (resTxs.ok) {
        setCaseTransactions(await resTxs.json());
      }

      // 3. Load case accounts
      const resAccs = await fetch(`/api/cases/${caseId}/accounts`);
      if (resAccs.ok) {
        setCaseAccounts(await resAccs.json());
      }
    } catch (err) {
      console.error("Failed to fetch case network data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      fetchCaseNetwork(selectedCaseId);
      // Clear selections when shifting cases
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setSelectedTxDetail(null);
      setSearchError(null);
    }
  }, [selectedCaseId, fetchCaseNetwork]);

  // Construct money trail layout dynamically based on loaded transactions & accounts
  useEffect(() => {
    if (!caseTransactions || caseTransactions.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const nodesList: any[] = [];
    const edgesList: any[] = [];
    const uniqueIds = new Set<string>();

    caseTransactions.forEach((tx: any) => {
      if (tx.sender_account) uniqueIds.add(tx.sender_account);
      if (tx.receiver_account) uniqueIds.add(tx.receiver_account);
    });

    const nodeIdsArray = Array.from(uniqueIds);
    nodeIdsArray.forEach((nodeId) => {
      if (!nodeId) return;

      let type: 'VICTIM' | 'MULE' | 'BANK_ACCOUNT' | 'ATM' | 'MERCHANT' = 'BANK_ACCOUNT';
      let x = 200;
      let y = 150;
      let score = 5.0;

      // Match account details in case accounts list
      const accInfo = caseAccounts.find(a => a.account_number === nodeId);
      if (accInfo) {
        score = accInfo.risk_score;
        if (accInfo.is_mule) type = 'MULE';
        if (accInfo.classification === 'MERCHANT') type = 'MERCHANT';
      }

      if (typeof nodeId === 'string' && nodeId.startsWith('ATM')) {
        type = 'ATM';
        score = 95.0;
      } else if (nodeId === currentCase?.victim_ref || (typeof nodeId === 'string' && (nodeId.startsWith('30') || nodeId.includes('VIC')))) {
        type = 'VICTIM';
        score = 5.0;
      }

      // Calculate dynamic layout positions
      if (type === 'VICTIM') {
        x = 90;
        y = 220;
      } else if (type === 'ATM') {
        x = 650;
        y = 220;
      } else if (type === 'MERCHANT') {
        x = 760;
        y = 110;
      } else if (type === 'MULE') {
        const mules = nodeIdsArray.filter(n => {
          const matchingAcc = caseAccounts.find(a => a.account_number === n);
          return matchingAcc && matchingAcc.is_mule;
        });
        const idx = mules.indexOf(nodeId);
        x = 250 + (idx >= 0 ? idx : 0) * 160;
        y = 110 + ((idx >= 0 ? idx : 0) % 2) * 220;
      } else {
        x = 420;
        y = 70;
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

    caseTransactions.forEach((tx: any, idx: number) => {
      edgesList.push({
        id: tx.transaction_id,
        source: tx.sender_account,
        target: tx.receiver_account,
        amount: tx.amount,
        type: tx.transaction_type,
        riskScore: tx.risk_score
      });
    });

    // Apply filters
    let filteredNodes = [...nodesList];
    let filteredEdges = [...edgesList];

    // Filter by transaction amount
    if (filterAmountMin !== 'ALL') {
      const minVal = parseInt(filterAmountMin);
      filteredEdges = filteredEdges.filter(e => e.amount >= minVal);
      // Keep only nodes linked to filtered transactions
      const activeIds = new Set<string>();
      filteredEdges.forEach(e => {
        activeIds.add(e.source);
        activeIds.add(e.target);
      });
      filteredNodes = filteredNodes.filter(n => activeIds.has(n.id));
    }

    // Filter by node risk
    if (filterRiskLevel !== 'ALL') {
      filteredNodes = filteredNodes.filter(n => {
        if (filterRiskLevel === 'CRITICAL') return n.riskScore >= 80;
        if (filterRiskLevel === 'HIGH') return n.riskScore >= 60 && n.riskScore < 80;
        if (filterRiskLevel === 'MEDIUM') return n.riskScore >= 35 && n.riskScore < 60;
        if (filterRiskLevel === 'LOW') return n.riskScore < 35;
        return true;
      });
      const activeIds = filteredNodes.map(n => n.id);
      filteredEdges = filteredEdges.filter(e => activeIds.includes(e.source) && activeIds.includes(e.target));
    }

    // Filter by node type
    if (filterAccountType !== 'ALL') {
      filteredNodes = filteredNodes.filter(n => n.type === filterAccountType);
      const activeIds = filteredNodes.map(n => n.id);
      filteredEdges = filteredEdges.filter(e => activeIds.includes(e.source) && activeIds.includes(e.target));
    }

    // Apply Search with 1-hop expansion
    if (nodeSearch) {
      const q = nodeSearch.toLowerCase().replace(/_/g, '-').trim();
      
      // Find core match node
      const coreMatches = filteredNodes.filter(n => n.id.toLowerCase().includes(q) || n.label.toLowerCase().includes(q));
      const coreIds = coreMatches.map(n => n.id);

      if (coreIds.length > 0) {
        // Find connected edges
        const connectedEdges = filteredEdges.filter(e => coreIds.includes(e.source) || coreIds.includes(e.target));
        const neighborIds = new Set<string>();
        connectedEdges.forEach(e => {
          neighborIds.add(e.source);
          neighborIds.add(e.target);
        });

        // Retain match node + neighbor nodes
        filteredNodes = filteredNodes.filter(n => coreIds.includes(n.id) || neighborIds.has(n.id));
        filteredEdges = connectedEdges;
      }
    }

    setNodes(filteredNodes);
    setEdges(filteredEdges);
  }, [caseTransactions, caseAccounts, currentCase, filterRiskLevel, filterAccountType, filterAmountMin, nodeSearch]);

  // Click handler to load account inspect panel
  const handleSelectNode = async (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setSelectedTxDetail(null);
    
    if (nodeId.startsWith('ATM')) {
      setInspectedAccount({
        account_number: nodeId,
        holder_name: "ATM Outlet Terminal",
        bank_name: nodeId === 'ATM-Z03' ? "Dadar West" : "Bandra Reclamation",
        classification: "OUTLET",
        risk_score: nodeId === 'ATM-Z03' ? 95 : 82,
        linked_case_id: selectedCaseId
      });
      setInspectedRisk({
        risk_score: nodeId === 'ATM-Z03' ? 95 : 82,
        risk_factors: { "High volume anomaly": 40, "Transaction timing proximity": 30 }
      });
      setInspectedPrediction(null);
      setInspectedTxs(caseTransactions.filter(e => e.target === nodeId || e.receiver_account === nodeId));
      return;
    }

    try {
      const resAcc = await fetch(`/api/accounts/${nodeId}`);
      if (resAcc.ok) {
        setInspectedAccount(await resAcc.json());
      }
      const resRisk = await fetch(`/api/accounts/${nodeId}/risk`);
      if (resRisk.ok) {
        setInspectedRisk(await resRisk.json());
      }
      const resPred = await fetch(`/api/accounts/${nodeId}/prediction`);
      if (resPred.ok) {
        setInspectedPrediction(await resPred.json());
      }
      const resHist = await fetch(`/api/accounts/${nodeId}/history`);
      if (resHist.ok) {
        setInspectedTxs(await resHist.json());
      }
    } catch (err) {
      console.error("Failed to inspect account node:", err);
    }
  };

  // Click handler to load transaction audit modal overlay
  const handleSelectEdge = (edgeId: string) => {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
    const tx = caseTransactions.find(t => t.transaction_id === edgeId);
    if (tx) {
      setSelectedTxDetail(tx);
    }
  };

  const handleCloseInspect = () => {
    setSelectedNodeId(null);
    setInspectedAccount(null);
    setInspectedRisk(null);
    setInspectedPrediction(null);
    setInspectedTxs([]);
  };

  // Smart Search logic: parses query and resolves Case, Account, or Transaction links
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    if (!nodeSearch.trim()) return;

    const query = nodeSearch.trim().toUpperCase().replace(/_/g, '-');

    // 1. Check if Query matches Case ID prefix
    if (query.startsWith('CF-') || query.startsWith('CASE-')) {
      const formattedCaseId = query.startsWith('CASE-') ? query.replace('CASE-', 'CF-2026-0') : query;
      const matchedCase = casesList.find(c => c.case_id === formattedCaseId);
      if (matchedCase) {
        setSelectedCaseId(matchedCase.case_id);
        addToast("Case Found", `Switched network view to case ${matchedCase.case_id}`, "success");
        return;
      }
    }

    // 2. Check if Query matches Transaction ID
    if (query.startsWith('TXN-')) {
      try {
        const res = await fetch(`/api/transactions/${query}`);
        if (res.ok) {
          const tx = await res.json();
          if (tx.linked_case_id) {
            setSelectedCaseId(tx.linked_case_id);
            // Delay selection slightly to let case load
            setTimeout(() => {
              handleSelectEdge(tx.transaction_id);
            }, 300);
            addToast("Transaction Found", `Loading case ${tx.linked_case_id} network...`, "success");
            return;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    // 3. Check if Query matches Account ID
    try {
      const res = await fetch(`/api/accounts/${query}`);
      if (res.ok) {
        const acc = await res.json();
        if (acc.linked_case_id) {
          setSelectedCaseId(acc.linked_case_id);
          setTimeout(() => {
            handleSelectNode(acc.account_number);
          }, 300);
          addToast("Account Found", `Loading case ${acc.linked_case_id} network...`, "success");
          return;
        }
      }
    } catch (err) {
      console.error(err);
    }

    // 4. Fallback search query on database search router
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const results = await res.json();
        if (results.length > 0) {
          const first = results[0];
          if (first.type === 'CASE') {
            setSelectedCaseId(first.id);
            addToast("Case Found", `Switched network to case ${first.id}`, "success");
          } else if (first.type === 'ACCOUNT') {
            const accRes = await fetch(`/api/accounts/${first.id}`);
            if (accRes.ok) {
              const acc = await accRes.json();
              if (acc.linked_case_id) {
                setSelectedCaseId(acc.linked_case_id);
                setTimeout(() => {
                  handleSelectNode(acc.account_number);
                }, 300);
                addToast("Account Found", `Loading case ${acc.linked_case_id} network...`, "success");
              }
            }
          } else if (first.type === 'TRANSACTION') {
            const txRes = await fetch(`/api/transactions/${first.id}`);
            if (txRes.ok) {
              const tx = await txRes.json();
              if (tx.linked_case_id) {
                setSelectedCaseId(tx.linked_case_id);
                setTimeout(() => {
                  handleSelectEdge(tx.transaction_id);
                }, 300);
                addToast("Transaction Found", `Loading case ${tx.linked_case_id} network...`, "success");
              }
            }
          }
          return;
        }
      }
    } catch (err) {
      console.error(err);
    }

    // If reached here, no matching record exists
    setSearchError(`No matching case, account or transaction found for "${nodeSearch}".`);
    addToast("Not Found", "No matching record in database.", "error");
  };

  // Inspect summary volume calculations
  const totalIncoming = inspectedTxs.filter(t => t.receiver_account === selectedNodeId).reduce((sum, t) => sum + t.amount, 0);
  const totalOutgoing = inspectedTxs.filter(t => t.sender_account === selectedNodeId).reduce((sum, t) => sum + t.amount, 0);
  const totalMoved = totalIncoming + totalOutgoing;

  return (
    <div className="flex h-[calc(100vh-120px)] w-full overflow-hidden relative gap-6 text-xs">
      
      {/* LEFT GRAPH VIEWER CANVAS COLUMN */}
      <div className="flex-1 flex flex-col bg-white border rounded shadow-sm overflow-hidden p-4">
        
        {/* Header and Smart Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b pb-3 gap-3">
          <div>
            <h2 className="text-sm font-bold text-navy-950 font-sans uppercase tracking-wider">Transaction Network Explorer</h2>
            <p className="text-[10px] text-slate-500">Audit transaction hops, highlight suspicious nodes, and inspect details across cases.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Case Selection dropdown */}
            <div>
              <select 
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="border p-1.5 rounded font-mono font-bold bg-white text-navy-950 focus:outline-none"
              >
                {casesList.map(c => (
                  <option key={c.case_id} value={c.case_id}>
                    NETWORK: {c.case_id} ({c.fraud_type.substring(0, 15)}...)
                  </option>
                ))}
              </select>
            </div>

            {/* Smart Search Form */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Case, Account, Tx..."
                value={nodeSearch}
                onChange={(e) => {
                  setNodeSearch(e.target.value);
                  if (searchError) setSearchError(null);
                }}
                className="pl-8 pr-8 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-navy-600 font-mono w-56"
              />
              {nodeSearch && (
                <button 
                  type="button"
                  onClick={() => {
                    setNodeSearch('');
                    setSearchError(null);
                  }}
                  className="absolute right-2 top-2.5 text-slate-450 hover:text-slate-650"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Filters Row */}
        <div className="bg-slate-50 border-b p-2.5 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-bold text-slate-600">
          <div>
            <label className="block text-[8.5px] text-slate-400 uppercase mb-0.5 font-sans">Risk Threshold</label>
            <select 
              value={filterRiskLevel}
              onChange={(e) => setFilterRiskLevel(e.target.value)}
              className="w-full border p-1 rounded bg-white font-sans focus:outline-none text-[10px]"
            >
              <option value="ALL">ALL RISK RATINGS</option>
              <option value="CRITICAL">CRITICAL (&gt;=80%)</option>
              <option value="HIGH">HIGH (60%-79%)</option>
              <option value="MEDIUM">MEDIUM (35%-59%)</option>
              <option value="LOW">LOW (&lt;35%)</option>
            </select>
          </div>

          <div>
            <label className="block text-[8.5px] text-slate-400 uppercase mb-0.5 font-sans">Entity Type</label>
            <select 
              value={filterAccountType}
              onChange={(e) => setFilterAccountType(e.target.value)}
              className="w-full border p-1 rounded bg-white font-sans focus:outline-none text-[10px]"
            >
              <option value="ALL">ALL ACCOUNT TYPES</option>
              <option value="VICTIM">VICTIMS</option>
              <option value="MULE">MULE ACCOUNTS</option>
              <option value="ATM">ATM TERMINALS</option>
              <option value="MERCHANT">MERCHANTS</option>
              <option value="BANK_ACCOUNT">STANDARD ACCOUNTS</option>
            </select>
          </div>

          <div>
            <label className="block text-[8.5px] text-slate-400 uppercase mb-0.5 font-sans">Min Amount</label>
            <select 
              value={filterAmountMin}
              onChange={(e) => setFilterAmountMin(e.target.value)}
              className="w-full border p-1 rounded bg-white font-sans focus:outline-none text-[10px]"
            >
              <option value="ALL">ALL AMOUNTS</option>
              <option value="10000">₹10,000 & ABOVE</option>
              <option value="50000">₹50,000 & ABOVE</option>
            </select>
          </div>

          <div className="flex items-end">
            <button 
              type="button"
              onClick={() => {
                setFilterRiskLevel('ALL');
                setFilterAccountType('ALL');
                setFilterAmountMin('ALL');
                setNodeSearch('');
                setSearchError(null);
              }}
              className="w-full py-1.5 bg-slate-200 hover:bg-slate-250 border rounded text-[9.5px] uppercase font-bold text-slate-700 text-center transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Error message viewport */}
        {searchError && (
          <div className="bg-red-50 text-red-800 p-2 text-[10.5px] border border-red-150 rounded mt-2 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {/* SVG Graph Canvas wrapper */}
        <div className="flex-1 min-h-[300px] relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 bg-opacity-70 z-50">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-7 h-7 text-navy-950 animate-spin" />
                <span className="font-bold text-slate-600">Retrieving case network...</span>
              </div>
            </div>
          ) : nodes.length > 0 ? (
            <SVGNetworkGraph 
              nodes={nodes}
              edges={edges}
              onSelectNode={handleSelectNode}
              selectedNodeId={selectedNodeId}
              onSelectEdge={handleSelectEdge}
              selectedEdgeId={selectedEdgeId}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 border border-dashed rounded m-2">
              <Share2 className="w-12 h-12 mb-3 text-slate-300" />
              <h3 className="font-bold text-slate-750">No network data matching parameters</h3>
              <p className="text-[10px] text-slate-500 mt-1 max-w-sm text-center">
                Clear filters or enter a case ID, account number or transaction reference in the search field above to load a network.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT INSIDER SIDE PANEL (Account details) */}
      {selectedNodeId && inspectedAccount && (
        <aside className="w-80 bg-white border border-slate-200 rounded shadow-sm flex flex-col shrink-0 overflow-y-auto">
          {/* Header */}
          <div className="p-3 bg-navy-950 text-white flex justify-between items-center border-b">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-navy-450 block font-mono">Entity Inspection</span>
              <span className="font-mono font-bold">{inspectedAccount.account_number}</span>
            </div>
            <button onClick={handleCloseInspect} className="hover:bg-navy-800 p-0.5 rounded text-navy-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-5">
            
            {/* 1. Account Summary */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b pb-1 flex items-center gap-1">
                <BankIcon className="w-3.5 h-3.5 text-slate-500" />
                Account Summary
              </h3>
              <div className="space-y-1.5 font-sans text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Holder:</span>
                  <span className="font-semibold text-slate-800">{inspectedAccount.holder_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Institution:</span>
                  <span className="font-semibold text-slate-750">{inspectedAccount.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">IFSC Code:</span>
                  <span className="font-mono font-semibold text-slate-700">{inspectedAccount.ifsc_code || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Classification:</span>
                  <span className={`font-extrabold uppercase text-[9px] border px-1.5 py-0.25 rounded ${
                    inspectedAccount.is_mule || inspectedAccount.classification === 'MULE' || inspectedAccount.risk_score >= 70
                      ? 'bg-red-50 text-red-700 border-red-100' 
                      : 'bg-green-50 text-green-700 border-green-100'
                  }`}>
                    {inspectedAccount.is_mule ? "MULE ACCOUNT" : inspectedAccount.classification}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Linked Case:</span>
                  <span className="font-mono font-bold text-navy-950">{inspectedAccount.linked_case_id || selectedCaseId}</span>
                </div>
              </div>
            </div>

            {/* 2. Ledger Volume Metrics */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b pb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                Volume Metrics
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="bg-slate-50 p-2 border rounded text-[10px]">
                  <span className="text-[8px] text-slate-400 uppercase block font-semibold">Incoming Txs</span>
                  <span className="font-bold text-emerald-800">{inspectedTxs.filter(t => t.receiver_account === selectedNodeId).length} items</span>
                  <span className="block font-bold text-[10.5px] text-slate-800 mt-0.5">₹{totalIncoming.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-slate-50 p-2 border rounded text-[10px]">
                  <span className="text-[8px] text-slate-400 uppercase block font-semibold">Outgoing Txs</span>
                  <span className="font-bold text-red-800">{inspectedTxs.filter(t => t.sender_account === selectedNodeId).length} items</span>
                  <span className="block font-bold text-[10.5px] text-slate-800 mt-0.5">₹{totalOutgoing.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="bg-navy-950 text-white p-2 rounded text-center font-mono">
                <span className="text-[8px] text-navy-300 uppercase block font-semibold">Total Velocity Volume</span>
                <span className="text-xs font-extrabold">₹{totalMoved.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* 3. Explainable Risk Factors */}
            {inspectedRisk && (
              <div className="space-y-2">
                <h3 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b pb-1 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                  Risk Profile
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-extrabold text-navy-950 font-mono">{int(inspectedRisk.risk_score) || inspectedRisk.risk_score}%</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Threat Rating</span>
                </div>
                
                <div className="space-y-1 font-mono text-[10.5px]">
                  {Object.entries(inspectedRisk.risk_factors || {}).map(([factor, pt]) => (
                    <div key={factor} className="flex justify-between p-1 bg-slate-50 rounded">
                      <span className="text-slate-650 truncate max-w-[190px]">{factor}</span>
                      <span className="font-bold text-red-700">+{String(pt)}</span>
                    </div>
                  ))}
                  {Object.keys(inspectedRisk.risk_factors || {}).length === 0 && (
                    <p className="text-slate-405 italic p-1">No anomalous factors flagged.</p>
                  )}
                </div>
              </div>
            )}

            {/* 4. Next Movement Prediction */}
            {inspectedPrediction && inspectedPrediction.predictions && inspectedPrediction.predictions.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b pb-1 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-slate-500" />
                  Predicted Next Hop
                </h3>
                <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-900">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-950">{inspectedPrediction.predictions[0].target_entity}</span>
                    <span className="font-bold font-mono">{(inspectedPrediction.predictions[0].probability * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-[10px] text-blue-800 mt-1 leading-relaxed">{inspectedPrediction.predictions[0].explanation}</p>
                </div>
              </div>
            )}

            {/* 5. Transaction Audit */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b pb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Ledger Logs
              </h3>
              
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {inspectedTxs.length > 0 ? (
                  inspectedTxs.map((tx) => {
                    const isOutgoing = tx.sender_account === selectedNodeId;
                    return (
                      <div key={tx.id || tx.transaction_id} className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between items-center text-[10px]">
                        <div>
                          <span className="font-mono font-bold text-slate-800 block">
                            {isOutgoing ? `To: ${tx.receiver_account}` : `From: ${tx.sender_account}`}
                          </span>
                          <span className="text-[8px] text-slate-400 bg-slate-200 font-mono px-1 rounded uppercase">
                            {tx.transaction_type}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${isOutgoing ? 'text-red-700 font-mono' : 'text-emerald-700 font-mono'}`}>
                            {isOutgoing ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                          </div>
                          <span className="text-[8px] text-slate-450 font-mono block font-sans">
                            {tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-450 p-2 text-center italic">No transactions found.</p>
                )}
              </div>
            </div>

          </div>
        </aside>
      )}

      {/* TRANSACTION DETAILS MODAL OVERLAY */}
      {selectedTxDetail && (
        <div className="fixed inset-0 bg-navy-950 bg-opacity-40 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded border shadow-lg max-w-sm w-full overflow-hidden text-xs">
            <div className="p-3 bg-navy-950 text-white flex justify-between items-center border-b">
              <span className="font-mono font-bold">Transaction Audit: {selectedTxDetail.transaction_id}</span>
              <button 
                onClick={() => {
                  setSelectedTxDetail(null);
                  setSelectedEdgeId(null);
                }}
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
                  <span className="font-mono font-bold text-red-700">{selectedTxDetail.risk_score || selectedTxDetail.riskScore}%</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px]">
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
                  <span className="font-mono text-slate-800">
                    {selectedTxDetail.timestamp ? new Date(selectedTxDetail.timestamp).toLocaleString('en-IN') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Case Linkage:</span>
                  <span className="font-mono text-slate-700 font-semibold">{selectedTxDetail.linked_case_id || selectedCaseId}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 mt-1">
                  <span className="text-slate-500 font-medium font-sans">Clearance Status:</span>
                  <span className="text-emerald-800 bg-emerald-50 px-1.5 py-0.25 rounded border border-emerald-100 font-bold uppercase tracking-wider text-[9px]">
                    VERIFIED IN DB
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 p-3 border-t flex justify-end">
              <button 
                onClick={() => {
                  setSelectedTxDetail(null);
                  setSelectedEdgeId(null);
                }}
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

function int(val: any) {
  return typeof val === 'number' ? Math.round(val) : parseInt(val);
}

export default TransactionNetwork;
