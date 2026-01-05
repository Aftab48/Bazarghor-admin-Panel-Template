import axios from "axios";
import { message } from "antd";
import { API_BASE_URL, ENDPOINTS } from "../constants/endpoints";

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
    if (error.response) {
      const status = error.response.status;
      const messageText =
        error?.response?.data?.message || error?.message || "Unauthorized";

      if (status === 401) {
        // For sub-admins, don't force logout on permission-style 401s; show message only
        let storedRoles = [];
        try {
          const roleStr = localStorage.getItem("userRoles");
          storedRoles = roleStr ? JSON.parse(roleStr) : [];
        } catch {
          storedRoles = [];
        }
        const isSubAdmin =
          Array.isArray(storedRoles) && storedRoles.includes("SUB_ADMIN");
        const tokenError = /token|expired|signature|invalid|jwt/i.test(
          messageText
        );

        if (isSubAdmin && !tokenError) {
          message.error(
            messageText || "You are not authorized to perform this action."
          );
          return Promise.reject(error);
        }

        // Clear auth state on real auth failures
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userRoles");
        localStorage.removeItem("userPermissions");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        message.error(messageText || "Unauthorized. Please login again.");
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

// Helper function to handle API calls
const apiCall = async (apiFunction) => {
  const response = await apiFunction();
  return extractResponseData(response);
};

// Dashboard API
export const dashboardAPI = {
  getStats: () =>
    apiCall(() => apiClient.get(ENDPOINTS.DASHBOARD_STATS)),
  getSeries: (period) =>
    apiCall(() =>
      apiClient.get(ENDPOINTS.DASHBOARD_SERIES, {
        params: { period },
      })
    ),

  getActiveVendorsAndDeliveryPartners: () =>
    apiCall(() => apiClient.get(ENDPOINTS.DASHBOARD_ACTIVE_VENDORS_DELIVERY_PARTNERS)),
  getRecentOrders: () =>
    apiCall(() => apiClient.get(ENDPOINTS.DASHBOARD_RECENT_ORDERS)),
};

// Users API - Customers
// Note: Backend returns User documents directly
export const customersAPI = {
  getAll: async (params) => {
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
  },

  getById: async (id) => {
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
  },

  create: (formData) =>
    apiCall(() =>
      apiClient.post(ENDPOINTS.USERS_CREATE_CUSTOMER, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ),

  update: (id, formData) =>
    apiCall(() =>
      apiClient.put(ENDPOINTS.USERS_UPDATE_CUSTOMER(id), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ),

  deleteCustomer: (id) =>
    apiCall(() => apiClient.delete(ENDPOINTS.USERS_DELETE_CUSTOMER(id))),
};

export const approvalsAPI = {
  verifyStatus: (userId, data) =>
    apiCall(() => apiClient.put(ENDPOINTS.USERS_VERIFY_STATUS(userId), data)),
};

// Users API - Vendors
// Note: Backend returns Store documents with populated vendorId
export const vendorsAPI = {
  getAll: async (params) => {
    const response = await apiClient.get(ENDPOINTS.USERS_GET_VENDOR_LIST, {
      params,
    });
    const stores = extractResponseData(response);
    const transformed = transformVendorData(stores);
    return transformed;
  },

  getById: async (id) => {
    const response = await apiClient.get(ENDPOINTS.USERS_GET_VENDOR(id));
    const store = extractResponseData(response);
    // Transform single store to vendor format
    const transformed = transformVendorData([store]);
    return transformed[0] || null;
  },

  create: (formData) =>
    apiCall(() =>
      apiClient.post(ENDPOINTS.USERS_CREATE_VENDOR, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ),

  update: (id, formData) =>
    apiCall(() =>
      apiClient.put(ENDPOINTS.USERS_UPDATE_VENDOR(id), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ),

  delete: (id) =>
    apiCall(() => apiClient.delete(ENDPOINTS.USERS_DELETE_VENDOR(id))),

  verifyStatus: (userId, data) =>
    apiCall(() => apiClient.put(ENDPOINTS.USERS_VERIFY_STATUS(userId), data)),

  getPendingApprovals: async () => {
    const vendors = await vendorsAPI.getAll();
    if (!Array.isArray(vendors)) return [];
    return vendors.filter(
      (v) =>
        v.status === 1 ||
        v.status === "pending" ||
        v.status === "PENDING" ||
        (typeof v.status === "string" && v.status.toLowerCase() === "pending")
    );
  },

  approveVendor: (id) => vendorsAPI.verifyStatus(id, { status: 2 }), // 2 = APPROVED

  rejectVendor: (id) => vendorsAPI.verifyStatus(id, { status: 1 }), // Set back to PENDING or use a rejected status

  getVendorDetails: (id) =>
    apiCall(() => apiClient.get(ENDPOINTS.USERS_GET_VENDOR(id))),

  suspendVendor: (id) =>
    apiCall(() =>
      apiClient.put(ENDPOINTS.USERS_VERIFY_STATUS(id), {
        status: "suspended",
      })
    ),

  unsuspendVendor: (id) =>
    apiCall(() =>
      apiClient.put(ENDPOINTS.USERS_VERIFY_STATUS(id), { status: "active" })
    ),
};

// Users API - Delivery Partners
// Note: Backend returns User documents directly
export const deliveryPartnersAPI = {
  getAll: async (params) => {
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
  },

  getById: async (id) => {
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
  },

  create: (formData) =>
    apiCall(() =>
      apiClient.post(ENDPOINTS.USERS_CREATE_DELIVERY_PARTNER, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ),

  update: (id, formData) =>
    apiCall(() =>
      apiClient.put(ENDPOINTS.USERS_UPDATE_DELIVERY_PARTNER(id), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ),

  delete: (id) =>
    apiCall(() => apiClient.delete(ENDPOINTS.USERS_DELETE_DELIVERY_PARTNER(id))),

  verifyStatus: (userId, data) =>
    apiCall(() => apiClient.put(ENDPOINTS.USERS_VERIFY_STATUS(userId), data)),
};

export const categoriesAPI = {
  getAll: (params = {}) => {
    return apiCall(() =>
      apiClient.get(ENDPOINTS.CATEGORIES_LIST, {
        params,
      })
    );
  },

  create: (data) =>
    apiCall(() =>
      apiClient.post(ENDPOINTS.CATEGORIES_ADD, data, {
        headers:
          data instanceof FormData
            ? { "Content-Type": "multipart/form-data" }
            : undefined,
      })
    ),

  update: (id, data) =>
    apiCall(() =>
      apiClient.put(ENDPOINTS.CATEGORIES_UPDATE(id), data, {
        headers:
          data instanceof FormData
            ? { "Content-Type": "multipart/form-data" }
            : undefined,
      })
    ),

  delete: (id) =>
    apiCall(() => apiClient.delete(ENDPOINTS.CATEGORIES_DELETE(id))),
};

// Products API - Admin
export const productsAPI = {
  getAll: (params) =>
    apiCall(() =>
      apiClient.get(ENDPOINTS.PRODUCTS_ADMIN_GET_LIST, {
        params,
      })
    ),

  getById: (id) =>
    apiCall(() => apiClient.get(ENDPOINTS.PRODUCTS_ADMIN_GET_BY_ID(id))),

  getFeatured: () =>
    apiCall(() => apiClient.get("/products/featured")),

  toggleFeatured: (id) =>
    apiCall(() => apiClient.post(`/products/${id}/toggle-featured`)),

  create: (formData) =>
    apiCall(() =>
      apiClient.post(ENDPOINTS.PRODUCTS_ADMIN_ADD, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ),

  update: (id, formData) =>
    apiCall(() =>
      apiClient.put(ENDPOINTS.PRODUCTS_ADMIN_UPDATE(id), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ),

  delete: (id) =>
    apiCall(() => apiClient.delete(ENDPOINTS.PRODUCTS_ADMIN_DELETE(id))),
};

// Orders API - Admin
// Note: Backend doesn't have a general /api/orders endpoint for admin
// Admin can only view orders by vendor: /api/admin/orders/vendor/:vendorId
export const ordersAPI = {
  getAll: (params) =>
    apiCall(() => apiClient.get(ENDPOINTS.ADMIN_GET_ORDERS, { params })),
  getById: (orderID) =>
    apiCall(() => apiClient.get(ENDPOINTS.ADMIN_GET_ORDER_BY_ID(orderID))),
  updateOrder: (orderID, data) =>
    apiCall(() => apiClient.put(ENDPOINTS.ADMIN_UPDATE_ORDER(orderID), data)),

  // getDetails: (id) =>
  //   apiCall(
  //     () => apiClient.get(ENDPOINTS.ADMIN_ORDERS_BY_VENDOR(`${id}`)),
  //     mockData.orders.find((o) => o.id === parseInt(id))
  //   ),

  // getOrdersByVendor: (vendorId) =>
  //   apiCall(
  //     () => apiClient.get(ENDPOINTS.ADMIN_ORDERS_BY_VENDOR(vendorId)),
  //     mockData.orders
  //   ),

  // getOrderHistory: (orderId) =>
  //   apiCall(() => apiClient.get(ENDPOINTS.ADMIN_ORDER_HISTORY(orderId)), []),

  // assignAgent: (orderId, agentId) =>
  //   apiCall(
  //     () => apiClient.post(`/orders/${orderId}/assign-agent`, { agentId }),
  //     { success: true, message: "Agent assigned successfully" }
  //   ),

  // updateStatus: (orderId, status) =>
  //   apiCall(() => apiClient.put(`/orders/${orderId}/status`, { status }), {
  //     success: true,
  //     message: "Order status updated",
  //   }),

  // processRefund: (orderId, data) =>
  //   apiCall(() => apiClient.post(`/orders/${orderId}/refund`, data), {
  //     success: true,
  //     message: "Refund processed successfully",
  //   }),
};

// Transactions API
export const transactionsAPI = {
  getAll: (params) =>
    apiCall(() => apiClient.get("/transactions", { params })),

  getVendorPayouts: () =>
    apiCall(() => apiClient.get("/payments/vendor-payouts")),

  getCommissions: () =>
    apiCall(() => apiClient.get("/payments/commissions")),
};

// Promotions API
export const promotionsAPI = {
  getBanners: () =>
    apiCall(() => apiClient.get("/promotions/banners")),

  createBanner: (data) =>
    apiCall(() => apiClient.post("/promotions/banners", data)),

  updateBanner: (id, data) =>
    apiCall(() => apiClient.put(`/promotions/banners/${id}`, data)),

  deleteBanner: (id) =>
    apiCall(() => apiClient.delete(`/promotions/banners/${id}`)),

  getDiscountCodes: () =>
    apiCall(() => apiClient.get("/promotions/discount-codes")),

  createDiscountCode: (data) =>
    apiCall(() => apiClient.post("/promotions/discount-codes", data)),

  updateDiscountCode: (id, data) =>
    apiCall(() => apiClient.put(`/promotions/discount-codes/${id}`, data)),

  deleteDiscountCode: (id) =>
    apiCall(() => apiClient.delete(`/promotions/discount-codes/${id}`)),
};

// Analytics API
export const analyticsAPI = {
  getSalesReports: (params) =>
    apiCall(() => apiClient.get("/analytics/sales", { params })),

  getDeliveryReports: () =>
    apiCall(() => apiClient.get("/analytics/delivery")),

  getCustomerRetention: () =>
    apiCall(() => apiClient.get("/analytics/retention")),
};

// Settings API
export const settingsAPI = {
  getRoles: () => apiCall(() => apiClient.get(ENDPOINTS.ADMIN_ROLES_GET)),
};

// Support API
export const supportAPI = {
  getTickets: (params) =>
    apiCall(() => apiClient.get("/support/tickets", { params })),

  getTicketDetails: (id) =>
    apiCall(() => apiClient.get(`/support/tickets/${id}`)),

  replyToTicket: (id, message) =>
    apiCall(() => apiClient.post(`/support/tickets/${id}/reply`, { message })),

  assignTicket: (id, adminId) =>
    apiCall(() => apiClient.post(`/support/tickets/${id}/assign`, { adminId })),

  updateTicketStatus: (id, status) =>
    apiCall(() => apiClient.put(`/support/tickets/${id}/status`, { status })),
};

// Audit Logs API
export const auditLogsAPI = {
  getLogs: (params) =>
    apiCall(() => apiClient.get("/audit/logs", { params })),
};

export default apiClient;

// Auth API (logout & permissions)
export const authAPI = {
  logout: () =>
    apiCall(() => apiClient.post(ENDPOINTS.SUPER_ADMIN_LOGOUT)),

  getPermissions: () =>
    apiCall(() => apiClient.get(ENDPOINTS.ADMIN_PERMISSIONS)),
};

// Staff Auth & Profile API
export const staffAuthAPI = {
  login: (data) =>
    apiCall(() => apiClient.post(ENDPOINTS.STAFF_LOGIN, data)),

  logout: () =>
    apiCall(() => apiClient.post(ENDPOINTS.STAFF_LOGOUT)),

  getAdminProfile: () =>
    apiCall(() => apiClient.get(ENDPOINTS.STAFF_ADMIN_PROFILE)),

  getSubAdminProfile: () =>
    apiCall(() => apiClient.get(ENDPOINTS.STAFF_SUB_ADMIN_PROFILE)),

  updateSelf: (data) =>
    apiCall(() => apiClient.put(ENDPOINTS.STAFF_UPDATE_SELF, data)),
  updateSubAdminSelf: (data) =>
    apiCall(() => apiClient.put(ENDPOINTS.STAFF_SUB_UPDATE_SELF, data)),
  forgotPassword: (email) =>
    apiCall(() => apiClient.post(ENDPOINTS.STAFF_FORGET_PASSWORD, { email })),

  resetPassword: (data) =>
    apiCall(() => apiClient.post(ENDPOINTS.STAFF_RESET_PASSWORD, data)),

  adminChangePassword: (id, data) =>
    apiCall(() => apiClient.post(ENDPOINTS.STAFF_ADMIN_CHANGE_PASSWORD(id), data)),

  subAdminChangePassword: (id, data) =>
    apiCall(() => apiClient.post(ENDPOINTS.STAFF_SUB_ADMIN_CHANGE_PASSWORD(id), data)),
};

// Store API - Admin
export const storeAPI = {
  getAll: (params) =>
    apiCall(() => apiClient.get(ENDPOINTS.STORE_ADMIN_GET_ALL, { params })),

  getById: (id) =>
    apiCall(() => apiClient.get(ENDPOINTS.STORE_ADMIN_GET_BY_ID(id))),

  update: (id, data) =>
    apiCall(() => apiClient.put(ENDPOINTS.STORE_ADMIN_UPDATE(id), data)),

  toggleStatus: (storeId, data) =>
    apiCall(() => apiClient.put(ENDPOINTS.STORE_TOGGLE_STATUS(storeId), data)),
};

// Subscription API - Vendor & Customer
export const subscriptionAPI = {
  // Vendor Subscriptions
  vendor: {
    create: (data) =>
      apiCall(() => apiClient.post(ENDPOINTS.ADMIN_VENDOR_SUBSCRIPTION_CREATE, data)),

    getAll: () =>
      apiCall(() => apiClient.get(ENDPOINTS.ADMIN_VENDOR_SUBSCRIPTION_GET_ALL)),

    getById: (id) =>
      apiCall(() => apiClient.get(ENDPOINTS.ADMIN_VENDOR_SUBSCRIPTION_GET_BY_ID(id))),

    assign: (subscriptionId, data) =>
      apiCall(() =>
        apiClient.put(
          ENDPOINTS.ADMIN_VENDOR_SUBSCRIPTION_ASSIGN(subscriptionId),
          data
        )
      ),

    renew: (id, data) =>
      apiCall(() =>
        apiClient.put(ENDPOINTS.ADMIN_VENDOR_SUBSCRIPTION_RENEW(id), data)
      ),

    upgrade: (id, data) =>
      apiCall(() =>
        apiClient.put(ENDPOINTS.ADMIN_VENDOR_SUBSCRIPTION_UPGRADE(id), data)
      ),

    cancel: (id) =>
      apiCall(() => apiClient.delete(ENDPOINTS.ADMIN_VENDOR_SUBSCRIPTION_CANCEL(id))),
  },

  // Customer Subscriptions
  customer: {
    get: (customerId) =>
      apiCall(() =>
        apiClient.get(ENDPOINTS.ADMIN_CUSTOMER_SUBSCRIPTION_GET(customerId))
      ),

    purchase: (customerId, data) =>
      apiCall(() =>
        apiClient.post(
          ENDPOINTS.ADMIN_CUSTOMER_SUBSCRIPTION_PURCHASE(customerId),
          data
        )
      ),

    renew: (customerId, data) =>
      apiCall(() =>
        apiClient.post(
          ENDPOINTS.ADMIN_CUSTOMER_SUBSCRIPTION_RENEW(customerId),
          data
        )
      ),

    cancel: (customerId, data) =>
      apiCall(() =>
        apiClient.post(
          ENDPOINTS.ADMIN_CUSTOMER_SUBSCRIPTION_CANCEL(customerId),
          data
        )
      ),

    upgrade: (customerId, data) =>
      apiCall(() =>
        apiClient.post(
          ENDPOINTS.ADMIN_CUSTOMER_SUBSCRIPTION_UPGRADE(customerId),
          data
        )
      ),
  },
};

// Roles & Permissions API
export const rolesAPI = {
  getAll: () => apiCall(() => apiClient.get(ENDPOINTS.ADMIN_ROLES_GET)),

  updatePermissions: (code, data) =>
    apiCall(() => apiClient.put(ENDPOINTS.ADMIN_ROLES_UPDATE_PERMISSIONS(code), data)),

  bulkUpdatePermissions: (data) =>
    apiCall(() => apiClient.put(ENDPOINTS.ADMIN_ROLES_BULK_UPDATE_PERMISSIONS, data)),
};

// Vendor Analytics API
export const vendorAnalyticsAPI = {
  getBasic: () =>
    apiCall(() => apiClient.get(ENDPOINTS.VENDOR_ANALYTICS_BASIC)),

  getLimited: () =>
    apiCall(() => apiClient.get(ENDPOINTS.VENDOR_ANALYTICS_LIMITED)),

  getFull: () =>
    apiCall(() => apiClient.get(ENDPOINTS.VENDOR_ANALYTICS_FULL)),
};

// Map/Places API
export const mapPlsAPI = {
  autosuggest: (params = {}) =>
    apiCall(() => apiClient.get(ENDPOINTS.MAP_PLS_AUTOSUGGEST, { params })),

  geocode: (params = {}) =>
    apiCall(() => apiClient.get(ENDPOINTS.MAP_PLS_GEOCODE, { params })),

  reverseGeocode: (params = {}) =>
    apiCall(() => apiClient.get(ENDPOINTS.MAP_PLS_REVERSE_GEOCODE, { params })),
};

// Admin API (profile & password flows)
export const adminAPI = {
  getProfile: () =>
    apiCall(() => apiClient.get(ENDPOINTS.SUPER_ADMIN_PROFILE)),

  updateProfile: (data) =>
    apiCall(() => apiClient.put(ENDPOINTS.SUPER_ADMIN_UPDATE, data)),

  changePassword: (id, data) =>
    apiCall(() => apiClient.post(ENDPOINTS.SUPER_ADMIN_CHANGE_PASSWORD(id), data)),

  forgotPassword: (email) =>
    apiCall(() => apiClient.post(ENDPOINTS.SUPER_ADMIN_FORGET_PASSWORD, { email })),

  resetPassword: (data) =>
    apiCall(() => apiClient.post(ENDPOINTS.SUPER_ADMIN_RESET_PASSWORD, data)),
};

// Staff API (Admins & Sub-admins)
export const staffAPI = {
  getAll: (params) =>
    apiCall(() => apiClient.get(ENDPOINTS.STAFF_GET_ALL, { params })),

  getById: (id) =>
    apiCall(() => apiClient.get(ENDPOINTS.STAFF_GET_BY_ID(id))),

  addAdmin: (formData) =>
    apiCall(() =>
      apiClient.post(ENDPOINTS.STAFF_ADD_ADMIN, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ),

  updateAdmin: (id, formData) =>
    apiCall(() =>
      apiClient.put(ENDPOINTS.STAFF_UPDATE_ADMIN(id), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ),

  deleteAdmin: (id) =>
    apiCall(() => apiClient.delete(ENDPOINTS.STAFF_DELETE(id))),

  adminChangePassword: (id, data) =>
    apiCall(() => apiClient.post(ENDPOINTS.STAFF_ADMIN_CHANGE_PASSWORD(id), data)),

  subAdminChangePassword: (id, data) =>
    apiCall(() => apiClient.post(ENDPOINTS.STAFF_SUB_ADMIN_CHANGE_PASSWORD(id), data)),
};
