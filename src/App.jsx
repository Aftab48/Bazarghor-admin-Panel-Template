import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ConfigProvider } from "antd";
import { AuthProvider } from "./contexts/AuthContext";
import MainLayout from "./components/layout/MainLayout";
import RequireAuth from "./components/layout/RequireAuth";
import RequireRole from "./components/layout/RequireRole";
import RequirePermission from "./components/layout/RequirePermission";
import Login from "./pages/login/Login";
import ForgotPassword from "./pages/login/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/users/UserManagement";
import CustomerList from "./pages/users/CustomerList";
import VendorList from "./pages/users/VendorList";
import DeliveryAgentList from "./pages/users/DeliveryAgentList";
import StoreManagement from "./pages/vendors/Store-Management";
import DeliveryAgentManagement from "./pages/delivery/DeliveryAgentManagement";
import CatalogManagement from "./pages/catalog/CatalogManagement";
import Categories from "./pages/catalog/Categories";
import Products from "./pages/catalog/Products";
import OrderManagement from "./pages/orders/OrderManagement";
import Transactions from "./pages/payments/Transactions";
import Banners from "./pages/promotions/Banners";
import DiscountCodes from "./pages/promotions/DiscountCodes";
import Reports from "./pages/analytics/Reports";
import RolesPermissions from "./pages/settings/RolesPermissions";
import SettingsManagement from "./pages/settings/SettingsManagement";
import AdminProfile from "./pages/profiles/AdminProfile";
import StaffProfile from "./pages/profiles/StaffProfile";
import Staff from "./pages/settings/Staff";
import SiteSettings from "./pages/settings/SiteSettings";
import NotificationTemplates from "./pages/settings/NotificationTemplates";
import Tickets from "./pages/support/Tickets";
import AuditLogs from "./pages/audit/AuditLogs";
import { PERMISSIONS } from "./constants/permissions";

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1890ff",
          borderRadius: 6,
        },
      }}
    >
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/login-staff" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <RequireAuth>
                  <MainLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Dashboard />} />

              {/* User Management */}
              <Route
                path="users"
                element={
                  <RequirePermission
                    requiredPermissions={[
                      PERMISSIONS.VIEW_CUSTOMERS,
                      PERMISSIONS.VIEW_VENDORS,
                      PERMISSIONS.VIEW_DELIVERY_PARTNERS,
                    ]}
                  >
                    <UserManagement />
                  </RequirePermission>
                }
              />
              <Route
                path="users/customers"
                element={
                  <RequirePermission
                    requiredPermissions={[PERMISSIONS.VIEW_CUSTOMERS]}
                  >
                    <CustomerList />
                  </RequirePermission>
                }
              />
              <Route
                path="users/vendors"
                element={
                  <RequirePermission
                    requiredPermissions={[PERMISSIONS.VIEW_VENDORS]}
                  >
                    <VendorList />
                  </RequirePermission>
                }
              />
              <Route
                path="users/delivery-agents"
                element={
                  <RequirePermission
                    requiredPermissions={[PERMISSIONS.VIEW_DELIVERY_PARTNERS]}
                  >
                    <DeliveryAgentList />
                  </RequirePermission>
                }
              />

              {/* Vendor Management */}
              <Route
                path="vendor-management"
                element={
                  <RequirePermission
                    requiredPermissions={[PERMISSIONS.VIEW_VENDORS]}
                  >
                    <StoreManagement />
                  </RequirePermission>
                }
              />

              {/* Delivery Management */}
              <Route
                path="delivery-management"
                element={
                  <RequirePermission
                    requiredPermissions={[PERMISSIONS.VIEW_DELIVERY_PARTNERS]}
                  >
                    <DeliveryAgentManagement />
                  </RequirePermission>
                }
              />

              {/* Catalog */}
              <Route
                path="catalog"
                element={
                  <RequirePermission
                    requiredPermissions={[PERMISSIONS.VIEW_PRODUCTS]}
                  >
                    <CatalogManagement />
                  </RequirePermission>
                }
              />
              <Route
                path="catalog/categories"
                element={
                  <RequirePermission
                    requiredPermissions={[PERMISSIONS.VIEW_PRODUCTS]}
                  >
                    <Categories />
                  </RequirePermission>
                }
              />
              <Route
                path="catalog/products"
                element={
                  <RequirePermission
                    requiredPermissions={[PERMISSIONS.VIEW_PRODUCTS]}
                  >
                    <Products />
                  </RequirePermission>
                }
              />

              {/* Orders */}
              <Route
                path="orders"
                element={
                  <RequirePermission
                    requiredPermissions={[PERMISSIONS.VIEW_ORDERS]}
                  >
                    <OrderManagement />
                  </RequirePermission>
                }
              />

              {/* Transactions */}
              <Route
                path="transactions"
                element={
                  <RequirePermission
                    requiredPermissions={[PERMISSIONS.VIEW_ORDERS]}
                  >
                    <Transactions />
                  </RequirePermission>
                }
              />

              {/* Promotions */}
              <Route
                path="promotions/banners"
                element={
                  <RequirePermission
                    requiredPermissions={[PERMISSIONS.VIEW_ORDERS]}
                  >
                    <Banners />
                  </RequirePermission>
                }
              />
              <Route
                path="promotions/discount-codes"
                element={
                  <RequirePermission
                    requiredPermissions={[PERMISSIONS.VIEW_ORDERS]}
                  >
                    <DiscountCodes />
                  </RequirePermission>
                }
              />

              {/* Analytics */}
              <Route
                path="analytics"
                element={
                  <RequirePermission
                    requiredPermissions={[PERMISSIONS.VIEW_ORDERS]}
                  >
                    <Reports />
                  </RequirePermission>
                }
              />

              {/* Profile */}
              <Route
                path="profile"
                element={
                  <RequireRole allowedRoles={["SUPER_ADMIN"]}>
                    <AdminProfile />
                  </RequireRole>
                }
              />
              <Route
                path="staff-profile"
                element={
                  <RequireRole allowedRoles={["ADMIN", "SUB_ADMIN"]}>
                    <StaffProfile />
                  </RequireRole>
                }
              />

              {/* Settings */}
              <Route
                path="settings"
                element={
                  <RequirePermission
                    requiredPermissions={[
                      PERMISSIONS.VIEW_ADMINS,
                      PERMISSIONS.CREATE_SUB_ADMIN,
                      PERMISSIONS.MANAGE_ROLE_PERMISSIONS,
                    ]}
                  >
                    <SettingsManagement />
                  </RequirePermission>
                }
              />
              <Route
                path="settings/staff"
                element={
                  <RequirePermission
                    requiredPermissions={[
                      PERMISSIONS.VIEW_ADMINS,
                      PERMISSIONS.CREATE_SUB_ADMIN,
                    ]}
                  >
                    <Staff />
                  </RequirePermission>
                }
              />
              <Route
                path="settings/roles"
                element={
                  <RequirePermission
                    requiredPermissions={[PERMISSIONS.MANAGE_ROLE_PERMISSIONS]}
                  >
                    <RolesPermissions />
                  </RequirePermission>
                }
              />
              <Route path="settings/site" element={<SiteSettings />} />
              <Route
                path="settings/notifications"
                element={<NotificationTemplates />}
              />

              {/* Support */}
              <Route path="support" element={<Tickets />} />

              {/* Audit Logs */}
              <Route path="audit-logs" element={<AuditLogs />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
