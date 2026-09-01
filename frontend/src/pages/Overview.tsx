import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, ArrowRight, TrendingUp, AlertTriangle, 
  MapPin, Clock, CheckCircle2, ChevronRight, Zap, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SVGNetworkGraph } from '../components/SVGNetworkGraph';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const { cases, alerts, liveEvents, activeCaseId, setActiveCaseId, triggerSimulationStep, simState } = useApp();

  const activeCase = cases.find(c => c.case_id === activeCaseId) || cases[0];
  const totalFundsAtRisk = cases.reduce((sum, c) => sum + (c.amount || 0), 0);
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');

  // Interactive Overview Network Topology: Victim -> A -> B -> C/D -> ATM
  const overviewNodes = [
    { id: '30291488102', label: 'Victim (SBI)', type: 'VICTIM' as const, riskScore: 5, x: 80, y: 180, holder_name: 'Ramesh Chandra' },
    { id: 'MULE-A457', label: 'MULE-A457 (Canara)', type: 'MULE' as const, riskScore: 99, x: 230, y: 180, holder_name: 'Mohammad Farooq' },
    { id: 'MULE-B821', label: 'MULE-B821 (PNB)', type: 'MULE' as const, riskScore: 78, x: 390, y: 90, holder_name: 'Karan Malhotra' },
    { id: 'MULE-C912', label: 'MULE-C912 (Union)', type: 'MULE' as const, riskScore: 95, x: 390, y: 270, holder_name: 'Sunil Dutt Gowda' },
    { id: 'ATM-Z03', label: 'ATM-Z03 (Dadar West)', type: 'ATM' as const, riskScore: 95, x: 550, y: 270, holder_name: 'ATM Cluster 03' },
  ];

  const overviewEdges = [
    { id: 'e1', source: '30291488102', target: 'MULE-A457', amount: 100000, type: 'UPI', riskScore: 99 },
    { id: 'e2', source: 'MULE-A457', target: 'MULE-B821', amount: 60000, type: 'IMPS', riskScore: 78 },
    { id: 'e3', source: 'MULE-A457', target: 'MULE-C912', amount: 40000, type: 'IMPS', riskScore: 85 },
    { id: 'e4', source: 'MULE-C912', target: 'ATM-Z03', amount: 40000, type: 'ATM_WITHDRAWAL', riskScore: 95 }
  ];

  return (
    <div className="space-y-12 animate-fade-in text-text-primary font-sans">
      
      {/* 1. LARGE EDITORIAL HERO SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-border-subtle pb-10">
        
        {/* Left Headline & Pitch (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted">
              PROACTIVE SURVEILLANCE GATEWAY
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-light tracking-tight text-text-primary leading-[1.1]">
            See where the money<br />
            <span className="font-semibold text-white">is moving next.</span>
          </h1>

          <p className="text-sm text-text-secondary leading-relaxed max-w-xl">
            Vigilant continuously traces suspicious fund movement, identifies abnormal account behaviour and estimates potential next movements and cash-out risk.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={triggerSimulationStep}
              className="px-4 py-2 bg-steel-500 hover:bg-steel-600 text-white font-medium text-xs font-sans rounded transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Generate Next Transaction</span>
            </button>

            <button
              onClick={() => navigate('/cases')}
              className="px-4 py-2 bg-canvas-900 hover:bg-canvas-850 border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-medium rounded transition-colors"
            >
              Explore Cases ({cases.length})
            </button>
          </div>
        </div>

        {/* Right Live Interactive Flow Graph (6 cols) */}
        <div className="lg:col-span-6 bg-canvas-900 border border-border-subtle rounded p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2 px-1">
            <span className="text-xs font-medium text-text-primary">Live Fund Layering Topology</span>
            <span className="text-[9.5px] font-mono text-text-muted">Case CF-2026-00421</span>
          </div>

          <div className="h-[260px] w-full">
            <SVGNetworkGraph
              nodes={overviewNodes}
              edges={overviewEdges}
              onSelectNode={(id) => {
                setActiveCaseId('CF-2026-00421');
                navigate('/network');
              }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-text-muted px-1">
            <span>Flow: <strong>Victim</strong> &rarr; <strong>A457</strong> &rarr; <strong>B821/C912</strong> &rarr; <strong>ATM-Z03</strong></span>
            <span className="text-steel-400">100% Traceable</span>
          </div>
        </div>

      </section>

      {/* 2. RESTRAINED TYPOGRAPHIC INTELLIGENCE SUMMARY (NO TINY CARDS) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 py-2 border-b border-border-subtle pb-10 font-mono">
        
        <div className="space-y-1">
          <span className="text-3xl md:text-4xl font-semibold text-text-primary block">
            128
          </span>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block">
            ACTIVE CASES
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-3xl md:text-4xl font-semibold text-text-primary block">
            47
          </span>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block">
            HIGH-RISK ACCOUNTS
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-3xl md:text-4xl font-semibold text-steel-400 block">
            ₹2.84 Cr
          </span>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block">
            FUNDS UNDER RISK
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-3xl md:text-4xl font-semibold text-threat-critical block">
            19
          </span>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block">
            ACTIVE ALERTS
          </span>
        </div>

      </section>

      {/* 3. OPERATIONAL TRIAGE & TELEMETRY */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left (5 cols): Priority Intelligence Action */}
        <div className="lg:col-span-5 bg-canvas-900 border border-border-subtle rounded p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">PRIORITY INTELLIGENCE</span>
              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-semibold bg-threat-critical/15 text-threat-critical border border-threat-critical/30">
                CRITICAL RISK 91%
              </span>
            </div>

            <div>
              <span className="font-mono font-semibold text-sm text-text-primary block">Case CF-2026-00421</span>
              <span className="text-xs text-text-secondary">UPI Social Engineering Fraud</span>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed bg-canvas-950 p-3 rounded border border-border-subtle">
              "<strong>₹40,000</strong> may reach a cash-out stage at <strong>ATM Cluster 03 (Dadar West)</strong> within the next <strong>20–40 minutes</strong>."
            </p>
          </div>

          <button
            onClick={() => {
              setActiveCaseId('CF-2026-00421');
              navigate('/cases');
            }}
            className="w-full py-2.5 bg-steel-500 hover:bg-steel-600 text-white font-medium text-xs rounded transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Open Case Workspace</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right (7 cols): Real-Time Telemetry Event Stream */}
        <div className="lg:col-span-7 bg-canvas-900 border border-border-subtle rounded p-5 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <span className="text-xs font-semibold text-text-primary flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-steel-400 stroke-[1.7]" />
              Real-Time Event Console
            </span>
            <span className="text-[9px] font-mono text-emerald-400">STREAMING ACTIVE</span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs font-mono">
            {liveEvents.slice(0, 6).map((evt, idx) => (
              <div key={idx} className="p-2 bg-canvas-950 border border-border-subtle rounded space-y-1">
                <div className="flex items-center justify-between text-[9.5px]">
                  <span className="text-steel-400 font-medium">{evt.event_type}</span>
                  <span className="text-text-muted">{evt.timestamp}</span>
                </div>
                <p className="text-[11px] text-text-secondary font-sans leading-snug">
                  {evt.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </section>

    </div>
  );
};

export default Overview;
