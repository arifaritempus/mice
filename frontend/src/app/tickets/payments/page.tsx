"use client";
import ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import DatePicker from "react-datepicker";
import {
  format as formatDateFns,
  parse as parseDateFns,
  isValid as isValidDate,
  parseISO,
} from "date-fns";
import { tr } from "date-fns/locale";
import {
  ticketOptionsService,
  ticketPaymentPlansService,
  ticketPaymentRecordsService,
} from "@/lib/supabaseService";
import PaginationControls from "@/components/PaginationControls";
import LoadingSpinner from "@/components/LoadingSpinner";
import { DEFAULT_PAGE_SIZE, paginateItems } from "@/types/pagination";
import Modal from "@/components/Modal";
import { usePermissions, Module } from "@/lib/permissions";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { toast } from "react-hot-toast";
import {
  Plus,
  Trash2,
  X,
  Save,
  CreditCard,
  Calendar,
  User,
  FileText,
  Check,
  AlertCircle,
  Percent,
  Banknote,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

interface ConfirmedTicket {
  id: string;
  voucher_no: string;
  agent: string;
  total_cost: number;
  currency: string;
  status: "confirmed";
  // Bilet Opsiyon Takip'ten gelen veriler
  company_name?: string;
  supplier?: string;
  airline?: string;
  group_ref_no?: string;
  flight_type?: string;
  departure_date?: string;
  departure_time?: string;
  return_date?: string;
  return_time?: string;
  route?: string;
  passenger_count?: number;
  pp_cost?: number;
  option_end_date?: string;
  option_end_time?: string;
  pnr?: string;
  entry_date?: string;
}

interface Installment {
  id: string;
  date: string;
  percentage: number;
  amount: number;
  currency: string;
}

interface PaymentPlan {
  id: string;
  ticket_id: string;
  installments: Installment[];
  total_amount: number;
  total_percentage: number;
  currency: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

interface PaymentRecord {
  id: string;
  payment_plan_id: string;
  ticket_id: string;
  amount: number;
  payment_date: string;
  payment_method: "credit_card" | "bank_transfer" | "cash" | "online";
  notes?: string;
  recipient: string;
}

const parseTypedDate = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const parsed = parseDateFns(trimmed, "dd.MM.yyyy", new Date());
  if (!isValidDate(parsed)) return null;
  return formatDateFns(parsed, "yyyy-MM-dd");
};

export default function TicketPaymentsPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const { t, language } = useLanguage();
  const toCalendarYmd = useCallback(
    (value: string | Date | null | undefined): string => {
      if (value == null) return "";
      if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return "";
        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, "0");
        const d = String(value.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }

      const trimmed = String(value).trim();
      if (!trimmed) return "";

      const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (ymdMatch) {
        return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
      }

      const parsed = new Date(trimmed);
      if (Number.isNaN(parsed.getTime())) return "";
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const d = String(parsed.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    },
    [],
  );

  // State'ler
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const [confirmedTickets, setConfirmedTickets] = useState<ConfirmedTicket[]>(
    [],
  );
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);

  // Arama ve Filtreleme State'leri
  const [voucherTokens, setVoucherTokens] = useState<string[]>([]);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherSuggestions, setVoucherSuggestions] = useState<string[]>([]);

  const addToken = useCallback(
    (
      value: string,
      setter: React.Dispatch<React.SetStateAction<string[]>>,
      inputSetter: React.Dispatch<React.SetStateAction<string>>,
    ) => {
      const trimmed = value.trim();
      if (trimmed && !voucherTokens.includes(trimmed)) {
        setter((prev) => [...prev, trimmed]);
        inputSetter("");
      }
    },
    [voucherTokens],
  );

  const removeToken = useCallback(
    (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
      setter((prev) => prev.filter((t) => t !== value));
    },
    [],
  );
  const [departureDateRange, setDepartureDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [paymentDateRange, setPaymentDateRange] = useState({
    startDate: toCalendarYmd(new Date()),
    endDate: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Sıralama State'i
  const [sortBy, setSortBy] = useState<"flight" | "payment" | "balance">(
    "flight",
  );
  const [filterKey, setFilterKey] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [voucherTokens, departureDateRange, sortBy]);

  // Modal State'leri
  const [showPaymentPlanModal, setShowPaymentPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ConfirmedTicket | null>(
    null,
  );
  const [selectedPaymentPlan, setSelectedPaymentPlan] =
    useState<PaymentPlan | null>(null);
  const [selectedPaymentRecord, setSelectedPaymentRecord] =
    useState<PaymentRecord | null>(null);

  const [newPaymentPlan, setNewPaymentPlan] = useState({
    installments: [
      { id: "1", date: "", percentage: 0, amount: 0, currency: "TRY" },
    ],
  });

  const [newPayment, setNewPayment] = useState({
    amount: 0,
    payment_date: toCalendarYmd(new Date()),
    payment_method: "credit_card" as
      | "credit_card"
      | "bank_transfer"
      | "cash"
      | "online",
    recipient: "",
    notes: "",
  });

  // Silme Onay Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    type: "plan" | "record" | null;
    id: string | null;
    isDeleting: boolean;
  }>({
    show: false,
    type: null,
    id: null,
    isDeleting: false,
  });

  // Güvenli tarih parse: 'dd.MM.yyyy' ve 'yyyy-MM-dd' destekler
  const parseDate = useCallback((value?: string) => {
    if (!value) return null as Date | null;
    const s = value.trim();
    if (!s) return null;
    if (s.includes(".")) {
      const [dd, mm, yyyy] = s.split(".");
      const d = Number(dd),
        m = Number(mm),
        y = Number(yyyy);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        return new Date(y, m - 1, d);
      }
    }
    const ymdMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
      return new Date(
        Number(ymdMatch[1]),
        Number(ymdMatch[2]) - 1,
        Number(ymdMatch[3]),
      );
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }, []);

  const loadData = useCallback(async () => {
    if (hasLoadedRef.current) return;

    if (!canView(Module.TICKETS)) {
      setLoading(false);
      return;
    }

    hasLoadedRef.current = true;
    try {
      setLoading(true);

      // Supabase'den confirmed biletleri çek
      const allTickets = await ticketOptionsService.getAll();
      const confirmed = allTickets
        .filter((ticket: any) => ticket.status === "confirmed")
        .map((ticket: any) => ({
          ...ticket,
          departure_date: toCalendarYmd(ticket.departure_date),
          return_date: toCalendarYmd(ticket.return_date),
          option_end_date: toCalendarYmd(ticket.option_end_date),
          entry_date: toCalendarYmd(ticket.entry_date),
          departure_time: ticket.departure_time || "",
          return_time: ticket.return_time || "",
          option_end_time: ticket.option_end_time || "",
          pnr: ticket.pnr || "",
          group_ref_no: ticket.group_ref_no || "",
          route: ticket.route || "",
        }));
      setConfirmedTickets(confirmed);

      // Supabase'den ödeme planlarını çek
      const plans = await ticketPaymentPlansService.getAll();
      const formattedPlans = plans.map((plan: any) => ({
        ...plan,
        installments: Array.isArray(plan.installments) ? plan.installments : [],
        created_at: plan.created_at || new Date().toISOString(),
        updated_at: plan.updated_at || new Date().toISOString(),
      }));
      setPaymentPlans(formattedPlans);

      // Supabase'den ödeme kayıtlarını çek
      const records = await ticketPaymentRecordsService.getAll();
      const formattedRecords = records.map((record: any) => ({
        ...record,
        payment_date: toCalendarYmd(record.payment_date),
        notes: record.notes || "",
        recipient: record.recipient || "",
      }));
      setPaymentRecords(formattedRecords);
    } catch (error) {
      console.error("Veri yükleme hatası:", error);
      hasLoadedRef.current = false;
      setConfirmedTickets([]);
      setPaymentPlans([]);
      setPaymentRecords([]);
    } finally {
      setLoading(false);
    }
  }, [toCalendarYmd, canView]);

  // Sıralama fonksiyonu
  const sortTickets = (tickets: ConfirmedTicket[]) => {
    if (sortBy === "flight") {
      // Uçuş tarihine göre sırala
      return [...tickets].sort((a, b) => {
        const aDate = parseDate(a.departure_date || a.entry_date);
        const bDate = parseDate(b.departure_date || b.entry_date);
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return aDate.getTime() - bDate.getTime();
      });
    } else if (sortBy === "payment") {
      // Ödeme tarihine göre sırala
      return [...tickets].sort((a, b) => {
        const aPaymentPlan = paymentPlans.find(
          (plan) => plan.ticket_id === a.id,
        );
        const bPaymentPlan = paymentPlans.find(
          (plan) => plan.ticket_id === b.id,
        );
        const aFirst = parseDate(aPaymentPlan?.installments?.[0]?.date);
        const bFirst = parseDate(bPaymentPlan?.installments?.[0]?.date);
        if (!aFirst && !bFirst) return 0;
        if (!aFirst) return 1;
        if (!bFirst) return -1;
        return aFirst.getTime() - bFirst.getTime();
      });
    } else if (sortBy === "balance") {
      // Bakiyesi olanları ödeme tarihine göre sırala
      return [...tickets].sort((a, b) => {
        const aPaymentPlan = paymentPlans.find(
          (plan) => plan.ticket_id === a.id,
        );
        const bPaymentPlan = paymentPlans.find(
          (plan) => plan.ticket_id === b.id,
        );
        const aFirst = parseDate(aPaymentPlan?.installments?.[0]?.date);
        const bFirst = parseDate(bPaymentPlan?.installments?.[0]?.date);
        if (!aFirst && !bFirst) return 0;
        if (!aFirst) return 1;
        if (!bFirst) return -1;
        return aFirst.getTime() - bFirst.getTime();
      });
    }
    return tickets;
  };

  useEffect(() => {
    if (!permissionsLoading) {
      loadData();
    }
  }, [loadData, permissionsLoading]);

  // EUR bilet için eski planları temizle (confirmedTickets yüklendikten sonra)
  useEffect(() => {
    if (confirmedTickets.length > 0) {
      setPaymentPlans((prev) => {
        return prev.filter((plan: any) => {
          const ticket = confirmedTickets.find((t) => t.id === plan.ticket_id);
          if (ticket && ticket.currency === "EUR") {
            // EUR bilet için sadece yeni format planları kabul et
            return (
              plan.installments &&
              Array.isArray(plan.installments) &&
              plan.installments.length > 0
            );
          }
          return true;
        });
      });
    }
  }, [confirmedTickets]);

  const createPaymentPlan = useCallback(
    async (ticketId: string, installments: Installment[]) => {
      try {
        const planData = {
          ticket_id: ticketId,
          voucher_no:
            confirmedTickets.find((t) => t.id === ticketId)?.voucher_no || null,
          installments: installments,
          total_amount: installments.reduce(
            (sum, inst) => sum + inst.amount,
            0,
          ),
          total_percentage: installments.reduce(
            (sum, inst) => sum + inst.percentage,
            0,
          ),
          currency: installments[0]?.currency || "TRY",
          status: "active",
        };

        const createdPlan = await ticketPaymentPlansService.create(planData);

        const plan: PaymentPlan = {
          ...createdPlan,
          installments: Array.isArray(createdPlan.installments)
            ? createdPlan.installments
            : installments,
          created_at: createdPlan.created_at || new Date().toISOString(),
          updated_at: createdPlan.updated_at || new Date().toISOString(),
        };

        setPaymentPlans((prev) => [...prev, plan]);

        setShowPaymentPlanModal(false);
        setSelectedTicket(null);
        setNewPaymentPlan({
          installments: [
            { id: "1", date: "", percentage: 0, amount: 0, currency: "TRY" },
          ],
        });

        toast.success(t('ticketsPayments.msgPlanCreated') || "Ödeme planı başarıyla oluşturuldu!");
      } catch (error) {
        console.error("Ödeme planı oluşturma hatası:", error);
        toast.error(t('ticketsPayments.msgPlanCreateError') || "Ödeme planı oluşturulurken hata oluştu!");
      }
    },
    [],
  );

  const updatePaymentPlan = useCallback(
    async (planId: string, installments: Installment[]) => {
      try {
        const index = paymentPlans.findIndex((plan) => plan.id === planId);
        if (index === -1) {
          toast.error(t('ticketsPayments.msgPlanNotFound') || "Ödeme planı bulunamadı!");
          return;
        }

        const updateData = {
          installments: installments,
          voucher_no:
            confirmedTickets.find((t) => t.id === paymentPlans[index].ticket_id)
              ?.voucher_no || null,
          total_amount: installments.reduce(
            (sum, inst) => sum + inst.amount,
            0,
          ),
          total_percentage: installments.reduce(
            (sum, inst) => sum + inst.percentage,
            0,
          ),
        };

        const updatedPlanData = await ticketPaymentPlansService.update(
          planId,
          updateData,
        );

        const updatedPlan: PaymentPlan = {
          ...updatedPlanData,
          installments: Array.isArray(updatedPlanData.installments)
            ? updatedPlanData.installments
            : installments,
          created_at:
            updatedPlanData.created_at || paymentPlans[index].created_at,
          updated_at: updatedPlanData.updated_at || new Date().toISOString(),
        };

        setPaymentPlans((prev) => {
          const updated = [...prev];
          updated[index] = updatedPlan;
          return updated;
        });

        setShowPaymentPlanModal(false);
        setSelectedTicket(null);
        setNewPaymentPlan({
          installments: [
            { id: "1", date: "", percentage: 0, amount: 0, currency: "TRY" },
          ],
        });

        toast.success(t('ticketsPayments.msgPlanUpdated') || "Ödeme planı başarıyla güncellendi!");
      } catch (error) {
        console.error("Ödeme planı güncelleme hatası:", error);
        toast.error(t('ticketsPayments.msgPlanUpdateError') || "Ödeme planı güncellenirken hata oluştu!");
      }
    },
    [paymentPlans],
  );

  const recordPayment = useCallback(async () => {
    if (!selectedPaymentPlan) return;

    // Validation ekleyelim
    if (!newPayment.amount || newPayment.amount <= 0) {
      toast.error(t('ticketsPayments.msgInvalidAmount') || "Lütfen geçerli bir tutar girin!");
      return;
    }

    if (!newPayment.payment_date) {
      toast.error(t('ticketsPayments.msgSelectDate') || "Lütfen ödeme tarihi seçin!");
      return;
    }

    if (!newPayment.recipient.trim()) {
      toast.error(t('ticketsPayments.msgEnterRecipient') || "Lütfen alıcı bilgisini girin!");
      return;
    }

    try {
      if (selectedPaymentRecord) {
        // MEVCUT ÖDEMEYİ GÜNCELLE
        const updateData = {
          amount: newPayment.amount,
          payment_date: newPayment.payment_date,
          payment_method: newPayment.payment_method,
          recipient: newPayment.recipient.trim(),
          notes: newPayment.notes || null,
          voucher_no:
            confirmedTickets.find((t) => t.id === selectedPaymentPlan.ticket_id)
              ?.voucher_no || null,
        };

        const updatedRecord = await ticketPaymentRecordsService.update(
          selectedPaymentRecord.id,
          updateData,
        );

        setPaymentRecords((prev) => {
          return prev.map((record) =>
            record.id === selectedPaymentRecord.id
              ? {
                  ...updatedRecord,
                  payment_date: toCalendarYmd(updatedRecord.payment_date),
                  notes: updatedRecord.notes || "",
                  recipient: updatedRecord.recipient || "",
                }
              : record,
          );
        });

        toast.success(t('ticketsPayments.msgPaymentUpdated') || "Ödeme başarıyla güncellendi!");
      } else {
        // YENİ ÖDEME KAYDI OLUŞTUR
        const ticket = confirmedTickets.find(
          (t) => t.id === selectedPaymentPlan.ticket_id,
        );
        const recordData = {
          payment_plan_id: selectedPaymentPlan.id,
          ticket_id: selectedPaymentPlan.ticket_id,
          amount: newPayment.amount,
          payment_date: newPayment.payment_date,
          payment_method: newPayment.payment_method,
          recipient: newPayment.recipient.trim(),
          notes: newPayment.notes || null,
          voucher_no: ticket?.voucher_no || null,
        };

        const createdRecord =
          await ticketPaymentRecordsService.create(recordData);

        setPaymentRecords((prev) => [
          {
            ...createdRecord,
            payment_date: toCalendarYmd(createdRecord.payment_date),
            notes: createdRecord.notes || "",
            recipient: createdRecord.recipient || "",
          },
          ...prev,
        ]);

        toast.success(t('ticketsPayments.msgPaymentSaved') || "Ödeme başarıyla kaydedildi!");
      }

      setShowPaymentModal(false);
      setSelectedPaymentPlan(null);
      setSelectedPaymentRecord(null); // Düzenleme modundan çık
      setNewPayment({
        amount: 0,
        payment_date: toCalendarYmd(new Date()),
        payment_method: "credit_card",
        recipient: "",
        notes: "",
      });
      toast.success(t('ticketsPayments.msgPaymentSaved') || "Ödeme başarıyla kaydedildi!");
    } catch (error) {
      console.error("Ödeme kaydetme hatası:", error);
      toast.error(t('ticketsPayments.msgPaymentSaveError') || "Ödeme kaydedilirken hata oluştu!");
    }
  }, [selectedPaymentPlan, newPayment, selectedPaymentRecord, toCalendarYmd]);

  const addInstallment = useCallback(() => {
    setNewPaymentPlan((prev) => ({
      ...prev,
      installments: [
        ...prev.installments,
        {
          id: Date.now().toString(),
          date: "",
          percentage: 0,
          amount: 0,
          currency: selectedTicket?.currency || "TRY",
        },
      ],
    }));
  }, [selectedTicket]);

  const removeInstallment = useCallback((index: number) => {
    setNewPaymentPlan((prev) => ({
      ...prev,
      installments: prev.installments.filter((_, i) => i !== index),
    }));
  }, []);

  const updateInstallment = useCallback(
    (index: number, field: keyof Installment, value: any) => {
      setNewPaymentPlan((prev) => {
        const updated = [...prev.installments];
        updated[index] = { ...updated[index], [field]: value };

        if (selectedTicket && selectedTicket.total_cost > 0) {
          if (field === "percentage") {
            // Yüzde değiştiğinde tutarı hesapla
            updated[index].amount = (selectedTicket.total_cost * value) / 100;
          } else if (field === "amount") {
            // Tutar değiştiğinde yüzdeyi hesapla
            updated[index].percentage =
              (value / selectedTicket.total_cost) * 100;
          }
        }

        return { ...prev, installments: updated };
      });
    },
    [selectedTicket],
  );

  const openPaymentPlanModal = useCallback((ticket: ConfirmedTicket) => {
    setSelectedTicket(ticket);
    setNewPaymentPlan({
      installments: [
        {
          id: "1",
          date: "",
          percentage: 0,
          amount: 0,
          currency: ticket.currency,
        },
      ],
    });
    setShowPaymentPlanModal(true);
  }, []);

  const openPaymentModal = useCallback(
    (plan: PaymentPlan) => {
      setSelectedPaymentPlan(plan);
      setNewPayment({
        amount: 0,
        payment_date: toCalendarYmd(new Date()),
        payment_method: "credit_card",
        recipient: "",
        notes: "",
      });
      setShowPaymentModal(true);
    },
    [toCalendarYmd],
  );

  const openEditPaymentPlanModal = useCallback(
    (plan: PaymentPlan) => {
      console.log("🔍 Plan Düzenle butonuna tıklandı!", plan);

      // Önce ticket'ı bul ve selectedTicket state'ini güncelle
      const ticket = confirmedTickets.find((t) => t.id === plan.ticket_id);
      if (ticket) {
        setSelectedTicket(ticket);
        console.log("🔍 selectedTicket güncellendi:", ticket);
      }

      setSelectedPaymentPlan(plan);
      setNewPaymentPlan({
        installments: plan.installments.map((inst) => ({
          id: inst.id,
          date: inst.date,
          percentage: inst.percentage,
          amount: inst.amount,
          currency: inst.currency,
        })),
      });
      console.log("🔍 Modal açılıyor...");
      setShowPaymentPlanModal(true);
      console.log("🔍 showPaymentPlanModal state güncellendi");
    },
    [confirmedTickets],
  );

  const openEditPaymentModal = useCallback(
    (payment: PaymentRecord) => {
      setSelectedPaymentRecord(payment); // Düzenlenecek ödeme kaydını set et
      setNewPayment({
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method as
          | "credit_card"
          | "bank_transfer"
          | "cash"
          | "online",
        recipient: payment.recipient,
        notes: payment.notes || "",
      });
      setSelectedPaymentPlan(
        paymentPlans.find((plan) => plan.id === payment.payment_plan_id) ||
          null,
      );
      setShowPaymentModal(true);
    },
    [paymentPlans],
  );

  const handleDeletePlanClick = (planId: string) => {
    setDeleteConfirm({
      show: true,
      type: "plan",
      id: planId,
      isDeleting: false,
    });
  };

  const handleDeleteRecordClick = (recordId: string) => {
    setDeleteConfirm({
      show: true,
      type: "record",
      id: recordId,
      isDeleting: false,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id || !deleteConfirm.type) return;

    setDeleteConfirm((prev) => ({ ...prev, isDeleting: true }));
    try {
      if (deleteConfirm.type === "plan") {
        await ticketPaymentPlansService.delete(deleteConfirm.id);
        setPaymentPlans((prev) =>
          prev.filter((plan) => plan.id !== deleteConfirm.id),
        );
        toast.success(t('ticketsPayments.msgPlanDeleted') || "Ödeme planı başarıyla silindi!");
      } else {
        await ticketPaymentRecordsService.delete(deleteConfirm.id);
        setPaymentRecords((prev) =>
          prev.filter((record) => record.id !== deleteConfirm.id),
        );

        if (showPaymentModal) {
          setShowPaymentModal(false);
          setSelectedPaymentPlan(null);
          setNewPayment({
            amount: 0,
            payment_date: toCalendarYmd(new Date()),
            payment_method: "credit_card",
            recipient: "",
            notes: "",
          });
        }
        toast.success(t('ticketsPayments.msgPaymentDeleted') || "Ödeme kaydı başarıyla silindi!");
      }
      setDeleteConfirm({
        show: false,
        type: null,
        id: null,
        isDeleting: false,
      });
    } catch (error) {
      console.error("Silme hatası:", error);
        toast.error(
          deleteConfirm.type === "plan"
            ? (t('ticketsPayments.msgPlanDeleteError') || "Ödeme planı silinirken hata oluştu!")
            : (t('ticketsPayments.msgPaymentDeleteError') || "Ödeme silinirken hata oluştu!")
        );
    } finally {
      setDeleteConfirm((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // ExcelJS ile Export
  const exportPaymentsExcel = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(
      `${typeof document !== "undefined" ? document.title.split("-")[0].trim() : "MICE"} - ${t('ticketsPayments.excelFilenameSuffix') || "Bilet Ödemeleri"}`,
    );
    sheet.pageSetup = {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      paperSize: 9,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.3,
        bottom: 0.3,
        header: 0.1,
        footer: 0.1,
      },
    } as any;

    // Header band
    const top = sheet.addRow([]);
    top.height = 48;
    sheet.mergeCells("A1:Q1");
    for (let c = 1; c <= 17; c++) {
      sheet.getRow(1).getCell(c).value = "";
      sheet.getRow(1).getCell(c).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF232F38" },
      } as any;
    }

    // Logos
    let iconLogoBase64: string | undefined;
    let wordmarkLogoBase64: string | undefined;
    try {
      const { SettingsService } = await import("@/lib/supabaseService");
      const settings = await SettingsService.getSettings();
      const general = settings?.general_settings || {};
      iconLogoBase64 = general?.icon_logo;
      wordmarkLogoBase64 = general?.wordmark_logo;
    } catch {}
    const inchToPx = (inch: number) => Math.round(inch * 96);
    const guessExt = (dataUrl: string): "png" | "jpeg" =>
      (dataUrl || "").includes("image/png") ? "png" : "jpeg";
    if (iconLogoBase64) {
      const iconId = workbook.addImage({
        base64: iconLogoBase64,
        extension: guessExt(iconLogoBase64),
      });
      sheet.addImage(iconId, {
        tl: { col: 0.15, row: 0.15 },
        ext: { width: 120, height: 60 } as any,
      } as any);
    }
    if (wordmarkLogoBase64) {
      const markId = workbook.addImage({
        base64: wordmarkLogoBase64,
        extension: guessExt(wordmarkLogoBase64),
      });
      sheet.addImage(markId, {
        tl: { col: 13.5, row: 0.23 },
        ext: { width: 120, height: 60 } as any,
      } as any);
    }

    // Columns
    sheet.columns = [
      { header: t('ticketsPayments.excelVoucherNo') || "VOUCHER NO", key: "voucher_no", width: 16 },
      { header: t('ticketsPayments.excelAgent') || "ACENTE", key: "agent", width: 20 },
      { header: t('ticketsPayments.excelCompanyName') || "FİRMA ADI", key: "company_name", width: 22 },
      { header: t('ticketsPayments.excelSupplier') || "TEDARİKÇİ", key: "supplier", width: 20 },
      { header: t('ticketsPayments.excelAirline') || "HAVAYOLU", key: "airline", width: 12 },
      { header: t('ticketsPayments.excelRoute') || "GÜZERGAH", key: "route", width: 16 },
      { header: t('ticketsPayments.excelDepDate') || "GİDİŞ TARİHİ", key: "departure_date", width: 14 },
      { header: t('ticketsPayments.excelDepTime') || "GİDİŞ SAATİ", key: "departure_time", width: 12 },
      { header: t('ticketsPayments.excelRetDate') || "DÖNÜŞ TARİHİ", key: "return_date", width: 14 },
      { header: t('ticketsPayments.excelRetTime') || "DÖNÜŞ SAATİ", key: "return_time", width: 12 },
      { header: t('ticketsPayments.excelPaxCount') || "KİŞİ SAYISI", key: "passenger_count", width: 12 },
      { header: t('ticketsPayments.excelTotalCost') || "TOPLAM MALİYET", key: "total_cost", width: 14 },
      { header: t('ticketsPayments.excelPaid') || "ÖDENEN", key: "paid_amount", width: 12 },
      { header: t('ticketsPayments.excelRemaining') || "KALAN", key: "remaining_amount", width: 12 },
      { header: t('ticketsPayments.excelProgress') || "İLERLEME %", key: "progress_percentage", width: 12 },
      { header: t('ticketsPayments.excelStatus') || "DURUM", key: "status", width: 12 },
      { header: t('ticketsPayments.excelCurrency') || "DÖVİZ", key: "currency", width: 8 },
    ];
    const headerRow = sheet.addRow(sheet.columns.map((c: any) => c.header));
    sheet.getRow(headerRow.number).height = 18;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2F3B46" },
      } as any;
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: false,
        indent: 0,
      } as any;
    });

    // Sayısal sütunlar
    sheet.getColumn("passenger_count").numFmt = "0";
    sheet.getColumn("total_cost").numFmt = "#,##0.00";
    sheet.getColumn("paid_amount").numFmt = "#,##0.00";
    sheet.getColumn("remaining_amount").numFmt = "#,##0.00";
    sheet.getColumn("progress_percentage").numFmt = "0";

    const fmtDate = (d?: string) =>
      d ? new Date(d).toLocaleDateString("tr-TR") : "";
    const fmtTime = (t?: string) =>
      t
        ? t.includes("T")
          ? new Date(t).toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : t
        : "";
    const getStatusText = (status: string) => {
      switch (status) {
        case "completed":
          return t('ticketsPayments.excelStatusCompleted') || "Tamamlandı";
        case "partial":
          return t('ticketsPayments.excelStatusPartial') || "Kısmi";
        case "pending":
          return t('ticketsPayments.excelStatusPending') || "Beklemede";
        default:
          return status;
      }
    };

    filteredTickets.forEach((ticket: any) => {
      const paidAmount = getTicketTotalPaid(ticket.id);
      const remainingAmount = getTicketRemainingAmount(ticket.id);
      const progressPercentage =
        ticket.total_cost > 0
          ? Math.round((paidAmount / ticket.total_cost) * 100)
          : 0;
      const status = getTicketPaymentStatus(ticket.id);

      const dataRow = sheet.addRow({
        voucher_no: ticket.voucher_no || "",
        agent: ticket.agent || "",
        company_name: ticket.company_name || "",
        supplier: ticket.supplier || "",
        airline: ticket.airline || "",
        route: ticket.route || "",
        departure_date: fmtDate(ticket.departure_date),
        departure_time: fmtTime(ticket.departure_time),
        return_date: fmtDate(ticket.return_date),
        return_time: fmtTime(ticket.return_time),
        passenger_count: Number(ticket.passenger_count || 0),
        total_cost: Number(ticket.total_cost || 0),
        paid_amount: Number(paidAmount),
        remaining_amount: Number(remainingAmount),
        progress_percentage: Number(progressPercentage),
        status: getStatusText(status),
        currency: ticket.currency || "",
      });
      // Veri satırı: sayısal sütunlar sağa hizalı
      dataRow.getCell(11).alignment = {
        horizontal: "right",
        vertical: "middle",
      } as any; // passenger_count
      dataRow.getCell(12).alignment = {
        horizontal: "right",
        vertical: "middle",
      } as any; // total_cost
      dataRow.getCell(13).alignment = {
        horizontal: "right",
        vertical: "middle",
      } as any; // paid_amount
      dataRow.getCell(14).alignment = {
        horizontal: "right",
        vertical: "middle",
      } as any; // remaining_amount
      dataRow.getCell(15).alignment = {
        horizontal: "right",
        vertical: "middle",
      } as any; // progress_percentage
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bilet_odemeleri_${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number, currency: string) => {
    const normalizedCurrency = currency === "TL" ? "TRY" : currency;
    try {
      return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: normalizedCurrency,
      }).format(amount);
    } catch (error) {
      return `${amount.toLocaleString("tr-TR")} ${normalizedCurrency}`;
    }
  };

  const formatDate = (date: string) => {
    const parsed = parseDate(date);
    return parsed ? parsed.toLocaleDateString("tr-TR") : "-";
  };

  const getTicketPaymentStatus = (ticketId: string) => {
    const ticketPlans = paymentPlans.filter(
      (plan) => plan.ticket_id === ticketId,
    );
    if (ticketPlans.length === 0) return "pending";

    const totalAmount = ticketPlans.reduce(
      (sum, plan) => sum + plan.total_amount,
      0,
    );
    const totalPaid = paymentRecords
      .filter((record) =>
        ticketPlans.some((plan) => plan.id === record.payment_plan_id),
      )
      .reduce((sum, record) => sum + record.amount, 0);

    if (totalPaid === 0) return "pending";
    if (totalPaid >= totalAmount) return "completed";
    return "partial";
  };

  const getTicketTotalPaid = (ticketId: string) => {
    const ticketPlans = paymentPlans.filter(
      (plan) => plan.ticket_id === ticketId,
    );
    return paymentRecords
      .filter((record) =>
        ticketPlans.some((plan) => plan.id === record.payment_plan_id),
      )
      .reduce((sum, record) => sum + record.amount, 0);
  };

  const getTicketRemainingAmount = (ticketId: string) => {
    const ticket = confirmedTickets.find((t) => t.id === ticketId);
    if (!ticket) return 0;

    const totalPaid = getTicketTotalPaid(ticketId);
    const remaining = Math.max(0, ticket.total_cost - totalPaid);

    return remaining;
  };

  // Filtrelenmiş biletleri hesapla
  const filteredTickets = useMemo(() => {
    const filtered = confirmedTickets.filter((ticket) => {
      // Genel Arama kontrolü
      if (voucherTokens.length > 0 || voucherInput) {
        const searchStr = [
          ticket.voucher_no,
          ticket.pnr,
          ticket.company_name,
          ticket.agent,
          ticket.airline,
        ]
          .join(" ")
          .toLowerCase();

        if (voucherInput && !searchStr.includes(voucherInput.toLowerCase())) {
          return false;
        }

        if (voucherTokens.length > 0) {
          const allTokensMatch = voucherTokens.every((token) =>
            searchStr.includes(token.toLowerCase()),
          );
          if (!allTokensMatch) return false;
        }
      }

      // Gidiş/Dönüş tarihi kontrolü
      const departureYmd = toCalendarYmd(ticket.departure_date);
      const returnYmd = toCalendarYmd(ticket.return_date);
      if (departureDateRange.startDate) {
        if (!departureYmd || departureYmd < departureDateRange.startDate)
          return false;
      }
      if (departureDateRange.endDate) {
        if (!returnYmd || returnYmd > departureDateRange.endDate) return false;
      }

      // Ödeme Tarihi kontrolü (taksit tarihleri üzerinden)
      if (paymentDateRange.startDate || paymentDateRange.endDate) {
        const tPlans = paymentPlans.filter((p) => p.ticket_id === ticket.id);
        if (tPlans.length === 0) return false;

        const hasValidInstallment = tPlans.some((plan) => {
          return (plan.installments || []).some((inst: any) => {
            if (!inst.date) return false;
            const instYmd = toCalendarYmd(inst.date);
            if (!instYmd) return false;
            if (
              paymentDateRange.startDate &&
              instYmd < paymentDateRange.startDate
            )
              return false;
            if (paymentDateRange.endDate && instYmd > paymentDateRange.endDate)
              return false;
            return true;
          });
        });

        if (!hasValidInstallment) return false;
      }

      return true;
    });

    // Bakiyesi Olan filtresi: sadece bakiyesi > 0 olanları göster ve sırala
    if (sortBy === "balance") {
      const withBalance = filtered.filter(
        (t) => getTicketRemainingAmount(t.id) > 0,
      );
      return sortTickets(withBalance);
    }
    // Diğerleri: sıralama uygula
    return sortTickets(filtered);
  }, [
    confirmedTickets,
    voucherTokens,
    voucherInput,
    departureDateRange.startDate,
    departureDateRange.endDate,
    paymentDateRange.startDate,
    paymentDateRange.endDate,
    paymentPlans,
    paymentRecords,
    sortBy,
    toCalendarYmd,
  ]);
  const paginatedTickets = paginateItems(filteredTickets, page, pageSize);

  useEffect(() => {
    setPage(1);
  }, [
    voucherTokens,
    voucherInput,
    departureDateRange.startDate,
    departureDateRange.endDate,
    paymentDateRange.startDate,
    paymentDateRange.endDate,
    sortBy,
  ]);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.TICKETS)) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Bu sayfaya erişim yetkiniz bulunmuyor.
          </p>
          <a
            href="/tickets"
            className="bg-blue-500 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200"
          >
            Biletlere Dön
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message={t('ticketsPayments.loading') || "Bilet ödemeleri yükleniyor..."} />;
  }

  return (
    <div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">
      <div className="w-full min-w-0 flex flex-col flex-1 min-h-0 space-y-2">
        {/* Unified Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2">
          {/* Left: Title */}
          <div className="shrink-0 mr-4">
            <h1 className="text-2xl font-light tracking-wide text-white glow-text">
              {t('ticketsPayments.title') || "Bilet Ödemeleri"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {t('ticketsPayments.desc') || "Biletin ödeme planlarını yönetin"}
            </p>
          </div>

          {/* Right: All Filters and Actions */}
          <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
            {/* Dates */}
            <div className="w-[240px] shrink-0">
              <ResponsiveDateRangeField
                label={t('ticketsPayments.filterPaymentDate') || "Ödeme Tarihi"}
                startValue={paymentDateRange.startDate}
                endValue={paymentDateRange.endDate}
                onStartChange={(v) =>
                  setPaymentDateRange((prev) => ({ ...prev, startDate: v }))
                }
                onEndChange={(v) =>
                  setPaymentDateRange((prev) => ({ ...prev, endDate: v }))
                }
                onApply={() => setPage(1)}
              />
            </div>
            <div className="w-[240px] shrink-0">
              <ResponsiveDateRangeField
                label={t('ticketsPayments.filterFlightDate') || "Uçuş Tarihi"}
                startValue={departureDateRange.startDate}
                endValue={departureDateRange.endDate}
                onStartChange={(v) =>
                  setDepartureDateRange((prev) => ({ ...prev, startDate: v }))
                }
                onEndChange={(v) =>
                  setDepartureDateRange((prev) => ({ ...prev, endDate: v }))
                }
                onApply={() => setPage(1)}
              />
            </div>

            {/* Search */}
            <div className="flex-[2] min-w-[300px]">
              <MultiTokenFilterInput
                label={t('ticketsPayments.filterGeneralSearch') || "Genel Arama (Voucher, PNR, Firma vb.)"}
                tokens={voucherTokens}
                inputValue={voucherInput}
                suggestions={voucherSuggestions}
                onInputChange={setVoucherInput}
                onAddToken={(value) =>
                  addToken(value, setVoucherTokens, setVoucherInput)
                }
                onRemoveToken={(value) => removeToken(value, setVoucherTokens)}
              />
            </div>



            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 border-l border-white/10 pl-3">
              <button
                type="button"
                onClick={exportPaymentsExcel}
                className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2"
                title={t('ticketsPayments.btnDownloadExcel') || "Excel İndir"}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {t('ticketsPayments.btnDownloadExcel') || "Excel İndir"}
              </button>
            </div>
          </div>
        </div>

        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-sm shrink-0 mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium uppercase tracking-wider ml-2">
              {t('ticketsPayments.sortBy') || "SIRALAMA / FİLTRE"}:
            </span>
            <button
              onClick={() => setSortBy("payment")}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${sortBy === "payment" ? "bg-emerald-500/20 border border-emerald-500/50 text-white" : "hover:bg-white/5 border border-transparent text-white"}`}
            >
              <span>{t('ticketsPayments.sortPayment') || "ÖDEME TARİHİ"}</span>
            </button>
            <button
              onClick={() => setSortBy("flight")}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${sortBy === "flight" ? "bg-blue-500/20 border border-blue-500/50 text-white" : "hover:bg-white/5 border border-transparent text-white"}`}
            >
              <span>{t('ticketsPayments.sortFlight') || "UÇUŞ TARİHİ"}</span>
            </button>
            <button
              onClick={() => setSortBy("balance")}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${sortBy === "balance" ? "bg-orange-500/20 border border-orange-500/50 text-white" : "hover:bg-white/5 border border-transparent text-white"}`}
            >
              <span>{t('ticketsPayments.sortBalance') || "BAKİYESİ OLAN"}</span>
            </button>
          </div>
          <div className="flex items-center gap-2 border-l border-white/10 pl-4 text-slate-400">
            <span className="font-medium text-white">
              {filteredTickets.length} / {confirmedTickets.length}
            </span>{" "}
            {t('ticketsPayments.showingTickets') || "bilet gösteriliyor"}
          </div>
        </div>

        {/* Bilet Listesi */}
        {!confirmedTickets || confirmedTickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">
              {t('ticketsPayments.noConfirmedTickets') || "Henüz konfirme edilmiş bilet bulunmuyor."}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 overflow-auto flex-1 min-h-0 pr-1">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-sm">
                    {t('ticketsPayments.noFilteredTickets') || "Arama kriterlerine uygun bilet bulunamadı."}
                  </p>
                </div>
              ) : (
                paginatedTickets.items.map((ticket) => {
                  const ticketPlans = paymentPlans.filter(
                    (plan) => plan.ticket_id === ticket.id,
                  );
                  const hasPaymentPlan = ticketPlans.length > 0;

                  return (
                    <div
                      key={ticket.id}
                      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 mb-4 group"
                    >
                      {/* Bilet Başlığı */}
                      <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-3 border-b border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-white">
                              {ticket.voucher_no}
                            </span>
                            <span className="text-base px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                              {ticket.currency}
                            </span>
                          </div>
                          <div className="text-base font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(ticket.total_cost, ticket.currency)}
                          </div>
                        </div>

                        {/* Bilet Bilgileri - Header'da */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="flex items-center gap-1">
                            <span className="text-slate-400">🏢</span>
                            <span className="text-white font-medium">
                              {ticket.agent}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-slate-400">🏢</span>
                            <span className="text-white font-medium">
                              {ticket.company_name}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-slate-400">🛫</span>
                            <span className="text-white font-medium">
                              {ticket.departure_date
                                ? formatDate(ticket.departure_date)
                                : "N/A"}
                              {ticket.departure_time && (
                                <span className="text-slate-400 ml-1">
                                  {ticket.departure_time}
                                </span>
                              )}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-slate-400">🛬</span>
                            <span className="text-white font-medium">
                              {ticket.return_date
                                ? formatDate(ticket.return_date)
                                : "N/A"}
                              {ticket.return_time && (
                                <span className="text-slate-400 ml-1">
                                  {ticket.return_time}
                                </span>
                              )}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-slate-400">🛣️</span>
                            <span className="text-white font-medium">
                              {ticket.route}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-slate-400">✈️</span>
                            <span className="text-white font-medium">
                              {ticket.airline}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-slate-400">🎫</span>
                            <span className="text-white font-medium">
                              {ticket.pnr || "N/A"}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-slate-400">👥</span>
                            <span className="text-white font-medium">
                              {ticket.passenger_count} Pax
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Ödeme Durumu ve Aksiyonlar */}
                      <div className="p-4 bg-[#0f172a]/40 border-b border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                {t('ticketsPayments.lblPaid') || "Ödenen"}
                              </div>
                              <div className="text-base font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(
                                  getTicketTotalPaid(ticket.id),
                                  ticket.currency,
                                )}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                {t('ticketsPayments.lblRemaining') || "Kalan"}
                              </div>
                              <div className="text-base font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(
                                  getTicketRemainingAmount(ticket.id),
                                  ticket.currency,
                                )}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                {t('ticketsPayments.lblProgress') || "İlerleme"}
                              </div>
                              <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                                %
                                {ticket.total_cost > 0
                                  ? Math.round(
                                      (getTicketTotalPaid(ticket.id) /
                                        ticket.total_cost) *
                                        100,
                                    )
                                  : 0}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                {t('ticketsPayments.lblStatus') || "Durum"}
                              </div>
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${
                                  getTicketPaymentStatus(ticket.id) ===
                                  "completed"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                                    : getTicketPaymentStatus(ticket.id) ===
                                        "partial"
                                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/20"
                                      : "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                                }`}
                              >
                                {getTicketPaymentStatus(ticket.id) ===
                                "completed"
                                  ? "✅"
                                  : getTicketPaymentStatus(ticket.id) ===
                                      "partial"
                                    ? "⏳"
                                    : "⏰"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {hasPaymentPlan ? (
                              <>
                                <span className="text-xs text-slate-400">
                                  📋 {ticketPlans[0]?.installments?.length || 0}{" "}
                                  {t('ticketsPayments.lblInstallment') || "Taksit"}
                                </span>
                                <span className="text-xs text-slate-400">
                                  💰{" "}
                                  {
                                    paymentRecords.filter((record) =>
                                      ticketPlans.some(
                                        (plan) =>
                                          plan.id === record.payment_plan_id,
                                      ),
                                    ).length
                                  }{" "}
                                  {t('ticketsPayments.lblPaymentCount') || "Ödeme"}
                                </span>
                              </>
                            ) : (
                              <button
                                onClick={() => openPaymentPlanModal(ticket)}
                                className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide hover:bg-blue-500/30 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                              >
                                {t('ticketsPayments.btnCreatePlan') || "🚀 Plan Oluştur"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ödeme Planı Detayları */}
                      {hasPaymentPlan && (
                        <div className="px-4 py-3 bg-blue-500/5 border-t border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600 dark:text-blue-400 font-bold text-base">
                                {t('ticketsPayments.lblPaymentPlan') || "📋 Ödeme Planı:"}
                              </span>
                              <span className="text-base text-slate-400">
                                {t('ticketsPayments.lblTotal') || "Toplam:"}{" "}
                                {formatCurrency(
                                  ticketPlans[0]?.total_amount || 0,
                                  ticket.currency,
                                )}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  openEditPaymentPlanModal(ticketPlans[0]!)
                                }
                                className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-md text-[10px] font-semibold tracking-wide hover:bg-blue-500/30 transition-all duration-300"
                              >
                                {t('ticketsPayments.btnEdit') || "✏️ Düzenle"}
                              </button>
                              <button
                                onClick={() =>
                                  openPaymentModal(ticketPlans[0]!)
                                }
                                className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-md text-[10px] font-semibold tracking-wide hover:bg-emerald-500/30 transition-all duration-300"
                              >
                                {t('ticketsPayments.btnPay') || "💰 Ödeme"}
                              </button>
                              <button
                                onClick={() =>
                                  handleDeletePlanClick(ticketPlans[0]!.id)
                                }
                                className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-md text-[10px] font-semibold tracking-wide hover:bg-red-500/30 transition-all duration-300"
                              >
                                {t('ticketsPayments.btnDelete') || "🗑️ Sil"}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {(() => {
                              const allInstallments =
                                ticketPlans[0]?.installments || [];
                              const visibleInstallments = allInstallments;
                              return visibleInstallments.map((installment) => {
                                const originalIndex = allInstallments.findIndex(
                                  (i) => i.id === installment.id,
                                );
                                return (
                                  <div
                                    key={installment.id}
                                    className="flex items-center justify-between bg-white/5 rounded px-3 py-2 border border-white/5 hover:bg-white/10 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="bg-blue-500/20 text-blue-300 text-[11px] font-medium px-2 py-1 rounded-full">
                                        {originalIndex + 1}. {t('ticketsPayments.lblInstallmentIndex') || "Taksit"}
                                      </span>
                                      <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[70px]">
                                        {formatDate(installment.date)}
                                      </span>
                                      <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[50px]">
                                        %{installment.percentage}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                                        {formatCurrency(
                                          installment.amount,
                                          installment.currency,
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Ödeme Geçmişi Bölümü */}
                      <div className="px-3 py-2">
                        <h4 className="font-bold text-white flex items-center gap-2 text-base mb-2">
                          {t('ticketsPayments.lblPaymentHistory') || "💰 Ödeme Geçmişi"}
                        </h4>
                        {(() => {
                          const ticketPayments = paymentRecords.filter(
                            (record) =>
                              ticketPlans.some(
                                (plan) => plan.id === record.payment_plan_id,
                              ),
                          );

                          if (ticketPayments.length === 0) {
                            return (
                              <div className="text-center py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-sm text-slate-400">
                                  {t('ticketsPayments.noPaymentsYet') || "Henüz ödeme yapılmamış"}
                                </p>
                              </div>
                            );
                          }

                          // Ödemeleri tarihe göre sırala (en eski tarihten en yeni tarihe)
                          const sortedPayments = [...ticketPayments].sort(
                            (a, b) => {
                              const ad = parseDate(a.payment_date);
                              const bd = parseDate(b.payment_date);
                              return (
                                (ad?.getTime() || 0) - (bd?.getTime() || 0)
                              );
                            },
                          );

                          return (
                            <div className="space-y-1">
                              {sortedPayments.map((payment) => {
                                const originalIndex = sortedPayments.findIndex(
                                  (p) => p.id === payment.id,
                                );
                                // Sıralanmış ödemelerde doğru index kullan
                                return (
                                  <div
                                    key={payment.id}
                                    className="flex items-center justify-between bg-white/5 rounded px-3 py-2 border border-white/5 hover:bg-white/10 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-medium px-2 py-1 rounded-full">
                                        {originalIndex + 1}. {t('ticketsPayments.lblPaymentIndex') || "Ödeme"}
                                      </span>
                                      <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[70px]">
                                        {formatDate(payment.payment_date)}
                                      </span>
                                      <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[100px]">
                                        {payment.payment_method ===
                                        "credit_card"
                                          ? t('ticketsPayments.methodCreditCard') || "💳 Kredi Kartı"
                                          : payment.payment_method ===
                                              "bank_transfer"
                                            ? t('ticketsPayments.methodBankTransfer') || "🏦 Banka Transferi"
                                            : payment.payment_method === "cash"
                                              ? t('ticketsPayments.methodCash') || "💵 Nakit"
                                              : t('ticketsPayments.methodOnline') || "🌐 Online Ödeme"}
                                      </span>
                                      {payment.recipient && (
                                        <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[80px]">
                                          👤 {payment.recipient}
                                        </span>
                                      )}
                                      {payment.notes && (
                                        <span className="text-xs text-slate-400 min-w-[120px]">
                                          📝 {payment.notes}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                                        {formatCurrency(
                                          payment.amount,
                                          ticket.currency,
                                        )}
                                      </span>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() =>
                                            openEditPaymentModal(payment)
                                          }
                                          className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-md text-[10px] font-semibold tracking-wide hover:bg-blue-500/30 transition-all duration-300"
                                        >
                                          {t('ticketsPayments.btnEdit') || "✏️ Düzenle"}
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteRecordClick(payment.id)
                                          }
                                          className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-md text-[10px] font-semibold tracking-wide hover:bg-red-500/30 transition-all duration-300"
                                        >
                                          {t('ticketsPayments.btnDelete') || "🗑️ Sil"}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <PaginationControls
              page={paginatedTickets.page}
              pageSize={paginatedTickets.pageSize}
              total={paginatedTickets.total}
              totalPages={paginatedTickets.totalPages}
              preferenceKey="tickets_payments_page_size"
              compactRight
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </>
        )}

        {/* Ödeme Planı Modalı (Oluştur/Düzenle) */}
        {showPaymentPlanModal && selectedTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setShowPaymentPlanModal(false)}
            />

            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {selectedPaymentPlan
                        ? t('ticketsPayments.modalEditPlan') || "Ödeme Planını Düzenle"
                        : t('ticketsPayments.modalNewPlan') || "Yeni Ödeme Planı"}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {selectedTicket.voucher_no} - {selectedTicket.agent}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentPlanModal(false)}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Bilet Özeti */}
                <div className="mb-6 p-4 rounded-xl bg-blue-500/10/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 grid grid-cols-3 gap-4">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold mb-1">
                      {t('ticketsPayments.lblTotalCost') || "Toplam Tutar"}
                    </span>
                    <span className="text-lg font-black text-blue-700 dark:text-blue-300">
                      {formatCurrency(
                        selectedTicket.total_cost,
                        selectedTicket.currency,
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold mb-1">
                      {t('ticketsPayments.lblAirline') || "Havayolu"}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {selectedTicket.airline || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold mb-1">
                      {t('ticketsPayments.lblPNR') || "PNR"}
                    </span>
                    <span className="text-sm font-semibold text-white font-mono">
                      {selectedTicket.pnr || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Percent className="w-4 h-4 text-blue-400" />
                    {t('ticketsPayments.lblInstallmentConfig') || "Taksit Yapılandırması"}
                  </h4>
                  <button
                    onClick={addInstallment}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-500/90 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t('ticketsPayments.btnAddInstallment') || "Taksit Ekle"}
                  </button>
                </div>

                <div className="space-y-3">
                  {newPaymentPlan.installments.map((installment, index) => (
                    <div
                      key={installment.id}
                      className="group relative flex flex-col sm:flex-row items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                    >
                      <div className="absolute -left-2 sm:left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-sm z-10">
                        {index + 1}
                      </div>

                      <div className="w-full sm:flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 pl-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                            {t('ticketsPayments.lblDueDate') || "Vade Tarihi"}
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="date"
                              value={installment.date}
                              onChange={(e) =>
                                updateInstallment(index, "date", e.target.value)
                              }
                              className="w-full pl-8 pr-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-800 text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                            {t('ticketsPayments.lblPercentage') || "Yüzde (%)"}
                          </label>
                          <div className="relative">
                            <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0"
                              value={installment.percentage || ""}
                              onChange={(e) =>
                                updateInstallment(
                                  index,
                                  "percentage",
                                  Number(e.target.value) || 0,
                                )
                              }
                              className="w-full pl-8 pr-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-800 text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                            {t('ticketsPayments.lblAmount') || "Tutar"}
                          </label>
                          <div className="relative">
                            <Banknote className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={installment.amount || ""}
                              onChange={(e) =>
                                updateInstallment(
                                  index,
                                  "amount",
                                  Number(e.target.value) || 0,
                                )
                              }
                              className="w-full pl-8 pr-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-800 text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-blue-600 dark:text-blue-400"
                            />
                          </div>
                        </div>
                      </div>

                      {newPaymentPlan.installments.length > 1 && (
                        <button
                          onClick={() => removeInstallment(index)}
                          className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all self-end sm:self-center"
                          title={t('ticketsPayments.btnRemoveInstallment') || "Taksiti Kaldır"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Özet ve Hata Kontrolü */}
                <div className="mt-8 p-4 rounded-2xl bg-gray-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex gap-8">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">
                        {t('ticketsPayments.lblTotalPercentage') || "Toplam Yüzde"}
                      </span>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${Math.abs(newPaymentPlan.installments.reduce((sum, inst) => sum + inst.percentage, 0) - 100) < 0.01 ? "bg-green-500" : "bg-red-500"}`}
                        />
                        <span
                          className={`text-xl font-black ${Math.abs(newPaymentPlan.installments.reduce((sum, inst) => sum + inst.percentage, 0) - 100) < 0.01 ? "text-white" : "text-red-400"}`}
                        >
                          %
                          {newPaymentPlan.installments
                            .reduce(
                              (sum, inst) =>
                                sum + (Number(inst.percentage) || 0),
                              0,
                            )
                            .toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="w-px h-10 bg-gray-800" />
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">
                        {t('ticketsPayments.lblPlannedTotal') || "Planlanan Toplam"}
                      </span>
                      <span className="text-xl font-black text-blue-400">
                        {formatCurrency(
                          newPaymentPlan.installments.reduce(
                            (sum, inst) => sum + (Number(inst.amount) || 0),
                            0,
                          ),
                          selectedTicket.currency,
                        )}
                      </span>
                    </div>
                  </div>

                  {Math.abs(
                    newPaymentPlan.installments.reduce(
                      (sum, inst) => sum + inst.percentage,
                      0,
                    ) - 100,
                  ) > 0.01 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20 animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {t('ticketsPayments.errPercentageMustBe100') || "TOPLAM YÜZDE %100 OLMALIDIR"}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setShowPaymentPlanModal(false)}
                  className="w-full sm:w-auto px-6 py-2 rounded-xl text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  {t('ticketsPayments.btnCancel') || "İptal"}
                </button>
                <button
                  onClick={() => {
                    const totalPercentage = newPaymentPlan.installments.reduce(
                      (sum, inst) => sum + inst.percentage,
                      0,
                    );
                    const totalAmount = newPaymentPlan.installments.reduce(
                      (sum, inst) => sum + inst.amount,
                      0,
                    );

                    if (Math.abs(totalPercentage - 100) > 0.01) {
                      toast.error(t('ticketsPayments.msgTotalPercentage100') || "Toplam yüzde 100 olmalıdır!");
                      return;
                    }

                    if (
                      Math.abs(totalAmount - selectedTicket.total_cost) > 0.1
                    ) {
                      toast.error(
                        t('ticketsPayments.msgTotalMatchTicketCost') || "Toplam tutar bilet tutarı ile eşleşmelidir!",
                      );
                      return;
                    }

                    if (selectedPaymentPlan) {
                      updatePaymentPlan(
                        selectedPaymentPlan.id,
                        newPaymentPlan.installments,
                      );
                    } else {
                      createPaymentPlan(
                        selectedTicket.id,
                        newPaymentPlan.installments,
                      );
                    }
                  }}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-blue-500 hover:bg-blue-500/90 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
                >
                  <Save className="w-4 h-4" />
                  {selectedPaymentPlan ? (t('ticketsPayments.btnUpdatePlan') || "Planı Güncelle") : (t('ticketsPayments.btnSavePlan') || "Planı Kaydet")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ödeme Kayıt Modalı */}
        {showPaymentModal && selectedPaymentPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setShowPaymentModal(false)}
            />

            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {selectedPaymentRecord
                        ? t('ticketsPayments.modalEditPayment') || "Ödemeyi Düzenle"
                        : t('ticketsPayments.modalNewPayment') || "Ödeme Kaydet"}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5" />
                    {t('ticketsPayments.lblAmount') || "Tutar"}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={newPayment.amount === 0 ? "" : newPayment.amount}
                      onChange={(e) =>
                        setNewPayment((prev) => ({
                          ...prev,
                          amount: Number(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-white font-bold focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {t('ticketsPayments.lblDate') || "Tarih"}
                    </label>
                    <input
                      type="date"
                      value={newPayment.payment_date}
                      onChange={(e) =>
                        setNewPayment((prev) => ({
                          ...prev,
                          payment_date: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-xs text-white focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      {t('ticketsPayments.lblMethod') || "Yöntem"}
                    </label>
                    <select
                      value={newPayment.payment_method}
                      onChange={(e) =>
                        setNewPayment((prev) => ({
                          ...prev,
                          payment_method: e.target.value as any,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-xs text-white focus:ring-2 focus:ring-green-500/20 outline-none transition-all appearance-none"
                    >
                      <option value="credit_card">{t('ticketsPayments.methodCreditCard') || "💳 Kredi Kartı"}</option>
                      <option value="bank_transfer">{t('ticketsPayments.methodBankTransfer') || "🏦 Banka Transferi"}</option>
                      <option value="cash">{t('ticketsPayments.methodCash') || "💵 Nakit"}</option>
                      <option value="online">{t('ticketsPayments.methodOnline') || "🌐 Online"}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {t('ticketsPayments.lblRecipient') || "Alıcı / Açıklama"}
                  </label>
                  <input
                    type="text"
                    value={newPayment.recipient}
                    onChange={(e) =>
                      setNewPayment((prev) => ({
                        ...prev,
                        recipient: e.target.value,
                      }))
                    }
                    placeholder={t('ticketsPayments.phRecipient') || "Alıcı ismi veya firma..."}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-xs text-white focus:ring-2 focus:ring-green-500/20 outline-none transition-all placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {t('ticketsPayments.lblNotes') || "Notlar"}
                  </label>
                  <textarea
                    value={newPayment.notes}
                    onChange={(e) =>
                      setNewPayment((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder={t('ticketsPayments.phNotes') || "Ek detaylar..."}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-xs text-white focus:ring-2 focus:ring-green-500/20 outline-none transition-all resize-none placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  {t('ticketsPayments.btnCancel') || "İptal"}
                </button>
                <button
                  onClick={recordPayment}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-all shadow-lg shadow-green-500/20"
                >
                  <Check className="w-4 h-4" />
                  {selectedPaymentRecord ? (t('ticketsPayments.btnUpdate') || "Güncelle") : (t('ticketsPayments.btnSave') || "Kaydet")}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* MODERN SİLME ONAY MODALI */}
        <Modal
          isOpen={deleteConfirm.show}
          onClose={() =>
            !deleteConfirm.isDeleting &&
            setDeleteConfirm((prev) => ({ ...prev, show: false }))
          }
          title={
            deleteConfirm.type === "plan"
              ? t('ticketsPayments.modalDeletePlan') || "Ödeme Planını Sil"
              : t('ticketsPayments.modalDeletePayment') || "Ödeme Kaydını Sil"
          }
        >
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t('ticketsPayments.lblAreYouSure') || "Emin misiniz?"}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {deleteConfirm.type === "plan"
                ? (t('ticketsPayments.descDeletePlan') || "Bu ödeme planını silmek istediğinizden emin misiniz? Plan silindiğinde tüm taksitler kaldırılır.")
                : (t('ticketsPayments.descDeletePayment') || "Bu ödeme kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() =>
                  setDeleteConfirm((prev) => ({ ...prev, show: false }))
                }
                disabled={deleteConfirm.isDeleting}
                className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
              >
                {t('ticketsPayments.btnGiveUp') || "Vazgeç"}
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteConfirm.isDeleting}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 font-medium flex items-center gap-2"
              >
                {deleteConfirm.isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('ticketsPayments.btnDeleting') || "Siliniyor..."}
                  </>
                ) : (
                  t('ticketsPayments.btnYesDelete') || "Evet, Sil"
                )}
              </button>
            </div>
          </div>
        </Modal>

        <style jsx global>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(16px) scale(0.97);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
