"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import CategoryListItem from "@/components/CategoryListItem";
import AddCategoryDialog from "@/components/AddCategoryDialog";
import Toast from "@/components/Toast";
import { categoryService } from "@/services/categoryService";

export interface Category {
  id: string;
  title: string;
  description: string;
  slug: string;
  image: string;
  subcategories?: Category[];
}

function deleteCategoryRecursive(cats: Category[], id: string): Category[] {
  return cats
    .filter((cat) => cat.id !== id)
    .map((cat) => ({
      ...cat,
      subcategories: deleteCategoryRecursive(cat.subcategories || [], id),
    }));
}

// Helper to find the parent ID of a category
function findParentId(cats: Category[], targetId: string, parentId: string | null = null): string | null {
  for (const cat of cats) {
    if (cat.id === targetId) return parentId;
    if (cat.subcategories) {
      const found = findParentId(cat.subcategories, targetId, cat.id);
      if (found !== undefined) return found;
    }
  }
  return undefined as any;
}

export default function CategoryPageWrapper() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  const itemsPerPage = 6;

  useEffect(() => {
    refresh();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error: any) {
      console.error('Failed to load categories:', error);
      showToast(error.message || 'Failed to load categories. Please check your backend connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const flattenCategories = (cats: Category[]): Category[] => {
    return cats.reduce((acc: Category[], cat) => {
      acc.push(cat);
      if (cat.subcategories) {
        acc.push(...flattenCategories(cat.subcategories));
      }
      return acc;
    }, []);
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;

    const lowercaseQuery = searchQuery.toLowerCase();
    const allCategories = flattenCategories(categories);
    const matchedIds = new Set(
      allCategories
        .filter(
          (cat) =>
            cat.title.toLowerCase().includes(lowercaseQuery) ||
            cat.description.toLowerCase().includes(lowercaseQuery) ||
            cat.slug.toLowerCase().includes(lowercaseQuery)
        )
        .map((cat) => cat.id)
    );

    return categories.filter((cat) => {
      const hasMatch = matchedIds.has(cat.id);
      const hasMatchingDescendant = flattenCategories([cat]).some((c) =>
        matchedIds.has(c.id)
      );
      return hasMatch || hasMatchingDescendant;
    });
  }, [categories, searchQuery]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await categoryService.delete(id);
      setCategories((prev) => deleteCategoryRecursive(prev, id));
      showToast('Category deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      showToast(error.message || 'Failed to delete category. Please try again.', 'error');
    }
  };

  const handleEdit = (category: Category) => {
    setEditCategory(category);
    // Find the current parent of this category
    const currentParent = findParentId(categories, category.id);
    setParentId(currentParent);
    setDialogOpen(true);
  };

  const handleAddSubcategory = (parentId: string) => {
    setParentId(parentId);
    setEditCategory(null);
    setDialogOpen(true);
  };

  const handleSave = async (
    newCategory: Omit<Category, "id">, 
    newParentId?: string | null,
    oldParentId?: string | null,
    imageFile?: File
  ) => {
    try {
      if (editCategory) {
        // Check if parent changed
        const parentChanged = oldParentId !== newParentId;

        const payload = {
          title: newCategory.title,
          slug: newCategory.slug,
          description: newCategory.description,
          parent_id: newParentId,
          image: imageFile,
        };
        
        const updated = await categoryService.update(editCategory.id, payload);

        if (parentChanged) {
          // Remove from old location
          let updatedCategories = deleteCategoryRecursive(categories, editCategory.id);

          // Add to new location
          if (newParentId) {
            const addToParent = (cats: Category[]): Category[] =>
              cats.map((cat) =>
                cat.id === newParentId
                  ? { ...cat, subcategories: [...(cat.subcategories || []), updated] }
                  : { ...cat, subcategories: addToParent(cat.subcategories || []) }
              );
            updatedCategories = addToParent(updatedCategories);
          } else {
            updatedCategories = [...updatedCategories, updated];
          }

          setCategories(updatedCategories);
        } else {
          // UPDATE IN PLACE
          const updateCategoryRecursive = (cats: Category[]): Category[] =>
            cats.map((cat) =>
              cat.id === updated.id
                ? updated
                : {
                    ...cat,
                    subcategories: updateCategoryRecursive(cat.subcategories || []),
                  }
            );

          setCategories((prev) => updateCategoryRecursive(prev));
        }

        showToast(`Category "${newCategory.title}" updated successfully!`, 'success');
      } else {
        // CREATE NEW
        const payload = {
          title: newCategory.title,
          slug: newCategory.slug,
          description: newCategory.description,
          parent_id: newParentId,
          image: imageFile,
        };
        
        const created = await categoryService.create(payload);

        if (newParentId) {
          const addSubcategoryRecursive = (cats: Category[]): Category[] =>
            cats.map((cat) =>
              cat.id === newParentId
                ? { ...cat, subcategories: [...(cat.subcategories || []), created] }
                : { ...cat, subcategories: addSubcategoryRecursive(cat.subcategories || []) }
            );

          setCategories((prev) => addSubcategoryRecursive(prev));
        } else {
          setCategories((prev) => [...prev, created]);
        }

        showToast(`Category "${newCategory.title}" created successfully!`, 'success');
      }

      setEditCategory(null);
      setParentId(null);
    } catch (error: any) {
      console.error('Failed to save category:', error);
      
      // Check if it's a duplicate error
      if ((error as any).isDuplicate) {
        showToast('Category already exists', 'error');
      } else {
        showToast(error.message || 'Failed to save category. Please try again.', 'error');
      }
    }
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 overflow-auto p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                    Categories
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage your product categories and subcategories
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditCategory(null);
                    setParentId(null);
                    setDialogOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Loading categories...</p>
              </div>
            ) : paginatedCategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No categories found matching your search' : 'No categories found. Create your first category!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedCategories.map((category) => (
                  <CategoryListItem
                    key={category.id}
                    category={category}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onAddSubcategory={handleAddSubcategory}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-10 w-10 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-900 dark:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-10 w-10 flex items-center justify-center rounded-lg transition-colors ${
                          currentPage === page
                            ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                            : "border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="h-10 w-10 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-900 dark:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <AddCategoryDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              onSave={handleSave}
              editCategory={editCategory}
              parentId={parentId}
              allCategories={categories}
            />
          </main>
        </div>
      </div>

      {/* Toast Notification */}
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