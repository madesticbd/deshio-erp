"use client"

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
        </div>
      </div>
    </div>
  )

