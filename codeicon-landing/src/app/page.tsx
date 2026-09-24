import Link from "next/link";
import { ArrowRight, Code2, Sparkles, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 w-full h-[50vh] bg-gradient-to-b from-blue-100 to-transparent -z-10" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />

      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium text-sm mb-8">
          <Sparkles className="w-4 h-4" />
          <span>Yeni Nesil Yönetim Sistemi</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 font-outfit">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Codeicon
          </span>{" "}
          ile İşinizi Geleceğe Taşıyın
        </h1>

        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Turizm, MICE ve etkinlik yönetimi için tasarlanmış modern, hızlı ve akıllı işletim sistemi. 
          Çok yakında yeni arayüzümüzle yayındayız.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto">
            Demoyu İncele
            <ArrowRight className="w-4 h-4" />
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-colors w-full sm:w-auto">
            İletişime Geç
          </button>
        </div>
      </div>

      {/* Feature placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-6 pb-20 w-full">
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Hızlı ve Akıcı</h3>
          <p className="text-sm text-slate-500">En son teknolojilerle geliştirilmiş, anında tepki veren modern altyapı.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <Code2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Modern Mimari</h3>
          <p className="text-sm text-slate-500">Güçlü ve güvenli veritabanı yapısı ile verileriniz her zaman güvende.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Kusursuz Deneyim</h3>
          <p className="text-sm text-slate-500">Kullanıcı dostu arayüz ve akıllı özelliklerle iş süreçlerinizi hızlandırın.</p>
        </div>
      </div>
    </main>
  );
}
