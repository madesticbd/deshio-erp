'use client';

import { useState, useEffect } from 'react';
import { Search, X, Globe } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import axios from '@/lib/axios';

interface DefectItem {
  id: string;
  barcode: string;
  productId: number;
  productName: string;
  sellingPrice?: number;
  store?: string;
}

interface CartProduct {
  id: number | string;
  product_id?: number | string;
  batch_id?: number | string;
  productName: string;
  barcode?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  amount: number;
  isDefective?: boolean;
  defectId?: string;
}

export default function SocialCommercePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  
  const [date, setDate] = useState(getTodayDate());
  const [salesBy, setSalesBy] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [socialId, setSocialId] = useState('');
  
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

  const [divisions, setDivisions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [upazillas, setUpazillas] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cart, setCart] = useState<CartProduct[]>([]);
  
  const [quantity, setQuantity] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountTk, setDiscountTk] = useState('');
  const [amount, setAmount] = useState('0.00');

  const [defectiveProduct, setDefectiveProduct] = useState<DefectItem | null>(null);
  const [selectedStore, setSelectedStore] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);

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
    }
  };

  // Fetch functions
  const fetchStores = async () => {
    try {
      const response = await axios.get('/stores', { params: { is_active: true } });
      let storesData = [];
      
      if (response.data?.success && response.data?.data) {
        storesData = Array.isArray(response.data.data) ? response.data.data : 
                     Array.isArray(response.data.data.data) ? response.data.data.data : [];
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
      const response = await axios.get('/products');
      let productsData = [];
      
      if (response.data?.success && response.data?.data) {
        productsData = Array.isArray(response.data.data) ? response.data.data : 
                      Array.isArray(response.data.data.data) ? response.data.data.data : [];
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      }
      
      setAllProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      setAllProducts([]);
    }
  };

  const fetchInventoryForStore = async (storeId: string) => {
    if (!storeId) return;
    
    try {
      setIsLoadingData(true);
      console.log('📦 Fetching inventory for store:', storeId);
      
      // Try multiple inventory endpoints
      let inventoryData: any[] = [];
      let inventoryLoaded = false;
      
      // Try 1: Store-specific inventory
      try {
        const response = await axios.get(`/stores/${storeId}/inventory`);
        console.log('📦 Store inventory response:', response.data);
        
        if (response.data?.success && response.data?.data) {
          inventoryData = Array.isArray(response.data.data) ? response.data.data : 
                         Array.isArray(response.data.data.data) ? response.data.data.data : [];
        } else if (Array.isArray(response.data)) {
          inventoryData = response.data;
        }
        
        if (inventoryData.length > 0) {
          inventoryLoaded = true;
          console.log('✅ Store inventory loaded:', inventoryData.length, 'items');
        }
      } catch (error) {
        console.log('⚠️ Store inventory endpoint not available');
      }
      
      // Try 2: Global inventory filtered by store
      if (!inventoryLoaded) {
        try {
          const globalResponse = await axios.get('/inventory/global');
          console.log('🌐 Global inventory response:', globalResponse.data);
          
          let allInventory: any[] = [];
          
          if (globalResponse.data?.success && globalResponse.data?.data) {
            allInventory = Array.isArray(globalResponse.data.data) ? globalResponse.data.data : 
                          Array.isArray(globalResponse.data.data.data) ? globalResponse.data.data.data : [];
          } else if (Array.isArray(globalResponse.data)) {
            allInventory = globalResponse.data;
          }
          
          // Filter by store
          inventoryData = allInventory.filter((item: any) => 
            String(item.store_id || item.storeId) === String(storeId)
          );
          
          if (inventoryData.length > 0) {
            inventoryLoaded = true;
            console.log('✅ Filtered inventory:', inventoryData.length, 'items');
          }
        } catch (error) {
          console.log('⚠️ Global inventory endpoint not available');
        }
      }
      
      // Set inventory (even if empty)
      setInventory(inventoryData);
      console.log('📊 Final inventory count:', inventoryData.length);
      
      if (inventoryData.length === 0) {
        console.log('⚠️ No inventory found - products will be shown without stock info');
      }
      
    } catch (error: any) {
      console.error('❌ Inventory fetch error:', error.message);
      setInventory([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Local search fallback with multi-language support
  const performLocalSearch = (query: string) => {
    const results: any[] = [];
    const queryLower = query.toLowerCase().trim();
    
    console.log('🔍 Local search for:', queryLower);
    console.log('📦 Available products:', allProducts.length);
    console.log('📊 Available inventory items:', inventory.length);

    // If no inventory, show products anyway for debugging
    const showProductsWithoutInventory = inventory.length === 0;

    allProducts.forEach((prod: any) => {
      // Get searchable text
      const productName = (prod.name || '').toLowerCase();
      const productSku = (prod.sku || '').toLowerCase();
      const productDesc = (prod.description || '').toLowerCase();
      const categoryName = (prod.category?.name || prod.category?.title || '').toLowerCase();
      
      // Calculate relevance score
      let relevanceScore = 0;
      let matches = false;
      
      // Exact match (highest priority)
      if (productName === queryLower || productSku === queryLower) {
        relevanceScore = 100;
        matches = true;
      }
      // Starts with (high priority)
      else if (productName.startsWith(queryLower) || productSku.startsWith(queryLower)) {
        relevanceScore = 80;
        matches = true;
      }
      // Contains in name or SKU (medium priority)
      else if (productName.includes(queryLower) || productSku.includes(queryLower)) {
        relevanceScore = 60;
        matches = true;
      }
      // Contains in description or category (lower priority)
      else if (productDesc.includes(queryLower) || categoryName.includes(queryLower)) {
        relevanceScore = 40;
        matches = true;
      }
      // Fuzzy match for misspellings (lowest priority)
      else {
        const similarity = calculateSimilarity(queryLower, productName);
        if (similarity > 60) {
          relevanceScore = similarity;
          matches = true;
        }
      }
      
      if (matches) {
        if (showProductsWithoutInventory) {
          // Show product even without inventory for debugging
          console.log('⚠️ Found product but no inventory check:', prod.name);
          
          const primaryImage = prod.images?.find((img: any) => img.is_primary) || prod.images?.[0];
          const imageUrl = primaryImage?.image_url || 
                         primaryImage?.url || 
                         prod.main_image ||
                         prod.image ||
                         '';

          results.push({
            id: prod.id,
            name: prod.name,
            sku: prod.sku,
            batchId: 'no-inventory',
            attributes: { 
              Price: prod.price || 0,
              mainImage: imageUrl
            },
            available: 0,
            relevance_score: relevanceScore,
            search_stage: 'local-no-inventory'
          });
        } else {
          // Get available inventory
          const availableItems = inventory.filter((item: any) => {
            const itemProductId = String(item.product_id || item.productId);
            const prodId = String(prod.id);
            const matches = itemProductId === prodId && item.status === 'available';
            
            if (matches) {
              console.log('✅ Inventory match:', {
                product: prod.name,
                productId: prodId,
                inventoryProductId: itemProductId,
                status: item.status
              });
            }
            
            return matches;
          });

          console.log(`📊 Product "${prod.name}" (ID: ${prod.id}): ${availableItems.length} inventory items`);

          if (availableItems.length > 0) {
            const groups: { [key: string]: { batchId: any; price: number; count: number } } = {};

            availableItems.forEach((item: any) => {
              const bid = String(item.batch_id || item.batchId || 'default');
              const price = item.selling_price || item.sellingPrice || prod.price || 0;
              
              if (!groups[bid]) {
                groups[bid] = { batchId: bid, price: price, count: 0 };
              }
              groups[bid].count++;
            });

            Object.values(groups).forEach((group) => {
              const primaryImage = prod.images?.find((img: any) => img.is_primary) || prod.images?.[0];
              const imageUrl = primaryImage?.image_url || 
                             primaryImage?.url || 
                             prod.main_image ||
                             prod.image ||
                             '';

              results.push({
                id: prod.id,
                name: prod.name,
                sku: prod.sku,
                batchId: group.batchId,
                attributes: { 
                  Price: group.price,
                  mainImage: imageUrl
                },
                available: group.count,
                relevance_score: relevanceScore,
                search_stage: 'local'
              });
            });
          }
        }
      }
    });
    
    // Sort by relevance score
    results.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    
    console.log('✅ Local search results:', results.length);
    if (results.length > 0) {
      console.log('📊 Sample result:', results[0]);
    }
    
    return results;
  };

  // Simple similarity calculation for fuzzy matching
  const calculateSimilarity = (str1: string, str2: string): number => {
    if (str1.length === 0 || str2.length === 0) return 0;
    if (str1 === str2) return 100;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) {
        matches++;
      }
    }
    
    return (matches / longer.length) * 100;
  };

  const calculateAmount = (basePrice: number, qty: number, discPer: number, discTk: number) => {
    const baseAmount = basePrice * qty;
    const percentDiscount = (baseAmount * discPer) / 100;
    const totalDiscount = percentDiscount + discTk;
    return Math.max(0, baseAmount - totalDiscount);
  };

  // useEffects
  useEffect(() => {
    const userName = localStorage.getItem('userName') || '';
    setSalesBy(userName);
    
    const loadInitialData = async () => {
      await Promise.all([fetchProducts(), fetchStores()]);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      fetchInventoryForStore(selectedStore);
    }
  }, [selectedStore]);

  useEffect(() => {
    if (!searchQuery.trim() || !Array.isArray(inventory)) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      console.log('🔍 Searching for:', searchQuery);
      
      // Try advanced search API as per documentation
      try {
        const response = await axios.post('/products/advanced-search', {
          query: searchQuery,
          is_archived: false,
          enable_fuzzy: true,
          fuzzy_threshold: 60,
          search_fields: ['name', 'sku', 'description', 'category', 'custom_fields'],
          per_page: 50
        });

        console.log('📦 API Response:', response.data);

        if (response.data?.success) {
          // Handle pagination structure from API
          const products = response.data.data?.items || 
                          response.data.data?.data?.items ||
                          response.data.data || 
                          [];
          
          console.log('✅ API search found:', products.length, 'products');
          console.log('🔍 Search terms used:', response.data.search_terms);
          
          const results: any[] = [];

          products.forEach((prod: any) => {
            // Match with store inventory
            const availableItems = inventory.filter((item: any) => {
              const itemProductId = String(item.product_id || item.productId);
              return itemProductId === String(prod.id) && item.status === 'available';
            });

            if (availableItems.length > 0) {
              const groups: { [key: string]: { batchId: any; price: number; count: number } } = {};

              availableItems.forEach((item: any) => {
                const bid = String(item.batch_id || item.batchId || 'default');
                const price = item.selling_price || item.sellingPrice || prod.price || 0;
                
                if (!groups[bid]) {
                  groups[bid] = { batchId: bid, price: price, count: 0 };
                }
                groups[bid].count++;
              });

              Object.values(groups).forEach((group) => {
                // Get image from product
                const primaryImage = prod.images?.find((img: any) => img.is_primary) || 
                                    prod.images?.[0];
                const imageUrl = primaryImage?.image_url || 
                               primaryImage?.url || 
                               prod.main_image ||
                               prod.image ||
                               '';

                results.push({
                  id: prod.id,
                  name: prod.name,
                  sku: prod.sku,
                  batchId: group.batchId,
                  attributes: { 
                    Price: group.price,
                    mainImage: imageUrl
                  },
                  available: group.count,
                  relevance_score: prod.relevance_score || 0,
                  search_stage: prod.search_stage || 'api'
                });
              });
            }
          });

          console.log('✅ Matched with inventory:', results.length, 'results');
          
          // Sort by relevance score
          results.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
          
          setSearchResults(results);
          
          if (results.length === 0 && products.length > 0) {
            console.warn('⚠️ Products found but no inventory available in this store');
            showToast('Products found but not available in selected store', 'error');
          }
        } else {
          console.warn('⚠️ API returned unsuccessful response');
          throw new Error('API search unsuccessful');
        }
      } catch (error: any) {
        console.warn('❌ API search failed:', error.response?.data?.message || error.message);
        
        // Fallback to local search
        console.log('🔄 Falling back to local search...');
        const localResults = performLocalSearch(searchQuery);
        console.log('✅ Local search found:', localResults.length, 'results');
        setSearchResults(localResults);
        
        if (localResults.length === 0) {
          showToast('No products found. Try a different search term.', 'error');
        }
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, inventory, allProducts]);

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

  useEffect(() => {
    if (selectedProduct && quantity) {
      const price = parseFloat(String(selectedProduct.attributes?.Price || 0));
      const qty = parseFloat(quantity) || 0;
      const discPer = parseFloat(discountPercent) || 0;
      const discTk = parseFloat(discountTk) || 0;
      
      const finalAmount = calculateAmount(price, qty, discPer, discTk);
      setAmount(finalAmount.toFixed(2));
    } else {
      setAmount('0.00');
    }
  }, [selectedProduct, quantity, discountPercent, discountTk]);

  useEffect(() => {
    const defectData = sessionStorage.getItem('defectItem');
    if (defectData) {
      try {
        const defect = JSON.parse(defectData);
        setDefectiveProduct(defect);
        setSelectedProduct({
          id: defect.productId,
          name: defect.productName,
          batchId: 'defective',
          attributes: { mainImage: '', Price: defect.sellingPrice || 0 },
          available: 1,
          isDefective: true,
          defectId: defect.id,
          barcode: defect.barcode
        });
        setQuantity('1');
        setAmount((defect.sellingPrice || 0).toFixed(2));
        alert('Defective product loaded.');
      } catch (error) {
        console.error('Error parsing defect:', error);
      }
    }
  }, []);

  // Event handlers
  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setSearchQuery('');
    setSearchResults([]);
    setQuantity('1');
    setDiscountPercent('');
    setDiscountTk('');
  };

  const addToCart = () => {
    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) {
      alert('Please select a product and enter quantity');
      return;
    }

    const price = parseFloat(String(selectedProduct.attributes?.Price || 0));
    const qty = parseInt(quantity);
    const discPer = parseFloat(discountPercent) || 0;
    const discTk = parseFloat(discountTk) || 0;
    
    const baseAmount = price * qty;
    const discountValue = discPer > 0 ? (baseAmount * discPer) / 100 : discTk;
    const finalAmount = baseAmount - discountValue;

    const newItem: CartProduct = {
      id: Date.now(),
      product_id: selectedProduct.id,
      batch_id: selectedProduct.batchId,
      productName: selectedProduct.name,
      barcode: selectedProduct.barcode,
      quantity: qty,
      unit_price: price,
      discount_amount: discountValue,
      amount: finalAmount,
      isDefective: selectedProduct.isDefective,
      defectId: selectedProduct.defectId
    };
    
    setCart([...cart, newItem]);
    setSelectedProduct(null);
    setQuantity('');
    setDiscountPercent('');
    setDiscountTk('');
    setAmount('0.00');
  };

  const removeFromCart = (id: number | string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.amount, 0);

  const handleConfirmOrder = async () => {
    if (!userName || !userEmail || !userPhone) {
      alert('Please fill in customer information');
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
      const orderData = {
        order_type: 'social_commerce',
        store_id: parseInt(selectedStore),
        customer: {
          name: userName,
          email: userEmail,
          phone: userPhone,
          address: isInternational ? 
            `${internationalCity}, ${state ? state + ', ' : ''}${country}` :
            `${city}, ${district}, ${division}`
        },
        items: cart.map(item => ({
          product_id: parseInt(String(item.product_id)),
          batch_id: item.batch_id ? parseInt(String(item.batch_id)) : undefined,
          barcode: item.barcode,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount
        })),
        shipping_amount: 0,
        notes: `Social Commerce. ${socialId ? `ID: ${socialId}. ` : ''}${isInternational ? 'International' : 'Domestic'} delivery.`
      };
      
      sessionStorage.setItem('pendingOrder', JSON.stringify({
        ...orderData,
        salesBy,
        date,
        isInternational,
        deliveryAddress: isInternational ? {
          country, state, city: internationalCity,
          address: deliveryAddress, postalCode: internationalPostalCode
        } : {
          division, district, city, zone, area,
          address: deliveryAddress, postalCode
        },
        subtotal
      }));
      
      window.location.href = '/social-commerce/amount-details';
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process order');
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
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-4 md:mb-6">Social Commerce</h1>
              
              <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="w-full sm:w-auto">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Sales By</label>
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
                  {selectedStore && isLoadingData && (
                    <p className="mt-1 text-xs text-blue-600">Loading inventory...</p>
                  )}
                  {selectedStore && !isLoadingData && inventory.length > 0 && (
                    <p className="mt-1 text-xs text-green-600">{inventory.length} items in stock</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-4 md:space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-5">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Customer Information</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">User Name*</label>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">User Email*</label>
                        <input
                          type="email"
                          placeholder="sample@email.com"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">User Phone Number*</label>
                        <input
                          type="text"
                          placeholder="Phone Number"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Social ID</label>
                        <input
                          type="text"
                          placeholder="Enter Social ID"
                          value={socialId}
                          onChange={(e) => setSocialId(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                      </div>
                    </div>
                  </div>

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
                </div>

                <div className="space-y-4 md:space-y-6">
                  <div className={`bg-white dark:bg-gray-800 rounded-lg border p-4 md:p-5 ${selectedProduct?.isDefective ? 'border-orange-300 dark:border-orange-700' : 'border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Search Product</h3>
                      {selectedProduct?.isDefective && (
                        <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded">Defective Product</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        placeholder={!selectedStore ? "Select a store first..." : isLoadingData ? "Loading inventory..." : "Search product name..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={!selectedStore || isLoadingData}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button 
                        disabled={!selectedStore || isLoadingData}
                        className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Search size={18} />
                      </button>
                    </div>

                    {!selectedStore && (
                      <div className="text-center py-8 text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                        Please select a store to search products
                      </div>
                    )}

                    {selectedStore && isLoadingData && (
                      <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                        Loading inventory for selected store...
                      </div>
                    )}

                    {selectedStore && !isLoadingData && searchQuery && searchResults.length === 0 && (
                      <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                        No products found matching "{searchQuery}"
                      </div>
                    )}

                    {searchResults.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 md:max-h-80 overflow-y-auto mb-4 p-1">
                        {searchResults.map((product) => (
                          <div
                            key={`${product.id}-${product.batchId}`}
                            onClick={() => handleProductSelect(product)}
                            className="border border-gray-200 dark:border-gray-600 rounded p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <img 
                              src={product.attributes.mainImage} 
                              alt={product.name} 
                              className="w-full h-24 sm:h-32 object-cover rounded mb-2" 
                            />
                            <p className="text-xs text-gray-900 dark:text-white font-medium truncate">{product.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{product.attributes.Price} Tk</p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Available: {product.available}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedProduct && (
                      <div className={`mt-4 p-3 border rounded mb-4 ${
                        selectedProduct.isDefective 
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700' 
                          : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Selected Product</span>
                          <button onClick={() => {
                            setSelectedProduct(null);
                            setQuantity('');
                            setDiscountPercent('');
                            setDiscountTk('');
                            setAmount('0.00');
                          }} className="text-red-600 hover:text-red-700">
                            <X size={16} />
                          </button>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProduct.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Price: {selectedProduct.attributes.Price} Tk</p>
                        <p className="text-sm text-green-600 dark:text-green-400">Available: {selectedProduct.available}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          disabled={!selectedProduct || selectedProduct?.isDefective}
                          min="1"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Discount %</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={discountPercent}
                            onChange={(e) => { setDiscountPercent(e.target.value); setDiscountTk(''); }}
                            disabled={!selectedProduct || selectedProduct?.isDefective}
                            className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Discount Tk</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={discountTk}
                            onChange={(e) => { setDiscountTk(e.target.value); setDiscountPercent(''); }}
                            disabled={!selectedProduct || selectedProduct?.isDefective}
                            className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                          <input
                            type="text"
                            value={amount}
                            readOnly
                            className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <button
                        onClick={addToCart}
                        disabled={!selectedProduct}
                        className="w-full px-4 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Cart ({cart.length} items)</h3>
                    </div>
                    <div className="max-h-60 md:max-h-96 overflow-y-auto overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Product</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Qty</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Price</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Amount</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cart.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No products in cart</td></tr>
                          ) : (
                            cart.map((item) => (
                              <tr key={item.id} className={`border-b border-gray-200 dark:border-gray-700 ${item.isDefective ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}>
                                <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{item.productName}</td>
                                <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                                <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{item.unit_price.toFixed(2)}</td>
                                <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{item.amount.toFixed(2)}</td>
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
                          <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{subtotal.toFixed(2)} Tk</span>
                        </div>
                        {isInternational && (
                          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400">
                            <Globe className="w-4 h-4 flex-shrink-0" />
                            <span>International shipping rates will apply</span>
                          </div>
                        )}
                        <button
                          onClick={handleConfirmOrder}
                          className="w-full px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded transition-colors"
                        >
                          Confirm Order
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