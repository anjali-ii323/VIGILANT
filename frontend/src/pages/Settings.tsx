import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Database, Cpu, RefreshCw, CheckCircle2 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Settings: React.FC = () => {
  const { resetSimulation, addToast } = useApp();
  const [wsPort, setWsPort] = useState<string>('8000');
  const [modelType, setModelType] = useState<string>('Isolation Forest + Explainable rule scoring');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast("Settings Applied", "Configuration values applied successfully.", "success");
  };

  const triggerSeedReload = async () => {
    try {
      addToast("Database Reset", "Re-seeding initial 20-case dataset...", "info");
      await resetSimulation();
      addToast("Baseline Restored", "SQLite dataset reset to baseline state.", "success");
    } catch (err) {
      addToast("Error", "Failed to reload seed datasets.", "error");
    }
  };

  return (
    <div className="space-y-10 animate-fade-in text-text-primary font-sans pb-16">
      
      {/* Header */}
      <div className="border-b border-border-subtle pb-6">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-muted block mb-0.5">
          PLATFORM CONFIGURATION & DIAGNOSTICS
        </span>
        <h1 className="text-2xl md:text-3xl font-light text-text-primary">
          System Settings & Model Parameters
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs font-sans">
        
        {/* Left Form */}
        <form onSubmit={handleSave} className="lg:col-span-8 bg-canvas-900 p-6 border border-border-subtle rounded space-y-6">
          
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-text-primary font-mono tracking-wider flex items-center gap-2 border-b border-border-subtle pb-2">
              <Database className="w-3.5 h-3.5 text-steel-400" />
              Database Management
            </h3>
            <p className="text-text-secondary text-xs leading-relaxed">
              Reset database schemas back to the initial seeded baseline (20 complete synthetic cases with realistic multi-bank layering chains, ATMs, and KYC ledgers).
            </p>
            
            <div className="flex gap-2 pt-1">
              <button 
                type="button"
                onClick={triggerSeedReload}
                className="px-3.5 py-1.5 bg-canvas-850 hover:bg-canvas-800 border border-border-subtle text-text-secondary hover:text-text-primary font-mono text-xs rounded transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Simulation to Baseline</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border-subtle">
            <h3 className="text-xs font-semibold uppercase text-text-primary font-mono tracking-wider flex items-center gap-2 border-b border-border-subtle pb-2">
              <Cpu className="w-3.5 h-3.5 text-steel-400" />
              Machine Learning Heuristic Engine
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[9.5px] text-text-muted font-mono uppercase mb-1">
                  Active Anomaly Detection Architecture
                </label>
                <select 
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  className="w-full p-2 bg-canvas-950 border border-border-subtle rounded text-xs font-mono text-text-primary focus:outline-none focus:border-steel-500"
                >
                  <option>Isolation Forest + Explainable Rule Scoring (Recommended)</option>
                  <option>Graph Convolutional Network (GCN) Layer Prototype</option>
                  <option>Random Forest Ensemble Classifier</option>
                </select>
              </div>

              <div>
                <label className="block text-[9.5px] text-text-muted font-mono uppercase mb-1">
                  WebSocket Telemetry Service Port
                </label>
                <input 
                  type="text" 
                  value={wsPort}
                  onChange={(e) => setWsPort(e.target.value)}
                  className="w-full p-2 bg-canvas-950 border border-border-subtle rounded text-xs font-mono text-text-primary focus:outline-none focus:border-steel-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border-subtle flex justify-end">
            <button
              type="submit"
              className="px-4 py-1.5 bg-steel-500 hover:bg-steel-600 text-white font-medium text-xs rounded transition-colors"
            >
              Apply Configurations
            </button>
          </div>
        </form>

        {/* Right Info Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 bg-canvas-900 border border-border-subtle rounded space-y-3">
            <span className="text-[9.5px] font-mono uppercase text-text-muted block">
              PLATFORM VERIFICATION
            </span>
            <div className="space-y-2 text-xs text-text-secondary">
              <div className="flex justify-between">
                <span>Version:</span>
                <span className="font-mono text-text-primary">VIGILANT 2.4.0</span>
              </div>
              <div className="flex justify-between">
                <span>Environment:</span>
                <span className="font-mono text-emerald-400">SYNTHETIC SIMULATION</span>
              </div>
              <div className="flex justify-between">
                <span>Problem Statement:</span>
                <span className="font-mono text-steel-400">SIH 26184</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Settings;
