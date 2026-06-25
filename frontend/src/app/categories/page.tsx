"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { categoriesService } from "@/lib/supabaseService";
import { usePermissions, Module } from "@/lib/permissions";
import PaginationControls from "@/components/PaginationControls";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import LoadingSpinner from "@/components/LoadingSpinner";
import Modal from "@/components/Modal";

// Category interface tanımı
interface Category {
  id: string;
  code?: string;
  name: string;
  description?: string;
  parent_id?: string | null;
  main_category_id?: string;
  expense_accounting_code?: string;
  revenue_accounting_code?: string;
  revenue_vat_accounting_code?: string;
  revenue_vat_rate?: number;
  expense_vat_accounting_code?: string;
  expense_vat_rate?: number;
  is_active?: boolean;
  sort_order?: number;
  created_at: string;
  updated_at: string;
}
import { ExcelUtils, ExcelImportUtils } from "@/utils/excelUtils";
import { formatDate } from "@/utils/formatters";
import { DEFAULT_PAGE_SIZE, paginateItems } from "@/types/pagination";

export default function CategoriesPage() {
  const {
    canView,
    canCreate,
    canEdit,
    canDelete,
    loading: permissionsLoading,
  } = usePermissions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsFilter, setStatsFilter] = useState<
    "all" | "main" | "sub" | "active"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTokens, setSearchTokens] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const [newCategory, setNewCategory] = useState({
    id: "",
    name: "",
    description: "",
    parent_id: "",
    expense_accounting_code: "",
    revenue_accounting_code: "",
    revenue_vat_accounting_code: "",
    revenue_vat_rate: 0,
    expense_vat_accounting_code: "",
    expense_vat_rate: 0,
    isMainCategory: true,
  });

  const [editCategory, setEditCategory] = useState<Partial<Category>>({});

  const isUuid = (value?: string) =>
    !!value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );

  const getCategorySortKey = (category: Category) => {
    const code = (category.code || "").toString().trim();
    if (code) return code;
    const id = (category.id || "").toString().trim();
    if (id && !isUuid(id)) return id;
    return (category.name || "").toString().trim();
  };

  const getCategorySortWeight = (category: Category) => {
    const key = getCategorySortKey(category);
    const nums = key.match(/\d+/g);
    if (!nums) return Number.MAX_SAFE_INTEGER;
    const weight = Number(nums.join(""));
    return Number.isFinite(weight) ? weight : Number.MAX_SAFE_INTEGER;
  };

  const compareByCategoryId = (a: Category, b: Category) => {
    const aOrder = a.sort_order ?? 9999;
    const bOrder = b.sort_order ?? 9999;
    if (aOrder !== bOrder) return aOrder - bOrder;

    const wa = getCategorySortWeight(a);
    const wb = getCategorySortWeight(b);
    if (wa !== wb) return wa - wb;
    return getCategorySortKey(a).localeCompare(getCategorySortKey(b), "tr", {
      numeric: true,
      sensitivity: "base",
    });
  };

  // Kategorileri sıralamak için yardımcı fonksiyon
  const sortCategories = (list: Category[]) => {
    return [...list].sort((a, b) => {
      // Her seviyede CAT ID (code/id) bazlı doğal sıralama
      return compareByCategoryId(a, b);
    });
  };

  const isCategoryVisible = (category: Category) => {
    let passesStats = true;
    if (statsFilter === "main") passesStats = !category.parent_id;
    else if (statsFilter === "sub") passesStats = !!category.parent_id;
    else if (statsFilter === "active") passesStats = !!category.is_active;

    if (!passesStats) return false;

    if (!searchTerm && (!searchTokens || searchTokens.length === 0))
      return true;

    const matches = (s: string) => {
      if (!s) return true;
      const lowerS = s.toLowerCase();
      return (
        category.name.toLowerCase().includes(lowerS) ||
        (category.code && category.code.toLowerCase().includes(lowerS)) ||
        (category.description &&
          category.description.toLowerCase().includes(lowerS))
      );
    };

    if (searchTerm && !matches(searchTerm)) return false;

    if (searchTokens && searchTokens.length > 0) {
      for (const t of searchTokens) {
        if (!matches(t)) return false;
      }
    }

    return true;
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statsFilter, searchTerm, searchTokens]);

  const loadCategories = async () => {
    try {
      const supa = await categoriesService.getAll();
      const normalized = (supa || []).map((c: any) => ({
        id: c.id,
        code: c.code || undefined,
        name: c.name,
        description: c.description || "",
        parent_id: c.parent_id || null,
        main_category_id: c.main_category_id || undefined,
        expense_accounting_code: c.expense_accounting_code || "",
        revenue_accounting_code: c.revenue_accounting_code || "",
        revenue_vat_accounting_code: c.revenue_vat_accounting_code || "",
        revenue_vat_rate: c.revenue_vat_rate || 0,
        expense_vat_accounting_code: c.expense_vat_accounting_code || "",
        expense_vat_rate: c.expense_vat_rate || 0,
        is_active: c.is_active ?? true,
        sort_order: c.sort_order ?? 0,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));
      const sorted = sortCategories(normalized as Category[]);
      setCategories(sorted);
      setLoading(false);
      return;
    } catch (error: any) {
      console.error("Error loading categories:", error);
      setError("Kategoriler Supabase'ten yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const categoryId = newCategory.isMainCategory
        ? newCategory.id
        : undefined; // Supabase id otomatik
      const sortOrder = newCategory.isMainCategory
        ? 0
        : categories.filter((cat) => cat.parent_id === newCategory.parent_id)
            .length + 1;

      const payload: any = {
        code: newCategory.isMainCategory ? newCategory.id : undefined,
        name: newCategory.name,
        description: newCategory.description || "",
        is_active: true,
        parent_id: newCategory.isMainCategory ? null : newCategory.parent_id,
        expense_accounting_code: newCategory.expense_accounting_code || "",
        revenue_accounting_code: newCategory.revenue_accounting_code || "",
        revenue_vat_accounting_code:
          newCategory.revenue_vat_accounting_code || "",
        revenue_vat_rate: newCategory.revenue_vat_rate || 0,
        expense_vat_accounting_code:
          newCategory.expense_vat_accounting_code || "",
        expense_vat_rate: newCategory.expense_vat_rate || 0,
        sort_order: sortOrder,
      };
      // Supabase UUID üretsin; özel ID ihtiyacı varsa tabloya izin verildikten sonra eklenir

      await categoriesService.create(payload);
      await loadCategories();

      setSuccess("Kategori başarıyla oluşturuldu");
      setShowCreateModal(false);
      setNewCategory({
        id: "",
        name: "",
        description: "",
        parent_id: "",
        expense_accounting_code: "",
        revenue_accounting_code: "",
        revenue_vat_accounting_code: "",
        revenue_vat_rate: 0,
        expense_vat_accounting_code: "",
        expense_vat_rate: 0,
        isMainCategory: true,
      });
    } catch (error: any) {
      setError(error.message || "Kategori oluşturulurken hata oluştu");
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    setError("");
    setSuccess("");

    try {
      const payload: any = {
        id: selectedCategory.id,
        code: !selectedCategory.parent_id
          ? ((editCategory as any).code ?? selectedCategory.code)
          : undefined,
        name: editCategory.name || selectedCategory.name,
        description: editCategory.description ?? selectedCategory.description,
        parent_id: editCategory.parent_id ?? selectedCategory.parent_id,
        expense_accounting_code:
          (editCategory.expense_accounting_code ??
            selectedCategory.expense_accounting_code) ||
          "",
        revenue_accounting_code:
          (editCategory.revenue_accounting_code ??
            selectedCategory.revenue_accounting_code) ||
          "",
        revenue_vat_accounting_code:
          (editCategory.revenue_vat_accounting_code ??
            selectedCategory.revenue_vat_accounting_code) ||
          "",
        revenue_vat_rate:
          (editCategory.revenue_vat_rate ??
            selectedCategory.revenue_vat_rate) ||
          0,
        expense_vat_accounting_code:
          (editCategory.expense_vat_accounting_code ??
            selectedCategory.expense_vat_accounting_code) ||
          "",
        expense_vat_rate:
          (editCategory.expense_vat_rate ??
            selectedCategory.expense_vat_rate) ||
          0,
      };

      await categoriesService.update(selectedCategory.id, payload);
      await loadCategories();

      setSuccess("Kategori başarıyla güncellendi");
      setShowEditModal(false);
      setSelectedCategory(null);
      setEditCategory({});
    } catch (error: any) {
      setError("Kategori güncellenirken hata oluştu");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) return;

    try {
      await categoriesService.delete(categoryId);
      await loadCategories();
      setSuccess("Kategori başarıyla silindi");
    } catch (error: any) {
      setError("Kategori silinirken hata oluştu");
    }
  };

  const handleToggleActive = async (
    categoryId: string,
    currentStatus: boolean,
  ) => {
    try {
      await categoriesService.update(categoryId, {
        is_active: !currentStatus,
      } as any);
      await loadCategories();
      setSuccess("Kategori durumu güncellendi");
    } catch (error) {
      setError("Kategori durumu güncellenirken hata oluştu");
    }
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setEditCategory({
      id: category.id,
      name: category.name,
      description: category.description,
      parent_id: category.parent_id,
      expense_accounting_code: category.expense_accounting_code || "",
      revenue_accounting_code: category.revenue_accounting_code || "",
      revenue_vat_accounting_code: category.revenue_vat_accounting_code || "",
      revenue_vat_rate: category.revenue_vat_rate || 0,
      expense_vat_accounting_code: category.expense_vat_accounting_code || "",
      expense_vat_rate: category.expense_vat_rate || 0,
    });
    setShowEditModal(true);
  };

  const getMainCategories = () => {
    return categories.filter((cat) => !cat.parent_id);
  };

  const getSubCategories = (parentId: string) => {
    return categories
      .filter((cat) => cat.parent_id === parentId)
      .sort((a, b) => {
        const aKey = getCategorySortKey(a);
        const bKey = getCategorySortKey(b);
        return aKey.localeCompare(bKey, "tr", {
          numeric: true,
          sensitivity: "base",
        });
      });
  };

  const getCategoryType = (category: Category) => {
    if (!category.parent_id) return "Ana Kategori";
    return "Alt Kategori";
  };

  const getParentCategoryName = (category: Category) => {
    if (!category.parent_id) return "-";
    const parent = categories.find((cat) => cat.id === category.parent_id);
    return parent ? parent.name : "Bilinmeyen";
  };

  // Drag & Drop fonksiyonu
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId !== destination.droppableId) return;

    const parentId = source.droppableId;
    const subCategories = categories
      .filter((cat) => cat.parent_id === parentId)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    const reordered = Array.from(subCategories);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    // Yeni sıraları Supabase'e yaz
    for (let i = 0; i < reordered.length; i++) {
      const cat = reordered[i];
      await categoriesService.update(cat.id, { sort_order: i + 1 } as any);
    }
    await loadCategories();
  };

  // Yukarı/Aşağı taşıma fonksiyonları
  const moveSubCategoryUp = async (categoryId: string, parentId: string) => {
    console.log("moveSubCategoryUp called:", { categoryId, parentId });

    // Önce sıralanmış alt kategorileri al
    const subCategories = categories
      .filter((cat) => cat.parent_id === parentId)
      .sort((a, b) => {
        const aOrder = a.sort_order ?? 999;
        const bOrder = b.sort_order ?? 999;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return (a.id || "").localeCompare(b.id || "", "tr", {
          numeric: true,
          sensitivity: "base",
        });
      });

    console.log(
      "subCategories found (sorted):",
      subCategories.map((c) => ({
        id: c.id,
        name: c.name,
        sort_order: c.sort_order,
      })),
    );
    const currentIndex = subCategories.findIndex(
      (cat) => cat.id === categoryId,
    );
    console.log("currentIndex:", currentIndex);

    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const reorderedSubCategories = Array.from(subCategories);
      const [movedItem] = reorderedSubCategories.splice(currentIndex, 1);
      reorderedSubCategories.splice(newIndex, 0, movedItem);

      const updatedSubCategories = reorderedSubCategories.map((cat, index) => ({
        ...cat,
        sort_order: index + 1,
        updated_at: new Date().toISOString(),
      }));

      // Yeni sıraları Supabase'e yaz
      try {
        setLoading(true);
        for (const cat of updatedSubCategories) {
          await categoriesService.update(cat.id, {
            sort_order: cat.sort_order,
          } as any);
        }
        setSuccess("Kategori sırası güncellendi");
      } catch (err) {
        console.error("Supabase update failed:", err);
        setError("Sıralama güncellenirken hata oluştu");
      } finally {
        await loadCategories();
      }
    } else {
      console.log("Cannot move up - already at top");
    }
  };

  const moveSubCategoryDown = async (categoryId: string, parentId: string) => {
    console.log("moveSubCategoryDown called:", { categoryId, parentId });

    // Önce sıralanmış alt kategorileri al
    const subCategories = categories
      .filter((cat) => cat.parent_id === parentId)
      .sort((a, b) => {
        const aOrder = a.sort_order ?? 999;
        const bOrder = b.sort_order ?? 999;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return (a.id || "").localeCompare(b.id || "", "tr", {
          numeric: true,
          sensitivity: "base",
        });
      });

    console.log(
      "subCategories found (sorted):",
      subCategories.map((c) => ({
        id: c.id,
        name: c.name,
        sort_order: c.sort_order,
      })),
    );
    const currentIndex = subCategories.findIndex(
      (cat) => cat.id === categoryId,
    );
    console.log("currentIndex:", currentIndex);

    if (currentIndex < subCategories.length - 1) {
      const newIndex = currentIndex + 1;
      const reorderedSubCategories = Array.from(subCategories);
      const [movedItem] = reorderedSubCategories.splice(currentIndex, 1);
      reorderedSubCategories.splice(newIndex, 0, movedItem);

      const updatedSubCategories = reorderedSubCategories.map((cat, index) => ({
        ...cat,
        sort_order: index + 1,
        updated_at: new Date().toISOString(),
      }));

      // Yeni sıraları Supabase'e yaz
      try {
        setLoading(true);
        for (const cat of updatedSubCategories) {
          await categoriesService.update(cat.id, {
            sort_order: cat.sort_order,
          } as any);
        }
        setSuccess("Kategori sırası güncellendi");
      } catch (err) {
        console.error("Supabase update failed:", err);
        setError("Sıralama güncellenirken hata oluştu");
      } finally {
        await loadCategories();
      }
    } else {
      console.log("Cannot move down - already at bottom");
    }
  };

  const moveMainCategoryUp = async (categoryId: string) => {
    const mainCategories = categories
      .filter((cat) => !cat.parent_id)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    const currentIndex = mainCategories.findIndex((c) => c.id === categoryId);
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const reordered = Array.from(mainCategories);
      const [moved] = reordered.splice(currentIndex, 1);
      reordered.splice(newIndex, 0, moved);

      try {
        setLoading(true);
        for (let i = 0; i < reordered.length; i++) {
          await categoriesService.update(reordered[i].id, {
            sort_order: i + 1,
          } as any);
        }
        setSuccess("Ana kategori sırası güncellendi");
      } catch (err) {
        setError("Sıralama güncellenirken hata oluştu");
      } finally {
        await loadCategories();
      }
    }
  };

  const moveMainCategoryDown = async (categoryId: string) => {
    const mainCategories = categories
      .filter((cat) => !cat.parent_id)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    const currentIndex = mainCategories.findIndex((c) => c.id === categoryId);
    if (currentIndex < mainCategories.length - 1) {
      const newIndex = currentIndex + 1;
      const reordered = Array.from(mainCategories);
      const [moved] = reordered.splice(currentIndex, 1);
      reordered.splice(newIndex, 0, moved);

      try {
        setLoading(true);
        for (let i = 0; i < reordered.length; i++) {
          await categoriesService.update(reordered[i].id, {
            sort_order: i + 1,
          } as any);
        }
        setSuccess("Ana kategori sırası güncellendi");
      } catch (err) {
        setError("Sıralama güncellenirken hata oluştu");
      } finally {
        await loadCategories();
      }
    }
  };

  // Excel Export Fonksiyonu
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await ExcelUtils.exportCategories(categories);
      setSuccess("Excel dosyası başarıyla indirildi!");
    } catch (error) {
      console.error("Excel export hatası:", error);
      setError("Excel dosyası oluşturulurken bir hata oluştu.");
    } finally {
      setExporting(false);
    }
  };

  // Excel Import Fonksiyonu
  const handleImportExcel = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = ExcelImportUtils.validateExcelFile(file);
    if (!validation.isValid) {
      setError(validation.error || "Dosya geçersiz");
      return;
    }

    setImporting(true);
    try {
      const importedCategories = await ExcelImportUtils.importCategories(file);
      const validCategories = importedCategories.filter(
        (category) => category.name && category.name.trim() !== "",
      );
      const parentCategories = validCategories.filter(
        (cat) => !cat.parent_name || cat.parent_name === "Ana Kategori",
      );
      const childCategories = validCategories.filter(
        (cat) => cat.parent_name && cat.parent_name !== "Ana Kategori",
      );

      for (const category of parentCategories) {
        await categoriesService.create({
          name: category.name,
          description: category.description || "",
          is_active: category.is_active,
          parent_id: null,
        } as any);
      }
      await loadCategories();

      for (const category of childCategories) {
        const parent = categories.find((c) => c.name === category.parent_name);
        if (parent) {
          await categoriesService.create({
            name: category.name,
            description: category.description || "",
            is_active: category.is_active,
            parent_id: parent.id,
          } as any);
        }
      }
      await loadCategories();

      setSuccess(`${validCategories.length} kategori başarıyla içe aktarıldı`);
    } catch (error) {
      console.error("Excel import hatası:", error);
      setError("Excel dosyası okunurken bir hata oluştu.");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Categories görüntüleme yetkisi kontrolü
  if (!canView(Module.CATEGORIES)) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Kategoriler sayfasına erişim için yetkiniz bulunmuyor.
          </p>
          <Link
            href="/"
            className="bg-blue-500 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Kategoriler yükleniyor..." />;
  }

  const visibleMainCategoryGroups = categories
    .filter((c) => !c.parent_id)
    .sort(compareByCategoryId)
    .filter((mainCategory) => {
      const subCategories = categories
        .filter((cat) => cat.parent_id === mainCategory.id)
        .sort(compareByCategoryId);
      const visibleMain = isCategoryVisible(mainCategory);
      const visibleSubCategories = subCategories.filter(isCategoryVisible);
      return visibleMain || visibleSubCategories.length > 0;
    });
  const paginatedMainCategoryGroups = paginateItems(
    visibleMainCategoryGroups,
    page,
    pageSize,
  );

  return (
    <div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">
      <div className="w-full min-w-0 flex-1 flex flex-col min-h-0">
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-4 shrink-0">
          {/* Title Area */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400 shrink-0">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-light tracking-wide text-white glow-text">
                Kategori Yönetimi
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Ana kategorileri ve alt kategorileri yönetin
              </p>
            </div>
          </div>

          {/* Filters & Actions Area */}
          <div className="flex flex-row items-end justify-start xl:justify-end gap-3 flex-1 flex-wrap">
            {/* Search Bar */}
            <div className="flex flex-col gap-1.5 flex-[2] min-w-[250px] max-w-lg shrink-0">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                GENEL ARAMA (KATEGORİ, KOD, AÇIKLAMA...)
              </label>
              <div className="h-10">
                <MultiTokenFilterInput
                  label=""
                  placeholder="Yaz, Enter ile ekle"
                  inputValue={searchTerm}
                  onInputChange={setSearchTerm}
                  tokens={searchTokens}
                  suggestions={[]}
                  onAddToken={(t) => {
                    if (!searchTokens.includes(t)) {
                      setSearchTokens([...searchTokens, t]);
                      setSearchTerm("");
                    }
                  }}
                  onRemoveToken={(t) => {
                    setSearchTokens(searchTokens.filter((st) => st !== t));
                  }}
                />
              </div>
            </div>

            {/* Trash Button */}
            <button
              onClick={() => {
                setStatsFilter("all");
                setSearchTerm("");
                setSearchTokens([]);
              }}
              className="h-10 w-10 flex items-center justify-center bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all shrink-0"
              title="Filtreleri Temizle"
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
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>

            {/* Actions Divider */}
            <div className="w-px h-6 bg-white/10 shrink-0 mx-1 hidden sm:block"></div>

            {/* Actions */}
            <label className="h-10 bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shrink-0">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              {importing ? "YÜKLENİYOR..." : "EXCEL YÜKLE"}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                disabled={importing}
                className="hidden"
              />
            </label>

            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="h-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.5,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V7.5L14.5,2M10,19L7,19V15H10V19M13,19L10,19V15H13V19M16,19L13,19V15H16V19M10,14L7,14V10H10V14M13,14L10,14V10H13V14M16,14L13,14V10H16V14M13,7V3.5L18.5,9H14A1,1 0 0,1 13,8V7Z" />
              </svg>
              {exporting ? "İNDİRİLİYOR..." : "EXCEL İNDİR"}
            </button>

            {canCreate(Module.CATEGORIES) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-10 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 py-2 px-6 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.15)] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0"
              >
                + YENİ KATEGORİ
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl transition-colors duration-200 text-xs font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl transition-colors duration-200 text-xs font-medium">
            {success}
          </div>
        )}

        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-sm shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 border-r border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-[11px] font-medium text-white">Durum:</span>
          </div>

          <button
            onClick={() => setStatsFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${statsFilter === "all" ? "bg-blue-500/20 border border-blue-500/30 text-blue-300" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
          >
            TÜMÜ
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${statsFilter === "all" ? "bg-blue-500/20 text-blue-300" : "bg-white/10"}`}
            >
              {categories.length}
            </span>
          </button>
          <button
            onClick={() => setStatsFilter("main")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${statsFilter === "main" ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
          >
            ANA KATEGORİ
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${statsFilter === "main" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10"}`}
            >
              {categories.filter((c) => !c.parent_id).length}
            </span>
          </button>
          <button
            onClick={() => setStatsFilter("sub")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${statsFilter === "sub" ? "bg-purple-500/20 border border-purple-500/30 text-purple-300" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
          >
            ALT KATEGORİ
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${statsFilter === "sub" ? "bg-purple-500/20 text-purple-300" : "bg-white/10"}`}
            >
              {categories.filter((c) => c.parent_id).length}
            </span>
          </button>
          <button
            onClick={() => setStatsFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${statsFilter === "active" ? "bg-orange-500/20 border border-orange-500/30 text-orange-300" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
          >
            AKTİF
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${statsFilter === "active" ? "bg-orange-500/20 text-orange-300" : "bg-white/10"}`}
            >
              {categories.filter((c) => c.is_active).length}
            </span>
          </button>
        </div>

        {/* Categories List - Grouped by Main Categories */}
        <div className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1 pb-4">
          {/* Ana Kategoriler ve Alt Kategorileri */}
          {paginatedMainCategoryGroups.items.map((mainCategory) => {
            const subCategories = categories
              .filter((cat) => cat.parent_id === mainCategory.id)
              .sort(compareByCategoryId);
            const visibleMain = isCategoryVisible(mainCategory);
            const visibleSubCategories =
              subCategories.filter(isCategoryVisible);
            const shouldRenderGroup =
              visibleMain || visibleSubCategories.length > 0;
            if (!shouldRenderGroup) return null;

            return (
              <div
                key={mainCategory.id}
                className="bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden transition-all duration-300"
              >
                {/* Ana Kategori Başlığı */}
                <div
                  className="bg-white/5 border-l-4 border-blue-500/50 px-4 py-3 group hover:bg-blue-500/10 cursor-pointer transition-colors"
                  onDoubleClick={() => {
                    setSelectedCategory(mainCategory);
                    setShowEditModal(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col gap-0.5 mr-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveMainCategoryUp(mainCategory.id);
                          }}
                          className="p-0.5 hover:bg-white/10 rounded text-slate-500 hover:text-white transition-colors"
                          title="Yukarı Taşı"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveMainCategoryDown(mainCategory.id);
                          }}
                          className="p-0.5 hover:bg-white/10 rounded text-slate-500 hover:text-white transition-colors"
                          title="Aşağı Taşı"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="w-8 h-8 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                        <span className="text-blue-400 text-sm font-bold">
                          📂
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
                          {mainCategory.name}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {mainCategory.description || "Ana Kategori"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(
                            mainCategory.id,
                            mainCategory.is_active || false,
                          );
                        }}
                        className={`inline-flex px-2 py-1 text-[10px] font-semibold rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${
                          mainCategory.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                        title="Durumu Değiştir"
                      >
                        {mainCategory.is_active ? "Aktif" : "Pasif"}
                      </button>
                      <div className="flex items-center space-x-1">
                        {canEdit(Module.CATEGORIES) && (
                          <button
                            onClick={() => openEditModal(mainCategory)}
                            className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded-lg hover:bg-emerald-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"
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
                        )}
                        {canDelete(Module.CATEGORIES) && (
                          <button
                            onClick={() =>
                              handleDeleteCategory(mainCategory.id)
                            }
                            className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"
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
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ana Kategori Muhasebe Bilgileri */}
                  <div className="mt-2 grid grid-cols-2 gap-4 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">Gider:</span>
                      <span className="font-mono text-emerald-300">
                        {mainCategory.expense_accounting_code || "-"}
                      </span>
                      <span className="text-slate-500 bg-black/20 px-1.5 py-0.5 rounded ml-1 border border-white/5">
                        KDV: {mainCategory.expense_vat_accounting_code || "-"} (
                        {mainCategory.expense_vat_rate || 0}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">Gelir:</span>
                      <span className="font-mono text-blue-300">
                        {mainCategory.revenue_accounting_code || "-"}
                      </span>
                      <span className="text-slate-500 bg-black/20 px-1.5 py-0.5 rounded ml-1 border border-white/5">
                        KDV: {mainCategory.revenue_vat_accounting_code || "-"} (
                        {mainCategory.revenue_vat_rate || 0}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alt Kategoriler Listesi */}
                {visibleSubCategories.length > 0 && (
                  <div className="px-4 py-3 bg-white/5">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-4 h-4 bg-purple-500/20 border border-purple-500/30 rounded flex items-center justify-center">
                        <span className="text-purple-400 text-[10px]">📄</span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">
                        Alt Kategoriler ({visibleSubCategories.length}) -
                        Yukarı/Aşağı okları ile sıralayabilirsiniz
                      </span>
                    </div>

                    <div className="space-y-2">
                      {visibleSubCategories.map((subCategory, index) => (
                        <div
                          key={subCategory.id}
                          className="flex items-center justify-between p-3 bg-[#0f172a]/40 border border-white/5 rounded-xl hover:bg-blue-500/10 cursor-pointer transition-all duration-200 group"
                          onDoubleClick={() => {
                            setSelectedCategory(subCategory);
                            setShowEditModal(true);
                          }}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-6 h-6 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
                              <span className="text-slate-400 text-xs font-bold">
                                {index + 1}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5 mr-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveSubCategoryUp(
                                    subCategory.id,
                                    subCategory.parent_id!,
                                  );
                                }}
                                className="p-0.5 hover:bg-white/10 rounded text-slate-500 hover:text-white transition-colors"
                                title="Yukarı Taşı"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveSubCategoryDown(
                                    subCategory.id,
                                    subCategory.parent_id!,
                                  );
                                }}
                                className="p-0.5 hover:bg-white/10 rounded text-slate-500 hover:text-white transition-colors"
                                title="Aşağı Taşı"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </button>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xs font-medium text-white group-hover:text-purple-300 transition-colors">
                                {subCategory.name}
                              </h4>
                              <p className="text-[10px] text-slate-400">
                                {subCategory.description || "Alt kategori"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            {/* Muhasebe Kodları */}
                            <div className="hidden md:flex items-center space-x-6 text-[10px]">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-500 font-medium">
                                  Gider:
                                </span>
                                <span className="font-mono text-emerald-300/80">
                                  {subCategory.expense_accounting_code || "-"}
                                </span>
                                <span className="text-slate-500 bg-black/20 px-1 py-0.5 rounded ml-1 border border-white/5">
                                  KDV:{" "}
                                  {subCategory.expense_vat_accounting_code ||
                                    "-"}{" "}
                                  ({subCategory.expense_vat_rate || 0}%)
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-slate-500 font-medium">
                                  Gelir:
                                </span>
                                <span className="font-mono text-blue-300/80">
                                  {subCategory.revenue_accounting_code || "-"}
                                </span>
                                <span className="text-slate-500 bg-black/20 px-1 py-0.5 rounded ml-1 border border-white/5">
                                  KDV:{" "}
                                  {subCategory.revenue_vat_accounting_code ||
                                    "-"}{" "}
                                  ({subCategory.revenue_vat_rate || 0}%)
                                </span>
                              </div>
                            </div>

                            {/* Durum */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleActive(
                                  subCategory.id,
                                  subCategory.is_active || false,
                                );
                              }}
                              className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${
                                subCategory.is_active
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                              }`}
                              title="Durumu Değiştir"
                            >
                              {subCategory.is_active ? "Aktif" : "Pasif"}
                            </button>

                            {/* İşlemler */}
                            <div className="flex items-center space-x-1 border-l border-white/10 pl-3">
                              {canEdit(Module.CATEGORIES) && (
                                <button
                                  onClick={() => openEditModal(subCategory)}
                                  className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded-lg hover:bg-emerald-500/20 transition-all duration-200 opacity-50 group-hover:opacity-100"
                                  title="Düzenle"
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
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
                              )}
                              {canDelete(Module.CATEGORIES) && (
                                <button
                                  onClick={() =>
                                    handleDeleteCategory(subCategory.id)
                                  }
                                  className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/20 transition-all duration-200 opacity-50 group-hover:opacity-100"
                                  title="Sil"
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
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
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alt Kategori Yoksa Mesaj */}
                {visibleSubCategories.length === 0 && (
                  <div className="px-4 py-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      Bu ana kategori için henüz alt kategori eklenmemiş
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Üst Kategorisi Olmayan Diğer Kategoriler */}
          {categories.filter((c) => !c.parent_id).length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📂</span>
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Henüz kategori eklenmemiş
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Yeni kategori ekleyerek başlayın
              </p>
            </div>
          )}
        </div>
        <PaginationControls
          page={paginatedMainCategoryGroups.page}
          pageSize={paginatedMainCategoryGroups.pageSize}
          total={paginatedMainCategoryGroups.total}
          totalPages={paginatedMainCategoryGroups.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          preferenceKey="categories_page_size"
          compactRight
        />
      </div>

      {/* Create Category Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewCategory({
            id: "",
            name: "",
            description: "",
            parent_id: "",
            expense_accounting_code: "",
            revenue_accounting_code: "",
            revenue_vat_accounting_code: "",
            revenue_vat_rate: 0,
            expense_vat_accounting_code: "",
            expense_vat_rate: 0,
            isMainCategory: false,
          });
        }}
        title="Yeni Kategori Ekle"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              Kategori Tipi *
            </label>
            <select
              value={newCategory.isMainCategory ? "main" : "sub"}
              onChange={(e) =>
                setNewCategory({
                  ...newCategory,
                  isMainCategory: e.target.value === "main",
                })
              }
              className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
            >
              <option value="main" className="bg-[#0f172a]">
                Ana Kategori
              </option>
              <option value="sub" className="bg-[#0f172a]">
                Alt Kategori
              </option>
            </select>
          </div>

          {newCategory.isMainCategory && (
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">
                Kategori ID *
              </label>
              <input
                type="text"
                value={newCategory.id}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, id: e.target.value })
                }
                required
                placeholder="CAT_008"
                className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              Kategori Adı *
            </label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory({ ...newCategory, name: e.target.value })
              }
              required
              autoFocus
              className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              Açıklama
            </label>
            <textarea
              value={newCategory.description}
              onChange={(e) =>
                setNewCategory({ ...newCategory, description: e.target.value })
              }
              rows={2}
              className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm resize-none"
            />
          </div>
          {!newCategory.isMainCategory && (
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">
                Ana Kategori *
              </label>
              <select
                value={newCategory.parent_id}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, parent_id: e.target.value })
                }
                required
                className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              >
                <option value="" className="bg-[#0f172a]">
                  Ana Kategori Seçin
                </option>
                {categories
                  .filter((c) => !c.parent_id)
                  .map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                      className="bg-[#0f172a]"
                    >
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">
                Gider Muhasebe Kodu
              </label>
              <input
                type="text"
                value={newCategory.expense_accounting_code}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    expense_accounting_code: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">
                Gelir Muhasebe Kodu
              </label>
              <input
                type="text"
                value={newCategory.revenue_accounting_code}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    revenue_accounting_code: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              />
            </div>
          </div>

          {/* KDV Alanları */}
          <div className="border-t border-white/10 pt-4 mt-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              KDV Bilgileri
            </h4>

            {/* Gelir KDV */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Gelir KDV Muhasebe Kodu
                </label>
                <input
                  type="text"
                  value={newCategory.revenue_vat_accounting_code}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      revenue_vat_accounting_code: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Gelir KDV Oranı (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={newCategory.revenue_vat_rate}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      revenue_vat_rate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                />
              </div>
            </div>

            {/* Gider KDV */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Gider KDV Muhasebe Kodu
                </label>
                <input
                  type="text"
                  value={newCategory.expense_vat_accounting_code}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      expense_vat_accounting_code: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Gider KDV Oranı (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={newCategory.expense_vat_rate}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      expense_vat_rate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setNewCategory({
                  id: "",
                  name: "",
                  description: "",
                  parent_id: "",
                  expense_accounting_code: "",
                  revenue_accounting_code: "",
                  revenue_vat_accounting_code: "",
                  revenue_vat_rate: 0,
                  expense_vat_accounting_code: "",
                  expense_vat_rate: 0,
                  isMainCategory: true,
                });
              }}
              className="px-6 py-2.5 text-sm font-bold text-white bg-[#0f172a]/40 border border-white/10 rounded-xl hover:bg-white/5 transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm font-bold rounded-xl hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all"
            >
              Kaydet
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={showEditModal && !!selectedCategory}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCategory(null);
        }}
        title="Kategori Düzenle"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleUpdateCategory} className="space-y-4">
          {!selectedCategory?.parent_id && (
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">
                Kategori ID *
              </label>
              <input
                type="text"
                value={
                  (editCategory as any).code || selectedCategory?.code || ""
                }
                onChange={(e) =>
                  setEditCategory({
                    ...editCategory,
                    code: e.target.value,
                  } as any)
                }
                required
                autoFocus
                className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              Kategori Adı *
            </label>
            <input
              type="text"
              value={editCategory.name || ""}
              onChange={(e) =>
                setEditCategory({ ...editCategory, name: e.target.value })
              }
              required
              className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              Açıklama
            </label>
            <textarea
              value={editCategory.description || ""}
              onChange={(e) =>
                setEditCategory({
                  ...editCategory,
                  description: e.target.value,
                })
              }
              rows={2}
              className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm resize-none"
            />
          </div>
          {selectedCategory?.parent_id && (
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">
                Üst Kategori
              </label>
              <select
                value={editCategory.parent_id || ""}
                onChange={(e) =>
                  setEditCategory({
                    ...editCategory,
                    parent_id: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              >
                <option value="" className="bg-[#0f172a]">
                  Ana Kategori
                </option>
                {categories
                  .filter((c) => !c.parent_id && c.id !== selectedCategory?.id)
                  .map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                      className="bg-[#0f172a]"
                    >
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">
                Gider Muhasebe Kodu
              </label>
              <input
                type="text"
                value={editCategory.expense_accounting_code || ""}
                onChange={(e) =>
                  setEditCategory({
                    ...editCategory,
                    expense_accounting_code: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">
                Gelir Muhasebe Kodu
              </label>
              <input
                type="text"
                value={editCategory.revenue_accounting_code || ""}
                onChange={(e) =>
                  setEditCategory({
                    ...editCategory,
                    revenue_accounting_code: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              />
            </div>
          </div>

          {/* KDV Alanları */}
          <div className="border-t border-white/10 pt-4 mt-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              KDV Bilgileri
            </h4>

            {/* Gelir KDV */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Gelir KDV Muhasebe Kodu
                </label>
                <input
                  type="text"
                  value={editCategory.revenue_vat_accounting_code || ""}
                  onChange={(e) =>
                    setEditCategory({
                      ...editCategory,
                      revenue_vat_accounting_code: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Gelir KDV Oranı (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={editCategory.revenue_vat_rate || 0}
                  onChange={(e) =>
                    setEditCategory({
                      ...editCategory,
                      revenue_vat_rate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                />
              </div>
            </div>

            {/* Gider KDV */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Gider KDV Muhasebe Kodu
                </label>
                <input
                  type="text"
                  value={editCategory.expense_vat_accounting_code || ""}
                  onChange={(e) =>
                    setEditCategory({
                      ...editCategory,
                      expense_vat_accounting_code: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Gider KDV Oranı (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={editCategory.expense_vat_rate || 0}
                  onChange={(e) =>
                    setEditCategory({
                      ...editCategory,
                      expense_vat_rate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setSelectedCategory(null);
              }}
              className="px-6 py-2.5 text-sm font-bold text-white bg-[#0f172a]/40 border border-white/10 rounded-xl hover:bg-white/5 transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm font-bold rounded-xl hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all"
            >
              Güncelle
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
