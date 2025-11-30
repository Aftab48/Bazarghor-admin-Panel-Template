import apiClient from '../config/api';
import { USE_MOCK_DATA } from '../constants/endpoints';
import { mockData, generateAnalytics, generateSalesByVendor, generateSalesByCategory } from '../mock/mockData';

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
    console.warn('⚠️ API call failed, using fallback mock data', error);
    await new Promise(resolve => setTimeout(resolve, 300));
    return fallbackData;
  }
};

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.docs)) return payload.docs;
  if (Array.isArray(payload?.data?.docs)) return payload.data.docs;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const buildName = (first, last, fallback = '') => {
  const full = [first, last].filter(Boolean).join(' ').trim();
  return full || fallback;
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
};

const pickImage = (file) => {
  if (!file) return undefined;
  if (typeof file === 'string') return file;
  return file.url || file.path || file.Location;
};

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const statusFromFlags = ({ status, isActive } = {}) => {
  if (typeof status === 'string') return status.toLowerCase();
  if (status === 3) return 'suspended';
  if (status === 1) return 'pending';
  if (isActive === false) return 'inactive';
  return 'active';
};

const normalizeCustomers = (payload) => {
  const list = toArray(payload).filter(Boolean);
  return list.map((customer, index) => ({
    id: customer.id ?? customer._id ?? index,
    name: customer.name || buildName(customer.firstName, customer.lastName, 'Customer'),
    email: customer.email ?? 'N/A',
    phone: customer.phone ?? customer.mobNo ?? 'N/A',
    status: customer.status ?? statusFromFlags(customer),
    totalOrders: customer.totalOrders ?? customer.orderCount ?? 0,
    totalSpent: toNumber(customer.totalSpent ?? customer.walletBalance),
    joinedDate: customer.joinedDate ?? formatDate(customer.createdAt),
    avatar: pickImage(customer.avatar || customer.profilePicture),
  }));
};

const vendorStatus = (store = {}, vendor = {}) => {
  if (vendor.status === 3 || store.status === 3) return 'suspended';
  if (store.isApproved === false || store.status === 1) return 'pending';
  if (vendor.isActive === false || store.isActive === false) return 'inactive';
  return 'active';
};

const normalizeVendors = (payload) => {
  const list = toArray(payload).filter(Boolean);
  return list.map((item, index) => {
    const vendor = item.vendor || item.vendorId || {};
    return {
      id: item.id ?? vendor._id ?? item._id ?? index,
      businessName: item.businessName || item.storeName || item.storeDetails?.storeName || 'N/A',
      ownerName: item.ownerName || buildName(vendor.firstName, vendor.lastName, 'Vendor'),
      email: item.email ?? vendor.email ?? 'N/A',
      phone: item.phone ?? vendor.mobNo ?? 'N/A',
      status: item.status ?? vendorStatus(item, vendor),
      totalSales: toNumber(item.totalSales),
      productsCount: item.productsCount ?? item.productCount ?? 0,
      commission: item.commission ?? 0,
      logo: pickImage(item.logo || item.storePictures?.[0]),
      address: item.address || item.storeAddress || item.storeDetails?.storeAddress || 'N/A',
      joinedDate: item.joinedDate ?? formatDate(vendor.createdAt ?? item.createdAt),
    };
  });
};

const normalizeDeliveryAgents = (payload) => {
  const list = toArray(payload).filter(Boolean);
  return list.map((agent, index) => ({
    id: agent.id ?? agent._id ?? index,
    name: agent.name || buildName(agent.firstName, agent.lastName, 'Delivery Partner'),
    email: agent.email ?? 'N/A',
    phone: agent.phone ?? agent.mobNo ?? 'N/A',
    status: agent.status ?? statusFromFlags(agent),
    vehicleType: agent.vehicleType ?? agent.vehicleDetails?.vehicleType ?? 'cycle',
    ordersDelivered: agent.ordersDelivered ?? agent.deliveryPartner?.totalDeliveries ?? 0,
    rating: toNumber(agent.rating ?? agent.deliveryPartner?.rating ?? 5, 5),
    earnings: toNumber(agent.earnings),
    joinedDate: agent.joinedDate ?? formatDate(agent.createdAt),
    avatar: pickImage(agent.avatar || agent.profilePicture),
  }));
};

const ROLE_CODES = {
  VENDOR: 'VENDOR',
  DELIVERY_PARTNER: 'DELIVERY_PARTNER',
};

const VENDOR_STATUS_CODES = {
  PENDING: 1,
  APPROVED: 2,
  DECLINED: 3,
};

const DELIVERY_STATUS_CODES = {
  PENDING: 1,
  APPROVED: 2,
  DECLINED: 3,
};

const fetchVendorList = async (params) => {
  const raw = await apiCall(
    () => apiClient.get('/users/get-vendor-list', { params }),
    mockData.vendors
  );
  return normalizeVendors(raw?.data ?? raw);
};

const fetchVendorDetails = async (id) => {
  const fallback = mockData.vendors.find(v => Number(v.id) === Number(id)) || mockData.vendors[0];
  const raw = await apiCall(
    () => apiClient.get(`/users/get-vendor/${id}`),
    fallback
  );
  const data = raw?.data ?? raw;
  const [vendor] = normalizeVendors(data ? [data] : []);
  return vendor || data;
};

const fetchDeliveryPartnerList = async (params) => {
  const raw = await apiCall(
    () => apiClient.get('/users/get-delivery-partner-list', { params }),
    mockData.deliveryAgents
  );
  return normalizeDeliveryAgents(raw?.data ?? raw);
};

const verifyUserStatus = (id, roleType, successMessage) =>
  apiCall(
    () => apiClient.put(`/users/verify-status/${id}`, { roleType }),
    { success: true, message: successMessage, roleType }
  );

const updateVendorRecord = (id, payload, message) =>
  apiCall(
    () => apiClient.put(`/users/update-vendor/${id}`, payload),
    { success: true, message, data: payload }
  );

const updateDeliveryPartnerRecord = (id, payload, message) =>
  apiCall(
    () => apiClient.put(`/users/update-delivery-partner/${id}`, payload),
    { success: true, message, data: payload }
  );

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
  getCustomers: async (params) => {
    const raw = await apiCall(
      () => apiClient.get('/users/get-customer-list', { params }),
      mockData.customers
    );
    return normalizeCustomers(raw?.data ?? raw);
  },
  
  getVendors: (params) => fetchVendorList(params),
  
  getDeliveryAgents: (params) => fetchDeliveryPartnerList(params),
  
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
  getPendingApprovals: async () => {
    const vendors = await fetchVendorList();
    return vendors.filter(v => v.status === 'pending');
  },
  
  approveVendor: (id) =>
    verifyUserStatus(id, ROLE_CODES.VENDOR, 'Vendor approved successfully'),
  
  rejectVendor: (id) =>
    updateVendorRecord(
      id,
      { status: VENDOR_STATUS_CODES.DECLINED, isActive: false },
      'Vendor rejected'
    ),
  
  getVendorDetails: (id) => fetchVendorDetails(id),
  
  suspendVendor: (id) =>
    updateVendorRecord(
      id,
      { status: VENDOR_STATUS_CODES.DECLINED, isActive: false },
      'Vendor suspended'
    ),
  
  unsuspendVendor: (id) =>
    updateVendorRecord(
      id,
      { status: VENDOR_STATUS_CODES.APPROVED, isActive: true },
      'Vendor unsuspended'
    ),
};

// Delivery Agents API
export const deliveryAgentsAPI = {
  getPendingApprovals: async () => {
    const agents = await fetchDeliveryPartnerList();
    return agents.filter(a => a.status === 'pending');
  },
  
  approveAgent: (id) =>
    verifyUserStatus(id, ROLE_CODES.DELIVERY_PARTNER, 'Agent approved successfully'),
  
  rejectAgent: (id) =>
    updateDeliveryPartnerRecord(
      id,
      { status: DELIVERY_STATUS_CODES.DECLINED, isActive: false },
      'Agent rejected'
    ),
  
  getAgentPerformance: async () => {
    const agents = await fetchDeliveryPartnerList();
    return agents.filter(a => a.status !== 'pending');
  },
  
  getPayouts: async () => {
    const agents = await fetchDeliveryPartnerList();
    return agents
      .filter(a => a.status === 'active')
      .map((agent) => {
        const earnings = agent.earnings || agent.ordersDelivered * 50 || 0;
        return {
          ...agent,
          earnings,
          pendingPayout: Math.floor(earnings * 0.3),
        };
      });
  },
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

