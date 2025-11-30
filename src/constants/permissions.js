// Permission constants matching backend permissionConstant.js
export const PERMISSIONS = {
  // Admin account management
  VIEW_ADMINS: "view_admins",
  CREATE_ADMIN: "create_admin",
  UPDATE_ADMIN: "update_admin",
  DELETE_ADMIN: "delete_admin",
  MANAGE_ROLE_PERMISSIONS: "manage_role_permissions",
  // Sub admin management
  CREATE_SUB_ADMIN: "create_sub_admin",
  UPDATE_SUB_ADMIN: "update_sub_admin",
  DELETE_SUB_ADMIN: "delete_sub_admin",
  // Vendor management
  VIEW_VENDORS: "view_vendors",
  CREATE_VENDOR: "create_vendor",
  UPDATE_VENDOR: "update_vendor",
  DELETE_VENDOR: "delete_vendor",
  // Delivery partner
  VIEW_DELIVERY_PARTNERS: "view_delivery_partners",
  CREATE_DELIVERY_PARTNER: "create_delivery_partner",
  UPDATE_DELIVERY_PARTNER: "update_delivery_partner",
  DELETE_DELIVERY_PARTNER: "delete_delivery_partner",
  // Customer
  VIEW_CUSTOMERS: "view_customers",
  CREATE_CUSTOMER: "create_customer",
  UPDATE_CUSTOMER: "update_customer",
  DELETE_CUSTOMER: "delete_customer",
  // Products
  VIEW_PRODUCTS: "view_products",
  CREATE_PRODUCT: "create_product",
  UPDATE_PRODUCT: "update_product",
  DELETE_PRODUCT: "delete_product",
  // Orders
  VIEW_ORDERS: "view_orders",
  MANAGE_ORDERS: "manage_orders",
  // Store / subscription
  VIEW_STORES: "view_stores",
  MANAGE_SUBSCRIPTIONS: "manage_subscriptions",
  // Status verification
  VERIFY_USER_STATUS: "verify_user_status",
};

// Role constants matching backend authConstant.js
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  SUB_ADMIN: "SUB_ADMIN",
  VENDOR: "VENDOR",
  DELIVERY_PARTNER: "DELIVERY_PARTNER",
  CUSTOMER: "CUSTOMER",
};

// Permission to route mapping for menu filtering
export const ROUTE_PERMISSIONS = {
  // Dashboard - always visible if authenticated
  "/": null, // No permission required
  
  // User Management
  "/users/customers": PERMISSIONS.VIEW_CUSTOMERS,
  "/users/vendors": PERMISSIONS.VIEW_VENDORS,
  "/users/delivery-agents": PERMISSIONS.VIEW_DELIVERY_PARTNERS,
  
  // Vendor Management
  "/vendor-management": PERMISSIONS.VIEW_VENDORS,
  
  // Delivery Management
  "/delivery-management": PERMISSIONS.VIEW_DELIVERY_PARTNERS,
  
  // Catalog
  "/catalog/categories": PERMISSIONS.VIEW_PRODUCTS,
  "/catalog/products": PERMISSIONS.VIEW_PRODUCTS,
  
  // Orders
  "/orders": PERMISSIONS.VIEW_ORDERS,
  
  // Transactions
  "/transactions": PERMISSIONS.VIEW_ORDERS, // Using VIEW_ORDERS as fallback
  
  // Promotions
  "/promotions/banners": PERMISSIONS.VIEW_ORDERS, // Using VIEW_ORDERS as fallback
  "/promotions/discount-codes": PERMISSIONS.VIEW_ORDERS, // Using VIEW_ORDERS as fallback
  
  // Analytics
  "/analytics": PERMISSIONS.VIEW_ORDERS, // Using VIEW_ORDERS as fallback
  
  // Settings
  "/settings/staff": [PERMISSIONS.VIEW_ADMINS, PERMISSIONS.CREATE_SUB_ADMIN], // Any of these
  "/settings/roles": PERMISSIONS.MANAGE_ROLE_PERMISSIONS,
  
  // Support
  "/support": null, // Visible by default for now
  
  // Audit Logs
  "/audit-logs": null, // Visible by default for now
};

// Helper function to check if a route requires any of the given permissions
export const getRoutePermissions = (routePath) => {
  return ROUTE_PERMISSIONS[routePath] || null;
};

// Helper function to check if user can access a route
export const canAccessRoute = (routePath, userPermissions, userRoles) => {
  // SUPER_ADMIN has access to everything
  if (userRoles?.includes(ROLES.SUPER_ADMIN)) {
    return true;
  }
  
  const requiredPerms = getRoutePermissions(routePath);
  
  // No permission required
  if (requiredPerms === null) {
    return true;
  }
  
  // Array of permissions (any of them)
  if (Array.isArray(requiredPerms)) {
    return requiredPerms.some(perm => userPermissions?.includes(perm));
  }
  
  // Single permission
  return userPermissions?.includes(requiredPerms);
};

