'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from '@/components/providers/ThemeProvider';
import { SejourService, AgencyService, HotelService, SupplierService, ServiceTypeService, SettingsService } from '@/lib/supabaseService';
import { usePermissions, Module } from '@/lib/permissions';
import { getLogosForExcel } from '@/utils/logoUtils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-hot-toast';

// Basit arama ve klavye destekli ComboBox - Modernize Edildi
function ComboBox({
  options,
  value,
  onChange,
  placeholder = 'Seçin...',
  className = ''
}: {
  options: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(-1);
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);

  const getName = (o: any) => String((o && (o.name ?? o.label ?? o.title)) || '');
  const selected = options.find(o => o.id === value);
  const filtered = options.filter(o => getName(o).toLowerCase().includes(query.toLowerCase()));

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
    setQuery('');
    setHighlight(-1);
  }

  const getDropdownPosition = () => {
    if (!inputRef) return { top: 0, left: 0, width: 300 };
    
    const rect = inputRef.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 200)
    };
  };

  const position = getDropdownPosition();

  return (
    <div className="relative">
      <div className={`relative flex items-center bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700/50 rounded-lg transition-all duration-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 ${className}`}>
        <input
          ref={setInputRef}
          className="w-full px-2 py-1 bg-transparent text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 outline-none"
          placeholder={placeholder}
          value={open ? query : (selected ? getName(selected) : '')}
          onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); setHighlight(0); }}
          onFocus={() => { setOpen(true); setHighlight(0); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { setOpen(true); return; }
            if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => (h + 1) % Math.max(filtered.length, 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => (h - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1)); }
            if (e.key === 'Enter') { if (filtered.length > 0) handleSelect(filtered[Math.max(highlight, 0)].id); }
            if (e.key === 'Escape') { setOpen(false); setQuery(''); setHighlight(-1); }
          }}
          autoComplete="off"
        />
        <div className="pr-4 pointer-events-none text-gray-400">
          <svg className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {open && (
        <div 
          className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm max-h-56 overflow-auto animate-in fade-in zoom-in-95 duration-200" 
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
            minWidth: '200px'
          }}>
          {filtered.length === 0 ? (
            <div className="px-2 py-1 text-xs font-bold text-gray-400">Sonuç bulunamadı</div>
          ) : (
            filtered.map((o, i) => (
              <div
                key={o.id}
                className={`px-2 py-1 text-xs font-bold cursor-pointer transition-colors duration-200 ${i === highlight ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(o.id); }}
              >
                {getName(o)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface Room {
  id: string;
  roomNumber: string;
  hotelId: string;
  accommodationType?: string;
  roomType: string;
  guestInfo: string;
  price: number;
  currency: string;
  // Alış maliyeti için yeni alanlar
  costPrice?: number;
  costCurrency?: string;
  hotelName?: string;
}

interface FlightInfo {
  id: string;
  flightDate: string;
  airline: string;
  route: string;
  flightNo: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
  type: 'departure' | 'return';
  // Biletleme alanları
  ticketingDate: string;
  ticketingProvider: string;
  pnr: string;
  // Alış maliyeti için yeni alanlar
  costPrice?: number;
  costCurrency?: string;
}

interface TransferInfo {
  id: string;
  date: string;
  provider: string;
  type: 'private' | 'economic';
  vehicle: string;
  vehicleType?: string;
  time: string;
  price: number;
  currency: string;
  direction: 'arrival' | 'return' | 'intermediate';
  // Alış maliyeti için yeni alanlar
  costPrice?: number;
  costCurrency?: string;
}

interface ExtraService {
  id: string;
  serviceType: string;
  provider: string;
  description: string;
  price: number;
  currency: string;
  // Alış maliyeti için alanlar (sadece alış tab'ında kullanılır)
  costPrice?: number;
  costCurrency?: string;
}

interface Collection {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  currency: string;
  note?: string;
  method?: string;
}



export default function EditSejourPage() {
  const { isDark } = useTheme();
  const { canEdit, loading: permissionsLoading } = usePermissions();
  const router = useRouter();
  const params = useParams();
  const sejourId = params.id as string;
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Voucher PDF states
  const voucherRef = useRef<HTMLDivElement>(null);
  const [darkIconLogo, setDarkIconLogo] = useState<string>('');
  const [darkWordmarkLogo, setDarkWordmarkLogo] = useState<string>('');
  const [companyInfo, setCompanyInfo] = useState({
    company_name: 'TEMPUS TRAVEL',
    company_email: 'info@tempustravel.co',
    company_phone: '',
    company_address: '',
    company_website: 'www.tempustravel.co'
  });

  // Sales Form Data
  const [salesData, setSalesData] = useState({
    voucherNumber: '',
    customerType: 'agency', // 'agency' or 'individual'
    agencyId: '',
    customerName: '',
    checkInDate: '',
    checkOutDate: '',
    totalAmount: 0,
    currency: 'TRY',
    status: 'BEKLEMEDE',
    notes: ''
  });

  // Rooms
  const [rooms, setRooms] = useState<Room[]>([]);

  // Flight Info
  const [flights, setFlights] = useState<FlightInfo[]>([]);

  // Transfer Info
  const [transfers, setTransfers] = useState<TransferInfo[]>([]);

  // Extra Services
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);

  // Collections
  const [collections, setCollections] = useState<Collection[]>([]);

  // Service Price Input State for TR formatting
  const [servicePriceInput, setServicePriceInput] = useState<Record<string, string>>({});





  // Real Data States
  const [agencies, setAgencies] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierServiceTypes, setSupplierServiceTypes] = useState<any[]>([]);

  const [roomTypes] = useState([
    'Standart Oda', 'Kara Manzaralı', 'Deniz Manzaralı', 'Kısmi Deniz Manzaralı',
    'Suite', 'King Suite', 'Villa', 'Deluxe Oda', 'Executive Suite'
  ]);

  const [vehicleTypes] = useState([
    'Vito', 'Binek', 'S Class', 'Sprinter', 'Otobüs'
  ]);

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load agencies
        const agenciesData = await AgencyService.getAgencies();
        setAgencies(agenciesData);

        // Load hotels
        const hotelsData = await HotelService.getHotels();
        setHotels(hotelsData);

        // Load suppliers
        const suppliersData = await SupplierService.getSuppliers();
        setSuppliers(suppliersData);

        // Load service types
        const serviceTypesData = await ServiceTypeService.getServiceTypes();
        setSupplierServiceTypes(serviceTypesData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
    loadLogos();
    loadCompanyInfo();
  }, []);

  const loadLogos = async () => {
    try {
      const { iconLogoBase64, wordmarkLogoBase64 } = await getLogosForExcel(false);
      if (iconLogoBase64) setDarkIconLogo(iconLogoBase64);
      if (wordmarkLogoBase64) setDarkWordmarkLogo(wordmarkLogoBase64);
    } catch (error) {
      console.error('Error loading logos:', error);
    }
  };

  const loadCompanyInfo = async () => {
    try {
      const settings = await SettingsService.getSettings();
      const generalSettings = settings.general_settings || {};
      setCompanyInfo({
        company_name: generalSettings.company_name || 'TEMPUS TRAVEL',
        company_email: generalSettings.company_email || 'info@tempustravel.co',
        company_phone: generalSettings.company_phone || '',
        company_address: generalSettings.company_address || '',
        company_website: generalSettings.company_website || 'www.tempustravel.co'
      });
    } catch (error) {
      console.error('Error loading company info:', error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!voucherRef.current) return;

    try {
      setIsGeneratingPDF(true);
      const voucherElement = voucherRef.current;
      
      // Her ihtimale karşı kısa bir gecikme ekle (logoların render olması için)
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(voucherElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true,
        width: 794,
        windowWidth: 794
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, Math.min(imgHeight, pageHeight));
      pdf.save(`voucher-${salesData.voucherNumber || 'draft'}.pdf`);
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      toast.error('PDF oluşturulurken hata oluştu: ' + (error as Error).message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Load existing sejour data
  useEffect(() => {
    const loadSejourData = async () => {
      if (sejourId) {
        try {
          const sejour = await SejourService.getSejourWithDetails(sejourId);
          
          if (sejour) {
            setSalesData({
              voucherNumber: sejour.voucherNumber || '',
              customerType: sejour.customerType || 'agency',
              agencyId: sejour.agencyId || '',
              customerName: sejour.customerName || '',
              checkInDate: sejour.checkInDate || '',
              checkOutDate: sejour.checkOutDate || '',
              totalAmount: sejour.totalAmount || 0,
              currency: sejour.currency || 'TRY',
              status: sejour.status || 'BEKLEMEDE',
              notes: sejour.notes || ''
            });
            
            if (sejour.rooms) {
              setRooms(sejour.rooms);
              if (sejour.rooms.length > 0) setShowAccommodation(true);
            }
            if (sejour.flights) {
              setFlights(sejour.flights);
              if (sejour.flights.length > 0) setShowFlight(true);
            }
            if (sejour.transfers) {
              setTransfers(sejour.transfers);
              if (sejour.transfers.length > 0) setShowTransfer(true);
            }
            if (sejour.extraServices) {
              setExtraServices(sejour.extraServices);
              if (sejour.extraServices.length > 0) setShowExtraServices(true);
            }
            if (sejour.collections) {
              // Mevcut tahsilatlarda currency yoksa ekle
              const collectionsWithCurrency = sejour.collections.map((collection: any) => ({
                ...collection,
                currency: collection.currency || 'TRY'
              }));
              setCollections(collectionsWithCurrency);
            }
          }
        } catch (error) {
          console.error('Error loading sejour data:', error);
        }
      }
    };
    
    loadSejourData();
  }, [sejourId]);

  // Section visibility states
  const [showAccommodation, setShowAccommodation] = useState(false);
  const [showFlight, setShowFlight] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showExtraServices, setShowExtraServices] = useState(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSalesData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSalesData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  // Room Management
  const addRoom = () => {
    const newRoom: Room = {
      id: Date.now().toString(),
      roomNumber: `Oda ${rooms.length + 1}`,
      hotelId: '',
      accommodationType: '',
      roomType: '',
      guestInfo: '',
      price: 0,
      currency: 'TRY',
      costPrice: 0,
      costCurrency: 'TRY'
    };
    setRooms([...rooms, newRoom]);
  };

  // Flight Management
  const addFlight = (type: 'departure' | 'return') => {
    const newFlight: FlightInfo = {
      id: Date.now().toString(),
      flightDate: type === 'departure' ? salesData.checkInDate : salesData.checkOutDate,
      airline: '',
      route: '',
      flightNo: '',
      departureTime: '',
      arrivalTime: '',
      price: 0,
      currency: 'TRY',
      type: type,
      ticketingDate: new Date().toISOString().split('T')[0], // Bugünün tarihi
      ticketingProvider: '',
      pnr: '',
      costPrice: 0,
      costCurrency: 'TRY'
    };
    setFlights([...flights, newFlight]);
  };

  const updateFlight = (id: string, field: keyof FlightInfo, value: string | number) => {
    setFlights(flights.map(flight => 
      flight.id === id ? { ...flight, [field]: value } : flight
    ));
  };

  const removeFlight = (id: string) => {
    setFlights(flights.filter(flight => flight.id !== id));
  };

  // Transfer Management
  const addTransfer = (direction: 'arrival' | 'return' | 'intermediate') => {
    const newTransfer: TransferInfo = {
      id: Date.now().toString(),
      date: direction === 'arrival' ? salesData.checkInDate : direction === 'intermediate' ? salesData.checkOutDate : salesData.checkOutDate,
      provider: '',
      type: 'private',
      vehicle: '',
      time: '',
      price: 0,
      currency: 'TRY',
      direction: direction,
      costPrice: 0,
      costCurrency: 'TRY'
    };
    setTransfers([...transfers, newTransfer]);
  };

  const updateTransfer = (id: string, field: keyof TransferInfo, value: string | number) => {
    setTransfers(transfers.map(transfer => 
      transfer.id === id ? { ...transfer, [field]: value } : transfer
    ));
  };

  const removeTransfer = (id: string) => {
    setTransfers(transfers.filter(transfer => transfer.id !== id));
  };

  const updateRoom = (id: string, field: keyof Room, value: string | number) => {
    setRooms(rooms.map(room => 
      room.id === id ? { ...room, [field]: value } : room
    ));
  };

  const removeRoom = (id: string) => {
    setRooms(rooms.filter(room => room.id !== id));
  };

  // Extra Service Management
  const addExtraService = () => {
    const newService: ExtraService = {
      id: Date.now().toString(),
      serviceType: '',
      provider: '',
      description: '',
      price: 0,
      currency: 'TRY',
      costPrice: 0,
      costCurrency: 'TRY'
    };
    setExtraServices([...extraServices, newService]);
  };

  const updateExtraService = (id: string, field: keyof ExtraService, value: string | number) => {
    setExtraServices(extraServices.map(service => 
      service.id === id ? { ...service, [field]: value } : service
    ));
  };

  const removeExtraService = (id: string) => {
    setExtraServices(extraServices.filter(service => service.id !== id));
  };

  // TR format helper
  const formatAmount = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) return '0,00';
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };
  
  // TR format input helpers
  const normalizeTyping = (value: string) => value.replace(/[^\d,]/g, '').replace(/,/g, '.');
  
  const parseTrAmount = (value: string): number | null => {
    if (!value) return null;
    const normalized = value.replace(/\./g, '').replace(/,/g, '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? null : parsed;
  };

  // Currency options in order
  const CURRENCY_OPTIONS = ['TRY', 'EUR', 'USD', 'GBP'];

  // Calculate total amount by currency
  const calculateTotalAmount = () => {
    const totals = {
      TRY: 0,
      EUR: 0,
      USD: 0,
      GBP: 0
    } as Record<string, number>;

    // Room totals
    rooms.forEach(room => {
      totals[room.currency as keyof typeof totals] += room.price;
    });

    // Flight totals
    flights.forEach(flight => {
      totals[flight.currency as keyof typeof totals] += flight.price;
    });

    // Transfer totals
    transfers.forEach(transfer => {
      totals[transfer.currency as keyof typeof totals] += transfer.price;
    });

    // Service totals
    extraServices.forEach(service => {
      totals[service.currency as keyof typeof totals] += service.price;
    });

    return totals;
  };

  // Calculate total cost by currency
  const calculateTotalCost = () => {
    const costs = {
      TRY: 0,
      EUR: 0,
      USD: 0,
      GBP: 0
    } as Record<string, number>;

    // Room costs
    rooms.forEach(room => {
      const costCurrency = room.costCurrency || room.currency;
      costs[costCurrency as keyof typeof costs] += room.costPrice || 0;
    });

    // Flight costs
    flights.forEach(flight => {
      const costCurrency = flight.costCurrency || flight.currency;
      costs[costCurrency as keyof typeof costs] += flight.costPrice || 0;
    });

    // Transfer costs
    transfers.forEach(transfer => {
      const costCurrency = transfer.costCurrency || transfer.currency;
      costs[costCurrency as keyof typeof costs] += transfer.costPrice || 0;
    });

    // Service costs
    extraServices.forEach(service => {
      const costCurrency = service.costCurrency || service.currency;
      costs[costCurrency as keyof typeof costs] += service.costPrice || 0;
    });

    return costs;
  };

  // Get total for specific currency
  const getTotalForCurrency = (currency: string) => {
    const totals = calculateTotalAmount();
    return totals[currency as keyof typeof totals] || 0;
  };

  // Get cost for specific currency
  const getCostForCurrency = (currency: string) => {
    const costs = calculateTotalCost();
    return costs[currency as keyof typeof costs] || 0;
  };

  // Calculate profit/loss for specific currency
  const getProfitForCurrency = (currency: string) => {
    const total = getTotalForCurrency(currency);
    const cost = getCostForCurrency(currency);
    return total - cost;
  };

  // Collections Management
  const addCollection = () => {
    const newCollection: Collection = {
      id: Date.now().toString(),
      type: 'cash', // Varsayılan olarak nakit seçili
      amount: 0,
      date: new Date().toISOString().split('T')[0], // Bugünün tarihi
      description: '',
      currency: 'TRY' // Varsayılan olarak TRY
    };
    setCollections([...collections, newCollection]);
  };

  const updateCollection = (id: string, field: keyof Collection, value: string | number) => {
    setCollections(collections.map(collection => 
      collection.id === id ? { ...collection, [field]: value } : collection
    ));
  };

  const removeCollection = (id: string) => {
    setCollections(collections.filter(collection => collection.id !== id));
  };

  const calculateTotalCollections = () => {
    return collections.reduce((sum, collection) => sum + collection.amount, 0);
  };

  const calculateTotalCollectionsByCurrency = (currency: string) => {
    return collections
      .filter(collection => collection.currency === currency)
      .reduce((sum, collection) => sum + collection.amount, 0);
  };

  const calculateBalance = () => {
    const totalAmount = getTotalForCurrency(salesData.currency);
    return totalAmount - calculateTotalCollections();
  };

  const calculateBalanceByCurrency = (currency: string) => {
    const totalAmount = getTotalForCurrency(currency);
    const totalCollections = calculateTotalCollectionsByCurrency(currency);
    return totalAmount - totalCollections;
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validation
      if (!salesData.voucherNumber.trim()) {
        setError('Voucher numarası gereklidir');
        return;
      }

      // Müşteri tipi Acenta ise acente seçimi zorunlu, Şahıs ise zorunlu değil
      if (salesData.customerType === 'agency' && !salesData.agencyId) {
        setError('Acente seçimi gereklidir');
        return;
      }

      if (!salesData.checkInDate || !salesData.checkOutDate) {
        setError('Giriş ve çıkış tarihleri gereklidir');
        return;
      }

      if (new Date(salesData.checkInDate) >= new Date(salesData.checkOutDate)) {
        setError('Çıkış tarihi giriş tarihinden sonra olmalıdır');
        return;
      }

      // Update existing sejour object
      const sejourData = {
        id: sejourId,
        voucherNumber: salesData.voucherNumber,
        customerType: salesData.customerType,
        agencyId: salesData.agencyId,
        agencyName: salesData.customerType === 'agency' ? agencies.find(a => a.id === salesData.agencyId)?.name : '',
        customerName: salesData.customerName,
        checkInDate: salesData.checkInDate,
        checkOutDate: salesData.checkOutDate,
        rooms: rooms,
        flights: flights,
        transfers: transfers,
        extraServices: extraServices,
        totalAmount: calculateTotalAmount()[salesData.currency as keyof ReturnType<typeof calculateTotalAmount>] || calculateTotalAmount().TRY || 0,
        totals: calculateTotalAmount(),
        costs: calculateTotalCost(),
        profits: {
          TRY: getProfitForCurrency('TRY'),
          EUR: getProfitForCurrency('EUR'),
          USD: getProfitForCurrency('USD'),
          GBP: getProfitForCurrency('GBP')
        },
        currency: salesData.currency,
        status: salesData.status,
        notes: salesData.notes,
        collections: collections,
        updated_at: new Date().toISOString()
      };

      // Debug: Maliyet verilerini kontrol et
      console.log('Sejour data before update:', {
        rooms: rooms.map(r => ({ id: r.id, costPrice: r.costPrice, costCurrency: r.costCurrency })),
        flights: flights.map(f => ({ id: f.id, costPrice: f.costPrice, costCurrency: f.costCurrency })),
        transfers: transfers.map(t => ({ id: t.id, costPrice: t.costPrice, costCurrency: t.costCurrency })),
        extraServices: extraServices.map(s => ({ id: s.id, costPrice: s.costPrice, costCurrency: s.costCurrency }))
      });

      // Update Supabase
      await SejourService.updateSejour(sejourId, sejourData);
      
      console.log('Sejour updated and saved to Supabase:', {
        sejourData,
        sejourId
      });

      toast.success('Sejour başarıyla güncellendi!');
      setSuccess('Sejour başarıyla güncellendi!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.refresh();
        router.push('/sejour');
      }, 2000);

    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.details ||
        error?.hint ||
        (typeof error === 'string' ? error : '') ||
        'Sejour güncellenirken bir hata oluştu';
      console.error('Error updating sejour:', errorMessage, error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Sejour düzenleme yetkisi kontrolü
  if (!canEdit(Module.SEJOUR)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Sejour kaydını düzenlemek için yetkiniz bulunmuyor.</p>
          <button onClick={() => router.push('/sejour')} className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Sejour Listesine Dön
          </button>
        </div>
      </div>
    );
  }
  const tabs = [
    { id: 'sales', name: 'SATIŞ', icon: '💰' },
    { id: 'purchase', name: 'ALIŞ', icon: '🛒' },
    { id: 'collections', name: 'TAHSİLAT', icon: '💳' }
  ];

  // Basit arama destekli açılır liste (klavye destekli) - Modernize Edildi
  const SearchableSelect = ({
    options,
    value,
    onChange,
    placeholder,
    className = '',
  }: { options: { id: string; name: string }[]; value: string; onChange: (id: string) => void; placeholder: string; className?: string; }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlight, setHighlight] = useState(0);
    const selected = options.find(o => o.id === value);
    const display = open ? query : (selected?.name || '');
    
    const filtered = useMemo(() => {
      if (!query) return options.slice(0, 100);
      const lowerQuery = query.toLowerCase();
      return options
        .filter(o => o.name?.toLowerCase().includes(lowerQuery))
        .slice(0, 100);
    }, [options, query]);
    
    const handleSelect = (id: string) => { onChange(id); setOpen(false); setQuery(''); };
    return (
      <div className={`relative w-full ${className}`}>
        <div className="relative flex items-center bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700/50 rounded-lg transition-all duration-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
          <input
            type="text"
            value={display}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlight(0); }}
            onFocus={() => { setQuery(''); setOpen(true); setHighlight(0); }}
            onKeyDown={(e) => {
              if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { setOpen(true); e.preventDefault(); return; }
              if (!open) return;
              if (e.key === 'ArrowDown') { setHighlight(h => Math.min(h + 1, Math.max(filtered.length - 1, 0))); e.preventDefault(); }
              if (e.key === 'ArrowUp') { setHighlight(h => Math.max(h - 1, 0)); e.preventDefault(); }
              if (e.key === 'Enter') { const opt = filtered[highlight]; if (opt) handleSelect(opt.id); e.preventDefault(); }
              if (e.key === 'Escape') { setOpen(false); }
            }}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder={placeholder}
            className="w-full px-2 py-1.5 bg-transparent text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none"
          />
          <div className="pr-6 pointer-events-none text-gray-400">
            <svg className={`w-5 h-5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {open && (
          <div className="absolute left-0 right-0 mt-2 max-h-56 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[100] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">{filtered.length} sonuç</div>
            {filtered.map((opt, idx) => (
              <button
                type="button"
                key={opt.id}
                onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(opt.id)}
                className={`w-full text-left px-2 py-1 text-xs font-bold transition-colors duration-200 ${idx === highlight ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
              >
                {opt.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-5 py-4 text-xs font-bold text-gray-400 italic">Sonuç bulunamadı</div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex items-center justify-center transition-colors duration-200">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-gray-500 font-medium text-sm">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  // Yetki kontrolü
  if (!canEdit(Module.SEJOUR)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Erişim Reddedildi</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-1">Sejour düzenleme sayfasına erişim için yetkiniz bulunmuyor.</p>
          <button
            onClick={() => router.push('/sejour')}
            className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 bg-gray-50 dark:bg-[#030712] min-h-screen transition-all duration-300">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-1 animate-in fade-in slide-in-from-top-1 duration-500">
          <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-1 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Sejour Düzenle</h1>
                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 mt-0.5 uppercase tracking-widest">{salesData.voucherNumber || 'Yükleniyor...'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center disabled:opacity-70 disabled:cursor-wait"
              >
                {isGeneratingPDF ? (
                  <>
                    <svg className="animate-spin h-3 w-3 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    HAZIRLANIYOR...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF VOUCHER İNDİR
                  </>
                )}
              </button>
              <button
                onClick={() => router.push('/sejour')}
                className="px-6 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-[0.98] transition-all duration-200 shadow-sm"
              >
                Geri Dön
              </button>
            </div>
          </div>
        </div>

        {/* Status and Messages */}
        <div className="max-w-[1800px] mx-auto mb-2">
          {error && (
            <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-md border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-2 py-1.5 rounded-lg mb-1 flex items-center shadow-lg shadow-red-500/10 animate-in zoom-in-95 duration-300">
              <span className="mr-3 text-xl">⚠️</span>
              <p className="font-bold text-sm tracking-tight">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-emerald-50/80 dark:bg-emerald-900/20 backdrop-blur-md border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200 px-2 py-1.5 rounded-lg mb-1 flex items-center shadow-lg shadow-emerald-500/10 animate-in zoom-in-95 duration-300">
              <span className="mr-3 text-xl">✅</span>
              <p className="font-bold text-sm tracking-tight">{success}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="relative">
          {/* Main Navigation Tabs */}
          <div className="relative mb-2">
            <div className="flex p-1 space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm max-w-md mx-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center flex-1 px-2 py-1.5 text-xs font-black leading-5 rounded transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-2 text-base">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-[1800px] mx-auto pb-20">
            {/* Sales Tab */}
            {activeTab === 'sales' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Satış Bilgileri</h2>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700 mx-6"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 responsive-filter-grid">
                  {/* Left Column: General Info */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded p-2 shadow-sm transition-all duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 ml-1">Voucher Numarası *</label>
                            <input
                              type="text"
                              name="voucherNumber"
                              value={salesData.voucherNumber}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                              placeholder="VOU-2024-001"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 ml-1">Müşteri Tipi *</label>
                            <div className="flex p-1.5 bg-gray-100/50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                              <button
                                type="button"
                                onClick={() => handleInputChange({ target: { name: 'customerType', value: 'agency' } } as any)}
                                className={`flex-1 py-3 px-4 rounded text-xs font-black tracking-widest transition-all duration-300 ${
                                  salesData.customerType === 'agency'
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-700'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                              >
                                ACENTE
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInputChange({ target: { name: 'customerType', value: 'individual' } } as any)}
                                className={`flex-1 py-3 px-4 rounded text-xs font-black tracking-widest transition-all duration-300 ${
                                  salesData.customerType === 'individual'
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-700'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                              >
                                ŞAHIS
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div>
                            {salesData.customerType === 'agency' ? (
                              <>
                                <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 ml-1">Acente Seçimi *</label>
                                <SearchableSelect
                                  options={agencies}
                                  value={salesData.agencyId}
                                  onChange={(id) => handleInputChange({ target: { name: 'agencyId', value: id } } as any)}
                                  placeholder="Acente ara..."
                                  className="w-full"
                                />
                              </>
                            ) : (
                              <>
                                <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 ml-1">Müşteri Adı Soyadı *</label>
                                <input
                                  type="text"
                                  name="customerName"
                                  value={salesData.customerName}
                                  onChange={handleInputChange}
                                  className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                  placeholder="Örn: Ahmet Yılmaz"
                                />
                              </>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 responsive-filter-grid">
                            <div>
                              <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 ml-1">Giriş Tarihi *</label>
                              <input
                                type="date"
                                name="checkInDate"
                                value={salesData.checkInDate}
                                onChange={handleInputChange}
                                className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 ml-1">Çıkış Tarihi *</label>
                              <input
                                type="date"
                                name="checkOutDate"
                                value={salesData.checkOutDate}
                                onChange={handleInputChange}
                                className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
                        <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 ml-1">Rezervasyon Durumu</label>
                        <div className="flex flex-wrap gap-1">
                          {['BEKLEMEDE', 'KONFIRME', 'İPTAL'].map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleInputChange({ target: { name: 'status', value: status } } as any)}
                              className={`px-8 py-3 rounded-lg text-[10px] font-black tracking-widest transition-all duration-300 ${
                                salesData.status === status
                                  ? status === 'BEKLEMEDE' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 border-2 border-amber-200 dark:border-amber-800'
                                  : status === 'KONFIRME' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 border-2 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-600 border-2 border-red-200 dark:border-red-800'
                                  : 'bg-white dark:bg-gray-900 text-gray-400 border-2 border-gray-100 dark:border-gray-700 grayscale'
                              }`}
                            >
                              {status === 'BEKLEMEDE' ? '⏳ BEKLEMEDE' : status === 'KONFIRME' ? '✅ KONFIRME' : '❌ İPTAL'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Service Selection Quick Cards */}
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded p-2 shadow-sm">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Hizmet Seçimi</h3>
                      <div className="grid grid-cols-1 gap-1">
                        <button
                          type="button"
                          onClick={() => setShowAccommodation(!showAccommodation)}
                          className={`flex items-center justify-between p-1 rounded-lg border-2 transition-all duration-300 ${
                            showAccommodation 
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 shadow-lg shadow-blue-500/10' 
                              : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-400'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-xl mr-3">🏨</span>
                            <span className="text-xs font-black tracking-widest">KONAKLAMA</span>
                          </div>
                          {showAccommodation && <span className="text-blue-500">✓</span>}
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowFlight(!showFlight)}
                          className={`flex items-center justify-between p-1 rounded-lg border-2 transition-all duration-300 ${
                            showFlight 
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-500/10' 
                              : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-400'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-xl mr-3">✈️</span>
                            <span className="text-xs font-black tracking-widest">UÇUŞ BİLGİSİ</span>
                          </div>
                          {showFlight && <span className="text-emerald-500">✓</span>}
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowTransfer(!showTransfer)}
                          className={`flex items-center justify-between p-1 rounded-lg border-2 transition-all duration-300 ${
                            showTransfer 
                              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-600 shadow-lg shadow-purple-500/10' 
                              : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-400'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-xl mr-3">🚗</span>
                            <span className="text-xs font-black tracking-widest">TRANSFER</span>
                          </div>
                          {showTransfer && <span className="text-purple-500">✓</span>}
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowExtraServices(!showExtraServices)}
                          className={`flex items-center justify-between p-1 rounded-lg border-2 transition-all duration-300 ${
                            showExtraServices 
                              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500 text-orange-600 shadow-lg shadow-orange-500/10' 
                              : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-400'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-xl mr-3">✨</span>
                            <span className="text-xs font-black tracking-widest">EKSTRA HİZMET</span>
                          </div>
                          {showExtraServices && <span className="text-orange-500">✓</span>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accommodation Section */}
                {showAccommodation && (
                  <div className="bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900/30 rounded shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                    <div className="px-2 py-1.5 bg-blue-50/50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/20 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-lg shadow-blue-500/30">
                          <span className="text-lg">🏨</span>
                        </div>
                        <h3 className="text-[10px] font-black text-blue-900 dark:text-blue-100 tracking-widest uppercase">Konaklama Bilgileri</h3>
                      </div>
                      <button
                        type="button"
                        onClick={addRoom}
                        className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white text-xs font-black rounded hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                        Oda Ekle
                      </button>
                    </div>
                    
                    <div className="p-2 space-y-6">
                      {rooms.map((room, index) => (
                        <div key={room.id} className="group relative bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-lg p-2 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="inline-flex items-center px-4 py-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black tracking-widest uppercase border border-blue-100 dark:border-blue-800">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                              Oda {index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeRoom(room.id)}
                              className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 text-red-500 border border-red-50 dark:border-red-900/30 shadow-sm hover:bg-red-500 hover:text-white transition-all duration-200"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2 responsive-filter-grid">
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Otel Seçimi</label>
                              <SearchableSelect
                                options={hotels}
                                value={room.hotelId}
                                onChange={(id) => updateRoom(room.id, 'hotelId', id)}
                                placeholder="Otel ara..."
                                className="rounded-lg"
                              />
                            </div>
                            <div>
                               <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Konaklama Tipi</label>
                               <select
                                 className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                 value={room.accommodationType || ''}
                                 onChange={(e) => updateRoom(room.id, 'accommodationType', e.target.value)}
                               >
                                 <option value="">Seçin</option>
                                 {['SNG','DBL','TWN','TRP','QUAD','SNG+CHD','SNG+2CHD','DBL+CHD','DBL+2CHD','TRP+CHD','TRP+2CHD','QUAD+CHD','SNG+INF','DBL+INF','DBL+CHD+INF','TRP+INF'].map(t => (
                                   <option key={t} value={t}>{t}</option>
                                 ))}
                               </select>
                             </div>
                             <div>
                               <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Oda Tipi</label>
                               <select
                                 className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                 value={room.roomType}
                                 onChange={(e) => updateRoom(room.id, 'roomType', e.target.value)}
                               >
                                 <option value="">Seçin</option>
                                 {roomTypes.map(type => (
                                   <option key={type} value={type}>{type}</option>
                                 ))}
                               </select>
                             </div>
                             <div>
                               <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Misafir Bilgileri</label>
                               <input
                                 className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                 type="text"
                                 value={room.guestInfo}
                                 onChange={(e) => updateRoom(room.id, 'guestInfo', e.target.value)}
                                 placeholder="Örn: 2 Pax"
                               />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Satş Tutarı</label>
                                <div className="flex gap-1">
                                  <input
                                    className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-black text-blue-600 dark:text-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                    type="text"
                                    inputMode="decimal"
                                    value={servicePriceInput[room.id] ?? (room.price ? formatAmount(room.price) : '')}
                                    onChange={(e) => setServicePriceInput(prev => ({...prev, [room.id]: normalizeTyping(e.target.value)}))}
                                    onBlur={(e) => {
                                      const parsed = parseTrAmount(servicePriceInput[room.id] ?? e.target.value);
                                      if (parsed !== null) {
                                        updateRoom(room.id, 'price', parsed);
                                        setServicePriceInput(prev => ({...prev, [room.id]: formatAmount(parsed)}));
                                      }
                                    }}
                                  />
                                  <select
                                    className="w-20 px-2 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-black text-gray-900 dark:text-white transition-all duration-300 outline-none"
                                    value={room.currency}
                                    onChange={(e) => updateRoom(room.id, 'currency', e.target.value)}
                                  >
                                    <option value="TRY">TRY</option>
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="GBP">GBP</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))} 
                      </div>
                    </div>
                  )} 
                {showFlight && (
                  <div className="bg-white dark:bg-gray-800 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                    <div className="px-3 py-2 bg-emerald-50/60 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-900/20 flex flex-wrap gap-2 justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-lg shadow-emerald-500/30">
                          <span className="text-lg">✈️</span>
                        </div>
                        <h3 className="text-xs font-black text-emerald-900 dark:text-emerald-100 tracking-wide uppercase">Uçuş Bilgileri</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => addFlight('departure')}
                          className="inline-flex items-center px-3 py-2 bg-emerald-600 text-white text-xs font-black rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                          </svg>
                          Gidiş Uçuşu
                        </button>
                        <button
                          type="button"
                          onClick={() => addFlight('return')}
                          className="inline-flex items-center px-3 py-2 bg-emerald-600 text-white text-xs font-black rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                          </svg>
                          Dönüş Uçuşu
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-3 space-y-4">
                      {flights.map((flight, index) => (
                        <div key={flight.id} className="group relative bg-gray-50/60 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700 rounded-xl p-3 transition-all duration-300 hover:border-emerald-300 dark:hover:border-emerald-700">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                              flight.type === 'departure' 
                                ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                                : 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-2 ${flight.type === 'departure' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                              {flight.type === 'departure' ? '🚀 GİDİŞ UÇUŞU' : '🛬 DÖNÜŞ UÇUŞU'} {index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeFlight(flight.id)}
                              className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 text-red-500 border border-red-50 dark:border-red-900/30 shadow-sm hover:bg-red-500 hover:text-white transition-all duration-200"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                             <div>
                               <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Uçuş Tarihi</label>
                               <input
                                 type="date"
                                 value={flight.flightDate}
                                 onChange={(e) => updateFlight(flight.id, 'flightDate', e.target.value)}
                                 className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 outline-none"
                               />
                             </div>
                             <div>
                                <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Havayolu</label>
                                <input
                                  type="text"
                                  value={flight.airline}
                                  onChange={(e) => updateFlight(flight.id, 'airline', e.target.value)}
                                  className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 outline-none"
                                  placeholder="Örn: THY"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Güzergah</label>
                                <input
                                  type="text"
                                  value={flight.route}
                                  onChange={(e) => updateFlight(flight.id, 'route', e.target.value)}
                                  className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 outline-none"
                                  placeholder="Örn: IST-AYT"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Uçuş No</label>
                                <input
                                  type="text"
                                  value={flight.flightNo}
                                  onChange={(e) => updateFlight(flight.id, 'flightNo', e.target.value)}
                                  className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 outline-none"
                                  placeholder="Örn: TK1234"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Kalkış - Varış</label>
                                <div className="grid grid-cols-2 gap-1">
                                  <input
                                    type="time"
                                    value={flight.departureTime}
                                    onChange={(e) => updateFlight(flight.id, 'departureTime', e.target.value)}
                                    className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 outline-none"
                                  />
                                  <input
                                    type="time"
                                    value={flight.arrivalTime}
                                    onChange={(e) => updateFlight(flight.id, 'arrivalTime', e.target.value)}
                                    className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 outline-none"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Tedarikçi & PNR</label>
                                <div className="grid grid-cols-2 gap-1">
                                  <ComboBox
                                    options={suppliers.map((s: any) => ({ id: s.id, name: s.name }))}
                                    value={flight.ticketingProvider}
                                    onChange={(id) => updateFlight(flight.id, 'ticketingProvider', id)}
                                    placeholder="Seçin"
                                    className="rounded-lg h-9"
                                  />
                                  <input
                                    type="text"
                                    value={flight.pnr}
                                    onChange={(e) => updateFlight(flight.id, 'pnr', e.target.value)}
                                    className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 outline-none"
                                    placeholder="PNR"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Biletleme Tarihi</label>
                                <input
                                  type="date"
                                  value={flight.ticketingDate}
                                  onChange={(e) => updateFlight(flight.id, 'ticketingDate', e.target.value)}
                                  className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 outline-none"
                                />
                              </div>
                              <div className="xl:col-span-2">
                                <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Satış Tutarı</label>
                                <div className="flex gap-2">
                                  <input
                                    className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-black text-emerald-600 dark:text-emerald-400 text-right focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 outline-none h-9"
                                    type="text"
                                    inputMode="decimal"
                                    value={servicePriceInput[`flight_${flight.id}`] ?? (flight.price ? formatAmount(flight.price) : '')}
                                    onChange={(e) => setServicePriceInput(prev => ({...prev, [`flight_${flight.id}`]: normalizeTyping(e.target.value)}))}
                                    onBlur={(e) => {
                                      const parsed = parseTrAmount(servicePriceInput[`flight_${flight.id}`] ?? e.target.value);
                                      if (parsed !== null) {
                                        updateFlight(flight.id, 'price', parsed);
                                        setServicePriceInput(prev => ({...prev, [`flight_${flight.id}`]: formatAmount(parsed)}));
                                      }
                                    }}
                                  />
                                  <select
                                    className="w-20 px-1 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-black text-gray-900 dark:text-white transition-all duration-300 outline-none h-9"
                                    value={flight.currency}
                                    onChange={(e) => updateFlight(flight.id, 'currency', e.target.value)}
                                  >
                                    <option value="TRY">TRY</option>
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="GBP">GBP</option>
                                  </select>
                                </div>
                              </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                   {/* Transfer Information */}
                {showTransfer && (
                  <div className="bg-white dark:bg-gray-800 border-2 border-purple-100 dark:border-purple-900/30 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                    <div className="px-3 py-2 bg-purple-50/60 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-900/20 flex flex-wrap gap-2 justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-lg shadow-purple-500/30">
                          <span className="text-lg">🚗</span>
                        </div>
                        <h3 className="text-xs font-black text-purple-900 dark:text-purple-100 tracking-wide uppercase">Transfer Bilgileri</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => addTransfer('arrival')}
                          className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-xs font-black rounded-lg hover:bg-purple-700 active:scale-[0.98] transition-all duration-200"
                        >
                          + Geliş
                        </button>
                        <button
                          type="button"
                          onClick={() => addTransfer('return')}
                          className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-xs font-black rounded-lg hover:bg-purple-700 active:scale-[0.98] transition-all duration-200"
                        >
                          + Dönüş
                        </button>
                        <button
                          type="button"
                          onClick={() => addTransfer('intermediate')}
                          className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-xs font-black rounded-lg hover:bg-purple-700 active:scale-[0.98] transition-all duration-200"
                        >
                          + Ara
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-3 space-y-4">
                      {transfers.map((transfer, index) => (
                        <div key={transfer.id} className="group relative bg-gray-50/60 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700 rounded-xl p-3 transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-700">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="inline-flex items-center px-3 py-1 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-black tracking-widest uppercase border border-purple-100 dark:border-purple-800">
                              <span className="w-1 h-1 bg-purple-500 rounded-full mr-2"></span>
                              {transfer.direction === 'arrival' ? '🛫 GELİŞ' : (transfer.direction === 'return' ? '🛬 DÖNÜŞ' : '🔄 ARA')} TRANSFER {index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeTransfer(transfer.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 text-red-500 border border-red-50 dark:border-red-900/30 shadow-sm hover:bg-red-500 hover:text-white transition-all duration-200"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Tarih</label>
                              <input
                                className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                type="date"
                                value={transfer.date}
                                onChange={(e) => updateTransfer(transfer.id, 'date', e.target.value)}
                              />
                            </div>
                            <div className="xl:col-span-2">
                              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Tedarikçi</label>
                              <ComboBox
                                options={suppliers.map((s: any) => ({ id: s.id, name: s.name }))}
                                value={transfer.provider}
                                onChange={(id) => updateTransfer(transfer.id, 'provider', id)}
                                placeholder="Tedarikçi ara..."
                                className="rounded-lg"
                              />
                            </div>
                            <div className="md:col-span-1">
                               <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Tip</label>
                               <select
                                className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white transition-all duration-300 outline-none"
                                 value={transfer.type}
                                 onChange={(e) => updateTransfer(transfer.id, 'type', e.target.value)}
                               >
                                 <option value="private">Özel</option>
                                 <option value="economic">Ekonomik</option>
                               </select>
                             </div>
                             <div className="md:col-span-1">
                               <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Araç</label>
                               <select
                                className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white transition-all duration-300 outline-none"
                                 value={transfer.vehicle}
                                 onChange={(e) => updateTransfer(transfer.id, 'vehicle', e.target.value)}
                               >
                                 <option value="">Seçin</option>
                                 {vehicleTypes.map(type => (
                                   <option key={type} value={type}>{type}</option>
                                 ))}
                               </select>
                             </div>
                            <div>
                              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Saat</label>
                              <input
                                className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                type="time"
                                value={transfer.time}
                                onChange={(e) => updateTransfer(transfer.id, 'time', e.target.value)}
                              />
                            </div>
                            <div>
                               <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Satış Tutarı</label>
                               <div className="flex gap-2">
                                 <input
                                   className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-black text-purple-600 dark:text-purple-400 focus:ring-4 focus:ring-purple-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                   type="text"
                                   inputMode="decimal"
                                   value={servicePriceInput[`transfer_${transfer.id}`] ?? (transfer.price ? formatAmount(transfer.price) : '')}
                                   onChange={(e) => setServicePriceInput(prev => ({...prev, [`transfer_${transfer.id}`]: normalizeTyping(e.target.value)}))}
                                   onBlur={(e) => {
                                     const parsed = parseTrAmount(servicePriceInput[`transfer_${transfer.id}`] ?? e.target.value);
                                     if (parsed !== null) {
                                       updateTransfer(transfer.id, 'price', parsed);
                                       setServicePriceInput(prev => ({...prev, [`transfer_${transfer.id}`]: formatAmount(parsed)}));
                                     }
                                   }}
                                 />
                                 <select
                                  className="w-20 px-1 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-black text-gray-900 dark:text-white transition-all duration-300 outline-none"
                                   value={transfer.currency}
                                   onChange={(e) => updateTransfer(transfer.id, 'currency', e.target.value)}
                                 >
                                   <option value="TRY">TRY</option>
                                   <option value="EUR">EUR</option>
                                   <option value="USD">USD</option>
                                   <option value="GBP">GBP</option>
                                 </select>
                               </div>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Extra Services Information */}
                {showExtraServices && (
                  <div className="bg-white dark:bg-gray-800 border-2 border-orange-100 dark:border-orange-900/30 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                    <div className="px-3 py-2 bg-orange-50/60 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-900/20 flex flex-wrap gap-2 justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-lg shadow-orange-500/30">
                          <span className="text-lg">✨</span>
                        </div>
                        <h3 className="text-xs font-black text-orange-900 dark:text-orange-100 tracking-wide uppercase">Ekstra Hizmetler</h3>
                      </div>
                      <button
                        type="button"
                        onClick={addExtraService}
                        className="inline-flex items-center px-3 py-2 bg-orange-600 text-white text-xs font-black rounded-lg hover:bg-orange-700 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                        Hizmet Ekle
                      </button>
                    </div>
                    
                    <div className="p-3 space-y-4">
                      {extraServices.map((service, index) => (
                        <div key={service.id} className="group relative bg-gray-50/60 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700 rounded-xl p-3 transition-all duration-300 hover:border-orange-300 dark:hover:border-orange-700">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="inline-flex items-center px-3 py-1 bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-full text-[10px] font-black tracking-widest uppercase border border-orange-100 dark:border-orange-800">
                              <span className="w-1 h-1 bg-orange-500 rounded-full mr-2"></span>
                              HİZMET {index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeExtraService(service.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 text-red-500 border border-red-50 dark:border-red-900/30 shadow-sm hover:bg-red-500 hover:text-white transition-all duration-200"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3">
                             <div className="xl:col-span-3">
                               <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Hizmet Tipi</label>
                               <select
                                 value={service.serviceType || ''}
                                 onChange={(e) => updateExtraService(service.id, 'serviceType', e.target.value)}
                                 className="w-full px-3 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px] font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all duration-300 outline-none h-9"
                               >
                                 <option value="">Seçin</option>
                                 {supplierServiceTypes.map(type => (
                                   <option key={type.id} value={type.id}>{type.name}</option>
                                 ))}
                               </select>
                             </div>
                             <div className="xl:col-span-3">
                               <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Tedarikçi</label>
                               <ComboBox
                                 options={suppliers.map((s: any) => ({ id: s.id, name: s.name }))}
                                 value={service.provider || ''}
                                 onChange={(id) => updateExtraService(service.id, 'provider', id)}
                                 placeholder="Tedarikçi..."
                                 className="rounded h-9"
                               />
                             </div>
                             <div className="xl:col-span-4">
                                <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Açıklama</label>
                                <input
                                  type="text"
                                  value={service.description || ''}
                                  onChange={(e) => updateExtraService(service.id, 'description', e.target.value)}
                                  className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all duration-300 outline-none h-9"
                                  placeholder="Örn: Rehberlik"
                                />
                              </div>
                             <div className="xl:col-span-2">
                               <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Satış Tutarı</label>
                               <div className="flex gap-2">
                                 <input
                                   className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-black text-orange-600 dark:text-orange-400 text-right focus:ring-4 focus:ring-orange-500/10 focus:border-blue-500 transition-all duration-300 outline-none h-9"
                                   type="text"
                                   inputMode="decimal"
                                   value={servicePriceInput[`extra_${service.id}`] ?? (service.price ? formatAmount(service.price) : '')}
                                   onChange={(e) => setServicePriceInput(prev => ({...prev, [`extra_${service.id}`]: normalizeTyping(e.target.value)}))}
                                   onBlur={(e) => {
                                     const parsed = parseTrAmount(servicePriceInput[`extra_${service.id}`] ?? e.target.value);
                                     if (parsed !== null) {
                                       updateExtraService(service.id, 'price', parsed);
                                       setServicePriceInput(prev => ({...prev, [`extra_${service.id}`]: formatAmount(parsed)}));
                                     }
                                   }}
                                 />
                                 <select
                                   className="w-20 px-1 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-black text-gray-900 dark:text-white transition-all duration-300 outline-none h-9"
                                   value={service.currency}
                                   onChange={(e) => updateExtraService(service.id, 'currency', e.target.value)}
                                 >
                                   <option value="TRY">TRY</option>
                                   <option value="EUR">EUR</option>
                                   <option value="USD">USD</option>
                                   <option value="GBP">GBP</option>
                                 </select>
                               </div>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary Section */}
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded p-2 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[9px] font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest ml-1">Özet ve Toplamlar</h3>
                    <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700 mx-8"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 responsive-filter-grid">
                    <div className="bg-blue-600 p-1 rounded-lg text-white shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xl">💰</span>
                        <span className="text-[10px] font-black tracking-widest opacity-80 uppercase">Toplam Satış</span>
                      </div>
                      <div className="space-y-1">
                        {['TRY', 'EUR', 'USD', 'GBP'].map(curr => {
                            const total = getTotalForCurrency(curr);
                            if (total === 0) return null;
                            return (
                                <div key={curr} className="flex justify-between items-center bg-white/10 px-3 py-1.5 rounded backdrop-blur-md">
                                    <span className="text-[10px] font-black opacity-80">{curr}</span>
                                    <span className="text-sm font-black tracking-tight">{formatAmount(total)}</span>
                                </div>
                            );
                        })}
                        {['TRY', 'EUR', 'USD', 'GBP'].every(curr => getTotalForCurrency(curr) === 0) && (
                            <p className="text-sm font-black opacity-60">0.00</p>
                        )}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 p-1 rounded shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">🏨</span>
                        <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Konaklama</span>
                      </div>
                      <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{rooms.length}</p>
                      <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-widest mt-1">ODA TOPLAMI</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 p-1 rounded shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">✈️</span>
                        <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Uçuş</span>
                      </div>
                      <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{flights.length}</p>
                      <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-widest mt-1">UÇUŞ TOPLAMI</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 p-1 rounded shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">🚗</span>
                        <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Transfer</span>
                      </div>
                      <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{transfers.length}</p>
                      <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 tracking-widest mt-1">TRANSFER TOPLAMI</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase Tab */}
            {activeTab === 'purchase' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Alış ve Maliyet Yönetimi</h2>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700 mx-8"></div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded p-2 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 responsive-filter-grid">
                    <div>
                      <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 ml-1">Voucher Numarası</label>
                      <div className="px-2 py-1 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent rounded-lg text-xs text-gray-500 dark:text-gray-400 select-none cursor-not-allowed">
                        {salesData.voucherNumber}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 ml-1">Acente</label>
                      <div className="px-2 py-1 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent rounded-lg text-xs text-gray-500 dark:text-gray-400 select-none cursor-not-allowed truncate">
                        {agencies.find(a => a.id === salesData.agencyId)?.name || '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 ml-1">Konaklama Tarihleri</label>
                      <div className="px-2 py-1 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent rounded-lg text-xs text-gray-500 dark:text-gray-400 select-none cursor-not-allowed">
                        {salesData.checkInDate} / {salesData.checkOutDate}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 ml-1">Rezervasyon Durumu</label>
                      <div className={`px-2 py-1 border-2 border-transparent rounded-lg text-[10px] font-black tracking-widest uppercase select-none cursor-not-allowed inline-flex items-center ${
                        salesData.status === 'KONFIRME' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {salesData.status}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accommodation Costs */}
                {showAccommodation && (
                  <div className="bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900/30 rounded shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 delay-150">
                    <div className="px-2 py-1.5 bg-blue-50/50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/20 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-lg shadow-blue-500/30">
                          <span className="text-lg">🏨</span>
                        </div>
                        <h3 className="text-[10px] font-black text-blue-900 dark:text-blue-100 tracking-widest uppercase">Konaklama Maliyetleri</h3>
                      </div>
                      <span className="text-[10px] font-black text-blue-500 tracking-widest uppercase bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-full">DÜZENLENEBİLİR</span>
                    </div>
                    
                    <div className="p-2 space-y-6">
                      {rooms.map((room, index) => (
                        <div key={room.id} className="group relative bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-lg p-2 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="inline-flex items-center px-4 py-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black tracking-widest uppercase border border-blue-100 dark:border-blue-800">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                              ODA {index + 1} - {hotels.find(h => h.id === room.hotelId)?.name || 'Bilinmeyen Otel'}
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 responsive-filter-grid">
                            <div className="opacity-60 bg-white/50 dark:bg-gray-800/50 p-1 rounded-lg border border-gray-100 dark:border-gray-700">
                                <label className="block text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Misafir & Oda Tipi</label>
                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{room.guestInfo || '-'} / {room.roomType || '-'}</p>
                            </div>
                            <div className="opacity-60 bg-white/50 dark:bg-gray-800/50 p-1 rounded-lg border border-gray-100 dark:border-gray-700">
                                <label className="block text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Satış Tutarı</label>
                                <p className="text-xs font-black text-gray-900 dark:text-white">{formatAmount(room.price)} {room.currency}</p>
                            </div>
                            <div>
                               <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 ml-1">Maliyet Tutarı</label>
                               <div className="flex gap-1">
                                 <input
                                   className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 border-2 border-blue-50 dark:border-blue-900/30 rounded-lg text-xs font-black text-blue-600 dark:text-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                   type="text"
                                   inputMode="decimal"
                                   value={servicePriceInput[`room_cost_${room.id}`] ?? (room.costPrice ? formatAmount(room.costPrice) : '')}
                                   onChange={(e) => setServicePriceInput(prev => ({...prev, [`room_cost_${room.id}`]: normalizeTyping(e.target.value)}))}
                                   onBlur={(e) => {
                                     const parsed = parseTrAmount(servicePriceInput[`room_cost_${room.id}`] ?? e.target.value);
                                     if (parsed !== null) {
                                       updateRoom(room.id, 'costPrice', parsed);
                                       setServicePriceInput(prev => ({...prev, [`room_cost_${room.id}`]: formatAmount(parsed)}));
                                     }
                                   }}
                                 />
                                 <select
                                   className="w-20 px-2 py-3 bg-white dark:bg-gray-800 border-2 border-blue-50 dark:border-blue-900/30 rounded-lg text-[10px] font-black text-gray-900 dark:text-white transition-all duration-300 outline-none"
                                   value={room.costCurrency || room.currency}
                                   onChange={(e) => updateRoom(room.id, 'costCurrency', e.target.value)}
                                 >
                                   <option value="TRY">TRY</option>
                                   <option value="EUR">EUR</option>
                                   <option value="USD">USD</option>
                                   <option value="GBP">GBP</option>
                                 </select>
                               </div>
                             </div>
                             <div className="flex flex-col justify-center px-6 py-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                                <label className="block text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Tahmini Kar</label>
                                <p className={`text-base font-black ${ (room.price - (room.costPrice || 0)) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500' }`}>
                                    {room.currency === (room.costCurrency || room.currency) 
                                        ? `${formatAmount(room.price - (room.costPrice || 0))} ${room.currency}`
                                        : 'Farka Bakın'
                                    }
                                </p>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {showFlight && (
                  <div className="bg-white dark:bg-gray-800 border-2 border-emerald-100 dark:border-emerald-900/30 rounded shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 delay-200">
                    <div className="px-2 py-1.5 bg-emerald-50/50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-900/20 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-lg shadow-emerald-500/30">
                          <span className="text-lg">✈️</span>
                        </div>
                        <h3 className="text-[10px] font-black text-emerald-900 dark:text-emerald-100 tracking-widest uppercase">Uçuş Maliyetleri</h3>
                      </div>
                    </div>
                    
                    <div className="p-2 space-y-6">
                      {flights.map((flight, index) => (
                        <div key={flight.id} className="group relative bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-lg p-2 transition-all duration-300 hover:border-emerald-300 dark:hover:border-emerald-700">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="inline-flex items-center px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black tracking-widest uppercase border border-emerald-100 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                              {flight.type === 'departure' ? 'GİDİŞ' : 'DÖNÜŞ'} {index + 1} - {flight.airline} ({flight.pnr || 'PNR Yok'})
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 responsive-filter-grid">
                            <div className="opacity-60 bg-white/50 dark:bg-gray-800/50 p-1 rounded-lg border border-gray-100 dark:border-gray-700">
                              <label className="block text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Satış Tutarı</label>
                                <p className="text-xs font-black text-gray-900 dark:text-white">{formatAmount(flight.price)} {flight.currency}</p>
                            </div>
                            <div>
                               <label className="block text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 ml-1">Maliyet Tutarı</label>
                               <div className="flex gap-1">
                                 <input
                                   className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 border-2 border-emerald-50 dark:border-emerald-900/30 rounded-lg text-xs font-black text-emerald-600 dark:text-emerald-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                   type="text"
                                   inputMode="decimal"
                                   value={servicePriceInput[`flight_cost_${flight.id}`] ?? (flight.costPrice !== undefined && flight.costPrice !== null ? formatAmount(flight.costPrice) : '')}
                                   onChange={(e) => setServicePriceInput(prev => ({...prev, [`flight_cost_${flight.id}`]: normalizeTyping(e.target.value)}))}
                                   onBlur={(e) => {
                                     const parsed = parseTrAmount(servicePriceInput[`flight_cost_${flight.id}`] ?? e.target.value);
                                     if (parsed !== null) {
                                       updateFlight(flight.id, 'costPrice', parsed);
                                       setServicePriceInput(prev => ({...prev, [`flight_cost_${flight.id}`]: formatAmount(parsed)}));
                                     }
                                   }}
                                 />
                                 <select
                                   className="w-20 px-2 py-3 bg-white dark:bg-gray-800 border-2 border-emerald-50 dark:border-emerald-900/30 rounded-lg text-[10px] font-black text-gray-900 dark:text-white transition-all duration-300 outline-none"
                                   value={flight.costCurrency || flight.currency}
                                   onChange={(e) => updateFlight(flight.id, 'costCurrency', e.target.value)}
                                 >
                                   <option value="TRY">TRY</option>
                                   <option value="EUR">EUR</option>
                                   <option value="USD">USD</option>
                                   <option value="GBP">GBP</option>
                                 </select>
                               </div>
                             </div>
                             <div className="flex flex-col justify-center px-6 py-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
                                <label className="block text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Tahmini Kar</label>
                                <p className={`text-base font-black ${ (flight.price - (flight.costPrice || 0)) >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500' }`}>
                                    {flight.currency === (flight.costCurrency || flight.currency) 
                                        ? `${formatAmount(flight.price - (flight.costPrice || 0))} ${flight.currency}`
                                        : 'Farka Bakın'
                                    }
                                </p>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                 {/* Transfer Costs */}
                {showTransfer && (
                  <div className="bg-white dark:bg-gray-800 border-2 border-purple-100 dark:border-purple-900/30 rounded shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 delay-300">
                    <div className="px-10 py-6 bg-purple-50/50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-900/20 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-600 rounded flex items-center justify-center text-white mr-4 shadow-lg shadow-purple-500/30">
                          <span className="text-xl">🚗</span>
                        </div>
                        <h3 className="text-sm font-black text-purple-900 dark:text-purple-100 tracking-widest uppercase">Transfer Maliyetleri</h3>
                      </div>
                      <span className="text-[10px] font-black text-purple-500 tracking-widest uppercase bg-purple-100 dark:bg-purple-900/40 px-3 py-1 rounded-full">DÜZENLENEBİLİR</span>
                    </div>
                    
                    <div className="p-2 space-y-8">
                      {transfers.map((transfer, index) => (
                        <div key={transfer.id} className="group relative bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-lg p-2 transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-700">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="inline-flex items-center px-4 py-1.5 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-black tracking-widest uppercase border border-purple-100 dark:border-purple-800">
                              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></span>
                              {transfer.direction === 'arrival' ? 'VARİS' : (transfer.direction === 'return' ? 'DÖNÜŞ' : 'ARA')} {index + 1} - {transfer.vehicle}
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 responsive-filter-grid">
                            <div className="opacity-60 bg-white/50 dark:bg-gray-800/50 p-1 rounded-lg border border-gray-100 dark:border-gray-700">
                                <label className="block text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Tarih & Saat</label>
                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{transfer.date} / {transfer.time}</p>
                            </div>
                            <div className="opacity-60 bg-white/50 dark:bg-gray-800/50 p-1 rounded-lg border border-gray-100 dark:border-gray-700">
                                <label className="block text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Satış Tutarı</label>
                                <p className="text-xs font-black text-gray-900 dark:text-white">{formatAmount(transfer.price)} {transfer.currency}</p>
                            </div>
                            <div>
                               <label className="block text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2 ml-1">Maliyet Tutarı</label>
                               <div className="flex gap-1">
                                 <input
                                   className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 border-2 border-purple-50 dark:border-blue-900/30 rounded-lg text-xs font-black text-purple-600 dark:text-purple-400 focus:ring-4 focus:ring-purple-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                   type="text"
                                   inputMode="decimal"
                                   value={servicePriceInput[`transfer_cost_${transfer.id}`] ?? (transfer.costPrice ? formatAmount(transfer.costPrice) : '')}
                                   onChange={(e) => setServicePriceInput(prev => ({...prev, [`transfer_cost_${transfer.id}`]: normalizeTyping(e.target.value)}))}
                                   onBlur={(e) => {
                                     const parsed = parseTrAmount(servicePriceInput[`transfer_cost_${transfer.id}`] ?? e.target.value);
                                     if (parsed !== null) {
                                       updateTransfer(transfer.id, 'costPrice', parsed);
                                       setServicePriceInput(prev => ({...prev, [`transfer_cost_${transfer.id}`]: formatAmount(parsed)}));
                                     }
                                   }}
                                 />
                                 <select
                                   className="w-20 px-2 py-3 bg-white dark:bg-gray-800 border-2 border-purple-50 dark:border-blue-900/30 rounded-lg text-[10px] font-black transition-all duration-300 outline-none"
                                   value={transfer.costCurrency || transfer.currency}
                                   onChange={(e) => updateTransfer(transfer.id, 'costCurrency', e.target.value)}
                                 >
                                   <option value="TRY">TRY</option>
                                   <option value="EUR">EUR</option>
                                   <option value="USD">USD</option>
                                   <option value="GBP">GBP</option>
                                 </select>
                               </div>
                             </div>
                             <div className="flex flex-col justify-center px-6 py-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/20">
                                <label className="block text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Tahmini Kar</label>
                                <p className={`text-base font-black ${ (transfer.price - (transfer.costPrice || 0)) >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-500' }`}>
                                    {transfer.currency === (transfer.costCurrency || transfer.currency) 
                                        ? `${formatAmount(transfer.price - (transfer.costPrice || 0))} ${transfer.currency}`
                                        : 'Farka Bakın'
                                    }
                                </p>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extra Services Costs */}
                {showExtraServices && (
                  <div className="bg-white dark:bg-gray-800 border-2 border-orange-100 dark:border-orange-900/30 rounded shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 delay-400 mt-8">
                    <div className="px-2 py-1.5 bg-orange-50/50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-900/20 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-lg shadow-orange-500/30">
                          <span className="text-lg">✨</span>
                        </div>
                        <h3 className="text-[10px] font-black text-orange-900 dark:text-orange-100 tracking-widest uppercase">Ekstra Hizmet Maliyetleri</h3>
                      </div>
                      <span className="text-[10px] font-black text-orange-500 tracking-widest uppercase bg-orange-100 dark:bg-orange-900/40 px-3 py-1 rounded-full">DÜZENLENEBİLİR</span>
                    </div>
                    
                    <div className="p-2 space-y-6">
                      {extraServices.map((service, index) => (
                        <div key={service.id} className="group relative bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-lg p-2 transition-all duration-300 hover:border-orange-300 dark:hover:border-orange-700">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="inline-flex items-center px-4 py-1.5 bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-full text-[10px] font-black tracking-widest uppercase border border-orange-100 dark:border-orange-800">
                              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></span>
                              HİZMET {index + 1} - {service.description || 'Aciklama Yok'}
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 responsive-filter-grid">
                            <div className="opacity-60 bg-white/50 dark:bg-gray-800/50 p-1 rounded-lg border border-gray-100 dark:border-gray-700">
                                <label className="block text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Hizmet Tipi</label>
                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                    {supplierServiceTypes.find(t => t.id === service.serviceType)?.name || 'Bilinmiyor'}
                                </p>
                            </div>
                            <div className="opacity-60 bg-white/50 dark:bg-gray-800/50 p-1 rounded-lg border border-gray-100 dark:border-gray-700">
                                <label className="block text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Satış Tutarı</label>
                                <p className="text-xs font-black text-gray-900 dark:text-white">{formatAmount(service.price)} {service.currency}</p>
                            </div>
                            <div>
                               <label className="block text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2 ml-1">Maliyet Tutarı</label>
                               <div className="flex gap-1">
                                 <input
                                   className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 border-2 border-orange-50 dark:border-orange-900/30 rounded-lg text-xs font-black text-orange-600 dark:text-orange-400 focus:ring-4 focus:ring-orange-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                   type="text"
                                   inputMode="decimal"
                                   value={servicePriceInput[`extra_cost_${service.id}`] ?? (service.costPrice ? formatAmount(service.costPrice) : '')}
                                   onChange={(e) => setServicePriceInput(prev => ({...prev, [`extra_cost_${service.id}`]: normalizeTyping(e.target.value)}))}
                                   onBlur={(e) => {
                                     const parsed = parseTrAmount(servicePriceInput[`extra_cost_${service.id}`] ?? e.target.value);
                                     if (parsed !== null) {
                                       updateExtraService(service.id, 'costPrice', parsed);
                                       setServicePriceInput(prev => ({...prev, [`extra_cost_${service.id}`]: formatAmount(parsed)}));
                                     }
                                   }}
                                 />
                                 <select
                                   className="w-20 px-2 py-3 bg-white dark:bg-gray-800 border-2 border-orange-50 dark:border-orange-900/30 rounded-lg text-[10px] font-black text-gray-900 dark:text-white transition-all duration-300 outline-none"
                                   value={service.costCurrency || service.currency}
                                   onChange={(e) => updateExtraService(service.id, 'costCurrency', e.target.value)}
                                 >
                                   <option value="TRY">TRY</option>
                                   <option value="EUR">EUR</option>
                                   <option value="USD">USD</option>
                                   <option value="GBP">GBP</option>
                                 </select>
                               </div>
                             </div>
                             <div className="flex flex-col justify-center px-6 py-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/20">
                                <label className="block text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Tahmini Kar</label>
                                <p className={`text-base font-black ${ (service.price - (service.costPrice || 0)) >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500' }`}>
                                    {service.currency === (service.costCurrency || service.currency) 
                                        ? `${formatAmount(service.price - (service.costPrice || 0))} ${service.currency}`
                                        : 'Farka Bakın'
                                    }
                                </p>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Collections Tab */}
            {activeTab === 'collections' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Tahsilat ve Odeme Yönetimi</h2>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700 mx-8"></div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded shadow-sm overflow-hidden">
                  <div className="px-2 py-1.5 bg-blue-50/50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/20 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-lg shadow-blue-500/30">
                        <span className="text-lg">💳</span>
                      </div>
                      <h3 className="text-[10px] font-black text-blue-900 dark:text-blue-100 tracking-widest uppercase">Tahsilat Kayıtları</h3>
                    </div>
                    <button
                      type="button"
                      onClick={addCollection}
                      className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white text-xs font-black rounded hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                      </svg>
                      TAHSİLAT EKLE
                    </button>
                  </div>
                  
                  <div className="p-1 space-y-4">
                    {collections.map((collection, index) => (
                      <div key={collection.id} className="group relative flex items-center gap-1 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-lg p-1 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700">
                        <div className="flex-none w-12 h-12 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-[10px] font-black text-blue-600 dark:text-blue-400 shadow-sm border border-blue-50 dark:border-blue-900/30">
                          {index + 1}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-1 responsive-filter-grid">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Kayıt Tarihi</label>
                            <input
                              type="date"
                              className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                              value={collection.date}
                              onChange={(e) => updateCollection(collection.id, 'date', e.target.value)}
                            />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Ödeme Yöntemi</label>
                             <select
                               className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white transition-all duration-300 outline-none"
                               value={collection.type || 'cash'}
                               onChange={(e) => updateCollection(collection.id, 'type', e.target.value)}
                             >
                               <option value="bank">Banka Transferi</option>
                               <option value="cash">Nakit</option>
                               <option value="card">Kredi Kartı</option>
                               <option value="cheque">Çek / Senet</option>
                             </select>
                           </div>
                          <div>
                             <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Tutar & Döviz</label>
                             <div className="flex gap-1">
                               <input
                                 className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-black text-blue-600 dark:text-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                 type="text"
                                 inputMode="decimal"
                                 value={servicePriceInput[`collection_${collection.id}`] ?? (collection.amount !== undefined && collection.amount !== null ? formatAmount(collection.amount) : '')}
                                 onChange={(e) => setServicePriceInput(prev => ({...prev, [`collection_${collection.id}`]: normalizeTyping(e.target.value)}))}
                                 onBlur={(e) => {
                                   const parsed = parseTrAmount(servicePriceInput[`collection_${collection.id}`] ?? e.target.value);
                                   if (parsed !== null) {
                                     updateCollection(collection.id, 'amount', parsed);
                                     setServicePriceInput(prev => ({...prev, [`collection_${collection.id}`]: formatAmount(parsed)}));
                                   }
                                 }}
                               />
                               <select
                                 className="w-20 px-2 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-black text-gray-900 dark:text-white transition-all duration-300 outline-none"
                                 value={collection.currency}
                                 onChange={(e) => updateCollection(collection.id, 'currency', e.target.value)}
                               >
                                 <option value="TRY">TRY</option>
                                 <option value="EUR">EUR</option>
                                 <option value="USD">USD</option>
                                 <option value="GBP">GBP</option>
                               </select>
                             </div>
                           </div>
                           <div>
                             <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Referans / Not</label>
                             <input
                               type="text"
                               className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                               placeholder="Orn: Dekont no..."
                               value={collection.note || ''}
                               onChange={(e) => updateCollection(collection.id, 'note', e.target.value)}
                             />
                           </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCollection(collection.id)}
                          className="w-12 h-12 flex-none flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 text-red-500 border border-red-50 dark:border-red-900/30 shadow-sm hover:bg-red-500 hover:text-white transition-all duration-200"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Collection Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-8 responsive-filter-grid">
                    <div className="bg-blue-600 p-2 rounded text-white shadow-xl shadow-blue-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xl">💰</span>
                            <span className="text-[10px] font-black tracking-widest opacity-80 uppercase">Toplam Satış</span>
                        </div>
                        <div className="space-y-1.5">
                            {['TRY', 'EUR', 'USD', 'GBP'].map(curr => {
                                const total = getTotalForCurrency(curr);
                                if (total === 0) return null;
                                return (
                                    <div key={curr} className="flex justify-between items-center bg-white/20 px-3 py-1.5 rounded border border-white/10">
                                        <span className="text-[10px] font-black opacity-80">{curr}</span>
                                        <span className="text-sm font-black">{formatAmount(total)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="bg-emerald-600 p-2 rounded text-white shadow-xl shadow-emerald-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xl">✅</span>
                            <span className="text-[10px] font-black tracking-widest opacity-80 uppercase">Toplam Tahsilat</span>
                        </div>
                        <div className="space-y-1.5">
                            {['TRY', 'EUR', 'USD', 'GBP'].map(curr => {
                                const coll = calculateTotalCollectionsByCurrency(curr);
                                if (coll === 0) return null;
                                return (
                                    <div key={curr} className="flex justify-between items-center bg-white/20 px-3 py-1.5 rounded border border-white/10">
                                        <span className="text-[10px] font-black opacity-80">{curr}</span>
                                        <span className="text-sm font-black">{formatAmount(coll)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="bg-gray-900 dark:bg-black p-2 rounded text-white shadow-xl shadow-black/20">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xl">⚖️</span>
                            <span className="text-[10px] font-black tracking-widest opacity-80 uppercase">Kalan Bakiye</span>
                        </div>
                        <div className="space-y-1.5">
                            {['TRY', 'EUR', 'USD', 'GBP'].map(curr => {
                                const bal = calculateBalanceByCurrency(curr);
                                if (bal === 0 && getTotalForCurrency(curr) === 0) return null;
                                return (
                                    <div key={curr} className="flex justify-between items-center bg-white/20 px-3 py-1.5 rounded border border-white/10">
                                        <span className="text-[10px] font-black opacity-80">{curr}</span>
                                        <span className={`text-sm font-black ${bal <= 0 ? (bal < 0 ? 'text-red-400' : 'text-emerald-400') : 'text-amber-400'}`}>
                                            {formatAmount(bal)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 mt-10">
            <button
              type="button"
              onClick={() => router.push('/sejour')}
              className="w-full md:w-auto flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-black tracking-widest rounded border-2 border-gray-50 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              VAZGEÇ
            </button>
            <div className="w-full md:w-auto flex flex-col md:flex-row gap-1 items-center">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto group relative px-12 py-4 bg-blue-600 text-white text-xs font-black tracking-widest rounded shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center">
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      GÜNCELLENİYOR...
                    </>
                  ) : (
                    <>
                      SEJOUR GÜNCELLE
                      <svg className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </form>

        {/* PDF Voucher - Gizli bölüm (Capture için off-screen) */}
      <div 
        ref={voucherRef} 
        className="absolute pointer-events-none" 
        style={{ 
          position: 'absolute',
          left: '-9999px', 
          top: '0', 
          width: '210mm', 
          backgroundColor: 'white',
          color: '#1a1a1a',
          fontFamily: "'Inter', system-ui, sans-serif",
          zIndex: -100
        }}
      >
        <div className="bg-white px-10 py-12 w-full min-h-[297mm] text-gray-900" style={{fontFamily: "'Inter', sans-serif"}}>
          {/* Elegant Header with Logos */}
          <div className="flex justify-between items-center border-b-[3px] border-gray-900 pb-6 mb-8">
            <div className="flex items-center">
              {darkIconLogo && <img src={darkIconLogo} alt="Logo" className="w-16 h-auto object-contain" />}
            </div>
            <div className="text-right flex flex-col items-end">
              {darkWordmarkLogo && <img src={darkWordmarkLogo} alt="Wordmark" className="h-6 w-auto object-contain mb-2" />}
              <div className="text-[10px] tracking-[0.2em] text-gray-600 font-medium uppercase mt-1">OFFICIAL VOUCHER</div>
            </div>
          </div>

          {/* Voucher & Guest Profile */}
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-2xl font-light text-gray-900 tracking-wider mb-4 uppercase">RESERVATION DIRECTORY</h1>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 responsive-filter-grid">
                <div>
                  <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-1">GUEST NAME</span>
                  <span className="block text-sm font-medium text-gray-900">{salesData.customerName}</span>
                </div>
                <div>
                  <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-1">GUEST TYPE</span>
                  <span className="block text-sm font-medium text-gray-900">{salesData.customerType === 'agency' ? `Agency (${agencies.find(a => a.id === salesData.agencyId)?.name || ''})` : 'Individual'}</span>
                </div>
                <div>
                  <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-1">CHECK IN</span>
                  <span className="block text-sm font-medium text-gray-900">{salesData.checkInDate ? new Date(salesData.checkInDate).toLocaleDateString('tr-TR') : '-'}</span>
                </div>
                <div>
                  <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-1">CHECK OUT</span>
                  <span className="block text-sm font-medium text-gray-900">{salesData.checkOutDate ? new Date(salesData.checkOutDate).toLocaleDateString('tr-TR') : '-'}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
               <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-2">VOUCHER NO</span>
               <span className="block text-3xl font-light tracking-widest text-gray-900">{salesData.voucherNumber}</span>
            </div>
          </div>

          {/* ITINERARY */}
          <div className="space-y-8">
            
            {/* Accommodation */}
            {rooms.length > 0 && (
              <div>
                <div className="border-b border-gray-300 pb-2 mb-4">
                  <h2 className="text-[10px] tracking-[0.3em] text-gray-900 font-bold uppercase">Accommodation Details</h2>
                </div>
                <div className="mb-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    {hotels.find(h => h.id === rooms[0].hotelId)?.name || rooms[0].hotelName || rooms[0].hotelId || '-'}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {rooms.map((room, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 p-4 rounded-sm flex justify-between items-center">
                      <div>
                        <span className="block text-[8px] tracking-widest text-gray-600 uppercase mb-1">ROOM {room.roomNumber || idx + 1}</span>
                        <span className="block text-xs font-semibold text-gray-900">{room.roomType}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] tracking-widest text-gray-600 uppercase mb-1">GUESTS</span>
                        <span className="block text-xs font-medium text-gray-700">{room.guestInfo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flights */}
            {flights.length > 0 && (
              <div>
                <div className="border-b border-gray-300 pb-2 mb-4 mt-6">
                  <h2 className="text-[10px] tracking-[0.3em] text-gray-900 font-bold uppercase">Flight Itinerary</h2>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">Direction</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">Airline / Flight No</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">Date</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">Route</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100 text-right">PNR / Timing</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {flights.map((flight, idx) => (
                      <tr key={idx} className="border-b border-gray-50">
                        <td className="py-3 font-medium text-gray-900">{flight.type === 'departure' ? 'Gidiş' : 'Dönüş'}</td>
                        <td className="py-3 text-gray-700">{flight.airline} <span className="text-gray-600 ml-1">({flight.flightNo})</span></td>
                        <td className="py-3 text-gray-700">{flight.flightDate ? new Date(flight.flightDate).toLocaleDateString('tr-TR') : '-'}</td>
                        <td className="py-3 font-medium text-gray-900">{flight.route}</td>
                        <td className="py-3 text-right">
                          <span className="block font-semibold text-gray-900">{(flight as any).pnr || 'N/A'}</span>
                          <span className="block text-[9px] text-gray-600 mt-0.5">{flight.departureTime} → {flight.arrivalTime}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Transfers */}
            {transfers.length > 0 && (
              <div>
                <div className="border-b border-gray-300 pb-2 mb-4 mt-6">
                  <h2 className="text-[10px] tracking-[0.3em] text-gray-900 font-bold uppercase">Transfer Services</h2>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">Direction</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">Vehicle Type</th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {transfers.map((trans, idx) => (
                      <tr key={idx} className="border-b border-gray-50">
                        <td className="py-3 font-medium text-gray-900">{trans.direction === 'arrival' ? 'Varış' : (trans.direction === 'return' ? 'Dönüş' : 'Ara')}</td>
                        <td className="py-3 text-gray-700">{trans.vehicleType}</td>
                        <td className="py-3 font-semibold text-gray-900 text-right">{trans.time || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
          </div>

          {/* IMPORTANT NOTES */}
          {salesData.notes && (
            <div className="mt-12 bg-white border border-gray-200 p-4">
              <h3 className="text-[9px] tracking-widest text-gray-900 font-bold uppercase mb-2">IMPORTANT NOTES</h3>
              <p className="text-xs text-gray-600 leading-relaxed italic">{salesData.notes}</p>
            </div>
          )}

          {/* Footer (Extremely clean, like a letterhead footer) */}
          <div className="mt-16 pt-8 border-t-[1px] border-gray-200">
            <div className="flex justify-between items-end">
                <div>
                  <div className="text-sm font-semibold tracking-wide text-gray-900 mb-1">{companyInfo.company_name}</div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-3">{companyInfo.company_address}</div>
                  <div className="flex gap-4 text-[9px] font-medium text-gray-600">
                    {companyInfo.company_phone && <span>T: {companyInfo.company_phone}</span>}
                    <span>E: {companyInfo.company_email}</span>
                    <span>W: {companyInfo.company_website}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[7px] text-gray-300 uppercase tracking-widest mb-1">Generated By System</div>
                  <div className="text-[10px] font-semibold text-gray-800 tracking-[0.2em]">{new Date().toLocaleDateString('tr-TR')}</div>
                </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}