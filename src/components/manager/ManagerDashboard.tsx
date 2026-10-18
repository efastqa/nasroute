import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  DollarSign,
  Truck,
  Building2,
  Clock,
  Printer,
  Edit2,
  Trash2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Barcode,
  Layers,
  Sparkles,
  QrCode,
  PackagePlus,
  RotateCcw,
  Sliders,
  FileSpreadsheet,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Product, Outlet } from '../../types';
import { ProductModal } from './ProductModal';
import { OutletModal } from './OutletModal';
import { BarcodePrintSheet } from './BarcodePrintSheet';
import { BulkLoadVanModal } from './BulkLoadVanModal';
import { DeliveryReceiptModal } from '../common/DeliveryReceiptModal';
import { PageSetupModal } from '../common/PageSetupModal';
import { formatQAR } from '../../utils/format';

export const ManagerDashboard: React.FC = () => {
  const {
    products,
    outlets,
    scanLogs,
    updateProduct,
    addProduct,
    deleteProduct,
    addOutlet,
    updateOutlet,
    deleteOutlet,
    recordScan,
    loadSampleData,
    bulkLoadVan,
    bulkAddProducts,
    clearAllData,
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [isAddOutletOpen, setIsAddOutletOpen] = useState(false);
  const [isBarcodeSheetOpen, setIsBarcodeSheetOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [bulkLoadInitialTab, setBulkLoadInitialTab] = useState<'csv' | 'adjust_existing' | 'quick_bulk_create'>('csv');
  const [isPageSetupOpen, setIsPageSetupOpen] = useState(false);
  const [viewingReceiptOutlet, setViewingReceiptOutlet] = useState<Outlet | null>(null);
  const [quickEditPriceId, setQuickEditPriceId] = useState<string | null>(null);
  const [quickPriceVal, setQuickPriceVal] = useState<string>('');

  // Categories list
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Analytics Metrics
  const totalCatalogSKUs = products.length;
  const totalVanStockUnits = products.reduce((sum, p) => sum + p.vanStock, 0);
  const totalVanStockValue = products.reduce((sum, p) => sum + p.vanStock * p.unitPrice, 0);

  const totalDeliveredRevenue = outlets.reduce((sum, o) => {
    return (
      sum +
      o.items.reduce((itemSum, item) => itemSum + item.scannedQty * item.unitPrice, 0)
    );
  }, 0);

  const completedOutletsCount = outlets.filter((o) => o.status === 'delivered').length;

  const handleStartQuickEditPrice = (product: Product) => {
    setQuickEditPriceId(product.id);
    setQuickPriceVal(product.unitPrice.toString());
  };

  const handleSaveQuickPrice = (product: Product) => {
    const parsed = parseFloat(quickPriceVal);
    if (!isNaN(parsed) && parsed >= 0) {
      updateProduct({ ...product, unitPrice: parsed });
    }
    setQuickEditPriceId(null);
  };

  const handleTransferStock = (productId: string, quantity: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    updateProduct({
      ...prod,
      warehouseStock: prod.warehouseStock - quantity,
      vanStock: prod.vanStock + quantity,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Van Fleet Inventory</span>
            <Truck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {totalVanStockUnits} <span className="text-sm font-normal text-slate-500 font-sans">units</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
            <span>Van Value: {formatQAR(totalVanStockValue)}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Real-Time Drop Revenue (Qatar)</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums text-emerald-700">
            {formatQAR(totalDeliveredRevenue)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Updated live in QAR</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Delivery Route Stops</span>
            <Building2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {completedOutletsCount} / {outlets.length} <span className="text-sm font-normal text-slate-500 font-sans">Done</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>{outlets.filter((o) => o.status === 'in_progress').length} currently in progress</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Master Product Catalog</span>
            <Package className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {totalCatalogSKUs} <span className="text-sm font-normal text-slate-500 font-sans">Items</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Price & stock editable anytime</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Inventory Management & Outlets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Master Inventory Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          {/* Table Header Controls */}
          <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Master Inventory & Price List
                </h2>
                <p className="text-xs text-slate-500">
                  Adjust unit prices, warehouse inventory, and van stocks. Changes sync instantly to the driver.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {products.length > 0 && (
                  <button
                    onClick={() => setIsBarcodeSheetOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                  >
                    <Barcode className="w-3.5 h-3.5 text-slate-600" />
                    Barcode Sheet
                  </button>
                )}

                <button
                  onClick={() => setIsPageSetupOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                  title="Configure delivery order paper sizes, thermal roll setup, and invoice headers"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  Page Setup
                </button>

                <button
                  onClick={() => {
                    setBulkLoadInitialTab('csv');
                    setIsTransferModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition-colors shadow-2xs"
                  title="Upload CSV spreadsheet to instantly bulk load van inventory"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Load Van via CSV</span>
                  <span className="text-[9px] bg-emerald-200 text-emerald-800 px-1 py-0.2 rounded font-mono font-bold">
                    FAST
                  </span>
                </button>

                <button
                  onClick={() => {
                    setBulkLoadInitialTab('adjust_existing');
                    setIsTransferModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors shadow-2xs"
                >
                  <Truck className="w-4 h-4 text-indigo-600" />
                  Bulk Load Van
                </button>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Product
                </button>
              </div>
            </div>

            {/* Search and Category Filter */}
            {products.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, SKU, or barcode..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Table Container */}
          {products.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">
                No Products Added Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Your catalog is clean and empty. Click below to add your first product with its barcode, wholesale/delivery price, and inventory.
              </p>
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
                <button
                  onClick={() => setIsTransferModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Truck className="w-4 h-4" />
                  Bulk Load / Add to Van
                </button>
                <button
                  onClick={loadSampleData}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Load Sample Items
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Item Details</th>
                    <th className="py-2.5 px-3">Barcode / SKU</th>
                    <th className="py-2.5 px-3 text-right">Delivery Price (QAR)</th>
                    <th className="py-2.5 px-3 text-right">Van Stock</th>
                    <th className="py-2.5 px-3 text-right">Warehouse</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => {
                    const isLowVanStock = product.vanStock <= product.lowStockThreshold;

                    return (
                      <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Product Thumbnail & Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 truncate">
                                {product.name}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                <span>{product.category}</span>
                                <span>·</span>
                                <span>per {product.unit}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Barcode & SKU */}
                        <td className="py-3 px-3 font-mono text-[11px]">
                          <div className="text-slate-900 font-medium">{product.barcode}</div>
                          <div className="text-slate-400 text-[10px]">SKU: {product.sku}</div>
                        </td>

                        {/* Unit Price (Quick Editable) */}
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {quickEditPriceId === product.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-[10px] text-slate-400 font-mono">QAR</span>
                              <input
                                type="number"
                                step="0.01"
                                autoFocus
                                value={quickPriceVal}
                                onChange={(e) => setQuickPriceVal(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveQuickPrice(product);
                                  if (e.key === 'Escape') setQuickEditPriceId(null);
                                }}
                                className="w-16 bg-white border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-right font-bold text-slate-900 focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveQuickPrice(product)}
                                className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-sans"
                              >
                                OK
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartQuickEditPrice(product)}
                              className="group inline-flex items-center gap-1 font-bold text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer"
                              title="Click to edit price"
                            >
                              <span>{formatQAR(product.unitPrice)}</span>
                              <Edit2 className="w-2.5 h-2.5 text-slate-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          )}
                          {product.retailPrice && (
                            <div className="text-[10px] text-slate-400 font-sans">
                              Retail: {formatQAR(product.retailPrice)}
                            </div>
                          )}
                        </td>

                        {/* Van Stock */}
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          <span
                            className={`font-semibold ${
                              product.vanStock === 0
                                ? 'text-red-600'
                                : isLowVanStock
                                ? 'text-amber-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {product.vanStock} {product.unit}s
                          </span>
                          {isLowVanStock && (
                            <span className="block text-[9px] text-amber-600 font-sans font-medium">
                              Low Stock
                            </span>
                          )}
                        </td>

                        {/* Warehouse Stock */}
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                          {product.warehouseStock} {product.unit}s
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingProduct(product)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="Edit Product & Prices"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Remove ${product.name} from inventory?`)) {
                                  deleteProduct(product.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredProducts.length === 0 && products.length > 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              No products found matching your search.
            </div>
          )}
        </div>

        {/* Right Col: Outlets & Live Scan Activity */}
        <div className="space-y-6">
          {/* Outlet Delivery Route Progress */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Outlet Route Status
                </h3>
                <p className="text-[11px] text-slate-500">
                  Real-time delivery progress per stop
                </p>
              </div>

              <button
                onClick={() => setIsAddOutletOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Outlet
              </button>
            </div>

            {outlets.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-800 mb-1">
                  No Delivery Outlets Yet
                </div>
                <div className="text-[11px] text-slate-400 mb-3">
                  Create customer stores/outlets to assign delivery drops.
                </div>
                <button
                  onClick={() => setIsAddOutletOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  + Add First Outlet
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {outlets.map((outlet, idx) => {
                  const totalExpected = outlet.items.reduce((s, it) => s + it.expectedQty, 0);
                  const totalScanned = outlet.items.reduce((s, it) => s + it.scannedQty, 0);
                  const orderValue = outlet.items.reduce(
                    (s, it) => s + it.scannedQty * it.unitPrice,
                    0
                  );
                  const pct = totalExpected > 0 ? Math.min(100, Math.round((totalScanned / totalExpected) * 100)) : 0;

                  return (
                    <div
                      key={outlet.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors text-xs"
                    >
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-slate-400">#{idx + 1}</span>
                            <span className="truncate">{outlet.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Window: {outlet.scheduledTime} · {outlet.orderNumber}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditingOutlet(outlet)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded"
                            title="Edit Outlet"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove outlet ${outlet.name}?`)) {
                                deleteOutlet(outlet.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            title="Delete Outlet"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold tracking-wide ml-1 ${
                              outlet.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : outlet.status === 'in_progress'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {outlet.status === 'delivered'
                              ? 'Delivered'
                              : outlet.status === 'in_progress'
                              ? 'Scanning'
                              : 'Pending'}
                          </span>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="space-y-1 mb-2">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Items: {totalScanned} / {totalExpected}</span>
                          <span className="font-mono font-semibold text-slate-900 tabular-nums">
                            {formatQAR(orderValue)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              outlet.status === 'delivered' ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Receipt or details trigger */}
                      {outlet.status === 'delivered' && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                          <span className="text-emerald-700 font-medium truncate">
                            Signed by {outlet.receivedBy || 'Manager'}
                          </span>
                          <button
                            onClick={() => setViewingReceiptOutlet(outlet)}
                            className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline shrink-0"
                          >
                            View Invoice
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Driver Scan Activity Stream */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Live Scanner Activity
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {scanLogs.length} events
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {scanLogs.slice(0, 15).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      +{log.quantityDelta} {log.productName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {log.outletName} · <span className="font-mono">{log.timestamp}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <div className="font-bold text-emerald-700 tabular-nums">
                      +{formatQAR(log.totalPrice)}
                    </div>
                    <div className="text-[10px] text-slate-400 tabular-nums">
                      Van: {log.vanStockRemaining} left
                    </div>
                  </div>
                </div>
              ))}

              {scanLogs.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                  Awaiting driver scans... Activity appears here in real-time.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <ProductModal
          product={editingProduct}
          onSave={(updated) => updateProduct(updated as Product)}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <ProductModal
          onSave={(newProd) => addProduct(newProd as Omit<Product, 'id'>)}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* Add / Edit Outlet Modal */}
      {(isAddOutletOpen || editingOutlet) && (
        <OutletModal
          outlet={editingOutlet}
          products={products}
          onSave={(outletData) => {
            if (editingOutlet) {
              updateOutlet(outletData as Outlet);
              setEditingOutlet(null);
            } else {
              addOutlet(outletData);
              setIsAddOutletOpen(false);
            }
          }}
          onClose={() => {
            setIsAddOutletOpen(false);
            setEditingOutlet(null);
          }}
        />
      )}

      {/* Printable Barcodes Sheet */}
      {isBarcodeSheetOpen && (
        <BarcodePrintSheet
          products={products}
          onClose={() => setIsBarcodeSheetOpen(false)}
          onSimulateScan={(barcode) => {
            recordScan({
              barcode,
              outletId: outlets[0]?.id || '',
              quantity: 1,
              source: 'quick_select',
            });
          }}
        />
      )}

      {/* Bulk Load Van Modal */}
      {isTransferModalOpen && (
        <BulkLoadVanModal
          products={products}
          initialTab={bulkLoadInitialTab}
          onConfirmBulkLoad={(transfers) => bulkLoadVan(transfers)}
          onBulkAddProducts={(items) => bulkAddProducts(items)}
          onClose={() => setIsTransferModalOpen(false)}
        />
      )}

      {/* Viewing Receipt Modal */}
      {viewingReceiptOutlet && (
        <DeliveryReceiptModal
          outlet={viewingReceiptOutlet}
          products={products}
          onClose={() => setViewingReceiptOutlet(null)}
        />
      )}

      {/* Page Setup Configuration Modal */}
      {isPageSetupOpen && (
        <PageSetupModal onClose={() => setIsPageSetupOpen(false)} />
      )}
    </div>
  );
};
