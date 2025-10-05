'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

interface Store {
  id: number;
  name: string;
  location: string;
  type: string;
  pathao_key: string;
  revenue: number;
  revenueChange: number;
  products: number;
  orders: number;
}

interface CartItem {
  id: number;
  productName: string;
  size: string;
  qty: number;
  price: number;
  discount: number;
  amount: number;
}

export default function POSPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [outlets, setOutlets] = useState<Store[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Form states
  const [customerName, setCustomerName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [address, setAddress] = useState('');
  const [product, setProduct] = useState('');
  const [sellingPrice, setSellingPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [amount, setAmount] = useState(0);
  
  // Amount details
  const [vatRate, setVatRate] = useState(5);
  const [transportCost, setTransportCost] = useState(0);
  const [cashPaid, setCashPaid] = useState(0);
  const [cardPaid, setCardPaid] = useState(0);
  const [bkashPaid, setBkashPaid] = useState(0);
  const [nagadPaid, setNagadPaid] = useState(0);
  const [transactionFee, setTransactionFee] = useState(0);

  // Load outlets from API
  useEffect(() => {
    fetchOutlets();
  }, []);

  const fetchOutlets = async () => {
    try {
      const response = await fetch('/api/stores');
      const data = await response.json();
      setOutlets(data);
    } catch (error) {
      console.error('Error fetching outlets:', error);
    }
  };

  // Calculate amount when price, quantity or discount changes
  useEffect(() => {
    if (sellingPrice > 0 && quantity > 0) {
      const baseAmount = sellingPrice * quantity;
      let discount = 0;
      
      if (discountPercent > 0) {
        discount = (baseAmount * discountPercent) / 100;
      } else if (discountAmount > 0) {
        discount = discountAmount;
      }
      
      setAmount(baseAmount - discount);
    } else {
      setAmount(0);
    }
  }, [sellingPrice, quantity, discountPercent, discountAmount]);

  const addToCart = () => {
    if (product && sellingPrice > 0 && quantity > 0) {
      const baseAmount = sellingPrice * quantity;
      const discountValue = discountPercent > 0 
        ? (baseAmount * discountPercent) / 100 
        : discountAmount;
      
      const newItem: CartItem = {
        id: Date.now(),
        productName: product,
        size: '',
        qty: quantity,
        price: sellingPrice,
        discount: discountValue, // Store actual discount amount in Tk
        amount: baseAmount - discountValue
      };
      setCart([...cart, newItem]);
      
      // Reset form
      setProduct('');
      setSellingPrice(0);
      setQuantity(0);
      setDiscountPercent(0);
      setDiscountAmount(0);
      setAmount(0);
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.amount, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  const vat = (subtotal * vatRate) / 100;
  const total = subtotal + vat + transportCost;
  const totalPaid = cashPaid + cardPaid + bkashPaid + nagadPaid;
  const due = total - totalPaid - transactionFee;

  const handleSell = async () => {
    if (!selectedOutlet) {
      alert('Please select an outlet');
      return;
    }
    if (cart.length === 0) {
      alert('Please add products to cart');
      return;
    }

    const saleData = {
      salesBy: 'Admin',
      outletId: selectedOutlet,
      date: date,
      customer: {
        name: customerName,
        mobile: mobileNo,
        address: address
      },
      items: cart,
      amounts: {
        subtotal: subtotal,
        totalDiscount: totalDiscount,
        vat: vat,
        vatRate: vatRate,
        transportCost: transportCost,
        total: total
      },
      payments: {
        cash: cashPaid,
        card: cardPaid,
        bkash: bkashPaid,
        nagad: nagadPaid,
        transactionFee: transactionFee,
        totalPaid: totalPaid,
        due: due
      }
    };

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      if (response.ok) {
        alert('Sale completed successfully!');
        // Reset form
        setCart([]);
        setCustomerName('');
        setMobileNo('');
        setAddress('');
        setCashPaid(0);
        setCardPaid(0);
        setBkashPaid(0);
        setNagadPaid(0);
        setTransactionFee(0);
        setTransportCost(0);
      } else {
        alert('Failed to complete sale');
      }
    } catch (error) {
      console.error('Error saving sale:', error);
      alert('Error saving sale');
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Point of Sale</h1>
              
              {/* Top Section: Sales By, Outlet, Date */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sales By
                  </label>
                  <input
                    type="text"
                    value="Admin"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Outlet <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedOutlet}
                    onChange={(e) => setSelectedOutlet(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Choose an Outlet</option>
                    {outlets.map((outlet) => (
                      <option key={outlet.id} value={outlet.id}>
                        {outlet.name} - {outlet.location}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-3 gap-6">
                {/* Left Section: Sales Information */}
                <div className="col-span-2 space-y-6">
                  {/* Sales Information */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h2 className="text-sm font-medium text-gray-900 dark:text-white">Sales Information</h2>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>
                    
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Customer
                        </label>
                        <input
                          type="text"
                          placeholder="Search Customer Name or Phone number"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product
                        </label>
                        <input
                          type="text"
                          placeholder="Select an Outlet First"
                          value={product}
                          onChange={(e) => setProduct(e.target.value)}
                          disabled={!selectedOutlet}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:bg-gray-100 disabled:dark:bg-gray-600"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          placeholder="Customer Name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Selling Price
                        </label>
                        <input
                          type="number"
                          value={sellingPrice}
                          onChange={(e) => setSellingPrice(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Mobile No
                        </label>
                        <input
                          type="text"
                          placeholder="Mobile No"
                          value={mobileNo}
                          onChange={(e) => setMobileNo(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Address
                        </label>
                        <textarea
                          placeholder="Address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Discount %
                          </label>
                          <input
                            type="number"
                            value={discountPercent}
                            onChange={(e) => {
                              setDiscountPercent(Number(e.target.value));
                              setDiscountAmount(0);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tk.
                          </label>
                          <input
                            type="number"
                            value={discountAmount}
                            onChange={(e) => {
                              setDiscountAmount(Number(e.target.value));
                              setDiscountPercent(0);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Amount
                        </label>
                        <input
                          type="number"
                          value={amount.toFixed(2)}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      
                      <div className="col-span-2 flex justify-end">
                        <button
                          onClick={addToCart}
                          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cart Table */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Product Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Size</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Discount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Action</th>
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
                            <tr key={item.id} className="border-t border-gray-200 dark:border-gray-700">
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.productName}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.size || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.qty}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.price}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.discount.toFixed(2)} Tk</td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.amount.toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Section: Amount Details */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-fit">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-sm font-medium text-gray-900 dark:text-white">Amount Details</h2>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Sub Total</span>
                      <span className="text-gray-900 dark:text-white">{subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Total Discount (Without VAT)</span>
                      <span className="text-gray-900 dark:text-white">{totalDiscount.toFixed(2)}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Vat</label>
                        <input
                          type="number"
                          value={vat.toFixed(2)}
                          readOnly
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Vat Rate %</label>
                        <input
                          type="number"
                          value={vatRate}
                          onChange={(e) => setVatRate(Number(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Transport Cost</label>
                      <input
                        type="number"
                        value={transportCost}
                        onChange={(e) => setTransportCost(Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">Total</span>
                        <span className="font-medium text-gray-900 dark:text-white">{total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">Return</span>
                        <span className="text-gray-900 dark:text-white">0.00</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Cash Paid</label>
                        <input
                          type="number"
                          value={cashPaid}
                          onChange={(e) => setCashPaid(Number(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Card Paid</label>
                        <input
                          type="number"
                          value={cardPaid}
                          onChange={(e) => setCardPaid(Number(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Bkash Paid</label>
                        <input
                          type="number"
                          value={bkashPaid}
                          onChange={(e) => setBkashPaid(Number(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Nagad Paid</label>
                        <input
                          type="number"
                          value={nagadPaid}
                          onChange={(e) => setNagadPaid(Number(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="block text-xs text-gray-700 dark:text-gray-300">Transaction Fee</label>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Tk</span>
                      </div>
                      <input
                        type="number"
                        value={transactionFee}
                        onChange={(e) => setTransactionFee(Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">Due</span>
                        <span className="text-gray-900 dark:text-white font-medium">{due.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleSell}
                      className="w-full py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      Sell
                    </button>
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