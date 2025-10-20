'use client';

import React from 'react';
import { ShoppingCart, Heart } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: string;
  description: string;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-200">
      {/* Image Placeholder */}
      <div className="relative h-56 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center overflow-hidden">
        <div className="text-5xl group-hover:scale-110 transition-transform duration-300">🧵</div>
        
        {/* Wishlist Button */}
        <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors">
          <Heart size={18} className="text-gray-600 hover:text-red-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-gray-600 line-clamp-2 mb-2 font-medium">
          {product.description.split('\n')[0]}
        </p>

        <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-sm group-hover:text-amber-600 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              ৳{product.price}
            </p>
            <p className="text-xs text-gray-500">Free Shipping</p>
          </div>
        </div>

        <button className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2">
          <ShoppingCart size={18} />
          <span>Add</span>
        </button>

        {/* Additional Info */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 line-clamp-2">
            {product.description.split('\n').slice(1).join(' ')}
          </p>
        </div>
      </div>
    </div>
  );
}