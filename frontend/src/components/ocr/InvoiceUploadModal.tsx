"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2, Camera, Trash2, ZoomIn, Play } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { categoriesService } from "@/lib/supabaseService";
import { toast } from "react-hot-toast";

type EntityType = "MICE" | "SEJOUR" | "GENERAL";

interface UploadedFile {
  id: string; // db id if it's uploaded
  localId: string; // local temporary id
  file: File;
  previewUrl: string;
  status: "pending" | "uploading" | "analyzing" | "review" | "approved" | "error";
  extractedData?: any;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultEntity?: { type: EntityType; id?: string };
  lockEntitySelection?: boolean;
}

const compressImage = (file: File, maxWidth = 1600, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: file.type, lastModified: Date.now() }));
          } else {
            resolve(file);
          }
        }, file.type, quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default function InvoiceUploadModal({ isOpen, onClose, defaultEntity, lockEntitySelection }: Props) {
  const [entityType, setEntityType] = useState<EntityType>(defaultEntity?.type || "MICE");
  const [entityId, setEntityId] = useState<string>(defaultEntity?.id || "");
  const [sejours, setSejours] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dbEntities, setDbEntities] = useState<{ id: string, name: string }[]>([]);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isZoomed, setIsZoomed] = useState(false);

  // ESC ile kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Veritabanından proje veya sejour listesini çek
  useEffect(() => {
    if (entityType === "GENERAL") return;

    const fetchEntities = async () => {
      setIsLoadingEntities(true);
      try {
        if (entityType === "MICE") {
          const { data, error } = await supabase
            .from("projects")
            .select(`
              id, 
              project_code,
              title,
              company_name,
              start_date,
              end_date,
              agencies(name),
              hotels(name)
            `)
            .order("created_at", { ascending: false });
            
          if (!error && data) {
            setDbEntities(data.map((p: any) => {
              const agencyName = p.agencies?.name || "-";
              const hotelName = p.hotels?.name || "-";
              const sDate = p.start_date ? new Date(p.start_date).toLocaleDateString("tr-TR") : "-";
              const eDate = p.end_date ? new Date(p.end_date).toLocaleDateString("tr-TR") : "-";
              
              return { 
                id: p.id, 
                name: `[${p.project_code || p.title || 'KOD YOK'}] ${sDate} - ${eDate} | ${p.company_name || 'Firma Yok'} | Acente: ${agencyName} | Otel: ${hotelName}`
              };
            }));
          }
        } else if (entityType === "SEJOUR") {
          const { data, error } = await supabase
            .from("sejours")
            .select(`
              id, 
              voucher_number,
              customer_name,
              check_in_date,
              check_out_date,
              agencies(name),
              hotels(name)
            `)
            .order("created_at", { ascending: false });
            
          if (!error && data) {
            setDbEntities(data.map((s: any) => {
              const agencyName = s.agencies?.name || "-";
              const hotelName = s.hotels?.name || "-";
              const sDate = s.check_in_date ? new Date(s.check_in_date).toLocaleDateString("tr-TR") : "-";
              const eDate = s.check_out_date ? new Date(s.check_out_date).toLocaleDateString("tr-TR") : "-";
              
              return { 
                id: s.id, 
                name: `[${s.voucher_number || 'VOUCHER YOK'}] ${s.customer_name || 'İsimsiz'} | ${sDate} - ${eDate} | Acente: ${agencyName} | Otel: ${hotelName}` 
              };
            }));
          }
        }
        const allCategories = await categoriesService.getAll();
        setCategories(allCategories.filter((c: any) => !c.parent_id)); // Only main categories

      } catch (err) {
        console.error("Entity/Category fetch error:", err);
      } finally {
        setIsLoadingEntities(false);
      }
    };

    fetchEntities();
  }, [entityType]);

  const filteredEntities = dbEntities.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => file.type.startsWith("image/") || file.type === "application/pdf");
    
    const fileObjects: UploadedFile[] = validFiles.map(file => ({
      id: "",
      localId: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending"
    }));

    setFiles(prev => [...prev, ...fileObjects]);
    if (!selectedFileId && fileObjects.length > 0) {
        setSelectedFileId(fileObjects[0].localId);
    }
  };

  const removeFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => {
      const newFiles = prev.filter(f => f.localId !== id);
      if (selectedFileId === id) {
        setSelectedFileId(newFiles.length > 0 ? newFiles[0].localId : null);
      }
      return newFiles;
    });
  };

  const startAnalysis = async () => {
    if (entityType === "MICE" && !entityId) {
      toast.error("Lütfen faturayı atamak istediğiniz MICE projesini seçiniz.");
      return;
    }
    if (entityType === "SEJOUR" && !entityId) {
      toast.error("Lütfen faturayı atamak istediğiniz SEJOUR rezervasyonunu seçiniz.");
      return;
    }

    setFiles(prev => prev.map(f => f.status === "pending" ? { ...f, status: "uploading" } : f));
    
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;
      
      const localId = files[i].localId;
      
      try {
        const fileToUpload = await compressImage(files[i].file);
        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("entityType", entityType);
        formData.append("entityId", entityId);

        setFiles(prev => prev.map(f => f.localId === localId ? { ...f, status: "analyzing" } : f));

        const response = await fetch("/api/ocr", {
          method: "POST",
          body: formData
        });

        if (!response.ok) throw new Error("Upload failed");
        
        const data = await response.json();

        setFiles(prev => prev.map(f => f.localId === localId ? { 
          ...f, 
          id: data.invoiceId,
          status: "review",
          extractedData: data.extractedData
        } : f));

      } catch (err) {
        console.error(err);
        setFiles(prev => prev.map(f => f.localId === localId ? { ...f, status: "error" } : f));
      }
    }
  };

  const handleApprove = async (file: UploadedFile) => {
    if (!file.id) return; 

    const ext = file.extractedData;
    if (!ext || !ext.category || !ext.invoiceNo || !ext.date || !ext.supplier) {
      toast.error("Kategori, Fatura No, Tarih veya Tedarikçi alanları eksik! Lütfen doldurun.");
      return;
    }
    if (!ext.items || ext.items.length === 0) {
      toast.error("Faturada en az 1 kalem olmalıdır!");
      return;
    }
    for (const item of ext.items) {
       if (!item.description || item.subtotal === undefined || item.subtotal === null) {
         toast.error("Tüm kalemlerin açıklaması ve matrahı girilmelidir!");
         return;
       }
    }

    try {
      const res = await fetch("/api/invoices/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: file.id,
          extractedData: file.extractedData
        })
      });

      if (!res.ok) throw new Error("Approval failed");

      setFiles(prev => prev.map(f => f.localId === file.localId ? { ...f, status: "approved" } : f));
      
      const currentIndex = files.findIndex(f => f.localId === file.localId);
      if (currentIndex < files.length - 1) {
        setSelectedFileId(files[currentIndex + 1].localId);
      }
    } catch (err) {
      console.error(err);
      toast.error("Onaylanırken bir hata oluştu!");
    }
  };

  const selectedFile = files.find(f => f.localId === selectedFileId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-[1400px] bg-v3-surface dark:bg-v3-surface-dark border border-v3-border dark:border-v3-border-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header & Context */}
        <div className="p-5 border-b border-v3-border dark:border-v3-border-dark bg-v3-surface/80 backdrop-blur-md z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
          <div className="flex justify-between items-start w-full md:w-auto pr-8 md:pr-0">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" /> Yapay Zeka Fatura Okuma
              </h2>
              <p className="text-xs text-v3-text-muted mt-1">Faturaları yükleyin, görselden doğrulayın ve kaydedin.</p>
            </div>
            <button onClick={onClose} className="md:hidden absolute top-4 right-4 p-2 hover:bg-v3-bg dark:hover:bg-v3-bg-dark rounded-xl text-v3-text-muted"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex items-center gap-3 flex-1 md:max-w-xl">
            <div className="flex bg-v3-bg dark:bg-v3-bg-dark rounded-lg p-1 border border-v3-border dark:border-v3-border-dark">
              {(["MICE", "SEJOUR", "GENERAL"] as EntityType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setEntityType(type)}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${entityType === type ? "bg-white dark:bg-gray-800 text-blue-600 shadow-sm" : "text-v3-text-muted hover:text-v3-text"}`}
                >
                  {type}
                </button>
              ))}
            </div>
            
            {entityType !== "GENERAL" && (
              <div className="flex-1 relative">
                <div 
                  onClick={() => { if (!isLoadingEntities && !lockEntitySelection) setDropdownOpen(!dropdownOpen); }}
                  className={`w-full bg-v3-bg dark:bg-v3-bg-dark border border-v3-border dark:border-v3-border-dark rounded-lg p-2 flex items-center justify-between ${isLoadingEntities || lockEntitySelection ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}`}
                >
                  <span className="truncate text-v3-text text-xs font-medium pr-2">
                    {entityId ? dbEntities.find(e => e.id === entityId)?.name || "Seçildi" : `İlgili ${entityType} Seçiniz...`}
                  </span>
                  {isLoadingEntities ? <Loader2 className="w-3 h-3 animate-spin text-v3-text-muted" /> : !lockEntitySelection && <span className="text-[10px]">▼</span>}
                </div>
                {dropdownOpen && !lockEntitySelection && (
                  <div className="absolute top-full right-0 w-[400px] max-w-[90vw] mt-2 bg-v3-surface dark:bg-v3-surface-dark border border-v3-border dark:border-v3-border-dark rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-v3-border dark:border-v3-border-dark bg-v3-bg/50">
                      <input 
                        type="text" autoFocus placeholder="Ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-v3-surface dark:bg-v3-surface-dark border border-v3-border dark:border-v3-border-dark rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                      {filteredEntities.length === 0 ? (
                        <div className="p-3 text-center text-xs text-v3-text-muted">Sonuç bulunamadı</div>
                      ) : (
                        filteredEntities.map(entity => (
                          <button key={entity.id} onClick={() => { setEntityId(entity.id); setDropdownOpen(false); setSearchTerm(""); }}
                            className={`w-full text-left p-2.5 text-xs rounded-lg transition-colors ${entity.id === entityId ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 font-medium' : 'hover:bg-v3-bg dark:hover:bg-v3-bg-dark text-v3-text'}`}
                          >
                            {entity.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={onClose} className="hidden md:block p-2 hover:bg-v3-bg dark:hover:bg-v3-bg-dark rounded-xl text-v3-text-muted"><X className="w-5 h-5" /></button>
        </div>

        {/* Upload & Horizontal File List Strip */}
        <div className="border-b border-v3-border dark:border-v3-border-dark bg-v3-bg/30 p-3 flex items-center gap-3 overflow-x-auto min-h-[100px]">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            className={`min-w-[120px] h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-v3-border hover:border-blue-400 hover:bg-v3-surface'}`}
          >
            <Upload className="w-5 h-5 text-blue-500 mb-1" />
            <span className="text-xs font-medium text-v3-text-muted">Fatura Yükle</span>
          </div>
          <input type="file" multiple accept="image/*,application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
          
          {files.length > 0 && (
            <button onClick={startAnalysis} className="min-w-[140px] h-20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95">
              <Play className="w-6 h-6 mb-1 text-blue-100" />
              <span className="text-xs font-bold">Hepsini Oku</span>
            </button>
          )}

          {files.map((file, idx) => (
            <div 
              key={file.localId} onClick={() => setSelectedFileId(file.localId)}
              className={`relative min-w-[70px] w-[70px] h-20 rounded-xl border-2 cursor-pointer overflow-hidden transition-all ${selectedFileId === file.localId ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20' : 'border-v3-border hover:border-blue-300 opacity-70 hover:opacity-100'}`}
            >
              <img src={file.previewUrl} className="w-full h-full object-cover" />
              <button onClick={(e) => removeFile(file.localId, e)} className="absolute top-0.5 right-0.5 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 z-10"><X className="w-2 h-2" /></button>
              
              <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm text-[9px] text-white text-center font-medium py-0.5 flex items-center justify-center gap-1">
                {file.status === "pending" && "Bekliyor"}
                {file.status === "uploading" && <><Loader2 className="w-2 h-2 animate-spin"/> Yükleniyor</>}
                {file.status === "analyzing" && <><Loader2 className="w-2 h-2 animate-spin"/> Okunuyor</>}
                {file.status === "review" && <span className="text-yellow-300">Teyit Bekliyor</span>}
                {file.status === "approved" && <span className="text-green-400">Onaylandı</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area (Split) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-v3-surface dark:bg-v3-surface-dark">
          {selectedFile ? (
            <>
              {/* Image Viewer (Left) */}
              <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-v3-border dark:border-v3-border-dark bg-gray-100 dark:bg-gray-900 lg:overflow-auto relative flex items-center justify-center p-4 min-h-[250px] shrink-0">
                <button onClick={() => setIsZoomed(!isZoomed)} className="absolute top-4 right-4 bg-white/80 dark:bg-black/50 backdrop-blur p-2 rounded-lg shadow-md z-10 hover:bg-white transition-colors">
                  <ZoomIn className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </button>
                <img 
                  src={selectedFile.previewUrl} 
                  className={`max-w-none transition-all duration-300 ${isZoomed ? 'w-auto' : 'w-full h-full object-contain'} ${selectedFile.status === 'analyzing' || selectedFile.status === 'uploading' ? 'opacity-30 blur-sm' : ''}`} 
                  alt="Invoice Document"
                />
                
                {(selectedFile.status === "uploading" || selectedFile.status === "analyzing") && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/10 backdrop-blur-[2px]">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-in zoom-in-95">
                      <div className="relative w-16 h-16 mb-4">
                        <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Yapay Zeka Okuyor...</h3>
                      <p className="text-xs text-gray-500 mt-2 text-center max-w-[200px]">Bu işlem birkaç saniye sürebilir, lütfen bekleyin.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Form (Right) */}
              <div className="w-full lg:w-1/2 flex flex-col lg:h-full bg-v3-surface dark:bg-v3-surface-dark lg:overflow-y-auto">
                <div className="p-6 lg:p-8 space-y-6 max-w-2xl mx-auto w-full">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-v3-text">Fatura Detayları</h3>
                    {selectedFile.status === "review" && (
                      <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 text-xs font-bold rounded-full border border-yellow-500/20">Kontrol ve Onay Bekleniyor</span>
                    )}
                    {selectedFile.status === "approved" && (
                      <span className="px-3 py-1 bg-green-500/10 text-green-600 text-xs font-bold rounded-full border border-green-500/20">Sisteme Kaydedildi</span>
                    )}
                  </div>

                  {/* Informational Error if OCR fails */}
                  {selectedFile.extractedData?.supplier?.startsWith("OCR HATASI:") && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-lg text-sm text-red-700 dark:text-red-400 font-medium">
                      Yapay Zeka Okuması Başarısız: {selectedFile.extractedData.supplier.replace("OCR HATASI:", "")}. 
                      <br/>Google Credentials veya Yetki sorunu olabilir.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-v3-text-muted uppercase tracking-wider">Fatura Numarası</label>
                      <input 
                        type="text" 
                        value={selectedFile.extractedData?.invoiceNo || ""}
                        onChange={(e) => setFiles(prev => prev.map(f => f.localId === selectedFile.localId ? { ...f, extractedData: { ...f.extractedData, invoiceNo: e.target.value } } : f))}
                        className="w-full bg-v3-bg dark:bg-v3-bg-dark border border-v3-border dark:border-v3-border-dark rounded-xl px-4 py-3 text-sm font-bold text-v3-text outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-v3-text-muted uppercase tracking-wider">Tarih</label>
                      <input 
                        type="date" 
                        value={selectedFile.extractedData?.date || ""}
                        onChange={(e) => setFiles(prev => prev.map(f => f.localId === selectedFile.localId ? { ...f, extractedData: { ...f.extractedData, date: e.target.value } } : f))}
                        className="w-full bg-v3-bg dark:bg-v3-bg-dark border border-v3-border dark:border-v3-border-dark rounded-xl px-4 py-3 text-sm font-bold text-v3-text outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-v3-text-muted uppercase tracking-wider">Tedarikçi / Cari Unvanı</label>
                    <input 
                      type="text" 
                      value={selectedFile.extractedData?.supplier || ""}
                      onChange={(e) => setFiles(prev => prev.map(f => f.localId === selectedFile.localId ? { ...f, extractedData: { ...f.extractedData, supplier: e.target.value } } : f))}
                      className="w-full bg-v3-bg dark:bg-v3-bg-dark border border-v3-border dark:border-v3-border-dark rounded-xl px-4 py-3 text-sm font-bold text-v3-text outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-v3-text-muted uppercase tracking-wider">Kategori</label>
                    <select
                      value={selectedFile.extractedData?.category || ""}
                      onChange={(e) => setFiles(prev => prev.map(f => f.localId === selectedFile.localId ? { ...f, extractedData: { ...f.extractedData, category: e.target.value } } : f))}
                      className="w-full bg-v3-bg dark:bg-v3-bg-dark border border-v3-border dark:border-v3-border-dark rounded-xl px-4 py-3 text-sm font-bold text-v3-text outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                    >
                      <option value="">Kategori Seçin</option>
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fatura Kalemleri (Items) */}
                  <div className="p-6 bg-v3-bg/50 dark:bg-v3-bg-dark/50 border border-v3-border dark:border-v3-border-dark rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-v3-text">Fatura Kalemleri</h4>
                      <button 
                        onClick={() => {
                          const newItem = { id: Math.random().toString(36).substring(7), description: "", subtotal: 0, taxRate: 0, total: 0 };
                          setFiles(prev => prev.map(f => f.localId === selectedFile.localId ? {
                            ...f,
                            extractedData: {
                              ...f.extractedData,
                              items: [...(f.extractedData.items || []), newItem]
                            }
                          } : f));
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                      >
                        + Yeni Kalem
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(selectedFile.extractedData?.items || []).map((item: any, index: number) => (
                        <div key={item.id || index} className="grid grid-cols-12 gap-3 items-end bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                          <div className="col-span-12 lg:col-span-5 space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase truncate block">Açıklama</label>
                            <input 
                              type="text" 
                              value={item.description}
                              onChange={(e) => {
                                const newItems = [...selectedFile.extractedData.items];
                                newItems[index].description = e.target.value;
                                setFiles(prev => prev.map(f => f.localId === selectedFile.localId ? { ...f, extractedData: { ...f.extractedData, items: newItems } } : f));
                              }}
                              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
                              placeholder="Kalem açıklaması"
                            />
                          </div>
                          <div className="col-span-4 lg:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase truncate block">Matrah</label>
                            <input 
                              type="number" 
                              value={item.subtotal || ""}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const newItems = [...selectedFile.extractedData.items];
                                newItems[index].subtotal = val;
                                newItems[index].total = val * (1 + (newItems[index].taxRate || 0) / 100);
                                
                                const globalSubtotal = newItems.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
                                const globalTotal = newItems.reduce((acc, curr) => acc + (curr.total || 0), 0);
                                const globalTax = globalSubtotal > 0 ? ((globalTotal - globalSubtotal) / globalSubtotal) * 100 : 0;
                                
                                setFiles(prev => prev.map(f => f.localId === selectedFile.localId ? { 
                                  ...f, 
                                  extractedData: { ...f.extractedData, items: newItems, subtotal: globalSubtotal, total: globalTotal, tax: Math.round(globalTax) } 
                                } : f));
                              }}
                              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500 text-right"
                            />
                          </div>
                          <div className="col-span-4 lg:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase truncate block">KDV(%)</label>
                            <input 
                              type="number" 
                              value={item.taxRate === 0 ? "" : (item.taxRate || "")}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const newItems = [...selectedFile.extractedData.items];
                                newItems[index].taxRate = val;
                                newItems[index].subtotal = (newItems[index].total || 0) / (1 + val / 100);
                                
                                const globalSubtotal = newItems.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
                                const globalTotal = newItems.reduce((acc, curr) => acc + (curr.total || 0), 0);
                                const globalTax = globalSubtotal > 0 ? ((globalTotal - globalSubtotal) / globalSubtotal) * 100 : 0;

                                setFiles(prev => prev.map(f => f.localId === selectedFile.localId ? { 
                                  ...f, 
                                  extractedData: { ...f.extractedData, items: newItems, subtotal: globalSubtotal, total: globalTotal, tax: Math.round(globalTax) } 
                                } : f));
                              }}
                              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500 text-center"
                            />
                          </div>
                          <div className="col-span-3 lg:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-blue-500 uppercase truncate block" title="Toplam (KDV Dahil)">Toplam (Dahil)</label>
                            <input 
                              type="number" 
                              value={item.total === 0 ? "" : (item.total || "")}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const newItems = [...selectedFile.extractedData.items];
                                newItems[index].total = val;
                                newItems[index].subtotal = val / (1 + (newItems[index].taxRate || 0) / 100);
                                
                                const globalSubtotal = newItems.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
                                const globalTotal = newItems.reduce((acc, curr) => acc + (curr.total || 0), 0);
                                const globalTax = globalSubtotal > 0 ? ((globalTotal - globalSubtotal) / globalSubtotal) * 100 : 0;

                                setFiles(prev => prev.map(f => f.localId === selectedFile.localId ? { 
                                  ...f, 
                                  extractedData: { ...f.extractedData, items: newItems, subtotal: globalSubtotal, total: globalTotal, tax: Math.round(globalTax) } 
                                } : f));
                              }}
                              className="w-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 outline-none focus:border-blue-500 text-right shadow-sm"
                            />
                          </div>
                          <div className="col-span-1 lg:col-span-1 flex items-center justify-center">
                            <button 
                              onClick={() => {
                                const newItems = selectedFile.extractedData.items.filter((_: any, i: number) => i !== index);
                                const globalSubtotal = newItems.reduce((acc: number, curr: any) => acc + (curr.subtotal || 0), 0);
                                const globalTotal = newItems.reduce((acc: number, curr: any) => acc + (curr.total || 0), 0);
                                const globalTax = globalSubtotal > 0 ? ((globalTotal - globalSubtotal) / globalSubtotal) * 100 : 0;

                                setFiles(prev => prev.map(f => f.localId === selectedFile.localId ? { 
                                  ...f, 
                                  extractedData: { ...f.extractedData, items: newItems, subtotal: globalSubtotal, total: globalTotal, tax: Math.round(globalTax) } 
                                } : f));
                              }}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mb-0.5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {(!selectedFile.extractedData?.items || selectedFile.extractedData?.items.length === 0) && (
                        <div className="text-center py-6 text-sm text-gray-400 font-medium border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                          Henüz fatura kalemi eklenmedi.
                        </div>
                      )}
                    </div>

                    <div className="pt-5 border-t border-v3-border dark:border-v3-border-dark flex items-end justify-between">
                      <div className="w-1/3">
                        <label className="text-[10px] font-bold text-v3-text-muted uppercase tracking-wider mb-1 block">Para Birimi</label>
                        <select 
                          value={selectedFile.extractedData?.currency || "TRY"}
                          onChange={(e) => setFiles(prev => prev.map(f => f.localId === selectedFile.localId ? { ...f, extractedData: { ...f.extractedData, currency: e.target.value } } : f))}
                          className="w-full bg-white dark:bg-gray-800 border border-v3-border dark:border-v3-border-dark rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-blue-500 shadow-sm"
                        >
                          <option value="TRY">TRY</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                      
                      <div className="text-right">
                        <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">Genel Toplam</label>
                        <div className="text-3xl font-black text-blue-700 dark:text-blue-300 tracking-tight">
                          {Number(selectedFile.extractedData?.total || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-lg font-bold text-blue-600/60 ml-2">{selectedFile.extractedData?.currency || "TRY"}</span>
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
                          Toplam Matrah: {Number(selectedFile.extractedData?.subtotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6 mt-auto pb-6">
                    <button 
                      onClick={() => handleApprove(selectedFile)}
                      disabled={selectedFile.status === "approved" || selectedFile.status === "pending" || selectedFile.status === "analyzing"}
                      className={`w-full py-4 rounded-xl text-base font-bold shadow-xl transition-all flex items-center justify-center gap-2 ${
                        selectedFile.status === "approved" 
                          ? "bg-green-600 text-white shadow-green-500/20 cursor-not-allowed" 
                          : selectedFile.status === "review"
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 hover:-translate-y-1"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <CheckCircle className="w-6 h-6" /> 
                      {selectedFile.status === "approved" ? "Sisteme Kaydedildi" : 
                       selectedFile.status === "review" ? "Bilgileri Doğrula ve Sisteme Kaydet" : 
                       "Yapay Zeka Okuması Bekleniyor..."}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-v3-text-muted p-6">
              <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-blue-300" />
              </div>
              <h3 className="text-xl font-medium text-v3-text">Görüntülenecek Belge Yok</h3>
              <p className="text-sm mt-2 max-w-sm text-center">Detayları görmek ve bilgileri düzenlemek için üst kısımdaki listeden bir fatura seçin veya yeni bir fatura yükleyin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
