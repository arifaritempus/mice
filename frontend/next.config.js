const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: false,
  experimental: {
    optimizeCss: false,
  },
  async rewrites() {
    return [
      // Favicon fallback: mevcut logo dosyasına yönlendir
      {
        source: '/favicon.ico',
        destination: '/LOGO_NAVY.png',
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
}

module.exports = nextConfig 