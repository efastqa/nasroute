import React, { useState } from 'react';
import { X, Check, Building2, MapPin, Phone, Clock, Plus, Trash2 } from 'lucide-react';
import { Outlet, Product } from '../../types';
import { formatQAR } from '../../utils/format';

interface OutletModalProps {
  outlet?: Outlet | null;
  products: Product[];
  onSave: (outlet: Omit<Outlet, 'id'> | Outlet) => void;
  onClose: () => void;
}

export const OutletModal: React.FC<OutletModalProps> = ({
  outlet,
  products,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(outlet?.name || '');
  const [address, setAddress] = useState(outlet?.address || '');
  const [contactPerson, setContactPerson] = useState(outlet?.contactPerson || '');
  const [phone, setPhone] = useState(outlet?.phone || '');
  const [orderNumber, setOrderNumber] = useState(outlet?.orderNumber || `ORD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [scheduledTime, setScheduledTime] = useState(outlet?.scheduledTime || '09:00 AM');
  
  // Selected items with expected quantities
  const [selectedItems, setSelectedItems] = useState<{ productId: string; expectedQty: number; unitPrice: number }[]>(
    outlet?.items.map((it) => ({
      productId: it.productId,
      expectedQty: it.expectedQty,
      unitPrice: it.unitPrice,
    })) || []
  );

  const handleAddItem = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    if (selectedItems.some((it) => it.productId === productId)) return;

    setSelectedItems([
      ...selectedItems,
      {
        productId,
        expectedQty: 5,
        unitPrice: prod.unitPrice,
      },
    ]);
  };

  const handleRemoveItem = (productId: string) => {
    setSelectedItems(selectedItems.filter((it) => it.productId !== productId));
  };

  const handleQtyChange = (productId: string, qty: number) => {
    setSelectedItems(
      selectedItems.map((it) =>
        it.productId === productId ? { ...it, expectedQty: Math.max(1, qty) } : it
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter an outlet/store name.');
      return;
    }

    const payload = {
      name: name.trim(),
      address: address.trim() || 'Doha, Qatar',
      contactPerson: contactPerson.trim() || 'Store Supervisor',
      phone: phone.trim() || '+974 4400 0000',
      orderNumber: orderNumber.trim() || `ORD-${Date.now().toString().slice(-4)}`,
      status: outlet?.status || ('pending' as const),
      scheduledTime: scheduledTime.trim() || '09:00 AM',
      items: selectedItems.map((it) => {
        const existing = outlet?.items.find((orig) => orig.productId === it.productId);
        return {
          productId: it.productId,
          expectedQty: it.expectedQty,
          scannedQty: existing?.scannedQty || 0,
          unitPrice: it.unitPrice,
        };
      }),
    };

    if (outlet) {
      onSave({ ...payload, id: outlet.id });
    } else {
      onSave(payload);
    }
    onClose();
  };

  const availableProductsToAdd = products.filter(
    (p) => !selectedItems.some((it) => it.productId === p.id)
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-semibold text-sm">
                {outlet ? 'Edit Outlet Stop & Order' : 'Add New Outlet Delivery Stop (Qatar)'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Setup destination store in Qatar and products to deliver in QAR
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Outlet / Customer Store Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Al Meera West Bay, Lusail Marina Cafe, Pearl Market"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Delivery Address (Qatar)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Zone 61, Al Dafna, West Bay, Doha, Qatar"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Tariq Al-Mansoor"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Phone Number (Qatar)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+974 5512 3456"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Order / Ref #</label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="QTR-8801"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Delivery Window</label>
              <input
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="09:00 AM"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
          </div>

          {/* Items to deliver at this outlet */}
          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-800">
                Products to Deliver at this Stop ({selectedItems.length}):
              </label>

              {availableProductsToAdd.length > 0 && (
                <div className="relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddItem(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg px-2 py-1 text-[11px] font-semibold cursor-pointer"
                  >
                    <option value="" disabled>+ Add Product to Manifest</option>
                    {availableProductsToAdd.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatQAR(p.unitPrice)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {selectedItems.length === 0 ? (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center text-slate-500 text-[11px]">
                {products.length === 0
                  ? 'No products in inventory yet. You can save this outlet now and add items or scan items during delivery.'
                  : 'No items assigned to this delivery yet. Use the dropdown above to add items, or the driver can scan any product directly.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {selectedItems.map((item) => {
                  const prod = products.find((p) => p.id === item.productId);
                  if (!prod) return null;
                  return (
                    <div
                      key={item.productId}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 truncate">{prod.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {formatQAR(prod.unitPrice)} / {prod.unit} · Barcode: {prod.barcode}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-500">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            value={item.expectedQty}
                            onChange={(e) => handleQtyChange(item.productId, parseInt(e.target.value) || 1)}
                            className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-right font-mono font-bold"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Outlet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
