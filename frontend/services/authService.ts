import axiosInstance from 'lib/axios';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  store_id: string;
  role_id?: string;
  phone?: string;
  department?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface SignupResponse extends AuthResponse {
  message: string;
  employee: {
    id: number;
    name: string;
    email: string;
    employee_code: string;
    store_id: string;
    role_id: string;
    phone?: string;
    department?: string;
    is_active: boolean;
  };
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  employee_code: string;
  store_id: string;
  role_id: string;
  phone?: string;
  department?: string;
  is_active: boolean;
  hire_date?: string;
  last_login_at?: string;
}

class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/login', credentials);
    
    // Store token in localStorage
    if (response.data.access_token) {
      this.setAuthToken(response.data.access_token);
      
      // Fetch and store user data after login
      try {
        const user = await this.getCurrentUser();
        this.setUserData(user);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Clear token if we can't fetch user data
        this.clearAuth();
        throw error;
      }
    }
    
    return response.data;
  }

  /**
   * Register a new employee
   */
  async signup(data: SignupData): Promise<SignupResponse> {
    const response = await axiosInstance.post<SignupResponse>('/signup', data);
    
    // Store token and user data in localStorage
    if (response.data.access_token) {
      this.setAuthToken(response.data.access_token);
      
      // Store employee data from signup response
      if (response.data.employee) {
        this.setUserData(response.data.employee);
      }
    }
    
    return response.data;
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<Employee> {
    const response = await axiosInstance.get<Employee>('/me');
    return response.data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await axiosInstance.post('/logout');
    } finally {
      this.clearAuth();
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/refresh');
    
    if (response.data.access_token) {
      this.setAuthToken(response.data.access_token);
    }
    
    return response.data;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  /**
   * Get authentication token
   */
  getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  /**
   * Clear all authentication data
   */
  clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('storeId');
      localStorage.removeItem('storeName');
      localStorage.removeItem('platforms');
    }
  }

  /**
   * Store user data in localStorage
   */
  setUserData(employee: Employee | SignupResponse['employee']): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userId', employee.id.toString());
      localStorage.setItem('userName', employee.name);
      localStorage.setItem('userEmail', employee.email);
      localStorage.setItem('userRole', employee.role_id);
      
      if (employee.store_id) {
        localStorage.setItem('storeId', employee.store_id);
      }
    }
  }
}

export default new AuthService();