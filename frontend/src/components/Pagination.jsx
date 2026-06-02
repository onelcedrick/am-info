// -*- coding: utf-8 -*-
export default function Pagination({ page, pages, total, onPageChange }) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t">
      <p className="text-xs text-gray-400">{total} resultat{total > 1 ? 's' : ''}</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded-lg border text-sm flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ‹
        </button>
        {[...Array(pages)].map((_, i) => {
          const p = i + 1;
          if (p === 1 || p === pages || Math.abs(p - page) <= 1) {
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                  p === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {p}
              </button>
            );
          }
          if (p === 2 || p === pages - 1) {
            return <span key={p} className="text-gray-300">...</span>;
          }
          return null;
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="w-8 h-8 rounded-lg border text-sm flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>
    </div>
  );
}
