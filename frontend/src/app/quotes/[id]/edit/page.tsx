'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  agenciesService, 
  hotelsService, 
  categoriesService, 
  usersService, 
  quotesService, 
  quoteItemsService,
  projectsService,
  projectSalesItemsService,
  projectPurchaseItemsService
} from '@/lib/supabaseService';
import QuoteServiceEditor from '@/components/QuoteServiceEditor';
import { usePermissions, Module } from '@/lib/permissions';
import LoadingSpinner from '@/components/LoadingSpinner';

// ─── NotificationModal ────────────────────────────────────────────────────────
interface NotificationModalProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

function NotificationModal({ message, type, onClose }: NotificationModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
            type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
            'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          }`}>
            {type === 'success' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            {type === 'error' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
            {type === 'info' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {type === 'success' ? 'Başarılı' : type === 'error' ? 'Hata' : 'Bilgi'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
            {message}
          </p>
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all active:scale-95 shadow-lg ${
              type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' :
              type === 'error' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' :
              'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
            }`}
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}

interface Agency { id: string; name: string; company_name: string; }
interface Hotel { id: string; name: string; concept: string; }
interface Category { id: string; name: string; parent_id?: string; description?: string; }
interface User { id: string; first_name: string; last_name: string; email: string; role: string; is_active: boolean; }

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

interface SelectedHotel {
  id: string;
  hotel_id: string;
  hotel_concept: string;
  check_in_date: string;
  check_out_date: string;
  room_count: number;
  pax_count: number;
  option: string;
  option_date: string;
  is_confirmed?: boolean;
  hotel_status?: string;
}

// ─── SearchableSelect ─────────────────────────────────────────────────────────
function SearchableSelect({ options, value, onChange, placeholder, disabled }: {
  options: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const selected = options.find(o => o.id === value);
  const display = open ? query : (selected?.name || '');
  const filtered = (query ? options.filter(o => o.name.toLowerCase().includes(query.toLowerCase())) : options).slice(0, 100);
  const handleSelect = (id: string) => { onChange(id); setOpen(false); setQuery(''); };
  return (
    <div className="relative">
      <input
        type="text"
        disabled={disabled}
        value={display}
        onChange={e => { if (disabled) return; setQuery(e.target.value); setOpen(true); setHighlight(0); }}
        onFocus={() => { if (disabled) return; setQuery(''); setOpen(true); setHighlight(0); }}
        onKeyDown={e => {
          if (disabled) return;
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { setOpen(true); e.preventDefault(); return; }
          if (!open) return;
          if (e.key === 'ArrowDown') { setHighlight(h => Math.min(h + 1, Math.max(filtered.length - 1, 0))); e.preventDefault(); }
          if (e.key === 'ArrowUp') { setHighlight(h => Math.max(h - 1, 0)); e.preventDefault(); }
          if (e.key === 'Enter') { const opt = filtered[highlight]; if (opt) handleSelect(opt.id); e.preventDefault(); }
          if (e.key === 'Escape') { setOpen(false); }
        }}
        onBlur={() => { setTimeout(() => setOpen(false), 150); }}
        placeholder={placeholder}
        className="w-full px-3 h-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs disabled:bg-gray-100 dark:disabled:bg-gray-800"
      />
      {open && (
        <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20">
          <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">{filtered.length} sonuç</div>
          {filtered.map((opt, idx) => (
            <button type="button" key={opt.id} onMouseEnter={() => setHighlight(idx)} onClick={() => handleSelect(opt.id)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${idx === highlight ? 'bg-blue-50 dark:bg-gray-700' : ''} text-gray-900 dark:text-white`}>
              {opt.name}
            </button>
          ))}
          {filtered.length === 0 && <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Sonuç yok</div>}
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function QuoteEditPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const { canEdit, loading: permissionsLoading } = usePermissions();

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showOperationManagersDropdown, setShowOperationManagersDropdown] = useState(false);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [selectedHotels, setSelectedHotels] = useState<SelectedHotel[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddServiceRow, setShowAddServiceRow] = useState(false);
  const [hasLinkedProject, setHasLinkedProject] = useState(false);

  const [formData, setFormData] = useState({
    reference: '',
    agency_id: '',
    company_name: '',
    status: 'TEKLİF',
    quote_type: 'BİRİM',
    operation_managers: [] as string[],
    notes: ''
  });

  const [activeHotelId, setActiveHotelId] = useState<string | null>(null);

  const [newServiceItem, setNewServiceItem] = useState<ServiceItem>({
    id: '', main_category: '', sub_category: '', unit_quantity: 1,
    sefer: 1, unit_price: 0, currency: 'EUR', total: 0, total_try: 0,
    description: '', vat: 0, fx: 1, isEditing: false
  });

  // Dropdown close-on-outside-click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.operation-managers-dropdown')) {
        setShowOperationManagersDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { loadData(); }, [quoteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [agList, htList, catList, uList, projList] = await Promise.all([
        agenciesService.getAll(),
        hotelsService.getAll(),
        categoriesService.getAll(),
        usersService.getAll(),
        projectsService.getAll()
      ]);

      setAgencies(agList as any || []);
      setHotels(htList as any || []);

      // Sort categories like create page
      const sortedCats = [...(catList as any[] || [])].sort((a: any, b: any) => {
        if (!a.parent_id && !b.parent_id) return (a.code || a.name || '').localeCompare(b.code || b.name || '', 'tr', { numeric: true });
        if (a.parent_id && b.parent_id) {
          const aO = a.sort_order ?? 999; const bO = b.sort_order ?? 999;
          return aO !== bO ? aO - bO : (a.name || '').localeCompare(b.name || '', 'tr', { numeric: true });
        }
        return 0;
      });
      setCategories(sortedCats);
      setUsers((uList as any[] || []).filter(u => u.is_active));

      const linkedProjectExists = (projList || []).some((p: any) => p.quote_id === quoteId);
      setHasLinkedProject(linkedProjectExists);

      // Load quote
      const q = await quotesService.getById(quoteId);
      if (q) {
        setFormData({
          reference: (q as any).reference || '',
          agency_id: (q as any).agency_id || '',
          company_name: (q as any).company_name || '',
          status: (q as any).status || 'TEKLİF',
          quote_type: (q as any).quote_type || 'BİRİM',
          operation_managers: (q as any).operation_managers || [],
          notes: (q as any).notes || ''
        });

        const hData = (q as any).hotels_data;
        if (hData && Array.isArray(hData) && hData.length > 0) {
          setSelectedHotels(hData);
          setActiveHotelId(hData[0].id);
        } else {
          const initialId = Date.now().toString() + Math.random().toString(36).slice(2, 7);
          setSelectedHotels([{
            id: initialId,
            hotel_id: (q as any).hotel_id || '',
            hotel_concept: (q as any).hotel_concept || '',
            check_in_date: (q as any).check_in_date || '',
            check_out_date: (q as any).check_out_date || '',
            room_count: (q as any).room_count || 1,
            pax_count: (q as any).pax_count || 1,
            option: (q as any).option || '1. OPSİYON',
            option_date: (q as any).option_date || ''
          }]);
          setActiveHotelId(initialId);
        }

        const TAB_TAG_REGEX = /\[T:([^\]]+)\]$/;
        const items = await quoteItemsService.getByQuoteId(quoteId);
        const fixedItems = (items || []).map((item: any) => {
          let uiHotelId = item.hotel_id;
          let cleanDescription = item.description || '';
          
          // Önce açıklamadan gizli Tab ID'sini ayıkla
          const match = cleanDescription.match(TAB_TAG_REGEX);
          if (match) {
            uiHotelId = match[1];
            cleanDescription = cleanDescription.replace(TAB_TAG_REGEX, '').trim();
          } else if (item.hotel_id && hData) {
            // Eğer etiket yoksa eski usul eşleme yap (Geriye dönük uyumluluk)
            const matched = hData.find((h: any) => h.hotel_id === item.hotel_id || h.id === item.hotel_id);
            if (matched) uiHotelId = matched.id;
          }
          
          return { 
            ...item, 
            hotel_id: uiHotelId || 'general', 
            description: cleanDescription,
            isEditing: false 
          } as ServiceItem;
        });
        setServiceItems(fixedItems);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHotelListChange = (id: string, field: keyof SelectedHotel, value: string | number | boolean) => {
    setSelectedHotels(prev => prev.map(h => {
      if (h.id !== id) return h;
      if (field === 'hotel_id') {
        const hotel = hotels.find(x => x.id === value);
        return { ...h, hotel_id: value as string, hotel_concept: hotel ? hotel.concept : h.hotel_concept };
      }
      if (field === 'hotel_status') {
        const isConf = value === 'KONFİRME';
        return { ...h, hotel_status: value as string, is_confirmed: isConf };
      }
      if (field === 'room_count' || field === 'pax_count') return { ...h, [field]: Number(value) };
      if (field === 'is_confirmed') return { ...h, [field]: !!value, hotel_status: value ? 'KONFİRME' : 'BEKLEMEDE' };
      return { ...h, [field]: value as any };
    }));
  };

  const addHotelRow = () => {
    const newId = Date.now().toString() + Math.random().toString();
    setSelectedHotels(prev => [...prev, {
      id: newId, hotel_id: '', hotel_concept: '', check_in_date: '',
      check_out_date: '', room_count: 1, pax_count: 1, option: '1. OPSİYON', option_date: '', 
      is_confirmed: false, hotel_status: 'BEKLEMEDE'
    }]);
    setActiveHotelId(newId);
  };

  const removeHotelRow = (id: string) => {
    setSelectedHotels(prev => {
      const filtered = prev.filter(h => h.id !== id);
      if (activeHotelId === id && filtered.length > 0) setActiveHotelId(filtered[0].id);
      return filtered;
    });
  };

  const copyHotel = (hotel: SelectedHotel) => {
    const newId = Date.now().toString() + Math.random().toString();
    setSelectedHotels(prev => [...prev, { ...hotel, id: newId }]);
    const newItems = serviceItems.filter(i => i.hotel_id === hotel.id).map(i => ({
      ...i, id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, hotel_id: newId
    }));
    setServiceItems(prev => [...prev, ...newItems]);
    setActiveHotelId(newId);
  };

  const handleAddItem = (hotelId: string) => {
    const newItem: ServiceItem = {
      id: `NEW_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      main_category: '', sub_category: '', unit_quantity: 1, sefer: 1,
      unit_price: 0, currency: 'EUR', total: 0, total_try: 0,
      description: '', vat: 0, fx: 1, isEditing: true, hotel_id: hotelId
    };
    setServiceItems(prev => [...prev, newItem]);
  };

  const handleEditItem = (item: ServiceItem) => {
    setServiceItems(prev => prev.map(i => i.id === item.id ? { ...item, isEditing: true } : i));
  };

  const handleDeleteItem = (id: string) => {
    setServiceItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSaveItems = (updatedItems: ServiceItem[]) => {
    setServiceItems(updatedItems);
  };

  const handleAddBelowWithHotel = (itemId: string, hotelId: string) => {
    const idx = serviceItems.findIndex(i => i.id === itemId);
    const newItem: ServiceItem = {
      id: `NEW_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      main_category: '', sub_category: '', unit_quantity: 1, sefer: 1,
      unit_price: 0, currency: 'EUR', total: 0, total_try: 0,
      description: '', vat: 0, fx: 1, isEditing: true, hotel_id: hotelId
    };
    if (idx === -1) { setServiceItems(prev => [...prev, newItem]); return; }
    const updated = [...serviceItems];
    updated.splice(idx + 1, 0, newItem);
    setServiceItems(updated);
  };

  const createProjectFromQuote = async (quoteId: string, confirmedHotels: SelectedHotel[], itemsToTransfer: ServiceItem[]) => {
    // Quote verilerini tekrar çekip en güncel halini alalım
    const q = await quotesService.getById(quoteId);
    if (!q || confirmedHotels.length === 0) {
      console.warn('⚠️ Aktarım yapılamadı: Teklif bulunamadı veya konfirme otel yok.');
      return;
    }

    console.log('🚀 Proje aktarımı başlıyor. Toplam kalem sayısı:', itemsToTransfer.length);
    console.log('📦 Konfirme oteller:', confirmedHotels.map(h => h.id));
    
    // Proje başlığı ve detayları (ilk konfirme otel bilgilerini baz alabiliriz veya genel bir isim verebiliriz)
    const firstH = confirmedHotels[0];
    const hotelObj = hotels.find(ht => ht.id === firstH.hotel_id);
    const hotelName = hotelObj ? hotelObj.name : (firstH.hotel_id || 'Otel');
    
    const title = confirmedHotels.length > 1 
      ? `${q.reference} - Çoklu Konaklama (${confirmedHotels.length} Otel)`
      : `${q.reference} - ${hotelName}`;
      
    const description = `Konfirme edilen teklif: ${q.reference}`;
    const start_date = firstH.check_in_date || q.check_in_date || q.created_at || new Date().toISOString().slice(0, 10);
    const end_date = firstH.check_out_date || q.check_out_date || start_date;
    
    // Konfirme edilen otellere ait kalemleri filtrele
    const confirmedHotelIds = confirmedHotels.map(h => h.hotel_id);
    const confirmedTabIds = confirmedHotels.map(h => h.id);
    
    // UI state'deki kalemleri kullan (DB'den çekme yarışı riskini önler)
    const relevantItems = itemsToTransfer.filter(item => {
      return (
        confirmedTabIds.includes(item.hotel_id || '') || 
        confirmedHotelIds.includes(item.hotel_id || '') ||
        !item.hotel_id || item.hotel_id === 'general'
      );
    });

    console.log('📑 Filtrelenmiş aktarılacak kalem sayısı:', relevantItems.length);
    
    const budget = relevantItems.reduce((sum, it) => sum + (Number(it.total) || 0), 0);

    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const normalizedHotels = confirmedHotels.map(h => ({
      ...h,
      id: crypto.randomUUID() // Her tab için yeni ve benzersiz bir UUID oluştur
    }));

    console.log('🏗️ Proje kaydı oluşturuluyor...');
    const created = await projectsService.create({
      title,
      description,
      status: 'active',
      priority: 'medium',
      start_date,
      end_date,
      budget,
      progress: 0,
      team_members: q.operation_managers?.length || 0,
      quote_id: q.id,
      reference: q.reference,
      company_name: q.company_name,
      agency_id: q.agency_id || null, 
      hotel_id: firstH.hotel_id || null,
      quote_type: q.quote_type,
      room_count: firstH.room_count || q.room_count || 0,
      pax_count: firstH.pax_count || q.pax_count || 0,
      room_pax: `${firstH.room_count || 0} | ${firstH.pax_count || 0}`,
      confirmed_at: q.confirmed_at || q.updated_at || q.created_at || start_date,
      hotels_data: normalizedHotels as any 
    } as any);

    console.log('✅ Proje oluşturuldu, ID:', created.id);

    // Satış kalemleri
    console.log('📝 Satış kalemleri ekleniyor...');
    for (const item of relevantItems) {
      const originalIndex = confirmedHotels.findIndex(h => h.id === item.hotel_id || h.hotel_id === item.hotel_id);
      
      // Veritabanı FK kısıtlaması için gerçek Otel UUID'si
      const realHotelId = originalIndex !== -1 ? confirmedHotels[originalIndex].hotel_id : null;
      // UI tab ayrımı için bizim ürettiğimiz gölge Tab ID'si
      const tabUUID = originalIndex !== -1 ? normalizedHotels[originalIndex].id : null;

      const payload = {
        project_id: created.id,
        reference: q.reference,
        category: item.main_category || '',
        sub_category: item.sub_category || '',
        // Gölge tag'i açıklamaya gizle
        description: tabUUID ? `${item.description || ''} [T:${tabUUID}]` : (item.description || ''),
        unit_quantity: Number(item.unit_quantity || 1),
        unit_price: Number(item.unit_price || 0),
        total_price: Number(item.total || 0),
        currency: item.currency || 'EUR',
        vat: Number(item.vat || 0),
        fx: Number(item.fx || 1),
        hotel_id: realHotelId
      };

      await projectSalesItemsService.create(payload);
    }

    // Alış kalemleri
    console.log('📝 Alış kalemleri ekleniyor...');
    for (const item of relevantItems) {
      const originalIndex = confirmedHotels.findIndex(h => h.id === item.hotel_id || h.hotel_id === item.hotel_id);
      
      const realHotelId = originalIndex !== -1 ? confirmedHotels[originalIndex].hotel_id : null;
      const tabUUID = originalIndex !== -1 ? normalizedHotels[originalIndex].id : null;

      const payload = {
        project_id: created.id,
        reference: q.reference,
        category: item.main_category || '',
        sub_category: item.sub_category || '',
        description: tabUUID ? `${item.description || ''} [T:${tabUUID}]` : (item.description || ''),
        unit_quantity: Number(item.unit_quantity || 1),
        unit_price: 0,
        total_price: 0,
        currency: item.currency || 'EUR',
        vat: Number(item.vat || 0),
        fx: Number(item.fx || 1),
        hotel_id: realHotelId
      };

      await projectPurchaseItemsService.create(payload);
    }
    console.log('✨ Aktarım tamamlandı.');
    
    return created;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasLinkedProject) {
      setNotification({ message: 'Bu teklif kilitlidir. Bağlı proje silinmeden güncellenemez.', type: 'error' });
      return;
    }

    try {
      const activeHotels = selectedHotels.filter(h => h.hotel_id && h.check_in_date && h.check_out_date);
      if (activeHotels.length === 0) {
        setNotification({ message: 'Lütfen en az bir otel seçiniz ve tarihlerini doldurunuz.', type: 'error' });
        return;
      }

      const totalAmount = serviceItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const firstHotel = activeHotels[0];

      await quotesService.update(quoteId, {
        reference: formData.reference,
        agency_id: formData.agency_id,
        company_name: formData.company_name,
        check_in_date: firstHotel.check_in_date,
        check_out_date: firstHotel.check_out_date,
        hotel_id: firstHotel.hotel_id,
        hotel_concept: firstHotel.hotel_concept,
        hotels_data: activeHotels,
        room_count: Number(firstHotel.room_count || 0),
        pax_count: Number(firstHotel.pax_count || 0),
        option: firstHotel.option,
        option_date: firstHotel.option_date || null,
        status: formData.status,
        // KONFİRME'ye çekilen teklif otomatik kilitlensin
        locked: formData.status === 'KONFİRME' ? true : undefined,
        quote_type: formData.quote_type,
        operation_managers: formData.operation_managers.filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)),
        notes: formData.notes,
        total_amount: totalAmount
      } as any);

      await quoteItemsService.deleteByQuoteId(quoteId);
      for (const item of serviceItems) {
        // Otel eşleşmesini bul ve gerçek Hotel UUID'sini al
        const matchedHotel = selectedHotels.find(h => h.id === item.hotel_id);
        const dbHotelId = matchedHotel ? matchedHotel.hotel_id : null;
        
        // Tab ID'sini açıklamanın sonuna gizli tag olarak ekle [T:tab_id]
        let saveDescription = item.description || '';
        if (item.hotel_id && item.hotel_id !== 'general' && !saveDescription.includes(`[T:${item.hotel_id}]`)) {
          saveDescription = `${saveDescription} [T:${item.hotel_id}]`.trim();
        }

        await quoteItemsService.create({
          quote_id: quoteId,
          reference: formData.reference,
          main_category: item.main_category || '',
          sub_category: item.sub_category || '',
          unit_quantity: Number(item.unit_quantity || 0),
          sefer: Number(item.sefer || 0),
          unit_price: Number(item.unit_price || 0),
          currency: item.currency || 'EUR',
          total: Number(item.total || 0),
          total_price: Number(item.total || 0),
          total_try: Number(item.total_try || 0),
          description: saveDescription,
          vat: Number(item.vat || 0),
          fx: Number(item.fx || 1),
          hotel_id: dbHotelId
        } as any);
      }

      // Sadece KONFİRME ise ve proje yoksa aktar
      if (formData.status === 'KONFİRME') {
        try {
          const confirmedHotels = selectedHotels.filter(h => h.is_confirmed || h.hotel_status === 'KONFİRME');
          if (confirmedHotels.length > 0) {
            // Mevcut projeleri kontrol et ama aktarımı engelleme (test için veya güncelleme için izin veriyoruz)
            const existingProjects = await projectsService.getAll();
            const projectExists = existingProjects.some(p => p.quote_id === quoteId);
            
            if (projectExists) {
              console.log('ℹ️ Bu teklif için daha önce proje oluşturulmuş. Yeni bir tane daha oluşturuluyor...');
            }

            await createProjectFromQuote(quoteId, confirmedHotels, serviceItems);
            setNotification({ message: 'Teklif güncellendi ve proje oluşturuldu.', type: 'success' });
          }
        } catch (err: any) {
          console.error('Proje aktarım hatası:', err);
          setNotification({ message: `Proje aktarımı sırasında bir hata oluştu: ${err.message || 'Bilinmeyen hata'}`, type: 'error' });
        }
      } else {
        setNotification({ message: 'Teklif başarıyla güncellendi!', type: 'success' });
      }

      router.push('/quotes');
    } catch (error: any) {
      console.error('Error updating quote:', error);
      setNotification({ message: `Hata: ${error?.message || 'Bilinmeyen hata'}`, type: 'error' });
    }
  };
  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Quotes düzenleme yetkisi kontrolü
  if (!canEdit(Module.QUOTES)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Teklifi düzenlemek için yetkiniz bulunmuyor.</p>
          <Link href="/quotes" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Teklif Listesine Dön
          </Link>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 compact">
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Teklif Düzenle</h1>
          </div>
          <Link href="/quotes" className="bg-gray-500 dark:bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors">
            Geri Dön
          </Link>
        </div>

        {hasLinkedProject && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-4 flex items-start gap-3 shadow-lg shadow-amber-500/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
              <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider">TEKLİF KİLİTLİ</h4>
              <p className="text-[10px] font-medium text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                Bu teklif konfirme edilip projeye aktarılmıştır. Teklif üzerinde düzenleme yapabilmek için önce bağlı olan projeyi silmelisiniz.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Teklif Bilgileri */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Teklif Bilgileri</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Reference */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">KOD *</label>
                <input
                  type="text"
                  value={formData.reference}
                  disabled={hasLinkedProject}
                  onChange={e => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                  required
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                />
              </div>

              {/* Agency */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">ACENTE *</label>
                <SearchableSelect
                  options={agencies}
                  value={formData.agency_id}
                  disabled={hasLinkedProject}
                  onChange={id => setFormData(prev => ({ ...prev, agency_id: id }))}
                  placeholder="Acente seç / ara..."
                />
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">FİRMA ADI *</label>
                <input
                  type="text"
                  value={formData.company_name}
                  disabled={hasLinkedProject}
                  onChange={e => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  required
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">DURUM *</label>
                <select
                  value={formData.status}
                  disabled={hasLinkedProject}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  required
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-bold disabled:bg-gray-100 dark:disabled:bg-gray-800"
                >
                  <option value="BEKLEMEDE">BEKLEMEDE</option>
                  <option value="KONFİRME">KONFİRME</option>
                  <option value="İPTAL">İPTAL</option>
                </select>
              </div>

              {/* Quote Type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">TEKLİF TÜRÜ *</label>
                <select
                  value={formData.quote_type}
                  disabled={hasLinkedProject}
                  onChange={e => setFormData(prev => ({ ...prev, quote_type: e.target.value }))}
                  required
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                >
                  <option value="BİRİM">BİRİM</option>
                  <option value="PAKET">PAKET</option>
                </select>
              </div>

              {/* Operation Managers */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">OPERASYON SORUMLULARI</label>
                <div className="relative operation-managers-dropdown">
                  <button
                    type="button"
                    disabled={hasLinkedProject}
                    onClick={() => !hasLinkedProject && setShowOperationManagersDropdown(!showOperationManagersDropdown)}
                    className="w-full px-3 h-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left flex justify-between items-center text-xs disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400"
                  >
                    <span>{formData.operation_managers.length > 0 ? `${formData.operation_managers.length} kullanıcı seçildi` : 'Kullanıcı seçin...'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {showOperationManagersDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {users.map(user => (
                        <label key={user.id} className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.operation_managers.includes(user.id)}
                            onChange={e => {
                              const managers = e.target.checked
                                ? [...formData.operation_managers, user.id]
                                : formData.operation_managers.filter(id => id !== user.id);
                              setFormData(prev => ({ ...prev, operation_managers: managers }));
                            }}
                            className="mr-2 text-blue-600"
                          />
                          <span className="text-sm text-gray-900 dark:text-white">{user.first_name} {user.last_name} ({user.email})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formData.operation_managers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {formData.operation_managers.map(managerId => {
                      const user = users.find(u => u.id === managerId);
                      return (
                        <span key={managerId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                          {user ? `${user.first_name} ${user.last_name}` : managerId}
                          {!hasLinkedProject && (
                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, operation_managers: prev.operation_managers.filter(id => id !== managerId) }))} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">NOTLAR</label>
                <textarea
                  value={formData.notes}
                  disabled={hasLinkedProject}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="w-full px-3 h-24 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  placeholder="Teklif notlarını buraya yazın..."
                />
              </div>

              {/* ─── Çoklu Otel Seçimi ─── */}
              <div className="md:col-span-2 space-y-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Otel &amp; Konaklama Seçimleri</h3>
                  {!hasLinkedProject && (
                    <button type="button" onClick={addHotelRow} className="text-xs font-medium bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded transition-colors">
                      + OTEL EKLE
                    </button>
                  )}
                </div>

                {/* Tab Bar */}
                <div className="flex bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-lg border border-gray-100 dark:border-gray-700 space-x-2 overflow-x-auto">
                  {selectedHotels.map((h, index) => (
                    <div
                      key={h.id}
                      onClick={() => setActiveHotelId(h.id)}
                      className={`flex items-center px-4 py-2 rounded-md cursor-pointer transition-all duration-200 whitespace-nowrap group ${
                        activeHotelId === h.id
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-xs font-semibold mr-2">{index + 1}. OTEL</span>
                      <span className="text-[10px] opacity-80 max-w-[100px] truncate">
                        {hotels.find(x => x.id === h.hotel_id)?.name || 'Otel Seçin'}
                      </span>
                      {!hasLinkedProject && (
                        <div className="flex items-center ml-3 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={e => { e.stopPropagation(); copyHotel(h); }} className="p-1 hover:bg-white/20 rounded" title="Kopyala">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                          </button>
                          {selectedHotels.length > 1 && (
                            <button type="button" onClick={e => { e.stopPropagation(); removeHotelRow(h.id); }} className="p-1 hover:bg-red-500 rounded" title="Sil">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  <div
                    onClick={() => setActiveHotelId('general')}
                    className={`flex items-center px-4 py-2 rounded-md cursor-pointer transition-all duration-200 whitespace-nowrap ${
                      activeHotelId === 'general'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-xs font-semibold">GENEL HİZMETLER</span>
                  </div>

                  {!hasLinkedProject && (
                    <button
                      type="button"
                      onClick={addHotelRow}
                      className="flex items-center px-3 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm"
                      title="Yeni Otel Ekle"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" /></svg>
                      <span className="ml-1 text-xs font-bold uppercase">Yeni Otel</span>
                    </button>
                  )}
                </div>

                {/* Tab Content – Hotel */}
                {activeHotelId !== 'general' && selectedHotels.map(h => activeHotelId === h.id && (
                  <div key={h.id} className="p-4 bg-white dark:bg-gray-800/80 rounded-lg border border-blue-500 ring-2 ring-blue-500/10 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-4">
                        <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">Otel *</label>
                        <SearchableSelect options={hotels} value={h.hotel_id} disabled={hasLinkedProject} onChange={val => handleHotelListChange(h.id, 'hotel_id', val)} placeholder="Otel seç..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">Otel Konsepti</label>
                        <input type="text" value={h.hotel_concept} disabled={hasLinkedProject} onChange={e => handleHotelListChange(h.id, 'hotel_concept', e.target.value)} className="w-full px-2 py-1 h-10 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" placeholder="Konsept..." />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">C/IN Tarihi *</label>
                        <input type="date" value={h.check_in_date} disabled={hasLinkedProject} onChange={e => handleHotelListChange(h.id, 'check_in_date', e.target.value)} required className="w-full px-2 py-1 h-10 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">C/OUT Tarihi *</label>
                        <input type="date" value={h.check_out_date} disabled={hasLinkedProject} onChange={e => handleHotelListChange(h.id, 'check_out_date', e.target.value)} required className="w-full px-2 py-1 h-10 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border-t border-gray-50 dark:border-gray-700/50 pt-3">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">Oda Sayısı</label>
                        <input type="number" value={h.room_count} disabled={hasLinkedProject} onChange={e => handleHotelListChange(h.id, 'room_count', parseInt(e.target.value) || 0)} min="1" className="w-full px-2 py-1 h-10 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">Pax Sayısı</label>
                        <input type="number" value={h.pax_count} disabled={hasLinkedProject} onChange={e => handleHotelListChange(h.id, 'pax_count', parseInt(e.target.value) || 0)} min="1" className="w-full px-2 py-1 h-10 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">Opsiyon</label>
                        <select value={h.option} disabled={hasLinkedProject} onChange={e => handleHotelListChange(h.id, 'option', e.target.value)} className="w-full px-2 py-1 h-10 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800">
                          <option value="1. OPSİYON">1. OPSİYON</option>
                          <option value="2. OPSİYON">2. OPSİYON</option>
                          <option value="SOR-SAT">SOR-SAT</option>
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">Opsiyon Tarihi</label>
                        <input type="date" value={h.option_date} onChange={e => handleHotelListChange(h.id, 'option_date', e.target.value)} disabled={h.option === 'SOR-SAT' || hasLinkedProject} className="w-full px-2 py-1 h-10 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">Durum</label>
                        <select
                          value={h.hotel_status || (h.is_confirmed ? 'KONFİRME' : 'BEKLEMEDE')}
                          disabled={hasLinkedProject}
                          onChange={(e) => handleHotelListChange(h.id, 'hotel_status' as any, e.target.value)}
                          className="w-full px-2 py-1 h-10 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-bold disabled:bg-gray-100 dark:disabled:bg-gray-800"
                        >
                          <option value="BEKLEMEDE">BEKLEMEDE</option>
                          <option value="KONFİRME">KONFİRME</option>
                          <option value="İPTAL">İPTAL</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-6">
                      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 uppercase flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-10V4a1 1 0 011-1h2a1 1 0 011 1v3M12 7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        Otel Bazlı Hizmet Kalemleri
                      </h3>
                      <QuoteServiceEditor
                        items={serviceItems.filter(item => item.hotel_id === h.id)}
                        disabled={hasLinkedProject}
                        onAdd={() => handleAddItem(h.id)}
                        onEdit={handleEditItem}
                        onDelete={handleDeleteItem}
                        onSave={updatedItems => {
                          const updatedIds = new Set(updatedItems.map(it => it.id));
                          const otherItems = serviceItems.filter(item => !updatedIds.has(item.id));
                          handleSaveItems([...otherItems, ...updatedItems]);
                        }}
                        onAddBelow={itemId => handleAddBelowWithHotel(itemId, h.id)}
                        categories={categories}
                        currencies={['EUR', 'USD', 'TL', 'GBP']}
                        showAddRow={showAddServiceRow}
                        setShowAddRow={setShowAddServiceRow}
                        newItem={newServiceItem}
                        setNewItem={setNewServiceItem}
                        hotels={selectedHotels.map(sh => ({
                          ...sh,
                          name: hotels.find(x => x.id === sh.hotel_id)?.name || (sh.hotel_id ? 'Otel' : 'Otel Seçilmedi')
                        }))}
                        hotelId={h.id}
                      />
                    </div>
                  </div>
                ))}

                {/* Tab Content – General */}
                {activeHotelId === 'general' && (
                  <div className="p-4 bg-white dark:bg-gray-800/80 rounded-lg border border-indigo-500 ring-2 ring-indigo-500/10 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 uppercase flex items-center">
                      <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      Genel Hizmet Kalemleri (Uçak, Transfer vb.)
                    </h3>
                    <QuoteServiceEditor
                      items={serviceItems.filter(item => !item.hotel_id || item.hotel_id === 'general')}
                      disabled={hasLinkedProject}
                      onAdd={() => handleAddItem('general')}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteItem}
                      onSave={updatedItems => {
                        const updatedIds = new Set(updatedItems.map(it => it.id));
                        const otherItems = serviceItems.filter(item => !updatedIds.has(item.id));
                        handleSaveItems([...otherItems, ...updatedItems]);
                      }}
                      onAddBelow={itemId => handleAddBelowWithHotel(itemId, 'general')}
                      categories={categories}
                      currencies={['EUR', 'USD', 'TL', 'GBP']}
                      showAddRow={showAddServiceRow}
                      setShowAddRow={setShowAddServiceRow}
                      newItem={newServiceItem}
                      setNewItem={setNewServiceItem}
                      hotels={selectedHotels.map(sh => ({
                        ...sh,
                        name: hotels.find(x => x.id === sh.hotel_id)?.name || (sh.hotel_id ? 'Otel' : 'Otel Seçilmedi')
                      }))}
                      hotelId="general"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4 p-4">
            <Link href="/quotes" className="bg-gray-500 dark:bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors">
              İptal / Geri Dön
            </Link>
            {!hasLinkedProject && (
              <button type="submit" className="bg-green-600 dark:bg-green-700 text-white px-2 py-1 rounded text-xs hover:bg-green-700 dark:hover:bg-green-800 transition-colors">
                Teklifi Güncelle
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}