import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Drawer,
  Descriptions,
  Avatar,
  Form,
  Input,
  Tag,
  Popconfirm,
  message,
  Select,
  Switch,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import { staffAPI } from "../../services/api";

const Staff = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // record or null
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await staffAPI.getAll();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setData(list);
    } catch (e) {
      message.error(e?.response?.data?.message || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setOpen(true);
  };

  const onEdit = async (record) => {
    try {
      const res = await staffAPI.getById(record?._id || record?.id);
      const dto = res?.data || res || record;
      setEditing(dto);
      form.setFieldsValue({
        firstName: dto?.firstName || "",
        lastName: dto?.lastName || "",
        email: dto?.email || "",
        mobNo: dto?.mobNo || "",
        isActive: typeof dto?.isActive === "boolean" ? dto.isActive : true,
      });
      setOpen(true);
    } catch (e) {
      message.error(e?.response?.data?.message || "Failed to load admin");
    }
  };

  const onDelete = async (record) => {
    try {
      const id = record?._id || record?.id;
      await staffAPI.deleteAdmin(id);
      message.success("Deleted");
      fetchData();
    } catch (e) {
      message.error(e?.response?.data?.message || "Delete failed");
    }
  };

  const onView = async (record) => {
    setViewLoading(true);
    setViewOpen(true);
    try {
      const res = await staffAPI.getById(record?._id || record?.id);
      const dto = res?.data || res || record;
      setViewData(dto);
    } catch (e) {
      message.error(e?.response?.data?.message || "Failed to load admin");
    } finally {
      setViewLoading(false);
    }
  };

  const onSubmit = async (values) => {
    try {
      if (editing && (editing._id || editing.id)) {
        // Do not allow role changes or password update here
        await staffAPI.updateAdmin(editing._id || editing.id, {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          mobNo: values.mobNo,
          isActive: values.isActive,
        });
        message.success("Updated");
      } else {
        const payload = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          mobNo: values.mobNo,
          roleType: values.roleType,
        };
        await staffAPI.addAdmin(payload);
        message.success(
          "Admin created. Login password will be emailed automatically."
        );
      }
      setOpen(false);
      form.resetFields();
      fetchData();
    } catch (e) {
      message.error(e?.response?.data?.message || "Save failed");
    }
  };

  const onToggleActive = async (record, checked) => {
    const id = record?._id || record?.id;
    setTogglingId(id);
    try {
      await staffAPI.updateAdmin(id, { isActive: checked });
      setData((prev) =>
        prev.map((r) =>
          (r?._id || r?.id) === id ? { ...r, isActive: checked } : r
        )
      );
      message.success(checked ? "Activated" : "Deactivated");
    } catch (e) {
      message.error(e?.response?.data?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "firstName",
        key: "name",
        render: (_v, r) => `${r.firstName || ""} ${r.lastName || ""}`.trim(),
      },
      { title: "Email", dataIndex: "email" },
      { title: "Mobile", dataIndex: "mobNo" },
      {
        title: "Role",
        key: "role",
        render: (_, r) => {
          const role = r?.roles?.[0]?.code || r?.roleType || "ADMIN";
          return (
            <Tag
              color="#ffbc2c"
              style={{ fontWeight: "bold", color: "#3c2f3d" }}
            >
              {role}
            </Tag>
          );
        },
      },
      {
        title: "Active-Status",
        key: "isActive",
        render: (_, r) => {
          const id = r?._id || r?.id;
          return (
            <Switch
              checked={!!r?.isActive}
              loading={togglingId === id}
              onChange={(checked) => onToggleActive(r, checked)}
            />
          );
        },
      },
      {
        title: "Actions",
        key: "Actions",
        render: (_, record) => (
          <Space>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            >
            </Button>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            >
            </Button>
            <Popconfirm
              title="Delete this admin?"
              onConfirm={() => onDelete(record)}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>

              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [togglingId]
  );

  return (
    <Card
      title="Staff (Admins & Sub-admins)"
      extra={
        <Button
          style={{ backgroundColor: "#9dda52", color: "#3c2f3d" }}
          onClick={onAdd}
        >
          Add Admin
        </Button>
      }
    >
      <Table
        rowKey={(r) => r._id || r.id}
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        open={open}
        title={editing ? "Edit Admin" : "Add Admin"}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText={editing ? "Save" : "Create"}
        okButtonProps={{
          style: {
            backgroundColor: "#9dda52",
            borderColor: "#9dda52",
            color: "#3c2f3d",
          },
        }}
        style={{ color: "#3c2f3d" }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          requiredMark={false}
        >
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: "Enter first name" }]}
          >
            <Input placeholder="First name" />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: "Enter last name" }]}
          >
            <Input placeholder="Last name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, type: "email", message: "Enter valid email" },
            ]}
          >
            <Input placeholder="email@example.com" />
          </Form.Item>
          <Form.Item name="mobNo" label="Mobile">
            <Input placeholder="Mobile number" />
          </Form.Item>
          {!editing && (
            <Form.Item
              name="roleType"
              label="Role"
              rules={[{ required: true, message: "Select role" }]}
            >
              <Select
                placeholder="Select role"
                options={[
                  { value: "SUPER_ADMIN", label: "SUPER_ADMIN" },
                  { value: "ADMIN", label: "ADMIN" },
                  { value: "SUB_ADMIN", label: "SUB_ADMIN" },
                ]}
              />
            </Form.Item>
          )}
          {editing && (
            <Form.Item label="Role">
              <Tag
                color="#ffbc2c"
                style={{ fontWeight: "bold", color: "#3c2f3d" }}
              >
                {editing?.roles?.[0]?.code || editing?.roleCode || "ADMIN"}
              </Tag>
            </Form.Item>
          )}
          <Form.Item
            name="isActive"
            label="Active-Status"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          {/* Password field removed; password will be auto-generated and emailed */}
        </Form>
      </Modal>

      <Drawer
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        width={520}
        title="Admin Details"
      >
        {viewLoading ? (
          <Card loading style={{ width: "100%" }} />
        ) : viewData ? (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Space align="center" size={16}>
              <Avatar size={64} src={viewData?.profilePicture?.uri}>
                {(
                  (viewData?.firstName || "?").charAt(0) +
                  (viewData?.lastName || "").charAt(0)
                ).toUpperCase()}
              </Avatar>
              <div>
                <div style={{ fontWeight: 600, fontSize: 18 }}>
                  {(viewData?.firstName || "").trim()}{" "}
                  {(viewData?.lastName || "").trim()}
                </div>
                <div style={{ color: "#3c2f3d" }}>{viewData?.email}</div>
              </div>
            </Space>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="First Name">
                {viewData?.firstName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Last Name">
                {viewData?.lastName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {viewData?.email || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Mobile">
                {viewData?.mobNo || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                <Tag color="#ffbc2c">
                  {viewData?.roles?.[0]?.code || viewData?.roleType || "ADMIN"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Active-Status">
                <Tag color={viewData?.isActive ? "green" : "red"}>
                  {viewData?.isActive ? "Active" : "Inactive"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Primary Admin">
                <Tag color={viewData?.isPrimaryAdmin ? "gold" : "default"}>
                  {viewData?.isPrimaryAdmin ? "Yes" : "No"}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Space>
        ) : (
          <div>No data</div>
        )}
      </Drawer>
    </Card>
  );
};

export default Staff;
