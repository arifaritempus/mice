'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Calendar, 
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
  LayoutDashboard,
  ArrowUpRight,
  RefreshCcw,
  Search
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
import { Module, usePermissions } from '@/lib/permissions';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface Project {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  client_name: string;
  budget: number;
  revenue: number;
}

interface Sejour {
  id: string;
  name: string;
  hotel_name: string;
  start_date: string;
  end_date: string;
  guest_count: number;
  total_cost: number;
  status: string;
}

interface Transfer {
  id: string;
  type: string;
  pickup_location: string;
  dropoff_location: string;
  date: string;
  guest_count: number;
  cost: number;
  status: string;
}

interface Ticket {
  id: string;
  flight_number: string;
  departure: string;
  arrival: string;
  date: string;
  passenger_count: number;
  cost: number;
  status: string;
}

interface Guide {
  id: string;
  name: string;
  service_date: string;
  location: string;
  guest_count: number;
  cost: number;
  status: string;
}

interface PartTime {
  id: string;
  name: string;
  service_date: string;
  location: string;
  hours: number;
  hourly_rate: number;
  status: string;
}

interface DashboardData {
  upcomingProjects: Project[];
  upcomingSejours: Sejour[];
  upcomingTransfers: Transfer[];
  upcomingTickets: Ticket[];
  upcomingGuides: Guide[];
  upcomingPartTime: PartTime[];
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1'];

export default function HomePage() {
  const { canView, canCreate, loading: permissionsLoading } = usePermissions();
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
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [projectsData, sejoursData, ticketOptionsData, categoriesData] = await Promise.allSettled([
        projectsService.getAll(),
        SejourService.getSejours(),
        ticketOptionsService.getAll(),
        categoriesService.getAll()
      ]);

      const getData = (result: PromiseSettledResult<any>) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        console.warn('Dashboard element load failed:', result.reason);
        return [];
      };

      let projects = getData(projectsData);
      if (!Array.isArray(projects)) projects = [];
      projects = projects.map((p: any) => ({
        ...p,
        name: p.title || p.name || 'Untitled',
        client_name: p.company_name || p.client_name || 'Bilinmeyen Müşteri'
      }));

      const sejoursRaw = getData(sejoursData);
      let sejours = Array.isArray(sejoursRaw) ? sejoursRaw : (sejoursRaw?.data || []);
      sejours = sejours.map((s: any) => ({
        ...s,
        name: s.voucherNumber || s.voucher_number || s.customerName || s.customer_name || 'Sejour',
        start_date: s.checkInDate || s.check_in_date,
        end_date: s.checkOutDate || s.check_out_date,
        hotel_name: s.rooms?.[0]?.hotelName || s.hotel_name || '',
        guest_count: s.rooms?.length || 0,
        total_cost: s.totalAmount || s.total_amount || 0
      }));

      const activeProjects = projects.filter((p: any) => (p.status || '').toLowerCase() === 'active');
      const transferBuckets = await Promise.all(
        activeProjects.map((p: any) =>
          projectTransfersService.getByProjectId(p.id).catch(() => [])
        )
      );
      const transfers = transferBuckets
        .flat()
        .map((t: any) => ({
          id: t.id,
          type: t.service_type || t.transfer_type || 'Transfer',
          pickup_location: t.pickup_location || '',
          dropoff_location: t.dropoff_location || '',
          date: t.date || t.transfer_date || '',
          guest_count: t.passenger_count || 0,
          cost: t.cost_amount || 0,
          status: t.status || 'confirmed'
        }));

      let tickets = getData(ticketOptionsData);
      if (!Array.isArray(tickets)) tickets = [];
      tickets = tickets
        .filter((t: any) => (t.status || '').toLowerCase() === 'confirmed')
        .map((t: any) => ({
          id: t.id,
          flight_number: t.airline || t.flight_type || t.voucher_no || 'Bilet',
          departure: t.departure_date || '',
          arrival: t.return_date || '',
          date: t.departure_date || t.entry_date || '',
          passenger_count: t.passenger_count || 0,
          cost: t.total_cost || 0,
          status: t.status || 'confirmed'
        }));

      const cats = Array.isArray(getData(categoriesData)) ? getData(categoriesData) : [];
      const categoryById: Record<string, any> = {};
      cats.forEach((c: any) => { categoryById[c.id] = c; });
      const hrBuckets = await Promise.all(
        activeProjects.map((p: any) =>
          projectHumanResourcesService.getByProjectId(p.id).catch(() => [])
        )
      );
      const hrRows = hrBuckets.flat();

      const guides = hrRows
        .filter((r: any) => {
          const n = (categoryById[r.sub_category_id]?.name || r.sub_category_name || '').toString().toLowerCase();
          return n.includes('rehber') || n.includes('guide');
        })
        .map((r: any) => ({
          id: r.id,
          name: r.description || 'Kokartli Rehber',
          service_date: r.date || r.created_at || '',
          location: r.hotel || '',
          guest_count: 0,
          cost: r.amount || 0,
          status: 'confirmed'
        }));

      const partTime = hrRows
        .filter((r: any) => {
          const n = (categoryById[r.sub_category_id]?.name || r.sub_category_name || '').toString().toLowerCase();
          return (n.includes('part') && n.includes('time')) || n.includes('yari zamanli') || n.includes('insan kaynak');
        })
        .map((r: any) => ({
          id: r.id,
          name: r.description || 'Part-Time',
          service_date: r.date || r.created_at || '',
          location: r.hotel || '',
          hours: 0,
          hourly_rate: 0,
          status: 'confirmed'
        }));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

      const filterUpcoming = <T extends any>(items: T[], dateField: string): T[] => {
        return items.filter(item => {
          const itemAny = item as any;
          const dateVal = itemAny[dateField] || itemAny.start_date || itemAny.check_in_date || itemAny.transfer_date || itemAny.flight_date || itemAny.service_date;
          if (!dateVal) return false;
          const itemDate = new Date(dateVal);
          return itemDate >= today && itemDate <= thirtyDaysFromNow;
        }).sort((a, b) => {
          const aAny = a as any;
          const bAny = b as any;
          const aDate = new Date(aAny[dateField] || aAny.start_date || aAny.check_in_date || aAny.transfer_date || aAny.flight_date || aAny.service_date).getTime();
          const bDate = new Date(bAny[dateField] || bAny.start_date || bAny.check_in_date || bAny.transfer_date || bAny.flight_date || bAny.service_date).getTime();
          return aDate - bDate;
        }).slice(0, 5);
      };

      setDashboardData({
        upcomingProjects: filterUpcoming(projects, 'start_date'),
        upcomingSejours: filterUpcoming(sejours, 'start_date'),
        upcomingTransfers: filterUpcoming(transfers, 'date'),
        upcomingTickets: filterUpcoming(tickets, 'date'),
        upcomingGuides: filterUpcoming(guides, 'service_date'),
        upcomingPartTime: filterUpcoming(partTime, 'service_date')
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

  const StatCard = ({ title, value, icon: Icon, color, link, delay }: { title: string; value: number; icon: any; color: string; link: string, delay: number }) => {
    const colorMap: Record<string, string> = {
      'text-blue-600': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      'text-emerald-600': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      'text-amber-600': 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      'text-purple-600': 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    };

    const colorClass = colorMap[color] || colorMap['text-blue-600'];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        whileHover={{ scale: 1.02, y: -5 }}
        className="relative"
      >
        <Link href={link} className="block h-full">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full min-h-[180px]">
            {/* Top Row: Icon and Trend - Matching Dashboard Layout */}
            <div className="flex items-start justify-between relative z-10">
              <div className={`p-2.5 rounded-xl ${colorClass} border shadow-sm`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center text-[10px] font-black px-2 py-1 rounded-full ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]} border shadow-sm`}>
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>+12%</span>
              </div>
            </div>
            
            {/* Middle Row: Value */}
            <div className="relative z-10 mt-4">
              <div className="flex items-baseline">
                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
                <p className="text-gray-400 dark:text-gray-600 ml-2 text-xs font-bold uppercase tracking-wider">Kayıt</p>
              </div>
            </div>

            {/* Bottom Row: Label */}
            <div className="relative z-10">
              <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.15em]">{title}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-bold">Dönemsel Toplam</p>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  const QuickActionCard = ({ title, desc, icon: Icon, color, link, delay }: { title: string; desc: string; icon: any; color: string; link: string; delay: number }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={link} className="group block">
        <div className={`h-full p-4 rounded-2xl border border-transparent bg-gray-50 dark:bg-gray-900 hover:bg-white dark:hover:bg-gray-800 hover:border-${color.split('-')[1]}-200 dark:hover:border-${color.split('-')[1]}-800 shadow-sm hover:shadow-md transition-all duration-300`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 dark:group-hover:text-gray-400 ml-auto transition-colors" />
          </div>
        </div>
      </Link>
    </motion.div>
  );

  const UpcomingItem = ({ item, icon: Icon, color, dateField, nameField }: any) => (
    <div className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900 transition-all duration-300">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300 border border-transparent group-hover:border-current`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="font-black text-gray-900 dark:text-white text-sm tracking-tight">
            {item[nameField] || item.name || item.voucherNumber || 'İsimsiz'}
          </p>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1 font-bold">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
            {new Date(item[dateField] || item.start_date || item.check_in_date || item.transfer_date || item.flight_date || item.service_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
          YAKLAŞAN
        </span>
        {item.hotel_name && (
          <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 font-bold truncate max-w-[120px] text-right">{item.hotel_name}</span>
        )}
      </div>
    </div>
  );

  if (loading || permissionsLoading) {
    return <LoadingSpinner message="Ana Sayfa hazirlaniyor..." />;
  }

  const canViewProjects = canView(Module.PROJECTS);
  const canViewSejour = canView(Module.SEJOUR);
  const canViewOperations = canView(Module.OPERATIONS);
  const canViewTickets = canView(Module.TICKETS);
  const canViewHotels = canView(Module.HOTELS);
  const canViewSuppliers = canView(Module.SUPPLIERS);
  const canViewAgencies = canView(Module.AGENCIES);
  const canViewCategories = canView(Module.CATEGORIES);
  const canCreateSejour = canCreate(Module.SEJOUR);
  const canCreateQuote = canCreate(Module.QUOTES);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 w-full p-4 lg:p-8">
      {/* Header / Hero Section - Left Aligned & Integrated */}
      <header className="mb-10 relative text-left">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Ana Sayfa
          </h1>
          <div className="flex flex-wrap items-center mt-3 text-gray-500 dark:text-gray-400 gap-y-2">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-blue-500" />
              <span className="text-sm font-bold">
                {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <span className="mx-3 hidden sm:inline opacity-30">|</span>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-blue-500" />
              <span className="text-sm font-bold">Son güncelleme: {lastUpdate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-3 mt-6 justify-start"
        >
          <button 
            onClick={loadDashboardData}
            className="flex items-center px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-black text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            YENİLE
          </button>
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Hızlı ara..."
              className="pl-11 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none w-48 md:w-72 transition-all font-bold text-gray-900 dark:text-white"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3 group-focus-within:text-blue-500 transition-colors" />
          </div>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Stats & Charts */}
        <div className="xl:col-span-2 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {canViewProjects && (
              <StatCard 
                title="Toplam Proje" 
                value={dashboardData.upcomingProjects.length} 
                icon={Briefcase} 
                color="text-blue-600" 
                link="/projects" 
                delay={0.1}
              />
            )}
            {canViewSejour && (
              <StatCard 
                title="Yaklaşan Sejour" 
                value={dashboardData.upcomingSejours.length} 
                icon={Hotel} 
                color="text-emerald-600" 
                link="/sejour" 
                delay={0.2}
              />
            )}
            {canViewOperations && (
              <StatCard 
                title="Aktif Transfer" 
                value={dashboardData.upcomingTransfers.length} 
                icon={Truck} 
                color="text-purple-600" 
                link="/operations/transfers" 
                delay={0.3}
              />
            )}
            {canViewTickets && (
              <StatCard 
                title="Bekleyen Bilet" 
                value={dashboardData.upcomingTickets.length} 
                icon={Plane} 
                color="text-amber-600" 
                link="/operations/tickets" 
                delay={0.4}
              />
            )}
          </div>

          {/* Overview Section with Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-md"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center tracking-tight">
                  <LayoutDashboard className="w-5 h-5 mr-3 text-blue-600" />
                  Operasyon Özeti
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Gelecek 30 gün içindeki planlanan aktiviteler</p>
              </div>
              <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl shadow-inner">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  GRAFİK
                </button>
                <button 
                  onClick={() => setActiveTab('activity')}
                  className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${activeTab === 'activity' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  LİSTE
                </button>
              </div>
            </div>

            <div className="h-[300px] w-full">
              {activeTab === 'overview' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-gray-800" opacity={0.5} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fontWeight: 700 }} 
                      dy={15}
                      stroke="#94a3b8"
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fontWeight: 700 }}
                      stroke="#94a3b8"
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(59, 130, 246, 0.03)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow-xl backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
                              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                              <div className="flex items-baseline space-x-2">
                                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{payload[0].value}</p>
                                <p className="text-xs font-bold text-gray-500">adet</p>
                              </div>
                              <p className="text-[10px] mt-2 font-bold text-gray-400">Planlanan Operasyon</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={45}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                  {dashboardData.upcomingProjects.map((p, i) => (
                    <UpcomingItem key={p.id} item={p} icon={Briefcase} color="text-blue-600" dateField="start_date" nameField="name" />
                  ))}
                  {dashboardData.upcomingSejours.map((s, i) => (
                    <UpcomingItem key={s.id} item={s} icon={Hotel} color="text-emerald-600" dateField="start_date" nameField="name" />
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions Grid */}
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center px-1 tracking-tight">
              <Plus className="w-6 h-6 mr-3 text-blue-600" />
              Hızlı İşlemler
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {canCreateSejour && (
                <QuickActionCard 
                  title="Yeni Sejour" 
                  desc="Rezervasyon kaydı oluştur" 
                  icon={Hotel} 
                  color="text-blue-600" 
                  link="/sejour/create" 
                  delay={0.6}
                />
              )}
              {canCreateQuote && (
                <QuickActionCard 
                  title="Yeni Teklif" 
                  desc="Müşteri teklifi hazırla" 
                  icon={FileText} 
                  color="text-emerald-600" 
                  link="/quotes/create" 
                  delay={0.7}
                />
              )}
              {canViewHotels && (
                <QuickActionCard 
                  title="Yeni Otel" 
                  desc="Sisteme otel ekle" 
                  icon={Hotel} 
                  color="text-indigo-600" 
                  link="/hotels" 
                  delay={0.8}
                />
              )}
              {canViewSuppliers && (
                <QuickActionCard 
                  title="Yeni Tedarikçi" 
                  desc="Tedarikçi kaydı aç" 
                  icon={Users} 
                  color="text-purple-600" 
                  link="/suppliers" 
                  delay={0.9}
                />
              )}
              {canViewAgencies && (
                <QuickActionCard 
                  title="Yeni Acente" 
                  desc="Acente bilgilerini gir" 
                  icon={Briefcase} 
                  color="text-orange-600" 
                  link="/agencies" 
                  delay={1.0}
                />
              )}
              {canViewCategories && (
                <QuickActionCard 
                  title="Yeni Kategori" 
                  desc="Sistem kategorisi ekle" 
                  icon={LayoutDashboard} 
                  color="text-pink-600" 
                  link="/categories" 
                  delay={1.1}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Activities Timeline */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-md overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center tracking-tight">
              <Calendar className="w-5 h-5 mr-3 text-blue-600" />
              Ajanda
            </h3>
            <Link href="/operations" className="text-xs font-black text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800/30">
              TÜMÜNÜ GÖR
            </Link>
          </div>

          <div className="space-y-6 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {/* Project Activities */}
            <section>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Yaklaşan Projeler</h4>
              <div className="space-y-3">
                {dashboardData.upcomingProjects.length > 0 ? (
                  dashboardData.upcomingProjects.map((item) => (
                    <UpcomingItem key={item.id} item={item} icon={Briefcase} color="text-blue-500" dateField="start_date" nameField="name" />
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic ml-1">Kayıt bulunamadı</p>
                )}
              </div>
            </section>

            {/* Transfer Activities */}
            <section>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Yaklaşan Transferler</h4>
              <div className="space-y-3">
                {dashboardData.upcomingTransfers.length > 0 ? (
                  dashboardData.upcomingTransfers.map((item) => (
                    <UpcomingItem key={item.id} item={item} icon={Truck} color="text-indigo-500" dateField="date" nameField="type" />
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic ml-1">Kayıt bulunamadı</p>
                )}
              </div>
            </section>

            {/* Ticket Activities */}
            <section>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Yaklaşan Biletler</h4>
              <div className="space-y-3">
                {dashboardData.upcomingTickets.length > 0 ? (
                  dashboardData.upcomingTickets.map((item) => (
                    <UpcomingItem key={item.id} item={item} icon={Plane} color="text-orange-500" dateField="date" nameField="flight_number" />
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic ml-1">Kayıt bulunamadı</p>
                )}
              </div>
            </section>

            {/* HR Activities */}
            <section>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Rehber & Operasyon</h4>
              <div className="space-y-3">
                {dashboardData.upcomingGuides.map((item) => (
                  <UpcomingItem key={item.id} item={item} icon={UserCheck} color="text-pink-500" dateField="service_date" nameField="name" />
                ))}
                {dashboardData.upcomingPartTime.map((item) => (
                  <UpcomingItem key={item.id} item={item} icon={Clock} color="text-purple-500" dateField="service_date" nameField="name" />
                ))}
                {dashboardData.upcomingGuides.length === 0 && dashboardData.upcomingPartTime.length === 0 && (
                  <p className="text-xs text-gray-400 italic ml-1">Kayıt bulunamadı</p>
                )}
              </div>
            </section>
          </div>

          <div className="mt-8">
            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 text-white relative overflow-hidden group shadow-2xl">
              <div className="relative z-10">
                <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
                  <LayoutDashboard className="w-6 h-6 text-blue-100" />
                </div>
                <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em] mb-2 opacity-80">DESTEK MERKEZİ</p>
                <h5 className="text-lg font-black mb-4 leading-tight">Sistemle ilgili yardıma mı ihtiyacınız var?</h5>
                <button className="bg-white text-blue-700 px-6 py-2.5 rounded-xl text-xs font-black shadow-xl hover:bg-blue-50 hover:scale-105 transition-all flex items-center active:scale-95">
                  REHBERİ GÖRÜNTÜLE <ArrowUpRight className="w-4 h-4 ml-2" />
                </button>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                <LayoutDashboard size={160} />
              </div>
              <div className="absolute top-[-40px] left-[-40px] w-40 h-40 bg-white/5 rounded-full blur-3xl" />
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
