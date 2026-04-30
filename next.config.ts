import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['@prisma/client'],
  turbopack: {},

  // Enable WASM support
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ensure WASM files are handled correctly
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };

      // Handle WASM files
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };
    }

    return config;
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      // CORS headers for WASM files
      {
        source: '/:path*.wasm',
        headers: [
          { key: 'Content-Type', value: 'application/wasm' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
        ],
      },
    ];
  },
};

export default nextConfig;
