"use client";
import React, { useRef, useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import { SettingsService } from "@/lib/supabaseService";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface ProformaTabProps {
  project: any;
  salesItems: any[];
  collections: any[];
}

export default function ProformaTab({ project, salesItems, collections }: ProformaTabProps) {
  const { t } = useLanguage();
  const proformaRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const s = await SettingsService.getSettings();
        setSettings(s);
      } catch (err) {
        console.error("Settings load error:", err);
      }
    }
    loadSettings();
  }, []);

  const handleExportPDF = async () => {
    if (!proformaRef.current) return;
    setIsExporting(true);
    try {
      const opt = {
        margin:       10,
        filename:     `Proforma_${project?.reference || 'Fatura'}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().from(proformaRef.current).set(opt as any).save();
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Group calculations by currency
  const currencyTotals: Record<string, { matrah: number; kdv: number; genelToplam: number; tahsilat: number }> = {};

  salesItems.forEach(item => {
    const cur = item.currency || 'EUR';
    if (!currencyTotals[cur]) {
      currencyTotals[cur] = { matrah: 0, kdv: 0, genelToplam: 0, tahsilat: 0 };
    }
    const q = item.unit_quantity || 1;
    const s = item.sefer || 1;
    const up = item.unit_price || 0;
    // item.total_price is usually computed, if not fallback
    const matrah = item.total_price !== undefined ? Number(item.total_price) : (up * q * s);
    const kdvRate = Number(item.vat || 0);
    const kdv = matrah * (kdvRate / 100);
    const genelToplam = matrah + kdv;
    
    currencyTotals[cur].matrah += matrah;
    currencyTotals[cur].kdv += kdv;
    currencyTotals[cur].genelToplam += genelToplam;
  });

  collections.forEach(col => {
    const cur = col.currency || 'EUR';
    if (!currencyTotals[cur]) {
      currencyTotals[cur] = { matrah: 0, kdv: 0, genelToplam: 0, tahsilat: 0 };
    }
    currencyTotals[cur].tahsilat += Number(col.amount || 0);
  });

  const curCodes = Object.keys(currencyTotals);

  const formatMoney = (val: number, cur: string) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur === 'TL' ? 'TRY' : cur }).format(val);
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between bg-white dark:bg-v3-surface border border-v3-border p-4 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-black text-v3-text">Proforma Fatura</h2>
          <p className="text-sm text-v3-muted">Bu sayfadan proforma faturanızı görüntüleyebilir ve PDF olarak indirebilirsiniz.</p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
        >
          {isExporting ? (
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          PDF OLUŞTUR
        </button>
      </div>

      {/* PROFORMA KAGIDI (A4 formatı benzeri görünüm) */}
      <div className="flex justify-center overflow-x-auto pb-8">
        <div 
          ref={proformaRef} 
          className="bg-white text-gray-800 p-10 md:p-14 shadow-2xl shrink-0"
          style={{ width: '210mm', minHeight: '297mm', position: 'relative' }}
        >
          
          {/* HEADER */}
          <div className="flex justify-between items-start border-b-2 border-gray-200 pb-8 mb-8">
            <div className="flex flex-col gap-3 max-w-[50%]">
              {settings?.light_icon_logo || settings?.light_wordmark_logo ? (
                <div className="flex items-center gap-3">
                  {settings?.light_icon_logo && (
                    <img src={settings.light_icon_logo} alt="Icon Logo" className="h-16 w-auto object-contain" />
                  )}
                  {settings?.light_wordmark_logo && (
                    <img src={settings.light_wordmark_logo} alt="Wordmark Logo" className="h-12 w-auto object-contain" />
                  )}
                </div>
              ) : (
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                  {settings?.company_name || "ŞİRKET ADI"}
                </h1>
              )}
              
              <div className="text-sm text-gray-500 flex flex-col gap-1 mt-2">
                {settings?.company_address && <p>{settings.company_address}</p>}
                {settings?.company_phone && <p>{settings.company_phone}</p>}
                {settings?.company_email && <p>{settings.company_email}</p>}
                {settings?.company_tax_office && <p>{settings.company_tax_office} VD - {settings.company_tax_number}</p>}
              </div>
            </div>
            
            <div className="text-right flex flex-col gap-2">
              <h1 className="text-4xl font-black text-gray-300 uppercase tracking-widest">PROFORMA</h1>
              <div className="mt-4 flex flex-col gap-1 text-sm">
                <p><span className="font-semibold text-gray-500">Tarih:</span> <span className="font-medium text-gray-900">{new Date().toLocaleDateString('tr-TR')}</span></p>
                <p><span className="font-semibold text-gray-500">Referans:</span> <span className="font-medium text-gray-900">{project?.reference || "Belirtilmemiş"}</span></p>
              </div>
            </div>
          </div>

          {/* KİME (BILL TO) */}
          <div className="mb-10 p-6 bg-gray-50 rounded-xl border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">SAYIN / MÜŞTERİ</h3>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{project?.company_name || project?.agency_name || "Müşteri Bilgisi Yok"}</h2>
            <div className="text-sm text-gray-600 flex flex-col gap-1">
              {project?.agency_id && <p>Acente Kodu: {project.agency_id}</p>}
              {project?.start_date && <p>Proje Tarihi: {new Date(project.start_date).toLocaleDateString('tr-TR')} - {new Date(project.end_date).toLocaleDateString('tr-TR')}</p>}
            </div>
          </div>

          {/* HİZMET DETAYLARI (ITEMS) */}
          <div className="mb-10">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">Hizmet Detayları</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="py-3 px-4 text-left font-semibold rounded-tl-lg">Açıklama</th>
                  <th className="py-3 px-4 text-center font-semibold">Miktar</th>
                  <th className="py-3 px-4 text-right font-semibold">Birim Fiyat</th>
                  <th className="py-3 px-4 text-center font-semibold">KDV</th>
                  <th className="py-3 px-4 text-right font-semibold rounded-tr-lg">Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salesItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400 italic">Hizmet kalemi bulunmuyor.</td>
                  </tr>
                ) : (
                  salesItems.map((item, idx) => {
                    const q = item.unit_quantity || 1;
                    const s = item.sefer || 1;
                    const up = item.unit_price || 0;
                    const matrah = item.total_price !== undefined ? Number(item.total_price) : (up * q * s);
                    const kdvRate = Number(item.vat || 0);
                    const kdv = matrah * (kdvRate / 100);
                    const rowTotal = matrah + kdv;
                    const cur = item.currency || 'EUR';
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 text-gray-800">
                          <div className="font-medium">{item.description || item.sub_category || item.main_category || "Hizmet"}</div>
                          {item.main_category && <div className="text-xs text-gray-400 mt-0.5">{item.main_category} &gt; {item.sub_category}</div>}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">{q} {s > 1 ? `x ${s}` : ''}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{formatMoney(up, cur)}</td>
                        <td className="py-3 px-4 text-center text-gray-600">%{kdvRate}</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">{formatMoney(rowTotal, cur)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* TOPLAMLAR (TOTALS) */}
          <div className="flex justify-end mb-12">
            <div className="w-[350px] bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Genel Toplamlar</h3>
              {curCodes.length === 0 ? (
                <p className="text-sm text-gray-400">Tutar yok.</p>
              ) : (
                curCodes.map(cur => (
                  <div key={cur} className="mb-4 last:mb-0">
                    <div className="flex justify-between items-center py-1.5 text-sm text-gray-600">
                      <span>Ara Toplam (Matrah)</span>
                      <span className="font-medium">{formatMoney(currencyTotals[cur].matrah, cur)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 text-sm text-gray-600">
                      <span>KDV Toplamı</span>
                      <span className="font-medium">{formatMoney(currencyTotals[cur].kdv, cur)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 mt-2 text-base font-bold text-blue-900 border-t border-gray-200">
                      <span>Genel Toplam</span>
                      <span>{formatMoney(currencyTotals[cur].genelToplam, cur)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TAHSİLATLAR (PAYMENTS) */}
          {collections.length > 0 && (
            <div className="mb-12">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">Tahsilat Detayları</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left">
                    <th className="py-2 px-2 font-medium">Tarih</th>
                    <th className="py-2 px-2 font-medium">Açıklama</th>
                    <th className="py-2 px-2 font-medium text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {collections.map((col, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-2 text-gray-600">{new Date(col.payment_date || col.created_at).toLocaleDateString('tr-TR')}</td>
                      <td className="py-2 px-2 text-gray-600">{col.description || "Tahsilat"}</td>
                      <td className="py-2 px-2 text-right font-medium text-green-700">{formatMoney(Number(col.amount || 0), col.currency || 'EUR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* BAKİYE (BALANCE) */}
          <div className="flex justify-end mb-16">
            <div className="w-[350px] bg-blue-50 rounded-xl p-5 border border-blue-100 shadow-sm">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Kalan Bakiye</h3>
              {curCodes.length === 0 ? (
                <p className="text-sm text-gray-400">Bakiye yok.</p>
              ) : (
                curCodes.map(cur => {
                  const balance = currencyTotals[cur].genelToplam - currencyTotals[cur].tahsilat;
                  return (
                    <div key={cur} className="flex justify-between items-center py-1.5 font-bold text-lg text-blue-900 border-b border-blue-100/50 last:border-0">
                      <span>{cur}</span>
                      <span className={balance <= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatMoney(balance, cur)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* BANKA HESAPLARI (BANK ACCOUNTS) */}
          {settings?.bankAccounts && settings.bankAccounts.length > 0 && (
            <div className="mb-10 text-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Banka Hesap Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.bankAccounts.map((acc: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="font-bold text-gray-800 mb-1">{acc.bankName} - {acc.currency}</p>
                    {acc.companyTitle && <p className="text-gray-600 text-xs mb-1">{acc.companyTitle}</p>}
                    <p className="text-gray-900 font-mono text-xs">{acc.iban}</p>
                    {acc.swiftCode && <p className="text-gray-500 text-xs mt-1">SWIFT: {acc.swiftCode}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="absolute bottom-10 left-10 right-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-400 flex flex-col gap-1">
            <p className="font-bold text-gray-500">{settings?.company_name || "Şirket Adı"}</p>
            <p>{settings?.company_address}</p>
            <p>{[settings?.company_phone, settings?.company_email].filter(Boolean).join(" | ")}</p>
            <p className="mt-2 text-[10px]">Bu belge proforma niteliğindedir, resmi fatura yerine geçmez.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
