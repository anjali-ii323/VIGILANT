import React, { useState, useEffect } from 'react';
import { 
  Compass, AlertTriangle, Info, MapPin, Landmark, Clock, 
  User, CheckCircle, RefreshCw, BarChart 
} from 'lucide-react';
import { LeafletMap, ATMZone } from '../components/LeafletMap';
import { useApp } from '../context/AppContext';

export const CashOut: React.FC = () => {
  const { activeCaseId, simState } = useApp();
  const [zones, setZones] = useState<ATMZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<ATMZone | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${activeCaseId}/cashout`);
      if (res.ok) {
        const data = await res.json();
        setZones(data);
        
        // Auto-select the critical or high threat ATM linked to the active case
        const criticalAtm = data.find((z: ATMZone) => z.risk_level === 'CRITICAL' || z.risk_level === 'HIGH');
        if (criticalAtm) {
          setSelectedZone(criticalAtm);
        } else if (data.length > 0) {
          setSelectedZone(data[0]);
        }
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

  const handleSelectZone = (zone: ATMZone) => {
    setSelectedZone(zone);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-navy-950 font-sans">Potential Cash-Out Intelligence</h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Geographic profiling of ATMs with active cash withdrawal prediction indexes.
          </p>
        </div>
        
        <button 
          onClick={fetchZones}
          className="hover:bg-slate-100 p-1.5 rounded border text-slate-600"
          title="Reload ATM States"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        
        {/* Left: Interactive Leaflet Map */}
        <div className="lg:col-span-8 bg-white p-4 border rounded shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">ATM Location Mapping</span>
            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wide font-mono">
              ⚠️ Illustrative synthetic case data — not a real-world prediction.
            </span>
          </div>

          <div className="h-[380px] w-full z-0">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center bg-slate-50 text-slate-400">
                Updating coordinates...
              </div>
            ) : (
              <LeafletMap 
                zones={zones} 
                onSelectZone={handleSelectZone}
                selectedZoneId={selectedZone?.id || null}
              />
            )}
          </div>
        </div>

        {/* Right: Selected ATM Threat Profile */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          {selectedZone ? (
            <div className="bg-white p-5 border rounded shadow-sm space-y-4 flex-1 flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <span className="text-[9px] font-mono font-bold text-slate-400">ATM Cluster Registry</span>
                  <h3 className="font-sans font-bold text-sm text-navy-950">{selectedZone.location_name}</h3>
                  <div className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedZone.risk_level === 'CRITICAL' ? 'bg-red-50 text-red-800 border border-red-200' :
                    selectedZone.risk_level === 'HIGH' ? 'bg-orange-50 text-orange-850 border border-orange-200' : 'bg-slate-100 text-slate-700'
                  }`}>
                    Risk: {selectedZone.risk_score}% ({selectedZone.risk_level})
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500"><MapPin className="w-3.5 h-3.5 inline text-slate-450 mr-1" /> ATM ID:</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedZone.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Geopoint coordinates:</span>
                    <span className="font-mono text-slate-800">
                      {selectedZone.latitude.toFixed(4)}N, {selectedZone.longitude.toFixed(4)}E
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> Withdrawal window:</span>
                    <span className="font-bold text-slate-900 bg-amber-50 px-1.5 py-0.25 border border-amber-100 rounded">
                      {selectedZone.predicted_window_mins} minutes
                    </span>
                  </div>
                  
                  {/* Contributing Factors checks */}
                  <div className="border-t pt-3 mt-1.5 space-y-2">
                    <span className="font-bold text-slate-750 uppercase text-[9px] tracking-wider block mb-1">
                      Predictive Threat Weights
                    </span>
                    {Object.entries(selectedZone.factors).map(([factor, weight]) => (
                      <div key={factor} className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">{factor}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${weight}%` }} />
                          </div>
                          <span className="font-mono font-bold text-slate-700 w-6 text-right">{weight}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {selectedZone.risk_level === 'CRITICAL' && (
                <div className="space-y-1.5 pt-4 border-t">
                  <div className="p-2 bg-red-50 border border-red-100 rounded text-red-800 text-[10px] leading-relaxed mb-1">
                    🚨 <strong>Alert active:</strong> Incident responders are dispatched. local banks are notified to halt bulk ATM cash replenishment.
                  </div>
                  <button className="w-full py-2 bg-navy-950 text-white font-bold rounded text-xs hover:bg-navy-800 flex items-center justify-center gap-1">
                    Send Local Response Alert
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed rounded p-6 flex flex-col justify-center items-center text-center text-slate-400 flex-1 min-h-[300px]">
              <Compass className="w-8 h-8 text-slate-350 mb-2 stroke-[1.5]" />
              <h3 className="font-bold text-xs text-slate-500">No ATM Inspected</h3>
              <p className="text-[10px] text-slate-400 max-w-[200px] mt-0.5">
                Click any flashing circle marker in the Mumbai Map Viewport to inspect cash-out velocities and time-window matrices.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
export default CashOut;
