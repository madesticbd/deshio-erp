'use client';

import { Image as ImageIcon, AlertCircle, Copy, Check, Download } from 'lucide-react';
import { Product } from '@/types/product';
import { useState } from 'react';

interface GalleryGridProps {
  products: Product[];
  getAllImages: (product: Product) => string[];
  openLightbox: (
    image: string,
    productName: string,
    productImages: string[],
    imageIndex: number
  ) => void;
}

export default function GalleryGrid({
  products,
  getAllImages,
  openLightbox,
}: GalleryGridProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [copiedImage, setCopiedImage] = useState<string | null>(null);
  const [copyType, setCopyType] = useState<'image' | 'link' | null>(null);

  const handleImageError = (imagePath: string) => {
    setImageErrors((prev) => new Set(prev).add(imagePath));
  };

  const isMobile = () => /Mobi|Android/i.test(navigator.userAgent);

  const convertBlobToPng = async (blob: Blob): Promise<Blob> => {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(bitmap, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject('PNG conversion failed')),
        'image/png'
      );
    });
  };

  // Desktop: copy image to clipboard
  const copyImageToClipboard = async (imagePath: string) => {
    try {
      const res = await fetch(imagePath, { mode: 'cors' });
      const blob = await res.blob();

      if (
        navigator.clipboard &&
        typeof ClipboardItem !== 'undefined' &&
        'write' in navigator.clipboard
      ) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        } catch {
          const pngBlob = await convertBlobToPng(blob);
          await navigator.clipboard.write([new ClipboardItem({ [pngBlob.type]: pngBlob })]);
        }
        setCopyType('image');
      } else {
        await navigator.clipboard.writeText(imagePath.startsWith('http') ? imagePath : window.location.origin + imagePath);
        setCopyType('link');
      }
    } catch {
      await navigator.clipboard.writeText(imagePath.startsWith('http') ? imagePath : window.location.origin + imagePath);
      setCopyType('link');
    } finally {
      setCopiedImage(imagePath);
      setTimeout(() => {
        setCopiedImage(null);
        setCopyType(null);
      }, 2000);
    }
  };

  // Mobile: download image instead
  const saveImage = (imagePath: string) => {
    const link = document.createElement('a');
    link.href = imagePath;
    link.download = imagePath.split('/').pop() || 'image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCopiedImage(imagePath);
    setCopyType('image');
    setTimeout(() => {
      setCopiedImage(null);
      setCopyType(null);
    }, 2000);
  };

  const handleCopyOrSave = (e: React.MouseEvent | React.TouchEvent, imagePath: string) => {
    e.stopPropagation();
    if (isMobile()) {
      saveImage(imagePath);
    } else {
      copyImageToClipboard(imagePath);
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
      {products.map((product) => {
        const images = getAllImages(product);

        return images.map((img, index) => {
          const hasError = imageErrors.has(img);

          return (
            <div
              key={`${product.id}-${index}`}
              className="group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl cursor-pointer"
              onClick={() => !hasError && openLightbox(img, product.name, images, index)}
            >
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                {hasError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-center px-2">
                    <AlertCircle className="w-12 h-12 mb-2" />
                    <p className="text-xs">Image not found</p>
                    <p className="text-xs break-all">{img}</p>
                  </div>
                ) : (
                  <>
                    <img
                      src={img}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={() => handleImageError(img)}
                    />

                    {/* Copy/Save Button */}
                    <button
                      onClick={(e) => handleCopyOrSave(e, img)}
                      onTouchEnd={(e) => handleCopyOrSave(e, img)}
                      className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white dark:hover:bg-gray-800 shadow-md z-10"
                      title={isMobile() ? "Save image" : "Copy image"}
                    >
                      {copiedImage === img ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      )}
                    </button>

                    {/* Copied/Saved Message */}
                    {copiedImage === img && (
                      <div
                        className={`absolute top-14 right-2 px-3 py-1.5 rounded-md shadow-lg z-10 animate-fade-in ${
                          copyType === 'image' ? 'bg-gray-900 text-white' : 'bg-blue-600 text-white'
                        }`}
                      >
                        {isMobile() ? 'Saved to device' : 'Image copied'}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="p-3">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {product.name}
                </h3>
                {product.attributes.Colour && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {product.attributes.Colour}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{index === 0 ? 'Main Image' : `Image ${index + 1}`}</span>
                  <span>
                    {images.length} {images.length === 1 ? 'image' : 'images'}
                  </span>
                </div>
              </div>
            </div>
          );
        });
      })}
    </div>
  );
}
