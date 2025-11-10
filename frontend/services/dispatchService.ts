import axios from '@/lib/axios';
import { ApiResponse, PaginatedResponse } from './api.types';

export interface ProductInfo {
  id: number;
  name: string;
  sku: string;
}

export interface StoreInfo {
  id: number;
  name: string;
}

export interface BatchInfo {
  id: number;
  batch_number: string;
  barcode?: string;
}

export interface DispatchItem {
  id: number;
  product: ProductInfo;
  batch: BatchInfo;
  quantity: number;
  received_quantity?: number;
  damaged_quantity?: number;
  missing_quantity?: number;
  status: string;
  unit_cost: string;
  unit_price: string;
  total_cost: string;
  total_value: string;
}

export interface Dispatch {
  id: number;
  dispatch_number: string;
  status: 'pending' | 'approved' | 'in_transit' | 'delivered' | 'cancelled';
  delivery_status: string;
  source_store: StoreInfo;
  destination_store: StoreInfo;
  dispatch_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  is_overdue: boolean;
  carrier_name?: string;
  tracking_number?: string;
  total_items: number;
  total_cost: string;
  total_value: string;
  created_by?: {
    id: number;
    name: string;
  };
  approved_by?: {
    id: number;
    name: string;
  };
  approved_at?: string;
  created_at: string;
  notes?: string;
  metadata?: any;
  items?: DispatchItem[];
}

export interface CreateDispatchPayload {
  source_store_id: number;
  destination_store_id: number;
  expected_delivery_date?: string;
  carrier_name?: string;
  tracking_number?: string;
  notes?: string;
}

export interface AddItemPayload {
  batch_id: number;
  quantity: number;
}

export interface MarkDeliveredPayload {
  items?: Array<{
    item_id: number;
    received_quantity: number;
    damaged_quantity?: number;
    missing_quantity?: number;
  }>;
}

export interface DispatchFilters {
  status?: 'pending' | 'in_transit' | 'delivered' | 'cancelled' | 'overdue' | 'expected_today';
  source_store_id?: number;
  destination_store_id?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface DispatchStatistics {
  total_dispatches: number;
  pending: number;
  in_transit: number;
  delivered: number;
  cancelled: number;
  overdue: number;
  expected_today: number;
  total_value_in_transit: number;
}

class DispatchService {
  private readonly endpoint = '/dispatches';

  /**
   * Get all dispatches with filters
   */
  async getDispatches(filters?: DispatchFilters): Promise<PaginatedResponse<Dispatch>> {
    const response = await axios.get(this.endpoint, { params: filters });
    return response.data;
  }

  /**
   * Get dispatches as array (helper)
   */
  async getDispatchesArray(filters?: DispatchFilters): Promise<Dispatch[]> {
    const response = await this.getDispatches(filters);
    return response.data.data;
  }

  /**
   * Get single dispatch by ID
   */
  async getDispatch(id: number): Promise<ApiResponse<Dispatch>> {
    const response = await axios.get(`${this.endpoint}/${id}`);
    return response.data;
  }

  /**
   * Create new dispatch
   */
  async createDispatch(payload: CreateDispatchPayload): Promise<ApiResponse<Dispatch>> {
    const response = await axios.post(this.endpoint, payload);
    return response.data;
  }

  /**
   * Add item to dispatch
   */
  async addItem(dispatchId: number, payload: AddItemPayload): Promise<ApiResponse<{
    dispatch_item: DispatchItem;
    dispatch_totals: {
      total_items: number;
      total_cost: string;
      total_value: string;
    };
  }>> {
    const response = await axios.post(`${this.endpoint}/${dispatchId}/items`, payload);
    return response.data;
  }

  /**
   * Remove item from dispatch
   */
  async removeItem(dispatchId: number, itemId: number): Promise<ApiResponse<{
    dispatch_totals: {
      total_items: number;
      total_cost: string;
      total_value: string;
    };
  }>> {
    const response = await axios.delete(`${this.endpoint}/${dispatchId}/items/${itemId}`);
    return response.data;
  }

  /**
   * Approve a dispatch
   */
  async approve(id: number): Promise<ApiResponse<Dispatch>> {
    const response = await axios.patch(`${this.endpoint}/${id}/approve`);
    return response.data;
  }

  /**
   * Mark dispatch as in transit
   */
  async markDispatched(id: number): Promise<ApiResponse<Dispatch>> {
    const response = await axios.patch(`${this.endpoint}/${id}/dispatch`);
    return response.data;
  }

  /**
   * Mark dispatch as delivered
   */
  async markDelivered(id: number, payload?: MarkDeliveredPayload): Promise<ApiResponse<Dispatch>> {
    const response = await axios.patch(`${this.endpoint}/${id}/deliver`, payload);
    return response.data;
  }

  /**
   * Cancel a dispatch
   */
  async cancel(id: number): Promise<ApiResponse<Dispatch>> {
    const response = await axios.patch(`${this.endpoint}/${id}/cancel`);
    return response.data;
  }

  /**
   * Get dispatch statistics
   */
  async getStatistics(storeId?: number): Promise<ApiResponse<DispatchStatistics>> {
    const response = await axios.get(`${this.endpoint}/statistics`, {
      params: { store_id: storeId }
    });
    return response.data;
  }

  /**
   * Get incoming dispatches for a store (in transit to this store)
   */
  async getIncomingDispatches(storeId: number): Promise<Dispatch[]> {
    return this.getDispatchesArray({
      destination_store_id: storeId,
      status: 'in_transit'
    });
  }

  /**
   * Get outgoing dispatches from a store
   */
  async getOutgoingDispatches(storeId: number): Promise<Dispatch[]> {
    return this.getDispatchesArray({
      source_store_id: storeId
    });
  }
}

export default new DispatchService();