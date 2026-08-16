/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Supplier, Purchase, Product, PurchaseItem } from '../types';
import { db } from '../utils/db';
import {
  Truck,
  PlusCircle,
  FileText,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  TrendingDown,
  ChevronRight,
  PackagePlus,
  ArrowRight,
  DollarSign,
  RefreshCw
} from 'lucide-react';

export function Purchasing() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => db.getSuppliers());
  const [purchases, setPurchases] = useState<Purchase[]>(() => db.getPurchases());
  const [products, setProducts] = useState<Product[]>(() => db.getProducts());

  // Tabs: "suppliers" | "new-po" | "po-history" | "purchase-return"
  const [activeTab, setActiveTab] = useState<'suppliers' | 'new-po' | 'po-history' | 'purchase-return'>('suppliers');

  // Supplier forms state
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supBalance, setSupBalance] = useState(0);

  // New Purchase Order Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poItems, setPoItems] = useState<Omit<PurchaseItem, 'id' | 'product_name' | 'product_code' | 'total'>[]>([]);
  const [poPaidAmount, setPoPaidAmount] = useState<number>(0);
  const [poStatus, setPoStatus] = useState<'Ordered' | 'Received'>('Ordered');

  // Temporary row inside PO editor
  const [tempProductId, setTempProductId] = useState('');
  const [tempCostPrice, setTempCostPrice] = useState<number>(0);
  const [tempQty, setTempQty] = useState<number>(1);

  // Supplier Payment state
  const [selectedPayingSupplier, setSelectedPayingSupplier] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Purchase order balance payment state
  const [selectedPayingPurchase, setSelectedPayingPurchase] = useState<Purchase | null>(null);
  const [purchasePaymentAmount, setPurchasePaymentAmount] = useState<number>(0);

  // Purchase Return states
  const [selectedReturnPoId, setSelectedReturnPoId] = useState<string>('');
  const [returnPoQuantities, setReturnPoQuantities] = useState<{ [productId: string]: number }>({});
  const [returnPoSuccessMsg, setReturnPoSuccessMsg] = useState<string>('');

  useEffect(() => {
    refreshLists();
  }, [activeTab]);

  const refreshLists = () => {
    setSuppliers(db.getSuppliers());
    setPurchases(db.getPurchases());
    setProducts(db.getProducts());
  };

  const resetSupplierForm = () => {
    setEditingSupplier(null);
    setSupName('');
    setSupPhone('');
    setSupEmail('');
    setSupAddress('');
    setSupBalance(0);
  };

  const openAddSupplier = () => {
    resetSupplierForm();
    setShowSupplierModal(true);
  };

  const openEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupName(s.name);
    setSupPhone(s.phone);
    setSupEmail(s.email);
    setSupAddress(s.address);
    setSupBalance(s.balance);
    setShowSupplierModal(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    const payload = {
      name: supName.trim(),
      phone: supPhone.trim() || '-',
      email: supEmail.trim() || '-',
      address: supAddress.trim() || '-',
      balance: Number(supBalance)
    };

    if (editingSupplier) {
      db.updateSupplier({ ...payload, id: editingSupplier.id });
    } else {
      db.addSupplier(payload);
    }

    setShowSupplierModal(false);
    resetSupplierForm();
    refreshLists();
  };

  const handleDeleteSupplier = (id: string) => {
    if (confirm('Are you sure you want to delete this supplier? This will not affect existing purchases.')) {
      db.deleteSupplier(id);
      refreshLists();
    }
  };

  // PO Creation logic
  const handleAddPoItem = () => {
    if (!tempProductId) {
      alert('Select a product to add to the order list.');
      return;
    }
    if (tempCostPrice <= 0 || tempQty <= 0) {
      alert('Cost price and quantity must exceed 0.');
      return;
    }

    // Check if duplicate
    if (poItems.some(i => i.product_id === tempProductId)) {
      alert('This spare part is already added to the order. Please update existing quantity.');
      return;
    }

    setPoItems([
      ...poItems,
      {
        product_id: tempProductId,
        quantity: tempQty,
        cost_price: tempCostPrice
      }
    ]);

    setTempProductId('');
    setTempCostPrice(0);
    setTempQty(1);
  };

  const handleRemovePoItem = (productId: string) => {
    setPoItems(poItems.filter(item => item.product_id !== productId));
  };

  const calculatePoSubtotal = () => {
    return poItems.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0);
  };

  const handleSavePurchaseOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const supId = selectedSupplierId || suppliers[0]?.id;
    if (!supId) {
      alert('A valid Supplier is required.');
      return;
    }
    if (poItems.length === 0) {
      alert('Purchase order must contain at least 1 spare-part item.');
      return;
    }

    const supplier = suppliers.find(s => s.id === supId);
    if (!supplier) return;

    const itemsWithDetails: PurchaseItem[] = poItems.map(item => {
      const prod = products.find(p => p.id === item.product_id);
      return {
        id: Math.random().toString(36).substring(2, 7).toUpperCase(),
        product_id: item.product_id,
        product_name: prod?.part_name || 'Unknown Part',
        product_code: prod?.item_code || 'CODE',
        quantity: item.quantity,
        cost_price: item.cost_price,
        total: item.quantity * item.cost_price
      };
    });

    const poTotal = calculatePoSubtotal();
    const balance = Math.max(0, poTotal - poPaidAmount);

    db.addPurchase({
      supplier_id: supId,
      supplier_name: supplier.name,
      status: poStatus,
      total: poTotal,
      paid_amount: poPaidAmount,
      balance,
      items: itemsWithDetails
    });

    // Reset Form
    setSelectedSupplierId('');
    setPoItems([]);
    setPoPaidAmount(0);
    setPoStatus('Ordered');
    setActiveTab('po-history');
    alert('Purchase transaction logged successfully!');
  };

  // Settle Outstanding Supplier Balance
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
    refreshLists();
    alert('Supplier balance payment recorded successfully.');
  };

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
    refreshLists();
  };

  const handleUpdateProductCost = (prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setTempCostPrice(prod.purchase_price);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-7 h-7 text-blue-600" />
            Purchasing & Supplier Orders
          </h2>
          <p className="text-sm text-slate-500">Add suppliers, register Purchase Orders, and replenish motor spare-part stock</p>
        </div>

        <div className="flex bg-slate-200 p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'suppliers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Suppliers List
          </button>
          <button
            onClick={() => setActiveTab('new-po')}
            id="new-purchase-order-tab"
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'new-po' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            New Purchase Order
          </button>
          <button
            onClick={() => setActiveTab('po-history')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'po-history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Purchase History
          </button>
          <button
            onClick={() => setActiveTab('purchase-return')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'purchase-return' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Purchase Return
          </button>
        </div>
      </div>

      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-xl">
            <span className="text-xs text-slate-500 font-medium">Keep records of automotive spare part distributors and log outstanding credits</span>
            <button
              onClick={openAddSupplier}
              id="add-supplier-btn"
              className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Add Supplier
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(s => (
              <div key={s.id} className="bg-white p-5 border border-slate-200 rounded-xl space-y-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{s.name}</h4>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold uppercase text-slate-600">ID: {s.id}</span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {s.phone}</div>
                    <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {s.email}</div>
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {s.address}</div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Outstanding Balance:</span>
                    <span className={`font-mono font-black text-sm ${s.balance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                      LKR {s.balance.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-1 text-[11px] font-bold">
                    <button
                      onClick={() => openEditSupplier(s)}
                      className="py-1 text-center bg-slate-100 text-slate-700 hover:bg-slate-200 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setSelectedPayingSupplier(s)}
                      className="py-1 text-center bg-blue-50 text-blue-700 hover:bg-blue-100 rounded"
                    >
                      Settle Bal
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(s.id)}
                      className="py-1 text-center bg-red-50 text-red-600 hover:bg-red-100 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'new-po' && (
        <form onSubmit={handleSavePurchaseOrder} className="bg-white border border-slate-200 rounded-xl p-5 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-base">Issue New Purchase Order</h3>
            <p className="text-xs text-slate-500 mt-1">Order stock replenishment items. Received status auto-increments product counts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Supplier Selector */}
            <div>
              <label className="block text-slate-600 font-bold mb-1">Select Supplier Distributor *</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 bg-white font-medium"
                id="po-supplier-select"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (Outstanding LKR {s.balance.toLocaleString()})</option>
                ))}
              </select>
            </div>

            {/* Order Status */}
            <div>
              <label className="block text-slate-600 font-bold mb-1">Purchase Order Status *</label>
              <select
                value={poStatus}
                onChange={(e) => setPoStatus(e.target.value as any)}
                className="w-full border border-slate-300 rounded p-1.5 bg-white font-medium text-blue-700"
                id="po-status-select"
              >
                <option value="Ordered">Ordered (Awaiting Delivery)</option>
                <option value="Received">Received (Instantly Add Stock to Catalog)</option>
              </select>
            </div>

            {/* Paid Amount */}
            <div>
              <label className="block text-slate-600 font-bold mb-1">Paid Amount (LKR)</label>
              <input
                type="number"
                min="0"
                value={poPaidAmount}
                onChange={(e) => setPoPaidAmount(Number(e.target.value))}
                className="w-full border border-slate-300 rounded p-1.5 font-mono font-bold"
                id="po-paid-amount-input"
              />
            </div>
          </div>

          {/* ITEM ADDITION GRID */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Add Spare Part to Purchase Order</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5 text-xs">
                <label className="block text-slate-500 font-medium mb-1">Select Spare Part Item</label>
                <select
                  value={tempProductId}
                  onChange={(e) => {
                    setTempProductId(e.target.value);
                    handleUpdateProductCost(e.target.value);
                  }}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white"
                >
                  <option value="">-- Choose Spare Part --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.part_name} ({p.item_code})</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3 text-xs">
                <label className="block text-slate-500 font-medium mb-1">Wholesale Cost Price per unit (LKR)</label>
                <input
                  type="number"
                  min="0"
                  value={tempCostPrice || ''}
                  onChange={(e) => setTempCostPrice(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded p-1.5 font-mono font-bold"
                />
              </div>

              <div className="md:col-span-2 text-xs">
                <label className="block text-slate-500 font-medium mb-1">Order Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={tempQty}
                  onChange={(e) => setTempQty(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded p-1.5 text-center font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={handleAddPoItem}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-950 text-white rounded font-bold text-xs flex justify-center items-center gap-1 transition-colors"
                >
                  <PackagePlus className="w-4 h-4" />
                  Add Row
                </button>
              </div>
            </div>
          </div>

          {/* ACTIVE PO ITEMS LIST */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Current Items on Invoice</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold">
                  <tr>
                    <th className="px-4 py-2">Part Description</th>
                    <th className="px-4 py-2 text-right">Unit Wholesale Cost</th>
                    <th className="px-4 py-2 text-center">Quantity</th>
                    <th className="px-4 py-2 text-right">Subtotal</th>
                    <th className="px-4 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {poItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        No spare parts added to PO invoice list.
                      </td>
                    </tr>
                  ) : (
                    poItems.map(item => {
                      const prod = products.find(p => p.id === item.product_id);
                      return (
                        <tr key={item.product_id}>
                          <td className="px-4 py-2 font-semibold">
                            <div>{prod?.part_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{prod?.item_code}</div>
                          </td>
                          <td className="px-4 py-2 text-right font-mono">
                            LKR {item.cost_price.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-center font-mono">{item.quantity}</td>
                          <td className="px-4 py-2 text-right font-mono font-bold">
                            LKR {(item.quantity * item.cost_price).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePoItem(item.product_id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOTALS & checkout BUTTON */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 border border-slate-100 rounded-lg gap-4 text-xs">
            <div className="space-y-1 font-medium text-slate-600">
              <div className="flex gap-2 justify-between">
                <span>Purchase Subtotal:</span>
                <strong className="text-slate-900">LKR {calculatePoSubtotal().toLocaleString()}</strong>
              </div>
              <div className="flex gap-2 justify-between">
                <span>Paid Amount:</span>
                <strong className="text-slate-900">LKR {poPaidAmount.toLocaleString()}</strong>
              </div>
              <div className="flex gap-2 justify-between text-red-600">
                <span>Unpaid Balance (Adding to Supplier Account):</span>
                <strong>LKR {Math.max(0, calculatePoSubtotal() - poPaidAmount).toLocaleString()}</strong>
              </div>
            </div>

            <button
              type="submit"
              id="po-submit-btn"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              Log Purchase Order
            </button>
          </div>
        </form>
      )}

      {activeTab === 'po-history' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm text-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="px-4 py-3">PO Number</th>
                  <th className="px-4 py-3">Supplier Name</th>
                  <th className="px-4 py-3">Order Date</th>
                  <th className="px-4 py-3 text-right">Total Invoice</th>
                  <th className="px-4 py-3 text-right">Paid Amount</th>
                  <th className="px-4 py-3 text-right">Balance Due</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      No purchasing transactions logged yet.
                    </td>
                  </tr>
                ) : (
                  purchases.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-bold text-slate-950 font-mono">{p.purchase_no}</td>
                      <td className="px-4 py-3 font-semibold">{p.supplier_name}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(p.date).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono">LKR {p.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700">LKR {p.paid_amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-red-600">LKR {p.balance.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            p.status === 'Received'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'Returned'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.status === 'Returned' ? (
                          <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-1 rounded">
                            Returned Order
                          </span>
                        ) : p.balance > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedPayingPurchase(p);
                              setPurchasePaymentAmount(p.balance);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded transition-colors cursor-pointer text-[10px]"
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'purchase-return' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Left panel: select received purchase order */}
          <div className="bg-white p-5 border border-slate-200 rounded-xl h-fit space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-slate-600" />
              New Purchase Return
            </h3>
            <p className="text-slate-500 font-medium">Select an active Received Purchase Order invoice below to specify return items.</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Select Purchase Order (PO)</label>
                <select
                  value={selectedReturnPoId}
                  onChange={(e) => {
                    const poId = e.target.value;
                    setSelectedReturnPoId(poId);
                    // Initialize quantities to return
                    const foundPo = purchases.find(p => p.id === poId);
                    if (foundPo) {
                      const initialQtes: { [productId: string]: number } = {};
                      foundPo.items.forEach(item => {
                        initialQtes[item.product_id] = 0;
                      });
                      setReturnPoQuantities(initialQtes);
                    } else {
                      setReturnPoQuantities({});
                    }
                  }}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white font-semibold"
                >
                  <option value="">-- Select Received PO --</option>
                  {purchases
                    .filter(p => p.status === 'Received')
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.purchase_no} ({p.supplier_name}) - LKR {p.total.toLocaleString()}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right panel: list items to return */}
          <div className="md:col-span-2 space-y-4">
            {selectedReturnPoId ? (
              (() => {
                const selectedPo = purchases.find(p => p.id === selectedReturnPoId);
                if (!selectedPo) return null;

                const hasReturnItems = Object.keys(returnPoQuantities).some(prodId => (returnPoQuantities[prodId] || 0) > 0);

                const handleProcessReturn = () => {
                  const itemsToReturn = Object.keys(returnPoQuantities)
                    .map(prodId => ({
                      product_id: prodId,
                      quantity: returnPoQuantities[prodId] || 0
                    }))
                    .filter(item => item.quantity > 0);

                  if (itemsToReturn.length === 0) {
                    alert('Please specify at least one return item quantity greater than 0.');
                    return;
                  }

                  const confirmMsg = `Are you sure you want to return these parts to supplier "${selectedPo.supplier_name}"?\nThis will deduct stock levels and adjust the outstanding balance by LKR ${calculateReturnTotal().toLocaleString()}.`;
                  if (confirm(confirmMsg)) {
                    db.returnPurchase(selectedPo.id, itemsToReturn);
                    alert('Purchase return logged successfully!');
                    setSelectedReturnPoId('');
                    setReturnPoQuantities({});
                    refreshLists();
                  }
                };

                const calculateReturnTotal = () => {
                  let total = 0;
                  selectedPo.items.forEach(item => {
                    const retQty = returnPoQuantities[item.product_id] || 0;
                    total += retQty * item.cost_price;
                  });
                  return total;
                };

                return (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Return Parts for {selectedPo.purchase_no}</h4>
                        <p className="text-[11px] text-slate-500">Supplier: <span className="font-bold">{selectedPo.supplier_name}</span></p>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-500 text-[10px] uppercase font-bold">Total Original Invoice</div>
                        <div className="font-mono font-bold text-slate-900">LKR {selectedPo.total.toLocaleString()}</div>
                      </div>
                    </div>

                    <table className="min-w-full divide-y divide-slate-200 text-left">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Part Name</th>
                          <th className="px-4 py-3 text-right">Wholesale Cost</th>
                          <th className="px-4 py-3 text-center">Qty Purchased</th>
                          <th className="px-4 py-3 text-center w-28">Qty to Return</th>
                          <th className="px-4 py-3 text-right">Return Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {selectedPo.items.map(item => {
                          const currentReturnQty = returnPoQuantities[item.product_id] || 0;
                          return (
                            <tr key={item.product_id} className="hover:bg-slate-50/30">
                              <td className="px-4 py-3">
                                <div className="font-bold text-slate-950">{item.product_name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{item.product_code}</div>
                              </td>
                              <td className="px-4 py-3 text-right font-mono">LKR {item.cost_price.toLocaleString()}</td>
                              <td className="px-4 py-3 text-center font-mono">{item.quantity}</td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max={item.quantity}
                                  value={currentReturnQty || ''}
                                  onChange={(e) => {
                                    const val = Math.min(item.quantity, Math.max(0, parseInt(e.target.value) || 0));
                                    setReturnPoQuantities(prev => ({
                                      ...prev,
                                      [item.product_id]: val
                                    }));
                                  }}
                                  className="w-16 border border-slate-300 rounded p-1 text-center font-mono font-bold bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-red-600">
                                LKR {(currentReturnQty * item.cost_price).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="font-medium text-slate-600">
                        <span>Adjusted Return Refund Total:</span>
                        <span className="font-bold text-red-600 text-sm ml-2 font-mono">
                          LKR {calculateReturnTotal().toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={handleProcessReturn}
                        disabled={!hasReturnItems}
                        className={`px-5 py-2 rounded-lg font-bold text-xs shadow transition-colors flex items-center gap-1.5 cursor-pointer ${
                          hasReturnItems
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Process Purchase Return
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="bg-white p-12 border border-slate-200 border-dashed rounded-xl text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="w-8 h-8 text-slate-300" />
                <p className="font-medium">Please select a Received Purchase Order to process returned parts.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT SUPPLIER */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-bold text-slate-900 text-sm">
                {editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}
              </h4>
              <button onClick={() => setShowSupplierModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Distributor / Supplier Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Lanka Auto Distributors"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 0712345678"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. sales@distributor.com"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Outstanding Balance (LKR)</label>
                <input
                  type="number"
                  value={supBalance}
                  onChange={(e) => setSupBalance(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded p-1.5 font-mono"
                  disabled={!!editingSupplier} // Edit via purchase order/payment tool
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Office / Warehouse Address</label>
                <textarea
                  placeholder="Billing / Shipping warehouse address details..."
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 h-16"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors mt-2"
              >
                Save Supplier
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUPPLIER BALANCE PAYOUT SETTLEMENT */}
      {selectedPayingSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-bold text-slate-900 text-sm">Settle Supplier Balance Payout</h4>
              <button onClick={() => setSelectedPayingSupplier(null)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
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
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
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
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-bold text-slate-900 text-sm">Settle Purchase Order Payment</h4>
              <button onClick={() => setSelectedPayingPurchase(null)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
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
                  className="w-full border border-slate-300 rounded p-2 text-center font-mono text-sm font-bold bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                Record PO Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
