// TEMPUS TRAVEL - LOCALSTORAGE TO SUPABASE MIGRATION SCRIPT
// Bu script mevcut localStorage verilerini Supabase'e taşır

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Migration fonksiyonları
class DataMigration {
  constructor() {
    this.migratedData = {
      users: [],
      agencies: [],
      hotels: [],
      suppliers: [],
      categories: [],
      serviceTypes: [],
      projects: [],
      quotes: [],
      sejours: [],
      operations: [],
      settings: []
    };
  }

  // Kullanıcıları migrate et
  async migrateUsers() {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        const { data, error } = await supabase
          .from('users')
          .upsert({
            id: user.id || '00000000-0000-0000-0000-000000000001',
            first_name: user.first_name || 'Arif',
            last_name: user.last_name || 'Ari',
            email: user.email || 'arif.ari@tempustravel.co',
            role: user.role || 'super_admin'
          });
        
        if (error) throw error;
        console.log('Users migrated successfully');
      }
    } catch (error) {
      console.error('Error migrating users:', error);
    }
  }

  // Ajansları migrate et
  async migrateAgencies() {
    try {
      const agencies = JSON.parse(localStorage.getItem('agencies') || '[]');
      if (agencies.length > 0) {
        const { data, error } = await supabase
          .from('agencies')
          .upsert(agencies.map(agency => ({
            id: agency.id,
            name: agency.name,
            contact_person: agency.contact_person,
            email: agency.email,
            phone: agency.phone,
            address: agency.address,
            city: agency.city,
            country: agency.country,
            commission_rate: agency.commission_rate || 0,
            is_active: agency.is_active !== false
          })));
        
        if (error) throw error;
        console.log('Agencies migrated successfully');
      }
    } catch (error) {
      console.error('Error migrating agencies:', error);
    }
  }

  // Otelleri migrate et
  async migrateHotels() {
    try {
      const hotels = JSON.parse(localStorage.getItem('hotels') || '[]');
      if (hotels.length > 0) {
        const { data, error } = await supabase
          .from('hotels')
          .upsert(hotels.map(hotel => ({
            id: hotel.id,
            name: hotel.name,
            address: hotel.address,
            city: hotel.city,
            country: hotel.country,
            phone: hotel.phone,
            email: hotel.email,
            website: hotel.website,
            star_rating: hotel.star_rating,
            is_active: hotel.is_active !== false
          })));
        
        if (error) throw error;
        console.log('Hotels migrated successfully');
      }
    } catch (error) {
      console.error('Error migrating hotels:', error);
    }
  }

  // Tedarikçileri migrate et
  async migrateSuppliers() {
    try {
      const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
      if (suppliers.length > 0) {
        const { data, error } = await supabase
          .from('suppliers')
          .upsert(suppliers.map(supplier => ({
            id: supplier.id,
            name: supplier.name,
            type: supplier.type || 'other',
            contact_person: supplier.contact_person,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address,
            city: supplier.city,
            country: supplier.country,
            is_active: supplier.is_active !== false
          })));
        
        if (error) throw error;
        console.log('Suppliers migrated successfully');
      }
    } catch (error) {
      console.error('Error migrating suppliers:', error);
    }
  }

  // Kategorileri migrate et
  async migrateCategories() {
    try {
      const categories = JSON.parse(localStorage.getItem('categories') || '[]');
      if (categories.length > 0) {
        const { data, error } = await supabase
          .from('categories')
          .upsert(categories.map(category => ({
            id: category.id,
            name: category.name,
            description: category.description,
            parent_id: category.parent_id,
            is_active: category.is_active !== false
          })));
        
        if (error) throw error;
        console.log('Categories migrated successfully');
      }
    } catch (error) {
      console.error('Error migrating categories:', error);
    }
  }

  // Hizmet tiplerini migrate et
  async migrateServiceTypes() {
    try {
      const serviceTypes = JSON.parse(localStorage.getItem('serviceTypes') || '[]');
      if (serviceTypes.length > 0) {
        const { data, error } = await supabase
          .from('service_types')
          .upsert(serviceTypes.map(serviceType => ({
            id: serviceType.id,
            name: serviceType.name,
            description: serviceType.description,
            category: serviceType.category || 'other',
            is_active: serviceType.is_active !== false
          })));
        
        if (error) throw error;
        console.log('Service types migrated successfully');
      }
    } catch (error) {
      console.error('Error migrating service types:', error);
    }
  }

  // Projeleri migrate et
  async migrateProjects() {
    try {
      const projects = JSON.parse(localStorage.getItem('projects') || '[]');
      if (projects.length > 0) {
        const { data, error } = await supabase
          .from('projects')
          .upsert(projects.map(project => ({
            id: project.id,
            name: project.name,
            description: project.description,
            client_name: project.client_name,
            agency_id: project.agency_id,
            start_date: project.start_date,
            end_date: project.end_date,
            status: project.status || 'active',
            total_budget: project.total_budget,
            currency: project.currency || 'EUR',
            created_by: '00000000-0000-0000-0000-000000000001'
          })));
        
        if (error) throw error;
        console.log('Projects migrated successfully');
      }
    } catch (error) {
      console.error('Error migrating projects:', error);
    }
  }

  // Teklifleri migrate et
  async migrateQuotes() {
    try {
      const quotes = JSON.parse(localStorage.getItem('quotes') || '[]');
      if (quotes.length > 0) {
        const { data, error } = await supabase
          .from('quotes')
          .upsert(quotes.map(quote => ({
            id: quote.id,
            project_id: quote.project_id,
            quote_number: quote.quote_number,
            client_name: quote.client_name,
            agency_id: quote.agency_id,
            total_amount: quote.total_amount,
            currency: quote.currency,
            status: quote.status || 'draft',
            valid_until: quote.valid_until,
            created_by: '00000000-0000-0000-0000-000000000001'
          })));
        
        if (error) throw error;
        console.log('Quotes migrated successfully');
      }
    } catch (error) {
      console.error('Error migrating quotes:', error);
    }
  }

  // Sejour'ları migrate et
  async migrateSejours() {
    try {
      const sejours = JSON.parse(localStorage.getItem('sejourData') || '[]');
      if (sejours.length > 0) {
        for (const sejour of sejours) {
          // Ana sejour kaydını oluştur
          const { data: sejourData, error: sejourError } = await supabase
            .from('sejours')
            .upsert({
              id: sejour.id,
              voucher_number: sejour.voucherNumber,
              customer_type: sejour.customerType,
              customer_name: sejour.customerName,
              agency_id: sejour.agency_id,
              check_in_date: sejour.checkInDate,
              check_out_date: sejour.checkOutDate,
              hotel_id: sejour.hotel_id,
              hotel_name: sejour.hotelName,
              hotel_address: sejour.hotelAddress,
              status: sejour.status || 'confirmed',
              notes: sejour.notes,
              created_by: '00000000-0000-0000-0000-000000000001'
            });

          if (sejourError) throw sejourError;

          // Odaları migrate et
          if (sejour.rooms && sejour.rooms.length > 0) {
            const { error: roomsError } = await supabase
              .from('sejour_rooms')
              .upsert(sejour.rooms.map(room => ({
                id: room.id,
                sejour_id: sejour.id,
                room_number: room.roomNumber,
                room_type: room.roomType,
                room_type_code: room.roomType?.toLowerCase().includes('single') ? 'SNG' : 'DBL',
                guest_info: room.guestInfo,
                price: room.price,
                currency: room.currency,
                cost_price: room.costPrice,
                cost_currency: room.costCurrency
              })));

            if (roomsError) throw roomsError;
          }

          // Uçuşları migrate et
          if (sejour.flights && sejour.flights.length > 0) {
            const { error: flightsError } = await supabase
              .from('sejour_flights')
              .upsert(sejour.flights.map(flight => ({
                id: flight.id,
                sejour_id: sejour.id,
                flight_date: flight.flightDate,
                airline: flight.airline,
                route: flight.route,
                flight_number: flight.flightNumber,
                departure_time: flight.departureTime,
                arrival_time: flight.arrivalTime,
                flight_type: flight.type || 'departure',
                price: flight.price,
                currency: flight.currency
              })));

            if (flightsError) throw flightsError;
          }

          // Transferleri migrate et
          if (sejour.transfers && sejour.transfers.length > 0) {
            const { error: transfersError } = await supabase
              .from('sejour_transfers')
              .upsert(sejour.transfers.map(transfer => ({
                id: transfer.id,
                sejour_id: sejour.id,
                direction: transfer.direction,
                transfer_type: transfer.type,
                vehicle: transfer.vehicle,
                supplier_id: transfer.provider,
                time: transfer.time,
                price: transfer.price,
                currency: transfer.currency
              })));

            if (transfersError) throw transfersError;
          }

          // Ek hizmetleri migrate et
          if (sejour.extraServices && sejour.extraServices.length > 0) {
            const { error: servicesError } = await supabase
              .from('sejour_extra_services')
              .upsert(sejour.extraServices.map(service => ({
                id: service.id,
                sejour_id: sejour.id,
                service_type_id: service.serviceType,
                provider_id: service.provider,
                description: service.description,
                price: service.price,
                currency: service.currency
              })));

            if (servicesError) throw servicesError;
          }
        }
        
        console.log('Sejours migrated successfully');
      }
    } catch (error) {
      console.error('Error migrating sejours:', error);
    }
  }

  // Operasyonları migrate et
  async migrateOperations() {
    try {
      const operations = JSON.parse(localStorage.getItem('operations') || '[]');
      if (operations.length > 0) {
        const { data, error } = await supabase
          .from('operations')
          .upsert(operations.map(operation => ({
            id: operation.id,
            project_id: operation.project_id,
            operation_type: operation.type || 'other',
            title: operation.title,
            description: operation.description,
            supplier_id: operation.supplier_id,
            start_date: operation.start_date,
            end_date: operation.end_date,
            status: operation.status || 'planned',
            cost: operation.cost,
            currency: operation.currency,
            created_by: '00000000-0000-0000-0000-000000000001'
          })));
        
        if (error) throw error;
        console.log('Operations migrated successfully');
      }
    } catch (error) {
      console.error('Error migrating operations:', error);
    }
  }

  // Ayarları migrate et
  async migrateSettings() {
    try {
      const generalSettings = localStorage.getItem('generalSettings');
      if (generalSettings) {
        const settings = JSON.parse(generalSettings);
        const { error } = await supabase
          .from('settings')
          .upsert({
            key: 'general_settings',
            value: settings,
            description: 'Genel şirket ayarları'
          });
        
        if (error) throw error;
        console.log('Settings migrated successfully');
      }
    } catch (error) {
      console.error('Error migrating settings:', error);
    }
  }

  // Tüm migration'ları çalıştır
  async runMigration() {
    console.log('Starting migration to Supabase...');
    
    try {
      await this.migrateUsers();
      await this.migrateAgencies();
      await this.migrateHotels();
      await this.migrateSuppliers();
      await this.migrateCategories();
      await this.migrateServiceTypes();
      await this.migrateProjects();
      await this.migrateQuotes();
      await this.migrateSejours();
      await this.migrateOperations();
      await this.migrateSettings();
      
      console.log('Migration completed successfully!');
      console.log('You can now remove localStorage dependencies from your code.');
      
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }
}

// Migration'ı başlat
const migration = new DataMigration();
migration.runMigration();

export default DataMigration;
