import React from 'react';
import {
  Car,
  Layers,
  CreditCard,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Search,
  ChevronRight,
  Shield,
  Smartphone,
} from 'lucide-react';
import { ParkingSlot, ParkingRate, DashboardStats } from '../types.ts';

interface Props {
  slots: ParkingSlot[];
  rates: ParkingRate[];
  stats: DashboardStats | null;
  onBookSlot: () => void;
  onOpenExitModal: () => void;
  onNavigateToSlots: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const LandingPage: React.FC<Props> = ({
  slots,
  rates,
  stats,
  onBookSlot,
  onOpenExitModal,
  onNavigateToSlots,
  onOpenLogin,
  onOpenRegister,
}) => {
  const availableSlots = slots.filter((s) => s.status === 'Available').length;
  const occupiedSlots = slots.filter((s) => s.status === 'Occupied').length;

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white overflow-hidden p-8 sm:p-14 border border-slate-800 shadow-2xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Smart Parking System
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Find. Book. Park. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Pay.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            A fully automated smart parking solution. Reserve parking bays with guaranteed confirmation, receive your permanent digital Parking ID, and enjoy contactless gate access with automated time calculations.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="hero-book-slot-btn"
              onClick={onBookSlot}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4" /> Book a Parking Slot Now
            </button>
            <button
              id="hero-return-btn"
              onClick={onOpenExitModal}
              className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm border border-white/15 transition flex items-center gap-2 cursor-pointer"
            >
              <Car className="w-4 h-4" /> Return / Exit Vehicle
            </button>
          </div>

          {/* Live Availability Pill Bar */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {availableSlots} Slots Available Now
            </span>
            <span>•</span>
            <span className="text-rose-400 font-bold">{occupiedSlots} Vehicles Parked</span>
            <span>•</span>
            <span>Starting from ৳10 / 30 mins</span>
          </div>
        </div>
      </section>

      {/* How it Works 4-Step Process (Strict Specification Section 1) */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900">How SmartPark Works</h2>
          <p className="text-xs text-slate-500 mt-1">
            Built on the core principle: Payment First → Slot Booking Second → Parking → Vehicle Release.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-sm flex items-center justify-center font-mono mb-3">
                1
              </span>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Create Parking ID</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Register once to receive your permanent Parking ID (e.g. PM-10245) and save your vehicles.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-sm flex items-center justify-center font-mono mb-3">
                2
              </span>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Select Slot & Time</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pick an available green slot across Zone A, B, or C and choose your intended duration in minutes.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-sm flex items-center justify-center font-mono mb-3">
                3
              </span>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Pay & Confirm</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pay via bKash, Nagad, or Card before slot reservation. Receive your unique Booking ID.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-sm flex items-center justify-center font-mono mb-3">
                4
              </span>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Park & Release</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Check in at the gate. Settle any extra overstay time before release to complete parking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Rate Chart Preview */}
      <section className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Standard Parking Rate Schedule</h3>
            <p className="text-xs text-slate-500">
              Clear, transparent per-block pricing. Additional duration is billed in 30-minute intervals.
            </p>
          </div>
          <button
            onClick={onNavigateToSlots}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            Explore Live Slot Map <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {rates.map((r) => (
            <div key={r.id} className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-xs font-bold text-slate-700 block mb-1">{r.vehicle_type}</span>
              <span className="text-2xl font-extrabold text-slate-900 block">৳{r.price}</span>
              <span className="text-[11px] text-slate-400">per {r.duration_unit} mins</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
