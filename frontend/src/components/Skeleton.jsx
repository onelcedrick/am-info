// -*- coding: utf-8 -*-

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow p-4 animate-pulse">
      <div className="h-32 md:h-48 bg-gray-200 rounded-lg mb-4" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-3 bg-gray-200 rounded w-full mb-2" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  );
}

export function SkeletonRow({ cols = 5 }) {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 rounded mb-2" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded mb-1" />
      ))}
    </div>
  );
}

export function SkeletonChat() {
  return (
    <div className="space-y-4 p-4 animate-pulse">
      <div className="flex justify-start">
        <div className="h-16 bg-gray-200 rounded-2xl rounded-bl-md w-3/4" />
      </div>
      <div className="flex justify-end">
        <div className="h-12 bg-gray-200 rounded-2xl rounded-br-md w-1/2" />
      </div>
      <div className="flex justify-start">
        <div className="h-20 bg-gray-200 rounded-2xl rounded-bl-md w-2/3" />
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-4">{icon || '📭'}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title || 'Aucune donnee'}</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-md">{description || 'Rien a afficher pour le moment.'}</p>
      {action}
    </div>
  );
}
