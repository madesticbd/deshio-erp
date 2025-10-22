'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductListItem from './ProductListItem';
import VariationsModal from './VariationsModal';

interface Product {
  id: number | string;
  name: string;
  attributes: Record<string, any>;
  variations?: {
    id: string | number;
    attributes: Record<string, any>;
  }[];
}

interface Field {
  id: number;
  name: string;
  type: string;
}

interface Category {
  id: string | number;
  title?: string;
  name?: string;
  slug?: string;
  subcategories?: Category[];
}

interface ProductTableProps {
  products: Product[];
  fields?: Field[];
  categories?: Category[];
  getCategoryDisplayName?: (product: Product) => string;
  onDelete: (id: number | string) => void;
  onEdit: (product: Product) => void;
  onSelect?: (product: Product) => void;
  selectable?: boolean;
  onSelectChange?: (selectedIds: (number | string)[]) => void;
  onSelectVariation?: (product: Product, variation: { id: string | number; attributes: Record<string, any> }) => void;
}

interface GroupedProduct {
  baseName: string;
  products: Product[];
  isVariationGroup: boolean;
}

export default function ProductTable({
  products,
  fields = [],
  categories = [],
  getCategoryDisplayName,
  onDelete,
  onEdit,
  onSelect,
  selectable = false,
  onSelectChange,
  onSelectVariation,
}: ProductTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  const isImageValue = (v: any) => {
    if (typeof v !== 'string') return false;
    const lower = v.toLowerCase();
    if (lower.startsWith('data:image')) return true;
    if (lower.includes('/uploads/') || lower.includes('/images/')) return true;
    return /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/.test(lower);
  };

  const getMainImage = (attributes: Record<string, any>): string | null => {
    if (!attributes) return null;
    const keysPriority = ['mainImage', 'MainImage', 'main_image', 'image', 'images', 'gallery'];

    for (const key of keysPriority) {
      const v = attributes[key];
      if (!v) continue;
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string') return v[0];
      else if (typeof v === 'string' && isImageValue(v)) return v;
    }

    for (const val of Object.values(attributes)) {
      if (typeof val === 'string' && isImageValue(val)) return val;
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string' && isImageValue(val[0])) {
        return val[0];
      }
    }
    return null;
  };

  // Fallback category path function if not provided
  const getDefaultCategoryPath = (product: Product): string => {
    const attributes = product.attributes;
    
    // Get category path array from attributes
    const path: string[] = [];
    if (attributes.category) path.push(String(attributes.category));
    if (attributes.subcategory) path.push(String(attributes.subcategory));
    if (attributes.subSubcategory) path.push(String(attributes.subSubcategory));
    
    // Check for additional levels
    let level = 3;
    while (attributes[`level${level}`]) {
      path.push(String(attributes[`level${level}`]));
      level++;
    }
    
    const filteredPath = path.filter(id => id && id !== '');
    if (filteredPath.length === 0) return '-';

    // Try to resolve category names
    const names: string[] = [];
    let current: Category[] = categories;
    
    for (const id of filteredPath) {
      const cat = current.find(c => String(c.id) === String(id));
      if (cat) {
        names.push(cat.title || cat.name || String(cat.id));
        current = cat.subcategories || [];
      } else {
        names.push(`Unknown (${id})`);
        break;
      }
    }
    
    return names.length > 0 ? names.join(' > ') : '-';
  };

  const handleView = (productId: number | string) => {
    router.push(`/product/view?id=${productId}`);
  };

  const handleViewVariations = (product: Product) => {
    setModalProduct(product);
  };

  const groupProducts = (): GroupedProduct[] => {
    const grouped = new Map<string, Product[]>();

    products.forEach(product => {
      const variationMatch = product.name.match(/^(.+?)\s*-\s*Variation\s+\d+$/i);
      const baseName = variationMatch ? variationMatch[1].trim() : product.name;

      if (!grouped.has(baseName)) {
        grouped.set(baseName, []);
      }
      grouped.get(baseName)!.push(product);
    });

    const groupedArray: GroupedProduct[] = Array.from(grouped.entries()).map(([baseName, prods]) => {
      const sorted = prods.sort((a, b) => {
        const aMatch = a.name.match(/Variation\s+(\d+)$/i);
        const bMatch = b.name.match(/Variation\s+(\d+)$/i);

        if (!aMatch && !bMatch) return 0;
        if (!aMatch && bMatch) return -1;
        if (aMatch && !bMatch) return 1;
        
        if (aMatch && bMatch) {
          const aNum = parseInt(aMatch[1]);
          const bNum = parseInt(bMatch[1]);
          return aNum - bNum;
        }
        return 0;
      });

      return {
        baseName,
        products: sorted,
        isVariationGroup: sorted.length > 1
      };
    });

    return groupedArray;
  };

  const toggleSelect = (id: number | string) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    setSelectedIds(newSelected);
    onSelectChange?.(newSelected);
  };

  const toggleSelectAll = () => {
    const newSelected =
      selectedIds.length === products.length ? [] : products.map((p) => p.id);
    setSelectedIds(newSelected);
    onSelectChange?.(newSelected);
  };

  const groupedProducts = groupProducts();

  return (
    <>
      <div className="space-y-3">
        {/* Select All Header */}
        {selectable && products.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <input
              type="checkbox"
              checked={selectedIds.length === products.length && products.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select All
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({selectedIds.length} of {products.length} selected)
            </span>
          </div>
        )}

        {/* Product Groups */}
        {products.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          groupedProducts.map((group) => {
            const baseProduct = group.products[0];
            const attrs = baseProduct.attributes || {};
            const mainImage = getMainImage(attrs);
            
            // Use provided function or fallback
            const categoryPath = getCategoryDisplayName 
              ? getCategoryDisplayName(baseProduct)
              : getDefaultCategoryPath(baseProduct);

            return (
              <div key={group.baseName} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                <ProductListItem
                  product={{
                    ...baseProduct,
                    name: group.baseName
                  }}
                  image={mainImage}
                  categoryPath={categoryPath}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onView={handleView}
                  onSelect={onSelect}
                  selectable={selectable}
                  selected={selectedIds.includes(baseProduct.id)}
                  toggleSelect={toggleSelect}
                  onViewVariations={group.isVariationGroup ? () => handleViewVariations({ ...baseProduct, name: group.baseName }) : undefined}
                  variationCount={group.isVariationGroup ? group.products.length : undefined}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Variations Modal */}
      {modalProduct && (
        <VariationsModal
          product={{
            ...modalProduct,
            variations: groupedProducts
              .find(g => g.baseName === modalProduct.name)
              ?.products
              .map(p => ({
                id: p.id,
                attributes: p.attributes
              })) || []
          }}
          mainImage={getMainImage(modalProduct.attributes)}
          onClose={() => setModalProduct(null)}
          onSelectVariation={onSelectVariation}
        />
      )}
    </>
  );
}