import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  Keyboard,
  X,
  Sparkles,
  CheckCircle2,
  Truck,
  Plus,
  Minus,
  AlertCircle,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Product, Outlet } from '../../types';
import { formatQAR } from '../../utils/format';
import { sound } from '../../utils/audio';

interface CameraBarcodeScannerProps {
  onScanSuccess?: (barcode: string, product?: Product) => void;
  onClose?: () => void;
  outletId?: string;
}

export const CameraBarcodeScanner: React.FC<CameraBarcodeScannerProps> = ({
  onScanSuccess,
  onClose,
  outletId,
}) => {
  const { products, outlets, recordScan, quickAddStockToVan, addProduct } = useInventory();
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [showTestBarcodes, setShowTestBarcodes] = useState(false);

  // Scanned item modal/drawer state
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [deliveryQty, setDeliveryQty] = useState<number>(1);
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isHandlingScanRef = useRef(false);
  const containerIdRef = useRef(`interactive-barcode-reader-${Math.random().toString(36).substring(2, 7)}`);

  // Target outlet for delivery
  const currentOutlet: Outlet | undefined = outlets.find((o) => o.id === outletId) || outlets[0];

  // Keep scanned product synchronized with live catalog changes
  const liveScannedProduct = scannedProduct
    ? products.find((p) => p.id === scannedProduct.id) || scannedProduct
    : null;

  const handleBarcodeDetected = useCallback(
    (decodedText: string) => {
      const cleanBarcode = decodedText.trim();
      sound.playScanBeep();

      // Find product matching barcode or SKU
      const found = products.find(
        (p) => p.barcode === cleanBarcode || p.sku.toLowerCase() === cleanBarcode.toLowerCase()
      );

      if (found) {
        setUnknownBarcode(null);
        setScannedProduct(found);
        setDeliveryQty(1);
        setScanMessage({
          text: `Found in Van: ${found.name}`,
          type: 'info',
        });
        if (onScanSuccess) {
          onScanSuccess(cleanBarcode, found);
        }
      } else {
        setUnknownBarcode(cleanBarcode);
        setScannedProduct(null);
        sound.playErrorBuzz();
        setScanMessage({
          text: `Barcode "${cleanBarcode}" is not in the system catalog yet.`,
          type: 'error',
        });
      }
    },
    [products, onScanSuccess]
  );

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    let isMounted = true;

    async function startScanner() {
      try {
        setCameraError(null);
        const container = document.getElementById(containerIdRef.current);
        if (!container) return;

        if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          if (isMounted) {
            setCameraError('Camera access requires permission. You can use the 1-Tap test buttons or keypad below.');
            setIsScanning(false);
          }
          return;
        }

        html5QrCode = new Html5Qrcode(containerIdRef.current, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 280, height: 180 },
            aspectRatio: 1.3333,
          },
          (decodedText) => {
            if (isMounted && !isHandlingScanRef.current) {
              isHandlingScanRef.current = true;
              handleBarcodeDetected(decodedText);
              // Brief debounce so camera doesn't spam same item every 50ms
              setTimeout(() => {
                isHandlingScanRef.current = false;
              }, 1200);
            }
          },
          () => {
            // Frame scan without barcode match, continue quietly
          }
        );

        if (isMounted) {
          setIsScanning(true);
          try {
            const track = (html5QrCode as unknown as { getRunningTrack?: () => MediaStreamTrack }).getRunningTrack?.();
            if (track) {
              const capabilities = track.getCapabilities?.() as unknown as { torch?: boolean };
              if (capabilities && capabilities.torch) {
                setHasTorch(true);
              }
            }
          } catch {
            // Torch check optional
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errMsg = err instanceof Error ? err.message : String(err);
          setCameraError(errMsg);
          setIsScanning(false);
        }
      }
    }

    const timer = setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {}).finally(() => {
              try { scannerRef.current?.clear(); } catch {}
            });
          }
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [handleBarcodeDetected]);

  const toggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      const track = (scannerRef.current as unknown as { getRunningTrack?: () => MediaStreamTrack }).getRunningTrack?.();
      if (track) {
        await track.applyConstraints({
          advanced: [{ torch: !torchOn } as unknown as MediaTrackConstraintSet],
        });
        setTorchOn(!torchOn);
      }
    } catch {
      // ignore
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeDetected(manualCode.trim());
    setManualCode('');
  };

  // Perform delivery deduction
  const handleConfirmDelivery = () => {
    if (!liveScannedProduct) return;

    if (liveScannedProduct.vanStock <= 0) {
      sound.playErrorBuzz();
      setScanMessage({
        text: `Cannot deliver: 0 pcs of ${liveScannedProduct.name} in van. Please load van first.`,
        type: 'error',
      });
      return;
    }

    const res = recordScan({
      barcode: liveScannedProduct.barcode,
      outletId: currentOutlet?.id,
      quantity: deliveryQty,
      source: 'camera_scan',
    });

    if (res.success) {
      setScanMessage({
        text: `Successfully delivered ${res.actualAddQty || deliveryQty} ${liveScannedProduct.unit}(s) @ ${formatQAR(liveScannedProduct.unitPrice)} each!`,
        type: 'success',
      });
      // Close drawer after positive feedback
      setTimeout(() => {
        setScannedProduct(null);
        setScanMessage(null);
      }, 1600);
    } else {
      setScanMessage({
        text: res.message,
        type: 'error',
      });
    }
  };

  // Quick 1-tap stock reload right from the scan drawer
  const handleQuickLoadVan = (qtyToAdd: number) => {
    if (!liveScannedProduct) return;
    quickAddStockToVan(liveScannedProduct.id, qtyToAdd);
    setScanMessage({
      text: `Loaded +${qtyToAdd} ${liveScannedProduct.unit}(s) into Van #1!`,
      type: 'success',
    });
  };

  // Quick register unknown barcode
  const handleQuickRegisterItem = () => {
    if (!unknownBarcode) return;
    const newProd = addProduct({
      name: `New Item (${unknownBarcode.slice(-4)})`,
      barcode: unknownBarcode,
      sku: `SKU-${unknownBarcode.slice(-4)}`,
      category: 'General',
      unit: 'pc',
      unitPrice: 20.0,
      warehouseStock: 50,
      vanStock: 25,
      image: '',
      lowStockThreshold: 5,
      description: 'Quick added from scanner',
    });
    setUnknownBarcode(null);
    setScannedProduct(newProd);
    setScanMessage({
      text: `Item registered! 25 pcs loaded in Van #1 @ 20.00 QAR.`,
      type: 'success',
    });
  };

  return (
    <div className="relative flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 text-white">
      {/* Scanner Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 z-10">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm tracking-tight text-white">
            Nasroute Van Barcode Scanner
          </span>
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
            QATAR ACTIVE
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-lg transition-colors ${
                torchOn ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Toggle Flashlight"
            >
              {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className={`p-2 rounded-lg transition-colors text-xs flex items-center gap-1.5 font-medium ${
              showManualInput ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Manual Barcode Keypad"
          >
            <Keyboard className="w-4 h-4" />
            <span className="hidden sm:inline">Type Barcode</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Camera Viewport */}
      <div className="relative min-h-[280px] max-h-[360px] bg-black flex items-center justify-center overflow-hidden">
        <div
          id={containerIdRef.current}
          className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
        />

        {/* Viewfinder Reticle Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-[280px] h-[160px] border-2 border-emerald-400/80 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
            <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-md" />
            <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-md" />
            <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-md" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-md" />

            {/* Red Laser Sweep Line */}
            <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-red-500/90 shadow-[0_0_12px_#ef4444] animate-pulse" />

            <div className="absolute -bottom-6 left-0 right-0 text-center text-[11px] font-medium text-emerald-300 tracking-wide drop-shadow">
              Scan barcode from delivery van
            </div>
          </div>
        </div>

        {/* Camera Permission / Error Fallback */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20">
            <Camera className="w-10 h-10 text-amber-400 mb-2" />
            <h4 className="font-semibold text-slate-100 text-sm mb-1">Camera Standby</h4>
            <p className="text-xs text-slate-400 max-w-xs mb-3">
              Camera is ready. If camera permission was restricted in your browser, tap 'Type Barcode' above to enter a code manually.
            </p>
            <button
              onClick={() => {
                setCameraError(null);
                window.location.reload();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload Camera
            </button>
          </div>
        )}
      </div>

      {/* Manual Input Bar */}
      {showManualInput && (
        <form onSubmit={handleManualSubmit} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Type barcode or SKU (e.g. 793573189012)..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
          >
            Scan Item
          </button>
        </form>
      )}

      {/* CORE DRIVER FEATURE: Instant Van Item Scanned Detail Card */}
      {liveScannedProduct && (
        <div className="p-4 bg-slate-950 border-t-2 border-emerald-500 text-white animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                {liveScannedProduct.image ? (
                  <img
                    src={liveScannedProduct.image}
                    alt={liveScannedProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-6 h-6 text-emerald-400" />
                )}
              </div>
              <div>
                <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">
                  ✓ Scanned from Van #1
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                  {liveScannedProduct.name}
                </h3>
                <div className="text-[11px] text-slate-400 font-mono">
                  Barcode: {liveScannedProduct.barcode}
                </div>
              </div>
            </div>

            <button
              onClick={() => setScannedProduct(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Close card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Key Driver Highlights: QTY IN VAN & UNIT PRICE IN QAR */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* PCS IN VAN */}
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Pcs Inside Van:</span>
              </div>
              <div className="text-xl font-bold font-mono text-white mt-0.5">
                {liveScannedProduct.vanStock > 0 ? (
                  <span className="text-emerald-400">{liveScannedProduct.vanStock} pcs</span>
                ) : (
                  <span className="text-rose-400">0 pcs in Van</span>
                )}
              </div>
            </div>

            {/* EACH PRICE IN QAR */}
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>Each Price (QAR):</span>
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {formatQAR(liveScannedProduct.unitPrice)}
              </div>
            </div>
          </div>

          {/* Zero Stock Alert with 1-Tap Load */}
          {liveScannedProduct.vanStock <= 0 && (
            <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl mb-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Van has 0 pcs. Did you load this item into the van?</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLoadVan(10)}
                  className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                >
                  + Load 10 to Van
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLoadVan(25)}
                  className="px-3 py-1 bg-amber-400/80 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                >
                  + Load 25 to Van
                </button>
              </div>
            </div>
          )}

          {/* Delivery Quantity Selector & Subtotal */}
          {liveScannedProduct.vanStock > 0 && (
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 mb-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Quantity to Deliver:</span>
                <span className="font-mono text-white font-bold">
                  Total: {formatQAR(deliveryQty * liveScannedProduct.unitPrice)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                {/* Stepper */}
                <div className="inline-flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setDeliveryQty((q) => Math.max(1, q - 1))}
                    disabled={deliveryQty <= 1}
                    className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white font-bold flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-12 text-center font-mono font-bold text-sm text-white">
                    {deliveryQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeliveryQty((q) => Math.min(liveScannedProduct.vanStock, q + 1))}
                    disabled={deliveryQty >= liveScannedProduct.vanStock}
                    className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white font-bold flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick amount chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setDeliveryQty(1)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold font-mono ${
                      deliveryQty === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    1 pc
                  </button>
                  {liveScannedProduct.vanStock >= 5 && (
                    <button
                      type="button"
                      onClick={() => setDeliveryQty(5)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold font-mono ${
                        deliveryQty === 5 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      5 pcs
                    </button>
                  )}
                  {liveScannedProduct.vanStock >= 10 && (
                    <button
                      type="button"
                      onClick={() => setDeliveryQty(10)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold font-mono ${
                        deliveryQty === 10 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      10 pcs
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeliveryQty(liveScannedProduct.vanStock)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold font-mono ${
                      deliveryQty === liveScannedProduct.vanStock
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    All ({liveScannedProduct.vanStock})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Message */}
          {scanMessage && (
            <div
              className={`p-2.5 rounded-lg text-xs font-semibold mb-3 ${
                scanMessage.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : scanMessage.type === 'error'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}
            >
              {scanMessage.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScannedProduct(null)}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Just Check Price/Stock
            </button>
            <button
              type="button"
              onClick={handleConfirmDelivery}
              disabled={liveScannedProduct.vanStock <= 0}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Deliver {deliveryQty} {liveScannedProduct.unit}(s)</span>
            </button>
          </div>
        </div>
      )}

      {/* Unknown Barcode Card with 1-Tap Add */}
      {unknownBarcode && (
        <div className="p-4 bg-slate-950 border-t-2 border-amber-500 text-white space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-white">Unregistered Barcode Scanned</h4>
                <div className="text-xs font-mono text-amber-300">{unknownBarcode}</div>
              </div>
            </div>
            <button
              onClick={() => setUnknownBarcode(null)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-400">
            This barcode is not yet in your product list. Would you like to quick-register it and load 25 pieces into Van #1?
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setUnknownBarcode(null)}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
            >
              Dismiss
            </button>
            <button
              onClick={handleQuickRegisterItem}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Quick Add & Load to Van
            </button>
          </div>
        </div>
      )}

      {/* Scanner Status Bar & Optional Collapsed Test Simulation Barcodes */}
      <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-slate-300">Scanner Active</span>
          <span className="hidden sm:inline text-slate-500">· Aim camera at product barcode</span>
        </div>

        {/* Small subtle toggle for simulation (kept hidden by default) */}
        <button
          type="button"
          onClick={() => setShowTestBarcodes(!showTestBarcodes)}
          className="text-[10px] text-slate-500 hover:text-slate-300 font-medium transition-colors inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700"
          title="Toggle Simulation Barcodes for Testing"
        >
          <Sparkles className="w-3 h-3 text-amber-500/70" />
          <span>{showTestBarcodes ? 'Hide Test Barcodes' : 'Test Barcodes (Simulation)'}</span>
        </button>
      </div>

      {/* 1-Tap Test Barcodes - Kept Hidden by Default from Driver Screen */}
      {showTestBarcodes && (
        <div className="p-3 bg-slate-950 border-t border-slate-800 max-h-64 overflow-y-auto animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Catalog Quick-Test Simulation ({products.length} items):</span>
            </div>
            <button
              type="button"
              onClick={() => setShowTestBarcodes(false)}
              className="text-[10px] text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          {products.length === 0 ? (
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center text-xs text-slate-400">
              No products in catalog yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {products.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleBarcodeDetected(prod.barcode)}
                  className="p-2.5 rounded-xl text-left transition-all border text-xs flex flex-col justify-between bg-slate-900 border-slate-800 hover:border-emerald-500/70 hover:bg-slate-850 active:scale-[0.98] text-slate-200"
                >
                  <div className="font-semibold text-white truncate">{prod.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                    Code: {prod.barcode}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mt-2 pt-1 border-t border-slate-800 tabular-nums">
                    <span className="font-bold text-emerald-400">{formatQAR(prod.unitPrice)}</span>
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                        prod.vanStock > 0
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                          : 'bg-rose-950/80 text-rose-300'
                      }`}
                    >
                      {prod.vanStock} pcs in van
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
