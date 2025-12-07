import { useAuth } from "./useAuth";
import {
  getRoutePermissions,
  canAccessRoute,
  PERMISSIONS,
  ROLES,
} from "../constants/permissions";

/**
 * Hook for permission checking utilities
 * @returns {Object} Permission checking methods
 */
export const usePermissions = () => {
  const { permissions, roles, hasPermission: authHasPermission } = useAuth();

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission code to check
   * @returns {boolean}
   */
  const hasPermission = (permission) => {
    if (!permission) return false;

    // Block catalog access for sub-admins regardless of backend permission payload
    const isSubAdminOnly =
      roles?.includes(ROLES.SUB_ADMIN) &&
      !roles?.includes(ROLES.ADMIN) &&
      !roles?.includes(ROLES.SUPER_ADMIN);
    if (isSubAdminOnly && permission === PERMISSIONS.VIEW_PRODUCTS) {
      return false;
    }

    return authHasPermission(permission);
  };

  /**
   * Check if user has any of the given permissions
   * @param {string[]} permissionList - Array of permission codes
   * @returns {boolean}
   */
  const hasAnyPermission = (permissionList) => {
    if (
      !permissionList ||
      !Array.isArray(permissionList) ||
      permissionList.length === 0
    ) {
      return false;
    }
    return permissionList.some((perm) => hasPermission(perm));
  };

  /**
   * Check if user has all of the given permissions
   * @param {string[]} permissionList - Array of permission codes
   * @returns {boolean}
   */
  const hasAllPermissions = (permissionList) => {
    if (
      !permissionList ||
      !Array.isArray(permissionList) ||
      permissionList.length === 0
    ) {
      return false;
    }
    return permissionList.every((perm) => hasPermission(perm));
  };

  /**
   * Check if user can access a specific route
   * @param {string} routePath - Route path to check
   * @returns {boolean}
   */
  const canAccessRoutePath = (routePath) => {
    return canAccessRoute(routePath, permissions, roles);
  };

  /**
   * Get required permissions for a route
   * @param {string} routePath - Route path
   * @returns {string|string[]|null} Required permission(s) or null
   */
  const getRoutePermissionsForPath = (routePath) => {
    return getRoutePermissions(routePath);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute: canAccessRoutePath,
    getRoutePermissions: getRoutePermissionsForPath,
  };
};
