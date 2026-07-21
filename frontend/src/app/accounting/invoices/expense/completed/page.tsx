"use client";

import { useState, useEffect, useMemo } from "react";
import { invoicesService } from "@/lib/supabaseService";
import LoadingSpinner from "@/components/LoadingSpinner";
import InvoiceModal from "@/components/accounting/InvoiceModal";
import CompletedInvoicePreview from "@/components/accounting/CompletedInvoicePreview";
import ConfirmModal from "@/components/ConfirmModal";
import PaginationControls from "@/components/PaginationControls";
import ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import { DEFAULT_PAGE_SIZE } from "@/types/pagination";
import { usePermissions, Module } from "@/lib/permissions";
import { Download, X } from "lucide-react";
import * as XLSX from "xlsx";

export default function ExpenseCompletedPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split("T")[0],
    end: "",
  });

  const [globalTokens, setGlobalTokens] = useState<string[]>([]);
  const [globalInput, setGlobalInput] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedInvoiceItems, setSelectedInvoiceItems] = useState<any[]>([]);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<{
    id: string;
    no: string;
  } | null>(null);

  useEffect(() => {
    loadInvoices();
  }, [dateRange.start, dateRange.end]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoicesService.getInvoicesPage({
        type: "expense",
        fetchAllInRange: true,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
      });
      setAllInvoices(response.data);
    } catch (err) {
      console.error("Invoices load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [dateRange.start, dateRange.end, globalTokens]);

  const filteredInvoices = useMemo(() => {
    const searchTerms = [...globalTokens, globalInput.trim()]
      .filter(Boolean)
      .map((t) => t.toLowerCase());
    if (!searchTerms.length) {
      return allInvoices;
    }
    return allInvoices.filter((inv) => {
      const isSejour = inv.metadata?.is_sejour === true;
      const category = (inv.metadata?.category_search || "").toLowerCase();
      const hotelSearchTarget = [
        inv.metadata?.hotel_name || "",
        !isSejour ? inv.metadata?.reference || "" : "",
        inv.notes || "",
      ]
        .join(" ")
        .toLowerCase();
      const firmaBarHaystack = (
        inv.metadata?.agency_name ||
        (isSejour ? inv.metadata?.company_name : "") ||
        ""
      ).toLowerCase();
      const acenteBarHaystack = (
        isSejour ? "" : inv.metadata?.company_name || ""
      ).toLowerCase();
      const voucher = (inv.metadata?.voucher_number || "").toLowerCase();
      const reference = (
        !isSejour ? inv.metadata?.reference || "" : ""
      ).toLowerCase();
      const notes = (inv.notes || "").toLowerCase();

      const combinedHaystack = [
        voucher,
        reference,
        firmaBarHaystack,
        acenteBarHaystack,
        hotelSearchTarget,
        category,
        notes,
        inv.invoice_no,
        inv.contact_name,
      ]
        .join(" ")
        .toLowerCase();

      return searchTerms.every((term) => combinedHaystack.includes(term));
    });
  }, [allInvoices, globalTokens, globalInput]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const displayInvoices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const exportToExcel = () => {
    const exportData = filteredInvoices.map((inv) => ({
      "Fatura Tarihi": new Date(inv.date).toLocaleDateString("tr-TR"),
      "Fatura No": inv.invoice_no,
      "Tedarikçi / Cari": inv.contact_name,
      "Firma / Acente": inv.metadata?.company_name || "-",
      Otel: inv.metadata?.hotel_name || "-",
      "Hizmet Tarihi": inv.metadata?.date_start
        ? `${new Date(inv.metadata.date_start).toLocaleDateString("tr-TR")} - ${new Date(inv.metadata.date_end).toLocaleDateString("tr-TR")}`
        : "-",
      Voucher: inv.metadata?.voucher_number || inv.metadata?.reference || "-",
      Tutar: inv.total_amount,
      "Para Birimi": inv.currency,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tamamlanan Gider Faturalari");
    XLSX.writeFile(
      wb,
      `Tamamlanan_Gider_Faturalari_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.INVOICES)) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-v3-text mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-v3-muted mb-6">
            Bu sayfaya erişim yetkiniz bulunmuyor.
          </p>
          <a
            href="/accounting"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 transition-colors"
          >
            Muhasebeye Dön
          </a>
        </div>
      </div>
    );
  }

  const handleEdit = async (inv: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setLoading(true);
      const fullInvoice = await invoicesService.getById(inv.id);
      setSelectedInvoice(fullInvoice);
      setSelectedInvoiceItems(fullInvoice.invoice_items || []);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Fetch invoice error:", err);
      alert("Fatura detayları yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (inv: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setLoading(true);
      const fullInvoice = await invoicesService.getById(inv.id);
      setSelectedInvoice(fullInvoice);
      setSelectedInvoiceItems(fullInvoice.invoice_items || []);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error("Preview fetch error:", err);
      alert("Önizleme yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string, no: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingInvoice({ id, no });
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingInvoice) return;
    try {
      setLoading(true);
      await invoicesService.delete(deletingInvoice.id);
      setIsDeleteConfirmOpen(false);
      setDeletingInvoice(null);
      await loadInvoices();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Silme işlemi sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency || "TRY",
    }).format(amount || 0);
  };

  const voucherDisplay = (inv: any) => {
    const v = inv.metadata?.voucher_number;
    const r = inv.metadata?.reference;
    if (v && r) return `${v} · ${r}`;
    return v || r || "";
  };

  return (
    <div className="h-[calc(100vh-2rem)] w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-v3-text">
      <div className="w-full min-w-0 flex-1 flex flex-col min-h-0">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-4 shrink-0">
          {/* Sol: Başlık */}
          <div className="shrink-0 mr-2">
            <h1 className="text-2xl font-light tracking-wide text-v3-text glow-text">
              Tamamlanan Gider Faturaları
            </h1>
            <p className="text-xs text-v3-muted mt-1">
              Sisteme işlenmiş alış/gider faturalarının listesi
            </p>
          </div>

          {/* Sağ: Filtreler ve Butonlar */}
          <div className="flex flex-wrap items-end gap-4 flex-1">
            <div className="w-64 shrink-0">
              <ResponsiveDateRangeField
                label="Fatura Tarihi"
                startValue={dateRange.start}
                endValue={dateRange.end}
                onStartChange={(value) =>
                  setDateRange((prev) => ({ ...prev, start: value }))
                }
                onEndChange={(value) =>
                  setDateRange((prev) => ({ ...prev, end: value }))
                }
                onApply={() => {}}
              />
            </div>

            <div className="flex-[2] min-w-[300px] max-w-lg">
              <MultiTokenFilterInput
                label="Genel Arama (Fatura No, Voucher, Tedarikçi, Firma, Otel vb.)"
                tokens={globalTokens}
                inputValue={globalInput}
                suggestions={[]}
                onInputChange={setGlobalInput}
                onAddToken={(t) => {
                  const trimmed = t.trim();
                  if (trimmed && !globalTokens.includes(trimmed)) {
                    setGlobalTokens((prev) => [...prev, trimmed]);
                    setGlobalInput("");
                  }
                }}
                onRemoveToken={(t) =>
                  setGlobalTokens((prev) => prev.filter((v) => v !== t))
                }
              />
            </div>

            <div className="shrink-0 flex items-center gap-3 ml-auto">
              {(dateRange.start ||
                dateRange.end ||
                globalTokens.length > 0 ||
                globalInput.trim().length > 0) && (
                <button
                  onClick={() => {
                    setDateRange({ start: "", end: "" });
                    setGlobalTokens([]);
                    setGlobalInput("");
                  }}
                  className="w-10 h-10 inline-flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all duration-300 hover:scale-105"
                  title="Filtreleri Temizle"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              )}
              <button
                onClick={exportToExcel}
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 hover:scale-105 uppercase"
              >
                <Download size={14} /> Excel İndir
              </button>
            </div>
          </div>
        </div>

        {loading && allInvoices.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner compact />
          </div>
        ) : (
          <div className="bg-v3-surface backdrop-blur-md rounded-2xl border border-v3-border flex-1 min-h-0 flex flex-col w-full relative mt-4 overflow-hidden">
            <div className="overflow-auto w-full flex-1 min-h-0">
              <table className="min-w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-v3-surface/80 sticky top-0 z-10 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-v3-muted uppercase tracking-wider">
                      Fatura Tarihi
                    </th>
                    <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-v3-muted uppercase tracking-wider">
                      Fatura No
                    </th>
                    <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-v3-muted uppercase tracking-wider">
                      Tedarikçi
                    </th>
                    <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-v3-muted uppercase tracking-wider">
                      Firma / Acente
                    </th>
                    <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-v3-muted uppercase tracking-wider">
                      Otel
                    </th>
                    <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-v3-muted uppercase tracking-wider">
                      Hizmet Tarihi
                    </th>
                    <th className="px-2.5 py-2.5 text-left text-[10px] font-semibold text-v3-muted uppercase tracking-wider">
                      Voucher / Ref
                    </th>
                    <th className="px-2.5 py-2.5 text-right text-[10px] font-semibold text-v3-muted uppercase tracking-wider">
                      Tutar
                    </th>
                    <th className="px-2.5 py-2.5 text-center text-[10px] font-semibold text-v3-muted uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {displayInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-orange-500/10 transition-colors group border-b border-v3-border last:border-0 cursor-pointer"
                      onDoubleClick={(e) => handlePreview(inv, e as any)}
                      title="Görüntülemek için çift tıklayın"
                    >
                      <td className="px-2.5 py-2.5 text-[11px] text-slate-700 dark:text-v3-text whitespace-nowrap">
                        {new Date(inv.date).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-2.5 py-2.5">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                          {inv.invoice_no}
                        </span>
                      </td>
                      <td className="px-2.5 py-2.5">
                        <div className="text-[11px] text-slate-700 dark:text-v3-text font-medium">
                          {inv.contact_name}
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5 max-w-[14rem]">
                        {inv.metadata?.company_name ? (
                          <div
                            className="text-[11px] text-slate-600 dark:text-v3-text font-medium truncate"
                            title={inv.metadata.company_name}
                          >
                            {inv.metadata.company_name}
                          </div>
                        ) : (
                          <span className="text-v3-muted dark:text-v3-muted text-[11px]">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 max-w-[12rem]">
                        {inv.metadata?.hotel_name ? (
                          <div
                            className="text-[10px] text-v3-muted dark:text-v3-muted truncate"
                            title={inv.metadata.hotel_name}
                          >
                            {inv.metadata.hotel_name}
                          </div>
                        ) : (
                          <span className="text-v3-muted dark:text-v3-muted text-[10px]">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap">
                        {inv.metadata?.date_start || inv.metadata?.date_end ? (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            {formatDate(inv.metadata.date_start)} →{" "}
                            {formatDate(inv.metadata.date_end)}
                          </span>
                        ) : (
                          <span className="text-v3-muted dark:text-v3-muted text-[10px]">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 max-w-[12rem]">
                        {voucherDisplay(inv) ? (
                          <span
                            className="text-[10px] font-bold text-slate-600 dark:text-v3-text truncate block"
                            title={voucherDisplay(inv)}
                          >
                            {voucherDisplay(inv)}
                          </span>
                        ) : (
                          <span className="text-v3-muted dark:text-v3-muted text-[10px]">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-[11px] font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                        {formatCurrency(inv.total_amount, inv.currency)}
                      </td>
                      <td className="px-2.5 py-2.5 text-center">
                        <div className="flex justify-center gap-1.5  transition-opacity">
                          <button
                            onClick={(e) => handlePreview(inv, e)}
                            className="p-1 text-v3-muted hover:text-orange-500 transition-colors"
                            title="Görüntüle / Yazdır"
                            type="button"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => handleEdit(inv, e)}
                            className="p-1 text-v3-muted hover:text-amber-500 transition-colors"
                            title="Düzenle"
                            type="button"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) =>
                              handleDeleteClick(inv.id, inv.invoice_no, e)
                            }
                            className="p-1 text-v3-muted hover:text-red-500 transition-colors"
                            title="Sil"
                            type="button"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-6 py-16 text-center italic text-v3-muted"
                      >
                        Kayıtlı fatura bulunamadı veya filtrelere uyan sonuç
                        yok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls
              page={page}
              pageSize={pageSize}
              total={filteredInvoices.length}
              totalPages={totalPages}
              preferenceKey="expense_completed_page_size"
              compactRight
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}

        {isModalOpen && selectedInvoice && (
          <InvoiceModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            type="expense"
            onSuccess={loadInvoices}
            editInvoice={selectedInvoice}
            selectedItems={selectedInvoiceItems}
          />
        )}

        {isPreviewOpen && selectedInvoice && (
          <CompletedInvoicePreview
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            invoice={selectedInvoice}
            items={selectedInvoiceItems}
          />
        )}

        <ConfirmModal
          isOpen={isDeleteConfirmOpen}
          onCancel={() => setIsDeleteConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="Faturayı Sil"
          message={`${deletingInvoice?.no} numaralı faturayı silmek istediğinize emin misiniz? Fatura kalemleri bekleyenler listesine geri dönecektir.`}
          confirmText="Evet, Sil"
          cancelText="Vazgeç"
          type="danger"
        />
      </div>
    </div>
  );
}
