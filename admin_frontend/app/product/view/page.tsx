'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

interface Field {
  id: number;
  name: string;
  type: string;
}

interface Product {
  id: number | string;
  name: string;
  attributes: Record<string, any>;
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
  const [product, setProduct] = useState<Product | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Reserved attribute names that shouldn't be displayed in the attributes list
  const reserved = new Set([
    'mainImage',
    'main_image',
    'image',
    'images',
    'gallery',
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

  // Extract all images from product attributes
  const extractImages = (attributes: Record<string, any>): string[] => {
    if (!attributes) return [];
    
    const images: string[] = [];
    const imageKeys = ['mainImage', 'main_image', 'image', 'images', 'gallery'];
    
    // First, check priority keys
    for (const key of imageKeys) {
      const v = attributes[key];
      if (!v) continue;
      
      if (Array.isArray(v)) {
        v.forEach(img => {
          if (typeof img === 'string' && isImageValue(img)) {
            images.push(img);
          }
        });
      } else if (typeof v === 'string' && isImageValue(v)) {
        images.push(v);
      }
    }
    
    // Then scan all other attributes for images
    for (const [key, val] of Object.entries(attributes)) {
      if (imageKeys.includes(key)) continue;
      
      if (isImageValue(val)) {
        if (!images.includes(val)) images.push(val);
      } else if (Array.isArray(val)) {
        val.forEach(item => {
          if (typeof item === 'string' && isImageValue(item) && !images.includes(item)) {
            images.push(item);
          }
        });
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
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />
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
  const displayAttributes = fields
    .filter(f => !reserved.has(f.name) && f.type?.toLowerCase() !== 'image')
    .map(field => ({
      label: field.name,
      value: product.attributes[field.name],
      type: field.type
    }))
    .filter(attr => attr.value !== undefined && attr.value !== null && attr.value !== '');

  return (
    <div className={`${darkMode ? 'dark' : ''} flex h-screen`}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />

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
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-lg"
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
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' font-size='20' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image Available
                    </div>
                  )}
                </div>

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
                        <img
                          src={img}
                          alt={`${product.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' font-size='12' fill='%23999'%3ENo Img%3C/text%3E%3C/svg%3E";
                          }}
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

                {displayAttributes.length === 0 && (
                  <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No additional details available
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}