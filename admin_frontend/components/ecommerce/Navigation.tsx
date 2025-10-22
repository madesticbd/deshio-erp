'use client';
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Search, User, Menu, X, ChevronRight } from 'lucide-react';
import { useCart } from '@/app/e-commerce/CartContext';
import CartSidebar from '@/components/ecommerce/cart/CartSidebar';
import { useRouter } from 'next/navigation';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartSidebarOpen, setCartSidebarOpen] = useState(false);
  const [isShopHovered, setIsShopHovered] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const { getCartCount } = useCart();
  const router = useRouter();

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (cartSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [cartSidebarOpen]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const categoriesRes = await fetch('/api/categories');
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Toggle subcategory visibility
  const toggleSubcategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Render category tree for dropdown and mobile menu
  const renderCategoryTree = (cats, level = 0, isMobile = false) => {
    if (isLoading) {
      return <div className="py-2 px-4">Loading categories...</div>;
    }
    return cats.map((cat) => {
      const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;
      const isExpanded = expandedCategories.has(cat.id);
      return (
        <div key={cat.id} className={isMobile ? 'flex flex-col' : 'relative group'}>
          <div
            className={`flex items-center justify-between py-2 px-4 cursor-pointer transition-colors ${
              level === 0 && !isMobile ? 'font-semibold text-gray-900 hover:text-red-600' : 'text-gray-700 hover:text-red-600'
            }`}
            style={{ paddingLeft: isMobile ? `${level * 16 + 16}px` : `${level * 16 + 16}px` }}
          >
            <span
              className="flex-1"
              onClick={() => {
                router.push(`/e-commerce/${cat.slug}`);
                if (!isMobile) setIsShopHovered(false);
                if (isMobile) setMobileMenuOpen(false);
              }}
            >
              {cat.title}
            </span>
            {hasSubcategories && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSubcategory(cat.id);
                }}
                className="p-0.5"
              >
                <ChevronRight
                  size={14}
                  className={`text-gray-600 ${isExpanded && isMobile ? 'rotate-90' : ''}`}
                />
              </button>
            )}
          </div>
          {hasSubcategories && isExpanded && (
            <div
              className={
                isMobile
                  ? 'flex flex-col'
                  : 'absolute left-full top-0 mt-0 w-48 bg-white border border-gray-200 shadow-lg rounded-md z-50'
              }
            >
              {renderCategoryTree(cat.subcategories, level + 1, isMobile)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      {/* Main Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                <span className="text-gray-900">Deshio</span>
              </h1>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="/e-commerce"
                className="text-gray-900 hover:text-red-600 font-medium transition-colors"
              >
                Home
              </a>
              <div
                className="relative"
                onMouseEnter={() => setIsShopHovered(true)}
                onMouseLeave={() => setIsShopHovered(false)}
              >
                <a
                  href="#"
                  className="text-gray-700 hover:text-red-600 transition-colors"
                >
                  Shop
                </a>
                {isShopHovered && categories.length > 0 && (
                  <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg rounded-md z-50">
                    {renderCategoryTree(categories.filter(cat => !cat.parentId))}
                  </div>
                )}
              </div>
              <a
                href="#"
                className="text-gray-700 hover:text-red-600 transition-colors"
              >
                Sale
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-red-600 transition-colors"
              >
                About
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-red-600 transition-colors"
              >
                Contact
              </a>
            </div>
            {/* Right Icons */}
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Search size={20} className="text-gray-700" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <User size={20} className="text-gray-700" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                <Heart size={20} className="text-gray-700" />
                <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  3
                </span>
              </button>
              <button
                onClick={() => setCartSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
              >
                <ShoppingCart size={20} className="text-gray-700" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {getCartCount()}
                  </span>
                )}
              </button>
              <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-3">
                <a
                  href="/e-commerce"
                  className="text-gray-900 hover:text-red-600 font-medium transition-colors py-2"
                >
                  Home
                </a>
                <div className="flex flex-col">
                  <a
                    href="#"
                    className="text-gray-900 hover:text-red-600 font-medium transition-colors py-2"
                  >
                    Shop
                  </a>
                  <div className="pl-4">
                    {renderCategoryTree(categories.filter(cat => !cat.parentId), 0, true)}
                  </div>
                </div>
                <a
                  href="#"
                  className="text-gray-700 hover:text-red-600 transition-colors py-2"
                >
                  Sale
                </a>
                <a
                  href="#"
                  className="text-gray-700 hover:text-red-600 transition-colors py-2"
                >
                  About
                </a>
                <a
                  href="#"
                  className="text-gray-700 hover:text-red-600 transition-colors py-2"
                >
                  Contact
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>
      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={cartSidebarOpen}
        onClose={() => setCartSidebarOpen(false)}
      />
    </>
  );
}