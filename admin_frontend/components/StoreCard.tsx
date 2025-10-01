'use client';

import { MoreVertical, MapPin, User, TrendingUp, TrendingDown } from 'lucide-react';

interface Store {
  id: string;
  name: string;
  location: string;
  type: 'Warehouse' | 'Store';
  pathao_key: string;
  revenue: number;
  revenueChange: number;
  products: number;
  orders: number;
}

interface StoreCardProps {
  store: Store;
}

/* ---------- Put formatter here (module scope) ---------- */
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatCurrency(num: number) {
  try {
    return currencyFormatter.format(num);
  } catch (err) {
    // Fallback if Intl isn't available / behaves differently on server
    return `$${num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
}
/* ------------------------------------------------------ */

export default function StoreCard({ store }: StoreCardProps) {
  const isPositive = store.revenueChange >= 0;
  const formattedRevenue =formatCurrency(store.revenue);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            {store.name}
          </h3>
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <MapPin className="w-3.5 h-3.5" />
            <span>{store.location}</span>
          </div>
        </div>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <MoreVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </button>
      </div>

      {/* Type & Pathao Key */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
          <span className="text-sm text-gray-900 dark:text-gray-400">{store.type}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Pathao Key</span>
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span className="text-sm text-gray-900 dark:text-white">{store.pathao_key}</span>
          </div>
        </div>
      </div>

      {/* Revenue */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
          <div className="flex items-center gap-1">
            <span className="text-base font-semibold text-gray-900 dark:text-white">
              {formattedRevenue}
            </span>
        
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Products</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{store.products}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Orders</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{store.orders}</p>
        </div>
      </div>
    </div>
  );
}
