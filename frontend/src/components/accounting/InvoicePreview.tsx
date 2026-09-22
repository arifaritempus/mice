"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SettingsService, categoriesService } from "@/lib/supabaseService";

interface InvoicePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any; // Invoice header
  items: any[]; // Invoice lines
}

export default function InvoicePreview({
  isOpen,
  onClose,
  invoice,
  items,
}: InvoicePreviewProps) {
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Load full contact information & Settings
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        setLoading(true);
        // Load Settings
        const sysSettings = await SettingsService.getSettings();
        setSettings(sysSettings || {});
        
        try {
          const cats = await categoriesService.getAll();
          setCategories(cats || []);
        } catch(e) {}

        // Load Contact Info
        if (invoice?.contact_id) {
          const tables = ["agencies", "hotels", "suppliers"];
          for (const table of tables) {
            const { data, error } = await supabase
              .from(table)
              .select("*")
              .eq("id", invoice.contact_id)
              .maybeSingle();

            if (data && !error) {
              setContactInfo({ ...data, _source: table });
              break;
            }
          }
        }
      } catch (err) {
        console.error("Data load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, invoice?.contact_id]);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // KDV Breakdown
  interface VatEntry {
    matrah: number;
    kdv: number;
    gross: number;
  }
  const vatBreakdown = (items || []).reduce(
    (acc: Record<number, VatEntry>, item: any) => {
      const rate = Number(item.vat_rate || 0);
      const grossAmount = Number(item.amount || 0);
      const matrah = grossAmount / (1 + rate / 100);
      const kdv = grossAmount - matrah;
      if (!acc[rate]) acc[rate] = { matrah: 0, kdv: 0, gross: 0 };
      acc[rate].matrah += matrah;
      acc[rate].kdv += kdv;
      acc[rate].gross += grossAmount;
      return acc;
    },
    {},
  );

  const araToplamMatrah = Object.values(vatBreakdown).reduce(
    (sum: number, b) => sum + (b as VatEntry).matrah,
    0,
  );
  const toplamKdv = Object.values(vatBreakdown).reduce(
    (sum: number, b) => sum + (b as VatEntry).kdv,
    0,
  );
  const genelToplam = Number(araToplamMatrah || 0) + Number(toplamKdv || 0);

  const genelToplamTRY = (items || []).reduce((sum, item) => sum + (Number(item.amount || 0) * Number(item.exchange_rate || item.fx || 1)), 0);
  const mainCurrency = items?.[0]?.currency || invoice?.currency || "TRY";

  // Number to text (TR)
  const numberToTextTR = (num: number): string => {
    if (!num || num === 0) return "Sıfır";
    const ones = [
      "",
      "Bir",
      "İki",
      "Üç",
      "Dört",
      "Beş",
      "Altı",
      "Yedi",
      "Sekiz",
      "Dokuz",
    ];
    const tens = [
      "",
      "On",
      "Yirmi",
      "Otuz",
      "Kırk",
      "Elli",
      "Altmış",
      "Yetmiş",
      "Seksen",
      "Doksan",
    ];
    const thousands = ["", "Bin", "Milyon", "Milyar", "Trilyon"];
    const getHundreds = (n: number) => {
      let str = "";
      const h = Math.floor(n / 100);
      const t = Math.floor((n % 100) / 10);
      const o = n % 10;
      if (h > 1) str += ones[h] + "Yüz";
      else if (h === 1) str += "Yüz";
      if (t > 0) str += tens[t];
      if (o > 0) str += ones[o];
      return str;
    };
    let intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);
    let str = "";
    let groupIdx = 0;
    while (intPart > 0) {
      const group = intPart % 1000;
      if (group > 0) {
        if (group === 1 && groupIdx === 1) {
          str = thousands[groupIdx] + str;
        } else {
          str = getHundreds(group) + thousands[groupIdx] + str;
        }
      }
      intPart = Math.floor(intPart / 1000);
      groupIdx++;
    }
    let res = str;
    if (decPart > 0) {
      res += "Nokta" + getHundreds(decPart);
    }
    return res;
  };

  // Contact display - from system
  const contactName =
    contactInfo?.name ||
    contactInfo?.company_name ||
    invoice?.contact_name ||
    invoice?.contact_id ||
    "-";
  const contactAddress = contactInfo?.address || contactInfo?.city || "";
  const contactTaxNo = contactInfo?.tax_number || contactInfo?.vkn || "";
  const contactTaxOffice = contactInfo?.tax_office || "";

  // Company Settings
  const gs = settings.general_settings || {};
  const logoSettings = settings.logo_settings || {};
  const isExpense = invoice?.type === "expense";
  let logoUrl = null;
  if (!isExpense) {
    const possibleLogos = [
      gs.lightWordmarkLogo, gs.light_wordmark_logo,
      gs.darkWordmarkLogo, gs.dark_wordmark_logo,
      gs.darkMenuLogo, gs.dark_menu_logo,
      gs.lightIconLogo, gs.light_icon_logo,
      gs.darkIconLogo, gs.dark_icon_logo,
      logoSettings.dark_wordmark_logo, logoSettings.dark_icon_logo
    ];
    for (const l of possibleLogos) {
      if (l && typeof l === "string" && l.trim().length > 5) {
        logoUrl = l;
        break;
      }
    }
  }
  const companyName = gs.company_name || settings.company_name || settings.title || "TEMPUS TRAVEL";
  const companyAddress = gs.company_address;
  const companyTaxOffice = gs.company_tax_office || gs.tax_office;
  const companyTaxId = gs.company_tax_id || gs.tax_number || gs.vkn;
  const companyPhone = gs.company_phone;
  const companyEmail = gs.company_email;
  const companyWebsite = gs.company_website;

  
  const issuerName = isExpense ? contactName : companyName;
  const issuerAddress = isExpense ? contactAddress : companyAddress;
  const issuerTaxOffice = isExpense ? contactTaxOffice : companyTaxOffice;
  const issuerTaxId = isExpense ? contactTaxNo : companyTaxId;
  const issuerPhone = isExpense ? "" : companyPhone;
  const issuerEmail = isExpense ? "" : companyEmail;
  const issuerWebsite = isExpense ? "" : companyWebsite;

  const recipientName = isExpense ? companyName : contactName;
  const recipientAddress = isExpense ? companyAddress : contactAddress;
  const recipientTaxOffice = isExpense ? companyTaxOffice : contactTaxOffice;
  const recipientTaxId = isExpense ? companyTaxId : contactTaxNo;
  const recipientLabel = isExpense ? "ALICI BİLGİLERİ" : "MÜŞTERİ BİLGİLERİ";

  const getMainCategoryName = (item: any) => {
      let mainName = "DİĞER";
      const catId = item.category || item.category_id || item?.project_sales_items?.category || item.category_name;
      const catMatch = categories.find((c: any) => c.id === catId || c.code === catId || c.name === catId);
      if (catMatch) {
         if (catMatch.parent_id) {
            const parentMatch = categories.find((c: any) => c.id === catMatch.parent_id);
            mainName = parentMatch ? parentMatch.name : catMatch.name;
         } else {
            mainName = catMatch.name;
         }
      } else if (item.category_name) {
         mainName = item.category_name.split(' | ')[0];
      }
      return mainName.toUpperCase();
  };

  const aggregatedItems = (() => {
     const groups = new Map();
     (items || []).forEach(item => {
        const catName = getMainCategoryName(item);
        const vat = Number(item.vat_rate || 0);
        const curr = item.currency || mainCurrency;
        const key = `${catName}_${vat}_${curr}`;

        if (!groups.has(key)) {
           groups.set(key, {
              categoryName: catName,
              vatRate: vat,
              currency: curr,
              amount: 0
           });
        }
        const g = groups.get(key);
        g.amount += Number(item.amount || item.balance || 0);
     });
     return Array.from(groups.values()).sort((a,b) => a.categoryName.localeCompare(b.categoryName));
  })();

  return (
    <div className="fixed inset-0 z-[60] bg-v3-surface backdrop-blur-sm overflow-y-auto py-8 sm:py-12 flex justify-center items-start">
      <div
        className="mx-auto light !bg-white !text-slate-900 flex flex-col relative w-[210mm] min-h-[297mm] shadow-[0_0_50px_rgba(0,0,0,0.3)] rounded-sm"
        style={{ colorScheme: "light" }}
        id="printable-invoice"
      >
        {/* Actions - Hidden when printing */}
        <div className="absolute top-0 right-[-80px] flex flex-col gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-500/90 transition-all font-bold"
            title="Yazdır"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-3 bg-gray-800 text-v3-text rounded-full shadow-lg hover:bg-gray-900 transition-all font-bold"
            title="Kapat"
          >
            ESC
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            Yükleniyor...
          </div>
        ) : (
          <div className="flex-1 flex flex-col px-[14mm] py-[12mm]">
            {/* ═══════════════ HEADER ═══════════════ */}
            <div className="flex justify-between items-start w-full border-b-[2px] border-slate-900 pb-6">
              {/* Logo */}
              <div className="flex items-center w-1/2">
                {logoUrl && (
                  <img
                    src={logoUrl}
                    className="w-auto max-h-[80px] max-w-[200px] object-contain"
                    alt="Company Logo"
                  />
                )}
              </div>

              {/* Company Info */}
              <div
                className="w-1/2 text-right uppercase"
                style={{ color: "#0f172a" }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    color: "#64748b",
                    letterSpacing: "0.1em",
                    marginBottom: "6px",
                  }}
                >
                  DÜZENLEYEN
                </div>
                {issuerName && (
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 900,
                      color: "#000",
                      letterSpacing: "0.05em",
                      marginBottom: "4px",
                    }}
                  >
                    {issuerName}
                  </div>
                )}
                {issuerAddress && (
                  <div
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 700,
                      lineHeight: 1.6,
                      color: "#1e293b",
                    }}
                  >
                    {issuerAddress}
                  </div>
                )}
                {(issuerTaxOffice || issuerTaxId) && (
                  <div
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 700,
                      lineHeight: 1.6,
                      color: "#1e293b",
                    }}
                  >
                    {issuerTaxOffice && <span>V.D: {issuerTaxOffice} </span>}
                    {issuerTaxId && <span>V.NO: {issuerTaxId}</span>}
                  </div>
                )}
                {issuerPhone && (
                  <div
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 700,
                      lineHeight: 1.6,
                      color: "#1e293b",
                    }}
                  >
                    TEL: {issuerPhone}
                  </div>
                )}
                {issuerEmail && (
                  <div
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 700,
                      lineHeight: 1.6,
                      color: "#1e293b",
                    }}
                  >
                    {issuerEmail}
                  </div>
                )}
                {issuerWebsite && (
                  <div
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 700,
                      lineHeight: 1.6,
                      color: "#1e293b",
                    }}
                  >
                    {issuerWebsite}
                  </div>
                )}
              </div>
            </div>

            {/* ═══════════════ INVOICE TITLE & DETAILS ═══════════════ */}
            <div className="flex justify-between items-end mt-8 mb-6">
              <div className="text-[20px] font-black tracking-widest uppercase text-slate-900">
                PROFORMA FATURA
              </div>
              <div className="flex gap-10 text-[10px]">
                <div className="flex flex-col items-end gap-1">
                  <span className="uppercase font-bold text-v3-muted">
                    FATURA NO
                  </span>
                  <span className="text-sm font-black tracking-wider text-slate-900">
                    {invoice?.invoice_no || "-"}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="uppercase font-bold text-v3-muted">
                    TARİH
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {invoice?.date ? formatDate(invoice.date) : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* ═══════════════ CUSTOMER INFO ═══════════════ */}
            <div
              className="p-4 rounded-md border border-slate-200 mb-8 text-[11px]"
              style={{ backgroundColor: "#f8fafc", color: "#0f172a" }}
            >
              <div className="font-bold text-v3-muted uppercase tracking-wider mb-2 text-[10px]">
                {recipientLabel}
              </div>
              <div className="flex justify-between items-start">
                <div className="w-[60%] space-y-1">
                  <div className="font-black uppercase text-[12px]">
                    {recipientName}
                  </div>
                  {recipientAddress && (
                    <div className="font-medium uppercase whitespace-pre-wrap">
                      {recipientAddress}
                    </div>
                  )}

                </div>
                <div className="w-[35%] space-y-1 text-right">
                  {(recipientTaxOffice || recipientTaxId) && (
                    <div className="font-bold uppercase">
                      {recipientTaxOffice && (
                        <span className="mr-2">VD: {recipientTaxOffice}</span>
                      )}
                      {recipientTaxId && <span>V.NO: {recipientTaxId}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ═══════════════ ITEMS TABLE ═══════════════ */}
            <div className="mt-4 flex-1">
              <div className="flex justify-between border-b-[2px] border-slate-900 pb-2 mb-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-900">
                <div className="w-[50%] text-left pl-2">AÇIKLAMA / HİZMET DETAYI</div>
                <div className="w-[20%] text-right pr-4">KATEGORİ</div>
                <div className="w-[10%] text-right">KDV %</div>
                <div className="w-[10%] text-right">BİRİM</div>
                <div className="w-[10%] text-right pr-2">TUTAR</div>
              </div>

              <div className="space-y-2 text-slate-900 min-h-[120mm]">
                {aggregatedItems.map((group, idx) => (
                  <div key={idx} className="flex justify-between text-[10px] uppercase font-bold items-start py-1.5 px-2 hover:bg-slate-50 transition-colors">
                    <div className="w-[50%] leading-relaxed tracking-wide text-slate-700 font-medium">
                      {(() => {
                        const proj = items?.[0]?.project;
                        const projNo = proj?.voucher_number || proj?.reference || proj?.code || proj?.title || "";
                        let text = invoice?.notes || "-";
                        if (projNo && text !== "-" && !text.includes(projNo)) {
                            text = `${projNo} | ${text}`;
                        } else if (projNo && text === "-") {
                            text = projNo;
                        }
                        return text;
                      })()}
                    </div>
                    <div className="w-[20%] text-right pr-4 font-black text-slate-900 text-[11px]">
                      {group.categoryName}
                    </div>
                    <div className="w-[10%] text-right text-slate-600">
                      %{group.vatRate.toFixed(0)}
                    </div>
                    <div className="w-[10%] text-right text-[8.5px] text-slate-600 font-semibold mt-0.5">
                      {group.currency}
                    </div>
                    <div className="w-[10%] text-right whitespace-nowrap tracking-wider font-extrabold">
                      {formatCurrency(group.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══════════════ TOTALS & VAT BREAKDOWN ═══════════════ */}
            <div className="mt-4 flex justify-between items-start border-t-[2px] border-slate-900 pt-4 text-slate-900">
              {/* VAT Breakdown */}
              <div className="w-[50%] text-[9.5px]">
                <div className="font-bold text-v3-muted uppercase tracking-wider mb-2">
                  KDV DETAYI
                </div>
                {Object.entries(vatBreakdown).map(
                  ([rate, vals]: [any, any]) => (
                    <div key={rate} className="flex font-black mb-1.5 uppercase">
                      <span className="w-20 text-slate-600">
                        %{Number(rate).toFixed(0)} KDV:
                      </span>
                      <span className="w-24 text-right tracking-wider">
                        {formatCurrency(vals.matrah)}
                      </span>
                      <span className="mx-2 text-v3-muted">+</span>
                      <span className="w-24 text-right tracking-wider">
                        {formatCurrency(vals.kdv)}
                      </span>
                    </div>
                  ),
                )}
                {mainCurrency !== "TRY" && (
                  <div className="mt-3 pt-2 border-t border-slate-200 inline-flex flex-col gap-1">
                    <span className="font-bold text-slate-500 uppercase text-[9px]">GENEL TOPLAM TL KARŞILIĞI</span>
                    <span className="font-black tracking-wider text-slate-800 text-[11px]">
                      {formatCurrency(genelToplamTRY)} TRY
                    </span>
                  </div>
                )}
              </div>

              {/* Final Totals */}
              <div className="w-[45%] flex flex-col gap-2 border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex justify-between font-bold text-[11px] uppercase">
                  <span className="text-slate-600">ARA TOPLAM</span>
                  <span className="tracking-wider">
                    {formatCurrency(araToplamMatrah as number)} {mainCurrency}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-[11px] uppercase">
                  <span className="text-slate-600">KDV TOPLAMI</span>
                  <span className="tracking-wider">
                    {formatCurrency(toplamKdv as number)} {mainCurrency}
                  </span>
                </div>
                <div className="flex justify-between font-black text-[14px] border-t border-slate-300 pt-2 mt-1 uppercase text-blue-900">
                  <span>GENEL TOPLAM</span>
                  <span className="tracking-wider">
                    {formatCurrency(genelToplam as number)} {mainCurrency}
                  </span>
                </div>
              </div>
            </div>

            {/* Spell check */}
            <div className="mt-4 font-black text-[9.5px] tracking-wide text-slate-600 uppercase text-right">
              YALNIZ:{" "}
              <span className="ml-1 tracking-wider text-slate-900">
                {numberToTextTR(genelToplam as number)} {mainCurrency}
              </span>
            </div>

            {/* Footer Placeholder for Proforma Note */}
            <div className="mt-8 text-center text-[9px] font-bold text-v3-muted uppercase tracking-widest border-t border-slate-200 pt-4 pb-2">
              BU BİR BİLGİLENDİRME (PROFORMA) FATURASIDIR. MALİ DEĞERİ YOKTUR.
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice,
          #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            box-shadow: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
