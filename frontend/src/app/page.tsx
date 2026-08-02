"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hotel,
  Plane,
  Bus,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Target,
  FileText,
  ArrowRight,
  Wallet,
  Receipt,
  CreditCard,
  ShieldAlert,
  Search,
  RefreshCw,
  Users,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { usePermissions, Module, getModuleFromHref } from "@/lib/permissions";
import { useLanguage } from "@/components/providers/LanguageProvider";
import LoadingSpinner from "@/components/LoadingSpinner";

// Services
import {
  projectsService,
  SejourService,
  quotesService,
  ticketPaymentPlansService,
  projectCollectionPlansService,
  projectPaymentPlansService,
  marketingService,
} from "@/lib/supabaseService";
import { supabase } from "@/lib/supabase";
import {
  format,
  isWithinInterval,
  isPast,
  isToday,
  addDays,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  differenceInDays,
} from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";

type PeriodFilter = "today" | "week" | "month" | "year" | "custom";

export default function HomePage() {
  const { canView } = usePermissions();
  const isHrefVisible = (href: string | undefined) => {
    if (!href) return true;
    const mod = getModuleFromHref(href);
    if (!mod) return true;
    return canView(mod);
  };

  const { t, language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("week");
  const [customDate, setCustomDate] = useState({
    start: format(new Date(), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });
  const [showCustomDate, setShowCustomDate] = useState(false);

  const [data, setData] = useState({
    projects: [] as any[],
    sejours: [] as any[],
    transfers: [] as any[],
    hr: [] as any[],
    quotes: [] as any[],
    ticketPayments: [] as any[],
    ticketOptions: [] as any[],
    collectionPlans: [] as any[],
    paymentPlans: [] as any[],
    marketingInteractions: [] as any[],
    marketingContacts: [] as any[],
    flights: [] as any[],
    sejourFlights: [] as any[],
  });

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        projectsRes,
        sejoursRes,
        quotesRes,
        transfersRes,
        hrRes,
        ticketPlansRes,
        colPlansRes,
        payPlansRes,
        mktIntRes,
        mktContactsRes,
        flightsRes,
        ticketOptionsRes,
      ] = await Promise.allSettled([
        supabase.from("projects").select("*, agencies(name)"),
        SejourService.getSejours(),
        supabase.from("quotes").select("*, agencies(name)"),
        supabase.from("project_transfer_tour").select("*"),
        Promise.resolve({ data: [] }),
        ticketPaymentPlansService.getAll(),
        projectCollectionPlansService.getAll(),
        projectPaymentPlansService.getAll(),
        marketingService.interactions.getAll(),
        supabase.from("marketing_contacts").select("*"),
        supabase.from("project_flight_tickets").select("*"),
        supabase.from("ticket_options").select("*"),
      ]);

      const safe = (r: PromiseSettledResult<any>) =>
        r.status === "fulfilled" && Array.isArray(r.value) ? r.value : [];
      const safeSupabase = (r: PromiseSettledResult<any>) =>
        r.status === "fulfilled" && r.value && Array.isArray(r.value.data)
          ? r.value.data
          : [];

      const sejoursRaw =
        sejoursRes.status === "fulfilled" ? sejoursRes.value : [];
      const sejours = Array.isArray(sejoursRaw)
        ? sejoursRaw
        : (sejoursRaw as any).data || [];

      const sejourFlights = sejours.flatMap((s: any) => {
        if (Array.isArray(s.sejour_flights)) {
          return s.sejour_flights.map((f: any) => ({
            ...f,
            sejourRef: s.voucher_no || s.customerName || s.customer_name,
            sejourId: s.id,
            agencyName: s.agencies?.name,
          }));
        }
        return [];
      });

      setData({
        projects: safeSupabase(projectsRes),
        sejours: sejours,
        quotes: safeSupabase(quotesRes),
        transfers: safeSupabase(transfersRes),
        hr: safeSupabase(hrRes),
        ticketPayments: safe(ticketPlansRes),
        ticketOptions: safeSupabase(ticketOptionsRes),
        collectionPlans: safe(colPlansRes),
        paymentPlans: safe(payPlansRes),
        marketingInteractions: safe(mktIntRes),
        marketingContacts: safeSupabase(mktContactsRes),
        flights: safeSupabase(flightsRes),
        sejourFlights: sejourFlights,
      });
    } catch (error) {
      console.error("Home data load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilterRange = () => {
    const now = new Date();
    const startOfToday = startOfDay(now);

    if (period === "custom") {
      return {
        start: startOfDay(parseISO(customDate.start)),
        end: endOfDay(parseISO(customDate.end)),
      };
    }

    if (period === "today") {
      return { start: startOfToday, end: endOfDay(now) };
    } else if (period === "week") {
      return { start: startOfToday, end: endOfWeek(now, { weekStartsOn: 1 }) };
    } else if (period === "month") {
      return { start: startOfToday, end: endOfMonth(now) };
    } else if (period === "year") {
      return { start: startOfToday, end: endOfYear(now) };
    }
    return { start: startOfToday, end: endOfDay(now) };
  };

  const parseDateSafe = (d: any) => {
    if (!d) return null;
    const dt = typeof d === "string" ? parseISO(d) : new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const isInRange = (d: any, range: { start: Date; end: Date }) => {
    const dt = parseDateSafe(d);
    if (!dt) return false;
    return dt >= range.start && dt <= range.end;
  };

  const localizeTitle = (text: string) => {
    if (!text || language === "tr") return text;
    return text
      .replace(/Çoklu Konaklama/gi, "Multiple Accommodation")
      .replace(/ÇOKLU KONAKLAMA/g, "Multiple Accommodation")
      .replace(/(\d+)\s+Otel/gi, "$1 Hotel(s)");
  };

  // 1. Timeline Items (Hotels, Flights, Transfers)
  const timelineItems = useMemo(() => {
    const range = getFilterRange();
    let items: any[] = [];

    // Hotels from Sejour
    data.sejours.forEach((s: any) => {
      const d = parseDateSafe(s.checkInDate || s.check_in_date);
      if (d && isInRange(d, range)) {
        const hotels =
          s.rooms?.map((r: any) => r.hotelName).filter(Boolean) || [];
        const uniqueHotels = [...new Set(hotels)].join(", ");

        const guests =
          s.rooms?.map((r: any) => r.guestInfo).filter(Boolean) || [];
        const uniqueGuests = [...new Set(guests)].join(", ");

        items.push({
          id: `s-${s.id}`,
          date: d,
          type: "sejour",
          module: "SEJOUR",
          title: `${t('home.hotel')}: ${uniqueHotels || s.hotel_name || s.hotelName || t('home.unspecified')}`,
          subtitle: `${t('home.agency')}: ${s.agencyName || s.customerName || t('home.unspecified')} ${uniqueGuests ? `| ${t('home.guest')}: ${uniqueGuests}` : ""}`,
          icon: Hotel,
          color: "teal",
          link: `/sejour`,
        });
      }
    });

    // Hotels from Projects
    data.projects.forEach((p: any) => {
      const d = parseDateSafe(p.start_date || p.organizasyon_tarihi);
      if (
        d &&
        isInRange(d, range) &&
        (p.status || "").toLowerCase() !== "cancelled" &&
        (p.status || "").toLowerCase() !== "iptal"
      ) {
        const formatStrDate = (dStr: string) => {
          if (!dStr) return "";
          const parts = dStr.split('-');
          return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : dStr;
        };
        
        let agencyName = "";
        if (p.company_name && p.agencies?.name) {
          agencyName = `${p.company_name} | ${p.agencies.name}`;
        } else {
          agencyName = p.company_name || p.agencies?.name || p.marketing_clients?.name || `${t('home.company')}/${t('home.agency')}`;
        }

        items.push({
          id: `p-${p.id}`,
          date: d,
          type: "hotel",
          module: "MICE",
          title: `${t('home.project')}: ${localizeTitle(p.title || p.referans_no) || t('home.unspecified')}`,
          subtitle: `${agencyName} | C-In: ${formatStrDate(p.start_date)} C-Out: ${formatStrDate(p.end_date)}`,
          icon: Briefcase,
          color: "blue",
          link: `/projects/${p.id}`,
        });
      }
    });

    // Flights from project_flight_tickets
    data.flights.forEach((f: any) => {
      const d = parseDateSafe(f.gidis_tarihi);
      if (d && isInRange(d, range)) {
        const p = data.projects.find((pr) => pr.id === f.project_id);
        const projName = p ? localizeTitle(p.title || p.agencies?.name || p.company_name) : "";
        items.push({
          id: `f-${f.id}`,
          date: d,
          type: "flight",
          module: "TICKET",
          title: `${t('home.flight')}: ${f.nereden || "?"} ➔ ${f.nereye || "?"}`,
          subtitle: `${f.havayolu || t('home.airline')} ${projName ? ` | ${projName}` : ""}`,
          icon: Plane,
          color: "amber",
          link: "/operations/tickets",
        });
      }
    });

    // Flights from Sejours
    data.sejourFlights.forEach((f: any, idx: number) => {
      const d = parseDateSafe(
        f.flight_date || f.departureDate || f.departure_date,
      );
      if (d && isInRange(d, range)) {
        items.push({
          id: `sf-${f.sejourId}-${idx}`,
          date: d,
          type: "flight",
          module: "SEJOUR",
          title: `${t('home.flight')}: ${f.departure_airport || "?"} ➔ ${f.arrival_airport || "?"} (${f.departure_time?.slice(0, 5) || ""})`,
          subtitle: `${t('home.agencyGuest')}: ${f.agencyName || f.sejourRef}`,
          icon: Plane,
          color: "amber",
          link: "/sejour",
        });
      }
    });

    // Transfers (Grouped by Project and Date)
    const groupedTransfers = new Map<
      string,
      { count: number; date: Date; projName: string; cin: string; cout: string }
    >();
    data.transfers.forEach((trItem: any) => {
      const d = parseDateSafe(trItem.date || trItem.transfer_date);
      if (d && isInRange(d, range)) {
        const p = data.projects.find((pr) => pr.id === trItem.project_id);
        const projName = p
          ? localizeTitle(p.title || p.agencies?.name || p.company_name) || `${t('home.unspecified')} ${t('home.project')}`
          : `${t('home.project')} ${t('home.unspecified')}`;

        let cin = "",
          cout = "";
        if (p?.start_date) {
          const sd = parseDateSafe(p.start_date);
          if (sd) cin = format(sd, "dd MMM yyyy", { locale: language === "en" ? enUS : tr });
        }
        if (p?.end_date) {
          const ed = parseDateSafe(p.end_date);
          if (ed) cout = format(ed, "dd MMM yyyy", { locale: language === "en" ? enUS : tr });
        }

        const dateKey = format(d, "yyyy-MM-dd");
        const key = `${trItem.project_id}_${dateKey}`;
        if (!groupedTransfers.has(key)) {
          groupedTransfers.set(key, {
            count: 0,
            date: startOfDay(d),
            projName,
            cin,
            cout,
          });
        }
        groupedTransfers.get(key)!.count++;
      }
    });

    groupedTransfers.forEach((val, key) => {
      items.push({
        id: `tr-group-${key}`,
        date: val.date,
        type: "transfer",
        module: "TRANSFER",
        title: `${t('home.projectTransfers')}: ${val.projName}`,
        subtitle: `${val.cin && val.cout ? `C/in-C/out: ${val.cin} - ${val.cout} | ` : ""}${t('home.total')} ${val.count} ${t('home.totalTransfersPlanned')}.`,
        icon: Bus,
        color: "violet",
        link: "/operations/transfers",
      });
    });

    // Human Resources (Grouped by Project and Date)
    const groupedHR = new Map<
      string,
      {
        guideCount: number;
        partTimeCount: number;
        date: Date;
        projName: string;
      }
    >();
    data.hr.forEach((hr: any) => {
      const d = parseDateSafe(hr.date || hr.start_date);
      if (d && isInRange(d, range)) {
        const p = data.projects.find((pr) => pr.id === hr.project_id);
        const projName = p
          ? localizeTitle(p.title || p.agencies?.name || p.company_name) || `${t('home.unspecified')} ${t('home.project')}`
          : `${t('home.project')} ${t('home.unspecified')}`;
        const dateKey = format(d, "yyyy-MM-dd");
        const isGuide =
          (hr.sub_category_name || "").toLowerCase().includes("rehber") ||
          (hr.sub_category_name || "").toLowerCase().includes("kokartlı");

        const key = `${hr.project_id}_${dateKey}`;
        if (!groupedHR.has(key)) {
          groupedHR.set(key, {
            guideCount: 0,
            partTimeCount: 0,
            date: startOfDay(d),
            projName,
          });
        }
        const state = groupedHR.get(key)!;
        if (isGuide) state.guideCount++;
        else state.partTimeCount++;
      }
    });

    groupedHR.forEach((val, key) => {
      const subtitleParts = [];
      if (val.guideCount > 0) subtitleParts.push(`${val.guideCount} ${t('home.guide')}`);
      if (val.partTimeCount > 0)
        subtitleParts.push(`${val.partTimeCount} Part-Time`);

      items.push({
        id: `hr-group-${key}`,
        date: val.date,
        type: "hr",
        module: t('home.hrModule'),
        title: `${t('home.assignment')}: ${val.projName}`,
        subtitle: subtitleParts.join(" | ") || t('home.unspecified'),
        icon: Users,
        color: "fuchsia",
        link: "/operations/human-resources",
      });
    });

    // Sort by date asc
    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data, period, language, t]);

  // 2. Warnings Items (Expiring Options & Pending Payments)
  const warnings = useMemo(() => {
    const range = getFilterRange();
    let items: any[] = [];

    // Expiring Quotes (Teklif Opsiyonları)
    data.quotes.forEach((q: any) => {
      const status = (q.status || "").toLowerCase();
      const isConfirmed =
        status.includes("konfirme") ||
        status.includes("confirm") ||
        status.includes("kazanildi");
      if (!isConfirmed) {
        const d = parseDateSafe(q.option_date);
        if (d && isInRange(d, range)) {
          const daysLeft = differenceInDays(startOfDay(d), startOfDay(new Date()));
          const isUrgent = daysLeft <= 1;
          const agencyName =
            q.marketing_clients?.name ||
            q.agencies?.name ||
            q.company_name ||
            t('home.unspecified');
          items.push({
            id: `q-${q.id}`,
            date: d,
            type: "option",
            title: `${t('home.quoteOption')}: ${q.title || t('home.unspecified')}`,
            subtitle: `${t('home.company')}/${t('home.agency')}: ${agencyName}`,
            amount: q.total_price
              ? formatCurrency(q.total_price, language, q.currency || "EUR")
              : undefined,
            isUrgent,
            daysLeft,
            icon: ShieldAlert,
            color: isUrgent ? "rose" : "orange",
            link: `/quotes/${q.id}`,
          });
        }
      }
    });

    // Ticket Options
    data.ticketOptions.forEach((o: any) => {
      if ((o.status || "").toLowerCase() === "confirmed" || (o.status || "").toLowerCase() === "cancelled") return;
      const d = parseDateSafe(o.option_end_date);
      if (d && isInRange(d, range)) {
        const daysLeft = differenceInDays(startOfDay(d), startOfDay(new Date()));
        const isUrgent = daysLeft <= 1;
        const timeStr = o.option_end_time ? o.option_end_time.slice(0, 5) : "";
        const exactDate = format(d, "dd MMM", { locale: language === "en" ? enUS : tr });
        items.push({
          id: `to-${o.id}`,
          date: d,
          type: "option",
          title: `${t('home.ticketOption')}: ${o.company_name || o.agent || t('home.unknown')}`,
          subtitle: `PNR: ${o.pnr || "-"} | ${t('home.option')}: ${exactDate} ${timeStr}`,
          amount: o.total_cost
            ? formatCurrency(o.total_cost, language, o.currency || "EUR")
            : undefined,
          isUrgent,
          daysLeft,
          icon: ShieldAlert,
          color: isUrgent ? "rose" : "orange",
          link: "/tickets/options",
        });
      }
    });

    // Pending Ticket Payments (Iterate over installments)
    data.ticketPayments.forEach((plan: any) => {
      if (
        (plan.status || "").toLowerCase() !== "paid" &&
        Array.isArray(plan.installments)
      ) {
        plan.installments.forEach((inst: any, idx: number) => {
          if ((inst.status || "").toLowerCase() !== "paid") {
            const d = parseDateSafe(inst.due_date || inst.date);
            if (d && isInRange(d, range)) {
              const daysLeft = differenceInDays(startOfDay(d), startOfDay(new Date()));
              const isUrgent = daysLeft <= 1;
              const ticket = data.flights?.find(
                (f: any) => f.id === plan.ticket_id,
              );
              const tName = ticket
                ? ticket.projects?.title ||
                  ticket.company_name ||
                  ticket.tedarikci ||
                  t('home.ticketPayment').split(' ')[0]
                : t('home.ticketPayment').split(' ')[0];
              const exactDate = format(d, "dd MMM", { locale: language === "en" ? enUS : tr });
              items.push({
                id: `tp-${plan.id}-${idx}`,
                date: d,
                type: "payment",
                title: `${t('home.ticketPayment')}: ${tName}`,
                subtitle: `${t('home.dueDate')}: ${exactDate} | ${t('home.amount')}: ${inst.amount} ${inst.currency || plan.currency || "EUR"}`,
                amount: inst.amount
                  ? formatCurrency(
                      inst.amount,
                      language,
                      inst.currency || plan.currency || "EUR",
                    )
                  : undefined,
                isUrgent,
                daysLeft,
                icon: Wallet,
                color: isUrgent ? "rose" : "orange",
                link: "/operations/tickets",
              });
            }
          }
        });
      }
    });

    // Pending Project Collections
    data.collectionPlans.forEach((p: any) => {
      if ((p.status || "").toLowerCase() !== "paid") {
        const d = parseDateSafe(p.date || p.due_date);
        if (d && isInRange(d, range)) {
          const daysLeft = differenceInDays(startOfDay(d), startOfDay(new Date()));

          // Try to find the project name for better context
          const proj = data.projects.find((pr) => pr.id === p.project_id);
          const projName = proj ? localizeTitle(proj.title) || t('home.project') : t('home.project');
          let agencyName = t('home.unspecified');
          if (proj) {
            if (proj.company_name && proj.agencies?.name) {
              agencyName = `${proj.company_name} | ${proj.agencies.name}`;
            } else {
              agencyName = proj.company_name || proj.agencies?.name || proj.marketing_clients?.name || t('home.unspecified');
            }
          }

          const formatStrDate = (dStr: string) => {
            if (!dStr) return "";
            const parts = dStr.split('-');
            return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : dStr;
          };

          const datesInfo = proj
            ? `C-In: ${formatStrDate(proj.start_date)} C-Out: ${formatStrDate(proj.end_date)}`
            : "";

          items.push({
            id: `cp-${p.id}`,
            date: d,
            type: "collection",
            title: `${t('home.collection')}: ${projName}`,
            subtitle: `${t('home.company')}: ${agencyName} | ${datesInfo}`,
            amount: p.amount
              ? formatCurrency(p.amount, language, p.currency || "TRY")
              : undefined,
            isUrgent: daysLeft <= 1,
            daysLeft,
            icon: Wallet,
            color: daysLeft <= 1 ? "rose" : "emerald",
            link: `/projects/${p.project_id}`,
          });
        }
      }
    });

    // Sort by urgent / date
    return items.sort((a, b) => {
      if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
      return a.date.getTime() - b.date.getTime();
    });
  }, [data, period, language, t]);

  // 3. Marketing Appointments
  const marketingAppts = useMemo(() => {
    const range = getFilterRange();
    let items: any[] = [];

    data.marketingInteractions.forEach((m: any) => {
      if ((m.status || "").toLowerCase() === "planned") {
        const d = parseDateSafe(m.appointment_date);
        if (d && isInRange(d, range)) {
          // Find contacts
          let contactNames = "";
          if (Array.isArray(m.contact_ids) && m.contact_ids.length > 0) {
            const contacts = data.marketingContacts.filter((c) =>
              m.contact_ids.includes(c.id),
            );
            contactNames = contacts.map((c) => c.full_name).join(", ");
          }

          items.push({
            id: `m-${m.id}`,
            date: d,
            title: m.marketing_clients?.name || t('home.unspecified'),
            subtitle: m.type || t('home.meeting'),
            contacts: contactNames || t('home.unspecified'),
            icon: Target,
            link: "/marketing",
          });
        }
      }
    });

    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data, period, language, t]);

  if (!mounted) return null;
  if (loading) return <LoadingSpinner message={t('home.loading')} />;

  const getFormatStrDate = () =>
    period === "today" ? "HH:mm" : "dd MMM EEE, HH:mm";
  const getFormatStrWarn = () => (period === "today" ? "HH:mm" : "dd MMM, EEE");
  const getFormatLocale = () => ({ locale: language === "tr" ? tr : enUS });

  return (
    <div className="flex flex-col h-full overflow-y-auto pt-4 pb-4 px-4 gap-4 custom-scrollbar">
      {/* Top Header: Title & Filters */}
      <div className="shrink-0 flex flex-col gap-3 z-10">
        <div className="flex flex-wrap items-center justify-start gap-8">
          <div>
            <h1 className="text-2xl font-light tracking-wide text-v3-text glow-text">
              {t('home.title')}
            </h1>
            <p className="text-xs text-v3-muted mt-1">
              {t('home.subtitle')}
            </p>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex items-center gap-2 p-1 bg-v3-surface backdrop-blur-md border border-v3-border rounded-xl w-fit h-[40px]">
              {(
                [
                  { id: "today", label: t('home.today') },
                  { id: "week", label: t('home.thisWeek') },
                  { id: "month", label: t('home.thisMonth') },
                  { id: "year", label: t('home.thisYear') },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setPeriod(item.id as PeriodFilter);
                    setShowCustomDate(false);
                  }}
                  className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                    period === item.id
                      ? "bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                      : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setPeriod("custom");
                  setShowCustomDate(true);
                }}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center gap-1 ${
                  period === "custom"
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                    : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"
                }`}
              >
                <Calendar size={14} />
                {t('home.customDate')}
              </button>
            </div>

            <AnimatePresence>
              {showCustomDate && (
                  <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-end gap-2"
                >
                  <div className="w-64">
                    <ResponsiveDateRangeField
                      label={t('home.dateRange')}
                      startValue={customDate.start}
                      endValue={customDate.end}
                      onStartChange={(val) =>
                        setCustomDate((prev) => ({ ...prev, start: val }))
                      }
                      onEndChange={(val) =>
                        setCustomDate((prev) => ({ ...prev, end: val }))
                      }
                      onApply={() => loadData()}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={loadData}
              className="bg-v3-border border border-v3-border hover:bg-v3-surface text-v3-text px-4 py-2 rounded-xl transition-all duration-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 ml-1 h-[40px]"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {t('home.refresh')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-[500px]">
        {/* COLUMN 1: TIMELINE (Yaklaşan Operasyonlar) */}
        <div className="lg:col-span-5 bg-v3-surface backdrop-blur-md border border-v3-border rounded-3xl p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6 border-b border-v3-border pb-4 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide">
                {t('home.operationFlow')}
              </h2>
              <p className="text-[10px] text-v3-muted uppercase tracking-widest">
                {timelineItems.length} {t('home.upcomingTasksCount')}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
            <div className="absolute left-6 top-4 bottom-4 w-px bg-white/10" />

            <div className="space-y-4">
              {timelineItems.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-50" />
                  <p className="text-sm font-medium">
                    {t('home.noOperations')}
                  </p>
                </div>
              ) : (
                timelineItems.filter(item => isHrefVisible(item.link)).map((item, idx) => (
                  <div
                    key={item.id}
                    className="relative flex items-start gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-v3-surface border-4 border-[#0f172a] z-10 shrink-0 mt-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 
                        ${
                          item.color === "emerald"
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : item.color === "blue"
                              ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                              : item.color === "amber"
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                : item.color === "fuchsia"
                                  ? "bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/30"
                                  : "bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/30"
                        }`}
                      >
                        <item.icon size={16} />
                      </div>
                    </div>
                    <div className="flex-1 pb-2">
                      <Link
                        href={item.link}
                        className="block group-hover:bg-v3-border p-3 rounded-2xl border border-transparent group-hover:border-v3-border transition-all"
                      >
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:text-blue-300 transition-colors line-clamp-2 leading-tight">
                            {item.title}
                          </h3>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-700/80 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                            {format(
                              item.date,
                              getFormatStrDate(),
                              getFormatLocale(),
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p
                            className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate pr-2"
                            title={item.subtitle}
                          >
                            {item.subtitle}
                          </p>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md shrink-0 border border-slate-200 dark:border-slate-700">
                            {item.module}
                          </span>
                        </div>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: UYARILAR (Finans & Opsiyonlar) */}
        <div className="lg:col-span-4 bg-v3-surface backdrop-blur-md border border-v3-border rounded-3xl p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6 border-b border-v3-border pb-4 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide">
                {t('home.criticalWarnings')}
              </h2>
              <p className="text-[10px] text-v3-muted uppercase tracking-widest">
                {warnings.length} {t('home.pendingActions')}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
            {warnings.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-50" />
                <p className="text-sm font-medium">
                  {t('home.noWarnings')}
                </p>
              </div>
            ) : (
              warnings.filter(warn => isHrefVisible(warn.link)).map((warn) => (
                <Link
                  key={warn.id}
                  href={warn.link}
                  className={`block p-4 rounded-2xl border transition-all hover:-translate-y-1 ${
                    warn.isUrgent
                      ? "bg-rose-500/10 border-rose-500/30 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:bg-rose-500/20"
                      : "bg-v3-border border-v3-border hover:border-v3-border hover:bg-v3-surface"
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`mt-0.5 shrink-0 ${warn.isUrgent ? "text-rose-600 dark:text-rose-400" : "text-v3-muted"}`}
                    >
                      <warn.icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4
                          className={`text-xs font-bold uppercase tracking-wider line-clamp-2 ${warn.isUrgent ? "text-rose-900 dark:text-rose-100" : "text-slate-800 dark:text-slate-200"}`}
                        >
                          {warn.title}
                        </h4>
                        {warn.amount && (
                          <span className="text-xs font-black shrink-0">
                            {warn.amount}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-1 truncate"
                        title={warn.subtitle}
                      >
                        {warn.subtitle}
                      </p>

                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-v3-border">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest ${
                            warn.daysLeft < 0
                              ? "text-rose-500"
                              : warn.daysLeft === 0
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {warn.daysLeft < 0
                            ? `${Math.abs(warn.daysLeft)} ${t('home.daysPassed')}`
                            : warn.daysLeft === 0
                              ? t('home.todayEnd')
                              : `${warn.daysLeft} ${t('home.daysLeft')}`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md ml-auto whitespace-nowrap">
                          {format(
                            warn.date,
                            getFormatStrWarn(),
                            getFormatLocale(),
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 3: PAZARLAMA (Randevular) */}
        <div className="lg:col-span-3 bg-v3-surface backdrop-blur-md border border-v3-border rounded-3xl p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6 border-b border-v3-border pb-4 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center border border-fuchsia-500/20">
              <Target size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide">{t('home.marketing')}</h2>
              <p className="text-[10px] text-v3-muted uppercase tracking-widest">
                {marketingAppts.length} {t('home.appointments')}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
            {marketingAppts.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <Target className="w-12 h-12 mx-auto mb-3 text-v3-muted opacity-50" />
                <p className="text-sm font-medium">
                  {t('home.noAppointments')}
                </p>
              </div>
            ) : (
              marketingAppts.filter(appt => isHrefVisible(appt.link)).map((appt) => (
                <Link
                  key={appt.id}
                  href={appt.link}
                  className="block p-4 rounded-2xl bg-fuchsia-950/20 border border-fuchsia-500/10 hover:border-fuchsia-500/30 hover:bg-fuchsia-900/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h4 className="text-sm font-bold text-fuchsia-900 dark:text-fuchsia-100 group-hover:text-fuchsia-600 dark:text-fuchsia-300 transition-colors line-clamp-2 leading-tight">
                      {appt.title}
                    </h4>
                    <span className="text-[10px] font-bold text-fuchsia-800 dark:text-fuchsia-200 bg-fuchsia-200/50 dark:bg-fuchsia-900/50 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                      {format(appt.date, getFormatStrDate(), getFormatLocale())}
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] text-fuchsia-800/80 dark:text-fuchsia-300/80 font-medium flex flex-col gap-1">
                    <span className="flex items-center gap-1.5">
                      <Users size={12} className="text-fuchsia-600 dark:text-fuchsia-400/70" />{" "}
                      {appt.contacts}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-fuchsia-500/10">
                    <span className="text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400/70 uppercase tracking-widest bg-fuchsia-500/10 px-2 py-1 rounded-md shrink-0">
                      {appt.subtitle}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>


        </div>
      </div>
    </div>
  );
}
