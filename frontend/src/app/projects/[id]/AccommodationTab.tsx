"use client";

import { useMemo, useCallback, memo , useEffect} from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface AccommodationTabProps {
  accommodationItems: any[];
  accommodationSearch: string;
  setAccommodationSearch: (search: string) => void;
  handleAccommodationImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAccommodationExport: () => void;
  handleAccommodationClear: () => void;
  editingAccommodationIndex: number | null;
  setEditingAccommodationIndex: (index: number | null) => void;
  tempAccommodationItem: any;
  setTempAccommodationItem: (item: any) => void;
  handleAccommodationSave: () => void;
  handleAccommodationCancel: () => void;
  handleAccommodationEdit: (index: number) => void;
  handleAccommodationDelete: (index: number) => void;
  formatDateAccommodation: (dateValue: any) => string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

const FIXED_HEADERS = [
  "ODA #",
  "ODA TİPİ",
  "İSİM",
  "SOYİSİM",
  "GİRİŞ TARİHİ",
  "ÇIKIŞ TARİHİ",
  "OTEL",
  "UÇAK",
  "TOPLAM",
  "DÖVİZ",
];

// Basitleştirilmiş tablo satırı component'i
const AccommodationRow = memo(
  ({
    item,
    index,
    isEditing,
    tempAccommodationItem,
    setTempAccommodationItem,
    handleAccommodationSave,
    handleAccommodationCancel,
    handleAccommodationEdit,
    handleAccommodationDelete,
    canEdit = true,
    canDelete = true,
  }: any) => {
    return (
      <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
        {isEditing ? (
          <>
            <td className="px-3 py-2">
              <input
                type="text"
                value={tempAccommodationItem.oda_no || ""}
                onChange={(e) =>
                  setTempAccommodationItem({
                    ...tempAccommodationItem,
                    oda_no: e.target.value,
                  })
                }
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </td>
            <td className="px-3 py-2">
              <input
                type="text"
                value={tempAccommodationItem.oda_tipi || ""}
                onChange={(e) =>
                  setTempAccommodationItem({
                    ...tempAccommodationItem,
                    oda_tipi: e.target.value,
                  })
                }
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </td>
            <td className="px-3 py-2">
              <input
                type="text"
                value={tempAccommodationItem.isim || ""}
                onChange={(e) =>
                  setTempAccommodationItem({
                    ...tempAccommodationItem,
                    isim: e.target.value,
                  })
                }
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </td>
            <td className="px-3 py-2">
              <input
                type="text"
                value={tempAccommodationItem.soyisim || ""}
                onChange={(e) =>
                  setTempAccommodationItem({
                    ...tempAccommodationItem,
                    soyisim: e.target.value,
                  })
                }
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </td>
            <td className="px-3 py-2">
              <input
                type="text"
                value={tempAccommodationItem.gelis_tarihi || ""}
                onChange={(e) =>
                  setTempAccommodationItem({
                    ...tempAccommodationItem,
                    gelis_tarihi: e.target.value,
                  })
                }
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </td>
            <td className="px-3 py-2">
              <input
                type="text"
                value={tempAccommodationItem.cikis_tarihi || ""}
                onChange={(e) =>
                  setTempAccommodationItem({
                    ...tempAccommodationItem,
                    cikis_tarihi: e.target.value,
                  })
                }
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </td>
            <td className="px-3 py-2">
              <input
                type="text"
                value={tempAccommodationItem.otel || ""}
                onChange={(e) =>
                  setTempAccommodationItem({
                    ...tempAccommodationItem,
                    otel: e.target.value,
                  })
                }
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </td>
            <td className="px-3 py-2">
              <input
                type="text"
                value={tempAccommodationItem.ucak || ""}
                onChange={(e) =>
                  setTempAccommodationItem({
                    ...tempAccommodationItem,
                    ucak: e.target.value,
                  })
                }
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </td>
            <td className="px-3 py-2">
              <input
                type="text"
                value={tempAccommodationItem.toplam || ""}
                onChange={(e) =>
                  setTempAccommodationItem({
                    ...tempAccommodationItem,
                    toplam: e.target.value,
                  })
                }
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </td>
            <td className="px-3 py-2">
              <input
                type="text"
                value={tempAccommodationItem.doviz || ""}
                onChange={(e) =>
                  setTempAccommodationItem({
                    ...tempAccommodationItem,
                    doviz: e.target.value,
                  })
                }
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </td>
            <td className="px-3 py-2 text-center">
              {canEdit && (
                <button
                  onClick={handleAccommodationSave}
                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 mr-1"
                >
                  Kaydet
                </button>
              )}
              <button
                onClick={handleAccommodationCancel}
                className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
              >
                İptal
              </button>
            </td>
          </>
        ) : (
          <>
            <td className="px-3 py-2">{item.oda_no || "-"}</td>
            <td className="px-3 py-2">{item.oda_tipi || "-"}</td>
            <td className="px-3 py-2">{item.isim || "-"}</td>
            <td className="px-3 py-2">{item.soyisim || "-"}</td>
            <td className="px-3 py-2">{item.gelis_tarihi || "-"}</td>
            <td className="px-3 py-2">{item.cikis_tarihi || "-"}</td>
            <td className="px-3 py-2">{item.otel || "-"}</td>
            <td className="px-3 py-2">{item.ucak || "-"}</td>
            <td className="px-3 py-2">{item.toplam || "-"}</td>
            <td className="px-3 py-2">{item.doviz || "-"}</td>
            <td className="px-3 py-2 text-center">
              {canEdit && (
                <button
                  onClick={() => handleAccommodationEdit(index)}
                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-500/90 mr-1"
                >
                  Düzenle
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => handleAccommodationDelete(index)}
                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                >
                  Sil
                </button>
              )}
            </td>
          </>
        )}
      </tr>
    );
  },
);

export default function AccommodationTab({
  accommodationItems,
  accommodationSearch,
  setAccommodationSearch,
  handleAccommodationImport,
  handleAccommodationExport,
  handleAccommodationClear,
  editingAccommodationIndex,
  setEditingAccommodationIndex,
  tempAccommodationItem,
  setTempAccommodationItem,
  handleAccommodationSave,
  handleAccommodationCancel,
  handleAccommodationEdit,
  handleAccommodationDelete,
  formatDateAccommodation,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}: AccommodationTabProps) {
  const { t } = useLanguage();
  // Konaklama verilerini optimize et - çok basit hesaplama
  const accommodationStats = useMemo(() => {
    if (!accommodationItems || accommodationItems.length === 0) {
      return {
        dateStats: {},
        allDates: [],
        allRoomTypes: [],
        grandTotals: {},
        grandTotalRooms: 0,
        grandTotalPax: 0,
      };
    }

    // Sadece oda tiplerini al - çok basit
    const allRoomTypes = [
      ...new Set(
        accommodationItems.map((item) => item.oda_tipi).filter(Boolean),
      ),
    ].sort();

    // Basit tarih hesaplaması - sadece ilk 10 item
    const dateStats: any = {};
    const allDates: string[] = [];
    const maxItems = Math.min(accommodationItems.length, 10); // Sadece ilk 10 item

    for (let i = 0; i < maxItems; i++) {
      const item = accommodationItems[i];
      const checkIn = formatDateAccommodation(item.gelis_tarihi);
      const checkOut = formatDateAccommodation(item.cikis_tarihi);
      const roomType = item.oda_tipi || "Belirsiz";

      if (checkIn && checkOut && checkIn !== "-" && checkOut !== "-") {
        // Basit tarih işleme - sadece giriş tarihini kullan
        const dateKey = checkIn.replace(/\./g, "-");
        if (!dateStats[dateKey]) {
          dateStats[dateKey] = {
            date: checkIn,
            roomTypes: {},
          };
          allDates.push(dateKey);
        }

        if (!dateStats[dateKey].roomTypes[roomType]) {
          dateStats[dateKey].roomTypes[roomType] = 0;
        }
        dateStats[dateKey].roomTypes[roomType]++;
      }
    }

    // Tarihleri sırala
    const sortedDates = allDates.sort();

    // Basit toplamlar
    const grandTotals: any = {};
    let grandTotalRooms = 0;
    let grandTotalPax = 0;

    Object.values(dateStats).forEach((stats: any) => {
      Object.entries(stats.roomTypes).forEach(
        ([roomType, count]: [string, any]) => {
          if (!grandTotals[roomType]) {
            grandTotals[roomType] = 0;
          }
          grandTotals[roomType] += count as number;
          grandTotalRooms += count as number;

          // Basit pax hesaplama
          const roomTypeUpper = roomType.toUpperCase();
          let paxPerRoom = 1;
          if (roomTypeUpper === "SNG") paxPerRoom = 1;
          else if (roomTypeUpper === "DBL") paxPerRoom = 2;
          else if (roomTypeUpper === "TRP" || roomTypeUpper === "TRPL")
            paxPerRoom = 3;
          grandTotalPax += (count as number) * paxPerRoom;
        },
      );
    });

    return {
      dateStats,
      allDates: sortedDates,
      allRoomTypes,
      grandTotals,
      grandTotalRooms,
      grandTotalPax,
    };
  }, [accommodationItems, formatDateAccommodation]);

  // Filtrelenmiş konaklama öğeleri - sadece ilk 50 item
  const filteredAccommodationItems = useMemo(() => {
    const limitedItems = accommodationItems.slice(0, 50); // Sadece ilk 50 item

    if (!accommodationSearch) return limitedItems;

    const searchLower = accommodationSearch.toLowerCase();
    return limitedItems.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchLower),
      ),
    );
  }, [accommodationItems, accommodationSearch]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          {t('projects.accommodation') || "Konaklama"}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleAccommodationImport}
            className="hidden"
            id="accommodation-import"
          />
          {canCreate && (
            <label
              htmlFor="accommodation-import"
              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 cursor-pointer transition-colors"
            >
              {t('projects.importExcel') || "Excel İçe Aktar"}
            </label>
          )}
          <button
            onClick={handleAccommodationExport}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-500/90 transition-colors"
          >
            {t('projects.exportExcel') || "Excel Dışa Aktar"}
          </button>
          {canDelete && accommodationItems.length > 0 && (
            <button
              onClick={handleAccommodationClear}
              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
            >
              {t('projects.clearList') || "Listeyi Temizle"}
            </button>
          )}
        </div>
      </div>

      {accommodationItems.length > 0 ? (
        <div className="space-y-4">
          {/* Ana Konaklama Tablosu */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-0 py-1 border-b border-gray-200 dark:border-gray-700 flex items-center justify-start">
              <input
                type="text"
                value={accommodationSearch}
                onChange={(e) => setAccommodationSearch(e.target.value)}
                placeholder={t('projects.searchListAllColumns') || "Listede ara (tüm sütunlar)"}
                className="w-full md:w-[36rem] px-3 py-2 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    {FIXED_HEADERS.map((header, index) => {
                      let trans = header;
                      if (header === "ODA #") trans = t('projects.roomNo') || header;
                      else if (header === "ODA TİPİ") trans = t('projects.roomType') || header;
                      else if (header === "İSİM") trans = t('common.firstName') || header;
                      else if (header === "SOYİSİM") trans = t('common.lastName') || header;
                      else if (header === "GİRİŞ TARİHİ") trans = t('projects.checkInDate') || header;
                      else if (header === "ÇIKIŞ TARİHİ") trans = t('projects.checkOutDate') || header;
                      else if (header === "OTEL") trans = t('projects.hotel') || header;
                      else if (header === "UÇAK") trans = t('projects.flight') || header;
                      else if (header === "TOPLAM") trans = t('projects.total') || header;
                      else if (header === "DÖVİZ") trans = t('projects.currency') || header;
                      return (
                        <th
                          key={`header-${index}-${header}`}
                          className="px-3 py-2 text-left font-semibold"
                        >
                          {trans}
                        </th>
                      );
                    })}
                    <th className="px-3 py-2 text-center font-semibold">
                      {t('common.actions') || "İşlemler"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccommodationItems.map((item, index) => {
                    const uniqueKey = `${index}-${item.gelis_tarihi || "no-date"}-${item.isim || "no-name"}-${item.soyisim || "no-surname"}`;
                    return (
                      <tr
                        key={uniqueKey}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {editingAccommodationIndex === index ? (
                          <>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.oda_no || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    oda_no: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.oda_tipi || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    oda_tipi: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.yatak_tipi || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    yatak_tipi: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.isim || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    isim: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.soyisim || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    soyisim: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.oda_no || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    oda_no: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.oda_notu || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    oda_notu: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.gelis_tarihi || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    gelis_tarihi: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={
                                  tempAccommodationItem.gelis_ucus_kodu || ""
                                }
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    gelis_ucus_kodu: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={
                                  tempAccommodationItem.gelis_ucak_kalkis || ""
                                }
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    gelis_ucak_kalkis: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={
                                  tempAccommodationItem.gelis_ucak_inis || ""
                                }
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    gelis_ucak_inis: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.cikis_tarihi || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    cikis_tarihi: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={
                                  tempAccommodationItem.donus_ucus_kodu || ""
                                }
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    donus_ucus_kodu: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={
                                  tempAccommodationItem.donus_ucak_kalkis || ""
                                }
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    donus_ucak_kalkis: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={
                                  tempAccommodationItem.donus_ucak_inis || ""
                                }
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    donus_ucak_inis: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.tarih1 || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    tarih1: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.tarih2 || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    tarih2: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.tarih3 || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    tarih3: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.tarih4 || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    tarih4: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.tarih5 || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    tarih5: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.tarih6 || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    tarih6: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.tarih7 || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    tarih7: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.geceleme || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    geceleme: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.paket || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    paket: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.otel || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    otel: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.ucak || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    ucak: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.toplam || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    toplam: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={tempAccommodationItem.doviz || ""}
                                onChange={(e) =>
                                  setTempAccommodationItem({
                                    ...tempAccommodationItem,
                                    doviz: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              {canEdit && (
                                <button
                                  onClick={handleAccommodationSave}
                                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 mr-1"
                                >
                                  {t('common.save') || "Kaydet"}
                                </button>
                              )}
                              <button
                                onClick={handleAccommodationCancel}
                                className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                              >
                                {t('common.cancel') || "İptal"}
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2">{item.oda_no || "-"}</td>
                            <td className="px-3 py-2">
                              {item.oda_tipi || "-"}
                            </td>
                            <td className="px-3 py-2">
                              {item.yatak_tipi || "-"}
                            </td>
                            <td className="px-3 py-2">{item.isim || "-"}</td>
                            <td className="px-3 py-2">{item.soyisim || "-"}</td>
                            <td className="px-3 py-2">{item.oda_no || "-"}</td>
                            <td className="px-3 py-2">
                              {item.oda_notu || "-"}
                            </td>
                            <td className="px-3 py-2">
                              {item.gelis_tarihi || "-"}
                            </td>
                            <td className="px-3 py-2">
                              {item.gelis_ucus_kodu || "-"}
                            </td>
                            <td className="px-3 py-2">
                              {item.gelis_ucak_kalkis || "-"}
                            </td>
                            <td className="px-3 py-2">
                              {item.gelis_ucak_inis || "-"}
                            </td>
                            <td className="px-3 py-2">
                              {item.cikis_tarihi || "-"}
                            </td>
                            <td className="px-3 py-2">
                              {item.donus_ucus_kodu || "-"}
                            </td>
                            <td className="px-3 py-2">
                              {item.donus_ucak_kalkis || "-"}
                            </td>
                            <td className="px-3 py-2">
                              {item.donus_ucak_inis || "-"}
                            </td>
                            <td className="px-3 py-2">{item.tarih1 || "-"}</td>
                            <td className="px-3 py-2">{item.tarih2 || "-"}</td>
                            <td className="px-3 py-2">{item.tarih3 || "-"}</td>
                            <td className="px-3 py-2">{item.tarih4 || "-"}</td>
                            <td className="px-3 py-2">{item.tarih5 || "-"}</td>
                            <td className="px-3 py-2">{item.tarih6 || "-"}</td>
                            <td className="px-3 py-2">{item.tarih7 || "-"}</td>
                            <td className="px-3 py-2">
                              {item.geceleme || "-"}
                            </td>
                            <td className="px-3 py-2">{item.paket || "-"}</td>
                            <td className="px-3 py-2">{item.otel || "-"}</td>
                            <td className="px-3 py-2">{item.ucak || "-"}</td>
                            <td className="px-3 py-2">{item.toplam || "-"}</td>
                            <td className="px-3 py-2">{item.doviz || "-"}</td>
                            <td className="px-3 py-2 text-center">
                              {canEdit && (
                                <button
                                  onClick={() => handleAccommodationEdit(index)}
                                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-500/90 mr-1"
                                >
                                  {t('common.edit') || "Düzenle"}
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() =>
                                    handleAccommodationDelete(index)
                                  }
                                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                >
                                  {t('common.delete') || "Sil"}
                                </button>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Günlük Inhouse Kontrolü Tablosu - Basitleştirilmiş */}
          {accommodationStats.allDates.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t('projects.dailyInhouseControl') || "Günlük Inhouse Kontrolü"}
                </h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('projects.totalRooms') || "Toplam Oda:"} {accommodationStats.grandTotalRooms} | {t('projects.totalPax') || "Toplam Pax:"}{" "}
                  {accommodationStats.grandTotalPax} | {t('projects.dateCount') || "Tarih Sayısı:"}{" "}
                  {accommodationStats.allDates.length}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {t('projects.noAccommodationData') || "Henüz konaklama verisi yok. Excel dosyasından içe aktarabilirsiniz."}
          </p>
        </div>
      )}
    </div>
  );
}
