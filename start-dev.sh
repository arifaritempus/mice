#!/bin/bash

echo "🚀 EventIQ Geliştirme Ortamı Başlatılıyor..."
echo "================================================"

# Backend'i başlat
echo "📡 Backend başlatılıyor (varsayılan port: 3000)..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!
cd ..

# Frontend'i başlat
echo "⚛️  Frontend başlatılıyor (varsayılan port: 3001)..."
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

echo "================================================"
echo "✅ Servisler başlatıldı!"
echo "🌐 Frontend: http://localhost:3001"
echo "🔌 Backend:  http://localhost:3000"
echo "================================================"
echo "Durdurmak için: Ctrl+C"

# Graceful shutdown
trap "echo '🛑 Servisler durduruluyor...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Servisleri izle
wait
