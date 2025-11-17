import axiosInstance from '@/lib/axios';
import barcodeService from './barcodeService';
import { Order } from './orderService';

/**
 * Helper service to map barcodes to order items
 * Handles the complexity of tracking which barcodes belong to which order items
 */
class BarcodeOrderMapper {
  
  /**
   * Get order with enhanced barcode information
   * This fetches the order and enriches it with barcode data for returns
   */
  async getOrderWithBarcodes(orderId: number): Promise<Order & {
    items?: Array<Order['items'] extends Array<infer T> ? T & {
      barcodes: string[];
      available_for_return: number;
    } : never>;
  }> {
    try {
      // Fetch order
      const orderResponse = await axiosInstance.get(`/orders/${orderId}`);
      
      if (!orderResponse.data.success) {
        throw new Error('Order not found');
      }

      const order: Order = orderResponse.data.data;

      // Enhance items with barcode information
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          // Try to get barcodes for this order item
          try {
            const barcodeResponse = await axiosInstance.get(`/orders/${orderId}/items/${item.id}/barcodes`);
            
            if (barcodeResponse.data.success) {
              (item as any).barcodes = barcodeResponse.data.data.barcodes || [];
              (item as any).available_for_return = barcodeResponse.data.data.available_for_return || item.quantity;
            } else {
              (item as any).barcodes = [];
              (item as any).available_for_return = item.quantity;
            }
          } catch (error) {
            // If endpoint doesn't exist, generate placeholder barcodes
            (item as any).barcodes = this.generatePlaceholderBarcodes(item, order);
            (item as any).available_for_return = item.quantity;
          }
        }
      }

      return order as any;
    } catch (error: any) {
      console.error('Get order with barcodes error:', error);
      throw new Error(error.message || 'Failed to fetch order with barcodes');
    }
  }

  /**
   * Generate placeholder barcodes if backend doesn't provide them
   * This is a fallback for orders that don't have barcode tracking
   */
  private generatePlaceholderBarcodes(
    item: NonNullable<Order['items']>[number],
    order: Order
  ): string[] {
    const barcodes: string[] = [];
    
    // Generate placeholder barcodes based on quantity
    for (let i = 0; i < item.quantity; i++) {
      barcodes.push(`${order.order_number}-${item.product_id}-${i + 1}`);
    }
    
    return barcodes;
  }

  /**
   * Validate selected barcodes against order
   * Ensures barcodes belong to the order and haven't been returned
   */
  async validateBarcodesForReturn(
    orderId: number,
    selectedBarcodes: string[]
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    mapped_items: Array<{
      order_item_id: number;
      product_name: string;
      barcodes: string[];
      quantity: number;
    }>;
  }> {
    try {
      const order = await this.getOrderWithBarcodes(orderId);
      const errors: string[] = [];
      const warnings: string[] = [];
      const mappedItems: Map<number, {
        order_item_id: number;
        product_name: string;
        barcodes: string[];
        quantity: number;
      }> = new Map();

      for (const barcode of selectedBarcodes) {
        let found = false;

        for (const item of (order.items || []) as any[]) {
          if (item.barcodes && item.barcodes.includes(barcode)) {
            found = true;

            // Check if already returned
            const alreadyReturned = await this.isBarcodeReturned(orderId, barcode);
            
            if (alreadyReturned) {
              errors.push(`Barcode ${barcode} has already been returned`);
              continue;
            }

            // Add to mapped items
            const existing = mappedItems.get(item.id);
            if (existing) {
              existing.barcodes.push(barcode);
              existing.quantity++;
            } else {
              mappedItems.set(item.id, {
                order_item_id: item.id,
                product_name: item.product_name,
                barcodes: [barcode],
                quantity: 1,
              });
            }

            break;
          }
        }

        if (!found) {
          errors.push(`Barcode ${barcode} not found in order ${order.order_number}`);
        }
      }

      // Check for over-returns
      for (const [itemId, mapped] of mappedItems) {
        const orderItem = (order.items || []).find((i: any) => i.id === itemId) as any;
        if (orderItem && mapped.quantity > orderItem.available_for_return) {
          warnings.push(
            `${mapped.product_name}: Trying to return ${mapped.quantity} but only ${orderItem.available_for_return} available`
          );
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        mapped_items: Array.from(mappedItems.values()),
      };
    } catch (error: any) {
      console.error('Validate barcodes error:', error);
      throw new Error(error.message || 'Failed to validate barcodes');
    }
  }

  /**
   * Check if a barcode has already been returned
   */
  private async isBarcodeReturned(orderId: number, barcode: string): Promise<boolean> {
    try {
      // Check with backend if barcode has been returned
      const response = await axiosInstance.get(`/orders/${orderId}/returns/check-barcode`, {
        params: { barcode },
      });

      return response.data.data?.is_returned || false;
    } catch (error) {
      // If endpoint doesn't exist, assume not returned
      return false;
    }
  }

  /**
   * Convert validated barcodes to return items format
   */
  convertToReturnItems(mappedItems: Array<{
    order_item_id: number;
    product_name: string;
    barcodes: string[];
    quantity: number;
  }>, returnReason: string): Array<{
    order_item_id: number;
    quantity: number;
    reason: string;
  }> {
    return mappedItems.map((item) => ({
      order_item_id: item.order_item_id,
      quantity: item.quantity,
      reason: returnReason,
    }));
  }

  /**
   * Get return-eligible items from an order
   */
  async getReturnEligibleItems(orderId: number): Promise<Array<{
    order_item_id: number;
    product_name: string;
    quantity_ordered: number;
    quantity_returned: number;
    quantity_available: number;
    barcodes: Array<{
      barcode: string;
      is_returned: boolean;
    }>;
  }>> {
    try {
      const response = await axiosInstance.get(`/orders/${orderId}/return-eligible-items`);
      
      if (!response.data.success) {
        // Fallback: fetch order and calculate manually
        const order = await this.getOrderWithBarcodes(orderId);
        
        return ((order.items || []) as any[]).map((item: any) => ({
          order_item_id: item.id,
          product_name: item.product_name,
          quantity_ordered: item.quantity,
          quantity_returned: item.quantity - (item.available_for_return || item.quantity),
          quantity_available: item.available_for_return || item.quantity,
          barcodes: (item.barcodes || []).map((b: string) => ({
            barcode: b,
            is_returned: false, // We don't know, so assume false
          })),
        }));
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Get return eligible items error:', error);
      throw new Error(error.message || 'Failed to fetch return eligible items');
    }
  }

  /**
   * Scan barcode and check if it belongs to a specific order
   */
  async scanBarcodeForOrder(barcode: string, orderId: number): Promise<{
    found: boolean;
    order_item?: {
      id: number;
      product_name: string;
      unit_price: string;
    };
    can_return: boolean;
    reason?: string;
  }> {
    try {
      const order = await this.getOrderWithBarcodes(orderId);
      
      for (const item of ((order.items || []) as any[])) {
        if (item.barcodes && item.barcodes.includes(barcode)) {
          // Check if already returned
          const alreadyReturned = await this.isBarcodeReturned(orderId, barcode);
          
          return {
            found: true,
            order_item: {
              id: item.id,
              product_name: item.product_name,
              unit_price: item.unit_price,
            },
            can_return: !alreadyReturned,
            reason: alreadyReturned ? 'Already returned' : undefined,
          };
        }
      }

      return {
        found: false,
        can_return: false,
        reason: 'Barcode not found in this order',
      };
    } catch (error: any) {
      console.error('Scan barcode for order error:', error);
      throw new Error(error.message || 'Failed to scan barcode');
    }
  }
}

// Export singleton instance
export const barcodeOrderMapper = new BarcodeOrderMapper();

export default barcodeOrderMapper;