'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  BookOpen, 
  LayoutDashboard, 
  Briefcase, 
  Hotel,
  Truck,
  CreditCard,
  UserCheck
} from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sections = [
  {
    id: 'overview',
    title: 'Genel Bakış',
    icon: LayoutDashboard,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    description: 'Sistemin ana kontrol paneli. Burada yaklaşan operasyonları, istatistikleri ve hızlı işlem kısayollarını görebilirsiniz.',
    tips: ['Grafik ve Liste görünümleri arasında geçiş yapabilirsiniz.', 'Hızlı ara butonu ile her şeye saniyeler içinde ulaşın.']
  },
  {
    id: 'projects',
    title: 'Proje Yönetimi',
    icon: Briefcase,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    description: 'Projelerinizi uçtan uca yönetin. Satış, alış, operasyonel detaylar ve finansal takibi buradan yapın.',
    tips: ['Proje durumlarını güncelleyerek ekibinizi bilgilendirin.', 'Proje içindeki kalemleri Excel\'e aktarabilirsiniz.']
  },
  {
    id: 'sejour',
    title: 'Sejour & Voucher',
    icon: Hotel,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    description: 'Otel rezervasyonları ve misafir voucher işlemlerini yönetin. PDF voucher oluşturma ve paylaşma özellikleri sunar.',
    tips: ['Voucher indirirken temanın beyaz olduğundan emin olun.', 'Otel adres ve iletişim bilgilerini eksiksiz girin.']
  },
  {
    id: 'operations',
    title: 'Operasyonlar',
    icon: Truck,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    description: 'Transfer, uçak bileti, rehber ve part-time personel operasyonlarını organize edin.',
    tips: ['Transfer saatlerini ve plaka bilgilerini sisteme girin.', 'Bilet PNR numaralarını hızlıca kopyalayabilirsiniz.']
  },
  {
    id: 'finance',
    title: 'Finans & Muhasebe',
    icon: CreditCard,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
    description: 'Fatura, ödeme ve tahsilat süreçlerini takip edin. Borç/Alacak durumlarını kontrol altında tutun.',
    tips: ['Ödeme planlarını projelere sadık kalarak oluşturun.', 'Döviz kurlarını güncel tutmayı unutmayın.']
  },
  {
    id: 'hr',
    title: 'İnsan Kaynakları',
    icon: UserCheck,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    description: 'Personel ve rehber atamalarını yönetin. Çalışma saatlerini ve hakedişleri takip edin.',
    tips: ['Rehberlerin kokart geçerlilik sürelerini kontrol edin.', 'Part-time personel listesini güncel tutun.']
  }
];

export default function HelpGuideModal({ isOpen, onClose }: HelpGuideModalProps) {
  const [activeSection, setActiveSection] = useState(sections[0].id);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <div key="help-guide-modal-wrapper" className="fixed inset-0 z-[10000] flex items-center justify-center p-2 md:p-6">
          <motion.div 
            key="help-guide-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div 
            key="help-guide-modal-content"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-4xl h-[80vh] md:h-[600px] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-800"
          >
            {/* Sidebar / Navigation */}
            <div className="w-full md:w-72 bg-slate-50 dark:bg-slate-800/50 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex-shrink-0">
              <div className="p-6 md:p-8 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm">Sistem Rehberi</h2>
                </div>
                
                <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar pb-4 md:pb-0">
                  {sections.map((section) => (
                    <button
                      key={`nav-${section.id}`}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 text-left whitespace-nowrap md:whitespace-normal group ${activeSection === section.id ? 'bg-white dark:bg-slate-900 shadow-md shadow-slate-200/50 dark:shadow-none' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      <div className={`p-2 rounded-lg ${section.bgColor} ${section.color} group-hover:scale-110 transition-transform`}>
                        <section.icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-widest ${activeSection === section.id ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                        {section.title}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-end">
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors group"
                >
                  <X className="w-5 h-5 text-slate-400 group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 overscroll-contain no-scrollbar">
                <AnimatePresence mode="wait">
                  {sections.filter(s => s.id === activeSection).map(section => (
                    <motion.div
                      key={`content-${section.id}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <div className="space-y-4">
                        <div className={`w-16 h-16 rounded-3xl ${section.bgColor} ${section.color} flex items-center justify-center mb-6 shadow-sm`}>
                          <section.icon className="w-8 h-8" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{section.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed font-medium">
                          {section.description}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Önemli İpuçları</h4>
                        <div className="grid gap-3">
                          {section.tips.map((tip, i) => (
                            <div key={`tip-${section.id}-${i}`} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 group hover:border-blue-200 transition-colors">
                              <div className={`mt-1.5 w-1.5 h-1.5 rounded-full ${section.color} bg-current flex-shrink-0`} />
                              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest leading-relaxed">
                                {tip}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-slate-900/10"
                >
                  Anladım, Teşekkürler
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
