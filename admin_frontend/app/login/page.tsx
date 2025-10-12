"use client";

<<<<<<< HEAD
import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Add your login logic here
    console.log("Login attempt:", { email, password, rememberMe })

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      router.push("/dashboard")
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center gap-12 p-4">
        {/* Form Section */}
        <div className="w-full lg:w-1/2 flex items-center justify-center order-2 lg:order-1">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-2 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 text-center">Deshio</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-sm text-gray-900 hover:text-gray-700 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:md focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="remember" className="text-sm text-gray-700 cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gray-900 text-white py-2.5 px-4 rounded-md font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>

              <p className="text-sm text-center text-gray-600">
                Don't have an account?{" "}
                <Link href="/signup" className="text-gray-600 hover:text-gray-700 font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>

        {/* Image Section */}
        <div className="w-full lg:w-1/2 flex items-center justify-center order-1 lg:order-2">
          <div className="relative w-full max-w-5xl aspect-square">
            <Image src="/shopping-bags.png" alt="Colorful shopping bags" fill className="object-contain" priority />
          </div>
=======
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    const emailRegex = new RegExp("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Clear error
    setError("");

    // Save login info (fake login)
    localStorage.setItem("loggedIn", "true");

    console.log("Logged in:", { email, password });

    // Navigate to dashboard after login
    router.push("/dashboard");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="relative min-h-screen flex">
      {/* Full-screen background image */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/shopping-cart.jpg"
          alt="Shopping Cart"
          className="w-full h-full object-cover object-bottom"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-white/50 to-white/90"></div>
      </div>

      {/* Right-side Login Form */}
      <div className="relative z-10 ml-auto w-full lg:w-2/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white backdrop-blur-sm rounded-3xl shadow-2xl p-10 space-y-6">
          {/* Welcome Text */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-base text-gray-500">
              Sign in to continue your journey
            </p>
          </div>

          {/* Form Inputs */}
          <div className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-semibold text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Forgot?
                </a>
              </div>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="button"
              onClick={handleLogin}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mt-6"
            >
              Sign In
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-600 text-sm mt-6 pt-4 border-t border-gray-200">
            Don't have an account?{" "}
            <a
              href="#"
              className="text-gray-900 hover:text-gray-700 font-semibold hover:underline"
            >
              Create Account
            </a>
          </p>
>>>>>>> 4bc6fea3d17cdcc2a0e3cadc7b81d8230827ad76
        </div>
      </div>
    </div>
  );
}
