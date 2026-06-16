'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { DateRangeFieldAccounting } from '@/components/accounting/DateRangeFieldAccounting';

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
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const [historicalRates, setHistoricalRates] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

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
      const res = await fetch(`/api/cron/fetch-rates?manual=true&startDate=${currentRange.start}&endDate=${currentRange.end}`);
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
    <div className="flex flex-col h-[calc(100vh-2rem)] p-4 space-y-4 bg-gray-50 text-slate-900 dark:bg-gray-900 dark:text-slate-100 w-full min-w-0 transition-colors duration-200 overflow-hidden">
      <div className="w-full min-w-0 flex flex-col flex-1 min-h-0 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            TCMB Döviz Kurları
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Türkiye Cumhuriyet Merkez Bankası geçmiş ve güncel kurları
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

          {period === 'custom' && (
            <div className="w-72 transition-all">
              <DateRangeFieldAccounting 
                label="" 
                startValue={customStartDate} 
                endValue={customEndDate} 
                onStartChange={setCustomStartDate} 
                onEndChange={setCustomEndDate} 
                hideLabel 
              />
            </div>
          )}

          <button
            onClick={handleFetchRates}
            disabled={fetching}
            className="flex items-center gap-2 px-4 py-2 h-[34px] bg-blue-600 text-white text-sm font-bold rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
            {fetching ? 'Güncelleniyor...' : 'Şimdi Güncelle'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex-1 min-h-0 flex flex-col w-full relative">
        <div className="overflow-auto w-full flex-1">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" rowSpan={2} className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/80 align-middle">Tarih</th>
                <th scope="col" colSpan={4} className="px-4 py-2 text-center font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-r border-gray-200 dark:border-gray-700">USD</th>
                <th scope="col" colSpan={4} className="px-4 py-2 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-r border-gray-200 dark:border-gray-700">EUR</th>
                <th scope="col" colSpan={4} className="px-4 py-2 text-center font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20">GBP</th>
              </tr>
              <tr>
                {/* USD */}
                <th scope="col" className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">D. Alış</th>
                <th scope="col" className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">D. Satış</th>
                <th scope="col" className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">E. Alış</th>
                <th scope="col" className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase border-r border-gray-200 dark:border-gray-700">E. Satış</th>
                {/* EUR */}
                <th scope="col" className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">D. Alış</th>
                <th scope="col" className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">D. Satış</th>
                <th scope="col" className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">E. Alış</th>
                <th scope="col" className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase border-r border-gray-200 dark:border-gray-700">E. Satış</th>
                {/* GBP */}
                <th scope="col" className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">D. Alış</th>
                <th scope="col" className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">D. Satış</th>
                <th scope="col" className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">E. Alış</th>
                <th scope="col" className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">E. Satış</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {historyLoading ? (
                <tr>
                  <td colSpan={13} className="px-6 py-10 text-center text-gray-500">
                    Kurlar yükleniyor...
                  </td>
                </tr>
              ) : historicalRates.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-10 text-center text-gray-500">
                    Seçili tarih aralığında kur verisi bulunamadı. Lütfen "Şimdi Güncelle" butonunu kullanın.
                  </td>
                </tr>
              ) : (
                historicalRates.map((dayRow) => (
                  <tr key={dayRow.tarih} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                      {format(new Date(dayRow.tarih), 'dd MMM yyyy', { locale: tr })}
                    </td>
                    
                    {/* USD */}
                    <td className="px-2 py-2 text-right tabular-nums">{dayRow.USD?.forex_buying?.toFixed(4) || '-'}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{dayRow.USD?.forex_selling?.toFixed(4) || '-'}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-gray-500">{dayRow.USD?.banknote_buying?.toFixed(4) || '-'}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-gray-500 border-r border-gray-200 dark:border-gray-700">{dayRow.USD?.banknote_selling?.toFixed(4) || '-'}</td>
                    
                    {/* EUR */}
                    <td className="px-2 py-2 text-right tabular-nums">{dayRow.EUR?.forex_buying?.toFixed(4) || '-'}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{dayRow.EUR?.forex_selling?.toFixed(4) || '-'}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-gray-500">{dayRow.EUR?.banknote_buying?.toFixed(4) || '-'}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-gray-500 border-r border-gray-200 dark:border-gray-700">{dayRow.EUR?.banknote_selling?.toFixed(4) || '-'}</td>
                    
                    {/* GBP */}
                    <td className="px-2 py-2 text-right tabular-nums">{dayRow.GBP?.forex_buying?.toFixed(4) || '-'}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{dayRow.GBP?.forex_selling?.toFixed(4) || '-'}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-gray-500">{dayRow.GBP?.banknote_buying?.toFixed(4) || '-'}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-gray-500">{dayRow.GBP?.banknote_selling?.toFixed(4) || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
