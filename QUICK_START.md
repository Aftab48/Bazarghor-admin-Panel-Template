# Quick Start Guide

## Prerequisites

Make sure you have the following installed:
- Node.js (v18 or higher)
- pnpm (recommended) or npm

## Installation

1. **Install dependencies**

```bash
pnpm install
```

Or if you're using npm:

```bash
npm install
```

## Running the Application

### Development Mode

Start the development server with hot reload:

```bash
pnpm dev
```

The application will be available at: **http://localhost:5173**

### Production Build

Build the application for production:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

## Project Features Overview

### 🏠 Dashboard
- Access from the home page
- View key metrics: orders, revenue, vendors, customers
- Interactive charts showing trends
- Recent orders table

### 👥 User Management
Navigate through the sidebar to:
- **Customers** (`/users/customers`)
- **Vendors** (`/users/vendors`)
- **Delivery Agents** (`/users/delivery-agents`)

Actions available:
- ✅ Activate user
- ⛔ Deactivate user
- 🔒 Suspend user
- 🔑 Reset password
- ✏️ Edit details
- 🗑️ Delete user

### 🏪 Vendor Management (`/vendor-management`)
- View pending vendor applications
- Approve or reject vendors
- Monitor sales and inventory
- Suspend/unsuspend vendors

### 🚚 Delivery Agent Management (`/delivery-management`)
- Approve/reject agent applications
- View performance metrics
- Manage payouts

### 📦 Catalog Management
- **Categories** (`/catalog/categories`)
  - Add/edit/delete categories
  - Hierarchical structure support
  
- **Products** (`/catalog/products`)
  - Manage product listings
  - Set featured products
  - Filter by category and vendor

### 🛒 Order Management (`/orders`)
- View orders by status tabs
- Assign delivery agents
- Update order status
- Process refunds

### 💰 Payments & Transactions (`/transactions`)
- View all transactions
- Filter by type and status
- Export reports

### 🎁 Promotions
- **Banners** (`/promotions/banners`)
  - Create promotional banners
  - Schedule activation periods
  
- **Discount Codes** (`/promotions/discount-codes`)
  - Create discount codes
  - Set usage limits
  - Track redemptions

### 📊 Analytics & Reports (`/analytics`)
- Sales by vendor
- Sales by category
- Delivery performance
- Customer retention metrics

### ⚙️ Settings
- **Roles & Permissions** (`/settings/roles`)
  - Create admin roles
  - Assign permissions
  
- **Site Settings** (`/settings/site`)
  - Configure site details
  - Set tax rates and currency
  
- **Notifications** (`/settings/notifications`)
  - Manage email/SMS templates

### 🎫 Support Tickets (`/support`)
- View and respond to tickets
- Assign to admins
- Update status

### 📋 Audit Logs (`/audit-logs`)
- Track all admin activities
- Filter by admin, action, date
- Export logs

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# Force mock data (set to 'true' to always use mock data)
VITE_USE_MOCK_DATA=false
```

### API Integration

The admin panel is designed to work with a backend API. If the API is unavailable, it automatically falls back to mock data.

**API Endpoints** are configured in: `src/constants/endpoints.js`

**Mock Data** is generated in: `src/mock/mockData.js`

## Mock Data

The application comes with comprehensive mock data:
- 50 Customers
- 30 Vendors (5 pending approval)
- 25 Delivery Agents (3 pending approval)
- 9 Categories
- 100 Products
- 100 Orders
- 100 Transactions
- 50 Support Tickets
- 100 Audit Logs

## Customization

### Changing Theme Colors

Edit `src/App.jsx`:

```javascript
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#1890ff', // Change this
      borderRadius: 6,
    },
  }}
>
```

### Modifying Sidebar

Edit `src/components/layout/Sidebar.jsx`

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add menu item in `src/components/layout/Sidebar.jsx`

## Troubleshooting

### Port Already in Use

If port 5173 is already in use, you can specify a different port:

```bash
pnpm dev --port 3000
```

### Dependencies Issues

Clear node_modules and reinstall:

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Build Errors

Make sure all dependencies are installed and you're using Node.js v18+:

```bash
node --version
pnpm --version
```

## Additional Commands

```bash
# Run linter
pnpm lint

# Preview build locally
pnpm preview
```

## Need Help?

- Check the [README.md](./README.md) for detailed documentation
- Review the code examples in `src/pages/`
- Check mock data structure in `src/mock/mockData.js`

## Next Steps

1. ✅ Start the dev server
2. ✅ Explore the dashboard
3. ✅ Test all features with mock data
4. ✅ Configure API endpoints
5. ✅ Connect to your backend
6. ✅ Customize theme and branding
7. ✅ Deploy to production

Happy coding! 🚀

