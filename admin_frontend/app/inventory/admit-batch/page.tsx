'use client';

import { useState, useEffect } from 'react';
import { Scan, CheckCircle, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useRouter, useSearchParams } from 'next/navigation';

interface Batch {
  id: number;
  baseCode: string;
  productId: number;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function AdmitBatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const batchId = searchParams.get('batchId');
  
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [currentCount, setCurrentCount] = useState(1);
  const [admittedCount, setAdmittedCount] = useState(0);
  const [productCode, setProductCode] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    // Fetch batch details
    const fetchBatch = async () => {
      try {
        const response = await fetch('/api/batch');
        if (response.ok) {
          const data = await response.json();
          const foundBatch = data.find((b: Batch) => b.id === Number(batchId));
          if (foundBatch) {
            setBatch(foundBatch);
            setProductCode(`${foundBatch.baseCode}-${String(currentCount).padStart(2, '0')}`);
          }
        }
      } catch (error) {
        console.error('Error fetching batch:', error);
      }
    };

    if (batchId) {
      fetchBatch();
    }
  }, [batchId, currentCount]);

  useEffect(() => {
    if (batch) {
      setProductCode(`${batch.baseCode}-${String(currentCount).padStart(2, '0')}`);
    }
  }, [currentCount, batch]);
  
  async function getWarehouseLocation() {
    try {
      const response = await fetch('/api/stores');
      if (response.ok) {
        const stores = await response.json();
        const warehouse = stores.find((store: any) => store.type === 'warehouse');
        return warehouse ? warehouse.name : 'Mohammadpur';
      }
    } catch (error) {
      console.error('Error fetching warehouse:', error);
    }
    return 'Mohammadpur';
  }

  const handleAdmitProduct = async () => {
    if (!batch) {
      showToast('Batch information is missing', 'error');
      return;
    }

    if (!productCode) {
      showToast('Product code is required', 'error');
      return;
    }

    try {
      const location = await getWarehouseLocation();

      // Create inventory item
      const inventoryItem = {
        productId: batch.productId,
        batchId: batch.id,
        barcode: productCode,
        costPrice: Number(batch.costPrice),
        sellingPrice: Number(batch.sellingPrice),
        location,
        status: 'available',
        admittedAt: new Date().toISOString()
      };

      // Validate required fields before sending
      if (!inventoryItem.productId || !inventoryItem.barcode || 
          !inventoryItem.costPrice || !inventoryItem.sellingPrice) {
        throw new Error('Missing required fields. Please check batch data.');
      }

      // Save to inventory
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inventoryItem),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to admit product: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();

      // Update local state
      if (admittedCount + 1 < batch.quantity) {
        setAdmittedCount(admittedCount + 1);
        setCurrentCount(currentCount + 1);
        showToast('Product admitted successfully!', 'success');
      } else {
        // Last product admitted
        setAdmittedCount(admittedCount + 1);
        showToast('All products from this batch have been admitted!', 'success');
        try {
          await fetch(`/api/batch/${batch.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admitted: 'yes' }),
          });
        } catch (error) {
          console.error('Failed to update batch status:', error);
        }

        // Redirect back after short delay
        setTimeout(() => {
          window.location.href = '/inventory/manage_stock';
        }, 1500);
      }
    } catch (error) {
      showToast(`Failed to admit product: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleProductCodeChange = (value: string) => {
    setProductCode(value);
    // Extract the number from the code if it follows the pattern
    const match = value.match(/-(\d+)$/);
    if (match) {
      const num = parseInt(match[1]);
      if (!isNaN(num) && num > 0 && num <= (batch?.quantity || 0)) {
        setCurrentCount(num);
      }
    }
  };

  if (!batch) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header 
              darkMode={darkMode} 
              setDarkMode={setDarkMode}
              toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />
            <main className="flex-1 overflow-auto p-6 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading batch details...</p>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header 
            darkMode={darkMode} 
            setDarkMode={setDarkMode}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="flex-1 overflow-auto p-6">
            {/* Toast Notifications */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
              {toasts.map((toast) => (
                <div
                  key={toast.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
                    toast.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  } animate-slideIn`}
                >
                  {toast.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  )}
                  <p className={`text-sm font-medium ${
                    toast.type === 'success'
                      ? 'text-green-900 dark:text-green-300'
                      : 'text-red-900 dark:text-red-300'
                  }`}>
                    {toast.message}
                  </p>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className={`ml-2 ${
                      toast.type === 'success'
                        ? 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
                        : 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Page Header with Scanner Status */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                  Admit Batch
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Batch: {batch.baseCode} • Total Quantity: {batch.quantity}
                </p>
              </div>

              {/* Barcode Scanner Status */}
              <button
                onClick={() => setScannerActive(!scannerActive)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  scannerActive
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Scan className={`w-5 h-5 ${
                    scannerActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`} />
                  <div className="text-left">
                    <div className={`font-semibold ${
                      scannerActive ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'
                    }`}>
                      Barcode Scanner
                    </div>
                    <div className={`text-sm ${
                      scannerActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {scannerActive ? 'Barcode Scanner is active' : 'Click Here to activate'}
                    </div>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  scannerActive ? 'bg-green-500' : 'bg-red-500'
                }`} />
              </button>
            </div>

            {/* Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progress
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {admittedCount} / {batch.quantity}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-gray-900 dark:bg-white h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(admittedCount / batch.quantity) * 100}%` }}
                />
              </div>
            </div>

            {/* Admit Product Form */}
            {!scannerActive && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Admit Product
                </h2>
                
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product Code
                    </label>
                    <input
                      type="text"
                      value={productCode}
                      onChange={(e) => handleProductCodeChange(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500"
                      placeholder="Enter product code"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Auto-generated code, editable if needed
                    </p>
                  </div>
                  
                  <button
                    onClick={handleAdmitProduct}
                    disabled={admittedCount >= batch.quantity}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Admit
                  </button>
                </div>

                {/* Batch Info */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cost Price</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${batch.costPrice}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Selling Price</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${batch.sellingPrice}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Remaining</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {batch.quantity - admittedCount}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Scanner Active Message */}
            {scannerActive && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Scan className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Barcode Scanner Active
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Scan products to admit them automatically, or turn off the scanner to admit manually
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}