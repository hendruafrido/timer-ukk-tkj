import React from "react";
import { Trophy, Users, Search, Play } from "lucide-react";

const Sidebar = ({
  finishedStudents,
  waitingList,
  searchQuery,
  setSearchQuery,
  onStart,
  defaultTime,
}) => {
  // Filter antrean berdasarkan pencarian
  const filteredWaitingList = waitingList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.noUji.includes(searchQuery),
  );

  return (
    <aside className="flex flex-col gap-4 overflow-hidden h-full w-full">
      {/* SECTION SELESAI / RANKING */}
      <section className="bg-slate-900 text-white rounded-3xl p-5 flex-1 flex flex-col overflow-hidden shadow-xl border border-white/10">
        <h2 className="text-xs font-black mb-4 flex items-center gap-2 text-amber-400 uppercase tracking-widest">
          <Trophy size={16} /> Ranking Selesai
        </h2>
        <div className="overflow-y-auto space-y-3 flex-1 pr-1 custom-scrollbar">
          {finishedStudents.map((s, i) => (
            <div
              key={i}
              className="flex justify-between items-center p-3 bg-white/10 border border-white/10 rounded-2xl"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-slate-300">
                  Rank {i + 1}
                </span>
                <span className="truncate w-32 text-sm font-black uppercase tracking-tight">
                  {s.name}
                </span>
              </div>
              <span
                className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${
                  s.timeUsed > defaultTime
                    ? "bg-red-500/20 text-red-400"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {Math.floor(s.timeUsed / 60)}m {s.timeUsed % 60}s
              </span>
            </div>
          ))}
          {finishedStudents.length === 0 && (
            <div className="text-center py-6 opacity-20 flex flex-col items-center">
              <Trophy size={32} className="mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-white">
                Belum ada data
              </p>
            </div>
          )}
        </div>
      </section>

      {/* SECTION ANTREAN */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md flex-[1.8] flex flex-col overflow-hidden">
        <div className="mb-4">
          <h2 className="text-xs font-black flex items-center gap-2 text-indigo-600 uppercase tracking-widest mb-3">
            <Users size={16} /> Antrean ({waitingList.length})
          </h2>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari nama atau No. Ujian..."
              className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-y-auto space-y-2 flex-1 pr-1 custom-scrollbar">
          {filteredWaitingList.map((s) => (
            <div
              key={s.id}
              className="flex justify-between items-center p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 rounded-2xl group transition-all"
            >
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-800 uppercase leading-tight">
                  {s.name}
                </span>
                <span className="text-[10px] text-indigo-500 font-bold tracking-wider">
                  {s.noUji}
                </span>
              </div>
              <button
                onClick={() => onStart(s.id)}
                className="bg-indigo-600 text-white p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-indigo-700 active:scale-90 flex items-center gap-1"
              >
                <span className="text-[10px] font-bold pr-1">START</span>
                <Play size={12} fill="currentColor" />
              </button>
            </div>
          ))}
          {filteredWaitingList.length === 0 && (
            <p className="text-xs text-center text-slate-400 py-8 italic font-medium">
              Siswa tidak ditemukan...
            </p>
          )}
        </div>
      </section>
    </aside>
  );
};

export default Sidebar;
