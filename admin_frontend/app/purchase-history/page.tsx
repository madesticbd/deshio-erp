'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, Download, Trash2, Eye } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

interface Sale {
  id: string;
  salesBy: string;
  outletId: string;
  date: string;
  createdAt: string;
  customer: {
    name: string;
    mobile: string;
    address: string;
  };
  items: Array<{
    id: number;
    productName: string;
    size: string;
    qty: number;
    price: number;
    discount: number;
    amount: number;
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
    cash: number;
    card: number;
    bkash: number;
    nagad: number;
    transactionFee: number;
    totalPaid: number;
    due: number;
  };
}

interface Store {
  id: number;
  name: string;
  location: string;
}

export default function PurchaseHistoryPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [outlets, setOutlets] = useState<Store[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
    fetchOutlets();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales');
      const data = await response.json();
      setSales(data.reverse()); // Show newest first
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setLoading(false);
    }
  };

  const fetchOutlets = async () => {
    try {
      const response = await fetch('/api/stores');
      const data = await response.json();
      setOutlets(data);
    } catch (error) {
      console.error('Error fetching outlets:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this sale?')) {
      try {
        const response = await fetch('/api/sales', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (response.ok) {
          setSales(sales.filter(s => s.id !== id));
        }
      } catch (error) {
        console.error('Error deleting sale:', error);
      }
    }
  };

  const getOutletName = (outletId: string) => {
    const outlet = outlets.find(o => o.id.toString() === outletId);
    return outlet ? `${outlet.name} - ${outlet.location}` : 'Unknown Outlet';
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer.mobile.includes(searchTerm) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOutlet = !selectedOutlet || sale.outletId === selectedOutlet;
    
    const saleDate = new Date(sale.date);
    const matchesStartDate = !startDate || saleDate >= new Date(startDate);
    const matchesEndDate = !endDate || saleDate <= new Date(endDate);
    
    return matchesSearch && matchesOutlet && matchesStartDate && matchesEndDate;
  });

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.amounts.total, 0);
  const totalSales = filteredSales.length;
  const totalDue = filteredSales.reduce((sum, sale) => sum + sale.payments.due, 0);

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
                  View and manage all sales transactions
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Sales</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalSales}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ৳{totalRevenue.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Due</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
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
                      placeholder="Search by customer, phone, ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={selectedOutlet}
                    onChange={(e) => setSelectedOutlet(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Outlets</option>
                    {outlets.map((outlet) => (
                      <option key={outlet.id} value={outlet.id}>
                        {outlet.name} - {outlet.location}
                      </option>
                    ))}
                  </select>
                  
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start Date"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End Date"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Sales List */}
              {loading ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <div className="text-gray-500 dark:text-gray-400">Loading sales...</div>
                </div>
              ) : filteredSales.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <div className="text-gray-500 dark:text-gray-400">No sales found</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md"
                    >
                      {/* Sale Header */}
                      <div className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                                {sale.id}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                sale.payments.due > 0 
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              }`}>
                                {sale.payments.due > 0 ? 'Due' : 'Paid'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Customer: </span>
                                <span className="text-gray-900 dark:text-white font-medium">
                                  {sale.customer.name || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Phone: </span>
                                <span className="text-gray-900 dark:text-white">
                                  {sale.customer.mobile || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Outlet: </span>
                                <span className="text-gray-900 dark:text-white">
                                  {getOutletName(sale.outletId)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Date: </span>
                                <span className="text-gray-900 dark:text-white">
                                  {new Date(sale.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="text-right mr-4">
                              <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                ৳{sale.amounts.total.toFixed(2)}
                              </div>
                            </div>
                            <button
                              onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                              {expandedSale === sale.id ? (
                                <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(sale.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                              <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedSale === sale.id && (
                        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                          <div className="p-4 space-y-4">
                            {/* Items Table */}
                            <div>
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Items</h3>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-100 dark:bg-gray-800">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Product</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Qty</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Price</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Discount</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white dark:bg-gray-800">
                                    {sale.items.map((item) => (
                                      <tr key={item.id} className="border-t border-gray-200 dark:border-gray-700">
                                        <td className="px-3 py-2 text-gray-900 dark:text-white">{item.productName}</td>
                                        <td className="px-3 py-2 text-gray-900 dark:text-white">{item.qty}</td>
                                        <td className="px-3 py-2 text-gray-900 dark:text-white">৳{item.price}</td>
                                        <td className="px-3 py-2 text-gray-900 dark:text-white">৳{item.discount.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-gray-900 dark:text-white font-medium">৳{item.amount.toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Payment & Amount Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Amount Details</h3>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                                    <span className="text-gray-900 dark:text-white">৳{sale.amounts.subtotal.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Discount</span>
                                    <span className="text-gray-900 dark:text-white">৳{sale.amounts.totalDiscount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">VAT ({sale.amounts.vatRate}%)</span>
                                    <span className="text-gray-900 dark:text-white">৳{sale.amounts.vat.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Transport</span>
                                    <span className="text-gray-900 dark:text-white">৳{sale.amounts.transportCost.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-medium">
                                    <span className="text-gray-900 dark:text-white">Total</span>
                                    <span className="text-gray-900 dark:text-white">৳{sale.amounts.total.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Payment Details</h3>
                                <div className="space-y-2 text-sm">
                                  {sale.payments.cash > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Cash</span>
                                      <span className="text-gray-900 dark:text-white">৳{sale.payments.cash.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {sale.payments.card > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Card</span>
                                      <span className="text-gray-900 dark:text-white">৳{sale.payments.card.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {sale.payments.bkash > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Bkash</span>
                                      <span className="text-gray-900 dark:text-white">৳{sale.payments.bkash.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {sale.payments.nagad > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Nagad</span>
                                      <span className="text-gray-900 dark:text-white">৳{sale.payments.nagad.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {sale.payments.transactionFee > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Transaction Fee</span>
                                      <span className="text-gray-900 dark:text-white">৳{sale.payments.transactionFee.toFixed(2)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <span className="text-gray-600 dark:text-gray-400">Total Paid</span>
                                    <span className="text-green-600 dark:text-green-400 font-medium">৳{sale.payments.totalPaid.toFixed(2)}</span>
                                  </div>
                                  {sale.payments.due > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Due</span>
                                      <span className="text-red-600 dark:text-red-400 font-medium">৳{sale.payments.due.toFixed(2)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Customer Address */}
                            {sale.customer.address && (
                              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Customer Address</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{sale.customer.address}</p>
                              </div>
                            )}
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
    </div>
  );
}