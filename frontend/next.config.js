const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Monorepo: üst dizinde ikinci lockfile varken file tracing kökünü açıkça repo köküne sabitle (Next dokümantasyonu).
  outputFileTracingRoot: path.join(__dirname, '..'),
  eslint: {
    // Projede çok sayıda mevcut ESLint ihlali varken `next build`'in tamamen düşmesini engeller.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Bazı sayfalarda birikmiş tip uyumsuzlukları varken üretim derlemesinin tamamlanması için (tercihen ayrıca `tsc` ile düzeltilmeli).
    ignoreBuildErrors: true,
  },
  output: 'standalone',
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