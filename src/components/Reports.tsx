/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sale, Expense, Product, Purchase, User, Supplier } from '../types';
import { db } from '../utils/db';
import {
  FileBarChart,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Printer,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  Users,
  DollarSign,
  Package,
  Receipt,
  Truck,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Search,
  BookOpen,
  FolderOpen
} from 'lucide-react';

type ReportTab =
  | 'pl'
  | 'user_sales'
  | 'sales'
  | 'return_sales'
  | 'purchases'
  | 'return_purchases'
  | 'inventory'
  | 'suppliers'
  | 'user_cash'
  | 'expenses'
  | 'low_stock';

export function Reports() {
  const [sales, setSales] = useState<Sale[]>(() => db.getSales());
  const [expenses, setExpenses] = useState<Expense[]>(() => db.getExpenses());
  const [products, setProducts] = useState<Product[]>(() => db.getProducts());
  const [purchases, setPurchases] = useState<Purchase[]>(() => db.getPurchases());
  const [users, setUsers] = useState<User[]>(() => db.getUsers());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => db.getSuppliers());

  // Report view tabs
  const [reportTab, setReportTab] = useState<ReportTab>('pl');

  // Date Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // General Search Filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cashier performance selection
  const [selectedCashier, setSelectedCashier] = useState<string>('all');

  // Interactive UI: Expand invoice / purchase items row
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);

  // Supplier Payment states
  const [selectedPayingSupplier, setSelectedPayingSupplier] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Purchase order balance payment states
  const [selectedPayingPurchase, setSelectedPayingPurchase] = useState<Purchase | null>(null);
  const [purchasePaymentAmount, setPurchasePaymentAmount] = useState<number>(0);

  // Load and refresh lists when tab or filters change
  const refreshData = () => {
    setSales(db.getSales());
    setExpenses(db.getExpenses());
    setProducts(db.getProducts());
    setPurchases(db.getPurchases());
    setUsers(db.getUsers());
    setSuppliers(db.getSuppliers());
  };

  useEffect(() => {
    refreshData();
  }, [reportTab]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setSelectedCashier('all');
    setExpandedRowId(null);
    setExpandedSupplierId(null);
  };

  // Supplier overall payout balance settlement
  const handleSupplierPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayingSupplier || paymentAmount <= 0) return;

    const currentBalance = selectedPayingSupplier.balance;
    const newBalance = Math.max(0, currentBalance - paymentAmount);

    db.updateSupplier({
      ...selectedPayingSupplier,
      balance: newBalance
    });

    // Also register an expense for "Purchasing Cost / Supplier payout"
    db.addExpense({
      category: 'Other',
      amount: paymentAmount,
      description: `Settle Supplier Payout: ${selectedPayingSupplier.name}`,
      reference_no: `PAY-${selectedPayingSupplier.id.substring(0, 4)}`
    });

    setSelectedPayingSupplier(null);
    setPaymentAmount(0);
    refreshData();
    alert('Supplier balance payment recorded successfully.');
  };

  // Settle specific PO payment
  const handlePurchasePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayingPurchase || purchasePaymentAmount <= 0) return;

    if (purchasePaymentAmount > selectedPayingPurchase.balance) {
      alert('Error: Paid amount cannot exceed the current outstanding balance.');
      return;
    }

    db.settlePurchasePayment(selectedPayingPurchase.id, purchasePaymentAmount);
    alert('Purchase payment settled successfully!');
    setSelectedPayingPurchase(null);
    setPurchasePaymentAmount(0);
    refreshData();
  };

  // Helper date-check functions
  const isWithinDateRange = (dateStr: string) => {
    if (!dateStr) return true;
    const targetDate = dateStr.slice(0, 10);
    if (startDate && targetDate < startDate) return false;
    if (endDate && targetDate > endDate) return false;
    return true;
  };

  // Filter collections by date and specific queries
  const filteredSales = sales.filter(s => {
    const matchesDate = isWithinDateRange(s.date);
    const matchesQuery = searchQuery
      ? s.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.cashier_name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesDate && matchesQuery;
  });

  const filteredPurchases = purchases.filter(p => {
    const matchesDate = isWithinDateRange(p.date);
    const matchesQuery = searchQuery
      ? p.purchase_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesDate && matchesQuery;
  });

  const filteredExpenses = expenses.filter(e => {
    const matchesDate = isWithinDateRange(e.date);
    const matchesQuery = searchQuery
      ? e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.reference_no.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesDate && matchesQuery;
  });

  // Calculate Profit & Loss (P/L) based on current filtered collections
  const totalSalesRevenue = filteredSales
    .filter(s => s.status !== 'Returned' && s.type === 'Sale')
    .reduce((sum, s) => sum + s.total, 0);

  const totalSalesReturns = filteredSales
    .filter(s => s.type === 'Return')
    .reduce((sum, s) => sum + s.total, 0);

  const netRevenue = totalSalesRevenue - totalSalesReturns;

  const calculateCOGS = () => {
    let cogs = 0;
    filteredSales.forEach(sale => {
      if (sale.type === 'Sale') {
        sale.items.forEach(item => {
          const originalProduct = products.find(p => p.id === item.product_id);
          const buyPrice = originalProduct ? originalProduct.purchase_price : item.unit_price * 0.7;
          cogs += item.quantity * buyPrice;
        });
      } else if (sale.type === 'Return') {
        sale.items.forEach(item => {
          const originalProduct = products.find(p => p.id === item.product_id);
          const buyPrice = originalProduct ? originalProduct.purchase_price : item.unit_price * 0.7;
          cogs -= item.quantity * buyPrice;
        });
      }
    });
    return Math.max(0, cogs);
  };

  const totalCOGS = calculateCOGS();
  const grossProfit = netRevenue - totalCOGS;

  const totalOperatingExpenses = filteredExpenses
    .filter(e => e.amount > 0)
    .reduce((sum, e) => sum + e.amount, 0);

  const creditRepaymentsReceived = Math.abs(
    filteredExpenses.filter(e => e.amount < 0).reduce((sum, e) => sum + e.amount, 0)
  );

  const netProfit = grossProfit - totalOperatingExpenses + creditRepaymentsReceived;

  // Inventory Analysis
  const lowStockItems = products.filter(p => p.stock_quantity <= p.min_stock_warning);
  const outOfStockItems = products.filter(p => p.stock_quantity === 0);

  // Cashier sales performance calculations
  const getCashierPerformance = () => {
    const perf: { [name: string]: { salesCount: number; totalRev: number; cashCount: number; cardCount: number; creditCount: number } } = {};
    sales.forEach(s => {
      if (s.type === 'Sale' && isWithinDateRange(s.date)) {
        if (!perf[s.cashier_name]) {
          perf[s.cashier_name] = { salesCount: 0, totalRev: 0, cashCount: 0, cardCount: 0, creditCount: 0 };
        }
        perf[s.cashier_name].salesCount++;
        perf[s.cashier_name].totalRev += s.total;
        if (s.payment_method === 'Cash') perf[s.cashier_name].cashCount++;
        if (s.payment_method === 'Card') perf[s.cashier_name].cardCount++;
        if (s.payment_method === 'Credit') perf[s.cashier_name].creditCount++;
      }
    });
    return Object.keys(perf).map(name => ({
      name,
      ...perf[name]
    }));
  };

  const cashierStats = getCashierPerformance();

  // Print simulator
  const handlePrint = () => {
    window.print();
  };

  // Sidebar navigation tabs with styled indicators
  const tabs = [
    { id: 'pl', label: 'Profit & Loss Statement', icon: FileBarChart, color: 'text-blue-600 bg-blue-50' },
    { id: 'user_sales', label: 'User Sales Performance', icon: Users, color: 'text-purple-600 bg-purple-50' },
    { id: 'sales', label: 'Sales & Invoice Log', icon: Receipt, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'return_sales', label: 'Return Sales (Refunds)', icon: ArrowDownLeft, color: 'text-rose-600 bg-rose-50' },
    { id: 'purchases', label: 'Wholesale Purchases', icon: ShoppingBag, color: 'text-cyan-600 bg-cyan-50' },
    { id: 'return_purchases', label: 'Return Purchases', icon: ArrowUpRight, color: 'text-orange-600 bg-orange-50' },
    { id: 'inventory', label: 'Inventory List & Value', icon: Package, color: 'text-amber-600 bg-amber-50' },
    { id: 'suppliers', label: 'Supplier Accounts', icon: Truck, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'user_cash', label: 'User Cash Drawer Balances', icon: Coins, color: 'text-yellow-600 bg-yellow-50' },
    { id: 'expenses', label: 'Operating Expenses', icon: TrendingDown, color: 'text-rose-600 bg-rose-50' },
    { id: 'low_stock', label: 'Low Stock Alerts', icon: AlertTriangle, color: 'text-red-700 bg-red-100' }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileBarChart className="w-7 h-7 text-blue-600" />
            WCS Business Intelligence Reports
          </h2>
          <p className="text-xs text-slate-500">
            Real-time visual reports of sales performance, returned items, inventory valuations, suppliers accounts, and cash ledger.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 self-start shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Print Active Report (A4)
        </button>
      </div>

      {/* Dynamic Date Filtering Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl mb-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-2 rounded-lg text-slate-700 font-bold">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            Date Period Filter:
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-300 rounded-lg p-1.5 font-semibold bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-slate-300 rounded-lg p-1.5 font-semibold bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {(startDate || endDate) && (
            <div className="text-[10px] text-blue-600 bg-blue-50 font-bold px-2 py-1 rounded border border-blue-100 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Active Date Interval Enabled
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Universal query input based on active reports tabs */}
          {['sales', 'return_sales', 'purchases', 'return_purchases', 'expenses', 'inventory'].includes(reportTab) && (
            <div className="relative text-xs w-full sm:w-64">
              <input
                type="text"
                placeholder="Search report details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          )}

          {(startDate || endDate || searchQuery) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Multi-Tab Grid System */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar List (Left Panel on Desktop) */}
        <div className="lg:col-span-1 space-y-1">
          <div className="bg-slate-100/50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2.5 mb-2 flex items-center gap-1">
              <FolderOpen className="w-3 h-3" />
              Available Reports
            </div>

            {/* Mobile Dropdown Selection list */}
            <div className="block lg:hidden mb-2">
              <select
                value={reportTab}
                onChange={(e) => setReportTab(e.target.value as ReportTab)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
              >
                {tabs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Navigation Link Column */}
            <nav className="hidden lg:flex flex-col gap-1 text-xs">
              {tabs.map((t) => {
                const IconComponent = t.icon;
                const isSelected = reportTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setReportTab(t.id as ReportTab);
                      setExpandedRowId(null);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all font-bold text-left cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <IconComponent className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                      {t.label}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Panel (Right Panel on Desktop) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* ==============================================
              TAB 1: PROFIT & LOSS STATEMENT (pl)
              ============================================== */}
          {reportTab === 'pl' && (
            <div className="space-y-6 animate-fade-in">
              {/* Financial Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gross Revenue</span>
                  <div className="text-lg font-black text-slate-950 font-mono">LKR {netRevenue.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">Sales minus return refunds</div>
                </div>

                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">COGS (Wholesale Value)</span>
                  <div className="text-lg font-black text-slate-950 font-mono">LKR {totalCOGS.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">Purchase value of stock sold</div>
                </div>

                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Operating Costs</span>
                  <div className="text-lg font-black text-slate-950 font-mono">LKR {totalOperatingExpenses.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">Salaries, Rent, Utilities, etc.</div>
                </div>

                <div className={`p-4 border rounded-xl shadow-sm space-y-1 ${netProfit >= 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Net Business Profit</span>
                  <div className={`text-lg font-black font-mono ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    LKR {netProfit.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">Gross margins - total expenses</div>
                </div>
              </div>

              {/* A4 Printable Income Statement */}
              <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-3xl mx-auto shadow-sm" id="printed-statement">
                <div className="space-y-6 text-xs text-slate-800 font-sans">
                  
                  <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase">WCS AUTOMOTIVE PARTS & ACCESSORIES</h3>
                      <p className="text-slate-500">Wattala Road, Wattala, Sri Lanka</p>
                      <p className="text-slate-500">Official General Ledger Statement</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">Income Statement</h2>
                      <p className="text-slate-500 font-semibold">
                        Period: {startDate || 'All-Time'} {endDate ? `to ${endDate}` : ''}
                      </p>
                      <p className="text-slate-400 text-[10px]">Generated: {new Date().toLocaleString()}</p>
                    </div>
                  </div>

                  {/* SECTION 1: OPERATING REVENUE */}
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-1 uppercase tracking-wider">1. Operating Revenue</h4>
                    <div className="flex justify-between pl-4">
                      <span>Gross Customer Sales Invoiced</span>
                      <span className="font-mono">LKR {totalSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-4 text-red-600">
                      <span>Less: Sales Return Refunds</span>
                      <span className="font-mono">- LKR {totalSalesReturns.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-4 font-bold text-slate-950 border-t border-dashed border-slate-200 pt-1">
                      <span>Net Operating Revenue</span>
                      <span className="font-mono">LKR {netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* SECTION 2: COST OF SALES */}
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-1 uppercase tracking-wider">2. Cost of Sales (COGS)</h4>
                    <div className="flex justify-between pl-4">
                      <span>Cost of Goods Sold (Wholesale Purchase Cost of Stock)</span>
                      <span className="font-mono">LKR {totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-4 font-bold text-slate-950 bg-slate-50 p-1.5 border-t border-slate-200">
                      <span>GROSS TRADING PROFIT</span>
                      <span className="font-mono">LKR {grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* SECTION 3: EXPENSES */}
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-1 uppercase tracking-wider">3. Operating Expenses</h4>
                    {filteredExpenses.filter(e => e.amount > 0).map(e => (
                      <div key={e.id} className="flex justify-between pl-4 text-slate-600">
                        <span>{e.description} ({e.category})</span>
                        <span className="font-mono">LKR {e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                    {filteredExpenses.filter(e => e.amount > 0).length === 0 && (
                      <div className="text-slate-400 pl-4 italic">No operating costs logged in the selected range.</div>
                    )}
                    <div className="flex justify-between pl-4 border-t border-dashed border-slate-200 pt-1 font-bold text-slate-950">
                      <span>Total Operating Expenses</span>
                      <span className="font-mono">LKR {totalOperatingExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* EXCLUSIONS & INCOME ADJUSTMENTS */}
                  {creditRepaymentsReceived > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-1 uppercase tracking-wider">4. Offsets & Credit Collection</h4>
                      <div className="flex justify-between pl-4 text-emerald-700">
                        <span>Credit Repayments Collected (Re-entry)</span>
                        <span className="font-mono">LKR {creditRepaymentsReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}

                  {/* NET POSITION */}
                  <div className="flex justify-between items-center border-t-2 border-double border-slate-400 pt-3 text-sm font-black text-slate-950 bg-slate-100/60 p-2.5">
                    <span>NET BUSINESS MARGIN PROFIT / (LOSS)</span>
                    <span className="font-mono text-base text-blue-900">
                      LKR {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 2: USER SALES PERFORMANCE (user_sales)
              ============================================== */}
          {reportTab === 'user_sales' && (
            <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-6 shadow-sm text-xs animate-fade-in">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">User & Cashier Sales Performance</h3>
                <p className="text-slate-500">Track invoices generated and total billing revenues sorted by cashiers.</p>
              </div>

              {/* Cashier leaderboard statistics list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Ranking Grid */}
                <div className="space-y-3">
                  <div className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                    <span>Cashier Profile Summary</span>
                    <span className="text-[10px] text-slate-400">Filtered Revenue totals</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {cashierStats.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">No cashier transactions found for active date criteria.</div>
                    ) : (
                      cashierStats.map((c, idx) => (
                        <div key={c.name} className="py-2.5 flex items-center justify-between gap-3 font-medium">
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-500 font-bold">#{idx+1}</span>
                            <div>
                              <div className="font-extrabold text-slate-950">{c.name}</div>
                              <div className="text-[10px] text-slate-400">Invoiced: {c.salesCount} tickets</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-blue-700">LKR {c.totalRev.toLocaleString()}</div>
                            <div className="text-[9px] text-slate-400">Avg Ticket: LKR {Math.round(c.totalRev / (c.salesCount || 1)).toLocaleString()}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Cashier graphical progress bars */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-4">
                  <span className="font-bold text-slate-900">Sales Value Share Comparison</span>
                  <div className="space-y-3 font-medium">
                    {cashierStats.map(c => {
                      const totalOfAll = cashierStats.reduce((s, cashier) => s + cashier.totalRev, 0);
                      const percent = totalOfAll > 0 ? (c.totalRev / totalOfAll) * 100 : 0;
                      return (
                        <div key={c.name} className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-600">
                            <span>{c.name}</span>
                            <span className="font-mono font-bold">{percent.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {cashierStats.length === 0 && (
                      <p className="text-slate-400 italic text-center py-6">No data to display graphical share.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Cashier selection filters to view detailed ledger invoices */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-950 text-xs">Filter Detailed Invoices by Cashier:</span>
                  <select
                    value={selectedCashier}
                    onChange={(e) => setSelectedCashier(e.target.value)}
                    className="border border-slate-300 rounded p-1.5 bg-slate-50 font-bold"
                  >
                    <option value="all">-- All Cashiers --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-100 text-left">
                    <thead className="bg-slate-50 font-bold text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Invoice No</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Cashier</th>
                        <th className="px-4 py-3 text-center">Payment Method</th>
                        <th className="px-4 py-3 text-right">Total (LKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredSales
                        .filter(s => s.type === 'Sale' && (selectedCashier === 'all' || s.cashier_name === selectedCashier))
                        .map(s => (
                          <tr key={s.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-mono font-bold text-slate-950">{s.invoice_number}</td>
                            <td className="px-4 py-3">{s.customer_name}</td>
                            <td className="px-4 py-3 text-slate-500">{s.cashier_name}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                {s.payment_method}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">LKR {s.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      {filteredSales.filter(s => s.type === 'Sale' && (selectedCashier === 'all' || s.cashier_name === selectedCashier)).length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No matching cashier sales invoices found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==============================================
              TAB 3: SALES & INVOICE LOG (sales)
              ============================================== */}
          {reportTab === 'sales' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Customer Sales & Invoices</h3>
                  <p className="text-slate-500 font-medium">Browse, search, and expand detailed billing invoices to view line item margins.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-bold">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase">Invoices Logged</span>
                    <p className="text-base font-black text-slate-900 font-mono mt-0.5">{filteredSales.filter(s => s.type === 'Sale').length} invoices</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase">Total Sales Revenue</span>
                    <p className="text-base font-black text-slate-900 font-mono mt-0.5">LKR {totalSalesRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase">Cash Collections</span>
                    <p className="text-base font-black text-emerald-700 font-mono mt-0.5">
                      LKR {filteredSales.filter(s => s.type === 'Sale' && s.payment_method === 'Cash').reduce((sum, s) => sum + s.total, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase">Credit (Outstanding) Issued</span>
                    <p className="text-base font-black text-red-700 font-mono mt-0.5">
                      LKR {filteredSales.filter(s => s.type === 'Sale' && s.payment_method === 'Credit').reduce((sum, s) => sum + s.total, 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Detailed Sales Invoices List */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-100 text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Invoice No</th>
                        <th className="px-4 py-3">Date / Time</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Cashier</th>
                        <th className="px-4 py-3 text-center">Type / Method</th>
                        <th className="px-4 py-3 text-right">Invoice Total</th>
                        <th className="px-4 py-3 text-center w-20">Items</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredSales.map((s) => {
                        const isExpanded = expandedRowId === s.id;
                        return (
                          <React.Fragment key={s.id}>
                            <tr className={`hover:bg-slate-50/50 cursor-pointer ${s.status === 'Returned' ? 'bg-red-50/20' : ''}`} onClick={() => setExpandedRowId(isExpanded ? null : s.id)}>
                              <td className="px-4 py-3 font-mono font-bold text-slate-950 flex items-center gap-1">
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                                {s.invoice_number}
                              </td>
                              <td className="px-4 py-3 text-slate-500">{new Date(s.date).toLocaleString()}</td>
                              <td className="px-4 py-3 font-bold text-slate-800">{s.customer_name}</td>
                              <td className="px-4 py-3 text-slate-400">{s.cashier_name}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-slate-100 text-slate-700 font-mono">
                                  {s.payment_method}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                LKR {s.total.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-blue-600">
                                {s.items.length} lines
                              </td>
                            </tr>

                            {/* COLLAPSIBLE ROW WITH BILLING LIST ITEMS */}
                            {isExpanded && (
                              <tr className="bg-slate-100/30">
                                <td colSpan={7} className="px-6 py-4">
                                  <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3 shadow-inner">
                                    <span className="font-bold text-slate-900">Invoice Items Breakdown:</span>
                                    <table className="min-w-full divide-y divide-slate-100 text-left text-[11px] font-medium text-slate-600">
                                      <thead className="bg-slate-50 font-bold text-slate-500">
                                        <tr>
                                          <th className="px-3 py-2">Part Code</th>
                                          <th className="px-3 py-2">Part Name</th>
                                          <th className="px-3 py-2 text-center">Qty Bought</th>
                                          <th className="px-3 py-2 text-right">Unit Price</th>
                                          <th className="px-3 py-2 text-right">Discount</th>
                                          <th className="px-3 py-2 text-right">Total Line (LKR)</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {s.items.map((item) => (
                                          <tr key={item.id} className="hover:bg-slate-50">
                                            <td className="px-3 py-2 font-mono text-slate-800 font-bold">{item.product_code}</td>
                                            <td className="px-3 py-2 text-slate-900">{item.product_name}</td>
                                            <td className="px-3 py-2 text-center font-mono">{item.quantity}</td>
                                            <td className="px-3 py-2 text-right font-mono">LKR {item.unit_price.toLocaleString()}</td>
                                            <td className="px-3 py-2 text-right font-mono text-red-500">LKR {item.discount.toLocaleString()}</td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">LKR {item.total.toLocaleString()}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {filteredSales.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                            No billing invoice transactions matched selected query parameters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 4: SALES RETURNS & REFUNDS (return_sales)
              ============================================== */}
          {reportTab === 'return_sales' && (
            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4 text-xs animate-fade-in">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Customer Return Sales</h3>
                <p className="text-slate-500 font-medium">Trace back-logged items returned, restocking transactions, and credited vouchers.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] font-bold">
                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex justify-between items-center text-red-800">
                  <div>
                    <span>Total Sales Return Refunds</span>
                    <p className="text-lg font-black font-mono mt-0.5">LKR {totalSalesReturns.toLocaleString()}</p>
                  </div>
                  <ArrowDownLeft className="w-8 h-8 opacity-60" />
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-slate-700">
                  <div>
                    <span>Return Notes count</span>
                    <p className="text-lg font-black font-mono mt-0.5">
                      {filteredSales.filter(s => s.type === 'Return').length} refunds logged
                    </p>
                  </div>
                  <RefreshCw className="w-8 h-8 text-slate-300" />
                </div>
              </div>

              {/* Sales Return Log Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50 font-bold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Return ID</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Customer Reference</th>
                      <th className="px-4 py-3 text-center">Method</th>
                      <th className="px-4 py-3 text-right">Refund Amount</th>
                      <th className="px-4 py-3">Returned Parts List</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredSales
                      .filter(s => s.type === 'Return')
                      .map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/30 text-[11px]">
                          <td className="px-4 py-3 font-mono font-bold text-red-600">{s.invoice_number}</td>
                          <td className="px-4 py-3 text-slate-400">{new Date(s.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3">{s.customer_name}</td>
                          <td className="px-4 py-3 text-center font-bold">{s.payment_method}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-red-600">- LKR {s.total.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <ul className="list-disc pl-3 text-[10px] space-y-0.5 text-slate-500">
                              {s.items.map(item => (
                                <li key={item.id} className="font-semibold">
                                  {item.product_name} <span className="font-mono text-slate-400">({item.quantity} returned)</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    {filteredSales.filter(s => s.type === 'Return').length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                          No customer return notes logged during this time period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 5: WHOLESALE PURCHASES (purchases)
              ============================================== */}
          {reportTab === 'purchases' && (
            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4 text-xs animate-fade-in">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Wholesale Purchases & POs</h3>
                <p className="text-slate-500 font-medium">Detailed log of procurement orders issued to regional distributors.</p>
              </div>

              {/* Purchase Totals Cards */}
              <div className="grid grid-cols-3 gap-3 text-[10px] font-bold">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 uppercase">Purchase Total Cost</span>
                  <p className="text-base font-black text-slate-950 font-mono mt-0.5">
                    LKR {filteredPurchases.filter(p => p.status !== 'Returned').reduce((sum, p) => sum + p.total, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 uppercase">Total Settled (Paid)</span>
                  <p className="text-base font-black text-emerald-800 font-mono mt-0.5">
                    LKR {filteredPurchases.filter(p => p.status !== 'Returned').reduce((sum, p) => sum + p.paid_amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 uppercase">Outstanding Dues Balance</span>
                  <p className="text-base font-black text-red-700 font-mono mt-0.5">
                    LKR {filteredPurchases.filter(p => p.status !== 'Returned').reduce((sum, p) => sum + p.balance, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Purchases Invoices Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">PO Number</th>
                      <th className="px-4 py-3">Procurement Date</th>
                      <th className="px-4 py-3">Supplier Distributor</th>
                      <th className="px-4 py-3 text-right">Grand Total</th>
                      <th className="px-4 py-3 text-right">Paid Amount</th>
                      <th className="px-4 py-3 text-right font-bold text-red-600">Balance Due</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredPurchases
                      .filter(p => p.status !== 'Returned')
                      .map((p) => {
                        const isExpanded = expandedRowId === p.id;
                        return (
                          <React.Fragment key={p.id}>
                            <tr className="hover:bg-slate-50/40 cursor-pointer" onClick={() => setExpandedRowId(isExpanded ? null : p.id)}>
                              <td className="px-4 py-3 font-mono font-bold text-slate-950 flex items-center gap-1">
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                                {p.purchase_no}
                              </td>
                              <td className="px-4 py-3 text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                              <td className="px-4 py-3 font-bold text-slate-800">{p.supplier_name}</td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">LKR {p.total.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right font-mono text-emerald-700">LKR {p.paid_amount.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-red-600">LKR {p.balance.toLocaleString()}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${p.status === 'Received' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-700'}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                {p.balance > 0 ? (
                                  <button
                                    onClick={() => {
                                      setSelectedPayingPurchase(p);
                                      setPurchasePaymentAmount(p.balance);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded text-[10px]"
                                  >
                                    Pay Order
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">
                                    Fully Paid
                                  </span>
                                )}
                              </td>
                            </tr>

                            {/* Collapsible item details */}
                            {isExpanded && (
                              <tr className="bg-slate-100/30">
                                <td colSpan={8} className="px-6 py-4">
                                  <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-inner">
                                    <span className="font-bold text-slate-900 text-[11px]">Purchase Line Items Detail:</span>
                                    <table className="min-w-full divide-y divide-slate-100 text-[10px] font-medium text-slate-600">
                                      <thead className="bg-slate-50 font-bold text-slate-500">
                                        <tr>
                                          <th className="px-3 py-2">Part Code</th>
                                          <th className="px-3 py-2">Part Name</th>
                                          <th className="px-3 py-2 text-center">Qty Ordered</th>
                                          <th className="px-3 py-2 text-right">Wholesale Cost</th>
                                          <th className="px-3 py-2 text-right">Row Value</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {p.items.map((item) => (
                                          <tr key={item.id} className="hover:bg-slate-50">
                                            <td className="px-3 py-2 font-mono text-slate-800 font-bold">{item.product_code}</td>
                                            <td className="px-3 py-2 text-slate-900">{item.product_name}</td>
                                            <td className="px-3 py-2 text-center font-mono">{item.quantity}</td>
                                            <td className="px-3 py-2 text-right font-mono">LKR {item.cost_price.toLocaleString()}</td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">LKR {item.total.toLocaleString()}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    {filteredPurchases.filter(p => p.status !== 'Returned').length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-slate-400">No active wholesale purchases found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 6: PURCHASE RETURNS TO SUPPLIERS (return_purchases)
              ============================================== */}
          {reportTab === 'return_purchases' && (
            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4 text-xs animate-fade-in">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Purchase Returns & Refunds</h3>
                <p className="text-slate-500 font-medium">Overview of motorcycle and vehicle components returned back to distribution suppliers.</p>
              </div>

              {/* Totals panel */}
              <div className="bg-orange-50 p-4 border border-orange-100 rounded-xl flex items-center justify-between text-orange-950 font-bold text-xs">
                <div>
                  <span>Total Purchase Returns Refund Value</span>
                  <p className="text-lg font-black font-mono text-orange-700 mt-0.5">
                    LKR {filteredPurchases.filter(p => p.status === 'Returned').reduce((sum, p) => sum + p.total, 0).toLocaleString()}
                  </p>
                </div>
                <ArrowUpRight className="w-8 h-8 text-orange-400 opacity-60" />
              </div>

              {/* Purchase Returns Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50 font-bold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Return Note</th>
                      <th className="px-4 py-3">Returned Date</th>
                      <th className="px-4 py-3">Supplier Name</th>
                      <th className="px-4 py-3 text-right">Returned Total</th>
                      <th className="px-4 py-3">Returned Items Breakdown</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredPurchases
                      .filter(p => p.status === 'Returned')
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/30 text-[11px]">
                          <td className="px-4 py-3 font-mono font-bold text-orange-600">{p.purchase_no}</td>
                          <td className="px-4 py-3 text-slate-400">{new Date(p.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-bold">{p.supplier_name}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-red-600">- LKR {p.total.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <ul className="list-disc pl-3 text-[10px] text-slate-500 space-y-0.5">
                              {p.items.map(item => (
                                <li key={item.id} className="font-semibold">
                                  {item.product_name} <span className="font-mono">({item.quantity} units)</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    {filteredPurchases.filter(p => p.status === 'Returned').length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                          No wholesale items returned during this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 7: INVENTORY LIST & VALUE (inventory)
              ============================================== */}
          {reportTab === 'inventory' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Inventory Asset Valuation</h3>
                  <p className="text-slate-500 font-medium">A dynamic analysis of current shelf holdings, capital valuations, and average markup margins.</p>
                </div>

                {/* Inventory asset statistics cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-bold">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase">Stock Products</span>
                    <p className="text-base font-black text-slate-900 font-mono mt-0.5">{products.length} categories</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase">Physical Units On Hand</span>
                    <p className="text-base font-black text-blue-700 font-mono mt-0.5">{products.reduce((sum, p) => sum + p.stock_quantity, 0)} items</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase">Total Wholesale Cost Asset</span>
                    <p className="text-base font-black text-emerald-800 font-mono mt-0.5">
                      LKR {products.reduce((sum, p) => sum + (p.stock_quantity * p.purchase_price), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase">Total Potential Selling Value</span>
                    <p className="text-base font-black text-yellow-700 font-mono mt-0.5">
                      LKR {products.reduce((sum, p) => sum + (p.stock_quantity * p.selling_price), 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Inventory Table list of spare parts */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-100 text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Part Code</th>
                        <th className="px-4 py-3">Part Name</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-center">Stock Qty</th>
                        <th className="px-4 py-3 text-right">Wholesale Cost</th>
                        <th className="px-4 py-3 text-right">Selling Price</th>
                        <th className="px-4 py-3 text-right">Cost Value</th>
                        <th className="px-4 py-3 text-right">Retail Value</th>
                        <th className="px-4 py-3 text-center">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {products
                        .filter(p => searchQuery ? p.part_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.item_code.toLowerCase().includes(searchQuery.toLowerCase()) : true)
                        .map((p) => {
                          const totalCostVal = p.stock_quantity * p.purchase_price;
                          const totalRetailVal = p.stock_quantity * p.selling_price;
                          const markupMargin = p.selling_price > 0 ? ((p.selling_price - p.purchase_price) / p.selling_price) * 100 : 0;
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/50 text-[11px]">
                              <td className="px-4 py-3 font-mono font-bold text-slate-950">{p.item_code}</td>
                              <td className="px-4 py-3 font-semibold text-slate-800">{p.part_name}</td>
                              <td className="px-4 py-3 text-slate-400">{p.category}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded font-mono font-bold ${p.stock_quantity <= p.min_stock_warning ? 'bg-red-100 text-red-800 font-black' : 'bg-slate-100 text-slate-800'}`}>
                                  {p.stock_quantity}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-slate-500">LKR {p.purchase_price.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right font-mono text-slate-900">LKR {p.selling_price.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">LKR {totalCostVal.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-blue-800">LKR {totalRetailVal.toLocaleString()}</td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-emerald-600">{markupMargin.toFixed(0)}%</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 8: SUPPLIER ACCOUNTS (suppliers)
              ============================================== */}
          {reportTab === 'suppliers' && (
            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4 text-xs animate-fade-in">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Supplier Accounts & Ledgers</h3>
                <p className="text-slate-500 font-medium">Review outstanding trade balances and business volume for each manufacturing partner.</p>
              </div>

              {/* Total Balance Owed Summary */}
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between font-bold text-indigo-950">
                <div>
                  <span>Global Outstanding Trade Balance (Owed to Distributors)</span>
                  <p className="text-lg font-black font-mono text-indigo-700 mt-0.5">
                    LKR {suppliers.reduce((sum, s) => sum + s.balance, 0).toLocaleString()}
                  </p>
                </div>
                <Truck className="w-8 h-8 text-indigo-400 opacity-60" />
              </div>

              {/* Suppliers List Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50 font-bold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Supplier Name</th>
                      <th className="px-4 py-3">Contact info</th>
                      <th className="px-4 py-3">Registered Address</th>
                      <th className="px-4 py-3 text-center">Total PO Bills</th>
                      <th className="px-4 py-3 text-right">Purchases Value</th>
                      <th className="px-4 py-3 text-right font-bold text-red-600">Outstanding Balance</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {suppliers.map((s) => {
                      const supplierPurchases = purchases.filter(p => p.supplier_id === s.id && p.status !== 'Returned');
                      const purchasesTotalValue = supplierPurchases.reduce((sum, p) => sum + p.total, 0);
                      const totalBillCount = supplierPurchases.length;
                      const isExpanded = expandedSupplierId === s.id;
                      return (
                        <React.Fragment key={s.id}>
                          <tr className="hover:bg-slate-50/50 cursor-pointer" onClick={() => setExpandedSupplierId(isExpanded ? null : s.id)}>
                            <td className="px-4 py-3 font-bold text-slate-950 flex items-center gap-1.5">
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                              {s.name}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              <div>Tel: {s.phone}</div>
                              <div className="text-[10px] font-mono">{s.email}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{s.address}</td>
                            <td className="px-4 py-3 text-center font-bold font-mono">{totalBillCount} POs</td>
                            <td className="px-4 py-3 text-right font-mono text-slate-900">LKR {purchasesTotalValue.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-red-600">LKR {s.balance.toLocaleString()}</td>
                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              {s.balance > 0 ? (
                                <button
                                  onClick={() => {
                                    setSelectedPayingSupplier(s);
                                    setPaymentAmount(s.balance);
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded text-[10px]"
                                >
                                  Settle Balance
                                </button>
                              ) : (
                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded">
                                  No Balance
                                </span>
                              )}
                            </td>
                          </tr>

                          {/* Collapsible detailed Supplier Statement / balance report */}
                          {isExpanded && (
                            <tr className="bg-slate-100/40">
                              <td colSpan={7} className="px-6 py-4">
                                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                    <div>
                                      <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                                        <BookOpen className="w-4 h-4 text-indigo-600" />
                                        Statement of Account (Supplier Ledger): {s.name}
                                      </h4>
                                      <p className="text-[10px] text-slate-500 font-medium">Detailed log of all purchase orders issued and their current payment state.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="bg-red-50 text-red-800 border border-red-100 rounded-lg px-2.5 py-1 text-center font-mono font-bold text-[10px]">
                                        Total Outstanding: LKR {s.balance.toLocaleString()}
                                      </div>
                                      {s.balance > 0 && (
                                        <button
                                          onClick={() => {
                                            setSelectedPayingSupplier(s);
                                            setPaymentAmount(s.balance);
                                          }}
                                          className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                                        >
                                          <Coins className="w-3.5 h-3.5" />
                                          Pay Lump Sum
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <span className="font-bold text-slate-800 text-[11px] block">Procured Purchases & Outstanding Dues:</span>
                                    <div className="border border-slate-150 rounded-lg overflow-hidden">
                                      <table className="min-w-full divide-y divide-slate-100 text-[11px] text-left">
                                        <thead className="bg-slate-50 font-bold text-slate-500 text-[10px]">
                                          <tr>
                                            <th className="px-3 py-2">PO Number</th>
                                            <th className="px-3 py-2">Order Date</th>
                                            <th className="px-3 py-2 text-right">Order Total</th>
                                            <th className="px-3 py-2 text-right">Paid Amount</th>
                                            <th className="px-3 py-2 text-right font-bold text-red-600">Balance Due</th>
                                            <th className="px-3 py-2 text-center">Status</th>
                                            <th className="px-3 py-2 text-center">Action</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                          {purchases
                                            .filter(p => p.supplier_id === s.id && p.status !== 'Returned')
                                            .map(p => (
                                              <tr key={p.id} className="hover:bg-slate-50/50">
                                                <td className="px-3 py-2 font-mono font-bold text-slate-950">{p.purchase_no}</td>
                                                <td className="px-3 py-2 text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                                                <td className="px-3 py-2 text-right font-mono">LKR {p.total.toLocaleString()}</td>
                                                <td className="px-3 py-2 text-right font-mono text-emerald-700">LKR {p.paid_amount.toLocaleString()}</td>
                                                <td className="px-3 py-2 text-right font-mono font-bold text-red-600">LKR {p.balance.toLocaleString()}</td>
                                                <td className="px-3 py-2 text-center">
                                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                    p.status === 'Received' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                  }`}>
                                                    {p.status}
                                                  </span>
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                  {p.balance > 0 ? (
                                                    <button
                                                      onClick={() => {
                                                        setSelectedPayingPurchase(p);
                                                        setPurchasePaymentAmount(p.balance);
                                                      }}
                                                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-0.5 rounded text-[9px]"
                                                    >
                                                      Pay PO
                                                    </button>
                                                  ) : (
                                                    <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                                                      Paid
                                                    </span>
                                                  )}
                                                </td>
                                              </tr>
                                            ))}
                                          {purchases.filter(p => p.supplier_id === s.id && p.status !== 'Returned').length === 0 && (
                                            <tr>
                                              <td colSpan={7} className="px-3 py-6 text-center text-slate-400 italic">No purchase orders logged for this supplier.</td>
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 9: USER CASH BALANCES & DRAWERS (user_cash)
              ============================================== */}
          {reportTab === 'user_cash' && (
            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4 text-xs animate-fade-in">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Shift Cash Balance & Handover Audits</h3>
                <p className="text-slate-500">Calculate actual physical cash collections per cashier user before drawer count-offs.</p>
              </div>

              {/* Total cash collection tracker */}
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-center justify-between font-bold text-yellow-950 text-xs">
                <div>
                  <span>Aggregated Drawer Cash Holdings</span>
                  <p className="text-lg font-black font-mono text-yellow-700 mt-0.5">
                    LKR {filteredSales.filter(s => s.payment_method === 'Cash' && s.type === 'Sale').reduce((sum, s) => sum + s.total, 0) -
                      filteredSales.filter(s => s.payment_method === 'Cash' && s.type === 'Return').reduce((sum, s) => sum + s.total, 0)}
                  </p>
                </div>
                <Coins className="w-8 h-8 text-yellow-500 opacity-60" />
              </div>

              {/* Cash collection table by user/cashier name */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50 font-bold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Cashier Name</th>
                      <th className="px-4 py-3 text-right">Cash Sales (LKR)</th>
                      <th className="px-4 py-3 text-right">Card Sales (LKR)</th>
                      <th className="px-4 py-3 text-right">Credit Issued (LKR)</th>
                      <th className="px-4 py-3 text-right text-red-600">Cash Returns (LKR)</th>
                      <th className="px-4 py-3 text-right font-black text-blue-900 bg-slate-50">Drawer Cash Handover Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {users.map((u) => {
                      const cashierSales = filteredSales.filter(s => s.cashier_name === u.name);
                      const cashSalesTotal = cashierSales.filter(s => s.type === 'Sale' && s.payment_method === 'Cash').reduce((sum, s) => sum + s.total, 0);
                      const cardSalesTotal = cashierSales.filter(s => s.type === 'Sale' && s.payment_method === 'Card').reduce((sum, s) => sum + s.total, 0);
                      const creditSalesTotal = cashierSales.filter(s => s.type === 'Sale' && s.payment_method === 'Credit').reduce((sum, s) => sum + s.total, 0);
                      const cashReturnsTotal = cashierSales.filter(s => s.type === 'Return' && s.payment_method === 'Cash').reduce((sum, s) => sum + s.total, 0);
                      const netCashDrawer = cashSalesTotal - cashReturnsTotal;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-bold text-slate-950">
                            <div>{u.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">{u.role}</div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono">LKR {cashSalesTotal.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-400">LKR {cardSalesTotal.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-400">LKR {creditSalesTotal.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-mono text-red-500">LKR {cashReturnsTotal.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-mono font-black text-blue-800 bg-blue-50/40">
                            LKR {netCashDrawer.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 10: OPERATING EXPENSES (expenses)
              ============================================== */}
          {reportTab === 'expenses' && (
            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4 text-xs animate-fade-in">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Operating Expenses Log</h3>
                <p className="text-slate-500 font-medium">Review categorized administrative outlays, utilities, rent, and salaries.</p>
              </div>

              {/* Total Expenses summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-bold">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400">Utility Costs</span>
                  <p className="text-sm font-black text-slate-900 font-mono mt-0.5">
                    LKR {filteredExpenses.filter(e => e.category === 'Utility').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400">Salaries & Wages</span>
                  <p className="text-sm font-black text-slate-900 font-mono mt-0.5">
                    LKR {filteredExpenses.filter(e => e.category === 'Salary').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400">Rent Costs</span>
                  <p className="text-sm font-black text-slate-900 font-mono mt-0.5">
                    LKR {filteredExpenses.filter(e => e.category === 'Rent').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400">Other / Miscellaneous</span>
                  <p className="text-sm font-black text-slate-900 font-mono mt-0.5">
                    LKR {filteredExpenses.filter(e => e.category === 'Other').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Expenses List Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50 font-bold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Expense ID</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Description Details</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Reference No</th>
                      <th className="px-4 py-3 text-right">Amount Outlay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredExpenses.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-400">{e.id}</td>
                        <td className="px-4 py-3 text-slate-400">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{e.description}</td>
                        <td className="px-4 py-3">
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-[9px] uppercase">{e.category}</span>
                        </td>
                        <td className="px-4 py-3 font-mono">{e.reference_no}</td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${e.amount < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {e.amount < 0 ? `+ LKR ${Math.abs(e.amount).toLocaleString()}` : `LKR ${e.amount.toLocaleString()}`}
                        </td>
                      </tr>
                    ))}
                    {filteredExpenses.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                          No operating expenses logged for this criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 11: LOW STOCK & OUT OF STOCK ALERTS (low_stock)
              ============================================== */}
          {reportTab === 'low_stock' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm text-xs animate-fade-in">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                  Reorder Stock Alert Ledger
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  These items are critical or low on shelves and need quick replenishment purchase orders.
                </p>
              </div>

              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50 font-bold text-slate-600 uppercase text-[9px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Part Code</th>
                    <th className="px-4 py-3">Spare Part Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-center">In Stock</th>
                    <th className="px-4 py-3 text-center">Alert Limit</th>
                    <th className="px-4 py-3 text-right text-red-600">Reorder Alert Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {lowStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        All spare parts are presently well-stocked. No warnings!
                      </td>
                    </tr>
                  ) : (
                    lowStockItems.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 font-mono font-bold text-slate-950">{p.item_code}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{p.part_name}</td>
                        <td className="px-4 py-3 text-slate-400">{p.category}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold font-mono ${p.stock_quantity === 0 ? 'bg-red-100 text-red-700 font-black' : 'bg-amber-100 text-amber-700'}`}>
                            {p.stock_quantity} units
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-400">{p.min_stock_warning} units</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-black uppercase text-[9px] px-2 py-1 rounded ${p.stock_quantity === 0 ? 'bg-red-100 text-red-800' : 'bg-amber-50 text-amber-800'}`}>
                            {p.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock Warning'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* MODAL: SUPPLIER BALANCE PAYOUT SETTLEMENT */}
          {selectedPayingSupplier && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1">
                    <Coins className="w-4 h-4 text-indigo-600" />
                    Settle Supplier Balance Payout
                  </h4>
                  <button onClick={() => setSelectedPayingSupplier(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
                </div>

                <form onSubmit={handleSupplierPayment} className="p-4 space-y-4 text-xs">
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">{selectedPayingSupplier.name}</div>
                    <p className="text-slate-500 font-medium mt-0.5">Pay outstanding wholesale bills and deduct balance.</p>
                  </div>

                  <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-100 font-mono text-red-800">
                    <span>Outstanding Balance:</span>
                    <span className="font-black text-sm">LKR {selectedPayingSupplier.balance.toLocaleString()}</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Payout Cash / Cheque Amount (LKR) *</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedPayingSupplier.balance}
                      value={paymentAmount || ''}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded p-2 text-center font-mono text-sm font-bold bg-slate-50"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1 text-xs"
                  >
                    <DollarSign className="w-4 h-4" />
                    Record Cash Payout
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: PAY SPECIFIC PURCHASE ORDER BALANCE */}
          {selectedPayingPurchase && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1">
                    <Receipt className="w-4 h-4 text-blue-600" />
                    Settle Purchase Order Payment
                  </h4>
                  <button onClick={() => setSelectedPayingPurchase(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
                </div>

                <form onSubmit={handlePurchasePayment} className="p-4 space-y-4 text-xs">
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">Order No: {selectedPayingPurchase.purchase_no}</div>
                    <p className="text-slate-500 font-medium mt-0.5">Supplier: {selectedPayingPurchase.supplier_name}</p>
                  </div>

                  <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-100 font-mono text-red-800">
                    <span>Current Outstanding PO Balance:</span>
                    <span className="font-black text-sm">LKR {selectedPayingPurchase.balance.toLocaleString()}</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Wholesale Payment Amount (LKR) *</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedPayingPurchase.balance}
                      value={purchasePaymentAmount || ''}
                      onChange={(e) => setPurchasePaymentAmount(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded p-2 text-center font-mono text-sm font-bold bg-slate-50"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1 text-xs"
                  >
                    <DollarSign className="w-4 h-4" />
                    Settle PO Balance
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
