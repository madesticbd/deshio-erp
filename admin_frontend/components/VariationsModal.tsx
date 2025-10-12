import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

interface Product {
  id: number | string;
  name: string;
  attributes: Record<string, any>;
  variations?: {
    id: string | number;
    attributes: Record<string, any>;
  }[];
}

interface VariationsModalProps {
  product: Product;
  mainImage: string | null;
  onClose: () => void;
  onSelectVariation?: (product: Product, variation: { id: string | number; attributes: Record<string, any> }) => void;
}

export default function VariationsModal({
  product,
  mainImage,
  onClose,
  onSelectVariation,
}: VariationsModalProps) {
  const [quantities, setQuantities] = useState<Record<string | number, number>>({});

  useEffect(() => {
    const initial: Record<string | number, number> = {};
    product.variations?.forEach((v) => {
      initial[v.id] = 0;
    });
    setQuantities(initial);
  }, [product.variations]);

  const isImageKey = (key: string) =>
    key.toLowerCase().includes('image') || key.toLowerCase().includes('img');

  if (!product.variations || product.variations.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Variations for {product.name}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">
            No variations found for this product.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Get attribute keys from first variation (excluding images)
  const attributeKeys = Object.keys(product.variations[0].attributes).filter(
    (key) => !isImageKey(key)
  );

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[70vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Variations for {product.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Image
                  </th>
                  {attributeKeys.map((key) => (
                    <th
                      key={key}
                      className="text-left py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 capitalize"
                    >
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                  {onSelectVariation && (
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {product.variations.map((variation) => (
                  <tr
                    key={variation.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="py-2 px-4">
                      <ImageWithFallback
                        src={mainImage || ERROR_IMG_SRC}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                      />
                    </td>
                    {attributeKeys.map((key) => (
                      <td
                        key={key}
                        className="py-2 px-4 text-sm text-gray-900 dark:text-white"
                      >
                        {String(variation.attributes[key] || '-')}
                      </td>
                    ))}
                    {onSelectVariation && (
                      <td className="py-2 px-4">
                        <button
                          onClick={() => onSelectVariation(product, variation)}
                          className="px-3 py-1.5 text-sm bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors whitespace-nowrap"
                        >
                          Select
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}