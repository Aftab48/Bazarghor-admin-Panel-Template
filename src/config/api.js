import axios from 'axios';

const BASE_URL = "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.code === 'ERROR') {
      return Promise.reject({
        response: {
          data: response.data,
          status: 200,
        },
      });
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const api = {
  admin: {
    login: (data) => apiClient.post('/admin/login', data),
    logout: () => apiClient.post('/admin/logout'),
    forgotPassword: (data) => apiClient.post('/admin/forget-password', data),
    resetPassword: (data) => apiClient.post('/admin/reset-password', data),
    getProfile: () => apiClient.get('/admin/profile'),
    updateProfile: (formData) =>
      apiClient.put('/admin/update', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    changePassword: (id, data) => apiClient.post(`/admin/change-password/${id}`, data),
  },
  staff: {
    createAdmin: (formData) =>
      apiClient.post('/staff/add-admin', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    getAllAdmins: () => apiClient.get('/staff/get-all-admin'),
    getAdminById: (id) => apiClient.get(`/staff/get-adminById/${id}`),
    updateAdmin: (id, formData) =>
      apiClient.put(`/staff/update-admin/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    deleteAdmin: (id) => apiClient.delete(`/staff/delete-admin/${id}`),
    updateSelfAdmin: (formData) =>
      apiClient.put('/staff/update-admin', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    getAdminProfile: () => apiClient.get('/staff/get-admin-profile'),
    getSubAdminProfile: () => apiClient.get('/staff/get-sub-admin-profile'),
    updateSubAdmin: (formData) =>
      apiClient.put('/staff/update-sub-admin', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    changeAdminPassword: (id, data) => apiClient.post(`/staff/admin-change-password/${id}`, data),
    changeSubAdminPassword: (id, data) => apiClient.post(`/staff/sub-admin-change-password/${id}`, data),
    verifyUserStatus: (userId, data) => apiClient.put(`/users/verify-status/${userId}`, data),
    createVendor: (formData) =>
      apiClient.post('/users/create-vendor', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    getAllVendors: () => apiClient.get('/users/get-vendor-list'),
    getVendorById: (id) => apiClient.get(`/users/get-vendor/${id}`),
    updateVendor: (id, formData) =>
      apiClient.put(`/users/update-vendor/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    deleteVendor: (id) => apiClient.delete(`/users/delete-vendor/${id}`),
    createDeliveryPartner: (formData) =>
      apiClient.post('/users/create-delivery-partner', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    getAllDeliveryPartners: () => apiClient.get('/users/get-delivery-partner-list'),
    getDeliveryPartnerById: (id) => apiClient.get(`/users/get-delivery-partner/${id}`),
    updateDeliveryPartner: (id, formData) =>
      apiClient.put(`/users/update-delivery-partner/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    deleteDeliveryPartner: (id) => apiClient.delete(`/users/delete-delivery-partner/${id}`),
    createCustomer: (formData) =>
      apiClient.post('/users/create-customer', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    getAllCustomers: () => apiClient.get('/users/get-customer-list'),
    getCustomerById: (id) => apiClient.get(`/users/get-customer/${id}`),
    updateCustomer: (id, formData) =>
      apiClient.put(`/users/update-customer/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    deleteCustomer: (id) => apiClient.delete(`/users/delete-customer/${id}`),
  },
  customer: {
    register: (formData) =>
      apiClient.post('/customers/create-customer', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    login: (data) => apiClient.post('/customers/login', data),
    getProfile: () => apiClient.get('/customers/profile'),
    updateProfile: (formData) =>
      apiClient.put('/customers/update-profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    logout: () => apiClient.post('/customers/logout'),
    sendOTP: (data) => apiClient.post('/customers/login/send-otp', data),
    resendOTP: (data) => apiClient.post('/customers/login/resend', data),
    addAddress: (data) => apiClient.post('/customers/address', data),
    updateAddress: (addressId, data) => apiClient.put(`/customers/address/${addressId}`, data),
    deleteAddress: (addressId) => apiClient.delete(`/customers/address/${addressId}`),
  },
  vendor: {
    register: (formData) =>
      apiClient.post('/vendors/create-vendor', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    getProfile: () => apiClient.get('/vendors/profile'),
    updateProfile: (formData) =>
      apiClient.put('/vendors/update-profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    logout: () => apiClient.post('/vendors/logout'),
    sendOTP: (data) => apiClient.post('/vendors/login/send-otp', data),
    verifyOTP: (data) => apiClient.post('/vendors/login/verify', data),
    resendOTP: (data) => apiClient.post('/vendors/login/resend', data),
  },
  deliveryPartner: {
    register: (formData) =>
      apiClient.post('/delivery-partner/create-delivery-partner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    getProfile: () => apiClient.get('/delivery-partner/profile'),
    updateProfile: (formData) =>
      apiClient.put('/delivery-partner/update-profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    logout: () => apiClient.post('/delivery-partner/logout'),
    sendOTP: (data) => apiClient.post('/delivery-partner/login/send-otp', data),
    verifyOTP: (data) => apiClient.post('/delivery-partner/login/verify', data),
    resendOTP: (data) => apiClient.post('/delivery-partner/login/resend', data),
  },
  otp: {
    sendRegistrationOTP: (data) => apiClient.post('/otp/send-otp-registration', data),
    verifyRegistrationOTP: (data) => apiClient.post('/otp/verify-otp-registration', data),
    verifyLogin: (data) => apiClient.post('/otp/verify-login', data),
    resend: (data) => apiClient.post('/otp/resend', data),
  },
  products: {
    create: (formData) =>
      apiClient.post('/products/add-product', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    getAll: (params = {}) => apiClient.get('/products/get-products-list', { params }),
    getById: (id) => apiClient.get(`/products/get-productsById/${id}`),
    update: (id, formData) =>
      apiClient.put(`/products/update-productsById/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    delete: (id) => apiClient.delete(`/products/delete-products/${id}`),
    getCategories: () => apiClient.get('/products/categories/list'),
    admin: {
      create: (formData) =>
        apiClient.post('/products/admin/add-product', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
      getAll: (params = {}) => apiClient.get('/products/admin/get-products-list', { params }),
      getById: (id) => apiClient.get(`/products/admin/get-product/${id}`),
      update: (id, formData) =>
        apiClient.put(`/products/admin/update-product/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
      delete: (id) => apiClient.delete(`/products/admin/delete-product/${id}`),
    },
  },
  cart: {
    addToCart: (data) => apiClient.post('/customers/cart/add-to-cart', data),
    getCart: () => apiClient.get('/customers/cart/get-cart'),
    updateItem: (productId, data) => apiClient.put(`/customers/cart/update-item/${productId}`, data),
    removeItem: (productId) => apiClient.delete(`/customers/cart/remove-item/${productId}`),
  },
  orders: {
    create: (data) => apiClient.post('/customers/order/create', data),
    getAll: () => apiClient.get('/customers/order/list'),
    getById: (orderId) => apiClient.get(`/customers/order/get-order/${orderId}`),
    getHistory: (orderId) => apiClient.get(`/customers/order/get-order-history/${orderId}/history`),
    addHistory: (orderId, data) => apiClient.post(`/customers/order/${orderId}/history`, data),
    updatePayment: (orderId, data) => apiClient.post(`/customers/order/${orderId}/payment`, data),
  },
  store: {
    customer: {
      getOpenStores: (params = {}) => apiClient.get('/customers/store/open-stores', { params }),
      getStoreProducts: (storeId) => apiClient.get(`/customers/store/products/${storeId}`),
    },
    toggleStatus: (storeId, data) => apiClient.put(`/store/${storeId}/open-close`, data),
    admin: {
      getAll: (params = {}) => apiClient.get('/store/admin/get-store', { params }),
      getById: (id) => apiClient.get(`/store/admin/get-store-by-id/${id}`),
      update: (id, data) => apiClient.put(`/store/admin/update-store-by-id/${id}`, data),
    },
  },
  vendorOrders: {
    respond: (orderId, data) => apiClient.post(`/vendors/order/${orderId}/respond`, data),
    getAll: () => apiClient.get('/vendors/orders'),
    getById: (orderId) => apiClient.get(`/vendors/order/${orderId}`),
  },
  vendorSubscription: {
    purchase: (data) => apiClient.post('/vendors/purchase-subscription', data),
    getMySubscriptions: () => apiClient.get('/vendors/get-subscription'),
    renew: (id, data) => apiClient.put(`/vendors/renew-subscription/${id}`, data),
  },
  deliveryOrders: {
    respond: (orderId, data) => apiClient.post(`/delivery-order/respond-order/${orderId}`, data),
    pickup: (orderId, data) => apiClient.put(`/delivery-order/pickup-order/${orderId}`, data),
    deliver: (orderId, data) => apiClient.put(`/delivery-order/deliver-order/${orderId}`, data),
    getMyStats: () => apiClient.get('/delivery-order/my-stats'),
  },
  adminOrders: {
    getOrdersByVendor: (vendorId) => apiClient.get(`/admin/orders/vendor/${vendorId}`),
    getOrderHistory: (orderId) => apiClient.get(`/admin/order/${orderId}/history`),
  },
  adminVendorSubscription: {
    create: (data) => apiClient.post('/admin/vendor-subscription', data),
    getAll: () => apiClient.get('/admin/vendor-subscription'),
    getById: (id) => apiClient.get(`/admin/vendor-subscription/${id}`),
    assign: (subscriptionId, data) => apiClient.put(`/admin/vendor-subscription/${subscriptionId}/assign`, data),
    renew: (id, data) => apiClient.put(`/admin/vendor-subscription/${id}/renew`, data),
    cancel: (id) => apiClient.delete(`/admin/cancel-vendor-subscription/${id}`),
  },
  mappls: {
    autosuggest: (params = {}) => apiClient.get('/mappls/places/autosuggest', { params }),
    geocode: (params = {}) => apiClient.get('/mappls/places/geocode', { params }),
    reverseGeocode: (params = {}) => apiClient.get('/mappls/places/reverse-geocode', { params }),
  },
};

export default apiClient;

