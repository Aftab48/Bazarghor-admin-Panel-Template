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
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { deliveryPartnersAPI } from "../../services/api";
import StatusTag from "../../components/common/StatusTag";
import {
  NeutralButton,
  AddNeutralButton,
} from "../../components/common/NeutralButton";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/permissions";
import dayjs from "dayjs";
const getStatusColor = (checked) => (checked ? "#9dda52" : "#ffbc2c ");

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
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
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
        `Failed to fetch delivery agents: ${error?.message || "Unknown error"}`
      );
      setAgents([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (record) => {
    const agentId = record?._id || record?.id;
    if (!agentId) return;
    try {
      const data = await deliveryPartnersAPI.getById(agentId);
      setSelectedRecord(data);
      viewForm.setFieldsValue({
        firstName: data?.firstName || "",
        lastName: data?.lastName || "",
        email: data?.email || "",
        mobNo: data?.mobNo || "",
        gender: data?.gender || "",
        dob: data?.dob ? dayjs(data.dob) : null,
      });
      setViewModalVisible(true);
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          "Failed to fetch delivery agent details"
      );
    }
  };

  const handleEdit = async (record) => {
    const agentId = record?._id || record?.id;
    if (!agentId) return;
    try {
      const data = await deliveryPartnersAPI.getById(agentId);
      setSelectedRecord(data);
      editForm.setFieldsValue({
        firstName: data?.firstName || "",
        lastName: data?.lastName || "",
        email: data?.email || "",
        mobNo: data?.mobNo || "",
        dob: data?.dob ? dayjs(data.dob) : null,
        gender: data?.gender || "",
        vehicleType:
          data?.vehicleDetails?.vehicleType || data?.vehicleType || "",
        vehicleNo: data?.vehicleDetails?.vehicleNo || data?.vehicleNo || "",
        driverLicenseNo:
          data?.vehicleDetails?.driverLicenseNo || data?.driverLicenseNo || "",
        isActive: data?.isActive ?? false,
      });
      setEditModalVisible(true);
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          "Failed to fetch delivery agent details"
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

  const onToggleActive = async (record, nextStatus) => {
    const agentId = record._id || record.id || record.userId;
    if (!agentId) {
      message.error("Agent id missing; cannot update status");
      return;
    }

    setTogglingId(agentId);
    try {
      const formData = new FormData();
      formData.append("isActive", nextStatus ? "true" : "false");
      await deliveryPartnersAPI.update(agentId, formData);

      setAgents((prev) =>
        prev.map((agent) =>
          (agent._id || agent.id || agent.userId) === agentId
            ? { ...agent, isActive: nextStatus }
            : agent
        )
      );

      message.success(`Agent marked as ${nextStatus ? "active" : "inactive"}`);
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to update status"
      );
    } finally {
      setTogglingId(null);
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
      title: "Active-Status",
      key: "isActiveToggle",
      render: (_, record) => {
        const id = record?._id || record?.id || record?.userId;
        const isActive = !!record?.isActive;
        return (
          <Switch
            checked={isActive}
            loading={togglingId === id}
            onChange={(checked) => onToggleActive(record, checked)}
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
              fontSize: "26px",
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
              <AddNeutralButton
                icon={<PlusOutlined />}
                onClick={() => setAddModalVisible(true)}
              >
                Add Agent
              </AddNeutralButton>
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
          dataSource={filteredAgents || []}
          rowKey={(record) => record?.id || record?._id || Math.random()}
          loading={loading}
          pagination={{
            ...pagination,
            total: filteredAgents?.length || 0,
            showTotal: (total) => `Total ${total} Delivery Partners`,
          }}
          onChange={(newPagination) => setPagination(newPagination)}
          locale={{ emptyText: "No agents found" }}
          scroll={{ x: 1000 }}
        />
      </div>

      {/* Add Delivery Agent Drawer */}
      <Drawer
        title="Add New Delivery Agent"
        open={addModalVisible}
        onClose={() => {
          setAddModalVisible(false);
          form.resetFields();
        }}
        width={680}
        destroyOnClose
        placement="right"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddAgent}
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
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="Enter email" size="middle" />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
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

          <Form.Item name="gender" label="Gender">
            <Select placeholder="Select gender" size="middle">
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
            <Select size="middle" disabled>
              <Select.Option value="DELIVERY_PARTNER">
                Delivery Partner
              </Select.Option>
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
            <AddNeutralButton htmlType="submit" loading={submitting}>
              Create Delivery Agent
            </AddNeutralButton>
          </div>
        </Form>
      </Drawer>

      {/* Edit Delivery Agent Drawer */}
      <Drawer
        title="Edit Delivery Agent"
        open={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          editForm.resetFields();
          setSelectedRecord(null);
        }}
        width={680}
        destroyOnClose
        placement="right"
      >
        <Form
          form={editForm}
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

          <Form.Item name="gender" label="Gender">
            <Select placeholder="Select gender" size="middle">
              <Select.Option value="MALE">Male</Select.Option>
              <Select.Option value="FEMALE">Female</Select.Option>
              <Select.Option value="OTHER">Other</Select.Option>
            </Select>
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} sm={8}>
              <Form.Item name="vehicleType" label="Vehicle Type">
                <Input placeholder="Enter vehicle type" size="middle" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="vehicleNo" label="Vehicle Number">
                <Input placeholder="Enter vehicle number" size="middle" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="driverLicenseNo" label="Driver License No">
                <Input placeholder="Enter license number" size="middle" />
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
              unCheckedChildren="Inactive"
              style={{
                backgroundColor: getStatusColor(
                  editForm.getFieldValue("isActive")
                ),
                borderColor: getStatusColor(editForm.getFieldValue("isActive")),
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
                editForm.resetFields();
                setSelectedRecord(null);
              }}
            >
              Cancel
            </NeutralButton>
            <AddNeutralButton htmlType="submit" loading={submitting}>
              Update Agent
            </AddNeutralButton>
          </div>
        </Form>
      </Drawer>

      {/* View Delivery Agent Drawer */}
      <Drawer
        title="Delivery Agent Details"
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
              src={
                selectedRecord?.profilePicture?.uri ||
                selectedRecord?.avatar ||
                selectedRecord?.profilePicture
              }
              icon={<UserOutlined />}
              style={{ backgroundColor: "#f2f2f2" }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#3c2f3d" }}>
                {selectedRecord?.firstName || "Delivery Partner"}
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
    </div>
  );
};

export default DeliveryAgentList;
