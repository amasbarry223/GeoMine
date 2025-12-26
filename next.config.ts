import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove "standalone" output for Vercel deployment
  // output: "standalone", // Only needed for self-hosting
  /* config options here */
  typescript: {
    ignoreBuildErrors: false, // Set to false for production
  },
  reactStrictMode: true, // Enable for production
  eslint: {
    ignoreDuringBuilds: false, // Set to false for production
  },
  // Handle CommonJS modules like react-plotly.js
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Ensure CommonJS modules are properly resolved
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.jsx': ['.jsx', '.tsx'],
    };
    
    return config;
  },
  // Transpile packages that need special handling
  transpilePackages: [
    'react-plotly.js',
    'plotly.js',
    '@react-three/fiber',
    '@react-three/drei',
    'three',
  ],
};

export default nextConfig;
