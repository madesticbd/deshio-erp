'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Plus, X, Upload, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

interface Field {
  id: number;
  name: string;
  type: string;
}

interface Category {
  id: string;
  title: string;
  description: string;
  slug: string;
  image: string;
  subcategories?: Category[];
}

interface Product {
  id: number | string;
  name: string;
  attributes: Record<string, any>;
}

interface FieldInstance {
  field: Field;
  instanceId: string;
}

export default function AddEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const productId = params?.id || searchParams?.get('id');
  const isEditMode = !!productId;

  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mainImage: '',
    category: '',
    subcategory: ''
  });
  const [fieldInstances, setFieldInstances] = useState<FieldInstance[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableFields, setAvailableFields] = useState<Field[]>([]);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [loading, setLoading] = useState(true);
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const fetchPromises = [
          fetch('/api/fields'),
          fetch('/api/categories')
        ];

        if (isEditMode) {
          fetchPromises.push(fetch(`/api/products/${productId}`));
        }

        const responses = await Promise.all(fetchPromises);
        const [fieldsRes, categoriesRes, productRes] = responses;

        let fieldsData: Field[] = [];
        if (fieldsRes.ok) {
          const data = await fieldsRes.json();
          fieldsData = Array.isArray(data) ? data : [];
        } else {
          console.error('Failed to fetch fields:', fieldsRes.statusText);
        }

        let categoriesData: Category[] = [];
        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          categoriesData = Array.isArray(data) ? data : [];
        } else {
          console.error('Failed to fetch categories:', categoriesRes.statusText);
        }

        setAvailableFields(fieldsData);
        setCategories(categoriesData);

        if (isEditMode && productRes) {
          if (productRes.ok) {
            const productData: Product = await productRes.json();
            setOriginalProduct(productData);
            
            setFormData({
              name: productData.name,
              mainImage: productData.attributes.mainImage || '',
              category: productData.attributes.category || '',
              subcategory: productData.attributes.subcategory || ''
            });

            const loadedInstances: FieldInstance[] = [];
            const loadedValues: Record<string, any> = {};

            Object.entries(productData.attributes).forEach(([key, value]) => {
              if (['mainImage', 'category', 'subcategory'].includes(key)) return;

              const field = fieldsData.find(f => f.name === key);
              if (field) {
                // Handle comma-separated values for non-image fields
                if (field.type.toLowerCase() !== 'image' && typeof value === 'string' && value.includes(',')) {
                  const values = value.split(',').map((v: string) => v.trim());
                  values.forEach((val: string) => {
                    const instanceId = `${field.id}-${Date.now()}-${Math.random()}`;
                    loadedInstances.push({ field, instanceId });
                    loadedValues[instanceId] = val;
                  });
                } else {
                  const instanceId = `${field.id}-${Date.now()}-${Math.random()}`;
                  loadedInstances.push({ field, instanceId });
                  loadedValues[instanceId] = value;
                }
              }
            });

            setFieldInstances(loadedInstances);
            setFieldValues(loadedValues);
          } else {
            alert('Product not found');
            router.push('/product/list');
            return;
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        if (isEditMode) {
          alert('Failed to load product data');
          router.push('/product/list');
        } else {
          setAvailableFields([]);
          setCategories([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isEditMode, productId, router]);

  const handleAddFieldInstance = (field: Field) => {
    const instanceId = `${field.id}-${Date.now()}-${Math.random()}`;
    setFieldInstances([...fieldInstances, { field, instanceId }]);
  };

  const handleRemoveFieldInstance = (instanceId: string) => {
    setFieldInstances(fieldInstances.filter(fi => fi.instanceId !== instanceId));
    const newFieldValues = { ...fieldValues };
    delete newFieldValues[instanceId];
    setFieldValues(newFieldValues);
  };

  const handleFieldValueChange = (instanceId: string, value: any) => {
    setFieldValues({ ...fieldValues, [instanceId]: value });
  };

  const handleImageUpload = async (file: File, isMainImage = false, instanceId: string = '') => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    if (isMainImage) {
      setUploadingMain(true);
    }

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      if (isMainImage) {
        setFormData(prev => ({ ...prev, mainImage: data.url }));
      } else if (instanceId) {
        handleFieldValueChange(instanceId, data.url);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      if (isMainImage) {
        setUploadingMain(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Product name is required');
      return;
    }
    
    if (!formData.mainImage) {
      alert('Main image is required');
      return;
    }
    
    if (!formData.category) {
      alert('Category is required');
      return;
    }

    try {
      // Group values by field name
      const groupedAttributes: Record<string, any[]> = {};
      
      fieldInstances.forEach(({ field, instanceId }) => {
        const value = fieldValues[instanceId];
        if (value !== undefined && value !== '') {
          if (!groupedAttributes[field.name]) {
            groupedAttributes[field.name] = [];
          }
          groupedAttributes[field.name].push(value);
        }
      });

      // Convert grouped values to final format
      const mappedAttributes: Record<string, any> = {};
      Object.entries(groupedAttributes).forEach(([fieldName, values]) => {
        const field = availableFields.find(f => f.name === fieldName);
        // For images, store as array; for others, join with comma
        if (field && field.type.toLowerCase() === 'image') {
          mappedAttributes[fieldName] = values.length === 1 ? values[0] : values;
        } else {
          mappedAttributes[fieldName] = values.join(', ');
        }
      });

      const productData = {
        id: isEditMode ? originalProduct?.id : Date.now(),
        name: formData.name,
        attributes: {
          mainImage: formData.mainImage,
          category: formData.category,
          subcategory: formData.subcategory,
          ...mappedAttributes
        }
      };

      console.log('Submitting product:', productData);

      const url = isEditMode ? `/api/products/${productId}` : '/api/products';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        const successMessage = isEditMode ? 'Product updated successfully!' : 'Product added successfully!';
        router.push(`/product/list?success=${encodeURIComponent(successMessage)}`);
      } else {
        const errorData = await res.json();
        alert(`Failed to ${isEditMode ? 'update' : 'save'} product: ${errorData.details || errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert(`Failed to ${isEditMode ? 'update' : 'save'} product`);
    }
  };

  const renderFieldInstance = (fieldInstance: FieldInstance) => {
    const { field, instanceId } = fieldInstance;
    const value = fieldValues[instanceId] || '';

    switch (field.type.toLowerCase()) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldValueChange(instanceId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldValueChange(instanceId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        );
      
      case 'image':
        return (
          <div className="space-y-2">
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-sm">Choose Image</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, false, instanceId);
                }}
                className="hidden"
              />
            </label>
            
            {value && (
              <div className="relative">
                <img
                  src={value}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={() => handleFieldValueChange(instanceId, '')}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldValueChange(instanceId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        );
    }
  };

  const selectedCategory = categories.find(c => c.id === formData.category);

  return (
    <div className={`${darkMode ? 'dark' : ''} flex h-screen`}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />

        <main className="flex-1 overflow-hidden flex bg-gray-50 dark:bg-gray-900">
          {/* Main Form Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h2>

              {loading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Main Image <span className="text-red-500">*</span>
                    </label>
                    <label className="cursor-pointer block">
                      <div className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                        <Upload className="w-5 h-5" />
                        <span className="text-sm">
                          {uploadingMain ? 'Uploading...' : 'Choose Main Image'}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, true);
                        }}
                        disabled={uploadingMain}
                        className="hidden"
                      />
                    </label>
                    
                    {formData.mainImage && (
                      <div className="mt-3 relative">
                        <img
                          src={formData.mainImage}
                          alt="Main preview"
                          className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, mainImage: '' })}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Subcategory (Optional)
                      </label>
                      <select
                        value={formData.subcategory}
                        onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select a subcategory (optional)</option>
                        {selectedCategory.subcategories.map((subcat) => (
                          <option key={subcat.id} value={subcat.id}>
                            {subcat.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Dynamic Field Instances */}
                  {fieldInstances.map((fieldInstance) => (
                    <div key={fieldInstance.instanceId} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {fieldInstance.field.name}
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveFieldInstance(fieldInstance.instanceId)}
                          className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {renderFieldInstance(fieldInstance)}
                    </div>
                  ))}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => router.push('/product/list')}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={uploadingMain}
                      className="flex-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isEditMode ? 'Update Product' : 'Save Product'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fields Sidebar */}
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Available Fields
            </h3>
            <div className="space-y-2">
              {availableFields.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No fields available
                </div>
              ) : (
                availableFields.map((field) => (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => handleAddFieldInstance(field)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors group"
                  >
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {field.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {field.type}
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                  </button>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}