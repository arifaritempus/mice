"use client";
import React, { useRef, useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { formatDateForDisplay } from "./projectUtils";

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
  const [settings, setSettings] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("tempus_general_settings");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return null;
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`/api/theme-settings?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.general_settings) {
            setSettings(data.general_settings);
            try {
              localStorage.setItem("tempus_general_settings", JSON.stringify(data.general_settings));
            } catch (e) {}
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
    const toastId = toast.loading("Proforma PDF indiriliyor...");
    try {
      const element = proformaRef.current;

      const opt = {
        margin:       [8, 6, 8, 6], // 8mm top/bottom, 6mm left/right
        filename:     `Proforma_${project?.reference || 'Fatura'}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          allowTaint: true,
          logging: false,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak:    { 
          mode: ['avoid-all', 'css', 'legacy'],
          avoid: ['tr', '.avoid-page-break', 'thead', 'tfoot', '.cat-header']
        }
      };

      await html2pdf().set(opt as any).from(element).save();
      toast.success("PDF başarıyla indirildi!", { id: toastId });
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
      toast.error("PDF oluşturulurken hata meydana geldi.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    const sheet = proformaRef.current;
    if (!sheet) return;

    // Remove any previous print frame
    const prevFrame = document.getElementById("proforma-print-iframe");
    if (prevFrame) prevFrame.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "proforma-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow?.document;
    if (!frameDoc) return;

    let stylesHtml = "";
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
      stylesHtml += node.outerHTML;
    });

    const htmlClasses = typeof document !== 'undefined' ? document.documentElement.className : "";
    const bodyClasses = typeof document !== 'undefined' ? document.body.className : "";

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="tr" class="${htmlClasses}">
        <head>
          <meta charset="utf-8" />
          <title>Proforma_${project?.reference || "Fatura"}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
          ${stylesHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            * {
              font-family: 'Outfit', var(--font-outfit), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            html, body {
              background: #ffffff !important;
              color: #111827 !important;
              font-family: 'Outfit', var(--font-outfit), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
              min-height: auto !important;
              overflow: visible !important;
            }
            #proforma-sheet {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: #ffffff !important;
              display: block !important;
              position: static !important;
              font-family: 'Outfit', var(--font-outfit), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              page-break-inside: auto !important;
            }
            thead {
              display: table-header-group !important;
            }
            tfoot {
              display: table-footer-group !important;
            }
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .avoid-page-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .cat-header {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
          </style>
        </head>
        <body class="${bodyClasses}">
          <div id="proforma-sheet">
            ${sheet.innerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    const triggerPrint = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          iframe.remove();
        }, 2000);
      }, 250);
    };

    if ((frameDoc as any).fonts) {
      (frameDoc as any).fonts.ready.then(triggerPrint).catch(triggerPrint);
    } else {
      setTimeout(triggerPrint, 500);
    }
  };

  useEffect(() => {
    const onPdf = () => {
      handleExportPDF();
    };
    const onPrint = () => {
      handlePrint();
    };

    window.addEventListener("trigger-proforma-pdf", onPdf);
    window.addEventListener("trigger-proforma-print", onPrint);

    return () => {
      window.removeEventListener("trigger-proforma-pdf", onPdf);
      window.removeEventListener("trigger-proforma-print", onPrint);
    };
  }, [project, salesItems, collections, settings]);

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
    // 0 değerlerinin 1'e dönüşmesini engellemek için nullish kontrolü yapıyoruz
    const rawQ = item.unit_quantity !== undefined && item.unit_quantity !== null && item.unit_quantity !== "" 
      ? item.unit_quantity 
      : (item.qty !== undefined && item.qty !== null && item.qty !== "" ? item.qty : 0);
    const q = Number(rawQ);

    const rawS = item.sefer !== undefined && item.sefer !== null && item.sefer !== "" 
      ? item.sefer 
      : (item.repeat !== undefined && item.repeat !== null && item.repeat !== "" ? item.repeat : 0);
    const s = Number(rawS);

    const up = Number(item.unit_price || 0);

    const genelToplam = item.total_price !== undefined && item.total_price !== null && item.total_price !== ""
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
      

      <div className="flex justify-center overflow-x-auto pb-10 bg-gray-100/50 rounded-xl p-4 md:p-8">
        <div 
          ref={proformaRef} 
          id="proforma-sheet"
          className="bg-white text-gray-900 shadow-xl shrink-0 mx-auto print-exact"
          style={{ width: '210mm', position: 'relative', minHeight: 'auto', fontFamily: 'var(--font-outfit), "Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        >
          <div className="px-8 py-8">
            
            {/* HEADER - Menu Logo */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-2 max-w-[65%]">
                {settings?.lightMenuLogo || settings?.light_menu_logo || settings?.darkMenuLogo || settings?.menuLogo || settings?.lightIconLogo ? (
                  <div className="mb-2">
                    <img 
                      src={settings?.lightMenuLogo || settings?.light_menu_logo || settings?.darkMenuLogo || settings?.menuLogo || settings?.lightIconLogo} 
                      alt="Logo" 
                      crossOrigin="anonymous"
                      className="h-[65px] max-h-[75px] max-w-[280px] w-auto object-contain" 
                    />
                  </div>
                ) : !settings ? (
                  <div className="h-[65px] mb-2" />
                ) : settings?.companyName ? (
                  <h1 className="text-3xl font-black text-[#1e293b] tracking-tight mb-2">
                    {settings.companyName}
                  </h1>
                ) : null}
                
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
                    <p><span className="font-semibold text-gray-500">Proje Tarihi:</span> <span className="text-gray-800">{formatDateForDisplay(project.start_date)} - {formatDateForDisplay(project.end_date)}</span></p>
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
                  {Object.entries(groupedItems).map(([categoryName, items], catIdx) => {
                    const catTotalsByCur: Record<string, number> = {};
                    items.forEach(it => {
                      const cur = it.currency || 'EUR';
                      catTotalsByCur[cur] = (catTotalsByCur[cur] || 0) + (it.genelToplam || 0);
                    });

                    return (
                      <div key={catIdx} className="mb-4">
                        <div 
                          className="cat-header bg-[#1e293b] text-white px-2 py-1 mb-0.5 rounded-t"
                          style={{ pageBreakInside: 'avoid', breakInside: 'avoid', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}
                        >
                          <h3 className="text-[10px] font-bold uppercase tracking-widest">{categoryName}</h3>
                        </div>
                        <table className="w-full text-[10px] border-collapse" style={{ pageBreakInside: 'auto' }}>
                          <thead>
                            <tr className="bg-gray-100 text-gray-700 border-b border-gray-300" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                              <th className="py-1 px-2 text-left font-semibold w-[48%]">Açıklama</th>
                              <th className="py-1 px-2 text-center font-semibold">Miktar</th>
                              <th className="py-1 px-2 text-right font-semibold">B. Fiyat</th>
                              <th className="py-1 px-1 text-center font-semibold">KDV</th>
                              <th className="py-1 px-2 text-right font-semibold">Toplam</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 border-b border-gray-300">
                            {items.map((item, idx) => (
                              <tr key={idx} className="group" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                <td className="py-1.5 px-2 text-gray-900 align-top">
                                  <div className="font-bold">{item.subCatName || item.mainCatName || "Hizmet"}</div>
                                  {item.description && <div className="text-[9px] text-gray-600 mt-0.5">{item.description}</div>}
                                </td>
                                <td className="py-1.5 px-2 text-center text-gray-800 align-top whitespace-nowrap font-medium">
                                  {item.calcQ ?? 0} x {item.calcS ?? 0}
                                </td>
                                <td className="py-1.5 px-2 text-right text-gray-800 align-top">{formatMoney(Number(item.calcUp), item.currency || 'EUR')}</td>
                                <td className="py-1.5 px-1 text-center text-gray-600 align-top">%{item.kdvRate}</td>
                                <td className="py-1.5 px-2 text-right font-bold text-gray-900 align-top">{formatMoney(item.genelToplam, item.currency || 'EUR')}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="border-t border-gray-300 bg-gray-50/80" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            {Object.entries(catTotalsByCur).map(([cur, totalAmount], tIdx) => (
                              <tr key={tIdx} className="font-bold text-gray-900" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                <td colSpan={4} className="py-1 px-2 text-right text-[9px] uppercase tracking-wider text-gray-600">
                                  {categoryName} Ara Toplam
                                </td>
                                <td className="py-1 px-2 text-right text-[10px] font-black text-gray-900">
                                  {formatMoney(totalAmount, cur)}
                                </td>
                              </tr>
                            ))}
                          </tfoot>
                        </table>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FOOTER AREA (Totals & Payments) */}
            <div className="avoid-page-break mb-4 px-1" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div className="flex gap-4 items-start justify-between">
                
                {/* PAYMENTS */}
                <div className="flex-1 w-[58%]">
                  {collections.length > 0 && (
                    <div className="bg-white border border-gray-300 rounded p-3">
                      <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">TAHSİLAT DÖKÜMÜ</h3>
                      <table className="w-full text-[9px] border-collapse">
                        <tbody className="divide-y divide-gray-200">
                          {collections.map((col, idx) => (
                            <tr key={idx} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                              <td className="py-1 text-gray-800 w-20">{formatDateForDisplay(col.date || col.payment_date || col.created_at)}</td>
                              <td className="py-1 text-gray-800 font-medium">{col.description || "Tahsilat"}</td>
                              <td className="py-1 text-right font-bold text-emerald-700 whitespace-nowrap">{formatMoney(Number(col.amount || 0), col.currency || 'EUR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* FINANCIAL SUMMARY */}
                <div className="w-[38%] bg-white border border-gray-300 rounded p-3 shadow-sm">
                  <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 text-right">FİNANSAL ÖZET</h3>
                  {curCodes.length === 0 ? (
                    <div className="text-center text-[10px] text-gray-400">Tutar yok.</div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {curCodes.map(cur => {
                        const balance = currencyTotals[cur].genelToplam - currencyTotals[cur].tahsilat;
                        return (
                          <div key={cur} className="border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                            <div className="flex justify-between items-center text-[10px] text-gray-700 py-0.5">
                              <span>Ara Toplam (Matrah)</span>
                              <span className="font-medium">{formatMoney(currencyTotals[cur].matrah, cur)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-gray-700 py-0.5">
                              <span>KDV Toplamı</span>
                              <span className="font-medium">{formatMoney(currencyTotals[cur].kdv, cur)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-bold text-gray-900 pt-1 mt-1 border-t border-gray-300">
                              <span>Genel Toplam</span>
                              <span className="font-black">{formatMoney(currencyTotals[cur].genelToplam, cur)}</span>
                            </div>
                            
                            {currencyTotals[cur].tahsilat > 0 && (
                              <div className="flex justify-between items-center py-1 mt-1 text-[11px] font-bold border-t border-gray-300 border-dashed">
                                <span className="uppercase text-[9px] text-gray-500 tracking-widest">KALAN BAKİYE</span>
                                <span className={`font-black ${balance <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
            </div>

            {/* BANK ACCOUNTS */}
            {settings?.bankAccounts && settings.bankAccounts.length > 0 && (
              <div className="avoid-page-break border border-gray-300 rounded p-3 bg-white mt-2 px-3" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">BANKA HESAP BİLGİLERİ</h3>
                <table className="w-full text-[10px] border-collapse">
                  <tbody>
                    {settings.bankAccounts.map((acc: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100 last:border-0" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <td className="py-1.5 font-bold text-gray-900 whitespace-nowrap align-middle">
                          {acc.bankName}
                        </td>
                        <td className="py-1.5 px-3 text-gray-600 align-middle">
                          {acc.companyTitle}
                        </td>
                        <td className="py-1.5 px-3 font-mono font-bold text-gray-900 text-right whitespace-nowrap align-middle">
                          {acc.iban}
                        </td>
                        <td className="py-1.5 px-2 text-gray-500 text-right whitespace-nowrap align-middle">
                          {acc.swiftCode ? `SWIFT: ${acc.swiftCode}` : ""}
                        </td>
                        <td className="py-1.5 pl-3 text-right whitespace-nowrap align-middle">
                          <span className="font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[9px]">
                            {acc.currency}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* FOOTER NOTICE */}
            <div className="mt-6 text-center text-[8px] text-gray-400 uppercase tracking-widest border-t border-gray-200 pt-2" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              BU BELGE PROFORMA NİTELİĞİNDEDİR, RESMİ FATURA YERİNE GEÇMEZ.
            </div>

          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .avoid-page-break {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .cat-header {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          html, body, #__next, .mobile-auth-wrapper, .glass-panel, main, .compact {
            background: white !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            position: static !important;
          }
          body * {
            visibility: hidden !important;
          }
          #proforma-sheet, #proforma-sheet * {
            visibility: visible !important;
          }
          #proforma-sheet {
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            display: block !important;
          }
          table {
            page-break-inside: auto !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}} />
    </div>
  );
}
