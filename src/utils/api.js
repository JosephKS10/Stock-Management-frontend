const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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

// Fetch Product Data
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