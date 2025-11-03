// app/orders/page.tsx - Fixed QZ Connection on Print Only
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import StatsCards from '@/components/orders/StatsCards';
import OrderFilters from '@/components/orders/OrderFilters';
import OrdersTable from '@/components/orders/OrdersTable';
import OrderDetailsModal from '@/components/orders/OrderDetailsModal';
import EditOrderModal from '@/components/orders/EditOrderModal';
import ExchangeProductModal from '@/components/orders/ExchangeProductModal';
import ReturnProductModal from '@/components/orders/ReturnProductModal';
import { Order } from '@/types/order';
import { Truck, Printer, Settings, CheckCircle, XCircle } from 'lucide-react';
import { checkQZStatus, printBulkReceipts, getPrinters } from '@/lib/qz-tray';

export default function OrdersDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [isPrintingBulk, setIsPrintingBulk] = useState(false);
  const [qzConnected, setQzConnected] = useState(false);
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [showPrinterSelect, setShowPrinterSelect] = useState(false);
  const [bulkPrintProgress, setBulkPrintProgress] = useState<{
    show: boolean;
    current: number;
    total: number;
    success: number;
    failed: number;
  }>({ show: false, current: 0, total: 0, success: 0, failed: 0 });

  // Get user info from localStorage
  useEffect(() => {
    const role = localStorage.getItem('userRole') || '';
    const name = localStorage.getItem('userName') || '';
    setUserRole(role);
    setUserName(name);
  }, []);

  const checkPrinterStatus = async () => {
    try {
      const status = await checkQZStatus();
      setQzConnected(status.connected);
      
      if (status.connected) {
        const printerList = await getPrinters();
        setPrinters(printerList);
        
        const savedPrinter = localStorage.getItem('defaultPrinter');
        if (savedPrinter && printerList.includes(savedPrinter)) {
          setSelectedPrinter(savedPrinter);
        } else if (printerList.length > 0) {
          setSelectedPrinter(printerList[0]);
        }
      }
    } catch (error) {
      console.error('Failed to check printer status:', error);
      throw error;
    }
  };

  const handlePrinterSelect = (printer: string) => {
    setSelectedPrinter(printer);
    localStorage.setItem('defaultPrinter', printer);
    setShowPrinterSelect(false);
  };

  // Get today's date in DD-MM-YYYY format
  const getTodayDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/social-orders');
      if (response.ok) {
        const data = await response.json();
        const ordersWithDates = data.map((order: any) => ({
          ...order,
          date: order.date || getTodayDate()
        })) as Order[];
        
        const role = localStorage.getItem('userRole') || '';
        const name = localStorage.getItem('userName') || '';
        
        let filteredData = ordersWithDates;
        if (role === 'social_commerce_manager') {
          filteredData = ordersWithDates.filter((order: Order) => order.salesBy === name);
        }
        
        setOrders(filteredData);
        setFilteredOrders(filteredData);
        return;
      }
    } catch (error) {
      console.error('Failed to load from API:', error);
    }
    
    try {
      const data = (await import('@/data/orders.json')).default;
      const ordersWithDates = data.map((order: any) => ({
        ...order,
        date: order.date || getTodayDate()
      })) as Order[];
      
      const role = localStorage.getItem('userRole') || '';
      const name = localStorage.getItem('userName') || '';
      
      let filteredData = ordersWithDates;
      if (role === 'social_commerce_manager') {
        filteredData = ordersWithDates.filter((order: Order) => order.salesBy === name);
      }
      
      setOrders(filteredData);
      setFilteredOrders(filteredData);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  useEffect(() => {
    let filtered = orders;

    if (search.trim()) {
      filtered = filtered.filter((o) =>
        o.id.toString().includes(search.trim()) ||
        o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.phone.includes(search.trim())
      );
    }

    if (dateFilter.trim()) {
      filtered = filtered.filter((o) => {
        const orderDate = o.date;
        let filterDateFormatted = dateFilter;
        if (dateFilter.includes('-') && dateFilter.split('-')[0].length === 4) {
          const [year, month, day] = dateFilter.split('-');
          filterDateFormatted = `${day}-${month}-${year}`;
        }
        return orderDate === filterDateFormatted;
      });
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

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
    setActiveMenu(null);
  };

  const handleSaveOrder = async (updatedOrder: Order) => {
    try {
      const response = await fetch(`/api/social-orders?id=${updatedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedOrder),
      });

      if (response.ok) {
        await loadOrders();
        alert('Order updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update order: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  };

  const handleExchangeOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowExchangeModal(true);
    setActiveMenu(null);
  };

  const handleReturnOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowReturnModal(true);
    setActiveMenu(null);
  };

  const handleProcessExchange = async (exchangeData: any) => {
    try {
      console.log('Processing exchange:', exchangeData);
      await loadOrders();
    } catch (error) {
      console.error('Error processing exchange:', error);
      throw error;
    }
  };

  const handleProcessReturn = async (returnData: any) => {
    try {
      console.log('Processing return:', returnData);
      await loadOrders();
      alert('Return processed successfully!');
    } catch (error) {
      console.error('Error processing return:', error);
      throw error;
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      const response = await fetch(`/api/social-orders?id=${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        alert('API endpoint not found. Please ensure /api/social-orders/route.ts exists with DELETE method.');
        return;
      }
      
      if (response.ok) {
        await loadOrders();
        setActiveMenu(null);
        alert('Order cancelled successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to cancel order: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(`API Error: Make sure /api/social-orders/route.ts exists with a DELETE export function`);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const handleToggleSelect = (orderId: number) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleBulkSendToPathao = async () => {
    if (selectedOrders.size === 0) {
      alert('Please select at least one order to send to Pathao.');
      return;
    }

    if (!confirm(`Send ${selectedOrders.size} order(s) to Pathao?`)) {
      return;
    }

    setIsSendingBulk(true);
    
    // Simulate API call to Pathao
    setTimeout(() => {
      alert(`Successfully sent ${selectedOrders.size} order(s) to Pathao!`);
      setSelectedOrders(new Set());
      setIsSendingBulk(false);
    }, 2000);
  };

  const handleBulkPrintReceipts = async () => {
    if (selectedOrders.size === 0) {
      alert('Please select at least one order to print.');
      return;
    }

    // Check QZ connection first when user clicks print
    try {
      console.log('Checking QZ status...');
      await checkPrinterStatus();
      console.log('QZ Connected:', qzConnected);
      
      // Give state time to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('QZ Check Error:', error);
      alert('Failed to connect to QZ Tray. Please ensure QZ Tray is running and try again.');
      return;
    }

    // Check again after state update
    const status = await checkQZStatus();
    if (!status.connected) {
      alert('QZ Tray is not connected. Please start QZ Tray and try again.');
      return;
    }

    if (!selectedPrinter) {
      setShowPrinterSelect(true);
      alert('Please select a printer first.');
      return;
    }

    if (!confirm(`Print receipts for ${selectedOrders.size} order(s)?`)) {
      return;
    }

    setIsPrintingBulk(true);
    setBulkPrintProgress({
      show: true,
      current: 0,
      total: selectedOrders.size,
      success: 0,
      failed: 0
    });

    try {
      const selectedOrdersList = orders.filter(o => selectedOrders.has(o.id));
      
      let successCount = 0;
      let failedCount = 0;
      let currentIndex = 0;

      for (const order of selectedOrdersList) {
        currentIndex++;
        setBulkPrintProgress(prev => ({ ...prev, current: currentIndex }));
        
        try {
          await printBulkReceipts([order], selectedPrinter);
          successCount++;
          setBulkPrintProgress(prev => ({ ...prev, success: successCount }));
        } catch (error) {
          failedCount++;
          setBulkPrintProgress(prev => ({ ...prev, failed: failedCount }));
          console.error(`Failed to print order #${order.id}:`, error);
        }
        
        // Small delay between prints
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      alert(`Bulk print completed!\nSuccess: ${successCount}\nFailed: ${failedCount}`);
      setSelectedOrders(new Set());
    } catch (error) {
      console.error('Bulk print error:', error);
      alert('Failed to complete bulk print operation.');
    } finally {
      setIsPrintingBulk(false);
      setTimeout(() => {
        setBulkPrintProgress({ show: false, current: 0, total: 0, success: 0, failed: 0 });
      }, 2000);
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + (order.amounts?.total || order.subtotal), 0);
  const paidOrders = orders.filter(o => o.payments.due === 0).length;
  const pendingOrders = orders.filter(o => o.payments.due > 0).length;

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-100 dark:bg-black">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />

          <main className="flex-1 overflow-auto bg-gray-100 dark:bg-black">
            <div className="px-4 md:px-8 pt-6 pb-4">
              <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Orders Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      {userRole === 'social_commerce_manager' 
                        ? 'Overview of your orders and sales' 
                        : 'Overview of all orders and sales'}
                    </p>
                  </div>
                  
                  {/* Printer Status - Only show when connected */}
                  <div className="flex items-center gap-3">
                    {qzConnected && (
                      <>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Printer Connected
                          </span>
                        </div>
                        
                        <div className="relative">
                          <button
                            onClick={() => setShowPrinterSelect(!showPrinterSelect)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors"
                          >
                            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {selectedPrinter || 'Select Printer'}
                            </span>
                          </button>
                          
                          {showPrinterSelect && (
                            <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 w-72 z-50">
                              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Available Printers</p>
                              </div>
                              {printers.map((printer) => (
                                <button
                                  key={printer}
                                  onClick={() => handlePrinterSelect(printer)}
                                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                    selectedPrinter === printer ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  {printer}
                                  {selectedPrinter === printer && (
                                    <CheckCircle className="w-4 h-4 inline ml-2" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <StatsCards 
                  totalOrders={orders.length}
                  paidOrders={paidOrders}
                  pendingOrders={pendingOrders}
                  totalRevenue={totalRevenue}
                />
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 pb-6">
              <OrderFilters
                search={search}
                setSearch={setSearch}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />

              {/* Bulk Actions Bar */}
              {selectedOrders.size > 0 && (
                <div className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">{selectedOrders.size}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {selectedOrders.size} order(s) selected
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Ready for bulk operations
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleBulkPrintReceipts}
                        disabled={isPrintingBulk}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        <Printer className="w-4 h-4" />
                        {isPrintingBulk ? 'Printing...' : 'Print All Receipts'}
                      </button>
                      <button
                        onClick={handleBulkSendToPathao}
                        disabled={isSendingBulk}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        <Truck className="w-4 h-4" />
                        {isSendingBulk ? 'Sending...' : 'Send to Pathao'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk Print Progress */}
              {bulkPrintProgress.show && (
                <div className="mb-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Printing Receipts... ({bulkPrintProgress.current}/{bulkPrintProgress.total})
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">{bulkPrintProgress.success}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-600">{bulkPrintProgress.failed}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(bulkPrintProgress.current / bulkPrintProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <OrdersTable
                filteredOrders={filteredOrders}
                totalOrders={orders.length}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onViewDetails={handleViewDetails}
                onEditOrder={handleEditOrder}
                onExchangeOrder={handleExchangeOrder}
                onReturnOrder={handleReturnOrder}
                onCancelOrder={handleCancelOrder}
                selectedOrders={selectedOrders}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
              />
            </div>
          </main>
        </div>
      </div>

      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowDetailsModal(false)}
          onEdit={handleEditOrder}
        />
      )}

      {showEditModal && selectedOrder && (
        <EditOrderModal
          order={selectedOrder}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveOrder}
        />
      )}

      {showExchangeModal && selectedOrder && (
        <ExchangeProductModal
          order={selectedOrder}
          onClose={() => setShowExchangeModal(false)}
          onExchange={handleProcessExchange}
        />
      )}

      {showReturnModal && selectedOrder && (
        <ReturnProductModal
          order={selectedOrder}
          onClose={() => setShowReturnModal(false)}
          onReturn={handleProcessReturn}
        />
      )}

      {activeMenu !== null && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActiveMenu(null)}
        />
      )}

      {showPrinterSelect && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowPrinterSelect(false)}
        />
      )}
    </div>
  );
}