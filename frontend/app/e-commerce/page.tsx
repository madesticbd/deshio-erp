'use client';

import React from 'react';
import Navigation from '@/components/ecommerce/Navigation';
import HeroSection from '@/components/ecommerce/HeroSection';
import OurCategories from '@/components/ecommerce/OurCategories';
import Footer from '@/components/ecommerce/Footer';

export default function HomePage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Navigation Bar */}
      <Navigation />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Categories Section */}
      <OurCategories />
            
      {/* Footer */}
      <Footer />
    </div>
  );
}