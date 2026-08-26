import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, LayoutDashboard, Briefcase, Activity, Share2, 
  Fingerprint, Compass, Bell, Search, AlertCircle, FileText, Settings, Database,
  Landmark, User, X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { simState, alerts, activeCaseId, setActiveCaseId, toasts, fetchAlerts, addToast } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState<string>('');
  
  // Search Autocomplete State
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications Popover State
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const activeAlertsCount = activeAlerts.length;

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Cases', path: '/cases', icon: Briefcase },
    { name: 'Live Monitoring', path: '/live', icon: Activity },
    { name: 'Transaction Network', path: '/network', icon: Share2 },
    { name: 'Risk Intelligence', path: '/risk', icon: Fingerprint },
    { name: 'Cash-Out Prediction', path: '/cashout', icon: Compass },
    { name: 'Alerts', path: '/alerts', icon: AlertCircle },
    { name: 'Investigation', path: '/investigate', icon: ShieldAlert },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Fetch search results as user types (debounced)
  useEffect(() => {
    if (searchVal.trim().length >= 2) {
      const delay = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(searchVal)}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data);
            setShowSearchDropdown(true);
          }
        } catch (err) {
          console.error("Search query failed:", err);
        }
      }, 250);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchVal]);

  // Click outside handlers to close overlays
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      setActiveCaseId(searchVal.trim().toUpperCase());
      setSearchVal('');
      setShowSearchDropdown(false);
      navigate(`/cases/${searchVal.trim().toUpperCase()}`);
    }
  };

  const handleSelectResult = (item: any) => {
    setShowSearchDropdown(false);
    setSearchVal('');
    if (item.type === 'CASE') {
      setActiveCaseId(item.id);
      navigate(`/cases/${item.id}`);
    } else if (item.type === 'ACCOUNT') {
      navigate(`/risk`);
    } else if (item.type === 'ALERT') {
      navigate(`/alerts`);
    } else if (item.type === 'TRANSACTION') {
      navigate(`/network`);
    }
  };

  const handleResolveAlert = async (alertId: string, caseId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/resolve`, { method: 'POST' });
      if (res.ok) {
        addToast("Alert Resolved", "Incident cleared from queue.", "success");
        fetchAlerts();
        setActiveCaseId(caseId);
        navigate(`/cases/${caseId}`);
        setShowNotifications(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f4f6f8]">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-64 bg-navy-950 text-slate-100 flex flex-col border-r border-navy-800 shrink-0">
        <div className="p-4 border-b border-navy-800 flex items-center gap-3 bg-navy-900">
          <Database className="w-6 h-6 text-navy-400 stroke-[2]" />
          <div>
            <h1 className="font-extrabold text-sm tracking-wider text-white font-mono">VIGILANT</h1>
            <p className="text-[9px] text-navy-300 font-mono tracking-tight">Cybercrime Intel SIH26184</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.name === 'Cases' && location.pathname.startsWith('/cases'));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium font-sans transition-colors ${
                  isActive 
                    ? 'bg-navy-800 text-white border-l-2 border-orange-500' 
                    : 'text-slate-400 hover:bg-navy-900 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-orange-500' : 'text-slate-500'}`} />
                <span>{item.name}</span>
                {item.name === 'Alerts' && activeAlertsCount > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold bg-red-700 text-white rounded-full">
                    {activeAlertsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-navy-850 bg-navy-950 text-[10px] font-mono text-slate-505 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>System Status: ONLINE</span>
          </div>
          <div className="text-slate-550 uppercase text-[9px] font-bold tracking-wider">
            SIMULATION ENVIRONMENT
          </div>
          <div className="text-[8px] text-slate-600 leading-normal border-t border-navy-900 pt-1.5">
            Vigilant is a prototype using synthetic transaction data. It does not connect to real banking, NPCI, or government systems.
          </div>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT COLUMN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP BAR */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm shrink-0 z-50">
          
          {/* Autocomplete Search input */}
          <div ref={searchRef} className="relative w-80">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Case, Account, Tx..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-navy-600 font-mono"
              />
            </form>

            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-10 left-0 right-0 bg-white border rounded shadow-lg z-[9999] overflow-hidden text-xs max-h-64 overflow-y-auto">
                <div className="bg-slate-50 p-1.5 border-b text-[10px] font-bold text-slate-400 font-mono">
                  SEARCH RESULTS
                </div>
                {searchResults.map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleSelectResult(item)}
                    className="p-2.5 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 flex flex-col gap-0.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-navy-950 font-mono">{item.id}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-500 font-mono px-1 rounded uppercase">
                        {item.type}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-600 truncate">{item.title}</div>
                    <div className="text-[9px] text-slate-400 font-mono truncate">{item.subtitle}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1 rounded">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
              <span className="text-[10px] font-bold text-amber-800 font-mono tracking-wider uppercase">
                {simState.running ? 'SIMULATION RUNNING' : 'SIMULATION MODE'}
              </span>
            </div>

            {/* Notifications Popover */}
            <div ref={notifRef} className="relative">
              <div 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative cursor-pointer hover:bg-slate-100 p-1.5 rounded"
              >
                <Bell className="w-4 h-4 text-slate-650" />
                {activeAlertsCount > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-600 text-white text-[8px] font-extrabold flex items-center justify-center rounded-full">
                    {activeAlertsCount}
                  </span>
                )}
              </div>

              {showNotifications && (
                <div className="absolute right-0 top-10 w-80 bg-white border rounded shadow-lg z-[9999] overflow-hidden text-xs">
                  <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
                    <span className="font-bold text-navy-950 font-sans">Surveillance Alerts ({activeAlertsCount})</span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="hover:bg-slate-200 p-0.5 rounded text-slate-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto divide-y">
                    {activeAlerts.length > 0 ? (
                      activeAlerts.map((alert) => (
                        <div key={alert.alert_id} className="p-3 hover:bg-slate-50 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold font-mono text-[10px]">{alert.alert_id}</span>
                            <span className={`px-1.5 py-0.25 text-[8px] font-extrabold rounded uppercase ${
                              alert.severity === 'CRITICAL' ? 'bg-red-150 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {alert.severity}
                            </span>
                          </div>
                          <div className="font-semibold text-slate-800">{alert.title}</div>
                          <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{alert.description}</p>
                          <div className="flex justify-between pt-1">
                            <button 
                              onClick={() => {
                                setShowNotifications(false);
                                setActiveCaseId(alert.case_id);
                                navigate(`/cases/${alert.case_id}`);
                              }}
                              className="text-[9px] text-navy-900 font-bold hover:underline"
                            >
                              Investigate Case
                            </button>
                            <button 
                              onClick={() => handleResolveAlert(alert.alert_id, alert.case_id)}
                              className="text-[9px] text-emerald-800 font-bold hover:underline"
                            >
                              Resolve
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-400">
                        No active unread alarms in queue.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200" />

            <div className="text-right">
              <div className="text-xs font-bold text-navy-950">Rajesh K.</div>
              <div className="text-[9px] text-slate-500 font-mono">Senior Cyber Investigator</div>
            </div>
          </div>
        </header>

        {/* 3. SCROLLABLE INNER PAGE */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          {children}
        </main>
      </div>

      {/* 4. FLOATING TOAST STACK */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => {
          let bg = 'bg-white border-blue-500';
          let txt = 'text-blue-800';
          if (toast.type === 'warning') { bg = 'bg-amber-50 border-amber-500'; txt = 'text-amber-800'; }
          else if (toast.type === 'error') { bg = 'bg-red-50 border-red-500'; txt = 'text-red-800'; }
          else if (toast.type === 'success') { bg = 'bg-emerald-50 border-emerald-500'; txt = 'text-emerald-800'; }

          return (
            <div 
              key={toast.id}
              className={`p-3 border-l-4 rounded shadow-lg flex flex-col gap-0.5 transition-all duration-300 transform translate-y-0 ${bg}`}
            >
              <div className={`text-xs font-bold ${txt}`}>{toast.title}</div>
              <div className="text-[10px] text-slate-650">{toast.message}</div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
export default Layout;
