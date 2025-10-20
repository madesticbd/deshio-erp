'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, Search, Heart, ShoppingCart, ChevronRight, ChevronDown } from 'lucide-react';

interface Category {
  id: string;
  title: string;
  description: string;
  slug: string;
  image: string;
  subcategories?: Category[];
}

export default function Navigation() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <nav className="bg-black border-b border-gray-800 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">           
            <img src="/logo.png" alt="Deshio" className="h-12 w-auto" />
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="#" className="text-gray-300 hover:text-orange-500 transition-colors font-medium">
              Home
            </a>
            
            {/* Shop with Categories */}
            <div className="relative group">
              <button className="text-gray-300 hover:text-orange-500 transition-colors font-medium flex items-center gap-1">
                Shop 
              </button>
              
              {/* Main Dropdown */}
              <div className="absolute left-0 mt-0 w-56 bg-gray-900 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-800">
                {loading ? (
                  <div className="px-4 py-3 text-gray-400 text-sm">Loading...</div>
                ) : (
                  categories.map((cat) => (
                    <div key={cat.id} className="relative group/sub">
                      <button className="w-full text-left px-4 py-3 text-gray-300 hover:bg-orange-600 hover:text-white font-medium flex items-center justify-between first:rounded-t-lg last:rounded-b-lg transition-colors">
                        <span>{cat.title}</span>
                        {cat.subcategories && cat.subcategories.length > 0 && (
                          <ChevronRight size={16} className="transform group-hover/sub:rotate-90 transition-transform" />
                        )}
                      </button>

                      {/* Submenu */}
                      {cat.subcategories && cat.subcategories.length > 0 && (
                        <div className="absolute left-full top-0 ml-1 w-48 bg-gray-900 rounded-lg shadow-lg opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 z-50 border border-gray-800">
                          {cat.subcategories.map((subcat) => (
                            <button
                              key={subcat.id}
                              className="w-full text-left px-4 py-3 text-gray-300 hover:bg-orange-600 hover:text-white font-medium text-sm first:rounded-t-lg last:rounded-b-lg transition-colors flex items-center justify-between group/subsub"
                            >
                              <span>{subcat.title}</span>
                              {subcat.subcategories && subcat.subcategories.length > 0 && (
                                <ChevronRight size={14} className="transform group-hover/subsub:rotate-90 transition-transform" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <a href="#" className="text-gray-300 hover:text-orange-500 transition-colors font-medium">
              About
            </a>
            <a href="#" className="text-gray-300 hover:text-orange-500 transition-colors font-medium">
              Contact
            </a>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="hidden sm:inline-flex p-2.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-orange-500">
              <Search size={20} />
            </button>
            <button className="hidden sm:inline-flex p-2.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-orange-500">
              <Heart size={20} />
            </button>
            <button className="relative p-2.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-orange-500">
              <ShoppingCart size={20} />
              <span className="absolute top-1 right-1 w-4 h-4 bg-orange-600 text-white text-xs rounded-full flex items-center justify-center font-bold">0</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="lg:hidden p-2.5 rounded-lg hover:bg-gray-800 text-gray-300"
            >
              {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileOpen && (
          <div className="lg:hidden pb-4 space-y-1 border-t border-gray-800 max-h-96 overflow-y-auto">
            <a href="#" className="block px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-orange-500 font-medium">
              Home
            </a>
            
            {loading ? (
              <div className="px-4 py-3 text-gray-400 text-sm">Loading...</div>
            ) : (
              categories.map((cat) => (
                <div key={cat.id}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === cat.id ? null : cat.id)}
                    className="w-full text-left px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-orange-500 font-medium flex items-center justify-between"
                  >
                    {cat.title}
                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <ChevronRight size={16} className={`transform transition-transform ${openDropdown === cat.id}`} />
                    )}
                  </button>
                  
                  {openDropdown === cat.id && cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="pl-4 space-y-1">
                      {cat.subcategories.map((subcat) => (
                        <a
                          key={subcat.id}
                          href="#"
                          className="block px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-orange-500 text-sm font-medium"
                        >
                          {subcat.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            <a href="#" className="block px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-orange-500 font-medium">
              About
            </a>
            <a href="#" className="block px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-orange-500 font-medium">
              Contact
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}