/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Product, Customer, Sale, SaleItem, User, ShopSettings } from '../types';
import { db } from '../utils/db';
import {
  Search,
  ScanBarcode,
  ShoppingCart,
  UserPlus,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  FileText,
  RefreshCw,
  Printer,
  ChevronRight,
  PackageCheck
} from 'lucide-react';

interface POSBillingProps {
  currentUser: User;
  settings: ShopSettings;
}

export function POSBilling({ currentUser, settings }: POSBillingProps) {
  // DB States
  const [products, setProducts] = useState<Product[]>(() => db.getProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => db.getCustomers());
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart/Billing States
  const [cart, setCart] = useState<Omit<SaleItem, 'id'>[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('CUST-WALK');
  const [generalDiscount, setGeneralDiscount] = useState<number>(0); // fixed amount
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Credit'>('Cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  
  // Active Invoice Checkout State
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Fast Customer Creation State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustLimit, setNewCustLimit] = useState(100000);

  // Sales Return State
  const [isReturnMode, setIsReturnMode] = useState(false);
  const [returnInvoiceNo, setReturnInvoiceNo] = useState('');
  const [invoiceToReturn, setInvoiceToReturn] = useState<Sale | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<{ [productId: string]: number }>({});
  const [returnSuccessMessage, setReturnSuccessMessage] = useState('');

  // Barcode input focus trigger
  const barcodeFocusRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Keep local lists updated when DB operations happen
    setProducts(db.getProducts());
    setCustomers(db.getCustomers());
  }, [showReceiptModal, isReturnMode]);

  // Categories list
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // Search filter
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      p.compatibility.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle Barcode Scanner Simulation
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    const matchedProduct = products.find(p => p.barcode === barcodeInput.trim() || p.item_code === barcodeInput.trim());
    if (matchedProduct) {
      addToCart(matchedProduct);
      setBarcodeInput('');
    } else {
      alert(`No product found with Barcode/Code: "${barcodeInput}"`);
    }
  };

  const scanDemoBarcode = (barcode: string) => {
    setBarcodeInput(barcode);
    const matchedProduct = products.find(p => p.barcode === barcode);
    if (matchedProduct) {
      addToCart(matchedProduct);
      setBarcodeInput('');
    }
  };

  // Add item to billing basket
  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      alert(`Warning: "${product.part_name}" is out of stock!`);
      return;
    }

    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock_quantity) {
        alert(`Cannot add more. Only ${product.stock_quantity} units available in stock.`);
        return;
      }
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.part_name,
        product_code: product.item_code,
        quantity: 1,
        unit_price: product.selling_price,
        discount: 0,
        total: product.selling_price
      }]);
    }
  };

  const updateCartQty = (productId: string, qty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (qty > product.stock_quantity) {
      alert(`Only ${product.stock_quantity} units available in stock.`);
      return;
    }

    setCart(cart.map(item =>
      item.product_id === productId
        ? { ...item, quantity: qty, total: qty * item.unit_price * (1 - item.discount / 100) }
        : item
    ));
  };

  const updateCartItemDiscount = (productId: string, discPercent: number) => {
    setCart(cart.map(item =>
      item.product_id === productId
        ? {
            ...item,
            discount: discPercent,
            total: item.quantity * item.unit_price * (1 - discPercent / 100)
          }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const taxAmount = (subtotal - generalDiscount) * (settings.tax_rate / 100);
  const grandTotal = Math.max(0, subtotal - generalDiscount + taxAmount);
  const changeGiven = paymentMethod === 'Cash' && cashReceived ? Math.max(0, Number(cashReceived) - grandTotal) : 0;

  // Checkout process
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    if (paymentMethod === 'Cash') {
      const recAmt = Number(cashReceived);
      if (isNaN(recAmt) || recAmt < grandTotal) {
        alert('Insufficient cash received amount.');
        return;
      }
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    if (paymentMethod === 'Credit') {
      if (selectedCustomerId === 'CUST-WALK') {
        alert('Credit sales require a registered customer.');
        return;
      }
      if (customer && (customer.current_credit + grandTotal > customer.credit_limit)) {
        alert(`Credit limit exceeded! Limit: LKR ${customer.credit_limit}. Current: LKR ${customer.current_credit}. Purchase requires LKR ${grandTotal}.`);
        return;
      }
    }

    // Save Sale to local database
    const saleItems: SaleItem[] = cart.map(item => ({
      ...item,
      id: Math.random().toString(36).substring(2, 9).toUpperCase()
    }));

    const newSale = db.addSale({
      customer_id: selectedCustomerId,
      customer_name: customer?.name || 'Walk-In Customer',
      cashier_id: currentUser.id,
      cashier_name: currentUser.name,
      subtotal,
      discount: generalDiscount,
      total: grandTotal,
      payment_method: paymentMethod,
      cash_received: paymentMethod === 'Cash' ? Number(cashReceived) : 0,
      change_given: paymentMethod === 'Cash' ? changeGiven : 0,
      status: 'Completed',
      type: 'Sale',
      items: saleItems
    });

    setCompletedSale(newSale);
    setShowReceiptModal(true);

    // Clear cart
    setCart([]);
    setGeneralDiscount(0);
    setCashReceived('');
    setPaymentMethod('Cash');
    setSelectedCustomerId('CUST-WALK');
  };

  // Fast-Add customer submit
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCust = db.addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim() || '-',
      address: newCustAddress.trim() || '-',
      credit_limit: newCustLimit
    });

    setCustomers(db.getCustomers());
    setSelectedCustomerId(newCust.id);
    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
  };

  // Sales Return Methods
  const handleSearchInvoiceForReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const sales = db.getSales();
    const found = sales.find(s => s.invoice_number === returnInvoiceNo.trim() && s.type === 'Sale' && s.status !== 'Returned');
    
    if (found) {
      setInvoiceToReturn(found);
      const initialReturns: { [productId: string]: number } = {};
      found.items.forEach(item => {
        initialReturns[item.product_id] = 0;
      });
      setReturnQuantities(initialReturns);
      setReturnSuccessMessage('');
    } else {
      alert(`No valid sale invoice found with number: ${returnInvoiceNo}`);
      setInvoiceToReturn(null);
    }
  };

  const handleReturnItemQtyChange = (productId: string, maxQty: number, val: number) => {
    const qty = Math.min(maxQty, Math.max(0, val));
    setReturnQuantities({
      ...returnQuantities,
      [productId]: qty
    });
  };

  const processSalesReturn = () => {
    if (!invoiceToReturn) return;

    const itemsToReturn = Object.keys(returnQuantities)
      .map(pId => ({
        product_id: pId,
        quantity: returnQuantities[pId]
      }))
      .filter(item => item.quantity > 0);

    if (itemsToReturn.length === 0) {
      alert('Please select at least 1 item with quantity > 0 to return.');
      return;
    }

    const retSale = db.returnSale(invoiceToReturn.id, itemsToReturn);
    if (retSale) {
      setReturnSuccessMessage(`Successfully processed Sales Return! Issued credit voucher/refund: LKR ${retSale.total}. Return ID: ${retSale.invoice_number}`);
      setInvoiceToReturn(null);
      setReturnInvoiceNo('');
      setReturnQuantities({});
      setProducts(db.getProducts());
    } else {
      alert('Failed to process return.');
    }
  };

  // Print simulator
  const triggerPrintReceipt = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      {/* Tab Switcher for POS vs Return */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            POS Terminal & Billing
          </h2>
          <p className="text-sm text-slate-500">Run quick checkouts, manage customer carts, or process returns</p>
        </div>

        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button
            onClick={() => setIsReturnMode(false)}
            id="pos-billing-tab"
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              !isReturnMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Billing Checkout
          </button>
          <button
            onClick={() => setIsReturnMode(true)}
            id="sales-return-tab"
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              isReturnMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Sales Return
          </button>
        </div>
      </div>

      {!isReturnMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: PRODUCT FINDER & QUICK GRIDS */}
          <div className="lg:col-span-7 bg-white p-5 border border-slate-200 rounded-xl space-y-4">
            
            {/* Barcode Simulator input */}
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <ScanBarcode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 animate-pulse" />
                <input
                  ref={barcodeFocusRef}
                  type="text"
                  placeholder="Scan barcode or enter code..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="barcode-scanner-input"
                />
              </div>
              <button
                type="submit"
                id="barcode-simulate-btn"
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-950 transition-colors flex items-center gap-1.5"
              >
                Scan Enter
              </button>
            </form>

            {/* Quick barcode simulation buttons */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 border-b border-slate-100 pb-3">
              <span className="font-semibold">Quick Scan Demo:</span>
              {products.slice(0, 3).map(p => (
                <button
                  key={p.id}
                  onClick={() => scanDemoBarcode(p.barcode)}
                  className="px-2 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 rounded border border-slate-200 transition-colors font-mono"
                >
                  {p.item_code}
                </button>
              ))}
            </div>

            {/* Text Search & Category Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search spare parts name/model/compatibility..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-slate-300 rounded-lg text-xs p-1.5"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Product Cards List */}
            <div className="max-h-[460px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
              {filteredProducts.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-400 text-sm">
                  No spare parts match your filters.
                </div>
              ) : (
                filteredProducts.map(p => {
                  const isLow = p.stock_quantity <= p.min_stock_warning;
                  const isOut = p.stock_quantity === 0;

                  return (
                    <div
                      key={p.id}
                      onClick={() => !isOut && addToCart(p)}
                      className={`p-3.5 border rounded-lg transition-all cursor-pointer flex flex-col justify-between ${
                        isOut
                          ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                          : 'bg-white hover:border-blue-400 hover:shadow-sm border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                            {p.item_code}
                          </span>
                          {isOut ? (
                            <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded uppercase">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded uppercase">
                              Low {p.stock_quantity}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">
                              Stock: {p.stock_quantity}
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-slate-800 text-sm mt-1.5 line-clamp-2">{p.part_name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Compatible: {p.compatibility}</p>
                      </div>

                      <div className="mt-3 flex justify-between items-center pt-2 border-t border-slate-50">
                        <span className="font-extrabold text-blue-700 text-sm">LKR {p.selling_price.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400">Barcode: {p.barcode}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: ACTIVE CART / checkout */}
          <div className="lg:col-span-5 bg-white p-5 border border-slate-200 rounded-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-base">
                <ShoppingCart className="w-5 h-5 text-slate-700" />
                Active Bill Cart ({cart.length})
              </h3>
              <button
                onClick={() => setCart([])}
                className="text-xs font-semibold text-red-500 hover:text-red-700"
              >
                Clear Cart
              </button>
            </div>

            {/* Customer select and fast add */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Customer Selection</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    if (e.target.value === 'CUST-WALK' && paymentMethod === 'Credit') {
                      setPaymentMethod('Cash');
                    }
                  }}
                  className="w-full border border-slate-300 rounded-lg text-xs p-1.5 bg-slate-50 focus:bg-white"
                  id="cart-customer-select"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone !== '-' ? `(${c.phone})` : ''} {c.current_credit > 0 ? `[Bal: ${c.current_credit}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowAddCustomerModal(true)}
                title="Add New Customer"
                className="p-1.5 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg mt-5 text-blue-600 transition-colors"
                id="fast-add-customer-btn"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>

            {/* Cart list items */}
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <PackageCheck className="w-8 h-8 text-slate-300" />
                  Cart is empty. Select products from the left to add items.
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product_id} className="p-2 border border-slate-100 hover:border-slate-200 rounded-lg flex flex-col gap-1 text-xs">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span className="truncate pr-2">{item.product_name}</span>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      {/* Quantity adjustment */}
                      <div className="flex items-center gap-1 border border-slate-200 rounded-md bg-slate-50 px-1 py-0.5">
                        <button
                          onClick={() => updateCartQty(item.product_id, item.quantity - 1)}
                          className="p-0.5 hover:bg-slate-200 text-slate-600 rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.product_id, item.quantity + 1)}
                          className="p-0.5 hover:bg-slate-200 text-slate-600 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Disc Inline input */}
                      <div className="flex items-center gap-1 text-slate-500">
                        <span>Disc%:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => updateCartItemDiscount(item.product_id, Number(e.target.value))}
                          className="w-10 border border-slate-300 rounded p-0.5 text-center text-[10px]"
                        />
                      </div>

                      {/* Total cost of item */}
                      <span className="font-extrabold text-slate-800">LKR {item.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* billing financial summaries */}
            <div className="bg-slate-50 p-3 rounded-lg space-y-2 border border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>LKR {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 gap-2">
                <span>Cart Discount (LKR)</span>
                <input
                  type="number"
                  min="0"
                  value={generalDiscount}
                  onChange={(e) => setGeneralDiscount(Number(e.target.value))}
                  placeholder="LKR Discount"
                  className="w-24 border border-slate-300 rounded p-1 text-right text-xs"
                />
              </div>
              {settings.tax_rate > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({settings.tax_rate}%)</span>
                  <span>LKR {taxAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Bill</span>
                <span>LKR {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* payment panel */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'Card', 'Credit'].map(method => {
                    const isDisabled = method === 'Credit' && selectedCustomerId === 'CUST-WALK';
                    return (
                      <button
                        key={method}
                        disabled={isDisabled}
                        onClick={() => setPaymentMethod(method as 'Cash' | 'Card' | 'Credit')}
                        className={`py-1.5 text-xs font-bold border rounded-lg transition-all ${
                          paymentMethod === method
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : isDisabled
                            ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {method}
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentMethod === 'Cash' && (
                <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                  <div>
                    <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Cash Received</label>
                    <input
                      type="number"
                      placeholder="LKR"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="w-full border border-slate-300 rounded p-1 text-sm text-right font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Change Due</label>
                    <div className="p-1 text-sm font-mono font-extrabold text-right text-blue-900 bg-white rounded border border-blue-200">
                      LKR {changeGiven.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              id="checkout-trigger-btn"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-lg transition-colors shadow-md flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              Complete & Print Receipt
            </button>
          </div>
        </div>
      ) : (
        // SALES RETURN PAGE
        <div className="bg-white p-6 border border-slate-200 rounded-xl space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-1.5">
              <RefreshCw className="w-5 h-5 text-amber-500" />
              Sales Return & Credit Management
            </h3>
            <p className="text-xs text-slate-500 mt-1">Accept customers returns, adjust spare part stock automatically, and credit accounts.</p>
          </div>

          <form onSubmit={handleSearchInvoiceForReturn} className="flex gap-2 max-w-md">
            <input
              type="text"
              placeholder="Enter invoice number (e.g. INV-10001)..."
              value={returnInvoiceNo}
              onChange={(e) => setReturnInvoiceNo(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-colors"
            >
              Fetch Invoice
            </button>
          </form>

          {returnSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg font-medium">
              {returnSuccessMessage}
            </div>
          )}

          {invoiceToReturn && (
            <div className="border border-slate-200 rounded-xl overflow-hidden space-y-4 p-4 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row justify-between border-b border-slate-200 pb-3 text-xs gap-2">
                <div>
                  <div className="font-bold text-slate-800">Invoice: {invoiceToReturn.invoice_number}</div>
                  <div className="text-slate-500">Date: {new Date(invoiceToReturn.date).toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-800">Customer: {invoiceToReturn.customer_name}</div>
                  <div className="text-slate-500">Payment: {invoiceToReturn.payment_method} | Total: LKR {invoiceToReturn.total.toLocaleString()}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">Select Items and Return Quantities</h4>
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white">
                  {invoiceToReturn.items.map(item => (
                    <div key={item.product_id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50">
                      <div>
                        <div className="font-bold text-slate-800">{item.product_name}</div>
                        <div className="text-slate-500">{item.product_code} • LKR {item.unit_price} each</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">Bought: <strong className="text-slate-700">{item.quantity}</strong></span>
                        <div className="flex items-center gap-1">
                          <span>Return Qty:</span>
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={returnQuantities[item.product_id] || 0}
                            onChange={(e) => handleReturnItemQtyChange(item.product_id, item.quantity, Number(e.target.value))}
                            className="w-12 border border-slate-300 rounded text-center p-1 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={processSalesReturn}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Process Return & Stock Adjustment
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD FAST CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-bold text-slate-900 text-sm">Add Registered Customer</h4>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Customer Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ruwan Perera"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 0771234567"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Credit Limit (LKR)</label>
                  <input
                    type="number"
                    value={newCustLimit}
                    onChange={(e) => setNewCustLimit(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-1.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Address</label>
                <textarea
                  placeholder="Residential or business address..."
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 h-16"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                Save Customer & Select
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: 80MM THERMAL RECEIPT POPUP */}
      {showReceiptModal && completedSale && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden flex flex-col my-8">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center print:hidden">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1">
                <FileText className="w-4 h-4 text-blue-600" />
                Checkout Invoice Generated
              </h4>
              <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>

            {/* Receipt Frame - designed to represent 80mm roll format */}
            <div className="p-4 overflow-y-auto max-h-[500px]" id="printable-receipt-area">
              <div className="mx-auto w-[280px] bg-white text-slate-950 font-mono text-[11px] leading-relaxed select-text select-all">
                {/* Header Info */}
                <div className="text-center space-y-1 mb-4 border-b border-dashed border-slate-400 pb-3">
                  <h5 className="font-black text-xs uppercase leading-tight tracking-wide">{settings.shop_name}</h5>
                  <p className="text-[10px] text-slate-600">{settings.shop_address}</p>
                  <p className="text-[10px] text-slate-600">Tel: {settings.shop_phone}</p>
                  {settings.shop_email && <p className="text-[10px] text-slate-600 font-sans">{settings.shop_email}</p>}
                  <p className="text-[10px] mt-1 italic">"{settings.shop_header}"</p>
                </div>

                {/* Meta details */}
                <div className="space-y-1 mb-3 text-[10px] border-b border-dashed border-slate-400 pb-2">
                  <div><strong>INVOICE:</strong> {completedSale.invoice_number}</div>
                  <div><strong>DATE:</strong> {new Date(completedSale.date).toLocaleString()}</div>
                  <div><strong>CUSTOMER:</strong> {completedSale.customer_name}</div>
                  <div><strong>CASHIER:</strong> {completedSale.cashier_name}</div>
                  <div><strong>METHOD:</strong> {completedSale.payment_method}</div>
                </div>

                {/* Sales Items list */}
                <div className="border-b border-dashed border-slate-400 pb-2 mb-3">
                  <div className="flex justify-between font-bold text-slate-900 mb-1">
                    <span>ITEM</span>
                    <span>TOTAL</span>
                  </div>
                  <div className="space-y-2">
                    {completedSale.items.map(item => (
                      <div key={item.id} className="space-y-0.5">
                        <div className="flex justify-between">
                          <span className="truncate pr-1 max-w-[190px]">{item.product_name}</span>
                          <span className="font-bold">LKR {item.total.toLocaleString()}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 pl-2">
                          {item.quantity} x LKR {item.unit_price} {item.discount > 0 ? `(-${item.discount}%)` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotal, tax, net total */}
                <div className="space-y-1 text-right mb-3 border-b border-dashed border-slate-400 pb-2">
                  <div className="flex justify-between">
                    <span>SUBTOTAL:</span>
                    <span>LKR {completedSale.subtotal.toLocaleString()}</span>
                  </div>
                  {completedSale.discount > 0 && (
                    <div className="flex justify-between text-red-700">
                      <span>DISCOUNT:</span>
                      <span>- LKR {completedSale.discount.toLocaleString()}</span>
                    </div>
                  )}
                  {settings.tax_rate > 0 && (
                    <div className="flex justify-between">
                      <span>TAX ({settings.tax_rate}%):</span>
                      <span>LKR {((completedSale.subtotal - completedSale.discount) * (settings.tax_rate / 100)).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-black pt-1">
                    <span>NET TOTAL:</span>
                    <span>LKR {completedSale.total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment values */}
                <div className="space-y-1 text-right text-[10px] mb-4">
                  {completedSale.payment_method === 'Cash' ? (
                    <>
                      <div className="flex justify-between">
                        <span>CASH RECEIVED:</span>
                        <span>LKR {completedSale.cash_received.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>CHANGE DUE:</span>
                        <span>LKR {completedSale.change_given.toLocaleString()}</span>
                      </div>
                    </>
                  ) : completedSale.payment_method === 'Credit' ? (
                    <div className="text-center p-1 bg-slate-100 text-[9px] font-bold">
                      TRANSFERRED TO OUTSTANDING CUSTOMER CREDIT
                    </div>
                  ) : (
                    <div className="text-right">PAID WITH CREDIT/DEBIT CARD</div>
                  )}
                </div>

                {/* Footer and barcode */}
                <div className="text-center space-y-1 pt-2 border-t border-dashed border-slate-400">
                  <p className="font-bold uppercase tracking-wider text-[9px]">Thank You for Your Business!</p>
                  <p className="text-[9px] text-slate-500">Returns accepted within 14 days with original receipt.</p>
                  <p className="font-mono text-[9px] text-slate-400 pt-2">{completedSale.invoice_number}</p>
                </div>
              </div>
            </div>

            {/* Receipt Modal Footer Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2 print:hidden">
              <button
                onClick={triggerPrintReceipt}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print (80mm)
              </button>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setCompletedSale(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
