'use client';

import { useState, useMemo } from 'react';

interface InvoiceItemTableProps {
  items: any[];
  type: 'income' | 'expense';
  onSelectItems: (selectedItems: any[]) => void;
  selectedItems: any[];
  enableInternalSearch?: boolean;
}

export default function InvoiceItemTable({ items, type, onSelectItems, selectedItems, enableInternalSearch = true }: InvoiceItemTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = enableInternalSearch ? items.filter(item => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    const catName   = (item.category_name || '').toLowerCase();
    const projTitle = (item.project?.title || '').toLowerCase();
    const projDesc  = (item.project?.description || '').toLowerCase();
    const compName  = (item.project?.company_name || '').toLowerCase();
    const lineDesc  = (item.description || '').toLowerCase();
    const voucher   = (item.project?.voucher_number || '').toLowerCase();
    const hotelName = (item.project?.hotel_name || '').toLowerCase();
    const dateStart = (item.project?.date_start || '').toLowerCase();
    const dateEnd   = (item.project?.date_end || '').toLowerCase();
    return catName.includes(s) || projTitle.includes(s) || projDesc.includes(s) ||
           compName.includes(s) || lineDesc.includes(s) || voucher.includes(s) ||
           hotelName.includes(s) || dateStart.includes(s) || dateEnd.includes(s);
  }) : items;

  // GRUPLAMA MANTIĞI
  const displayRows = useMemo(() => {
    if (type === 'income') {
      // GELİR FATURALARI: PROJE bazlı grupla (Sadece toplamlar görünür)
      const groups: Record<string, any> = {};
      
      filteredItems.forEach(item => {
        const projectId = item.project?.id || item.sejour_id || 'no-project';
        const groupId = `${projectId}`;
        
        if (!groups[groupId]) {
          groups[groupId] = {
            id: groupId,
            isGroup: true,
            project: item.project,
            category_name: item.project?.quote_type === 'SEJOUR' ? 'SEJOUR TOPLAM' : 'PROJE TOPLAM',
            description: 'Tüm hizmet kalemleri dahildir',
            total_price: 0,
            invoiced_amount: 0,
            balance: 0,
            currency: item.currency || 'TRY',
            items: []
          };
        }
        
        groups[groupId].total_price += Number(item.total_price || 0);
        groups[groupId].invoiced_amount += Number(item.invoiced_amount || 0);
        groups[groupId].balance += Number(item.balance || 0);
        groups[groupId].items.push(item);
      });
      
      return Object.values(groups);
    } else {
      // GİDER FATURALARI: Hizmet hizmet ayrı (Gruplama yok)
      return filteredItems.map(item => ({
        ...item,
        id: item.id,
        isGroup: false,
        items: [item] // Tekli kalem olarak sar (seçim mantığı için)
      }));
    }
  }, [filteredItems, type]);

  const toggleRow = (row: any) => {
    const rowItemIds = row.items.map((i: any) => i.id);
    const selectedInCategory = selectedItems.filter(si => rowItemIds.includes(si.id));
    
    if (selectedInCategory.length === row.items.length) {
      // Tamamı seçiliyse çıkar
      onSelectItems(selectedItems.filter(si => !rowItemIds.includes(si.id)));
    } else {
      // Bir kısmı seçiliyse veya hiçbiri seçili değilse tamamını ekle
      const otherSelected = selectedItems.filter(si => !rowItemIds.includes(si.id));
      onSelectItems([...otherSelected, ...row.items]);
    }
  };

  const isRowSelected = (row: any) => {
    if (row.items.length === 0) return false;
    const rowItemIds = row.items.map((i: any) => i.id);
    const selectedCount = selectedItems.filter(si => rowItemIds.includes(si.id)).length;
    return selectedCount === row.items.length;
  };

  const isRowPartial = (row: any) => {
    if (!row.isGroup) return false;
    const rowItemIds = row.items.map((i: any) => i.id);
    const selectedCount = selectedItems.filter(si => rowItemIds.includes(si.id)).length;
    return selectedCount > 0 && selectedCount < row.items.length;
  };

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency || 'TRY' }).format(amount || 0);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const themedPanelStyle = {
    backgroundColor: 'var(--theme-card-bg, #0f172a)',
    color: 'var(--theme-text-color, #e5e7eb)',
    borderColor: 'var(--theme-sidebar-border, rgba(148,163,184,0.35))'
  } as const;

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0 relative w-full">
      <div className="flex justify-between items-center gap-3">
        {enableInternalSearch ? (
          <input
            type="text"
            placeholder="Ara (Voucher, Firma, Otel, Tarih, Proje...)"
            className="px-4 py-2 border rounded-lg w-full max-w-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        ) : (
          <div />
        )}
        <div className="text-sm text-gray-500 whitespace-nowrap">
          <span className="font-bold text-blue-600 dark:text-blue-400">{selectedItems.length}</span> kalem seçili
        </div>
      </div>

      <div
        className="overflow-auto rounded-xl border flex-1 min-h-0 w-full"
        style={themedPanelStyle}
      >
        <table className="min-w-[900px] divide-y divide-gray-200 dark:divide-gray-700 text-sm relative">
          <thead className="bg-slate-100/80 dark:bg-slate-800/70 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
                  checked={displayRows.length > 0 && displayRows.every(r => isRowSelected(r))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const allItems = displayRows.flatMap(r => r.items);
                      onSelectItems(allItems);
                    } else {
                      onSelectItems([]);
                    }
                  }}
                />
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hizmet / Kategori</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tarih Aralığı</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Firma / Tedarikçi & Proje</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Toplam</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Faturalanan</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Bakiye</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">DVZ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {displayRows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  {enableInternalSearch && searchTerm ? 'Arama sonucu bulunamadı.' : 'Bekleyen fatura kaydı yok.'}
                </td>
              </tr>
            )}
            {displayRows.map((row: any) => {
              const item = row.isGroup ? row : row.items[0];
              const isSejour = item.project?.quote_type === 'SEJOUR';
              const isMice   = !!item.project && !isSejour;
              const badge    = isSejour ? 'SEJOUR' : (isMice ? 'MICE' : 'PROJE');
              const badgeCls = isSejour
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                : (isMice
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300');

              // Firma gösterimi: MICE faturalarında firma adı, SEJOUR faturalarında otel adı
              const companyDisplay = item.project?.company_name || '-';
              const hotelDisplay = item.project?.hotel_name || '';
              const codeDisplay = isSejour
                ? (item.project?.voucher_number || item.project?.title || '')
                : (item.project?.title || '');
              const subDisplay = item.project?.description || '';

              const dateStart = item.project?.date_start || null;
              const dateEnd   = item.project?.date_end   || null;

              const selected = isRowSelected(row);
              const partial = isRowPartial(row);

              return (
                <tr
                  key={row.id}
                  className={`transition-colors cursor-pointer ${
                    selected
                      ? 'bg-blue-50/70 dark:bg-blue-900/20'
                      : partial
                        ? 'bg-orange-50/30 dark:bg-orange-900/10'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                  }`}
                  onClick={() => toggleRow(row)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        className={`rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 cursor-pointer ${partial ? 'opacity-50' : ''}`}
                        checked={selected}
                        onChange={() => toggleRow(row)}
                      />
                      {partial && (
                        <div className="absolute w-2 h-2 bg-blue-500 rounded-full pointer-events-none" />
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 min-w-[160px]">
                    <div className="flex gap-1.5 items-center mb-0.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${badgeCls}`}>
                        {badge}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white truncate text-[11px]">
                        {item.category_name}
                        {item.sub_category_name && <span className="text-gray-400 font-normal ml-1">({item.sub_category_name})</span>}
                      </span>
                    </div>
                    {row.isGroup ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400 pl-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                        {row.description} ({row.items.length} Kalem)
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-400 pl-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                        {item.description}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 min-w-[110px]">
                    {(dateStart || dateEnd) ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                        {formatDate(dateStart)} → {formatDate(dateEnd)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>

                  <td className="px-4 py-3 min-w-[220px]">
                    {/* MICE: firma adı, SEJOUR: otel adı */}
                    <div className="font-medium text-blue-600 dark:text-blue-400 truncate text-[11px]">
                      {isSejour ? (hotelDisplay || companyDisplay) : companyDisplay}
                    </div>
                    {/* Voucher + C-in / C-out */}
                    {codeDisplay && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                          {codeDisplay}
                        </span>
                      </div>
                    )}
                    {subDisplay && (
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                        {subDisplay}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap text-[11px]">
                    {formatCurrency(item.total_price || 0, item.currency)}
                  </td>

                  <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 whitespace-nowrap text-[11px]">
                    {formatCurrency(item.invoiced_amount || 0, item.currency)}
                  </td>

                  <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white whitespace-nowrap text-[11px]">
                    {formatCurrency(item.balance || 0, item.currency)}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {item.currency || 'TRY'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
