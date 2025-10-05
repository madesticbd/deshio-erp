import { Trash2, Edit } from 'lucide-react';

interface Field {
  id: number;
  name: string;
  type: string;
  description?: string;
}

interface FieldTableProps {
  fields: Field[];
  onDelete: (id: number) => void;
  onEdit: (field: Field) => void;
}

export default function FieldTable({ fields, onDelete, onEdit }: FieldTableProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto mt-4">
      <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
        <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th className="px-4 py-2">#</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {fields.length > 0 ? (
            fields.map((field, index) => (
              <tr
                key={field.id}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td className="px-4 py-2">{index + 1}</td>
                <td className="px-4 py-2">{field.name}</td>
                <td className="px-4 py-2">{field.type}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(field)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                      title="Edit field"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => onDelete(field.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                      title="Delete field"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center py-6 text-gray-500">
                No fields found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}