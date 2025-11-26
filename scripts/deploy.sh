#!/usr/bin/env bash
set -euo pipefail

echo "[deploy] Starting deploy script..."

: "${DEPLOY_TARGET:=github-pages}"

echo "[deploy] DEPLOY_TARGET=${DEPLOY_TARGET}"

case "${DEPLOY_TARGET}" in
  github-pages)
    echo "[deploy] Building static site for apps/web..."

    export NODE_ENV=production

    pnpm --filter ./apps/web run build

    echo "[deploy] Static site ready in apps/web/out"
    ;;

  *)
    echo "[deploy] Unknown DEPLOY_TARGET=${DEPLOY_TARGET}" >&2
    exit 1
    ;;
esac

echo "[deploy] deploy.sh finished successfully"
