'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { RefreshCw, Calendar, TrendingUp } from 'lucide-react';
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
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Mevcut kurları yükle
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

  // Veritabanındaki farklı tarihleri getir
  const loadAvailableDates = async () => {
    try {
      // Supabase'de distinct select tam desteklenmediği için rpc veya gruplama kullanabiliriz.
      // Basitçe en son 30 tarihi getirelim:
      const { data, error } = await supabase
        .from('tcmb_kurlari')
        .select('tarih')
        .order('tarih', { ascending: false })
        .limit(1000); // çok fazla veri olmaması için

      if (error) throw error;

      if (data) {
        const uniqueDates: string[] = Array.from(new Set(data.map(d => String(d.tarih))));
        setAvailableDates(uniqueDates.slice(0, 30));
        
        // Eğer seçili tarih boşsa en son tarihi seç
        if (uniqueDates.length > 0 && rates.length === 0 && !loading) {
          setSelectedDate(uniqueDates[0]);
        }
      }
    } catch (error) {
      console.error('Tarihler yüklenemedi', error);
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

  // Manuel kur çekme
  const handleFetchRates = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/cron/fetch-rates?manual=true');
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || 'Kurlar başarıyla güncellendi.');
        // Tarih listesini ve kurları yenile
        await loadAvailableDates();
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
    <div className="p-6">
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

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2">
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
    </div>
  );
}
