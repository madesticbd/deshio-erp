'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StoreCard from '@/components/StoreCard';
import { generateDummyStores } from '@/lib/dummyData';
import { Plus, Search } from 'lucide-react'; // Import Search icon for the search bar

export default function StoresPage() {
  const [darkMode, setDarkMode] = useState(false);
  const stores = generateDummyStores(6);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />

        <div className="flex-1 flex flex-col">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />

          <main className="flex-1 overflow-auto p-6 relative">
            {/* Add Store Button positioned at the top-right corner */}
            <button className="absolute top-4 right-4 flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
              <Plus className="w-4 h-4" />
              Add Store
            </button>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search stores..."
                className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm w-80 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500"
              />
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                Stores
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage and monitor all your store locations
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}