import type { AuthUser } from '@assetpredict/shared';

declare module 'fastify' {
  interface FastifyRequest {
    user?: Pick<AuthUser, 'id' | 'email' | 'username'>;
  }
}
