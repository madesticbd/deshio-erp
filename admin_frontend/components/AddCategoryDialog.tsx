/// <reference types="react" />
// AddCategoryDialog.tsx (replace file contents with this)
"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Category } from "./CategoryCard";

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // second arg parentId is optional and will be used by the parent wrapper
  onSave: (category: Omit<Category, "id">, parentId?: string | null) => void;
  editCategory?: Category | null;
  parentId?: string | null; // initial parent if invoked from "Add Subcategory" button
}

export default function AddCategoryDialog({
  open,
  onOpenChange,
  onSave,
  editCategory,
  parentId: initialParentId,
}: AddCategoryDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [parentId, setParentId] = useState<string | null>(initialParentId ?? null);

  useEffect(() => {
    if (editCategory) {
      setTitle(editCategory.title);
      setDescription(editCategory.description);
      setSlug(editCategory.slug);
      setImage(editCategory.image);
      // do not change parentId when editing (we're not supporting moving in this flow)
      setParentId(initialParentId ?? null);
    } else {
      setTitle("");
      setDescription("");
      setSlug("");
      setImage("");
      setParentId(initialParentId ?? null);
    }
  }, [editCategory, open, initialParentId]);

  // load categories when dialog opens (for parent dropdown)
  useEffect(() => {
    if (!open) return;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data))
      .catch((err) => {
        console.error("Failed to load categories for parent selector:", err);
        setCategories([]);
      });
  }, [open]);

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!editCategory) setSlug(generateSlug(value));
  };

  // Prevent choosing the category itself as its own parent (and optionally its descendants)
  const isInSubtree = (root: Category, targetId: string): boolean => {
    if (!root.subcategories || root.subcategories.length === 0) return false;
    for (const c of root.subcategories) {
      if (c.id === targetId) return true;
      if (isInSubtree(c, targetId)) return true;
    }
    return false;
  };

  const renderCategoryOptions = (cats: Category[], depth = 0): React.ReactNode[] => {
    return cats.flatMap((cat) => {
      // If we're editing, don't allow selecting the category itself or its descendants as parent
      if (editCategory && (cat.id === editCategory.id || isInSubtree(editCategory, cat.id))) {
        // skip this option to avoid cycles
        return [];
      }
      return [
        <option key={cat.id} value={cat.id}>
          {Array(depth).fill("—").join("")} {cat.title}
        </option>,
        ...(cat.subcategories ? renderCategoryOptions(cat.subcategories, depth + 1) : []),
      ];
    });
  };

  const handleSaveClick = () => {
    if (!title || !slug) return;

    const payload: Omit<Category, "id"> = {
      title,
      description,
      slug,
      image: image || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400",
      subcategories: editCategory?.subcategories || [],
    };

    // Pass selected parentId as second arg. If null or empty, parentId will be undefined.
    onSave(payload, parentId ?? null);

    // reset & close
    setTitle("");
    setDescription("");
    setSlug("");
    setImage("");
    setParentId(null);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />

      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-gray-900 dark:text-white">
            {editCategory ? "Edit Category" : initialParentId ? "Add Subcategory" : "Add New Category"}
          </h2>
          <button onClick={() => onOpenChange(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-900 dark:text-white">Title</label>
            <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Category title" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-900 dark:text-white">Slug</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="category-slug" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-900 dark:text-white">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Category description" rows={3} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {/* Parent selector (ONLY when creating, not editing) */}
          {!editCategory && (
            <div className="space-y-2">
              <label className="block text-sm text-gray-900 dark:text-white">Parent Category (optional)</label>
              <select value={parentId ?? ""} onChange={(e) => setParentId(e.target.value || null)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">None</option>
                {renderCategoryOptions(categories)}
              </select>
            </div>
          )}

          {/* Image upload */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-900 dark:text-white">Upload Image</label>
            <input type="file" accept="image/*" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.append("file", file);
              const res = await fetch("/api/upload", { method: "POST", body: fd });
              const { url } = await res.json();
              setImage(url);
            }} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />

            {image && <img src={image} alt="Preview" className="w-full h-32 object-cover rounded border border-gray-200 dark:border-gray-700 mt-2" />}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
          <button onClick={handleSaveClick} disabled={!title || !slug} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {editCategory ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}