import React, { useState } from 'react';
import { 
  Play, Pause, RotateCcw, Activity, ShieldAlert, Zap, 
  MapPin, CheckCircle2, AlertTriangle, Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LeafletMap } from '../components/LeafletMap';

export const LiveMonitoring: React.FC = () => {
  const { 
    liveEvents, 
    simState, 
    triggerSimulationStep, 
    resetSimulation 
  } = useApp();

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<'1x' | '2x' | '5x'>('1x');

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

  return (
    <div className="space-y-10 animate-fade-in text-text-primary font-sans pb-16">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border-subtle pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-muted">
              WEBSOCKET SURVEILLANCE FEED
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-light text-text-primary">
            Live Monitor Console
          </h1>
        </div>

        {/* Simulation Controls */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-canvas-900 border border-border-subtle rounded">
          
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
                className={`px-2 py-0.5 rounded ${
                  speed === s ? 'bg-steel-500/20 text-steel-400 font-semibold' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Main Stream Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left (7 Cols): Real-Time WebSocket Event Stream */}
        <div className="lg:col-span-7 bg-canvas-900 border border-border-subtle rounded p-5 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <span className="font-medium text-xs text-text-primary flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-steel-400 stroke-[1.7]" />
              Event Stream ({liveEvents.length})
            </span>
            <span className="text-[9px] font-mono text-emerald-400">LIVE WEBSOCKET</span>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 text-xs font-mono">
            {liveEvents.map((evt, idx) => (
              <div
                key={idx}
                className="p-3 bg-canvas-950 border border-border-subtle rounded space-y-1"
              >
                <div className="flex items-center justify-between text-[9.5px]">
                  <div className="flex items-center gap-2">
                    <span className="text-steel-400 font-medium">{evt.event_type}</span>
                    <span className={`px-1 py-0.1 rounded text-[8px] font-medium ${
                      evt.risk_level === 'CRITICAL' ? 'bg-threat-critical/20 text-threat-critical border border-threat-critical/30' :
                      evt.risk_level === 'WARNING' ? 'bg-threat-high/20 text-threat-high border border-threat-high/30' :
                      'text-text-muted'
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
                  <div className="text-[10px] text-text-muted pt-0.5 border-t border-border-subtle flex justify-between">
                    <span>Amount: <strong className="text-steel-400">₹{evt.amount?.toLocaleString('en-IN')}</strong></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right (5 Cols): Live Geospatial Map */}
        <div className="lg:col-span-5 bg-canvas-900 border border-border-subtle rounded p-4 flex flex-col space-y-2">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2 px-1">
            <span className="font-medium text-xs text-text-primary flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-steel-400 stroke-[1.7]" />
              Live Cash-Out Hotspots
            </span>
            <span className="text-[9px] font-mono text-text-muted">OPENSTREETMAP &middot; GEOCODED</span>
          </div>

          <div className="h-[460px] w-full rounded overflow-hidden">
            <LeafletMap />
          </div>
        </div>

      </div>

    </div>
  );
};

export default LiveMonitoring;
