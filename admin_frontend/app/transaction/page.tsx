'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Tag, TrendingDown, TrendingUp, Receipt, Search, ShoppingBag, Store } from 'lucide-react';
import { storageService } from '@/lib/storage';
import { Expense } from '@/types/expense';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

export default function TransactionsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
       const data = await storageService.getTransactions(); // new method
    const allTransactions = [
      ...(data.expenses || []),
      ...(data.income || []),
    ];

    // Sort by date (most recent first)
    allTransactions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setTransactions(allTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };



  useEffect(() => {
    loadTransactions();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `৳${Math.abs(amount).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

const isIncome = (transaction: Expense) => {
  return (
    transaction.category === 'Online Sales' ||
    transaction.category === 'Offline Sale' ||
    transaction.category === 'Social Customer Order' 
  );
};


  const getTransactionIcon = (transaction: Expense) => {
    if (transaction.category === 'Online Sales') {
      return <ShoppingBag className="w-5 h-5" />;
    } else if (transaction.category === 'Offline Sale') {
      return <Store className="w-5 h-5" />;
    } else if (isIncome(transaction)) {
      return <TrendingUp className="w-5 h-5" />;
    } else {
      return <TrendingDown className="w-5 h-5" />;
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by type (income/expense)
    if (filterType === 'income') {
      filtered = filtered.filter(t => isIncome(t));
    } else if (filterType === 'expense') {
      filtered = filtered.filter(t => !isIncome(t));
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(t => {
        const transDate = new Date(t.createdAt);
        
        switch (dateFilter) {
          case 'today':
            return transDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return transDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return transDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const filteredTransactions = filterTransactions();

  // Calculate totals - Income has negative amounts in storage
  const totalIncome = filteredTransactions
    .filter(t => isIncome(t))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const totalExpense = filteredTransactions
    .filter(t => !isIncome(t))
    .reduce((sum, t) => sum + t.amount, 0);
  
  const netBalance = totalIncome - totalExpense;

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
              <p className="text-gray-600 dark:text-gray-400">Track all your financial activities</p>
            </div>
            <Link
              href="/transaction/new"
              className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Expense
            </Link>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Income</span>
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalIncome)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Orders + Offline Sale
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Expense</span>
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totalExpense)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Business Expenses
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Net Balance</span>
                <Receipt className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className={`text-2xl font-bold ${
                netBalance >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(netBalance)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {netBalance >= 0 ? 'Profit' : 'Loss'}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search transactions..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-black dark:focus:ring-white dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-black dark:focus:ring-white dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expenses</option>
              </select>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-black dark:focus:ring-white dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-400">Loading transactions...</div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">No transactions found</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {filterType !== 'all' || searchQuery || dateFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first expense to get started'}
                </p>
                <Link
                  href="/transaction/new"
                  className="inline-block px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  Create Expense
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((transaction) => {
                  const isIncomeTransaction = isIncome(transaction);
                  
                  return (
                    <div 
                      key={transaction.id} 
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`p-3 rounded-lg ${
                          isIncomeTransaction
                            ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                            : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                        }`}>
                          {getTransactionIcon(transaction)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {transaction.name}
                              </h3>
                              {transaction.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {transaction.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(transaction.createdAt)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Tag className="w-4 h-4" />
                                  {transaction.category}
                                </div>
                                {transaction.type && (
                                  <span className={`px-2 py-1 text-xs rounded-full uppercase ${
                                    transaction.type === 'fixed'
                                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                      : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                  }`}>
                                    {transaction.type}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Amount */}
                            <div className="text-right">
                              <div className={`text-lg font-bold ${
                                isIncomeTransaction
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {isIncomeTransaction ? '+' : '-'}{formatCurrency(transaction.amount)}
                              </div>
                            </div>
                          </div>

                          {transaction.comment && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-2">
                              {transaction.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}