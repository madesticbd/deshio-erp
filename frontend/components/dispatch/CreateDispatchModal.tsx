import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Package, AlertTriangle } from 'lucide-react';
import { Store } from '@/services/storeService';
import BarcodeScanner from '@/components/BarcodeScanner';
import barcodeService, { ScanResult } from '@/services/barcodeService';
import batchService from '@/services/batchService';

interface DispatchItem {
  barcode?: string;
  batch_id: string;
  batch_number: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: string;
  available_quantity: number;
}

interface CreateDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  stores: Store[];
  loading: boolean;
}

const CreateDispatchModal: React.FC<CreateDispatchModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  stores,
  loading,
}) => {
  const [formData, setFormData] = useState({
    source_store_id: '',
    destination_store_id: '',
    expected_delivery_date: '',
    carrier_name: '',
    tracking_number: '',
    notes: '',
  });

  const [items, setItems] = useState<DispatchItem[]>([]);
  const [useBarcodeMode, setUseBarcodeMode] = useState(true); // Default to barcode mode
  const [scannedBarcodes, setScannedBarcodes] = useState<Set<string>>(new Set());
  const [lastScannedProduct, setLastScannedProduct] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      source_store_id: '',
      destination_store_id: '',
      expected_delivery_date: '',
      carrier_name: '',
      tracking_number: '',
      notes: '',
    });
    setItems([]);
    setScannedBarcodes(new Set());
    setUseBarcodeMode(true);
    setLastScannedProduct('');
  };

  const handleBarcodeScanned = (scanResult: ScanResult) => {
    // Check if barcode already scanned
    if (scannedBarcodes.has(scanResult.barcode)) {
      // Show warning but allow if user wants to scan same item multiple times
      if (!confirm(`This barcode (${scanResult.barcode}) has already been scanned. Scan again?`)) {
        return;
      }
    }

    // Check if product has available stock
    if (!scanResult.is_available || scanResult.quantity_available <= 0) {
      return; // Error already shown by BarcodeScanner
    }

    // Validate store location (already done by BarcodeScanner with storeId prop)
    // But we can do additional checks here if needed

    const batchId = scanResult.current_batch!.id.toString();
    const productId = scanResult.product.id.toString();

    // Check if we already have items from this batch
    const existingItem = items.find(item => item.batch_id === batchId);

    if (existingItem) {
      // Increment quantity for existing batch
      const updatedItems = items.map(item =>
        item.batch_id === batchId
          ? { ...item, quantity: (parseInt(item.quantity) + 1).toString() }
          : item
      );
      setItems(updatedItems);
    } else {
      // Add new batch item
      const newItem: DispatchItem = {
        barcode: scanResult.barcode,
        batch_id: batchId,
        batch_number: scanResult.current_batch!.batch_number,
        product_id: productId,
        product_name: scanResult.product.name,
        product_sku: scanResult.product.sku,
        quantity: '1',
        available_quantity: scanResult.quantity_available,
      };
      setItems([...items, newItem]);
    }

    // Mark barcode as scanned
    setScannedBarcodes(new Set(scannedBarcodes.add(scanResult.barcode)));
    setLastScannedProduct(scanResult.product.name);
  };

  const removeItem = (index: number) => {
    const item = items[index];
    
    if (parseInt(item.quantity) > 1) {
      // Decrement quantity
      const updatedItems = items.map((it, i) =>
        i === index
          ? { ...it, quantity: (parseInt(it.quantity) - 1).toString() }
          : it
      );
      setItems(updatedItems);
    } else {
      // Remove item completely
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const removeAllItemsOfBatch = (batchId: string) => {
    if (!confirm('Remove all items from this batch?')) return;
    setItems(items.filter(item => item.batch_id !== batchId));
  };

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + parseInt(item.quantity), 0);
  };

  const getProductSummary = () => {
    const summary = new Map<string, { name: string; sku: string; quantity: number }>();
    
    items.forEach(item => {
      const key = item.product_id;
      if (summary.has(key)) {
        summary.get(key)!.quantity += parseInt(item.quantity);
      } else {
        summary.set(key, {
          name: item.product_name,
          sku: item.product_sku,
          quantity: parseInt(item.quantity),
        });
      }
    });
    
    return Array.from(summary.values());
  };

  const handleSubmit = () => {
    if (!formData.source_store_id || !formData.destination_store_id) {
      alert('Please select source and destination stores');
      return;
    }

    if (items.length === 0) {
      alert('Please add at least one item to dispatch');
      return;
    }

    // Format items for backend
    const formattedItems = items.map(item => ({
      batch_id: item.batch_id,
      quantity: item.quantity,
    }));

    onSubmit({
      ...formData,
      items: formattedItems,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full my-8">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create Dispatch
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {useBarcodeMode 
                  ? '📱 Scan items with barcode scanner' 
                  : '⌨️ Enter batch details manually'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Store Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source Store *
              </label>
              <select
                value={formData.source_store_id}
                onChange={(e) => {
                  setFormData({ ...formData, source_store_id: e.target.value });
                  setItems([]);
                  setScannedBarcodes(new Set());
                }}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Source Store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Destination Store *
              </label>
              <select
                value={formData.destination_store_id}
                onChange={(e) =>
                  setFormData({ ...formData, destination_store_id: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Destination Store</option>
                {stores
                  .filter((s) => s.id.toString() !== formData.source_store_id)
                  .map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expected Delivery
              </label>
              <input
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) =>
                  setFormData({ ...formData, expected_delivery_date: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Carrier
              </label>
              <input
                type="text"
                value={formData.carrier_name}
                onChange={(e) =>
                  setFormData({ ...formData, carrier_name: e.target.value })
                }
                placeholder="DHL, FedEx, etc."
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tracking #
              </label>
              <input
                type="text"
                value={formData.tracking_number}
                onChange={(e) =>
                  setFormData({ ...formData, tracking_number: e.target.value })
                }
                placeholder="Tracking number"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Barcode Scanner / Manual Entry */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Items to Dispatch
              </h3>
              <button
                type="button"
                onClick={() => setUseBarcodeMode(!useBarcodeMode)}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                {useBarcodeMode ? '⌨️ Switch to Manual Entry' : '📱 Switch to Scanner'}
              </button>
            </div>

            {useBarcodeMode ? (
              <>
                {!formData.source_store_id ? (
                  <div className="flex items-center gap-2 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                    <p className="text-sm text-orange-800 dark:text-orange-300">
                      Please select source store before scanning items
                    </p>
                  </div>
                ) : (
                  <>
                    <BarcodeScanner
                      onScanSuccess={handleBarcodeScanned}
                      onScanError={(error) => console.error('Scan error:', error)}
                      storeId={parseInt(formData.source_store_id)}
                      label=""
                      placeholder="Scan barcode here..."
                      disabled={false}
                      autoFocus={true}
                      showModeToggle={true}
                    />

                    {lastScannedProduct && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-300">
                          ✓ Last scanned: <strong>{lastScannedProduct}</strong>
                        </p>
                      </div>
                    )}

                    {scannedBarcodes.size > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Package className="w-4 h-4" />
                        <span>
                          {scannedBarcodes.size} unique barcode{scannedBarcodes.size > 1 ? 's' : ''} scanned
                        </span>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <ManualBatchEntry
                sourceStoreId={formData.source_store_id}
                onAddItem={(item) => setItems([...items, item])}
              />
            )}
          </div>

          {/* Product Summary */}
          {getProductSummary().length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Product Summary
              </h4>
              <div className="space-y-2">
                {getProductSummary().map((product, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-blue-800 dark:text-blue-300">
                      {product.name} ({product.sku})
                    </span>
                    <span className="font-semibold text-blue-900 dark:text-blue-200">
                      {product.quantity} unit{product.quantity > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-blue-900 dark:text-blue-200">Total Items:</span>
                    <span className="text-blue-900 dark:text-blue-200">{getTotalItems()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Items List */}
          {items.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Scanned Items ({getTotalItems()} total units from {items.length} batch{items.length > 1 ? 'es' : ''})
                </h4>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-semibold">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-semibold">
                        Batch
                      </th>
                      <th className="px-4 py-3 text-center text-gray-700 dark:text-gray-300 font-semibold">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-center text-gray-700 dark:text-gray-300 font-semibold">
                        Available
                      </th>
                      <th className="px-4 py-3 text-center text-gray-700 dark:text-gray-300 font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.product_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.product_sku}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                          {item.batch_number}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300 text-sm font-semibold rounded">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                          {item.available_quantity}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => removeItem(index)}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                              title="Remove one unit"
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any special instructions or notes..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {getTotalItems() > 0 ? (
                <span className="font-medium">
                  {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} ready to dispatch
                </span>
              ) : (
                <span>No items added yet</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || items.length === 0}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                {loading ? 'Creating...' : `Create Dispatch (${getTotalItems()} items)`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Manual Batch Entry Component
interface ManualBatchEntryProps {
  sourceStoreId: string;
  onAddItem: (item: DispatchItem) => void;
}

const ManualBatchEntry: React.FC<ManualBatchEntryProps> = ({ sourceStoreId, onAddItem }) => {
  const [batchNumber, setBatchNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [batchData, setBatchData] = useState<any>(null);

  const fetchBatchDetails = async () => {
    if (!sourceStoreId || !batchNumber) {
      alert('Please enter batch number');
      return;
    }

    try {
      setLoading(true);
      const response = await batchService.getBatches({
        store_id: parseInt(sourceStoreId),
        search: batchNumber,
      });

      const batches = response.data.data;
      if (batches.length > 0) {
        setBatchData(batches[0]);
      } else {
        alert('Batch not found');
        setBatchData(null);
      }
    } catch (error) {
      console.error('Error fetching batch:', error);
      alert('Failed to fetch batch details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!batchData || !quantity) {
      alert('Please fetch batch and enter quantity');
      return;
    }

    const qty = parseInt(quantity);
    if (qty > batchData.quantity) {
      alert(`Only ${batchData.quantity} units available`);
      return;
    }

    const newItem: DispatchItem = {
      batch_id: batchData.id.toString(),
      batch_number: batchData.batch_number,
      product_id: batchData.product.id.toString(),
      product_name: batchData.product.name,
      product_sku: batchData.product.sku,
      quantity: quantity,
      available_quantity: batchData.quantity,
    };

    onAddItem(newItem);
    setBatchNumber('');
    setQuantity('');
    setBatchData(null);
  };

  return (
    <div className="space-y-4">
      {!sourceStoreId ? (
        <div className="flex items-center gap-2 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
          <p className="text-sm text-orange-800 dark:text-orange-300">
            Please select source store first
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-5">
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="Batch Number"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <button
                onClick={fetchBatchDetails}
                disabled={!batchNumber || loading}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? 'Loading...' : 'Fetch'}
              </button>
            </div>
            <div className="col-span-3">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Quantity"
                disabled={!batchData}
                min="1"
                max={batchData?.quantity}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600"
              />
            </div>
            <div className="col-span-2">
              <button
                onClick={handleAddItem}
                disabled={!batchData || !quantity}
                className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {batchData && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Product:</strong> {batchData.product.name} <span className="text-gray-500">({batchData.product.sku})</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <strong>Available:</strong> {batchData.quantity} units
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CreateDispatchModal;