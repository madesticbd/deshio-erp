'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, X, CheckCircle2, AlertCircle, Package } from 'lucide-react';
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
  productId: number;
  productName: string;
  size: string;
  qty: number;
  price: number;
  discount: number;
  amount: number;
  isDefective?: boolean;
  defectId?: string;
  barcode?: string;
}

interface Product {
  id: number;
  name: string;
  attributes: {
    mainImage?: string;
    Price?: string;
    [key: string]: any;
  };
}

interface InventoryItem {
  id: number;
  productId: number;
  barcode: string;
  status: string;
  location: string;
  sellingPrice: number;
  [key: string]: any;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface DefectItem {
  id: string;
  barcode: string;
  productId: number;
  productName: string;
  sellingPrice?: number;
  store?: string;
}

export default function POSPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [outlets, setOutlets] = useState<Store[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [userStoreId, setUserStoreId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  
  // Form states
  const [customerName, setCustomerName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [address, setAddress] = useState('');
  const [product, setProduct] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [amount, setAmount] = useState(0);
  
  // Defective product states
  const [defectiveProduct, setDefectiveProduct] = useState<DefectItem | null>(null);
  const [defectivePrice, setDefectivePrice] = useState('');
  const [defectiveStore, setDefectiveStore] = useState('');
  
  // Amount details
  const [vatRate, setVatRate] = useState(5);
  const [transportCost, setTransportCost] = useState(0);
  const [cashPaid, setCashPaid] = useState(0);
  const [cardPaid, setCardPaid] = useState(0);
  const [bkashPaid, setBkashPaid] = useState(0);
  const [nagadPaid, setNagadPaid] = useState(0);
  const [transactionFee, setTransactionFee] = useState(0);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Load defective product from sessionStorage
  useEffect(() => {
    const defectData = sessionStorage.getItem('defectItem');
    if (defectData) {
      try {
        const defect = JSON.parse(defectData);
        setDefectiveProduct(defect);
        setDefectivePrice(defect.sellingPrice?.toString() || '');
        setDefectiveStore(defect.store || '');
        
        // Auto-select the store if available
        if (defect.store) {
          const outlet = outlets.find(o => o.name === defect.store || o.id.toString() === defect.store);
          if (outlet) {
            setSelectedOutlet(outlet.id.toString());
          }
        }
        
        showToast('Defective product loaded. Please complete the sale.', 'success');
      } catch (error) {
        console.error('Error parsing defect data:', error);
      }
    }
  }, [outlets]);

  useEffect(() => {
  // Get user role and store info from localStorage
  const role = localStorage.getItem('userRole') || '';
  const storeId = localStorage.getItem('storeId') || '';
  const name = localStorage.getItem('userName') || ''
  setUserRole(role);
  setUserStoreId(storeId);
  setUserName(name);
  
  fetchOutlets(role, storeId);
  fetchProducts();
  fetchInventory();
}, []);

const fetchOutlets = async (role: string, storeId: string) => {
  try {
    const response = await fetch('/api/stores');
    const data = await response.json();
    
    if (role === 'store_manager' && storeId) {
      // Filter to show only the store manager's outlet
      const userStore = data.find((store: Store) => String(store.id) === String(storeId));
      setOutlets(userStore ? [userStore] : data);
      
      // Auto-select the outlet for store managers
      if (userStore) {
        setSelectedOutlet(String(userStore.id));
      }
    } else {
      // Super admin sees all outlets
      setOutlets(data);
    }
  } catch (error) {
    console.error('Error fetching outlets:', error);
  }
};

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const getAvailableProducts = () => {
    if (!selectedOutlet) return [];
    
    const selectedOutletData = outlets.find(o => o.id.toString() === selectedOutlet);
    if (!selectedOutletData) return [];

    const outletInventory = inventory.filter(
      inv => inv.location === selectedOutletData.name && inv.status === 'available'
    );

    const availableProductIds = [...new Set(outletInventory.map(inv => inv.productId))];

    return products.filter(prod => availableProductIds.includes(prod.id));
  };

  const getAvailableQuantity = (productId: number) => {
    if (!selectedOutlet) return 0;
    
    const selectedOutletData = outlets.find(o => o.id.toString() === selectedOutlet);
    if (!selectedOutletData) return 0;

    return inventory.filter(
      inv => inv.productId === productId && 
             inv.location === selectedOutletData.name && 
             inv.status === 'available'
    ).length;
  };

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

  const handleProductSelect = (productName: string) => {
    setProduct(productName);
    const selectedProd = products.find(p => p.name === productName);
    if (selectedProd) {
      setSelectedProductId(selectedProd.id);
      
      const selectedOutletData = outlets.find(o => o.id.toString() === selectedOutlet);
      if (!selectedOutletData) return;

      const inventoryItem = inventory.find(
        inv => inv.productId === selectedProd.id && 
               inv.location === selectedOutletData.name && 
               inv.status === 'available'
      );
      if (inventoryItem) {
        setSellingPrice(inventoryItem.sellingPrice);
      } else if (selectedProd.attributes.Price) {
        setSellingPrice(Number(selectedProd.attributes.Price));
      }
    }
  };

  const addDefectiveToCart = () => {
    if (!defectiveProduct || !defectivePrice) {
      showToast('Defective product price is required', 'error');
      return;
    }

    if (!selectedOutlet) {
      showToast('Please select an outlet', 'error');
      return;
    }

    const price = parseFloat(defectivePrice);
    
    const newItem: CartItem = {
      id: Date.now(),
      productId: defectiveProduct.productId,
      productName: defectiveProduct.productName,
      size: '',
      qty: 1,
      price: price,
      discount: 0,
      amount: price,
      isDefective: true,
      defectId: defectiveProduct.id,
      barcode: defectiveProduct.barcode
    };
    
    setCart([...cart, newItem]);
    showToast('Defective product added to cart', 'success');
    
    // Clear defective product data
    setDefectiveProduct(null);
    setDefectivePrice('');
    sessionStorage.removeItem('defectItem');
  };

  const addToCart = () => {
    if (!product || !selectedProductId) {
      showToast('Please select a product', 'error');
      return;
    }
    
    if (sellingPrice <= 0 || quantity <= 0) {
      showToast('Please enter valid price and quantity', 'error');
      return;
    }

    if (!selectedOutlet) {
      showToast('Please select an outlet', 'error');
      return;
    }

    const availableQty = getAvailableQuantity(selectedProductId);

    if (availableQty < quantity) {
      showToast(`Only ${availableQty} items available at this outlet`, 'error');
      return;
    }
    
    const baseAmount = sellingPrice * quantity;
    const discountValue = discountPercent > 0 
      ? (baseAmount * discountPercent) / 100 
      : discountAmount;
    
    const newItem: CartItem = {
      id: Date.now(),
      productId: selectedProductId,
      productName: product,
      size: '',
      qty: quantity,
      price: sellingPrice,
      discount: discountValue,
      amount: baseAmount - discountValue
    };
    setCart([...cart, newItem]);
    
    setProduct('');
    setSelectedProductId(null);
    setSellingPrice(0);
    setQuantity(0);
    setDiscountPercent(0);
    setDiscountAmount(0);
    setAmount(0);
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

  const updateInventoryStatus = async (productId: number, quantity: number) => {
    try {
      if (!selectedOutlet) return;
      
      const selectedOutletData = outlets.find(o => o.id.toString() === selectedOutlet);
      if (!selectedOutletData) return;

      const availableItems = inventory.filter(
        inv => inv.productId === productId && 
               inv.location === selectedOutletData.name && 
               inv.status === 'available'
      );

      for (let i = 0; i < Math.min(quantity, availableItems.length); i++) {
        await fetch('/api/inventory', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: availableItems[i].id,
            status: 'sold',
            soldAt: new Date().toISOString()
          }),
        });
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  };

  const handleSell = async () => {
    if (!selectedOutlet) {
      showToast('Please select an outlet', 'error');
      return;
    }
    if (cart.length === 0) {
      showToast('Please add products to cart', 'error');
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
      items: cart.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        size: item.size,
        qty: item.qty,
        price: item.price,
        discount: item.discount,
        amount: item.amount,
        isDefective: item.isDefective || false,
        defectId: item.defectId || null,
        barcode: item.barcode || null
      })),
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
      console.log('💾 Saving sale with data:', saleData);
      
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Sale saved successfully:', result);
        
        // Update inventory status for regular products only
        for (const item of cart) {
          if (!item.isDefective) {
            await updateInventoryStatus(item.productId, item.qty);
          }
        }

        showToast('Sale completed successfully!', 'success');
        
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

        await fetchInventory();
      } else {
        const errorData = await response.json();
        console.error('❌ Sale failed:', errorData);
        showToast('Failed to complete sale', 'error');
      }
    } catch (error) {
      console.error('Error saving sale:', error);
      showToast('Error saving sale', 'error');
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 overflow-auto p-6">
            {/* Toast Notifications */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
              {toasts.map((toast) => (
                <div
                  key={toast.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
                    toast.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  } animate-slideIn`}
                >
                  {toast.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  )}
                  <p className={`text-sm font-medium ${
                    toast.type === 'success'
                      ? 'text-green-900 dark:text-green-300'
                      : 'text-red-900 dark:text-red-300'
                  }`}>
                    {toast.message}
                  </p>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className={`ml-2 ${
                      toast.type === 'success'
                        ? 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
                        : 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Point of Sale</h1>
              
              {/* Top Section */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sales By
                  </label>
                  <input
                    type="text"
                    value= {userName}
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

              {/* Defective Product Section */}
              {defectiveProduct && (
                <div className="mb-6 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-300">
                          Defective Product Sale
                        </h3>
                        <p className="text-sm text-orange-700 dark:text-orange-400">
                          Complete the sale for this defective item
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDefectiveProduct(null);
                        setDefectivePrice('');
                        sessionStorage.removeItem('defectItem');
                      }}
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-orange-700 dark:text-orange-400 mb-1">Product Name</p>
                      <p className="font-medium text-orange-900 dark:text-orange-200">{defectiveProduct.productName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-orange-700 dark:text-orange-400 mb-1">Barcode</p>
                      <p className="font-mono text-orange-900 dark:text-orange-200">{defectiveProduct.barcode}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-orange-700 dark:text-orange-400 mb-1">
                        Selling Price (৳)
                      </label>
                      <input
                        type="text"
                        value={defectivePrice}
                        readOnly
                        className="w-full px-3 py-2 border border-orange-300 dark:border-orange-600 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-orange-700 dark:text-orange-400 mb-1">
                        Store Location
                      </label>
                      <input
                        type="text"
                        value={defectiveStore}
                        readOnly
                        className="w-full px-3 py-2 border border-orange-300 dark:border-orange-600 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-200"
                      />
                    </div>
                  </div>

                  <button
                    onClick={addDefectiveToCart}
                    className="mt-4 w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md font-medium"
                  >
                    Add Defective Product to Cart
                  </button>
                </div>
              )}

              {/* Main Content Grid */}
              <div className="grid grid-cols-3 gap-6">
                {/* Left Section */}
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
                        <select
                          value={selectedOutlet}
                          onChange={(e) => setSelectedOutlet(e.target.value)}
                          disabled={userRole === 'store_manager'} // Add this line
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-600"
                        >
                          <option value="">Select Product</option>
                          {getAvailableProducts().map((prod) => {
                            const availableQty = getAvailableQuantity(prod.id);
                            return (
                              <option key={prod.id} value={prod.name}>
                                {prod.name} ({availableQty} available)
                              </option>
                            );
                          })}
                        </select>
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
                            <tr key={item.id} className={`border-t border-gray-200 dark:border-gray-700 ${item.isDefective ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                  {item.productName}
                                  {item.isDefective && (
                                    <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                                      Defective
                                    </span>
                                  )}
                                </div>
                              </td>
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

                {/* Right Section - Amount Details */}
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
                      className="w-full py-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-md text-sm font-medium transition-colors"
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

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}