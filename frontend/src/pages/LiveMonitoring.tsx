import React, { useState } from 'react';
import { 
  Play, Pause, RotateCcw, Activity, ShieldAlert, Zap, 
  MapPin, CheckCircle2, AlertTriangle, Clock, Server, Radio,
  Lock, ArrowUpRight, TrendingUp, ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LeafletMap } from '../components/LeafletMap';

export const LiveMonitoring: React.FC = () => {
  const { 
    liveEvents, 
    simState, 
    triggerSimulationStep, 
    resetSimulation,
    addToast,
    logAudit
  } = useApp();

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<'1x' | '2x' | '5x'>('1x');
  const [eventFilter, setEventFilter] = useState<'ALL' | 'CRITICAL' | 'TRANSACTION' | 'SYSTEM'>('ALL');

  React.useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      const delay = speed === '1x' ? 3000 : speed === '2x' ? 1500 : 700;
      interval = setInterval(() => {
        triggerSimulationStep();
      }, delay);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, speed, triggerSimulationStep]);

  const filteredEvents = liveEvents.filter(evt => {
    if (eventFilter === 'CRITICAL') return evt.risk_level === 'CRITICAL';
    if (eventFilter === 'TRANSACTION') return evt.event_type === 'TRANSACTION' || evt.event_type === 'FRAUD_INFLOW';
    if (eventFilter === 'SYSTEM') return evt.event_type === 'SYSTEM' || evt.event_type === 'RISK_UPDATE';
    return true;
  });

  const handleBroadcastAlert = () => {
    addToast("Tactical Advisory Broadcasted", "Dispatched priority freeze directive to NPCI and State Level Cyber Police cells.", "warning");
    logAudit("TACTICAL_BROADCAST", "Officer dispatched emergency interdiction broadcast across active banking gateways.");
  };

  return (
    <div className="space-y-8 animate-fade-in text-text-primary font-sans pb-16">
      
      {/* 1. Header & Live Simulation Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border-subtle pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted">
              REAL-TIME INTERCEPT & SURVEILLANCE CONSOLE
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-light text-text-primary">
            Live Monitor Console
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-canvas-900 border border-border-subtle rounded shadow-panel">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-steel-500 hover:bg-steel-600 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Feed' : 'Start Feed'}</span>
          </button>

          <button
            onClick={triggerSimulationStep}
            disabled={isPlaying}
            className="px-3 py-1.5 bg-canvas-850 hover:bg-canvas-800 disabled:opacity-50 text-text-secondary hover:text-text-primary border border-border-subtle text-xs font-mono rounded flex items-center gap-1"
          >
            <Zap className="w-3 h-3 text-steel-400" />
            <span>Step</span>
          </button>

          <button
            onClick={resetSimulation}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-canvas-850 rounded transition-colors"
            title="Reset Feed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center border-l border-border-subtle pl-2 gap-1 text-[9.5px] font-mono">
            {(['1x', '2x', '5x'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  speed === s ? 'bg-steel-500/20 text-steel-400 font-semibold' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Live Telemetry KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 bg-canvas-900 border border-border-subtle rounded space-y-1">
          <span className="text-[9px] text-text-muted uppercase block">INGEST VELOCITY</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-text-primary">14.2 tx/s</span>
            <span className="text-[8.5px] text-emerald-400">● LIVE</span>
          </div>
          <span className="text-[9px] text-text-secondary font-sans block">Real-time NPCI & IMPS Stream</span>
        </div>

        <div className="p-4 bg-canvas-900 border border-border-subtle rounded space-y-1">
          <span className="text-[9px] text-text-muted uppercase block">BUFFER DISPUTED VOLUME</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-steel-400">₹1,00,000</span>
          </div>
          <span className="text-[9px] text-text-secondary font-sans block">Active Tracked Layering</span>
        </div>

        <div className="p-4 bg-canvas-900 border border-border-subtle rounded space-y-1">
          <span className="text-[9px] text-text-muted uppercase block">ANOMALY PRECISION</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-text-primary">99.4%</span>
          </div>
          <span className="text-[9px] text-text-secondary font-sans block">Scikit-Learn Isolation Engine</span>
        </div>

        <div className="p-4 bg-canvas-900 border border-border-subtle rounded space-y-1">
          <span className="text-[9px] text-text-muted uppercase block">ATM EXTRACTION TARGETS</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-threat-critical">3 CLUSTERS</span>
          </div>
          <span className="text-[9px] text-text-secondary font-sans block">Lead Time: 20–40 min</span>
        </div>
      </div>

      {/* 3. Main Stream Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 Cols): Stream + Gateway Status Panel */}
        <div className="lg:col-span-7 space-y-4 flex flex-col">
          
          {/* Top: Event Stream List */}
          <div className="bg-canvas-900 border border-border-subtle rounded p-4 space-y-3 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-subtle pb-2.5 gap-2">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-steel-400 stroke-[1.7]" />
                <span className="font-semibold text-xs text-text-primary font-mono">
                  Live Event Stream ({filteredEvents.length})
                </span>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1 text-[9px] font-mono">
                {(['ALL', 'CRITICAL', 'TRANSACTION', 'SYSTEM'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setEventFilter(f)}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      eventFilter === f ? 'bg-canvas-800 text-steel-400 font-semibold border border-steel-500/30' : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Event List */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 text-xs font-mono">
              {filteredEvents.map((evt, idx) => {
                const isCrit = evt.risk_level === 'CRITICAL';
                return (
                  <div
                    key={idx}
                    className="p-3 bg-canvas-950 border border-border-subtle rounded space-y-1 hover:border-border-strong transition-colors"
                  >
                    <div className="flex items-center justify-between text-[9.5px]">
                      <div className="flex items-center gap-2">
                        <span className="text-steel-400 font-medium">{evt.event_type}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-semibold ${
                          isCrit ? 'bg-threat-critical/20 text-threat-critical border border-threat-critical/30' :
                          evt.risk_level === 'WARNING' ? 'bg-threat-high/20 text-threat-high border border-threat-high/30' :
                          'bg-canvas-900 text-text-muted border border-border-subtle'
                        }`}>
                          {evt.risk_level}
                        </span>
                      </div>
                      <span className="text-text-muted">{evt.timestamp}</span>
                    </div>

                    <p className="text-xs text-text-secondary font-sans leading-snug">
                      {evt.description}
                    </p>

                    {evt.amount > 0 && (
                      <div className="text-[10px] text-text-muted pt-1 border-t border-border-subtle flex justify-between">
                        <span>Disputed Amount:</span>
                        <span className="text-steel-400 font-semibold">₹{evt.amount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Underneath Stream: Banking Core Gateway & Intercept Telemetry Card */}
          <div className="bg-canvas-900 border border-border-subtle rounded p-4 space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <span className="font-semibold text-xs text-text-primary flex items-center gap-2 font-mono uppercase">
                <Server className="w-3.5 h-3.5 text-steel-400" />
                Banking Gateways & Intercept Links
              </span>
              <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                4 CHANNELS SYNCHRONIZED
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 bg-canvas-950 rounded border border-border-subtle space-y-0.5">
                <span className="text-[8.5px] text-text-muted uppercase block">SBI CORE NODE</span>
                <span className="text-emerald-400 font-semibold text-[10px]">CONNECTED</span>
                <span className="text-[8px] text-text-muted block">Latency: 18ms</span>
              </div>
              <div className="p-2 bg-canvas-950 rounded border border-border-subtle space-y-0.5">
                <span className="text-[8.5px] text-text-muted uppercase block">NPCI UPI HUB</span>
                <span className="text-emerald-400 font-semibold text-[10px]">OPERATIONAL</span>
                <span className="text-[8px] text-text-muted block">Latency: 24ms</span>
              </div>
              <div className="p-2 bg-canvas-950 rounded border border-border-subtle space-y-0.5">
                <span className="text-[8.5px] text-text-muted uppercase block">CANARA GATEWAY</span>
                <span className="text-threat-critical font-semibold text-[10px]">SURVEILLANCE</span>
                <span className="text-[8px] text-text-muted block">Node MULE-A457</span>
              </div>
              <div className="p-2 bg-canvas-950 rounded border border-border-subtle space-y-0.5">
                <span className="text-[8.5px] text-text-muted uppercase block">UNION BANK CORE</span>
                <span className="text-threat-high font-semibold text-[10px]">WATCHLIST</span>
                <span className="text-[8px] text-text-muted block">Node MULE-C912</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-text-muted leading-snug">
                Automated freeze lock directives ready for instant gateway transmission.
              </span>
              <button
                onClick={handleBroadcastAlert}
                className="px-3.5 py-1.5 bg-threat-critical/90 hover:bg-threat-critical text-white font-medium text-xs rounded transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Broadcast Freeze Directive</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column (5 Cols): Live Map & Extraction Target Queue */}
        <div className="lg:col-span-5 space-y-4 flex flex-col">
          
          {/* Top: Live Geospatial Map */}
          <div className="bg-canvas-900 border border-border-subtle rounded p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2 px-1">
              <span className="font-medium text-xs text-text-primary flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-steel-400 stroke-[1.7]" />
                Live Cash-Out Hotspots
              </span>
              <span className="text-[9px] font-mono text-text-muted">OPENSTREETMAP &middot; GEOCODED</span>
            </div>

            <div className="h-[280px] w-full rounded overflow-hidden">
              <LeafletMap />
            </div>
          </div>

          {/* Bottom Underneath Map: Extraction Lead-Time Watchlist */}
          <div className="bg-canvas-900 border border-border-subtle rounded p-4 space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <span className="font-semibold text-xs text-text-primary flex items-center gap-2 font-mono uppercase">
                <Clock className="w-3.5 h-3.5 text-steel-400" />
                Extraction Lead-Time Watchlist
              </span>
              <span className="text-[9px] font-mono text-text-muted">MARKOV PROBABILITY</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 bg-canvas-950 rounded border border-border-subtle flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary text-xs">ATM-Z03</span>
                    <span className="text-[9px] font-sans text-text-secondary">Dadar West Terminal</span>
                  </div>
                  <span className="text-[9px] text-threat-critical font-medium block mt-0.5">88% Probability &middot; ₹40,000 Target</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-steel-400 text-xs block">20–40 min</span>
                  <span className="text-[8px] text-text-muted uppercase">Window</span>
                </div>
              </div>

              <div className="p-2.5 bg-canvas-950 rounded border border-border-subtle flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary text-xs">ATM-Z09</span>
                    <span className="text-[9px] font-sans text-text-secondary">Andheri West Station</span>
                  </div>
                  <span className="text-[9px] text-threat-high font-medium block mt-0.5">74% Probability &middot; ₹60,000 Target</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-steel-400 text-xs block">30–55 min</span>
                  <span className="text-[8px] text-text-muted uppercase">Window</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default LiveMonitoring;
