'use client';

import React, { useState } from 'react';
import { ShoppingCart, Heart, Star, Eye } from 'lucide-react';

export default function BestSellerProducts() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const products = [
    {
      id: 1,
      name: 'Premium Jamdani Saree',
      price: '18,990',
      image: '/uploads/1760593060934-jamdani product.webp',
      rating: 5,
      reviews: 124,
    },
    {
      id: 2,
      name: 'Royal Silk Collection',
      price: '15,800',
      image: '/uploads/1760593060934-jamdani product.webp',
      rating: 5,
      reviews: 98,
    },
    {
      id: 3,
      name: 'Designer Batik Saree',
      price: '8,500',
      image: '/uploads/1760593060934-jamdani product.webp',
      rating: 5,
      reviews: 156,
    },
    {
      id: 4,
      name: 'Exclusive Monipuri',
      price: '12,450',
      image: '/uploads/1760593060934-jamdani product.webp',
      rating: 5,
      reviews: 87,
    },
    {
      id: 5,
      name: 'Cotton Blend Elegance',
      price: '5,990',
      image: '/uploads/1760593060934-jamdani product.webp',
      rating: 5,
      reviews: 203,
    },
    {
      id: 6,
      name: 'Heritage Katan Silk',
      price: '22,990',
      image: '/uploads/1760593060934-jamdani product.webp',
      rating: 5,
      reviews: 145,
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Best Sellers</h2>
          <p className="text-lg text-gray-600">Our customers' favorite picks</p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
              onMouseEnter={() => setHoveredId(product.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Product Image */}
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                
                {/* Best Seller Badge */}
                <span className="absolute top-3 left-3 bg-teal-600 text-white px-3 py-1.5 text-xs font-bold rounded-lg shadow-lg">
                  Best Seller
                </span>

                {/* Action Buttons */}
                <div className={`absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300 ${hoveredId === product.id ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                  <button className="p-2.5 bg-white rounded-lg shadow-lg hover:bg-red-50 transition-colors">
                    <Heart size={18} className="text-gray-700" />
                  </button>
                  <button className="p-2.5 bg-white rounded-lg shadow-lg hover:bg-blue-50 transition-colors">
                    <Eye size={18} className="text-gray-700" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button className={`absolute bottom-0 left-0 right-0 bg-gray-900 text-white py-3.5 font-semibold transition-transform duration-300 flex items-center justify-center gap-2 ${hoveredId === product.id ? 'translate-y-0' : 'translate-y-full'}`}>
                  <ShoppingCart size={18} />
                  Add to Cart
                </button>
              </div>

              {/* Product Info */}
              <div className="p-5">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(product.rating)].map((_, i) => (
                    <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-xs text-gray-500 ml-1.5">({product.reviews})</span>
                </div>

                <h3 className="text-sm font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-teal-600 transition-colors cursor-pointer">
                  {product.name}
                </h3>

                <span className="text-xl font-bold text-gray-900">৳{product.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}