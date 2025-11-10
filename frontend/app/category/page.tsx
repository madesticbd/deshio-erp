"use client";

import { useState, useEffect } from "react";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import CategoryListItem from "@/components/CategoryListItem";
import AddCategoryDialog from "@/components/AddCategoryDialog";
import Toast from "@/components/Toast";
import categoryService, { Category, PaginatedResponse } from "@/services/categoryService";

export default function CategoryPageWrapper() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  useEffect(() => {
    loadCategories();
  }, [searchQuery, pagination.current_page]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const result = await categoryService.getAll({
        page: pagination.current_page,
        per_page: pagination.per_page,
        search: searchQuery || undefined,
        is_active: true
      }) as PaginatedResponse<Category>;
      
      setCategories(result.data);
      setPagination({
        current_page: result.current_page,
        last_page: result.last_page,
        per_page: result.per_page,
        total: result.total
      });
    } catch (error: any) {
      console.error('Failed to load categories:', error);
      showToast(error.message || 'Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await categoryService.delete(id);
      showToast('Category deleted successfully!', 'success');
      loadCategories();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      showToast(error.response?.data?.message || 'Failed to delete category', 'error');
    }
  };

  const handleEdit = (category: Category) => {
    setEditCategory(category);
    setParentId(category.parent_id || null);
    setDialogOpen(true);
  };

  const handleAddSubcategory = (parentId: number) => {
    setParentId(parentId);
    setEditCategory(null);
    setDialogOpen(true);
  };

  const handleSave = async (formData: FormData) => {
    try {
      if (editCategory) {
        await categoryService.update(editCategory.id, formData);
        showToast('Category updated successfully!', 'success');
      } else {
        await categoryService.create(formData);
        showToast('Category created successfully!', 'success');
      }
      
      setEditCategory(null);
      setParentId(null);
      setDialogOpen(false);
      loadCategories();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      showToast(error.response?.data?.message || 'Failed to save category', 'error');
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, current_page: page }));
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
                      setPagination(prev => ({ ...prev, current_page: 1 }));
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
            ) : categories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No categories found matching your search' : 'No categories found. Create your first category!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => (
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

            {pagination.last_page > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="h-10 w-10 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-900 dark:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`h-10 w-10 flex items-center justify-center rounded-lg transition-colors ${
                        pagination.current_page === page
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                          : "border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
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
            />
          </main>
        </div>
      </div>

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