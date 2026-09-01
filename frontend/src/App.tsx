import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Overview } from './pages/Overview';
import { Cases } from './pages/Cases';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { TransactionNetwork } from './pages/TransactionNetwork';
import { RiskIntelligence } from './pages/RiskIntelligence';
import { NextMovement } from './pages/NextMovement';
import { CashOut } from './pages/CashOut';
import { AlertCenter } from './pages/AlertCenter';
import { Investigation } from './pages/Investigation';
import { Reports } from './pages/Reports';
import { CaseComparison } from './pages/CaseComparison';
import { Settings } from './pages/Settings';

const AppContent: React.FC = () => {
  const { enteredSimulation } = useApp();

  if (!enteredSimulation) {
    return <Landing />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/:caseId" element={<Cases />} />
          <Route path="/live" element={<LiveMonitoring />} />
          <Route path="/network" element={<TransactionNetwork />} />
          <Route path="/risk" element={<RiskIntelligence />} />
          <Route path="/predictions" element={<NextMovement />} />
          <Route path="/cashout" element={<CashOut />} />
          <Route path="/alerts" element={<AlertCenter />} />
          <Route path="/investigation" element={<Investigation />} />
          <Route path="/investigate" element={<Navigate to="/investigation" replace />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/compare" element={<CaseComparison />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
