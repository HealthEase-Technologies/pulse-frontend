"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("access-token");
    if (token) {
      // Redirect to dashboard if authenticated
      router.push("/dashboard");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-900 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="text-2xl font-bold text-gray-900">Pulse</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Pulse
            </h1>
            <p className="text-gray-600">
              Unified Healthcare Monitoring Platform
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg text-center font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="block w-full border-2 border-blue-600 text-blue-600 py-3 px-4 rounded-lg text-center font-medium hover:bg-blue-50 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
