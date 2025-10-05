"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import CategoryCard, { Category } from "@/components/CategoryCard";
import CategoryListItem from "@/components/CategoryListItem";
import AddCategoryDialog from "@/components/AddCategoryDialog";

function deleteCategoryRecursive(cats: Category[], id: string): Category[] {
  return cats
    .filter(cat => cat.id !== id) // remove if matches at this level
    .map(cat => ({
      ...cat,
      subcategories: deleteCategoryRecursive(cat.subcategories || [], id), // recurse
    }));
}


export default function CategoryPageWrapper() {
  const [darkMode, setDarkMode] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);

  const itemsPerPage = 6;

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
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

  // Filter categories
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

  // Pagination
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // CRUD Actions
  const handleDelete = async (id: string) => {
  await fetch(`/api/categories?id=${id}`, {
    method: 'DELETE',
  });

  setCategories(prev => deleteCategoryRecursive(prev, id));
};
  const handleEdit = (category: Category) => {
    setEditCategory(category);
    setParentId(null);
    setDialogOpen(true);
  };

  const handleAddSubcategory = (parentId: string) => {
    setParentId(parentId);
    setEditCategory(null);
    setDialogOpen(true);
  };

  // For adding a category
 const handleSave = async (newCategory: Omit<Category, 'id'>) => {
    if (editCategory) {
      // Edit existing category
      const res = await fetch('/api/categories', {
        method: 'PUT',
        body: JSON.stringify({ ...editCategory, ...newCategory }),
      });
      const updated = await res.json();

      // Replace category (recursively if nested)
      const updateCategoryRecursive = (cats: Category[]): Category[] =>
        cats.map(cat =>
          cat.id === updated.id
            ? updated
            : { ...cat, subcategories: updateCategoryRecursive(cat.subcategories || []) }
        );

      setCategories(prev => updateCategoryRecursive(prev));
    } else {
      // Create new category (could be root or subcategory)
      const res = await fetch('/api/categories', {
        method: 'POST',
         body: JSON.stringify({ ...newCategory, parentId }),
      });
      const created = await res.json();

      if (parentId) {
        // Insert as subcategory
        const addSubcategoryRecursive = (cats: Category[]): Category[] =>
          cats.map(cat =>
            cat.id === parentId
              ? { ...cat, subcategories: [...(cat.subcategories || []), created] }
              : { ...cat, subcategories: addSubcategoryRecursive(cat.subcategories || []) }
          );

        setCategories(prev => addSubcategoryRecursive(prev));
      } else {
        // Insert as top-level category
        setCategories(prev => [...prev, created]);
      }
    }
  };
  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />

          <main className="flex-1 overflow-auto p-6">
            {/* Header Section */}
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
                  onClick={() => setDialogOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </button>
              </div>

              {/* Search & View Toggle */}
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

                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`h-8 w-8 flex items-center justify-center rounded transition-colors ${
                      viewMode === "grid"
                        ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`h-8 w-8 flex items-center justify-center rounded transition-colors ${
                      viewMode === "list"
                        ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Categories Display */}
            {paginatedCategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No categories found
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onAddSubcategory={handleAddSubcategory}
                  />
                ))}
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

            {/* Pagination */}
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

            {/* Add/Edit Dialog */}
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
    </div>
  );
}
