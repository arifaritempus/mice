'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Phone, 
  Mail, 
  Video, 
  UserPlus, 
  MessageSquare, 
  ExternalLink, 
  MapPin, 
  Building2,
  ChevronRight,
  MoreVertical,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  Globe,
  Briefcase,
  TrendingUp,
  Map,
  AtSign,
  Edit2,
  Trash2,
  ChevronDown,
  Info
} from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { marketingService } from '@/lib/supabaseService';
import { usePermissions, Module } from '@/lib/permissions';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { DateRangeFieldAccounting } from '@/components/accounting/DateRangeFieldAccounting';
import ConfirmModal from '@/components/ConfirmModal';

const SERVICE_ITEMS = [
  'MICE',
  'Sejour',
  'Konaklama',
  'Uçak Bileti',
  'Transfer',
  'Organizasyon',
  'Kongre',
  'Yurt Dışı Tur',
  'Yurt İçi Tur'
];

const INTERACTION_TYPES = [
  { value: 'yuz_yuze', label: 'Yüz Yüze', icon: Users, color: 'blue' },
  { value: 'telefon', label: 'Telefon', icon: Phone, color: 'green' },
  { value: 'e_posta', label: 'E-Posta', icon: Mail, color: 'purple' },
  { value: 'online', label: 'Online Toplantı', icon: Video, color: 'orange' },
  { value: 'diger', label: 'Diğer', icon: MessageSquare, color: 'slate' }
];

type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'custom';

export default function MarketingPage() {
  const { canView, canCreate, canEdit, canDelete, loading: permissionsLoading } = usePermissions();
  const [activeTab, setActiveTab] = useState<'clients' | 'interactions' | 'appointments'>('clients');
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  
  // Header Filters
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState<string | null>(null);

  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'client' | 'interaction' } | null>(null);

  useEffect(() => {
    if (period === 'custom') return;

    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    if (period === 'today') {
      // already set to now
    } else if (period === 'week') {
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start.setDate(now.getDate() + diff);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (period === 'month') {
      start.setDate(1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (period === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    }

    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  }, [period]);
  
  // Edit States
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedInteraction, setSelectedInteraction] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsData, interactionsData] = await Promise.all([
        marketingService.clients.getAll(),
        marketingService.interactions.getAll()
      ]);
      setClients(clientsData);
      setInteractions(interactionsData);

      // Fetch all contacts to map them easily
      const contactsPromises = clientsData.map(c => marketingService.contacts.getByClientId(c.id));
      const contactsResults = await Promise.all(contactsPromises);
      setAllContacts(contactsResults.flat());

    } catch (error) {
      console.error('Marketing data load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = !globalSearchTerm || 
        client.name?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
        client.industry?.toLowerCase().includes(globalSearchTerm.toLowerCase());
      
      const matchesType = !clientTypeFilter || client.type === clientTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [clients, globalSearchTerm, clientTypeFilter]);

  const filteredInteractions = useMemo(() => {
    return interactions.filter(interaction => {
      const interactionDate = parseISO(interaction.interaction_date);
      const matchesDate = (!startDate || interactionDate >= parseISO(startDate)) &&
                          (!endDate || interactionDate <= parseISO(endDate));
      
      const matchesSearch = !globalSearchTerm || 
        interaction.marketing_clients?.name?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
        interaction.description?.toLowerCase().includes(globalSearchTerm.toLowerCase());

      return matchesDate && matchesSearch;
    });
  }, [interactions, startDate, endDate, globalSearchTerm]);

  const appointments = useMemo(() => {
    return filteredInteractions.filter(i => i.status === 'planned');
  }, [filteredInteractions]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'client') {
        await marketingService.clients.delete(deleteConfirm.id);
      } else {
        await marketingService.interactions.delete(deleteConfirm.id);
      }
      loadData();
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (permissionsLoading) return <LoadingSpinner />;
  if (!canView(Module.MARKETING)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Erişim Engellendi</h1>
          <p className="text-gray-500 mt-2">Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 p-4 md:p-6 lg:p-8">
      {/* Dashboard Header Style */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Pazarlama Yönetimi</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-start">
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
            {([
              { id: 'today', label: 'Bugün' },
              { id: 'week', label: 'Hafta' },
              { id: 'month', label: 'Ay' },
              { id: 'year', label: 'Yıl' },
              { id: 'custom', label: 'Özel' }
            ] as const).map((item) => (
              <button
                key={item.id}
                onClick={() => setPeriod(item.id)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${
                  period === item.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {period === 'custom' && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="w-72"
              >
                <DateRangeFieldAccounting 
                  label="" 
                  startValue={startDate} 
                  endValue={endDate} 
                  onStartChange={setStartDate} 
                  onEndChange={setEndDate} 
                  hideLabel 
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={loadData}
            className="p-2.5 bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            title="Yenile"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          <div className="flex-1 lg:max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Hızlı ara..."
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={() => {
              setSelectedClient(null);
              setIsClientModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-all shadow-md font-bold text-xs ml-auto"
          >
            <Plus size={16} />
            <span>YENİ EKLE</span>
          </button>
        </div>
      </div>

      {/* Main KPI Grid - Single Row Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardStatBox 
          label="TOPLAM PORTFÖY" 
          value={clients.length} 
          icon={Users} 
          color="blue"
          subValue="Dönemsel Toplam"
          trend={{ type: 'up', text: '5%' }}
          active={clientTypeFilter === null}
          onClick={() => setClientTypeFilter(null)}
        />
        <DashboardStatBox 
          label="ACENTELER" 
          value={clients.filter(c => c.type === 'acenta').length} 
          icon={Briefcase} 
          color="purple"
          subValue="Aktif Acenteler"
          trend={{ type: 'up', text: '2%' }}
          active={clientTypeFilter === 'acenta'}
          onClick={() => setClientTypeFilter('acenta')}
        />
        <DashboardStatBox 
          label="GÖRÜŞMELER" 
          value={filteredInteractions.length} 
          icon={MessageSquare} 
          color="emerald"
          subValue="Bu Ayki Etkileşim"
          trend={{ type: 'up', text: '12%' }}
          active={activeTab === 'interactions'}
          onClick={() => setActiveTab('interactions')}
        />
        <DashboardStatBox 
          label="RANDEVULAR" 
          value={appointments.length} 
          icon={Calendar} 
          color="amber"
          subValue="Bekleyen Planlar"
          active={activeTab === 'appointments'}
          onClick={() => setActiveTab('appointments')}
        />
      </div>

      {/* Content Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-100 dark:border-gray-700 p-1">
          <button 
            onClick={() => setActiveTab('clients')}
            className={`px-6 py-3 text-xs font-black transition-all rounded-lg ${activeTab === 'clients' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            FİRMALAR & ACENTELER
          </button>
          <button 
            onClick={() => setActiveTab('interactions')}
            className={`px-6 py-3 text-xs font-black transition-all rounded-lg ${activeTab === 'interactions' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            GÖRÜŞME GEÇMİŞİ
          </button>
          <button 
            onClick={() => setActiveTab('appointments')}
            className={`px-6 py-3 text-xs font-black transition-all rounded-lg ${activeTab === 'appointments' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            RANDEVULAR
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'clients' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredClients.map((client) => (
                  <ModernClientCard 
                    key={client.id} 
                    client={client} 
                    contacts={allContacts.filter(c => c.client_id === client.id)}
                    onEdit={() => {
                      setSelectedClient(client);
                      setIsClientModalOpen(true);
                    }}
                    onDelete={() => setDeleteConfirm({ id: client.id, type: 'client' })}
                    onAddInteraction={() => {
                      setSelectedClient(client);
                      setSelectedInteraction(null);
                      setIsInteractionModalOpen(true);
                    }}
                    onAddContact={() => {
                      setSelectedClient(client);
                      setIsContactModalOpen(true);
                    }}
                  />
                ))}
              </AnimatePresence>
              {filteredClients.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <p className="text-gray-400 font-bold">Kriterlere uygun kayıt bulunamadı.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'interactions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInteractions.length === 0 ? (
                <div className="col-span-full py-20 text-center">
                  <p className="text-gray-400 font-bold">Görüşme kaydı bulunmuyor.</p>
                </div>
              ) : (
                filteredInteractions.map((interaction) => (
                  <InteractionCard 
                    key={interaction.id} 
                    interaction={interaction} 
                    contacts={allContacts}
                    onEdit={() => {
                      setSelectedInteraction(interaction);
                      setSelectedClient(clients.find(c => c.id === interaction.client_id));
                      setIsInteractionModalOpen(true);
                    }}
                    onDelete={() => setDeleteConfirm({ id: interaction.id, type: 'interaction' })}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {appointments.length === 0 ? (
                <div className="col-span-full py-20 text-center">
                  <p className="text-gray-400 font-bold">Bekleyen randevu bulunmuyor.</p>
                </div>
              ) : (
                appointments.map((app) => (
                  <AppointmentCard 
                    key={app.id} 
                    appointment={app} 
                    contacts={allContacts}
                    onEdit={() => {
                      setSelectedInteraction(app);
                      setSelectedClient(clients.find(c => c.id === app.client_id));
                      setIsInteractionModalOpen(true);
                    }}
                    onDelete={() => setDeleteConfirm({ id: app.id, type: 'interaction' })}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isClientModalOpen && (
        <ClientModal 
          client={selectedClient}
          onClose={() => setIsClientModalOpen(false)} 
          onSave={async (data: any) => {
            if (selectedClient) {
              await marketingService.clients.update(selectedClient.id, data);
            } else {
              await marketingService.clients.create(data);
            }
            loadData();
            setIsClientModalOpen(false);
          }}
        />
      )}

      {isInteractionModalOpen && (
        <InteractionModal 
          client={selectedClient}
          interaction={selectedInteraction}
          onClose={() => setIsInteractionModalOpen(false)} 
          onSave={async (data: any) => {
            const payload = { ...data };
            if (!payload.appointment_date) payload.appointment_date = null;
            
            if (selectedInteraction) {
              await marketingService.interactions.update(selectedInteraction.id, payload);
            } else {
              await marketingService.interactions.create(payload);
            }
            loadData();
            setIsInteractionModalOpen(false);
          }}
        />
      )}

      {isContactModalOpen && (
        <ContactModal 
          client={selectedClient}
          onClose={() => setIsContactModalOpen(false)} 
          onSave={async (data: any) => {
            await marketingService.contacts.create(data);
            loadData();
            setIsContactModalOpen(false);
          }}
        />
      )}

      {deleteConfirm && (
        <ConfirmModal 
          isOpen={true}
          title="Kaydı Sil"
          message={`Bu ${deleteConfirm.type === 'client' ? 'firma/acenta' : 'görüşme'} kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

// Sub-components

function DashboardStatBox({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  color = "blue",
  subValue,
  active,
  onClick
}: any) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-800",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 border-purple-100 dark:border-purple-800",
  };

  return (
    <button 
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border p-5 flex flex-col justify-between text-left transition-all hover:scale-[1.02] ${active ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700'}`}
    >
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-lg ${colors[color] || colors.blue} border`}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold ${
            trend.type === 'up' ? 'text-emerald-600' : 'text-red-500'
          }`}>
            {trend.type === 'up' ? <TrendingUp size={10} /> : <Clock size={10} />}
            {trend.text}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
        <h4 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{value}</h4>
        {subValue && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-bold">{subValue}</p>}
      </div>
    </button>
  );
}

function ModernClientCard({ client, contacts, onEdit, onDelete, onAddInteraction, onAddContact }: any) {
  const [showContacts, setShowContacts] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-blue-500 transition-all group relative"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-all">
          <Building2 size={20} />
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
            client.type === 'acenta' 
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40' 
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40'
          }`}>
            {client.type}
          </span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button onClick={onEdit} className="p-1.5 bg-white dark:bg-gray-800 text-blue-600 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
              <Edit2 size={12} />
            </button>
            <button onClick={onDelete} className="p-1.5 bg-white dark:bg-gray-800 text-red-600 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      <h3 className="font-bold text-gray-900 dark:text-white truncate">{client.name}</h3>
      <div className="flex items-center gap-1 mt-1">
        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate">{client.industry || 'Sektör Belirtilmemiş'}</p>
        {client.city && <span className="text-[10px] text-gray-400 dark:text-gray-500">•</span>}
        {client.city && <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase">{client.city}</p>}
      </div>

      {/* Contacts List Toggle */}
      <div className="mt-4">
        <button 
          onClick={() => setShowContacts(!showContacts)}
          className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase hover:underline"
        >
          {contacts.length} İLGİLİ KİŞİ {showContacts ? <ChevronDown size={12} className="rotate-180" /> : <ChevronDown size={12} />}
        </button>
        
        {showContacts && (
          <div className="mt-2 space-y-2 max-h-32 overflow-y-auto p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-inner">
            {contacts.length === 0 ? (
              <p className="text-[9px] text-gray-400 italic">Henüz kişi eklenmemiş.</p>
            ) : (
              contacts.map((c: any) => (
                <div key={c.id} className="text-[10px] border-b border-gray-50 dark:border-gray-700 last:border-0 pb-1 mb-1">
                  <p className="font-bold text-gray-700 dark:text-gray-300">{c.full_name}</p>
                  <p className="text-gray-500">{c.position}</p>
                  <div className="flex gap-2 text-[9px] text-gray-400 mt-0.5">
                    {c.phone && <span className="flex items-center gap-0.5"><Phone size={8} /> {c.phone}</span>}
                    {c.email && <span className="flex items-center gap-0.5"><Mail size={8} /> {c.email}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button 
          onClick={onAddContact}
          className="flex-1 py-1.5 bg-white dark:bg-gray-800 rounded-lg text-[9px] font-black text-gray-500 hover:bg-blue-500 hover:text-white transition-all border border-gray-100 dark:border-gray-700 uppercase"
        >
          Kişi Ekle
        </button>
        <button 
          onClick={onAddInteraction}
          className="flex-1 py-1.5 bg-blue-600 rounded-lg text-[9px] font-black text-white hover:bg-blue-700 transition-all uppercase shadow-sm"
        >
          Görüşme
        </button>
      </div>
    </motion.div>
  );
}

function InteractionCard({ interaction, contacts, onEdit, onDelete }: any) {
  const type = INTERACTION_TYPES.find(t => t.value === interaction.type) || INTERACTION_TYPES[4];
  const Icon = type.icon;
  
  const colors: any = {
    blue: 'border-l-blue-600 bg-blue-50 dark:bg-blue-950/40',
    green: 'border-l-green-600 bg-green-50 dark:bg-green-950/40',
    purple: 'border-l-purple-600 bg-purple-50 dark:bg-purple-950/40',
    orange: 'border-l-orange-600 bg-orange-50 dark:bg-orange-950/40',
    slate: 'border-l-slate-600 bg-slate-50 dark:bg-slate-950/40'
  };

  const iconColors: any = {
    blue: 'text-blue-700 dark:text-blue-400',
    green: 'text-green-700 dark:text-green-400',
    purple: 'text-purple-700 dark:text-purple-400',
    orange: 'text-orange-700 dark:text-orange-400',
    slate: 'text-slate-700 dark:text-slate-400'
  };

  // Get names of all involved contacts
  const involvedContacts = contacts.filter((c: any) => interaction.contact_ids?.includes(c.id));

  return (
    <div className={`border-l-4 rounded-xl p-5 shadow-sm transition-all hover:shadow-md group ${colors[type.color] || colors.slate} border border-gray-100 dark:border-gray-800/50`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm ${iconColors[type.color]}`}>
            <Icon size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{interaction.marketing_clients?.name}</h4>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">
              {format(parseISO(interaction.interaction_date), 'dd.MM.yyyy HH:mm')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button onClick={onEdit} className="p-1.5 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
              <Edit2 size={10} />
            </button>
            <button onClick={onDelete} className="p-1.5 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
              <Trash2 size={10} />
            </button>
          </div>
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shadow-sm ${
            interaction.status === 'completed' 
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' 
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
          }`}>
            {interaction.status === 'completed' ? 'TAMAMLANDI' : 'RANDEVU'}
          </span>
        </div>
      </div>

      <p className="text-[12px] text-gray-700 dark:text-gray-200 font-semibold leading-relaxed mb-4">
        {interaction.description}
      </p>

      {involvedContacts.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200/50 dark:border-gray-800/50">
          {involvedContacts.map((c: any) => (
            <div key={c.id} className="flex items-center gap-1.5 bg-white/80 dark:bg-gray-800/80 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-black text-white uppercase">
                {c.full_name.charAt(0)}
              </div>
              <span className="text-[10px] font-black text-gray-600 dark:text-gray-300">{c.full_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appointment, contacts, onEdit, onDelete }: any) {
  const involvedContacts = contacts.filter((c: any) => appointment.contact_ids?.includes(c.id));

  return (
    <div className="bg-white dark:bg-gray-800 border-l-4 border-orange-500 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-lg border border-orange-100 dark:border-orange-800/50 shadow-sm">
          <Calendar size={18} />
        </div>
        <div className="flex items-center gap-2">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button onClick={onEdit} className="p-1.5 bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
              <Edit2 size={10} />
            </button>
            <button onClick={onDelete} className="p-1.5 bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
              <Trash2 size={10} />
            </button>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">VAKİT</div>
            <div className="text-xs font-black text-orange-600 dark:text-orange-400">
              {appointment.appointment_date ? format(parseISO(appointment.appointment_date), 'HH:mm') : '-'}
            </div>
          </div>
        </div>
      </div>

      <h4 className="text-xs font-black text-gray-900 dark:text-white mb-1 truncate uppercase tracking-tight">{appointment.marketing_clients?.name}</h4>
      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-widest">
        {appointment.appointment_date ? format(parseISO(appointment.appointment_date), 'dd MMMM yyyy', { locale: tr }) : 'Tarih Belirsiz'}
      </p>
      
      {appointment.description && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 shadow-inner">
          <p className="text-[11px] text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic">{appointment.description}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100 dark:border-gray-700">
        {involvedContacts.length === 0 ? (
          <span className="text-[9px] text-gray-400 flex items-center gap-1 font-bold uppercase"><Info size={10} /> İlgili Kişi Belirtilmemiş</span>
        ) : (
          involvedContacts.map((c: any) => (
            <div key={c.id} className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
              <span className="text-[10px] font-black text-gray-600 dark:text-gray-300">{c.full_name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ClientModal({ client, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    type: client?.type || 'firma',
    industry: client?.industry || '',
    city: client?.city || '',
    district: client?.district || '',
    address: client?.address || '',
    email: client?.email || '',
    country: client?.country || 'Türkiye',
    services: client?.services || [] as string[]
  });

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-left">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">
            {client ? 'Kaydı Düzenle' : 'Yeni Kayıt Ekle'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
        </div>
        
        <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Building2 size={10} /> FİRMA ADI
              </label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">TÜR</label>
              <div className="flex p-1 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {['firma', 'acenta'].map(t => (
                  <button
                    key={t}
                    onClick={() => setFormData({...formData, type: t as any})}
                    className={`flex-1 py-2 text-[10px] font-black rounded-md transition-all uppercase ${formData.type === t ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                  >
                    {t === 'firma' ? 'FİRMA' : 'ACENTA'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <AtSign size={10} /> E-POSTA
              </label>
              <input 
                type="email" 
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SEKTÖR</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                value={formData.industry}
                onChange={e => setFormData({...formData, industry: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Map size={10} /> ŞEHİR
              </label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <MapPin size={10} /> İLÇE
              </label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                value={formData.district}
                onChange={e => setFormData({...formData, district: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ADRES</label>
            <textarea 
              rows={2}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold resize-none"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">HİZMET KALEMLERİ</label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_ITEMS.map(service => (
                <button
                  key={service}
                  onClick={() => handleServiceToggle(service)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${
                    formData.services.includes(service)
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-950 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-xs font-black text-gray-400 uppercase">İptal</button>
          <button onClick={() => onSave(formData)} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black shadow-md uppercase">KAYDET</button>
        </div>
      </motion.div>
    </div>
  );
}

function InteractionModal({ client, interaction, onClose, onSave }: any) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    client_id: client?.id || '',
    contact_ids: interaction?.contact_ids || [] as string[],
    type: interaction?.type || 'telefon',
    description: interaction?.description || '',
    interaction_date: interaction?.interaction_date || new Date().toISOString(),
    status: interaction?.status || 'completed',
    appointment_date: interaction?.appointment_date || ''
  });

  useEffect(() => {
    if (client?.id) {
      marketingService.contacts.getByClientId(client.id).then(setContacts);
    }
  }, [client]);

  const toggleContact = (id: string) => {
    setFormData(prev => ({
      ...prev,
      contact_ids: prev.contact_ids.includes(id)
        ? prev.contact_ids.filter(cid => cid !== id)
        : [...prev.contact_ids, id]
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-left">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">
            {interaction ? 'Görüşmeyi Düzenle' : 'Yeni Görüşme'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                  <span>İLGİLİ KİŞİLER (ÇOKLU SEÇİM)</span>
                  <span className="text-blue-500">{formData.contact_ids.length} SEÇİLİ</span>
                </label>
                <div className="p-2 border border-gray-100 dark:border-gray-700 rounded-lg max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-800 space-y-1">
                  {contacts.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic p-2">Henüz kayıtlı kişi yok.</p>
                  ) : (
                    contacts.map(c => (
                      <button
                        key={c.id}
                        onClick={() => toggleContact(c.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-md text-[10px] font-bold transition-all ${
                          formData.contact_ids.includes(c.id)
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        }`}
                      >
                        <span>{c.full_name}</span>
                        {formData.contact_ids.includes(c.id) && <CheckCircle2 size={12} />}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">GÖRÜŞME TÜRÜ</label>
                <div className="grid grid-cols-3 gap-2">
                  {INTERACTION_TYPES.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setFormData({...formData, type: type.value})}
                      className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border transition-all ${
                        formData.type === type.value 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-gray-100 dark:border-gray-800 text-gray-400'
                      }`}
                    >
                      <type.icon size={16} />
                      <span className="text-[8px] font-black uppercase">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">DURUM</label>
                <div className="flex p-1 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={() => setFormData({...formData, status: 'completed'})}
                    className={`flex-1 py-2 text-[10px] font-black rounded-md transition-all ${formData.status === 'completed' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                  >
                    TAMAMLANDI
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, status: 'planned'})}
                    className={`flex-1 py-2 text-[10px] font-black rounded-md transition-all ${formData.status === 'planned' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                  >
                    RANDEVU
                  </button>
                </div>
              </div>

              {formData.status === 'planned' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-orange-500">RANDEVU TARİHİ</label>
                  <input 
                    type="datetime-local" 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-orange-200 dark:border-orange-900 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold"
                    value={formData.appointment_date ? formData.appointment_date.split('.')[0] : ''}
                    onChange={e => setFormData({...formData, appointment_date: e.target.value})}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">KAYIT TARİHİ</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                  value={formData.interaction_date.split('.')[0]}
                  onChange={e => setFormData({...formData, interaction_date: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">GÖRÜŞME ÖZETİ & NOTLAR</label>
            <textarea 
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold resize-none"
              placeholder="Konuşulan detayları buraya yazın..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-950 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-xs font-black text-gray-400 uppercase">Vazgeç</button>
          <button onClick={() => onSave(formData)} className="px-10 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black shadow-md uppercase">KAYDET</button>
        </div>
      </motion.div>
    </div>
  );
}

function ContactModal({ client, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    client_id: client?.id,
    full_name: '',
    position: '',
    phone: '',
    email: '',
    is_primary: false
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-left">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">İlgili Kişi Ekle</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{client?.name}</p>
        </div>
        
        <div className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">AD SOYAD</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">POZİSYON</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
              value={formData.position}
              onChange={e => setFormData({...formData, position: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">TELEFON</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-POSTA</label>
              <input 
                type="email" 
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="kisi@firma.com"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-950 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-xs font-black text-gray-400 uppercase">İPTAL</button>
          <button 
            onClick={() => onSave(formData)}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black shadow-md"
          >
            EKLE
          </button>
        </div>
      </motion.div>
    </div>
  );
}
