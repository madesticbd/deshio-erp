'use client';

import React from 'react';
import ProductCard from './ProductCard';

interface Product {
  id: number;
  name: string;
  price: string;
  description: string;
}

interface SaleSectionProps {
  title: string;
  products: Product[];
}

export default function SaleSection({ title, products }: SaleSectionProps) {
  return (
    <div className="bg-white py-12 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
          <span className="inline-block px-4 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
            SALE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}