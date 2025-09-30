import React from 'react';

interface SidebarProps {
  activeMenu?: string;
}

export default function Sidebar({ activeMenu = 'Store' }: SidebarProps) {
  const menuItems = [
    'Dashboard',
    'Store',
    'Category',
    'Product',
    'Inventory',
    'Transaction'
  ];

  return (
    <div className="w-64 bg-neutral-900 text-white flex flex-col h-screen shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <img 
            src="/deshiologo.png" 
            alt="Deshio Logo" 
            className="h-10 w-auto object-contain"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {menuItems.map((item) => (
          <a
            key={item}
            href="#"
            className={`block px-6 py-3 transition-colors ${
              activeMenu === item
                ? 'bg-neutral-800 text-white border-l-4 border-orange-600'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            {item}
          </a>
        ))}
      </nav>
    </div>
  );
}