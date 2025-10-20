'use client';

import React, { useEffect, useState } from 'react';

interface Category {
  id: string;
  title: string;
  description: string;
  slug: string;
  image: string;
  subcategories?: Category[];
}

export default function TopCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Flatten all categories recursively, inherit parent image if subcategory doesn't have one
  const flattenCategories = (cats: Category[], parentImage?: string): Category[] => {
    return cats.flatMap(cat => [
      { ...cat, image: cat.image || parentImage || '' },
      ...(cat.subcategories ? flattenCategories(cat.subcategories, cat.image || parentImage) : [])
    ]);
  };

  const allCategories = flattenCategories(categories);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 border-b border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">TOP CATEGORIES</h2>
          <p className="text-gray-600 text-sm mb-8">Explore our finest collections</p>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-40 h-48 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 border-b border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-red-600 font-semibold">Error loading categories: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 border-b border-slate-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">TOP CATEGORIES</h2>
          <p className="text-gray-600 text-sm">Explore our finest collections</p>
        </div>
        
        <div className="flex gap-6 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              className="group flex-shrink-0 w-56 text-left overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-orange-300 snap-start"
            >
              {/* Image */}
              <div className="aspect-square rounded-t-2xl bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden flex items-center justify-center relative">
                {cat.image ? (
                  <>
                    <img 
                      src={cat.image} 
                      alt={cat.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.style.display = 'none';
                        const fallback = img.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-3xl hidden bg-gradient-to-br from-slate-100 to-slate-200">
                      📦
                    </div>
                  </>
                ) : (
                  <div className="text-3xl">📦</div>
                )}
              </div>

              {/* Content */}
              <div className="p-3">
                <h3 className="font-bold text-gray-900 text-sm group-hover:text-orange-600 transition-colors line-clamp-2">
                  {cat.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{cat.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}