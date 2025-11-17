import { useState } from 'react';
import { X, RotateCcw, Calculator, ChevronDown } from 'lucide-react';

interface Order {
  id: number;
  order_number: string;
  customer?: {
    name: string;
    phone: string;
  };
  items: Array<{
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: string;
    total_price: string;
  }>;
  total_amount: string;
  paid_amount: string;
  outstanding_amount: string;
}

type ReturnType = 'defective' | 'damaged' | 'wrong_item' | 'unwanted' | 'other';

interface ReturnProductModalProps {
  order: Order;
  onClose: () => void;
  onReturn: (returnData: {
    selectedProducts: Array<{ 
      order_item_id: number; 
      quantity: number;
    }>;
    refundMethods: {
      cash: number;
      card: number;
      bkash: number;
      nagad: number;
      total: number;
    };
    returnReason: string;
    returnType: ReturnType;
  }) => Promise<void>;
}

export default function ReturnProductModal({ order, onClose, onReturn }: ReturnProductModalProps) {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [returnedQuantities, setReturnedQuantities] = useState<{ [key: number]: number }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Return info
  const [returnType, setReturnType] = useState<ReturnType>('defective');
  const [returnReason, setReturnReason] = useState('');

  // Refund payment states
  const [refundCash, setRefundCash] = useState(0);
  const [refundCard, setRefundCard] = useState(0);
  const [refundBkash, setRefundBkash] = useState(0);
  const [refundNagad, setRefundNagad] = useState(0);
  const [showNoteCounter, setShowNoteCounter] = useState(false);

  // Note counter states
  const [note1000, setNote1000] = useState(0);
  const [note500, setNote500] = useState(0);
  const [note200, setNote200] = useState(0);
  const [note100, setNote100] = useState(0);
  const [note50, setNote50] = useState(0);
  const [note20, setNote20] = useState(0);
  const [note10, setNote10] = useState(0);
  const [note5, setNote5] = useState(0);
  const [note2, setNote2] = useState(0);
  const [note1, setNote1] = useState(0);

  const handleProductCheckbox = (productId: number) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        const newSelected = prev.filter(id => id !== productId);
        const newQuantities = { ...returnedQuantities };
        delete newQuantities[productId];
        setReturnedQuantities(newQuantities);
        return newSelected;
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleQuantityChange = (productId: number, qty: number, maxQty: number) => {
    if (qty < 0 || qty > maxQty) return;
    setReturnedQuantities(prev => ({ ...prev, [productId]: qty }));
  };

  const calculateTotals = () => {
    const returnAmount = selectedProducts.reduce((sum, productId) => {
      const product = order.items.find(p => p.id === productId);
      if (!product) return sum;
      const qty = returnedQuantities[productId] || 0;
      const price = parseFloat(String(product.unit_price).replace(/[^0-9.-]/g, ''));
      return sum + (price * qty);
    }, 0);

    const totalPaid = parseFloat(String(order.paid_amount).replace(/[^0-9.-]/g, ''));
    const refundToCustomer = Math.min(returnAmount, totalPaid);

    return {
      returnAmount,
      totalPaid,
      refundToCustomer,
    };
  };

  const totals = calculateTotals();

  const cashFromNotes = (note1000 * 1000) + (note500 * 500) + (note200 * 200) + 
                        (note100 * 100) + (note50 * 50) + (note20 * 20) + 
                        (note10 * 10) + (note5 * 5) + (note2 * 2) + (note1 * 1);

  const effectiveRefundCash = cashFromNotes > 0 ? cashFromNotes : refundCash;
  const totalRefundProcessed = effectiveRefundCash + refundCard + refundBkash + refundNagad;
  const remainingRefund = totals.refundToCustomer - totalRefundProcessed;

  const getReturnTypeLabel = (type: ReturnType): string => {
    const labels: Record<ReturnType, string> = {
      defective: 'Defective - Manufacturing defect',
      damaged: 'Damaged - Damaged during shipping',
      wrong_item: 'Wrong Item - Wrong product sent',
      unwanted: 'Unwanted - Customer changed mind',
      other: 'Other - Other reason',
    };
    return labels[type];
  };

  const handleProcessReturn = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product to return');
      return;
    }

    const hasInvalidQuantities = selectedProducts.some(id => {
      const qty = returnedQuantities[id];
      return !qty || qty <= 0;
    });

    if (hasInvalidQuantities) {
      alert('Please set quantities for all selected products');
      return;
    }

    if (!returnReason.trim()) {
      alert('Please enter a return reason');
      return;
    }

    let confirmMessage = `Process return?\n\n`;
    confirmMessage += `Return Type: ${getReturnTypeLabel(returnType)}\n`;
    confirmMessage += `Return Reason: ${returnReason}\n\n`;
    
    if (totals.refundToCustomer > 0) {
      if (remainingRefund > 0) {
        confirmMessage += `Refund Required: ৳${totals.refundToCustomer.toLocaleString()}\nRefunded: ৳${totalRefundProcessed.toLocaleString()}\nRemaining: ৳${remainingRefund.toLocaleString()}\n\nCustomer can collect remaining later.`;
      } else {
        confirmMessage += `Refund ৳${totals.refundToCustomer.toLocaleString()} to customer (Fully processed)`;
      }
    } else {
      confirmMessage += `Reduce order total by ৳${totals.returnAmount.toLocaleString()}`;
    }

    if (!confirm(confirmMessage)) return;

    setIsProcessing(true);
    try {
      await onReturn({
        selectedProducts: selectedProducts.map(id => ({
          order_item_id: id,
          quantity: returnedQuantities[id],
        })),
        refundMethods: {
          cash: effectiveRefundCash,
          card: refundCard,
          bkash: refundBkash,
          nagad: refundNagad,
          total: totalRefundProcessed,
        },
        returnReason,
        returnType,
      });
    } catch (error: any) {
      console.error('Return failed:', error);
      alert(error.message || 'Failed to process return');
    } finally {
      setIsProcessing(false);
    }
  };

  const NoteInput = ({ value, state, setState }: any) => (
    <div>
      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳{value} ×</label>
      <input 
        type="number" 
        min="0" 
        value={state} 
        onChange={(e) => setState(Number(e.target.value))} 
        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" 
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-5 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Return Products - {order.order_number}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Select items to return and process refund</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{order.customer?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{order.customer?.phone || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">৳{totals.totalPaid.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Return Reason & Type */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">Return Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Return Type</label>
                    <select
                      value={returnType}
                      onChange={(e) => setReturnType(e.target.value as ReturnType)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="defective">Defective - Manufacturing defect</option>
                      <option value="damaged">Damaged - Damaged during shipping</option>
                      <option value="wrong_item">Wrong Item - Wrong product sent</option>
                      <option value="unwanted">Unwanted - Customer changed mind</option>
                      <option value="other">Other - Other reason</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Return Reason</label>
                    <textarea
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      placeholder="Enter detailed reason for return..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">Select Items to Return</h3>
                
                {order.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">No products in this order</div>
                ) : (
                  <div className="space-y-3">
                    {order.items.map((product) => (
                      <div key={product.id} className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleProductCheckbox(product.id)}
                            className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-gray-900 dark:text-white">{product.product_name}</p>
                              <p className="font-bold text-gray-900 dark:text-white">
                                ৳{(parseFloat(String(product.unit_price).replace(/[^0-9.-]/g, '')) * product.quantity).toFixed(2)}
                              </p>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                              Price: ৳{parseFloat(String(product.unit_price).replace(/[^0-9.-]/g, '')).toFixed(2)} × Qty: {product.quantity}
                            </p>
                            
                            {selectedProducts.includes(product.id) && (
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Original Qty</label>
                                    <input type="number" value={product.quantity} readOnly className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Return Qty</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max={product.quantity}
                                      value={returnedQuantities[product.id] || 0}
                                      onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0, product.quantity)}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Return Summary</h3>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Items selected:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedProducts.length}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Return Amount:</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">৳{totals.returnAmount.toFixed(2)}</span>
                  </div>

                  <div className="pt-3 border-t-2 border-gray-300 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Customer Paid:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">৳{totals.totalPaid.toFixed(2)}</span>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-green-900 dark:text-green-300">Refund to Customer:</span>
                        <span className="font-bold text-lg text-green-600 dark:text-green-400">৳{totals.refundToCustomer.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-400 mt-1">Amount to be refunded</p>
                    </div>
                  </div>
                </div>
              </div>

              {totals.refundToCustomer > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Process Refund</h3>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Cash Refund</label>
                        <button onClick={() => setShowNoteCounter(!showNoteCounter)} className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/30">
                          <Calculator className="w-3 h-3" />
                          {showNoteCounter ? 'Hide' : 'Count Notes'}
                        </button>
                      </div>
                      
                      {showNoteCounter ? (
                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <NoteInput value={1000} state={note1000} setState={setNote1000} />
                            <NoteInput value={500} state={note500} setState={setNote500} />
                            <NoteInput value={200} state={note200} setState={setNote200} />
                            <NoteInput value={100} state={note100} setState={setNote100} />
                            <NoteInput value={50} state={note50} setState={setNote50} />
                            <NoteInput value={20} state={note20} setState={setNote20} />
                            <NoteInput value={10} state={note10} setState={setNote10} />
                            <NoteInput value={5} state={note5} setState={setNote5} />
                            <NoteInput value={2} state={note2} setState={setNote2} />
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-green-200 dark:border-green-800">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Total Cash:</span>
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">৳{cashFromNotes.toLocaleString()}</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Cash Refund</label>
                          <input type="number" value={cashFromNotes > 0 ? cashFromNotes : refundCash} onChange={(e) => { setRefundCash(Number(e.target.value)); setNote1000(0); setNote500(0); setNote200(0); setNote100(0); setNote50(0); setNote20(0); setNote10(0); setNote5(0); setNote2(0); setNote1(0); }} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Card Refund</label>
                        <input type="number" value={refundCard} onChange={(e) => setRefundCard(Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Bkash Refund</label>
                        <input type="number" value={refundBkash} onChange={(e) => setRefundBkash(Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Nagad Refund</label>
                        <input type="number" value={refundNagad} onChange={(e) => setRefundNagad(Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300">Total Refunded</span>
                        <span className="text-gray-900 dark:text-white font-medium">৳{totalRefundProcessed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300">Refund Required</span>
                        <span className="text-gray-900 dark:text-white font-medium">৳{totals.refundToCustomer.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className="font-semibold text-gray-900 dark:text-white">Remaining</span>
                        <span className={`font-bold ${remainingRefund > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>৳{remainingRefund.toFixed(2)}</span>
                      </div>
                      {remainingRefund > 0 && <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Can refund later</p>}
                      {remainingRefund <= 0 && totalRefundProcessed > 0 && <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Full refund processed</p>}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessReturn}
                  disabled={isProcessing || selectedProducts.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  <RotateCcw className="w-5 h-5" />
                  {isProcessing ? 'Processing...' : 'Process Return'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}