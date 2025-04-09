import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getActiveOrders } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar/AdminNavbar';
import './AdminDashboard.css';
import { FaFilter } from "react-icons/fa";


function AdminDashboard() {
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
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await getActiveOrders(authToken);
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
      fetchOrders();
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
          case 'new':
            return status === 'new order';
          case 'pending':
            return status === 'pending order';
          case 'delivery':
            return status === 'set delivery date';
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '/');
  }

  const getStatusTagClass = (status) => {
    switch (status.toLowerCase()) {
      case 'new order':
        return 'tag-new';
      case 'pending order':
        return 'tag-pending';
      case 'set delivery date':
        return 'tag-delivery';
      default:
        return 'tag-default';
    }
  };

 

  return (
    <div className="admin-layout">
      <AdminNavbar />
      
      <main className="admin-content">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <div className="filter-container">
            <label htmlFor="order-filter" className='order-filter'>Filter <FaFilter/></label>
            <select 
              id="order-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Orders</option>
              <option value="new">New Orders</option>
              <option value="pending">Pending Orders</option>
              <option value="delivery">Set Delivery Date</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-indicator">Loading orders...</div>
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

            <div><span className='black'>Location</span>: {order.site_info?.location || 'N/A'}</div>
            <div><span className='black'>Order Date</span>: {formatOrderDate(order?.order_date)}</div>
            <div><span className='black'>Placed by</span>: {order?.cleaner_email}</div>
          </div>
        </div>
        <div className="order-action">
          <button 
            className="view-button" 
            onClick={() => navigate(`/admin-order-summary/`, { 
              state: { order_number: order.order_number } 
            })}>
            View Order
          </button>
        </div>
      </div> ))
            ) : (
              <div className="no-orders">
                {allOrders.length === 0 ? 'No orders found' : 'No orders match the selected filter'}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;