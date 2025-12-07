import { useState, useEffect, useCallback } from "react";
import apiClient from "../services/api";
import { ENDPOINTS } from "../constants/endpoints";
import { ROLES } from "../constants/permissions";
import { AuthContext } from "./authContextConstants";

// Helper function to normalize roles to string array
// This ensures roles are always strings, handling both object and string formats
const normalizeRoles = (roles) => {
  if (!roles) return [];
  const roleArray = Array.isArray(roles) ? roles : [roles].filter(Boolean);
  return roleArray.map((role) => {
    if (typeof role === "string") return role;
    if (role && typeof role === "object" && role.code) return role.code;
    if (role && typeof role === "object" && role.roleCode) return role.roleCode;
    return String(role);
  });
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const storedToken = localStorage.getItem("authToken");
        const storedRefreshToken = localStorage.getItem("refreshToken");
        const storedRoles = localStorage.getItem("userRoles");
        const storedPermissions = localStorage.getItem("userPermissions");
        const storedUserId = localStorage.getItem("userId");

        if (storedToken) {
          setToken(storedToken);
          if (storedRefreshToken) setRefreshToken(storedRefreshToken);
          if (storedRoles) {
            try {
              const parsedRoles = JSON.parse(storedRoles);
              setRoles(normalizeRoles(parsedRoles));
            } catch (e) {
              console.error("Failed to parse stored roles:", e);
            }
          }
          if (storedPermissions) {
            try {
              setPermissions(JSON.parse(storedPermissions));
            } catch (e) {
              console.error("Failed to parse stored permissions:", e);
            }
          }
          if (storedUserId) {
            setUser({ id: storedUserId });
          }
        }
      } catch (error) {
        console.error("Error loading auth state:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAuthState();
  }, []);

  // Fetch permissions from backend if token exists
  useEffect(() => {
    const fetchPermissions = async () => {
      // Only super admin should hit the admin permissions endpoint
      const isSuperAdmin = roles.includes(ROLES.SUPER_ADMIN);
      if (!token || loading || !isSuperAdmin) return;

      try {
        const response = await apiClient.get(ENDPOINTS.ADMIN_PERMISSIONS);
        const data = response?.data?.data || response?.data || response;
        if (data?.permissions && Array.isArray(data.permissions)) {
          setPermissions(data.permissions);
          localStorage.setItem(
            "userPermissions",
            JSON.stringify(data.permissions)
          );
        }
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        // Avoid clearing auth on permission fetch failure
      }
    };

    fetchPermissions();
  }, [token, loading, roles]);

  // Login function
  const login = useCallback((loginData) => {
    const {
      token: newToken,
      refreshToken: newRefreshToken,
      roles: newRoles = [],
      permissions: newPermissions = [],
      user: userData,
    } = loginData;

    // Normalize roles to string array
    const normalizedRoles = normalizeRoles(newRoles);

    // Store in state
    setToken(newToken);
    if (newRefreshToken) setRefreshToken(newRefreshToken);
    setRoles(normalizedRoles);
    setPermissions(Array.isArray(newPermissions) ? newPermissions : []);
    setUser(userData || null);

    // Store in localStorage
    localStorage.setItem("authToken", newToken);
    if (newRefreshToken) {
      localStorage.setItem("refreshToken", newRefreshToken);
    }
    localStorage.setItem("userRoles", JSON.stringify(normalizedRoles));
    localStorage.setItem(
      "userPermissions",
      JSON.stringify(newPermissions || [])
    );
    if (userData?.id) {
      localStorage.setItem("userId", userData.id);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Try to call logout endpoint
      const currentRole = roles[0] || localStorage.getItem("userRole");
      // Normalize role to string for comparison
      const normalizedRole =
        typeof currentRole === "string"
          ? currentRole
          : currentRole?.code || currentRole?.roleCode || String(currentRole);
      const endpoint =
        normalizedRole === ROLES.SUPER_ADMIN
          ? ENDPOINTS.SUPER_ADMIN_LOGOUT
          : ENDPOINTS.STAFF_LOGOUT;
      await apiClient.post(endpoint);
    } catch (error) {
      // Ignore network/logout API failures on client-side logout
      console.warn("Logout API call failed:", error);
    } finally {
      // Clear state
      setUser(null);
      setRoles([]);
      setPermissions([]);
      setToken(null);
      setRefreshToken(null);

      // Clear localStorage
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userRoles");
      localStorage.removeItem("userPermissions");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole"); // Legacy key
    }
  }, [roles]);

  // Refresh permissions from backend
  const refreshPermissions = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiClient.get(ENDPOINTS.ADMIN_PERMISSIONS);
      const data = response?.data?.data || response?.data || response;
      if (data?.permissions && Array.isArray(data.permissions)) {
        setPermissions(data.permissions);
        localStorage.setItem(
          "userPermissions",
          JSON.stringify(data.permissions)
        );
        return data.permissions;
      }
    } catch (error) {
      console.error("Failed to refresh permissions:", error);
      throw error;
    }
  }, [token]);

  // Check if user has a specific role
  const hasRole = useCallback(
    (roleCode) => {
      if (!roleCode) return false;
      // Normalize roleCode to string
      const normalizedRoleCode =
        typeof roleCode === "string"
          ? roleCode
          : roleCode?.code || String(roleCode);
      // SUPER_ADMIN has all roles implicitly
      if (roles.includes(ROLES.SUPER_ADMIN)) return true;
      return roles.includes(normalizedRoleCode);
    },
    [roles]
  );

  // Check if user has a specific permission
  const hasPermission = useCallback(
    (permission) => {
      if (!permission) return false;
      // SUPER_ADMIN has all permissions implicitly
      if (roles.includes(ROLES.SUPER_ADMIN)) return true;
      return permissions.includes(permission);
    },
    [permissions, roles]
  );

  // Check if user has any of the given permissions
  const hasAnyPermission = useCallback(
    (permissionList) => {
      if (
        !permissionList ||
        !Array.isArray(permissionList) ||
        permissionList.length === 0
      ) {
        return false;
      }
      // SUPER_ADMIN has all permissions
      if (roles.includes(ROLES.SUPER_ADMIN)) return true;
      return permissionList.some((perm) => permissions.includes(perm));
    },
    [permissions, roles]
  );

  // Check if user has all of the given permissions
  const hasAllPermissions = useCallback(
    (permissionList) => {
      if (
        !permissionList ||
        !Array.isArray(permissionList) ||
        permissionList.length === 0
      ) {
        return false;
      }
      // SUPER_ADMIN has all permissions
      if (roles.includes(ROLES.SUPER_ADMIN)) return true;
      return permissionList.every((perm) => permissions.includes(perm));
    },
    [permissions, roles]
  );

  const value = {
    user,
    roles,
    permissions,
    token,
    refreshToken,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
    refreshPermissions,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
