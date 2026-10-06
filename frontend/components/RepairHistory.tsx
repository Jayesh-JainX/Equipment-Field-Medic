'use client';

import React, { useState, useEffect } from 'react';
import { X, History, Trash2, Calendar, ShieldCheck, ChevronRight } from 'lucide-react';
import { fetchAPI, SavedRepairLog, RepairProtocol } from '../lib/api';

interface RepairHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProtocol: (protocol: RepairProtocol) => void;
}

export const RepairHistory: React.FC<RepairHistoryProps> = ({
  isOpen,
  onClose,
  onSelectProtocol
}) => {
  const [logs, setLogs] = useState<SavedRepairLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchAPI('/repairs')
        .then(data => setLogs(data || []))
        .catch(err => console.error('History fetch error:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetchAPI(`/repairs/${id}`, { method: 'DELETE' });
      setLogs(prev => prev.filter(log => log._id !== id));
    } catch (err) {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-700/60">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
              Saved Field Repair Logs
            </h2>
            <p className="text-xs text-slate-400">
              Access past emergency protocols saved in your MongoDB account database.
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Loading repair log history...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No saved repair logs yet. Generate a repair diagnosis and click "Save Protocol".
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log._id}
                onClick={() => {
                  onSelectProtocol({
                    equipmentName: log.equipmentName,
                    identifiedMaterial: log.identifiedMaterial,
                    confidenceScore: log.confidenceScore,
                    issueDescription: log.issueDescription,
                    durabilityRating: log.durabilityRating as any,
                    requiredTools: log.requiredTools,
                    steps: log.steps,
                    batteryTips: log.batteryTips || [],
                    voiceIntro: `Loaded saved repair for ${log.equipmentName}`
                  });
                  onClose();
                }}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {log.equipmentName}
                    </span>
                    <span className="text-[10px] bg-slate-900 text-emerald-400 border border-slate-700 font-mono px-2 py-0.5 rounded">
                      {log.identifiedMaterial}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{log.issueDescription}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-cyan-400" />
                      {log.steps?.length || 0} Steps
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(log._id, e)}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
