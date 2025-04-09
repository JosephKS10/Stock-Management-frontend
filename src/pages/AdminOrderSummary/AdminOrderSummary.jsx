import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getOrderDetails, getLastThreeOrders, updateOrderStatus, updateNotes, updateDeliveryDate } from '../../utils/api';
import AdminNavbar from '../../components/AdminNavbar/AdminNavbar';
import './AdminOrderSummary.css';
import { FaRegArrowAltCircleLeft } from "react-icons/fa";


const OrderHistoryCard = ({ order }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '/');
  };

  const getStatusTagClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'tag-accepted';
      case 'rejected':
        return 'tag-rejected';
      case 'pending':
        return 'tag-pending';
      default:
        return 'tag-default';
    }
  };

  return (
    <div className="order-history-card">
      <div className="order-history-header">
        <div className="order-history-title">
          Order {order.order_number} - {order.site_info?.organization_name}
          <span className={`status-tag ${getStatusTagClass(order?.order_status)}`}>
          {order.order_status}
        </span>
        </div>
        <div className="order-right">
        <div className="order-id">
          <span style={{color:"#6A6A6A"}}>Order ID</span> {order?._id}
        </div>
       </div>
      </div>
      <div className="order-history-details">
        <div><span className="black">Site:</span> {order.site_info?.site_name}</div>
        <div><span className="black">Location:</span> {order.site_info?.location}</div>
        <div><span className="black">Date:</span> {formatDate(order.order_date)}</div>
      </div>
      <div className="order-items-grid">
        {order.order_items.map((item, index) => (
          <div key={index} className="order-item">
            <div className="item-name">{item.product_name}</div>
            <div className="item-quantity">Qty: {item.quantity}</div>
          </div>
        ))}
      </div>
      {order.order_status.toLowerCase() === 'rejected' && order.notes && (
        <div className="rejection-notes">
          <strong>Rejection Reason:</strong> {order.notes}
        </div>
      )}
    </div>
  );
};

function AdminOrderSummary() {
  const location = useLocation();
  const orderId = location.state?.order_number || null;

  const { authToken } = useAdminAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth >= 768);
  const [selectedImage, setSelectedImage] = useState(null);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [actionType, setActionType] = useState(null); // 'accept' or 'reject'
  const [rejectionReason, setRejectionReason] = useState('');
  const [orderHistory, setOrderHistory] = useState([]);

  const [showDeliveryDatePopup, setShowDeliveryDatePopup] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [dateUpdateLoading, setDateUpdateLoading] = useState(false);
  const [dateUpdateError, setDateUpdateError] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const data = await getOrderDetails(orderId, authToken);
        setOrder(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    if (authToken) {
      fetchOrderDetails();
    }
  }, [orderId, authToken]);

  useEffect(() => {
    const updateToPendingIfNew = async () => {
      if (order?.order_status === 'new order' && authToken) {
        try {
          await updateOrderStatus(
            order._id,
            'viewed',
            'Order viewed by admin',
            authToken
          );
          
          const updatedOrder = await getOrderDetails(orderId, authToken);
          setOrder(updatedOrder);
          
        } catch (error) {
          console.error('Error updating order status to pending:', error);
          // You might want to show a toast notification here
        }
      }
    };
  
    updateToPendingIfNew();
  }, [order, authToken, orderId]);

  useEffect(() => {
    const fetchOrderHistory = async () => {
      if (order?.site_info?.site_id && order?.order_date) {
        try {
          const data = await getLastThreeOrders(
            order.site_info.site_id,
            order.order_date,
            authToken
          );
          setOrderHistory(data);
        } catch (error) {
          console.error('Error fetching order history:', error);
        }
      }
    };
  
    fetchOrderHistory();
  }, [order, authToken]);

  const openImagePopup = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImagePopup = () => {
    setSelectedImage(null);
  };

  if (!orderId) {
    return (
      <div className="error-message">
        <h1>Order ID not found. Please go back to the dashboard.</h1>
        <button
          className="back-button"
          onClick={() => navigate('/admin-dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Handle invalid date
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

  const handleActionClick = (type) => {
    setActionType(type);
    setShowConfirmation(true);
  };
  
  const handleConfirmAction = async () => {
    try {
      if (actionType === 'accept') {
        // For accept, update status to 'set delivery date'
        const response = await updateOrderStatus(
          order._id,
          'accepted', // This will make the backend set status to 'set delivery date'
          'Order accepted by admin',
          authToken
        );
        
        // Update local state
        setOrder({
          ...order,
          order_status: 'set delivery date'
        });
        
        alert('Order accepted! Please set a delivery date.');
        
      } else if (actionType === 'reject') {
        // For reject, first update notes if provided
        if (rejectionReason.trim()) {
          await updateNotes(
            order.order_number,
            rejectionReason,
            authToken
          );
        }
        
        // Then update status to 'rejected'
        const response = await updateOrderStatus(
          order._id,
          'rejected',
          rejectionReason || 'Order rejected by admin',
          authToken
        );
        
        // Update local state
        setOrder({
          ...order,
          order_status: 'rejected',
          notes: rejectionReason
        });
        
        alert('Order rejected successfully!');
      }
      
      // Close modal and reset state
      setShowConfirmation(false);
      setRejectionReason('');
      setActionType(null);
      
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const handleCancelAction = () => {
    setShowConfirmation(false);
    setRejectionReason('');
    setActionType(null);
  };

  const handleDeliveryDateSubmit = async () => {
    try {
      setDateUpdateLoading(true);
      setDateUpdateError(null);
      const selectedDate = new Date(deliveryDate);
      const formattedDate = selectedDate.toISOString();

      await updateDeliveryDate(
        order.order_number,
        formattedDate,
        authToken
      );
      
      // Then update the status to 'accepted'
      await updateOrderStatus(
        order._id,
        'accepted',
        formattedDate,
        authToken
      );
      
      // Refresh the order data
      const updatedOrder = await getOrderDetails(orderId, authToken);
      setOrder(updatedOrder);
      
      // Close the popup and reset state
      setShowDeliveryDatePopup(false);
      setDeliveryDate('');
      setDateUpdateLoading(false);
      
    } catch (error) {
      console.error('Error updating delivery date:', error);
      setDateUpdateError(error.message || 'Failed to update delivery date');
      setDateUpdateLoading(false);
    }
  };

  if (!isMobile) {
    return (
      <div className="warning-screen">
        <h1 style={{ fontSize: "2.5rem" }}>
          This page is only accessible on <span className="indigo-blue">Desktop devices</span>
        </h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminNavbar />
        <main className="admin-content">
          <div className="loading-indicator">Loading order details...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-layout">
        <AdminNavbar />
        <main className="admin-content">
          <div className="error-message">{error}</div>
          <button 
            className="back-button"
            onClick={() => navigate('/admin-dashboard')}
          >
            Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  // Group order items by product type
  const consumables = order?.order_items?.filter(item => item.product_type === "consumable") || [];
  const otherItems = order?.order_items?.filter(item => item.product_type !== "consumable") || [];

  const renderItemsTable = (items, title) => {
    return (
      <div className="order-items-category">
        <h3>{title}</h3>
        <div className="table-container">
          <table className="order-items-table">
            <thead>
              <tr>
                <th>Item Type</th>
                <th>Item Name</th>
                <th>Units</th>
                <th>Is this item available on site</th>
                <th>How many items are there in the cleaner's room?</th>
                <th>Images of Items</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id?.$oid || item._id}>
                  <td>{item.product_type}</td>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.item_already_on_site ? 'Yes' : 'No'}</td>
                  <td>{item.item_available_on_site}</td>
                  <td>
                    <div className="item-thumbnail-container">
                      {item.item_photos && item.item_photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`${item.product_name} ${index + 1}`}
                          className="item-thumbnail"
                          onClick={() => openImagePopup(photo)}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-layout">
      <AdminNavbar />
      
      <main className="admin-content">
        <div className="order-summary-header">
          <button 
            className="back-button"
            onClick={() => navigate('/admin-dashboard')}
          >
            <FaRegArrowAltCircleLeft />
            Back
          </button>
          <h1>Order Summary</h1>
        </div>

        {order && (
          <div className="order-summary-container">
            <div className="order-info">
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <div className="order-header">
                  <div className="order-title">
                    Order {order.order_number || 'N/A'} - {order.site_info?.organization_name || 'N/A'}
                  </div>
                  <span className={`status-tag ${getStatusTagClass(order?.order_status)}`}>
                    {order.order_status}
                  </span>
                </div>
                <div className="order-id">
                  <span style={{color:"#6A6A6A"}}>Order ID</span> {order?._id}
                </div>
              </div>
              <div className="site-name">{order.site_info?.site_name || 'N/A'}</div>
              <div className="order-details" style={{border: 'none', padding: '0'}}>
                <div><span className='black'>Location</span>: {order.site_info?.location || 'N/A'}</div>
                <div><span className='black'>Order Date</span>: {formatDate(order?.order_date)}</div>
                <div><span className='black'>Placed by</span>: {order?.cleaner_email}</div>
              </div>
            </div>

            <div className="order-items-section">
              <h2>Order Items</h2>

              {/* Tabular format for order items */}
              {consumables.length > 0 && renderItemsTable(consumables, "Consumables")}
              {otherItems.length > 0 && renderItemsTable(otherItems, "Other Items")}
              
              {/* Image Popup */}
              {selectedImage && (
                <div className="image-popup-overlay" onClick={closeImagePopup}>
                  <div className="image-popup-content" onClick={(e) => e.stopPropagation()}>
                    <span className="close-popup" onClick={closeImagePopup}>&times;</span>
                    <img src={selectedImage} alt="Enlarged view" className="enlarged-image" />
                  </div>
                </div>
              )}
            </div>

            <div className="room-photos-section">
              <h2>Cleaner's Room Photos</h2>
              <div className="photo-grid">
                {order.cleaner_room_photos.map((photo, index) => (
                  <img 
                    key={index} 
                    src={photo} 
                    alt={`Room ${index + 1}`} 
                    className="room-photo"
                    onClick={() => openImagePopup(photo)}
                  />
                ))}
              </div>
            </div>

            <div className="order-history-section">
            <h2>Order History (Last 3 Orders)</h2>
              {orderHistory.length > 0 ? (
                orderHistory.map((historyOrder) => (
                  (historyOrder.order_status == 'accepted' || historyOrder.order_status == 'rejected' ) ? (
                  <OrderHistoryCard key={historyOrder._id} order={historyOrder} />
                  ) :
                  (
                    <div className="no-history">No order history found for this site</div>
                  )
                ))
              ) : (
                <div className="no-history">No order history found for this site</div>
              )}

          </div>

          {order.order_status.toLowerCase() === 'rejected' && order.notes && (
            <div className="rejection-notes">
              <strong>Rejection Reason:</strong> {order.notes}
            </div>
          )}

            <div className="order-actions">
            {(order?.order_status === 'new order' || order?.order_status === 'pending order') && (
              <>
                <button 
                  className="action-button accept"
                  onClick={() => handleActionClick('accept')}
                >
                  Accept Order
                </button>
                <button 
                  className="action-button reject"
                  onClick={() => handleActionClick('reject')}
                >
                  Reject Order
                </button>
              </>
            )}
          </div>
          </div>
        )}

        {showConfirmation && (
          <div className="confirmation-modal">
            <div className="modal-content">
              <h3>Are you sure you want to {actionType} this order?</h3>
              
              {actionType === 'reject' && (
                <div className="rejection-reason">
                  <label>Reason for rejection:</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejecting this order..."
                  />
                </div>
              )}
              
              <div className="modal-actions">
                <button 
                  className="modal-button confirm" 
                  onClick={handleConfirmAction}
                >
                  Yes
                </button>
                <button 
                  className="modal-button cancel" 
                  onClick={handleCancelAction}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeliveryDatePopup && (
          <div className="delivery-date-popup">
            <div className="popup-content">
              <div className="popup-header">
                <h3>Set Delivery Date</h3>
                <button 
                  className="close-popup" 
                  onClick={() => {
                    setShowDeliveryDatePopup(false);
                    setDateUpdateError(null);
                  }}
                >
                  &times;
                </button>
              </div>
              
              <div className="popup-body">
                <label htmlFor="delivery-date">Select Delivery Date:</label>
                <input
                  type="date"
                  id="delivery-date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} // Disable past dates
                />
                
                {dateUpdateError && (
                  <div className="error-message">{dateUpdateError}</div>
                )}
              </div>
              
              <div className="popup-footer">
                <button
                  className="cancel-button"
                  onClick={() => {
                    setShowDeliveryDatePopup(false);
                    setDateUpdateError(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="confirm-button"
                  onClick={handleDeliveryDateSubmit}
                  disabled={!deliveryDate || dateUpdateLoading}
                >
                  {dateUpdateLoading ? 'Updating...' : 'Confirm Date'}
                </button>
              </div>
            </div>
          </div>
        )}

          {order?.order_status === 'set delivery date' && (
            <div className="approved-actions">
              <button 
                className="action-button delivery"
                onClick={() => setShowDeliveryDatePopup(true)}
              >
                Set Delivery Date
              </button>
            </div>
          )}

          {order?.order_status === 'accepted' && (
            <div className="approved-actions">
              <button className="action-button zoho">Add to Zoho</button>
              <button className="action-button email">Send Email to Cleaner</button>
              <button className="action-button pdf">Save as PDF</button>
            </div>
          )}
      </main>
    </div>
  );
}

export default AdminOrderSummary;