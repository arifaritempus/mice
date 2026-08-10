"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { agingServiceExt, StatementItem } from "@/lib/agingServiceExt";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { FileText, Download, Printer, ArrowLeft, CalendarClock } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import * as XLSX from "xlsx";
import { DateRangeFieldAccounting } from "@/components/accounting/DateRangeFieldAccounting";

function StatementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const entityName = searchParams.get("entity") || "";
  const defaultCurrency = searchParams.get("currency") || "all";
  
  const [loading, setLoading] = useState(true);
  const [rawRecords, setRawRecords] = useState<StatementItem[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency);
  
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  useEffect(() => {
    if (!entityName) return;
    fetchData();
  }, [entityName]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const records = await agingServiceExt.getStatement(entityName);
      setRawRecords(records);
      
      if (defaultCurrency === "all" && records.length > 0) {
        // Find most used currency or first one
        const curs = [...new Set(records.map(r => r.currency))];
        if (curs.includes("TRY")) setSelectedCurrency("TRY");
        else setSelectedCurrency(curs[0]);
      }
    } catch (error) {
      console.error("Error fetching statement data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processedData = useMemo(() => {
    let balance = 0;
    
    // First, filter records
    const filtered = rawRecords.filter(r => {
      // 1. Currency filter
      if (selectedCurrency !== "all" && r.currency !== selectedCurrency) return false;
      
      // 2. Date filter
      if (dateStart || dateEnd) {
        const d = new Date(r.date || r.createdAt);
        d.setHours(0, 0, 0, 0);
        if (dateStart) {
          const start = new Date(dateStart);
          start.setHours(0, 0, 0, 0);
          if (d < start) return false;
        }
        if (dateEnd) {
          const end = new Date(dateEnd);
          end.setHours(0, 0, 0, 0);
          if (d > end) return false;
        }
      }
      return true;
    });

    // Then map to add running balance
    return filtered.map(item => {
      const isDebit = item.type === 'SALE';
      const debit = isDebit ? item.amount : 0;
      const credit = !isDebit ? item.amount : 0;
      
      balance += debit;
      balance -= credit;
      
      return {
        ...item,
        debit,
        credit,
        runningBalance: balance
      };
    });
  }, [rawRecords, selectedCurrency, dateStart, dateEnd]);

  const totals = useMemo(() => {
    return processedData.reduce((acc, row) => {
      acc.debit += row.debit;
      acc.credit += row.credit;
      return acc;
    }, { debit: 0, credit: 0 });
  }, [processedData]);

  const exportToExcel = () => {
    const exportData = processedData.map(item => ({
      "Tarih": formatDate(item.date || item.createdAt),
      "İşlem Tipi": item.type === 'SALE' ? 'Satış / Fatura' : 'Tahsilat / Ödeme',
      "Açıklama": item.description,
      "Borç": item.debit,
      "Alacak": item.credit,
      "Bakiye": item.runningBalance,
      "Döviz": item.currency
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ekstre");
    XLSX.writeFile(wb, `${entityName}_Ekstre_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!entityName) {
    return <div className="p-8 text-center text-v3-muted">Geçersiz Acente/Müşteri bilgisi.</div>;
  }

  const currencies = ["all", ...new Set(rawRecords.map(r => r.currency))].filter(Boolean);

  return (
    <div className="h-full flex flex-col bg-v3-bg compact print-m-0">
      {/* Header - Hidden on Print */}
      <div className="sticky top-0 z-30 bg-v3-bg/80 backdrop-blur-md border-b border-v3-border px-4 py-3 flex items-center justify-between print-hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-v3-muted hover:text-v3-text transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <FileText size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-v3-text">Cari Ekstre</h1>
            <p className="text-[10px] text-v3-muted">{entityName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold tracking-wider text-v3-muted hover:text-v3-text bg-v3-surface border border-v3-border rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <Printer size={14} />
            YAZDIR
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold tracking-wider text-green-600 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-green-500 hover:text-white transition-colors"
          >
            <Download size={14} />
            EXCEL
          </button>
        </div>
      </div>

      {/* Filters - Hidden on Print */}
      <div className="px-4 py-3 flex gap-2 items-center flex-wrap print-hidden border-b border-v3-border">
        <div className="w-[260px]">
          <DateRangeFieldAccounting
            label="Tarih Aralığı"
            startValue={dateStart}
            endValue={dateEnd}
            onStartChange={setDateStart}
            onEndChange={setDateEnd}
            hideLabel={true}
          />
        </div>
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="px-3 py-1.5 text-xs bg-v3-surface border border-v3-border rounded-lg text-v3-text focus:outline-none focus:border-blue-500 transition-colors outline-none cursor-pointer h-[36px]"
        >
          {currencies.map(c => (
            <option key={c} value={c}>{c === "all" ? "Tüm Dövizler (Karmaşık Olabilir)" : c}</option>
          ))}
        </select>
      </div>

      {/* Print Header - Visible only on Print */}
      <div className="hidden print-block px-8 py-6 border-b-2 border-black mb-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-black">CARİ HESAP EKSTRESİ</h1>
            <h2 className="text-lg font-bold text-gray-700 mt-1">{entityName}</h2>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p><strong>Tarih:</strong> {formatDate(new Date().toISOString())}</p>
            <p><strong>Para Birimi:</strong> {selectedCurrency === "all" ? "Tümü" : selectedCurrency}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-4 pb-4 print-px-8 print-overflow-visible">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : processedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-v3-muted gap-2">
            <CalendarClock size={32} className="opacity-20" />
            <p className="text-xs font-medium">Bu kriterlere uygun işlem bulunamadı.</p>
          </div>
        ) : (
          <div className="bg-v3-surface border border-v3-border rounded-xl overflow-hidden shadow-sm print-border-none print-shadow-none print-bg-white">
            <table className="w-full text-left border-collapse print-text-black">
              <thead>
                <tr className="border-b border-v3-border bg-black/5 dark:bg-white/5 print-bg-gray-100">
                  <th className="px-4 py-2 text-xs font-black uppercase tracking-wider w-[120px]">Tarih</th>
                  <th className="px-4 py-2 text-xs font-black uppercase tracking-wider w-[120px]">İşlem Tipi</th>
                  <th className="px-4 py-2 text-xs font-black uppercase tracking-wider">Açıklama</th>
                  <th className="px-4 py-2 text-xs font-black uppercase tracking-wider text-right w-[140px]">Borç (Satış)</th>
                  <th className="px-4 py-2 text-xs font-black uppercase tracking-wider text-right w-[140px]">Alacak (Tahsilat)</th>
                  <th className="px-4 py-2 text-xs font-black uppercase tracking-wider text-right w-[140px] bg-blue-500/5 print-bg-transparent">Bakiye</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-v3-border text-[13px]">
                {processedData.map((row, i) => (
                  <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group print-hover-none">
                    <td className="px-4 py-2 font-medium">{formatDate(row.date || row.createdAt)}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.type === 'SALE' 
                          ? 'bg-orange-500/10 text-orange-600 print-border print-text-black' 
                          : 'bg-green-500/10 text-green-600 print-border print-text-black'
                      }`}>
                        {row.type === 'SALE' ? 'SATIŞ' : 'TAHSİLAT'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-v3-muted group-hover:text-v3-text transition-colors print-text-black">{row.description}</td>
                    <td className="px-4 py-2 text-right font-semibold text-orange-600 dark:text-orange-400 print-text-black">
                      {row.debit > 0 ? formatCurrency(row.debit, row.currency) : "-"}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-green-600 dark:text-green-400 print-text-black">
                      {row.credit > 0 ? formatCurrency(row.credit, row.currency) : "-"}
                    </td>
                    <td className="px-4 py-2 text-right font-black text-v3-text bg-blue-500/5 print-bg-transparent print-border-l">
                      {formatCurrency(row.runningBalance, row.currency)}
                    </td>
                  </tr>
                ))}
                
                {/* Grand Total Row */}
                <tr className="bg-black/10 dark:bg-white/10 font-bold border-t-2 border-v3-border print-bg-gray-100 print-border-t-black print-border-t-4">
                  <td colSpan={3} className="px-4 py-3 text-right uppercase text-[11px] tracking-widest text-v3-muted print-text-black">GENEL TOPLAMLAR ({selectedCurrency})</td>
                  <td className="px-4 py-3 text-right text-orange-600 print-text-black">{formatCurrency(totals.debit, selectedCurrency === 'all' ? '' : selectedCurrency)}</td>
                  <td className="px-4 py-3 text-right text-green-600 print-text-black">{formatCurrency(totals.credit, selectedCurrency === 'all' ? '' : selectedCurrency)}</td>
                  <td className="px-4 py-3 text-right text-v3-text bg-blue-500/10 print-bg-transparent print-text-black">{formatCurrency(totals.debit - totals.credit, selectedCurrency === 'all' ? '' : selectedCurrency)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-m-0 {
            margin: 0 !important;
            padding: 0 !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-px-8 { padding-left: 2rem !important; padding-right: 2rem !important; }
          .print-block { display: block !important; visibility: visible !important; }
          .print-block * { visibility: visible !important; }
          .print-hidden { display: none !important; }
          .print-bg-white { background-color: white !important; }
          .print-bg-transparent { background-color: transparent !important; }
          .print-bg-gray-100 { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
          .print-text-black { color: black !important; }
          .print-border-none { border: none !important; }
          .print-shadow-none { box-shadow: none !important; }
          .print-border { border: 1px solid #ccc !important; }
          .print-border-l { border-left: 1px solid #ccc !important; }
          .print-border-t-black { border-top-color: black !important; }
          .print-border-t-4 { border-top-width: 4px !important; }
          .print-hover-none:hover { background-color: transparent !important; }
          table { width: 100%; border-collapse: collapse; }
          th, td { visibility: visible; }
        }
      `}} />
    </div>
  );
}

export default function StatementPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <StatementContent />
    </Suspense>
  );
}
