/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sale, Product, Customer, Expense } from '../types';
import { db } from '../utils/db';
import {
  TrendingUp,
  Wrench,
  AlertTriangle,
  UserCheck,
  ShoppingCart,
  DollarSign,
  PackageCheck,
  FileSpreadsheet
} from 'lucide-react';

export function Dashboard() {
  const [sales, setSales] = useState<Sale[]>(() => db.getSales());
  const [products, setProducts] = useState<Product[]>(() => db.getProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => db.getCustomers());
  const [expenses, setExpenses] = useState<Expense[]>(() => db.getExpenses());

  useEffect(() => {
    setSales(db.getSales());
    setProducts(db.getProducts());
    setCustomers(db.getCustomers());
    setExpenses(db.getExpenses());
  }, []);

  // Compute stats
  const totalSalesVal = sales
    .filter(s => s.type === 'Sale')
    .reduce((sum, s) => sum + s.total, 0);

  const totalSalesReturns = sales
    .filter(s => s.type === 'Return')
    .reduce((sum, s) => sum + s.total, 0);

  const netSalesValue = totalSalesVal - totalSalesReturns;

  const totalStockValue = products.reduce((sum, p) => sum + (p.stock_quantity * p.selling_price), 0);
  const outstandingCustomerCredit = customers.reduce((sum, c) => sum + c.current_credit, 0);
  const lowStockWarningCount = products.filter(p => p.stock_quantity <= p.min_stock_warning).length;

  const completedSales = sales.filter(s => s.type === 'Sale');
  const salesReturnsList = sales.filter(s => s.type === 'Return');

  // Dynamic featured item based on highest stock
  const featuredProduct = products.reduce((prev, current) => (prev.stock_quantity > current.stock_quantity) ? prev : current, products[0] || {
    id: 'PROD-1',
    part_name: 'Yamaha Air Filter (G-12)',
    item_code: 'YMF-12',
    stock_quantity: 124,
    selling_price: 1450,
    compatibility: 'Yamaha FZ / FZ-S V2'
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 space-y-6">
      {/* Top Banner */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">WCS Executive Dashboard</h2>
        <p className="text-sm text-slate-500">Real-time point of sale activity, catalog holdings, and credit balances</p>
      </div>

      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-4">
        
        {/* Daily Sales Card */}
        <div className="md:col-span-3 md:row-span-2 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Net Sales Revenue</p>
            <h2 className="text-3xl font-black text-slate-800 font-mono">LKR {netSalesValue.toLocaleString()}</h2>
          </div>
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
            <span>↑ {completedSales.length} Invoices</span>
            <span className="text-slate-400 font-normal">/{salesReturnsList.length} Returns</span>
          </div>
        </div>

        {/* Outstanding Credit Card */}
        <div className="md:col-span-3 md:row-span-2 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Outstanding Credit</p>
            <h2 className="text-3xl font-black text-slate-800 font-mono">LKR {outstandingCustomerCredit.toLocaleString()}</h2>
          </div>
          <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold">
            <span>{customers.filter(c => c.current_credit > 0).length} active garage accounts</span>
          </div>
        </div>

        {/* Featured / Fast Moving Item Card (Dark luxury highlight) */}
        <div className="md:col-span-6 md:row-span-3 bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <p className="text-orange-400 text-xs font-bold uppercase mb-2">Fast Moving Items</p>
              <h3 className="text-xl font-bold mb-4">{featuredProduct.part_name}</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                  <p className="text-[10px] text-slate-400 uppercase">Current Stock</p>
                  <p className="text-lg font-bold">{featuredProduct.stock_quantity} Units</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                  <p className="text-[10px] text-slate-400 uppercase">Retail Price</p>
                  <p className="text-lg font-bold text-orange-400 font-mono">LKR {featuredProduct.selling_price.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              Compatibility: {featuredProduct.compatibility || 'Universal Fitment'}
            </div>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
            <div className="w-48 h-48 border-4 border-white rounded-full"></div>
          </div>
        </div>

        {/* Stock Alerts list Card */}
        <div className="md:col-span-3 md:row-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-hidden flex flex-col">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Stock Alerts</p>
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {products.filter(p => p.stock_quantity <= p.min_stock_warning).length === 0 ? (
              <div className="text-slate-400 text-xs py-8 text-center">All systems nominal. No alerts!</div>
            ) : (
              products
                .filter(p => p.stock_quantity <= p.min_stock_warning)
                .map(p => (
                  <div key={p.id} className={`p-3 rounded-xl border ${p.stock_quantity === 0 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                    <p className="text-[11px] font-bold truncate" title={p.part_name}>{p.part_name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] font-semibold">Stock: {p.stock_quantity} left</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded text-white font-bold ${p.stock_quantity === 0 ? 'bg-red-600' : 'bg-orange-600'}`}>
                        {p.stock_quantity === 0 ? 'Out' : 'Low'}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Recent Sales List Card */}
        <div className="md:col-span-3 md:row-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col overflow-hidden">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Recent Sales</p>
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            {sales.length === 0 ? (
              <div className="text-slate-400 text-xs py-8 text-center">No transactions recorded yet.</div>
            ) : (
              sales.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xs font-bold font-mono">
                    INV
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold truncate">{s.invoice_number}</p>
                    <p className="text-[9px] text-slate-400 truncate">{s.customer_name} • {new Date(s.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-[11px] font-black font-mono text-slate-900 whitespace-nowrap">
                    LKR {s.total.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Monthly Revenue Chart and compatibility card */}
        <div className="md:col-span-6 md:row-span-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Revenue & Cost Analysis</p>
            <span className="text-[10px] text-blue-600 font-bold">Live Data Sync</span>
          </div>

          {/* SVG Bar Chart */}
          <div className="w-full h-36 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl p-2">
            <svg viewBox="0 0 500 150" className="w-full h-full">
              <line x1="40" y1="15" x2="480" y2="15" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="45" x2="480" y2="45" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="75" x2="480" y2="75" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="105" x2="480" y2="105" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="125" x2="480" y2="125" stroke="#cbd5e1" strokeWidth="1" />

              {/* Bar 1: Net Sales */}
              <text x="70" y="142" className="text-[9px] font-sans font-bold fill-slate-500" textAnchor="middle">Revenue</text>
              <rect x="50" y="35" width="40" height="90" className="fill-blue-600 hover:fill-blue-700 transition-all rounded" />
              <text x="70" y="28" className="text-[9px] font-mono font-bold fill-blue-700" textAnchor="middle">LKR {netSalesValue.toLocaleString()}</text>

              {/* Bar 2: Stock Asset Value */}
              <text x="190" y="142" className="text-[9px] font-sans font-bold fill-slate-500" textAnchor="middle">Inventory</text>
              <rect x="170" y="20" width="40" height="105" className="fill-emerald-600 hover:fill-emerald-700 transition-all" />
              <text x="190" y="14" className="text-[9px] font-mono font-bold fill-emerald-800" textAnchor="middle">LKR {totalStockValue.toLocaleString()}</text>

              {/* Bar 3: Garage Debts */}
              <text x="310" y="142" className="text-[9px] font-sans font-bold fill-slate-500" textAnchor="middle">Garage Debts</text>
              <rect x="290" y="80" width="40" height="45" className="fill-indigo-600 hover:fill-indigo-700 transition-all" />
              <text x="310" y="74" className="text-[9px] font-mono font-bold fill-indigo-700" textAnchor="middle">LKR {outstandingCustomerCredit.toLocaleString()}</text>

              {/* Bar 4: Expenses */}
              <text x="430" y="142" className="text-[9px] font-sans font-bold fill-slate-500" textAnchor="middle">Expenses</text>
              <rect x="410" y="95" width="40" height="30" className="fill-red-500 hover:fill-red-600 transition-all" />
              <text x="430" y="89" className="text-[9px] font-mono font-bold fill-red-700" textAnchor="middle">LKR {expenses.reduce((sum, e) => sum + Math.max(0, e.amount), 0).toLocaleString()}</text>
            </svg>
          </div>

          {/* Quick Metrics */}
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
            <div className="flex gap-4">
              <div>
                <p className="text-[10px] text-blue-500 uppercase font-bold">Monthly Revenue</p>
                <p className="text-lg font-black text-blue-900 font-mono">LKR {netSalesValue.toLocaleString()}</p>
              </div>
              <div className="w-[1px] bg-blue-200 h-8"></div>
              <div>
                <p className="text-[10px] text-blue-500 uppercase font-bold">Holdings Value</p>
                <p className="text-lg font-black text-blue-900 font-mono">LKR {totalStockValue.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-end gap-1">
              <div className="w-2 h-4 bg-blue-300 rounded-sm"></div>
              <div className="w-2 h-6 bg-blue-400 rounded-sm"></div>
              <div className="w-2 h-5 bg-blue-300 rounded-sm"></div>
              <div className="w-2 h-8 bg-blue-600 rounded-sm"></div>
              <div className="w-2 h-10 bg-blue-800 rounded-sm"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
