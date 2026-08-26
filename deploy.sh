#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# BrandSetu — One-command deployment script
# Usage:  ./deploy.sh [backend|frontend|all]
# ─────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
S3_BUCKET="${BRANDSETU_S3_BUCKET:-brandsetu-frontend}"
CF_DISTRIBUTION_ID="${BRANDSETU_CF_DIST_ID:-}"

deploy_backend() {
    echo "🚀 Building & deploying backend (SAM)..."
    cd "$SCRIPT_DIR"
    sam build
    sam deploy
    echo "✅ Backend deployed!"
}

deploy_frontend() {
    echo "🚀 Building & deploying frontend..."
    cd "$SCRIPT_DIR/Frontend"
    npm ci
    npm run build
    echo "📦 Uploading to S3: s3://$S3_BUCKET"
    aws s3 sync dist/ "s3://$S3_BUCKET" --delete
    if [ -n "$CF_DISTRIBUTION_ID" ]; then
        echo "🔄 Invalidating CloudFront cache..."
        aws cloudfront create-invalidation \
            --distribution-id "$CF_DISTRIBUTION_ID" \
            --paths "/*" > /dev/null
    fi
    echo "✅ Frontend deployed!"
}

case "${1:-all}" in
    backend)  deploy_backend ;;
    frontend) deploy_frontend ;;
    all)
        deploy_backend
        deploy_frontend
        ;;
    *)
        echo "Usage: $0 [backend|frontend|all]"
        exit 1
        ;;
esac
