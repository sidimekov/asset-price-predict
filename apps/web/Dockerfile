FROM node:22-alpine

WORKDIR /repo

RUN corepack enable

ARG NEXT_PUBLIC_YM_ID
ENV NEXT_PUBLIC_YM_ID=$NEXT_PUBLIC_YM_ID

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY tsconfig.base.json tsconfig.base.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

COPY apps/web apps/web
COPY packages/shared packages/shared

RUN pnpm --filter @assetpredict/shared build
RUN pnpm --filter @assetpredict/web build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["pnpm", "--filter", "@assetpredict/web", "start"]
