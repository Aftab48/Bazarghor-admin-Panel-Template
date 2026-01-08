import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Tabs,
  Avatar,
  Statistic,
  Row,
  Col,
  Input,
  Switch,
  Modal,
  Image,
} from "antd";
import { CarOutlined, StarOutlined, SearchOutlined } from "@ant-design/icons";
import { deliveryPartnersAPI } from "../../services/api";
import StatusTag from "../../components/common/StatusTag";

const STATUS_CODES = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
};

const normalizeStatusCode = (status) => {
  if (typeof status === "number") return status;
  const statusStr = String(status || "").toLowerCase();
  if (statusStr === "pending") return STATUS_CODES.PENDING;
  if (statusStr === "approved" || statusStr === "active")
    return STATUS_CODES.APPROVED;
  if (statusStr === "rejected") return STATUS_CODES.REJECTED;
  return status;
};

const DeliveryAgentManagement = () => {
  const [loading, setLoading] = useState(false);
  const [pendingAgents, setPendingAgents] = useState([]);
  const [activeAgents, setActiveAgents] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState(null);

  const getStatusStyle = (status) => {
    const statusCode = normalizeStatusCode(status);
    if (statusCode === STATUS_CODES.APPROVED)
      return { backgroundColor: "#9dda52", color: "#3c2f3d" };
    if (statusCode === STATUS_CODES.REJECTED)
      return { backgroundColor: "#ffbc2c", color: "#3c2f3d" };
    return undefined;
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const allAgents = await deliveryPartnersAPI.getAll();
      const normalizedAgents = Array.isArray(allAgents)
        ? allAgents.map((a) => ({
            ...a,
            status: normalizeStatusCode(a.status),
          }))
        : [];

      // Show all agents (pending/approved/rejected) in the approvals tab
      setPendingAgents(normalizedAgents);

      const active = normalizedAgents.filter(
        (a) => a.status === STATUS_CODES.APPROVED
      );
      setActiveAgents(active);

      // Calculate payouts for active agents
      const payoutData = active.map((a) => ({
        ...a,
        pendingPayout: Math.floor((a.earnings || 0) * 0.3),
      }));
      setPayouts(payoutData);
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to fetch delivery agents"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleDetails = async (record) => {
    const agentId = record?.id || record?._id || record?.userId;
    if (!agentId) {
      message.error("Agent id missing; cannot load vehicle details");
      return;
    }
    try {
      const data = await deliveryPartnersAPI.getById(agentId);
      const details = data?.vehicleDetails || record?.vehicleDetails;
      if (!details) {
        message.info("No vehicle details available");
        return;
      }
      setVehicleDetails(details);
      setVehicleModalVisible(true);
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to load vehicle details"
      );
    }
  };

  const handleStatusToggle = async (record, checked) => {
    const agentId = record.id || record._id;
    setStatusUpdatingId(agentId);
    try {
      const newStatus = checked ? STATUS_CODES.APPROVED : STATUS_CODES.REJECTED;
      await deliveryPartnersAPI.updateStatus(agentId, newStatus);
      message.success("Delivery partner status updated successfully");
      fetchAgents();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          "Failed to update delivery partner status"
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const pendingColumns = [
    {
      title: "Agent Name",
      dataIndex: "name",
      key: "name",
      responsive: ["xs", "sm", "md"],
      render: (text, record) => {
        const name =
          text ||
          `${record.firstName || ""} ${record.lastName || ""}`.trim() ||
          "N/A";
        const email = record.email || "N/A";
        const avatar =
          record.avatar || record.profilePicture?.uri || record.profilePicture;
        return (
          <Space>
            <Avatar src={avatar} icon={<CarOutlined />} />
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
      responsive: ["md"],
      render: (phone, record) => phone || record.mobNo || "N/A",
    },
    {
      title: "Vehicle Details",
      key: "vehicleDetails",
      responsive: ["md"],
      render: (_, record) => (
        <Button
          style={{
            backgroundColor: "#9dda52",
            color: "#3c2f3d",
            borderColor: "#9dda52",
            border: "0.2px solid #3c2f3d",
          }}
          icon={<CarOutlined />}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#9dda52";
            e.currentTarget.style.borderColor = "#9dda52";
            e.currentTarget.style.color = "#3c2f3d";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#9dda52";
            e.currentTarget.style.borderColor = "#9dda52";
            e.currentTarget.style.color = "#3c2f3d";
          }}
          onClick={() => handleVehicleDetails(record)}
        >
          Vehicle Details
        </Button>
      ),
    },

    {
      title: "Applied Date",
      dataIndex: "createdAt",
      key: "createdAt",
      responsive: ["lg"],
      render: (date) => (date ? new Date(date).toLocaleDateString() : "N/A"),
      sorter: (a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateA - dateB;
      },
    },
    {
      title: "Approval Status",
      dataIndex: "status",
      key: "approvalStatus",
      render: (status) => (
        <StatusTag
          status={normalizeStatusCode(status)}
          style={getStatusStyle(status)}
        />
      ),
    },
    {
      title: "Approve / Reject",
      key: "approvalToggle",
      width: 160,
      render: (_, record) => {
        const statusCode = normalizeStatusCode(record.status);
        const agentId = record.id || record._id;
        return (
          <Switch
            checkedChildren="APPROVED"
            unCheckedChildren="REJECTED"
            checked={statusCode === STATUS_CODES.APPROVED}
            loading={statusUpdatingId === agentId}
            style={{
              backgroundColor:
                statusCode === STATUS_CODES.APPROVED ? "#9dda52" : "#ffbc2c",
              borderColor:
                statusCode === STATUS_CODES.APPROVED ? "#9dda52" : "#ffbc2c",
            }}
            onChange={(checked) => handleStatusToggle(record, checked)}
          />
        );
      },
    },
  ];

  const performanceColumns = [
    {
      title: "Agent Name",
      dataIndex: "name",
      key: "name",
      responsive: ["xs", "sm", "md"],
      render: (text, record) => {
        const name =
          text ||
          `${record.firstName || ""} ${record.lastName || ""}`.trim() ||
          "N/A";
        const avatar =
          record.avatar || record.profilePicture?.uri || record.profilePicture;
        return (
          <Space>
            <Avatar src={avatar} icon={<CarOutlined />} />
            <div className="font-medium">{name}</div>
          </Space>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      responsive: ["md"],
      render: (status) => (
        <StatusTag
          status={normalizeStatusCode(status)}
          style={getStatusStyle(status)}
        />
      ),
    },
    {
      title: "Orders Delivered",
      dataIndex: "ordersDelivered",
      key: "ordersDelivered",
      responsive: ["lg"],
      render: (count) => count || 0,
      sorter: (a, b) => (a.ordersDelivered || 0) - (b.ordersDelivered || 0),
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      responsive: ["lg"],
      render: (rating) => (
        <Space>
          <StarOutlined className="text-yellow-500" />
          {rating || 0}
        </Space>
      ),
      sorter: (a, b) => parseFloat(a.rating || 0) - parseFloat(b.rating || 0),
    },
    {
      title: "Total Earnings",
      dataIndex: "earnings",
      key: "earnings",
      responsive: ["lg"],
      render: (amount) => `₹${(amount || 0).toLocaleString()}`,
      sorter: (a, b) => (a.earnings || 0) - (b.earnings || 0),
    },
  ];

  const payoutColumns = [
    {
      title: "Agent Name",
      dataIndex: "name",
      key: "name",
      responsive: ["xs", "sm", "md"],
      render: (text, record) => {
        const name =
          text ||
          `${record.firstName || ""} ${record.lastName || ""}`.trim() ||
          "N/A";
        const avatar =
          record.avatar || record.profilePicture?.uri || record.profilePicture;
        return (
          <Space>
            <Avatar src={avatar} icon={<CarOutlined />} />
            <div className="font-medium">{name}</div>
          </Space>
        );
      },
    },
    {
      title: "Total Earnings",
      dataIndex: "earnings",
      key: "earnings",
      responsive: ["md"],
      render: (amount) => `₹${(amount || 0).toLocaleString()}`,
    },
    {
      title: "Pending Payout",
      dataIndex: "pendingPayout",
      key: "pendingPayout",
      responsive: ["lg"],
      render: (amount) => `₹${(amount || 0).toLocaleString()}`,
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: () => (
        <Button
          type="primary"
          size="small"
          style={{
            background: "#9dda52",
            borderColor: "#9dda52",
            color: "#3c2f3d",
            fontWeight: "bold",
          }}
        >
          Process Payout
        </Button>
      ),
    },
  ];

  const filteredPendingAgents = pendingAgents.filter((agent) => {
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

  const filteredActiveAgents = activeAgents.filter((agent) => {
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

  const filteredPayouts = payouts.filter((agent) => {
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

  const tabItems = [
    {
      key: "pending",
      label: (
        <span>
          All Delivery Partners{" "}
          <span style={{ color: "#ff4d4f" }}>({pendingAgents.length})</span>
        </span>
      ),
      children: (
        <div>
          <Table
            columns={pendingColumns}
            dataSource={filteredPendingAgents}
            rowKey={(record) => record?.id || record?._id || Math.random()}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} pending delivery partners`,
            }}
            scroll={{ x: "max-content" }}
          />
        </div>
      ),
    },
    {
      key: "performance",
      label: "Performance",
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Active Agents"
                  value={activeAgents.length}
                  prefix={<CarOutlined />}
                  valueStyle={{ color: "#3c2f3d" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Total Deliveries"
                  value={activeAgents.reduce(
                    (sum, a) => sum + (a.ordersDelivered || 0),
                    0
                  )}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Average Rating"
                  value={(
                    activeAgents.reduce(
                      (sum, a) => sum + parseFloat(a.rating || 0),
                      0
                    ) / (activeAgents.length || 1)
                  ).toFixed(1)}
                  prefix={<StarOutlined />}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>
          </Row>
          <Table
            columns={performanceColumns}
            dataSource={filteredActiveAgents}
            rowKey={(record) => record?.id || record?._id || Math.random()}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} active agents`,
            }}
            scroll={{ x: "max-content" }}
          />
        </div>
      ),
    },
    {
      key: "payouts",
      label: "Payouts",
      children: (
        <div>
          <Table
            columns={payoutColumns}
            dataSource={filteredPayouts}
            rowKey={(record) => record?.id || record?._id || Math.random()}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} payouts`,
            }}
            scroll={{ x: "max-content" }}
          />
        </div>
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
            Delivery Partner Management
          </h1>
          <Input
            placeholder="Search delivery partners..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: "100%", maxWidth: 380, minWidth: 220, flex: 1 }}
            size="large"
            allowClear
          />
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
          onChange={setActiveTab}
          onTabClick={(key) => {
            setActiveTab(key);
            setSearchText("");
          }}
        />
      </div>

      <Modal
        title="Vehicle Details"
        open={vehicleModalVisible}
        onCancel={() => {
          setVehicleModalVisible(false);
          setVehicleDetails(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setVehicleModalVisible(false);
              setVehicleDetails(null);
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
        width={300}
        centered
        style={{ maxWidth: "95vw" }}
      >
        {vehicleDetails ? (
          (() => {
            const detail = Array.isArray(vehicleDetails)
              ? vehicleDetails[0]
              : vehicleDetails;
            const pictures = detail?.vehiclePictures || {};
            const backImages = Array.isArray(pictures.back)
              ? pictures.back
              : pictures.back
              ? [pictures.back]
              : [];
            const frontImages = Array.isArray(pictures.front)
              ? pictures.front
              : pictures.front
              ? [pictures.front]
              : [];
            return (
              <div>
                <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                  <p>
                    <strong>Vehicle Type:</strong>{" "}
                    {detail?.vehicleType || "N/A"}
                  </p>
                  <p>
                    <strong>Vehicle Number:</strong>{" "}
                    {detail?.vehicleNo || "N/A"}
                  </p>
                  <p>
                    <strong>Driver License No:</strong>{" "}
                    {detail?.driverLicenseNo || "N/A"}
                  </p>
                </div>

                <div style={{ display: "grid", gap: 16 }}>
                  <div>
                    <strong>Front Images:</strong>
                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap",
                        justifyContent: "flex-start",
                      }}
                    >
                      {frontImages.length > 0 ? (
                        frontImages.map((pic) => {
                          const uri = pic?.uri || pic;
                          return (
                            <a
                              key={pic._id || uri}
                              href={uri}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "#3c2f3d" }}
                            >
                              <Image
                                src={uri}
                                width={170}
                                height={130}
                                style={{
                                  objectFit: "contain",
                                  background: "#fff",
                                  padding: 8,
                                  border: "1px solid #e5e5e5",
                                  borderRadius: 10,
                                }}
                                placeholder={<CarOutlined />}
                                preview={false}
                              />
                            </a>
                          );
                        })
                      ) : (
                        <span>No front images</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <strong>Back Images:</strong>
                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap",
                        justifyContent: "flex-start",
                      }}
                    >
                      {backImages.length > 0 ? (
                        backImages.map((pic) => {
                          const uri = pic?.uri || pic;
                          return (
                            <a
                              key={pic._id || uri}
                              href={uri}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "#3c2f3d" }}
                            >
                              <Image
                                src={uri}
                                width={170}
                                height={130}
                                style={{
                                  objectFit: "contain",
                                  background: "#fff",
                                  padding: 8,
                                  border: "1px solid #e5e5e5",
                                  borderRadius: 10,
                                }}
                                placeholder={<CarOutlined />}
                                preview={false}
                              />
                            </a>
                          );
                        })
                      ) : (
                        <span>No back images</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <p>No vehicle details available</p>
        )}
      </Modal>
    </div>
  );
};

export default DeliveryAgentManagement;
