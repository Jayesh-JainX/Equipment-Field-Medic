'use client';

import React from 'react';
import { ShieldAlert, Mic, Sun, Moon, User as UserIcon, Package, LogOut, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenGear: () => void;
  onOpenHistory: () => void;
  stealthMode: boolean;
  onToggleStealth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenGear,
  onOpenHistory,
  stealthMode,
  onToggleStealth
}) => {
  const { user, logout, gearKit } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/40 border border-emerald-400/30">
            <ShieldAlert className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-wider text-slate-100 uppercase">
                Field<span className="text-emerald-400">Medic</span>
              </h1>
              <span className="hidden bg-emerald-950/80 text-emerald-400 border border-emerald-700/50 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase lg:flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" /> HF Llama-4 Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Hands-Free Wilderness Equipment AI Diagnostics</p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Gear Locker Button */}
          <button
            onClick={onOpenGear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 text-xs transition-colors"
            title="Manage pack gear toolkit"
          >
            <Package className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Pack Toolkit</span>
            <span className="bg-slate-800 text-emerald-400 text-[11px] font-bold px-1.5 py-0.2 rounded-full">
              {gearKit.length}
            </span>
          </button>

          {/* Saved History Button */}
          <button
            onClick={onOpenHistory}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 text-xs transition-colors"
          >
            <Mic className="w-4 h-4 text-cyan-400" />
            <span>Saved Logs</span>
          </button>

          {/* Battery Saver / Stealth Dim Screen Toggle */}
          <button
            onClick={onToggleStealth}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              stealthMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-900/40'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-amber-500/40'
            }`}
            title="Toggle Stealth Dim mode to save device battery"
          >
            {stealthMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden xs:inline">{stealthMode ? 'Stealth ACTIVE' : 'Battery Dim'}</span>
          </button>

          {/* User Auth Info / Button */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-medium text-slate-200">{user.name}</span>
                <span className="text-[10px] text-slate-400">{user.email}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-800/40 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-950/50 transition-colors"
            >
              <UserIcon className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
