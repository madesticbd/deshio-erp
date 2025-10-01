'use client';

import { LayoutDashboard, Store, FolderTree, Package, ClipboardList, CreditCard } from 'lucide-react';

export default function Sidebar() {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: false },
    { icon: Store, label: 'Store', active: true },
    { icon: FolderTree, label: 'Category', active: false },
    { icon: Package, label: 'Product', active: false },
    { icon: ClipboardList, label: 'Inventory', active: false },
    { icon: CreditCard, label: 'Transaction', active: false },
  ];

  return (
    <aside className="w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded flex items-center justify-center">
            <span className="text-white dark:text-gray-900 text-sm font-semibold">E</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white">ERP Admin</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">E-Commerce Management</p>
          </div>
        </div>
      </div>

      <nav className="p-3">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 mb-2">Main Menu</p>
        <ul className="space-y-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              <a
                href="#"
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${
                  item.active
                    ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
