import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Tabs,
  Space,
  Select,
  Modal,
  message,
  Drawer,
  Descriptions,
  Image,
  Card,
  Input,
  Row,
  Col,
} from "antd";
import {
  ExportOutlined,
  EyeOutlined,
  UserSwitchOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CarOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Form, DatePicker } from "antd";
import dayjs from "dayjs";
import useDebounce from "../../hooks/useDebounce";
import { ordersAPI, deliveryPartnersAPI } from "../../services/api";
import StatusTag from "../../components/common/StatusTag";
// Note: using STATUS_TABS (uppercase) below instead of ORDER_STATUS

const formatter = new Intl.NumberFormat("en-IN");
const formatNumber = (value) => formatter.format(value ?? 0);

const OrderManagement = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [editForm] = Form.useForm();
  const watchedStatus = Form.useWatch("status", editForm);

  useEffect(() => {
    fetchData();
  }, []);

  const debouncedSearch = useDebounce(searchText, 400);

  useEffect(() => {
    // Trigger search when user stops typing
    if (debouncedSearch !== undefined) {
      fetchData({ current: 1, pageSize, search: debouncedSearch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Status tabs to show (based on provided constants)
  const STATUS_TABS = [
    "ACCEPTANCE_PENDING",
    "PROCESSING",
    "COMPLETED",
    "CANCELLED",
    "VENDOR_REJECTED",
  ];
  const STATUS_STYLES = {
    PENDING: {
      color: "#ad6800",
      bg: "#fff7e6",
      border: "#ffd591",
    },
    PROCESSING: {
      color: "#0958d9",
      bg: "#e6f4ff",
      border: "#91caff",
    },
    SHIPPED: {
      color: "#096dd9",
      bg: "#e6f4ff",
      border: "#91caff",
    },
    DELIVERED: {
      color: "#237804",
      bg: "#f6ffed",
      border: "#b7eb8f",
    },
    CANCELLED: {
      color: "#a8071a",
      bg: "#fff1f0",
      border: "#ffa39e",
    },
    REJECTED: {
      color: "#a8071a",
      bg: "#fff1f0",
      border: "#ffa39e",
    },
  };

  const extractArray = (resp) => {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp?.data?.data)) return resp.data.data;
    if (Array.isArray(resp?.data)) return resp.data;
    return [];
  };

  const fetchData = async ({
    current = 1,
    pageSize = 10,
    search = searchText,
  } = {}) => {
    setLoading(true);

    try {
      const params = {
        page: current,
        limit: pageSize,
        ...(search?.trim() && { search: search.trim() }),
        ...(selectedStatus &&
          selectedStatus.toString().toLowerCase() !== "all" && {
            status: selectedStatus,
          }),
      };

      const ordersResp = await ordersAPI.getAll(params);
      const rawOrders = extractArray(ordersResp);

      const mappedOrders = rawOrders.map((o) => ({
        id: o._id,
        orderNumber: o.orderNumber || "",
        customerName: o.userId?.firstName || "",
        vendorName: o.vendorName || o.storeName || "",
        agentName: o.deliveryPartnerName || o.agentName || null,
        itemsCount: Array.isArray(o.items)
          ? o.items.reduce((total, item) => total + (item.quantity || 0), 0)
          : 0,
        total: o.totalAmount ?? o.total ?? o.subtotal ?? 0,
        paymentStatus: (o.paymentStatus || "").toLowerCase(),
        status: (o.status || o.vendorAcceptanceStatus || "")
          .toString()
          .toUpperCase(),
        createdAt: o.createdAt || o.created_at || o.date,
        __raw: o,
      }));

      setOrders(mappedOrders);

      const paginator =
        ordersResp?.paginator || ordersResp?.data?.paginator || null;
      if (paginator) {
        setCurrentPage(paginator.currentPage || current);
        setPageSize(paginator.perPage || pageSize);
        setTotalItems(paginator.itemCount || 0);
      } else {
        setCurrentPage(current);
        setPageSize(pageSize);
        setTotalItems(mappedOrders.length || 0);
      }
      if (!agents.length) {
        try {
          const agentsResp = await deliveryPartnersAPI.getAll();
          const rawAgents = extractArray(agentsResp);
          setAgents(rawAgents.filter((a) => a.status === "active"));
        } catch {
          setAgents([]);
        }
      }
    } catch (error) {
      message.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    const { current = 1, pageSize: newSize = pageSize } = pagination || {};
    setCurrentPage(current);
    setPageSize(newSize);
    fetchData({ current, pageSize: newSize });
  };

  const handleAssignAgent = (order) => {
    setSelectedOrder(order);
    setAssignModalVisible(true);
  };

  const handleAssignSubmit = async (agentId) => {
    try {
      // await ordersAPI.assignAgent(selectedOrder.id, agentId);

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

  const handleEditOrder = (order) => {
    setEditOrder(order);
    // populate form with allowed fields
    editForm.setFieldsValue({
      status: order.status || undefined,
      deliveryPartnerId: order.agentId || order.deliveryPartnerId || undefined,
      expectedDeliveryAt: order.expectedDeliveryAt
        ? dayjs(order.expectedDeliveryAt)
        : undefined,
      note: order.note || "",
      cancelReason: order.cancelReason || "",
      paymentStatus: order.paymentStatus || undefined,
    });
    setEditDrawerOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      const payload = {};
      const allowed = [
        "status",
        "deliveryPartnerId",
        "expectedDeliveryAt",
        "note",
        "cancelReason",
        "paymentStatus",
      ];
      allowed.forEach((k) => {
        if (values[k] !== undefined && values[k] !== null && values[k] !== "") {
          if (k === "expectedDeliveryAt") {
            payload[k] = dayjs(values[k]).toISOString();
          } else {
            payload[k] = values[k];
          }
        }
      });

      await ordersAPI.updateOrder(
        editOrder.id || editOrder._id || editOrder.orderId,
        payload
      );

      // update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === editOrder.id || o.id === editOrder._id
            ? { ...o, ...payload }
            : o
        )
      );

      message.success("Order updated successfully");
      setEditDrawerOpen(false);
      setEditOrder(null);
      editForm.resetFields();
    } catch (error) {
      message.error("Failed to update order");
    }
  };

  // Status updates are handled via the Edit drawer (use Edit action)

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
          // await ordersAPI.processRefund(order.id, { amount: order.total });

          // Update local state immediately
          setOrders(
            orders.map((o) =>
              o.id === order.id
                ? {
                    ...o,
                    status: "REFUNDED",
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

  const handleView = async (order) => {
    setViewLoading(true);
    setViewOpen(true);
    try {
      const resp = await ordersAPI.getById(
        order.id || order._id || order.orderNumber
      );
      const data = resp?.data || resp;
      setViewData(data);
    } catch (error) {
      setViewData(order);
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => {
    setViewOpen(false);
    setViewData(null);
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
      render: (text) => (
        <span
          style={{
            backgroundColor: "#f0f0f0",
            color: "#3c2f3d",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: "bolder",
            padding: "5px",
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Agent",
      dataIndex: "agentName",
      key: "agentName",
      align: "center",

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
      render: (_, record) => record.itemsCount || 0,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total) => `₹${total}`,
      sorter: (a, b) => (a.total || 0) - (b.total || 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const style = STATUS_STYLES[status] || {
          color: "#595959",
          bg: "#fafafa",
          border: "#d9d9d9",
        };

        return (
          <span
            style={{
              display: "inline-block",
              minWidth: 20,
              textAlign: "center",
              padding: "4px 10px",
              fontSize: 13,
              fontWeight: 600,
              color: style.color,
              backgroundColor: style.bg,
              border: `1px solid ${style.border}`,
              borderRadius: "12px",
            }}
          >
            {status.replace(/_/g, " ")}
          </span>
        );
      },
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
            onClick={() => handleEditOrder(record)}
            title="Edit"
            style={{ color: "#ffbc2c" }}
          />
          <Button
            type="text"
            size="small"
            icon={<UserSwitchOutlined />}
            onClick={() => handleAssignAgent(record)}
            title="Assign Agent"
            style={{ color: "#23ac6d" }}
          />
          {record.paymentStatus === "completed" &&
            record.status !== "REFUNDED" && (
              <Button
                type="text"
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleRefund(record)}
                title="Refund"
                danger
                style={{ color: "#ef4444" }}
              />
            )}
        </Space>
      ),
    },
  ];

  const filterOrdersByStatus = (status) => {
    if (!status) return orders;
    if (typeof status === "string" && status.toLowerCase() === "all")
      return orders;
    return orders.filter(
      (order) =>
        (order.status || "").toString().toUpperCase() ===
        status.toString().toUpperCase()
    );
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
    ...STATUS_TABS.map((s) => ({
      key: s,
      label: `${s.replace(/_/g, " ")} (${filterOrdersByStatus(s).length})`,
      children: (
        <Table
          columns={columns}
          dataSource={filterOrdersByStatus(s)}
          rowKey="id"
          loading={loading}
        />
      ),
    })),
  ];

  const pendingCount = filterOrdersByStatus("ACCEPTANCE_PENDING").length;
  const ongoingCount =
    filterOrdersByStatus("PROCESSING").length +
    filterOrdersByStatus("ORDER_PACKED").length +
    filterOrdersByStatus("SHIPPED").length;
  const completedCount =
    filterOrdersByStatus("COMPLETED").length +
    filterOrdersByStatus("DELIVERED").length;
  const cancelledCount = filterOrdersByStatus("CANCELLED").length;

  const orderStatCards = [
    {
      key: "total",
      label: "Total Orders",
      value: formatNumber(totalItems), // Use total from paginator, not just current page
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
      iconColor: "#ffbc2c",
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
    pagination: {
      current: currentPage,
      pageSize,
      total: totalItems,
      showSizeChanger: true,
      pageSizeOptions: [10, 25, 50],
    },
    onChange: handleTableChange,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Drawer
        open={viewOpen}
        onClose={closeViewModal}
        width={720}
        title={
          viewData?.orderNumber
            ? `Order ${viewData.orderNumber}`
            : "Order Details"
        }
      >
        <div style={{ padding: 16 }}>
          {viewLoading ? (
            <Card loading style={{ width: "100%" }} />
          ) : viewData ? (
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Order Number">
                {viewData.orderNumber || viewData.orderId || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                {viewData.userId?.firstName || viewData.customerName || "-"}
                {viewData.userId?.mobNo ? ` • ${viewData.userId.mobNo}` : ""}
              </Descriptions.Item>
              <Descriptions.Item label="Items">
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {(Array.isArray(viewData.items) ? viewData.items : []).map(
                    (it, idx) => (
                      <div
                        key={it.productId || it._id || idx}
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "center",
                        }}
                      >
                        <Image
                          src={
                            Array.isArray(it.productImage) &&
                            it.productImage[0]?.uri
                              ? it.productImage[0].uri
                              : it.productImage?.[0]?.uri
                          }
                          alt={it.productName}
                          width={64}
                          height={64}
                          fallback="https://via.placeholder.com/80?text=No+Image"
                          style={{ objectFit: "cover", borderRadius: 8 }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>
                            {it.productName || it.name || "-"}
                          </div>
                          <div style={{ color: "#6b7280", fontSize: 13 }}>
                            Qty: {it.quantity ?? it.qty ?? 0} • Price: ₹
                            {it.price ?? it.unitPrice ?? 0}
                          </div>
                        </div>
                        <div style={{ fontWeight: 700 }}>
                          ₹{(it.quantity ?? 0) * (it.price ?? 0)}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Subtotal">
                ₹{viewData.subtotal ?? viewData.subTotal ?? viewData.total ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label="Shipping">
                ₹{viewData.shipping ?? viewData.deliveryCharge ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label="Total">
                ₹{viewData.totalAmount ?? viewData.total ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {(viewData.status || viewData.vendorAcceptanceStatus || "")
                  .toString()
                  .replace(/_/g, " ")}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                {(viewData.paymentStatus || "-").toString()}
              </Descriptions.Item>
              <Descriptions.Item label="Store Breakdown">
                {(Array.isArray(viewData.storeBreakdown)
                  ? viewData.storeBreakdown
                  : []
                ).map((s) => {
                  const itemsArray = Array.isArray(viewData.items)
                    ? viewData.items
                    : [];
                  // try to locate a matching item to extract the store name
                  const matchedItem = itemsArray.find((it) => {
                    const sid = it.storeId;
                    const sidKey =
                      sid && (sid._id || sid.id || sid.storeId)
                        ? sid._id || sid.id || sid.storeId
                        : sid;
                    return String(sidKey) === String(s.storeId);
                  });
                  const storeName =
                    matchedItem?.storeId?.storeName ||
                    matchedItem?.storeId?.name ||
                    s.storeName ||
                    String(s.storeId || "Store");

                  return (
                    <div key={s.storeId || s._id} style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 600 }}>{storeName}</div>
                      <div style={{ color: "#6b7280", fontSize: 13 }}>
                        Subtotal: ₹{s.subtotal ?? 0} • Shipping: ₹
                        {s.shipping ?? 0} • Total: ₹{s.total ?? 0}
                      </div>
                    </div>
                  );
                })}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {new Date(
                  viewData.createdAt || viewData.updatedAt || Date.now()
                ).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <div>No data</div>
          )}
        </div>
      </Drawer>

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
            Order Management
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
              placeholder="Search orders..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%", minWidth: 220, flex: 1, maxWidth: 360 }}
              size="large"
              allowClear
            />
            <Button
              icon={<ExportOutlined />}
              style={{
                background: "#9dda52",
                color: "#3c2f3d",
                width: "100%",
                maxWidth: 180,
                border: "0.2px solid #3c2f3d",
              }}
            >
              Export Orders
            </Button>
          </div>
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
            border: "0.2px solid #3c2f3d",
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
      <Drawer
        title={
          editOrder?.orderNumber
            ? `Edit ${editOrder.orderNumber}`
            : "Edit Order"
        }
        open={editDrawerOpen}
        onClose={() => {
          setEditDrawerOpen(false);
          setEditOrder(null);
          editForm.resetFields();
        }}
        width={560}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: "Please select a status" }]}
              >
                <Select placeholder="Select status" allowClear>
                  {STATUS_TABS.map((s) => (
                    <Select.Option key={s} value={s}>
                      {s
                        .replace(/_/g, " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="deliveryPartnerId" label="Delivery Partner">
                <Select placeholder="Select delivery partner" allowClear>
                  {agents.map((a) => (
                    <Select.Option key={a.id} value={a.id}>
                      {a.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="expectedDeliveryAt" label="Expected Delivery At">
                <DatePicker showTime style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="paymentStatus" label="Payment Status">
                <Select placeholder="Select payment status" allowClear>
                  <Select.Option value="pending">Pending</Select.Option>
                  <Select.Option value="completed">Completed</Select.Option>
                  <Select.Option value="failed">Failed</Select.Option>
                  <Select.Option value="refunded">Refunded</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label="Note">
            <Input.TextArea
              rows={3}
              placeholder="Add an internal note (optional)"
            />
          </Form.Item>

          {(watchedStatus === "CANCELLED" ||
            watchedStatus === "VENDOR_REJECTED") && (
            <Form.Item
              name="cancelReason"
              label="Cancel Reason"
              rules={[
                { required: true, message: "Please provide a cancel reason" },
              ]}
            >
              <Input placeholder="Reason for cancellation" />
            </Form.Item>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 8,
            }}
          >
            <Button
              onClick={() => {
                setEditDrawerOpen(false);
                editForm.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={() => editForm.submit()}
              icon={<CheckCircleOutlined />}
              style={{
                background: "#9dda52",
                borderColor: "#9dda52",
                color: "#3c2f3d",
                border: "0.2px solid #3c2f3d",
              }}
            >
              Update Order
            </Button>
          </div>
        </Form>
      </Drawer>
    </div>
  );
};

export default OrderManagement;
