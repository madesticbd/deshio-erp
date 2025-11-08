'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, X, Upload, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';
import { productService, Field } from '@/services/productService';
import { categoryService, Category } from '@/services/categoryService';
import { vendorService, Vendor } from '@/services/vendorService';

interface FieldValue {
  fieldId: number;
  fieldName: string;
  fieldType: string;
  value: any;
  instanceId: string;
}

interface CategorySelectionState {
  [key: string]: string;
}

interface VariationData {
  id: string;
  color: string;
  images: File[];
  imagePreviews: string[];
  sizes: string[];
}

// Field IDs that are automatically set for variations - prevent duplicates
const VARIATION_FIELD_IDS = [6, 7, 15, 16]; // Color, Size, Variation Group, Is Variation

export default function AddEditProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');
  const isEditMode = !!productId;

  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'variations'>('general');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
  });

  const [categorySelection, setCategorySelection] = useState<CategorySelectionState>({});
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [primaryImage, setPrimaryImage] = useState<File | null>(null);
  const [primaryImagePreview, setPrimaryImagePreview] = useState<string>('');

  // Dynamic Fields
  const [availableFields, setAvailableFields] = useState<Field[]>([]);
  const [selectedFields, setSelectedFields] = useState<FieldValue[]>([]);

  // Variations
  const [variations, setVariations] = useState<VariationData[]>([]);

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (isEditMode && productId && availableFields.length > 0) {
      fetchProduct();
    }
  }, [isEditMode, productId, availableFields]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch fields
      try {
        const fieldsData = await productService.getAvailableFields();
        setAvailableFields(Array.isArray(fieldsData) ? fieldsData : []);
      } catch (error) {
        console.error('Failed to fetch fields:', error);
        setAvailableFields([]);
      }

      // Fetch categories
      try {
        const categoriesData = await categoryService.getAll();
        const categoriesList = Array.isArray(categoriesData) ? categoriesData : [];
        setCategories(categoriesList);
        
        if (categoriesList.length === 0) {
          setToast({ 
            message: 'No categories found. Please create categories first.', 
            type: 'warning' 
          });
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]);
      }

      // Fetch vendors - FIXED
      try {
        const vendorsData = await vendorService.getAll({ is_active: true });
        const vendorsList = Array.isArray(vendorsData) ? vendorsData : [];
        setVendors(vendorsList);
        
        if (vendorsList.length === 0) {
          setToast({ 
            message: 'No vendors found. Please create vendors first.', 
            type: 'warning' 
          });
        }
      } catch (error) {
        console.error('Failed to fetch vendors:', error);
        setVendors([]);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      setToast({ message: 'Failed to load page data. Please refresh.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProduct = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      const product = await productService.getById(productId);

      setFormData({
        name: product.name,
        sku: product.sku,
        description: product.description || '',
      });

      setSelectedVendorId(String(product.vendor_id));
      setCategorySelection({ level0: String(product.category_id) });

      if (product.images && product.images.length > 0) {
        const primaryImg = product.images.find(img => img.is_primary);
        if (primaryImg) {
          const imageUrl = primaryImg.image_path.startsWith('http')
            ? primaryImg.image_path
            : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${primaryImg.image_path}`;
          setPrimaryImagePreview(imageUrl);
        }
      }

      if (product.custom_fields) {
        const fields: FieldValue[] = product.custom_fields
          .filter(cf => {
            return !['Primary Image', 'Additional Images', 'SKU', 'Product Name', 'Description', 'Category', 'Vendor'].includes(cf.field_title);
          })
          .map(cf => ({
            fieldId: cf.field_id,
            fieldName: cf.field_title,
            fieldType: cf.field_type,
            value: cf.value,
            instanceId: `field-${cf.field_id}-${Date.now()}`,
          }));
        setSelectedFields(fields);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      setToast({ message: 'Failed to load product', type: 'error' });
      router.push('/product/list');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryPathArray = (): string[] => {
    const path: string[] = [];
    let level = 0;

    while (categorySelection[`level${level}`]) {
      path.push(categorySelection[`level${level}`]);
      level++;
    }

    return path;
  };

  const getCategoryPathDisplay = (): string => {
    const path = getCategoryPathArray();
    const names: string[] = [];
    let current: Category[] = categories;

    for (const id of path) {
      const cat = current.find(c => String(c.id) === String(id));
      if (cat) {
        names.push(cat.title);
        current = cat.subcategories || [];
      }
    }

    return names.join(' > ') || 'None selected';
  };

  const handlePrimaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please select an image file', type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Image must be less than 5MB', type: 'error' });
      return;
    }

    setPrimaryImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPrimaryImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addField = (field: Field) => {
    const instanceId = `field-${field.id}-${Date.now()}-${Math.random()}`;
    const newFieldValue: FieldValue = {
      fieldId: field.id,
      fieldName: field.title,
      fieldType: field.type,
      value: field.type === 'file' ? [] : '',
      instanceId,
    };
    setSelectedFields([...selectedFields, newFieldValue]);
  };

  const removeField = (instanceId: string) => {
    setSelectedFields(selectedFields.filter(f => f.instanceId !== instanceId));
  };

  const updateFieldValue = (instanceId: string, value: any) => {
    setSelectedFields(selectedFields.map(f =>
      f.instanceId === instanceId ? { ...f, value } : f
    ));
  };

  // Variation functions
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

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setToast({ message: 'Product name is required', type: 'error' });
      return false;
    }

    if (!formData.sku.trim()) {
      setToast({ message: 'SKU is required', type: 'error' });
      return false;
    }

    const categoryPath = getCategoryPathArray();
    if (categoryPath.length === 0) {
      setToast({ message: 'Please select a category', type: 'error' });
      return false;
    }

    if (!selectedVendorId) {
      setToast({ message: 'Please select a vendor', type: 'error' });
      return false;
    }

    if (!isEditMode && !primaryImage && variations.length === 0) {
      setToast({ message: 'Primary image is required', type: 'error' });
      return false;
    }

    if (variations.length > 0) {
      for (const variation of variations) {
        if (!variation.color.trim()) {
          setToast({ message: 'All variations must have a color', type: 'error' });
          return false;
        }

        if (variation.images.length === 0) {
          setToast({ message: `Variation "${variation.color}" must have at least one image`, type: 'error' });
          return false;
        }

        if (variation.sizes.length === 0) {
          setToast({ message: `Variation "${variation.color}" must have at least one size`, type: 'error' });
          return false;
        }

        for (const size of variation.sizes) {
          if (!size.trim()) {
            setToast({ message: `All sizes in variation "${variation.color}" must be specified`, type: 'error' });
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const categoryPath = getCategoryPathArray();
      const finalCategoryId = parseInt(categoryPath[categoryPath.length - 1]);

      const customFields = selectedFields.map(f => ({
        field_id: f.fieldId,
        value: f.value,
      }));

      if (isEditMode) {
        await productService.update(parseInt(productId!), {
          name: formData.name,
          sku: formData.sku,
          description: formData.description,
          category_id: finalCategoryId,
          vendor_id: parseInt(selectedVendorId),
          custom_fields: customFields,
        });

        setToast({ message: 'Product updated successfully!', type: 'success' });
        setTimeout(() => router.push('/product/list'), 1500);
      } else {
        const baseData = {
          name: formData.name,
          sku: formData.sku,
          description: formData.description,
          category_id: finalCategoryId,
          vendor_id: parseInt(selectedVendorId),
        };

        if (variations.length > 0) {
          // Find Color and Size fields dynamically
          const colorField = availableFields.find(f => f.title === 'Color');
          const sizeField = availableFields.find(f => f.title === 'Size');

          if (!colorField || !sizeField) {
            setToast({ 
              message: 'Color and Size fields must exist in Fields table to create variations', 
              type: 'error' 
            });
            setLoading(false);
            return;
          }

          // Create variations - same SKU for all
          const createdProducts = [];

          for (const variation of variations) {
            for (const size of variation.sizes) {
              const variationName = `${baseData.name} - ${variation.color} - ${size}`;
              
              // Upload images
              const imageUrls: string[] = [];
              for (const imageFile of variation.images) {
                try {
                  const imageUrl = await productService.uploadImage(imageFile);
                  if (imageUrl) imageUrls.push(imageUrl);
                } catch (error) {
                  console.error('Failed to upload image:', error);
                }
              }

              // FILTER OUT Color and Size fields to prevent duplicates
              const VARIATION_FIELD_IDS = [colorField.id, sizeField.id];
              const baseCustomFields = customFields.filter(
                cf => !VARIATION_FIELD_IDS.includes(cf.field_id)
              );

              // Create product with ONLY Color and Size variation fields
              const varCustomFields = [
                ...baseCustomFields,  // User's other fields
                { field_id: colorField.id, value: variation.color },  // Dynamic Color ID
                { field_id: sizeField.id, value: size }               // Dynamic Size ID
              ];

              const productData = {
                name: variationName,
                sku: baseData.sku, // SAME SKU for all variations
                description: baseData.description,
                category_id: baseData.category_id,
                vendor_id: baseData.vendor_id,
                custom_fields: varCustomFields,
              };

              const product = await productService.create(productData);

              // Attach images
              if (imageUrls.length > 0 && product.id) {
                for (let i = 0; i < imageUrls.length; i++) {
                  try {
                    await productService.addProductImage(product.id, {
                      image_path: imageUrls[i],
                      is_primary: i === 0,
                      order: i,
                    });
                  } catch (error) {
                    console.error('Failed to attach image:', error);
                  }
                }
              }

              createdProducts.push(product);
            }
          }

          setToast({ message: `Created ${createdProducts.length} product variation(s)!`, type: 'success' });
        } else {
          // Single product
          await productService.create({
            ...baseData,
            custom_fields: customFields,
          });
          setToast({ message: 'Product created successfully!', type: 'success' });
        }

        setTimeout(() => router.push('/product/list'), 1500);
      }
    } catch (error: any) {
      console.error('Failed to save product:', error);
      setToast({ message: error.message || 'Failed to save product', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const renderFieldInput = (field: FieldValue) => {
    const { instanceId, fieldType, fieldName, value } = field;
    const fieldDef = availableFields.find(f => f.id === field.fieldId);

    switch (fieldType.toLowerCase()) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <input
            type={fieldType}
            value={value || ''}
            onChange={(e) => updateFieldValue(instanceId, e.target.value)}
            placeholder={fieldDef?.placeholder || `Enter ${fieldName.toLowerCase()}`}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => updateFieldValue(instanceId, e.target.value)}
            placeholder={fieldDef?.placeholder || `Enter ${fieldName.toLowerCase()}`}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => updateFieldValue(instanceId, e.target.value)}
            placeholder={fieldDef?.placeholder || `Enter ${fieldName.toLowerCase()}`}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => updateFieldValue(instanceId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select {fieldName.toLowerCase()}</option>
            {fieldDef?.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value === 'true' || value === true}
              onChange={(e) => updateFieldValue(instanceId, e.target.checked ? 'true' : 'false')}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Yes</span>
          </label>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => updateFieldValue(instanceId, e.target.value)}
            placeholder={fieldDef?.placeholder || `Enter ${fieldName.toLowerCase()}`}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        );
    }
  };

  const getFlatCategories = (cats: Category[], depth = 0): { id: string; label: string; depth: number }[] => {
    return cats.reduce((acc: { id: string; label: string; depth: number }[], cat) => {
      const prefix = '—'.repeat(depth);
      acc.push({ id: cat.id, label: `${prefix} ${cat.title}`, depth });
      if (cat.subcategories && cat.subcategories.length > 0) {
        acc.push(...getFlatCategories(cat.subcategories, depth + 1));
      }
      return acc;
    }, []);
  };

  if (loading && !availableFields.length && !categories.length) {
    return (
      <div className={`${darkMode ? 'dark' : ''} flex h-screen`}>
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </main>
        </div>
      </div>
    );
  }

  const flatCategories = getFlatCategories(categories);

  return (
    <div className={`${darkMode ? 'dark' : ''} flex h-screen`}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isEditMode ? 'Edit Product' : 'Add New Product'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isEditMode ? 'Update product information' : 'Create a new product in your catalog'}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-300 dark:border-gray-700 mb-6">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'general'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                General Information
              </button>
              {!isEditMode && (
                <button
                  onClick={() => setActiveTab('variations')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'variations'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  Product Variations {variations.length > 0 && `(${variations.reduce((acc, v) => acc + v.sizes.length, 0)})`}
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {/* GENERAL TAB */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="e.g., PROD-001"
                      disabled={isEditMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {isEditMode && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        SKU cannot be changed after creation
                      </p>
                    )}
                    {!isEditMode && variations.length > 0 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        All {variations.reduce((acc, v) => acc + v.sizes.length, 0)} variations will use this same SKU
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter product description"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                    />
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={categorySelection.level0 || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setCategorySelection({ level0: e.target.value });
                        } else {
                          setCategorySelection({});
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select category</option>
                      {flatCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    {categorySelection.level0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Selected: {getCategoryPathDisplay()}
                      </p>
                    )}
                  </div>

                  {/* Vendor Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Vendor <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedVendorId}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select vendor</option>
                      {Array.isArray(vendors) && vendors.length > 0 ? (
                        vendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No vendors available</option>
                      )}
                    </select>
                    {vendors.length === 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        No vendors found. Please create a vendor first.
                      </p>
                    )}
                  </div>

                  {/* Primary Image - Only if NOT using variations */}
                  {!isEditMode && variations.length === 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Primary Image <span className="text-red-500">*</span>
                      </label>
                      <label className="cursor-pointer block">
                        <div className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                          <Upload className="w-5 h-5" />
                          <span className="text-sm">Choose Primary Image</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePrimaryImageChange}
                          className="hidden"
                        />
                      </label>

                      {primaryImagePreview && (
                        <div className="mt-3 relative">
                          <img
                            src={primaryImagePreview}
                            alt="Primary preview"
                            className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPrimaryImage(null);
                              setPrimaryImagePreview('');
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {variations.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-800 dark:text-blue-400">
                        <strong>Note:</strong> You're creating product variations. Upload images for each color in the "Product Variations" tab. Color and Size fields will be automatically set.
                      </p>
                    </div>
                  )}

                  {/* Additional Fields */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Fields</h3>

                    {selectedFields.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No additional fields added yet.</p>
                    ) : (
                      <div className="space-y-4 mb-4">
                        {selectedFields.map((field) => (
                          <div key={field.instanceId}>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {field.fieldName}
                              </label>
                              <button
                                type="button"
                                onClick={() => removeField(field.instanceId)}
                                className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            {renderFieldInput(field)}
                          </div>
                        ))}
                      </div>
                    )}

                    {availableFields.length > selectedFields.length && (
                      <div className="border-t border-gray-300 dark:border-gray-700 pt-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Select fields to add:</p>
                        <div className="flex flex-wrap gap-2">
                        {availableFields
                          .filter(f => !selectedFields.find(sf => sf.fieldId === f.id))
                          .filter(f => !['Primary Image', 'Additional Images', 'SKU', 'Product Name', 'Description', 'Category', 'Vendor', 'Color', 'Size'].includes(f.title))
                          // ↑ Only filter out Color and Size now (removed Variation Group and Is Variation)
                          .map((field) => (
                            <button
                              key={field.id}
                              type="button"
                              onClick={() => addField(field)}
                              className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              {field.title}
                            </button>
                          ))}
                      </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VARIATIONS TAB */}
              {activeTab === 'variations' && !isEditMode && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Product Variations</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Create variations with different colors and sizes. Each color has one set of images shared across all sizes.
                    </p>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">How Variations Work:</h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                        <li>• All variations will use the SAME SKU: "<strong>{formData.sku || 'Enter SKU in General tab'}</strong>"</li>
                        <li>• Each color has ONE set of images shared by all sizes</li>
                        <li>• Products will be named: "<strong>{formData.name || 'Product'} - Blue - S</strong>"</li>
                        <li>• Example: Blue with sizes S, M, L = 3 products with same blue images</li>
                      </ul>
                    </div>
                  </div>

                  {variations.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        No variations yet. Click "Add Color Variation" to create one.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {variations.map((variation, varIdx) => (
                        <div
                          key={variation.id}
                          className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-300 dark:border-gray-600"
                        >
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
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-4">
                            {/* Color Name */}
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
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}

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

                            {/* Sizes */}
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
                                        {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((s) => (
                                          <option key={s} value={s}>
                                            {s}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => removeSize(variation.id, sizeIdx)}
                                        className="text-red-500 hover:text-red-600 p-1"
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

                  <button
                    type="button"
                    onClick={addVariation}
                    className="w-full py-3 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Color Variation
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : isEditMode ? 'Update Product' : variations.length > 0 ? `Create ${variations.reduce((acc, v) => acc + v.sizes.length, 0)} Products` : 'Create Product'}
              </button>
            </div>
          </div>
        </main>
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