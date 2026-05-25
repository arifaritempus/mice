'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { RefreshCw, Calendar, TrendingUp, History, List } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ExchangeRate {
  id: string;
  tarih: string;
  kod: string;
  currency_code: string;
  isim: string;
  forex_buying: number;
  forex_selling: number;
  banknote_buying: number | null;
  banknote_selling: number | null;
}

export default function ExchangeRatesPage() {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  
  const [historicalRates, setHistoricalRates] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadRates = async (date: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tcmb_kurlari')
        .select('*')
        .eq('tarih', date)
        .order('kod', { ascending: true });

      if (error) throw error;
      setRates(data || []);
    } catch (error: any) {
      toast.error('Kurlar yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDates = async () => {
    try {
      const { data, error } = await supabase
        .from('tcmb_kurlari')
        .select('tarih')
        .order('tarih', { ascending: false })
        .limit(1000);

      if (error) throw error;

      if (data) {
        const uniqueDates: string[] = Array.from(new Set(data.map(d => String(d.tarih))));
        setAvailableDates(uniqueDates.slice(0, 30));
        
        if (uniqueDates.length > 0 && rates.length === 0 && !loading) {
          setSelectedDate(uniqueDates[0]);
        }
      }
    } catch (error) {
      console.error('Tarihler yüklenemedi', error);
    }
  };

  const loadHistoricalRates = async () => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('tcmb_kurlari')
        .select('*')
        .in('kod', ['USD', 'EUR', 'GBP'])
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
      toast.error('Geçmiş kurlar yüklenirken hata oluştu');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadAvailableDates();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadRates(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (activeTab === 'history' && historicalRates.length === 0) {
      loadHistoricalRates();
    }
  }, [activeTab]);

  const handleFetchRates = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/cron/fetch-rates?manual=true');
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || 'Kurlar başarıyla güncellendi.');
        await loadAvailableDates();
        if (activeTab === 'history') {
          await loadHistoricalRates();
        }
        if (data.date) {
          setSelectedDate(data.date);
          await loadRates(data.date);
        } else {
          await loadRates(selectedDate);
        }
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
    <div className="p-6 max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            TCMB Döviz Kurları
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Türkiye Cumhuriyet Merkez Bankası günlük döviz kurları tablosu
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleFetchRates}
            disabled={fetching}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
            {fetching ? 'Güncelleniyor...' : 'Şimdi Güncelle'}
          </button>
        </div>
      </div>

      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" role="tablist">
          <li className="me-2" role="presentation">
            <button
              onClick={() => setActiveTab('current')}
              className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group transition-colors duration-200 ${
                activeTab === 'current'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-500 dark:border-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <List className="w-4 h-4 me-2" />
              Günlük Kurlar
            </button>
          </li>
          <li className="me-2" role="presentation">
            <button
              onClick={() => setActiveTab('history')}
              className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group transition-colors duration-200 ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-500 dark:border-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <History className="w-4 h-4 me-2" />
              Geçmiş Kur Tablosu
            </button>
          </li>
        </ul>
      </div>

      {activeTab === 'current' && (
        <>
          <div className="flex items-center gap-2 mb-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 w-max">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm outline-none text-gray-700 dark:text-gray-200"
            >
              <option value={format(new Date(), 'yyyy-MM-dd')}>Bugün ({format(new Date(), 'yyyy-MM-dd')})</option>
              {availableDates.map(date => (
                <option key={date} value={date}>
                  {format(new Date(date), 'dd MMMM yyyy', { locale: tr })}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Döviz Kodu</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">İsim</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Döviz Alış</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Döviz Satış</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Efektif Alış</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Efektif Satış</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        Kurlar yükleniyor...
                      </td>
                    </tr>
                  ) : rates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        Seçili tarih için kur verisi bulunamadı. Lütfen 'Şimdi Güncelle' butonunu kullanın.
                      </td>
                    </tr>
                  ) : (
                    rates.map((rate) => (
                      <tr key={rate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-700 dark:text-blue-400">
                              {rate.kod}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{rate.isim}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{rate.currency_code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                          {rate.forex_buying ? rate.forex_buying.toFixed(4) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                          {rate.forex_selling ? rate.forex_selling.toFixed(4) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                          {rate.banknote_buying ? rate.banknote_buying.toFixed(4) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                          {rate.banknote_selling ? rate.banknote_selling.toFixed(4) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
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
                      Geçmiş kurlar yükleniyor...
                    </td>
                  </tr>
                ) : historicalRates.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-6 py-10 text-center text-gray-500">
                      Geçmiş kur verisi bulunamadı.
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
      )}
    </div>
  );
}
