import React from 'react';
import { ArrowRight, Activity, Cpu, Zap, MapPin, AlertTriangle, ChevronRight, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Landing: React.FC = () => {
  const { setEnteredSimulation, setActiveCaseId } = useApp();

  const handleEnter = (caseId?: string) => {
    if (caseId) setActiveCaseId(caseId);
    setEnteredSimulation(true);
  };

  return (
    <div className="min-h-screen bg-canvas-950 text-text-primary relative overflow-x-hidden selection:bg-steel-500/20 selection:text-steel-300 font-sans">
      
      {/* Subtle Blue Illumination Spotlight */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[500px] bg-gradient-to-b from-steel-500/8 via-steel-600/3 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-subtle-grid pointer-events-none opacity-50" />

      {/* Top Header */}
      <header className="relative z-20 max-w-6xl mx-auto px-6 h-20 flex items-center justify-between border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-canvas-900 border border-border-strong flex items-center justify-center font-mono font-bold text-xs text-text-primary">
            V
          </div>
          <div>
            <span className="font-bold text-xs tracking-[0.18em] font-mono text-text-primary uppercase block">VIGILANT</span>
            <span className="text-[8.5px] text-text-muted font-sans uppercase tracking-wider block">Financial Intelligence &middot; SIH26184</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-canvas-900 border border-border-subtle text-[10px] font-mono text-text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>SIMULATION ENVIRONMENT</span>
          </div>

          <button
            onClick={() => handleEnter()}
            className="px-4 py-1.5 rounded bg-steel-500 hover:bg-steel-600 text-white font-medium text-xs font-sans tracking-wide transition-colors flex items-center gap-1.5"
          >
            <span>Enter Workstation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-24">
        
        {/* Editorial Subtitle Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-canvas-900 border border-border-subtle mb-8 text-[9.5px] font-mono uppercase tracking-[0.15em] text-text-secondary">
          <span>PROACTIVE FINANCIAL CYBERCRIME INTELLIGENCE</span>
          <span className="w-1 h-1 rounded-full bg-steel-400" />
          <span className="text-steel-400">SIH PROBLEM 26184</span>
        </div>

        {/* Large Confident Editorial Headline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-20">
          <div className="lg:col-span-8 space-y-6">
            <h1 className="text-4xl md:text-6xl font-light tracking-tight text-text-primary leading-[1.08]">
              Follow the money.<br />
              <span className="font-semibold text-white">
                Before it disappears.
              </span>
            </h1>

            <p className="text-base text-text-secondary font-sans max-w-2xl leading-relaxed">
              Vigilant continuously reconstructs multi-bank transaction layering, evaluates explainable mule account risks, forecasts potential next movements, and pinpoints physical cash-out extraction points before funds are withdrawn.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              <button
                onClick={() => handleEnter("CF-2026-00421")}
                className="px-6 py-3 rounded bg-steel-500 hover:bg-steel-600 text-white font-medium text-xs tracking-wide transition-colors flex items-center gap-2"
              >
                <span>Open Investigation Workspace</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleEnter()}
                className="px-5 py-3 rounded bg-canvas-900 hover:bg-canvas-850 border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-medium transition-colors"
              >
                Launch Live Telemetry
              </button>
            </div>
          </div>

          {/* Right Hero Visual Card */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="p-5 rounded bg-canvas-900 border border-border-strong space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-mono uppercase tracking-wider text-text-muted">ACTIVE TARGET</span>
                <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-medium bg-threat-critical/15 text-threat-critical border border-threat-critical/30">
                  CRITICAL THREAT
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div>
                  <span className="text-[9px] text-text-muted uppercase block">Case Number</span>
                  <span className="font-semibold text-text-primary">CF-2026-00421</span>
                </div>
                <div>
                  <span className="text-[9px] text-text-muted uppercase block">Layering Disputed Volume</span>
                  <span className="text-lg font-semibold text-steel-400">₹1,00,000</span>
                </div>
                <p className="text-[11px] text-text-secondary font-sans leading-relaxed pt-1">
                  "₹40,000 predicted to reach ATM Cluster 03 (Dadar West) within 20–40 minute window."
                </p>
              </div>

              <button
                onClick={() => handleEnter("CF-2026-00421")}
                className="w-full mt-2 py-2 bg-canvas-850 hover:bg-canvas-800 border border-border-subtle text-text-primary text-xs font-medium rounded transition-colors text-center flex items-center justify-center gap-1.5"
              >
                <span>Inspect Money Trail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3.5 rounded bg-canvas-900 border border-border-subtle">
                <span className="text-[9px] text-text-muted uppercase block">Model Precision</span>
                <span className="text-xl font-semibold text-text-primary">99.4%</span>
                <span className="text-[8.5px] text-text-muted block mt-0.5">Anomaly Isolation</span>
              </div>
              <div className="p-3.5 rounded bg-canvas-900 border border-border-subtle">
                <span className="text-[9px] text-text-muted uppercase block">Lead Time Window</span>
                <span className="text-xl font-semibold text-steel-400">20-40m</span>
                <span className="text-[8.5px] text-text-muted block mt-0.5">Pre-Withdrawal</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          
          <div className="p-5 rounded bg-canvas-900 border border-border-subtle space-y-2.5">
            <div className="w-8 h-8 rounded bg-canvas-850 border border-border-subtle flex items-center justify-center text-steel-400">
              <Activity className="w-4 h-4 stroke-[1.7]" />
            </div>
            <h3 className="font-semibold text-xs text-text-primary tracking-wide">Multi-Bank Flow Reconstruct</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Directed Acyclic Graph (DAG) generation tracing IMPS, UPI, and RTGS transit paths across banking nodes.
            </p>
          </div>

          <div className="p-5 rounded bg-canvas-900 border border-border-subtle space-y-2.5">
            <div className="w-8 h-8 rounded bg-canvas-850 border border-border-subtle flex items-center justify-center text-steel-400">
              <Cpu className="w-4 h-4 stroke-[1.7]" />
            </div>
            <h3 className="font-semibold text-xs text-text-primary tracking-wide">Explainable Mule Risk AI</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              No black-box models. Transparent mathematical point weights: velocity (+24), multiple senders (+19), and splitting (+14).
            </p>
          </div>

          <div className="p-5 rounded bg-canvas-900 border border-border-subtle space-y-2.5">
            <div className="w-8 h-8 rounded bg-canvas-850 border border-border-subtle flex items-center justify-center text-steel-400">
              <Zap className="w-4 h-4 stroke-[1.7]" />
            </div>
            <h3 className="font-semibold text-xs text-text-primary tracking-wide">Destination Forecasting</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Markov transition models and sequential heuristics calculate probability-ranked next accounts before dissipation.
            </p>
          </div>

          <div className="p-5 rounded bg-canvas-900 border border-border-subtle space-y-2.5">
            <div className="w-8 h-8 rounded bg-canvas-850 border border-border-subtle flex items-center justify-center text-steel-400">
              <MapPin className="w-4 h-4 stroke-[1.7]" />
            </div>
            <h3 className="font-semibold text-xs text-text-primary tracking-wide">Geospatial Interception</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Dark Leaflet mapping pinpoints high-risk ATM clusters and coordinates patrol alerts to block cash extraction.
            </p>
          </div>

        </div>

        {/* Disclaimer Footer */}
        <div className="p-3.5 rounded bg-canvas-900 border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-text-muted">
            <AlertTriangle className="w-3.5 h-3.5 text-text-secondary shrink-0" />
            <span>
              <strong className="text-text-secondary">SIMULATION NOTICE:</strong> Synthetic banking trails built for Smart India Hackathon evaluation.
            </span>
          </div>
          <button
            onClick={() => handleEnter()}
            className="text-steel-400 hover:text-steel-300 font-medium text-xs shrink-0"
          >
            Enter Workstation &rarr;
          </button>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-6 text-center text-xs font-mono text-text-muted">
        <p>VIGILANT &copy; 2026. Proactive Financial Cybercrime Intelligence Platform &middot; SIH26184</p>
      </footer>

    </div>
  );
};

export default Landing;
