// lib/api.js
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const categoryAPI = {
  // Get all categories (hierarchical structure)
  async getAll() {
    const response = await fetch(`${API_URL}/categories?tree=true`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch categories');
    const result = await response.json();
    
    // Handle Laravel paginated response: { success, data: { data: [...] } }
    // OR tree response: { success, data: [...] }
    if (result.success) {
      // If data has a 'data' property (pagination), use that
      if (result.data && Array.isArray(result.data.data)) {
        return result.data.data;
      }
      // Otherwise use data directly
      return result.data || [];
    }
    
    // Fallback for direct array response
    return Array.isArray(result) ? result : [];
  },

  // Create category
  async create(data) {
    const response = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create category');
    }
    
    const result = await response.json();
    // Handle { success, data: category }
    return result.data || result;
  },

  // Update category
  async update(id, data) {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update category');
    }
    
    const result = await response.json();
    // Handle { success, data: category }
    return result.data || result;
  },

  // Delete category
  async delete(id) {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete category');
    }
    
    const result = await response.json();
    return result.data || result;
  },

  // Upload image
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload image');
    }
    
    const result = await response.json();
    // Adjust based on your upload endpoint response format
    return { url: result.url || result.data?.url || result.path };
  }
};