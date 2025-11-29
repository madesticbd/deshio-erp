'use client';
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';

export default function LoginRegisterPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  
  // Alert state
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Check if redirected from checkout
  const [isFromCheckout, setIsFromCheckout] = useState(false);

  useEffect(() => {
    const checkRedirect = () => {
      const redirectFlag = localStorage.getItem('checkout-redirect');
      if (redirectFlag === 'true') {
        setIsFromCheckout(true);
      }
    };
    checkRedirect();
  }, []);

  const showAlert = (type: string, message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      showAlert('error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/customer-auth/login', {
        email: loginEmail,
        password: loginPassword,
        remember_me: rememberMe
      });

      if (response.data.success) {
        const { customer, token } = response.data.data;
        
        // Store authentication data
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(customer));
        
        showAlert('success', 'Login successful! Redirecting...');
        
        // Check if redirected from checkout
        const wasFromCheckout = localStorage.getItem('checkout-redirect');
        
        // Remove redirect flag
        localStorage.removeItem('checkout-redirect');
        
        // Redirect after 1 second
        setTimeout(() => {
          if (wasFromCheckout === 'true') {
            router.push('/e-commerce/checkout');
          } else {
            router.push('/e-commerce/my-account');
          }
        }, 1000);
      } else {
        showAlert('error', response.data.message || 'Invalid credentials');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      showAlert('error', errorMessage);
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    // Validation
    if (!registerName || !registerEmail || !registerPhone || !registerPassword || !registerConfirmPassword) {
      showAlert('error', 'Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerEmail)) {
      showAlert('error', 'Please enter a valid email address');
      return;
    }

    const phoneRegex = /^(\+88)?01[3-9]\d{8}$/;
    if (!phoneRegex.test(registerPhone)) {
      showAlert('error', 'Please enter a valid Bangladesh phone number');
      return;
    }

    if (registerName.length < 2) {
      showAlert('error', 'Name must be at least 2 characters long');
      return;
    }

    if (registerPassword.length < 8) {
      showAlert('error', 'Password must be at least 8 characters long');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      showAlert('error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axiosInstance.post('/customer-auth/register', {
        name: registerName,
        email: registerEmail,
        phone: registerPhone,
        password: registerPassword,
        password_confirmation: registerConfirmPassword,
        country: 'Bangladesh'
      });

      if (response.data.success) {
        showAlert('success', 'Registration successful! Please login to continue.');
        
        // Clear form
        setRegisterName('');
        setRegisterEmail('');
        setRegisterPhone('');
        setRegisterPassword('');
        setRegisterConfirmPassword('');
        
        // Switch to login tab after 1.5 seconds
        setTimeout(() => {
          setActiveTab('login');
          setLoginEmail(registerEmail); // Pre-fill email
        }, 1500);
      } else {
        showAlert('error', response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      const errors = error.response?.data?.errors;
      
      if (errors) {
        const firstError = Object.values(errors)[0];
        showAlert('error', Array.isArray(firstError) ? firstError[0] : errorMessage);
      } else {
        showAlert('error', errorMessage);
      }
      
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={() => router.push('/e-commerce')}
              className="flex items-center text-gray-700 hover:text-red-700 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              <span>Back to Shop</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Deshio</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="text-sm text-gray-600">
          <button onClick={() => router.push('/e-commerce')} className="text-red-700 hover:underline">
            Home
          </button>
          <span className="mx-2">&gt;</span>
          <span>My account</span>
        </div>
      </div>

      {/* Checkout Redirect Notice */}
      {isFromCheckout && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-medium text-blue-900">Login Required</h3>
              <p className="text-sm text-blue-700 mt-1">
                Please login or create an account to continue with your checkout.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {alert.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`flex items-center gap-3 p-4 rounded-lg shadow-lg min-w-[320px] max-w-md ${
            alert.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            <div className="flex-shrink-0">
              {alert.type === 'success' ? (
                <CheckCircle size={24} className="text-white" />
              ) : (
                <AlertCircle size={24} className="text-white" />
              )}
            </div>
            <span className="flex-1 font-medium">{alert.message}</span>
            <button
              onClick={() => setAlert({ show: false, type: '', message: '' })}
              className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 pb-4 text-lg font-medium transition-colors relative ${
                activeTab === 'login'
                  ? 'text-red-700 border-b-2 border-red-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 pb-4 text-lg font-medium transition-colors relative ${
                activeTab === 'register'
                  ? 'text-red-700 border-b-2 border-red-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email address <span className="text-red-700">*</span>
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-700">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-red-700 border-gray-300 rounded focus:ring-red-700"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-700">Remember me</span>
                </label>
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-red-700 text-white py-3 rounded-md font-medium hover:bg-red-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Logging in...' : 'Log In'}
              </button>

              <div className="text-center">
                <a href="#" className="text-red-700 hover:underline text-sm">
                  Lost your password?
                </a>
              </div>
            </div>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email address <span className="text-red-700">*</span>
                </label>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-700">*</span>
                </label>
                <input
                  type="tel"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent transition-all"
                  placeholder="01XXXXXXXXX"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">Bangladesh phone number (e.g., 01712345678)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-700">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent transition-all"
                    placeholder="Create a password"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-700">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent transition-all"
                    placeholder="Confirm your password"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {registerConfirmPassword && registerPassword !== registerConfirmPassword && (
                    <span className="text-red-700">Passwords do not match</span>
                  )}
                  {registerConfirmPassword && registerPassword === registerConfirmPassword && (
                    <span className="text-green-700">Passwords match ✓</span>
                  )}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">
                  Your personal data will be used to support your experience throughout this website, to manage access to your account, and for other purposes described in our privacy policy.
                </p>
              </div>

              <button
                onClick={handleRegister}
                disabled={isLoading}
                type="button"
                className="w-full bg-red-700 text-white py-3 rounded-md font-medium hover:bg-red-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Registering...' : 'Register'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}