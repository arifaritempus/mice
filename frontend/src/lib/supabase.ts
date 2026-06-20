import { createClient } from '@supabase/supabase-js';

// Supabase bağlantı bilgileri (env zorunlu, fallback kaldırıldı)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl) {
  console.error('⚠️ Supabase URL bulunamadı! .env.local dosyasında NEXT_PUBLIC_SUPABASE_URL ayarlayın.');
}
if (!supabaseAnonKey) {
  console.error('⚠️ Supabase ANON KEY bulunamadı! .env.local dosyasında NEXT_PUBLIC_SUPABASE_ANON_KEY ayarlayın.');
}

// HMR altında çoğalmayı engellemek için global cache kullan
// Hem browser (window) hem Node.js (global) ortamında çalışır
// Artık __supabaseCache objesi içinde saklanıyor

const getGlobalCache = () => {
  if (typeof window !== 'undefined') {
    // Browser ortamında window kullan
    if (!(window as any).__supabaseCache) {
      (window as any).__supabaseCache = {};
    }
    return (window as any).__supabaseCache;
  }
  // Node.js ortamında globalThis kullan
  if (!(globalThis as any).__supabaseCache) {
    (globalThis as any).__supabaseCache = {};
  }
  return (globalThis as any).__supabaseCache;
};

const globalForSupabase = getGlobalCache();

// Singleton pattern - sadece bir kez oluştur
// Storage key'leri farklı olmalı ki GoTrueClient uyarısı olmasın
let supabaseInstance: any = null;

export const supabase = (() => {
  // Önce global cache'i kontrol et
  if (globalForSupabase.__supabaseInstance) {
    return globalForSupabase.__supabaseInstance;
  }
  
  // Sonra local instance'ı kontrol et (HMR durumunda)
  if (supabaseInstance) {
    globalForSupabase.__supabaseInstance = supabaseInstance;
    return supabaseInstance;
  }
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('⚠️ Supabase credentials eksik!');
    // Fallback: boş bir client döndür (hata vermesin)
    const fallbackClient = createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    }) as any;
    supabaseInstance = fallbackClient;
    globalForSupabase.__supabaseInstance = fallbackClient;
    return fallbackClient;
  }
  
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-auth-token' // Ana client için storage key
    }
  });
  
  supabaseInstance = client;
  globalForSupabase.__supabaseInstance = client;
  return client;
})();

// Public Supabase client - direkt supabase'i kullan (aynı instance)
// Farklı client oluşturmak GoTrueClient uyarısına neden oluyor
// publicSupabase artık supabase'in alias'ı - aynı instance'ı kullanıyor
export const publicSupabase = supabase;

// Utility fonksiyonlar
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

// Veri tipleri
export interface Quote {
  id: string;
  reference: string;
  agency_id: string;
  company_name: string;
  check_in_date: string;
  check_out_date: string;
  hotel_id: string;
  hotel_concept: string;
  room_count: number;
  pax_count: number;
  option: string;
  status: string;
  quote_type: string;
  notes: string;
  total_amount: number;
  // Kilit özelliği (opsiyonel, Supabase şemasında varsa dolar)
  locked?: boolean;
  // Projeye aktarım ve ek alanlar (opsiyonel)
  transferred_project_id?: string;
  transferred_at?: string;
  room_pax?: string;
  confirmed_at?: string;
  operation_managers?: string[];
  project_name?: string;
  created_at: string;
  updated_at: string;
  items?: { currency: string }[];
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  main_category?: string;
  sub_category?: string;
  unit_quantity: number;
  sefer: number;
  unit_price: number;
  currency: string;
  total: number;
  total_price?: number;
  total_try?: number;
  description: string;
  vat: number;
  fx: number;
  hotel_id?: string; // Hangi otele ait olduğu
  created_at: string;
}


export interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  budget: number;
  progress: number;
  team_members: number;
  quote_id?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  // Proje detay sayfasındaki alanlar
  reference?: string;
  company_name?: string;
  quote_type?: string;
  agency_id?: string;
  hotel_id?: string;
  room_count?: number;
  pax_count?: number;
  room_pax?: string;
  confirmed_at?: string;
  // Kilit özelliği (opsiyonel)
  locked?: boolean;
  hotels_data?: any[];
  // Kur Stratejisi
  exchange_rate_strategy?: string;
  usd_rate?: number;
  eur_rate?: number;
  gbp_rate?: number;
}

export interface Agency {
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
  updated_at: string;
}

export interface Hotel {
  id: string;
  name: string;
  concept: string;
  location?: string;
  rating?: number;
  contact_person?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string | null;
  main_category_id?: string;
  is_active?: boolean;
  icon?: string;
  color?: string;
  sort_order?: number;
  code?: string | number;
  created_at: string;
  updated_at?: string;
}

export interface BudgetItem {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectSalesItem {
  id: string;
  project_id: string;
  category: string;
  sub_category: string;
  description: string;
  unit_quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  vat: number;
  fx: number;
  sefer?: number;
  repeat?: number;
  hotel_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectPurchaseItem {
  id: string;
  project_id: string;
  category: string;
  sub_category: string;
  description: string;
  unit_quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  vat: number;
  fx: number;
  hotel_id?: string;
  sefer?: number;
  repeat?: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectAccommodationItem {
  id: string;
  project_id: string;
  room_number: string;
  room_type: string;
  bed_type: string;
  first_name: string;
  last_name: string;
  check_in_date: string;
  check_out_date: string;
  flight_arrival: string;
  flight_departure: string;
  nights: number;
  package: string;
  hotel: string;
  flight: string;
  total: number;
  currency: string;
  room_note?: string;
  arrival_flight_code?: string;
  arrival_flight_departure?: string;
  arrival_flight_arrival?: string;
  return_flight_code?: string;
  return_flight_departure?: string;
  return_flight_arrival?: string;
  created_at: string;
  updated_at: string;
} 