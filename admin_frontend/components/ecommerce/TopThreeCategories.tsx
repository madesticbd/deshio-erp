'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function TopThreeCategories() {
  const categories = [
    {
      id: 1,
      title: 'Jamdani Collection',
      subtitle: 'Handwoven Excellence',
      image: '/uploads/1760593060934-jamdani product.webp',
      link: '/jamdani',
    },
    {
      id: 2,
      title: 'Silk Sarees',
      subtitle: 'Pure Elegance',
      image: '/uploads/1760593060934-jamdani product.webp',
      link: '/silk',
    },
    {
      id: 3,
      title: 'Batik Designs',
      subtitle: 'Artistic Heritage',
      image: '/uploads/1760593060934-jamdani product.webp',
      link: '/batik',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              className="group relative overflow-hidden rounded-2xl cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div className="aspect-[4/5] relative">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="500"%3E%3Crect fill="%23f3f4f6" width="400" height="500"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="20"%3E' + cat.title + '%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <p className="text-sm font-light mb-2 tracking-wider uppercase">
                    {cat.subtitle}
                  </p>
                  <h3 className="text-3xl font-bold mb-4">{cat.title}</h3>
                  <button className="inline-flex items-center gap-2 text-sm font-semibold bg-white text-gray-900 px-6 py-3 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition-all">
                    Explore Now <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}