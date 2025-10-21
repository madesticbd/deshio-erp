'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingCart, Heart, Share2, Minus, Plus, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import Navigation from '@/components/ecommerce/Navigation';

interface Product {
  id: string | number;
  name: string;
  attributes: {
    mainImage?: string;
    category?: string;
    subcategory?: string;
    subSubcategory?: string;
    Price?: string;
    Color?: string;
    Size?: string;
    Description?: string;
    Usage?: string;
    Image?: string[];
    [key: string]: any;
  };
}

interface InventoryItem {
  productId: string | number;
  status: string;
  sellingPrice?: number;
}

interface ProductVariation {
  id: string | number;
  name: string;
  attributes: any;
  price: string;
  available: number;
  images: string[];
}

interface Category {
  id: string;
  title: string;
  slug: string;
  subcategories?: Category[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [availableStock, setAvailableStock] = useState(0);
  const [categoryPath, setCategoryPath] = useState<string[]>([]);
  const [categoryName, setCategoryName] = useState<string>('');

  const getBaseName = (name: string): string => {
    return name.replace(/\s*-\s*Variation\s+\d+$/i, '').trim();
  };

    const getAllImages = (product: Product): string[] => {
      const images: string[] = [];

      // If there are extra images, prioritize them
      if (product.attributes.Image && Array.isArray(product.attributes.Image) && product.attributes.Image.length > 0) {
        images.push(...product.attributes.Image);

        // Add main image at the end (optional, to keep it in gallery view)
        if (product.attributes.mainImage) {
          images.push(product.attributes.mainImage);
        }
      } 
      // If there are no extra images, just use mainImage
      else if (product.attributes.mainImage) {
        images.push(product.attributes.mainImage);
      }

      return images;
    };



  const findCategoryPath = (categories: Category[], targetId: string, path: string[] = []): string[] | null => {
    for (const cat of categories) {
      const currentPath = [...path, cat.title];
      if (cat.id === targetId) {
        return currentPath;
      }
      if (cat.subcategories) {
        const found = findCategoryPath(cat.subcategories, targetId, currentPath);
        if (found) return found;
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsRes = await fetch('/api/products');
        const allProducts: Product[] = await productsRes.json();

        const inventoryRes = await fetch('/api/inventory');
        const inventory: InventoryItem[] = await inventoryRes.json();

        const categoriesRes = await fetch('/api/categories');
        const categories: Category[] = await categoriesRes.json();

        // Find the main product or variation by ID
        const foundProduct = allProducts.find(p => p.id.toString() === productId);
        
        if (!foundProduct) {
          setLoading(false);
          return;
        }

        setProduct(foundProduct);

        // Get category path
        if (foundProduct.attributes.category) {
          const path = findCategoryPath(categories, foundProduct.attributes.category);
          if (path) {
            setCategoryPath(path);
            setCategoryName(path[path.length - 1]);
          }
        }

        // Check if this product has variations
        const baseName = getBaseName(foundProduct.name);
        const relatedProducts = allProducts.filter(p => 
          getBaseName(p.name) === baseName
        );

        if (relatedProducts.length > 1) {
          // Has variations
          const variationsWithInventory = relatedProducts.map(p => {
            const productInventory = inventory.filter(
              item => item.productId === p.id || item.productId === Number(p.id)
            );
            const available = productInventory.filter(item => item.status === 'available').length;
            let price = p.attributes.Price || '0';
            if (!p.attributes.Price && productInventory.length > 0) {
              const firstItem = productInventory[0];
              price = firstItem.sellingPrice?.toString() || '0';
            }

            return {
              id: p.id,
              name: p.name,
              attributes: p.attributes,
              price,
              available,
              images: getAllImages(p)
            };
          });

          setVariations(variationsWithInventory);
          
          // Set the current product as selected variation
          const currentVariation = variationsWithInventory.find(v => v.id.toString() === productId);
          if (currentVariation) {
            setSelectedVariation(currentVariation);
            setAvailableStock(currentVariation.available);
          } else {
            setSelectedVariation(variationsWithInventory[0]);
            setAvailableStock(variationsWithInventory[0].available);
          }
        } else {
          // No variations, single product
          const productInventory = inventory.filter(
            item => item.productId === foundProduct.id || item.productId === Number(foundProduct.id)
          );
          const available = productInventory.filter(item => item.status === 'available').length;
          let price = foundProduct.attributes.Price || '0';
          if (!foundProduct.attributes.Price && productInventory.length > 0) {
            const firstItem = productInventory[0];
            price = firstItem.sellingPrice?.toString() || '0';
          }

          const singleVariation = {
            id: foundProduct.id,
            name: foundProduct.name,
            attributes: foundProduct.attributes,
            price,
            available,
            images: getAllImages(foundProduct)
          };

          setVariations([singleVariation]);
          setSelectedVariation(singleVariation);
          setAvailableStock(available);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchData();
    }
  }, [productId]);

  const handleVariationChange = (variation: ProductVariation) => {
    setSelectedVariation(variation);
    setAvailableStock(variation.available);
    setSelectedImageIndex(0);
    setQuantity(1);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= availableStock) {
      setQuantity(newQuantity);
    }
  };

  const handlePrevImage = () => {
    if (!selectedVariation) return;
    setSelectedImageIndex((prev) => 
      prev === 0 ? selectedVariation.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!selectedVariation) return;
    setSelectedImageIndex((prev) => 
      prev === selectedVariation.images.length - 1 ? 0 : prev + 1
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product || !selectedVariation) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <button
              onClick={() => router.back()}
              className="text-red-700 hover:text-red-800"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const baseName = getBaseName(product.name);
  const currentImages = selectedVariation.images.length > 0 
    ? selectedVariation.images 
    : ['/placeholder-image.jpg'];

  // Get non-variation attributes for display
  const nonVariationAttributes = Object.entries(selectedVariation.attributes)
    .filter(([key]) => !['mainImage', 'Image', 'category', 'subcategory', 'subSubcategory', 'Price', 'Color', 'Size'].includes(key))
    .filter(([, value]) => value && value !== '');

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => router.push('/')} className="text-gray-600 hover:text-gray-900">
              Home
            </button>
            <span className="text-gray-400">/</span>
            <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
              Shop
            </button>
            {categoryPath.map((cat, index) => (
              <React.Fragment key={index}>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600 hover:text-gray-900">{cat}</span>
              </React.Fragment>
            ))}
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-semibold">{baseName}</span>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden group">
              <img
                src={currentImages[selectedImageIndex]}
                alt={selectedVariation.name}
                className="w-full h-full object-cover"
              />
              
              {currentImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {availableStock < 5 && availableStock > 0 && (
                <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Only {availableStock} left!
                </div>
              )}

              {availableStock === 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="bg-red-700 text-white px-6 py-3 rounded-lg text-lg font-bold">
                    OUT OF STOCK
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {currentImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {currentImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-red-700 ring-2 ring-red-700 ring-offset-2'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{baseName}</h1>
              <p className="text-4xl font-bold text-red-700">
                Tk. {parseFloat(selectedVariation.price).toLocaleString()}
              </p>
            </div>

            {/* Non-variation attributes (Description, Usage, etc.) */}
            {nonVariationAttributes.length > 0 && (
              <div className="border-t border-b py-4 space-y-3">
                {nonVariationAttributes.map(([key, value]) => (
                  <div key={key}>
                    <h3 className="font-semibold text-gray-900 mb-1">{key}:</h3>
                    <p className="text-gray-700 leading-relaxed">{String(value)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Variations */}
            {variations.length > 1 && (
              <div className="space-y-4">
                {/* Size Variation */}
                {variations.some(v => v.attributes.Size) && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Size:
                      <span className="ml-2 font-normal text-gray-600">
                        {selectedVariation.attributes.Size}
                      </span>
                    </label>
                    <div className="flex gap-2">
                      {Array.from(new Set(variations.map(v => v.attributes.Size).filter(Boolean))).map(size => {
                        const variation = variations.find(v => v.attributes.Size === size);
                        const isSelected = selectedVariation.attributes.Size === size;
                        const isAvailable = variation && variation.available > 0;
                        
                        return (
                          <button
                            key={size}
                            onClick={() => variation && handleVariationChange(variation)}
                            disabled={!isAvailable}
                            className={`px-6 py-3 border-2 rounded-lg font-semibold transition-all min-w-[60px] ${
                              isSelected
                                ? 'border-red-700 bg-red-50 text-red-700'
                                : isAvailable
                                ? 'border-gray-300 hover:border-gray-400 text-gray-700'
                                : 'border-gray-200 text-gray-400 cursor-not-allowed line-through'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Color Variation */}
                {variations.some(v => v.attributes.Color) && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Color:
                      <span className="ml-2 font-normal text-gray-600">
                        {selectedVariation.attributes.Color}
                      </span>
                    </label>
                    <div className="flex gap-3">
                      {Array.from(new Set(variations.map(v => v.attributes.Color).filter(Boolean))).map(color => {
                        const variation = variations.find(v => v.attributes.Color === color);
                        const isSelected = selectedVariation.attributes.Color === color;
                        const isAvailable = variation && variation.available > 0;
                        
                        return (
                          <button
                            key={color}
                            onClick={() => variation && handleVariationChange(variation)}
                            disabled={!isAvailable}
                            className={`relative px-5 py-2.5 border-2 rounded-lg font-medium transition-all ${
                              isSelected
                                ? 'border-red-700 bg-red-50 text-red-700'
                                : isAvailable
                                ? 'border-gray-300 hover:border-gray-400 text-gray-700'
                                : 'border-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {color}
                            {isSelected && (
                              <Check size={16} className="absolute -top-1 -right-1 bg-red-700 text-white rounded-full p-0.5" />
                            )}
                            {!isAvailable && (
                              <X size={16} className="absolute -top-1 -right-1 bg-gray-400 text-white rounded-full p-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-gray-900">Quantity:</label>
                <div className="flex items-center border-2 border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="px-6 py-2 font-semibold text-lg">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= availableStock}
                    className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <span className="text-sm text-gray-600">
                  {availableStock} available
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => console.log('Add to cart:', { variation: selectedVariation, quantity })}
                  disabled={availableStock === 0}
                  className="flex-1 bg-red-700 text-white py-4 rounded-lg font-bold hover:bg-red-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={20} />
                  ADD TO CART
                </button>
                <button className="p-4 border-2 border-gray-300 rounded-lg hover:border-red-700 hover:text-red-700 transition-colors">
                  <Heart size={24} />
                </button>
                <button className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-colors">
                  <Share2 size={24} />
                </button>
              </div>
            </div>

            {/* Product Meta */}
            <div className="border-t pt-6 space-y-3 text-sm">
              <div className="flex">
                <span className="font-semibold text-gray-900 w-32">SKU:</span>
                <span className="text-gray-600">{selectedVariation.id}</span>
              </div>
              {categoryName && (
                <div className="flex">
                  <span className="font-semibold text-gray-900 w-32">Category:</span>
                  <span className="text-gray-600">{categoryName}</span>
                </div>
              )}
              <div className="flex">
                <span className="font-semibold text-gray-900 w-32">Availability:</span>
                <span className={`font-semibold ${availableStock > 0 ? 'text-green-600' : 'text-red-700'}`}>
                  {availableStock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Product Information Tabs */}
        <div className="mt-16 border-t pt-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-3">Free Shipping</h3>
              <p className="text-gray-600 text-sm">Free shipping on all orders over Tk. 5,000</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-3">Easy Returns</h3>
              <p className="text-gray-600 text-sm">30-day return policy for all products</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-3">Secure Payment</h3>
              <p className="text-gray-600 text-sm">100% secure payment processing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}