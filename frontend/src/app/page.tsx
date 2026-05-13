'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Hotel, 
  Plane, 
  Truck, 
  Plus, 
  ChevronRight, 
  TrendingUp,
  Clock,
  Briefcase,
  FileText,
  UserCheck,
  ArrowUpRight,
  RefreshCcw,
  Search,
  FilePlus,
  HelpCircle,
  BookOpen,
  Layout,
  Target,
  Settings,
  CreditCard,
  PieChart,
  ArrowLeft,
  X
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  projectsService,
  SejourService,
  projectTransfersService,
  ticketOptionsService,
  projectHumanResourcesService,
  categoriesService
} from '@/lib/supabaseService';
import { 
  Project, 
  Quote as Sejour, 
  ProjectSalesItem as Transfer, 
  QuoteItem as Ticket,
  User as Guide,
  Category
} from '@/lib/supabase';
import { Module, usePermissions } from '@/lib/permissions';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface PartTime extends Guide {}
interface ProjectHumanResource {
  id: string;
  sub_category_id?: string;
  sub_category_name?: string;
  description?: string;
  date?: string;
  created_at?: string;
  hotel?: string;
  amount?: number;
}

interface MappedProject extends Project {
  id: string;
  name: string;
  client_name: string;
  start_date: string;
  status: string;
  reference: string;
  budget: number;
}

interface MappedSejour extends Sejour {
  id: string;
  name: string;
  hotel_name: string;
  guest_count: number;
  total_cost: number;
  start_date: string;
  end_date: string;
  status: string;
  reference: string;
}

interface MappedTransfer {
  id: string;
  type: string;
  pickup_location: string;
  dropoff_location: string;
  date: string;
  guest_count: number;
  cost: number;
  status: string;
}

interface MappedTicket {
  id: string;
  flight_number: string;
  departure: string;
  arrival: string;
  date: string;
  passenger_count: number;
  cost: number;
  status: string;
}

interface MappedGuide {
  id: string;
  name: string;
  service_date: string;
  location: string;
  guest_count: number;
  cost: number;
  status: string;
}

interface MappedPartTime {
  id: string;
  name: string;
  service_date: string;
  location: string;
  hours: number;
  hourly_rate: number;
  status: string;
}

interface DashboardData {
  upcomingProjects: MappedProject[];
  upcomingSejours: MappedSejour[];
  upcomingTransfers: MappedTransfer[];
  upcomingTickets: MappedTicket[];
  upcomingGuides: MappedGuide[];
  upcomingPartTime: MappedPartTime[];
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1'];

// ─── UserManualModal ────────────────────────────────────────────────────────
interface ManualSection {
  id: string;
  title: string;
  icon: any;
  content: React.ReactNode;
}

function UserManualModal({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<'grid' | 'detail'>('grid');
  const [activeTab, setActiveTab] = useState('mice');

  const sections: ManualSection[] = [
    {
      id: 'mice',
      title: 'MICE & Proje Yönetimi',
      icon: Target,
      content: (
        <div className="space-y-8 pb-10">
          <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] text-white shadow-xl shadow-blue-500/20">
            <h4 className="text-lg font-black mb-3">Uçtan Uca Proje Döngüsü</h4>
            <p className="text-xs opacity-90 leading-relaxed italic">Teklif hazırlığından nakit akışına kadar tüm süreçlerin kalbi burasıdır.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="space-y-3">
              <h5 className="text-[10px] font-black uppercase text-blue-600 tracking-widest border-b border-blue-100 pb-2">1. Satış & Paylaşım</h5>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                <p className="text-[11px] font-bold text-slate-900 dark:text-white">Link ile Satış (Online Teklif)</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Oluşturduğunuz teklifleri "Link Oluştur" butonuyla müşteriye özel bir URL olarak gönderebilirsiniz. Müşteri linke tıkladığında profesyonel bir arayüzle karşılaşır.</p>
                <p className="text-[11px] font-bold text-slate-900 dark:text-white mt-4">Excel Entegrasyonu</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Mevcut bütçelerinizi Excel'den import edebilir veya hazırladığınız teklifi tek tıkla Excel formatında indirebilirsiniz.</p>
              </div>
            </section>

            <section className="space-y-3">
              <h5 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest border-b border-emerald-100 pb-2">2. Operasyonel Dönüşüm</h5>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                <p className="text-[11px] font-bold text-slate-900 dark:text-white">Konaklamadan Transfer Oluşturma</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Konaklama listesindeki misafirlerin uçuş detaylarını girdiğinizde, sistem otomatik olarak geliş/gidiş transfer kayıtlarını oluşturur. Manuel veri girişine son!</p>
                <p className="text-[11px] font-bold text-slate-900 dark:text-white mt-4">Excel Misafir Import</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Yüzlerce kişilik misafir listelerini şablon Excel ile saniyeler içinde projeye dahil edebilirsiniz.</p>
              </div>
            </section>

            <section className="space-y-3">
              <h5 className="text-[10px] font-black uppercase text-amber-600 tracking-widest border-b border-amber-100 pb-2">3. Mutabakat & Bildirimler</h5>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                <p className="text-[11px] font-bold text-slate-900 dark:text-white">Link ile Mutabakat</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Tedarikçilere veya müşterilere gönderilen mutabakat linkleri sayesinde taraflar onay verdiğinde bildirimler panelinize anlık düşer.</p>
                <p className="text-[11px] font-bold text-slate-900 dark:text-white mt-4">Sistem Bildirimleri</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Opsiyonu dolan teklifler, onay bekleyen mutabakatlar ve yaklaşan ödemeler için sağ üstteki bildirim zili sizi uyarır.</p>
              </div>
            </section>

            <section className="space-y-3">
              <h5 className="text-[10px] font-black uppercase text-rose-600 tracking-widest border-b border-rose-100 pb-2">4. Finans & Nakit Akış</h5>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                <p className="text-[11px] font-bold text-slate-900 dark:text-white">Tahsilat & Ödeme Planı</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Proje bütçesindeki her kalem için vade ve ödeme tipi belirleyebilirsiniz. Bu veriler anlık olarak "Nakit Akış" tablonuza yansır.</p>
                <p className="text-[11px] font-bold text-slate-900 dark:text-white mt-4">KDV & Kur Farkı Yönetimi</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Dövizli işlemlerde kur farkı faturalarını sistem otomatik hesaplar ve muhasebe modülüne hazır veri olarak sunar.</p>
              </div>
            </section>
          </div>
        </div>
      ),
    },
    {
      id: 'sejour',
      title: 'Sejour & Voucher Otomasyonu',
      icon: Hotel,
      content: (
        <div className="space-y-8 pb-10">
          <div className="p-6 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2rem] text-white shadow-xl shadow-emerald-500/20">
            <h4 className="text-lg font-black mb-3">Misafir Deneyimi Yönetimi</h4>
            <p className="text-xs opacity-90 leading-relaxed italic">Münferit misafirlerin tüm uçuş, otel ve transfer akışını saniyeler içinde planlayın.</p>
          </div>
          <div className="space-y-4">
             <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-[11px] font-bold text-slate-900 dark:text-white">Voucher Link Paylaşımı</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Misafirlerinize özel oluşturulan online Voucher linki sayesinde, misafirler kendi telefonlarından tüm detayları anlık görebilir.</p>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-[11px] font-bold text-slate-900 dark:text-white">Otel Tahsisat (Allotment) Takibi</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Anlaşmalı olduğunuz otellerdeki oda kontenjanlarınızı sisteme girerek doluluk oranlarını anlık izleyebilirsiniz.</p>
             </div>
          </div>
        </div>
      )
    },
    {
      id: 'operation',
      title: 'Operasyon & Saha Yönetimi',
      icon: Truck,
      content: (
        <div className="space-y-12 pb-20">
          <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-800 rounded-[3rem] text-white shadow-2xl shadow-indigo-500/20">
            <h4 className="text-3xl font-black mb-4 tracking-tighter">Saha Operasyon Merkezi</h4>
            <p className="text-base opacity-90 leading-relaxed italic">Transfer, rehber ve personel süreçlerini anlık yönetin.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 hover:border-blue-500/50 transition-colors">
               <h6 className="text-sm font-black text-slate-900 dark:text-white uppercase mb-4 tracking-widest text-blue-600">Rehber & Personel Atama</h6>
               <p className="text-xs text-slate-500 leading-relaxed">Projeye atanan rehberlerin kokart bilgileri, dilleri ve iletişim detayları sistemde hazırdır. Tek tıkla atama yapılır.</p>
            </div>
            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 hover:border-blue-500/50 transition-colors">
               <h6 className="text-sm font-black text-slate-900 dark:text-white uppercase mb-4 tracking-widest text-emerald-600">Transfer Akış Listesi</h6>
               <p className="text-xs text-slate-500 leading-relaxed">Tüm uçuş verileri günlük operasyon listesine akar. Araç tipi ve plaka atamaları buradan yapılır.</p>
            </div>
          </div>
          <div className="p-8 bg-slate-900 text-white rounded-[2.5rem]">
             <h6 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Operasyonel Kritikler</h6>
             <ul className="space-y-2">
                {['Araç plakası girilmeden transfer fişi basılamaz.', 'Rehber ataması yapıldığında rehberin telefonuna anlık SMS/Bildirim gider.'].map((t, i) => (
                  <li key={i} className="text-xs flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" /> {t}
                  </li>
                ))}
             </ul>
          </div>
        </div>
      )
    },
    {
      id: 'accounting',
      title: 'Muhasebe & Faturalar',
      icon: CreditCard,
      content: (
        <div className="space-y-12 pb-20">
          <div className="p-8 bg-gradient-to-br from-rose-600 to-pink-800 rounded-[3rem] text-white shadow-2xl shadow-rose-500/20">
            <h4 className="text-3xl font-black mb-4 tracking-tighter">Finansal Takip Merkezi</h4>
            <p className="text-base opacity-90 leading-relaxed italic">Faturalar, ödemeler ve nakit akışı kontrolünüz altında.</p>
          </div>
          <div className="space-y-6">
             <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
                <p className="text-sm font-black text-slate-900 dark:text-white mb-2">Fatura Kesme Süreci</p>
                <p className="text-xs text-slate-500 leading-relaxed">Konfirme olan projelerin bütçeleri otomatik olarak "Fatura Bekleyenler" listesine düşer. Kısmi veya tam fatura kesebilirsiniz.</p>
             </div>
             <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
                <p className="text-sm font-black text-slate-900 dark:text-white mb-2">Banka & Kasa Entegrasyonu</p>
                <p className="text-xs text-slate-500 leading-relaxed">Yapılan tahsilatlar doğrudan banka/kasa bakiyelerinize işlenir ve mali raporlara yansır.</p>
             </div>
          </div>
          <div className="p-8 bg-rose-50 dark:bg-rose-950/40 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/50">
             <h6 className="text-[11px] font-black uppercase tracking-widest mb-4 text-rose-600">Nakit Akış Otomasyonu</h6>
             <p className="text-xs text-slate-600 dark:text-slate-400">Teklif kalemlerine girdiğiniz her tahsilat/ödeme tarihi, Muhasebe modülündeki "Nakit Akış" takvimine anlık olarak düşer. Bu sayede ay sonunda kasanızda ne kadar nakit olacağını bugünden görebilirsiniz.</p>
          </div>
        </div>
      )
    },
    {
      id: 'reports',
      title: 'Raporlama Sistemi',
      icon: PieChart,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800">
            <h4 className="text-sm font-black text-amber-900 dark:text-amber-100 mb-2">Veri Analizi</h4>
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              Sistemdeki en kritik raporlar "Otel Detaylı Teklif" ve "Otel Detaylı Proje Maliyet" raporlarıdır.
            </p>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border-l-4 border-amber-500 shadow-sm">
              <h6 className="text-xs font-bold text-slate-900 dark:text-white">Otel Bazlı Ayrıştırma</h6>
              <p className="text-[11px] text-slate-500 mt-1">Gelişmiş SQL algoritmamız sayesinde, tek bir teklif içinde 5 farklı otel olsa bile rapor her oteli kendi check-in/out tarihi ve durumuyla (İptal/Konfirme) ayrı satırlarda gösterir.</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border-l-4 border-blue-500 shadow-sm">
              <h6 className="text-xs font-bold text-slate-900 dark:text-white">Proje Maliyet Raporu</h6>
              <p className="text-[11px] text-slate-500 mt-1">Her proje kaleminin gerçek maliyeti ile satış fiyatını karşılaştırarak otel bazlı karlılık analizi yapmanızı sağlar.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'faq',
      title: 'Sıkça Sorulan Sorular (SSS)',
      icon: HelpCircle,
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
             {[
               { q: 'Otel detaylı rapor boş geliyor, neden?', a: 'Teklif kalemlerinde ana kategori olarak "OTEL | KONAKLAMA" veya "OTEL | DİĞER HİZMETLER" seçili olduğundan emin olun. Diğer kategoriler bu rapora yansımaz.' },
               { q: 'Hatalı fiyat girişi yaptım, nasıl düzeltirim?', a: 'Teklif listesinden ilgili kaydı seçip "Düzenle" diyerek bütçe kalemlerini güncelleyebilir ve "Kaydet" diyerek veritabanını senkronize edebilirsiniz.' },
               { q: 'Otel durumu (İptal/Konfirme) neden raporda yanlış?', a: 'Otel sekmelerindeki "Otel Durumu" seçeneğini güncellediğinizden emin olun. Rapor, teklifin genel durumundan ziyade her otelin kendi "hotel_status" verisini okur.' },
               { q: 'Yeni bir acente veya otel ekleyebilir miyim?', a: 'Sol menüdeki "Acenteler" veya "Oteller" modüllerinden yetkiniz dahilinde yeni tanımlamalar yapabilirsiniz.' }
             ].map((item, i) => (
               <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                 <h6 className="text-xs font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {item.q}
                 </h6>
                 <p className="text-[11px] text-slate-500 leading-relaxed">{item.a}</p>
               </div>
             ))}
          </div>
          <div className="p-4 bg-indigo-600 text-white rounded-2xl text-center shadow-lg shadow-indigo-500/20">
             <p className="text-[10px] font-black uppercase tracking-widest mb-1">Hala Sorun Mu Yaşıyorsunuz?</p>
             <p className="text-[11px] opacity-90">Sistem yöneticinizle veya teknik destek ekibiyle "Destek Hattı" üzerinden iletişime geçin.</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-3xl animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-7xl h-[90vh] rounded-[4rem] shadow-[0_40px_120px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden flex flex-col relative"
      >
        {/* Close Button - Premium Floating X */}
        <button 
          onClick={onClose}
          className="absolute top-12 right-12 z-[250] p-5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-full transition-all hover:scale-110 active:scale-90 hover:rotate-90 shadow-2xl"
        >
          <X className="w-7 h-7" />
        </button>

        <AnimatePresence mode="wait">
          {view === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 p-16 lg:p-24 overflow-y-auto custom-scrollbar"
            >
              <div className="text-center mb-20">
                <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 mx-auto mb-8">
                  <BookOpen className="w-10 h-10" />
                </div>
                <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">SİSTEM ANSİKLOPEDİSİ</h1>
                <p className="text-slate-400 font-bold uppercase tracking-[0.3em]">Hangi modülü öğrenmek istersiniz?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveTab(section.id);
                      setView('detail');
                    }}
                    className="group relative p-10 bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] border border-slate-100 dark:border-slate-700 text-left transition-all duration-500 hover:scale-[1.05] hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl hover:shadow-blue-500/20 active:scale-95"
                  >
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white dark:bg-slate-900 flex items-center justify-center mb-8 shadow-lg group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                      <section.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{section.title}</h3>
                    <p className="text-[12px] text-slate-500 leading-relaxed font-medium">Modülün tüm detaylarını, otomasyon süreçlerini ve kritik özelliklerini keşfedin.</p>
                    <div className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-all">
                      <ChevronRight className="w-6 h-6 text-blue-600" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="flex-1 flex flex-col h-full bg-white dark:bg-[#0f172a]"
            >
              {/* Detail Header */}
              <div className="h-32 border-b border-slate-100 dark:border-slate-800 px-16 flex items-center shrink-0">
                <button 
                  onClick={() => setView('grid')}
                  className="flex items-center gap-3 text-slate-500 hover:text-blue-600 font-black uppercase text-xs tracking-widest group"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" /> ANA MENÜYE DÖN
                </button>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-16 lg:p-24 custom-scrollbar">
                <div className="max-w-5xl">
                   <div className="flex items-center gap-6 mb-16">
                      <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                        {React.createElement(sections.find(s => s.id === activeTab)?.icon || Target, { className: "w-10 h-10" })}
                      </div>
                      <div>
                        <h1 className="text-6xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2 uppercase">
                          {sections.find(s => s.id === activeTab)?.title}
                        </h1>
                        <p className="text-blue-600 font-black uppercase tracking-[0.4em] text-sm">Kapsamlı Kullanım Klavuzu</p>
                      </div>
                   </div>

                   <div className="prose prose-2xl prose-slate dark:prose-invert max-w-none">
                     {sections.find(s => s.id === activeTab)?.content}
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function HomePage() {
  const { canCreate, loading: permissionsLoading } = usePermissions();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    upcomingProjects: [],
    upcomingSejours: [],
    upcomingTransfers: [],
    upcomingTickets: [],
    upcomingGuides: [],
    upcomingPartTime: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('activity');
  const [showManual, setShowManual] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [projectsRes, sejoursRes, ticketsRes, categoriesRes] = await Promise.allSettled([
        projectsService.getAll(),
        SejourService.getSejours(),
        ticketOptionsService.getAll(),
        categoriesService.getAll()
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

      const filterUpcoming = <T,>(items: T[], dateField: string): T[] => {
        return items.filter(item => {
          const i = item as any;
          const dateVal = (i[dateField] || i['start_date'] || i['check_in_date'] || i['transfer_date'] || i['flight_date'] || i['service_date'] || i['date']) as string;
          if (!dateVal) return false;
          const itemDate = new Date(dateVal);
          return itemDate >= today && itemDate <= thirtyDaysFromNow;
        }).sort((a, b) => {
          const ai = a as any;
          const bi = b as any;
          const aDateStr = (ai[dateField] || ai['start_date'] || ai['check_in_date'] || ai['transfer_date'] || ai['flight_date'] || ai['service_date'] || ai['date']) as string;
          const bDateStr = (bi[dateField] || bi['start_date'] || bi['check_in_date'] || bi['transfer_date'] || bi['flight_date'] || bi['service_date'] || bi['date']) as string;
          const aDate = new Date(aDateStr).getTime();
          const bDate = new Date(bDateStr).getTime();
          return aDate - bDate;
        }).slice(0, 5);
      };

      const projects = projectsRes.status === 'fulfilled' ? (projectsRes.value as Project[]) : [];
      const mappedProjects: MappedProject[] = projects.map(p => ({
        ...p,
        name: p.title || 'Proje',
        client_name: p.description?.slice(0, 20) || 'Müşteri',
        id: p.id,
        status: p.status || 'active',
        reference: p.reference || '',
        budget: p.budget || 0,
        start_date: p.start_date || ''
      }));

      const sejoursRaw = sejoursRes.status === 'fulfilled' ? sejoursRes.value : [];
      const sejours = (Array.isArray(sejoursRaw) ? sejoursRaw : ((sejoursRaw as { data?: Sejour[] }).data || [])) as any[];
      const mappedSejours: MappedSejour[] = sejours.map(s => ({
        ...s,
        name: s.voucherNumber || s.voucher_number || s.customerName || s.customer_name || 'Sejour',
        start_date: s.checkInDate || s.check_in_date || '',
        end_date: s.checkOutDate || s.check_out_date || '',
        hotel_name: s.rooms?.[0]?.hotelName || s.hotel_name || '',
        guest_count: s.rooms?.length || 0,
        total_cost: s.totalAmount || s.total_amount || 0
      }));

      // Project Transfers
      const activeProjects = mappedProjects.filter(p => (p.status || '').toLowerCase() === 'active');
      const transferBuckets = await Promise.all(
        activeProjects.map(p => projectTransfersService.getByProjectId(p.id).catch(() => []))
      );
      const projectTransfers: MappedTransfer[] = (transferBuckets.flat() as Transfer[]).map(t => {
        const item = t as any;
        return {
          id: item.id,
          type: item.service_type || item.transfer_type || 'Transfer',
          pickup_location: item.pickup_location || '',
          dropoff_location: item.dropoff_location || '',
          date: item.date || item.transfer_date || '',
          guest_count: item.passenger_count || 0,
          cost: item.cost_amount || 0,
          status: item.status || 'confirmed'
        };
      });

      // Sejour Transfers
      const sejourTransfers: MappedTransfer[] = sejours.flatMap(s => (s.transfers || []).map((t: any) => ({
        id: t.id,
        type: t.type || t.transferType || 'Sejour Transfer',
        pickup_location: t.direction === 'arrival' ? 'Havalimanı' : (t.routeDescription || 'Otel'),
        dropoff_location: t.direction === 'arrival' ? (t.routeDescription || 'Otel') : 'Havalimanı',
        date: t.date || s.check_in_date || s.checkInDate || '',
        guest_count: t.paxCount || 0,
        cost: t.price || 0,
        status: 'confirmed'
      })));

      const allTransfers: MappedTransfer[] = [...projectTransfers, ...sejourTransfers];

      // Project HR
      const hrBuckets = await Promise.all(
        activeProjects.map(p => projectHumanResourcesService.getByProjectId(p.id).catch(() => []))
      );
      const hrRows = hrBuckets.flat() as ProjectHumanResource[];

      const categories = categoriesRes.status === 'fulfilled' ? (categoriesRes.value as { id: string; name: string }[]) : [];
      const categoryById: Record<string, { id: string; name: string }> = {};
      categories.forEach(c => { categoryById[c.id] = c; });

      const mappedGuides = hrRows
        .filter(r => {
          const n = (categoryById[r.sub_category_id || '']?.name || r.sub_category_name || '').toString().toLowerCase();
          return n.includes('rehber') || n.includes('guide');
        })
        .map(r => ({
          id: r.id,
          name: r.description || 'Kokartli Rehber',
          service_date: r.date || r.created_at || '',
          location: r.hotel || '',
          guest_count: 0,
          cost: r.amount || 0,
          status: 'confirmed'
        }));

      const mappedPartTime = hrRows
        .filter(r => {
          const n = (categoryById[r.sub_category_id || '']?.name || r.sub_category_name || '').toString().toLowerCase();
          return (n.includes('part') && n.includes('time')) || n.includes('yari zamanli') || n.includes('insan kaynak');
        })
        .map(r => ({
          id: r.id,
          name: r.description || 'Part-Time',
          service_date: r.date || r.created_at || '',
          location: r.hotel || '',
          hours: 0,
          hourly_rate: 0,
          status: 'confirmed'
        } as MappedPartTime));

      // Sejour Extras (Guides & Part-Time)
      const sejourExtras = sejours.flatMap(s => (s.extraServices || []).map((e: any) => {
        const n = (e.serviceTypeName || '').toLowerCase();
        const isGuide = n.includes('rehber') || n.includes('guide');
        const isPartTime = (n.includes('part') && n.includes('time')) || n.includes('yari zamanli') || n.includes('insan kaynak');

        return {
          id: e.id,
          name: e.serviceName || e.serviceTypeName || 'Ek Hizmet',
          service_date: s.checkInDate || s.check_in_date || '',
          location: e.supplierName || '',
          cost: e.price || 0,
          status: 'confirmed',
          isGuide,
          isPartTime
        };
      }));

      const allGuides: MappedGuide[] = [...mappedGuides, ...sejourExtras.filter(e => e.isGuide).map(e => ({
        id: e.id,
        name: e.name,
        service_date: (e as any).date || '',
        location: (e as any).hotel || '',
        guest_count: 0,
        cost: (e as any).amount || 0,
        status: e.status
      }))];

      const allPartTime: MappedPartTime[] = [...mappedPartTime, ...sejourExtras.filter(e => e.isPartTime).map(e => ({
        id: e.id,
        name: e.name,
        service_date: (e as any).date || '',
        location: (e as any).hotel || '',
        hours: 0,
        hourly_rate: 0,
        status: e.status
      }))];

      // Tickets (Project Options + Sejour Flights)
      const tickets = ticketsRes.status === 'fulfilled' ? (ticketsRes.value as Ticket[]) : [];
      const mappedTickets: MappedTicket[] = tickets.map(t => ({
        id: t.id,
        flight_number: (t as any).flight_number || (t as any).flight_no || '',
        departure: (t as any).departure || '',
        arrival: (t as any).arrival || '',
        date: (t as any).service_date || (t as any).date || '',
        passenger_count: (t as any).unit_quantity || 1,
        cost: (t as any).total_price || 0,
        status: 'confirmed'
      }));

      const sejourFlights: MappedTicket[] = sejours.flatMap(s => (s.flights || []).map((f: any) => ({
        id: f.id,
        flight_number: f.flightNo || '',
        departure: f.departurePort || '',
        arrival: f.arrivalPort || '',
        date: f.date || s.check_in_date || s.checkInDate || '',
        passenger_count: f.paxCount || 0,
        cost: f.price || 0,
        status: 'confirmed'
      })));

      const allTickets: MappedTicket[] = [...mappedTickets, ...sejourFlights];

      setDashboardData({
        upcomingProjects: filterUpcoming(mappedProjects, 'start_date'),
        upcomingSejours: filterUpcoming(mappedSejours, 'start_date'),
        upcomingTransfers: filterUpcoming(allTransfers, 'date'),
        upcomingTickets: filterUpcoming(allTickets, 'date'),
        upcomingGuides: filterUpcoming(allGuides, 'service_date'),
        upcomingPartTime: filterUpcoming(allPartTime, 'service_date')
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Dashboard data yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const chartData = useMemo(() => [
    { name: 'Projeler', count: dashboardData.upcomingProjects.length, color: COLORS[0] },
    { name: 'Sejourlar', count: dashboardData.upcomingSejours.length, color: COLORS[1] },
    { name: 'Transferler', count: dashboardData.upcomingTransfers.length, color: COLORS[2] },
    { name: 'Biletler', count: dashboardData.upcomingTickets.length, color: COLORS[3] },
    { name: 'Rehberler', count: dashboardData.upcomingGuides.length, color: COLORS[4] },
    { name: 'Part-Time', count: dashboardData.upcomingPartTime.length, color: COLORS[5] },
  ].filter(d => d.count > 0), [dashboardData]);

  const stats = useMemo(() => [
    { label: 'Aktif Projeler', value: dashboardData.upcomingProjects.length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Bekleyen Sejourlar', value: dashboardData.upcomingSejours.length, icon: Hotel, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Bugünkü Transferler', value: dashboardData.upcomingTransfers.length, icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Personel Talepleri', value: dashboardData.upcomingPartTime.length, icon: Users, color: 'text-rose-600', bg: 'bg-rose-50' },
  ], [dashboardData]);

  if (permissionsLoading) return <LoadingSpinner message="Sistem hazırlanıyor..." />;

  const DashboardCard = ({ title, icon: Icon, children, link, color }: { title: string; icon: React.ElementType; children: React.ReactNode; link: string; color: string }) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full group hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider">{title}</h3>
        </div>
        <Link href={link} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>
      <div className="p-4 flex-1 space-y-2">
        {children}
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mb-3">
        <Clock className="w-5 h-5 text-slate-300" />
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Yakın zamanda kayıt bulunmuyor</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] p-4 md:p-6 lg:p-8 font-sans selection:bg-blue-100 selection:text-blue-900 transition-colors duration-500 flex flex-col">
      
      {/* Premium Header Section */}
      <header className="w-full mb-8 flex flex-col gap-4 text-left">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-3 mb-1">
            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <RefreshCcw className="w-2.5 h-2.5 animate-spin-slow" />
              Son Güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            Ana Sayfa
          </h1>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-wrap gap-2 justify-start"
        >
          {canCreate(Module.QUOTES) && (
            <Link href="/quotes/create" className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-slate-900/10 dark:shadow-white/5">
              <FilePlus className="w-3.5 h-3.5" />
              Yeni Teklif
            </Link>
          )}
          {canCreate(Module.SEJOUR) && (
            <Link href="/sejour/create" className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-5 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all shadow-sm">
              <Hotel className="w-3.5 h-3.5 text-blue-600" />
              Yeni Sejour
            </Link>
          )}
        </motion.div>
      </header>

      <main className="w-full flex-1 flex flex-col space-y-12">
        {/* Loading overlay for data refresh */}
        {loading && !dashboardData.upcomingProjects.length && (
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner message="Veriler yükleniyor..." compact />
          </div>
        )}

        {!loading && (
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:border-blue-200 dark:hover:border-slate-700 transition-all duration-300 group"
                >
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-105 transition-transform duration-500`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Section 1: Aktif Akış (Cards) */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase text-xs">Aktif Akış</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Dashboard Cards for different modules */}
                <DashboardCard title="Yaklaşan Projeler" icon={Briefcase} link="/projects" color="text-blue-600">
                  {dashboardData.upcomingProjects.length > 0 ? dashboardData.upcomingProjects.map((p, i) => (
                    <div key={`project-${p.id}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{p.client_name}</p>
                      </div>
                      <span className="text-[10px] font-black text-blue-600 whitespace-nowrap">{new Date(p.start_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  )) : <EmptyState />}
                </DashboardCard>

                <DashboardCard title="Sejour & Konaklama" icon={Hotel} link="/sejour" color="text-emerald-600">
                  {dashboardData.upcomingSejours.length > 0 ? dashboardData.upcomingSejours.map((s, i) => (
                    <div key={`sejour-${s.id}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{s.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{s.hotel_name}</p>
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 whitespace-nowrap">{new Date(s.start_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  )) : <EmptyState />}
                </DashboardCard>

                <DashboardCard title="Transferler" icon={Truck} link="/operations/transfers" color="text-indigo-600">
                  {dashboardData.upcomingTransfers.length > 0 ? dashboardData.upcomingTransfers.map((t, i) => (
                    <div key={`transfer-${t.id}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{t.pickup_location} → {t.dropoff_location}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{t.type}</p>
                      </div>
                      <span className="text-[10px] font-black text-indigo-600 whitespace-nowrap">{new Date(t.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  )) : <EmptyState />}
                </DashboardCard>

                <DashboardCard title="Uçuş & Biletler" icon={Plane} link="/tickets/options" color="text-amber-600">
                  {dashboardData.upcomingTickets.length > 0 ? dashboardData.upcomingTickets.map((t, i) => (
                    <div key={`ticket-${t.id}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{t.flight_number}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{t.passenger_count} Yolcu</p>
                      </div>
                      <span className="text-[10px] font-black text-amber-600 whitespace-nowrap">{new Date(t.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  )) : <EmptyState />}
                </DashboardCard>

                <DashboardCard title="PERSONEL PLANLAMASI" icon={Users} link="/operations/part-time" color="text-rose-600">
                  {dashboardData.upcomingPartTime.length > 0 ? dashboardData.upcomingPartTime.map((p, i) => (
                    <div key={`pt-${p.id}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{p.location}</p>
                      </div>
                      <span className="text-[10px] font-black text-rose-600 whitespace-nowrap">{new Date(p.service_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  )) : <EmptyState />}
                </DashboardCard>

                <DashboardCard title="KOKARTLI REHBERLER" icon={UserCheck} link="/operations/guides" color="text-purple-600">
                  {dashboardData.upcomingGuides.length > 0 ? dashboardData.upcomingGuides.map((g, i) => (
                    <div key={`guide-${g.id}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{g.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{g.location}</p>
                      </div>
                      <span className="text-[10px] font-black text-purple-600 whitespace-nowrap">{new Date(g.service_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  )) : <EmptyState />}
                </DashboardCard>
              </div>
            </div>

            {/* Section 2: Genel Bakış (Overview) */}
            <div className="space-y-6 pt-8 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase text-xs">Genel Bakış</h2>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Visual Analytics */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 h-fit">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase text-xs mb-1">Operasyonel Dağılım</h2>
                      <p className="text-[10px] text-slate-500 font-medium italic">Gelecek 30 günlük planlanan işlemler</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+12% Artış</span>
                    </div>
                  </div>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fontWeight: 800, fill: '#64748b' }}
                          dy={10}
                        />
                        <YAxis hide />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{payload[0].payload.name}</p>
                                  <p className="text-base font-black text-slate-900 dark:text-white">{payload[0].value} Kayıt</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={35}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Quick Actions / Shortcut Cards */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                    <h3 className="text-xl font-black tracking-tight mb-3 leading-tight">İşinizi <br/>Kolaylaştırın</h3>
                    <p className="text-blue-100 text-[10px] font-medium mb-6 leading-relaxed">Hızlı işlem panelini kullanarak saniyeler içerisinde yeni kayıtlar oluşturabilirsiniz.</p>
                    <div className="grid grid-cols-2 gap-2">
                      {canCreate(Module.QUOTES) && (
                        <Link href="/quotes/create" className="p-3 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition-colors flex flex-col gap-2">
                          <Plus className="w-4 h-4" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Teklif</span>
                        </Link>
                      )}
                      {canCreate(Module.SEJOUR) && (
                        <Link href="/sejour/create" className="p-3 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition-colors flex flex-col gap-2">
                          <Hotel className="w-4 h-4" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Sejour</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h3 className="font-black text-slate-900 dark:text-white tracking-tight uppercase text-[10px] mb-4">Hızlı Erişim</h3>
                    <div className="space-y-2">
                      <Link href="/reports" className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group hover:bg-blue-600 transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <FileText className="w-3.5 h-3.5 text-blue-600 group-hover:text-white" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 group-hover:text-white">Raporlar</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-white" />
                      </Link>
                      <Link href="/users" className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group hover:bg-emerald-600 transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 group-hover:text-white">Kullanıcılar</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-white" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modern Footer with Help Button */}
      <footer className="w-full mt-20 pt-12 pb-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 shadow-xl">
               <Settings className="w-5 h-5 animate-spin-slow" />
             </div>
             <div>
               <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">TEMPUS MICE SYSTEM</p>
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Management Portal v3.5</p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowManual(true)}
            className="group flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-3xl hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500"
          >
            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-500">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-0.5">SİSTEM KILAVUZU</p>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Nasıl Kullanılır?</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="flex items-center gap-8 text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <span className="hover:text-blue-600 transition-colors cursor-pointer">Gizlilik Politikası</span>
          <span className="hover:text-blue-600 transition-colors cursor-pointer">Destek Hattı</span>
          <span className="text-slate-200 dark:text-slate-800">|</span>
          <span className="text-slate-500">© 2024 TEMPUS</span>
        </div>
      </footer>

      {/* Manual Modal Overlay */}
      <AnimatePresence>
        {showManual && (
          <UserManualModal onClose={() => setShowManual(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
