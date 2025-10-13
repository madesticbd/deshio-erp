'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductListItem from './ProductListItem';
import VariationsModal from './VariationsModal';

/* ---------- Interfaces ---------- */
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
  onDelete: (id: number | string) => void;
  onEdit: (product: Product) => void;
  onSelect?: (product: Product) => void;
  selectable?: boolean;
  onSelectChange?: (selectedIds: (number | string)[]) => void;
  onSelectVariation?: (product: Product, variation: { id: string | number; attributes: Record<string, any> }) => void;
}

/* ---------- Main Product Table ---------- */
export default function ProductTable({
  products,
  fields = [],
  categories = [],
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

  const getCategoryPath = (attributes: Record<string, any>): string => {
    const catId = attributes?.category ?? attributes?.categoryId ?? attributes?.category_id;
    const subId = attributes?.subcategory ?? attributes?.subCategory ?? attributes?.sub_category;

    if (!catId && !subId) return '-';

    if (Array.isArray(categories) && categories.length > 0) {
      const top = categories.find((c) => String(c.id) === String(catId));
      const topName = top ? (top.title ?? top.name ?? top.slug ?? null) : null;

      let subName: string | null = null;
      if (top && Array.isArray(top.subcategories) && subId) {
        const sub = top.subcategories.find((s) => String(s.id) === String(subId));
        subName = sub ? (sub.title ?? sub.name ?? sub.slug ?? null) : null;
      }

      if (topName && subName) return `${topName} / ${subName}`;
      if (topName) return topName;
      if (subName) return subName;
    }

    if (catId && subId) return `Category ${catId} / Subcategory ${subId}`;
    if (catId) return `Category ${catId}`;
    return '-';
  };

  const handleView = (productId: number | string) => {
    router.push(`/product/view?id=${productId}`);
  };

  const handleViewVariations = (product: Product) => {
    setModalProduct(product);
  };

  /* ---------- Selection Logic ---------- */
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

        {/* Product List */}
        {products.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          products.map((product) => {
            const attrs = product.attributes || {};
            const mainImage = getMainImage(attrs);
            const categoryPath = getCategoryPath(attrs);

            return (
              <ProductListItem
                key={product.id}
                product={product}
                image={mainImage}
                categoryPath={categoryPath}
                onDelete={onDelete}
                onEdit={onEdit}
                onView={handleView}
                onSelect={onSelect}
                selectable={selectable}
                selected={selectedIds.includes(product.id)}
                toggleSelect={toggleSelect}
                onViewVariations={handleViewVariations}
              />
            );
          })
        )}
      </div>

      {/* Variations Modal */}
      {modalProduct && (
        <VariationsModal
          product={modalProduct}
          mainImage={getMainImage(modalProduct.attributes)}
          onClose={() => setModalProduct(null)}
          onSelectVariation={onSelectVariation}
        />
      )}
    </>
  );
}