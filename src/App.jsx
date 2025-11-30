import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd";
import MainLayout from "./components/layout/MainLayout";
import RequireAuth from "./components/layout/RequireAuth";
import RequireRole from "./components/layout/RequireRole";
import AdminLogin from "./pages/login/Admin-Login";
import StaffLogin from "./pages/login/Staff-Login";
import ForgotPassword from "./pages/login/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import CustomerList from "./pages/users/CustomerList";
import VendorList from "./pages/users/VendorList";
import DeliveryAgentList from "./pages/users/DeliveryAgentList";
import VendorManagement from "./pages/vendors/VendorManagement";
import DeliveryAgentManagement from "./pages/delivery/DeliveryAgentManagement";
import Categories from "./pages/catalog/Categories";
import Products from "./pages/catalog/Products";
import OrderManagement from "./pages/orders/OrderManagement";
import Transactions from "./pages/payments/Transactions";
import Banners from "./pages/promotions/Banners";
import DiscountCodes from "./pages/promotions/DiscountCodes";
import Reports from "./pages/analytics/Reports";
import RolesPermissions from "./pages/settings/RolesPermissions";
import AdminProfile from "./pages/settings/AdminProfile";
import StaffProfile from "./pages/settings/StaffProfile";
import Staff from "./pages/settings/Staff";
import SiteSettings from "./pages/settings/SiteSettings";
import NotificationTemplates from "./pages/settings/NotificationTemplates";
import Tickets from "./pages/support/Tickets";
import AuditLogs from "./pages/audit/AuditLogs";

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
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/login-staff" element={<StaffLogin />} />
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
            <Route path="users/customers" element={<CustomerList />} />
            <Route path="users/vendors" element={<VendorList />} />
            <Route
              path="users/delivery-agents"
              element={<DeliveryAgentList />}
            />

            {/* Vendor Management */}
            <Route path="vendor-management" element={<VendorManagement />} />

            {/* Delivery Management */}
            <Route
              path="delivery-management"
              element={<DeliveryAgentManagement />}
            />

            {/* Catalog */}
            <Route path="catalog/categories" element={<Categories />} />
            <Route path="catalog/products" element={<Products />} />

            {/* Orders */}
            <Route path="orders" element={<OrderManagement />} />

            {/* Transactions */}
            <Route path="transactions" element={<Transactions />} />

            {/* Promotions */}
            <Route path="promotions/banners" element={<Banners />} />
            <Route
              path="promotions/discount-codes"
              element={<DiscountCodes />}
            />

            {/* Analytics */}
            <Route path="analytics" element={<Reports />} />

            {/* Settings */}
            <Route
              path="settings/profile"
              element={
                <RequireRole allowedRoles={["SUPER_ADMIN"]}>
                  <AdminProfile />
                </RequireRole>
              }
            />
            <Route
              path="settings/staff-profile"
              element={
                <RequireRole allowedRoles={["ADMIN", "SUB_ADMIN"]}>
                  <StaffProfile />
                </RequireRole>
              }
            />
            <Route path="settings/staff" element={<Staff />} />
            <Route path="settings/roles" element={<RolesPermissions />} />
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
    </ConfigProvider>
  );
}

export default App;
