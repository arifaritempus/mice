"use client";

import { useMemo, useCallback } from "react";

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
}

export default function AccommodationTabSimple({
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
}: AccommodationTabProps) {
  // Basit istatistikler
  const simpleStats = useMemo(() => {
    if (!accommodationItems || accommodationItems.length === 0) {
      return { totalRooms: 0, totalPax: 0, roomTypes: [] };
    }

    const roomTypes = [
      ...new Set(
        accommodationItems.map((item) => item.oda_tipi).filter(Boolean),
      ),
    ];
    const totalRooms = accommodationItems.length;
    const totalPax = accommodationItems.reduce((sum, item) => {
      const roomType = (item.oda_tipi || "").toUpperCase();
      let paxPerRoom = 1;
      if (roomType === "SNG") paxPerRoom = 1;
      else if (roomType === "DBL") paxPerRoom = 2;
      else if (roomType === "TRP" || roomType === "TRPL") paxPerRoom = 3;
      return sum + paxPerRoom;
    }, 0);

    return { totalRooms, totalPax, roomTypes };
  }, [accommodationItems]);

  // Filtrelenmiş konaklama öğeleri - sadece ilk 20 item
  const filteredAccommodationItems = useMemo(() => {
    const limitedItems = accommodationItems.slice(0, 20); // Sadece ilk 20 item

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
          Konaklama
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleAccommodationImport}
            className="hidden"
            id="accommodation-import"
          />
          <label
            htmlFor="accommodation-import"
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 cursor-pointer transition-colors"
          >
            Excel İçe Aktar
          </label>
          <button
            onClick={handleAccommodationExport}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-500/90 transition-colors"
          >
            Excel Dışa Aktar
          </button>
          {accommodationItems.length > 0 && (
            <button
              onClick={handleAccommodationClear}
              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
            >
              Listeyi Temizle
            </button>
          )}
        </div>
      </div>

      {accommodationItems.length > 0 ? (
        <div className="space-y-4">
          {/* Basit İstatistikler */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {simpleStats.totalRooms}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Toplam Oda
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {simpleStats.totalPax}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Toplam Pax
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {simpleStats.roomTypes.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Oda Tipi
                </div>
              </div>
            </div>
          </div>

          {/* Basitleştirilmiş Konaklama Listesi */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Konaklama Listesi
              </h3>
              <input
                type="text"
                value={accommodationSearch}
                onChange={(e) => setAccommodationSearch(e.target.value)}
                placeholder="Listede ara..."
                className="w-64 px-3 py-2 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {filteredAccommodationItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">
                          {item.isim} {item.soyisim}
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {item.oda_tipi}
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {item.gelis_tarihi} - {item.cikis_tarihi}
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {item.otel}
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {item.toplam} {item.doviz}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccommodationEdit(index)}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-500/90"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleAccommodationDelete(index)}
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
                {accommodationItems.length > 20 && (
                  <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                    ... ve {accommodationItems.length - 20} daha fazla kayıt
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Henüz konaklama verisi yok. Excel dosyasından içe aktarabilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
}
