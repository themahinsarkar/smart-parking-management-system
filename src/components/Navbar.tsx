import React from 'react';
import {
  Car,
  Shield,
  User as UserIcon,
  LogOut,
  MapPin,
  CalendarCheck,
  CreditCard,
  Layers,
  ArrowRightLeft,
  ChevronDown,
} from 'lucide-react';
import { User, Vehicle } from '../types.ts';

interface Props {
  currentUser: User | null;
  vehicles: Vehicle[];
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onDemoSwitch: (role: 'admin' | 'customer') => void;
}

export const Navbar: React.FC<Props> = ({
  currentUser,
  currentView,
  onNavigate,
  onOpenAuth,
  onLogout,
  onDemoSwitch,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div
            id="brand-logo"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 block leading-tight">
                Smart<span className="text-blue-600">Park</span>
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Management System
              </span>
            </div>
          </div>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <button
              id="nav-home-btn"
              onClick={() => onNavigate('landing')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer ${
                currentView === 'landing'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Home
            </button>
            <button
              id="nav-slots-btn"
              onClick={() => onNavigate('slots')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                currentView === 'slots'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              Live Slots
            </button>
            <button
              id="nav-rates-btn"
              onClick={() => onNavigate('rates')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                currentView === 'rates'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Rates & Rules
            </button>

            {currentUser && currentUser.role === 'customer' && (
              <button
                id="nav-dashboard-btn"
                onClick={() => onNavigate('customer-dashboard')}
                className={`px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'customer-dashboard'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <CalendarCheck className="w-4 h-4" />
                My Dashboard
              </button>
            )}

            {currentUser && (currentUser.role === 'admin' || currentUser.role === 'staff') && (
              <button
                id="nav-admin-btn"
                onClick={() => onNavigate('admin-dashboard')}
                className={`px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'admin-dashboard'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'hover:bg-slate-100 hover:text-slate-900 text-indigo-600'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </button>
            )}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Demo Quick Switcher Badge */}
            <div className="hidden lg:flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs">
              <button
                id="quick-demo-customer-btn"
                onClick={() => onDemoSwitch('customer')}
                className={`px-2 py-1 rounded-md transition cursor-pointer font-medium ${
                  currentUser?.role === 'customer'
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Log in as Customer John Doe (PM-10245)"
              >
                Demo Customer
              </button>
              <button
                id="quick-demo-admin-btn"
                onClick={() => onDemoSwitch('admin')}
                className={`px-2 py-1 rounded-md transition cursor-pointer font-medium ${
                  currentUser?.role === 'admin'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Log in as System Administrator"
              >
                Demo Admin
              </button>
            </div>

            {currentUser ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="text-xs font-semibold text-slate-800 block leading-tight truncate max-w-[110px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] font-mono text-blue-600 font-bold block leading-tight">
                      {currentUser.customer_id}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div
                    id="user-dropdown-menu"
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">{currentUser.email}</p>
                      <p className="text-xs font-mono font-bold text-blue-600 mt-0.5">
                        ID: {currentUser.customer_id}
                      </p>
                    </div>

                    {currentUser.role === 'customer' ? (
                      <button
                        id="dropdown-customer-dash"
                        onClick={() => {
                          onNavigate('customer-dashboard');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" /> My Profile & Parking
                      </button>
                    ) : (
                      <button
                        id="dropdown-admin-dash"
                        onClick={() => {
                          onNavigate('admin-dashboard');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-indigo-500" /> Admin Console
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      id="dropdown-logout-btn"
                      onClick={() => {
                        onLogout();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Log In
                </button>
                <button
                  id="nav-register-btn"
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
