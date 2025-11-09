'use client';

import { useState, useEffect } from 'react';
import { Search, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import StoreCard from '@/components/StoreCard';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { batchService, storeService, type Batch, type Store } from '@/services';

interface StoreCardData {
  id: string;
  name: string;
  location: string;
  type: 'Warehouse' | 'Store';
  pathao_key: string;
  revenue: number;
  revenueChange: number;
  products: number;
  orders: number;
}

export default function ManageStockPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [stores, setStores] = useState<StoreCardData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [userStoreId, setUserStoreId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const role = localStorage.getItem('userRole') || '';
    const storeId = localStorage.getItem('storeId') || '';
    setUserRole(role);
    setUserStoreId(storeId);
    fetchData(role, storeId);
  }, []);

  const fetchData = async (role: string, storeId: string) => {
    setLoading(true);
    setError('');

    try {
      // Fetch batches for super_admin
      if (role !== 'store_manager') {
        try {
          console.log('🔍 Fetching batches...');
          
          // Fetch ALL batches, don't filter by status in API call
          // We'll filter on frontend for more control
          const batchesArray = await batchService.getBatchesArray({
            per_page: 100,
          });

          console.log('📦 Raw batches fetched:', batchesArray);
          console.log('📊 Total batches:', batchesArray.length);

          // Log each batch status for debugging
          batchesArray.forEach(batch => {
            console.log(`Batch ${batch.id}:`, {
              batch_number: batch.batch_number,
              status: batch.status,
              quantity: batch.quantity,
              is_active: batch.is_active,
            });
          });

          // Filter for batches that should be displayed
          // Accept multiple statuses that make sense for "pending" batches
          const pendingBatches = batchesArray.filter((batch: Batch) => {
            const hasQuantity = batch.quantity > 0;
            const isNotInactive = batch.status !== 'inactive';
            
            // Show batches that have stock and aren't explicitly inactive
            const shouldShow = hasQuantity && isNotInactive;
            
            if (!shouldShow) {
              console.log(`❌ Filtered out batch ${batch.id}:`, {
                reason: !hasQuantity ? 'No quantity' : 'Inactive status',
                status: batch.status,
                quantity: batch.quantity
              });
            }
            
            return shouldShow;
          });

          console.log('✅ Pending batches after filter:', pendingBatches.length);
          console.log('📋 Batches to display:', pendingBatches);

          setBatches(pendingBatches);
          
        } catch (batchError: any) {
          console.error('❌ Error fetching batches:', batchError);
          console.error('Error response:', batchError.response?.data);
          // Don't show error to user, just log it
          setBatches([]);
        }
      }

      // Fetch stores
      try {
        console.log('🏪 Fetching stores...');
        const storesResponse = await storeService.getStores({ is_active: true });
        
        console.log('📦 Stores response:', storesResponse);

        // Handle different response structures
        let storesArray: Store[] = [];
        
        if (Array.isArray(storesResponse.data)) {
          storesArray = storesResponse.data;
        } else if (storesResponse.data?.data && Array.isArray(storesResponse.data.data)) {
          storesArray = storesResponse.data.data;
        } else if (Array.isArray(storesResponse)) {
          storesArray = storesResponse;
        }

        console.log('✅ Processed stores:', storesArray.length);

        // Map stores to StoreCardData
        const mappedStores = storesArray.map((store: Store): StoreCardData => ({
          id: String(store.id),
          name: store.name,
          location: store.address || '',
          type: store.is_warehouse ? 'Warehouse' : 'Store',
          pathao_key: store.pathao_key || '',
          revenue: 0,
          revenueChange: 0,
          products: 0,
          orders: 0,
        }));

        // Filter stores based on user role
        if (role === 'store_manager' && storeId) {
          const userStore = mappedStores.find((s) => s.id === String(storeId));
          setStores(userStore ? [userStore] : []);
        } else {
          setStores(mappedStores);
        }
      } catch (storeError: any) {
        console.error('❌ Error fetching stores:', storeError);
        const errorMsg = storeError?.response?.data?.message || 'Failed to load stores.';
        setError(errorMsg);
        setStores([]);
      }
    } catch (generalError: any) {
      console.error('❌ General fetch error:', generalError);
      const errorMsg = generalError?.response?.data?.message || 'Failed to fetch data.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAdmitBatch = (batchId: number) => {
    router.push(`/inventory/admit-batch?batchId=${batchId}`);
  };

  const handleManageStock = (storeId: string) => {
    router.push(`/inventory/outlet-stock?storeId=${storeId}`);
  };

  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (store.location && store.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Loading State
  if (loading) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading inventory data...</p>
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
            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                Manage Stock
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userRole === 'store_manager'
                  ? 'Manage your store inventory'
                  : 'View pending batches and manage store inventory'}
              </p>
            </div>

            {/* Available Batches Section - Only for Super Admin */}
            {userRole !== 'store_manager' && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Available Batches
                    </h2>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {batches.length} batch{batches.length !== 1 ? 'es' : ''} found
                  </span>
                </div>

                {batches.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No batches available</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Batches will appear here when they have stock
                    </p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                    {batches.map((batch) => (
                      <div
                        key={batch.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {batch.product.name}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <span>Batch: {batch.batch_number}</span>
                              <span>•</span>
                              <span>Qty: {batch.quantity}</span>
                              <span>•</span>
                              <span>Store: {batch.store.name}</span>
                              {batch.status && (
                                <>
                                  <span>•</span>
                                  <span className={`capitalize ${
                                    batch.status === 'low_stock' ? 'text-orange-600 dark:text-orange-400 font-medium' :
                                    batch.status === 'inactive' ? 'text-gray-400' :
                                    'text-green-600 dark:text-green-400'
                                  }`}>
                                    {batch.status.replace('_', ' ')}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAdmitBatch(batch.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stores Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {userRole === 'store_manager' ? 'My Store' : 'Store Inventory'}
                </h2>
                {userRole !== 'store_manager' && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search stores..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm w-64 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStores.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchTerm
                        ? 'No stores found matching your search'
                        : userRole === 'store_manager'
                        ? 'No store assigned to you'
                        : 'No stores available'}
                    </p>
                  </div>
                ) : (
                  filteredStores.map((store) => (
                    <StoreCard
                      key={store.id}
                      store={store}
                      showManageStock={true}
                      onManageStock={handleManageStock}
                    />
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}