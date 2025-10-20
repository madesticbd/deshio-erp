'use client';

import React, { useState } from 'react';
import { ShoppingCart, Heart, Search, User, Menu, X } from 'lucide-react';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top Banner */}
      <div className="bg-gray-900 text-white py-2.5 text-center text-sm">
        <p>🎉 Free shipping on orders over ৳5,000 | New Arrivals Now Available</p>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                <span className="text-teal-600">Deshio</span>
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-900 hover:text-teal-600 font-medium transition-colors">
                Home
              </a>
              <a href="#" className="text-gray-700 hover:text-teal-600 transition-colors">
                Shop
              </a>
              <a href="#" className="text-gray-700 hover:text-teal-600 transition-colors">
                Categories
              </a>
              <a href="#" className="text-gray-700 hover:text-teal-600 transition-colors">
                Sale
              </a>
              <a href="#" className="text-gray-700 hover:text-teal-600 transition-colors">
                About
              </a>
              <a href="#" className="text-gray-700 hover:text-teal-600 transition-colors">
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
                <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  3
                </span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                <ShoppingCart size={20} className="text-gray-700" />
                <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  2
                </span>
              </button>
              
              {/* Mobile Menu Button */}
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
                <a href="#" className="text-gray-900 hover:text-teal-600 font-medium transition-colors py-2">
                  Home
                </a>
                <a href="#" className="text-gray-700 hover:text-teal-600 transition-colors py-2">
                  Shop
                </a>
                <a href="#" className="text-gray-700 hover:text-teal-600 transition-colors py-2">
                  Categories
                </a>
                <a href="#" className="text-gray-700 hover:text-teal-600 transition-colors py-2">
                  Sale
                </a>
                <a href="#" className="text-gray-700 hover:text-teal-600 transition-colors py-2">
                  About
                </a>
                <a href="#" className="text-gray-700 hover:text-teal-600 transition-colors py-2">
                  Contact
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}