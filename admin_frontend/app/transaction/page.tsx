'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Tag, IndianRupee } from 'lucide-react';
import { storageService } from '@/lib/storage';
import { Expense } from '@/types/expense';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

export default function TransactionsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await storageService.getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          darkMode={darkMode} 
          setDarkMode={setDarkMode}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your expenses and transactions</p>
            </div>
            <Link
              href="/transaction/new"
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Transaction
            </Link>
          </div>

          {/* Transactions List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">No transactions yet</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Create your first expense to get started
                </p>
                <Link
                  href="/transaction/new"
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Create Expense
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {expenses.map((expense) => (
                  <div key={expense.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">{expense.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            expense.type === 'fixed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {expense.type}
                          </span>
                        </div>
                        
                        {expense.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {expense.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(expense.date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Tag className="w-4 h-4" />
                            {expense.category}
                          </div>
                        </div>

                        {expense.comment && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {expense.comment}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(expense.amount)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(expense.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}