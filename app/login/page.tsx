"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  // If already logged in, skip login form
  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn")
    /*if (loggedIn === "true") {
      router.push("/store")
    }*/
  }, [router])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Fake login: just set localStorage
    localStorage.setItem("loggedIn", "true")
    console.log("Logged in:", { username, password })
    router.push("/store") // Redirect to StorePage
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
        {/* Logo section with dark background */}
        <div className="bg-gray-900 px-12 py-4 flex justify-center">
          <Image
            src="/deshiologo.png"
            alt="Deshi Info Logo"
            width={300}
            height={120}
            priority
            className="h-auto max-w-full"
          />
        </div>

        {/* Login form section with white background */}
        <div className="bg-white p-8 space-y-6">

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 mt-6"
            >
              Login
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-600 text-sm">
            Don't have an account?{" "}
            <a href="#" className="text-gray-900 hover:underline font-medium">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
