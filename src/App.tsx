import React, { useState, useEffect } from 'react';
import {
  User,
  Vehicle,
  ParkingSlot,
  Booking,
  Payment,
  ParkingRate,
  SystemSettings,
  DashboardStats,
} from './types.ts';
import { api, getStoredToken, setStoredToken } from './lib/api.ts';
import { Navbar } from './components/Navbar.tsx';
import { TimeTravelBanner } from './components/TimeTravelBanner.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { ParkingSlotMap } from './components/ParkingSlotMap.tsx';
import { CustomerDashboard } from './components/CustomerDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { RatesPage } from './components/RatesPage.tsx';
import { BookingModal } from './components/BookingModal.tsx';
import { VehicleCheckoutModal } from './components/VehicleCheckoutModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { Footer } from './components/Footer.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [rates, setRates] = useState<ParkingRate[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [currentView, setCurrentView] = useState<string>('landing');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<ParkingSlot | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [prefillBookingId, setPrefillBookingId] = useState<string>('');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Fetch all initial data
  const fetchData = async () => {
    try {
      const [allSlots, allRates, appSettings] = await Promise.all([
        api.getSlots(),
        api.getRates(),
        api.getSettings(),
      ]);
      setSlots(allSlots);
      setRates(allRates);
      setSettings(appSettings);

      // Try fetching current user profile if token exists
      const token = getStoredToken();
      if (token) {
        try {
          const me = await api.getMe();
          setCurrentUser(me.user);
          setVehicles(me.vehicles);
          const [myBookings, myPayments] = await Promise.all([
            api.getBookings(),
            api.getPayments(),
          ]);
          setBookings(myBookings);
          setPayments(myPayments);
        } catch (e) {
          // Token expired or invalid, auto-login as demo customer
          await handleDemoSwitch('customer');
        }
      } else {
        // Auto-login as default Demo Customer (John Doe, PM-10245) for immediate demo-ability
        await handleDemoSwitch('customer');
      }
    } catch (err) {
      console.error('Failed to initialize app data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDemoSwitch = async (role: 'admin' | 'customer') => {
    try {
      const res = await api.demoSwitch(role);
      setCurrentUser(res.user);
      setVehicles(res.vehicles);
      const [myBookings, myPayments] = await Promise.all([
        api.getBookings(),
        api.getPayments(),
      ]);
      setBookings(myBookings);
      setPayments(myPayments);

      if (role === 'admin') {
        setCurrentView('admin-dashboard');
      } else {
        setCurrentView('customer-dashboard');
      }
    } catch (err) {
      console.error('Demo switch failed:', err);
    }
  };

  const handleLogout = () => {
    setStoredToken(null);
    setCurrentUser(null);
    setVehicles([]);
    setBookings([]);
    setPayments([]);
    setCurrentView('landing');
  };

  const handleSlotSelectedFromMap = (slot: ParkingSlot) => {
    setSelectedSlotForBooking(slot);
    setBookingModalOpen(true);
  };

  const handleOpenBooking = () => {
    // Pick first available slot or open slot view
    const firstAvailable = slots.find((s) => s.status === 'Available');
    if (firstAvailable) {
      setSelectedSlotForBooking(firstAvailable);
      setBookingModalOpen(true);
    } else {
      setCurrentView('slots');
    }
  };

  const handleBookingCompleted = (newBooking: Booking, newPayment: Payment) => {
    setBookings((prev) => [newBooking, ...prev]);
    setPayments((prev) => [newPayment, ...prev]);
    // Refresh slots
    api.getSlots().then(setSlots);
  };

  const handleVehicleCheckoutCompleted = (updatedBooking: Booking) => {
    setBookings((prev) =>
      prev.map((b) => (b.booking_id === updatedBooking.booking_id ? updatedBooking : b))
    );
    // Refresh slots
    api.getSlots().then(setSlots);
  };

  const handleReturnVehicle = (bookingId: string) => {
    setPrefillBookingId(bookingId);
    setCheckoutModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-600">Starting Smart Parking System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/50 flex flex-col text-slate-800 antialiased font-sans">
      {/* Time Travel Testing Banner */}
      <TimeTravelBanner
        onTimeChange={() => {
          api.getSlots().then(setSlots);
          if (currentUser) {
            api.getBookings().then(setBookings);
          }
        }}
      />

      {/* Main Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        vehicles={vehicles}
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onDemoSwitch={handleDemoSwitch}
      />

      {/* Main Dynamic View Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {currentView === 'landing' && (
          <LandingPage
            slots={slots}
            rates={rates}
            stats={stats}
            onBookSlot={handleOpenBooking}
            onOpenExitModal={() => handleReturnVehicle('')}
            onNavigateToSlots={() => setCurrentView('slots')}
            onOpenLogin={() => {
              setAuthMode('login');
              setAuthModalOpen(true);
            }}
            onOpenRegister={() => {
              setAuthMode('register');
              setAuthModalOpen(true);
            }}
          />
        )}

        {currentView === 'slots' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  Facility Parking Bays
                </h1>
                <p className="text-xs text-slate-500">
                  Click any green available slot to calculate duration and book with instant payment.
                </p>
              </div>
            </div>
            <ParkingSlotMap
              slots={slots}
              onSelectSlot={handleSlotSelectedFromMap}
              selectedSlotId={selectedSlotForBooking?.id}
              userVehicleType={vehicles[0]?.vehicle_type}
            />
          </div>
        )}

        {currentView === 'rates' && (
          <RatesPage
            rates={rates}
            settings={settings}
            onBookNow={handleOpenBooking}
          />
        )}

        {currentView === 'customer-dashboard' && currentUser && (
          <CustomerDashboard
            currentUser={currentUser}
            vehicles={vehicles}
            bookings={bookings}
            payments={payments}
            onOpenBooking={handleOpenBooking}
            onReturnVehicle={handleReturnVehicle}
            onVehicleAdded={(v) => setVehicles((prev) => [...prev, v])}
          />
        )}

        {currentView === 'admin-dashboard' && currentUser && (
          <AdminDashboard
            onRefreshData={() => {
              api.getSlots().then(setSlots);
              api.getBookings().then(setBookings);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Multi-Step Booking Modal (Payment First -> Slot Confirmation) */}
      <BookingModal
        isOpen={bookingModalOpen}
        slot={selectedSlotForBooking}
        currentUser={currentUser}
        vehicles={vehicles}
        onClose={() => {
          setBookingModalOpen(false);
          setSelectedSlotForBooking(null);
        }}
        onBookingComplete={handleBookingCompleted}
        onRequireLogin={() => {
          setAuthMode('login');
          setAuthModalOpen(true);
        }}
        onVehicleAdded={(v) => setVehicles((prev) => [...prev, v])}
      />

      {/* Vehicle Checkout / Return Modal (Strict No Payment = No Release Rule) */}
      <VehicleCheckoutModal
        isOpen={checkoutModalOpen}
        prefillBookingId={prefillBookingId}
        onClose={() => {
          setCheckoutModalOpen(false);
          setPrefillBookingId('');
        }}
        onCheckoutComplete={handleVehicleCheckoutCompleted}
      />

      {/* Authentication Modal (Permanent Parking ID Generation & Login) */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user, userVehicles) => {
          setCurrentUser(user);
          setVehicles(userVehicles);
          api.getBookings().then(setBookings);
          api.getPayments().then(setPayments);
          if (user.role === 'admin') {
            setCurrentView('admin-dashboard');
          } else {
            setCurrentView('customer-dashboard');
          }
        }}
      />
    </div>
  );
}
