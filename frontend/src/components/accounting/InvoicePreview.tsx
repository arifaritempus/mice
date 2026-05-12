'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface InvoicePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any; // Invoice header
  items: any[]; // Invoice lines
}

export default function InvoicePreview({ isOpen, onClose, invoice, items }: InvoicePreviewProps) {
  const [contactInfo, setContactInfo] = useState<any>(null);

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Load full contact information from system
  useEffect(() => {
    if (!isOpen || !invoice?.contact_id) return;

    const loadContactInfo = async () => {
      try {
        const tables = ['agencies', 'hotels', 'suppliers'];
        for (const table of tables) {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('id', invoice.contact_id)
            .maybeSingle();

          if (data && !error) {
            setContactInfo({ ...data, _source: table });
            break;
          }
        }
      } catch (err) {
        console.error('Contact info load error:', err);
      }
    };

    loadContactInfo();
  }, [isOpen, invoice?.contact_id]);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // KDV Breakdown
  const vatBreakdown = items.reduce((acc: any, item: any) => {
    const rate = Number(item.vat_rate || 0);
    const grossAmount = Number(item.amount || 0);
    const matrah = grossAmount / (1 + (rate / 100));
    const kdv = grossAmount - matrah;
    if (!acc[rate]) acc[rate] = { matrah: 0, kdv: 0, gross: 0 };
    acc[rate].matrah += matrah;
    acc[rate].kdv += kdv;
    acc[rate].gross += grossAmount;
    return acc;
  }, {});

  const araToplamMatrah = Object.values(vatBreakdown).reduce((sum: number, b: any) => sum + b.matrah, 0);
  const toplamKdv = Object.values(vatBreakdown).reduce((sum: number, b: any) => sum + b.kdv, 0);
  const genelToplam = araToplamMatrah + toplamKdv;

  const mainCurrency = items[0]?.currency || invoice?.currency || 'TRY';

  // Number to text (TR)
  const numberToTextTR = (num: number): string => {
    if (!num || num === 0) return 'Sıfır';
    const ones = ['', 'Bir', 'İki', 'Üç', 'Dört', 'Beş', 'Altı', 'Yedi', 'Sekiz', 'Dokuz'];
    const tens = ['', 'On', 'Yirmi', 'Otuz', 'Kırk', 'Elli', 'Altmış', 'Yetmiş', 'Seksen', 'Doksan'];
    const thousands = ['', 'Bin', 'Milyon', 'Milyar', 'Trilyon'];
    const getHundreds = (n: number) => {
      let str = '';
      const h = Math.floor(n / 100);
      const t = Math.floor((n % 100) / 10);
      const o = n % 10;
      if (h > 1) str += ones[h] + 'Yüz';
      else if (h === 1) str += 'Yüz';
      if (t > 0) str += tens[t];
      if (o > 0) str += ones[o];
      return str;
    };
    let intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);
    let str = '';
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
      res += 'Nokta' + getHundreds(decPart);
    }
    return res;
  };

  // Contact display - from system
  const contactName = contactInfo?.name || contactInfo?.company_name || invoice?.contact_name || invoice?.contact_id || '-';
  const contactAddress = contactInfo?.address || contactInfo?.city || '';
  const contactTaxNo = contactInfo?.tax_number || contactInfo?.vkn || '';
  const contactTaxOffice = contactInfo?.tax_office || '';

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm overflow-y-auto py-8 sm:py-12 flex justify-center items-start">
      <div
        className="mx-auto light !bg-white !text-slate-900 flex flex-col relative w-[210mm] min-h-[297mm] shadow-[0_0_50px_rgba(0,0,0,0.3)] rounded-sm"
        style={{ colorScheme: 'light' }}
        id="printable-invoice"
      >

        {/* Actions - Hidden when printing */}
        <div className="absolute top-0 right-[-80px] flex flex-col gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all font-bold"
            title="Yazdır"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          </button>
          <button
            onClick={onClose}
            className="p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-900 transition-all font-bold"
            title="Kapat"
          >
            ESC
          </button>
        </div>

        <div className="flex-1 flex flex-col px-[14mm] py-[12mm]">

          {/* ═══════════════ MATBU HEADER (Tempus'a ait) ═══════════════ */}
          <div className="flex justify-between items-start w-full">
            {/* Logo */}
            <div className="flex items-center">
              <img
                src="/LOGO_NAVY.png"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  // Fallback SVG logo
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'block';
                }}
                className="w-[160px] h-auto object-contain"
                alt="Tempus Travel Logo"
              />
              <svg viewBox="0 0 100 100" className="w-[70px] h-auto hidden" style={{ display: 'none' }}>
                <g stroke="black" strokeWidth="4" fill="none" strokeLinejoin="round">
                  <path d="M 20 40 L 80 40" />
                  <path d="M 20 60 L 80 60" />
                  <path d="M 45 25 L 45 75 M 55 25 L 55 75" />
                  <path d="M 30 40 L 30 25 L 70 25 L 70 60" />
                  <path d="M 45 75 L 30 75 L 30 60" />
                </g>
              </svg>
            </div>

            {/* TEMPUS TRAVEL */}
            <div className="text-right">
              <div className="text-[28px] tracking-[0.2em] font-normal leading-none uppercase text-slate-900">TEMPUS</div>
              <div className="text-[10px] tracking-[0.3em] font-medium mt-1.5 uppercase text-slate-900">TRAVEL</div>
            </div>
          </div>

          {/* Stamps Box Center - Matbu */}
          <div className="flex justify-center items-center gap-3 mt-4 mb-2">
            {/* Circular Stamp */}
            <div className="w-[50px] h-[50px] rounded-full border-[1px] border-black flex flex-col items-center justify-center p-0.5 text-[5px] font-bold text-center leading-tight uppercase relative scale-[0.8] origin-center -ml-8">
              <div className="absolute inset-1 rounded-full border-[0.5px] border-black border-dotted"></div>
              <span>GELİR VE VERGİ</span>
              <span className="my-0.5">DAİRESİ</span>
              <span>KKTC</span>
              <span className="mt-0.5">BELGE ONAYI</span>
            </div>
            {/* Dashed Pul Vergisi Box */}
            <div className="border-[1.5px] border-black border-dashed px-1.5 py-1 text-[6.5px] font-bold text-center flex flex-col leading-tight -ml-2">
              <span>K.K.T.C.</span>
              <span>Pul vergisi</span>
              <span>ödenmiştir.</span>
            </div>
          </div>

          {/* Company Info & Fatura Title - Matbu */}
          <div className="flex justify-between items-start relative mt-4">
            <div className="text-[13px] font-black tracking-widest uppercase mt-4 text-slate-900">
              FATURA | INVOICE
            </div>
            <div className="text-right text-[8px] leading-[1.65] font-bold uppercase tracking-wider text-slate-900">
              <p>TEMPUS TURIZM LIMITED</p>
              <p>DR. BURHAN NALBANTOĞLU CAD.</p>
              <p>No: 18/1 ORTAKÖY, LEFKOŞA / KKTC</p>
              <p>VERGİ SİCİL NO: MŞ 25733</p>
              <p>MUHASEBE@TEMPUSTRAVEL.CO</p>
              <p>WWW.TEMPUSTRAVEL.CO</p>
            </div>

            {/* Signature Placeholder - Matbu */}
            <div className="absolute top-8 left-[45%] -translate-x-1/2 opacity-70 flex flex-col items-center text-black" style={{ transform: 'translate(-50%, 0) rotate(-4deg)' }}>
              <div className="text-[20px] font-serif italic mb-0.5">Tempus</div>
              <div className="text-[8px] font-bold leading-tight text-center uppercase border-t-[0.5px] border-black pt-1 px-4">
                Tempus Turizm Limited
                <br /><span className="text-[6px] font-normal leading-tight block">MŞ: 25733<br />Dr. Burhan Nalbantoğlu Cad. No:18/1<br />Ortaköy - Lefkoşa</span>
              </div>
            </div>
          </div>

          {/* ═══════════════ SİSTEMDEN GELEN BİLGİLER ═══════════════ */}

          {/* Customer Info Box - Sistemden */}
          <div className="mt-[18mm] text-[10px] w-full text-slate-900">
            <div className="flex justify-between items-start">
              {/* Left customer block - Sistemden */}
              <div className="space-y-4">
                <div className="flex">
                  <span className="w-36 uppercase font-bold text-slate-900">MÜŞTERİ ADI:</span>
                  <span className="font-extrabold uppercase text-[11px]">{contactName}</span>
                </div>
                <div className="flex">
                  <span className="w-36 uppercase font-bold text-slate-900">ADRES:</span>
                  <span className="font-bold uppercase text-[10px] leading-snug w-[250px] whitespace-pre-wrap">
                    {contactAddress || invoice?.notes || ''}
                  </span>
                </div>
                <div className="flex pt-4">
                  <span className="w-36 uppercase font-bold text-slate-900">
                    {contactTaxOffice ? contactTaxOffice : 'VERGİ DAİRESİ'}
                  </span>
                  <span className="font-bold uppercase tracking-wider">{contactTaxNo || ''}</span>
                </div>
              </div>

              {/* Right Invoice Info Block - Sistemden */}
              <div className="flex flex-col items-end gap-5">
                <div className="flex items-center gap-6">
                  <span className="uppercase font-bold text-slate-900 text-[10px]">FATURA NO:</span>
                  <span className="text-xl font-normal leading-none tracking-wider">{invoice?.invoice_no || '0000'}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="uppercase font-bold text-slate-900 text-[10px]">TARİH:</span>
                  <span className="font-black text-[10px]">{invoice?.date ? formatDate(invoice.date) : ''}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table Header & Rows - Sistemden */}
          <div className="mt-8">
            <div className="flex justify-between border-b-[1.5px] border-slate-900 pb-2 mb-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-900">
              <div className="w-[65%] text-left">AÇIKLAMA / KATEGORİ</div>
              <div className="w-[10%] text-right">KDV %</div>
              <div className="w-[10%] text-right">DÖVİZ</div>
              <div className="w-[15%] text-right">TOPLAM</div>
            </div>
            <div className="min-h-[100mm] space-y-2 text-slate-900">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[9.5px] uppercase font-bold items-start py-0.5">
                  <div className="w-[65%] pr-4 leading-relaxed tracking-wide">
                    {item.description || '-'}
                    {item.category_name && (
                      <span className="text-[8px] text-gray-500 ml-2 font-medium">
                        ({item.category_name})
                      </span>
                    )}
                  </div>
                  <div className="w-[10%] text-right">
                    %{Number(item.vat_rate || 0).toFixed(0)}
                  </div>
                  <div className="w-[10%] text-right text-[8px]">
                    {item.currency || mainCurrency}
                  </div>
                  <div className="w-[15%] text-right whitespace-nowrap tracking-wider font-extrabold">
                    {formatCurrency(item.amount)} {item.currency || 'TL'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Box - Sistemden */}
          <div className="grid grid-cols-12 gap-8 text-[10px] text-slate-900">
            {/* Left - VAT Lines */}
            <div className="col-span-7 flex flex-col justify-end pb-8 pl-[10%]">
              <div className="w-full">
                {Object.entries(vatBreakdown).map(([rate, vals]: [any, any]) => (
                  <div key={rate} className="flex justify-between font-black mb-1.5 uppercase">
                    <span className="w-24">%{(Number(rate)).toFixed(1)} MATRAH</span>
                    <span className="w-24 text-right tracking-wider">{formatCurrency(vals.matrah)}</span>
                    <span className="w-12 text-right ml-4">KDV</span>
                    <span className="w-24 text-right tracking-wider">{formatCurrency(vals.kdv)}</span>
                  </div>
                ))}

                {/* Empty Mathrah placeholders */}
                <div className="flex justify-between font-extrabold mt-3 uppercase text-black">
                  <span className="w-24">MATRAH</span>
                  <span className="w-24 flex-1"></span>
                  <span className="w-12 text-right ml-4">KDV</span>
                  <span className="w-24 flex-1"></span>
                </div>
                <div className="flex justify-between font-extrabold mt-1 uppercase text-black">
                  <span className="w-24">MATRAH</span>
                  <span className="w-24 flex-1"></span>
                  <span className="w-12 text-right ml-4">KDV</span>
                  <span className="w-24 text-right tracking-wider">{formatCurrency(toplamKdv)} {items[0]?.currency || 'TL'}</span>
                </div>
              </div>
            </div>

            {/* Right - Totals Block */}
            <div className="col-span-5 border-t border-black -ml-4 pl-4 pt-1">
              <div className="border-b-[1px] border-black py-[11px]">
                <div className="flex justify-between font-extrabold text-[10.5px]">
                  <span className="uppercase tracking-[0.15em] text-black">ARA TOPLAM</span>
                  <span className="tracking-wider">{formatCurrency(araToplamMatrah)} {items[0]?.currency || 'TL'}</span>
                </div>
              </div>
              <div className="border-b-[1px] border-black py-[11px] mb-[15px]">
                <div className="flex justify-between font-extrabold text-[10.5px]">
                  <span className="uppercase tracking-[0.15em] text-black">KDV</span>
                  <span className="tracking-wider">{formatCurrency(toplamKdv)} {items[0]?.currency || 'TL'}</span>
                </div>
              </div>
              <div className="py-[10px]">
                <div className="flex justify-between font-extrabold text-[11px]">
                  <span className="uppercase tracking-[0.15em] text-black">GENEL TOPLAM</span>
                  <span className="tracking-wider text-[11.5px]">{formatCurrency(genelToplam)} {items[0]?.currency || 'TL'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Spell check / Number to Text */}
          <div className="mt-4 font-black text-[10.5px] tracking-wide text-slate-900 pb-4 border-b border-gray-100">
            Yalnız <span className="ml-1 tracking-wider">{numberToTextTR(genelToplam)}{items[0]?.currency || 'TL'}</span>
          </div>

          {/* Footer - Banks and Matbaa Details - Matbu */}
          <div className="mt-8 pb-2 w-full grid grid-cols-2 gap-12 text-[7.5px] font-extrabold uppercase leading-[1.65] text-slate-900 tracking-wide">
            <div className="space-y-0.5">
              <div className="mb-2 font-black text-[8px] border-b border-gray-200 pb-0.5 inline-block">GARANTİ BANK</div>
              <div className="flex"><span className="w-[30%] opacity-80">TL</span><span className="w-[70%]">TR82 0006 2000 4930 0006 2935 35</span></div>
              <div className="flex"><span className="w-[30%] opacity-80">EURO</span><span className="w-[70%]">TR96 0006 2000 4930 0009 0644 76</span></div>
              <div className="flex"><span className="w-[30%] opacity-80">GBP</span><span className="w-[70%]">TR69 0006 2000 4930 0009 0644 77</span></div>
              <div className="flex"><span className="w-[30%] opacity-80">USD</span><span className="w-[70%]">TR42 0006 2000 4930 0009 0644 78</span></div>
              <div className="flex"><span className="w-[30%] opacity-80">SWIFT CODE</span><span className="w-[70%] font-black">TGBATRISXXX</span></div>
            </div>

            <div className="space-y-0.5 ml-8">
              <div className="mb-2 font-black text-[8px] border-b border-gray-200 pb-0.5 inline-block">IS BANK</div>
              <div className="flex"><span className="w-[30%] opacity-80">TL</span><span className="w-[70%]">TR97 0006 4000 0016 8040 2013 36</span></div>
              <div className="flex"><span className="w-[30%] opacity-80">EURO</span><span className="w-[70%]">TR26 0006 4000 0026 8040 2776 87</span></div>
              <div className="flex"><span className="w-[30%] opacity-80">GBP</span><span className="w-[70%]">TR85 0006 4000 0026 8040 2776 92</span></div>
              <div className="flex"><span className="w-[30%] opacity-80">USD</span><span className="w-[70%]">TR16 0006 4000 0026 8040 2776 73</span></div>
              <div className="flex"><span className="w-[30%] opacity-80">SWIFT CODE</span><span className="w-[70%] font-black">ISBKTRISXXX</span></div>
            </div>
          </div>

          <div className="mt-auto pt-2 text-[6.5px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-1.5 opacity-80 pb-2">
            <span className="text-[8px]">||</span>
            <span>BASKI: OKMAN PRINTING LTD. MŞ: 2012 TEL: 225 4247</span>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
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
