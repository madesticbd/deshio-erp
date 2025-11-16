import axiosInstance from '@/lib/axios';

export interface Transaction {
  id: string;
  name: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  comment?: string;
  receiptImage?: string;
  createdAt: string;
  source: 'manual' | 'sale' | 'order' | 'batch' | 'return' | 'exchange';
  referenceId?: string;
  status?: string;
  paymentStatus?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  createdAt: string;
}

export interface TransactionStats {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  count: number;
}

export interface CreateTransactionDTO {
  name: string;
  description?: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  comment?: string;
  receiptImage?: string;
}

export interface CreateCategoryDTO {
  name: string;
  type: 'income' | 'expense';
}

class TransactionService {
  // Get all transactions (mapped from expenses)
  async getTransactions(params?: {
    status?: string;
    payment_status?: string;
    category_id?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    per_page?: number;
  }): Promise<{ transactions: Transaction[]; categories: Category[] }> {
    try {
      // Fetch expenses
      const expensesResponse = await axiosInstance.get('/expenses', { params });
      const expensesData = expensesResponse.data;

      // Fetch categories
      const categoriesResponse = await axiosInstance.get('/expense-categories');
      const categoriesData = categoriesResponse.data;

      // Transform expenses to transactions
      const transactions: Transaction[] = (expensesData.data || []).map((expense: any) => ({
        id: expense.id.toString(),
        name: expense.description || 'Expense',
        description: expense.reference_number || expense.vendor_invoice_number || '',
        type: 'expense' as const,
        amount: parseFloat(expense.total_amount || expense.amount || 0),
        category: expense.category?.name || 'Uncategorized',
        date: expense.expense_date,
        comment: expense.approval_notes || expense.rejection_reason || '',
        receiptImage: expense.attachments?.[0] || undefined,
        createdAt: expense.created_at,
        source: 'manual' as const,
        referenceId: expense.expense_number,
        status: expense.status,
        paymentStatus: expense.payment_status,
      }));

      // Transform categories
      const categories: Category[] = (categoriesData.success ? categoriesData.data : []).map((cat: any) => ({
        id: cat.id.toString(),
        name: cat.name,
        type: 'expense' as const, // All expense categories are type expense
        createdAt: cat.created_at,
      }));

      return { transactions, categories };
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      throw error;
    }
  }

  // Create a new transaction (as expense)
  async createTransaction(data: CreateTransactionDTO): Promise<Transaction> {
    try {
      // First, find or create the category
      let categoryId: number | null = null;

      if (data.category) {
        const categoriesResponse = await axiosInstance.get('/expense-categories');
        const categoriesData = categoriesResponse.data;
        const categories = categoriesData.success ? categoriesData.data : [];

        const existingCategory = categories.find(
          (cat: any) => cat.name.toLowerCase() === data.category.toLowerCase()
        );

        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          // Create new category with auto-generated code
          const code = data.category
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '_')
            .substring(0, 50) + '_' + Date.now().toString().slice(-6);

          const newCategoryResponse = await axiosInstance.post('/expense-categories', {
            name: data.category,
            code: code,
            type: 'other',
            is_active: true,
          });

          if (newCategoryResponse.data.success) {
            categoryId = newCategoryResponse.data.data.id;
          }
        }
      }

      // Create expense
      const expenseData = {
        description: data.name || data.description,
        amount: data.amount,
        expense_date: data.date,
        expense_type: 'one_time',
        reference_number: data.description || null,
        category_id: categoryId,
        attachments: data.receiptImage ? [data.receiptImage] : null,
        approval_notes: data.comment || null,
      };

      const response = await axiosInstance.post('/expenses', expenseData);
      const expense = response.data.data;

      // Transform to transaction format
      return {
        id: expense.id.toString(),
        name: expense.description || 'Expense',
        description: expense.reference_number || '',
        type: 'expense',
        amount: parseFloat(expense.total_amount || expense.amount || 0),
        category: expense.category?.name || data.category,
        date: expense.expense_date,
        comment: expense.approval_notes || '',
        receiptImage: expense.attachments?.[0] || undefined,
        createdAt: expense.created_at,
        source: 'manual',
        referenceId: expense.expense_number,
        status: expense.status,
        paymentStatus: expense.payment_status,
      };
    } catch (error) {
      console.error('Failed to create transaction:', error);
      throw error;
    }
  }

  // Create a new category
  async createCategory(data: CreateCategoryDTO): Promise<Category> {
    try {
      // Generate a unique code from the category name
      const code = data.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .substring(0, 50) + '_' + Date.now().toString().slice(-6);

      const response = await axiosInstance.post('/expense-categories', {
        name: data.name,
        code: code,
        type: data.type === 'income' ? 'other' : 'operational',
        is_active: true,
      });

      const category = response.data.data;

      return {
        id: category.id.toString(),
        name: category.name,
        type: data.type,
        createdAt: category.created_at,
      };
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  }

  // Get transaction statistics
  async getStatistics(params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<TransactionStats> {
    try {
      const response = await axiosInstance.get('/expenses/statistics', { params });
      const stats = response.data.data;

      return {
        totalIncome: 0, // Expense API doesn't track income
        totalExpense: parseFloat(stats.total_amount || 0),
        netBalance: -parseFloat(stats.total_amount || 0),
        count: stats.total_expenses || 0,
      };
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      throw error;
    }
  }

  // Get all categories
  async getCategories(): Promise<Category[]> {
    try {
      const response = await axiosInstance.get('/expense-categories');
      const categoriesData = response.data;

      return (categoriesData.success ? categoriesData.data : []).map((cat: any) => ({
        id: cat.id.toString(),
        name: cat.name,
        type: 'expense' as const,
        createdAt: cat.created_at,
      }));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      throw error;
    }
  }
}

export default new TransactionService();