import { Product } from '../types';

export interface ParsedCsvRow {
  id: string;
  rawBarcode: string;
  barcode: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  category: string;
  status: 'matched_existing' | 'new_product' | 'invalid';
  matchedProductId?: string;
  matchedProductName?: string;
  existingVanStock?: number;
  error?: string;
}

/**
 * Clean and normalize header strings for flexible matching
 */
function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Robust CSV/TSV line splitter that respects quoted strings
 */
function parseCsvLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Detect delimiter (comma, tab, semicolon)
 */
function detectDelimiter(firstLine: string): string {
  if (firstLine.includes('\t')) return '\t';
  if (firstLine.includes(';') && !firstLine.includes(',')) return ';';
  return ',';
}

/**
 * Parse CSV or TSV string into structured van stock update records
 */
export function parseVanStockCsv(csvText: string, existingProducts: Product[]): {
  rows: ParsedCsvRow[];
  totalParsed: number;
  matchedCount: number;
  newProductCount: number;
  invalidCount: number;
  errors: string[];
} {
  const errors: string[] = [];
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#')); // ignore empty lines and hash comments

  if (lines.length === 0) {
    return {
      rows: [],
      totalParsed: 0,
      matchedCount: 0,
      newProductCount: 0,
      invalidCount: 0,
      errors: ['The CSV file is empty. Please upload or paste valid data.'],
    };
  }

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = parseCsvLine(lines[0], delimiter);
  const normalizedHeaders = rawHeaders.map(normalizeHeader);

  // Column index identification
  let barcodeIdx = normalizedHeaders.findIndex((h) =>
    ['barcode', 'code', 'upc', 'ean', 'itemcode', 'barcodeno', 'barcodenumber', 'sku'].includes(h)
  );
  let nameIdx = normalizedHeaders.findIndex((h) =>
    ['name', 'itemname', 'productname', 'product', 'title', 'item', 'description'].includes(h)
  );
  let qtyIdx = normalizedHeaders.findIndex((h) =>
    ['vanstock', 'qty', 'quantity', 'pieces', 'pcs', 'loadqty', 'stock', 'units', 'vanpieces', 'addqty', 'amount'].includes(h)
  );
  let priceIdx = normalizedHeaders.findIndex((h) =>
    ['price', 'unitprice', 'qar', 'priceqar', 'unitpriceqar', 'rate', 'cost'].includes(h)
  );
  let unitIdx = normalizedHeaders.findIndex((h) =>
    ['unit', 'uom', 'packtype', 'type'].includes(h)
  );
  let categoryIdx = normalizedHeaders.findIndex((h) =>
    ['category', 'group', 'dept', 'department'].includes(h)
  );

  // Fallbacks if no header row was detected (e.g. raw 3-column data: barcode, name, qty)
  let startLine = 1;
  if (barcodeIdx === -1 && qtyIdx === -1) {
    // Check if line 0 looks like data
    const firstCols = parseCsvLine(lines[0], delimiter);
    const looksLikeBarcode = /^\d{5,14}$/.test(firstCols[0]?.trim());
    if (looksLikeBarcode) {
      startLine = 0;
      barcodeIdx = 0;
      nameIdx = firstCols.length > 1 ? 1 : -1;
      qtyIdx = firstCols.length > 2 ? 2 : 1;
      priceIdx = firstCols.length > 3 ? 3 : -1;
    } else {
      errors.push('Could not find required columns (barcode, van_stock/quantity) in CSV header.');
    }
  }

  // If quantity column wasn't explicitly named, fallback to 2nd or 3rd column
  if (qtyIdx === -1) {
    if (barcodeIdx === 0 && nameIdx === 1 && rawHeaders.length >= 3) {
      qtyIdx = 2;
    } else if (barcodeIdx === 0 && nameIdx === -1 && rawHeaders.length >= 2) {
      qtyIdx = 1;
    }
  }

  const parsedRows: ParsedCsvRow[] = [];

  for (let i = startLine; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i], delimiter);
    if (cols.length === 0 || cols.every((c) => !c)) continue;

    const rawBarcode = barcodeIdx !== -1 && cols[barcodeIdx] !== undefined ? cols[barcodeIdx].trim() : '';
    const cleanBarcode = rawBarcode.replace(/[^a-zA-Z0-9_-]/g, '');
    const rawName = nameIdx !== -1 && cols[nameIdx] !== undefined ? cols[nameIdx].trim() : '';
    
    // Qty parsing
    let qtyVal = 0;
    if (qtyIdx !== -1 && cols[qtyIdx] !== undefined) {
      const parsed = parseInt(cols[qtyIdx].replace(/[^0-9-]/g, ''), 10);
      qtyVal = isNaN(parsed) ? 0 : Math.max(0, parsed);
    }

    // Price parsing
    let priceVal = 0;
    if (priceIdx !== -1 && cols[priceIdx] !== undefined) {
      const parsed = parseFloat(cols[priceIdx].replace(/[^0-9.]/g, ''));
      priceVal = isNaN(parsed) ? 0 : Math.max(0, parsed);
    }

    const unitVal = unitIdx !== -1 && cols[unitIdx] ? cols[unitIdx].trim() : 'pc';
    const catVal = categoryIdx !== -1 && cols[categoryIdx] ? cols[categoryIdx].trim() : 'General';

    // Check for match in existing catalog
    const existing = existingProducts.find(
      (p) =>
        (cleanBarcode && p.barcode.toLowerCase() === cleanBarcode.toLowerCase()) ||
        (cleanBarcode && p.sku.toLowerCase() === cleanBarcode.toLowerCase()) ||
        (rawName && p.name.toLowerCase() === rawName.toLowerCase())
    );

    const rowId = `csv-row-${i}-${Date.now()}`;

    if (existing) {
      parsedRows.push({
        id: rowId,
        rawBarcode,
        barcode: existing.barcode,
        name: existing.name,
        quantity: qtyVal,
        unitPrice: priceVal > 0 ? priceVal : existing.unitPrice,
        unit: existing.unit,
        category: existing.category,
        status: 'matched_existing',
        matchedProductId: existing.id,
        matchedProductName: existing.name,
        existingVanStock: existing.vanStock,
      });
    } else if (cleanBarcode || rawName) {
      // New product to be added and stocked in van
      const finalBarcode = cleanBarcode || `${Math.floor(629000000000 + Math.random() * 99999999)}`;
      const finalName = rawName || `Item #${finalBarcode.slice(-4)}`;
      parsedRows.push({
        id: rowId,
        rawBarcode,
        barcode: finalBarcode,
        name: finalName,
        quantity: qtyVal,
        unitPrice: priceVal > 0 ? priceVal : 10.0,
        unit: unitVal || 'pc',
        category: catVal || 'General',
        status: 'new_product',
        existingVanStock: 0,
      });
    } else {
      parsedRows.push({
        id: rowId,
        rawBarcode,
        barcode: '',
        name: 'Empty / Unreadable row',
        quantity: 0,
        unitPrice: 0,
        unit: 'pc',
        category: 'General',
        status: 'invalid',
        error: 'Missing both barcode and product name',
      });
    }
  }

  const matchedCount = parsedRows.filter((r) => r.status === 'matched_existing').length;
  const newProductCount = parsedRows.filter((r) => r.status === 'new_product').length;
  const invalidCount = parsedRows.filter((r) => r.status === 'invalid').length;

  return {
    rows: parsedRows,
    totalParsed: parsedRows.length,
    matchedCount,
    newProductCount,
    invalidCount,
    errors,
  };
}

/**
 * Generate a ready-to-use CSV template for users to fill in
 */
export function generateSampleCsvTemplate(): string {
  return [
    '# Nasroute Qatar Van Stock Loading Template',
    '# Columns: barcode,name,van_stock,unit_price_qar,unit,category',
    '# You can open and edit this file directly in Excel, Google Sheets, or Notepad',
    'barcode,name,van_stock,unit_price_qar,unit,category',
    '6291001122334,Almarai Fresh Milk 1L,24,6.50,bottle,Dairy',
    '6291002233445,Rayyan Natural Water 500ml x 24,30,18.00,carton,Beverages',
    '6291003344556,Baladna Greek Yoghurt 500g,15,9.75,cup,Dairy',
    '6291004455667,Mazzraty Fresh Whole Chicken 1000g,12,17.50,pc,Poultry',
    '6291005566778,Lipton Yellow Label Tea Bags 100s,20,16.25,box,Beverages',
    '6291006677889,Basmati Rice Special 5kg,10,32.00,bag,Grains',
  ].join('\r\n');
}

/**
 * Export current van inventory catalog as a CSV file for quick editing
 */
export function generateCurrentVanInventoryCsv(products: Product[]): string {
  const headers = ['barcode', 'name', 'van_stock', 'unit_price_qar', 'unit', 'category', 'sku'];
  const rows = products.map((p) => {
    // Quote strings that may have commas
    const safeName = `"${p.name.replace(/"/g, '""')}"`;
    const safeCategory = `"${p.category.replace(/"/g, '""')}"`;
    return [p.barcode, safeName, p.vanStock, p.unitPrice.toFixed(2), p.unit, safeCategory, p.sku].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Trigger browser file download
 */
export function downloadCsvFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
