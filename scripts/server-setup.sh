#!/bin/bash
# Run once on a fresh Ubuntu 24.04 server to set up KampanyeKit production.
# Usage: sudo bash scripts/server-setup.sh

set -e

echo "=== Installing Docker ==="
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER

echo "=== Creating app directory ==="
mkdir -p /opt/kampanyekit/credentials
cd /opt/kampanyekit

echo "=== Install Certbot ==="
apt-get install -y certbot
# certbot certonly --standalone -d kampanyekit.id -d www.kampanyekit.id

echo ""
echo "Next steps:"
echo "  1. Copy .env.prod.example to /opt/kampanyekit/.env.prod and fill in secrets"
echo "  2. Place GCS key at /opt/kampanyekit/credentials/gcs-key.json"
echo "  3. Run: docker compose -f docker-compose.prod.yml --env-file .env.prod up -d"
echo "  4. docker compose -f docker-compose.prod.yml exec backend python manage.py migrate"
echo "  5. docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser"
