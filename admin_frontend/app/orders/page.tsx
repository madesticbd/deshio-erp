'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, X, Package, User, MapPin, CreditCard } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

interface Customer {
  name: string;
  email: string;
  phone: string;
  socialId: string;
}

interface DeliveryAddress {
  division: string;
  district: string;
  city: string;
  zone: string;
  area: string;
  address: string;
  postalCode: string;
}

interface Product {
  id: number;
  productName: string;
  size: string;
  qty: number;
  price: number;
  discount: number;
  amount: number;
}

interface Payments {
  cash: number;
  card: number;
  totalPaid: number;
  due: number;
}

interface Order {
  id: number;
  salesBy: string;
  date: string;
  customer: Customer;
  deliveryAddress: DeliveryAddress;
  products: Product[];
  subtotal: number;
  payments: Payments;
}

export default function OrdersDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  // Load data from orders.json
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      // First try to load from API
      const response = await fetch('/api/social-orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
        setFilteredOrders(data);
        return;
      }
    } catch (error) {
      console.error('Failed to load from API:', error);
    }
    
    // Fallback to direct import
    try {
      const data = (await import('@/data/orders.json')).default;
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  // Filtering logic
  useEffect(() => {
    let filtered = orders;

    if (search.trim()) {
      filtered = filtered.filter((o) =>
        o.id.toString().includes(search.trim()) ||
        o.customer.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (dateFilter.trim()) {
      filtered = filtered.filter((o) => o.date === dateFilter);
    }

    if (statusFilter !== 'All Status') {
      filtered = filtered.filter((o) =>
        statusFilter === 'Paid' ? o.payments.due === 0 : o.payments.due > 0
      );
    }

    setFilteredOrders(filtered);
  }, [search, dateFilter, statusFilter, orders]);

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
    setActiveMenu(null);
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      console.log('Deleting order ID:', orderId);

      const response = await fetch(`/api/social-orders?id=${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Delete response status:', response.status);
      console.log('Delete response content-type:', response.headers.get('content-type'));
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API returned non-JSON response');
        alert('API endpoint not found. Please ensure /api/social-orders/route.ts exists with DELETE method.');
        return;
      }
      
      if (response.ok) {
        const result = await response.json();
        console.log('Delete result:', result);
        
        // Reload orders after successful deletion
        await loadOrders();
        setActiveMenu(null);
        alert('Order cancelled successfully!');
      } else {
        const errorData = await response.json();
        console.error('Delete error:', errorData);
        alert(`Failed to cancel order: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(`API Error: Make sure /api/social-orders/route.ts exists with a DELETE export function`);
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />

          <main className="flex-1 overflow-auto">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
              <div className="px-4 py-4 md:px-8 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and track all orders</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="bg-gray-900 dark:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-md">
                      {orders.length} Total Orders
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
              {/* Filter Section */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4 md:p-5 mb-6 border dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-gray-800 dark:text-white">Filter Orders</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search Order ID or Customer"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none transition-all text-sm text-gray-900 dark:text-white"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="DD-MMM-YYYY (e.g., 06-Oct-2025)"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none transition-all text-sm text-gray-900 dark:text-white"
                  />

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none transition-all text-sm text-gray-900 dark:text-white"
                  >
                    <option>All Status</option>
                    <option>Paid</option>
                    <option>Due</option>
                  </select>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden border dark:border-gray-700">
                <div className="px-4 md:px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Showing {filteredOrders.length} of {orders.length} orders
                  </p>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="p-12 text-center">
                    <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No orders found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Order No</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {filteredOrders.map((order, index) => (
                            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">#{order.id}</td>
                              <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{order.customer.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{order.date}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  order.payments.due === 0
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                }`}>
                                  {order.payments.due === 0 ? 'Paid' : `Due ৳${order.payments.due}`}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">৳{order.subtotal.toLocaleString()}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="relative inline-block">
                                  <button
                                    onClick={() => setActiveMenu(activeMenu === order.id ? null : order.id)}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                  >
                                    <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                  </button>
                                  
                                  {activeMenu === order.id && (
                                    <div className={`absolute right-0 ${
                                      index >= filteredOrders.length - 2 ? 'bottom-full mb-1' : 'top-full mt-1'
                                    } bg-white dark:bg-gray-700 shadow-xl rounded-lg border border-gray-200 dark:border-gray-600 py-1 w-48 z-50`}>
                                      <button
                                        onClick={() => handleViewDetails(order)}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                      >
                                        View Details
                                      </button>
                                      <button
                                        onClick={() => handleCancelOrder(order.id)}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                                      >
                                        Cancel Order
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredOrders.map((order) => (
                        <div key={order.id} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">Order #{order.id}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{order.customer.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{order.date}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                order.payments.due === 0
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              }`}>
                                {order.payments.due === 0 ? 'Paid' : `Due ৳${order.payments.due}`}
                              </span>
                              <button
                                onClick={() => setActiveMenu(activeMenu === order.id ? null : order.id)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors relative"
                              >
                                <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t dark:border-gray-700">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Total: ৳{order.subtotal.toLocaleString()}</p>
                          </div>
                          
                          {activeMenu === order.id && (
                            <div className="mt-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                              <button
                                onClick={() => handleViewDetails(order)}
                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 transition-colors border-b border-gray-200 dark:border-gray-600"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                              >
                                Cancel Order
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Details #{selectedOrder.id}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border dark:border-gray-600">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Customer Information</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Name:</span> {selectedOrder.customer.name}</p>
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Email:</span> {selectedOrder.customer.email}</p>
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Phone:</span> {selectedOrder.customer.phone}</p>
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Social ID:</span> {selectedOrder.customer.socialId}</p>
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Sales By:</span> {selectedOrder.salesBy}</p>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border dark:border-gray-600">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Delivery Address</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>{selectedOrder.deliveryAddress.address}</p>
                  <p>{selectedOrder.deliveryAddress.area}, {selectedOrder.deliveryAddress.zone}</p>
                  <p>{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.district}</p>
                  <p>{selectedOrder.deliveryAddress.division} - {selectedOrder.deliveryAddress.postalCode}</p>
                </div>
              </div>

              {/* Products */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border dark:border-gray-600">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Products</h3>
                </div>
                <div className="space-y-3">
                  {selectedOrder.products.map((product) => (
                    <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{product.productName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Size: {product.size} • Qty: {product.qty}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">৳{product.amount.toLocaleString()}</p>
                          {product.discount > 0 && (
                            <p className="text-xs text-green-600 dark:text-green-400">-৳{product.discount} off</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Payment Summary</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Subtotal:</span>
                    <span className="font-medium">৳{selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Cash Payment:</span>
                    <span className="font-medium">৳{selectedOrder.payments.cash.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Card Payment:</span>
                    <span className="font-medium">৳{selectedOrder.payments.card.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-700">
                    <span className="font-semibold text-gray-900 dark:text-white">Total Paid:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">৳{selectedOrder.payments.totalPaid.toLocaleString()}</span>
                  </div>
                  {selectedOrder.payments.due > 0 && (
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">Due Amount:</span>
                      <span className="font-bold text-red-600 dark:text-red-400">৳{selectedOrder.payments.due.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {activeMenu !== null && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}