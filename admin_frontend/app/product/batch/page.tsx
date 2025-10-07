'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import BatchForm from '@/components/BatchForm';
import BatchCard from '@/components/BatchCard';

interface Product {
  id: number;
  name: string;
  attributes?: Record<string, any>;
}

interface Batch {
  id: number;
  baseCode: string;
  productId: number;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  admitted: string; // ✅ add this
}

export default function BatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [darkMode, setDarkMode] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    const pid = searchParams?.get('productId');
    if (pid) setSelectedProductId(Number(pid));
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, bRes] = await Promise.all([fetch('/api/products'), fetch('/api/batch')]);
        const pJson = pRes.ok ? await pRes.json() : [];
        const bJson = bRes.ok ? await bRes.json() : [];
        setProducts(Array.isArray(pJson) ? pJson : []);
        setBatches(Array.isArray(bJson) ? bJson : []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const openProductListForSelection = () => {
    router.push('/product/list?selectMode=true&redirect=/product/batch');
  };

  const handleAddBatch = async () => {
    if (!selectedProductId || costPrice === '' || sellingPrice === '' || quantity === '') {
      setToast({ message: 'Please fill all fields', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const body = {
      productId: selectedProductId,
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      quantity: Number(quantity),
    };

    const res = await fetch('/api/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const newBatch = await res.json();
      setBatches(prev => [...prev, newBatch]);
      setCostPrice('');
      setSellingPrice('');
      setQuantity('');
      setToast({ message: 'Batch created successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } else {
      setToast({ message: 'Failed to create batch', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDeleteBatch = (batchId: number) => {
    setBatches(prev => prev.filter(b => b.id !== batchId));
  };

  const handleClear = () => {
    setSelectedProductId(null);
    setCostPrice('');
    setSellingPrice('');
    setQuantity('');
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className={`${darkMode ? 'dark' : ''} flex h-screen`}>
      <Sidebar />
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />

        <main className="p-6 flex-1 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Batches</h1>
            <p className="text-sm text-gray-500">Create a batch and print barcodes</p>
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
            {batches.map(batch => {
              const product = products.find(p => p.id === batch.productId);
              return (
                <BatchCard 
                  key={batch.id} 
                  batch={batch} 
                  product={product}
                  onDelete={handleDeleteBatch}
                />
              );
            })}
          </div>
        </main>

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 ${
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
    </div>
  );
}