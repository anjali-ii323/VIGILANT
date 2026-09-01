import React, { useState } from 'react';
import { X, Eye, Plus, Trash2, Landmark } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface WatchlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WatchlistDrawer: React.FC<WatchlistDrawerProps> = ({ isOpen, onClose }) => {
  const { watchlist, toggleWatchlist, addToast } = useApp();
  const [newAcc, setNewAcc] = useState('');
  const [newHolder, setNewHolder] = useState('');
  const [newBank, setNewBank] = useState('');
  const [newReason, setNewReason] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAcc.trim() || !newReason.trim()) {
      addToast("Validation Error", "Account number and surveillance reason are required.", "warning");
      return;
    }
    await toggleWatchlist(newAcc.trim(), newReason.trim(), newHolder.trim(), newBank.trim());
    setNewAcc('');
    setNewHolder('');
    setNewBank('');
    setNewReason('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-[999] flex justify-end bg-canvas-950/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-md bg-canvas-900 border-l border-border-subtle text-text-primary flex flex-col h-full shadow-2xl">
        
        {/* Header */}
        <div className="p-4 bg-canvas-950 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-canvas-850 border border-border-strong flex items-center justify-center text-steel-400">
              <Eye className="w-3.5 h-3.5 stroke-[1.7]" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-text-primary tracking-wide">Surveillance Watchlist</h3>
              <p className="text-[9.5px] text-text-muted font-mono">Priority Intercept Targets</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-canvas-850">
            <X className="w-4 h-4 stroke-[1.7]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          
          {/* Add form trigger */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2 bg-canvas-850 hover:bg-canvas-800 border border-border-subtle hover:border-border-strong text-text-secondary hover:text-text-primary text-xs font-medium rounded flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Account to Watchlist</span>
            </button>
          ) : (
            <form onSubmit={handleAdd} className="p-3 bg-canvas-850 border border-border-strong rounded space-y-3">
              <div className="flex justify-between items-center border-b border-border-subtle pb-1.5">
                <span className="font-semibold text-xs text-text-primary font-mono uppercase">New Target Entity</span>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-text-muted hover:text-text-secondary text-[11px]">Cancel</button>
              </div>

              <div>
                <label className="block text-[9px] text-text-muted font-mono uppercase mb-1">Account Number / ID *</label>
                <input
                  type="text"
                  placeholder="e.g. MULE-C912 or 30291488102"
                  value={newAcc}
                  onChange={(e) => setNewAcc(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-canvas-900 border border-border-subtle rounded text-xs font-mono text-text-primary focus:outline-none focus:border-steel-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] text-text-muted font-mono uppercase mb-1">Holder Name</label>
                  <input
                    type="text"
                    placeholder="Holder Name"
                    value={newHolder}
                    onChange={(e) => setNewHolder(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-canvas-900 border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-steel-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-text-muted font-mono uppercase mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="Bank Institution"
                    value={newBank}
                    onChange={(e) => setNewBank(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-canvas-900 border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-steel-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-text-muted font-mono uppercase mb-1">Surveillance Reason *</label>
                <textarea
                  rows={2}
                  placeholder="Reason for placing under observation..."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-canvas-900 border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-steel-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-steel-500 hover:bg-steel-600 text-white font-medium text-xs rounded transition-colors"
              >
                Enforce Watchlist Tracking
              </button>
            </form>
          )}

          {/* List of Watched Accounts */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted block">
              Monitored Targets ({watchlist.length})
            </span>

            {watchlist.length > 0 ? (
              watchlist.map((item, idx) => (
                <div key={item.account_number || idx} className="p-3 bg-canvas-850 border border-border-subtle rounded space-y-1.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-text-primary text-xs">{item.account_number}</span>
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-medium bg-threat-high/15 text-threat-high border border-threat-high/20">
                          {item.risk_level || 'HIGH'}
                        </span>
                      </div>
                      <span className="text-[10px] text-text-secondary block mt-0.5">{item.holder_name} &middot; {item.bank_name}</span>
                    </div>

                    <button
                      onClick={() => toggleWatchlist(item.account_number, item.reason)}
                      className="text-text-muted hover:text-threat-critical p-1 rounded transition-colors"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-3 h-3 stroke-[1.7]" />
                    </button>
                  </div>

                  <p className="text-[10.5px] text-text-secondary bg-canvas-900 p-2 rounded border border-border-subtle leading-relaxed">
                    {item.reason}
                  </p>

                  <div className="flex justify-between items-center text-[8.5px] text-text-muted font-mono pt-0.5">
                    <span>Officer: {item.added_by || 'Officer Rajesh K.'}</span>
                    <span>{item.added_at ? new Date(item.added_at).toLocaleTimeString() : 'Active'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-text-muted border border-border-subtle rounded">
                No accounts currently under priority surveillance.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
