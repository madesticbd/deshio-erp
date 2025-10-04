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
  productId: number;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  baseCode: string;
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
      alert('Please fill all fields');
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
    } else {
      alert('Failed to create batch');
    }
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
              return <BatchCard key={batch.id} batch={batch} product={product} />;
            })}
          </div>
        </main>
      </div>
    </div>
  );
}