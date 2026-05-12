'use client';

import { useState, useEffect, useRef } from 'react';
import PaginationControls from '@/components/PaginationControls';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ExcelUtils } from '@/utils/excelUtils';
import { formatDate } from '@/utils/formatters';
import { suppliersService } from '@/lib/supabaseService';
import { usePermissions, Module } from '@/lib/permissions';
import { DEFAULT_PAGE_SIZE, paginateItems } from '@/types/pagination';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { Building2, User, Phone, Mail, FileText, Plus, Pencil, Save, MapPin, Briefcase, CreditCard } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  title: string; // Tedarikçi Unvanı
  service_type: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  tax_id: string;
  tax_office: string;
  accounting_link_codes?: {
    TL?: string;
    EUR?: string;
    USD?: string;
    GBP?: string;
  };
  bank_info: {
    bank_name: string;
    account_number: string;
    iban: string;
  };
  contract_info: {
    contract_start: string;
    contract_end: string;
    commission_rate: number;
    payment_terms: string;
  };
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export default function SuppliersPage() {
  const { canView, canCreate, canEdit, canDelete, userRole, loading: permissionsLoading } = usePermissions();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    title: '',
    service_type: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    tax_id: '',
    tax_office: '',
    accounting_link_codes: {
      TL: '',
      EUR: '',
      USD: '',
      GBP: ''
    },
    bank_info: {
      bank_name: '',
      account_number: '',
      iban: ''
    },
    contract_info: {
      contract_start: '',
      contract_end: '',
      commission_rate: 0,
      payment_terms: ''
    },
    is_active: true,
    notes: ''
  });

  // Yeni tedarikçi için ref'ler
  const newNameInputRef = useRef<HTMLInputElement>(null);
  const newTitleInputRef = useRef<HTMLInputElement>(null);
  const newContactPersonInputRef = useRef<HTMLInputElement>(null);
  const newPhoneInputRef = useRef<HTMLInputElement>(null);
  const newEmailInputRef = useRef<HTMLInputElement>(null);
  const newAddressInputRef = useRef<HTMLTextAreaElement>(null);
  const newTaxIdInputRef = useRef<HTMLInputElement>(null);
  const newTaxOfficeInputRef = useRef<HTMLInputElement>(null);
  const newBankNameInputRef = useRef<HTMLInputElement>(null);
  const newAccountNumberInputRef = useRef<HTMLInputElement>(null);
  const newIbanInputRef = useRef<HTMLInputElement>(null);
  const newContractStartInputRef = useRef<HTMLInputElement>(null);
  const newContractEndInputRef = useRef<HTMLInputElement>(null);
  const newCommissionRateInputRef = useRef<HTMLInputElement>(null);
  const newPaymentTermsInputRef = useRef<HTMLInputElement>(null);
  const newNotesInputRef = useRef<HTMLTextAreaElement>(null);
  const newTlCodeInputRef = useRef<HTMLInputElement>(null);
  const newEurCodeInputRef = useRef<HTMLInputElement>(null);
  const newUsdCodeInputRef = useRef<HTMLInputElement>(null);
  const newGbpCodeInputRef = useRef<HTMLInputElement>(null);

  // Düzenleme için ref'ler
  const editNameInputRef = useRef<HTMLInputElement>(null);
  const editTitleInputRef = useRef<HTMLInputElement>(null);
  const editContactPersonInputRef = useRef<HTMLInputElement>(null);
  const editPhoneInputRef = useRef<HTMLInputElement>(null);
  const editEmailInputRef = useRef<HTMLInputElement>(null);
  const editAddressInputRef = useRef<HTMLTextAreaElement>(null);
  const editTaxIdInputRef = useRef<HTMLInputElement>(null);
  const editTaxOfficeInputRef = useRef<HTMLInputElement>(null);
  const editBankNameInputRef = useRef<HTMLInputElement>(null);
  const editAccountNumberInputRef = useRef<HTMLInputElement>(null);
  const editIbanInputRef = useRef<HTMLInputElement>(null);
  const editContractStartInputRef = useRef<HTMLInputElement>(null);
  const editContractEndInputRef = useRef<HTMLInputElement>(null);
  const editCommissionRateInputRef = useRef<HTMLInputElement>(null);
  const editPaymentTermsInputRef = useRef<HTMLInputElement>(null);
  const editNotesInputRef = useRef<HTMLTextAreaElement>(null);
  const editTlCodeInputRef = useRef<HTMLInputElement>(null);
  const editEurCodeInputRef = useRef<HTMLInputElement>(null);
  const editUsdCodeInputRef = useRef<HTMLInputElement>(null);
  const editGbpCodeInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      
      // Supabase'ten tedarikçileri yükle
      const supaSuppliers = await suppliersService.getAll();
      if (supaSuppliers && supaSuppliers.length > 0) {
        const normalized: Supplier[] = supaSuppliers.map((s: any) => ({
          id: s.id || s.uuid || '',
          name: s.name || '',
          title: s.title || '',
          service_type: s.service_type || '',
          contact_person: s.contact_person || '',
          phone: s.phone || '',
          email: s.email || '',
          address: s.address || '',
          tax_id: s.tax_id || '',
          tax_office: s.tax_office || '',
          accounting_link_codes: s.accounting_link_codes || {},
          bank_info: s.bank_info || {},
          contract_info: s.contract_info || {},
          is_active: s.is_active ?? true,
          notes: s.notes || '',
          created_at: s.created_at,
          updated_at: s.updated_at
        }));
        setSuppliers(normalized);
      } else {
        setSuppliers([]);
      }

      // Hizmet türlerini yükle (varsayılan)
      const defaultServiceTypes = [
        { id: '1', name: 'Transfer', code: 'TRANSFER' },
        { id: '2', name: 'Kokartlı Rehber', code: 'GUIDE' },
        { id: '3', name: 'Otel', code: 'HOTEL' },
        { id: '4', name: 'Restoran', code: 'RESTAURANT' },
        { id: '5', name: 'Eğlence', code: 'ENTERTAINMENT' },
        { id: '6', name: 'Ulaşım', code: 'TRANSPORT' },
        { id: '7', name: 'Diğer', code: 'OTHER' }
      ];
      setServiceTypes(defaultServiceTypes);

      setLoading(false);
    } catch (error: any) {
      setError('Tedarikçiler yüklenirken hata oluştu');
      setLoading(false);
    }
  };

  const exportSuppliersToExcel = async () => {
    try {
      setExporting(true);
      setError('');
      setSuccess('');

      const workbook = await ExcelUtils.createWorkbook();
      const worksheet = workbook.addWorksheet('Tedarikçiler');

      // Başlık satırı
      const headers = [
        'Tedarikçi Adı',
        'Unvan',
        'Hizmet Türü',
        'İletişim Kişisi',
        'Telefon',
        'E-posta',
        'Adres',
        'Vergi Numarası',
        'Vergi Dairesi',
        'Vade',
        'TL Kodu',
        'EUR Kodu',
        'USD Kodu',
        'GBP Kodu',
        'Durum',
        'Oluşturulma Tarihi'
      ];

      worksheet.addRow(headers);

      // Veri satırları
      filteredSuppliers.forEach(supplier => {
        worksheet.addRow([
          supplier.name,
          supplier.title || '',
          supplier.service_type,
          supplier.contact_person || '',
          supplier.phone || '',
          supplier.email || '',
          supplier.address || '',
          supplier.tax_id || '',
          supplier.tax_office || '',
          supplier.contract_info?.payment_terms || '',
          supplier.accounting_link_codes?.TL || '',
          supplier.accounting_link_codes?.EUR || '',
          supplier.accounting_link_codes?.USD || '',
          supplier.accounting_link_codes?.GBP || '',
          supplier.is_active ? 'Aktif' : 'Pasif',
          formatDate(supplier.created_at)
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
      link.download = `tedarikciler_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      setSuccess('Tedarikçiler başarıyla Excel dosyasına aktarıldı!');
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

      const importedSuppliers: Supplier[] = data.map((row: any, index: number) => ({
        id: Date.now().toString() + index,
        name: row['Tedarikçi Adı'] || '',
        title: row['Unvan'] || '',
        service_type: row['Hizmet Türü'] || '',
        contact_person: row['İletişim Kişisi'] || '',
        phone: row['Telefon'] || '',
        email: row['E-posta'] || '',
        address: row['Adres'] || '',
        tax_id: row['Vergi Numarası'] || '',
        tax_office: row['Vergi Dairesi'] || '',
        bank_info: {
          bank_name: '',
          account_number: '',
          iban: ''
        },
        contract_info: {
          contract_start: '',
          contract_end: '',
          payment_terms: row['Vade'] || '',
          commission_rate: 0
        },
        accounting_link_codes: {
          TL: row['TL Kodu'] || '',
          EUR: row['EUR Kodu'] || '',
          USD: row['USD Kodu'] || '',
          GBP: row['GBP Kodu'] || ''
        },
        is_active: row['Durum'] === 'Aktif' || row['Durum'] === 'aktif' || row['Durum'] === true,
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Mevcut tedarikçilerle birleştir
      const updatedSuppliers = [...suppliers, ...importedSuppliers];
      setSuppliers(updatedSuppliers);
      
      // Supabase'e kaydet
      try {
        for (const supplier of importedSuppliers) {
          await suppliersService.create({
            name: supplier.name,
            title: supplier.title,
            service_type: supplier.service_type,
            contact_person: supplier.contact_person,
            phone: supplier.phone,
            email: supplier.email,
            address: supplier.address,
            tax_id: supplier.tax_id,
            tax_office: supplier.tax_office,
            accounting_link_codes: supplier.accounting_link_codes,
            bank_info: supplier.bank_info,
            contract_info: supplier.contract_info,
            is_active: supplier.is_active,
            notes: supplier.notes,
            type: 'supplier'
          } as any);
        }
        await loadSuppliers();
      } catch (e: any) {
        alert(`Supabase kayıt hatası: ${e?.message || e}`);
      }

      setSuccess(`${importedSuppliers.length} tedarikçi başarıyla içe aktarıldı!`);
    } catch (error) {
      console.error('Excel import hatası:', error);
      setError('Excel dosyası okunurken bir hata oluştu.');
    } finally {
      setImporting(false);
      // Input'u temizle
      event.target.value = '';
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowEditModal(true);
    
    // Ref'lere değerleri set et
    setTimeout(() => {
      if (editNameInputRef.current) editNameInputRef.current.value = supplier.name || '';
      if (editTitleInputRef.current) editTitleInputRef.current.value = supplier.title || '';
      if (editContactPersonInputRef.current) editContactPersonInputRef.current.value = supplier.contact_person || '';
      if (editPhoneInputRef.current) editPhoneInputRef.current.value = supplier.phone || '';
      if (editEmailInputRef.current) editEmailInputRef.current.value = supplier.email || '';
      if (editAddressInputRef.current) editAddressInputRef.current.value = supplier.address || '';
      if (editTaxIdInputRef.current) editTaxIdInputRef.current.value = supplier.tax_id || '';
      if (editTaxOfficeInputRef.current) editTaxOfficeInputRef.current.value = supplier.tax_office || '';
      if (editTlCodeInputRef.current) editTlCodeInputRef.current.value = supplier.accounting_link_codes?.TL || '';
      if (editEurCodeInputRef.current) editEurCodeInputRef.current.value = supplier.accounting_link_codes?.EUR || '';
      if (editUsdCodeInputRef.current) editUsdCodeInputRef.current.value = supplier.accounting_link_codes?.USD || '';
      if (editGbpCodeInputRef.current) editGbpCodeInputRef.current.value = supplier.accounting_link_codes?.GBP || '';
      if (editPaymentTermsInputRef.current) editPaymentTermsInputRef.current.value = supplier.contract_info?.payment_terms || '';
    }, 100);
  };

  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;

    setError('');
    setSuccess('');

    // Ref'lerden değerleri al
    const nameValue = editNameInputRef.current?.value || '';
    const titleValue = editTitleInputRef.current?.value || '';
    const contactPersonValue = editContactPersonInputRef.current?.value || '';
    const phoneValue = editPhoneInputRef.current?.value || '';
    const emailValue = editEmailInputRef.current?.value || '';
    const addressValue = editAddressInputRef.current?.value || '';
    const taxIdValue = editTaxIdInputRef.current?.value || '';
    const taxOfficeValue = editTaxOfficeInputRef.current?.value || '';
    const tlCodeValue = editTlCodeInputRef.current?.value || '';
    const eurCodeValue = editEurCodeInputRef.current?.value || '';
    const usdCodeValue = editUsdCodeInputRef.current?.value || '';
    const gbpCodeValue = editGbpCodeInputRef.current?.value || '';
    const paymentTermsValue = editPaymentTermsInputRef.current?.value || '';

    try {
      const updatedSuppliers = suppliers.map(supplier => 
        supplier.id === editingSupplier.id 
          ? { 
              ...editingSupplier, 
              name: nameValue,
              title: titleValue,
              contact_person: contactPersonValue,
              phone: phoneValue,
              email: emailValue,
              address: addressValue,
              tax_id: taxIdValue,
              tax_office: taxOfficeValue,
              accounting_link_codes: {
                TL: tlCodeValue,
                EUR: eurCodeValue,
                USD: usdCodeValue,
                GBP: gbpCodeValue
              },
              contract_info: {
                ...editingSupplier.contract_info,
                payment_terms: paymentTermsValue
              },
              updated_at: new Date().toISOString() 
            }
          : supplier
      );
      
      setSuppliers(updatedSuppliers);
      try {
        await suppliersService.update(editingSupplier.id, {
          name: nameValue,
          title: titleValue,
          contact_person: contactPersonValue,
          phone: phoneValue,
          email: emailValue,
          address: addressValue,
          tax_id: taxIdValue,
          tax_office: taxOfficeValue,
          accounting_link_codes: {
            TL: tlCodeValue, EUR: eurCodeValue, USD: usdCodeValue, GBP: gbpCodeValue
          },
          contract_info: {
            ...editingSupplier.contract_info,
            payment_terms: paymentTermsValue
          }
        } as any);
        await loadSuppliers();
      } catch (e: any) {
        alert(`Supabase güncelleme hatası: ${e?.message || e}`);
      }
      setSuccess('Tedarikçi başarıyla güncellendi');
      setShowEditModal(false);
      setEditingSupplier(null);
    } catch (error: any) {
      setError('Tedarikçi güncellenirken hata oluştu');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      await suppliersService.delete(id);
      await loadSuppliers();
      setSuccess('Tedarikçi başarıyla silindi');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Tedarikçi silinirken hata:', error);
      setError('Tedarikçi silinirken hata oluştu');
    } finally {
      setSupplierToDelete(null);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Ref'lerden değerleri al
    const nameValue = newNameInputRef.current?.value || '';
    const titleValue = newTitleInputRef.current?.value || '';
    const contactPersonValue = newContactPersonInputRef.current?.value || '';
    const phoneValue = newPhoneInputRef.current?.value || '';
    const emailValue = newEmailInputRef.current?.value || '';
    const addressValue = newAddressInputRef.current?.value || '';
    const taxIdValue = newTaxIdInputRef.current?.value || '';
    const taxOfficeValue = newTaxOfficeInputRef.current?.value || '';
    const tlCodeValue = newTlCodeInputRef.current?.value || '';
    const eurCodeValue = newEurCodeInputRef.current?.value || '';
    const usdCodeValue = newUsdCodeInputRef.current?.value || '';
    const gbpCodeValue = newGbpCodeInputRef.current?.value || '';
    const paymentTermsValue = newPaymentTermsInputRef.current?.value || '';

    try {
      const supplierWithId: Supplier = {
        id: Date.now().toString(),
        name: nameValue,
        title: titleValue,
        service_type: newSupplier.service_type,
        contact_person: contactPersonValue,
        phone: phoneValue,
        email: emailValue,
        address: addressValue,
        tax_id: taxIdValue,
        tax_office: taxOfficeValue,
        accounting_link_codes: {
          TL: tlCodeValue,
          EUR: eurCodeValue,
          USD: usdCodeValue,
          GBP: gbpCodeValue
        },
        bank_info: newSupplier.bank_info,
        contract_info: {
          ...newSupplier.contract_info,
          payment_terms: paymentTermsValue
        },
        is_active: newSupplier.is_active,
        notes: newSupplier.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedSuppliers = [...suppliers, supplierWithId];
      setSuppliers(updatedSuppliers);
      try {
        await suppliersService.create({
          name: nameValue,
          title: titleValue,
          service_type: newSupplier.service_type,
          contact_person: contactPersonValue,
          phone: phoneValue,
          email: emailValue,
          address: addressValue,
          tax_id: taxIdValue,
          tax_office: taxOfficeValue,
          accounting_link_codes: {
            TL: tlCodeValue, EUR: eurCodeValue, USD: usdCodeValue, GBP: gbpCodeValue
          },
          bank_info: newSupplier.bank_info,
          contract_info: {
            ...newSupplier.contract_info,
            payment_terms: paymentTermsValue
          },
          is_active: newSupplier.is_active,
          notes: newSupplier.notes,
          type: 'supplier'
        } as any);
        await loadSuppliers();
      } catch (e: any) {
        alert(`Supabase kayıt hatası: ${e?.message || e}`);
      }

      setSuccess('Tedarikçi başarıyla oluşturuldu');
      setShowCreateModal(false);
      setNewSupplier({
        name: '',
        title: '',
        service_type: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        tax_id: '',
        tax_office: '',
        accounting_link_codes: {
          TL: '',
          EUR: '',
          USD: '',
          GBP: ''
        },
        bank_info: {
          bank_name: '',
          account_number: '',
          iban: ''
        },
        contract_info: {
          contract_start: '',
          contract_end: '',
          commission_rate: 0,
          payment_terms: ''
        },
        is_active: true,
        notes: ''
      });
    } catch (error: any) {
      setError(error.message || 'Tedarikçi oluşturulurken hata oluştu');
    }
  };

  const getServiceTypeDisplayName = (type: string) => {
    switch (type) {
      case 'transfer': return 'Transfer';
      case 'guide': return 'Rehber';
      case 'hotel': return 'Otel';
      case 'restaurant': return 'Restoran';
      case 'transport': return 'Ulaşım';
      case 'entertainment': return 'Eğlence';
      case 'other': return 'Diğer';
      default: return type;
    }
  };

  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'transfer': return 'bg-blue-100 text-blue-800';
      case 'guide': return 'bg-green-100 text-green-800';
      case 'hotel': return 'bg-purple-100 text-purple-800';
      case 'restaurant': return 'bg-orange-100 text-orange-800';
      case 'transport': return 'bg-red-100 text-red-800';
      case 'entertainment': return 'bg-pink-100 text-pink-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.is_active).length,
    transfer: suppliers.filter(s => s.service_type === 'transfer').length,
    guide: suppliers.filter(s => s.service_type === 'guide').length,
    hotel: suppliers.filter(s => s.service_type === 'hotel').length
  };

  const searchSuppliers = (suppliers: Supplier[], searchTerm: string) => {
    if (!searchTerm) return suppliers;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(lowerSearchTerm) ||
      supplier.title.toLowerCase().includes(lowerSearchTerm) ||
      supplier.service_type.toLowerCase().includes(lowerSearchTerm) ||
      supplier.contact_person.toLowerCase().includes(lowerSearchTerm) ||
      supplier.phone.toLowerCase().includes(lowerSearchTerm) ||
      supplier.email.toLowerCase().includes(lowerSearchTerm) ||
      supplier.address.toLowerCase().includes(lowerSearchTerm) ||
      supplier.tax_id.toLowerCase().includes(lowerSearchTerm) ||
      supplier.tax_office.toLowerCase().includes(lowerSearchTerm)
    );
  };

  const sortSuppliers = (suppliers: Supplier[], field: string, direction: 'asc' | 'desc') => {
    if (!field) return suppliers;
    
    return [...suppliers].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (field) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'service_type':
          aValue = a.service_type;
          bValue = b.service_type;
          break;
        case 'contact_person':
          aValue = a.contact_person;
          bValue = b.contact_person;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a[field as keyof Supplier];
          bValue = b[field as keyof Supplier];
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

  const filteredSuppliers = sortSuppliers(
    searchSuppliers(
      filter === 'all' 
        ? suppliers 
        : suppliers.filter(supplier => 
            filter === 'active' ? supplier.is_active :
            filter === 'inactive' ? !supplier.is_active :
            filter === 'transfer' ? supplier.service_type === 'transfer' :
            filter === 'guide' ? supplier.service_type === 'guide' :
            filter === 'hotel' ? supplier.service_type === 'hotel' : true
          ),
      searchTerm
    ),
    sortField,
    sortDirection
  );
  const paginatedSuppliers = paginateItems(filteredSuppliers, page, pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filter, sortField, sortDirection]);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Suppliers görüntüleme yetkisi kontrolü
  if (!canView(Module.SUPPLIERS)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Tedarikçiler sayfasına erişim için yetkiniz bulunmuyor.</p>
          <a href="/" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Tedarikçiler yükleniyor..." />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0">
      <div className="w-full min-w-0 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Tedarikçi Yönetimi</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Transfer, rehber, otel ve diğer hizmet tedarikçilerini yönetin</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={exportSuppliersToExcel}
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
            {canCreate(Module.SUPPLIERS) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 dark:bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200 text-xs"
              >
                Yeni Tedarikçi Ekle
              </button>
            )}
          </div>
        </div>

        {/* İstatistikler */}
        <div className="flex flex-nowrap gap-2 mb-4">
          <button onClick={() => setFilter('all')} className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${filter === 'all' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}>
            <div className="flex items-center">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Toplam</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{stats.total}</p>
              </div>
            </div>
          </button>

          <button onClick={() => setFilter('active')} className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${filter === 'active' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}>
            <div className="flex items-center">
              <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Aktif</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{stats.active}</p>
              </div>
            </div>
          </button>

          <button onClick={() => setFilter('transfer')} className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${filter === 'transfer' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}>
            <div className="flex items-center">
              <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Transfer</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{stats.transfer}</p>
              </div>
            </div>
          </button>

          <button onClick={() => setFilter('guide')} className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${filter === 'guide' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}>
            <div className="flex items-center">
              <div className="p-1 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <svg className="w-3 h-3 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Rehber</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{stats.guide}</p>
              </div>
            </div>
          </button>

          <button onClick={() => setFilter('hotel')} className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${filter === 'hotel' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}>
            <div className="flex items-center">
              <div className="p-1 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <svg className="w-3 h-3 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Otel</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{stats.hotel}</p>
              </div>
            </div>
          </button>
        </div>



        {/* Search Bar */}
        <div className="mb-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tedarikçi adı, unvan, hizmet türü, iletişim kişisi, telefon, e-posta, adres, vergi numarası... herhangi bir şey arayın"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-8 pr-3 py-1 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-3 w-3 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">{filteredSuppliers.length}</span> sonuç bulundu
              {filteredSuppliers.length !== suppliers.length && (
                <span className="ml-2">({suppliers.length} toplam tedarikçi)</span>
              )}
            </div>
          )}
        </div>

        {/* Tedarikçiler Tablosu */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200 w-full min-w-0 flex-1 flex flex-col min-h-0">
          <div className="overflow-auto w-full flex-1">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Tedarikçi Adı
                      {sortField === 'name' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('service_type')}
                  >
                    <div className="flex items-center">
                      Hizmet Türü
                      {sortField === 'service_type' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('contact_person')}
                  >
                    <div className="flex items-center">
                      İletişim
                      {sortField === 'contact_person' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Vergi Bilgileri
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
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
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedSuppliers.items.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">
                      {supplier.name}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getServiceTypeColor(supplier.service_type)}`}>
                        {getServiceTypeDisplayName(supplier.service_type)}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white">
                      <div>
                        <div className="font-medium">{supplier.contact_person}</div>
                        <div className="text-gray-500">{supplier.phone}</div>
                        <div className="text-gray-500">{supplier.email}</div>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white">
                      <div>
                        <div className="font-medium">{supplier.tax_id}</div>
                        <div className="text-gray-500">{supplier.tax_office}</div>
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {formatDate(supplier.created_at)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${supplier.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {supplier.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs font-medium">
                      <div className="flex space-x-2">
                        {canEdit(Module.SUPPLIERS) && (
                          <button
                            onClick={() => handleEditSupplier(supplier)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors duration-200"
                            title="Düzenle"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {canDelete(Module.SUPPLIERS) && (
                          <button
                            onClick={() => setSupplierToDelete(supplier.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-200"
                            title="Sil"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
          page={paginatedSuppliers.page}
          pageSize={paginatedSuppliers.pageSize}
          total={paginatedSuppliers.total}
          totalPages={paginatedSuppliers.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          preferenceKey="suppliers_page_size"
          compactRight
        />


      {/* Add/Edit Supplier Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setEditingSupplier(null);
        }}
        title={editingSupplier ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi Ekle'}
        maxWidth="max-w-5xl"
      >
        <form onSubmit={editingSupplier ? handleUpdateSupplier : handleCreateSupplier} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Temel Bilgiler Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Building2 size={16} className="text-blue-500" />
                Kurumsal Bilgiler
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tedarikçi Adı *
                  </label>
                  <input
                    ref={editingSupplier ? editNameInputRef : newNameInputRef}
                    type="text"
                    defaultValue={editingSupplier?.name || ''}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    placeholder="Kısa isim"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tedarikçi Unvanı *
                  </label>
                  <input
                    ref={editingSupplier ? editTitleInputRef : newTitleInputRef}
                    type="text"
                    defaultValue={editingSupplier?.title || ''}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    placeholder="Tam ticari unvan"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Hizmet Türü *
                    </label>
                    <select
                      value={editingSupplier ? editingSupplier.service_type : newSupplier.service_type}
                      onChange={(e) => editingSupplier 
                        ? setEditingSupplier({...editingSupplier, service_type: e.target.value})
                        : setNewSupplier({...newSupplier, service_type: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm cursor-pointer appearance-none"
                      required
                    >
                      <option value="">Seçiniz</option>
                      {serviceTypes.map(st => (
                        <option key={st.id} value={st.name.toLowerCase()}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Vade / Ödeme Koşulu
                    </label>
                    <input
                      ref={editingSupplier ? editPaymentTermsInputRef : newPaymentTermsInputRef}
                      type="text"
                      defaultValue={editingSupplier?.contract_info?.payment_terms || ''}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                      placeholder="Örn: 30 Gün"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Vergi No
                    </label>
                    <input
                      ref={editingSupplier ? editTaxIdInputRef : newTaxIdInputRef}
                      type="text"
                      defaultValue={editingSupplier?.tax_id || ''}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Vergi Dairesi
                    </label>
                    <input
                      ref={editingSupplier ? editTaxOfficeInputRef : newTaxOfficeInputRef}
                      type="text"
                      defaultValue={editingSupplier?.tax_office || ''}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* İletişim Bilgileri Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Phone size={16} className="text-blue-500" />
                İletişim Detayları
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    İletişim Kişisi *
                  </label>
                  <input
                    ref={editingSupplier ? editContactPersonInputRef : newContactPersonInputRef}
                    type="text"
                    defaultValue={editingSupplier?.contact_person || ''}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    placeholder="Ad Soyad"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                      <Phone size={12} /> Telefon *
                    </label>
                    <input
                      ref={editingSupplier ? editPhoneInputRef : newPhoneInputRef}
                      type="tel"
                      defaultValue={editingSupplier?.phone || ''}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                      <Mail size={12} /> E-posta *
                    </label>
                    <input
                      ref={editingSupplier ? editEmailInputRef : newEmailInputRef}
                      type="email"
                      defaultValue={editingSupplier?.email || ''}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <MapPin size={12} /> Adres *
                  </label>
                  <textarea
                    ref={editingSupplier ? editAddressInputRef : newAddressInputRef}
                    defaultValue={editingSupplier?.address || ''}
                    required
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm resize-none"
                    placeholder="Fatura ve şirket adresi"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Muhasebe Kodları Section */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <FileText size={16} className="text-blue-500" />
              Muhasebe Bağlantı Kodları
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">TL Kodu</label>
                <input ref={editingSupplier ? editTlCodeInputRef : newTlCodeInputRef} type="text" defaultValue={editingSupplier?.accounting_link_codes?.TL || ''} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">EUR Kodu</label>
                <input ref={editingSupplier ? editEurCodeInputRef : newEurCodeInputRef} type="text" defaultValue={editingSupplier?.accounting_link_codes?.EUR || ''} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">USD Kodu</label>
                <input ref={editingSupplier ? editUsdCodeInputRef : newUsdCodeInputRef} type="text" defaultValue={editingSupplier?.accounting_link_codes?.USD || ''} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">GBP Kodu</label>
                <input ref={editingSupplier ? editGbpCodeInputRef : newGbpCodeInputRef} type="text" defaultValue={editingSupplier?.accounting_link_codes?.GBP || ''} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="isActiveModal"
              type="checkbox"
              className="w-4 h-4 text-blue-600 rounded border-slate-200 focus:ring-blue-500"
              checked={editingSupplier ? editingSupplier.is_active : newSupplier.is_active}
              onChange={(e) => editingSupplier 
                ? setEditingSupplier({...editingSupplier, is_active: e.target.checked})
                : setNewSupplier({...newSupplier, is_active: e.target.checked})}
            />
            <label htmlFor="isActiveModal" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Bu tedarikçi aktif olarak işaretlensin
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setEditingSupplier(null);
              }}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              {editingSupplier ? <Pencil size={18} /> : <Plus size={18} />}
              {editingSupplier ? 'Güncelle' : 'Tedarikçi Oluştur'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Silme Onay Modal */}
      <ConfirmModal
        isOpen={!!supplierToDelete}
        title="Tedarikçiyi Sil"
        message="Bu tedarikçiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        onConfirm={() => supplierToDelete && handleDeleteSupplier(supplierToDelete)}
        onCancel={() => setSupplierToDelete(null)}
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
            {success ? <Save size={18} className="text-white" /> : <Building2 size={18} className="text-white" />}
          </div>
          <span className="font-bold text-sm">{success || error}</span>
        </div>
      )}
    </div>
  </div>
  );
} 