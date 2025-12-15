'use client';

import { useState } from 'react';
import type { User } from '@/types';

interface HeaderProps {
  user: User;
  title?: string;
}

export default function Header({ user, title }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="h-16 bg-dark-800 border-b border-dark-600 px-6 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-white">
          {title || `Welcome back, ${user.name.split(' ')[0]}!`}
        </h1>
        <p className="text-sm text-gray-500">{today}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 px-4 py-2 pl-10 bg-dark-700 border border-dark-500 rounded-lg text-sm text-white placeholder-gray-500 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-medium text-sm">
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        </div>
      </div>
    </header>
  );
}
