#!/bin/bash

echo "📡 EventIQ Backend Başlatılıyor..."
echo "====================================="

# NVM ve npm ortamını yükle
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
  # Mümkünse Node 20 veya varsayılanı kullan
  nvm use 20 >/dev/null 2>&1 || true
fi

# npm var mı kontrol et
if ! command -v npm >/dev/null 2>&1; then
  echo "❌ npm bulunamadı. Lütfen Node.js (npm) kurun veya NVM'i etkinleştirin."
  exit 1
fi

cd backend

# Bağımlılıkları kontrol et
if [ ! -d "node_modules" ]; then
    echo "📦 Bağımlılıklar yükleniyor..."
    npm install
fi

echo "🚀 Backend başlatılıyor (port: 5001)..."
echo "🌐 API: http://localhost:5001"
echo "📊 Health: http://localhost:5001/health"
echo "====================================="
echo "Durdurmak için: Ctrl+C"

PORT=5001 npm run dev
