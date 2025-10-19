'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Upload, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

// --- Types -----------------------------------------------------------------
interface Field {
  id: number;
  name: string;
  type: string;
  mode?: string;
}

interface Category {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  image?: string;
  subcategories?: Category[];
}

interface FieldValue {
  fieldId: number;
  fieldName: string;
  fieldType: string;
  value: any;
  instanceId: string;
}

interface VariationFieldConfig {
  fieldId: number;
  fieldName: string;
  fieldType: string;
}

interface VariationData {
  id: string;
  values: Record<string, any>;
}

// --- Component -------------------------------------------------------------
export default function AddEditProductPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(v => !v);
  const [activeTab, setActiveTab] = useState<'general' | 'variations'>('general');

  // General Information Section
  const [formData, setFormData] = useState({
    name: '',
    mainImage: '',
    category: '',
    subcategory: ''
  });
  const [generalFields, setGeneralFields] = useState<FieldValue[]>([]);
  const [uploadingMain, setUploadingMain] = useState(false);

  // Variations Section
  const [variationFieldConfigs, setVariationFieldConfigs] = useState<VariationFieldConfig[]>([]);
  const [variations, setVariations] = useState<VariationData[]>([]);

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableFields, setAvailableFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const fetchPromises = [
          fetch('/api/fields'),
          fetch('/api/categories')
        ];

        const responses = await Promise.all(fetchPromises);
        const [fieldsRes, categoriesRes] = responses;

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

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ========== GENERAL INFORMATION SECTION ==========
  const addGeneralField = (field: Field) => {
    const instanceId = `gen-${field.id}-${Date.now()}-${Math.random()}`;
    const newFieldValue: FieldValue = {
      fieldId: field.id,
      fieldName: field.name,
      fieldType: field.type,
      value: field.type === 'image' ? [] : '',
      instanceId
    };
    setGeneralFields([...generalFields, newFieldValue]);
  };

  const removeGeneralField = (instanceId: string) => {
    setGeneralFields(generalFields.filter(f => f.instanceId !== instanceId));
  };

  const updateGeneralFieldValue = (instanceId: string, value: any) => {
    setGeneralFields(generalFields.map(f => 
      f.instanceId === instanceId ? { ...f, value } : f
    ));
  };

  const uploadImageHelper = async (file: File): Promise<string | null> => {
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data.url || null;
    } catch (e) {
      console.error('Upload error', e);
      return null;
    }
  };

  const handleGeneralImageUpload = async (file: File, isMainImage: boolean, instanceId: string = '') => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    if (isMainImage) setUploadingMain(true);

    try {
      const url = await uploadImageHelper(file);
      if (!url) throw new Error('Upload returned no url');

      if (isMainImage) {
        setFormData(prev => ({ ...prev, mainImage: url }));
      } else if (instanceId) {
        setGeneralFields(prev => prev.map(f => {
          if (f.instanceId === instanceId) {
            const newValue = Array.isArray(f.value) ? [...f.value, url] : url;
            return { ...f, value: newValue };
          }
          return f;
        }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      if (isMainImage) setUploadingMain(false);
    }
  };

  // ========== VARIATION SECTION ==========
  const addVariationField = (field: Field) => {
    if (!variationFieldConfigs.find(vf => vf.fieldId === field.id)) {
      setVariationFieldConfigs([...variationFieldConfigs, {
        fieldId: field.id,
        fieldName: field.name,
        fieldType: field.type
      }]);
    }
  };

  const removeVariationField = (fieldId: number) => {
    setVariationFieldConfigs(variationFieldConfigs.filter(vf => vf.fieldId !== fieldId));
    setVariations(variations.map(v => {
      const newValues = { ...v.values };
      const fieldConfig = variationFieldConfigs.find(vf => vf.fieldId === fieldId);
      if (fieldConfig) delete newValues[fieldConfig.fieldName];
      return { ...v, values: newValues };
    }));
  };

  const addVariation = () => {
    const newVarId = `var-${Date.now()}-${Math.random()}`;
    const values: Record<string, any> = {};
    variationFieldConfigs.forEach(config => {
      values[config.fieldName] = config.fieldType === 'image' ? [] : '';
    });
    setVariations([...variations, { id: newVarId, values }]);
  };

  const removeVariation = (varId: string) => {
    setVariations(variations.filter(v => v.id !== varId));
  };

  const updateVariationValue = (varId: string, fieldName: string, value: any) => {
    setVariations(variations.map(v => 
      v.id === varId ? { ...v, values: { ...v.values, [fieldName]: value } } : v
    ));
  };

  const handleVariationImageUpload = async (file: File, varId: string, fieldName: string) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    const url = await uploadImageHelper(file);
    if (url) {
      setVariations(prev => prev.map(v => {
        if (v.id === varId) {
          const currentImages = Array.isArray(v.values[fieldName]) ? v.values[fieldName] : [];
          return {
            ...v,
            values: { ...v.values, [fieldName]: [...currentImages, url] }
          };
        }
        return v;
      }));
    }
  };

  const removeVariationImage = (varId: string, fieldName: string, imgUrl: string) => {
    setVariations(prev => prev.map(v => {
      if (v.id === varId) {
        const images = (v.values[fieldName] || []).filter((img: string) => img !== imgUrl);
        return { ...v, values: { ...v.values, [fieldName]: images } };
      }
      return v;
    }));
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
      // Build base attributes
      const baseAttributes: Record<string, any> = {
        mainImage: formData.mainImage,
        category: formData.category,
        subcategory: formData.subcategory
      };

      // Add general fields
      generalFields.forEach(gf => {
        baseAttributes[gf.fieldName] = gf.value;
      });

      const savePromises = [];

      if (variations.length > 0) {
        // Save each variation as a separate product
        variations.forEach((variation, idx) => {
          const varProduct = {
            id: Date.now() + idx,
            name: `${formData.name} - Variation ${idx + 1}`,
            attributes: {
              ...baseAttributes,
              ...variation.values
            }
          };

          savePromises.push(
            fetch('/api/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(varProduct)
            })
          );
        });
      } else {
        // Save single product
        const product = {
          id: Date.now(),
          name: formData.name,
          attributes: baseAttributes
        };

        savePromises.push(
          fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
          })
        );
      }

      const results = await Promise.all(savePromises);
      const allSuccess = results.every(res => res.ok);

      if (allSuccess) {
        const count = variations.length > 0 ? variations.length : 1;
        alert(`Successfully saved ${count} product(s)!`);
      } else {
        alert('Some products failed to save');
      }
    } catch (error) {
      console.error('Error saving products:', error);
      alert('Failed to save product');
    }
  };

  const selectedCategory = categories.find(c => c.id === formData.category);

  const renderFieldValue = (field: FieldValue) => {
    const { instanceId, fieldType, value } = field;

    switch (fieldType.toLowerCase()) {
      case 'text':
      case 'number':
        return (
          <input
            type={fieldType === 'number' ? 'number' : 'text'}
            value={value || ''}
            onChange={(e) => updateGeneralFieldValue(instanceId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder={`Enter ${field.fieldName.toLowerCase()}`}
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
                  if (file) handleGeneralImageUpload(file, false, instanceId);
                }}
                className="hidden"
              />
            </label>

            {Array.isArray(value) && value.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {value.map((img: string, idx: number) => (
                  <div key={idx} className="relative">
                    <img src={img} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600" />
                    <button
                      type="button"
                      onClick={() => updateGeneralFieldValue(instanceId, value.filter((_: any, i: number) => i !== idx))}
                      className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-600 dark:text-gray-400">Loading...</div>;
  }

  return (
    <div className={`${darkMode ? 'dark' : ''} flex h-screen`}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Tabs */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Add New Product</h1>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-300 dark:border-gray-700 mb-8">
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
          <button
            onClick={() => setActiveTab('variations')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'variations'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            Add Variations
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* ========== GENERAL INFORMATION TAB ========== */}
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter product name"
                />
              </div>

              {/* Main Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Main Image <span className="text-red-500">*</span>
                </label>
                <label className="cursor-pointer block">
                  <div className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                    <Upload className="w-5 h-5" />
                    <span className="text-sm">{uploadingMain ? 'Uploading...' : 'Choose Main Image'}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleGeneralImageUpload(file, true);
                    }}
                    disabled={uploadingMain}
                    className="hidden"
                  />
                </label>

                {formData.mainImage && (
                  <div className="mt-3 relative">
                    <img src={formData.mainImage} alt="Main preview" className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600" />
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

              {/* Category */}
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
                    <option key={cat.id} value={cat.id}>{cat.title}</option>
                  ))}
                </select>
              </div>

              {/* Subcategory */}
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
                      <option key={subcat.id} value={subcat.id}>{subcat.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dynamic General Fields */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Fields</h3>
                
                {generalFields.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No additional fields added yet.</p>
                ) : (
                  <div className="space-y-4 mb-4">
                    {generalFields.map((field) => (
                      <div key={field.instanceId}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {field.fieldName}
                          </label>
                          <button
                            type="button"
                            onClick={() => removeGeneralField(field.instanceId)}
                            className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {renderFieldValue(field)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Available Fields to Add */}
                <div className="border-t border-gray-300 dark:border-gray-700 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Select fields to add:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableFields
                      .filter(f => !generalFields.find(gf => gf.fieldId === f.id))
                      .map((field) => (
                        <button
                          key={field.id}
                          type="button"
                          onClick={() => addGeneralField(field)}
                          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          {field.name}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== ADD VARIATIONS TAB ========== */}
          {activeTab === 'variations' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Variation Fields</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Select which fields will be used for variations. Each variation will allow you to set unique values for these fields.
                </p>

                {/* Available Fields to Add as Variation Fields */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Select fields:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableFields
                      .filter(f => !variationFieldConfigs.find(vc => vc.fieldId === f.id))
                      .map((field) => (
                        <button
                          key={field.id}
                          type="button"
                          onClick={() => addVariationField(field)}
                          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          {field.name}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Selected Variation Fields */}
                {variationFieldConfigs.length > 0 && (
                  <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Selected Fields:</h4>
                    <div className="flex flex-wrap gap-2">
                      {variationFieldConfigs.map((config) => (
                        <div
                          key={config.fieldId}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg"
                        >
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{config.fieldName}</span>
                          <button
                            type="button"
                            onClick={() => removeVariationField(config.fieldId)}
                            className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Variations */}
              {variationFieldConfigs.length > 0 && (
                <div className="border-t border-gray-300 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Variations</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Each variation will be saved as: "{formData.name || 'Product'} - Variation 1", "{formData.name || 'Product'} - Variation 2", etc.
                  </p>

                  {variations.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No variations yet. Click "Add Variation" to create one.</p>
                  ) : null}

                  <div className="space-y-4 mb-4">
                    {variations.map((variation, varIdx) => (
                      <div key={variation.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-300 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Variation {varIdx + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeVariation(variation.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {variationFieldConfigs.map((config) => (
                            <div key={config.fieldId}>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {config.fieldName}
                              </label>

                              {config.fieldType.toLowerCase() === 'image' ? (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    {(variation.values[config.fieldName] || []).map((imgUrl: string, imgIdx: number) => (
                                      <div key={imgIdx} className="relative">
                                        <img
                                          src={imgUrl}
                                          alt="Variation"
                                          className="w-20 h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeVariationImage(variation.id, config.fieldName, imgUrl)}
                                          className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}

                                    <label className="cursor-pointer w-20 h-20 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                                      <Plus className="w-6 h-6 text-gray-400" />
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleVariationImageUpload(file, variation.id, config.fieldName);
                                          e.target.value = '';
                                        }}
                                      />
                                    </label>
                                  </div>
                                </div>
                              ) : (
                                <input
                                  type={config.fieldType === 'number' ? 'number' : 'text'}
                                  value={variation.values[config.fieldName] || ''}
                                  onChange={(e) => updateVariationValue(variation.id, config.fieldName, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                  placeholder={`Enter ${config.fieldName.toLowerCase()}`}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addVariation}
                    className="w-full py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium transition-colors"
                  >
                    Add Another Variation
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => {
              setFormData({ name: '', mainImage: '', category: '', subcategory: '' });
              setGeneralFields([]);
              setVariationFieldConfigs([]);
              setVariations([]);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium transition-colors"
          >
            Save Product{variations.length > 0 ? `s (${variations.length})` : ''}
          </button>
                    </div>
          </div>
        </main>
      </div>
    </div>
  );
}