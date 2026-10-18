import { Product, Outlet } from '../types';

// Default is completely empty as requested by the user
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_OUTLETS: Outlet[] = [];

// Optional sample data template if the user ever wants to preview an example
export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    sku: 'COF-ETH-01',
    barcode: '793573189012',
    name: 'Artisan Roast Coffee Beans (12oz)',
    category: 'Coffee & Tea',
    unitPrice: 14.50,
    retailPrice: 22.00,
    unit: 'bag',
    warehouseStock: 240,
    vanStock: 45,
    image: '/src/assets/images/prod_artisan_coffee_1792244748566.jpg',
    description: 'Single-origin Ethiopian Yirgacheffe light roast beans.',
    lowStockThreshold: 15,
  },
  {
    id: 'prod-002',
    sku: 'BEV-TUR-02',
    barcode: '841029384756',
    name: 'Organic Turmeric Ginger Juice (12oz)',
    category: 'Cold Beverages',
    unitPrice: 3.80,
    retailPrice: 6.50,
    unit: 'bottle',
    warehouseStock: 380,
    vanStock: 60,
    image: '/src/assets/images/prod_organic_juice_1792244749027.jpg',
    description: 'Cold-pressed raw juice with fresh ginger, orange & lemon.',
    lowStockThreshold: 20,
  },
  {
    id: 'prod-003',
    sku: 'BAK-CRO-03',
    barcode: '912837465019',
    name: 'Artisan Butter Croissants (4-Pack)',
    category: 'Bakery & Pastry',
    unitPrice: 8.20,
    retailPrice: 13.50,
    unit: 'box',
    warehouseStock: 120,
    vanStock: 30,
    image: '/src/assets/images/prod_gourmet_bakery_1792244749537.jpg',
    description: 'Traditional laminated butter French croissants baked daily.',
    lowStockThreshold: 10,
  },
  {
    id: 'prod-004',
    sku: 'DAI-MILK-04',
    barcode: '654987321045',
    name: 'Farmstead Organic Whole Milk (1L)',
    category: 'Dairy & Plant',
    unitPrice: 4.10,
    retailPrice: 6.90,
    unit: 'bottle',
    warehouseStock: 310,
    vanStock: 50,
    image: '/src/assets/images/prod_dairy_carton_1792244749171.jpg',
    description: 'Pasture-raised, cream-top whole milk from local family farms.',
    lowStockThreshold: 25,
  }
];

export const SAMPLE_OUTLETS: Outlet[] = [
  {
    id: 'outlet-001',
    name: 'Downtown Espresso Bar & Cafe',
    address: '442 Market St, Suite 101, Metro Center',
    contactPerson: 'Elena Rostova',
    phone: '+1 (555) 234-8901',
    orderNumber: 'ORD-8821',
    status: 'pending',
    scheduledTime: '08:30 AM',
    items: [
      { productId: 'prod-001', expectedQty: 10, scannedQty: 0, unitPrice: 14.50 },
      { productId: 'prod-002', expectedQty: 12, scannedQty: 0, unitPrice: 3.80 },
    ],
  }
];
