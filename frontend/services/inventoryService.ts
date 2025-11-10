import axios from '@/lib/axios';
import { ApiResponse } from './api.types';

export interface StoreBreakdown {
  store_id: number;
  store_name: string;
  store_code: string;
  quantity: number;
  batches_count: number;
}

export interface GlobalInventoryItem {
  product_id: number;
  product_name: string;
  sku: string;
  total_quantity: number;
  stores_count: number;
  stores: StoreBreakdown[];
  is_low_stock: boolean;
}

export interface LowStockAlert {
  batch_id: number;
  batch_number: string;
  product_id: number;
  product_name: string;
  sku: string;
  store_id: number;
  store_name: string;
  current_quantity: number;
  reorder_level: number;
  shortage: number;
  urgency: 'critical' | 'high' | 'medium';
}

export interface InventoryStatistics {
  overview: {
    total_products: number;
    total_batches: number;
    active_batches: number;
    total_inventory_units: number;
    total_inventory_value: number;
  };
  alerts: {
    low_stock: number;
    out_of_stock: number;
    expiring_soon: number;
  };
  stores: Array<{
    store_id: number;
    store_name: string;
    products_count: number;
    total_quantity: number;
    total_value: number;
  }>;
}

export interface ProductSearchResult {
  product_id: number;
  product_name: string;
  sku: string;
  total_quantity: number;
  available_in_stores: number;
  stores: Array<{
    store_id: number;
    store_name: string;
    store_code: string;
    quantity: number;
    is_warehouse: boolean;
    is_online: boolean;
  }>;
}

export interface InventoryValueReport {
  total_inventory_value: number;
  total_products: number;
  total_batches: number;
  by_store: Array<{
    store_id: number;
    store_name: string;
    store_code: string;
    total_value: number;
    products_count: number;
    batches_count: number;
  }>;
  top_products: Array<{
    product_id: number;
    product_name: string;
    sku: string;
    total_quantity: number;
    total_value: number;
    average_unit_cost: number;
  }>;
}

export interface StockAgingData {
  fresh: any[];
  medium: any[];
  aged: any[];
  summary: {
    fresh_count: number;
    medium_count: number;
    aged_count: number;
  };
}

class InventoryService {
  private readonly endpoint = '/inventory';

  /**
   * Get global inventory overview across all stores
   */
  async getGlobalInventory(filters?: {
    product_id?: number;
    store_id?: number;
    low_stock?: boolean;
  }): Promise<ApiResponse<GlobalInventoryItem[]>> {
    const response = await axios.get(`${this.endpoint}/global`, { params: filters });
    return response.data;
  }

  /**
   * Search product availability across all stores
   */
  async searchProductAcrossStores(search: string): Promise<ApiResponse<ProductSearchResult[]>> {
    const response = await axios.post(`${this.endpoint}/search`, { search });
    return response.data;
  }

  /**
   * Get low stock alerts across all stores
   */
  async getLowStockAlerts(): Promise<ApiResponse<{
    total_alerts: number;
    critical: number;
    high: number;
    medium: number;
    alerts: LowStockAlert[];
  }>> {
    const response = await axios.get(`${this.endpoint}/low-stock-alerts`);
    return response.data;
  }

  /**
   * Get inventory value report
   */
  async getInventoryValue(): Promise<ApiResponse<InventoryValueReport>> {
    const response = await axios.get(`${this.endpoint}/value`);
    return response.data;
  }

  /**
   * Get inventory statistics and dashboard data
   */
  async getStatistics(): Promise<ApiResponse<InventoryStatistics>> {
    const response = await axios.get(`${this.endpoint}/statistics`);
    return response.data;
  }

  /**
   * Get stock aging analysis
   */
  async getStockAging(): Promise<ApiResponse<StockAgingData>> {
    const response = await axios.get(`${this.endpoint}/stock-aging`);
    return response.data;
  }
}

export default new InventoryService();