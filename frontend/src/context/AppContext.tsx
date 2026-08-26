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

interface AppContextType {
  activeCaseId: string;
  setActiveCaseId: (id: string) => void;
  cases: Case[];
  alerts: Alert[];
  transactions: any[];
  accounts: any[];
  predictions: any[];
  timeline: any[];
  evidence: any[];
  liveEvents: LiveEvent[];
  simState: SimState;
  loading: boolean;
  triggerSimulationStep: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  fetchCases: (search?: string) => Promise<void>;
  fetchAlerts: () => Promise<void>;
  fetchCaseData: (id: string) => Promise<void>;
  addToast: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
  toasts: Toast[];
}

export interface Toast {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCaseId, setActiveCaseId] = useState<string>("CF-2026-00421");
  const [cases, setCases] = useState<Case[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>(() => {
    const timeNow = () => new Date().toLocaleTimeString('en-IN', { hour12: false });
    return [
      {
        timestamp: timeNow(),
        amount: 0,
        description: "Active WebSockets proxy attached to primary banking API surveillance node.",
        risk_level: "INFO",
        event_type: "SYSTEM",
        meta: {}
      },
      {
        timestamp: timeNow(),
        amount: 0,
        description: "Watchlist loaded: 3 active suspect layer accounts (MULE-A457, MULE-B821, MULE-C912) placed under real-time transaction intercept tracking.",
        risk_level: "WARNING",
        event_type: "RISK_UPDATE",
        meta: {}
      },
      {
        timestamp: timeNow(),
        amount: 0,
        description: "Vigilant Proactive Surveillance Engine initialization completed. Listening for transaction events...",
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

  const addToast = useCallback((title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const fetchCases = async (search?: string) => {
    try {
      const url = search ? `/api/cases?search=${encodeURIComponent(search)}` : '/api/cases';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (err) {
      console.error("Failed to fetch cases:", err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    }
  };

  // Fetch all case-specific information in a single sync
  const fetchCaseData = useCallback(async (id: string) => {
    try {
      // 1. Transactions
      const resTxs = await fetch(`/api/cases/${id}/transactions`);
      if (resTxs.ok) setTransactions(await resTxs.json());
      
      // 2. Accounts
      const resAccs = await fetch(`/api/cases/${id}/accounts`);
      if (resAccs.ok) setAccounts(await resAccs.json());
      
      // 3. Predictions
      const resPreds = await fetch(`/api/cases/${id}/predictions`);
      if (resPreds.ok) setPredictions(await resPreds.json());
      
      // 4. Alerts
      const resAlerts = await fetch(`/api/cases/${id}/alerts`);
      if (resAlerts.ok) setAlerts(await resAlerts.json());
      
      // 5. Timeline
      const resTimeline = await fetch(`/api/cases/${id}/timeline`);
      if (resTimeline.ok) setTimeline(await resTimeline.json());
      
      // 6. Evidence
      const resEvidence = await fetch(`/api/cases/${id}/evidence`);
      if (resEvidence.ok) setEvidence(await resEvidence.json());
    } catch (err) {
      console.error("Failed to load case data:", err);
    }
  }, []);

  // Fetch simulation status
  const fetchSimStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/cases/${id}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause' }) // Just querying status without changing running state
      });
      if (res.ok) {
        const data = await res.json();
        setSimState({
          running: data.running,
          current_step: data.current_step,
          total_steps: 5,
          case_id: id,
          last_event: data.last_event || "Monitoring case network"
        });
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Load new case data whenever selected case ID shifts
  useEffect(() => {
    if (activeCaseId) {
      fetchCaseData(activeCaseId);
      fetchSimStatus(activeCaseId);
    }
  }, [activeCaseId, fetchCaseData, fetchSimStatus]);

  // Trigger one step in the case simulation
  const triggerSimulationStep = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${activeCaseId}/simulate`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'step' })
      });
      if (res.ok) {
        const data = await res.json();
        setSimState({
          running: data.running,
          current_step: data.current_step,
          total_steps: 5,
          case_id: activeCaseId,
          last_event: data.last_event
        });
        addToast("Simulation Event Triggered", data.last_event, "success");
        await fetchCaseData(activeCaseId);
        await fetchCases();
      }
    } catch (err) {
      addToast("Simulation Error", "Failed to trigger next step.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Reset the simulation state back to normal
  const resetSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${activeCaseId}/simulate`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });
      if (res.ok) {
        const data = await res.json();
        setSimState({
          running: false,
          current_step: 0,
          total_steps: 5,
          case_id: activeCaseId,
          last_event: "State restored to baseline"
        });
        addToast("Simulation Reset", "Money trail restored to baseline.", "info");
        const resetEvt: LiveEvent = {
          timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
          amount: 0,
          description: "Database refresh completed. Case money trails restored to baseline.",
          risk_level: "INFO",
          event_type: "SYSTEM",
          meta: {}
        };
        setLiveEvents((prev) => [resetEvt, ...prev]);
        await fetchCaseData(activeCaseId);
        await fetchCases();
      }
    } catch (err) {
      addToast("Reset Error", "Failed to reset simulation database.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Setup WebSockets for real-time live events feed
  useEffect(() => {
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.port === '5173' ? '127.0.0.1:8000' : window.location.host;
    const wsUrl = `${wsProto}//${host}/ws/simulation`;
    
    let ws: WebSocket;
    let reconnectTimeout: any;

    const connect = () => {
      console.log("Connecting WebSocket to", wsUrl);
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'HEARTBEAT') return;

          // Append to live events ticker list
          setLiveEvents((prev) => [data, ...prev].slice(0, 150));
          
          // Trigger dynamic alerts and reloads if matches active case
          if (data.meta && data.meta.case_id === activeCaseId) {
            fetchCaseData(activeCaseId);
            fetchCases();
          }
        } catch (err) {
          console.error("Error parsing WS packet", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected. Reconnecting in 3s...");
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close();
      };
    };

    connect();

    // Load initial listings
    fetchCases();
    fetchAlerts();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, [activeCaseId, fetchCaseData, addToast]);

  return (
    <AppContext.Provider value={{
      activeCaseId,
      setActiveCaseId,
      cases,
      alerts,
      transactions,
      accounts,
      predictions,
      timeline,
      evidence,
      liveEvents,
      simState,
      loading,
      triggerSimulationStep,
      resetSimulation,
      fetchCases,
      fetchAlerts,
      fetchCaseData,
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
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
