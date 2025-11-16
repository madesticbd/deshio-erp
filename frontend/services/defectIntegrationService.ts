import axiosInstance from '@/lib/axios';
import defectiveProductService, { DefectiveProduct, MarkDefectiveRequest } from './defectiveProductService';
import productReturnService, { ProductReturn, CreateReturnRequest } from './productReturnService';
import refundService, { Refund, CreateRefundRequest } from './refundService';
import barcodeService, { ScanResult } from './barcodeService';
import storeService, { Store } from './storeService';
import orderService, { Order } from './orderService';

// Extended types for frontend integration
export interface DefectFormData {
  barcode: string;
  defect_type: 'physical_damage' | 'malfunction' | 'cosmetic' | 'missing_parts' | 'packaging_damage' | 'expired' | 'counterfeit' | 'other';
  defect_description: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  store_id: number;
  product_batch_id?: number;
  defect_images?: string[];
  internal_notes?: string;
  is_used_item?: boolean;
}

export interface CustomerReturnFormData {
  order_id: number;
  selected_barcodes: string[];
  return_reason: string;
  return_type: 'defective' | 'damaged' | 'wrong_item' | 'unwanted' | 'other';
  store_id: number;
  customer_notes?: string;
  attachments?: string[];
}

export interface SellDefectiveData {
  defective_product_id: number;
  order_id: number;
  selling_price: number;
  sale_notes?: string;
}

export interface DefectStatsSummary {
  total_defective: number;
  pending: number;
  inspected: number;
  available_for_sale: number;
  sold: number;
  by_severity: {
    minor: number;
    moderate: number;
    major: number;
    critical: number;
  };
  financial_impact: {
    total_original_value: number;
    total_sold_value: number;
    total_loss: number;
  };
}

export interface ReturnRefundWorkflow {
  return: ProductReturn;
  refunds: Refund[];
  total_refunded: number;
  remaining_amount: number;
  can_create_refund: boolean;
}

/**
 * Integrated Defect Management Service
 * Combines defective products, returns, and refunds for frontend workflows
 */
class DefectIntegrationService {
  
  // ==================== DEFECT IDENTIFICATION ====================
  
  /**
   * Scan barcode and get product information
   */
  async scanBarcode(barcode: string): Promise<ScanResult> {
    try {
      const response = await barcodeService.scanBarcode(barcode);
      if (!response.success) {
        throw new Error(response.message || 'Barcode not found');
      }
      return response.data;
    } catch (error: any) {
      console.error('Barcode scan error:', error);
      throw new Error(error.message || 'Failed to scan barcode');
    }
  }

  /**
   * Mark a product as defective (Employee identifies defect)
   */
  async markAsDefective(formData: DefectFormData): Promise<DefectiveProduct> {
    try {
      // First, scan barcode to get product_barcode_id
      const scanResult = await this.scanBarcode(formData.barcode);
      
      if (!scanResult.is_available) {
        throw new Error('Product is not available for marking as defective');
      }

      // Get barcode ID from scan result (you may need to adjust based on actual response)
      const barcodeId = scanResult.barcode_type === 'product_barcode' 
        ? parseInt(formData.barcode) // Adjust based on your actual barcode ID mapping
        : 0;

      if (!barcodeId) {
        throw new Error('Could not determine product barcode ID');
      }

      // Prepare defective product request
      const defectiveRequest: MarkDefectiveRequest = {
        product_barcode_id: barcodeId,
        store_id: formData.store_id,
        defect_type: formData.is_used_item ? 'other' : formData.defect_type,
        defect_description: formData.is_used_item 
          ? 'USED_ITEM - Product has been used/opened by customer' 
          : formData.defect_description,
        severity: formData.severity,
        original_price: parseFloat(scanResult.current_batch?.sell_price || '0'),
        product_batch_id: formData.product_batch_id || scanResult.current_batch?.id,
        defect_images: formData.defect_images,
        internal_notes: formData.internal_notes,
      };

      const result = await defectiveProductService.markAsDefective(defectiveRequest);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to mark as defective');
      }

      return result.data;
    } catch (error: any) {
      console.error('Mark as defective error:', error);
      throw new Error(error.message || 'Failed to mark product as defective');
    }
  }

  /**
   * Get all defective products with filtering
   */
  async getDefectiveProducts(filters?: {
    status?: string;
    store_id?: number;
    severity?: string;
    defect_type?: string;
    search?: string;
  }) {
    try {
      const result = await defectiveProductService.getAll(filters);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch defective products');
      }

      return result.data;
    } catch (error: any) {
      console.error('Get defective products error:', error);
      throw new Error(error.message || 'Failed to fetch defective products');
    }
  }

  /**
   * Get defective product statistics
   */
  async getDefectiveStats(filters?: {
    from_date?: string;
    to_date?: string;
    store_id?: number;
  }): Promise<DefectStatsSummary> {
    try {
      const result = await defectiveProductService.getStatistics(filters);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch statistics');
      }

      return result.data;
    } catch (error: any) {
      console.error('Get defective stats error:', error);
      throw new Error(error.message || 'Failed to fetch defective statistics');
    }
  }

  /**
   * Sell a defective product
   */
  async sellDefectiveProduct(data: SellDefectiveData) {
    try {
      const result = await defectiveProductService.sell(data.defective_product_id, {
        order_id: data.order_id,
        selling_price: data.selling_price,
        sale_notes: data.sale_notes,
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to sell defective product');
      }

      return result.data;
    } catch (error: any) {
      console.error('Sell defective product error:', error);
      throw new Error(error.message || 'Failed to sell defective product');
    }
  }

  // ==================== CUSTOMER RETURNS ====================

  /**
   * Search customer orders by phone or order ID
   */
  async searchCustomerOrders(searchType: 'phone' | 'orderId', searchValue: string) {
    try {
      if (searchType === 'phone') {
        // Search by customer phone
        const result = await orderService.getAll({
          search: searchValue, // Assuming backend supports phone search
          per_page: 50,
        });
        return result.data;
      } else {
        // Get single order by ID
        const order = await orderService.getById(parseInt(searchValue));
        return [order];
      }
    } catch (error: any) {
      console.error('Search orders error:', error);
      throw new Error(error.message || 'Failed to search orders');
    }
  }

  /**
   * Create customer return (multiple items with barcodes)
   */
  async createCustomerReturn(formData: CustomerReturnFormData): Promise<ProductReturn> {
    try {
      // Get order details to map barcodes to order items
      const order = await orderService.getById(formData.order_id);

      if (!order.items || order.items.length === 0) {
        throw new Error('Order has no items');
      }

      // Map selected barcodes to order items
      // Note: This assumes your order items have barcode information
      // You may need to adjust based on your actual data structure
      const returnItems = formData.selected_barcodes.map(barcode => {
        // Find matching order item (you'll need to adjust this logic)
        const orderItem = order.items?.find(item => {
          // This is a placeholder - adjust based on how barcodes are stored in order items
          return item.id; // You need to map barcode to order_item_id
        });

        if (!orderItem) {
          throw new Error(`No order item found for barcode: ${barcode}`);
        }

        return {
          order_item_id: orderItem.id,
          quantity: 1, // Assuming 1 per barcode, adjust if needed
          reason: formData.return_reason,
        };
      });

      // Create return request
      const returnRequest: CreateReturnRequest = {
        order_id: formData.order_id,
        return_reason: formData.return_reason,
        return_type: formData.return_type,
        items: returnItems,
        customer_notes: formData.customer_notes,
        attachments: formData.attachments,
      };

      const result = await productReturnService.create(returnRequest);

      if (!result.success) {
        throw new Error(result.message || 'Failed to create return');
      }

      return result.data;
    } catch (error: any) {
      console.error('Create customer return error:', error);
      throw new Error(error.message || 'Failed to create customer return');
    }
  }

  /**
   * Get all returns with filtering
   */
  async getReturns(filters?: {
    status?: string;
    store_id?: number;
    customer_id?: number;
    search?: string;
  }) {
    try {
      const result = await productReturnService.getAll(filters);

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch returns');
      }

      return result.data;
    } catch (error: any) {
      console.error('Get returns error:', error);
      throw new Error(error.message || 'Failed to fetch returns');
    }
  }

  /**
   * Get complete return and refund workflow info
   */
  async getReturnWorkflow(returnId: number): Promise<ReturnRefundWorkflow> {
    try {
      const returnResult = await productReturnService.getById(returnId);
      
      if (!returnResult.success) {
        throw new Error('Return not found');
      }

      const returnData = returnResult.data;

      // Get all refunds for this return
      const refundsResult = await refundService.getAll({
        // Assuming you can filter by return_id
        search: returnData.return_number,
      });

      const refunds = refundsResult.success ? refundsResult.data.data || [] : [];

      // Calculate totals
      const totalRefunded = refunds
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + parseFloat(r.refund_amount.toString()), 0);

      const remainingAmount = parseFloat(returnData.total_refund_amount.toString()) - totalRefunded;

      return {
        return: returnData,
        refunds,
        total_refunded: totalRefunded,
        remaining_amount: remainingAmount,
        can_create_refund: returnData.status === 'completed' && remainingAmount > 0,
      };
    } catch (error: any) {
      console.error('Get return workflow error:', error);
      throw new Error(error.message || 'Failed to fetch return workflow');
    }
  }

  /**
   * Complete return workflow: Quality Check → Approve → Process → Complete
   */
  async processReturnWorkflow(returnId: number, options: {
    quality_check_passed: boolean;
    quality_check_notes?: string;
    total_refund_amount?: number;
    processing_fee?: number;
    internal_notes?: string;
    restore_inventory?: boolean;
  }) {
    try {
      // Step 1: Quality Check
      await productReturnService.update(returnId, {
        quality_check_passed: options.quality_check_passed,
        quality_check_notes: options.quality_check_notes,
        internal_notes: options.internal_notes,
      });

      if (!options.quality_check_passed) {
        throw new Error('Quality check failed. Cannot proceed with return.');
      }

      // Step 2: Approve
      await productReturnService.approve(returnId, {
        total_refund_amount: options.total_refund_amount,
        processing_fee: options.processing_fee,
        internal_notes: options.internal_notes,
      });

      // Step 3: Process (restore inventory)
      await productReturnService.process(returnId, {
        restore_inventory: options.restore_inventory ?? true,
      });

      // Step 4: Complete
      const result = await productReturnService.complete(returnId);

      if (!result.success) {
        throw new Error(result.message || 'Failed to complete return');
      }

      return result.data;
    } catch (error: any) {
      console.error('Process return workflow error:', error);
      throw new Error(error.message || 'Failed to process return workflow');
    }
  }

  // ==================== REFUNDS ====================

  /**
   * Create refund from completed return
   */
  async createRefund(data: CreateRefundRequest) {
    try {
      const result = await refundService.create(data);

      if (!result.success) {
        throw new Error(result.message || 'Failed to create refund');
      }

      return result.data;
    } catch (error: any) {
      console.error('Create refund error:', error);
      throw new Error(error.message || 'Failed to create refund');
    }
  }

  /**
   * Process and complete refund (money transfer)
   */
  async processAndCompleteRefund(refundId: number, transactionDetails?: {
    transaction_reference?: string;
    bank_reference?: string;
    gateway_reference?: string;
  }) {
    try {
      // Step 1: Process refund
      await refundService.process(refundId);

      // Step 2: Complete refund
      const result = await refundService.complete(refundId, transactionDetails);

      if (!result.success) {
        throw new Error(result.message || 'Failed to complete refund');
      }

      return result.data;
    } catch (error: any) {
      console.error('Process and complete refund error:', error);
      throw new Error(error.message || 'Failed to process refund');
    }
  }

  /**
   * Get all refunds with filtering
   */
  async getRefunds(filters?: {
    status?: string;
    refund_method?: string;
    customer_id?: number;
    search?: string;
  }) {
    try {
      const result = await refundService.getAll(filters);

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch refunds');
      }

      return result.data;
    } catch (error: any) {
      console.error('Get refunds error:', error);
      throw new Error(error.message || 'Failed to fetch refunds');
    }
  }

  // ==================== EXCHANGE WORKFLOW ====================

  /**
   * Process product exchange (Return old + Create new order)
   */
  async processExchange(exchangeData: {
    return_data: CustomerReturnFormData;
    new_order_items: Array<{
      product_id: number;
      batch_id: number;
      quantity: number;
      unit_price: number;
    }>;
    store_id: number;
    customer_id: number;
    payment_method_id: number;
  }) {
    try {
      // Step 1: Create return for old product
      const returnResult = await this.createCustomerReturn(exchangeData.return_data);

      // Step 2: Process return workflow (quality check, approve, process, complete)
      await this.processReturnWorkflow(returnResult.id, {
        quality_check_passed: true,
        quality_check_notes: 'Exchange - Quality approved',
        restore_inventory: true,
      });

      // Step 3: Create full refund
      const refund = await this.createRefund({
        return_id: returnResult.id,
        refund_type: 'full',
        refund_method: 'cash', // Temporary, will be offset by new order
        internal_notes: 'Exchange refund',
      });

      // Step 4: Process refund
      await this.processAndCompleteRefund(refund.id, {
        transaction_reference: `EXCHANGE-${returnResult.return_number}`,
      });

      // Step 5: Create new order for exchange item
      const newOrder = await orderService.create({
        order_type: 'counter',
        store_id: exchangeData.store_id,
        customer_id: exchangeData.customer_id,
        items: exchangeData.new_order_items,
        payment: {
          payment_method_id: exchangeData.payment_method_id,
          amount: exchangeData.new_order_items.reduce(
            (sum, item) => sum + item.quantity * item.unit_price,
            0
          ),
          payment_type: 'full',
        },
        notes: `Exchange - Original return: ${returnResult.return_number}`,
      });

      // Step 6: Complete new order
      await orderService.complete(newOrder.id);

      return {
        return: returnResult,
        refund,
        new_order: newOrder,
        net_amount: parseFloat(refund.refund_amount.toString()) - parseFloat(newOrder.total_amount),
      };
    } catch (error: any) {
      console.error('Process exchange error:', error);
      throw new Error(error.message || 'Failed to process exchange');
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get all stores
   */
  async getStores() {
    try {
      const response = await storeService.getStores({ is_active: true });
      return response.success ? response.data : [];
    } catch (error: any) {
      console.error('Get stores error:', error);
      throw new Error(error.message || 'Failed to fetch stores');
    }
  }

  /**
   * Upload defect/return image
   */
  async uploadImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axiosInstance.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!response.data.success) {
        throw new Error('Failed to upload image');
      }

      return response.data.data.url;
    } catch (error: any) {
      console.error('Upload image error:', error);
      throw new Error(error.message || 'Failed to upload image');
    }
  }

  /**
   * Get defective products available for sale
   */
  async getAvailableForSale(filters?: {
    store_id?: number;
    severity?: string;
    max_price?: number;
  }) {
    try {
      const result = await defectiveProductService.getAvailableForSale(filters);

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch available products');
      }

      return result.data;
    } catch (error: any) {
      console.error('Get available for sale error:', error);
      throw new Error(error.message || 'Failed to fetch available products');
    }
  }
}

// Export singleton instance
export const defectIntegrationService = new DefectIntegrationService();

export default defectIntegrationService;