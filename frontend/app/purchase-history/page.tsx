'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Trash2, MoreVertical, ArrowRightLeft, RotateCcw } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import orderService, { type Order, type OrderFilters } from '@/services/orderService';
import axiosInstance from '@/lib/axios';

interface Store {
  id: number;
  name: string;
  location: string;
}

export default function PurchaseHistoryPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<number | null>(null);
  const [errorDetails, setErrorDetails] = useState<{ [key: number]: string }>({});

  const handleExpandOrder = async (orderId: number) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }

    setExpandedOrder(orderId);

    // Check if order already has items loaded
    const order = orders.find(o => o.id === orderId);
    
    console.log('🔍 Expanding order:', orderId);
    console.log('📦 Order data before fetch:', order);
    console.log('🛒 Has items?', order?.items?.length || 0);
    
    if (order?.items && order.items.length > 0) {
      console.log('✅ Items already loaded, skipping API call');
      return; // Already loaded
    }

    // Load full order details
    setLoadingDetails(orderId);
    setErrorDetails(prev => ({ ...prev, [orderId]: '' })); // Clear previous error
    
    try {
      console.log('📡 Fetching order details from API...');
      const fullOrder = await orderService.getById(orderId);
      console.log('✅ Received full order:', fullOrder);
      console.log('📋 Items in response:', fullOrder.items?.length || 0);
      
      setOrders(orders.map(o => o.id === orderId ? fullOrder : o));
    } catch (error: any) {
      console.error('❌ Failed to load order details:', error);
      console.error('📊 Error response:', error.response?.data);
      console.error('🔢 Status code:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load order details';
      setErrorDetails(prev => ({ ...prev, [orderId]: errorMessage }));
      
      // Log more details for debugging
      console.error('Full error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    } finally {
      setLoadingDetails(null);
    }
  };
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [userStoreId, setUserStoreId] = useState<string>('');
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole') || '';
    const storeId = localStorage.getItem('storeId') || '';
    setUserRole(role);
    setUserStoreId(storeId);
    
    if (role === 'store_manager' && storeId) {
      setSelectedStore(storeId);
    }
    
    fetchOrders(role, storeId);
    fetchStores(role, storeId);
  }, []);

  const fetchOrders = async (role?: string, storeId?: string) => {
    try {
      setLoading(true);
      
      const resolvedRole = (role ?? localStorage.getItem('userRole')) || '';
      const resolvedStoreId = (storeId ?? localStorage.getItem('storeId')) || '';
      
      console.log('🔐 User info:', { role: resolvedRole, storeId: resolvedStoreId });
      
      const filters: OrderFilters = {
        order_type: 'counter',
        per_page: 50,
      };
      
      // Store managers only see their store's orders
      if (resolvedRole === 'store_manager' && resolvedStoreId) {
        filters.store_id = parseInt(resolvedStoreId);
      }
      
      console.log('📡 Fetching orders with filters:', filters);
      const result = await orderService.getAll(filters);
      console.log('✅ Orders received:', result.data.length);
      console.log('📦 First order sample:', result.data[0]);
      
      // Just set the orders without items - we'll load items on expand
      setOrders(result.data);
      
    } catch (error) {
      console.error('❌ Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async (role?: string, storeId?: string) => {
    try {
      const resolvedRole = (role ?? localStorage.getItem('userRole')) || '';
      const resolvedStoreId = (storeId ?? localStorage.getItem('storeId')) || '';
      
      const response = await axiosInstance.get('/stores');
      const result = response.data;
      
      let storesData: Store[] = [];
      if (result.success && Array.isArray(result.data)) {
        storesData = result.data;
      } else if (Array.isArray(result)) {
        storesData = result;
      }
      
      if (resolvedRole === 'store_manager' && resolvedStoreId) {
        const userStore = storesData.find(store => 
          store.id === parseInt(resolvedStoreId)
        );
        setStores(userStore ? [userStore] : []);
      } else {
        setStores(storesData);
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
      setStores([]);
    }
  };

  const handleDelete = async (orderId: number) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    try {
      await orderService.cancel(orderId, 'Deleted by user');
      setOrders(orders.filter(o => o.id !== orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order. Please try again.');
    }
  };

  const getStoreName = (storeId: number) => {
    const store = stores.find(s => s.id === storeId);
    return store ? `${store.name} - ${store.location}` : 'Unknown Store';
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.phone?.includes(searchTerm);
    
    const matchesStore = !selectedStore || order.store.id === parseInt(selectedStore);
    
    const orderDate = new Date(order.created_at);
    const matchesStartDate = !startDate || orderDate >= new Date(startDate);
    const matchesEndDate = !endDate || orderDate <= new Date(endDate);
    
    return matchesSearch && matchesStore && matchesStartDate && matchesEndDate;
  });

  const totalRevenue = filteredOrders.reduce((sum, order) => {
    const amount = parseFloat(order.total_amount.replace(/,/g, ''));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  const totalOrders = filteredOrders.length;
  
  const totalDue = filteredOrders.reduce((sum, order) => {
    const amount = parseFloat(order.outstanding_amount.replace(/,/g, ''));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-2">
                  Purchase History
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {userRole === 'store_manager' 
                    ? 'View and manage your store counter sales' 
                    : 'View and manage all counter sales transactions'}
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Orders</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalOrders}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ৳{totalRevenue.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Due</div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    ৳{totalDue.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by order#, customer, phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    disabled={userRole === 'store_manager'}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:dark:bg-gray-600"
                  >
                    <option value="">All Stores</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name} - {store.location}
                      </option>
                    ))}
                  </select>
                  
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Orders List */}
              {loading ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <div className="text-gray-500 dark:text-gray-400">Loading orders...</div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <div className="text-gray-500 dark:text-gray-400">No counter orders found</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md"
                    >
                      {/* Order Header */}
                      <div className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-blue-700 dark:text-blue-400">
                                {order.order_number}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                order.payment_status === 'paid'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : order.payment_status === 'partial'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}>
                                {order.payment_status === 'paid' ? 'Paid' : 
                                 order.payment_status === 'partial' ? 'Partial' : 'Pending'}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                order.status === 'confirmed'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : order.status === 'cancelled'
                                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Customer: </span>
                                <span className="text-gray-900 dark:text-white font-medium">
                                  {order.customer?.name || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Phone: </span>
                                <span className="text-gray-900 dark:text-white">
                                  {order.customer?.phone || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Sales By: </span>
                                <span className="text-gray-900 dark:text-white font-medium">
                                  {order.salesman?.name || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Store: </span>
                                <span className="text-gray-900 dark:text-white">
                                  {order.store?.name || getStoreName(order.store.id)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Date: </span>
                                <span className="text-gray-900 dark:text-white">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="text-right mr-4">
                              <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                ৳{
                  Number(
                  String(order.total_amount ?? "0")
                    .replace(/[^0-9.-]/g, "")
                  ).toFixed(2)
                }
                                </div>
                              {parseFloat(order.outstanding_amount) > 0 && (
                                <div className="text-xs text-red-600 dark:text-red-400">
                                  Due:  ৳{
                  Number(
                  String(order.total_amount ?? "0")
                    .replace(/[^0-9.-]/g, "")
                  ).toFixed(2)
                }
                                </div>
                              )}
                            </div>
                            
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenu(activeMenu === order.id ? null : order.id);
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                              >
                                <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              </button>
                              
                              {activeMenu === order.id && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-300 dark:border-gray-600 z-50">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      alert('Exchange feature - connect to returns API');
                                      setActiveMenu(null);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3 rounded-t-lg transition-colors"
                                  >
                                    <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <span>Exchange Products</span>
                                  </button>
                                  <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      alert('Return feature - connect to returns API');
                                      setActiveMenu(null);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 rounded-b-lg transition-colors"
                                  >
                                    <RotateCcw className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    <span>Return Products</span>
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={() => handleExpandOrder(order.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                              {expandedOrder === order.id ? (
                                <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            >
                              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedOrder === order.id && (
                        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                          <div className="p-4 space-y-4">
                            {/* Items Table */}
                            <div>
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Order Items</h3>
                              {loadingDetails === order.id ? (
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
                                  <div className="text-gray-500 dark:text-gray-400">Loading items...</div>
                                </div>
                              ) : errorDetails[order.id] ? (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                  <div className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">
                                    Failed to load order details
                                  </div>
                                  <div className="text-xs text-red-600 dark:text-red-500 mb-3">
                                    {errorDetails[order.id]}
                                  </div>
                                  <button
                                    onClick={() => handleExpandOrder(order.id)}
                                    className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                                  >
                                    Try Again
                                  </button>
                                  <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                                    <strong>Possible issue:</strong> Backend error - check Laravel logs for "Attempt to read property 'name' on null"
                                  </div>
                                </div>
                              ) : !order.items || order.items.length === 0 ? (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm text-yellow-700 dark:text-yellow-400">
                                  No items found for this order.
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-800">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Product</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">SKU</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Batch</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Qty</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Price</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Discount</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800">
                                      {order.items.map((item) => (
                                        <tr key={item.id} className="border-t border-gray-200 dark:border-gray-700">
                                          <td className="px-3 py-2 text-gray-900 dark:text-white">
                                            {item.product_name}
                                          </td>
                                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400 font-mono text-xs">
                                            {item.product_sku || '-'}
                                          </td>
                                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400 text-xs">
                                            {item.batch_number || '-'}
                                          </td>
                                          <td className="px-3 py-2 text-gray-900 dark:text-white">{item.quantity}</td>
                                          <td className="px-3 py-2 text-gray-900 dark:text-white"> ৳{
                  Number(
                  String(order.total_amount ?? "0")
                    .replace(/[^0-9.-]/g, "")
                  ).toFixed(2)
                }</td>
                                          <td className="px-3 py-2 text-gray-900 dark:text-white"> ৳{
                  Number(
                  String(order.total_amount ?? "0")
                    .replace(/[^0-9.-]/g, "")
                  ).toFixed(2)
                }</td>
                                          <td className="px-3 py-2 text-gray-900 dark:text-white font-medium">
                                            ৳{
                  Number(
                  String(order.total_amount ?? "0")
                    .replace(/[^0-9.-]/g, "")
                  ).toFixed(2)
                }
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>

                            {/* Amount & Payment Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Amount Details</h3>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                                    <span className="text-gray-900 dark:text-white"> ৳{
                  Number(
                  String(order.total_amount ?? "0")
                    .replace(/[^0-9.-]/g, "")
                  ).toFixed(2)
                }</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Discount</span>
                                    <span className="text-gray-900 dark:text-white">৳{
                              Number(
                              String(order.total_amount ?? "0")
                              .replace(/[^0-9.-]/g, "")
                              ).toFixed(2)
                            }</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Tax/VAT</span>
                                    <span className="text-gray-900 dark:text-white"> ৳{
                  Number(
                  String(order.total_amount ?? "0")
                    .replace(/[^0-9.-]/g, "")
                  ).toFixed(2)
                }</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                                    <span className="text-gray-900 dark:text-white"> ৳{
                  Number(
                  String(order.total_amount ?? "0")
                    .replace(/[^0-9.-]/g, "")
                  ).toFixed(2)
                }</span>
                                  </div>
                                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-medium">
                                    <span className="text-gray-900 dark:text-white">Total</span>
                                    <span className="text-gray-900 dark:text-white"> ৳{
                  Number(
                  String(order.total_amount ?? "0")
                    .replace(/[^0-9.-]/g, "")
                  ).toFixed(2)
                }</span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Payment Details</h3>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Total Paid</span>
                                    <span className="text-green-600 dark:text-green-400 font-medium">
                                     ৳{
                  Number(
                  String(order.total_amount ?? "0")
                    .replace(/[^0-9.-]/g, "")
                  ).toFixed(2)
                }
                                    </span>
                                  </div>
                                  {parseFloat(order.outstanding_amount) > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Outstanding</span>
                                      <span className="text-red-600 dark:text-red-400 font-medium">
                                        ৳{
                  Number(
                  String(order.total_amount ?? "0")
                    .replace(/[^0-9.-]/g, "")
                  ).toFixed(2)
                }
                                      </span>
                                    </div>
                                  )}
                                  {order.payments && order.payments.length > 0 && (
                                    <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Payment History:</div>
                                      {order.payments.map((payment) => (
                                        <div key={payment.id} className="flex justify-between text-xs">
                                          <span className="text-gray-600 dark:text-gray-400">
                                            {payment.payment_method} ({payment.payment_type})
                                          </span>
                                          <span className="text-gray-900 dark:text-white">
                                           ৳{
                  Number(
                  String(order.total_amount ?? "0")
                    .replace(/[^0-9.-]/g, "")
                  ).toFixed(2)
                }
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Click outside to close menu */}
      {activeMenu !== null && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}