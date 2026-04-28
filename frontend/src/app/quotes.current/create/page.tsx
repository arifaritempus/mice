'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/components/providers/ThemeProvider';
import { agenciesService, hotelsService, categoriesService, usersService } from '@/lib/supabaseService';
import { storage } from '@/utils/safeStorage';

interface Category {
  id: string;
  name: string;
  sub_categories: string[];
}

interface Agency {
  id: string;
  name: string;
  company_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

interface Hotel {
  id: string;
  name: string;
  concept: string;
}

interface QuoteItem {
  id: string;
  category_id: string;
  sub_category_id: string;
  item_name: string;
  unit_quantity: number;
  repeat_frequency: number;
  unit_price: number;
  currency: string;
  total_price: number;
  detail_description: string;
}

interface Quote {
  id: string;
  reference: string;
  agency_id: string;
  company_name: string;
  check_in_date: string;
  check_out_date: string;
  hotel_id: string;
  hotel_concept: string;
  quote_type: string;
  room_count: number;
  pax_count: number;
  option: string;
  status: string;
  note: string;
  items: QuoteItem[];
  total_amount: number;
  created_at: string;
}

export default function CreateQuotePage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  
  const [formData, setFormData] = useState({
    reference: '',
    agency_id: '',
    company_name: '',
    check_in_date: '',
    check_out_date: '',
    hotel_id: '',
    quote_type: 'BİRİM',
    room_count: 0,
    pax_count: 0,
    option: 'SOR - SAT',
    status: 'TEKLİF',
    file_manager: '',
    note: ''
  });

  const [newItem, setNewItem] = useState({
    main_category: '',
    sub_category: '',
    service_name: '',
    unit_price: 0,
    currency: 'EUR',
    quantity: 1,
    repeat_frequency: 1,
    total_price: 0
  });

  const [users, setUsers] = useState([
    { id: '1', first_name: 'Arif', last_name: 'Ari', email: 'arif.ari@tempustravel.co' },
    { id: '2', first_name: 'John', last_name: 'Doe', email: 'john.doe@tempustravel.co' }
  ]);

  useEffect(() => {
    loadAgencies();
    loadHotels();
    loadCategories();
    loadUsers();
  }, []);

  // Acenteler güncellendiğinde haberdar ol
  useEffect(() => {
    const handleAgenciesUpdated = (event: CustomEvent) => {
      console.log('Agencies updated event received:', event.detail);
      setAgencies(event.detail);
    };

    window.addEventListener('agenciesUpdated', handleAgenciesUpdated as EventListener);
    
    return () => {
      window.removeEventListener('agenciesUpdated', handleAgenciesUpdated as EventListener);
    };
  }, []);

  // State değişikliklerini izle
  useEffect(() => {
    console.log('Categories state changed:', categories);
  }, [categories]);

  useEffect(() => {
    console.log('Users state changed:', users);
  }, [users]);

  const loadCategories = async () => {
    try {
      // Servisten dene (localStorage tabanlı olabilir)
      const serviceCats = await categoriesService.getAll();
      if (serviceCats && serviceCats.length) {
        // quotes.current sayfası bu yapıyı bekliyor: { id, name, sub_categories: string[] }
        const mainCategories = serviceCats.filter((c: any) => !c.parent_id && (c.type === 'main' || !c.type));
        const subCategories = serviceCats.filter((c: any) => c.parent_id || c.type === 'sub');
        const categoriesWithSubs = mainCategories.map((mainCat: any) => ({
          id: mainCat.id,
          name: mainCat.name,
          sub_categories: subCategories
            .filter((subCat: any) => subCat.parent_id === mainCat.id)
            .map((subCat: any) => subCat.name)
        }));
        setCategories(categoriesWithSubs);
        return;
      }

      // Kategoriler sayfasından localStorage üzerinden veri çekme (geri dönüş)
      const savedCategories = storage.getItem('categories');
      
      if (savedCategories) {
        const parsedCategories = JSON.parse(savedCategories);
        console.log('Raw categories from categories page:', parsedCategories);
        
        // Ana kategorileri ve alt kategorilerini grupla
        const mainCategories = parsedCategories.filter((cat: any) => cat.type === 'main');
        const subCategories = parsedCategories.filter((cat: any) => cat.type === 'sub');
        
        console.log('Main categories found:', mainCategories.length);
        console.log('Sub categories found:', subCategories.length);
        
        const categoriesWithSubs = mainCategories.map((mainCat: any) => {
          const relatedSubs = subCategories.filter((subCat: any) => subCat.parent_id === mainCat.id);
          console.log(`Main category "${mainCat.name}" has ${relatedSubs.length} sub categories:`, relatedSubs);
          
          return {
            id: mainCat.id,
            name: mainCat.name,
            sub_categories: relatedSubs.map((subCat: any) => subCat.name)
          };
        });
        
        console.log('Final categories with subs:', categoriesWithSubs);
        setCategories(categoriesWithSubs);
      } else {
        console.log('No categories found, creating default structure');
        // Varsayılan kategoriler yapısını oluştur (kategoriler sayfasındaki gibi)
        const defaultCategoriesStructure = [
          {
            id: '1',
            name: 'OTEL | KONAKLAMA',
            description: 'Otel konaklama hizmetleri',
            type: 'main',
            created_at: new Date().toISOString(),
            is_active: true
          },
          {
            id: '2',
            name: 'OTEL | DİĞER HİZMETLER',
            description: 'Otel ek hizmetleri',
            type: 'main',
            created_at: new Date().toISOString(),
            is_active: true
          },
          {
            id: '3',
            name: 'UÇAK BİLETİ',
            description: 'Uçak bileti hizmetleri',
            type: 'main',
            created_at: new Date().toISOString(),
            is_active: true
          },
          {
            id: '4',
            name: 'TRANSFER & TUR',
            description: 'Transfer ve tur hizmetleri',
            type: 'main',
            created_at: new Date().toISOString(),
            is_active: true
          },
          {
            id: '5',
            name: 'ETKİNLİK',
            description: 'Etkinlik organizasyonu',
            type: 'main',
            created_at: new Date().toISOString(),
            is_active: true
          },
          // Alt kategoriler
          {
            id: '1-1',
            name: 'DOUBLE ODA KİŞİ BAŞI',
            description: 'Double oda kişi başı fiyatlandırma',
            type: 'sub',
            parent_id: '1',
            created_at: new Date().toISOString(),
            is_active: true
          },
          {
            id: '1-2',
            name: 'SINGLE ODA',
            description: 'Single oda fiyatlandırma',
            type: 'sub',
            parent_id: '1',
            created_at: new Date().toISOString(),
            is_active: true
          },
          {
            id: '2-1',
            name: 'TOPLANTI SALONU KULLANIMI',
            description: 'Toplantı salonu kullanım hizmeti',
            type: 'sub',
            parent_id: '2',
            created_at: new Date().toISOString(),
            is_active: true
          },
          {
            id: '3-1',
            name: 'ECONOMY',
            description: 'Ekonomi sınıf',
            type: 'sub',
            parent_id: '3',
            created_at: new Date().toISOString(),
            is_active: true
          },
          {
            id: '3-2',
            name: 'BUSINESS',
            description: 'Business sınıf',
            type: 'sub',
            parent_id: '3',
            created_at: new Date().toISOString(),
            is_active: true
          }
        ];
        
        // localStorage'a kaydet
        storage.setItem('categories', JSON.stringify(defaultCategoriesStructure));
        
        // Şimdi işle ve state'e set et
        const mainCategories = defaultCategoriesStructure.filter((cat: any) => cat.type === 'main');
        const subCategories = defaultCategoriesStructure.filter((cat: any) => cat.type === 'sub');
        
        const categoriesWithSubs = mainCategories.map((mainCat: any) => ({
          id: mainCat.id,
          name: mainCat.name,
          sub_categories: subCategories
            .filter((subCat: any) => subCat.parent_id === mainCat.id)
            .map((subCat: any) => subCat.name)
        }));
        
        setCategories(categoriesWithSubs);
        console.log('Default categories created and loaded:', categoriesWithSubs);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadAgencies = async () => {
    try {
      console.log('=== loadAgencies başladı ===');
      
      // Servisten dene (Supabase veya mock)
      try {
        const list = await agenciesService.getAll();
        if (list && list.length) {
          setAgencies(list as any);
          storage.setItem('agencies', JSON.stringify(list));
          console.log('Agencies state güncellendi (service):', list);
          return;
        }
      } catch (e) {
        console.warn('agenciesService.getAll hata veya bos dondu, localStorage fallback kullanilacak', e);
      }

      // Acenteler sayfasından localStorage üzerinden veri çekme (geri dönüş)
      const storedAgencies = storage.getItem('agencies');
      console.log('localStorage\'dan çekilen acenteler:', storedAgencies);
      
      if (storedAgencies) {
        const parsedAgencies = JSON.parse(storedAgencies);
        console.log('Parse edilen acenteler:', parsedAgencies);
        setAgencies(parsedAgencies);
        console.log('Agencies state güncellendi:', parsedAgencies);
      } else {
        console.log('localStorage\'da acente bulunamadı, varsayılan veriler kullanılıyor');
        // Varsayılan acenteler (acenteler sayfasındaki gibi)
        const defaultAgencies = [
          {
            id: '1',
            name: 'DONE TURİZM',
            company_name: 'DONE TURİZM A.Ş.',
            contact_person: 'Ahmet Yılmaz',
            phone: '+90 212 123 45 67',
            email: 'info@doneturizm.com',
            address: 'İstanbul, Türkiye',
            tax_number: '1234567890',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'SİGORTA',
            company_name: 'SİGORTA A.Ş.',
            contact_person: 'Ayşe Demir',
            phone: '+90 212 234 56 78',
            email: 'info@sigorta.com',
            address: 'İstanbul, Türkiye',
            tax_number: '0987654321',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: '3',
            name: 'TEMPUS TRAVEL',
            company_name: 'TEMPUS TRAVEL LTD.',
            contact_person: 'Mehmet Kaya',
            phone: '+90 212 345 67 89',
            email: 'info@tempustravel.com',
            address: 'İstanbul, Türkiye',
            tax_number: '1122334455',
            is_active: true,
            created_at: new Date().toISOString()
          }
        ];
        
        setAgencies(defaultAgencies);
        storage.setItem('agencies', JSON.stringify(defaultAgencies));
        console.log('Varsayılan acenteler oluşturuldu ve localStorage\'a kaydedildi:', defaultAgencies);
      }
      
      console.log('=== loadAgencies bitti ===');
    } catch (error) {
      console.error('loadAgencies hatası:', error);
    }
  };

  const loadHotels = async () => {
    try {
      // Servisten dene
      try {
        const list = await hotelsService.getAll();
        if (list && list.length) {
          setHotels(list as any);
          storage.setItem('hotels', JSON.stringify(list));
          return;
        }
      } catch (e) {
        console.warn('hotelsService.getAll hata veya bos dondu, localStorage fallback kullanilacak', e);
      }

      // Oteller sayfasından localStorage üzerinden veri çekme (geri dönüş)
      const storedHotels = storage.getItem('hotels');
      if (storedHotels) {
        const parsedHotels = JSON.parse(storedHotels);
        console.log('Hotels loaded from hotels page:', parsedHotels);
        setHotels(parsedHotels);
      } else {
        console.log('No hotels found, creating defaults');
        // Varsayılan oteller oluştur (oteller sayfasındaki gibi)
        const defaultHotels = [
          {
            id: '1',
            name: 'CONCORDE LUXURY RESORT HOTEL',
            location: 'Antalya, Türkiye',
            concept: 'ULTRA HER ŞEY DAHİL',
            rating: 5,
            contact_person: 'Ahmet Yılmaz',
            phone: '+90 242 123 45 67',
            email: 'info@concorde.com',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'GRAND BEACH HOTEL',
            location: 'Bodrum, Türkiye',
            concept: 'HER ŞEY DAHİL',
            rating: 4,
            contact_person: 'Fatma Demir',
            phone: '+90 252 234 56 78',
            email: 'info@grandbeach.com',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: '3',
            name: 'SEA VIEW RESORT',
            location: 'Fethiye, Türkiye',
            concept: 'YARIM PANSIYON',
            rating: 4,
            contact_person: 'Mehmet Kaya',
            phone: '+90 252 345 67 89',
            email: 'info@seaview.com',
            is_active: true,
            created_at: new Date().toISOString()
          }
        ];
        setHotels(defaultHotels);
        storage.setItem('hotels', JSON.stringify(defaultHotels));
        console.log('Default hotels created and loaded:', defaultHotels);
      }
    } catch (error) {
      console.error('Error loading hotels:', error);
    }
  };

  const loadUsers = async () => {
    try {
      // Servisten dene (localStorage tabanlı olabilir)
      try {
        const list = await usersService.getAll();
        if (list && list.length) {
          setUsers(list as any);
          storage.setItem('users', JSON.stringify(list));
          return;
        }
      } catch (e) {
        console.warn('usersService.getAll hata veya bos dondu, localStorage fallback kullanilacak', e);
      }

      // Kullanıcılar sayfasından localStorage üzerinden veri çekme (geri dönüş)
      const storedUsers = storage.getItem('users');
      if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers);
        console.log('Users loaded from users page:', parsedUsers);
        setUsers(parsedUsers);
      } else {
        console.log('No users found, creating defaults');
        // Varsayılan kullanıcılar oluştur (kullanıcılar sayfasındaki gibi)
        const defaultUsers = [
          {
            id: '1',
            first_name: 'Arif',
            last_name: 'Ari',
            email: 'arif.ari@tempustravel.co',
            role: 'super_admin',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@tempustravel.co',
            role: 'admin',
            is_active: true,
            created_at: new Date().toISOString()
          }
        ];
        setUsers(defaultUsers);
        storage.setItem('users', JSON.stringify(defaultUsers));
        console.log('Default users created and loaded:', defaultUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Debug için console.log ekleyelim
  useEffect(() => {
    console.log('Categories loaded:', categories);
    console.log('Users loaded:', users);
  }, [categories, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Toplam tutarı hesapla
    const totalAmount = quoteItems.reduce((sum, item) => sum + item.total_price, 0);

    const newQuote: Quote = {
      id: Date.now().toString(),
      reference: formData.reference,
      agency_id: formData.agency_id,
      company_name: formData.company_name,
      check_in_date: formData.check_in_date,
      check_out_date: formData.check_out_date,
      hotel_id: formData.hotel_id,
      hotel_concept: hotels.find(h => h.id === formData.hotel_id)?.concept || '',
      quote_type: formData.quote_type,
      room_count: formData.room_count,
      pax_count: formData.pax_count,
      option: formData.option,
      status: formData.status,
      note: formData.note,
      items: quoteItems,
      total_amount: totalAmount,
      created_at: new Date().toISOString()
    };

    // Mevcut teklifleri localStorage'dan al
    const existingQuotes = storage.getItem('quotes');
    const quotes = existingQuotes ? JSON.parse(existingQuotes) : [];
    
    // Yeni teklifi ekle
    const updatedQuotes = [...quotes, newQuote];
    storage.setItem('quotes', JSON.stringify(updatedQuotes));

    // Global fonksiyonu çağır (eğer varsa)
    if ((window as any).addNewQuote) {
      (window as any).addNewQuote(newQuote);
    }

    setTimeout(() => {
      setLoading(false);
      router.push('/quotes');
    }, 1000);
  };

  const addItem = () => {
    if (!newItem.main_category || !newItem.sub_category || !newItem.service_name || newItem.unit_price <= 0) {
      alert('Lütfen gerekli alanları doldurun veya hatalı bir değer girdiniz.');
      return;
    }

    const item: QuoteItem = {
      id: Date.now().toString(),
      category_id: newItem.main_category,
      sub_category_id: newItem.sub_category,
      item_name: newItem.service_name,
      unit_quantity: newItem.quantity,
      repeat_frequency: newItem.repeat_frequency,
      unit_price: newItem.unit_price,
      currency: newItem.currency,
      total_price: newItem.total_price,
      detail_description: ''
    };

    setQuoteItems([...quoteItems, item]);
    setNewItem({
      main_category: '',
      sub_category: '',
      service_name: '',
      unit_price: 0,
      currency: 'EUR',
      quantity: 1,
      repeat_frequency: 1,
      total_price: 0
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setQuoteItems(quoteItems.filter(item => item.id !== itemId));
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || '';
  };

  const getSubCategoryName = (subCategoryId: string) => {
    // Alt kategori artık string olarak saklanıyor, direkt döndür
    return subCategoryId || '';
  };

  const getAgencyName = (agencyId: string) => {
    return agencies.find(agency => agency.id === agencyId)?.name || '';
  };

  const getHotelName = (hotelId: string) => {
    return hotels.find(hotel => hotel.id === hotelId)?.name || '';
  };

  // Bu satır artık gerekli değil çünkü alt kategoriler ana kategori seçimine göre dinamik olarak yükleniyor

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Yeni Teklif Oluştur</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 transition-colors duration-200">TEMPUS TRAVEL formatında detaylı teklif hazırlayın</p>
            </div>
            <Link
              href="/quotes"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Tekliflere Dön
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 transition-colors duration-200">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Header Information - TEMPUS TRAVEL Style */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6 transition-colors duration-200">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 transition-colors duration-200">Teklif Bilgileri</h3>
              <div className="grid grid-cols-1 gap-6">
                {/* 1. Referans - Tek Bölüm Tam Genişlik */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                    REFERANS *
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                    placeholder="Referans numarası girin"
                  />
                </div>

                {/* 2. Acente + Firma - 2 Bölüm Yan Yana */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                      ACENTE *
                    </label>
                    <select
                      value={formData.agency_id}
                      onChange={(e) => {
                        const selectedAgencyId = e.target.value;
                        setFormData({ 
                          ...formData, 
                          agency_id: selectedAgencyId
                        });
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                    >
                      <option value="">Acente seçin</option>
                      {agencies?.map(agency => (
                        <option key={agency.id} value={agency.id}>{agency.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                      FİRMA *
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                      placeholder="Firma adını girin"
                    />
                  </div>
                </div>

                {/* 3. C-IN + C-OUT - 2 Bölüm Yan Yana */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                      C/IN TARİHİ *
                    </label>
                    <input
                      type="date"
                      value={formData.check_in_date}
                      onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                      C/OUT TARİHİ *
                    </label>
                    <input
                      type="date"
                      value={formData.check_out_date}
                      onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                    />
                  </div>
                </div>

                {/* 5. Otel + Otel Konsepti - 2 Bölüm Yan Yana */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                      OTEL *
                    </label>
                    <select
                      value={formData.hotel_id}
                      onChange={(e) => setFormData({ ...formData, hotel_id: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                    >
                      <option value="">Otel seçin</option>
                      {hotels?.map((hotel) => (
                        <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                      OTEL KONSEPTİ
                    </label>
                    <input
                      type="text"
                      value={hotels.find(h => h.id === formData.hotel_id)?.concept || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 transition-colors duration-200"
                      placeholder="Otel seçildiğinde otomatik doldurulur"
                    />
                  </div>
                </div>

                {/* 6. Oda + Pax Sayısı - 2 Bölüm Yan Yana */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                      ODA SAYISI
                    </label>
                    <input
                      type="number"
                      value={formData.room_count}
                      onChange={(e) => setFormData({ ...formData, room_count: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                      placeholder="200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                      PAX SAYISI
                    </label>
                    <input
                      type="number"
                      value={formData.pax_count}
                      onChange={(e) => setFormData({ ...formData, pax_count: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                      placeholder="350"
                    />
                  </div>
                </div>

                {/* 7. Teklif Türü + Opsiyon - 2 Bölüm Yan Yana */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                      TEKLİF TÜRÜ
                    </label>
                    <select
                      value={formData.quote_type}
                      onChange={(e) => setFormData({ ...formData, quote_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                    >
                      <option value="BİRİM">BİRİM</option>
                      <option value="PAKET">PAKET</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                      OPSİYON
                    </label>
                    <select
                      value={formData.option}
                      onChange={(e) => setFormData({ ...formData, option: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                    >
                      <option value="SOR - SAT">SOR - SAT</option>
                      <option value="1. OPSİYON">1. OPSİYON</option>
                      <option value="2. OPSİYON">2. OPSİYON</option>
                    </select>
                  </div>
                </div>

                {/* 8. Durum + Dosya Sorumlusu - 2 Bölüm Yan Yana */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                      DURUM
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                    >
                      <option value="TEKLİF">TEKLİF</option>
                      <option value="KONFİRME">KONFİRME</option>
                      <option value="İPTAL">İPTAL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                      DOSYA SORUMLUSU
                    </label>
                    <select
                      value={formData.file_manager}
                      onChange={(e) => setFormData({ ...formData, file_manager: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                    >
                      <option value="">Kullanıcı seçin</option>
                      {users?.map(user => (
                        <option key={user.id} value={user.id}>{user.first_name} {user.last_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 9. NOT - Tek Bölüm Tam Genişlik */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                    NOT
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                    placeholder="Ek notlar..."
                  />
                </div>
              </div>
            </div>

            {/* Yeni Hizmet Ekle Bölümü */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 transition-colors duration-200">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 transition-colors duration-200">Yeni Hizmet Ekle</h3>
              <div className="grid grid-cols-12 gap-4 items-end">
                {/* Ana Kategori */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                    Ana Kategori
                  </label>
                  <select
                    value={newItem.main_category}
                    onChange={(e) => {
                      setNewItem({ ...newItem, main_category: e.target.value, sub_category: '' });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                  >
                    <option value="">Seçin</option>
                    {categories?.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                {/* Alt Kategori */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                    Alt Kategori
                  </label>
                  <select
                    value={newItem.sub_category}
                    onChange={(e) => setNewItem({ ...newItem, sub_category: e.target.value })}
                    disabled={!newItem.main_category}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    <option value="">Seçin</option>
                    {(() => {
                      const selectedCategory = categories.find(c => c.id === newItem.main_category);
                      console.log('Selected category:', selectedCategory);
                      console.log('Sub categories:', selectedCategory?.sub_categories);
                      
                      if (selectedCategory && selectedCategory.sub_categories) {
                        return selectedCategory.sub_categories.map((sub, index) => (
                          <option key={index} value={sub}>{sub}</option>
                        ));
                      }
                      return null;
                    })()}
                  </select>
                </div>

                {/* Adet */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                    Adet
                  </label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 1;
                      setNewItem({ 
                        ...newItem, 
                        quantity: qty, 
                        total_price: newItem.unit_price * qty 
                      });
                    }}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                  />
                </div>

                {/* Tekrar */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                    Tekrar
                  </label>
                  <input
                    type="number"
                    value={newItem.repeat_frequency || 1}
                    onChange={(e) => {
                      const repeat = parseInt(e.target.value) || 1;
                      setNewItem({ 
                        ...newItem, 
                        repeat_frequency: repeat, 
                        total_price: newItem.unit_price * newItem.quantity * repeat 
                      });
                    }}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                  />
                </div>

                {/* Birim Fiyat */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                    Birim Fiyat
                  </label>
                  <input
                    type="number"
                    value={newItem.unit_price}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0;
                      setNewItem({ 
                        ...newItem, 
                        unit_price: price, 
                        total_price: price * newItem.quantity * (newItem.repeat_frequency || 1)
                      });
                    }}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                    placeholder="0.00"
                  />
                </div>

                {/* Döviz Cinsi */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                    Döviz
                  </label>
                  <select
                    value={newItem.currency}
                    onChange={(e) => setNewItem({ ...newItem, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="TRY">TRY</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>

                {/* Açıklama */}
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                    Açıklama
                  </label>
                  <input
                    type="text"
                    value={newItem.service_name}
                    onChange={(e) => setNewItem({ ...newItem, service_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                    placeholder="Hizmet açıklaması girin"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={addItem}
                  disabled={!newItem.main_category || !newItem.sub_category || !newItem.service_name || newItem.unit_price <= 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  Hizmet Ekle
                </button>
              </div>
            </div>

            {/* Quote Items Table */}
            {quoteItems.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 transition-colors duration-200">Teklif Kalemleri</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
                          Ana Kategori
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
                          Alt Kategori
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
                          Açıklama
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
                          Adet
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
                          Tekrar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
                          Birim Fiyat
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
                          Döviz
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
                          Toplam Fiyat
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                              {quoteItems?.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white transition-colors duration-200">
                            {getCategoryName(item.category_id)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white transition-colors duration-200">
                            {getSubCategoryName(item.sub_category_id)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white transition-colors duration-200">
                            {item.item_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white transition-colors duration-200">
                            {item.unit_quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white transition-colors duration-200">
                            {item.repeat_frequency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white transition-colors duration-200">
                            {item.unit_price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white transition-colors duration-200">
                            {item.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
                            {item.currency} {item.total_price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors duration-200"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div className="mt-6 text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
                    TOPLAM: {quoteItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)} {quoteItems[0]?.currency || 'EUR'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">KDV DAHİL</div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <Link
                href="/quotes"
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-200"
              >
                İptal
              </Link>
              <button
                type="submit"
                disabled={loading || quoteItems.length === 0}
                className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'Kaydediliyor...' : 'Teklif Oluştur'}
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 transition-colors duration-200">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2 transition-colors duration-200">💡 İpucu</h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm transition-colors duration-200">
            Önce kategori yönetimi sayfasından gerekli kategorileri oluşturun, sonra bu sayfada teklif kalemlerini ekleyin.
          </p>
          <Link
            href="/settings/categories"
            className="inline-block mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors duration-200"
          >
            Kategori Yönetimi →
          </Link>
        </div>
      </div>
    </div>
  );
} 