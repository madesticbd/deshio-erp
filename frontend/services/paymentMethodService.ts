import axiosInstance from '@/lib/axios';

export interface PaymentMethod {
  id: number;
  name: string;
  type: 'cash' | 'bank_transfer' | 'card' | 'mobile_banking' | 'cheque' | 'other';
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentMethodFormData {
  name: string;
  type: 'cash' | 'bank_transfer' | 'card' | 'mobile_banking' | 'cheque' | 'other';
  description?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

class PaymentMethodService {
  private readonly baseURL = '/payment-methods';

  /**
   * Get all payment methods with optional filters
   */
  async getAll(params?: {
    type?: string;
    is_active?: boolean;
    search?: string;
    sort_by?: string;
    sort_direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Promise<PaymentMethod[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<PaginatedResponse<PaymentMethod>>>(
        this.baseURL,
        { params }
      );
      
      // Handle paginated response
      if (response.data.success && response.data.data && Array.isArray(response.data.data.data)) {
        return response.data.data.data;
      }
      
      // Fallback for non-paginated response
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      console.warn('Unexpected payment methods response format:', response.data);
      return [];
    } catch (error: any) {
      console.error('Get payment methods error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch payment methods');
    }
  }

  /**
   * Get single payment method by ID
   */
  async getById(id: number): Promise<PaymentMethod> {
    try {
      const response = await axiosInstance.get<ApiResponse<PaymentMethod>>(
        `${this.baseURL}/${id}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Get payment method error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch payment method');
    }
  }

  /**
   * Create a new payment method
   */
  async create(data: PaymentMethodFormData): Promise<PaymentMethod> {
    try {
      const response = await axiosInstance.post<ApiResponse<PaymentMethod>>(
        this.baseURL,
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Create payment method error:', error);
      const message = error.response?.data?.message || 'Failed to create payment method';
      const errors = error.response?.data?.errors;
      if (errors) {
        const errorMessages = Object.values(errors).flat().join(', ');
        throw new Error(errorMessages);
      }
      throw new Error(message);
    }
  }

  /**
   * Update existing payment method
   */
  async update(id: number, data: Partial<PaymentMethodFormData>): Promise<PaymentMethod> {
    try {
      const response = await axiosInstance.put<ApiResponse<PaymentMethod>>(
        `${this.baseURL}/${id}`,
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Update payment method error:', error);
      const message = error.response?.data?.message || 'Failed to update payment method';
      const errors = error.response?.data?.errors;
      if (errors) {
        const errorMessages = Object.values(errors).flat().join(', ');
        throw new Error(errorMessages);
      }
      throw new Error(message);
    }
  }

  /**
   * Delete payment method
   */
  async delete(id: number): Promise<void> {
    try {
      await axiosInstance.delete<ApiResponse<null>>(`${this.baseURL}/${id}`);
    } catch (error: any) {
      console.error('Delete payment method error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete payment method');
    }
  }

  /**
   * Activate payment method
   */
  async activate(id: number): Promise<PaymentMethod> {
    try {
      const response = await axiosInstance.patch<ApiResponse<PaymentMethod>>(
        `${this.baseURL}/${id}/activate`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Activate payment method error:', error);
      throw new Error(error.response?.data?.message || 'Failed to activate payment method');
    }
  }

  /**
   * Deactivate payment method
   */
  async deactivate(id: number): Promise<PaymentMethod> {
    try {
      const response = await axiosInstance.patch<ApiResponse<PaymentMethod>>(
        `${this.baseURL}/${id}/deactivate`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Deactivate payment method error:', error);
      throw new Error(error.response?.data?.message || 'Failed to deactivate payment method');
    }
  }

  /**
   * Get active payment methods only
   */
  async getActive(): Promise<PaymentMethod[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<PaymentMethod[]>>(
        `${this.baseURL}/active`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Get active payment methods error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch active payment methods');
    }
  }

  /**
   * Get payment methods by type
   */
  async getByType(type: string): Promise<PaymentMethod[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<PaymentMethod[]>>(
        `${this.baseURL}/type/${type}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Get payment methods by type error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch payment methods by type');
    }
  }
}

const paymentMethodService = new PaymentMethodService();
export default paymentMethodService;