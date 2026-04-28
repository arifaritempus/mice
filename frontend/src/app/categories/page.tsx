'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { categoriesService } from '@/lib/supabaseService';
import { usePermissions, Module } from '@/lib/permissions';
import PaginationControls from '@/components/PaginationControls';
import LoadingSpinner from '@/components/LoadingSpinner';

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
import { ExcelUtils, ExcelImportUtils } from '@/utils/excelUtils';
import { formatDate } from '@/utils/formatters';
import { DEFAULT_PAGE_SIZE, paginateItems } from '@/types/pagination';

export default function CategoriesPage() {
  const { canView, canCreate, canEdit, canDelete, loading: permissionsLoading } = usePermissions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsFilter, setStatsFilter] = useState<'all' | 'main' | 'sub' | 'active'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const [newCategory, setNewCategory] = useState({
    id: '',
    name: '',
    description: '',
    parent_id: '',
    expense_accounting_code: '',
    revenue_accounting_code: '',
    revenue_vat_accounting_code: '',
    revenue_vat_rate: 0,
    expense_vat_accounting_code: '',
    expense_vat_rate: 0,
    isMainCategory: true
  });

  const [editCategory, setEditCategory] = useState<Partial<Category>>({});

  const isUuid = (value?: string) =>
    !!value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const getCategorySortKey = (category: Category) => {
    const code = (category.code || '').toString().trim();
    if (code) return code;
    const id = (category.id || '').toString().trim();
    if (id && !isUuid(id)) return id;
    return (category.name || '').toString().trim();
  };

  const getCategorySortWeight = (category: Category) => {
    const key = getCategorySortKey(category);
    const nums = key.match(/\d+/g);
    if (!nums) return Number.MAX_SAFE_INTEGER;
    const weight = Number(nums.join(''));
    return Number.isFinite(weight) ? weight : Number.MAX_SAFE_INTEGER;
  };

  const compareByCategoryId = (a: Category, b: Category) => {
    const wa = getCategorySortWeight(a);
    const wb = getCategorySortWeight(b);
    if (wa !== wb) return wa - wb;
    return getCategorySortKey(a).localeCompare(getCategorySortKey(b), 'tr', { numeric: true, sensitivity: 'base' });
  };

  // Kategorileri sıralamak için yardımcı fonksiyon
  const sortCategories = (list: Category[]) => {
    return [...list].sort((a, b) => {
      // Her seviyede CAT ID (code/id) bazlı doğal sıralama
      return compareByCategoryId(a, b);
    });
  };

  const isCategoryVisibleByStatsFilter = (category: Category) => {
    if (statsFilter === 'all') return true;
    if (statsFilter === 'main') return !category.parent_id;
    if (statsFilter === 'sub') return !!category.parent_id;
    if (statsFilter === 'active') return !!category.is_active;
    return true;
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statsFilter]);

  const loadCategories = async () => {
    try {
      const supa = await categoriesService.getAll();
      const normalized = (supa || []).map((c: any) => ({
        id: c.id,
        code: c.code || undefined,
        name: c.name,
        description: c.description || '',
        parent_id: c.parent_id || null,
        main_category_id: c.main_category_id || undefined,
        expense_accounting_code: c.expense_accounting_code || '',
        revenue_accounting_code: c.revenue_accounting_code || '',
        revenue_vat_accounting_code: c.revenue_vat_accounting_code || '',
        revenue_vat_rate: c.revenue_vat_rate || 0,
        expense_vat_accounting_code: c.expense_vat_accounting_code || '',
        expense_vat_rate: c.expense_vat_rate || 0,
        is_active: c.is_active ?? true,
        sort_order: c.sort_order ?? 0,
        created_at: c.created_at,
        updated_at: c.updated_at
      }));
      const sorted = sortCategories(normalized as Category[]);
      setCategories(sorted);
      setLoading(false);
      return;
    } catch (error: any) {
      console.error('Error loading categories:', error);
      setError('Kategoriler Supabase\'ten yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const categoryId = newCategory.isMainCategory ? newCategory.id : undefined; // Supabase id otomatik
      const sortOrder = newCategory.isMainCategory ? 0 : (categories.filter(cat => cat.parent_id === newCategory.parent_id).length + 1);

      const payload: any = {
        code: newCategory.isMainCategory ? newCategory.id : undefined,
        name: newCategory.name,
        description: newCategory.description || '',
        is_active: true,
        parent_id: newCategory.isMainCategory ? null : newCategory.parent_id,
        expense_accounting_code: newCategory.expense_accounting_code || '',
        revenue_accounting_code: newCategory.revenue_accounting_code || '',
        revenue_vat_accounting_code: newCategory.revenue_vat_accounting_code || '',
        revenue_vat_rate: newCategory.revenue_vat_rate || 0,
        expense_vat_accounting_code: newCategory.expense_vat_accounting_code || '',
        expense_vat_rate: newCategory.expense_vat_rate || 0,
        sort_order: sortOrder
      };
      // Supabase UUID üretsin; özel ID ihtiyacı varsa tabloya izin verildikten sonra eklenir

      await categoriesService.create(payload);
      await loadCategories();

      setSuccess('Kategori başarıyla oluşturuldu');
      setShowCreateModal(false);
      setNewCategory({ id: '', name: '', description: '', parent_id: '', expense_accounting_code: '', revenue_accounting_code: '', revenue_vat_accounting_code: '', revenue_vat_rate: 0, expense_vat_accounting_code: '', expense_vat_rate: 0, isMainCategory: true });
    } catch (error: any) {
      setError(error.message || 'Kategori oluşturulurken hata oluştu');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    setError('');
    setSuccess('');

    try {
      const payload: any = {
        id: selectedCategory.id,
        code: !selectedCategory.parent_id ? (editCategory as any).code ?? selectedCategory.code : undefined,
        name: editCategory.name || selectedCategory.name,
        description: editCategory.description ?? selectedCategory.description,
        parent_id: editCategory.parent_id ?? selectedCategory.parent_id,
        expense_accounting_code: (editCategory.expense_accounting_code ?? selectedCategory.expense_accounting_code) || '',
        revenue_accounting_code: (editCategory.revenue_accounting_code ?? selectedCategory.revenue_accounting_code) || '',
        revenue_vat_accounting_code: (editCategory.revenue_vat_accounting_code ?? selectedCategory.revenue_vat_accounting_code) || '',
        revenue_vat_rate: (editCategory.revenue_vat_rate ?? selectedCategory.revenue_vat_rate) || 0,
        expense_vat_accounting_code: (editCategory.expense_vat_accounting_code ?? selectedCategory.expense_vat_accounting_code) || '',
        expense_vat_rate: (editCategory.expense_vat_rate ?? selectedCategory.expense_vat_rate) || 0
      };

      await categoriesService.update(selectedCategory.id, payload);
      await loadCategories();

      setSuccess('Kategori başarıyla güncellendi');
      setShowEditModal(false);
      setSelectedCategory(null);
      setEditCategory({});
    } catch (error: any) {
      setError('Kategori güncellenirken hata oluştu');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;

    try {
      await categoriesService.delete(categoryId);
      await loadCategories();
      setSuccess('Kategori başarıyla silindi');
    } catch (error: any) {
      setError('Kategori silinirken hata oluştu');
    }
  };

  const handleToggleActive = async (categoryId: string, currentStatus: boolean) => {
    try {
      await categoriesService.update(categoryId, { is_active: !currentStatus } as any);
      await loadCategories();
      setSuccess('Kategori durumu güncellendi');
    } catch (error) {
      setError('Kategori durumu güncellenirken hata oluştu');
    }
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setEditCategory({
      id: category.id,
      name: category.name,
      description: category.description,
      parent_id: category.parent_id,
      expense_accounting_code: category.expense_accounting_code || '',
      revenue_accounting_code: category.revenue_accounting_code || '',
      revenue_vat_accounting_code: category.revenue_vat_accounting_code || '',
      revenue_vat_rate: category.revenue_vat_rate || 0,
      expense_vat_accounting_code: category.expense_vat_accounting_code || '',
      expense_vat_rate: category.expense_vat_rate || 0
    });
    setShowEditModal(true);
  };

  const getMainCategories = () => {
    return categories.filter(cat => !cat.parent_id);
  };

  const getSubCategories = (parentId: string) => {
    return categories
      .filter(cat => cat.parent_id === parentId)
      .sort((a, b) => {
        const aKey = getCategorySortKey(a);
        const bKey = getCategorySortKey(b);
        return aKey.localeCompare(bKey, 'tr', { numeric: true, sensitivity: 'base' });
      });
  };

  const getCategoryType = (category: Category) => {
    if (!category.parent_id) return 'Ana Kategori';
    return 'Alt Kategori';
  };

  const getParentCategoryName = (category: Category) => {
    if (!category.parent_id) return '-';
    const parent = categories.find(cat => cat.id === category.parent_id);
    return parent ? parent.name : 'Bilinmeyen';
  };

  // Drag & Drop fonksiyonu
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId !== destination.droppableId) return;

    const parentId = source.droppableId;
    const subCategories = categories.filter(cat => cat.parent_id === parentId).sort((a,b)=> (a.sort_order??999)-(b.sort_order??999));
    const reordered = Array.from(subCategories);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    // Yeni sıraları Supabase'e yaz
    for (let i=0;i<reordered.length;i++) {
      const cat = reordered[i];
      await categoriesService.update(cat.id, { sort_order: i+1 } as any);
    }
    await loadCategories();
  };

  // Yukarı/Aşağı taşıma fonksiyonları
  const moveSubCategoryUp = (categoryId: string, parentId: string) => {
    console.log('moveSubCategoryUp called:', { categoryId, parentId });
    
    // Önce sıralanmış alt kategorileri al
    const subCategories = categories
      .filter(cat => cat.parent_id === parentId)
      .sort((a, b) => {
        const aOrder = a.sort_order ?? 999;
        const bOrder = b.sort_order ?? 999;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return (a.id || '').localeCompare(b.id || '', 'tr', { numeric: true, sensitivity: 'base' });
      });
    
    console.log('subCategories found (sorted):', subCategories.map(c => ({ id: c.id, name: c.name, sort_order: c.sort_order })));
    const currentIndex = subCategories.findIndex(cat => cat.id === categoryId);
    console.log('currentIndex:', currentIndex);
    
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const reorderedSubCategories = Array.from(subCategories);
      const [movedItem] = reorderedSubCategories.splice(currentIndex, 1);
      reorderedSubCategories.splice(newIndex, 0, movedItem);

      const updatedSubCategories = reorderedSubCategories.map((cat, index) => ({
        ...cat,
        sort_order: index + 1,
        updated_at: new Date().toISOString()
      }));

      const updatedCategories = categories.map(cat => {
        if (cat.parent_id === parentId) {
          const updated = updatedSubCategories.find(updated => updated.id === cat.id);
          return updated || cat;
        }
        return cat;
      });

      console.log('Updated categories:', updatedCategories.filter(c => c.parent_id === parentId).map(c => ({ id: c.id, name: c.name, sort_order: c.sort_order })));
      setCategories(updatedCategories);
      
    } else {
      console.log('Cannot move up - already at top');
    }
  };

  const moveSubCategoryDown = (categoryId: string, parentId: string) => {
    console.log('moveSubCategoryDown called:', { categoryId, parentId });
    
    // Önce sıralanmış alt kategorileri al
    const subCategories = categories
      .filter(cat => cat.parent_id === parentId)
      .sort((a, b) => {
        const aOrder = a.sort_order ?? 999;
        const bOrder = b.sort_order ?? 999;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return (a.id || '').localeCompare(b.id || '', 'tr', { numeric: true, sensitivity: 'base' });
      });
    
    console.log('subCategories found (sorted):', subCategories.map(c => ({ id: c.id, name: c.name, sort_order: c.sort_order })));
    const currentIndex = subCategories.findIndex(cat => cat.id === categoryId);
    console.log('currentIndex:', currentIndex);
    
    if (currentIndex < subCategories.length - 1) {
      const newIndex = currentIndex + 1;
      const reorderedSubCategories = Array.from(subCategories);
      const [movedItem] = reorderedSubCategories.splice(currentIndex, 1);
      reorderedSubCategories.splice(newIndex, 0, movedItem);

      const updatedSubCategories = reorderedSubCategories.map((cat, index) => ({
        ...cat,
        sort_order: index + 1,
        updated_at: new Date().toISOString()
      }));

      const updatedCategories = categories.map(cat => {
        if (cat.parent_id === parentId) {
          const updated = updatedSubCategories.find(updated => updated.id === cat.id);
          return updated || cat;
        }
        return cat;
      });

      console.log('Updated categories:', updatedCategories.filter(c => c.parent_id === parentId).map(c => ({ id: c.id, name: c.name, sort_order: c.sort_order })));
      setCategories(updatedCategories);
      
    } else {
      console.log('Cannot move down - already at bottom');
    }
  };

  // Excel Export Fonksiyonu
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await ExcelUtils.exportCategories(categories);
      setSuccess('Excel dosyası başarıyla indirildi!');
    } catch (error) {
      console.error('Excel export hatası:', error);
      setError('Excel dosyası oluşturulurken bir hata oluştu.');
    } finally {
      setExporting(false);
    }
  };

  // Excel Import Fonksiyonu
  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = ExcelImportUtils.validateExcelFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Dosya geçersiz');
      return;
    }

    setImporting(true);
    try {
      const importedCategories = await ExcelImportUtils.importCategories(file);
      const validCategories = importedCategories.filter(category => category.name && category.name.trim() !== '');
      const parentCategories = validCategories.filter(cat => !cat.parent_name || cat.parent_name === 'Ana Kategori');
      const childCategories = validCategories.filter(cat => cat.parent_name && cat.parent_name !== 'Ana Kategori');

      for (const category of parentCategories) {
        await categoriesService.create({ name: category.name, description: category.description || '', is_active: category.is_active, parent_id: null } as any);
      }
      await loadCategories();

      for (const category of childCategories) {
        const parent = categories.find(c => c.name === category.parent_name);
        if (parent) {
          await categoriesService.create({ name: category.name, description: category.description || '', is_active: category.is_active, parent_id: parent.id } as any);
        }
      }
      await loadCategories();

      setSuccess(`${validCategories.length} kategori başarıyla içe aktarıldı`);
    } catch (error) {
      console.error('Excel import hatası:', error);
      setError('Excel dosyası okunurken bir hata oluştu.');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Categories görüntüleme yetkisi kontrolü
  if (!canView(Module.CATEGORIES)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Kategoriler sayfasına erişim için yetkiniz bulunmuyor.</p>
          <Link href="/" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
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
    .filter(c => !c.parent_id)
    .sort(compareByCategoryId)
    .filter((mainCategory) => {
      const subCategories = categories
        .filter(cat => cat.parent_id === mainCategory.id)
        .sort(compareByCategoryId);
      const visibleMain = isCategoryVisibleByStatsFilter(mainCategory);
      const visibleSubCategories = subCategories.filter(isCategoryVisibleByStatsFilter);
      return visibleMain || visibleSubCategories.length > 0;
    });
  const paginatedMainCategoryGroups = paginateItems(visibleMainCategoryGroups, page, pageSize);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0">
      <div className="w-full min-w-0 flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Kategori Yönetimi</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Ana kategorileri ve alt kategorileri yönetin</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="bg-green-600 dark:bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 disabled:opacity-50 transition-colors duration-200 text-xs"
            >
              {exporting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  İndiriliyor...
                </>
              ) : (
                <>
                  📊 Excel İndir
                </>
              )}
            </button>
            <label className="bg-orange-600 dark:bg-orange-500 text-white px-2 py-1 rounded-md hover:bg-orange-700 dark:hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 disabled:opacity-50 cursor-pointer transition-colors duration-200 text-xs">
              {importing ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Yükleniyor...
                </>
              ) : (
                <>
                  📥 Excel Yükle
                </>
              )}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
                disabled={importing}
              />
            </label>
            {canCreate(Module.CATEGORIES) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 dark:bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200 text-xs"
              >
                Yeni Kategori Ekle
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-2 py-2 rounded-md transition-colors duration-200 text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-2 py-2 rounded-md transition-colors duration-200 text-xs">
            {success}
          </div>
        )}

        {/* İstatistikler */}
        <div className="flex flex-nowrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setStatsFilter('all')}
            className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${statsFilter === 'all' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}
          >
            <div className="flex items-center">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Toplam</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{categories.length}</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatsFilter('main')}
            className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${statsFilter === 'main' ? 'bg-green-600 dark:bg-green-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}
          >
            <div className="flex items-center">
              <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Ana Kategori</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{categories.filter(c => !c.parent_id).length}</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatsFilter('sub')}
            className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${statsFilter === 'sub' ? 'bg-purple-600 dark:bg-purple-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}
          >
            <div className="flex items-center">
              <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 11h.01M7 15h.01M11 7h.01M11 11h.01M11 15h.01M15 7h.01M15 11h.01M15 15h.01" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Alt Kategori</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{categories.filter(c => c.parent_id).length}</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatsFilter('active')}
            className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${statsFilter === 'active' ? 'bg-orange-600 dark:bg-orange-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}
          >
            <div className="flex items-center">
              <div className="p-1 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <svg className="w-3 h-3 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Aktif</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{categories.filter(c => c.is_active).length}</p>
              </div>
            </div>
          </button>
        </div>

        {/* Categories List - Grouped by Main Categories */}
        <div className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1 pb-4">
          {/* Ana Kategoriler ve Alt Kategorileri */}
          {paginatedMainCategoryGroups.items.map((mainCategory) => {
            const subCategories = categories
              .filter(cat => cat.parent_id === mainCategory.id)
              .sort(compareByCategoryId);
            const visibleMain = isCategoryVisibleByStatsFilter(mainCategory);
            const visibleSubCategories = subCategories.filter(isCategoryVisibleByStatsFilter);
            const shouldRenderGroup = visibleMain || visibleSubCategories.length > 0;
            if (!shouldRenderGroup) return null;
            
            return (
              <div key={mainCategory.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">
                {/* Ana Kategori Başlığı */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">📂</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {mainCategory.name}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {mainCategory.description || 'Ana Kategori'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        mainCategory.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {mainCategory.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                      <div className="flex items-center space-x-1">
                        {canEdit(Module.CATEGORIES) && (
                          <button
                            onClick={() => openEditModal(mainCategory)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors duration-200"
                            title="Düzenle"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {canDelete(Module.CATEGORIES) && (
                          <button
                            onClick={() => handleDeleteCategory(mainCategory.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-200"
                            title="Sil"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Ana Kategori Muhasebe Bilgileri */}
                  <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Gider:</span>
                      <span className="ml-1 font-mono text-gray-900 dark:text-white">
                        {mainCategory.expense_accounting_code || '-'}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        KDV: {mainCategory.expense_vat_accounting_code || '-'} ({mainCategory.expense_vat_rate || 0}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Gelir:</span>
                      <span className="ml-1 font-mono text-gray-900 dark:text-white">
                        {mainCategory.revenue_accounting_code || '-'}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        KDV: {mainCategory.revenue_vat_accounting_code || '-'} ({mainCategory.revenue_vat_rate || 0}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alt Kategoriler Listesi */}
                {visibleSubCategories.length > 0 && (
                  <div className="px-4 py-3">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-4 h-4 bg-purple-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs">📄</span>
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Alt Kategoriler ({visibleSubCategories.length}) - Yukarı/Aşağı okları ile sıralayabilirsiniz
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {visibleSubCategories.map((subCategory, index) => (
                        <div 
                          key={subCategory.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 dark:text-purple-400 text-xs font-bold">{index + 1}</span>
                            </div>
                            <div className="text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xs font-medium text-gray-900 dark:text-white">
                                {subCategory.name}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {subCategory.description || 'Alt kategori'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            {/* Muhasebe Kodları */}
                            <div className="hidden md:flex items-center space-x-6 text-xs">
                              <div className="text-center">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Gider:</span>
                                <span className="font-mono text-gray-700 dark:text-gray-300 ml-1">
                                  {subCategory.expense_accounting_code || '-'}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400 ml-2">
                                  KDV: {subCategory.expense_vat_accounting_code || '-'} ({subCategory.expense_vat_rate || 0}%)
                                </span>
                              </div>
                              <div className="text-center">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Gelir:</span>
                                <span className="font-mono text-gray-700 dark:text-gray-300 ml-1">
                                  {subCategory.revenue_accounting_code || '-'}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400 ml-2">
                                  KDV: {subCategory.revenue_vat_accounting_code || '-'} ({subCategory.revenue_vat_rate || 0}%)
                                </span>
                              </div>
                            </div>
                            
                            {/* Durum */}
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              subCategory.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {subCategory.is_active ? 'Aktif' : 'Pasif'}
                            </span>
                            
                            {/* İşlem Butonları */}
                            <div className="flex items-center space-x-1">
                              {/* Sıralama Butonları */}
                              <button
                                onClick={() => moveSubCategoryUp(subCategory.id, subCategory.parent_id!)}
                                disabled={index === 0}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Yukarı Taşı"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => moveSubCategoryDown(subCategory.id, subCategory.parent_id!)}
                                disabled={index === visibleSubCategories.length - 1}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Aşağı Taşı"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {canEdit(Module.CATEGORIES) && (
                                <button
                                  onClick={() => openEditModal(subCategory)}
                                  className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors duration-200"
                                  title="Düzenle"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}
                              {canDelete(Module.CATEGORIES) && (
                                <button
                                  onClick={() => handleDeleteCategory(subCategory.id)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-200"
                                  title="Sil"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
          {categories.filter(c => !c.parent_id).length === 0 && (
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
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
              setNewCategory({
                id: '',
                name: '',
                description: '',
                parent_id: '',
                expense_accounting_code: '',
                revenue_accounting_code: '',
                revenue_vat_accounting_code: '',
                revenue_vat_rate: 0,
                expense_vat_accounting_code: '',
                expense_vat_rate: 0,
                isMainCategory: false
              });
            }
          }}
        >
          <div className="relative top-20 mx-auto p-2 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Yeni Kategori Ekle</h3>
              <form 
                onSubmit={handleCreateCategory} 
                className="space-y-3"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowCreateModal(false);
                    setNewCategory({
                      id: '',
                      name: '',
                      description: '',
                      parent_id: '',
                      expense_accounting_code: '',
                      revenue_accounting_code: '',
                      revenue_vat_accounting_code: '',
                      revenue_vat_rate: 0,
                      expense_vat_accounting_code: '',
                      expense_vat_rate: 0,
                      isMainCategory: true
                    });
                  }
                }}
              >
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kategori Tipi *
                  </label>
                  <select
                    value={newCategory.isMainCategory ? 'main' : 'sub'}
                    onChange={(e) => setNewCategory({...newCategory, isMainCategory: e.target.value === 'main'})}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                  >
                    <option value="main">Ana Kategori</option>
                    <option value="sub">Alt Kategori</option>
                  </select>
                </div>
                
                {newCategory.isMainCategory && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kategori ID *
                    </label>
                    <input
                      type="text"
                      value={newCategory.id}
                      onChange={(e) => setNewCategory({...newCategory, id: e.target.value})}
                      required
                      placeholder="CAT_008"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kategori Adı *
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    required
                    autoFocus
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                    rows={2}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                  />
                </div>
                {!newCategory.isMainCategory && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ana Kategori *
                    </label>
                    <select
                      value={newCategory.parent_id}
                      onChange={(e) => setNewCategory({...newCategory, parent_id: e.target.value})}
                      required
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                    >
                      <option value="">Ana Kategori Seçin</option>
                      {categories.filter(c => !c.parent_id).map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gider Muhasebe Kodu
                    </label>
                    <input
                      type="text"
                      value={newCategory.expense_accounting_code}
                      onChange={(e) => setNewCategory({...newCategory, expense_accounting_code: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gelir Muhasebe Kodu
                    </label>
                    <input
                      type="text"
                      value={newCategory.revenue_accounting_code}
                      onChange={(e) => setNewCategory({...newCategory, revenue_accounting_code: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                    />
                  </div>
                </div>
                
                {/* KDV Alanları */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">KDV Bilgileri</h4>
                  
                  {/* Gelir KDV */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gelir KDV Muhasebe Kodu
                      </label>
                      <input
                        type="text"
                        value={newCategory.revenue_vat_accounting_code}
                        onChange={(e) => setNewCategory({...newCategory, revenue_vat_accounting_code: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gelir KDV Oranı (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={newCategory.revenue_vat_rate}
                        onChange={(e) => setNewCategory({...newCategory, revenue_vat_rate: parseFloat(e.target.value) || 0})}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                      />
                    </div>
                  </div>
                  
                  {/* Gider KDV */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gider KDV Muhasebe Kodu
                      </label>
                      <input
                        type="text"
                        value={newCategory.expense_vat_accounting_code}
                        onChange={(e) => setNewCategory({...newCategory, expense_vat_accounting_code: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gider KDV Oranı (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={newCategory.expense_vat_rate}
                        onChange={(e) => setNewCategory({...newCategory, expense_vat_rate: parseFloat(e.target.value) || 0})}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200 text-xs"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 text-xs"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
              setSelectedCategory(null);
            }
          }}
        >
          <div className="relative top-20 mx-auto p-2 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Kategori Düzenle</h3>
              <form 
                onSubmit={handleUpdateCategory} 
                className="space-y-3"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowEditModal(false);
                    setSelectedCategory(null);
                  }
                }}
              >
                {!selectedCategory?.parent_id && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kategori ID *
                    </label>
                    <input
                      type="text"
                      value={(editCategory as any).code || selectedCategory.code || ''}
                      onChange={(e) => setEditCategory({ ...editCategory, code: e.target.value } as any)}
                      required
                      autoFocus
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kategori Adı *
                  </label>
                  <input
                    type="text"
                    value={editCategory.name || ''}
                    onChange={(e) => setEditCategory({...editCategory, name: e.target.value})}
                    required
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    value={editCategory.description || ''}
                    onChange={(e) => setEditCategory({...editCategory, description: e.target.value})}
                    rows={2}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Üst Kategori
                  </label>
                  <select
                    value={editCategory.parent_id || ''}
                    onChange={(e) => setEditCategory({...editCategory, parent_id: e.target.value})}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                  >
                    <option value="">Ana Kategori</option>
                    {categories.filter(c => !c.parent_id && c.id !== selectedCategory.id).map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gider Muhasebe Kodu
                    </label>
                    <input
                      type="text"
                      value={editCategory.expense_accounting_code || ''}
                      onChange={(e) => setEditCategory({...editCategory, expense_accounting_code: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gelir Muhasebe Kodu
                    </label>
                    <input
                      type="text"
                      value={editCategory.revenue_accounting_code || ''}
                      onChange={(e) => setEditCategory({...editCategory, revenue_accounting_code: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                    />
                  </div>
                </div>
                
                {/* KDV Alanları */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">KDV Bilgileri</h4>
                  
                  {/* Gelir KDV */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gelir KDV Muhasebe Kodu
                      </label>
                      <input
                        type="text"
                        value={editCategory.revenue_vat_accounting_code || ''}
                        onChange={(e) => setEditCategory({...editCategory, revenue_vat_accounting_code: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gelir KDV Oranı (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={editCategory.revenue_vat_rate || 0}
                        onChange={(e) => setEditCategory({...editCategory, revenue_vat_rate: parseFloat(e.target.value) || 0})}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                      />
                    </div>
                  </div>
                  
                  {/* Gider KDV */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gider KDV Muhasebe Kodu
                      </label>
                      <input
                        type="text"
                        value={editCategory.expense_vat_accounting_code || ''}
                        onChange={(e) => setEditCategory({...editCategory, expense_vat_accounting_code: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gider KDV Oranı (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={editCategory.expense_vat_rate || 0}
                        onChange={(e) => setEditCategory({...editCategory, expense_vat_rate: parseFloat(e.target.value) || 0})}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200 text-xs"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 text-xs"
                  >
                    Güncelle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 