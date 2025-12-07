import dayjs from "dayjs";
import {
  USER_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  TICKET_STATUS,
  TICKET_PRIORITY,
} from "../constants/statuses";

// Helper function to generate random data
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[randomInt(0, arr.length - 1)];
const randomBoolean = () => Math.random() > 0.5;

// Generate mock customers
export const generateCustomers = (count = 50) => {
  const customers = [];
  const names = [
    "John Doe",
    "Jane Smith",
    "Mike Johnson",
    "Sarah Williams",
    "David Brown",
    "Emily Davis",
    "Chris Wilson",
    "Lisa Anderson",
  ];

  for (let i = 1; i <= count; i++) {
    customers.push({
      id: i,
      name: randomItem(names),
      email: `customer${i}@example.com`,
      phone: `+1-555-${String(randomInt(1000, 9999))}-${String(
        randomInt(1000, 9999)
      )}`,
      status: randomItem([
        USER_STATUS.ACTIVE,
        USER_STATUS.INACTIVE,
        USER_STATUS.SUSPENDED,
      ]),
      totalOrders: randomInt(0, 50),
      totalSpent: randomInt(100, 5000),
      joinedDate: dayjs()
        .subtract(randomInt(1, 365), "days")
        .format("YYYY-MM-DD"),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
    });
  }
  return customers;
};

// Generate mock vendors
export const generateVendors = (count = 30) => {
  const vendors = [];
  const businessNames = [
    "Fresh Market",
    "Tech Store",
    "Fashion Hub",
    "Home Decor",
    "Sports World",
    "Beauty Shop",
    "Book Corner",
    "Pet Paradise",
  ];

  for (let i = 1; i <= count; i++) {
    const isPending = i <= 10; // More pending vendors
    vendors.push({
      id: i,
      businessName: `${randomItem(businessNames)} ${i}`,
      ownerName: `Owner ${i}`,
      email: `vendor${i}@example.com`,
      phone: `+1-555-${String(randomInt(1000, 9999))}-${String(
        randomInt(1000, 9999)
      )}`,
      status: isPending
        ? USER_STATUS.PENDING
        : randomItem([
            USER_STATUS.ACTIVE,
            USER_STATUS.INACTIVE,
            USER_STATUS.SUSPENDED,
          ]),
      totalSales: randomInt(1000, 50000),
      commission: randomInt(5, 20),
      productsCount: randomInt(5, 200),
      rating: (randomInt(30, 50) / 10).toFixed(1),
      joinedDate: dayjs()
        .subtract(randomInt(1, 730), "days")
        .format("YYYY-MM-DD"),
      address: `${randomInt(100, 999)} Main St, City ${i}`,
      logo: `https://api.dicebear.com/7.x/initials/svg?seed=${i}`,
    });
  }
  return vendors;
};

// Generate mock Delivery Partners
export const generateDeliveryAgents = (count = 25) => {
  const agents = [];
  const names = [
    "Agent Smith",
    "Agent Brown",
    "Agent Wilson",
    "Agent Davis",
    "Agent Taylor",
    "Agent Moore",
  ];

  for (let i = 1; i <= count; i++) {
    const isPending = i <= 8; // More pending agents
    agents.push({
      id: i,
      name: `${randomItem(names)} ${i}`,
      email: `agent${i}@example.com`,
      phone: `+1-555-${String(randomInt(1000, 9999))}-${String(
        randomInt(1000, 9999)
      )}`,
      status: isPending
        ? USER_STATUS.PENDING
        : randomItem([
            USER_STATUS.ACTIVE,
            USER_STATUS.INACTIVE,
            USER_STATUS.SUSPENDED,
          ]),
      ordersDelivered: randomInt(10, 500),
      rating: (randomInt(35, 50) / 10).toFixed(1),
      earnings: randomInt(500, 10000),
      vehicleType: randomItem(["Bike", "Scooter", "Car", "Van"]),
      licenseNumber: `DL-${randomInt(10000, 99999)}`,
      joinedDate: dayjs()
        .subtract(randomInt(1, 365), "days")
        .format("YYYY-MM-DD"),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=agent${i}`,
    });
  }
  return agents;
};

// Generate mock categories
export const generateCategories = () => {
  return [
    {
      id: 1,
      name: "Electronics",
      slug: "electronics",
      productsCount: 120,
      icon: "laptop",
      parentId: null,
    },
    {
      id: 2,
      name: "Fashion",
      slug: "fashion",
      productsCount: 250,
      icon: "shopping",
      parentId: null,
    },
    {
      id: 3,
      name: "Home & Garden",
      slug: "home-garden",
      productsCount: 180,
      icon: "home",
      parentId: null,
    },
    {
      id: 4,
      name: "Sports",
      slug: "sports",
      productsCount: 90,
      icon: "trophy",
      parentId: null,
    },
    {
      id: 5,
      name: "Books",
      slug: "books",
      productsCount: 150,
      icon: "book",
      parentId: null,
    },
    {
      id: 6,
      name: "Smartphones",
      slug: "smartphones",
      productsCount: 45,
      icon: "mobile",
      parentId: 1,
    },
    {
      id: 7,
      name: "Laptops",
      slug: "laptops",
      productsCount: 35,
      icon: "laptop",
      parentId: 1,
    },
    {
      id: 8,
      name: "Men",
      slug: "men",
      productsCount: 120,
      icon: "man",
      parentId: 2,
    },
    {
      id: 9,
      name: "Women",
      slug: "women",
      productsCount: 130,
      icon: "woman",
      parentId: 2,
    },
  ];
};

// Generate mock products
export const generateProducts = (count = 100) => {
  const products = [];
  const productNames = [
    "Wireless Headphones",
    "Smart Watch",
    "Laptop",
    "T-Shirt",
    "Jeans",
    "Running Shoes",
    "Coffee Maker",
    "Book",
    "Backpack",
  ];
  const vendors = generateVendors(10);

  for (let i = 1; i <= count; i++) {
    products.push({
      id: i,
      name: `${randomItem(productNames)} ${i}`,
      sku: `SKU-${String(i).padStart(5, "0")}`,
      price: randomInt(10, 500),
      stock: randomInt(0, 200),
      categoryId: randomInt(1, 9),
      vendorId: randomItem(vendors).id,
      vendorName: randomItem(vendors).businessName,
      isFeatured: randomBoolean(),
      isActive: randomBoolean(),
      rating: (randomInt(30, 50) / 10).toFixed(1),
      reviewsCount: randomInt(0, 100),
      image: `https://picsum.photos/seed/${i}/200/200`,
      createdAt: dayjs()
        .subtract(randomInt(1, 180), "days")
        .format("YYYY-MM-DD"),
    });
  }
  return products;
};

// Generate mock orders
export const generateOrders = (count = 100) => {
  const orders = [];
  const customers = generateCustomers(20);
  const vendors = generateVendors(10);
  const agents = generateDeliveryAgents(10);

  for (let i = 1; i <= count; i++) {
    const customer = randomItem(customers);
    const vendor = randomItem(vendors);
    const agent = randomItem(agents);
    const status = randomItem(Object.values(ORDER_STATUS));

    orders.push({
      id: i,
      orderNumber: `ORD-${String(i).padStart(6, "0")}`,
      customerId: customer.id,
      customerName: customer.name,
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      agentId: status !== ORDER_STATUS.PENDING ? agent.id : null,
      agentName: status !== ORDER_STATUS.PENDING ? agent.name : null,
      status,
      total: randomInt(20, 500),
      items: randomInt(1, 5),
      paymentStatus: randomItem(Object.values(PAYMENT_STATUS)),
      paymentMethod: randomItem(["Credit Card", "PayPal", "Cash on Delivery"]),
      deliveryAddress: `${randomInt(100, 999)} Street, City`,
      createdAt: dayjs()
        .subtract(randomInt(0, 90), "days")
        .format("YYYY-MM-DD HH:mm:ss"),
      updatedAt: dayjs()
        .subtract(randomInt(0, 30), "days")
        .format("YYYY-MM-DD HH:mm:ss"),
    });
  }
  return orders;
};

// Generate mock transactions
export const generateTransactions = (count = 100) => {
  const transactions = [];
  const types = ["Order Payment", "Vendor Payout", "Refund", "Commission"];

  for (let i = 1; i <= count; i++) {
    transactions.push({
      id: i,
      transactionId: `TXN-${String(i).padStart(8, "0")}`,
      type: randomItem(types),
      amount: randomInt(10, 1000),
      status: randomItem(Object.values(PAYMENT_STATUS)),
      method: randomItem(["Credit Card", "Bank Transfer", "PayPal", "Stripe"]),
      reference: `REF-${randomInt(10000, 99999)}`,
      description: `Transaction for order #${randomInt(1, 100)}`,
      createdAt: dayjs()
        .subtract(randomInt(0, 180), "days")
        .format("YYYY-MM-DD HH:mm:ss"),
    });
  }
  return transactions;
};

// Generate mock banners
export const generateBanners = () => {
  return [
    {
      id: 1,
      title: "Summer Sale",
      description: "Up to 50% off on all items",
      image: "https://picsum.photos/seed/banner1/1200/400",
      isActive: true,
      link: "/promotions/summer-sale",
      order: 1,
      startDate: dayjs().subtract(7, "days").format("YYYY-MM-DD"),
      endDate: dayjs().add(23, "days").format("YYYY-MM-DD"),
    },
    {
      id: 2,
      title: "New Arrivals",
      description: "Check out our latest products",
      image: "https://picsum.photos/seed/banner2/1200/400",
      isActive: true,
      link: "/products/new",
      order: 2,
      startDate: dayjs().subtract(3, "days").format("YYYY-MM-DD"),
      endDate: dayjs().add(27, "days").format("YYYY-MM-DD"),
    },
    {
      id: 3,
      title: "Free Shipping",
      description: "On orders over $50",
      image: "https://picsum.photos/seed/banner3/1200/400",
      isActive: false,
      link: "/info/shipping",
      order: 3,
      startDate: dayjs().add(1, "days").format("YYYY-MM-DD"),
      endDate: dayjs().add(30, "days").format("YYYY-MM-DD"),
    },
  ];
};

// Generate mock discount codes
export const generateDiscountCodes = () => {
  return [
    {
      id: 1,
      code: "SUMMER2024",
      discount: 20,
      type: "percentage",
      minOrder: 50,
      maxDiscount: 100,
      usageLimit: 1000,
      usageCount: 245,
      isActive: true,
      startDate: dayjs().subtract(10, "days").format("YYYY-MM-DD"),
      endDate: dayjs().add(20, "days").format("YYYY-MM-DD"),
    },
    {
      id: 2,
      code: "WELCOME10",
      discount: 10,
      type: "fixed",
      minOrder: 30,
      maxDiscount: null,
      usageLimit: null,
      usageCount: 567,
      isActive: true,
      startDate: dayjs().subtract(30, "days").format("YYYY-MM-DD"),
      endDate: dayjs().add(335, "days").format("YYYY-MM-DD"),
    },
    {
      id: 3,
      code: "FLASH50",
      discount: 50,
      type: "percentage",
      minOrder: 100,
      maxDiscount: 200,
      usageLimit: 100,
      usageCount: 98,
      isActive: false,
      startDate: dayjs().subtract(5, "days").format("YYYY-MM-DD"),
      endDate: dayjs().subtract(1, "days").format("YYYY-MM-DD"),
    },
  ];
};

// Generate mock support tickets
export const generateTickets = (count = 50) => {
  const tickets = [];
  const subjects = [
    "Order not delivered",
    "Payment issue",
    "Product quality complaint",
    "Account access problem",
    "Refund request",
    "Vendor registration help",
  ];

  for (let i = 1; i <= count; i++) {
    tickets.push({
      id: i,
      ticketNumber: `TICK-${String(i).padStart(5, "0")}`,
      subject: randomItem(subjects),
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
      userType: randomItem(["Customer", "Vendor", "Agent"]),
      userName: `User ${i}`,
      userEmail: `user${i}@example.com`,
      status: randomItem(Object.values(TICKET_STATUS)),
      priority: randomItem(Object.values(TICKET_PRIORITY)),
      assignedTo: randomBoolean() ? `Admin ${randomInt(1, 5)}` : null,
      createdAt: dayjs()
        .subtract(randomInt(0, 30), "days")
        .format("YYYY-MM-DD HH:mm:ss"),
      updatedAt: dayjs()
        .subtract(randomInt(0, 5), "days")
        .format("YYYY-MM-DD HH:mm:ss"),
      messages: randomInt(1, 10),
    });
  }
  return tickets;
};

// Generate mock audit logs
export const generateAuditLogs = (count = 100) => {
  const logs = [];
  const actions = [
    "User Login",
    "User Created",
    "User Updated",
    "User Deleted",
    "Order Created",
    "Order Updated",
    "Vendor Approved",
    "Vendor Suspended",
    "Product Added",
    "Product Updated",
    "Settings Changed",
  ];
  const admins = ["Admin User", "Super Admin", "John Admin", "Jane Admin"];

  for (let i = 1; i <= count; i++) {
    logs.push({
      id: i,
      admin: randomItem(admins),
      action: randomItem(actions),
      resource: randomItem(["User", "Order", "Product", "Vendor", "Settings"]),
      resourceId: randomInt(1, 1000),
      details: "Action performed successfully",
      ipAddress: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
      timestamp: dayjs()
        .subtract(randomInt(0, 30), "days")
        .format("YYYY-MM-DD HH:mm:ss"),
    });
  }
  return logs;
};

// Generate dashboard stats
export const generateDashboardStats = () => {
  return {
    totalOrders: randomInt(1000, 5000),
    totalRevenue: randomInt(50000, 200000),
    totalVendors: randomInt(50, 200),
    totalCustomers: randomInt(500, 2000),
    totalDeliveries: randomInt(800, 4000),
    pendingOrders: randomInt(10, 100),
    activeVendors: randomInt(40, 150),
    activeAgents: randomInt(20, 80),
  };
};

// Generate analytics data
export const generateAnalytics = (period = "daily") => {
  const days = period === "daily" ? 7 : period === "weekly" ? 12 : 12;
  const data = [];

  for (let i = days - 1; i >= 0; i--) {
    const date =
      period === "daily"
        ? dayjs().subtract(i, "days").format("MMM DD")
        : period === "weekly"
        ? `Week ${12 - i}`
        : dayjs().subtract(i, "months").format("MMM YYYY");

    data.push({
      date,
      revenue: randomInt(1000, 10000),
      orders: randomInt(10, 100),
      vendors: randomInt(5, 50),
      agents: randomInt(3, 30),
    });
  }

  return data;
};

// Generate sales by vendor
export const generateSalesByVendor = () => {
  const vendors = generateVendors(10);
  return vendors.map((v) => ({
    name: v.businessName,
    sales: randomInt(5000, 50000),
  }));
};

// Generate sales by category
export const generateSalesByCategory = () => {
  const categories = generateCategories();
  return categories
    .filter((c) => !c.parentId)
    .map((c) => ({
      name: c.name,
      sales: randomInt(5000, 40000),
    }));
};

// Export all mock data
export const mockData = {
  customers: generateCustomers(),
  vendors: generateVendors(),
  deliveryAgents: generateDeliveryAgents(),
  categories: generateCategories(),
  products: generateProducts(),
  orders: generateOrders(),
  transactions: generateTransactions(),
  banners: generateBanners(),
  discountCodes: generateDiscountCodes(),
  tickets: generateTickets(),
  auditLogs: generateAuditLogs(),
  dashboardStats: generateDashboardStats(),
};
