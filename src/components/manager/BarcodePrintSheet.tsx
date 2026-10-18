import React, { useState } from 'react';
import { X, Printer, Barcode, Download, Sparkles, Sliders, Columns } from 'lucide-react';
import { Product } from '../../types';
import { BarcodeSvg } from '../../utils/barcodeGenerator';
import { formatQAR } from '../../utils/format';
import { useInventory } from '../../context/InventoryContext';
import { PageSetupModal } from '../common/PageSetupModal';

interface BarcodePrintSheetProps {
  products: Product[];
  onClose: () => void;
  onSimulateScan?: (barcode: string) => void;
}

export const BarcodePrintSheet: React.FC<BarcodePrintSheetProps> = ({
  products,
  onClose,
  onSimulateScan,
}) => {
  const { pageSetup, updatePageSetup } = useInventory();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [cols, setCols] = useState<2 | 3 | 4>(pageSetup.labelGridCols || 3);

  const handlePrint = () => {
    document.body.setAttribute('data-paper-size', 'a4');
    window.print();
  };

  const handleColChange = (newCols: 2 | 3 | 4) => {
    setCols(newCols);
    updatePageSetup({ labelGridCols: newCols });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
          {/* Header Bar */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
            <div className="flex items-center gap-2">
              <Barcode className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-semibold text-sm">Printable Barcode Label Sheet (Qatar)</h3>
                <p className="text-[11px] text-slate-400">
                  Van #1 inventory labels with QAR pricing & scannable barcodes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Labels
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Label Page Setup Bar */}
          <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Columns className="w-3.5 h-3.5 text-indigo-600" />
                Grid Columns:
              </span>
              {([2, 3, 4] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => handleColChange(c)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                    cols === c
                      ? 'bg-white text-indigo-700 font-bold shadow-xs border border-indigo-200'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c} Columns {c === 2 ? '(Large)' : c === 3 ? '(Standard)' : '(Compact)'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowSetupModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Label Page Setup</span>
            </button>
          </div>

          {/* Barcode Grid */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 print:bg-white print:p-0 print:overflow-visible">
            <div
              className={`grid gap-4 ${
                cols === 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : cols === 4
                  ? 'grid-cols-2 sm:grid-cols-4'
                  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
              }`}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between print:border-black/20 print:shadow-none page-break-inside-avoid"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-semibold text-xs text-slate-900 line-clamp-2">
                        {product.name}
                      </span>
                      {pageSetup.showPriceOnLabels && (
                        <span className="font-mono text-xs font-bold text-emerald-700 shrink-0">
                          {formatQAR(product.unitPrice)}
                        </span>
                      )}
                    </div>
                    {pageSetup.showSkuOnLabels && (
                      <div className="text-[10px] text-slate-500 mb-3 flex items-center gap-2">
                        <span className="font-mono">SKU: {product.sku}</span>
                        <span>·</span>
                        <span>{product.unit}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2">
                    <BarcodeSvg value={product.barcode} height={cols === 4 ? 42 : 52} />
                  </div>

                  {onSimulateScan && (
                    <button
                      onClick={() => onSimulateScan(product.barcode)}
                      className="w-full py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors print:hidden"
                    >
                      <Sparkles className="w-3 h-3" />
                      Test Scan Code
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 print:hidden">
            <span className="text-xs text-slate-500">
              Total: {products.length} item labels · QAR Price Format
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {showSetupModal && (
        <PageSetupModal onClose={() => setShowSetupModal(false)} />
      )}
    </>
  );
};
