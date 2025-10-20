'use client';

import React from 'react';
import Navigation from '@/components/ecommerce/Navigation';
import TopCategories from '@/components/ecommerce/TopCategories';
import SaleSection from '@/components/ecommerce/SaleSection';
import Footer from '@/components/ecommerce/Footer';

export default function HomePage() {
  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <Navigation />
      
      <main>
        <TopCategories />
        
        {/* Jamdani Section */}
        <SaleSection 
          title="JAMDANI SAREES" 
          products={[
            {
              id: 1,
              name: 'Reshom halfsilk jamdani 84 count',
              price: '14,990',
              description: '৮৪ কাউন্ট\nম্যাটেরিয়াল - অরিজিনাল রেশম হাফসিল্ক।\nসাইজ - ১२ হাত শাড়ি।',
            },
            {
              id: 2,
              name: 'Jamdani saree 60&80 mix count',
              price: '6,800',
              description: '৬০ এন্ড ৮০ মিক্স কাউন্ট\nম্যাটেরিয়াল - অরিজিনাল রেশম হাফসিল্ক।\nসাইজ - ১२ হাত শাড়ি।',
            },
            {
              id: 3,
              name: 'Reshom halfsilk jamdani 84 count',
              price: '14,500',
              description: '৮৪ কাউন্ট\nম্যাটেরিয়াল - অরিজিনাল রেশম হাফসিল্ক।\nসাইজ - ១२ হাত শাড়ি।',
            },
            {
              id: 4,
              name: 'Reshom halfsilk jamdani 80 count',
              price: '10,100',
              description: '৮०কাউন্ট জামদানি শাড়ি\nম্যাটেরিয়াল - অরিজিনাল রেশম হাফসিল্ক।\nসাইজ - ១२ হাত শাড়ি।',
            },
            {
              id: 5,
              name: 'Jamdani saree 60&80 mix count',
              price: '5,850',
              description: '৬০ এন্ড ৮०মিক্স কাউন্ট\nম্যাটেরিয়াল - অরিজিনাল রেশম হাফসিল্ক।\nসাইজ - १२ হাত শাড়ি।',
            },
          ]}
        />

        {/* Monipuri Section */}
        <SaleSection 
          title="MONIPURI SAREES" 
          products={[
            {
              id: 6,
              name: 'Mid range monipuri saree',
              price: '4,100',
              description: 'মনিপুরী শাড়ি\nম্যাটেরিয়াল - ফাইন কোয়ালিটি কটন সুতার তৈরি।\nসাইজ - १३ হাত + শাড়ি।',
            },
            {
              id: 7,
              name: 'Mid range monipuri saree',
              price: '3,000',
              description: 'মনিপুরী শাড়ি\nম্যাটেরিয়াল - ফাইন কোয়ালিটি কটন সুতার তৈরি।\nসাইজ - १३ হাত + শাড়ি।',
            },
            {
              id: 8,
              name: 'High range monipuri saree',
              price: '5,200',
              description: 'মনিপুরী শাড়ি\nম্যাটেরিয়াল - ফাইন কোয়ালিটি কটন সুতার তৈরি।\nসাইজ - १३ হাত + শাড়ি।',
            },
            {
              id: 9,
              name: 'High range monipuri saree',
              price: '6,500',
              description: 'মনিপুরী শাড়ি\nম্যাটেরিয়াল - ফাইন কোয়ালিটি কটন সুতার তৈরি।\nসাইজ - १३ হাত + শাড়ি।',
            },
            {
              id: 10,
              name: 'Mid range monipuri saree',
              price: '4,500',
              description: 'মনিপুরী শাড়ি\nম্যাটেরিয়াল - ফাইন কোয়ালিটি কটন সুতার তৈরি।\nসাইজ - १३ হাত + শাড়ি।',
            },
          ]}
        />

        {/* Batik & Silk Section */}
        <SaleSection 
          title="SILK & BATIK SAREES" 
          products={[
            {
              id: 11,
              name: 'Silk batik saree',
              price: '1,150',
              description: 'সিল্ক বাটিক শাড়ি\nম্যাটেরিয়াল - সফ্ট প্রিমিয়াম কুমিল্লা সিল্ক।\nসাইজ - सাড়ে १३ হাত + শাড়ি।',
            },
            {
              id: 12,
              name: 'Silk Madhurai Saree',
              price: '1,450',
              description: 'সিল্ক মাদুরাই শাড়ি\nম্যাটেরিয়াল - প্রিমিয়াম কোয়ালিটি সিল্ক।\nসাইজ - १३ হাত + শাড়ি।',
            },
            {
              id: 13,
              name: 'Cotton batik saree',
              price: '1,280',
              description: 'কটন বাটিক শাড়ি\nম্যাটেরিয়াল - কটন।\nসাইজ - १३ হাত + শাড়ি।',
            },
            {
              id: 14,
              name: 'Cotton batik saree',
              price: '1,280',
              description: 'কটন বাটিক শাড়ি\nম্যাটেরিয়াল - কটন।\nসাইজ - १३ হাত + শাড়ি।',
            },
            {
              id: 15,
              name: 'Cotton madurai saree',
              price: '1,450',
              description: 'কটন মাদুরাই শাড়ি\nম্যাটেরিয়াল - কটন।\nসাইজ - १३ हाত + শাড়ি।',
            },
          ]}
        />
      </main>

      <Footer />
    </div>
  );
}
