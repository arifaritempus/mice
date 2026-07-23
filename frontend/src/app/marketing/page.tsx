"use client";

import { useState, useEffect, useMemo } from "react";
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
  Info,
} from "lucide-react";
import { format, isWithinInterval, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { marketingService } from "@/lib/supabaseService";
import { usePermissions, Module } from "@/lib/permissions";
import { useLanguage } from "@/components/providers/LanguageProvider";
import LoadingSpinner from "@/components/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
import ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import ConfirmModal from "@/components/ConfirmModal";
import Modal from "@/components/Modal";

const SERVICE_ITEMS = [
  "MICE",
  "Sejour",
  "Konaklama",
  "Uçak Bileti",
  "Transfer",
  "Organizasyon",
  "Kongre",
  "Yurt Dışı Tur",
  "Yurt İçi Tur",
];

const INTERACTION_TYPES = [
  { value: "yuz_yuze", label: "Yüz Yüze", icon: Users, color: "blue" },
  { value: "telefon", label: "Telefon", icon: Phone, color: "green" },
  { value: "e_posta", label: "E-Posta", icon: Mail, color: "purple" },
  { value: "online", label: "Online Toplantı", icon: Video, color: "orange" },
  { value: "diger", label: "Diğer", icon: MessageSquare, color: "slate" },
];

export default function MarketingPage() {
  const {
    canView,
    canCreate,
    canEdit,
    canDelete,
    loading: permissionsLoading,
  } = usePermissions();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    "clients" | "interactions" | "appointments"
  >("clients");
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [allContacts, setAllContacts] = useState<any[]>([]);

  // Header Filters
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [searchTokens, setSearchTokens] = useState<string[]>([]);
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState<string | null>(null);

  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    type: "client" | "interaction";
  } | null>(null);

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
        marketingService.interactions.getAll(),
      ]);
      setClients(clientsData);
      setInteractions(interactionsData);

      // Fetch all contacts to map them easily
      const contactsPromises = clientsData.map((c) =>
        marketingService.contacts.getByClientId(c.id),
      );
      const contactsResults = await Promise.all(contactsPromises);
      setAllContacts(contactsResults.flat());
    } catch (error) {
      console.error("Marketing data load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const searchStr = [
        client.name,
        client.industry,
        client.type,
        client.contact_person,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const terms = [...searchTokens, globalSearchTerm.trim()].filter(Boolean);
      const matchesSearch =
        terms.length === 0 ||
        terms.every((token) => searchStr.includes(token.toLowerCase()));

      const matchesType = !clientTypeFilter || client.type === clientTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [clients, globalSearchTerm, searchTokens, clientTypeFilter]);

  const filteredInteractions = useMemo(() => {
    return interactions.filter((interaction) => {
      const interactionDateStr =
        interaction.appointment_date || interaction.interaction_date;
      if (!interactionDateStr) return false;
      const interactionDate = parseISO(interactionDateStr);
      const matchesDate =
        (!startDate || interactionDate >= parseISO(startDate)) &&
        (!endDate || interactionDate <= parseISO(endDate));

      const searchStr = [
        interaction.marketing_clients?.name,
        interaction.description,
        interaction.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const terms = [...searchTokens, globalSearchTerm.trim()].filter(Boolean);
      const matchesSearch =
        terms.length === 0 ||
        terms.every((token) => searchStr.includes(token.toLowerCase()));

      return matchesDate && matchesSearch;
    });
  }, [interactions, startDate, endDate, globalSearchTerm, searchTokens]);

  const appointments = useMemo(() => {
    return filteredInteractions.filter((i) => i.status === "planned");
  }, [filteredInteractions]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === "client") {
        await marketingService.clients.delete(deleteConfirm.id);
      } else {
        await marketingService.interactions.delete(deleteConfirm.id);
      }
      loadData();
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (permissionsLoading) return <LoadingSpinner />;
  if (!canView(Module.MARKETING)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-v3-text">
            {t('marketing.accessDenied') || "Erişim Engellendi"}
          </h1>
          <p className="text-gray-500 mt-2">
            {t('marketing.accessDeniedDesc') || "Bu sayfayı görüntüleme yetkiniz bulunmamaktadır."}
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden pt-4 pb-20 px-4 sm:px-8 gap-6 custom-scrollbar font-sans text-v3-text">
      <div className="w-full min-w-0 flex flex-col flex-1 space-y-4">
        {/* Unified Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2 shrink-0">
          {/* Left Side: Title + Date Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 shrink-0">
            <div className="shrink-0">
              <h1 className="text-2xl font-light tracking-wide text-v3-text glow-text">
                {t('marketing.title') || "Pazarlama Yönetimi"}
              </h1>
              <p className="text-xs text-v3-muted mt-1">
                {t('marketing.subtitle') || "Pazarlama verilerinizi analiz edin ve yönetin"}
              </p>
            </div>
            <div className="w-[240px] shrink-0">
              <ResponsiveDateRangeField
                label={t('marketing.dateRange') || "Tarih Aralığı"}
                startValue={startDate}
                endValue={endDate}
                onStartChange={setStartDate}
                onEndChange={setEndDate}
                onApply={() => loadData()}
              />
            </div>
          </div>

          {/* Right Side: Search and Actions */}
          <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
            <div className="flex-[2] min-w-[300px]">
              <MultiTokenFilterInput
                label={t('marketing.search') || "Genel Arama (Firma, Sektör vb.)"}
                tokens={searchTokens}
                inputValue={globalSearchTerm}
                suggestions={[]}
                onInputChange={setGlobalSearchTerm}
                onAddToken={(val) => {
                  const trimmed = val.trim();
                  if (trimmed && !searchTokens.includes(trimmed)) {
                    setSearchTokens((prev) => [...prev, trimmed]);
                    setGlobalSearchTerm("");
                  }
                }}
                onRemoveToken={(val) =>
                  setSearchTokens((prev) => prev.filter((t) => t !== val))
                }
              />
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={loadData}
                className="w-10 h-10 inline-flex items-center justify-center bg-v3-border hover:bg-v3-surface text-v3-text border border-v3-border rounded-xl transition-all duration-300 hover:scale-105"
                title="Yenile"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
              <button
                onClick={() => {
                  setSelectedClient(null);
                  setIsClientModalOpen(true);
                }}
                className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 hover:scale-105"
              >
                <Plus size={14} /> {t('marketing.addNew') || "YENİ EKLE"}
              </button>
            </div>
          </div>
        </div>

        {/* Main KPI Grid - Single Row Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <DashboardStatBox
            label={t('marketing.totalPortfolio') || "TOPLAM PORTFÖY"}
            value={clients.length}
            icon={Users}
            color="blue"
            subValue={t('marketing.periodTotal') || "Dönemsel Toplam"}
            trend={{ type: "up", text: "5%" }}
            active={clientTypeFilter === null}
            onClick={() => setClientTypeFilter(null)}
          />
          <DashboardStatBox
            label={t('marketing.agencies') || "ACENTELER"}
            value={clients.filter((c) => c.type === "acenta").length}
            icon={Briefcase}
            color="purple"
            subValue={t('marketing.activeAgencies') || "Aktif Acenteler"}
            trend={{ type: "up", text: "2%" }}
            active={clientTypeFilter === "acenta"}
            onClick={() => setClientTypeFilter("acenta")}
          />
          <DashboardStatBox
            label={t('marketing.interactions') || "GÖRÜŞMELER"}
            value={filteredInteractions.length}
            icon={MessageSquare}
            color="emerald"
            subValue={t('marketing.thisMonthInteraction') || "Bu Ayki Etkileşim"}
            trend={{ type: "up", text: "12%" }}
            active={activeTab === "interactions"}
            onClick={() => setActiveTab("interactions")}
          />
          <DashboardStatBox
            label={t('marketing.appointments') || "RANDEVULAR"}
            value={appointments.length}
            icon={Calendar}
            color="amber"
            subValue={t('marketing.pendingPlans') || "Bekleyen Planlar"}
            active={activeTab === "appointments"}
            onClick={() => setActiveTab("appointments")}
          />
        </div>

        {/* Content Section */}
        <div className="bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-v3-border flex flex-col flex-1 shadow-inner min-h-[500px]">
          <div className="flex border-b border-v3-border p-2 gap-2 overflow-x-auto custom-scrollbar shrink-0 rounded-t-2xl">
            <button
              onClick={() => setActiveTab("clients")}
              className={`px-4 py-2 text-[11px] font-semibold tracking-widest transition-all duration-300 rounded-xl whitespace-nowrap ${activeTab === "clients" ? "bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]" : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"}`}
            >
              {t('marketing.firmsAndAgencies') || "FİRMALAR & ACENTELER"}
            </button>
            <button
              onClick={() => setActiveTab("interactions")}
              className={`px-4 py-2 text-[11px] font-semibold tracking-widest transition-all duration-300 rounded-xl whitespace-nowrap ${activeTab === "interactions" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]" : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"}`}
            >
              {t('marketing.interactionHistory') || "GÖRÜŞME GEÇMİŞİ"}
            </button>
            <button
              onClick={() => setActiveTab("appointments")}
              className={`px-4 py-2 text-[11px] font-semibold tracking-widest transition-all duration-300 rounded-xl whitespace-nowrap ${activeTab === "appointments" ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]" : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"}`}
            >
              {t('marketing.appointments') || "RANDEVULAR"}
            </button>
          </div>

          <div className="flex-1 overflow-visible p-4 sm:p-6">
            {activeTab === "clients" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                  {filteredClients.map((client) => (
                    <ModernClientCard
                      key={client.id}
                      client={client}
                      contacts={allContacts.filter(
                        (c) => c.client_id === client.id,
                      )}
                      onEdit={() => {
                        setSelectedClient(client);
                        setIsClientModalOpen(true);
                      }}
                      onDelete={() =>
                        setDeleteConfirm({ id: client.id, type: "client" })
                      }
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
                    <p className="text-gray-400 font-bold">
                      {t('marketing.noRecords') || "Kriterlere uygun kayıt bulunamadı."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "interactions" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInteractions.length === 0 ? (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-gray-400 font-bold">
                      {t('marketing.noInteractions') || "Görüşme kaydı bulunmuyor."}
                    </p>
                  </div>
                ) : (
                  filteredInteractions.map((interaction) => (
                    <InteractionCard
                      key={interaction.id}
                      interaction={interaction}
                      contacts={allContacts}
                      onEdit={() => {
                        setSelectedInteraction(interaction);
                        setSelectedClient(
                          clients.find((c) => c.id === interaction.client_id),
                        );
                        setIsInteractionModalOpen(true);
                      }}
                      onDelete={() =>
                        setDeleteConfirm({
                          id: interaction.id,
                          type: "interaction",
                        })
                      }
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "appointments" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {appointments.length === 0 ? (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-gray-400 font-bold">
                      {t('marketing.noAppointments') || "Bekleyen randevu bulunmuyor."}
                    </p>
                  </div>
                ) : (
                  appointments.map((app) => (
                    <AppointmentCard
                      key={app.id}
                      appointment={app}
                      contacts={allContacts}
                      onEdit={() => {
                        setSelectedInteraction(app);
                        setSelectedClient(
                          clients.find((c) => c.id === app.client_id),
                        );
                        setIsInteractionModalOpen(true);
                      }}
                      onDelete={() =>
                        setDeleteConfirm({ id: app.id, type: "interaction" })
                      }
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
              if (!payload.appointment_date) {
                payload.appointment_date = null;
              } else {
                try {
                  payload.appointment_date = new Date(
                    payload.appointment_date,
                  ).toISOString();
                } catch (e) {}
              }
              if (payload.interaction_date) {
                try {
                  payload.interaction_date = new Date(
                    payload.interaction_date,
                  ).toISOString();
                } catch (e) {}
              }

              if (selectedInteraction) {
                await marketingService.interactions.update(
                  selectedInteraction.id,
                  payload,
                );
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
            title={t('marketing.deleteRecord') || "Kaydı Sil"}
            message={deleteConfirm.type === "client" ? (t('marketing.deleteClientMsg') || "Bu firma/acenta kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.") : (t('marketing.deleteInteractionMsg') || "Bu görüşme kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")}
            onConfirm={handleDelete}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </div>
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
  onClick,
}: any) {
  const colorMap: Record<
    string,
    { bg: string; text: string; border: string; shadow: string; hover: string }
  > = {
    blue: {
      bg: "bg-blue-500/20",
      text: "text-blue-600 dark:text-blue-300",
      border: "border-blue-500/30",
      shadow: "shadow-[0_0_15px_rgba(59,130,246,0.15)]",
      hover: "hover:border-blue-500/50",
    },
    emerald: {
      bg: "bg-emerald-500/20",
      text: "text-emerald-600 dark:text-emerald-300",
      border: "border-emerald-500/30",
      shadow: "shadow-[0_0_15px_rgba(16,185,129,0.15)]",
      hover: "hover:border-emerald-500/50",
    },
    amber: {
      bg: "bg-amber-500/20",
      text: "text-amber-600 dark:text-amber-300",
      border: "border-amber-500/30",
      shadow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
      hover: "hover:border-amber-500/50",
    },
    purple: {
      bg: "bg-purple-500/20",
      text: "text-purple-300",
      border: "border-purple-500/30",
      shadow: "shadow-[0_0_15px_rgba(168,85,247,0.15)]",
      hover: "hover:border-purple-500/50",
    },
  };

  const activeStyles = active
    ? `${colorMap[color].border} ${colorMap[color].shadow}`
    : `border-v3-border ${colorMap[color].hover} hover:bg-v3-border`;

  return (
    <button
      onClick={onClick}
      className={`bg-v3-surface backdrop-blur-md rounded-2xl border p-4 flex flex-col text-left transition-all duration-300 ${activeStyles}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div
          className={`p-2 rounded-xl ${colorMap[color].bg} ${colorMap[color].text}`}
        >
          <Icon size={18} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-[10px] font-bold ${
              trend.type === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-red-400"
            }`}
          >
            {trend.type === "up" ? (
              <TrendingUp size={12} />
            ) : (
              <Clock size={12} />
            )}
            {trend.text}
          </div>
        )}
      </div>
      <div>
        <p
          className={`text-[11px] font-medium mb-1 ${colorMap[color].text} opacity-80`}
        >
          {label}
        </p>
        <h4 className="text-2xl font-light text-v3-text">{value}</h4>
        {subValue && (
          <p className="text-[10px] text-v3-muted mt-1">{subValue}</p>
        )}
      </div>
    </button>
  );
}

function ModernClientCard({
  client,
  contacts,
  onEdit,
  onDelete,
  onAddInteraction,
  onAddContact,
}: any) {
  const { t } = useLanguage();
  const [showContacts, setShowContacts] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-v3-surface backdrop-blur-md border border-v3-border rounded-2xl p-5 hover:border-blue-500/50 transition-all group relative shadow-[0_0_15px_rgba(0,0,0,0.2)]"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-v3-border border border-v3-border rounded-xl flex items-center justify-center text-v3-muted group-hover:text-blue-600 dark:text-blue-400 transition-all">
          <Building2 size={20} />
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
              client.type === "acenta"
                ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                : "bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30"
            }`}
          >
            {client.type}
          </span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-all"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      <h3 className="font-medium text-v3-text truncate">{client.name}</h3>
      <div className="flex items-center gap-1 mt-1">
        <p className="text-[10px] font-medium text-v3-muted uppercase tracking-wider truncate">
          {client.industry || t('marketing.industryNotSpecified') || "Sektör Belirtilmemiş"}
        </p>
        {client.city && <span className="text-[10px] text-slate-600">•</span>}
        {client.city && (
          <p className="text-[10px] font-medium text-v3-muted uppercase">
            {client.city}
          </p>
        )}
      </div>

      {/* Contacts List Toggle */}
      <div className="mt-4">
        <button
          onClick={() => setShowContacts(!showContacts)}
          className="flex items-center gap-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase hover:text-blue-600 dark:text-blue-300 transition-colors"
        >
          {contacts.length} {t('marketing.relatedContacts') || "İLGİLİ KİŞİ"} 
          {showContacts ? (
            <ChevronDown size={12} className="rotate-180" />
          ) : (
            <ChevronDown size={12} />
          )}
        </button>

        {showContacts && (
          <div className="mt-2 space-y-2 max-h-32 overflow-y-auto p-2 bg-v3-border rounded-xl border border-v3-border custom-scrollbar">
            {contacts.length === 0 ? (
              <p className="text-[9px] text-v3-muted italic">
                {t('marketing.noContacts') || "Henüz kişi eklenmemiş."}
              </p>
            ) : (
              contacts.map((c: any) => (
                <div
                  key={c.id}
                  className="text-[10px] border-b border-v3-border last:border-0 pb-1 mb-1"
                >
                  <p className="font-medium text-v3-text">{c.full_name}</p>
                  <p className="text-v3-muted">{c.position}</p>
                  <div className="flex gap-2 text-[9px] text-v3-muted mt-0.5">
                    {c.phone && (
                      <span className="flex items-center gap-0.5">
                        <Phone size={8} /> {c.phone}
                      </span>
                    )}
                    {c.email && (
                      <span className="flex items-center gap-0.5">
                        <Mail size={8} /> {c.email}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-v3-border">
        <button
          onClick={onAddContact}
          className="flex-1 py-1.5 bg-v3-border rounded-xl text-[9px] font-semibold text-v3-text hover:bg-v3-surface hover:text-v3-text transition-all border border-v3-border uppercase"
        >
          {t('marketing.addContact') || "Kişi Ekle"}
        </button>
        <button
          onClick={onAddInteraction}
          className="flex-1 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-xl text-[9px] font-semibold text-blue-600 dark:text-blue-300 hover:bg-blue-500/30 transition-all uppercase"
        >
          {t('marketing.interaction') || "Görüşme"}
        </button>
      </div>
    </motion.div>
  );
}

function InteractionCard({ interaction, contacts, onEdit, onDelete }: any) {
  const { t } = useLanguage();
  const type =
    INTERACTION_TYPES.find((t) => t.value === interaction.type) ||
    INTERACTION_TYPES[4];
  const Icon = type.icon;

  const colors: any = {
    blue: "border-l-blue-500 bg-v3-surface",
    green: "border-l-emerald-500 bg-v3-surface",
    purple: "border-l-purple-500 bg-v3-surface",
    orange: "border-l-orange-500 bg-v3-surface",
    slate: "border-l-slate-500 bg-v3-surface",
  };

  const iconColors: any = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-500/20 border-blue-500/30",
    green: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
    purple: "text-purple-400 bg-purple-500/20 border-purple-500/30",
    orange: "text-orange-600 dark:text-orange-400 bg-orange-500/20 border-orange-500/30",
    slate: "text-v3-muted bg-slate-500/20 border-slate-500/30",
  };

  // Get names of all involved contacts
  const involvedContacts = contacts.filter((c: any) =>
    interaction.contact_ids?.includes(c.id),
  );

  return (
    <div
      className={`border-l-4 rounded-2xl p-5 shadow-[0_0_15px_rgba(0,0,0,0.2)] transition-all group ${colors[type.color] || colors.slate} backdrop-blur-md border border-v3-border`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${iconColors[type.color]}`}>
            <Icon size={18} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-v3-text uppercase tracking-tight">
              {interaction.marketing_clients?.name}
            </h4>
            <p className="text-[10px] font-medium text-v3-muted uppercase tracking-wider mt-0.5">
              {interaction.appointment_date
                ? format(
                    parseISO(interaction.appointment_date),
                    "dd.MM.yyyy HH:mm",
                  )
                : interaction.interaction_date
                  ? format(
                      parseISO(interaction.interaction_date),
                      "dd.MM.yyyy HH:mm",
                    )
                  : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-all"
            >
              <Edit2 size={10} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-all"
            >
              <Trash2 size={10} />
            </button>
          </div>
          <span
            className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${
              interaction.status === "completed"
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30"
                : "bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30"
            }`}
          >
            {interaction.status === "completed" ? (t('marketing.completed') || "TAMAMLANDI") : (t('marketing.appointment') || "RANDEVU")}
          </span>
        </div>
      </div>

      <p className="text-[12px] text-v3-text font-medium leading-relaxed mb-4">
        {interaction.description}
      </p>

      {involvedContacts.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-v3-border">
          {involvedContacts.map((c: any) => (
            <div
              key={c.id}
              className="flex items-center gap-1.5 bg-v3-border px-2.5 py-1 rounded-lg border border-v3-border"
            >
              <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[8px] font-bold text-blue-600 dark:text-blue-300 uppercase">
                {c.full_name.charAt(0)}
              </div>
              <span className="text-[10px] font-medium text-v3-text">
                {c.full_name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appointment, contacts, onEdit, onDelete }: any) {
  const { t } = useLanguage();
  const involvedContacts = contacts.filter((c: any) =>
    appointment.contact_ids?.includes(c.id),
  );

  return (
    <div className="bg-v3-surface backdrop-blur-md border-l-4 border-l-amber-500 rounded-2xl p-5 shadow-[0_0_15px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all group border border-v3-border">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/30">
          <Calendar size={18} />
        </div>
        <div className="flex items-center gap-2">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-all"
            >
              <Edit2 size={10} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-all"
            >
              <Trash2 size={10} />
            </button>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-medium text-v3-muted uppercase tracking-wider">
              {t('marketing.time') || "VAKİT"}
            </div>
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              {appointment.appointment_date
                ? format(parseISO(appointment.appointment_date), "HH:mm")
                : "-"}
            </div>
          </div>
        </div>
      </div>

      <h4 className="text-xs font-semibold text-v3-text mb-1 truncate uppercase tracking-tight">
        {appointment.marketing_clients?.name}
      </h4>
      <p className="text-[10px] font-medium text-v3-muted mb-3 uppercase tracking-wider">
        {appointment.appointment_date
          ? format(parseISO(appointment.appointment_date), "dd MMMM yyyy", {
              locale: tr,
            })
          : "Tarih Belirsiz"}
      </p>

      {appointment.description && (
        <div className="mb-4 p-3 bg-v3-border rounded-xl border border-v3-border">
          <p className="text-[11px] text-v3-text font-medium leading-relaxed italic">
            {appointment.description}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-v3-border">
        {involvedContacts.length === 0 ? (
          <span className="text-[9px] text-v3-muted flex items-center gap-1 font-medium uppercase">
            <Info size={10} /> İlgili Kişi Belirtilmemiş
          </span>
        ) : (
          involvedContacts.map((c: any) => (
            <div
              key={c.id}
              className="flex items-center gap-1.5 bg-v3-border px-2 py-0.5 rounded-lg border border-v3-border"
            >
              <span className="text-[10px] font-medium text-v3-text">
                {c.full_name}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ClientModal({ client, onClose, onSave }: any) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: client?.name || "",
    type: client?.type || "firma",
    industry: client?.industry || "",
    city: client?.city || "",
    district: client?.district || "",
    address: client?.address || "",
    email: client?.email || "",
    country: client?.country || "Türkiye",
    services: client?.services || ([] as string[]),
  });

  const handleServiceToggle = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const getServiceLabel = (srv: string) => {
    switch (srv) {
      case "Konaklama": return t('marketing.srvAccommodation') || srv;
      case "Uçak Bileti": return t('marketing.srvFlightTicket') || srv;
      case "Transfer": return t('marketing.srvTransfer') || srv;
      case "Organizasyon": return t('marketing.srvOrganization') || srv;
      case "Kongre": return t('marketing.srvCongress') || srv;
      case "Yurt Dışı Tur": return t('marketing.srvInternationalTour') || srv;
      case "Yurt İçi Tur": return t('marketing.srvDomesticTour') || srv;
      default: return srv;
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={client ? (t('marketing.editRecord') || "Kaydı Düzenle") : (t('marketing.addRecord') || "Yeni Kayıt Ekle")}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 text-v3-text">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-v3-text ml-1 flex items-center gap-1">
              <Building2 size={12} /> {t('marketing.companyName') || "FİRMA ADI"}
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm placeholder-slate-400 text-v3-text transition-all"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-v3-text ml-1">{t('marketing.type') || "TÜR"}</label>
            <div className="flex p-1 bg-v3-surface rounded-xl border border-v3-border">
              {["firma", "acenta"].map((typeValue) => (
                <button
                  key={typeValue}
                  onClick={() => setFormData({ ...formData, type: typeValue as any })}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all uppercase ${formData.type === typeValue ? "bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30" : "text-v3-muted border border-transparent hover:text-v3-text hover:bg-v3-border"}`}
                >
                  {typeValue === "firma" ? (t('marketing.firm') || "FİRMA") : (t('marketing.agency') || "ACENTA")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-v3-text ml-1 flex items-center gap-1">
              <AtSign size={12} /> {t('marketing.emailLabel') || "E-POSTA"}
            </label>
            <input
              type="email"
              className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm placeholder-slate-400 text-v3-text transition-all"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-v3-text ml-1">
              {t('marketing.industry') || "SEKTÖR"}
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm placeholder-slate-400 text-v3-text transition-all"
              value={formData.industry}
              onChange={(e) =>
                setFormData({ ...formData, industry: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-v3-text ml-1 flex items-center gap-1">
              <Map size={12} /> {t('marketing.city') || "ŞEHİR"}
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm placeholder-slate-400 text-v3-text transition-all"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-v3-text ml-1 flex items-center gap-1">
              <MapPin size={12} /> {t('marketing.district') || "İLÇE"}
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm placeholder-slate-400 text-v3-text transition-all"
              value={formData.district}
              onChange={(e) =>
                setFormData({ ...formData, district: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-v3-text ml-1">{t('marketing.address') || "ADRES"}</label>
          <textarea
            rows={2}
            className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm placeholder-slate-400 text-v3-text transition-all resize-none"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-v3-text ml-1">
            {t('marketing.serviceItems') || "HİZMET KALEMLERİ"}
          </label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_ITEMS.map((service) => (
              <button
                key={service}
                onClick={() => handleServiceToggle(service)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  formData.services.includes(service)
                    ? "bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30"
                    : "bg-v3-border border-v3-border text-v3-muted hover:text-v3-text hover:bg-v3-surface"
                }`}
              >
                {getServiceLabel(service)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-v3-border">
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-semibold text-v3-text hover:text-v3-text transition-colors"
          >
            {t('marketing.cancel') || "İPTAL"}
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-8 py-2.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 rounded-xl text-xs font-semibold transition-all uppercase"
          >
            {t('marketing.save') || "KAYDET"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function InteractionModal({ client, interaction, onClose, onSave }: any) {
  const { t } = useLanguage();
  const [contacts, setContacts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    client_id: client?.id || "",
    contact_ids: interaction?.contact_ids || ([] as string[]),
    type: interaction?.type || "telefon",
    description: interaction?.description || "",
    interaction_date: interaction?.interaction_date || new Date().toISOString(),
    status: interaction?.status || "completed",
    appointment_date: interaction?.appointment_date || "",
  });

  const formatForInput = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "yyyy-MM-dd'T'HH:mm");
    } catch {
      return dateStr.substring(0, 16);
    }
  };

  useEffect(() => {
    if (client?.id) {
      marketingService.contacts.getByClientId(client.id).then(setContacts);
    }
  }, [client]);

  const toggleContact = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      contact_ids: prev.contact_ids.includes(id)
        ? prev.contact_ids.filter((cid) => cid !== id)
        : [...prev.contact_ids, id],
    }));
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={interaction ? "Görüşmeyi Düzenle" : "Yeni Görüşme"}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 text-v3-text">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-v3-text ml-1 flex items-center justify-between">
                <span>İLGİLİ KİŞİLER (ÇOKLU SEÇİM)</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {formData.contact_ids.length} SEÇİLİ
                </span>
              </label>
              <div className="p-2 border border-v3-border rounded-xl max-h-40 overflow-y-auto bg-v3-surface space-y-1 custom-scrollbar">
                {contacts.length === 0 ? (
                  <p className="text-[10px] text-v3-muted italic p-2">
                    Henüz kayıtlı kişi yok.
                  </p>
                ) : (
                  contacts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => toggleContact(c.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-[10px] font-semibold transition-all border ${
                        formData.contact_ids.includes(c.id)
                          ? "bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30"
                          : "bg-v3-border border-transparent text-v3-muted hover:bg-v3-surface hover:text-v3-text"
                      }`}
                    >
                      <span>{c.full_name}</span>
                      {formData.contact_ids.includes(c.id) && (
                        <CheckCircle2 size={12} />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-v3-text ml-1">
                GÖRÜŞME TÜRÜ
              </label>
              <div className="grid grid-cols-3 gap-2">
                {INTERACTION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() =>
                      setFormData({ ...formData, type: type.value })
                    }
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all ${
                      formData.type === type.value
                        ? "bg-blue-500/20 border-blue-500/30 text-blue-600 dark:text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                        : "border-v3-border bg-v3-border text-v3-muted hover:bg-v3-surface hover:text-v3-text"
                    }`}
                  >
                    <type.icon size={16} />
                    <span className="text-[9px] font-semibold uppercase">
                      {type.value === 'yuz_yuze' ? (t('marketing.faceToFace') || "Yüz Yüze") :
                       type.value === 'telefon' ? (t('marketing.phone') || "Telefon") :
                       type.value === 'e_posta' ? (t('marketing.email') || "E-Posta") :
                       type.value === 'online' ? (t('marketing.onlineMeeting') || "Online Toplantı") :
                       (t('home.other') || "Diğer")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-v3-text ml-1">
                {t('marketing.status') || "DURUM"}
              </label>
              <div className="flex p-1 bg-v3-surface rounded-xl border border-v3-border">
                <button
                  onClick={() =>
                    setFormData({ ...formData, status: "completed" })
                  }
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${formData.status === "completed" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30" : "text-v3-muted border border-transparent hover:bg-v3-border"}`}
                >
                  {t('marketing.completed') || "TAMAMLANDI"}
                </button>
                <button
                  onClick={() =>
                    setFormData({ ...formData, status: "planned" })
                  }
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${formData.status === "planned" ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30" : "text-v3-muted border border-transparent hover:bg-v3-border"}`}
                >
                  {t('marketing.appointment') || "RANDEVU"}
                </button>
              </div>
            </div>

            {formData.status === "planned" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-amber-600 dark:text-amber-400 ml-1">
                  {t('marketing.appointmentDate') || "RANDEVU TARİHİ"}
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2.5 bg-v3-surface border border-amber-500/30 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50 text-sm placeholder-slate-400 text-v3-text transition-all shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                  value={formatForInput(formData.appointment_date)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      appointment_date: e.target.value,
                    })
                  }
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-v3-text ml-1">
                {t('marketing.recordDate') || "KAYIT TARİHİ"}
              </label>
              <input
                type="datetime-local"
                className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm placeholder-slate-400 text-v3-text transition-all"
                value={formatForInput(formData.interaction_date)}
                onChange={(e) =>
                  setFormData({ ...formData, interaction_date: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-v3-text ml-1">
            {t('marketing.interactionSummary') || "GÖRÜŞME ÖZETİ & NOTLAR"}
          </label>
          <textarea
            rows={4}
            className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm placeholder-slate-400 text-v3-text transition-all resize-none"
            placeholder="Konuşulan detayları buraya yazın..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          ></textarea>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-v3-border">
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-semibold text-v3-text hover:text-v3-text transition-colors"
          >
            {t('marketing.cancel') || "İPTAL"}
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-8 py-2.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 rounded-xl text-xs font-semibold transition-all uppercase"
          >
            {t('marketing.save') || "KAYDET"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ContactModal({ client, onClose, onSave }: any) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    client_id: client?.id,
    full_name: "",
    position: "",
    phone: "",
    email: "",
    is_primary: false,
  });

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('marketing.addContactTitle') || "İlgili Kişi Ekle"}
      maxWidth="max-w-md"
    >
      <div className="space-y-6 text-v3-text">
        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
          {client?.name}
        </p>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-v3-text ml-1">
              {t('marketing.fullName') || "AD SOYAD"}
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm placeholder-slate-400 text-v3-text transition-all"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-v3-text ml-1">
              {t('marketing.position') || "POZİSYON"}
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm placeholder-slate-400 text-v3-text transition-all"
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-v3-text ml-1">
                {t('marketing.telephone') || "TELEFON"}
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm placeholder-slate-400 text-v3-text transition-all"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-v3-text ml-1">
                {t('marketing.emailLabel') || "E-POSTA"}
              </label>
              <input
                type="email"
                className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm placeholder-slate-400 text-v3-text transition-all"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="kisi@firma.com"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-v3-border">
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-semibold text-v3-text hover:text-v3-text transition-colors"
          >
            {t('marketing.cancel') || "İPTAL"}
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-8 py-2.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 rounded-xl text-xs font-semibold transition-all uppercase"
          >
            {t('marketing.save') || "KAYDET"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
