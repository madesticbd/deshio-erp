"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import authService, { LoginCredentials, Employee } from '@/services/authService';

interface AuthContextType {
  user: Employee | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Token refresh interval
  useEffect(() => {
    // Public routes that don't need token refresh
    const publicRoutes = ['/login', '/signup', '/forgot-password'];
    const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));

    // Don't run token refresh on public routes or if not authenticated
    if (isPublicRoute || !authService.isAuthenticated()) {
      return;
    }

    // Refresh token every 50 minutes (assuming 60min expiry)
    const interval = setInterval(async () => {
      try {
        await authService.refreshToken();
        console.log('Token refreshed successfully');
      } catch (error) {
        console.error('Token refresh failed:', error);
        // If refresh fails, logout user
        await logout();
      }
    }, 50 * 60 * 1000); // 50 minutes

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [pathname, user]);

  const checkAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        const employee = await authService.getCurrentUser();
        setUser(employee);
        authService.setUserData(employee);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Token might be expired or invalid
      authService.clearAuth();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      const employee = await authService.getCurrentUser();
      setUser(employee);
      authService.setUserData(employee);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      authService.clearAuth();
      router.push('/login');
    }
  };

  const refreshUser = async () => {
    try {
      const employee = await authService.getCurrentUser();
      setUser(employee);
      authService.setUserData(employee);
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}