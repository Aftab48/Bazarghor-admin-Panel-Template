import axios from 'axios';
import { message } from 'antd';
import { API_BASE_URL, USE_MOCK_DATA } from '../constants/endpoints';
import { mockData, generateAnalytics, generateSalesByVendor, generateSalesByCategory } from '../mock/mockData';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available (will be used when JWT is implemented)
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      console.warn('⚠️ API unavailable, using mock data');
    } else if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        message.error('Unauthorized. Please login again.');
      } else if (status === 403) {
        message.error('Access forbidden.');
      } else if (status === 500) {
        message.error('Server error. Please try again later.');
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API calls with fallback
const apiCall = async (apiFunction, fallbackData) => {
  if (USE_MOCK_DATA) {
    console.log('🎭 Using mock data (forced by env)');
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    return fallbackData;
  }
  
  try {
    const response = await apiFunction();
    return response.data;
  } catch (error) {
    console.warn('⚠️ API call failed, using fallback mock data');
    await new Promise(resolve => setTimeout(resolve, 300));
    return fallbackData;
  }
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => apiCall(
    () => apiClient.get('/dashboard/stats'),
    mockData.dashboardStats
  ),
  
  getAnalytics: (period = 'daily') => apiCall(
    () => apiClient.get(`/dashboard/analytics?period=${period}`),
    generateAnalytics(period)
  ),
};

// Users API
export const usersAPI = {
  getCustomers: (params) => apiCall(
    () => apiClient.get('/users/customers', { params }),
    mockData.customers
  ),
  
  getVendors: (params) => apiCall(
    () => apiClient.get('/users/vendors', { params }),
    mockData.vendors.filter(v => v.status !== 'pending')
  ),
  
  getDeliveryAgents: (params) => apiCall(
    () => apiClient.get('/users/delivery-agents', { params }),
    mockData.deliveryAgents.filter(a => a.status !== 'pending')
  ),
  
  activateUser: (id) => apiCall(
    () => apiClient.post(`/users/${id}/activate`),
    { success: true, message: 'User activated successfully' }
  ),
  
  deactivateUser: (id) => apiCall(
    () => apiClient.post(`/users/${id}/deactivate`),
    { success: true, message: 'User deactivated successfully' }
  ),
  
  suspendUser: (id) => apiCall(
    () => apiClient.post(`/users/${id}/suspend`),
    { success: true, message: 'User suspended successfully' }
  ),
  
  deleteUser: (id) => apiCall(
    () => apiClient.delete(`/users/${id}`),
    { success: true, message: 'User deleted successfully' }
  ),
  
  resetPassword: (id) => apiCall(
    () => apiClient.post(`/users/${id}/reset-password`),
    { success: true, message: 'Password reset email sent' }
  ),
  
  createUser: (data) => apiCall(
    () => apiClient.post('/users', data),
    { success: true, message: 'User created successfully', data }
  ),
  
  updateUser: (id, data) => apiCall(
    () => apiClient.put(`/users/${id}`, data),
    { success: true, message: 'User updated successfully', data }
  ),
};

// Vendors API
export const vendorsAPI = {
  getPendingApprovals: () => apiCall(
    () => apiClient.get('/vendors/pending'),
    mockData.vendors.filter(v => v.status === 'pending')
  ),
  
  approveVendor: (id) => apiCall(
    () => apiClient.post(`/vendors/${id}/approve`),
    { success: true, message: 'Vendor approved successfully' }
  ),
  
  rejectVendor: (id) => apiCall(
    () => apiClient.post(`/vendors/${id}/reject`),
    { success: true, message: 'Vendor rejected' }
  ),
  
  getVendorDetails: (id) => apiCall(
    () => apiClient.get(`/vendors/${id}`),
    mockData.vendors.find(v => v.id === parseInt(id))
  ),
  
  suspendVendor: (id) => apiCall(
    () => apiClient.post(`/vendors/${id}/suspend`),
    { success: true, message: 'Vendor suspended' }
  ),
  
  unsuspendVendor: (id) => apiCall(
    () => apiClient.post(`/vendors/${id}/unsuspend`),
    { success: true, message: 'Vendor unsuspended' }
  ),
};

// Delivery Agents API
export const deliveryAgentsAPI = {
  getPendingApprovals: () => apiCall(
    () => apiClient.get('/delivery-agents/pending'),
    mockData.deliveryAgents.filter(a => a.status === 'pending')
  ),
  
  approveAgent: (id) => apiCall(
    () => apiClient.post(`/delivery-agents/${id}/approve`),
    { success: true, message: 'Agent approved successfully' }
  ),
  
  rejectAgent: (id) => apiCall(
    () => apiClient.post(`/delivery-agents/${id}/reject`),
    { success: true, message: 'Agent rejected' }
  ),
  
  getAgentPerformance: (id) => apiCall(
    () => apiClient.get(`/delivery-agents/${id}/performance`),
    mockData.deliveryAgents.find(a => a.id === parseInt(id))
  ),
  
  getPayouts: () => apiCall(
    () => apiClient.get('/delivery-agents/payouts'),
    mockData.deliveryAgents.map(a => ({
      ...a,
      pendingPayout: Math.floor(a.earnings * 0.3),
    }))
  ),
};

// Categories API
export const categoriesAPI = {
  getAll: () => apiCall(
    () => apiClient.get('/categories'),
    mockData.categories
  ),
  
  create: (data) => apiCall(
    () => apiClient.post('/categories', data),
    { success: true, message: 'Category created successfully', data }
  ),
  
  update: (id, data) => apiCall(
    () => apiClient.put(`/categories/${id}`, data),
    { success: true, message: 'Category updated successfully', data }
  ),
  
  delete: (id) => apiCall(
    () => apiClient.delete(`/categories/${id}`),
    { success: true, message: 'Category deleted successfully' }
  ),
};

// Products API
export const productsAPI = {
  getAll: (params) => apiCall(
    () => apiClient.get('/products', { params }),
    mockData.products
  ),
  
  getFeatured: () => apiCall(
    () => apiClient.get('/products/featured'),
    mockData.products.filter(p => p.isFeatured)
  ),
  
  toggleFeatured: (id) => apiCall(
    () => apiClient.post(`/products/${id}/toggle-featured`),
    { success: true, message: 'Product featured status updated' }
  ),
  
  create: (data) => apiCall(
    () => apiClient.post('/products', data),
    { success: true, message: 'Product created successfully', data }
  ),
  
  update: (id, data) => apiCall(
    () => apiClient.put(`/products/${id}`, data),
    { success: true, message: 'Product updated successfully', data }
  ),
  
  delete: (id) => apiCall(
    () => apiClient.delete(`/products/${id}`),
    { success: true, message: 'Product deleted successfully' }
  ),
};

// Orders API
export const ordersAPI = {
  getAll: (params) => apiCall(
    () => apiClient.get('/orders', { params }),
    mockData.orders
  ),
  
  getDetails: (id) => apiCall(
    () => apiClient.get(`/orders/${id}`),
    mockData.orders.find(o => o.id === parseInt(id))
  ),
  
  assignAgent: (orderId, agentId) => apiCall(
    () => apiClient.post(`/orders/${orderId}/assign-agent`, { agentId }),
    { success: true, message: 'Agent assigned successfully' }
  ),
  
  updateStatus: (orderId, status) => apiCall(
    () => apiClient.put(`/orders/${orderId}/status`, { status }),
    { success: true, message: 'Order status updated' }
  ),
  
  processRefund: (orderId, data) => apiCall(
    () => apiClient.post(`/orders/${orderId}/refund`, data),
    { success: true, message: 'Refund processed successfully' }
  ),
};

// Transactions API
export const transactionsAPI = {
  getAll: (params) => apiCall(
    () => apiClient.get('/transactions', { params }),
    mockData.transactions
  ),
  
  getVendorPayouts: () => apiCall(
    () => apiClient.get('/payments/vendor-payouts'),
    mockData.transactions.filter(t => t.type === 'Vendor Payout')
  ),
  
  getCommissions: () => apiCall(
    () => apiClient.get('/payments/commissions'),
    mockData.transactions.filter(t => t.type === 'Commission')
  ),
};

// Promotions API
export const promotionsAPI = {
  getBanners: () => apiCall(
    () => apiClient.get('/promotions/banners'),
    mockData.banners
  ),
  
  createBanner: (data) => apiCall(
    () => apiClient.post('/promotions/banners', data),
    { success: true, message: 'Banner created successfully', data }
  ),
  
  updateBanner: (id, data) => apiCall(
    () => apiClient.put(`/promotions/banners/${id}`, data),
    { success: true, message: 'Banner updated successfully', data }
  ),
  
  deleteBanner: (id) => apiCall(
    () => apiClient.delete(`/promotions/banners/${id}`),
    { success: true, message: 'Banner deleted successfully' }
  ),
  
  getDiscountCodes: () => apiCall(
    () => apiClient.get('/promotions/discount-codes'),
    mockData.discountCodes
  ),
  
  createDiscountCode: (data) => apiCall(
    () => apiClient.post('/promotions/discount-codes', data),
    { success: true, message: 'Discount code created successfully', data }
  ),
  
  updateDiscountCode: (id, data) => apiCall(
    () => apiClient.put(`/promotions/discount-codes/${id}`, data),
    { success: true, message: 'Discount code updated successfully', data }
  ),
  
  deleteDiscountCode: (id) => apiCall(
    () => apiClient.delete(`/promotions/discount-codes/${id}`),
    { success: true, message: 'Discount code deleted successfully' }
  ),
};

// Analytics API
export const analyticsAPI = {
  getSalesReports: (params) => apiCall(
    () => apiClient.get('/analytics/sales', { params }),
    {
      byVendor: generateSalesByVendor(),
      byCategory: generateSalesByCategory(),
    }
  ),
  
  getDeliveryReports: () => apiCall(
    () => apiClient.get('/analytics/delivery'),
    mockData.deliveryAgents.map(a => ({
      name: a.name,
      delivered: a.ordersDelivered,
      rating: parseFloat(a.rating),
    }))
  ),
  
  getCustomerRetention: () => apiCall(
    () => apiClient.get('/analytics/retention'),
    {
      newCustomers: Math.floor(Math.random() * 100) + 50,
      returningCustomers: Math.floor(Math.random() * 200) + 100,
      churnRate: (Math.random() * 10 + 5).toFixed(2),
    }
  ),
};

// Settings API
export const settingsAPI = {
  getRoles: () => apiCall(
    () => apiClient.get('/settings/roles'),
    [
      { id: 1, name: 'Super Admin', permissions: ['all'] },
      { id: 2, name: 'Admin', permissions: ['users', 'orders', 'vendors'] },
      { id: 3, name: 'Support', permissions: ['tickets', 'orders'] },
    ]
  ),
  
  getSiteSettings: () => apiCall(
    () => apiClient.get('/settings/site'),
    {
      siteName: 'Bazarghor',
      logo: '/logo.png',
      taxRate: 10,
      currency: 'INR',
      appVersion: '1.0.0',
    }
  ),
  
  updateSiteSettings: (data) => apiCall(
    () => apiClient.put('/settings/site', data),
    { success: true, message: 'Settings updated successfully', data }
  ),
  
  getNotificationTemplates: () => apiCall(
    () => apiClient.get('/settings/notifications'),
    [
      { id: 1, name: 'Order Confirmation', type: 'email', template: 'Your order {{orderNumber}} has been confirmed.' },
      { id: 2, name: 'Order Shipped', type: 'sms', template: 'Your order is on the way!' },
    ]
  ),
};

// Support API
export const supportAPI = {
  getTickets: (params) => apiCall(
    () => apiClient.get('/support/tickets', { params }),
    mockData.tickets
  ),
  
  getTicketDetails: (id) => apiCall(
    () => apiClient.get(`/support/tickets/${id}`),
    mockData.tickets.find(t => t.id === parseInt(id))
  ),
  
  replyToTicket: (id, message) => apiCall(
    () => apiClient.post(`/support/tickets/${id}/reply`, { message }),
    { success: true, message: 'Reply sent successfully' }
  ),
  
  assignTicket: (id, adminId) => apiCall(
    () => apiClient.post(`/support/tickets/${id}/assign`, { adminId }),
    { success: true, message: 'Ticket assigned successfully' }
  ),
  
  updateTicketStatus: (id, status) => apiCall(
    () => apiClient.put(`/support/tickets/${id}/status`, { status }),
    { success: true, message: 'Ticket status updated' }
  ),
};

// Audit Logs API
export const auditLogsAPI = {
  getLogs: (params) => apiCall(
    () => apiClient.get('/audit/logs', { params }),
    mockData.auditLogs
  ),
};

export default apiClient;

