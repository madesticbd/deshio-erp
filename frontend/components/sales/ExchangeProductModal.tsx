import { useState, useEffect } from 'react';
import { X, Search, ArrowRightLeft, Calculator, ChevronDown, Loader2, Package, Scan } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import productImageService from '@/services/productImageService';
import batchService, { Batch } from '@/services/batchService';
import productService from '@/services/productService';
import BarcodeScanner, { ScannedProduct } from '@/components/pos/BarcodeScanner';

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  batch_id: number;
  batch_number?: string;
  barcode_id?: number;
  barcode?: string;
  quantity: number;
  unit_price: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
  total_price: string;
}

interface Order {
  id: number;
  order_number: string;
  customer?: {
    id: number;
    name: string;
    phone: string;
  };
  store: {
    id: number;
    name: string;
  };
  items: OrderItem[];
  subtotal_amount: string;
  tax_amount: string;
  total_amount: string;
  paid_amount: string;
}

interface ExchangeProductModalProps {
  order: Order;
  onClose: () => void;
  onExchange: (exchangeData: {
    removedProducts: Array<{
      order_item_id: number;
      quantity: number;
      product_barcode_id?: number;
    }>;
    replacementProducts: Array<{
      product_id: number;
      batch_id: number;
      quantity: number;
      unit_price: number;
    }>;
    paymentRefund: {
      type: 'payment' | 'refund' | 'none';
      cash: number;
      card: number;
      bkash: number;
      nagad: number;
      total: number;
    };
  }) => Promise<void>;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  batches?: Batch[];
}

interface ReplacementProduct {
  id: number | string;
  product_id: number;
  batch_id: number;
  name: string;
  batchNumber?: string;
  mainImage?: string;
  price: number;
  quantity: number;
  amount: number;
  available: number;
  barcode?: string;
}

export default function ExchangeProductModal({ order, onClose, onExchange }: ExchangeProductModalProps) {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [exchangeQuantities, setExchangeQuantities] = useState<{ [key: number]: number }>({});
  const [replacementProducts, setReplacementProducts] = useState<ReplacementProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Entry mode: 'search' | 'barcode' | 'manual'
  const [entryMode, setEntryMode] = useState<'search' | 'barcode' | 'manual'>('barcode');

  // Search mode states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedReplacement, setSelectedReplacement] = useState<any>(null);
  const [replacementQuantity, setReplacementQuantity] = useState('1');
  const [isSearching, setIsSearching] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  // Manual entry states
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [manualPrice, setManualPrice] = useState(0);
  const [manualQuantity, setManualQuantity] = useState(1);
  const [manualDiscount, setManualDiscount] = useState(0);

  const [isLoadingData, setIsLoadingData] = useState(false);

  // Payment/Refund states
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [bkashAmount, setBkashAmount] = useState(0);
  const [nagadAmount, setNagadAmount] = useState(0);
  const [showNoteCounter, setShowNoteCounter] = useState(false);

  // Note counter states
  const [note1000, setNote1000] = useState(0);
  const [note500, setNote500] = useState(0);
  const [note200, setNote200] = useState(0);
  const [note100, setNote100] = useState(0);
  const [note50, setNote50] = useState(0);
  const [note20, setNote20] = useState(0);
  const [note10, setNote10] = useState(0);
  const [note5, setNote5] = useState(0);
  const [note2, setNote2] = useState(0);
  const [note1, setNote1] = useState(0);

  // Helper function to get image URL
  const getImageUrl = (imagePath: string | null | undefined): string => {
    if (!imagePath) return '/placeholder-image.jpg';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
    if (imagePath.startsWith('/storage')) return `${baseUrl}${imagePath}`;
    return `${baseUrl}/storage/product-images/${imagePath}`;
  };

  // Fetch primary image for a product
  const fetchPrimaryImage = async (productId: number): Promise<string> => {
    try {
      const images = await productImageService.getProductImages(productId);
      const primaryImage = images.find(img => img.is_primary && img.is_active);
      if (primaryImage) return getImageUrl(primaryImage.image_url || primaryImage.image_path);
      const firstActiveImage = images.find(img => img.is_active);
      if (firstActiveImage) return getImageUrl(firstActiveImage.image_url || firstActiveImage.image_path);
      return '/placeholder-image.jpg';
    } catch (error) {
      return '/placeholder-image.jpg';
    }
  };

  // Fetch products for search mode
  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get('/products', { params: { per_page: 1000 } });
      let productsData = [];
      
      if (response.data?.success && response.data?.data) {
        productsData = Array.isArray(response.data.data) ? response.data.data : 
                      Array.isArray(response.data.data.data) ? response.data.data.data : [];
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      }
      
      setAllProducts(productsData);
      console.log('✅ Loaded products:', productsData.length);
    } catch (error) {
      console.error('Error fetching products:', error);
      setAllProducts([]);
    }
  };

  // Fetch batches for the store
  const fetchBatchesForStore = async (storeId: number) => {
    try {
      setIsLoadingData(true);
      console.log('📦 Fetching batches for store:', storeId);
      
      try {
        const batchesData = await batchService.getAvailableBatches(storeId);
        if (batchesData && batchesData.length > 0) {
          const availableBatches = batchesData.filter(batch => batch.quantity > 0);
          setBatches(availableBatches);
          console.log('✅ Filtered available batches:', availableBatches.length);
          return;
        }
      } catch (err) {
        console.warn('⚠️ getAvailableBatches failed, trying getBatchesArray...', err);
      }
      
      try {
        const batchesData = await batchService.getBatchesArray({ 
          store_id: storeId,
          status: 'available'
        });
        if (batchesData && batchesData.length > 0) {
          const availableBatches = batchesData.filter(batch => batch.quantity > 0);
          setBatches(availableBatches);
          console.log('✅ Filtered available batches:', availableBatches.length);
          return;
        }
      } catch (err) {
        console.warn('⚠️ getBatchesArray failed, trying getBatchesByStore...', err);
      }
      
      try {
        const batchesData = await batchService.getBatchesByStore(storeId);
        if (batchesData && batchesData.length > 0) {
          const availableBatches = batchesData.filter(batch => batch.quantity > 0);
          setBatches(availableBatches);
          console.log('✅ Filtered available batches:', availableBatches.length);
          return;
        }
      } catch (err) {
        console.error('⚠️ All batch fetch methods failed', err);
      }
      
      setBatches([]);
      console.log('⚠️ No batches found for store:', storeId);
      
    } catch (error: any) {
      console.error('❌ Batch fetch error:', error);
      setBatches([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Fetch products with batches for manual mode
  const fetchProductsWithBatches = async () => {
    if (!order.store.id) return;

    try {
      const result = await productService.getAll({
        is_archived: false,
        per_page: 1000,
      });
      
      let productsList: Product[] = [];
      
      if (Array.isArray(result)) {
        productsList = result;
      } else if (result?.data) {
        productsList = Array.isArray(result.data) ? result.data : (result.data.data || []);
      }
      
      const productsWithBatches = await Promise.all(
        productsList.map(async (product: Product) => {
          try {
            const batchResponse = await batchService.getBatches({
              product_id: product.id,
              store_id: order.store.id,
              status: 'available',
              per_page: 100
            });
            
            const batches = batchResponse.success && batchResponse.data?.data 
              ? batchResponse.data.data.filter((batch: Batch) => batch.quantity > 0)
              : [];
            
            return { ...product, batches };
          } catch (error) {
            return { ...product, batches: [] };
          }
        })
      );
      
      setProducts(productsWithBatches);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  // Local search with batches
  const performLocalSearch = async (query: string): Promise<any[]> => {
    const results: any[] = [];
    const queryLower = query.toLowerCase().trim();

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
        const productBatches = batches.filter(batch => {
          const batchProductId = batch.product?.id || batch.product_id;
          return batchProductId === prod.id && batch.quantity > 0;
        });

        if (productBatches.length > 0) {
          const imageUrl = await fetchPrimaryImage(prod.id);

          for (const batch of productBatches) {
            results.push({
              id: prod.id,
              name: prod.name,
              sku: prod.sku,
              batchId: batch.id,
              batchNumber: batch.batch_number,
              mainImage: imageUrl,
              price: Number(String(batch.sell_price ?? "0").replace(/[^0-9.-]/g, "")),
              available: batch.quantity,
              relevance_score: relevanceScore,
              search_stage: 'local'
            });
          }
        }
      }
    }
    
    results.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    return results;
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      await fetchProducts();
      await fetchBatchesForStore(order.store.id);
      await fetchProductsWithBatches();
    };
    loadData();
  }, [order.store.id]);

  // Search products with debounce (for search mode)
  useEffect(() => {
    if (entryMode !== 'search' || !searchQuery.trim() || !Array.isArray(batches)) {
      setSearchResults([]);
      return;
    }
    
    if (batches.length === 0) return;

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await axiosInstance.post('/products/advanced-search', {
          query: searchQuery,
          is_archived: false,
          enable_fuzzy: true,
          fuzzy_threshold: 60,
          search_fields: ['name', 'sku', 'description', 'category'],
          per_page: 50
        });

        if (response.data?.success) {
          const products = response.data.data?.items || 
                          response.data.data?.data?.items ||
                          response.data.data || [];
          
          const results: any[] = [];

          for (const prod of products) {
            const productBatches = batches.filter(batch => {
              const batchProductId = batch.product?.id || batch.product_id;
              return batchProductId === prod.id && batch.quantity > 0;
            });

            if (productBatches.length > 0) {
              const imageUrl = await fetchPrimaryImage(prod.id);

              for (const batch of productBatches) {
                results.push({
                  id: prod.id,
                  name: prod.name,
                  sku: prod.sku,
                  batchId: batch.id,
                  batchNumber: batch.batch_number,
                  mainImage: imageUrl,
                  price: Number(String(batch.sell_price ?? "0").replace(/[^0-9.-]/g, "")),
                  available: batch.quantity,
                  relevance_score: prod.relevance_score || 0,
                  search_stage: prod.search_stage || 'api'
                });
              }
            }
          }

          results.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
          setSearchResults(results);
        } else {
          throw new Error('API search unsuccessful');
        }
      } catch (error: any) {
        console.warn('❌ API search failed, using local search');
        const localResults = await performLocalSearch(searchQuery);
        setSearchResults(localResults);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, batches, allProducts, entryMode]);

  // Handle barcode scanned
  const handleProductScanned = (scannedProduct: ScannedProduct) => {
    const newItem: ReplacementProduct = {
      id: Date.now() + Math.random(),
      product_id: scannedProduct.productId,
      batch_id: scannedProduct.batchId,
      name: scannedProduct.productName,
      batchNumber: scannedProduct.batchNumber,
      price: scannedProduct.price,
      quantity: 1,
      amount: scannedProduct.price,
      available: scannedProduct.availableQty,
      barcode: scannedProduct.barcode,
    };

    setReplacementProducts(prev => [...prev, newItem]);
  };

  // Handle manual product selection
  const handleProductSelect = (productName: string) => {
    setSelectedProduct(productName);
    const selectedProd = products.find(p => p.name === productName);
    
    if (selectedProd && selectedProd.batches && selectedProd.batches.length > 0) {
      const firstBatch = selectedProd.batches[0];
      setSelectedBatch(firstBatch);
      
      const priceString = String(firstBatch.sell_price).replace(/,/g, '');
      const price = parseFloat(priceString) || 0;
      setManualPrice(price);
    } else {
      setSelectedBatch(null);
      setManualPrice(0);
    }
  };

  // Add manual product to cart
  const addManualProductToCart = () => {
    if (!selectedProduct || !selectedBatch) {
      alert('Please select a product and batch');
      return;
    }

    if (manualPrice <= 0 || manualQuantity <= 0) {
      alert('Please enter valid price and quantity');
      return;
    }

    if (manualQuantity > selectedBatch.quantity) {
      alert(`Only ${selectedBatch.quantity} units available`);
      return;
    }

    const baseAmount = manualPrice * manualQuantity;
    const discountValue = manualDiscount;

    const newItem: ReplacementProduct = {
      id: Date.now() + Math.random(),
      product_id: selectedBatch.product.id,
      batch_id: selectedBatch.id,
      name: selectedProduct,
      batchNumber: selectedBatch.batch_number,
      price: manualPrice,
      quantity: manualQuantity,
      amount: baseAmount - discountValue,
      available: selectedBatch.quantity,
    };

    setReplacementProducts(prev => [...prev, newItem]);

    // Reset form
    setSelectedProduct('');
    setSelectedBatch(null);
    setManualPrice(0);
    setManualQuantity(1);
    setManualDiscount(0);
  };

  // Handle search product select
  const handleSearchProductSelect = (product: any) => {
    setSelectedReplacement(product);
    setReplacementQuantity('1');
  };

  // Add from search
  const handleAddFromSearch = () => {
    if (!selectedReplacement) {
      alert('Please select a product');
      return;
    }

    const qty = parseInt(replacementQuantity);
    if (isNaN(qty) || qty < 1) {
      alert('Please enter a valid quantity');
      return;
    }

    if (qty > selectedReplacement.available) {
      alert(`Only ${selectedReplacement.available} units available`);
      return;
    }

    const newItem: ReplacementProduct = {
      id: Date.now() + Math.random(),
      product_id: selectedReplacement.id,
      batch_id: selectedReplacement.batchId,
      name: selectedReplacement.name,
      batchNumber: selectedReplacement.batchNumber,
      mainImage: selectedReplacement.mainImage,
      price: selectedReplacement.price,
      quantity: qty,
      amount: selectedReplacement.price * qty,
      available: selectedReplacement.available,
    };

    setReplacementProducts(prev => [...prev, newItem]);

    setSelectedReplacement(null);
    setReplacementQuantity('1');
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleProductCheckbox = (itemId: number) => {
    setSelectedProducts(prev => {
      if (prev.includes(itemId)) {
        const newSelected = prev.filter(id => id !== itemId);
        const newQuantities = { ...exchangeQuantities };
        delete newQuantities[itemId];
        setExchangeQuantities(newQuantities);
        return newSelected;
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleQuantityChange = (itemId: number, qty: number, maxQty: number) => {
    if (qty < 1 || qty > maxQty) return;
    setExchangeQuantities(prev => ({ ...prev, [itemId]: qty }));
  };

  const handleRemoveReplacement = (id: number | string) => {
    setReplacementProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateReplacementQty = (id: number | string, newQty: number) => {
    if (newQty < 1) {
      handleRemoveReplacement(id);
      return;
    }

    setReplacementProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          if (newQty > p.available) {
            alert(`Only ${p.available} units available`);
            return p;
          }
          return {
            ...p,
            quantity: newQty,
            amount: p.price * newQty,
          };
        }
        return p;
      })
    );
  };

  const calculateTotals = () => {
    const parsePrice = (value: string) => parseFloat(String(value).replace(/[^0-9.-]/g, ''));

    const originalAmount = selectedProducts.reduce((sum, itemId) => {
      const item = order.items.find(i => i.id === itemId);
      if (!item) return sum;
      const qty = exchangeQuantities[itemId] || 0;
      const price = parsePrice(item.unit_price);
      return sum + (price * qty);
    }, 0);

    const newSubtotal = replacementProducts.reduce((sum, p) => sum + p.amount, 0);

    const orderSubtotal = parsePrice(order.subtotal_amount);
    const orderTotal = parsePrice(order.total_amount);
    const orderVat = orderTotal - orderSubtotal;
    const vatRate = orderSubtotal > 0 ? (orderVat / orderSubtotal) : 0;

    const vatAmount = newSubtotal * vatRate;
    const totalNewAmount = newSubtotal + vatAmount;
    const difference = totalNewAmount - originalAmount;

    return {
      originalAmount,
      newSubtotal,
      vatRate: vatRate * 100,
      vatAmount,
      totalNewAmount,
      difference,
    };
  };

  const totals = calculateTotals();

  const cashFromNotes = 
    (note1000 * 1000) + (note500 * 500) + (note200 * 200) + 
    (note100 * 100) + (note50 * 50) + (note20 * 20) + 
    (note10 * 10) + (note5 * 5) + (note2 * 2) + (note1 * 1);

  const effectiveCash = cashFromNotes > 0 ? cashFromNotes : cashAmount;
  const totalPaymentRefund = effectiveCash + cardAmount + bkashAmount + nagadAmount;
  const remainingBalance = Math.abs(totals.difference) - totalPaymentRefund;

  const handleProcessExchange = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product to exchange');
      return;
    }

    if (replacementProducts.length === 0) {
      alert('Please add replacement products');
      return;
    }

    const hasInvalidQuantities = selectedProducts.some(id => {
      const qty = exchangeQuantities[id];
      return !qty || qty <= 0;
    });

    if (hasInvalidQuantities) {
      alert('Please set valid quantities for all selected products');
      return;
    }

    let confirmMessage = `Process exchange for order ${order.order_number}?\n\n`;
    confirmMessage += `Exchanging ${selectedProducts.length} item(s)\n`;
    confirmMessage += `Adding ${replacementProducts.length} replacement item(s)\n\n`;

    if (totals.difference > 0) {
      confirmMessage += `Customer owes: ৳${totals.difference.toLocaleString()}\n`;
      confirmMessage += `Collected: ৳${totalPaymentRefund.toLocaleString()}\n`;
      if (remainingBalance > 0) {
        confirmMessage += `Remaining: ৳${remainingBalance.toLocaleString()} (can pay later)`;
      } else {
        confirmMessage += `✓ Fully paid`;
      }
    } else if (totals.difference < 0) {
      const refundRequired = Math.abs(totals.difference);
      confirmMessage += `Refund required: ৳${refundRequired.toLocaleString()}\n`;
      confirmMessage += `Refunded: ৳${totalPaymentRefund.toLocaleString()}\n`;
      if (remainingBalance > 0) {
        confirmMessage += `Remaining: ৳${remainingBalance.toLocaleString()} (can refund later)`;
      } else {
        confirmMessage += `✓ Fully refunded`;
      }
    } else {
      confirmMessage += 'No payment difference - even exchange';
    }

    if (!confirm(confirmMessage)) return;

    setIsProcessing(true);
    try {
      const exchangeData = {
        removedProducts: selectedProducts.map(itemId => {
          const item = order.items.find(i => i.id === itemId);
          return {
            order_item_id: itemId,
            quantity: exchangeQuantities[itemId],
            product_barcode_id: item?.barcode_id,
          };
        }),
        replacementProducts: replacementProducts.map(p => ({
          product_id: p.product_id,
          batch_id: p.batch_id,
          quantity: p.quantity,
          unit_price: p.price,
        })),
        paymentRefund: {
          type: (totals.difference > 0 ? 'payment' : totals.difference < 0 ? 'refund' : 'none') as 'payment' | 'refund' | 'none',
          cash: effectiveCash,
          card: cardAmount,
          bkash: bkashAmount,
          nagad: nagadAmount,
          total: totalPaymentRefund,
        },
      };

      await onExchange(exchangeData);
    } catch (error: any) {
      console.error('Exchange failed:', error);
      alert(error.message || 'Failed to process exchange');
    } finally {
      setIsProcessing(false);
    }
  };

  const NoteInput = ({ value, state, setState }: any) => (
    <div>
      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">৳{value}</label>
      <input
        type="number"
        min="0"
        value={state}
        onChange={(e) => setState(Number(e.target.value))}
        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-5 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Exchange Products</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Order #{order.order_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Select Items to Exchange */}
            <div className="col-span-2 space-y-6">
              {/* Customer Info */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {order.customer?.name || 'Walk-in Customer'}
                    </p>
                    {order.customer?.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{order.customer.phone}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Order Total</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ৳{parseFloat(order.total_amount.replace(/[^0-9.-]/g, '')).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Select Items to Exchange */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">
                  Select Items to Exchange
                </h3>

                {order.items && order.items.length > 0 ? (
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(item.id)}
                            onChange={() => handleProductCheckbox(item.id)}
                            className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {item.product_name}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                    SKU: {item.product_sku}
                                  </span>
                                  {item.batch_number && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Batch: {item.batch_number}
                                    </span>
                                  )}
                                  {item.barcode && (
                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded font-mono">
                                      🏷️ {item.barcode}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="font-bold text-gray-900 dark:text-white">
                                ৳{(parseFloat(item.unit_price.replace(/[^0-9.-]/g, '')) * item.quantity).toFixed(2)}
                              </p>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                              Price: ৳{parseFloat(item.unit_price.replace(/[^0-9.-]/g, '')).toFixed(2)} × Qty: {item.quantity}
                            </p>

                            {selectedProducts.includes(item.id) && (
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                      Available Qty
                                    </label>
                                    <input
                                      type="number"
                                      value={item.quantity}
                                      readOnly
                                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                      Exchange Qty *
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max={item.quantity}
                                      value={exchangeQuantities[item.id] || ''}
                                      onChange={(e) =>
                                        handleQuantityChange(item.id, parseInt(e.target.value) || 0, item.quantity)
                                      }
                                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                      placeholder="Enter qty"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No items in this order
                  </div>
                )}
              </div>

              {/* Replacement Products Entry */}
              {selectedProducts.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">
                    Add Replacement Products
                  </h3>

                  {/* Entry Mode Selector */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setEntryMode('barcode')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                        entryMode === 'barcode'
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <Scan className="w-4 h-4" />
                      <span className="font-medium text-sm">Barcode</span>
                    </button>
                    <button
                      onClick={() => setEntryMode('manual')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                        entryMode === 'manual'
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                      <span className="font-medium text-sm">Manual</span>
                    </button>
                    <button
                      onClick={() => setEntryMode('search')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                        entryMode === 'search'
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <Search className="w-4 h-4" />
                      <span className="font-medium text-sm">Search</span>
                    </button>
                  </div>

                  {/* Barcode Scanner Mode */}
                  {entryMode === 'barcode' && (
                    <BarcodeScanner
                      isEnabled={true}
                      selectedOutlet={String(order.store.id)}
                      onProductScanned={handleProductScanned}
                      onError={(msg) => alert(msg)}
                    />
                  )}

                  {/* Manual Entry Mode */}
                  {entryMode === 'manual' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Product
                        </label>
                        <select
                          value={selectedProduct}
                          onChange={(e) => handleProductSelect(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Select Product</option>
                          {products.filter(p => p.batches && p.batches.length > 0).map((prod) => (
                            <option key={prod.id} value={prod.name}>
                              {prod.name} ({prod.batches?.length || 0} batches)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Price
                          </label>
                          <input
                            type="number"
                            value={manualPrice}
                            onChange={(e) => setManualPrice(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={manualQuantity}
                            onChange={(e) => setManualQuantity(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <button
                        onClick={addManualProductToCart}
                        disabled={!selectedProduct}
                        className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        Add to Replacements
                      </button>
                    </div>
                  )}

                  {/* Search Mode */}
                  {entryMode === 'search' && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder={isLoadingData ? "Loading..." : "Search by product name, SKU..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled={isLoadingData}
                            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                          />
                        </div>
                        {isSearching && (
                          <div className="flex items-center justify-center px-4">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          </div>
                        )}
                      </div>

                      {/* Search Results */}
                      {searchResults.length > 0 && !selectedReplacement && (
                        <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                          {searchResults.map((product, index) => (
                            <div
                              key={`${product.id}-${product.batchId}-${index}`}
                              onClick={() => handleSearchProductSelect(product)}
                              className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-2 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
                            >
                              <img
                                src={product.mainImage}
                                alt={product.name}
                                className="w-full h-20 object-cover rounded mb-2"
                              />
                              <p className="text-xs text-gray-900 dark:text-white font-medium truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">৳{product.price}</p>
                              <p className="text-xs text-green-600 dark:text-green-400">Stock: {product.available}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Selected Product */}
                      {selectedReplacement && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                              ✓ Selected Product
                            </span>
                            <button
                              onClick={() => {
                                setSelectedReplacement(null);
                                setReplacementQuantity('1');
                              }}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <X size={18} />
                            </button>
                          </div>

                          <div className="flex gap-3 mb-3">
                            <img
                              src={selectedReplacement.mainImage}
                              alt={selectedReplacement.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {selectedReplacement.name}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Price: ৳{selectedReplacement.price}
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-400">
                                Available: {selectedReplacement.available}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Quantity
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={selectedReplacement.available}
                                value={replacementQuantity}
                                onChange={(e) => setReplacementQuantity(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                              />
                            </div>

                            <button
                              onClick={handleAddFromSearch}
                              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                            >
                              Add to Replacements
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Replacement Products List */}
                  {replacementProducts.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Replacement Products ({replacementProducts.length})
                      </h4>
                      {replacementProducts.map((product) => (
                        <div
                          key={product.id}
                          className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-3">
                            {product.mainImage && (
                              <img
                                src={product.mainImage}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                ৳{product.price.toLocaleString()} × {product.quantity}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateReplacementQty(product.id, product.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                              >
                                −
                              </button>
                              <span className="w-8 text-center text-sm font-semibold">{product.quantity}</span>
                              <button
                                onClick={() => handleUpdateReplacementQty(product.id, product.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                              >
                                +
                              </button>
                              <p className="font-bold text-gray-900 dark:text-white min-w-[80px] text-right">
                                ৳{product.amount.toLocaleString()}
                              </p>
                              <button
                                onClick={() => handleRemoveReplacement(product.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Summary & Payment */}
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Summary</h3>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Items to exchange:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedProducts.length}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Replacement items:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {replacementProducts.length}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-300 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Original Amount:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ৳{totals.originalAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">New Subtotal:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ৳{totals.newSubtotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">VAT ({totals.vatRate.toFixed(1)}%):</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ৳{totals.vatAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-gray-600 dark:text-gray-400">New Total:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ৳{totals.totalNewAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border-2 border-gray-300 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900 dark:text-white">Difference:</span>
                        <span
                          className={`font-bold text-lg ${
                            totals.difference > 0
                              ? 'text-orange-600 dark:text-orange-400'
                              : totals.difference < 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {totals.difference > 0 ? '+' : ''}৳{totals.difference.toLocaleString()}
                        </span>
                      </div>
                      {totals.difference > 0 && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          Customer needs to pay additional
                        </p>
                      )}
                      {totals.difference < 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">Refund to customer</p>
                      )}
                      {totals.difference === 0 && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Even exchange</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment/Refund Section */}
              {totals.difference !== 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {totals.difference > 0 ? 'Collect Payment' : 'Process Refund'}
                    </h3>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Cash with Note Counter */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Cash {totals.difference > 0 ? 'Payment' : 'Refund'}
                        </label>
                        <button
                          onClick={() => setShowNoteCounter(!showNoteCounter)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        >
                          <Calculator className="w-3 h-3" />
                          {showNoteCounter ? 'Hide' : 'Count Notes'}
                        </button>
                      </div>

                      {showNoteCounter ? (
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <NoteInput value={1000} state={note1000} setState={setNote1000} />
                            <NoteInput value={500} state={note500} setState={setNote500} />
                            <NoteInput value={200} state={note200} setState={setNote200} />
                            <NoteInput value={100} state={note100} setState={setNote100} />
                            <NoteInput value={50} state={note50} setState={setNote50} />
                            <NoteInput value={20} state={note20} setState={setNote20} />
                            <NoteInput value={10} state={note10} setState={setNote10} />
                            <NoteInput value={5} state={note5} setState={setNote5} />
                            <NoteInput value={2} state={note2} setState={setNote2} />
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-800">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Total Cash:</span>
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                              ৳{cashFromNotes.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="number"
                            min="0"
                            value={cashFromNotes > 0 ? cashFromNotes : cashAmount}
                            onChange={(e) => {
                              setCashAmount(Number(e.target.value));
                              setNote1000(0); setNote500(0); setNote200(0); setNote100(0);
                              setNote50(0); setNote20(0); setNote10(0); setNote5(0);
                              setNote2(0); setNote1(0);
                            }}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Other Payment Methods */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Card</label>
                        <input
                          type="number"
                          min="0"
                          value={cardAmount}
                          onChange={(e) => setCardAmount(Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Bkash</label>
                        <input
                          type="number"
                          min="0"
                          value={bkashAmount}
                          onChange={(e) => setBkashAmount(Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Nagad</label>
                        <input
                          type="number"
                          min="0"
                          value={nagadAmount}
                          onChange={(e) => setNagadAmount(Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300">
                          Total {totals.difference > 0 ? 'Collected' : 'Refunded'}
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          ৳{totalPaymentRefund.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300">
                          {totals.difference > 0 ? 'Amount Due' : 'Refund Required'}
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          ৳{Math.abs(totals.difference).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className="font-semibold text-gray-900 dark:text-white">Remaining</span>
                        <span
                          className={`font-bold ${
                            remainingBalance > 0
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          ৳{remainingBalance.toFixed(2)}
                        </span>
                      </div>
                      {remainingBalance > 0 && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          Can {totals.difference > 0 ? 'pay' : 'refund'} later
                        </p>
                      )}
                      {remainingBalance <= 0 && totalPaymentRefund > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          ✓ Fully {totals.difference > 0 ? 'paid' : 'refunded'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessExchange}
                  disabled={isProcessing || selectedProducts.length === 0 || replacementProducts.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-5 h-5" />
                      Process Exchange
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}