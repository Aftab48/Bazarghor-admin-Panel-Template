import { Tag } from 'antd';

const StatusTag = ({ status }) => {
  // Handle numeric status codes from backend (1 = PENDING, 2 = APPROVED)
  const numericStatusMap = {
    1: { color: 'blue', text: 'Pending' },
    2: { color: 'green', text: 'Approved' },
  };

  // If status is a number, use numeric mapping
  if (typeof status === 'number') {
    const config = numericStatusMap[status] || { color: 'default', text: `Status ${status}` };
    return <Tag color={config.color}>{config.text}</Tag>;
  }

  const statusConfig = {
    // User statuses
    active: { color: 'green', text: 'Active' },
    inactive: { color: 'red', text: 'Inactive' },
    suspended: { color: 'orange', text: 'Suspended' },
    pending: { color: 'blue', text: 'Pending' },
    approved: { color: 'green', text: 'Approved' },
    rejected: { color: 'red', text: 'Rejected' },
    
    // Order statuses
    confirmed: { color: 'cyan', text: 'Confirmed' },
    preparing: { color: 'orange', text: 'Preparing' },
    ready: { color: 'blue', text: 'Ready' },
    picked_up: { color: 'purple', text: 'Picked Up' },
    in_transit: { color: 'geekblue', text: 'In Transit' },
    delivered: { color: 'green', text: 'Delivered' },
    cancelled: { color: 'red', text: 'Cancelled' },
    refunded: { color: 'magenta', text: 'Refunded' },
    
    // Payment statuses
    completed: { color: 'green', text: 'Completed' },
    failed: { color: 'red', text: 'Failed' },
    
    // Ticket statuses
    open: { color: 'blue', text: 'Open' },
    in_progress: { color: 'orange', text: 'In Progress' },
    resolved: { color: 'green', text: 'Resolved' },
    closed: { color: 'default', text: 'Closed' },
    
    // Ticket priorities
    low: { color: 'default', text: 'Low' },
    medium: { color: 'blue', text: 'Medium' },
    high: { color: 'orange', text: 'High' },
    urgent: { color: 'red', text: 'Urgent' },
  };

  const statusStr = status ? String(status).toLowerCase() : '';
  const config = statusConfig[statusStr] || { color: 'default', text: status || 'Unknown' };

  return <Tag color={config.color}>{config.text}</Tag>;
};

export default StatusTag;

