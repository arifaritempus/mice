'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import PaginationControls from '@/components/PaginationControls';
import { ExcelUtils } from '@/utils/excelUtils';
import { formatDate } from '@/utils/formatters';
import { agenciesService } from '@/lib/supabaseService';
import { usePermissions, Module } from '@/lib/permissions';
import { DEFAULT_PAGE_SIZE, paginateItems } from '@/types/pagination';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { Building2, User, Phone, Mail, FileText, Plus, Pencil, MapPin } from 'lucide-react';

interface Agency {
  id: string;
  name: string;
  company_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  tax_office?: string;
  accounting_link_codes?: {
    TL?: string;
    EUR?: string;
    USD?: string;
    GBP?: string;
  };
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export default function AgenciesPage() {
  const { canView, canCreate, canEdit, canDelete, loading: permissionsLoading } = usePermissions();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [agencyToDelete, setAgencyToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    tax_number: '',
    tax_office: '',
    accounting_link_codes: {
      TL: '',
      EUR: '',
      USD: '',
      GBP: ''
    }
  });

  // Yeni acente için ref'ler
  const newNameInputRef = useRef<HTMLInputElement>(null);
  const newCompanyNameInputRef = useRef<HTMLInputElement>(null);
  const newContactPersonInputRef = useRef<HTMLInputElement>(null);
  const newPhoneInputRef = useRef<HTMLInputElement>(null);
  const newEmailInputRef = useRef<HTMLInputElement>(null);
  const newAddressInputRef = useRef<HTMLTextAreaElement>(null);
  const newTaxNumberInputRef = useRef<HTMLInputElement>(null);
  const newTaxOfficeInputRef = useRef<HTMLInputElement>(null);
  const newTlCodeInputRef = useRef<HTMLInputElement>(null);
  const newEurCodeInputRef = useRef<HTMLInputElement>(null);
  const newUsdCodeInputRef = useRef<HTMLInputElement>(null);
  const newGbpCodeInputRef = useRef<HTMLInputElement>(null);

  // Düzenleme için ref'ler
  const editNameInputRef = useRef<HTMLInputElement>(null);
  const editCompanyNameInputRef = useRef<HTMLInputElement>(null);
  const editContactPersonInputRef = useRef<HTMLInputElement>(null);
  const editPhoneInputRef = useRef<HTMLInputElement>(null);
  const editEmailInputRef = useRef<HTMLInputElement>(null);
  const editAddressInputRef = useRef<HTMLTextAreaElement>(null);
  const editTaxNumberInputRef = useRef<HTMLInputElement>(null);
  const editTaxOfficeInputRef = useRef<HTMLInputElement>(null);
  const editTlCodeInputRef = useRef<HTMLInputElement>(null);
  const editEurCodeInputRef = useRef<HTMLInputElement>(null);
  const editUsdCodeInputRef = useRef<HTMLInputElement>(null);
  const editGbpCodeInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    loadAgencies();
  }, []);


  const loadAgencies = async () => {
    try {
      setLoading(true);
      const supaAgencies = await agenciesService.getAll();
      const normalized = (supaAgencies || []).map((a: any) => ({
        id: a.id || a.uuid || '',
        name: a.name || '',
        company_name: a.company_name || '',
        contact_person: a.contact_person || '',
        phone: a.phone || '',
        email: a.email || '',
        address: a.address || '',
        tax_number: a.tax_number || '',
        tax_office: a.tax_office || '',
        accounting_link_codes: a.accounting_link_codes || {},
        is_active: a.is_active ?? true,
        created_at: a.created_at || new Date().toISOString(),
        updated_at: a.updated_at || undefined,
      }));
      setAgencies(normalized);
      (window as any).globalAgencies = normalized;
      window.dispatchEvent(new CustomEvent('agenciesUpdated', { detail: normalized }));
    } catch (error) {
      console.error('Acenteler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ref'lerden değerleri al
    const nameValue = editingAgency ? 
      (editNameInputRef.current?.value || '') : 
      (newNameInputRef.current?.value || '');
    const companyNameValue = editingAgency ? 
      (editCompanyNameInputRef.current?.value || '') : 
      (newCompanyNameInputRef.current?.value || '');
    const contactPersonValue = editingAgency ? 
      (editContactPersonInputRef.current?.value || '') : 
      (newContactPersonInputRef.current?.value || '');
    const phoneValue = editingAgency ? 
      (editPhoneInputRef.current?.value || '') : 
      (newPhoneInputRef.current?.value || '');
    const emailValue = editingAgency ? 
      (editEmailInputRef.current?.value || '') : 
      (newEmailInputRef.current?.value || '');
    const addressValue = editingAgency ? 
      (editAddressInputRef.current?.value || '') : 
      (newAddressInputRef.current?.value || '');
    const taxNumberValue = editingAgency ? 
      (editTaxNumberInputRef.current?.value || '') : 
      (newTaxNumberInputRef.current?.value || '');
    const taxOfficeValue = editingAgency ? 
      (editTaxOfficeInputRef.current?.value || '') : 
      (newTaxOfficeInputRef.current?.value || '');
    const tlCodeValue = editingAgency ? 
      (editTlCodeInputRef.current?.value || '') : 
      (newTlCodeInputRef.current?.value || '');
    const eurCodeValue = editingAgency ? 
      (editEurCodeInputRef.current?.value || '') : 
      (newEurCodeInputRef.current?.value || '');
    const usdCodeValue = editingAgency ? 
      (editUsdCodeInputRef.current?.value || '') : 
      (newUsdCodeInputRef.current?.value || '');
    const gbpCodeValue = editingAgency ? 
      (editGbpCodeInputRef.current?.value || '') : 
      (newGbpCodeInputRef.current?.value || '');
    
    try {
      if (editingAgency) {
        // Mevcut acenteyi güncelle
        const updatedAgencies = agencies.map(agency => 
          agency.id === editingAgency.id 
            ? { 
                ...agency, 
                name: nameValue,
                company_name: companyNameValue,
                contact_person: contactPersonValue,
                phone: phoneValue,
                email: emailValue,
                address: addressValue,
                tax_number: taxNumberValue,
                tax_office: taxOfficeValue,
                accounting_link_codes: {
                  TL: tlCodeValue,
                  EUR: eurCodeValue,
                  USD: usdCodeValue,
                  GBP: gbpCodeValue
                },
                updated_at: new Date().toISOString()
              }
            : agency
        );
        setAgencies(updatedAgencies);
        try {
          await agenciesService.update(editingAgency.id, {
            name: nameValue,
            company_name: companyNameValue,
            contact_person: contactPersonValue,
            phone: phoneValue,
            email: emailValue,
            address: addressValue,
            tax_number: taxNumberValue,
            tax_office: taxOfficeValue,
            accounting_link_codes: { TL: tlCodeValue, EUR: eurCodeValue, USD: usdCodeValue, GBP: gbpCodeValue },
          } as any);
          await loadAgencies();
        } catch (e: any) {
          alert(`Supabase güncelleme hatası: ${e?.message || e}`);
        }
        alert('Acente başarıyla güncellendi!');
      } else {
        // Yeni acente oluştur
        const newAgency: Agency = {
          id: Date.now().toString(),
          name: nameValue,
          company_name: companyNameValue,
          contact_person: contactPersonValue,
          phone: phoneValue,
          email: emailValue,
          address: addressValue,
          tax_number: taxNumberValue,
          tax_office: taxOfficeValue,
          accounting_link_codes: {
            TL: tlCodeValue,
            EUR: eurCodeValue,
            USD: usdCodeValue,
            GBP: gbpCodeValue
          },
          is_active: true,
          created_at: new Date().toISOString()
        };
        const updatedAgencies = [...agencies, newAgency];
        setAgencies(updatedAgencies);
        try {
          await agenciesService.create({
            name: nameValue,
            company_name: companyNameValue,
            contact_person: contactPersonValue,
            phone: phoneValue,
            email: emailValue,
            address: addressValue,
            tax_number: taxNumberValue,
            tax_office: taxOfficeValue,
            accounting_link_codes: { TL: tlCodeValue, EUR: eurCodeValue, USD: usdCodeValue, GBP: gbpCodeValue },
            is_active: true,
          } as any);
          await loadAgencies();
        } catch (e: any) {
          alert(`Supabase kayıt hatası: ${e?.message || e}`);
        }
        alert('Acente başarıyla oluşturuldu!');
      }
      
      // Formu sıfırla ve modalı kapat
      setFormData({
        name: '',
        company_name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        tax_number: '',
        tax_office: '',
        accounting_link_codes: {
          TL: '',
          EUR: '',
          USD: '',
          GBP: ''
        }
      });
      setEditingAgency(null);
      setShowAddModal(false);
      
    } catch (error) {
      console.error('Acente kaydedilirken hata:', error);
      alert('Acente kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleEdit = (agency: Agency) => {
    setEditingAgency(agency);
    setFormData({
      name: agency.name,
      company_name: agency.company_name,
      contact_person: agency.contact_person || '',
      phone: agency.phone || '',
      email: agency.email || '',
      address: agency.address || '',
      tax_number: agency.tax_number || '',
      tax_office: agency.tax_office || '',
      accounting_link_codes: {
        TL: agency.accounting_link_codes?.TL || '',
        EUR: agency.accounting_link_codes?.EUR || '',
        USD: agency.accounting_link_codes?.USD || '',
        GBP: agency.accounting_link_codes?.GBP || ''
      }
    });
    setShowAddModal(true);
    
    // Ref'lere değerleri set et
    setTimeout(() => {
      if (editNameInputRef.current) editNameInputRef.current.value = agency.name || '';
      if (editCompanyNameInputRef.current) editCompanyNameInputRef.current.value = agency.company_name || '';
      if (editContactPersonInputRef.current) editContactPersonInputRef.current.value = agency.contact_person || '';
      if (editPhoneInputRef.current) editPhoneInputRef.current.value = agency.phone || '';
      if (editEmailInputRef.current) editEmailInputRef.current.value = agency.email || '';
      if (editAddressInputRef.current) editAddressInputRef.current.value = agency.address || '';
      if (editTaxNumberInputRef.current) editTaxNumberInputRef.current.value = agency.tax_number || '';
      if (editTaxOfficeInputRef.current) editTaxOfficeInputRef.current.value = agency.tax_office || '';
      if (editTlCodeInputRef.current) editTlCodeInputRef.current.value = agency.accounting_link_codes?.TL || '';
      if (editEurCodeInputRef.current) editEurCodeInputRef.current.value = agency.accounting_link_codes?.EUR || '';
      if (editUsdCodeInputRef.current) editUsdCodeInputRef.current.value = agency.accounting_link_codes?.USD || '';
      if (editGbpCodeInputRef.current) editGbpCodeInputRef.current.value = agency.accounting_link_codes?.GBP || '';
    }, 100);
  };

  const handleDelete = async (agencyId: string) => {
    try {
      await agenciesService.delete(agencyId);
      await loadAgencies();
      setSuccess('Acente başarıyla silindi!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Acente silinirken hata:', error);
      setError('Acente silinirken bir hata oluştu.');
    } finally {
      setAgencyToDelete(null);
    }
  };

  const exportAgenciesToExcel = async () => {
    try {
      setExporting(true);
      setError('');
      setSuccess('');

      const workbook = await ExcelUtils.createWorkbook();
      const worksheet = workbook.addWorksheet('Acenteler');

      // Başlık satırı
      const headers = [
        'Acente Adı',
        'Firma Adı',
        'İletişim Kişisi',
        'Telefon',
        'E-posta',
        'Adres',
        'Vergi Numarası',
        'Vergi Dairesi',
        'TL Kodu',
        'EUR Kodu',
        'USD Kodu',
        'GBP Kodu',
        'Durum',
        'Oluşturulma Tarihi'
      ];

      worksheet.addRow(headers);

      // Veri satırları
      filteredAgencies.forEach(agency => {
        worksheet.addRow([
          agency.name,
          agency.company_name || '',
          agency.contact_person || '',
          agency.phone || '',
          agency.email || '',
          agency.address || '',
          agency.tax_number || '',
          agency.tax_office || '',
          agency.accounting_link_codes?.TL || '',
          agency.accounting_link_codes?.EUR || '',
          agency.accounting_link_codes?.USD || '',
          agency.accounting_link_codes?.GBP || '',
          agency.is_active ? 'Aktif' : 'Pasif',
          formatDate(agency.created_at)
        ]);
      });

      // Stil uygula
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2E3440' }
      };
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.alignment = { horizontal: 'center' };

      // Sütun genişliklerini ayarla
      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      // Dosyayı indir
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `acenteler_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      setSuccess('Acenteler başarıyla Excel dosyasına aktarıldı!');
    } catch (error) {
      console.error('Excel export hatası:', error);
      setError('Excel dosyası oluşturulurken bir hata oluştu.');
    } finally {
      setExporting(false);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setError('');
      setSuccess('');

      const data = await ExcelUtils.readExcelFile(file);
      
      if (!data || data.length === 0) {
        setError('Excel dosyasında veri bulunamadı.');
        return;
      }

      const importedAgencies: Agency[] = data.map((row: any, index: number) => ({
        id: Date.now().toString() + index,
        name: row['Acente Adı'] || '',
        company_name: row['Firma Adı'] || '',
        contact_person: row['İletişim Kişisi'] || '',
        phone: row['Telefon'] || '',
        email: row['E-posta'] || '',
        address: row['Adres'] || '',
        tax_number: row['Vergi Numarası'] || '',
        tax_office: row['Vergi Dairesi'] || '',
        accounting_link_codes: {
          TL: row['TL Kodu'] || '',
          EUR: row['EUR Kodu'] || '',
          USD: row['USD Kodu'] || '',
          GBP: row['GBP Kodu'] || ''
        },
        is_active: row['Durum'] === 'Aktif' || row['Durum'] === 'aktif' || row['Durum'] === true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const updatedAgencies = [...agencies, ...importedAgencies];
      setAgencies(updatedAgencies);

      try {
        for (const a of importedAgencies) {
          await agenciesService.create({
            name: a.name,
            company_name: a.company_name,
            contact_person: a.contact_person,
            phone: a.phone,
            email: a.email,
            address: a.address,
            tax_number: a.tax_number,
            tax_office: a.tax_office,
            accounting_link_codes: a.accounting_link_codes,
            is_active: a.is_active,
          } as any);
        }
        await loadAgencies();
      } catch (e: any) {
        alert(`Supabase kayıt hatası: ${e?.message || e}`);
      }

      setSuccess(`${importedAgencies.length} acente başarıyla içe aktarıldı!`);
    } catch (error) {
      console.error('Excel import hatası:', error);
      setError('Excel dosyası okunurken bir hata oluştu.');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const toggleActive = async (agencyId: string) => {
    try {
      const agencyToUpdate = agencies.find(agency => agency.id === agencyId);
      if (!agencyToUpdate) return;

      const updatedAgency = { ...agencyToUpdate, is_active: !agencyToUpdate.is_active };
      const updatedAgencies = agencies.map(agency => 
        agency.id === agencyId ? updatedAgency : agency
      );
      setAgencies(updatedAgencies);
      try {
        await agenciesService.update(agencyId, { is_active: updatedAgency.is_active } as any);
        await loadAgencies();
      } catch (e: any) {
        alert(`Supabase güncelleme hatası: ${e?.message || e}`);
      }
      alert('Acente durumu başarıyla değiştirildi!');
    } catch (error) {
      console.error('Acente durumu değiştirilirken hata:', error);
      alert('Acente durumu değiştirilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const searchAgencies = (agencies: Agency[], searchTerm: string) => {
    if (!searchTerm) return agencies;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return agencies.filter(agency => 
      agency.name.toLowerCase().includes(lowerSearchTerm) ||
      agency.company_name.toLowerCase().includes(lowerSearchTerm) ||
      (agency.contact_person && agency.contact_person.toLowerCase().includes(lowerSearchTerm)) ||
      (agency.phone && agency.phone.toLowerCase().includes(lowerSearchTerm)) ||
      (agency.email && agency.email.toLowerCase().includes(lowerSearchTerm)) ||
      (agency.address && agency.address.toLowerCase().includes(lowerSearchTerm)) ||
      (agency.tax_number && agency.tax_number.toLowerCase().includes(lowerSearchTerm)) ||
      (agency.tax_office && agency.tax_office.toLowerCase().includes(lowerSearchTerm))
    );
  };

  const sortAgencies = (agencies: Agency[], field: string, direction: 'asc' | 'desc') => {
    if (!field) return agencies;
    
    return [...agencies].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (field) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'company_name':
          aValue = a.company_name;
          bValue = b.company_name;
          break;
        case 'contact_person':
          aValue = a.contact_person || '';
          bValue = b.contact_person || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a[field as keyof Agency];
          bValue = b[field as keyof Agency];
      }
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAgencies = sortAgencies(
    searchAgencies(
      filter === 'all' 
        ? agencies 
        : agencies.filter(agency => 
            filter === 'active' ? agency.is_active :
            filter === 'inactive' ? !agency.is_active : true
          ),
      searchTerm
    ),
    sortField,
    sortDirection
  );
  const paginatedAgencies = paginateItems(filteredAgencies, page, pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filter, sortField, sortDirection]);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Agencies görüntüleme yetkisi kontrolü
  if (!canView(Module.AGENCIES)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Acenteler sayfasına erişim için yetkiniz bulunmuyor.</p>
          <Link href="/" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Acenteler yükleniyor..." />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0">
      <div className="w-full min-w-0 flex flex-col flex-1">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Acente Yönetimi</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Acente bilgilerini yönetin ve düzenleyin</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={exportAgenciesToExcel}
              disabled={exporting}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
            >
              {exporting ? '📤 Exporting...' : '📤 Excel Export'}
            </button>
            <label className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors duration-200 cursor-pointer disabled:opacity-50">
              {importing ? '📥 Importing...' : '📥 Excel Import'}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileImport}
                disabled={importing}
                className="hidden"
              />
            </label>
            {canCreate(Module.AGENCIES) && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 dark:bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 text-xs"
              >
                Yeni Acente
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-nowrap gap-2 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0">
            <div className="flex items-center">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Toplam Acente</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{agencies.length}</p>
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
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Aktif</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{agencies.filter(a => a.is_active).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0">
            <div className="flex items-center">
              <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Pasif</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{agencies.filter(a => !a.is_active).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-3 transition-colors duration-200">
          <div className="p-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors duration-200 ${
                  filter === 'all'
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Tümü ({agencies.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors duration-200 ${
                  filter === 'active'
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Aktif ({agencies.filter(a => a.is_active).length})
              </button>
              <button
                onClick={() => setFilter('inactive')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors duration-200 ${
                  filter === 'inactive'
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Pasif ({agencies.filter(a => !a.is_active).length})
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Acente adı, firma adı, iletişim kişisi, telefon, e-posta, adres, vergi numarası, vergi dairesi... herhangi bir şey arayın"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-8 pr-2 py-1 border border-gray-300 rounded-lg leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-2 flex items-center"
              >
                <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="mt-1 text-xs text-gray-600">
              <span className="font-medium">{filteredAgencies.length}</span> sonuç bulundu
              {filteredAgencies.length !== agencies.length && (
                <span className="ml-2">({agencies.length} toplam acente)</span>
              )}
            </div>
          )}
        </div>

        {/* Agencies Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200 w-full min-w-0 flex-1 flex flex-col min-h-0">
          <div className="overflow-auto w-full flex-1">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Acente Adı
                      {sortField === 'name' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('company_name')}
                  >
                    <div className="flex items-center">
                      Firma Adı
                      {sortField === 'company_name' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    İletişim
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vergi Bilgileri
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center">
                      Oluşturulma Tarihi
                      {sortField === 'created_at' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedAgencies.items.map((agency) => (
                  <tr key={agency.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white transition-colors duration-200">
                      {agency.name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                      {agency.company_name}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white transition-colors duration-200">
                      <div>
                        <div className="font-medium">{agency.contact_person || '-'}</div>
                        <div className="text-gray-500 dark:text-gray-400">{agency.phone || '-'}</div>
                        <div className="text-gray-500 dark:text-gray-400">{agency.email || '-'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white transition-colors duration-200">
                      <div>
                        <div className="font-medium">{agency.tax_number || '-'}</div>
                        <div className="text-gray-500 dark:text-gray-400">{agency.tax_office || '-'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                      {new Date(agency.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${agency.is_active ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
                        {agency.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      <div className="flex space-x-2">
                        {canEdit(Module.AGENCIES) && (
                          <button
                            onClick={() => handleEdit(agency)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors duration-200"
                            title="Düzenle"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {canDelete(Module.AGENCIES) && (
                          <button
                            onClick={() => setAgencyToDelete(agency.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-200"
                            title="Sil"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                        {canEdit(Module.AGENCIES) && (
                          <button
                            onClick={() => toggleActive(agency.id)}
                            className={`p-1 rounded transition-colors ${agency.is_active ? 'text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30'}`}
                            title={agency.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <PaginationControls
          page={paginatedAgencies.page}
          pageSize={paginatedAgencies.pageSize}
          total={paginatedAgencies.total}
          totalPages={paginatedAgencies.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          preferenceKey="agencies_page_size"
          compactRight
        />

      {/* Add/Edit Agency Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingAgency(null);
        }}
        title={editingAgency ? 'Acente Düzenle' : 'Yeni Acente Ekle'}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Building2 size={16} className="text-blue-500" />
                Acente Bilgileri
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Acente Adı *
                  </label>
                  <input
                    ref={editingAgency ? editNameInputRef : newNameInputRef}
                    type="text"
                    defaultValue={editingAgency?.name || ''}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    placeholder="Acente Adı"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Firma Adı *
                  </label>
                  <input
                    ref={editingAgency ? editCompanyNameInputRef : newCompanyNameInputRef}
                    type="text"
                    defaultValue={editingAgency?.company_name || ''}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    placeholder="Şirket Ünvanı"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <User size={12} /> İletişim Kişisi
                  </label>
                  <input
                    ref={editingAgency ? editContactPersonInputRef : newContactPersonInputRef}
                    type="text"
                    defaultValue={editingAgency?.contact_person || ''}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    placeholder="Yetkili Kişi"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Phone size={16} className="text-blue-500" />
                İletişim & Fatura
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                      <Phone size={12} /> Telefon
                    </label>
                    <input
                      ref={editingAgency ? editPhoneInputRef : newPhoneInputRef}
                      type="text"
                      defaultValue={editingAgency?.phone || ''}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                      placeholder="+90..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                      <Mail size={12} /> E-posta
                    </label>
                    <input
                      ref={editingAgency ? editEmailInputRef : newEmailInputRef}
                      type="email"
                      defaultValue={editingAgency?.email || ''}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                      placeholder="acente@eposta.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <MapPin size={12} /> Adres
                  </label>
                  <textarea
                    ref={editingAgency ? editAddressInputRef : newAddressInputRef}
                    defaultValue={editingAgency?.address || ''}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm resize-none"
                    placeholder="Tam adres..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Vergi No
                    </label>
                    <input
                      ref={editingAgency ? editTaxNumberInputRef : newTaxNumberInputRef}
                      type="text"
                      defaultValue={editingAgency?.tax_number || ''}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Vergi Dairesi
                    </label>
                    <input
                      ref={editingAgency ? editTaxOfficeInputRef : newTaxOfficeInputRef}
                      type="text"
                      defaultValue={editingAgency?.tax_office || ''}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <FileText size={16} className="text-blue-500" />
              Muhasebe Bağlantı Kodları
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">TL Kodu</label>
                <input ref={editingAgency ? editTlCodeInputRef : newTlCodeInputRef} type="text" defaultValue={editingAgency?.accounting_link_codes?.TL || ''} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">EUR Kodu</label>
                <input ref={editingAgency ? editEurCodeInputRef : newEurCodeInputRef} type="text" defaultValue={editingAgency?.accounting_link_codes?.EUR || ''} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">USD Kodu</label>
                <input ref={editingAgency ? editUsdCodeInputRef : newUsdCodeInputRef} type="text" defaultValue={editingAgency?.accounting_link_codes?.USD || ''} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">GBP Kodu</label>
                <input ref={editingAgency ? editGbpCodeInputRef : newGbpCodeInputRef} type="text" defaultValue={editingAgency?.accounting_link_codes?.GBP || ''} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setEditingAgency(null);
              }}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              {editingAgency ? <Pencil size={18} /> : <Plus size={18} />}
              {editingAgency ? 'Güncelle' : 'Acente Oluştur'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Silme Onay Modal */}
      <ConfirmModal
        isOpen={!!agencyToDelete}
        title="Acenteyi Sil"
        message="Bu acenteyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        onConfirm={() => agencyToDelete && handleDelete(agencyToDelete)}
        onCancel={() => setAgencyToDelete(null)}
        type="danger"
        confirmText="Evet, Sil"
        cancelText="İptal"
      />

      {/* Mesaj Bildirimleri */}
      {(success || error) && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl z-[1000] border backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 ${
          success 
            ? 'bg-green-500/90 border-green-400 text-white' 
            : 'bg-red-500/90 border-red-400 text-white'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${success ? 'bg-green-400/20' : 'bg-red-400/20'}`}>
            {success ? <Plus size={18} className="text-white" /> : <Building2 size={18} className="text-white" />}
          </div>
          <span className="font-bold text-sm">{success || error}</span>
        </div>
      )}
    </div>
  </div>
  );
} 