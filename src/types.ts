export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  unitPrice: number;       // Wholesale / Delivery price
  retailPrice?: number;    // Recommended retail price for outlet
  unit: string;            // e.g., 'bag', 'bottle', 'box', 'carton'
  warehouseStock: number;  // Stock in central warehouse
  vanStock: number;        // Stock currently loaded on delivery driver's van
  image: string;
  description?: string;
  lowStockThreshold: number;
}

export interface DeliveryItem {
  productId: string;
  expectedQty: number;     // Expected/ordered quantity
  scannedQty: number;      // Quantity scanned by driver at outlet
  unitPrice: number;       // Price locked for this delivery
}

export interface Outlet {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
  orderNumber: string;
  status: 'pending' | 'in_progress' | 'delivered';
  scheduledTime: string;
  deliveredAt?: string;
  items: DeliveryItem[];
  signature?: string;      // Base64 signature data URL
  receivedBy?: string;
  driverNotes?: string;
}

export interface ScanEvent {
  id: string;
  timestamp: string;
  outletId: string;
  outletName: string;
  productId: string;
  productName: string;
  barcode: string;
  quantityDelta: number;
  unitPrice: number;
  totalPrice: number;
  vanStockRemaining: number;
  source: 'camera_scan' | 'manual_entry' | 'quick_select';
}

export type AppMode = 'driver' | 'manager' | 'split';

export type PaperSize = 'a4' | 'thermal_80mm' | 'thermal_58mm' | 'letter';

export type PhoneModel = 'iphone15' | 'galaxy_s24' | 'rugged_terminal';
export type PhoneOrientation = 'portrait' | 'landscape';
export type TouchErgonomics = 'standard' | 'large_glove_mode';

export interface PhoneDeviceSettings {
  deviceFrame: 'phone_frame' | 'responsive_fluid';
  phoneModel: PhoneModel;
  orientation: PhoneOrientation;
  touchTargetSize: TouchErgonomics;
  hapticVibration: boolean;
  soundFeedback: boolean;
  scannerAutoStart: boolean;
  keepScreenAwake: boolean; // Screen wake lock API
  showStatusBar: boolean;
  scannerQuantityDefault: 1 | 5 | 10;
}

export const DEFAULT_PHONE_SETTINGS: PhoneDeviceSettings = {
  deviceFrame: 'phone_frame',
  phoneModel: 'iphone15',
  orientation: 'portrait',
  touchTargetSize: 'standard',
  hapticVibration: true,
  soundFeedback: true,
  scannerAutoStart: true,
  keepScreenAwake: true,
  showStatusBar: true,
  scannerQuantityDefault: 1,
};

export interface PageSetupConfig {
  paperSize: PaperSize;
  orientation: 'portrait' | 'landscape';
  companyName: string;
  companySubtext: string;
  vanIdentifier: string;
  taxRegistrationNumber: string; // e.g. Qatar Commercial Reg / Tax number
  phone: string;
  address: string;
  printCopies: 1 | 2; // 1 = Single, 2 = Customer & Driver Copy
  showBarcodeOnReceipt: boolean;
  showSignatureOnReceipt: boolean;
  showPricePerPiece: boolean;
  showVanStockRemaining: boolean;
  printDensity: 'compact' | 'normal' | 'spacious';
  receiptFooterNote: string;
  // Label Print Sheet Setup
  labelGridCols: 2 | 3 | 4;
  showPriceOnLabels: boolean;
  showSkuOnLabels: boolean;
  // Phone Device Page Settings
  phoneDevice: PhoneDeviceSettings;
}

export const DEFAULT_PAGE_SETUP: PageSetupConfig = {
  paperSize: 'a4',
  orientation: 'portrait',
  companyName: 'Nasroute Logistics Qatar',
  companySubtext: 'Direct Van Delivery & Stock Distribution',
  vanIdentifier: 'Van #1 (Doha Central)',
  taxRegistrationNumber: 'CR: 104829 / Tax: QAT-001',
  phone: '+974 4400 1234 / +974 5511 2233',
  address: 'Industrial Area Zone 55, Doha, State of Qatar',
  printCopies: 1,
  showBarcodeOnReceipt: true,
  showSignatureOnReceipt: true,
  showPricePerPiece: true,
  showVanStockRemaining: false,
  printDensity: 'normal',
  receiptFooterNote: 'Thank you for your business. State of Qatar 0% standard VAT applied.',
  labelGridCols: 3,
  showPriceOnLabels: true,
  showSkuOnLabels: true,
  phoneDevice: DEFAULT_PHONE_SETTINGS,
};
