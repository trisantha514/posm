/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, Sale } from '../types';
import { db } from '../utils/db';
import {
  Users,
  PlusCircle,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  History,
  TrendingDown,
  Trash2,
  Edit2,
  Printer
} from 'lucide-react';

export function CustomersList() {
  const [customers, setCustomers] = useState<Customer[]>(() => db.getCustomers());
  const [sales, setSales] = useState<Sale[]>(() => db.getSales());

  // Form State
  const [showCustModal, setShowCustModal] = useState(false);
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custLimit, setCustLimit] = useState(100000);

  // Repayment State
  const [selectedRepayingCust, setSelectedRepayingCust] = useState<Customer | null>(null);
  const [repayAmount, setRepayAmount] = useState<number>(0);

  // Statement State
  const [selectedStatementCust, setSelectedStatementCust] = useState<Customer | null>(null);

  useEffect(() => {
    refreshLists();
  }, [showCustModal]);

  const refreshLists = () => {
    setCustomers(db.getCustomers());
    setSales(db.getSales());
  };

  const resetForm = () => {
    setEditingCust(null);
    setCustName('');
    setCustPhone('');
    setCustAddress('');
    setCustLimit(100000);
  };

  const openAddCust = () => {
    resetForm();
    setShowCustModal(true);
  };

  const openEditCust = (c: Customer) => {
    setEditingCust(c);
    setCustName(c.name);
    setCustPhone(c.phone);
    setCustAddress(c.address);
    setCustLimit(c.credit_limit);
    setShowCustModal(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    if (editingCust) {
      db.updateCustomer({
        id: editingCust.id,
        name: custName.trim(),
        phone: custPhone.trim() || '-',
        address: custAddress.trim() || '-',
        credit_limit: custLimit,
        current_credit: editingCust.current_credit
      });
    } else {
      db.addCustomer({
        name: custName.trim(),
        phone: custPhone.trim() || '-',
        address: custAddress.trim() || '-',
        credit_limit: custLimit
      });
    }

    setShowCustModal(false);
    resetForm();
    refreshLists();
  };

  const handleDeleteCust = (id: string) => {
    if (id === 'CUST-WALK') {
      alert('Walk-In Customer is a system essential account and cannot be deleted.');
      return;
    }
    if (confirm('Are you sure you want to delete this customer record?')) {
      db.deleteCustomer(id);
      refreshLists();
    }
  };

  const handleRepaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepayingCust || repayAmount <= 0) return;

    const remainingCredit = Math.max(0, selectedRepayingCust.current_credit - repayAmount);
    db.updateCustomer({
      ...selectedRepayingCust,
      current_credit: remainingCredit
    });

    // Also register an income / offset transaction by logging negative expense or similar, or just a payment log
    // For now we can add a sales log or outstanding credit log
    // We can subtract expense or add expense with negative amount as visual adjustment
    db.addExpense({
      category: 'Other',
      amount: -repayAmount, // Negative expense acts as income/credit settlement in profit calculation
      description: `Repayment received: ${selectedRepayingCust.name}`,
      reference_no: `REP-${selectedRepayingCust.id.substring(0, 4)}`
    });

    setSelectedRepayingCust(null);
    setRepayAmount(0);
    refreshLists();
    alert('Payment recorded. Outstanding customer credit reduced successfully!');
  };

  // Filter sales for selected customer
  const getCustomerSales = (custID: string) => {
    return sales.filter(s => s.customer_id === custID);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            Customer Credit & Accounts
          </h2>
          <p className="text-sm text-slate-500">Manage credit accounts, accept garage payments, and print statements</p>
        </div>

        <button
          onClick={openAddCust}
          id="add-new-customer-trigger"
          className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors self-start"
        >
          <PlusCircle className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map(c => {
          if (c.id === 'CUST-WALK') return null; // Hide walk-in in directory
          const custSales = getCustomerSales(c.id);
          const ratio = (c.current_credit / c.credit_limit) * 100;

          return (
            <div key={c.id} className="bg-white p-5 border border-slate-200 rounded-xl space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all hover:shadow-sm">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{c.name}</h4>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                      ID: {c.id}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    c.current_credit > c.credit_limit * 0.8
                      ? 'bg-red-100 text-red-800'
                      : c.current_credit > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {c.current_credit > 0 ? 'Has Credit' : 'Clear'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {c.phone}</div>
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {c.address}</div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>Invoices: <strong>{custSales.length}</strong></span>
                  </div>
                </div>

                {/* Credit limit meter */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Credit Limit Meter:</span>
                    <span className="font-mono text-slate-900 font-bold">{ratio.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full ${ratio > 80 ? 'bg-red-500' : ratio > 40 ? 'bg-amber-500' : 'bg-blue-600'}`}
                      style={{ width: `${Math.min(100, ratio)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold font-mono">
                    <span>Used: LKR {c.current_credit.toLocaleString()}</span>
                    <span>Limit: LKR {c.credit_limit.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                <div className="grid grid-cols-4 gap-1 text-[10px] font-extrabold uppercase">
                  <button
                    onClick={() => openEditCust(c)}
                    className="py-1.5 text-center bg-slate-100 text-slate-700 hover:bg-slate-200 rounded transition-colors col-span-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setSelectedRepayingCust(c)}
                    className="py-1.5 text-center bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-colors col-span-1"
                  >
                    Pay
                  </button>
                  <button
                    onClick={() => setSelectedStatementCust(c)}
                    className="py-1.5 text-center bg-slate-900 text-white hover:bg-slate-800 rounded transition-colors col-span-1"
                  >
                    Stmt
                  </button>
                  <button
                    onClick={() => handleDeleteCust(c.id)}
                    className="py-1.5 text-center bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors col-span-1"
                  >
                    Del
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: ADD/EDIT CUSTOMER */}
      {showCustModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-bold text-slate-900 text-sm">
                {editingCust ? 'Edit Customer Account' : 'Create New Customer Account'}
              </h4>
              <button onClick={() => setShowCustModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Customer / Garage Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Prasad Automotive Clinic"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 0775667788"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Max Credit Limit (LKR)</label>
                  <input
                    type="number"
                    value={custLimit}
                    onChange={(e) => setCustLimit(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-1.5 font-mono font-bold text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Street Address</label>
                <textarea
                  placeholder="Billing / Home business location address..."
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 h-16"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors mt-2"
              >
                Save Customer Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOG REPAYMENT PAYMENT */}
      {selectedRepayingCust && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-bold text-slate-900 text-sm">Accept Customer Repayment</h4>
              <button onClick={() => setSelectedRepayingCust(null)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>

            <form onSubmit={handleRepaymentSubmit} className="p-4 space-y-4 text-xs">
              <div>
                <div className="font-black text-slate-950 text-sm">{selectedRepayingCust.name}</div>
                <p className="text-slate-500 mt-0.5">Collect cash or cheque payment to settle outstanding invoices.</p>
              </div>

              <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100 font-mono text-blue-800">
                <span>Outstanding Credit Balance:</span>
                <span className="font-black text-sm">LKR {selectedRepayingCust.current_credit.toLocaleString()}</span>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Repayment Cash Amount Received (LKR) *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedRepayingCust.current_credit}
                  value={repayAmount || ''}
                  onChange={(e) => setRepayAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded p-2 text-center font-mono text-sm font-bold bg-slate-50"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-1"
              >
                <DollarSign className="w-4 h-4" />
                Record Cash Repayment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: STATEMENT OF ACCOUNT (A4 PRINT VIEW) */}
      {selectedStatementCust && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8 flex flex-col">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center print:hidden">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1">
                <FileText className="w-4 h-4 text-blue-600" />
                Account Statement & Invoices
              </h4>
              <button onClick={() => setSelectedStatementCust(null)} className="text-slate-400 hover:text-slate-600 font-bold font-sans">×</button>
            </div>

            {/* A4 Printable content */}
            <div className="p-8 overflow-y-auto max-h-[500px]" id="customer-statement-printable">
              <div className="space-y-6 text-xs text-slate-800 font-sans">
                {/* Statement Header */}
                <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">WCS INVENTORY & AUTOMOTIVE PARTS</h3>
                    <p className="text-slate-500">Negombo Road, Wattala, Sri Lanka</p>
                    <p className="text-slate-500">Tel: 0112345678</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">Statement of Account</h2>
                    <p className="text-slate-500">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Account details */}
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 border border-slate-200 rounded-lg">
                  <div>
                    <h5 className="font-bold text-slate-900 text-[11px] uppercase tracking-wide mb-1">Customer Account:</h5>
                    <p className="font-bold text-slate-950 text-sm">{selectedStatementCust.name}</p>
                    {selectedStatementCust.phone !== '-' && <p className="text-slate-600">Tel: {selectedStatementCust.phone}</p>}
                    <p className="text-slate-600">{selectedStatementCust.address}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div><strong>Account Status:</strong> Active Credit</div>
                    <div><strong>Outstanding Credit:</strong> <strong className="text-red-600 text-sm">LKR {selectedStatementCust.current_credit.toLocaleString()}</strong></div>
                    <div><strong>Max Credit Limit:</strong> LKR {selectedStatementCust.credit_limit.toLocaleString()}</div>
                    <div><strong>Available Balance:</strong> LKR {(selectedStatementCust.credit_limit - selectedStatementCust.current_credit).toLocaleString()}</div>
                  </div>
                </div>

                {/* Account Invoices list */}
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Invoice Purchase History</h4>
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-300 text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="px-4 py-2">Invoice No</th>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2">Cashier</th>
                          <th className="px-4 py-2 text-right">Invoice Total</th>
                          <th className="px-4 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {getCustomerSales(selectedStatementCust.id).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                              No purchase invoices logged under this account.
                            </td>
                          </tr>
                        ) : (
                          getCustomerSales(selectedStatementCust.id).map(sale => (
                            <tr key={sale.id}>
                              <td className="px-4 py-2 font-mono font-bold text-slate-900">{sale.invoice_number}</td>
                              <td className="px-4 py-2 text-slate-500">{new Date(sale.date).toLocaleString()}</td>
                              <td className="px-4 py-2 text-slate-500">{sale.cashier_name}</td>
                              <td className="px-4 py-2 text-right font-mono font-bold">LKR {sale.total.toLocaleString()}</td>
                              <td className="px-4 py-2 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  sale.status === 'Returned' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {sale.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* footer advice */}
                <div className="text-center pt-4 border-t border-slate-300 text-[10px] text-slate-400">
                  Please settle outstanding credit balances within 30 days of invoice date. Thank you.
                </div>
              </div>
            </div>

            {/* footer prints */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2 print:hidden justify-end">
              <button
                onClick={() => window.print()}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print Statement (A4)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
