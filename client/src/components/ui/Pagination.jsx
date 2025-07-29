import React from 'react';

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  loading = false
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center mt-4 px-4 py-2">
      <div className="text-xs md:text-sm text-gray-600">
        Showing {Math.min(itemsPerPage, totalItems)} of {totalItems} students
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1 || loading}
          className={`px-3 py-1 rounded ${currentPage <= 1 || loading
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
        >
          Previous
        </button>
        <span className="px-3 py-1 bg-gray-100 rounded text-xs md:text-base">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages || loading}
          className={`px-3 py-1 rounded ${currentPage >= totalPages || loading
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;