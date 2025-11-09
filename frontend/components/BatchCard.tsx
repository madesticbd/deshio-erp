import React, { useState } from 'react';
import Barcode from 'react-barcode';
import BatchPrinter from './BatchPrinter';
import { Batch } from '@/services/batchService';

interface BatchCardProps {
  batch: Batch;
  onDelete?: (batchId: number) => void;
}

export default function BatchCard({ batch, onDelete }: BatchCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this batch?')) return;
    
    try {
      setDeleting(true);
      
      if (onDelete) {
        await onDelete(batch.id);
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleting(false);
    }
  };

  // Helper to parse Laravel formatted numbers (removes commas)
  const parseFormattedNumber = (value: string): number => {
    return parseFloat(value.replace(/,/g, ''));
  };

  // Convert Laravel batch to legacy format for existing components
  const legacyBatch = {
    id: batch.id,
    productId: batch.product.id,
    quantity: batch.quantity,
    costPrice: parseFormattedNumber(batch.cost_price),
    sellingPrice: parseFormattedNumber(batch.sell_price),
    baseCode: batch.barcode?.barcode || batch.batch_number,
  };

  const legacyProduct = {
    id: batch.product.id,
    name: batch.product.name,
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="text-sm text-gray-500">Product</div>
          <div className="font-medium text-gray-900 dark:text-white">{batch.product.name}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500">Qty</div>
            <div className="font-medium">{batch.quantity}</div>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="group relative p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-800 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete batch"
          >
            {deleting ? (
              <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Cost:</span>
            <span className="font-medium ml-1">৳{legacyBatch.costPrice.toLocaleString('en-BD')}</span>
          </div>
          <div>
            <span className="text-gray-500">Selling:</span>
            <span className="font-medium ml-1">৳{legacyBatch.sellingPrice.toLocaleString('en-BD')}</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-2">Base Barcode Preview</div>
      <div className="flex justify-center mb-4 p-3 border rounded bg-gray-50 dark:bg-gray-700">
        <div className="flex flex-col items-center">
          <Barcode 
            value={legacyBatch.baseCode} 
            format="CODE128" 
            renderer="svg" 
            width={1.5} 
            height={50} 
            displayValue={true} 
            margin={4} 
          />
          <div className="text-xs mt-2 text-center text-gray-600 dark:text-gray-300">
            Will print {batch.quantity} codes<br />
            ({legacyBatch.baseCode}-01 to -{String(batch.quantity).padStart(2, '0')})
          </div>
        </div>
      </div>

      <BatchPrinter batch={legacyBatch} product={legacyProduct} />
    </div>
  );
}