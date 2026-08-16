/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../utils/db';
import {
  LayoutDashboard,
  ShoppingCart,
  Wrench,
  Truck,
  Users,
  Receipt,
  FileBarChart,
  Megaphone,
  Settings,
  LogOut,
  User as UserIcon,
  Key,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  currentTab: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
  shopName: string;
  onUpdateUser: (user: User) => void;
}

export function Sidebar({ currentUser, currentTab, onChangeTab, onLogout, shopName, onUpdateUser }: SidebarProps) {
  const isCashier = currentUser.role === 'User/Cashier';

  // Change Password States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg('All password fields are required.');
      return;
    }

    // Verify current password
    if (currentPassword !== currentUser.password) {
      setErrorMsg('Incorrect current password.');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    // Success! Update password
    const updatedUser = { ...currentUser, password: newPassword };
    db.updateUser(updatedUser);
    onUpdateUser(updatedUser);

    alert('Your password has been changed successfully!');
    setShowPasswordModal(false);
    
    // Clear states
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Navigation Items
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Owner'] },
    { id: 'pos', name: 'POS Billing', icon: ShoppingCart, roles: ['Admin', 'Owner', 'User/Cashier'] },
    { id: 'inventory', name: 'Spare-Parts Inventory', icon: Wrench, roles: ['Admin', 'Owner'] },
    { id: 'purchases', name: 'Purchasing / Suppliers', icon: Truck, roles: ['Admin', 'Owner'] },
    { id: 'customers', name: 'Customers', icon: Users, roles: ['Admin', 'Owner', 'User/Cashier'] },
    { id: 'expenses', name: 'Expenses', icon: Receipt, roles: ['Admin', 'Owner'] },
    { id: 'reports', name: 'Reports & P/L', icon: FileBarChart, roles: ['Admin', 'Owner'] },
    { id: 'promotions', name: 'WhatsApp Promo', icon: Megaphone, roles: ['Admin', 'Owner', 'User/Cashier'] },
    { id: 'settings', name: 'Settings & Backup', icon: Settings, roles: ['Admin', 'Owner'] }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex flex-col gap-1">
        <h1 className="text-white font-extrabold text-lg tracking-wider truncate">WCS POS</h1>
        <p className="text-slate-400 text-xs font-medium truncate uppercase">{shopName || 'WCS INVENTORY'}</p>
      </div>

      {/* Active User Information */}
      <div className="p-4 mx-3 my-3 bg-slate-800/60 rounded-xl flex items-center gap-3 border border-slate-700/50">
        <div className="bg-blue-600 p-2 rounded-lg text-white">
          <UserIcon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-white font-semibold text-sm truncate">{currentUser.name}</h2>
          <div className="flex flex-col gap-1 items-start mt-0.5">
            <span className="bg-blue-900/40 text-blue-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {currentUser.role}
            </span>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-bold mt-1 cursor-pointer"
              title="Change Account Password"
            >
              <Key className="w-3 h-3" />
              <span>Change Password</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
        {navItems.map((item) => {
          const isAllowed = item.roles.includes(currentUser.role);
          if (!isAllowed) return null;

          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          id="logout-btn"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout Session
        </button>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 text-slate-900">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-600" />
                Change Your Account Password
              </h4>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setErrorMsg('');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="p-4 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 border border-red-100 text-red-700 font-bold rounded">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-bold mb-1">Current Password *</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">New Password *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Min 4 characters..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Confirm New Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                Change Password Now
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
