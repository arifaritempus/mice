"use client";

import Link from 'next/link';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-400">404</h1>
        <h2 className="text-xl font-semibold mt-3">Sayfa Bulunamadı</h2>
        <p className="text-sm text-gray-400 mt-1">Aradığınız sayfa mevcut değil.</p>
        <a 
          href="/"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 text-sm"
        >
          Ana Sayfaya Dön
        </a>
      </div>
    </div>
  )
} 