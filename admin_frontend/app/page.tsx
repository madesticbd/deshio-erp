'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StoreCard from '@/components/StoreCard';
import { generateDummyStores } from '@/lib/dummyData';

export default function StoresPage() {
  const [darkMode, setDarkMode] = useState(false);
  const stores = generateDummyStores(6);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        
        <div className="flex-1 flex flex-col">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />
          
          <main className="flex-1 overflow-auto p-6">
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