import { useState } from "react";

export function useHotelExtraState() {
  const [hotelExtras, setHotelExtras] = useState<any[]>([]);
  const [editingHotelExtraIndex, setEditingHotelExtraIndex] = useState<
    number | null
  >(null);
  const [tempHotelExtraItem, setTempHotelExtraItem] = useState<any>(null);
  const [isNewHotelExtraItem, setIsNewHotelExtraItem] =
    useState<boolean>(false);
  const [hotelExtraAmountInput, setHotelExtraAmountInput] =
    useState<string>("");
  const [hotelExtraTotalTRYInput, setHotelExtraTotalTRYInput] =
    useState<string>("");
  const [hotelExtraSearch, setHotelExtraSearch] = useState<string>("");
  const [hotelExtraCategories, setHotelExtraCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [hotelSupplierSearch, setHotelSupplierSearch] = useState<string>("");
  const [showHotelSupplierDropdown, setShowHotelSupplierDropdown] =
    useState<boolean>(false);
  const [hotelExtraSubCategories, setHotelExtraSubCategories] = useState<any[]>(
    [],
  );
  const [hotelExtraMainCategories, setHotelExtraMainCategories] = useState<
    any[]
  >([]);
  const [selectedMainCategory, setSelectedMainCategory] =
    useState<string>("CAT_002"); // Varsayılan: OTEL | DIGER HIZMETLER
  const [hotelExtraSortField, setHotelExtraSortField] = useState<string>("");
  const [hotelExtraSortDirection, setHotelExtraSortDirection] = useState<
    "asc" | "desc"
  >("asc");

  return {
    hotelExtras,
    setHotelExtras,
    editingHotelExtraIndex,
    setEditingHotelExtraIndex,
    tempHotelExtraItem,
    setTempHotelExtraItem,
    isNewHotelExtraItem,
    setIsNewHotelExtraItem,
    hotelExtraAmountInput,
    setHotelExtraAmountInput,
    hotelExtraTotalTRYInput,
    setHotelExtraTotalTRYInput,
    hotelExtraSearch,
    setHotelExtraSearch,
    hotelExtraCategories,
    setHotelExtraCategories,
    selectedCategory,
    setSelectedCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    hotelSupplierSearch,
    setHotelSupplierSearch,
    showHotelSupplierDropdown,
    setShowHotelSupplierDropdown,
    hotelExtraSubCategories,
    setHotelExtraSubCategories,
    hotelExtraMainCategories,
    setHotelExtraMainCategories,
    selectedMainCategory,
    setSelectedMainCategory,
    hotelExtraSortField,
    setHotelExtraSortField,
    hotelExtraSortDirection,
    setHotelExtraSortDirection,
  };
}
