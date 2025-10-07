'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import GalleryGrid from '@/components/GalleryGrid';
import Lightbox from '@/components/Lightbox';
import SearchBar from '@/components/SearchBar';
import { Product } from '@/types/product';

export default function GalleryPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxProductName, setLightboxProductName] = useState('');
  const [allLightboxImages, setAllLightboxImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // fetch products
  useEffect(() => { fetchProducts(); }, []);
  // handle dark mode
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      setProducts(await res.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const getAllImages = (product: Product) => {
    const images: string[] = [];
    if (product.attributes.mainImage) images.push(product.attributes.mainImage);
    if (product.attributes.Image) {
      images.push(...(Array.isArray(product.attributes.Image) ? product.attributes.Image : [product.attributes.Image]));
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
  const navigateLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxImage(allLightboxImages[index]);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mb-6 flex flex-col gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Gallery</h1>
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
          </div>

          {loading && <div className="text-center py-12">Loading products...</div>}
          {error && <div className="text-red-600">{error}</div>}

          {!loading && !error && (
            <GalleryGrid
              products={filteredProducts}
              getAllImages={getAllImages}
              openLightbox={openLightbox}
            />
          )}
        </main>
      </div>

      {lightboxImage && (
        <Lightbox
          image={lightboxImage}
          productName={lightboxProductName}
          onClose={closeLightbox}
          allImages={allLightboxImages}
          currentIndex={currentImageIndex}
          onNavigate={navigateLightbox}
        />
      )}
    </div>
  );
}
