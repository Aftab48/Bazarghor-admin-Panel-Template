import { useState, useEffect, useRef } from "react";
import {
  Table,
  Button,
  Space,
  Drawer,
  Upload,
  Form,
  Input,
  InputNumber,
  Tag,
  Image,
  message,
  Descriptions,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  FolderOpenOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { storeCategoriesAPI } from "../../services/api";
import {
  NeutralButton,
  AddNeutralButton,
} from "../../components/common/NeutralButton";
import useDebounce from "../../hooks/useDebounce";

const formatter = new Intl.NumberFormat("en-IN");

const formatNumber = (value) => formatter.format(value ?? 0);

// Note: textToSlug function removed as it's not currently used

// Convert slug to display format (capitalize words)
const slugToDisplay = (slug) => {
  if (!slug) return "";
  return String(slug)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const StoreCategory = () => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [form] = Form.useForm();
  const [icon, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [tablePagination, setTablePagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const debouncedSearch = useDebounce(searchText, 400);
  const hasInitialized = useRef(false);

  const normalizeCategory = (category) => {
    if (!category) return null;

    const childSet = new Set();

    const collectChildren = (source) => {
      if (!source) return;
      if (Array.isArray(source)) {
        source.forEach((child) => {
          if (typeof child === "string") {
            const trimmed = child.trim();
            if (trimmed) childSet.add(trimmed);
          } else if (child && typeof child === "object") {
            const value =
              child.name ||
              child.slug ||
              child.title ||
              child.id ||
              child._id ||
              "";
            if (value) childSet.add(String(value).trim());
          }
        });
      } else if (typeof source === "string") {
        source
          .split(",")
          .map((child) => child.trim())
          .filter(Boolean)
          .forEach((child) => childSet.add(child));
      }
    };

    collectChildren(category.children);
    collectChildren(category.childCategories);

    const cleanChildren = Array.from(childSet);
    const rawDisplayOrder =
      category.displayOrder ?? category.order ?? category.sortOrder;
    const numericDisplayOrder = Number(rawDisplayOrder);

    const normalizeIconValue = (value) => {
      if (!value && value !== 0) return "";
      return typeof value === "string" ? value.trim() : String(value).trim();
    };

    const resolveIcon = () => {
      const pickUriFromObject = (obj) =>
        normalizeIconValue(obj?.uri || obj?.url || obj?.link || "");
      if (Array.isArray(category.icon)) {
        const objWithUri = category.icon.find(
          (iconEntry) =>
            iconEntry &&
            typeof iconEntry === "object" &&
            (iconEntry.uri || iconEntry.url || iconEntry.link),
        );
        if (objWithUri) return pickUriFromObject(objWithUri);

        return "";
      }

      if (category.icon && typeof category.icon === "object") {
        return pickUriFromObject(category.icon);
      }
      return "";
    };

    return {
      ...category,
      id: category._id || category.id,
      parentId:
        category.parentCategory?._id ||
        category.parentCategory?.id ||
        category.parentCategory ||
        category.parentId,
      parentName:
        category.parentCategory?.name ||
        category.parentCategory?.title ||
        category.parentName ||
        category.parent_category_name ||
        "",
      productsCount: category.productsCount ?? category.productCount ?? 0,
      storeCount:
        category.storeCount ??
        category.storesCount ??
        category.totalStoreCount ??
        category.totalStores ??
        category.storeCounts ??
        0,
      icon: resolveIcon(),
      name: category.name,
      slug: category.slug,
      description:
        typeof category.description === "string"
          ? category.description
          : typeof category.details === "string"
            ? category.details
            : "",
      children: cleanChildren,
      displayOrder: Number.isFinite(numericDisplayOrder)
        ? numericDisplayOrder
        : 0,
      isActive: category.isActive,
      level: category.level,
    };
  };

  const fetchCategories = async ({
    search = searchText,
    page = tablePagination.current,
    pageSize = tablePagination.pageSize,
  } = {}) => {
    setLoading(true);
    try {
      const params = {
        limit: pageSize,
        page,
      };
      const trimmedSearch = (search || "").trim();
      if (trimmedSearch) {
        params.search = trimmedSearch;
      }

      const result = await storeCategoriesAPI.getStore(params);

      // Handle paginated response structure
      let raw = [];
      let paginator = null;
      if (Array.isArray(result?.data)) {
        raw = result.data;
        paginator = result?.paginator || null;
      } else if (Array.isArray(result?.data?.data)) {
        raw = result.data.data;
        paginator = result.data?.paginator || null;
      } else if (Array.isArray(result?.data?.docs)) {
        raw = result.data.docs;
        paginator = result.data?.paginator || null;
      } else if (Array.isArray(result)) {
        raw = result;
      }

      const normalized = raw.map((c) => normalizeCategory(c)).filter(Boolean);

      setCategories(normalized);
      setTablePagination((prev) => ({
        ...prev,
        current: Number(paginator?.currentPage) || Number(page) || 1,
        pageSize: Number(paginator?.perPage) || Number(pageSize) || 10,
        total: Number(paginator?.itemCount) || normalized.length,
      }));
    } catch {
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

  useEffect(() => {
    if (!hasInitialized.current) return;
    fetchCategories({
      search: debouncedSearch,
      page: 1,
      pageSize: tablePagination.pageSize,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({
      description: "",
      displayOrder: Number(categories.length || 0) + 1,
    });
    setIconFile(null);
    setIconPreview(null);
    setModalVisible(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);

    form.setFieldsValue({
      ...category,
      description: category?.description || "",
      displayOrder: Number(category?.displayOrder ?? 0),
    });
    // show existing icon (if any) as preview when editing
    setIconFile(null);
    setIconPreview(category?.icon || null);
    setModalVisible(true);
  };

  const handleDelete = async (category) => {
    const categoryId = category?.id || category?._id;
    if (!categoryId) {
      message.error("Category identifier is missing");
      return;
    }
    try {
      await storeCategoriesAPI.delete(categoryId);
      message.success("Category deleted successfully");
      fetchCategories({
        search: debouncedSearch,
        page: tablePagination.current,
        pageSize: tablePagination.pageSize,
      });
    } catch {
      message.error("Failed to delete category");
    }
  };

  const handleView = (category) => {
    setViewingCategory(category);
    setViewModalVisible(true);
  };

  const closeViewModal = () => {
    setViewModalVisible(false);
    setViewingCategory(null);
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        name: values.name?.trim(),
        // slug: values.slug?.trim(),
        description: values.description?.trim() || "",
        displayOrder: Number(values.displayOrder) || 0,
      };

      // If an icon file was selected, send as FormData
      const file = values.icon || icon;
      if (file) {
        const fd = new FormData();
        // append payload keys
        Object.keys(payload).forEach((k) => {
          const v = payload[k];
          if (Array.isArray(v)) {
            // For arrays, only append non-empty, valid items
            // Filter out empty strings, null, undefined before appending
            const validItems = v.filter(
              (item) =>
                item !== undefined &&
                item !== null &&
                String(item).trim() !== "",
            );
            // Only append array fields if they have valid items
            // This prevents validation errors with empty arrays or invalid entries
            if (validItems.length > 0) {
              validItems.forEach((item) => {
                fd.append(k, String(item).trim());
              });
            }
            // Don't append empty arrays - let backend handle as undefined/optional
          } else {
            // For non-array values, append if not undefined/null
            if (v !== undefined && v !== null) {
              fd.append(k, String(v));
            }
          }
        });
        // append file object
        const fileObj = file.originFileObj || file;
        if (fileObj) fd.append("icon", fileObj);

        if (editingCategory) {
          await storeCategoriesAPI.update(editingCategory.id, fd);
          message.success("Category updated successfully");
        } else {
          await storeCategoriesAPI.create(fd);
          message.success("Category created successfully");
        }
      } else {
        if (editingCategory) {
          await storeCategoriesAPI.update(editingCategory.id, payload);
          message.success("Category updated successfully");
        } else {
          await storeCategoriesAPI.create(payload);
          message.success("Category created successfully");
        }
      }

      setModalVisible(false);
      setIconFile(null);
      setIconPreview(null);
      fetchCategories({
        search: debouncedSearch,
        page: tablePagination.current,
        pageSize: tablePagination.pageSize,
      });
    } catch {
      message.error("Failed to save category");
    }
  };

  const totalCategoriesCount = categories.length;
  const activeCategoriesCount = categories.filter(
    (category) => category?.isActive !== false,
  ).length;

  const categoryStatCards = [
    {
      key: "total",
      label: "Total Categories",
      value: formatNumber(totalCategoriesCount),
      icon: <AppstoreOutlined />,
      iconBg: "#eef2ff",
      iconColor: "#4f46e5",
    },
    {
      key: "active",
      label: "Active",
      value: formatNumber(activeCategoriesCount),
      icon: <CheckCircleOutlined />,
      iconBg: "#ecfdf5",
      iconColor: "#10b981",
    },
    {
      key: "inactive",
      label: "Inactive",
      value: formatNumber(totalCategoriesCount - activeCategoriesCount),
      icon: <FolderOpenOutlined />,
      iconBg: "#fefce8",
      iconColor: "#ca8a04",
    },
  ];

  const categoryRows = categories;

  const getPaginationConfig = (label) => ({
    current: tablePagination.current,
    pageSize: tablePagination.pageSize,
    total: tablePagination.total,
    showSizeChanger: true,
    pageSizeOptions: ["5", "10", "20", "50"],
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} ${label}`,
  });

  const handleTableChange = (pagination) => {
    fetchCategories({
      search: debouncedSearch,
      page: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  const renderDescription = (description) => {
    if (!description) return "-";
    const trimmed = String(description).trim();
    if (!trimmed) return "-";
    return trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed;
  };

  const IconPreview = ({ uri, size = 32 }) => {
    const [broken, setBroken] = useState(false);
    const cleanUri = typeof uri === "string" ? uri.trim() : "";
    if (!cleanUri || broken) return <span>-</span>;

    return (
      <Image
        src={cleanUri}
        alt="icon"
        width={size}
        height={size}
        preview={false}
        onError={() => setBroken(true)}
        style={{ objectFit: "cover", borderRadius: 6 }}
      />
    );
  };

  const parentColumns = [
    {
      title: "Icon",
      dataIndex: "icon",
      key: "icon",
      width: 120,
      render: (icon) => (
        <div style={{ display: "flex", justifyContent: "left" }}>
          <IconPreview uri={icon} size={32} />
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          {record.slug ? (
            <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
              {record.slug}
            </code>
          ) : null}
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: renderDescription,
    },
    {
      title: "Total Stores",
      dataIndex: "storeCount",
      key: "storeCount",
      align: "center",
      sorter: (a, b) => (a.storeCount ?? 0) - (b.storeCount ?? 0),
      render: (value) => <Tag color="blue">{formatNumber(value ?? 0)}</Tag>,
    },
    {
      title: "Display Order",
      dataIndex: "displayOrder",
      key: "displayOrder",
      sorter: (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
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
            onClick={() => handleDelete(record)}
            title="Delete"
            danger
          />
        </Space>
      ),
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
          className="flex justify-between items-start mb-6"
          style={{
            flexWrap: "wrap",
            gap: 12,
            rowGap: 12,
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
            Categories
          </h1>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginTop: 16,
          }}
        >
          {categoryStatCards.map((stat) => (
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
        <div
          className="flex items-center justify-between gap-3 w-full flex-wrap"
          style={{
            rowGap: 12,
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 200,
            }}
          >
            <Input
              placeholder="Search categories..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="large"
              allowClear
              style={{
                width: "100%",
                maxWidth: 420,
              }}
            />
          </div>
          <div>
            <AddNeutralButton icon={<PlusOutlined />} onClick={handleAdd}>
              Add Category
            </AddNeutralButton>
          </div>
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
        <Table
          columns={parentColumns}
          dataSource={categoryRows}
          rowKey={(record) => record?.id || record?._id || record?.slug}
          loading={loading}
          childrenColumnName="__children"
          size="middle"
          scroll={{ x: 960 }}
          pagination={getPaginationConfig("categories")}
          onChange={handleTableChange}
        />
      </div>

      {/* Add/Edit Category Drawer (refreshed design) */}
      <Drawer
        title={editingCategory ? "Edit Category" : "Add Category"}
        open={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setIconFile(null);
          setIconPreview(null);
          form.resetFields();
        }}
        width={680}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={12}>
            <Col xs={24} sm={16}>
              <Form.Item
                name="name"
                label="Category Name"
                rules={[
                  { required: true, message: "Please enter category name" },
                ]}
              >
                <Input placeholder="Enter category name" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="displayOrder"
                label="Display Order"
                rules={[
                  {
                    required: true,
                    message: "Please provide the display order",
                  },
                ]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Add category description" />
          </Form.Item>

          <Form.Item name="icon" label="Icon">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 8,
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  border: "1px dashed #e5e7eb",
                }}
              >
                {iconPreview ? (
                  <img
                    src={iconPreview}
                    alt="icon"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div style={{ color: "#9ca3af", fontSize: 12 }}>No image</div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={() => false}
                  maxCount={1}
                  onChange={({ fileList }) => {
                    const file = fileList && fileList[0] ? fileList[0] : null;
                    setIconFile(file);
                    form.setFieldsValue({ icon: file });
                    if (file && file.originFileObj) {
                      try {
                        const url = URL.createObjectURL(file.originFileObj);
                        setIconPreview(url);
                      } catch {
                        setIconPreview(null);
                      }
                    } else if (file && file.url) {
                      setIconPreview(file.url);
                    } else if (!file) {
                      setIconPreview(null);
                    }
                  }}
                >
                  <Button type="default">Choose image</Button>
                </Upload>

                <div style={{ marginTop: 8, color: "#6b7280", fontSize: 12 }}>
                  Recommended: 64x64 PNG or JPG — max 1MB
                </div>

                {(iconPreview || icon) && (
                  <div style={{ marginTop: 8 }}>
                    <NeutralButton
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        setIconFile(null);
                        setIconPreview(null);
                        form.setFieldsValue({ icon: null });
                      }}
                    >
                      Remove image
                    </NeutralButton>
                  </div>
                )}
              </div>
            </div>
          </Form.Item>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              marginTop: 8,
            }}
          >
            <NeutralButton
              onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}
            >
              Cancel
            </NeutralButton>
            <AddNeutralButton onClick={() => form.submit()}>
              Save Category
            </AddNeutralButton>
          </div>
        </Form>
      </Drawer>

      <Drawer
        open={viewModalVisible}
        onClose={closeViewModal}
        width={520}
        title={viewingCategory?.name || "Category Details"}
      >
        {viewingCategory ? (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Icon">
              {viewingCategory.icon ? (
                <IconPreview uri={viewingCategory.icon} size={64} />
              ) : (
                "-"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Name">
              {viewingCategory.name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Slug">
              {viewingCategory.slug || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Products Count">
              {formatNumber(viewingCategory.productsCount)}
            </Descriptions.Item>
            <Descriptions.Item label="Total Stores">
              {formatNumber(viewingCategory.storeCount)}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {viewingCategory.isActive === false ? "Inactive" : "Active"}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
};

export default StoreCategory;
