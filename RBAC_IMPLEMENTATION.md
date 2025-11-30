# RBAC Implementation Documentation

## Overview

This document describes the Role-Based Access Control (RBAC) implementation in the admin frontend. The system integrates with the backend permission system to provide granular access control based on user roles and permissions.

## Architecture

### Core Components

1. **AuthContext** (`src/contexts/AuthContext.jsx`)
   - Centralized authentication state management
   - Manages user data, roles, permissions, and tokens
   - Persists state to localStorage
   - Auto-fetches permissions from backend on mount

2. **Permission Constants** (`src/constants/permissions.js`)
   - Mirrors backend permission constants
   - Defines route-to-permission mappings
   - Provides helper functions for permission checking

3. **Custom Hooks**
   - `useAuth()` - Access authentication context
   - `usePermissions()` - Permission checking utilities

4. **Route Protection Components**
   - `RequireAuth` - Ensures user is authenticated
   - `RequireRole` - Checks user has required role(s)
   - `RequirePermission` - Checks user has required permission(s)

## How It Works

### 1. Authentication Flow

#### Login Process

1. User submits login form (Admin-Login or Staff-Login)
2. Backend validates credentials and returns:
   - `token` - JWT authentication token
   - `refreshToken` - Token for refreshing session
   - `roles` - Array of user roles (e.g., ["SUPER_ADMIN"] or ["ADMIN"])
   - `permissions` - Array of permission strings (optional, can be fetched separately)
   - User data (id, name, email, etc.)

3. Login component calls `AuthContext.login()` with:
   ```javascript
   {
     token: "jwt_token_here",
     refreshToken: "refresh_token_here",
     roles: ["SUPER_ADMIN"], // or ["ADMIN"], ["SUB_ADMIN"]
     permissions: ["view_admins", "create_admin", ...],
     user: { id: "user_id" }
   }
   ```

4. AuthContext:
   - Stores data in state
   - Persists to localStorage:
     - `authToken`
     - `refreshToken`
     - `userRoles` (JSON array)
     - `userPermissions` (JSON array)
     - `userId`

5. If permissions not in login response, AuthContext automatically fetches from `/admin/permissions` endpoint

#### Logout Process

1. User clicks logout
2. `AuthContext.logout()` is called
3. Backend logout endpoint is called (if available)
4. All auth state is cleared from memory and localStorage
5. User is redirected to appropriate login page

### 2. Permission System

#### Permission Structure

Permissions are string constants matching backend:
- `view_admins`, `create_admin`, `update_admin`, `delete_admin`
- `view_vendors`, `create_vendor`, `update_vendor`, `delete_vendor`
- `view_delivery_partners`, `create_delivery_partner`, etc.
- `view_customers`, `create_customer`, etc.
- `view_products`, `create_product`, `update_product`, `delete_product`
- `view_orders`, `manage_orders`
- `manage_role_permissions`
- And more...

#### Permission Checking

**SUPER_ADMIN Special Case:**
- SUPER_ADMIN has implicit access to ALL permissions
- No need to check individual permissions for SUPER_ADMIN

**Regular Permission Check:**
```javascript
const { hasPermission } = useAuth();
if (hasPermission("view_products")) {
  // User can view products
}
```

**Multiple Permissions (Any):**
```javascript
const { hasAnyPermission } = useAuth();
if (hasAnyPermission(["view_customers", "view_vendors"])) {
  // User has at least one of these permissions
}
```

**Multiple Permissions (All):**
```javascript
const { hasAllPermissions } = useAuth();
if (hasAllPermissions(["view_products", "create_product"])) {
  // User has all of these permissions
}
```

### 3. Role System

#### Roles

- `SUPER_ADMIN` - Full system access
- `ADMIN` - Administrative access with specific permissions
- `SUB_ADMIN` - Limited administrative access

#### Role Checking

```javascript
const { hasRole } = useAuth();
if (hasRole("SUPER_ADMIN")) {
  // User is super admin
}
```

**Multiple Roles:**
Users can have multiple roles (stored as array). The system checks if user has ANY of the required roles:

```javascript
<RequireRole allowedRoles={["ADMIN", "SUB_ADMIN"]}>
  {/* Accessible if user has ADMIN OR SUB_ADMIN role */}
</RequireRole>
```

### 4. Menu Filtering

The Sidebar component automatically filters menu items based on user permissions:

**How it works:**
1. Sidebar uses `useAuth()` and `usePermissions()` hooks
2. Menu items are filtered using `useMemo` based on current permissions
3. Only menu items the user has permission for are displayed

**Permission Mappings:**
- Dashboard: Always visible if authenticated
- User Management: Visible if user has VIEW_CUSTOMERS OR VIEW_VENDORS OR VIEW_DELIVERY_PARTNERS
- Customers: Requires VIEW_CUSTOMERS
- Vendors: Requires VIEW_VENDORS
- Delivery Agents: Requires VIEW_DELIVERY_PARTNERS
- Catalog/Products: Requires VIEW_PRODUCTS
- Orders: Requires VIEW_ORDERS
- Settings/Staff: Requires VIEW_ADMINS OR CREATE_SUB_ADMIN
- Settings/Roles: Requires MANAGE_ROLE_PERMISSIONS

### 5. Route Protection

Routes are protected at three levels:

#### Level 1: Authentication (RequireAuth)
```javascript
<Route path="/" element={
  <RequireAuth>
    <MainLayout />
  </RequireAuth>
}>
```
- Checks if user is authenticated
- Redirects to login if not authenticated
- Shows loading spinner while checking

#### Level 2: Role-Based (RequireRole)
```javascript
<Route path="settings/profile" element={
  <RequireRole allowedRoles={["SUPER_ADMIN"]}>
    <AdminProfile />
  </RequireRole>
}>
```
- Checks if user has any of the allowed roles
- Shows 403 page if role check fails

#### Level 3: Permission-Based (RequirePermission)
```javascript
<Route path="users/customers" element={
  <RequirePermission requiredPermissions={[PERMISSIONS.VIEW_CUSTOMERS]}>
    <CustomerList />
  </RequirePermission>
}>
```
- Checks if user has required permission(s)
- Supports `requireAll` prop for requiring all permissions
- Shows 403 page if permission check fails

### 6. Permission Fetching

**Automatic Fetching:**
- On app mount, if token exists, permissions are automatically fetched from `/admin/permissions`
- This ensures permissions are always up-to-date

**Manual Refresh:**
```javascript
const { refreshPermissions } = useAuth();
await refreshPermissions(); // Fetches latest permissions from backend
```

### 7. Error Handling

**401 Unauthorized:**
- Auth state is cleared
- User is redirected to login page
- Error message is displayed

**403 Forbidden:**
- Error message is displayed
- User stays on current page (no redirect)
- Access denied page is shown for protected routes

## Testing Steps

### Prerequisites

1. Backend server running on `http://localhost:5000`
2. Admin frontend running on `http://localhost:5173` (or configured port)
3. Database seeded with roles and permissions
4. Test users with different roles:
   - SUPER_ADMIN user
   - ADMIN user
   - SUB_ADMIN user

### Test 1: SUPER_ADMIN Login and Full Access

**Steps:**
1. Navigate to `/login`
2. Login with SUPER_ADMIN credentials
3. Verify:
   - ✅ Redirected to dashboard
   - ✅ All menu items visible in sidebar
   - ✅ Can access all routes
   - ✅ Header shows "SUPER_ADMIN" role tag
   - ✅ Can access `/settings/staff`
   - ✅ Can access `/settings/roles`
   - ✅ Can access all user management pages
   - ✅ Can access all catalog pages
   - ✅ Can access orders page

**Expected Result:** SUPER_ADMIN has full access to everything.

### Test 2: ADMIN Login and Permission-Based Access

**Steps:**
1. Navigate to `/login-staff`
2. Login with ADMIN credentials
3. Verify:
   - ✅ Redirected to dashboard
   - ✅ Menu items filtered based on permissions
   - ✅ Can access pages based on permissions
   - ✅ Cannot access pages without permissions
   - ✅ Header shows "ADMIN" role tag

**Specific Checks:**
- ✅ Can access `/users/customers` (if has VIEW_CUSTOMERS)
- ✅ Can access `/users/vendors` (if has VIEW_VENDORS)
- ✅ Can access `/catalog/products` (if has VIEW_PRODUCTS)
- ✅ Can access `/orders` (if has VIEW_ORDERS)
- ✅ Can access `/settings/staff` (if has VIEW_ADMINS or CREATE_SUB_ADMIN)
- ❌ Cannot access `/settings/roles` (unless has MANAGE_ROLE_PERMISSIONS)
- ❌ Cannot access routes without required permissions (shows 403 page)

**Expected Result:** ADMIN sees only menu items and can access only routes they have permissions for.

### Test 3: SUB_ADMIN Login and Limited Access

**Steps:**
1. Navigate to `/login-staff`
2. Login with SUB_ADMIN credentials
3. Verify:
   - ✅ Redirected to dashboard
   - ✅ Limited menu items visible
   - ✅ Can only access permitted routes
   - ✅ Header shows "SUB_ADMIN" role tag

**Specific Checks:**
- ✅ Can access `/users/vendors` (if has VIEW_VENDORS)
- ✅ Can access `/catalog/products` (if has VIEW_PRODUCTS)
- ✅ Can access `/orders` (if has VIEW_ORDERS)
- ❌ Cannot access `/users/customers` (unless has VIEW_CUSTOMERS)
- ❌ Cannot access `/settings/staff`
- ❌ Cannot access `/settings/roles`

**Expected Result:** SUB_ADMIN has very limited access based on their permissions.

### Test 4: Menu Filtering

**Steps:**
1. Login as ADMIN or SUB_ADMIN
2. Check sidebar menu items
3. Verify:
   - ✅ Only menu items with required permissions are visible
   - ✅ Menu items without permissions are hidden
   - ✅ Submenu items are also filtered

**Test Cases:**
- User without VIEW_CUSTOMERS should not see "Customers" in User Management
- User without VIEW_VENDORS should not see "Vendors" in User Management
- User without VIEW_PRODUCTS should not see "Catalog" menu
- User without VIEW_ORDERS should not see "Order Management"
- User without VIEW_ADMINS and CREATE_SUB_ADMIN should not see "Settings/Staff"

**Expected Result:** Menu dynamically filters based on user permissions.

### Test 5: Route Protection

**Steps:**
1. Login as ADMIN or SUB_ADMIN
2. Try to access protected routes directly via URL:
   - `/users/customers` (requires VIEW_CUSTOMERS)
   - `/settings/roles` (requires MANAGE_ROLE_PERMISSIONS)
   - `/catalog/products` (requires VIEW_PRODUCTS)
3. Verify:
   - ✅ Routes with permissions: Page loads normally
   - ❌ Routes without permissions: Shows 403 "Access Denied" page

**Expected Result:** Direct URL access is blocked if user lacks required permissions.

### Test 6: Permission Fetching

**Steps:**
1. Login as any user
2. Open browser DevTools → Network tab
3. Verify:
   - ✅ On page load, request to `/admin/permissions` is made
   - ✅ Response contains array of permissions
   - ✅ Permissions are stored in localStorage as `userPermissions`

**Manual Test:**
```javascript
// In browser console
JSON.parse(localStorage.getItem('userPermissions'))
// Should return array of permission strings
```

**Expected Result:** Permissions are automatically fetched and stored.

### Test 7: Logout Functionality

**Steps:**
1. Login as any user
2. Click user menu in header
3. Click "Logout"
4. Verify:
   - ✅ Redirected to login page
   - ✅ localStorage cleared (check DevTools → Application → Local Storage)
   - ✅ Auth state cleared
   - ✅ Cannot access protected routes

**Check localStorage:**
- `authToken` should be removed
- `refreshToken` should be removed
- `userRoles` should be removed
- `userPermissions` should be removed
- `userId` should be removed

**Expected Result:** Complete logout with all auth data cleared.

### Test 8: Token Expiration (401 Handling)

**Steps:**
1. Login as any user
2. Manually expire token (or wait for expiration)
3. Try to access any protected route
4. Verify:
   - ✅ 401 error is caught
   - ✅ Auth state is cleared
   - ✅ Redirected to login page
   - ✅ Error message displayed: "Unauthorized. Please login again."

**Expected Result:** Expired tokens trigger automatic logout and redirect.

### Test 9: Permission Updates

**Steps:**
1. Login as ADMIN
2. Note current permissions and menu items
3. In backend, update ADMIN role permissions (add/remove permissions)
4. In frontend, refresh page or call `refreshPermissions()`
5. Verify:
   - ✅ New permissions are fetched
   - ✅ Menu items update based on new permissions
   - ✅ Route access updates accordingly

**Expected Result:** Permission changes are reflected without re-login.

### Test 10: Multiple Roles Support

**Steps:**
1. Create a user with multiple roles (e.g., ADMIN and SUB_ADMIN)
2. Login with that user
3. Verify:
   - ✅ Header shows all role tags
   - ✅ Has access to permissions from all roles
   - ✅ Can access routes allowed by any role

**Expected Result:** Users with multiple roles have aggregated permissions.

### Test 11: RequirePermission Component Options

**Steps:**
1. Test routes with different permission requirements:

**Single Permission:**
```javascript
<RequirePermission requiredPermissions={[PERMISSIONS.VIEW_CUSTOMERS]}>
  {/* Requires VIEW_CUSTOMERS */}
</RequirePermission>
```

**Multiple Permissions (Any):**
```javascript
<RequirePermission 
  requiredPermissions={[PERMISSIONS.VIEW_ADMINS, PERMISSIONS.CREATE_SUB_ADMIN]}
  requireAll={false} // Default: any permission
>
  {/* Requires VIEW_ADMINS OR CREATE_SUB_ADMIN */}
</RequirePermission>
```

**Multiple Permissions (All):**
```javascript
<RequirePermission 
  requiredPermissions={[PERMISSIONS.VIEW_PRODUCTS, PERMISSIONS.CREATE_PRODUCT]}
  requireAll={true}
>
  {/* Requires VIEW_PRODUCTS AND CREATE_PRODUCT */}
</RequirePermission>
```

**Expected Result:** Component correctly enforces permission requirements.

### Test 12: Loading States

**Steps:**
1. Clear localStorage
2. Navigate to protected route
3. Verify:
   - ✅ Loading spinner shown while checking auth
   - ✅ No flash of unauthorized content
   - ✅ Smooth transition to login or content

**Expected Result:** Proper loading states prevent UI flicker.

## Common Issues and Troubleshooting

### Issue: Permissions not loading

**Symptoms:**
- Menu items not filtering
- Routes accessible without permissions

**Solutions:**
1. Check browser console for errors
2. Verify `/admin/permissions` endpoint is accessible
3. Check network tab for failed requests
4. Verify token is valid
5. Check localStorage for `userPermissions`

### Issue: Menu items not updating after permission change

**Symptoms:**
- Menu shows old permissions
- New permissions not reflected

**Solutions:**
1. Refresh page (permissions auto-fetch on mount)
2. Call `refreshPermissions()` manually
3. Check backend role permissions are updated
4. Verify permissions are in response from `/admin/permissions`

### Issue: 401 errors on every request

**Symptoms:**
- Constant redirects to login
- Token appears invalid

**Solutions:**
1. Check token format in localStorage
2. Verify backend JWT secret matches
3. Check token expiration time
4. Verify Authorization header format: `Bearer <token>`

### Issue: SUPER_ADMIN cannot access routes

**Symptoms:**
- SUPER_ADMIN sees 403 pages
- Permission checks failing for SUPER_ADMIN

**Solutions:**
1. Verify SUPER_ADMIN role is in `roles` array
2. Check `hasPermission` function handles SUPER_ADMIN correctly
3. Verify role constant matches: `ROLES.SUPER_ADMIN === "SUPER_ADMIN"`

## API Endpoints Used

- `POST /admin/login` - Super admin login
- `POST /staff/login` - Staff (admin/sub-admin) login
- `GET /admin/permissions` - Fetch current user permissions
- `POST /admin/logout` - Super admin logout
- `POST /staff/logout` - Staff logout

## LocalStorage Keys

- `authToken` - JWT authentication token
- `refreshToken` - Refresh token for session renewal
- `userRoles` - JSON array of user roles
- `userPermissions` - JSON array of user permissions
- `userId` - User ID
- `userRole` - Legacy single role (still checked for compatibility)

## Best Practices

1. **Always use hooks for permission checks:**
   ```javascript
   // ✅ Good
   const { hasPermission } = useAuth();
   if (hasPermission(PERMISSIONS.VIEW_PRODUCTS)) { ... }
   
   // ❌ Bad
   const perms = JSON.parse(localStorage.getItem('userPermissions'));
   if (perms.includes('view_products')) { ... }
   ```

2. **Use RequirePermission for route protection:**
   ```javascript
   // ✅ Good
   <RequirePermission requiredPermissions={[PERMISSIONS.VIEW_CUSTOMERS]}>
     <CustomerList />
   </RequirePermission>
   ```

3. **Check permissions before showing UI elements:**
   ```javascript
   const { hasPermission } = useAuth();
   {hasPermission(PERMISSIONS.CREATE_PRODUCT) && (
     <Button>Create Product</Button>
   )}
   ```

4. **Let menu filtering happen automatically:**
   - Don't manually hide/show menu items
   - Sidebar automatically filters based on permissions

## Future Enhancements

- [ ] Permission caching with TTL
- [ ] Real-time permission updates via WebSocket
- [ ] Permission-based button/action filtering in pages
- [ ] Audit log for permission checks
- [ ] Permission testing utilities
- [ ] Role hierarchy support

## Conclusion

The RBAC system provides comprehensive access control through:
- Centralized authentication state
- Permission-based route protection
- Dynamic menu filtering
- Role-based access control
- Automatic permission synchronization

All components work together to ensure users only see and can access what they're permitted to, providing a secure and user-friendly admin interface.

