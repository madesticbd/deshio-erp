import React from 'react';
import Barcode from 'react-barcode';
import BatchPrinter from './BatchPrinter';

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

interface BatchCardProps {
  batch: Batch;
  product?: Product;
}

export default function BatchCard({ batch, product }: BatchCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm text-gray-500">Product</div>
          <div className="font-medium text-gray-900 dark:text-white">{product?.name ?? '—'}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Qty</div>
          <div className="font-medium">{batch.quantity}</div>
        </div>
      </div>

      <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Cost:</span>
            <span className="font-medium ml-1">{batch.costPrice}</span>
          </div>
          <div>
            <span className="text-gray-500">Selling:</span>
            <span className="font-medium ml-1">{batch.sellingPrice}</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-2">Base Barcode Preview</div>
      <div className="flex justify-center mb-4 p-3 border rounded bg-gray-50 dark:bg-gray-700">
        <div className="flex flex-col items-center">
          <Barcode value={batch.baseCode} format="CODE128" renderer="svg" width={1.5} height={50} displayValue={true} margin={4} />
          <div className="text-xs mt-2 text-center text-gray-600 dark:text-gray-300">
            Will print {batch.quantity} codes<br />
            ({batch.baseCode}-01 to -{String(batch.quantity).padStart(2, '0')})
          </div>
        </div>
      </div>

      <BatchPrinter batch={batch} product={product} />
    </div>
  );
}