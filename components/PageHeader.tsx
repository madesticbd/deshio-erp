import React from 'react';
import { Plus } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export default function PageHeader({ 
  title, 
  buttonText = 'Add Store', 
  onButtonClick 
}: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6 gap-4">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <button
        onClick={onButtonClick}
        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap"
      >
        <Plus className="w-5 h-5" />
        {buttonText}
      </button>
    </div>
  );
}