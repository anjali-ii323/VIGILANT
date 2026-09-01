import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Activity, Share2, AlertTriangle, FileText, Search, Play, RotateCcw, 
  Settings as SettingsIcon, Bell, ChevronDown, CheckCircle2, User, Landmark,
  MapPin, TrendingUp, Compass, FolderGit2, Cpu, Eye, ShieldCheck, Scale, ArrowRight,
  LogOut, Shield
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WatchlistDrawer } from './WatchlistDrawer';
import { AuditLogModal } from './AuditLogModal';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    activeCaseId, 
    setActiveCaseId, 
    cases, 
    alerts, 
    simState, 
    triggerSimulationStep, 
    resetSimulation, 
    toasts,
    setEnteredSimulation
  } = useApp();

  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [caseDropdownOpen, setCaseDropdownOpen] = useState(false);

  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;

  const navItems = [
    { name: 'Overview', path: '/', icon: Activity },
    { name: 'Cases', path: '/cases', icon: FolderGit2 },
    { name: 'Live Monitor', path: '/live', icon: Play },
    { name: 'Money Network', path: '/network', icon: Share2 },
    { name: 'Risk Intelligence', path: '/risk', icon: Cpu },
    { name: 'Predictions', path: '/predictions', icon: Compass },
    { name: 'Cash-Out Intelligence', path: '/cashout', icon: MapPin },
    { name: 'Alerts', path: '/alerts', icon: Bell, badge: activeAlertsCount },
    { name: 'Investigation', path: '/investigation', icon: Search },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Case Compare', path: '/compare', icon: Scale },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas-950 text-text-primary font-sans antialiased">
      
      {/* 1. NARROW ELEGANT SIDEBAR */}
      <aside className="w-16 lg:w-56 bg-canvas-950 border-r border-border-subtle flex flex-col shrink-0 select-none z-30 transition-all duration-200">
        
        {/* Minimal Brand Wordmark Header */}
        <div className="h-16 px-4 border-b border-border-subtle flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-canvas-800 border border-border-strong flex items-center justify-center text-text-primary text-[11px] font-mono font-bold tracking-tight shrink-0">
              V
            </div>
            <div className="hidden lg:block overflow-hidden">
              <h1 className="font-bold text-xs tracking-[0.15em] font-mono text-text-primary uppercase truncate">VIGILANT</h1>
              <p className="text-[8px] text-text-muted font-sans tracking-wider truncate uppercase">Financial Intel &middot; SIH26184</p>
            </div>
          </Link>
        </div>

        {/* Clean Line Nav Items */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.name === 'Cases' && location.pathname.startsWith('/cases'));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded text-xs font-sans transition-colors group ${
                  isActive 
                    ? 'bg-canvas-800 text-steel-400 font-medium' 
                    : 'text-text-secondary hover:bg-canvas-900 hover:text-text-primary'
                }`}
                title={item.name}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 stroke-[1.7] ${isActive ? 'text-steel-400' : 'text-text-muted group-hover:text-text-primary'}`} />
                <span className="hidden lg:inline truncate text-[11.5px]">{item.name}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="hidden lg:flex ml-auto px-1.5 py-0.2 rounded text-[8.5px] font-mono font-semibold bg-threat-critical/20 text-threat-critical border border-threat-critical/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Utility Tools & Status */}
        <div className="p-2 border-t border-border-subtle bg-canvas-950 space-y-0.5">
          <button
            onClick={() => setIsWatchlistOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-canvas-900 rounded transition-colors"
            title="Open Watchlist"
          >
            <Eye className="w-3.5 h-3.5 text-text-muted shrink-0 stroke-[1.7]" />
            <span className="hidden lg:inline text-[11px]">Watchlist</span>
          </button>

          <button
            onClick={() => setIsAuditOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-canvas-900 rounded transition-colors"
            title="Judicial Audit Trail"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-text-muted shrink-0 stroke-[1.7]" />
            <span className="hidden lg:inline text-[11px]">Audit Log</span>
          </button>

          <div className="hidden lg:block pt-2 border-t border-border-subtle text-[8.5px] font-mono text-text-muted px-2 leading-relaxed">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-text-secondary font-medium">SYSTEM OPERATIONAL</span>
            </div>
            <span>SIMULATION ENVIRONMENT</span>
          </div>
        </div>

      </aside>

      {/* 2. MAIN APPLICATION VIEWPORT */}
      <div className="flex-1 flex flex-col overflow-hidden bg-canvas-950">
        
        {/* MINIMAL TOP COMMAND BAR */}
        <header className="h-16 bg-canvas-950 border-b border-border-subtle flex items-center justify-between px-6 shrink-0 z-20">
          
          {/* Left: Breadcrumbs & Global Case Selector */}
          <div className="flex items-center gap-4">
            
            {/* Global Case Switcher */}
            <div className="relative">
              <button
                onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-canvas-900 hover:bg-canvas-850 border border-border-subtle hover:border-border-strong rounded text-xs font-mono transition-colors text-text-primary"
              >
                <span className="text-text-muted text-[10px]">CASE:</span>
                <span className="font-semibold text-steel-400">{activeCaseId}</span>
                <ChevronDown className="w-3 h-3 text-text-muted ml-0.5" />
              </button>

              {caseDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-canvas-850 border border-border-strong rounded shadow-2xl z-50 py-1 max-h-72 overflow-y-auto text-xs animate-fade-in font-sans">
                  <div className="px-3 py-1.5 border-b border-border-subtle text-[9px] uppercase tracking-wider text-text-muted font-mono">
                    Select Investigation Case
                  </div>
                  {cases.map((c) => (
                    <button
                      key={c.case_id}
                      onClick={() => {
                        setActiveCaseId(c.case_id);
                        setCaseDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-canvas-800 transition-colors ${
                        c.case_id === activeCaseId ? 'bg-steel-500/10 text-steel-400 font-medium' : 'text-text-secondary'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-mono text-[11px] block">{c.case_id}</span>
                        <span className="text-[10px] text-text-muted truncate block">{c.fraud_type}</span>
                      </div>
                      <span className="font-mono text-[10px] text-text-secondary shrink-0">₹{(c.amount / 1000).toFixed(0)}K</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Simulation Step Action Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-canvas-900 border border-border-subtle rounded text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-text-muted uppercase">STEP {simState.current_step}/5</span>
              <button
                onClick={triggerSimulationStep}
                className="ml-2 px-2 py-0.5 bg-canvas-800 hover:bg-canvas-750 text-steel-400 border border-border-subtle rounded text-[9px] font-medium flex items-center gap-1 transition-colors"
                title="Advance simulation"
              >
                <Play className="w-2.5 h-2.5" />
                <span>Simulate Step</span>
              </button>
              <button
                onClick={resetSimulation}
                className="px-1 py-0.5 text-text-muted hover:text-text-primary transition-colors"
                title="Reset simulation"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            </div>

          </div>

          {/* Right: Officer Badge & Exit */}
          <div className="flex items-center gap-4 text-xs font-sans">
            
            {/* Officer Profile Badge */}
            <div className="flex items-center gap-2.5 px-3 py-1 bg-canvas-900 border border-border-subtle rounded">
              <div className="w-5 h-5 rounded bg-canvas-800 border border-border-strong flex items-center justify-center text-text-secondary text-[9.5px] font-mono font-semibold">
                RK
              </div>
              <div className="hidden md:block text-left">
                <span className="block text-[11px] text-text-primary font-medium">Officer Rajesh K.</span>
                <span className="block text-[8px] font-mono text-text-muted uppercase">Cyber Division &middot; L3</span>
              </div>
            </div>

            {/* Exit to Presentation */}
            <button
              onClick={() => setEnteredSimulation(false)}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-canvas-900 rounded transition-colors"
              title="Return to Presentation Screen"
            >
              <LogOut className="w-4 h-4 stroke-[1.7]" />
            </button>

          </div>

        </header>

        {/* 3. SCROLLABLE WORKSPACE CANVAS WITH GENEROUS WHITESPACE */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-canvas-950 relative">
          <div className="max-w-[1500px] mx-auto min-h-full">
            {children}
          </div>
        </main>

      </div>

      {/* 4. RESTRAINED TOAST NOTIFICATIONS */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto p-3 rounded bg-canvas-850 border border-border-strong shadow-panel text-xs flex items-start gap-2.5"
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {toast.type === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-threat-critical" />}
              {toast.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-threat-high" />}
              {toast.type === 'info' && <Activity className="w-3.5 h-3.5 text-steel-400" />}
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-[11px] text-text-primary">{toast.title}</h5>
              <p className="text-[10.5px] text-text-secondary mt-0.5 leading-snug">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 5. DRAWERS & MODALS */}
      <WatchlistDrawer isOpen={isWatchlistOpen} onClose={() => setIsWatchlistOpen(false)} />
      <AuditLogModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />

    </div>
  );
};

export default Layout;
