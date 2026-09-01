import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
  setActiveCaseId: (id: string) => void;
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
  triggerSimulationStep: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  fetchCases: (search?: string) => Promise<void>;
  fetchAlerts: () => Promise<void>;
  fetchCaseData: (id: string) => Promise<void>;
  fetchWatchlist: () => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  addNote: (content: string, category?: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  addEvidence: (title: string, description: string, fileType?: string) => Promise<void>;
  deleteEvidence: (evidenceId: string) => Promise<void>;
  createIntervention: (accountNumber: string, targetEntity: string, actionType: string, reason: string) => Promise<void>;
  toggleWatchlist: (accountNumber: string, reason: string, holderName?: string, bankName?: string) => Promise<void>;
  logAudit: (action: string, details: string, caseId?: string) => Promise<void>;
  addToast: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
  toasts: Toast[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enteredSimulation, setEnteredSimulation] = useState<boolean>(() => {
    return localStorage.getItem('vigilant_entered') === 'true';
  });

  const handleSetEnteredSimulation = (val: boolean) => {
    setEnteredSimulation(val);
    localStorage.setItem('vigilant_entered', val ? 'true' : 'false');
  };

  const [activeCaseId, setActiveCaseId] = useState<string>("CF-2026-00421");
  const [cases, setCases] = useState<Case[]>([]);
  const [currentCase, setCurrentCase] = useState<any>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>(() => {
    const timeNow = () => new Date().toLocaleTimeString('en-IN', { hour12: false });
    return [
      {
        timestamp: timeNow(),
        amount: 0,
        description: "Vigilant Level 3 Gateway: Secure WebSocket telemetry attached to bank surveillance core.",
        risk_level: "INFO",
        event_type: "SYSTEM",
        meta: {}
      },
      {
        timestamp: timeNow(),
        amount: 0,
        description: "Watchlist active: Suspect nodes MULE-A457 and MULE-C912 flagged under real-time intercept tracking.",
        risk_level: "WARNING",
        event_type: "RISK_UPDATE",
        meta: {}
      },
      {
        timestamp: timeNow(),
        amount: 0,
        description: "Proactive Machine Learning Heuristics engine initialized. Multi-hop destination prediction active.",
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
      }
    } catch (err) {
      console.error("Failed to fetch cases:", err);
    }
  }, [activeCaseId]);

  // Fetch Alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        setAlerts(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    }
  }, []);

  // Fetch Watchlist
  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch('/api/watchlist');
      if (res.ok) {
        setWatchlist(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch watchlist:", err);
    }
  }, []);

  // Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        setAuditLogs(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    }
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
      }
      if (resTxs.ok) setTransactions(await resTxs.json());
      if (resAccs.ok) setAccounts(await resAccs.json());
      if (resPreds.ok) setPredictions(await resPreds.json());
      if (resTime.ok) setTimeline(await resTime.json());
      if (resNotes.ok) setNotes(await resNotes.json());
      if (resEvid.ok) setEvidence(await resEvid.json());
    } catch (err) {
      console.error("Failed to fetch case data for", cleanId, err);
    } finally {
      setLoading(false);
    }
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
    try {
      const res = await fetch(`/api/cases/${activeCaseId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, category, officer: "Officer Rajesh K. (Cyber Division)" })
      });
      if (res.ok) {
        const newNote = await res.json();
        setNotes(prev => [newNote, ...prev]);
        addToast("Note Saved", "Investigation observation persisted to case dossier.", "success");
        fetchAuditLogs();
      }
    } catch (err) {
      addToast("Save Failed", "Could not save investigation note.", "error");
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/cases/${activeCaseId}/notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.note_id !== noteId));
        addToast("Note Removed", "Investigation note removed from dossier.", "info");
      }
    } catch (err) {
      addToast("Error", "Failed to delete note.", "error");
    }
  };

  // Evidence Actions
  const addEvidence = async (title: string, description: string, fileType: string = "PDF") => {
    try {
      const res = await fetch(`/api/cases/${activeCaseId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, file_type: fileType })
      });
      if (res.ok) {
        const newEv = await res.json();
        setEvidence(prev => [newEv, ...prev]);
        addToast("Evidence Added", `Attached ${title} to case evidence locker.`, "success");
        fetchAuditLogs();
      }
    } catch (err) {
      addToast("Upload Failed", "Could not attach evidence.", "error");
    }
  };

  const deleteEvidence = async (evidenceId: string) => {
    try {
      const res = await fetch(`/api/cases/${activeCaseId}/evidence/${evidenceId}`, { method: 'DELETE' });
      if (res.ok) {
        setEvidence(prev => prev.filter(e => e.evidence_id !== evidenceId));
        addToast("Evidence Removed", "Removed item from evidence locker.", "info");
      }
    } catch (err) {
      addToast("Error", "Failed to remove evidence item.", "error");
    }
  };

  // Intervention / Freeze Action
  const createIntervention = async (accountNumber: string, targetEntity: string, actionType: string, reason: string) => {
    try {
      const res = await fetch(`/api/cases/${activeCaseId}/intervene`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_number: accountNumber,
          target_entity: targetEntity,
          action_type: actionType,
          reason,
          requested_by: "Officer Rajesh K. (Cyber Division)"
        })
      });
      if (res.ok) {
        addToast("Freeze Executed", `Proactive freeze command successfully issued for ${accountNumber}.`, "success");
        fetchCaseData(activeCaseId);
        fetchCases();
        fetchAuditLogs();
      }
    } catch (err) {
      addToast("Intervention Error", "Failed to execute freeze action.", "error");
    }
  };

  // Watchlist Toggle
  const toggleWatchlist = async (accountNumber: string, reason: string, holderName?: string, bankName?: string) => {
    const isWatched = watchlist.some(w => w.account_number === accountNumber && w.active);
    try {
      if (isWatched) {
        const res = await fetch(`/api/watchlist/${accountNumber}`, { method: 'DELETE' });
        if (res.ok) {
          setWatchlist(prev => prev.filter(w => w.account_number !== accountNumber));
          addToast("Watchlist Removed", `Account ${accountNumber} removed from active surveillance.`, "info");
        }
      } else {
        const res = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account_number: accountNumber, reason, holder_name: holderName, bank_name: bankName, risk_level: "HIGH" })
        });
        if (res.ok) {
          const item = await res.json();
          setWatchlist(prev => [item, ...prev]);
          addToast("Watchlist Enforced", `Account ${accountNumber} placed under priority intercept surveillance.`, "warning");
        }
      }
      fetchAuditLogs();
    } catch (err) {
      addToast("Error", "Could not update watchlist.", "error");
    }
  };

  // Audit Log Recorder
  const logAudit = async (action: string, details: string, caseId?: string) => {
    try {
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, details, case_id: caseId || activeCaseId, officer: "Officer Rajesh K." })
      });
      fetchAuditLogs();
    } catch (err) {
      console.error("Failed to log audit event:", err);
    }
  };

  // Simulation Controls
  const triggerSimulationStep = async () => {
    try {
      const res = await fetch('/api/simulation/step', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSimState(prev => ({
          ...prev,
          current_step: data.current_step,
          last_event: data.last_event
        }));
        addToast("Simulation Step", data.last_event || "Generated next transaction sequence.", "info");
        fetchCaseData(activeCaseId);
        fetchAlerts();
      }
    } catch (err) {
      console.error("Simulation step failed:", err);
    }
  };

  const resetSimulation = async () => {
    try {
      const res = await fetch('/api/simulation/reset', { method: 'POST' });
      if (res.ok) {
        setSimState({
          running: false,
          current_step: 0,
          total_steps: 5,
          case_id: "CF-2026-00421",
          last_event: "Simulation reset to baseline"
        });
        addToast("Simulation Reset", "Reset case state to initial complaint registration.", "info");
        fetchCaseData(activeCaseId);
        fetchAlerts();
      }
    } catch (err) {
      console.error("Simulation reset failed:", err);
    }
  };

  // WebSocket Live Stream Connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/simulation`;

      try {
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const data: LiveEvent = JSON.parse(event.data);
            setLiveEvents(prev => [data, ...prev.slice(0, 49)]);
          } catch (e) {
            console.error("Error parsing WS event", e);
          }
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };
      } catch (err) {
        console.error("WS connection error:", err);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  return (
    <AppContext.Provider value={{
      enteredSimulation,
      setEnteredSimulation: handleSetEnteredSimulation,
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
      triggerSimulationStep,
      resetSimulation,
      fetchCases,
      fetchAlerts,
      fetchCaseData,
      fetchWatchlist,
      fetchAuditLogs,
      addNote,
      deleteNote,
      addEvidence,
      deleteEvidence,
      createIntervention,
      toggleWatchlist,
      logAudit,
      addToast,
      toasts
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
