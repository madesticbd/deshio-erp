'use client';

import { useState, useEffect } from 'react';
import { Package, Search, X, CheckCircle2, AlertCircle, TrendingUp, ArrowRightLeft } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useSearchParams } from 'next/navigation';
import storeService, { Store } from '@/services/storeService';
import inventoryRebalancingService, { 
  RebalancingRequest, 
  RebalancingSuggestion, 
  RebalancingStatistics 
} from '@/services/inventoryRebalancingService';
import productService, { Product } from '@/services/productService';
import inventoryService, { GlobalInventoryItem } from '@/services/inventoryService';
import batchService from '@/services/batchService';

interface ProductBatch {
  id: number;
  batch_number: string;
  product_id: number;
  product_name: string;
  quantity: number;
  expiry_date: string | null;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function InventoryRebalancingPage() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get('storeId');
  
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [store, setStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [sourceStoreBatches, setSourceStoreBatches] = useState<ProductBatch[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [rebalancingRequests, setRebalancingRequests] = useState<RebalancingRequest[]>([]);
  const [suggestions, setSuggestions] = useState<RebalancingSuggestion[]>([]);
  const [statistics, setStatistics] = useState<RebalancingStatistics | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RebalancingRequest | null>(null);
  
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [availableQuantity, setAvailableQuantity] = useState<number>(0);
  
  const [createForm, setCreateForm] = useState({
    batch_id: '',
    product_id: '',
    source_store_id: '',
    destination_store_id: '',
    quantity: '',
    reason: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });
  
  const [batchNumber, setBatchNumber] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    fetchStores();
    fetchRebalancingRequests();
    fetchStatistics();
  }, []);

  useEffect(() => {
    if (storeId && stores.length > 0) {
      const foundStore = stores.find(s => s.id.toString() === storeId);
      if (foundStore) {
        setStore(foundStore);
        setFilterStore(storeId);
      }
    }
  }, [storeId, stores]);

  useEffect(() => {
    fetchRebalancingRequests();
  }, [filterStatus, filterStore, filterProduct]);

  const fetchStores = async () => {
    try {
      const response = await storeService.getStores({ is_active: true });
      const storesData = response.data.data || response.data || [];
      setStores(storesData);
    } catch (error) {
      console.error('Error fetching stores:', error);
      showToast('Failed to load stores', 'error');
    }
  };

  const fetchBatchDetails = async () => {
    if (!createForm.source_store_id || !batchNumber) {
      showToast('Please select source store and enter batch number', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await batchService.getBatches({
        store_id: parseInt(createForm.source_store_id),
        search: batchNumber,
      });
      
      const batches = response.data.data;
      
      if (batches.length === 0) {
        showToast('Batch not found', 'error');
        return;
      }
      
      const batch = batches[0]; // Assume first match if multiple
      
      setCreateForm({
        ...createForm,
        batch_id: batch.id.toString(),
        product_id: batch.product.id.toString(),
      });
      setAvailableQuantity(batch.quantity);
      showToast('Batch details loaded successfully', 'success');
    } catch (error) {
      console.error('Error fetching batch details:', error);
      showToast('Failed to load batch details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRebalancingRequests = async () => {
    try {
      const filters: any = {};
      if (filterStatus) filters.status = filterStatus;
      if (filterStore) filters.store_id = parseInt(filterStore);
      if (filterProduct) filters.product_id = parseInt(filterProduct);
      
      const response = await inventoryRebalancingService.getRebalancingRequests(filters);
      setRebalancingRequests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching rebalancing requests:', error);
      showToast('Failed to load rebalancing requests', 'error');
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await inventoryRebalancingService.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      showToast('Failed to load statistics', 'error');
    }
  };

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await inventoryRebalancingService.getSuggestions();
      setSuggestions(response.data.suggestions || []);
      setShowSuggestionsModal(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      showToast('Failed to load suggestions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!createForm.batch_id || !createForm.product_id || !createForm.source_store_id || !createForm.destination_store_id || !createForm.quantity) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const quantity = parseInt(createForm.quantity);
    if (quantity > availableQuantity) {
      showToast(`Only ${availableQuantity} units available in selected batch`, 'error');
      return;
    }

    try {
      setLoading(true);

      await inventoryRebalancingService.createRebalancingRequest({
        product_id: parseInt(createForm.product_id),
        source_batch_id: parseInt(createForm.batch_id),
        source_store_id: parseInt(createForm.source_store_id),
        destination_store_id: parseInt(createForm.destination_store_id),
        quantity: quantity,
        reason: createForm.reason,
        priority: createForm.priority,
      });
      
      showToast('Rebalancing request created successfully', 'success');
      setShowCreateModal(false);
      setCreateForm({
        batch_id: '',
        product_id: '',
        source_store_id: '',
        destination_store_id: '',
        quantity: '',
        reason: '',
        priority: 'medium',
      });
      setBatchNumber('');
      setAvailableQuantity(0);
      fetchRebalancingRequests();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error creating request:', error);
      showToast(error.response?.data?.message || 'Failed to create request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromSuggestion = async (suggestion: RebalancingSuggestion) => {
    try {
      setLoading(true);
      await inventoryRebalancingService.createRebalancingRequest({
        product_id: suggestion.product_id,
        source_store_id: suggestion.from_store_id,
        destination_store_id: suggestion.to_store_id,
        quantity: suggestion.suggested_quantity,
        reason: suggestion.reason,
        priority: 'medium',
      });
      
      showToast('Rebalancing request created from suggestion', 'success');
      setShowSuggestionsModal(false);
      fetchRebalancingRequests();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error creating from suggestion:', error);
      showToast(error.response?.data?.message || 'Failed to create request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setLoading(true);
      await inventoryRebalancingService.approveRebalancing(id);
      showToast('Rebalancing request approved successfully', 'success');
      fetchRebalancingRequests();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error approving request:', error);
      showToast(error.response?.data?.message || 'Failed to approve request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }

    try {
      setLoading(true);
      await inventoryRebalancingService.rejectRebalancing(selectedRequest.id, {
        rejection_reason: rejectionReason,
      });
      showToast('Rebalancing request rejected', 'success');
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      fetchRebalancingRequests();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      showToast(error.response?.data?.message || 'Failed to reject request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      setLoading(true);
      await inventoryRebalancingService.cancelRebalancing(id);
      showToast('Rebalancing request cancelled', 'success');
      fetchRebalancingRequests();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      showToast(error.response?.data?.message || 'Failed to cancel request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      setLoading(true);
      await inventoryRebalancingService.completeRebalancing(id);
      showToast('Rebalancing marked as completed', 'success');
      fetchRebalancingRequests();
      fetchStatistics();
    } catch (error: any) {
      console.error('Error completing request:', error);
      showToast(error.response?.data?.message || 'Failed to complete request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', label: 'Pending' },
      approved: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: 'Approved' },
      completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', label: 'Completed' },
      rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', label: 'Rejected' },
      cancelled: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300', label: 'Cancelled' },
    };
    
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 ${badge.bg} ${badge.text} text-xs rounded`}>
        {badge.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      low: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300' },
      medium: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300' },
      high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300' },
      urgent: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300' },
    };
    
    const badge = badges[priority] || badges.medium;
    return (
      <span className={`px-2 py-1 ${badge.bg} ${badge.text} text-xs rounded capitalize`}>
        {priority}
      </span>
    );
  };

  const filteredRequests = rebalancingRequests.filter(request => {
    const matchesSearch = request.product?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-[60] space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
                toast.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              } animate-slideIn`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              )}
              <p className={`text-sm font-medium ${
                toast.type === 'success'
                  ? 'text-green-900 dark:text-green-300'
                  : 'text-red-900 dark:text-red-300'
              }`}>
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                className={`ml-2 ${
                  toast.type === 'success'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            darkMode={darkMode} 
            setDarkMode={setDarkMode}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="flex-1 overflow-auto p-6">
            {/* Statistics Cards */}
            {statistics && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statistics.total}
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4">
                  <div className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Pending</div>
                  <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                    {statistics.by_status.pending}
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Approved</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                    {statistics.by_status.approved}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
                  <div className="text-sm text-green-600 dark:text-green-400 mb-1">Completed</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                    {statistics.by_status.completed}
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4">
                  <div className="text-sm text-red-600 dark:text-red-400 mb-1">Rejected</div>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-300">
                    {statistics.by_status.rejected}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cancelled</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-300">
                    {statistics.by_status.cancelled}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Inventory Rebalancing
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage stock distribution across stores
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={fetchSuggestions}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Get Suggestions
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Create Request
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Filters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by Product"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={filterStore}
                  onChange={(e) => setFilterStore(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Stores</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>

                <select
                  value={filterProduct}
                  onChange={(e) => setFilterProduct(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Products</option>
                  {rebalancingRequests
                    .map(r => r.product)
                    .filter((product, index, self) => 
                      product && self.findIndex(p => p?.id === product.id) === index
                    )
                    .map(product => product && (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))
                  }
                </select>
              </div>
            </div>

            {/* Rebalancing Requests Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Rebalancing Requests
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Product</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Batch</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">From</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">To</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Quantity</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Priority</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No rebalancing requests found
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((request) => (
                        <tr
                          key={request.id}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            {request.product?.name || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400 font-mono">
                            {request.source_batch_id || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            {request.source_store_id || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            {request.destination_store_id || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            {request.quantity}
                          </td>
                          <td className="py-3 px-4">
                            {getPriorityBadge(request.priority)}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(request.status)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {request.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(request.id)}
                                    disabled={loading}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setShowRejectModal(true);
                                    }}
                                    disabled={loading}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {(request.status === 'pending' || request.status === 'approved') && (
                                <button
                                  onClick={() => handleCancel(request.id)}
                                  disabled={loading}
                                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors"
                                >
                                  Cancel
                                </button>
                              )}
                              {request.status === 'approved' && (
                                <button
                                  onClick={() => handleComplete(request.id)}
                                  disabled={loading}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors"
                                >
                                  Complete
                                </button>
                              )}
                            </div>
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

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-1 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full my-8">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create Rebalancing Request
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({
                      batch_id: '',
                      product_id: '',
                      source_store_id: '',
                      destination_store_id: '',
                      quantity: '',
                      reason: '',
                      priority: 'medium',
                    });
                    setBatchNumber('');
                    setAvailableQuantity(0);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Source Store *
                </label>
                <select
                  value={createForm.source_store_id}
                  onChange={(e) => {
                    setCreateForm({...createForm, source_store_id: e.target.value, batch_id: '', product_id: '', quantity: ''});
                    setBatchNumber('');
                    setAvailableQuantity(0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Source Store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Batch Number *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="Enter batch number"
                    disabled={!createForm.source_store_id}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={fetchBatchDetails}
                    disabled={!createForm.source_store_id || !batchNumber || loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {loading ? 'Fetching...' : 'Fetch'}
                  </button>
                </div>
                {availableQuantity > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Available: {availableQuantity} units
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Destination Store *
                </label>
                <select
                  value={createForm.destination_store_id}
                  onChange={(e) => setCreateForm({...createForm, destination_store_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Destination Store</option>
                  {stores.filter(s => s.id.toString() !== createForm.source_store_id).map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  max={availableQuantity}
                  value={createForm.quantity}
                  onChange={(e) => setCreateForm({...createForm, quantity: e.target.value})}
                  placeholder="Enter quantity"
                  disabled={!createForm.batch_id}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                />
                {availableQuantity > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Max: {availableQuantity} units
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm({...createForm, priority: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason
                </label>
                <textarea
                  value={createForm.reason}
                  onChange={(e) => setCreateForm({...createForm, reason: e.target.value})}
                  placeholder="Enter reason for rebalancing"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({
                    batch_id: '',
                    product_id: '',
                    source_store_id: '',
                    destination_store_id: '',
                    quantity: '',
                    reason: '',
                    priority: 'medium',
                  });
                  setBatchNumber('');
                  setAvailableQuantity(0);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRequest}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions Modal */}
      {showSuggestionsModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Rebalancing Suggestions
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    AI-powered suggestions based on stock levels
                  </p>
                </div>
                <button
                  onClick={() => setShowSuggestionsModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No rebalancing suggestions available at this time.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {suggestion.product_name}
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {suggestion.sku}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">From</div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {suggestion.from_store_name}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Available: {suggestion.from_store_quantity} units
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">To</div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {suggestion.to_store_name}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Current: {suggestion.to_store_quantity} / Reorder: {suggestion.to_store_reorder_level}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              Suggested: {suggestion.suggested_quantity} units
                            </span>
                          </div>

                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                            {suggestion.reason}
                          </div>
                        </div>

                        <button
                          onClick={() => handleCreateFromSuggestion(suggestion)}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                        >
                          Create Request
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowSuggestionsModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Reject Request
                </h2>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedRequest(null);
                    setRejectionReason('');
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  You are about to reject the rebalancing request for{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedRequest.product?.name}
                  </span>
                  {' '}from{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedRequest.sourceStore?.name}
                  </span>
                  {' '}to{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedRequest.destinationStore?.name}
                  </span>
                  .
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this request"
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}