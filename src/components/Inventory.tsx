/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Category, Supplier } from '../types';
import { db } from '../utils/db';
import {
  Wrench,
  Search,
  PlusCircle,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  Edit2,
  Trash2,
  Save,
  Grid,
  ChevronDown,
  RefreshCw,
  TrendingUp,
  Download,
  Upload
} from 'lucide-react';

export function Inventory() {
  const [products, setProducts] = useState<Product[]>(() => db.getProducts());
  const [categories, setCategories] = useState<Category[]>(() => db.getCategories());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => db.getSuppliers());

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'Low Stock' | 'Out of Stock'>('All');

  // Active view: "items" | "categories" | "import-export"
  const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'import-export'>('items');

  // Add/Edit states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [itemCode, setItemCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [partName, setPartName] = useState('');
  const [category, setCategory] = useState('');
  const [compatibility, setCompatibility] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [minStockWarning, setMinStockWarning] = useState(5);
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');

  // Stock Adjustment States
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Category addition form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatDesc, setEditingCatDesc] = useState('');

  // Import/Export States
  const [pasteData, setPasteData] = useState('');
  const [importMessage, setImportMessage] = useState('');

  useEffect(() => {
    refreshLists();
  }, [showProductModal, activeTab, adjustingProduct]);

  const refreshLists = () => {
    setProducts(db.getProducts());
    setCategories(db.getCategories());
    setSuppliers(db.getSuppliers());
  };

  const resetForm = () => {
    setEditingProduct(null);
    setItemCode('');
    setBarcode('');
    setPartName('');
    setCategory(categories[0]?.name || 'Engine Parts');
    setCompatibility('');
    setPurchasePrice(0);
    setSellingPrice(0);
    setStockQuantity(0);
    setMinStockWarning(5);
    setSupplierId(suppliers[0]?.id || '');
    setNotes('');
  };

  const openAddModal = () => {
    resetForm();
    setShowProductModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setItemCode(p.item_code);
    setBarcode(p.barcode);
    setPartName(p.part_name);
    setCategory(p.category);
    setCompatibility(p.compatibility);
    setPurchasePrice(p.purchase_price);
    setSellingPrice(p.selling_price);
    setStockQuantity(p.stock_quantity);
    setMinStockWarning(p.min_stock_warning);
    setSupplierId(p.supplier_id);
    setNotes(p.notes || '');
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim() || !itemCode.trim() || !barcode.trim()) {
      alert('Code, Barcode, and Part Name are mandatory!');
      return;
    }

    const payload = {
      item_code: itemCode.trim().toUpperCase(),
      barcode: barcode.trim(),
      part_name: partName.trim(),
      category,
      compatibility: compatibility.trim() || 'General / Universal',
      purchase_price: Number(purchasePrice),
      selling_price: Number(sellingPrice),
      stock_quantity: Number(stockQuantity),
      min_stock_warning: Number(minStockWarning),
      supplier_id: supplierId,
      notes: notes.trim()
    };

    if (editingProduct) {
      db.updateProduct({ ...payload, id: editingProduct.id });
    } else {
      db.addProduct(payload);
    }

    setShowProductModal(false);
    resetForm();
    refreshLists();
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this spare part from the catalog?')) {
      db.deleteProduct(id);
      refreshLists();
    }
  };

  const handleAdjustStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    const currentQty = adjustingProduct.stock_quantity;
    const newQty = currentQty + adjustAmount;

    if (newQty < 0) {
      alert('Stock cannot be adjusted to less than 0.');
      return;
    }

    db.updateProduct({
      ...adjustingProduct,
      stock_quantity: newQty
    });

    setAdjustingProduct(null);
    setAdjustAmount(0);
    setAdjustReason('');
    refreshLists();
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    db.addCategory(newCatName.trim(), newCatDesc.trim());
    setNewCatName('');
    setNewCatDesc('');
    refreshLists();
    alert('Category created successfully!');
  };

  const handleEditCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCatName.trim()) return;

    db.updateCategory(editingCategory.id, editingCatName.trim(), editingCatDesc.trim());
    setEditingCategory(null);
    setEditingCatName('');
    setEditingCatDesc('');
    refreshLists();
    alert('Category updated successfully!');
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Are you sure you want to delete this category? Associated items will remain unaffected.')) {
      db.deleteCategory(id);
      refreshLists();
    }
  };

  // EXPORT TO CSV OR JSON
  const downloadJSONBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "wcs_spare_parts_inventory.json");
    dlAnchorElem.click();
  };

  const exportToCSV = () => {
    const headers = ['id', 'item_code', 'barcode', 'part_name', 'category', 'compatibility', 'purchase_price', 'selling_price', 'stock_quantity', 'min_stock_warning'];
    const csvRows = [headers.join(',')];
    
    products.forEach(p => {
      const row = [
        p.id,
        `"${p.item_code}"`,
        `"${p.barcode}"`,
        `"${p.part_name.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        `"${p.compatibility.replace(/"/g, '""')}"`,
        p.purchase_price,
        p.selling_price,
        p.stock_quantity,
        p.min_stock_warning
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join('\n'));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", csvContent);
    dlAnchorElem.setAttribute("download", "wcs_spare_parts_inventory.csv");
    dlAnchorElem.click();
  };

  // IMPORT FROM PASTED DATA
  const handleImportData = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(pasteData);
      if (!Array.isArray(parsed)) {
        setImportMessage('Error: Imported file must be a JSON array of products.');
        return;
      }

      // Merge items or replace
      const existing = db.getProducts();
      let addedCount = 0;
      let updatedCount = 0;

      parsed.forEach((imported: any) => {
        const item_code = imported.item_code || 'IMP-' + Math.random().toString(36).substring(2, 5).toUpperCase();
        const barcode = imported.barcode || Math.random().toString().substring(2, 12);
        const part_name = imported.part_name || 'Imported Spare Part';
        const cat = imported.category || 'Engine Parts';
        const comp = imported.compatibility || 'Universal';
        const pPrice = Number(imported.purchase_price) || 0;
        const sPrice = Number(imported.selling_price) || 0;
        const sQty = Number(imported.stock_quantity) || 0;
        const mWarn = Number(imported.min_stock_warning) || 5;
        const sup = imported.supplier_id || 'S1';

        const matchIdx = existing.findIndex(p => p.item_code === item_code || p.barcode === barcode);
        if (matchIdx >= 0) {
          existing[matchIdx] = {
            ...existing[matchIdx],
            part_name,
            category: cat,
            compatibility: comp,
            purchase_price: pPrice,
            selling_price: sPrice,
            stock_quantity: sQty,
            min_stock_warning: mWarn,
            supplier_id: sup
          };
          updatedCount++;
        } else {
          existing.push({
            id: 'PROD-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
            item_code,
            barcode,
            part_name,
            category: cat,
            compatibility: comp,
            purchase_price: pPrice,
            selling_price: sPrice,
            stock_quantity: sQty,
            min_stock_warning: mWarn,
            supplier_id: sup
          });
          addedCount++;
        }
      });

      db.saveProducts(existing);
      refreshLists();
      setPasteData('');
      setImportMessage(`Import Successful! Added ${addedCount} new parts, Updated ${updatedCount} existing parts.`);
    } catch (err: any) {
      setImportMessage('Invalid format. Please make sure to paste valid JSON array content. Error: ' + err.message);
    }
  };

  // Filters logic
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      p.compatibility.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    
    let matchesStock = true;
    if (stockFilter === 'Low Stock') {
      matchesStock = p.stock_quantity <= p.min_stock_warning && p.stock_quantity > 0;
    } else if (stockFilter === 'Out of Stock') {
      matchesStock = p.stock_quantity === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-7 h-7 text-blue-600" />
            Motor Spare-Parts Inventory
          </h2>
          <p className="text-sm text-slate-500">Track and adjust stock levels, compatibility specifications, and imports</p>
        </div>

        <div className="flex bg-slate-200 p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'items' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Spare Parts List
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Categories Setup
          </button>
          <button
            onClick={() => setActiveTab('import-export')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'import-export' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Excel/CSV Import
          </button>
        </div>
      </div>

      {activeTab === 'items' && (
        <div className="space-y-4">
          
          {/* Filtering Controls */}
          <div className="bg-white p-4 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            {/* Text Search */}
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search code, name, barcode, compatibility specification..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-slate-300 rounded-lg text-xs p-1.5 focus:outline-none"
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Stock Levels Filter */}
            <div className="md:col-span-2">
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="w-full border border-slate-300 rounded-lg text-xs p-1.5 focus:outline-none"
              >
                <option value="All">All Stock Levels</option>
                <option value="Low Stock">Low Stock Alert</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            {/* New Spare Part Trigger */}
            <div className="md:col-span-2">
              <button
                onClick={openAddModal}
                id="add-spare-part-btn"
                className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Add Part
              </button>
            </div>
          </div>

          {/* TABLE OF PRODUCTS */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Code / Barcode</th>
                    <th className="px-4 py-3">Spare Part Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Vehicle Compatibility</th>
                    <th className="px-4 py-3 text-right">Cost Price</th>
                    <th className="px-4 py-3 text-right">Sell Price</th>
                    <th className="px-4 py-3 text-center">Qty In Stock</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400 font-normal">
                        No spare parts found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => {
                      const isLow = p.stock_quantity <= p.min_stock_warning && p.stock_quantity > 0;
                      const isOut = p.stock_quantity === 0;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 font-mono">{p.item_code}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{p.barcode}</div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs truncate" title={p.part_name}>
                            {p.part_name}
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px]">
                              {p.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate text-slate-500" title={p.compatibility}>
                            {p.compatibility}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-600">
                            {p.purchase_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-blue-700">
                            {p.selling_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              <span
                                className={`font-mono font-extrabold text-sm px-2 py-0.5 rounded-md ${
                                  isOut
                                    ? 'bg-red-100 text-red-700'
                                    : isLow
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-emerald-50 text-emerald-800'
                                }`}
                              >
                                {p.stock_quantity}
                              </span>
                              {(isLow || isOut) && (
                                <span className="text-[9px] text-amber-600 font-bold uppercase tracking-tight flex items-center gap-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  {isOut ? 'Reorder!' : 'Low Warning!'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => setAdjustingProduct(p)}
                              title="Manual Stock Adjustment"
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[10px] transition-colors"
                            >
                              Adj. Stock
                            </button>
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1 text-slate-500 hover:text-blue-600 inline-block"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1 text-slate-500 hover:text-red-600 inline-block"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left panel: Create or Edit category form */}
          {editingCategory ? (
            <div className="bg-white p-5 border border-slate-200 rounded-xl h-fit space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1">
                <Grid className="w-4 h-4 text-blue-600" />
                Rename / Edit Category
              </h3>
              <form onSubmit={handleEditCategorySubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Category Name *</label>
                  <input
                    type="text"
                    value={editingCatName}
                    onChange={(e) => setEditingCatName(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Description</label>
                  <textarea
                    value={editingCatDesc}
                    onChange={(e) => setEditingCatDesc(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 h-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setEditingCatName('');
                      setEditingCatDesc('');
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white p-5 border border-slate-200 rounded-xl h-fit space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1">
                <Grid className="w-4 h-4 text-slate-600" />
                Create Category
              </h3>
              <form onSubmit={handleAddCategorySubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Category Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Engine Belts"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Description</label>
                  <textarea
                    placeholder="Details about spare parts in this category..."
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 h-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                >
                  Create Category
                </button>
              </form>
            </div>
          )}

          {/* Right panel: categories listings */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Category Name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {categories.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-950">{c.name}</td>
                    <td className="px-4 py-3 text-slate-500">{c.description || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          onClick={() => {
                            setEditingCategory(c);
                            setEditingCatName(c.name);
                            setEditingCatDesc(c.description || '');
                          }}
                          className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
                        >
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
      )}

      {activeTab === 'import-export' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* EXPORT PANEL */}
            <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Download className="w-5 h-5 text-blue-600" />
                Export Spare-Parts Catalog
              </h3>
              <p className="text-xs text-slate-500">
                Download your current motor spare parts inventory data immediately in Excel-friendly format (CSV) or JSON.
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={exportToCSV}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export as Excel (CSV)
                </button>
                <button
                  onClick={downloadJSONBackup}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Export as JSON
                </button>
              </div>
            </div>

            {/* IMPORT PANEL */}
            <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Upload className="w-5 h-5 text-blue-600" />
                Import Spare Parts (JSON)
              </h3>
              <p className="text-xs text-slate-500">
                Paste JSON array of spare-parts data. New items will be added, matching codes will be automatically updated.
              </p>

              <form onSubmit={handleImportData} className="space-y-3">
                <textarea
                  placeholder='Paste JSON array format, e.g. [{"item_code": "PART-01", "barcode": "12345", "part_name": "Spark Plug", "selling_price": 500, "stock_quantity": 50}]'
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 h-24 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                
                {importMessage && (
                  <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-800 rounded text-xs font-medium">
                    {importMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors"
                >
                  Upload & Import Data
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD/EDIT SPARE PART */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden my-8">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-bold text-slate-900 text-sm">
                {editingProduct ? 'Edit Motor Spare Part' : 'Add New Motor Spare Part'}
              </h4>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Item/Part Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. BRK-PAD-TOY"
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 uppercase font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Barcode *</label>
                  <input
                    type="text"
                    placeholder="e.g. 5011234567"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Part Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Toyota Genuine Front Brake Pad Set"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Supplier Distributor</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Vehicle/Make/Model Compatibility</label>
                <input
                  type="text"
                  placeholder="e.g. Toyota Corolla Axio NKE165, Fielder (2012-2018)"
                  value={compatibility}
                  onChange={(e) => setCompatibility(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Cost Price</label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-1.5 text-right font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Sell Price</label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-1.5 text-right font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Stock Level</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-1.5 text-center font-mono"
                    disabled={!!editingProduct} // Require using "Adjust Stock" tool for existing products
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Min Warning</label>
                  <input
                    type="number"
                    value={minStockWarning}
                    onChange={(e) => setMinStockWarning(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-1.5 text-center font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Internal Notes</label>
                <textarea
                  placeholder="Additional storage bin location, shelf details, cross references..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 h-16"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors mt-2"
              >
                Save Spare Part
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STOCK ADJUSTMENT TOOL */}
      {adjustingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-bold text-slate-900 text-sm">Stock Level Adjustment</h4>
              <button onClick={() => setAdjustingProduct(null)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>
            
            <form onSubmit={handleAdjustStockSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <div className="font-bold text-slate-900 text-sm">{adjustingProduct.part_name}</div>
                <div className="text-slate-500 font-mono mt-0.5">{adjustingProduct.item_code}</div>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
                <span>Current Stock:</span>
                <span className="font-extrabold text-sm text-slate-900">{adjustingProduct.stock_quantity} units</span>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Adjustment Amount (+ or -) *</label>
                <input
                  type="number"
                  placeholder="e.g. 10 or -5"
                  value={adjustAmount || ''}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded p-1.5 font-mono text-center text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Reason for stock level change *</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Audit, Damaged stock write-off, Found item"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors"
              >
                Apply Adjustment
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
