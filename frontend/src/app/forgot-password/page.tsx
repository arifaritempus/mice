'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await authService.resetPassword(email);
      setSuccess(true);
    } catch (error: any) {
      console.error('Şifre sıfırlama hatası:', error);
      setError(error.message || 'Şifre sıfırlama e-postası gönderilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center py-6 sm:px-4 lg:px-6 relative overflow-hidden">
      {/* Dekoratif arka plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-700/20 rounded-full blur-3xl" />
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
            <span className="text-white text-2xl font-bold">
              TT
            </span>
          </div>
        </div>

        {/* Kart */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 px-8 py-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white text-center">Şifremi Unuttum</h1>
            <p className="text-sm text-slate-400 text-center mt-1">
              {success ? 'Sıfırlama bağlantısı gönderildi' : 'Kayıtlı e-posta adresinizi girin'}
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl">
              <span className="text-sm leading-relaxed">{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-5">
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl">
                E-posta adresinize şifre sıfırlama bağlantısı gönderdik. Lütfen gelen kutunuzu kontrol edin.
              </div>
              <Link
                href="/login"
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25 flex items-center justify-center transition-all duration-200"
              >
                Giriş Ekranına Dön
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1.5">
                  E-posta Adresi
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-all duration-200"
                  placeholder="ornek@mail.com"
                />
              </div>

              <div className="flex justify-between items-center">
                <Link
                  href="/login"
                  className="text-xs text-slate-400 hover:text-white transition-colors duration-200"
                >
                  Geri dön
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center"
              >
                {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
