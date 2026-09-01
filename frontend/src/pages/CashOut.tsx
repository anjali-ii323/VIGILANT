import React, { useState } from 'react';
import { MapPin, ShieldAlert, Radio, Clock, Filter, AlertTriangle, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LeafletMap } from '../components/LeafletMap';

export const CashOut: React.FC = () => {
  const { activeCaseId, addToast, logAudit } = useApp();

  const [riskFilter, setRiskFilter] = useState('ALL');
  const [selectedAtm, setSelectedAtm] = useState<string>('ATM-Z03');

  const atms = [
    { atm_id: 'ATM-Z03', location_name: 'ATM Cluster 03 - Dadar West', city: 'Mumbai', latitude: 19.0210, longitude: 72.8424, risk_level: 'CRITICAL', withdrawal_velocity: 480000.0, time_window: '20–40 mins', confidence: '82%', amount: '₹40,000', reason: 'Previous withdrawal pattern matching and short transit time from suspect IP.' },
    { atm_id: 'ATM-Z11', location_name: 'ATM Cluster 11 - Bandra Reclamation', city: 'Mumbai', latitude: 19.0425, longitude: 72.8368, risk_level: 'HIGH', withdrawal_velocity: 350000.0, time_window: '35–55 mins', confidence: '74%', amount: '₹80,000', reason: 'Repeated ATM withdrawal velocity spikes observed on linked cards.' },
    { atm_id: 'ATM-Z07', location_name: 'ATM Cluster 07 - Kurla East', city: 'Mumbai', latitude: 19.0600, longitude: 72.8730, risk_level: 'HIGH', withdrawal_velocity: 290000.0, time_window: '15–30 mins', confidence: '82%', amount: '₹20,000', reason: 'Short transit time from suspect IP address registered in Kurla precinct.' },
    { atm_id: 'ATM-Z09', location_name: 'ATM Cluster 09 - Andheri West Station', city: 'Mumbai', latitude: 19.1190, longitude: 72.8470, risk_level: 'CRITICAL', withdrawal_velocity: 520000.0, time_window: '10–25 mins', confidence: '91%', amount: '₹1,90,000', reason: 'Multi-victim convergent layering nexus with active cash withdrawals.' },
    { atm_id: 'ATM-Z05', location_name: 'ATM Cluster 05 - Borivali West Sector 4', city: 'Mumbai', latitude: 19.2300, longitude: 72.8570, risk_level: 'MEDIUM', withdrawal_velocity: 180000.0, time_window: '45–70 mins', confidence: '62%', amount: '₹90,000', reason: 'Structuring split transactions routing to Borivali outlet.' }
  ];

  const filteredAtms = atms.filter(a => {
    if (riskFilter === 'CRITICAL') return a.risk_level === 'CRITICAL';
    if (riskFilter === 'HIGH') return a.risk_level === 'HIGH';
    if (riskFilter === 'MEDIUM') return a.risk_level === 'MEDIUM';
    return true;
  });

  const currentAtmObj = atms.find(a => a.atm_id === selectedAtm) || atms[0];

  const handleDispatch = (atm: any) => {
    addToast("Patrol Intercept Transmitted", `Dispatched priority tactical alert to local precinct near ${atm.location_name}.`, "warning");
    logAudit("PATROL_DISPATCHED", `Dispatched interception advisory for ${atm.atm_id} (${atm.location_name}).`);
  };

  return (
    <div className="space-y-6 animate-fade-in text-text-primary font-sans pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border-subtle pb-4 gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-muted block mb-0.5">
            GEOSPATIAL PHYSICAL EXTRACTION FORECAST
          </span>
          <h1 className="text-2xl md:text-3xl font-light text-text-primary">
            Cash-Out Intelligence Map
          </h1>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-mono">Filter:</span>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-canvas-900 border border-border-subtle rounded text-xs font-mono text-steel-400 font-semibold focus:outline-none focus:border-steel-500"
          >
            <option value="ALL">ALL RISK CLUSTERS ({atms.length})</option>
            <option value="CRITICAL">CRITICAL RISK ONLY</option>
            <option value="HIGH">HIGH RISK ONLY</option>
            <option value="MEDIUM">MEDIUM RISK ONLY</option>
          </select>
        </div>
      </div>

      {/* Main Map & Side Panel Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Map Viewport (Occupies 8 Cols) */}
        <div className="lg:col-span-8 bg-canvas-900 border border-border-subtle rounded p-3 flex flex-col space-y-2">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2 px-1">
            <span className="text-xs font-medium text-text-primary flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-steel-400 stroke-[1.7]" />
              Geocoded ATM Clusters & Withdrawal Heat Zones
            </span>
            <span className="text-[9px] font-mono text-text-muted">OPENSTREETMAP &middot; LOCAL ENGINE</span>
          </div>

          <div className="h-[480px] w-full rounded overflow-hidden">
            <LeafletMap
              atms={filteredAtms}
              selectedAtmId={selectedAtm}
              onSelectAtm={(id) => setSelectedAtm(id)}
            />
          </div>
        </div>

        {/* Right Intelligence Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          
          <div className="p-5 bg-canvas-900 border border-border-subtle rounded space-y-4">
            <div className="flex items-start justify-between border-b border-border-subtle pb-3">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-wider text-text-muted block">
                  POTENTIAL CASH-OUT ZONE
                </span>
                <h3 className="font-semibold text-sm text-text-primary font-sans mt-0.5">{currentAtmObj.location_name}</h3>
                <span className="text-xs text-text-muted font-mono">{currentAtmObj.atm_id} &middot; {currentAtmObj.city}</span>
              </div>
              <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-mono font-medium ${
                currentAtmObj.risk_level === 'CRITICAL' ? 'bg-threat-critical/15 text-threat-critical border border-threat-critical/30' : 'bg-threat-high/15 text-threat-high border border-threat-high/30'
              }`}>
                {currentAtmObj.risk_level}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 bg-canvas-950 border border-border-subtle rounded space-y-0.5">
                <span className="text-[8.5px] text-text-muted uppercase block">CASH-OUT RISK</span>
                <span className="text-xl font-semibold text-threat-critical">{currentAtmObj.confidence}</span>
              </div>
              <div className="p-3 bg-canvas-950 border border-border-subtle rounded space-y-0.5">
                <span className="text-[8.5px] text-text-muted uppercase block">EST. WINDOW</span>
                <span className="text-xl font-semibold text-steel-400">{currentAtmObj.time_window}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[9.5px] font-mono uppercase text-text-muted block">Contributing Factors</span>
              <div className="space-y-1 text-xs text-text-secondary font-sans bg-canvas-950 p-3 rounded border border-border-subtle leading-relaxed">
                <p>&bull; Previous withdrawal pattern correlation</p>
                <p>&bull; Transaction velocity anomaly</p>
                <p>&bull; Distance proximity to registered device IP</p>
                <p>&bull; Historical timing intervals</p>
              </div>
            </div>

            <button
              onClick={() => handleDispatch(currentAtmObj)}
              className="w-full py-2 bg-threat-critical/90 hover:bg-threat-critical text-white font-medium font-sans text-xs rounded transition-colors flex items-center justify-center gap-1.5 mt-2"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Dispatch Local Patrol Alert</span>
            </button>
          </div>

          <div className="p-3.5 bg-canvas-900 border border-border-subtle rounded flex items-center gap-2.5 text-xs text-text-muted font-sans leading-relaxed">
            <AlertTriangle className="w-3.5 h-3.5 text-text-secondary shrink-0" />
            <span>Illustrative synthetic case data &middot; SIH Problem 26184</span>
          </div>

        </div>

      </div>

    </div>
  );
};

export default CashOut;
