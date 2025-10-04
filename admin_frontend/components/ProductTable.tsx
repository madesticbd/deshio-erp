'use client';

import { Trash2, Edit } from 'lucide-react';
import React from 'react';

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

interface ProductTableProps {
  products: Product[];
  fields: Field[];
  onDelete: (id: number) => void;
  onEdit: (product: Product) => void;
  onSelect?: (product: Product) => void; 
}

export default function ProductTable({ products, fields, onDelete, onEdit, onSelect }: ProductTableProps) {
  // Separate image fields from other fields
  const imageFields = fields.filter(f => f.type.toLowerCase() === 'image');
  const otherFields = fields.filter(f => f.type.toLowerCase() !== 'image');

  const primaryImageField = imageFields[0];

  const copyImageToClipboard = async (imageUrl: string) => {
    try {
      const loadingMessage = document.createElement('div');
      loadingMessage.textContent = 'Copying image...';
      loadingMessage.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      document.body.appendChild(loadingMessage);

      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const img = new Image();
      const imageLoadPromise = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      img.src = URL.createObjectURL(blob);
      await imageLoadPromise;

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);

      const pngBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });

      URL.revokeObjectURL(img.src);

      await (navigator as any).clipboard.write([
        new ClipboardItem({
          'image/png': pngBlob
        })
      ]);

      loadingMessage.remove();
      const message = document.createElement('div');
      message.textContent = 'Image copied!';
      message.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 1600);
    } catch (error) {
      console.error('Failed to copy image:', error);
      document.querySelectorAll('.fixed.top-4.right-4').forEach(el => el.remove());
      try {
        await navigator.clipboard.writeText(imageUrl);
        const message = document.createElement('div');
        message.textContent = 'Image URL copied instead';
        message.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 1600);
      } catch {
        alert('Failed to copy image. Your browser may not support this feature.');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto mt-4">
      <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
        <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th className="px-4 py-2">#</th>
            {primaryImageField && <th className="px-4 py-2">Image</th>}
            <th className="px-4 py-2">Product Name</th>
            {otherFields.map((field) => <th key={field.id} className="px-4 py-2">{field.name}</th>)}
            {imageFields.slice(1).map((field) => <th key={field.id} className="px-4 py-2">{field.name}</th>)}
            <th className="px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.length > 0 ? products.map((product, index) => (
            <tr key={product.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-4 py-2">{index + 1}</td>

              {primaryImageField && (
                <td className="px-4 py-2">
                  {product.attributes?.[primaryImageField.name] ? (
                    <div className="relative group">
                      <img
                        src={product.attributes[primaryImageField.name]}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => copyImageToClipboard(product.attributes[primaryImageField.name])}
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                        title="Click to copy image"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-40 rounded-lg pointer-events-none">
                        <span className="text-white text-xs font-medium">Copy</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xs text-gray-400">No Image</div>
                  )}
                </td>
              )}

              <td className="px-4 py-2 font-medium">{product.name}</td>

              {otherFields.map((field) => (
                <td key={field.id} className="px-4 py-2">{product.attributes?.[field.name] ?? '-'}</td>
              ))}

              {imageFields.slice(1).map((field) => (
                <td key={field.id} className="px-4 py-2">
                  {product.attributes?.[field.name] ? (
                    <div className="relative group">
                      <img
                        src={product.attributes[field.name]}
                        alt={field.name}
                        className="w-12 h-12 object-cover rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => copyImageToClipboard(product.attributes[field.name])}
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Crect width="48" height="48" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="10" fill="%23999"%3ENo Img%3C/text%3E%3C/svg%3E';
                        }}
                        title="Click to copy image"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-40 rounded pointer-events-none">
                        <span className="text-white text-xs font-medium">Copy</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400">-</div>
                  )}
                </td>
              ))}

              <td className="px-4 py-2 text-right whitespace-nowrap">
                {/* Select button (only when onSelect provided) */}
                {onSelect ? (
                  <button
                    onClick={() => onSelect(product)}
                    className="text-xs px-2 py-1 bg-black text-white rounded mr-2"
                  >
                    Select
                  </button>
                ) : null}

                <button onClick={() => onEdit(product)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                  <Edit className="w-4 h-4 inline" /> Edit
                </button>

                <button onClick={() => onDelete(product.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                  <Trash2 className="w-4 h-4 inline" /> Delete
                </button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={fields.length + 4} className="text-center py-6 text-gray-500">No products found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
