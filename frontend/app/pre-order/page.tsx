'use client';

import { useState, useEffect } from 'react';
import { Search, X, Globe, Package } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import storeService from '@/services/storeService';
import productService from '@/services/productService';
import productImageService from '@/services/productImageService';
import axios from '@/lib/axios';

interface CartProduct {
  id: number | string;
  product_id: number;
  productName: string;
  sku: string;
  quantity: number;
  imageUrl: string;
}

export default function PreOrderPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  
  const [date, setDate] = useState(getTodayDate());
  const [salesBy, setSalesBy] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  
  const [isInternational, setIsInternational] = useState(false);
  
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');
  const [area, setArea] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [internationalCity, setInternationalCity] = useState('');
  const [internationalPostalCode, setInternationalPostalCode] = useState('');
  
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [preorderNotes, setPreorderNotes] = useState('');

  const [divisions, setDivisions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [upazillas, setUpazillas] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cart, setCart] = useState<CartProduct[]>([]);
  
  const [quantity, setQuantity] = useState('');

  const [selectedStore, setSelectedStore] = useState('');

  function getTodayDate() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[today.getMonth()];
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'error') {
      console.error('Error:', message);
      alert('Error: ' + message);
    } else {
      console.log('Success:', message);
      alert(message);
    }
  };

  const getImageUrl = (imagePath: string | null | undefined): string => {
    if (!imagePath) return '/placeholder-image.jpg';
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
    
    if (imagePath.startsWith('/storage')) {
      return `${baseUrl}${imagePath}`;
    }
    
    return `${baseUrl}/storage/product-images/${imagePath}`;
  };

  const fetchPrimaryImage = async (productId: number): Promise<string> => {
    try {
      const images = await productImageService.getProductImages(productId);
      
      const primaryImage = images.find(img => img.is_primary && img.is_active);
      
      if (primaryImage) {
        return getImageUrl(primaryImage.image_url || primaryImage.image_path);
      }
      
      const firstActiveImage = images.find(img => img.is_active);
      if (firstActiveImage) {
        return getImageUrl(firstActiveImage.image_url || firstActiveImage.image_path);
      }
      
      return '/placeholder-image.jpg';
    } catch (error) {
      console.error('Error fetching product images:', error);
      return '/placeholder-image.jpg';
    }
  };

  const fetchStores = async () => {
    try {
      const response = await storeService.getStores({ is_active: true, per_page: 1000 });
      let storesData = [];
      
      if (response?.success && response?.data) {
        storesData = Array.isArray(response.data) ? response.data : 
                     Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        storesData = response.data;
      }
      
      setStores(storesData);
      if (storesData.length > 0) {
        setSelectedStore(String(storesData[0].id));
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      setStores([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll({ per_page: 1000, is_archived: false });
      setAllProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setAllProducts([]);
    }
  };

  const performProductSearch = async (query: string) => {
    const results: any[] = [];
    const queryLower = query.toLowerCase().trim();
    
    console.log('🔍 Searching for products:', queryLower);

    for (const prod of allProducts) {
      const productName = (prod.name || '').toLowerCase();
      const productSku = (prod.sku || '').toLowerCase();
      
      let matches = false;
      let relevanceScore = 0;
      
      if (productName === queryLower || productSku === queryLower) {
        relevanceScore = 100;
        matches = true;
      } else if (productName.startsWith(queryLower) || productSku.startsWith(queryLower)) {
        relevanceScore = 80;
        matches = true;
      } else if (productName.includes(queryLower) || productSku.includes(queryLower)) {
        relevanceScore = 60;
        matches = true;
      }
      
      if (matches) {
        const imageUrl = await fetchPrimaryImage(prod.id);

        results.push({
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          imageUrl: imageUrl,
          relevance_score: relevanceScore
        });
      }
    }
    
    results.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    return results;
  };

  useEffect(() => {
    const userName = localStorage.getItem('userName') || '';
    setSalesBy(userName);
    
    const loadInitialData = async () => {
      await Promise.all([fetchProducts(), fetchStores()]);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      const results = await performProductSearch(searchQuery);
      setSearchResults(results);
      
      if (results.length === 0) {
        showToast('No products found', 'error');
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, allProducts]);

  useEffect(() => {
    if (!isInternational) {
      fetch('https://bdapi.vercel.app/api/v.1/division')
        .then(res => res.json())
        .then(data => setDivisions(data.data || []))
        .catch(() => setDivisions([]));
    }
  }, [isInternational]);

  useEffect(() => {
    if (!division || isInternational) return;
    const selectedDiv = divisions.find(d => d.name === division);
    if (selectedDiv) {
      fetch(`https://bdapi.vercel.app/api/v.1/district/${selectedDiv.id}`)
        .then(res => res.json())
        .then(data => setDistricts(data.data || []))
        .catch(() => setDistricts([]));
    }
  }, [division, divisions, isInternational]);

  useEffect(() => {
    if (!district || isInternational) return;
    const selectedDist = districts.find(d => d.name === district);
    if (selectedDist) {
      fetch(`https://bdapi.vercel.app/api/v.1/upazilla/${selectedDist.id}`)
        .then(res => res.json())
        .then(data => setUpazillas(data.data || []))
        .catch(() => setUpazillas([]));
    }
  }, [district, districts, isInternational]);

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setSearchQuery('');
    setSearchResults([]);
    setQuantity('1');
  };

  const addToCart = () => {
    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) {
      alert('Please select a product and enter quantity');
      return;
    }

    const qty = parseInt(quantity);

    const newItem: CartProduct = {
      id: Date.now(),
      product_id: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      quantity: qty,
      imageUrl: selectedProduct.imageUrl
    };
    
    setCart([...cart, newItem]);
    setSelectedProduct(null);
    setQuantity('');
  };

  const removeFromCart = (id: number | string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleConfirmPreOrder = async () => {
    if (!userName || !userPhone) {
      alert('Please fill in customer name and phone number');
      return;
    }
    if (cart.length === 0) {
      alert('Please add products to cart');
      return;
    }
    if (!selectedStore) {
      alert('Please select a store');
      return;
    }
    
    if (isInternational) {
      if (!country || !internationalCity) {
        alert('Please fill in international address');
        return;
      }
    } else {
      if (!division || !district || !city) {
        alert('Please fill in delivery address');
        return;
      }
    }
    
    try {
      console.log('📦 CREATING PRE-ORDER');

      const orderData = {
        order_type: 'preorder',
        store_id: parseInt(selectedStore),
        customer: {
          name: userName,
          email: userEmail || undefined,
          phone: userPhone,
          address: isInternational ? 
            `${internationalCity}, ${state ? state + ', ' : ''}${country}` :
            `${city}, ${district}, ${division}`
        },
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: 0,  // No price for pre-orders
          discount_amount: 0
        })),
        payment_status: 'pending',
        total_amount: 0,  // No amount for pre-orders
        shipping_amount: 0,
        expected_delivery_date: expectedDeliveryDate || undefined,
        notes: `PRE-ORDER - Customer: ${userName}. ${preorderNotes ? preorderNotes + '. ' : ''}Products: ${cart.map(item => `${item.productName} (Qty: ${item.quantity})`).join(', ')}. ${isInternational ? 'International' : 'Domestic'} delivery.`
      };

      console.log('📦 Pre-order data:', orderData);

      const response = await axios.post('/orders', orderData);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create pre-order');
      }

      const createdOrder = response.data.data;
      console.log('✅ Pre-order created:', createdOrder.order_number);

      showToast(`Pre-order ${createdOrder.order_number} created successfully!`, 'success');
      
      // Clear form
      setCart([]);
      setUserName('');
      setUserEmail('');
      setUserPhone('');
      setDeliveryAddress('');
      setExpectedDeliveryDate('');
      setPreorderNotes('');
      setDivision('');
      setDistrict('');
      setCity('');
      setZone('');
      setArea('');
      setPostalCode('');
      setCountry('');
      setState('');
      setInternationalCity('');
      setInternationalPostalCode('');
      
      setTimeout(() => {
        window.location.href = '/orders';
      }, 2000);

    } catch (error: any) {
      console.error('❌ Pre-order creation failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error creating pre-order. Please try again.';
      showToast(errorMessage, 'error');
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                  <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">Pre-Order Form</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Order products for future delivery</p>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    No Payment Required
                  </span>
                </div>
              </div>
              
              <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="w-full sm:w-auto">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Created By</label>
                  <input
                    type="text"
                    value={salesBy}
                    readOnly
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Store <span className="text-red-500">*</span></label>
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Store</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-auto">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Expected Delivery</label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Left Column - Customer Info & Address */}
                <div className="space-y-4 md:space-y-6">
                  {/* Customer Information */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-5">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Customer Information</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Customer Name*</label>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input
                          type="email"
                          placeholder="sample@email.com (optional)"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Phone Number*</label>
                        <input
                          type="text"
                          placeholder="Phone Number"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Delivery Address</h3>
                      <button
                        onClick={() => {
                          setIsInternational(!isInternational);
                          setDivision(''); setDistrict(''); setCity(''); setZone(''); setArea(''); setPostalCode('');
                          setCountry(''); setState(''); setInternationalCity(''); setInternationalPostalCode('');
                          setDeliveryAddress('');
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isInternational
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <Globe className="w-4 h-4" />
                        {isInternational ? 'International' : 'Domestic'}
                      </button>
                    </div>
                    
                    {isInternational ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Country*</label>
                          <input type="text" placeholder="Enter Country" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">State/Province</label>
                          <input type="text" placeholder="Enter State" value={state} onChange={(e) => setState(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">City*</label>
                          <input type="text" placeholder="Enter City" value={internationalCity} onChange={(e) => setInternationalCity(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
                          <input type="text" placeholder="Enter Postal Code" value={internationalPostalCode} onChange={(e) => setInternationalPostalCode(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Street Address*</label>
                          <textarea placeholder="Full Address" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Division*</label>
                            <select value={division} onChange={(e) => setDivision(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                              <option value="">Select Division</option>
                              {divisions.map((d) => (<option key={d.id} value={d.name}>{d.name}</option>))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">District*</label>
                            <select value={district} onChange={(e) => setDistrict(e.target.value)} disabled={!division} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50">
                              <option value="">Select District</option>
                              {districts.map((d) => (<option key={d.id} value={d.name}>{d.name}</option>))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Upazilla*</label>
                            <select value={city} onChange={(e) => setCity(e.target.value)} disabled={!district} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50">
                              <option value="">Select Upazilla</option>
                              {upazillas.map((u) => (<option key={u.id} value={u.name}>{u.name}</option>))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Zone*</label>
                            <input type="text" placeholder="Search Zone..." value={zone} onChange={(e) => setZone(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Area (Optional)</label>
                          <input type="text" placeholder="Search Area..." value={area} onChange={(e) => setArea(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Delivery Address</label>
                          <textarea placeholder="Delivery Address" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
                          <input type="text" placeholder="e.g., 1212" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pre-order Notes */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-5">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Pre-order Notes</h3>
                    <textarea
                      placeholder="Add any special instructions or notes for this pre-order..."
                      value={preorderNotes}
                      onChange={(e) => setPreorderNotes(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Right Column - Product Search & Cart */}
                <div className="space-y-4 md:space-y-6">
                  {/* Product Search */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-5">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Search Products</h3>
                    
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        placeholder="Search product name or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                      <button className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded transition-colors flex-shrink-0">
                        <Search size={18} />
                      </button>
                    </div>

                    {searchQuery && searchResults.length === 0 && (
                      <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                        No products found matching "{searchQuery}"
                      </div>
                    )}

                    {searchResults.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 md:max-h-80 overflow-y-auto mb-4 p-1">
                        {searchResults.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleProductSelect(product)}
                            className="border border-gray-200 dark:border-gray-600 rounded p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <img 
                              src={product.imageUrl} 
                              alt={product.name} 
                              className="w-full h-24 sm:h-32 object-cover rounded mb-2" 
                            />
                            <p className="text-xs text-gray-900 dark:text-white font-medium truncate">{product.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">SKU: {product.sku}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedProduct && (
                      <div className="mt-4 p-3 border rounded mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Selected Product</span>
                          <button onClick={() => {
                            setSelectedProduct(null);
                            setQuantity('');
                          }} className="text-red-600 hover:text-red-700">
                            <X size={16} />
                          </button>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProduct.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">SKU: {selectedProduct.sku}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Quantity*</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          disabled={!selectedProduct}
                          min="1"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                        />
                      </div>

                      <button
                        onClick={addToCart}
                        disabled={!selectedProduct}
                        className="w-full px-4 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add to Pre-order
                      </button>
                    </div>
                  </div>

                  {/* Cart */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Pre-order Items ({cart.length})</h3>
                    </div>
                    <div className="max-h-60 md:max-h-96 overflow-y-auto overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Product</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Quantity</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cart.length === 0 ? (
                            <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No products in pre-order</td></tr>
                          ) : (
                            cart.map((item) => (
                              <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                                <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                                  <div className="flex items-center gap-2">
                                    <img src={item.imageUrl} alt={item.productName} className="w-10 h-10 object-cover rounded" />
                                    <div>
                                      <p className="font-medium">{item.productName}</p>
                                      <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                                <td className="px-3 py-2">
                                  <button onClick={() => removeFromCart(item.id)} className="text-red-600 hover:text-red-700 text-xs font-medium">Remove</button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {cart.length > 0 && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex justify-between text-sm mb-3">
                          <span className="text-gray-600 dark:text-gray-400">Total Items:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{cart.length}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-3">
                          <span className="text-gray-600 dark:text-gray-400">Total Quantity:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                        </div>
                        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400">
                          <Package className="w-4 h-4 flex-shrink-0" />
                          <span>No payment required. Order will be marked as pre-order.</span>
                        </div>
                        <button
                          onClick={handleConfirmPreOrder}
                          className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                        >
                          Confirm Pre-order
                        </button>
                      </div>
                    )}
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