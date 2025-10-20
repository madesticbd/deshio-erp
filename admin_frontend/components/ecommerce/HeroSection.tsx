'use client';

import React from 'react';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-teal-50 via-white to-blue-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center md:text-left">
            <span className="inline-block text-teal-600 font-semibold text-sm tracking-wider uppercase mb-4">
              New Collection 2025
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Discover Timeless <span className="text-teal-600">Elegance</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto md:mx-0">
              Handcrafted sarees from Bangladesh's finest artisans. Experience the perfect blend of tradition and contemporary design.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button className="px-8 py-4 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-lg hover:shadow-xl">
                Shop Collection
              </button>
              <button className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors border-2 border-gray-200">
                View Lookbook
              </button>
            </div>
          </div>

          {/* Right Content - Image */}
          <div className="relative">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/uploads/1760593600288-Sharee Catagory.webp"
                alt="Featured Collection"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="800"%3E%3Crect fill="%23f3f4f6" width="600" height="800"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="24"%3EFeatured%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
            
            {/* Price Badge */}
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-2xl">
              <p className="text-sm text-gray-600 mb-1">Starting from</p>
              <p className="text-3xl font-bold text-gray-900">৳4,999</p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-teal-200 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 blur-xl"></div>
    </section>
  );
}