"use client";
import React, { useState } from "react";
import BarcodeSelectionModal from "./BarcodeSelectionModal";

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

  // Generate barcode strings
  const codes = Array.from({ length: batch.quantity }).map(
    (_, i) => `${batch.baseCode}-${String(i + 1).padStart(2, "0")}`
  );

  // Print using QZ Tray
  const handleQZPrint = async (
    selected: string[],
    quantities: Record<string, number>
  ) => {
    if (!(window as any).qz) {
      alert("QZ Tray library not loaded. Did you include qz-tray.js?");
      return;
    }

    try {
      await (window as any).qz.websocket.connect();
      const config = (window as any).qz.configs.create(null);

      // Create print data with multiple copies based on quantity
      const data: any[] = [];
      selected.forEach((code) => {
        const qty = quantities[code] || 1;
        for (let i = 0; i < qty; i++) {
          data.push({
            type: "html",
            format: "plain",
            data: `<div style="text-align:center;margin:10px;">
                     <svg id="barcode-${code}-${i}"></svg>
                     <script>
                       JsBarcode("#barcode-${code}-${i}", "${code}", {format:"CODE128"});
                     </script>
                   </div>`,
          });
        }
      });

      await (window as any).qz.print(config, data);
      await (window as any).qz.websocket.disconnect();
      alert("Barcodes sent to printer successfully!");
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to print. Make sure QZ Tray is running.");
    }
  };

  return (
    <div className="mt-4">
      {/* Print Barcodes Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
      >
        Print Barcodes
      </button>

      {/* Barcode Selection Modal */}
      <BarcodeSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        codes={codes}
        productName={product?.name || "Product"}
        onPrint={handleQZPrint}
      />
    </div>
  );
}