// ─────────────────────────────────────────────
// SENTINEL Web — Facility & Digital Twin Context
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Facility,
  Floor,
  Room,
  CreateFacilityDTO,
  UpdateFacilityDTO,
  CreateFloorDTO,
  UpdateFloorDTO,
  CreateRoomDTO,
  UpdateRoomDTO,
  RoomFilterQuery,
} from '@sentinel/types';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';

interface FacilityContextType {
  facilities: (Facility & { totalFloors?: number; totalRooms?: number })[];
  selectedFacility: (Facility & { floors?: Floor[] }) | null;
  floors: Floor[];
  selectedFloor: Floor | null;
  rooms: Room[];
  selectedRoom: Room | null;
  isLoadingFacilities: boolean;
  isLoadingRooms: boolean;
  selectFacility: (facilityId: string) => void;
  selectFloor: (floorId: string) => void;
  selectRoom: (room: Room | null) => void;
  createFacility: (dto: CreateFacilityDTO) => Promise<Facility>;
  updateFacility: (id: string, dto: UpdateFacilityDTO) => Promise<Facility>;
  deleteFacility: (id: string) => Promise<void>;
  createFloor: (facilityId: string, dto: CreateFloorDTO) => Promise<Floor>;
  updateFloor: (facilityId: string, floorId: string, dto: UpdateFloorDTO) => Promise<Floor>;
  deleteFloor: (facilityId: string, floorId: string) => Promise<void>;
  createRoom: (dto: CreateRoomDTO) => Promise<Room>;
  updateRoom: (roomId: string, dto: UpdateRoomDTO) => Promise<Room>;
  deleteRoom: (roomId: string) => Promise<void>;
  searchRooms: (queryText: string) => Promise<Room[]>;
  refetchFacilities: () => Promise<void>;
  refetchRooms: () => Promise<void>;
}

const FacilityContext = createContext<FacilityContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const FacilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const { currentOrganization } = useOrganization();

  const [facilities, setFacilities] = useState<(Facility & { totalFloors?: number; totalRooms?: number })[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<(Facility & { floors?: Floor[] }) | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Authenticated fetch wrapper with X-Organization-Id
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!token) throw new Error('Not authenticated');

      const headers = new Headers(options.headers || {});
      headers.set('Authorization', `Bearer ${token}`);
      if (currentOrganization?.id) {
        headers.set('X-Organization-Id', currentOrganization.id);
      }
      if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }

      const res = await fetch(url, { ...options, headers });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'API request failed');
      }
      return json.data;
    },
    [token, currentOrganization?.id]
  );

  // Fetch facilities for current organization
  const fetchFacilities = useCallback(async () => {
    if (!currentOrganization?.id || !token) {
      setFacilities([]);
      setSelectedFacility(null);
      setFloors([]);
      setSelectedFloor(null);
      setRooms([]);
      return;
    }

    setIsLoadingFacilities(true);
    try {
      const data = await authFetch(`${API_BASE}/facilities`);
      if (Array.isArray(data)) {
        setFacilities(data);
        if (data.length > 0 && data[0]) {
          // Fetch full facility details including floors
          const firstFac = data[0];
          const detailed = await authFetch(`${API_BASE}/facilities/${firstFac.id}`);
          setSelectedFacility(detailed);
          const fls = detailed.floors || [];
          setFloors(fls);
          setSelectedFloor(fls.length > 0 && fls[0] ? fls[0] : null);
        } else {
          setSelectedFacility(null);
          setFloors([]);
          setSelectedFloor(null);
        }
      }
    } catch {
      setFacilities([]);
      setSelectedFacility(null);
      setFloors([]);
      setSelectedFloor(null);
    } finally {
      setIsLoadingFacilities(false);
    }
  }, [currentOrganization?.id, token, authFetch]);

  // Fetch rooms for current facility and optional floor
  const fetchRooms = useCallback(
    async (filterOverride?: RoomFilterQuery) => {
      if (!currentOrganization?.id || !token) {
        setRooms([]);
        return;
      }

      setIsLoadingRooms(true);
      try {
        const queryParams = new URLSearchParams();
        if (filterOverride?.facilityId) {
          queryParams.set('facilityId', filterOverride.facilityId);
        } else if (selectedFacility?.id) {
          queryParams.set('facilityId', selectedFacility.id);
        }

        if (filterOverride?.floorId) {
          queryParams.set('floorId', filterOverride.floorId);
        } else if (selectedFloor?.id) {
          queryParams.set('floorId', selectedFloor.id);
        }

        const data = await authFetch(`${API_BASE}/rooms?${queryParams.toString()}`);
        if (Array.isArray(data)) {
          setRooms(data);
        }
      } catch {
        setRooms([]);
      } finally {
        setIsLoadingRooms(false);
      }
    },
    [currentOrganization?.id, token, selectedFacility?.id, selectedFloor?.id, authFetch]
  );

  // Re-fetch facilities when active organization changes
  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  // Re-fetch rooms when selected facility or floor changes
  useEffect(() => {
    if (selectedFacility?.id) {
      fetchRooms();
    } else {
      setRooms([]);
    }
  }, [selectedFacility?.id, selectedFloor?.id, fetchRooms]);

  // Select a different facility
  const selectFacility = useCallback(
    async (facilityId: string) => {
      try {
        const detailed = await authFetch(`${API_BASE}/facilities/${facilityId}`);
        setSelectedFacility(detailed);
        const fls = detailed.floors || [];
        setFloors(fls);
        setSelectedFloor(fls.length > 0 && fls[0] ? fls[0] : null);
      } catch {
        // Fallback
      }
    },
    [authFetch]
  );

  // Select floor
  const selectFloor = useCallback(
    (floorId: string) => {
      const fl = floors.find((f) => f.id === floorId);
      setSelectedFloor(fl || null);
    },
    [floors]
  );

  // Select room for modal inspection
  const selectRoom = useCallback((room: Room | null) => {
    setSelectedRoom(room);
  }, []);

  // Create facility
  const createFacility = useCallback(
    async (dto: CreateFacilityDTO): Promise<Facility> => {
      const created = await authFetch(`${API_BASE}/facilities`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      await fetchFacilities();
      if (created?.id) {
        await selectFacility(created.id);
      }
      return created;
    },
    [authFetch, fetchFacilities, selectFacility]
  );

  // Update facility
  const updateFacility = useCallback(
    async (id: string, dto: UpdateFacilityDTO): Promise<Facility> => {
      const updated = await authFetch(`${API_BASE}/facilities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
      await fetchFacilities();
      return updated;
    },
    [authFetch, fetchFacilities]
  );

  // Delete facility
  const deleteFacility = useCallback(
    async (id: string): Promise<void> => {
      await authFetch(`${API_BASE}/facilities/${id}`, {
        method: 'DELETE',
      });
      await fetchFacilities();
    },
    [authFetch, fetchFacilities]
  );

  // Create floor
  const createFloor = useCallback(
    async (facilityId: string, dto: CreateFloorDTO): Promise<Floor> => {
      const floor = await authFetch(`${API_BASE}/facilities/${facilityId}/floors`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      await selectFacility(facilityId);
      setSelectedFloor(floor);
      return floor;
    },
    [authFetch, selectFacility]
  );

  // Update floor
  const updateFloor = useCallback(
    async (facilityId: string, floorId: string, dto: UpdateFloorDTO): Promise<Floor> => {
      const updated = await authFetch(
        `${API_BASE}/facilities/${facilityId}/floors/${floorId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(dto),
        }
      );
      await selectFacility(facilityId);
      return updated;
    },
    [authFetch, selectFacility]
  );

  // Delete floor
  const deleteFloor = useCallback(
    async (facilityId: string, floorId: string): Promise<void> => {
      await authFetch(`${API_BASE}/facilities/${facilityId}/floors/${floorId}`, {
        method: 'DELETE',
      });
      await selectFacility(facilityId);
    },
    [authFetch, selectFacility]
  );

  // Create room
  const createRoom = useCallback(
    async (dto: CreateRoomDTO): Promise<Room> => {
      const room = await authFetch(`${API_BASE}/rooms`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      await fetchRooms();
      return room;
    },
    [authFetch, fetchRooms]
  );

  // Update room
  const updateRoom = useCallback(
    async (roomId: string, dto: UpdateRoomDTO): Promise<Room> => {
      const updated = await authFetch(`${API_BASE}/rooms/${roomId}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
      await fetchRooms();
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(updated);
      }
      return updated;
    },
    [authFetch, fetchRooms, selectedRoom?.id]
  );

  // Delete room
  const deleteRoom = useCallback(
    async (roomId: string): Promise<void> => {
      await authFetch(`${API_BASE}/rooms/${roomId}`, {
        method: 'DELETE',
      });
      await fetchRooms();
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
      }
    },
    [authFetch, fetchRooms, selectedRoom?.id]
  );

  // Search rooms
  const searchRooms = useCallback(
    async (queryText: string): Promise<Room[]> => {
      if (!currentOrganization?.id || !token) return [];
      const res = await authFetch(`${API_BASE}/rooms/search?q=${encodeURIComponent(queryText)}`);
      return Array.isArray(res) ? res : [];
    },
    [authFetch, currentOrganization?.id, token]
  );

  return (
    <FacilityContext.Provider
      value={{
        facilities,
        selectedFacility,
        floors,
        selectedFloor,
        rooms,
        selectedRoom,
        isLoadingFacilities,
        isLoadingRooms,
        selectFacility,
        selectFloor,
        selectRoom,
        createFacility,
        updateFacility,
        deleteFacility,
        createFloor,
        updateFloor,
        deleteFloor,
        createRoom,
        updateRoom,
        deleteRoom,
        searchRooms,
        refetchFacilities: fetchFacilities,
        refetchRooms: fetchRooms,
      }}
    >
      {children}
    </FacilityContext.Provider>
  );
};

export const useFacility = (): FacilityContextType => {
  const context = useContext(FacilityContext);
  if (!context) {
    throw new Error('useFacility must be used within a FacilityProvider');
  }
  return context;
};
