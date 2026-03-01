import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import Layout from './components/layout/Layout';
import LoginPage    from './pages/LoginPage';
import OrdersPage   from './pages/OrdersPage';
import ClientsPage  from './pages/ClientsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage  from './pages/SettingsPage';

function Protected({ children }) {
  const token = useAuthStore((s) => s.token);
  console.log('[Protected] token?', !!token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/' element={<Navigate to='/orders' replace />} />
        <Route path='/orders' element={<Protected><Layout><OrdersPage /></Layout></Protected>} />
        <Route path='/clients' element={<Protected><Layout><ClientsPage /></Layout></Protected>} />
        <Route path='/analytics' element={<Protected><Layout><AnalyticsPage /></Layout></Protected>} />
        <Route path='/settings' element={<Protected><Layout><SettingsPage /></Layout></Protected>} />
        <Route path='*' element={<Navigate to='/orders' replace />} />
      </Routes>
    </BrowserRouter>
  );
}
