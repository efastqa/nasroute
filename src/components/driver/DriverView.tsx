import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Camera,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  ChevronDown,
  Plus,
  Minus,
  Sparkles,
  FileText,
  AlertCircle,
  Truck,
  ArrowRight,
  ShieldCheck,
  Building2,
  PackagePlus,
  Layers,
  RotateCcw,
  Sliders,
  FileSpreadsheet,
  Smartphone,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { CameraBarcodeScanner } from '../scanner/CameraBarcodeScanner';
import { SignaturePad } from './SignaturePad';
import { DeliveryReceiptModal } from '../common/DeliveryReceiptModal';
import { PageSetupModal } from '../common/PageSetupModal';
import { ProductModal } from '../manager/ProductModal';
import { OutletModal } from '../manager/OutletModal';
import { BulkLoadVanModal } from '../manager/BulkLoadVanModal';
import { Product, Outlet } from '../../types';
import { formatQAR } from '../../utils/format';

export const DriverView: React.FC = () => {
  const {
    products,
    outlets,
    activeOutletId,
    setActiveOutletId,
    manualAdjustScanQty,
    completeDelivery,
    addProduct,
    addOutlet,
    bulkLoadVan,
    bulkAddProducts,
  } = useInventory();

  const [scannerOpen, setScannerOpen] = useState(true);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showPageSetupModal, setShowPageSetupModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddOutletModal, setShowAddOutletModal] = useState(false);
  const [showBulkLoadModal, setShowBulkLoadModal] = useState(false);
  const [bulkLoadTab, setBulkLoadTab] = useState<'csv' | 'adjust_existing' | 'quick_bulk_create'>('csv');
  const [receiverName, setReceiverName] = useState('');
  const [driverNotes, setDriverNotes] = useState('');
  const [capturedSignature, setCapturedSignature] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);

  // Fallback outlet if none exists yet so driver is never blocked
  const fallbackOutlet: Outlet = {
    id: 'outlet-doha-default',
    name: 'Doha Express Drop-off #1',
    address: 'Zone 22, Doha, Qatar',
    contactPerson: 'Store Manager',
    phone: '+974 4400 1234',
    orderNumber: 'ORD-DOHA-01',
    status: 'in_progress',
    scheduledTime: '10:00 AM',
    items: [],
  };

  const activeOutlet: Outlet = outlets.find((o) => o.id === activeOutletId) || outlets[0] || fallbackOutlet;

  const getProduct = (productId: string) => products.find((p) => p.id === productId);

  // Compute stats for Van #1
  const totalVanStockUnits = products.reduce((sum, p) => sum + p.vanStock, 0);
  const totalVanStockValue = products.reduce((sum, p) => sum + p.vanStock * p.unitPrice, 0);

  // Compute stats for active outlet
  const totalExpectedItems = activeOutlet.items.reduce((s, it) => s + it.expectedQty, 0);
  const totalScannedItems = activeOutlet.items.reduce((s, it) => s + it.scannedQty, 0);
  const totalInvoiceValue = activeOutlet.items.reduce(
    (s, it) => s + it.scannedQty * it.unitPrice,
    0
  );
  const isFulfilled = totalScannedItems >= totalExpectedItems && totalExpectedItems > 0;

  const handleOpenSignModal = () => {
    setReceiverName(activeOutlet.contactPerson || '');
    setCapturedSignature(null);
    setDriverNotes('');
    setSignatureError(null);
    setShowSignModal(true);
  };

  const handleFinishDelivery = () => {
    if (!capturedSignature) {
      setSignatureError('Please capture receiver signature before completing.');
      return;
    }

    // If active outlet was the fallback and not yet in outlets state, add it first
    if (!outlets.some((o) => o.id === activeOutlet.id)) {
      addOutlet({
        name: activeOutlet.name,
        address: activeOutlet.address,
        contactPerson: receiverName || activeOutlet.contactPerson,
        phone: activeOutlet.phone,
        orderNumber: activeOutlet.orderNumber,
        status: 'delivered',
        scheduledTime: activeOutlet.scheduledTime,
        deliveredAt: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        receivedBy: receiverName || activeOutlet.contactPerson,
        signature: capturedSignature,
        driverNotes,
        items: activeOutlet.items,
      });
    } else {
      completeDelivery({
        outletId: activeOutlet.id,
        receivedBy: receiverName || activeOutlet.contactPerson,
        signature: capturedSignature,
        driverNotes,
      });
    }

    setShowSignModal(false);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const handleCreateDefaultOutlet = () => {
    addOutlet({
      name: 'Express Store - Doha Al Sadd',
      address: 'Al Sadd St, Doha, Qatar',
      contactPerson: 'Tariq Al-Mansoor',
      phone: '+974 4455 6789',
      orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'in_progress',
      scheduledTime: '11:00 AM',
      items: products.map((p) => ({
        productId: p.id,
        expectedQty: 5,
        scannedQty: 0,
        unitPrice: p.unitPrice,
      })),
    });
  };

  return (
    <div className="max-w-2xl mx-auto pb-24 px-3 sm:px-4 pt-3 space-y-4">
      {/* Top Banner: Van #1 Fleet Details */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-800">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
              #1
            </span>
            <div>
              <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider font-semibold">
                Nasroute Active Driver
              </div>
              <h2 className="text-sm font-bold text-white leading-tight">
                Delivery Van #1 · Qatar Route
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPageSetupModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all active:scale-95"
              title="Phone Device & Thermal Printer Setup"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Phone Settings</span>
            </button>

            <button
              onClick={() => {
                setBulkLoadTab('csv');
                setShowBulkLoadModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm border border-emerald-500/40 transition-all active:scale-95"
              title="Bulk update van stock using CSV file"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span>CSV Load</span>
            </button>

            <button
              onClick={() => {
                setBulkLoadTab('adjust_existing');
                setShowBulkLoadModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Bulk Load</span>
            </button>
          </div>
        </div>

        {/* Onboard Van Stock Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block">Total Pieces in Van:</span>
            <div className="font-mono font-bold text-base text-white mt-0.5">
              {totalVanStockUnits} pcs{' '}
              <span className="text-[11px] text-slate-400 font-sans font-normal">
                ({products.length} catalog items)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-right">
            <span className="text-[11px] text-slate-400 block">Total Van Inventory Value:</span>
            <div className="font-mono font-bold text-base text-emerald-400 mt-0.5">
              {formatQAR(totalVanStockValue)}
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Camera Scanner Section - Always Available! */}
      <div>
        {scannerOpen ? (
          <CameraBarcodeScanner
            outletId={activeOutlet.id}
            onScanSuccess={() => {}}
            onClose={() => setScannerOpen(false)}
          />
        ) : (
          <button
            onClick={() => setScannerOpen(true)}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Open Phone Barcode Scanner</span>
          </button>
        )}
      </div>

      {/* Delivery Destination Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <MapPin className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-indigo-600">
                Delivery Destination
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Current Stop Information
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddOutletModal(true)}
              className="text-[11px] text-indigo-600 font-semibold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              New Stop
            </button>
          </div>
        </div>

        {/* Outlet Switcher Dropdown */}
        {outlets.length > 0 ? (
          <div className="relative mb-3">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Select Destination Outlet / Store:
            </label>
            <div className="relative">
              <select
                value={activeOutlet.id}
                onChange={(e) => setActiveOutletId(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-9 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                {outlets.map((o, idx) => (
                  <option key={o.id} value={o.id}>
                    Stop {idx + 1}: {o.name} {o.status === 'delivered' ? '✓ (Delivered)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        ) : (
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl mb-3 flex items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold text-indigo-950 block">Quick Walk-in / Unscheduled Stop</span>
              <span className="text-indigo-700 text-[11px]">
                Deliveries will automatically log to Doha Express Stop #1
              </span>
            </div>
            <button
              onClick={handleCreateDefaultOutlet}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs whitespace-nowrap transition-colors"
            >
              + Create Stop
            </button>
          </div>
        )}

        {/* Outlet Destination Card Details */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="space-y-1">
            <div className="font-semibold text-slate-900 text-sm">{activeOutlet.name}</div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{activeOutlet.address}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {activeOutlet.phone}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Window: {activeOutlet.scheduledTime}
              </span>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                activeOutlet.status === 'delivered'
                  ? 'bg-emerald-100 text-emerald-800'
                  : activeOutlet.status === 'in_progress'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {activeOutlet.status === 'delivered'
                ? 'Delivered'
                : activeOutlet.status === 'in_progress'
                ? 'In Progress'
                : 'Pending Scan'}
            </span>
            <span className="font-mono text-[11px] text-slate-500 mt-1">
              Ref: {activeOutlet.orderNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Items Delivered at this Outlet */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900">
              Delivered Items at this Stop
            </h3>
            <div className="text-[11px] text-slate-500">
              Scan barcode above to instantly add items and update prices
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-slate-900 tabular-nums">
              {totalScannedItems} Items Delivered
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 font-mono tabular-nums">
              {formatQAR(totalInvoiceValue)} Total
            </div>
          </div>
        </div>

        {/* Item Rows */}
        {activeOutlet.items.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-700">No items delivered to this stop yet.</p>
            <p className="text-[11px] text-slate-400">
              Scan any product with the camera above. The system will display the van pieces and QAR price, then automatically add it here!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeOutlet.items.map((item) => {
              const product = getProduct(item.productId);
              if (!product) return null;

              const isItemComplete = item.scannedQty >= item.expectedQty && item.expectedQty > 0;

              return (
                <div
                  key={item.productId}
                  className={`p-3 sm:p-4 transition-colors ${
                    isItemComplete ? 'bg-emerald-50/30' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 shrink-0 relative flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Truck className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h4 className="font-semibold text-xs sm:text-sm text-slate-900 leading-tight">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono text-slate-400">{product.barcode}</span>
                            <span>·</span>
                            <span className="font-semibold text-slate-900 tabular-nums">
                              {formatQAR(item.unitPrice)} / {product.unit}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                            {formatQAR(item.scannedQty * item.unitPrice)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Van: {product.vanStock} pcs left
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-600 font-medium">
                          Delivered:{' '}
                          <span className="font-mono font-bold text-slate-900">
                            {item.scannedQty} {product.unit}(s)
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 bg-slate-100 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              manualAdjustScanQty(activeOutlet.id, item.productId, item.scannedQty - 1)
                            }
                            disabled={item.scannedQty <= 0 || activeOutlet.status === 'delivered'}
                            className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Decrease 1"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold font-mono text-slate-900 tabular-nums">
                            {item.scannedQty}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              manualAdjustScanQty(activeOutlet.id, item.productId, item.scannedQty + 1)
                            }
                            disabled={product.vanStock <= 0 || activeOutlet.status === 'delivered'}
                            className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Add 1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Outlet Bottom Actions */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {totalScannedItems > 0 ? (
              <span>
                {totalScannedItems} piece(s) scanned. Ready for receiver confirmation.
              </span>
            ) : (
              <span>Scan products using your phone camera to add to this stop.</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeOutlet.status === 'delivered' ? (
              <button
                onClick={() => setShowReceiptModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <FileText className="w-4 h-4" />
                View Delivery Receipt
              </button>
            ) : (
              <button
                onClick={handleOpenSignModal}
                disabled={totalScannedItems <= 0}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
              >
                <ShieldCheck className="w-4 h-4" />
                Complete Delivery & Sign ({formatQAR(totalInvoiceValue)})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Signature & Handover Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Outlet Handover & Sign
                </h3>
                <p className="text-xs text-slate-500">
                  {activeOutlet.name} · {totalScannedItems} items · {formatQAR(totalInvoiceValue)}
                </p>
              </div>
              <button
                onClick={() => setShowSignModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-medium"
              >
                Close
              </button>
            </div>

            {signatureError && (
              <div className="p-2 mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                {signatureError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Received by (Store Manager / Clerk Name):
                </label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="e.g. Tariq Al-Mansoor"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Driver Drop-off Notes (optional):
                </label>
                <input
                  type="text"
                  value={driverNotes}
                  onChange={(e) => setDriverNotes(e.target.value)}
                  placeholder="e.g. Items checked and handed over, invoice copy given"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Digital Signature Canvas */}
              {!capturedSignature ? (
                <SignaturePad
                  onSave={(dataUrl) => {
                    setCapturedSignature(dataUrl);
                    setSignatureError(null);
                  }}
                  onCancel={() => setShowSignModal(false)}
                />
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Signature captured
                    </span>
                    <button
                      type="button"
                      onClick={() => setCapturedSignature(null)}
                      className="text-indigo-600 hover:underline text-[11px]"
                    >
                      Re-sign
                    </button>
                  </div>
                  <img
                    src={capturedSignature}
                    alt="Signature"
                    className="max-h-20 max-w-full mx-auto border border-slate-200 rounded bg-white p-1"
                  />
                  <button
                    onClick={handleFinishDelivery}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all"
                  >
                    Confirm & Finalize Delivery
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Load Van Modal */}
      {showBulkLoadModal && (
        <BulkLoadVanModal
          products={products}
          initialTab={bulkLoadTab}
          onConfirmBulkLoad={(transfers) => {
            bulkLoadVan(transfers);
            setShowBulkLoadModal(false);
          }}
          onBulkAddProducts={(items) => {
            bulkAddProducts(items);
            setShowBulkLoadModal(false);
          }}
          onClose={() => setShowBulkLoadModal(false)}
        />
      )}

      {/* Delivery Receipt Modal */}
      {showReceiptModal && (
        <DeliveryReceiptModal
          outlet={activeOutlet}
          products={products}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* Outlet Modal */}
      {showAddOutletModal && (
        <OutletModal
          products={products}
          onSave={(outletData) => {
            addOutlet(outletData);
            setShowAddOutletModal(false);
          }}
          onClose={() => setShowAddOutletModal(false)}
        />
      )}

      {/* Product Modal */}
      {showAddProductModal && (
        <ProductModal
          onSave={(prodData) => {
            addProduct(prodData);
            setShowAddProductModal(false);
          }}
          onClose={() => setShowAddProductModal(false)}
        />
      )}

      {/* Page Setup Configuration Modal */}
      {showPageSetupModal && (
        <PageSetupModal
          initialTab="phone"
          onClose={() => setShowPageSetupModal(false)}
        />
      )}
    </div>
  );
};
