import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Store } from '@/services/storeService';
import batchService from '@/services/batchService';

interface DispatchItem {
  batch_id: string;
  batch_number: string;
  product_name: string;
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
  const [currentItem, setCurrentItem] = useState({
    batch_number: '',
    quantity: '',
  });
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchData, setBatchData] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        source_store_id: '',
        destination_store_id: '',
        expected_delivery_date: '',
        carrier_name: '',
        tracking_number: '',
        notes: '',
      });
      setItems([]);
      setCurrentItem({ batch_number: '', quantity: '' });
      setBatchData(null);
    }
  }, [isOpen]);

  const fetchBatchDetails = async () => {
    if (!formData.source_store_id || !currentItem.batch_number) {
      return;
    }

    try {
      setBatchLoading(true);
      const response = await batchService.getBatches({
        store_id: parseInt(formData.source_store_id),
        search: currentItem.batch_number,
      });

      const batches = response.data.data;
      if (batches.length > 0) {
        setBatchData(batches[0]);
      } else {
        setBatchData(null);
        alert('Batch not found');
      }
    } catch (error) {
      console.error('Error fetching batch:', error);
      alert('Failed to fetch batch details');
    } finally {
      setBatchLoading(false);
    }
  };

  const addItem = () => {
    if (!batchData || !currentItem.quantity) {
      alert('Please fetch batch details and enter quantity');
      return;
    }

    const quantity = parseInt(currentItem.quantity);
    if (quantity > batchData.quantity) {
      alert(`Only ${batchData.quantity} units available`);
      return;
    }

    const newItem: DispatchItem = {
      batch_id: batchData.id.toString(),
      batch_number: batchData.batch_number,
      product_name: batchData.product.name,
      quantity: currentItem.quantity,
      available_quantity: batchData.quantity,
    };

    setItems([...items, newItem]);
    setCurrentItem({ batch_number: '', quantity: '' });
    setBatchData(null);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (
      !formData.source_store_id ||
      !formData.destination_store_id ||
      items.length === 0
    ) {
      alert('Please fill in all required fields and add at least one item');
      return;
    }

    onSubmit({
      ...formData,
      items,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full my-8">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Create Dispatch
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Store Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Source Store *
              </label>
              <select
                value={formData.source_store_id}
                onChange={(e) =>
                  setFormData({ ...formData, source_store_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Destination Store *
              </label>
              <select
                value={formData.destination_store_id}
                onChange={(e) =>
                  setFormData({ ...formData, destination_store_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
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

          {/* Delivery & Tracking Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) =>
                  setFormData({ ...formData, expected_delivery_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Carrier Name
              </label>
              <input
                type="text"
                value={formData.carrier_name}
                onChange={(e) =>
                  setFormData({ ...formData, carrier_name: e.target.value })
                }
                placeholder="DHL, FedEx, etc."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tracking Number
            </label>
            <input
              type="text"
              value={formData.tracking_number}
              onChange={(e) =>
                setFormData({ ...formData, tracking_number: e.target.value })
              }
              placeholder="Enter tracking number"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* Add Items Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
              Add Items
            </h3>

            <div className="grid grid-cols-12 gap-2 mb-3">
              <div className="col-span-5">
                <input
                  type="text"
                  value={currentItem.batch_number}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, batch_number: e.target.value })
                  }
                  placeholder="Batch Number"
                  disabled={!formData.source_store_id}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:bg-gray-100 dark:disabled:bg-gray-600"
                />
              </div>
              <div className="col-span-2">
                <button
                  onClick={fetchBatchDetails}
                  disabled={!formData.source_store_id || !currentItem.batch_number || batchLoading}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm"
                >
                  {batchLoading ? 'Loading...' : 'Fetch'}
                </button>
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  value={currentItem.quantity}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, quantity: e.target.value })
                  }
                  placeholder="Quantity"
                  disabled={!batchData}
                  min="1"
                  max={batchData?.quantity}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:bg-gray-100 dark:disabled:bg-gray-600"
                />
              </div>
              <div className="col-span-2">
                <button
                  onClick={addItem}
                  disabled={!batchData || !currentItem.quantity}
                  className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {batchData && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                <strong>Product:</strong> {batchData.product.name} | <strong>Available:</strong>{' '}
                {batchData.quantity} units
              </div>
            )}

            {/* Items List */}
            {items.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">
                        Batch
                      </th>
                      <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">
                        Product
                      </th>
                      <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">
                        Quantity
                      </th>
                      <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-3 py-2 text-gray-900 dark:text-white font-mono text-xs">
                          {item.batch_number}
                        </td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">
                          {item.product_name}
                        </td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removeItem(index)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || items.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium"
          >
            {loading ? 'Creating...' : 'Create Dispatch'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDispatchModal;