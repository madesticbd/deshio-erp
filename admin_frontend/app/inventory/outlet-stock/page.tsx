'use client';

import { useState, useEffect } from 'react';
import { Phone, Package, Search, X, Scan } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useSearchParams } from 'next/navigation';

interface Product {
  productId: number;
  productName: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
}

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

interface Store {
  id: string;
  name: string;
  location: string;
  contact: string;
  totalStock: number;
}

export default function OutletManageStockPage() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get('storeId');
  
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [destinationOutlet, setDestinationOutlet] = useState('');
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [upcomingProducts, setUpcomingProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Map<number, number>>(new Map());
  const [stores, setStores] = useState<Store[]>([]);
  const [isTransferring, setIsTransferring] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [admittingBarcode, setAdmittingBarcode] = useState(false);

  useEffect(() => {
    // Fetch store details
    const fetchStore = async () => {
      try {
        console.log('Fetching store with ID:', storeId);
        const response = await fetch('/api/stores');
        if (response.ok) {
          const data = await response.json();
          console.log('All stores:', data);
          setStores(data); // Store all stores for dropdown
          const foundStore = data.find((s: any) => s.id == storeId);
          console.log('Found store:', foundStore);
          if (foundStore) {
            setStore({
              id: foundStore.id,
              name: foundStore.name,
              location: foundStore.location,
              contact: foundStore.contact || '01764257445',
              totalStock: foundStore.products || 99
            });
          } else {
            console.warn('Store not found, using default');
            setStore({
              id: storeId || '0',
              name: 'Store Name',
              location: 'Location',
              contact: '01764257445',
              totalStock: 99
            });
          }
        } else {
          console.error('Failed to fetch stores:', response.status);
          setStore({
            id: storeId || '0',
            name: 'Store Name',
            location: 'Location',
            contact: '01764257445',
            totalStock: 99
          });
        }
      } catch (error) {
        console.error('Error fetching store:', error);
        setStore({
          id: storeId || '0',
          name: 'Store Name',
          location: 'Location',
          contact: '01764257445',
          totalStock: 99
        });
      }
    };

    if (storeId) {
      fetchStore();
    } else {
      setStore({
        id: '0',
        name: 'Store Name',
        location: 'Location',
        contact: '01764257445',
        totalStock: 99
      });
    }
  }, [storeId]);

  // Fetch products when store is set
  useEffect(() => {
    if (store) {
      const fetchProducts = async () => {
        try {
          const inventoryResponse = await fetch('/api/inventory');
          if (!inventoryResponse.ok) {
            console.error('Failed to fetch inventory');
            return;
          }
          const inventoryData: InventoryItem[] = await inventoryResponse.json();
          
          const productsResponse = await fetch('/api/products');
          let productsData: any[] = [];
          if (productsResponse.ok) {
            productsData = await productsResponse.json();
            setAllProducts(productsData);
          }
          
          const batchResponse = await fetch('/api/batch');
          let batchData: any[] = [];
          if (batchResponse.ok) {
            batchData = await batchResponse.json();
          }
          
          const storeInventory = inventoryData.filter(
            (item) => item.location === store.name && item.status === 'available'
          );
          
          const productMap = new Map<number, Product>();
          
          storeInventory.forEach((item) => {
            if (productMap.has(item.productId)) {
              const existing = productMap.get(item.productId)!;
              existing.quantity += 1;
            } else {
              const productInfo = productsData.find(p => p.id === item.productId);
              const productName = productInfo ? productInfo.name : `Product #${item.productId}`;
              
              const batchInfo = batchData.find(b => b.id === item.batchId);
              const costPrice = batchInfo ? batchInfo.costPrice : item.costPrice;
              const sellingPrice = batchInfo ? batchInfo.sellingPrice : item.sellingPrice;
              
              productMap.set(item.productId, {
                productId: item.productId,
                productName,
                costPrice,
                sellingPrice,
                quantity: 1
              });
            }
          });
          
          const groupedProducts = Array.from(productMap.values());
          setProducts(groupedProducts);
          
          setStore({
            ...store,
            totalStock: storeInventory.length
          });
        } catch (error) {
          console.error('Error fetching products:', error);
        }
      };

      fetchProducts();
    }
  }, [store?.name]);

  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShowUpcoming = () => {
    setShowUpcomingModal(true);
    fetchUpcomingStock();
  };

  const fetchUpcomingStock = async () => {
    try {
      const response = await fetch(`/api/inventory-dispatch?toStore=${encodeURIComponent(store?.name || '')}&status=in-transit`);
      if (response.ok) {
        const dispatches = await response.json();
        
        // Fetch product details for each dispatch
        const productsResponse = await fetch('/api/products');
        let productsData: any[] = [];
        if (productsResponse.ok) {
          productsData = await productsResponse.json();
        }
        
        // Enrich dispatch data with product names
        const enrichedDispatches = dispatches.map((dispatch: any) => {
          const product = productsData.find(p => p.id === dispatch.productId);
          return {
            ...dispatch,
            productName: product ? product.name : `Product #${dispatch.productId}`
          };
        });
        
        setUpcomingProducts(enrichedDispatches);
      }
    } catch (error) {
      console.error('Error fetching upcoming stock:', error);
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim() || !store) return;

    setAdmittingBarcode(true);

    try {
      // Find the dispatch item with this barcode
      const dispatchItem = upcomingProducts.find(item => item.barcode === barcodeInput.trim());
      
      if (!dispatchItem) {
        alert('Barcode not found in upcoming stock for this store');
        setAdmittingBarcode(false);
        return;
      }

      // Create inventory entry
      const inventoryEntry = {
        id: dispatchItem.inventoryId,
        productId: dispatchItem.productId,
        batchId: dispatchItem.batchId,
        barcode: dispatchItem.barcode,
        costPrice: dispatchItem.costPrice || 0,
        sellingPrice: dispatchItem.sellingPrice || 0,
        location: store.name,
        status: 'available',
        admittedAt: new Date().toISOString(),
        createdAt: dispatchItem.createdAt
      };

      // Update inventory
      const inventoryResponse = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inventoryEntry)
      });

      if (!inventoryResponse.ok) {
        throw new Error('Failed to update inventory');
      }

      // Update dispatch status to completed
      const dispatchUpdateResponse = await fetch('/api/inventory-dispatch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: dispatchItem.id,
          status: 'completed',
          receivedAt: new Date().toISOString()
        })
      });

      if (!dispatchUpdateResponse.ok) {
        throw new Error('Failed to update dispatch record');
      }

      alert(`Successfully admitted ${dispatchItem.productName} to inventory`);
      
      // Clear input and refresh upcoming products
      setBarcodeInput('');
      fetchUpcomingStock();
      
    } catch (error) {
      console.error('Error admitting barcode:', error);
      alert('Failed to admit product. Please try again.');
    } finally {
      setAdmittingBarcode(false);
    }
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    const newSelected = new Map(selectedProducts);
    if (quantity > 0) {
      newSelected.set(productId, quantity);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleTransfer = async () => {
    if (!destinationOutlet || selectedProducts.size === 0) {
      alert('Please select a destination outlet and at least one product to transfer');
      return;
    }

    setIsTransferring(true);

    try {
      const inventoryResponse = await fetch('/api/inventory');
      if (!inventoryResponse.ok) throw new Error('Failed to fetch inventory');
      const inventoryData: InventoryItem[] = await inventoryResponse.json();

      const destinationStore = stores.find(s => s.id == destinationOutlet);
      if (!destinationStore) throw new Error('Destination store not found');

      const dispatchRecords = [];
      const inventoryUpdates = [];

      for (const [productId, quantity] of selectedProducts.entries()) {
        const availableItems = inventoryData.filter(
          item => item.productId === productId && 
                  item.location === store?.name && 
                  item.status === 'available'
        ).slice(0, quantity);

        if (availableItems.length < quantity) {
          alert(`Not enough stock for product ${productId}. Available: ${availableItems.length}, Requested: ${quantity}`);
          setIsTransferring(false);
          return;
        }

        for (const item of availableItems) {
          dispatchRecords.push({
            id: Date.now() + Math.random(),
            inventoryId: item.id,
            productId: item.productId,
            batchId: item.batchId,
            barcode: item.barcode,
            costPrice: item.costPrice,
            sellingPrice: item.sellingPrice,
            fromStore: store?.name,
            fromStoreId: store?.id,
            fromLocation: store?.location,
            toStore: destinationStore.name,
            toStoreId: destinationStore.id,
            toLocation: destinationStore.location,
            status: 'in-transit',
            dispatchedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          });

          inventoryUpdates.push({
            ...item,
            status: 'in-transit',
            location: `In Transit to ${destinationStore.name}`
          });
        }
      }

      const dispatchResponse = await fetch('/api/inventory-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dispatchRecords)
      });

      if (!dispatchResponse.ok) throw new Error('Failed to create dispatch records');

      for (const update of inventoryUpdates) {
        await fetch('/api/inventory', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
      }

      alert(`Successfully dispatched ${inventoryUpdates.length} items to ${destinationStore.name}`);
      
      setSelectedProducts(new Map());
      setDestinationOutlet('');
      
      window.location.reload();
    } catch (error) {
      console.error('Transfer error:', error);
      alert('Failed to transfer stock. Please try again.');
    } finally {
      setIsTransferring(false);
    }
  };

  if (!store) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header 
              darkMode={darkMode} 
              setDarkMode={setDarkMode}
              toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />
            <main className="flex-1 overflow-auto p-6 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading store details...</p>
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
          <Header 
            darkMode={darkMode} 
            setDarkMode={setDarkMode}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">Contact</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {store.contact}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                  <Package className="w-4 h-4" />
                  <span className="text-sm font-medium">Total Stock</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {store.totalStock}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Transfer Stock
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Transfer inventory from this outlet to another location
                  </p>
                </div>
                <button
                  onClick={handleShowUpcoming}
                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Upcoming Quantity
                </button>
              </div>

              <select
                value={destinationOutlet}
                onChange={(e) => setDestinationOutlet(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500"
              >
                <option value="">Select destination outlet</option>
                {stores
                  .filter(s => s.id != storeId)
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.location}
                    </option>
                  ))}
              </select>

              {selectedProducts.size > 0 && destinationOutlet && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleTransfer}
                    disabled={isTransferring}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {isTransferring ? 'Transferring...' : `Transfer ${Array.from(selectedProducts.values()).reduce((a, b) => a + b, 0)} Items`}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Filters
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Product Name (Press Enter to continue)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Current Inventory
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Stock levels at this outlet location
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Select
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Product Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Cost Price
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Selling Price
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Available Stock
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Quantity to Transfer
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No products found
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr
                          key={product.productId}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={selectedProducts.has(product.productId)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleQuantityChange(product.productId, 1);
                                } else {
                                  handleQuantityChange(product.productId, 0);
                                }
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            {product.productName}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            ${product.costPrice}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            ${product.sellingPrice}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            {product.quantity}
                          </td>
                          <td className="py-3 px-4">
                            {selectedProducts.has(product.productId) ? (
                              <input
                                type="number"
                                min="1"
                                max={product.quantity}
                                value={selectedProducts.get(product.productId) || 1}
                                onChange={(e) => handleQuantityChange(product.productId, parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
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

      {showUpcomingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Upcoming Stock Information
                </h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setScannerActive(!scannerActive)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      scannerActive
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <Scan className={`w-4 h-4 ${
                      scannerActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`} />
                    <div className="text-left">
                      <div className={`text-xs font-semibold ${
                        scannerActive ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'
                      }`}>
                        Barcode Scanner
                      </div>
                      <div className={`text-xs ${
                        scannerActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {scannerActive ? 'Click to activate admission' : 'Click to view list'}
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      scannerActive ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  </button>
                  <button
                    onClick={() => setShowUpcomingModal(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {!scannerActive ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Scan or enter barcode to admit products into inventory
                    </p>
                  </div>
                  
                  <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enter Barcode
                      </label>
                      <input
                        type="text"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        placeholder="Scan or type barcode..."
                        autoFocus
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={admittingBarcode}
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={!barcodeInput.trim() || admittingBarcode}
                      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {admittingBarcode ? 'Admitting...' : 'Admit to Inventory'}
                    </button>
                  </form>

                  {upcomingProducts.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Expected Items ({upcomingProducts.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {upcomingProducts.map((product, index) => (
                          <div
                            key={index}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {product.productName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Barcode: {product.barcode}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  From: {product.fromStore}
                                </p>
                              </div>
                              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded">
                                In Transit
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {upcomingProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No upcoming products found for this outlet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {upcomingProducts.length} item(s) in transit to this store
                      </p>
                      {upcomingProducts.map((product, index) => (
                        <div
                          key={index}
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {product.productName}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Barcode: {product.barcode}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                From: {product.fromStore} ({product.fromLocation})
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                Dispatched: {new Date(product.dispatchedAt).toLocaleString()}
                              </p>
                            </div>
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded">
                              {product.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowUpcomingModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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