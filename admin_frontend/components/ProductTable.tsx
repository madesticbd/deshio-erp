'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

/* ---------- Interfaces ---------- */
interface Product {
  id: number | string;
  name: string;
  attributes: Record<string, any>;
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
  onSelect?: (product: Product) => void; // 🔹 New optional prop
  selectable?: boolean; // 🔹 Enable selection checkboxes
  onSelectChange?: (selectedIds: (number | string)[]) => void; // 🔹 Notify parent of selection changes
}

/* ---------- Image with Fallback ---------- */
function ImageWithFallback({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-700`}
      >
        <span className="text-xs text-gray-400 dark:text-gray-500">No Img</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}

/* ---------- Product List Item ---------- */
function ProductListItem({
  product,
  image,
  categoryPath,
  onDelete,
  onEdit,
  onView,
  onSelect,
  selected,
  selectable,
  toggleSelect,
}: {
  product: Product;
  image: string | null;
  categoryPath: string;
  onDelete: (id: number | string) => void;
  onEdit: (product: Product) => void;
  onView: (id: number | string) => void;
  onSelect?: (product: Product) => void;
  selectable?: boolean;
  selected?: boolean;
  toggleSelect?: (id: number | string) => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      {/* Checkbox if selectable */}
      {selectable && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => toggleSelect?.(product.id)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
      )}

      {/* Product Image */}
      <button
        type="button"
        onClick={() => onView(product.id)}
        className="p-0 rounded overflow-hidden flex-shrink-0"
        aria-label={`View ${product.name}`}
      >
        <ImageWithFallback
          src={image}
          alt={product.name}
          className="w-16 h-16 rounded object-cover"
        />
      </button>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-gray-900 dark:text-white mb-1">{product.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{categoryPath}</p>
      </div>

      {/* Select button (optional) */}
      {onSelect && (
        <button
          onClick={() => onSelect(product)}
          className="text-xs px-2 py-1 bg-black text-white rounded mr-2"
        >
          Select
        </button>
      )}

      {/* Dropdown menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="h-8 w-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <button
              onClick={() => {
                onEdit(product);
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => {
                onDelete(product.id);
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
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
}: ProductTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);

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
    <div className="space-y-2 mt-4">
      {selectable && products.length > 0 && (
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={selectedIds.length === products.length}
            onChange={toggleSelectAll}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Select All ({selectedIds.length}/{products.length})
          </span>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No products found.
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
            />
          );
        })
      )}
    </div>
  );
}
