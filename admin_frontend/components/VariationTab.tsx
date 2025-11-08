import { Plus, X, Trash2 } from 'lucide-react';

export interface VariationData {
  id: string;
  color: string;
  images: File[];
  imagePreviews: string[];
  sizes: string[];
}

interface VariationTabProps {
  variations: VariationData[];
  setVariations: React.Dispatch<React.SetStateAction<VariationData[]>>;
  baseSku: string;
  baseProductName: string;
  setToast: (toast: { message: string; type: 'success' | 'error' | 'warning' } | null) => void;
}

export default function VariationTab({
  variations,
  setVariations,
  baseSku,
  baseProductName,
  setToast,
}: VariationTabProps) {
  
  const addVariation = () => {
    const newVarId = `var-${Date.now()}-${Math.random()}`;
    setVariations([...variations, {
      id: newVarId,
      color: '',
      images: [],
      imagePreviews: [],
      sizes: [],
    }]);
  };

  const removeVariation = (varId: string) => {
    setVariations(variations.filter(v => v.id !== varId));
  };

  const updateVariationColor = (varId: string, color: string) => {
    setVariations(variations.map(v =>
      v.id === varId ? { ...v, color } : v
    ));
  };

  const addSize = (varId: string) => {
    setVariations(variations.map(v =>
      v.id === varId ? { ...v, sizes: [...v.sizes, ''] } : v
    ));
  };

  const removeSize = (varId: string, sizeIndex: number) => {
    setVariations(variations.map(v =>
      v.id === varId ? { ...v, sizes: v.sizes.filter((_, i) => i !== sizeIndex) } : v
    ));
  };

  const updateSizeValue = (varId: string, sizeIndex: number, size: string) => {
    setVariations(variations.map(v =>
      v.id === varId ? { ...v, sizes: v.sizes.map((s, i) => i === sizeIndex ? size : s) } : v
    ));
  };

  const handleVariationImageChange = (varId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setToast({ message: `${file.name} is not an image file`, type: 'error' });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: `${file.name} is too large (max 5MB)`, type: 'error' });
        return false;
      }
      return true;
    });

    setVariations(variations.map(v => {
      if (v.id !== varId) return v;
      
      const newImages = [...v.images, ...validFiles];

      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setVariations(prev => prev.map(pv => {
            if (pv.id !== varId) return pv;
            return {
              ...pv,
              imagePreviews: [...pv.imagePreviews, reader.result as string]
            };
          }));
        };
        reader.readAsDataURL(file);
      });

      return { ...v, images: newImages };
    }));
  };

  const removeVariationImage = (varId: string, imageIndex: number) => {
    setVariations(variations.map(v => {
      if (v.id !== varId) return v;
      return {
        ...v,
        images: v.images.filter((_, i) => i !== imageIndex),
        imagePreviews: v.imagePreviews.filter((_, i) => i !== imageIndex)
      };
    }));
  };

  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Product Variations
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Create variations with different colors and sizes. Each color has one set of images shared across all sizes.
        </p>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
            How Variations Work:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>
              • All variations will share the SAME base SKU: "<strong>{baseSku || 'Enter SKU in General tab'}</strong>"
            </li>
            <li>
              • Each color has ONE set of images shared by all sizes
            </li>
            <li>
              • Products will be named: "<strong>{baseProductName || 'Product'} - Blue - S</strong>"
            </li>
            <li>
              • Example: Blue with sizes S, M, L = 3 products with the same SKU and blue images
            </li>
          </ul>
        </div>
      </div>

      {/* Empty State */}
      {variations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No variations yet. Click "Add Color Variation" to create one.
          </p>
        </div>
      ) : (
        /* Variations List */
        <div className="space-y-4">
          {variations.map((variation, varIdx) => (
            <div
              key={variation.id}
              className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-300 dark:border-gray-600"
            >
              {/* Variation Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Color Variation {varIdx + 1}: {variation.color || 'Unnamed'}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {variation.sizes.length} size(s) • {variation.images.length} image(s)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeVariation(variation.id)}
                  className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  aria-label="Remove variation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Color Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={variation.color}
                    onChange={(e) => updateVariationColor(variation.id, e.target.value)}
                    placeholder="e.g., Blue, Red, Black"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Color Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Images for {variation.color || 'this color'} <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    These images will be used for all sizes of this color
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {/* Image Previews */}
                    {variation.imagePreviews.map((preview, imgIdx) => (
                      <div key={imgIdx} className="relative">
                        <img
                          src={preview}
                          alt={`${variation.color} ${imgIdx + 1}`}
                          className="w-20 h-20 object-cover rounded border border-gray-300 dark:border-gray-600"
                        />
                        {imgIdx === 0 && (
                          <div className="absolute -top-1 -left-1 bg-blue-500 text-white text-[10px] px-1 rounded">
                            Main
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeVariationImage(variation.id, imgIdx)}
                          className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                          aria-label="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Upload Button */}
                    <label className="cursor-pointer w-20 h-20 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                      <Plus className="w-6 h-6 text-gray-400" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleVariationImageChange(variation.id, e)}
                      />
                    </label>
                  </div>
                </div>

                {/* Sizes Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Available Sizes <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => addSize(variation.id)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Size
                    </button>
                  </div>

                  {variation.sizes.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-3 rounded">
                      No sizes added. Click "Add Size" to add sizes for this color.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {variation.sizes.map((size, sizeIdx) => (
                        <div
                          key={sizeIdx}
                          className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600"
                        >
                          <select
                            value={size}
                            onChange={(e) => updateSizeValue(variation.id, sizeIdx, e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">Select</option>
                            {availableSizes.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeSize(variation.id, sizeIdx)}
                            className="text-red-500 hover:text-red-600 p-1"
                            aria-label="Remove size"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Variation Button */}
      <button
        type="button"
        onClick={addVariation}
        className="w-full py-3 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Color Variation
      </button>
    </div>
  );
}