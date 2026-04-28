import { useState } from 'react';

export function useEventActivityState() {
  const [eventsActivities, setEventsActivities] = useState<any[]>([]);
  const [editingEventIndex, setEditingEventIndex] = useState<number | null>(null);
  const [tempEventItem, setTempEventItem] = useState<any>(null);
  const [isNewEventItem, setIsNewEventItem] = useState<boolean>(false);
  const [eventSearch, setEventSearch] = useState<string>('');
  const [eventSortField, setEventSortField] = useState<string>('');
  const [eventSortDirection, setEventSortDirection] = useState<'asc' | 'desc'>('asc');
  const [eventSubCategories, setEventSubCategories] = useState<any[]>([]);
  const [selectedEventMainCategory, setSelectedEventMainCategory] = useState<string>('CAT_005'); // Etkinlik & Aktivite ana kategorisi
  const [eventSupplierSearch, setEventSupplierSearch] = useState<string>('');
  const [showEventSupplierDropdown, setShowEventSupplierDropdown] = useState<boolean>(false);
  const [selectedEventSupplierIndex, setSelectedEventSupplierIndex] = useState<number>(-1);

  return {
    eventsActivities,
    setEventsActivities,
    editingEventIndex,
    setEditingEventIndex,
    tempEventItem,
    setTempEventItem,
    isNewEventItem,
    setIsNewEventItem,
    eventSearch,
    setEventSearch,
    eventSortField,
    setEventSortField,
    eventSortDirection,
    setEventSortDirection,
    eventSubCategories,
    setEventSubCategories,
    selectedEventMainCategory,
    setSelectedEventMainCategory,
    eventSupplierSearch,
    setEventSupplierSearch,
    showEventSupplierDropdown,
    setShowEventSupplierDropdown,
    selectedEventSupplierIndex,
    setSelectedEventSupplierIndex,
  };
}



