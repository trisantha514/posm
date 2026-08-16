/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Expense } from '../types';
import { db } from '../utils/db';
import {
  Receipt,
  PlusCircle,
  Calendar,
  Tag,
  DollarSign,
  FileText,
  Trash2
} from 'lucide-react';

export function ExpensesList() {
  const [expenses, setExpenses] = useState<Expense[]>(() => db.getExpenses());

  // Form State
  const [expCategory, setExpCategory] = useState('Utility');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expDesc, setExpDesc] = useState('');
  const [expRef, setExpRef] = useState('');

  const refreshLists = () => {
    setExpenses(db.getExpenses());
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expAmount <= 0 || !expDesc.trim()) {
      alert('Valid amount and description are required!');
      return;
    }

    db.addExpense({
      category: expCategory,
      amount: expAmount,
      description: expDesc.trim(),
      reference_no: expRef.trim() || 'N/A'
    });

    setExpAmount(0);
    setExpDesc('');
    setExpRef('');
    refreshLists();
    alert('Expense recorded successfully!');
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      db.deleteExpense(id);
      refreshLists();
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-blue-600" />
            Shop Expense Ledger
          </h2>
          <p className="text-sm text-slate-500">Record rents, electric, wages, and other operating expenses</p>
        </div>

        <div className="bg-white px-4 py-2 border border-slate-200 rounded-lg shadow-sm font-mono flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-sans">Total Ledger:</span>
          <strong className="text-red-600 text-sm">LKR {totalExpenses.toLocaleString()}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: LOG NEW EXPENSE */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-4 h-fit">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1">
            <PlusCircle className="w-4 h-4 text-slate-600" />
            Record Business Cost
          </h3>

          <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Expense Category *</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 bg-white font-medium"
              >
                <option value="Rent">Warehouse Rent</option>
                <option value="Utility">Electricity & Water Utilities</option>
                <option value="Salary">Salaries & Wages</option>
                <option value="Transport">Delivery & Transport</option>
                <option value="Marketing">Advertising & Marketing</option>
                <option value="Other">Other Operating Cost</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Payment Amount (LKR) *</label>
              <input
                type="number"
                min="1"
                placeholder="LKR Amount"
                value={expAmount || ''}
                onChange={(e) => setExpAmount(Number(e.target.value))}
                className="w-full border border-slate-300 rounded p-1.5 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Reference Number / Bill No</label>
              <input
                type="text"
                placeholder="e.g. CEB-3200"
                value={expRef}
                onChange={(e) => setExpRef(e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Payment Description *</label>
              <textarea
                placeholder="Enter detailed description of what was purchased/paid..."
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 h-20"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              Log Operating Cost
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: EXPENSES HISTORY */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm text-xs">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase">
              <tr>
                <th className="px-4 py-3">Expense Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Reference No</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No operating expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-500">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold text-[10px]">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{e.reference_no}</td>
                    <td className="px-4 py-3 max-w-xs truncate" title={e.description}>
                      {e.description}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${e.amount < 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      LKR {Math.abs(e.amount).toLocaleString()} {e.amount < 0 ? '(Credit In)' : ''}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteExpense(e.id)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
