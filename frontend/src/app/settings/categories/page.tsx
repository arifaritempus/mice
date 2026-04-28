'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/providers/ThemeProvider';
import { storage } from '@/utils/safeStorage';
import { usePermissions, Module } from '@/lib/permissions';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Category {
  id: string;
  name: string;
  description: string;
  type: 'main' | 'sub';
  parent_id?: string;
  created_at: string;
  is_active: boolean;
}

interface CategoryWithSubs extends Category {
  sub_categories: Category[];
}

export default function CategoriesPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const { isDark } = useTheme();
  const [categories, setCategories] = useState<CategoryWithSubs[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'main' as 'main' | 'sub',
    parent_id: ''
  });



  useEffect(() => {
    loadCategories();
  }, []);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.CATEGORIES)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
          <a href="/settings" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Ayarlara Dön
          </a>
        </div>
      </div>
    );
  }

  const loadCategories = () => {
    const savedCategories = storage.getItem('categories');
    
    if (savedCategories) {
      const parsedCategories: Category[] = JSON.parse(savedCategories);
      // Aynı id'ye sahip mükerrer kayıtları temizle
      const uniqueById = new Map<string, Category>();
      parsedCategories.forEach((cat) => {
        uniqueById.set(cat.id, cat);
      });
      const dedupedCategories = Array.from(uniqueById.values());
      if (dedupedCategories.length !== parsedCategories.length) {
        // Depoda da tekilleştir
        storage.setItem('categories', JSON.stringify(dedupedCategories));
      }
      // Ana kategorileri ve alt kategorilerini grupla
      const mainCategories = dedupedCategories.filter((cat: Category) => cat.type === 'main');
      const subCategories = dedupedCategories.filter((cat: Category) => cat.type === 'sub');
      
      const categoriesWithSubs = mainCategories.map((mainCat: Category) => ({
        ...mainCat,
        sub_categories: subCategories.filter((subCat: Category) => subCat.parent_id === mainCat.id)
      }));
      
      setCategories(categoriesWithSubs);
    } else {
      // Varsayılan kategoriler
      const defaultCategories: Category[] = [
        {
          id: '1',
          name: 'OTEL | KONAKLAMA',
          description: 'Otel konaklama hizmetleri',
          type: 'main',
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '2',
          name: 'OTEL | DİĞER HİZMETLER',
          description: 'Otel ek hizmetleri',
          type: 'main',
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '3',
          name: 'UÇAK BİLETİ',
          description: 'Uçak bileti hizmetleri',
          type: 'main',
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '4',
          name: 'TRANSFER & TUR',
          description: 'Transfer ve tur hizmetleri',
          type: 'main',
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '5',
          name: 'ETKİNLİK',
          description: 'Etkinlik organizasyonu',
          type: 'main',
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '6',
          name: 'İNSAN KAYNAKLARI',
          description: 'Personel hizmetleri',
          type: 'main',
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '7',
          name: 'DİĞER OPERASYONEL HİZMETLER',
          description: 'Diğer operasyonel hizmetler',
          type: 'main',
          created_at: new Date().toISOString(),
          is_active: true
        },
        // Alt kategoriler
        {
          id: '1-1',
          name: 'DOUBLE ODA KİŞİ BAŞI',
          description: 'Double oda kişi başı fiyatlandırma',
          type: 'sub',
          parent_id: '1',
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '1-2',
          name: 'SINGLE ODA',
          description: 'Single oda fiyatlandırma',
          type: 'sub',
          parent_id: '1',
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '2-1',
          name: 'TOPLANTI SALONU KULLANIMI',
          description: 'Toplantı salonu kullanım hizmeti',
          type: 'sub',
          parent_id: '2',
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '2-2',
          name: 'TEKNİK EKİPMAN KULLANIMI',
          description: 'Teknik ekipman kullanım hizmeti',
          type: 'sub',
          parent_id: '2',
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '3-1',
          name: 'GRUP UÇAK BİLETİ',
          description: 'Grup uçak bileti hizmeti',
          type: 'sub',
          parent_id: '3',
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '4-1',
          name: 'ALAN - OTEL - ALAN | GRUP TRANSFERİ',
          description: 'Grup transfer hizmeti',
          type: 'sub',
          parent_id: '4',
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '5-1',
          name: 'GALA YEMEĞİ | MASA SÜSLEME',
          description: 'Gala yemeği masa süsleme hizmeti',
          type: 'sub',
          parent_id: '5',
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '6-1',
          name: 'OPERASYON MÜDÜRÜ',
          description: 'Operasyon müdürü hizmeti',
          type: 'sub',
          parent_id: '6',
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '7-1',
          name: 'KARŞILAMA DESKİ',
          description: 'Karşılama desk hizmeti',
          type: 'sub',
          parent_id: '7',
          created_at: new Date().toISOString(),
          is_active: true
        }
      ];
      
      storage.setItem('categories', JSON.stringify(defaultCategories));
      
      const mainCategories = defaultCategories.filter(cat => cat.type === 'main');
      const subCategories = defaultCategories.filter(cat => cat.type === 'sub');
      
      const categoriesWithSubs = mainCategories.map(mainCat => ({
        ...mainCat,
        sub_categories: subCategories.filter(subCat => subCat.parent_id === mainCat.id)
      }));
      
      setCategories(categoriesWithSubs);
    }
    
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCategory: Category = {
      id: editingCategory ? editingCategory.id : `CAT_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      type: formData.type,
      parent_id: formData.type === 'sub' ? formData.parent_id : undefined,
      created_at: editingCategory ? editingCategory.created_at : new Date().toISOString(),
      is_active: true
    };

    const savedCategories = storage.getItem('categories');
    const allCategories = savedCategories ? JSON.parse(savedCategories) : [];
    
    if (editingCategory) {
      // Düzenleme
      const updatedCategories = allCategories
        .filter((cat: Category) => cat.id !== editingCategory.id) // olası mükerrerleri temizle
        .concat(newCategory);
      storage.setItem('categories', JSON.stringify(updatedCategories));
    } else {
      // Yeni ekleme
      // Aynı id varsa önce temizle (tekrar eklenme durumunda UI hataları yaşanmasın)
      const withoutDup = allCategories.filter((cat: Category) => cat.id !== newCategory.id);
      const updatedCategories = [...withoutDup, newCategory];
      storage.setItem('categories', JSON.stringify(updatedCategories));
    }

    setFormData({ name: '', description: '', type: 'main', parent_id: '' });
    setEditingCategory(null);
    setShowAddModal(false);
    loadCategories();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      type: category.type,
      parent_id: category.parent_id || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = (categoryId: string) => {
    if (confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
      const savedCategories = storage.getItem('categories');
      const allCategories = savedCategories ? JSON.parse(savedCategories) : [];
      
      // Ana kategori silinirse alt kategorileri de sil
      const updatedCategories = allCategories.filter((cat: Category) => 
        cat.id !== categoryId && cat.parent_id !== categoryId
      );
      
      storage.setItem('categories', JSON.stringify(updatedCategories));
      loadCategories();
    }
  };

  const toggleActive = (categoryId: string) => {
    const savedCategories = storage.getItem('categories');
    const allCategories = savedCategories ? JSON.parse(savedCategories) : [];
    
    const updatedCategories = allCategories.map((cat: Category) => 
      cat.id === categoryId ? { ...cat, is_active: !cat.is_active } : cat
    );
    
    storage.setItem('categories', JSON.stringify(updatedCategories));
    loadCategories();
  };

  const mainCategories = categories.filter(cat => cat.type === 'main');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kategori Yönetimi</h1>
            <p className="text-gray-600 mt-2">Teklif kategorilerini yönetin ve düzenleyin</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Yeni Kategori
          </button>
        </div>

        {/* Categories List */}
        <div className="space-y-6">
          {mainCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {category.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleActive(category.id)}
                      className={`px-3 py-1 text-sm rounded ${
                        category.is_active 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {category.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                    </button>
                    <button
                      onClick={() => handleEdit(category)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Sil
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
              </div>
              
              {/* Sub Categories */}
              {category.sub_categories.length > 0 && (
                <div className="px-6 py-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Alt Kategoriler</h4>
                  <div className="space-y-2">
                    {category.sub_categories.map((subCategory) => (
                      <div key={subCategory.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">{subCategory.name}</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            subCategory.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {subCategory.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleActive(subCategory.id)}
                            className={`px-2 py-1 text-xs rounded ${
                              subCategory.is_active 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {subCategory.is_active ? 'Pasif' : 'Aktif'}
                          </button>
                          <button
                            onClick={() => handleEdit(subCategory)}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDelete(subCategory.id)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Kategori adını girin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Kategori açıklamasını girin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori Türü *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'main' | 'sub' })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="main">Ana Kategori</option>
                    <option value="sub">Alt Kategori</option>
                  </select>
                </div>

                {formData.type === 'sub' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ana Kategori *
                    </label>
                    <select
                      value={formData.parent_id}
                      onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Ana kategori seçin</option>
                      {mainCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingCategory(null);
                      setFormData({ name: '', description: '', type: 'main', parent_id: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingCategory ? 'Güncelle' : 'Ekle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 