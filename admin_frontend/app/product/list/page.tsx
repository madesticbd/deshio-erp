'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

  const router = useRouter();
  const searchParams = useSearchParams();

  // selection mode detection
  const selectMode = searchParams?.get('selectMode') === 'true';
  const redirectUrl = searchParams?.get('redirect') || '';

  // Fetch fields and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [fieldsRes, productsRes] = await Promise.all([
          fetch('/api/fields'),
          fetch('/api/products'),
        ]);

        if (fieldsRes.ok) {
          const fieldsData = await fieldsRes.json();
          setFields(Array.isArray(fieldsData) ? fieldsData : []);
        } else setFields([]);

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(Array.isArray(productsData) ? productsData : []);
        } else setProducts([]);

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

  // handle select product when in selectMode
  const handleSelect = (product: Product) => {
    if (selectMode && redirectUrl) {
      // pass back product id and name
      const url = `${redirectUrl}?productId=${product.id}&productName=${encodeURIComponent(product.name)}`;
      router.push(url);
    }
  };

  // Filter + Pagination logic (kept same)
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter((p) =>
      p?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  // ... keep your add/edit/delete functions (omitted here to save space)
  // Make sure to include handleAddProduct, handleEditProduct, handleDelete, etc.
  // (Copy them unchanged from your existing ProductPage implementation)

  return (
    <div className={`${darkMode ? 'dark' : ''} flex h-screen`}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />

        <main className="flex-1 bg-gray-50 dark:bg-gray-900 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectMode ? 'Select a Product' : 'Products'}
            </h2>

            {!selectMode && (
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowForm(true);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-lg"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            )}
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
                onDelete={(id) => {
                  // call existing delete handler (copy from your code)
                  // you already have it — wire it here
                }}
                onEdit={(prod) => {
                  // open edit modal
                }}
                onSelect={selectMode ? handleSelect : undefined} // <-- pass it only in selectMode
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
            onSave={editingProduct ? /* handleEditProduct */ () => {} : /* handleAddProduct */ () => {}}
          />
        </main>
      </div>
    </div>
  );
}
