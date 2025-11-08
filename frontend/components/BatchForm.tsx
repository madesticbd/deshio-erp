import React, { useRef } from 'react';

interface Product {
  id: number;
  name: string;
}

interface Store {
  id: number;
  name: string;
}

interface BatchFormProps {
  selectedProduct: Product | undefined;
  selectedStore: Store | undefined;
  stores: Store[];
  onProductClick: () => void;
  onStoreChange: (storeId: number) => void;
  onAddBatch: (data: { costPrice: string; sellingPrice: string; quantity: string }) => void;
  onClear: () => void;
}

export default function BatchForm({
  selectedProduct,
  selectedStore,
  stores,
  onProductClick,
  onStoreChange,
  onAddBatch,
  onClear
}: BatchFormProps) {
  const costPriceRef = useRef<HTMLInputElement>(null);
  const sellingPriceRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    onAddBatch({
      costPrice: costPriceRef.current?.value || '',
      sellingPrice: sellingPriceRef.current?.value || '',
      quantity: quantityRef.current?.value || '',
    });
  };

  const handleClear = () => {
    if (costPriceRef.current) costPriceRef.current.value = '';
    if (sellingPriceRef.current) sellingPriceRef.current.value = '';
    if (quantityRef.current) quantityRef.current.value = '';
    onClear();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Product Selection */}
        <div
          onClick={onProductClick}
          className="border rounded px-3 py-2 bg-white dark:bg-gray-700 cursor-pointer hover:border-indigo-500 transition-colors flex items-center justify-between"
        >
          <span className={selectedProduct ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
            {selectedProduct ? selectedProduct.name : 'Select Product...'}
          </span>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Store Selection */}
        <select
          value={selectedStore?.id || ''}
          onChange={e => onStoreChange(Number(e.target.value))}
          className="border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none transition-colors"
        >
          <option value="">Select Store...</option>
          {stores.map(store => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>

        {/* Cost Price - UNCONTROLLED */}
        <input
          ref={costPriceRef}
          type="number"
          step="0.01"
          placeholder="Cost Price"
          className="border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none transition-colors"
        />

        {/* Selling Price - UNCONTROLLED */}
        <input
          ref={sellingPriceRef}
          type="number"
          step="0.01"
          placeholder="Selling Price"
          className="border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none transition-colors"
        />

        {/* Quantity - UNCONTROLLED */}
        <input
          ref={quantityRef}
          type="number"
          placeholder="Quantity"
          min={1}
          step="1"
          className="border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none transition-colors"
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={handleSubmit} className="px-4 py-2 bg-gray-900 dark:bg-indigo-600 text-white rounded hover:bg-gray-800 dark:hover:bg-indigo-700 transition-colors">
          Add Batch
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}