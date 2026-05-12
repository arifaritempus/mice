'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/providers/ThemeProvider';
import { SejourService, AgencyService, HotelService, SupplierService, ServiceTypeService, SettingsService } from '@/lib/supabaseService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getLogosForExcel } from '@/utils/logoUtils';
import { usePermissions, Module } from '@/lib/permissions';
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
          className="w-full px-2 py-1 bg-transparent text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none"
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
          className="fixed z-[9999] bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white dark:border-gray-700 rounded-lg shadow-2xl max-h-56 overflow-auto animate-in fade-in zoom-in-95 duration-200" 
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
                className={`px-2 py-1 text-xs cursor-pointer transition-colors duration-200 ${i === highlight ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
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
  adultCount: number;
  childCount: number;
  infantCount: number;
  pricePerNight: number;
  totalNights: number;
  totalPrice: number;
  currency: string;
  price: number;
  costPrice?: number;
  costCurrency?: string;
}

interface FlightInfo {
  id: string;
  type?: 'departure' | 'return';
  flightType: string;
  departureAirline: string;
  departureFlightNumber: string;
  departureDate: string;
  departureTime: string;
  departureAirport: string;
  arrivalAirport: string;
  returnAirline: string;
  returnFlightNumber: string;
  returnDate: string;
  returnTime: string;
  pricePerPerson: number;
  totalPassengers: number;
  totalPrice: number;
  currency: string;
  // UI fields
  flightDate?: string;
  airline?: string;
  route?: string;
  flightNo?: string;
  ticketingProvider?: string;
  ticketingDate?: string;
  arrivalTime?: string;
  pnr?: string;
  price: number;
  costPrice?: number;
  costCurrency?: string;
}

interface TransferInfo {
  id: string;
  direction?: 'arrival' | 'return' | 'intermediate';
  supplierId: string;
  transferType: string;
  vehicleType: string;
  routeDescription: string;
  price: number;
  currency: string;
  // UI fields
  date?: string;
  provider?: string;
  type?: string;
  vehicle?: string;
  time?: string;
  costPrice?: number;
  costCurrency?: string;
}

interface ExtraService {
  id: string;
  serviceTypeId: string;
  supplierId: string;
  serviceName: string;
  serviceDescription: string;
  price: number;
  currency: string;
  // UI fields
  serviceType?: string;
  provider?: string;
  description?: string;
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
}



export default function CreateSejourPage() {
  const { isDark } = useTheme();
  const router = useRouter();
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
  const [newCollection, setNewCollection] = useState({
    type: '',
    amount: '',
    date: '',
    currency: 'TRY',
    description: ''
  });

  const { canCreate, loading: permissionsLoading } = usePermissions();





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
      const { iconLogoBase64, wordmarkLogoBase64 } = await getLogosForExcel(true);
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
      
      const canvas = await html2canvas(voucherElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`voucher-${salesData.voucherNumber || 'draft'}.pdf`);
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      toast.error('PDF oluşturulurken hata oluştu: ' + (error as Error).message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Section visibility states
  const [showAccommodation, setShowAccommodation] = useState(false);
  const [showFlight, setShowFlight] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showExtraServices, setShowExtraServices] = useState(false);

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
      adultCount: 1,
      childCount: 0,
      infantCount: 0,
      pricePerNight: 0,
      totalNights: 1,
      totalPrice: 0,
      price: 0,
      currency: 'TRY'
    };
    setRooms([...rooms, newRoom]);
  };

  // Flight Management
  const addFlight = (type: 'departure' | 'return') => {
    const newFlight: FlightInfo = {
      id: Date.now().toString(),
      type: type,
      flightType: 'round_trip',
      departureAirline: '',
      departureFlightNumber: '',
      departureDate: type === 'departure' ? salesData.checkInDate : salesData.checkOutDate,
      departureTime: '',
      departureAirport: '',
      arrivalAirport: '',
      returnAirline: '',
      returnFlightNumber: '',
      returnDate: type === 'return' ? salesData.checkOutDate : '',
      returnTime: '',
      pricePerPerson: 0,
      totalPassengers: 1,
      totalPrice: 0,
      currency: 'TRY',
      flightDate: type === 'departure' ? salesData.checkInDate : salesData.checkOutDate,
      airline: '',
      route: '',
      flightNo: '',
      ticketingProvider: '',
      ticketingDate: '',
      arrivalTime: '',
      price: 0
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
      direction: direction,
      supplierId: '',
      transferType: 'private',
      vehicleType: '',
      routeDescription: '',
      price: 0,
      currency: 'TRY',
      date: direction === 'arrival' ? salesData.checkInDate : (direction === 'return' ? salesData.checkOutDate : ''),
      provider: '',
      type: 'private',
      vehicle: '',
      time: ''
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
      serviceTypeId: '',
      supplierId: '',
      serviceName: '',
      serviceDescription: '',
      price: 0,
      currency: 'TRY',
      // UI fields - form'da kullanılan alanlar
      serviceType: '',
      provider: '',
      description: ''
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

  // TR format helpers
  const formatAmount = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) return '0,00';
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };
  const parseTrAmount = (val: string) => {
    if (!val) return 0;
    const normalized = val.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  };

  // Transient input states to allow free typing; we only format on blur
  const [roomPriceInput, setRoomPriceInput] = useState<Record<string, string>>({});
  const [roomCostInput, setRoomCostInput] = useState<Record<string, string>>({});
  const [servicePriceInput, setServicePriceInput] = useState<Record<string, string>>({});

  const normalizeTyping = (val: string) => {
    // allow digits, dot and comma; collapse spaces
    return val.replace(/[^0-9.,]/g, '');
  };

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
    if (!newCollection.type || !newCollection.amount || !newCollection.date) {
      return; // Validation
    }
    
    const collection: Collection = {
      id: Date.now().toString(),
      type: newCollection.type,
      amount: parseTrAmount(newCollection.amount) || 0,
      date: newCollection.date,
      description: newCollection.description,
      currency: newCollection.currency
    };
    setCollections([...collections, collection]);
    
    // Reset form
    setNewCollection({
      type: '',
      amount: '',
      date: '',
      currency: 'TRY',
      description: ''
    });
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

      // Create sejour object
      const sejourData = {
        voucherNumber: salesData.voucherNumber,
        customerType: salesData.customerType,
        customerName: salesData.customerName,
        agencyId: salesData.agencyId,
        checkInDate: salesData.checkInDate,
        checkOutDate: salesData.checkOutDate,
        rooms: rooms,
        flights: flights,
        transfers: transfers,
        extraServices: extraServices,
        totalAmount: calculateTotalAmount().EUR || 0,
        currency: salesData.currency || 'TRY',
        status: salesData.status || 'BEKLEMEDE',
        notes: salesData.notes,
        costs: calculateTotalCost(),
        totals: calculateTotalAmount(),
        collections: collections,
        profits: {
          EUR: getProfitForCurrency('EUR'),
          USD: getProfitForCurrency('USD'),
          TRY: getProfitForCurrency('TRY')
        }
      };

      // Save to Supabase
      await SejourService.createSejour(sejourData);
      
      console.log('Sejour created and saved to Supabase:', {
        sejourData
      });

      toast.success('Sejour başarıyla oluşturuldu!');
      setSuccess('Sejour başarıyla oluşturuldu!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/sejour');
      }, 2000);

    } catch (error: any) {
      console.error('Error creating sejour:', error);
      // Hata mesajını kullanıcıya göster
      const errorMessage = error?.message || error?.error?.message || 'Sejour oluşturulurken bir hata oluştu';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Sejour oluşturma yetkisi kontrolü
  if (!canCreate(Module.SEJOUR)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Yeni sejour kaydı oluşturmak için yetkiniz bulunmuyor.</p>
          <button onClick={() => router.push('/sejour')} className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Sejour Listesine Dön
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
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Yeni Sejour Oluştur</h1>
                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 mt-0.5 uppercase tracking-widest">{salesData.voucherNumber || 'YENİ KAYIT'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="px-6 py-2.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 flex items-center shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF İNDİR
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
            <div className="bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-2 py-1.5 rounded-lg mb-1 flex items-center shadow-lg shadow-red-500/10 animate-in zoom-in-95 duration-300">
              <span className="mr-3 text-xl">⚠️</span>
              <p className="font-bold text-sm tracking-tight">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200 px-2 py-1.5 rounded-lg mb-1 flex items-center shadow-lg shadow-emerald-500/10 animate-in zoom-in-95 duration-300">
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

        {/* Tab Content */}
        <div className="mt-8">
            {/* Sales Tab */}
            {activeTab === 'sales' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Satış Bilgileri</h2>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700 mx-6"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                  {/* Left Column: General Info */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded p-2 shadow-sm transition-all duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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

                          <div className="grid grid-cols-2 gap-2">
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
                              {status === 'BEKLEMEDE' ? '⏳ BEKLEMEDE' : status === 'KONFIRME' ? '✅ KONFİRME' : '❌ İPTAL'}
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
                    
                    <div className="p-3 space-y-4">
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
                          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
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
                                    value={roomPriceInput[room.id] ?? (room.price ? formatAmount(room.price) : '')}
                                    onChange={(e) => setRoomPriceInput(prev => ({...prev, [room.id]: normalizeTyping(e.target.value)}))}
                                    onBlur={(e) => {
                                      const parsed = parseTrAmount(roomPriceInput[room.id] ?? e.target.value);
                                      updateRoom(room.id, 'price', parsed);
                                      setRoomPriceInput(prev => ({...prev, [room.id]: formatAmount(parsed)}));
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
                              <span className={`w-1 h-1 rounded-full mr-2 ${flight.type === 'departure' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
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
                                 <SearchableSelect
                                   options={suppliers}
                                   value={flight.ticketingProvider || ''}
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
                             <div>
                               <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Satış Tutarı</label>
                               <div className="flex gap-2">
                                 <input
                                   className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-black text-emerald-600 dark:text-emerald-400 text-right focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 outline-none"
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
                                   className="w-20 px-1 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-black text-gray-900 dark:text-white transition-all duration-300 outline-none"
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
                              <SearchableSelect
                                options={suppliers}
                                value={transfer.provider || ''}
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
                                       setServicePriceInput(prev => ({...prev, [transfer.id]: formatAmount(parsed)}));
                                     }
                                   }}
                                 />
                                 <select
                                  className="w-20 px-1 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-black text-gray-900 dark:text-gray-100 transition-all duration-300 outline-none"
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
                                 className="w-full px-3 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px] font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all duration-300 outline-none"
                               >
                                 <option value="">Seçin</option>
                                 {supplierServiceTypes.map(type => (
                                   <option key={type.id} value={type.id}>{type.name}</option>
                                 ))}
                               </select>
                             </div>
                             <div className="xl:col-span-3">
                                <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Tedarikçi</label>
                                <SearchableSelect
                                  options={suppliers}
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

                {/* Summary */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg overflow-hidden transition-all duration-300">
                  <div className="px-2 py-1 bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-[10px] font-black text-gray-900 dark:text-white flex items-center tracking-widest uppercase">
                      <span className="mr-2">📊</span>
                      Genel Özet
                    </h3>
                  </div>
                  <div className="p-1">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div className="relative group">
                        <div className="relative bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:scale-[1.02]">
                          <h4 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Toplam Satış Tutarları</h4>
                          <div className="space-y-2">
                            {['TRY', 'EUR', 'USD', 'GBP'].map(curr => (
                              <div key={curr} className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400">{curr}</span>
                                <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{formatAmount(getTotalForCurrency(curr))}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-1 rounded-lg border border-emerald-100 dark:border-emerald-900/30 flex flex-col items-center justify-center transition-all duration-300 hover:scale-[1.02]">
                        <span className="text-3xl mb-2">🏨</span>
                        <h4 className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Otel Sayısı</h4>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-300 mt-1">{rooms.length}</p>
                      </div>
                      
                      <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-1 rounded-lg border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center justify-center transition-all duration-300 hover:scale-[1.02]">
                        <span className="text-3xl mb-2">✈️</span>
                        <h4 className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-widest">Uçuş Sayısı</h4>
                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-300 mt-1">{flights.length}</p>
                      </div>
                      
                      <div className="bg-purple-50/50 dark:bg-purple-900/10 p-1 rounded-lg border border-purple-100 dark:border-purple-900/30 flex flex-col items-center justify-center transition-all duration-300 hover:scale-[1.02]">
                        <span className="text-3xl mb-2">🚗</span>
                        <h4 className="text-[10px] font-bold text-purple-800 dark:text-purple-400 uppercase tracking-widest">Transfer Sayısı</h4>
                        <p className="text-2xl font-black text-purple-600 dark:text-purple-300 mt-1">{transfers.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase Tab */}
            {activeTab === 'purchase' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Alış ve Maliyet Bilgileri</h2>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700 mx-6"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
                  <div className="lg:col-span-3 space-y-6">
                    {/* Accommodation Costs */}
                    {showAccommodation && (
                      <div className="bg-white dark:bg-gray-800 border-2 border-red-100 dark:border-red-900/30 rounded shadow-xl overflow-hidden">
                        <div className="px-2 py-1.5 bg-red-50/50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/20 flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-lg shadow-red-500/30">
                              <span className="text-lg">🏨</span>
                            </div>
                            <h3 className="text-[10px] font-black text-red-900 dark:text-red-100 tracking-widest uppercase">Konaklama Maliyetleri</h3>
                          </div>
                        </div>
                        <div className="p-2 space-y-4">
                          {rooms.map((room, index) => (
                            <div key={room.id} className="group bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-lg p-1 transition-all duration-300 hover:border-red-300">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-1 items-center">
                                <div className="md:col-span-2">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Otel & Oda</p>
                                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                    {hotels.find(h => h.id === room.hotelId)?.name || 'Otel Seçilmedi'} - {room.roomType}
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-2 ml-1">Alış Tutarı</label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={servicePriceInput[`${room.id}_cost`] ?? (room.costPrice ? formatAmount(room.costPrice) : '')}
                                    onChange={(e) => setServicePriceInput(prev => ({...prev, [`${room.id}_cost`]: normalizeTyping(e.target.value)}))}
                                    onBlur={(e) => {
                                      const parsed = parseTrAmount(servicePriceInput[`${room.id}_cost`] ?? e.target.value);
                                      if (parsed !== null) {
                                        updateRoom(room.id, 'costPrice', parsed);
                                        setServicePriceInput(prev => ({...prev, [`${room.id}_cost`]: formatAmount(parsed)}));
                                      }
                                    }}
                                    className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded text-xs font-black text-red-600 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all"
                                    placeholder="0,00"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-2 ml-1">Döviz</label>
                                  <select
                                    value={room.costCurrency || room.currency}
                                    onChange={(e) => updateRoom(room.id, 'costCurrency', e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded text-xs font-black text-gray-900 dark:text-white outline-none"
                                  >
                                    <option value="TRY">TRY</option>
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="GBP">GBP</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Flight Costs */}
                    {showFlight && (
                      <div className="bg-white dark:bg-gray-800 border-2 border-emerald-100 dark:border-emerald-900/30 rounded shadow-xl overflow-hidden">
                         <div className="px-2 py-1.5 bg-emerald-50/50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-900/20 flex items-center">
                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-lg shadow-emerald-500/30">
                              <span className="text-lg">✈️</span>
                            </div>
                            <h3 className="text-[10px] font-black text-emerald-900 dark:text-emerald-100 tracking-widest uppercase">Uçuş Maliyetleri</h3>
                        </div>
                        <div className="p-2 space-y-4">
                          {flights.map((flight, index) => (
                            <div key={flight.id} className="group bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-lg p-1 transition-all duration-300 hover:border-emerald-300">
                               <div className="grid grid-cols-1 md:grid-cols-4 gap-1 items-center">
                                  <div className="md:col-span-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{flight.type === 'departure' ? 'Gidiş' : 'Dönüş'} Uçuşu</p>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{flight.airline} - {flight.route}</p>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-2 ml-1">Alış Tutarı</label>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={servicePriceInput[`${flight.id}_cost`] ?? (flight.costPrice ? formatAmount(flight.costPrice) : '')}
                                      onChange={(e) => setServicePriceInput(prev => ({...prev, [`${flight.id}_cost`]: normalizeTyping(e.target.value)}))}
                                      onBlur={(e) => {
                                        const parsed = parseTrAmount(servicePriceInput[`${flight.id}_cost`] ?? e.target.value);
                                        if (parsed !== null) {
                                          updateFlight(flight.id, 'costPrice', parsed);
                                          setServicePriceInput(prev => ({...prev, [`${flight.id}_cost`]: formatAmount(parsed)}));
                                        }
                                      }}
                                      className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded text-xs font-black text-red-600 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all"
                                      placeholder="0,00"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-2 ml-1">Döviz</label>
                                    <select
                                      value={flight.costCurrency || flight.currency}
                                      onChange={(e) => updateFlight(flight.id, 'costCurrency', e.target.value)}
                                      className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded text-xs font-black text-gray-900 dark:text-white outline-none"
                                    >
                                      <option value="TRY">TRY</option>
                                      <option value="EUR">EUR</option>
                                      <option value="USD">USD</option>
                                      <option value="GBP">GBP</option>
                                    </select>
                                  </div>
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded p-2 shadow-sm sticky top-2">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Maliyet Özeti</h3>
                      <div className="space-y-4">
                        {['TRY', 'EUR', 'USD', 'GBP'].map(curr => {
                          const cost = getCostForCurrency(curr);
                          if (cost === 0) return null;
                          return (
                            <div key={curr} className="p-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{curr} TOPLAM ALIŞ</p>
                              <p className="text-xl font-black text-red-600 dark:text-red-400 tracking-tight">{formatAmount(cost)}</p>
                            </div>
                          );
                        })}
                         {/* Profit / Loss */}
                         <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Tahmini Kar/Zarar</h4>
                            {['TRY', 'EUR', 'USD', 'GBP'].map(curr => {
                              const profit = getProfitForCurrency(curr);
                              const cost = getCostForCurrency(curr);
                              if (cost === 0 && profit === 0) return null;
                              return (
                                <div key={curr} className="flex justify-between items-center mb-2">
                                  <span className="text-[10px] font-bold text-gray-500 uppercase">{curr}</span>
                                  <span className={`text-sm font-black ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {profit >= 0 ? '+' : ''}{formatAmount(profit)}
                                  </span>
                                </div>
                              );
                            })}
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Collections Tab */}
            {activeTab === 'collections' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Tahsilat Bilgileri</h2>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700 mx-6"></div>
                  <button
                    type="button"
                    onClick={addCollection}
                    className="inline-flex items-center px-5 py-2.5 bg-emerald-600 text-white text-xs font-black rounded hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                    Tahsilat Ekle
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
                  <div className="lg:col-span-3 space-y-6">
                    {/* Mevcut Tahsilat Kayıtları */}
                    {collections.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Mevcut Tahsilatlar</h4>
                        <div className="space-y-3">
                          {collections.map((collection) => (
                            <div key={collection.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center bg-gray-50/50 dark:bg-gray-700/20 p-3 rounded border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200">
                              <select
                                value={collection.type || 'cash'}
                                onChange={(e) => updateCollection(collection.id, 'type', e.target.value)}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold transition-all duration-200 outline-none"
                              >
                                <option value="cash">Nakit</option>
                                <option value="bank">Havale / EFT</option>
                                <option value="card">Kredi Kartı</option>
                                <option value="cheque">Çek / Senet</option>
                              </select>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={collection.amount ? formatAmount(collection.amount) : ''}
                                onChange={(e) => updateCollection(collection.id, 'amount', parseTrAmount(e.target.value) || 0)}
                                className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold transition-all duration-200"
                              />
                              <input
                                type="date"
                                value={collection.date}
                                onChange={(e) => updateCollection(collection.id, 'date', e.target.value)}
                                className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
                              />
                              <select
                                value={collection.currency || 'TRY'}
                                onChange={(e) => updateCollection(collection.id, 'currency', e.target.value)}
                                className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
                              >
                                <option value="TRY">TRY</option>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="GBP">GBP</option>
                              </select>
                              <input
                                type="text"
                                value={collection.description}
                                onChange={(e) => updateCollection(collection.id, 'description', e.target.value)}
                                className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
                                placeholder="Açıklama"
                              />
                              <button
                                type="button"
                                onClick={() => removeCollection(collection.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 p-1 rounded-lg border border-blue-100 dark:border-blue-900/30 transition-all duration-300 hover:scale-[1.02]">
                    <h3 className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-3">Toplam Tutarlar</h3>
                    <div className="space-y-1.5">
                      {['TRY', 'EUR', 'USD', 'GBP'].map(curr => (
                        <div key={curr} className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400">{curr}</span>
                          <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{formatAmount(getTotalForCurrency(curr))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-1 rounded-lg border border-emerald-100 dark:border-emerald-900/30 transition-all duration-300 hover:scale-[1.02]">
                    <h3 className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-3">Toplam Tahsilat</h3>
                    <div className="space-y-1.5">
                      {['TRY', 'EUR', 'USD', 'GBP'].map(curr => (
                        <div key={curr} className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400">{curr}</span>
                          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{formatAmount(calculateTotalCollectionsByCurrency(curr))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-red-50/50 dark:bg-red-900/10 p-1 rounded-lg border border-red-100 dark:border-red-900/30 transition-all duration-300 hover:scale-[1.02]">
                    <h3 className="text-[10px] font-bold text-red-800 dark:text-red-400 uppercase tracking-widest mb-3">Kalan Bakiye</h3>
                    <div className="space-y-1.5">
                      {['TRY', 'EUR', 'USD', 'GBP'].map(curr => (
                        <div key={curr} className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400">{curr}</span>
                          <span className={`text-sm font-extrabold ${calculateBalanceByCurrency(curr) > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {formatAmount(calculateBalanceByCurrency(curr))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}


        {/* Submit Buttons */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2 mb-20 animate-in slide-in-from-bottom-8 duration-700">
          <button
            type="button"
            onClick={() => router.push('/sejour')}
            className="w-full md:w-auto h-9 px-10 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded text-[10px] font-black tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 transition-all duration-300"
          >
            ← VAZGEÇ
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto h-9 px-16 bg-blue-600 text-white text-[10px] font-black tracking-widest rounded shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <span className="flex items-center space-x-3">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>İŞLENİYOR...</span>
              </span>
            ) : (
              'SEJOUR KAYDET 💾'
            )}
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
              {darkIconLogo && (
                <img src={darkIconLogo} alt="Logo" className="w-16 h-auto object-contain" />
              )}
            </div>
            <div className="text-right flex flex-col items-end">
              {darkWordmarkLogo && (
                <img src={darkWordmarkLogo} alt="Wordmark" className="h-6 w-auto object-contain mb-2" />
              )}
              <div className="text-[10px] tracking-[0.2em] text-gray-600 font-medium uppercase mt-1">OFFICIAL VOUCHER</div>
            </div>
          </div>

          {/* Voucher & Guest Profile */}
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-2xl font-light text-gray-900 tracking-wider mb-4 uppercase">RESERVATION DIRECTORY</h1>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4">
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
            {rooms.length > 0 && hotels.find(h => h.id === rooms[0].hotelId) && (
              <div>
                <div className="border-b border-gray-300 pb-2 mb-4">
                  <h2 className="text-[10px] tracking-[0.3em] text-gray-900 font-bold uppercase">Accommodation Details</h2>
                </div>
                <div className="mb-3">
                  <h3 className="text-lg font-medium text-gray-900">{hotels.find(h => h.id === rooms[0].hotelId)?.name}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {rooms.map((room, idx) => (
                    <div key={idx} className="bg-gray-50 border border-gray-100 p-4 rounded-sm flex justify-between items-center">
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
            
            {/* Extras */}
            {extraServices.length > 0 && (
              <div>
                <div className="border-b border-gray-300 pb-2 mb-4 mt-6">
                  <h2 className="text-[10px] tracking-[0.3em] text-gray-900 font-bold uppercase">Extra Services</h2>
                </div>
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-sm">
                  {extraServices.map((extra, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0 last:pb-0">
                      <span className="text-xs font-semibold text-gray-900 flex-1">{supplierServiceTypes.find(t => t.id === extra.serviceType)?.name || extra.serviceType}</span>
                      <span className="text-xs text-gray-500 pl-4">{extra.description || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* IMPORTANT NOTES */}
          {salesData.notes && (
            <div className="mt-12 bg-gray-50 border-l-[3px] border-gray-900 p-4">
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
