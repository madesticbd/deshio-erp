import React from 'react';
import { Search, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-neutral-900 border-b border-neutral-800 px-8 py-4 flex items-center justify-between">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-neutral-800 text-white pl-12 pr-4 py-2.5 rounded-lg border border-neutral-700 focus:outline-none focus:border-orange-600 transition-colors"
          />
        </div>
      </div>

      {/* Admin Profile */}
      <div className="flex items-center gap-3">
        <span className="text-white font-medium">Admin</span>
        <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center border-2 border-neutral-700">
          <User className="w-5 h-5 text-neutral-400" />
        </div>
      </div>
    </header>
  );
}