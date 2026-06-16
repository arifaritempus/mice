'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Hotel, 
  Plane, 
  Truck, 
  Plus, 
  ChevronRight, 
  ChevronLeft,
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
  Hash,
  Calculator
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
  source: 'MICE' | 'SEJOUR';
  parent_name: string;
  vehicle_type?: string;
  supplier_name?: string;
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
  source: 'MICE' | 'SEJOUR';
  parent_name: string;
}

interface MappedGuide {
  id: string;
  name: string;
  service_date: string;
  location: string;
  guest_count: number;
  cost: number;
  status: string;
  source: 'MICE' | 'SEJOUR';
  parent_name: string;
}

interface MappedPartTime {
  id: string;
  name: string;
  service_date: string;
  location: string;
  hours: number;
  hourly_rate: number;
  status: string;
  source: 'MICE' | 'SEJOUR';
  parent_name: string;
}

interface DashboardData {
  upcomingProjects: MappedProject[];
  upcomingSejours: MappedSejour[];
  upcomingTransfers: MappedTransfer[];
  upcomingTickets: MappedTicket[];
  upcomingGuides: MappedGuide[];
  upcomingPartTime: MappedPartTime[];
  activeProjectsCount: number;
  activeSejoursCount: number;
  totalTransfersCount: number;
  partTimeCount: number;
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
    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center font-black text-xs z-10 shadow-lg group-hover:scale-110 transition-transform">
      {number}
    </div>
    <div className="absolute left-4 top-8 bottom-0 w-px bg-slate-200 dark:bg-slate-700 group-last:hidden" />
    <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm group-hover:border-blue-500/50 transition-colors">
      <h5 className="text-sm font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight">{title}</h5>
      <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{children}</div>
    </div>
  </div>
);

const ScreenshotFrame = ({ caption, children }: { caption: string, children?: React.ReactNode }) => (
  <div className="my-8 space-y-3">
    <div className="rounded-2xl border-4 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 aspect-video flex items-center justify-center relative overflow-hidden group">
      {children}
    </div>
    <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{caption}</p>
  </div>
);
function UserManualModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const navigation = [
    {
      id: 'genel',
      title: 'Genel Bakış',
      icon: Layout,
      items: [
        { id: 'dashboard', title: 'Dashboard & Özet' }
      ]
    },
    {
      id: 'mice',
      title: 'MICE & Projeler',
      icon: Target,
      items: [
        { id: 'teklifler', title: 'Teklifler Modülü' },
        { id: 'projeler', title: 'Projeler (MICE) Modülü' }
      ]
    },
    {
      id: 'sejour',
      title: 'Sejour & Rezervasyon',
      icon: Hotel,
      items: [
        { id: 'sejour', title: 'Sejour Modülü' }
      ]
    },
    {
      id: 'operasyon',
      title: 'Saha Operasyonu',
      icon: Briefcase,
      items: [
        { id: 'operasyon', title: 'Operasyon Modülü' }
      ]
    },
    {
      id: 'bilet',
      title: 'Uçuş Yönetimi',
      icon: Plane,
      items: [
        { id: 'bilet', title: 'Bilet (Uçuş) Modülü' }
      ]
    },
    {
      id: 'finans',
      title: 'Muhasebe & Rapor',
      icon: Calculator,
      items: [
        { id: 'muhasebe', title: 'Muhasebe & Finans Modülü' },
        { id: 'raporlar', title: 'Raporlar Modülü' }
      ]
    },
    {
      id: 'diger',
      title: 'Diğer Sistemler',
      icon: Settings,
      items: [
        { id: 'pazarlama', title: 'Pazarlama (Marketing) Modülü' },
        { id: 'tanimlamalar', title: 'Tanımlamalar Modülü' },
        { id: 'ayarlar', title: 'Sistem Ayarları Modülü' }
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
      case 'dashboard':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Dashboard Modülü</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Tüm operasyonel akışların anlık takibini sağlayan ana ekranımız.
            </p>
            
            <div className="mt-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Nasıl Kullanılır?</h3>
              
              <StepCard number="01" title="Yaklaşan Operasyonlar Takibi">
                Sol alt panelde bulunan <strong>"Yaklaşan Operasyonlar"</strong> listesi, önümüzdeki 30 gün içinde gerçekleşecek projelerinizi ve operasyonlarınızı listeler. Listede herhangi bir satıra tıklayarak o projenin detay sayfasına direkt geçiş yapabilirsiniz.
              </StepCard>

              <StepCard number="02" title="Hızlı Özet Bölümü">
                Ekranın üst kısmında bulunan istatistik kartları; yaklaşan projelerinizi, bekleyen sejour kayıtlarınızı, transfer, uçak bileti ve görevlendirilen rehber sayılarınızı özetler. Kartların üzerine tıklayarak ilgili departmanın listesine hızlıca ulaşabilirsiniz.
              </StepCard>

              <StepCard number="03" title="Finansal Durum Analizi">
                Sağ alt panelde yer alan <strong>"Finansal Durum"</strong> grafikleri üzerinden aylık bazda firmanızın cirosunu, yapılan giderleri ve net karlılığı takip edebilirsiniz. Rakamlar sadece yetkili kullanıcılar tarafından görüntülenebilir.
              </StepCard>
            </div>
          </div>
        );
      case 'teklifler':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Teklifler Modülü</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">Müşterilerinize sunacağınız MICE (Toplantı/Etkinlik) veya grup organizasyon tekliflerinin hazırlandığı modüldür.</p>
            
            <div className="mt-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Nasıl Kullanılır?</h3>
              
              <StepCard number="01" title="Yeni Teklif Oluşturma">
                Sağ üstteki <strong>"Yeni Teklif"</strong> butonuna basın. Açılan ekranda teklif verilecek Müşteri'yi (Cari), Teklif adını, başlangıç/bitiş tarihlerini ve tahmini katılımcı sayısını girin.
              </StepCard>

              <StepCard number="02" title="Hizmet Kalemlerini Ekleme">
                Teklifin detay sayfasına girdiğinizde; Konaklama, Transfer, Uçuş, Etkinlik gibi kalemleri (sekme olarak) göreceksiniz. İlgili sekmeye girip tedarikçiden aldığınız "Maliyet" tutarını ve müşteriye satacağınız "Satış Fiyatını" girin. İstenirse farklı döviz cinsleri kullanılabilir.
              </StepCard>

              <StepCard number="03" title="Müşteriye Gönderme & Onay Alma">
                Teklifinizi tamamladığınızda, üstteki <strong>"Link Oluştur / Paylaş"</strong> butonuna basarak dijital bir sunum linki elde edersiniz. Müşteri bu linke tıklayarak teklifi inceler ve <strong>"Onayla"</strong> butonuna basabilir.
              </StepCard>

              <StepCard number="04" title="Teklifi Projeye Çevirme">
                Müşteri onayladığında veya siz manuel olarak onaylandı işaretlediğinizde teklif otomatik olarak "Projeler" modülüne aktarılır ve kilitlenir. Artık üzerinde değişiklik yapılamaz, operasyon başlar.
              </StepCard>
            </div>
          </div>
        );
      case 'projeler':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Projeler (MICE) Modülü</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">Onaylanmış tekliflerin veya direkt açılan kesinleşmiş işlerin yönetildiği, operasyonel dağılımın yapıldığı merkezdir.</p>
            
            <div className="mt-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Nasıl Kullanılır?</h3>
              
              <StepCard number="01" title="Rooming List (Konaklama Listesi) Yükleme">
                Projeye girdiğinizde <strong>"Konaklama"</strong> sekmesinde <strong>"Excel'den Yükle"</strong> seçeneğini kullanarak katılımcı listenizi tek seferde sisteme aktarabilirsiniz. Sistem single/double/twin oda atamalarını otomatik yapar.
              </StepCard>

              <StepCard number="02" title="Transferleri Otomatik Oluşturma">
                Yolcuların geliş ve gidiş uçuş bilgilerini sisteme girdiyseniz, <strong>"Transferler"</strong> sekmesinde "Uçuşlardan Transfer Oluştur" diyerek tüm transfer planlamasını saniyeler içinde taslak olarak oluşturabilirsiniz.
              </StepCard>

              <StepCard number="03" title="Döviz & Kur Yönetimi">
                Proje ayarlarından "TCMB Kurunu Kullan"ı seçerek projedeki farklı döviz harcamalarının o günkü kurdan otomatik hesaplanmasını veya belirli bir kura sabitlenmesini sağlayabilirsiniz.
              </StepCard>

              <StepCard number="04" title="Bütçe ve Karlılık Kontrolü">
                Projenin <strong>"Finans"</strong> sekmesinde, kalem kalem yapılan masraflar ve fatura edilen satışlar karşılaştırılarak projenin anlık net kar/zararı (P&L) görüntülenir.
              </StepCard>
            </div>
          </div>
        );
      case 'sejour':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Sejour Modülü</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">Münferit misafirler veya ufak gruplar için yapılan otel rezervasyonları, voucher ve yan hizmetlerin yönetildiği modüldür.</p>
            
            <div className="mt-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Nasıl Kullanılır?</h3>
              
              <StepCard number="01" title="Yeni Kayıt ve Voucher">
                "Yeni Sejour" diyerek misafir adını, kalacağı oteli ve tarihleri belirleyin. Kayıt tamamlandıktan sonra sağ üstteki <strong>"Voucher Üret"</strong> butonu ile müşterinize veya otele göndereceğiniz resmi belgeyi PDF olarak indirebilirsiniz.
              </StepCard>

              <StepCard number="02" title="Hizmet Ekleme (Çapraz Satış)">
                Sadece otel değil, Sejour detayına girip "Hizmetler" sekmesinden misafire havalimanı transferi, rehberlik veya müze bileti gibi ekstra hizmetler ekleyebilirsiniz. Bu hizmetler doğrudan operasyon birimine iş emri olarak düşer.
              </StepCard>

              <StepCard number="03" title="Misafir Tahsilatları">
                "Bakiye / Ödeme" sekmesinden müşterinin yaptığı kredi kartı veya nakit ödemeleri girin. Sistem müşterinin kalan bakiyesini her an size gösterir.
              </StepCard>
            </div>
          </div>
        );
      case 'operasyon':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Operasyon Modülü</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">Proje ve Sejour'lardan otomatik akan transferlerin, biletlerin ve saha personellerinin yönetildiği kontrol panelidir.</p>
            
            <div className="mt-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Nasıl Kullanılır?</h3>
              
              <StepCard number="01" title="Transfer Araç Atama & Birleştirme">
                "Transferler" sekmesinde bekleyen yolcuları görürsünüz. Aynı saatte inen uçuşları seçip <strong>"Araç Ata"</strong> diyerek tek bir araca (Minibüs/Otobüs vb.) birden fazla yolcuyu atayabilir, transfer firmasını seçebilirsiniz.
              </StepCard>

              <StepCard number="02" title="Transfer Formu Çıktısı">
                Atamaları biten gün için sağ üstteki <strong>"Transfer Formu (Excel)"</strong> butonuna basarak şoförlerinize ve havalimanı karşılama personeline vereceğiniz yolcu tablolarını çıktı alabilirsiniz.
              </StepCard>

              <StepCard number="03" title="Part-time & Rehber Atama">
                Projede görev alacak rehberleri "Personel" sekmesinden seçin. Sistem, o rehberin o gün başka bir projede olup olmadığını kontrol eder. Atama yapıldığında yevmiye bedeli üzerinden hakedişi otomatik hesaplanır.
              </StepCard>
            </div>
          </div>
        );
      case 'bilet':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Bilet (Uçuş) Modülü</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">İç ve dış hat tüm biletlemelerin, PNR'ların ve opsiyon sürelerinin takip edildiği alandır.</p>
            
            <div className="mt-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Nasıl Kullanılır?</h3>
              
              <StepCard number="01" title="Bilet İşleme">
                "Yeni Bilet" butonuna tıklayıp Havayolu, PNR, Yolcu Bilgisi, Net Maliyet ve Vergi(Tax) detaylarını girerek bileti sisteme kaydedin.
              </StepCard>

              <StepCard number="02" title="Opsiyon (Time Limit) Takibi">
                Henüz kesilmemiş (rezervasyon) biletler için <strong>Opsiyon Tarihi</strong> girerseniz, bilet menüsünde günü yaklaşanlar kırmızı alarm ile liste başında gösterilir.
              </StepCard>

              <StepCard number="03" title="Bilet Takvimi Kullanımı">
                Üstteki "Takvim Görünümü"ne geçerek hangi gün hangi yolcunun uçuşu olduğunu görsel olarak takip edebilirsiniz.
              </StepCard>
            </div>
          </div>
        );
      case 'pazarlama':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Pazarlama (Marketing) Modülü</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">Müşterilerinizle olan görüşme ve satış süreçlerinizi (CRM) yönettiğiniz modüldür.</p>
            
            <div className="mt-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Nasıl Kullanılır?</h3>
              
              <StepCard number="01" title="Randevu Oluşturma">
                Yeni bir müşteri görüşmesi ayarladığınızda "Yeni Randevu" diyerek firma adını, tarihi ve toplantı konusunu belirleyin.
              </StepCard>

              <StepCard number="02" title="Görüşme Notları (Log)">
                Toplantı sonrası randevu detayına girerek neler konuşulduğunu "Görüşme Notu" olarak kaydedin. Bu sayede aylar sonra bile hangi müşteriye hangi sözlerin verildiğini hatırlayabilirsiniz.
              </StepCard>
            </div>
          </div>
        );
      case 'muhasebe':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Muhasebe & Finans Modülü</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">Faturalar, mutabakatlar ve kasa-banka ödemelerinin şirket resmi muhasebesine işlendiği yerdir.</p>
            
            <div className="mt-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Nasıl Kullanılır?</h3>
              
              <StepCard number="01" title="Bekleyen Faturaları İşleme">
                Muhasebe modülüne girdiğinizde operasyondan gelen "Faturalandırılacak Projeler" listesi göreceksiniz. Faturasını resmen kestiğiniz işleri seçip "Fatura Kesildi" olarak işaretleyin ve e-fatura numarasını girin.
              </StepCard>

              <StepCard number="02" title="Cari Mutabakat Gönderimi">
                Tedarikçilerinize (Cari) girdiğinizde sağ üstteki <strong>"Mutabakat Linki Gönder"</strong> diyerek karşı tarafa sistem üzerinden bir link iletebilirsiniz. Onlar onayladığında sistemde "Mutabık" olarak güncellenir.
              </StepCard>

              <StepCard number="03" title="Kasa ve Banka Hareketi İşleme">
                Gelen havaleleri veya yaptığınız nakit/EFT ödemelerini "Kasa İşlemleri" alanından "Yeni Tahsilat/Tediye" diyerek işleyin. Seçtiğiniz cari hesabın bakiyesinden anında düşülecektir.
              </StepCard>
            </div>
          </div>
        );
      case 'raporlar':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Raporlar Modülü</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">Filtreleyerek şirketin operasyonel ve finansal sonuçlarını dışa aktardığınız ekrandır.</p>
            
            <div className="mt-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Nasıl Kullanılır?</h3>
              
              <StepCard number="01" title="Kar/Zarar (P&L) Raporu Alma">
                Örneğin "Proje Bazlı Kar/Zarar" raporunu seçin. Tarih aralığını belirleyin. Sistem size o tarihlerdeki tüm projelerin cirosunu, maliyetini ve karlılığını listeleyecektir.
              </StepCard>

              <StepCard number="02" title="Dışa Aktarma">
                Tüm raporların sol üst köşesinde bulunan <strong>"Excel'e Aktar"</strong> butonunu kullanarak verileri bilgisayarınıza indirebilir, muhasebecinizle veya yönetimle paylaşabilirsiniz.
              </StepCard>
            </div>
          </div>
        );
      case 'tanimlamalar':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Tanımlamalar Modülü</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">Sistemde kullanılacak alt verilerin (oteller, tedarikçiler, acenteler, kullanıcılar) kaydedildiği alandır.</p>
            
            <div className="mt-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Nasıl Kullanılır?</h3>
              
              <StepCard number="01" title="Tedarikçi/Müşteri Ekleme">
                Cari Kartlar alanından çalıştığınız yeni bir oteli veya kurumsal müşteriyi sisteme tanıtın. Fatura bilgileri ve adreslerini eksiksiz girin.
              </StepCard>

              <StepCard number="02" title="Personel ve Rol Yönetimi">
                Kullanıcılar menüsünden yeni bir çalışan hesabı açın. Ona <strong>"Rol"</strong> (Örn: Sadece Operasyon Görebilir, Muhasebe Görebilir vb.) atayarak sistemdeki yetkilerini kısıtlayabilirsiniz.
              </StepCard>
            </div>
          </div>
        );
      case 'ayarlar':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Sistem Ayarları Modülü</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">Sistemin görünüm, entegrasyon ve genel şirket ayarlarının yapıldığı bölümdür.</p>
            
            <div className="mt-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Nasıl Kullanılır?</h3>
              
              <StepCard number="01" title="Şirket Logosu Yükleme">
                Sistem genelinde tekliflerde ve voucher'larda çıkacak resmi şirket logonuzu buradan sisteme yükleyebilirsiniz.
              </StepCard>

              <StepCard number="02" title="Tema Ayarları">
                Karanlık (Dark) veya Aydınlık (Light) tema seçimini yapabilir veya bilgisayarınızın sistem ayarına (Sistem) göre otomatik değişmesini sağlayabilirsiniz.
              </StepCard>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-12">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mb-6">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">İçerik Bulunamadı</h3>
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
        {/* === MOBILE SIDEBAR === */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 z-50 w-80 shrink-0 flex flex-col bg-slate-50 dark:bg-[#0f172a] border-r border-slate-100 dark:border-slate-800/50 animate-in slide-in-from-left duration-300">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800/50">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">SİSTEM REHBERİ</h3>
                      <p className="text-[10px] text-slate-500 font-bold tracking-widest">v4.0 Ultimate</p>
                    </div>
                 </div>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
                {filteredNavigation.map((group) => (
                  <div key={group.id} className="space-y-2">
                    <div className="px-4 flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-3">
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
                              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
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
            </aside>
          </div>
        )}

        {/* === DESKTOP SIDEBAR === (KAYMA/ÖRTÜŞME İHTİMALİNİ %100 ORTADAN KALDIRIR) */}
        <aside className="hidden md:flex flex-col w-80 shrink-0 bg-slate-50 dark:bg-[#0f172a] border-r border-slate-100 dark:border-slate-800/50">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800/50">
             <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">SİSTEM REHBERİ</h3>
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest">v4.0 Ultimate</p>
                </div>
             </div>

             {/* Search Bar */}
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Dokümanlarda ara..."
                  className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-[11px] font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-900 dark:text-white transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
            {filteredNavigation.map((group) => (
              <div key={group.id} className="space-y-2">
                <div className="px-4 flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-3">
                  <group.icon className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{group.title}</span>
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-between group ${
                        activeTab === item.id 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
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
        </aside>

        {/* === MAIN CONTENT AREA === */}
        <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-[#0b1120] overflow-hidden">
          {/* Top Bar */}
          <header className="h-20 border-b border-slate-100 dark:border-slate-800/50 px-8 flex items-center justify-between shrink-0 bg-white/80 dark:bg-[#0b1120]/80 backdrop-blur-md sticky top-0 z-40">
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 md:hidden bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
                >
                  <Menu className="w-5 h-5" />
                </button>
                {/* Breadcrumbs */}
                <nav className="hidden md:flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   <span>Sistem Rehberi</span>
                   <ChevronRight className="w-3 h-3 text-slate-600" />
                   {currentPath().map((p, i) => (
                     <React.Fragment key={i}>
                       <span className={i === currentPath().length - 1 ? 'text-blue-600 dark:text-blue-400' : ''}>{p}</span>
                       {i < currentPath().length - 1 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                     </React.Fragment>
                   ))}
                </nav>
             </div>

             <button 
               onClick={onClose}
               className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl transition-all hover:rotate-90"
             >
               <X className="w-5 h-5" />
             </button>
          </header>

          <div className="flex-1 flex overflow-hidden">
             {/* Center Scrollable Content */}
             <main className="flex-1 overflow-y-auto p-8 md:p-16 lg:p-20 custom-scrollbar">
                <div className="max-w-4xl mx-auto">
                   {getContent()}

                   
                </div>
             </main>

             {/* Right Sidebar - TOC (On This Page) */}
             <aside className="hidden xl:block w-72 p-10 border-l border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-[#0b1120]">
                <div className="sticky top-0">
                   <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6">BU SAYFADA</h5>
                   <ul className="space-y-4">
                      {['Özet Bilgi', 'Adım Adım Süreç', 'Önemli İpuçları'].map((t, i) => (
                        <li key={i} className="flex items-center gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors group">
                           <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-blue-600 dark:group-hover:bg-blue-400" />
                           {t}
                        </li>
                      ))}
                   </ul>

                   <div className="mt-16 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800/30">
                      <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-2">Hızlı Destek</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">Sistem kullanımı ile ilgili sormak istediğiniz sorular için destek ekibimize ulaşabilirsiniz.</p>
                      <button className="text-[10px] font-black text-blue-600 dark:text-blue-400 underline">DESTEK TALEBİ OLUŞTUR</button>
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
    upcomingPartTime: [],
    activeProjectsCount: 0,
    activeSejoursCount: 0,
    totalTransfersCount: 0,
    partTimeCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('activity');
  const [showManual, setShowManual] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [projectsRes, sejoursRes, ticketsRes, categoriesRes, projectFlightsRes] = await Promise.allSettled([
        projectsService.getAll(),
        SejourService.getSejours(),
        ticketOptionsService.getAll(),
        categoriesService.getAll(),
        supabase.from('project_flight_tickets').select('*')
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
        }).slice(0, 50);
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
        mappedProjects.map(p => projectTransfersService.getByProjectId(p.id).catch(() => []))
      );
      const projectTransfers: MappedTransfer[] = mappedProjects.flatMap((p, i) => {
        const pTransfers = (transferBuckets[i] || []) as Transfer[];
        return pTransfers.map(t => {
          const item = t as any;
          const routeStr = item.route || '';
          const parts = routeStr.includes('→') ? routeStr.split('→').map((x: string) => x.trim()) : routeStr.split('-').map((x: string) => x.trim());
          const pickup = parts[0] || item.pickup_location || '';
          const dropoff = parts.length > 1 ? parts[parts.length - 1] : (item.dropoff_location || '');
          
          return {
            id: item.id,
            type: item.service_type || item.transfer_type || 'Transfer',
            pickup_location: pickup,
            dropoff_location: dropoff,
            date: item.date || item.transfer_date || '',
            guest_count: item.passenger_count || 0,
            cost: item.cost_amount || 0,
            status: item.status || 'confirmed',
            source: 'MICE',
            parent_name: p.name || 'Proje',
            vehicle_type: item.vehicle_type || '',
            supplier_name: item.supplier?.name || item.supplier_name || ''
          };
        });
      });

      // Sejour Transfers
      const sejourTransfers: MappedTransfer[] = sejours.flatMap(s => (s.transfers || []).map((t: any) => {
        const isArr = t.direction === 'arrival';
        let routeDesc = t.routeDescription || '';
        if (routeDesc.includes('→')) {
           const rp = routeDesc.split('→').map((x: string) => x.trim());
           return {
             id: t.id,
             type: t.type || t.transferType || 'Transfer',
             pickup_location: rp[0] || 'Belirtilmemiş',
             dropoff_location: rp[1] || 'Belirtilmemiş',
             date: t.date || s.check_in_date || s.checkInDate || '',
             guest_count: t.paxCount || 0,
             cost: t.price || 0,
             status: 'confirmed',
             source: 'SEJOUR',
             parent_name: s.voucherNumber || s.voucher_number || s.customerName || s.customer_name || 'Sejour',
             vehicle_type: t.vehicleType || t.vehicle || '',
             supplier_name: t.supplierName || ''
           };
        }
        return {
          id: t.id,
          type: t.type || t.transferType || 'Transfer',
          pickup_location: isArr ? 'Havalimanı' : (routeDesc || 'Otel'),
          dropoff_location: isArr ? (routeDesc || 'Otel') : 'Havalimanı',
          date: t.date || s.check_in_date || s.checkInDate || '',
          guest_count: t.paxCount || 0,
          cost: t.price || 0,
          status: 'confirmed',
          source: 'SEJOUR',
          parent_name: s.voucherNumber || s.voucher_number || s.customerName || s.customer_name || 'Sejour',
          vehicle_type: t.vehicleType || t.vehicle || '',
          supplier_name: t.supplierName || ''
        };
      }));

      const allTransfers: MappedTransfer[] = [...projectTransfers, ...sejourTransfers];

      // Project HR
      const hrBuckets = await Promise.all(
        mappedProjects.map(p => projectHumanResourcesService.getByProjectId(p.id).catch(() => []))
      );
      const hrRowsWithProject = mappedProjects.flatMap((p, i) => {
        const rows = (hrBuckets[i] || []) as ProjectHumanResource[];
        return rows.map(r => ({ ...r, project_name: p.name || 'Proje' }));
      });

      const categories = categoriesRes.status === 'fulfilled' ? (categoriesRes.value as { id: string; name: string }[]) : [];
      const categoryById: Record<string, { id: string; name: string }> = {};
      categories.forEach(c => { categoryById[c.id] = c; });

      const mappedGuides = hrRowsWithProject
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
          status: 'confirmed',
          source: 'MICE',
          parent_name: r.project_name
        } as MappedGuide));

      const mappedPartTime = hrRowsWithProject
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
          status: 'confirmed',
          source: 'MICE',
          parent_name: r.project_name
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
          source: 'SEJOUR' as 'MICE' | 'SEJOUR',
          parent_name: s.voucherNumber || s.voucher_number || s.customerName || s.customer_name || 'Sejour',
          isGuide,
          isPartTime
        };
      }));

      const allGuides: MappedGuide[] = [...mappedGuides, ...sejourExtras.filter(e => e.isGuide).map(e => ({
        id: e.id,
        name: e.name,
        service_date: e.service_date || '',
        location: e.location || '',
        guest_count: 0,
        cost: e.cost || 0,
        status: e.status,
        source: e.source as 'SEJOUR',
        parent_name: e.parent_name
      }))];

      const allPartTime: MappedPartTime[] = [...mappedPartTime, ...sejourExtras.filter(e => e.isPartTime).map(e => ({
        id: e.id,
        name: e.name,
        service_date: e.service_date || '',
        location: e.location || '',
        hours: 0,
        hourly_rate: 0,
        status: e.status,
        source: e.source as 'SEJOUR',
        parent_name: e.parent_name
      }))];

      // Tickets (Project Options + Sejour Flights)
      const tickets = ticketsRes.status === 'fulfilled' ? (ticketsRes.value as Ticket[]) : [];
      const mappedTickets: MappedTicket[] = tickets.map(t => {
        const p = activeProjects.find(proj => proj.id === (t as any).project_id);
        return {
          id: t.id,
          flight_number: (t as any).flight_number || (t as any).flight_no || '',
          departure: (t as any).departure || '',
          arrival: (t as any).arrival || '',
          date: (t as any).service_date || (t as any).date || '',
          passenger_count: (t as any).unit_quantity || 1,
          cost: (t as any).total_price || 0,
          status: 'confirmed',
          source: 'MICE',
          parent_name: p ? (p.name || 'Proje') : 'MICE'
        };
      });

      const sejourFlights: MappedTicket[] = sejours.flatMap(s => (s.flights || []).map((f: any) => {
        const routeStr = (f.route || f.departureAirport || '');
        const routeParts = routeStr.includes('-') ? routeStr.split('-') : routeStr.split(' ');
        const dep = routeParts[0] || '';
        const arr = routeParts.length > 1 ? routeParts[routeParts.length - 1] : (f.arrivalAirport || '');
        return {
          id: f.id,
          flight_number: f.flightNo || '',
          departure: dep,
          arrival: arr,
          date: f.flightDate || s.checkInDate || s.check_in_date || '',
          passenger_count: f.totalPassengers || 1,
          cost: f.price || 0,
          status: 'confirmed',
          source: 'SEJOUR',
          parent_name: s.voucherNumber || s.voucher_number || s.customerName || s.customer_name || 'Sejour'
        };
      }));

      const projectFlightsData = projectFlightsRes.status === 'fulfilled' ? ((projectFlightsRes.value as any).data || []) : [];
      const mappedProjectFlights: MappedTicket[] = projectFlightsData.map((t: any) => {
        const p = activeProjects.find(proj => proj.id === t.project_id);
        const routeStr = t.guzergah || '';
        const routeParts = routeStr.includes('-') ? routeStr.split('-') : routeStr.split(' ');
        const dep = routeParts[0] || '';
        const arr = routeParts.length > 1 ? routeParts[routeParts.length - 1] : '';
        return {
          id: t.id,
          flight_number: t.gidis_ucus_kodu || t.donus_ucus_kodu || t.ucus_tipi || '',
          departure: dep,
          arrival: arr,
          date: t.gidis_tarihi || t.donus_tarihi || t.biletleme_tarihi || '',
          passenger_count: t.kisi_sayisi || 1,
          cost: t.toplam_maliyet || 0,
          status: t.durum || 'confirmed',
          source: 'MICE',
          parent_name: p ? (p.name || 'Proje') : 'MICE'
        };
      });

      const allTickets: MappedTicket[] = [...mappedTickets, ...sejourFlights, ...mappedProjectFlights];

      setDashboardData({
        upcomingProjects: filterUpcoming(mappedProjects, 'start_date'),
        upcomingSejours: filterUpcoming(mappedSejours, 'start_date'),
        upcomingTransfers: filterUpcoming(allTransfers, 'date'),
        upcomingTickets: filterUpcoming(allTickets, 'date'),
        upcomingGuides: filterUpcoming(allGuides, 'service_date'),
        upcomingPartTime: filterUpcoming(allPartTime, 'service_date'),
        activeProjectsCount: activeProjects.length,
        activeSejoursCount: mappedSejours.filter(s => (s.status || '').toLowerCase() !== 'cancelled').length,
        totalTransfersCount: allTransfers.length,
        partTimeCount: allPartTime.length
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
    { label: 'Aktif Projeler', value: dashboardData.activeProjectsCount, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Aktif Sejourlar', value: dashboardData.activeSejoursCount, icon: Hotel, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Yaklaşan Transferler', value: dashboardData.upcomingTransfers.length, icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Planlanan Part-Time', value: dashboardData.upcomingPartTime.length, icon: Users, color: 'text-rose-600', bg: 'bg-rose-50' },
  ], [dashboardData]);

  if (permissionsLoading) return <LoadingSpinner message="Sistem hazırlanıyor..." />;

  const DashboardCard = ({ title, icon: Icon, items, renderItem, link, color }: { title: string; icon: React.ElementType; items: any[]; renderItem: (item: any, idx: number) => React.ReactNode; link: string; color: string }) => {
    const [page, setPage] = useState(0);
    const itemsPerPage = 4;
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const currentItems = items.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full group hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800 p-4 shrink-0">
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
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            {items.length > 0 ? currentItems.map((item, i) => renderItem(item, i)) : <EmptyState />}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))} 
                disabled={page === 0}
                className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              <span className="text-[10px] font-bold text-slate-400">{page + 1} / {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
                disabled={page === totalPages - 1}
                className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

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
                <DashboardCard 
                  title="AKTİF PROJELER" 
                  icon={Briefcase} 
                  link="/projects" 
                  color="text-blue-600"
                  items={dashboardData.upcomingProjects}
                  renderItem={(p, i) => (
                    <div key={`project-${p.id}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{p.client_name || p.reference || 'Müşteri'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-blue-600 whitespace-nowrap">{new Date(p.start_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{p.status}</p>
                      </div>
                    </div>
                  )}
                />

                <DashboardCard 
                  title="Sejour & Konaklama" 
                  icon={Hotel} 
                  link="/sejour" 
                  color="text-emerald-600"
                  items={dashboardData.upcomingSejours}
                  renderItem={(s, i) => (
                    <div key={`sejour-${s.id}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{s.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{s.hotel_name || 'Otel'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-emerald-600 whitespace-nowrap">{new Date(s.start_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{s.guest_count > 0 ? `${s.guest_count} Oda` : s.status}</p>
                      </div>
                    </div>
                  )}
                />

                <DashboardCard 
                  title="Transferler" 
                  icon={Truck} 
                  link="/operations/transfers" 
                  color="text-indigo-600"
                  items={dashboardData.upcomingTransfers}
                  renderItem={(t, i) => (
                    <div key={`transfer-${t.id}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${t.source === 'MICE' ? 'bg-blue-50/50 border-blue-200 text-blue-600' : 'bg-emerald-50/50 border-emerald-200 text-emerald-600'}`}>{t.source}</span>
                          <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{t.parent_name}</p>
                        </div>
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{t.pickup_location || 'Belirtilmemiş'} → {t.dropoff_location || 'Belirtilmemiş'}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{t.type}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-indigo-600 whitespace-nowrap">{new Date(t.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{t.guest_count > 0 ? `${t.guest_count} Pax` : t.status}</p>
                      </div>
                    </div>
                  )}
                />

                <DashboardCard 
                  title="Uçuş & Biletler" 
                  icon={Plane} 
                  link="/tickets/options" 
                  color="text-amber-600"
                  items={dashboardData.upcomingTickets}
                  renderItem={(t, i) => (
                    <div key={`ticket-${t.id}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${t.source === 'MICE' ? 'bg-blue-50/50 border-blue-200 text-blue-600' : 'bg-emerald-50/50 border-emerald-200 text-emerald-600'}`}>{t.source}</span>
                          <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{t.parent_name}</p>
                        </div>
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{t.flight_number || 'Uçuş No Yok'}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{t.departure || '?'} → {t.arrival || '?'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-amber-600 whitespace-nowrap">{new Date(t.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{t.passenger_count} Yolcu</p>
                      </div>
                    </div>
                  )}
                />

                <DashboardCard 
                  title="PART-TIME" 
                  icon={Users} 
                  link="/operations/part-time" 
                  color="text-rose-600"
                  items={dashboardData.upcomingPartTime}
                  renderItem={(p, i) => (
                    <div key={`pt-${p.id}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${p.source === 'MICE' ? 'bg-blue-50/50 border-blue-200 text-blue-600' : 'bg-emerald-50/50 border-emerald-200 text-emerald-600'}`}>{p.source}</span>
                          <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{p.parent_name}</p>
                        </div>
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{p.name || 'Personel'}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{p.location || 'Saha'}</p>
                      </div>
                      <div className="text-right shrink-0">
                         <p className="text-[10px] font-black text-rose-600 whitespace-nowrap">{new Date(p.service_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase">{p.status}</p>
                      </div>
                    </div>
                  )}
                />

                <DashboardCard 
                  title="KOKARTLI REHBERLER" 
                  icon={UserCheck} 
                  link="/operations/guides" 
                  color="text-purple-600"
                  items={dashboardData.upcomingGuides}
                  renderItem={(g, i) => (
                    <div key={`guide-${g.id}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${g.source === 'MICE' ? 'bg-blue-50/50 border-blue-200 text-blue-600' : 'bg-emerald-50/50 border-emerald-200 text-emerald-600'}`}>{g.source}</span>
                          <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{g.parent_name}</p>
                        </div>
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{g.name || 'Rehber'}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{g.location || 'Saha'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-purple-600 whitespace-nowrap">{new Date(g.service_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{g.status}</p>
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Section 2: Genel Bakış (Overview) */}
            <div className="space-y-6 pt-8 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase text-xs">Genel Bakış</h2>
              <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Visual Analytics */}
                <div className="w-full bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 h-fit">
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
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modern Footer with Help Button Only */}
      <footer className="w-full mt-20 pt-12 pb-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
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
