import { useContext } from "react";
import { AuthContext } from "../contexts/authContextConstants";

/**
 * Hook to access authentication context
 * @returns {Object} Auth context with user, roles, permissions, and auth methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

