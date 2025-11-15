'use client';

import { useState, useEffect } from 'react';
import { Search, X, Package, Globe } from 'lucide-react';
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
  
  // Bangladesh address fields
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');
  const [area, setArea] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  // International address fields
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
  const [isLoadingData, setIsLoadingData] = useState(true);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    // Simple alert for now - you can integrate a proper toast library
    if (type === 'error') {
      alert('Error: ' + message);
    } else {
      console.log('Success:', message);
    }
  };

  function getTodayDate() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[today.getMonth()];
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  }

  const fetchStores = async () => {
    try {
      const response = await axios.get('/stores', {
        params: { is_active: true }
      });
      
      console.log('Store API response:', response);
      
      let storesData = [];
      
      // Handle different response structures
      if (response.data) {
        if (response.data.success && response.data.data) {
          // Structure: { success: true, data: [...] }
          if (Array.isArray(response.data.data)) {
            storesData = response.data.data;
          } else if (response.data.data.data && Array.isArray(response.data.data.data)) {
            // Structure: { success: true, data: { data: [...] } }
            storesData = response.data.data.data;
          }
        } else if (Array.isArray(response.data)) {
          // Direct array response
          storesData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Structure: { data: [...] }
          storesData = response.data.data;
        }
      }
      
      console.log('Extracted stores:', storesData);
      
      const storesArray = Array.isArray(storesData) ? storesData : [];
      setStores(storesArray);
      
      if (storesArray.length > 0) {
        setSelectedStore(String(storesArray[0].id));
      } else {
        showToast('No active stores found', 'error');
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      showToast('Failed to load stores', 'error');
      setStores([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/products');
      
      console.log('Products API response:', response);
      
      let productsData = [];
      
      // Handle different response structures
      if (response.data) {
        if (response.data.success && response.data.data) {
          if (Array.isArray(response.data.data)) {
            productsData = response.data.data;
          } else if (response.data.data.data && Array.isArray(response.data.data.data)) {
            productsData = response.data.data.data;
          }
        } else if (Array.isArray(response.data)) {
          productsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          productsData = response.data.data;
        }
      }
      
      console.log('Extracted products:', productsData);
      setAllProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('Failed to load products', 'error');
      setAllProducts([]);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await axios.get('/inventory/global');
      
      console.log('Inventory API response:', response);
      
      let inventoryData = [];
      
      // Handle different response structures
      if (response.data) {
        if (response.data.success && response.data.data) {
          if (Array.isArray(response.data.data)) {
            inventoryData = response.data.data;
          } else if (response.data.data.data && Array.isArray(response.data.data.data)) {
            inventoryData = response.data.data.data;
          }
        } else if (Array.isArray(response.data)) {
          inventoryData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          inventoryData = response.data.data;
        }
      }
      
      console.log('Extracted inventory:', inventoryData);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      showToast('Failed to load inventory', 'error');
      setInventory([]);
    }
  };

  useEffect(() => {
    const userName = localStorage.getItem('userName') || '';
    setSalesBy(userName);
  }, []);

  useEffect(() => {
    const defectData = sessionStorage.getItem('defectItem');
    if (defectData) {
      try {
        const defect = JSON.parse(defectData);
        setDefectiveProduct(defect);
        
        const defectiveProductData = {
          id: defect.productId,
          name: defect.productName,
          batchId: 'defective',
          attributes: {
            mainImage: '',
            Price: defect.sellingPrice || 0
          },
          available: 1,
          isDefective: true,
          defectId: defect.id,
          barcode: defect.barcode
        };
        
        setSelectedProduct(defectiveProductData);
        setQuantity('1');
        setAmount((defect.sellingPrice || 0).toFixed(2));
        
        alert('Defective product loaded. Complete the order to sell this item.');
      } catch (error) {
        console.error('Error parsing defect data:', error);
      }
    }
  }, []);

  const getFlattenedProducts = () => {
    const flattened: any[] = [];
    
    // Safety check - ensure allProducts is an array
    if (!Array.isArray(allProducts)) {
      console.warn('allProducts is not an array:', allProducts);
      return flattened;
    }
    
    allProducts.forEach(product => {
      const variations = product.variations || product.variants;
      
      if (variations && variations.length > 0) {
        variations.forEach((variation: any, index: number) => {
          const colorAttr = variation.attributes?.Colour || 
                          variation.attributes?.colour || 
                          variation.attributes?.Color || 
                          variation.attributes?.color || 
                          `Variation ${index + 1}`;
          
          flattened.push({
            id: variation.id,
            name: `${product.name} - ${colorAttr}`,
            originalProductId: product.id,
            isVariation: true,
            variationIndex: index,
            attributes: {
              ...product.attributes,
              ...variation.attributes,
              mainImage: variation.attributes?.main_image || 
                        variation.attributes?.mainImage || 
                        product.attributes?.main_image || 
                        product.attributes?.mainImage || 
                        '',
              Price: variation.attributes?.Price || 
                    variation.attributes?.price || 
                    variation.price || 
                    0
            }
          });
        });
      } else {
        flattened.push({
          ...product,
          isVariation: false,
          attributes: {
            ...product.attributes,
            mainImage: product.attributes?.main_image || 
                      product.attributes?.mainImage || 
                      '',
            Price: product.attributes?.Price || 
                  product.attributes?.price || 
                  product.price || 
                  0
          }
        });
      }
    });
    
    return flattened;
  };

  const performLocalSearch = (query: string) => {
    const flattenedProducts = getFlattenedProducts();
    
    if (flattenedProducts.length === 0) {
      console.log('No products available for local search');
      return [];
    }
    
    const results: any[] = [];
    const queryLower = query.toLowerCase();

    flattenedProducts.forEach((prod: any) => {
      // Get available inventory items for this product
      const availableItems = inventory.filter((item: any) => {
        const itemProductId = String(item.product_id || item.productId);
        const prodId = String(prod.id);
        return itemProductId === prodId && item.status === 'available';
      });

      if (availableItems.length === 0) return;

      // Check if product name matches
      const productName = (prod.name || '').toLowerCase();
      const productSku = (prod.sku || '').toLowerCase();
      
      if (productName.includes(queryLower) || productSku.includes(queryLower)) {
        // Group by batch
        const groups: { [key: string]: { batchId: any; price: number; count: number } } = {};

        availableItems.forEach((item: any) => {
          const bid = item.batch_id || item.batchId || 'default';
          const price = item.selling_price || item.sellingPrice || 0;
          
          if (!groups[bid]) {
            groups[bid] = {
              batchId: bid,
              price: price,
              count: 0
            };
          }
          groups[bid].count++;
        });

        Object.values(groups).forEach((group) => {
          results.push({
            ...prod,
            batchId: group.batchId,
            attributes: { 
              ...prod.attributes, 
              Price: group.price,
              mainImage: prod.attributes?.mainImage || ''
            },
            available: group.count
          });
        });
      }
    });
    
    return results;
  };

  const calculateAmount = (
    basePrice: number,
    qty: number,
    discountPercent: number,
    discountTk: number
  ) => {
    const baseAmount = basePrice * qty;
    const percentDiscount = (baseAmount * discountPercent) / 100;
    const totalDiscount = percentDiscount + discountTk;
    const finalAmount = baseAmount - totalDiscount;
    
    return {
      baseAmount,
      percentDiscount,
      totalDiscount,
      finalAmount: Math.max(0, finalAmount)
    };
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/products');
        if (response.data.success) {
          setAllProducts(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    
    const fetchInventory = async () => {
      try {
        const response = await axios.get('/inventory/global');
        if (response.data.success) {
          setInventory(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching inventory:', error);
      }
    };

    const fetchStores = async () => {
      try {
        const response = await axios.get('/stores', {
          params: { is_active: true }
        });
        
        console.log('Store API response:', response);
        
        let storesData = [];
        
        // Handle different response structures
        if (response.data) {
          if (response.data.success && response.data.data) {
            // Structure: { success: true, data: [...] }
            if (Array.isArray(response.data.data)) {
              storesData = response.data.data;
            } else if (response.data.data.data && Array.isArray(response.data.data.data)) {
              // Structure: { success: true, data: { data: [...] } }
              storesData = response.data.data.data;
            }
          } else if (Array.isArray(response.data)) {
            // Direct array response
            storesData = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // Structure: { data: [...] }
            storesData = response.data.data;
          }
        }
        
        console.log('Extracted stores:', storesData);
        
        const storesArray = Array.isArray(storesData) ? storesData : [];
        setStores(storesArray);
        
        if (storesArray.length > 0) {
          setSelectedStore(String(storesArray[0].id));
        } else {
          showToast('No active stores found', 'error');
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
        showToast('Failed to load stores', 'error');
        setStores([]);
      }
    };
    
    fetchProducts();
    fetchInventory();
    fetchStores();
  }, []);
  
  useEffect(() => {
    if (isInternational) return;
    
    const fetchDivisions = async () => {
      try {
        const res = await fetch('https://bdapi.vercel.app/api/v.1/division');
        const data = await res.json();
        setDivisions(data.data);
      } catch (err) {
        console.error('Error fetching divisions:', err);
      }
    };
    fetchDivisions();
  }, [isInternational]);
  
  useEffect(() => {
    if (!division || isInternational) return;

    const selectedDivision = divisions.find((d) => d.name === division);
    if (!selectedDivision) return;

    const fetchDistricts = async () => {
      try {
        const res = await fetch(`https://bdapi.vercel.app/api/v.1/district/${selectedDivision.id}`);
        const data = await res.json();
        setDistricts(data.data);
        setUpazillas([]);
      } catch (err) {
        console.error('Error fetching districts:', err);
      }
    };

    fetchDistricts();
  }, [division, divisions, isInternational]);
  
  useEffect(() => {
    if (!district || isInternational) return;

    const selectedDistrict = districts.find((d) => d.name === district);
    if (!selectedDistrict) return;

    const fetchUpazillas = async () => {
      try {
        const res = await fetch(`https://bdapi.vercel.app/api/v.1/upazilla/${selectedDistrict.id}`);
        const data = await res.json();
        setUpazillas(data.data);
      } catch (err) {
        console.error('Error fetching upazillas:', err);
      }
    };

    fetchUpazillas();
  }, [district, districts, isInternational]);

  const getAvailableInventory = (productId: number | string, batchId?: number | string) => {
    return inventory.filter(item => {
      const itemProductId = String(item.product_id || item.productId);
      const searchProductId = String(productId);
      const matchesProduct = itemProductId === searchProductId && item.status === 'available';
      if (batchId !== undefined) {
        const itemBatchId = item.batch_id || item.batchId;
        return matchesProduct && String(itemBatchId) === String(batchId);
      }
      return matchesProduct;
    }).length;
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // Safety check - ensure we have valid data
    if (!Array.isArray(inventory)) {
      console.warn('Invalid inventory data for search:', inventory);
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        // Use the advanced search API
        const response = await axios.post('/products/advanced-search', {
          query: searchQuery,
          enable_fuzzy: true,
          fuzzy_threshold: 60,
          search_fields: ['name', 'sku', 'description', 'category', 'custom_fields'],
          per_page: 50
        });

        console.log('Search API response:', response);

        if (response.data.success) {
          const products = response.data.data?.items || [];
          const results: any[] = [];

          // Process each product and match with inventory
          products.forEach((prod: any) => {
            // Get available inventory items for this product
            const availableItems = inventory.filter((item: any) => {
              const itemProductId = String(item.product_id || item.productId);
              const prodId = String(prod.id);
              return itemProductId === prodId && item.status === 'available';
            });

            if (availableItems.length === 0) return;

            // Group by batch
            const groups: { [key: string]: { batchId: any; price: number; count: number } } = {};

            availableItems.forEach((item: any) => {
              const bid = item.batch_id || item.batchId || 'default';
              const price = item.selling_price || item.sellingPrice || 0;
              
              if (!groups[bid]) {
                groups[bid] = {
                  batchId: bid,
                  price: price,
                  count: 0
                };
              }
              groups[bid].count++;
            });

            // Add result for each batch
            Object.values(groups).forEach((group) => {
              // Get primary image
              const primaryImage = prod.images?.find((img: any) => img.is_primary) || prod.images?.[0];
              const imageUrl = primaryImage?.image_url || 
                             primaryImage?.url || 
                             prod.attributes?.main_image || 
                             prod.attributes?.mainImage || 
                             '';

              results.push({
                id: prod.id,
                name: prod.name,
                sku: prod.sku,
                batchId: group.batchId,
                attributes: { 
                  Price: group.price,
                  mainImage: imageUrl,
                  ...prod.attributes
                },
                available: group.count,
                relevance_score: prod.relevance_score || 0,
                search_stage: prod.search_stage || 'api'
              });
            });
          });

          console.log('Processed search results:', results);
          setSearchResults(results);
        } else {
          console.warn('Search API returned unsuccessful response');
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search API error:', error);
        
        // Fallback to local search if API fails
        console.log('Falling back to local search...');
        const localResults = performLocalSearch(searchQuery);
        setSearchResults(localResults);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, inventory]);

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setSearchQuery('');
    setSearchResults([]);
    setQuantity('1');
    setDiscountPercent('');
    setDiscountTk('');
    setAmount('0.00');
  };

  useEffect(() => {
    if (selectedProduct && quantity) {
      const price = parseFloat(selectedProduct.attributes.Price);
      const qty = parseFloat(quantity) || 0;
      const discPer = parseFloat(discountPercent) || 0;
      const discTk = parseFloat(discountTk) || 0;
      
      const { finalAmount } = calculateAmount(price, qty, discPer, discTk);
      setAmount(finalAmount.toFixed(2));
    } else {
      setAmount('0.00');
    }
  }, [selectedProduct, quantity, discountPercent, discountTk]);

  const addDefectiveToCart = () => {
    if (!selectedProduct || !selectedProduct.isDefective) {
      alert('No defective product selected');
      return;
    }

    const price = parseFloat(selectedProduct.attributes.Price);
    
    const newItem: CartProduct = {
      id: Date.now(),
      product_id: selectedProduct.id,
      productName: selectedProduct.name,
      barcode: selectedProduct.barcode,
      quantity: 1,
      unit_price: price,
      discount_amount: 0,
      amount: price,
      isDefective: true,
      defectId: selectedProduct.defectId
    };
    
    setCart([...cart, newItem]);
    alert('Defective product added to cart');
    
    setSelectedProduct(null);
    setDefectiveProduct(null);
    setQuantity('');
    setAmount('0.00');
    sessionStorage.removeItem('defectItem');
  };

  const addToCart = () => {
    if (selectedProduct && selectedProduct.isDefective) {
      return addDefectiveToCart();
    }

    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) {
      alert('Please select a product and enter a valid quantity');
      return;
    }

    const availableQty = getAvailableInventory(selectedProduct.id, selectedProduct.batchId);
    const requestedQty = parseInt(quantity);
    
    const existingItem = cart.find(
      item => String(item.product_id) === String(selectedProduct.id) && item.batch_id === selectedProduct.batchId
    );
    const cartQty = existingItem ? existingItem.quantity : 0;
    
    if (cartQty + requestedQty > availableQty) {
      alert(`Only ${availableQty} units available. You already have ${cartQty} in cart.`);
      return;
    }

    const price = parseFloat(selectedProduct.attributes.Price);
    const qty = parseFloat(quantity);
    const discPer = parseFloat(discountPercent) || 0;
    const discTk = parseFloat(discountTk) || 0;
    
    const { finalAmount, totalDiscount } = calculateAmount(price, qty, discPer, discTk);
    
    const existingItemIndex = cart.findIndex(
      item => String(item.product_id) === String(selectedProduct.id) && 
      String(item.batch_id) === String(selectedProduct.batchId) && 
      item.unit_price === price
    );
    
    if (existingItemIndex !== -1) {
      const updatedCart = [...cart];
      const existingItem = updatedCart[existingItemIndex];
      const newQty = existingItem.quantity + qty;
      const { finalAmount: newAmount } = calculateAmount(price, newQty, discPer, discTk);
      
      updatedCart[existingItemIndex] = {
        ...existingItem,
        quantity: newQty,
        discount_amount: existingItem.discount_amount + totalDiscount,
        amount: newAmount
      };
      
      setCart(updatedCart);
    } else {
      // Find barcode from inventory
      const inventoryItem = inventory.find(i => {
        const iProdId = String(i.product_id || i.productId);
        const iBatchId = String(i.batch_id || i.batchId);
        return iProdId === String(selectedProduct.id) && iBatchId === String(selectedProduct.batchId);
      });
      
      const newItem: CartProduct = {
        id: Date.now(),
        product_id: selectedProduct.id,
        batch_id: selectedProduct.batchId,
        productName: selectedProduct.name,
        barcode: inventoryItem?.barcode,
        quantity: qty,
        unit_price: price,
        discount_amount: totalDiscount,
        amount: finalAmount
      };
      
      setCart([...cart, newItem]);
    }
    
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
        alert('Please fill in international delivery address (Country and City are required)');
        return;
      }
    } else {
      if (!division || !district || !city) {
        alert('Please fill in delivery address (Division, District, and Upazilla are required)');
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
        notes: `Social Commerce Order. ${socialId ? `Social ID: ${socialId}. ` : ''}${isInternational ? 'International' : 'Domestic'} delivery.`
      };
      
      sessionStorage.setItem('pendingOrder', JSON.stringify({
        ...orderData,
        salesBy,
        date,
        isInternational,
        deliveryAddress: isInternational ? {
          country,
          state,
          city: internationalCity,
          address: deliveryAddress,
          postalCode: internationalPostalCode
        } : {
          division,
          district,
          city,
          zone,
          area,
          address: deliveryAddress,
          postalCode
        },
        subtotal
      }));
      
      window.location.href = '/social-commerce/amount-details';
    } catch (error) {
      console.error('Error processing order:', error);
      alert('Failed to process order. Please try again.');
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
                    {Array.isArray(stores) && stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
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
                          <input
                            type="text"
                            placeholder="Enter Country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">State/Province</label>
                          <input
                            type="text"
                            placeholder="Enter State or Province"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">City*</label>
                          <input
                            type="text"
                            placeholder="Enter City"
                            value={internationalCity}
                            onChange={(e) => setInternationalCity(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Postal/ZIP Code</label>
                          <input
                            type="text"
                            placeholder="Enter Postal/ZIP Code"
                            value={internationalPostalCode}
                            onChange={(e) => setInternationalPostalCode(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Street Address*</label>
                          <textarea
                            placeholder="Full Delivery Address"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Division*</label>
                            <select
                              value={division}
                              onChange={(e) => setDivision(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="">Select Division</option>
                              {divisions.map((d) => (
                                <option key={d.id} value={d.name}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">District*</label>
                            <select
                              value={district}
                              onChange={(e) => setDistrict(e.target.value)}
                              disabled={!division}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                            >
                              <option value="">Select District</option>
                              {districts.map((d) => (
                                <option key={d.id} value={d.name}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Upazilla*</label>
                            <select
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              disabled={!district}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                            >
                              <option value="">Select Upazilla</option>
                              {upazillas.map((u) => (
                                <option key={u.id} value={u.name}>
                                  {u.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Zone*</label>
                            <input
                              type="text"
                              placeholder="Search Zone..."
                              value={zone}
                              onChange={(e) => setZone(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Area (Optional)</label>
                          <input
                            type="text"
                            placeholder="Search Area..."
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Delivery Address</label>
                          <textarea
                            placeholder="Delivery Address"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
                          <input
                            type="text"
                            placeholder="e.g., 1212"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                  <div className={`bg-white dark:bg-gray-800 rounded-lg border p-4 md:p-5 ${selectedProduct && selectedProduct.isDefective ? 'border-orange-300 dark:border-orange-700' : 'border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Search Product</h3>
                      {selectedProduct && selectedProduct.isDefective && (
                        <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded">Defective Product</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        placeholder={isLoadingData ? "Loading products..." : "Search product name..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={isLoadingData}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button 
                        disabled={isLoadingData}
                        className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Search size={18} />
                      </button>
                    </div>

                    {isLoadingData && (
                      <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                        Loading products and inventory...
                      </div>
                    )}

                    {!isLoadingData && searchQuery && searchResults.length === 0 && (
                      <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                        No products found matching "{searchQuery}"
                      </div>
                    )}

                    {searchResults.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 md:max-h-80 overflow-y-auto mb-4 p-1">
                        {searchResults.map((product) => {
                          const availableQty = product.available;
                          return (
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
                              <p className="text-xs text-gray-900 dark:text-white font-medium truncate">{product.name} (Batch {product.batchId})</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{product.attributes.Price} Tk</p>
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">Available: {availableQty}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedProduct && (
                      <div className={`mt-4 p-3 border rounded mb-4 ${
                        selectedProduct.isDefective 
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700' 
                          : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Selected Product</span>
                            {selectedProduct.isDefective && (
                              <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                                Defective - No Stock
                              </span>
                            )}
                          </div>
                          <button onClick={() => {
                            setSelectedProduct(null);
                            setQuantity('');
                            setDiscountPercent('');
                            setDiscountTk('');
                            setAmount('0.00');
                            if (defectiveProduct) {
                              setDefectiveProduct(null);
                              sessionStorage.removeItem('defectItem');
                            }
                          }} className="text-red-600 hover:text-red-700">
                            <X size={16} />
                          </button>
                        </div>
                        <div className="flex gap-3">
                          {selectedProduct.attributes.mainImage && (
                            <img 
                              src={selectedProduct.attributes.mainImage} 
                              alt={selectedProduct.name} 
                              className="w-16 h-16 object-cover rounded flex-shrink-0" 
                            />
                          )}
                          <div className="min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              selectedProduct.isDefective 
                                ? 'text-orange-900 dark:text-orange-200' 
                                : 'text-gray-900 dark:text-white'
                            }`}>{selectedProduct.name}</p>
                            {!selectedProduct.isDefective && selectedProduct.batchId && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">(Batch {selectedProduct.batchId})</p>
                            )}
                            <p className={`text-sm ${
                              selectedProduct.isDefective 
                                ? 'text-orange-600 dark:text-orange-400' 
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>Price: {selectedProduct.attributes.Price} Tk</p>
                            {!selectedProduct.isDefective ? (
                              <p className="text-sm text-green-600 dark:text-green-400">
                                Available: {getAvailableInventory(selectedProduct.id, selectedProduct.batchId)} units
                              </p>
                            ) : (
                              <p className="text-sm text-orange-600 dark:text-orange-400">
                                Barcode: {selectedProduct.barcode}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                          Quantity {selectedProduct?.isDefective && <span className="text-orange-600">(Fixed: 1)</span>}
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const currentQty = parseInt(quantity) || 0;
                              if (currentQty > 1) {
                                setQuantity(String(currentQty - 1));
                              }
                            }}
                            disabled={!selectedProduct || !quantity || parseInt(quantity) <= 1 || selectedProduct?.isDefective}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-lg"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            placeholder="0"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            disabled={!selectedProduct || selectedProduct?.isDefective}
                            readOnly={selectedProduct?.isDefective}
                            min="1"
                            className={`flex-1 px-3 py-2 text-sm text-center border rounded disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              selectedProduct?.isDefective
                                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600 text-orange-900 dark:text-orange-200 font-medium'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const currentQty = parseInt(quantity) || 0;
                              setQuantity(String(currentQty + 1));
                            }}
                            disabled={!selectedProduct || selectedProduct?.isDefective}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Discount %</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={discountPercent}
                            onChange={(e) => setDiscountPercent(e.target.value)}
                            disabled={!selectedProduct || selectedProduct?.isDefective}
                            min="0"
                            className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Discount Tk</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={discountTk}
                            onChange={(e) => setDiscountTk(e.target.value)}
                            disabled={!selectedProduct || selectedProduct?.isDefective}
                            min="0"
                            className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                        className={`w-full px-4 py-2.5 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedProduct?.isDefective
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : 'bg-black hover:bg-gray-800'
                        }`}
                      >
                        {selectedProduct?.isDefective ? 'Add Defective Product to Cart' : 'Add to Cart'}
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
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Product</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Qty</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Price</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Amount</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cart.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                No products in cart
                              </td>
                            </tr>
                          ) : (
                            cart.map((item) => (
                              <tr key={item.id} className={`border-b border-gray-200 dark:border-gray-700 ${item.isDefective ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}>
                                <td className="px-3 py-2 text-gray-900 dark:text-white">
                                  <div className="max-w-[120px]">
                                    <p className="truncate">{item.productName}</p>
                                    {item.batch_id && <p className="text-xs text-gray-500">(Batch {item.batch_id})</p>}
                                    {item.isDefective && (
                                      <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                                        Defective
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">{item.quantity}</td>
                                <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">{item.unit_price.toFixed(2)}</td>
                                <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">{item.amount.toFixed(2)}</td>
                                <td className="px-3 py-2">
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-red-600 hover:text-red-700 text-xs font-medium whitespace-nowrap"
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
