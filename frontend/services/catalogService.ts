import axiosInstance from '@/lib/axios';

// Types matching the actual backend response
export interface ProductImage {
  id: number;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  display_order?: number;
}

export interface ProductCategory {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  short_description?: string;
  selling_price: number;
  cost_price: number;
  stock_quantity: number;
  in_stock: boolean;
  images: ProductImage[];
  category: ProductCategory | null;
  created_at: string;
}

export interface CatalogCategory {
  id: number;
  name: string;
  description?: string;
  product_count: number;
  children?: CatalogCategory[];
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationMeta;
  filters_applied: {
    category?: string;
    min_price?: number;
    max_price?: number;
    search?: string;
    in_stock: boolean;
    sort_by: string;
    sort_order: string;
  };
}

export interface ProductDetailResponse {
  product: Product;
  related_products: Product[];
}

export interface GetProductsParams {
  per_page?: number;
  page?: number;
  category?: string; // Category name
  min_price?: number;
  max_price?: number;
  sort_by?: 'created_at' | 'name';
  sort_order?: 'asc' | 'desc';
  search?: string;
  in_stock?: boolean;
}

export interface SearchParams {
  q: string;
  per_page?: number;
  page?: number;
}

export interface SearchResponse {
  products: Product[];
  suggestions: string[];
  search_query: string;
  pagination: PaginationMeta;
}

export interface PriceRange {
  min_price: number;
  max_price: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

class CatalogService {
  private baseUrl = '/catalog';

  // Helper to build query string
  private buildQueryString(params: Record<string, any>): string {
    const pairs: string[] = [];
    
    for (const key in params) {
      if (params[key] !== undefined && params[key] !== null) {
        const value = encodeURIComponent(String(params[key]));
        pairs.push(key + '=' + value);
      }
    }
    
    return pairs.length > 0 ? '?' + pairs.join('&') : '';
  }

  // Normalize image URLs
  private normalizeImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';
    return baseUrl + url;
  }

  // Normalize product images
  private normalizeProduct(product: any): Product {
    if (product.images && Array.isArray(product.images)) {
      product.images = product.images.map((img: any) => ({
        ...img,
        url: this.normalizeImageUrl(img.url)
      }));
    }
    return product;
  }

  /**
   * GET PRODUCTS (with filters, pagination, sorting)
   * Category parameter accepts category name (backend uses LIKE search)
   */
  async getProducts(params: GetProductsParams = {}): Promise<ProductsResponse> {
    try {
      const queryString = this.buildQueryString(params);
      const url = this.baseUrl + '/products' + queryString;
      
      console.log('🔍 Fetching products from:', url);
      console.log('📦 Params:', params);
      
      const response = await axiosInstance.get<ApiResponse<ProductsResponse>>(url);
      const data = response.data.data;
      
      // Normalize image URLs
      data.products = data.products.map(product => this.normalizeProduct(product));
      
      console.log('✅ Products fetched:', data.products.length);
      
      return data;
    } catch (error: any) {
      console.error('❌ Failed to fetch products:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  /**
   * GET SINGLE PRODUCT (by ID only - backend doesn't support slug)
   */
  async getProduct(identifier: number): Promise<ProductDetailResponse> {
    try {
      const url = this.baseUrl + '/products/' + identifier;
      
      const response = await axiosInstance.get<ApiResponse<ProductDetailResponse>>(url);
      const data = response.data.data;
      
      // Normalize image URLs
      data.product = this.normalizeProduct(data.product);
      data.related_products = data.related_products.map(product => this.normalizeProduct(product));
      
      return data;
    } catch (error: any) {
      console.error('Failed to fetch product:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  /**
   * GET CATEGORIES (with product counts and children)
   * Returns empty array on failure to prevent navigation breaking
   */
  async getCategories(): Promise<CatalogCategory[]> {
    try {
      const url = this.baseUrl + '/categories';
      
      const response = await axiosInstance.get<ApiResponse<{ categories: CatalogCategory[] }>>(url);
      const categories = response.data.data.categories;
      
      return categories;
    } catch (error: any) {
      // Log warning but return empty array to not break the UI
      console.warn('Categories endpoint failed, navigation will work without dynamic categories:', error.response?.data?.message || error.message);
      
      // Return empty array instead of throwing - this prevents the navigation from breaking
      return [];
    }
  }

  /**
   * GET FEATURED PRODUCTS
   */
  async getFeaturedProducts(limit: number = 8): Promise<{
    featured_products: Product[];
    total_featured: number;
  }> {
    try {
      const queryString = this.buildQueryString({ limit });
      const url = this.baseUrl + '/featured-products' + queryString;
      
      const response = await axiosInstance.get<ApiResponse<{
        featured_products: Product[];
        total_featured: number;
      }>>(url);
      const data = response.data.data;
      
      // Normalize image URLs
      data.featured_products = data.featured_products.map(product => this.normalizeProduct(product));
      
      return data;
    } catch (error: any) {
      console.error('Failed to fetch featured products:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  /**
   * GET NEW ARRIVALS
   */
  async getNewArrivals(limit: number = 8, days: number = 30): Promise<{
    new_arrivals: Product[];
    total_new_arrivals: number;
    days_range: number;
  }> {
    try {
      const queryString = this.buildQueryString({ limit, days });
      const url = this.baseUrl + '/new-arrivals' + queryString;
      
      const response = await axiosInstance.get<ApiResponse<{
        new_arrivals: Product[];
        total_new_arrivals: number;
        days_range: number;
      }>>(url);
      const data = response.data.data;
      
      // Normalize image URLs
      data.new_arrivals = data.new_arrivals.map(product => this.normalizeProduct(product));
      
      return data;
    } catch (error: any) {
      console.error('Failed to fetch new arrivals:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  /**
   * SEARCH PRODUCTS (with suggestions)
   */
  async searchProducts(params: SearchParams): Promise<SearchResponse> {
    try {
      const queryString = this.buildQueryString(params);
      const url = this.baseUrl + '/search' + queryString;
      
      const response = await axiosInstance.get<ApiResponse<SearchResponse>>(url);
      const data = response.data.data;
      
      // Normalize image URLs
      data.products = data.products.map(product => this.normalizeProduct(product));
      
      return data;
    } catch (error: any) {
      console.error('Failed to search products:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  /**
   * GET PRICE RANGE (for filtering)
   */
  async getPriceRange(): Promise<PriceRange> {
    try {
      const url = this.baseUrl + '/price-range';
      
      const response = await axiosInstance.get<ApiResponse<PriceRange>>(url);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch price range:', error.response?.data?.message || error.message);
      throw error;
    }
  }
}

// Export a singleton instance
const catalogService = new CatalogService();
export default catalogService;