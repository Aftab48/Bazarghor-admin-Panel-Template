import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { categoriesAPI } from "../../services/api";

const Categories = () => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categoriesAPI.getAll();
      setCategories(Array.isArray(data) ? data : []);
      setPagination((prev) => ({
        ...prev,
        total: Array.isArray(data) ? data.length : 0,
      }));
    } catch (error) {
      message.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    form.setFieldsValue(category);
    setModalVisible(true);
  };

  const handleDelete = async (categoryId) => {
    try {
      await categoriesAPI.delete(categoryId);
      message.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      message.error("Failed to delete category");
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, values);
        message.success("Category updated successfully");
      } else {
        await categoriesAPI.create(values);
        message.success("Category created successfully");
      }
      setModalVisible(false);
      fetchCategories();
    } catch (error) {
      message.error("Failed to save category");
    }
  };

  const filteredCategories = categories.filter((category) => {
    if (!category) return false;
    const name = (category.name || "").toLowerCase();
    const slug = (category.slug || "").toLowerCase();
    const search = searchText.toLowerCase();
    return name.includes(search) || slug.includes(search);
  });

  useEffect(() => {
    // Keep pagination consistent with filters
    setPagination((prev) => ({
      ...prev,
      current: 1,
      total: filteredCategories.length,
    }));
  }, [searchText, filteredCategories.length]);

  const columns = [
    {
      title: "Icon",
      dataIndex: "icon",
      key: "icon",
      render: () => <AppstoreOutlined className="text-xl text-blue-600" />,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          {record.parentId && (
            <div className="text-xs text-gray-500">Subcategory</div>
          )}
        </div>
      ),
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
      sorter: (a, b) => a.productsCount - b.productsCount,
    },
    {
      title: "Parent Category",
      dataIndex: "parentId",
      key: "parentId",
      render: (parentId) => {
        if (!parentId) return "-";
        const parent = categories.find((c) => c.id === parentId);
        return parent ? parent.name : "-";
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Category"
            description="Are you sure you want to delete this category?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: "clamp(16px, 2vw, 24px)",
        background: "#f0f0f0",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          padding: "clamp(16px, 2vw, 24px)",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <div
          className="flex flex-wrap gap-3 justify-between items-center"
          style={{ gap: 12, rowGap: 12, alignItems: "flex-start" }}
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
          <Space className="flex flex-wrap gap-3" size="middle">
            <Input
              allowClear
              placeholder="Search categories..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%", maxWidth: 320 }}
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
      </div>

      <div
        style={{
          background: "#ffffff",
          padding: "clamp(16px, 2vw, 24px)",
          borderRadius: "8px",
        }}
      >
        <Table
          columns={columns}
          dataSource={filteredCategories || []}
          rowKey={(record) => record?.id || record?._id || record?.slug}
          loading={loading}
          pagination={{
            ...pagination,
            total: filteredCategories.length,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} categories`,
          }}
          onChange={(pager) =>
            setPagination({ ...pager, total: filteredCategories.length })
          }
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
          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: "Please enter slug" }]}
          >
            <Input placeholder="category-slug" />
          </Form.Item>
          <Form.Item name="icon" label="Icon Name">
            <Input placeholder="icon-name" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;
