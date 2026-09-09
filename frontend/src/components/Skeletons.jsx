import React from 'react';

export const Shimmer = ({ className }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`}></div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="glass-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-8 w-8 rounded-full" />
          </div>
          <Shimmer className="h-8 w-16" />
          <Shimmer className="h-3 w-32" />
        </div>
      ))}
    </div>
    
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="glass-card p-6 lg:col-span-2 space-y-4">
        <Shimmer className="h-6 w-48" />
        <Shimmer className="h-64 w-full" />
      </div>
      <div className="glass-card p-6 space-y-4">
        <Shimmer className="h-6 w-48" />
        <div className="flex justify-center">
          <Shimmer className="h-48 w-48 rounded-full" />
        </div>
        <div className="space-y-2">
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  </div>
);

export const GridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map(i => (
      <div key={i} className="glass-card overflow-hidden">
        <Shimmer className="h-48 w-full rounded-t-2xl" />
        <div className="p-5 space-y-3">
          <div className="flex justify-between items-center">
            <Shimmer className="h-6 w-20" />
            <Shimmer className="h-5 w-16" />
          </div>
          <Shimmer className="h-4 w-40" />
          <Shimmer className="h-4 w-full" />
          <div className="flex justify-between items-center pt-2">
            <Shimmer className="h-8 w-24" />
            <Shimmer className="h-8 w-24" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="glass-card overflow-hidden">
    <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between">
      <Shimmer className="h-6 w-32" />
      <Shimmer className="h-10 w-48" />
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/50">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="p-4"><Shimmer className="h-4 w-20" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-slate-100 dark:border-slate-800/50">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="p-4"><Shimmer className="h-4 w-full" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
