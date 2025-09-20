"use client";

type Props = {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
};

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center mt-6 space-x-2">
      <button
        onClick={() => onChange(Math.max(page - 1, 1))}
        disabled={page === 1}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Prev
      </button>

      {Array.from({ length: totalPages }).map((_, i) => {
        const p = i + 1;
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`px-3 py-1 border rounded ${page === p ? "bg-gray-200 font-bold" : ""}`}
          >
            {p}
          </button>
        );
      })}

      <button
        onClick={() => onChange(Math.min(page + 1, totalPages))}
        disabled={page === totalPages}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
