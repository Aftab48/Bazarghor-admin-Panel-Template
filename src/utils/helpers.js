/**
 * Utility helper functions
 */

/**
 * Format currency
 * @param {number} amount 
 * @param {string} currency 
 * @returns {string}
 */
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format date
 * @param {string|Date} date 
 * @param {string} format 
 * @returns {string}
 */
export const formatDate = (date, format = 'short') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return dateObj.toLocaleDateString();
  } else if (format === 'long') {
    return dateObj.toLocaleString();
  }
  
  return dateObj.toISOString();
};

/**
 * Truncate text
 * @param {string} text 
 * @param {number} length 
 * @returns {string}
 */
export const truncate = (text, length = 50) => {
  if (!text || text.length <= length) return text;
  return `${text.substring(0, length)}...`;
};

/**
 * Generate random color
 * @returns {string}
 */
export const randomColor = () => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Download data as CSV
 * @param {Array} data 
 * @param {string} filename 
 */
export const downloadCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Debounce function
 * @param {Function} func 
 * @param {number} wait 
 * @returns {Function}
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Get status color
 * @param {string} status 
 * @returns {string}
 */
export const getStatusColor = (status) => {
  const colors = {
    active: 'green',
    inactive: 'red',
    suspended: 'orange',
    pending: 'blue',
    completed: 'green',
    failed: 'red',
    cancelled: 'red',
  };
  return colors[status?.toLowerCase()] || 'default';
};

/**
 * Calculate percentage
 * @param {number} value 
 * @param {number} total 
 * @returns {number}
 */
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Group array by key
 * @param {Array} array 
 * @param {string} key 
 * @returns {Object}
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    result[group] = result[group] || [];
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Sort array by key
 * @param {Array} array 
 * @param {string} key 
 * @param {string} order 
 * @returns {Array}
 */
export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    if (order === 'asc') {
      return a[key] > b[key] ? 1 : -1;
    }
    return a[key] < b[key] ? 1 : -1;
  });
};

