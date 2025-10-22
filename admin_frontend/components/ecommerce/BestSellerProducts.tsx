'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Eye } from 'lucide-react';

interface Product {
  id: string | number;
  name: string;
  attributes: {
    mainImage?: string;
    category?: string;
    subcategory?: string;
    Price?: string;
    [key: string]: string | undefined;
  };
}

interface InventoryItem {
  productId: string | number;
  status: string;
  sellingPrice?: number;
}

interface ProductWithStats {
  id: string | number;
  name: string;
  image: string;
  price: string;
  soldCount: number;
}

export default function BestSellerProducts() {
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const [bestSellers, setBestSellers] = useState<ProductWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsRes = await fetch('/api/products');
        const products: Product[] = await productsRes.json();

        // Fetch inventory
        const inventoryRes = await fetch('/api/inventory');
        const inventory: InventoryItem[] = await inventoryRes.json();

        // Calculate sold count for each product
        const productsWithStats: ProductWithStats[] = products.map(product => {
          const productInventory = inventory.filter(
            item => item.productId === product.id || item.productId === Number(product.id)
          );

          const soldCount = productInventory.filter(item => item.status === 'sold').length;

          // Get price from product attributes or from inventory
          let price = product.attributes.Price || '0';
          if (!product.attributes.Price && productInventory.length > 0) {
            const firstItem = productInventory[0];
            price = firstItem.sellingPrice?.toString() || '0';
          }

          return {
            id: product.id,
            name: product.name,
            image: product.attributes.mainImage || '',
            price: price,
            soldCount,
          };
        });

        // Sort by sold count and get top 5
        const sorted = productsWithStats
          .filter(p => p.soldCount > 0) // Only products that have been sold
          .sort((a, b) => b.soldCount - a.soldCount)
          .slice(0, 5);

        setBestSellers(sorted);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">Loading best sellers...</p>
          </div>
        </div>
      </section>
    );
  }

  if (bestSellers.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Best Sellers</h2>
          <p className="text-lg text-gray-600">Our customers' favorite picks</p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {bestSellers.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300"
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
                    e.currentTarget.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E%3Crect fill="%23f3f4f6" width="300" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="16"%3E' +
                      encodeURIComponent(product.name) +
                      '%3C/text%3E%3C/svg%3E';
                  }}
                />
          
                {/* Action Buttons */}
                <div
                  className={`absolute top-2 right-2 flex flex-col gap-2 transition-all duration-300 ${
                    hoveredId === product.id ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                  }`}
                >
                  <button className="p-2 bg-white rounded-lg shadow-lg hover:bg-red-50 transition-colors">
                    <Heart size={16} className="text-gray-700" />
                  </button>
                  <button className="p-2 bg-white rounded-lg shadow-lg hover:bg-blue-50 transition-colors">
                    <Eye size={16} className="text-gray-700" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  className={`absolute bottom-0 left-0 right-0 bg-gray-900 text-white py-3 text-sm font-semibold transition-transform duration-300 flex items-center justify-center gap-2 ${
                    hoveredId === product.id ? 'translate-y-0' : 'translate-y-full'
                  }`}
                >
                  <ShoppingCart size={16} />
                  Add to Cart
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-700 transition-colors cursor-pointer">
                  {product.name}
                </h3>

                <span className="text-lg font-bold text-gray-900">
                  ৳{parseFloat(product.price).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}