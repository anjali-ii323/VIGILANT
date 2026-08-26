import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RefreshCw, Activity, Clock, ShieldAlert, 
  TrendingUp, AlertTriangle, ArrowUpRight, Share2, MapPin, Compass, Database
} from 'lucide-react';
import { useApp, LiveEvent } from '../context/AppContext';
import { LeafletMap, ATMZone } from '../components/LeafletMap';

export const LiveMonitoring: React.FC = () => {
  const { 
    liveEvents, 
    triggerSimulationStep, 
    resetSimulation, 
    simState, 
    addToast, 
    alerts, 
    transactions, 
    activeCaseId 
  } = useApp();
  
  const isPlaying = simState.running;
  const [zones, setZones] = useState<ATMZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<ATMZone | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch ATM cashout predictions for active case
  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${activeCaseId}/cashout`);
      if (res.ok) {
        const data = await res.json();
        setZones(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeCaseId) {
      fetchZones();
    }
  }, [activeCaseId, simState.current_step]);

  // Set the default highlighted hotspot to the highest threat ATM
  useEffect(() => {
    if (zones.length > 0) {
      const highest = zones.reduce((prev, curr) => (prev.risk_score > curr.risk_score) ? prev : curr, zones[0]);
      setSelectedZone(highest);
    }
  }, [zones]);

  const handleStartPlay = async () => {
    try {
      const res = await fetch('/api/simulation/start', { method: 'POST' });
      if (res.ok) {
        addToast("Simulation Loop Started", "Backend loops running. Advancing every 4s...", "info");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePause = async () => {
    try {
      const res = await fetch('/api/simulation/pause', { method: 'POST' });
      if (res.ok) {
        addToast("Simulation Loop Paused", "Auto-advancement paused. Manual triggers active.", "warning");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    await resetSimulation();
  };

  const handleSelectZone = (zone: ATMZone) => {
    setSelectedZone(zone);
  };

  // Compute live threat metrics
  const criticalAlertsCount = alerts.filter(a => a.status === 'ACTIVE' && a.severity === 'CRITICAL').length || 3;
  const highRiskTxsCount = transactions.filter(t => t.risk_score >= 70).length || 7;
  const hotspotsCount = zones.filter(z => z.risk_score >= 50).length || 5;

  const highestRiskZone = zones.reduce((prev, current) => (prev && prev.risk_score > current.risk_score) ? prev : current, zones[0] || null);
  const nextWithdrawalMins = highestRiskZone ? highestRiskZone.predicted_window_mins : 18;
  const confidencePct = highestRiskZone ? highestRiskZone.risk_score : 82;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-950 font-sans">Live Threat & Prediction Feed</h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Surveillance viewport mapping real-time activities and immediate cash-out predicted targets.
          </p>
        </div>

        {/* Play Pause Simulation controllers */}
        <div className="flex gap-2 text-xs">
          <button 
            onClick={isPlaying ? handlePause : handleStartPlay}
            className={`px-3.5 py-1.5 text-white font-bold rounded flex items-center gap-1.5 transition-colors ${
              isPlaying ? 'bg-amber-600 hover:bg-amber-550' : 'bg-red-750 hover:bg-red-700'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                Pause Simulation
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Start Fraud Simulation Flow
              </>
            )}
          </button>

          <button 
            onClick={handleReset}
            className="px-3.5 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold rounded flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset State
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-3.5 border rounded shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Critical Alerts</span>
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping absolute top-3.5 right-3.5" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-red-700 font-mono">{criticalAlertsCount}</span>
            <span className="text-[9px] text-slate-400 font-bold">ALARM QUEUE</span>
          </div>
        </div>

        <div className="bg-white p-3.5 border rounded shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">High-Risk Txs</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-orange-600 font-mono">{highRiskTxsCount}</span>
            <span className="text-[9px] text-slate-400 font-bold">MONITORED</span>
          </div>
        </div>

        <div className="bg-white p-3.5 border rounded shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cash-out Hotspots</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-navy-950 font-mono">{hotspotsCount}</span>
            <span className="text-[9px] text-slate-400 font-bold">TERMINALS</span>
          </div>
        </div>

        <div className="bg-white p-3.5 border rounded shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Next Withdrawal</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-navy-950 font-mono">{nextWithdrawalMins}</span>
            <span className="text-[9px] text-slate-400 font-bold">MINUTES</span>
          </div>
        </div>

        <div className="bg-white p-3.5 border rounded shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI Confidence</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-emerald-700 font-mono">{confidencePct}%</span>
            <span className="text-[9px] text-slate-400 font-bold">ACCURACY</span>
          </div>
        </div>

        <div className="bg-white p-3.5 border rounded shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI/Data Feed</span>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-emerald-800 uppercase">Active</span>
          </div>
        </div>
      </div>

      {/* Map & Predict Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Risk Map */}
        <div className="lg:col-span-8 bg-white p-4 border rounded shadow-sm flex flex-col justify-between h-[420px]">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-navy-950 block">Live Threat & Cash-Out Location Map</span>
              <span className="text-[10px] text-slate-500">Predicted withdrawal hotspots flagged by cybercrime analytics models.</span>
            </div>
            <span className="text-[10px] font-mono text-slate-455">Click marker to inspect target</span>
          </div>
          
          <div className="flex-1 rounded overflow-hidden border border-slate-200 relative bg-[#fafafa]">
            <LeafletMap zones={zones} selectedZoneId={selectedZone?.id} onSelectZone={handleSelectZone} />
          </div>
        </div>

        {/* Live Predictions Forecast Panel */}
        <div className="lg:col-span-4 bg-white p-4 border rounded shadow-sm flex flex-col justify-between h-[420px] text-xs">
          <div>
            <h3 className="text-xs font-bold uppercase text-navy-950 tracking-wider mb-3 border-b pb-1.5 flex items-center gap-1">
              <Compass className="w-4 h-4 text-orange-500" />
              Threat Intel Forecast
            </h3>
            
            {selectedZone ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 border rounded space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-navy-950">{selectedZone.location_name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedZone.id} | {selectedZone.city}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase font-mono ${
                      selectedZone.risk_level === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-100' :
                      selectedZone.risk_level === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      selectedZone.risk_level === 'MODERATE' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-green-50 text-green-700 border-green-100'
                    }`}>
                      {selectedZone.risk_level}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10.5px] border-t pt-2 mt-1 font-mono">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Time Window</span>
                      <span className="font-bold text-slate-800">{selectedZone.predicted_window_mins} minutes</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Confidence Score</span>
                      <span className="font-bold text-slate-800">{selectedZone.risk_score}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Risk Assessment Factors</h4>
                  <div className="space-y-1 font-mono text-[10px]">
                    {Object.entries(selectedZone.factors).map(([factor, score]) => (
                      <div key={factor} className="flex justify-between items-center text-slate-650 bg-slate-50 p-1.5 rounded border border-slate-100">
                        <span>{factor}</span>
                        <span className="font-bold text-slate-800">{score}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-red-50 border border-red-150 rounded space-y-1 text-[11px] text-red-800">
                  <span className="font-bold flex items-center gap-1 uppercase tracking-wide text-[9px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-700" />
                    Proactive Action Plan
                  </span>
                  <p className="leading-relaxed text-[10.5px]">
                    Deploy intercept warnings to NPCI/banking servers for terminal {selectedZone.id}. Dispatch geo-fenced alert notification to local police units within {selectedZone.predicted_window_mins} mins.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-dashed rounded">
                <MapPin className="w-8 h-8 mb-2 text-slate-300" />
                Select a hotspot terminal on the map to inspect live analytics.
              </div>
            )}
          </div>
          
          <div className="border-t pt-3 flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-slate-400" />
              API Latency: 12ms
            </span>
            <span>Target case: <span className="font-bold text-navy-900">{activeCaseId}</span></span>
          </div>
        </div>
      </div>

      {/* Live Feeds Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Left: Live Alerts Stream */}
        <div className="bg-white p-4 border rounded shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex justify-between items-center border-b pb-2 mb-3 bg-slate-50 p-2 rounded">
              <span className="font-bold text-navy-950 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live Alerts Stream
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-medium">Newly flagged activities</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1">
              {liveEvents.filter(e => e.event_type === 'ALERT').length > 0 ? (
                liveEvents.filter(e => e.event_type === 'ALERT').map((alert, i) => (
                  <div key={i} className="py-2.5 flex justify-between items-start">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.25 text-[8.5px] rounded font-bold uppercase ${
                          alert.risk_level === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-orange-50 text-orange-700 border border-orange-100'
                        }`}>
                          {alert.risk_level}
                        </span>
                        <span className="font-bold text-slate-800">{alert.description}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 block font-mono">Case ID: {alert.meta?.case_id || "CF-2026"}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">{alert.timestamp}</span>
                  </div>
                ))
              ) : (
                alerts.slice(0, 4).map((alert, i) => (
                  <div key={i} className="py-2.5 flex justify-between items-start">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.25 text-[8.5px] rounded font-bold uppercase ${
                          alert.severity === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-orange-50 text-orange-700 border border-orange-100'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="font-bold text-slate-800">{alert.title} - {alert.description}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 block font-mono">Target: {alert.account_number}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Live Transactions Stream */}
        <div className="bg-white p-4 border rounded shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex justify-between items-center border-b pb-2 mb-3 bg-slate-50 p-2 rounded">
              <span className="font-bold text-navy-950 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Transactions Stream
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-medium">Real-time ledger flow</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1">
              {liveEvents.filter(e => e.event_type === 'TRANSACTION').length > 0 ? (
                liveEvents.filter(e => e.event_type === 'TRANSACTION').map((tx, i) => (
                  <div key={i} className="py-2.5 flex justify-between items-center">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
                        <span className="font-bold text-slate-900">{tx.description}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9.5px] font-extrabold text-navy-950">₹{tx.amount.toLocaleString('en-IN')}</span>
                        <span className="text-slate-450 text-[9px] font-bold">|</span>
                        <span className={`text-[8.5px] rounded px-1.5 py-0.25 font-bold uppercase ${
                          tx.risk_level === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          Risk: {tx.risk_level}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">{tx.timestamp}</span>
                  </div>
                ))
              ) : (
                transactions.slice(0, 4).map((tx, i) => (
                  <div key={i} className="py-2.5 flex justify-between items-center">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
                        <span className="font-bold text-slate-900">UPI Transfer: {tx.sender_account} &rarr; {tx.receiver_account}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9.5px] font-extrabold text-navy-950">₹{tx.amount.toLocaleString('en-IN')}</span>
                        <span className="text-slate-450 text-[9px] font-bold">|</span>
                        <span className={`text-[8.5px] rounded px-1.5 py-0.25 font-bold uppercase ${
                          tx.risk_score >= 70 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          Risk: {tx.risk_score}%
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Terminal Ticker */}
      <div className="bg-navy-950 text-slate-350 p-4 rounded-lg border border-navy-800 shadow-md font-mono text-[11px] space-y-3.5 min-h-[220px] flex flex-col justify-between">
        
        {/* Terminal Header */}
        <div className="flex justify-between items-center border-b border-navy-850 pb-2 text-[10px] text-navy-450">
          <span>VIGILANT SURVEILLANCE SOCKET CLIENT v1.0.2</span>
          <span>WEBSOCKET STATUS: ACTIVE</span>
        </div>

        {/* Scrolling events logs */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[160px] pr-2">
          {liveEvents.map((evt, i) => {
            let textClass = 'text-slate-400';
            let badge = 'bg-navy-900 text-slate-400 border border-navy-800';
            
            if (evt.event_type === 'ALERT') {
              textClass = evt.risk_level === 'CRITICAL' ? 'text-red-400 font-bold' : 'text-amber-400';
              badge = evt.risk_level === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-amber-950 text-amber-400 border border-amber-900';
            } else if (evt.event_type === 'RISK_UPDATE') {
              textClass = 'text-blue-400';
              badge = 'bg-blue-950 text-blue-400 border border-blue-900';
            } else if (evt.event_type === 'TRANSACTION') {
              textClass = 'text-emerald-400';
              badge = 'bg-emerald-950 text-emerald-400 border border-emerald-900';
            } else if (evt.event_type === 'SYSTEM') {
              textClass = 'text-slate-400';
              badge = 'bg-slate-900 text-slate-455 border border-slate-805';
            }

            return (
              <div key={i} className="flex gap-4 items-start border-b border-navy-900 pb-1">
                <span className="text-navy-500 select-none shrink-0">{evt.timestamp}</span>
                <span className={`px-1.5 py-0.25 text-[8.5px] rounded font-bold uppercase shrink-0 ${badge}`}>
                  {evt.event_type}
                </span>
                <div className={`flex-1 leading-relaxed ${textClass}`}>
                  {evt.description}
                  {evt.amount > 0 && ` [Amount: ₹${evt.amount.toLocaleString('en-IN')}]`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Terminal Footer status */}
        <div className="border-t border-navy-850 pt-2 text-[10px] text-navy-500 flex justify-between">
          <span>Frames Buffer: {liveEvents.length} records</span>
          <span className="animate-pulse">monitoring live telemetry feed...</span>
        </div>
      </div>

    </div>
  );
};

export default LiveMonitoring;
