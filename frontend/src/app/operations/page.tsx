'use client';

import { useState, useEffect } from 'react';
import { ExcelUtils, ExcelImportUtils } from '@/utils/excelUtils';
import { usePermissions, Module } from '@/lib/permissions';
import { quotesService, suppliersService } from '@/lib/supabaseService';

interface Supplier {
  id: string;
  name: string;
  type: string;
  contact_person: string;
  phone: string;
  email: string;
  is_active: boolean;
}

interface Operation {
  id: string;
  quote_id: string;
  quote_reference: string;
  supplier_id: string;
  supplier_name: string;
  operation_type: 'sejour' | 'transfer' | 'guide' | 'part_time' | 'extra_service';
  service_date: string;
  service_description: string;
  quantity: number;
  unit_price: number;
  currency: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  created_at: string;
  updated_at: string;
}

export default function OperationsPage() {
  const { canView, canCreate, canEdit, canDelete, userRole, loading: permissionsLoading } = usePermissions();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newOperation, setNewOperation] = useState({
    quote_id: '',
    supplier_id: '',
    operation_type: 'sejour' as const,
    service_date: '',
    service_description: '',
    quantity: 1,
    unit_price: 0,
    currency: 'EUR',
    status: 'pending' as const,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setOperations([]);
      const [supplierList, quoteList] = await Promise.all([
        suppliersService.getAll(),
        quotesService.getAll()
      ]);
      setSuppliers((supplierList || []) as any);
      setQuotes((quoteList || []) as any);

      setLoading(false);
    } catch (error: any) {
      setError('Veriler yüklenirken hata oluştu');
      setLoading(false);
    }
  };

  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="relative">
          <div className="w-8 h-8 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute top-0 left-0 w-8 h-8 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
        </div>
      </div>
    );
  }

  // Operations görüntüleme yetkisi kontrolü
  if (!canView(Module.OPERATIONS)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Operasyonlar sayfasına erişim için yetkiniz bulunmuyor.</p>
          <a href="/" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  const handleCreateOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const quote = quotes.find(q => q.id === newOperation.quote_id);
      const supplier = suppliers.find(s => s.id === newOperation.supplier_id);

      const operationWithId: Operation = {
        id: Date.now().toString(),
        quote_id: newOperation.quote_id,
        quote_reference: quote?.reference || '',
        supplier_id: newOperation.supplier_id,
        supplier_name: supplier?.name || '',
        operation_type: newOperation.operation_type,
        service_date: newOperation.service_date,
        service_description: newOperation.service_description,
        quantity: newOperation.quantity,
        unit_price: newOperation.unit_price,
        currency: newOperation.currency,
        total_amount: newOperation.quantity * newOperation.unit_price,
        status: newOperation.status,
        notes: newOperation.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedOperations = [...operations, operationWithId];
      setOperations(updatedOperations);

      setSuccess('Operasyon başarıyla oluşturuldu');
      setShowCreateModal(false);
      setNewOperation({
        quote_id: '',
        supplier_id: '',
        operation_type: 'sejour',
        service_date: '',
        service_description: '',
        quantity: 1,
        unit_price: 0,
        currency: 'EUR',
        status: 'pending',
        notes: ''
      });
    } catch (error: any) {
      setError(error.message || 'Operasyon oluşturulurken hata oluştu');
    }
  };

  const getOperationTypeDisplayName = (type: string) => {
    switch (type) {
      case 'sejour': return 'Sejour';
      case 'transfer': return 'MICE Transfer';
      case 'guide': return 'Kokartlı Rehber';
      case 'part_time': return 'Part-Time';
      case 'extra_service': return 'Ekstra Hizmet';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'confirmed': return 'Onaylandı';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  // İstatistikler
  const stats = {
    total: operations.length,
    pending: operations.filter(op => op.status === 'pending').length,
    confirmed: operations.filter(op => op.status === 'confirmed').length,
    completed: operations.filter(op => op.status === 'completed').length,
    totalAmount: operations.reduce((sum, op) => sum + op.total_amount, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="relative">
          <div className="w-8 h-8 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute top-0 left-0 w-8 h-8 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
          <div className="absolute top-0 left-0 w-8 h-8 rounded-full border-4 border-transparent border-r-blue-500 dark:border-r-blue-300 animate-spin" style={{animationDelay: '0.1s', animationDuration: '1.5s'}}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Operasyon Yönetimi</h1>
            <p className="text-xs text-gray-600 mt-1">Sejour, transfer, rehber ve ekstra hizmet operasyonlarını yönetin</p>
          </div>
          {canCreate(Module.OPERATIONS) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            >
              Yeni Operasyon Ekle
            </button>
          )}
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 transition-colors duration-200">
            <div className="flex items-center">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <span className="text-blue-600 dark:text-blue-400 text-base">📊</span>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Toplam Operasyon</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 transition-colors duration-200">
            <div className="flex items-center">
              <div className="p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <span className="text-yellow-600 dark:text-yellow-400 text-base">⏳</span>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Beklemede</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 transition-colors duration-200">
            <div className="flex items-center">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <span className="text-blue-600 dark:text-blue-400 text-base">✅</span>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Onaylandı</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">{stats.confirmed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 transition-colors duration-200">
            <div className="flex items-center">
              <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <span className="text-green-600 dark:text-green-400 text-base">🎉</span>
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Tamamlandı</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">{stats.completed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 transition-colors duration-200">
            <div className="flex items-center">
              <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <span className="text-green-600 dark:text-green-400 text-base">💰</span>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Toplam Tutar</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">€{stats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Operasyonlar Tablosu */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Teklif Ref.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tedarikçi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Operasyon Türü
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Hizmet Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Miktar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Birim Fiyat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Toplam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {operations.map((operation) => (
                  <tr key={operation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
                      {operation.quote_reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {operation.supplier_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getOperationTypeDisplayName(operation.operation_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(operation.service_date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {operation.service_description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {operation.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      €{operation.unit_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      €{operation.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(operation.status)}`}>
                        {getStatusDisplayName(operation.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Yeni Operasyon Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Operasyon Ekle</h3>
                <form onSubmit={handleCreateOperation}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Teklif</label>
                      <select
                        value={newOperation.quote_id}
                        onChange={(e) => setNewOperation({...newOperation, quote_id: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Teklif Seçin</option>
                        {quotes.map(quote => (
                          <option key={quote.id} value={quote.id}>{quote.reference}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tedarikçi</label>
                      <select
                        value={newOperation.supplier_id}
                        onChange={(e) => setNewOperation({...newOperation, supplier_id: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Tedarikçi Seçin</option>
                        {suppliers.map(supplier => (
                          <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Operasyon Türü</label>
                      <select
                        value={newOperation.operation_type}
                        onChange={(e) => setNewOperation({...newOperation, operation_type: e.target.value as any})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="sejour">Sejour</option>
                        <option value="transfer">MICE Transfer</option>
                        <option value="guide">Kokartlı Rehber</option>
                        <option value="part_time">Part-Time</option>
                        <option value="extra_service">Ekstra Hizmet</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hizmet Tarihi</label>
                      <input
                        type="date"
                        value={newOperation.service_date}
                        onChange={(e) => setNewOperation({...newOperation, service_date: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                      <textarea
                        value={newOperation.service_description}
                        onChange={(e) => setNewOperation({...newOperation, service_description: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Miktar</label>
                        <input
                          type="number"
                          value={newOperation.quantity}
                          onChange={(e) => setNewOperation({...newOperation, quantity: parseInt(e.target.value)})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Birim Fiyat</label>
                        <input
                          type="number"
                          value={newOperation.unit_price}
                          onChange={(e) => setNewOperation({...newOperation, unit_price: parseFloat(e.target.value)})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notlar</label>
                      <textarea
                        value={newOperation.notes}
                        onChange={(e) => setNewOperation({...newOperation, notes: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Kaydet
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