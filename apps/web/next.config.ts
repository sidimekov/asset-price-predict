import type { NextConfig } from 'next';
import * as path from 'path';
import { fileURLToPath } from 'url';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  output: 'export',

  images: {
    unoptimized: true,
  },

  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,

  webpack(config) {
    const projectRoot = path.dirname(fileURLToPath(import.meta.url));

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
