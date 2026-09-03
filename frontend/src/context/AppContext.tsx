import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_CASES_DATA, MOCK_CASES_LIST, MOCK_ALERTS_LIST } from '../data/mockData';

export interface Case {
  case_id: string;
  victim_ref: string;
  fraud_type: string;
  amount: number;
  current_status: string;
  risk_score: number;
  assigned_officer: string;
  last_activity: string;
  priority?: string;
  created_at: string;
}

export interface Alert {
  alert_id: string;
  case_id: string;
  severity: string;
  title: string;
  description: string;
  account_number: string;
  amount_at_risk: number;
  timestamp: string;
  status: string;
}

export interface LiveEvent {
  timestamp: string;
  amount: number;
  description: string;
  risk_level: string;
  event_type: string;
  meta: {
    case_id?: string;
    step?: number;
    tx_id?: string;
    title?: string;
    tx_hash?: string;
  };
}

export interface SimState {
  running: boolean;
  current_step: number;
  total_steps: number;
  case_id: string;
  last_event: string | null;
}

export interface Toast {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface Note {
  note_id: string;
  case_id: string;
  officer: string;
  content: string;
  category?: string;
  timestamp: string;
}

export interface EvidenceItem {
  evidence_id: string;
  case_id: string;
  title: string;
  description: string;
  timestamp: string;
  file_type: string;
  file_size?: string;
  hash_checksum?: string;
  ipfs_cid?: string;
  on_chain_tx_hash?: string;
  block_number?: number;
  smart_contract_address?: string;
}

export interface WatchlistItem {
  id?: number;
  account_number: string;
  holder_name?: string;
  bank_name?: string;
  reason: string;
  risk_level?: string;
  added_by?: string;
  added_at?: string;
  active?: boolean;
}

export interface AuditLogItem {
  log_id: string;
  block_index?: number;
  previous_hash?: string;
  block_hash?: string;
  merkle_root?: string;
  tx_hash?: string;
  officer: string;
  action: string;
  case_id?: string;
  details: string;
  timestamp: string;
  ip_address: string;
}

interface AppContextType {
  enteredSimulation: boolean;
  setEnteredSimulation: (val: boolean) => void;
  activeCaseId: string;
  setActiveCaseId: (caseId: string) => void;
  cases: Case[];
  currentCase: any;
  alerts: Alert[];
  transactions: any[];
  accounts: any[];
  predictions: any[];
  timeline: any[];
  evidence: EvidenceItem[];
  notes: Note[];
  watchlist: WatchlistItem[];
  auditLogs: AuditLogItem[];
  liveEvents: LiveEvent[];
  simState: SimState;
  loading: boolean;
  toasts: Toast[];
  addToast: (title: string, message: string, type?: 'info' | 'warning' | 'error' | 'success') => void;
  fetchCaseData: (caseId: string) => Promise<void>;
  addNote: (content: string, category?: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  addEvidence: (title: string, description: string, fileType?: string) => Promise<void>;
  deleteEvidence: (evidenceId: string) => Promise<void>;
  createIntervention: (accountNumber: string, targetEntity: string, actionType: string, reason: string) => Promise<void>;
  toggleWatchlist: (accountNumber: string, reason?: string, holderName?: string, bankName?: string) => Promise<void>;
  triggerSimulationStep: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  logAudit: (action: string, details: string, caseId?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enteredSimulation, setEnteredSimulation] = useState<boolean>(true);
  const [activeCaseId, setActiveCaseId] = useState<string>("CF-2026-00421");
  const [cases, setCases] = useState<Case[]>(MOCK_CASES_LIST);
  const [currentCase, setCurrentCase] = useState<any>(null);
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS_LIST);
  const [transactions, setTransactions] = useState<any[]>(MOCK_CASES_DATA[0].transactions);
  const [accounts, setAccounts] = useState<any[]>(MOCK_CASES_DATA[0].accounts);
  const [predictions, setPredictions] = useState<any[]>(MOCK_CASES_DATA[0].predictions);
  const [timeline, setTimeline] = useState<any[]>(MOCK_CASES_DATA[0].timeline);
  
  const [evidence, setEvidence] = useState<EvidenceItem[]>([
    {
      evidence_id: "EV-001",
      case_id: "CF-2026-00421",
      title: "Bank Statement - SBI Origin Account",
      description: "Extract showing immediate debit of Rs. 1,00,000 via fraudulent UPI QR link.",
      file_type: "PDF",
      file_size: "1.4 MB",
      hash_checksum: "SHA256:8F43A9182BC4E7D99A0129481920481928401928",
      ipfs_cid: "bafybeic8f43a9182bc4e7d99a01vigilant",
      on_chain_tx_hash: "0x7F91B994A2D81C10291480D923E2804A9184B022",
      block_number: 1982412,
      smart_contract_address: "0x7F91B994A2D81C10291480D923E2804A9184B022",
      timestamp: new Date().toISOString()
    }
  ]);

  const [notes, setNotes] = useState<Note[]>([
    {
      note_id: "N-101",
      case_id: "CF-2026-00421",
      officer: "Officer Rajesh K. (Cyber Division)",
      content: "Canara Bank account MULE-A457 flagged under high-velocity structuring ring.",
      category: "INTELLIGENCE",
      timestamp: new Date().toISOString()
    }
  ]);

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    {
      account_number: "MULE-A457",
      holder_name: "Mohammad Farooq",
      bank_name: "Canara Bank",
      reason: "High velocity pass-through mule account with 100% outflow within 9 minutes.",
      risk_level: "CRITICAL",
      added_by: "Officer Rajesh K.",
      added_at: new Date().toISOString(),
      active: true
    },
    {
      account_number: "MULE-C912",
      holder_name: "Sunil Dutt Gowda",
      bank_name: "Union Bank of India",
      reason: "Rapid fund movement and structuring towards ATM Cluster 03.",
      risk_level: "CRITICAL",
      added_by: "Officer Rajesh K.",
      added_at: new Date().toISOString(),
      active: true
    },
    {
      account_number: "0x71C9284F91B8",
      holder_name: "Tether TRC-20 Wallet",
      bank_name: "Polygon/Tron Blockchain",
      reason: "Crypto P2P un-hosted off-ramp wallet",
      risk_level: "CRITICAL",
      added_by: "Officer Rajesh K.",
      added_at: new Date().toISOString(),
      active: true
    }
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([
    {
      log_id: "AUD-BLK0000-GENESIS",
      block_index: 0,
      previous_hash: "0".repeat(64),
      block_hash: "8f43a9182bc4e7d99a0129481920481928401928401928401928401928401928",
      merkle_root: "7c9b204819204819204819204819204819204819204819204819204819204819",
      tx_hash: "0x8f43a9182bc4e7d99a0129481920481928401928",
      officer: "System Consensus Node",
      action: "GENESIS_BLOCK_INITIALIZED",
      case_id: undefined,
      details: "National Blockchain Forensic Inter-Agency Ledger Genesis block created.",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      ip_address: "10.42.0.1 (CORE_GATEWAY)"
    },
    {
      log_id: "AUD-BLK0001-A102",
      block_index: 1,
      previous_hash: "8f43a9182bc4e7d99a0129481920481928401928401928401928401928401928",
      block_hash: "3d9a184f91b82048102948102948102948102948102948102948102948102948",
      merkle_root: "5e1a204819204819204819204819204819204819204819204819204819204819",
      tx_hash: "0x3d9a184f91b82048102948102948102948102948",
      officer: "Officer Rajesh K.",
      action: "SESSION_INITIALIZED",
      case_id: "CF-2026-00421",
      details: "Authenticated investigator workstation session opened via VPN.",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      ip_address: "10.42.0.8 (LE_VPN)"
    },
    {
      log_id: "AUD-BLK0002-B304",
      block_index: 2,
      previous_hash: "3d9a184f91b82048102948102948102948102948102948102948102948102948",
      block_hash: "9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
      merkle_root: "2f4b204819204819204819204819204819204819204819204819204819204819",
      tx_hash: "0x9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c",
      officer: "Officer Rajesh K.",
      action: "EVIDENCE_ANCHORED_ON_CHAIN",
      case_id: "CF-2026-00421",
      details: "Anchored FIR Intake Statement (IPFS: bafybeic8f43a9182bc4e7d99a01) to Polygon testnet.",
      timestamp: new Date(Date.now() - 900000).toISOString(),
      ip_address: "10.42.0.8 (LE_VPN)"
    }
  ]);
  
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>(() => {
    const timeNow = (minsAgo: number = 0) => {
      const d = new Date(Date.now() - minsAgo * 60000);
      return d.toLocaleTimeString('en-IN', { hour12: false });
    };

    return [
      {
        timestamp: timeNow(0),
        amount: 40000,
        description: "Cash-Out Extraction Predicted: ₹40,000 converging towards ATM-Z03 (Dadar West Terminal) within 20–40 min.",
        risk_level: "CRITICAL",
        event_type: "PREDICTION_ALERT",
        meta: { case_id: "CF-2026-00421", tx_id: "TX-9014" }
      },
      {
        timestamp: timeNow(2),
        amount: 25000,
        description: "Layer 2 Secondary Dispersal: MULE-B821 transferred ₹25,000 to SBI Account MULE-D441 via NEFT.",
        risk_level: "WARNING",
        event_type: "TRANSACTION",
        meta: { case_id: "CF-2026-00421", tx_id: "TX-9013" }
      },
      {
        timestamp: timeNow(4),
        amount: 40000,
        description: "Structuring Split Detected: MULE-A457 routed ₹40,000 into Union Bank account MULE-C912.",
        risk_level: "CRITICAL",
        event_type: "RISK_UPDATE",
        meta: { case_id: "CF-2026-00421", tx_id: "TX-9012" }
      },
      {
        timestamp: timeNow(7),
        amount: 60000,
        description: "Inter-Bank IMPS Transfer: MULE-A457 moved ₹60,000 to PNB account MULE-B821 in 6 minutes.",
        risk_level: "HIGH",
        event_type: "TRANSACTION",
        meta: { case_id: "CF-2026-00421", tx_id: "TX-9011" }
      },
      {
        timestamp: timeNow(10),
        amount: 100000,
        description: "Unauthorized Debit: Initial victim account 30291488102 transferred ₹1,00,000 to MULE-A457 via UPI QR.",
        risk_level: "CRITICAL",
        event_type: "FRAUD_INFLOW",
        meta: { case_id: "CF-2026-00421", tx_id: "TX-9010" }
      },
      {
        timestamp: timeNow(12),
        amount: 0,
        description: "ML Isolation Forest Anomaly baseline evaluated. High-risk point score assigned to 4 nodes.",
        risk_level: "INFO",
        event_type: "SYSTEM",
        meta: {}
      },
      {
        timestamp: timeNow(15),
        amount: 0,
        description: "Vigilant Level 3 Gateway: Secure WebSocket telemetry attached to bank surveillance core.",
        risk_level: "INFO",
        event_type: "SYSTEM",
        meta: {}
      }
    ];
  });

  const [simState, setSimState] = useState<SimState>({
    running: false,
    current_step: 0,
    total_steps: 5,
    case_id: "CF-2026-00421",
    last_event: "System idle"
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  // Fetch Cases list
  const fetchCases = useCallback(async (search?: string) => {
    try {
      const url = search ? `/api/cases?search=${encodeURIComponent(search)}` : '/api/cases';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCases(data);
        if (data.length > 0 && !activeCaseId) {
          setActiveCaseId(data[0].case_id);
        }
        return;
      }
    } catch (err) {}

    if (search) {
      const q = search.toLowerCase();
      setCases(MOCK_CASES_LIST.filter(c => c.case_id.toLowerCase().includes(q) || c.fraud_type.toLowerCase().includes(q)));
    } else {
      setCases(MOCK_CASES_LIST);
    }
  }, [activeCaseId]);

  // Fetch Alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        setAlerts(await res.json());
        return;
      }
    } catch (err) {}
    setAlerts(MOCK_ALERTS_LIST);
  }, []);

  // Fetch Watchlist
  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch('/api/watchlist');
      if (res.ok) {
        setWatchlist(await res.json());
      }
    } catch (err) {}
  }, []);

  // Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        setAuditLogs(await res.json());
      }
    } catch (err) {}
  }, []);

  // Fetch complete Case-specific Data
  const fetchCaseData = useCallback(async (caseId: string) => {
    if (!caseId) return;
    setLoading(true);
    const cleanId = caseId.trim().toUpperCase().replace(/_/g, '-');

    try {
      const [resCase, resTxs, resAccs, resPreds, resTime, resNotes, resEvid] = await Promise.all([
        fetch(`/api/cases/${cleanId}`),
        fetch(`/api/cases/${cleanId}/transactions`),
        fetch(`/api/cases/${cleanId}/accounts`),
        fetch(`/api/cases/${cleanId}/predictions`),
        fetch(`/api/cases/${cleanId}/timeline`),
        fetch(`/api/cases/${cleanId}/notes`),
        fetch(`/api/cases/${cleanId}/evidence`)
      ]);

      if (resCase.ok) {
        const cData = await resCase.json();
        setCurrentCase(cData);
        if (resTxs.ok) setTransactions(await resTxs.json());
        if (resAccs.ok) setAccounts(await resAccs.json());
        if (resPreds.ok) setPredictions(await resPreds.json());
        if (resTime.ok) setTimeline(await resTime.json());
        if (resNotes.ok) setNotes(await resNotes.json());
        if (resEvid.ok) setEvidence(await resEvid.json());
        setLoading(false);
        return;
      }
    } catch (err) {}

    // Fallback load from MOCK_CASES_DATA
    const foundMock = MOCK_CASES_DATA.find(c => c.case_id === cleanId) || MOCK_CASES_DATA[0];
    setCurrentCase({
      case: {
        case_id: foundMock.case_id,
        victim_ref: foundMock.victim_ref,
        fraud_type: foundMock.fraud_type,
        amount: foundMock.amount,
        current_status: foundMock.current_status,
        risk_score: foundMock.risk_score,
        assigned_officer: foundMock.assigned_officer,
        last_activity: foundMock.last_activity,
        priority: foundMock.priority,
        created_at: foundMock.created_at
      },
      victim: {
        name: foundMock.victim_name,
        account_number: foundMock.victim_ref,
        bank_name: foundMock.victim_bank,
        report_timestamp: foundMock.created_at,
        city: "Mumbai, Maharashtra"
      },
      transaction_count: foundMock.transactions.length,
      mule_count: foundMock.accounts.filter(a => a.is_mule).length
    });
    setTransactions(foundMock.transactions);
    setAccounts(foundMock.accounts);
    setPredictions(foundMock.predictions);
    setTimeline(foundMock.timeline);
    if (foundMock.notes) setNotes(foundMock.notes);
    if (foundMock.evidence) setEvidence(foundMock.evidence);
    setLoading(false);
  }, []);

  // Initial Load
  useEffect(() => {
    fetchCases();
    fetchAlerts();
    fetchWatchlist();
    fetchAuditLogs();
  }, [fetchCases, fetchAlerts, fetchWatchlist, fetchAuditLogs]);

  // When activeCaseId changes, load case data
  useEffect(() => {
    if (activeCaseId) {
      fetchCaseData(activeCaseId);
    }
  }, [activeCaseId, fetchCaseData]);

  // Note Actions
  const addNote = async (content: string, category: string = "INTELLIGENCE") => {
    const newNoteObj: Note = {
      note_id: `N-${Date.now()}`,
      case_id: activeCaseId,
      officer: "Officer Rajesh K. (Cyber Division)",
      content,
      category,
      timestamp: new Date().toISOString()
    };
    try {
      const res = await fetch(`/api/cases/${activeCaseId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, category, officer: "Officer Rajesh K. (Cyber Division)" })
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(prev => [data, ...prev]);
        fetchAuditLogs();
      } else {
        setNotes(prev => [newNoteObj, ...prev]);
      }
    } catch (err) {
      setNotes(prev => [newNoteObj, ...prev]);
    }
    addToast("Note Saved", "Investigation observation persisted to case dossier.", "success");
  };

  const deleteNote = async (noteId: string) => {
    try {
      await fetch(`/api/cases/${activeCaseId}/notes/${noteId}`, { method: 'DELETE' });
    } catch (err) {}
    setNotes(prev => prev.filter(n => n.note_id !== noteId));
    addToast("Note Removed", "Investigation note removed from dossier.", "info");
  };

  // Evidence Actions (with Blockchain Anchoring)
  const addEvidence = async (title: string, description: string, fileType: string = "PDF") => {
    const fakeHash = Math.random().toString(16).substring(2, 10).toUpperCase();
    const newEvObj: EvidenceItem = {
      evidence_id: `EV-${Date.now()}`,
      case_id: activeCaseId,
      title,
      description,
      file_type: fileType,
      file_size: "1.4 MB",
      hash_checksum: `SHA256:${fakeHash}182BC4E7D99A01`,
      ipfs_cid: `bafybeic${fakeHash.toLowerCase()}vigilant`,
      on_chain_tx_hash: `0x${fakeHash.toLowerCase()}b994a2d81c10291480d923e2804a9184b022`,
      block_number: 1982400 + Math.floor(Math.random() * 500),
      smart_contract_address: "0x7F91B994A2D81C10291480D923E2804A9184B022",
      timestamp: new Date().toISOString()
    };
    try {
      const res = await fetch(`/api/cases/${activeCaseId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, file_type: fileType })
      });
      if (res.ok) {
        const data = await res.json();
        setEvidence(prev => [data, ...prev]);
        fetchAuditLogs();
      } else {
        setEvidence(prev => [newEvObj, ...prev]);
      }
    } catch (err) {
      setEvidence(prev => [newEvObj, ...prev]);
    }
    addToast("Evidence Anchored On-Chain", `Attached ${title} with Section 65B SHA-256 IPFS signature.`, "success");
  };

  const deleteEvidence = async (evidenceId: string) => {
    try {
      await fetch(`/api/cases/${activeCaseId}/evidence/${evidenceId}`, { method: 'DELETE' });
    } catch (err) {}
    setEvidence(prev => prev.filter(e => e.evidence_id !== evidenceId));
    addToast("Evidence Removed", "Removed item from evidence locker.", "info");
  };

  // Intervention / Freeze Action (Multi-Sig Smart Contract)
  const createIntervention = async (accountNumber: string, targetEntity: string, actionType: string, reason: string) => {
    try {
      const res = await fetch(`/api/cases/${activeCaseId}/intervene`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_number: accountNumber,
          target_entity: targetEntity,
          action_type: actionType,
          reason: reason
        })
      });
      if (res.ok) {
        fetchAuditLogs();
      }
    } catch (err) {}

    addToast("Smart-Contract Freeze Executed", `Multi-Signature consensus lock executed on account ${accountNumber} (Tx: 0x7F91B...).`, "success");
    setCases(prev => prev.map(c => c.case_id === activeCaseId ? { ...c, current_status: "RESOLVED" } : c));
    if (currentCase) {
      setCurrentCase({
        ...currentCase,
        case: { ...currentCase.case, current_status: "RESOLVED" }
      });
    }
  };

  // Watchlist Toggle
  const toggleWatchlist = async (accountNumber: string, reason: string = "Priority Intercept", holderName?: string, bankName?: string) => {
    const existing = watchlist.find(w => w.account_number === accountNumber);
    if (existing) {
      setWatchlist(prev => prev.filter(w => w.account_number !== accountNumber));
      addToast("Watchlist Updated", `Removed ${accountNumber} from surveillance.`, "info");
    } else {
      const newItem: WatchlistItem = {
        account_number: accountNumber,
        holder_name: holderName || "Entity Under Surveillance",
        bank_name: bankName || "Banking Gateway",
        reason,
        risk_level: "HIGH",
        added_by: "Officer Rajesh K.",
        added_at: new Date().toISOString(),
        active: true
      };
      setWatchlist(prev => [newItem, ...prev]);
      addToast("Watchlist Enforced", `Added ${accountNumber} to priority watchlist.`, "success");
    }
  };

  // Simulation Step
  const triggerSimulationStep = async () => {
    try {
      const res = await fetch(`/api/simulation/step?case_id=${activeCaseId}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSimState(prev => ({
          ...prev,
          current_step: data.step,
          last_event: data.title
        }));
        fetchCaseData(activeCaseId);
        fetchAlerts();
        addToast("Simulation Step", data.description || "Generated next transaction hop.", "info");
        return;
      }
    } catch (err) {}

    // Fallback simulation step
    setSimState(prev => {
      const nextStep = (prev.current_step % 5) + 1;
      const timeNow = new Date().toLocaleTimeString('en-IN', { hour12: false });
      const newEvt: LiveEvent = {
        timestamp: timeNow,
        amount: 25000 + Math.floor(Math.random() * 40000),
        description: `Simulated transaction hop generated for Case ${activeCaseId}. Risk score updated.`,
        risk_level: nextStep >= 3 ? "CRITICAL" : "WARNING",
        event_type: "TRANSACTION",
        meta: { step: nextStep, case_id: activeCaseId }
      };
      setLiveEvents(l => [newEvt, ...l]);
      addToast(`Simulation Step ${nextStep}/5`, `Generated next fund hop for Case ${activeCaseId}.`, "info");
      return {
        ...prev,
        current_step: nextStep,
        last_event: `Step ${nextStep} executed`
      };
    });
  };

  // Reset Simulation
  const resetSimulation = async () => {
    try {
      await fetch('/api/simulation/reset', { method: 'POST' });
    } catch (err) {}
    setSimState({
      running: false,
      current_step: 0,
      total_steps: 5,
      case_id: activeCaseId,
      last_event: "Baseline restored"
    });
    fetchCaseData(activeCaseId);
    addToast("Simulation Reset", "State restored to initial baseline.", "info");
  };

  // Audit Logging
  const logAudit = async (action: string, details: string, caseId?: string) => {
    const nextIdx = auditLogs.length;
    const newLog: AuditLogItem = {
      log_id: `AUD-BLK${nextIdx.toString().padStart(4, '0')}-${Date.now().toString(16).substring(4)}`,
      block_index: nextIdx,
      previous_hash: auditLogs[0]?.block_hash || "8f43a9182bc4e7d99a0129481920481928401928401928401928401928401928",
      block_hash: "3d9a184f91b82048102948102948102948102948102948102948102948102948",
      merkle_root: "7c9b204819204819204819204819204819204819204819204819204819204819",
      tx_hash: `0x${Date.now().toString(16)}`,
      officer: "Officer Rajesh K.",
      action,
      case_id: caseId || activeCaseId,
      details,
      timestamp: new Date().toISOString(),
      ip_address: "10.42.0.8 (LE_VPN)"
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        enteredSimulation,
        setEnteredSimulation,
        activeCaseId,
        setActiveCaseId,
        cases,
        currentCase,
        alerts,
        transactions,
        accounts,
        predictions,
        timeline,
        evidence,
        notes,
        watchlist,
        auditLogs,
        liveEvents,
        simState,
        loading,
        toasts,
        addToast,
        fetchCaseData,
        addNote,
        deleteNote,
        addEvidence,
        deleteEvidence,
        createIntervention,
        toggleWatchlist,
        triggerSimulationStep,
        resetSimulation,
        logAudit
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
