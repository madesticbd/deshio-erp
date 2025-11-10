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

import {
  ProductVariant,
  ProductGroup,
} from '@/types/product';


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
    return path ? path.join(' > ') : 'Uncategorized';
  };

  const getColorAndSize = (product: Product): { color?: string; size?: string } => {
    const colorField = product.custom_fields?.find(cf => cf.field_id === 6);
    const sizeField = product.custom_fields?.find(cf => cf.field_id === 7);
    
    return {
      color: colorField?.value,
      size: sizeField?.value,
    };
  };

  const getBaseName = (product: Product): string => {
    const { color, size } = getColorAndSize(product);
    let name = product.name;
    
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

  // Group products: Different colors = variations, Size-only = separate variations
  const productGroups = useMemo((): ProductGroup[] => {
    const groups = new Map<string, ProductGroup>();

    products.forEach((product) => {
      const sku = product.sku;
      const { color, size } = getColorAndSize(product);
      const baseName = getBaseName(product);
      
      const primaryImage = product.images?.find(img => img.is_primary)?.image_path || 
                          product.images?.[0]?.image_path || null;
      
      const imageUrl = primaryImage
        ? primaryImage.startsWith('http')
          ? primaryImage
          : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${primaryImage}`
        : null;

      // Determine grouping key: color-based if color exists, size-based if only size
      const groupKey = color ? `${sku}-color` : size ? `${sku}-${size}` : sku;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          sku: sku,
          baseName,
          totalVariants: 0,
          variants: [],
          primaryImage: imageUrl,
          categoryPath: getCategoryPath(product.category_id),
          category_id: product.category_id,
          hasVariations: false,
        });
      }

      const group = groups.get(groupKey)!;
      group.variants.push({
        id: product.id,
        name: product.name,
        sku: product.sku,
        color,
        size,
        image: imageUrl,
      });
    });

    // Calculate variants and mark groups with variations
    groups.forEach(group => {
      const hasColors = group.variants.some(v => v.color);
      if (hasColors) {
        // Count unique colors as variants
        const uniqueColors = new Set(group.variants.map(v => v.color).filter(Boolean));
        group.totalVariants = uniqueColors.size;
        group.hasVariations = uniqueColors.size > 1;
      } else {
        // No colors, count all products
        group.totalVariants = group.variants.length;
        group.hasVariations = false;
      }
    });

    return Array.from(groups.values());
  }, [products, categories]);

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

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / itemsPerPage));
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  const handleAddVariation = (group: ProductGroup) => {
    // Navigate to add page with base product info to create variation
    router.push(`/product/add?addVariation=true&baseSku=${group.sku}&baseName=${encodeURIComponent(group.baseName)}&categoryId=${group.category_id}`);
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
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectMode ? 'Select a Product' : 'Products'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectMode 
                        ? 'Choose a product variant to add to your operation' 
                        : `Manage your store's product catalog`}
                    </p>
                  </div>
                  {!selectMode && (
                    <button
                      onClick={handleAdd}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium shadow-sm"
                    >
                      <Plus className="w-5 h-5" />
                      Add Product
                    </button>
                  )}
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Products</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Product Groups</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{productGroups.length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">With Variations</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {productGroups.filter(g => g.hasVariations).length}
                    </p>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, SKU, category, color, or size..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 text-sm"
                  />
                </div>
              </div>

              {/* Content */}
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading products...</p>
                  </div>
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {searchQuery ? 'No products found' : 'No products yet'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {searchQuery 
                      ? 'Try adjusting your search terms' 
                      : 'Get started by adding your first product'}
                  </p>
                  {!searchQuery && !selectMode && (
                    <button
                      onClick={handleAdd}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Product
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedGroups.map((group) => (
                    <ProductListItem
                      key={`${group.sku}-${group.variants[0].id}`}
                      productGroup={group}
                      onDelete={handleDelete}
                      onEdit={group.hasVariations ? undefined : handleEdit}
                      onView={handleView}
                      onAddVariation={handleAddVariation}
                      {...(selectMode && { onSelect: handleSelect })}
                      selectable={selectMode}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing <span className="font-medium text-gray-900 dark:text-white">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredGroups.length)}</span> of <span className="font-medium text-gray-900 dark:text-white">{filteredGroups.length}</span> groups
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-10 w-10 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-900 dark:text-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
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
                          className={`h-10 w-10 flex items-center justify-center rounded-lg transition-colors font-medium ${
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
                      className="h-10 w-10 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-900 dark:text-white"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

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