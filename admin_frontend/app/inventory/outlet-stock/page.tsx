'use client';

import { useState, useEffect } from 'react';
import { Phone, Package, Search, X, Scan } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useSearchParams } from 'next/navigation';

interface InventoryItem {
  id: number;
  productId: number;
  batchId: number;
  barcode: string;
  costPrice: number;
  sellingPrice: number;
  location: string;
  status: string;
  admittedAt: string;
  createdAt: string;
}

interface ProductVariant {
  variantId: string;
  productId: number;
  productName: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
}

interface Store {
  id: string;
  name: string;
  location: string;
  contact: string;
  totalStock: number;
}

interface DispatchItem {
  id: string;
  inventoryId: number;
  productId: number;
  productName: string;
  batchId: number;
  barcode: string;
  costPrice: number;
  sellingPrice: number;
  fromStore: string;
  toStore: string;
  status: string;
  dispatchedAt: string;
  createdAt: string;
}

export default function OutletManageStockPage() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get('storeId');

  // State Management
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [store, setStore] = useState<Store | null>(null);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [destinationOutlet, setDestinationOutlet] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  const [upcomingProducts, setUpcomingProducts] = useState<DispatchItem[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Map<string, number>>(new Map());
  const [isTransferring, setIsTransferring] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [admittingBarcode, setAdmittingBarcode] = useState(false);
  const [scannerMode, setScannerMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch stores on mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch('/api/stores');
        if (res.ok) {
          const data = await res.json();
          setStores(data);

          const foundStore = data.find((s: any) => s.id == storeId);
          if (foundStore) {
            setStore({
              id: foundStore.id,
              name: foundStore.name,
              location: foundStore.location,
              contact: foundStore.contact || '01764257445',
              totalStock: 0
            });
          }
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [storeId]);

  // Fetch and group inventory when store changes
  useEffect(() => {
    if (!store) return;

    const fetchInventory = async () => {
      try {
        const [invRes, prodRes] = await Promise.all([
          fetch('/api/inventory'),
          fetch('/api/products')
        ]);

        if (!invRes.ok || !prodRes.ok) return;

        const inventory: InventoryItem[] = await invRes.json();
        const products: any[] = await prodRes.json();

        // Filter for current store and available items
        const storeInventory = inventory.filter(
          item => item.location === store.name && item.status === 'available'
        );

        // Group by productId + sellingPrice
        const variantMap = new Map<string, ProductVariant>();

        storeInventory.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          const variantId = `${item.productId}-${item.sellingPrice}`;

          if (variantMap.has(variantId)) {
            variantMap.get(variantId)!.quantity += 1;
          } else {
            variantMap.set(variantId, {
              variantId,
              productId: item.productId,
              productName: product?.name || `Product #${item.productId}`,
              costPrice: item.costPrice,
              sellingPrice: item.sellingPrice,
              quantity: 1
            });
          }
        });

        setProductVariants(Array.from(variantMap.values()));
        setStore(prev => prev ? { ...prev, totalStock: storeInventory.length } : null);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      }
    };

    fetchInventory();
  }, [store?.name]);

  // Fetch upcoming stock
  const fetchUpcomingStock = async () => {
    try {
      const res = await fetch(
        `/api/inventory-dispatch?toStore=${encodeURIComponent(store?.name || '')}&status=in-transit`
      );
      if (res.ok) {
        const dispatches = await res.json();
        const prodRes = await fetch('/api/products');
        const products = prodRes.ok ? await prodRes.json() : [];

        const enriched = dispatches.map((d: any) => ({
          ...d,
          productName: products.find((p: any) => p.id === d.productId)?.name || `Product #${d.productId}`
        }));

        setUpcomingProducts(enriched);
      }
    } catch (error) {
      console.error('Error fetching upcoming stock:', error);
    }
  };

  // Handle barcode admission
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim() || !store) return;

    setAdmittingBarcode(true);

    try {
      const dispatchItem = upcomingProducts.find(item => item.barcode === barcodeInput.trim());

      if (!dispatchItem) {
        alert('Barcode not found');
        setAdmittingBarcode(false);
        return;
      }

      // Update inventory
      await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dispatchItem.inventoryId,
          productId: dispatchItem.productId,
          batchId: dispatchItem.batchId,
          barcode: dispatchItem.barcode,
          costPrice: dispatchItem.costPrice,
          sellingPrice: dispatchItem.sellingPrice,
          location: store.name,
          status: 'available',
          admittedAt: new Date().toISOString(),
          createdAt: dispatchItem.createdAt
        })
      });

      // Update dispatch
      await fetch('/api/inventory-dispatch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dispatchItem.id,
          status: 'completed',
          receivedAt: new Date().toISOString()
        })
      });

      alert('Product admitted successfully');
      setBarcodeInput('');
      fetchUpcomingStock();
    } catch (error) {
      alert('Failed to admit product');
    } finally {
      setAdmittingBarcode(false);
    }
  };

  // Handle variant selection
  const handleVariantSelection = (variantId: string, quantity: number) => {
    const newSelected = new Map(selectedVariants);
    if (quantity > 0) {
      newSelected.set(variantId, quantity);
    } else {
      newSelected.delete(variantId);
    }
    setSelectedVariants(newSelected);
  };

  // Handle transfer
  const handleTransfer = async () => {
    if (!destinationOutlet || selectedVariants.size === 0) {
      alert('Please select destination and products');
      return;
    }

    setIsTransferring(true);

    try {
      const invRes = await fetch('/api/inventory');
      if (!invRes.ok) throw new Error('Failed to fetch inventory');
      const inventory: InventoryItem[] = await invRes.json();

      const destStore = stores.find(s => s.id == destinationOutlet);
      if (!destStore) throw new Error('Store not found');

      const dispatchRecords: any[] = [];
      const inventoryUpdates: any[] = [];

      for (const [variantId, requestedQty] of selectedVariants.entries()) {
        const [productId, sellingPrice] = variantId.split('-');
        const prodId = parseInt(productId);
        const sellPrice = parseFloat(sellingPrice);

        const availableItems = inventory.filter(
          item =>
            item.productId === prodId &&
            item.sellingPrice === sellPrice &&
            item.location === store?.name &&
            item.status === 'available'
        ).slice(0, requestedQty);

        if (availableItems.length < requestedQty) {
          alert(`Not enough stock for variant ${variantId}`);
          setIsTransferring(false);
          return;
        }

        for (const item of availableItems) {
          dispatchRecords.push({
            id: `${Date.now()}-${Math.random()}`,
            inventoryId: item.id,
            productId: item.productId,
            batchId: item.batchId,
            barcode: item.barcode,
            costPrice: item.costPrice,
            sellingPrice: item.sellingPrice,
            fromStore: store?.name,
            fromStoreId: store?.id,
            toStore: destStore.name,
            toStoreId: destStore.id,
            status: 'in-transit',
            dispatchedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          });

          inventoryUpdates.push({
            ...item,
            status: 'in-transit',
            location: `In Transit to ${destStore.name}`
          });
        }
      }

      // Create dispatch records
      await fetch('/api/inventory-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dispatchRecords)
      });

      // Update inventory items
      for (const update of inventoryUpdates) {
        await fetch('/api/inventory', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
      }

      alert(`Successfully transferred ${inventoryUpdates.length} items`);
      setSelectedVariants(new Map());
      setDestinationOutlet('');
      window.location.reload();
    } catch (error) {
      alert('Transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };

  const filteredVariants = productVariants.filter(v =>
    v.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSelected = Array.from(selectedVariants.values()).reduce((a, b) => a + b, 0);

  if (loading || !store) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
          <div className="flex-1 flex flex-col">
            <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <main className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Loading...</p>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-auto p-6">
            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">Contact</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{store.contact}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                  <Package className="w-4 h-4" />
                  <span className="text-sm font-medium">Total Stock</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{store.totalStock}</p>
              </div>
            </div>

            {/* Transfer Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transfer Stock</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Select products to transfer</p>
                </div>
                <button
                  onClick={() => {
                    setShowUpcomingModal(true);
                    fetchUpcomingStock();
                  }}
                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium"
                >
                  Upcoming Stock
                </button>
              </div>
              <select
                value={destinationOutlet}
                onChange={(e) => setDestinationOutlet(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              >
                <option value="">Select destination outlet</option>
                {stores.filter(s => s.id != storeId).map(s => (
                  <option key={s.id} value={s.id}>{s.name} - {s.location}</option>
                ))}
              </select>
              {selectedVariants.size > 0 && destinationOutlet && (
                <div className="flex justify-end">
                  <button
                    onClick={handleTransfer}
                    disabled={isTransferring}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                  >
                    {isTransferring ? 'Transferring...' : `Transfer ${totalSelected} Items`}
                  </button>
                </div>
              )}
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Inventory</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Select</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Product</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Cost</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Selling</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Stock</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Transfer Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVariants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">No products found</td>
                      </tr>
                    ) : (
                      filteredVariants.map(v => (
                        <tr key={v.variantId} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={selectedVariants.has(v.variantId)}
                              onChange={(e) => handleVariantSelection(v.variantId, e.target.checked ? 1 : 0)}
                              className="w-4 h-4 rounded"
                            />
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{v.productName}</td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">${v.costPrice}</td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">${v.sellingPrice}</td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{v.quantity}</td>
                          <td className="py-3 px-4">
                            {selectedVariants.has(v.variantId) ? (
                              <input
                                type="number"
                                min="1"
                                max={v.quantity}
                                value={selectedVariants.get(v.variantId) || 1}
                                onChange={(e) => handleVariantSelection(v.variantId, parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                              />
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Upcoming Modal */}
      {showUpcomingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upcoming Stock</h2>
              <button onClick={() => setShowUpcomingModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {!scannerMode ? (
                <>
                  {upcomingProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No upcoming stock</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{upcomingProducts.length} items in transit</p>
                      {upcomingProducts.map((item, i) => (
                        <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Barcode: {item.barcode}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">From: {item.fromStore}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scan Barcode</label>
                    <input
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="Scan or type..."
                      autoFocus
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg"
                    />
                  </div>
                  <button
                    onClick={handleBarcodeSubmit}
                    disabled={!barcodeInput.trim() || admittingBarcode}
                    className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
                  >
                    {admittingBarcode ? 'Admitting...' : 'Admit to Inventory'}
                  </button>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setScannerMode(!scannerMode)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
              >
                <Scan className="w-4 h-4" />
                {scannerMode ? 'List View' : 'Scanner'}
              </button>
              <button
                onClick={() => setShowUpcomingModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}