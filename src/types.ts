/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'Admin' | 'Owner' | 'User/Cashier';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  password?: string; // Hidden in displays
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  balance: number; // outstanding balance
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  credit_limit: number;
  current_credit: number;
}

export interface Product {
  id: string;
  item_code: string;
  barcode: string;
  part_name: string;
  category: string; // Category Name or ID
  compatibility: string; // e.g. "Toyota Corolla 2015-2019, Honda Civic"
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_warning: number;
  supplier_id: string; // Linked supplier
  image_url?: string;
  notes?: string;
}

export interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  discount: number; // percentage or fixed discount on this item
  total: number;
}

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id: string; // "Walk-In" or Customer ID
  customer_name: string;
  cashier_id: string;
  cashier_name: string;
  date: string; // ISO string
  subtotal: number;
  discount: number; // general discount
  total: number;
  payment_method: 'Cash' | 'Card' | 'Credit';
  cash_received: number;
  change_given: number;
  status: 'Completed' | 'Returned';
  type: 'Sale' | 'Return';
  returned_invoice_id?: string;
  items: SaleItem[];
}

export interface PurchaseItem {
  id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  quantity: number;
  cost_price: number;
  total: number;
}

export interface Purchase {
  id: string;
  purchase_no: string;
  supplier_id: string;
  supplier_name: string;
  date: string;
  status: 'Ordered' | 'Received' | 'Returned';
  total: number;
  paid_amount: number;
  balance: number;
  items: PurchaseItem[];
}

export interface Expense {
  id: string;
  date: string;
  category: string; // "Rent", "Utility", "Salary", "Other"
  amount: number;
  description: string;
  reference_no: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  type: 'In' | 'Out' | 'Adjustment' | 'Return';
  quantity: number;
  date: string;
  reason: string;
}

export interface ShopSettings {
  shop_name: string;
  shop_phone: string;
  shop_email: string;
  shop_address: string;
  shop_header: string;
  shop_logo: string; // base64 or URL
  tax_rate: number;
  thermal_printer_width: string; // e.g. "80mm"
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  product_ids: string[];
  discount_percent: number;
  created_at: string;
}
