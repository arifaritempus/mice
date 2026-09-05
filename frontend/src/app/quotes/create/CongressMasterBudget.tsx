"use client";

import React from "react";
import { TrendingUp, Building2, Briefcase } from "lucide-react";

export default function CongressMasterBudget({ formData, setFormData, disabled }: { formData?: any, setFormData?: any, disabled?: boolean }) {
  // Varsayılan değerler düşmemesi için
  const data = formData || {};

  const handleInputChange = (field: string, value: any) => {
    if (disabled) return;
    if (setFormData) {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-2xl">
        <h2 className="text-lg font-black text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          KONGRE BÜTÇE İCMALİ (MASTER BUDGET)
        </h2>
        <p className="text-xs font-medium text-blue-600/80 dark:text-blue-300/80">
          Kongre tekliflerinde mikro hizmetler yerine "Makro Gelir/Gider Beklentisi" ve "Kâr Paylaşım" oranları belirlenir.
          Bu bütçe, proje onaylandığında sistemin ana finansal anayasası olacaktır.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gelir / Gider Tahminleri */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Finansal Tahminler (Forecast)
          </h3>
          
          <div className="bg-white dark:bg-v3-surface rounded-xl p-4 border border-gray-200 dark:border-v3-border space-y-4 shadow-sm">
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-v3-muted uppercase tracking-widest mb-2">
                Bütçe Para Birimi
              </label>
              <select disabled={disabled}
                value={data.budget_currency || 'EUR'}
                onChange={(e) => handleInputChange('budget_currency', e.target.value)}
                className="w-full h-10 px-3 text-sm font-bold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-v3-border rounded-lg text-gray-800 dark:text-v3-text focus:border-blue-500 outline-none transition-colors"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="TL">TL (₺)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-v3-muted uppercase tracking-widest mb-2">
                Öngörülen Toplam Gelir (Kayıt, Sponsorluk vb.)
              </label>
              <input disabled={disabled} 
                type="number" 
                value={data.forecast_revenue || ''}
                onChange={(e) => handleInputChange('forecast_revenue', e.target.value)}
                placeholder="Örn: 10000000" 
                className="w-full h-10 px-3 text-sm font-bold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-v3-border rounded-lg text-gray-800 dark:text-v3-text focus:border-blue-500 outline-none transition-colors" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-v3-muted uppercase tracking-widest mb-2">
                Öngörülen Toplam Gider (Otel, Salon, AV)
              </label>
              <input disabled={disabled} 
                type="number" 
                value={data.forecast_cost || ''}
                onChange={(e) => handleInputChange('forecast_cost', e.target.value)}
                placeholder="Örn: 6000000" 
                className="w-full h-10 px-3 text-sm font-bold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-v3-border rounded-lg text-gray-800 dark:text-v3-text focus:border-blue-500 outline-none transition-colors" 
              />
            </div>
          </div>
        </div>

        {/* Paylaşım Oranları */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Kâr Dağılımı ve Hizmet Bedeli
          </h3>
          
          <div className="bg-white dark:bg-v3-surface rounded-xl p-4 border border-gray-200 dark:border-v3-border space-y-4 shadow-sm">
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-v3-muted uppercase tracking-widest mb-2">
                Acente Hizmet Bedeli (Management Fee %)
              </label>
              <div className="relative">
                <input disabled={disabled} 
                  type="number" 
                  value={data.management_fee_percentage || ''}
                  onChange={(e) => handleInputChange('management_fee_percentage', e.target.value)}
                  placeholder="Örn: 15" 
                  className="w-full h-10 px-3 pr-10 text-sm font-bold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-v3-border rounded-lg text-gray-800 dark:text-v3-text focus:border-purple-500 outline-none transition-colors" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-v3-muted uppercase tracking-widest mb-2">
                Dernek Payı (%)
              </label>
              <div className="relative">
                <input disabled={disabled} 
                  type="number" 
                  value={data.association_share_percentage || ''}
                  onChange={(e) => handleInputChange('association_share_percentage', e.target.value)}
                  placeholder="Örn: 60" 
                  className="w-full h-10 px-3 pr-10 text-sm font-bold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-v3-border rounded-lg text-gray-800 dark:text-v3-text focus:border-purple-500 outline-none transition-colors" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
            </div>
            
            <div className="pt-2">
              <p className="text-[10px] text-gray-400 dark:text-v3-muted italic">
                * Kalan yüzde vergi, kurumlar fonu vb. teknik kesintiler olarak hesaplanacaktır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
