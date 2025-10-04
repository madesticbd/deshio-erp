import React from "react";
import Barcode from "react-barcode";

interface BarcodeItemProps {
  code: string;
  isSelected: boolean;
  quantity: number;
  onToggle: (code: string) => void;
  onQuantityChange: (code: string, qty: number) => void;
}

export default function BarcodeItem({
  code,
  isSelected,
  quantity,
  onToggle,
  onQuantityChange,
}: BarcodeItemProps) {
  return (
    <div className="flex items-center gap-4 border rounded p-3 bg-gray-50">
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(code)}
        className="w-4 h-4"
      />

      {/* Barcode Display */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Barcode
            value={code}
            format="CODE128"
            renderer="svg"
            width={1.5}
            height={60}
            displayValue={true}
            fontSize={14}
          />
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => onQuantityChange(code, parseInt(e.target.value) || 1)}
          disabled={!isSelected}
          className="w-16 px-2 py-1 border rounded text-center"
        />
      </div>
    </div>
  );
}