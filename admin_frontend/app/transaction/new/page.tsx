'use client';

import { useState, useEffect, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { storageService } from '@/lib/storage';
import { Category } from '@/types/expense';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import NewCategoryForm from '@/components/NewCategoryForm';

export default function NewTransactionPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'fixed' as 'fixed' | 'variable',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    comment: '',
    receipt: ''
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const categoriesData = await storageService.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      setFormData(prev => ({ ...prev, receipt: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      handleFileUpload(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleCategoryCreated = async () => {
    try {
      const updatedCategories = await storageService.getCategories();
      setCategories(updatedCategories);
      // Optionally select the newly created category
      if (updatedCategories.length > 0) {
        const newCategory = updatedCategories[updatedCategories.length - 1];
        setFormData(prev => ({ ...prev, category: newCategory.name }));
      }
    } catch (error) {
      console.error('Failed to load updated categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || !formData.category) return;

    setIsSubmitting(true);
    try {
      await storageService.saveExpense({
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).toISOString(),
        receiptImage: formData.receipt // Make sure this gets stored
      });
      router.push('/transaction');
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert('Failed to save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/transaction"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                New Expense
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create a new expense transaction
              </p>
            </div>
          </div>

          {/* Two-column Layout */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT COLUMN - Form Fields */}
                <div className="space-y-6">
                  {/* Expense Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expense Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Electricity Bill"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Brief description of the expense"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Expense Type and Amount */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expense Type *
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="fixed">Fixed</option>
                        <option value="variable">Variable</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Amount (৳) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Category with New Category button */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Category *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCategoryForm(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        + New Category
                      </button>
                    </div>
                    {isLoadingCategories ? (
                      <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700">
                        <span className="text-gray-500">Loading categories...</span>
                      </div>
                    ) : (
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Comment
                    </label>
                    <textarea
                      value={formData.comment}
                      onChange={(e) => handleInputChange('comment', e.target.value)}
                      placeholder="Additional notes about this expense"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN - Receipt Image */}
                <div className="flex flex-col h-full">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Receipt Image
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Upload an image of the receipt or proof of payment
                  </p>

                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`flex-1 flex items-center justify-center border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {preview ? (
                      <div className="relative inline-block">
                        <img
                          src={preview}
                          alt="Receipt Preview"
                          className="max-h-64 rounded-md mx-auto"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreview(null);
                            setFormData(prev => ({ ...prev, receipt: '' }));
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center space-y-2">
                        <Upload className="w-8 h-8 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Click to upload
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          PNG, JPG or WEBP
                        </span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/transaction"
                  className="flex-1 px-4 py-2 text-center text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.name ||
                    !formData.amount ||
                    !formData.category ||
                    isLoadingCategories
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* New Category Form Modal */}
      <NewCategoryForm
        isOpen={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        onCategoryCreated={handleCategoryCreated}
      />
    </div>
  );
}