'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Archive, RotateCcw, Package } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';
import { productService, Product } from '@/services/productService';
import { categoryService, Category } from '@/services/categoryService';

export default function ProductViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');

  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  useEffect(() => {
    if (!productId) {
      router.push('/product');
      return;
    }

    fetchData();
  }, [productId]);

  const fetchData = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      const [productData, categoriesData] = await Promise.all([
        productService.getById(productId),
        categoryService.getAll(),
      ]);

      setProduct(productData);
      setCategories(categoriesData);

      // Set images
      if (productData.images && productData.images.length > 0) {
        const imageUrls = productData.images
          .sort((a, b) => {
            if (a.is_primary && !b.is_primary) return -1;
            if (!a.is_primary && b.is_primary) return 1;
            return a.order - b.order;
          })
          .map(img => {
            const path = img.image_path;
            return path.startsWith('http')
              ? path
              : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${path}`;
          });

        setGalleryImages(imageUrls);
        if (imageUrls.length > 0) {
          setMainImage(imageUrls[0]);
        }
      } else {
        const fallbackImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';
        setGalleryImages([fallbackImage]);
        setMainImage(fallbackImage);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      router.push('/product');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryPath = (categoryId: number): string => {
    const findPath = (cats: Category[], targetId: number, path: string[] = []): string[] | null => {
      for (const cat of cats) {
        const newPath = [...path, cat.title];
        if (cat.id === String(targetId)) {
          return newPath;
        }
        if (cat.subcategories) {
          const found = findPath(cat.subcategories, targetId, newPath);
          if (found) return found;
        }
      }
      return null;
    };

    const path = findPath(categories, categoryId);
    return path ? path.join(' / ') : 'Uncategorized';
  };

  const handleDelete = async () => {
    if (!product || !confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    try {
      await productService.delete(product.id);
      router.push('/product');
    } catch (error: any) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleArchive = async () => {
    if (!product || !confirm('Are you sure you want to archive this product?')) return;

    try {
      await productService.archive(product.id);
      router.push('/product');
    } catch (error: any) {
      console.error('Failed to archive product:', error);
    }
  };

  const handleRestore = async () => {
    if (!product) return;

    try {
      await productService.restore(product.id);
      router.push('/product');
    } catch (error: any) {
      console.error('Failed to restore product:', error);
    }
  };

  const handleEdit = () => {
    if (product) {
      router.push(`/product/add?id=${product.id}`);
    }
  };

  if (loading) {
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

  const categoryPath = getCategoryPath(product.category_id);
  const isArchived = product.is_archived;

  // Get displayable custom fields (exclude system fields)
  const displayableFields = product.custom_fields?.filter(
    cf => !['Primary Image', 'Additional Images', 'SKU', 'Product Name', 'Description', 'Category', 'Vendor'].includes(cf.field_title)
  ) || [];

  return (
    <div className={`${darkMode ? 'dark' : ''} flex h-screen`}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => router.push('/product')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </button>

            <div className="flex gap-2">
              {!isArchived && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}

              {isArchived ? (
                <button
                  onClick={handleRestore}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore
                </button>
              ) : (
                <button
                  onClick={handleArchive}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </button>
              )}

              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          {/* Archived Badge */}
          {isArchived && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-300">
                    This product is archived
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Archived products are hidden from the main product list. You can restore it anytime.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Product Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Gallery */}
              <div className="space-y-4">
                {/* Main Image */}
                <button
                  onClick={() => setZoomedImage(mainImage)}
                  className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-zoom-in"
                >
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';
                    }}
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
                        <img
                          src={img}
                          alt={`${product.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';
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
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                    SKU: <span className="font-medium">{product.sku}</span>
                  </p>

                  {product.description && (
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {product.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Category:</span>
                      <span className="text-gray-600 dark:text-gray-400">{categoryPath}</span>
                    </div>
                    {product.vendor && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Vendor:</span>
                        <span className="text-gray-600 dark:text-gray-400">{product.vendor.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Fields */}
                {displayableFields.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Additional Information
                    </h2>
                    <dl className="space-y-3">
                      {displayableFields.map((field, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          <dt className="font-medium text-gray-700 dark:text-gray-300">
                            {field.field_title}:
                          </dt>
                          <dd className="col-span-2 text-gray-900 dark:text-white">
                            {Array.isArray(field.value)
                              ? field.value.join(', ')
                              : typeof field.value === 'boolean'
                              ? field.value ? 'Yes' : 'No'
                              : field.value || '-'}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {/* Metadata */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Metadata
                  </h3>
                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <p>Created: {new Date(product.created_at).toLocaleString()}</p>
                    <p>Last Updated: {new Date(product.updated_at).toLocaleString()}</p>
                    <p>Product ID: {product.id}</p>
                  </div>
                </div>
              </div>
            </div>
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

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}