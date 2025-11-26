import type { NextConfig } from 'next';
import * as path from 'path';

const basePath = '/asset-price-predict';

const nextConfig: NextConfig = {
  output: 'export',

  images: {
    unoptimized: true,
  },

  basePath,
  assetPrefix: `${basePath}/`,

  webpack(config) {
    const projectRoot = __dirname;

    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(projectRoot, 'src'),
      '@shared': path.resolve(projectRoot, '../../packages/shared/src'),
    };
    return config;
  },
};

export default nextConfig;
