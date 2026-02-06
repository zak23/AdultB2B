/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Reduce EMFILE (too many open files): limit watcher to app dir, use polling if needed
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ignored: ['**/node_modules', '**/.git', '**/apps/api', '**/packages'],
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9010',
        pathname: '/adultb2b-media/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
