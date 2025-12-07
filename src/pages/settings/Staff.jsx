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
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
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
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
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
      setPagination((prev) => ({ ...prev, total: list.length }));
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

  const getStatusColor = (checked) => (checked ? "#9dda52" : "#ffbc2c ");
  const getRoleColor = (role) => {
    const key = String(role || "").toUpperCase();
    if (key === "SUPER_ADMIN") return "#4096ff";
    if (key === "ADMIN") return "#9dda52";
    if (key === "SUB_ADMIN") return "#ffbc2c";
    return "#d9d9d9";
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
          const roleLabel = String(role).replace(/_/g, " ");
          const roleColor = getRoleColor(role);
          return (
            <Tag
              color={roleColor}
              style={{
                color: "#3c2f3d",
                textTransform: "capitalize",
              }}
            >
              {roleLabel}
            </Tag>
          );
        },
      },
      {
        title: "Active-Status",
        key: "isActive",
        render: (_, r) => {
          const id = r?._id || r?.id;
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
        title: "Actions",
        key: "Actions",
        render: (_, record) => (
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
              title="View"
              style={{ color: "#9dda52" }}
            />
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              title="Edit"
              style={{ color: "#ffbc2c" }}
            />
            <Popconfirm
              title="Delete this admin?"
              onConfirm={() => onDelete(record)}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                title="Delete"
              />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [togglingId]
  );

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
            Staff Management
          </h1>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "flex-end",
              flex: 1,
              minWidth: 220,
            }}
          >
            <Input
              placeholder="Search Staff..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%", maxWidth: 340, flex: 1, minWidth: 200 }}
              size="large"
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAdd}
              style={{ background: "#9dda52", color: "#3c2f3d" }}
            >
              Add Admin
            </Button>
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
        {/** Filtered data with pagination syncing */}
        {(() => {
          const filtered = (data || []).filter((item) => {
            const name = `${item?.firstName || ""} ${
              item?.lastName || ""
            }`.toLowerCase();
            const email = (item?.email || "").toLowerCase();
            const search = searchText.toLowerCase();
            return name.includes(search) || email.includes(search);
          });

          const pagedPagination = {
            ...pagination,
            total: filtered.length,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} staff`,
          };

          const handleTableChange = (pager) => {
            setPagination({ ...pager, total: filtered.length });
          };

          return (
            <Table
              rowKey={(r) => r._id || r.id}
              columns={columns}
              dataSource={filtered}
              loading={loading}
              pagination={pagedPagination}
              onChange={handleTableChange}
              scroll={{ x: 800 }}
            />
          );
        })()}
      </div>

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
          <Form.Item shouldUpdate noStyle>
            {() => {
              const checked = form.getFieldValue("isActive");
              const color = getStatusColor(checked);
              return (
                <Form.Item
                  name="isActive"
                  label="Active-Status"
                  valuePropName="checked"
                >
                  <Switch
                    checkedChildren="Active"
                    unCheckedChildren="Inactive"
                    style={{ backgroundColor: color, borderColor: color }}
                  />
                </Form.Item>
              );
            }}
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
                <Tag color={getStatusColor(viewData?.isActive)}>
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
    </div>
  );
};

export default Staff;
