FROM node:22-alpine

WORKDIR /repo

RUN corepack enable

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY tsconfig.base.json tsconfig.base.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

COPY apps/api apps/api
COPY packages/shared packages/shared

RUN pnpm --filter @assetpredict/shared build
RUN pnpm --filter @assetpredict/api build

ENV NODE_ENV=production

EXPOSE 3001

CMD ["pnpm", "--filter", "@assetpredict/api", "start"]
