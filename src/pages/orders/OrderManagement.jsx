import { useState, useEffect } from "react";
import { Table, Button, Tabs, Space, Select, Modal, message } from "antd";
import {
  ExportOutlined,
  EyeOutlined,
  UserSwitchOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CarOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { ordersAPI, deliveryPartnersAPI } from "../../services/api";
import StatusTag from "../../components/common/StatusTag";
import { ORDER_STATUS } from "../../constants/statuses";

const formatter = new Intl.NumberFormat("en-IN");
const formatNumber = (value) => formatter.format(value ?? 0);

const OrderManagement = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, agentsData] = await Promise.all([
        ordersAPI.getAll(),
        deliveryPartnersAPI.getAll(),
      ]);
      setOrders(ordersData);
      setAgents(agentsData.filter((a) => a.status === "active"));
    } catch {
      message.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAgent = (order) => {
    setSelectedOrder(order);
    setAssignModalVisible(true);
  };

  const handleAssignSubmit = async (agentId) => {
    try {
      await ordersAPI.assignAgent(selectedOrder.id, agentId);

      // Find the agent name
      const agent = agents.find((a) => a.id === agentId);

      // Update local state immediately
      setOrders(
        orders.map((o) =>
          o.id === selectedOrder.id
            ? { ...o, agentId, agentName: agent?.name || "Unknown Agent" }
            : o
        )
      );

      message.success("Agent assigned successfully");
      setAssignModalVisible(false);
    } catch {
      message.error("Failed to assign agent");
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);

      // Update local state immediately
      setOrders(
        orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      message.success("Order status updated");
    } catch {
      message.error("Failed to update status");
    }
  };

  const handleRefund = (order) => {
    Modal.confirm({
      title: "Process Refund",
      content: (
        <div>
          <p>
            Are you sure you want to process a refund for order{" "}
            {order.orderNumber}?
          </p>
          <p className="mt-2 font-medium">Amount: ₹{order.total}</p>
        </div>
      ),
      okText: "Process Refund",
      okType: "danger",
      onOk: async () => {
        try {
          await ordersAPI.processRefund(order.id, { amount: order.total });

          // Update local state immediately
          setOrders(
            orders.map((o) =>
              o.id === order.id
                ? {
                    ...o,
                    status: ORDER_STATUS.REFUNDED,
                    paymentStatus: "refunded",
                  }
                : o
            )
          );

          message.success("Refund processed successfully");
        } catch {
          message.error("Failed to process refund");
        }
      },
    });
  };

  const columns = [
    {
      title: "Order #",
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (text) => (
        <span style={{ fontWeight: 600, color: "#3c2f3d" }}>{text}</span>
      ),
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "Vendor",
      dataIndex: "vendorName",
      key: "vendorName",
    },
    {
      title: "Agent",
      dataIndex: "agentName",
      key: "agentName",
      render: (agent, record) =>
        agent ? (
          <span>{agent}</span>
        ) : (
          <Button
            size="small"
            type="text"
            icon={<UserSwitchOutlined />}
            onClick={() => handleAssignAgent(record)}
            style={{ color: "#9dda52" }}
          >
            Assign
          </Button>
        ),
    },
    {
      title: "Items",
      dataIndex: "items",
      key: "items",
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total) => `₹${total}`,
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Select
          value={status}
          onChange={(newStatus) => handleUpdateStatus(record.id, newStatus)}
          size="small"
          style={{ width: 140, maxWidth: "100%" }}
        >
          {Object.entries(ORDER_STATUS).map(([key, value]) => (
            <Select.Option key={value} value={value}>
              {key.replace(/_/g, " ")}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Payment",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            style={{ color: "#3c2f3d" }}
          >
            View
          </Button>
          {record.paymentStatus === "completed" &&
            record.status !== "refunded" && (
              <Button size="small" danger onClick={() => handleRefund(record)}>
                Refund
              </Button>
            )}
        </Space>
      ),
    },
  ];

  const filterOrdersByStatus = (status) => {
    if (status === "all") return orders;
    return orders.filter((order) => order.status === status);
  };

  const tabItems = [
    {
      key: "all",
      label: `All (${orders.length})`,
      children: (
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
        />
      ),
    },
    {
      key: ORDER_STATUS.PENDING,
      label: `Pending (${filterOrdersByStatus(ORDER_STATUS.PENDING).length})`,
      children: (
        <Table
          columns={columns}
          dataSource={filterOrdersByStatus(ORDER_STATUS.PENDING)}
          rowKey="id"
          loading={loading}
        />
      ),
    },
    {
      key: "ongoing",
      label: `Ongoing (${
        orders.filter((o) =>
          [
            ORDER_STATUS.CONFIRMED,
            ORDER_STATUS.PREPARING,
            ORDER_STATUS.IN_TRANSIT,
          ].includes(o.status)
        ).length
      })`,
      children: (
        <Table
          columns={columns}
          dataSource={orders.filter((o) =>
            [
              ORDER_STATUS.CONFIRMED,
              ORDER_STATUS.PREPARING,
              ORDER_STATUS.IN_TRANSIT,
            ].includes(o.status)
          )}
          rowKey="id"
          loading={loading}
        />
      ),
    },
    {
      key: ORDER_STATUS.DELIVERED,
      label: `Completed (${
        filterOrdersByStatus(ORDER_STATUS.DELIVERED).length
      })`,
      children: (
        <Table
          columns={columns}
          dataSource={filterOrdersByStatus(ORDER_STATUS.DELIVERED)}
          rowKey="id"
          loading={loading}
        />
      ),
    },
    {
      key: ORDER_STATUS.CANCELLED,
      label: `Cancelled (${
        filterOrdersByStatus(ORDER_STATUS.CANCELLED).length
      })`,
      children: (
        <Table
          columns={columns}
          dataSource={filterOrdersByStatus(ORDER_STATUS.CANCELLED)}
          rowKey="id"
          loading={loading}
        />
      ),
    },
  ];

  const pendingCount = filterOrdersByStatus(ORDER_STATUS.PENDING).length;
  const ongoingCount = orders.filter((o) =>
    [
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PREPARING,
      ORDER_STATUS.IN_TRANSIT,
    ].includes(o.status)
  ).length;
  const completedCount = filterOrdersByStatus(ORDER_STATUS.DELIVERED).length;
  const cancelledCount = filterOrdersByStatus(ORDER_STATUS.CANCELLED).length;

  const orderStatCards = [
    {
      key: "total",
      label: "Total Orders",
      value: formatNumber(orders.length),
      icon: <ShoppingOutlined />,
      iconBg: "#eef2ff",
      iconColor: "#4f46e5",
    },
    {
      key: "pending",
      label: "Pending",
      value: formatNumber(pendingCount),
      icon: <ClockCircleOutlined />,
      iconBg: "#fff7ed",
      iconColor: "#f97316",
    },
    {
      key: "ongoing",
      label: "Ongoing",
      value: formatNumber(ongoingCount),
      icon: <CarOutlined />,
      iconBg: "#e0f2fe",
      iconColor: "#0284c7",
    },
    {
      key: "completed",
      label: "Completed",
      value: formatNumber(completedCount),
      icon: <CheckCircleOutlined />,
      iconBg: "#ecfdf5",
      iconColor: "#10b981",
    },
    {
      key: "cancelled",
      label: "Cancelled",
      value: formatNumber(cancelledCount),
      icon: <CloseCircleOutlined />,
      iconBg: "#fef2f2",
      iconColor: "#ef4444",
    },
  ];

  const tableProps = {
    columns,
    rowKey: (record) => record?.id || record?._id || record?.orderNumber,
    loading,
    size: "middle",
    scroll: { x: 1100 },
  };

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
            Order Management
          </h1>

          <Space
            className="flex flex-wrap gap-3"
            size="middle"
            style={{ justifyContent: "flex-end", flex: 1, minWidth: 220 }}
          >
            <Button
              icon={<ExportOutlined />}
              style={{
                background: "#9dda52",
                borderColor: "#9dda52",
                color: "#3c2f3d",
              }}
            >
              Export Orders
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
          {orderStatCards.map((stat) => (
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
          items={tabItems.map((tab) => ({
            ...tab,
            // Wrap each tab's table with consistent, responsive props.
            children: (
              <Table
                {...tableProps}
                dataSource={tab.children?.props?.dataSource || []}
              />
            ),
          }))}
        />
      </div>

      <Modal
        title="Assign Delivery Agent"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
        width={560}
        okButtonProps={{
          style: {
            backgroundColor: "#9dda52",
            borderColor: "#9dda52",
            color: "#3c2f3d",
          },
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => handleAssignSubmit(agent.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleAssignSubmit(agent.id);
                }
              }}
              style={{
                padding: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                cursor: "pointer",
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 600, color: "#111827" }}>
                    {agent.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {agent.vehicleType} {agent.phone ? `• ${agent.phone}` : ""}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "#3c2f3d" }}>
                    ⭐ {agent.rating}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {agent.ordersDelivered} deliveries
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default OrderManagement;
