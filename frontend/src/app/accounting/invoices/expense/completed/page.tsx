'use client';

import { useState, useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import { invoicesService } from '@/lib/supabaseService';
import LoadingSpinner from '@/components/LoadingSpinner';
import InvoiceModal from '@/components/accounting/InvoiceModal';
import InvoicePreview from '@/components/accounting/InvoicePreview';
import ConfirmModal from '@/components/ConfirmModal';
import PaginationControls from '@/components/PaginationControls';
import { DateRangeFieldAccounting } from '@/components/accounting/DateRangeFieldAccounting';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import { usePermissions, Module } from '@/lib/permissions';

export default function ExpenseCompletedPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({ start: new Date().toISOString().split('T')[0], end: '' });
  const [voucherTokens, setVoucherTokens] = useState<string[]>([]);
  const [voucherInput, setVoucherInput] = useState('');
  const [companyTokens, setCompanyTokens] = useState<string[]>([]);
  const [companyInput, setCompanyInput] = useState('');
  const [agencyTokens, setAgencyTokens] = useState<string[]>([]);
  const [agencyInput, setAgencyInput] = useState('');
  const [hotelTokens, setHotelTokens] = useState<string[]>([]);
  const [hotelInput, setHotelInput] = useState('');
  const [categoryTokens, setCategoryTokens] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedInvoiceItems, setSelectedInvoiceItems] = useState<any[]>([]);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<{ id: string; no: string } | null>(null);

  useEffect(() => {
    loadInvoices();
  }, [dateRange.start, dateRange.end]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoicesService.getInvoicesPage({
        type: 'expense',
        fetchAllInRange: true,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined
      });
      setAllInvoices(response.data);
    } catch (err) {
      console.error('Invoices load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [dateRange.start, dateRange.end, voucherTokens, companyTokens, agencyTokens, hotelTokens, categoryTokens]);

  const addToken = (
    raw: string,
    tokens: string[],
    setTokens: Dispatch<SetStateAction<string[]>>,
    setInput: Dispatch<SetStateAction<string>>
  ) => {
    const parts = raw
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const lowerSet = new Set(tokens.map((t) => t.toLowerCase()));
    const next = [...tokens];
    for (const p of parts) {
      const k = p.toLowerCase();
      if (!lowerSet.has(k)) {
        next.push(p);
        lowerSet.add(k);
      }
    }
    setTokens(next);
    setInput('');
  };

  const removeLastToken = (setTokens: Dispatch<SetStateAction<string[]>>) => {
    setTokens((prev) => prev.slice(0, -1));
  };

  const voucherTerms = useMemo(() => voucherTokens.map((v) => v.toLowerCase()), [voucherTokens]);
  const companyTerms = useMemo(() => companyTokens.map((v) => v.toLowerCase()), [companyTokens]);
  const agencyTerms = useMemo(() => agencyTokens.map((v) => v.toLowerCase()), [agencyTokens]);
  const hotelTerms = useMemo(() => hotelTokens.map((v) => v.toLowerCase()), [hotelTokens]);
  const categoryTerms = useMemo(() => categoryTokens.map((v) => v.toLowerCase()), [categoryTokens]);

  const filteredInvoices = useMemo(() => {
    if (
      !voucherTerms.length &&
      !companyTerms.length &&
      !agencyTerms.length &&
      !hotelTerms.length &&
      !categoryTerms.length
    ) {
      return allInvoices;
    }
    return allInvoices.filter((inv) => {
      const isSejour = inv.metadata?.is_sejour === true;
      const category = (inv.metadata?.category_search || '').toLowerCase();
      const hotelSearchTarget = [
        inv.metadata?.hotel_name || '',
        !isSejour ? (inv.metadata?.reference || '') : '',
        inv.notes || ''
      ]
        .join(' ')
        .toLowerCase();
      const firmaBarHaystack = (inv.metadata?.agency_name || (isSejour ? inv.metadata?.company_name : '') || '').toLowerCase();
      const acenteBarHaystack = (isSejour ? '' : (inv.metadata?.company_name || '')).toLowerCase();
      const voucher = (inv.metadata?.voucher_number || '').toLowerCase();
      const reference = (!isSejour ? (inv.metadata?.reference || '') : '').toLowerCase();
      const notes = (inv.notes || '').toLowerCase();

      if (voucherTerms.length && !voucherTerms.some((t) => voucher.includes(t) || reference.includes(t))) return false;
      if (companyTerms.length && !companyTerms.some((t) => firmaBarHaystack.includes(t))) return false;
      if (agencyTerms.length && !agencyTerms.some((t) => acenteBarHaystack.includes(t))) return false;
      if (hotelTerms.length && !hotelTerms.some((t) => hotelSearchTarget.includes(t))) return false;
      if (categoryTerms.length && !categoryTerms.some((t) => category.includes(t) || notes.includes(t))) return false;
      return true;
    });
  }, [allInvoices, voucherTerms, companyTerms, agencyTerms, hotelTerms, categoryTerms]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const displayInvoices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.INVOICES)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
          <a href="/accounting" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Muhasebeye Dön
          </a>
        </div>
      </div>
    );
  }

  const handleEdit = async (inv: any) => {
    try {
      setLoading(true);
      const fullInvoice = await invoicesService.getById(inv.id);
      setSelectedInvoice(fullInvoice);
      setSelectedInvoiceItems(fullInvoice.invoice_items || []);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Fetch invoice error:', err);
      alert('Fatura detayları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (inv: any) => {
    try {
      setLoading(true);
      const fullInvoice = await invoicesService.getById(inv.id);
      setSelectedInvoice(fullInvoice);
      setSelectedInvoiceItems(fullInvoice.invoice_items || []);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Preview fetch error:', err);
      alert('Önizleme yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string, no: string) => {
    setDeletingInvoice({ id, no });
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingInvoice) return;

    try {
      setLoading(true);
      await invoicesService.delete(deletingInvoice.id);
      setIsDeleteConfirmOpen(false);
      setDeletingInvoice(null);
      await loadInvoices();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Silme işlemi sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY'
    }).format(amount || 0);
  };

  const voucherDisplay = (inv: any) => {
    const v = inv.metadata?.voucher_number;
    const r = inv.metadata?.reference;
    if (v && r) return `${v} · ${r}`;
    return v || r || '';
  };

  const tokenChipCls =
    'shrink-0 inline-flex items-center gap-1 px-1 py-0.5 rounded bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-200 text-[10px]';

  return (
    <div className="flex flex-col min-h-[calc(100vh-2rem)] md:h-[calc(100vh-2rem)] p-4 space-y-4 bg-gray-50 text-slate-900 dark:bg-gray-900 dark:text-slate-100 w-full min-w-0 transition-colors duration-200">
      <div className="w-full min-w-0 flex flex-col flex-1 space-y-4">
      <div className="flex flex-col md:flex-row md:items-start justify-start gap-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            ✅ Tamamlanan Gider Faturaları
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            İşlemi tamamlanmış gider faturalarının listesi
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Arama ve Filtreleme</h3>
          <button
            type="button"
            onClick={() => {
              setVoucherTokens([]);
              setVoucherInput('');
              setCompanyTokens([]);
              setCompanyInput('');
              setAgencyTokens([]);
              setAgencyInput('');
              setHotelTokens([]);
              setHotelInput('');
              setCategoryTokens([]);
              setCategoryInput('');
              setDateRange({ start: '', end: '' });
            }}
            className="w-8 h-8 inline-flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-md text-xs"
            title="Filtreleri temizle"
          >
            x
          </button>
        </div>
        <div
          className="grid w-full min-w-0 items-end gap-2 responsive-filter-grid"
          style={{
            gridTemplateColumns: 'minmax(0,1.25fr) minmax(0,0.95fr) minmax(0,0.95fr) minmax(0,0.95fr) minmax(0,0.95fr) minmax(0,0.95fr)'
          }}
        >
          <DateRangeFieldAccounting
            label="Fatura Tarihi Aralığı"
            startValue={dateRange.start}
            endValue={dateRange.end}
            onStartChange={(value) => setDateRange((prev) => ({ ...prev, start: value }))}
            onEndChange={(value) => setDateRange((prev) => ({ ...prev, end: value }))}
          />
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Voucher</label>
            <div className="w-full h-8 px-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 flex items-center gap-1 overflow-x-auto">
              {voucherTokens.length > 0 && (
                <button
                  type="button"
                  className={tokenChipCls}
                  onClick={() => removeLastToken(setVoucherTokens)}
                  title={voucherTokens.join(', ')}
                >
                  <span>+{voucherTokens.length}</span>
                  <span>x</span>
                </button>
              )}
              <input
                type="text"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToken(voucherInput, voucherTokens, setVoucherTokens, setVoucherInput);
                  }
                  if (e.key === 'Backspace' && voucherInput.length === 0 && voucherTokens.length > 0)
                    removeLastToken(setVoucherTokens);
                }}
                placeholder="Yaz, Enter ile ekle"
                className="flex-1 min-w-[1.5rem] h-full bg-transparent outline-none text-gray-900 dark:text-white text-xs"
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Firma</label>
            <div className="w-full h-8 px-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 flex items-center gap-1 overflow-x-auto">
              {companyTokens.length > 0 && (
                <button
                  type="button"
                  className={tokenChipCls}
                  onClick={() => removeLastToken(setCompanyTokens)}
                  title={companyTokens.join(', ')}
                >
                  <span>+{companyTokens.length}</span>
                  <span>x</span>
                </button>
              )}
              <input
                type="text"
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToken(companyInput, companyTokens, setCompanyTokens, setCompanyInput);
                  }
                  if (e.key === 'Backspace' && companyInput.length === 0 && companyTokens.length > 0)
                    removeLastToken(setCompanyTokens);
                }}
                placeholder="Yaz, Enter ile ekle"
                className="flex-1 min-w-[1.5rem] h-full bg-transparent outline-none text-gray-900 dark:text-white text-xs"
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Acente</label>
            <div className="w-full h-8 px-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 flex items-center gap-1 overflow-x-auto">
              {agencyTokens.length > 0 && (
                <button
                  type="button"
                  className={tokenChipCls}
                  onClick={() => removeLastToken(setAgencyTokens)}
                  title={agencyTokens.join(', ')}
                >
                  <span>+{agencyTokens.length}</span>
                  <span>x</span>
                </button>
              )}
              <input
                type="text"
                value={agencyInput}
                onChange={(e) => setAgencyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToken(agencyInput, agencyTokens, setAgencyTokens, setAgencyInput);
                  }
                  if (e.key === 'Backspace' && agencyInput.length === 0 && agencyTokens.length > 0)
                    removeLastToken(setAgencyTokens);
                }}
                placeholder="Yaz, Enter ile ekle"
                className="flex-1 min-w-[1.5rem] h-full bg-transparent outline-none text-gray-900 dark:text-white text-xs"
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Otel</label>
            <div className="w-full h-8 px-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 flex items-center gap-1 overflow-x-auto">
              {hotelTokens.length > 0 && (
                <button
                  type="button"
                  className={tokenChipCls}
                  onClick={() => removeLastToken(setHotelTokens)}
                  title={hotelTokens.join(', ')}
                >
                  <span>+{hotelTokens.length}</span>
                  <span>x</span>
                </button>
              )}
              <input
                type="text"
                value={hotelInput}
                onChange={(e) => setHotelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToken(hotelInput, hotelTokens, setHotelTokens, setHotelInput);
                  }
                  if (e.key === 'Backspace' && hotelInput.length === 0 && hotelTokens.length > 0)
                    removeLastToken(setHotelTokens);
                }}
                placeholder="Yaz, Enter ile ekle"
                className="flex-1 min-w-[1.5rem] h-full bg-transparent outline-none text-gray-900 dark:text-white text-xs"
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Kategori</label>
            <div className="w-full h-8 px-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 flex items-center gap-1 overflow-x-auto">
              {categoryTokens.length > 0 && (
                <button
                  type="button"
                  className={tokenChipCls}
                  onClick={() => removeLastToken(setCategoryTokens)}
                  title={categoryTokens.join(', ')}
                >
                  <span>+{categoryTokens.length}</span>
                  <span>x</span>
                </button>
              )}
              <input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToken(categoryInput, categoryTokens, setCategoryTokens, setCategoryInput);
                  }
                  if (e.key === 'Backspace' && categoryInput.length === 0 && categoryTokens.length > 0)
                    removeLastToken(setCategoryTokens);
                }}
                placeholder="Yaz, Enter ile ekle"
                className="flex-1 min-w-[1.5rem] h-full bg-transparent outline-none text-gray-900 dark:text-white text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {loading && allInvoices.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner compact />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-slate-100 flex-1 min-h-0 flex flex-col w-full relative">
          <div className="overflow-auto w-full flex-1">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 relative">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fatura Tarihi
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fatura No
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tedarikçi
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Firma & Otel
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hizmet Tarihi
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Voucher / Ref
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tutar
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {displayInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {new Date(inv.date).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                      {inv.invoice_no}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-900 dark:text-slate-100 font-medium">{inv.contact_name}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[14rem]">
                    {inv.metadata?.company_name ? (
                      <div className="text-xs text-slate-800 dark:text-slate-200 font-medium truncate" title={inv.metadata.company_name}>
                        {inv.metadata.company_name}
                      </div>
                    ) : null}
                    {inv.metadata?.hotel_name ? (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate" title={inv.metadata.hotel_name}>
                        {inv.metadata.hotel_name}
                      </div>
                    ) : !inv.metadata?.company_name ? (
                      <span className="text-slate-400 text-xs">-</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {inv.metadata?.date_start || inv.metadata?.date_end ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatDate(inv.metadata.date_start)} → {formatDate(inv.metadata.date_end)}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[12rem]">
                    {voucherDisplay(inv) ? (
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate block" title={voucherDisplay(inv)}>
                        {voucherDisplay(inv)}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {formatCurrency(inv.total_amount, inv.currency)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handlePreview(inv)}
                        className="p-1.5 text-slate-400 hover:text-orange-600 transition-colors"
                        title="Görüntüle / Yazdır"
                        type="button"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEdit(inv)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors"
                        title="Düzenle"
                        type="button"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(inv.id, inv.invoice_no)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        title="Sil"
                        type="button"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationControls
            page={page}
            pageSize={pageSize}
            total={filteredInvoices.length}
            totalPages={totalPages}
            preferenceKey="expense_completed_page_size"
            compactRight
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />

          {filteredInvoices.length === 0 && (
            <div className="text-center py-16 italic text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              Kayıtlı gider faturası bulunamadı.
              {(dateRange.start ||
                dateRange.end ||
                voucherTokens.length ||
                voucherInput ||
                companyTokens.length ||
                companyInput ||
                agencyTokens.length ||
                agencyInput ||
                hotelTokens.length ||
                hotelInput ||
                categoryTokens.length ||
                categoryInput) && (
                <button
                  type="button"
                  onClick={() => {
                    setDateRange({ start: '', end: '' });
                    setVoucherTokens([]);
                    setVoucherInput('');
                    setCompanyTokens([]);
                    setCompanyInput('');
                    setAgencyTokens([]);
                    setAgencyInput('');
                    setHotelTokens([]);
                    setHotelInput('');
                    setCategoryTokens([]);
                    setCategoryInput('');
                  }}
                  className="block mx-auto mt-4 text-orange-600 dark:text-orange-400 text-sm font-semibold hover:underline"
                >
                  Filtreleri Temizle
                </button>
              )}
            </div>
          )}
        </div>
        </div>
      )}

      {isModalOpen && selectedInvoice && (
        <InvoiceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          type="expense"
          onSuccess={loadInvoices}
          editInvoice={selectedInvoice}
          selectedItems={selectedInvoiceItems}
        />
      )}

      {isPreviewOpen && selectedInvoice && (
        <InvoicePreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          invoice={selectedInvoice}
          items={selectedInvoiceItems}
        />
      )}

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Faturayı Sil"
        message={`${deletingInvoice?.no} numaralı gider faturasını silmek istediğinize emin misiniz?`}
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        type="danger"
      />
    </div>
    </div>
  );
}
