import React, { useState } from 'react';
import { X, ShieldCheck, Search, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const { auditLogs } = useApp();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  if (!isOpen) return null;

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !search || 
      log.details.toLowerCase().includes(search.toLowerCase()) || 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.case_id && log.case_id.toLowerCase().includes(search.toLowerCase()));
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-canvas-950/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-3xl bg-canvas-900 border border-border-strong text-text-primary rounded flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-canvas-950 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-canvas-850 border border-border-strong flex items-center justify-center text-steel-400">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[1.7]" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-text-primary tracking-wide">Judicial Audit Trail</h3>
              <p className="text-[9.5px] text-text-muted font-mono">Immutable Action Ledger</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-canvas-850">
            <X className="w-4 h-4 stroke-[1.7]" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 bg-canvas-900 border-b border-border-subtle grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          <div className="md:col-span-8 relative">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by action, keyword, or Case ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-canvas-950 border border-border-subtle rounded text-xs font-mono text-text-primary focus:outline-none focus:border-steel-500"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-canvas-950 border border-border-subtle rounded text-xs font-mono text-text-secondary focus:outline-none focus:border-steel-500"
            >
              <option value="ALL">ALL ACTIONS</option>
              <option value="SESSION_INITIALIZED">SESSION INITIALIZED</option>
              <option value="CASE_OPENED">CASE OPENED</option>
              <option value="INTERVENTION_CREATED">INTERVENTION CREATED</option>
              <option value="NOTE_ADDED">NOTE ADDED</option>
              <option value="PREDICTION_REFRESHED">PREDICTION REFRESHED</option>
              <option value="WATCHLIST_ADDED">WATCHLIST ADDED</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs font-mono">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div key={log.log_id} className="p-3 bg-canvas-850 border border-border-subtle rounded space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-steel-400">{log.action}</span>
                    {log.case_id && (
                      <span className="px-1.5 py-0.2 bg-canvas-950 border border-border-subtle text-text-secondary rounded text-[9px]">
                        {log.case_id}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-text-muted text-[9.5px]">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.timestamp).toLocaleTimeString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-[11px] text-text-secondary font-sans leading-relaxed">
                  {log.details}
                </p>

                <div className="flex justify-between items-center text-[8.5px] text-text-muted pt-1 border-t border-border-subtle">
                  <span>Officer: <strong className="text-text-primary">{log.officer}</strong></span>
                  <span>IP: {log.ip_address}</span>
                  <span>ID: {log.log_id}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-text-muted border border-border-subtle rounded">
              No matching audit logs found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-canvas-950 border-t border-border-subtle flex justify-between items-center text-[9.5px] font-mono text-text-muted">
          <span>Cryptographically Hashed Record Ledger</span>
          <span>{filteredLogs.length} Records</span>
        </div>

      </div>
    </div>
  );
};
