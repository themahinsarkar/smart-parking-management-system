import React, { useState, useEffect } from 'react';
import {
  Clock,
  Car,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { Booking } from '../types.ts';

interface Props {
  booking: Booking;
  onReturnVehicle: (bookingId: string) => void;
  onViewTicket?: (booking: Booking) => void;
}

export const ActiveBookingCard: React.FC<Props> = ({
  booking,
  onReturnVehicle,
  onViewTicket,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number;
    seconds: number;
    isOverstay: boolean;
    overstayMins: number;
  }>({
    minutes: 0,
    seconds: 0,
    isOverstay: false,
    overstayMins: 0,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = Date.now();
      const end = new Date(booking.expected_end_time).getTime();
      const diffMs = end - now;

      if (diffMs > 0) {
        const minutes = Math.floor(diffMs / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        setTimeLeft({ minutes, seconds, isOverstay: false, overstayMins: 0 });
      } else {
        const overstayMs = Math.abs(diffMs);
        const overstayMins = Math.ceil(overstayMs / 60000);
        setTimeLeft({
          minutes: 0,
          seconds: 0,
          isOverstay: true,
          overstayMins,
        });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [booking.expected_end_time]);

  return (
    <div
      id={`active-booking-card-${booking.booking_id}`}
      className={`rounded-2xl border-2 p-5 transition-all shadow-sm ${
        timeLeft.isOverstay
          ? 'bg-rose-50/70 border-rose-300'
          : 'bg-white border-blue-200 hover:border-blue-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-mono font-extrabold flex items-center justify-center text-base shadow-sm">
            {booking.slot_number}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm font-mono">
                {booking.booking_id}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  booking.status === 'Parked'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {booking.status === 'Parked' ? 'Vehicle Parked' : 'Reserved (Awaiting Entry)'}
              </span>
            </div>
            <p className="text-xs text-slate-500">{booking.slot_area}</p>
          </div>
        </div>

        {/* Live Timer Indicator */}
        <div className="flex items-center gap-2 sm:text-right">
          {timeLeft.isOverstay ? (
            <div className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-4 h-4" />
              Overstay: +{timeLeft.overstayMins} min(s)
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              {timeLeft.minutes}m {timeLeft.seconds}s left
            </div>
          )}
        </div>
      </div>

      {/* Info details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">Vehicle:</span>
          <span className="font-mono font-bold text-slate-900">{booking.vehicle_number}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Paid Duration:</span>
          <span className="font-bold text-slate-800">{booking.paid_duration} Minutes</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Expected End:</span>
          <span className="font-medium text-slate-800">
            {new Date(booking.expected_end_time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Payment Status:</span>
          <span className="font-bold text-emerald-600">PAID (৳{booking.base_amount})</span>
        </div>
      </div>

      {/* Overstay alert if overstayed */}
      {timeLeft.isOverstay && (
        <div className="p-2.5 bg-rose-100 text-rose-900 rounded-xl text-xs mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            Your booked time has elapsed. You must clear the additional time payment before release.
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <button
          id={`return-vehicle-btn-${booking.booking_id}`}
          onClick={() => onReturnVehicle(booking.booking_id)}
          className={`flex-1 py-2 rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
            timeLeft.isOverstay
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          <Car className="w-3.5 h-3.5" /> Return & Collect Vehicle <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
