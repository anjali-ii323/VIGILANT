import React, { useState, useEffect } from 'react';
import { 
  Search, Eye, ShieldAlert, CheckCircle2, ChevronRight, X, 
  MapPin, Landmark, ArrowRight, Share2, Filter, Info,
  TrendingUp, Activity, AlertTriangle, Coins
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SVGNetworkGraph } from '../components/SVGNetworkGraph';
import { MOCK_CASES_DATA } from '../data/mockData';

export const TransactionNetwork: React.FC = () => {
  const { cases, activeCaseId, setActiveCaseId, addToast } = useApp();
  
  const [selectedCaseId, setSelectedCaseId] = useState<string>(activeCaseId || 'CF-2026-00421');
  const [caseTransactions, setCaseTransactions] = useState<any[]>(MOCK_CASES_DATA[0].transactions);
  const [caseAccounts, setCaseAccounts] = useState<any[]>(MOCK_CASES_DATA[0].accounts);
  const [loading, setLoading] = useState<boolean>(false);

  // Graph rendering lists
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);

  // Search & Filters State
  const [nodeSearch, setNodeSearch] = useState<string>('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>('ALL');
  const [filterAccountType, setFilterAccountType] = useState<string>('ALL');
  const [filterAmountMin, setFilterAmountMin] = useState<string>('ALL');

  // Sidebar Inspection State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [inspectedAccount, setInspectedAccount] = useState<any>(null);
  const [inspectedRisk, setInspectedRisk] = useState<any>(null);
  const [inspectedPrediction, setInspectedPrediction] = useState<any>(null);
  const [inspectedTxs, setInspectedTxs] = useState<any[]>([]);

  // Selected Edge State (Transaction Details Modal)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedTxDetail, setSelectedTxDetail] = useState<any>(null);

  // Fetch case network dataset
  const fetchNetworkData = async (caseId: string) => {
    setLoading(true);
    const cleanId = caseId.trim().toUpperCase().replace(/_/g, '-');
    try {
      const [resTxs, resAccs] = await Promise.all([
        fetch(`/api/cases/${cleanId}/transactions`),
        fetch(`/api/cases/${cleanId}/accounts`)
      ]);
      if (resTxs.ok && resAccs.ok) {
        const txsData = await resTxs.json();
        const accsData = await resAccs.json();
        if (txsData && txsData.length > 0) {
          setCaseTransactions(txsData);
          setCaseAccounts(accsData);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      // Fallback
    }

    // Load from MOCK_CASES_DATA
    const foundMock = MOCK_CASES_DATA.find(c => c.case_id === cleanId) || MOCK_CASES_DATA[0];
    setCaseTransactions(foundMock.transactions);
    setCaseAccounts(foundMock.accounts);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedCaseId) {
      fetchNetworkData(selectedCaseId);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setSelectedTxDetail(null);
    }
  }, [selectedCaseId]);

  // Construct Graph Nodes & Edges dynamically from dataset
  useEffect(() => {
    if (!caseTransactions || caseTransactions.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const uniqueIds = new Set<string>();
    caseTransactions.forEach(t => {
      if (t.sender_account) uniqueIds.add(t.sender_account);
      if (t.receiver_account) uniqueIds.add(t.receiver_account);
    });

    const list = Array.from(uniqueIds);
    let nodesList = list.map((nodeId) => {
      const acc = caseAccounts.find(a => a.account_number === nodeId);
      let type: 'VICTIM' | 'MULE' | 'ATM' | 'BANK_ACCOUNT' | 'MERCHANT' | 'CRYPTO_WALLET' = 'BANK_ACCOUNT';
      let riskScore = 5.0;
      let holderName = nodeId;
      let bankName = "Banking Node";

      if (acc) {
        riskScore = acc.risk_score;
        holderName = acc.holder_name;
        bankName = acc.bank_name;
        if (acc.is_mule) type = 'MULE';
        else if (acc.classification === 'MERCHANT') type = 'MERCHANT';
        else if (acc.classification === 'CRYPTO_WALLET') type = 'CRYPTO_WALLET';
      }

      if (nodeId.startsWith('ATM')) {
        type = 'ATM';
        riskScore = 95.0;
        holderName = "ATM Terminal";
      } else if (nodeId.startsWith('0x') || nodeId.startsWith('TRX') || nodeId.startsWith('USDT') || (acc && acc.classification === 'CRYPTO_WALLET')) {
        type = 'CRYPTO_WALLET';
        riskScore = 96.0;
        holderName = "Crypto Wallet (TRC-20)";
        bankName = "Blockchain Ledger";
      } else if (nodeId.startsWith('30') || nodeId.startsWith('VIC') || nodeId.startsWith('50') || nodeId.startsWith('60') || nodeId.startsWith('70') || nodeId.startsWith('80') || nodeId.startsWith('90')) {
        type = 'VICTIM';
        riskScore = 5.0;
        holderName = "Victim Account";
      }

      let x = 80, y = 180;
      if (type === 'VICTIM') {
        x = 80; y = 180;
      } else if (type === 'ATM') {
        x = 580; y = 180;
      } else if (type === 'CRYPTO_WALLET') {
        x = 580; y = 80;
      } else if (type === 'MERCHANT') {
        x = 580; y = 120;
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

    let edgesList = caseTransactions.map(t => ({
      id: t.transaction_id,
      source: t.sender_account,
      target: t.receiver_account,
      amount: t.amount,
      type: t.transaction_type,
      riskScore: t.risk_score,
      timestamp: t.timestamp
    }));

    // Filters
    if (filterAmountMin !== 'ALL') {
      const min = parseInt(filterAmountMin);
      edgesList = edgesList.filter(e => e.amount >= min);
      const activeNodeIds = new Set<string>();
      edgesList.forEach(e => {
        activeNodeIds.add(e.source);
        activeNodeIds.add(e.target);
      });
      nodesList = nodesList.filter(n => activeNodeIds.has(n.id));
    }

    if (filterRiskLevel !== 'ALL') {
      nodesList = nodesList.filter(n => {
        if (filterRiskLevel === 'CRITICAL') return n.riskScore >= 80;
        if (filterRiskLevel === 'HIGH') return n.riskScore >= 60 && n.riskScore < 80;
        if (filterRiskLevel === 'MEDIUM') return n.riskScore >= 35 && n.riskScore < 60;
        if (filterRiskLevel === 'LOW') return n.riskScore < 35;
        return true;
      });
      const validIds = nodesList.map(n => n.id);
      edgesList = edgesList.filter(e => validIds.includes(e.source) && validIds.includes(e.target));
    }

    if (filterAccountType !== 'ALL') {
      nodesList = nodesList.filter(n => n.type === filterAccountType);
      const validIds = nodesList.map(n => n.id);
      edgesList = edgesList.filter(e => validIds.includes(e.source) && validIds.includes(e.target));
    }

    // 1-Hop Search
    if (nodeSearch.trim()) {
      const q = nodeSearch.toLowerCase().replace(/_/g, '-').trim();
      const coreMatches = nodesList.filter(n => n.id.toLowerCase().includes(q) || n.label.toLowerCase().includes(q));
      const coreIds = coreMatches.map(n => n.id);

      if (coreIds.length > 0) {
        const connectedEdges = edgesList.filter(e => coreIds.includes(e.source) || coreIds.includes(e.target));
        const neighborIds = new Set<string>();
        connectedEdges.forEach(e => {
          neighborIds.add(e.source);
          neighborIds.add(e.target);
        });
        nodesList = nodesList.filter(n => coreIds.includes(n.id) || neighborIds.has(n.id));
        edgesList = connectedEdges;
      }
    }

    setNodes(nodesList);
    setEdges(edgesList);
  }, [caseTransactions, caseAccounts, filterRiskLevel, filterAccountType, filterAmountMin, nodeSearch]);

  const handleSelectNode = async (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setSelectedTxDetail(null);

    const foundAcc = caseAccounts.find(a => a.account_number === nodeId) || {
      account_number: nodeId,
      holder_name: nodeId.startsWith('ATM') ? 'ATM Terminal' : nodeId.startsWith('0x') ? 'Tether TRC-20 Wallet' : 'Entity Under Surveillance',
      bank_name: nodeId.startsWith('0x') ? 'Blockchain Ledger' : 'Banking Gateway',
      classification: nodeId.startsWith('MULE') ? 'HIGH RISK' : nodeId.startsWith('0x') ? 'CRYPTO_WALLET' : 'BENIGN',
      is_mule: nodeId.startsWith('MULE'),
      risk_score: nodeId.startsWith('MULE') || nodeId.startsWith('0x') ? 95 : 5
    };

    setInspectedAccount(foundAcc);
    setInspectedRisk({
      account_number: nodeId,
      risk_score: foundAcc.risk_score || 91,
      risk_factors: {
        "Rapid fund movement": 24,
        "Multiple unrelated senders": 19,
        "Transaction splitting": 14,
        "Unusual transaction amount": 17,
        "Short holding period": 11
      }
    });
    setInspectedTxs(caseTransactions.filter(t => t.sender_account === nodeId || t.receiver_account === nodeId));

    try {
      const [resAcc, resRisk, resHist] = await Promise.all([
        fetch(`/api/accounts/${nodeId}`),
        fetch(`/api/accounts/${nodeId}/risk`),
        fetch(`/api/accounts/${nodeId}/history`)
      ]);

      if (resAcc.ok) setInspectedAccount(await resAcc.json());
      if (resRisk.ok) setInspectedRisk(await resRisk.json());
      if (resHist.ok) setInspectedTxs(await resHist.json());
    } catch (err) {}
  };

  const handleSelectEdge = (edgeId: string) => {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
    const tx = caseTransactions.find(t => t.transaction_id === edgeId);
    if (tx) setSelectedTxDetail(tx);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    if (!nodeSearch.trim()) return;

    const q = nodeSearch.trim().toUpperCase().replace(/_/g, '-');

    if (q.startsWith('CF-') || q.startsWith('CASE-')) {
      const matchedCase = cases.find(c => c.case_id === q);
      if (matchedCase) {
        setSelectedCaseId(matchedCase.case_id);
        setActiveCaseId(matchedCase.case_id);
        addToast("Case Found", `Loaded network for ${matchedCase.case_id}`, "success");
        return;
      }
    }

    const foundAcc = caseAccounts.find(a => a.account_number.toUpperCase() === q || a.holder_name.toUpperCase().includes(q));
    if (foundAcc) {
      handleSelectNode(foundAcc.account_number);
      addToast("Account Mapped", `Located account in Case ${selectedCaseId} network.`, "success");
      return;
    }

    setSearchError(`No matching case, account or transaction found for "${nodeSearch}".`);
  };

  return (
    <div className="flex h-[calc(100vh-130px)] w-full overflow-hidden relative gap-6 text-xs font-sans text-text-primary animate-fade-in">
      
      {/* GRAPH CANVAS COLUMN */}
      <div className="flex-1 flex flex-col bg-canvas-900 border border-border-subtle rounded overflow-hidden p-4">
        
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-border-subtle pb-3 gap-3">
          <div>
            <span className="text-[9.5px] font-mono uppercase tracking-[0.15em] text-text-muted block">
              MULTI-HOP RELATIONSHIP & BLOCKCHAIN TOPOLOGY
            </span>
            <h2 className="text-base font-medium text-text-primary font-sans">
              Money Network Explorer
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Case Dropdown */}
            <select
              value={selectedCaseId}
              onChange={(e) => {
                setSelectedCaseId(e.target.value);
                setActiveCaseId(e.target.value);
              }}
              className="px-2.5 py-1.5 bg-canvas-950 border border-border-subtle rounded text-xs font-mono text-steel-400 font-semibold focus:outline-none focus:border-steel-500"
            >
              {cases.map(c => (
                <option key={c.case_id} value={c.case_id}>
                  {c.case_id} ({c.fraud_type.substring(0, 16)}...)
                </option>
              ))}
            </select>

            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search Account, Wallet, Case..."
                value={nodeSearch}
                onChange={(e) => {
                  setNodeSearch(e.target.value);
                  if (searchError) setSearchError(null);
                }}
                className="pl-8 pr-7 py-1.5 bg-canvas-950 border border-border-subtle rounded text-xs font-mono text-text-primary w-48 focus:outline-none focus:border-steel-500"
              />
              {nodeSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setNodeSearch('');
                    setSearchError(null);
                  }}
                  className="absolute right-2 top-2 text-text-muted hover:text-text-primary"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-canvas-950 border-b border-border-subtle p-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono">
          <div>
            <label className="block text-[8.5px] text-text-muted uppercase mb-0.5">Risk Threshold</label>
            <select
              value={filterRiskLevel}
              onChange={(e) => setFilterRiskLevel(e.target.value)}
              className="w-full p-1 bg-canvas-900 border border-border-subtle rounded text-text-secondary"
            >
              <option value="ALL">ALL RISK</option>
              <option value="CRITICAL">CRITICAL (&gt;=80%)</option>
              <option value="HIGH">HIGH (60%-79%)</option>
              <option value="MEDIUM">MEDIUM (35%-59%)</option>
            </select>
          </div>

          <div>
            <label className="block text-[8.5px] text-text-muted uppercase mb-0.5">Entity Type</label>
            <select
              value={filterAccountType}
              onChange={(e) => setFilterAccountType(e.target.value)}
              className="w-full p-1 bg-canvas-900 border border-border-subtle rounded text-text-secondary"
            >
              <option value="ALL">ALL TYPES</option>
              <option value="VICTIM">VICTIM ACCOUNTS</option>
              <option value="MULE">MULE ACCOUNTS</option>
              <option value="ATM">ATM TERMINALS</option>
              <option value="CRYPTO_WALLET">CRYPTO WALLETS</option>
            </select>
          </div>

          <div>
            <label className="block text-[8.5px] text-text-muted uppercase mb-0.5">Min Amount</label>
            <select
              value={filterAmountMin}
              onChange={(e) => setFilterAmountMin(e.target.value)}
              className="w-full p-1 bg-canvas-900 border border-border-subtle rounded text-text-secondary"
            >
              <option value="ALL">ALL AMOUNTS</option>
              <option value="10000">₹10,000 & ABOVE</option>
              <option value="50000">₹50,000 & ABOVE</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterRiskLevel('ALL');
                setFilterAccountType('ALL');
                setFilterAmountMin('ALL');
                setNodeSearch('');
                setSearchError(null);
              }}
              className="w-full py-1 bg-canvas-850 hover:bg-canvas-800 border border-border-subtle text-text-secondary uppercase rounded text-[9px] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {searchError && (
          <div className="bg-threat-critical/15 text-threat-critical p-2 text-xs border border-threat-critical/30 rounded mt-2 font-mono flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {/* Graph Viewport */}
        <div className="flex-1 min-h-[300px] relative">
          <SVGNetworkGraph
            nodes={nodes}
            edges={edges}
            onSelectNode={handleSelectNode}
            selectedNodeId={selectedNodeId}
            onSelectEdge={handleSelectEdge}
            selectedEdgeId={selectedEdgeId}
          />
        </div>

      </div>

      {/* RIGHT SIDEBAR INSPECTOR */}
      {selectedNodeId && inspectedAccount && (
        <aside className="w-80 bg-canvas-900 border border-border-subtle rounded flex flex-col shrink-0 overflow-y-auto animate-fade-in">
          
          <div className="p-3 bg-canvas-950 border-b border-border-subtle flex items-center justify-between">
            <div>
              <span className="text-[8.5px] font-mono uppercase tracking-wider text-text-muted block">ENTITY INSPECTION</span>
              <span className="font-mono font-semibold text-text-primary text-xs">{inspectedAccount.account_number}</span>
            </div>
            <button onClick={() => setSelectedNodeId(null)} className="text-text-muted hover:text-text-primary">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-4 text-xs font-sans">
            
            {/* Account Details */}
            <div className="space-y-1.5 text-xs">
              <span className="font-semibold text-[9.5px] text-text-muted uppercase font-mono block border-b border-border-subtle pb-1">
                {inspectedAccount.classification === 'CRYPTO_WALLET' ? 'Web3 Wallet Signature' : 'KYC Identity'}
              </span>
              <div className="flex justify-between">
                <span className="text-text-muted">Entity Label:</span>
                <span className="font-medium text-text-primary">{inspectedAccount.holder_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Network/Bank:</span>
                <span className="text-text-secondary">{inspectedAccount.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">IFSC / Chain ID:</span>
                <span className="font-mono text-text-muted">{inspectedAccount.ifsc_code || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Classification:</span>
                <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-mono font-medium ${
                  inspectedAccount.classification === 'CRYPTO_WALLET' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' :
                  inspectedAccount.is_mule ? 'bg-threat-critical/15 text-threat-critical border border-threat-critical/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {inspectedAccount.classification}
                </span>
              </div>
            </div>

            {/* Risk Factors */}
            {inspectedRisk && (
              <div className="space-y-2">
                <span className="font-semibold text-[9.5px] text-text-muted uppercase font-mono block border-b border-border-subtle pb-1">
                  Threat Factor Attribution
                </span>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-semibold font-mono text-threat-critical">{Math.round(inspectedRisk.risk_score)}%</span>
                  <span className="text-[9px] font-mono text-text-muted uppercase">Risk Rating</span>
                </div>

                <div className="space-y-1 font-mono text-[10px]">
                  {Object.entries(inspectedRisk.risk_factors || {}).map(([factor, pt]) => (
                    <div key={factor} className="flex justify-between p-1 bg-canvas-950 rounded border border-border-subtle">
                      <span className="text-text-secondary truncate max-w-[170px]">{factor}</span>
                      <span className="font-medium text-threat-critical">+{String(pt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ledger Logs */}
            <div className="space-y-2">
              <span className="font-semibold text-[9.5px] text-text-muted uppercase font-mono block border-b border-border-subtle pb-1">
                Transaction History ({inspectedTxs.length})
              </span>
              <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                {inspectedTxs.map((tx) => {
                  const isOut = tx.sender_account === selectedNodeId;
                  return (
                    <div key={tx.transaction_id} className="p-1.5 bg-canvas-950 border border-border-subtle rounded text-[9.5px] font-mono flex justify-between items-center">
                      <div>
                        <span className="text-text-secondary block">{isOut ? `To: ${tx.receiver_account}` : `From: ${tx.sender_account}`}</span>
                        <span className="text-[8px] text-text-muted uppercase">{tx.transaction_type}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium block ${isOut ? 'text-threat-critical' : 'text-emerald-400'}`}>
                          {isOut ? '-' : '+'}₹{tx.amount?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[7.5px] text-text-muted">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </aside>
      )}

      {/* TRANSACTION MODAL */}
      {selectedTxDetail && (
        <div className="fixed inset-0 bg-canvas-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-canvas-900 border border-border-strong rounded max-w-sm w-full p-4 space-y-3 text-xs font-sans text-text-primary shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <span className="font-mono font-semibold text-steel-400">Audit: {selectedTxDetail.transaction_id}</span>
              <button onClick={() => setSelectedTxDetail(null)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Method:</span>
                <span className="text-text-primary">{selectedTxDetail.transaction_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Threat Rating:</span>
                <span className="font-semibold text-threat-critical">{selectedTxDetail.risk_score}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Sender:</span>
                <span className="text-text-secondary">{selectedTxDetail.sender_account}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Receiver:</span>
                <span className="text-text-secondary">{selectedTxDetail.receiver_account}</span>
              </div>
              <div className="flex justify-between border-t border-border-subtle pt-1.5">
                <span className="text-text-muted">Amount:</span>
                <span className="font-semibold text-steel-400 text-sm">₹{selectedTxDetail.amount?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border-subtle">
              <button
                onClick={() => setSelectedTxDetail(null)}
                className="px-3 py-1 bg-canvas-850 hover:bg-canvas-800 border border-border-subtle text-text-secondary rounded font-mono text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TransactionNetwork;
