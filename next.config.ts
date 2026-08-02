import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    optimizePackageImports: [
      'gsap',
      '@gsap/react',
      'react-toastify',
      'swiper',
      'oneentry',
      '@reduxjs/toolkit',
      'react-redux',
    ],
    serverActions: {
      bodySizeLimit: '2mb',
    },
    workerThreads: false,
    cpus: 4,
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: { icon: false, svgo: true, titleProp: true },
          },
        ],
        as: '*.js',
      },
    },
  },
  webpack(config) {
    const fileLoaderRule = config.module.rules.find(
      (rule: { test?: { test?: (s: string) => boolean } }) => rule?.test?.test?.('.svg')
    );
    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: { icon: false, svgo: true, titleProp: true },
        },
      ],
    });
    return config;
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  sassOptions: {
    includePaths: [path.join(process.cwd(), 'styles')],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // OneEntry CDN URLs (/cloud-static/**) are immutable per file — the optimized
    // variant never needs to change, so cache it for a year. The previous 60s TTL made
    // the edge re-fetch from compute every minute, re-encoding and re-streaming each
    // dish photo back to the CDN (Fast Origin Transfer outgoing) on a loop.
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 768, 1024, 1280, 1920, 2560],
    imageSizes: [16, 32, 64, 96, 128, 256],
    qualities: [75],
    unoptimized: false,
    // OneEntry CDN resolves via NAT64 (64:ff9b::/96) — the image optimizer treats
    // this as a private IP and refuses to fetch. The host is public, opt-in is safe.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.oneentry.cloud',
        port: '',
        pathname: '/cloud-static/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Conservative CSP — covers clickjacking, form hijack, plugins and <base> abuse
          // without restricting script/img/connect sources (those need a nonce-based
          // setup via middleware to be both strict and Next.js-compatible).
          {
            key: 'Content-Security-Policy',
            value: [
              "frame-ancestors 'self'",
              "form-action 'self' https://checkout.stripe.com https://*.stripe.com",
              "base-uri 'self'",
              "object-src 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/password',
        destination: '/',
        permanent: true,
      },
    ];
  },
  compress: true,
};

export default nextConfig;
