import React from "react";
import Barcode from "react-barcode";

interface BarcodeItemProps {
  code: string;
  isSelected: boolean;
  quantity: number;
  productName?: string;
  price?: number;
  onToggle: (code: string) => void;
  onQuantityChange: (code: string, qty: number) => void;
}

export default function BarcodeItem({
  code,
  isSelected,
  quantity,
  productName,
  price,
  onToggle,
  onQuantityChange,
}: BarcodeItemProps) {
  return (
    <div className="flex items-center gap-3 border rounded p-2.5 bg-gray-50">
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(code)}
        className="w-4 h-4 flex-shrink-0"
      />

      {/* Barcode Display with Product Info */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          {/* Product Name */}
          {productName && (
            <div className="font-semibold text-xs mb-0.5">{productName}</div>
          )}
          {/* Price */}
          {price !== undefined && (
            <div className="font-bold text-sm mb-1">৳{price}</div>
          )}
          {/* Barcode */}
          <Barcode
            value={code}
            format="CODE128"
            renderer="svg"
            width={1.2}
            height={40}
            displayValue={true}
            fontSize={11}
          />
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => onQuantityChange(code, parseInt(e.target.value) || 1)}
          disabled={!isSelected}
          className="w-14 px-2 py-1 border rounded text-center text-sm"
        />
      </div>
    </div>
  );
}