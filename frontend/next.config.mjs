/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['storage.googleapis.com', 'localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000/api/v1'}/:path*`,
      },
    ];
  },
  async redirects() {
    // Login is unified at /login — old per-portal login URLs redirect there.
    return [
      { source: '/admin/login', destination: '/login', permanent: true },
      { source: '/volunteer/login', destination: '/login', permanent: true },
      { source: '/register', destination: '/login', permanent: true },
    ];
  },
};

export default nextConfig;
