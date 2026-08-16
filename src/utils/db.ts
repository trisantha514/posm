/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  Category,
  Supplier,
  Customer,
  Product,
  Sale,
  Purchase,
  Expense,
  StockMovement,
  ShopSettings,
  Promotion
} from '../types';

// Helper to generate unique IDs
export const generateId = () => Math.random().toString(36).substring(2, 11).toUpperCase();

// Seed initial users
const INITIAL_USERS: User[] = [
  { id: 'U1', username: 'admin', name: 'Admin Administrator', role: 'Admin', password: '123' },
  { id: 'U2', username: 'owner', name: 'WCS Shop Owner', role: 'Owner', password: '123' },
  { id: 'U3', username: 'cashier', name: 'Saman Kumara', role: 'User/Cashier', password: '123' }
];

// Seed initial categories
const INITIAL_CATEGORIES: Category[] = [
  { id: 'C1', name: 'Engine Parts', description: 'Pistons, spark plugs, valves, gaskets, and filters' },
  { id: 'C2', name: 'Brake System', description: 'Brake pads, rotors, drums, calipers, and fluids' },
  { id: 'C3', name: 'Suspension & Steering', description: 'Shock absorbers, ball joints, struts, and steering racks' },
  { id: 'C4', name: 'Electrical & Ignition', description: 'Batteries, alternators, starters, bulbs, and ignition coils' },
  { id: 'C5', name: 'Transmission & Clutch', description: 'Clutch plates, gearboxes, CV joints, and transmission fluid' },
  { id: 'C6', name: 'Body & Accessories', description: 'Mirrors, wiper blades, lights, and floor mats' }
];

// Seed initial suppliers
const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'S1', name: 'Auto Lanka Distributors', phone: '0712345678', email: 'info@autolanka.lk', address: '123 Panchikawatta Rd, Colombo 10', balance: 45000 },
  { id: 'S2', name: 'United Motors Spares', phone: '0777654321', email: 'sales@unitedmotors.lk', address: '45 Hyde Park Corner, Colombo 02', balance: 120000 },
  { id: 'S3', name: 'Sagar Suzuki Importers', phone: '0112345999', email: 'contact@sagarsuzuki.com', address: '88 Armour Street, Colombo 12', balance: 0 }
];

// Seed initial customers
const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'CUST-WALK', name: 'Walk-In Customer', phone: '-', address: '-', credit_limit: 0, current_credit: 0 },
  { id: 'CUST1', name: 'Nihal Perera (Service Station)', phone: '0722334455', address: 'No 40, Kandy Rd, Kiribathgoda', credit_limit: 100000, current_credit: 24500 },
  { id: 'CUST2', name: 'Prasad Automotive Clinic', phone: '0755667788', address: 'No 15, Galle Rd, Moratuwa', credit_limit: 250000, current_credit: 89000 },
  { id: 'CUST3', name: 'Anura Motor Engineers', phone: '0711223344', address: 'No 204, Negombo Rd, Wattala', credit_limit: 150000, current_credit: 0 }
];

// Seed initial products (Motor Spare Parts with realistic compatible vehicles, codes, prices, and barcodes)
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'P1',
    item_code: 'ENG-SPK-NGK',
    barcode: '4964336012345',
    part_name: 'NGK Laser Iridium Spark Plug (Set of 4)',
    category: 'Engine Parts',
    compatibility: 'Toyota Corolla 2010-2020 (1NZ-FE), Prius (2ZR-FXE)',
    purchase_price: 6500,
    selling_price: 8900,
    stock_quantity: 42,
    min_stock_warning: 10,
    supplier_id: 'S1',
    notes: 'Premium iridium long-life spark plugs. Gap preset.'
  },
  {
    id: 'P2',
    item_code: 'BRK-PAD-MINT',
    barcode: '5011234567890',
    part_name: 'Minter Heavy Duty Front Brake Pads',
    category: 'Brake System',
    compatibility: 'Suzuki WagonR MH34S/MH44S, Spacia, Alto (Japan)',
    purchase_price: 3200,
    selling_price: 4800,
    stock_quantity: 5,
    min_stock_warning: 8,
    supplier_id: 'S3',
    notes: 'Low dust, high braking friction pad set.'
  },
  {
    id: 'P3',
    item_code: 'ENG-FIL-TOY',
    barcode: '9091510001002',
    part_name: 'Toyota Genuine Oil Filter (90915-YZZE1)',
    category: 'Engine Parts',
    compatibility: 'Toyota Corolla, Yaris, Vitz, Allion, Premio',
    purchase_price: 1100,
    selling_price: 1850,
    stock_quantity: 120,
    min_stock_warning: 25,
    supplier_id: 'S2',
    notes: 'Original replacement oil filter, anti-drainback valve included.'
  },
  {
    id: 'P4',
    item_code: 'SUS-SHK-KYB',
    barcode: '4909500600123',
    part_name: 'KYB Excel-G Rear Shock Absorber (Pair)',
    category: 'Suspension & Steering',
    compatibility: 'Honda Civic FD1/FD2 (2006-2011)',
    purchase_price: 18500,
    selling_price: 24500,
    stock_quantity: 12,
    min_stock_warning: 4,
    supplier_id: 'S2',
    notes: 'Gas-charged shock absorber for improved ride control.'
  },
  {
    id: 'P5',
    item_code: 'ELC-BAT-AMR',
    barcode: '8901234560011',
    part_name: 'Amaron Go NS40ZL Maintenance Free Battery',
    category: 'Electrical & Ignition',
    compatibility: 'Suzuki WagonR, Alto, Vitz, Honda Fit, Micro Panda',
    purchase_price: 19500,
    selling_price: 24000,
    stock_quantity: 8,
    min_stock_warning: 3,
    supplier_id: 'S1',
    notes: '35Ah battery, 18 months local warranty.'
  },
  {
    id: 'P6',
    item_code: 'TRN-CLT-VAL',
    barcode: '3272490012345',
    part_name: 'Valeo Clutch Plate & Cover Kit',
    category: 'Transmission & Clutch',
    compatibility: 'Maruti Suzuki Alto 800 / Omni',
    purchase_price: 7800,
    selling_price: 10500,
    stock_quantity: 15,
    min_stock_warning: 5,
    supplier_id: 'S3',
    notes: 'Smooth gear shift engagement, high heat resistance.'
  }
];

// Seed initial sales
const INITIAL_SALES: Sale[] = [
  {
    id: 'SALE-1001',
    invoice_number: 'INV-10001',
    customer_id: 'CUST1',
    customer_name: 'Nihal Perera (Service Station)',
    cashier_id: 'U3',
    cashier_name: 'Saman Kumara',
    date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), // 2 days ago
    subtotal: 10750,
    discount: 500,
    total: 10250,
    payment_method: 'Credit',
    cash_received: 0,
    change_given: 0,
    status: 'Completed',
    type: 'Sale',
    items: [
      {
        id: 'SI1',
        product_id: 'P3',
        product_name: 'Toyota Genuine Oil Filter (90915-YZZE1)',
        product_code: 'ENG-FIL-TOY',
        quantity: 5,
        unit_price: 1850,
        discount: 0,
        total: 9250
      },
      {
        id: 'SI2',
        product_id: 'P2',
        product_name: 'Minter Heavy Duty Front Brake Pads',
        product_code: 'BRK-PAD-MINT',
        quantity: 1,
        unit_price: 4800,
        discount: 300,
        total: 1500
      }
    ]
  },
  {
    id: 'SALE-1002',
    invoice_number: 'INV-10002',
    customer_id: 'CUST-WALK',
    customer_name: 'Walk-In Customer',
    cashier_id: 'U3',
    cashier_name: 'Saman Kumara',
    date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), // 1 day ago
    subtotal: 24500,
    discount: 1000,
    total: 23500,
    payment_method: 'Cash',
    cash_received: 25000,
    change_given: 1500,
    status: 'Completed',
    type: 'Sale',
    items: [
      {
        id: 'SI3',
        product_id: 'P4',
        product_name: 'KYB Excel-G Rear Shock Absorber (Pair)',
        product_code: 'SUS-SHK-KYB',
        quantity: 1,
        unit_price: 24500,
        discount: 1000,
        total: 23500
      }
    ]
  }
];

// Seed initial purchases
const INITIAL_PURCHASES: Purchase[] = [
  {
    id: 'PUR-2001',
    purchase_no: 'PO-20001',
    supplier_id: 'S2',
    supplier_name: 'United Motors Spares',
    date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    status: 'Received',
    total: 37000,
    paid_amount: 37000,
    balance: 0,
    items: [
      {
        id: 'PI1',
        product_id: 'P3',
        product_name: 'Toyota Genuine Oil Filter (90915-YZZE1)',
        product_code: 'ENG-FIL-TOY',
        quantity: 20,
        cost_price: 1100,
        total: 22000
      },
      {
        id: 'PI2',
        product_id: 'P4',
        product_name: 'KYB Excel-G Rear Shock Absorber (Pair)',
        product_code: 'SUS-SHK-KYB',
        quantity: 1,
        cost_price: 15000,
        total: 15000
      }
    ]
  }
];

// Seed initial expenses
const INITIAL_EXPENSES: Expense[] = [
  { id: 'E1', date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), category: 'Utility', amount: 8400, description: 'Electricity Bill July 2026', reference_no: 'CEB-9871' },
  { id: 'E2', date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), category: 'Salary', amount: 35000, description: 'Advance payment for shop assistant', reference_no: 'ADV-01' }
];

// Seed initial settings
const INITIAL_SETTINGS: ShopSettings = {
  shop_name: 'WCS INVENTORY & AUTOMOTIVE PARTS',
  shop_phone: '0112345678 / 0771234567',
  shop_email: 'wcs_spareparts@gmail.com',
  shop_address: 'No. 320, Negombo Road, Wattala, Sri Lanka',
  shop_header: 'Quality Motorcycle and Car Spare Parts. Genuine Brands Only.',
  shop_logo: '', // Base64 or empty
  tax_rate: 0, // Sri Lanka VAT / NBT
  thermal_printer_width: '80mm'
};

// Seed initial promotions
const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 'PRM1',
    title: 'Wagon R Tune-up Kit Promo',
    description: 'Get our Heavy Duty Minter brake pads and a premium tune up with NGK spark plugs for a safer, smoother ride.',
    product_ids: ['P1', 'P2'],
    discount_percent: 10,
    created_at: new Date().toISOString()
  }
];

// Load or initialize DB Helper
const getStored = <T>(key: string, defaultVal: T): T => {
  const data = localStorage.getItem(`wcs_${key}`);
  if (!data) {
    localStorage.setItem(`wcs_${key}`, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(data) as T;
  } catch {
    return defaultVal;
  }
};

const setStored = <T>(key: string, val: T): void => {
  localStorage.setItem(`wcs_${key}`, JSON.stringify(val));
};

export const db = {
  // Database control
  reset: () => {
    localStorage.clear();
    // Force reloads
    window.location.reload();
  },

  // Users
  getUsers: (): User[] => getStored('users', INITIAL_USERS),
  saveUsers: (users: User[]) => setStored('users', users),
  addUser: (user: Omit<User, 'id'>): User => {
    const users = db.getUsers();
    const newUser = { ...user, id: generateId() };
    users.push(newUser);
    db.saveUsers(users);
    return newUser;
  },
  updateUser: (user: User) => {
    const users = db.getUsers().map(u => u.id === user.id ? user : u);
    db.saveUsers(users);
  },
  deleteUser: (id: string) => {
    const users = db.getUsers().filter(u => u.id !== id);
    db.saveUsers(users);
  },

  // Categories
  getCategories: (): Category[] => getStored('categories', INITIAL_CATEGORIES),
  saveCategories: (categories: Category[]) => setStored('categories', categories),
  addCategory: (name: string, description: string): Category => {
    const cats = db.getCategories();
    const newCat = { id: generateId(), name, description };
    cats.push(newCat);
    db.saveCategories(cats);
    return newCat;
  },
  updateCategory: (id: string, newName: string, newDesc: string) => {
    const cats = db.getCategories();
    const cat = cats.find(c => c.id === id);
    if (!cat) return;
    const oldName = cat.name;
    cat.name = newName;
    cat.description = newDesc;
    db.saveCategories(cats);

    // Update products' category field if it matched oldName
    const products = db.getProducts();
    let updatedProducts = false;
    products.forEach(p => {
      if (p.category === oldName) {
        p.category = newName;
        updatedProducts = true;
      }
    });
    if (updatedProducts) {
      db.saveProducts(products);
    }
  },
  deleteCategory: (id: string) => {
    const cats = db.getCategories().filter(c => c.id !== id);
    db.saveCategories(cats);
  },

  // Suppliers
  getSuppliers: (): Supplier[] => getStored('suppliers', INITIAL_SUPPLIERS),
  saveSuppliers: (suppliers: Supplier[]) => setStored('suppliers', suppliers),
  addSupplier: (supplier: Omit<Supplier, 'id'>): Supplier => {
    const sups = db.getSuppliers();
    const newSup = { ...supplier, id: generateId() };
    sups.push(newSup);
    db.saveSuppliers(sups);
    return newSup;
  },
  updateSupplier: (supplier: Supplier) => {
    const sups = db.getSuppliers().map(s => s.id === supplier.id ? supplier : s);
    db.saveSuppliers(sups);
  },
  deleteSupplier: (id: string) => {
    const sups = db.getSuppliers().filter(s => s.id !== id);
    db.saveSuppliers(sups);
  },

  // Customers
  getCustomers: (): Customer[] => getStored('customers', INITIAL_CUSTOMERS),
  saveCustomers: (customers: Customer[]) => setStored('customers', customers),
  addCustomer: (customer: Omit<Customer, 'id' | 'current_credit'>): Customer => {
    const custs = db.getCustomers();
    const newCust = { ...customer, id: generateId(), current_credit: 0 };
    custs.push(newCust);
    db.saveCustomers(custs);
    return newCust;
  },
  updateCustomer: (customer: Customer) => {
    const custs = db.getCustomers().map(c => c.id === customer.id ? customer : c);
    db.saveCustomers(custs);
  },
  deleteCustomer: (id: string) => {
    if (id === 'CUST-WALK') return; // Cannot delete walk-in
    const custs = db.getCustomers().filter(c => c.id !== id);
    db.saveCustomers(custs);
  },

  // Products / Inventory
  getProducts: (): Product[] => getStored('products', INITIAL_PRODUCTS),
  saveProducts: (products: Product[]) => setStored('products', products),
  addProduct: (product: Omit<Product, 'id'>): Product => {
    const products = db.getProducts();
    const newProd = { ...product, id: generateId() };
    products.push(newProd);
    db.saveProducts(products);
    
    // Add stock movement
    db.addStockMovement({
      product_id: newProd.id,
      product_name: newProd.part_name,
      type: 'Adjustment',
      quantity: newProd.stock_quantity,
      reason: 'Initial stock setup'
    });
    
    return newProd;
  },
  updateProduct: (product: Product) => {
    const oldProduct = db.getProducts().find(p => p.id === product.id);
    const products = db.getProducts().map(p => p.id === product.id ? product : p);
    db.saveProducts(products);

    if (oldProduct && oldProduct.stock_quantity !== product.stock_quantity) {
      const diff = product.stock_quantity - oldProduct.stock_quantity;
      db.addStockMovement({
        product_id: product.id,
        product_name: product.part_name,
        type: 'Adjustment',
        quantity: Math.abs(diff),
        reason: `Manual stock adjustment (${diff > 0 ? '+' : '-'}${Math.abs(diff)})`
      });
    }
  },
  deleteProduct: (id: string) => {
    const products = db.getProducts().filter(p => p.id !== id);
    db.saveProducts(products);
  },

  // Sales (POS billing, returns)
  getSales: (): Sale[] => getStored('sales', INITIAL_SALES),
  saveSales: (sales: Sale[]) => setStored('sales', sales),
  addSale: (saleData: Omit<Sale, 'id' | 'invoice_number' | 'date'>): Sale => {
    const sales = db.getSales();
    const invoiceNum = `INV-${10000 + sales.length + 1}`;
    const newSale: Sale = {
      ...saleData,
      id: `SALE-${generateId()}`,
      invoice_number: invoiceNum,
      date: new Date().toISOString()
    };
    sales.push(newSale);
    db.saveSales(sales);

    // Update stock levels & record stock movements
    const products = db.getProducts();
    newSale.items.forEach(item => {
      const prod = products.find(p => p.id === item.product_id);
      if (prod) {
        prod.stock_quantity = Math.max(0, prod.stock_quantity - item.quantity);
        db.addStockMovement({
          product_id: prod.id,
          product_name: prod.part_name,
          type: 'Out',
          quantity: item.quantity,
          reason: `Invoice ${invoiceNum} sale`
        });
      }
    });
    db.saveProducts(products);

    // Update Customer credit if Credit purchase
    if (newSale.payment_method === 'Credit' && newSale.customer_id !== 'CUST-WALK') {
      const customers = db.getCustomers();
      const customer = customers.find(c => c.id === newSale.customer_id);
      if (customer) {
        customer.current_credit += newSale.total;
        db.saveCustomers(customers);
      }
    }

    return newSale;
  },
  returnSale: (invoiceId: string, returnedItems: { product_id: string; quantity: number }[]): Sale | null => {
    const sales = db.getSales();
    const originalSale = sales.find(s => s.id === invoiceId || s.invoice_number === invoiceId);
    if (!originalSale) return null;

    // Create a Sales Return invoice
    const returnInvoiceNum = `RET-${originalSale.invoice_number.substring(4)}`;
    
    // Calculate totals of returned items
    const returnedInvoiceItems = originalSale.items
      .filter(item => returnedItems.some(ri => ri.product_id === item.product_id))
      .map(item => {
        const retQty = returnedItems.find(ri => ri.product_id === item.product_id)?.quantity || 0;
        return {
          ...item,
          id: generateId(),
          quantity: retQty,
          total: retQty * item.unit_price * (1 - item.discount / 100)
        };
      })
      .filter(item => item.quantity > 0);

    if (returnedInvoiceItems.length === 0) return null;

    const returnTotal = returnedInvoiceItems.reduce((acc, item) => acc + item.total, 0);

    const salesReturn: Sale = {
      id: `SALE-RET-${generateId()}`,
      invoice_number: returnInvoiceNum,
      customer_id: originalSale.customer_id,
      customer_name: originalSale.customer_name,
      cashier_id: originalSale.cashier_id,
      cashier_name: originalSale.cashier_name,
      date: new Date().toISOString(),
      subtotal: returnTotal,
      discount: 0,
      total: returnTotal,
      payment_method: originalSale.payment_method,
      cash_received: 0,
      change_given: 0,
      status: 'Returned',
      type: 'Return',
      returned_invoice_id: originalSale.invoice_number,
      items: returnedInvoiceItems
    };

    sales.push(salesReturn);
    db.saveSales(sales);

    // Re-adjust stock back
    const products = db.getProducts();
    returnedInvoiceItems.forEach(item => {
      const prod = products.find(p => p.id === item.product_id);
      if (prod) {
        prod.stock_quantity += item.quantity;
        db.addStockMovement({
          product_id: prod.id,
          product_name: prod.part_name,
          type: 'Return',
          quantity: item.quantity,
          reason: `Sales Return on invoice ${originalSale.invoice_number}`
        });
      }
    });
    db.saveProducts(products);

    // If Credit payment, deduct customer credit
    if (originalSale.payment_method === 'Credit' && originalSale.customer_id !== 'CUST-WALK') {
      const customers = db.getCustomers();
      const customer = customers.find(c => c.id === originalSale.customer_id);
      if (customer) {
        customer.current_credit = Math.max(0, customer.current_credit - returnTotal);
        db.saveCustomers(customers);
      }
    }

    return salesReturn;
  },

  // Purchases (Stock ordering, updates stock automatically)
  getPurchases: (): Purchase[] => getStored('purchases', INITIAL_PURCHASES),
  savePurchases: (purchases: Purchase[]) => setStored('purchases', purchases),
  addPurchase: (purchaseData: Omit<Purchase, 'id' | 'purchase_no' | 'date'>): Purchase => {
    const purchases = db.getPurchases();
    const purchaseNum = `PO-${20000 + purchases.length + 1}`;
    const newPurchase: Purchase = {
      ...purchaseData,
      id: `PUR-${generateId()}`,
      purchase_no: purchaseNum,
      date: new Date().toISOString()
    };
    purchases.push(newPurchase);
    db.savePurchases(purchases);

    // If state is "Received", auto update stock and supplier balance
    if (newPurchase.status === 'Received') {
      db.receivePurchaseStock(newPurchase);
    } else {
      // Still Ordered - does not touch stock, but we might save it
    }

    // Add supplier outstanding balance
    if (newPurchase.balance > 0) {
      const suppliers = db.getSuppliers();
      const supplier = suppliers.find(s => s.id === newPurchase.supplier_id);
      if (supplier) {
        supplier.balance += newPurchase.balance;
        db.saveSuppliers(suppliers);
      }
    }

    return newPurchase;
  },
  receivePurchaseStock: (purchase: Purchase) => {
    const products = db.getProducts();
    purchase.items.forEach(item => {
      const prod = products.find(p => p.id === item.product_id);
      if (prod) {
        prod.stock_quantity += item.quantity;
        // Optionally update purchase price to match last PO cost
        prod.purchase_price = item.cost_price;
        db.addStockMovement({
          product_id: prod.id,
          product_name: prod.part_name,
          type: 'In',
          quantity: item.quantity,
          reason: `Purchase Received Order ${purchase.purchase_no}`
        });
      }
    });
    db.saveProducts(products);
  },
  returnPurchase: (purchaseId: string, returnedItems: { product_id: string; quantity: number }[]): Purchase | null => {
    const purchases = db.getPurchases();
    const originalPurchase = purchases.find(p => p.id === purchaseId || p.purchase_no === purchaseId);
    if (!originalPurchase) return null;

    // Decrement products' stock levels
    const products = db.getProducts();
    returnedItems.forEach(item => {
      const prod = products.find(p => p.id === item.product_id);
      if (prod) {
        prod.stock_quantity = Math.max(0, prod.stock_quantity - item.quantity);
        db.addStockMovement({
          product_id: prod.id,
          product_name: prod.part_name,
          type: 'Out',
          quantity: item.quantity,
          reason: `Purchase Return to Supplier for PO ${originalPurchase.purchase_no}`
        });
      }
    });
    db.saveProducts(products);

    // Calculate value of returned items to adjust supplier balance
    let returnedValue = 0;
    const returnedItemsWithDetails = originalPurchase.items
      .filter(item => returnedItems.some(ri => ri.product_id === item.product_id))
      .map(item => {
        const retQty = returnedItems.find(ri => ri.product_id === item.product_id)?.quantity || 0;
        const val = retQty * item.cost_price;
        returnedValue += val;
        return {
          ...item,
          id: Math.random().toString(36).substring(2, 7).toUpperCase(),
          quantity: retQty,
          total: val
        };
      })
      .filter(item => item.quantity > 0);

    // Create a purchase return record
    const returnPurchaseNo = `PR-${originalPurchase.purchase_no.substring(3)}`;
    const purchaseReturn: Purchase = {
      id: `PUR-RET-${generateId()}`,
      purchase_no: returnPurchaseNo,
      supplier_id: originalPurchase.supplier_id,
      supplier_name: originalPurchase.supplier_name,
      date: new Date().toISOString(),
      status: 'Returned',
      total: returnedValue,
      paid_amount: 0,
      balance: returnedValue,
      items: returnedItemsWithDetails
    };

    purchases.push(purchaseReturn);
    db.savePurchases(purchases);

    // Adjust supplier balance
    const suppliers = db.getSuppliers();
    const supplier = suppliers.find(s => s.id === originalPurchase.supplier_id);
    if (supplier) {
      supplier.balance = Math.max(0, supplier.balance - returnedValue);
      db.saveSuppliers(suppliers);
    }

    return purchaseReturn;
  },
  settlePurchasePayment: (purchaseId: string, amount: number): Purchase | null => {
    const purchases = db.getPurchases();
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return null;

    const actualPaid = Math.min(purchase.balance, amount);
    purchase.paid_amount += actualPaid;
    purchase.balance = Math.max(0, purchase.balance - actualPaid);
    db.savePurchases(purchases);

    // Deduct from supplier balance as well
    const suppliers = db.getSuppliers();
    const supplier = suppliers.find(s => s.id === purchase.supplier_id);
    if (supplier) {
      supplier.balance = Math.max(0, supplier.balance - actualPaid);
      db.saveSuppliers(suppliers);
    }

    // Log as expense
    db.addExpense({
      category: 'Other',
      amount: actualPaid,
      description: `PO Payment: ${purchase.purchase_no} to ${purchase.supplier_name}`,
      reference_no: `PAY-${purchase.purchase_no}`
    });

    return purchase;
  },

  // Expenses
  getExpenses: (): Expense[] => getStored('expenses', INITIAL_EXPENSES),
  saveExpenses: (expenses: Expense[]) => setStored('expenses', expenses),
  addExpense: (expense: Omit<Expense, 'id' | 'date'>): Expense => {
    const exps = db.getExpenses();
    const newExp = {
      ...expense,
      id: generateId(),
      date: new Date().toISOString()
    };
    exps.push(newExp);
    db.saveExpenses(exps);
    return newExp;
  },
  deleteExpense: (id: string) => {
    const exps = db.getExpenses().filter(e => e.id !== id);
    db.saveExpenses(exps);
  },

  // Stock movements log
  getStockMovements: (): StockMovement[] => getStored('stock_movements', []),
  saveStockMovements: (movements: StockMovement[]) => setStored('stock_movements', movements),
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'date'>): StockMovement => {
    const movements = db.getStockMovements();
    const newMove = {
      ...movement,
      id: generateId(),
      date: new Date().toISOString()
    };
    movements.unshift(newMove); // newest first
    db.saveStockMovements(movements);
    return newMove;
  },

  // Settings
  getSettings: (): ShopSettings => getStored('settings', INITIAL_SETTINGS),
  saveSettings: (settings: ShopSettings) => setStored('settings', settings),

  // Promotions
  getPromotions: (): Promotion[] => getStored('promotions', INITIAL_PROMOTIONS),
  savePromotions: (promos: Promotion[]) => setStored('promotions', promos),
  addPromotion: (promo: Omit<Promotion, 'id' | 'created_at'>): Promotion => {
    const promos = db.getPromotions();
    const newPromo = {
      ...promo,
      id: generateId(),
      created_at: new Date().toISOString()
    };
    promos.push(newPromo);
    db.savePromotions(promos);
    return newPromo;
  },
  deletePromotion: (id: string) => {
    const promos = db.getPromotions().filter(p => p.id !== id);
    db.savePromotions(promos);
  }
};
