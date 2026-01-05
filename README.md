# Bazarghor Admin Panel

A comprehensive admin panel for managing a marketplace platform with vendors, customers, Delivery Partners, orders, and more.

## Features

### 1. Dashboard

- Overview statistics (orders, revenue, vendors, customers, deliveries)
- Daily/Weekly/Monthly analytics with charts
- Revenue trends and active users visualization
- Recent orders table

### 2. User Management

- **Customers**: View, add, edit, delete, activate, deactivate, suspend
- **Vendors**: Manage vendor accounts with sales and inventory stats
- **Delivery Partners**: Track performance, ratings, and earnings
- Password reset functionality
- User status management (Active, Inactive, Suspended)

### 3. Vendor Management

- Approve or reject vendor registrations
- Monitor sales & inventory per vendor
- Suspend/unsuspend vendors
- View vendor performance metrics

### 4. Delivery Agent Management

- Approve/reject delivery agent applications
- Track performance (orders delivered, ratings)
- Manage payouts
- View agent status and vehicle information

### 5. Category & Product Management

- Hierarchical category management
- Add/edit/delete categories
- Product listing with vendor filter
- Set featured products
- Manage product inventory and pricing

### 6. Order Management

- View orders by status (Pending, Ongoing, Completed, Cancelled)
- Assign/reassign Delivery Partners
- Update order status
- Handle refunds and disputes
- Export orders

### 7. Payments & Transactions

- View all transactions
- Filter by type (Order Payment, Vendor Payout, Refund, Commission)
- Monitor commissions and service fees
- Export payment reports

### 8. Promotions & Banners

- Manage homepage banners with scheduling
- Create and manage discount codes
- Set usage limits and validity periods
- Track promotion performance

### 9. Analytics & Reports

- Sales reports by vendor and category
- Delivery performance metrics
- Customer retention data
- Visual charts and graphs
- Export functionality

### 10. System Settings

- Roles & Permissions management
- Create sub-admins
- Update site settings (logo, tax rates, currency)
- Manage notification templates (email/SMS/push)

### 11. Support Tickets

- View and respond to support tickets
- Assign tickets to admins
- Update ticket status
- Conversation threads

### 12. Audit Logs

- Track all admin activities
- Filter by admin, action type, and date
- Export audit logs
- Security and accountability

## Tech Stack

- **Frontend Framework**: React 19 with Vite
- **Compiler**: SWC (Speedy Web Compiler)
- **UI Components**: Ant Design 5
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM 7
- **Charts**: Recharts 3
- **HTTP Client**: Axios
- **Date Handling**: Day.js
- **Utilities**: Lodash, clsx

## Project Structure

```
bazarghor-admin/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx          # Sidebar navigation
│   │   │   ├── Header.jsx           # Top header with breadcrumbs
│   │   │   └── MainLayout.jsx       # Main layout wrapper
│   │   └── common/
│   │       ├── StatCard.jsx         # Reusable stat card
│   │       └── StatusTag.jsx        # Status tag component
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── users/                   # User management pages
│   │   ├── vendors/                 # Vendor management
│   │   ├── delivery/                # Delivery agent management
│   │   ├── catalog/                 # Categories & Products
│   │   ├── orders/                  # Order management
│   │   ├── payments/                # Transactions
│   │   ├── promotions/              # Banners & Discount codes
│   │   ├── analytics/               # Reports
│   │   ├── settings/                # System settings
│   │   ├── support/                 # Support tickets
│   │   └── audit/                   # Audit logs
│   ├── services/
│   │   └── api.js                   # API service with fallback
│   ├── mock/
│   │   └── mockData.js              # Mock data generators
│   ├── constants/
│   │   ├── endpoints.js             # API endpoints
│   │   └── statuses.js              # Status constants
│   ├── App.jsx                      # Main app with routes
│   ├── main.jsx                     # Entry point
│   └── index.css                    # Global styles
├── package.json
├── vite.config.js
└── README.md
```

## API Integration

The admin panel is designed to work with a backend API. It includes:

- **Automatic Fallback**: If the backend API is unavailable, the app automatically falls back to mock data
- **Environment Variables**: Configure API endpoint via `.env` file
- **Axios Interceptors**: Handles authentication tokens and error responses

### Environment Variables

Create a `.env` file in the root directory:

**For Development:**
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_USE_MOCK_DATA=false
```

**For Production:**
```env
VITE_API_BASE_URL=https://your-backend-api-domain.com/api
VITE_USE_MOCK_DATA=false
```

> **Important**: When deploying to production (e.g., https://admin.bazarghorr.com), you **must** set `VITE_API_BASE_URL` to your production backend API URL. The default value points to `http://localhost:5000/api`, which will not work in production.

**Setting Environment Variables:**
- For Vite projects, environment variables must be prefixed with `VITE_` to be accessible in the browser
- These variables are embedded at build time, so you need to rebuild after changing them
- Most hosting platforms (Vercel, Netlify, etc.) allow you to set environment variables in their dashboard

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Build for Production

1. **Set your production API URL** in `.env`:
   ```env
   VITE_API_BASE_URL=https://your-backend-api-domain.com/api
   ```

2. Build the project:
   ```bash
   pnpm build
   ```

3. The production build will be in the `dist/` folder

### Preview Production Build

```bash
pnpm preview
```

### Production Deployment Checklist

- [ ] Set `VITE_API_BASE_URL` to your production backend API URL
- [ ] Ensure your backend CORS configuration includes your admin panel domain (e.g., `https://admin.bazarghorr.com`)
- [ ] Rebuild the application after setting environment variables
- [ ] Verify API connectivity from the deployed admin panel

## Features Implementation

### User Actions

Each user (customer, vendor, delivery agent) can be:

- ✅ **Activated**: Enable the account
- ✅ **Deactivated**: Disable the account
- ✅ **Suspended**: Temporarily suspend the account
- 🔐 Password reset via email

### Order Workflow

1. View orders by status
2. Assign delivery agent
3. Update order status through the lifecycle
4. Handle refunds if needed

### Vendor Approval Workflow

1. View pending vendor registrations
2. Review vendor details
3. Approve or reject application
4. Monitor approved vendors

### Promotion Management

- Create time-bound banners
- Generate discount codes with usage limits
- Track promotion performance

## Mock Data

The application includes comprehensive mock data for:

- 50 customers
- 30 vendors (5 pending approval)
- 25 Delivery Partners (3 pending approval)
- 9 categories
- 100 products
- 100 orders
- 100 transactions
- Support tickets
- Audit logs

## Responsive Design

The admin panel is fully responsive and works on:

- 🖥️ Desktop
- 💻 Laptop
- 📱 Tablet
- 📱 Mobile (with collapsible sidebar)

## Security Features

- Role-based access control (RBAC)
- Audit logging for all admin actions
- IP tracking
- Session management (ready for JWT)

## Future Enhancements

- [ ] JWT Authentication
- [ ] Real-time notifications
- [ ] Advanced analytics with filters
- [ ] Bulk operations
- [ ] Email/SMS integration
- [ ] File upload for products/banners
- [ ] Multi-language support
- [ ] Dark mode

## License

MIT License

## Support

For support, email support@bazarghor.com
