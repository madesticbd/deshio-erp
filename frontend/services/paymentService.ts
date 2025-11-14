import axiosInstance from '@/lib/axios';

export interface PaymentPayload {
  payment_method_id: number;
  amount: number;
  payment_type?: 'full' | 'partial' | 'installment' | 'advance';
  transaction_reference?: string;
  external_reference?: string;
  notes?: string;
  payment_data?: any;
  auto_complete?: boolean;
  cash_received?: Array<{
    denomination: number;
    quantity: number;
    type?: 'note' | 'coin';
  }>;
  cash_change?: Array<{
    denomination: number;
    quantity: number;
    type?: 'note' | 'coin';
  }>;
}

export interface SplitPaymentPayload {
  total_amount: number;
  payment_type?: string;
  notes?: string;
  auto_complete?: boolean;
  splits: Array<{
    payment_method_id: number;
    amount: number;
    transaction_reference?: string;
    external_reference?: string;
    payment_data?: any;
    cash_received?: Array<{
      denomination: number;
      quantity: number;
      type?: 'note' | 'coin';
    }>;
    cash_change?: Array<{
      denomination: number;
      quantity: number;
      type?: 'note' | 'coin';
    }>;
  }>;
}

export interface PaymentMethod {
  id: number;
  name: string;
  type: 'cash' | 'card' | 'digital_wallet' | 'bank_transfer' | 'other';
  is_active: boolean;
  allowed_customer_types: string[];
  requires_reference: boolean;
  fee_type?: string;
  fee_amount?: number;
  fee_percentage?: number;
}

const paymentService = {
  /** Process simple payment */
  async process(orderId: number, payload: PaymentPayload): Promise<any> {
    try {
      console.log('💳 Processing payment for order:', orderId);
      console.log('💳 Payment payload:', JSON.stringify(payload, null, 2));
      
      // ✅ Validate required fields
      if (!payload.payment_method_id) {
        throw new Error('payment_method_id is required');
      }
      
      if (!payload.amount || payload.amount <= 0) {
        throw new Error('Valid payment amount is required');
      }
      
      const response = await axiosInstance.post(`/orders/${orderId}/payments/simple`, payload);
      
      console.log('✅ Payment API Response:', response.data);
      
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to process payment');
      }
      
      return result.data;
    } catch (error: any) {
      console.error('❌ Process payment error:', error);
      console.error('❌ Response data:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      
      // Extract error message
      let errorMessage = 'Failed to process payment';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  /** Process split payment */
  async processSplit(orderId: number, payload: SplitPaymentPayload): Promise<any> {
    try {
      console.log('💳💳 Processing split payment for order:', orderId);
      console.log('💳💳 Split payment payload:', JSON.stringify(payload, null, 2));
      
      // ✅ Validate required fields
      if (!payload.splits || payload.splits.length === 0) {
        throw new Error('At least one payment split is required');
      }
      
      // ✅ Validate each split has payment_method_id
      const invalidSplits = payload.splits.filter(split => !split.payment_method_id);
      if (invalidSplits.length > 0) {
        console.error('❌ Invalid splits (missing payment_method_id):', invalidSplits);
        throw new Error(`${invalidSplits.length} payment split(s) are missing payment_method_id`);
      }
      
      // ✅ Validate each split has valid amount
      const invalidAmounts = payload.splits.filter(split => !split.amount || split.amount <= 0);
      if (invalidAmounts.length > 0) {
        console.error('❌ Invalid splits (invalid amount):', invalidAmounts);
        throw new Error(`${invalidAmounts.length} payment split(s) have invalid amounts`);
      }
      
      // ✅ Validate total amount
      const calculatedTotal = payload.splits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(calculatedTotal - payload.total_amount) > 0.01) {
        console.error('❌ Total mismatch:', { 
          expected: payload.total_amount, 
          calculated: calculatedTotal 
        });
        throw new Error(`Split amounts (${calculatedTotal}) don't match total amount (${payload.total_amount})`);
      }
      
      const response = await axiosInstance.post(`/orders/${orderId}/payments/split`, payload);
      
      console.log('✅ Split payment API Response:', response.data);
      
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to process split payment');
      }
      
      return result.data;
    } catch (error: any) {
      console.error('❌ Process split payment error:', error);
      console.error('❌ Response data:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      
      // Extract error message
      let errorMessage = 'Failed to process split payment';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Check for specific errors
      if (errorMessage.includes('payment_method_id') && errorMessage.includes('cannot be null')) {
        errorMessage = 'Payment method ID is missing. Please ensure all payment methods are properly selected.';
      }
      
      throw new Error(errorMessage);
    }
  },

 /** Get available payment methods */
async getMethods(customerType?: string): Promise<PaymentMethod[]> {
  try {
    console.log('🔍 Fetching payment methods for customer type:', customerType);
    
    const response = await axiosInstance.get('/payments/methods', {
      params: { customer_type: customerType || 'counter' }, // ✅ ADD customer_type param
    });
    
    const result = response.data;
    
    console.log('✅ Payment methods response:', result);
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch payment methods');
    }
    
    return result.data;
  } catch (error: any) {
    console.error('❌ Get payment methods error:', error);
    
    let errorMessage = 'Failed to fetch payment methods';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    throw new Error(errorMessage);
  }
},
  /** Get order payments */
  async getOrderPayments(orderId: number): Promise<any> {
    try {
      console.log('🔍 Fetching payments for order:', orderId);
      
      const response = await axiosInstance.get(`/orders/${orderId}/payments/advanced`);
      
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch payments');
      }
      
      console.log('✅ Order payments:', result.data);
      
      return result.data;
    } catch (error: any) {
      console.error('❌ Get order payments error:', error);
      
      let errorMessage = 'Failed to fetch payments';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  /** Get payment statistics */
  async getStats(params?: any): Promise<any> {
    try {
      console.log('📊 Fetching payment statistics with params:', params);
      
      const response = await axiosInstance.get('/payments/stats', { params });
      
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch payment statistics');
      }
      
      console.log('✅ Payment statistics:', result.data);
      
      return result.data;
    } catch (error: any) {
      console.error('❌ Get payment stats error:', error);
      
      let errorMessage = 'Failed to fetch payment statistics';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  /** Get overdue payments */
  async getOverdue(params?: { store_id?: number }): Promise<any> {
    try {
      console.log('⏰ Fetching overdue payments with params:', params);
      
      const response = await axiosInstance.get('/payments/overdue', { params });
      
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch overdue payments');
      }
      
      console.log('✅ Overdue payments:', result.data);
      
      return result.data;
    } catch (error: any) {
      console.error('❌ Get overdue payments error:', error);
      
      let errorMessage = 'Failed to fetch overdue payments';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      throw new Error(errorMessage);
    }
  },
};

export default paymentService;
