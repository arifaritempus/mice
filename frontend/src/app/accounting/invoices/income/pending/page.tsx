'use client';

import { useState, useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import { invoicesService } from '@/lib/supabaseService';
import InvoiceItemTable from '@/components/accounting/InvoiceItemTable';
import InvoiceModal from '@/components/accounting/InvoiceModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import PaginationControls from '@/components/PaginationControls';
import { DateRangeFieldAccounting } from '@/components/accounting/DateRangeFieldAccounting';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import { usePermissions, Module } from '@/lib/permissions';

export default function IncomePendingPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
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

  useEffect(() => {
    loadItems();
  }, [page, pageSize, dateRange.start, dateRange.end]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await invoicesService.getPendingSalesItemsPage({
        page,
        pageSize,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined
      });
      setItems(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Pending items load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [dateRange.start, dateRange.end]);

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

  const filteredItems = useMemo(() => {
    if (!voucherTerms.length && !companyTerms.length && !agencyTerms.length && !hotelTerms.length && !categoryTerms.length) return items;
    return items.filter((item) => {
      const isSejour = item.project?.quote_type === 'SEJOUR';
      const category = (item.category_name || '').toLowerCase();
      const hotelSearchTarget = [
        item.project?.hotel_name || '',
        !isSejour ? (item.project?.title || '') : '',
        item.project?.description || '',
        item.description || ''
      ]
        .join(' ')
        .toLowerCase();
      const firmaBarHaystack = (
        item.project?.agency_name ||
        item.project?.agency?.name ||
        (isSejour ? item.project?.company_name : '') ||
        ''
      ).toLowerCase();
      const acenteBarHaystack = (isSejour ? '' : (item.project?.company_name || '')).toLowerCase();
      const voucher = (item.project?.voucher_number || '').toLowerCase();
      const reference = (!isSejour ? (item.project?.title || '') : '').toLowerCase();
      const description = (item.description || '').toLowerCase();

      if (voucherTerms.length && !voucherTerms.some((t) => voucher.includes(t) || reference.includes(t))) return false;
      if (companyTerms.length && !companyTerms.some((t) => firmaBarHaystack.includes(t))) return false;
      if (agencyTerms.length && !agencyTerms.some((t) => acenteBarHaystack.includes(t))) return false;
      if (hotelTerms.length && !hotelTerms.some((t) => hotelSearchTarget.includes(t))) return false;
      if (categoryTerms.length && !categoryTerms.some((t) => category.includes(t) || description.includes(t))) return false;
      return true;
    });
  }, [items, voucherTerms, companyTerms, agencyTerms, hotelTerms, categoryTerms]);

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

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-4 space-y-4 bg-gray-50 text-slate-900 dark:bg-gray-900 dark:text-slate-100 w-full min-w-0 transition-colors duration-200 overflow-hidden">
      <div className="w-full min-w-0 flex flex-col flex-1 min-h-0 space-y-4">
      <div className="flex flex-col md:flex-row md:items-start justify-start gap-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            📥 Bekleyen Gelir Faturaları
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={selectedItems.length === 0}
            className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold text-[11px] shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2 h-fit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Fatura Oluştur ({selectedItems.length})
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Arama ve Filtreleme</h3>
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
        <div className="grid w-full min-w-0 items-end gap-2 responsive-filter-grid" style={{ gridTemplateColumns: '180px 1fr 1fr 1fr 1fr 1fr' }}>
          <DateRangeFieldAccounting
            label="Fatura Tarihi Aralığı"
            startValue={dateRange.start}
            endValue={dateRange.end}
            onStartChange={(value) => setDateRange((prev) => ({ ...prev, start: value }))}
            onEndChange={(value) => setDateRange((prev) => ({ ...prev, end: value }))}
          />
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Voucher</label>
            <div className="w-full h-8 px-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 flex items-center gap-1 overflow-x-auto">
              {voucherTokens.length > 0 && (
                <button type="button" className="shrink-0 inline-flex items-center gap-1 px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-[10px]" onClick={() => removeLastToken(setVoucherTokens)} title={voucherTokens.join(', ')}>
                  <span>+{voucherTokens.length}</span><span>x</span>
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
                  if (e.key === 'Backspace' && voucherInput.length === 0 && voucherTokens.length > 0) removeLastToken(setVoucherTokens);
                }}
                placeholder="Yaz, Enter ile ekle"
                className="flex-1 min-w-[1.5rem] h-full bg-transparent outline-none text-slate-900 dark:text-slate-100 text-xs"
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Firma</label>
            <div className="w-full h-8 px-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 flex items-center gap-1 overflow-x-auto">
              {companyTokens.length > 0 && (
                <button type="button" className="shrink-0 inline-flex items-center gap-1 px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-[10px]" onClick={() => removeLastToken(setCompanyTokens)} title={companyTokens.join(', ')}>
                  <span>+{companyTokens.length}</span><span>x</span>
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
                  if (e.key === 'Backspace' && companyInput.length === 0 && companyTokens.length > 0) removeLastToken(setCompanyTokens);
                }}
                placeholder="Yaz, Enter ile ekle"
                className="flex-1 min-w-[1.5rem] h-full bg-transparent outline-none text-slate-900 dark:text-slate-100 text-xs"
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Acente</label>
            <div className="w-full h-8 px-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 flex items-center gap-1 overflow-x-auto">
              {agencyTokens.length > 0 && (
                <button type="button" className="shrink-0 inline-flex items-center gap-1 px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-[10px]" onClick={() => removeLastToken(setAgencyTokens)} title={agencyTokens.join(', ')}>
                  <span>+{agencyTokens.length}</span><span>x</span>
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
                  if (e.key === 'Backspace' && agencyInput.length === 0 && agencyTokens.length > 0) removeLastToken(setAgencyTokens);
                }}
                placeholder="Yaz, Enter ile ekle"
                className="flex-1 min-w-[1.5rem] h-full bg-transparent outline-none text-slate-900 dark:text-slate-100 text-xs"
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Otel</label>
            <div className="w-full h-8 px-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 flex items-center gap-1 overflow-x-auto">
              {hotelTokens.length > 0 && (
                <button type="button" className="shrink-0 inline-flex items-center gap-1 px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-[10px]" onClick={() => removeLastToken(setHotelTokens)} title={hotelTokens.join(', ')}>
                  <span>+{hotelTokens.length}</span><span>x</span>
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
                  if (e.key === 'Backspace' && hotelInput.length === 0 && hotelTokens.length > 0) removeLastToken(setHotelTokens);
                }}
                placeholder="Yaz, Enter ile ekle"
                className="flex-1 min-w-[1.5rem] h-full bg-transparent outline-none text-slate-900 dark:text-slate-100 text-xs"
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Kategori</label>
            <div className="w-full h-8 px-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 flex items-center gap-1 overflow-x-auto">
              {categoryTokens.length > 0 && (
                <button type="button" className="shrink-0 inline-flex items-center gap-1 px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-[10px]" onClick={() => removeLastToken(setCategoryTokens)} title={categoryTokens.join(', ')}>
                  <span>+{categoryTokens.length}</span><span>x</span>
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
                  if (e.key === 'Backspace' && categoryInput.length === 0 && categoryTokens.length > 0) removeLastToken(setCategoryTokens);
                }}
                placeholder="Yaz, Enter ile ekle"
                className="flex-1 min-w-[1.5rem] h-full bg-transparent outline-none text-slate-900 dark:text-slate-100 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selection Totals Badge */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl animate-in slide-in-from-top-2 duration-300">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Seçilen Kalemlerin Toplamı</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
              {Object.entries(
                selectedItems.reduce((acc, item) => {
                  const curr = item.currency || 'TRY';
                  acc[curr] = (acc[curr] || 0) + (item.balance || 0);
                  return acc;
                }, {} as Record<string, number>)
              ).map(([curr, total]) => (
                <p key={curr} className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">
                  {new Intl.NumberFormat('tr-TR', { 
                    style: 'currency', 
                    currency: (curr && curr.length === 3) ? curr : 'TRY' 
                  }).format(total as number)}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner compact />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-slate-100 flex-1 min-h-0 flex flex-col w-full relative">
          <InvoiceItemTable 
            items={filteredItems} 
            type="income" 
            onSelectItems={setSelectedItems} 
            selectedItems={selectedItems}
            enableInternalSearch={false}
          />
          <PaginationControls
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            preferenceKey="income_pending_page_size"
            compactRight
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
          
          
        </div>
      )}

      <InvoiceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedItems={selectedItems}
        type="income"
        onSuccess={() => {
          setSelectedItems([]);
          loadItems();
        }}
      />
      </div>
    </div>
  );
}
