import axios from '@/lib/axios';

export interface Product {
  id: number;
  name: string;
  sku?: string;
}

export interface Store {
  id: number;
  name: string;
}

export interface Barcode {
  id: number;
  barcode: string;
  type: string;
  is_primary: boolean;
  is_active: boolean;
}

export interface Batch {
  id: number;
  batch_number: string;
  product: Product;
  store: Store;
  quantity: number;
  cost_price: string;
  sell_price: string;
  profit_margin: string;
  total_value: string;
  sell_value: string;
  availability: boolean;
  status: string;
  is_active: boolean;
  manufactured_date: string | null;
  expiry_date: string | null;
  days_until_expiry: number | null;
  barcode: Barcode | null;
  barcodes?: Barcode[]; // Array of all generated barcodes
  created_at: string;
}

export interface CreateBatchData {
  product_id: number;
  store_id: number;
  quantity: number;
  cost_price: number;
  sell_price: number;
  manufactured_date?: string;
  expiry_date?: string;
  generate_barcodes?: boolean;
  barcode_type?: 'CODE128' | 'EAN13' | 'QR';
  individual_barcodes?: boolean;
  notes?: string;
}

export interface UpdateBatchData {
  quantity?: number;
  cost_price?: number;
  sell_price?: number;
  availability?: boolean;
  manufactured_date?: string;
  expiry_date?: string;
  is_active?: boolean;
  notes?: string;
}

export interface AdjustStockData {
  adjustment: number;
  reason: string;
}

export interface BatchFilters {
  product_id?: number;
  store_id?: number;
  status?: 'available' | 'expired' | 'low_stock' | 'out_of_stock' | 'inactive';
  barcode?: string;
  expiring_days?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
}

class BatchService {
  // Get all batches with filters
  async getBatches(filters?: BatchFilters) {
    const response = await axios.get('/batches', { params: filters });
    return response.data;
  }

  // Get single batch
  async getBatch(id: number) {
    const response = await axios.get(`/batches/${id}`);
    return response.data;
  }

  // Create new batch
  async createBatch(data: CreateBatchData) {
    const response = await axios.post('/batches', data);
    return response.data;
  }

  // Update batch
  async updateBatch(id: number, data: UpdateBatchData) {
    const response = await axios.put(`/batches/${id}`, data);
    return response.data;
  }

  // Adjust stock (add or remove)
  async adjustStock(id: number, data: AdjustStockData) {
    const response = await axios.post(`/batches/${id}/adjust-stock`, data);
    return response.data;
  }

  // Get low stock batches
  async getLowStock(threshold: number = 10, storeId?: number) {
    const response = await axios.get('/batches/low-stock', {
      params: { threshold, store_id: storeId }
    });
    return response.data;
  }

  // Get expiring soon batches
  async getExpiringSoon(days: number = 30, storeId?: number) {
    const response = await axios.get('/batches/expiring-soon', {
      params: { days, store_id: storeId }
    });
    return response.data;
  }

  // Get expired batches
  async getExpired(storeId?: number) {
    const response = await axios.get('/batches/expired', {
      params: { store_id: storeId }
    });
    return response.data;
  }

  // Get batch statistics
  async getStatistics(storeId?: number) {
    const response = await axios.get('/batches/statistics', {
      params: { store_id: storeId }
    });
    return response.data;
  }

  // Delete/deactivate batch
  async deleteBatch(id: number) {
    const response = await axios.delete(`/batches/${id}`);
    return response.data;
  }


  // Get all barcodes for a batch/product
  async getBarcodesByProduct(productId: number) {
    const response = await axios.get(`/products/${productId}/barcodes`);
    return response.data;
  }

  // Generate barcodes for a product
  async generateBarcodes(data: {
    product_id: number;
    type?: 'CODE128' | 'EAN13' | 'QR';
    make_primary?: boolean;
    quantity: number;
  }) {
    const response = await axios.post('/barcodes/generate', data);
    return response.data;
  }

  // Scan a barcode
  async scanBarcode(barcode: string) {
    const response = await axios.post('/barcodes/scan', { barcode });
    return response.data;
  }

  // Batch scan multiple barcodes
  async batchScanBarcodes(barcodes: string[]) {
    const response = await axios.post('/barcodes/batch-scan', { barcodes });
    return response.data;
  }

  // Get barcode history
  async getBarcodeHistory(barcode: string) {
    const response = await axios.get(`/barcodes/${barcode}/history`);
    return response.data;
  }

  // Get barcode location
  async getBarcodeLocation(barcode: string) {
    const response = await axios.get(`/barcodes/${barcode}/location`);
    return response.data;
  }
}

export default new BatchService();