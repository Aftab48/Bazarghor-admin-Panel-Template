// API Endpoints Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5173/api";
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === "true";

export const ENDPOINTS = {
  // Auth
  SUPER_ADMIN_LOGIN: "/admin/login",
  SUPER_ADMIN_LOGOUT: "/admin/logout",
  SUPER_ADMIN_PROFILE: "/admin/profile",
  SUPER_ADMIN_UPDATE: "/admin/update",
  SUPER_ADMIN_CHANGE_PASSWORD: (id) => `/admin/change-password/${id}`,
  SUPER_ADMIN_FORGET_PASSWORD: "/admin/forget-password",
  SUPER_ADMIN_RESET_PASSWORD: "/admin/reset-password",

  // Staff (Admins & Sub-admins)
  STAFF_ADD_ADMIN: "/staff/add-admin",
  STAFF_UPDATE_ADMIN: (id) => `/staff/update-admin/${id}`,
  STAFF_GET_ALL: "/staff/get-all-admin",
  STAFF_GET_BY_ID: (id) => `/staff/get-adminById/${id}`,
  STAFF_DELETE: (id) => `/staff/delete-admin/${id}`,
  // Staff Auth & Self-service
  STAFF_LOGIN: "/staff/login",
  STAFF_LOGOUT: "/staff/logout",
  STAFF_ADMIN_PROFILE: "/staff/get-admin-profile",
  STAFF_SUB_ADMIN_PROFILE: "/staff/get-sub-admin-profile",
  STAFF_UPDATE_SELF: "/staff/update-admin",
  STAFF_SUB_UPDATE_SELF: "/staff/update-sub-admin",
  STAFF_FORGET_PASSWORD: "/staff/forget-password",
  STAFF_RESET_PASSWORD: "/staff/reset-password",
  STAFF_ADMIN_CHANGE_PASSWORD: (id) => `/staff/admin-change-password/${id}`,
  STAFF_SUB_ADMIN_CHANGE_PASSWORD: (id) =>
    `/staff/sub-admin-change-password/${id}`,
  DASHBOARD_STATS: "/dashboard/stats",
  DASHBOARD_ANALYTICS: "/dashboard/analytics",

  // Users
  CUSTOMERS: "/users/customers",
  VENDORS: "/users/vendors",
  DELIVERY_AGENTS: "/users/delivery-agents",
  USER_ACTIVATE: (id) => `/users/${id}/activate`,
  USER_DEACTIVATE: (id) => `/users/${id}/deactivate`,
  USER_SUSPEND: (id) => `/users/${id}/suspend`,
  USER_RESET_PASSWORD: (id) => `/users/${id}/reset-password`,

  // Vendor Management
  VENDOR_APPROVALS: "/vendors/pending",
  VENDOR_APPROVE: (id) => `/vendors/${id}/approve`,
  VENDOR_REJECT: (id) => `/vendors/${id}/reject`,
  VENDOR_DETAILS: (id) => `/vendors/${id}`,
  VENDOR_SALES: (id) => `/vendors/${id}/sales`,
  VENDOR_INVENTORY: (id) => `/vendors/${id}/inventory`,

  // Delivery Agents
  AGENT_APPROVALS: "/delivery-agents/pending",
  AGENT_APPROVE: (id) => `/delivery-agents/${id}/approve`,
  AGENT_REJECT: (id) => `/delivery-agents/${id}/reject`,
  AGENT_PERFORMANCE: (id) => `/delivery-agents/${id}/performance`,
  AGENT_PAYOUTS: "/delivery-agents/payouts",

  // Categories & Products
  CATEGORIES: "/categories",
  PRODUCTS: "/products",
  FEATURED_PRODUCTS: "/products/featured",
  PRODUCT_TOGGLE_FEATURED: (id) => `/products/${id}/toggle-featured`,

  // Orders
  ORDERS: "/orders",
  ORDER_DETAILS: (id) => `/orders/${id}`,
  ORDER_ASSIGN_AGENT: (id) => `/orders/${id}/assign-agent`,
  ORDER_UPDATE_STATUS: (id) => `/orders/${id}/status`,
  ORDER_REFUND: (id) => `/orders/${id}/refund`,

  // Payments & Transactions
  TRANSACTIONS: "/transactions",
  VENDOR_PAYOUTS: "/payments/vendor-payouts",
  COMMISSIONS: "/payments/commissions",

  // Promotions
  BANNERS: "/promotions/banners",
  DISCOUNT_CODES: "/promotions/discount-codes",

  // Analytics & Reports
  SALES_REPORTS: "/analytics/sales",
  DELIVERY_REPORTS: "/analytics/delivery",
  CUSTOMER_RETENTION: "/analytics/retention",

  // Settings
  ROLES: "/settings/roles",
  PERMISSIONS: "/settings/permissions",
  SITE_SETTINGS: "/settings/site",
  NOTIFICATION_TEMPLATES: "/settings/notifications",

  // Support
  TICKETS: "/support/tickets",
  TICKET_REPLY: (id) => `/support/tickets/${id}/reply`,
  TICKET_ASSIGN: (id) => `/support/tickets/${id}/assign`,

  // Audit Logs
  AUDIT_LOGS: "/audit/logs",
};
