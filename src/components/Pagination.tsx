import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const pageSizeOptions = [25, 50, 100, 200];

  // Calculate range of items being shown
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart range of pages
      if (currentPage <= 4) {
        // Near start
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
        <div className="text-sm text-white/60">
          Showing {totalItems} item{totalItems !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-white/60">Items per page:</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-slate-700/70 border border-slate-600/50 rounded px-2 py-1 text-sm text-white/90 focus:outline-none focus:border-lime-500"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
      {/* Items info */}
      <div className="text-sm text-white/60">
        Showing {startItem}-{endItem} of {totalItems} item{totalItems !== 1 ? 's' : ''}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center space-x-2">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1 rounded hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-white/60 hover:text-white transition-colors"
          title="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 rounded hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-white/60 hover:text-white transition-colors"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 text-white/40">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-lime-500 text-white'
                      : 'text-white/60 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1 rounded hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-white/60 hover:text-white transition-colors"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1 rounded hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-white/60 hover:text-white transition-colors"
          title="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>

        {/* Page size selector */}
        <div className="flex items-center space-x-2 ml-4">
          <label className="text-sm text-white/60">Items per page:</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-slate-700/70 border border-slate-600/50 rounded px-2 py-1 text-sm text-white/90 focus:outline-none focus:border-lime-500"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default Pagination; 