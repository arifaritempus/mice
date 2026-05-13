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

// âââ UserManualModal âââââââââââââââââââââââââââââââââââââââââââââââââââinterface SubSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface DocSection {
  id: string;
  title: string;
  icon: any;
  subSections: SubSection[];
}

function UserManualModal({ onClose }: { onClose: () => void }) {
  const [activeSection, setActiveSection] = useState('mice');
  const [activeSub, setActiveSub] = useState('teklif-olusturma');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const docData: DocSection[] = [
    {
      id: 'mice',
      title: 'MICE & Proje Yönetimi',
      icon: Target,
      subSections: [
        {
          id: 'teklif-olusturma',
          title: 'Teklif Oluşturma',
          content: (
            <div className="space-y-10 pb-20">
              <div className="flex items-center gap-3 text-[11px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-2xl w-fit border border-blue-100 dark:border-blue-800">
                <Layout className="w-4 h-4" /> Ana Sayfa &gt; MICE &gt; Teklif Oluşturma
              </div>
              
              <h1 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.9]">MICE Teklif <br/>Oluşturma Rehberi</h1>
              
              <div className="p-8 bg-blue-600 rounded-[3rem] text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-125 transition-transform duration-700"><Target className="w-20 h-20" /></div>
                <h4 className="text-xl font-black mb-4">Süreç Özeti</h4>
                <p className="text-sm opacity-90 leading-relaxed font-medium">MICE teklifleri, operasyonun tüm maliyet ve satış kalemlerini tek bir çatı altında topladığınız esnek bir yapıdır. Her teklif, potansiyel bir projedir.</p>
              </div>

              <div className="space-y-8">
                 <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Adım Adım Teklif Süreci</h2>
                 <div className="space-y-4">
                    {[
                      { step: '01', title: 'Temel Bilgiler', desc: 'Acente, Grup İsmi ve Tarih aralığını belirleyin. Bu bilgiler projeye dönüştüğünde ana kimliği oluşturur.' },
                      { step: '02', title: 'Otel Opsiyonları', desc: 'Aynı teklifte birden fazla otel opsiyonu sunmak için "Yeni Otel Ekle" butonunu kullanın.' },
                      { step: '03', title: 'Hizmet Girişleri', desc: 'Konaklama, transfer, uçak bileti ve etkinlik kalemlerini "Ekle" butonuyla sekmelere dahil edin.' },
                      { step: '04', title: 'Maliyet & Kar Analizi', desc: 'Her kalemin maliyetini ve satışını girin. Sistem otomatik olarak karlılığı % bazında hesaplar.' }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-8 p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 items-start hover:bg-white dark:hover:bg-slate-800 transition-all group">
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 shadow-lg flex items-center justify-center text-xl font-black text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">{item.step}</div>
                        <div>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">{item.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>

                 </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'sejour',
      title: 'Sejour & Voucher',
      icon: Hotel,
      subSections: [
        {
          id: 'voucher-yonetimi',
          title: 'Voucher & Rezervasyon',
          content: (
            <div className="space-y-10 pb-20">
              <div className="flex items-center gap-3 text-[11px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-2xl w-fit border border-indigo-100 dark:border-indigo-800">
                <Layout className="w-4 h-4" /> Ana Sayfa &gt; Sejour &gt; Voucher Yönetimi
              </div>
              <h1 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.9]">Dijital Voucher <br/>& Misafir Kaydı</h1>
              
              <div className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[3rem] border border-slate-100 dark:border-slate-800">
                 <p className="text-sm text-slate-500 leading-relaxed font-medium italic">"Münferit misafirlerin tüm konaklama, uçuş ve transfer detaylarını tek bir dijital belge altında toplayıp misafire link olarak gönderebilirsiniz."</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white">
                    <h4 className="font-black mb-4">Otel Tahsisat</h4>
                    <p className="text-xs opacity-90 leading-relaxed">Anlaşmalı otellerdeki oda kontenjanlarınızı (Allotment) sisteme girerek doluluk oranlarını saniye saniye izleyin.</p>
                 </div>
                 <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white">
                    <h4 className="font-black mb-4">Anlık Rezervasyon</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Misafir bilgilerini girerken sistem otomatik olarak müsaitlik kontrolü yapar ve çakışmaları önler.</p>
                 </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'accounting',
      title: 'Muhasebe & Finans',
      icon: CreditCard,
      subSections: [
        {
          id: 'tahsilat-yonetimi',
          title: 'Tahsilat & Ödeme',
          content: (
            <div className="space-y-10 pb-20">
              <div className="flex items-center gap-3 text-[11px] font-black text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-4 py-2 rounded-2xl w-fit border border-rose-100 dark:border-rose-800">
                <Layout className="w-4 h-4" /> Ana Sayfa &gt; Muhasebe &gt; Tahsilat
              </div>
              <h1 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.9]">Finansal Takip <br/>& Nakit Akışı</h1>
              
              <div className="p-8 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-[2.5rem] flex gap-6 items-start">
                 <div className="p-3 bg-rose-600 rounded-2xl text-white shadow-lg"><HelpCircle className="w-6 h-6" /></div>
                 <div>
                    <p className="text-xs font-black text-rose-900 dark:text-rose-100 uppercase mb-2 tracking-widest">Kritik Bilgi</p>
                    <p className="text-[13px] text-rose-800 dark:text-rose-200 font-medium leading-relaxed">Muhasebeleşen bir faturayı silmek, vergi ve beyanname süreçlerini etkiler. Bu işlem geri alınamaz.</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
                    <h5 className="font-black text-slate-900 dark:text-white mb-2">Nakit Akışına Aktarım</h5>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Teklif kalemlerine girdiğiniz her tahsilat/ödeme tarihi, Muhasebe modülündeki "Nakit Akış" takvimine anlık olarak düşer.</p>
                 </div>
              </div>
            </div>
          )
        }
      ]
    }
  ];

  const filteredData = docData.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.subSections.some(sub => sub.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const currentSection = docData.find(s => s.id === activeSection);
  const currentSub = currentSection?.subSections.find(sub => sub.id === activeSub);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-6 bg-slate-950/80 backdrop-blur-3xl animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-950 w-full h-full md:max-w-[95vw] md:h-[90vh] md:rounded-[4rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col relative"
      >
        {/* Top Navigation Bar */}
        <div className="h-20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-10 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md shrink-0 z-50">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="hidden md:block">
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">KILAVUZ MERKEZİ</h2>
                <p className="text-[9px] text-blue-600 font-black tracking-[0.2em] uppercase">Enterprise Edition</p>
              </div>
           </div>

           <div className="flex-1 max-w-xl px-10 relative hidden md:block">
              <Search className="absolute left-14 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Nasıl yardımcı olabilirim? (Ãrn: Mice Teklif...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-slate-100 dark:bg-slate-900 rounded-2xl pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              />
           </div>

           <button onClick={onClose} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-rose-500 transition-all hover:rotate-90">
             <X className="w-5 h-5" />
           </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Menu */}
          <motion.div 
            animate={{ width: isSidebarOpen ? 320 : 0 }}
            className="hidden md:flex flex-col bg-slate-50 dark:bg-slate-950/80 border-r border-slate-100 dark:border-slate-800 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
               {filteredData.map((section) => (
                 <div key={section.id} className="space-y-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 flex items-center gap-2">
                       <section.icon className="w-3 h-3" /> {section.title}
                    </h3>
                    <div className="space-y-1">
                       {section.subSections.map((sub) => (
                         <button
                           key={sub.id}
                           onClick={() => {
                             setActiveSection(section.id);
                             setActiveSub(sub.id);
                           }}
                           className={`w-full text-left px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all ${
                             activeSub === sub.id 
                               ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                               : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                           }`}
                         >
                           {sub.title}
                         </button>
                       ))}
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>

          {/* Main Reading Area */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0f172a] p-10 lg:p-20 custom-scrollbar relative">
             <div className="max-w-4xl mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSub}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentSub?.content}
                    
                    <div className="mt-20 pt-10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                       <p className="text-[11px] font-bold text-slate-400 italic">Son gÃ¼ncelleme: 13 MayÄ±s 2026</p>
                       <div className="flex items-center gap-4">
                          <p className="text-[11px] font-black text-slate-500 uppercase">FaydalÄ± oldu mu?</p>
                          <div className="flex gap-2">
                             <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black hover:bg-emerald-100 hover:text-emerald-700 transition-all">EVET</button>
                             <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black hover:bg-rose-100 hover:text-rose-700 transition-all">HAYIR</button>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
             </div>
          </div>

          {/* Right Sticky TOC */}
          <div className="hidden lg:block w-72 p-10 border-l border-slate-100 dark:border-slate-800 shrink-0">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">BU SAYFADA</h4>
             <div className="space-y-4">
                <div className="w-1 h-12 bg-blue-600 rounded-full" />
                <p className="text-[12px] font-bold text-slate-900 dark:text-white leading-relaxed">Sayfa iÃ§eriÄi otomatik taranÄ±yor...</p>
                <div className="space-y-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                   <p className="text-[11px] text-slate-500 hover:text-blue-600 cursor-pointer transition-colors">SÃ¼reÃ§ BaÅlangÄ±cÄ±</p>
                   <p className="text-[11px] text-slate-500 hover:text-blue-600 cursor-pointer transition-colors">Dikkat Edilecekler</p>
                   <p className="text-[11px] text-slate-500 hover:text-blue-600 cursor-pointer transition-colors">Finansal Detaylar</p>
                </div>
             </div>
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
        client_name: p.description?.slice(0, 20) || 'MÃ¼Återi',
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
        pickup_location: t.direction === 'arrival' ? 'HavalimanÄ±' : (t.routeDescription || 'Otel'),
        dropoff_location: t.direction === 'arrival' ? (t.routeDescription || 'Otel') : 'HavalimanÄ±',
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
      console.error('Dashboard data yÃ¼klenirken hata:', error);
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
    { label: 'BugÃ¼nkÃ¼ Transferler', value: dashboardData.upcomingTransfers.length, icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Personel Talepleri', value: dashboardData.upcomingPartTime.length, icon: Users, color: 'text-rose-600', bg: 'bg-rose-50' },
  ], [dashboardData]);

  if (permissionsLoading) return <LoadingSpinner message="Sistem hazÄ±rlanÄ±yor..." />;

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
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">YakÄ±n zamanda kayÄ±t bulunmuyor</p>
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
              Son GÃ¼ncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
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
            <LoadingSpinner message="Veriler yÃ¼kleniyor..." compact />
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

            {/* Section 1: Aktif AkÄ±Å (Cards) */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase text-xs">Aktif AkÄ±Å</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Dashboard Cards for different modules */}
                <DashboardCard title="YaklaÅan Projeler" icon={Briefcase} link="/projects" color="text-blue-600">
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
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{t.pickup_location} â {t.dropoff_location}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{t.type}</p>
                      </div>
                      <span className="text-[10px] font-black text-indigo-600 whitespace-nowrap">{new Date(t.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  )) : <EmptyState />}
                </DashboardCard>

                <DashboardCard title="UÃ§uÅ & Biletler" icon={Plane} link="/tickets/options" color="text-amber-600">
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

            {/* Section 2: Genel BakÄ±Å (Overview) */}
            <div className="space-y-6 pt-8 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase text-xs">Genel BakÄ±Å</h2>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Visual Analytics */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 h-fit">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase text-xs mb-1">Operasyonel DaÄÄ±lÄ±m</h2>
                      <p className="text-[10px] text-slate-500 font-medium italic">Gelecek 30 gÃ¼nlÃ¼k planlanan iÅlemler</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+12% ArtÄ±Å</span>
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
                                  <p className="text-base font-black text-slate-900 dark:text-white">{payload[0].value} KayÄ±t</p>
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
                    <h3 className="text-xl font-black tracking-tight mb-3 leading-tight">Ä°Åinizi <br/>KolaylaÅtÄ±rÄ±n</h3>
                    <p className="text-blue-100 text-[10px] font-medium mb-6 leading-relaxed">HÄ±zlÄ± iÅlem panelini kullanarak saniyeler iÃ§erisinde yeni kayÄ±tlar oluÅturabilirsiniz.</p>
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
                    <h3 className="font-black text-slate-900 dark:text-white tracking-tight uppercase text-[10px] mb-4">HÄ±zlÄ± EriÅim</h3>
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
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 group-hover:text-white">KullanÄ±cÄ±lar</span>
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
              <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-0.5">SÄ°STEM KILAVUZU</p>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">NasÄ±l KullanÄ±lÄ±r?</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="flex items-center gap-8 text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <span className="hover:text-blue-600 transition-colors cursor-pointer">Gizlilik PolitikasÄ±</span>
          <span className="hover:text-blue-600 transition-colors cursor-pointer">Destek HattÄ±</span>
          <span className="text-slate-200 dark:text-slate-800">|</span>
          <span className="text-slate-500">Â© 2024 TEMPUS</span>
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
