'use client';

import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { AuthModal } from '../components/AuthModal';
import { CameraMedic } from '../components/CameraMedic';
import { VoiceRepairAssistant } from '../components/VoiceRepairAssistant';
import { GearLocker } from '../components/GearLocker';
import { RepairHistory } from '../components/RepairHistory';
import { OfflineGuide } from '../components/OfflineGuide';
import { RepairProtocol } from '../lib/api';
import { Shield, Sparkles, Radio, Zap, HeartPulse, BatteryCharging } from 'lucide-react';

export default function Home() {
  const [activeProtocol, setActiveProtocol] = useState<RepairProtocol | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isGearOpen, setIsGearOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [stealthMode, setStealthMode] = useState<boolean>(false);

  return (
    <div className={`min-h-screen flex flex-col transition-all ${stealthMode ? 'stealth-dim' : ''}`}>
      
      {/* Header Navbar */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenGear={() => setIsGearOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        stealthMode={stealthMode}
        onToggleStealth={() => setStealthMode(!stealthMode)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:py-8 space-y-8">
        
        {/* Stealth Banner Alert when active */}
        {stealthMode && (
          <div className="p-3 bg-amber-500 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <BatteryCharging className="w-5 h-5" />
              <span>STEALTH BATTERY SAVER MODE ACTIVE — Screen brightness dimmed for long backcountry repairs.</span>
            </div>
            <button
              onClick={() => setStealthMode(false)}
              className="underline hover:text-slate-900"
            >
              Disable
            </button>
          </div>
        )}

        {/* Hero Banner when no active protocol */}
        {!activeProtocol && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/60 border border-slate-800 p-6 sm:p-8 shadow-2xl">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase mb-4">
                <HeartPulse className="w-4 h-4 text-emerald-400 animate-pulse" />
                Hands-Free Equipment Field Medic
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-100 uppercase tracking-tight leading-tight mb-3">
                Keep your hands on your gear, <span className="text-emerald-400">not your screen</span>.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Snap a photo of your broken tent pole, boot sole, or jacket tear. Our open-weight vision AI retrieves an emergency field-fix protocol, and a voice assistant dictates repair steps hands-free.
              </p>

              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <Zap className="w-4 h-4 text-emerald-400" /> Model: meta-llama/Llama-4-Scout
                </span>
                <span className="flex items-center gap-1.5 text-slate-200">
                  <Radio className="w-4 h-4 text-cyan-400" /> Voice Commands: "Next step"
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Diagnosis & Voice Assistant Core Section */}
        {activeProtocol ? (
          <VoiceRepairAssistant
            protocol={activeProtocol}
            onReset={() => setActiveProtocol(null)}
            stealthMode={stealthMode}
            onToggleStealth={() => setStealthMode(!stealthMode)}
          />
        ) : (
          <CameraMedic
            onDiagnosisComplete={(protocol) => setActiveProtocol(protocol)}
          />
        )}

        {/* Offline Emergency Field Cheatsheets */}
        <OfflineGuide
          onSelectQuickRepair={(protocol) => setActiveProtocol(protocol)}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between flex-wrap gap-4">
          <p>© 2026 Equipment Field Medic • Hugging Face Llama-4 Scout & MongoDB Powered</p>
          <p className="font-mono text-[11px] text-slate-600">Built for Hacktoberfest & Extreme Wilderness Survival</p>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <GearLocker
        isOpen={isGearOpen}
        onClose={() => setIsGearOpen(false)}
      />

      <RepairHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectProtocol={(protocol) => setActiveProtocol(protocol)}
      />

    </div>
  );
}
