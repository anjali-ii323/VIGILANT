import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, ShieldAlert, ArrowRight, CheckCircle2, AlertTriangle, 
  Lock, Clock, Filter
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AlertCenter: React.FC = () => {
  const navigate = useNavigate();
  const { alerts, setActiveCaseId, createIntervention, addToast, logAudit } = useApp();

  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedAlertForIntervene, setSelectedAlertForIntervene] = useState<any>(null);
  const [interveneReason, setInterveneReason] = useState('Immediate fund containment requested following threshold alarm.');

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter === 'CRITICAL') return a.severity === 'CRITICAL';
    if (severityFilter === 'WARNING') return a.severity === 'WARNING';
    if (severityFilter === 'INFO') return a.severity === 'INFO';
    return true;
  });

  const handleInterveneSubmit = async () => {
    if (!selectedAlertForIntervene) return;
    await createIntervention(
      selectedAlertForIntervene.account_number,
      "NPCI_LE_INTERCEPT_GATEWAY",
      "FREEZE_ACCOUNT",
      interveneReason
    );
    setSelectedAlertForIntervene(null);
  };

  return (
    <div className="space-y-10 animate-fade-in text-text-primary font-sans pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border-subtle pb-6 gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-muted block mb-0.5">
            OPERATIONAL THREAT QUEUE
          </span>
          <h1 className="text-2xl md:text-3xl font-light text-text-primary">
            Alert Command Center
          </h1>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-mono">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-canvas-900 border border-border-subtle rounded text-xs font-mono text-steel-400 font-semibold focus:outline-none focus:border-steel-500"
          >
            <option value="ALL">ALL ALERTS ({alerts.length})</option>
            <option value="CRITICAL">CRITICAL ONLY</option>
            <option value="WARNING">WARNING ONLY</option>
            <option value="INFO">INFO ONLY</option>
          </select>
        </div>
      </div>

      {/* Clean Chronological Operational Feed */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((al) => {
            const isCrit = al.severity === 'CRITICAL';
            return (
              <div
                key={al.alert_id}
                className="p-4 bg-canvas-900 border border-border-subtle rounded transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 font-mono">
                    <span className={`px-1.5 py-0.2 rounded text-[8px] font-semibold ${
                      isCrit ? 'bg-threat-critical/20 text-threat-critical border border-threat-critical/30' : 'bg-threat-high/20 text-threat-high border border-threat-high/30'
                    }`}>
                      {al.severity}
                    </span>
                    <span className="font-semibold text-xs text-text-primary font-sans">{al.title}</span>
                    <span className="text-[9.5px] text-text-muted">
                      {al.case_id}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed font-sans">
                    {al.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[9.5px] font-mono text-text-muted pt-0.5">
                    <span>Node: <strong className="text-text-primary">{al.account_number}</strong></span>
                    <span>Disputed: <strong className="text-steel-400">₹{al.amount_at_risk?.toLocaleString('en-IN')}</strong></span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(al.timestamp).toLocaleTimeString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setActiveCaseId(al.case_id);
                      navigate('/cases');
                    }}
                    className="px-2.5 py-1 bg-canvas-850 hover:bg-canvas-800 border border-border-subtle text-text-secondary text-xs rounded transition-colors"
                  >
                    View Case
                  </button>

                  <button
                    onClick={() => {
                      setActiveCaseId(al.case_id);
                      navigate('/network');
                    }}
                    className="px-2.5 py-1 bg-canvas-850 hover:bg-canvas-800 border border-border-subtle text-text-secondary text-xs rounded transition-colors"
                  >
                    Money Trail
                  </button>

                  <button
                    onClick={() => setSelectedAlertForIntervene(al)}
                    className="px-3 py-1 bg-threat-critical/90 hover:bg-threat-critical text-white font-medium text-xs rounded transition-colors"
                  >
                    Intervene
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-10 text-center text-text-muted border border-border-subtle rounded font-mono text-xs">
            No alerts matching current severity filter.
          </div>
        )}
      </div>

      {/* INTERVENTION MODAL */}
      {selectedAlertForIntervene && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-canvas-950/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="w-full max-w-md bg-canvas-900 border border-border-strong rounded p-6 text-text-primary space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-threat-critical" />
                <h3 className="font-semibold text-sm text-text-primary uppercase">Execute Freeze Intervention</h3>
              </div>
              <button onClick={() => setSelectedAlertForIntervene(null)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Create an automated simulated freeze lock on <strong>{selectedAlertForIntervene.account_number}</strong> for Case <strong>{selectedAlertForIntervene.case_id}</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[9.5px] text-text-muted font-mono uppercase mb-1">Containment Reason *</label>
                <textarea
                  rows={2}
                  value={interveneReason}
                  onChange={(e) => setInterveneReason(e.target.value)}
                  className="w-full p-2 bg-canvas-950 border border-border-subtle rounded text-xs text-text-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
              <button onClick={() => setSelectedAlertForIntervene(null)} className="px-3 py-1.5 text-text-muted text-xs">
                Cancel
              </button>
              <button
                onClick={handleInterveneSubmit}
                className="px-4 py-1.5 bg-threat-critical hover:bg-red-700 text-white font-medium text-xs rounded transition-colors"
              >
                Confirm & Lock Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AlertCenter;
