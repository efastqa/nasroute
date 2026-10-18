import React, { useState } from 'react';
import {
  X,
  Printer,
  CheckCircle,
  MapPin,
  Phone,
  Calendar,
  PackageCheck,
  Sliders,
  FileText,
  Share2,
  Check,
  Truck,
  QrCode,
} from 'lucide-react';
import { Outlet, Product, PaperSize } from '../../types';
import { formatQAR } from '../../utils/format';
import { useInventory } from '../../context/InventoryContext';
import { PageSetupModal } from './PageSetupModal';

interface DeliveryReceiptModalProps {
  outlet: Outlet;
  products: Product[];
  onClose: () => void;
}

export const DeliveryReceiptModal: React.FC<DeliveryReceiptModalProps> = ({
  outlet,
  products,
  onClose,
}) => {
  const { pageSetup, updatePageSetup } = useInventory();
  const [activePaper, setActivePaper] = useState<PaperSize>(pageSetup.paperSize || 'a4');
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const getProduct = (productId: string) => products.find((p) => p.id === productId);

  const deliveredItems = outlet.items.filter((item) => item.scannedQty > 0);
  const subtotal = deliveredItems.reduce(
    (sum, item) => sum + item.scannedQty * item.unitPrice,
    0
  );
  const tax = 0; // State of Qatar 0% standard VAT
  const total = subtotal + tax;

  const handlePrint = () => {
    document.body.setAttribute('data-paper-size', activePaper);
    window.print();
  };

  const handlePaperChange = (size: PaperSize) => {
    setActivePaper(size);
    updatePageSetup({ paperSize: size });
    document.body.setAttribute('data-paper-size', size);
  };

  // WhatsApp / text share summary for Qatar customers
  const handleShareWhatsApp = () => {
    const lines = [
      `*${pageSetup.companyName || 'Nasroute Delivery'}*`,
      `*Order #:* ${outlet.orderNumber}`,
      `*Customer:* ${outlet.name}`,
      `*Delivered:* ${outlet.deliveredAt || new Date().toLocaleDateString('en-US')}`,
      `-----------------------`,
      ...deliveredItems.map((item) => {
        const prod = getProduct(item.productId);
        return `• ${item.scannedQty}x ${prod?.name || 'Item'} = ${formatQAR(item.scannedQty * item.unitPrice)}`;
      }),
      `-----------------------`,
      `*Total Due:* ${formatQAR(total)} (0% VAT)`,
      `*Driver:* ${pageSetup.vanIdentifier || 'Van #1'}`,
      `Thank you for your business!`,
    ];
    const text = lines.join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const renderSingleReceiptContent = (copyLabel?: string) => {
    const isThermal = activePaper === 'thermal_80mm' || activePaper === 'thermal_58mm';

    if (isThermal) {
      return (
        <div
          className={`bg-white mx-auto font-mono text-slate-900 ${
            activePaper === 'thermal_80mm' ? 'max-w-[340px] text-xs' : 'max-w-[280px] text-[11px]'
          }`}
        >
          {copyLabel && (
            <div className="text-center pb-1 mb-1 border-b border-dashed border-slate-300 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              --- {copyLabel} ---
            </div>
          )}

          {/* Thermal Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300 mb-3 space-y-0.5">
            <div className="font-extrabold text-sm uppercase tracking-wide text-slate-950">
              {pageSetup.companyName || 'Nasroute Delivery'}
            </div>
            <div className="text-[11px] text-slate-600 font-semibold">{pageSetup.vanIdentifier}</div>
            <div className="text-[10px] text-slate-500">{pageSetup.taxRegistrationNumber}</div>
            <div className="text-[10px] text-slate-500">{pageSetup.address}</div>
            <div className="text-[10px] text-slate-500 font-semibold">Tel: {pageSetup.phone}</div>
          </div>

          {/* Order Details */}
          <div className="space-y-1 pb-2 border-b border-dashed border-slate-300 mb-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Order:</span>
              <span className="font-bold">{outlet.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date/Time:</span>
              <span>{outlet.deliveredAt || new Date().toLocaleString()}</span>
            </div>
            <div className="pt-1">
              <span className="text-slate-500">Customer:</span>
              <div className="font-bold text-slate-950">{outlet.name}</div>
              <div className="text-slate-600 text-[10px]">{outlet.address}</div>
              <div className="text-slate-500 text-[10px]">Attn: {outlet.contactPerson} ({outlet.phone})</div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2 pb-2 border-b border-dashed border-slate-300 mb-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 pb-0.5">
              <span>Qty / Description</span>
              <span>Total</span>
            </div>
            {deliveredItems.map((item) => {
              const prod = getProduct(item.productId);
              return (
                <div key={item.productId} className="space-y-0.5">
                  <div className="flex justify-between items-baseline font-bold">
                    <span className="truncate pr-2">
                      {item.scannedQty}x {prod?.name || 'Item'}
                    </span>
                    <span className="shrink-0">{formatQAR(item.scannedQty * item.unitPrice)}</span>
                  </div>
                  {pageSetup.showPricePerPiece && (
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>@ {formatQAR(item.unitPrice)} / {prod?.unit || 'pc'}</span>
                      {pageSetup.showBarcodeOnReceipt && (
                        <span className="text-[9px] text-slate-400 font-mono">[{prod?.barcode}]</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="space-y-1 pb-3 border-b border-dashed border-slate-300 mb-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatQAR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>VAT (0% Qatar):</span>
              <span>{formatQAR(0)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-slate-950 pt-1 border-t border-slate-200">
              <span>TOTAL DUE:</span>
              <span className="text-emerald-700">{formatQAR(total)}</span>
            </div>
          </div>

          {/* Receiver Signature */}
          {pageSetup.showSignatureOnReceipt && (
            <div className="pb-3 border-b border-dashed border-slate-300 mb-3 text-center">
              <div className="text-[10px] text-slate-500 mb-1 font-semibold uppercase">
                Receiver Signature: {outlet.receivedBy || outlet.contactPerson}
              </div>
              {outlet.signature ? (
                <div className="max-h-16 flex items-center justify-center p-1 border border-slate-200 rounded">
                  <img src={outlet.signature} alt="Signature" className="max-h-14 max-w-full object-contain" />
                </div>
              ) : (
                <div className="h-10 border-b border-dotted border-slate-400 mx-8"></div>
              )}
            </div>
          )}

          {outlet.driverNotes && (
            <div className="text-[10px] text-slate-500 italic mb-2">
              Note: {outlet.driverNotes}
            </div>
          )}

          {/* Thermal Footer */}
          <div className="text-center text-[10px] text-slate-500 space-y-1">
            <div>{pageSetup.receiptFooterNote || 'Thank you for your business.'}</div>
            <div className="text-[9px] text-slate-400 font-mono">Nasroute Driver Van Mobile Terminal</div>
            <div className="pt-2 text-slate-300 text-[9px]">- - - - - - TEAR HERE - - - - - -</div>
          </div>
        </div>
      );
    }

    // A4 / Letter Corporate Delivery Order & Tax Invoice Format
    return (
      <div className="bg-white p-6 sm:p-8 text-slate-800 text-xs">
        {copyLabel && (
          <div className="text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            [{copyLabel}]
          </div>
        )}

        {/* Corporate Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-900 pb-5 mb-5 gap-4">
          <div>
            <div className="text-xl font-extrabold tracking-tight text-slate-950">
              {pageSetup.companyName || 'Nasroute Logistics Qatar'}
            </div>
            <div className="text-xs text-indigo-700 font-semibold">{pageSetup.companySubtext}</div>
            <div className="text-xs text-slate-500 mt-1">{pageSetup.address}</div>
            <div className="text-xs text-slate-500 font-mono">
              Phone: {pageSetup.phone} · {pageSetup.taxRegistrationNumber}
            </div>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-bold text-xs uppercase tracking-wider mb-1">
              Delivery Order & Invoice
            </span>
            <div className="font-mono text-sm font-bold text-indigo-700">{outlet.orderNumber}</div>
            <div className="text-xs text-slate-500 font-mono">
              Date: {outlet.deliveredAt || new Date().toLocaleDateString('en-US')}
            </div>
            <div className="text-xs text-emerald-700 font-semibold mt-0.5">{pageSetup.vanIdentifier}</div>
          </div>
        </div>

        {/* Customer & Delivery Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 mb-5 border border-slate-200">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
              Customer / Consignee
            </span>
            <div className="font-bold text-sm text-slate-900">{outlet.name}</div>
            <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{outlet.address}</span>
            </div>
            <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{outlet.phone} · Attn: {outlet.contactPerson}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
              Delivery Logistics Details
            </span>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Fleet Unit:</span>
                <span className="font-semibold text-slate-900">{pageSetup.vanIdentifier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Status:</span>
                <span className="font-semibold text-emerald-700">Delivered & Verified</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Terms:</span>
                <span className="font-semibold text-slate-900">Direct Van Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-bold w-12 text-center">#</th>
                <th className="py-2.5 px-3 font-bold">Item Description</th>
                {pageSetup.showBarcodeOnReceipt && (
                  <th className="py-2.5 px-3 font-bold">SKU / Barcode</th>
                )}
                <th className="py-2.5 px-3 text-right font-bold">Qty</th>
                <th className="py-2.5 px-3 text-right font-bold">Unit Price</th>
                <th className="py-2.5 px-3 text-right font-bold">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deliveredItems.map((item, idx) => {
                const prod = getProduct(item.productId);
                const lineTotal = item.scannedQty * item.unitPrice;
                return (
                  <tr key={item.productId} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{prod?.name || 'Product'}</div>
                      <div className="text-[10px] text-slate-500">{prod?.unit}</div>
                    </td>
                    {pageSetup.showBarcodeOnReceipt && (
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {prod?.barcode}
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {item.scannedQty}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 tabular-nums">
                      {formatQAR(item.unitPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatQAR(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div className="flex flex-col items-end gap-1.5 border-b border-slate-200 pb-5 mb-5 text-xs font-mono">
          <div className="flex justify-between w-64 text-slate-600">
            <span>Items Subtotal:</span>
            <span className="tabular-nums font-semibold">{formatQAR(subtotal)}</span>
          </div>
          <div className="flex justify-between w-64 text-slate-500 text-[11px]">
            <span>VAT (0% Qatar Standard):</span>
            <span className="tabular-nums">{formatQAR(0)}</span>
          </div>
          <div className="flex justify-between w-64 text-sm font-extrabold text-slate-950 pt-2 border-t-2 border-slate-900">
            <span>Total Payable:</span>
            <span className="tabular-nums text-emerald-700">{formatQAR(total)}</span>
          </div>
        </div>

        {/* Dual Signature Block */}
        {pageSetup.showSignatureOnReceipt && (
          <div className="grid grid-cols-2 gap-8 pt-2 mb-4">
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Van Driver / Delivery Agent
              </span>
              <div className="font-semibold text-xs text-slate-900 mb-2">
                {pageSetup.vanIdentifier} Dispatch
              </div>
              <div className="h-14 border-b border-dotted border-slate-300 flex items-end justify-center pb-1 text-[10px] text-slate-400">
                Authorized Driver Signature
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Customer Consignee Acknowledgement
              </span>
              <div className="font-semibold text-xs text-slate-900 mb-1">
                Received by: {outlet.receivedBy || outlet.contactPerson}
              </div>
              {outlet.signature ? (
                <div className="h-14 flex items-center justify-center p-1 bg-white border border-slate-200 rounded">
                  <img
                    src={outlet.signature}
                    alt="Customer Signature"
                    className="max-h-12 max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-14 border-b border-dotted border-slate-300 flex items-end justify-center pb-1 text-[10px] text-slate-400">
                  Receiver Signature & Store Stamp
                </div>
              )}
            </div>
          </div>
        )}

        {outlet.driverNotes && (
          <div className="text-[11px] text-slate-600 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/60 mb-4">
            <strong>Driver Remarks:</strong> {outlet.driverNotes}
          </div>
        )}

        {/* Footer Note */}
        <div className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
          <div>{pageSetup.receiptFooterNote || 'Thank you for your business. State of Qatar 0% standard VAT applied.'}</div>
          <div className="text-[9px] mt-0.5">Nasroute Logistics · Official Delivery Documentation · Doha, Qatar</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div
          className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[94vh] ${
            activePaper === 'thermal_80mm'
              ? 'max-w-md'
              : activePaper === 'thermal_58mm'
              ? 'max-w-sm'
              : 'max-w-2xl'
          }`}
        >
          {/* Header Bar */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-semibold text-sm">Delivery Receipt & Tax Invoice</h3>
                <span className="text-[10px] text-slate-400">
                  {outlet.orderNumber} · {outlet.name}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Page Setup Toolbar at top */}
          <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-700 mr-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Paper Setup:
              </span>
              <button
                onClick={() => handlePaperChange('a4')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  activePaper === 'a4'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold border border-indigo-200'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                📄 A4 Invoice
              </button>
              <button
                onClick={() => handlePaperChange('thermal_80mm')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  activePaper === 'thermal_80mm'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold border border-indigo-200'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                🧾 80mm Van Thermal
              </button>
              <button
                onClick={() => handlePaperChange('thermal_58mm')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  activePaper === 'thermal_58mm'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold border border-indigo-200'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                🧾 58mm Mini
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                title="Copy text summary for WhatsApp"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy for WhatsApp</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowSetupModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                title="Open detailed Page Setup dialog"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Page Setup</span>
              </button>
            </div>
          </div>

          {/* Printable Scroll Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 print:bg-white print:p-0 print:overflow-visible">
            {/* Copy 1: Customer Copy */}
            {renderSingleReceiptContent(
              pageSetup.printCopies === 2 ? 'Customer Copy (Original)' : undefined
            )}

            {/* Copy 2: If 2 copies configured in Page Setup */}
            {pageSetup.printCopies === 2 && (
              <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-300 page-break-before-always">
                {renderSingleReceiptContent('Van Driver Copy (Duplicate Archive)')}
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 print:hidden">
            <span className="text-xs text-slate-500">
              Format: {activePaper.toUpperCase()} · Copies: {pageSetup.printCopies}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                <Printer className="w-4 h-4" />
                Print Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSetupModal && (
        <PageSetupModal onClose={() => setShowSetupModal(false)} />
      )}
    </>
  );
};
