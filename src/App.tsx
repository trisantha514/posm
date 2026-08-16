/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, ShopSettings } from './types';
import { db } from './utils/db';

// Component Imports
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { POSBilling } from './components/POSBilling';
import { Inventory } from './components/Inventory';
import { Purchasing } from './components/Purchasing';
import { CustomersList } from './components/CustomersList';
import { ExpensesList } from './components/ExpensesList';
import { Reports } from './components/Reports';
import { Promotions } from './components/Promotions';
import { SettingsBackup } from './components/SettingsBackup';

export default function App() {
  // Session States
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('wcs_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentTab, setCurrentTab] = useState<string>(() => {
    return currentUser?.role === 'User/Cashier' ? 'pos' : 'dashboard';
  });

  // Global Settings State
  const [settings, setSettings] = useState<ShopSettings>(() => db.getSettings());

  // Save Session updates
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('wcs_session', JSON.stringify(user));
    if (user.role === 'User/Cashier') {
      setCurrentTab('pos');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('wcs_session');
  };

  const handleUpdateCurrentUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('wcs_session', JSON.stringify(updatedUser));
  };

  const handleUpdateSettings = (newSettings: ShopSettings) => {
    db.saveSettings(newSettings);
    setSettings(newSettings);
  };

  // Render correct active tab based on ID and user privileges
  const renderTabContent = () => {
    if (!currentUser) return null;

    // Direct tab routing check
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POSBilling currentUser={currentUser} settings={settings} />;
      case 'inventory':
        return <Inventory />;
      case 'purchases':
        return <Purchasing />;
      case 'customers':
        return <CustomersList />;
      case 'expenses':
        return <ExpensesList />;
      case 'reports':
        return <Reports />;
      case 'promotions':
        return <Promotions />;
      case 'settings':
        return <SettingsBackup settings={settings} onUpdateSettings={handleUpdateSettings} currentUser={currentUser} />;
      default:
        return <Dashboard />;
    }
  };

  // Login view fallback
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden" id="app-container">
      {/* Navigation Sidebar (hidden automatically during system hardware print runs) */}
      <div className="print:hidden">
        <Sidebar
          currentUser={currentUser}
          currentTab={currentTab}
          onChangeTab={setCurrentTab}
          onLogout={handleLogout}
          shopName={settings.shop_name}
          onUpdateUser={handleUpdateCurrentUser}
        />
      </div>

      {/* Primary Workspace Viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden print:bg-white print:overflow-visible">
        {renderTabContent()}
      </main>

      {/* Global CSS style tags for hardware printers formatting (A4 vs 80mm) */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          /* Hide sidebar, dashboards, and triggers from printouts */
          .print\\:hidden, aside, button, header, input, select, textarea, .bg-slate-200 {
            display: none !important;
          }
          /* Expand printable content to consume the page */
          main, #app-container, #printable-receipt-area, #customer-statement-printable, #income-statement-printed {
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Remove layout wrapping container styles when printing */
          .bg-slate-50, .bg-slate-100, .border {
            border: none !important;
            background: none !important;
          }
        }
      `}</style>
    </div>
  );
}
