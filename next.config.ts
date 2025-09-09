import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        '*.replit.dev', 
        '*.replit.app', 
        'localhost:5000',
        '63ba2aee-74e9-4fb2-9dbc-a0717c6cec89-00-3se7refk0ghbi.spock.replit.dev',
        '63ba2aee-74e9-4fb2-9dbc-a0717c6cec89-00-3se7refk0ghbi.spock.replit.dev:5000'
      ],
    },
  },
  allowedDevOrigins: [
    '*.replit.dev', 
    '*.replit.app',
    '63ba2aee-74e9-4fb2-9dbc-a0717c6cec89-00-3se7refk0ghbi.spock.replit.dev'
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
