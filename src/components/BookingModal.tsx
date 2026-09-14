import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Car,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  QrCode,
  Printer,
  ArrowRight,
  Sparkles,
  Smartphone,
  Wallet,
} from 'lucide-react';
import {
  ParkingSlot,
  Vehicle,
  User,
  Booking,
  Payment,
  PaymentMethod,
} from '../types.ts';
import { api } from '../lib/api.ts';

interface Props {
  isOpen: boolean;
  slot: ParkingSlot | null;
  currentUser: User | null;
  vehicles: Vehicle[];
  onClose: () => void;
  onBookingComplete: (booking: Booking, payment: Payment) => void;
  onRequireLogin: () => void;
  onVehicleAdded: (vehicle: Vehicle) => void;
}

export const BookingModal: React.FC<Props> = ({
  isOpen,
  slot,
  currentUser,
  vehicles,
  onClose,
  onBookingComplete,
  onRequireLogin,
  onVehicleAdded,
}) => {
  // Steps: 1 = Selection & Duration, 2 = Summary (NOT PAID), 3 = Payment Gateway, 4 = Confirmation (PAID)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  // New vehicle inline form
  const [showAddVehicle, setShowAddVehicle] = useState<boolean>(false);
  const [newReg, setNewReg] = useState<string>('');
  const [newType, setNewType] = useState<string>('Car');
  const [newModel, setNewModel] = useState<string>('');
  const [newColor, setNewColor] = useState<string>('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bKash');
  const [walletPhone, setWalletPhone] = useState<string>('01700112233');
  const [walletPin, setWalletPin] = useState<string>('1234');
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);

  // Pricing calculation
  const [priceDetails, setPriceDetails] = useState<{
    ratePerUnit: number;
    units: number;
    total: number;
  }>({ ratePerUnit: 10, units: 2, total: 20 });

  // Processing & result
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [confirmedPayment, setConfirmedPayment] = useState<Payment | null>(null);

  // Initialize selected vehicle
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [vehicles]);

  // Recalculate price whenever duration or vehicle changes
  useEffect(() => {
    if (!slot) return;
    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
    const vType = vehicle ? vehicle.vehicle_type : slot.vehicle_type !== 'All' ? slot.vehicle_type : 'Car';
    const effectiveDuration = isCustom ? Number(customMinutes) || 30 : durationMinutes;

    api
      .calculateRate(vType, effectiveDuration)
      .then((res) => {
        setPriceDetails({
          ratePerUnit: res.ratePerUnit,
          units: res.units,
          total: res.total,
        });
      })
      .catch((e) => console.error(e));
  }, [selectedVehicleId, durationMinutes, customMinutes, isCustom, slot, vehicles]);

  if (!isOpen || !slot) return null;

  const activeDuration = isCustom ? Number(customMinutes) || 30 : durationMinutes;
  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const handleAddNewVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReg.trim()) return;
    try {
      const v = await api.addVehicle({
        registration_number: newReg.trim(),
        vehicle_type: newType,
        model: newModel || 'Standard',
        color: newColor || 'Silver',
      });
      onVehicleAdded(v);
      setSelectedVehicleId(v.id);
      setShowAddVehicle(false);
      setNewReg('');
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleProceedToSummary = () => {
    setErrorMessage(null);
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    if (!selectedVehicleId) {
      setErrorMessage('Please select or add a vehicle for this booking.');
      return;
    }
    if (activeDuration <= 0) {
      setErrorMessage('Parking duration must be greater than 0 minutes.');
      return;
    }
    setStep(2);
  };

  const handleProceedToPayment = () => {
    setErrorMessage(null);
    setStep(3);
  };

  const handleExecutePaymentAndBook = async () => {
    if (!currentUser) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await api.createAndPayBooking({
        vehicleId: selectedVehicleId,
        slotId: slot.id,
        durationMinutes: activeDuration,
        paymentMethod,
        cardNumberOrPhone: walletPhone,
        simulatePaymentFailure: simulateFailure,
      });

      setConfirmedBooking(res.booking);
      setConfirmedPayment(res.payment);
      setStep(4);
      onBookingComplete(res.booking, res.payment);

      // Celebration Confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing failed. Slot was not booked.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startTimeEst = new Date();
  const endTimeEst = new Date(startTimeEst.getTime() + activeDuration * 60 * 1000);

  return (
    <div id="booking-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div id="booking-modal-card" className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-sm">
              {slot.slot_number}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {step === 1 && 'Select Duration & Vehicle'}
                {step === 2 && 'Booking Summary'}
                {step === 3 && 'Secure Payment'}
                {step === 4 && 'Booking Confirmed!'}
              </h3>
              <p className="text-xs text-slate-500">{slot.area}</p>
            </div>
          </div>

          <button
            id="close-booking-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-blue-600 h-1.5 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">
          {/* STEP 1: VEHICLE & DURATION */}
          {step === 1 && (
            <div className="space-y-6">
              {!currentUser && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="text-xs text-amber-900">
                    <p className="font-bold">You are not logged in</p>
                    <p className="text-amber-700 mt-0.5">
                      Log in with your permanent Parking ID or Register to save your vehicle.
                    </p>
                  </div>
                  <button
                    onClick={onRequireLogin}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    Log In / Register
                  </button>
                </div>
              )}

              {/* Vehicle Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-blue-600" /> Select Vehicle
                  </label>
                  {currentUser && (
                    <button
                      onClick={() => setShowAddVehicle(!showAddVehicle)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      {showAddVehicle ? 'Select Existing' : '+ Add New Vehicle'}
                    </button>
                  )}
                </div>

                {showAddVehicle ? (
                  <form onSubmit={handleAddNewVehicle} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Registration Plate *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. DHAKA-METRO-GA-123456"
                          value={newReg}
                          onChange={(e) => setNewReg(e.target.value)}
                          className="w-full text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Vehicle Type *
                        </label>
                        <select
                          value={newType}
                          onChange={(e) => setNewType(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
                        >
                          <option value="Car">Car</option>
                          <option value="Motorcycle">Motorcycle</option>
                          <option value="SUV">SUV</option>
                          <option value="Van">Van</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Model
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Corolla / Premio"
                          value={newModel}
                          onChange={(e) => setNewModel(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Color
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Pearl White"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Save & Use Vehicle
                    </button>
                  </form>
                ) : (
                  <div className="space-y-2">
                    {vehicles.length > 0 ? (
                      vehicles.map((v) => (
                        <label
                          key={v.id}
                          className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition ${
                            selectedVehicleId === v.id
                              ? 'border-blue-600 bg-blue-50/50'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="selectedVehicle"
                              checked={selectedVehicleId === v.id}
                              onChange={() => setSelectedVehicleId(v.id)}
                              className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <div>
                              <span className="font-mono font-bold text-slate-900 text-xs block">
                                {v.registration_number}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {v.vehicle_type} • {v.model} ({v.color})
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {v.vehicle_type}
                          </span>
                        </label>
                      ))
                    ) : (
                      <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                        No registered vehicles found. Please add your vehicle above.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Duration Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" /> Select Parking Duration
                </label>

                <div className="grid grid-cols-3 gap-2.5">
                  {[30, 60, 90, 120, 180].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setDurationMinutes(mins);
                        setIsCustom(false);
                      }}
                      className={`py-2.5 px-3 rounded-xl border-2 font-semibold text-xs transition cursor-pointer ${
                        !isCustom && durationMinutes === mins
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                      }`}
                    >
                      {mins} Minutes
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsCustom(true)}
                    className={`py-2.5 px-3 rounded-xl border-2 font-semibold text-xs transition cursor-pointer ${
                      isCustom
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                    }`}
                  >
                    Custom Mins
                  </button>
                </div>

                {isCustom && (
                  <div className="mt-2.5">
                    <input
                      type="number"
                      min={10}
                      max={1440}
                      step={15}
                      placeholder="Enter minutes (e.g. 45, 150)"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                    />
                  </div>
                )}
              </div>

              {/* Price Calculation Banner */}
              <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Calculated Parking Fee</span>
                  <span className="text-xs text-slate-300">
                    ৳{priceDetails.ratePerUnit} per 30 mins × {priceDetails.units} unit(s)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-emerald-400">
                    ৳{priceDetails.total}
                  </span>
                </div>
              </div>

              <button
                id="continue-to-summary-btn"
                onClick={handleProceedToSummary}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                Review Booking Summary <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: BOOKING SUMMARY (Strict Section 9 Specification) */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                {/* Customer */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Customer
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Name:</span>{' '}
                      <span className="font-semibold text-slate-900">{currentUser?.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Parking ID:</span>{' '}
                      <span className="font-mono font-bold text-blue-700">{currentUser?.customer_id}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200"></div>

                {/* Vehicle */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Vehicle
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Vehicle Number:</span>{' '}
                      <span className="font-mono font-bold text-slate-900">
                        {currentVehicle?.registration_number}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Vehicle Type:</span>{' '}
                      <span className="font-semibold text-slate-900">{currentVehicle?.vehicle_type}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200"></div>

                {/* Parking */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Parking Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Slot:</span>{' '}
                      <span className="font-mono font-bold text-slate-900">{slot.slot_number}</span> ({slot.area})
                    </div>
                    <div>
                      <span className="text-slate-500">Duration:</span>{' '}
                      <span className="font-semibold text-slate-900">{activeDuration} Minutes</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Start Time:</span>{' '}
                      <span className="font-medium text-slate-700">
                        {startTimeEst.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Expected End:</span>{' '}
                      <span className="font-medium text-slate-700">
                        {endTimeEst.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200"></div>

                {/* Payment */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Payment Breakdown
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Parking Fee:</span>
                      <span className="font-medium text-slate-800">৳{priceDetails.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Extra Fee:</span>
                      <span className="font-medium text-slate-800">৳0</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200">
                      <span className="text-slate-900">Total:</span>
                      <span className="text-blue-700">৳{priceDetails.total}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Status Warning */}
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-900">Payment Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-white uppercase tracking-wider">
                    NOT PAID
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  id="proceed-to-payment-btn"
                  type="button"
                  onClick={handleProceedToPayment}
                  className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  Proceed to Payment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT GATEWAY SIMULATOR (PAYMENT MUST HAPPEN BEFORE BOOKING) */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Rule #1: Payment First → Slot Booking Second</span>
                  <p className="mt-0.5 text-blue-700">
                    Your slot will be reserved immediately upon successful transaction verification.
                  </p>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bKash', 'Nagad', 'Rocket', 'Credit Card', 'Debit Card'] as PaymentMethod[]).map(
                    (m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`p-2.5 rounded-xl border-2 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          paymentMethod === m
                            ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {m === 'bKash' || m === 'Nagad' || m === 'Rocket' ? (
                          <Smartphone className="w-3.5 h-3.5 text-pink-600" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                        {m}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Wallet / Card Simulation Input */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card'
                      ? 'Card Number'
                      : `${paymentMethod} Mobile Number`}
                  </label>
                  <input
                    type="text"
                    value={walletPhone}
                    onChange={(e) => setWalletPhone(e.target.value)}
                    className="w-full text-xs font-mono font-medium px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card'
                      ? 'CVV / PIN'
                      : `${paymentMethod} PIN`}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={walletPin}
                    onChange={(e) => setWalletPin(e.target.value)}
                    className="w-full text-xs font-mono font-medium px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
                  />
                </div>

                {/* Simulate Failure Test Toggle */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Test Failure Simulation:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simulateFailure}
                      onChange={(e) => setSimulateFailure(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-rose-700 font-medium text-[11px]">Simulate Bank Decline</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setStep(2)}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  id="pay-and-confirm-btn"
                  type="button"
                  disabled={isProcessing}
                  onClick={handleExecutePaymentAndBook}
                  className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    'Processing Payment...'
                  ) : (
                    <>
                      Pay ৳{priceDetails.total} & Confirm Booking <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PAYMENT & BOOKING CONFIRMATION (Section 11) */}
          {step === 4 && confirmedBooking && confirmedPayment && (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Parking Booking Confirmed!</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Payment verified. Present this digital ticket or Booking ID at the parking gate.
                </p>
              </div>

              {/* Digital Pass Ticket Card */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 text-left font-mono text-xs space-y-2.5 relative">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 text-[11px]">Booking ID:</span>
                  <span className="font-extrabold text-blue-700 text-sm">
                    {confirmedBooking.booking_id}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-bold text-slate-800">{confirmedPayment.transaction_id}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Customer ID:</span>
                  <span className="font-bold text-slate-800">{confirmedBooking.customer_id}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Vehicle Plate:</span>
                  <span className="font-bold text-slate-900">{confirmedBooking.vehicle_number}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Assigned Slot:</span>
                  <span className="font-bold text-emerald-700 text-sm">{confirmedBooking.slot_number}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Paid Duration:</span>
                  <span className="font-bold text-slate-800">{confirmedBooking.paid_duration} Minutes</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-bold text-emerald-600">৳{confirmedPayment.amount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                    {confirmedPayment.payment_status}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-[11px]">
                  <span className="text-slate-500">Expected End:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(confirmedBooking.expected_end_time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  id="print-pass-btn"
                  onClick={() => window.print()}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save Pass
                </button>
                <button
                  id="finish-booking-btn"
                  onClick={onClose}
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
