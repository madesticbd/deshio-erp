"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronRight, ChevronDown } from "lucide-react";

interface Category {
  id: string;
  title: string;
  description: string;
  slug: string;
  image: string;
  subcategories?: Category[];
}

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    category: Omit<Category, "id">, 
    parentId?: string | null, 
    oldParentId?: string | null,
    imageFile?: File
  ) => void;
  editCategory?: Category | null;
  parentId?: string | null;
  allCategories?: Category[];
}

export default function AddCategoryDialog({
  open,
  onOpenChange,
  onSave,
  editCategory,
  parentId: initialParentId,
  allCategories = [],
}: AddCategoryDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [parentId, setParentId] = useState<string | null>(initialParentId ?? null);
  const [originalParentId, setOriginalParentId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showParentSelector, setShowParentSelector] = useState(false);

  useEffect(() => {
    if (editCategory) {
      setTitle(editCategory.title);
      setDescription(editCategory.description);
      setSlug(editCategory.slug);
      setImage(editCategory.image);
      setImageFile(null);
      setOriginalParentId(initialParentId ?? null);
      setParentId(initialParentId ?? null);
      setDuplicateError(false);
    } else {
      setTitle("");
      setDescription("");
      setSlug("");
      setImage("");
      setImageFile(null);
      setParentId(initialParentId ?? null);
      setOriginalParentId(null);
      setDuplicateError(false);
    }
  }, [editCategory, open, initialParentId]);

  useEffect(() => {
    if (!open) return;
    
    setLoadingCategories(true);
    // Simulating API call - replace with actual service
    Promise.resolve(allCategories)
      .then((data) => {
        setCategories(data);
      })
      .catch((err) => {
        console.error("Failed to load categories for parent selector:", err);
        setCategories([]);
      })
      .finally(() => {
        setLoadingCategories(false);
      });
  }, [open, allCategories]);

  useEffect(() => {
    return () => {
      if (image && image.startsWith('blob:')) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

    useEffect(() => {
      if (!open) return;

      if (title && !editCategory) {
        const isDuplicate = checkDuplicate(allCategories, title, parentId);
        setDuplicateError(isDuplicate);
      } else {
        setDuplicateError(false);
      }
    }, [title, parentId, allCategories, editCategory, open]);



  const checkDuplicate = (
    cats: Category[],
    titleToCheck: string,
    parent: string | null,
    excludeId?: string
  ): boolean => {
    const normalizedTitle = titleToCheck.trim().toLowerCase();
    
    const checkInLevel = (categories: Category[]): boolean => {
      return categories.some(cat => {
        if (cat.id === excludeId) return false;
        if (cat.title.trim().toLowerCase() === normalizedTitle) return true;
        if (cat.subcategories) return checkInLevel(cat.subcategories);
        return false;
      });
    };

    if (!parent) {
      return cats.some(cat => 
        cat.id !== excludeId && cat.title.trim().toLowerCase() === normalizedTitle
      );
    }

    const findParent = (categories: Category[]): Category | null => {
      for (const cat of categories) {
        if (cat.id === parent) return cat;
        if (cat.subcategories) {
          const found = findParent(cat.subcategories);
          if (found) return found;
        }
      }
      return null;
    };

    const parentCat = findParent(cats);
    if (parentCat?.subcategories) {
      return parentCat.subcategories.some(
        cat => cat.id !== excludeId && cat.title.trim().toLowerCase() === normalizedTitle
      );
    }

    return false;
  };

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!editCategory) setSlug(generateSlug(value));
  };

  const isInSubtree = (root: Category, targetId: string): boolean => {
    if (!root.subcategories || root.subcategories.length === 0) return false;
    for (const c of root.subcategories) {
      if (c.id === targetId) return true;
      if (isInSubtree(c, targetId)) return true;
    }
    return false;
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const getCategoryPath = (cats: Category[], targetId: string | null): string => {
    if (!targetId) return "None";
    
    const findPath = (categories: Category[], path: string[] = []): string[] | null => {
      for (const cat of categories) {
        if (cat.id === targetId) return [...path, cat.title];
        if (cat.subcategories) {
          const found = findPath(cat.subcategories, [...path, cat.title]);
          if (found) return found;
        }
      }
      return null;
    };

    const path = findPath(cats);
    return path ? path.join(" > ") : "Unknown";
  };

  const renderCategoryTree = (cats: Category[], depth = 0): React.ReactNode[] => {
    return cats.flatMap((cat) => {
      if (editCategory && (cat.id === editCategory.id || isInSubtree(editCategory, cat.id))) {
        return [];
      }

      const isExpanded = expandedCategories.has(cat.id);
      const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;
      const isSelected = parentId === cat.id;

      return [
        <div key={cat.id} className="select-none">
          <div
            className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded transition-colors ${
              isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''
            }`}
            style={{ paddingLeft: `${depth * 20 + 12}px` }}
          >
            {hasSubcategories ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategory(cat.id);
                }}
                className="flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            ) : (
              <div className="w-4" />
            )}
            <div
              onClick={() => setParentId(cat.id)}
              className="flex-1 flex items-center gap-2"
            >
              <span className={`text-sm ${isSelected ? 'font-medium text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                {cat.title}
              </span>
              
            </div>
          </div>
          {isExpanded && hasSubcategories && (
            <div>{renderCategoryTree(cat.subcategories!, depth + 1)}</div>
          )}
        </div>
      ];
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploading(true);
      setImageFile(file);
      
      const previewUrl = URL.createObjectURL(file);
      setImage(previewUrl);
    } catch (error: any) {
      console.error('Failed to process image:', error);
      alert(error.message || 'Failed to process image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveClick = () => {
    if (!title || !slug) {
      alert('Please fill in title and slug');
      return;
    }

    if (duplicateError) {
      alert('Category already exists. Please use a different name.');
      return;
    }

    const payload: Omit<Category, "id"> = {
      title,
      description,
      slug,
      image: image || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400",
      subcategories: editCategory?.subcategories || [],
    };

    onSave(payload, parentId ?? null, editCategory ? originalParentId : undefined, imageFile || undefined);

    setTitle("");
    setDescription("");
    setSlug("");
    setImage("");
    setImageFile(null);
    setParentId(null);
    setOriginalParentId(null);
    setDuplicateError(false);
    setExpandedCategories(new Set());
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />

      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editCategory ? "Edit Category" : initialParentId ? "Add Subcategory" : "Add New Category"}
          </h2>
          <button onClick={() => onOpenChange(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Title <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => handleTitleChange(e.target.value)} 
              placeholder="Category title" 
              className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 dark:text-white ${
                duplicateError 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'
              }`}
            />
            {duplicateError && (
              <p className="text-sm text-red-500 dark:text-red-400">
                Category already exists
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Slug <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={slug} 
              onChange={(e) => setSlug(e.target.value)} 
              placeholder="category-slug" 
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" 
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Description</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Category description" 
              rows={3} 
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 dark:text-white" 
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Parent Category (optional)
              {editCategory && <span className="text-xs text-gray-500 ml-2">(change to move category)</span>}
            </label>
            
            <div className="relative">
              <button
                onClick={() => setShowParentSelector(!showParentSelector)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between text-gray-900 dark:text-white"
              >
                <span className="text-sm">{getCategoryPath(categories, parentId)}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showParentSelector ? 'rotate-180' : ''}`} />
              </button>

              {showParentSelector && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div
                    onClick={() => {
                      setParentId(null);
                      setShowParentSelector(false);
                    }}
                    className={`px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm transition-colors ${
                      parentId === null ? 'bg-blue-50 dark:bg-blue-900/30 font-medium text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    None (Root Level)
                  </div>
                  {loadingCategories ? (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Loading categories...</div>
                  ) : (
                    renderCategoryTree(categories)
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Upload Image</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              disabled={uploading}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-gray-900 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-200 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300" 
            />

            {uploading && (
              <p className="text-sm text-blue-600 dark:text-blue-400">Processing image...</p>
            )}

            {image && (
              <img 
                src={image} 
                alt="Preview" 
                className="w-full h-32 object-cover rounded border border-gray-200 dark:border-gray-700 mt-2" 
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button 
            onClick={() => onOpenChange(false)} 
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveClick} 
            disabled={!title || !slug || uploading || duplicateError} 
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {editCategory ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}