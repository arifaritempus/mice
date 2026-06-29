"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";

interface ServiceItem {
  id: string;
  main_category?: string;
  sub_category?: string;
  unit_quantity: number;
  sefer: number;
  unit_price: number;
  currency: string;
  total: number;
  total_try?: number;
  description?: string;
  vat?: number;
  fx?: number;
  isEditing?: boolean;
  hotel_id?: string; // Hangi otele ait olduğu
}

interface Category {
  id: string;
  code?: string;
  name: string;
  parent_id?: string;
  sort_order?: number;
  description?: string;
  revenue_vat_rate?: number;
  expense_vat_rate?: number;
}

interface QuoteServiceEditorProps {
  items: ServiceItem[];
  onAdd: () => void;
  onEdit: (item: ServiceItem) => void;
  onDelete: (id: string) => void;
  onSave: (items: ServiceItem[]) => void;
  onAddBelow?: (itemId: string) => void;
  categories: Category[];
  currencies?: string[];
  showAddRow: boolean;
  setShowAddRow: (show: boolean) => void;
  newItem: ServiceItem;
  setNewItem: (item: ServiceItem) => void;
  hotels?: {
    id: string;
    hotel_id: string;
    hotel_concept: string;
    name?: string;
  }[];
  hotelId?: string;
  disabled?: boolean;
  isViewMode?: boolean;
  title?: React.ReactNode;
}

export default function QuoteServiceEditor({
  title,
  items,
  onAdd,
  onEdit,
  onDelete,
  onSave,
  onAddBelow,
  categories,
  currencies = ["EUR", "USD", "TL", "GBP"],
  showAddRow,
  setShowAddRow,
  newItem,
  setNewItem,
  hotels = [],
  hotelId,
  disabled = false,
  isViewMode = false,
}: QuoteServiceEditorProps) {
  // Modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Modal dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowCategoryModal(false);
        setSelectedCategories(new Set());
      }
    };

    if (showCategoryModal) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showCategoryModal]);

  // Yardımcı fonksiyonlar
  const formatNumber = (value: number) => {
    const n = Number(value || 0);
    return new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  };

  const formatTRY = (value: number) => formatNumber(value);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "-";
  };

  const totalsByCurrency = (items: ServiceItem[]) => {
    return items.reduce((acc: Record<string, number>, item) => {
      const currency = item.currency || "EUR";
      acc[currency] = (acc[currency] || 0) + (item.total || 0);
      return acc;
    }, {});
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, rowItem: ServiceItem) => {
    if (!rowItem?.isEditing) return;
    const key = e.key;
    if (key !== "Enter" && key !== "Escape") return;

    if (e.key === "Enter") {
      e.preventDefault();
      const updatedItems = items.map((item) =>
        item.id === rowItem.id ? { ...item, isEditing: false } : item,
      );
      onSave(updatedItems);
    }

    if (e.key === "Escape") {
      e.preventDefault();
      const updatedItems = items.map((item) =>
        item.id === rowItem.id ? { ...item, isEditing: false } : item,
      );
      onSave(updatedItems);
    }
  };

  const handleItemChange = (
    itemId: string,
    field: keyof ServiceItem,
    value: any,
  ) => {
    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        let updated = { ...item, [field]: value };

        // Eğer alt kategori seçildiyse, kategorinin açıklamasını ve KDV oranını otomatik getir
        if (field === "sub_category") {
          const subCat = categories.find((c) => c.id === value);
          if (subCat) {
            updated = {
              ...updated,
              description: subCat.description || updated.description,
              vat: subCat.revenue_vat_rate ?? updated.vat,
            };
          }
        }

        // Otomatik hesaplamalar
        if (
          field === "unit_quantity" ||
          field === "sefer" ||
          field === "unit_price" ||
          field === "fx"
        ) {
          const qty =
            field === "unit_quantity" ? Number(value) : item.unit_quantity;
          const sefer = field === "sefer" ? Number(value) : item.sefer;
          const unitPrice =
            field === "unit_price" ? Number(value) : item.unit_price;
          const fx = field === "fx" ? Number(value) : item.fx || 1;

          updated.total = qty * sefer * unitPrice;
          updated.total_try = qty * sefer * unitPrice * fx;
        }

        return updated;
      }
      return item;
    });
    onSave(updatedItems);
  };

  const handleTotalTRYChange = (itemId: string, newTotalTRY: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const qty = Number(item.unit_quantity) || 0;
    const sefer = Number(item.sefer) || 0;
    const fx = Number(item.fx) || 1;

    let newUnitPrice = Number(item.unit_price) || 0;
    if (fx > 0 && qty > 0 && sefer > 0) {
      newUnitPrice = newTotalTRY / fx / (qty * sefer);
    }

    const newTotal = qty * sefer * newUnitPrice;

    const updatedItems = items.map((i) =>
      i.id === itemId
        ? {
            ...i,
            unit_price: newUnitPrice,
            total: newTotal,
            total_try: newTotalTRY,
          }
        : i,
    );
    onSave(updatedItems);
  };

  const totals = totalsByCurrency(items);

  // Ana kategorileri sıralı olarak al
  const mainCategories = useMemo(() => {
    return categories
      .filter((c) => !c.parent_id)
      .sort((a, b) => {
        const aKey = (a.code || a.name || "").toString();
        const bKey = (b.code || b.name || "").toString();
        return aKey.localeCompare(bKey, "tr", {
          numeric: true,
          sensitivity: "base",
        });
      });
  }, [categories]);

  // Alt kategorileri ana kategoriye göre grupla
  const subCategoriesByMain = useMemo(() => {
    const grouped: Record<string, Category[]> = {};
    categories
      .filter((c) => c.parent_id)
      .forEach((c) => {
        if (!grouped[c.parent_id!]) {
          grouped[c.parent_id!] = [];
        }
        grouped[c.parent_id!].push(c);
      });

    // Her ana kategori için alt kategorileri sırala
    Object.keys(grouped).forEach((mainId) => {
      grouped[mainId].sort((a, b) => {
        const aOrder = a.sort_order ?? 999;
        const bOrder = b.sort_order ?? 999;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return (a.name || "").localeCompare(b.name || "", "tr", {
          numeric: true,
          sensitivity: "base",
        });
      });
    });

    return grouped;
  }, [categories]);

  // Ana kategori için tüm alt kategorileri seç/kaldır
  const toggleAllSubCategories = (mainCategoryId: string, select: boolean) => {
    const subCats = subCategoriesByMain[mainCategoryId] || [];
    setSelectedCategories((prev) => {
      const newSet = new Set(prev);
      if (select) {
        subCats.forEach((sub) => newSet.add(sub.id));
      } else {
        subCats.forEach((sub) => newSet.delete(sub.id));
      }
      return newSet;
    });
  };

  // Tüm kategorileri seç/kaldır
  const toggleAllCategories = (select: boolean) => {
    if (select) {
      const allSubCategories = Object.values(subCategoriesByMain).flat();
      setSelectedCategories(new Set(allSubCategories.map((c) => c.id)));
    } else {
      setSelectedCategories(new Set());
    }
  };

  // Items'ı ana kategori ve alt kategori sıralamasına göre sırala
  const sortItemsByCategoryOrder = (
    itemsToSort: ServiceItem[],
  ): ServiceItem[] => {
    // Ana kategori sıralaması (code veya name'e göre)
    const mainCategoryOrder: Record<string, number> = {};
    mainCategories.forEach((mainCat, index) => {
      mainCategoryOrder[mainCat.id] = index;
    });

    // Alt kategori sıralaması (sort_order veya name'e göre)
    const subCategoryOrder: Record<string, number> = {};
    Object.keys(subCategoriesByMain).forEach((mainId) => {
      subCategoriesByMain[mainId].forEach((subCat, index) => {
        subCategoryOrder[subCat.id] = index;
      });
    });

    return [...itemsToSort].sort((a, b) => {
      // Ana kategori sıralaması
      const aMainOrder = a.main_category
        ? (mainCategoryOrder[a.main_category] ?? 999)
        : 999;
      const bMainOrder = b.main_category
        ? (mainCategoryOrder[b.main_category] ?? 999)
        : 999;

      if (aMainOrder !== bMainOrder) {
        return aMainOrder - bMainOrder;
      }

      // Aynı ana kategori içindeyse alt kategori sıralaması
      const aSubOrder = a.sub_category
        ? (subCategoryOrder[a.sub_category] ?? 999)
        : 999;
      const bSubOrder = b.sub_category
        ? (subCategoryOrder[b.sub_category] ?? 999)
        : 999;

      if (aSubOrder !== bSubOrder) {
        return aSubOrder - bSubOrder;
      }

      // Son çare: ID'ye göre sırala
      return a.id.localeCompare(b.id);
    });
  };

  // Seçili kategorileri ekle
  const handleAddSelectedCategories = () => {
    const selectedSubCategories = Array.from(selectedCategories)
      .map((id) => categories.find((c) => c.id === id))
      .filter((c): c is Category => c !== undefined && !!c.parent_id);

    // Her seçili alt kategori için bir item oluştur
    const newItems: ServiceItem[] = selectedSubCategories.map((subCat) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${subCat.id}`,
      main_category: subCat.parent_id || "",
      sub_category: subCat.id,
      unit_quantity: 1,
      sefer: 1,
      unit_price: 0,
      currency: "EUR",
      total: 0,
      total_try: 0,
      description: subCat.description || "",
      vat: subCat.revenue_vat_rate ?? 0,
      fx: 1,
      isEditing: true,
      hotel_id: hotelId === "general" ? "general" : hotelId,
    }));

    // Yeni item'ları mevcut item'larla birleştir ve sırala
    const allItems = [...items, ...newItems];
    const sortedItems = sortItemsByCategoryOrder(allItems);

    // Sıralanmış item'ları kaydet
    onSave(sortedItems);

    // Modal'ı kapat ve seçimleri temizle
    setShowCategoryModal(false);
    setSelectedCategories(new Set());
  };

  // Ana kategori için tüm alt kategoriler seçili mi?
  const isAllSubCategoriesSelected = (mainCategoryId: string) => {
    const subCats = subCategoriesByMain[mainCategoryId] || [];
    if (subCats.length === 0) return false;
    return subCats.every((sub) => selectedCategories.has(sub.id));
  };

  // Ana kategori için bazı alt kategoriler seçili mi?
  const isSomeSubCategoriesSelected = (mainCategoryId: string) => {
    const subCats = subCategoriesByMain[mainCategoryId] || [];
    if (subCats.length === 0) return false;
    const selectedCount = subCats.filter((sub) =>
      selectedCategories.has(sub.id),
    ).length;
    return selectedCount > 0 && selectedCount < subCats.length;
  };

  // Ana kategoriyi aç/kapa
  const toggleCategoryExpansion = (mainCategoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mainCategoryId)) {
        newSet.delete(mainCategoryId);
      } else {
        newSet.add(mainCategoryId);
      }
      return newSet;
    });
  };

  // Ana kategori açık mı?
  const isCategoryExpanded = (mainCategoryId: string) => {
    return expandedCategories.has(mainCategoryId);
  };

  // Modal açıldığında tüm ana kategorileri aç
  useEffect(() => {
    if (showCategoryModal) {
      const allMainCategoryIds = new Set(mainCategories.map((c) => c.id));
      setExpandedCategories(allMainCategoryIds);
    } else {
      setExpandedCategories(new Set());
    }
  }, [showCategoryModal, mainCategories]);

  // Ana kategoriyi ve tüm alt kategorilerini sil
  const handleDeleteMainCategory = (mainCategoryName: string) => {
    // Ana kategori adına göre ana kategori ID'sini bul
    const mainCategory = categories.find(
      (c) => !c.parent_id && c.name === mainCategoryName,
    );
    if (!mainCategory) return;

    // Bu ana kategoriye ait tüm item'ları bul
    const itemsToDelete = items.filter(
      (item) => item.main_category === mainCategory.id,
    );

    if (itemsToDelete.length === 0) return;

    // Onay modal'ını aç
    setCategoryToDelete(mainCategoryName);
    setShowDeleteConfirmModal(true);
  };

  // Silme işlemini onayla
  const confirmDeleteMainCategory = () => {
    if (!categoryToDelete) return;

    // Ana kategori adına göre ana kategori ID'sini bul
    const mainCategory = categories.find(
      (c) => !c.parent_id && c.name === categoryToDelete,
    );
    if (!mainCategory) return;

    // Bu ana kategoriye ait tüm item'ları sil
    const updatedItems = items.filter(
      (item) => item.main_category !== mainCategory.id,
    );
    onSave(updatedItems);

    // Modal'ı kapat
    setShowDeleteConfirmModal(false);
    setCategoryToDelete(null);
  };

  // Checkbox component with indeterminate support
  const CheckboxWithIndeterminate = ({
    checked,
    indeterminate,
    onChange,
  }: {
    checked: boolean;
    indeterminate: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => {
    const checkboxRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    return (
      <input
        type="checkbox"
        ref={checkboxRef}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
      />
    );
  };

  return (
    <div className="space-y-2">
      {/* Silme Onay Modal */}
      {showDeleteConfirmModal && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ana Kategoriyi Sil
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Bu işlem geri alınamaz
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">{categoryToDelete}</span> ana
                kategorisini ve bu ana kategoriye ait tüm alt kategorileri
                silmek istediğinizden emin misiniz?
              </p>
              {(() => {
                const mainCategory = categories.find(
                  (c) => !c.parent_id && c.name === categoryToDelete,
                );
                if (!mainCategory) return null;
                const itemsToDelete = items.filter(
                  (item) => item.main_category === mainCategory.id,
                );
                return (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {itemsToDelete.length} hizmet kalemi silinecek.
                  </p>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setCategoryToDelete(null);
                }}
                className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={confirmDeleteMainCategory}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kategori Seçim Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Kategori Seçin
              </h2>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setSelectedCategories(new Set());
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Tümünü Seç/Kaldır Butonları */}
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => toggleAllCategories(true)}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-500/90"
                >
                  Tümünü Seç
                </button>
                <button
                  onClick={() => toggleAllCategories(false)}
                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Tümünü Kaldır
                </button>
              </div>

              {/* Kategoriler Listesi */}
              <div className="space-y-4">
                {mainCategories.map((mainCat) => {
                  const subCats = subCategoriesByMain[mainCat.id] || [];
                  const allSelected = isAllSubCategoriesSelected(mainCat.id);
                  const someSelected = isSomeSubCategoriesSelected(mainCat.id);

                  const isExpanded = isCategoryExpanded(mainCat.id);

                  return (
                    <div
                      key={mainCat.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      {/* Ana Kategori Header */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-2 flex-1">
                          <button
                            onClick={() => toggleCategoryExpansion(mainCat.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            title={isExpanded ? "Daralt" : "Genişlet"}
                          >
                            <svg
                              className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                          <label
                            className="flex items-center gap-2 cursor-pointer flex-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <CheckboxWithIndeterminate
                              checked={allSelected}
                              indeterminate={someSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleAllSubCategories(
                                  mainCat.id,
                                  e.target.checked,
                                );
                              }}
                            />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {mainCat.name}
                            </span>
                            {subCats.length > 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({subCats.length} alt kategori)
                              </span>
                            )}
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAllSubCategories(mainCat.id, true);
                            }}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-500/90"
                          >
                            Tümünü Seç
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAllSubCategories(mainCat.id, false);
                            }}
                            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Tümünü Kaldır
                          </button>
                        </div>
                      </div>

                      {/* Alt Kategoriler - Sadece açıkken göster */}
                      {isExpanded && subCats.length > 0 && (
                        <div className="p-3 bg-white dark:bg-gray-800 space-y-1 border-t border-gray-200 dark:border-gray-700">
                          {subCats.map((subCat) => (
                            <label
                              key={subCat.id}
                              className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedCategories.has(subCat.id)}
                                onChange={(e) => {
                                  setSelectedCategories((prev) => {
                                    const newSet = new Set(prev);
                                    if (e.target.checked) {
                                      newSet.add(subCat.id);
                                    } else {
                                      newSet.delete(subCat.id);
                                    }
                                    return newSet;
                                  });
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {subCat.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedCategories.size} kategori seçildi
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setSelectedCategories(new Set());
                  }}
                  className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddSelectedCategories}
                  disabled={selectedCategories.size === 0}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Seçili Kategorileri Ekle ({selectedCategories.size})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Üst ekleme satırı - Sadece ana kategori seçimi */}
      {showAddRow && (
        <div className="rounded-md p-4 bg-blue-500/10 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-4">
            {/* Ana Kategori Seçimi */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ana Kategori Seçin
              </label>
              <select
                value={newItem.main_category || ""}
                onChange={(e) => {
                  setNewItem({
                    ...newItem,
                    main_category: e.target.value,
                    sub_category: "",
                  });
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Ana Kategori Seçin</option>
                {categories
                  .filter((c) => !c.parent_id)
                  .sort((a, b) => {
                    // /categories sayfasındaki sıralama ile aynı: code veya name'e göre
                    const aKey = (a.code || a.name || "").toString();
                    const bKey = (b.code || b.name || "").toString();
                    return aKey.localeCompare(bKey, "tr", {
                      numeric: true,
                      sensitivity: "base",
                    });
                  })
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* İşlem Butonları */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  // Ana kategori seçildi, şimdi satır oluştur
                  console.log(
                    "Ana kategori seçim satırındaki Ekle butonuna tıklandı",
                  );
                  if (newItem.main_category) {
                    onAdd();
                    setShowAddRow(false);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                disabled={!newItem.main_category}
              >
                Ekle
              </button>
              <button
                type="button"
                onClick={() => setShowAddRow(false)}
                className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kategori Ekleme Butonu (Üstte Sağda) */}
      <div className="flex justify-end pb-2">
        {!disabled && !isViewMode && (
          <button
            type="button"
            onClick={() => {
              console.log("Kategori ekle butonuna tıklandı - modal açılmalı");
              setShowCategoryModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-500 text-white rounded shadow hover:bg-emerald-600 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v12m6-6H6"
              />
            </svg>
            KATEGORİ EKLE
          </button>
        )}
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[1200px]">
          {/* Başlık satırı */}
          <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
            <div className="w-44">ALT KATEGORİ</div>
            <div className="w-16 flex flex-col justify-center items-end pr-1">
              <div>BİRİM</div>
              <div>ADET</div>
            </div>
            <div className="w-20 flex flex-col justify-center items-end pr-1">
              <div>SEFER</div>
              <div>TEKRAR</div>
            </div>
            <div className="w-24 text-right pr-1">BİRİM FİYAT</div>
            <div className="w-28 text-right pr-1">TOPLAM FİYAT</div>
            <div className="w-16">DÖVİZ</div>
            <div className="w-16">KDV</div>
            <div className="w-16 text-right pr-1">KUR</div>
            <div className="w-32 text-right pr-1">TOPLAM TL</div>
            <div className="w-32 ml-2">OTEL</div>
            <div className="flex-1 min-w-0">AÇIKLAMA</div>

            {!isViewMode && <div className="w-24 text-right pr-2">İŞLEMLER</div>}
          </div>

          {/* Liste */}
          {items.length > 0 && (
            <div className="space-y-1">
              {(() => {
                // Items'ı ana kategori ve alt kategori sıralamasına göre sırala
                const sortedItems = sortItemsByCategoryOrder(items);

                // Ana kategorilere göre grupla
                const grouped = sortedItems.reduce(
                  (acc: any, item: ServiceItem) => {
                    const mainCat =
                      getCategoryName(item.main_category || "") || "Diğer";
                    if (!acc[mainCat]) {
                      acc[mainCat] = [];
                    }
                    acc[mainCat].push(item);
                    return acc;
                  },
                  {},
                );

                const result: any[] = [];

                // Ana kategorileri sıralı olarak işle
                const sortedMainCategories = Object.keys(grouped).sort(
                  (a, b) => {
                    // Ana kategori adına göre ana kategori ID'sini bul
                    const aMainCat = categories.find(
                      (c) => !c.parent_id && c.name === a,
                    );
                    const bMainCat = categories.find(
                      (c) => !c.parent_id && c.name === b,
                    );

                    if (!aMainCat || !bMainCat) return 0;

                    // Ana kategori sıralamasına göre karşılaştır
                    const aIndex = mainCategories.findIndex(
                      (c) => c.id === aMainCat.id,
                    );
                    const bIndex = mainCategories.findIndex(
                      (c) => c.id === bMainCat.id,
                    );

                    if (aIndex !== -1 && bIndex !== -1) {
                      return aIndex - bIndex;
                    }

                    // Fallback: name'e göre sırala
                    return a.localeCompare(b, "tr", {
                      numeric: true,
                      sensitivity: "base",
                    });
                  },
                );

                sortedMainCategories.forEach((mainCategory) => {
                  const categoryItems = grouped[mainCategory];

                  // Her ana kategori içindeki item'ları da sırala
                  const sortedCategoryItems = categoryItems.sort(
                    (a: ServiceItem, b: ServiceItem) => {
                      const aSubOrder = a.sub_category
                        ? (subCategoriesByMain[
                            a.main_category || ""
                          ]?.findIndex((c) => c.id === a.sub_category) ?? 999)
                        : 999;
                      const bSubOrder = b.sub_category
                        ? (subCategoriesByMain[
                            b.main_category || ""
                          ]?.findIndex((c) => c.id === b.sub_category) ?? 999)
                        : 999;

                      if (aSubOrder !== bSubOrder) {
                        return aSubOrder - bSubOrder;
                      }

                      return a.id.localeCompare(b.id);
                    },
                  );

                  // Ana kategori başlığı
                  result.push({
                    type: "header",
                    category: mainCategory,
                    items: sortedCategoryItems,
                  });

                  // Alt kategoriler
                  sortedCategoryItems.forEach(
                    (item: ServiceItem, idx: number) => {
                      result.push({
                        type: "item",
                        item,
                        idx,
                      });
                    },
                  );

                  // Ara toplam
                  const categoryTotal = sortedCategoryItems.reduce(
                    (sum: number, item: ServiceItem) => sum + (item.total || 0),
                    0,
                  );
                  const categoryTotalTRY = sortedCategoryItems.reduce(
                    (sum: number, item: ServiceItem) =>
                      sum + (item.total_try || 0),
                    0,
                  );
                  result.push({
                    type: "subtotal",
                    category: mainCategory,
                    total: categoryTotal,
                    totalTRY: categoryTotalTRY,
                  });
                });

                return result;
              })().map((row: any, idx: number) => {
                if (row.type === "header") {
                  const isFirstHeader = idx === 0;
                  // Ana kategoriye ait item sayısını bul
                  const itemCount = row.items.length;
                  // Ana kategori ID'sini bul
                  const mainCategory = categories.find(
                    (c) => !c.parent_id && c.name === row.category,
                  );

                  return (
                    <div
                      key={`header-${row.category}`}
                      className={`bg-gray-200 dark:bg-gray-600 rounded-md p-2 flex items-center justify-between ${!isFirstHeader ? "mt-4" : ""}`}
                    >
                      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {row.category}
                      </h3>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMainCategory(row.category)}
                          className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          title={`${row.category} ana kategorisini ve ${itemCount} alt kategoriyi sil`}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                }

                if (row.type === "subtotal") {
                  return (
                    <div
                      key={`subtotal-${row.category}`}
                      className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 flex flex-wrap md:flex-nowrap items-center gap-2"
                    >
                      <div className="w-44 text-xs font-semibold text-gray-800 dark:text-gray-200">
                        ARA TOPLAM
                      </div>
                      <div className="w-16"></div>
                      <div className="w-20"></div>
                      <div className="w-24"></div>
                      <div className="w-32 text-right pr-1 text-xs font-semibold text-gray-800 dark:text-gray-200">
                        {formatTRY(row.total)}
                      </div>
                      <div className="w-16"></div>
                      <div className="w-16"></div>
                      <div className="w-16"></div>
                      <div className="w-32 text-right pr-1 text-xs font-semibold text-gray-800 dark:text-gray-200">
                        {formatTRY(row.totalTRY)}
                      </div>
                      <div className="flex-1 min-w-0"></div>
                      <div className="w-24"></div>
                    </div>
                  );
                }

                // Normal item
                const it = row.item;
                return (
                  <div
                    key={it.id}
                    className={`rounded-md p-2 flex flex-wrap md:flex-nowrap items-center gap-2 ${
                      it.isEditing
                        ? "bg-blue-500/10 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
                        : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    }`}
                    onKeyDown={(e) => handleRowKeyDown(e, it)}
                    tabIndex={it.isEditing ? 0 : -1}
                  >
                    {it.isEditing ? (
                      // Düzenleme modu - input alanları
                      <>
                        <select
                          value={it.sub_category || ""}
                          onChange={(e) =>
                            handleItemChange(
                              it.id,
                              "sub_category",
                              e.target.value,
                            )
                          }
                          className="w-44 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="">Alt Kategori Seçin</option>
                          {categories
                            .filter((c) => c.parent_id === it.main_category)
                            .sort((a, b) => {
                              // /categories sayfasındaki sıralama ile aynı: sort_order'a göre, yoksa name'e göre
                              const aOrder = a.sort_order ?? 999;
                              const bOrder = b.sort_order ?? 999;
                              if (aOrder !== bOrder) {
                                return aOrder - bOrder;
                              }
                              return (a.name || "").localeCompare(
                                b.name || "",
                                "tr",
                                { numeric: true, sensitivity: "base" },
                              );
                            })
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                        <input
                          value={it.unit_quantity}
                          onChange={(e) =>
                            handleItemChange(
                              it.id,
                              "unit_quantity",
                              Number(e.target.value),
                            )
                          }
                          type="number"
                          step="1"
                          className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          autoFocus
                        />
                        <input
                          value={it.sefer}
                          onChange={(e) =>
                            handleItemChange(
                              it.id,
                              "sefer",
                              Number(e.target.value),
                            )
                          }
                          type="number"
                          step="1"
                          className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <input
                          value={it.unit_price}
                          onChange={(e) =>
                            handleItemChange(
                              it.id,
                              "unit_price",
                              Number(e.target.value),
                            )
                          }
                          type="number"
                          step="0.01"
                          className="w-24 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <div className="w-28 px-2 py-1 text-xs text-right text-gray-700 dark:text-gray-200">
                          {formatTRY(it.total)}
                        </div>
                        <select
                          value={it.currency}
                          onChange={(e) =>
                            handleItemChange(it.id, "currency", e.target.value)
                          }
                          className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          {currencies.map((currency) => (
                            <option key={currency} value={currency}>
                              {currency}
                            </option>
                          ))}
                        </select>
                        <input
                          value={it.vat || 0}
                          onChange={(e) =>
                            handleItemChange(
                              it.id,
                              "vat",
                              Number(e.target.value),
                            )
                          }
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          placeholder="0"
                          className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <input
                          value={it.fx || 1}
                          onChange={(e) =>
                            handleItemChange(
                              it.id,
                              "fx",
                              Number(e.target.value),
                            )
                          }
                          type="number"
                          step="0.0001"
                          className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <input
                          value={it.total_try || 0}
                          onChange={(e) =>
                            handleTotalTRYChange(it.id, Number(e.target.value))
                          }
                          type="number"
                          step="0.01"
                          className="w-32 px-2 py-1 text-xs text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />

                        {/* Hotel selection for CAT_001 and CAT_002 */}
                        {(it.main_category === "CAT_001" ||
                          it.main_category === "CAT_002") &&
                          hotels.length > 0 && (
                            <select
                              disabled={isViewMode}
                              value={it.hotel_id || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  it.id,
                                  "hotel_id",
                                  e.target.value,
                                )
                              }
                              className="w-32 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white ml-2"
                            >
                              <option value="">Otel Seçin</option>
                              {hotels.map((h) => (
                                <option key={h.id} value={h.id}>
                                  {h.name ||
                                    (h.hotel_id
                                      ? `Otel #${h.id.slice(-4)}`
                                      : "Seçilmedi")}
                                </option>
                              ))}
                            </select>
                          )}
                        {it.main_category !== "CAT_001" &&
                          it.main_category !== "CAT_002" && (
                            <div className="w-32 ml-2"></div>
                          )}

                        <input
                          value={it.description || ""}
                          onChange={(e) =>
                            handleItemChange(
                              it.id,
                              "description",
                              e.target.value,
                            )
                          }
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white ml-2"
                          placeholder="Açıklama"
                        />
                        {!isViewMode && (
                          <div className="w-24 flex items-center gap-1 justify-end pr-1">
                            {onAddBelow && (
                            <button
                              type="button"
                              onClick={() => onAddBelow(it.id)}
                              className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
                              title="Altına Satır Ekle"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6v12m6-6H6"
                                />
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const updatedItems = items.map((item) =>
                                item.id === it.id
                                  ? { ...item, isEditing: false }
                                  : item,
                              );
                              onSave(updatedItems);
                            }}
                            className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
                            title="Kaydet"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(it.id)}
                            className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                            title="Sil"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                          </div>
                        )}
                      </>
                    ) : (
                      // Görüntüleme modu - normal div'ler
                      <>
                        <div className="w-44 text-xs text-gray-900 dark:text-white">
                          {getCategoryName(it.sub_category || "") || "-"}
                        </div>
                        <div className="w-16 text-right pr-1 text-xs text-gray-900 dark:text-white">
                          {Math.round(it.unit_quantity)}
                        </div>
                        <div className="w-20 text-right pr-1 text-xs text-gray-900 dark:text-white">
                          {Math.round(it.sefer)}
                        </div>
                        <div className="w-24 text-right pr-1 text-xs text-gray-900 dark:text-white">
                          {formatTRY(it.unit_price)}
                        </div>
                        <div className="w-32 text-right pr-1 text-xs font-semibold text-gray-900 dark:text-white">
                          {formatTRY(it.total)}
                        </div>
                        <div className="w-16 text-xs text-gray-900 dark:text-white">
                          {it.currency}
                        </div>
                        <div className="w-16 text-xs text-gray-900 dark:text-white">
                          %{it.vat || 0}
                        </div>
                        <div className="w-16 text-right pr-1 text-xs text-gray-900 dark:text-white">
                          {formatTRY(it.fx || 1)}
                        </div>
                        <div className="w-32 text-right pr-1 text-xs font-semibold text-gray-900 dark:text-white">
                          {formatTRY(it.total_try || 0)}
                        </div>

                        <div className="w-32 text-xs text-gray-900 dark:text-white ml-2">
                          {it.hotel_id &&
                          hotels.find((h) => h.id === it.hotel_id) ? (
                            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-[10px] font-medium border border-blue-200 dark:border-blue-800">
                              {hotels.find((h) => h.id === it.hotel_id)?.name ||
                                "Seçili Otel"}
                            </span>
                          ) : (
                            "-"
                          )}
                        </div>

                        <div className="flex-1 min-w-0 text-xs text-gray-900 dark:text-white">
                          {it.description || "-"}
                        </div>

                        {!disabled && !isViewMode ? (
                          <div className="w-24 flex items-center gap-1 justify-end pr-1">
                            {onAddBelow && (
                              <button
                                type="button"
                                onClick={() => onAddBelow(it.id)}
                                className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
                                title="Altına Satır Ekle"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v12m6-6H6"
                                  />
                                </svg>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onEdit(it)}
                              className="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-900/30"
                              title="Düzenle"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(it.id)}
                              className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                              title="Sil"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="w-24"></div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              {/* Genel Toplamlar */}
              <div className="mt-4 bg-blue-500 dark:bg-blue-700 rounded-md p-3">
                <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
                  <div className="w-44 text-sm font-bold text-white">
                    GENEL TOPLAM
                  </div>
                  <div className="w-16"></div>
                  <div className="w-20"></div>
                  <div className="w-24"></div>
                  <div className="w-32 text-right pr-1 text-sm font-bold text-white">
                    {Object.entries(totals)
                      .map(
                        ([cur, val]: any) =>
                          `${formatTRY(Number(val || 0))} ${cur}`,
                      )
                      .join(" + ")}
                  </div>
                  <div className="w-16"></div>
                  <div className="w-16"></div>
                  <div className="w-16"></div>
                  <div className="w-32 text-right pr-1 text-sm font-bold text-white">
                    {formatTRY(
                      items.reduce(
                        (sum: number, it: ServiceItem) =>
                          sum + Number(it.total_try || 0),
                        0,
                      ),
                    )}{" "}
                    TL
                  </div>
                  <div className="flex-1 min-w-0"></div>
                  <div className="w-24"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
