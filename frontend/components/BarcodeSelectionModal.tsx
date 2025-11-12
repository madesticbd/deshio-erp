"use client";
import React, { useState, useEffect } from "react";

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  codes: string[];
  productName: string;
  price: number;
  onPrint: (selected: string[], quantities: Record<string, number>) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export default function BarcodeSelectionModal({
  isOpen,
  onClose,
  codes,
  productName,
  price,
  onPrint,
  isLoading = false,
  error = null
}: BarcodeModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectAll, setSelectAll] = useState(false);

  // Reset state when modal opens/closes or codes change
  useEffect(() => {
    if (isOpen && codes.length > 0) {
      const initialQuantities: Record<string, number> = {};
      codes.forEach(code => {
        initialQuantities[code] = 1;
      });
      setQuantities(initialQuantities);
      setSelected(new Set());
      setSelectAll(false);
    }
  }, [isOpen, codes]);

  const handleToggle = (code: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      newSelected.add(code);
    }
    setSelected(newSelected);
    setSelectAll(newSelected.size === codes.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
      setSelectAll(false);
    } else {
      setSelected(new Set(codes));
      setSelectAll(true);
    }
  };

  const handleQuantityChange = (code: string, value: string) => {
    const num = parseInt(value) || 1;
    setQuantities(prev => ({
      ...prev,
      [code]: Math.max(1, num)
    }));
  };

  const handlePrint = async () => {
    if (selected.size === 0) {
      alert("Please select at least one barcode to print");
      return;
    }

    const selectedArray = Array.from(selected);
    await onPrint(selectedArray, quantities);
  };

  const getTotalLabels = () => {
    return Array.from(selected).reduce((sum, code) => sum + (quantities[code] || 1), 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Select Barcodes to Print
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {productName} - ৳{price.toLocaleString('en-BD')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading barcodes...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
              <p className="font-medium">Error loading barcodes</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && codes.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="mt-4 text-gray-600 dark:text-gray-400">No barcodes available for this product</p>
            </div>
          )}

          {/* Barcode List */}
          {!isLoading && !error && codes.length > 0 && (
            <>
              {/* Select All */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    Select All ({codes.length} barcodes)
                  </span>
                </label>
                {selected.size > 0 && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selected.size} selected · {getTotalLabels()} labels
                  </span>
                )}
              </div>

              {/* Barcode Items */}
              <div className="space-y-2">
                {codes.map((code) => (
                  <div
                    key={code}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      selected.has(code)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <label className="flex items-center cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selected.has(code)}
                        onChange={() => handleToggle(code)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-3 font-mono text-sm text-gray-900 dark:text-white">
                        {code}
                      </span>
                    </label>
                    
                    {selected.has(code) && (
                      <div className="flex items-center ml-4">
                        <label className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                          Qty:
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={quantities[code] || 1}
                          onChange={(e) => handleQuantityChange(code, e.target.value)}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !error && codes.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selected.size > 0 ? (
                <span>
                  <strong>{getTotalLabels()}</strong> label{getTotalLabels() !== 1 ? 's' : ''} will be printed
                </span>
              ) : (
                <span>Select barcodes to print</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePrint}
                disabled={selected.size === 0}
                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Print {selected.size > 0 && `(${getTotalLabels()})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}