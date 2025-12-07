import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Dropdown,
  Modal,
  message,
  Avatar,
  Form,
  Select,
  Switch,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { vendorsAPI } from "../../services/api";
import StatusTag from "../../components/common/StatusTag";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/permissions";

const VendorList = () => {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
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
  const { roles } = useAuth();

  // Check if user can add vendors (SUPER_ADMIN or ADMIN only)
  const canAddVendor = () => {
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
    fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const data = await vendorsAPI.getAll();
      if (Array.isArray(data)) {
        setVendors(data);
        setPagination({ ...pagination, total: data.length });
      } else {
        setVendors([]);
        setPagination({ ...pagination, total: 0 });
      }
    } catch (error) {
      message.error(
        `Failed to fetch vendors: ${error.message || "Unknown error"}`
      );
      setVendors([]);
      setPagination({ ...pagination, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (record) => {
    try {
      const data = await vendorsAPI.getById(record.id || record._id);
      setSelectedRecord(data);
      viewForm.setFieldsValue({
        firstName: data?.firstName || "",
        lastName: data?.lastName || "",
        email: data?.email || "",
        mobNo: data?.mobNo || "",
        gender: data?.gender || "",
        cityNm: data?.cityNm,
        storeName: data?.storeName || "",
        pinCode: data?.pinCode || "",
        storeAddress: data?.storeAddress || "",
      });
      setViewModalVisible(true);
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to fetch vendor details"
      );
    }
  };

  const handleEdit = async (record) => {
    try {
      const data = await vendorsAPI.getById(record.id || record._id);
      setSelectedRecord(data);
      form.setFieldsValue({
        firstName: data?.firstName || "",
        lastName: data?.lastName || "",
        email: data?.email || "",
        mobNo: data?.mobNo || "",
        storeName: data?.storeName || "",
        pinCode: data?.pinCode || "",
        storeAddress: data?.storeAddress || "",
        gender: data?.gender || "",
        cityNm: data?.cityNm || "",
        isActive: data?.isActive ?? false,
      });
      setEditModalVisible(true);
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to fetch vendor details"
      );
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
      formData.append("storeName", values.storeName);
      formData.append("pinCode", values.pinCode);
      formData.append("storeAddress", values.storeAddress);
      formData.append("gender", values.gender);
      formData.append("cityNm", values.cityNm);
      formData.append("isActive", values.isActive ? "true" : "false");

      await vendorsAPI.update(
        selectedRecord.id || selectedRecord._id,
        formData
      );
      message.success("Vendor updated successfully");
      setEditModalVisible(false);
      form.resetFields();
      setSelectedRecord(null);
      fetchVendors();
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to update vendor"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    const vendorId = record._id || record.id || record.vendorId;
    if (!vendorId) {
      message.error("Vendor id missing; cannot delete");
      return;
    }
    try {
      await vendorsAPI.delete(vendorId);
      setVendors((prev) =>
        prev.filter((v) => (v.id || v._id || v.vendorId) !== vendorId)
      );
      message.success("Vendor deleted successfully");
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to delete vendor"
      );
    }
  };

  const columns = [
    {
      title: "Vendor",
      dataIndex: "businessName",
      key: "businessName",
      render: (text, record) => {
        if (!record) return "-";
        const businessName = text || record.storeName || "N/A";
        const ownerName =
          record.ownerName ||
          `${record.firstName || ""} ${record.lastName || ""}`.trim() ||
          "N/A";
        return (
          <Space>
            <Avatar
              src={
                record.logo ||
                record.profilePicture?.uri ||
                record.profilePicture
              }
              icon={<UserOutlined />}
            />
            <div>
              <div className="font-medium">{businessName}</div>
              <div className="text-xs text-gray-500">{ownerName}</div>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Contact",
      dataIndex: "email",
      key: "email",
      render: (text, record) => {
        if (!record) return "-";
        const email = text || record.email || "N/A";
        const phone = record.phone || record.mobNo || "N/A";
        return (
          <div>
            <div>{email}</div>
            <div className="text-xs text-gray-500">{phone}</div>
          </div>
        );
      },
    },
    {
      title: "Store Name",
      dataIndex: "storeName",
      key: "storeName",
      render: (text, record) => text || record.storeName || "N/A",
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
      title: "Total Sales",
      dataIndex: "totalSales",
      key: "totalSales",
      render: (amount) => `₹${(amount || 0).toLocaleString()}`,
      sorter: (a, b) => (a.totalSales || 0) - (b.totalSales || 0),
    },

    {
      title: "Joined",
      dataIndex: "joinedDate",
      key: "joinedDate",
      render: (date) => (date ? new Date(date).toLocaleDateString() : "N/A"),
      sorter: (a, b) => {
        const dateA = a.joinedDate ? new Date(a.joinedDate) : new Date(0);
        const dateB = b.joinedDate ? new Date(b.joinedDate) : new Date(0);
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

  const handleAddVendor = async (values) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("firstName", values.firstName);
      formData.append("lastName", values.lastName);
      formData.append("mobNo", values.mobNo);
      formData.append("email", values.email);
      formData.append("storeName", values.storeName);
      formData.append("pinCode", values.pinCode);
      formData.append("storeAddress", values.storeAddress);
      formData.append("gender", values.gender);
      formData.append("roleType", "VENDOR");
      formData.append("cityNm", values.cityNm);

      await vendorsAPI.create(formData);
      message.success("Vendor created successfully");
      setAddModalVisible(false);
      form.resetFields();
      fetchVendors();
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to create vendor"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    if (!vendor) return false;
    const businessName = (
      vendor.businessName ||
      vendor.storeName ||
      ""
    ).toLowerCase();
    const ownerName = (
      vendor.ownerName ||
      `${vendor.firstName || ""} ${vendor.lastName || ""}`.trim() ||
      ""
    ).toLowerCase();
    const email = (vendor.email || "").toLowerCase();
    const search = searchText.toLowerCase();
    return (
      businessName.includes(search) ||
      ownerName.includes(search) ||
      email.includes(search)
    );
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
            Vendors
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
              placeholder="Search vendors..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%", minWidth: 220, flex: 1, maxWidth: 360 }}
              size="large"
            />
            {canAddVendor() && (
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
                Add Vendor
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
          dataSource={filteredVendors || []}
          rowKey={(record) => record?.id || record?._id || Math.random()}
          loading={loading}
          pagination={{
            ...pagination,
            total: filteredVendors?.length || 0,
            showTotal: (total) => `Total ${total} vendors`,
          }}
          onChange={(newPagination) => setPagination(newPagination)}
          locale={{ emptyText: "No vendors found" }}
          scroll={{ x: 900 }}
        />
      </div>

      <Modal
        title="Add New Vendor"
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
          onFinish={handleAddVendor}
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

          <Form.Item
            name="storeName"
            label="Store Name"
            rules={[{ required: true, message: "Please enter store name" }]}
          >
            <Input placeholder="Enter store name" size="large" />
          </Form.Item>

          <Form.Item name="storeAddress" label="Store Address">
            <Input placeholder="Enter store address" size="large" />
          </Form.Item>

          <Form.Item name="cityNm" label="City Name">
            <Input placeholder="Enter city name" size="large" />
          </Form.Item>

          <Form.Item
            name="pinCode"
            label="Pin Code"
            rules={[
              {
                pattern: /^[0-9]{6}$/,
                message: "Please enter a valid 6-digit pin code",
              },
            ]}
          >
            <Input placeholder="Enter pin code" size="large" />
          </Form.Item>

          <Form.Item name="gender" label="Gender">
            <Select placeholder="Select gender" size="large">
              <Select.Option value="MALE">Male</Select.Option>
              <Select.Option value="FEMALE">Female</Select.Option>
              <Select.Option value="OTHER">Other</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active Status"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <Form.Item
            name="roleType"
            label="Role Type"
            initialValue="VENDOR"
            rules={[{ required: true }]}
          >
            <Select size="large" disabled>
              <Select.Option value="VENDOR">Vendor</Select.Option>
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
                Create Vendor
              </Button>
              <Button
                onClick={() => {
                  setAddModalVisible(false);
                  form.resetFields();
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
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="View Vendor Details"
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
        <Form form={viewForm} layout="vertical" style={{ marginTop: "24px" }}>
          <Form.Item style={{ textAlign: "center" }}>
            <Avatar
              size={64}
              src={selectedRecord?.profilePicture?.uri}
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

          <Form.Item name="storeName" label="Store Name">
            <Input readOnly size="large" />
          </Form.Item>

          <Form.Item name="storeAddress" label="Store Address">
            <Input.TextArea readOnly rows={3} size="large" />
          </Form.Item>

          <Form.Item name="cityNm" label="City Name">
            <Input readOnly size="large" />
          </Form.Item>

          <Form.Item name="pinCode" label="Pin Code">
            <Input readOnly size="large" />
          </Form.Item>

          <Form.Item name="gender" label="Gender">
            <Input readOnly size="large" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Vendor"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
          setSelectedRecord(null);
        }}
        footer={null}
        width={700}
        centered
        style={{ maxWidth: "95vw" }}
      >
        <Form
          form={form}
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

          <Form.Item
            name="storeName"
            label="Store Name"
            rules={[{ required: true, message: "Please enter store name" }]}
          >
            <Input placeholder="Enter store name" size="large" />
          </Form.Item>

          <Form.Item name="storeAddress" label="Store Address">
            <Input placeholder="Enter store address" size="large" />
          </Form.Item>

          <Form.Item name="cityNm" label="City Name">
            <Input placeholder="Enter city name" size="large" />
          </Form.Item>

          <Form.Item
            name="pinCode"
            label="Pin Code"
            rules={[
              {
                pattern: /^[0-9]{6}$/,
                message: "Please enter a valid 6-digit pin code",
              },
            ]}
          >
            <Input placeholder="Enter pin code" size="large" />
          </Form.Item>

          <Form.Item name="gender" label="Gender">
            <Select placeholder="Select gender" size="large">
              <Select.Option value="MALE">Male</Select.Option>
              <Select.Option value="FEMALE">Female</Select.Option>
              <Select.Option value="OTHER">Other</Select.Option>
            </Select>
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
                backgroundColor: form.getFieldValue("isActive")
                  ? "#23ac6d"
                  : "#ffbc2c",
                borderColor: form.getFieldValue("isActive")
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
                  form.resetFields();
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
                Update Vendor
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VendorList;
