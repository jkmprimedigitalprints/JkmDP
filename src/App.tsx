/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './components/Toast';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { POSSystem } from './components/POSSystem';
import { ShieldCheck, UserCheck, RefreshCw, Smartphone, Monitor } from 'lucide-react';

type AppMode = 'customer' | 'admin';

function MainAppContent() {
  const [appMode, setAppMode] = useState<AppMode>('customer');
  const [currentAdminUser, setCurrentAdminUser] = useState<string>('');
  const [adminRole, setAdminRole] = useState<'Staff' | 'Manager'>('Staff');

  // Load initial portal mode based strictly on /admin route or query param
  useEffect(() => {
    const evaluateRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const portalParam = params.get('portal');
      const adminParam = params.get('admin');

      const isAdminRoute = 
        path === '/admin' || 
        path.startsWith('/admin/') || 
        hash === '#/admin' || 
        hash.startsWith('#/admin') || 
        hash === '#admin' ||
        portalParam === 'admin' || 
        adminParam === 'true';

      const savedAdminSession = localStorage.getItem('jkm_active_admin_session');

      if (isAdminRoute) {
        setAppMode('admin');
      } else {
        setAppMode('customer');
      }

      if (savedAdminSession) {
        try {
          const parsed = JSON.parse(savedAdminSession);
          setCurrentAdminUser(parsed.username);
          setAdminRole(parsed.role);
        } catch (err) {
          localStorage.removeItem('jkm_active_admin_session');
        }
      }
    };

    evaluateRoute();
    window.addEventListener('popstate', evaluateRoute);
    window.addEventListener('hashchange', evaluateRoute);

    return () => {
      window.removeEventListener('popstate', evaluateRoute);
      window.removeEventListener('hashchange', evaluateRoute);
    };
  }, []);

  // Inactivity Auto-Logout Timer (15 minutes)
  useEffect(() => {
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
    let timeoutId: NodeJS.Timeout;

    const performAutoLogout = () => {
      const savedAdminSession = localStorage.getItem('jkm_active_admin_session');
      const savedCustomerSession = localStorage.getItem('jkm_active_customer_session');

      if (savedAdminSession) {
        localStorage.removeItem('jkm_active_admin_session');
        setCurrentAdminUser('');
        setAppMode('customer');
        window.history.pushState({}, '', '/');
        alert('Your JKM Prime Admin session has expired due to 15 minutes of inactivity. Redirecting to home.');
        window.location.reload();
      } else if (savedCustomerSession) {
        localStorage.removeItem('jkm_active_customer_session');
        localStorage.removeItem('jkm_customer_view');
        alert('Your Customer session has been automatically closed due to inactivity.');
        window.location.reload();
      }
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(performAutoLogout, INACTIVITY_TIMEOUT);
    };

    const events = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer(); // Start timer

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [currentAdminUser]);

  const handleAdminLoginSuccess = (username: string, role: 'Staff' | 'Manager') => {
    setCurrentAdminUser(username);
    setAdminRole(role);
    localStorage.setItem('jkm_active_admin_session', JSON.stringify({ username, role }));
  };

  const handleAdminLogout = () => {
    setCurrentAdminUser('');
    localStorage.removeItem('jkm_active_admin_session');
    window.history.pushState({}, '', '/');
    setAppMode('customer');
  };

  const handleBackToLanding = () => {
    window.history.pushState({}, '', '/');
    setAppMode('customer');
  };

  return (
    <div id="app-root-wrapper" className="min-h-screen relative">
      {/* 
        ========================================================================
        APPLICATION ROUTING RENDERER
        Admin is strictly accessible via /admin or ?portal=admin
        ========================================================================
      */}
      {appMode === 'customer' ? (
        <LandingPage onLoginClick={() => {
          window.history.pushState({}, '', '/admin');
          setAppMode('admin');
        }} />
      ) : (
        // Admin Portal
        currentAdminUser ? (
          <POSSystem 
            userDisplayName={currentAdminUser} 
            userRole={adminRole} 
            onLogout={handleAdminLogout} 
          />
        ) : (
          <LoginPage 
            onBackToLanding={handleBackToLanding} 
            onLoginSuccess={handleAdminLoginSuccess} 
          />
        )
      )}

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainAppContent />
    </ToastProvider>
  );
}
