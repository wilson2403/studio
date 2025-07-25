
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
      },
       {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      }
    ],
  },
  devIndicators: {
    allowedDevOrigins: [
        'https://6000-firebase-studio-1753019953992.cluster-hf4yr35cmnbd4vhbxvfvc6cp5q.cloudworkstations.dev',
        'https://9000-firebase-studio-1753019953992.cluster-hf4yr35cmnbd4vhbxvfvc6cp5q.cloudworkstations.dev'
    ]
  },
}

module.exports = nextConfig;
