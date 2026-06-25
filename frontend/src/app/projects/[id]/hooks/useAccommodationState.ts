import { useState } from "react";

export function useAccommodationState() {
  const [accommodationItems, setAccommodationItems] = useState<any[]>([]);
  const [editingAccommodationIndex, setEditingAccommodationIndex] = useState<
    number | null
  >(null);
  const [tempAccommodationItem, setTempAccommodationItem] = useState<any>(null);
  const [isNewAccommodationItem, setIsNewAccommodationItem] =
    useState<boolean>(false);
  const [accommodationSearch, setAccommodationSearch] = useState<string>("");

  return {
    accommodationItems,
    setAccommodationItems,
    editingAccommodationIndex,
    setEditingAccommodationIndex,
    tempAccommodationItem,
    setTempAccommodationItem,
    isNewAccommodationItem,
    setIsNewAccommodationItem,
    accommodationSearch,
    setAccommodationSearch,
  };
}
