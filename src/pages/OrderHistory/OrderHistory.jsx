import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getOrderHistory } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar/AdminNavbar';
import './OrderHistory.css';
import { FaFilter } from "react-icons/fa";

function OrderHistory() {
  const [isMobile, setIsMobile] = useState(window.innerWidth >= 768);
  const [allOrders, setAllOrders] = useState([]); // Store all orders
  const [filteredOrders, setFilteredOrders] = useState([]); // Store filtered orders
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const { authToken } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        setLoading(true);
        const data = await getOrderHistory(authToken);
        setAllOrders(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setAllOrders([]);
      } finally {
        setLoading(false);
      }
    };

    if (authToken) {
      fetchOrderHistory();
    }
  }, [authToken]);

  // Apply filtering whenever filter or allOrders changes
  useEffect(() => {
    if (filter === 'all') {
      setFilteredOrders(allOrders);
    } else {
      const filtered = allOrders.filter(order => {
        const status = order.order_status.toLowerCase();
        switch (filter) {
          case 'accepted':
            return status === 'accepted';
          case 'rejected':
            return status === 'rejected';
          default:
            return true;
        }
      });
      setFilteredOrders(filtered);
    }
  }, [filter, allOrders]);

  if (!isMobile) {
    return (
      <div className="warning-screen">
        <h1 style={{ fontSize: "2.5rem" }}>
          This page is only accessible on <span className="indigo-blue">Desktop devices</span>
        </h1>
      </div>
    );
  }

  const formatOrderDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '/');
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  };

  const getStatusTagClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'tag-accepted';
      case 'rejected':
        return 'tag-rejected';
      default:
        return 'tag-default';
    }
  };

  return (
    <div className="admin-layout">
      <AdminNavbar />
      
      <main className="admin-content">
        <div className="dashboard-header">
          <h1>Order History</h1>
          <div className="filter-container">
            <label htmlFor="order-filter" className='order-filter'>Filter <FaFilter/></label>
            <select 
              id="order-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Orders</option>
              <option value="accepted">Approved Orders</option>
              <option value="rejected">Rejected Orders</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-indicator">Loading order history...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="orders-container">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-info">
                    <div className="order-header">
                      <div className="order-title">
                        Order {order.order_number || 'N/A'} - {order.site_info?.organization_name || 'N/A'}
                      </div>
                      <span className={`status-tag ${getStatusTagClass(order?.order_status)}`}>
                        {order.order_status}
                      </span>
                    </div>
                    <div className="site-name">{order.site_info?.site_name || 'N/A'}</div>
                    <div className="order-details" style={{border: 'none', padding: '0'}}>
                      <div><span className='black'>Location:</span> {order.site_info?.location || 'N/A'}</div>
                      <div><span className='black'>Order Date:</span> {formatOrderDate(order?.order_date)}</div>
                      {order.order_status.toLowerCase() === 'rejected' && order.notes && (
                        <div className="rejection-reason">
                          <span className='black'>Reason:</span> {order.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="order-action">
                    <button 
                      className="view-button" 
                      onClick={() => navigate(`/admin-order-summary/`, { 
                        state: { order_number: order.order_number } 
                      })}
                    >
                      View Order
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-orders">
                {allOrders.length === 0 ? 'No orders found in history' : 'No orders match the selected filter'}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default OrderHistory;