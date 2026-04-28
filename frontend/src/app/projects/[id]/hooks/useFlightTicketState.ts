import { useState } from 'react';

export interface FlightTicket {
  id: string;
  biletlemeTarihi: string;
  tedarikci: string;
  havayolu: string;
  pnr: string;
  ucusTipi: string;
  gidisTarihi: string;
  gidisSaati: string;
  gidisUcusKodu: string;
  donusTarihi: string;
  donusSaati: string;
  donusUcusKodu: string;
  guzergah: string;
  kisiSayisi: number;
  ppMaliyet: number;
  toplamMaliyet: number;
  doviz: string;
  kur: number;
  toplamTl: number;
  misafirler: string;
  durum: 'aktif' | 'iptal' | 'iade' | 'degistirildi';
  islemler?: string;
}

export function useFlightTicketState() {
  const [flightTickets, setFlightTickets] = useState<FlightTicket[]>([]);
  const [editingFlightIndex, setEditingFlightIndex] = useState<number | null>(null);
  const [tempFlightItem, setTempFlightItem] = useState<FlightTicket | null>(null);
  const [isNewFlightItem, setIsNewFlightItem] = useState<boolean>(false);
  const [flightSearch, setFlightSearch] = useState<string>('');
  const [flightSortField, setFlightSortField] = useState<string>('');
  const [flightSortDirection, setFlightSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedFlightTickets, setExpandedFlightTickets] = useState<Set<string>>(new Set());
  const [flightTicketSearch, setFlightTicketSearch] = useState<string>('');

  return {
    flightTickets,
    setFlightTickets,
    editingFlightIndex,
    setEditingFlightIndex,
    tempFlightItem,
    setTempFlightItem,
    isNewFlightItem,
    setIsNewFlightItem,
    flightSearch,
    setFlightSearch,
    flightSortField,
    setFlightSortField,
    flightSortDirection,
    setFlightSortDirection,
    expandedFlightTickets,
    setExpandedFlightTickets,
    flightTicketSearch,
    setFlightTicketSearch,
  };
}



