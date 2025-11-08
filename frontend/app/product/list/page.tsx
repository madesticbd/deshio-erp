'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ProductListItem from '@/components/ProductListItem';
import { productService, Product } from '@/services/productService';
import { categoryService, Category } from '@/services/categoryService';
import Toast from '@/components/Toast';

interface ProductVariant {
  id: number;
  name: string;
  sku: string;
  color?: string;
  size?: string;
  image?: string;
}

interface ProductGroup {
  sku: string;
  baseName: string;
  totalVariants: number;
  variants: ProductVariant[];
  primaryImage: string | null;
  categoryPath: string;
  category_id: number;
}

export default function ProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectMode = searchParams.get('selectMode') === 'true';
  const redirectPath = searchParams.get('redirect') || '';
  
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const itemsPerPage = 10;

  // Fetch products and categories
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getAll({ per_page: 1000 }),
        categoryService.getAll(),
      ]);

      setProducts(Array.isArray(productsData.data) ? productsData.data : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setToast({ message: 'Failed to load products', type: 'error' });
      setProducts([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get category path display
  const getCategoryPath = (categoryId: number): string => {
    const findPath = (cats: Category[], id: number, path: string[] = []): string[] | null => {
      for (const cat of cats) {
        const newPath = [...path, cat.title];
        if (String(cat.id) === String(id)) {
          return newPath;
        }
        if (cat.subcategories && cat.subcategories.length > 0) {
          const found = findPath(cat.subcategories, id, newPath);
          if (found) return found;
        }
      }
      return null;
    };

    const path = findPath(categories, categoryId);
    return path ? path.join(' / ') : 'Uncategorized';
  };

  // Extract color and size from custom fields
  const getColorAndSize = (product: Product): { color?: string; size?: string } => {
    const colorField = product.custom_fields?.find(cf => cf.field_id === 6);
    const sizeField = product.custom_fields?.find(cf => cf.field_id === 7);
    
    return {
      color: colorField?.value,
      size: sizeField?.value,
    };
  };

  // Get base product name (remove color and size suffixes)
  const getBaseName = (product: Product): string => {
    const { color, size } = getColorAndSize(product);
    let name = product.name;
    
    // Remove " - Color - Size" pattern
    if (color && size) {
      const pattern = new RegExp(`\\s*-\\s*${color}\\s*-\\s*${size}$`, 'i');
      name = name.replace(pattern, '');
    } else if (color) {
      const pattern = new RegExp(`\\s*-\\s*${color}$`, 'i');
      name = name.replace(pattern, '');
    } else if (size) {
      const pattern = new RegExp(`\\s*-\\s*${size}$`, 'i');
      name = name.replace(pattern, '');
    }
    
    return name.trim();
  };

  // Group products by SKU (all variants have the same SKU)
  const productGroups = useMemo((): ProductGroup[] => {
    const groups = new Map<string, ProductGroup>();

    products.forEach((product) => {
      const sku = product.sku; // Use SKU as-is, no modification
      const { color, size } = getColorAndSize(product);
      const baseName = getBaseName(product);
      
      const primaryImage = product.images?.find(img => img.is_primary)?.image_path || 
                          product.images?.[0]?.image_path || null;
      
      const imageUrl = primaryImage
        ? primaryImage.startsWith('http')
          ? primaryImage
          : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${primaryImage}`
        : null;

      if (!groups.has(sku)) {
        groups.set(sku, {
          sku: sku,
          baseName,
          totalVariants: 0,
          variants: [],
          primaryImage: imageUrl,
          categoryPath: getCategoryPath(product.category_id),
          category_id: product.category_id,
        });
      }

      const group = groups.get(sku)!;
      group.totalVariants++;
      group.variants.push({
        id: product.id,
        name: product.name,
        sku: product.sku,
        color,
        size,
        image: imageUrl,
      });
    });

    return Array.from(groups.values());
  }, [products, categories]);

  // Filter product groups by search query
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return productGroups;

    return productGroups.filter((group) => {
      const nameMatch = group.baseName.toLowerCase().includes(q);
      const skuMatch = group.sku.toLowerCase().includes(q);
      const categoryMatch = group.categoryPath.toLowerCase().includes(q);
      const colorMatch = group.variants.some(v => v.color?.toLowerCase().includes(q));
      const sizeMatch = group.variants.some(v => v.size?.toLowerCase().includes(q));
      
      return nameMatch || skuMatch || categoryMatch || colorMatch || sizeMatch;
    });
  }, [productGroups, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / itemsPerPage));
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // CRUD handlers
  const handleDelete = async (id: number) => {
    try {
      await productService.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setToast({ message: 'Product deleted successfully', type: 'success' });
    } catch (err) {
      console.error('Error deleting product:', err);
      setToast({ message: 'Failed to delete product', type: 'error' });
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/product/add?id=${id}`);
  };

  const handleView = (id: number) => {
    router.push(`/product/${id}`);
  };

  const handleAdd = () => {
    router.push('/product/add');
  };

  const handleSelect = (variant: ProductVariant) => {
    if (selectMode && redirectPath) {
      const url = `${redirectPath}?productId=${variant.id}&productName=${encodeURIComponent(variant.name)}&productSku=${encodeURIComponent(variant.sku)}`;
      router.push(url);
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="flex-1 overflow-y-auto p-6">
            {/* Header Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                    {selectMode ? 'Select a Product' : 'Products'}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectMode 
                      ? 'Choose a product variant to add to your operation' 
                      : `Manage your store's products. ${products.length} total products in ${productGroups.length} groups.`}
                  </p>
                </div>
                {!selectMode && (
                  <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, SKU, category, color, or size..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500"
                />
              </div>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Loading products...
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  {searchQuery ? 'No products found matching your search.' : 'No products found.'}
                </p>
                {!searchQuery && !selectMode && (
                  <button
                    onClick={handleAdd}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Create your first product
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedGroups.map((group) => (
                  <ProductListItem
                    key={group.sku}
                    productGroup={group}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onView={handleView}
                    {...(selectMode && { onSelect: handleSelect })}
                    selectable={selectMode}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredGroups.length)} of {filteredGroups.length} product groups
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-10 w-10 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors text-gray-900 dark:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-10 w-10 flex items-center justify-center rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-10 w-10 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors text-gray-900 dark:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
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