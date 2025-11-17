'use client';

import { useState, useEffect } from 'react';
import { Search, Barcode, User, Package, Trash2, ShoppingCart, AlertCircle, Store, ChevronDown, ChevronUp, Calendar, DollarSign, MapPin, Phone, FileText, Image as ImageIcon, TruckIcon } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import SellDefectModal from '@/components/SellDefectModal';
import defectIntegrationService from '@/services/defectIntegrationService';
import barcodeOrderMapper from '@/services/barcodeOrderMapper';
import storeService from '@/services/storeService';
import defectiveProductService from '@/services/defectiveProductService';
import type { DefectiveProduct } from '@/services/defectiveProductService';
import type { Store } from '@/services/storeService';
interface DefectItem {
  id: string;
  barcode: string;
  productId: number;
  productName: string;
  status: 'pending' | 'approved' | 'sold';
  addedBy: string;
  addedAt: string;
  originalOrderId?: number;
  customerPhone?: string;
  sellingPrice?: number;
  originalSellingPrice?: number;
  costPrice?: number;
  returnReason?: string;
  store?: string;
  image?: string;
}

// Helper function - ADD THIS RIGHT HERE
const formatPrice = (price: number | undefined | null): string => {
  if (price === undefined || price === null) return '0.00';
  const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  if (isNaN(numPrice)) return '0.00';
  return numPrice.toFixed(2);
};

interface Order {
  id: number;
  order_number: string;
  customerName?: string;
  customerPhone?: string;
  customer?: {
    name: string;
    phone: string;
  };
  total_amount?: string;
  amounts?: {
    total: number;
  };
  items: Array<{
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: string;
    barcodes?: string[];
    available_for_return?: number;
  }>;
}

export default function DefectsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [defects, setDefects] = useState<DefectItem[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'identification' | 'returns'>('identification');
  const [expandedDefect, setExpandedDefect] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'defects' | 'used'>('all');
  
  // Defect Identification
  const [barcodeInput, setBarcodeInput] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [isUsedItem, setIsUsedItem] = useState(false);
  const [storeForDefect, setStoreForDefect] = useState('');
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [defectImage, setDefectImage] = useState<File | null>(null);
  
  // Customer Returns
  const [searchType, setSearchType] = useState<'phone' | 'orderId'>('phone');
  const [searchValue, setSearchValue] = useState('');
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [selectedBarcodes, setSelectedBarcodes] = useState<string[]>([]);
  const [storeForReturn, setStoreForReturn] = useState('');
  const [customerReturnReason, setCustomerReturnReason] = useState('');
  const [returnImage, setReturnImage] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Sell modal
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<DefectItem | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [sellType, setSellType] = useState<'pos' | 'social'>('pos');
  
  // Vendor return (will implement later)
  const [returnToVendorModalOpen, setReturnToVendorModalOpen] = useState(false);
  const [selectedDefectsForVendor, setSelectedDefectsForVendor] = useState<string[]>([]);

  useEffect(() => {
    fetchStores();
    fetchDefects();
  }, []);

  useEffect(() => {
    fetchDefects();
  }, [selectedStore]);

  const fetchStores = async () => {
    try {
      const result = await storeService.getStores({ is_active: true });
      if (result.success) {
        // Handle paginated response - extract the data array
        const storesData = Array.isArray(result.data) 
          ? result.data 
          : (result.data?.data || []);
        setStores(storesData);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

// Update the fetchDefects function in your React component

// Updated fetchDefects function with debugging and fixes

const fetchDefects = async () => {
  try {
    const filters: any = {};
    if (selectedStore !== 'all') {
      filters.store_id = parseInt(selectedStore);
    }
    
    const result = await defectIntegrationService.getDefectiveProducts(filters);
    
    console.log('Raw API response:', result); // Debug log
    
    // Handle paginated response - extract the data array
    const defectiveData = result.data?.data || result.data || [];
    
    console.log('Defective data:', defectiveData); // Debug log
    
    // Transform backend data to frontend format
    const transformedDefects: DefectItem[] = defectiveData.map((d: DefectiveProduct) => {
      // ✅ FIX: Construct full image URL from storage path
      let imageUrl: string | undefined = undefined;
      
      console.log('Processing defect:', {
        id: d.id,
        defect_images: d.defect_images,
        image_urls: (d as any).image_urls
      }); // Debug log
      
      if (d.defect_images && Array.isArray(d.defect_images) && d.defect_images.length > 0) {
        const imagePath = d.defect_images[0];
        
        // Check if it's already a full URL
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
          imageUrl = imagePath;
        } else {
          // Construct the URL
          // Remove any leading slashes from imagePath
          const cleanPath = imagePath.replace(/^\/+/, '');
          
          // Get the API URL from environment or use relative path
          let apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          
          // Remove /api from the end if it exists
          apiUrl = apiUrl.replace(/\/api\/?$/, '');
          
          // Construct full URL
          if (apiUrl) {
            imageUrl = `${apiUrl}/storage/${cleanPath}`;
          } else {
            // If no API URL, use relative path
            imageUrl = `/storage/${cleanPath}`;
          }
        }
        
        console.log('Constructed image URL:', imageUrl); // Debug log
      }

      

      // ✅ FIX: Handle decimal conversion properly
      const parsePrice = (value: any): number | undefined => {
        if (value === null || value === undefined) return undefined;
        const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
        return isNaN(parsed) ? undefined : parsed;
      };

      return {
        id: d.id.toString(),
        barcode: d.barcode?.barcode || '',
        productId: d.product_id,
        productName: d.product?.name || 'Unknown Product',
        status: d.status === 'available_for_sale' ? 'approved' : 
                d.status === 'sold' ? 'sold' : 'pending',
        addedBy: d.identifiedBy?.name || 'System',
        addedAt: d.identified_at,
        originalSellingPrice: parsePrice(d.original_price),
        costPrice: parsePrice(d.product?.cost_price),
        returnReason: d.defect_description,
        store: d.store?.name,
        image: imageUrl,
        sellingPrice: parsePrice(d.suggested_selling_price),
      };
    });
    
    console.log('Transformed defects:', transformedDefects); // Debug log
    
    setDefects(transformedDefects);
  } catch (error: any) {
    console.error('Error fetching defects:', error);
    setErrorMessage(error.message || 'Failed to fetch defects');
    setTimeout(() => setErrorMessage(''), 5000);
  }
};

  const handleBarcodeCheck = async (value: string) => {
    setBarcodeInput(value);
    if (value.trim().length > 3) {
      try {
        const scanResult = await defectIntegrationService.scanBarcode(value);
        setScannedProduct(scanResult);
      } catch (error) {
        setScannedProduct(null);
      }
    } else {
      setScannedProduct(null);
    }
  };

  const handleDefectImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDefectImage(e.target.files[0]);
    }
  };

  const handleReturnImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReturnImage(e.target.files[0]);
    }
  };

const handleMarkAsDefective = async () => {
  if (!barcodeInput.trim()) {
    alert('Please enter barcode');
    return;
  }

  if (!isUsedItem && !returnReason) {
    alert('Please enter return reason or mark as used');
    return;
  }

  if (!storeForDefect) {
    alert('Please select the store location');
    return;
  }

  setLoading(true);
  try {
    await defectIntegrationService.markAsDefective({
      barcode: barcodeInput,
      store_id: parseInt(storeForDefect),
      defect_type: isUsedItem ? 'other' : 'physical_damage',
      defect_description: isUsedItem 
        ? 'USED_ITEM - Product has been used/opened by customer'
        : returnReason,
      severity: isUsedItem ? 'minor' : 'moderate',
      is_used_item: isUsedItem,
      defect_images: defectImage ? [defectImage] : undefined, // ✅ FIX: Pass the image file
      internal_notes: `Identified by employee at store ${storeForDefect}`,
    });

    setSuccessMessage(isUsedItem ? 'Item marked as used successfully!' : 'Item marked as defective successfully!');
    setBarcodeInput('');
    setReturnReason('');
    setIsUsedItem(false);
    setStoreForDefect('');
    setScannedProduct(null);
    setDefectImage(null); // ✅ Clear the image state
    fetchDefects();
    setTimeout(() => setSuccessMessage(''), 3000);
  } catch (error: any) {
    console.error('Error:', error);
    alert(error.message || 'Error processing defect');
  } finally {
    setLoading(false);
  }
};
  const handleSearchCustomer = async () => {
    if (!searchValue.trim()) {
      alert('Please enter search value');
      return;
    }

    if (!storeForReturn) {
      alert('Please select a store first');
      return;
    }

    setLoading(true);
    try {
      const orders = await defectIntegrationService.searchCustomerOrders(
        searchType,
        searchValue
      );

      if (orders.length === 0) {
        alert('No orders found');
        setCustomerOrders([]);
        return;
      }

      // Enrich orders with barcode information
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          try {
            const orderWithBarcodes = await barcodeOrderMapper.getOrderWithBarcodes(order.id);
            return orderWithBarcodes;
          } catch (error) {
            console.error('Error enriching order:', error);
            return order;
          }
        })
      );

      setCustomerOrders(enrichedOrders as Order[]);
      setSelectedOrder('');
      setSelectedBarcodes([]);
    } catch (error: any) {
      console.error('Error searching:', error);
      alert(error.message || 'Error searching orders');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrder(orderId);
    setSelectedBarcodes([]);
  };

  const handleBarcodeToggle = (barcode: string) => {
    setSelectedBarcodes(prev =>
      prev.includes(barcode)
        ? prev.filter(b => b !== barcode)
        : [...prev, barcode]
    );
  };

  const handleProcessReturn = async () => {
    if (!selectedOrder || selectedBarcodes.length === 0 || !storeForReturn || !customerReturnReason) {
      alert('Please select order, barcodes, store, and provide return reason');
      return;
    }

    setLoading(true);
    try {
      // Validate barcodes first
      const validation = await barcodeOrderMapper.validateBarcodesForReturn(
        parseInt(selectedOrder),
        selectedBarcodes
      );

      if (!validation.valid) {
        alert('Validation errors: ' + validation.errors.join(', '));
        return;
      }

      if (validation.warnings.length > 0) {
        const proceed = confirm(
          'Warnings found:\n' + validation.warnings.join('\n') + '\n\nContinue anyway?'
        );
        if (!proceed) return;
      }

      // Upload return image if exists
      let imageUrl: string | undefined;
      if (returnImage) {
        imageUrl = await defectIntegrationService.uploadImage(returnImage);
      }

      // Create customer return
      await defectIntegrationService.createCustomerReturn({
        order_id: parseInt(selectedOrder),
        selected_barcodes: selectedBarcodes,
        return_reason: customerReturnReason,
        return_type: 'defective',
        store_id: parseInt(storeForReturn),
        customer_notes: `Customer return - ${customerReturnReason}`,
        attachments: imageUrl ? [imageUrl] : undefined,
      });

      setSuccessMessage(`Successfully processed return for ${selectedBarcodes.length} items!`);
      setSearchValue('');
      setSelectedOrder('');
      setCustomerOrders([]);
      setSelectedBarcodes([]);
      setCustomerReturnReason('');
      setReturnImage(null);
      fetchDefects();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error: any) {
      console.error('Error processing return:', error);
      alert(error.message || 'Error processing return');
    } finally {
      setLoading(false);
    }
  };

  const handleSellClick = (defect: DefectItem) => {
    setSelectedDefect(defect);
    setSellPrice(defect.sellingPrice?.toString() || '');
    setSellType('pos');
    setSellModalOpen(true);
  };

  const handleSell = async () => {
    if (!selectedDefect || !sellPrice) {
      alert('Please enter selling price');
      return;
    }

    setLoading(true);
    try {
      setSellModalOpen(false);

      // Store defect data for POS/Social Commerce
      const defectData = {
        id: selectedDefect.id,
        barcode: selectedDefect.barcode,
        productId: selectedDefect.productId,
        productName: selectedDefect.productName,
        sellingPrice: parseFloat(sellPrice),
        store: selectedDefect.store
      };

      sessionStorage.setItem('defectItem', JSON.stringify(defectData));

      // Redirect to selling interface
      const url = sellType === 'pos'
        ? `/pos?defect=${selectedDefect.id}`
        : `/social-commerce?defect=${selectedDefect.id}`;
      window.location.href = url;
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Error processing sale');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (defectId: string) => {
    if (!confirm('Are you sure you want to remove this defect?')) return;

    try {
      await defectiveProductService.dispose(parseInt(defectId), {
        disposal_notes: 'Removed by employee',
      });
      
      fetchDefects();
      setSuccessMessage('Defect removed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error removing defect:', error);
      alert(error.message || 'Error removing defect');
    }
  };

  const toggleDefectSelection = (defectId: string) => {
    setSelectedDefectsForVendor(prev =>
      prev.includes(defectId)
        ? prev.filter(id => id !== defectId)
        : [...prev, defectId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDefectsForVendor.length === pendingDefects.length) {
      setSelectedDefectsForVendor([]);
    } else {
      setSelectedDefectsForVendor(pendingDefects.map(d => d.id));
    }
  };

  const toggleDefectDetails = (defectId: string) => {
    setExpandedDefect(expandedDefect === defectId ? null : defectId);
  };

  const pendingDefects = defects.filter(d => {
    const isPending = d.status === 'pending' || d.status === 'approved';
    if (!isPending) return false;
    
    if (filterType === 'all') return true;
    if (filterType === 'used') return d.returnReason?.includes('USED_ITEM');
    if (filterType === 'defects') return !d.returnReason?.includes('USED_ITEM');
    return true;
  });
  
  const soldDefects = defects.filter(d => d.status === 'sold');

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
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Defect & Return Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage defective items and process customer returns
                </p>
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="text-green-800 dark:text-green-300">{successMessage}</p>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-red-800 dark:text-red-300">{errorMessage}</p>
                </div>
              )}

              {/* Store Selection */}
              <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Store className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Store Selection</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Select store to view defects • Barcode scanning auto-detects store
                      </p>
                    </div>
                  </div>
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">View all stores</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('identification')}
                  className={`px-4 py-2 font-medium ${
                    activeTab === 'identification'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Defect Identification
                </button>
                <button
                  onClick={() => setActiveTab('returns')}
                  className={`px-4 py-2 font-medium ${
                    activeTab === 'returns'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Customer Returns
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Form */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  {activeTab === 'identification' ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Barcode className="w-5 h-5" />
                        Scan Barcode
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Barcode Scanner / Manual Entry
                          </label>
                          <input
                            type="text"
                            value={barcodeInput}
                            onChange={(e) => handleBarcodeCheck(e.target.value)}
                            placeholder="Scan or enter barcode..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          {scannedProduct && (
                            <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
                              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                {scannedProduct.product?.name}
                              </p>
                              <p className="text-xs text-green-700 dark:text-green-400">
                                Available: {scannedProduct.is_available ? 'Yes' : 'No'} • 
                                Location: {scannedProduct.current_location?.name || 'N/A'}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Used Item Checkbox */}
                        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                          <input
                            type="checkbox"
                            id="isUsed"
                            checked={isUsedItem}
                            onChange={(e) => {
                              setIsUsedItem(e.target.checked);
                              if (e.target.checked) {
                                setReturnReason('');
                              }
                            }}
                            className="mt-0.5 w-4 h-4"
                          />
                          <label htmlFor="isUsed" className="flex-1 cursor-pointer">
                            <div className="text-sm font-medium text-blue-900 dark:text-blue-300">
                              Mark as Used Item
                            </div>
                            <div className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                              Check this if the item has been used/opened by customer
                            </div>
                          </label>
                        </div>

                        {!isUsedItem && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Return Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={returnReason}
                              onChange={(e) => setReturnReason(e.target.value)}
                              placeholder="Enter return reason..."
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Defect Image
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleDefectImageChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Store Location <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={storeForDefect}
                            onChange={(e) => setStoreForDefect(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="">Select store...</option>
                            {stores.map(store => (
                              <option key={store.id} value={store.id}>
                                {store.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={handleMarkAsDefective}
                          disabled={loading}
                          className="w-full py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-md"
                        >
                          {loading ? 'Processing...' : (isUsedItem ? 'Mark as Used' : 'Mark as Defective')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Customer Return
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Return to Store <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={storeForReturn}
                            onChange={(e) => setStoreForReturn(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="">Select store first...</option>
                            {stores.map(store => (
                              <option key={store.id} value={store.id}>
                                {store.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Return Reason <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={customerReturnReason}
                            onChange={(e) => setCustomerReturnReason(e.target.value)}
                            placeholder="Enter customer return reason..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Return Image
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleReturnImageChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Search Type
                          </label>
                          <div className="flex gap-2 mb-2">
                            <button
                              onClick={() => {
                                setSearchType('phone');
                                setSearchValue('');
                                setCustomerOrders([]);
                              }}
                              className={`flex-1 py-2 px-3 border rounded text-sm font-medium ${
                                searchType === 'phone'
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              Phone Number
                            </button>
                            <button
                              onClick={() => {
                                setSearchType('orderId');
                                setSearchValue('');
                                setCustomerOrders([]);
                              }}
                              className={`flex-1 py-2 px-3 border rounded text-sm font-medium ${
                                searchType === 'orderId'
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              Order ID
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {searchType === 'phone' ? 'Customer Phone Number' : 'Order ID'}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={searchValue}
                              onChange={(e) => setSearchValue(e.target.value)}
                              placeholder={searchType === 'phone' ? '018...' : 'Enter order ID...'}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              disabled={!storeForReturn}
                            />
                            <button
                              onClick={handleSearchCustomer}
                              disabled={!storeForReturn || loading}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md"
                            >
                              <Search className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {customerOrders.length > 0 && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select Order
                              </label>
                              <select
                                value={selectedOrder}
                                onChange={(e) => handleOrderSelect(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="">Select order...</option>
                                {customerOrders.map(order => {
                                  const name = order.customer?.name || 'Unknown';
                                  const total = order.total_amount || '0';
                                  return (
                                    <option key={order.id} value={order.id}>
                                      Order #{order.order_number} - {name} (৳{total})
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            {selectedOrder && (
                              <>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select Products & Barcodes ({selectedBarcodes.length} selected)
                                  </label>
                                  <div className="border border-gray-300 dark:border-gray-600 rounded-md max-h-64 overflow-y-auto">
                                    {customerOrders
                                      .find(o => o.id.toString() === selectedOrder)
                                      ?.items.map((item, idx) => (
                                        <div key={idx} className="p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                          <div className="mb-2">
                                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                                              {item.product_name}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                              Qty: {item.quantity} × ৳{item.unit_price} • Available for return: {item.available_for_return || item.quantity}
                                            </p>
                                          </div>
                                          <div className="space-y-1">
                                            {item.barcodes && item.barcodes.length > 0 ? (
                                              item.barcodes.map((barcode, bIdx) => (
                                                <label
                                                  key={bIdx}
                                                  className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={selectedBarcodes.includes(barcode)}
                                                    onChange={() => handleBarcodeToggle(barcode)}
                                                    className="w-4 h-4"
                                                  />
                                                  <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                                    {barcode}
                                                  </span>
                                                </label>
                                              ))
                                            ) : (
                                              <p className="text-xs text-orange-500 italic p-2">
                                                No barcodes tracked for this item
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>

                                <button
                                  onClick={handleProcessReturn}
                                  disabled={loading || selectedBarcodes.length === 0}
                                  className="w-full py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-md"
                                >
                                  {loading ? 'Processing...' : `Return ${selectedBarcodes.length} Item(s)`}
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Right Panel - Defects List */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Pending Defects */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Defective Items ({pendingDefects.length})
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedStore === 'all' ? 'All stores' : stores.find(s => s.id.toString() === selectedStore)?.name}
                        </span>
                      </div>
                      
                      {/* Filter Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setFilterType('all')}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            filterType === 'all'
                              ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setFilterType('defects')}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            filterType === 'defects'
                              ? 'bg-red-600 text-white'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
                          }`}
                        >
                          Defects
                        </button>
                        <button
                          onClick={() => setFilterType('used')}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            filterType === 'used'
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30'
                          }`}
                        >
                          Used
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {pendingDefects.length === 0 ? (
                        <div className="p-8 text-center">
                          <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-500 dark:text-gray-400">No defective items found</p>
                        </div>
                      ) : (
                        pendingDefects.map((defect) => (
                          <div key={defect.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="px-4 py-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                      {defect.productName}
                                    </h4>
                                    {defect.returnReason?.includes('USED_ITEM') ? (
                                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded font-medium">
                                        Used
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                                        Defect
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                      <Barcode className="w-3 h-3" />
                                      {defect.barcode}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {defect.store || 'N/A'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(defect.addedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toggleDefectDetails(defect.id)}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                                  >
                                    {expandedDefect === defect.id ? (
                                      <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleSellClick(defect)}
                                    className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                    title="Sell"
                                  >
                                    <ShoppingCart className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRemove(defect.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title="Remove"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedDefect === defect.id && (
                              <div className="px-4 pb-4 pt-2 bg-gray-50 dark:bg-gray-900/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {defect.image ? (
                                    <div className="space-y-2">
                                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                        <ImageIcon className="w-3 h-3" />
                                        Defect Image
                                      </h5>
                                      <div className="relative aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                                        <img
                                          src={defect.image}
                                          alt="Defect"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg">
                                      <div className="text-center">
                                        <ImageIcon className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                                        <p className="text-xs text-gray-500">No image</p>
                                      </div>
                                    </div>
                                  )}

                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <p className="text-gray-500 dark:text-gray-400 mb-0.5">Product ID</p>
                                        <p className="text-gray-900 dark:text-white font-medium">#{defect.productId}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500 dark:text-gray-400 mb-0.5">Added By</p>
                                        <p className="text-gray-900 dark:text-white font-medium">{defect.addedBy}</p>
                                      </div>
                                    </div>

                                    {defect.returnReason && (
                                      <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                          <FileText className="w-3 h-3" />
                                          Reason
                                        </p>
                                        <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                                          {defect.returnReason}
                                        </p>
                                      </div>
                                    )}

                                    {(defect.costPrice || defect.originalSellingPrice) && (
                                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        {defect.costPrice && (
                                          <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Cost Price</p>
                                            <p className="text-sm text-gray-900 dark:text-white font-medium">
                                              ৳{formatPrice(defect.costPrice)}
                                            </p>
                                          </div>
                                        )}
                                        {defect.originalSellingPrice && (
                                          <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Original Price</p>
                                            <p className="text-sm text-gray-900 dark:text-white font-medium">
                                              ৳{formatPrice(defect.originalSellingPrice)}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Sold Defects */}
                  {soldDefects.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Sold Defective Items ({soldDefects.length})
                        </h3>
                      </div>

                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {soldDefects.map((defect) => (
                          <div key={defect.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                {defect.productName}
                              </h4>
                              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                                Sold
                              </span>
                            </div>
                            <div className="flex items-center gap-x-4 text-xs text-gray-600 dark:text-gray-400">
                              <span>{defect.barcode}</span>
                              <span>৳{formatPrice(defect.sellingPrice)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Sell Modal */}
      {selectedDefect && (
        <SellDefectModal
          isOpen={sellModalOpen}
          onClose={() => setSellModalOpen(false)}
          defect={selectedDefect}
          sellPrice={sellPrice}
          setSellPrice={setSellPrice}
          sellType={sellType}
          setSellType={setSellType}
          onSell={handleSell}
          loading={loading}
        />
      )}
    </div>
  );
}