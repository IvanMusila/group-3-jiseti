const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Generic fetch function with error handling
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('API request failed:', error);
    return { data: null, error: error.message };
  }
};

// GET request
export const fetchData = async (endpoint) => {
  return apiRequest(endpoint);
};

// POST request
export const postData = async (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// PUT request
export const putData = async (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// DELETE request
export const deleteData = async (endpoint) => {
  return apiRequest(endpoint, {
    method: 'DELETE',
  });
};

// PATCH request
export const patchData = async (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

// Health check
export const checkBackendHealth = async () => {
  return apiRequest('/health');
};
