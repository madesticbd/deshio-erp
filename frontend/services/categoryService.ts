// services/categoryService.ts
import axiosInstance from '@/lib/axios';
import { Category } from '@/components/CategoryCard';

// Helper to transform Laravel response (children -> subcategories) RECURSIVELY
function transformCategory(cat: any): Category {
  return {
    id: cat.id.toString(), // Ensure ID is string
    title: cat.title,
    description: cat.description || "",
    slug: cat.slug,
    image: cat.image 
      ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${cat.image}` 
      : "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400",
    // RECURSIVELY transform children to subcategories
    subcategories: (cat.children || cat.all_children || []).map(transformCategory),
  };
}

export const categoryService = {
  // Get all categories (hierarchical structure)
  async getAll(): Promise<Category[]> {
    try {
      const response = await axiosInstance.get('/categories', {
        params: { tree: true }
      });
      
      const result = response.data;
      
      // Handle Laravel paginated response: { success, data: { data: [...] } }
      // OR tree response: { success, data: [...] }
      let categories = [];
      
      if (result.success) {
        // If data has a 'data' property (pagination), use that
        if (result.data && Array.isArray(result.data.data)) {
          categories = result.data.data;
        } else if (Array.isArray(result.data)) {
          // Otherwise use data directly
          categories = result.data;
        }
      } else if (Array.isArray(result)) {
        // Fallback for direct array response
        categories = result;
      }
      
      // Transform all categories recursively
      return categories.map(transformCategory);
    } catch (error: any) {
      console.error('Get categories error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  },

  // Create category with image
  async create(data: {
    title: string;
    slug: string;
    description?: string;
    parent_id?: string | null;
    image?: File;
  }): Promise<Category> {
    try {
      // If there's an image, use FormData
      if (data.image) {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('slug', data.slug);
        if (data.description) formData.append('description', data.description);
        if (data.parent_id) formData.append('parent_id', data.parent_id);
        formData.append('image', data.image);
        
        const response = await axiosInstance.post('/categories', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        const result = response.data;
        return transformCategory(result.data || result);
      } else {
        // No image, send as JSON
        const response = await axiosInstance.post('/categories', {
          title: data.title,
          slug: data.slug,
          description: data.description,
          parent_id: data.parent_id,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const result = response.data;
        return transformCategory(result.data || result);
      }
    } catch (error: any) {
      console.error('Create category error:', error);
      
      // Check for duplicate category error
      if (error.response?.status === 409 || 
          error.response?.data?.message?.toLowerCase().includes('already exists') ||
          error.response?.data?.message?.toLowerCase().includes('duplicate')) {
        const err = new Error('Category already exists');
        (err as any).isDuplicate = true;
        throw err;
      }
      
      throw new Error(error.response?.data?.message || 'Failed to create category');
    }
  },

  // Update category with optional image
  async update(id: string, data: {
    title: string;
    slug: string;
    description?: string;
    parent_id?: string | null;
    image?: File;
    remove_image?: boolean;
  }): Promise<Category> {
    try {
      // If there's an image or we're removing image, use FormData
      if (data.image || data.remove_image) {
        const formData = new FormData();
        formData.append('_method', 'PUT'); // Laravel method spoofing for multipart
        formData.append('title', data.title);
        formData.append('slug', data.slug);
        if (data.description) formData.append('description', data.description);
        if (data.parent_id) formData.append('parent_id', data.parent_id);
        if (data.image) formData.append('image', data.image);
        if (data.remove_image) formData.append('remove_image', 'true');
        
        const response = await axiosInstance.post(`/categories/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        const result = response.data;
        return transformCategory(result.data || result);
      } else {
        // No image changes, send as JSON
        const response = await axiosInstance.put(`/categories/${id}`, {
          title: data.title,
          slug: data.slug,
          description: data.description,
          parent_id: data.parent_id,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const result = response.data;
        return transformCategory(result.data || result);
      }
    } catch (error: any) {
      console.error('Update category error:', error);
      
      // Check for duplicate category error
      if (error.response?.status === 409 || 
          error.response?.data?.message?.toLowerCase().includes('already exists') ||
          error.response?.data?.message?.toLowerCase().includes('duplicate')) {
        const err = new Error('Category already exists');
        (err as any).isDuplicate = true;
        throw err;
      }
      
      throw new Error(error.response?.data?.message || 'Failed to update category');
    }
  },

  // Delete category
  async delete(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`/categories/${id}`);
    } catch (error: any) {
      console.error('Delete category error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete category');
    }
  },

  // Check if category exists (for client-side validation)
  checkDuplicate(categories: Category[], title: string, parentId: string | null, excludeId?: string): boolean {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const flattenCategories = (cats: Category[]): Category[] => {
      return cats.reduce((acc: Category[], cat) => {
        acc.push(cat);
        if (cat.subcategories) {
          acc.push(...flattenCategories(cat.subcategories));
        }
        return acc;
      }, []);
    };
    
    const allCategories = flattenCategories(categories);
    
    return allCategories.some(cat => {
      if (excludeId && cat.id === excludeId) return false;
      
      const catSlug = cat.slug || cat.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const catParentId = allCategories.find(p => p.subcategories?.some(s => s.id === cat.id))?.id || null;
      
      return catSlug === slug && catParentId === parentId;
    });
  }
};
export type { Category };
