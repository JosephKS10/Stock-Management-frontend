const API_BASE_URL = import.meta.env.VITE_API_URL;

// Authenticate Site
export const authenticateSite = async (siteName, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sites/authenticate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ site_name: siteName, password }),
    });

    if (!response.ok) {
      throw new Error("Authentication failed");
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message);
  }
};

// Fetch Site Data
export const fetchSiteData = async (siteId, authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sites/${siteId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch site data");
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message);
  }
};

// Fetch Product Data of the site products
export const fetchProductData = async (productIds, authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ product_ids: productIds }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch product data");
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message);
  }
};


export const uploadImageToS3 = async (imageData, folder, authToken) => {
  try {
    // Convert base64 to Blob properly
    const base64Response = await fetch(imageData);
    const blob = await base64Response.blob();
    
    // Create FormData with filename
    const formData = new FormData();
    formData.append('image', blob, 'upload.jpg');  // Important: add filename
    formData.append('folder', folder);

    console.log('Sending upload request with:', {
      folder,
      blobSize: blob.size,
      formData: Array.from(formData.entries())
    });

    const response = await fetch(`${API_BASE_URL}/orders/upload-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        // Don't set Content-Type - let browser set it automatically
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Upload failed:', errorData);
      throw new Error(errorData.message || "Image upload failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error(error.message || "Failed to upload image");
  }
};

export const createCleanerOrder = async (orderData, authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error("Order creation failed");
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message);
  }
};

export const authenticateAdmin = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error("Authentication failed");
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getActiveOrders = async (authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/active`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch orders");
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getOrderDetails = async (orderNumber, authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch order details");
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getLastThreeOrders = async (site_id, order_date, authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/last-three-orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ site_id, order_date }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch last 3 orders");
    }

    return await response.json();
  } catch (error) {
    console.error("Error in getLastThreeOrders:", error);
    throw new Error(error.message || "Failed to fetch order history");
  }
};

export const updateOrderStatus = async (order_id, reason, delivery_date = '', authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/update-status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ 
        order_id, 
        reason,
        delivery_date 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update order status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    throw new Error(error.message || "Failed to update order status");
  }
};

export const updateNotes = async (order_number, notes, authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/update-notes`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ 
        order_number, 
        notes 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update order notes");
    }

    return await response.json();
  } catch (error) {
    console.error("Error in updateNotes:", error);
    throw new Error(error.message || "Failed to update order notes");
  }
};

export const updateDeliveryDate = async (order_number, delivery_date, authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/update-delivery-date`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ 
        order_number, 
        delivery_date 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update delivery date");
    }

    return await response.json();
  } catch (error) {
    console.error("Error in updateDeliveryDate:", error);
    throw new Error(error.message || "Failed to update delivery date");
  }
};

export const getOrderHistory = async (authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/completed`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch order history");
    }

    return await response.json();
  } catch (error) {
    console.error("Error in getOrderHistory:", error);
    throw new Error(error.message || "Failed to fetch order history");
  }
};