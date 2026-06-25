const fs = require('fs');

const code = `'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';

type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'custom';

const getPeriodRange = (period: PeriodFilter, customStart?: string, customEnd?: string): { start: string; end: string } => {
  const now = new Date();
  let start = now;
  let end = now;

  switch (period) {
    case 'today':
      start = now;
      end = now;
      break;
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay() + 1); // Monday
      end = new Date(start);
      end.setDate(start.getDate() + 6); // Sunday
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      break;
    case 'custom':
      if (customStart && customEnd) {
        return { start: customStart, end: customEnd };
      }
      return { start: format(now, 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
  }

  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd')
  };
};

export default function ExchangeRatesPage() {
  const [period, setPeriod] = useState<PeriodFilter>('today');
  
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([new Date(), new Date()]);
  
  const [historicalRates, setHistoricalRates] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const customStartDate = dateRange[0] ? format(dateRange[0], 'yyyy-MM-dd') : '';
  const customEndDate = dateRange[1] ? format(dateRange[1], 'yyyy-MM-dd') : '';

  const currentRange = useMemo(() => getPeriodRange(period, customStartDate, customEndDate), [period, customStartDate, customEndDate]);

  const loadHistoricalRates = async (startDate: string, endDate: string) => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('tcmb_kurlari')
        .select('*')
        .in('kod', ['USD', 'EUR', 'GBP'])
        .gte('tarih', startDate)
        .lte('tarih', endDate)
        .order('tarih', { ascending: false });

      if (error) throw error;
      
      const grouped = (data || []).reduce((acc: any, curr: any) => {
        if (!acc[curr.tarih]) {
          acc[curr.tarih] = { tarih: curr.tarih };
        }
        acc[curr.tarih][curr.kod] = curr;
        return acc;
      }, {});
      
      setHistoricalRates(Object.values(grouped).sort((a: any, b: any) => b.tarih.localeCompare(a.tarih)));
    } catch (error: any) {
      toast.error('Kurlar yüklenirken hata oluştu');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom' || (customStartDate && customEndDate)) {
      loadHistoricalRates(currentRange.start, currentRange.end);
    }
  }, [currentRange.start, currentRange.end, period]);

  const handleFetchRates = async () => {
    setFetching(true);
    try {
      const res = await fetch(\`/api/cron/fetch-rates?manual=true&startDate=\${currentRange.start}&endDate=\${currentRange.end}\`);
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || 'Kurlar başarıyla güncellendi.');
        await loadHistoricalRates(currentRange.start, currentRange.end);
      } else {
        throw new Error(data.error || 'Beklenmeyen bir hata oluştu');
      }
    } catch (error: any) {
      toast.error('Kur güncelleme başarısız: ' + error.message);
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col min-h-0 text-slate-100 p-4 sm:p-6 lg:p-8 overflow-hidden font-sans">
      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 px-1 pt-1 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">
            TCMB Döviz Kurları
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Türkiye Cumhuriyet Merkez Bankası geçmiş ve güncel kurları
          </p>
        </div>

        <div className="flex flex-1 max-w-3xl items-center gap-3 justify-end">
          {/* Period Selector */}
          <div className="flex bg-[#0f172a]/60 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-inner h-[38px]">
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
                className={\`px-4 text-xs font-bold rounded-lg transition-all duration-300 \${
                  period === item.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }\`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          {period === 'custom' && (
            <div className="w-[260px] animate-in fade-in zoom-in-95 duration-200">
              <ResponsiveDateRangeField 
                label="" 
                startValue={customStartDate}
                endValue={customEndDate}
                onStartChange={(v) => {
                  if (v) setDateRange([new Date(v), dateRange[1]]);
                  else setDateRange([null, dateRange[1]]);
                }}
                onEndChange={(v) => {
                  if (v) setDateRange([dateRange[0], new Date(v)]);
                  else setDateRange([dateRange[0], null]);
                }}
                onApply={() => {}}
              />
            </div>
          )}

          {/* Fetch Button */}
          <button
            onClick={handleFetchRates}
            disabled={fetching}
            className="flex items-center gap-2 px-5 h-[38px] bg-transparent border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <RefreshCw className={\`w-3.5 h-3.5 \${fetching ? 'animate-spin' : ''}\`} />
            {fetching ? 'GÜNCELLENİYOR...' : 'ŞİMDİ GÜNCELLE'}
          </button>
        </div>
      </div>

      {/* ═══════════════ DATA GRID ═══════════════ */}
      <div className="bg-[#0f172a]/40 backdrop-blur-2xl border border-white/10 rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden relative shadow-2xl ring-1 ring-white/5">
        
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        
        <div className="overflow-auto flex-1 min-h-0 custom-scrollbar relative z-10">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/60 backdrop-blur-xl text-[10px] uppercase font-black tracking-widest text-slate-400 sticky top-0 z-20">
              <tr>
                <th rowSpan={2} className="px-6 py-4 border-b border-r border-white/10 bg-slate-900/80 align-middle">
                  Tarih
                </th>
                <th colSpan={4} className="px-4 py-2 text-center border-b border-r border-white/10 text-blue-400 bg-blue-950/20">
                  <span className="flex items-center justify-center gap-2"><span className="text-base">🇪🇺</span> EUR - EURO</span>
                </th>
                <th colSpan={4} className="px-4 py-2 text-center border-b border-r border-white/10 text-emerald-400 bg-emerald-950/20">
                  <span className="flex items-center justify-center gap-2"><span className="text-base">🇺🇸</span> USD - AMERİKAN DOLARI</span>
                </th>
                <th colSpan={4} className="px-4 py-2 text-center border-b border-white/10 text-purple-400 bg-purple-950/20">
                  <span className="flex items-center justify-center gap-2"><span className="text-base">🇬🇧</span> GBP - İNGİLİZ STERLİNİ</span>
                </th>
              </tr>
              <tr className="text-[9px]">
                {/* EUR */}
                <th className="px-3 py-2 text-right border-b border-r border-white/10 bg-slate-900/60">D. Alış</th>
                <th className="px-3 py-2 text-right border-b border-r border-white/10 bg-slate-900/60">D. Satış</th>
                <th className="px-3 py-2 text-right border-b border-r border-white/10 bg-slate-900/60 opacity-60">E. Alış</th>
                <th className="px-3 py-2 text-right border-b border-r border-white/10 bg-slate-900/60 opacity-60">E. Satış</th>
                {/* USD */}
                <th className="px-3 py-2 text-right border-b border-r border-white/10 bg-slate-900/60">D. Alış</th>
                <th className="px-3 py-2 text-right border-b border-r border-white/10 bg-slate-900/60">D. Satış</th>
                <th className="px-3 py-2 text-right border-b border-r border-white/10 bg-slate-900/60 opacity-60">E. Alış</th>
                <th className="px-3 py-2 text-right border-b border-r border-white/10 bg-slate-900/60 opacity-60">E. Satış</th>
                {/* GBP */}
                <th className="px-3 py-2 text-right border-b border-r border-white/10 bg-slate-900/60">D. Alış</th>
                <th className="px-3 py-2 text-right border-b border-r border-white/10 bg-slate-900/60">D. Satış</th>
                <th className="px-3 py-2 text-right border-b border-r border-white/10 bg-slate-900/60 opacity-60">E. Alış</th>
                <th className="px-3 py-2 text-right border-b border-white/10 bg-slate-900/60 opacity-60">E. Satış</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {historyLoading ? (
                <tr>
                  <td colSpan={13} className="px-6 py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                      Kurlar yükleniyor, lütfen bekleyin...
                    </div>
                  </td>
                </tr>
              ) : historicalRates.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Seçili tarih aralığında kur verisi bulunamadı. Lütfen üstteki <strong className="text-emerald-400">Şimdi Güncelle</strong> butonunu kullanın.
                  </td>
                </tr>
              ) : (
                historicalRates.map((dayRow) => (
                  <tr key={dayRow.tarih} className="group hover:bg-white/[0.04] transition-colors cursor-default text-[12px] sm:text-[13px] font-medium text-slate-300">
                    <td className="px-6 py-3 whitespace-nowrap font-bold text-white border-r border-white/5 bg-white/[0.01] group-hover:bg-transparent transition-colors">
                      {format(new Date(dayRow.tarih), 'dd MMM yyyy', { locale: tr })}
                    </td>
                    
                    {/* EUR */}
                    <td className="px-3 py-3 text-right tabular-nums text-blue-100">{dayRow.EUR?.forex_buying?.toFixed(4) || '-'}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-blue-400 font-bold">{dayRow.EUR?.forex_selling?.toFixed(4) || '-'}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-500">{dayRow.EUR?.banknote_buying?.toFixed(4) || '-'}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-500 border-r border-white/5">{dayRow.EUR?.banknote_selling?.toFixed(4) || '-'}</td>
                    
                    {/* USD */}
                    <td className="px-3 py-3 text-right tabular-nums text-emerald-100">{dayRow.USD?.forex_buying?.toFixed(4) || '-'}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-emerald-400 font-bold">{dayRow.USD?.forex_selling?.toFixed(4) || '-'}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-500">{dayRow.USD?.banknote_buying?.toFixed(4) || '-'}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-500 border-r border-white/5">{dayRow.USD?.banknote_selling?.toFixed(4) || '-'}</td>
                    
                    {/* GBP */}
                    <td className="px-3 py-3 text-right tabular-nums text-purple-100">{dayRow.GBP?.forex_buying?.toFixed(4) || '-'}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-purple-400 font-bold">{dayRow.GBP?.forex_selling?.toFixed(4) || '-'}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-500">{dayRow.GBP?.banknote_buying?.toFixed(4) || '-'}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-500">{dayRow.GBP?.banknote_selling?.toFixed(4) || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/app/accounting/exchange-rates/page.tsx', code, 'utf8');
console.log('Fixed syntax and restored the file properly');
