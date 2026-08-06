import { useState, useMemo, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

export function useProjectState() {
  const params = useParams();
  const projectId = useMemo(() => {
    const id = String(params?.id || "");
    return id;
  }, [params]);

  // Genel state'ler
  const [activeTab, setActiveTab] = useState<string>("satis");
  const [activeHotelId, setActiveHotelId] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(
    new Set(["satis", "alis", "kar-zarar"]),
  );
  const [project, setProject] = useState<any>(null);

  const prevHotelsCountRef = useRef<number>(-1);

  useEffect(() => {
    const currentCount = project?.hotels_data?.length || 0;
    if (currentCount === 1 && prevHotelsCountRef.current !== 1) {
      setActiveHotelId((prev) => {
        if (prev === "all" || !prev) {
          return String(project.hotels_data[0].id);
        }
        return prev;
      });
    }
    prevHotelsCountRef.current = currentCount;
  }, [project?.hotels_data]);

  // Proje düzenleme state'leri
  const [isEditingProject, setIsEditingProject] = useState<boolean>(false);
  const [projectFormData, setProjectFormData] = useState<any>({});

  // Dropdown ve arama state'leri
  const [agencySearch, setAgencySearch] = useState<string>("");
  const [hotelSearch, setHotelSearch] = useState<string>("");
  const [showAgencyDropdown, setShowAgencyDropdown] = useState<boolean>(false);
  const [showHotelDropdown, setShowHotelDropdown] = useState<boolean>(false);
  const [selectedAgencyIndex, setSelectedAgencyIndex] = useState<number>(-1);
  const [selectedHotelIndex, setSelectedHotelIndex] = useState<number>(-1);
  const [userSearch, setUserSearch] = useState<string>("");
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState<number>(-1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isAddHotelModalOpen, setIsAddHotelModalOpen] =
    useState<boolean>(false);

  // Tab değiştirme fonksiyonu
  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    if (!loadedTabs.has(tabKey)) {
      setLoadedTabs((prev) => new Set([...prev, tabKey]));
    }
  };

  const handleHotelChange = (hotelId: string) => {
    setActiveHotelId(hotelId);
  };

  return {
    projectId,
    activeTab,
    setActiveTab,
    activeHotelId,
    setActiveHotelId,
    loading,
    setLoading,
    loadedTabs,
    setLoadedTabs,
    project,
    setProject,
    isEditingProject,
    setIsEditingProject,
    projectFormData,
    setProjectFormData,
    agencySearch,
    setAgencySearch,
    hotelSearch,
    setHotelSearch,
    showAgencyDropdown,
    setShowAgencyDropdown,
    showHotelDropdown,
    setShowHotelDropdown,
    selectedAgencyIndex,
    setSelectedAgencyIndex,
    selectedHotelIndex,
    setSelectedHotelIndex,
    userSearch,
    setUserSearch,
    showUserDropdown,
    setShowUserDropdown,
    selectedUserIndex,
    setSelectedUserIndex,
    selectedUsers,
    setSelectedUsers,
    isAddHotelModalOpen,
    setIsAddHotelModalOpen,
    handleTabChange,
    handleHotelChange,
  };
}
