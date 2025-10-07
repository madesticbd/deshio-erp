'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AmountDetailsPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  
  // Amount details
  const [vatRate, setVatRate] = useState('5');
  const [transportCost, setTransportCost] = useState('0');
  const [cashPaid, setCashPaid] = useState('0');
  const [cardPaid, setCardPaid] = useState('0');

  useEffect(() => {
    const storedOrder = sessionStorage.getItem('pendingOrder');
    if (storedOrder) {
      setOrderData(JSON.parse(storedOrder));
    } else {
      router.push('/social-commerce');
    }
  }, [router]);

  if (!orderData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const subtotal = orderData.subtotal || 0;
  const totalDiscount = orderData.products.reduce((sum: number, item: any) => sum + item.discount, 0);
  const vat = (subtotal * parseFloat(vatRate)) / 100;
  const transport = parseFloat(transportCost) || 0;
  const total = subtotal + vat + transport;
  
  const paidCash = parseFloat(cashPaid) || 0;
  const paidCard = parseFloat(cardPaid) || 0;
  const totalPaid = paidCash + paidCard;
  const dueAmount = total - totalPaid;

  const handlePlaceOrder = async () => {
    const completeOrderData = {
      ...orderData,
      amounts: {
        subtotal,
        totalDiscount,
        vat,
        vatRate: parseFloat(vatRate),
        transportCost: transport,
        total
      },
      payments: {
        cash: paidCash,
        card: paidCard,
        totalPaid,
        due: dueAmount
      }
    };

    try {
      const response = await fetch('/api/social-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeOrderData),
      });

      if (response.ok) {
        alert('Order placed successfully!');
        sessionStorage.removeItem('pendingOrder');
        router.push('/social-commerce');
      } else {
        alert('Failed to place order');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error placing order');
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Amount Details</h1>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm"
            >
              {darkMode ? 'Light' : 'Dark'} Mode
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Order Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
              
              {/* Customer Info */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-2">Customer Information</p>
                <p className="text-sm text-gray-900 dark:text-white">{orderData.customer.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{orderData.customer.email}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{orderData.customer.phone}</p>
              </div>

              {/* Delivery Address */}
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-800 dark:text-green-300 font-medium mb-2">Delivery Address</p>
                <p className="text-xs text-gray-900 dark:text-white">
                  {orderData.deliveryAddress.division}, {orderData.deliveryAddress.district}, {orderData.deliveryAddress.city}
                </p>
                {orderData.deliveryAddress.zone && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">Zone: {orderData.deliveryAddress.zone}</p>
                )}
                {orderData.deliveryAddress.address && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{orderData.deliveryAddress.address}</p>
                )}
                {orderData.deliveryAddress.postalCode && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">Postal Code: {orderData.deliveryAddress.postalCode}</p>
                )}
              </div>

              {/* Products List */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Products ({orderData.products.length})</p>
                <div className="space-y-2">
                  {orderData.products.map((product: any) => (
                    <div key={product.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">{product.productName}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Qty: {product.qty} × {product.price.toFixed(2)} Tk</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{product.amount.toFixed(2)} Tk</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtotal */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-base font-semibold">
                  <span className="text-gray-900 dark:text-white">Subtotal</span>
                  <span className="text-gray-900 dark:text-white">{subtotal.toFixed(2)} Tk</span>
                </div>
              </div>
            </div>

            {/* Right Column - Payment Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Details</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Sub Total</span>
                  <span className="text-gray-900 dark:text-white">{subtotal.toFixed(2)} Tk</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Discount</span>
                  <span className="text-gray-900 dark:text-white">{totalDiscount.toFixed(2)} Tk</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">VAT</label>
                    <input
                      type="text"
                      value={vat.toFixed(2)}
                      readOnly
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">VAT Rate %</label>
                    <input
                      type="number"
                      value={vatRate}
                      onChange={(e) => setVatRate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Transport Cost</label>
                  <input
                    type="number"
                    value={transportCost}
                    onChange={(e) => setTransportCost(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-lg font-semibold mb-2">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-gray-900 dark:text-white">{total.toFixed(2)} Tk</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Paid Amount</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">Cash Paid</label>
                      <input
                        type="number"
                        value={cashPaid}
                        onChange={(e) => setCashPaid(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">Card Paid</label>
                      <input
                        type="number"
                        value={cardPaid}
                        onChange={(e) => setCardPaid(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Return</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {(totalPaid - total).toFixed(2)} Tk
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Due Amount</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{dueAmount.toFixed(2)} Tk</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button 
                    onClick={() => router.back()}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    Place Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}