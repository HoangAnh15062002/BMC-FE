import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  itemName = 'bản ghi',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(validCurrentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (validCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (validCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--border-color)',
        borderRadius: '0 0 12px 12px',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      {/* Summary Info & Page Size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Hiển thị{' '}
          <strong style={{ color: 'var(--text-main)', fontWeight: 700 }}>
            {startItem} - {endItem}
          </strong>{' '}
          trong tổng số{' '}
          <strong style={{ color: 'var(--orange-primary)', fontWeight: 700 }}>{totalItems}</strong> {itemName}
        </span>

        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <span>Số dòng:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="form-select form-select-sm"
              style={{
                width: '70px',
                padding: '3px 8px',
                fontSize: '0.82rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card-subtle, #f8fafc)',
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page Navigation Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        {/* First Page */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(1)}
          disabled={validCurrentPage === 1}
          title="Trang đầu"
          style={{
            padding: '5px 8px',
            borderRadius: '6px',
            minWidth: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: validCurrentPage === 1 ? 0.45 : 1,
          }}
        >
          <ChevronsLeft size={14} />
        </button>

        {/* Previous Page */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(validCurrentPage - 1)}
          disabled={validCurrentPage === 1}
          title="Trang trước"
          style={{
            padding: '5px 8px',
            borderRadius: '6px',
            minWidth: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: validCurrentPage === 1 ? 0.45 : 1,
          }}
        >
          <ChevronLeft size={14} />
        </button>

        {/* Page Numbers */}
        {getPageNumbers().map((p, idx) => {
          if (p === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                style={{
                  padding: '0 6px',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  lineHeight: '32px',
                }}
              >
                ...
              </span>
            );
          }

          const pageNum = p as number;
          const isActive = pageNum === validCurrentPage;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              style={{
                minWidth: '32px',
                height: '32px',
                padding: '0 8px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 500,
                border: isActive ? '1px solid var(--orange-primary)' : '1px solid var(--border-color)',
                backgroundColor: isActive ? 'var(--orange-primary)' : '#ffffff',
                color: isActive ? '#ffffff' : 'var(--text-main)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 2px 6px rgba(234, 88, 12, 0.3)' : 'none',
              }}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Page */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(validCurrentPage + 1)}
          disabled={validCurrentPage === totalPages}
          title="Trang sau"
          style={{
            padding: '5px 8px',
            borderRadius: '6px',
            minWidth: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: validCurrentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: validCurrentPage === totalPages ? 0.45 : 1,
          }}
        >
          <ChevronRight size={14} />
        </button>

        {/* Last Page */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(totalPages)}
          disabled={validCurrentPage === totalPages}
          title="Trang cuối"
          style={{
            padding: '5px 8px',
            borderRadius: '6px',
            minWidth: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: validCurrentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: validCurrentPage === totalPages ? 0.45 : 1,
          }}
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
};
