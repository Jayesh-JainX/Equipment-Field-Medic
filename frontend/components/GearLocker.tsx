'use client';

import React, { useState } from 'react';
import { X, Package, Plus, Trash2, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface GearLockerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GearLocker: React.FC<GearLockerProps> = ({ isOpen, onClose }) => {
  const { gearKit, addGearItem, removeGearItem } = useAuth();
  const [newItemName, setNewItemName] = useState<string>('');
  const [category, setCategory] = useState<string>('Repair');

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    await addGearItem(newItemName.trim(), category);
    setNewItemName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-700/60">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
              Pack Repair Toolkit
            </h2>
            <p className="text-xs text-slate-400">
              The AI uses these items to customize your emergency step-by-step repairs.
            </p>
          </div>
        </div>

        {/* Add New Item Form */}
        <form onSubmit={handleAdd} className="mb-5 flex gap-2">
          <input
            type="text"
            placeholder="Add tool (e.g., Safety Pins, Zip Ties, Super Glue)"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="Repair">Repair</option>
            <option value="Cordage">Cordage</option>
            <option value="Adhesive">Adhesive</option>
            <option value="Hardware">Hardware</option>
            <option value="Tools">Tools</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-emerald-950/60"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>

        {/* Gear List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {gearKit.map((item, idx) => (
            <div
              key={item.id || item._id || idx}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-slate-200">{item.name}</span>
                  <span className="ml-2 text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full uppercase font-mono">
                    {item.category}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeGearItem((item.id || item._id) as string)}
                className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                title="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Keep your toolkit accurate so the vision model only suggests tools you carry.</span>
        </div>

      </div>
    </div>
  );
};
