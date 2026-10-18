import React, { useState, useRef } from 'react';
import {
  X,
  Truck,
  Check,
  Sparkles,
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  Upload,
  FileUp,
  AlertTriangle,
  CheckCircle2,
  Search,
  PackagePlus,
  ClipboardPaste,
  HelpCircle,
} from 'lucide-react';
import { Product } from '../../types';
import { formatQAR } from '../../utils/format';
import {
  parseVanStockCsv,
  generateSampleCsvTemplate,
  generateCurrentVanInventoryCsv,
  downloadCsvFile,
  ParsedCsvRow,
} from '../../utils/csvHelper';
import { useInventory } from '../../context/InventoryContext';

interface BulkLoadVanModalProps {
  products: Product[];
  onConfirmBulkLoad?: (transfers: { productId: string; transferQty: number; mode?: 'add' | 'set' }[]) => void;
  onBulkAddProducts?: (items: Omit<Product, 'id'>[]) => void;
  onClose: () => void;
  initialTab?: 'csv' | 'adjust_existing' | 'quick_bulk_create';
}

interface NewProductRow {
  id: string;
  name: string;
  barcode: string;
  unitPrice: number;
  vanStock: number;
  unit: string;
  category: string;
}

export const BulkLoadVanModal: React.FC<BulkLoadVanModalProps> = ({
  products,
  onConfirmBulkLoad,
  onBulkAddProducts,
  onClose,
  initialTab = 'csv',
}) => {
  const { bulkApplyVanCsv } = useInventory();
  const [activeTab, setActiveTab] = useState<'csv' | 'adjust_existing' | 'quick_bulk_create'>(initialTab);
  const [formError, setFormError] = useState<string | null>(null);

  // ================= CSV STATE =================
  const [csvInputMethod, setCsvInputMethod] = useState<'file' | 'paste'>('file');
  const [csvText, setCsvText] = useState<string>('');
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[] | null>(null);
  const [csvMode, setCsvMode] = useState<'add' | 'set'>('add');
  const [updatePricesFromCsv, setUpdatePricesFromCsv] = useState(true);
  const [csvFilterStatus, setCsvFilterStatus] = useState<'all' | 'matched' | 'new' | 'issues'>('all');
  const [csvSearchQuery, setCsvSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ================= MANUAL ADJUST STATE =================
  const [manualMode, setManualMode] = useState<'add' | 'set'>('add');
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    products.forEach((p) => {
      initial[p.id] = 10;
    });
    return initial;
  });

  // ================= QUICK BULK CREATE STATE =================
  const [newRows, setNewRows] = useState<NewProductRow[]>([
    {
      id: 'row-1',
      name: '',
      barcode: `${Math.floor(629000000000 + Math.random() * 99999999)}`,
      unitPrice: 15.0,
      vanStock: 20,
      unit: 'pc',
      category: 'General',
    },
    {
      id: 'row-2',
      name: '',
      barcode: `${Math.floor(629000000000 + Math.random() * 99999999)}`,
      unitPrice: 25.0,
      vanStock: 15,
      unit: 'pc',
      category: 'General',
    },
  ]);

  // -------------------------------------------------------------
  // CSV Handlers
  // -------------------------------------------------------------
  const handleProcessCsvText = (text: string, filename?: string) => {
    setFormError(null);
    if (!text.trim()) {
      setParsedRows(null);
      return;
    }
    const result = parseVanStockCsv(text, products);
    if (result.errors.length > 0 && result.rows.length === 0) {
      setFormError(result.errors.join(' '));
      return;
    }
    setParsedRows(result.rows);
    if (filename) setCsvFileName(filename);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      handleProcessCsvText(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      handleProcessCsvText(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleLoadSampleTemplateData = () => {
    const sample = generateSampleCsvTemplate();
    setCsvText(sample);
    setCsvFileName('sample_qatar_van_load.csv');
    handleProcessCsvText(sample, 'sample_qatar_van_load.csv');
  };

  const handleDownloadTemplate = () => {
    const template = generateSampleCsvTemplate();
    downloadCsvFile('nasroute_van_load_template.csv', template);
  };

  const handleExportCurrentInventory = () => {
    const csv = generateCurrentVanInventoryCsv(products);
    downloadCsvFile('nasroute_current_van_stock.csv', csv);
  };

  const handleClearCsv = () => {
    setCsvText('');
    setCsvFileName(null);
    setParsedRows(null);
    setFormError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpdateParsedRowQty = (id: string, qty: number) => {
    if (!parsedRows) return;
    setParsedRows(
      parsedRows.map((r) => (r.id === id ? { ...r, quantity: Math.max(0, qty) } : r))
    );
  };

  const handleRemoveParsedRow = (id: string) => {
    if (!parsedRows) return;
    setParsedRows(parsedRows.filter((r) => r.id !== id));
  };

  const handleApplyCsvToVan = () => {
    if (!parsedRows || parsedRows.length === 0) {
      setFormError('No valid rows found to apply.');
      return;
    }

    const validRows = parsedRows.filter((r) => r.status !== 'invalid');
    if (validRows.length === 0) {
      setFormError('All rows in the CSV are invalid. Please check your columns.');
      return;
    }

    const updates: {
      productId: string;
      transferQty: number;
      mode: 'add' | 'set';
      unitPrice?: number;
    }[] = [];

    const newProducts: Omit<Product, 'id'>[] = [];

    validRows.forEach((row) => {
      if (row.status === 'matched_existing' && row.matchedProductId) {
        updates.push({
          productId: row.matchedProductId,
          transferQty: row.quantity,
          mode: csvMode,
          unitPrice: updatePricesFromCsv && row.unitPrice > 0 ? row.unitPrice : undefined,
        });
      } else if (row.status === 'new_product') {
        newProducts.push({
          name: row.name.trim(),
          barcode: row.barcode.trim(),
          sku: `SKU-${row.barcode.slice(-4)}`,
          category: row.category || 'General',
          unit: row.unit || 'pc',
          unitPrice: row.unitPrice > 0 ? row.unitPrice : 10.0,
          warehouseStock: Math.max(0, row.quantity * 2),
          vanStock: Math.max(0, row.quantity),
          image: '',
          lowStockThreshold: 5,
          description: `Loaded via CSV on Nasroute Van #1`,
        });
      }
    });

    bulkApplyVanCsv({ updates, newProducts });
    onClose();
  };

  // -------------------------------------------------------------
  // Manual Adjust Handlers
  // -------------------------------------------------------------
  const handleQtyChange = (productId: string, val: number) => {
    const clamped = Math.max(0, isNaN(val) ? 0 : val);
    setQuantities((prev) => ({
      ...prev,
      [productId]: clamped,
    }));
  };

  const applyPresetAdd = (amount: number) => {
    setManualMode('add');
    const next: Record<string, number> = {};
    products.forEach((p) => {
      next[p.id] = amount;
    });
    setQuantities(next);
  };

  const applySetExact = (targetAmount: number) => {
    setManualMode('set');
    const next: Record<string, number> = {};
    products.forEach((p) => {
      next[p.id] = targetAmount;
    });
    setQuantities(next);
  };

  const applyReset = () => {
    const next: Record<string, number> = {};
    products.forEach((p) => {
      next[p.id] = 0;
    });
    setQuantities(next);
  };

  const totalUnitsCalculated = Object.entries(quantities).reduce((sum, [pId, qty]) => {
    const prod = products.find((p) => p.id === pId);
    if (!prod) return sum;
    if (manualMode === 'set') {
      return sum + qty;
    }
    return sum + (qty > 0 ? qty : 0);
  }, 0);

  const totalLoadedValue = products.reduce((sum, p) => {
    const qty = quantities[p.id] || 0;
    if (manualMode === 'set') {
      return sum + qty * p.unitPrice;
    }
    return sum + (p.vanStock + qty) * p.unitPrice;
  }, 0);

  const handleExistingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const transfers = Object.entries(quantities).map(([productId, transferQty]) => ({
      productId,
      transferQty,
      mode: manualMode,
    }));

    if (manualMode === 'add' && transfers.every((t) => t.transferQty <= 0)) {
      setFormError('Please enter at least 1 unit to add to the van stock.');
      return;
    }

    if (onConfirmBulkLoad) {
      onConfirmBulkLoad(transfers);
    }
    onClose();
  };

  // -------------------------------------------------------------
  // Quick Bulk Create Rows Handlers
  // -------------------------------------------------------------
  const handleAddRow = () => {
    setNewRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: '',
        barcode: `${Math.floor(629000000000 + Math.random() * 99999999)}`,
        unitPrice: 10.0,
        vanStock: 10,
        unit: 'pc',
        category: 'General',
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (newRows.length <= 1) return;
    setNewRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRow = (id: string, field: keyof NewProductRow, val: unknown) => {
    setNewRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };

  const handleSaveBulkNew = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validRows = newRows.filter((r) => r.name.trim().length > 0);
    if (validRows.length === 0) {
      setFormError('Please provide a product title for at least one item.');
      return;
    }

    if (onBulkAddProducts) {
      const itemsToCreate: Omit<Product, 'id'>[] = validRows.map((r) => ({
        name: r.name.trim(),
        barcode: r.barcode.trim(),
        sku: `SKU-${r.barcode.slice(-4)}`,
        category: r.category || 'General',
        unit: r.unit || 'pc',
        unitPrice: Number(r.unitPrice) || 0,
        warehouseStock: Math.max(0, Number(r.vanStock) * 2),
        vanStock: Math.max(0, Number(r.vanStock)),
        image: '',
        lowStockThreshold: 5,
        description: `Loaded on Nasroute Van #1`,
      }));

      onBulkAddProducts(itemsToCreate);
      onClose();
    }
  };

  // ================= CSV Calculated Stats =================
  const filteredCsvRows = (parsedRows || []).filter((r) => {
    if (csvFilterStatus === 'matched' && r.status !== 'matched_existing') return false;
    if (csvFilterStatus === 'new' && r.status !== 'new_product') return false;
    if (csvFilterStatus === 'issues' && r.status !== 'invalid') return false;

    if (csvSearchQuery) {
      const q = csvSearchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.barcode.includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const csvMatchedCount = (parsedRows || []).filter((r) => r.status === 'matched_existing').length;
  const csvNewCount = (parsedRows || []).filter((r) => r.status === 'new_product').length;
  const csvInvalidCount = (parsedRows || []).filter((r) => r.status === 'invalid').length;

  const totalCsvUnits = (parsedRows || [])
    .filter((r) => r.status !== 'invalid')
    .reduce((sum, r) => sum + r.quantity, 0);

  const totalCsvValue = (parsedRows || [])
    .filter((r) => r.status !== 'invalid')
    .reduce((sum, r) => sum + r.quantity * (r.unitPrice || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-400/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">Bulk Load Van #1 (Qatar Route)</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Nasroute
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-medium">
                  <FileSpreadsheet className="w-3 h-3" /> CSV Enabled
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Bulk update van inventory via CSV spreadsheet file, manual adjust, or batch creation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('csv')}
              className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'csv'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Update with CSV File</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded-full border border-emerald-200">
                Easiest
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('adjust_existing')}
              className={`pb-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'adjust_existing'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Adjust Catalog ({products.length} items)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quick_bulk_create')}
              className={`pb-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'quick_bulk_create'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>Quick Add Multiple Items</span>
            </button>
          </div>

          {/* Quick Download Buttons on the right */}
          <div className="hidden sm:flex items-center gap-2 pb-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg shadow-2xs transition-colors"
              title="Download empty CSV template with standard headers"
            >
              <Download className="w-3 h-3 text-slate-500" />
              CSV Template
            </button>
            {products.length > 0 && (
              <button
                type="button"
                onClick={handleExportCurrentInventory}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg shadow-2xs transition-colors"
                title="Export current van stock as CSV to edit in Excel"
              >
                <Download className="w-3 h-3 text-slate-500" />
                Export Van CSV
              </button>
            )}
          </div>
        </div>

        {formError && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* ================= TAB 1: CSV FILE UPLOAD & UPDATE ================= */}
        {activeTab === 'csv' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Toolbar / Mode Selectors */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700">Van Update Mode:</span>
                <div className="inline-flex bg-slate-200/80 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setCsvMode('add')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      csvMode === 'add'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    + Add to Current Van Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setCsvMode('set')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      csvMode === 'set'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    = Set Exact Van Stock
                  </button>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-medium select-none ml-2">
                  <input
                    type="checkbox"
                    checked={updatePricesFromCsv}
                    onChange={(e) => setUpdatePricesFromCsv(e.target.checked)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Sync QAR Prices if provided</span>
                </label>
              </div>

              {/* Input Method Toggle */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setCsvInputMethod('file')}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    csvInputMethod === 'file' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setCsvInputMethod('paste')}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    csvInputMethod === 'paste' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" /> Paste Text / Excel
                </button>
              </div>
            </div>

            {/* Main Area: Upload Box or Table Preview */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!parsedRows ? (
                /* Empty state / Upload Box */
                <div className="space-y-4">
                  {csvInputMethod === 'file' ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                        isDragging
                          ? 'border-indigo-500 bg-indigo-50/70 scale-[0.99]'
                          : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".csv,.txt,.tsv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                        <FileUp className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        Drag and drop your CSV / Excel stock file here
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Supports standard CSV exported from Microsoft Excel, Google Sheets, or ERP systems. Columns can include{' '}
                        <code className="text-indigo-600 font-mono bg-indigo-50 px-1 py-0.5 rounded">
                          barcode, name, van_stock, price_qar
                        </code>
                      </p>

                      <div className="mt-4 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-4 h-4" />
                          Browse CSV File
                        </button>
                        <button
                          type="button"
                          onClick={handleLoadSampleTemplateData}
                          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5"
                        >
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          Load Sample Qatar Data
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Paste Raw Text Box */
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Paste columns copied from Excel, Google Sheets, or raw CSV:</span>
                        <button
                          type="button"
                          onClick={handleLoadSampleTemplateData}
                          className="text-indigo-600 hover:text-indigo-700 font-semibold"
                        >
                          Fill with Sample CSV
                        </button>
                      </div>
                      <textarea
                        rows={8}
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        placeholder={`barcode,name,van_stock,price_qar\n6291001122334,Almarai Fresh Milk 1L,24,6.50\n6291002233445,Rayyan Natural Water 500ml x 24,30,18.00`}
                        className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={!csvText.trim()}
                          onClick={() => handleProcessCsvText(csvText, 'pasted_data.csv')}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                        >
                          Parse & Preview CSV
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Help Card: Quick Columns Reference */}
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 text-xs">
                    <div className="flex items-start gap-2.5">
                      <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-900 block">
                          How CSV Loading works in Nasroute:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-emerald-800 text-[11px] mt-1">
                          <li>
                            <strong>Existing Barcodes:</strong> Instantly updates pieces inside Van #1 (and updates price if included).
                          </li>
                          <li>
                            <strong>New Barcodes:</strong> Automatically creates the product in your catalog AND loads it onto the van for driver scanning.
                          </li>
                          <li>
                            <strong>1-Click Workflow:</strong> Click "Export Van CSV" above to get your current stock, edit quantities in Excel, and upload right back!
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Parsed Table Preview */
                <div className="space-y-4">
                  {/* File & Metrics Banner */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <span>{csvFileName || 'CSV Stock Data'}</span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-mono px-2 py-0.5 rounded-full">
                            {parsedRows.length} rows detected
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="text-emerald-700 font-semibold">
                            ✓ {csvMatchedCount} In Catalog
                          </span>
                          <span>·</span>
                          <span className="text-indigo-700 font-semibold">
                            + {csvNewCount} New Items
                          </span>
                          {csvInvalidCount > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-rose-600 font-semibold">
                                ! {csvInvalidCount} Incomplete
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleClearCsv}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 transition-colors"
                      >
                        Upload Another CSV
                      </button>
                    </div>
                  </div>

                  {/* Filter and Search Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
                      <button
                        type="button"
                        onClick={() => setCsvFilterStatus('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          csvFilterStatus === 'all'
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All ({parsedRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCsvFilterStatus('matched')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          csvFilterStatus === 'matched'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        Matched ({csvMatchedCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCsvFilterStatus('new')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          csvFilterStatus === 'new'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        New Items ({csvNewCount})
                      </button>
                      {csvInvalidCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setCsvFilterStatus('issues')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            csvFilterStatus === 'issues'
                              ? 'bg-rose-600 text-white'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          Issues ({csvInvalidCount})
                        </button>
                      )}
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search items or barcode..."
                        value={csvSearchQuery}
                        onChange={(e) => setCsvSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Parsed Rows Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[38vh] overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-semibold sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Item Title & Barcode</th>
                          <th className="py-2.5 px-2 text-right">Price (QAR)</th>
                          <th className="py-2.5 px-3 text-right">Current Van</th>
                          <th className="py-2.5 px-3 text-center">
                            {csvMode === 'add' ? 'CSV +Add Qty' : 'CSV =Set Qty'}
                          </th>
                          <th className="py-2.5 px-3 text-right">Projected Total</th>
                          <th className="py-2.5 px-2 text-center w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCsvRows.map((row) => {
                          const currentStock = row.existingVanStock ?? 0;
                          const projectedTotal =
                            csvMode === 'set' ? row.quantity : currentStock + row.quantity;

                          return (
                            <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Status Badge */}
                              <td className="py-2 px-3 whitespace-nowrap">
                                {row.status === 'matched_existing' ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" /> In Catalog
                                  </span>
                                ) : row.status === 'new_product' ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                                    <Plus className="w-3 h-3" /> New Item
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                                    <AlertTriangle className="w-3 h-3" /> Issue
                                  </span>
                                )}
                              </td>

                              {/* Item Name & Barcode */}
                              <td className="py-2 px-3">
                                <div className="font-semibold text-slate-900">{row.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {row.barcode} · {row.category} ({row.unit})
                                </div>
                              </td>

                              {/* Unit Price */}
                              <td className="py-2 px-2 text-right font-mono font-medium text-slate-700 tabular-nums">
                                {formatQAR(row.unitPrice)}
                              </td>

                              {/* Current Van Stock */}
                              <td className="py-2 px-3 text-right font-mono text-slate-600 tabular-nums">
                                {row.status === 'matched_existing' ? (
                                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                                    {currentStock} {row.unit}s
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-normal">0 (new)</span>
                                )}
                              </td>

                              {/* Editable Quantity */}
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={row.quantity}
                                  onChange={(e) =>
                                    handleUpdateParsedRowQty(row.id, parseInt(e.target.value) || 0)
                                  }
                                  className="w-16 bg-white border border-slate-300 rounded px-1.5 py-1 text-center font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </td>

                              {/* Projected Total */}
                              <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700 tabular-nums">
                                {projectedTotal} {row.unit}s
                              </td>

                              {/* Actions */}
                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveParsedRow(row.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                  title="Exclude this row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom CSV Action Bar */}
            {parsedRows && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-500 block text-[11px]">
                      {csvMode === 'add' ? 'Total Pieces Adding:' : 'Total Pieces Setting:'}
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                      {csvMode === 'add' ? `+${totalCsvUnits}` : totalCsvUnits} pcs
                    </span>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <span className="text-slate-500 block text-[11px]">Value of Loaded Goods:</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm tabular-nums">
                      {formatQAR(totalCsvValue)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyCsvToVan}
                    className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                  >
                    <Check className="w-4 h-4" />
                    Apply CSV & Bulk Load Van #1
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: MANUAL ADJUST CATALOG ================= */}
        {activeTab === 'adjust_existing' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Quick Presets Bar */}
            {products.length > 0 && (
              <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap text-xs shrink-0">
                <div className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Quick Presets:</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => applyPresetAdd(10)}
                    className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[11px] font-semibold text-slate-700 shadow-2xs"
                  >
                    +10 to All
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetAdd(20)}
                    className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[11px] font-semibold text-slate-700 shadow-2xs"
                  >
                    +20 to All
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetAdd(50)}
                    className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[11px] font-semibold text-slate-700 shadow-2xs"
                  >
                    +50 to All
                  </button>
                  <button
                    type="button"
                    onClick={() => applySetExact(30)}
                    className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[11px] font-semibold text-indigo-700 shadow-2xs"
                  >
                    Set All to 30
                  </button>
                  <button
                    type="button"
                    onClick={applyReset}
                    className="px-2 py-1 text-slate-400 hover:text-slate-600 text-[11px]"
                  >
                    Clear 0
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleExistingSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 flex-1 overflow-y-auto">
                {products.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 space-y-3">
                    <p className="font-semibold text-slate-700 text-sm">No products in catalog yet.</p>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      Use the <strong>"Update with CSV File"</strong> tab above to import your spreadsheet in bulk, or quick add items!
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('csv')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs transition-colors"
                    >
                      Import via CSV Now
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-semibold sticky top-0 z-10">
                      <tr>
                        <th className="py-2 px-3">Item Details</th>
                        <th className="py-2 px-2 text-right">Price (QAR)</th>
                        <th className="py-2 px-3 text-right">Current Van Stock</th>
                        <th className="py-2 px-3 text-center">
                          {manualMode === 'add' ? 'Pieces to Add' : 'Set Exact Pieces'}
                        </th>
                        <th className="py-2 px-3 text-right">New Van Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p) => {
                        const inputVal = quantities[p.id] ?? 0;
                        const newVanTotal = manualMode === 'set' ? inputVal : p.vanStock + inputVal;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900">{p.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Barcode: {p.barcode} · {p.unit}
                              </div>
                            </td>

                            <td className="py-2.5 px-2 text-right font-mono font-medium text-slate-700 tabular-nums">
                              {formatQAR(p.unitPrice)}
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900 font-medium">
                              <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800">
                                {p.vanStock} pcs
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleQtyChange(p.id, Math.max(0, inputVal - 5))}
                                  disabled={inputVal <= 0}
                                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 text-xs font-bold transition-colors"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={inputVal}
                                  onChange={(e) => handleQtyChange(p.id, parseInt(e.target.value) || 0)}
                                  className="w-16 bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-center font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQtyChange(p.id, inputVal + 5)}
                                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 tabular-nums">
                              {newVanTotal} {p.unit}s
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer Summary & Confirm */}
              {products.length > 0 && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-slate-500 block text-[11px]">
                        {manualMode === 'add' ? 'Units Adding to Van:' : 'Total Van Stock:'}
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                        {manualMode === 'add' ? `+${totalUnitsCalculated}` : totalUnitsCalculated} pcs
                      </span>
                    </div>
                    <div className="border-l border-slate-200 pl-4">
                      <span className="text-slate-500 block text-[11px]">Total Van Inventory Value:</span>
                      <span className="font-mono font-bold text-emerald-700 text-sm tabular-nums">
                        {formatQAR(totalLoadedValue)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 sm:flex-none px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                    >
                      <Check className="w-4 h-4" />
                      Save & Update Van Stock
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ================= TAB 3: QUICK BULK CREATE ROWS ================= */}
        {activeTab === 'quick_bulk_create' && (
          <form onSubmit={handleSaveBulkNew} className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 flex-1 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Quickly add new items directly with barcodes, prices in QAR, and loaded pieces for Van #1:
                </p>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Row
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Item Name</th>
                      <th className="py-2 px-2">Barcode</th>
                      <th className="py-2 px-2 text-right">Price (QAR)</th>
                      <th className="py-2 px-2 text-right">Pcs in Van</th>
                      <th className="py-2 px-2 text-center">Unit</th>
                      <th className="py-2 px-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {newRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            placeholder="e.g. Almarai Fresh Milk 1L"
                            value={row.name}
                            onChange={(e) => handleUpdateRow(row.id, 'name', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            placeholder="629100..."
                            value={row.barcode}
                            onChange={(e) => handleUpdateRow(row.id, 'barcode', e.target.value)}
                            className="w-28 bg-slate-50 border border-slate-300 rounded px-2 py-1 font-mono text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={row.unitPrice}
                            onChange={(e) =>
                              handleUpdateRow(row.id, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-20 bg-slate-50 border border-slate-300 rounded px-2 py-1 font-mono text-xs text-right text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            value={row.vanStock}
                            onChange={(e) =>
                              handleUpdateRow(row.id, 'vanStock', parseInt(e.target.value) || 0)
                            }
                            className="w-16 bg-slate-50 border border-slate-300 rounded px-2 py-1 font-mono text-xs text-right text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <select
                            value={row.unit}
                            onChange={(e) => handleUpdateRow(row.id, 'unit', e.target.value)}
                            className="bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-900"
                          >
                            <option value="pc">pc</option>
                            <option value="box">box</option>
                            <option value="bottle">bottle</option>
                            <option value="carton">carton</option>
                            <option value="bag">bag</option>
                          </select>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            disabled={newRows.length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-xs shrink-0">
              <div className="text-slate-500">
                Ready to add <strong className="text-slate-900">{newRows.filter((r) => r.name.trim()).length}</strong> product(s) to Nasroute Van #1
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <Check className="w-4 h-4" />
                  Save & Load All to Van
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
