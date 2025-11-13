"use client";
import React, { useState, useEffect } from "react";
import BarcodeSelectionModal from "./BarcodeSelectionModal";
import barcodeService, { BarcodeInfo } from "@/services/barcodeService";

interface Product {
  id: number;
  name: string;
}

interface Batch {
  id: number;
  productId: number;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  baseCode: string;
}

interface BatchPrinterProps {
  batch: Batch;
  product?: Product;
}

export default function BatchPrinter({ batch, product }: BatchPrinterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQzLoaded, setIsQzLoaded] = useState(false);
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [isLoadingBarcodes, setIsLoadingBarcodes] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20;

    const checkQZ = () => {
      attempts++;
      
      if (typeof window !== "undefined" && (window as any).qz) {
        console.log("✅ QZ Tray library loaded");
        setIsQzLoaded(true);
        return true;
      }
      
      return false;
    };

    if (checkQZ()) return;

    const interval = setInterval(() => {
      if (checkQZ() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts) {
          console.warn("QZ Tray not detected. Install QZ Tray to enable barcode printing.");
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Fetch barcodes from backend when modal opens
  const fetchBarcodes = async () => {
    if (!product?.id) {
      setBarcodeError("Product information not available");
      return;
    }

    setIsLoadingBarcodes(true);
    setBarcodeError(null);

    try {
      const response = await barcodeService.getProductBarcodes(product.id);
      
      if (response.success && response.data.barcodes) {
        // Extract barcode strings from the response
        const barcodeCodes = response.data.barcodes
          .filter((b: BarcodeInfo) => b.is_active)
          .map((b: BarcodeInfo) => b.barcode);
        
        if (barcodeCodes.length === 0) {
          setBarcodeError("No active barcodes found for this product");
        } else {
          setBarcodes(barcodeCodes);
        }
      } else {
        setBarcodeError("Failed to fetch barcodes");
      }
    } catch (error: any) {
      console.error("Error fetching barcodes:", error);
      setBarcodeError(error.message || "Failed to fetch barcodes from server");
    } finally {
      setIsLoadingBarcodes(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    fetchBarcodes();
  };

  const handleQZPrint = async (
    selected: string[],
    quantities: Record<string, number>
  ) => {
    if (!(window as any).qz) {
      alert("QZ Tray library not loaded. Please refresh the page or install QZ Tray.");
      return;
    }

    try {
      if (!(await (window as any).qz.websocket.isActive())) {
        await (window as any).qz.websocket.connect();
      }

      const config = (window as any).qz.configs.create(null);

      const data: any[] = [];
      selected.forEach((code) => {
        const qty = quantities[code] || 1;
        for (let i = 0; i < qty; i++) {
          data.push({
            type: "html",
            format: "plain",
            data: `
              <html>
                <head>
                  <script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/JsBarcode.all.min.js"></script>
                  <style>
                    body { margin: 0; padding: 10px; font-family: Arial, sans-serif; }
                    .barcode-container { text-align: center; }
                    .product-name { font-weight: bold; font-size: 14px; margin-bottom: 3px; }
                    .price { font-size: 16px; font-weight: bold; color: #000; margin-bottom: 5px; }
                  </style>
                </head>
                <body>
                  <div class="barcode-container">
                    <div class="product-name">${product?.name || 'Product'}</div>
                    <div class="price">৳${batch.sellingPrice.toLocaleString('en-BD')}</div>
                    <svg id="barcode-${code}-${i}"></svg>
                    <script>
                      JsBarcode("#barcode-${code}-${i}", "${code}", {
                        format:"CODE128",
                        width: 2,
                        height: 50,
                        displayValue: true
                      });
                    </script>
                  </div>
                </body>
              </html>
            `,
          });
        }
      });

      await (window as any).qz.print(config, data);
      alert(`${data.length} barcode(s) sent to printer successfully!`);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Print error:", err);
      
      if (err.message && err.message.includes("Unable to establish connection")) {
        alert("QZ Tray is not running. Please start QZ Tray and try again.\n\nDownload from: https://qz.io/download/");
      } else {
        alert(`Print failed: ${err.message || "Unknown error"}`);
      }
    } finally {
      try {
        if ((window as any).qz.websocket.isActive()) {
          await (window as any).qz.websocket.disconnect();
        }
      } catch (e) {
        console.error("Disconnect error:", e);
      }
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="w-full px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!isQzLoaded}
        title={!isQzLoaded ? "QZ Tray not detected. Install QZ Tray to enable printing." : "Print barcodes using QZ Tray"}
      >
        {isQzLoaded ? "Print Barcodes" : "QZ Tray Not Detected"}
      </button>

      <BarcodeSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        codes={barcodes}
        productName={product?.name || "Product"}
        price={batch.sellingPrice}
        onPrint={handleQZPrint}
        isLoading={isLoadingBarcodes}
        error={barcodeError}
      />
    </>
  );
}