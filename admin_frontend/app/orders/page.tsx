'use client';

import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';


interface Customer {
  name: string;
  email: string;
  phone: string;
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // ✅ Load data once from imported JSON
 useEffect(() => {
  const loadOrders = async () => {
    const data = (await import('@/data/orders.json')).default; // ✅ dynamic import
    setOrders(data);
    setFilteredOrders(data);
  };
  loadOrders();
}, []);


  // ✅ Filtering logic
  useEffect(() => {
    let filtered = orders;

    if (search.trim()) {
      filtered = filtered.filter((o) =>
        o.id.toString().includes(search.trim())
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white px-4 py-4 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Orders Dashboard</h1>
            <p className="text-sm text-gray-500">Manage and view all your orders</p>
          </div>
          <div className="text-sm font-medium bg-gray-900 text-white px-3 py-1.5 rounded-md">
            {orders.length} Orders
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white shadow-sm mt-4 mx-4 md:mx-8 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">Filter Orders</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Order ID */}
          <div className="flex items-center border rounded-md bg-gray-50 px-3">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search by Order ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent outline-none py-2 text-sm"
            />
          </div>

          {/* Date */}
          <input
            type="text"
            placeholder="DD-MMM-YYYY (e.g., 06-Oct-2025)"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border rounded-md px-3 py-2 bg-gray-50 text-sm outline-none"
          />

          {/* Payment Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-2 bg-gray-50 text-sm outline-none"
          >
            <option>All Status</option>
            <option>Paid</option>
            <option>Due</option>
          </select>
        </div>
      </div>

      {/* Orders Section */}
      <div className="mx-4 md:mx-8 mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">All Orders</h2>
        <p className="text-sm text-gray-500 mb-4">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 flex flex-col items-center justify-center text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 text-gray-400 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3v1m0 4v12a2 2 0 002 2h14a2 2 0 002-2V8m-2-4V3M7 3v1m10-1v1M3 9h18M9 12h6"
              />
            </svg>
            <p className="text-gray-500 font-medium">No orders found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm p-4 md:p-5 border border-gray-100"
              >
                <div className="flex flex-col md:flex-row justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      Order #{order.id}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {order.customer.name} • {order.date}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {order.deliveryAddress.address}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">
                      Total: ৳{order.subtotal}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        order.payments.due === 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {order.payments.due === 0
                        ? 'Paid'
                        : `Due ৳${order.payments.due}`}
                    </p>
                  </div>
                </div>

                <div className="mt-3 border-t pt-3 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Products:</span>{' '}
                    {order.products.map((p) => p.productName).join(', ')}
                  </p>
                  <p>
                    <span className="font-medium">Sales By:</span> {order.salesBy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-xs text-gray-400">
        Orders Dashboard © 2025
      </footer>
    </div>
  );
}
