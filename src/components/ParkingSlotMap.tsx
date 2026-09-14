import React, { useState } from 'react';
import {
  Car,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wrench,
  Info,
  Filter,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { ParkingSlot, VehicleType } from '../types.ts';

interface Props {
  slots: ParkingSlot[];
  onSelectSlot: (slot: ParkingSlot) => void;
  selectedSlotId?: string;
  userVehicleType?: VehicleType;
}

export const ParkingSlotMap: React.FC<Props> = ({
  slots,
  onSelectSlot,
  selectedSlotId,
  userVehicleType,
}) => {
  const [activeAreaFilter, setActiveAreaFilter] = useState<string>('All');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>(userVehicleType || 'All');
  const [inspectSlot, setInspectSlot] = useState<ParkingSlot | null>(null);

  // Extract unique areas
  const areas = ['All', ...Array.from(new Set(slots.map((s) => s.area)))];
  const vehicleTypes = ['All', 'Car', 'Motorcycle', 'SUV', 'Van'];

  const filteredSlots = slots.filter((slot) => {
    const areaMatch = activeAreaFilter === 'All' || slot.area === activeAreaFilter;
    const typeMatch =
      activeTypeFilter === 'All' ||
      slot.vehicle_type === 'All' ||
      slot.vehicle_type === activeTypeFilter;
    return areaMatch && typeMatch;
  });

  // Slot status counts
  const availableCount = slots.filter((s) => s.status === 'Available').length;
  const occupiedCount = slots.filter((s) => s.status === 'Occupied').length;
  const reservedCount = slots.filter((s) => s.status === 'Reserved').length;
  const maintenanceCount = slots.filter((s) => s.status === 'Maintenance').length;

  const getStatusColor = (status: ParkingSlot['status']) => {
    switch (status) {
      case 'Available':
        return {
          bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900',
          badge: 'bg-emerald-600 text-white',
          dot: 'bg-emerald-500',
        };
      case 'Occupied':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800 opacity-90',
          badge: 'bg-rose-600 text-white',
          dot: 'bg-rose-500',
        };
      case 'Reserved':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          badge: 'bg-amber-500 text-white',
          dot: 'bg-amber-500',
        };
      case 'Maintenance':
        return {
          bg: 'bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed',
          badge: 'bg-slate-500 text-white',
          dot: 'bg-slate-400',
        };
    }
  };

  const handleSlotClick = (slot: ParkingSlot) => {
    setInspectSlot(slot);
    if (slot.status === 'Available') {
      onSelectSlot(slot);
    }
  };

  return (
    <div id="parking-slot-map-card" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" /> Interactive Parking Slot Map
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Select an available green slot to calculate duration and book with immediate payment.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {availableCount} Available
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              {occupiedCount} Occupied
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              {reservedCount} Reserved
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              {maintenanceCount} Maintenance
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Zone:
            </span>
            {areas.map((area) => (
              <button
                key={area}
                onClick={() => setActiveAreaFilter(area)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeAreaFilter === area
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {area === 'All' ? 'All Zones' : area}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Slot Type:</span>
            <select
              value={activeTypeFilter}
              onChange={(e) => setActiveTypeFilter(e.target.value)}
              className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-blue-600 cursor-pointer"
            >
              {vehicleTypes.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All Vehicles' : t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="p-4 sm:p-6 bg-slate-100/70">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filteredSlots.map((slot) => {
            const colors = getStatusColor(slot.status);
            const isSelected = selectedSlotId === slot.id;
            const isHeld = slot.hold_expires_at && slot.hold_expires_at > Date.now();

            return (
              <div
                key={slot.id}
                id={`slot-card-${slot.slot_number}`}
                onClick={() => handleSlotClick(slot)}
                className={`relative rounded-xl p-3 border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${colors.bg} ${
                  isSelected
                    ? 'ring-4 ring-blue-500/30 border-blue-600 shadow-md scale-[1.02]'
                    : ''
                }`}
              >
                {/* Top Row: Slot ID & Status */}
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold tracking-tight font-mono">
                    {slot.slot_number}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${colors.badge}`}>
                    {slot.status}
                  </span>
                </div>

                {/* Center Visual: Bay Markings & Icon */}
                <div className="py-2 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-lg border border-dashed border-slate-300 flex items-center justify-center bg-white/60">
                    <Car
                      className={`w-6 h-6 ${
                        slot.status === 'Available'
                          ? 'text-emerald-600'
                          : slot.status === 'Occupied'
                          ? 'text-rose-600'
                          : slot.status === 'Reserved'
                          ? 'text-amber-600'
                          : 'text-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Bottom Row: Type & Area */}
                <div className="text-[11px] flex items-center justify-between text-slate-500 font-medium">
                  <span className="truncate">{slot.vehicle_type}</span>
                  {slot.status === 'Available' && (
                    <span className="text-emerald-700 font-bold text-[10px]">Select</span>
                  )}
                </div>

                {/* Held Badge */}
                {isHeld && slot.status === 'Available' && (
                  <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-[1px] rounded-xl flex items-center justify-center border border-amber-400">
                    <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      Holding
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredSlots.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium text-sm">No parking slots match the selected filters.</p>
          </div>
        )}
      </div>

      {/* Quick Slot Inspector Bottom Strip */}
      {inspectSlot && (
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm font-mono border border-blue-200">
              {inspectSlot.slot_number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{inspectSlot.area}</span>
                <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700">
                  {inspectSlot.vehicle_type}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                    inspectSlot.status === 'Available'
                      ? 'bg-emerald-100 text-emerald-800'
                      : inspectSlot.status === 'Occupied'
                      ? 'bg-rose-100 text-rose-800'
                      : inspectSlot.status === 'Reserved'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {inspectSlot.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {inspectSlot.status === 'Available'
                  ? 'Ready for booking. Rate starts from ৳10 per 30 minutes.'
                  : inspectSlot.status === 'Occupied'
                  ? 'A vehicle is currently parked in this bay.'
                  : inspectSlot.status === 'Reserved'
                  ? 'Reserved by another customer awaiting gate arrival.'
                  : 'Temporarily closed for maintenance inspection.'}
              </p>
            </div>
          </div>

          {inspectSlot.status === 'Available' ? (
            <button
              id="select-this-slot-btn"
              onClick={() => onSelectSlot(inspectSlot)}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-sm hover:shadow transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Select This Slot & Book
            </button>
          ) : (
            <span className="text-xs text-slate-400 font-medium italic">
              Cannot select unavailable slot
            </span>
          )}
        </div>
      )}
    </div>
  );
};
