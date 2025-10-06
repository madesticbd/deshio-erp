
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

interface Product {
  id: number;
  productName: string;
  size: string;
  qty: number;
  price: number;
  discount: number;
  amount: number;
}

export default function SocialCommercePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [date, setDate] = useState('06-Oct-2025');
  const [cart, setCart] = useState<Product[]>([]);
  
  // Form fields
  const [salesBy, setSalesBy] = useState('Admin User');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');
  const [area, setArea] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  const [product, setProduct] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountTk, setDiscountTk] = useState('');
  const [amount, setAmount] = useState('0.00');
  
  // Amount details
  const [vatRate, setVatRate] = useState('5');
  const [transportCost, setTransportCost] = useState('0');
  const [cashPaid, setCashPaid] = useState('0');
  const [cardPaid, setCardPaid] = useState('0');

  // Calculate amount
  useEffect(() => {
    const price = parseFloat(sellingPrice) || 0;
    const qty = parseFloat(quantity) || 0;
    const discPer = parseFloat(discountPercent) || 0;
    const discTk = parseFloat(discountTk) || 0;
    
    if (price > 0 && qty > 0) {
      const baseAmount = price * qty;
      const percentDiscount = (baseAmount * discPer) / 100;
      const totalDiscount = percentDiscount + discTk;
      setAmount((baseAmount - totalDiscount).toFixed(2));
    } else {
      setAmount('0.00');
    }
  }, [sellingPrice, quantity, discountPercent, discountTk]);

  const addToCart = () => {
    if (!product || !sellingPrice || !quantity) {
      alert('Please fill product details');
      return;
    }

    const price = parseFloat(sellingPrice);
    const qty = parseFloat(quantity);
    const discPer = parseFloat(discountPercent) || 0;
    const discTk = parseFloat(discountTk) || 0;
    
    const baseAmount = price * qty;
    const percentDiscount = (baseAmount * discPer) / 100;
    const totalDiscountValue = percentDiscount + discTk;
    
    const newItem: Product = {
      id: Date.now(),
      productName: product,
      size: '',
      qty: qty,
      price: price,
      discount: totalDiscountValue,
      amount: baseAmount - totalDiscountValue
    };
    
    setCart([...cart, newItem]);
    
    // Reset
    setProduct('');
    setSellingPrice('');
    setQuantity('');
    setDiscountPercent('');
    setDiscountTk('');
    setAmount('0.00');
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.amount, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  const vat = (subtotal * parseFloat(vatRate)) / 100;
  const transport = parseFloat(transportCost) || 0;
  const total = subtotal + vat + transport;
  
  const paidCash = parseFloat(cashPaid) || 0;
  const paidCard = parseFloat(cardPaid) || 0;
  const totalPaid = paidCash + paidCard;
  const dueAmount = total - totalPaid;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Please add products to cart');
      return;
    }

    const orderData = {
      salesBy,
      date,
      customer: {
        name: userName,
        email: userEmail,
        phone: userPhone,
      },
      deliveryAddress: {
        division,
        district,
        city,
        zone,
        area,
        address: deliveryAddress,
        postalCode
      },
      products: cart,
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
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        alert('Order placed successfully!');
        // Reset all fields
        setCart([]);
        setUserName('');
        setUserEmail('');
        setUserPhone('');
        setDivision('');
        setDistrict('');
        setCity('');
        setZone('');
        setArea('');
        setDeliveryAddress('');
        setPostalCode('');
        setProduct('');
        setSellingPrice('');
        setQuantity('');
        setCashPaid('0');
        setCardPaid('0');
        setTransportCost('0');
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
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />

          <main className="flex-1 overflow-auto p-6">
            {/* Top Bar */}
            <div className="mb-6 flex items-center gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Sales By</label>
                <input
                  type="text"
                  value={salesBy}
                  readOnly
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Left Section - 2 columns */}
              <div className="col-span-2 space-y-6">
                {/* Sales Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Sales Information</h3>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {/* Row 1 */}
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">User Name*</label>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Product</label>
                      <input
                        type="text"
                        placeholder="Select Product Name"
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>

                    {/* Row 2 */}
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">User Email*</label>
                      <input
                        type="email"
                        placeholder="sample@email.com"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Selling Price</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Row 3 */}
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">User Phone Number*</label>
                      <input
                        type="text"
                        placeholder="Phone Number"
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Row 4 */}
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Division*</label>
                      <input
                        type="text"
                        placeholder="Search Division..."
                        value={division}
                        onChange={(e) => setDivision(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Discount %</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Tk.</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={discountTk}
                          onChange={(e) => setDiscountTk(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                        <input
                          type="text"
                          value={amount}
                          readOnly
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Row 5 */}
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">District*</label>
                      <input
                        type="text"
                        placeholder="Search District..."
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>
                    <div></div>

                    {/* Row 6 */}
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">City*</label>
                      <input
                        type="text"
                        placeholder="Search City..."
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>
                    <div></div>

                    {/* Row 7 */}
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Zone*</label>
                      <input
                        type="text"
                        placeholder="Search Zone..."
                        value={zone}
                        onChange={(e) => setZone(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>
                    <div></div>

                    {/* Row 8 */}
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Area (Optional)</label>
                      <input
                        type="text"
                        placeholder="Search Area..."
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>
                    <div></div>

                    {/* Row 9 */}
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Delivery Address (Street, House No., etc.)</label>
                      <input
                        type="text"
                        placeholder="Delivery Address"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>

                    {/* Row 10 */}
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
                      <input
                        type="text"
                        placeholder="e.g., 1212"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>
                    <div className="flex items-end">
                    <button
  onClick={addToCart}
  className="w-full px-4 py-1.5 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded transition-colors"
>
                    Add to Cart
                </button>

                    </div>
                  </div>
                </div>

                {/* Product Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Product Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Size</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Discount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                            No products added to cart
                          </td>
                        </tr>
                      ) : (
                        cart.map((item) => (
                          <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="px-4 py-2 text-gray-900 dark:text-white">{item.productName}</td>
                            <td className="px-4 py-2 text-gray-900 dark:text-white">-</td>
                            <td className="px-4 py-2 text-gray-900 dark:text-white">{item.qty}</td>
                            <td className="px-4 py-2 text-gray-900 dark:text-white">{item.price.toFixed(2)}</td>
                            <td className="px-4 py-2 text-gray-900 dark:text-white">{item.discount.toFixed(2)}</td>
                            <td className="px-4 py-2 text-gray-900 dark:text-white">{item.amount.toFixed(2)}</td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-600 hover:text-red-700 text-xs font-medium"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Section - Amount Details */}
              <div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Amount Details</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Sub Total</span>
                      <span className="text-gray-900 dark:text-white">{subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Discount (Without VAT)</span>
                      <span className="text-gray-900 dark:text-white">{totalDiscount.toFixed(2)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Vat</label>
                        <input
                          type="text"
                          value={vat.toFixed(2)}
                          readOnly
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Vat Rate %</label>
                        <input
                          type="number"
                          value={vatRate}
                          onChange={(e) => setVatRate(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Transport Cost</label>
                      <input
                        type="number"
                        value={transportCost}
                        onChange={(e) => setTransportCost(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-sm font-medium mb-1">
                        <span className="text-gray-900 dark:text-white">Total</span>
                        <span className="text-gray-900 dark:text-white">{total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Return</span>
                        <span className="text-green-600 dark:text-green-400">{(totalPaid - total).toFixed(2)}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Enter Field Amount</label>
                      <input
                        type="text"
                        value="0.00"
                        readOnly
                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Paid Amount</label>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">Cash Paid</label>
                          <input
                            type="number"
                            value={cashPaid}
                            onChange={(e) => setCashPaid(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">Card Paid</label>
                          <input
                            type="number"
                            value={cardPaid}
                            onChange={(e) => setCardPaid(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center mb-2">
                      <input type="checkbox" id="socialCommerce" className="mr-2" />
                      <label htmlFor="socialCommerce" className="text-xs text-gray-700 dark:text-gray-300">
                        Enable (Per Social Commerce Orders)
                      </label>
                    </div>

                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Due Amount</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{dueAmount.toFixed(2)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Back
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded transition-colors"
                      >
                        Place Order
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}