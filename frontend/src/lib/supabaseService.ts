import { api } from './api';
import { supabase, publicSupabase, Quote, QuoteItem, Project, Agency, Hotel, Category, BudgetItem, User } from './supabase';

// CATEGORIES
const categoriesCache = {
  data: null as Category[] | null,
  timestamp: 0
};

export const categoriesService = {
  // Tüm kategorileri getir - Public/Link görünümü için direkt Supabase kullan
  async getAll(): Promise<Category[]> {
    const now = Date.now();
    if (categoriesCache.data && (now - categoriesCache.timestamp < 30000)) { // 30 seconds cache
      return categoriesCache.data;
    }

    try {
      // Backend API yerine direkt Supabase - Public linkler için daha stabil
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      
      categoriesCache.data = data as Category[];
      categoriesCache.timestamp = now;
      return data as Category[];
    } catch (error) {
      console.error('categoriesService.getAll error:', error);
      throw error;
    }
  },

  // Kategori oluştur
  async create(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select()
        .single();
      if (error) throw error;
      categoriesCache.timestamp = 0;
      return data as Category;
    } catch (error) {
      console.error('categoriesService.create error:', error);
      throw error;
    }
  },

  // Kategori güncelle
  async update(id: string, category: Partial<Category>): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({ ...category, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      categoriesCache.timestamp = 0;
      return data as Category;
    } catch (error) {
      console.error('categoriesService.update error:', error);
      throw error;
    }
  },

  // Kategori sil
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      categoriesCache.timestamp = 0;
    } catch (error) {
      console.error('categoriesService.delete error:', error);
      throw error;
    }
  }
};

// QUOTES
// Helper function to clean internal tags from descriptions
const cleanDescription = (desc: string) => {
  if (!desc) return '';
  return desc
    .replace(/ \[T:.*?\]/g, '')
    .replace(/ \[S:.*?\]/g, '')
    .replace(/ \[R:.*?\]/g, '')
    .trim();
};

export const quotesService = {
  async getPage(params: {
    page?: number;
    pageSize?: number;
    filter?: string;
    searchTerm?: string;
    quoteDateStart?: string;
    quoteDateEnd?: string;
    checkInDate?: string;
    checkOutDate?: string;
    optionStart?: string;
    optionEnd?: string;
    optionFilter?: string;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<{ data: Quote[]; total: number; totalPages: number; page: number; pageSize: number }> {
    const page = Math.max(1, Number(params.page || 1));
    const pageSize = Math.max(1, Number(params.pageSize || 25));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('quotes').select('*, items:quote_items(currency)', { count: 'exact' });

    // RLS/Permission Filter
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (user) {
      const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
      const userRole = userData?.role || 'viewer';
      if (userRole !== 'super_admin' && userRole !== 'süper_admin' && userRole !== 'süper admin') {
        // Only show if user is in operation_managers, OR operation_managers is null/empty
        query = query.or(`operation_managers.cs.{"${user.id}"},operation_managers.is.null,operation_managers.eq.{}`);
      }
    }

    if (params.filter && params.filter !== 'all') {
      if (params.filter === 'BEKLEMEDE') {
        query = query.in('status', ['BEKLEMEDE', 'TEKLİF']);
      } else {
        query = query.eq('status', params.filter);
      }
    }
    if (params.quoteDateStart) query = query.gte('created_at', params.quoteDateStart);
    if (params.quoteDateEnd) query = query.lte('created_at', `${params.quoteDateEnd}T23:59:59`);
    if (params.checkInDate) query = query.eq('check_in_date', params.checkInDate);
    if (params.checkOutDate) query = query.eq('check_out_date', params.checkOutDate);
    if (params.optionStart) query = query.gte('option_date', params.optionStart);
    if (params.optionEnd) query = query.lte('option_date', params.optionEnd);
    if (params.optionFilter && params.optionFilter !== 'all') query = query.eq('option', params.optionFilter);
    if (params.searchTerm?.trim()) {
      const s = params.searchTerm.trim().replace(/[%_]/g, '\\$&');
      query = query.or(
        `reference.ilike.%${s}%,company_name.ilike.%${s}%,status.ilike.%${s}%,quote_type.ilike.%${s}%,option.ilike.%${s}%,room_pax.ilike.%${s}%,notes.ilike.%${s}%`
      );
    }

    const sortableFieldMap: Record<string, string> = {
      created_at: 'created_at',
      reference: 'reference',
      company_name: 'company_name',
      quote_type: 'quote_type',
      option: 'option',
      option_date: 'option_date',
      date: 'check_in_date',
      room_pax: 'room_pax',
      total_amount: 'total_amount',
      status: 'status'
    };
    const sortField = sortableFieldMap[params.sortField || ''] || 'created_at';
    const sortDirection = params.sortDirection === 'asc';

    const { data, count, error } = await query
      .order(sortField, { ascending: sortDirection, nullsFirst: false })
      .range(from, to);
    if (error) throw error;

    const total = count || 0;
    return {
      data: (data || []) as Quote[],
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      page,
      pageSize
    };
  },

  // Tüm teklifleri getir
  async getAll(): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select('*, items:quote_items(currency)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Teklif oluştur
  async create(quote: Omit<Quote, 'id' | 'created_at' | 'updated_at'>): Promise<Quote> {
    const { data, error } = await supabase
      .from('quotes')
      .insert([quote])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Teklif güncelle
  async update(id: string, quote: Partial<Quote>): Promise<Quote> {
    const response = await fetch(`/api/quotes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quote)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Teklif güncellenirken hata oluştu.");
    }
    
    const result = await response.json();
    return result.data;
  },

  async delete(id: string): Promise<void> {
    // Teklife bağlı projeleri de sil (ve onların alt kayıtları)
    const { data: linkedProjects, error: linkedProjectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('quote_id', id);
    if (linkedProjectsError) throw linkedProjectsError;

    // Bağlı projeler için tam cascade delete (frontend API'den veya supabase'den)
    for (const p of linkedProjects || []) {
      const { projectsService } = await import('./supabaseService');
      await projectsService.delete(p.id);
    }

    // Şimdi asıl teklifi API üzerinden sil (RLS'yi atlamak için)
    const response = await fetch(`/api/quotes/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Silme işlemi başarısız oldu.");
    }
  },

  // ID'ye göre teklif getir
  async getById(id: string): Promise<Quote | null> {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  // Teklifi projeye aktar
  async transferToProject(quoteId: string, customClient?: any): Promise<any> {
    const client = customClient || supabase;
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    
    // 1. Teklifi ve verilerini getir
    const { data: quote, error: qErr } = await client.from('quotes').select('*').eq('id', quoteId).single();
    if (qErr || !quote) throw new Error('Teklif bulunamadı');

    const { data: quoteItems, error: itemsErr } = await client.from('quote_items').select('*').eq('quote_id', quoteId);
    if (itemsErr) throw itemsErr;

    const hotelsData = (quote as any).hotels_data || [];
    const confirmedHotels = Array.isArray(hotelsData) 
      ? hotelsData.filter((h: any) => h.is_confirmed === true)
      : [];

    let hotelsToProcess = confirmedHotels;
    if (confirmedHotels.length === 0 && hotelsData.length > 0) {
      hotelsToProcess = hotelsData; // Eğer hiç konfirme otel seçilmemişse ama otel verisi varsa veri kaybını önlemek için tümünü aktar
    } else if (confirmedHotels.length === 0 && quote.hotel_id) {
      hotelsToProcess = [{
        id: Math.random().toString(36).substring(2, 11),
        hotel_id: quote.hotel_id,
        room_count: quote.room_count,
        pax_count: quote.pax_count,
        check_in_date: quote.check_in_date,
        check_out_date: quote.check_out_date,
        is_confirmed: true
      }];
    }

    const normalizedHotels: any[] = hotelsToProcess.map((h: any) => ({
      ...h,
      id: h.id && isUUID(h.id) ? h.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15))
    }));

    const firstH = normalizedHotels.length > 0 ? normalizedHotels[0] : null;
    const hotelId = firstH?.hotel_id || quote.hotel_id;
    
    const title = normalizedHotels.length > 1
      ? `${quote.reference} - Çoklu Konaklama`
      : `${quote.reference} - MICE Projesi`;
      
    const description = `Konfirme edilen teklif: ${quote.reference}`;
    const start_date = firstH?.check_in_date || quote.check_in_date || quote.created_at || new Date().toISOString().slice(0, 10);
    const end_date = firstH?.check_out_date || quote.check_out_date || start_date;

    const confirmedHotelIds = normalizedHotels.map((h: any) => h.hotel_id);
    const confirmedTabIds = hotelsToProcess.map((h: any) => h.id); // Orijinal tab ID'lerini kullan ki quote item'larındaki [T:...] tag'leri ile eşleşebilsin
    
    const extractTabId = (desc: string) => {
      const match = String(desc || '').match(/\[T:([^\]]+)\]/);
      return match ? match[1] : null;
    };

    const relevantItemsRaw = normalizedHotels.length > 0
      ? (quoteItems || []).filter(item => {
          const tabId = extractTabId(item.description) || item.hotel_id;
          return confirmedTabIds.includes(tabId || '') ||
                 confirmedHotelIds.includes(tabId || '') ||
                 !tabId || tabId === 'general';
        })
      : (quoteItems || []);

    const seen = new Set<string>();
    const relevantItems = relevantItemsRaw.filter(it => {
      const key = `${it.main_category}|${it.sub_category}|${it.description}|${it.hotel_id}|${it.unit_price}|${it.unit_quantity}|${it.sefer}|${it.vat}|${it.fx}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const withTabTag = (desc: string, tabId: string | null) => {
      const cleanDesc = String(desc || '').replace(/\s*\[T:[^\]]+\]\s*/g, ' ').trim();
      if (!tabId) return cleanDesc;
      return `${cleanDesc}${cleanDesc ? ' ' : ''}[T:${tabId}]`;
    };

    const budget = relevantItems.reduce((sum, it) => sum + (Number(it.total) || 0), 0);

    const { data: project, error: pErr } = await client.from('projects').insert([{
      title,
      description,
      status: 'active',
      priority: 'medium',
      start_date,
      end_date,
      budget,
      progress: 0,
      quote_id: quote.id,
      reference: quote.reference,
      company_name: quote.company_name,
      agency_id: quote.agency_id || null,
      hotel_id: hotelId || null,
      quote_type: quote.quote_type,
      room_count: firstH?.room_count || quote.room_count || 0,
      pax_count: firstH?.pax_count || quote.pax_count || 0,
      room_pax: `${firstH?.room_count || 0} | ${firstH?.pax_count || 0}`,
      hotels_data: normalizedHotels
    }]).select().single();

    if (pErr) throw pErr;

    const salesInserts = relevantItems.map(item => {
      const tabId = extractTabId(item.description) || item.hotel_id;
      const originalIndex = hotelsToProcess.findIndex((h: any) => h.id === tabId || h.hotel_id === tabId);
      const realHotelId = originalIndex !== -1 ? (normalizedHotels[originalIndex].hotel_id || null) : null;
      const tabUUID = originalIndex !== -1 ? normalizedHotels[originalIndex].id : null;
      
      return {
        project_id: project.id,
        reference: project.reference,
        category: item.main_category || '',
        sub_category: item.sub_category || '',
        description: withTabTag(item.description || '', tabUUID),
        unit_quantity: item.unit_quantity || 1,
        sefer: item.sefer || 1,
        unit_price: item.unit_price || 0,
        total_price: item.total || 0,
        currency: item.currency || 'EUR',
        vat: item.vat || 0,
        fx: item.fx || 1,
        hotel_id: realHotelId
      };
    });

    const purchaseInserts = relevantItems.map(item => {
      const tabId = extractTabId(item.description) || item.hotel_id;
      const originalIndex = hotelsToProcess.findIndex((h: any) => h.id === tabId || h.hotel_id === tabId);
      const realHotelId = originalIndex !== -1 ? (normalizedHotels[originalIndex].hotel_id || null) : null;
      const tabUUID = originalIndex !== -1 ? normalizedHotels[originalIndex].id : null;
      
      return {
        project_id: project.id,
        reference: project.reference,
        category: item.main_category || '',
        sub_category: item.sub_category || '',
        description: withTabTag(item.description || '', tabUUID),
        unit_quantity: item.unit_quantity || 1,
        sefer: item.sefer || 1,
        unit_price: 0,
        total_price: 0,
        currency: item.currency || 'EUR',
        vat: item.vat || 0,
        fx: item.fx || 1,
        hotel_id: realHotelId
      };
    });

    if (salesInserts.length > 0) {
      await client.from('project_sales_items').insert(salesInserts);
    }
    if (purchaseInserts.length > 0) {
      await client.from('project_purchase_items').insert(purchaseInserts);
    }

    return project;
  }
};

// QUOTE ITEMS
export const quoteItemsService = {
  // Teklif kalemlerini getir
  async getByQuoteId(quoteId: string): Promise<QuoteItem[]> {
    const { data, error } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Teklif kalemi oluştur
  async create(item: Omit<QuoteItem, 'id' | 'created_at'>): Promise<QuoteItem> {
    const { data, error } = await supabase
      .from('quote_items')
      .insert([item])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Teklif kalemi güncelle
  async update(id: string, item: Partial<QuoteItem>): Promise<QuoteItem> {
    const { data, error } = await supabase
      .from('quote_items')
      .update(item)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Teklif kalemi sil
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('quote_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Teklif kalemlerini toplu sil
  async deleteByQuoteId(quoteId: string): Promise<void> {
    const { error } = await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', quoteId);

    if (error) throw error;
  }
};

// PROJECTS
export const projectsService = {
  async getPage(params: {
    page?: number;
    pageSize?: number;
    filter?: string;
    searchTerm?: string;
    dateStart?: string;
    dateEnd?: string;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<{ data: Project[]; total: number; totalPages: number; page: number; pageSize: number }> {
    const page = Math.max(1, Number(params.page || 1));
    const pageSize = Math.max(1, Number(params.pageSize || 25));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('projects').select('*', { count: 'exact' });

    // RLS/Permission Filter
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (user) {
      const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
      const userRole = userData?.role || 'viewer';
      if (userRole !== 'super_admin' && userRole !== 'süper_admin' && userRole !== 'süper admin') {
        const { data: myProjectUsers } = await supabase.from('project_users').select('project_id').eq('user_id', user.id);
        const myProjectIds = (myProjectUsers || []).map(p => p.project_id);
        
        const { data: allProjectUsers } = await supabase.from('project_users').select('project_id');
        const allAssignedProjectIds = new Set((allProjectUsers || []).map(p => p.project_id));
        
        const { data: allProjects } = await supabase.from('projects').select('id');
        const allProjectIds = (allProjects || []).map(p => p.id);
        
        const allowedIds = allProjectIds.filter(id => 
          myProjectIds.includes(id) || !allAssignedProjectIds.has(id)
        );
        
        if (allowedIds.length > 0) {
          query = query.in('id', allowedIds);
        } else {
          query = query.eq('id', '00000000-0000-0000-0000-000000000000');
        }
      }
    }

    if (params.filter && params.filter !== 'all') {
      if (params.filter === 'on-hold') {
        query = query.in('status', ['on-hold', 'on_hold']);
      } else {
        query = query.eq('status', params.filter);
      }
    }
    if (params.dateStart) query = query.gte('start_date', params.dateStart);
    if (params.dateEnd) query = query.lte('end_date', params.dateEnd);
    if (params.searchTerm?.trim()) {
      const s = params.searchTerm.trim().replace(/[%_]/g, '\\$&');
      query = query.or(
        `title.ilike.%${s}%,description.ilike.%${s}%,status.ilike.%${s}%,reference.ilike.%${s}%,company_name.ilike.%${s}%,quote_type.ilike.%${s}%,room_pax.ilike.%${s}%`
      );
    }

    const sortableFieldMap: Record<string, string> = {
      created_at: 'created_at',
      reference: 'reference',
      start_date: 'start_date',
      company_name: 'company_name',
      agency_id: 'agency_id',
      hotel_id: 'hotel_id',
      quote_type: 'quote_type',
      room_pax: 'room_pax',
      team_members: 'team_members',
      status: 'status'
    };
    const sortField = sortableFieldMap[params.sortField || ''] || 'created_at';
    const sortDirection = params.sortDirection === 'asc';

    const { data, count, error } = await query
      .order(sortField, { ascending: sortDirection, nullsFirst: false })
      .range(from, to);
    if (error) throw error;
    const total = count || 0;
    return {
      data: (data || []) as Project[],
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      page,
      pageSize
    };
  },

  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    console.log('projectsService.create çağrıldı:', project);
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();

    if (error) {
      console.error('Supabase projects create hatası:', error);
      console.error('Hata detayları:', JSON.stringify(error, null, 2));
      throw error;
    }
    console.log('Proje başarıyla oluşturuldu:', data);
    return data;
  },

  async update(id: string, project: Partial<Project>): Promise<Project> {
    const payload = { ...project, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      const details = [error.message, error.details, error.hint, error.code].filter(Boolean).join(' | ');
      throw new Error(details || 'Proje güncelleme hatası');
    }
    // RLS bulunan ortamlarda update + select 406 üretebilir; burada satır döndürmeyi zorlamıyoruz.
    return data as Project;
  },

  async delete(id: string): Promise<void> {
    // Proje silinirken ilişkili tüm tablo kayıtlarını da temizle
    // Not: Birçok tabloda zaten ON DELETE CASCADE var; burada özellikle
    // manuel yönetilen/servis kullanılan tabloları da güvenli şekilde siliyoruz.

    // İlişkili kayıtları sil
    const deleteTasks: Promise<any>[] = [
      // Satış & alış kalemleri
      projectSalesItemsService?.deleteByProjectId?.(id),
      projectPurchaseItemsService?.deleteByProjectId?.(id),

      // Konaklama kalemleri
      projectAccommodationItemsService?.deleteByProjectId?.(id),

      // Etkinlik & aktiviteler

      // İnsan kaynakları

      // Diğer servisler

      // Finansal servisler

      // Tahsilat / ödeme planları ve kayıtları
      projectCollectionPlansService?.deleteByProjectId?.(id),
      projectCollectionsService?.deleteByProjectId?.(id),
      projectPaymentPlansService?.deleteByProjectId?.(id),
      projectPaymentsService?.deleteByProjectId?.(id),

      // Otel ekstraları

      // Transfer / tur kayıtları
      projectTransfersService?.deleteByProjectId?.(id),
      projectOthersService?.deleteByProjectId?.(id),

      // Proje kullanıcı eşleştirmeleri + public linkleri
      supabase.from('project_users').delete().eq('project_id', id),
      supabase.from('public_links').delete().eq('project_id', id),
    ].filter(Boolean) as Promise<any>[];

    const results = await Promise.allSettled(deleteTasks);
    const rejected = results.filter((res) => res.status === 'rejected') as PromiseRejectedResult[];
    if (rejected.length > 0) {
      console.warn(`Projeye bağlı bazı kayıtlar silinemedi (${rejected.length} hata).`);
    }

    // Muhasebe kalemlerini temizle (invoices tablosunda project_id yoksa invoice_items üzerinden bul)
    try {
      // 1. Projeye ait tüm satış ve alış kalemlerinin ID'lerini al
      const [salesItems, purchaseItems] = await Promise.all([
        supabase.from('project_sales_items').select('id').eq('project_id', id),
        supabase.from('project_purchase_items').select('id').eq('project_id', id)
      ]);

      const allProjectItemIds = [
        ...(salesItems.data || []).map(i => i.id),
        ...(purchaseItems.data || []).map(i => i.id)
      ];

      if (allProjectItemIds.length > 0) {
        // 2. Bu kalemlere bağlı invoice_items kayıtlarını bul
        const { data: relatedInvoiceItems } = await supabase
          .from('invoice_items')
          .select('invoice_id')
          .in('item_id', allProjectItemIds);

        const invoiceIds = Array.from(new Set((relatedInvoiceItems || []).map(ri => ri.invoice_id).filter(Boolean)));

        if (invoiceIds.length > 0) {
          // 3. Önce invoice_items, sonra invoices'ları sil
          await supabase.from('invoice_items').delete().in('invoice_id', invoiceIds);
          await supabase.from('invoices').delete().in('id', invoiceIds);
        }
      }
    } catch (err) {
      console.warn('Muhasebe kayıtları silinirken hata (devam ediliyor):', err);
    }


    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }
};

// PROJECT SALES ITEMS
export const projectSalesItemsService = {
  async getByProjectId(projectId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('project_sales_items')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(item: any): Promise<any> {
    const { data, error } = await supabase
      .from('project_sales_items')
      .insert([item])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, item: any): Promise<any> {
    const { data, error } = await supabase
      .from('project_sales_items')
      .update({ ...item, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_sales_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deleteByProjectId(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('project_sales_items')
      .delete()
      .eq('project_id', projectId);

    if (error) throw error;
  }
};

// PROJECT PURCHASE ITEMS
export const projectPurchaseItemsService = {
  async getByProjectId(projectId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('project_purchase_items')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(item: any): Promise<any> {
    const { data, error } = await supabase
      .from('project_purchase_items')
      .insert([item])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, item: any): Promise<any> {
    const { data, error } = await supabase
      .from('project_purchase_items')
      .update({ ...item, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_purchase_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deleteByProjectId(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('project_purchase_items')
      .delete()
      .eq('project_id', projectId);

    if (error) throw error;
  }
};

// AGENCIES
export const agenciesService = {
  async getAll(): Promise<Agency[]> {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(agency: Omit<Agency, 'id' | 'created_at' | 'updated_at'>): Promise<Agency> {
    const { data, error } = await supabase
      .from('agencies')
      .insert([agency])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, agency: Partial<Agency>): Promise<Agency> {
    const { data, error } = await supabase
      .from('agencies')
      .update({ ...agency, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('agencies')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// HOTELS
export const hotelsService = {
  async getAll(): Promise<Hotel[]> {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(hotel: Omit<Hotel, 'id' | 'created_at' | 'updated_at'>): Promise<Hotel> {
    const { data, error } = await supabase
      .from('hotels')
      .insert([hotel])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, hotel: Partial<Hotel>): Promise<Hotel> {
    const { data, error } = await supabase
      .from('hotels')
      .update({ ...hotel, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('hotels')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// BUDGET ITEMS

// BUDGET ITEMS
export const budgetItemsService = {
  async getAll(): Promise<BudgetItem[]> {
    const { data, error } = await supabase
      .from('budget_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(item: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>): Promise<BudgetItem> {
    const { data, error } = await supabase
      .from('budget_items')
      .insert([item])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, item: Partial<BudgetItem>): Promise<BudgetItem> {
    const { data, error } = await supabase
      .from('budget_items')
      .update({ ...item, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// USERS
export const usersService = {
  buildSafeUserPayload(user: any) {
    const firstName = (user?.first_name || '').toString().trim();
    const lastName = (user?.last_name || '').toString().trim();
    const fullName = (user?.full_name || `${firstName} ${lastName}`.trim()).toString().trim();
    return {
      email: user?.email,
      role: user?.role,
      is_active: user?.is_active,
      full_name: fullName || null
    };
  },

  // Tüm kullanıcıları getir - Backend API kullan
  async getAll(): Promise<User[]> {
    try {
      return await api.get('/api/admin/users');
    } catch (error) {
      console.error('usersService.getAll error:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('id,email,role,is_active,full_name,created_at,updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return data;
  },

  async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const payload = this.buildSafeUserPayload(user);
    const { data, error } = await supabase
      .from('users')
      .insert(payload as any)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data as User;
  },

  async update(id: string, user: Partial<User>): Promise<User> {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || 'Kullanıcı güncellenemedi');
    }

    const data = await res.json();
    return data.user;
  },

  async delete(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Kullanıcı silinemedi');
      }
    } catch (error) {
      console.error('usersService.delete error:', error);
      throw error;
    }
  },

  async toggleActive(id: string, isActive: boolean): Promise<User> {
    return this.update(id, { is_active: isActive });
  }
};

// USER PERMISSIONS
export const userPermissionsService = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByUserId(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  async create(permission: any): Promise<any> {
    const { data, error } = await supabase
      .from('user_permissions')
      .insert([permission])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, permission: any): Promise<any> {
    const { data, error } = await supabase
      .from('user_permissions')
      .update(permission)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_permissions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async upsert(permission: any): Promise<any> {
    const { data, error } = await supabase
      .from('user_permissions')
      .upsert([permission], { onConflict: 'user_id,permission_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// ROLES
export const rolesService = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(role: Omit<any, 'created_at' | 'updated_at'>): Promise<any> {
    const { data, error } = await supabase
      .from('roles')
      .insert([role])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, role: Partial<any>): Promise<any> {
    const { data, error } = await supabase
      .from('roles')
      .update({ ...role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// PERMISSIONS
export const permissionsService = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('module', { ascending: true })
      .order('action', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(permission: Omit<any, 'created_at' | 'updated_at'>): Promise<any> {
    const { data, error } = await supabase
      .from('permissions')
      .insert([permission])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, permission: Partial<any>): Promise<any> {
    const { data, error } = await supabase
      .from('permissions')
      .update({ ...permission, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('permissions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ROLE PERMISSIONS
export const rolePermissionsService = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*, permissions(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByRoleId(roleId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role_id', roleId);

    if (error) throw error;
    return data || [];
  },

  async create(permission: any): Promise<any> {
    const { data, error } = await supabase
      .from('role_permissions')
      .insert([permission])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, permission: any): Promise<any> {
    const { data, error } = await supabase
      .from('role_permissions')
      .update(permission)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async upsert(roleId: string, permissionId: string): Promise<any> {
    const { data, error } = await supabase
      .from('role_permissions')
      .upsert({ role_id: roleId, permission_id: permissionId }, { onConflict: 'role_id,permission_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteByRoleAndPermission(roleId: string, permissionId: string): Promise<void> {
    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId);

    if (error) throw error;
  }
};

// SUPPLIERS
export const suppliersService = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(supplier: Omit<any, 'id' | 'created_at' | 'updated_at'>): Promise<any> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([supplier])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, supplier: Partial<any>): Promise<any> {
    const { data, error } = await supabase
      .from('suppliers')
      .update({ ...supplier, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getActive(): Promise<any[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};

// SERVICE TYPES
export const serviceTypesService = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(serviceType: Omit<any, 'id' | 'created_at' | 'updated_at'>): Promise<any> {
    const { data, error } = await supabase
      .from('service_types')
      .insert([serviceType])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, serviceType: Partial<any>): Promise<any> {
    const { data, error } = await supabase
      .from('service_types')
      .update({ ...serviceType, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('service_types')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getActive(): Promise<any[]> {
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};

// SEJOURS
const normalizeCollectionType = (type: any): string => {
  const raw = String(type || '').toLowerCase().trim();
  if (!raw) return 'cash';
  if (raw === 'banka' || raw === 'havale' || raw === 'eft') return 'bank';
  if (raw === 'nakit') return 'cash';
  if (raw === 'pos' || raw === 'kredi_karti' || raw === 'kredi kartı') return 'card';
  if (raw === 'cek' || raw === 'çek' || raw === 'senet' || raw === 'cek/senet') return 'cheque';
  return raw;
};

export class SejourService {
  static async getSejoursPage(params: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    statusFilter?: string;
    startDate?: string;
    endDate?: string;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const pageSize = Math.max(1, Number(params.pageSize || 25));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('sejours')
      .select(`
        *,
        agencies(*),
        hotels(*),
        sejour_rooms(
          *,
          hotels(*)
        ),
        sejour_flights(*),
        sejour_transfers(
          *,
          suppliers(*)
        ),
        sejour_extra_services(
          *,
          service_types(*),
          suppliers(*)
        ),
        sejour_collections(*)
      `, { count: 'exact' });

    if (params.startDate) query = query.gte('check_in_date', params.startDate);
    if (params.endDate) query = query.lte('check_in_date', params.endDate);
    if (params.searchTerm?.trim()) {
      const s = params.searchTerm.trim().replace(/[%_]/g, '\\$&');
      query = query.or(`voucher_number.ilike.%${s}%,customer_name.ilike.%${s}%,status.ilike.%${s}%`);
    }
    if (params.statusFilter && params.statusFilter !== 'all') {
      const status = params.statusFilter.toLowerCase();
      if (status === 'konfirme') query = query.ilike('status', '%konf%');
      else if (status === 'bekleyen') query = query.ilike('status', '%bekle%');
      else if (status === 'iptal') query = query.ilike('status', '%iptal%');
    }

    const sortField = ['voucher_number', 'customer_name', 'status', 'check_in_date', 'check_out_date', 'created_at'].includes(params.sortField || '')
      ? (params.sortField as string)
      : 'created_at';
    const ascending = params.sortDirection === 'asc';

    const { data, count, error } = await query
      .order(sortField, { ascending, nullsFirst: false })
      .range(from, to);
    if (error) throw error;

    const mapped = (data || []).map((sejour: any) => ({
      id: sejour.id,
      voucherNumber: sejour.voucher_number || sejour.voucherNumber,
      customerType: sejour.customer_type || sejour.customerType,
      customerName: sejour.customer_name || sejour.customerName,
      agencyId: sejour.agency_id || sejour.agencyId,
      agencyName: sejour.agencies?.name || sejour.agencyName,
      checkInDate: sejour.check_in_date || sejour.checkInDate,
      checkOutDate: sejour.check_out_date || sejour.checkOutDate,
      check_in_date: sejour.check_in_date,
      check_out_date: sejour.check_out_date,
      totalAmount: sejour.total_amount || sejour.totalAmount || 0,
      total_amount: sejour.total_amount,
      currency: sejour.currency || 'TRY',
      status: sejour.status || 'BEKLEMEDE',
      notes: sejour.notes || '',
      costs: sejour.costs || { EUR: 0, USD: 0, TRY: 0, GBP: 0 },
      totals: sejour.totals || { EUR: 0, USD: 0, TRY: 0, GBP: 0 },
      profits: sejour.profits || { EUR: 0, USD: 0, TRY: 0, GBP: 0 },
      created_at: sejour.created_at,
      rooms: (sejour.sejour_rooms || []).map((room: any) => ({
        id: room.id,
        roomNumber: room.room_number || room.roomNumber,
        hotelId: room.hotel_id || room.hotelId,
        hotelName: room.hotels?.name || sejour.hotels?.name || room.hotel_id,
        accommodationType: room.accommodation_type || room.accommodationType,
        roomType: room.room_type || room.roomType,
        guestInfo: room.guest_info || room.guestInfo || '',
        adultCount: room.adult_count || room.adultCount || 1,
        childCount: room.child_count || room.childCount || 0,
        infantCount: room.infant_count || room.infantCount || 0,
        price: room.total_price || room.price || 0,
        pricePerNight: room.price_per_night || room.pricePerNight || 0,
        totalNights: room.total_nights || room.totalNights || 1,
        totalPrice: room.total_price || room.totalPrice || 0,
        currency: room.currency || 'TRY',
        costPrice: room.cost_price || room.costPrice || 0,
        costCurrency: room.cost_currency || room.costCurrency || room.currency || 'TRY'
      })),
      flights: (sejour.sejour_flights || []).map((flight: any) => ({
        ...flight,
        costPrice: flight.cost_price || flight.costPrice || 0,
        costCurrency: flight.cost_currency || flight.costCurrency || flight.currency || 'TRY'
      })),
      transfers: (sejour.sejour_transfers || []).map((transfer: any) => ({
        ...transfer,
        costPrice: transfer.cost_price || transfer.costPrice || 0,
        costCurrency: transfer.cost_currency || transfer.costCurrency || transfer.currency || 'TRY'
      })),
      extraServices: (sejour.sejour_extra_services || []).map((service: any) => ({
        ...service,
        costPrice: service.cost_price || service.costPrice || 0,
        costCurrency: service.cost_currency || service.costCurrency || service.currency || 'TRY'
      })),
      collections: (sejour.sejour_collections || []).map((collection: any) => ({
        id: collection.id,
        type: normalizeCollectionType(collection.payment_method || collection.type),
        amount: collection.amount || 0,
        date: collection.collection_date || collection.date || '',
        description: collection.description || '',
        note: collection.note || collection.description || '',
        currency: collection.currency || 'TRY'
      }))
    }));

    const total = count || 0;
    return {
      data: mapped,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
  }

  static async getSejours(filters: any = {}) {
    const { data, error } = await supabase
      .from('sejours')
      .select(`
        *,
        agencies(*),
        hotels(*),
        sejour_rooms(
          *,
          hotels(*)
        ),
        sejour_flights(*),
        sejour_transfers(
          *,
          suppliers(*)
        ),
        sejour_extra_services(
          *,
          service_types(*),
          suppliers(*)
        ),
        sejour_collections(*)
      `);

    if (error) throw error;

    // Verileri camelCase formatına dönüştür
    return (data || []).map((sejour: any) => ({
      id: sejour.id,
      voucherNumber: sejour.voucher_number || sejour.voucherNumber,
      customerType: sejour.customer_type || sejour.customerType,
      customerName: sejour.customer_name || sejour.customerName,
      agencyId: sejour.agency_id || sejour.agencyId,
      agencyName: sejour.agencies?.name || sejour.agencyName,
      checkInDate: sejour.check_in_date || sejour.checkInDate,
      checkOutDate: sejour.check_out_date || sejour.checkOutDate,
      check_in_date: sejour.check_in_date,
      check_out_date: sejour.check_out_date,
      totalAmount: sejour.total_amount || sejour.totalAmount || 0,
      total_amount: sejour.total_amount,
      currency: sejour.currency || 'TRY',
      status: sejour.status || 'BEKLEMEDE',
      notes: sejour.notes || '',
      costs: sejour.costs || { EUR: 0, USD: 0, TRY: 0, GBP: 0 },
      totals: sejour.totals || { EUR: 0, USD: 0, TRY: 0, GBP: 0 },
      profits: sejour.profits || { EUR: 0, USD: 0, TRY: 0, GBP: 0 },
      created_at: sejour.created_at,
      // İlişkili verileri dönüştür
      rooms: (sejour.sejour_rooms || []).map((room: any) => ({
        id: room.id,
        roomNumber: room.room_number || room.roomNumber,
        hotelId: room.hotel_id || room.hotelId,
        // Öncelik oda üzerinden gelen otel, ardından sejour'un kendi oteli, en son id
        hotelName: room.hotels?.name || sejour.hotels?.name || room.hotel_id,
        accommodationType: room.accommodation_type || room.accommodationType,
        roomType: room.room_type || room.roomType,
        guestInfo: room.guest_info || room.guestInfo || '',
        adultCount: room.adult_count || room.adultCount || 1,
        childCount: room.child_count || room.childCount || 0,
        infantCount: room.infant_count || room.infantCount || 0,
        price: room.total_price || room.price || 0,
        pricePerNight: room.price_per_night || room.pricePerNight || 0,
        totalNights: room.total_nights || room.totalNights || 1,
        totalPrice: room.total_price || room.totalPrice || 0,
        currency: room.currency || 'TRY',
        // Maliyet bilgileri
        costPrice: room.cost_price || room.costPrice || 0,
        costCurrency: room.cost_currency || room.costCurrency || room.currency || 'TRY'
      })),
      flights: (sejour.sejour_flights || []).map((flight: any) => ({
        id: flight.id,
        type: flight.flight_direction || (flight.departure_date ? 'departure' : 'return'),
        flightType: 'one_way', // Artık her kayıt tek yön
        flightDate: flight.flight_date || flight.departure_date || '',
        airline: flight.airline || flight.departure_airline || '',
        route: `${flight.departure_airport || ''} ${flight.arrival_airport || ''}`.trim() || '',
        flightNo: flight.flight_number || flight.departure_flight_number || '',
        departureTime: flight.departure_time || '',
        arrivalTime: flight.arrival_time || '',
        price: flight.total_price || flight.price || 0,
        currency: flight.currency || 'TRY',
        // Maliyet bilgileri
        costPrice: flight.cost_price || flight.costPrice || 0,
        costCurrency: flight.cost_currency || flight.costCurrency || flight.currency || 'TRY',
        ticketingProvider: flight.ticketing_provider || '',
        ticketingDate: flight.ticketing_date || '',
        pnr: flight.pnr || '',
        // Geriye dönük uyumluluk için
        departureAirline: flight.airline || flight.departure_airline,
        departureFlightNumber: flight.flight_number || flight.departure_flight_number,
        departureDate: flight.flight_date || flight.departure_date,
        departureAirport: flight.departure_airport,
        arrivalAirport: flight.arrival_airport,
        returnAirline: null,
        returnFlightNumber: null,
        returnDate: null,
        returnTime: null
      })),
      transfers: (sejour.sejour_transfers || []).map((transfer: any) => ({
        id: transfer.id,
        direction: transfer.direction || 'arrival',
        date: transfer.date || '',
        provider: transfer.supplier_id || transfer.provider || '',
        supplierId: transfer.supplier_id,
        supplierName: transfer.suppliers?.name,
        type: transfer.transfer_type || transfer.type || 'private',
        transferType: transfer.transfer_type,
        vehicle: transfer.vehicle || transfer.vehicle_type || transfer.vehicle || '',
        vehicleType: transfer.vehicle_type || transfer.vehicle,
        time: transfer.time || '',
        routeDescription: transfer.route_description || transfer.routeDescription || '',
        price: transfer.price || 0,
        currency: transfer.currency || 'TRY',
        // Maliyet bilgileri
        costPrice: transfer.cost_price || transfer.costPrice || 0,
        costCurrency: transfer.cost_currency || transfer.costCurrency || transfer.currency || 'TRY'
      })),
      extraServices: (sejour.sejour_extra_services || []).map((service: any) => ({
        id: service.id,
        serviceType: service.service_type_id || service.serviceType || '',
        serviceTypeId: service.service_type_id,
        serviceTypeName: service.service_types?.name,
        provider: service.supplier_id || service.provider || '',
        supplierId: service.supplier_id,
        supplierName: service.suppliers?.name,
        serviceName: service.service_name || service.serviceName || '',
        description: service.service_description || service.description || '',
        serviceDescription: service.service_description,
        price: service.price || 0,
        currency: service.currency || 'TRY',
        // Maliyet bilgileri
        costPrice: service.cost_price || service.costPrice || 0,
        costCurrency: service.cost_currency || service.costCurrency || service.currency || 'TRY'
      })),
      collections: (sejour.sejour_collections || []).map((collection: any) => ({
        id: collection.id,
        type: normalizeCollectionType(collection.payment_method || collection.type),
        amount: collection.amount || 0,
        date: collection.collection_date || collection.date || '',
        description: collection.description || '',
        note: collection.note || collection.description || '',
        currency: collection.currency || 'TRY'
      }))
    }));
  }

  static async getSejourWithDetails(sejourId: string) {
    const { data, error } = await supabase
      .from('sejours')
      .select(`
        *,
        agencies(*),
        hotels(*),
        sejour_rooms(
          *,
          hotels(*)
        ),
        sejour_flights(*),
        sejour_transfers(
          *,
          suppliers(*)
        ),
        sejour_extra_services(
          *,
          service_types(*),
          suppliers(*)
        ),
        sejour_collections(*)
      `)
      .eq('id', sejourId)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Verileri camelCase formatına dönüştür
    return {
      id: data.id,
      voucherNumber: data.voucher_number || data.voucherNumber,
      customerType: data.customer_type || data.customerType,
      customerName: data.customer_name || data.customerName,
      agencyId: data.agency_id || data.agencyId,
      agencyName: data.agencies?.name || data.agencyName,
      checkInDate: data.check_in_date || data.checkInDate,
      checkOutDate: data.check_out_date || data.checkOutDate,
      totalAmount: data.total_amount || data.totalAmount || 0,
      currency: data.currency || 'TRY',
      status: data.status || 'BEKLEMEDE',
      notes: data.notes || '',
      costs: data.costs || { EUR: 0, USD: 0, TRY: 0, GBP: 0 },
      totals: data.totals || { EUR: 0, USD: 0, TRY: 0, GBP: 0 },
      profits: data.profits || { EUR: 0, USD: 0, TRY: 0, GBP: 0 },
      created_at: data.created_at,
      // İlişkili verileri dönüştür
      rooms: (data.sejour_rooms || []).map((room: any) => ({
        id: room.id,
        roomNumber: room.room_number || room.roomNumber,
        hotelId: room.hotel_id || room.hotelId,
        hotelName: room.hotels?.name || data.hotels?.name,
        hotel: room.hotels || data.hotels,
        accommodationType: room.accommodation_type || room.accommodationType,
        roomType: room.room_type || room.roomType,
        guestInfo: room.guest_info || room.guestInfo || '',
        adultCount: room.adult_count || room.adultCount || 1,
        childCount: room.child_count || room.childCount || 0,
        infantCount: room.infant_count || room.infantCount || 0,
        price: room.total_price || room.price || 0,
        pricePerNight: room.price_per_night || room.pricePerNight || 0,
        totalNights: room.total_nights || room.totalNights || 1,
        totalPrice: room.total_price || room.totalPrice || 0,
        currency: room.currency || 'TRY',
        // Maliyet bilgileri
        costPrice:
          room.cost_price !== undefined && room.cost_price !== null
            ? Number(room.cost_price)
            : (room.costPrice !== undefined && room.costPrice !== null ? Number(room.costPrice) : 0),
        costCurrency: room.cost_currency ?? room.costCurrency ?? room.currency ?? 'TRY'
      })),
      flights: (data.sejour_flights || []).map((flight: any) => {
        // Yeni yapı: Her kayıt tek bir uçuş (gidiş veya dönüş)
        return {
          id: flight.id,
          type: flight.flight_direction || (flight.departure_date ? 'departure' : 'return'),
          flightType: 'one_way',
          flightDate: flight.flight_date || flight.departure_date || '',
          airline: flight.airline || flight.departure_airline || '',
          route: `${flight.departure_airport || ''} ${flight.arrival_airport || ''}`.trim() || flight.route_description || '',
          flightNo: flight.flight_number || flight.departure_flight_number || '',
          departureTime: flight.departure_time || '',
          arrivalTime: flight.arrival_time || '',
          pricePerPerson: flight.price_per_person || flight.pricePerPerson || 0,
          totalPassengers: flight.total_passengers || flight.totalPassengers || 1,
          totalPrice: flight.total_price || flight.totalPrice || flight.price || 0,
          price: flight.total_price || flight.totalPrice || flight.price || 0,
          currency: flight.currency || 'TRY',
          ticketingProvider: flight.ticketing_provider || '',
          ticketingDate: flight.ticketing_date || '',
          pnr: flight.pnr || '',
          // Maliyet bilgileri
          costPrice:
            flight.cost_price !== undefined && flight.cost_price !== null
              ? Number(flight.cost_price)
              : (flight.costPrice !== undefined && flight.costPrice !== null ? Number(flight.costPrice) : 0),
          costCurrency: flight.cost_currency ?? flight.costCurrency ?? flight.currency ?? 'TRY',
          // Geriye dönük uyumluluk için
          departureAirline: flight.airline || flight.departure_airline,
          departureFlightNumber: flight.flight_number || flight.departure_flight_number,
          departureDate: flight.flight_date || flight.departure_date,
          departureAirport: flight.departure_airport,
          arrivalAirport: flight.arrival_airport,
          returnAirline: null,
          returnFlightNumber: null,
          returnDate: null,
          returnTime: null
        };
      }),
      transfers: (data.sejour_transfers || []).map((transfer: any) => {
        // Transfer tarihi: önce transfer.date kullan, yoksa direction'a göre hesapla
        let transferDate = transfer.date || '';
        if (!transferDate) {
          if (transfer.direction === 'arrival') {
            transferDate = data.check_in_date || data.checkInDate || '';
          } else if (transfer.direction === 'return') {
            transferDate = data.check_out_date || data.checkOutDate || '';
          } else {
            transferDate = data.check_out_date || data.checkOutDate || '';
          }
        }

        return {
          id: transfer.id,
          direction: transfer.direction || 'arrival',
          date: transferDate,
          provider: transfer.supplier_id || transfer.provider || '',
          supplierId: transfer.supplier_id,
          supplierName: transfer.suppliers?.name,
          supplier: transfer.suppliers,
          type: transfer.transfer_type || transfer.type || 'private',
          transferType: transfer.transfer_type || transfer.type || 'private',
          vehicle: transfer.vehicle || transfer.vehicle_type || '',
          vehicleType: transfer.vehicle_type || transfer.vehicle || '',
          time: transfer.time || '',
          routeDescription: transfer.route_description || transfer.routeDescription || '',
          price: transfer.price || 0,
          currency: transfer.currency || 'TRY',
          // Maliyet bilgileri
          costPrice:
            transfer.cost_price !== undefined && transfer.cost_price !== null
              ? Number(transfer.cost_price)
              : (transfer.costPrice !== undefined && transfer.costPrice !== null ? Number(transfer.costPrice) : 0),
          costCurrency: transfer.cost_currency ?? transfer.costCurrency ?? transfer.currency ?? 'TRY'
        };
      }),
      extraServices: (data.sejour_extra_services || []).map((service: any) => ({
        id: service.id,
        serviceType: service.service_type_id || service.serviceType || '',
        serviceTypeId: service.service_type_id,
        serviceTypeName: service.service_types?.name,
        serviceTypeObj: service.service_types,
        provider: service.supplier_id || service.provider || '',
        supplierId: service.supplier_id,
        supplierName: service.suppliers?.name,
        supplier: service.suppliers,
        serviceName: service.service_name || service.serviceName || '',
        description: service.service_description || service.description || '',
        serviceDescription: service.service_description || service.description || '',
        price: service.price || 0,
        currency: service.currency || 'TRY',
        // Maliyet bilgileri
        costPrice:
          service.cost_price !== undefined && service.cost_price !== null
            ? Number(service.cost_price)
            : (service.costPrice !== undefined && service.costPrice !== null ? Number(service.costPrice) : 0),
        costCurrency: service.cost_currency ?? service.costCurrency ?? service.currency ?? 'TRY'
      })),
      collections: (data.sejour_collections || []).map((collection: any) => ({
        id: collection.id,
        type: normalizeCollectionType(collection.payment_method || collection.type),
        amount: collection.amount !== undefined && collection.amount !== null ? Number(collection.amount) : 0,
        date: collection.collection_date || collection.date || '',
        description: collection.description || '',
        note: collection.note || collection.description || '',
        currency: collection.currency ?? 'TRY'
      }))
    };
  }

  static async createSejour(sejourData: any) {
    const { data: sejour, error: sejourError } = await supabase
      .from('sejours')
      .insert({
        voucher_number: sejourData.voucherNumber,
        customer_type: sejourData.customerType,
        customer_name: sejourData.customerName,
        // Şahıs ise acente zorunlu olmadığından, boş string yerine null gönder
        agency_id: sejourData.customerType === 'agency' && sejourData.agencyId ? sejourData.agencyId : null,
        check_in_date: sejourData.checkInDate,
        check_out_date: sejourData.checkOutDate,
        status: sejourData.status || 'BEKLEMEDE',
        notes: sejourData.notes,
        total_amount: sejourData.totalAmount || 0,
        currency: sejourData.currency || 'TRY',
        costs: sejourData.costs || { EUR: 0, USD: 0, TRY: 0, GBP: 0 },
        totals: sejourData.totals || { EUR: 0, USD: 0, TRY: 0, GBP: 0 },
        profits: sejourData.profits || { EUR: 0, USD: 0, TRY: 0, GBP: 0 }
      })
      .select()
      .single();

    if (sejourError) {
      console.error('Sejour create error:', sejourError);
      // 409 hatası voucher number çakışması demektir
      if (sejourError.code === '23505' || sejourError.message?.includes('duplicate') || sejourError.message?.includes('unique')) {
        throw new Error('Bu voucher numarası zaten kullanılıyor. Lütfen farklı bir voucher numarası girin.');
      }
      throw sejourError;
    }

    // Odaları ekle
    if (sejourData.rooms && sejourData.rooms.length > 0) {
      const roomData = sejourData.rooms.map((room: any) => {
        const data: any = {
          sejour_id: sejour.id,
          voucher_number: sejour.voucher_number,
          room_number: room.roomNumber || null,
          hotel_id: room.hotelId || null,
          room_type: room.roomType || null,
          accommodation_type: room.accommodationType || null,
          guest_info: room.guestInfo || null,
          adult_count: room.adultCount || 1,
          child_count: room.childCount || 0,
          infant_count: room.infantCount || 0,
          // UI'da room.price satış tutarını (total_price) temsil eder
          total_price: room.totalPrice || room.price || 0,
          total_nights: room.totalNights || 1,
          price_per_night: room.pricePerNight || (room.totalNights > 0 && (room.totalPrice || room.price) ? (room.totalPrice || room.price) / room.totalNights : (room.totalPrice || room.price || 0)),
          currency: room.currency || 'TRY'
        };

        // Maliyet bilgileri (kolonlar varsa ekle - değer varsa veya 0 ise de ekle)
        // NOT: Kolonlar henüz Supabase'de yoksa bu alanlar eklenmeyecek
        // Migration çalıştırıldıktan sonra bu alanlar otomatik olarak eklenecek
        if (room.costPrice !== undefined && room.costPrice !== null) {
          data.cost_price = room.costPrice;
        }
        if (room.costCurrency || (room.costPrice !== undefined && room.costPrice !== null)) {
          data.cost_currency = room.costCurrency || room.currency || 'TRY';
        }

        return data;
      });

      console.log('Room data to insert:', roomData);

      // İlk deneme: Tüm verilerle (maliyet kolonları dahil)
      let { error: roomsError } = await supabase
        .from('sejour_rooms')
        .insert(roomData);

      // Eğer 400 hatası alırsak (kolon yoksa), maliyet kolonlarını çıkarıp tekrar dene
      if (roomsError && (roomsError.code === '42703' || roomsError.message?.includes('column') || roomsError.message?.includes('does not exist'))) {
        console.warn('Maliyet kolonları bulunamadı, maliyet verileri olmadan tekrar deneniyor...');
        const roomDataWithoutCost = roomData.map((room: any) => {
          const { cost_price, cost_currency, ...roomWithoutCost } = room;
          return roomWithoutCost;
        });

        const { error: retryError } = await supabase
          .from('sejour_rooms')
          .insert(roomDataWithoutCost);

        if (retryError) {
          roomsError = retryError;
        } else {
          roomsError = null;
        }
      }

      if (roomsError) {
        console.error('Rooms create error:', roomsError);
        console.error('Room data that failed:', roomData);
        throw roomsError;
      }
    }

    // Uçuşları ekle - Yeni yapı: Her uçuş ayrı kayıt
    if (sejourData.flights && sejourData.flights.length > 0) {
      const flightData = sejourData.flights.map((flight: any) => {
        // Route'dan havalimanlarını çıkar
        const routeParts = flight.route ? flight.route.split(' ') : [];
        const departureAirport = flight.departureAirport || (routeParts.length > 0 ? routeParts[0] : null);
        const arrivalAirport = flight.arrivalAirport || (routeParts.length > 1 ? routeParts[routeParts.length - 1] : null);

        const flightData: any = {
          sejour_id: sejour.id,
          voucher_number: sejour.voucher_number,
          flight_direction: flight.type || 'departure', // 'departure' veya 'return'
          // Uçuş bilgileri
          airline: flight.airline || flight.departureAirline || null,
          flight_number: flight.flightNo || flight.departureFlightNumber || null,
          flight_date: flight.flightDate || flight.departureDate || null,
          departure_time: flight.departureTime || null,
          arrival_time: flight.arrivalTime || null,
          departure_airport: departureAirport,
          arrival_airport: arrivalAirport,
          // Biletleme bilgileri
          ticketing_provider: flight.ticketingProvider || null,
          ticketing_date: flight.ticketingDate || null,
          pnr: flight.pnr || null,
          // Fiyat bilgileri
          price_per_person: flight.pricePerPerson || 0,
          total_passengers: flight.totalPassengers || 1,
          total_price: flight.totalPrice || flight.price || 0,
          currency: flight.currency || 'TRY'
        };

        // Maliyet bilgileri (kolonlar varsa ekle - sadece değer varsa)
        if (flight.costPrice !== undefined && flight.costPrice !== null) {
          flightData.cost_price = flight.costPrice;
        }
        if (flight.costCurrency || (flight.costPrice !== undefined && flight.costPrice !== null)) {
          flightData.cost_currency = flight.costCurrency || flight.currency || 'TRY';
        }

        return flightData;
      });

      console.log('Flight data to insert:', flightData);

      // İlk deneme: Tüm verilerle (maliyet kolonları dahil)
      let flightsError: any = null;
      const insertResult = await supabase
        .from('sejour_flights')
        .insert(flightData);
      flightsError = insertResult.error;

      // Eğer 400 hatası alırsak (kolon yoksa), maliyet kolonlarını çıkarıp tekrar dene
      if (flightsError && (flightsError.code === '42703' || flightsError.message?.includes('column') || flightsError.message?.includes('does not exist'))) {
        console.warn('Maliyet kolonları bulunamadı, maliyet verileri olmadan tekrar deneniyor...');
        const flightDataWithoutCost = flightData.map((flight: any) => {
          const { cost_price, cost_currency, ...flightWithoutCost } = flight;
          return flightWithoutCost;
        });

        const retryResult = await supabase
          .from('sejour_flights')
          .insert(flightDataWithoutCost);
        flightsError = retryResult.error;
      }

      if (flightsError) {
        console.error('Flights create error:', flightsError);
        console.error('Flight data that failed:', flightData);
        throw flightsError;
      }
    }

    // Transferleri ekle
    if (sejourData.transfers && sejourData.transfers.length > 0) {
      const transferData = sejourData.transfers.map((transfer: any) => {
        const data: any = {
          sejour_id: sejour.id,
          voucher_number: sejour.voucher_number,
          direction: transfer.direction || 'arrival', // NOT NULL constraint için her zaman ekle
          supplier_id: transfer.provider || transfer.supplierId || null,
          transfer_type: transfer.type || transfer.transferType || 'private', // NOT NULL constraint için varsayılan
          vehicle_type: transfer.vehicle || transfer.vehicleType || null,
          route_description: transfer.routeDescription || null,
          price: transfer.price || 0,
          currency: transfer.currency || 'TRY'
        };

        // Maliyet bilgileri (kolonlar varsa ekle - değer varsa veya 0 ise de ekle)
        if (transfer.costPrice !== undefined && transfer.costPrice !== null) {
          data.cost_price = transfer.costPrice;
        }
        if (transfer.costCurrency || (transfer.costPrice !== undefined && transfer.costPrice !== null)) {
          data.cost_currency = transfer.costCurrency || transfer.currency || 'TRY';
        }

        // Transfer tarihi: UI'dan gelen date değerini kullan
        if (transfer.date) {
          data.date = transfer.date;
        }

        // Eğer şemada time kolonu varsa ekle (opsiyonel)
        if (transfer.time) {
          data.time = transfer.time;
        }

        // Eğer şemada vehicle kolonu varsa ekle (vehicle_type yerine, opsiyonel)
        if (transfer.vehicle && !transfer.vehicleType) {
          data.vehicle = transfer.vehicle;
        }

        return data;
      });

      console.log('Transfer data to insert:', transferData);

      // İlk deneme: Tüm verilerle (maliyet kolonları dahil)
      let transfersError: any = null;
      const insertResult = await supabase
        .from('sejour_transfers')
        .insert(transferData);
      transfersError = insertResult.error;

      // Eğer 400 hatası alırsak (kolon yoksa), maliyet kolonlarını çıkarıp tekrar dene
      if (transfersError && (transfersError.code === '42703' || transfersError.message?.includes('column') || transfersError.message?.includes('does not exist'))) {
        console.warn('Maliyet kolonları bulunamadı, maliyet verileri olmadan tekrar deneniyor...');
        const transferDataWithoutCost = transferData.map((transfer: any) => {
          const { cost_price, cost_currency, ...transferWithoutCost } = transfer;
          return transferWithoutCost;
        });

        const retryResult = await supabase
          .from('sejour_transfers')
          .insert(transferDataWithoutCost);
        transfersError = retryResult.error;
      }

      if (transfersError) {
        console.error('Transfers create error:', transfersError);
        console.error('Transfer data that failed:', transferData);
        throw transfersError;
      }
    }

    // Ek hizmetleri ekle
    if (sejourData.extraServices && sejourData.extraServices.length > 0) {
      const serviceData = sejourData.extraServices.map((service: any) => {
        const data: any = {
          sejour_id: sejour.id,
          voucher_number: sejour.voucher_number,
          service_type_id: service.serviceType || service.serviceTypeId || null,
          supplier_id: service.provider || service.supplierId || null,
          service_name: service.serviceName || service.service_types?.name || service.serviceTypeName || null,
          service_description: service.description || service.serviceDescription || null,
          price: service.price || 0,
          currency: service.currency || 'TRY'
        };

        // Maliyet bilgileri (kolonlar varsa ekle - değer varsa veya 0 ise de ekle)
        if (service.costPrice !== undefined && service.costPrice !== null) {
          data.cost_price = service.costPrice;
        }
        if (service.costCurrency || (service.costPrice !== undefined && service.costPrice !== null)) {
          data.cost_currency = service.costCurrency || service.currency || 'TRY';
        }

        return data;
      });

      console.log('Service data to insert:', serviceData);

      // İlk deneme: Tüm verilerle (maliyet kolonları dahil)
      let servicesError: any = null;
      const insertResult = await supabase
        .from('sejour_extra_services')
        .insert(serviceData);
      servicesError = insertResult.error;

      // Eğer 400 hatası alırsak (kolon yoksa), maliyet kolonlarını çıkarıp tekrar dene
      if (servicesError && (servicesError.code === '42703' || servicesError.message?.includes('column') || servicesError.message?.includes('does not exist'))) {
        console.warn('Maliyet kolonları bulunamadı, maliyet verileri olmadan tekrar deneniyor...');
        const serviceDataWithoutCost = serviceData.map((service: any) => {
          const { cost_price, cost_currency, ...serviceWithoutCost } = service;
          return serviceWithoutCost;
        });

        const retryResult = await supabase
          .from('sejour_extra_services')
          .insert(serviceDataWithoutCost);
        servicesError = retryResult.error;
      }

      if (servicesError) {
        console.error('Extra services create error:', servicesError);
        console.error('Service data that failed:', serviceData);
        throw servicesError;
      }
    }

    // Tahsilatları ekle
    if (sejourData.collections && sejourData.collections.length > 0) {
      const collectionData = sejourData.collections.map((collection: any) => ({
        sejour_id: sejour.id,
        voucher_number: sejour.voucher_number,
        collection_date: collection.date || new Date().toISOString().split('T')[0],
        amount: collection.amount || 0,
        currency: collection.currency || 'TRY',
        payment_method: collection.type || 'cash',
        description: collection.description || null,
        status: 'completed'
      }));

      const { error: collectionsError } = await supabase
        .from('sejour_collections')
        .insert(collectionData);

      if (collectionsError) {
        console.error('Collections create error:', collectionsError);
        throw collectionsError;
      }
    }

    return sejour;
  }

  static async updateSejour(sejourId: string, sejourData: any) {
    // Ana sejour bilgilerini güncelle
    const { error: sejourError } = await supabase
      .from('sejours')
      .update({
        voucher_number: sejourData.voucherNumber,
        customer_type: sejourData.customerType,
        customer_name: sejourData.customerName,
        // Hem eski alan adı (agency_id) hem yeni alan adı (agencyId) destekleniyor
        // Şahıs ise acente zorunlu olmadığından, boş string yerine null gönder
        agency_id:
          sejourData.customerType === 'agency'
            ? (sejourData.agency_id || sejourData.agencyId || null)
            : null,
        check_in_date: sejourData.checkInDate,
        check_out_date: sejourData.checkOutDate,
        hotel_id: sejourData.hotel_id,
        hotel_name: sejourData.hotelName,
        hotel_address: sejourData.hotelAddress,
        status: sejourData.status || 'confirmed',
        notes: sejourData.notes,
        total_amount: sejourData.totalAmount,
        currency: sejourData.currency,
        costs: sejourData.costs,
        totals: sejourData.totals,
        profits: sejourData.profits,
        updated_at: new Date().toISOString()
      })
      .eq('id', sejourId);

    if (sejourError) throw sejourError;

    // Mevcut odaları sil ve yenilerini ekle
    if (sejourData.rooms) {
      await supabase.from('sejour_rooms').delete().eq('sejour_id', sejourId);

      if (sejourData.rooms.length > 0) {
        const roomData = sejourData.rooms.map((room: any) => {
          // UI'da room.price satış tutarını (total_price) temsil eder
          const totalPrice = room.price !== undefined ? room.price : (room.totalPrice || 0);
          const totalNights = room.totalNights || 1;
          const pricePerNight = totalNights > 0 ? totalPrice / totalNights : totalPrice;

          const data: any = {
            sejour_id: sejourId,
            voucher_number: sejourData.voucherNumber,
            room_number: room.roomNumber,
            hotel_id: room.hotelId,
            room_type: room.roomType,
            accommodation_type: room.accommodationType,
            guest_info: room.guestInfo,
            adult_count: room.adultCount || 1,
            child_count: room.childCount || 0,
            infant_count: room.infantCount || 0,
            price_per_night: pricePerNight,
            total_nights: totalNights,
            total_price: totalPrice,
            currency: room.currency || 'TRY'
          };

          // Maliyet bilgileri (kolonlar varsa ekle - değer varsa veya 0 ise de ekle)
          if (room.costPrice !== undefined && room.costPrice !== null) {
            data.cost_price = room.costPrice;
          }
          if (room.costCurrency || (room.costPrice !== undefined && room.costPrice !== null)) {
            data.cost_currency = room.costCurrency || room.currency || 'TRY';
          }

          return data;
        });

        // İlk deneme: Tüm verilerle (maliyet kolonları dahil)
        let roomsError: any = null;
        const insertResult = await supabase
          .from('sejour_rooms')
          .insert(roomData);
        roomsError = insertResult.error;

        // Eğer 400 hatası alırsak (kolon yoksa), maliyet kolonlarını çıkarıp tekrar dene
        if (roomsError && (roomsError.code === '42703' || roomsError.message?.includes('column') || roomsError.message?.includes('does not exist'))) {
          console.warn('Maliyet kolonları bulunamadı, maliyet verileri olmadan tekrar deneniyor...');
          const roomDataWithoutCost = roomData.map((room: any) => {
            const { cost_price, cost_currency, ...roomWithoutCost } = room;
            return roomWithoutCost;
          });

          const retryResult = await supabase
            .from('sejour_rooms')
            .insert(roomDataWithoutCost);
          roomsError = retryResult.error;
        }

        if (roomsError) throw roomsError;
      }
    }

    // Mevcut uçuşları sil ve yenilerini ekle - Yeni yapı: Her uçuş ayrı kayıt
    if (sejourData.flights) {
      await supabase.from('sejour_flights').delete().eq('sejour_id', sejourId);

      if (sejourData.flights.length > 0) {
        const flightData = sejourData.flights.map((flight: any) => {
          // Route'dan havalimanlarını çıkar
          const routeParts = flight.route ? flight.route.split(' ') : [];
          const departureAirport = flight.departureAirport || (routeParts.length > 0 ? routeParts[0] : null);
          const arrivalAirport = flight.arrivalAirport || (routeParts.length > 1 ? routeParts[routeParts.length - 1] : null);

          const flightData: any = {
            sejour_id: sejourId,
            voucher_number: sejourData.voucherNumber,
            flight_direction: flight.type || 'departure', // 'departure' veya 'return'
            // Uçuş bilgileri
            airline: flight.airline || flight.departureAirline || null,
            flight_number: flight.flightNo || flight.departureFlightNumber || null,
            flight_date: flight.flightDate || flight.departureDate || null,
            departure_time: flight.departureTime || null,
            arrival_time: flight.arrivalTime || null,
            departure_airport: departureAirport,
            arrival_airport: arrivalAirport,
            // Biletleme bilgileri
            ticketing_provider: flight.ticketingProvider || null,
            ticketing_date: flight.ticketingDate || null,
            pnr: flight.pnr || null,
            // Fiyat bilgileri
            price_per_person: flight.pricePerPerson || 0,
            total_passengers: flight.totalPassengers || 1,
            total_price: flight.price !== undefined ? flight.price : (flight.totalPrice || 0),
            currency: flight.currency || 'TRY'
          };

          // Maliyet bilgileri (kolonlar varsa ekle - değer varsa veya 0 ise de ekle)
          if (flight.costPrice !== undefined && flight.costPrice !== null) {
            flightData.cost_price = flight.costPrice;
          }
          if (flight.costCurrency || (flight.costPrice !== undefined && flight.costPrice !== null)) {
            flightData.cost_currency = flight.costCurrency || flight.currency || 'TRY';
          }

          return flightData;
        });

        // İlk deneme: Tüm verilerle (maliyet kolonları dahil)
        let flightsError: any = null;
        const insertResult = await supabase
          .from('sejour_flights')
          .insert(flightData);
        flightsError = insertResult.error;

        // Eğer 400 hatası alırsak (kolon yoksa), maliyet kolonlarını çıkarıp tekrar dene
        if (flightsError && (flightsError.code === '42703' || flightsError.message?.includes('column') || flightsError.message?.includes('does not exist'))) {
          console.warn('Maliyet kolonları bulunamadı, maliyet verileri olmadan tekrar deneniyor...');
          const flightDataWithoutCost = flightData.map((flight: any) => {
            const { cost_price, cost_currency, ...flightWithoutCost } = flight;
            return flightWithoutCost;
          });

          const retryResult = await supabase
            .from('sejour_flights')
            .insert(flightDataWithoutCost);
          flightsError = retryResult.error;
        }

        if (flightsError) {
          console.error('Flights update error:', flightsError);
          console.error('Flight data:', flightData);
          throw flightsError;
        }
      }
    }

    // Mevcut transferleri sil ve yenilerini ekle
    if (sejourData.transfers) {
      await supabase.from('sejour_transfers').delete().eq('sejour_id', sejourId);

      if (sejourData.transfers.length > 0) {
        const transferData = sejourData.transfers.map((transfer: any) => {
          const data: any = {
            sejour_id: sejourId,
            voucher_number: sejourData.voucherNumber,
            direction: transfer.direction || 'arrival', // NOT NULL constraint için her zaman ekle
            supplier_id: transfer.provider || transfer.supplierId || null,
            transfer_type: transfer.type || transfer.transferType || 'private', // NOT NULL constraint için varsayılan
            vehicle_type: transfer.vehicle || transfer.vehicleType || null,
            route_description: transfer.routeDescription || null,
            price: transfer.price !== undefined ? transfer.price : 0,
            currency: transfer.currency || 'TRY'
          };

          // Maliyet bilgileri (kolonlar varsa ekle - değer varsa veya 0 ise de ekle)
          if (transfer.costPrice !== undefined && transfer.costPrice !== null) {
            data.cost_price = transfer.costPrice;
          }
          if (transfer.costCurrency || (transfer.costPrice !== undefined && transfer.costPrice !== null)) {
            data.cost_currency = transfer.costCurrency || transfer.currency || 'TRY';
          }

          // Transfer tarihi: UI'dan gelen date değerini kullan
          if (transfer.date) {
            data.date = transfer.date;
          }

          // Eğer şemada time kolonu varsa ekle (opsiyonel)
          if (transfer.time) {
            data.time = transfer.time;
          }

          // Eğer şemada vehicle kolonu varsa ekle (vehicle_type yerine, opsiyonel)
          if (transfer.vehicle && !transfer.vehicleType) {
            data.vehicle = transfer.vehicle;
          }

          return data;
        });

        // İlk deneme: Tüm verilerle (maliyet kolonları dahil)
        let transfersError: any = null;
        const insertResult = await supabase
          .from('sejour_transfers')
          .insert(transferData);
        transfersError = insertResult.error;

        // Eğer 400 hatası alırsak (kolon yoksa), maliyet kolonlarını çıkarıp tekrar dene
        if (transfersError && (transfersError.code === '42703' || transfersError.message?.includes('column') || transfersError.message?.includes('does not exist'))) {
          console.warn('Maliyet kolonları bulunamadı, maliyet verileri olmadan tekrar deneniyor...');
          const transferDataWithoutCost = transferData.map((transfer: any) => {
            const { cost_price, cost_currency, ...transferWithoutCost } = transfer;
            return transferWithoutCost;
          });

          const retryResult = await supabase
            .from('sejour_transfers')
            .insert(transferDataWithoutCost);
          transfersError = retryResult.error;
        }

        if (transfersError) throw transfersError;
      }
    }

    // Mevcut ek hizmetleri sil ve yenilerini ekle
    if (sejourData.extraServices) {
      await supabase.from('sejour_extra_services').delete().eq('sejour_id', sejourId);

      if (sejourData.extraServices.length > 0) {
        const serviceData = sejourData.extraServices.map((service: any) => {
          const data: any = {
            sejour_id: sejourId,
            voucher_number: sejourData.voucherNumber,
            service_type_id: service.serviceType || service.serviceTypeId || null,
            supplier_id: service.provider || service.supplierId || null,
            service_name: service.serviceName || null,
            service_description: service.description || service.serviceDescription || null,
            price: service.price !== undefined ? service.price : 0,
            currency: service.currency || 'TRY'
          };

          // Maliyet bilgileri (kolonlar varsa ekle - değer varsa veya 0 ise de ekle)
          if (service.costPrice !== undefined && service.costPrice !== null) {
            data.cost_price = service.costPrice;
          }
          if (service.costCurrency || (service.costPrice !== undefined && service.costPrice !== null)) {
            data.cost_currency = service.costCurrency || service.currency || 'TRY';
          }

          return data;
        });

        // İlk deneme: Tüm verilerle (maliyet kolonları dahil)
        let servicesError: any = null;
        const insertResult = await supabase
          .from('sejour_extra_services')
          .insert(serviceData);
        servicesError = insertResult.error;

        // Eğer 400 hatası alırsak (kolon yoksa), maliyet kolonlarını çıkarıp tekrar dene
        if (servicesError && (servicesError.code === '42703' || servicesError.message?.includes('column') || servicesError.message?.includes('does not exist'))) {
          console.warn('Maliyet kolonları bulunamadı, maliyet verileri olmadan tekrar deneniyor...');
          const serviceDataWithoutCost = serviceData.map((service: any) => {
            const { cost_price, cost_currency, ...serviceWithoutCost } = service;
            return serviceWithoutCost;
          });

          const retryResult = await supabase
            .from('sejour_extra_services')
            .insert(serviceDataWithoutCost);
          servicesError = retryResult.error;
        }

        if (servicesError) throw servicesError;
      }
    }

    // Mevcut tahsilatları sil ve yenilerini ekle
    if (sejourData.collections !== undefined) {
      await supabase.from('sejour_collections').delete().eq('sejour_id', sejourId);

      if (sejourData.collections.length > 0) {
        const collectionData = sejourData.collections.map((collection: any) => ({
          sejour_id: sejourId,
          voucher_number: sejourData.voucherNumber,
          collection_date: collection.date || new Date().toISOString().split('T')[0],
          amount: collection.amount || 0,
          currency: collection.currency || 'TRY',
          payment_method: collection.type || 'cash',
          description: collection.description || null,
          status: 'completed'
        }));

        const { error: collectionsError } = await supabase
          .from('sejour_collections')
          .insert(collectionData);

        if (collectionsError) {
          console.error('Collections update error:', collectionsError);
          throw collectionsError;
        }
      }
    }

    return { id: sejourId, ...sejourData };
  }

  static async deleteSejour(sejourId: string) {
    // Sejour rezervasyonu silinirken ilişkili tüm alt tabloları da temizle
    const [rooms, flights, transfers, extras] = await Promise.all([
      supabase.from('sejour_rooms').select('id').eq('sejour_id', sejourId),
      supabase.from('sejour_flights').select('id').eq('sejour_id', sejourId),
      supabase.from('sejour_transfers').select('id').eq('sejour_id', sejourId),
      supabase.from('sejour_extra_services').select('id').eq('sejour_id', sejourId)
    ]);
    if (rooms.error) throw rooms.error;
    if (flights.error) throw flights.error;
    if (transfers.error) throw transfers.error;
    if (extras.error) throw extras.error;

    const allItemIds = [
      ...(rooms.data || []).map((r: any) => r.id),
      ...(flights.data || []).map((r: any) => r.id),
      ...(transfers.data || []).map((r: any) => r.id),
      ...(extras.data || []).map((r: any) => r.id)
    ];

    // Muhasebe bağlı kalemleri temizle
    if (allItemIds.length > 0) {
      try {
        const { data: relatedInvoiceItems } = await supabase
          .from('invoice_items')
          .select('invoice_id')
          .in('item_id', allItemIds);

        const invoiceIds = Array.from(new Set((relatedInvoiceItems || []).map(ri => ri.invoice_id).filter(Boolean)));

        if (invoiceIds.length > 0) {
          await supabase.from('invoice_items').delete().in('invoice_id', invoiceIds);
          await supabase.from('invoices').delete().in('id', invoiceIds);
        }
        
        // Kalan item_id bazlı kayıtları da temizle (Eğer varsa)
        await supabase.from('invoice_items').delete().in('item_id', allItemIds);
      } catch (err) {
        console.warn('Sejour muhasebe kayıtları silinirken hata:', err);
      }
    }

    // Sejour alt kayıtları
    const childDeleteResults = await Promise.all([
      supabase.from('sejour_rooms').delete().eq('sejour_id', sejourId),
      supabase.from('sejour_flights').delete().eq('sejour_id', sejourId),
      supabase.from('sejour_transfers').delete().eq('sejour_id', sejourId),
      supabase.from('sejour_extra_services').delete().eq('sejour_id', sejourId),
      supabase.from('sejour_collections').delete().eq('sejour_id', sejourId),
      supabase.from('public_links').delete().eq('project_id', sejourId)
    ]);
    for (const result of childDeleteResults) {
      if (result.error) throw result.error;
    }

    const { error } = await supabase
      .from('sejours')
      .delete()
      .eq('id', sejourId);

    if (error) throw error;
    return true;
  }
}

// AGENCIES
export class AgencyService {
  static async getAgencies() {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }
}

// HOTELS
export class HotelService {
  static async getHotels() {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }
}

// SUPPLIERS
export class SupplierService {
  static async getSuppliers() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }
}

// SERVICE TYPES
export class ServiceTypeService {
  static async getServiceTypes() {
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }
}

export class SettingsService {
  static async getSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('*');

    if (error) throw error;

    // Settings'i key-value objesi olarak döndür
    const settings: any = {};
    data?.forEach(setting => {
      try {
        // Value JSON string ise parse et, değilse olduğu gibi kullan
        if (typeof setting.value === 'string') {
          try {
            settings[setting.key] = JSON.parse(setting.value);
          } catch {
            // JSON değilse olduğu gibi kullan
            settings[setting.key] = setting.value;
          }
        } else {
          settings[setting.key] = setting.value;
        }
      } catch (parseError) {
        console.error(`Error parsing setting ${setting.key}:`, parseError);
        settings[setting.key] = setting.value;
      }
    });

    return settings;
  }

  static async updateSetting(key: string, value: any) {
    // Value object veya array ise JSON string'e çevir
    let valueToStore = value;
    if (typeof value === 'object' && value !== null) {
      valueToStore = JSON.stringify(value);
    }

    // Önce mevcut kaydı kontrol et
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('key', key)
      .single();

    if (existing) {
      // Güncelle
      const { data, error } = await supabase
        .from('settings')
        .update({
          value: valueToStore,
          updated_at: new Date().toISOString()
        })
        .eq('key', key)
        .select();

      if (error) throw error;
      return data;
    } else {
      // Yeni oluştur
      const { data, error } = await supabase
        .from('settings')
        .insert({
          key,
          value: valueToStore,
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;
      return data;
    }
  }
}

// PROJECT ACCOMMODATION ITEMS
export const projectAccommodationItemsService = {
  async getByProjectId(projectId: string) {
    const { data, error } = await supabase
      .from('project_accommodation_items')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(item: any) {
    const { data, error } = await supabase
      .from('project_accommodation_items')
      .insert(item)
      .select()
      .single();

    if (error) {
      console.error('🔍 Supabase Konaklama create hatası:', JSON.stringify(error, null, 2));
      throw error;
    }
    return data;
  },

  async update(id: string, item: any) {
    const { data, error } = await supabase
      .from('project_accommodation_items')
      .update(item)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('🔍 Supabase Konaklama update hatası:', JSON.stringify(error, null, 2));
      throw error;
    }
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('project_accommodation_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deleteByProjectId(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('project_accommodation_items')
      .delete()
      .eq('project_id', projectId);

    if (error) throw error;
  }
};

// PROJECT HOTEL EXTRAS

// PROJECT TRANSFERS
export const projectTransfersService = {
  async getByProjectId(projectId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('project_transfer_tour')
      .select(`
        *,
        supplier:suppliers(name, contact_person, phone, email)
      `)
      .eq('project_id', projectId)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(transfer: Omit<any, 'id' | 'created_at' | 'updated_at'>): Promise<any> {
    console.log('🔍 Supabase create çağrısı:', transfer);

    const { data, error } = await supabase
      .from('project_transfer_tour')
      .insert([transfer])
      .select(`
        *,
        supplier:suppliers(name, contact_person, phone, email)
      `)
      .single();

    if (error) {
      console.error('🔍 Supabase create hatası:', error);
      console.error('🔍 Hata detayları:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    console.log('🔍 Supabase create başarılı:', data);
    return data;
  },

  async update(id: string, transfer: Partial<any>): Promise<any> {
    const { data, error } = await supabase
      .from('project_transfer_tour')
      .update({ ...transfer, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        supplier:suppliers(name, contact_person, phone, email)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_transfer_tour')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deleteMultiple(transferIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('project_transfer_tour')
      .delete()
      .in('id', transferIds);

    if (error) throw error;
  },

  async deleteByProjectId(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('project_transfer_tour')
      .delete()
      .eq('project_id', projectId);

    if (error) throw error;
  },

  async getStats(projectId: string): Promise<any> {
    const { data, error } = await supabase
      .from('project_transfer_tour')
      .select('passenger_count, cost_amount, currency')
      .eq('project_id', projectId);

    if (error) throw error;

    // Döviz bazında toplam hesaplamaları
    const totalsByCurrency: { [key: string]: { kisiSayisi: number; toplamMaliyet: number } } = {};

    data?.forEach(transfer => {
      const currency = transfer.currency || 'TRY';
      if (!totalsByCurrency[currency]) {
        totalsByCurrency[currency] = { kisiSayisi: 0, toplamMaliyet: 0 };
      }
      totalsByCurrency[currency].kisiSayisi += transfer.passenger_count || 0;
      totalsByCurrency[currency].toplamMaliyet += transfer.cost_amount || 0;
    });

    return {
      totalsByCurrency,
      totalTransfers: data?.length || 0
    };
  },

  // Tarih formatını DD.MM.YYYY'den YYYY-MM-DD'ye çevir
  formatDateToSupabase(dateString: string): string {
    if (!dateString) return '';
    // DD.MM.YYYY -> YYYY-MM-DD
    const parts = dateString.split('.');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateString;
  },

  async createFromAccommodation(projectId: string, accommodationData: any[], timingOptions?: { departureHours: number; departureMinutes: number }): Promise<any[]> {
    console.log('🔍 Konaklamadan transfer oluşturuluyor, projectId:', projectId);
    console.log('🔍 Konaklama verileri:', accommodationData);

    const transfers = [];

    for (const accommodation of accommodationData) {
      console.log('🔍 İşlenen konaklama:', accommodation);
      console.log('🔍 Konaklama alanları:', Object.keys(accommodation));
      console.log('🔍 Giriş tarihi:', accommodation.gelis_tarihi);
      console.log('🔍 Geliş uçuş kodu:', accommodation.gelis_ucus_kodu);
      console.log('🔍 Giriş tarihi var mı?', !!accommodation.gelis_tarihi);
      console.log('🔍 Geliş uçuş kodu var mı?', !!accommodation.gelis_ucus_kodu);
      console.log('🔍 Giriş koşulu sağlanıyor mu?', !!(accommodation.gelis_tarihi && accommodation.gelis_ucus_kodu));

      // Giriş transferi
      if (accommodation.gelis_tarihi && accommodation.gelis_ucus_kodu) {
        console.log('🔍 Giriş transferi oluşturuluyor:', {
          gelis_tarihi: accommodation.gelis_tarihi,
          gelis_ucus_kodu: accommodation.gelis_ucus_kodu,
          gelis_ucak_kalkis: accommodation.gelis_ucak_kalkis
        });
        // Boş string'leri null'a çevir ve tarih formatını düzelt
        const cleanDate = accommodation.gelis_tarihi && accommodation.gelis_tarihi.trim() !== '' ?
          this.formatDateToSupabase(accommodation.gelis_tarihi) : null;
        const cleanTime = accommodation.gelis_ucak_kalkis && accommodation.gelis_ucak_kalkis.trim() !== '' ? accommodation.gelis_ucak_kalkis : null;
        const cleanFlightCode = accommodation.gelis_ucus_kodu && accommodation.gelis_ucus_kodu.trim() !== '' ? accommodation.gelis_ucus_kodu : null;

        console.log('🔍 Giriş temizlenmiş değerler:', {
          date: cleanDate,
          time: cleanTime,
          flight_code: cleanFlightCode
        });

        const transfer = {
          project_id: projectId,
          hotel_id: accommodation.hotel_id || null,
          direction: 'arrival',
          type_label: 'Giriş',
          date: cleanDate,
          time: cleanTime,
          flight_code: cleanFlightCode,
          route: `Havalimanı → ${accommodation.otel || accommodation.hotel_name || 'Otel'}`,
          passenger_count: 1,
          passengers: [accommodation.isim ? `${accommodation.isim} ${accommodation.soyisim || ''}`.trim() : ''],
          transfer_type: 'private',
          vehicle_type: null,
          supplier_id: null,
          supplier_name: null,
          cost_amount: 0,
          currency: 'TRY',
          vehicle_assigned: false,
          is_group: false,
          group_transfers: null,
          sort_key: `${cleanDate || '9999-12-31'} ${cleanTime || '23:59'}`
        };

        console.log('🔍 Giriş transferi:', transfer);
        transfers.push(transfer);
      }

      // Çıkış transferi
      if (accommodation.cikis_tarihi && accommodation.donus_ucus_kodu) {
        console.log('🔍 Çıkış transferi oluşturuluyor:', {
          cikis_tarihi: accommodation.cikis_tarihi,
          donus_ucus_kodu: accommodation.donus_ucus_kodu,
          donus_ucak_kalkis: accommodation.donus_ucak_kalkis
        });

        // Boş string'leri null'a çevir ve tarih formatını düzelt
        const cleanDate = accommodation.cikis_tarihi && accommodation.cikis_tarihi.trim() !== '' ?
          this.formatDateToSupabase(accommodation.cikis_tarihi) : null;

        // Çıkış transferi için timing hesaplaması
        let cleanTime = accommodation.donus_ucak_kalkis && accommodation.donus_ucak_kalkis.trim() !== '' ? accommodation.donus_ucak_kalkis : null;

        if (cleanTime && timingOptions) {
          // Uçak kalkış saatinden belirtilen süre öncesini hesapla
          const [hours, minutes] = cleanTime.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes;
          const departureMinutes = timingOptions.departureHours * 60 + timingOptions.departureMinutes;
          const transferMinutes = totalMinutes - departureMinutes;

          if (transferMinutes >= 0) {
            const transferHours = Math.floor(transferMinutes / 60);
            const transferMins = transferMinutes % 60;
            cleanTime = `${transferHours.toString().padStart(2, '0')}:${transferMins.toString().padStart(2, '0')}`;
          }
        }
        const cleanFlightCode = accommodation.donus_ucus_kodu && accommodation.donus_ucus_kodu.trim() !== '' ? accommodation.donus_ucus_kodu : null;

        console.log('🔍 Temizlenmiş değerler:', {
          date: cleanDate,
          time: cleanTime,
          flight_code: cleanFlightCode
        });

        const transfer = {
          project_id: projectId,
          hotel_id: accommodation.hotel_id || null,
          direction: 'departure',
          type_label: 'Çıkış',
          date: cleanDate,
          time: cleanTime,
          flight_code: cleanFlightCode,
          route: `${accommodation.otel || accommodation.hotel_name || 'Otel'} → Havalimanı`,
          passenger_count: 1,
          passengers: [accommodation.isim ? `${accommodation.isim} ${accommodation.soyisim || ''}`.trim() : ''],
          transfer_type: 'private',
          vehicle_type: null,
          supplier_id: null,
          supplier_name: null,
          cost_amount: 0,
          currency: 'TRY',
          vehicle_assigned: false,
          is_group: false,
          group_transfers: null,
          sort_key: `${cleanDate || '9999-12-31'} ${cleanTime || '23:59'}`
        };

        console.log('🔍 Çıkış transferi:', transfer);
        transfers.push(transfer);
      }
    }

    if (transfers.length === 0) {
      throw new Error('Konaklama verilerinden transfer oluşturulamadı');
    }

    console.log('🔍 Oluşturulan transferler:', transfers);

    const { data, error } = await supabase
      .from('project_transfer_tour')
      .insert(transfers)
      .select(`
        *,
        supplier:suppliers(name, contact_person, phone, email)
      `);

    if (error) {
      throw error;
    }

    return data || [];
  }
};

// PROJECT EVENTS & ACTIVITIES

// PROJECT HUMAN RESOURCES (İnsan Kaynakları)

// PROJECT OTHER SERVICES (Diğer Servisler)

// PROJECT FINANCIAL SERVICES

// PROJECT COLLECTION PLANS
export const projectCollectionPlansService = {
  async getAll(): Promise<any[]> {
    try {
      // Önce planları çek (join olmadan, çünkü FK ilişkisi Supabase'de tanımlı değil)
      const { data: plans, error: plansError } = await supabase
        .from('project_collection_plans')
        .select('*')
        .order('date', { ascending: true });

      if (plansError) {
        console.error('❌ projectCollectionPlansService.getAll error:', plansError);
        return [];
      }

      if (!plans || plans.length === 0) return [];

      // Benzersiz proje ID'lerini al
      const projectIds = [...new Set(plans.map(p => p.project_id).filter(Boolean))];

      // Proje detaylarını çek (agente ve otel bilgileriyle)
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          company_name,
          agency_id,
          hotel_id,
          start_date,
          end_date,
          reference,
          agencies(id, name),
          hotels(id, name)
        `)
        .in('id', projectIds);

      if (projectsError) {
        console.error('❌ projectCollectionPlansService.getAll projects fetch error:', projectsError);
        // Projeler gelmese bile planları döndür (projeleri null olarak)
        return plans.map(plan => ({ ...plan, projects: null }));
      }

      // Projeleri map'le
      const projectsMap = (projects || []).reduce((acc: any, p: any) => {
        acc[p.id] = p;
        return acc;
      }, {});

      const result = plans.map(plan => ({
        ...plan,
        projects: projectsMap[plan.project_id] || null
      }));

      return result;
    } catch (err) {
      console.error('❌ projectCollectionPlansService.getAll exception:', err);
      return [];
    }
  },

  async getByProjectId(projectId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('project_collection_plans')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: true });

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return [];
      }
      throw error;
    }
    return data || [];
  },

  async create(plan: Omit<any, 'id' | 'created_at' | 'updated_at'>): Promise<any> {
    const { data, error } = await supabase
      .from('project_collection_plans')
      .insert([plan])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, plan: Partial<any>): Promise<any> {
    const { data, error } = await supabase
      .from('project_collection_plans')
      .update({ ...plan, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_collection_plans')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async deleteByProjectId(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('project_collection_plans')
      .delete()
      .eq('project_id', projectId);
    if (error) throw error;
  }
};

// PROJECT COLLECTIONS
export const projectCollectionsService = {
  async getByProjectId(projectId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('project_collections')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: true });

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return [];
      }
      throw error;
    }
    return data || [];
  },

  async create(collection: Omit<any, 'id' | 'created_at' | 'updated_at'>): Promise<any> {
    const { data, error } = await supabase
      .from('project_collections')
      .insert([collection])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, collection: Partial<any>): Promise<any> {
    const { data, error } = await supabase
      .from('project_collections')
      .update({ ...collection, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_collections')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async deleteByProjectId(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('project_collections')
      .delete()
      .eq('project_id', projectId);
    if (error) throw error;
  }
};

// PROJECT PAYMENT PLANS
export const projectPaymentPlansService = {
  async getAll(): Promise<any[]> {
    try {
      // Önce planları çek
      const { data: plans, error: plansError } = await supabase
        .from('project_payment_plans')
        .select('*')
        .order('date', { ascending: true });

      if (plansError) {
        console.error('❌ projectPaymentPlansService.getAll error:', plansError);
        return [];
      }

      if (!plans || plans.length === 0) return [];

      // Benzersiz proje ID'lerini al
      const projectIds = [...new Set(plans.map(p => p.project_id).filter(Boolean))];

      // Proje detaylarını çek
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          company_name,
          agency_id,
          hotel_id,
          start_date,
          end_date,
          reference,
          agencies(id, name),
          hotels(id, name)
        `)
        .in('id', projectIds);

      if (projectsError) {
        console.error('❌ projectPaymentPlansService.getAll projects fetch error:', projectsError);
        return plans.map(plan => ({ ...plan, projects: null }));
      }

      const projectsMap = (projects || []).reduce((acc: any, p: any) => {
        acc[p.id] = p;
        return acc;
      }, {});

      const result = plans.map(plan => ({
        ...plan,
        projects: projectsMap[plan.project_id] || null
      }));

      return result;
    } catch (err) {
      console.error('❌ projectPaymentPlansService.getAll exception:', err);
      return [];
    }
  },

  async getByProjectId(projectId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('project_payment_plans')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: true });

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return [];
      }
      throw error;
    }
    return data || [];
  },

  async create(plan: Omit<any, 'id' | 'created_at' | 'updated_at'>): Promise<any> {
    const { data, error } = await supabase
      .from('project_payment_plans')
      .insert([plan])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, plan: Partial<any>): Promise<any> {
    const { data, error } = await supabase
      .from('project_payment_plans')
      .update({ ...plan, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_payment_plans')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async deleteByProjectId(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('project_payment_plans')
      .delete()
      .eq('project_id', projectId);
    if (error) throw error;
  }
};

// PROJECT PAYMENTS
export const projectPaymentsService = {
  async getByProjectId(projectId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('project_payments')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: true });

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return [];
      }
      throw error;
    }
    return data || [];
  },

  async create(payment: Omit<any, 'id' | 'created_at' | 'updated_at'>): Promise<any> {
    const { data, error } = await supabase
      .from('project_payments')
      .insert([payment])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, payment: Partial<any>): Promise<any> {
    const { data, error } = await supabase
      .from('project_payments')
      .update({ ...payment, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_payments')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async deleteByProjectId(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('project_payments')
      .delete()
      .eq('project_id', projectId);
    if (error) throw error;
  }
};

// PUBLIC LINKS
export interface PublicLink {
  id: string;
  link_type: 'quote' | 'project';
  quote_id?: string;
  project_id?: string;
  token: string;
  password: string;
  expiry_date?: string;
  is_active: boolean;
  approval?: {
    is_approved: boolean;
    name?: string;
    surname?: string;
    email?: string;
    approved_at?: string;
    ip_address?: string;
  };
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const publicLinksService = {
  // Token ile link getir (public view için - anonymous client kullan)
  async getByToken(token: string): Promise<PublicLink | null> {
    const { data, error } = await publicSupabase
      .from('public_links')
      .select('*')
      .eq('token', token)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  // Quote ID'ye göre linkleri getir
  async getByQuoteId(quoteId: string): Promise<PublicLink[]> {
    const { data, error } = await supabase
      .from('public_links')
      .select('*')
      .eq('quote_id', quoteId)
      .eq('link_type', 'quote')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Project ID'ye göre linkleri getir
  async getByProjectId(projectId: string): Promise<PublicLink[]> {
    const { data, error } = await supabase
      .from('public_links')
      .select('*')
      .eq('project_id', projectId)
      .eq('link_type', 'project')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Link oluştur
  async create(link: Omit<PublicLink, 'id' | 'created_at' | 'updated_at'>): Promise<PublicLink> {
    // Mevcut kullanıcıyı al
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('public_links')
      .insert([{
        ...link,
        created_by: user?.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Link güncelle
  async update(id: string, link: Partial<PublicLink>): Promise<PublicLink> {
    const { data, error } = await supabase
      .from('public_links')
      .update({ ...link, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Link sil
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('public_links')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },


  // Link aktif/pasif durumunu değiştir
  async toggleActive(id: string, isActive: boolean): Promise<PublicLink> {
    const { data, error } = await supabase
      .from('public_links')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mutabakat onayını güncelle (public view için - anonymous client kullan)
  async updateApproval(id: string, approval: PublicLink['approval']): Promise<PublicLink> {
    console.log('🔵 updateApproval çağrıldı (public):', { id, approval });

    try {
      // Approval verisini JSONB formatına çevir
      // Supabase JSONB alanına veri yazarken, verinin plain JavaScript object olması yeterli
      // Ama null veya undefined ise, boş object olarak kaydet
      const approvalJson = approval || {};

      console.log('🔵 Approval JSON formatı:', approvalJson);
      console.log('🔵 Approval type:', typeof approvalJson);
      console.log('🔵 Public Supabase client kullanılıyor (authenticated session yok)');

      // Önce mevcut linki al (public client ile)
      const { data: existingLink, error: fetchError } = await publicSupabase
        .from('public_links')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('❌ Link bulunamadı:', fetchError);
        throw fetchError;
      }

      console.log('🔵 Mevcut link:', existingLink);

      // Sadece approval alanını güncelle (public client ile - authenticated session olmadan)
      const { data: updateData, error } = await publicSupabase
        .from('public_links')
        .update({
          approval: approvalJson as any, // JSONB için type assertion
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ Supabase updateApproval hatası:', error);
        throw error;
      }

      // RLS polisine bağlı olarak .select() boş veri dönebilir ama update başarılı olmuş olabilir.
      // Eğer hata yoksa ve updateData boşsa, mevcut link verisini döndürerek devam et.
      const data = (updateData && updateData.length > 0) ? updateData[0] : { ...existingLink, approval: approvalJson };
      
      console.log('✅ updateApproval başarılı (public):', data);
      return data;
    } catch (error) {
      console.error('❌ updateApproval catch hatası:', error);
      throw error;
    }
  }
};

// PROJECT USERS
export const projectUsersService = {
  // Proje kullanıcılarını getir
  async getByProjectId(projectId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('project_users')
      .select('user_id')
      .eq('project_id', projectId);

    if (error) throw error;
    return (data || []).map((item: any) => item.user_id);
  },

  // Proje kullanıcılarını güncelle (tüm listeyi değiştir)
  async updateByProjectId(projectId: string, userIds: string[]): Promise<void> {
    // Önce mevcut kayıtları sil
    const { error: deleteError } = await supabase
      .from('project_users')
      .delete()
      .eq('project_id', projectId);

    if (deleteError) throw deleteError;

    // Yeni kayıtları ekle
    if (userIds.length > 0) {
      const records = userIds.map(userId => ({
        project_id: projectId,
        user_id: userId
      }));

      const { error: insertError } = await supabase
        .from('project_users')
        .insert(records);

      if (insertError) throw insertError;
    }
  },

  // Proje kullanıcısı ekle
  async add(projectId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('project_users')
      .insert({ project_id: projectId, user_id: userId });

    if (error) throw error;
  },

  // Proje kullanıcısı sil
  async remove(projectId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('project_users')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Tüm proje kullanıcı eşleşmelerini getir
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('project_users')
      .select('project_id, user_id');

    if (error) throw error;
    return data || [];
  }
};

// TICKET OPTIONS
export const ticketOptionsService = {
  // Tüm bilet opsiyonlarını getir
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('ticket_options')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // ID'ye göre bilet opsiyonu getir
  async getById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('ticket_options')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Bilet opsiyonu oluştur
  async create(ticketOption: any): Promise<any> {
    const { data, error } = await supabase
      .from('ticket_options')
      .insert([ticketOption])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Bilet opsiyonu güncelle
  async update(id: string, ticketOption: Partial<any>): Promise<any> {
    const { data, error } = await supabase
      .from('ticket_options')
      .update({ ...ticketOption, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Bilet opsiyonu sil
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('ticket_options')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// TICKET PAYMENT PLANS
export const ticketPaymentPlansService = {
  // Tüm ödeme planlarını getir
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('ticket_payment_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ ticketPaymentPlansService.getAll error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log(`✅ ticketPaymentPlansService.getAll success: ${data?.length || 0} items fetched`);
    return data || [];
  },

  // Ticket ID'ye göre ödeme planlarını getir
  async getByTicketId(ticketId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('ticket_payment_plans')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // ID'ye göre ödeme planı getir
  async getById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('ticket_payment_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Ödeme planı oluştur
  async create(paymentPlan: any): Promise<any> {
    const { data, error } = await supabase
      .from('ticket_payment_plans')
      .insert([paymentPlan])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Ödeme planı güncelle
  async update(id: string, paymentPlan: Partial<any>): Promise<any> {
    const { data, error } = await supabase
      .from('ticket_payment_plans')
      .update({ ...paymentPlan, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Ödeme planı sil
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('ticket_payment_plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// TICKET PAYMENT RECORDS
export const ticketPaymentRecordsService = {
  // Tüm ödeme kayıtlarını getir
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('ticket_payment_records')
      .select('*')
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Ticket ID'ye göre ödeme kayıtlarını getir
  async getByTicketId(ticketId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('ticket_payment_records')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Payment Plan ID'ye göre ödeme kayıtlarını getir
  async getByPaymentPlanId(paymentPlanId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('ticket_payment_records')
      .select('*')
      .eq('payment_plan_id', paymentPlanId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // ID'ye göre ödeme kaydı getir
  async getById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('ticket_payment_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Ödeme kaydı oluştur
  async create(paymentRecord: any): Promise<any> {
    const { data, error } = await supabase
      .from('ticket_payment_records')
      .insert([paymentRecord])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Ödeme kaydı güncelle
  async update(id: string, paymentRecord: Partial<any>): Promise<any> {
    const { data, error } = await supabase
      .from('ticket_payment_records')
      .update({ ...paymentRecord, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Ödeme kaydı sil
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('ticket_payment_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// --- Fatura Servisleri ---
export const invoicesService = {
  async getInvoicesPage(params: {
    type: 'income' | 'expense';
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
    /** Tarih aralığındaki kayıtları tek seferde çek (gelir tamamlanan liste + istemci filtre için, en fazla 10000 satır). */
    fetchAllInRange?: boolean;
  }): Promise<{ data: any[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const page = Math.max(1, Number(params.page || 1));
    const pageSize = Math.max(1, Number(params.pageSize || 25));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const fetchAll = params.fetchAllInRange === true;

    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .eq('type', params.type);

    if (params.startDate) query = query.gte('date', params.startDate);
    if (params.endDate) query = query.lte('date', params.endDate);

    if (!fetchAll) {
      const rawSearch = (params.searchTerm || '').trim();
      if (rawSearch) {
        const escaped = rawSearch.replace(/[%_]/g, '\\$&');
        query = query.or(
          `invoice_no.ilike.%${escaped}%,contact_name.ilike.%${escaped}%,notes.ilike.%${escaped}%,metadata->>voucher_number.ilike.%${escaped}%,metadata->>hotel_name.ilike.%${escaped}%,metadata->>company_name.ilike.%${escaped}%`
        );
      }
    }

    const ordered = query.order('date', { ascending: false });
    const { data: invoices, count, error } = fetchAll
      ? await ordered.range(0, 9999)
      : await ordered.range(from, to);

    if (error) throw error;
    const total = count || 0;

    if (!invoices || invoices.length === 0) {
      return { data: [], total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
    }

    const invoiceIds = invoices.map((i: any) => i.id);
    const contactIds = Array.from(new Set(invoices.map((i: any) => i.contact_id).filter(Boolean)));
    
    const { data: invoiceItems } = await supabase
      .from('invoice_items')
      .select('invoice_id, item_id, item_type')
      .in('invoice_id', invoiceIds);

    const itemIds = Array.from(new Set((invoiceItems || []).map((ii: any) => ii.item_id)));

    // Fetch related items to find project/sejour IDs
    const [salesItemsRes, purchaseItemsRes, sRooms, sFlights, sTransfers, sExtras] = await Promise.all([
      itemIds.length
        ? supabase.from('project_sales_items').select('id, project_id, category, sub_category').in('id', itemIds)
        : Promise.resolve({ data: [], error: null } as any),
      itemIds.length 
        ? supabase.from('project_purchase_items').select('id, project_id').in('id', itemIds) 
        : Promise.resolve({ data: [], error: null } as any),
      itemIds.length ? supabase.from('sejour_rooms').select('id, sejour_id').in('id', itemIds) : Promise.resolve({ data: [], error: null } as any),
      itemIds.length ? supabase.from('sejour_flights').select('id, sejour_id').in('id', itemIds) : Promise.resolve({ data: [], error: null } as any),
      itemIds.length ? supabase.from('sejour_transfers').select('id, sejour_id').in('id', itemIds) : Promise.resolve({ data: [], error: null } as any),
      itemIds.length ? supabase.from('sejour_extra_services').select('id, sejour_id').in('id', itemIds) : Promise.resolve({ data: [], error: null } as any)
    ]);

    // Collect project and sejour IDs
    const projectIds = new Set<string>();
    const sejourIds = new Set<string>();
    
    (salesItemsRes.data || []).forEach((si: any) => si.project_id && projectIds.add(si.project_id));
    (purchaseItemsRes.data || []).forEach((pi: any) => pi.project_id && projectIds.add(pi.project_id));
    (sRooms.data || []).forEach((r: any) => r.sejour_id && sejourIds.add(r.sejour_id));
    (sFlights.data || []).forEach((f: any) => f.sejour_id && sejourIds.add(f.sejour_id));
    (sTransfers.data || []).forEach((t: any) => t.sejour_id && sejourIds.add(t.sejour_id));
    (sExtras.data || []).forEach((e: any) => e.sejour_id && sejourIds.add(e.sejour_id));

    // For sejours, item_id might be the sejour_id itself
    itemIds.forEach((id: string) => {
      if (!projectIds.has(id)) sejourIds.add(id);
    });

    const pIdArray = Array.from(projectIds);
    const sIdArray = Array.from(sejourIds);

    // Fetch final metadata for collected IDs
    const [
      agenciesRes, hotelsRes, suppliersRes,
      projectsRes, sejoursRes,
      categoriesRes
    ] = await Promise.all([
      contactIds.length ? supabase.from('agencies').select('id, name').in('id', contactIds) : Promise.resolve({ data: [] }),
      contactIds.length ? supabase.from('hotels').select('id, name').in('id', contactIds) : Promise.resolve({ data: [] }),
      contactIds.length ? supabase.from('suppliers').select('id, name').in('id', contactIds) : Promise.resolve({ data: [] }),
      pIdArray.length 
        ? supabase.from('projects').select('id, title, company_name, description, quote_type, agency_id, hotel_id, start_date, end_date').in('id', pIdArray)
        : Promise.resolve({ data: [] }),
      sIdArray.length
        ? supabase.from('sejours').select('id, voucher_number, customer_name, agency_id, hotel_id, check_in_date, check_out_date').in('id', sIdArray)
        : Promise.resolve({ data: [] }),
      supabase.from('categories').select('*')
    ]);

    // Build lookup maps
    const contactMap: Record<string, string> = {};
    (agenciesRes.data || []).forEach((a: any) => { contactMap[a.id] = a.name; });
    (hotelsRes.data || []).forEach((h: any) => { contactMap[h.id] = h.name; });
    (suppliersRes.data || []).forEach((s: any) => { contactMap[s.id] = s.name; });

    const categoriesMap = (categoriesRes.data || []).reduce((acc: any, c: any) => {
      acc[c.id] = c;
      if (c.code) acc[c.code] = c;
      return acc;
    }, {});

    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    const salesById = (salesItemsRes.data || []).reduce((acc: any, row: any) => {
      acc[row.id] = row;
      return acc;
    }, {});

    const salesItemCategoryBlob = (row: any) => {
      const cat = categoriesMap[row.category] || {};
      const sub = categoriesMap[row.sub_category] || {};
      const cn = cat.name || (isUUID(row.category) ? '' : row.category);
      const scn = sub.name || (isUUID(row.sub_category) ? '' : row.sub_category);
      return [cn, scn].filter(Boolean).join(' ');
    };

    const invoiceCategorySearch: Record<string, string> = {};
    (invoiceItems || []).forEach((ii: any) => {
      if (ii.item_type !== 'sales') return;
      const row = salesById[ii.item_id];
      if (!row) return;
      const blob = salesItemCategoryBlob(row);
      if (!blob) return;
      invoiceCategorySearch[ii.invoice_id] = (invoiceCategorySearch[ii.invoice_id] || '') + ' ' + blob;
    });

    const projectsMap = (projectsRes.data || []).reduce((acc: any, p: any) => {
      const agencyName = p.agency_id ? contactMap[p.agency_id] : '';
      const projectDesc = p.description
        ? p.description.replace(/^Konfirme edilen teklif:\s*/i, '').trim()
        : '';
      const cleanTitle = p.title
        ? p.title.replace(/\s*-\s*(Çoklu Konaklama|Multi Hotel).*$/i, '').trim()
        : p.title;
      acc[p.id] = {
        ...p,
        title: cleanTitle,
        description: cleanDescription(projectDesc),
        company_name: p.quote_type === 'MICE' ? (p.company_name || '') : (agencyName || p.company_name || ''),
        agency_name: agencyName || '',
        hotel_name: p.hotel_id ? contactMap[p.hotel_id] : '',
        date_start: p.start_date,
        date_end: p.end_date
      };
      return acc;
    }, {});

    const sejoursMap = (sejoursRes.data || []).reduce((acc: any, s: any) => {
      const agencyName = s.agency_id ? contactMap[s.agency_id] : null;
      const displayCompany = agencyName || s.customer_name || 'Bilinmiyor';
      acc[s.id] = {
        id: s.id,
        voucher_number: s.voucher_number,
        company_name: displayCompany,
        agency_name: displayCompany,
        hotel_name: s.hotel_id ? contactMap[s.hotel_id] : '',
        date_start: s.check_in_date,
        date_end: s.check_out_date,
        quote_type: 'SEJOUR'
      };
      return acc;
    }, {});

    const itemToProjectMap: Record<string, string> = {};
    (salesItemsRes.data || []).forEach((si: any) => { itemToProjectMap[si.id] = si.project_id; });
    (purchaseItemsRes.data || []).forEach((pi: any) => { itemToProjectMap[pi.id] = pi.project_id; });
    (sRooms.data || []).forEach((r: any) => { itemToProjectMap[r.id] = r.sejour_id; });
    (sFlights.data || []).forEach((f: any) => { itemToProjectMap[f.id] = f.sejour_id; });
    (sTransfers.data || []).forEach((t: any) => { itemToProjectMap[t.id] = t.sejour_id; });
    (sExtras.data || []).forEach((e: any) => { itemToProjectMap[e.id] = e.sejour_id; });

    const invoiceMetadata: Record<string, any> = {};
    (invoiceItems || []).forEach((ii: any) => {
      if (invoiceMetadata[ii.invoice_id]) return;
      const projectId = itemToProjectMap[ii.item_id];
      const project = projectsMap[projectId];
      const sejour = sejoursMap[ii.item_id] || sejoursMap[projectId];
      if (project) {
        const isSejour = project.quote_type === 'SEJOUR';
        invoiceMetadata[ii.invoice_id] = {
          voucher_number: isSejour ? ((project as any).voucher_number || '') : '',
          reference: isSejour ? '' : (project.title || ''),
          date_start: project.date_start,
          date_end: project.date_end,
          company_name: project.company_name || '',
          agency_name: project.agency_name || '',
          hotel_name: project.hotel_name || '',
          is_sejour: isSejour
        };
      } else if (sejour) {
        invoiceMetadata[ii.invoice_id] = {
          voucher_number: sejour.voucher_number || '',
          reference: '',
          date_start: sejour.date_start,
          date_end: sejour.date_end,
          company_name: sejour.company_name || '',
          agency_name: sejour.agency_name || sejour.company_name || '',
          hotel_name: sejour.hotel_name || '',
          is_sejour: true
        };
      }
    });

    const data = (invoices || []).map((inv: any) => ({
      ...inv,
      contact_name: contactMap[inv.contact_id] || inv.contact_name || inv.contact_id,
      metadata: {
        ...(invoiceMetadata[inv.id] || inv.metadata || {}),
        category_search: (invoiceCategorySearch[inv.id] || '').trim()
      }
    }));

    if (fetchAll) {
      const n = data.length;
      return {
        data,
        total: n,
        page: 1,
        pageSize: n,
        totalPages: 1
      };
    }

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
  },

  // Tüm faturaları getir (tipine göre filtrelenebilir)
  async getAll(type?: 'income' | 'expense'): Promise<any[]> {
    let query = supabase.from('invoices').select('*').order('date', { ascending: false });
    if (type) query = query.eq('type', type);
    
    const { data: invoices, error } = await query;
    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return [];
      }
      throw error;
    }

    if (!invoices || invoices.length === 0) return [];

    // Fatura kalemleri üzerinden proje/sejour metadata'larını çek
    const { data: invoiceItems } = await supabase
      .from('invoice_items')
      .select('invoice_id, item_id, item_type')
      .in('invoice_id', invoices.map(i => i.id));

    const itemIds = (invoiceItems || []).map(ii => ii.item_id);

    // Paralel olarak tüm gerekli tabloları çek
    const [
      agenciesRes, hotelsRes, suppliersRes, 
      salesItemsRes, purchaseItemsRes, 
      projectsRes, sejoursRes,
      sRooms, sFlights, sTransfers, sExtras
    ] = await Promise.all([
      supabase.from('agencies').select('id, name'),
      supabase.from('hotels').select('id, name'),
      supabase.from('suppliers').select('id, name'),
      supabase.from('project_sales_items').select('id, project_id').in('id', itemIds),
      supabase.from('project_purchase_items').select('id, project_id').in('id', itemIds),
      supabase.from('projects').select('id, title, company_name, description, quote_type, agency_id, hotel_id, start_date, end_date'),
      supabase.from('sejours').select('id, voucher_number, customer_name, agency_id, hotel_id, check_in_date, check_out_date'),
      supabase.from('sejour_rooms').select('id, sejour_id').in('id', itemIds),
      supabase.from('sejour_flights').select('id, sejour_id').in('id', itemIds),
      supabase.from('sejour_transfers').select('id, sejour_id').in('id', itemIds),
      supabase.from('sejour_extra_services').select('id, sejour_id').in('id', itemIds)
    ]);

    const contactMap: Record<string, string> = {};
    (agenciesRes.data || []).forEach(a => { contactMap[a.id] = a.name; });
    (hotelsRes.data || []).forEach(h => { contactMap[h.id] = h.name; });
    (suppliersRes.data || []).forEach(s => { contactMap[s.id] = s.name; });

    // Proje ve Sejour map'leri
    const projectsMap = (projectsRes.data || []).reduce((acc: any, p: any) => {
      acc[p.id] = {
        ...p,
        company_name: p.company_name || (p.agency_id ? contactMap[p.agency_id] : ''),
        hotel_name: p.hotel_id ? contactMap[p.hotel_id] : '',
        date_start: p.start_date,
        date_end: p.end_date
      };
      return acc;
    }, {});

    const sejoursMap = (sejoursRes.data || []).reduce((acc: any, s: any) => {
      acc[s.id] = {
        id: s.id,
        voucher_number: s.voucher_number,
        company_name: s.customer_name || (s.agency_id ? contactMap[s.agency_id] : ''),
        hotel_name: s.hotel_id ? contactMap[s.hotel_id] : '',
        date_start: s.check_in_date,
        date_end: s.check_out_date,
        quote_type: 'SEJOUR'
      };
      return acc;
    }, {});

    // Kalem -> Proje/Sejour ID map
    const itemToProjectMap: Record<string, string> = {};
    (salesItemsRes.data || []).forEach(si => itemToProjectMap[si.id] = si.project_id);
    (purchaseItemsRes.data || []).forEach(pi => itemToProjectMap[pi.id] = pi.project_id);
    (sRooms.data || []).forEach(r => itemToProjectMap[r.id] = r.sejour_id);
    (sFlights.data || []).forEach(f => itemToProjectMap[f.id] = f.sejour_id);
    (sTransfers.data || []).forEach(t => itemToProjectMap[t.id] = t.sejour_id);
    (sExtras.data || []).forEach(e => itemToProjectMap[e.id] = e.sejour_id);

    // Fatura -> İlk bulduğu proje/sejour metadata'sı
    const invoiceMetadata: Record<string, any> = {};
    (invoiceItems || []).forEach(ii => {
      if (invoiceMetadata[ii.invoice_id]) return; // Zaten bir tane bulduysak geç

      // item_id bir sejour_id olabilir (Sejour kalemleri için) veya project_sales_item id'si olabilir
      // supabaseService'deki getPendingSalesItems/getPendingPurchaseItems mantığına göre sejour kalemleri sejour_id tutuyor bazen.
      // Ama invoice_items tablosunda item_id her zaman kaynak kalem id'si.
      
      const projectId = itemToProjectMap[ii.item_id];
      const project = projectsMap[projectId];
      const sejour = sejoursMap[ii.item_id] || sejoursMap[projectId]; // Bazı sejour kalemleri doğrudan id bazlı

      if (project) {
        invoiceMetadata[ii.invoice_id] = {
          voucher_number: project.voucher_number || project.title,
          date_start: project.date_start,
          date_end: project.date_end,
          company_name: project.company_name,
          hotel_name: project.hotel_name,
          is_sejour: project.quote_type === 'SEJOUR'
        };
      } else if (sejour) {
        invoiceMetadata[ii.invoice_id] = {
          voucher_number: sejour.voucher_number,
          date_start: sejour.date_start,
          date_end: sejour.date_end,
          company_name: sejour.company_name,
          hotel_name: sejour.hotel_name,
          is_sejour: true
        };
      }
    });

    return invoices.map(inv => ({
      ...inv,
      contact_name: contactMap[inv.contact_id] || inv.contact_id,
      metadata: invoiceMetadata[inv.id] || {}
    }));
  },

  // ID'ye göre fatura ve kalemlerini getir
  async getById(id: string): Promise<any> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', id)
      .single();
    if (error) throw error;

    // Contact adını çöz
    const { data: contacts } = await Promise.all([
      supabase.from('agencies').select('id, name').eq('id', data.contact_id).maybeSingle(),
      supabase.from('hotels').select('id, name').eq('id', data.contact_id).maybeSingle(),
      supabase.from('suppliers').select('id, name').eq('id', data.contact_id).maybeSingle()
    ]).then(res => ({
      data: res.find(r => r.data)?.data
    }));

    // Fatura kalemlerindeki item_id'ler üzerinden kaynak kalemleri ve kategori adlarını çöz
    const invoiceItems = data.invoice_items || [];
    let enrichedItems = invoiceItems;

    if (invoiceItems.length > 0) {
      const itemIds = invoiceItems.map((ii: any) => ii.item_id).filter(Boolean);

      // Kaynak satış ve alış kalemlerini paralel çek
      const [
        salesRes, purchaseRes, categoriesRes,
        sRooms, sFlights, sTransfers, sExtras
      ] = await Promise.all([
        supabase.from('project_sales_items').select('id, category, sub_category, description').in('id', itemIds),
        supabase.from('project_purchase_items').select('id, category, sub_category, description').in('id', itemIds),
        supabase.from('categories').select('id, name, sort_order'),
        supabase.from('sejour_rooms').select('id').in('id', itemIds),
        supabase.from('sejour_flights').select('id').in('id', itemIds),
        supabase.from('sejour_transfers').select('id').in('id', itemIds),
        supabase.from('sejour_extra_services').select('id').in('id', itemIds)
      ]);

      // Kategori map
      const categoriesMap: Record<string, any> = {};
      (categoriesRes.data || []).forEach((c: any) => { categoriesMap[c.id] = c; });

      // Kaynak kalem → kategori map
      const sourceMap: Record<string, { category: string; sub_category: string; description: string, isStatic?: boolean, staticCat?: string, staticSub?: string }> = {};
      (salesRes.data || []).forEach((s: any) => { sourceMap[s.id] = { category: s.category, sub_category: s.sub_category, description: s.description }; });
      (purchaseRes.data || []).forEach((p: any) => { sourceMap[p.id] = { category: p.category, sub_category: p.sub_category, description: p.description }; });
      (sRooms.data || []).forEach((r: any) => { sourceMap[r.id] = { category: '', sub_category: '', description: '', isStatic: true, staticCat: 'SEJOUR', staticSub: 'KONAKLAMA' }; });
      (sFlights.data || []).forEach((f: any) => { sourceMap[f.id] = { category: '', sub_category: '', description: '', isStatic: true, staticCat: 'SEJOUR', staticSub: 'UÇAK BİLETİ' }; });
      (sTransfers.data || []).forEach((t: any) => { sourceMap[t.id] = { category: '', sub_category: '', description: '', isStatic: true, staticCat: 'SEJOUR', staticSub: 'TRANSFER' }; });
      (sExtras.data || []).forEach((e: any) => { sourceMap[e.id] = { category: '', sub_category: '', description: '', isStatic: true, staticCat: 'SEJOUR', staticSub: 'EKSTRA SERVİS' }; });

      enrichedItems = invoiceItems.map((ii: any) => {
        const source = sourceMap[ii.item_id];
        let categoryName = '';
        let subCategoryName = '';
        
        let catSort = 9999;
        let subCatSort = 9999;

        if (source?.isStatic) {
           categoryName = source.staticCat || '';
           subCategoryName = source.staticSub || '';
           // Default sejour items to top
           catSort = 0;
           subCatSort = 0;
        } else {
           const cat = source?.category ? categoriesMap[source.category] : null;
           const subCat = source?.sub_category ? categoriesMap[source.sub_category] : null;
           
           categoryName = cat?.name || '';
           catSort = cat?.sort_order ?? 9999;

           subCategoryName = subCat?.name || '';
           subCatSort = subCat?.sort_order ?? 9999;
        }

        // If even after static/db it's empty, try to use the description itself as sub_category so it's not empty "-"
        if (!subCategoryName && ii.description) {
           // As a last fallback to avoid dashes on proforma:
           subCategoryName = ii.description;
        }

        return {
          ...ii,
          category_name: categoryName,
          category_sort_order: catSort,
          sub_category_name: subCategoryName,
          sub_category_sort_order: subCatSort
        };
      });
    }

    return {
      ...data,
      invoice_items: enrichedItems,
      contact_name: contacts?.name || data.contact_id
    };
  },

  // Fatura oluştur
  async create(invoice: any, items: any[]): Promise<any> {
    // 1. Fatura başlığını oluştur
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{
        ...invoice,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (invoiceError) throw invoiceError;

    // 2. Fatura kalemlerini oluştur
    if (items && items.length > 0) {
      const invoiceItems = items.map(item => ({
        ...item,
        invoice_id: invoiceData.id,
        created_at: new Date().toISOString()
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);
      
      if (itemsError) throw itemsError;
    }

    return invoiceData;
  },

  // Fatura güncelle
  async update(id: string, invoice: any, items: any[]): Promise<any> {
    // 1. Fatura başlığını güncelle
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .update({
        ...invoice,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (invoiceError) throw invoiceError;

    // 2. Mevcut kalemleri sil ve yenilerini ekle
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id);
    
    if (deleteError) throw deleteError;

    if (items && items.length > 0) {
      const invoiceItems = items.map(item => ({
        ...item,
        invoice_id: id,
        created_at: new Date().toISOString()
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);
      
      if (itemsError) throw itemsError;
    }

    return invoiceData;
  },

  // Fatura sil
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
  },

  // Bekleyen Satış Kalemlerini Getir (Faturası kesilmemiş veya eksik kesilmiş)
  async getPendingSalesItems(): Promise<any[]> {
    const { data: items, error: itemsError } = await supabase.from('project_sales_items').select('*').order('created_at', { ascending: false });
    if (itemsError) throw itemsError;

    const { data: invoiceItems } = await supabase.from('invoice_items').select('*').eq('item_type', 'sales');
    
    // Collect IDs
    const itemIds = (items || []).map(i => i.id);
    const projectIds = Array.from(new Set((items || []).map(i => i.project_id).filter(Boolean)));
    
    // Fetch sejour items to find sejour IDs
    const [sejourRoomsRes, sejourFlightsRes, sejourTransfersRes, sejourExtraRes] = await Promise.all([
      supabase.from('sejour_rooms').select('*'),
      supabase.from('sejour_flights').select('*'),
      supabase.from('sejour_transfers').select('*'),
      supabase.from('sejour_extra_services').select('*')
    ]);

    const sejourIds = new Set<string>();
    (sejourRoomsRes.data || []).forEach(r => sejourIds.add(r.sejour_id));
    (sejourFlightsRes.data || []).forEach(f => sejourIds.add(f.sejour_id));
    (sejourTransfersRes.data || []).forEach(t => sejourIds.add(t.sejour_id));
    (sejourExtraRes.data || []).forEach(e => sejourIds.add(e.sejour_id));
    const sIdArray = Array.from(sejourIds);

    // Fetch projects and sejours
    const [projectsRes, sejoursRes, categoriesRes] = await Promise.all([
      projectIds.length ? supabase.from('projects').select('id, title, company_name, description, quote_type, agency_id, hotel_id, start_date, end_date, status').in('id', projectIds).eq('status', 'completed') : Promise.resolve({ data: [] }),
      sIdArray.length ? supabase.from('sejours').select('id, voucher_number, customer_name, agency_id, hotel_id, check_in_date, check_out_date, status').in('id', sIdArray).eq('status', 'KONFIRME') : Promise.resolve({ data: [] }),
      supabase.from('categories').select('*')
    ]);

    // Collect contact IDs from projects and sejours
    const contactIds = new Set<string>();
    (projectsRes.data || []).forEach((p: any) => {
      if (p.agency_id) contactIds.add(p.agency_id);
      if (p.hotel_id) contactIds.add(p.hotel_id);
    });
    (sejoursRes.data || []).forEach((s: any) => {
      if (s.agency_id) contactIds.add(s.agency_id);
      if (s.hotel_id) contactIds.add(s.hotel_id);
    });
    const cIdArray = Array.from(contactIds);

    // Fetch contacts
    const [agenciesRes, hotelsRes] = await Promise.all([
      cIdArray.length ? supabase.from('agencies').select('id, name').in('id', cIdArray) : Promise.resolve({ data: [] }),
      cIdArray.length ? supabase.from('hotels').select('id, name').in('id', cIdArray) : Promise.resolve({ data: [] })
    ]);

    // Faturası kesilen miktarları topla
    const invoicedMap = (invoiceItems || []).reduce((acc: any, ii: any) => {
      acc[ii.item_id] = (acc[ii.item_id] || 0) + Number(ii.amount);
      return acc;
    }, {});

    // Acenteleri map'le
    const agenciesMap = (agenciesRes.data || []).reduce((acc: any, a: any) => {
      acc[a.id] = a;
      return acc;
    }, {});

    const hotelsMap = (hotelsRes.data || []).reduce((acc: any, h: any) => {
      acc[h.id] = h;
      return acc;
    }, {});

    // Projeleri map'le
    const projectsMap = (projectsRes.data || []).reduce((acc: any, p: any) => {
      const agencyName = p.agency_id ? agenciesMap[p.agency_id]?.name : null;
      const projectDesc = p.description ? p.description.replace(/^Konfirme edilen teklif:\s*/i, '').trim() : '';
      const cleanTitle = p.title ? p.title.replace(/\s*-\s*(Çoklu Konaklama|Multi Hotel).*$/i, '').trim() : p.title;
      acc[p.id] = {
        ...p,
        title: cleanTitle,
        description: cleanDescription(projectDesc),
        with_service_date: true,
        company_name: p.quote_type === 'MICE' ? (p.company_name || '') : (agencyName || p.company_name || ''),
        agency_name: agencyName || '',
        hotel_name: p.hotel_id ? (hotelsMap[p.hotel_id]?.name || '') : '',
        date_start: p.start_date || null,
        date_end: p.end_date || null,
      };
      return acc;
    }, {});

    // Kategorileri map'le
    const categoriesMap = (categoriesRes.data || []).reduce((acc: any, c: any) => {
      acc[c.id] = c;
      if (c.code) acc[c.code] = c;
      return acc;
    }, {});

    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    // Sejour'ları map'le
    const sejoursMap = (sejoursRes.data || []).reduce((acc: any, s: any) => {
      const agencyName = s.agency_id ? agenciesMap[s.agency_id]?.name : null;
      const displayCompany = agencyName || s.customer_name || 'Bilinmiyor';
      acc[s.id] = {
        id: s.id,
        title: s.voucher_number || s.customer_name || 'Sejour',
        voucher_number: s.voucher_number,
        description: s.customer_name || '',
        company_name: displayCompany,
        agency_name: displayCompany,
        agency_id: s.agency_id,
        hotel_name: s.hotel_id ? (hotelsMap[s.hotel_id]?.name || '') : '',
        quote_type: 'SEJOUR',
        date_start: s.check_in_date || null,
        date_end: s.check_out_date || null,
      };
      return acc;
    }, {});
    

    // 1. MICE Satışları
    const miceItems = (items || []).map(item => {
      const invoicedAmount = invoicedMap[item.id] || 0;
      const balance = Number(item.total_price || 0) - invoicedAmount;
      const cat = categoriesMap[item.category] || {};
      const subCat = categoriesMap[item.sub_category] || {};
      const proj = projectsMap[item.project_id] || null;
      
      // Kategori/Alt Kategori isimlerini çöz
      const categoryName = cat.name || (isUUID(item.category) ? 'Bilinmiyor' : item.category);
      const subCategoryName = subCat.name || (isUUID(item.sub_category) ? null : item.sub_category);
      
      return {
        ...item,
        category_name: categoryName,
        sub_category_name: subCategoryName,
        description: cleanDescription(item.description),
        // Kategori tanımında KDV varsa onu kullan, yoksa kalemdeki KDV'yi kullan
        vat_rate: (item.vat !== null && item.vat !== undefined) ? item.vat : (subCat.revenue_vat_rate ?? cat.revenue_vat_rate ?? 0),
        project: proj,
        invoiced_amount: invoicedAmount,
        balance: balance
      };
    });

    // 2. Sejour kalemleri
    const sejourItems: any[] = [];

    (sejourRoomsRes.data || []).forEach(r => {
      const price = Number(r.total_price || r.price || 0);
      if (price <= 0) return;
      const proj = sejoursMap[r.sejour_id] || null;
      sejourItems.push({
        id: r.id, sejour_id: r.sejour_id,
        category_name: 'Konaklama / Otel',
        description: r.accommodation_type || r.room_type || '',
        total_price: price,
        currency: r.currency || 'TRY',
        vat_rate: 8,
        project: proj
      });
    });
    (sejourFlightsRes.data || []).forEach(r => {
      const price = Number(r.total_price || r.price || 0);
      if (price <= 0) return;
      const proj = sejoursMap[r.sejour_id] || null;
      sejourItems.push({
        id: r.id, sejour_id: r.sejour_id,
        category_name: 'Uçak Bileti',
        description: [r.departure_airport, r.arrival_airport].filter(Boolean).join(' → ') + (r.pnr ? ' | PNR: ' + r.pnr : ''),
        total_price: price,
        currency: r.currency || 'TRY',
        vat_rate: 0,
        project: proj
      });
    });
    (sejourTransfersRes.data || []).forEach(r => {
      const price = Number(r.price || 0);
      if (price <= 0) return;
      sejourItems.push({
        id: r.id, sejour_id: r.sejour_id,
        category_name: 'Transfer',
        description: r.direction || '',
        total_price: price,
        currency: r.currency || 'TRY',
        vat_rate: 20,
        project: sejoursMap[r.sejour_id] || null
      });
    });
    (sejourExtraRes.data || []).forEach(r => {
      const price = Number(r.price || 0);
      if (price <= 0) return;
      sejourItems.push({
        id: r.id, sejour_id: r.sejour_id,
        category_name: 'Ekstra Servis',
        description: r.service_description || r.description || '',
        total_price: price,
        currency: r.currency || 'TRY',
        vat_rate: 20,
        project: sejoursMap[r.sejour_id] || null
      });
    });

    const formattedSejourItems = sejourItems.map(item => {
      const invoicedAmount = invoicedMap[item.id] || 0;
      const balance = Number(item.total_price || 0) - invoicedAmount;
      return { ...item, invoiced_amount: invoicedAmount, balance };
    });

    return [...miceItems, ...formattedSejourItems].filter(item => item.balance > 0.01 && item.project !== null);
  },

  async getPendingSalesItemsPage(params: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: any[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const page = Math.max(1, Number(params.page || 1));
    const pageSize = Math.max(1, Number(params.pageSize || 25));
    const all = await this.getPendingSalesItems();
    const filtered = all.filter((item: any) => {
      if (!params.startDate && !params.endDate) return true;
      const serviceDate = item.project?.date_start ? new Date(item.project.date_start) : new Date(item.created_at);
      if (params.startDate) {
        const start = new Date(params.startDate);
        start.setHours(0, 0, 0, 0);
        if (serviceDate < start) return false;
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        if (serviceDate > end) return false;
      }
      return true;
    });
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);
    return { data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  },

  // Bekleyen Alış Kalemlerini Getir
  async getPendingPurchaseItems(): Promise<any[]> {
    const { data: items, error: itemsError } = await supabase.from('project_purchase_items').select('*').order('created_at', { ascending: false });
    if (itemsError) throw itemsError;

    const { data: invoiceItems } = await supabase.from('invoice_items').select('*').eq('item_type', 'purchase');

    // Collect IDs
    const projectIds = Array.from(new Set((items || []).map(i => i.project_id).filter(Boolean)));
    
    // Fetch sejour items to find sejour IDs
    const [sejourRoomsRes, sejourFlightsRes, sejourTransfersRes, sejourExtraRes] = await Promise.all([
      supabase.from('sejour_rooms').select('*'),
      supabase.from('sejour_flights').select('*'),
      supabase.from('sejour_transfers').select('*'),
      supabase.from('sejour_extra_services').select('*')
    ]);

    const sejourIds = new Set<string>();
    (sejourRoomsRes.data || []).forEach(r => sejourIds.add(r.sejour_id));
    (sejourFlightsRes.data || []).forEach(f => sejourIds.add(f.sejour_id));
    (sejourTransfersRes.data || []).forEach(t => sejourIds.add(t.sejour_id));
    (sejourExtraRes.data || []).forEach(e => sejourIds.add(e.sejour_id));
    const sIdArray = Array.from(sejourIds);

    // Fetch metadata
    const [projectsRes, sejoursRes, categoriesRes] = await Promise.all([
      projectIds.length ? supabase.from('projects').select('id, title, company_name, description, quote_type, hotel_id, agency_id, start_date, end_date, status').in('id', projectIds).eq('status', 'completed') : Promise.resolve({ data: [] }),
      sIdArray.length ? supabase.from('sejours').select('id, voucher_number, customer_name, agency_id, hotel_id, check_in_date, check_out_date, status').in('id', sIdArray).eq('status', 'KONFIRME') : Promise.resolve({ data: [] }),
      supabase.from('categories').select('*')
    ]);

    // Collect contact IDs
    const contactIds = new Set<string>();
    (projectsRes.data || []).forEach((p: any) => {
      if (p.agency_id) contactIds.add(p.agency_id);
      if (p.hotel_id) contactIds.add(p.hotel_id);
    });
    (sejoursRes.data || []).forEach((s: any) => {
      if (s.agency_id) contactIds.add(s.agency_id);
      if (s.hotel_id) contactIds.add(s.hotel_id);
    });
    (items || []).forEach((i: any) => {
      if (i.supplier_id) contactIds.add(i.supplier_id);
      if (i.hotel_id) contactIds.add(i.hotel_id);
    });
    (sejourRoomsRes.data || []).forEach((r: any) => {
      if (r.hotel_id) contactIds.add(r.hotel_id);
    });
    (sejourFlightsRes.data || []).forEach((f: any) => {
      if (f.ticketing_provider) contactIds.add(f.ticketing_provider);
      if (f.supplier_id) contactIds.add(f.supplier_id);
      if (f.airline_id) contactIds.add(f.airline_id);
    });
    (sejourTransfersRes.data || []).forEach((t: any) => {
      if (t.supplier_id) contactIds.add(t.supplier_id);
    });
    (sejourExtraRes.data || []).forEach((e: any) => {
      if (e.supplier_id) contactIds.add(e.supplier_id);
    });
    const cIdArray = Array.from(contactIds);

    const [agenciesRes, hotelsRes, suppliersRes] = await Promise.all([
      cIdArray.length ? supabase.from('agencies').select('id, name').in('id', cIdArray) : Promise.resolve({ data: [] }),
      cIdArray.length ? supabase.from('hotels').select('id, name').in('id', cIdArray) : Promise.resolve({ data: [] }),
      cIdArray.length ? supabase.from('suppliers').select('id, name').in('id', cIdArray) : Promise.resolve({ data: [] })
    ]);

    const invoicedMap = (invoiceItems || []).reduce((acc: any, ii: any) => {
      acc[ii.item_id] = (acc[ii.item_id] || 0) + Number(ii.amount);
      return acc;
    }, {});

    const agenciesMap = (agenciesRes.data || []).reduce((acc: any, a: any) => { acc[a.id] = a; return acc; }, {});
    const hotelsMap = (hotelsRes.data || []).reduce((acc: any, h: any) => { acc[h.id] = h; return acc; }, {});
    const suppliersMap = (suppliersRes.data || []).reduce((acc: any, s: any) => { acc[s.id] = s; return acc; }, {});
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    
    const purchaseVendorIdFromDescription = (desc: string): string | null => {
      const m = (desc || '').match(/ \[S:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]/i);
      return m ? m[1] : null;
    };

    const projectsMap = (projectsRes.data || []).reduce((acc: any, p: any) => {
      const agencyName = p.agency_id ? agenciesMap[p.agency_id]?.name : null;
      const hotelName = p.hotel_id ? hotelsMap[p.hotel_id]?.name : null;
      const projectDesc = p.description ? p.description.replace(/^Konfirme edilen teklif:\s*/i, '').trim() : '';
      const cleanTitle = p.title ? p.title.replace(/\s*-\s*(Çoklu Konaklama|Multi Hotel).*$/i, '').trim() : p.title;
      acc[p.id] = {
        ...p,
        title: cleanTitle,
        description: cleanDescription(projectDesc),
        company_name: p.quote_type === 'MICE' ? (p.company_name || agencyName || '') : (hotelName || agencyName || p.company_name || ''),
        date_start: p.start_date || null,
        date_end: p.end_date || null,
      };
      return acc;
    }, {});

    const categoriesMap = (categoriesRes.data || []).reduce((acc: any, c: any) => {
      acc[c.id] = c;
      if (c.code) acc[c.code] = c;
      return acc;
    }, {});

    const sejoursMap = (sejoursRes.data || []).reduce((acc: any, s: any) => {
      const hotelName = s.hotel_id ? hotelsMap[s.hotel_id]?.name : null;
      const agencyName = s.agency_id ? agenciesMap[s.agency_id]?.name : null;
      const displayCompany = hotelName || agencyName || s.customer_name || 'Bilinmiyor';
      acc[s.id] = {
        id: s.id,
        title: s.voucher_number || s.customer_name || 'Sejour',
        voucher_number: s.voucher_number,
        description: s.customer_name || '',
        company_name: displayCompany,
        hotel_id: s.hotel_id,
        agency_id: s.agency_id,
        quote_type: 'SEJOUR',
        date_start: s.check_in_date || null,
        date_end: s.check_out_date || null,
      };
      return acc;
    }, {});

    // MICE Alış Kalemleri
    const miceItems = (items || []).map((item: any) => {
      const invoicedAmount = invoicedMap[item.id] || 0;
      const balance = Number(item.total_price || 0) - invoicedAmount;
      const cat = categoriesMap[item.category] || {};
      const subCat = categoriesMap[item.sub_category] || {};
      const proj = projectsMap[item.project_id] || null;
      
      const categoryName = cat.name || (isUUID(item.category) ? 'Bilinmiyor' : item.category);
      const subCategoryName = subCat.name || (isUUID(item.sub_category) ? null : item.sub_category);

      const taggedVendorId = purchaseVendorIdFromDescription(item.description || '');
      let outSupplierId: string | null = item.supplier_id ?? null;
      let outHotelId: string | null = item.hotel_id ?? null;
      
      if (taggedVendorId) {
        if (suppliersMap[taggedVendorId]) {
          outSupplierId = taggedVendorId;
          outHotelId = null;
        } else if (hotelsMap[taggedVendorId]) {
          outHotelId = taggedVendorId;
          outSupplierId = null;
        }
      }

      const outSupplierName = outSupplierId ? (suppliersMap[outSupplierId]?.name || 'Tedarikçi') : null;
      const outHotelName = outHotelId ? (hotelsMap[outHotelId]?.name || 'Otel') : null;

      return {
        ...item,
        category_name: categoryName,
        sub_category_name: subCategoryName,
        description: cleanDescription(item.description),
        // Kategori tanımında KDV varsa onu kullan, yoksa kalemdeki KDV'yi kullan
        vat_rate: (item.vat !== null && item.vat !== undefined) ? item.vat : (subCat.expense_vat_rate ?? cat.expense_vat_rate ?? 0),
        supplier_id: outSupplierId,
        hotel_id: outHotelId,
        project: proj, // Do not override company_name to keep the actual customer name
        supplier_name: outSupplierName,
        hotel_name: outHotelName,
        invoiced_amount: invoicedAmount,
        balance
      };
    });

    // Sejour Alış Kalemleri
    const sejourItems: any[] = [];

    (sejourRoomsRes.data || []).forEach((r: any) => {
      const price = Number(r.cost_price || 0);
      if (price <= 0) return;

      const proj = sejoursMap[r.sejour_id] || null;
      const roomHotelName = r.hotel_id ? hotelsMap[r.hotel_id]?.name : null;
      const headerHotelName = proj?.hotel_id ? hotelsMap[proj.hotel_id]?.name : null;
      const hotelName = roomHotelName || headerHotelName;

      sejourItems.push({
        id: r.id, sejour_id: r.sejour_id,
        category_name: 'Konaklama / Otel Maliyeti',
        description: r.accommodation_type || r.room_type || '',
        total_price: price, currency: r.cost_currency || 'TRY', vat_rate: 8,
        project: proj
          ? {
              ...proj,
              company_name: hotelName || 'Otel Seçilmedi',
              hotel_name: hotelName || null
            }
          : null
      });
    });
    (sejourFlightsRes.data || []).forEach((r: any) => {
      const price = Number(r.cost_price || 0);
      if (price <= 0) return;

      const proj = sejoursMap[r.sejour_id] || null;
      const ticketSupplierId = r.ticketing_provider || r.supplier_id;
      const vendorName =
        (ticketSupplierId ? suppliersMap[ticketSupplierId]?.name : null) ||
        (r.airline_id ? agenciesMap[r.airline_id]?.name : null) ||
        (r.airline ? String(r.airline).trim() : null);

      sejourItems.push({
        id: r.id, sejour_id: r.sejour_id,
        category_name: 'Uçak Bileti Maliyeti',
        description: [r.departure_airport, r.arrival_airport].filter(Boolean).join(' → '),
        total_price: price, currency: r.cost_currency || 'TRY', vat_rate: 0,
        project: proj
          ? {
              ...proj,
              company_name: vendorName || 'Havayolu/Tedarikçi Seçilmedi',
              hotel_name: null
            }
          : null,
        supplier_name: vendorName || 'Havayolu/Tedarikçi Seçilmedi',
        supplier_id: ticketSupplierId || null
      });
    });
    (sejourTransfersRes.data || []).forEach((r: any) => {
      const price = Number(r.cost_price || 0);
      if (price <= 0) return;

      const supplierName = r.supplier_id ? suppliersMap[r.supplier_id]?.name : null;
      const proj = sejoursMap[r.sejour_id] || null;

      sejourItems.push({
        id: r.id, sejour_id: r.sejour_id, category_name: 'Transfer Maliyeti',
        description: r.direction || '',
        total_price: price, currency: r.cost_currency || 'TRY', vat_rate: 20,
        project: proj ? { ...proj, company_name: supplierName || 'Transfer Tedarikçisi Seçilmedi' } : null,
        supplier_name: supplierName || 'Transfer Tedarikçisi Seçilmedi',
        supplier_id: r.supplier_id || null
      });
    });
    (sejourExtraRes.data || []).forEach((r: any) => {
      const price = Number(r.cost_price || 0);
      if (price <= 0) return;

      const supplierName = r.supplier_id ? suppliersMap[r.supplier_id]?.name : null;
      const proj = sejoursMap[r.sejour_id] || null;

      sejourItems.push({
        id: r.id, sejour_id: r.sejour_id, category_name: 'Ekstra Servis Maliyeti',
        description: r.service_description || r.description || '',
        total_price: price, currency: r.cost_currency || 'TRY', vat_rate: 20,
        project: proj ? { ...proj, company_name: supplierName || 'Tedarikçi Seçilmedi' } : null,
        supplier_name: supplierName || 'Tedarikçi Seçilmedi',
        supplier_id: r.supplier_id || null
      });
    });

    const formattedSejourItems = sejourItems.map((item: any) => {
      const invoicedAmount = invoicedMap[item.id] || 0;
      const balance = Number(item.total_price || 0) - invoicedAmount;
      return { ...item, invoiced_amount: invoicedAmount, balance };
    });

    return [...miceItems, ...formattedSejourItems].filter((item: any) => item.balance > 0.01 && item.project !== null);
  },

  async getPendingPurchaseItemsPage(params: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: any[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const page = Math.max(1, Number(params.page || 1));
    const pageSize = Math.max(1, Number(params.pageSize || 25));
    const all = await this.getPendingPurchaseItems();
    const filtered = all.filter((item: any) => {
      if (!params.startDate && !params.endDate) return true;
      const serviceDate = item.project?.date_start ? new Date(item.project.date_start) : new Date(item.created_at);
      if (params.startDate) {
        const start = new Date(params.startDate);
        start.setHours(0, 0, 0, 0);
        if (serviceDate < start) return false;
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        if (serviceDate > end) return false;
      }
      return true;
    });
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);
    return { data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }
};

export const invoiceItemsService = {
  // Kaynak kalem ID'sine göre fatura kalemlerini getir
  async getBySourceId(sourceId: string, itemType: 'sales' | 'purchase'): Promise<any[]> {
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*, invoices(*)')
      .eq('item_id', sourceId)
      .eq('item_type', itemType);
    
    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return [];
      }
      throw error;
    }
    return data || [];
  },

  // Tüm fatura kalemlerini getir (toplu bakiye hesabı için)
  async getAll(itemType?: 'sales' | 'purchase'): Promise<any[]> {
    let query = supabase.from('invoice_items').select('*');
    if (itemType) query = query.eq('item_type', itemType);
    
    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return [];
      }
      throw error;
    }
    return data || [];
  }
};
 
// MARKETING
export const marketingService = {
  // Clients
  clients: {
    async getAll(): Promise<any[]> {
      const { data, error } = await supabase
        .from('marketing_clients')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async create(client: any): Promise<any> {
      const { data, error } = await supabase
        .from('marketing_clients')
        .insert([client])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async update(id: string, client: any): Promise<any> {
      const { data, error } = await supabase
        .from('marketing_clients')
        .update({ ...client, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('marketing_clients')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },
  // Contacts
  contacts: {
    async getByClientId(clientId: string): Promise<any[]> {
      const { data, error } = await supabase
        .from('marketing_contacts')
        .select('*')
        .eq('client_id', clientId)
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async create(contact: any): Promise<any> {
      const { data, error } = await supabase
        .from('marketing_contacts')
        .insert([contact])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async update(id: string, contact: any): Promise<any> {
      const { data, error } = await supabase
        .from('marketing_contacts')
        .update({ ...contact, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('marketing_contacts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },
  // Interactions
  interactions: {
    async getByClientId(clientId: string): Promise<any[]> {
      const { data, error } = await supabase
        .from('marketing_interactions')
        .select('*, marketing_contacts(full_name)')
        .eq('client_id', clientId)
        .order('interaction_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async getAll(status?: string): Promise<any[]> {
      let query = supabase
        .from('marketing_interactions')
        .select('*, marketing_clients(name)')
        .order('interaction_date', { ascending: false });
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    async create(interaction: any): Promise<any> {
      const { data, error } = await supabase
        .from('marketing_interactions')
        .insert([interaction])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async update(id: string, interaction: any): Promise<any> {
      const { data, error } = await supabase
        .from('marketing_interactions')
        .update({ ...interaction, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('marketing_interactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },
  // Notes
  notes: {
    async getByClientId(clientId: string): Promise<any[]> {
      const { data, error } = await supabase
        .from('marketing_notes')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async create(note: any): Promise<any> {
      const { data, error } = await supabase
        .from('marketing_notes')
        .insert([note])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async update(id: string, note: any): Promise<any> {
      const { data, error } = await supabase
        .from('marketing_notes')
        .update({ ...note, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }
};


// --- DİĞER (Others) Tablosu Servisleri ---
export const projectOthersService = {
  // Tüm kayıtları getir (Proje ID'sine göre)
  async getByProjectId(projectId: string): Promise<any[]> {
    console.log("Fetching project_others for", projectId);
    const { data, error } = await supabase
      .from('project_others')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });

    console.log("project_others fetch result:", data, error);

    if (error) throw error;
    return data || [];
  },

  // Yeni kayıt ekle
  async create(record: any): Promise<any> {
    const { data, error } = await supabase
      .from('project_others')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Kayıt güncelle
  async update(id: string, record: any): Promise<any> {
    const { data, error } = await supabase
      .from('project_others')
      .update({ ...record, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Kayıt sil
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_others')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Proje bazında tüm kayıtları sil
  async deleteByProjectId(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('project_others')
      .delete()
      .eq('project_id', projectId);

    if (error) throw error;
  }
};
