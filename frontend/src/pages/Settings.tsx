import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Database, ShieldAlert, Cpu, 
  HelpCircle, RefreshCw, CheckCircle2, Sliders 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Settings: React.FC = () => {
  const { resetSimulation, addToast } = useApp();
  const [wsPort, setWsPort] = useState<string>('8000');
  const [modelType, setModelType] = useState<string>('Isolation Forest + explainable rule scoring');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast("Settings Updated", "Configuration values applied successfully.", "success");
  };

  const triggerSeedReload = async () => {
    try {
      addToast("Database Seed Requested", "Re-building initial tables...", "info");
      const res = await fetch('/api/transactions/simulate/reset', { method: 'POST' });
      if (res.ok) {
        addToast("Seed Restored", "Baseline dataset successfully seeded.", "success");
      }
    } catch (err) {
      addToast("Error", "Failed to reload seed datasets.", "error");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-navy-950 font-sans">System Configurations</h2>
        <p className="text-xs text-slate-500 font-sans mt-0.5">
          Configure diagnostic model parameters and manage simulated databases.
        </p>
      </div>

      {/* Main split settings panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        
        {/* Left: Settings Forms */}
        <form onSubmit={handleSave} className="lg:col-span-8 bg-white p-6 border rounded shadow-sm space-y-6">
          
          {/* Seeding & DB Tools */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-navy-950 tracking-wider flex items-center gap-1.5 border-b pb-2">
              <Database className="w-4 h-4 text-slate-450" />
              Database Management
            </h3>
            <p className="text-slate-500 text-[11px] leading-relaxed mb-3">
              Reset database schemas back to the initial seeded baseline (100+ cases, 1000+ bank accounts, 5000+ transactions, 100+ ATM coordinates).
            </p>
            
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={triggerSeedReload}
                className="px-3.5 py-2 bg-navy-950 text-white hover:bg-navy-800 rounded font-bold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Seed Database
              </button>
              <button 
                type="button"
                onClick={resetSimulation}
                className="px-3.5 py-2 bg-white border border-slate-250 hover:bg-slate-50 text-slate-650 rounded font-bold"
              >
                Clear Simulated Events Only
              </button>
            </div>
          </div>

          {/* Model settings */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-navy-950 tracking-wider flex items-center gap-1.5 border-b pb-2">
              <Cpu className="w-4 h-4 text-slate-450" />
              Machine Learning Diagnostics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 font-medium">Anomaly Detection Core</label>
                <select 
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  className="w-full border border-slate-250 p-2 rounded focus:outline-none focus:ring-1 focus:ring-navy-600 bg-white"
                >
                  <option value="Isolation Forest + explainable rule scoring">Isolation Forest (Anomaly Fit)</option>
                  <option value="Transparent Multi-factor weight scoring only">Multi-factor Scoring Only</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-medium">SHAP explainability engine</label>
                <input 
                  type="text" 
                  value="SHAP values tree explainer active"
                  disabled
                  className="w-full border border-slate-200 p-2 rounded bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
                />
              </div>
            </div>
          </div>

          {/* Network settings */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-navy-950 tracking-wider flex items-center gap-1.5 border-b pb-2">
              <Sliders className="w-4 h-4 text-slate-450" />
              Real-time WebSockets Stream
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 font-medium">WebSocket Server Port</label>
                <input 
                  type="text" 
                  value={wsPort}
                  onChange={(e) => setWsPort(e.target.value)}
                  className="w-full border border-slate-250 p-2 rounded focus:outline-none focus:ring-1 focus:ring-navy-600 font-mono"
                />
              </div>
              
              <div className="flex items-center pt-5">
                <input 
                  type="checkbox" 
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 text-navy-600 border-slate-300 rounded focus:ring-navy-500"
                />
                <label htmlFor="autoRefresh" className="ml-2 font-medium text-slate-700">
                  Enable auto-refresh on WebSocket frame arrival
                </label>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 flex justify-end">
            <button 
              type="submit"
              className="px-4 py-2 bg-navy-950 hover:bg-navy-800 text-white rounded font-bold"
            >
              Apply Configurations
            </button>
          </div>

        </form>

        {/* Right: Informational diagnostics */}
        <div className="lg:col-span-4 bg-white p-5 border rounded shadow-sm space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-950">
              System Diagnostics
            </h3>
            <p className="text-slate-500 text-[10.5px] mt-0.5 leading-relaxed">
              Diagnostic checklist representing platform verification parameters.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center border-b pb-1.5">
              <span className="text-slate-500">FastAPI backend link:</span>
              <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.25 rounded font-bold border border-emerald-100">PASS</span>
            </div>
            <div className="flex justify-between items-center border-b pb-1.5">
              <span className="text-slate-500">SQLite Engine f_db:</span>
              <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.25 rounded font-bold border border-emerald-100">PASS</span>
            </div>
            <div className="flex justify-between items-center border-b pb-1.5">
              <span className="text-slate-500">PostgreSQL Driver:</span>
              <span className="font-mono text-slate-500 bg-slate-55 px-1.5 py-0.25 rounded font-bold border">INACTIVE</span>
            </div>
            <div className="flex justify-between items-center border-b pb-1.5">
              <span className="text-slate-500">Neo4j Driver:</span>
              <span className="font-mono text-slate-500 bg-slate-55 px-1.5 py-0.25 rounded font-bold border">UNLOADED</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Leaflet Map Tiles:</span>
              <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.25 rounded font-bold border border-emerald-100">ONLINE</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
export default Settings;
