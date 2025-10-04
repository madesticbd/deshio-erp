'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Plus } from 'lucide-react';
import ProductTable from '@/components/ProductTable';
import SearchBar from '@/components/SearchBar';
import PaginationControls from '@/components/PaginationControls';
import AddProductModal from '@/components/AddProductModal';

interface Field {
  id: number;
  name: string;
  type: string;
}

interface Product {
  id: number;
  name: string;
  attributes: Record<string, any>;
}

export default function ProductPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const productsPerPage = 4;

  // Fetch fields and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch fields
        const fieldsRes = await fetch('/api/fields');
        if (fieldsRes.ok) {
          const fieldsData = await fieldsRes.json();
          setFields(Array.isArray(fieldsData) ? fieldsData : []);
        }
        
        // Fetch products
        const productsRes = await fetch('/api/products');
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(Array.isArray(productsData) ? productsData : []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setFields([]);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter + Pagination
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    
    return products.filter((p) =>
      p?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  // Add Product
  const handleAddProduct = async (data: Record<string, any>) => {
    try {
      const newProduct = {
        id: Date.now(),
        name: data.name,
        attributes: { ...data }
      };
      delete newProduct.attributes.name;

      console.log('Sending new product:', newProduct);

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      if (res.ok) {
        const savedProduct = await res.json();
        console.log('Saved product:', savedProduct);
        setProducts((prev) => [...prev, savedProduct]);
        setShowForm(false);
      } else {
        const errorData = await res.json();
        console.error('Server error:', errorData);
        alert(`Failed to save product: ${errorData.details || errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Network error: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // Edit Product
  const handleEditProduct = async (data: Record<string, any>) => {
    if (!editingProduct) return;

    try {
      const updatedProduct = {
        ...editingProduct,
        name: data.name,
        attributes: { ...data }
      };
      delete updatedProduct.attributes.name;

      console.log('Updating product:', updatedProduct);

      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      });

      if (res.ok) {
        const savedProduct = await res.json();
        console.log('Updated product:', savedProduct);
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? savedProduct : p)));
        setShowForm(false);
        setEditingProduct(null);
      } else {
        const errorData = await res.json();
        console.error('Server error:', errorData);
        alert(`Failed to update product: ${errorData.details || errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Network error: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // Open Edit Modal
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  // Delete Product
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
        console.log('Product deleted successfully');
      } else {
        const errorData = await res.json();
        console.error('Server error:', errorData);
        alert(`Failed to delete product: ${errorData.details || errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Network error: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className={`${darkMode ? 'dark' : ''} flex h-screen`}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />

        <main className="flex-1 bg-gray-50 dark:bg-gray-900 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Products
            </h2>
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-lg"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>

          <SearchBar value={searchTerm} onChange={setSearchTerm} />
          
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading products...
            </div>
          ) : (
            <>
              <ProductTable 
                products={currentProducts} 
                fields={fields}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}

          <AddProductModal
            open={showForm}
            title={editingProduct ? 'Edit Product' : 'Add New Product'}
            fields={fields}
            initialData={editingProduct ? { name: editingProduct.name, ...editingProduct.attributes } : undefined}
            onClose={() => {
              setShowForm(false);
              setEditingProduct(null);
            }}
            onSave={editingProduct ? handleEditProduct : handleAddProduct}
          />
        </main>
      </div>
    </div>
  );
}