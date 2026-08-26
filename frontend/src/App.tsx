import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { Cases } from './pages/Cases';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { TransactionNetwork } from './pages/TransactionNetwork';
import { RiskIntelligence } from './pages/RiskIntelligence';
import { CashOut } from './pages/CashOut';
import { AlertCenter } from './pages/AlertCenter';
import { Investigation } from './pages/Investigation';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { MoneyTrail } from './pages/MoneyTrail';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/cases/:caseId" element={<Cases />} />
            <Route path="/live" element={<LiveMonitoring />} />
            <Route path="/network" element={<TransactionNetwork />} />
            <Route path="/risk" element={<RiskIntelligence />} />
            <Route path="/cashout" element={<CashOut />} />
            <Route path="/alerts" element={<AlertCenter />} />
            <Route path="/investigate" element={<Investigation />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/money-trail" element={<MoneyTrail />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
};
export default App;
