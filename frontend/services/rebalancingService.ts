import axios from '@/lib/axios';
import { ApiResponse, PaginatedResponse } from './api.types';

export interface RebalancingRequest {
  id: number;
  product_id: number;
  source_store_id: number;
  destination_store_id: number;
  quantity: number;
  reason?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  requested_by: number;
  approved_by?: number;
  approved_at?: string;
  completed_at?: string;
  dispatch_id?: number;
  product?: any;
  sourceStore?: any;
  destinationStore?: any;
  requestedBy?: any;
  approvedBy?: any;
  dispatch?: any;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRebalancingPayload {
  product_id: number;
  source_store_id: number;
  destination_store_id: number;
  quantity: number;
  reason?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface RebalancingSuggestion {
  product_id: number;
  product_name: string;
  sku: string;
  from_store_id: number;
  from_store_name: string;
  from_store_quantity: number;
  to_store_id: number;
  to_store_name: string;
  to_store_quantity: number;
  to_store_reorder_level: number;
  suggested_quantity: number;
  reason: string;
}

export interface RebalancingFilters {
  status?: string;
  store_id?: number;
  product_id?: number;
  per_page?: number;
}

export interface RebalancingStatistics {
  total: number;
  by_status: {
    pending: number;
    approved: number;
    completed: number;
    rejected: number;
    cancelled: number;
  };
  recent_activity: RebalancingRequest[];
}

class RebalancingService {
  private readonly endpoint = '/inventory-rebalancing';

  /**
   * Get all rebalancing requests
   */
  async getRebalancingRequests(filters?: RebalancingFilters): Promise<PaginatedResponse<RebalancingRequest>> {
    const response = await axios.get(this.endpoint, { params: filters });
    return response.data;
  }

  /**
   * Get rebalancing suggestions based on stock levels
   */
  async getSuggestions(): Promise<ApiResponse<{
    total_suggestions: number;
    suggestions: RebalancingSuggestion[];
  }>> {
    const response = await axios.get(`${this.endpoint}/suggestions`);
    return response.data;
  }

  /**
   * Create a new rebalancing request
   */
  async createRebalancingRequest(payload: CreateRebalancingPayload): Promise<ApiResponse<RebalancingRequest>> {
    const response = await axios.post(this.endpoint, payload);
    return response.data;
  }

  /**
   * Approve a rebalancing request
   */
  async approveRequest(id: number): Promise<ApiResponse<RebalancingRequest>> {
    const response = await axios.post(`${this.endpoint}/${id}/approve`);
    return response.data;
  }

  /**
   * Reject a rebalancing request
   */
  async rejectRequest(id: number, rejectionReason: string): Promise<ApiResponse<RebalancingRequest>> {
    const response = await axios.post(`${this.endpoint}/${id}/reject`, {
      rejection_reason: rejectionReason
    });
    return response.data;
  }

  /**
   * Cancel a rebalancing request
   */
  async cancelRequest(id: number): Promise<ApiResponse<RebalancingRequest>> {
    const response = await axios.post(`${this.endpoint}/${id}/cancel`);
    return response.data;
  }

  /**
   * Mark rebalancing as completed
   */
  async completeRequest(id: number): Promise<ApiResponse<RebalancingRequest>> {
    const response = await axios.post(`${this.endpoint}/${id}/complete`);
    return response.data;
  }

  /**
   * Get statistics for rebalancing operations
   */
  async getStatistics(): Promise<ApiResponse<RebalancingStatistics>> {
    const response = await axios.get(`${this.endpoint}/statistics`);
    return response.data;
  }
}

export default new RebalancingService();
