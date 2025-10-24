import { Tag } from 'antd';

const StatusTag = ({ status }) => {
  const statusConfig = {
    // User statuses
    active: { color: 'green', text: 'Active' },
    inactive: { color: 'red', text: 'Inactive' },
    suspended: { color: 'orange', text: 'Suspended' },
    pending: { color: 'blue', text: 'Pending' },
    
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

  const config = statusConfig[status?.toLowerCase()] || { color: 'default', text: status };

  return <Tag color={config.color}>{config.text}</Tag>;
};

export default StatusTag;

