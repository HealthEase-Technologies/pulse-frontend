"use client";

import Link from "next/link";

const PulseLogo = () => (
  <Link href="/" className="flex items-center space-x-2">
    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
      <div className="w-2 h-2 bg-white rounded-full"></div>
    </div>
    <span className="text-2xl font-bold text-gray-900">Pulse</span>
  </Link>
);

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Navigation */}
      <nav className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <PulseLogo />
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)] px-4 py-12">
        {children}
      </div>
    </div>
  );
}
