"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { projectsService } from "@/lib/supabaseService";

interface TabDef {
  key: string;
  label: string;
}

const TABS: TabDef[] = [
  { key: "satis", label: "Satış" },
  { key: "alis", label: "Alış" },
  { key: "konaklama", label: "Konaklama" },
  { key: "otel-ekstra", label: "Otel Ekstra" },
  { key: "ucak-bileti", label: "Uçak Bileti" },
  { key: "transfer-tur", label: "Transfer & Tur" },
  { key: "etkinlik-aktivite", label: "Etkinlik & Aktivite" },
  { key: "insan-kaynaklari", label: "İnsan Kaynakları" },
  { key: "diger-servisler", label: "Diğer Servisler" },
  { key: "finansal", label: "Finansal" },
  { key: "tahsilat", label: "Tahsilat" },
  { key: "odeme", label: "Ödeme" },
  { key: "kar-zarar", label: "Kar/Zarar" },
];

// Sabit başlık listesi - Excel'den başlık okumuyoruz
const FIXED_HEADERS = [
  "ODA #",
  "ODA TİPİ",
  "YATAK TİPİ",
  "İSİM",
  "SOYİSİM",
  "ODA NO",
  "ODA NOTU",
  "GİRİŞ TARİHİ",
  "GELİŞ UÇUŞ KODU",
  "GELİŞ UÇAK KALKIŞ",
  "GELİŞ UÇAK İNİŞ",
  "ÇIKIŞ TARİHİ",
  "DÖNÜŞ UÇUŞ KODU",
  "DÖNÜŞ UÇAK KALKIŞ",
  "DÖNÜŞ UÇAK İNİŞ",
  "1. TARİH",
  "2. TARİH",
  "3. TARİH",
  "4. TARİH",
  "5. TARİH",
  "6. TARİH",
  "7. TARİH",
  "GECELEME",
  "PAKET",
  "OTEL",
  "UÇAK",
  "TOPLAM",
  "DÖVİZ",
];

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = useMemo(() => String(params?.id || ""), [params]);
  const [activeTab, setActiveTab] = useState<string>("satis");
  const [loading, setLoading] = useState<boolean>(true);
  const [project, setProject] = useState<any>(null);
  const [itemsSales, setItemsSales] = useState<any[]>([]); // satış kalemleri
  const [itemsPurchase, setItemsPurchase] = useState<any[]>([]); // alış kalemleri
  const [accommodationItems, setAccommodationItems] = useState<any[]>([]); // konaklama kalemleri
  const [newItem, setNewItem] = useState<any>({
    main_category: "",
    sub_category: "",
    description: "",
    qty: 1,
    repeat: 1,
    unit_price: 0,
    currency: "EUR",
    vat: 0,
    fx: 1,
    supplier: "",
  });
  const [showAddRowSales, setShowAddRowSales] = useState<boolean>(false);
  const [showAddRowPurchase, setShowAddRowPurchase] = useState<boolean>(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [projectUsersMap, setProjectUsersMap] = useState<
    Record<string, string[]>
  >({});
  const [users, setUsers] = useState<any[]>([]);

  // Tedarikçi + Otel birleşik liste (id'ler prefix ile ayrıştırılır: sup:, hotel:)
  const vendors = useMemo(() => {
    const supplierOptions = (suppliers || []).map((s: any) => ({
      id: `sup:${s.id}`,
      name: s.name,
      subtitle: s.title || "",
      type: "supplier",
    }));
    const hotelOptions = (hotels || []).map((h: any) => ({
      id: `hotel:${h.id}`,
      name: h.name,
      subtitle: h.city || h.district || "",
      type: "hotel",
    }));
    return [...supplierOptions, ...hotelOptions];
  }, [suppliers, hotels]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await projectsService.getById(projectId);
        setProject(data);
        // kalemleri yükle
        const s = localStorage.getItem(`project_items_sales_${projectId}`);
        const p = localStorage.getItem(`project_items_purchase_${projectId}`);
        setItemsSales(s ? JSON.parse(s) : []);
        setItemsPurchase(p ? JSON.parse(p) : []);
        // konaklama verilerini yükle
        const a = localStorage.getItem(`project_accommodation_${projectId}`);
        const accommodationData = a ? JSON.parse(a) : [];

        setAccommodationItems(accommodationData);
        // kategoriler
        try {
          const storedCategories = localStorage.getItem("categories");
          if (storedCategories) setCategories(JSON.parse(storedCategories));
        } catch {}
        // tedarikçiler
        try {
          const storedSuppliers = localStorage.getItem("suppliers");
          if (storedSuppliers) setSuppliers(JSON.parse(storedSuppliers));
        } catch {}
        // acenteler
        try {
          const storedAgencies = localStorage.getItem("agencies");
          if (storedAgencies) setAgencies(JSON.parse(storedAgencies));
        } catch {}
        // oteller
        try {
          const storedHotels = localStorage.getItem("hotels");
          if (storedHotels) setHotels(JSON.parse(storedHotels));
        } catch {}
        // proje kullanıcıları
        try {
          const storedProjUsers = localStorage.getItem("project_users");
          if (storedProjUsers) setProjectUsersMap(JSON.parse(storedProjUsers));
        } catch {}
        // kullanıcılar
        try {
          const storedUsers = localStorage.getItem("users");
          if (storedUsers) setUsers(JSON.parse(storedUsers));
        } catch {}
      } catch (e) {
        console.error("Proje yüklenemedi:", e);
      } finally {
        setLoading(false);
      }
    };
    if (projectId) load();
  }, [projectId]);

  // İlk açılışta satış boşsa, bağsız kopya olarak teklif kalemlerini içe aktar
  useEffect(() => {
    if (!project || !project.quote_id) return;
    if (itemsSales && itemsSales.length > 0) return;
    importQuoteItemsToSales(false); // sadece boşken
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, itemsSales]);

  // İlk açılışta alış boşsa, bağsız kopya olarak teklif kalemlerini içe aktar
  useEffect(() => {
    if (!project || !project.quote_id) return;
    if (itemsPurchase && itemsPurchase.length > 0) return;
    importQuoteItemsToPurchase(false); // sadece boşken
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, itemsPurchase]);

  const saveItems = (side: "sales" | "purchase", items: any[]) => {
    if (side === "sales") {
      setItemsSales(items);
      localStorage.setItem(
        `project_items_sales_${projectId}`,
        JSON.stringify(items),
      );
    } else {
      setItemsPurchase(items);
      localStorage.setItem(
        `project_items_purchase_${projectId}`,
        JSON.stringify(items),
      );
    }
  };

  const addItem = (side: "sales" | "purchase") => {
    if (
      newItem.qty <= 0 ||
      newItem.unit_price < 0 ||
      !newItem.main_category ||
      !newItem.sub_category
    )
      return;
    const total =
      (Number(newItem.qty) || 0) *
      (Number(newItem.repeat) || 1) *
      (Number(newItem.unit_price) || 0);
    const item = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      main_category: newItem.main_category || "",
      sub_category: newItem.sub_category || "",
      description: newItem.description || "-",
      qty: Number(newItem.qty) || 1,
      repeat: Number(newItem.repeat) || 1,
      unit_price: Number(newItem.unit_price) || 0,
      currency: newItem.currency || "EUR",
      vat: Number(newItem.vat) || 0,
      fx: Number(newItem.fx) || 1,
      supplier: newItem.supplier || "",
      total,
      total_try: total * (Number(newItem.fx) || 1),
    };

    const currentItems = side === "sales" ? itemsSales : itemsPurchase;
    const newMainCategoryName = getCategoryName(newItem.main_category);
    let insertIndex = currentItems.length; // Varsayılan olarak en sona

    // Kategorilerin /categories sayfasındaki sıralamasına göre ekle
    const mainCategories = categories.filter((c) => !c.parent_id);
    const newCategoryExists = currentItems.some(
      (item) => item.main_category === newItem.main_category,
    );

    if (newCategoryExists) {
      // Aynı kategorideki son öğenin altına ekle
      for (let i = currentItems.length - 1; i >= 0; i--) {
        if (currentItems[i].main_category === newItem.main_category) {
          insertIndex = i + 1;
          break;
        }
      }
    } else {
      // Yeni kategori - /categories sayfasındaki sıralamaya göre doğru yere ekle
      const newCategoryIndex = mainCategories.findIndex(
        (cat) => cat.id === newItem.main_category,
      );
      if (newCategoryIndex >= 0) {
        // Bu kategoriden sonra gelen ilk kategoriyi bul
        for (let i = newCategoryIndex + 1; i < mainCategories.length; i++) {
          const nextCategoryId = mainCategories[i].id;
          const nextCategoryIndex = currentItems.findIndex(
            (item) => item.main_category === nextCategoryId,
          );
          if (nextCategoryIndex >= 0) {
            insertIndex = nextCategoryIndex;
            break;
          }
        }
      }
    }

    const next = [...currentItems];
    next.splice(insertIndex, 0, item);
    saveItems(side, next);
    setNewItem({
      main_category: "",
      sub_category: "",
      description: "",
      qty: 1,
      repeat: 1,
      unit_price: 0,
      currency: "EUR",
      vat: 0,
      fx: 1,
      supplier: "",
    });
  };

  const removeItem = (side: "sales" | "purchase", id: string) => {
    const list = side === "sales" ? itemsSales : itemsPurchase;
    saveItems(
      side,
      list.filter((i) => i.id !== id),
    );
  };

  const totalsByCurrency = (items: any[]) => {
    const map: Record<string, number> = {};
    for (const it of items) {
      map[it.currency] = (map[it.currency] || 0) + (it.total || 0);
    }
    return map;
  };

  const getCategoryName = (id?: string) => {
    if (!id) return "";
    const c = categories.find((x: any) => x.id === id);
    return c?.name || id;
  };

  const getSupplierName = (id?: string) => {
    if (!id) return "";
    const s = suppliers.find((x: any) => x.id === id);
    return s?.name || id;
  };

  // Birleşik isim çözücü: önce prefix'e bakar, yoksa geriye dönük uyum için tedarikçi varsayar
  const getVendorName = (id?: string) => {
    if (!id) return "";
    if (id.startsWith("sup:")) {
      const realId = id.slice(4);
      const s = suppliers.find((x: any) => x.id === realId);
      return s?.name || realId;
    }
    if (id.startsWith("hotel:")) {
      const realId = id.slice(6);
      const h = hotels.find((x: any) => x.id === realId);
      return h?.name || realId;
    }
    // Eski kayıtlar için: doğrudan tedarikçi id'si gelebilir
    const s = suppliers.find((x: any) => x.id === id);
    if (s) return s.name;
    // Son çare: otellerde ara
    const h = hotels.find((x: any) => x.id === id);
    return h?.name || id;
  };

  const getAgencyName = (id?: string) => {
    if (!id) return "";
    const a = agencies.find((x: any) => x.id === id);
    return a?.name || id;
  };

  const getHotelName = (id?: string) => {
    if (!id) return "";
    const h = hotels.find((x: any) => x.id === id);
    return h?.name || id;
  };

  const getProjectManagers = useMemo(() => {
    return (projectId?: string) => {
      if (!projectId) return "-";
      const managers = projectUsersMap[projectId];
      if (!managers || managers.length === 0) return "-";

      // Kullanıcı kodlarını isimlere çevir
      const managerNames = managers.map((managerId) => {
        const user = users.find((u) => u.id === managerId);
        return user ? `${user.first_name} ${user.last_name}` : managerId; // İsim bulunamazsa kodu göster
      });

      return managerNames.join(", ");
    };
  }, [projectUsersMap, users]);

  const importQuoteItemsToSales = (forceReplace: boolean) => {
    try {
      if (!project?.quote_id) return;
      const raw = localStorage.getItem("quotes");
      if (!raw) return;
      const list = JSON.parse(raw) as any[];
      const q = list.find((qq) => qq.id === project.quote_id);
      if (!q || !Array.isArray(q.items) || q.items.length === 0) return;
      const mapped = q.items.map((it: any) => {
        const qtyOnly = Number(it.unit_quantity || 0);
        const repeatOnly = Number(it.sefer || 1);
        const unitPrice = Number(it.unit_price || 0);
        const currency = it.currency || "EUR";
        const vat = 0;
        const desc =
          it.description ||
          it.detail_description ||
          it.sub_category ||
          it.main_category ||
          "-";
        return {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          main_category: it.main_category || "",
          sub_category: it.sub_category || "",
          description: desc,
          qty: qtyOnly || 1,
          repeat: repeatOnly || 1,
          unit_price: unitPrice,
          currency,
          vat,
          fx: 1,
          supplier: "",
          total: (qtyOnly || 1) * (repeatOnly || 1) * unitPrice,
          total_try: (qtyOnly || 1) * (repeatOnly || 1) * unitPrice * 1,
        };
      });
      if (itemsSales.length > 0 && !forceReplace) return; // mevcut veriyi bozma
      saveItems("sales", mapped);
    } catch (e) {
      console.error("Teklif içeriği aktarım hatası:", e);
    }
  };

  const importQuoteItemsToPurchase = (forceReplace: boolean) => {
    try {
      if (!project?.quote_id) return;
      const raw = localStorage.getItem("quotes");
      if (!raw) return;
      const list = JSON.parse(raw) as any[];
      const q = list.find((qq) => qq.id === project.quote_id);
      if (!q || !Array.isArray(q.items) || q.items.length === 0) return;
      const mapped = q.items.map((it: any) => {
        const qtyOnly = Number(it.unit_quantity || 0);
        const repeatOnly = Number(it.sefer || 1);
        const currency = it.currency || "EUR";
        const vat = 0;
        const desc =
          it.description ||
          it.detail_description ||
          it.sub_category ||
          it.main_category ||
          "-";
        return {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          main_category: it.main_category || "",
          sub_category: it.sub_category || "",
          description: desc,
          qty: qtyOnly || 1,
          repeat: repeatOnly || 1,
          unit_price: 0, // Alış fiyatı boş olarak başlar
          currency,
          vat,
          fx: 1,
          supplier: "",
          total: 0, // Toplam da 0 olarak başlar
          total_try: 0, // Toplam TRY da 0 olarak başlar
        };
      });
      if (itemsPurchase.length > 0 && !forceReplace) return; // mevcut veriyi bozma
      saveItems("purchase", mapped);
    } catch (e) {
      console.error("Teklif içeriği alış aktarım hatası:", e);
    }
  };

  const formatTRY = (n: number) =>
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n || 0));

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const addBelow = (side: "sales" | "purchase", itemId: string) => {
    const list = side === "sales" ? itemsSales : itemsPurchase;
    const originalItem = list.find((item) => item.id === itemId);

    if (!originalItem) return;

    // Sadece ana kategoriyi koru, diğer alanları boş bırak
    const copiedItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      main_category: originalItem.main_category,
      sub_category: "",
      description: "",
      qty: 1,
      repeat: 1,
      unit_price: 0,
      currency: originalItem.currency,
      vat: 0,
      fx: 1,
      supplier: "",
      total: 0,
      total_try: 0,
      isEditing: true, // Kopyalanan satır düzenleme modunda açılsın
    };

    // Ana kategorinin doğru yerine ekle (addItem fonksiyonundaki mantığı kullan)
    const mainCategoryName = getCategoryName(originalItem.main_category);
    let insertIndex = list.length; // Varsayılan olarak en sona

    // Ana kategorinin son öğesini bul
    for (let i = list.length - 1; i >= 0; i--) {
      const itemMainCategory = getCategoryName(list[i].main_category);
      if (itemMainCategory === mainCategoryName) {
        insertIndex = i + 1;
        break;
      }
    }

    const newList = [...list];
    newList.splice(insertIndex, 0, copiedItem);
    saveItems(side, newList);
  };

  const editRow = (side: "sales" | "purchase", id: string) => {
    const list = side === "sales" ? itemsSales : itemsPurchase;
    const updatedList = list.map((item: any) =>
      item.id === id ? { ...item, isEditing: true } : item,
    );
    saveItems(side, updatedList);
  };

  // Konaklama Excel Import
  const handleAccommodationImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        alert("Excel dosyasında çalışma sayfası bulunamadı");
        return;
      }

      // Mevcut verileri temizle
      setAccommodationItems([]);
      localStorage.removeItem(`project_accommodation_${projectId}`);

      const newItems: any[] = [];

      // Sabit başlık listesi - Excel'den başlık okumuyoruz
      console.log("Sabit başlık listesi kullanılıyor:", FIXED_HEADERS);

      // Veri satırlarını oku (3. satırdan başla - 2 başlık satırını atla)
      for (let rowNumber = 3; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        // Satırın tamamen boş olup olmadığını kontrol et
        let hasData = false;
        for (let col = 1; col <= 28; col++) {
          const cellValue = getCellValue(row.getCell(col));
          if (cellValue && cellValue.trim() !== "") {
            hasData = true;
            break;
          }
        }

        if (!hasData) continue;

        // Forecast bölümünü algıla - eğer sadece oda tipi var ve isim-soyisim yoksa forecast bölümü
        const firstCellValue = getCellValue(row.getCell(1));
        const secondCellValue = getCellValue(row.getCell(2)); // ODA TİPİ
        const fourthCellValue = getCellValue(row.getCell(4)); // İSİM
        const fifthCellValue = getCellValue(row.getCell(5)); // SOYİSİM

        // Eğer ilk sütun oda tipi ise ve isim-soyisim sütunları boşsa forecast bölümü
        if (
          firstCellValue &&
          (firstCellValue.toString().toUpperCase().includes("FORECAST") ||
            firstCellValue.toString().toUpperCase().includes("ÖZET") ||
            firstCellValue.toString().toUpperCase().includes("TOPLAM") ||
            firstCellValue.toString().toUpperCase().includes("SUMMARY") ||
            firstCellValue.toString().toUpperCase().includes("TOTAL") ||
            // Oda tipi var ama isim-soyisim yoksa forecast bölümü
            ([
              "SNG",
              "DBL",
              "TRP",
              "TRPL",
              "DBL + INF",
              "DBL + CHD",
              "DBL + FREE CHD",
            ].includes(firstCellValue.toString().toUpperCase()) &&
              (!fourthCellValue || fourthCellValue === "") &&
              (!fifthCellValue || fifthCellValue === "")))
        ) {
          break; // Forecast bölümüne geldik, döngüyü durdur
        }

        const rowData: any = {
          id: Date.now() + Math.random(),
          oda_no: getCellValue(row.getCell(1)),
          oda_tipi: getCellValue(row.getCell(2)),
          yatak_tipi: getCellValue(row.getCell(3)),
          isim: getCellValue(row.getCell(4)),
          soyisim: getCellValue(row.getCell(5)),
          oda_kategori: getCellValue(row.getCell(6)),
          oda_notu: getCellValue(row.getCell(7)),
          gelis_tarihi: formatDateAccommodation(getCellValue(row.getCell(8))),
          gelis_kodu: getCellValue(row.getCell(9)),
          gelis_saat: formatTimeAccommodation(getCellValue(row.getCell(10))),
          gelis_ucak_inis: formatTimeAccommodation(
            getCellValue(row.getCell(11)),
          ),
          cikis_tarihi: formatDateAccommodation(getCellValue(row.getCell(12))),
          donus_kodu: getCellValue(row.getCell(13)),
          donus_ucak_kalkis: formatTimeAccommodation(
            getCellValue(row.getCell(14)),
          ),
          donus_ucak_inis: formatTimeAccommodation(
            getCellValue(row.getCell(15)),
          ),
          tarih_1: formatDateAccommodation(getCellValue(row.getCell(16))),
          tarih_2: formatDateAccommodation(getCellValue(row.getCell(17))),
          tarih_3: formatDateAccommodation(getCellValue(row.getCell(18))),
          tarih_4: formatDateAccommodation(getCellValue(row.getCell(19))),
          tarih_5: formatDateAccommodation(getCellValue(row.getCell(20))),
          tarih_6: formatDateAccommodation(getCellValue(row.getCell(21))),
          tarih_7: formatDateAccommodation(getCellValue(row.getCell(22))),
          geceli: getCellValue(row.getCell(23)),
          paket: getCellValue(row.getCell(24)),
          otel: getCellValue(row.getCell(25)),
          ucak: getCellValue(row.getCell(26)),
          toplam: getCellValue(row.getCell(27)),
          doviz: getCellValue(row.getCell(28)),
        };

        newItems.push(rowData);
      }

      console.log(`Toplam ${newItems.length} öğe import edildi`);
      setAccommodationItems(newItems);
      localStorage.setItem(
        `project_accommodation_${projectId}`,
        JSON.stringify(newItems),
      );

      alert(`${newItems.length} konaklama kaydı başarıyla import edildi`);
    } catch (error) {
      console.error("Import hatası:", error);
      alert("Excel dosyası import edilirken hata oluştu: " + error.message);
    }
  };

  // Excel hücre değerini güvenli şekilde al (formül sonuçlarını dahil)
  const getCellValue = (cell: any) => {
    if (!cell) return "";

    // Formül varsa, hesaplanmış sonucu al
    if (cell.formula) {
      return cell.result?.toString() || "";
    }

    // Değer varsa (null ve undefined dahil)
    if (cell.value !== undefined) {
      // null ise boş string döndür
      if (cell.value === null) {
        return "";
      }

      // Date objesi ise - string'e çevir
      if (cell.value instanceof Date) {
        return cell.value.toString();
      }

      // Rich text ise
      if (cell.value.richText && Array.isArray(cell.value.richText)) {
        return cell.value.richText.map((rt: any) => rt.text).join("");
      }

      // Normal değer - her zaman string'e çevir
      return cell.value.toString();
    }

    // Hücre yoksa boş string döndür
    return "";
  };

  // Tarih formatını DD.MM.YYYY'ye çevir
  const formatDateAccommodation = (dateValue: any) => {
    if (!dateValue) return "";

    // String olarak geliyorsa
    if (typeof dateValue === "string") {
      // Eğer zaten DD.MM.YYYY formatındaysa
      if (dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        return dateValue;
      }

      // Eğer uzun tarih formatındaysa (Sun Dec 11 2022 02:00:00 GMT+0200)
      if (dateValue.includes("GMT")) {
        try {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            const day = date.getDate().toString().padStart(2, "0");
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
          }
        } catch (e) {
          console.log("Tarih parse hatası:", dateValue);
        }
      }

      // Eğer "11 Aralık" formatındaysa
      if (dateValue.includes(" ")) {
        const monthMap: any = {
          Ocak: "01",
          Şubat: "02",
          Mart: "03",
          Nisan: "04",
          Mayıs: "05",
          Haziran: "06",
          Temmuz: "07",
          Ağustos: "08",
          Eylül: "09",
          Ekim: "10",
          Kasım: "11",
          Aralık: "12",
        };
        const parts = dateValue.split(" ");
        if (parts.length === 2) {
          const day = parts[0].padStart(2, "0");
          const month = monthMap[parts[1]] || "12";
          return `${day}.${month}.2024`;
        }
      }

      return dateValue;
    }

    // Date objesi ise
    if (dateValue instanceof Date) {
      const day = dateValue.getDate().toString().padStart(2, "0");
      const month = (dateValue.getMonth() + 1).toString().padStart(2, "0");
      const year = dateValue.getFullYear();
      return `${day}.${month}.${year}`;
    }

    return String(dateValue);
  };

  // Saat formatını HH:MM'ye çevir
  const formatTimeAccommodation = (timeValue: any) => {
    if (!timeValue) return "";

    // String olarak geliyorsa
    if (typeof timeValue === "string") {
      // Eğer zaten HH:MM formatındaysa
      if (timeValue.match(/^\d{2}:\d{2}$/)) {
        return timeValue;
      }

      // Eğer uzun saat formatındaysa (Sat Dec 30 1899 09:40:48 GMT+0215)
      if (timeValue.includes("GMT")) {
        try {
          const date = new Date(timeValue);
          if (!isNaN(date.getTime())) {
            const hours = date.getHours().toString().padStart(2, "0");
            const minutes = date.getMinutes().toString().padStart(2, "0");
            return `${hours}:${minutes}`;
          }
        } catch (e) {
          console.log("Saat parse hatası:", timeValue);
        }
      }

      // Eğer "10:45" gibi bir format varsa
      if (timeValue.includes(":")) {
        return timeValue;
      }

      return timeValue;
    }

    // Date objesi ise
    if (timeValue instanceof Date) {
      const hours = timeValue.getHours().toString().padStart(2, "0");
      const minutes = timeValue.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    }

    return String(timeValue);
  };

  // Konaklama Excel Export
  const handleAccommodationExport = async () => {
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Konaklama Listesi");

      // Sabit başlıkları ekle
      worksheet.addRow(FIXED_HEADERS);

      // Veri satırlarını ekle
      accommodationItems.forEach((item) => {
        worksheet.addRow([
          item.oda_no || "",
          item.oda_tipi || "",
          item.yatak_tipi || "",
          item.isim || "",
          item.soyisim || "",
          item.oda_kategori || "",
          item.oda_notu || "",
          item.gelis_tarihi || "",
          item.gelis_kodu || "",
          item.gelis_saat || "",
          item.gelis_ucak_inis || "",
          item.cikis_tarihi || "",
          item.donus_kodu || "",
          item.donus_ucak_kalkis || "",
          item.donus_ucak_inis || "",
          item.tarih_1 || "",
          item.tarih_2 || "",
          item.tarih_3 || "",
          item.tarih_4 || "",
          item.tarih_5 || "",
          item.tarih_6 || "",
          item.tarih_7 || "",
          item.geceli || "",
          item.paket || "",
          item.otel || "",
          item.ucak || "",
          item.toplam || "",
          item.doviz || "",
        ]);
      });

      // Excel dosyasını indir
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `konaklama_listesi_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export hatası:", error);
      alert("Excel dosyası oluşturulurken hata oluştu: " + error.message);
    }
  };

  // Konaklama listesini temizle
  const handleAccommodationClear = () => {
    if (accommodationItems.length === 0) {
      alert("Temizlenecek konaklama verisi yok.");
      return;
    }

    const confirmMessage = `Konaklama listesindeki ${accommodationItems.length} kaydı silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz!`;

    if (confirm(confirmMessage)) {
      // Verileri temizle
      setAccommodationItems([]);
      localStorage.removeItem(`project_accommodation_${projectId}`);

      alert("Konaklama listesi başarıyla temizlendi!");
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-3 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-lg font-bold text-v3-text transition-colors duration-200">
            Proje Detayı
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            {project?.status || "active"}
          </span>
        </div>
      </div>

      {/* Stats (özet) */}
      <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-1 mb-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-1.5 transition-colors duration-200">
          <p className="text-[10px] text-v3-muted">
            Referans
          </p>
          <p className="text-xs font-semibold text-v3-text">
            {project?.reference || projectId}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-1.5 transition-colors duration-200">
          <p className="text-[10px] text-v3-muted">
            Başlangıç
          </p>
          <p className="text-xs font-semibold text-v3-text">
            {formatDate(project?.start_date || "")}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-1.5 transition-colors duration-200">
          <p className="text-[10px] text-v3-muted">Bitiş</p>
          <p className="text-xs font-semibold text-v3-text">
            {formatDate(project?.end_date || "")}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-1.5 transition-colors duration-200">
          <p className="text-[10px] text-v3-muted">
            Firma Adı
          </p>
          <p className="text-xs font-semibold text-v3-text">
            {project?.company_name || project?.company?.name || "-"}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-1.5 transition-colors duration-200">
          <p className="text-[10px] text-v3-muted">
            Acente Adı
          </p>
          <p className="text-xs font-semibold text-v3-text">
            {getAgencyName(project?.agency_id) || "-"}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-1.5 transition-colors duration-200">
          <p className="text-[10px] text-v3-muted">
            Otel Adı
          </p>
          <p className="text-xs font-semibold text-v3-text">
            {getHotelName(project?.hotel_id) || "-"}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-1.5 transition-colors duration-200">
          <p className="text-[10px] text-v3-muted">
            Oda | Pax
          </p>
          <p className="text-xs font-semibold text-v3-text">
            {project?.room_pax || project?.room_info || "-"}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-1.5 transition-colors duration-200">
          <p className="text-[10px] text-v3-muted">
            Teklif Türü
          </p>
          <p className="text-xs font-semibold text-v3-text">
            {project?.quote_type || "-"}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-1.5 transition-colors duration-200">
          <p className="text-[10px] text-v3-muted">
            Proje Sorumlusu
          </p>
          <p className="text-xs font-semibold text-v3-text">
            {getProjectManagers(projectId)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200">
        <div className="border-b border-gray-200 dark:border-v3-border px-2 pt-2">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1 rounded-t-lg text-xs font-medium transition-colors ${
                  activeTab === t.key
                    ? "bg-blue-500 text-white dark:bg-blue-500"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3">
          {loading ? (
            <div className="text-xs text-v3-muted">
              Yükleniyor...
            </div>
          ) : (
            <>
              {activeTab === "satis" && (
                <div className="space-y-3">
                  <SectionHeader title="Satış" />
                  {/* Başlık satırı */}
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 hidden md:flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                    <div className="w-36">ANA KATEGORİ</div>
                    <div className="w-40">ALT KATEGORİ</div>
                    <div className="w-16 flex flex-col justify-center items-end pr-1">
                      <div>BİRİM</div>
                      <div>ADET</div>
                    </div>
                    <div className="w-20 flex flex-col justify-center items-end pr-1">
                      <div>SEFER</div>
                      <div>TEKRAR</div>
                    </div>
                    <div className="w-24 text-right pr-1">BİRİM FİYAT</div>
                    <div className="w-32 text-right pr-1">TOPLAM FİYAT</div>
                    <div className="w-16">DÖVİZ</div>
                    <div className="w-16">KDV</div>
                    <div className="w-16 text-right pr-1">KUR</div>
                    <div className="w-32 text-right pr-1">TOPLAM TL</div>
                    <div className="flex-1 min-w-0">AÇIKLAMA</div>
                    <div className="w-24 flex items-center justify-between">
                      <span>İŞLEMLER</span>
                      <button
                        onClick={() => setShowAddRowSales(true)}
                        className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
                        title="Yeni Ana/Alt Kategori Ekle"
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
                    </div>
                  </div>
                  <ServiceEditor
                    side="sales"
                    items={itemsSales}
                    onRemove={removeItem}
                    onAdd={() => addItem("sales")}
                    newItem={newItem}
                    setNewItem={setNewItem}
                    totals={totalsByCurrency(itemsSales)}
                    showSupplier={false}
                    categories={categories}
                    onAddBelow={addBelow}
                    onEditRow={editRow}
                    formatTRY={formatTRY}
                    getCategoryName={getCategoryName}
                    saveItems={saveItems}
                    showAddRow={showAddRowSales}
                    setShowAddRow={setShowAddRowSales}
                  />
                </div>
              )}

              {activeTab === "alis" && (
                <div className="space-y-3">
                  <SectionHeader title="Alış" />
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 hidden md:flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                    <div className="w-36">ANA KATEGORİ</div>
                    <div className="w-40">ALT KATEGORİ</div>
                    <div className="w-16 flex flex-col justify-center items-end pr-1">
                      <div>BİRİM</div>
                      <div>ADET</div>
                    </div>
                    <div className="w-20 flex flex-col justify-center items-end pr-1">
                      <div>SEFER</div>
                      <div>TEKRAR</div>
                    </div>
                    <div className="w-24 text-right pr-1">BİRİM FİYAT</div>
                    <div className="w-32 text-right pr-1">TOPLAM FİYAT</div>
                    <div className="w-16">DÖVİZ</div>
                    <div className="w-16">KDV</div>
                    <div className="w-16 text-right pr-1">KUR</div>
                    <div className="w-32 text-right pr-1">TOPLAM TL</div>
                    <div className="flex-1 min-w-0">AÇIKLAMA</div>
                    <div className="w-40">TEDARİKÇİ</div>
                    <div className="w-24 flex items-center justify-between">
                      <span>İŞLEMLER</span>
                      <button
                        onClick={() => setShowAddRowPurchase(true)}
                        className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
                        title="Yeni Ana/Alt Kategori Ekle"
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
                    </div>
                  </div>
                  <ServiceEditor
                    side="purchase"
                    items={itemsPurchase}
                    onRemove={removeItem}
                    onAdd={() => addItem("purchase")}
                    newItem={newItem}
                    setNewItem={setNewItem}
                    totals={totalsByCurrency(itemsPurchase)}
                    showSupplier
                    categories={categories}
                    onAddBelow={addBelow}
                    onEditRow={editRow}
                    formatTRY={formatTRY}
                    getCategoryName={getCategoryName}
                    getVendorName={getVendorName}
                    vendors={vendors}
                    saveItems={saveItems}
                    showAddRow={showAddRowPurchase}
                    setShowAddRow={setShowAddRowPurchase}
                  />
                </div>
              )}

              {activeTab === "kar-zarar" && (
                <div className="space-y-3">
                  <SectionHeader title="Kar/Zarar Analizi" />
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 hidden md:flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                    <div className="flex-1 min-w-0">ALT KATEGORİ</div>
                    <div className="w-32 text-right pr-1">SATIŞ DÖVİZ</div>
                    <div className="w-24 text-right pr-1">KUR</div>
                    <div className="w-32 text-right pr-1">SATIŞ TL</div>
                    <div className="w-32 text-right pr-1">ALIŞ DÖVİZ</div>
                    <div className="w-24 text-right pr-1">KUR</div>
                    <div className="w-32 text-right pr-1">ALIŞ TL</div>
                    <div className="w-32 text-right pr-1">KAR/ZARAR</div>
                    <div className="w-24 text-right pr-1">KAR MARJI</div>
                  </div>
                  <ProfitLossList
                    salesItems={itemsSales}
                    purchaseItems={itemsPurchase}
                    formatTRY={formatTRY}
                    getCategoryName={getCategoryName}
                  />
                </div>
              )}

              {activeTab === "konaklama" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-v3-text">
                      Konaklama
                    </h2>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleAccommodationImport}
                        className="hidden"
                        id="accommodation-import"
                      />
                      <label
                        htmlFor="accommodation-import"
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 cursor-pointer transition-colors"
                      >
                        Excel İçe Aktar
                      </label>
                      <button
                        onClick={handleAccommodationExport}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-500/90 transition-colors"
                      >
                        Excel Dışa Aktar
                      </button>
                      {accommodationItems.length > 0 && (
                        <button
                          onClick={handleAccommodationClear}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        >
                          Listeyi Temizle
                        </button>
                      )}
                    </div>
                  </div>

                  {accommodationItems.length > 0 ? (
                    <div className="space-y-4">
                      {/* Ana Konaklama Tablosu */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                              <tr>
                                {FIXED_HEADERS.map((header, index) => (
                                  <th
                                    key={index}
                                    className="px-2 py-1 text-left"
                                  >
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {accommodationItems.map((item, index) => (
                                <tr
                                  key={index}
                                  className="border-b border-gray-200 dark:border-v3-border hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  <td className="px-2 py-1">
                                    {item.oda_no || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {item.oda_tipi || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {item.yatak_tipi || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {item.isim || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {item.soyisim || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {item.oda_kategori || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {item.oda_notu || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {formatDateAccommodation(
                                      item.gelis_tarihi,
                                    ) || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {item.gelis_kodu || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {formatTimeAccommodation(item.gelis_saat) ||
                                      "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {formatTimeAccommodation(
                                      item.gelis_ucak_inis,
                                    ) || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {formatDateAccommodation(
                                      item.cikis_tarihi,
                                    ) || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {item.donus_kodu || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {formatTimeAccommodation(
                                      item.donus_ucak_kalkis,
                                    ) || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {formatTimeAccommodation(
                                      item.donus_ucak_inis,
                                    ) || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {formatDateAccommodation(item.tarih_1) ||
                                      "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {formatDateAccommodation(item.tarih_2) ||
                                      "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {formatDateAccommodation(item.tarih_3) ||
                                      "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {formatDateAccommodation(item.tarih_4) ||
                                      "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {formatDateAccommodation(item.tarih_5) ||
                                      "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {formatDateAccommodation(item.tarih_6) ||
                                      "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {formatDateAccommodation(item.tarih_7) ||
                                      "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {item.geceli || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {item.paket || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {item.otel || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {item.ucak || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {item.toplam || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    {item.doviz || "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Günlük Inhouse Kontrolü */}
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-v3-text mb-4">
                          Günlük Inhouse Kontrolü
                        </h3>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                  {(() => {
                                    // Listedeki tüm oda tiplerini al
                                    const allRoomTypes = [
                                      ...new Set(
                                        accommodationItems
                                          .map((item) => item.oda_tipi)
                                          .filter(Boolean),
                                      ),
                                    ].sort();

                                    return (
                                      <>
                                        <th className="px-3 py-2 text-left font-semibold">
                                          Tarih
                                        </th>
                                        {allRoomTypes.map((roomType) => (
                                          <th
                                            key={roomType}
                                            className="px-3 py-2 text-center font-semibold"
                                          >
                                            {roomType}
                                          </th>
                                        ))}
                                        <th className="px-3 py-2 text-center font-semibold">
                                          Toplam Oda
                                        </th>
                                        <th className="px-3 py-2 text-center font-semibold">
                                          Toplam Pax
                                        </th>
                                      </>
                                    );
                                  })()}
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  // Tarih bazında oda tiplerini say
                                  const dateStats: any = {};

                                  accommodationItems.forEach((item) => {
                                    // Giriş ve çıkış tarihlerini al
                                    const checkIn = formatDateAccommodation(
                                      item.gelis_tarihi,
                                    );
                                    const checkOut = formatDateAccommodation(
                                      item.cikis_tarihi,
                                    );
                                    const roomType =
                                      item.oda_tipi || "Belirsiz";
                                    const roomNo = item.oda_no || "";

                                    if (
                                      checkIn &&
                                      checkOut &&
                                      checkIn !== "-" &&
                                      checkOut !== "-"
                                    ) {
                                      try {
                                        // Tarih formatını düzelt (DD.MM.YYYY -> YYYY-MM-DD)
                                        const checkInParts = checkIn.split(".");
                                        const checkOutParts =
                                          checkOut.split(".");

                                        if (
                                          checkInParts.length === 3 &&
                                          checkOutParts.length === 3
                                        ) {
                                          const startDate = new Date(
                                            `${checkInParts[2]}-${checkInParts[1]}-${checkInParts[0]}`,
                                          );
                                          const endDate = new Date(
                                            `${checkOutParts[2]}-${checkOutParts[1]}-${checkOutParts[0]}`,
                                          );

                                          // Geçerli tarih kontrolü
                                          if (
                                            !isNaN(startDate.getTime()) &&
                                            !isNaN(endDate.getTime())
                                          ) {
                                            // Her gece için oda tipini say
                                            for (
                                              let d = new Date(startDate);
                                              d < endDate;
                                              d.setDate(d.getDate() + 1)
                                            ) {
                                              const dateKey = d
                                                .toISOString()
                                                .split("T")[0];
                                              const formattedDate = `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;

                                              if (!dateStats[dateKey]) {
                                                dateStats[dateKey] = {
                                                  date: formattedDate,
                                                  rooms: new Set(),
                                                  roomTypes: {},
                                                };
                                              }

                                              // Benzersiz oda kontrolü - aynı oda aynı tarihte birden fazla sayılmasın
                                              const roomKey = `${roomNo}-${roomType}`;
                                              if (
                                                !dateStats[dateKey].rooms.has(
                                                  roomKey,
                                                )
                                              ) {
                                                dateStats[dateKey].rooms.add(
                                                  roomKey,
                                                );

                                                if (
                                                  !dateStats[dateKey].roomTypes[
                                                    roomType
                                                  ]
                                                ) {
                                                  dateStats[dateKey].roomTypes[
                                                    roomType
                                                  ] = 0;
                                                }
                                                dateStats[dateKey].roomTypes[
                                                  roomType
                                                ]++;
                                              }
                                            }
                                          }
                                        }
                                      } catch (error) {
                                        console.log(
                                          "Tarih parse hatası:",
                                          checkIn,
                                          checkOut,
                                          error,
                                        );
                                      }
                                    }
                                  });

                                  // Tarihleri sırala
                                  const sortedDates =
                                    Object.keys(dateStats).sort();
                                  const allRoomTypes = [
                                    ...new Set(
                                      accommodationItems
                                        .map((item) => item.oda_tipi)
                                        .filter(Boolean),
                                    ),
                                  ].sort();

                                  return sortedDates.map((dateKey, index) => {
                                    const stats = dateStats[dateKey];
                                    const totalRooms = Object.values(
                                      stats.roomTypes,
                                    ).reduce(
                                      (sum: number, count: any) =>
                                        sum + (count || 0),
                                      0,
                                    );

                                    // Pax hesaplama - oda tipine göre kişi sayısı
                                    const paxCount = Object.entries(
                                      stats.roomTypes,
                                    ).reduce(
                                      (
                                        sum: number,
                                        [roomType, count]: [string, any],
                                      ) => {
                                        const roomTypeUpper =
                                          roomType.toUpperCase();
                                        let paxPerRoom = 1; // varsayılan

                                        if (roomTypeUpper === "SNG")
                                          paxPerRoom = 1;
                                        else if (roomTypeUpper === "DBL")
                                          paxPerRoom = 2;
                                        else if (
                                          roomTypeUpper === "TRP" ||
                                          roomTypeUpper === "TRPL"
                                        )
                                          paxPerRoom = 3;

                                        return sum + (count || 0) * paxPerRoom;
                                      },
                                      0,
                                    );

                                    // Benzersiz key oluştur - tarih + index kombinasyonu
                                    const uniqueKey = `date-${dateKey}-${index}`;

                                    return (
                                      <tr
                                        key={uniqueKey}
                                        className="border-b border-gray-200 dark:border-v3-border hover:bg-gray-50 dark:hover:bg-gray-700"
                                      >
                                        <td className="px-3 py-2 font-medium">
                                          {stats.date}
                                        </td>
                                        {allRoomTypes.map((roomType) => {
                                          const count =
                                            stats.roomTypes[roomType] || 0;
                                          const colors = [
                                            "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
                                            "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
                                            "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
                                            "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
                                            "bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200",
                                            "bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200",
                                            "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
                                          ];
                                          const colorClass =
                                            colors[
                                              allRoomTypes.indexOf(roomType) %
                                                colors.length
                                            ];

                                          return (
                                            <td
                                              key={roomType}
                                              className="px-3 py-2 text-center"
                                            >
                                              {count > 0 && (
                                                <span
                                                  className={`${colorClass} px-2 py-1 rounded-full text-xs font-medium`}
                                                >
                                                  {count}
                                                </span>
                                              )}
                                            </td>
                                          );
                                        })}
                                        <td className="px-3 py-2 text-center">
                                          <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs font-medium">
                                            {totalRooms as number}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs font-medium">
                                            {paxCount as number}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  });
                                })()}
                              </tbody>
                              <tfoot className="bg-gray-50 dark:bg-gray-600">
                                <tr className="font-semibold">
                                  <td className="px-3 py-2">GENEL TOPLAM</td>
                                  {(() => {
                                    const allRoomTypes = [
                                      ...new Set(
                                        accommodationItems
                                          .map((item) => item.oda_tipi)
                                          .filter(Boolean),
                                      ),
                                    ].sort();
                                    const grandTotals: any = {};
                                    let grandTotalRooms = 0;
                                    let grandTotalPax = 0;

                                    // Tüm tarihlerdeki toplamları hesapla
                                    accommodationItems.forEach((item) => {
                                      const checkIn = formatDateAccommodation(
                                        item.gelis_tarihi,
                                      );
                                      const checkOut = formatDateAccommodation(
                                        item.cikis_tarihi,
                                      );
                                      const roomType =
                                        item.oda_tipi || "Belirsiz";

                                      if (
                                        checkIn &&
                                        checkOut &&
                                        checkIn !== "-" &&
                                        checkOut !== "-"
                                      ) {
                                        try {
                                          // Tarih formatını düzelt (DD.MM.YYYY -> YYYY-MM-DD)
                                          const checkInParts =
                                            checkIn.split(".");
                                          const checkOutParts =
                                            checkOut.split(".");

                                          if (
                                            checkInParts.length === 3 &&
                                            checkOutParts.length === 3
                                          ) {
                                            const startDate = new Date(
                                              `${checkInParts[2]}-${checkInParts[1]}-${checkInParts[0]}`,
                                            );
                                            const endDate = new Date(
                                              `${checkOutParts[2]}-${checkOutParts[1]}-${checkOutParts[0]}`,
                                            );

                                            // Geçerli tarih kontrolü
                                            if (
                                              !isNaN(startDate.getTime()) &&
                                              !isNaN(endDate.getTime())
                                            ) {
                                              // Gece sayısını hesapla
                                              const nights = Math.ceil(
                                                (endDate.getTime() -
                                                  startDate.getTime()) /
                                                  (1000 * 60 * 60 * 24),
                                              );

                                              if (!grandTotals[roomType]) {
                                                grandTotals[roomType] = 0;
                                              }
                                              grandTotals[roomType] += nights;
                                              grandTotalRooms += nights;

                                              // Pax hesaplama
                                              const roomTypeUpper =
                                                roomType.toUpperCase();
                                              let paxPerRoom = 1;
                                              if (roomTypeUpper === "SNG")
                                                paxPerRoom = 1;
                                              else if (roomTypeUpper === "DBL")
                                                paxPerRoom = 2;
                                              else if (
                                                roomTypeUpper === "TRP" ||
                                                roomTypeUpper === "TRPL"
                                              )
                                                paxPerRoom = 3;

                                              grandTotalPax +=
                                                nights * paxPerRoom;
                                            }
                                          }
                                        } catch (error) {
                                          console.log(
                                            "Genel toplam tarih parse hatası:",
                                            checkIn,
                                            checkOut,
                                            error,
                                          );
                                        }
                                      }
                                    });

                                    return (
                                      <>
                                        {allRoomTypes.map((roomType) => (
                                          <td
                                            key={roomType}
                                            className="px-3 py-2 text-center"
                                          >
                                            <span className="bg-gray-200 dark:bg-gray-500 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs font-medium">
                                              {grandTotals[roomType] || 0}
                                            </span>
                                          </td>
                                        ))}
                                        <td className="px-3 py-2 text-center">
                                          <span className="bg-gray-200 dark:bg-gray-500 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs font-medium">
                                            {grandTotalRooms}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          <span className="bg-gray-200 dark:bg-gray-500 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs font-medium">
                                            {grandTotalPax}
                                          </span>
                                        </td>
                                      </>
                                    );
                                  })()}
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        {/* Özet Kartlar */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                          {(() => {
                            const totalStats = accommodationItems.reduce(
                              (acc: any, item) => {
                                const roomType = item.oda_tipi || "Belirsiz";
                                acc[roomType] = (acc[roomType] || 0) + 1;
                                return acc;
                              },
                              {},
                            );

                            const totalGuests = accommodationItems.length;
                            const uniqueRooms = new Set(
                              accommodationItems.map((item) => item.oda_no),
                            ).size;

                            return (
                              <>
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-v3-text shadow-lg">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-blue-100 text-sm">
                                        Toplam Misafir
                                      </p>
                                      <p className="text-2xl font-bold">
                                        {totalGuests}
                                      </p>
                                    </div>
                                    <div className="bg-white bg-opacity-20 rounded-full p-3">
                                      <svg
                                        className="w-6 h-6"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-v3-text shadow-lg">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-green-100 text-sm">
                                        Benzersiz Oda
                                      </p>
                                      <p className="text-2xl font-bold">
                                        {uniqueRooms}
                                      </p>
                                    </div>
                                    <div className="bg-white bg-opacity-20 rounded-full p-3">
                                      <svg
                                        className="w-6 h-6"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-v3-text shadow-lg">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-purple-100 text-sm">
                                        Oda Tipi Dağılımı
                                      </p>
                                      <p className="text-sm">
                                        SNG: {totalStats.SNG || 0} | DBL:{" "}
                                        {totalStats.DBL || 0} | TRP:{" "}
                                        {totalStats.TRP || 0}
                                      </p>
                                    </div>
                                    <div className="bg-white bg-opacity-20 rounded-full p-3">
                                      <svg
                                        className="w-6 h-6"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        Henüz konaklama verisi yok. Excel dosyasından içe
                        aktarabilirsiniz.
                      </p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === "otel-ekstra" && (
                <EmptySection title="Otel Ekstra" />
              )}
              {activeTab === "ucak-bileti" && (
                <EmptySection title="Uçak Bileti" />
              )}
              {activeTab === "transfer-tur" && (
                <EmptySection title="Transfer & Tur" />
              )}
              {activeTab === "etkinlik-aktivite" && (
                <EmptySection title="Etkinlik & Aktivite" />
              )}
              {activeTab === "insan-kaynaklari" && (
                <EmptySection title="İnsan Kaynakları" />
              )}
              {activeTab === "diger-servisler" && (
                <EmptySection title="Diğer Servisler" />
              )}
              {activeTab === "finansal" && <EmptySection title="Finansal" />}
              {activeTab === "tahsilat" && <EmptySection title="Tahsilat" />}
              {activeTab === "odeme" && <EmptySection title="Ödeme" />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-v3-text">
        {title}
      </h2>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-v3-muted">
          Satırlar tek satır, h-10
        </span>
      </div>
    </div>
  );
}

function ServiceEditor({
  side,
  items,
  onRemove,
  onAdd,
  newItem,
  setNewItem,
  totals,
  showSupplier,
  categories,
  onAddBelow,
  onEditRow,
  formatTRY,
  getCategoryName,
  getVendorName,
  vendors,
  saveItems,
  showAddRow,
  setShowAddRow,
}: any) {
  const handleRowKeyDown = (e: React.KeyboardEvent, rowItem: any) => {
    if (!rowItem?.isEditing) return;
    // Input odaklıyken de Enter/Esc çalışsın; diğer tuşları yok say
    const key = e.key;
    if (key !== "Enter" && key !== "Escape") return;
    if (e.key === "Enter") {
      e.preventDefault();
      const list = [...items];
      const index = list.findIndex((item: any) => item.id === rowItem.id);
      if (index >= 0) {
        list[index] = { ...list[index], isEditing: false };
        saveItems(side, list);
      }
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const list = [...items];
      const index = list.findIndex((item: any) => item.id === rowItem.id);
      if (index >= 0) {
        list[index] = { ...list[index], isEditing: false };
        saveItems(side, list);
      }
    }
  };

  return (
    <div className="space-y-2">
      {/* Üst ekleme satırı */}
      {showAddRow && (
        <div className="rounded-md p-2 flex flex-wrap md:flex-nowrap items-center gap-2 bg-blue-500/10 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <select
            value={newItem.main_category}
            onChange={(e) =>
              setNewItem({ ...newItem, main_category: e.target.value })
            }
            className="w-36 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-v3-text"
          >
            <option value="">Ana Kategori</option>
            {categories
              .filter((c: any) => !c.parent_id)
              .map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <select
            value={newItem.sub_category}
            onChange={(e) =>
              setNewItem({ ...newItem, sub_category: e.target.value })
            }
            className="w-40 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-v3-text"
          >
            <option value="">Alt Kategori</option>
            {categories
              .filter((c: any) => c.parent_id === newItem.main_category)
              .map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <div className="flex-1 min-w-0"></div>
          <div className="w-24 flex items-center gap-1 justify-end pr-1">
            <button
              onClick={() => {
                onAdd();
                setShowAddRow(false);
              }}
              className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
              title="Ekle"
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
            <button
              onClick={() => setShowAddRow(false)}
              className="p-1 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/30"
              title="İptal"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {items.length > 0 && (
        <div className="space-y-1">
          {(() => {
            // Ana kategorilere göre grupla
            const grouped = items.reduce((acc: any, item: any) => {
              const mainCat = getCategoryName(item.main_category) || "Diğer";
              if (!acc[mainCat]) {
                acc[mainCat] = [];
              }
              acc[mainCat].push(item);
              return acc;
            }, {});

            const result: any[] = [];

            Object.entries(grouped).forEach(
              ([mainCategory, categoryItems]: [string, any]) => {
                // Ana kategori başlığı
                result.push({
                  type: "header",
                  category: mainCategory,
                  items: categoryItems,
                });

                // Alt kategoriler
                categoryItems.forEach((item: any, idx: number) => {
                  result.push({
                    type: "item",
                    item,
                    idx,
                  });
                });

                // Ara toplam
                const categoryTotal = categoryItems.reduce(
                  (sum: number, item: any) => sum + (item.total || 0),
                  0,
                );
                const categoryTotalTRY = categoryItems.reduce(
                  (sum: number, item: any) => sum + (item.total_try || 0),
                  0,
                );
                result.push({
                  type: "subtotal",
                  category: mainCategory,
                  total: categoryTotal,
                  totalTRY: categoryTotalTRY,
                });
              },
            );

            return result;
          })().map((row: any, idx: number) => {
            if (row.type === "header") {
              // İlk ana kategori başlığı hariç, diğerlerine üst boşluk ekle
              const isFirstHeader = idx === 0;
              return (
                <div
                  key={`header-${row.category}`}
                  className={`bg-gray-200 dark:bg-gray-600 rounded-md p-2 ${!isFirstHeader ? "mt-4" : ""}`}
                >
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    {row.category}
                  </h3>
                </div>
              );
            }

            if (row.type === "subtotal") {
              return (
                <div
                  key={`subtotal-${row.category}`}
                  className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 flex flex-wrap md:flex-nowrap items-center gap-2"
                >
                  <div className="w-36 text-xs font-semibold text-gray-800 dark:text-gray-200">
                    ARA TOPLAM
                  </div>
                  <div className="w-40"></div>
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
                  {showSupplier && <div className="w-40"></div>}
                  <div className="w-24"></div>
                </div>
              );
            }

            // Normal item
            const it = row.item;
            return (
              <div
                key={it.id}
                className={`rounded-md p-2 flex flex-wrap md:flex-nowrap items-center gap-2 ${it.isEditing ? "bg-blue-500/10 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700" : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"}`}
                onKeyDown={(e) => handleRowKeyDown(e, it)}
                tabIndex={it.isEditing ? 0 : -1}
              >
                {it.isEditing ? (
                  // Düzenleme modu - input alanları
                  <>
                    <div className="w-36"></div>{" "}
                    {/* Ana kategori boş - başlıkta gösteriliyor */}
                    <select
                      value={it.sub_category}
                      onChange={(e) => {
                        const updated = { ...it, sub_category: e.target.value };
                        const list = [...items];
                        const index = list.findIndex(
                          (item: any) => item.id === it.id,
                        );
                        list[index] = updated;
                        saveItems(side, list);
                      }}
                      className="w-40 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-v3-text"
                    >
                      <option value="">Alt Kategori</option>
                      {categories
                        .filter((c: any) => c.parent_id === it.main_category)
                        .map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                    <input
                      value={it.qty}
                      onChange={(e) => {
                        const updated = {
                          ...it,
                          qty: Number(e.target.value),
                          total:
                            Number(e.target.value) * it.repeat * it.unit_price,
                          total_try:
                            Number(e.target.value) *
                            it.repeat *
                            it.unit_price *
                            it.fx,
                        };
                        const list = [...items];
                        const index = list.findIndex(
                          (item: any) => item.id === it.id,
                        );
                        list[index] = updated;
                        saveItems(side, list);
                      }}
                      type="number"
                      step="1"
                      className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-v3-text"
                      autoFocus
                    />
                    <input
                      value={it.repeat}
                      onChange={(e) => {
                        const updated = {
                          ...it,
                          repeat: Number(e.target.value),
                          total:
                            it.qty * Number(e.target.value) * it.unit_price,
                          total_try:
                            it.qty *
                            Number(e.target.value) *
                            it.unit_price *
                            it.fx,
                        };
                        const list = [...items];
                        const index = list.findIndex(
                          (item: any) => item.id === it.id,
                        );
                        list[index] = updated;
                        saveItems(side, list);
                      }}
                      type="number"
                      step="1"
                      className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-v3-text"
                    />
                    <input
                      value={it.unit_price}
                      onChange={(e) => {
                        const updated = {
                          ...it,
                          unit_price: Number(e.target.value),
                          total: it.qty * it.repeat * Number(e.target.value),
                          total_try:
                            it.qty * it.repeat * Number(e.target.value) * it.fx,
                        };
                        const list = [...items];
                        const index = list.findIndex(
                          (item: any) => item.id === it.id,
                        );
                        list[index] = updated;
                        saveItems(side, list);
                      }}
                      type="number"
                      step="0.01"
                      className="w-24 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-v3-text"
                    />
                    <div className="w-28 px-2 py-1 text-xs text-right text-gray-700 dark:text-gray-200">
                      {formatTRY(it.total)}
                    </div>
                    <select
                      value={it.currency}
                      onChange={(e) => {
                        const updated = { ...it, currency: e.target.value };
                        const list = [...items];
                        const index = list.findIndex(
                          (item: any) => item.id === it.id,
                        );
                        list[index] = updated;
                        saveItems(side, list);
                      }}
                      className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-v3-text"
                    >
                      <option>EUR</option>
                      <option>USD</option>
                      <option>TL</option>
                    </select>
                    <input
                      value={it.vat}
                      onChange={(e) => {
                        const updated = { ...it, vat: Number(e.target.value) };
                        const list = [...items];
                        const index = list.findIndex(
                          (item: any) => item.id === it.id,
                        );
                        list[index] = updated;
                        saveItems(side, list);
                      }}
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      placeholder="5"
                      className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-v3-text"
                    />
                    <input
                      value={it.fx}
                      onChange={(e) => {
                        const updated = {
                          ...it,
                          fx: Number(e.target.value),
                          total_try:
                            it.qty *
                            it.repeat *
                            it.unit_price *
                            Number(e.target.value),
                        };
                        const list = [...items];
                        const index = list.findIndex(
                          (item: any) => item.id === it.id,
                        );
                        list[index] = updated;
                        saveItems(side, list);
                      }}
                      type="number"
                      step="0.0001"
                      className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-v3-text"
                    />
                    <input
                      value={it.total_try}
                      onChange={(e) => {
                        const newTotalTRY = Number(e.target.value) || 0;
                        const qtyTimesRepeat =
                          (Number(it.qty) || 0) * (Number(it.repeat) || 0);
                        const fxVal = Number(it.fx) || 0;
                        let newUnitPrice = Number(it.unit_price) || 0;
                        if (fxVal > 0 && qtyTimesRepeat > 0) {
                          newUnitPrice = newTotalTRY / fxVal / qtyTimesRepeat;
                        }
                        const newTotal = qtyTimesRepeat * newUnitPrice;
                        const updated = {
                          ...it,
                          unit_price: newUnitPrice,
                          total: newTotal,
                          total_try: newTotalTRY,
                        };
                        const list = [...items];
                        const index = list.findIndex(
                          (item: any) => item.id === it.id,
                        );
                        list[index] = updated;
                        saveItems(side, list);
                      }}
                      type="number"
                      step="0.01"
                      className="w-32 px-2 py-1 text-xs text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-v3-text"
                    />
                    <input
                      value={it.description}
                      onChange={(e) => {
                        const updated = { ...it, description: e.target.value };
                        const list = [...items];
                        const index = list.findIndex(
                          (item: any) => item.id === it.id,
                        );
                        list[index] = updated;
                        saveItems(side, list);
                      }}
                      className="flex-1 min-w-0 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-v3-text"
                      placeholder="Açıklama"
                    />
                    {showSupplier && (
                      <SearchableVendorSelect
                        value={it.supplier}
                        onChange={(vendorId: string) => {
                          const updated = { ...it, supplier: vendorId };
                          const list = [...items];
                          const index = list.findIndex(
                            (item: any) => item.id === it.id,
                          );
                          list[index] = updated;
                          saveItems(side, list);
                        }}
                        vendors={vendors}
                        className="w-40"
                      />
                    )}
                    <div className="w-24 flex items-center gap-1 justify-end pr-1">
                      <button
                        onClick={() => {
                          const updated = { ...it, isEditing: false };
                          const list = [...items];
                          const index = list.findIndex(
                            (item: any) => item.id === it.id,
                          );
                          list[index] = updated;
                          saveItems(side, list);
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
                        onClick={() => onRemove(side, it.id)}
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
                  </>
                ) : (
                  // Görüntüleme modu - normal div'ler
                  <>
                    <div className="w-36"></div>{" "}
                    {/* Ana kategori boş - başlıkta gösteriliyor */}
                    <div className="w-40 text-xs text-v3-text">
                      {getCategoryName(it.sub_category) || "-"}
                    </div>
                    <div className="w-16 text-right pr-1 text-xs text-v3-text">
                      {Math.round(it.qty)}
                    </div>
                    <div className="w-20 text-right pr-1 text-xs text-v3-text">
                      {Math.round(it.repeat)}
                    </div>
                    <div className="w-24 text-right pr-1 text-xs text-v3-text">
                      {formatTRY(it.unit_price)}
                    </div>
                    <div className="w-32 text-right pr-1 text-xs font-semibold text-v3-text">
                      {formatTRY(it.total)}
                    </div>
                    <div className="w-16 text-xs text-v3-text">
                      {it.currency}
                    </div>
                    <div className="w-16 text-xs text-v3-text">
                      %{it.vat}
                    </div>
                    <div className="w-16 text-right pr-1 text-xs text-v3-text">
                      {formatTRY(it.fx)}
                    </div>
                    <div className="w-32 text-right pr-1 text-xs font-semibold text-v3-text">
                      {formatTRY(it.total_try)}
                    </div>
                    <div className="flex-1 min-w-0 text-xs text-v3-text">
                      {it.description}
                    </div>
                    {showSupplier && (
                      <div className="w-40 text-xs text-v3-text">
                        {getVendorName(it.supplier) || "-"}
                      </div>
                    )}
                    <div className="w-24 flex items-center gap-1 justify-end pr-1">
                      <button
                        onClick={() => onAddBelow(side, it.id)}
                        className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
                        title="Satır Ekle"
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
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => onEditRow(side, it.id)}
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
                        onClick={() => onRemove(side, it.id)}
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
                  </>
                )}
              </div>
            );
          })}

          {/* Genel Toplamlar */}
          <div className="mt-4 bg-blue-500 dark:bg-blue-700 rounded-md p-3">
            <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
              <div className="w-36 text-sm font-bold text-v3-text">
                GENEL TOPLAM
              </div>
              <div className="w-40"></div>
              <div className="w-16"></div>
              <div className="w-20"></div>
              <div className="w-24"></div>
              <div className="w-32 text-right pr-1 text-sm font-bold text-v3-text">
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
              <div className="w-32 text-right pr-1 text-sm font-bold text-v3-text">
                {formatTRY(
                  items.reduce(
                    (sum: number, it: any) => sum + Number(it.total_try || 0),
                    0,
                  ),
                )}{" "}
                TL
              </div>
              <div className="flex-1 min-w-0"></div>
              {showSupplier && <div className="w-40"></div>}
              <div className="w-24"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptySection({ title }: { title: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
      <p className="text-xs text-gray-600 dark:text-gray-300">
        {title} sekmesi için tasarım ve veri entegrasyonu burada
        oluşturulacaktır.
      </p>
    </div>
  );
}

function ProfitLossList({
  salesItems,
  purchaseItems,
  formatTRY,
  getCategoryName,
}: {
  salesItems: any[];
  purchaseItems: any[];
  formatTRY: (value: number) => string;
  getCategoryName: (id: string) => string;
}) {
  // Alt kategori bazında tek satırda toplamak için grupla ve biriktir
  type Aggregated = {
    main_category: string;
    sub_category: string;
    salesTotal: number;
    salesTotalTRY: number;
    salesCurrencies: Set<string>;
    salesFxValues: Set<number>;
    purchaseTotal: number;
    purchaseTotalTRY: number;
    purchaseCurrencies: Set<string>;
    purchaseFxValues: Set<number>;
  };

  const aggregatedMap: Map<string, Aggregated> = new Map();

  const getKey = (it: any) => `${it.main_category}__${it.sub_category}`;

  const ensureAgg = (it: any) => {
    const key = getKey(it);
    if (!aggregatedMap.has(key)) {
      aggregatedMap.set(key, {
        main_category: it.main_category,
        sub_category: it.sub_category,
        salesTotal: 0,
        salesTotalTRY: 0,
        salesCurrencies: new Set<string>(),
        salesFxValues: new Set<number>(),
        purchaseTotal: 0,
        purchaseTotalTRY: 0,
        purchaseCurrencies: new Set<string>(),
        purchaseFxValues: new Set<number>(),
      });
    }
    return aggregatedMap.get(key)!;
  };

  // Satışları topla
  salesItems.forEach((it: any) => {
    const agg = ensureAgg(it);
    agg.salesTotal += Number(it.total || 0);
    agg.salesTotalTRY += Number(it.total_try || 0);
    if (it.currency) agg.salesCurrencies.add(String(it.currency));
    if (it.fx) agg.salesFxValues.add(Number(it.fx));
  });

  // Alışları topla
  purchaseItems.forEach((it: any) => {
    const agg = ensureAgg(it);
    agg.purchaseTotal += Number(it.total || 0);
    agg.purchaseTotalTRY += Number(it.total_try || 0);
    if (it.currency) agg.purchaseCurrencies.add(String(it.currency));
    if (it.fx) agg.purchaseFxValues.add(Number(it.fx));
  });

  const aggregatedList = Array.from(aggregatedMap.values());

  // Kategorilere göre grupla
  const groupedServices = aggregatedList.reduce(
    (acc: any, service: Aggregated) => {
      const categoryName = getCategoryName(service.main_category);
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(service);
      return acc;
    },
    {} as Record<string, Aggregated[]>,
  );

  // Kar/zarar ve marj hesapları
  const calculateProfitLoss = (service: Aggregated) => {
    return (
      Number(service.salesTotalTRY || 0) - Number(service.purchaseTotalTRY || 0)
    );
  };

  const calculateProfitMargin = (service: Aggregated) => {
    const salesTotalTRY = Number(service.salesTotalTRY || 0);
    if (salesTotalTRY === 0) return 0;
    return (
      ((salesTotalTRY - Number(service.purchaseTotalTRY || 0)) /
        salesTotalTRY) *
      100
    );
  };

  const displayCurrencyTotal = (currSet: Set<string>, total: number) => {
    if (currSet.size === 1) {
      const currency = Array.from(currSet)[0];
      return `${currency} ${formatTRY(total)}`;
    }
    return "-";
  };

  const displayFx = (fxSet: Set<number>) => {
    if (fxSet.size === 1) {
      return formatTRY(Array.from(fxSet)[0]);
    }
    return "-";
  };

  const tooltipForCurrencies = (currSet: Set<string>, total: number) => {
    if (!currSet || currSet.size <= 1) return "";
    // Çoklu dövizleri listeler: EUR, USD ... Toplam TRY zaten ayrı sütunda
    return Array.from(currSet).join(", ");
  };

  const tooltipForFx = (fxSet: Set<number>) => {
    if (!fxSet || fxSet.size <= 1) return "";
    return Array.from(fxSet)
      .map((v) => formatTRY(v))
      .join(", ");
  };

  return (
    <div className="space-y-2">
      {Object.entries(groupedServices).map(
        ([categoryName, services]: [string, any]) => (
          <div key={categoryName} className="space-y-1">
            {/* Kategori başlığı */}
            <div className="bg-gray-200 dark:bg-gray-600 rounded-md p-2">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {categoryName}
              </h3>
            </div>

            {/* Hizmet listesi */}
            {services.map((service: any, index: number) => {
              const profitLoss = calculateProfitLoss(service);
              const profitMargin = calculateProfitMargin(service);

              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-md p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2 text-xs">
                    {/* Alt kategori */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-v3-text">
                        {getCategoryName(service.sub_category) || "-"}
                      </div>
                    </div>

                    {/* Satış Döviz */}
                    <div className="w-32 text-right pr-1">
                      <div
                        className="font-semibold text-green-600 dark:text-green-400 cursor-help"
                        title={tooltipForCurrencies(
                          service.salesCurrencies,
                          service.salesTotal,
                        )}
                      >
                        {displayCurrencyTotal(
                          service.salesCurrencies,
                          service.salesTotal,
                        )}
                      </div>
                    </div>

                    {/* Satış Kur */}
                    <div className="w-24 text-right pr-1">
                      <div
                        className="text-v3-muted cursor-help"
                        title={tooltipForFx(service.salesFxValues)}
                      >
                        {displayFx(service.salesFxValues)}
                      </div>
                    </div>

                    {/* Satış TL */}
                    <div className="w-32 text-right pr-1">
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        {formatTRY(service.salesTotalTRY)}
                      </div>
                    </div>

                    {/* Alış Döviz */}
                    <div className="w-32 text-right pr-1">
                      <div
                        className="font-semibold text-red-600 dark:text-red-400 cursor-help"
                        title={tooltipForCurrencies(
                          service.purchaseCurrencies,
                          service.purchaseTotal,
                        )}
                      >
                        {displayCurrencyTotal(
                          service.purchaseCurrencies,
                          service.purchaseTotal,
                        )}
                      </div>
                    </div>

                    {/* Alış Kur */}
                    <div className="w-24 text-right pr-1">
                      <div
                        className="text-v3-muted cursor-help"
                        title={tooltipForFx(service.purchaseFxValues)}
                      >
                        {displayFx(service.purchaseFxValues)}
                      </div>
                    </div>

                    {/* Alış TL */}
                    <div className="w-32 text-right pr-1">
                      <div className="font-semibold text-red-600 dark:text-red-400">
                        {formatTRY(service.purchaseTotalTRY)}
                      </div>
                    </div>

                    {/* Kar/Zarar */}
                    <div className="w-32 text-right pr-1">
                      <div
                        className={`font-bold ${profitLoss >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        {formatTRY(profitLoss)}
                      </div>
                    </div>

                    {/* Kar Marjı */}
                    <div className="w-24 text-right pr-1">
                      <div
                        className={`${profitMargin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        %{profitMargin.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ),
      )}

      {/* Genel Toplam */}
      {Object.keys(groupedServices).length > 0 && (
        <div className="bg-gray-200 dark:bg-gray-600 rounded-md p-2 border-2 border-gray-300 dark:border-gray-500">
          <div className="flex items-center gap-2 text-sm font-bold">
            {/* Genel Toplam Başlığı */}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-v3-text">
                GENEL TOPLAM
              </div>
            </div>

            {/* Toplam Satış Döviz */}
            <div className="w-32 text-right pr-1">
              <div className="font-bold text-green-600 dark:text-green-400">
                {(() => {
                  const totalSales = aggregatedList.reduce(
                    (sum, s) => sum + Number(s.salesTotal || 0),
                    0,
                  );
                  const currency = (() => {
                    for (const s of aggregatedList) {
                      if (s.salesCurrencies && s.salesCurrencies.size > 0) {
                        return Array.from(s.salesCurrencies)[0];
                      }
                    }
                    return "EUR";
                  })();
                  return `${currency} ${formatTRY(totalSales)}`;
                })()}
              </div>
            </div>

            {/* Satış Kur (boş) */}
            <div className="w-24 text-right pr-1">
              <div className="text-v3-muted">-</div>
            </div>

            {/* Toplam Satış TL */}
            <div className="w-32 text-right pr-1">
              <div className="font-bold text-green-600 dark:text-green-400">
                {formatTRY(
                  aggregatedList.reduce(
                    (sum, s) => sum + Number(s.salesTotalTRY || 0),
                    0,
                  ),
                )}
              </div>
            </div>

            {/* Toplam Alış Döviz */}
            <div className="w-32 text-right pr-1">
              <div className="font-bold text-red-600 dark:text-red-400">
                {(() => {
                  const totalPurchase = aggregatedList.reduce(
                    (sum, s) => sum + Number(s.purchaseTotal || 0),
                    0,
                  );
                  const currency = (() => {
                    for (const s of aggregatedList) {
                      if (
                        s.purchaseCurrencies &&
                        s.purchaseCurrencies.size > 0
                      ) {
                        return Array.from(s.purchaseCurrencies)[0];
                      }
                    }
                    return "EUR";
                  })();
                  return `${currency} ${formatTRY(totalPurchase)}`;
                })()}
              </div>
            </div>

            {/* Alış Kur (boş) */}
            <div className="w-24 text-right pr-1">
              <div className="text-v3-muted">-</div>
            </div>

            {/* Toplam Alış TL */}
            <div className="w-32 text-right pr-1">
              <div className="font-bold text-red-600 dark:text-red-400">
                {formatTRY(
                  aggregatedList.reduce(
                    (sum, s) => sum + Number(s.purchaseTotalTRY || 0),
                    0,
                  ),
                )}
              </div>
            </div>

            {/* Toplam Kar/Zarar */}
            <div className="w-32 text-right pr-1">
              <div
                className={`font-bold ${(() => {
                  const totalSales = aggregatedList.reduce(
                    (sum, s) => sum + Number(s.salesTotalTRY || 0),
                    0,
                  );
                  const totalPurchase = aggregatedList.reduce(
                    (sum, s) => sum + Number(s.purchaseTotalTRY || 0),
                    0,
                  );
                  return totalSales - totalPurchase >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400";
                })()}`}
              >
                {formatTRY(
                  aggregatedList.reduce(
                    (sum, s) =>
                      sum +
                      Number(s.salesTotalTRY || 0) -
                      Number(s.purchaseTotalTRY || 0),
                    0,
                  ),
                )}
              </div>
            </div>

            {/* Toplam Kar Marjı */}
            <div className="w-24 text-right pr-1">
              <div
                className={`font-bold ${(() => {
                  const totalSales = aggregatedList.reduce(
                    (sum, s) => sum + Number(s.salesTotalTRY || 0),
                    0,
                  );
                  const totalPurchase = aggregatedList.reduce(
                    (sum, s) => sum + Number(s.purchaseTotalTRY || 0),
                    0,
                  );
                  const margin =
                    totalSales > 0
                      ? ((totalSales - totalPurchase) / totalSales) * 100
                      : 0;
                  return margin >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400";
                })()}`}
              >
                %
                {(() => {
                  const totalSales = aggregatedList.reduce(
                    (sum, s) => sum + Number(s.salesTotalTRY || 0),
                    0,
                  );
                  const totalPurchase = aggregatedList.reduce(
                    (sum, s) => sum + Number(s.purchaseTotalTRY || 0),
                    0,
                  );
                  const margin =
                    totalSales > 0
                      ? ((totalSales - totalPurchase) / totalSales) * 100
                      : 0;
                  return margin.toFixed(1);
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchableVendorSelect({
  value,
  onChange,
  vendors,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  vendors: any[];
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const filteredVendors = vendors.filter(
    (v: any) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.subtitle &&
        v.subtitle.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const selectedVendor = vendors.find((v: any) => v.id === value);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredVendors.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev <= 0 ? filteredVendors.length - 1 : prev - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && filteredVendors[selectedIndex]) {
          onChange(filteredVendors[selectedIndex].id);
          setIsOpen(false);
          setSearchTerm("");
          setSelectedIndex(-1);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearchTerm("");
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (supplierId: string) => {
    onChange(supplierId);
    setIsOpen(false);
    setSearchTerm("");
    setSelectedIndex(-1);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-v3-text cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <span className="truncate">
          {selectedVendor ? selectedVendor.name : "Tedarikçi/Otel Seçin"}
        </span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg max-h-48 overflow-y-auto">
          <input
            type="text"
            className="w-full px-2 py-1 text-xs border-b border-gray-200 dark:border-v3-border bg-white dark:bg-gray-800 text-v3-text focus:outline-none"
            placeholder="Ara..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {filteredVendors.length > 0 ? (
            filteredVendors.map((v: any, index: number) => (
              <div
                key={v.id}
                className={`px-2 py-1 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  index === selectedIndex ? "bg-blue-100 dark:bg-blue-900" : ""
                } ${value === v.id ? "bg-blue-500/10 dark:bg-blue-800" : ""}`}
                onClick={() => handleSelect(v.id)}
              >
                <div className="font-medium">
                  {v.name}{" "}
                  {v.type === "hotel" && (
                    <span className="inline-block ml-1 text-[10px] px-1 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                      OTEL
                    </span>
                  )}
                </div>
                {v.subtitle && (
                  <div className="text-v3-muted text-[10px]">
                    {v.subtitle}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-2 py-1 text-xs text-v3-muted">
              Tedarikçi bulunamadı
            </div>
          )}
        </div>
      )}
    </div>
  );
}
