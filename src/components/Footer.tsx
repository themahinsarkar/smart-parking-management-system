import React from 'react';
import { Car, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 bg-white border-t border-slate-200 py-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Car className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-800">SmartPark Management System</span>
          <span>•</span>
          <span>Dhaka Central Smart Park</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span>Rule: Payment First → Booking Second</span>
          <span>•</span>
          <span>Automated Overstay Calculation</span>
        </div>
      </div>
    </footer>
  );
};
