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