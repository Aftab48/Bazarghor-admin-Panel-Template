// API Endpoints Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
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
  ADMIN_PERMISSIONS: "/admin/permissions",

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
  USERS_VERIFY_STATUS: (userId) => `/users/verify-status/${userId}`,

  // User Management - Customers
  USERS_GET_CUSTOMER_LIST: "/users/get-customer-list",
  USERS_GET_CUSTOMER: (id) => `/users/get-customer/${id}`,
  USERS_CREATE_CUSTOMER: "/users/create-customer",
  USERS_UPDATE_CUSTOMER: (id) => `/users/update-customer/${id}`,
  USERS_DELETE_CUSTOMER: (id) => `/users/delete-customer/${id}`,

  // User Management - Vendors
  USERS_GET_VENDOR_LIST: "/users/get-vendor-list",
  USERS_GET_VENDOR: (id) => `/users/get-vendor/${id}`,
  USERS_CREATE_VENDOR: "/users/create-vendor",
  USERS_UPDATE_VENDOR: (id) => `/users/update-vendor/${id}`,
  USERS_DELETE_VENDOR: (id) => `/users/delete-vendor/${id}`,

  // User Management - Delivery Partners
  USERS_GET_DELIVERY_PARTNER_LIST: "/users/get-delivery-partner-list",
  USERS_GET_DELIVERY_PARTNER: (id) => `/users/get-delivery-partner/${id}`,
  USERS_CREATE_DELIVERY_PARTNER: "/users/create-delivery-partner",
  USERS_UPDATE_DELIVERY_PARTNER: (id) => `/users/update-delivery-partner/${id}`,
  USERS_DELETE_DELIVERY_PARTNER: (id) => `/users/delete-delivery-partner/${id}`,

  // Products - Admin
  PRODUCTS_ADMIN_ADD: "/products/admin/add-product",
  PRODUCTS_ADMIN_GET_LIST: "/products/admin/get-products-list",
  PRODUCTS_ADMIN_GET_BY_ID: (id) => `/products/admin/get-product/${id}`,
  PRODUCTS_ADMIN_UPDATE: (id) => `/products/admin/update-product/${id}`,
  PRODUCTS_ADMIN_DELETE: (id) => `/products/admin/delete-product/${id}`,

  // Catalog - Categories
  CATEGORIES_ADD: "/categories/add-category",
  CATEGORIES_LIST: "/categories/get-categories-list",
  CATEGORIES_GET_BY_ID: (id) => `/categories/get-category/${id}`,
  CATEGORIES_UPDATE: (id) => `/categories/update-category/${id}`,
  CATEGORIES_DELETE: (id) => `/categories/delete-category/${id}`,

  // Stores - Admin
  STORE_ADMIN_GET_ALL: "/store/admin/get-store",
  STORE_ADMIN_GET_BY_ID: (id) => `/store/admin/get-store-by-id/${id}`,
  STORE_ADMIN_UPDATE: (id) => `/store/admin/update-store-by-id/${id}`,
  STORE_TOGGLE_STATUS: (storeId) => `/store/${storeId}/open-close`,

  // Orders - Admin
  ADMIN_ORDERS_BY_VENDOR: (vendorId) => `/admin/orders/vendor/${vendorId}`,
  ADMIN_ORDER_HISTORY: (orderId) => `/admin/order/${orderId}/history`,

  // Vendor Subscriptions - Admin
  ADMIN_VENDOR_SUBSCRIPTION_CREATE: "/admin/vendor-subscription",
  ADMIN_VENDOR_SUBSCRIPTION_GET_ALL: "/admin/vendor-subscription",
  ADMIN_VENDOR_SUBSCRIPTION_GET_BY_ID: (id) =>
    `/admin/vendor-subscription/${id}`,
  ADMIN_VENDOR_SUBSCRIPTION_ASSIGN: (subscriptionId) =>
    `/admin/vendor-subscription/${subscriptionId}/assign`,
  ADMIN_VENDOR_SUBSCRIPTION_RENEW: (id) =>
    `/admin/vendor-subscription/${id}/renew`,
  ADMIN_VENDOR_SUBSCRIPTION_UPGRADE: (id) =>
    `/admin/vendor-subscription/${id}/upgrade`,
  ADMIN_VENDOR_SUBSCRIPTION_CANCEL: (id) =>
    `/admin/cancel-vendor-subscription/${id}`,

  // Customer Subscriptions - Admin
  ADMIN_CUSTOMER_SUBSCRIPTION_GET: (customerId) =>
    `/admin/customer-subscription/${customerId}`,
  ADMIN_CUSTOMER_SUBSCRIPTION_PURCHASE: (customerId) =>
    `/admin/customer-subscription/${customerId}/purchase`,
  ADMIN_CUSTOMER_SUBSCRIPTION_RENEW: (customerId) =>
    `/admin/customer-subscription/${customerId}/renew`,
  ADMIN_CUSTOMER_SUBSCRIPTION_CANCEL: (customerId) =>
    `/admin/customer-subscription/${customerId}/cancel`,
  ADMIN_CUSTOMER_SUBSCRIPTION_UPGRADE: (customerId) =>
    `/admin/customer-subscription/${customerId}/upgrade`,

  // Roles & Permissions
  ADMIN_ROLES_GET: "/admin/roles-permissions/roles",
  ADMIN_ROLES_UPDATE_PERMISSIONS: (code) =>
    `/admin/roles-permissions/roles/${code}/permissions`,
  ADMIN_ROLES_BULK_UPDATE_PERMISSIONS:
    "/admin/roles-permissions/roles/bulk/permissions",

  // Vendor Analytics
  VENDOR_ANALYTICS_BASIC: "/vendor-analytics/analytics/basic",
  VENDOR_ANALYTICS_LIMITED: "/vendor-analytics/analytics/limited",
  VENDOR_ANALYTICS_FULL: "/vendor-analytics/analytics/full",

  // Map/Places
  MAP_PLS_AUTOSUGGEST: "/map-pls/places/autosuggest",
  MAP_PLS_GEOCODE: "/map-pls/places/geocode",
  MAP_PLS_REVERSE_GEOCODE: "/map-pls/places/reverse-geocode",
};
