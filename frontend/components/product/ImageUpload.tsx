import { X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  label: string;
  preview?: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove?: () => void;
  optional?: boolean;
}

export default function ImageUpload({
  label,
  preview,
  onUpload,
  onRemove,
  optional = false
}: ImageUploadProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {optional && <span className="text-gray-500 font-normal">(Optional)</span>}
      </label>
      {optional && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          A placeholder image will be used if not provided
        </p>
      )}
      
      {!preview ? (
        <label className="cursor-pointer block">
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-800/50">
            <ImageIcon className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Click to upload image</span>
            <span className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG up to 5MB</span>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={onUpload}
            className="hidden"
          />
        </label>
      ) : (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
          />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}