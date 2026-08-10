"use client";

import { useState, useEffect, useMemo } from "react";
import { agingService } from "@/lib/supabaseService";
import { usePermissions, Module } from "@/lib/permissions";
import { formatCurrency } from "@/utils/formatters";
import { CalendarClock, Download, FileText } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import * as XLSX from "xlsx";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import { DateRangeFieldAccounting } from "@/components/accounting/DateRangeFieldAccounting";

interface AgingRawRecord {
  id: string;
  type: string;
  entityId: string;
  entityName: string;
  currency: string;
  totalSales: number;
  totalCollections: number;
  balance: number;
  cOutDate: string | null;
}

interface AgingGrouped {
  entityId: string;
  entityName: string;
  currency: string;
  totalSales: number;
  totalCollections: number;
  totalBalance: number;
  future: number;
  days0_30: number;
  days31_60: number;
  days61_90: number;
  days90Plus: number;
}

export default function AgingPage() {
  const { canView } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [rawRecords, setRawRecords] = useState<AgingRawRecord[]>([]);
  
  const [searchTokens, setSearchTokens] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("all");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const records = await agingService.getAccountsReceivable();
      setRawRecords(records);
    } catch (error) {
      console.error("Error fetching aging data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndGroupedData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const grouped: Record<string, AgingGrouped> = {};

    rawRecords.forEach(r => {
      if (Math.abs(r.balance) < 0.01) return;

      // 1. Date Filter
      if (dateStart || dateEnd) {
        if (!r.cOutDate) return; 
        const cOut = new Date(r.cOutDate);
        cOut.setHours(0, 0, 0, 0);
        
        if (dateStart) {
          const start = new Date(dateStart);
          start.setHours(0, 0, 0, 0);
          if (cOut < start) return;
        }
        if (dateEnd) {
          const end = new Date(dateEnd);
          end.setHours(0, 0, 0, 0);
          if (cOut > end) return;
        }
      }

      // 2. Search Tokens Filter
      if (searchTokens.length > 0) {
        const entityNameLower = r.entityName.toLowerCase();
        const matchesAll = searchTokens.every(token => entityNameLower.includes(token.toLowerCase()));
        if (!matchesAll) return;
      }

      // 3. Currency Filter
      if (selectedCurrency !== "all" && r.currency !== selectedCurrency) {
        return;
      }

      const key = `${r.entityName}_${r.currency}`;
      if (!grouped[key]) {
        grouped[key] = {
          entityId: r.entityId,
          entityName: r.entityName,
          currency: r.currency,
          totalSales: 0,
          totalCollections: 0,
          totalBalance: 0,
          future: 0,
          days0_30: 0,
          days31_60: 0,
          days61_90: 0,
          days90Plus: 0,
        };
      }

      const g = grouped[key];
      g.totalSales += r.totalSales || 0;
      g.totalCollections += r.totalCollections || 0;
      g.totalBalance += r.balance;

      let diffDays = 0;
      if (r.cOutDate) {
        const cOut = new Date(r.cOutDate);
        cOut.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - cOut.getTime();
        diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      if (diffDays <= 0) g.future += r.balance;
      else if (diffDays <= 30) g.days0_30 += r.balance;
      else if (diffDays <= 60) g.days31_60 += r.balance;
      else if (diffDays <= 90) g.days61_90 += r.balance;
      else g.days90Plus += r.balance;
    });

    return Object.values(grouped).sort((a, b) => b.totalBalance - a.totalBalance);
  }, [rawRecords, searchTokens, selectedCurrency, dateStart, dateEnd]);

  const summaryByCurrency = useMemo(() => {
    const summary: Record<string, number> = {};
    filteredAndGroupedData.forEach(item => {
      summary[item.currency] = (summary[item.currency] || 0) + item.totalBalance;
    });
    return summary;
  }, [filteredAndGroupedData]);

  const exportToExcel = () => {
    const exportData = filteredAndGroupedData.map(item => ({
      "Acente / Müşteri": item.entityName,
      "Döviz": item.currency,
      "Toplam Satış": item.totalSales,
      "Toplam Tahsilat": item.totalCollections,
      "Vadesi Gelmemiş": item.future,
      "0-30 Gün": item.days0_30,
      "31-60 Gün": item.days31_60,
      "61-90 Gün": item.days61_90,
      "90+ Gün": item.days90Plus,
      "Toplam Kalan Bakiye": item.totalBalance,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alacak Yaslandirma");
    XLSX.writeFile(wb, `Alacak_Yaslandirma_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  if (!canView(Module.AGING)) {
    return <div className="p-8 text-center text-v3-muted">Bu sayfayı görüntüleme yetkiniz yok.</div>;
  }

  return (
    <div className="h-full flex flex-col bg-v3-bg compact">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-v3-bg/80 backdrop-blur-md border-b border-v3-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <CalendarClock size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-v3-text">Alacak Yaşlandırma</h1>
            <p className="text-[10px] text-v3-muted">Acente ve Müşteri Bazlı C-OUT Yaşlandırma Özeti</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold tracking-wider text-v3-muted hover:text-v3-text bg-v3-surface border border-v3-border rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <Download size={14} />
            EXCEL AKTAR
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-4 py-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Object.entries(summaryByCurrency).map(([currency, total]) => (
          <div key={currency} className="bg-v3-surface border border-v3-border rounded-xl p-3 flex flex-col gap-1 shadow-sm">
            <span className="text-[10px] font-bold text-v3-muted uppercase">{currency} Toplam Alacak</span>
            <span className={`text-base font-black ${total > 0 ? "text-green-500" : "text-v3-text"}`}>
              {formatCurrency(total, currency)}
            </span>
          </div>
        ))}
        {Object.keys(summaryByCurrency).length === 0 && !loading && (
          <div className="bg-v3-surface border border-v3-border rounded-xl p-3 flex flex-col gap-1 shadow-sm text-v3-muted">
            <span className="text-[10px] font-bold uppercase">Bilgi</span>
            <span className="text-xs">Bekleyen alacak bulunmuyor</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="px-4 pb-3 flex gap-2 items-center flex-wrap">
        <div className="w-[300px]">
          <MultiTokenFilterInput
            tokens={searchTokens}
            inputValue={searchInput}
            suggestions={[]} 
            onInputChange={setSearchInput}
            onAddToken={(t) => {
              if (t.trim() && !searchTokens.includes(t.trim())) {
                setSearchTokens([...searchTokens, t.trim()]);
              }
              setSearchInput("");
            }}
            onRemoveToken={(t) => {
              setSearchTokens(searchTokens.filter((token) => token !== t));
            }}
            placeholder="Acente / Müşteri Ara... (Enter)"
          />
        </div>
        <div className="w-[260px]">
          <DateRangeFieldAccounting
            label="Çıkış (C-OUT) Tarihi"
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
          className="px-3 py-1.5 text-xs bg-v3-surface border border-v3-border rounded-lg text-v3-text focus:outline-none focus:border-blue-500 transition-colors outline-none cursor-pointer h-full"
          style={{ height: '36px' }}
        >
          <option value="all">Tüm Dövizler</option>
          <option value="TRY">TRY</option>
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="GBP">GBP</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : filteredAndGroupedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-v3-muted gap-2">
            <CalendarClock size={32} className="opacity-20" />
            <p className="text-xs font-medium">Görüntülenecek kayıt bulunamadı.</p>
          </div>
        ) : (
          <div className="bg-v3-surface border border-v3-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-v3-border bg-black/5 dark:bg-white/5">
                    <th className="px-4 py-2 text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider whitespace-nowrap">Acente / Müşteri</th>
                    <th className="px-3 py-2 text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider text-right whitespace-nowrap">Para B.</th>
                    <th className="px-3 py-2 text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider text-right whitespace-nowrap">Toplam Satış</th>
                    <th className="px-3 py-2 text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider text-right whitespace-nowrap">Tahsilat</th>
                    <th className="px-3 py-2 text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider text-right whitespace-nowrap bg-blue-500/5">Vadesi Gelmemiş</th>
                    <th className="px-3 py-2 text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider text-right whitespace-nowrap bg-yellow-500/5">0-30 Gün</th>
                    <th className="px-3 py-2 text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider text-right whitespace-nowrap bg-orange-500/5">31-60 Gün</th>
                    <th className="px-3 py-2 text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider text-right whitespace-nowrap bg-red-500/5">61-90 Gün</th>
                    <th className="px-3 py-2 text-xs font-black uppercase text-red-600 tracking-wider text-right whitespace-nowrap bg-red-500/10">90+ Gün</th>
                    <th className="px-4 py-2 text-xs font-black uppercase text-v3-text tracking-wider text-right whitespace-nowrap bg-green-500/5">Kalan Bakiye</th>
                    <th className="px-3 py-2 text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider text-center whitespace-nowrap">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-v3-border text-[13px]">
                  {filteredAndGroupedData.map((row, i) => (
                    <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-2 whitespace-nowrap font-bold text-v3-text max-w-[200px] truncate" title={row.entityName}>
                        {row.entityName}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right font-medium text-slate-700 dark:text-slate-300">{row.currency}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-right font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(row.totalSales, row.currency)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-right font-semibold text-green-700 dark:text-green-400">{formatCurrency(row.totalCollections, row.currency)}</td>
                      
                      <td className="px-3 py-2 whitespace-nowrap text-right font-semibold text-blue-700 dark:text-blue-400 bg-blue-500/5">{row.future > 0 ? formatCurrency(row.future, row.currency) : "-"}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-right font-semibold text-yellow-800 dark:text-yellow-500 bg-yellow-500/5">{row.days0_30 > 0 ? formatCurrency(row.days0_30, row.currency) : "-"}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-right font-semibold text-orange-700 dark:text-orange-500 bg-orange-500/5">{row.days31_60 > 0 ? formatCurrency(row.days31_60, row.currency) : "-"}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-right font-semibold text-red-700 dark:text-red-500 bg-red-500/5">{row.days61_90 > 0 ? formatCurrency(row.days61_90, row.currency) : "-"}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-right font-black text-red-700 dark:text-red-500 bg-red-500/10">{row.days90Plus > 0 ? formatCurrency(row.days90Plus, row.currency) : "-"}</td>
                      
                      <td className="px-4 py-2 whitespace-nowrap text-right font-black text-v3-text bg-green-500/5">
                        {formatCurrency(row.totalBalance, row.currency)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <Link
                          href={`/accounting/statement?entity=${encodeURIComponent(row.entityName)}&currency=${row.currency}`}
                          className="inline-flex items-center justify-center p-1.5 text-blue-500 hover:text-white bg-blue-500/10 hover:bg-blue-500 rounded-lg transition-colors"
                          title="Ekstre (Hesap Dökümü)"
                        >
                          <FileText size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  {filteredAndGroupedData.length > 0 && (
                    <tr className="bg-black/10 dark:bg-white/10 font-bold border-t-2 border-v3-border">
                      <td colSpan={2} className="px-4 py-2 text-right uppercase text-[10px] tracking-widest text-v3-muted">SAYFA TOPLAMI (TÜM DÖVİZLER)</td>
                      <td className="px-3 py-2 text-right text-[10px] text-v3-muted">-</td>
                      <td className="px-3 py-2 text-right text-[10px] text-v3-muted">-</td>
                      <td className="px-3 py-2 text-right bg-blue-500/10 text-blue-600">
                        {Object.entries(
                          filteredAndGroupedData.reduce((acc, r) => {
                            acc[r.currency] = (acc[r.currency] || 0) + r.future;
                            return acc;
                          }, {} as Record<string, number>)
                        ).filter(([_, v]) => v > 0).map(([c, v]) => <div key={c}>{formatCurrency(v, c)}</div>)}
                      </td>
                      <td className="px-3 py-2 text-right bg-yellow-500/10 text-yellow-600">
                        {Object.entries(
                          filteredAndGroupedData.reduce((acc, r) => {
                            acc[r.currency] = (acc[r.currency] || 0) + r.days0_30;
                            return acc;
                          }, {} as Record<string, number>)
                        ).filter(([_, v]) => v > 0).map(([c, v]) => <div key={c}>{formatCurrency(v, c)}</div>)}
                      </td>
                      <td className="px-3 py-2 text-right bg-orange-500/10 text-orange-600">
                        {Object.entries(
                          filteredAndGroupedData.reduce((acc, r) => {
                            acc[r.currency] = (acc[r.currency] || 0) + r.days31_60;
                            return acc;
                          }, {} as Record<string, number>)
                        ).filter(([_, v]) => v > 0).map(([c, v]) => <div key={c}>{formatCurrency(v, c)}</div>)}
                      </td>
                      <td className="px-3 py-2 text-right bg-red-500/10 text-red-600">
                        {Object.entries(
                          filteredAndGroupedData.reduce((acc, r) => {
                            acc[r.currency] = (acc[r.currency] || 0) + r.days61_90;
                            return acc;
                          }, {} as Record<string, number>)
                        ).filter(([_, v]) => v > 0).map(([c, v]) => <div key={c}>{formatCurrency(v, c)}</div>)}
                      </td>
                      <td className="px-3 py-2 text-right bg-red-500/20 text-red-700">
                        {Object.entries(
                          filteredAndGroupedData.reduce((acc, r) => {
                            acc[r.currency] = (acc[r.currency] || 0) + r.days90Plus;
                            return acc;
                          }, {} as Record<string, number>)
                        ).filter(([_, v]) => v > 0).map(([c, v]) => <div key={c}>{formatCurrency(v, c)}</div>)}
                      </td>
                      <td className="px-4 py-2 text-right bg-green-500/10 text-green-600">
                        {Object.entries(summaryByCurrency).map(([c, v]) => <div key={c}>{formatCurrency(v, c)}</div>)}
                      </td>
                      <td className="px-3 py-2 bg-black/10 dark:bg-white/10"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
