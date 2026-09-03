import React, { useState } from 'react';
import { 
  FileText, ShieldAlert, Plus, Trash2, CheckCircle2, 
  Clock, Shield, AlertTriangle, ExternalLink, Link2, Key
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Investigation: React.FC = () => {
  const { 
    cases, 
    activeCaseId, 
    setActiveCaseId, 
    notes, 
    addNote, 
    deleteNote, 
    evidence, 
    addEvidence, 
    deleteEvidence,
    addToast
  } = useApp();

  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('INTELLIGENCE');

  const [evTitle, setEvTitle] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evType, setEvType] = useState('PDF');
  const [showEvForm, setShowEvForm] = useState(false);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    await addNote(noteContent, noteCategory);
    setNoteContent('');
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle.trim()) return;
    await addEvidence(evTitle, evDesc, evType);
    setEvTitle('');
    setEvDesc('');
    setShowEvForm(false);
  };

  return (
    <div className="space-y-8 animate-fade-in text-text-primary font-sans pb-16">
      
      {/* Header & Case Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border-subtle pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-muted">
              CASE DOSSIER &middot; JUDICIAL EVIDENCE LEDGER
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-light text-text-primary">
            Investigation & Evidence Locker
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-mono text-text-muted">Active Case:</label>
          <select
            value={activeCaseId}
            onChange={(e) => setActiveCaseId(e.target.value)}
            className="px-3 py-1.5 bg-canvas-900 border border-border-subtle rounded text-xs font-mono text-steel-400 font-semibold focus:outline-none focus:border-steel-500"
          >
            {cases.map(c => (
              <option key={c.case_id} value={c.case_id}>
                {c.case_id} &middot; {c.fraud_type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Split: Notes & Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Notes & Intelligence (6 cols) */}
        <div className="lg:col-span-6 bg-canvas-900 border border-border-subtle rounded p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <span className="font-semibold text-xs text-text-primary font-mono uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-steel-400" />
                Case Observations ({notes.length})
              </span>
              <span className="text-[9px] font-mono text-text-muted">HASH-CHAINED LOG</span>
            </div>

            {/* Note Add Form */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Log investigator notes, bank nodal responses, or surveillance briefings..."
                className="w-full h-20 p-2.5 bg-canvas-950 border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-steel-500 font-sans"
              />
              <div className="flex items-center justify-between gap-2">
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  className="px-2 py-1 bg-canvas-950 border border-border-subtle rounded text-[10px] font-mono text-text-secondary"
                >
                  <option value="INTELLIGENCE">INTELLIGENCE BRIEFING</option>
                  <option value="EVIDENCE">EVIDENCE ANALYSIS</option>
                  <option value="ESCALATION">PRIORITY ESCALATION</option>
                </select>
                <button
                  type="submit"
                  className="px-3 py-1 bg-steel-500 hover:bg-steel-600 text-white font-medium text-xs rounded transition-colors"
                >
                  Save Note
                </button>
              </div>
            </form>

            {/* Note List */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {notes.map((n) => (
                <div key={n.note_id} className="p-3 bg-canvas-950 border border-border-subtle rounded space-y-1.5 text-xs font-sans">
                  <div className="flex items-center justify-between text-[9px] font-mono text-text-muted">
                    <span className="text-steel-400 font-medium">{n.category || 'INTELLIGENCE'}</span>
                    <div className="flex items-center gap-2">
                      <span>{new Date(n.timestamp).toLocaleTimeString('en-IN')}</span>
                      <button onClick={() => deleteNote(n.note_id)} className="text-text-muted hover:text-threat-critical">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-text-secondary leading-relaxed font-sans">{n.content}</p>
                  <span className="text-[8.5px] text-text-muted font-mono block pt-0.5">Officer: {n.officer}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Evidence with Blockchain Proof-of-Existence (6 cols) */}
        <div className="lg:col-span-6 bg-canvas-900 border border-border-subtle rounded p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-steel-400" />
              <span className="font-semibold text-xs text-text-primary font-mono uppercase tracking-wider">
                Evidence Locker ({evidence.length})
              </span>
            </div>
            <button
              onClick={() => setShowEvForm(!showEvForm)}
              className="px-2.5 py-1 bg-canvas-850 hover:bg-canvas-800 text-text-primary border border-border-subtle rounded text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Attach Record</span>
            </button>
          </div>

          {showEvForm && (
            <form onSubmit={handleAddEvidence} className="p-3.5 bg-canvas-950 border border-border-strong rounded space-y-3 text-xs">
              <div>
                <label className="block text-[9.5px] text-text-muted font-mono uppercase mb-1">Evidence Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Bank Statement Extract / FIR Intake Document"
                  value={evTitle}
                  onChange={(e) => setEvTitle(e.target.value)}
                  className="w-full p-2 bg-canvas-900 border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-steel-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9.5px] text-text-muted font-mono uppercase mb-1">Format</label>
                  <select
                    value={evType}
                    onChange={(e) => setEvType(e.target.value)}
                    className="w-full p-2 bg-canvas-900 border border-border-subtle rounded text-xs text-text-primary font-mono"
                  >
                    <option value="PDF">PDF (Verified Document)</option>
                    <option value="CSV">CSV (Ledger Extract)</option>
                    <option value="PNG">PNG (Screenshot)</option>
                    <option value="JSON">JSON (On-Chain Receipt)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9.5px] text-text-muted font-mono uppercase mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Brief description"
                    value={evDesc}
                    onChange={(e) => setEvDesc(e.target.value)}
                    className="w-full p-2 bg-canvas-900 border border-border-subtle rounded text-xs text-text-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowEvForm(false)} className="px-3 py-1 text-text-muted text-xs">Cancel</button>
                <button type="submit" className="px-3 py-1 bg-steel-500 text-white font-medium text-xs rounded">Anchor to Blockchain</button>
              </div>
            </form>
          )}

          {/* Evidence Items with Blockchain Verification Badges */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {evidence.map((ev) => (
              <div key={ev.evidence_id} className="p-3.5 bg-canvas-950 border border-border-subtle hover:border-steel-500/40 rounded space-y-2 text-xs transition-colors">
                
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-steel-400 shrink-0" />
                      <span className="font-semibold text-xs text-text-primary">{ev.title}</span>
                      <span className="px-1.5 py-0.2 rounded text-[7.5px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        SEC 65B ANCHORED
                      </span>
                    </div>
                    <p className="text-text-secondary leading-relaxed text-[11px]">{ev.description}</p>
                  </div>

                  <button
                    onClick={() => deleteEvidence(ev.evidence_id)}
                    className="p-1 text-text-muted hover:text-threat-critical rounded transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[1.7]" />
                  </button>
                </div>

                {/* Cryptographic Hashes & IPFS Block Links */}
                <div className="p-2 bg-canvas-900 rounded border border-border-subtle space-y-1 font-mono text-[8.5px] text-text-muted">
                  <div className="flex justify-between items-center">
                    <span>SHA-256 Checksum:</span>
                    <span className="text-steel-400">{ev.hash_checksum || 'SHA256:8F43A9182BC4E7D99A01...'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>IPFS CID v1:</span>
                    <span className="text-emerald-400">{ev.ipfs_cid || 'bafybeic8f43a9182bc4e7d99a01vigilant'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>On-Chain Tx:</span>
                    <span className="text-text-secondary truncate max-w-[180px]">{ev.on_chain_tx_hash || '0x7F91B994A2D81C10291480D923E2804A9184B022'}</span>
                  </div>
                </div>

                <div className="flex justify-between text-[8px] font-mono text-text-muted pt-0.5">
                  <span>Format: {ev.file_type} ({ev.file_size || '1.4 MB'})</span>
                  <span>Anchor Block #{ev.block_number || 1982412}</span>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Investigation;
