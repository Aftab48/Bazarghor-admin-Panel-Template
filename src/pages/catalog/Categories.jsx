import { useState, useEffect, useRef } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  Image,
  message,
  Descriptions,
  Tabs,
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
import { categoriesAPI } from "../../services/api";
import useDebounce from "../../hooks/useDebounce";

const formatter = new Intl.NumberFormat("en-IN");

const formatNumber = (value) => formatter.format(value ?? 0);

const Categories = () => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [activeTab, setActiveTab] = useState("categories");
  const [form] = Form.useForm();
  const debouncedSearch = useDebounce(searchText, 400);
  const hasInitialized = useRef(false);

  const getCategoryKeyCandidates = (category) => {
    if (!category) return [];
    return [category.id, category._id, category.slug]
      .filter((value) => value !== undefined && value !== null)
      .map((value) => String(value));
  };

  const getDirectChildRecords = (parentCategory) => {
    if (!parentCategory || parentCategory?.parentId) return [];
    const parentKeys = new Set(getCategoryKeyCandidates(parentCategory));
    if (!parentKeys.size) return [];

    return categories.filter((category) => {
      const parentId = category?.parentId;
      if (parentId === undefined || parentId === null) return false;
      return parentKeys.has(String(parentId));
    });
  };

  const getDirectChildValues = (parentCategory) => {
    const children = getDirectChildRecords(parentCategory);
    const values = children
      .map(
        (child) =>
          child.slug || child.name || String(child.id || child._id || "")
      )
      .map((value) => String(value).trim())
      .filter(Boolean);
    return Array.from(new Set(values));
  };

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
            (iconEntry.uri || iconEntry.url || iconEntry.link)
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

  useEffect(() => {
    if (!hasInitialized.current) return;
    fetchCategories({
      search: debouncedSearch,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({
      children: [],
      description: "",
      displayOrder: Number(categories.length || 0) + 1,
    });
    setModalVisible(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);

    const isParentCategory = !category?.parentId;
    const derivedChildren = isParentCategory
      ? getDirectChildValues(category)
      : [];

    form.setFieldsValue({
      ...category,
      // For parent categories, show only its own direct children (sub-categories)
      children: derivedChildren.length
        ? derivedChildren
        : category?.children || [],
      description: category?.description || "",
      displayOrder: Number(category?.displayOrder ?? 0),
    });
    setModalVisible(true);
  };

  const handleDelete = async (category) => {
    const categoryId = category?.id || category?._id;
    if (!categoryId) {
      message.error("Category identifier is missing");
      return;
    }
    try {
      await categoriesAPI.delete(categoryId);
      message.success("Category deleted successfully");
      fetchCategories({
        search: debouncedSearch,
      });
    } catch (error) {
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
      const normalizedChildren = Array.isArray(values.children)
        ? values.children.map((child) => child.trim()).filter(Boolean)
        : [];

      const normalizeChildKey = (value) =>
        String(value || "")
          .trim()
          .toLowerCase();

      const getNewChildrenOnly = ({ existing = [], submitted = [] }) => {
        const existingSet = new Set(
          existing.map(normalizeChildKey).filter(Boolean)
        );
        const uniqueNew = new Set();
        const result = [];

        submitted.forEach((child) => {
          const key = normalizeChildKey(child);
          if (!key) return;
          if (existingSet.has(key)) return;
          if (uniqueNew.has(key)) return;
          uniqueNew.add(key);
          result.push(String(child).trim());
        });

        return result;
      };

      const payload = {
        ...values,
        name: values.name?.trim(),
        // slug: values.slug?.trim(),
        description: values.description?.trim() || "",
        displayOrder: Number(values.displayOrder) || 0,
      };
      if (editingCategory) {
        const isParentCategory = !editingCategory?.parentId;
        if (isParentCategory) {
          const existingChildren = getDirectChildValues(editingCategory);
          const newChildren = getNewChildrenOnly({
            existing: existingChildren,
            submitted: normalizedChildren,
          });

          if (newChildren.length) {
            payload.children = newChildren;
          }
        }
      } else {
        // Creating a new category (parent): send all children as new
        if (normalizedChildren.length) {
          payload.children = Array.from(
            new Set(
              normalizedChildren.map((c) => String(c).trim()).filter(Boolean)
            )
          );
        }
      }

      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, payload);
        message.success("Category updated successfully");
      } else {
        await categoriesAPI.create(payload);
        message.success("Category created successfully");
      }
      setModalVisible(false);
      fetchCategories({
        search: debouncedSearch,
      });
    } catch (error) {
      message.error("Failed to save category");
    }
  };

  const totalCategoriesCount = categories.length;
  const activeCategoriesCount = categories.filter(
    (category) => category?.isActive !== false
  ).length;
  const parentCategoriesCount = categories.filter(
    (category) => !category?.parentId
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
      key: "parent",
      label: "Parent Categories",
      value: formatNumber(parentCategoriesCount),
      icon: <FolderOpenOutlined />,
      iconBg: "#fefce8",
      iconColor: "#ca8a04",
    },
  ];

  const parentCategories = categories.filter((category) => !category?.parentId);
  const subCategories = categories.filter((category) => !!category?.parentId);

  const subcategoryCountMap = categories.reduce((acc, category) => {
    if (category?.parentId) {
      const key = String(category.parentId);
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {});

  const childCategoryOptions = (() => {
    // For parent-category update: show its existing direct sub-categories.
    if (editingCategory && !editingCategory?.parentId) {
      const directChildren = getDirectChildRecords(editingCategory);
      return directChildren
        .map((child) => {
          const value =
            child.slug || child.name || String(child.id || child._id || "");
          const trimmed = String(value || "").trim();
          if (!trimmed) return null;
          return {
            label: child.name || trimmed,
            value: trimmed,
          };
        })
        .filter(Boolean);
    }

    // Default: existing global list (useful for add flow / fallback).
    return categories.reduce((options, category) => {
      const value =
        category.slug ||
        category.name ||
        String(category.id || category._id || "");
      if (!value) {
        return options;
      }
      if (!options.find((option) => option.value === value)) {
        options.push({ label: category.name || value, value });
      }
      return options;
    }, []);
  })();

  const getParentName = (parentId) => {
    if (!parentId) return "-";
    const parentKey = String(parentId);
    const parent = categories.find((c) => {
      const candidates = [c.id, c._id, c.slug];
      return candidates.some(
        (candidate) =>
          candidate !== undefined && String(candidate) === parentKey
      );
    });
    return parent ? parent.name : "-";
  };

  const getSubcategoryCount = (record) => {
    const keys = [record?.id, record?._id, record?.slug];
    for (const key of keys) {
      if (key === undefined || key === null) continue;
      const count = subcategoryCountMap[String(key)];
      if (typeof count === "number") {
        return count;
      }
    }
    return Array.isArray(record?.children) ? record.children.length : 0;
  };

  const getPaginationConfig = (label) => ({
    defaultPageSize: 8,
    showSizeChanger: true,
    pageSizeOptions: ["5", "10", "20", "50"],
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} ${label}`,
  });

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
      title: "Sub-Categories",
      dataIndex: "childCount",
      key: "childCount",
      align: "center",
      sorter: (a, b) => getSubcategoryCount(a) - getSubcategoryCount(b),
      render: (_, record) => (
        <Tag color="blue">{formatNumber(getSubcategoryCount(record))}</Tag>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: renderDescription,
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

  const subCategoryColumns = [
    {
      title: "Sub-Category",
      dataIndex: "name",
      key: "name",
      render: (text) => <div className="font-medium">{text}</div>,
    },
    {
      title: "Parent Category",
      dataIndex: "parentName",
      key: "parentName",
      render: (_, record) =>
        record.parentName || getParentName(record.parentId),
    },
    {
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
      render: (slug) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{slug}</code>
      ),
    },
    {
      title: "Products Count",
      dataIndex: "productsCount",
      key: "productsCount",
      sorter: (a, b) => (a.productsCount ?? 0) - (b.productsCount ?? 0),
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
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            title="Delete"
            danger
          />
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: "categories",
      label: (
        <span>
          Categories
          <span style={{ color: "#6b7280", marginLeft: 4 }}>
            ({parentCategories.length})
          </span>
        </span>
      ),
      children: (
        <Table
          columns={parentColumns}
          dataSource={parentCategories}
          rowKey={(record) => record?.id || record?._id || record?.slug}
          loading={loading}
          childrenColumnName="__children"
          pagination={getPaginationConfig("categories")}
        />
      ),
    },
    {
      key: "subcategories",
      label: (
        <span>
          Sub-Categories
          <span style={{ color: "#6b7280", marginLeft: 4 }}>
            ({subCategories.length})
          </span>
        </span>
      ),
      children: (
        <Table
          columns={subCategoryColumns}
          dataSource={subCategories}
          rowKey={(record) => record?.id || record?._id || record?.slug}
          loading={loading}
          childrenColumnName="__children"
          pagination={getPaginationConfig("sub-categories")}
        />
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
            Categories
          </h1>
          <Space
            className="flex flex-wrap gap-3"
            size="middle"
            style={{ justifyContent: "flex-end", flex: 1, minWidth: 220 }}
          >
            <Input
              allowClear
              placeholder="Search categories..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%", maxWidth: 340, flex: 1, minWidth: 200 }}
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
              Add Category
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
        <Tabs
          items={tabItems}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
        />
      </div>

      <Modal
        title={editingCategory ? "Edit Category" : "Add Category"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="Save"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: "Please enter category name" }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>
          {/* <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: "Please enter slug" }]}
          >
            <Input placeholder="category-slug" />
          </Form.Item> */}
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Add category description" />
          </Form.Item>
          <Form.Item
            name="children"
            label="Child Categories"
            tooltip="Type a value and press enter to add child categories"
          >
            <Select
              mode="tags"
              tokenSeparators={[","]}
              placeholder="Start typing to add child categories"
              options={childCategoryOptions}
              allowClear
              optionFilterProp="label"
            />
          </Form.Item>
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
        </Form>
      </Modal>

      <Drawer
        open={viewModalVisible}
        onClose={closeViewModal}
        width={520}
        title={viewingCategory?.name || "Category Details"}
      >
        {viewingCategory
          ? (() => {
              const directChildRecords = getDirectChildRecords(viewingCategory);
              return (
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Name">
                    {viewingCategory.name || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Slug">
                    {viewingCategory.slug || "-"}
                  </Descriptions.Item>
                  {/* <Descriptions.Item label="Child Categories">
                    {directChildRecords.length ? (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 4,
                        }}
                      >
                        {directChildRecords.map((child) => (
                          <Tag
                            key={
                              child.id || child._id || child.slug || child.name
                            }
                            color="#3f8600"
                          >
                            {child.name || child.slug}
                          </Tag>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </Descriptions.Item> */}
                  <Descriptions.Item label="Icon">
                    {viewingCategory.icon ? (
                      <IconPreview uri={viewingCategory.icon} size={64} />
                    ) : (
                      "-"
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Products Count">
                    {formatNumber(viewingCategory.productsCount)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    {viewingCategory.isActive === false ? "Inactive" : "Active"}
                  </Descriptions.Item>
                </Descriptions>
              );
            })()
          : null}
      </Drawer>
    </div>
  );
};

export default Categories;
