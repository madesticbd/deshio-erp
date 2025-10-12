'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import GalleryGrid from '@/components/GalleryGrid';
import Lightbox from '@/components/Lightbox';

interface Product {
  id: number | string;
  name: string;
  attributes: {
    mainImage?: string;
    Image?: string | string[];
    [key: string]: any;
  };
  variations?: {
    id: string | number;
    attributes: Record<string, any>;
  }[];
}

interface InventoryItem {
  productId: number | string; // Can be main product ID or variation ID
  sellingPrice: number;
  status: string;
  barcode: string;
}

interface ProductWithStock {
  id: number | string;
  name: string;
  stockCount: number;
  sellingPrice: number;
  images: string[];
  isVariation?: boolean;
  parentProductId?: number | string;
}

export default function GalleryPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productsWithStock, setProductsWithStock] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxProductName, setLightboxProductName] = useState('');
  const [allLightboxImages, setAllLightboxImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProductsWithStock();
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const fetchProductsWithStock = async () => {
    try {
      setLoading(true);

      const productsRes = await fetch('/api/products');
      if (!productsRes.ok) throw new Error('Failed to fetch products');
      const products: Product[] = await productsRes.json();

      const inventoryRes = await fetch('/api/inventory');
      if (!inventoryRes.ok) throw new Error('Failed to fetch inventory');
      const inventory: InventoryItem[] = await inventoryRes.json();

      const availableInventory = inventory.filter((item) => item.status === 'available');
      
      // Map to track stock for both main products and variations
      const stockMap = new Map<string | number, { count: number; sellingPrice: number }>();

      availableInventory.forEach((item) => {
        const key = String(item.productId);
        if (stockMap.has(key)) {
          stockMap.get(key)!.count += 1;
        } else {
          stockMap.set(key, { count: 1, sellingPrice: item.sellingPrice });
        }
      });

      const productsInStock: ProductWithStock[] = [];

      // Process main products
      products.forEach((product) => {
        const productKey = String(product.id);
        
        // Check if main product has stock
        if (stockMap.has(productKey)) {
          const stockInfo = stockMap.get(productKey)!;
          productsInStock.push({
            id: product.id,
            name: product.name,
            stockCount: stockInfo.count,
            sellingPrice: stockInfo.sellingPrice,
            images: getAllImages(product),
            isVariation: false,
          });
        }

        // Check if any variations have stock
        if (product.variations && product.variations.length > 0) {
          product.variations.forEach((variation, index) => {
            const variationKey = String(variation.id);
            
            if (stockMap.has(variationKey)) {
              const stockInfo = stockMap.get(variationKey)!;
              const variationImages = getVariationImages(product, variation);
              const variationNumber = index + 1;
              
              productsInStock.push({
                id: variation.id,
                name: `${product.name} - Variation ${variationNumber}`,
                stockCount: stockInfo.count,
                sellingPrice: stockInfo.sellingPrice,
                images: variationImages,
                isVariation: true,
                parentProductId: product.id,
              });
            }
          });
        }
      });

      setProductsWithStock(productsInStock);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const getAllImages = (product: Product): string[] => {
    const images: string[] = [];
    if (product.attributes.mainImage) images.push(product.attributes.mainImage);
    if (product.attributes.Image) {
      images.push(
        ...(Array.isArray(product.attributes.Image)
          ? product.attributes.Image
          : [product.attributes.Image])
      );
    }
    return images;
  };

  const getVariationImages = (product: Product, variation: { id: string | number; attributes: Record<string, any> }): string[] => {
    const images: string[] = [];
    
    // First, try to get images from variation attributes
    Object.entries(variation.attributes).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('image') || lowerKey.includes('img')) {
        if (Array.isArray(value)) {
          images.push(...value.filter(v => typeof v === 'string'));
        } else if (typeof value === 'string') {
          images.push(value);
        }
      }
    });

    // If no variation images, fall back to product main image
    if (images.length === 0 && product.attributes.mainImage) {
      images.push(product.attributes.mainImage);
    }

    // If still no images, try product Image attribute
    if (images.length === 0 && product.attributes.Image) {
      if (Array.isArray(product.attributes.Image)) {
        images.push(...product.attributes.Image);
      } else {
        images.push(product.attributes.Image);
      }
    }

    return images;
  };

  const openLightbox = (image: string, productName: string, images: string[], index: number) => {
    setLightboxImage(image);
    setLightboxProductName(productName);
    setAllLightboxImages(images);
    setCurrentImageIndex(index);
  };

  const closeLightbox = () => setLightboxImage(null);

  const navigateLightbox = (direction: 'prev' | 'next') => {
    const newIndex =
      direction === 'next'
        ? (currentImageIndex + 1) % allLightboxImages.length
        : (currentImageIndex - 1 + allLightboxImages.length) % allLightboxImages.length;
    setCurrentImageIndex(newIndex);
    setLightboxImage(allLightboxImages[newIndex]);
  };

  const filteredProducts = productsWithStock.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mb-6 flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Product Gallery
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredProducts.length} products in stock
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-transparent border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500"
              />
            </div>
          </div>

          <GalleryGrid
            loading={loading}
            error={error}
            products={filteredProducts}
            onImageClick={openLightbox}
          />
        </main>
      </div>

      {lightboxImage && (
        <Lightbox
          image={lightboxImage}
          productName={lightboxProductName}
          allImages={allLightboxImages}
          currentIndex={currentImageIndex}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
        />
      )}
    </div>
  );
}