import React, { useState } from 'react';
import { X, ArrowRight, Truck, Check, AlertCircle } from 'lucide-react';
import { Product } from '../../types';

interface StockTransferModalProps {
  products: Product[];
  onTransfer: (productId: string, quantity: number) => void;
  onClose: () => void;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  products,
  onTransfer,
  onClose,
}) => {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [transferQty, setTransferQty] = useState<number>(10);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (transferQty <= 0) {
      alert('Transfer quantity must be greater than 0.');
      return;
    }
    if (transferQty > selectedProduct.warehouseStock) {
      alert(`Cannot transfer ${transferQty}. Warehouse only has ${selectedProduct.warehouseStock} available.`);
      return;
    }
    onTransfer(selectedProduct.id, transferQty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-sm">Transfer Stock to Driver Van</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Select Item to Load onto Van:</label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setTransferQty(10);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Warehouse: {p.warehouseStock} | Van: {p.vanStock})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Warehouse Central:</span>
                <span className="font-bold text-slate-900 text-sm tabular-nums">
                  {selectedProduct.warehouseStock} {selectedProduct.unit}s
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Driver Van Current:</span>
                <span className="font-bold text-indigo-700 text-sm tabular-nums">
                  {selectedProduct.vanStock} {selectedProduct.unit}s
                </span>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium text-slate-700">Quantity to Transfer:</label>
              <span className="text-slate-500 text-[11px]">
                Max available: {selectedProduct ? selectedProduct.warehouseStock : 0}
              </span>
            </div>
            <input
              type="number"
              min="1"
              max={selectedProduct ? selectedProduct.warehouseStock : 9999}
              value={transferQty}
              onChange={(e) => setTransferQty(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedProduct || selectedProduct.warehouseStock <= 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Transfer to Van
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
