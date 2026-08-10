"use client";

import {
  useState,
  useEffect,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from "react";
import { invoicesService } from "@/lib/supabaseService";
import { useDebounce } from "@/hooks/useDebounce";
import InvoiceItemTable from "@/components/accounting/InvoiceItemTable";
import InvoiceModal from "@/components/accounting/InvoiceModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import PaginationControls from "@/components/PaginationControls";
import ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import { DEFAULT_PAGE_SIZE } from "@/types/pagination";
import { X, Download } from "lucide-react";
import { usePermissions, Module } from "@/lib/permissions";

export default function IncomePendingPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split("T")[0],
    end: "",
  });
  const [globalTokens, setGlobalTokens] = useState<string[]>([]);
  const [globalInput, setGlobalInput] = useState("");

  useEffect(() => {
    loadItems();
  }, [page, pageSize, dateRange.start, dateRange.end]);

  const exportToExcel = () => {
    // Excel export logic will be added here
    console.log("Exporting to excel", filteredItems);
    alert("Excel aktarımı yakında eklenecektir.");
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await invoicesService.getPendingSalesItemsPage({
        page,
        pageSize,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        fetchAllInRange: true,
      });
      setItems(response.data);
      setTotal(response.data.length);
    } catch (err) {
      console.error("Pending items load error:", err);
    } finally {
      setLoading(false);
    }
  };

  

  useEffect(() => {
    setPage(1);
  }, [dateRange.start, dateRange.end, globalTokens]);

  const filteredItems = useMemo(() => {
    const searchTerms = [...globalTokens]
      .filter(Boolean)
      .map((t) => t.toLowerCase());
    if (!searchTerms.length) return items;

    return items.filter((item) => {
      const isSejour = item.project?.quote_type === "SEJOUR";
      const category = (item.category_name || "").toLowerCase();
      const hotelSearchTarget = [
        item.project?.hotel_name || "",
        !isSejour ? item.project?.title || "" : "",
        item.project?.description || "",
        item.description || "",
      ]
        .join(" ")
        .toLowerCase();
      const firmaBarHaystack = (
        item.project?.agency_name ||
        item.project?.agency?.name ||
        (isSejour ? item.project?.company_name : "") ||
        ""
      ).toLowerCase();
      const acenteBarHaystack = (
        isSejour ? "" : item.project?.company_name || ""
      ).toLowerCase();
      const voucher = (item.project?.voucher_number || "").toLowerCase();
      const reference = (
        !isSejour ? item.project?.title || "" : ""
      ).toLowerCase();
      const description = (item.description || "").toLowerCase();

      const searchStr = [
        category,
        hotelSearchTarget,
        firmaBarHaystack,
        acenteBarHaystack,
        voucher,
        reference,
        description,
      ].join(" ");

      return searchTerms.every((term) => searchStr.includes(term));
    });
  }, [items, globalTokens]);

  const totalPagesComputed = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  
  const displayItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

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
            className="bg-blue-500 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200"
          >
            Muhasebeye Dön
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-2rem)] w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-v3-text">
      <div className="w-full min-w-0 flex-1 flex flex-col min-h-0">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-4 shrink-0">
          {/* Sol: Başlık */}
          <div className="shrink-0 mr-2">
            <h1 className="text-2xl font-light tracking-wide text-v3-text glow-text">
              Bekleyen Gelir Faturaları
            </h1>
            <p className="text-xs text-v3-muted mt-1">
              Fatura kesilmeyi bekleyen satış kalemleri
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
                label="Genel Arama (Voucher, Firma, Acente, Otel, vb.)"
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

              <button
                onClick={exportToExcel}
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 hover:scale-105 uppercase"
              >
                <Download size={14} /> Excel İndir
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={selectedItems.length === 0}
                className="bg-blue-500 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-bold tracking-wide flex items-center justify-center gap-2 hover:scale-105 uppercase disabled:opacity-50 disabled:pointer-events-none"
              >
                Fatura Oluştur{" "}
                {selectedItems.length > 0 && `(${selectedItems.length})`}
              </button>
            </div>
          </div>
        </div>

        {/* Selection Totals Badge */}
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-v3-surface backdrop-blur-md border border-v3-border shadow-sm rounded-2xl animate-in slide-in-from-top-2 duration-300 mt-4 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                Seçilen Kalemlerin Toplamı ({selectedItems.length} Kalem)
              </h4>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
                {Object.entries(
                  selectedItems.reduce(
                    (acc, item) => {
                      const curr = item.currency || "TRY";
                      acc[curr] = (acc[curr] || 0) + (item.balance || 0);
                      return acc;
                    },
                    {} as Record<string, number>,
                  ),
                ).map(([curr, total]) => (
                  <p
                    key={curr}
                    className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none"
                  >
                    {new Intl.NumberFormat("tr-TR", {
                      style: "currency",
                      currency: curr && curr.length === 3 ? curr : "TRY",
                    }).format(total as number)}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner compact />
          </div>
        ) : (
          <div className="bg-v3-surface backdrop-blur-md rounded-2xl border border-v3-border flex-1 min-h-0 flex flex-col w-full relative mt-4 overflow-hidden">
            <InvoiceItemTable
              items={displayItems}
              type="income"
              onSelectItems={setSelectedItems}
              selectedItems={selectedItems}
              enableInternalSearch={false}
            />
            <PaginationControls
              page={page}
              pageSize={pageSize}
              total={filteredItems.length}
              totalPages={totalPagesComputed}
              preferenceKey="income_pending_page_size"
              compactRight
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}

        <InvoiceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedItems={selectedItems}
          type="income"
          onSuccess={() => {
            setSelectedItems([]);
            loadItems();
          }}
        />
      </div>
    </div>
  );
}
