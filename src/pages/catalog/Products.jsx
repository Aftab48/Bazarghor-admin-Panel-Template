import { useState, useEffect, useRef } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Image,
  message,
  Select,
  Modal,
  Drawer,
  Card,
  Form,
  InputNumber,
  Descriptions,
} from "antd";

const { TextArea } = Input;
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  productsAPI,
  categoriesAPI,
  vendorsAPI,
  storeAPI,
} from "../../services/api";
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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [stores, setStores] = useState([]);
  const [addSelectedVendorId, setAddSelectedVendorId] = useState(null);
  const [editSelectedVendorId, setEditSelectedVendorId] = useState(null);
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();

  const addSelectedCategoryId = Form.useWatch("category", addForm);
  const editSelectedCategoryId = Form.useWatch("category", form);

  const debouncedSearch = useDebounce(searchText, 400);
  const hasInitialized = useRef(false);
  const pageSizeRef = useRef(10);

  const toIdString = (value) => {
    if (value === undefined || value === null) return "";
    return String(value);
  };

  const extractArray = (result) => {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.data?.data)) return result.data.data;
    if (Array.isArray(result?.data?.docs)) return result.data.docs;
    return [];
  };

  const normalizeCategory = (category) => {
    if (!category) return null;
    const id = category._id || category.id || category.value;
    const parentId = category.parentCategory || null;
    return {
      ...category,
      id: id ? toIdString(id) : "",
      parentId: parentId ? toIdString(parentId) : null,
      name: category.name || category.categoryName || category.title || "",
    };
  };

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

    const storeId =
      product.storeId?._id || product.storeId?.id || product.storeId;
    const vendorId =
      product.vendorId?._id || product.vendorId?.id || product.vendorId;
    const subcategoryId =
      product.subcategory?._id ||
      product.subcategory?.id ||
      product.subcategoryId ||
      product.subcategory;

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
      storeId: storeId ? toIdString(storeId) : "",
      vendorId: vendorId ? toIdString(vendorId) : "",
      subcategoryId: subcategoryId ? toIdString(subcategoryId) : "",
      weight: product.weight ?? product.netWeight,
      weightUnit: product.weightUnit || product.unit,
      isVeg: product.isVeg,
      isPacked: product.isPacked,
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

  const fetchCategories = async ({ search = searchText } = {}) => {
    setLoading(true);
    try {
      const params = {
        limit: 10000, // Request a high limit to get all categories
        page: 1,
      };
      const trimmedSearch = (search || "").trim();
      if (trimmedSearch) {
        params.search = trimmedSearch;
      }

      const result = await categoriesAPI.getAll(params);

      // Handle paginated response structure
      let raw = [];
      if (Array.isArray(result?.data)) {
        raw = result.data;
      } else if (Array.isArray(result?.data?.data)) {
        raw = result.data.data;
      } else if (Array.isArray(result?.data?.docs)) {
        raw = result.data.docs;
      } else if (Array.isArray(result)) {
        raw = result;
      }

      const normalized = raw.map((c) => normalizeCategory(c)).filter(Boolean);

      setCategories(normalized);
    } catch (error) {
      message.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchCategories();
      hasInitialized.current = true;
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVendorsAndStores = async () => {
    const [vendorsData, storesData] = await Promise.all([
      vendorsAPI.getAll(),
      storeAPI.getAll(),
    ]);

    const vendorsList = extractArray(vendorsData);
    const storesList = extractArray(storesData);

    setVendors(vendorsList);
    setStores(storesList);

    return { vendorsList, storesList };
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
        params.category = categoryId; // Backend expects 'category' not 'categoryId'
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
    Modal.confirm({
      title: "Delete Product",
      content:
        "Are you sure you want to delete this product? This action cannot be undone.",
      okText: "Yes, Delete",
      cancelText: "Cancel",
      okType: "danger",
      onOk: async () => {
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
      },
    });
  };

  const handleEdit = async (product) => {
    try {
      if (!vendors.length || !stores.length) {
        await fetchVendorsAndStores();
      }
      // Fetch full product details
      const productDetails = await productsAPI.getById(product.id);
      // extractResponseData returns the data property, so productDetails should be the product object
      const productData = productDetails?.data || productDetails || product;

      const normalized = normalizeProduct(productData) || {};
      const vendorId = normalized.vendorId || "";
      const storeId = normalized.storeId || "";
      setEditSelectedVendorId(vendorId || null);

      setEditingProduct({ ...productData, id: product.id });
      form.setFieldsValue({
        productName:
          productData.productName || productData.name || product.name,
        productDescription:
          productData.productDescription ||
          productData.description ||
          product.description ||
          "",
        quantity: productData.quantity ?? product.quantity ?? 0,
        price: productData.price ?? product.price ?? 0,
        brandName: productData.brandName || product.brandName || "",
        category:
          productData.category?._id ||
          productData.categoryId ||
          productData.category ||
          product.categoryId ||
          product.category ||
          null,
        subcategory:
          productData.subcategory?._id ||
          productData.subcategoryId ||
          productData.subcategory ||
          null,
        vendorId: vendorId || null,
        storeId: storeId || null,
        weight: normalized.weight ?? null,
        weightUnit: normalized.weightUnit || "",
        isVeg: typeof normalized.isVeg === "boolean" ? normalized.isVeg : null,
        isPacked:
          typeof normalized.isPacked === "boolean" ? normalized.isPacked : null,
        status: productData.status || product.status || "in_stock",
      });
      setEditModalVisible(true);
    } catch (error) {
      console.error("Failed to load product details:", error);
      message.error("Failed to load product details. Using available data.");
      // Fallback to using the product data we have
      setEditingProduct(product);
      form.setFieldsValue({
        productName: product.name || product.productName,
        productDescription:
          product.description || product.productDescription || "",
        quantity: product.quantity ?? 0,
        price: product.price ?? 0,
        brandName: product.brandName || "",
        category: product.categoryId || product.category || null,
        subcategory: product.subcategoryId || product.subcategory || null,
        status: product.status || "in_stock",
      });
      setEditModalVisible(true);
    }
  };

  const handleView = async (product) => {
    setViewLoading(true);
    setViewOpen(true);
    try {
      if (!vendors.length || !stores.length) {
        await fetchVendorsAndStores();
      }
      const productDetails = await productsAPI.getById(product.id);
      const productData = productDetails?.data || productDetails || product;
      const normalized = normalizeProduct(productData) || product;
      setViewData(normalized);
    } catch {
      setViewData(product);
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => {
    setViewOpen(false);
    setViewData(null);
  };

  const handleEditSubmit = async (values) => {
    if (!editingProduct?.id) {
      message.error("Product ID is missing");
      return;
    }

    try {
      setLoading(true);
      // Create FormData for multipart/form-data
      const formData = new FormData();

      Object.keys(values).forEach((key) => {
        if (values[key] !== undefined && values[key] !== null) {
          if (key === "productImages" && Array.isArray(values[key])) {
            values[key].forEach((file) => {
              if (file instanceof File) {
                formData.append("productImages", file);
              }
            });
          } else {
            formData.append(key, values[key]);
          }
        }
      });

      await productsAPI.update(editingProduct.id, formData);
      message.success("Product updated successfully");
      setEditModalVisible(false);
      setEditingProduct(null);
      form.resetFields();
      fetchProducts({
        current: pagination.current,
        pageSize: pagination.pageSize,
      });
    } catch (error) {
      message.error("Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditModalVisible(false);
    setEditingProduct(null);
    form.resetFields();
  };

  const handleAdd = async () => {
    try {
      // Fetch vendors and stores for the form
      await fetchVendorsAndStores();

      addForm.resetFields();
      setAddSelectedVendorId(null);
      addForm.setFieldsValue({
        status: "in_stock",
        quantity: 0,
        price: 0,
      });
      setAddModalVisible(true);
    } catch (error) {
      console.error("Failed to load vendors/stores:", error);
      message.error("Failed to load vendors and stores");
    }
  };

  const handleAddCancel = () => {
    setAddModalVisible(false);
    setAddSelectedVendorId(null);
    addForm.resetFields();
  };

  const handleAddSubmit = async (values) => {
    try {
      setLoading(true);
      // Create FormData for multipart/form-data
      const formData = new FormData();

      Object.keys(values).forEach((key) => {
        if (values[key] !== undefined && values[key] !== null) {
          if (key === "productImages" && Array.isArray(values[key])) {
            values[key].forEach((file) => {
              if (file instanceof File) {
                formData.append("productImages", file);
              }
            });
          } else {
            formData.append(key, values[key]);
          }
        }
      });

      await productsAPI.create(formData);
      message.success("Product created successfully");
      setAddModalVisible(false);
      addForm.resetFields();
      fetchProducts({
        current: 1,
        pageSize: pagination.pageSize,
      });
    } catch (error) {
      message.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const getVendorStores = (vendorId) => {
    const vendorIdStr = toIdString(vendorId);
    if (!vendorIdStr) return [];
    return stores.filter((store) => {
      const storeVendorId =
        store.vendorId?._id || store.vendorId?.id || store.vendorId;
      return toIdString(storeVendorId) === vendorIdStr;
    });
  };

  const handleAddVendorChange = (vendorId) => {
    const vendorIdStr = vendorId ? toIdString(vendorId) : "";
    setAddSelectedVendorId(vendorIdStr || null);
    if (!vendorId) {
      addForm.setFieldsValue({ storeId: undefined });
      return;
    }

    const vendorStores = getVendorStores(vendorIdStr);

    // If vendor has stores, auto-select first store, otherwise clear store selection
    if (vendorStores.length > 0) {
      const firstStoreId =
        vendorStores[0].id || vendorStores[0]._id || vendorStores[0].storeId;
      addForm.setFieldsValue({ storeId: toIdString(firstStoreId) });
    } else {
      addForm.setFieldsValue({ storeId: undefined });
      message.warning("No stores found for this vendor");
    }
  };

  const handleEditVendorChange = (vendorId) => {
    const vendorIdStr = vendorId ? toIdString(vendorId) : "";
    setEditSelectedVendorId(vendorIdStr || null);
    if (!vendorIdStr) {
      form.setFieldsValue({ storeId: undefined });
      return;
    }
    const vendorStores = getVendorStores(vendorIdStr);
    if (vendorStores.length === 1) {
      const onlyStoreId =
        vendorStores[0].id || vendorStores[0]._id || vendorStores[0].storeId;
      form.setFieldsValue({ storeId: toIdString(onlyStoreId) });
    }
  };

  const getFilteredStores = (vendorId) => {
    const vendorIdStr = toIdString(vendorId);
    if (!vendorIdStr) return stores;
    return getVendorStores(vendorIdStr);
  };

  const getCategoryName = (categoryId) => {
    const key = toIdString(categoryId);
    if (!key) return "-";
    const found = categories.find((c) => toIdString(c.id) === key);
    return found?.name || "-";
  };

  const getSubcategoryOptions = (parentId) => {
    const parentKey = toIdString(parentId);
    if (!parentKey) return [];
    return categories
      .filter((cat) => cat.parentId && toIdString(cat.parentId) === parentKey)
      .map((cat) => ({
        label: cat.name,
        value: toIdString(cat.id),
      }));
  };

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
          record.categoryName || getCategoryName(record.categoryId);
        return category ? (
          <span
            style={{
              backgroundColor: "#f0f0f0",
              color: "#3c2f3d",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "bolder",
              padding: "5px",
            }}
          >
            {category}
          </span>
        ) : (
          "-"
        );
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
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            title="View"
            style={{ color: "#9dda52" }}
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Edit"
            style={{ color: "#ffbc2c" }}
          />
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            title="Delete"
            danger
          />
        </Space>
      ),
    },
  ];

  // Note: Search is handled server-side via API, so we don't need client-side filtering
  // The filteredProducts was removed since search is done via API call with debouncedSearch

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
              onClick={handleAdd}
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
            style={{ minWidth: 400 }}
            allowClear
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={categories
              .filter((cat) => !cat.parentId)
              .map((cat) => ({
                label: cat.name,
                value: toIdString(cat.id),
              }))}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={products || []}
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

      {/* Add Product Modal */}
      <Modal
        title="Add New Product"
        open={addModalVisible}
        onCancel={handleAddCancel}
        onOk={() => addForm.submit()}
        okText="Create"
        cancelText="Cancel"
        width={600}
        confirmLoading={loading}
        okButtonProps={{
          style: {
            backgroundColor: "#9dda52",
            borderColor: "#9dda52",
            color: "#3c2f3d",
          },
        }}
        cancelButtonProps={{
          style: {
            backgroundColor: "#3c2f3d",
            color: "#f0f0f0",
          },
        }}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddSubmit}
          initialValues={{
            status: "in_stock",
            quantity: 0,
            price: 0,
          }}
        >
          <Form.Item name="vendorId" label="Vendor">
            <Select
              placeholder="Select vendor"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={handleAddVendorChange}
              options={vendors.map((vendor) => ({
                label:
                  `${vendor.firstName || ""} ${vendor.lastName || ""}`.trim() ||
                  vendor.email ||
                  vendor.businessName,
                value: toIdString(vendor.id || vendor._id || vendor.vendorId),
              }))}
            />
          </Form.Item>

          <Form.Item name="storeId" label="Store">
            <Select
              placeholder={
                addSelectedVendorId
                  ? "Select store for this vendor"
                  : "Select vendor first"
              }
              showSearch
              disabled={!addSelectedVendorId}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={getFilteredStores(addSelectedVendorId).map((store) => ({
                label: store.storeName || store.businessName || store.name,
                value: toIdString(store.id || store._id || store.storeId),
              }))}
            />
          </Form.Item>

          <Form.Item name="productName" label="Product Name">
            <Input placeholder="Enter product name" />
          </Form.Item>

          <Form.Item name="productDescription" label="Description">
            <TextArea
              rows={4}
              placeholder="Enter product description"
              showCount
              maxLength={5000}
            />
          </Form.Item>

          <Form.Item name="brandName" label="Brand Name">
            <Input placeholder="Enter brand name" />
          </Form.Item>

          <Form.Item name="category" label="Category">
            <Select
              placeholder="Select category"
              showSearch
              onChange={() =>
                addForm.setFieldsValue({ subcategory: undefined })
              }
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={categories
                .filter((cat) => !cat.parentId)
                .map((cat) => ({
                  label: cat.name,
                  value: toIdString(cat.id),
                }))}
            />
          </Form.Item>

          <Form.Item name="subcategory" label="Subcategory">
            <Select
              placeholder="Select subcategory"
              showSearch
              allowClear
              disabled={!addSelectedCategoryId}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={getSubcategoryOptions(addSelectedCategoryId)}
            />
          </Form.Item>

          <Form.Item name="weight" label="Weight">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Enter weight"
              min={0}
              step={0.01}
            />
          </Form.Item>

          <Form.Item name="weightUnit" label="Weight Unit">
            <Select
              placeholder="Select unit"
              options={[
                { label: "g", value: "g" },
                { label: "kg", value: "kg" },
                { label: "ml", value: "ml" },
                { label: "l", value: "l" },
                { label: "pcs", value: "pcs" },
              ]}
            />
          </Form.Item>

          <Form.Item name="isVeg" label="Is Veg?">
            <Select
              allowClear
              placeholder="Select"
              options={[
                { label: "Yes", value: true },
                { label: "No", value: false },
              ]}
            />
          </Form.Item>

          <Form.Item name="isPacked" label="Is Packed?">
            <Select
              allowClear
              placeholder="Select"
              options={[
                { label: "Yes", value: true },
                { label: "No", value: false },
              ]}
            />
          </Form.Item>

          <Form.Item name="price" label="Price (₹)">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Enter price"
              prefix="₹"
              min={0}
              step={0.01}
            />
          </Form.Item>

          <Form.Item name="quantity" label="Quantity">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Enter quantity"
              min={0}
              step={1}
            />
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Select placeholder="Select status">
              <Select.Option value="in_stock">In Stock</Select.Option>
              <Select.Option value="low_stock">Low Stock</Select.Option>
              <Select.Option value="out_of_stock">Out of Stock</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        title="Edit Product"
        open={editModalVisible}
        onCancel={handleEditCancel}
        onOk={() => form.submit()}
        okText="Update"
        cancelText="Cancel"
        width={600}
        confirmLoading={loading}
        okButtonProps={{
          style: {
            backgroundColor: "#9dda52",
            color: "#3c2f3d",
          },
        }}
        cancelButtonProps={{
          style: {
            backgroundColor: "#3c2f3d",
            color: "#f0f0f0",
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
          initialValues={{
            status: "in_stock",
          }}
        >
          <Form.Item name="vendorId" label="Vendor">
            <Select
              placeholder="Select vendor"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={handleEditVendorChange}
              options={vendors.map((vendor) => ({
                label:
                  `${vendor.firstName || ""} ${vendor.lastName || ""}`.trim() ||
                  vendor.email ||
                  vendor.businessName,
                value: toIdString(vendor.id || vendor._id || vendor.vendorId),
              }))}
            />
          </Form.Item>

          <Form.Item name="storeId" label="Store">
            <Select
              placeholder={
                editSelectedVendorId
                  ? "Select store for this vendor"
                  : "Select vendor first"
              }
              showSearch
              disabled={!editSelectedVendorId}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={getFilteredStores(editSelectedVendorId).map((store) => ({
                label: store.storeName || store.businessName || store.name,
                value: toIdString(store.id || store._id || store.storeId),
              }))}
            />
          </Form.Item>

          <Form.Item name="productName" label="Product Name">
            <Input placeholder="Enter product name" />
          </Form.Item>

          <Form.Item name="productDescription" label="Description">
            <TextArea
              rows={4}
              placeholder="Enter product description"
              showCount
              maxLength={5000}
            />
          </Form.Item>

          <Form.Item name="brandName" label="Brand Name">
            <Input placeholder="Enter brand name" />
          </Form.Item>

          <Form.Item name="category" label="Category">
            <Select
              placeholder="Select category"
              showSearch
              onChange={() => form.setFieldsValue({ subcategory: undefined })}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={categories
                .filter((cat) => !cat.parentId)
                .map((cat) => ({
                  label: cat.name,
                  value: toIdString(cat.id),
                }))}
            />
          </Form.Item>

          <Form.Item name="subcategory" label="Subcategory">
            <Select
              placeholder="Select subcategory (optional)"
              showSearch
              allowClear
              disabled={!editSelectedCategoryId}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={getSubcategoryOptions(editSelectedCategoryId)}
            />
          </Form.Item>

          <Form.Item name="weight" label="Weight">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Enter weight"
              min={0}
              step={0.01}
            />
          </Form.Item>

          <Form.Item name="weightUnit" label="Weight Unit">
            <Select
              placeholder="Select unit"
              options={[
                { label: "g", value: "g" },
                { label: "kg", value: "kg" },
                { label: "ml", value: "ml" },
                { label: "l", value: "l" },
                { label: "pcs", value: "pcs" },
              ]}
            />
          </Form.Item>

          <Form.Item name="isVeg" label="Is Veg?">
            <Select
              allowClear
              placeholder="Select"
              options={[
                { label: "Yes", value: true },
                { label: "No", value: false },
              ]}
            />
          </Form.Item>

          <Form.Item name="isPacked" label="Is Packed?">
            <Select
              allowClear
              placeholder="Select"
              options={[
                { label: "Yes", value: true },
                { label: "No", value: false },
              ]}
            />
          </Form.Item>

          <Form.Item name="price" label="Price (₹)">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Enter price"
              prefix="₹"
              min={0}
              step={0.01}
            />
          </Form.Item>

          <Form.Item name="quantity" label="Quantity">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Enter quantity"
              min={0}
              step={1}
            />
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Select placeholder="Select status">
              <Select.Option value="in_stock">In Stock</Select.Option>
              <Select.Option value="low_stock">Low Stock</Select.Option>
              <Select.Option value="out_of_stock">Out of Stock</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        open={viewOpen}
        onClose={closeViewModal}
        width={640}
        title={viewData?.name || "Product Details"}
      >
        {viewLoading ? (
          <Card loading style={{ width: "100%" }} />
        ) : viewData ? (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Image">
              <Image
                src={viewData.primaryImage}
                alt={viewData.name || "Product"}
                width={96}
                height={96}
                fallback="https://via.placeholder.com/120?text=No+Image"
                style={{ objectFit: "cover", borderRadius: 8 }}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Product Name">
              {viewData.name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Brand Name">
              {viewData.brandName || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="SKU">
              {viewData.sku || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {(viewData.productDescription || viewData.description || "")
                .toString()
                .trim() || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Vendor">
              {viewData.vendorName || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Store">
              {(() => {
                const storeKey = toIdString(viewData.storeId);
                if (!storeKey) return "-";
                const store = stores.find(
                  (s) => toIdString(s.id || s._id || s.storeId) === storeKey
                );
                return (
                  store?.storeName || store?.businessName || store?.name || "-"
                );
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Category">
              {getCategoryName(viewData.categoryId)}
            </Descriptions.Item>
            <Descriptions.Item label="Subcategory">
              {viewData.subcategoryId
                ? getCategoryName(viewData.subcategoryId)
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Price">
              {viewData.price !== undefined && viewData.price !== null
                ? `₹${viewData.price}`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Quantity">
              {viewData.quantity ?? 0}
            </Descriptions.Item>
            <Descriptions.Item label="Weight">
              {viewData.weight !== undefined && viewData.weight !== null
                ? `${viewData.weight} ${viewData.weightUnit || ""}`.trim()
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Is Veg?">
              {typeof viewData.isVeg === "boolean"
                ? viewData.isVeg
                  ? "Yes"
                  : "No"
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Is Packed?">
              {typeof viewData.isPacked === "boolean"
                ? viewData.isPacked
                  ? "Yes"
                  : "No"
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {viewData.status
                ? (viewData.status || "").replace(/_/g, " ")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Active">
              {typeof viewData.isActive === "boolean"
                ? viewData.isActive
                  ? "Active"
                  : "Inactive"
                : "-"}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <div>No data</div>
        )}
      </Drawer>
    </div>
  );
};

export default Products;
