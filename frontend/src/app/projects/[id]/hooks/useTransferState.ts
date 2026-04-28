import { useState } from 'react';

export function useTransferState() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [selectedTransfers, setSelectedTransfers] = useState<string[]>([]);
  const [showVehicleAssignmentModal, setShowVehicleAssignmentModal] = useState(false);
  const [transferCostInput, setTransferCostInput] = useState<Record<string, string>>({});
  const [showAddTransferMenu, setShowAddTransferMenu] = useState(false);
  const [showTransferTimingModal, setShowTransferTimingModal] = useState(false);
  const [departureHours, setDepartureHours] = useState(2);
  const [departureMinutes, setDepartureMinutes] = useState(0);
  const [currentTransferIndex, setCurrentTransferIndex] = useState<number | null>(null);
  const [transferSearch, setTransferSearch] = useState<string>('');
  const [transferTotals, setTransferTotals] = useState<{ [key: string]: { kisiSayisi: number; toplamMaliyet: number } }>({});

  return {
    transfers,
    setTransfers,
    selectedTransfers,
    setSelectedTransfers,
    showVehicleAssignmentModal,
    setShowVehicleAssignmentModal,
    transferCostInput,
    setTransferCostInput,
    showAddTransferMenu,
    setShowAddTransferMenu,
    showTransferTimingModal,
    setShowTransferTimingModal,
    departureHours,
    setDepartureHours,
    departureMinutes,
    setDepartureMinutes,
    currentTransferIndex,
    setCurrentTransferIndex,
    transferSearch,
    setTransferSearch,
    transferTotals,
    setTransferTotals,
  };
}



