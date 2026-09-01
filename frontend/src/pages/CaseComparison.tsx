import React, { useState, useEffect } from 'react';
import { Scale, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CaseComparison: React.FC = () => {
  const { cases } = useApp();

  const [case1Id, setCase1Id] = useState<string>(cases[0]?.case_id || 'CF-2026-00421');
  const [case2Id, setCase2Id] = useState<string>(cases[1]?.case_id || 'CF-2026-00892');
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (case1Id && case2Id && case1Id !== case2Id) {
      setLoading(true);
      fetch(`/api/compare/${case1Id}/${case2Id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => setComparisonData(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [case1Id, case2Id]);

  const c1 = comparisonData?.case_1?.case;
  const c2 = comparisonData?.case_2?.case;
  const v1 = comparisonData?.case_1?.victim;
  const v2 = comparisonData?.case_2?.victim;

  return (
    <div className="space-y-10 animate-fade-in text-text-primary font-sans pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border-subtle pb-6 gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-muted block mb-0.5">
            CROSS-CASE TOPOLOGY ANALYSIS
          </span>
          <h1 className="text-2xl md:text-3xl font-light text-text-primary">
            Case Comparison Matrix
          </h1>
        </div>

        {/* Selectors */}
        <div className="flex items-center gap-3">
          <select
            value={case1Id}
            onChange={(e) => setCase1Id(e.target.value)}
            className="px-2.5 py-1.5 bg-canvas-900 border border-border-subtle rounded text-xs font-mono text-steel-400 font-semibold focus:outline-none focus:border-steel-500"
          >
            {cases.map(c => (
              <option key={c.case_id} value={c.case_id}>{c.case_id} ({c.fraud_type.substring(0, 14)}...)</option>
            ))}
          </select>

          <span className="text-xs font-mono text-text-muted font-bold">VS</span>

          <select
            value={case2Id}
            onChange={(e) => setCase2Id(e.target.value)}
            className="px-2.5 py-1.5 bg-canvas-900 border border-border-subtle rounded text-xs font-mono text-steel-400 font-semibold focus:outline-none focus:border-steel-500"
          >
            {cases.map(c => (
              <option key={c.case_id} value={c.case_id}>{c.case_id} ({c.fraud_type.substring(0, 14)}...)</option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Case 1 */}
        <div className="p-5 bg-canvas-900 border border-border-subtle rounded space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <span className="text-[9px] font-mono uppercase text-steel-400 block">CASE ALPHA</span>
              <h3 className="text-base font-semibold font-mono text-text-primary">{case1Id}</h3>
              <span className="text-xs text-text-secondary font-sans">{c1?.fraud_type || 'UPI Fraud'}</span>
            </div>
            <span className="text-lg font-semibold font-mono text-steel-400">
              ₹{c1?.amount?.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-2 text-xs font-sans">
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-text-muted">Complainant:</span>
              <span className="font-medium text-text-primary">{v1?.name || 'Ramesh Chandra'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-text-muted">Threat Rating:</span>
              <span className="font-mono font-semibold text-threat-critical">{Math.round(c1?.risk_score || 85)}% CRITICAL</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-text-muted">Layering Hops:</span>
              <span className="font-mono text-text-secondary">{comparisonData?.velocity_comparison?.case_1_tx_count || 4} Transactions</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-muted">Avg Hop Amount:</span>
              <span className="font-mono text-steel-400">₹{(comparisonData?.velocity_comparison?.case_1_avg_amount || 25000).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Case 2 */}
        <div className="p-5 bg-canvas-900 border border-border-subtle rounded space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <span className="text-[9px] font-mono uppercase text-steel-400 block">CASE BETA</span>
              <h3 className="text-base font-semibold font-mono text-text-primary">{case2Id}</h3>
              <span className="text-xs text-text-secondary font-sans">{c2?.fraud_type || 'Convergent Ring'}</span>
            </div>
            <span className="text-lg font-semibold font-mono text-steel-400">
              ₹{c2?.amount?.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-2 text-xs font-sans">
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-text-muted">Complainant:</span>
              <span className="font-medium text-text-primary">{v2?.name || 'Anita Verma'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-text-muted">Threat Rating:</span>
              <span className="font-mono font-semibold text-threat-critical">{Math.round(c2?.risk_score || 94)}% CRITICAL</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-subtle">
              <span className="text-text-muted">Layering Hops:</span>
              <span className="font-mono text-text-secondary">{comparisonData?.velocity_comparison?.case_2_tx_count || 5} Transactions</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-muted">Avg Hop Amount:</span>
              <span className="font-mono text-steel-400">₹{(comparisonData?.velocity_comparison?.case_2_avg_amount || 48000).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Shared Entity Nexus Box */}
      <div className="p-5 bg-canvas-900 border border-border-subtle rounded space-y-2 font-sans text-xs">
        <h3 className="font-semibold text-xs text-text-primary font-mono uppercase tracking-wider flex items-center gap-2">
          <Scale className="w-3.5 h-3.5 text-steel-400" />
          Shared Entity Nexus Analysis
        </h3>

        <div className="p-3 bg-canvas-950 border border-border-subtle rounded text-text-secondary leading-relaxed">
          {comparisonData?.common_nodes && comparisonData.common_nodes.length > 0 ? (
            <div>
              <span className="text-threat-critical font-medium block mb-1">COMMON MULE NEXUS DETECTED:</span>
              <p>Accounts {comparisonData.common_nodes.join(', ')} appear in both investigation chains, indicating operational overlap from the same coordinated cyber-fraud ring.</p>
            </div>
          ) : (
            <div>
              <span className="text-emerald-400 font-medium block mb-0.5">INDEPENDENT FRAUD VECTORS:</span>
              <p>No overlapping bank accounts found between these two specific cases. Distinct criminal syndicates or separate operational infrastructure.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default CaseComparison;
