import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({
  page = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  loading = false,
  className = '',
}) {
  const safeTotalPages = Math.max(1, totalPages || 1)
  const pages = []
  const delta = 2

  for (
    let i = Math.max(1, page - delta);
    i <= Math.min(safeTotalPages, page + delta);
    i++
  ) {
    pages.push(i)
  }

  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, totalItems)

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-150 bg-white px-5 py-3.5 text-xs text-slate-500 ${className}`}
    >
      <div>
        {totalItems > 0 ? (
          <span>
            Showing <strong className="font-bold text-slate-800">{startItem}</strong> to{' '}
            <strong className="font-bold text-slate-800">{endItem}</strong> of{' '}
            <strong className="font-bold text-slate-800">{totalItems}</strong> entries
          </span>
        ) : (
          <span>Page {page} of {totalPages}</span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
        >
          <ChevronLeft size={14} />
          <span>Prev</span>
        </button>

        {pages[0] > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="min-w-8 rounded-lg border border-slate-200 bg-white py-1.5 font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              1
            </button>
            {pages[0] > 2 && <span className="px-1 text-slate-400">…</span>}
          </>
        )}

        {pages.map((p) => {
          const isActive = p === page
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              disabled={loading}
              className={`min-w-8 rounded-lg py-1.5 font-bold transition shadow-xs ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-indigo-200'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          )
        })}

        {pages[pages.length - 1] < safeTotalPages && (
          <>
            {pages[pages.length - 1] < safeTotalPages - 1 && (
              <span className="px-1 text-slate-400">…</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(safeTotalPages)}
              className="min-w-8 rounded-lg border border-slate-200 bg-white py-1.5 font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              {safeTotalPages}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= safeTotalPages || loading}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}