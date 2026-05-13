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
  X,
  Menu,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronDown,
  Hash
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

// ─── Documentation UI Components ──────────────────────────────────────────

const AlertBox = ({ type, title, children }: { type: 'tip' | 'warning' | 'critical', title: string, children: React.ReactNode }) => {
  const styles = {
    tip: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-900 dark:text-blue-100', icon: Info, iconColor: 'text-blue-500' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-900 dark:text-amber-100', icon: AlertTriangle, iconColor: 'text-amber-500' },
    critical: { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-900 dark:text-rose-100', icon: AlertCircle, iconColor: 'text-rose-500' }
  };
  const s = styles[type];
  return (
    <div className={`${s.bg} ${s.border} border-l-4 p-4 rounded-xl my-6 flex gap-4 animate-in slide-in-from-left duration-500`}>
      <s.icon className={`w-6 h-6 shrink-0 ${s.iconColor}`} />
      <div>
        <h6 className={`text-sm font-black uppercase tracking-widest mb-1 ${s.text}`}>{title}</h6>
        <div className={`text-xs leading-relaxed opacity-90 ${s.text}`}>{children}</div>
      </div>
    </div>
  );
};

const StepCard = ({ number, title, children }: { number: string, title: string, children: React.ReactNode }) => (
  <div className="relative pl-12 pb-12 last:pb-0 group">
    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-xs z-10 shadow-lg group-hover:scale-110 transition-transform">
      {number}
    </div>
    <div className="absolute left-4 top-8 bottom-0 w-px bg-slate-200 dark:bg-slate-800 group-last:hidden" />
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm group-hover:border-blue-500/50 transition-colors">
      <h5 className="text-sm font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight">{title}</h5>
      <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{children}</div>
    </div>
  </div>
);

const ScreenshotFrame = ({ caption, children }: { caption: string, children?: React.ReactNode }) => (
  <div className="my-8 space-y-3">
    <div className="rounded-2xl border-4 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 aspect-video flex items-center justify-center relative overflow-hidden group">
      {children || <div className="text-[10px] font-black uppercase tracking-widest opacity-20">Sistem Ekran Görüntüsü</div>}
      <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
         <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
            <Search className="w-6 h-6" />
         </div>
      </div>
    </div>
    <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{caption}</p>
  </div>
);

function UserManualModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('mice-teklif');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    {
      id: 'mice',
      title: 'MICE & Proje Yönetimi',
      icon: Target,
      items: [
        { id: 'mice-teklif', title: 'Teklif Oluşturma' },
        { id: 'mice-link', title: 'Link ile Gönderim & Onay' },
        { id: 'mice-proje', title: 'Projeye Dönüştürme' },
        { id: 'mice-detay', title: 'Proje Detay Yönetimi' },
        { id: 'mice-finans', title: 'Finansal & Nakit Akış' }
      ]
    },
    {
      id: 'sejour',
      title: 'Sejour & Voucher',
      icon: Hotel,
      items: [
        { id: 'sejour-ops', title: 'Operasyon Akışı' },
        { id: 'sejour-voucher', title: 'Online Voucher' }
      ]
    },
    {
      id: 'operation',
      title: 'Saha Operasyonu',
      icon: Truck,
      items: [
        { id: 'ops-transfer', title: 'Transfer Listeleri' },
        { id: 'ops-guide', title: 'Rehber & Personel' }
      ]
    },
    {
      id: 'accounting',
      title: 'Muhasebe',
      icon: CreditCard,
      items: [
        { id: 'acc-invoice', title: 'Fatura Yönetimi' },
        { id: 'acc-cash', title: 'Kasa & Banka' }
      ]
    }
  ];

  const filteredNavigation = navigation.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.items.length > 0);

  const getContent = () => {
    switch(activeTab) {
      case 'mice-teklif':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Teklif Oluşturma Rehberi</h1>
            <p className="text-lg text-slate-500 leading-relaxed">MICE departmanının ilk adımı, profesyonel ve hatasız bir teklif hazırlamaktır.</p>
            
            <AlertBox type="tip" title="Hızlı Başlangıç">
              Daha önceki bir teklifi kopyalayarak saniyeler içinde yeni bir versiyon oluşturabilirsiniz.
            </AlertBox>

            <div className="space-y-0">
              <StepCard number="01" title="Temel Bilgileri Girin">
                Acente, Müşteri, Proje Adı ve tarih aralıklarını belirleyin. Bu aşamada seçilen döviz tipi tüm bütçeyi etkiler.
              </StepCard>
              <StepCard number="02" title="Bütçe Kalemlerini Ekleyin">
                Otel, Transfer, Uçak Bileti gibi kategorilerden hizmetleri seçin. Maliyet ve Satış fiyatlarını girerken sistem anlık kar marjını gösterir.
              </StepCard>
              <StepCard number="03" title="Gruplandırma Yapın">
                Bütçe kalemlerini 'Otel Konaklama', 'Transferler' gibi gruplara ayırarak müşteriye daha derli toplu bir sunum yapın.
              </StepCard>
            </div>

            <ScreenshotFrame caption="Teklif Düzenleme Paneli Görünümü" />
          </div>
        );
      case 'mice-link':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Link ile Gönderim & Onay</h1>
            <p className="text-lg text-slate-500 leading-relaxed">Tekliflerinizi PDF yerine interaktif bir link olarak müşteriye sunun.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                <h6 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-2">Gönderim Süreci</h6>
                <p className="text-xs text-slate-500 leading-relaxed">"Link Oluştur" butonuna bastığınızda, o teklife özel bir URL üretilir. Bu linki WhatsApp veya E-posta ile paylaşabilirsiniz.</p>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                <h6 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">Müşteri Onayı</h6>
                <p className="text-xs text-slate-500 leading-relaxed">Müşteri linke girdiğinde 'Onayla' veya 'İptal' butonlarını görür. Bir işlem yaptığında panelinize anlık bildirim düşer.</p>
              </div>
            </div>

            <AlertBox type="warning" title="Güvenlik Uyarısı">
              Onaylanan bir teklif üzerinde fiyat değişikliği yapılamaz. Değişiklik için teklifi tekrar 'Taslak' durumuna çekmeniz gerekir.
            </AlertBox>
          </div>
        );
      case 'mice-proje':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Projeye Dönüştürme</h1>
            <p className="text-lg text-slate-500 leading-relaxed">Onaylanan teklifleri operasyonel sürece dahil etmek için tek tıkla projeye dönüştürün.</p>

            <div className="space-y-0">
              <StepCard number="01" title="Onay Durumunu Kontrol Edin">
                Müşteri link üzerinden veya manuel olarak teklifi onayladığında "Projeye Dönüştür" butonu aktifleşir.
              </StepCard>
              <StepCard number="02" title="Operasyonel Filtreleme">
                Projeye dönüştürürken hangi kalemlerin operasyona aktarılacağını seçebilirsiniz (Örn: Sadece Konaklama ve Transfer).
              </StepCard>
              <StepCard number="03" title="Referans Numarası">
                Sistem projeye otomatik bir referans numarası atar ve bu numara tüm fatura/operasyon süreçlerinde ana takip kodu olur.
              </StepCard>
            </div>
          </div>
        );
      case 'mice-detay':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Proje Detay Yönetimi</h1>
            <p className="text-lg text-slate-500 leading-relaxed">Proje içinde her departman kendi sekmesini yönetir.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {[
                 { t: 'Konaklama & Otel', d: 'Otel giriş-çıkış tarihleri, oda tipleri ve opsiyon takibi yapılır.' },
                 { t: 'Uçak Bileti', d: 'Pazarlama departmanından gelen opsiyonlu uçuşlar burada listelenir.' },
                 { t: 'Transfer & Tur', d: 'Konaklama listesinden otomatik transfer üretme motoru burada çalışır.' },
                 { t: 'Etkinlik & Aktivite', d: 'Gala yemekleri, dış mekan aktiviteleri ve ekipman talepleri yönetilir.' },
                 { t: 'İnsan Kaynakları', d: 'Rehber, Hostes ve part-time personel atamaları bu sekmededir.' }
               ].map((item, i) => (
                 <div key={i} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <h6 className="text-[11px] font-black uppercase text-blue-600 mb-1">{item.t}</h6>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{item.d}</p>
                 </div>
               ))}
            </div>

            <AlertBox type="tip" title="Otomatik Transfer">
               Konaklama sekmesindeki misafirlerin uçuş saatlerini girdiğinizde, sistem otomatik olarak "Transfer" sekmesine kayıt atar ve araç ataması için operasyonu uyarır.
            </AlertBox>
          </div>
        );
      case 'mice-finans':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Finansal & Nakit Akış</h1>
            <p className="text-lg text-slate-500 leading-relaxed">Operasyonel başarınızı finansal verilere dönüştürün.</p>

            <div className="space-y-4">
               <div className="flex items-start gap-4 p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-black uppercase tracking-tight mb-1">Nakit Akışa Akış</h5>
                    <p className="text-[11px] opacity-70 leading-relaxed">Girdiğiniz her tahsilat ve ödeme vadesi, Muhasebe &gt; Nakit Akış tablosuna anlık olarak işlenir. Ay sonu kasanızı bugünden görebilirsiniz.</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl border border-emerald-100 dark:border-emerald-800">
                  <h6 className="text-xs font-black text-emerald-900 dark:text-emerald-100 uppercase mb-2">Tahsilatlar</h6>
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-200">Müşteriden gelecek ödemeleri proje kalemlerine göre vadelendirin.</p>
               </div>
               <div className="p-6 bg-rose-50 dark:bg-rose-900/20 rounded-3xl border border-rose-100 dark:border-rose-800">
                  <h6 className="text-xs font-black text-rose-900 dark:text-rose-100 uppercase mb-2">Ödemeler</h6>
                  <p className="text-[10px] text-rose-800 dark:text-rose-200">Tedarikçilere yapılacak ödemeleri bütçe bazlı takip edin.</p>
               </div>
            </div>

            <AlertBox type="critical" title="Kritik Veri">
               Vadesi girilmeyen tahsilatlar Nakit Akış tablosunda görünmez. Her kalem için mutlaka bir ödeme tarihi belirleyin.
            </AlertBox>
          </div>
        );
      case 'sejour-ops':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Sejour Operasyon Akışı</h1>
            <p className="text-lg text-slate-500 leading-relaxed">Münferit misafirlerin uçtan uca yönetimi.</p>
            
            <div className="space-y-0">
              <StepCard number="01" title="Rezervasyon Girişi">
                Misafir isimleri, uçuş kodları ve otel tercihlerini sisteme kaydedin.
              </StepCard>
              <StepCard number="02" title="Dinamik Fiyatlandırma">
                Sezonluk otel fiyatlarını ve transfer maliyetlerini sistem otomatik hesaplar.
              </StepCard>
              <StepCard number="03" title="Voucher Üretimi">
                Tüm servisler onaylandığında tek tıkla Voucher dökümanını hazırlayın.
              </StepCard>
            </div>
          </div>
        );
      case 'sejour-voucher':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Online Voucher Rehberi</h1>
            <p className="text-lg text-slate-500 leading-relaxed">Misafirinize profesyonel bir karşılama deneyimi sunun.</p>
            
            <AlertBox type="tip" title="Temassız Deneyim">
              Misafirinize Voucher'ı PDF olarak göndermek yerine link olarak gönderin. Misafir link üzerinden transfer aracının plakasını ve rehberinin fotoğrafını anlık görebilir.
            </AlertBox>

            <ScreenshotFrame caption="Misafir Online Voucher Ekranı" />
          </div>
        );
      case 'ops-transfer':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Transfer Listeleri & Planlama</h1>
            <p className="text-lg text-slate-500 leading-relaxed">Saha operasyonunun kalbi burasıdır.</p>

            <div className="space-y-4">
               <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                  <h6 className="text-sm font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Araç Atama & Gruplandırma</h6>
                  <p className="text-xs text-slate-500 leading-relaxed">Aynı saatteki transferleri birleştirerek araç maliyetlerini minimize edin. Atanan araç plakaları anlık olarak misafirlerin Voucher linklerine yansır.</p>
               </div>
            </div>
          </div>
        );
      case 'ops-guide':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Rehber & Personel Yönetimi</h1>
            <p className="text-lg text-slate-500 leading-relaxed">Doğru personeli doğru göreve atayın.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800">
                  <h6 className="text-xs font-black text-blue-900 dark:text-blue-100 uppercase mb-2">Kokartlı Rehberler</h6>
                  <p className="text-[10px] text-blue-800 dark:text-blue-200">Rehberlerin dil yetkinliklerine ve müsaitlik durumlarına göre atama yapın.</p>
               </div>
               <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-3xl border border-amber-100 dark:border-amber-800">
                  <h6 className="text-xs font-black text-amber-900 dark:text-amber-100 uppercase mb-2">Part-Time Personel</h6>
                  <p className="text-[10px] text-amber-800 dark:text-amber-200">Karşılama ekipleri ve etkinlik personeli için insan kaynakları talebi oluşturun.</p>
               </div>
            </div>
          </div>
        );
      case 'acc-invoice':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Fatura Yönetimi</h1>
            <p className="text-lg text-slate-500 leading-relaxed">Hataya yer bırakmayan fatura döngüsü.</p>

            <AlertBox type="warning" title="Mutabakat Zorunluluğu">
              Bir kalem için fatura kesilmeden önce tedarikçi ile mutabakatın (Link üzerinden veya manuel) tamamlanmış olması önerilir.
            </AlertBox>

            <div className="space-y-0">
              <StepCard number="01" title="Fatura Bekleyenler">
                Konfirme olan projeler otomatik olarak bu listeye düşer.
              </StepCard>
              <StepCard number="02" title="E-Fatura Entegrasyonu">
                Sistemden oluşturulan faturalar tek tıkla e-fatura portalına aktarılabilir.
              </StepCard>
            </div>
          </div>
        );
      case 'acc-cash':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Kasa & Banka Entegrasyonu</h1>
            <p className="text-lg text-slate-500 leading-relaxed">Gerçek zamanlı nakit kontrolü.</p>

            <div className="p-8 bg-gradient-to-br from-slate-800 to-slate-950 text-white rounded-[3rem] shadow-2xl">
               <h5 className="text-xl font-black mb-4">Anlık Bakiye Takibi</h5>
               <p className="text-sm opacity-70 leading-relaxed mb-6">Tüm banka hesaplarınız ve şirket kasalarınız tek ekranda. Yapılan her tahsilat ilgili kasaya anlık işlenir.</p>
               <div className="flex gap-2">
                  <div className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-bold">USD Kasası</div>
                  <div className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-bold">EUR Kasası</div>
                  <div className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-bold">TRY Kasası</div>
               </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-12">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mb-6">
              <BookOpen className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">Henüz Hazırlanıyor</h3>
            <p className="text-sm text-slate-500 max-w-xs">Bu bölümdeki dokümantasyon çalışmaları devam etmektedir. Lütfen diğer modülleri inceleyin.</p>
          </div>
        );
    }
  };

  const currentPath = () => {
    for (const group of navigation) {
      const item = group.items.find(i => i.id === activeTab);
      if (item) return [group.title, item.title];
    }
    return ['Genel', 'Rehber'];
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-3xl animate-in fade-in duration-500 flex items-center justify-center p-0 md:p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-screen-2xl h-full md:h-[90vh] md:rounded-[3rem] shadow-[0_50px_150px_rgba(0,0,0,0.7)] flex overflow-hidden relative"
      >
        {/* Left Sidebar - Navigation */}
        <aside className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:relative inset-y-0 left-0 w-80 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-800 z-50 transition-transform duration-500`}>
          <div className="h-full flex flex-col">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">SİSTEM REHBERİ</h3>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest">v4.0 Ultimate</p>
                  </div>
               </div>

               {/* Search Bar */}
               <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text"
                    placeholder="Dokümanlarda ara..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-[11px] font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
              {filteredNavigation.map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="px-4 flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-4">
                    <group.icon className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{group.title}</span>
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-between group ${
                          activeTab === item.id 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {item.title}
                        <ChevronRight className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${activeTab === item.id ? 'opacity-100' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
               <button className="w-full p-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-between group">
                  <span className="text-[10px] font-black uppercase tracking-widest">Destek Al</span>
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#0f172a] overflow-hidden">
          {/* Top Bar - Breadcrumbs & Actions */}
          <header className="h-20 border-b border-slate-100 dark:border-slate-800 px-8 flex items-center justify-between shrink-0 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-40">
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 md:hidden bg-slate-100 dark:bg-slate-800 rounded-lg"
                >
                  <Menu className="w-5 h-5" />
                </button>
                {/* Breadcrumbs */}
                <nav className="hidden md:flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   <span>Ana Sayfa</span>
                   <ChevronRight className="w-3 h-3" />
                   {currentPath().map((p, i) => (
                     <React.Fragment key={i}>
                       <span className={i === currentPath().length - 1 ? 'text-blue-600' : ''}>{p}</span>
                       {i < currentPath().length - 1 && <ChevronRight className="w-3 h-3" />}
                     </React.Fragment>
                   ))}
                </nav>
             </div>

             <button 
               onClick={onClose}
               className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-xl transition-all hover:rotate-90"
             >
               <X className="w-5 h-5" />
             </button>
          </header>

          <div className="flex-1 flex overflow-hidden">
             {/* Center Scrollable Content */}
             <main className="flex-1 overflow-y-auto p-8 md:p-16 lg:p-24 custom-scrollbar">
                <div className="max-w-4xl mx-auto">
                   {getContent()}

                   {/* Helpful Rating */}
                   <div className="mt-24 pt-12 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-6">
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Bu makale yardımcı oldu mu?</p>
                      <div className="flex gap-4">
                         <button className="px-8 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[11px] font-bold hover:bg-emerald-500 hover:text-white transition-all">EVET, YARDIMCI OLDU</button>
                         <button className="px-8 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[11px] font-bold hover:bg-rose-500 hover:text-white transition-all">HAYIR, GELİŞTİRİLMELİ</button>
                      </div>
                   </div>
                </div>
             </main>

             {/* Right Sidebar - TOC (On This Page) */}
             <aside className="hidden xl:block w-72 p-12 border-l border-slate-100 dark:border-slate-800">
                <div className="sticky top-0">
                   <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6">BU SAYFADA</h5>
                   <ul className="space-y-4">
                      {['Genel Bakış', 'Adım Adım Süreç', 'Kritik Uyarılar', 'Görsel Rehber'].map((t, i) => (
                        <li key={i} className="flex items-center gap-3 text-[11px] font-bold text-slate-500 hover:text-blue-600 cursor-pointer transition-colors group">
                           <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 group-hover:bg-blue-600" />
                           {t}
                        </li>
                      ))}
                   </ul>

                   <div className="mt-16 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                      <p className="text-[10px] font-black text-blue-600 uppercase mb-2">Hızlı Erişim</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">MICE tekliflerinde %20 daha hızlı olmak için klavye kısayollarını öğrenin.</p>
                      <button className="text-[10px] font-black text-blue-600 underline">GÖZ AT</button>
                   </div>
                </div>
             </aside>
          </div>
        </div>
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
