// services/vendorService.ts
import axiosInstance from '@/lib/axios';

export interface Vendor {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  website?: string;
  type: 'manufacturer' | 'distributor';
  credit_limit?: number;
  payment_terms?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const vendorService = {
  async getAll(params?: {
    type?: string;
    is_active?: boolean;
    search?: string;
    sort_by?: string;
    sort_direction?: 'asc' | 'desc';
    per_page?: number;
  }): Promise<Vendor[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Vendor>>>('/vendors', {
        params
      });
      
      // Backend returns: { success: true, data: { data: [...], current_page: 1, ... } }
      const result = response.data;
      
      if (result.success && result.data && Array.isArray(result.data.data)) {
        return result.data.data;
      }
      
      // Fallback for non-paginated response
      if (result.success && Array.isArray(result.data)) {
        return result.data;
      }
      
      console.warn('Unexpected vendors response format:', result);
      return [];
    } catch (error: any) {
      console.error('Get vendors error:', error);
      return [];
    }
  },

  async getById(id: number): Promise<Vendor> {
    try {
      const response = await axiosInstance.get<ApiResponse<Vendor>>(`/vendors/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Get vendor error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch vendor');
    }
  },

  async create(data: Omit<Vendor, 'id' | 'created_at' | 'updated_at' | 'is_active'>): Promise<Vendor> {
    try {
      const response = await axiosInstance.post<ApiResponse<Vendor>>('/vendors', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Create vendor error:', error);
      const message = error.response?.data?.message || 'Failed to create vendor';
      const errors = error.response?.data?.errors;
      if (errors) {
        const errorMessages = Object.values(errors).flat().join(', ');
        throw new Error(errorMessages);
      }
      throw new Error(message);
    }
  },

  async update(id: number, data: Partial<Omit<Vendor, 'id' | 'created_at' | 'updated_at'>>): Promise<Vendor> {
    try {
      const response = await axiosInstance.put<ApiResponse<Vendor>>(`/vendors/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Update vendor error:', error);
      const message = error.response?.data?.message || 'Failed to update vendor';
      const errors = error.response?.data?.errors;
      if (errors) {
        const errorMessages = Object.values(errors).flat().join(', ');
        throw new Error(errorMessages);
      }
      throw new Error(message);
    }
  },

  async delete(id: number): Promise<void> {
    try {
      // Note: Backend does soft delete (sets is_active to false)
      await axiosInstance.delete<ApiResponse<null>>(`/vendors/${id}`);
    } catch (error: any) {
      console.error('Delete vendor error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete vendor');
    }
  },

  async activate(id: number): Promise<Vendor> {
    try {
      const response = await axiosInstance.patch<ApiResponse<Vendor>>(`/vendors/${id}/activate`);
      return response.data.data;
    } catch (error: any) {
      console.error('Activate vendor error:', error);
      throw new Error(error.response?.data?.message || 'Failed to activate vendor');
    }
  },

  async deactivate(id: number): Promise<Vendor> {
    try {
      const response = await axiosInstance.patch<ApiResponse<Vendor>>(`/vendors/${id}/deactivate`);
      return response.data.data;
    } catch (error: any) {
      console.error('Deactivate vendor error:', error);
      throw new Error(error.response?.data?.message || 'Failed to deactivate vendor');
    }
  },

  async addProductImage(productId: number, imageData: { image_path: string; is_primary: boolean; order: number }): Promise<void> {
    try {
      await axiosInstance.post(`/products/${productId}/images`, imageData);
    } catch (error: any) {
      console.error('Add product image error:', error);
      throw new Error(error.response?.data?.message || 'Failed to add product image');
    }
  },
};