const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/database');

const client = supabaseAdmin || supabase;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeSortDirection = (value) => (String(value).toLowerCase() === 'asc' ? 'asc' : 'desc');
const parseFilterTokens = (value) => {
  if (value == null) return [];
  const raw = String(value).trim();
  if (!raw) return [];
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v || '').trim().toLowerCase()).filter(Boolean);
      }
    } catch (_) {}
  }
  return raw
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
};

const mapSejourStatusToOperation = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('konf') || s.includes('confirm')) return 'confirmed';
  if (s.includes('ipt') || s.includes('cancel')) return 'cancelled';
  if (s.includes('tamam') || s.includes('complete')) return 'completed';
  return 'pending';
};

const buildTransferRow = ({ source, transfer, sejour, project }) => {
  if (source === 'sejour') {
    const transferType =
      transfer.direction === 'arrival'
        ? 'airport_hotel'
        : transfer.direction === 'return'
          ? 'hotel_airport'
          : 'hotel_hotel';

    return {
      id: `sejour:${transfer.id}`,
      reference: String(sejour?.voucher_number || readableRef(sejour?.id, 'SEJ') || ''),
      project_type: 'sejour',
      project_reference: String(sejour?.id || ''),
      customer_name: sejour?.agencies?.name || '',
      company_name: sejour?.customer_name || '',
      check_in_date: sejour?.check_in_date || '',
      check_out_date: sejour?.check_out_date || '',
      supplier_id: transfer?.supplier_id || '',
      supplier_name: transfer?.suppliers?.name || 'Tedarikçi',
      transfer_date: transfer?.date || '',
      transfer_time: transfer?.time || '',
      transfer_type: transferType,
      service_type: transfer?.transfer_type || '',
      departure_point: transferType === 'airport_hotel' ? 'Havalimanı' : 'Otel',
      arrival_point: transferType === 'hotel_airport' ? 'Havalimanı' : 'Otel',
      vehicle_type: transfer?.vehicle_type || '',
      capacity: 0,
      passenger_count: 0,
      unit_price: Number(transfer?.price || 0),
      currency: transfer?.currency || 'EUR',
      total_amount: Number(transfer?.price || 0),
      status: mapSejourStatusToOperation(sejour?.status),
      notes: '',
      hotel_name: sejour?.hotels?.name || '',
      flight_info: {
        departure_airport: '',
        arrival_airport: '',
        flight_number: '',
        departure_time: '',
        arrival_time: '',
        airline: ''
      },
      created_at: transfer?.created_at || sejour?.created_at || '',
      updated_at: transfer?.updated_at || transfer?.created_at || sejour?.updated_at || ''
    };
  }

  const transferType =
    transfer?.direction === 'arrival'
      ? 'airport_hotel'
      : transfer?.direction === 'departure'
        ? 'hotel_airport'
        : 'hotel_hotel';

  return {
    id: `project:${transfer.id}`,
    reference: String(project?.reference || readableRef(project?.id, 'PRJ') || ''),
    project_type: 'mice',
    project_reference: String(project?.id || ''),
    customer_name: project?.agencies?.name || '',
    company_name: project?.company_name || '',
    check_in_date: project?.start_date || '',
    check_out_date: project?.end_date || '',
    supplier_id: transfer?.supplier_id || '',
    supplier_name: transfer?.suppliers?.name || transfer?.supplier_name || 'Tedarikçi',
    transfer_date: transfer?.date || '',
    transfer_time: transfer?.time || '',
    transfer_type: transferType,
    service_type: transfer?.transfer_type || '',
    departure_point: (transfer?.route || '').split(' → ')[0] || '',
    arrival_point: (transfer?.route || '').split(' → ')[1] || '',
    vehicle_type: transfer?.vehicle_type || '',
    capacity: Number(transfer?.capacity || 0),
    passenger_count: Number(transfer?.passenger_count || 0),
    unit_price: Number(transfer?.cost_amount || 0),
    currency: transfer?.currency || 'TRY',
    total_amount: Number(transfer?.cost_amount || 0),
    status: 'confirmed',
    notes: Array.isArray(transfer?.passengers) ? transfer.passengers.join(', ') : (transfer?.notes || ''),
    hotel_name: project?.hotels?.name || '',
    flight_info: {
      departure_airport: '',
      arrival_airport: '',
      flight_number: transfer?.flight_code || '',
      departure_time: '',
      arrival_time: '',
      airline: ''
    },
    created_at: transfer?.created_at || '',
    updated_at: transfer?.updated_at || transfer?.created_at || ''
  };
};

const paginateArray = ({ items, page, pageSize }) => {
  const offset = (page - 1) * pageSize;
  const total = Number(items.length || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    pageItems: items.slice(offset, offset + pageSize),
    total,
    totalPages
  };
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuidLike = (value) => UUID_REGEX.test(String(value || '').trim());

const loadSupplierLookup = async (supplierIds = []) => {
  const uuidIds = Array.from(new Set((supplierIds || []).filter((id) => isUuidLike(id))));
  if (uuidIds.length === 0) return {};

  const { data: suppliers, error } = await client
    .from('suppliers')
    .select('id,name')
    .in('id', uuidIds);
  if (error) throw error;

  return (suppliers || []).reduce((acc, s) => ({ ...acc, [s.id]: s.name || '' }), {});
};

const resolveSupplierName = ({ rawValue, supplierId, relationName, supplierLookup, fallback = 'Tedarikçi' }) => {
  const relation = String(relationName || '').trim();
  if (relation) return relation;

  const byId = String(supplierLookup?.[supplierId] || '').trim();
  if (byId) return byId;

  const byRaw = String(supplierLookup?.[String(rawValue || '').trim()] || '').trim();
  if (byRaw) return byRaw;

  const raw = String(rawValue || '').trim();
  if (!raw) return fallback;
  if (isUuidLike(raw)) return byId || fallback;
  return raw;
};

const readableRef = (value, prefix) => {
  const str = String(value || '').trim();
  if (!str) return '';
  if (!isUuidLike(str)) return str;
  return `${prefix}-${str.slice(0, 8).toUpperCase()}`;
};

const loadProjectLookup = async (projectIds = []) => {
  const uniqueIds = Array.from(new Set((projectIds || []).filter(Boolean)));
  if (uniqueIds.length === 0) return {};

  const { data: projects, error } = await client
    .from('projects')
    .select('id,reference,company_name,start_date,end_date,agency_id,hotel_id')
    .in('id', uniqueIds);
  if (error) throw error;

  const agencyIds = Array.from(new Set((projects || []).map((p) => p.agency_id).filter(Boolean)));
  const hotelIds = Array.from(new Set((projects || []).map((p) => p.hotel_id).filter(Boolean)));

  const [{ data: agencies }, { data: hotels }] = await Promise.all([
    agencyIds.length ? client.from('agencies').select('id,name').in('id', agencyIds) : Promise.resolve({ data: [] }),
    hotelIds.length ? client.from('hotels').select('id,name').in('id', hotelIds) : Promise.resolve({ data: [] })
  ]);

  const agencyMap = (agencies || []).reduce((acc, a) => ({ ...acc, [a.id]: a.name }), {});
  const hotelMap = (hotels || []).reduce((acc, h) => ({ ...acc, [h.id]: h.name }), {});

  return (projects || []).reduce((acc, p) => ({
    ...acc,
    [p.id]: {
      ...p,
      agencies: { name: agencyMap[p.agency_id] || '' },
      hotels: { name: hotelMap[p.hotel_id] || '' }
    }
  }), {});
};

// Transfers route'ları
router.get('/transfers', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = parsePositiveInt(req.query.pageSize, 20);
    const searchRaw = String(req.query.searchTerm || '').trim().toLowerCase();
    const searchParts = searchRaw.split(/\s+/).filter(Boolean);
    const referenceTerms = parseFilterTokens(req.query.referenceTerms);
    const companyTerms = parseFilterTokens(req.query.companyTerms);
    const customerTerms = parseFilterTokens(req.query.customerTerms);
    const supplierTerms = parseFilterTokens(req.query.supplierTerms);
    const hotelTerms = parseFilterTokens(req.query.hotelTerms);
    const guestTerms = parseFilterTokens(req.query.guestTerms);
    const flightTerms = parseFilterTokens(req.query.flightTerms);
    const filter = String(req.query.filter || 'all').toLowerCase();
    const startDate = String(req.query.startDate || '');
    const endDate = String(req.query.endDate || '');
    const stayStart = String(req.query.stayStart || '').slice(0, 10);
    const stayEnd = String(req.query.stayEnd || '').slice(0, 10);
    const sortField = String(req.query.sortField || 'transfer_date');
    const sortDirection = normalizeSortDirection(req.query.sortDirection);

    const requestedRows = Math.max(page * pageSize, pageSize);

    const sejourQuery = client
      .from('sejour_transfers')
      .select(`
        id,
        sejour_id,
        supplier_id,
        transfer_type,
        vehicle_type,
        date,
        time,
        price,
        currency,
        created_at,
        updated_at,
        direction,
        sejours!inner(
          id,
          voucher_number,
          customer_name,
          check_in_date,
          check_out_date,
          status,
          created_at,
          agencies(name),
          hotels(name)
        )
      `, { count: 'exact' })
      .eq('sejours.status', 'KONFIRME')
      .order('date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false, nullsFirst: false })
      .range(0, Math.max(0, requestedRows - 1));

    const projectQuery = client
      .from('project_transfer_tour')
      .select(`
        id,
        project_id,
        supplier_id,
        supplier_name,
        transfer_type,
        vehicle_type,
        date,
        time,
        route,
        direction,
        flight_code,
        passenger_count,
        passengers,
        cost_amount,
        currency,
        created_at,
        updated_at
      `, { count: 'exact' })
      .order('date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false, nullsFirst: false })
      .range(0, Math.max(0, requestedRows - 1));

    const [
      { data: sejourTransfers, count: sejourCount, error: sejourError },
      { data: projectTransfers, count: projectCount, error: projectError }
    ] = await Promise.all([sejourQuery, projectQuery]);

    if (sejourError || projectError) {
      throw sejourError || projectError;
    }

    const projectLookup = await loadProjectLookup((projectTransfers || []).map((row) => row.project_id));
    const supplierLookup = await loadSupplierLookup([
      ...(sejourTransfers || []).map((row) => row.supplier_id),
      ...(projectTransfers || []).map((row) => row.supplier_id)
    ]);

    const validProjectTransfers = (projectTransfers || []).filter((row) => {
      const projectId = String(row?.project_id || '').trim();
      return Boolean(projectId && projectLookup[projectId]);
    });

    const merged = [
      ...(sejourTransfers || []).map((row) => {
        const mapped = buildTransferRow({ source: 'sejour', transfer: row, sejour: row.sejours });
        mapped.supplier_name = resolveSupplierName({
          rawValue: row?.supplier_id,
          supplierId: row?.supplier_id,
          relationName: row?.suppliers?.name,
          supplierLookup
        });
        return mapped;
      }),
      ...validProjectTransfers.map((row) => {
        const mapped = buildTransferRow({ source: 'project', transfer: row, project: projectLookup[row.project_id] });
        mapped.supplier_name = resolveSupplierName({
          rawValue: row?.supplier_name || row?.supplier_id,
          supplierId: row?.supplier_id,
          relationName: row?.suppliers?.name,
          supplierLookup
        });
        return mapped;
      })
    ];

    const buildHaystack = (row) =>
      [
        row.reference,
        row.project_reference,
        row.customer_name,
        row.company_name,
        row.supplier_name,
        row.departure_point,
        row.arrival_point,
        row.transfer_type,
        row.service_type,
        row.vehicle_type,
        row.transfer_date,
        row.transfer_time,
        row.currency,
        row.notes,
        row.hotel_name,
        row.flight_info?.flight_number,
        row.flight_info?.airline,
        row.flight_info?.departure_airport,
        row.flight_info?.arrival_airport
      ]
        .map((v) => String(v || '').toLowerCase())
        .join(' ');

    const matchesBaseFilters = (row) => {
      const recordDate = String(row.transfer_date || '').slice(0, 10);
      const datePass = (!startDate || recordDate >= startDate) && (!endDate || recordDate <= endDate);
      if (!datePass) return false;

      if (stayStart || stayEnd) {
        const cin = String(row.check_in_date || '').slice(0, 10);
        const cout = String(row.check_out_date || '').slice(0, 10);
        if (cin || cout) {
          const winS = stayStart || '0000-01-01';
          const winE = stayEnd || '9999-12-31';
          const rS = cin || cout || '';
          const rE = cout || cin || rS;
          if (rE < winS || rS > winE) return false;
        }
      }

      const matchesFieldTerms = (terms, values) => {
        if (!Array.isArray(terms) || terms.length === 0) return true;
        const target = values.map((v) => String(v || '').toLowerCase()).join(' ');
        // Aynı bar içinde birden fazla değer OR çalışır (barlar arası AND korunur)
        return terms.some((term) => target.includes(term));
      };

      const notesText = String(row.notes || '').replace(/^Misafirler:\s*/i, '');
      const hasScopedTerms =
        referenceTerms.length ||
        companyTerms.length ||
        customerTerms.length ||
        supplierTerms.length ||
        hotelTerms.length ||
        guestTerms.length ||
        flightTerms.length;

      if (hasScopedTerms) {
        return (
          matchesFieldTerms(referenceTerms, [row.reference, row.project_reference]) &&
          matchesFieldTerms(companyTerms, [row.company_name]) &&
          matchesFieldTerms(customerTerms, [row.customer_name]) &&
          matchesFieldTerms(supplierTerms, [row.supplier_name]) &&
          matchesFieldTerms(hotelTerms, [row.hotel_name]) &&
          matchesFieldTerms(guestTerms, [notesText]) &&
          matchesFieldTerms(flightTerms, [
            row.flight_info?.flight_number,
            row.flight_info?.airline,
            row.flight_info?.departure_airport,
            row.flight_info?.arrival_airport
          ])
        );
      }

      if (searchParts.length === 0) return true;
      const haystack = buildHaystack(row);
      return searchParts.every((term) => haystack.includes(term));
    };

    const matchesTypeFilter = (row) =>
      filter === 'all' ||
      (filter === 'mice' && row.project_type === 'mice') ||
      (filter === 'sejour' && row.project_type === 'sejour') ||
      (filter === 'pending' && row.status === 'pending');

    const baseFiltered = merged.filter(matchesBaseFilters);
    const typeCounts = {
      all: baseFiltered.length,
      mice: baseFiltered.filter((r) => r.project_type === 'mice').length,
      sejour: baseFiltered.filter((r) => r.project_type === 'sejour').length
    };

    const filtered = baseFiltered.filter(matchesTypeFilter);

    filtered.sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      const valueByField = (obj) => {
        switch (sortField) {
          case 'total_amount':
          case 'passenger_count':
            return Number(obj[sortField] || 0);
          case 'transfer_date':
          case 'created_at':
            return new Date(obj[sortField] || 0).getTime();
          case 'flight_info.flight_number':
            return String(obj.flight_info?.flight_number || '');
          default:
            return String(obj[sortField] ?? '');
        }
      };
      const av = valueByField(a);
      const bv = valueByField(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });

    const offset = (page - 1) * pageSize;
    const pageItems = filtered.slice(offset, offset + pageSize);
    const total = Number(filtered.length || 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    res.json({
      success: true,
      data: pageItems,
      total,
      totalPages,
      page,
      pageSize,
      sourceTotals: {
        sejour: sejourCount || 0,
        mice: projectCount || 0
      },
      typeCounts,
      message: 'Transfer verileri başarıyla getirildi'
    });
  } catch (error) {
    console.error('Transfer listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Transfer verileri getirilemedi',
      error: error.message
    });
  }
});

// Tickets route'ları
router.get('/tickets', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = parsePositiveInt(req.query.pageSize, 20);
    const searchRaw = String(req.query.searchTerm || '').trim().toLowerCase();
    const searchParts = searchRaw.split(/\s+/).filter(Boolean);
    const voucherTerms = parseFilterTokens(req.query.voucherTerms);
    const customerTerms = parseFilterTokens(req.query.customerTerms);
    const pnrTerms = parseFilterTokens(req.query.pnrTerms);
    const airlineTerms = parseFilterTokens(req.query.airlineTerms);
    const supplierTerms = parseFilterTokens(req.query.supplierTerms);
    const guestTerms = parseFilterTokens(req.query.guestTerms);
    const filter = String(req.query.filter || 'all').toLowerCase();
    const startDate = String(req.query.startDate || '');
    const endDate = String(req.query.endDate || '');
    const flightStartDate = String(req.query.flightStartDate || '');
    const flightEndDate = String(req.query.flightEndDate || '');
    const sortField = String(req.query.sortField || 'created_at');
    const sortDirection = normalizeSortDirection(req.query.sortDirection);
    const requestedRows = Math.max(page * pageSize, pageSize);

    const sejourFlightsQuery = client
      .from('sejour_flights')
      .select(`
        id,
        sejour_id,
        flight_date,
        airline,
        flight_number,
        departure_time,
        arrival_time,
        departure_airport,
        arrival_airport,
        ticketing_provider,
        ticketing_date,
        pnr,
        total_price,
        currency,
        cost_price,
        cost_currency,
        created_at,
        sejours!inner(
          id,
          voucher_number,
          customer_name,
          check_in_date,
          check_out_date,
          created_at,
          agencies(name),
          sejour_rooms(guest_info)
        )
      `, { count: 'exact' })
      .eq('sejours.status', 'KONFIRME')
      .order('created_at', { ascending: false, nullsFirst: false })
      .range(0, Math.max(0, requestedRows - 1));

    const projectFlightsQuery = client
      .from('project_flight_tickets')
      .select(`
        id,
        project_id,
        biletleme_tarihi,
        tedarikci,
        pnr,
        havayolu,
        guzergah,
        gidis_tarihi,
        gidis_saati,
        gidis_ucus_kodu,
        donus_tarihi,
        donus_saati,
        toplam_maliyet,
        pp_maliyet,
        doviz,
        misafirler,
        created_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false, nullsFirst: false })
      .range(0, Math.max(0, requestedRows - 1));

    const [
      { data: sejourFlights, count: sejourCount, error: sejourError },
      { data: projectFlights, count: projectCount, error: projectError }
    ] = await Promise.all([sejourFlightsQuery, projectFlightsQuery]);

    if (sejourError) {
      console.error('❌ sejourFlightsQuery Error:', sejourError);
      throw sejourError;
    }
    if (projectError) {
      console.error('❌ projectFlightsQuery Error:', projectError);
      throw projectError;
    }

    const projectLookup = await loadProjectLookup((projectFlights || []).map((row) => row.project_id));
    const supplierLookup = await loadSupplierLookup([
      ...(sejourFlights || []).map((row) => row.ticketing_provider),
      ...(projectFlights || []).map((row) => row.tedarikci)
    ]);

    const merged = [
      ...(sejourFlights || []).map((flight) => ({
        id: `sejour:${flight.id}`,
        sejourId: String(flight.sejour_id || ''),
        voucherNumber: String(flight.sejours?.voucher_number || readableRef(flight.sejour_id, 'SEJ') || ''),
        customerName: flight.sejours?.customer_name || '',
        agencyName: flight.sejours?.agencies?.name || '',
        companyName: flight.sejours?.customer_name || '',
        flightDate: flight.flight_date || '',
        ticketingDate: flight.ticketing_date || '',
        ticketingProvider: resolveSupplierName({
          rawValue: flight.ticketing_provider,
          supplierId: flight.ticketing_provider,
          relationName: '',
          supplierLookup,
          fallback: ''
        }),
        pnr: flight.pnr || '',
        airline: flight.airline || '',
        route: `${flight.departure_airport || ''} ${flight.arrival_airport || ''}`.trim(),
        flightNo: flight.flight_number || '',
        departureTime: flight.departure_time || '',
        arrivalTime: flight.arrival_time || '',
        returnDate: '',
        returnDepartureTime: '',
        returnArrivalTime: '',
        price: Number(flight.total_price || 0),
        currency: flight.currency || 'EUR',
        costPrice: Number(flight.cost_price || 0),
        costCurrency: flight.cost_currency || flight.currency || 'EUR',
        status: 'confirmed',
        notes: '',
        created_at: flight.created_at || flight.sejours?.created_at || '',
        checkInDate: flight.sejours?.check_in_date || '',
        checkOutDate: flight.sejours?.check_out_date || '',
        guestNames: Array.isArray(flight.sejours?.sejour_rooms)
          ? flight.sejours.sejour_rooms.map((r) => r.guest_info).filter(Boolean).join(', ')
          : ''
      })),
      ...(projectFlights || []).map((flight) => ({
        id: `project:${flight.id}`,
        sejourId: `project:${flight.project_id}`,
        voucherNumber: String(projectLookup[flight.project_id]?.reference || readableRef(flight.project_id, 'PRJ') || ''),
        customerName: projectLookup[flight.project_id]?.company_name || '',
        agencyName: projectLookup[flight.project_id]?.agencies?.name || '',
        companyName: projectLookup[flight.project_id]?.company_name || '',
        flightDate: flight.gidis_tarihi || '',
        ticketingDate: flight.biletleme_tarihi || '',
        ticketingProvider: resolveSupplierName({
          rawValue: flight.tedarikci,
          supplierId: flight.tedarikci,
          relationName: '',
          supplierLookup,
          fallback: ''
        }),
        pnr: flight.pnr || '',
        airline: flight.havayolu || '',
        route: flight.guzergah || '',
        flightNo: flight.gidis_ucus_kodu || '',
        departureTime: flight.gidis_saati || '',
        arrivalTime: '',
        returnDate: flight.donus_tarihi || '',
        returnDepartureTime: flight.donus_saati || '',
        returnArrivalTime: '',
        price: Number(flight.pp_maliyet || 0),
        currency: flight.doviz || 'EUR',
        costPrice: Number(flight.toplam_maliyet || flight.pp_maliyet || 0),
        costCurrency: flight.doviz || 'EUR',
        status: 'confirmed',
        notes: '',
        created_at: flight.created_at || '',
        checkInDate: projectLookup[flight.project_id]?.start_date || '',
        checkOutDate: projectLookup[flight.project_id]?.end_date || '',
        guestNames: flight.misafirler || ''
      }))
    ];

    const matchesTypeFilter = (row) =>
      filter === 'all' ||
      (filter === 'mice' && row.sejourId && row.sejourId.startsWith('project:')) ||
      (filter === 'sejour' && row.sejourId && !row.sejourId.startsWith('project:'));

    const baseFiltered = merged.filter((row) => {
      const tDate = String(row.ticketingDate || '').slice(0, 10);
      const fDate = String(row.flightDate || '').slice(0, 10);
      const ticketingRangePass = (!startDate || tDate >= startDate) && (!endDate || tDate <= endDate);
      const flightRangePass = (!flightStartDate || fDate >= flightStartDate) && (!flightEndDate || fDate <= flightEndDate);
      if (!ticketingRangePass || !flightRangePass) return false;

      const matchesFieldTerms = (terms, values) => {
        if (!Array.isArray(terms) || terms.length === 0) return true;
        const target = values.map((v) => String(v || '').toLowerCase()).join(' ');
        return terms.some((term) => target.includes(term));
      };

      const hasScopedTerms =
        voucherTerms.length ||
        customerTerms.length ||
        pnrTerms.length ||
        airlineTerms.length ||
        supplierTerms.length ||
        guestTerms.length;

      if (hasScopedTerms) {
        return (
          matchesFieldTerms(voucherTerms, [row.voucherNumber, row.sejourId]) &&
          matchesFieldTerms(customerTerms, [row.customerName, row.agencyName, row.companyName]) &&
          matchesFieldTerms(pnrTerms, [row.pnr]) &&
          matchesFieldTerms(airlineTerms, [row.airline, row.flightNo, row.route]) &&
          matchesFieldTerms(supplierTerms, [row.ticketingProvider]) &&
          matchesFieldTerms(guestTerms, [row.guestNames])
        );
      }

      if (searchParts.length === 0) return true;
      const haystack = [
        row.voucherNumber, row.customerName, row.agencyName, row.airline, row.flightNo, row.pnr,
        row.ticketingProvider, row.route, row.departureTime, row.arrivalTime, row.guestNames
      ].map((v) => String(v || '').toLowerCase()).join(' ');
      return searchParts.every((term) => haystack.includes(term));
    });

    const typeCounts = {
      all: baseFiltered.length,
      mice: baseFiltered.filter((r) => r.sejourId && r.sejourId.startsWith('project:')).length,
      sejour: baseFiltered.filter((r) => r.sejourId && !r.sejourId.startsWith('project:')).length
    };

    const filtered = baseFiltered.filter(matchesTypeFilter);

    filtered.sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      const aVal = sortField.includes('Date') || sortField === 'created_at' ? new Date(av || 0).getTime() : av;
      const bVal = sortField.includes('Date') || sortField === 'created_at' ? new Date(bv || 0).getTime() : bv;
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });

    const { pageItems, total, totalPages } = paginateArray({ items: filtered, page, pageSize });

    res.json({
      success: true,
      data: pageItems,
      total,
      totalPages,
      page,
      pageSize,
      sourceTotals: {
        sejour: sejourCount || 0,
        mice: projectCount || 0
      },
      typeCounts,
      message: 'Bilet verileri başarıyla getirildi'
    });
  } catch (error) {
    console.error('Bilet listesi hatası detayları:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Bilet verileri getirilemedi',
      error: error.message,
      details: error.details
    });
  }
});

// Guides route'ları
router.get('/guides', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = parsePositiveInt(req.query.pageSize, 20);
    const searchRaw = String(req.query.searchTerm || '').trim().toLowerCase();
    const searchParts = searchRaw.split(/\s+/).filter(Boolean);
    const voucherTerms = parseFilterTokens(req.query.voucherTerms);
    const customerTerms = parseFilterTokens(req.query.customerTerms);
    const hotelTerms = parseFilterTokens(req.query.hotelTerms);
    const supplierTerms = parseFilterTokens(req.query.supplierTerms);
    const guideTerms = parseFilterTokens(req.query.guideTerms);
    const filter = String(req.query.filter || 'all').toLowerCase();
    const startDate = String(req.query.startDate || '');
    const endDate = String(req.query.endDate || '');
    const sortField = String(req.query.sortField || 'created_at');
    const sortDirection = normalizeSortDirection(req.query.sortDirection);
    const requestedRows = Math.max(page * pageSize, pageSize);

    const sejourExtrasQuery = client
      .from('sejour_extra_services')
      .select(`
        id,
        sejour_id,
        service_type_id,
        supplier_id,
        service_description,
        price,
        currency,
        cost_price,
        cost_currency,
        created_at,
        service_types(name),
        sejours!inner(
          id,
          voucher_number,
          customer_name,
          check_in_date,
          check_out_date,
          agencies(name),
          hotels(name)
        )
      `, { count: 'exact' })
      .eq('sejours.status', 'KONFIRME')
      .order('created_at', { ascending: false, nullsFirst: false })
      .range(0, Math.max(0, requestedRows - 1));

    const projectHrQuery = client
      .from('project_human_resources')
      .select(`
        id,
        project_id,
        sub_category_id,
        supplier_id,
        description,
        amount,
        currency,
        exchange_rate,
        created_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false, nullsFirst: false })
      .range(0, Math.max(0, requestedRows - 1));

    const [
      { data: sejourExtrasRaw, count: sejourCount, error: sejourError },
      { data: projectHrRaw, count: projectCount, error: projectError }
    ] = await Promise.all([sejourExtrasQuery, projectHrQuery]);
    
    let sejourExtras = sejourExtrasRaw;
    if (sejourError) {
      if (sejourError.code === 'PGRST205' || String(sejourError.message).includes('Could not find the table')) {
        console.warn('⚠️ sejour_extras tablosu bulunamadı, Sejour rehber kayıtları boş olarak dönülecek.');
        sejourExtras = [];
      } else {
        throw sejourError;
      }
    }
    
    let projectHr = projectHrRaw;
    if (projectError) {
      if (projectError.code === 'PGRST205' || String(projectError.message).includes('Could not find the table')) {
        console.warn('⚠️ project_human_resources tablosu bulunamadı, MICE rehber kayıtları boş olarak dönülecek.');
        projectHr = [];
      } else {
        throw projectError;
      }
    }

    const categoryIds = Array.from(new Set((projectHr || []).map((row) => row.sub_category_id).filter(Boolean)));
    let categoryMap = {};
    if (categoryIds.length > 0) {
      const { data: categories } = await client.from('categories').select('id,name').in('id', categoryIds);
      categoryMap = (categories || []).reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {});
    }

    const isGuide = (...values) => {
      return values.some(value => {
        if (!value) return false;
        const text = String(value).toLowerCase().replace(/i̇/g, 'i').replace(/ı/g, 'i');
        return (text.includes('kokart') || text.includes('rehber') || text.includes('guide'));
      });
    };

    const projectLookup = await loadProjectLookup((projectHr || []).map((row) => row.project_id));
    const supplierLookup = await loadSupplierLookup([
      ...(sejourExtras || []).map((row) => row.supplier_id),
      ...(projectHr || []).map((row) => row.supplier_id)
    ]);

    const merged = [
      ...(sejourExtras || [])
        .filter((row) => isGuide(row.service_types?.name, row.service_description))
        .map((row) => ({
          id: `sejour:${row.id}`,
          sejour_id: String(row.sejour_id || ''),
          voucher_number: String(row.sejours?.voucher_number || readableRef(row.sejour_id, 'SEJ') || ''),
          customer_type: 'sejour',
          check_in_date: row.sejours?.check_in_date || '',
          check_out_date: row.sejours?.check_out_date || '',
          guide_name: row.service_description || row.service_types?.name || 'Kokartlı Rehber',
          service_type: row.service_types?.name || 'Kokartlı Rehber',
          customer_name: row.sejours?.agencies?.name || row.sejours?.customer_name || '',
          company_name: row.sejours?.customer_name || '',
          hotel_name: row.sejours?.hotels?.name || '',
          supplier: resolveSupplierName({
            rawValue: row.supplier_id,
            supplierId: row.supplier_id,
            relationName: row.suppliers?.name,
            supplierLookup,
            fallback: ''
          }),
          description: row.service_description || '',
          price: Number(row.price || 0),
          currency: row.currency || 'TRY',
          cost_price: Number(row.cost_price || 0),
          cost_currency: row.cost_currency || row.currency || 'TRY',
          fx: 1,
          totalTRY: Number(row.cost_price || row.price || 0),
          status: 'active',
          notes: '',
          created_at: row.created_at || ''
        })),
      ...(projectHr || [])
        .filter((row) => isGuide(categoryMap[row.sub_category_id], row.description))
        .map((row) => ({
          id: `project:${row.id}`,
          sejour_id: `project:${row.project_id}`,
          voucher_number: String(projectLookup[row.project_id]?.reference || readableRef(row.project_id, 'PRJ') || ''),
          customer_type: 'mice',
          project_type: 'project',
          project_id: String(row.project_id || ''),
          check_in_date: projectLookup[row.project_id]?.start_date || '',
          check_out_date: projectLookup[row.project_id]?.end_date || '',
          guide_name: row.description || 'Kokartlı Rehber',
          service_type: categoryMap[row.sub_category_id] || 'Kokartlı Rehber',
          customer_name: projectLookup[row.project_id]?.agencies?.name || '',
          company_name: projectLookup[row.project_id]?.company_name || '',
          hotel_name: projectLookup[row.project_id]?.hotels?.name || '',
          supplier: resolveSupplierName({
            rawValue: row.supplier_id,
            supplierId: row.supplier_id,
            relationName: row.suppliers?.name,
            supplierLookup,
            fallback: ''
          }),
          description: row.description || '',
          price: Number(row.amount || 0),
          currency: row.currency || 'TRY',
          cost_price: Number(row.amount || 0),
          cost_currency: row.currency || 'TRY',
          fx: Number(row.exchange_rate || 1),
          totalTRY: Number(row.total_tl || Number(row.amount || 0) * Number(row.exchange_rate || 1)),
          status: 'active',
          notes: row.notes || '',
          created_at: row.created_at || ''
        }))
    ];

    const matchesTypeFilter = (row) =>
      filter === 'all' ||
      (filter === 'mice' && row.customer_type === 'mice') ||
      (filter === 'sejour' && row.customer_type === 'sejour');

    const baseFiltered = merged.filter((row) => {
      const d = String(row.check_in_date || '').slice(0, 10);
      const rangePass = (!startDate || d >= startDate) && (!endDate || d <= endDate);
      if (!rangePass) return false;

      const matchesFieldTerms = (terms, values) => {
        if (!Array.isArray(terms) || terms.length === 0) return true;
        const target = values.map((v) => String(v || '').toLowerCase()).join(' ');
        return terms.some((term) => target.includes(term));
      };

      const hasScopedTerms =
        voucherTerms.length ||
        customerTerms.length ||
        hotelTerms.length ||
        supplierTerms.length ||
        guideTerms.length;

      if (hasScopedTerms) {
        return (
          matchesFieldTerms(voucherTerms, [row.voucher_number, row.sejour_id]) &&
          matchesFieldTerms(customerTerms, [row.customer_name, row.company_name]) &&
          matchesFieldTerms(hotelTerms, [row.hotel_name]) &&
          matchesFieldTerms(supplierTerms, [row.supplier]) &&
          matchesFieldTerms(guideTerms, [row.guide_name, row.service_type, row.description])
        );
      }

      if (searchParts.length === 0) return true;
      const haystack = [
        row.guide_name, row.voucher_number, row.service_type, row.customer_type, row.customer_name,
        row.company_name, row.supplier, row.check_in_date, row.check_out_date
      ].map((v) => String(v || '').toLowerCase()).join(' ');
      return searchParts.every((term) => haystack.includes(term));
    });

    const typeCounts = {
      all: baseFiltered.length,
      mice: baseFiltered.filter((r) => r.customer_type === 'mice').length,
      sejour: baseFiltered.filter((r) => r.customer_type === 'sejour').length
    };

    const filtered = baseFiltered.filter(matchesTypeFilter);

    filtered.sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });

    const { pageItems, total, totalPages } = paginateArray({ items: filtered, page, pageSize });

    res.json({
      success: true,
      data: pageItems,
      total,
      totalPages,
      page,
      pageSize,
      sourceTotals: {
        sejour: sejourCount || 0,
        mice: projectCount || 0
      },
      typeCounts,
      message: 'Rehber verileri başarıyla getirildi'
    });
  } catch (error) {
    console.error('Rehber listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Rehber verileri getirilemedi',
      error: error.message
    });
  }
});

// Part-time route'ları
router.get('/part-time', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = parsePositiveInt(req.query.pageSize, 20);
    const searchRaw = String(req.query.searchTerm || '').trim().toLowerCase();
    const searchParts = searchRaw.split(/\s+/).filter(Boolean);
    const voucherTerms = parseFilterTokens(req.query.voucherTerms);
    const customerTerms = parseFilterTokens(req.query.customerTerms);
    const hotelTerms = parseFilterTokens(req.query.hotelTerms);
    const supplierTerms = parseFilterTokens(req.query.supplierTerms);
    const employeeTerms = parseFilterTokens(req.query.employeeTerms);
    const filter = String(req.query.filter || 'all').toLowerCase();
    const startDate = String(req.query.startDate || '');
    const endDate = String(req.query.endDate || '');
    const sortField = String(req.query.sortField || 'created_at');
    const sortDirection = normalizeSortDirection(req.query.sortDirection);
    const requestedRows = Math.max(page * pageSize, pageSize);

    const sejourExtrasQuery = client
      .from('sejour_extra_services')
      .select(`
        id,
        sejour_id,
        service_type_id,
        supplier_id,
        service_description,
        price,
        currency,
        cost_price,
        cost_currency,
        created_at,
        service_types(name),
        sejours!inner(
          id,
          voucher_number,
          customer_name,
          check_in_date,
          check_out_date,
          agencies(name),
          hotels(name)
        )
      `, { count: 'exact' })
      .eq('sejours.status', 'KONFIRME')
      .order('created_at', { ascending: false, nullsFirst: false })
      .range(0, Math.max(0, requestedRows - 1));

    const projectHrQuery = client
      .from('project_human_resources')
      .select(`
        id,
        project_id,
        sub_category_id,
        supplier_id,
        description,
        amount,
        currency,
        exchange_rate,
        created_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false, nullsFirst: false })
      .range(0, Math.max(0, requestedRows - 1));

    const [
      { data: sejourExtrasRaw, count: sejourCount, error: sejourError },
      { data: projectHrRaw, count: projectCount, error: projectError }
    ] = await Promise.all([sejourExtrasQuery, projectHrQuery]);
    
    let sejourExtras = sejourExtrasRaw;
    if (sejourError) {
      if (sejourError.code === 'PGRST205' || String(sejourError.message).includes('Could not find the table')) {
        console.warn('⚠️ sejour_extras tablosu bulunamadı, Sejour part-time kayıtları boş olarak dönülecek.');
        sejourExtras = [];
      } else {
        throw sejourError;
      }
    }
    
    let projectHr = projectHrRaw;
    if (projectError) {
      if (projectError.code === 'PGRST205' || String(projectError.message).includes('Could not find the table')) {
        console.warn('⚠️ project_human_resources tablosu bulunamadı, MICE part-time kayıtları boş olarak dönülecek.');
        projectHr = [];
      } else {
        throw projectError;
      }
    }

    const categoryIds = Array.from(new Set((projectHr || []).map((row) => row.sub_category_id).filter(Boolean)));
    let categoryMap = {};
    if (categoryIds.length > 0) {
      const { data: categories } = await client.from('categories').select('id,name').in('id', categoryIds);
      categoryMap = (categories || []).reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {});
    }

    const isPartTime = (...values) => {
      return values.some(value => {
        if (!value) return false;
        const text = String(value).toLowerCase().replace(/i̇/g, 'i').replace(/ı/g, 'i');
        return (text.includes('part') && text.includes('time')) || text.includes('yari zamanli') || text.includes('insan kaynaklari') || text.includes('part-time');
      });
    };

    const projectLookup = await loadProjectLookup((projectHr || []).map((row) => row.project_id));
    const supplierLookup = await loadSupplierLookup([
      ...(sejourExtras || []).map((row) => row.supplier_id),
      ...(projectHr || []).map((row) => row.supplier_id)
    ]);

    const merged = [
      ...(sejourExtras || [])
        .filter((row) => isPartTime(row.service_types?.name, row.service_description))
        .map((row) => ({
          id: `sejour:${row.id}`,
          sejour_id: String(row.sejour_id || ''),
          voucher_number: String(row.sejours?.voucher_number || readableRef(row.sejour_id, 'SEJ') || ''),
          customer_type: 'sejour',
          check_in_date: row.sejours?.check_in_date || '',
          check_out_date: row.sejours?.check_out_date || '',
          employee_name: row.service_description || row.service_types?.name || 'Part-Time Çalışan',
          service_type: row.service_types?.name || 'Part-Time',
          customer_name: row.sejours?.agencies?.name || row.sejours?.customer_name || '',
          company_name: row.sejours?.customer_name || '',
          hotel_name: row.sejours?.hotels?.name || '',
          supplier: resolveSupplierName({
            rawValue: row.supplier_id,
            supplierId: row.supplier_id,
            relationName: row.suppliers?.name,
            supplierLookup,
            fallback: ''
          }),
          description: row.service_description || '',
          price: Number(row.price || 0),
          currency: row.currency || 'TRY',
          cost_price: Number(row.cost_price || 0),
          cost_currency: row.cost_currency || row.currency || 'TRY',
          fx: 1,
          totalTRY: Number(row.cost_price || row.price || 0),
          hours: '',
          status: 'active',
          notes: '',
          created_at: row.created_at || ''
        })),
      ...(projectHr || [])
        .filter((row) => isPartTime(categoryMap[row.sub_category_id], row.description))
        .map((row) => ({
          id: `project:${row.id}`,
          sejour_id: `project:${row.project_id}`,
          voucher_number: String(projectLookup[row.project_id]?.reference || readableRef(row.project_id, 'PRJ') || ''),
          customer_type: 'mice',
          project_type: 'project',
          project_id: String(row.project_id || ''),
          check_in_date: projectLookup[row.project_id]?.start_date || '',
          check_out_date: projectLookup[row.project_id]?.end_date || '',
          employee_name: row.description || 'Part-Time Çalışan',
          service_type: categoryMap[row.sub_category_id] || 'Part-Time',
          customer_name: projectLookup[row.project_id]?.agencies?.name || '',
          company_name: projectLookup[row.project_id]?.company_name || '',
          hotel_name: projectLookup[row.project_id]?.hotels?.name || '',
          supplier: resolveSupplierName({
            rawValue: row.supplier_id,
            supplierId: row.supplier_id,
            relationName: row.suppliers?.name,
            supplierLookup,
            fallback: ''
          }),
          description: row.description || '',
          price: Number(row.amount || 0),
          currency: row.currency || 'TRY',
          cost_price: Number(row.amount || 0),
          cost_currency: row.currency || 'TRY',
          fx: Number(row.exchange_rate || 1),
          totalTRY: Number(row.total_tl || Number(row.amount || 0) * Number(row.exchange_rate || 1)),
          hours: '',
          status: 'active',
          notes: row.notes || '',
          created_at: row.created_at || ''
        }))
    ];

    const matchesTypeFilter = (row) =>
      filter === 'all' ||
      (filter === 'mice' && row.customer_type === 'mice') ||
      (filter === 'sejour' && row.customer_type === 'sejour');

    const baseFiltered = merged.filter((row) => {
      const d = String(row.check_in_date || '').slice(0, 10);
      const rangePass = (!startDate || d >= startDate) && (!endDate || d <= endDate);
      if (!rangePass) return false;

      const matchesFieldTerms = (terms, values) => {
        if (!Array.isArray(terms) || terms.length === 0) return true;
        const target = values.map((v) => String(v || '').toLowerCase()).join(' ');
        return terms.some((term) => target.includes(term));
      };

      const hasScopedTerms =
        voucherTerms.length ||
        customerTerms.length ||
        hotelTerms.length ||
        supplierTerms.length ||
        employeeTerms.length;

      if (hasScopedTerms) {
        return (
          matchesFieldTerms(voucherTerms, [row.voucher_number, row.sejour_id]) &&
          matchesFieldTerms(customerTerms, [row.customer_name, row.company_name]) &&
          matchesFieldTerms(hotelTerms, [row.hotel_name]) &&
          matchesFieldTerms(supplierTerms, [row.supplier]) &&
          matchesFieldTerms(employeeTerms, [row.employee_name, row.service_type, row.description])
        );
      }

      if (searchParts.length === 0) return true;
      const haystack = [
        row.employee_name, row.voucher_number, row.service_type, row.customer_type, row.customer_name,
        row.company_name, row.supplier, row.hotel_name, row.description, row.check_in_date, row.check_out_date
      ].map((v) => String(v || '').toLowerCase()).join(' ');
      return searchParts.every((term) => haystack.includes(term));
    });

    const typeCounts = {
      all: baseFiltered.length,
      mice: baseFiltered.filter((r) => r.customer_type === 'mice').length,
      sejour: baseFiltered.filter((r) => r.customer_type === 'sejour').length
    };

    const filtered = baseFiltered.filter(matchesTypeFilter);

    filtered.sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });

    const { pageItems, total, totalPages } = paginateArray({ items: filtered, page, pageSize });

    res.json({
      success: true,
      data: pageItems,
      total,
      totalPages,
      page,
      pageSize,
      sourceTotals: {
        sejour: sejourCount || 0,
        mice: projectCount || 0
      },
      typeCounts,
      message: 'Part-time verileri başarıyla getirildi'
    });
  } catch (error) {
    console.error('Part-time listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Part-time verileri getirilemedi',
      error: error.message
    });
  }
});

module.exports = router;
