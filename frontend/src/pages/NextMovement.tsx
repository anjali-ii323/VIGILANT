import React from 'react';
import { Compass, Zap, ArrowRight, TrendingUp, CheckCircle2, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NextMovement: React.FC = () => {
  const { 
    activeCaseId, 
    accounts, 
    triggerSimulationStep, 
    resetSimulation,
    simState 
  } = useApp();

  const currentMule = accounts.find(a => a.account_number === 'MULE-B821') || accounts.find(a => a.is_mule) || accounts[0];

  const candidateHops = [
    { target: 'C912', label: 'Union Bank Account C912', prob: 78, amount: '₹35,000', type: 'Primary Mule Hop', reason: 'Previous historical sequence correlation and velocity timing match.' },
    { target: 'D441', label: 'SBI Secondary Account D441', prob: 13, amount: '₹15,000', type: 'Secondary Hop', reason: 'Secondary outflow route observed in related mule syndicate clusters.' },
    { target: 'ATM-Z04', label: 'ATM Cluster 04 (Bandra West)', prob: 6, amount: '₹26,000', type: 'Direct Cash-Out', reason: 'Direct ATM terminal withdrawal link.' },
    { target: 'Other', label: 'Other Virtual Gateways / Wallets', prob: 3, amount: '₹10,000', type: 'Virtual Bridge', reason: 'Alternative off-ramp evasion attempt.' }
  ];

  return (
    <div className="space-y-10 animate-fade-in text-text-primary font-sans pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border-subtle pb-6 gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-muted block mb-0.5">
            PROBABILISTIC DESTINATION FORECASTING &middot; {activeCaseId}
          </span>
          <h1 className="text-2xl md:text-3xl font-light text-text-primary">
            Where could the money move next?
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetSimulation}
            className="px-3.5 py-1.5 bg-canvas-900 hover:bg-canvas-850 border border-border-subtle text-text-secondary font-mono text-xs rounded transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Flow</span>
          </button>

          <button
            onClick={triggerSimulationStep}
            className="px-4 py-1.5 bg-steel-500 hover:bg-steel-600 text-white font-medium text-xs rounded transition-colors flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Generate Next Transaction</span>
          </button>
        </div>
      </div>

      {/* Observation Account Card */}
      <div className="p-5 bg-canvas-900 border border-border-subtle rounded grid grid-cols-1 md:grid-cols-3 gap-6 items-center font-mono">
        
        <div className="space-y-1">
          <span className="text-[9px] text-text-muted uppercase block">CURRENT ACCOUNT UNDER OBSERVATION</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg text-text-primary">{currentMule?.account_number || 'B821'}</span>
            <span className="px-1.5 py-0.2 rounded text-[8px] font-medium bg-threat-high/15 text-threat-high border border-threat-high/20">
              LAYER 2 MULE
            </span>
          </div>
          <span className="text-xs text-text-secondary font-sans block">{currentMule?.holder_name} &middot; {currentMule?.bank_name}</span>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] text-text-muted uppercase block">FUNDS UNDER OBSERVATION</span>
          <span className="text-xl font-semibold text-steel-400">₹60,000</span>
          <span className="text-[8.5px] text-text-muted block font-sans">Received from Canara Bank MULE-A457</span>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] text-text-muted uppercase block">LIKELY DESTINATION CONFIDENCE</span>
          <span className="text-xl font-semibold text-emerald-400">78% PROBABILITY</span>
          <span className="text-[8.5px] text-text-muted block font-sans">Lead time window: 25 minutes</span>
        </div>

      </div>

      {/* Probability Ranked Destination List */}
      <div className="space-y-4">
        <span className="text-xs font-mono uppercase tracking-wider text-text-muted block">
          Probability Ranked Next Destination Hops
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
          {candidateHops.map((hop, idx) => (
            <div
              key={hop.target}
              className={`p-5 rounded border transition-colors space-y-3 ${
                idx === 0
                  ? 'bg-canvas-850 border-steel-500/40'
                  : 'bg-canvas-900 border-border-subtle'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-xs font-semibold text-text-primary">{hop.target}</span>
                    <span className="px-1.5 py-0.2 rounded text-[8px] text-text-muted bg-canvas-950 border border-border-subtle">
                      {hop.type}
                    </span>
                    {idx === 0 && (
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-semibold bg-steel-500/20 text-steel-300 border border-steel-500/30">
                        PRIMARY PREDICTION
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-secondary block mt-1">{hop.label}</span>
                </div>

                <span className={`text-2xl font-mono font-semibold ${idx === 0 ? 'text-steel-400' : 'text-text-secondary'}`}>
                  {hop.prob}%
                </span>
              </div>

              {/* Progress Line */}
              <div className="w-full bg-canvas-950 rounded-full h-1 overflow-hidden">
                <div
                  className={`h-full rounded-full ${idx === 0 ? 'bg-steel-500' : 'bg-canvas-750'}`}
                  style={{ width: `${hop.prob}%` }}
                />
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">
                {hop.reason}
              </p>

              <div className="pt-2 border-t border-border-subtle flex justify-between items-center text-[10px] font-mono text-text-muted">
                <span>Predicted Volume: <strong className="text-text-primary">{hop.amount}</strong></span>
                <span>Markov Matrix</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WHY THIS PREDICTION HEURISTICS */}
      <div className="p-5 bg-canvas-900 border border-border-subtle rounded space-y-3 font-sans text-xs">
        <h3 className="font-semibold text-xs text-text-primary font-mono uppercase tracking-wider">
          Why this prediction? &middot; Heuristic Rationale
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-canvas-950 rounded border border-border-subtle space-y-1">
            <span className="text-[9px] text-text-muted uppercase block">Historical Relationship</span>
            <span className="text-text-secondary font-sans text-xs block">Account B821 transferred to C912 in 84% of previous tracked incidents.</span>
          </div>
          <div className="p-3 bg-canvas-950 rounded border border-border-subtle space-y-1">
            <span className="text-[9px] text-text-muted uppercase block">Amount Similarity</span>
            <span className="text-text-secondary font-sans text-xs block">Split quantum of ₹35,000 matches typical retail velocity limits.</span>
          </div>
          <div className="p-3 bg-canvas-950 rounded border border-border-subtle space-y-1">
            <span className="text-[9px] text-text-muted uppercase block">Transaction Timing</span>
            <span className="text-text-secondary font-sans text-xs block">Dispersal window typically triggered 12–20 minutes post inflow.</span>
          </div>
          <div className="p-3 bg-canvas-950 rounded border border-border-subtle space-y-1">
            <span className="text-[9px] text-text-muted uppercase block">Account Behaviour</span>
            <span className="text-text-secondary font-sans text-xs block">Zero balance holding pattern consistent with transit mule.</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default NextMovement;
