import type { NextConfig } from 'next';
import * as path from 'path';

const nextConfig: NextConfig = {
  webpack(config) {
    // eslint-disable-next-line no-undef
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
