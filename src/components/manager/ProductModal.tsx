import React, { useState } from 'react';
import { X, Check, DollarSign, Barcode, Layers, Tag } from 'lucide-react';
import { Product } from '../../types';

interface ProductModalProps {
  product?: Product | null;
  onSave: (product: Omit<Product, 'id'> | Product) => void;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(product?.name || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [category, setCategory] = useState(product?.category || 'Coffee & Tea');
  const [unitPrice, setUnitPrice] = useState<number>(product?.unitPrice || 12.00);
  const [retailPrice, setRetailPrice] = useState<number>(product?.retailPrice || 18.00);
  const [unit, setUnit] = useState(product?.unit || 'unit');
  const [warehouseStock, setWarehouseStock] = useState<number>(product?.warehouseStock || 100);
  const [vanStock, setVanStock] = useState<number>(product?.vanStock || 20);
  const [image, setImage] = useState(product?.image || '/src/assets/images/prod_artisan_coffee_1792244748566.jpg');
  const [description, setDescription] = useState(product?.description || '');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(product?.lowStockThreshold || 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !barcode.trim() || unitPrice <= 0) {
      alert('Please fill out product name, barcode, and valid price.');
      return;
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim() || barcode.trim().slice(-6),
      barcode: barcode.trim(),
      category,
      unitPrice: Number(unitPrice),
      retailPrice: Number(retailPrice),
      unit,
      warehouseStock: Number(warehouseStock),
      vanStock: Number(vanStock),
      image,
      description,
      lowStockThreshold: Number(lowStockThreshold),
    };

    if (product) {
      onSave({ ...payload, id: product.id });
    } else {
      onSave(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">
              {product ? 'Edit Inventory Item & Price' : 'Add New Inventory Product'}
            </h3>
            <p className="text-[11px] text-slate-400">
              Changes reflect immediately on driver's phone scanner
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Product Title</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ethiopian Yirgacheffe Roast"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Barcode (EAN/UPC)</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g. 793573189012"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">SKU Code</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. COF-ETH-01"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Wholesale Price (QAR)
              </label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[10px]">QAR</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-2 py-2 text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Retail Price (QAR)</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[10px]">QAR</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-2 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Packaging Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="bag, bottle, box"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Warehouse Stock</label>
              <input
                type="number"
                min="0"
                value={warehouseStock}
                onChange={(e) => setWarehouseStock(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs tabular-nums"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Driver Van Stock</label>
              <input
                type="number"
                min="0"
                value={vanStock}
                onChange={(e) => setVanStock(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs tabular-nums"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              >
                <option value="Coffee & Tea">Coffee & Tea</option>
                <option value="Cold Beverages">Cold Beverages</option>
                <option value="Bakery & Pastry">Bakery & Pastry</option>
                <option value="Dairy & Plant">Dairy & Plant</option>
                <option value="Snacks & Pantry">Snacks & Pantry</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Product Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Origin notes, organic certifications, storage directions..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
