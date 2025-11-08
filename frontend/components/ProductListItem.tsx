'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Edit, Trash2, Eye } from 'lucide-react';

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

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
}

interface ProductListItemProps {
  productGroup: ProductGroup;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  onView: (id: number) => void;
  onSelect?: (variant: ProductVariant) => void;
  selectable?: boolean;
}

export default function ProductListItem({
  productGroup,
  onDelete,
  onEdit,
  onView,
  onSelect,
  selectable,
}: ProductListItemProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showVariations, setShowVariations] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
          setShowDropdown(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX - 180
      });
    }
    setShowDropdown(!showDropdown);
  };

  // Group variants by color
  const variantsByColor = productGroup.variants.reduce((acc, variant) => {
    const color = variant.color || 'No Color';
    if (!acc[color]) {
      acc[color] = [];
    }
    acc[color].push(variant);
    return acc;
  }, {} as Record<string, ProductVariant[]>);

  const hasMultipleVariants = productGroup.totalVariants > 1;
  const firstVariant = productGroup.variants[0];

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 p-4">
        {/* Product Image */}
        <button
          type="button"
          onClick={() => onView(firstVariant.id)}
          className="flex-shrink-0 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
          aria-label={`View ${productGroup.baseName}`}
        >
          <img
            src={productGroup.primaryImage || ERROR_IMG_SRC}
            alt={productGroup.baseName}
            className="w-20 h-20 object-cover"
            onError={(e) => {
              e.currentTarget.src = ERROR_IMG_SRC;
            }}
          />
        </button>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-gray-900 dark:text-white truncate mb-1">
            {productGroup.baseName}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="truncate">{productGroup.categoryPath}</span>
            <span>•</span>
            <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {productGroup.sku}
            </span>
          </div>
          {hasMultipleVariants && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {productGroup.totalVariants} variants ({Object.keys(variantsByColor).length} colors)
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* View Variations Button */}
          {hasMultipleVariants && (
            <button
              onClick={() => setShowVariations(!showVariations)}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap"
            >
              {showVariations ? 'Hide' : 'View'} Variations ({productGroup.totalVariants})
            </button>
          )}

          {/* Select button (only for single variant products in select mode) */}
          {onSelect && !hasMultipleVariants && (
            <button
              onClick={() => onSelect(firstVariant)}
              className="px-3 py-1.5 text-sm bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              Select
            </button>
          )}

          {/* Dropdown menu */}
          <button
            ref={buttonRef}
            onClick={handleMenuClick}
            className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>

          {showDropdown &&
            createPortal(
              <div
                ref={dropdownRef}
                className="fixed w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 py-2"
                style={{
                  top: `${dropdownPos.top}px`,
                  left: `${dropdownPos.left}px`
                }}
              >
                <button
                  onClick={() => {
                    onView(firstVariant.id);
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                <button
                  onClick={() => {
                    onEdit(firstVariant.id);
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete ${hasMultipleVariants ? 'all variants of' : ''} "${productGroup.baseName}"?`)) {
                      // Delete all variants in the group
                      productGroup.variants.forEach(v => onDelete(v.id));
                    }
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete {hasMultipleVariants ? 'All' : ''}
                </button>
              </div>,
              document.body
            )}
        </div>
      </div>

      {/* Variations Dropdown */}
      {showVariations && hasMultipleVariants && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Available Variations
          </h4>
          <div className="space-y-3">
            {Object.entries(variantsByColor).map(([color, variants]) => (
              <div key={color} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  {variants[0].image && (
                    <img
                      src={variants[0].image}
                      alt={color}
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = ERROR_IMG_SRC;
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {color}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {variants.length} size{variants.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {variant.size || 'N/A'}
                      </span>
                      {onSelect && (
                        <button
                          onClick={() => onSelect(variant)}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}