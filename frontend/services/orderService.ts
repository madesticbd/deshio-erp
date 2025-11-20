import axiosInstance from '@/lib/axios';

export interface CreateOrderPayload {
  order_type: 'counter' | 'social_commerce' | 'ecommerce';
  customer_id?: number;
  customer?: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  store_id: number;
  salesman_id?: number;
  items: Array<{
    barcode?: string; // Single barcode for create
    product_id: number;
    batch_id: number;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
    tax_amount?: number;
  }>;
  discount_amount?: number;
  shipping_amount?: number;
  notes?: string;
  shipping_address?: any;
  payment?: {
    payment_method_id: number;
    amount: number;
    payment_type?: 'full' | 'partial' | 'installment' | 'advance';
    cash_received?: Array<{
      denomination: number;
      quantity: number;
      type: 'note' | 'coin';
    }>;
    cash_change?: Array<{
      denomination: number;
      quantity: number;
      type: 'note' | 'coin';
    }>;
  };
  installment_plan?: {
    total_installments: number;
    installment_amount: number;
    start_date?: string;
  };
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  batch_id: number;
  batch_number?: string;
  barcode_id?: number;
  barcode?: string;
  quantity: number;
  unit_price: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
  shipping_amount: string;
}

export interface OrderPayment {
  id: number;
  amount: string;
  payment_method: string;
  payment_type: string;
  status: string;
  processed_by?: string;
  created_at: string;
  splits?: Array<{
    payment_method: string;
    amount: string;
    status: string;
  }>;
}

export interface Order {
  id: number;
  order_number: string;
  order_type: string;
  order_type_label: string;
  status: string;
  payment_status: string;
  customer: {
    id: number;
    name: string;
    phone: string;
    email?: string;
    customer_code: string;
  };
  store: {
    id: number;
    name: string;
  };
  salesman?: {
    id: number;
    name: string;
  };
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  shipping_amount: string;
  total_amount: string;
  paid_amount: string;
  outstanding_amount: string;
  is_installment: boolean;
  order_date: string;
  created_at: string;
  items?: OrderItem[];
  payments?: OrderPayment[];
  installment_info?: {
    total_installments: number;
    paid_installments: number;
    installment_amount: string;
    next_payment_due?: string;
    is_overdue: boolean;
    days_overdue: number;
  };
  notes?: string;
  shipping_address?: any;
  confirmed_at?: string;
}

export interface OrderFilters {
  order_type?: string;
  status?: string;
  payment_status?: string;
  store_id?: number;
  customer_id?: number;
  created_by?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  overdue?: boolean;
  installment_only?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface OrderStatistics {
  total_orders: number;
  by_type: {
    counter: number;
    social_commerce: number;
    ecommerce: number;
  };
  by_status: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  by_payment_status: {
    pending: number;
    partially_paid: number;
    paid: number;
    overdue: number;
  };
  total_revenue: string;
  total_outstanding: string;
  installment_orders: number;
  top_salesmen?: Array<{
    employee_id: number;
    employee_name: string;
    order_count: number;
    total_sales: string;
  }>;
}

const orderService = {
  /** Create new order */
  async create(payload: CreateOrderPayload): Promise<Order> {
    try {
      const response = await axiosInstance.post('/orders', payload);
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create order');
      }
      
      return result.data;
    } catch (error: any) {
      console.error('Create order error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create order');
    }
  },

  /** Get all orders with filters and pagination */
  async getAll(params?: OrderFilters): Promise<{
    data: Order[];
    total: number;
    current_page: number;
    last_page: number;
  }> {
    try {
      const response = await axiosInstance.get('/orders', { params });
      const result = response.data;

      if (result.success) {
        return {
          data: result.data.data || [],
          total: result.data.total || 0,
          current_page: result.data.current_page || 1,
          last_page: result.data.last_page || 1,
        };
      }

      return { data: [], total: 0, current_page: 1, last_page: 1 };
    } catch (error: any) {
      console.error('Get orders error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch orders');
    }
  },

  /** Get single order by ID */
  async getById(id: number): Promise<Order> {
    try {
      const response = await axiosInstance.get(`/orders/${id}`);
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch order');
      }
      
      return result.data;
    } catch (error: any) {
      console.error('Get order error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch order');
    }
  },

  /** Add item to order using barcode (supports single or multiple barcodes) */
  async addItem(
    orderId: number,
    payload: {
      barcode?: string;
      barcodes?: string[];
      unit_price?: number;
      discount_amount?: number;
      tax_amount?: number;
    }
  ): Promise<{
    item: {
      id: number;
      product_name: string;
      quantity: number;
      unit_price: string;
      total: string;
    };
    order_totals: {
      subtotal: string;
      total_amount: string;
      outstanding_amount: string;
    };
  }> {
    try {
      const response = await axiosInstance.post(`/orders/${orderId}/items`, payload);
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to add item');
      }
      
      return result.data;
    } catch (error: any) {
      console.error('Add item to order error:', error);
      throw new Error(error.response?.data?.message || 'Failed to add item');
    }
  },

  /** Update order item */
  async updateItem(
    orderId: number,
    itemId: number,
    payload: {
      quantity?: number;
      unit_price?: number;
      discount_amount?: number;
    }
  ): Promise<{
    item: {
      id: number;
      quantity: number;
      unit_price: string;
      total: string;
    };
    order_totals: {
      total_amount: string;
    };
  }> {
    try {
      const response = await axiosInstance.put(`/orders/${orderId}/items/${itemId}`, payload);
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update item');
      }
      
      return result.data;
    } catch (error: any) {
      console.error('Update order item error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update item');
    }
  },

  /** Remove item from order */
  async removeItem(orderId: number, itemId: number): Promise<{
    order_totals: {
      total_amount: string;
      outstanding_amount: string;
    };
  }> {
    try {
      const response = await axiosInstance.delete(`/orders/${orderId}/items/${itemId}`);
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to remove item');
      }
      
      return result.data;
    } catch (error: any) {
      console.error('Remove order item error:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove item');
    }
  },

  /** Complete order and reduce inventory */
  async complete(orderId: number): Promise<Order> {
    try {
      const response = await axiosInstance.patch(`/orders/${orderId}/complete`);
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to complete order');
      }
      
      return result.data;
    } catch (error: any) {
      console.error('Complete order error:', error);
      throw new Error(error.response?.data?.message || 'Failed to complete order');
    }
  },

  /** Cancel order */
  async cancel(orderId: number, reason?: string): Promise<Order> {
    try {
      const response = await axiosInstance.patch(`/orders/${orderId}/cancel`, { reason });
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to cancel order');
      }
      
      return result.data;
    } catch (error: any) {
      console.error('Cancel order error:', error);
      throw new Error(error.response?.data?.message || 'Failed to cancel order');
    }
  },

  /** Get order statistics */
  async getStatistics(params?: {
    date_from?: string;
    date_to?: string;
    store_id?: number;
    created_by?: number;
  }): Promise<OrderStatistics> {
    try {
      const response = await axiosInstance.get('/orders/statistics', { params });
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch statistics');
      }
      
      return result.data;
    } catch (error: any) {
      console.error('Get statistics error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch statistics');
    }
  },
};

export default orderService;