/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShopSettings, User, Role } from '../types';
import { db } from '../utils/db';
import {
  Settings,
  Save,
  Download,
  Upload,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  FileText,
  Trash2,
  Users,
  UserPlus,
  Edit2,
  ShieldAlert,
  Eye,
  EyeOff
} from 'lucide-react';

interface SettingsBackupProps {
  settings: ShopSettings;
  onUpdateSettings: (settings: ShopSettings) => void;
  currentUser: User;
}

export function SettingsBackup({ settings, onUpdateSettings, currentUser }: SettingsBackupProps) {
  const [shopName, setShopName] = useState(settings.shop_name);
  const [shopPhone, setShopPhone] = useState(settings.shop_phone);
  const [shopEmail, setShopEmail] = useState(settings.shop_email);
  const [shopAddress, setShopAddress] = useState(settings.shop_address);
  const [shopHeader, setShopHeader] = useState(settings.shop_header);
  const [shopLogo, setShopLogo] = useState(settings.shop_logo || '');
  const [taxRate, setTaxRate] = useState(settings.tax_rate);
  const [printerWidth, setPrinterWidth] = useState(settings.thermal_printer_width);

  // Restore state
  const [restoreJSON, setRestoreJSON] = useState('');
  const [restoreMsg, setRestoreMsg] = useState('');

  // Tab switching state
  const [activeTab, setActiveTab] = useState<'settings' | 'users'>('settings');

  // Users management state
  const [users, setUsers] = useState<User[]>(() => db.getUsers());
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [usrUsername, setUsrUsername] = useState('');
  const [usrName, setUsrName] = useState('');
  const [usrRole, setUsrRole] = useState<Role>('User/Cashier');
  const [usrPassword, setUsrPassword] = useState('');
  const [showUsrPassword, setShowUsrPassword] = useState(false);

  const refreshUserList = () => {
    setUsers(db.getUsers());
  };

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUsrUsername('');
    setUsrName('');
    setUsrRole('User/Cashier');
    setUsrPassword('');
    setShowUsrPassword(false);
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setUsrUsername(u.username);
    setUsrName(u.name);
    setUsrRole(u.role);
    setUsrPassword(u.password || '');
    setShowUsrPassword(false);
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usrUsername.trim() || !usrName.trim()) {
      alert('Username and full name are required.');
      return;
    }

    const payload = {
      username: usrUsername.trim().toLowerCase(),
      name: usrName.trim(),
      role: usrRole,
      password: usrPassword || '1234'
    };

    if (editingUser) {
      db.updateUser({ ...payload, id: editingUser.id });
      alert('User account updated successfully!');
    } else {
      // Check for duplicate username
      if (users.some(u => u.username === payload.username)) {
        alert('This username is already taken. Please choose another.');
        return;
      }
      db.addUser(payload);
      alert('New user registered successfully!');
    }

    setShowUserModal(false);
    refreshUserList();
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUser.id) {
      alert('Access Denied: You cannot delete your own logged-in user session.');
      return;
    }

    const targetUser = users.find(u => u.id === id);
    if (targetUser && targetUser.role === 'Owner') {
      const ownersCount = users.filter(u => u.role === 'Owner').length;
      if (ownersCount <= 1) {
        alert('Access Denied: The system requires at least one registered Owner account.');
        return;
      }
    }

    if (confirm(`Are you sure you want to permanently delete user "${targetUser?.name || 'this user'}"?`)) {
      db.deleteUser(id);
      refreshUserList();
      alert('User deleted successfully.');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ShopSettings = {
      shop_name: shopName.toUpperCase().trim(),
      shop_phone: shopPhone.trim(),
      shop_email: shopEmail.trim(),
      shop_address: shopAddress.trim(),
      shop_header: shopHeader.trim(),
      shop_logo: shopLogo,
      tax_rate: Number(taxRate),
      thermal_printer_width: printerWidth
    };
    onUpdateSettings(updated);
    alert('Settings updated successfully!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setShopLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ADVANCED DB BACKUP DOWNLOAD (DUMP ALL STATE)
  const downloadDatabaseBackup = () => {
    const backupKeys = [
      'users',
      'categories',
      'suppliers',
      'customers',
      'products',
      'sales',
      'purchases',
      'expenses',
      'settings',
      'promotions',
      'stock_movements'
    ];

    const backupDump: { [key: string]: any } = {};
    backupKeys.forEach(key => {
      const rawData = localStorage.getItem(`wcs_${key}`);
      if (rawData) {
        try {
          backupDump[key] = JSON.parse(rawData);
        } catch {
          backupDump[key] = rawData;
        }
      }
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupDump, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `wcs_pos_db_backup_${new Date().toISOString().slice(0,10)}.json`);
    dlAnchorElem.click();
  };

  // ADVANCED DB BACKUP RESTORE (LOAD ALL STATE)
  const handleRestoreDatabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreJSON.trim()) return;

    if (!confirm('CRITICAL: Restoring this backup will overwrite ALL current products, customers, suppliers, expenses, and sales invoices! Do you want to proceed?')) {
      return;
    }

    try {
      const parsed = JSON.parse(restoreJSON);
      const keys = Object.keys(parsed);

      if (keys.length === 0) {
        setRestoreMsg('Error: Invalid empty backup file.');
        return;
      }

      keys.forEach(key => {
        localStorage.setItem(`wcs_${key}`, JSON.stringify(parsed[key]));
      });

      setRestoreMsg('DATABASE RESTORE SUCCESSFUL! Reloading application state...');
      setRestoreJSON('');
      
      // Delay to show success and reload
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      setRestoreMsg('Error parsing backup: ' + err.message);
    }
  };

  const handleResetDB = () => {
    if (confirm('CRITICAL: This will wipe all local data and reload default database mock seeds. Continue?')) {
      db.reset();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-blue-600" />
            Settings & Users
          </h2>
          <p className="text-sm text-slate-500">Edit business receipts custom headers, taxation rates, serialize backups, and manage cashier login accounts</p>
        </div>

        <div className="flex bg-slate-200 p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeTab === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Shop & Backups
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            User Accounts
          </button>
        </div>
      </div>

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* SHOP METADATA FORM */}
          <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1">
              <FileText className="w-4.5 h-4.5 text-slate-600" />
              Receipt Shop Settings
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-3 text-xs" id="shop-settings-form">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Registered Shop Name *</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 font-bold uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Phone Number(s) *</label>
                  <input
                    type="text"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={shopEmail}
                    onChange={(e) => setShopEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Address Details *</label>
                <input
                  type="text"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Receipt Header / Moto Subtitle</label>
                <input
                  type="text"
                  value={shopHeader}
                  onChange={(e) => setShopHeader(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 italic"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Taxation Rate (VAT/GST %)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-1.5 text-center font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Thermal Receipt Width</label>
                  <select
                    value={printerWidth}
                    onChange={(e) => setPrinterWidth(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white font-medium"
                  >
                    <option value="80mm">80mm Paper Width</option>
                    <option value="58mm">58mm Paper Width</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Shop Logo Graphic (Base64 JPEG/PNG)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                />
                {shopLogo && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={shopLogo} alt="Shop Logo Preview" className="h-10 w-10 object-contain rounded border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => setShopLogo('')}
                      className="text-[10px] text-red-500 font-bold cursor-pointer"
                    >
                      Remove Logo
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Configuration Settings
              </button>
            </form>
          </div>

          {/* BACKUP & RESTORE UTILITIES */}
          <div className="space-y-6">
            
            {/* EXPORT DATABASE BACKUP */}
            <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-3 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Download className="w-5 h-5 text-blue-600" />
                Download Database Backup Dump
              </h3>
              <p className="text-xs text-slate-500">
                Serialize your complete system state (users, categories, products, suppliers, customers, expenses, sales invoices) as a single downloadable file.
              </p>
              <button
                onClick={downloadDatabaseBackup}
                id="download-db-backup-btn"
                className="w-full py-2 bg-slate-800 hover:bg-slate-950 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Backup (.json)
              </button>
            </div>

            {/* IMPORT/RESTORE BACKUP */}
            <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-3 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Upload className="w-5 h-5 text-blue-600" />
                Restore Database Backup File
              </h3>
              <p className="text-xs text-slate-500">
                Paste your serialized database backup `.json` string here to reconstruct the full state of the system immediately.
              </p>

              <form onSubmit={handleRestoreDatabase} className="space-y-2">
                <textarea
                  placeholder="Paste backup json string file contents here..."
                  value={restoreJSON}
                  onChange={(e) => setRestoreJSON(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 h-20 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />

                {restoreMsg && (
                  <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-800 font-semibold rounded text-xs">
                    {restoreMsg}
                  </div>
                )}

                <button
                  type="submit"
                  id="restore-db-btn"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Upload & Restore Database
                </button>
              </form>
            </div>

            {/* SYSTEM OVERWRITE RESET */}
            <div className="bg-red-50 p-5 border border-red-200 rounded-xl space-y-2">
              <h4 className="font-bold text-red-900 text-xs uppercase tracking-wider">Danger Zone</h4>
              <p className="text-xs text-red-700 font-medium">Reset your local browser database to defaults, seeding the initial spare part catalog.</p>
              <button
                onClick={handleResetDB}
                className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded transition-colors cursor-pointer"
              >
                Wipe Database & Reset Seeds
              </button>
            </div>

          </div>

        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 border border-slate-200 rounded-xl gap-2">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Manage access credentials, logins, and permission levels for WCS cashiers and admin.
            </span>
            <button
              onClick={handleOpenAddUser}
              className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Access Role</th>
                    <th className="px-4 py-3">Account Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-950">{u.name}</td>
                      <td className="px-4 py-3 font-mono">{u.username}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            u.role === 'Owner'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'Admin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.id === currentUser.id ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            Active Session
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">Offline</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center items-center gap-3">
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === currentUser.id}
                            className={`font-bold flex items-center gap-0.5 ${
                              u.id === currentUser.id
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-red-500 hover:text-red-700 cursor-pointer'
                            }`}
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER / EDIT USER */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-bold text-slate-900 text-sm">
                {editingUser ? 'Edit User Profile' : 'Register New WCS User'}
              </h4>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>

            <form onSubmit={handleSaveUser} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Kasun Fernando"
                  value={usrName}
                  onChange={(e) => setUsrName(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Login Username *</label>
                <input
                  type="text"
                  placeholder="e.g. kasun123"
                  value={usrUsername}
                  onChange={(e) => setUsrUsername(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={!!editingUser}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Access Role *</label>
                <select
                  value={usrRole}
                  onChange={(e) => setUsrRole(e.target.value as Role)}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white font-semibold"
                >
                  <option value="User/Cashier">User/Cashier (Sales POS Billing Checkout Only)</option>
                  <option value="Admin">Admin (Full Inventory + Sales Control)</option>
                  <option value="Owner">Owner (Superuser, Backup Control)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Login Password *</label>
                <div className="relative">
                  <input
                    type={showUsrPassword ? 'text' : 'password'}
                    placeholder="Min 4 characters..."
                    value={usrPassword}
                    onChange={(e) => setUsrPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-slate-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowUsrPassword(!showUsrPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showUsrPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors mt-2 cursor-pointer"
              >
                {editingUser ? 'Save Profile Changes' : 'Register Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
