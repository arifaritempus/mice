'use client';

import { useState, useEffect } from 'react';
import PaginationControls from '@/components/PaginationControls';
import LoadingSpinner from '@/components/LoadingSpinner';
import { serviceTypesService } from '@/lib/supabaseService';
import { DEFAULT_PAGE_SIZE, paginateItems } from '@/types/pagination';
import { usePermissions, Module } from '@/lib/permissions';

interface ServiceType {
  id: string;
  name: string;
  code: string;
  description: string;
  expense_accounting_code: string;
  revenue_accounting_code: string;
  revenue_vat_code: string;
  revenue_vat_rate: number;
  expense_vat_code: string;
  expense_vat_rate: number;
  is_active: boolean;
  notes: string;
  sort_order?: number;
  created_at: string;
  updated_at: string;
}

export default function ServiceTypesPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [newServiceType, setNewServiceType] = useState({
    name: '',
    code: '',
    description: '',
    expense_accounting_code: '',
    revenue_accounting_code: '',
    revenue_vat_code: '',
    revenue_vat_rate: 0,
    expense_vat_code: '',
    expense_vat_rate: 0,
    is_active: true,
    notes: ''
  });



  // Sıralama fonksiyonu
  const sortServiceTypes = (list: ServiceType[]) => {
    return [...list].sort((a, b) => {
      const aOrder = a.sort_order ?? 999;
      const bOrder = b.sort_order ?? 999;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return (a.name || '').localeCompare(b.name || '', 'tr', { sensitivity: 'base' });
    });
  };

  const loadServiceTypes = async () => {
    try {
      const rows = await serviceTypesService.getAll();
      const normalized: ServiceType[] = (rows || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        description: r.description || '',
        expense_accounting_code: r.expense_accounting_code || '',
        revenue_accounting_code: r.revenue_accounting_code || '',
        revenue_vat_code: r.revenue_vat_code || '',
        revenue_vat_rate: r.revenue_vat_rate || 0,
        expense_vat_code: r.expense_vat_code || '',
        expense_vat_rate: r.expense_vat_rate || 0,
        is_active: r.is_active ?? true,
        notes: r.notes || '',
        sort_order: r.sort_order ?? 999,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));
      setServiceTypes(sortServiceTypes(normalized));
      setLoading(false);
    } catch (error: any) {
      setError('Hizmet türleri yüklenirken hata oluştu');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServiceTypes();
  }, []);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.SUPPLIERS)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
          <a href="/suppliers" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Tedarikçilere Dön
          </a>
        </div>
      </div>
    );
  }

  const handleCreateServiceType = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await serviceTypesService.create({
        name: newServiceType.name,
        code: newServiceType.code,
        description: newServiceType.description,
        expense_accounting_code: newServiceType.expense_accounting_code,
        revenue_accounting_code: newServiceType.revenue_accounting_code,
        revenue_vat_code: newServiceType.revenue_vat_code,
        revenue_vat_rate: newServiceType.revenue_vat_rate,
        expense_vat_code: newServiceType.expense_vat_code,
        expense_vat_rate: newServiceType.expense_vat_rate,
        is_active: newServiceType.is_active,
        notes: newServiceType.notes,
        sort_order: (serviceTypes.length || 0) + 1,
      } as any);
      await loadServiceTypes();

      setSuccess('Hizmet türü başarıyla oluşturuldu');
      setShowCreateModal(false);
      setNewServiceType({
        name: '',
        code: '',
        description: '',
        expense_accounting_code: '',
        revenue_accounting_code: '',
        revenue_vat_code: '',
        revenue_vat_rate: 0,
        expense_vat_code: '',
        expense_vat_rate: 0,
        is_active: true,
        notes: ''
      });
    } catch (error: any) {
      setError(error.message || 'Hizmet türü oluşturulurken hata oluştu');
    }
  };

  const handleEditServiceType = (serviceType: ServiceType) => {
    setEditingServiceType(serviceType);
    setShowEditModal(true);
  };

  const handleUpdateServiceType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServiceType) return;

    setError('');
    setSuccess('');

    try {
      await serviceTypesService.update(editingServiceType.id, {
        name: editingServiceType.name,
        code: editingServiceType.code,
        description: editingServiceType.description,
        expense_accounting_code: editingServiceType.expense_accounting_code,
        revenue_accounting_code: editingServiceType.revenue_accounting_code,
        revenue_vat_code: editingServiceType.revenue_vat_code,
        revenue_vat_rate: editingServiceType.revenue_vat_rate,
        expense_vat_code: editingServiceType.expense_vat_code,
        expense_vat_rate: editingServiceType.expense_vat_rate,
        is_active: editingServiceType.is_active,
        notes: editingServiceType.notes,
      } as any);
      await loadServiceTypes();

      setSuccess('Hizmet türü başarıyla güncellendi');
      setShowEditModal(false);
      setEditingServiceType(null);
    } catch (error: any) {
      setError('Hizmet türü güncellenirken hata oluştu');
    }
  };

  const handleDeleteServiceType = async (id: string) => {
    if (!confirm('Bu hizmet türünü silmek istediğinizden emin misiniz?')) return;

    try {
      await serviceTypesService.delete(id);
      await loadServiceTypes();

      setSuccess('Hizmet türü başarıyla silindi');
    } catch (error: any) {
      setError('Hizmet türü silinirken hata oluştu');
    }
  };

  // Yukarı/Aşağı taşıma fonksiyonları
  const moveServiceTypeUp = async (serviceTypeId: string) => {
    console.log('moveServiceTypeUp called:', { serviceTypeId });

    // Önce sıralanmış service typesleri al
    const sortedServiceTypes = sortServiceTypes(serviceTypes);
    console.log('sortedServiceTypes found:', sortedServiceTypes.map(st => ({ id: st.id, name: st.name, sort_order: st.sort_order })));
    const currentIndex = sortedServiceTypes.findIndex(st => st.id === serviceTypeId);
    console.log('currentIndex:', currentIndex);

    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const reorderedServiceTypes = Array.from(sortedServiceTypes);
      const [movedItem] = reorderedServiceTypes.splice(currentIndex, 1);
      reorderedServiceTypes.splice(newIndex, 0, movedItem);

      // sort_order değerlerini güncelle
      const updatedServiceTypes = reorderedServiceTypes.map((st, index) => ({
        ...st,
        sort_order: index + 1,
        updated_at: new Date().toISOString()
      }));

      console.log('Updated service types:', updatedServiceTypes.map(st => ({ id: st.id, name: st.name, sort_order: st.sort_order })));
      // Supabase'e yaz
      for (const st of updatedServiceTypes) {
        await serviceTypesService.update(st.id, { sort_order: st.sort_order } as any);
      }
      await loadServiceTypes();
    } else {
      console.log('Cannot move up - already at top');
    }
  };

  const moveServiceTypeDown = async (serviceTypeId: string) => {
    console.log('moveServiceTypeDown called:', { serviceTypeId });

    // Önce sıralanmış service typesleri al
    const sortedServiceTypes = sortServiceTypes(serviceTypes);
    console.log('sortedServiceTypes found:', sortedServiceTypes.map(st => ({ id: st.id, name: st.name, sort_order: st.sort_order })));
    const currentIndex = sortedServiceTypes.findIndex(st => st.id === serviceTypeId);
    console.log('currentIndex:', currentIndex);

    if (currentIndex < sortedServiceTypes.length - 1) {
      const newIndex = currentIndex + 1;
      const reorderedServiceTypes = Array.from(sortedServiceTypes);
      const [movedItem] = reorderedServiceTypes.splice(currentIndex, 1);
      reorderedServiceTypes.splice(newIndex, 0, movedItem);

      // sort_order değerlerini güncelle
      const updatedServiceTypes = reorderedServiceTypes.map((st, index) => ({
        ...st,
        sort_order: index + 1,
        updated_at: new Date().toISOString()
      }));

      console.log('Updated service types:', updatedServiceTypes.map(st => ({ id: st.id, name: st.name, sort_order: st.sort_order })));
      for (const st of updatedServiceTypes) {
        await serviceTypesService.update(st.id, { sort_order: st.sort_order } as any);
      }
      await loadServiceTypes();
    } else {
      console.log('Cannot move down - already at bottom');
    }
  };



  const stats = {
    total: serviceTypes.length,
    active: serviceTypes.filter(s => s.is_active).length
  };
  const sortedServiceTypes = sortServiceTypes(serviceTypes);
  const paginatedServiceTypes = paginateItems(sortedServiceTypes, page, pageSize);

  if (loading) {
    return <LoadingSpinner message="Servis tipleri yükleniyor..." />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0">
      <div className="w-full min-w-0 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Tedarikçi Hizmet Kategorisi</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Transfer, rehber, otel ve diğer hizmet türlerini yönetin</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 dark:bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200 text-xs"
          >
            Yeni Hizmet Türü Ekle
          </button>
        </div>

        {/* İstatistikler */}
        <div className="flex flex-nowrap gap-2 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0">
            <div className="flex items-center">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Toplam Tür</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{serviceTypes.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0">
            <div className="flex items-center">
              <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Aktif Tür</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{serviceTypes.filter(st => st.is_active).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0">
            <div className="flex items-center">
              <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Transfer</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{serviceTypes.filter(st => st.code === 'TRANSFER').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0">
            <div className="flex items-center">
              <div className="p-1 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <svg className="w-3 h-3 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Rehber</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{serviceTypes.filter(st => st.code === 'GUIDE').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hizmet Türleri Listesi */}
        <div className="space-y-3 overflow-auto w-full flex-1">
          {paginatedServiceTypes.items.map((serviceType, localIndex) => {
            const index = (paginatedServiceTypes.page - 1) * paginatedServiceTypes.pageSize + localIndex;
            return (
            <div key={serviceType.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {serviceType.name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {serviceType.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Kod: <span className="font-mono">{serviceType.code}</span>
                        </span>
                        {serviceType.notes && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Not: {serviceType.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Muhasebe ve KDV Kodları */}
                    <div className="hidden lg:flex items-center space-x-8 text-xs">
                      <div className="text-center">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Gider:</span>
                        <span className="font-mono text-gray-700 dark:text-gray-300 ml-1">
                          {serviceType.expense_accounting_code || '-'}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Gelir:</span>
                        <span className="font-mono text-gray-700 dark:text-gray-300 ml-1">
                          {serviceType.revenue_accounting_code || '-'}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Gelir KDV:</span>
                        <span className="font-mono text-gray-700 dark:text-gray-300 ml-1">
                          {serviceType.revenue_vat_code || '-'} ({serviceType.revenue_vat_rate || 0}%)
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Gider KDV:</span>
                        <span className="font-mono text-gray-700 dark:text-gray-300 ml-1">
                          {serviceType.expense_vat_code || '-'} ({serviceType.expense_vat_rate || 0}%)
                        </span>
                      </div>
                    </div>

                    {/* Durum */}
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      serviceType.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {serviceType.is_active ? 'Aktif' : 'Pasif'}
                    </span>

                    {/* İşlem Butonları */}
                    <div className="flex items-center space-x-1">
                      {/* Sıralama Butonları */}
                      <button
                        onClick={() => moveServiceTypeUp(serviceType.id)}
                        disabled={index === 0}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Yukarı Taşı"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveServiceTypeDown(serviceType.id)}
                        disabled={index === serviceTypes.length - 1}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Aşağı Taşı"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditServiceType(serviceType)}
                        className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors duration-200"
                        title="Düzenle"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteServiceType(serviceType.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-200"
                        title="Sil"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )})}

          {/* Hizmet Türü Yoksa Mesaj */}
          {serviceTypes.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔧</span>
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Henüz hizmet türü eklenmemiş
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Yeni hizmet türü ekleyerek başlayın
              </p>
            </div>
          )}
        </div>
        <PaginationControls
          page={paginatedServiceTypes.page}
          pageSize={paginatedServiceTypes.pageSize}
          total={paginatedServiceTypes.total}
          totalPages={paginatedServiceTypes.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          preferenceKey="service_types_page_size"
          compactRight
        />

        {/* Yeni Hizmet Türü Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-2 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Yeni Hizmet Türü Ekle</h3>
                <form onSubmit={handleCreateServiceType}>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Hizmet Türü Adı</label>
                        <input
                          type="text"
                          value={newServiceType.name}
                          onChange={(e) => setNewServiceType({...newServiceType, name: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Kod</label>
                        <input
                          type="text"
                          value={newServiceType.code}
                          onChange={(e) => setNewServiceType({...newServiceType, code: e.target.value.toUpperCase()})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Açıklama</label>
                      <textarea
                        value={newServiceType.description}
                        onChange={(e) => setNewServiceType({...newServiceType, description: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                        rows={2}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Gider Muhasebe Bağlantı Kodu</label>
                        <input
                          type="text"
                          value={newServiceType.expense_accounting_code}
                          onChange={(e) => setNewServiceType({...newServiceType, expense_accounting_code: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 120.01.001"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Gelir Muhasebe Bağlantı Kodu</label>
                        <input
                          type="text"
                          value={newServiceType.revenue_accounting_code}
                          onChange={(e) => setNewServiceType({...newServiceType, revenue_accounting_code: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 120.01.001"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Gelir KDV Kodu</label>
                        <input
                          type="text"
                          value={newServiceType.revenue_vat_code}
                          onChange={(e) => setNewServiceType({...newServiceType, revenue_vat_code: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 391.01.001"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Gelir KDV Oranı (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={newServiceType.revenue_vat_rate}
                          onChange={(e) => setNewServiceType({...newServiceType, revenue_vat_rate: parseFloat(e.target.value) || 0})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 18"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Gider KDV Kodu</label>
                        <input
                          type="text"
                          value={newServiceType.expense_vat_code}
                          onChange={(e) => setNewServiceType({...newServiceType, expense_vat_code: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 191.01.001"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Gider KDV Oranı (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={newServiceType.expense_vat_rate}
                          onChange={(e) => setNewServiceType({...newServiceType, expense_vat_rate: parseFloat(e.target.value) || 0})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 18"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Notlar</label>
                      <textarea
                        value={newServiceType.notes}
                        onChange={(e) => setNewServiceType({...newServiceType, notes: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                        rows={2}
                        placeholder="Hizmet türü ile ilgili özel notlar..."
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-600"
                        checked={newServiceType.is_active}
                        onChange={(e) => setNewServiceType({ ...newServiceType, is_active: e.target.checked })}
                      />
                      <label htmlFor="isActive" className="ml-2 block text-xs text-gray-900 dark:text-gray-300">Aktif</label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-gray-300"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-700 dark:hover:bg-blue-600"
                    >
                      Kaydet
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Düzenleme Modal */}
        {showEditModal && editingServiceType && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-2 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Hizmet Türü Düzenle</h3>
                <form onSubmit={handleUpdateServiceType}>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Hizmet Türü Adı</label>
                        <input
                          type="text"
                          value={editingServiceType.name}
                          onChange={(e) => setEditingServiceType({...editingServiceType, name: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Kod</label>
                        <input
                          type="text"
                          value={editingServiceType.code}
                          onChange={(e) => setEditingServiceType({...editingServiceType, code: e.target.value.toUpperCase()})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Açıklama</label>
                      <textarea
                        value={editingServiceType.description}
                        onChange={(e) => setEditingServiceType({...editingServiceType, description: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                        rows={2}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Gider Muhasebe Bağlantı Kodu</label>
                        <input
                          type="text"
                          value={editingServiceType.expense_accounting_code || ''}
                          onChange={(e) => setEditingServiceType({...editingServiceType, expense_accounting_code: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 120.01.001"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Gelir Muhasebe Bağlantı Kodu</label>
                        <input
                          type="text"
                          value={editingServiceType.revenue_accounting_code || ''}
                          onChange={(e) => setEditingServiceType({...editingServiceType, revenue_accounting_code: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 120.01.001"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Gelir KDV Kodu</label>
                        <input
                          type="text"
                          value={editingServiceType.revenue_vat_code || ''}
                          onChange={(e) => setEditingServiceType({...editingServiceType, revenue_vat_code: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 391.01.001"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Gelir KDV Oranı (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={editingServiceType.revenue_vat_rate || 0}
                          onChange={(e) => setEditingServiceType({...editingServiceType, revenue_vat_rate: parseFloat(e.target.value) || 0})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 18"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Gider KDV Kodu</label>
                        <input
                          type="text"
                          value={editingServiceType.expense_vat_code || ''}
                          onChange={(e) => setEditingServiceType({...editingServiceType, expense_vat_code: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 191.01.001"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Gider KDV Oranı (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={editingServiceType.expense_vat_rate || 0}
                          onChange={(e) => setEditingServiceType({...editingServiceType, expense_vat_rate: parseFloat(e.target.value) || 0})}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 18"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Notlar</label>
                      <textarea
                        value={editingServiceType.notes}
                        onChange={(e) => setEditingServiceType({...editingServiceType, notes: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                        rows={2}
                        placeholder="Hizmet türü ile ilgili özel notlar..."
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        id="isActiveEdit"
                        name="isActiveEdit"
                        type="checkbox"
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-600"
                        checked={editingServiceType.is_active}
                        onChange={(e) => setEditingServiceType({ ...editingServiceType, is_active: e.target.checked })}
                      />
                      <label htmlFor="isActiveEdit" className="ml-2 block text-xs text-gray-900 dark:text-gray-300">Aktif</label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingServiceType(null);
                      }}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-gray-300"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-700 dark:hover:bg-blue-600"
                    >
                      Güncelle
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Hata ve Başarı Mesajları */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => setError('')}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <span className="sr-only">Kapat</span>
              <svg className="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Kapat</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </button>
          </div>
        )}

        {success && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
            <span className="block sm:inline">{success}</span>
            <button
              onClick={() => setSuccess('')}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <span className="sr-only">Kapat</span>
              <svg className="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Kapat</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 