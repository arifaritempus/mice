"use client";

import { useState, useEffect } from "react";
import { ExcelUtils, ExcelImportUtils } from "@/utils/excelUtils";
import { usePermissions, Module } from "@/lib/permissions";
import { quotesService, suppliersService } from "@/lib/supabaseService";
import Modal from "@/components/Modal";

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
  operation_type:
    | "sejour"
    | "transfer"
    | "guide"
    | "part_time"
    | "extra_service";
  service_date: string;
  service_description: string;
  quantity: number;
  unit_price: number;
  currency: string;
  total_amount: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string;
  created_at: string;
  updated_at: string;
}

export default function OperationsPage() {
  const {
    canView,
    canCreate,
    canEdit,
    canDelete,
    userRole,
    loading: permissionsLoading,
  } = usePermissions();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newOperation, setNewOperation] = useState({
    quote_id: "",
    supplier_id: "",
    operation_type: "sejour" as const,
    service_date: "",
    service_description: "",
    quantity: 1,
    unit_price: 0,
    currency: "EUR",
    status: "pending" as const,
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setOperations([]);
      const [supplierList, quoteList] = await Promise.all([
        suppliersService.getAll(),
        quotesService.getAll(),
      ]);
      setSuppliers((supplierList || []) as any);
      setQuotes((quoteList || []) as any);

      setLoading(false);
    } catch (error: any) {
      setError("Veriler yüklenirken hata oluştu");
      setLoading(false);
    }
  };

  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="relative">
          <div className="w-8 h-8 rounded-full border-4 border-gray-200 dark:border-v3-border"></div>
          <div className="absolute top-0 left-0 w-8 h-8 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
        </div>
      </div>
    );
  }

  // Operations görüntüleme yetkisi kontrolü
  if (!canView(Module.OPERATIONS)) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-v3-text mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-v3-muted mb-6">
            Operasyonlar sayfasına erişim için yetkiniz bulunmuyor.
          </p>
          <a
            href="/"
            className="bg-blue-500 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  const handleCreateOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const quote = quotes.find((q) => q.id === newOperation.quote_id);
      const supplier = suppliers.find((s) => s.id === newOperation.supplier_id);

      const operationWithId: Operation = {
        id: Date.now().toString(),
        quote_id: newOperation.quote_id,
        quote_reference: quote?.reference || "",
        supplier_id: newOperation.supplier_id,
        supplier_name: supplier?.name || "",
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
        updated_at: new Date().toISOString(),
      };

      const updatedOperations = [...operations, operationWithId];
      setOperations(updatedOperations);

      setSuccess("Operasyon başarıyla oluşturuldu");
      setShowCreateModal(false);
      setNewOperation({
        quote_id: "",
        supplier_id: "",
        operation_type: "sejour",
        service_date: "",
        service_description: "",
        quantity: 1,
        unit_price: 0,
        currency: "EUR",
        status: "pending",
        notes: "",
      });
    } catch (error: any) {
      setError(error.message || "Operasyon oluşturulurken hata oluştu");
    }
  };

  const getOperationTypeDisplayName = (type: string) => {
    switch (type) {
      case "sejour":
        return "Sejour";
      case "transfer":
        return "MICE Transfer";
      case "guide":
        return "Kokartlı Rehber";
      case "part_time":
        return "Part-Time";
      case "extra_service":
        return "Ekstra Hizmet";
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30";
      case "confirmed":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30";
      case "completed":
        return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-300 border border-red-500/30";
      default:
        return "bg-v3-border text-v3-text border border-v3-border";
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "pending":
        return "Beklemede";
      case "confirmed":
        return "Onaylandı";
      case "completed":
        return "Tamamlandı";
      case "cancelled":
        return "İptal Edildi";
      default:
        return status;
    }
  };

  // İstatistikler
  const stats = {
    total: operations.length,
    pending: operations.filter((op) => op.status === "pending").length,
    confirmed: operations.filter((op) => op.status === "confirmed").length,
    completed: operations.filter((op) => op.status === "completed").length,
    totalAmount: operations.reduce((sum, op) => sum + op.total_amount, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="relative">
          <div className="w-8 h-8 rounded-full border-4 border-gray-200 dark:border-v3-border"></div>
          <div className="absolute top-0 left-0 w-8 h-8 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
          <div
            className="absolute top-0 left-0 w-8 h-8 rounded-full border-4 border-transparent border-r-blue-500 dark:border-r-blue-300 animate-spin"
            style={{ animationDelay: "0.1s", animationDuration: "1.5s" }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-v3-text">
      <div className="w-full min-w-0 flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-light tracking-wide text-v3-text glow-text">
              Operasyon Yönetimi
            </h1>
            <p className="text-xs text-v3-muted mt-1">
              Sejour, transfer, rehber ve ekstra hizmet operasyonlarını yönetin
            </p>
          </div>
          {canCreate(Module.OPERATIONS) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] px-4 py-2 rounded-xl transition-all duration-300 text-xs font-medium"
            >
              Yeni Operasyon Ekle
            </button>
          )}
        </div>

        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-v3-surface backdrop-blur-md border border-v3-border rounded-xl p-2 shadow-sm">
          <span className="text-[10px] uppercase font-semibold text-v3-muted mr-1 pl-1">
            İstatistikler:
          </span>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-300">
            <span className="text-[10px] font-medium uppercase tracking-wider">
              Toplam
            </span>
            <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
              {stats.total}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-300">
            <span className="text-[10px] font-medium uppercase tracking-wider">
              Beklemede
            </span>
            <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
              {stats.pending}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-300">
            <span className="text-[10px] font-medium uppercase tracking-wider">
              Onaylandı
            </span>
            <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
              {stats.confirmed}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-purple-500/10 border-purple-500/20 text-purple-300">
            <span className="text-[10px] font-medium uppercase tracking-wider">
              Tamamlandı
            </span>
            <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
              {stats.completed}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300 ml-auto mr-1">
            <span className="text-[10px] font-medium uppercase tracking-wider">
              Toplam Tutar
            </span>
            <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
              €{stats.totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Operasyonlar Tablosu */}
        <div className="bg-v3-surface backdrop-blur-md border border-v3-border rounded-2xl w-full min-w-0 flex-grow shrink-0 flex flex-col relative overflow-hidden">
          <div className="w-full flex-1 overflow-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-v3-surface sticky top-0 z-10 backdrop-blur-md shadow-sm border-b border-v3-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Teklif Ref.
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Tedarikçi
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Operasyon Türü
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Hizmet Tarihi
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Açıklama
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Miktar
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Birim Fiyat
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Toplam
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {operations.map((operation) => (
                  <tr
                    key={operation.id}
                    className="hover:bg-v3-border transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-v3-text">
                      {operation.quote_reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-v3-text">
                      {operation.supplier_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-v3-text">
                      {getOperationTypeDisplayName(operation.operation_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-v3-text">
                      {new Date(operation.service_date).toLocaleDateString(
                        "tr-TR",
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-v3-text max-w-xs truncate">
                      {operation.service_description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-v3-text">
                      {operation.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-v3-text">
                      €{operation.unit_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-v3-text">
                      €{operation.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(operation.status)}`}
                      >
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
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Yeni Operasyon Ekle"
            maxWidth="max-w-md"
          >
            <form onSubmit={handleCreateOperation}>
              <div className="space-y-4 text-v3-text">
                <div>
                  <label className="block text-xs font-semibold text-v3-text ml-1 mb-1.5">
                    Teklif
                  </label>
                  <select
                    value={newOperation.quote_id}
                    onChange={(e) =>
                      setNewOperation({
                        ...newOperation,
                        quote_id: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm text-v3-text transition-all appearance-none"
                    required
                  >
                    <option value="" className="bg-v3-surface">
                      Teklif Seçin
                    </option>
                    {quotes.map((quote) => (
                      <option
                        key={quote.id}
                        value={quote.id}
                        className="bg-v3-surface"
                      >
                        {quote.reference}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-v3-text ml-1 mb-1.5">
                    Tedarikçi
                  </label>
                  <select
                    value={newOperation.supplier_id}
                    onChange={(e) =>
                      setNewOperation({
                        ...newOperation,
                        supplier_id: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm text-v3-text transition-all appearance-none"
                    required
                  >
                    <option value="" className="bg-v3-surface">
                      Tedarikçi Seçin
                    </option>
                    {suppliers.map((supplier) => (
                      <option
                        key={supplier.id}
                        value={supplier.id}
                        className="bg-v3-surface"
                      >
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-v3-text ml-1 mb-1.5">
                    Operasyon Türü
                  </label>
                  <select
                    value={newOperation.operation_type}
                    onChange={(e) =>
                      setNewOperation({
                        ...newOperation,
                        operation_type: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm text-v3-text transition-all appearance-none"
                    required
                  >
                    <option value="sejour" className="bg-v3-surface">
                      Sejour
                    </option>
                    <option value="transfer" className="bg-v3-surface">
                      MICE Transfer
                    </option>
                    <option value="guide" className="bg-v3-surface">
                      Kokartlı Rehber
                    </option>
                    <option value="part_time" className="bg-v3-surface">
                      Part-Time
                    </option>
                    <option value="extra_service" className="bg-v3-surface">
                      Ekstra Hizmet
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-v3-text ml-1 mb-1.5">
                    Hizmet Tarihi
                  </label>
                  <input
                    type="date"
                    value={newOperation.service_date}
                    onChange={(e) =>
                      setNewOperation({
                        ...newOperation,
                        service_date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm text-v3-text transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-v3-text ml-1 mb-1.5">
                    Açıklama
                  </label>
                  <textarea
                    value={newOperation.service_description}
                    onChange={(e) =>
                      setNewOperation({
                        ...newOperation,
                        service_description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm text-v3-text transition-all resize-none"
                    rows={3}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-v3-text ml-1 mb-1.5">
                      Miktar
                    </label>
                    <input
                      type="number"
                      value={newOperation.quantity}
                      onChange={(e) =>
                        setNewOperation({
                          ...newOperation,
                          quantity: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm text-v3-text transition-all"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-v3-text ml-1 mb-1.5">
                      Birim Fiyat
                    </label>
                    <input
                      type="number"
                      value={newOperation.unit_price}
                      onChange={(e) =>
                        setNewOperation({
                          ...newOperation,
                          unit_price: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm text-v3-text transition-all"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-v3-text ml-1 mb-1.5">
                    Notlar
                  </label>
                  <textarea
                    value={newOperation.notes}
                    onChange={(e) =>
                      setNewOperation({
                        ...newOperation,
                        notes: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm text-v3-text transition-all resize-none"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-v3-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 text-xs font-semibold text-v3-text hover:text-v3-text transition-colors uppercase"
                >
                  İPTAL
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 rounded-xl text-xs font-semibold transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)] uppercase"
                >
                  KAYDET
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Hata ve Başarı Mesajları */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl z-50 backdrop-blur-md shadow-[0_0_15px_rgba(239,68,68,0.15)] flex items-center justify-between gap-4">
            <span className="block sm:inline text-sm font-medium">{error}</span>
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <span className="sr-only">Kapat</span>
              <svg
                className="fill-current h-5 w-5"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </button>
          </div>
        )}

        {success && (
          <div className="fixed top-4 right-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 px-4 py-3 rounded-xl z-50 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center justify-between gap-4">
            <span className="block sm:inline text-sm font-medium">
              {success}
            </span>
            <button
              onClick={() => setSuccess("")}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-600 dark:text-emerald-300 transition-colors"
            >
              <span className="sr-only">Kapat</span>
              <svg
                className="fill-current h-5 w-5"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
