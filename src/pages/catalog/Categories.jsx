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
  Select,
  Tag,
  Image,
  message,
  Descriptions,
  Tabs,
  Row,
  Col,
  Modal,
  Checkbox,
  Tooltip,
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
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { categoriesAPI } from "../../services/api";
import { NeutralButton } from "../../components/common/NeutralButton";
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
  const [icon, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const debouncedSearch = useDebounce(searchText, 400);
  const hasInitialized = useRef(false);
  const [addChildModalVisible, setAddChildModalVisible] = useState(false);
  const [_removedChildren, setRemovedChildren] = useState([]);
  const [newChildTags, setNewChildTags] = useState([]);
  const [selectedDeactivated, setSelectedDeactivated] = useState([]);
  const [originalChildren, setOriginalChildren] = useState([]);

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
    // Return display names (not slugs) for UI display
    const values = children
      .map((child) => {
        // Prefer name for display, fallback to slug converted to display format
        return (
          child.name ||
          slugToDisplay(child.slug) ||
          String(child.id || child._id || "")
        );
      })
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
    setIconFile(null);
    setIconPreview(null);
    setRemovedChildren([]);
    setSelectedDeactivated([]);
    setNewChildTags([]);
    setOriginalChildren([]);
    setModalVisible(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);

    const isParentCategory = !category?.parentId;
    const derivedChildren = isParentCategory
      ? getDirectChildValues(category)
      : [];

    // Store original children for comparison when submitting
    const originalChildRecords = isParentCategory
      ? getDirectChildRecords(category)
      : [];
    setOriginalChildren(originalChildRecords);

    form.setFieldsValue({
      ...category,
      children: derivedChildren, // Populate existing children
      description: category?.description || "",
      displayOrder: Number(category?.displayOrder ?? 0),
    });
    // show existing icon (if any) as preview when editing
    setIconFile(null);
    setIconPreview(category?.icon || null);
    setRemovedChildren([]); // Reset removed children when opening edit
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

  // Get deactivated children (removed ones that were originally children)
  const getDeactivatedChildren = () => {
    if (!editingCategory || editingCategory?.parentId) return [];

    const originalChildren = getDirectChildRecords(editingCategory);
    const currentChildren = form.getFieldValue("children") || [];
    const currentChildrenSet = new Set(
      currentChildren.map((c) => {
        // Compare using display names
        const displayName = String(c).trim().toLowerCase();
        return displayName;
      })
    );

    // Find children that were removed (exist in original but not in current)
    return originalChildren.filter((child) => {
      const childDisplayName = (
        child.name ||
        slugToDisplay(child.slug) ||
        String(child.id || child._id || "")
      )
        .trim()
        .toLowerCase();
      return !currentChildrenSet.has(childDisplayName);
    });
  };

  // Handle removing a child category
  const handleRemoveChild = (childDisplayNameToRemove) => {
    const currentChildren = form.getFieldValue("children") || [];
    const updatedChildren = currentChildren.filter(
      (child) =>
        String(child).trim().toLowerCase() !==
        String(childDisplayNameToRemove).trim().toLowerCase()
    );
    form.setFieldsValue({ children: updatedChildren });

    // Find the removed child in original children by matching display name
    const removedChild = originalChildren.find((child) => {
      const childDisplayName = (
        child.name ||
        slugToDisplay(child.slug) ||
        String(child.id || child._id || "")
      )
        .trim()
        .toLowerCase();
      return (
        childDisplayName ===
        String(childDisplayNameToRemove).trim().toLowerCase()
      );
    });

    // Track removed child if it was an original child
    if (removedChild) {
      setRemovedChildren((prev) => {
        const exists = prev.some(
          (r) => (r.id || r._id) === (removedChild.id || removedChild._id)
        );
        if (!exists) return [...prev, removedChild];
        return prev;
      });
    }
  };

  // Handle adding children from modal
  const handleAddChildren = (selectedChildren, newChildValues) => {
    const currentChildren = form.getFieldValue("children") || [];
    const newChildrenSet = new Set(
      currentChildren.map((c) => String(c).trim().toLowerCase())
    );

    const addChildIfNew = (displayName) => {
      const clean = String(displayName || "").trim();
      if (!clean) return;
      const key = clean.toLowerCase();
      if (newChildrenSet.has(key)) return;
      newChildrenSet.add(key);
      currentChildren.push(clean);
    };

    // Add selected deactivated children (as display names)
    // selectedChildren contains slugs, we need to find the category and get its name
    selectedChildren.forEach((childSlug) => {
      // Find the category by slug to get its actual name
      const childCategory = categories.find(
        (cat) =>
          cat.slug === childSlug ||
          cat.id === childSlug ||
          cat._id === childSlug
      );
      // Use the category's name if found, otherwise convert slug to display format
      const displayName = childCategory
        ? childCategory.name || slugToDisplay(childCategory.slug)
        : slugToDisplay(childSlug);
      addChildIfNew(displayName);
    });

    // Add new child names (array from Select tags, or fallback to split string)
    const names = Array.isArray(newChildValues)
      ? newChildValues
      : String(newChildValues || "")
          .split(/[\s,]+/)
          .map((s) => s.trim())
          .filter(Boolean);

    names.forEach(addChildIfNew);

    form.setFieldsValue({ children: currentChildren });
    setAddChildModalVisible(false);
    setNewChildTags([]);
    setSelectedDeactivated([]);

    // Remove from removedChildren if it was there
    if (selectedChildren.length > 0) {
      setRemovedChildren((prev) =>
        prev.filter((r) => {
          const rSlug = r.slug || String(r.id || r._id || "");
          return !selectedChildren.some(
            (sc) =>
              String(sc).trim().toLowerCase() ===
              String(rSlug).trim().toLowerCase()
          );
        })
      );
    }
  };

  const handleSubmit = async (values) => {
    try {
      const normalizedChildren = Array.isArray(values.children)
        ? values.children.map((child) => child.trim()).filter(Boolean)
        : [];

      // Backend expects category names (display text), not slugs
      // For existing categories, find their actual names
      // For new categories, use the display name as the name
      const childrenAsNames = normalizedChildren.map((displayName) => {
        // Check if this matches an existing category's display name
        const existingCategory = categories.find((cat) => {
          const catDisplayName = cat.name || slugToDisplay(cat.slug);
          return catDisplayName === displayName || cat.name === displayName;
        });
        // If it's an existing category, use its actual name
        // Otherwise, use the display name as the new category name
        return existingCategory ? existingCategory.name : displayName;
      });

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
          // Always send children array as names for parent categories
          payload.children = Array.from(
            new Set(childrenAsNames.filter(Boolean))
          );

          // Calculate which children were removed by comparing original with current
          // Create a set of current children (using both display names and actual names for matching)
          const currentChildrenSet = new Set(
            childrenAsNames.map((name) => String(name).trim().toLowerCase())
          );

          // Find removed children - those in originalChildren but not in current
          // Match by comparing display names (what's shown in UI) with original children
          const removedChildNames = originalChildren
            .filter((child) => {
              // Get the display name that would be shown in the UI
              const childDisplayName = (
                child.name ||
                slugToDisplay(child.slug) ||
                String(child.id || child._id || "")
              )
                .trim()
                .toLowerCase();
              // Check if this display name is NOT in the current children list
              return !currentChildrenSet.has(childDisplayName);
            })
            .map((child) => {
              // Backend expects actual category names, trimmed and validated
              const name = (child.name || "").trim();
              // Ensure name is valid: non-empty, between 1-120 characters
              if (name && name.length >= 1 && name.length <= 120) {
                return name;
              }
              return null;
            })
            .filter(
              (name) => name !== null && name !== undefined && name !== ""
            ); // Strict filtering

          // Send removed children to backend only if we have valid names
          // This prevents validation errors when sending via FormData
          if (removedChildNames.length > 0) {
            payload.removeChildren = removedChildNames;
          }
        }
      } else {
        // Creating a new category (parent): send all children as names
        if (childrenAsNames.length) {
          payload.children = Array.from(
            new Set(childrenAsNames.filter(Boolean))
          );
        }
      }

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
                String(item).trim() !== ""
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
          await categoriesAPI.update(editingCategory.id, fd);
          message.success("Category updated successfully");
        } else {
          await categoriesAPI.create(fd);
          message.success("Category created successfully");
        }
      } else {
        if (editingCategory) {
          await categoriesAPI.update(editingCategory.id, payload);
          message.success("Category updated successfully");
        } else {
          await categoriesAPI.create(payload);
          message.success("Category created successfully");
        }
      }

      setModalVisible(false);
      setIconFile(null);
      setIconPreview(null);
      fetchCategories({
        search: debouncedSearch,
      });
    } catch {
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

  // Note: childCategoryOptions removed as it's not currently used in the UI

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
          size="middle"
          scroll={{ x: 960 }}
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
          size="middle"
          scroll={{ x: 960 }}
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
                border: "0.2px solid #3c2f3d",
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

      {/* Add/Edit Category Drawer (refreshed design) */}
      <Drawer
        title={editingCategory ? "Edit Category" : "Add Category"}
        open={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setIconFile(null);
          setIconPreview(null);
          form.resetFields();
          setAddChildModalVisible(false);
          setSelectedDeactivated([]);
          setNewChildTags([]);
          setRemovedChildren([]);
          setOriginalChildren([]);
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

          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Space size={4}>
                <span>Child Categories</span>
                <Tooltip
                  title={
                    editingCategory?.parentId
                      ? "Only parent categories can have child categories"
                      : "Manage child categories for this parent category"
                  }
                >
                  <QuestionCircleOutlined
                    style={{ color: "rgba(0, 0, 0, 0.45)", cursor: "help" }}
                  />
                </Tooltip>
              </Space>
              {!editingCategory?.parentId && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setAddChildModalVisible(true)}
                  style={{
                    background: "#9dda52",
                    borderColor: "#9dda52",
                    color: "#3c2f3d",
                    border: "0.2px solid #3c2f3d",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  Add New Children
                </Button>
              )}
            </div>
          </div>

          <Form.Item
            name="children"
            extra={
              editingCategory?.parentId
                ? "Subcategories cannot have child categories"
                : "Click +Add to add new child categories or restore previously removed ones"
            }
          >
            {(() => {
              const currentChildren = form.getFieldValue("children") || [];
              if (editingCategory?.parentId) {
                return (
                  <div style={{ color: "#999" }}>
                    Subcategories cannot have child categories
                  </div>
                );
              }

              if (currentChildren.length === 0) {
                return (
                  <div style={{ color: "#999", padding: "8px 0" }}>
                    No child categories. Click +Add to add some.
                  </div>
                );
              }

              return (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    padding: "8px 0",
                  }}
                >
                  {currentChildren.map((child, index) => (
                    <Tag
                      key={`${child}-${index}`}
                      closable
                      onClose={() => handleRemoveChild(child)}
                      style={{
                        margin: 0,
                        padding: "4px 8px",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {child}
                    </Tag>
                  ))}
                </div>
              );
            })()}
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
            <Button
              type="primary"
              onClick={() => form.submit()}
              style={{
                background: "#9dda52",
                borderColor: "#9dda52",
                color: "#3c2f3d",
                border: "0.2px solid #3c2f3d",
              }}
            >
              Save Category
            </Button>
          </div>
        </Form>
      </Drawer>

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
                  <Descriptions.Item label="Child Categories">
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
                            color="#9dda52"
                          >
                            {child.name || child.slug}
                          </Tag>
                        ))}
                      </div>
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

      {/* Add Child Categories Modal */}
      <Modal
        open={addChildModalVisible}
        onOk={() => {
          if (selectedDeactivated.length > 0 || newChildTags.length > 0) {
            handleAddChildren(selectedDeactivated, newChildTags);
            setSelectedDeactivated([]);
            setNewChildTags([]);
          } else {
            message.warning(
              "Please select categories to restore or enter a new category name"
            );
          }
        }}
        onCancel={() => {
          setAddChildModalVisible(false);
          setNewChildTags([]);
          setSelectedDeactivated([]);
        }}
        okText="Add"
        okButtonProps={{
          style: {
            background: "#9dda52",
            borderColor: "#9dda52",
            color: "#3c2f3d",
            border: "0.2px solid #3c2f3d",
          },
        }}
        style={{ color: "#f0f0f0" }}
        cancelText="Cancel"
        cancelButtonProps={{
          style: { color: "#f0f0f0", backgroundColor: "#3c2f3d" },
        }}
        width={600}
        zIndex={1001}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Deactivated Children Section */}
          {(() => {
            const deactivated = getDeactivatedChildren();

            if (deactivated.length > 0) {
              return (
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>
                    Previously Removed Categories (Select to restore):
                  </div>
                  <div
                    style={{
                      maxHeight: 200,
                      overflowY: "auto",
                      border: "1px solid #d9d9d9",
                      borderRadius: 4,
                      padding: 8,
                    }}
                  >
                    <Checkbox.Group
                      value={selectedDeactivated}
                      onChange={setSelectedDeactivated}
                      style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {deactivated.map((child) => {
                        const childSlug =
                          child.slug || String(child.id || child._id || "");
                        const childDisplayName =
                          child.name || slugToDisplay(child.slug) || childSlug;
                        return (
                          <Checkbox
                            key={child.id || child._id}
                            value={childSlug}
                          >
                            {childDisplayName}
                          </Checkbox>
                        );
                      })}
                    </Checkbox.Group>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Add New Child Category Section */}
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              Add New Child Category:
            </div>
            <Select
              mode="tags"
              value={newChildTags}
              onChange={setNewChildTags}
              tokenSeparators={[","]}
              placeholder="Enter sub-category names"
              style={{ width: "100%" }}
              open={false}
              allowClear
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Categories;
