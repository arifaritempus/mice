"use client";
import React, { useRef, useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import { SettingsService } from "@/lib/supabaseService";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface ProformaTabProps {
  project: any;
  salesItems: any[];
  collections: any[];
  categories?: any[];
}

export default function ProformaTab({ project, salesItems, collections, categories = [] }: ProformaTabProps) {
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
        margin:       0,
        filename:     `Proforma_${project?.reference || 'Fatura'}.pdf`,
        image:        { type: 'jpeg' as const, quality: 1.0 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };
      await html2pdf().from(proformaRef.current).set(opt as any).save();
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const getCategoryName = (idOrName: string) => {
    if (!idOrName) return "";
    const found = categories?.find(c => c.id === idOrName);
    return found ? found.name : idOrName;
  };

  const currencyTotals: Record<string, { matrah: number; kdv: number; genelToplam: number; tahsilat: number }> = {};
  const groupedItems: Record<string, any[]> = {};

  salesItems.forEach(item => {
    // Totals
    const cur = item.currency || 'EUR';
    if (!currencyTotals[cur]) {
      currencyTotals[cur] = { matrah: 0, kdv: 0, genelToplam: 0, tahsilat: 0 };
    }
    const q = item.unit_quantity || 1;
    const s = item.sefer || 1;
    const up = item.unit_price || 0;
    const matrah = item.total_price !== undefined ? Number(item.total_price) : (up * q * s);
    const kdvRate = Number(item.vat || 0);
    const kdv = matrah * (kdvRate / 100);
    const genelToplam = matrah + kdv;
    
    currencyTotals[cur].matrah += matrah;
    currencyTotals[cur].kdv += kdv;
    currencyTotals[cur].genelToplam += genelToplam;

    // Grouping
    const mainCatName = getCategoryName(item.main_category) || "DİĞER HİZMETLER";
    if (!groupedItems[mainCatName]) {
      groupedItems[mainCatName] = [];
    }
    groupedItems[mainCatName].push({
       ...item,
       mainCatName,
       subCatName: getCategoryName(item.sub_category),
       matrah,
       kdvRate,
       kdv,
       genelToplam
    });
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
          <p className="text-sm text-v3-muted">Tasarımı yenilenmiş, kategorize edilmiş şık proforma görünümü.</p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg shadow-black/10 disabled:opacity-50"
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
          PDF İNDİR
        </button>
      </div>

      {/* PROFORMA KAGIDI */}
      <div className="flex justify-center overflow-x-auto pb-8 bg-gray-100/50 rounded-xl p-4 md:p-8">
        <div 
          ref={proformaRef} 
          className="bg-white text-gray-800 shadow-2xl shrink-0 mx-auto print-exact"
          style={{ width: '210mm', minHeight: '297mm', position: 'relative', overflow: 'hidden' }}
        >
          {/* Top Decorative Line */}
          <div className="h-3 w-full bg-[#1e293b]"></div>

          <div className="p-10 md:p-14">
            
            {/* HEADER */}
            <div className="flex justify-between items-start mb-12">
              <div className="flex flex-col gap-4 max-w-[55%]">
                {settings?.light_icon_logo || settings?.light_wordmark_logo ? (
                  <div className="flex items-center gap-4">
                    {settings?.light_icon_logo && (
                      <img src={settings.light_icon_logo} alt="Icon Logo" className="h-16 w-auto object-contain" />
                    )}
                    {settings?.light_wordmark_logo && (
                      <img src={settings.light_wordmark_logo} alt="Wordmark Logo" className="h-10 w-auto object-contain" />
                    )}
                  </div>
                ) : (
                  <h1 className="text-3xl font-black text-[#1e293b] tracking-tight">
                    {settings?.company_name || "ŞİRKET ADI"}
                  </h1>
                )}
                
                <div className="text-[13px] text-gray-500 flex flex-col gap-1 leading-relaxed mt-2">
                  {settings?.company_address && <p>{settings.company_address}</p>}
                  {settings?.company_phone && <p>T: {settings.company_phone}</p>}
                  {settings?.company_email && <p>E: {settings.company_email}</p>}
                  {settings?.company_tax_office && <p>{settings.company_tax_office} VD - {settings.company_tax_number}</p>}
                </div>
              </div>
              
              <div className="text-right flex flex-col gap-3">
                <h1 className="text-4xl font-black text-[#1e293b] uppercase tracking-widest">PROFORMA</h1>
                <div className="mt-2 text-[13px] bg-gray-50 p-4 rounded-xl border border-gray-100 inline-block text-left min-w-[200px]">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">TARİH</span>
                    <span className="font-medium text-gray-900">{new Date().toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">REFERANS</span>
                    <span className="font-medium text-gray-900">{project?.reference || "Belirtilmemiş"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BILL TO */}
            <div className="mb-12 flex gap-8">
              <div className="flex-1">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">SAYIN / MÜŞTERİ</h3>
                <div className="p-5 bg-[#f8fafc] rounded-xl border border-slate-100/60 shadow-sm h-full">
                  <h2 className="text-lg font-bold text-[#1e293b] mb-1">{project?.company_name || project?.agency_name || "Müşteri Bilgisi Yok"}</h2>
                  <div className="text-[13px] text-gray-500">
                    {project?.agency_id && <p>Acente Kodu: {project.agency_id}</p>}
                    {project?.start_date && <p className="mt-2">Proje Tarihi: <span className="font-medium text-gray-700">{new Date(project.start_date).toLocaleDateString('tr-TR')} - {new Date(project.end_date).toLocaleDateString('tr-TR')}</span></p>}
                  </div>
                </div>
              </div>
              <div className="flex-1">
                {/* Boş alan veya proje detayları gelebilir */}
              </div>
            </div>

            {/* ITEMS LIST (GROUPED) */}
            <div className="mb-12">
              {Object.keys(groupedItems).length === 0 ? (
                <div className="py-10 text-center text-gray-400 italic bg-gray-50 rounded-xl border border-gray-100">Hizmet kalemi bulunmuyor.</div>
              ) : (
                <div className="w-full flex flex-col gap-6">
                  {Object.entries(groupedItems).map(([categoryName, items], catIdx) => (
                    <div key={catIdx} className="overflow-hidden rounded-xl border border-slate-200">
                      <div className="bg-[#1e293b] px-4 py-2 text-white">
                        <h3 className="text-xs font-bold uppercase tracking-widest">{categoryName}</h3>
                      </div>
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-left text-[11px] uppercase tracking-wider">
                            <th className="py-2.5 px-4 font-semibold w-[40%]">Açıklama</th>
                            <th className="py-2.5 px-4 font-semibold text-center">Miktar</th>
                            <th className="py-2.5 px-4 font-semibold text-right">B.Fiyat</th>
                            <th className="py-2.5 px-4 font-semibold text-center">KDV</th>
                            <th className="py-2.5 px-4 font-semibold text-right">Toplam</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {items.map((item, idx) => (
                            <tr key={idx} className="group hover:bg-slate-50/50">
                              <td className="py-3 px-4 text-slate-800">
                                <div className="font-medium">{item.description || item.subCatName || item.mainCatName || "Hizmet"}</div>
                                {item.subCatName && <div className="text-[11px] text-slate-400 mt-0.5">{item.subCatName}</div>}
                              </td>
                              <td className="py-3 px-4 text-center text-slate-600">
                                {item.unit_quantity || 1} {item.sefer > 1 ? `x ${item.sefer}` : ''}
                              </td>
                              <td className="py-3 px-4 text-right text-slate-600 font-mono text-[12px]">{formatMoney(item.unit_price || 0, item.currency || 'EUR')}</td>
                              <td className="py-3 px-4 text-center text-slate-600">%{item.kdvRate}</td>
                              <td className="py-3 px-4 text-right font-semibold text-slate-800 font-mono text-[12px]">{formatMoney(item.genelToplam, item.currency || 'EUR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FINANCIAL SUMMARY ROW */}
            <div className="flex justify-between items-start mb-12 gap-8">
              
              {/* PAYMENTS */}
              <div className="flex-1">
                {collections.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">TAHSİLAT DÖKÜMÜ</h3>
                    <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 overflow-hidden">
                      <table className="w-full text-[12px]">
                        <tbody className="divide-y divide-emerald-100">
                          {collections.map((col, idx) => (
                            <tr key={idx}>
                              <td className="py-2 px-4 text-emerald-700/70">{new Date(col.payment_date || col.created_at).toLocaleDateString('tr-TR')}</td>
                              <td className="py-2 px-4 text-emerald-800 font-medium">{col.description || "Tahsilat"}</td>
                              <td className="py-2 px-4 text-right font-bold text-emerald-700">{formatMoney(Number(col.amount || 0), col.currency || 'EUR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* TOTALS */}
              <div className="w-[320px] shrink-0">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-right">FİNANSAL ÖZET</h3>
                <div className="bg-[#1e293b] text-white rounded-xl overflow-hidden shadow-lg">
                  {curCodes.length === 0 ? (
                    <div className="p-5 text-center text-sm text-slate-400">Tutar yok.</div>
                  ) : (
                    curCodes.map(cur => {
                      const balance = currencyTotals[cur].genelToplam - currencyTotals[cur].tahsilat;
                      return (
                        <div key={cur} className="border-b border-white/10 last:border-0 p-5">
                          <div className="flex justify-between items-center py-1 text-[13px] text-slate-300">
                            <span>Matrah</span>
                            <span className="font-mono">{formatMoney(currencyTotals[cur].matrah, cur)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 text-[13px] text-slate-300">
                            <span>KDV</span>
                            <span className="font-mono">{formatMoney(currencyTotals[cur].kdv, cur)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 mt-2 text-[15px] font-bold text-white border-t border-white/10">
                            <span>Genel Toplam</span>
                            <span className="font-mono text-emerald-400">{formatMoney(currencyTotals[cur].genelToplam, cur)}</span>
                          </div>
                          
                          {/* Kalan Bakiye - Yalnızca genel toplam ile bakiye farklıysa (tahsilat varsa) göster */}
                          {currencyTotals[cur].tahsilat > 0 && (
                            <div className="flex justify-between items-center py-2 mt-2 text-[13px] font-bold border-t border-dashed border-white/20">
                              <span className="uppercase tracking-widest text-[10px] text-slate-400">KALAN BAKİYE</span>
                              <span className={`font-mono text-[16px] ${balance <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatMoney(balance, cur)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* BANKA HESAPLARI */}
            {settings?.bankAccounts && settings.bankAccounts.length > 0 && (
              <div className="mb-10 page-break-inside-avoid">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">BANKA HESAP BİLGİLERİ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {settings.bankAccounts.map((acc: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-[#1e293b] text-[13px]">{acc.bankName}</p>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-bold">{acc.currency}</span>
                      </div>
                      {acc.companyTitle && <p className="text-slate-500 text-[11px] mb-2">{acc.companyTitle}</p>}
                      <div className="bg-white p-2 rounded border border-slate-100 font-mono text-[11px] text-slate-700 tracking-wider">
                        {acc.iban}
                      </div>
                      {acc.swiftCode && <p className="text-slate-400 text-[10px] mt-2">SWIFT: {acc.swiftCode}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FOOTER */}
            <div className="absolute bottom-0 left-0 right-0 h-[80mm] pointer-events-none flex items-end">
              <div className="w-full border-t-2 border-slate-100 p-8 text-center bg-white">
                <p className="font-black text-[#1e293b] text-sm tracking-wide mb-1">{settings?.company_name || "Şirket Adı"}</p>
                <p className="text-slate-500 text-[11px] mb-1">{settings?.company_address}</p>
                <p className="text-slate-400 text-[11px] font-mono">{[settings?.company_phone, settings?.company_email].filter(Boolean).join(" • ")}</p>
                <p className="mt-4 text-[9px] text-slate-300 uppercase tracking-widest">BU BELGE PROFORMA NİTELİĞİNDEDİR, RESMİ FATURA YERİNE GEÇMEZ.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .print-exact {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
    </div>
  );
}
