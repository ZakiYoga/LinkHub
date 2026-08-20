#!/bin/bash
set -e

echo ">> Pulling latest changes..."
git pull origin main

echo ">> Rebuilding & restarting containers..."
docker compose up -d --build

echo ">> Cleaning up old images..."
docker image prune -f

echo ">> Done."
docker compose ps
