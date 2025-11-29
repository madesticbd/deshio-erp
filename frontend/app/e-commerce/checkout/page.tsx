'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';
import orderService, { CreateOrderPayload } from '@/services/orderService';

// Types
interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  batch_id: number;
  quantity: number;
  unit_price: string;
  discount_amount?: string;
  tax_amount?: string;
  product_image?: string;
}

interface CartSummary {
  subtotal: number;
  tax: number;
  discount: number;
  shipping: number;
  total: number;
}

interface ShippingAddress {
  full_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

interface CheckoutFormData {
  shipping_address: ShippingAddress;
  billing_same_as_shipping: boolean;
  billing_address?: ShippingAddress;
  payment_method: number | null;
  notes?: string;
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export default function CheckoutPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartSummary, setCartSummary] = useState<CartSummary>({
    subtotal: 0,
    tax: 0,
    discount: 0,
    shipping: 0,
    total: 0,
  });

  const [formData, setFormData] = useState<CheckoutFormData>({
    shipping_address: {
      full_name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'Bangladesh',
    },
    billing_same_as_shipping: true,
    payment_method: null,
    notes: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
  };

  // Load cart data
  useEffect(() => {
    loadCartData();
  }, []);

  const loadCartData = async () => {
    try {
      // TODO: Replace with your actual cart service
      // const cart = await cartService.getCart();
      // setCartItems(cart.items);
      // setCartSummary(cart.summary);

      // Dummy data for now
      setCartItems([
        {
          id: 1,
          product_id: 1,
          product_name: 'Sample Product',
          product_sku: 'SKU-001',
          batch_id: 1,
          quantity: 2,
          unit_price: '1000.00',
          discount_amount: '0.00',
          tax_amount: '150.00',
        },
      ]);

      setCartSummary({
        subtotal: 2000,
        tax: 300,
        discount: 0,
        shipping: 100,
        total: 2400,
      });
    } catch (error) {
      console.error('Error loading cart:', error);
      showToast('Failed to load cart data', 'error');
    }
  };

  const handleInputChange = (
    section: 'shipping_address' | 'billing_address',
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));

    // Clear error for this field
    setErrors((prev) => ({
      ...prev,
      [`${section}.${field}`]: '',
    }));
  };

  const validateCheckoutData = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate shipping address
    if (!formData.shipping_address.full_name.trim()) {
      newErrors['shipping_address.full_name'] = 'Full name is required';
    }
    if (!formData.shipping_address.phone.trim()) {
      newErrors['shipping_address.phone'] = 'Phone number is required';
    }
    if (!formData.shipping_address.email.trim()) {
      newErrors['shipping_address.email'] = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.shipping_address.email)) {
      newErrors['shipping_address.email'] = 'Invalid email format';
    }
    if (!formData.shipping_address.address.trim()) {
      newErrors['shipping_address.address'] = 'Address is required';
    }
    if (!formData.shipping_address.city.trim()) {
      newErrors['shipping_address.city'] = 'City is required';
    }
    if (!formData.shipping_address.state.trim()) {
      newErrors['shipping_address.state'] = 'State is required';
    }
    if (!formData.shipping_address.zip_code.trim()) {
      newErrors['shipping_address.zip_code'] = 'ZIP code is required';
    }

    // Validate payment method
    if (!formData.payment_method) {
      newErrors['payment_method'] = 'Please select a payment method';
    }

    // Validate cart
    if (!cartItems.length) {
      showToast('Your cart is empty', 'error');
      return false;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showToast('Please fill in all required fields', 'error');
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    try {
      setIsProcessing(true);

      // Validate form data
      if (!validateCheckoutData()) {
        setIsProcessing(false);
        return;
      }

      // Prepare the order payload
      const orderPayload: CreateOrderPayload = {
        order_type: 'ecommerce',
        customer: {
          name: formData.shipping_address.full_name,
          phone: formData.shipping_address.phone,
          email: formData.shipping_address.email,
          address: `${formData.shipping_address.address}, ${formData.shipping_address.city}, ${formData.shipping_address.state} ${formData.shipping_address.zip_code}, ${formData.shipping_address.country}`,
        },
        store_id: 1, // TODO: Get from config or context
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          batch_id: item.batch_id,
          quantity: item.quantity,
          unit_price: parseFloat(item.unit_price),
          discount_amount: item.discount_amount
            ? parseFloat(item.discount_amount)
            : 0,
          tax_amount: item.tax_amount ? parseFloat(item.tax_amount) : 0,
        })),
        discount_amount: cartSummary.discount,
        shipping_amount: cartSummary.shipping,
        shipping_address: formData.shipping_address,
        payment: formData.payment_method
          ? {
              payment_method_id: formData.payment_method,
              amount: cartSummary.total,
              payment_type: 'full',
            }
          : undefined,
        notes: formData.notes,
      };

      // Create the order using orderService
      const order = await orderService.create(orderPayload);

      // Show success message
      showToast(`Order placed successfully! Order #${order.order_number}`, 'success');

      // Clear cart and redirect after a short delay
      setTimeout(() => {
        router.push(`/e-commerce/orders/${order.id}`);
      }, 1500);
    } catch (error: any) {
      console.error('Place order error:', error);
      showToast(error.message || 'Failed to place order', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your purchase</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.shipping_address.full_name}
                    onChange={(e) =>
                      handleInputChange(
                        'shipping_address',
                        'full_name',
                        e.target.value
                      )
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors['shipping_address.full_name']
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                  {errors['shipping_address.full_name'] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors['shipping_address.full_name']}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.shipping_address.phone}
                    onChange={(e) =>
                      handleInputChange(
                        'shipping_address',
                        'phone',
                        e.target.value
                      )
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors['shipping_address.phone']
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="+880 1234567890"
                  />
                  {errors['shipping_address.phone'] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors['shipping_address.phone']}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.shipping_address.email}
                    onChange={(e) =>
                      handleInputChange(
                        'shipping_address',
                        'email',
                        e.target.value
                      )
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors['shipping_address.email']
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="john@example.com"
                  />
                  {errors['shipping_address.email'] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors['shipping_address.email']}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={formData.shipping_address.address}
                    onChange={(e) =>
                      handleInputChange(
                        'shipping_address',
                        'address',
                        e.target.value
                      )
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors['shipping_address.address']
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Street address, apartment, suite, etc."
                  />
                  {errors['shipping_address.address'] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors['shipping_address.address']}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.shipping_address.city}
                    onChange={(e) =>
                      handleInputChange(
                        'shipping_address',
                        'city',
                        e.target.value
                      )
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors['shipping_address.city']
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Dhaka"
                  />
                  {errors['shipping_address.city'] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors['shipping_address.city']}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State/Division *
                  </label>
                  <input
                    type="text"
                    value={formData.shipping_address.state}
                    onChange={(e) =>
                      handleInputChange(
                        'shipping_address',
                        'state',
                        e.target.value
                      )
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors['shipping_address.state']
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Dhaka Division"
                  />
                  {errors['shipping_address.state'] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors['shipping_address.state']}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={formData.shipping_address.zip_code}
                    onChange={(e) =>
                      handleInputChange(
                        'shipping_address',
                        'zip_code',
                        e.target.value
                      )
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors['shipping_address.zip_code']
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="1200"
                  />
                  {errors['shipping_address.zip_code'] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors['shipping_address.zip_code']}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={formData.shipping_address.country}
                    onChange={(e) =>
                      handleInputChange(
                        'shipping_address',
                        'country',
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Bangladesh"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment_method"
                    value="1"
                    checked={formData.payment_method === 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_method: parseInt(e.target.value),
                      })
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 font-medium">Cash on Delivery</span>
                </label>

                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment_method"
                    value="2"
                    checked={formData.payment_method === 2}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_method: parseInt(e.target.value),
                      })
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 font-medium">bKash</span>
                </label>

                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment_method"
                    value="3"
                    checked={formData.payment_method === 3}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_method: parseInt(e.target.value),
                      })
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 font-medium">Bank Transfer</span>
                </label>
              </div>
              {errors['payment_method'] && (
                <p className="text-red-500 text-sm mt-2">
                  {errors['payment_method']}
                </p>
              )}
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">
                Order Notes (Optional)
              </h2>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any special instructions for your order?"
              />
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity} × ৳{parseFloat(item.unit_price).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      ৳{(item.quantity * parseFloat(item.unit_price)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>৳{cartSummary.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span>৳{cartSummary.tax.toFixed(2)}</span>
                </div>
                {cartSummary.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-৳{cartSummary.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span>৳{cartSummary.shipping.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>৳{cartSummary.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Place Order'}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By placing your order, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}