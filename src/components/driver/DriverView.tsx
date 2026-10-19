import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Camera,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
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
  Eye,
  EyeOff,
  Navigation,
  MessageCircle,
  Search,
  Zap,
  Volume2,
  VolumeX,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
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
import { sound } from '../../utils/audio';

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
    pageSetup,
    updatePageSetup,
  } = useInventory();

  const phoneSettings = pageSetup.phoneDevice ?? {
    hideAttached: true,
    fastScanMode: true,
    voiceFeedback: false,
  };
  const hideAttached = phoneSettings.hideAttached;

  const [scannerOpen, setScannerOpen] = useState(true);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showPageSetupModal, setShowPageSetupModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddOutletModal, setShowAddOutletModal] = useState(false);
  const [showBulkLoadModal, setShowBulkLoadModal] = useState(false);
  const [showVanFinderModal, setShowVanFinderModal] = useState(false);
  const [showDeliveredItemsDrawer, setShowDeliveredItemsDrawer] = useState(false);
  const [expandVanBanner, setExpandVanBanner] = useState(false);
  const [vanSearchQuery, setVanSearchQuery] = useState('');

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
  const currentOutletIndex = outlets.findIndex((o) => o.id === activeOutlet.id);

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

  const toggleHideAttached = () => {
    updatePageSetup({
      phoneDevice: {
        ...phoneSettings,
        hideAttached: !hideAttached,
      },
    });
  };

  const toggleFastScan = () => {
    updatePageSetup({
      phoneDevice: {
        ...phoneSettings,
        fastScanMode: !phoneSettings.fastScanMode,
      },
    });
  };

  const toggleVoiceFeedback = () => {
    const next = !phoneSettings.voiceFeedback;
    updatePageSetup({
      phoneDevice: {
        ...phoneSettings,
        voiceFeedback: next,
      },
    });
    if (next) {
      sound.speak('Voice assistant active');
    }
  };

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
      address: 'Al Sadd St, Zone 38, Doha, Qatar',
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

  const goToNextStop = () => {
    if (outlets.length > 1 && currentOutletIndex < outlets.length - 1) {
      setActiveOutletId(outlets[currentOutletIndex + 1].id);
    }
  };

  const goToPrevStop = () => {
    if (outlets.length > 1 && currentOutletIndex > 0) {
      setActiveOutletId(outlets[currentOutletIndex - 1].id);
    }
  };

  // 1-Tap Google Maps Navigation URL
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    activeOutlet.address || `${activeOutlet.name}, Doha, Qatar`
  )}`;

  // 1-Tap WhatsApp Message URL
  const cleanPhone = (activeOutlet.phone || '').replace(/[^0-9]/g, '');
  const whatsAppText = encodeURIComponent(
    `Hello ${activeOutlet.contactPerson || 'Store Manager'}, Nasroute Van Delivery has arrived with ${totalScannedItems} items (${formatQAR(totalInvoiceValue)}). Order Ref: ${activeOutlet.orderNumber}.`
  );
  const whatsAppUrl = `https://wa.me/${cleanPhone ? (cleanPhone.startsWith('974') ? cleanPhone : `974${cleanPhone}`) : '97444001234'}?text=${whatsAppText}`;

  // Filtered van items for quick search
  const filteredVanItems = products.filter(
    (p) =>
      p.name.toLowerCase().includes(vanSearchQuery.toLowerCase()) ||
      p.barcode.includes(vanSearchQuery) ||
      p.sku.toLowerCase().includes(vanSearchQuery.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto pb-28 px-2.5 sm:px-4 pt-2.5 space-y-3">
      {/* ================= DRIVER TOP CONTROL PILL: HIDE ATTACHED TOGGLE ================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 text-white shadow-md flex items-center justify-between gap-2 flex-wrap">
        {/* Hide Attached / Show Attached Button (Exact User Request) */}
        <button
          type="button"
          onClick={toggleHideAttached}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
            hideAttached
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
          }`}
          title="Toggle whether attached panels (stop info, item lists, banners) are hidden"
        >
          {hideAttached ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Hide Attached (Active)</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>Show Attached Details</span>
            </>
          )}
        </button>

        {/* Quick Driver Tools */}
        <div className="flex items-center gap-1.5">
          {/* Quick Van Stock Finder */}
          <button
            type="button"
            onClick={() => setShowVanFinderModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            title="Search van items and stock levels"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Find Van Stock</span>
          </button>

          {/* Rapid Auto-Scan */}
          <button
            type="button"
            onClick={toggleFastScan}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
              phoneSettings.fastScanMode
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Rapid Scan: Auto-adds 1 piece on scan"
          >
            <Zap className={`w-3.5 h-3.5 ${phoneSettings.fastScanMode ? 'text-amber-300' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Rapid</span>
          </button>

          {/* Voice Feedback */}
          <button
            type="button"
            onClick={toggleVoiceFeedback}
            className={`p-1.5 rounded-xl transition-colors ${
              phoneSettings.voiceFeedback
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title={phoneSettings.voiceFeedback ? 'Voice readout active' : 'Turn voice readout on'}
          >
            {phoneSettings.voiceFeedback ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Phone Settings */}
          <button
            onClick={() => setShowPageSetupModal(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all active:scale-95"
            title="Phone & Scanner Settings"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* ================= TOP ATTACHED BANNER (COLLAPSIBLE / HIDDEN) ================= */}
      {hideAttached && !expandVanBanner ? (
        // Minimalist Single-Row Van Strip when attached is hidden
        <div className="bg-slate-900/90 text-white rounded-xl px-3 py-2 border border-slate-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0">
              #1
            </span>
            <span className="font-semibold text-slate-200 truncate">
              Van #1: <strong className="text-white font-mono">{totalVanStockUnits} pcs</strong> ({formatQAR(totalVanStockValue)})
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setBulkLoadTab('csv');
                setShowBulkLoadModal(true);
              }}
              className="text-[11px] text-emerald-400 hover:underline font-semibold flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => setExpandVanBanner(true)}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-0.5"
            >
              <span>More</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        // Full Van Fleet Banner
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-800 animate-in fade-in duration-150">
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

            <div className="flex items-center gap-1.5">
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
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Bulk Load</span>
              </button>

              {hideAttached && (
                <button
                  onClick={() => setExpandVanBanner(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                  title="Collapse van banner"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              )}
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
      )}

      {/* ================= ACTIVE STOP HEADER WITH 1-TAP DRIVER SHORTCUTS ================= */}
      {/* Made ultra-clean for driver: 1-tap navigation, 1-tap phone call, 1-tap WhatsApp */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
              {currentOutletIndex >= 0 ? currentOutletIndex + 1 : 1}
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                Current Stop {outlets.length > 0 ? `(${currentOutletIndex + 1} of ${outlets.length})` : ''}
              </div>
              <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">
                {activeOutlet.name}
              </h3>
            </div>
          </div>

          {/* 1-Tap Prev / Next Stop Stepper */}
          {outlets.length > 1 && (
            <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={goToPrevStop}
                disabled={currentOutletIndex <= 0}
                className="p-1 rounded text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous Stop"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono font-bold px-1 text-slate-700">
                {currentOutletIndex + 1}/{outlets.length}
              </span>
              <button
                type="button"
                onClick={goToNextStop}
                disabled={currentOutletIndex >= outlets.length - 1}
                className="p-1 rounded text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next Stop"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Address & Driver Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 min-w-0 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate text-[11px]">{activeOutlet.address}</span>
          </div>

          {/* DRIVER SHORTCUT BUTTONS: GPS Maps, Phone Call, WhatsApp */}
          <div className="flex items-center gap-1 shrink-0">
            {/* GPS Google Maps */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-bold rounded-lg border border-sky-200 transition-colors"
              title="Navigate in Google Maps"
            >
              <Navigation className="w-3 h-3 text-sky-600" />
              <span>Maps</span>
            </a>

            {/* Direct Phone Call */}
            {activeOutlet.phone && (
              <a
                href={`tel:${activeOutlet.phone}`}
                className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200 transition-colors"
                title={`Call ${activeOutlet.contactPerson || 'Store'}`}
              >
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>Call</span>
              </a>
            )}

            {/* WhatsApp */}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg transition-colors"
              title="Send WhatsApp Delivery Update"
            >
              <MessageCircle className="w-3 h-3" />
              <span className="hidden xs:inline">WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* ================= BARCODE CAMERA SCANNER SECTION ================= */}
      {/* In Hide Attached mode, this takes main focus and displays clean HUD */}
      <div>
        {scannerOpen ? (
          <CameraBarcodeScanner
            outletId={activeOutlet.id}
            hideAttached={hideAttached}
            onToggleHideAttached={toggleHideAttached}
            onScanSuccess={() => {}}
            onClose={() => setScannerOpen(false)}
          />
        ) : (
          <button
            onClick={() => setScannerOpen(true)}
            className="w-full py-4 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] border border-slate-700"
          >
            <Camera className="w-5 h-5 text-emerald-400" />
            <span>Open Driver Barcode Scanner</span>
          </button>
        )}
      </div>

      {/* ================= ATTACHED DELIVERED ITEMS LIST ================= */}
      {/* Kept hidden or collapsed in "Hide Attached" mode, visible in standard mode */}
      {!hideAttached ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-in fade-in duration-150">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                Delivered Items at this Stop
              </h3>
              <div className="text-[11px] text-slate-500">
                Scan barcode above to add items to delivery invoice
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
                Scan product barcode with camera above to automatically deduct van pieces and log price!
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
      ) : null}

      {/* ================= FLOATING DRIVER ACTION BAR (ALWAYS ACCESSIBLE) ================= */}
      <div className="fixed bottom-3 left-3 right-3 max-w-2xl mx-auto z-40 animate-in slide-in-from-bottom-3 duration-200">
        <div className="bg-slate-950/95 backdrop-blur-md text-white rounded-2xl p-2.5 px-3.5 shadow-2xl border border-slate-800 flex items-center justify-between gap-3">
          {/* Quick Counter */}
          <div
            onClick={() => setShowDeliveredItemsDrawer(true)}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90"
            title="Click to view itemized delivery list"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs font-mono shrink-0">
              {totalScannedItems}
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Delivery Total
              </div>
              <div className="text-sm font-bold font-mono text-emerald-400">
                {formatQAR(totalInvoiceValue)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* View Delivered Items Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowDeliveredItemsDrawer(true)}
              className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Items ({activeOutlet.items.length})</span>
            </button>

            {/* Complete Delivery Button */}
            {activeOutlet.status === 'delivered' ? (
              <button
                onClick={() => setShowReceiptModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Receipt</span>
              </button>
            ) : (
              <button
                onClick={handleOpenSignModal}
                disabled={totalScannedItems <= 0}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sign & Handover</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= DELIVERED ITEMS REVIEW SLIDE-UP DRAWER ================= */}
      {showDeliveredItemsDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col border border-slate-200 animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Delivered Items at {activeOutlet.name}
                </h3>
                <div className="text-xs text-slate-500">
                  {totalScannedItems} total pieces · {formatQAR(totalInvoiceValue)}
                </div>
              </div>
              <button
                onClick={() => setShowDeliveredItemsDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
              {activeOutlet.items.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No items scanned yet. Scan products using your camera.
                </div>
              ) : (
                activeOutlet.items.map((item) => {
                  const product = getProduct(item.productId);
                  if (!product) return null;
                  return (
                    <div key={item.productId} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-slate-900 truncate">
                          {product.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {item.scannedQty} {product.unit}(s) × {formatQAR(item.unitPrice)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              manualAdjustScanQty(activeOutlet.id, item.productId, item.scannedQty - 1)
                            }
                            disabled={item.scannedQty <= 0}
                            className="w-6 h-6 flex items-center justify-center rounded bg-white text-slate-700 shadow-2xs text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-mono font-bold">
                            {item.scannedQty}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              manualAdjustScanQty(activeOutlet.id, item.productId, item.scannedQty + 1)
                            }
                            disabled={product.vanStock <= 0}
                            className="w-6 h-6 flex items-center justify-center rounded bg-white text-slate-700 shadow-2xs text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-xs font-bold font-mono text-slate-900 w-16 text-right">
                          {formatQAR(item.scannedQty * item.unitPrice)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowDeliveredItemsDrawer(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close & Return to Scanner
              </button>
              {activeOutlet.status !== 'delivered' && totalScannedItems > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDeliveredItemsDrawer(false);
                    handleOpenSignModal();
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Proceed to Sign</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= VAN STOCK FINDER MODAL (WHAT CAN ADD FOR EASY TO DRIVER) ================= */}
      {showVanFinderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Van #1 Stock Finder</h3>
                  <div className="text-[11px] text-slate-500">
                    Quickly check what items and quantities are inside the van
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowVanFinderModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-100 bg-slate-50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={vanSearchQuery}
                  onChange={(e) => setVanSearchQuery(e.target.value)}
                  placeholder="Search item name, SKU or barcode..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-3 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-1">
              {filteredVanItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No matching van items found.
                </div>
              ) : (
                filteredVanItems.map((prod) => (
                  <div key={prod.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-900 truncate">
                        {prod.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {prod.barcode} · {prod.unit}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-bold font-mono ${
                          prod.vanStock > 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {prod.vanStock} in Van
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {formatQAR(prod.unitPrice)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setShowVanFinderModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SIGNATURE & HANDOVER MODAL ================= */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
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
                  Received by (Store Manager / Receiver Name):
                </label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="e.g. Tariq Al-Mansoor"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Quick Preset Notes for Drivers (No manual typing required!) */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Driver Drop-off Notes (1-Tap Quick Select):
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    '✓ All items verified & handed over',
                    '✓ Cash paid on delivery',
                    '✓ Invoice copy stamped',
                    '✓ Left at main storage dock',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDriverNotes(preset)}
                      className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                        driverNotes === preset
                          ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={driverNotes}
                  onChange={(e) => setDriverNotes(e.target.value)}
                  placeholder="Custom notes (optional)..."
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
