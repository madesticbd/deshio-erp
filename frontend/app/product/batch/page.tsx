'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import BatchForm from '@/components/BatchForm';
import BatchCard from '@/components/BatchCard';
import batchService, { Batch, CreateBatchData } from '@/services/batchService';
import storeService, { Store } from '@/services/storeService';

interface Product {
  id: number;
  name: string;
}

export default function BatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Changed to true
  const [stores, setStores] = useState<Store[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  // Read URL parameters when redirected back from product selection
  useEffect(() => {
    const pid = searchParams?.get('productId');
    const pname = searchParams?.get('productName');
    
    if (pid) {
      setSelectedProductId(Number(pid));
    }
    
    if (pname) {
      setSelectedProductName(decodeURIComponent(pname));
    }
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      try {
        // Load stores
        const storesResponse = await storeService.getStores({ is_active: true });
        const storesData = storesResponse.data?.data || storesResponse.data || [];
        setStores(storesData);
        
        // Set first store as default
        if (storesData.length > 0 && !selectedStoreId) {
          setSelectedStoreId(storesData[0].id);
        }

        // Load batches
        const batchResponse = await batchService.getBatches({
          sort_by: 'created_at',
          sort_order: 'desc',
        });
        const batchData = batchResponse.data?.data || batchResponse.data || [];
        setBatches(Array.isArray(batchData) ? batchData : []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const openProductListForSelection = () => {
    router.push('/product/list?selectMode=true&redirect=/product/batch');
  };

  const handleAddBatch = async () => {
    if (!selectedProductId || !selectedStoreId || costPrice === '' || sellingPrice === '' || quantity === '') {
      setToast({ message: 'Please fill all fields', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      const batchData: CreateBatchData = {
        product_id: selectedProductId,
        store_id: selectedStoreId,
        quantity: Number(quantity),
        cost_price: Number(costPrice),
        sell_price: Number(sellingPrice),
        generate_barcodes: true,
        barcode_type: 'CODE128',
      };

      const response = await batchService.createBatch(batchData);
      
      // Reload batches
      const batchResponse = await batchService.getBatches({
        sort_by: 'created_at',
        sort_order: 'desc',
      });
      const batchData2 = batchResponse.data?.data || batchResponse.data || [];
      setBatches(Array.isArray(batchData2) ? batchData2 : []);
      
      setSelectedProductId(null);
      setSelectedProductName('');
      setCostPrice('');
      setSellingPrice('');
      setQuantity('');
      setToast({ message: 'Batch created successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      console.error('Failed to create batch:', err);
      setToast({ message: 'Failed to create batch', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDeleteBatch = async (batchId: number) => {
    try {
      await batchService.deleteBatch(batchId);
      setBatches(prev => prev.filter(b => b.id !== batchId));
      setToast({ message: 'Batch deleted successfully', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Failed to delete batch:', err);
      setToast({ message: 'Failed to delete batch', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleClear = () => {
    setSelectedProductId(null);
    setSelectedProductName('');
    setCostPrice('');
    setSellingPrice('');
    setQuantity('');
  };

  const selectedProduct = selectedProductId 
    ? { id: selectedProductId, name: selectedProductName }
    : undefined;

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          />

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Batches</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create a batch and print barcodes</p>
            </div>

            <BatchForm
              selectedProduct={selectedProduct}
              costPrice={costPrice}
              sellingPrice={sellingPrice}
              quantity={quantity}
              onProductClick={openProductListForSelection}
              onCostPriceChange={setCostPrice}
              onSellingPriceChange={setSellingPrice}
              onQuantityChange={setQuantity}
              onAddBatch={handleAddBatch}
              onClear={handleClear}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.map(batch => (
                <BatchCard 
                  key={batch.id} 
                  batch={batch}
                  onDelete={handleDeleteBatch}
                />
              ))}
            </div>
          </main>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 z-50 ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}