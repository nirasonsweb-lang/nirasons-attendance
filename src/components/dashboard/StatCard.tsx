'use client';

import { ReactNode } from 'react';

interface StatCardProps {
  label?: string;
  title?: string; // alias for label
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sublabel?: string;
}

export function StatCard({ label, title, value, icon, trend, sublabel }: StatCardProps) {
  const displayLabel = label || title || '';
  return (
    <div className="bg-dark-700 rounded-xl border border-dark-500/50 p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-dark-600 text-accent-primary">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-2xl font-bold text-white">{value}</p>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-400">{displayLabel}</p>
          {trend && (
            <span className={`text-xs ${trend.isPositive ? 'text-status-success' : 'text-status-error'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
          {sublabel && (
            <span className="text-xs text-gray-500">{sublabel}</span>
          )}
        </div>
      </div>
    </div>
  );
}
