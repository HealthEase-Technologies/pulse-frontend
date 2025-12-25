/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // Add this line
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  eslint: {
    ignoreDuringBuilds: true, 
  },
};

export default nextConfig;