"use client";
import React, { useRef, useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface ProformaTabProps {
  project: any;
  salesItems: any[];
  collections: any[];
  categories?: any[];
  agencies?: any[];
}

export default function ProformaTab({ project, salesItems, collections, categories = [], agencies = [] }: ProformaTabProps) {
  const { t } = useLanguage();
  const proformaRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`/api/theme-settings?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.general_settings) {
            setSettings(data.general_settings);
          }
        }
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
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
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

  const getAgencyName = () => {
    if (!project?.agency_id) return project?.company_name || "Müşteri Bilgisi Yok";
    const agency = agencies?.find(a => a.id === project.agency_id);
    return agency ? agency.name : (project?.company_name || "Müşteri Bilgisi Yok");
  };

  const currencyTotals: Record<string, { matrah: number; kdv: number; genelToplam: number; tahsilat: number }> = {};
  const groupedItems: Record<string, any[]> = {};

  salesItems.forEach(item => {
    const cur = item.currency || 'EUR';
    if (!currencyTotals[cur]) {
      currencyTotals[cur] = { matrah: 0, kdv: 0, genelToplam: 0, tahsilat: 0 };
    }
    const q = Number(item.unit_quantity || 1);
    const s = Number(item.sefer || 1);
    const up = Number(item.unit_price || 0);
    // Tam çarpan:
    const matrah = up * q * s;
    const kdvRate = Number(item.vat || 0);
    const kdv = matrah * (kdvRate / 100);
    const genelToplam = matrah + kdv;
    
    currencyTotals[cur].matrah += matrah;
    currencyTotals[cur].kdv += kdv;
    currencyTotals[cur].genelToplam += genelToplam;

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
       genelToplam,
       calcQ: q,
       calcS: s,
       calcUp: up
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
          className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-black/20 disabled:opacity-50"
        >
          {isExporting ? (
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          )}
          PDF İNDİR
        </button>
      </div>

      <div className="flex justify-center overflow-x-auto pb-8 bg-gray-100/50 rounded-xl p-4 md:p-8">
        <div 
          ref={proformaRef} 
          className="bg-white text-black shadow-2xl shrink-0 mx-auto"
          style={{ width: '210mm', position: 'relative', overflow: 'hidden' }}
        >
          <div className="p-12">
            
            {/* HEADER */}
            <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
              <div className="flex flex-col max-w-[60%]">
                {settings?.lightIconLogo || settings?.lightWordmarkLogo ? (
                  <div className="flex items-center gap-3 mb-2">
                    {settings?.lightIconLogo && (
                      <img src={settings.lightIconLogo} alt="Logo" className="h-12 w-auto object-contain" />
                    )}
                    {settings?.lightWordmarkLogo && (
                      <img src={settings.lightWordmarkLogo} alt="Logo" className="h-8 w-auto object-contain" />
                    )}
                  </div>
                ) : (
                  <h1 className="text-2xl font-black tracking-tight mb-2 uppercase">
                    {settings?.companyName || "ŞİRKET ADI"}
                  </h1>
                )}
                
                <div className="text-[11px] text-gray-600 leading-snug">
                  {settings?.companyAddress && <p>{settings.companyAddress}</p>}
                  <p className="mt-1">
                    {[settings?.companyPhone, settings?.companyEmail].filter(Boolean).join(" • ")}
                  </p>
                </div>
              </div>
              
              <div className="text-right flex flex-col gap-1">
                <h1 className="text-3xl font-black uppercase tracking-widest text-black">PROFORMA</h1>
                <p className="text-[12px] font-medium text-gray-500 mt-2">TARİH: <span className="text-black">{new Date().toLocaleDateString('tr-TR')}</span></p>
                <p className="text-[12px] font-medium text-gray-500">REFERANS: <span className="text-black">{project?.reference || "Belirtilmemiş"}</span></p>
              </div>
            </div>

            {/* BILL TO */}
            <div className="mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">MÜŞTERİ / ACENTE</p>
              <h2 className="text-lg font-black text-black">{getAgencyName()}</h2>
              {project?.start_date && (
                <p className="text-[11px] text-gray-600 mt-1">
                  <span className="font-semibold">Proje Tarihi:</span> {new Date(project.start_date).toLocaleDateString('tr-TR')} - {new Date(project.end_date).toLocaleDateString('tr-TR')}
                </p>
              )}
            </div>

            {/* ITEMS LIST */}
            <div className="mb-8">
              {Object.keys(groupedItems).length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">Kayıtlı hizmet bulunmamaktadır.</div>
              ) : (
                <div className="flex flex-col gap-6">
                  {Object.entries(groupedItems).map(([categoryName, items], catIdx) => (
                    <div key={catIdx} className="avoid-page-break">
                      <div className="border-b border-black mb-2">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-black py-1">{categoryName}</h3>
                      </div>
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="text-gray-500 text-left uppercase tracking-wider">
                            <th className="py-1.5 font-semibold w-[45%]">Açıklama</th>
                            <th className="py-1.5 font-semibold text-center">Miktar</th>
                            <th className="py-1.5 font-semibold text-right">Birim Fiyat</th>
                            <th className="py-1.5 font-semibold text-center">KDV</th>
                            <th className="py-1.5 font-semibold text-right">Toplam</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {items.map((item, idx) => (
                            <tr key={idx} className="group">
                              <td className="py-2 pr-2 text-black align-top">
                                <div className="font-bold">{item.description || item.subCatName || item.mainCatName || "Hizmet"}</div>
                                {item.subCatName && <div className="text-[9px] text-gray-500 mt-0.5">{item.subCatName}</div>}
                              </td>
                              <td className="py-2 px-2 text-center text-gray-700 align-top whitespace-nowrap">
                                {item.calcQ} {item.calcS > 1 ? `x ${item.calcS}` : ''}
                              </td>
                              <td className="py-2 px-2 text-right text-gray-700 font-mono align-top">
                                {formatMoney(item.calcUp, item.currency)}
                              </td>
                              <td className="py-2 px-2 text-center text-gray-500 align-top">
                                %{item.kdvRate}
                              </td>
                              <td className="py-2 pl-2 text-right font-bold text-black font-mono align-top">
                                {formatMoney(item.genelToplam, item.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TOTALS & PAYMENTS IN 2 COLUMNS */}
            <div className="flex items-start gap-8 mb-8 avoid-page-break">
              
              {/* Left Column: Payments */}
              <div className="flex-1">
                {collections.length > 0 && (
                  <div>
                    <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">TAHSİLAT DÖKÜMÜ</h3>
                    <table className="w-full text-[10px]">
                      <tbody className="divide-y divide-gray-100">
                        {collections.map((col, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 text-gray-500 w-24">{new Date(col.payment_date || col.created_at).toLocaleDateString('tr-TR')}</td>
                            <td className="py-1.5 text-black font-medium">{col.description || "Tahsilat"}</td>
                            <td className="py-1.5 text-right font-bold text-green-700">{formatMoney(Number(col.amount || 0), col.currency || 'EUR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right Column: Totals */}
              <div className="w-[280px] shrink-0 bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-200 pb-2 text-right">FİNANSAL ÖZET</h3>
                {curCodes.length === 0 ? (
                  <div className="text-center text-xs text-gray-400">Tutar yok.</div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {curCodes.map(cur => {
                      const balance = currencyTotals[cur].genelToplam - currencyTotals[cur].tahsilat;
                      return (
                        <div key={cur} className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-[11px] text-gray-600">
                            <span>Matrah</span>
                            <span className="font-mono">{formatMoney(currencyTotals[cur].matrah, cur)}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-gray-600">
                            <span>KDV</span>
                            <span className="font-mono">{formatMoney(currencyTotals[cur].kdv, cur)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 mt-1 text-[13px] font-black text-black border-t border-gray-200">
                            <span>Genel Toplam</span>
                            <span className="font-mono">{formatMoney(currencyTotals[cur].genelToplam, cur)}</span>
                          </div>
                          
                          {currencyTotals[cur].tahsilat > 0 && (
                            <div className="flex justify-between items-center py-2 mt-1 text-[13px] font-black border-t-2 border-black">
                              <span className="uppercase text-[9px] text-gray-500 tracking-widest">KALAN BAKİYE</span>
                              <span className={`font-mono ${balance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatMoney(balance, cur)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* BANK ACCOUNTS */}
            {settings?.bankAccounts && settings.bankAccounts.length > 0 && (
              <div className="mb-8 avoid-page-break border-t border-gray-200 pt-6">
                <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">BANKA HESAP BİLGİLERİ</h3>
                <div className="grid grid-cols-2 gap-3">
                  {settings.bankAccounts.map((acc: any, idx: number) => (
                    <div key={idx} className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-black text-[11px]">{acc.bankName}</p>
                        <span className="text-[9px] font-bold text-gray-500">{acc.currency}</span>
                      </div>
                      {acc.companyTitle && <p className="text-gray-500 text-[9px] mb-1">{acc.companyTitle}</p>}
                      <p className="text-black font-mono text-[10px] font-bold">{acc.iban}</p>
                      {acc.swiftCode && <p className="text-gray-400 text-[9px] mt-1">SWIFT: {acc.swiftCode}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FOOTER */}
            <div className="mt-8 pt-4 text-center text-[9px] text-gray-400 uppercase tracking-widest">
              BU BELGE BİLGİ AMAÇLIDIR, RESMİ FATURA YERİNE GEÇMEZ.
            </div>

          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .avoid-page-break {
          page-break-inside: avoid;
        }
      `}} />
    </div>
  );
}
