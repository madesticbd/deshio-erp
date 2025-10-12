'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

interface Field {
  id: number;
  name: string;
  type: string;
}

interface Product {
  id: number | string;
  name: string;
  attributes: {
    mainImage?: string;
    Image?: string | string[];
    Colour?: string;
    [key: string]: any;
  };
  variations?: {
    id: string;
    attributes: Record<string, any>;
  }[];
}

interface Category {
  id: string | number;
  title?: string;
  name?: string;
  slug?: string;
  subcategories?: Category[];
}

export default function ProductViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');
  
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [variationMainImages, setVariationMainImages] = useState<Record<string, string>>({});

  // Reserved attribute names that shouldn't be displayed in the attributes list
  const reserved = new Set([
    'mainImage',
    'main_image',
    'image',
    'images',
    'gallery',
    'Image',
    'category',
    'subcategory',
    'categoryId',
    'category_id',
    'subCategory',
    'sub_category'
  ]);

  // Check if value is an image URL
  const isImageValue = (v: any) => {
    if (typeof v !== 'string') return false;
    const lower = v.toLowerCase();
    if (lower.startsWith('data:image')) return true;
    if (lower.includes('/uploads/') || lower.includes('/images/')) return true;
    return /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/.test(lower);
  };

  // Check if key is an image key
  const isImageKey = (key: string) => {
    const lower = key.toLowerCase();
    return lower.includes('image') || lower.includes('img') || lower === 'gallery';
  };

  // Extract all images from attributes
  const extractImages = (attributes: Record<string, any>): string[] => {
    if (!attributes) return [];
    
    const images: string[] = [];
    
    for (const [key, val] of Object.entries(attributes)) {
      if (!isImageKey(key)) continue;
      
      if (Array.isArray(val)) {
        val.forEach(img => {
          if (typeof img === 'string' && isImageValue(img)) {
            images.push(img);
          }
        });
      } else if (typeof val === 'string' && isImageValue(val)) {
        images.push(val);
      }
    }
    
    return images;
  };

  // Get category path display
  const getCategoryPath = (attributes: Record<string, any>): string => {
    const catId = attributes?.category ?? attributes?.categoryId ?? attributes?.category_id;
    const subId = attributes?.subcategory ?? attributes?.subCategory ?? attributes?.sub_category;

    if (!catId && !subId) return '-';

    if (Array.isArray(categories) && categories.length > 0) {
      const top = categories.find((c) => String(c.id) === String(catId) || String(c.slug) === String(catId));
      const topName = top ? (top.title ?? top.name ?? top.slug ?? String(top.id)) : null;

      let subName: string | null = null;
      if (top && Array.isArray(top.subcategories) && subId) {
        const sub = top.subcategories.find(
          (s) => String(s.id) === String(subId) || String(s.slug) === String(subId) || String(s.title) === String(subId)
        );
        subName = sub ? (sub.title ?? sub.name ?? sub.slug ?? String(sub.id)) : null;
      }

      if (topName && subName) return `${topName} / ${subName}`;
      if (topName) return topName;
      if (subName) return subName;
    }

    if (catId && subId) return `Category ${catId} / Subcategory ${subId}`;
    if (catId) return String(catId);
    return '-';
  };

  // Fetch product data
  useEffect(() => {
    if (!productId) {
      router.push('/product');
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productRes, fieldsRes, catsRes] = await Promise.all([
          fetch(`/api/products/${productId}`),
          fetch('/api/fields'),
          fetch('/api/categories'),
        ]);

        if (!productRes.ok) {
          throw new Error('Product not found');
        }

        const productData = await productRes.json();
        const fieldsData = await fieldsRes.json();
        const catsData = await catsRes.json();

        setProduct(productData);
        setFields(Array.isArray(fieldsData) ? fieldsData : []);
        setCategories(Array.isArray(catsData) ? catsData : []);

        // Extract and set images
        const images = extractImages(productData.attributes);
        setGalleryImages(images);
        if (images.length > 0) {
          setMainImage(images[0]);
        }

        // Initialize variation main images
        if (productData.variations && productData.variations.length > 0) {
          const varImageMap: Record<string, string> = {};
          productData.variations.forEach((variation: any) => {
            const varImages = extractImages(variation.attributes);
            varImageMap[variation.id] = varImages[0] || ERROR_IMG_SRC;
          });
          setVariationMainImages(varImageMap);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to load product');
        router.push('/product');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [productId, router]);

  const handleDelete = async () => {
    if (!product || !confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/product');
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to delete product');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting product');
    }
  };

  const handleEdit = () => {
    if (product) {
      router.push(`/product/add?id=${product.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className={`${darkMode ? 'dark' : ''} flex h-screen`}>
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
            <div className="text-gray-500 dark:text-gray-400">Loading product...</div>
          </main>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const categoryPath = getCategoryPath(product.attributes);

  // Get displayable attributes (excluding reserved and image fields)
  const displayAttributes = Object.entries(product.attributes)
    .filter(([key, value]) => {
      return !reserved.has(key) && 
             !isImageKey(key) && 
             value !== undefined && 
             value !== null && 
             value !== '';
    })
    .map(([key, value]) => ({ label: key, value }));

  // Get variation attribute keys (excluding images)
  const variationAttributeKeys = product.variations && product.variations.length > 0
    ? Object.keys(product.variations[0].attributes).filter(key => !isImageKey(key))
    : [];

  return (
    <div className={`${darkMode ? 'dark' : ''} flex h-screen`}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => router.push('/product/list')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-lg"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Product Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Gallery */}
              <div className="space-y-4">
                {/* Main Image */}
                <button
                  onClick={() => setZoomedImage(mainImage)}
                  className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-zoom-in"
                >
                  <ImageWithFallback
                    src={mainImage || ERROR_IMG_SRC}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </button>

                {/* Thumbnail Gallery */}
                {galleryImages.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {galleryImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setMainImage(img)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                          mainImage === img
                            ? 'border-blue-500 dark:border-blue-400'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        <ImageWithFallback
                          src={img}
                          alt={`${product.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Category:</span>
                    <span>{categoryPath}</span>
                  </div>
                </div>

                {/* Attributes */}
                {displayAttributes.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Product Details
                    </h2>
                    <dl className="space-y-3">
                      {displayAttributes.map((attr, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          <dt className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                            {attr.label.replace(/([A-Z])/g, ' $1').trim()}:
                          </dt>
                          <dd className="col-span-2 text-gray-900 dark:text-white">
                            {Array.isArray(attr.value)
                              ? attr.value.join(', ')
                              : typeof attr.value === 'boolean'
                              ? attr.value ? 'Yes' : 'No'
                              : String(attr.value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            </div>

            {/* Variations Section */}
            {product.variations && product.variations.length > 0 && (
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  Product Variations ({product.variations.length})
                </h2>
                
                <div className="space-y-6">
                  {product.variations.map((variation, varIndex) => {
                    const varImages = extractImages(variation.attributes);
                    const varMainImage = variationMainImages[variation.id] || varImages[0] || ERROR_IMG_SRC;
                    
                    return (
                      <div
                        key={variation.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-800/50"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Variation {varIndex + 1}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Variation Images */}
                          <div className="space-y-3">
                            {/* Main Variation Image */}
                            <button
                              onClick={() => setZoomedImage(varMainImage)}
                              className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-zoom-in"
                            >
                              <ImageWithFallback
                                src={varMainImage}
                                alt={`Variation ${varIndex + 1}`}
                                className="w-full h-full object-contain"
                              />
                            </button>

                            {/* Variation Thumbnail Gallery */}
                            {varImages.length > 1 && (
                              <div className="grid grid-cols-5 gap-2">
                                {varImages.map((img, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setVariationMainImages(prev => ({
                                      ...prev,
                                      [variation.id]: img
                                    }))}
                                    className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                                      varMainImage === img
                                        ? 'border-blue-500 dark:border-blue-400'
                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                    }`}
                                  >
                                    <ImageWithFallback
                                      src={img}
                                      alt={`Variation ${varIndex + 1} - ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Variation Attributes */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                              Attributes
                            </h4>
                            <dl className="space-y-2">
                              {Object.entries(variation.attributes)
                                .filter(([key]) => !isImageKey(key))
                                .map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="grid grid-cols-2 gap-4 py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
                                  >
                                    <dt className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                      {key.replace(/([A-Z_])/g, ' $1').trim()}:
                                    </dt>
                                    <dd className="text-sm text-gray-900 dark:text-white">
                                      {value !== undefined && value !== null
                                        ? String(value)
                                        : '-'}
                                    </dd>
                                  </div>
                                ))}
                            </dl>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Image Zoom Modal */}
          {zoomedImage && (
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 cursor-zoom-out"
              onClick={() => setZoomedImage(null)}
            >
              <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
                <button
                  onClick={() => setZoomedImage(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-lg z-10"
                  aria-label="Close"
                >
                  <svg
                    className="w-6 h-6 text-gray-900 dark:text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <img
                  src={zoomedImage}
                  alt="Zoomed"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}