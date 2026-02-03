import React from "react";
import { X, Download, Trash2 } from "lucide-react";

const SettingsModal = ({ onClose, onExport, onReset }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-indigo-600 tracking-tight">
            PENGATURAN
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="space-y-3">
          <button
            onClick={onExport}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Download size={18} /> DOWNLOAD LAPORAN PDF
          </button>
          <button
            onClick={onReset}
            className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition-all active:scale-95"
          >
            <Trash2 size={18} /> RESET SEMUA DATA
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
