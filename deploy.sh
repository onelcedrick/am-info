#!/bin/bash
echo "🚀 Deploiement AM Info..."

# Build et lancement
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "✅ Backend: http://localhost:8000"
echo "✅ Frontend: http://localhost"
echo "✅ API Docs: http://localhost:8000/docs"
