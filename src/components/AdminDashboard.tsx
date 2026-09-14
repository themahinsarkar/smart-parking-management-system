import React, { useState, useEffect } from 'react';
import {
  Shield,
  Layers,
  Car,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Users,
  Settings,
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  Search,
  Lock,
  Unlock,
  RotateCcw,
  BarChart3,
  Calendar,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import {
  ParkingSlot,
  Booking,
  Payment,
  ParkingRate,
  SystemSettings,
  DashboardStats,
  VehicleType,
  SlotStatus,
} from '../types.ts';
import { api } from '../lib/api.ts';

interface Props {
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'slots' | 'entry' | 'exit' | 'bookings' | 'customers' | 'rates' | 'reports' | 'settings'
  >('overview');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [rates, setRates] = useState<ParkingRate[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [reports, setReports] = useState<any>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Gate Entry State
  const [entryQuery, setEntryQuery] = useState<string>('');
  const [entryResult, setEntryResult] = useState<any>(null);
  const [entryError, setEntryError] = useState<string | null>(null);

  // Gate Exit State
  const [exitQuery, setExitQuery] = useState<string>('');
  const [exitResult, setExitResult] = useState<any>(null);
  const [exitError, setExitError] = useState<string | null>(null);

  // Slot Management Modal State
  const [showAddSlotModal, setShowAddSlotModal] = useState<boolean>(false);
  const [newSlotNumber, setNewSlotNumber] = useState<string>('');
  const [newSlotArea, setNewSlotArea] = useState<string>('Ground Floor - Zone A');
  const [newSlotType, setNewSlotType] = useState<VehicleType | 'All'>('Car');

  // Load all admin data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [s, sl, b, p, c, r, set, rep] = await Promise.all([
        api.getDashboardStats(),
        api.getSlots(),
        api.getBookings(),
        api.getPayments(),
        api.getCustomers(),
        api.getRates(),
        api.getSettings(),
        api.getReports(),
      ]);
      setStats(s);
      setSlots(sl);
      setBookings(b);
      setPayments(p);
      setCustomers(c);
      setRates(r);
      setSettings(set);
      setReports(rep);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Quick Gate Entry Verification
  const handleVerifyEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryQuery.trim()) return;
    setEntryError(null);
    setEntryResult(null);
    try {
      const res = await api.verifyEntry(entryQuery.trim(), 'Admin Gate Terminal #1');
      setEntryResult(res);
      setActionNotice(res.message);
      loadAdminData();
      onRefreshData();
    } catch (err: any) {
      setEntryError(err.message || 'Verification failed');
    }
  };

  // Quick Gate Exit Lookup
  const handleLookupExit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitQuery.trim()) return;
    setExitError(null);
    setExitResult(null);
    try {
      const res = await api.calculateExit(exitQuery.trim());
      setExitResult(res);
    } catch (err: any) {
      setExitError(err.message || 'Exit calculation failed');
    }
  };

  const handlePayExtraAtGate = async () => {
    if (!exitResult) return;
    try {
      const res = await api.payExtraTime({
        bookingId: exitResult.booking.booking_id,
        paymentMethod: 'Cash / POS',
        amountToPay: exitResult.outstandingAmount,
      });
      setActionNotice(res.message);
      const updated = await api.calculateExit(exitResult.booking.booking_id);
      setExitResult(updated);
      loadAdminData();
      onRefreshData();
    } catch (err: any) {
      setExitError(err.message);
    }
  };

  const handleReleaseVehicleAtGate = async () => {
    if (!exitResult) return;
    try {
      const res = await api.releaseVehicle(exitResult.booking.booking_id);
      setActionNotice(res.message);
      setExitResult(null);
      setExitQuery('');
      loadAdminData();
      onRefreshData();
    } catch (err: any) {
      setExitError(err.message);
    }
  };

  // Slot Management Handlers
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotNumber.trim()) return;
    try {
      await api.addSlot({
        slot_number: newSlotNumber.trim().toUpperCase(),
        area: newSlotArea,
        vehicle_type: newSlotType,
        status: 'Available',
      });
      setShowAddSlotModal(false);
      setNewSlotNumber('');
      setActionNotice(`Slot ${newSlotNumber} added successfully.`);
      loadAdminData();
      onRefreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateSlotStatus = async (slotId: string, status: SlotStatus) => {
    try {
      await api.updateSlot(slotId, { status });
      setActionNotice(`Slot status updated to ${status}.`);
      loadAdminData();
      onRefreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to remove this parking slot?')) return;
    try {
      await api.deleteSlot(slotId);
      setActionNotice('Slot removed successfully.');
      loadAdminData();
      onRefreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Rate Update Handler
  const handleUpdateRate = async (rateId: string, price: number) => {
    try {
      await api.updateRate(rateId, price);
      setActionNotice('Parking rate updated.');
      loadAdminData();
      onRefreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Reset Database to Seed
  const handleResetDb = async () => {
    if (!confirm('Warning: This will reset all bookings, slots, and customers to default demo seed data. Continue?')) return;
    try {
      await api.resetDb();
      setActionNotice('Database restored to initial demo state.');
      loadAdminData();
      onRefreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div id="admin-dashboard-container" className="space-y-6">
      {/* Top Banner Notice */}
      {actionNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center justify-between">
          <span>{actionNotice}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-blue-600 hover:text-blue-800 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Admin Header & Key Metrics */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-600" /> Admin & Staff Operations Hub
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live facility management, vehicle gates, overstay controls, rates, and audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAdminData}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refresh Live Data
            </button>
            <button
              onClick={() => setActiveTab('entry')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Car className="w-4 h-4" /> Vehicle Entry Gate
            </button>
            <button
              onClick={() => setActiveTab('exit')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-4 h-4" /> Vehicle Exit Gate
            </button>
          </div>
        </div>

        {/* 8 Essential Operational Metric Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Slots</span>
              <span className="text-xl font-extrabold text-slate-900">{stats.totalSlots}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Available</span>
              <span className="text-xl font-extrabold text-emerald-800">{stats.availableSlots}</span>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Occupied</span>
              <span className="text-xl font-extrabold text-rose-800">{stats.occupiedSlots}</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Reserved</span>
              <span className="text-xl font-extrabold text-amber-800">{stats.reservedSlots}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Maintenance</span>
              <span className="text-xl font-extrabold text-slate-700">{stats.maintenanceSlots}</span>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-purple-700 block">Active Parked</span>
              <span className="text-xl font-extrabold text-purple-800">{stats.activeParkings}</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-blue-700 block">Today's Rev</span>
              <span className="text-xl font-extrabold text-blue-800">৳{stats.todayRevenue}</span>
            </div>
            <div className="bg-slate-900 text-white rounded-xl p-3 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Bookings</span>
              <span className="text-xl font-extrabold text-emerald-400">{stats.todayBookings}</span>
            </div>
          </div>
        )}
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto text-xs font-bold">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: TrendingUp },
          { id: 'entry', label: 'Vehicle Entry Gate', icon: Car },
          { id: 'exit', label: 'Vehicle Exit Gate', icon: Lock },
          { id: 'slots', label: 'Slot Management', icon: Layers },
          { id: 'bookings', label: 'Bookings List', icon: Calendar },
          { id: 'customers', label: 'Customers', icon: Users },
          { id: 'rates', label: 'Rate Chart', icon: DollarSign },
          { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
          { id: 'settings', label: 'System Settings', icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`pb-3 px-3.5 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === t.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && reports && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Gross Revenue
              </span>
              <span className="text-3xl font-extrabold text-slate-900">
                ৳{reports.totalRevenue}
              </span>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                <span>Initial Bookings: ৳{reports.initialRevenue}</span>
                <span className="text-rose-600 font-semibold">Overstay Extra: ৳{reports.extraRevenue}</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Completed Checkouts
              </span>
              <span className="text-3xl font-extrabold text-slate-900">
                {reports.completedBookings}
              </span>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                Out of {reports.totalBookings} total reservations processed
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Facility Occupancy
              </span>
              <span className="text-3xl font-extrabold text-indigo-600">
                {slots.length > 0 ? Math.round((stats?.occupiedSlots || 0) / slots.length * 100) : 0}%
              </span>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                {stats?.occupiedSlots} active vehicles currently parked
              </div>
            </div>
          </div>

          {/* Quick Gate Launchpads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setActiveTab('entry')}
              className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md cursor-pointer hover:scale-[1.01] transition"
            >
              <Car className="w-8 h-8 text-blue-300 mb-3" />
              <h3 className="text-lg font-bold">Vehicle Entry Gate Barrier</h3>
              <p className="text-xs text-blue-200 mt-1 mb-4">
                Scan customer Booking ID, verify initial payment, and open gate to mark vehicle PARKED.
              </p>
              <span className="text-xs font-bold inline-flex items-center gap-1 text-white bg-blue-600/80 px-3 py-1.5 rounded-lg">
                Open Entry Terminal →
              </span>
            </div>

            <div
              onClick={() => setActiveTab('exit')}
              className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md cursor-pointer hover:scale-[1.01] transition"
            >
              <Lock className="w-8 h-8 text-amber-400 mb-3" />
              <h3 className="text-lg font-bold">Vehicle Exit & Overstay Gate</h3>
              <p className="text-xs text-slate-300 mt-1 mb-4">
                Check return time, calculate overdue minutes, collect extra-time fees, and release vehicle.
              </p>
              <span className="text-xs font-bold inline-flex items-center gap-1 text-white bg-amber-600 px-3 py-1.5 rounded-lg">
                Open Exit Terminal →
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VEHICLE ENTRY GATE */}
      {activeTab === 'entry' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl mx-auto space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Vehicle Entry Gate Terminal</h2>
              <p className="text-xs text-slate-500">
                Verify customer booking and payment before raising the gate barrier.
              </p>
            </div>
          </div>

          <form onSubmit={handleVerifyEntry} className="flex gap-2">
            <input
              type="text"
              required
              value={entryQuery}
              onChange={(e) => setEntryQuery(e.target.value)}
              placeholder="Enter Booking ID (e.g. BK-2026-...), Parking ID, or Plate"
              className="flex-1 text-xs font-mono font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-blue-600"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              Verify & Approve Entry
            </button>
          </form>

          {entryError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{entryError}</span>
            </div>
          )}

          {entryResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs space-y-3 font-mono">
              <div className="flex items-center gap-2 text-emerald-800 font-bold font-sans text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{entryResult.message}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700 pt-2 border-t border-emerald-200">
                <div>
                  <span className="text-slate-500 font-sans block">Booking ID:</span>
                  <span className="font-bold">{entryResult.booking?.booking_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans block">Assigned Slot:</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {entryResult.booking?.slot_number}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans block">Vehicle Plate:</span>
                  <span className="font-bold">{entryResult.booking?.vehicle_number}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans block">Payment Status:</span>
                  <span className="font-bold text-emerald-600">PAID & CONFIRMED</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VEHICLE EXIT GATE */}
      {activeTab === 'exit' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl mx-auto space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Vehicle Exit & Overstay Terminal</h2>
              <p className="text-xs text-slate-500">
                Enforces the strict rule: NO PAYMENT = NO VEHICLE RELEASE!
              </p>
            </div>
          </div>

          <form onSubmit={handleLookupExit} className="flex gap-2">
            <input
              type="text"
              required
              value={exitQuery}
              onChange={(e) => setExitQuery(e.target.value)}
              placeholder="Enter Booking ID (e.g. BK-2026-...) or Vehicle Plate"
              className="flex-1 text-xs font-mono font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-indigo-600"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              Calculate Exit Billing
            </button>
          </form>

          {exitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{exitError}</span>
            </div>
          )}

          {exitResult && (
            <div className="space-y-4">
              {exitResult.outstandingAmount > 0 ? (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3 text-rose-900">
                  <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-sm block">
                      GATE BARRIER LOCKED: EXTRA PAYMENT REQUIRED!
                    </span>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Vehicle overstayed by {exitResult.overstayMinutes} minutes. Staff MUST collect{' '}
                      <span className="font-bold font-mono">৳{exitResult.outstandingAmount}</span> before
                      releasing vehicle.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-sm block">
                      Cleared for Vehicle Release
                    </span>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Zero outstanding balance. Gate may now be opened safely.
                    </p>
                  </div>
                </div>
              )}

              {/* Grid info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Booking ID:</span>
                  <span className="font-bold">{exitResult.booking.booking_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Vehicle:</span>
                  <span className="font-bold">{exitResult.booking.vehicle_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Slot:</span>
                  <span className="font-bold text-emerald-700">{exitResult.booking.slot_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Overstay:</span>
                  <span className="font-bold text-rose-600">{exitResult.overstayMinutes} Mins</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-sans font-bold text-sm">
                  <span>Outstanding Fee:</span>
                  <span className={exitResult.outstandingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                    ৳{exitResult.outstandingAmount}
                  </span>
                </div>
              </div>

              {/* Staff Action Buttons */}
              <div className="flex gap-2">
                {exitResult.outstandingAmount > 0 ? (
                  <button
                    id="staff-collect-extra-btn"
                    onClick={handlePayExtraAtGate}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" /> Collect ৳{exitResult.outstandingAmount} (Cash / POS)
                  </button>
                ) : (
                  <button
                    id="staff-release-vehicle-btn"
                    onClick={handleReleaseVehicleAtGate}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" /> Release Vehicle & Open Barrier
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SLOT MANAGEMENT */}
      {activeTab === 'slots' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">All Parking Slots ({slots.length})</h3>
            <button
              id="admin-add-slot-btn"
              onClick={() => setShowAddSlotModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Slot
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Slot Number</th>
                  <th className="p-3.5">Area / Zone</th>
                  <th className="p-3.5">Allowed Vehicle</th>
                  <th className="p-3.5">Current Status</th>
                  <th className="p-3.5">Current Booking</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slots.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="p-3.5 font-mono font-bold text-slate-900 text-sm">{s.slot_number}</td>
                    <td className="p-3.5 text-slate-600">{s.area}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {s.vehicle_type}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={s.status}
                        onChange={(e) => handleUpdateSlotStatus(s.id, e.target.value as SlotStatus)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-md border focus:outline-hidden cursor-pointer ${
                          s.status === 'Available'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : s.status === 'Occupied'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : s.status === 'Reserved'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="Available">Available</option>
                        <option value="Reserved">Reserved</option>
                        <option value="Occupied">Occupied</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {s.current_booking_id || '—'}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteSlot(s.id)}
                        className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition cursor-pointer"
                        title="Delete slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ALL BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Booking ID</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Vehicle</th>
                <th className="p-3.5">Slot</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Initial TXN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70">
                  <td className="p-3.5 font-mono font-bold text-blue-700">{b.booking_id}</td>
                  <td className="p-3.5 font-medium text-slate-800">
                    {b.customer_name} <span className="text-[10px] text-slate-400 font-mono">({b.customer_id})</span>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-slate-900">{b.vehicle_number}</td>
                  <td className="p-3.5 font-mono text-slate-700">{b.slot_number}</td>
                  <td className="p-3.5 text-slate-600">{b.paid_duration}m</td>
                  <td className="p-3.5 font-bold text-slate-900">৳{b.total_amount}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'Parked'
                          ? 'bg-purple-100 text-purple-800'
                          : b.status === 'Extra Payment Required'
                          ? 'bg-rose-100 text-rose-800 animate-pulse'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-500">{b.initial_transaction_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 6: CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Permanent Parking ID</th>
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Email / Phone</th>
                <th className="p-3.5">Registered Vehicles</th>
                <th className="p-3.5">Total Bookings</th>
                <th className="p-3.5">Active Parking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70">
                  <td className="p-3.5 font-mono font-extrabold text-blue-700 text-sm">{c.customer_id}</td>
                  <td className="p-3.5 font-bold text-slate-900">{c.name}</td>
                  <td className="p-3.5 text-slate-500">
                    <div>{c.email}</div>
                    <div className="text-[11px]">{c.phone}</div>
                  </td>
                  <td className="p-3.5">
                    {c.vehicles.map((v: any) => (
                      <span
                        key={v.id}
                        className="inline-block mr-1.5 mb-1 px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-bold text-slate-800"
                      >
                        {v.registration_number}
                      </span>
                    ))}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">{c.bookingCount}</td>
                  <td className="p-3.5">
                    {c.activeBooking ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        Slot {c.activeBooking.slot_number}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 7: RATE MANAGEMENT */}
      {activeTab === 'rates' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl mx-auto space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Configured Parking Rates</h3>
          <p className="text-xs text-slate-500">
            Edit the rate per 30-minute block for each vehicle category.
          </p>

          <div className="space-y-3">
            {rates.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{r.vehicle_type}</span>
                  <span className="text-xs text-slate-500">Duration Block: {r.duration_unit} Minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-600">৳</span>
                  <input
                    type="number"
                    defaultValue={r.price}
                    onBlur={(e) => handleUpdateRate(r.id, Number(e.target.value))}
                    className="w-20 text-xs font-bold px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-blue-600"
                  />
                  <span className="text-xs text-slate-500">per 30m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: SYSTEM SETTINGS & DEMO CONTROLS */}
      {activeTab === 'settings' && settings && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">System Facility Configuration</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              General parking facility parameters and demo database maintenance.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Facility Name</label>
              <input
                type="text"
                defaultValue={settings.facility_name}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Grace Period (Minutes)</label>
              <input
                type="number"
                defaultValue={settings.grace_period_minutes}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Currency Symbol</label>
              <input
                type="text"
                defaultValue={settings.currency_symbol}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200">
            <h4 className="text-xs font-bold text-rose-700 mb-1">Demo Database Maintenance</h4>
            <p className="text-xs text-slate-500 mb-3">
              Reset all active bookings, slots, and customers back to the initial pre-seeded state.
            </p>
            <button
              onClick={handleResetDb}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Reset Database to Initial Demo State
            </button>
          </div>
        </div>
      )}

      {/* Modal: Add New Slot */}
      {showAddSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Add New Parking Slot</h3>
              <button
                onClick={() => setShowAddSlotModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Slot Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A-15 or D-01"
                  value={newSlotNumber}
                  onChange={(e) => setNewSlotNumber(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Area / Zone *
                </label>
                <input
                  type="text"
                  required
                  value={newSlotArea}
                  onChange={(e) => setNewSlotArea(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Allowed Vehicle Type *
                </label>
                <select
                  value={newSlotType}
                  onChange={(e) => setNewSlotType(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
                >
                  <option value="Car">Car</option>
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="SUV">SUV</option>
                  <option value="Van">Van</option>
                  <option value="All">All Vehicles</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Create Parking Slot
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
