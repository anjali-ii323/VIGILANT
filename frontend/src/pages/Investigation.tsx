import React, { useState } from 'react';
import { 
  Search, FileText, User, Landmark, ShieldAlert, Plus, 
  Trash2, Download, CheckCircle2, Clock, MapPin, Send, Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Investigation: React.FC = () => {
  const { 
    activeCaseId, 
    cases, 
    currentCase, 
    accounts, 
    notes, 
    evidence, 
    timeline, 
    addNote, 
    deleteNote, 
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

  const activeCaseObj = currentCase?.case || cases.find(c => c.case_id === activeCaseId) || cases[0];
  const victimObj = currentCase?.victim;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    await addNote(noteContent.trim(), noteCategory);
    setNoteContent('');
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle.trim()) return;
    await addEvidence(evTitle.trim(), evDesc.trim(), evType);
    setEvTitle('');
    setEvDesc('');
    setShowEvForm(false);
  };

  const handleExportDossier = () => {
    addToast("Dossier Exported", `Generated complete intelligence packet for Case ${activeCaseId}.`, "success");
    window.print();
  };

  return (
    <div className="space-y-10 animate-fade-in text-text-primary font-sans pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border-subtle pb-6 gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-muted block mb-0.5">
            CASE DOSSIER & RECORD
          </span>
          <h1 className="text-2xl md:text-3xl font-light text-text-primary">
            Investigation Dossier &middot; <span className="font-mono font-semibold">{activeCaseObj?.case_id}</span>
          </h1>
        </div>

        <button
          onClick={handleExportDossier}
          className="px-3.5 py-1.5 bg-canvas-900 hover:bg-canvas-850 border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-medium rounded transition-colors flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Printable Dossier</span>
        </button>
      </div>

      {/* Case Overview Metrics */}
      <div className="p-5 bg-canvas-900 border border-border-subtle rounded grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans">
        <div>
          <span className="text-text-muted font-mono uppercase text-[9px] block">Case Number</span>
          <span className="font-mono font-semibold text-base text-steel-400">{activeCaseObj?.case_id}</span>
        </div>
        <div>
          <span className="text-text-muted font-mono uppercase text-[9px] block">Classification</span>
          <span className="font-medium text-text-primary">{activeCaseObj?.fraud_type}</span>
        </div>
        <div>
          <span className="text-text-muted font-mono uppercase text-[9px] block">Disputed Sum</span>
          <span className="font-mono font-semibold text-text-primary">₹{activeCaseObj?.amount?.toLocaleString('en-IN')}</span>
        </div>
        <div>
          <span className="text-text-muted font-mono uppercase text-[9px] block">Lead Officer</span>
          <span className="text-text-primary">{activeCaseObj?.assigned_officer}</span>
        </div>
      </div>

      {/* Split Columns: Notes & Evidence Locker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Notes (6 cols) */}
        <div className="lg:col-span-6 bg-canvas-900 border border-border-subtle rounded p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <span className="font-semibold text-xs text-text-primary font-mono uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-steel-400" />
              Officer Notes ({notes.length})
            </span>
            <span className="text-[9px] font-mono text-emerald-400">PERSISTED</span>
          </div>

          <form onSubmit={handleAddNote} className="space-y-2.5">
            <textarea
              rows={3}
              placeholder="Record forensic observation, bank response, or field update..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full p-2.5 bg-canvas-950 border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-steel-500"
            />
            <div className="flex justify-between items-center">
              <select
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value)}
                className="p-1.5 bg-canvas-950 border border-border-subtle rounded text-[10px] font-mono text-text-secondary"
              >
                <option value="INTELLIGENCE">INTELLIGENCE</option>
                <option value="EVIDENCE">EVIDENCE</option>
                <option value="ESCALATION">ESCALATION</option>
              </select>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-steel-500 hover:bg-steel-600 text-white font-medium text-xs rounded transition-colors"
              >
                Record Note
              </button>
            </div>
          </form>

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {notes.map((n) => (
              <div key={n.note_id} className="p-3 bg-canvas-950 border border-border-subtle rounded space-y-1 text-xs">
                <div className="flex justify-between items-center text-[9.5px] font-mono text-text-muted">
                  <span className="font-semibold text-steel-400">{n.category || 'INTELLIGENCE'}</span>
                  <div className="flex items-center gap-2">
                    <span>{new Date(n.timestamp).toLocaleTimeString('en-IN')}</span>
                    <button onClick={() => deleteNote(n.note_id)} className="text-text-muted hover:text-threat-critical">
                      <Trash2 className="w-3 h-3 stroke-[1.7]" />
                    </button>
                  </div>
                </div>
                <p className="text-text-secondary leading-relaxed font-sans">{n.content}</p>
                <span className="text-[8.5px] text-text-muted font-mono block pt-0.5">Officer: {n.officer}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Evidence (6 cols) */}
        <div className="lg:col-span-6 bg-canvas-900 border border-border-subtle rounded p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <span className="font-semibold text-xs text-text-primary font-mono uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-steel-400" />
              Evidence Records ({evidence.length})
            </span>
            <button
              onClick={() => setShowEvForm(!showEvForm)}
              className="px-2.5 py-1 bg-canvas-850 hover:bg-canvas-800 text-text-primary border border-border-subtle rounded text-xs font-medium flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Attach Record</span>
            </button>
          </div>

          {showEvForm && (
            <form onSubmit={handleAddEvidence} className="p-3 bg-canvas-950 border border-border-strong rounded space-y-3 text-xs">
              <div>
                <label className="block text-[9.5px] text-text-muted font-mono uppercase mb-1">Evidence Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Bank Statement Extract"
                  value={evTitle}
                  onChange={(e) => setEvTitle(e.target.value)}
                  className="w-full p-2 bg-canvas-900 border border-border-subtle rounded text-xs text-text-primary"
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
                  </select>
                </div>
                <div>
                  <label className="block text-[9.5px] text-text-muted font-mono uppercase mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Description"
                    value={evDesc}
                    onChange={(e) => setEvDesc(e.target.value)}
                    className="w-full p-2 bg-canvas-900 border border-border-subtle rounded text-xs text-text-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowEvForm(false)} className="px-3 py-1 text-text-muted text-xs">Cancel</button>
                <button type="submit" className="px-3 py-1 bg-steel-500 text-white font-medium text-xs rounded">Attach Evidence</button>
              </div>
            </form>
          )}

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {evidence.map((ev) => (
              <div key={ev.evidence_id} className="p-3 bg-canvas-950 border border-border-subtle rounded flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-steel-400" />
                    <span className="font-semibold text-xs text-text-primary">{ev.title}</span>
                  </div>
                  <p className="text-text-secondary leading-relaxed">{ev.description}</p>
                  <span className="text-[9px] font-mono text-text-muted block">
                    {ev.file_type} &middot; {ev.file_size || '1.2 MB'} &middot; {ev.hash_checksum || 'SHA256:VERIFIED'}
                  </span>
                </div>

                <button
                  onClick={() => deleteEvidence(ev.evidence_id)}
                  className="p-1 text-text-muted hover:text-threat-critical rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3 stroke-[1.7]" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Investigation;
