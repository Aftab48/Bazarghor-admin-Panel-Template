import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  message,
  Avatar,
  Form,
  Select,
  DatePicker,
  Switch,
  Drawer,
  Row,
  Col,
  Descriptions,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { customersAPI } from "../../services/api";
import dayjs from "dayjs";
import StatusTag from "../../components/common/StatusTag";
import {
  NeutralButton,
  AddNeutralButton,
} from "../../components/common/NeutralButton";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/permissions";
const getStatusColor = (checked) => (checked ? "#9dda52" : "#ffbc2c ");

const CustomerList = () => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [viewForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const { roles } = useAuth();

  const canAddCustomer = () => {
    if (!roles || roles.length === 0) return false;
    const currentRole = roles[0];
    const normalizedRole =
      typeof currentRole === "string"
        ? currentRole
        : currentRole?.code || currentRole?.roleCode || String(currentRole);
    return (
      normalizedRole === ROLES.SUPER_ADMIN || normalizedRole === ROLES.ADMIN
    );
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customersAPI.getAll();
      if (Array.isArray(data)) {
        setCustomers(data);
        setPagination({ ...pagination, total: data.length });
      } else {
        setCustomers([]);
        setPagination({ ...pagination, total: 0 });
      }
    } catch (error) {
      message.error(
        `Failed to fetch customers: ${error.message || "Unknown error"}`
      );
      setCustomers([]);
      setPagination({ ...pagination, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (record) => {
    try {
      const data = await customersAPI.getById(record.id || record._id);
      setSelectedRecord(data);
      viewForm.setFieldsValue({
        firstName: data?.firstName || "",
        lastName: data?.lastName || "",
        email: data?.email || "",
        mobNo: data?.mobNo || "",
        dob: data?.dob ? dayjs(data.dob) : null,
        isActive: data?.isActive,
        status: data?.status || "",
        roles: Array.isArray(data?.roles)
          ? data.roles.join(", ")
          : data?.role || "",
      });
      setViewModalVisible(true);
    } catch {
      message.error("Failed to fetch customer details");
    }
  };

  const handleEdit = async (record) => {
    try {
      const data = await customersAPI.getById(record.id || record._id);
      setSelectedRecord(data);
      form.setFieldsValue({
        firstName: data?.firstName || "",
        lastName: data?.lastName || "",
        email: data?.email || "",
        mobNo: data?.mobNo || "",
        dob: data?.dob ? dayjs(data.dob) : null,
        isActive: data?.isActive ?? false,
      });
      setEditModalVisible(true);
    } catch {
      message.error("Failed to fetch customer details");
    }
  };

  const handleUpdate = async (values) => {
    if (!selectedRecord) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("firstName", values.firstName);
      formData.append("lastName", values.lastName);
      formData.append("mobNo", values.mobNo);
      formData.append("email", values.email);
      if (values.gender) formData.append("gender", values.gender);
      if (values.dob) {
        formData.append("dob", values.dob.format("YYYY-MM-DD"));
      }
      formData.append("isActive", values.isActive ? "true" : "false");

      await customersAPI.update(
        selectedRecord.id || selectedRecord._id,
        formData
      );
      message.success("Customer updated successfully");
      setEditModalVisible(false);
      form.resetFields();
      setSelectedRecord(null);
      fetchCustomers();
    } catch (err) {
      message.error(
        err?.response?.data?.message || "Failed to update customer"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    const customerId = record._id || record.id || record.userId;
    if (!customerId) {
      message.error("Customer id missing; cannot delete");
      return;
    }
    try {
      await customersAPI.deleteCustomer(customerId);
      setCustomers((prev) =>
        prev.filter((c) => (c.id || c._id || c.userId) !== customerId)
      );
      message.success("Customer deleted successfully");
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to delete customer"
      );
    }
  };

  const onToggleActive = async (record, nextStatus) => {
    const customerId = record._id || record.id || record.userId;
    if (!customerId) {
      message.error("Customer id missing; cannot update status");
      return;
    }

    setTogglingId(customerId);
    try {
      const formData = new FormData();
      formData.append("isActive", nextStatus ? "true" : "false");
      await customersAPI.update(customerId, formData);

      setCustomers((prev) =>
        prev.map((c) =>
          (c._id || c.id || c.userId) === customerId
            ? { ...c, isActive: nextStatus }
            : c
        )
      );

      message.success(
        `Customer marked as ${nextStatus ? "active" : "inactive"}`
      );
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to update status"
      );
    } finally {
      setTogglingId(null);
    }
  };

  const columns = [
    {
      title: "Customer Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => {
        if (!record) return "-";
        const name =
          text ||
          `${record.firstName || ""} ${record.lastName || ""}`.trim() ||
          "N/A";
        const email = record.email || "N/A";
        const avatar =
          record.avatar || record.profilePicture?.uri || record.profilePicture;
        return (
          <Space>
            <Avatar src={avatar} icon={<UserOutlined />} />
            <div>
              <div className="font-medium">{name}</div>
              <div className="text-xs text-gray-500">{email}</div>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (phone, record) => phone || record.mobNo || "N/A",
    },
    {
      title: "Active-Status",
      key: "isActiveToggle",
      render: (_, r) => {
        const id = r?._id || r?.id || r?.userId;
        const isActive = !!r?.isActive;
        return (
          <Switch
            checked={isActive}
            loading={togglingId === id}
            onChange={(checked) => onToggleActive(r, checked)}
            checkedChildren="Active"
            unCheckedChildren="InActive"
            style={{
              backgroundColor: getStatusColor(isActive),
              borderColor: getStatusColor(isActive),
            }}
          />
        );
      },
    },
    {
      title: "Total Orders",
      dataIndex: "totalOrders",
      key: "totalOrders",
      render: (count) => count || 0,
      sorter: (a, b) => (a.totalOrders || 0) - (b.totalOrders || 0),
    },
    {
      title: "Total Spent",
      dataIndex: "totalSpent",
      key: "totalSpent",
      render: (amount) => `₹${(amount || 0).toLocaleString()}`,
      sorter: (a, b) => (a.totalSpent || 0) - (b.totalSpent || 0),
    },
    {
      title: "Joined Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (date ? new Date(date).toLocaleDateString() : "N/A"),
      sorter: (a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateA - dateB;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
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

  const handleAddCustomer = async (values) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("firstName", values.firstName);
      formData.append("lastName", values.lastName);
      formData.append("mobNo", values.mobNo);
      formData.append("email", values.email);
      formData.append("roleType", "CUSTOMER");

      await customersAPI.create(formData);
      message.success("Customer created successfully");
      setAddModalVisible(false);
      form.resetFields();
      fetchCustomers();
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to create customer"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    if (!customer) return false;
    const name = (
      customer.name ||
      `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
      ""
    ).toLowerCase();
    const email = (customer.email || "").toLowerCase();
    const search = searchText.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

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
            Customers
          </h1>
          <div
            className="flex items-center gap-3"
            style={{
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "flex-end",
              flex: 1,
              minWidth: 260,
            }}
          >
            <Input
              placeholder="Search customers..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%", minWidth: 220, flex: 1, maxWidth: 360 }}
              size="large"
            />
            {canAddCustomer() && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddModalVisible(true)}
                style={{
                  background: "#9dda52",
                  color: "#3c2f3d",
                  width: "100%",
                  maxWidth: 180,
                  border: "0.2px solid #3c2f3d",
                }}
              >
                Add Customer
              </Button>
            )}
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
          columns={columns}
          dataSource={filteredCustomers || []}
          rowKey={(record) => record?.id || record?._id || Math.random()}
          loading={loading}
          pagination={{
            ...pagination,
            total: filteredCustomers?.length || 0,
            showTotal: (total) => `Total ${total} customers`,
          }}
          onChange={(newPagination) => setPagination(newPagination)}
          locale={{ emptyText: "No customers found" }}
          scroll={{ x: 900 }}
        />
      </div>

      {/* View Drawer */}
      <Drawer
        title="Customer Details"
        open={viewModalVisible}
        onClose={() => {
          setViewModalVisible(false);
          viewForm.resetFields();
          setSelectedRecord(null);
        }}
        width={600}
        destroyOnClose
        placement="right"
      >
        <div
          style={{
            marginTop: 12,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Avatar
              size={72}
              src={selectedRecord?.profilePicture?.uri}
              icon={<UserOutlined />}
              style={{ backgroundColor: "#f2f2f2" }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#3c2f3d" }}>
                {selectedRecord?.firstName || "Customer"}
              </div>
              <div style={{ color: "#555" }}>
                {selectedRecord?.email || "N/A"}
              </div>
            </div>
          </div>

          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="First Name">
              {selectedRecord?.firstName || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Last Name">
              {selectedRecord?.lastName || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedRecord?.email || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Mobile">
              {selectedRecord?.mobNo || selectedRecord?.phone || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Date of Birth">
              {selectedRecord?.dob
                ? dayjs(selectedRecord?.dob).format("YYYY-MM-DD")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Active Status">
              <StatusTag
                status={selectedRecord?.isActive ? "Active" : "Inactive"}
                style={{
                  backgroundColor: getStatusColor(selectedRecord?.isActive),
                  borderColor: getStatusColor(selectedRecord?.isActive),
                }}
              />
            </Descriptions.Item>
          </Descriptions>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <NeutralButton
              onClick={() => {
                setViewModalVisible(false);
                viewForm.resetFields();
                setSelectedRecord(null);
              }}
            >
              Close
            </NeutralButton>
          </div>
        </div>
      </Drawer>

      {/* Edit Drawer */}
      <Drawer
        title="Edit Customer"
        open={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          form.resetFields();
          setSelectedRecord(null);
        }}
        width={640}
        destroyOnClose
        placement="right"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
          style={{ marginTop: 12 }}
        >
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="firstName" label="First Name">
                <Input placeholder="Enter first name" size="middle" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="lastName" label="Last Name">
                <Input placeholder="Enter last name" size="middle" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: "email", message: "Please enter a valid email" }]}
          >
            <Input placeholder="Enter email" size="middle" />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="mobNo"
                label="Mobile Number"
                rules={[
                  {
                    pattern: /^[0-9]{10}$/,
                    message: "Please enter a valid 10-digit mobile number",
                  },
                ]}
              >
                <Input placeholder="Enter mobile number" size="middle" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="dob" label="Date of Birth">
                <DatePicker
                  style={{ width: "100%" }}
                  size="middle"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="isActive"
            label="Active Status"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch
              checkedChildren="Active"
              unCheckedChildren="InActive"
              style={{
                backgroundColor: getStatusColor(form.getFieldValue("isActive")),
                borderColor: getStatusColor(form.getFieldValue("isActive")),
              }}
            />
          </Form.Item>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              width: "100%",
            }}
          >
            <NeutralButton
              onClick={() => {
                setEditModalVisible(false);
                form.resetFields();
                setSelectedRecord(null);
              }}
            >
              Cancel
            </NeutralButton>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              style={{
                background: "#9dda52",
                color: "#3c2f3d",
                border: "0.2px solid #3c2f3d",
              }}
            >
              Update Customer
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Add Drawer */}
      <Drawer
        title="Add New Customer"
        open={addModalVisible}
        onClose={() => {
          setAddModalVisible(false);
          form.resetFields();
        }}
        width={640}
        destroyOnClose
        placement="right"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddCustomer}
          style={{ marginTop: 12 }}
        >
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: "Please enter first name" }]}
              >
                <Input placeholder="Enter first name" size="middle" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="lastName" label="Last Name">
                <Input placeholder="Enter last name" size="middle" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: "email", message: "Please enter a valid email" }]}
          >
            <Input placeholder="Enter email" size="middle" />
          </Form.Item>

          <Form.Item
            name="mobNo"
            label="Mobile Number"
            rules={[
              { required: true, message: "Please enter mobile number" },
              {
                pattern: /^[0-9]{10}$/,
                message: "Please enter a valid 10-digit mobile number",
              },
            ]}
          >
            <Input placeholder="Enter mobile number" size="middle" />
          </Form.Item>

          <Form.Item
            name="roleType"
            label="Role Type"
            initialValue="CUSTOMER"
            rules={[{ required: true }]}
          >
            <Select size="middle" disabled>
              <Select.Option value="CUSTOMER">Customer</Select.Option>
            </Select>
          </Form.Item>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              width: "100%",
            }}
          >
            <NeutralButton
              onClick={() => {
                setAddModalVisible(false);
                form.resetFields();
              }}
            >
              Cancel
            </NeutralButton>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              style={{ background: "#9dda52", color: "#3c2f3d" }}
            >
              Create Customer
            </Button>
          </div>
        </Form>
      </Drawer>
    </div>
  );
};

export default CustomerList;
