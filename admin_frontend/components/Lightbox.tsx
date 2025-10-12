'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxProps {
  image: string;
  productName: string;
  onClose: () => void;
  allImages: string[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export default function Lightbox({ image, productName, onClose, allImages, currentIndex, onNavigate }: LightboxProps) {
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + image);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image;
    link.download = image.split('/').pop() || 'image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const goPrevious = () => currentIndex > 0 && onNavigate(currentIndex - 1);
  const goNext = () => currentIndex < allImages.length - 1 && onNavigate(currentIndex + 1);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrevious();
      if (e.key === 'ArrowRight') goNext();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = 'unset'; window.removeEventListener('keydown', handleKey); };
  }, [currentIndex, allImages.length]);

  return (
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-95 flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full z-10">
        <X className="w-5 h-5 text-gray-900 dark:text-white"/>
      </button>

      {currentIndex > 0 && <button onClick={goPrevious} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-gray-800 rounded-full z-10"><ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white"/></button>}
      {currentIndex < allImages.length - 1 && <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-gray-800 rounded-full z-10"><ChevronRight className="w-5 h-5 text-gray-900 dark:text-white"/></button>}

      <div className="relative max-w-7xl max-h-full p-4">
        <img src={image} alt={productName} className="max-w-full max-h-[80vh] object-contain" style={{ transform: `scale(${zoom})` }} />

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4">
          <h3 className="text-white text-lg font-semibold">{productName}</h3>
          <p className="text-gray-300 text-sm">Image {currentIndex + 1} of {allImages.length}</p>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex gap-2">
        <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-2 bg-white dark:bg-gray-800 rounded-full"><ZoomOut className="w-4 h-4 text-gray-900 dark:text-white"/></button>
        <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="p-2 bg-white dark:bg-gray-800 rounded-full"><ZoomIn className="w-4 h-4 text-gray-900 dark:text-white"/></button>
        <button onClick={handleDownload} className="p-2 bg-white dark:bg-gray-800 rounded-full"><Download className="w-4 h-4 text-gray-900 dark:text-white"/></button>
        <button onClick={copyToClipboard} className="p-2 bg-white dark:bg-gray-800 rounded-full">{copied ? <Check className="w-4 h-4 text-green-600"/> : <Copy className="w-4 h-4 text-gray-900 dark:text-white"/>}</button>
      </div>
    </div>
  );
}
