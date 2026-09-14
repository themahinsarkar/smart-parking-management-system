import React, { useState, useEffect } from 'react';
import {
  User,
  Vehicle,
  Booking,
  Payment,
  ParkingSlot,
} from '../types.ts';
import {
  Car,
  Clock,
  CreditCard,
  Plus,
  CalendarCheck,
  Receipt,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { ActiveBookingCard } from './ActiveBookingCard.tsx';
import { api } from '../lib/api.ts';

interface Props {
  currentUser: User;
  vehicles: Vehicle[];
  bookings: Booking[];
  payments: Payment[];
  onOpenBooking: () => void;
  onReturnVehicle: (bookingId: string) => void;
  onVehicleAdded: (vehicle: Vehicle) => void;
}

export const CustomerDashboard: React.FC<Props> = ({
  currentUser,
  vehicles,
  bookings,
  payments,
  onOpenBooking,
  onReturnVehicle,
  onVehicleAdded,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'payments' | 'vehicles'>('active');

  // Add vehicle modal/inline
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [regPlate, setRegPlate] = useState<string>('');
  const [regType, setRegType] = useState<string>('Car');
  const [regModel, setRegModel] = useState<string>('');
  const [regColor, setRegColor] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);

  const activeBookings = bookings.filter(
    (b) => b.status === 'Confirmed' || b.status === 'Parked' || b.status === 'Extra Payment Required'
  );
  const completedBookings = bookings.filter((b) => b.status === 'Completed' || b.status === 'Cancelled');

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regPlate.trim()) return;
    setIsSubmitting(true);
    setAddError(null);
    try {
      const v = await api.addVehicle({
        registration_number: regPlate.trim(),
        vehicle_type: regType,
        model: regModel || 'Standard',
        color: regColor || 'Silver',
      });
      onVehicleAdded(v);
      setShowAddModal(false);
      setRegPlate('');
      setRegModel('');
      setRegColor('');
    } catch (err: any) {
      setAddError(err.message || 'Failed to add vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="customer-dashboard" className="space-y-6">
      {/* Profile & Permanent ID Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Background ambient shape */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-blue-500/30">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold">{currentUser.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Verified Member
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{currentUser.email} • {currentUser.phone || 'No phone'}</p>
            </div>
          </div>

          {/* Permanent Parking ID badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider block">
                Permanent Parking ID
              </span>
              <span className="text-2xl font-mono font-extrabold text-white tracking-wider block">
                {currentUser.customer_id}
              </span>
              <span className="text-[11px] text-slate-300 block">
                Use for quick check-in & lookup
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white text-slate-900 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-white/10 relative z-10">
          <button
            id="book-slot-cta-btn"
            onClick={onOpenBooking}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Layers className="w-4 h-4" /> Book a Parking Slot
          </button>
          <button
            id="return-vehicle-cta-btn"
            onClick={() => onReturnVehicle('')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer border border-white/10"
          >
            <Car className="w-4 h-4" /> Return / Exit Vehicle
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-xs transition flex items-center gap-2 cursor-pointer border border-white/10"
          >
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'active'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" /> Active Parking ({activeBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CalendarCheck className="w-4 h-4" /> Parking History ({completedBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'payments'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" /> Payment History ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'vehicles'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Car className="w-4 h-4" /> My Vehicles ({vehicles.length})
        </button>
      </div>

      {/* TAB 1: ACTIVE PARKING */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBookings.map((b) => (
                <ActiveBookingCard
                  key={b.id}
                  booking={b}
                  onReturnVehicle={onReturnVehicle}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Active Parking Bookings</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                You do not have any vehicle currently parked or reserved. View available slots to book instantly.
              </p>
              <button
                onClick={onOpenBooking}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-2"
              >
                <Layers className="w-4 h-4" /> View Live Slots & Book
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PARKING HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Booking ID</th>
                  <th className="p-3.5">Vehicle</th>
                  <th className="p-3.5">Slot</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Total Paid</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="p-3.5 font-mono font-bold text-blue-700">{b.booking_id}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">{b.vehicle_number}</td>
                    <td className="p-3.5 font-mono text-slate-700">{b.slot_number}</td>
                    <td className="p-3.5 text-slate-600">{b.paid_duration}m</td>
                    <td className="p-3.5 font-bold text-slate-900">৳{b.total_amount}</td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {completedBookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No completed bookings found in your history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT HISTORY */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Transaction ID</th>
                  <th className="p-3.5">Booking ID</th>
                  <th className="p-3.5">Payment Type</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="p-3.5 font-mono font-bold text-slate-800">{p.transaction_id}</td>
                    <td className="p-3.5 font-mono text-blue-700">{p.booking_id}</td>
                    <td className="p-3.5 font-medium text-slate-700">{p.payment_type}</td>
                    <td className="p-3.5 font-semibold text-slate-600">{p.payment_method}</td>
                    <td className="p-3.5 font-extrabold text-emerald-700">৳{p.amount}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {p.payment_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(p.paid_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No payment transactions recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: REGISTERED VEHICLES */}
      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">Saved Vehicles in Your Profile</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Vehicle
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-extrabold text-sm text-slate-900">
                      {v.registration_number}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {v.vehicle_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    {v.model} • {v.color}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Registered Vehicle</span>
                  <span className="text-emerald-600 font-semibold">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Register New Vehicle</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Cancel
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddVehicle} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Registration Plate *
                </label>
                <input
                  type="text"
                  required
                  placeholder="DHAKA-METRO-GA-123456"
                  value={regPlate}
                  onChange={(e) => setRegPlate(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Vehicle Type *
                </label>
                <select
                  value={regType}
                  onChange={(e) => setRegType(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
                >
                  <option value="Car">Car</option>
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="SUV">SUV</option>
                  <option value="Van">Van</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Corolla"
                    value={regModel}
                    onChange={(e) => setRegModel(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Silver"
                    value={regColor}
                    onChange={(e) => setRegColor(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save Vehicle to Profile'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
