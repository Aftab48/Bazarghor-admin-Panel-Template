import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  message,
  Avatar,
  Form,
  Select,
  DatePicker,
  Switch,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { deliveryPartnersAPI } from "../../services/api";
import StatusTag from "../../components/common/StatusTag";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/permissions";
import dayjs from "dayjs";

const DeliveryAgentList = () => {
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [viewForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const { roles } = useAuth();

  const canAddAgent = () => {
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
    fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const data = await deliveryPartnersAPI.getAll();
      if (Array.isArray(data)) {
        setAgents(data);
        setPagination((prev) => ({ ...prev, total: data.length }));
      } else {
        setAgents([]);
        setPagination((prev) => ({ ...prev, total: 0 }));
      }
    } catch (error) {
      message.error(
        `Failed to fetch delivery agents: ${error.message || "Unknown error"}`
      );
      setAgents([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const handleView = (record) => {
    setSelectedRecord(record);
    viewForm.setFieldsValue({
      firstName: record?.firstName || "",
      lastName: record?.lastName || "",
      email: record?.email || "",
      mobNo: record?.mobNo || record?.phone || "",
      gender: record?.gender || "",
    });
    setViewModalVisible(true);
  };

  const handleEdit = async (record) => {
    try {
      const data = await deliveryPartnersAPI.getById(record.id || record._id);
      setSelectedRecord(data);
      editForm.setFieldsValue({
        firstName: data?.firstName || "",
        lastName: data?.lastName || "",
        email: data?.email || "",
        mobNo: data?.mobNo || data?.phone || "",
        gender: data?.gender || "",
        dob: data?.dob ? dayjs(data.dob) : null,
        vehicleType: data?.vehicleDetails?.vehicleType || "",
        vehicleNo: data?.vehicleDetails?.vehicleNo || "",
        driverLicenseNo: data?.vehicleDetails?.driverLicenseNo || "",
        isActive: data?.isActive ?? false,
      });
      setVehicleDetails(data?.vehicleDetails || null);
      setEditModalVisible(true);
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to fetch agent details"
      );
    }
  };

  const handleDelete = async (record) => {
    const agentId = record._id || record.id || record.userId;
    if (!agentId) {
      message.error("Agent id missing; cannot delete");
      return;
    }
    try {
      await deliveryPartnersAPI.delete(agentId);
      setAgents((prev) =>
        prev.filter((a) => (a.id || a._id || a.userId) !== agentId)
      );
      message.success("Agent deleted successfully");
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to delete agent");
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
      if (values.dob) {
        formData.append("dob", values.dob.format("YYYY-MM-DD"));
      }
      if (values.gender) formData.append("gender", values.gender);
      if (values.vehicleType)
        formData.append("vehicleType", values.vehicleType);
      if (values.vehicleNo) formData.append("vehicleNo", values.vehicleNo);
      if (values.driverLicenseNo)
        formData.append("driverLicenseNo", values.driverLicenseNo);
      formData.append("isActive", values.isActive ? "true" : "false");

      await deliveryPartnersAPI.update(
        selectedRecord.id || selectedRecord._id,
        formData
      );
      message.success("Delivery agent updated successfully");
      setEditModalVisible(false);
      editForm.resetFields();
      setSelectedRecord(null);
      fetchAgents();
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to update delivery agent"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Agent",
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
      title: "Joined",
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
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => {
        if (isActive === undefined || isActive === null)
          return <StatusTag status="unknown" />;
        const status = isActive ? "Active" : "InActive";
        return <StatusTag status={status} />;
      },
      filters: [
        { text: "Active", value: true },
        { text: "InActive", value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
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

  const handleAddAgent = async (values) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("firstName", values.firstName);
      formData.append("lastName", values.lastName);
      formData.append("mobNo", values.mobNo);
      formData.append("email", values.email);
      formData.append("dob", values.dob ? values.dob.format("YYYY-MM-DD") : "");
      formData.append("gender", values.gender);
      formData.append("roleType", "DELIVERY_PARTNER");

      await deliveryPartnersAPI.create(formData);
      message.success("Delivery agent created successfully");
      setAddModalVisible(false);
      form.resetFields();
      fetchAgents();
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to create delivery agent"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    if (!agent) return false;
    const name = (
      agent.name ||
      `${agent.firstName || ""} ${agent.lastName || ""}`.trim() ||
      ""
    ).toLowerCase();
    const email = (agent.email || "").toLowerCase();
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
          boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
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
            Delivery Partner
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
            {canAddAgent() && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddModalVisible(true)}
                style={{
                  background: "#9dda52",
                  color: "#3c2f3d",
                  width: "100%",
                  maxWidth: 180,
                }}
              >
                Add Agent
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
          boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
        }}
      >
        <Table
          columns={columns}
          dataSource={filteredAgents || []}
          rowKey={(record) => record?.id || record?._id || Math.random()}
          loading={loading}
          pagination={{
            ...pagination,
            total: filteredAgents?.length || 0,
            showTotal: (total) => `Total ${total} delivery agents`,
          }}
          onChange={(newPagination) => setPagination(newPagination)}
          locale={{ emptyText: "No agents found" }}
          scroll={{ x: 1000 }}
        />
      </div>

      <Modal
        title="Add New Delivery Agent"
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
        centered
        style={{ maxWidth: "95vw" }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddAgent}
          style={{ marginTop: "24px" }}
        >
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: "Please enter first name" }]}
          >
            <Input placeholder="Enter first name" size="large" />
          </Form.Item>

          <Form.Item name="lastName" label="Last Name">
            <Input placeholder="Enter last name" size="large" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="Enter email" size="large" />
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
            <Input placeholder="Enter mobile number" size="large" />
          </Form.Item>

          <Form.Item name="dob" label="Date of Birth">
            <DatePicker
              style={{ width: "100%" }}
              size="large"
              format="YYYY-MM-DD"
              placeholder="Select date of birth"
            />
          </Form.Item>

          <Form.Item name="gender" label="Gender">
            <Select placeholder="Select gender" size="large">
              <Select.Option value="MALE">Male</Select.Option>
              <Select.Option value="FEMALE">Female</Select.Option>
              <Select.Option value="OTHER">Other</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="roleType"
            label="Role Type"
            initialValue="DELIVERY_PARTNER"
            rules={[{ required: true }]}
          >
            <Select size="large" disabled>
              <Select.Option value="DELIVERY_PARTNER">
                Delivery Partner
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: "24px" }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{
                  background: "#9dda52",
                  borderColor: "#9dda52",
                  color: "#3c2f3d",
                  fontWeight: "bold",
                }}
              >
                Create Delivery Agent
              </Button>
              <Button
                onClick={() => {
                  setAddModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Delivery Agent"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
          setSelectedRecord(null);
        }}
        footer={null}
        width={700}
        centered
        style={{ maxWidth: "95vw" }}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdate}
          style={{ marginTop: "24px" }}
        >
          <Form.Item name="firstName" label="First Name">
            <Input placeholder="Enter first name" size="large" />
          </Form.Item>

          <Form.Item name="lastName" label="Last Name">
            <Input placeholder="Enter last name" size="large" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: "email", message: "Please enter a valid email" }]}
          >
            <Input placeholder="Enter email" size="large" />
          </Form.Item>

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
            <Input placeholder="Enter mobile number" size="large" />
          </Form.Item>

          <Form.Item name="dob" label="Date of Birth">
            <DatePicker
              style={{ width: "100%" }}
              size="large"
              format="YYYY-MM-DD"
              placeholder="Select date of birth"
            />
          </Form.Item>

          <Form.Item name="gender" label="Gender">
            <Select placeholder="Select gender" size="large">
              <Select.Option value="MALE">Male</Select.Option>
              <Select.Option value="FEMALE">Female</Select.Option>
              <Select.Option value="OTHER">Other</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="vehicleType" label="Vehicle Type">
            <Input placeholder="Enter vehicle type" size="large" />
          </Form.Item>

          <Form.Item name="vehicleNo" label="Vehicle Number">
            <Input placeholder="Enter vehicle number" size="large" />
          </Form.Item>

          <Form.Item name="driverLicenseNo" label="Driver License No">
            <Input placeholder="Enter license number" size="large" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active Status"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch
              checkedChildren="Active"
              unCheckedChildren="Inactive"
              style={{
                backgroundColor: editForm.getFieldValue("isActive")
                  ? "#23ac6d"
                  : "#ffbc2c",
                borderColor: editForm.getFieldValue("isActive")
                  ? "#23ac6d"
                  : "#ffbc2c",
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                width: "100%",
              }}
            >
              <Button
                onClick={() => {
                  setEditModalVisible(false);
                  editForm.resetFields();
                  setSelectedRecord(null);
                }}
                style={{
                  backgroundColor: "#3c2f3d",
                  color: "#ffffff",
                  borderColor: "#3c2f3d",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#3c2f3d";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#3c2f3d";
                  e.currentTarget.style.color = "#ffffff";
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{
                  background: "#9dda52",
                  color: "#3c2f3d",
                }}
              >
                Update Agent
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Delivery Agent Details"
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          viewForm.resetFields();
          setSelectedRecord(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setViewModalVisible(false);
              viewForm.resetFields();
              setSelectedRecord(null);
            }}
            style={{
              color: "#ffffff",
              backgroundColor: "#3c2f3d",
              borderColor: "#3c2f3d",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#3c2f3d";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#3c2f3d";
              e.currentTarget.style.color = "#ffffff";
            }}
          >
            Close
          </Button>,
        ]}
        width={700}
        centered
        style={{ maxWidth: "95vw" }}
      >
        <Form
          form={viewForm}
          layout="vertical"
          style={{ marginTop: "24px", alignItems: "center" }}
        >
          <Form.Item style={{ textAlign: "center" }}>
            <Avatar
              size={64}
              src={
                selectedRecord?.profilePicture?.uri ||
                selectedRecord?.avatar ||
                selectedRecord?.profilePicture
              }
              icon={<UserOutlined />}
            />
          </Form.Item>
          <Form.Item name="firstName" label="First Name">
            <Input readOnly size="large" />
          </Form.Item>

          <Form.Item name="lastName" label="Last Name">
            <Input readOnly size="large" />
          </Form.Item>

          <Form.Item name="email" label="Email">
            <Input readOnly size="large" />
          </Form.Item>

          <Form.Item name="mobNo" label="Mobile Number">
            <Input readOnly size="large" />
          </Form.Item>

          <Form.Item name="gender" label="Gender">
            <Input readOnly size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DeliveryAgentList;
