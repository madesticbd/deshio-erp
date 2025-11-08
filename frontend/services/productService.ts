import axios from '@/lib/axios';

export interface Product {
  id: number;
  name: string;
  sku?: string;
  description?: string;
  category_id?: number;
  vendor_id?: number;
  is_active: boolean;
  created_at: string;
}

class ProductService {
  async getProducts(params?: {
    search?: string;
    category_id?: number;
    vendor_id?: number;
    is_active?: boolean;
    per_page?: number;
  }) {
    const response = await axios.get('/products', { params });
    return response.data;
  }

  async getProduct(id: number) {
    const response = await axios.get(`/products/${id}`);
    return response.data;
  }
}

export default new ProductService();