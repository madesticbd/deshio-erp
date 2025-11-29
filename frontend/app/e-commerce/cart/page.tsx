'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, ShoppingCart, Loader2 } from 'lucide-react';
import { useCart } from '../CartContext';
import Navigation from '@/components/ecommerce/Navigation';

export default function CartPage() {
  const router = useRouter();
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, isLoading } = useCart();
  const [selectedItems, setSelectedItems] = React.useState<Set<number>>(new Set());
  const [isUpdating, setIsUpdating] = React.useState<Set<number>>(new Set());
  const [couponCode, setCouponCode] = React.useState('');

  // Select all items by default when cart items change
  React.useEffect(() => {
    if (cartItems.length > 0) {
      setSelectedItems(new Set(cartItems.map((item: any) => item.id)));
    }
  }, [cartItems.length]);

  const toggleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map((item: any) => item.id)));
    }
  };

  const toggleSelectItem = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    setIsUpdating(prev => new Set(prev).add(itemId));
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setIsUpdating(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setIsUpdating(prev => new Set(prev).add(itemId));
    try {
      await removeFromCart(itemId);
      // Remove from selected items
      setSelectedItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setIsUpdating(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleDeleteSelected = async () => {
    const itemsToDelete = Array.from(selectedItems);
    setIsUpdating(new Set(itemsToDelete));
    
    try {
      await Promise.all(itemsToDelete.map(id => removeFromCart(id)));
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Error deleting items:', error);
    } finally {
      setIsUpdating(new Set());
    }
  };

  const getSelectedTotal = (): number => {
    return cartItems
      .filter((item: any) => selectedItems.has(item.id))
      .reduce((total: number, item: any) => {
        const price = parseFloat(item.price || '0');
        return total + (price * item.quantity);
      }, 0);
  };

  const subtotal = getSelectedTotal();
  const freeShippingThreshold = 5000;
  const remaining = Math.max(0, freeShippingThreshold - subtotal);
  const progress = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const shippingFee = subtotal >= freeShippingThreshold ? 0 : 60;
  const total = subtotal + shippingFee;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-red-700 mx-auto mb-4" />
            <p className="text-gray-600">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Add some products to get started!</p>
            <button
              onClick={() => router.push('/')}
              className="bg-red-700 text-white px-8 py-3 rounded font-semibold hover:bg-red-800 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Free Shipping Progress */}
        {remaining > 0 && (
          <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-700 mb-3">
              Add <span className="font-bold text-red-700">৳{remaining.toFixed(2)}</span> to cart and get free shipping!
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-red-700 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1">
            {/* Select All & Delete */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedItems.size === cartItems.length && cartItems.length > 0}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 cursor-pointer accent-red-700"
                />
                <span className="text-gray-700 font-medium">
                  SELECT ALL ({cartItems.length} ITEM{cartItems.length !== 1 ? 'S' : ''})
                </span>
              </label>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedItems.size === 0 || isUpdating.size > 0}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isUpdating.size > 0 ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <X size={18} />
                )}
                <span className="text-sm font-medium">DELETE</span>
              </button>
            </div>

            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b font-semibold text-gray-900">
              <div className="col-span-1"></div>
              <div className="col-span-5">PRODUCT</div>
              <div className="col-span-2 text-center">PRICE</div>
              <div className="col-span-2 text-center">QUANTITY</div>
              <div className="col-span-2 text-right">SUBTOTAL</div>
            </div>

            {/* Cart Items */}
            <div className="space-y-4 mt-6">
              {cartItems.map((item: any) => {
                const price = parseFloat(item.price || '0');
                const itemTotal = price * item.quantity;
                const isItemUpdating = isUpdating.has(item.id);

                return (
                  <div 
                    key={item.id} 
                    className={`grid grid-cols-1 md:grid-cols-12 gap-4 py-6 border-b items-center transition-opacity ${
                      isItemUpdating ? 'opacity-50' : 'opacity-100'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="md:col-span-1 flex justify-end md:justify-start">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        disabled={isItemUpdating}
                        className="w-5 h-5 cursor-pointer accent-red-700 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="md:col-span-5 flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={item.product_image || item.image}
                          alt={item.product_name || item.name}
                          className="w-24 h-24 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-product.jpg';
                          }}
                        />
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isItemUpdating}
                          className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isItemUpdating ? (
                            <Loader2 size={16} className="text-gray-500 animate-spin" />
                          ) : (
                            <X size={16} className="text-gray-500" />
                          )}
                        </button>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {item.product_name || item.name}
                        </h3>
                        {item.sku && (
                          <p className="text-sm text-gray-500 mt-1">SKU: {item.sku}</p>
                        )}
                        {(item.color || item.size) && (
                          <div className="text-sm text-gray-600 mt-1">
                            {item.color && <span>Color: {item.color}</span>}
                            {item.color && item.size && <span> | </span>}
                            {item.size && <span>Size: {item.size}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="md:col-span-2 text-left md:text-center">
                      <span className="md:hidden font-semibold mr-2">Price:</span>
                      <span className="text-gray-900">৳{price.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2 flex justify-start md:justify-center">
                      <div className="flex items-center border border-gray-300 rounded">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={isItemUpdating || item.quantity <= 1}
                          className="px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            if (val > 0) {
                              handleUpdateQuantity(item.id, val);
                            }
                          }}
                          disabled={isItemUpdating}
                          className="w-16 text-center border-x border-gray-300 outline-none py-2 disabled:bg-gray-50"
                          min="1"
                        />
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={isItemUpdating}
                          className="px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="md:col-span-2 text-left md:text-right">
                      <span className="md:hidden font-semibold mr-2">Subtotal:</span>
                      <span className="font-bold text-red-700">
                        ৳{itemTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coupon */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Coupon code"
                className="flex-1 px-4 py-3 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-red-700"
              />
              <button 
                onClick={() => {
                  // TODO: Implement coupon application via API
                  console.log('Apply coupon:', couponCode);
                }}
                className="bg-red-700 text-white px-8 py-3 rounded font-semibold hover:bg-red-800 transition-colors whitespace-nowrap"
              >
                APPLY COUPON
              </button>
            </div>
          </div>

          {/* Cart Totals */}
          <div className="lg:w-96">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">CART TOTALS</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-700">Subtotal ({selectedItems.size} items)</span>
                  <span className="font-semibold text-gray-900">
                    ৳{subtotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="py-3 border-b">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">
                      ঢাকার ভিতরে: <span className="text-red-700 font-semibold">৳60.00</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Shipping</span>
                    <span className="font-semibold text-gray-900">
                      {shippingFee > 0 ? (
                        `Shipping to Dhaka`
                      ) : (
                        <span className="text-green-600">Free shipping</span>
                      )}
                    </span>
                  </div>
                  <button className="text-sm text-red-700 hover:underline mt-2">
                    Change address
                  </button>
                </div>

                <div className="flex justify-between py-4">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-red-700">
                    ৳{total.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <button 
                  onClick={() => {
                    if (selectedItems.size > 0) {
                      // Save selected item IDs to localStorage for checkout
                      localStorage.setItem('checkout-selected-items', JSON.stringify(Array.from(selectedItems)));
                      router.push('/e-commerce/checkout');
                    }
                  }}
                  disabled={selectedItems.size === 0}
                  className="w-full bg-red-700 text-white py-4 rounded font-bold text-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  PROCEED TO CHECKOUT ({selectedItems.size})
                </button>

                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-white text-red-700 border-2 border-red-700 py-3 rounded font-semibold hover:bg-red-50 transition-colors mt-3"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}