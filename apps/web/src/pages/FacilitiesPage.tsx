// ─────────────────────────────────────────────
// SENTINEL Web — Facilities, Floors & Digital Twin
// ─────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Layers,
  LayoutGrid,
  Plus,
  Search,
  Thermometer,
  Wind,
  Radio,
  Sliders,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useFacility } from '../context/FacilityContext';
import { useOrganization } from '../context/OrganizationContext';
import { CreateFacilityModal } from '../components/facility/CreateFacilityModal';
import { CreateFloorModal } from '../components/facility/CreateFloorModal';
import { CreateRoomModal } from '../components/facility/CreateRoomModal';
import { RoomDetailModal } from '../components/facility/RoomDetailModal';
import type { RoomOccupancyState, RoomType } from '@sentinel/types';

const FACILITY_ICONS: Record<string, string> = {
  hospital_wing: '🏥',
  hotel_tower: '🏨',
  academic_building: '🏫',
  transit_depot: '🚌',
  corporate_tower: '🏢',
  manufacturing_plant: '🏭',
  logistics_hub: '📦',
  retail_center: '🛍️',
  parking_structure: '🅿️',
  civic_center: '🏛️',
  general: '🌐',
};

const ROOM_ICONS: Record<RoomType, string> = {
  hospital_room: '🏥',
  hotel_room: '🏨',
  classroom: '🏫',
  bus: '🚌',
  meeting_room: '👥',
  office: '💼',
  factory_zone: '🏭',
  warehouse_zone: '📦',
  mall_zone: '🛍️',
  restroom: '🚻',
  elevator: '🛗',
  parking_zone: '🅿️',
  lobby: '🏛️',
  corridor: '🚶',
  storage: '🗄️',
  general: '🌐',
};

const OCCUPANCY_PILLS: Record<
  RoomOccupancyState,
  { label: string; bg: string; text: string; dot: string }
> = {
  EMPTY: { label: 'Vacant', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  OCCUPIED: { label: 'Occupied', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  STATIONARY_OCCUPANCY: {
    label: 'Stationary (Bed/Resting)',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
  },
  ACTIVE_OCCUPANCY: {
    label: 'Active Presence',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  HIGH_DENSITY: {
    label: 'High Density / Overcapacity',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  UNKNOWN: { label: 'Pending', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

export const FacilitiesPage: React.FC = () => {
  const { hasPermission } = useOrganization();
  const {
    facilities,
    selectedFacility,
    floors,
    selectedFloor,
    rooms,
    selectedRoom,
    selectFacility,
    selectFloor,
    selectRoom,
    isLoadingFacilities,
    isLoadingRooms,
  } = useFacility();

  const [createFacilityOpen, setCreateFacilityOpen] = useState(false);
  const [createFloorOpen, setCreateFloorOpen] = useState(false);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);

  // Search & Filter controls (Prompt #37)
  const [searchQuery, setSearchQuery] = useState('');
  const [occupancyFilter, setOccupancyFilter] = useState<string>('ALL');

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      // Search term
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesNumber = r.roomNumber ? r.roomNumber.toLowerCase().includes(q) : false;
        const matchesDesc = r.description ? r.description.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesNumber && !matchesDesc) return false;
      }

      // Occupancy filter
      if (occupancyFilter === 'OCCUPIED' && r.occupancyState === 'EMPTY') return false;
      if (occupancyFilter === 'EMPTY' && r.occupancyState !== 'EMPTY') return false;
      if (occupancyFilter === 'ALERTS' && !r.hasActiveAlert) return false;

      return true;
    });
  }, [rooms, searchQuery, occupancyFilter]);

  const facilityIcon = selectedFacility?.type
    ? FACILITY_ICONS[selectedFacility.type] || '🏢'
    : '🏢';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{facilityIcon}</span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Facilities & Digital Twin
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Spatial architectural hierarchy, floor navigation, and privacy-preserving autonomous room twins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasPermission('facility.create') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCreateFacilityOpen(true)}
              leftIcon={<Building2 className="w-4 h-4 text-sentinel-600" />}
            >
              New Facility
            </Button>
          )}

          {hasPermission('facility.update') && selectedFacility && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCreateFloorOpen(true)}
              leftIcon={<Layers className="w-4 h-4 text-indigo-600" />}
            >
              Add Floor
            </Button>
          )}

          {hasPermission('room.create') && selectedFloor && (
            <Button
              size="sm"
              onClick={() => setCreateRoomOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Room
            </Button>
          )}
        </div>
      </div>

      {/* ── Facility / Campus Switcher Bar ── */}
      {isLoadingFacilities ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading campus facilities...</div>
      ) : facilities.length === 0 ? (
        <Card variant="default" className="text-center py-8">
          <CardHeader>
            <div className="w-12 h-12 rounded-2xl bg-sentinel-50 text-sentinel-600 flex items-center justify-center mx-auto mb-2">
              <Building2 className="w-6 h-6" />
            </div>
            <CardTitle>No Facilities in this Organization</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Deploy your first campus building, transit depot, or hospital wing to configure rooms and digital twins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasPermission('facility.create') && (
              <Button
                size="sm"
                onClick={() => setCreateFacilityOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create First Facility
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Facilities Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {facilities.map((fac) => {
              const isSelected = fac.id === selectedFacility?.id;
              const icon = fac.type ? FACILITY_ICONS[fac.type] || '🏢' : '🏢';

              return (
                <button
                  key={fac.id}
                  type="button"
                  onClick={() => selectFacility(fac.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    isSelected
                      ? 'bg-sentinel-50/70 border-sentinel-500 shadow-xs ring-1 ring-sentinel-500'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-2xl">{icon}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {fac.code || 'CAMPUS'}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900 truncate">{fac.name}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {fac.city ? `${fac.city}, ${fac.country || ''}` : fac.timezone}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {fac.totalFloors || 0} {fac.totalFloors === 1 ? 'Floor' : 'Floors'}
                    </span>
                    <span>
                      {fac.totalRooms || 0} {fac.totalRooms === 1 ? 'Room' : 'Rooms'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Floor Level Tabs & Navigation ── */}
          {selectedFacility && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-2 pr-1 flex items-center gap-1.5 shrink-0">
                  <Layers className="w-3.5 h-3.5 text-sentinel-600" />
                  Levels:
                </span>
                {floors.map((fl) => {
                  const isSelected = fl.id === selectedFloor?.id;
                  return (
                    <button
                      key={fl.id}
                      type="button"
                      onClick={() => selectFloor(fl.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-sentinel-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {fl.name}
                      {fl.roomCount !== undefined && (
                        <span
                          className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {fl.roomCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Global Search and Filter Bar (Prompt #37) */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search rooms by number, name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sentinel-500 w-44 sm:w-56"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {['ALL', 'OCCUPIED', 'EMPTY', 'ALERTS'].map((state) => (
                    <button
                      key={state}
                      type="button"
                      onClick={() => setOccupancyFilter(state)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        occupancyFilter === state
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Floor Plan Digital Twin Room Grid ── */}
          {isLoadingRooms ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading spatial digital twin...</div>
          ) : filteredRooms.length === 0 ? (
            <Card variant="default" className="text-center py-12">
              <CardHeader>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <CardTitle>
                  {searchQuery ? 'No Rooms Match Filter' : 'No Rooms on this Level'}
                </CardTitle>
                <CardDescription className="max-w-md mx-auto">
                  {searchQuery
                    ? `No spaces match "${searchQuery}". Clear your search query to see all rooms.`
                    : 'Add patient rooms, classrooms, hotel suites, or bus cabins to this floor level.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!searchQuery && hasPermission('room.create') && selectedFloor && (
                  <Button
                    size="sm"
                    onClick={() => setCreateRoomOpen(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add First Room
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms.map((room) => {
                const pill = OCCUPANCY_PILLS[room.occupancyState] || OCCUPANCY_PILLS.EMPTY;
                const icon = ROOM_ICONS[room.roomType] || '🏢';
                const hasHighCo2 = (room.currentCo2 || 0) > 1000;

                return (
                  <div
                    key={room.id}
                    onClick={() => selectRoom(room)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group bg-white shadow-2xs hover:shadow-md ${
                      room.hasActiveAlert
                        ? 'border-rose-300 ring-1 ring-rose-200'
                        : 'border-slate-200/80 hover:border-sentinel-400'
                    }`}
                  >
                    {/* Active Alert Beacon Banner */}
                    {room.hasActiveAlert && (
                      <div className="mb-3 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs">
                        <span className="font-bold text-rose-700 flex items-center gap-1.5 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          {room.activeAlertSeverity || 'CRITICAL'} PRIORITY
                        </span>
                        <span className="text-[10px] text-rose-500 font-semibold">Triage</span>
                      </div>
                    )}

                    {/* Room Header */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl shrink-0">{icon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {room.roomNumber && (
                              <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                {room.roomNumber}
                              </span>
                            )}
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {room.name}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-400 capitalize">
                            {room.roomType.replace('_', ' ')}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${pill.bg} ${pill.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${pill.dot} animate-pulse`} />
                        {pill.label}
                      </span>
                    </div>

                    {/* Occupancy Progress Bar */}
                    <div className="my-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>mmWave Occupancy:</span>
                        <span className="font-bold text-slate-800">
                          {room.estimatedOccupants} / {room.capacity}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            room.estimatedOccupants > room.capacity
                              ? 'bg-rose-500'
                              : room.estimatedOccupants > 0
                              ? 'bg-sentinel-600'
                              : 'bg-slate-300'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (room.estimatedOccupants / (room.capacity || 1)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Live Telemetry Chips */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Thermometer className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{room.currentTemperature || 21.5}°C</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 ${
                          hasHighCo2 ? 'text-amber-600 font-bold' : 'text-slate-600'
                        }`}
                      >
                        <Wind className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{room.currentCo2 || 450} ppm</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Radio className="w-3.5 h-3.5 text-sentinel-600 shrink-0" />
                        <span>{room.occupancyConfidence || 0}% Conf.</span>
                      </div>
                    </div>

                    {/* HVAC Mode & Privacy Guarantee Pill */}
                    <div className="mt-3 flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1 text-slate-500 font-medium">
                        <Sliders className="w-3 h-3 text-sentinel-600" />
                        <strong className="text-slate-700 uppercase">
                          {room.hvacIsSimulated ? '[SIM] ' : ''}HVAC: {room.hvacState}
                        </strong>
                      </span>

                      <span className="flex items-center gap-1 text-blue-600 font-medium">
                        <Lock className="w-3 h-3" />
                        Zero Cameras
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      <CreateFacilityModal
        isOpen={createFacilityOpen}
        onClose={() => setCreateFacilityOpen(false)}
      />

      <CreateFloorModal
        isOpen={createFloorOpen}
        onClose={() => setCreateFloorOpen(false)}
      />

      <CreateRoomModal
        isOpen={createRoomOpen}
        onClose={() => setCreateRoomOpen(false)}
      />

      <RoomDetailModal
        room={selectedRoom}
        isOpen={!!selectedRoom}
        onClose={() => selectRoom(null)}
      />
    </div>
  );
};
