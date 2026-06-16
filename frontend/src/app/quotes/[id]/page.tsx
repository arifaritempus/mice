'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { quotesService, quoteItemsService, agenciesService, hotelsService, categoriesService, publicLinksService } from '@/lib/supabaseService';
import { getLogosForExcel } from '@/utils/logoUtils';
import { toast } from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';
import { usePermissions, Module } from '@/lib/permissions';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import { supabase } from '@/lib/supabase';
import { ScrollText } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

interface Agency { id: string; name: string; company_name: string; }
interface Hotel { id: string; name: string; concept: string; }
interface Category { id: string; name: string; parent_id?: string; }

interface ServiceItem {
  id: string;
  main_category?: string;
  sub_category?: string;
  unit_quantity: number;
  sefer: number;
  unit_price: number;
  currency: string;
  total: number;
  total_try?: number;
  description?: string;
  vat?: number;
  fx?: number;
  isEditing?: boolean;
  hotel_id?: string;
}

import QuoteServiceEditor from '@/components/QuoteServiceEditor';

export default function QuoteViewPage() {
  const formatTr = (n: number) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  const params = useParams();
  const quoteId = params.id as string;
  const { canView, loading: permissionsLoading } = usePermissions();

  const [quote, setQuote] = useState<any | null>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkPassword, setLinkPassword] = useState('');
  const [linkExpiryDate, setLinkExpiryDate] = useState('');
  const [linkIsActive, setLinkIsActive] = useState(true);
  const [generatedLink, setGeneratedLink] = useState('');
  const [quoteLinks, setQuoteLinks] = useState<any[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const [activeViewHotelId, setActiveViewHotelId] = useState<string>('');
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  
  // Logs state
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logsData, setLogsData] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearchTerm, setLogSearchTerm] = useState('');
  // Dummy state required by QuoteServiceEditor (read-only in view mode)
  const [showAddRow] = useState(false);
  const [newServiceItem, setNewServiceItem] = useState<ServiceItem>({
    id: '', main_category: '', sub_category: '', unit_quantity: 1,
    sefer: 1, unit_price: 0, currency: 'EUR', total: 0, total_try: 0,
    description: '', vat: 0, fx: 1, isEditing: false
  });



  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [q, agList, htList, catList] = await Promise.all([
          quotesService.getById(quoteId),
          agenciesService.getAll(),
          hotelsService.getAll(),
          categoriesService.getAll()
        ]);

        if (q) {
          setQuote(q);
          const hData = (q as any).hotels_data || [];
          // Default to first hotel tab (same as create/edit page)
          if (hData.length > 0) {
            setActiveViewHotelId(hData[0].id);
          } else {
            setActiveViewHotelId('general');
          }
          const TAB_TAG_REGEX = /\[T:([^\]]+)\]$/;
          const items = await quoteItemsService.getByQuoteId(q.id);
          const fixedItems = (items || []).map((item: any) => {
            let uiHotelId = item.hotel_id;
            let cleanDescription = item.description || '';
            
            // Önce açıklamadan gizli Tab ID'sini ayıkla
            const match = cleanDescription.match(TAB_TAG_REGEX);
            if (match) {
              uiHotelId = match[1];
              cleanDescription = cleanDescription.replace(TAB_TAG_REGEX, '').trim();
            } else if (item.hotel_id && hData.length > 0) {
              // Geriye dönük uyumluluk için eski eşleme
              const matched = hData.find((h: any) => h.hotel_id === item.hotel_id || h.id === item.hotel_id);
              if (matched) uiHotelId = matched.id;
            }
            
            return { 
              ...item, 
              hotel_id: uiHotelId || 'general',
              description: cleanDescription
            } as ServiceItem;
          });
          setServiceItems(fixedItems);
        }
        setAgencies(agList as any || []);
        setHotels(htList as any || []);
        setCategories(catList as any || []);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    loadQuoteLinks();
  }, [quoteId]);

  const loadQuoteLinks = async () => {
    try {
      const links = await publicLinksService.getByQuoteId(quoteId);
      setQuoteLinks(links || []);
    } catch { setQuoteLinks([]); }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const itemIds = serviceItems.map((item: any) => item.id).filter(Boolean);
      const entityIds = [quoteId, ...itemIds];
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .in('entity_id', entityIds)
        .order('occurred_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogsData(data || []);
    } catch (err) {
      console.error('Loglar yüklenirken hata:', err);
      toast.error('Log kayıtları alınamadı.');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Link durumunu değiştir (aktif/pasif)
  const handleToggleLinkStatus = async (linkId: string) => {
    try {
      const link = quoteLinks.find(l => l.id === linkId);
      if (!link) return;

      await publicLinksService.update(link.id, { is_active: !link.is_active });
      await loadQuoteLinks();
      toast.success('Link durumu güncellendi!');
    } catch (error) {
      console.error('Link durumu güncelleme hatası:', error);
      toast.error('Link durumu güncellenirken bir hata oluştu.');
    }
  };

  // Linki sil
  const handleDeleteLink = async (linkId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Linki Sil',
      message: 'Bu linki silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      onConfirm: async () => {
        try {
          await publicLinksService.delete(linkId);
          await loadQuoteLinks();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          toast.success('Link başarıyla silindi!');
        } catch (error) {
          console.error('Link silme hatası:', error);
          toast.error('Link silinirken bir hata oluştu.');
        }
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyLinkFromList = (link: any) => {
    const fullLink = `${window.location.origin}/quotes/view/${link.quote_id || quoteId}?token=${link.token}`;
    navigator.clipboard.writeText(fullLink).then(() => {
      toast.success('Link kopyalandı!', {
        position: 'bottom-right',
        style: {
          borderRadius: '12px',
          background: '#232f38',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 'bold',
          padding: '12px 20px',
        },
      });
    });
  };

  const getAgencyName = (id: string) => agencies.find(a => a.id === id)?.name || '-';
  const getHotelName = (id: string) => hotels.find(h => h.id === id)?.name || '-';
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || id || '-';

  const getStatusColor = (status: string) => {
    if (status === 'TEKLİF') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    if (status === 'KONFİRME') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (status === 'İPTAL') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    return 'bg-gray-100 text-gray-800';
  };

  const handleCreateLink = async () => {
    if (!quote) return;
    try {
      const token = Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('');
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/quotes/view/${quoteId}?token=${token}`;
      setGeneratedLink(link);

      await publicLinksService.create({
        link_type: 'quote',
        quote_id: quoteId,
        token,
        password: linkPassword || Math.random().toString(36).slice(-8),
        expiry_date: linkExpiryDate ? new Date(linkExpiryDate).toISOString() : undefined,
        is_active: linkIsActive
      } as any);
      await loadQuoteLinks();
    } catch (err) { console.error(err); alert('Link oluşturulurken hata!'); }
  };

  const handleExportExcel = async () => {
    if (!quote) return;
    setExporting(true);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const { iconLogoBase64, wordmarkLogoBase64 } = await getLogosForExcel(true);
      const inchToPx = (inch: number) => Math.round(inch * 96);
      const guessExt = (d: string): 'png' | 'jpeg' => (d || '').includes('image/png') ? 'png' : 'jpeg';

      const hotelsData = quote?.hotels_data || [];

      // Helper to add a sheet for a specific set of items and hotel info
      const addSheetForHotel = (sheetName: string, h: any, items: ServiceItem[]) => {
        if (items.length === 0 && sheetName !== 'GENEL HİZMETLER') return;

        const sheet = workbook.addWorksheet(sheetName.substring(0, 31)); // Excel sheet name limit is 31
        sheet.pageSetup = { 
          orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, 
          horizontalCentered: true, paperSize: 9, 
          margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 } 
        } as any;

        const topBandRow = sheet.addRow([]);
        topBandRow.height = 70;
        sheet.mergeCells('A1:H1');
        for (let c = 1; c <= 8; c++) {
          sheet.getRow(1).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232F38' } };
        }
        if (iconLogoBase64) sheet.addImage(workbook.addImage({ base64: iconLogoBase64, extension: guessExt(iconLogoBase64) }), { tl: { col: 0.15, row: 0.15 }, ext: { width: inchToPx(1.25), height: inchToPx(0.70) } });
        if (wordmarkLogoBase64) sheet.addImage(workbook.addImage({ base64: wordmarkLogoBase64, extension: guessExt(wordmarkLogoBase64) }), { tl: { col: 7.90, row: 0.23 }, ext: { width: inchToPx(2.4), height: inchToPx(0.55) } });

        const isGeneral = sheetName === 'GENEL HİZMETLER';
        const headerInfo = [
          ['REFERANS', quote.reference, 'ODA | PAX', isGeneral ? '-' : `${h.room_count || 0} | ${h.pax_count || 0}`],
          ['ACENTE | FİRMA', `${getAgencyName(quote.agency_id)} | ${quote.company_name}`, 'KONSEPT', isGeneral ? '-' : (h.hotel_concept || '')],
          ['C/IN - C/OUT', !isGeneral && h.check_in_date ? `${new Date(h.check_in_date).toLocaleDateString('tr-TR')} - ${new Date(h.check_out_date).toLocaleDateString('tr-TR')}` : '-', 'OPSİYON', isGeneral ? '-' : (h.option || '')],
          ['OTEL', isGeneral ? 'GENEL HİZMETLER' : getHotelName(h.hotel_id), 'DURUM', isGeneral ? quote.status : (h.hotel_status || quote.status || '')],
          ['TEKLİF TÜRÜ', quote.quote_type || 'BİRİM', 'NOT', quote.notes?.split('\n')[0] || '']
        ];

        let rowIndex = 2;
        headerInfo.forEach(([lLabel, lVal, rLabel, rVal]) => {
          const rowValues: any[] = new Array(8);
          rowValues[0] = lLabel; rowValues[1] = lVal; rowValues[5] = rLabel; rowValues[6] = rVal;
          const row = sheet.addRow(rowValues);
          row.height = 24;
          row.getCell(1).font = { bold: true, size: 12 }; row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
          row.getCell(2).font = { size: 12 }; row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
          row.getCell(6).font = { bold: true, size: 12 }; row.getCell(6).alignment = { horizontal: 'left', vertical: 'middle' };
          row.getCell(7).font = { size: 12 }; row.getCell(7).alignment = { horizontal: 'left', vertical: 'middle' };
          sheet.mergeCells(`G${rowIndex}:H${rowIndex}`);
          for (let c = 1; c <= 8; c++) row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3CBBE' } };
          rowIndex++;
        });

        // Title
        sheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
        const titleCell = sheet.getCell(`A${rowIndex}`);
        titleCell.value = 'SATIŞLAR';
        titleCell.font = { size: 20, bold: true };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(rowIndex).height = 35;
        for (let c = 1; c <= 8; c++) sheet.getRow(rowIndex).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        rowIndex++;

        // Group items
        const grouped: Record<string, ServiceItem[]> = {};
        items.forEach(item => {
          const key = getCategoryName(item.main_category || '') || 'Diğer';
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(item);
        });

        const subtotalRowsE: number[] = [];
        const subtotalRowsG: number[] = [];

        Object.entries(grouped).forEach(([mainCat, catItems], i) => {
          const catRow = sheet.addRow([`${i + 1}. ${mainCat}`]);
          catRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
          for (let c = 1; c <= 8; c++) catRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF666666' } };
          catRow.height = 25;
          sheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
          rowIndex++;

          const hRow = sheet.addRow(['DETAY/AÇIKLAMA', 'BİRİM/ADET', 'SEFER/TEKRAR', 'BİRİM/FİYAT', 'TOPLAM EUR', 'KUR', 'TOPLAM TL', 'AÇIKLAMA']);
          hRow.font = { bold: true, size: 11 };
          hRow.height = 22;
          for (let c = 1; c <= 8; c++) hRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
          rowIndex++;

          let firstItemRow: number | null = null;
          catItems.forEach(item => {
            const sRow = sheet.addRow([getCategoryName(item.sub_category || ''), item.unit_quantity, item.sefer, item.unit_price || 0, 0, item.fx || 0, 0, item.description || '']);
            if (!firstItemRow) firstItemRow = sRow.number;
            const r = sRow.number;
            sRow.getCell(4).numFmt = '€ #,##0.00'; sRow.getCell(5).numFmt = '€ #,##0.00';
            sRow.getCell(6).numFmt = '₺#,##0.00'; sRow.getCell(7).numFmt = '₺#,##0.00';
            sRow.getCell(5).value = { formula: `B${r}*C${r}*D${r}`, result: item.total ?? 0 } as any;
            sRow.getCell(7).value = { formula: `E${r}*F${r}`, result: item.total_try ?? 0 } as any;
            sRow.height = 18;
            rowIndex++;
          });

          const lastItemRow = rowIndex - 1;
          const araRow = sheet.addRow(['ARA TOPLAM', '', '', '', 0, '', 0, '']);
          araRow.font = { bold: true, size: 12 };
          for (let c = 1; c <= 8; c++) araRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD0D0D0' } };
          if (firstItemRow) {
            araRow.getCell(5).value = { formula: `SUM(E${firstItemRow}:E${lastItemRow})`, result: catItems.reduce((s, i) => s + (i.total || 0), 0) } as any;
            araRow.getCell(7).value = { formula: `SUM(G${firstItemRow}:G${lastItemRow})`, result: catItems.reduce((s, i) => s + (i.total_try || 0), 0) } as any;
          }
          araRow.getCell(5).numFmt = '€ #,##0.00'; araRow.getCell(7).numFmt = '₺#,##0.00';
          araRow.height = 22;
          subtotalRowsE.push(araRow.number); subtotalRowsG.push(araRow.number);
          rowIndex++;
          sheet.addRow([]); rowIndex++;
        });

        const totalRow = sheet.addRow(['SATIŞ GENEL TOPLAMLAR', '', '', '', 0, '', 0, '']);
        totalRow.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
        for (let c = 1; c <= 8; c++) totalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } };
        if (subtotalRowsE.length > 0) {
          totalRow.getCell(5).value = { formula: `SUM(${subtotalRowsE.map(r => `E${r}`).join(',')})`, result: items.reduce((s, i) => s + (i.total || 0), 0) } as any;
          totalRow.getCell(7).value = { formula: `SUM(${subtotalRowsG.map(r => `G${r}`).join(',')})`, result: items.reduce((s, i) => s + (i.total_try || 0), 0) } as any;
        }
        totalRow.getCell(5).numFmt = '€ #,##0.00'; totalRow.getCell(7).numFmt = '₺#,##0.00';
        totalRow.height = 30;

        // Restore missing formatting: column widths and grid lines
        sheet.columns = [
          { width: 45 }, { width: 12 }, { width: 12 }, { width: 15 }, 
          { width: 18 }, { width: 10 }, { width: 18 }, { width: 45 }
        ];
        sheet.views = [{ state: 'normal', showGridLines: false }];
      };

      // Add sheet for each hotel
      hotelsData.forEach((h: any, idx: number) => {
        const hItems = serviceItems.filter(item => item.hotel_id === h.id);
        const hotelName = getHotelName(h.hotel_id);
        const namePrefix = `${idx + 1}. ${hotelName || 'OTEL'}`;
        addSheetForHotel(namePrefix, h, hItems);
      });

      // Add "GENEL HİZMETLER" sheet if there are items without hotel_id
      const generalItems = serviceItems.filter(item => !item.hotel_id || item.hotel_id === 'general');
      if (generalItems.length > 0) {
        addSheetForHotel('GENEL HİZMETLER', {}, generalItems);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Teklif_${quote.reference}_Report.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Excel export hatası!');
    } finally {
      setExporting(false);
    }
  };

  const filteredItems = serviceItems.filter(item =>
    activeViewHotelId === 'general'
      ? (!item.hotel_id || item.hotel_id === 'general')
      : item.hotel_id === activeViewHotelId
  );

  const hotelsData: any[] = (quote as any)?.hotels_data || [];

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.QUOTES)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Teklif detaylarını görmek için yetkiniz bulunmuyor.</p>
          <Link href="/quotes" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Teklif Listesine Dön
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-200">
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Teklif bulunamadı.</p>
          <Link href="/quotes" className="bg-blue-600 text-white px-4 py-2 rounded text-sm">Listeye Dön</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black dark:text-white uppercase tracking-tight">Public Teklif Link Yönetimi</h2>
                <p className="text-sm text-gray-500 font-medium">Müşterileriniz için şifre korumalı ve güvenli teklif linkleri oluşturun.</p>
              </div>
              <button 
                onClick={() => { setShowLinkModal(false); setGeneratedLink(''); }} 
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-gray-100 dark:bg-gray-700 rounded-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Existing links */}
            {quoteLinks.length > 0 && (
              <div className="mb-10 space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">MEVCUT LİNKLER & ONAY GEÇMİŞİ</h3>
                <div className="space-y-4 pr-2">
                  {quoteLinks.map((link: any, idx: number) => {
                    const fullLink = `${window.location.origin}/quotes/view/${link.quote_id || quoteId}?token=${link.token}`;
                    const isExpired = link.expiry_date ? new Date(link.expiry_date) < new Date() : false;
                    const approval = link.approval;
                    const isApproved = approval?.is_approved;

                    return (
                      <div key={link.id || idx} className={`group rounded-3xl border-2 transition-all duration-300 ${isApproved ? 'bg-green-50/30 border-green-100 dark:bg-green-900/5 dark:border-green-900/20' : link.is_active && !isExpired ? 'bg-white dark:bg-gray-800 border-slate-100 dark:border-slate-700 shadow-sm' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-600 opacity-70'}`}>
                        <div className="p-5">
                          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                            <div className="flex-1 min-w-[280px]">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${isApproved ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : link.is_active && !isExpired ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-400'}`}>
                                  {isApproved ? 'ONAYLANDI' : link.is_active && !isExpired ? 'Aktif' : isExpired ? 'Süresi Dolmuş' : 'Pasif'}
                                </span>
                                <span className="text-[10px] text-gray-400 font-bold bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-lg">
                                  #{(link.id || '').substring(0, 8)}
                                </span>
                                <span className="text-[10px] text-gray-500 font-medium ml-2">
                                  {new Date(link.created_at).toLocaleDateString('tr-TR')} {new Date(link.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 group/link cursor-pointer" onClick={() => handleCopyLinkFromList(link)}>
                                <p className="text-sm font-mono text-gray-500 dark:text-gray-400 truncate max-w-[400px] hover:text-blue-500 transition-colors">{fullLink}</p>
                                <svg className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover/link:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleToggleLinkStatus(link.id || link.token); }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-tight ${link.is_active ? 'bg-orange-50 border-orange-100 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/10 dark:border-orange-900/20' : 'bg-green-50 border-green-100 text-green-600 hover:bg-green-100 dark:bg-green-900/10 dark:border-green-900/20'}`}
                              >
                                {link.is_active ? (
                                  <>PASİF ET</>
                                ) : (
                                  <>AKTİF ET</>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-dashed border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-8">
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GÜVENLİK ŞİFRESİ</p>
                                <div className="flex items-center gap-2 group/pass" onClick={() => togglePasswordVisibility(link.id || link.token)}>
                                  <span className="text-xs font-black dark:text-gray-300 font-mono tracking-wider cursor-pointer">
                                    {visiblePasswords[link.id || link.token] ? link.password : '••••••••'}
                                  </span>
                                  <button className="text-slate-300 hover:text-blue-500 transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                  </button>
                                </div>
                              </div>
                              {link.expiry_date && (
                                <div className="space-y-1 border-l border-slate-100 dark:border-slate-700 pl-8">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SON GEÇERLİLİK</p>
                                  <p className="text-xs font-bold dark:text-gray-400">{new Date(link.expiry_date).toLocaleDateString('tr-TR')}</p>
                                </div>
                              )}
                            </div>

                            {isApproved ? (
                              <div className="bg-green-100/50 dark:bg-green-900/10 p-4 rounded-2xl border border-green-200 dark:border-green-900/30">
                                <div className="flex items-start gap-3">
                                  <div className="p-1.5 bg-green-500 rounded-lg text-white">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-[10px] font-black text-green-800 dark:text-green-400 uppercase tracking-widest mb-1.5">MUTABAKAT ONAY BİLGİSİ</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                      <div>
                                        <p className="text-[9px] text-green-700/60 dark:text-green-500/60 font-bold uppercase">ONAYLAYAN</p>
                                        <p className="text-[11px] font-black text-green-900 dark:text-green-300">{approval.name} {approval.surname}</p>
                                      </div>
                                      <div>
                                        <p className="text-[9px] text-green-700/60 dark:text-green-500/60 font-bold uppercase">E-POSTA</p>
                                        <p className="text-[11px] font-black text-green-900 dark:text-green-300">{approval.email}</p>
                                      </div>
                                      <div>
                                        <p className="text-[9px] text-green-700/60 dark:text-green-500/60 font-bold uppercase">IP ADRESİ</p>
                                        <p className="text-[11px] font-mono font-bold text-green-800 dark:text-green-400">{approval.ip_address}</p>
                                      </div>
                                      <div>
                                        <p className="text-[9px] text-green-700/60 dark:text-green-500/60 font-bold uppercase">LOKASYON</p>
                                        <p className="text-[11px] font-bold text-green-800 dark:text-green-400">
                                          {approval.geo_location ? `${approval.geo_location.city}, ${approval.geo_location.country}` : 'N/A'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">HAKİKATEN BEKLENİYOR...</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-5">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">YENİ LİNK OLUŞTUR</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Şifre (opsiyonel)</label>
                  <input 
                    type="text" 
                    value={linkPassword} 
                    onChange={e => setLinkPassword(e.target.value)} 
                    placeholder="Otomatik oluşturulur..."
                    className="w-full h-10 px-3 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Geçerlilik Tarihi</label>
                  <input 
                    type="date" 
                    value={linkExpiryDate} 
                    onChange={e => setLinkExpiryDate(e.target.value)} 
                    min={new Date().toISOString().split('T')[0]} 
                    className="w-full h-10 px-3 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs dark:text-gray-300 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={linkIsActive} 
                    onChange={e => setLinkIsActive(e.target.checked)} 
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                  />
                  <span className="font-bold text-gray-700 dark:text-gray-300">Link Aktif Olsun</span>
                </label>
                
                <button 
                  onClick={handleCreateLink} 
                  className="px-6 py-2.5 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                >
                  Link Oluştur
                </button>
              </div>

              {generatedLink && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
                  <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">OLUŞTURULAN LİNK</p>
                  <div className="flex items-center gap-2">
                    <p className="flex-1 text-xs break-all dark:text-gray-300 font-mono bg-white/50 dark:bg-black/20 p-2 rounded border border-green-200 dark:border-green-800">
                      {generatedLink}
                    </p>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigator.clipboard.writeText(generatedLink).then(() => toast.success('Link kopyalandı!'));
                      }} 
                      className="p-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                      title="Linki Kopyala"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 compact">
        <div className="p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Teklif Detayı</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-0.5 text-xs">Referans: {quote.reference}</p>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setShowLinkModal(true)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                Link
              </button>
              <button onClick={handleExportExcel} disabled={exporting} className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {exporting ? 'İşleniyor...' : 'Excel'}
              </button>
              <button 
                onClick={() => {
                  setShowLogsModal(true);
                  fetchLogs();
                }}
                className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 transition-colors flex items-center"
                title="Log Kayıtları"
              >
                <ScrollText size={12} className="mr-1" />
                Loglar
              </button>
              <Link href={`/quotes/${quote.id}/edit`} className="bg-indigo-600 text-white px-2 py-1 rounded text-xs hover:bg-indigo-700 transition-colors">Düzenle</Link>
              <Link href="/quotes" className="bg-gray-500 dark:bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors">Geri Dön</Link>
            </div>
          </div>

          <div className="space-y-4">
            {/* Teklif Bilgileri */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Teklif Bilgileri</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">REFERANS</label>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{quote.reference}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ACENTE | FİRMA</label>
                  <p className="text-xs text-gray-900 dark:text-white">{getAgencyName(quote.agency_id)} | {quote.company_name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">DURUM</label>
                  <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(quote.status)}`}>{quote.status}</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">TEKLİF TÜRÜ</label>
                  <p className="text-xs text-gray-900 dark:text-white">{quote.quote_type || 'BİRİM'}</p>
                </div>
              </div>

              {quote.notes && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">NOTLAR</label>
                  <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line">{quote.notes}</p>
                </div>
              )}
            </div>



            {/* Hizmet Kalemleri */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Hizmet Kalemleri</h2>

              {/* Hotel filter tabs – same style as create/edit page */}
              <div className="flex bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-lg border border-gray-100 dark:border-gray-700 space-x-2 overflow-x-auto mb-4">
                {hotelsData.map((h: any, index: number) => (
                  <div
                    key={h.id}
                    onClick={() => setActiveViewHotelId(h.id)}
                    className={`flex items-center px-4 py-2 rounded-md cursor-pointer transition-all duration-200 whitespace-nowrap group ${
                      activeViewHotelId === h.id
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-xs font-semibold mr-2">{index + 1}. OTEL</span>
                    <span className="text-[10px] opacity-80 max-w-[100px] truncate">
                      {getHotelName(h.hotel_id) !== '-' ? getHotelName(h.hotel_id) : 'Otel'}
                    </span>
                  </div>
                ))}
                <div
                  onClick={() => setActiveViewHotelId('general')}
                  className={`flex items-center px-4 py-2 rounded-md cursor-pointer transition-all duration-200 whitespace-nowrap ${
                    activeViewHotelId === 'general'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xs font-semibold">GENEL HİZMETLER</span>
                </div>
              </div>

              {/* Active Hotel Info Panel (Read-only version of Create/Edit layout) */}
              {activeViewHotelId && activeViewHotelId !== 'general' && (() => {
                const currentHotel = hotelsData.find((h: any) => h.id === activeViewHotelId);
                if (!currentHotel) return null;
                return (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-blue-500/30 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-4">
                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Otel</label>
                        <div className="w-full px-2 py-2 h-10 flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-semibold dark:text-white">
                          {getHotelName(currentHotel.hotel_id)}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Otel Konsepti</label>
                        <div className="w-full px-2 py-2 h-10 flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs dark:text-white">
                          {currentHotel.hotel_concept || '-'}
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">C/IN Tarihi</label>
                        <div className="w-full px-2 py-2 h-10 flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs dark:text-white">
                          {currentHotel.check_in_date ? new Date(currentHotel.check_in_date).toLocaleDateString('tr-TR') : '-'}
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">C/OUT Tarihi</label>
                        <div className="w-full px-2 py-2 h-10 flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs dark:text-white">
                          {currentHotel.check_out_date ? new Date(currentHotel.check_out_date).toLocaleDateString('tr-TR') : '-'}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border-t border-gray-200 dark:border-gray-700/50 pt-3">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Oda Sayısı</label>
                        <div className="w-full px-2 py-2 h-10 flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs dark:text-white">
                          {currentHotel.room_count || 0}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Pax Sayısı</label>
                        <div className="w-full px-2 py-2 h-10 flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs dark:text-white">
                          {currentHotel.pax_count || 0}
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Opsiyon</label>
                        <div className="w-full px-2 py-2 h-10 flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs dark:text-white">
                          {currentHotel.option || '-'}
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Opsiyon Tarihi</label>
                        <div className="w-full px-2 py-2 h-10 flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs dark:text-white">
                          {currentHotel.option_date ? new Date(currentHotel.option_date).toLocaleDateString('tr-TR') : '-'}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Durum</label>
                        <div className="w-full px-2 py-2 h-10 flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-bold dark:text-white">
                          <span className={
                            (currentHotel.hotel_status || (currentHotel.is_confirmed ? 'KONFİRME' : 'BEKLEMEDE')) === 'KONFİRME' 
                              ? 'text-green-600 dark:text-green-400' 
                              : (currentHotel.hotel_status || (currentHotel.is_confirmed ? 'KONFİRME' : 'BEKLEMEDE')) === 'İPTAL' 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-orange-600 dark:text-orange-400'
                          }>
                            {currentHotel.hotel_status || (currentHotel.is_confirmed ? 'KONFİRME' : 'BEKLEMEDE')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <QuoteServiceEditor
                items={filteredItems}
                onAdd={() => {}}
                onEdit={() => {}}
                onSave={() => {}}
                onDelete={() => {}}
                hotels={hotelsData}
                categories={categories}
                hotelId={activeViewHotelId}
                showAddRow={showAddRow}
                setShowAddRow={() => {}}
                newItem={newServiceItem}
                setNewItem={setNewServiceItem}
              />
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
      />

      {/* Logs Modal */}
      <Modal isOpen={showLogsModal} onClose={() => setShowLogsModal(false)} title="Teklif Log Kayıtları" maxWidth="max-w-4xl">
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg max-h-[70vh] flex flex-col">
          <div className="mb-4">
            <input
              type="text"
              placeholder="İşlem tipi, kullanıcı veya değer içinde ara..."
              value={logSearchTerm}
              onChange={(e) => setLogSearchTerm(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loadingLogs ? (
              <div className="flex justify-center p-8"><LoadingSpinner message="Loglar yükleniyor..." /></div>
            ) : logsData.length === 0 ? (
              <div className="text-center text-gray-500 py-8">Bu teklife ait log kaydı bulunamadı.</div>
            ) : (
              <div className="space-y-4">
                {logsData.filter(log => {
                  if (!logSearchTerm) return true;
                  const search = logSearchTerm.toLowerCase();
                  const actionStr = (log.action || '').toLowerCase();
                  const userStr = (log.user_name || log.user_id || '').toLowerCase();
                  const moduleStr = (log.module || '').toLowerCase();
                  const beforeStr = log.before_data ? JSON.stringify(log.before_data).toLowerCase() : '';
                  const afterStr = log.after_data ? JSON.stringify(log.after_data).toLowerCase() : '';
                  
                  return actionStr.includes(search) || userStr.includes(search) || moduleStr.includes(search) || beforeStr.includes(search) || afterStr.includes(search);
                }).map((log) => (
                  <div key={log.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 text-xs">
                    <div className="flex justify-between items-start mb-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          log.action === 'INSERT' ? 'bg-green-100 text-green-700' :
                          log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                          log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {log.action}
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {log.user_name || log.user_id || 'Sistem / Anonim'}
                        </span>
                        <span className="text-gray-400 text-[10px]">({log.module})</span>
                      </div>
                      <div className="text-gray-500 font-medium">
                        {formatDate(log.occurred_at)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {log.before_data && Object.keys(log.before_data).length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/10 p-2 rounded">
                          <p className="font-bold text-red-800 dark:text-red-300 mb-1 border-b border-red-100 dark:border-red-900/30 pb-1">Önceki Değerler</p>
                          <pre className="text-[10px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-48">
                            {JSON.stringify(log.before_data, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.after_data && Object.keys(log.after_data).length > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/10 p-2 rounded">
                          <p className="font-bold text-green-800 dark:text-green-300 mb-1 border-b border-green-100 dark:border-green-900/30 pb-1">Yeni Değerler</p>
                          <pre className="text-[10px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-48">
                            {JSON.stringify(log.after_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}