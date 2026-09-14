import React, { useState } from 'react';
import { X, Lock, Mail, Phone, MapPin, User as UserIcon, Car, Shield, Sparkles } from 'lucide-react';
import { User, Vehicle } from '../types.ts';
import { api } from '../lib/api.ts';

interface Props {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: User, vehicles: Vehicle[]) => void;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login inputs
  const [identifier, setIdentifier] = useState<string>('john@example.com');
  const [loginPassword, setLoginPassword] = useState<string>('customer123');

  // Register inputs
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regAddress, setRegAddress] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regPlate, setRegPlate] = useState<string>('');
  const [regType, setRegType] = useState<string>('Car');
  const [regModel, setRegModel] = useState<string>('');
  const [regColor, setRegColor] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredIdNotice, setRegisteredIdNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login(identifier, loginPassword);
      onSuccess(res.user, res.vehicles);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your Parking ID/Email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        address: regAddress,
        password: regPassword,
        registration_number: regPlate,
        vehicle_type: regType,
        model: regModel,
        color: regColor,
      });

      setRegisteredIdNotice(res.user.customer_id);
      setTimeout(() => {
        onSuccess(res.user, res.vehicles);
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (role: 'customer' | 'admin') => {
    if (role === 'customer') {
      setIdentifier('PM-10245');
      setLoginPassword('customer123');
    } else {
      setIdentifier('admin@smartparking.com');
      setLoginPassword('admin123');
    }
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div id="auth-modal-card" className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
        {/* Header Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            id="tab-login-btn"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-3.5 text-xs font-bold transition cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Customer / Staff Login
          </button>
          <button
            id="tab-register-btn"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-3.5 text-xs font-bold transition cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Create Permanent ID
          </button>
          <button
            onClick={onClose}
            className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* Success Notice for Permanent ID */}
        {registeredIdNotice && (
          <div className="mx-6 mt-4 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-center space-y-1">
            <span className="text-xs font-bold">Account Created Successfully!</span>
            <p className="text-xs text-emerald-700">Your Permanent Parking ID is:</p>
            <span className="text-lg font-mono font-extrabold text-emerald-800 tracking-wider">
              {registeredIdNotice}
            </span>
          </div>
        )}

        <div className="p-6">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Parking ID or Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. PM-10245 or john@example.com"
                    className="w-full text-xs font-medium pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full text-xs font-medium pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <button
                id="submit-login-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Signing In...' : 'Log In to SmartPark'}
              </button>

              {/* 1-Click Demo Credentials Pill */}
              <div className="pt-4 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                  Quick Fill Demo Credentials:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('customer')}
                    className="p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg text-left text-[11px] transition cursor-pointer"
                  >
                    <span className="font-bold text-slate-900 block">John Doe (Customer)</span>
                    <span className="text-slate-500 font-mono">ID: PM-10245</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin')}
                    className="p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg text-left text-[11px] transition cursor-pointer"
                  >
                    <span className="font-bold text-indigo-700 block">System Admin</span>
                    <span className="text-slate-500">Full privileges</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="017xxxxxxxx"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Home / Office Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Banani, Dhaka"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-blue-600"
                />
              </div>

              {/* Primary Vehicle Information (Required by Specification Section 4) */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-blue-900 block flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-blue-600" /> Primary Vehicle Details
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                      Plate Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="DHAKA-METRO-GA-123456"
                      value={regPlate}
                      onChange={(e) => setRegPlate(e.target.value)}
                      className="w-full text-xs font-mono font-bold px-2 py-1 bg-white border border-slate-300 rounded-md focus:outline-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                      Vehicle Type *
                    </label>
                    <select
                      value={regType}
                      onChange={(e) => setRegType(e.target.value)}
                      className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded-md focus:outline-blue-600"
                    >
                      <option value="Car">Car</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="SUV">SUV</option>
                      <option value="Van">Van</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                      Model / Make
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Premio 2021"
                      value={regModel}
                      onChange={(e) => setRegModel(e.target.value)}
                      className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded-md focus:outline-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                      Color
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Silver"
                      value={regColor}
                      onChange={(e) => setRegColor(e.target.value)}
                      className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded-md focus:outline-blue-600"
                    />
                  </div>
                </div>
              </div>

              <button
                id="submit-register-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Creating Profile...' : 'Register & Generate Parking ID'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
