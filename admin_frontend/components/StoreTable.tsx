import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

interface Store {
  branchName: string;
  address: string;
  pathaoKey: string;
  type: 'Warehouse' | 'Store';
}

interface StoreTableProps {
  stores: Store[];
  onEdit?: (store: Store) => void;
  onDelete?: (store: Store) => void;
}

export default function StoreTable({ stores, onEdit, onDelete }: StoreTableProps) {
  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-950">
              <th className="text-left px-6 py-4 text-neutral-400 font-medium whitespace-nowrap">
                Branch Name
              </th>
              <th className="text-left px-6 py-4 text-neutral-400 font-medium whitespace-nowrap">
                Address
              </th>
              <th className="text-left px-6 py-4 text-neutral-400 font-medium whitespace-nowrap">
                Pathao Key
              </th>
              <th className="text-left px-6 py-4 text-neutral-400 font-medium whitespace-nowrap">
                Type
              </th>
              <th className="text-left px-6 py-4 text-neutral-400 font-medium whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store, index) => (
              <tr
                key={index}
                className="border-b border-neutral-800 hover:bg-neutral-800 transition-colors"
              >
                <td className="px-6 py-4 text-white font-medium whitespace-nowrap">
                  {store.branchName}
                </td>
                <td className="px-6 py-4 text-neutral-300">{store.address}</td>
                <td className="px-6 py-4 text-neutral-300 whitespace-nowrap">{store.pathaoKey}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                      store.type === 'Warehouse'
                        ? 'bg-blue-900 text-blue-300'
                        : 'bg-green-900 text-green-300'
                    }`}
                  >
                    {store.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onEdit?.(store)}
                      className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-neutral-400 hover:text-white" />
                    </button>
                    <button
                      onClick={() => onDelete?.(store)}
                      className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-neutral-400 hover:text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}