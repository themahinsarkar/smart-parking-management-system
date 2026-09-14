import React, { useState, useEffect } from 'react';
import { Clock, FastForward, RotateCcw, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api.ts';

interface Props {
  onTimeChange: () => void;
}

export const TimeTravelBanner: React.FC<Props> = ({ onTimeChange }) => {
  const [serverTime, setServerTime] = useState<string>('');
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);

  const fetchTime = async () => {
    try {
      const res = await api.getServerTime();
      setServerTime(res.serverTime);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTime();
    const interval = setInterval(fetchTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvance = async (mins: number) => {
    setLoading(true);
    try {
      await api.simulateTime(mins);
      setIsSimulated(true);
      await fetchTime();
      onTimeChange();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await api.resetTime();
      setIsSimulated(false);
      await fetchTime();
      onTimeChange();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formattedTime = serverTime
    ? new Date(serverTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--';
  const formattedDate = serverTime
    ? new Date(serverTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div id="time-travel-container" className="bg-slate-900 text-slate-100 border-b border-slate-800 text-xs py-1.5 px-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-medium text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Server Clock:
          </span>
          <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-white font-semibold">
            {formattedTime}
          </span>
          <span className="text-slate-400 hidden sm:inline">({formattedDate})</span>

          {isSimulated && (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px]">
              <ShieldAlert className="w-3 h-3" /> Time Simulated
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            id="toggle-simulator-btn"
            onClick={() => setExpanded(!expanded)}
            className="text-slate-300 hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            {expanded ? 'Hide Simulator' : 'Test Overstay Simulator'}
          </button>

          {expanded && (
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded border border-slate-700">
              <span className="text-slate-300 font-medium px-1">Simulate Time:</span>
              <button
                id="sim-30m-btn"
                disabled={loading}
                onClick={() => handleAdvance(35)}
                className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition cursor-pointer flex items-center gap-1"
                title="Advance 35 minutes"
              >
                <FastForward className="w-3 h-3" /> +35m
              </button>
              <button
                id="sim-75m-btn"
                disabled={loading}
                onClick={() => handleAdvance(75)}
                className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium transition cursor-pointer flex items-center gap-1"
                title="Advance 75 minutes (causes overstay)"
              >
                <FastForward className="w-3 h-3" /> +75m (Overstay)
              </button>
              <button
                id="sim-120m-btn"
                disabled={loading}
                onClick={() => handleAdvance(120)}
                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium transition cursor-pointer flex items-center gap-1"
                title="Advance 120 minutes"
              >
                <FastForward className="w-3 h-3" /> +2h
              </button>
              <button
                id="reset-time-btn"
                disabled={loading}
                onClick={handleReset}
                className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-medium transition cursor-pointer flex items-center gap-1"
                title="Reset to Real Clock"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
