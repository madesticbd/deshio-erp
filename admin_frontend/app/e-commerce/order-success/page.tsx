'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Package, MapPin, CreditCard, Home } from 'lucide-react';

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId);
    }
  }, [orderId]);

  const fetchOrderDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/social-orders?id=${id}`);
      const orders = await response.json();
      const order = orders.find((o: any) => String(o.id) === String(id));
      setOrderDetails(order);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-6">
          <div className="flex justify-center mb-4">
            <CheckCircle size={80} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600 mb-4">
            Thank you for your order. We'll send you a confirmation shortly.
          </p>
          {orderId && (
            <div className="inline-block bg-gray-100 px-6 py-3 rounded-lg">
              <p className="text-sm text-gray-600">Order ID</p>
              <p className="text-xl font-bold text-gray-900">{orderId}</p>
            </div>
          )}
        </div>

        {/* Order Details */}
        {orderDetails && (
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={20} className="text-orange-600" />
                Customer Information
              </h2>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {orderDetails.customer.name}</p>
                <p><span className="font-medium">Phone:</span> {orderDetails.customer.phone}</p>
                {orderDetails.customer.email && (
                  <p><span className="font-medium">Email:</span> {orderDetails.customer.email}</p>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-orange-600" />
                Delivery Address
              </h2>
              <div className="text-sm text-gray-700">
                <p>{orderDetails.deliveryAddress.address}</p>
                <p>{orderDetails.deliveryAddress.area}, {orderDetails.deliveryAddress.city}</p>
                <p>{orderDetails.deliveryAddress.district}, {orderDetails.deliveryAddress.division}</p>
                {orderDetails.deliveryAddress.postalCode && (
                  <p>Postal Code: {orderDetails.deliveryAddress.postalCode}</p>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {orderDetails.products.map((product: any, index: number) => (
                  <div key={index} className="flex justify-between items-center pb-4 border-b last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{product.productName}</p>
                      <p className="text-sm text-gray-600">Size: {product.size} | Qty: {product.qty}</p>
                    </div>
                    <p className="font-semibold text-gray-900">{product.amount.toLocaleString()}৳</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-orange-600" />
                Payment Summary
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{orderDetails.amounts.subtotal.toLocaleString()}৳</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold">
                    {orderDetails.amounts.transportCost === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `${orderDetails.amounts.transportCost}৳`
                    )}
                  </span>
                </div>
                {orderDetails.amounts.vat > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">VAT</span>
                    <span className="font-semibold">{orderDetails.amounts.vat.toLocaleString()}৳</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-orange-600">{orderDetails.amounts.total.toLocaleString()}৳</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-gray-600">Payment Status</span>
                  <span className="font-semibold">
                    {orderDetails.payments.due > 0 ? (
                      <span className="text-orange-600">Cash on Delivery</span>
                    ) : (
                      <span className="text-green-600">Paid</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/e-commerce')}
            className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Continue Shopping
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Print Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}