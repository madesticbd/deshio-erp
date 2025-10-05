'use client';

import { useState } from 'react';
import { MoreVertical, Edit, Trash2, Eye } from 'lucide-react';

interface Product {
  id: number | string;
  name: string;
  attributes: Record<string, any>;
}

interface Category {
  id: string | number;
  title?: string;
  name?: string;
  subcategories?: Category[];
}

interface ProductGridProps {
  products: Product[];
  categories?: Category[];
  onDelete: (id: number | string) => void;
  onEdit: (product: Product) => void;
  onView: (id: number | string) => void;
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
        <span className="text-sm text-gray-400 dark:text-gray-500">No Image</span>
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
}

/* ---------- Product Grid ---------- */
export default function ProductGrid({
  products,
  categories = [],
  onDelete,
  onEdit,
  onView,
}: ProductGridProps) {
  const getMainImage = (attrs: Record<string, any>): string | null => {
    for (const key of ['MainImage', 'mainImage', 'image', 'images', 'gallery']) {
      const val = attrs[key];
      if (!val) continue;
      if (typeof val === 'string') return val;
      if (Array.isArray(val) && val[0]) return val[0];
    }
    return null;
  };

  const getCategoryPath = (attrs: Record<string, any>) => {
    const catId = attrs?.category ?? attrs?.categoryId;
    const subId = attrs?.subcategory ?? attrs?.subCategory;
    if (!catId) return '-';
    const top = categories.find((c) => String(c.id) === String(catId));
    const sub = top?.subcategories?.find((s) => String(s.id) === String(subId));
    const name = top?.title ?? top?.name ?? catId;
    return sub ? `${name} / ${sub.title ?? sub.name}` : name;
  };

  if (!products.length)
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No products found.
      </div>
    );

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          image={getMainImage(product.attributes)}
          categoryPath={getCategoryPath(product.attributes)}
          onDelete={onDelete}
          onEdit={onEdit}
          onView={onView}
        />
      ))}
    </div>
  );
}

/* ---------- Product Card ---------- */
function ProductCard({
  product,
  image,
  categoryPath,
  onDelete,
  onEdit,
  onView,
}: {
  product: Product;
  image: string | null;
  categoryPath: string;
  onDelete: (id: number | string) => void;
  onEdit: (product: Product) => void;
  onView: (id: number | string) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="relative group">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image */}
        <div className="relative h-40 bg-gray-100 dark:bg-gray-700">
          <ImageWithFallback src={image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        {/* Details */}
        <div className="p-4 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-gray-900 dark:text-white mb-1">{product.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{categoryPath}</p>
          </div>

          {/* Dropdown toggle */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <button
            onClick={() => {
              onView(product.id);
              setDropdownOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          <button
            onClick={() => {
              onEdit(product);
              setDropdownOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => {
              onDelete(product.id);
              setDropdownOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
