import { useState } from 'react';

/**
 * Custom hook for table pagination
 * @param {number} initialPageSize - Initial page size
 * @returns {Object} - Pagination state and handlers
 */
export const usePagination = (initialPageSize = 10) => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: initialPageSize,
    total: 0,
  });

  const handleTableChange = (newPagination, filters, sorter) => {
    setPagination(newPagination);
  };

  const updateTotal = (total) => {
    setPagination(prev => ({ ...prev, total }));
  };

  const reset = () => {
    setPagination({
      current: 1,
      pageSize: initialPageSize,
      total: 0,
    });
  };

  return {
    pagination,
    handleTableChange,
    updateTotal,
    reset,
  };
};

export default usePagination;

