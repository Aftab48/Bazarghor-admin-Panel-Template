import axios from "axios";
import { message } from "antd";
import { API_BASE_URL, USE_MOCK_DATA, ENDPOINTS } from "../constants/endpoints";
import {
  mockData,
  generateAnalytics,
  generateSalesByVendor,
  generateSalesByCategory,
} from "../mock/mockData";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available (will be used when JWT is implemented)
    const token = localStorage.getItem("authToken");
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
    if (error.code === "ECONNABORTED" || error.message === "Network Error") {
      console.warn("⚠️ API unavailable, using mock data");
    } else if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        // Clear auth state on 401
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userRoles");
        localStorage.removeItem("userPermissions");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        message.error("Unauthorized. Please login again.");
        // Redirect to login if not already there
        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/login-staff"
        ) {
          window.location.href = "/login";
        }
      } else if (status === 403) {
        message.error(
          "Access forbidden. You don't have permission to perform this action."
        );
      } else if (status === 500) {
        message.error("Server error. Please try again later.");
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to extract data from backend response
// Backend returns: { code, message, data } format
const extractResponseData = (response) => {
  const responseData = response?.data || response;
  // Backend uses { code, message, data } format
  if (responseData?.data !== undefined) {
    return responseData.data;
  }
  // Handle direct data
  if (responseData?.success !== undefined || responseData?.code !== undefined) {
    return responseData;
  }
  return responseData;
};

// Helper function to transform vendor store data to vendor format
// Backend returns stores with populated vendorId, need to merge them
const transformVendorData = (stores) => {
  if (!Array.isArray(stores)) {
    console.warn("⚠️ transformVendorData: stores is not an array", stores);
    return [];
  }
  return stores
    .filter((store) => store && store.vendorId) // Filter out stores without vendorId
    .map((store) => {
      const vendor = store.vendorId || {};
      const vendorId = vendor._id || vendor.id;
      const storeId = store._id || store.id;

      // Handle profile picture - could be object with uri or string
      const profilePic = vendor.profilePicture;
      const profilePicUri =
        typeof profilePic === "object" ? profilePic?.uri : profilePic;

      // Handle store pictures - array of file objects
      const storePic =
        Array.isArray(store.storePictures) && store.storePictures.length > 0
          ? store.storePictures[0]
          : null;
      const storePicUri =
        typeof storePic === "object" ? storePic?.uri : storePic;

      return {
        id: vendorId || storeId,
        _id: vendorId || storeId,
        businessName: store.storeName || vendor.storeName || "N/A",
        storeName: store.storeName,
        ownerName:
          `${vendor.firstName || ""} ${vendor.lastName || ""}`.trim() || "N/A",
        firstName: vendor.firstName,
        lastName: vendor.lastName,
        email: vendor.email || store.email || "",
        phone: vendor.mobNo || store.contactNumber || "",
        mobNo: vendor.mobNo,
        address: store.storeAddress || "",
        storeAddress: store.storeAddress,
        status:
          vendor.status !== undefined
            ? vendor.status
            : store.storeStatus !== undefined
            ? store.storeStatus
            : 1,
        isActive: vendor.isActive !== undefined ? vendor.isActive : true,
        profilePicture: profilePic,
        logo: storePicUri || profilePicUri,
        storeCode: store.storeCode,
        storeId: storeId,
        vendorId: vendorId,
        // Additional computed fields for UI
        totalSales: store.totalSales || 0,
        productsCount: store.productsCount || 0,
        rating: store.rating || 0,
        joinedDate:
          store.createdAt || store.joinedDate || new Date().toISOString(),
        // Keep all original fields
        ...store,
        // Override with vendor data where applicable
        ...vendor,
      };
    });
};

// Helper function to handle API calls with fallback
const apiCall = async (apiFunction, fallbackData) => {
  if (USE_MOCK_DATA) {
    console.log("🎭 Using mock data (forced by env)");
    await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network delay
    return fallbackData;
  }

  try {
    const response = await apiFunction();
    return extractResponseData(response);
  } catch (error) {
    console.warn("⚠️ API call failed, using fallback mock data", error);
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return fallbackData;
    }
    // Re-throw error if not using mock data
    throw error;
  }
};

// Dashboard API
export const dashboardAPI = {
  getStats: () =>
    apiCall(() => apiClient.get("/dashboard/stats"), mockData.dashboardStats),

  getAnalytics: (period = "daily") =>
    apiCall(
      () => apiClient.get(`/dashboard/analytics?period=${period}`),
      generateAnalytics(period)
    ),
};

// Users API - Customers
// Note: Backend returns User documents directly
export const customersAPI = {
  getAll: async (params) => {
    if (USE_MOCK_DATA) {
      return mockData.customers;
    }
    try {
      const response = await apiClient.get(ENDPOINTS.USERS_GET_CUSTOMER_LIST, {
        params,
      });
      const customers = extractResponseData(response);
      // Transform customer data to match frontend format
      return Array.isArray(customers)
        ? customers.map((c) => ({
            id: c._id || c.id,
            _id: c._id,
            name: `${c.firstName || ""} ${c.lastName || ""}`.trim(),
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            phone: c.mobNo,
            mobNo: c.mobNo,
            status: c.status,
            isActive: c.isActive,
            profilePicture: c.profilePicture,
            ...c,
          }))
        : [];
    } catch (error) {
      console.warn("⚠️ Failed to fetch customers, using mock data", error);
      return mockData.customers;
    }
  },

  getById: async (id) => {
    if (USE_MOCK_DATA) {
      return mockData.customers[0];
    }
    try {
      const response = await apiClient.get(ENDPOINTS.USERS_GET_CUSTOMER(id));
      const customer = extractResponseData(response);
      return {
        id: customer._id || customer.id,
        _id: customer._id,
        name: `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.mobNo,
        mobNo: customer.mobNo,
        status: customer.status,
        isActive: customer.isActive,
        profilePicture: customer.profilePicture,
        ...customer,
      };
    } catch (error) {
      console.warn("⚠️ Failed to fetch customer, using mock data", error);
      return mockData.customers[0];
    }
  },

  create: (formData) =>
    apiCall(
      () =>
        apiClient.post(ENDPOINTS.USERS_CREATE_CUSTOMER, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      { success: true, message: "Customer created successfully" }
    ),

  update: (id, formData) =>
    apiCall(
      () =>
        apiClient.put(ENDPOINTS.USERS_UPDATE_CUSTOMER(id), formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      { success: true, message: "Customer updated successfully" }
    ),

  deleteCustomer: (id) =>
    apiCall(() => apiClient.delete(ENDPOINTS.USERS_DELETE_CUSTOMER(id)), {
      success: true,
      message: "Customer deleted successfully",
    }),
};

export const approvalsAPI = {
  verifyStatus: (userId, data) =>
    apiCall(() => apiClient.put(ENDPOINTS.USERS_VERIFY_STATUS(userId), data), {
      success: true,
      message: "Status updated successfully",
    }),
};

// Users API - Vendors
// Note: Backend returns Store documents with populated vendorId
export const vendorsAPI = {
  getAll: async (params) => {
    if (USE_MOCK_DATA) {
      return mockData.vendors.filter((v) => v.status !== "pending");
    }
    try {
      const response = await apiClient.get(ENDPOINTS.USERS_GET_VENDOR_LIST, {
        params,
      });
      const stores = extractResponseData(response);
      const transformed = transformVendorData(stores);
      return transformed;
    } catch (error) {
      return mockData.vendors.filter((v) => v.status !== "pending");
    }
  },

  getById: async (id) => {
    if (USE_MOCK_DATA) {
      return mockData.vendors.find((v) => v.id === parseInt(id));
    }
    try {
      const response = await apiClient.get(ENDPOINTS.USERS_GET_VENDOR(id));
      const store = extractResponseData(response);
      // Transform single store to vendor format
      const transformed = transformVendorData([store]);
      return transformed[0] || null;
    } catch (error) {
      console.warn("⚠️ Failed to fetch vendor, using mock data", error);
      return mockData.vendors.find((v) => v.id === parseInt(id));
    }
  },

  create: (formData) =>
    apiCall(
      () =>
        apiClient.post(ENDPOINTS.USERS_CREATE_VENDOR, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      { success: true, message: "Vendor created successfully" }
    ),

  update: (id, formData) =>
    apiCall(
      () =>
        apiClient.put(ENDPOINTS.USERS_UPDATE_VENDOR(id), formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      { success: true, message: "Vendor updated successfully" }
    ),

  delete: (id) =>
    apiCall(() => apiClient.delete(ENDPOINTS.USERS_DELETE_VENDOR(id)), {
      success: true,
      message: "Vendor deleted successfully",
    }),

  verifyStatus: (userId, data) =>
    apiCall(() => apiClient.put(ENDPOINTS.USERS_VERIFY_STATUS(userId), data), {
      success: true,
      message: "Status updated successfully",
    }),

  // Legacy approval methods (for backward compatibility)
  // Note: Backend doesn't have /api/vendors/pending endpoint
  // Fetch all vendors and filter by status=1 (PENDING) instead
  // Backend uses: 1 = PENDING, 2 = APPROVED
  getPendingApprovals: async () => {
    if (USE_MOCK_DATA) {
      return mockData.vendors.filter(
        (v) => v.status === "pending" || v.status === 1
      );
    }
    // Fetch all vendors and filter by pending status (1 or "pending")
    try {
      const vendors = await vendorsAPI.getAll();
      if (!Array.isArray(vendors)) return [];
      return vendors.filter(
        (v) =>
          v.status === 1 ||
          v.status === "pending" ||
          v.status === "PENDING" ||
          (typeof v.status === "string" && v.status.toLowerCase() === "pending")
      );
    } catch (error) {
      console.warn("⚠️ Failed to fetch pending vendors", error);
      return mockData.vendors.filter(
        (v) => v.status === "pending" || v.status === 1
      );
    }
  },

  approveVendor: (id) => vendorsAPI.verifyStatus(id, { status: 2 }), // 2 = APPROVED

  rejectVendor: (id) => vendorsAPI.verifyStatus(id, { status: 1 }), // Set back to PENDING or use a rejected status

  getVendorDetails: (id) =>
    apiCall(
      () => apiClient.get(ENDPOINTS.USERS_GET_VENDOR(id)),
      mockData.vendors.find((v) => v.id === parseInt(id))
    ),

  suspendVendor: (id) =>
    apiCall(
      () =>
        apiClient.put(ENDPOINTS.USERS_VERIFY_STATUS(id), {
          status: "suspended",
        }),
      { success: true, message: "Vendor suspended successfully" }
    ),

  unsuspendVendor: (id) =>
    apiCall(
      () =>
        apiClient.put(ENDPOINTS.USERS_VERIFY_STATUS(id), { status: "active" }),
      { success: true, message: "Vendor unsuspended successfully" }
    ),
};

// Users API - Delivery Partners
// Note: Backend returns User documents directly
export const deliveryPartnersAPI = {
  getAll: async (params) => {
    if (USE_MOCK_DATA) {
      return mockData.deliveryAgents.filter((a) => a.status !== "pending");
    }
    try {
      const response = await apiClient.get(
        ENDPOINTS.USERS_GET_DELIVERY_PARTNER_LIST,
        { params }
      );
      const partners = extractResponseData(response);
      // Transform delivery partner data to match frontend format
      return Array.isArray(partners)
        ? partners.map((p) => ({
            id: p._id || p.id,
            _id: p._id,
            name: `${p.firstName || ""} ${p.lastName || ""}`.trim(),
            firstName: p.firstName,
            lastName: p.lastName,
            email: p.email,
            phone: p.mobNo,
            mobNo: p.mobNo,
            status: p.status,
            isActive: p.isActive,
            profilePicture: p.profilePicture,
            vehicleType: p.vehicleDetails?.vehicleType,
            vehicleDetails: p.vehicleDetails,
            avatar: p.profilePicture?.uri || p.profilePicture,
            ...p,
          }))
        : [];
    } catch (error) {
      console.warn(
        "⚠️ Failed to fetch delivery partners, using mock data",
        error
      );
      return mockData.deliveryAgents.filter((a) => a.status !== "pending");
    }
  },

  getById: async (id) => {
    if (USE_MOCK_DATA) {
      return mockData.deliveryAgents.find((a) => a.id === parseInt(id));
    }
    try {
      const response = await apiClient.get(
        ENDPOINTS.USERS_GET_DELIVERY_PARTNER(id)
      );
      const partner = extractResponseData(response);
      return {
        id: partner._id || partner.id,
        _id: partner._id,
        name: `${partner.firstName || ""} ${partner.lastName || ""}`.trim(),
        firstName: partner.firstName,
        lastName: partner.lastName,
        email: partner.email,
        phone: partner.mobNo,
        mobNo: partner.mobNo,
        status: partner.status,
        isActive: partner.isActive,
        profilePicture: partner.profilePicture,
        vehicleType: partner.vehicleDetails,
        vehicleDetails: partner.vehicleDetails,
        avatar: partner.profilePicture?.uri || partner.profilePicture,
        ...partner,
      };
    } catch (error) {
      console.warn(
        "⚠️ Failed to fetch delivery partner, using mock data",
        error
      );
      return mockData.deliveryAgents.find((a) => a.id === parseInt(id));
    }
  },

  create: (formData) =>
    apiCall(
      () =>
        apiClient.post(ENDPOINTS.USERS_CREATE_DELIVERY_PARTNER, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      { success: true, message: "Delivery partner created successfully" }
    ),

  update: (id, formData) =>
    apiCall(
      () =>
        apiClient.put(ENDPOINTS.USERS_UPDATE_DELIVERY_PARTNER(id), formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      { success: true, message: "Delivery partner updated successfully" }
    ),

  delete: (id) =>
    apiCall(
      () => apiClient.delete(ENDPOINTS.USERS_DELETE_DELIVERY_PARTNER(id)),
      { success: true, message: "Delivery partner deleted successfully" }
    ),

  verifyStatus: (userId, data) =>
    apiCall(() => apiClient.put(ENDPOINTS.USERS_VERIFY_STATUS(userId), data), {
      success: true,
      message: "Status updated successfully",
    }),
};

// Legacy Delivery Agents API (for backward compatibility)
export const categoriesAPI = {
  getAll: () =>
    apiCall(
      () => apiClient.get(ENDPOINTS.PRODUCTS_CATEGORIES_LIST),
      mockData.categories
    ),

  create: (data) =>
    apiCall(() => apiClient.post("/categories", data), {
      success: true,
      message: "Category created successfully",
      data,
    }),

  update: (id, data) =>
    apiCall(() => apiClient.put(`/categories/${id}`, data), {
      success: true,
      message: "Category updated successfully",
      data,
    }),

  delete: (id) =>
    apiCall(() => apiClient.delete(`/categories/${id}`), {
      success: true,
      message: "Category deleted successfully",
    }),
};

// Products API - Admin
export const productsAPI = {
  getAll: (params) =>
    apiCall(
      () => apiClient.get(ENDPOINTS.PRODUCTS_ADMIN_GET_LIST, { params }),
      mockData.products
    ),

  getById: (id) =>
    apiCall(
      () => apiClient.get(ENDPOINTS.PRODUCTS_ADMIN_GET_BY_ID(id)),
      mockData.products[0]
    ),

  getFeatured: () =>
    apiCall(
      () => apiClient.get("/products/featured"),
      mockData.products.filter((p) => p.isFeatured)
    ),

  toggleFeatured: (id) =>
    apiCall(() => apiClient.post(`/products/${id}/toggle-featured`), {
      success: true,
      message: "Product featured status updated",
    }),

  create: (formData) =>
    apiCall(
      () =>
        apiClient.post(ENDPOINTS.PRODUCTS_ADMIN_ADD, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      { success: true, message: "Product created successfully" }
    ),

  update: (id, formData) =>
    apiCall(
      () =>
        apiClient.put(ENDPOINTS.PRODUCTS_ADMIN_UPDATE(id), formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      { success: true, message: "Product updated successfully" }
    ),

  delete: (id) =>
    apiCall(() => apiClient.delete(ENDPOINTS.PRODUCTS_ADMIN_DELETE(id)), {
      success: true,
      message: "Product deleted successfully",
    }),
};

// Orders API - Admin
// Note: Backend doesn't have a general /api/orders endpoint for admin
// Admin can only view orders by vendor: /api/admin/orders/vendor/:vendorId
export const ordersAPI = {
  getAll: () => {
    // Backend doesn't have general admin orders endpoint
    // Return mock data only (no API call to avoid 404)
    return mockData.orders;
  },

  getDetails: (id) =>
    apiCall(
      () => apiClient.get(`/orders/${id}`),
      mockData.orders.find((o) => o.id === parseInt(id))
    ),

  getOrdersByVendor: (vendorId) =>
    apiCall(
      () => apiClient.get(ENDPOINTS.ADMIN_ORDERS_BY_VENDOR(vendorId)),
      mockData.orders
    ),

  getOrderHistory: (orderId) =>
    apiCall(() => apiClient.get(ENDPOINTS.ADMIN_ORDER_HISTORY(orderId)), []),

  assignAgent: (orderId, agentId) =>
    apiCall(
      () => apiClient.post(`/orders/${orderId}/assign-agent`, { agentId }),
      { success: true, message: "Agent assigned successfully" }
    ),

  updateStatus: (orderId, status) =>
    apiCall(() => apiClient.put(`/orders/${orderId}/status`, { status }), {
      success: true,
      message: "Order status updated",
    }),

  processRefund: (orderId, data) =>
    apiCall(() => apiClient.post(`/orders/${orderId}/refund`, data), {
      success: true,
      message: "Refund processed successfully",
    }),
};

// Transactions API
export const transactionsAPI = {
  getAll: (params) =>
    apiCall(
      () => apiClient.get("/transactions", { params }),
      mockData.transactions
    ),

  getVendorPayouts: () =>
    apiCall(
      () => apiClient.get("/payments/vendor-payouts"),
      mockData.transactions.filter((t) => t.type === "Vendor Payout")
    ),

  getCommissions: () =>
    apiCall(
      () => apiClient.get("/payments/commissions"),
      mockData.transactions.filter((t) => t.type === "Commission")
    ),
};

// Promotions API
export const promotionsAPI = {
  getBanners: () =>
    apiCall(() => apiClient.get("/promotions/banners"), mockData.banners),

  createBanner: (data) =>
    apiCall(() => apiClient.post("/promotions/banners", data), {
      success: true,
      message: "Banner created successfully",
      data,
    }),

  updateBanner: (id, data) =>
    apiCall(() => apiClient.put(`/promotions/banners/${id}`, data), {
      success: true,
      message: "Banner updated successfully",
      data,
    }),

  deleteBanner: (id) =>
    apiCall(() => apiClient.delete(`/promotions/banners/${id}`), {
      success: true,
      message: "Banner deleted successfully",
    }),

  getDiscountCodes: () =>
    apiCall(
      () => apiClient.get("/promotions/discount-codes"),
      mockData.discountCodes
    ),

  createDiscountCode: (data) =>
    apiCall(() => apiClient.post("/promotions/discount-codes", data), {
      success: true,
      message: "Discount code created successfully",
      data,
    }),

  updateDiscountCode: (id, data) =>
    apiCall(() => apiClient.put(`/promotions/discount-codes/${id}`, data), {
      success: true,
      message: "Discount code updated successfully",
      data,
    }),

  deleteDiscountCode: (id) =>
    apiCall(() => apiClient.delete(`/promotions/discount-codes/${id}`), {
      success: true,
      message: "Discount code deleted successfully",
    }),
};

// Analytics API
export const analyticsAPI = {
  getSalesReports: (params) =>
    apiCall(() => apiClient.get("/analytics/sales", { params }), {
      byVendor: generateSalesByVendor(),
      byCategory: generateSalesByCategory(),
    }),

  getDeliveryReports: () =>
    apiCall(
      () => apiClient.get("/analytics/delivery"),
      mockData.deliveryAgents.map((a) => ({
        name: a.name,
        delivered: a.ordersDelivered,
        rating: parseFloat(a.rating),
      }))
    ),

  getCustomerRetention: () =>
    apiCall(() => apiClient.get("/analytics/retention"), {
      newCustomers: Math.floor(Math.random() * 100) + 50,
      returningCustomers: Math.floor(Math.random() * 200) + 100,
      churnRate: (Math.random() * 10 + 5).toFixed(2),
    }),
};

// Settings API
export const settingsAPI = {
  getRoles: () => apiCall(() => apiClient.get(ENDPOINTS.ADMIN_ROLES_GET), []),

  getSiteSettings: () =>
    apiCall(() => apiClient.get("/settings/site"), {
      siteName: "Bazarghor",
      logo: "/logo.png",
      taxRate: 10,
      currency: "INR",
      appVersion: "1.0.0",
    }),

  updateSiteSettings: (data) =>
    apiCall(() => apiClient.put("/settings/site", data), {
      success: true,
      message: "Settings updated successfully",
      data,
    }),

  getNotificationTemplates: () =>
    apiCall(
      () => apiClient.get("/settings/notifications"),
      [
        {
          id: 1,
          name: "Order Confirmation",
          type: "email",
          template: "Your order {{orderNumber}} has been confirmed.",
        },
        {
          id: 2,
          name: "Order Shipped",
          type: "sms",
          template: "Your order is on the way!",
        },
      ]
    ),
};

// Support API
export const supportAPI = {
  getTickets: (params) =>
    apiCall(
      () => apiClient.get("/support/tickets", { params }),
      mockData.tickets
    ),

  getTicketDetails: (id) =>
    apiCall(
      () => apiClient.get(`/support/tickets/${id}`),
      mockData.tickets.find((t) => t.id === parseInt(id))
    ),

  replyToTicket: (id, message) =>
    apiCall(() => apiClient.post(`/support/tickets/${id}/reply`, { message }), {
      success: true,
      message: "Reply sent successfully",
    }),

  assignTicket: (id, adminId) =>
    apiCall(
      () => apiClient.post(`/support/tickets/${id}/assign`, { adminId }),
      { success: true, message: "Ticket assigned successfully" }
    ),

  updateTicketStatus: (id, status) =>
    apiCall(() => apiClient.put(`/support/tickets/${id}/status`, { status }), {
      success: true,
      message: "Ticket status updated",
    }),
};

// Audit Logs API
export const auditLogsAPI = {
  getLogs: (params) =>
    apiCall(() => apiClient.get("/audit/logs", { params }), mockData.auditLogs),
};

export default apiClient;

// Auth API (logout & permissions)
export const authAPI = {
  logout: () =>
    apiCall(() => apiClient.post(ENDPOINTS.ADMIN_LOGOUT), { success: true }),

  getPermissions: () =>
    apiCall(() => apiClient.get(ENDPOINTS.ADMIN_PERMISSIONS), {
      permissions: [],
    }),
};

// Staff Auth & Profile API
export const staffAuthAPI = {
  login: (data) =>
    apiCall(() => apiClient.post(ENDPOINTS.STAFF_LOGIN, data), {
      success: true,
    }),

  logout: () =>
    apiCall(() => apiClient.post(ENDPOINTS.STAFF_LOGOUT), { success: true }),

  getAdminProfile: () =>
    apiCall(() => apiClient.get(ENDPOINTS.STAFF_ADMIN_PROFILE), {
      id: "",
      firstName: "Staff",
      lastName: "Admin",
      email: "staff.admin@example.com",
      profilePicture: { uri: "" },
    }),

  getSubAdminProfile: () =>
    apiCall(() => apiClient.get(ENDPOINTS.STAFF_SUB_ADMIN_PROFILE), {
      id: "",
      firstName: "Sub",
      lastName: "Admin",
      email: "sub.admin@example.com",
      profilePicture: { uri: "" },
    }),

  updateSelf: (data) =>
    apiCall(() => apiClient.put(ENDPOINTS.STAFF_UPDATE_SELF, data), {
      success: true,
      message: "Profile updated (fallback)",
      data,
    }),
  updateSubAdminSelf: (data) =>
    apiCall(() => apiClient.put(ENDPOINTS.STAFF_SUB_UPDATE_SELF, data), {
      success: true,
      message: "Profile updated (fallback)",
      data,
    }),
  forgotPassword: (email) =>
    apiCall(() => apiClient.post(ENDPOINTS.STAFF_FORGET_PASSWORD, { email }), {
      success: true,
      message: "Password reset email sent (fallback)",
    }),

  resetPassword: (data) =>
    apiCall(() => apiClient.post(ENDPOINTS.STAFF_RESET_PASSWORD, data), {
      success: true,
      message: "Password reset (fallback)",
    }),

  adminChangePassword: (id, data) =>
    apiCall(
      () => apiClient.post(ENDPOINTS.STAFF_ADMIN_CHANGE_PASSWORD(id), data),
      { success: true, message: "Admin password changed (fallback)" }
    ),

  subAdminChangePassword: (id, data) =>
    apiCall(
      () => apiClient.post(ENDPOINTS.STAFF_SUB_ADMIN_CHANGE_PASSWORD(id), data),
      { success: true, message: "Sub-admin password changed (fallback)" }
    ),
};

// Store API - Admin
export const storeAPI = {
  getAll: (params) =>
    apiCall(() => apiClient.get(ENDPOINTS.STORE_ADMIN_GET_ALL, { params }), []),

  getById: (id) =>
    apiCall(() => apiClient.get(ENDPOINTS.STORE_ADMIN_GET_BY_ID(id)), null),

  update: (id, data) =>
    apiCall(() => apiClient.put(ENDPOINTS.STORE_ADMIN_UPDATE(id), data), {
      success: true,
      message: "Store updated successfully",
    }),

  toggleStatus: (storeId, data) =>
    apiCall(() => apiClient.put(ENDPOINTS.STORE_TOGGLE_STATUS(storeId), data), {
      success: true,
      message: "Store status updated successfully",
    }),
};

// Subscription API - Vendor & Customer
export const subscriptionAPI = {
  // Vendor Subscriptions
  vendor: {
    create: (data) =>
      apiCall(
        () => apiClient.post(ENDPOINTS.ADMIN_VENDOR_SUBSCRIPTION_CREATE, data),
        { success: true, message: "Vendor subscription created successfully" }
      ),

    getAll: () =>
      apiCall(
        () => apiClient.get(ENDPOINTS.ADMIN_VENDOR_SUBSCRIPTION_GET_ALL),
        []
      ),

    getById: (id) =>
      apiCall(
        () => apiClient.get(ENDPOINTS.ADMIN_VENDOR_SUBSCRIPTION_GET_BY_ID(id)),
        null
      ),

    assign: (subscriptionId, data) =>
      apiCall(
        () =>
          apiClient.put(
            ENDPOINTS.ADMIN_VENDOR_SUBSCRIPTION_ASSIGN(subscriptionId),
            data
          ),
        { success: true, message: "Subscription assigned successfully" }
      ),

    renew: (id, data) =>
      apiCall(
        () =>
          apiClient.put(ENDPOINTS.ADMIN_VENDOR_SUBSCRIPTION_RENEW(id), data),
        { success: true, message: "Subscription renewed successfully" }
      ),

    upgrade: (id, data) =>
      apiCall(
        () =>
          apiClient.put(ENDPOINTS.ADMIN_VENDOR_SUBSCRIPTION_UPGRADE(id), data),
        { success: true, message: "Subscription upgraded successfully" }
      ),

    cancel: (id) =>
      apiCall(
        () => apiClient.delete(ENDPOINTS.ADMIN_VENDOR_SUBSCRIPTION_CANCEL(id)),
        { success: true, message: "Subscription cancelled successfully" }
      ),
  },

  // Customer Subscriptions
  customer: {
    get: (customerId) =>
      apiCall(
        () =>
          apiClient.get(ENDPOINTS.ADMIN_CUSTOMER_SUBSCRIPTION_GET(customerId)),
        null
      ),

    purchase: (customerId, data) =>
      apiCall(
        () =>
          apiClient.post(
            ENDPOINTS.ADMIN_CUSTOMER_SUBSCRIPTION_PURCHASE(customerId),
            data
          ),
        { success: true, message: "Customer plan purchased successfully" }
      ),

    renew: (customerId, data) =>
      apiCall(
        () =>
          apiClient.post(
            ENDPOINTS.ADMIN_CUSTOMER_SUBSCRIPTION_RENEW(customerId),
            data
          ),
        { success: true, message: "Customer plan renewed successfully" }
      ),

    cancel: (customerId, data) =>
      apiCall(
        () =>
          apiClient.post(
            ENDPOINTS.ADMIN_CUSTOMER_SUBSCRIPTION_CANCEL(customerId),
            data
          ),
        { success: true, message: "Customer plan cancelled successfully" }
      ),

    upgrade: (customerId, data) =>
      apiCall(
        () =>
          apiClient.post(
            ENDPOINTS.ADMIN_CUSTOMER_SUBSCRIPTION_UPGRADE(customerId),
            data
          ),
        { success: true, message: "Customer plan upgraded successfully" }
      ),
  },
};

// Roles & Permissions API
export const rolesAPI = {
  getAll: () => apiCall(() => apiClient.get(ENDPOINTS.ADMIN_ROLES_GET), []),

  updatePermissions: (code, data) =>
    apiCall(
      () => apiClient.put(ENDPOINTS.ADMIN_ROLES_UPDATE_PERMISSIONS(code), data),
      { success: true, message: "Role permissions updated successfully" }
    ),

  bulkUpdatePermissions: (data) =>
    apiCall(
      () => apiClient.put(ENDPOINTS.ADMIN_ROLES_BULK_UPDATE_PERMISSIONS, data),
      { success: true, message: "Role permissions updated successfully" }
    ),
};

// Vendor Analytics API
export const vendorAnalyticsAPI = {
  getBasic: () =>
    apiCall(() => apiClient.get(ENDPOINTS.VENDOR_ANALYTICS_BASIC), {}),

  getLimited: () =>
    apiCall(() => apiClient.get(ENDPOINTS.VENDOR_ANALYTICS_LIMITED), {}),

  getFull: () =>
    apiCall(() => apiClient.get(ENDPOINTS.VENDOR_ANALYTICS_FULL), {}),
};

// Map/Places API
export const mapPlsAPI = {
  autosuggest: (params = {}) =>
    apiCall(() => apiClient.get(ENDPOINTS.MAP_PLS_AUTOSUGGEST, { params }), []),

  geocode: (params = {}) =>
    apiCall(() => apiClient.get(ENDPOINTS.MAP_PLS_GEOCODE, { params }), null),

  reverseGeocode: (params = {}) =>
    apiCall(
      () => apiClient.get(ENDPOINTS.MAP_PLS_REVERSE_GEOCODE, { params }),
      null
    ),
};

// Admin API (profile & password flows)
export const adminAPI = {
  getProfile: () =>
    apiCall(() => apiClient.get(ENDPOINTS.SUPER_ADMIN_PROFILE), {
      id: "",
      name: "Admin",
      email: "admin@example.com",
      mobNo: "",
      roles: [],
      permissions: [],
    }),

  updateProfile: (data) =>
    apiCall(() => apiClient.put(ENDPOINTS.SUPER_ADMIN_UPDATE, data), {
      success: true,
      message: "Profile updated (fallback)",
      data,
    }),

  changePassword: (id, data) =>
    apiCall(
      () => apiClient.post(ENDPOINTS.SUPER_ADMIN_CHANGE_PASSWORD(id), data),
      {
        success: true,
        message: "Password changed (fallback)",
      }
    ),

  forgotPassword: (email) =>
    apiCall(
      () => apiClient.post(ENDPOINTS.SUPER_ADMIN_FORGET_PASSWORD, { email }),
      {
        success: true,
        message: "Password reset email sent (fallback)",
      }
    ),

  resetPassword: (data) =>
    apiCall(() => apiClient.post(ENDPOINTS.SUPER_ADMIN_RESET_PASSWORD, data), {
      success: true,
      message: "Password reset (fallback)",
    }),
};

// Staff API (Admins & Sub-admins)
export const staffAPI = {
  getAll: (params) =>
    apiCall(() => apiClient.get(ENDPOINTS.STAFF_GET_ALL, { params }), []),

  getById: (id) =>
    apiCall(() => apiClient.get(ENDPOINTS.STAFF_GET_BY_ID(id)), null),

  addAdmin: (formData) =>
    apiCall(
      () =>
        apiClient.post(ENDPOINTS.STAFF_ADD_ADMIN, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      {
        success: true,
        message: "Admin created successfully",
      }
    ),

  updateAdmin: (id, formData) =>
    apiCall(
      () =>
        apiClient.put(ENDPOINTS.STAFF_UPDATE_ADMIN(id), formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      {
        success: true,
        message: "Admin updated successfully",
      }
    ),

  deleteAdmin: (id) =>
    apiCall(() => apiClient.delete(ENDPOINTS.STAFF_DELETE(id)), {
      success: true,
      message: "Admin deleted successfully",
    }),

  adminChangePassword: (id, data) =>
    apiCall(
      () => apiClient.post(ENDPOINTS.STAFF_ADMIN_CHANGE_PASSWORD(id), data),
      {
        success: true,
        message: "Admin password changed successfully",
      }
    ),

  subAdminChangePassword: (id, data) =>
    apiCall(
      () => apiClient.post(ENDPOINTS.STAFF_SUB_ADMIN_CHANGE_PASSWORD(id), data),
      {
        success: true,
        message: "Sub-admin password changed successfully",
      }
    ),
};
