import axiosInstance from '@/lib/axios';

// Types
export interface ProductReturn {
  id: number;
  return_number: string;
  order_id: number;
  customer_id: number;
  store_id: number;
  return_reason: string;
  return_type: ReturnType;
  status: ReturnStatus;
  return_date: string;
  total_return_value: number;
  total_refund_amount: number;
  processing_fee: number;
  customer_notes?: string;
  internal_notes?: string;
  quality_check_passed?: boolean;
  quality_check_notes?: string;
  rejection_reason?: string;
  return_items: ReturnItem[];
  attachments?: string[];
  received_date?: string;
  approved_date?: string;
  rejected_date?: string;
  processed_date?: string;
  completed_date?: string;
  refunded_date?: string;
  processed_by?: number;
  approved_by?: number;
  rejected_by?: number;
  created_at: string;
  updated_at: string;
  order?: any;
  customer?: any;
  store?: any;
  processedBy?: any;
  approvedBy?: any;
  rejectedBy?: any;
  refunds?: any[];
}

export type ReturnType = 
  | 'defective'
  | 'damaged'
  | 'wrong_item'
  | 'unwanted'
  | 'other';

export type ReturnStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'processed'
  | 'completed'
  | 'refunded';

export interface ReturnItem {
  order_item_id: number;
  product_id: number;
  product_batch_id?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  reason?: string;
}

export interface ProductReturnFilters {
  status?: ReturnStatus;
  store_id?: number;
  customer_id?: number;
  from_date?: string;
  to_date?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface CreateReturnRequest {
  order_id: number;
  return_reason: string;
  return_type: ReturnType;
  items: Array<{
    order_item_id: number;
    quantity: number;
    reason?: string;
  }>;
  customer_notes?: string;
  attachments?: string[];
}

export interface UpdateReturnRequest {
  quality_check_passed?: boolean;
  quality_check_notes?: string;
  internal_notes?: string;
  processing_fee?: number;
  total_refund_amount?: number;
}

export interface ApproveReturnRequest {
  total_refund_amount?: number;
  processing_fee?: number;
  internal_notes?: string;
}

export interface RejectReturnRequest {
  rejection_reason: string;
}

export interface ProcessReturnRequest {
  restore_inventory?: boolean;
}

export interface ReturnStatistics {
  total_returns: number;
  pending: number;
  approved: number;
  rejected: number;
  processed: number;
  completed: number;
  refunded: number;
  total_return_value: number;
  total_refund_amount: number;
  total_processing_fees: number;
  by_reason: Array<{
    return_reason: string;
    count: number;
  }>;
}

export interface StatisticsFilters {
  from_date?: string;
  to_date?: string;
  store_id?: number;
}

// Service Class
class ProductReturnService {
  private basePath = '/returns';

  /**
   * Get all product returns with filters and pagination
   */
  async getAll(filters?: ProductReturnFilters) {
    const response = await axiosInstance.get(this.basePath, { params: filters });
    return response.data;
  }

  /**
   * Get a specific product return by ID
   */
  async getById(id: number) {
    const response = await axiosInstance.get(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Create a new product return
   */
  async create(data: CreateReturnRequest) {
    const response = await axiosInstance.post(this.basePath, data);
    return response.data;
  }

  /**
   * Update return (for receiving and quality check)
   */
  async update(id: number, data: UpdateReturnRequest) {
    const response = await axiosInstance.patch(`${this.basePath}/${id}`, data);
    return response.data;
  }

  /**
   * Approve a return
   */
  async approve(id: number, data?: ApproveReturnRequest) {
    const response = await axiosInstance.post(`${this.basePath}/${id}/approve`, data || {});
    return response.data;
  }

  /**
   * Reject a return
   */
  async reject(id: number, data: RejectReturnRequest) {
    const response = await axiosInstance.post(`${this.basePath}/${id}/reject`, data);
    return response.data;
  }

  /**
   * Process a return (restore inventory)
   */
  async process(id: number, data?: ProcessReturnRequest) {
    const response = await axiosInstance.post(`${this.basePath}/${id}/process`, data || {});
    return response.data;
  }

  /**
   * Complete a return (final step before refund)
   */
  async complete(id: number) {
    const response = await axiosInstance.post(`${this.basePath}/${id}/complete`);
    return response.data;
  }

  /**
   * Get return statistics
   */
  async getStatistics(filters?: StatisticsFilters) {
    const response = await axiosInstance.get(`${this.basePath}/statistics`, {
      params: filters,
    });
    return response.data;
  }

  /**
   * Helper: Calculate total refund after processing fee
   */
  calculateNetRefund(totalRefundAmount: number, processingFee: number): number {
    return Math.max(0, totalRefundAmount - processingFee);
  }

  /**
   * Helper: Calculate refund percentage
   */
  calculateRefundPercentage(refundAmount: number, originalValue: number): number {
    if (originalValue === 0) return 0;
    return Math.round((refundAmount / originalValue) * 100);
  }

  /**
   * Helper: Format return number for display
   */
  formatReturnNumber(returnNumber: string): string {
    return returnNumber;
  }

  /**
   * Helper: Get return type label
   */
  getReturnTypeLabel(returnType: ReturnType): string {
    const labels: Record<ReturnType, string> = {
      defective: 'Defective',
      damaged: 'Damaged',
      wrong_item: 'Wrong Item',
      unwanted: 'Unwanted',
      other: 'Other',
    };
    return labels[returnType] || returnType;
  }

  /**
   * Helper: Get status label
   */
  getStatusLabel(status: ReturnStatus): string {
    const labels: Record<ReturnStatus, string> = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      processed: 'Processed',
      completed: 'Completed',
      refunded: 'Refunded',
    };
    return labels[status] || status;
  }

  /**
   * Helper: Get status color for UI
   */
  getStatusColor(status: ReturnStatus): string {
    const colors: Record<ReturnStatus, string> = {
      pending: 'orange',
      approved: 'blue',
      rejected: 'red',
      processed: 'purple',
      completed: 'green',
      refunded: 'green',
    };
    return colors[status] || 'gray';
  }

  /**
   * Helper: Check if return can be edited
   */
  canEdit(status: ReturnStatus): boolean {
    return status === 'pending' || status === 'approved';
  }

  /**
   * Helper: Check if return can be approved
   */
  canApprove(status: ReturnStatus, qualityCheckPassed?: boolean): boolean {
    return status === 'pending' && qualityCheckPassed === true;
  }

  /**
   * Helper: Check if return can be rejected
   */
  canReject(status: ReturnStatus): boolean {
    return status === 'pending' || status === 'approved';
  }

  /**
   * Helper: Check if return can be processed
   */
  canProcess(status: ReturnStatus): boolean {
    return status === 'approved';
  }

  /**
   * Helper: Check if return can be completed
   */
  canComplete(status: ReturnStatus): boolean {
    return status === 'processed';
  }
}

// Export singleton instance
export const productReturnService = new ProductReturnService();

// Export default
export default productReturnService;