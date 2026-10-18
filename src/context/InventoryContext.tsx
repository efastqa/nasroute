import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, Outlet, ScanEvent, PageSetupConfig, DEFAULT_PAGE_SETUP } from '../types';
import { INITIAL_PRODUCTS, INITIAL_OUTLETS, SAMPLE_PRODUCTS, SAMPLE_OUTLETS } from '../data/initialData';
import { sound } from '../utils/audio';

interface InventoryContextType {
  products: Product[];
  outlets: Outlet[];
  scanLogs: ScanEvent[];
  activeOutletId: string;
  setActiveOutletId: (id: string) => void;
  updateProduct: (updated: Product) => void;
  addProduct: (product: Omit<Product, 'id'>) => Product;
  deleteProduct: (id: string) => void;
  addOutlet: (outlet: Omit<Outlet, 'id'>) => Outlet;
  updateOutlet: (updated: Outlet) => void;
  deleteOutlet: (id: string) => void;
  recordScan: (params: {
    barcode: string;
    outletId?: string;
    quantity?: number;
    source?: 'camera_scan' | 'manual_entry' | 'quick_select';
  }) => { success: boolean; message: string; product?: Product; actualAddQty?: number };
  manualAdjustScanQty: (outletId: string, productId: string, newQty: number) => void;
  completeDelivery: (params: {
    outletId: string;
    receivedBy: string;
    signature?: string;
    driverNotes?: string;
  }) => void;
  loadSampleData: () => void;
  bulkLoadVan: (transfers: { productId: string; transferQty: number; mode?: 'add' | 'set' }[]) => void;
  bulkAddProducts: (newItems: Omit<Product, 'id'>[]) => void;
  bulkApplyVanCsv: (params: {
    updates: { productId: string; transferQty: number; mode: 'add' | 'set'; unitPrice?: number }[];
    newProducts: Omit<Product, 'id'>[];
  }) => void;
  quickAddStockToVan: (productId: string, qty: number) => void;
  clearAllData: () => void;
  resetAllData: () => void;
  pageSetup: PageSetupConfig;
  updatePageSetup: (patch: Partial<PageSetupConfig>) => void;
  resetPageSetup: () => void;
  lastSyncTimestamp: number;
}

const STORAGE_KEY_PRODUCTS = 'omniroute_products_empty_v2';
const STORAGE_KEY_OUTLETS = 'omniroute_outlets_empty_v2';
const STORAGE_KEY_LOGS = 'omniroute_logs_empty_v2';
const STORAGE_KEY_PAGESETUP = 'nasroute_page_setup_v1';
const SYNC_CHANNEL_NAME = 'omniroute_realtime_broadcast_v2';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [outlets, setOutlets] = useState<Outlet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OUTLETS);
      return saved ? JSON.parse(saved) : INITIAL_OUTLETS;
    } catch {
      return INITIAL_OUTLETS;
    }
  });

  const [scanLogs, setScanLogs] = useState<ScanEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [pageSetup, setPageSetup] = useState<PageSetupConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PAGESETUP);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PAGE_SETUP,
          ...parsed,
          phoneDevice: {
            ...DEFAULT_PAGE_SETUP.phoneDevice,
            ...(parsed.phoneDevice || {}),
          },
        };
      }
      return DEFAULT_PAGE_SETUP;
    } catch {
      return DEFAULT_PAGE_SETUP;
    }
  });

  const [activeOutletId, setActiveOutletId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OUTLETS);
      if (saved) {
        const parsed: Outlet[] = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].id;
      }
    } catch {
      // ignore
    }
    return '';
  });

  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(Date.now());

  // Broadcast channel for real-time multi-tab / device sync
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event.data?.type === 'SYNC_ALL') {
        if (event.data.products) setProducts(event.data.products);
        if (event.data.outlets) {
          setOutlets(event.data.outlets);
          setActiveOutletId((prev) => {
            if (prev && event.data.outlets.some((o: Outlet) => o.id === prev)) return prev;
            return event.data.outlets[0]?.id || '';
          });
        }
        if (event.data.scanLogs) setScanLogs(event.data.scanLogs);
        if (event.data.pageSetup) setPageSetup(event.data.pageSetup);
        setLastSyncTimestamp(Date.now());
      } else if (event.data?.type === 'SYNC_PAGE_SETUP' && event.data.pageSetup) {
        setPageSetup(event.data.pageSetup);
        setLastSyncTimestamp(Date.now());
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  const broadcastSync = (newProducts: Product[], newOutlets: Outlet[], newLogs: ScanEvent[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(newProducts));
      localStorage.setItem(STORAGE_KEY_OUTLETS, JSON.stringify(newOutlets));
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(newLogs));
    } catch {
      // storage full or disabled
    }

    setLastSyncTimestamp(Date.now());

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        channel.postMessage({
          type: 'SYNC_ALL',
          products: newProducts,
          outlets: newOutlets,
          scanLogs: newLogs,
          timestamp: Date.now()
        });
        channel.close();
      } catch {
        // ignore
      }
    }
  };

  // Update existing product details (price, stock, barcode, name, etc.)
  const updateProduct = useCallback((updated: Product) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? updated : p));
      // Also update unitPrice in any pending outlet items
      setOutlets((prevOutlets) => {
        const nextOutlets = prevOutlets.map((outlet) => {
          if (outlet.status === 'delivered') return outlet; // Keep locked price for past deliveries
          const updatedItems = outlet.items.map((item) => {
            if (item.productId === updated.id) {
              return { ...item, unitPrice: updated.unitPrice };
            }
            return item;
          });
          return { ...outlet, items: updatedItems };
        });
        broadcastSync(next, nextOutlets, scanLogs);
        return nextOutlets;
      });
      return next;
    });
  }, [scanLogs]);

  // Add brand-new product
  const addProduct = useCallback((newProdData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...newProdData,
      id: `prod-${Date.now().toString(36)}`,
    };
    setProducts((prev) => {
      const next = [newProduct, ...prev];
      broadcastSync(next, outlets, scanLogs);
      return next;
    });
    return newProduct;
  }, [outlets, scanLogs]);

  // Delete product
  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      // Remove from outlet manifests
      const updatedOutlets = outlets.map((o) => ({
        ...o,
        items: o.items.filter((it) => it.productId !== id),
      }));
      setOutlets(updatedOutlets);
      broadcastSync(next, updatedOutlets, scanLogs);
      return next;
    });
  }, [outlets, scanLogs]);

  // Add outlet
  const addOutlet = useCallback((newOutletData: Omit<Outlet, 'id'>) => {
    const newOutlet: Outlet = {
      ...newOutletData,
      id: `outlet-${Date.now().toString(36)}`,
    };
    setOutlets((prev) => {
      const next = [...prev, newOutlet];
      broadcastSync(products, next, scanLogs);
      return next;
    });
    setActiveOutletId(newOutlet.id);
    return newOutlet;
  }, [products, scanLogs]);

  // Update outlet
  const updateOutlet = useCallback((updated: Outlet) => {
    setOutlets((prev) => {
      const next = prev.map((o) => (o.id === updated.id ? updated : o));
      broadcastSync(products, next, scanLogs);
      return next;
    });
  }, [products, scanLogs]);

  // Delete outlet
  const deleteOutlet = useCallback((id: string) => {
    setOutlets((prev) => {
      const next = prev.filter((o) => o.id !== id);
      broadcastSync(products, next, scanLogs);
      if (activeOutletId === id) {
        setActiveOutletId(next[0]?.id || '');
      }
      return next;
    });
  }, [products, scanLogs, activeOutletId]);

  // Bulk transfer or set items to replenish driver van stock
  const bulkLoadVan = useCallback(
    (transfers: { productId: string; transferQty: number; mode?: 'add' | 'set' }[]) => {
      setProducts((prev) => {
        const next = prev.map((p) => {
          const transfer = transfers.find((t) => t.productId === p.id);
          if (!transfer) return p;

          if (transfer.mode === 'set') {
            const newVanStock = Math.max(0, transfer.transferQty);
            return {
              ...p,
              vanStock: newVanStock,
            };
          }

          if (transfer.transferQty <= 0) return p;
          const whDeduct = Math.min(transfer.transferQty, p.warehouseStock);
          return {
            ...p,
            warehouseStock: Math.max(0, p.warehouseStock - whDeduct),
            vanStock: p.vanStock + transfer.transferQty,
          };
        });
        broadcastSync(next, outlets, scanLogs);
        return next;
      });
      sound.playQuotaFulfilled();
    },
    [outlets, scanLogs]
  );

  // Quick 1-tap add stock directly to van
  const quickAddStockToVan = useCallback(
    (productId: string, qty: number) => {
      setProducts((prev) => {
        const next = prev.map((p) => {
          if (p.id === productId) {
            const whDeduct = Math.min(qty, p.warehouseStock);
            return {
              ...p,
              warehouseStock: Math.max(0, p.warehouseStock - whDeduct),
              vanStock: p.vanStock + qty,
            };
          }
          return p;
        });
        broadcastSync(next, outlets, scanLogs);
        return next;
      });
      sound.playScanBeep();
    },
    [outlets, scanLogs]
  );

  // Rapid bulk add of multiple products directly to catalog & van
  const bulkAddProducts = useCallback(
    (newItems: Omit<Product, 'id'>[]) => {
      setProducts((prev) => {
        const created: Product[] = newItems.map((item, idx) => ({
          ...item,
          id: `prod-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        }));
        const next = [...prev, ...created];
        broadcastSync(next, outlets, scanLogs);
        return next;
      });
      sound.playQuotaFulfilled();
    },
    [outlets, scanLogs]
  );

  // Bulk update or load van stock directly from CSV parsed data
  const bulkApplyVanCsv = useCallback(
    (params: {
      updates: { productId: string; transferQty: number; mode: 'add' | 'set'; unitPrice?: number }[];
      newProducts: Omit<Product, 'id'>[];
    }) => {
      setProducts((prev) => {
        // 1. Update matched existing products
        const updatedExisting = prev.map((p) => {
          const up = params.updates.find((u) => u.productId === p.id);
          if (!up) return p;

          let newVanStock = p.vanStock;
          if (up.mode === 'set') {
            newVanStock = Math.max(0, up.transferQty);
          } else {
            newVanStock = p.vanStock + Math.max(0, up.transferQty);
          }

          return {
            ...p,
            vanStock: newVanStock,
            unitPrice: up.unitPrice && up.unitPrice > 0 ? up.unitPrice : p.unitPrice,
          };
        });

        // 2. Add new products created via CSV
        const created: Product[] = params.newProducts.map((item, idx) => ({
          ...item,
          id: `prod-csv-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        }));

        const finalProducts = [...updatedExisting, ...created];
        broadcastSync(finalProducts, outlets, scanLogs);
        return finalProducts;
      });
      sound.playQuotaFulfilled();
    },
    [outlets, scanLogs]
  );

  // Record a scan action from the driver's phone
  const recordScan = useCallback(
    (params: {
      barcode: string;
      outletId?: string;
      quantity?: number;
      source?: 'camera_scan' | 'manual_entry' | 'quick_select';
    }) => {
      const qty = params.quantity ?? 1;
      const cleanBarcode = params.barcode.trim();

      // Find product matching barcode or SKU
      const product = products.find(
        (p) => p.barcode === cleanBarcode || p.sku.toLowerCase() === cleanBarcode.toLowerCase()
      );

      if (!product) {
        sound.playErrorBuzz();
        return {
          success: false,
          message: `Unrecognized Barcode (${cleanBarcode}). Please add item to catalog first.`,
        };
      }

      if (product.vanStock <= 0) {
        sound.playErrorBuzz();
        return {
          success: false,
          message: `Cannot scan ${product.name}: 0 pieces inside Van #1. (Tap +Load Van to replenish)`,
          product,
        };
      }

      // Ensure a valid destination outlet exists so driver is never blocked
      let targetOutlet = outlets.find((o) => o.id === params.outletId) || outlets[0];
      let currentOutlets = outlets;

      if (!targetOutlet) {
        targetOutlet = {
          id: `outlet-doha-${Date.now()}`,
          name: 'Doha Express Drop-off #1',
          address: 'Zone 22, Doha, Qatar',
          contactPerson: 'Receiving In-charge',
          phone: '+974 4400 1234',
          orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'in_progress',
          scheduledTime: 'Today',
          items: [],
        };
        currentOutlets = [targetOutlet, ...outlets];
        setActiveOutletId(targetOutlet.id);
      }

      // Check van stock availability
      const actualAddQty = Math.min(qty, product.vanStock);

      // Update van stock & outlet item count
      const updatedProducts = products.map((p) => {
        if (p.id === product.id) {
          return {
            ...p,
            vanStock: Math.max(0, p.vanStock - actualAddQty),
          };
        }
        return p;
      });

      let itemExistedInManifest = false;
      let newOutletItemCount = 0;
      let expectedCount = 0;

      const updatedOutlets = currentOutlets.map((o) => {
        if (o.id === targetOutlet.id) {
          const existingItem = o.items.find((item) => item.productId === product.id);
          let nextItems;
          if (existingItem) {
            itemExistedInManifest = true;
            newOutletItemCount = existingItem.scannedQty + actualAddQty;
            expectedCount = existingItem.expectedQty;
            nextItems = o.items.map((it) =>
              it.productId === product.id
                ? { ...it, scannedQty: it.scannedQty + actualAddQty }
                : it
            );
          } else {
            // Add newly scanned item to outlet delivery
            newOutletItemCount = actualAddQty;
            expectedCount = actualAddQty;
            nextItems = [
              ...o.items,
              {
                productId: product.id,
                expectedQty: actualAddQty,
                scannedQty: actualAddQty,
                unitPrice: product.unitPrice,
              },
            ];
          }

          return {
            ...o,
            status: o.status === 'pending' ? ('in_progress' as const) : o.status,
            items: nextItems,
          };
        }
        return o;
      });

      // Create scan event record
      const scanEvent: ScanEvent = {
        id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        outletId: targetOutlet.id,
        outletName: targetOutlet.name,
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        quantityDelta: actualAddQty,
        unitPrice: product.unitPrice,
        totalPrice: Number((actualAddQty * product.unitPrice).toFixed(2)),
        vanStockRemaining: product.vanStock - actualAddQty,
        source: params.source || 'camera_scan',
      };

      const updatedLogs = [scanEvent, ...scanLogs].slice(0, 100);

      setProducts(updatedProducts);
      setOutlets(updatedOutlets);
      setScanLogs(updatedLogs);
      broadcastSync(updatedProducts, updatedOutlets, updatedLogs);

      // Audio cue
      if (itemExistedInManifest && newOutletItemCount >= expectedCount) {
        sound.playQuotaFulfilled();
      } else {
        sound.playScanBeep();
      }

      return {
        success: true,
        message: `Scanned +${actualAddQty} ${product.unit}(s) of ${product.name} @ QAR ${product.unitPrice.toFixed(2)}`,
        product: {
          ...product,
          vanStock: product.vanStock - actualAddQty,
        },
        actualAddQty,
      };
    },
    [products, outlets, scanLogs]
  );

  // Adjust scanned quantity manually if driver taps stepper
  const manualAdjustScanQty = useCallback((outletId: string, productId: string, targetQty: number) => {
    const product = products.find((p) => p.id === productId);
    const outlet = outlets.find((o) => o.id === outletId);
    if (!product || !outlet) return;

    const item = outlet.items.find((i) => i.productId === productId);
    const currentScanned = item ? item.scannedQty : 0;
    const delta = targetQty - currentScanned;

    if (delta > 0 && product.vanStock < delta) {
      sound.playErrorBuzz();
      return;
    }

    const updatedProducts = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          vanStock: Math.max(0, p.vanStock - delta),
        };
      }
      return p;
    });

    const updatedOutlets = outlets.map((o) => {
      if (o.id === outletId) {
        return {
          ...o,
          items: o.items.map((it) =>
            it.productId === productId ? { ...it, scannedQty: Math.max(0, targetQty) } : it
          ),
        };
      }
      return o;
    });

    if (delta !== 0) {
      const scanEvent: ScanEvent = {
        id: `adjust-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        outletId: outlet.id,
        outletName: outlet.name,
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        quantityDelta: delta,
        unitPrice: product.unitPrice,
        totalPrice: Number((delta * product.unitPrice).toFixed(2)),
        vanStockRemaining: product.vanStock - delta,
        source: 'manual_entry',
      };
      const updatedLogs = [scanEvent, ...scanLogs].slice(0, 100);
      setProducts(updatedProducts);
      setOutlets(updatedOutlets);
      setScanLogs(updatedLogs);
      broadcastSync(updatedProducts, updatedOutlets, updatedLogs);
      sound.playScanBeep();
    }
  }, [products, outlets, scanLogs]);

  // Complete delivery to outlet
  const completeDelivery = useCallback((params: {
    outletId: string;
    receivedBy: string;
    signature?: string;
    driverNotes?: string;
  }) => {
    const timeString = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const updatedOutlets = outlets.map((o) => {
      if (o.id === params.outletId) {
        return {
          ...o,
          status: 'delivered' as const,
          deliveredAt: timeString,
          receivedBy: params.receivedBy,
          signature: params.signature,
          driverNotes: params.driverNotes,
        };
      }
      return o;
    });

    setOutlets(updatedOutlets);
    broadcastSync(products, updatedOutlets, scanLogs);
    sound.playDeliveryComplete();
  }, [outlets, products, scanLogs]);

  // Load sample demo data on demand
  const loadSampleData = useCallback(() => {
    setProducts(SAMPLE_PRODUCTS);
    setOutlets(SAMPLE_OUTLETS);
    setScanLogs([]);
    setActiveOutletId(SAMPLE_OUTLETS[0]?.id || '');
    broadcastSync(SAMPLE_PRODUCTS, SAMPLE_OUTLETS, []);
  }, []);

  // Clear all data completely
  const clearAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_PRODUCTS);
    localStorage.removeItem(STORAGE_KEY_OUTLETS);
    localStorage.removeItem(STORAGE_KEY_LOGS);
    setProducts([]);
    setOutlets([]);
    setScanLogs([]);
    setActiveOutletId('');
    broadcastSync([], [], []);
  }, []);

  const resetAllData = useCallback(() => {
    clearAllData();
  }, [clearAllData]);

  const updatePageSetup = useCallback((patch: Partial<PageSetupConfig>) => {
    setPageSetup((prev) => {
      const updated = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY_PAGESETUP, JSON.stringify(updated));
      } catch {
        // ignore
      }
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
          channel.postMessage({ type: 'SYNC_PAGE_SETUP', pageSetup: updated });
          channel.close();
        } catch {
          // ignore
        }
      }
      return updated;
    });
  }, []);

  const resetPageSetup = useCallback(() => {
    setPageSetup(DEFAULT_PAGE_SETUP);
    try {
      localStorage.setItem(STORAGE_KEY_PAGESETUP, JSON.stringify(DEFAULT_PAGE_SETUP));
    } catch {
      // ignore
    }
  }, []);

  return (
    <InventoryContext.Provider
      value={{
        products,
        outlets,
        scanLogs,
        activeOutletId,
        setActiveOutletId,
        updateProduct,
        addProduct,
        deleteProduct,
        addOutlet,
        updateOutlet,
        deleteOutlet,
        recordScan,
        manualAdjustScanQty,
        completeDelivery,
        loadSampleData,
        bulkLoadVan,
        bulkAddProducts,
        bulkApplyVanCsv,
        quickAddStockToVan,
        clearAllData,
        resetAllData,
        pageSetup,
        updatePageSetup,
        resetPageSetup,
        lastSyncTimestamp,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
