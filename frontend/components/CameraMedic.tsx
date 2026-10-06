'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, AlertTriangle, Sparkles, PackageCheck, Zap, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI, RepairProtocol } from '../lib/api';

interface CameraMedicProps {
  onDiagnosisComplete: (protocol: RepairProtocol) => void;
}

const PRESET_GEAR = [
  { name: 'Tent Pole Break', desc: 'Aluminum/fiberglass pole snapped under wind stress', icon: '🏕️' },
  { name: 'Boot Sole Separation', desc: 'Rubber tread delaminated from leather upper', icon: '🥾' },
  { name: 'Jacket Baffle Rip', desc: 'Ripstop fabric tear leaking down feathers', icon: '🧥' },
  { name: 'Backpack Strap Snap', desc: 'Polymer buckle or webbing strap snapped', icon: '🎒' },
  { name: 'Water Bladder Leak', desc: 'Hydration reservoir puncture or bite valve tear', icon: '💧' },
];

export const CameraMedic: React.FC<CameraMedicProps> = ({ onDiagnosisComplete }) => {
  const { gearKit } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [equipmentName, setEquipmentName] = useState<string>('');
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_GEAR[0]) => {
    setEquipmentName(preset.name);
    setIssueDescription(preset.desc);
  };

  const handleDiagnose = async () => {
    if (!equipmentName.trim() && !issueDescription.trim() && !selectedImage) {
      setError('Please provide a photo, gear name, or description of the damage.');
      return;
    }

    setError('');
    setIsAnalyzing(true);

    const availableKitNames = gearKit.map(item => item.name);

    try {
      const response = await fetchAPI('/diagnose', {
        method: 'POST',
        body: JSON.stringify({
          imageBase64: selectedImage,
          equipmentName: equipmentName || 'Outdoor Equipment',
          issueDescription: issueDescription || 'Field damage requiring urgent fix',
          userKit: availableKitNames
        })
      });

      if (response.success && response.protocol) {
        onDiagnosisComplete(response.protocol);
      } else {
        throw new Error('Could not generate repair protocol');
      }
    } catch (err: any) {
      console.error('Diagnosis error:', err);
      setError(err.message || 'Diagnosis failed. Check backend connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
      
      {/* Background Subtle Radar Glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Camera className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
              Gear Break Diagnostics
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Snap a photo or describe the failure. Hugging Face Llama-4 Scout matches your pack tools to emergency protocols.
          </p>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Quick Field Failure Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {PRESET_GEAR.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                equipmentName === preset.name
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-lg mb-1">{preset.icon}</div>
              <div className="text-xs font-bold truncate">{preset.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Image Capture Zone */}
      <div className="mb-5">
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`relative h-44 sm:h-52 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
            selectedImage
              ? 'border-emerald-500/50 bg-slate-950/80'
              : 'border-slate-700 hover:border-emerald-500/60 bg-slate-950/50 hover:bg-slate-950'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
          />

          {selectedImage ? (
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <img
                src={selectedImage}
                alt="Damaged Gear Capture"
                className="max-h-full max-w-full object-contain rounded-lg shadow-md"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(null);
                }}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/90 text-slate-300 hover:text-red-400 border border-slate-700"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-center px-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                Snap Photo or Upload Break Image
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Tap to launch camera or select image from field gallery
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Equipment Name</label>
          <input
            type="text"
            placeholder="e.g., MSR Elixir Tent Pole, Salomon Boots"
            value={equipmentName}
            onChange={(e) => setEquipmentName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Issue / Damage Description</label>
          <input
            type="text"
            placeholder="e.g., Pole cracked longitudinally 3 inches from tip"
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Active Pack Toolkit Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <PackageCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-300">Pack Toolkit Items Attached:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {gearKit.slice(0, 4).map((item, idx) => (
            <span key={idx} className="bg-slate-900 text-slate-300 border border-slate-700 text-[10px] px-2 py-0.5 rounded-md">
              {item.name}
            </span>
          ))}
          {gearKit.length > 4 && (
            <span className="text-[10px] text-emerald-400 font-bold px-1.5">
              +{gearKit.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleDiagnose}
        disabled={isAnalyzing}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/80 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        {isAnalyzing ? (
          <>
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            <span>Analyzing Gear Break with Llama-4 Scout AI...</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5 fill-slate-950" />
            <span>Generate Hands-Free Field Repair Protocol</span>
          </>
        )}
      </button>

    </div>
  );
};
