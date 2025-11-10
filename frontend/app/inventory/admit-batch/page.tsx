'use client';

import { useState, useEffect } from 'react';
import { Scan, CheckCircle, X, AlertCircle, CheckCircle2, ArrowLeft, Package } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useRouter, useSearchParams } from 'next/navigation';
import { batchService, barcodeService, type Batch } from '@/services';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface AdmittedBarcode {
  barcode: string;
  admitted_at: string;
}

export default function AdmitBatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const batchId = searchParams.get('batchId');
  
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [availableBarcodes, setAvailableBarcodes] = useState<string[]>([]);
  const [admittedBarcodes, setAdmittedBarcodes] = useState<AdmittedBarcode[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [loading, setLoading] = useState(true);

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
    if (batchId) {
      fetchBatchDetails();
    }
  }, [batchId]);

  const fetchBatchDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch batch details
      const batchData = await batchService.getBatch(Number(batchId));
      const batchInfo = batchData.data;
      
      setBatch(batchInfo);

      // Fetch all barcodes for this product
      try {
        const barcodesData = await barcodeService.getProductBarcodes(batchInfo.product.id);
        const batchBarcodes = barcodesData.data.barcodes || [];
        
        console.log('📦 All barcodes for product:', batchBarcodes);
        
        // Extract barcode values
        const allBarcodeValues = batchBarcodes.map((b) => b.barcode);
        setAvailableBarcodes(allBarcodeValues);
        
        showToast(`Found ${allBarcodeValues.length} barcodes ready to scan`, 'success');
        
      } catch (err) {
        console.error('Error fetching barcodes:', err);
        showToast('No barcodes found for this product', 'error');
        setAvailableBarcodes([]);
      }

    } catch (error: any) {
      console.error('Error fetching batch:', error);
      const errorMsg = error?.response?.data?.message || 'Failed to load batch details';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Barcode Scanner Logic
  useEffect(() => {
    if (!scannerActive || !batch) return;

    let barcode = '';
    let barcodeTimeout: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        
        if (barcode.trim()) {
          const scannedCode = barcode.trim();
          setLastScannedCode(scannedCode);
          barcode = '';
          
          handleScanBarcode(scannedCode);
        }
        return;
      }

      if (e.key.length > 1) return;

      barcode += e.key;

      clearTimeout(barcodeTimeout);
      barcodeTimeout = setTimeout(() => {
        barcode = '';
      }, 100);
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      clearTimeout(barcodeTimeout);
    };
  }, [scannerActive, batch, availableBarcodes, admittedBarcodes]);

  const handleScanBarcode = async (scannedCode: string) => {
    if (!batch) {
      showToast('Batch information is missing', 'error');
      return;
    }

    console.log('🔍 Scanning barcode:', scannedCode);

    // Check if barcode exists in available barcodes
    if (!availableBarcodes.includes(scannedCode)) {
      showToast(`Barcode ${scannedCode} not found in this batch`, 'error');
      return;
    }

    // Check if already admitted
    const alreadyAdmitted = admittedBarcodes.some(b => b.barcode === scannedCode);
    if (alreadyAdmitted) {
      showToast(`Barcode ${scannedCode} has already been admitted`, 'error');
      return;
    }

    try {
      // Verify barcode exists in backend
      const scanResult = await barcodeService.scanBarcode(scannedCode);
      
      if (!scanResult.success) {
        showToast(`Invalid barcode: ${scannedCode}`, 'error');
        return;
      }

      console.log('✅ Barcode verified:', scanResult.data);

      // Add to admitted list
      const newAdmitted: AdmittedBarcode = {
        barcode: scannedCode,
        admitted_at: new Date().toISOString(),
      };

      setAdmittedBarcodes(prev => [...prev, newAdmitted]);
      showToast(`✓ Barcode ${scannedCode} admitted successfully!`, 'success');

      // Check if all barcodes admitted
      if (admittedBarcodes.length + 1 >= availableBarcodes.length) {
        showToast('🎉 All barcodes have been admitted!', 'success');
        
        setTimeout(() => {
          router.push('/inventory/manage_stock');
        }, 2000);
      }

    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Unknown error';
      showToast(`Failed to verify barcode: ${errorMsg}`, 'error');
      console.error('Error scanning barcode:', error);
    }
  };

  const handleManualAdmit = (barcode: string) => {
    handleScanBarcode(barcode);
  };

  if (loading) {
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
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading batch details...</p>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

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
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">Batch not found</p>
                <button
                  onClick={() => router.push('/inventory/manage_stock')}
                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg"
                >
                  Back to Manage Stock
                </button>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  const totalBarcodes = availableBarcodes.length;
  const admittedCount = admittedBarcodes.length;
  const remainingCount = totalBarcodes - admittedCount;
  const progressPercentage = totalBarcodes > 0 ? (admittedCount / totalBarcodes) * 100 : 0;

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

            {/* Back Button */}
            <button
              onClick={() => router.push('/inventory/manage_stock')}
              className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Manage Stock
            </button>

            {/* Page Header with Scanner Status */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                  Admit Batch - Scan Barcodes
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Product: {batch.product.name} • Batch: {batch.batch_number}
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
                      {scannerActive ? 'Ready to scan' : 'Click to activate'}
                    </div>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  scannerActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`} />
              </button>
            </div>

            {/* Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Admission Progress
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {admittedCount} / {totalBarcodes}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-3 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {remainingCount} remaining
                </span>
                {lastScannedCode && scannerActive && (
                  <span className="text-gray-600 dark:text-gray-300">
                    Last: <span className="font-mono font-semibold">{lastScannedCode}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Scanner Active Message */}
            {scannerActive && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-green-200 dark:border-green-800 p-12 text-center mb-6">
                <div className="relative inline-block mb-4">
                  <Scan className="w-20 h-20 text-green-500 dark:text-green-400 mx-auto" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Scanner Active - Ready to Scan
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Scan each barcode to admit it to inventory
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-800 dark:text-green-300 font-medium">
                    {totalBarcodes} barcodes ready to scan
                  </span>
                </div>
              </div>
            )}

            {/* Barcode Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Available Barcodes */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  Available to Scan ({remainingCount})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableBarcodes
                    .filter(code => !admittedBarcodes.some(a => a.barcode === code))
                    .map((code, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                      >
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                          {code}
                        </span>
                        <button
                          onClick={() => handleManualAdmit(code)}
                          disabled={!scannerActive}
                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Admit
                        </button>
                      </div>
                    ))}
                  {remainingCount === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      All barcodes admitted! ✓
                    </div>
                  )}
                </div>
              </div>

              {/* Admitted Barcodes */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Admitted ({admittedCount})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {admittedBarcodes.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                    >
                      <span className="font-mono text-sm text-gray-900 dark:text-white">
                        {item.barcode}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.admitted_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                  {admittedCount === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No barcodes admitted yet
                    </div>
                  )}
                </div>
              </div>
            </div>
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