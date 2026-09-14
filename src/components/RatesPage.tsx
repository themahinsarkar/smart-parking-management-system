import React from 'react';
import { CreditCard, Clock, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { ParkingRate, SystemSettings } from '../types.ts';

interface Props {
  rates: ParkingRate[];
  settings: SystemSettings | null;
  onBookNow: () => void;
}

export const RatesPage: React.FC<Props> = ({ rates, settings, onBookNow }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Parking Rates & Overstay Rules
        </h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Transparent billing for all vehicle categories at Dhaka Central Smart Park.
        </p>
      </div>

      {/* Rates Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {rates.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-900 text-base">{r.vehicle_type}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  Active Rate
                </span>
              </div>

              <div className="py-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {settings?.currency_symbol || '৳'}{r.price}
                </span>
                <span className="text-xs text-slate-500 ml-1">/ {r.duration_unit} minutes</span>
              </div>

              <div className="mt-3 text-xs text-slate-500 space-y-1">
                <div>• 1 Hour (60m): {settings?.currency_symbol || '৳'}{r.price * 2}</div>
                <div>• 2 Hours (120m): {settings?.currency_symbol || '৳'}{r.price * 4}</div>
                <div>• Additional time: Rounded to next 30m block</div>
              </div>
            </div>

            <button
              onClick={onBookNow}
              className="mt-5 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Book For {r.vehicle_type}
            </button>
          </div>
        ))}
      </div>

      {/* Policy & Business Rules Box (Mandatory Specifications) */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-indigo-600" /> Key Operating Policies & Business Rules
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600 leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800">1. Payment First → Slot Booking Second</h4>
            <p>
              Slots are only reserved once initial payment is received. No parking bay will be held without completed payment through supported gateways.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-800">2. Automated Overstay Billing</h4>
            <p>
              If your vehicle stays beyond the scheduled expected end time, extra time is calculated automatically based on the vehicle's standard rate per 30 minutes.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-800">3. Strict Gate Release Policy</h4>
            <p>
              The system will <span className="font-bold text-rose-600">STRICTLY NEVER</span> allow vehicle release or gate opening until any outstanding extra-time balance is paid in full.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-800">4. Grace Period ({settings?.grace_period_minutes || 5} Mins)</h4>
            <p>
              A courtesy {settings?.grace_period_minutes || 5}-minute grace period is granted after scheduled end time before overstay charges commence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
