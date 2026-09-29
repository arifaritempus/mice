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
  hotels?: any[];
}

export default function ProformaTab({ project, salesItems, collections, categories = [], agencies = [], hotels = [] }: ProformaTabProps) {
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
        margin:       [10, 5, 10, 5], 
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

  const getAgency = () => {
    if (!project?.agency_id) return null;
    return agencies?.find(a => a.id === project.agency_id);
  };

  const agency = getAgency();
  const customerName = agency ? agency.name : (project?.company_name || "Müşteri Bilgisi Yok");
  const customerAddress = agency?.address || "";
  const customerTaxOffice = agency?.tax_office || "";
  const customerTaxNumber = agency?.tax_number || "";

  const currencyTotals: Record<string, { matrah: number; kdv: number; genelToplam: number; tahsilat: number }> = {};
  const groupedItems: Record<string, any[]> = {};

  salesItems.forEach(item => {
    const cur = item.currency || 'EUR';
    if (!currencyTotals[cur]) {
      currencyTotals[cur] = { matrah: 0, kdv: 0, genelToplam: 0, tahsilat: 0 };
    }
    
    // Fiyatlar KDV DAHİL kabul ediliyor
    const q = Number(item.unit_quantity || 1);
    const s = Number(item.sefer || 1);
    const up = Number(item.unit_price || 0);

    const genelToplam = item.total_price !== undefined && item.total_price !== null 
      ? Number(item.total_price) 
      : (up * q * s);
      
    const kdvRate = Number(item.vat || 0);
    const matrah = genelToplam / (1 + (kdvRate / 100));
    const kdv = genelToplam - matrah;
    
    currencyTotals[cur].matrah += matrah;
    currencyTotals[cur].kdv += kdv;
    currencyTotals[cur].genelToplam += genelToplam;

    const mainCatName = getCategoryName(item.category || item.main_category) || "DİĞER HİZMETLER";
    const subCatName = getCategoryName(item.sub_category);
    
    if (!groupedItems[mainCatName]) {
      groupedItems[mainCatName] = [];
    }
    groupedItems[mainCatName].push({
       ...item,
       mainCatName,
       subCatName,
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
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' ' + (cur === 'TL' ? 'TRY' : cur);
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between bg-white dark:bg-v3-surface border border-v3-border p-4 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-black text-v3-text">Proforma Fatura</h2>
          <p className="text-sm text-v3-muted">Tamamen optimize edilmiş, tek sayfaya sığan kompakt görünüm.</p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1e293b] hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg shadow-black/10 disabled:opacity-50"
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

      <div className="flex justify-center overflow-x-auto pb-10 bg-gray-100/50 rounded-xl p-4 md:p-8">
        <div 
          ref={proformaRef} 
          className="bg-white text-gray-900 shadow-xl shrink-0 mx-auto print-exact"
          style={{ width: '190mm', position: 'relative', minHeight: 'auto', paddingBottom: '20mm' }}
        >
          {/* Sağ ve sol boşlukları daralttık (px-6 yerine px-8 falan) */}
          <div className="px-6 py-8">
            
            {/* HEADER - Logos side by side */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-2 max-w-[65%]">
                {settings?.lightIconLogo || settings?.lightWordmarkLogo ? (
                  <div className="flex flex-row items-center gap-6 mb-2">
                    {settings?.lightIconLogo && (
                      <img src={settings.lightIconLogo} alt="Icon Logo" className="h-[90px] w-auto object-contain" />
                    )}
                    {settings?.lightWordmarkLogo && (
                      <img src={settings.lightWordmarkLogo} alt="Wordmark Logo" className="h-[100px] w-auto object-contain" />
                    )}
                  </div>
                ) : (
                  <h1 className="text-3xl font-black text-[#1e293b] tracking-tight mb-2">
                    {settings?.companyName || "ŞİRKET ADI"}
                  </h1>
                )}
                
                <div className="text-[10px] text-gray-600 leading-snug">
                  {settings?.companyAddress && <p>{settings.companyAddress}</p>}
                  <p className="mt-0.5">
                    {[settings?.companyPhone, settings?.companyEmail].filter(Boolean).join(" • ")}
                  </p>
                </div>
              </div>

              {/* COMPANY DETAILS - Right aligned & Proforma Text */}
              <div className="text-right flex flex-col gap-1 items-end mt-2">
                <h1 className="text-lg font-bold uppercase tracking-widest text-[#1e293b] mb-1">PROFORMA FATURA</h1>
                <table className="text-[10px] text-gray-600 text-right">
                  <tbody>
                    <tr>
                      <td className="font-semibold pr-2 py-0.5">Tarih:</td>
                      <td className="font-medium text-gray-900">{new Date().toLocaleDateString('tr-TR')}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold pr-2 py-0.5">Referans:</td>
                      <td className="font-medium text-gray-900">{project?.reference || "Belirtilmemiş"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="w-full h-px bg-gray-300 mb-6"></div>

            {/* BILL TO */}
            <div className="mb-6 px-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">MÜŞTERİ / ACENTE</p>
              <h2 className="text-[14px] font-bold text-gray-900 mb-1">{customerName}</h2>
              <div className="text-[10px] text-gray-700 flex flex-col gap-0.5">
                {customerAddress && <p>{customerAddress}</p>}
                <div className="flex gap-4 mt-0.5">
                  {customerTaxOffice && <p><span className="font-semibold text-gray-500">V.Dairesi:</span> {customerTaxOffice}</p>}
                  {customerTaxNumber && <p><span className="font-semibold text-gray-500">V.No:</span> {customerTaxNumber}</p>}
                </div>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-2 text-[10px]">
                  {project?.start_date && (
                    <p><span className="font-semibold text-gray-500">Proje Tarihi:</span> <span className="text-gray-800">{new Date(project.start_date).toLocaleDateString('tr-TR')} - {new Date(project.end_date).toLocaleDateString('tr-TR')}</span></p>
                  )}
                  {project?.company_name && (
                    <p><span className="font-semibold text-gray-500">Firma Adı:</span> <span className="text-gray-800">{project.company_name}</span></p>
                  )}
                  {(() => {
                    const hotelName = project?.hotel_id ? hotels?.find(h => h.id === project.hotel_id)?.name : null;
                    return hotelName ? (
                      <p><span className="font-semibold text-gray-500">Otel Adı:</span> <span className="text-gray-800">{hotelName}</span></p>
                    ) : null;
                  })()}
                </div>
  
              </div>
            </div>

            {/* ITEMS LIST */}
            <div className="mb-6">
              {Object.keys(groupedItems).length === 0 ? (
                <div className="py-4 text-center text-gray-400 italic text-[11px] border border-gray-100 rounded">Hizmet kalemi bulunmuyor.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {Object.entries(groupedItems).map(([categoryName, items], catIdx) => (
                    <div key={catIdx} className="avoid-page-break">
                      <div className="bg-[#1e293b] text-white px-2 mb-0.5 rounded-t" style={{ paddingTop: "5px", paddingBottom: "4px" }}>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest leading-none" style={{ marginTop: 0, marginBottom: 0 }}>{categoryName}</h3>
                      </div>
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="bg-gray-100 text-gray-700 border-b border-gray-300">
                            <th className="py-1 px-2 text-left font-semibold w-[45%]">Açıklama</th>
                            <th className="py-1 px-1 text-center font-semibold">Birim/Adet</th>
                            <th className="py-1 px-1 text-center font-semibold">Sefer/Tekrar</th>
                            <th className="py-1 px-2 text-right font-semibold">B. Fiyat</th>
                            <th className="py-1 px-1 text-center font-semibold">KDV</th>
                            <th className="py-1 px-2 text-right font-semibold">Toplam</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 border-b border-gray-300">
                          {items.map((item, idx) => (
                            <tr key={idx} className="group">
                              <td className="py-1.5 px-2 text-gray-900 align-top">
                                <div className="font-bold">{item.subCatName || item.mainCatName || "Hizmet"}</div>
                                {item.description && <div className="text-[9px] text-gray-600 mt-0.5">{item.description}</div>}
                              </td>
                              <td className="py-1.5 px-1 text-center text-gray-800 align-top">{Number(item.calcQ)}</td>
                              <td className="py-1.5 px-1 text-center text-gray-800 align-top">{Number(item.calcS)}</td>
                              <td className="py-1.5 px-2 text-right text-gray-800  align-top">{formatMoney(Number(item.calcUp), item.currency || 'EUR')}</td>
                              <td className="py-1.5 px-1 text-center text-gray-600 align-top">%{item.kdvRate}</td>
                              <td className="py-1.5 px-2 text-right font-bold text-gray-900  align-top">{formatMoney(item.genelToplam, item.currency || 'EUR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FOOTER AREA (Totals & Payments & Bank) */}
            <div className="flex flex-col gap-4 avoid-page-break px-1">
              <div className="flex gap-6 items-start justify-between">
                
                {/* PAYMENTS */}
                <div className="flex-1 max-w-[60%] w-full">
                  {collections.length > 0 && (
                    <div className="bg-white border border-gray-300 rounded p-3">
                      <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">TAHSİLAT DÖKÜMÜ</h3>
                      <table className="w-full text-[9px]">
                        <tbody className="divide-y divide-gray-200">
                          {collections.map((col, idx) => (
                            <tr key={idx}>
                              <td className="py-1 text-gray-800 w-20">{new Date(col.payment_date || col.created_at).toLocaleDateString('tr-TR')}</td>
                              <td className="py-1 text-gray-800 font-medium">{col.description || "Tahsilat"}</td>
                              <td className="py-1 text-right font-bold text-emerald-700 ">{formatMoney(Number(col.amount || 0), col.currency || 'EUR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* FINANCIAL SUMMARY */}
                <div className="w-[280px] bg-white border border-gray-300 rounded p-4 shadow-sm">
                  <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 text-right">FİNANSAL ÖZET</h3>
                  {curCodes.length === 0 ? (
                    <div className="text-center text-[10px] text-gray-400">Tutar yok.</div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {curCodes.map(cur => {
                        const balance = currencyTotals[cur].genelToplam - currencyTotals[cur].tahsilat;
                        return (
                          <div key={cur} className="border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                            <div className="flex justify-between items-center text-[10px] text-gray-700 py-0.5">
                              <span>Ara Toplam (Matrah)</span>
                              <span className="">{formatMoney(currencyTotals[cur].matrah, cur)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-gray-700 py-0.5">
                              <span>KDV Toplamı</span>
                              <span className="">{formatMoney(currencyTotals[cur].kdv, cur)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[12px] font-bold text-gray-900 pt-1.5 mt-1 border-t border-gray-300">
                              <span>Genel Toplam</span>
                              <span className="">{formatMoney(currencyTotals[cur].genelToplam, cur)}</span>
                            </div>
                            
                            {currencyTotals[cur].tahsilat > 0 && (
                              <div className="flex justify-between items-center py-1 mt-1 text-[11px] font-bold border-t border-gray-300 border-dashed">
                                <span className="uppercase text-[9px] text-gray-500 tracking-widest">KALAN BAKİYE</span>
                                <span className={` ${balance <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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

              {/* BANK ACCOUNTS (One per line) */}
              {settings?.bankAccounts && settings.bankAccounts.length > 0 && (
                <div className="border border-gray-300 rounded p-3 bg-white mt-2">
                  <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">BANKA HESAP BİLGİLERİ</h3>
                  <div className="flex flex-col gap-1">
                    {settings.bankAccounts.map((acc: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] py-1.5 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-gray-900 whitespace-nowrap">{acc.bankName}</span>
                          <span className="text-gray-600 leading-normal">{acc.companyTitle}</span>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <span className=" font-bold text-gray-900">{acc.iban}</span>
                          {acc.swiftCode ? <span className="text-gray-500 w-24">SWIFT: {acc.swiftCode}</span> : <span className="w-24"></span>}
                          <span className="font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{acc.currency}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* FOOTER */}
            <div className="absolute bottom-4 left-0 right-0 text-center text-[8px] text-gray-400 uppercase tracking-widest border-t border-gray-200 pt-2 mx-6">
              BU BELGE PROFORMA NİTELİĞİNDEDİR, RESMİ FATURA YERİNE GEÇMEZ.
            </div>

          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .avoid-page-break {
          page-break-inside: avoid;
        }
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
