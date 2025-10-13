'use client';

import { useState, useEffect } from 'react';
import { Search, Barcode, User, Package, Trash2, ShoppingCart, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

interface DefectItem {
  id: string;
  barcode: string;
  productId: number;
  productName: string;
  reason: 'manufacturing' | 'shipping' | 'customer_return' | 'other';
  status: 'pending' | 'approved' | 'sold';
  addedBy: string;
  addedAt: string;
  originalOrderId?: number;
  customerPhone?: string;
  sellingPrice?: number;
  returnReason?: string;
}

interface InventoryItem {
  id: number;
  barcode: string;
  productId: number;
  productName: string;
  status: string;
  location: string;
  sellingPrice: number;
}

interface Order {
  id: number;
  salesBy: string;
  date: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    socialId: string;
  };
  deliveryAddress: {
    division: string;
    district: string;
    city: string;
    zone: string;
    area: string;
    address: string;
    postalCode: string;
  };
  products: Array<{
    id: number;
    productId: number;
    productName: string;
    size: string;
    qty: number;
    price: number;
    discount: number;
    amount: number;
    barcodes?: string[];
  }>;
  amounts: {
    subtotal: number;
    totalDiscount: number;
    vat: number;
    vatRate: number;
    transportCost: number;
    total: number;
  };
  payments: {
    sslCommerz: number;
    advance: number;
    transactionId: string;
    totalPaid: number;
    due: number;
  };
  createdAt: string;
  updatedAt?: string;
  returnHistory?: any[];
  exchangeHistory?: any[];
}

export default function DefectsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [defects, setDefects] = useState<DefectItem[]>([]);
  const [activeTab, setActiveTab] = useState<'defects' | 'returns'>('defects');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedBarcodes, setSelectedBarcodes] = useState<Map<string, string[]>>(new Map());
  const [returnReasons, setReturnReasons] = useState<Map<string, string>>(new Map());
  const [reason, setReason] = useState<DefectItem['reason']>('manufacturing');
  const [loading, setLoading] = useState(false);
  const [refundInfo, setRefundInfo] = useState<{amount: number; message: string} | null>(null);
  const [scannedProduct, setScannedProduct] = useState<InventoryItem | null>(null);
  const [manualScannedProduct, setManualScannedProduct] = useState<InventoryItem | null>(null);

  // Load defects on component mount
  useEffect(() => {
    fetchDefects();
  }, []);

  const fetchDefects = async () => {
    try {
      const response = await fetch('/api/defects');
      if (response.ok) {
        const data = await response.json();
        setDefects(data);
      }
    } catch (error) {
      console.error('Error fetching defects:', error);
    }
  };

  // Find product by barcode
  const findProductByBarcode = async (barcode: string) => {
    try {
      const inventoryResponse = await fetch('/api/inventory');
      const inventory: InventoryItem[] = await inventoryResponse.json();
      return inventory.find(inv => inv.barcode === barcode && inv.status === 'available');
    } catch (error) {
      console.error('Error finding product:', error);
      return null;
    }
  };

  // Handle barcode scanning for direct defect marking
  const handleBarcodeScan = async () => {
    console.log('🔍 handleBarcodeScan called with:', barcodeInput);
    if (!barcodeInput.trim()) {
      console.log('❌ No barcode input');
      return;
    }

    setLoading(true);
    try {
      const item = await findProductByBarcode(barcodeInput);
      console.log('🔍 Found item:', item);
      
      if (!item) {
        alert('Barcode not found or item not available');
        return;
      }

      console.log('🔄 Creating defect item...');
      const defectItem = {
        id: `defect-${Date.now()}`,
        barcode: barcodeInput,
        productId: item.productId,
        productName: item.productName,
        reason,
        status: 'pending' as const,
        addedBy: 'Admin',
        addedAt: new Date().toISOString()
      };

      console.log('📤 Sending to defects API:', defectItem);
      const response = await fetch('/api/defects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defectItem),
      });

      console.log('📥 Defects API response status:', response.status);
      
      if (response.ok) {
        console.log('✅ Defect created successfully');
        await fetchDefects();
        setBarcodeInput('');
        setScannedProduct(null);
        alert('Item marked as defective and removed from stock');
      } else {
        const errorData = await response.json();
        console.error('❌ Defects API error:', errorData);
        alert(`Failed to mark as defective: ${errorData.error}`);
      }
    } catch (error) {
      console.error('💥 Error processing defect:', error);
      alert('Error processing defect - check console for details');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual barcode entry for defects
  const handleManualBarcode = async () => {
    console.log('🔍 handleManualBarcode called with:', manualBarcode);
    if (!manualBarcode.trim()) {
      console.log('❌ No manual barcode input');
      return;
    }

    setLoading(true);
    try {
      const item = await findProductByBarcode(manualBarcode);
      console.log('🔍 Found item:', item);
      
      if (!item) {
        alert('Barcode not found or item not available');
        return;
      }

      console.log('🔄 Creating defect item...');
      const defectItem = {
        id: `defect-${Date.now()}`,
        barcode: manualBarcode,
        productId: item.productId,
        productName: item.productName, 
        reason: reason,
        status: 'pending' as const,
        addedBy: 'Admin',
        addedAt: new Date().toISOString()
      };

      console.log('📤 Sending to defects API:', defectItem);
      const response = await fetch('/api/defects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defectItem),
      });

      console.log('📥 Defects API response status:', response.status);
      
      if (response.ok) {
        console.log('✅ Defect created successfully');
        await fetchDefects();
        setManualBarcode('');
        setManualScannedProduct(null);
        alert('Item marked as defective');
      } else {
        const errorData = await response.json();
        console.error('❌ Defects API error:', errorData);
        alert(`Failed to mark as defective: ${errorData.error}`);
      }
    } catch (error) {
      console.error('💥 Error processing defect:', error);
      alert('Error processing defect - check console for details');
    } finally {
      setLoading(false);
    }
  };

  // Auto-detect product when barcode is entered
  const handleBarcodeInputChange = async (value: string) => {
    setBarcodeInput(value);
    if (value.trim()) {
      const product = await findProductByBarcode(value);
      setScannedProduct(product || null);
    } else {
      setScannedProduct(null);
    }
  };

  const handleManualBarcodeChange = async (value: string) => {
    setManualBarcode(value);
    if (value.trim()) {
      const product = await findProductByBarcode(value);
      setManualScannedProduct(product || null);
      console.log('Manual barcode product found:', product);
    } else {
      setManualScannedProduct(null);
    }
  };

  // Search customers by phone for returns
  const searchCustomers = async () => {
    if (!customerSearch.trim()) return;

    try {
      const response = await fetch('/api/social-orders');
      const orders: Order[] = await response.json();
      
      const filtered = orders.filter(order => 
        order.customer.phone.includes(customerSearch) && 
        order.products.some(p => p.qty > 0)
      );
      
      setSearchResults(filtered);
      setSelectedBarcodes(new Map());
      setReturnReasons(new Map());
      setRefundInfo(null);
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  // Update return reason
  const updateReturnReason = (productId: number, reason: string) => {
    const updated = new Map(returnReasons);
    updated.set(productId.toString(), reason);
    setReturnReasons(updated);
  };

  // Process customer return using your existing API
  const processCustomerReturn = async () => {
    if (!selectedOrder || selectedBarcodes.size === 0) return;

    setLoading(true);
    try {
      console.log('=== STARTING RETURN PROCESS ===');
      console.log('Selected Order ID:', selectedOrder.id);
      console.log('Selected Barcodes:', Array.from(selectedBarcodes.entries()));

      // Prepare returned products data
      const returnedProducts = Array.from(selectedBarcodes.entries()).map(([productId, barcodes]) => {
        const product = selectedOrder.products.find(p => p.id === parseInt(productId));
        return {
          productId: parseInt(productId),
          quantity: barcodes.length,
          productName: product?.productName || 'Unknown',
          price: product?.price || 0,
          amount: (product?.price || 0) * barcodes.length
        };
      });

      const refundAmount = returnedProducts.reduce((total, item) => total + item.amount, 0);

      const returnData = {
        orderId: selectedOrder.id,
        returnedProducts,
        refundAmount
      };

      console.log('Sending to return API:', returnData);

      // Step 1: Call return API to process the return
      const response = await fetch('/api/social-orders/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Return API returned: ${text.substring(0, 100)}`);
      }

      const result = await response.json();
      console.log('Return API response:', result);

      if (!response.ok) {
        throw new Error(result.error || `Return API returned ${response.status}`);
      }

      console.log('Return API successful, now creating defects...');

      // Step 2: Add each returned barcode to defects (this will also update inventory)
      let defectsCreated = 0;
      let defectsErrors = 0;

      for (const [productId, barcodes] of selectedBarcodes.entries()) {
        for (const barcode of barcodes) {
          try {
            const product = selectedOrder.products.find(p => p.id === parseInt(productId));
            
            const defectItem = {
              id: `return-${Date.now()}-${barcode}`,
              barcode: barcode,
              productId: parseInt(productId),
              productName: product?.productName || 'Unknown',
              reason: 'customer_return' as const,
              status: 'pending' as const,
              addedBy: 'Admin',
              addedAt: new Date().toISOString(),
              originalOrderId: selectedOrder.id,
              customerPhone: selectedOrder.customer.phone,
              returnReason: returnReasons.get(productId) || 'defective'
            };

            console.log('Creating defect for barcode:', barcode);
            
            const defectResponse = await fetch('/api/defects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(defectItem),
            });

            if (defectResponse.ok) {
              defectsCreated++;
              console.log('✅ Defect created for barcode:', barcode);
            } else {
              const errorData = await defectResponse.json();
              console.error('❌ Failed to create defect:', errorData);
              defectsErrors++;
            }
          } catch (error) {
            console.error('❌ Error creating defect for barcode:', barcode, error);
            defectsErrors++;
          }
        }
      }

      console.log(`Defects created: ${defectsCreated} success, ${defectsErrors} errors`);

      // Refresh defects list
      await fetchDefects();
      
      // Show success message
      const totalBarcodes = Array.from(selectedBarcodes.values()).flat().length;
      let message = `Return processed successfully! ${defectsCreated} items moved to defects.`;
      
      if (defectsErrors > 0) {
        message += ` (${defectsErrors} errors occurred)`;
      }

      setRefundInfo({
        amount: result.refundAmount || refundAmount,
        message: message
      });

      // Reset form after delay
      setTimeout(() => {
        setSelectedOrder(null);
        setSelectedBarcodes(new Map());
        setReturnReasons(new Map());
        setCustomerSearch('');
        setSearchResults([]);
        setRefundInfo(null);
      }, 5000);

    } catch (error: any) {
      console.error('❌ Full error details:', error);
      alert(`Error processing return: ${error.message}. Check browser console for details.`);
    } finally {
      setLoading(false);
    }
  };

  // Sell defective item
  const sellDefectiveItem = async (defect: DefectItem) => {
    const sellingPrice = prompt('Enter selling price:', defect.sellingPrice?.toString() || '0');
    if (!sellingPrice) return;

    try {
      const response = await fetch(`/api/defects/${defect.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'sold',
          sellingPrice: parseFloat(sellingPrice)
        }),
      });

      if (response.ok) {
        await fetchDefects();
        const saleType = confirm('Sell via POS? Click OK for POS, Cancel for Social Commerce') ? 'pos' : 'social';
        
        if (saleType === 'pos') {
          window.open(`/pos?defect=${defect.id}&price=${sellingPrice}`, '_blank');
        } else {
          window.open(`/social-commerce?defect=${defect.id}&price=${sellingPrice}`, '_blank');
        }
      }
    } catch (error) {
      console.error('Error selling defective item:', error);
      alert('Error selling item');
    }
  };

  // Remove defect
  const removeDefect = async (defectId: string) => {
    if (!confirm('Are you sure you want to remove this defect?')) return;

    try {
      const response = await fetch(`/api/defects/${defectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchDefects();
        alert('Defect removed successfully');
      }
    } catch (error) {
      console.error('Error removing defect:', error);
      alert('Error removing defect');
    }
  };

  const pendingDefects = defects.filter(d => d.status === 'pending');
  const soldDefects = defects.filter(d => d.status === 'sold');

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Defect & Return Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage defective items and process customer returns
                </p>
              </div>

              {/* Success Message */}
              {refundInfo && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-300">
                        Return Processed Successfully!
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        {refundInfo.message} - Refund Amount: ৳{refundInfo.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="mb-6">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('defects')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'defects'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Defect Identification
                    </button>
                    <button
                      onClick={() => setActiveTab('returns')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'returns'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Customer Returns
                    </button>
                  </nav>
                </div>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Input Forms */}
                <div className="lg:col-span-1 space-y-6">
                  {activeTab === 'defects' ? (
                    <>
                      {/* Barcode Scanner */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Barcode className="w-5 h-5" />
                          Scan Barcode
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Barcode Scanner
                            </label>
                            <input
                              type="text"
                              value={barcodeInput}
                              onChange={(e) => handleBarcodeInputChange(e.target.value)}
                              placeholder="Scan barcode here..."
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                              onKeyPress={(e) => e.key === 'Enter' && handleBarcodeScan()}
                            />
                            {scannedProduct && (
                              <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
                                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                  Product Found: {scannedProduct.productName}
                                </p>
                                <p className="text-xs text-green-700 dark:text-green-400">
                                  ID: {scannedProduct.productId} | Price: ৳{scannedProduct.sellingPrice}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-center text-gray-500 dark:text-gray-400">OR</div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Manual Entry
                            </label>
                            <input
                              type="text"
                              value={manualBarcode}
                              onChange={(e) => handleManualBarcodeChange(e.target.value)}
                              placeholder="Enter barcode manually..."
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                              onKeyPress={(e) => e.key === 'Enter' && handleManualBarcode()}
                            />
                            {manualScannedProduct && (
                              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                  Product Found: {manualScannedProduct.productName}
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-400">
                                  ID: {manualScannedProduct.productId} | Price: ৳{manualScannedProduct.sellingPrice}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Reason
                            </label>
                            <select
                              value={reason}
                              onChange={(e) => setReason(e.target.value as DefectItem['reason'])}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="manufacturing">Manufacturing Defect</option>
                              <option value="shipping">Shipping Damage</option>
                              <option value="customer_return">Customer Return</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          
                          {/* FIXED BUTTON - Handles both input methods */}
                          <button
                            onClick={() => {
                              console.log('🎯 Mark as Defective clicked');
                              console.log('Barcode Input:', barcodeInput);
                              console.log('Manual Barcode:', manualBarcode);
                              
                              // Use manual barcode if provided, otherwise use scanned barcode
                              if (manualBarcode.trim()) {
                                console.log('📝 Using manual barcode');
                                handleManualBarcode();
                              } else if (barcodeInput.trim()) {
                                console.log('📟 Using scanned barcode');
                                handleBarcodeScan();
                              }
                            }}
                            disabled={loading || (!barcodeInput && !manualBarcode)}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                          >
                            {loading ? 'Processing...' : 'Mark as Defective'}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Customer Return */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Customer Return
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Customer Phone Number
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                placeholder="Enter phone number..."
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                              />
                              <button
                                onClick={searchCustomers}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                              >
                                <Search className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {searchResults.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select Order
                              </label>
                              <select
                                onChange={(e) => {
                                  const order = searchResults.find(o => o.id === parseInt(e.target.value));
                                  setSelectedOrder(order || null);
                                  setSelectedBarcodes(new Map());
                                  setReturnReasons(new Map());
                                }}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="">Select an order</option>
                                {searchResults.map(order => (
                                  <option key={order.id} value={order.id}>
                                    Order #{order.id} - {order.customer.name} (৳{order.amounts.total})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {selectedOrder && (
                            <div className="space-y-4">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Select Products & Barcodes to Return
                              </label>
                              <div className="space-y-4 max-h-96 overflow-y-auto">
                                {selectedOrder.products.map((product) => (
                                  <div key={product.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <div className="flex justify-between items-start mb-3">
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">{product.productName}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          Qty: {product.qty} × ৳{product.price} = ৳{(product.price * product.qty).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          Product ID: {product.productId}
                                        </p>
                                      </div>
                                      <span className="text-sm font-medium text-green-600 dark:text-green-400 ml-4">
                                        ৳{product.amount.toFixed(2)}
                                      </span>
                                    </div>

                                    <div className="mb-3">
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Select Barcodes to Return ({selectedBarcodes.get(product.id.toString())?.length || 0} selected)
                                      </label>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                        {product.barcodes?.map((barcode) => {
                                          const isSelected = selectedBarcodes.get(product.id.toString())?.includes(barcode) || false;
                                          return (
                                            <label 
                                              key={barcode} 
                                              className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                                                isSelected
                                                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
                                                  : 'bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500'
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                  const updated = new Map(selectedBarcodes);
                                                  const current = updated.get(product.id.toString()) || [];
                                                  
                                                  if (e.target.checked) {
                                                    updated.set(product.id.toString(), [...current, barcode]);
                                                  } else {
                                                    updated.set(product.id.toString(), current.filter(bc => bc !== barcode));
                                                  }
                                                  setSelectedBarcodes(updated);
                                                }}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                              />
                                              <span className="text-xs font-mono text-gray-700 dark:text-gray-300">{barcode}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                      {(!product.barcodes || product.barcodes.length === 0) && (
                                        <p className="text-xs text-red-500 dark:text-red-400 italic">
                                          No barcodes available for this product
                                        </p>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                      <div>
                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Return Reason</label>
                                        <select
                                          value={returnReasons.get(product.id.toString()) || 'defective'}
                                          onChange={(e) => updateReturnReason(product.id, e.target.value)}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                        >
                                          <option value="defective">Defective Product</option>
                                          <option value="wrong_item">Wrong Item</option>
                                          <option value="damaged">Damaged in Shipping</option>
                                          <option value="size_issue">Size Issue</option>
                                          <option value="customer_change_mind">Customer Changed Mind</option>
                                          <option value="other">Other</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="flex gap-2 mt-3">
                                      <button
                                        onClick={() => {
                                          const updated = new Map(selectedBarcodes);
                                          updated.set(product.id.toString(), product.barcodes || []);
                                          setSelectedBarcodes(updated);
                                        }}
                                        className="flex-1 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                      >
                                        Select All
                                      </button>
                                      <button
                                        onClick={() => {
                                          const updated = new Map(selectedBarcodes);
                                          updated.delete(product.id.toString());
                                          setSelectedBarcodes(updated);
                                        }}
                                        className="flex-1 px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                                      >
                                        Clear
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-3">
                                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                    Return Summary
                                  </h4>
                                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                    Total Items: {Array.from(selectedBarcodes.values()).flat().length}
                                  </span>
                                </div>
                                
                                <div className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                                  {Array.from(selectedBarcodes.entries()).map(([productId, barcodes]) => {
                                    if (barcodes.length === 0) return null;
                                    const product = selectedOrder.products.find(p => p.id === parseInt(productId));
                                    return (
                                      <div key={productId} className="flex justify-between">
                                        <span>{product?.productName}:</span>
                                        <span>{barcodes.length} barcode(s)</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <button
                                onClick={processCustomerReturn}
                                disabled={loading || Array.from(selectedBarcodes.values()).flat().length === 0}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-md transition-colors font-medium"
                              >
                                {loading ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing Return...
                                  </div>
                                ) : (
                                  `Process Return (${Array.from(selectedBarcodes.values()).flat().length} barcodes)`
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Right Column - Defects List */}
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Defective Items ({pendingDefects.length})
                      </h3>
                    </div>
                    
                    <div className="overflow-hidden">
                      {pendingDefects.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No defective items found</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Barcode
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Reason
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Added
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {pendingDefects.map((defect) => (
                                <tr key={defect.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {defect.productName}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      ID: {defect.productId}
                                      {defect.customerPhone && (
                                        <div className="text-xs text-blue-600 dark:text-blue-400">
                                          Customer: {defect.customerPhone}
                                        </div>
                                      )}
                                      {defect.returnReason && (
                                        <div className="text-xs text-purple-600 dark:text-purple-400">
                                          Reason: {defect.returnReason}
                                        </div>
                                      )}
                                      {defect.originalOrderId && (
                                        <div className="text-xs text-green-600 dark:text-green-400">
                                          Order: #{defect.originalOrderId}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                                    {defect.barcode}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      defect.reason === 'customer_return' 
                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                                        : defect.reason === 'manufacturing'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                        : defect.reason === 'shipping'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                    }`}>
                                      {defect.reason.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(defect.addedAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button
                                      onClick={() => sellDefectiveItem(defect)}
                                      className="text-green-600 hover:text-green-900 dark:hover:text-green-400 flex items-center gap-1"
                                    >
                                      <ShoppingCart className="w-4 h-4" />
                                      Sell
                                    </button>
                                    <button
                                      onClick={() => removeDefect(defect.id)}
                                      className="text-red-600 hover:text-red-900 dark:hover:text-red-400 flex items-center gap-1"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sold Defects */}
                  {soldDefects.length > 0 && (
                    <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Sold Defective Items ({soldDefects.length})
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Product
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Sold Price
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {soldDefects.map((defect) => (
                              <tr key={defect.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {defect.productName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                                  ৳{defect.sellingPrice?.toFixed(2) || '0.00'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                    Sold
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}