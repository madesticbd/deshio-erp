'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, FolderTree, Package, ClipboardList, CreditCard, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggleSubMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Store, label: 'Store', href: '/store' },
    { icon: FolderTree, label: 'Category', href: '/category' },
    {
      icon: Package,
      label: 'Product',
      href: '#',
      subMenu: [
        { label: 'Field', href: '/product/field' },
        { label: 'Product', href: '/product/list' },
        { label: 'Batch', href: '/product/batch' },
      ],
    },
    {
      icon: ClipboardList,
      label: 'Inventory',
      href: '#',
      subMenu: [
        { label: 'Store Inventory', href: '/inventory/store' },
        { label: 'Warehouse Inventory', href: '/inventory/warehouse' },
      ],
    },


    { icon: ShoppingCart, label: 'POS', href: '/pos' },
      { icon: ShoppingCart, label: 'Social commerce orders', href: '/social-commerce' },

    { icon: CreditCard, label: 'Transaction', href: '/transaction' },
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
          {menuItems.map((item, index) => {
            const isActive =
              pathname === item.href || (item.subMenu && item.subMenu.some(sub => pathname === sub.href));

            return (
              <li key={index}>
                <div>
                  <Link
                    href={item.href}
                    onClick={(e) => {
                      if (item.subMenu) {
                        e.preventDefault(); // prevent redirect if submenu exists
                        toggleSubMenu(item.label.toLowerCase());
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${
                      isActive
                        ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>

                  {/* Sub-menu */}
                  {item.subMenu && openMenu === item.label.toLowerCase() && (
                    <ul className="pl-6 space-y-1 mt-1">
                      {item.subMenu.map((subItem, subIndex) => {
                        const isSubActive = pathname === subItem.href;
                        return (
                          <li key={subIndex}>
                            <Link
                              href={subItem.href}
                              className={`block text-sm px-3 py-2 rounded ${
                                isSubActive
                                  ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 font-medium'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              {subItem.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
