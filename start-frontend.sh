#!/bin/bash

echo "⚛️  EventIQ Frontend Başlatılıyor..."
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

cd frontend

# Bağımlılıkları kontrol et
if [ ! -d "node_modules" ]; then
    echo "📦 Bağımlılıklar yükleniyor..."
    npm install
fi

echo "🚀 Frontend başlatılıyor (port: 3001)..."
echo "🌐 Web: http://localhost:3001"
echo "🔌 Backend API: http://localhost:5001"
echo "====================================="
echo "Durdurmak için: Ctrl+C"

npm run dev -- -p 3001
