import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Car,
  CreditCard,
  ShieldAlert,
  Smartphone,
  Check,
  Lock,
  Unlock,
} from 'lucide-react';
import { ExitCalculationResult, PaymentMethod, Booking } from '../types.ts';
import { api } from '../lib/api.ts';

interface Props {
  isOpen: boolean;
  prefillBookingId?: string;
  onClose: () => void;
  onCheckoutComplete: (booking: Booking) => void;
}

export const VehicleCheckoutModal: React.FC<Props> = ({
  isOpen,
  prefillBookingId,
  onClose,
  onCheckoutComplete,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(prefillBookingId || '');
  const [calcResult, setCalcResult] = useState<ExitCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Extra payment state
  const [showPaymentFlow, setShowPaymentFlow] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bKash');
  const [walletPhone, setWalletPhone] = useState<string>('01700112233');
  const [isPayingExtra, setIsPayingExtra] = useState<boolean>(false);

  // Release vehicle state
  const [isReleasing, setIsReleasing] = useState<boolean>(false);
  const [releaseSuccess, setReleaseSuccess] = useState<boolean>(false);
  const [releasedBooking, setReleasedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (prefillBookingId) {
      setSearchQuery(prefillBookingId);
      performLookup(prefillBookingId);
    }
  }, [prefillBookingId]);

  if (!isOpen) return null;

  const performLookup = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) return;
    setIsLoading(true);
    setError(null);
    setCalcResult(null);
    setShowPaymentFlow(false);
    setReleaseSuccess(false);

    try {
      const res = await api.calculateExit(q);
      setCalcResult(res);
    } catch (err: any) {
      setError(err.message || 'No booking found matching this ID.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayExtra = async () => {
    if (!calcResult) return;
    setIsPayingExtra(true);
    setError(null);

    try {
      const res = await api.payExtraTime({
        bookingId: calcResult.booking.booking_id,
        paymentMethod,
        amountToPay: calcResult.outstandingAmount,
      });

      // Re-calculate exit to update status and unlock release
      const updatedCalc = await api.calculateExit(calcResult.booking.booking_id);
      setCalcResult(updatedCalc);
      setShowPaymentFlow(false);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to process extra time payment.');
    } finally {
      setIsPayingExtra(false);
    }
  };

  const handleReleaseVehicle = async () => {
    if (!calcResult) return;
    setIsReleasing(true);
    setError(null);

    try {
      const res = await api.releaseVehicle(calcResult.booking.booking_id);
      setReleaseSuccess(true);
      setReleasedBooking(res.booking);
      onCheckoutComplete(res.booking);

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
      });
    } catch (err: any) {
      setError(err.message || 'Vehicle release blocked!');
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <div id="checkout-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div id="checkout-modal-card" className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Car className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Vehicle Return & Exit Gate</h3>
              <p className="text-xs text-slate-500">
                Verify booking ID, calculate overstay, and release vehicle.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              performLookup(searchQuery);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Booking ID (e.g. BK-2026-...) or Plate Number"
                className="w-full text-xs font-mono font-medium pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-blue-600 shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Lookup Booking'}
            </button>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {releaseSuccess && releasedBooking ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-slate-900">Vehicle Released Successfully!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Slot <span className="font-mono font-bold text-slate-900">{releasedBooking.slot_number}</span> has been marked AVAILABLE.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-left space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking ID:</span>
                  <span className="font-bold">{releasedBooking.booking_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle:</span>
                  <span className="font-bold">{releasedBooking.vehicle_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-600">COMPLETED & RELEASED</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Close Gate
              </button>
            </div>
          ) : calcResult ? (
            <div className="space-y-5">
              {/* Overstay Warning / Release Banner */}
              {calcResult.outstandingAmount > 0 ? (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3 text-rose-900">
                  <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-sm block">
                      VEHICLE RELEASE STRICTLY BLOCKED!
                    </span>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Parking duration was exceeded by{' '}
                      <span className="font-bold">{calcResult.overstayMinutes} minutes</span>. An
                      outstanding payment of{' '}
                      <span className="font-bold font-mono">৳{calcResult.outstandingAmount}</span> MUST
                      be paid before the gate barrier opens.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900">
                  <Unlock className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-sm block">
                      Cleared for Vehicle Release
                    </span>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      {calcResult.overstayMinutes === 0
                        ? 'Returned within paid duration. No extra fee required.'
                        : 'All outstanding overstay charges have been settled.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Booking Details Grid */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3 font-mono">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-sans">Booking ID:</span>
                  <span className="font-bold text-blue-700">{calcResult.booking.booking_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Customer:</span>
                  <span className="font-bold text-slate-800">
                    {calcResult.booking.customer_name} ({calcResult.booking.customer_id})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Vehicle Plate:</span>
                  <span className="font-bold text-slate-900">{calcResult.booking.vehicle_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Slot:</span>
                  <span className="font-bold text-emerald-700">
                    {calcResult.booking.slot_number} ({calcResult.booking.slot_area})
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 font-sans block">Paid Duration:</span>
                    <span className="font-bold text-slate-800">
                      {calcResult.paidDurationMinutes} Mins
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans block">Overstay Time:</span>
                    <span
                      className={`font-bold ${
                        calcResult.overstayMinutes > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {calcResult.overstayMinutes} Mins
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans block">Initial Paid:</span>
                    <span className="font-bold text-slate-800">
                      ৳{calcResult.booking.base_amount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans block">Extra Charge:</span>
                    <span className="font-bold text-rose-600">৳{calcResult.extraCharge}</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold font-sans">
                  <span className="text-slate-900">Outstanding Balance:</span>
                  <span
                    className={
                      calcResult.outstandingAmount > 0 ? 'text-rose-600 font-mono text-base' : 'text-emerald-600'
                    }
                  >
                    ৳{calcResult.outstandingAmount}
                  </span>
                </div>
              </div>

              {/* Extra Payment Gateway Form (if overstayed and unpaid) */}
              {showPaymentFlow ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">
                      Pay Outstanding Balance: ৳{calcResult.outstandingAmount}
                    </span>
                    <button
                      onClick={() => setShowPaymentFlow(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(['bKash', 'Nagad', 'Credit Card'] as PaymentMethod[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`p-2 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                          paymentMethod === m
                            ? 'border-amber-600 bg-amber-100 text-amber-900'
                            : 'border-slate-300 bg-white text-slate-600'
                        }`}
                      >
                        {m === 'bKash' || m === 'Nagad' ? (
                          <Smartphone className="w-3.5 h-3.5" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5" />
                        )}
                        {m}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Account / Card Reference:
                    </label>
                    <input
                      type="text"
                      value={walletPhone}
                      onChange={(e) => setWalletPhone(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <button
                    disabled={isPayingExtra}
                    onClick={handlePayExtra}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {isPayingExtra
                      ? 'Confirming Payment...'
                      : `Pay ৳${calcResult.outstandingAmount} & Clear Block`}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {calcResult.outstandingAmount > 0 && (
                    <button
                      id="pay-outstanding-btn"
                      onClick={() => setShowPaymentFlow(true)}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" /> Pay Outstanding Fee (৳
                      {calcResult.outstandingAmount})
                    </button>
                  )}

                  <button
                    id="release-vehicle-btn"
                    disabled={!calcResult.canRelease || isReleasing}
                    onClick={handleReleaseVehicle}
                    className={`w-full py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                      calcResult.canRelease
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {calcResult.canRelease ? (
                      <>
                        <Unlock className="w-4 h-4" /> Release Vehicle & Free Slot
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" /> Release Blocked (Payment Outstanding)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Enter your Booking ID above to verify and release vehicle.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
