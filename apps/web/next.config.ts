import type { NextConfig } from 'next';
import * as path from 'path';
import { withSentryConfig } from '@sentry/nextjs';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,

  transpilePackages: ['@assetpredict/shared'],

  webpack(config) {
    config.resolve = config.resolve || {};

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(projectRoot, 'src'),
      '@shared': path.resolve(projectRoot, '../../packages/shared/src'),
    };

    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias || {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };

    config.resolve.extensions = Array.from(
      new Set([
        ...(config.resolve.extensions || []),
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
        '.mjs',
      ]),
    );

    return config;
  },
};

const sentryWebpackPluginOptions = { silent: true };

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
