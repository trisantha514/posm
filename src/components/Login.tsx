/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Role } from '../types';
import { db } from '../utils/db';
import { Lock, Eye, EyeOff, UserPlus, Trash2, Key, ShieldCheck, LogIn } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [users, setUsers] = useState<User[]>(() => db.getUsers());
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Admin user management state
  const [isManagingUsers, setIsManagingUsers] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Role>('User/Cashier');
  const [newPassword, setNewPassword] = useState('');
  const [adminPasswordPrompt, setAdminPasswordPrompt] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === selectedUserId);
    if (!user) {
      setError('Selected user not found.');
      return;
    }

    if (user.password === password) {
      setError('');
      onLoginSuccess(user);
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newName || !newPassword) {
      alert('All fields are required.');
      return;
    }
    const added = db.addUser({
      username: newUsername.toLowerCase().trim(),
      name: newName.trim(),
      role: newRole,
      password: newPassword
    });
    setUsers(db.getUsers());
    setNewUsername('');
    setNewName('');
    setNewPassword('');
    alert(`User ${added.name} added successfully!`);
  };

  const handleDeleteUser = (id: string) => {
    const userToDelete = users.find(u => u.id === id);
    if (!userToDelete) return;

    if (userToDelete.username === 'admin') {
      alert('Cannot delete default system administrator.');
      return;
    }

    if (confirm(`Are you sure you want to delete user ${userToDelete.name}?`)) {
      db.deleteUser(id);
      const updated = db.getUsers();
      setUsers(updated);
      if (selectedUserId === id) {
        setSelectedUserId(updated[0]?.id || '');
      }
    }
  };

  const verifyAdminAccess = () => {
    const admin = users.find(u => u.role === 'Admin');
    if (admin && admin.password === adminPasswordPrompt) {
      setIsAdminUnlocked(true);
      setAdminPasswordPrompt('');
    } else {
      alert('Invalid Admin credentials!');
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-md text-white">
            <ShieldCheck className="w-12 h-12" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          WCS Inventory POS
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Sign in to access Point of Sale & Spare Parts Inventory
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          {!isManagingUsers ? (
            <form className="space-y-6" onSubmit={handleLogin} id="login-form">
              <div>
                <label htmlFor="user-select" className="block text-sm font-medium text-slate-700">
                  Select User Account
                </label>
                <div className="mt-1 relative">
                  <select
                    id="user-select"
                    value={selectedUserId}
                    onChange={(e) => {
                      setSelectedUserId(e.target.value);
                      setPassword('');
                      setError('');
                    }}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="password-input" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    id="toggle-password-visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 font-medium">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  id="submit-login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Access POS System
                </button>
              </div>

              <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
                <button
                  type="button"
                  id="manage-users-toggle"
                  onClick={() => setIsManagingUsers(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-500 flex items-center"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  Manage Accounts
                </button>
                <div className="text-xs text-slate-400">
                  Default password: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">123</span>
                </div>
              </div>
            </form>
          ) : (
            // User Management Panel
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center">
                  <UserPlus className="w-5 h-5 mr-1 text-slate-600" />
                  User Settings
                </h3>
                <button
                  onClick={() => {
                    setIsManagingUsers(false);
                    setIsAdminUnlocked(false);
                  }}
                  id="back-to-login"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Back to Login
                </button>
              </div>

              {!isAdminUnlocked ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Administrator authorization required to manage system accounts.
                  </p>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-700">Admin Password</label>
                    <input
                      type="password"
                      value={adminPasswordPrompt}
                      onChange={(e) => setAdminPasswordPrompt(e.target.value)}
                      placeholder="Enter administrator password..."
                      className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={verifyAdminAccess}
                    id="verify-admin-btn"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 focus:outline-none transition-colors"
                  >
                    Authorize Administrator
                  </button>
                </div>
              ) : (
                // Adding / Listing Users
                <div className="space-y-6">
                  <form onSubmit={handleCreateUser} className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Add New System User</h4>
                    <div>
                      <input
                        type="text"
                        placeholder="Full Name (e.g. Kamal Perera)"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="block w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Username"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="block w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                        required
                      />
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as Role)}
                        className="block w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                      >
                        <option value="User/Cashier">User/Cashier</option>
                        <option value="Owner">Owner</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="password"
                        placeholder="Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded transition-colors"
                    >
                      Save Account
                    </button>
                  </form>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Existing Accounts</h4>
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                      {users.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-2 hover:bg-slate-50 text-xs">
                          <div>
                            <div className="font-bold text-slate-800">{u.name}</div>
                            <div className="text-slate-500">@{u.username} • <span className="font-semibold text-blue-600">{u.role}</span></div>
                          </div>
                          {u.username !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
