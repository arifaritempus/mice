const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase, supabaseAdmin } = require('../config/database');
const { reportService } = require('../services/reportService');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const db = supabaseAdmin || supabase;

const toNum = (value) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
};

const applyDateFilter = (rows, field, startDate, endDate) =>
  rows.filter((row) => {
    if (!startDate && !endDate) return true;
    const raw = row[field];
    if (!raw) return false;
    const date = String(raw).slice(0, 10);
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  });

const pickFirstDate = (...values) => {
  for (const value of values) {
    if (!value) continue;
    const date = String(value).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  }
  return null;
};

const firstNonEmpty = (...values) => {
  for (const v of values) {
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s !== '') return v;
  }
  return null;
};

/** Satış / alış kalemi TRY tutarı (total_try yoksa total_price * kur) */
const lineTryFromSalesOrPurchaseItem = (r) => {
  const direct = firstNonEmpty(r.total_try);
  if (direct !== null && direct !== undefined && String(direct).trim() !== '') return toNum(direct);
  return toNum(r.total_price) * toNum(firstNonEmpty(r.fx, 1));
};

/** Teklif durumu etiketlerini rapor ekranında tutarlı göstermek için */
const normalizeTeklifDurumu = (value) => {
  const normalized = String(value || '').toUpperCase();
  if (normalized.includes('KONF') || normalized.includes('COMPLETE')) return 'KONFIRME';
  if (normalized.includes('IPT') || normalized.includes('İPT') || normalized.includes('CANCEL')) return 'IPTAL';
  if (normalized.includes('PLAN')) return 'PLANLANDI';
  if (normalized.includes('AKTIF') || normalized.includes('ACTIVE')) return 'AKTIF';
  return String(value || '-');
};

const normalizeOpsiyonDurumuKey = (value) =>
  String(value || '')
    .toLocaleUpperCase('tr-TR')
    .replace(/\s+/g, ' ')
    .trim();

const mapSejourKarZararFromViewRow = (r) => ({
  voucher_no: firstNonEmpty(r.voucher_no, r.voucher_number, r.voucher) || '-',
  giris_tarihi: pickFirstDate(r.giris_tarihi, r.check_in_date, r.giris, r.cin_tarihi),
  cikis_tarihi: pickFirstDate(r.cikis_tarihi, r.check_out_date, r.cikis, r.cout_tarihi),
  acente: firstNonEmpty(r.acente, r.agency_name, r.acente_adi) || '-',
  otel: firstNonEmpty(r.otel, r.hotel_name, r.otel_adi, r.hotel) || '-',
  durum: firstNonEmpty(r.durum, r.status) || 'BEKLEMEDE',
  satis_tl: toNum(firstNonEmpty(r.satis_tl, r.satis_try, r.satis)),
  maliyet_tl: toNum(firstNonEmpty(r.maliyet_tl, r.maliyet_try, r.maliyet)),
  kar_zarar_tl: toNum(firstNonEmpty(r.kar_zarar_tl, r.kar_zarar_try, r.kar_zarar)),
  kar_marj_yuzde: Number(toNum(firstNonEmpty(r.kar_marj_yuzde, r.kar_marj)).toFixed(2))
});

const parseJsonObject = (value) => {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const o = JSON.parse(value);
      return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
    } catch {
      return {};
    }
  }
  return {};
};

const isMissingSejourReportViewError = (err) => {
  const msg = String(err?.message || err || '');
  return (
    msg.includes('vw_rp_sejour_kar_zarar') &&
    (msg.includes('schema cache') || msg.includes('Could not find') || String(err?.code || '') === 'PGRST205')
  );
};

const isMissingProjeSatisMaliyetViewError = (err) => {
  const msg = String(err?.message || err || '');
  return (
    msg.includes('vw_rp_proje_satis_maliyet') &&
    (msg.includes('schema cache') || msg.includes('Could not find') || String(err?.code || '') === 'PGRST205')
  );
};

/** View yokken: proje + satış/alış kalemlerinden TRY toplamları (vw ile aynı mantık) */
const fetchProjeSatisMaliyetFromBaseTables = async () => {
  const { data: projects, error: e0 } = await db
    .from('projects')
    .select('id,reference,title,company_name,agency_id,hotel_id,start_date,end_date,status')
    .limit(20000);
  if (e0) throw e0;
  const list = projects || [];
  const projectIds = list.map((p) => p.id).filter(Boolean);
  if (!projectIds.length) return [];

  const sumByProject = async (table) => {
    const { data: rows, error } = await db
      .from(table)
      .select('project_id,total_try,total_price,fx')
      .in('project_id', projectIds);
    if (error) throw error;
    const m = new Map();
    for (const r of rows || []) {
      const pid = r.project_id;
      if (!pid) continue;
      m.set(pid, (m.get(pid) || 0) + lineTryFromSalesOrPurchaseItem(r));
    }
    return m;
  };

  const [salesMap, purchMap] = await Promise.all([
    sumByProject('project_sales_items'),
    sumByProject('project_purchase_items')
  ]);

  const agencyIds = [...new Set(list.map((p) => p.agency_id).filter(Boolean))];
  const agenciesMap = new Map();
  if (agencyIds.length) {
    const { data: agencies, error: ea } = await db.from('agencies').select('id,name').in('id', agencyIds);
    if (ea) throw ea;
    (agencies || []).forEach((a) => agenciesMap.set(a.id, a.name));
  }

  const hotelIds = [...new Set(list.map((p) => p.hotel_id).filter(Boolean))];
  const hotelsMap = new Map();
  if (hotelIds.length) {
    const { data: hotels, error: eh } = await db.from('hotels').select('id,name').in('id', hotelIds);
    if (eh) throw eh;
    (hotels || []).forEach((h) => hotelsMap.set(h.id, h.name));
  }

  return list.map((p) => {
    const satis = salesMap.get(p.id) || 0;
    const mal = purchMap.get(p.id) || 0;
    const kar = satis - mal;
    const marj = satis > 0 ? Number(((kar / satis) * 100).toFixed(2)) : 0;
    const otelName = p.hotel_id ? hotelsMap.get(p.hotel_id) : null;
    return mapProjeSatisMaliyetFromViewRow({
      project_id: p.id,
      referans_no: firstNonEmpty(p.reference, p.title, p.id) || '-',
      organizasyon_tarihi: p.start_date,
      cikis_tarihi: p.end_date,
      firma: p.company_name || '-',
      acente: agenciesMap.get(p.agency_id) || '-',
      otel: otelName || '-',
      status: p.status,
      satis_tl: satis,
      maliyet_tl: mal,
      kar_zarar_tl: kar,
      kar_marj_yuzde: marj
    });
  });
};

/**
 * Otel bazlı kar/zarar: proje künyesindeki tek otel değil; satış/alış kalemlerindeki
 * hotel_id üzerinden TRY toplamları ve otel başına benzersiz proje sayısı.
 */
const fetchOtelBazliKarZararFromLineItems = async (startDate, endDate) => {
  const { data: projects, error: e0 } = await db.from('projects').select('id,start_date').limit(20000);
  if (e0) throw e0;
  const inDateRange = (row) => {
    if (!startDate && !endDate) return true;
    const raw = row.start_date;
    if (!raw) return false;
    const date = String(raw).slice(0, 10);
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  };
  const projectIds = (projects || []).filter(inDateRange).map((p) => p.id).filter(Boolean);
  if (!projectIds.length) return [];

  const [{ data: salesRows, error: es }, { data: purchRows, error: ep }] = await Promise.all([
    db
      .from('project_sales_items')
      .select('project_id,hotel_id,total_try,total_price,fx')
      .in('project_id', projectIds),
    db
      .from('project_purchase_items')
      .select('project_id,hotel_id,total_try,total_price,fx')
      .in('project_id', projectIds)
  ]);
  if (es) throw es;
  if (ep) throw ep;

  const bucketKey = (hotelId) => (hotelId ? String(hotelId) : '__none__');
  const grouped = new Map();

  const touch = (hotelId, projectId) => {
    const k = bucketKey(hotelId);
    if (!grouped.has(k)) {
      grouped.set(k, {
        _pids: new Set(),
        satis_tl: 0,
        maliyet_tl: 0,
        _hotelId: hotelId || null
      });
    }
    const row = grouped.get(k);
    if (projectId) row._pids.add(String(projectId));
    return row;
  };

  for (const r of salesRows || []) {
    const row = touch(r.hotel_id, r.project_id);
    row.satis_tl += lineTryFromSalesOrPurchaseItem(r);
  }
  for (const r of purchRows || []) {
    const row = touch(r.hotel_id, r.project_id);
    row.maliyet_tl += lineTryFromSalesOrPurchaseItem(r);
  }

  const uuidKeys = [...grouped.keys()].filter((k) => k !== '__none__');
  const hotelsMap = new Map();
  if (uuidKeys.length) {
    const { data: hotels, error: eh } = await db.from('hotels').select('id,name').in('id', uuidKeys);
    if (eh) throw eh;
    (hotels || []).forEach((h) => hotelsMap.set(String(h.id), h.name));
  }

  return [...grouped.values()].map((g) => {
    const otelName =
      g._hotelId != null
        ? hotelsMap.get(String(g._hotelId)) || String(g._hotelId)
        : 'Otel atanmamış';
    const satis = g.satis_tl;
    const mal = g.maliyet_tl;
    const kar = satis - mal;
    return {
      otel: otelName,
      proje_sayisi: g._pids.size,
      satis_tl: satis,
      maliyet_tl: mal,
      kar_zarar_tl: kar,
      kar_marj_yuzde: satis > 0 ? Number(((kar / satis) * 100).toFixed(2)) : 0
    };
  });
};

/** View yokken: sejours + agencies + hotels (view ile aynı TRY mantığı) */
const fetchSejourKarZararRowsFromBaseTables = async () => {
  const { data: sejours, error: e1 } = await db
    .from('sejours')
    .select('id,voucher_number,check_in_date,check_out_date,agency_id,hotel_id,status,totals,costs,profits')
    .limit(20000);
  if (e1) throw e1;
  const list = sejours || [];
  const agencyIds = [...new Set(list.map((s) => s.agency_id).filter(Boolean))];
  const hotelIds = [...new Set(list.map((s) => s.hotel_id).filter(Boolean))];

  const agenciesMap = new Map();
  if (agencyIds.length) {
    const { data: agencies, error: e2 } = await db.from('agencies').select('id,name').in('id', agencyIds);
    if (e2) throw e2;
    (agencies || []).forEach((a) => agenciesMap.set(a.id, a.name));
  }
  const hotelsMap = new Map();
  if (hotelIds.length) {
    const { data: hotels, error: e3 } = await db.from('hotels').select('id,name').in('id', hotelIds);
    if (e3) throw e3;
    (hotels || []).forEach((h) => hotelsMap.set(h.id, h.name));
  }

  const sejourIdsNeedingHotel = list.filter((s) => !s.hotel_id).map((s) => s.id);
  const roomHotelBySejour = new Map();
  if (sejourIdsNeedingHotel.length) {
    const { data: rooms, error: e4 } = await db
      .from('sejour_rooms')
      .select('sejour_id,hotel_id,created_at')
      .in('sejour_id', sejourIdsNeedingHotel)
      .order('created_at', { ascending: true });
    if (!e4 && rooms?.length) {
      const extraHotelIds = [...new Set(rooms.map((r) => r.hotel_id).filter(Boolean))];
      const missing = extraHotelIds.filter((id) => !hotelsMap.has(id));
      if (missing.length) {
        const { data: hotels2 } = await db.from('hotels').select('id,name').in('id', missing);
        (hotels2 || []).forEach((h) => hotelsMap.set(h.id, h.name));
      }
      const sortedRooms = [...rooms].sort((a, b) => {
        const sa = String(a.sejour_id || '');
        const sb = String(b.sejour_id || '');
        if (sa !== sb) return sa.localeCompare(sb);
        return String(a.created_at || '').localeCompare(String(b.created_at || ''));
      });
      sortedRooms.forEach((room) => {
        if (!room.sejour_id || roomHotelBySejour.has(room.sejour_id)) return;
        const name = room.hotel_id ? hotelsMap.get(room.hotel_id) : null;
        if (name) roomHotelBySejour.set(room.sejour_id, name);
      });
    }
  }

  return list.map((s) => {
    const totals = parseJsonObject(s.totals);
    const costs = parseJsonObject(s.costs);
    const profits = parseJsonObject(s.profits);
    const satisTl = toNum(firstNonEmpty(totals.TRY, totals.try));
    const maliyetTl = toNum(firstNonEmpty(costs.TRY, costs.try));
    const profitRaw = firstNonEmpty(profits.TRY, profits.try);
    const karZararTl =
      profitRaw !== null && profitRaw !== undefined && String(profitRaw).trim() !== ''
        ? toNum(profitRaw)
        : satisTl - maliyetTl;
    const karMarjYuzde = satisTl > 0 ? Number(((karZararTl / satisTl) * 100).toFixed(2)) : 0;
    let otelName = s.hotel_id ? hotelsMap.get(s.hotel_id) : null;
    if (!otelName) otelName = roomHotelBySejour.get(s.id) || null;

    return mapSejourKarZararFromViewRow({
      voucher_number: s.voucher_number,
      check_in_date: s.check_in_date,
      check_out_date: s.check_out_date,
      agency_name: agenciesMap.get(s.agency_id),
      hotel_name: otelName,
      status: s.status,
      satis_tl: satisTl,
      maliyet_tl: maliyetTl,
      kar_zarar_tl: karZararTl,
      kar_marj_yuzde: karMarjYuzde
    });
  });
};

const computeOpsiyonKalanGun = (opsiyonTarihiRaw) => {
  const optionDate = opsiyonTarihiRaw ? String(opsiyonTarihiRaw).slice(0, 10) : null;
  const target = optionDate ? new Date(optionDate) : null;
  if (!target || Number.isNaN(target.getTime())) return null;
  const today = new Date();
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const sortRows = (rows, sortKey, sortDirection) => {
  if (!sortKey) return rows;
  const dir = sortDirection === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const an = Number(av);
    const bn = Number(bv);
    if (Number.isFinite(an) && Number.isFinite(bn) && (String(av ?? '').trim() !== '' || String(bv ?? '').trim() !== '')) {
      return (an - bn) * dir;
    }
    const as = String(av ?? '');
    const bs = String(bv ?? '');
    if (/^\d{4}-\d{2}-\d{2}/.test(as) && /^\d{4}-\d{2}-\d{2}/.test(bs)) {
      return as.localeCompare(bs) * dir;
    }
    return as.localeCompare(bs, 'tr', { sensitivity: 'base' }) * dir;
  });
};

const paginateRows = (rows, page, pageSize) => {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize;
  return {
    data: rows.slice(from, to),
    total,
    totalPages,
    page: currentPage,
    pageSize
  };
};

const mapOtelDetayProjeMaliyetRow = (r, hasMainCategory) => ({
  proje_referans: r.proje_referans || r.referans_no || r.proje_referansi || '-',
  organizasyon_tarihi: pickFirstDate(
    r.organizasyon_tarihi,
    r.organizasyon_tarih,
    r.baslangic_tarihi,
    r.baslangic_tarih,
    r.proje_baslangic_tarihi,
    r.giris_tarihi,
    r.tarih,
    r.created_at
  ),
  cikis_tarihi: pickFirstDate(
    r.cikis_tarihi,
    r.cikis_tarih,
    r.bitis_tarihi,
    r.bitis_tarih,
    r.proje_bitis_tarihi,
    r.checkout_tarihi
  ),
  firma_adi: r.firma_adi || r.firma || '-',
  acente: r.acente || '-',
  otel:
    firstNonEmpty(
      r.otel,
      r.otel_adi,
      r.otel_name,
      r.hotel_name,
      r.hotel,
      r.kalem_otel,
      r.oteli
    ) || '-',
  alt_kategori: r.alt_kategori || '-',
  adet: toNum(r.adet),
  sefer: toNum(r.sefer),
  birim_satis: toNum(r.birim_satis),
  birim_maliyet: toNum(r.birim_maliyet),
  para_birimi: r.para_birimi || '-',
  _main_category: hasMainCategory ? r.main_category : undefined
});

const fetchOtelDetayProjeMaliyetRows = async () => {
  const { data, error } = await db.from('vw_rp_otel_detay_proje_maliyet').select('*');
  if (error) throw error;
  const hasMainCategoryKey = (data || []).some((r) => Object.prototype.hasOwnProperty.call(r, 'main_category'));
  /** Kapsamı view tanımı belirler (UUID kategori + kök KONAKLAMA/OTEL EKSTRA); burada tekrar CAT_001 süzme yapılmaz */
  return (data || [])
    .map((r) => mapOtelDetayProjeMaliyetRow(r, hasMainCategoryKey))
    .map(({ _main_category, ...rest }) => rest);
};

/** Görünüm kolonları zamanla değişebilir; select('*') + normalize = önceki davranışa en yakın dayanıklılık */
const mapProjeSatisMaliyetFromViewRow = (r) => ({
  project_id: firstNonEmpty(r.project_id, r.id) || null,
  referans_no: firstNonEmpty(r.referans_no, r.referans, r.proje_referans, r.reference) || '-',
  organizasyon_tarihi: pickFirstDate(
    r.organizasyon_tarihi,
    r.organizasyon_tarih,
    r.baslangic_tarihi,
    r.baslangic_tarih,
    r.proje_baslangic_tarihi,
    r.tarih,
    r.created_at
  ),
  cikis_tarihi: pickFirstDate(
    r.cikis_tarihi,
    r.cikis_tarih,
    r.bitis_tarihi,
    r.bitis_tarih,
    r.proje_bitis_tarihi,
    r.checkout_tarihi
  ),
  firma: firstNonEmpty(r.firma, r.firma_adi, r.company_name) || '-',
  acente: firstNonEmpty(r.acente, r.agency_name, r.acente_adi) || '-',
  otel:
    firstNonEmpty(
      r.otel,
      r.otel_adi,
      r.otel_name,
      r.hotel_name,
      r.hotel,
      r.kalem_otel,
      r.oteli
    ) || '-',
  durum: firstNonEmpty(r.durum, r.status, r.proje_durumu) || 'BEKLEMEDE',
  satis_tl: toNum(firstNonEmpty(r.satis_tl, r.satis_try, r.satis)),
  maliyet_tl: toNum(firstNonEmpty(r.maliyet_tl, r.maliyet_try, r.maliyet)),
  kar_zarar_tl: toNum(firstNonEmpty(r.kar_zarar_tl, r.kar_zarar_try, r.kar_zarar)),
  kar_marj_yuzde: Number(toNum(firstNonEmpty(r.kar_marj_yuzde, r.kar_marj)).toFixed(2))
});

const fetchProjeSatisMaliyetProjectRows = async () => {
  const { data, error } = await db.from('vw_rp_proje_satis_maliyet').select('*');
  if (error && isMissingProjeSatisMaliyetViewError(error)) {
    return fetchProjeSatisMaliyetFromBaseTables();
  }
  if (error) throw error;
  return (data || []).map(mapProjeSatisMaliyetFromViewRow);
};

// Rapor verisi: server-side pagination/filter/sort
router.get('/data', async (req, res) => {
  try {
    const reportId = String(req.query.reportId || '');
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.max(1, Number(req.query.pageSize || 50));
    const startDate = String(req.query.startDate || '');
    const endDate = String(req.query.endDate || '');
    const searchTerm = String(req.query.searchTerm || '').trim().toLocaleLowerCase('tr');
    const otelFilter = String(req.query.otelFilter || '').trim().toLocaleLowerCase('tr');
    const opsiyonDurumu = String(req.query.opsiyonDurumu || 'tum');
    const sortKey = String(req.query.sortKey || '');
    const sortDirection = String(req.query.sortDirection || 'asc') === 'desc' ? 'desc' : 'asc';

    if (!reportId) {
      return res.status(400).json({ success: false, message: 'reportId zorunludur' });
    }

    let rows = [];

    if (reportId === 'opsiyon_takip') {
      const { data, error } = await db.from('vw_rp_opsiyon_takip').select('*');
      if (error) throw error;
      rows = (data || []).map((r) => {
        const opsiyonTarihi = r.opsiyon_tarihi ? String(r.opsiyon_tarihi).slice(0, 10) : null;
        const tutarRaw = firstNonEmpty(r.opsiyon_tutari, r.toplam_tutar, r.teklif_tutari, r.tutar);
        const dovizRaw = firstNonEmpty(r.doviz_birimi, r.para_birimi, r.currency, r.doviz);
        return {
          teklif_no: firstNonEmpty(r.teklif_no, r.quote_number, r.quote_no) || '-',
          cin_tarihi: pickFirstDate(r.cin_tarihi, r.check_in_date, r.giris_tarihi),
          cout_tarihi: pickFirstDate(r.cout_tarihi, r.check_out_date, r.cikis_tarihi),
          firma_adi: firstNonEmpty(r.firma_adi, r.firma, r.company_name) || '-',
          acente: firstNonEmpty(r.acente, r.agency_name) || '-',
          otel: firstNonEmpty(r.otel, r.otel_adi, r.hotel_name) || '-',
          opsiyon_tarihi: opsiyonTarihi,
          opsiyon_durumu: r.opsiyon_durumu || 'BEKLEMEDE',
          otel_durumu: firstNonEmpty(r.otel_durumu, r.hotel_status, r.otel_status) || '-',
          kalan_gun: computeOpsiyonKalanGun(r.opsiyon_tarihi),
          toplam_tutar: toNum(tutarRaw),
          doviz_birimi: dovizRaw ? String(dovizRaw) : '-'
        };
      });
      rows = applyDateFilter(rows, 'opsiyon_tarihi', startDate, endDate);
      if (opsiyonDurumu !== 'tum') {
        const want = normalizeOpsiyonDurumuKey(opsiyonDurumu);
        rows = rows.filter((r) => normalizeOpsiyonDurumuKey(r.opsiyon_durumu) === want);
      }
    } else if (reportId === 'otel_detay_talep') {
      const { data, error } = await db
        .from('mice_requests')
        .select(`
          id,
          created_at,
          reference,
          request_date,
          date_type,
          date_details,
          company_name,
          nights,
          agencies(name),
          mice_request_hotels!inner(
            id,
            status,
            price,
            currency,
            option_date,
            response_details,
            hotels(name)
          )
        `);
      if (error) throw error;
      const { data: catData } = await db.from('categories').select('id, name');
      const catMap = {};
      (catData || []).forEach(c => { catMap[c.id] = c.name; });

      const flatRows = [];
      for (const req of (data || [])) {
        for (const rh of (req.mice_request_hotels || [])) {
          const prices = rh.response_details?.prices || [];
          if (prices.length > 0) {
            for (const p of prices) {
              const yanit = [];
              if (rh.response_details?.notes) yanit.push(rh.response_details.notes);
              if (p.description) yanit.push(p.description);

              flatRows.push({
                talep_no: req.reference || '-',
                talep_tarihi: req.request_date || null,
                esnek_tarih: req.date_type === 'FLEXIBLE' && req.date_details ? (req.date_details.text || '-') : '-',
                cin_tarihi: req.date_type === 'EXACT' && req.date_details ? (req.date_details.check_in || null) : null,
                cout_tarihi: req.date_type === 'EXACT' && req.date_details ? (req.date_details.check_out || null) : null,
                gece_sayisi: toNum(req.nights),
                firma_adi: req.company_name || '-',
                acente: req.agencies?.name || '-',
                otel: rh.hotels?.name || '-',
                talep_durumu: rh.status || '-',
                alt_kategori: catMap[p.sub_category] || p.sub_category || '-',
                fiyat: toNum(p.unit_price || p.total),
                para_birimi: p.currency || rh.currency || '-'
              });
            }
          } else {
            flatRows.push({
              talep_no: req.reference || '-',
              talep_tarihi: req.request_date || null,
              esnek_tarih: req.date_type === 'FLEXIBLE' && req.date_details ? (req.date_details.text || '-') : '-',
              cin_tarihi: req.date_type === 'EXACT' && req.date_details ? (req.date_details.check_in || null) : null,
              cout_tarihi: req.date_type === 'EXACT' && req.date_details ? (req.date_details.check_out || null) : null,
              gece_sayisi: toNum(req.nights),
              firma_adi: req.company_name || '-',
              acente: req.agencies?.name || '-',
              otel: rh.hotels?.name || '-',
              talep_durumu: rh.status || '-',
              alt_kategori: '-',
              fiyat: toNum(rh.price),
              para_birimi: rh.currency || '-'
            });
          }
        }
      }
      rows = applyDateFilter(flatRows, 'talep_tarihi', startDate, endDate);
    } else if (reportId === 'otel_detay_teklif') {
      const { data, error } = await db.from('vw_rp_otel_detay_teklif').select('*');
      if (error) throw error;
      rows = (data || []).map((r) => ({
        teklif_no: r.teklif_no || '-',
        cin_tarihi: pickFirstDate(r.cin_tarihi, r.check_in_date, r.giris_tarihi) || null,
        cout_tarihi: pickFirstDate(r.cout_tarihi, r.check_out_date, r.cikis_tarihi) || null,
        firma_adi: firstNonEmpty(r.firma_adi, r.firma) || '-',
        acente: firstNonEmpty(r.acente, r.agency_name) || '-',
        otel: firstNonEmpty(r.otel, r.otel_adi, r.hotel_name) || '-',
        alt_kategori: r.alt_kategori || '-',
        adet: toNum(r.adet),
        sefer: toNum(r.sefer),
        birim_satis: toNum(r.birim_satis),
        para_birimi: firstNonEmpty(r.para_birimi, r.doviz_birimi, r.currency) || '-',
        teklif_durumu: normalizeTeklifDurumu(r.teklif_durumu || r.durum || r.status || '-')
      }));
      rows = applyDateFilter(rows, 'cin_tarihi', startDate, endDate);
    } else if (reportId === 'otel_detay_proje_maliyet') {
      rows = applyDateFilter(await fetchOtelDetayProjeMaliyetRows(), 'organizasyon_tarihi', startDate, endDate);
    } else if (
      ['acente_kar_zarar', 'otel_kar_zarar', 'kar_zarar_detay', 'yillik_kar_zarar_tl'].includes(reportId)
    ) {
      if (reportId === 'otel_kar_zarar') {
        rows = await fetchOtelBazliKarZararFromLineItems(startDate, endDate);
      } else {
      const projectRows = applyDateFilter(
        await fetchProjeSatisMaliyetProjectRows(),
        'organizasyon_tarihi',
        startDate,
        endDate
      );

      if (reportId === 'kar_zarar_detay') {
        rows = projectRows;
      } else if (reportId === 'acente_kar_zarar') {
        const grouped = new Map();
        projectRows.forEach((r) => {
          const key = String(r.acente || '-');
          if (!grouped.has(key)) {
            grouped.set(key, {
              acente: key,
              _pids: new Set(),
              satis_tl: 0,
              maliyet_tl: 0,
              kar_zarar_tl: 0,
              kar_marj_yuzde: 0
            });
          }
          const row = grouped.get(key);
          const pid = r.project_id != null && String(r.project_id).trim() !== '' ? String(r.project_id) : String(r.referans_no || '');
          if (pid) row._pids.add(pid);
          row.satis_tl += toNum(r.satis_tl);
          row.maliyet_tl += toNum(r.maliyet_tl);
          row.kar_zarar_tl += toNum(r.kar_zarar_tl);
        });
        rows = [...grouped.values()].map(({ _pids, ...rest }) => ({
          acente: rest.acente,
          proje_sayisi: _pids.size,
          satis_tl: rest.satis_tl,
          maliyet_tl: rest.maliyet_tl,
          kar_zarar_tl: rest.kar_zarar_tl,
          kar_marj_yuzde:
            toNum(rest.satis_tl) > 0
              ? Number(((toNum(rest.kar_zarar_tl) / toNum(rest.satis_tl)) * 100).toFixed(2))
              : 0
        }));
      } else {
        const monthColumns = ['ocak', 'subat', 'mart', 'nisan', 'mayis', 'haziran', 'temmuz', 'agustos', 'eylul', 'ekim', 'kasim', 'aralik'];
        const grouped = new Map();
        projectRows.forEach((r) => {
          const year = String(r.organizasyon_tarihi || '').slice(0, 4);
          if (!year) return;
          if (!grouped.has(year)) {
            const init = { yil: year, toplam_tl: 0 };
            monthColumns.forEach((m) => { init[m] = 0; });
            grouped.set(year, init);
          }
          const row = grouped.get(year);
          const month = Number(String(r.organizasyon_tarihi || '').slice(5, 7));
          const monthKey = monthColumns[Math.max(0, month - 1)];
          row[monthKey] += toNum(r.kar_zarar_tl);
          row.toplam_tl += toNum(r.kar_zarar_tl);
        });
        rows = [...grouped.values()];
      }
      }
    } else if (['sejour_kar_zarar', 'sejour_acente', 'sejour_otel'].includes(reportId)) {
      const viewRes = await db.from('vw_rp_sejour_kar_zarar').select('*');
      let mappedSejourRows;
      if (viewRes.error && isMissingSejourReportViewError(viewRes.error)) {
        mappedSejourRows = await fetchSejourKarZararRowsFromBaseTables();
      } else if (viewRes.error) {
        throw viewRes.error;
      } else {
        mappedSejourRows = (viewRes.data || []).map((r) => mapSejourKarZararFromViewRow(r));
      }
      const sejourRows = applyDateFilter(mappedSejourRows, 'giris_tarihi', startDate, endDate);
      if (reportId === 'sejour_kar_zarar') {
        rows = sejourRows;
      } else if (reportId === 'sejour_acente') {
        const grouped = new Map();
        sejourRows.forEach((r) => {
          const key = String(r.acente || '-');
          if (!grouped.has(key)) grouped.set(key, { acente: key, voucher_sayisi: 0, satis_tl: 0, maliyet_tl: 0, kar_zarar_tl: 0, kar_marj_yuzde: 0 });
          const row = grouped.get(key);
          row.voucher_sayisi += 1;
          row.satis_tl += toNum(r.satis_tl);
          row.maliyet_tl += toNum(r.maliyet_tl);
          row.kar_zarar_tl += toNum(r.kar_zarar_tl);
        });
        rows = [...grouped.values()].map((r) => ({
          ...r,
          kar_marj_yuzde: toNum(r.satis_tl) > 0 ? Number(((toNum(r.kar_zarar_tl) / toNum(r.satis_tl)) * 100).toFixed(2)) : 0
        }));
      } else {
        const grouped = new Map();
        sejourRows.forEach((r) => {
          const key = String(r.otel || '-');
          if (!grouped.has(key)) grouped.set(key, { otel: key, voucher_sayisi: 0, satis_tl: 0, maliyet_tl: 0, kar_zarar_tl: 0, kar_marj_yuzde: 0 });
          const row = grouped.get(key);
          row.voucher_sayisi += 1;
          row.satis_tl += toNum(r.satis_tl);
          row.maliyet_tl += toNum(r.maliyet_tl);
          row.kar_zarar_tl += toNum(r.kar_zarar_tl);
        });
        rows = [...grouped.values()].map((r) => ({
          ...r,
          kar_marj_yuzde: toNum(r.satis_tl) > 0 ? Number(((toNum(r.kar_zarar_tl) / toNum(r.satis_tl)) * 100).toFixed(2)) : 0
        }));
      }
    } else {
      return res.status(400).json({ success: false, message: 'Desteklenmeyen reportId' });
    }

    if (searchTerm) {
      rows = rows.filter((r) =>
        Object.values(r).some((v) => String(v ?? '').toLocaleLowerCase('tr').includes(searchTerm))
      );
    }
    if (
      otelFilter &&
      (reportId === 'otel_detay_teklif' ||
        reportId === 'otel_detay_talep' ||
        reportId === 'otel_detay_proje_maliyet' ||
        reportId === 'otel_kar_zarar' ||
        reportId === 'otel_marj')
    ) {
      rows = rows.filter((r) => String(r.otel || '').toLocaleLowerCase('tr').includes(otelFilter));
    }

    const effectiveSortKey =
      sortKey ||
      (reportId === 'acente_kar_zarar' || reportId === 'otel_kar_zarar' ? 'kar_zarar_tl' : '');
    const effectiveSortDirection = sortKey
      ? sortDirection
      : reportId === 'acente_kar_zarar' || reportId === 'otel_kar_zarar'
        ? 'desc'
        : sortDirection;

    rows = sortRows(rows, effectiveSortKey, effectiveSortDirection);
    const paginated = paginateRows(rows, page, pageSize);
    return res.json({ success: true, ...paginated });
  } catch (error) {
    console.error('GET /api/reports/data error:', error);
    const detail = error?.message || String(error);
    return res.status(500).json({
      success: false,
      message: detail ? `Rapor verisi alınamadı: ${detail}` : 'Rapor verisi alınamadı',
      error: detail
    });
  }
});

// Tüm raporları getir
router.get('/', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { type, status, start_date, end_date } = req.query;
    let query = supabase
      .from('report_schedules')
      .select('*')
      .eq('company_id', company_id);
    if (type) query = query.eq('report_type', type);
    if (status) query = query.eq('status', status);
    if (start_date) query = query.gte('created_at', start_date);
    if (end_date) query = query.lte('created_at', end_date);
    const { data: reports, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ message: 'Raporlar getirilemedi' });
    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Rapor oluştur
router.post('/', [
  body('report_type').isIn(['events', 'projects', 'financial', 'customers', 'tasks', 'budget']),
  body('format').isIn(['excel', 'pdf']),
  body('date_range').isIn(['today', 'week', 'month', 'quarter', 'year', 'custom']),
  body('start_date').optional().isISO8601(),
  body('end_date').optional().isISO8601(),
  body('filters').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { company_id } = req.user;
    const reportData = req.body;
    
    let reportContent;
    
    // Rapor türüne göre veri topla
    switch (reportData.report_type) {
      case 'events':
        reportContent = await reportService.createEventsReport(company_id, reportData);
        break;
      case 'projects':
        reportContent = await reportService.createProjectsReport(company_id, reportData);
        break;
      case 'financial':
        reportContent = await reportService.createFinancialReport(company_id, reportData);
        break;
      case 'customers':
        reportContent = await reportService.createCustomersReport(company_id, reportData);
        break;
      default:
        return res.status(400).json({ message: 'Geçersiz rapor türü' });
    }
    
    // Rapor dosyasını oluştur
    let filePath;
    if (reportData.format === 'excel') {
      filePath = await reportService.generateExcelReport(reportContent, reportData.report_type);
    } else {
      filePath = await reportService.generatePDFReport(reportContent, reportData.report_type);
    }
    
    // Rapor kaydını oluştur
    const { data: report, error } = await supabase
      .from('report_schedules')
      .insert([{
        ...reportData,
        company_id,
        created_by: req.user.id,
        file_path: filePath,
        status: 'completed',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ message: 'Rapor kaydedilemedi' });
    
    res.status(201).json(report);
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Rapor detayını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    
    const { data: report, error } = await supabase
      .from('report_schedules')
      .select('*')
      .eq('id', id)
      .eq('company_id', company_id)
      .single();
    
    if (error || !report) {
      return res.status(404).json({ message: 'Rapor bulunamadı' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Rapor indir
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    
    const { data: report, error } = await supabase
      .from('report_schedules')
      .select('*')
      .eq('id', id)
      .eq('company_id', company_id)
      .single();
    
    if (error || !report) {
      return res.status(404).json({ message: 'Rapor bulunamadı' });
    }
    
    if (!fs.existsSync(report.file_path)) {
      return res.status(404).json({ message: 'Rapor dosyası bulunamadı' });
    }
    
    const fileName = `${report.report_type}_${report.date_range}_${new Date(report.created_at).toISOString().split('T')[0]}.${report.format}`;
    res.download(report.file_path, fileName);
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Rapor sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.user;
    
    // Rapor bilgilerini al
    const { data: report, error: fetchError } = await supabase
      .from('report_schedules')
      .select('file_path')
      .eq('id', id)
      .eq('company_id', company_id)
      .single();
    
    if (fetchError || !report) {
      return res.status(404).json({ message: 'Rapor bulunamadı' });
    }
    
    // Veritabanından sil
    const { error: deleteError } = await supabase
      .from('report_schedules')
      .delete()
      .eq('id', id)
      .eq('company_id', company_id);
    
    if (deleteError) {
      return res.status(500).json({ message: 'Rapor silinemedi' });
    }
    
    // Dosyayı sil
    if (fs.existsSync(report.file_path)) {
      fs.unlinkSync(report.file_path);
    }
    
    res.json({ message: 'Rapor başarıyla silindi' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Zamanlanmış rapor oluştur
router.post('/schedule', [
  body('report_type').isIn(['events', 'projects', 'financial', 'customers', 'tasks', 'budget']),
  body('format').isIn(['excel', 'pdf']),
  body('frequency').isIn(['daily', 'weekly', 'monthly']),
  body('day_of_week').optional().isInt({ min: 0, max: 6 }),
  body('day_of_month').optional().isInt({ min: 1, max: 31 }),
  body('recipients').isArray(),
  body('filters').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { company_id } = req.user;
    const scheduleData = req.body;
    
    const { data: schedule, error } = await supabase
      .from('report_schedules')
      .insert([{
        ...scheduleData,
        company_id,
        created_by: req.user.id,
        status: 'scheduled',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ message: 'Zamanlanmış rapor oluşturulamadı' });
    
    res.status(201).json(schedule);
  } catch (error) {
    console.error('Create scheduled report error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Rapor şablonlarını getir
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'events',
        name: 'Etkinlik Raporu',
        description: 'Etkinlik detayları ve istatistikleri',
        format: ['excel', 'pdf'],
        filters: ['date_range', 'status', 'category']
      },
      {
        id: 'projects',
        name: 'Proje Raporu',
        description: 'Proje durumu ve ilerleme',
        format: ['excel', 'pdf'],
        filters: ['date_range', 'status', 'priority']
      },
      {
        id: 'financial',
        name: 'Finansal Rapor',
        description: 'Gelir, gider ve kâr analizi',
        format: ['excel', 'pdf'],
        filters: ['date_range', 'category', 'type']
      },
      {
        id: 'customers',
        name: 'Müşteri Raporu',
        description: 'Müşteri analizi ve istatistikleri',
        format: ['excel', 'pdf'],
        filters: ['date_range', 'status']
      }
    ];
    
    res.json(templates);
  } catch (error) {
    console.error('Get report templates error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Rapor istatistikleri
router.get('/stats', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { data: reports, error } = await supabase
      .from('report_schedules')
      .select('report_type, format, status, created_at')
      .eq('company_id', company_id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    if (error) return res.status(500).json({ message: 'Rapor istatistikleri getirilemedi' });
    
    const stats = {
      total: reports?.length || 0,
      byType: {},
      byFormat: {},
      byStatus: {}
    };
    
    reports?.forEach(report => {
      // Rapor türüne göre
      stats.byType[report.report_type] = (stats.byType[report.report_type] || 0) + 1;
      // Formata göre
      stats.byFormat[report.format] = (stats.byFormat[report.format] || 0) + 1;
      // Duruma göre
      stats.byStatus[report.status] = (stats.byStatus[report.status] || 0) + 1;
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Get report stats error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 