'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingCart, Heart, Eye, ChevronRight, ChevronDown, ArrowLeft, X } from 'lucide-react';

interface Product {
  id: string | number;
  name: string;
  attributes: {
    mainImage?: string;
    category?: string;
    subcategory?: string;
    subSubcategory?: string;
    Price?: string;
    Color?: string;
    Size?: string;
    [key: string]: string | string[] | undefined;
  };
}

interface InventoryItem {
  productId: string | number;
  status: string;
  sellingPrice?: number;
}

interface ProductVariation {
  id: string | number;
  name: string;
  attributes: {
    Color?: string;
    Size?: string;
    [key: string]: any;
  };
  price: string;
  available: number;
  image: string;
}

interface GroupedProduct {
  baseId: string;
  baseName: string;
  image: string;
  priceRange: string;
  totalAvailable: number;
  variations: ProductVariation[];
}

interface Category {
  id: string;
  title: string;
  description: string;
  slug: string;
  image: string;
  subcategories?: Category[];
}

export default function CategoryProductsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [products, setProducts] = useState<GroupedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [categoryInfo, setCategoryInfo] = useState<{ id: string; title: string; description: string; image: string; breadcrumb: string[] } | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid-3' | 'grid-4' | 'grid-5'>('grid-4');


  // Extract base product name (removes " - Variation X" suffix)
  const getBaseName = (name: string): string => {
    return name.replace(/\s*-\s*Variation\s+\d+$/i, '').trim();
  };

  // Check if a product has variations based on name pattern
  const hasVariations = (name: string): boolean => {
    return /\s*-\s*Variation\s+\d+$/i.test(name);
  };

  // Group products by base name
  const groupProductsByVariations = (productsWithInventory: any[]): GroupedProduct[] => {
    const grouped = new Map<string, GroupedProduct>();

    productsWithInventory.forEach(product => {
      const baseName = getBaseName(product.name);
      const baseId = baseName.toLowerCase().replace(/\s+/g, '-');

      if (!grouped.has(baseId)) {
        grouped.set(baseId, {
          baseId,
          baseName,
          image: product.image,
          priceRange: product.price,
          totalAvailable: 0,
          variations: []
        });
      }

      const group = grouped.get(baseId)!;
      group.variations.push({
        id: product.id,
        name: product.name,
        attributes: product.attributes || {},
        price: product.price,
        available: product.available,
        image: product.image
      });
      group.totalAvailable += product.available;
    });

    // Calculate price range for each group
    grouped.forEach(group => {
      if (group.variations.length > 1) {
        const prices = group.variations.map(v => parseFloat(v.price));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        if (minPrice === maxPrice) {
          group.priceRange = minPrice.toString();
        } else {
          group.priceRange = `${minPrice} - ${maxPrice}`;
        }
      } else {
        group.priceRange = group.variations[0].price;
      }
    });

    return Array.from(grouped.values());
  };

  const getAllDescendantIds = (category: Category): string[] => {
    let ids = [category.id];
    if (category.subcategories) {
      category.subcategories.forEach(sub => {
        ids = [...ids, ...getAllDescendantIds(sub)];
      });
    }
    return ids;
  };

  const getCategoryPathFromProduct = (product: Product): string[] => {
    const attrs = product.attributes;
    const path: string[] = [];
    
    if (attrs.category) path.push(String(attrs.category));
    if (attrs.subcategory) path.push(String(attrs.subcategory));
    if (attrs.subSubcategory) path.push(String(attrs.subSubcategory));
    
    let level = 3;
    while (attrs[`level${level}`]) {
      path.push(String(attrs[`level${level}`]));
      level++;
    }
    
    return path.filter(id => id && id !== '');
  };

  const productBelongsToCategory = (product: Product, categoryIds: string[]): boolean => {
    const productPath = getCategoryPathFromProduct(product);
    return productPath.some(catId => categoryIds.includes(catId));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesRes = await fetch('/api/categories');
        const categoriesData: Category[] = await categoriesRes.json();
        setAllCategories(categoriesData);

        let foundCategory: Category | null = null;
        let breadcrumb: string[] = [];
        let parentCategoryIds: string[] = [];
        
        const findCategoryBySlug = (cats: Category[], path: string[] = [], parentIds: string[] = []): Category | null => {
          for (const cat of cats) {
            const currentPath = [...path, cat.title];
            const currentParentIds = [...parentIds];
            
            if (cat.slug === slug) {
              breadcrumb = currentPath;
              parentCategoryIds = currentParentIds;
              return cat;
            }
            if (cat.subcategories && cat.subcategories.length > 0) {
              const found = findCategoryBySlug(cat.subcategories, currentPath, [...currentParentIds, cat.id]);
              if (found) return found;
            }
          }
          return null;
        };

        foundCategory = findCategoryBySlug(categoriesData);

        if (!foundCategory) {
          setLoading(false);
          return;
        }

        setExpandedCategories(new Set([...parentCategoryIds, foundCategory.id]));

        setCategoryInfo({ 
          id: foundCategory.id, 
          title: foundCategory.title,
          description: foundCategory.description,
          image: foundCategory.image,
          breadcrumb 
        });

        const categoryIds = getAllDescendantIds(foundCategory);

        const productsRes = await fetch('/api/products');
        const allProducts: Product[] = await productsRes.json();

        const inventoryRes = await fetch('/api/inventory');
        const inventory: InventoryItem[] = await inventoryRes.json();

        const categoryProducts = allProducts.filter(p => 
          productBelongsToCategory(p, categoryIds)
        );

        const productsWithInventory = categoryProducts.map(product => {
          const productInventory = inventory.filter(
            item => item.productId === product.id || item.productId === Number(product.id)
          );

          const available = productInventory.filter(item => item.status === 'available').length;

          let price = product.attributes.Price || '0';
          if (!product.attributes.Price && productInventory.length > 0) {
            const firstItem = productInventory[0];
            price = firstItem.sellingPrice?.toString() || '0';
          }

          return {
            id: product.id,
            name: product.name,
            image: product.attributes.mainImage || '',
            price: price,
            available,
            attributes: product.attributes
          };
        });

        const availableProducts = productsWithInventory.filter(p => p.available > 0);
        const groupedProducts = groupProductsByVariations(availableProducts);
        setProducts(groupedProducts);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryTree = (categories: Category[], level: number = 0) => {
    return categories.map(cat => {
      const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;
      const isExpanded = expandedCategories.has(cat.id);
      const isActive = slug === cat.slug;

      return (
        <div key={cat.id}>
          <div
            className={`flex items-center justify-between py-2.5 px-3 cursor-pointer transition-colors ${
              isActive ? 'text-red-700 font-semibold' : 'text-gray-700 hover:text-gray-900'
            }`}
            style={{ paddingLeft: `${level * 20 + 12}px` }}
          >
            <span
              onClick={() => router.push(`/e-commerce/${cat.slug}`)}
              className="flex-1"
            >
              {cat.title}
            </span>
            <div className="flex items-center gap-2">
              {hasSubcategories && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategory(cat.id);
                  }}
                  className="p-0.5"
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              )}
            </div>
          </div>
          {hasSubcategories && isExpanded && (
            <div>{renderCategoryTree(cat.subcategories!, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return parseFloat(a.priceRange.split('-')[0]) - parseFloat(b.priceRange.split('-')[0]);
      case 'price-high':
        return parseFloat(b.priceRange.split('-')[0]) - parseFloat(a.priceRange.split('-')[0]);
      case 'name':
        return a.baseName.localeCompare(b.baseName);
      default:
        return 0;
    }
  });

  const gridCols = {
    'grid-3': 'lg:grid-cols-3',
    'grid-4': 'lg:grid-cols-4',
    'grid-5': 'lg:grid-cols-5'
  }[viewMode];

  const getVariationLabel = (variation: ProductVariation): string => {
    const parts = [];
    if (variation.attributes.Color) parts.push(variation.attributes.Color);
    if (variation.attributes.Size) parts.push(variation.attributes.Size);
    return parts.length > 0 ? parts.join(' / ') : variation.name;
  };

  const navigateToProduct = (productId: string | number) => {
    router.push(`/e-commerce/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!categoryInfo) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
            <p className="text-gray-600">The category you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <div className="relative h-96 bg-gradient-to-r from-gray-100 to-gray-50 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={categoryInfo.image}
            alt={categoryInfo.title}
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-xl">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">{categoryInfo.title}</h1>
            <p className="text-lg text-gray-700 mb-6">{categoryInfo.description}</p>
            <button className="bg-red-700 text-white px-8 py-3 rounded font-semibold hover:bg-red-800 transition-colors">
              SHOP NOW
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="border-b bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          {categoryInfo.breadcrumb && categoryInfo.breadcrumb.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span>Home</span>
              <span>/</span>
              <span>Shop</span>
              <span>/</span>
              {categoryInfo.breadcrumb.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span>/</span>}
                  <span className={index === categoryInfo.breadcrumb.length - 1 ? 'text-gray-900 font-semibold' : ''}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}
          <h2 className="text-3xl font-bold text-gray-900">{categoryInfo.title}</h2>
          <p className="text-sm text-gray-600 mt-2">{products.length} products found</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="bg-white border border-gray-200 rounded-lg sticky top-4">
              <div className="p-6 border-b">
                <h3 className="text-lg font-bold text-gray-900">PRODUCT CATEGORIES</h3>
              </div>
              <div className="p-4 max-h-[600px] overflow-y-auto">
                {renderCategoryTree(allCategories)}
              </div>
            </div>
          </aside>

          {/* Products Section */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <p className="text-sm text-gray-600">
                Show: {' '}
                <button onClick={() => setViewMode('grid-3')} className={`mx-1 ${viewMode === 'grid-3' ? 'font-bold' : ''}`}>9</button> / 
                <button onClick={() => setViewMode('grid-4')} className={`mx-1 ${viewMode === 'grid-4' ? 'font-bold' : ''}`}>12</button> / 
                <button onClick={() => setViewMode('grid-5')} className={`mx-1 ${viewMode === 'grid-5' ? 'font-bold' : ''}`}>18</button>
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="featured">Default sorting</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>

            {/* Products Grid */}
            {sortedProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No products available in this category</p>
              </div>
            ) : (
              <div className={`grid grid-cols-2 md:grid-cols-3 ${gridCols} gap-6`}>
                {sortedProducts.map((product) => (
                  <div
                    key={product.baseId}
                    className="group bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200"
                    onMouseEnter={() => setHoveredId(product.baseId)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                <div 
                  onClick={() => navigateToProduct(product.variations[0].id)}
                  className="relative aspect-square overflow-hidden bg-gray-50 cursor-pointer"
                >
                  <img
                    src={product.image}
                    alt={product.baseName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {product.variations.length > 1 && (
                    <span className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1.5 text-xs font-bold rounded-full shadow-lg">
                      {product.variations.length} VARIANTS
                    </span>
                  )}

                  {/* ❤️ and 👁️ buttons */}
                  <div
                    className={`absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300 ${
                      hoveredId === product.baseId ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                    }`}
                  >
                    <button className="p-2.5 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors">
                      <Heart size={18} className="text-gray-700" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (product.variations.length > 0) {
                          navigateToProduct(product.variations[0].id);
                        } else {
                          navigateToProduct(product.baseId);
                        }
                      }}
                      className="p-2.5 bg-white rounded-full shadow-lg hover:bg-blue-50 transition-colors"
                    >
                      <Eye size={18} className="text-gray-700" />
                    </button>
                  </div>

                  {/* Red bottom button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (product.variations.length > 0) {
                        navigateToProduct(product.variations[0].id);
                      } else {
                        navigateToProduct(product.baseId);
                      }
                    }}
                    className={`absolute bottom-0 left-0 right-0 bg-red-700 text-white py-3.5 text-sm font-bold transition-transform duration-300 flex items-center justify-center gap-2 hover:bg-red-700 ${
                      hoveredId === product.baseId ? 'translate-y-0' : 'translate-y-full'
                    }`}
                  >
                    {product.variations.length > 1 ? 'SELECT OPTION' : 'ADD TO CART'}
                  </button>
                </div>


                    <div className="p-4 text-center">
                      <h3 
                        onClick={() => navigateToProduct(product.variations[0].id)}
                        className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors cursor-pointer"
                      >
                        {product.baseName}
                      </h3>
                      <span className="text-lg font-bold text-red-700">
                        {product.priceRange.includes('-') 
                          ? `${product.priceRange}৳`
                          : `${parseFloat(product.priceRange).toLocaleString()}.00৳`
                        }
                      </span>
                      {product.variations.length > 1 && (
                        <p className="text-xs text-gray-500 mt-1">{product.variations.length} variations available</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>      
    </div>
  );
}