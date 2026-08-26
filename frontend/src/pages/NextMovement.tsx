import React, { useState, useEffect } from 'react';
import { 
  Play, RefreshCw, Compass, ArrowRight, Landmark, Info, 
  HelpCircle, AlertTriangle, ShieldCheck, CheckCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NextMovement: React.FC = () => {
  const { 
    activeCaseId, triggerSimulationStep, resetSimulation, 
    simState, addToast 
  } = useApp();

  const [selectedAcc, setSelectedAcc] = useState<string>('MULE-B821');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loadingPreds, setLoadingPreds] = useState<boolean>(false);

  const fetchPredictions = async (accNum: string) => {
    setLoadingPreds(true);
    try {
      const res = await fetch(`/api/predictions/next-movement/${accNum}`);
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.predictions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPreds(false);
    }
  };

  useEffect(() => {
    if (selectedAcc) {
      fetchPredictions(selectedAcc);
    }
  }, [selectedAcc, simState.current_step]); // Re-fetch when step updates!

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-950 font-sans">Predicted Next Fund Movement</h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Real-time Markov transaction-hop and routing predictions from high-risk accounts.
          </p>
        </div>

        {/* Account Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Select Source Account:</span>
          <select 
            value={selectedAcc}
            onChange={(e) => setSelectedAcc(e.target.value)}
            className="border border-slate-250 p-1.5 rounded font-mono bg-white focus:outline-none"
          >
            <option value="MULE-B821">MULE-B821 (Case: CF-2026-00421)</option>
            <option value="MULE-C912">MULE-C912 (Case: CF-2026-00421)</option>
            <option value="MULE-A457">MULE-A457 (Canara Bank)</option>
          </select>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        
        {/* Left: Next movement predictions list */}
        <div className="lg:col-span-8 bg-white p-6 border rounded shadow-sm space-y-5">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <span className="text-[10px] font-mono text-slate-400">Current Node Location</span>
              <h3 className="font-mono font-extrabold text-navy-950 text-base">{selectedAcc}</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {selectedAcc === 'MULE-B821' ? 'Current balance linked to case: ₹60,000' : 
                 selectedAcc === 'MULE-C912' ? 'Current balance linked to case: ₹40,000' : 'Analyzing standard routing'}
              </p>
            </div>
            
            <span className="bg-navy-900 text-white font-mono text-[9.5px] px-2 py-0.5 rounded">
              PROTOTYPE PREDICTION ENGINE
            </span>
          </div>

          {/* Predictions list */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">Most Likely Next Destinations:</h4>
            
            {loadingPreds ? (
              <div className="p-6 text-center text-slate-400">Recalculating routing tree...</div>
            ) : (
              predictions.map((pred, i) => (
                <div key={i} className="p-3 border rounded bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-extrabold text-navy-950 text-xs">{pred.target_entity}</span>
                      <span className={`px-1.5 py-0.25 font-bold rounded uppercase text-[8.5px] ${
                        pred.target_type === 'ATM' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-750 border border-blue-100'
                      }`}>
                        {pred.target_type}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10px] max-w-lg leading-relaxed">{pred.explanation}</p>
                    
                    {/* Progress Bar representing probability percentage */}
                    <div className="w-64 h-1 bg-slate-200 rounded-full mt-1.5">
                      <div 
                        className={`h-full rounded-full ${pred.target_type === 'ATM' ? 'bg-red-500' : 'bg-blue-600'}`} 
                        style={{ width: `${pred.probability * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-base font-mono font-extrabold text-navy-950">{(pred.probability * 100).toFixed(0)}%</span>
                    <p className="text-[9px] text-slate-400 font-mono">Transition P</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Why this prediction explainers */}
          <div className="space-y-2 border-t pt-4">
            <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">Feature Contribution Vectors</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { name: 'Historical pattern', pct: '35%' },
                { name: 'Transaction velocity', pct: '20%' },
                { name: 'Account relationships', pct: '25%' },
                { name: 'Amount similarity', pct: '15%' },
                { name: 'Proximity delay', pct: '5%' }
              ].map((feat, idx) => (
                <div key={idx} className="p-2 bg-slate-50 rounded border text-center">
                  <div className="font-bold text-navy-950 font-mono">{feat.pct}</div>
                  <div className="text-[9px] text-slate-405 font-medium leading-tight mt-0.5">{feat.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-2.5 rounded flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <p className="text-blue-800 text-[10px] leading-relaxed">
              <strong>Interactive update:</strong> Predictions are continuously updated when new transaction events arrive. Case sequences are modeled dynamically.
            </p>
          </div>

        </div>

        {/* Right: Simulation Controller Panel */}
        <div className="lg:col-span-4 bg-white p-5 border rounded shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-950 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-orange-500" />
                Live Command Console
              </h3>
              <p className="text-slate-500 text-[10.5px] mt-0.5 leading-relaxed">
                Test risk-mitigation routes and verify that system alarms adjust instantly as simulated flows hit banking entities.
              </p>
            </div>

            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-800 space-y-1">
              <div className="font-bold uppercase tracking-wider text-[9px]">Simulation Status</div>
              <div className="font-semibold">Step {simState.current_step} of {simState.total_steps}</div>
              <p className="text-[10px] text-red-600 font-mono">"{simState.last_event}"</p>
            </div>

            {/* Diagnostic check list */}
            <div className="bg-slate-50 p-3 rounded border space-y-2 text-[10.5px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Active Case Target:</span>
                <span className="font-mono font-bold text-slate-800">{activeCaseId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Live Graph Sync:</span>
                <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.25 rounded font-bold border border-emerald-100">SYNCED</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">WS Connection:</span>
                <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.25 rounded font-bold border border-emerald-100">ONLINE</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-6 border-t mt-4">
            <button 
              onClick={triggerSimulationStep}
              disabled={simState.current_step >= 5}
              className={`w-full py-2.5 text-white font-bold rounded text-xs transition-colors flex items-center justify-center gap-1.5 ${
                simState.current_step >= 5 ? 'bg-slate-350 cursor-not-allowed' : 'bg-red-700 hover:bg-red-650'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              GENERATE NEXT TRANSACTION
            </button>
            <button 
              onClick={resetSimulation}
              className="w-full py-2 bg-white border border-slate-250 text-slate-600 font-bold rounded text-xs hover:bg-slate-50 transition-colors"
            >
              Reset Simulation State
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
export default NextMovement;
