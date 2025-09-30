'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import PageHeader from '@/components/PageHeader';
import StoreTable from '@/components/StoreTable';
import { stores } from '@/data/storesData'; // ✅ import here

export default function StorePage() {
  const handleAddStore = () => {
    console.log('Add Store clicked');
    // Add your logic here
  };

  const handleEdit = (store: any) => {
    console.log('Edit store:', store);
  };

  const handleDelete = (store: any) => {
    console.log('Delete store:', store);
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <Sidebar activeMenu="Store" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <PageHeader 
            title="Store Management" 
            buttonText="Add Store"
            onButtonClick={handleAddStore}
          />
          
          <StoreTable 
            stores={stores}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </main>
      </div>
    </div>
  );
}
