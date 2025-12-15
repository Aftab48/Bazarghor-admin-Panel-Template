import { useState, useEffect, useRef } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Image,
  message,
  Dropdown,
  Select,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { productsAPI, categoriesAPI } from "../../services/api";
import useDebounce from "../../hooks/useDebounce";

const numberFormatter = new Intl.NumberFormat("en-IN");

const formatNumber = (value) => numberFormatter.format(value ?? 0);

const isLowStock = (product) => {
  const quantity = Number(product?.quantity ?? 0);
  const status = (product?.status || "").toLowerCase();
  return status === "low_stock" || (quantity > 0 && quantity <= 10);
};

const isInStock = (product) => {
  const quantity = Number(product?.quantity ?? 0);
  const status = (product?.status || "").toLowerCase();
  return status === "in_stock" || quantity > 10;
};

const Products = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const debouncedSearch = useDebounce(searchText, 400);
  const hasInitialized = useRef(false);
  const pageSizeRef = useRef(10);

  const normalizeProduct = (product) => {
    if (!product) return null;
    const imageList = Array.isArray(product.productImages)
      ? product.productImages
      : [];
    const firstImage = imageList.length > 0 ? imageList[0] : null;
    const primaryImage =
      firstImage?.uri || firstImage?.url || product.image || "";

    const vendorName = product.vendorId
      ? `${product.vendorId.firstName || ""} ${product.vendorId.lastName || ""}`
          .trim()
          .replace(/\s+/g, " ") ||
        product.vendorId.email ||
        product.vendorId.mobNo
      : product.storeId?.storeName;

    const categoryId =
      product.category?._id ||
      product.category?.id ||
      product.categoryId ||
      product.category;

    const categoryName =
      product.category?.name ||
      product.category?.categoryName ||
      product.categoryName;

    return {
      ...product,
      id: product._id || product.id,
      name: product.productName || product.name,
      sku: product.sku || product.slug,
      vendorName,
      categoryId,
      categoryName,
      primaryImage,
      quantity: product.quantity ?? product.stock,
      status: product.status,
    };
  };

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([
        fetchCategories(),
        fetchProducts({ current: 1, pageSize: 10 }),
      ]);
      hasInitialized.current = true;
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasInitialized.current) return;
    fetchProducts({
      current: 1,
      pageSize: pageSizeRef.current,
      search: debouncedSearch,
      categoryId: selectedCategory,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const categoriesResult = await categoriesAPI.getAll();
      const safeCategories = Array.isArray(categoriesResult?.data)
        ? categoriesResult.data
        : Array.isArray(categoriesResult?.data?.data)
        ? categoriesResult.data.data
        : Array.isArray(categoriesResult)
        ? categoriesResult
        : [];
      setCategories(safeCategories);
    } catch (error) {
      message.error("Failed to fetch categories");
    }
  };

  const fetchProducts = async ({
    current = 1,
    pageSize = 10,
    search = searchText,
    categoryId = selectedCategory,
  } = {}) => {
    setLoading(true);
    try {
      const params = {
        page: current,
        limit: pageSize,
      };
      const trimmedSearch = (search || "").trim();
      if (trimmedSearch) {
        params.search = trimmedSearch;
      }
      if (categoryId) {
        params.categoryId = categoryId;
      }

      const productsData = await productsAPI.getAll(params);

      const rawProducts = Array.isArray(productsData?.data)
        ? productsData.data
        : Array.isArray(productsData?.data?.data)
        ? productsData.data.data
        : Array.isArray(productsData)
        ? productsData
        : [];

      const normalizedProducts = rawProducts
        .map((p) => normalizeProduct(p))
        .filter(Boolean);

      if (
        normalizedProducts.length === 0 &&
        current > 1 &&
        (productsData?.paginator?.hasPrevPage || productsData?.paginator?.prev)
      ) {
        await fetchProducts({
          current: current - 1,
          pageSize,
          search: trimmedSearch,
          categoryId,
        });
        return;
      }

      setProducts(normalizedProducts);
      setPagination((prev) => ({
        ...prev,
        current,
        pageSize,
        total:
          productsData?.paginator?.itemCount ||
          productsData?.data?.length ||
          normalizedProducts.length,
      }));
      pageSizeRef.current = pageSize;
    } catch (error) {
      message.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    try {
      await productsAPI.delete(productId);
      fetchProducts({
        current: pagination.current,
        pageSize: pagination.pageSize,
      });
      message.success("Product deleted successfully");
    } catch {
      message.error("Failed to delete product");
    }
  };

  const getActionMenu = (record) => ({
    items: [
      {
        key: "edit",
        icon: <EditOutlined />,
        label: "Edit",
      },
      {
        key: "delete",
        icon: <DeleteOutlined />,
        label: "Delete",
        danger: true,
        onClick: () => handleDelete(record.id),
      },
    ],
  });

  const columns = [
    {
      title: "Image",
      dataIndex: "primaryImage",
      key: "primaryImage",
      responsive: ["xs", "sm", "md", "lg"],
      render: (_, record) => (
        <Image
          src={record.primaryImage}
          alt={record.name || "Product"}
          width={48}
          height={48}
          fallback="https://via.placeholder.com/80?text=No+Image"
          className="rounded"
        />
      ),
    },
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      responsive: ["xs", "sm", "md", "lg"],
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.sku}</div>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "categoryName",
      key: "categoryId",
      responsive: ["sm", "md", "lg"],
      render: (_, record) => {
        const category =
          record.categoryName ||
          categories.find(
            (c) =>
              c.id === record.categoryId ||
              c._id === record.categoryId ||
              c.value === record.categoryId
          )?.name;
        return category ? <Tag>{category}</Tag> : "-";
      },
    },
    {
      title: "Vendor/Store",
      dataIndex: "vendorName",
      key: "vendorName",
      responsive: ["md", "lg"],
      render: (value, record) => value || record.storeId?.storeName || "-",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      responsive: ["sm", "md", "lg"],
      render: (price) => `₹${price}`,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: "Stock",
      dataIndex: "quantity",
      key: "quantity",
      responsive: ["sm", "md", "lg"],
      render: (quantity) => (
        <Tag color={quantity > 10 ? "green" : quantity > 0 ? "orange" : "red"}>
          {quantity ?? 0}
        </Tag>
      ),
      sorter: (a, b) => (a.quantity ?? 0) - (b.quantity ?? 0),
    },
    // {
    //   title: "Featured",
    //   dataIndex: "isFeatured",
    //   key: "isFeatured",
    //   render: (isFeatured, record) => (
    //     <Switch
    //       checked={isFeatured}
    //       onChange={() => handleToggleFeatured(record.id, isFeatured)}
    //       checkedChildren={<StarFilled />}
    //       unCheckedChildren={<StarOutlined />}
    //     />
    //   ),
    //   filters: [
    //     { text: "Featured", value: true },
    //     { text: "Not Featured", value: false },
    //   ],
    //   onFilter: (value, record) => record.isFeatured === value,
    // },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      responsive: ["sm", "md", "lg"],
      render: (status) => {
        const colorMap = {
          in_stock: "green",
          low_stock: "orange",
          out_of_stock: "red",
        };
        const label = (status || "").replace(/_/g, " ") || "-";
        return <Tag color={colorMap[status] || "blue"}>{label}</Tag>;
      },
    },
    {
      title: "Active",
      dataIndex: "isActive",
      key: "isActive",
      responsive: ["md", "lg"],
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Dropdown menu={getActionMenu(record)} trigger={["click"]}>
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const filteredProducts = (products || []).filter((product) => {
    if (!product) return false;
    const search = searchText.toLowerCase();
    const name = (product.name || "").toLowerCase();
    const sku = (product.sku || "").toLowerCase();
    const vendor = (product.vendorName || "").toLowerCase();
    const store = (product.storeId?.storeName || "").toLowerCase();
    const matchesSearch =
      name.includes(search) ||
      sku.includes(search) ||
      vendor.includes(search) ||
      store.includes(search);

    const matchesCategory =
      !selectedCategory || product.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalProductsCount = pagination.total || products.length || 0;
  const activeProductsCount = products.filter(
    (product) => product?.isActive
  ).length;
  const inStockProductsCount = products.filter((product) =>
    isInStock(product)
  ).length;
  const lowStockProductsCount = products.filter((product) =>
    isLowStock(product)
  ).length;

  const productStatCards = [
    {
      key: "total",
      label: "Total Products",
      value: formatNumber(totalProductsCount),
      icon: <ShoppingOutlined />,
      iconBg: "#eef2ff",
      iconColor: "#4f46e5",
      subLabel:
        pagination.total && pagination.total !== products.length
          ? "All pages"
          : "Current list",
    },
    {
      key: "active",
      label: "Active",
      value: formatNumber(activeProductsCount),
      icon: <CheckCircleOutlined />,
      iconBg: "#ecfdf5",
      iconColor: "#10b981",
      subLabel: products.length ? "Current page" : "",
    },
    {
      key: "inStock",
      label: "In Stock",
      value: formatNumber(inStockProductsCount),
      icon: <SafetyCertificateOutlined />,
      iconBg: "#e0f2fe",
      iconColor: "#0284c7",
      subLabel: products.length ? "Current page" : "",
    },
    {
      key: "lowStock",
      label: "Low Stock",
      value: formatNumber(lowStockProductsCount),
      icon: <WarningOutlined />,
      iconBg: "#fff7ed",
      iconColor: "#f97316",
      subLabel: products.length ? "Current page" : "",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          background: "#ffffff",
          padding: "clamp(16px, 2vw, 24px)",
          borderRadius: "8px",
          boxShadow: "0 0 14px rgba(0,0,0,0.09)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            rowGap: 12,
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#3c2f3d",
              margin: 0,
            }}
          >
            Products
          </h1>
          <Space
            className="flex flex-wrap gap-3"
            size="middle"
            style={{ justifyContent: "flex-end", flex: 1, minWidth: 220 }}
          >
            <Input
              allowClear
              placeholder="Search products..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%", maxWidth: 360, flex: 1, minWidth: 200 }}
              size="large"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{
                background: "#9dda52",
                borderColor: "#9dda52",
                color: "#3c2f3d",
              }}
            >
              Add Product
            </Button>
          </Space>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginTop: 16,
          }}
        >
          {productStatCards.map((stat) => (
            <div
              key={stat.key}
              style={{
                background: "#f8fafc",
                borderRadius: 10,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: stat.iconBg,
                  color: stat.iconColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  {stat.label}
                </div>
                <div
                  style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}
                >
                  {stat.value}
                </div>
                {stat.subLabel && (
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    {stat.subLabel}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          background: "#ffffff",
          padding: "clamp(16px, 2vw, 24px)",
          borderRadius: "8px",
          boxShadow: "0 0 14px rgba(0,0,0,0.09)",
        }}
      >
        <Space
          className="flex flex-wrap gap-3"
          size="middle"
          style={{ marginBottom: 16 }}
        >
          <Select
            placeholder="Filter by category"
            style={{ minWidth: 200 }}
            allowClear
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={categories.map((cat) => ({
              label: cat.name || cat.categoryName || cat.title,
              value: cat.id || cat._id || cat.value,
            }))}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={filteredProducts || []}
          rowKey={(record) => record?.id || record?._id || record?.sku}
          loading={loading}
          scroll={{ x: 960 }}
          size="middle"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} products`,
          }}
          onChange={(pager) =>
            fetchProducts({
              current: pager.current || pagination.current,
              pageSize: pager.pageSize || pagination.pageSize,
            })
          }
        />
      </div>
    </div>
  );
};

export default Products;
