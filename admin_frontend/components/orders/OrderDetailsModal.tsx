// components/orders/OrderDetailsModal.tsx - Updated with QZ Tray

import { useState, useEffect } from 'react';
import { X, User, MapPin, Package, CreditCard, Edit2, Printer, Truck, Settings } from 'lucide-react';
import { Order } from '@/types/order';
import { connectQZ, printReceipt, getPrinters, checkQZStatus } from '@/lib/qz-tray';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onEdit?: (order: Order) => void;
}

export default function OrderDetailsModal({ order, onClose, onEdit }: OrderDetailsModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSendingToPathao, setIsSendingToPathao] = useState(false);
  const [qzStatus, setQzStatus] = useState<{ connected: boolean; error?: string }>({ connected: false });
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [showPrinterSelect, setShowPrinterSelect] = useState(false);

  useEffect(() => {
    checkQZConnection();
  }, []);

  const checkQZConnection = async () => {
    try {
      const status = await checkQZStatus();
      setQzStatus(status);
      
      if (status.connected) {
        const printerList = await getPrinters();
        setPrinters(printerList);
        
        // Load saved printer preference
        const savedPrinter = localStorage.getItem('defaultPrinter');
        if (savedPrinter && printerList.includes(savedPrinter)) {
          setSelectedPrinter(savedPrinter);
        } else if (printerList.length > 0) {
          setSelectedPrinter(printerList[0]);
        }
      }
    } catch (error) {
      console.error('Failed to check QZ status:', error);
      setQzStatus({ connected: false, error: 'QZ Tray not running' });
    }
  };

  const handlePrintReceipt = async () => {
    if (!qzStatus.connected) {
      alert('QZ Tray is not connected. Please start QZ Tray and try again.');
      return;
    }

    if (!selectedPrinter) {
      setShowPrinterSelect(true);
      return;
    }

    setIsPrinting(true);
    try {
      await printReceipt(order, selectedPrinter);
      alert(`Receipt printed successfully for Order #${order.id}`);
    } catch (error: any) {
      console.error('Print error:', error);
      alert(`Failed to print receipt: ${error.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrinterSelect = (printer: string) => {
    setSelectedPrinter(printer);
    localStorage.setItem('defaultPrinter', printer);
    setShowPrinterSelect(false);
  };

  const handleSendToPathao = () => {
    setIsSendingToPathao(true);
    
    // Simulate sending to Pathao
    setTimeout(() => {
      alert(`Successfully sent Order #${order.id} to Pathao!`);
      setIsSendingToPathao(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-5 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order Details</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Order #{order.id}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* QZ Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className={`w-2 h-2 rounded-full ${qzStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {qzStatus.connected ? 'Printer Ready' : 'Printer Offline'}
              </span>
            </div>

            {/* Printer Settings */}
            {qzStatus.connected && (
              <button
                onClick={() => setShowPrinterSelect(!showPrinterSelect)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
                title="Select Printer"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                
                {showPrinterSelect && (
                  <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 w-64 z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Select Printer</p>
                    </div>
                    {printers.map((printer) => (
                      <button
                        key={printer}
                        onClick={() => handlePrinterSelect(printer)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedPrinter === printer ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {printer}
                        {selectedPrinter === printer && (
                          <span className="ml-2 text-xs">(Selected)</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </button>
            )}
           
            <button
              onClick={handlePrintReceipt}
              disabled={isPrinting || !qzStatus.connected}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              {isPrinting ? 'Printing...' : 'Print Receipt'}
            </button>
            <button
              onClick={handleSendToPathao}
              disabled={isSendingToPathao}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Truck className="w-4 h-4" />
              {isSendingToPathao ? 'Sending...' : 'Send to Pathao'}
            </button>
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(order);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-900 text-white rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit Order
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Customer Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Name</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{order.customer.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{order.customer.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Phone</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{order.customer.phone}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Sales By</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{order.salesBy}</p>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Delivery Address</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p>{order.deliveryAddress.address}</p>
              {order.deliveryAddress.area && <p>{order.deliveryAddress.area}, {order.deliveryAddress.zone}</p>}
              {!order.deliveryAddress.area && <p>{order.deliveryAddress.zone}</p>}
              <p>{order.deliveryAddress.city}, {order.deliveryAddress.district}</p>
              <p>{order.deliveryAddress.division} - {order.deliveryAddress.postalCode}</p>
            </div>
          </div>

          {/* Products */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Products</h3>
            </div>
            <div className="space-y-3">
              {order.products.map((product, idx) => {
                const productWithBarcodes = product as any;
                const barcodes = productWithBarcodes.barcodes || [];
                
                return (
                  <div key={product.id || idx} className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white mb-2">{product.productName}</p>
                        <div className="flex gap-3 text-xs mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Size: {product.size}</span>
                          <span className="text-gray-600 dark:text-gray-400">Qty: {product.qty}</span>
                          <span className="text-gray-600 dark:text-gray-400">৳{product.price} each</span>
                        </div>
                        {barcodes.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Barcodes:</p>
                            <div className="flex flex-wrap gap-2">
                              {barcodes.map((barcode: string, barcodeIdx: number) => (
                                <span
                                  key={barcodeIdx}
                                  className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-xs font-mono border border-blue-200 dark:border-blue-800"
                                >
                                  {barcode}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-gray-900 dark:text-white">৳{product.amount.toLocaleString()}</p>
                        {product.discount > 0 && (
                          <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-1">-৳{product.discount} off</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Payment Summary</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-semibold text-gray-900 dark:text-white">৳{(order.amounts?.subtotal || order.subtotal).toLocaleString()}</span>
              </div>
              {order.amounts && (
                <>
                  {order.amounts.totalDiscount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Discount</span>
                      <span className="font-medium text-green-600 dark:text-green-400">-৳{order.amounts.totalDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">VAT ({order.amounts.vatRate}%)</span>
                    <span className="font-medium text-gray-900 dark:text-white">৳{order.amounts.vat.toLocaleString()}</span>
                  </div>
                  {order.amounts.transportCost > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Transport Cost</span>
                      <span className="font-medium text-gray-900 dark:text-white">৳{order.amounts.transportCost.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-300 dark:border-gray-700">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-gray-900 dark:text-white">Total Amount</span>
                      <span className="text-gray-900 dark:text-white">৳{order.amounts.total.toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}
              <div className="pt-3 border-t border-gray-300 dark:border-gray-700">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Amount Paid</span>
                  <span className="font-medium text-gray-900 dark:text-white">৳{order.payments.totalPaid.toLocaleString()}</span>
                </div>
              </div>
              {order.payments.due > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-orange-700 dark:text-orange-400">Due Amount</span>
                    <span className="font-bold text-lg text-orange-600 dark:text-orange-400">৳{order.payments.due.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close printer select */}
      {showPrinterSelect && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowPrinterSelect(false)}
        />
      )}
    </div>
  );
}