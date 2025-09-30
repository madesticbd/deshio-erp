'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import PageHeader from '@/components/PageHeader';
import StoreTable from '@/components/StoreTable';

export default function StorePage() {
  const stores = [
    {
      branchName: 'Banasree',
      address: 'House #12, Road#01...',
      pathaoKey: 'BANASREE1234',
      type: 'Warehouse' as const
    },
    {
      branchName: 'Mohammadpur',
      address: 'House #10, Road#01...',
      pathaoKey: 'MOH1234',
      type: 'Store' as const
    },
    {
      branchName: 'Chittagong',
      address: 'House #04, Road#01...',
      pathaoKey: 'CTG1234',
      type: 'Store' as const
    },
    {
      branchName: 'Gulshan',
      address: 'House #15, Road#01...',
      pathaoKey: 'GULSHAN1234',
      type: 'Store' as const
    }
  ];

  const handleAddStore = () => {
    console.log('Add Store clicked');
    // Add your logic here
  };

  const handleEdit = (store: any) => {
    console.log('Edit store:', store);
    // Add your logic here
  };

  const handleDelete = (store: any) => {
    console.log('Delete store:', store);
    // Add your logic here
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