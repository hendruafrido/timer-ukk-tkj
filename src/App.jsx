import React, { useState, useEffect, useCallback } from 'react';
import { Timer as TimerIcon, Settings, Monitor, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import TimerCard from './components/TimerCard';
import { supabase } from './lib/supabase'; // Pastikan file ini sudah ada
import { DEFAULT_TIME } from './data/students';

export default function App() {
  const isMonitorMode =
    new URLSearchParams(window.location.search).get('view') === 'monitor';

  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // State Utama
  const [waitingList, setWaitingList] = useState([]);
  const [activeSlots, setActiveSlots] = useState(
    () =>
      JSON.parse(localStorage.getItem('activeSlots')) || [
        null,
        null,
        null,
        null,
      ],
  );
  const [finishedStudents, setFinishedStudents] = useState(
    () => JSON.parse(localStorage.getItem('finishedStudents')) || [],
  );
  const [timerStates, setTimerStates] = useState(
    () => JSON.parse(localStorage.getItem('timerStates')) || {},
  );

  // 1. Fungsi Ambil Data dari Supabase
  const fetchStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      // Filter: Hanya tampilkan siswa yang tidak sedang aktif atau sudah selesai
      const activeIds = activeSlots.filter((s) => s !== null).map((s) => s.id);
      const finishedIds = finishedStudents.map((s) => s.id);

      const filteredWaiting = data.filter(
        (s) => !activeIds.includes(s.id) && !finishedIds.includes(s.id),
      );

      setWaitingList(filteredWaiting);
    } catch (error) {
      console.error('Gagal memuat data Supabase:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeSlots, finishedStudents]);

  // 2. Load data pertama kali & Sinkronisasi antar Tab
  useEffect(() => {
    fetchStudents();

    const handleSync = () => {
      setActiveSlots(
        JSON.parse(localStorage.getItem('activeSlots')) || [
          null,
          null,
          null,
          null,
        ],
      );
      setFinishedStudents(
        JSON.parse(localStorage.getItem('finishedStudents')) || [],
      );
      setTimerStates(JSON.parse(localStorage.getItem('timerStates')) || {});
    };

    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Simpan Perubahan ke LocalStorage (Untuk Sinkronisasi Admin -> Monitor)
  useEffect(() => {
    localStorage.setItem('activeSlots', JSON.stringify(activeSlots));
    localStorage.setItem('finishedStudents', JSON.stringify(finishedStudents));
    localStorage.setItem('timerStates', JSON.stringify(timerStates));
    localStorage.setItem('waitingList', JSON.stringify(waitingList));
  }, [activeSlots, finishedStudents, timerStates, waitingList]);

  // --- Handlers ---

  const syncTimerState = (id, state) => {
    setTimerStates((prev) => ({ ...prev, [id]: state }));
  };

  const startFromQueue = (studentId) => {
    if (isMonitorMode) return;
    const emptyIdx = activeSlots.findIndex((s) => s === null);
    if (emptyIdx === -1) return alert('Slot Penuh!');

    const student = waitingList.find((s) => s.id === studentId);
    const newActive = [...activeSlots];
    newActive[emptyIdx] = student;

    setActiveSlots(newActive);
    setWaitingList(waitingList.filter((s) => s.id !== studentId));
    syncTimerState(student.id, {
      isRunning: false,
      startTime: null,
      baseTime: DEFAULT_TIME,
    });
    setSearchQuery('');
  };

  const handleFinish = (student, remaining) => {
    const used = DEFAULT_TIME - remaining;
    setFinishedStudents((prev) =>
      [...prev, { ...student, timeUsed: used }].sort(
        (a, b) => a.timeUsed - b.timeUsed,
      ),
    );
    setActiveSlots(activeSlots.map((s) => (s?.id === student.id ? null : s)));
    const newStates = { ...timerStates };
    delete newStates[student.id];
    setTimerStates(newStates);
  };

  const exportToPDF = () => {
    if (finishedStudents.length === 0) return alert('Belum ada data.');
    const doc = new jsPDF();
    doc.text('LAPORAN UKK - SMK 2 MEI 87', 105, 15, { align: 'center' });
    const rows = finishedStudents.map((s, i) => [
      i + 1,
      s.no_uji,
      s.name,
      Math.floor(s.timeUsed / 60) + 'm',
      s.timeUsed > DEFAULT_TIME ? 'TELAT' : 'OK',
    ]);
    autoTable(doc, {
      startY: 25,
      head: [['No', 'No Ujian', 'Nama', 'Waktu', 'Status']],
      body: rows,
    });
    doc.save('Laporan_UKK.pdf');
  };

  if (isLoading && waitingList.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-indigo-500" size={48} />
          <p className="font-black italic tracking-widest animate-pulse">
            SYNCHRONIZING SUPABASE...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-screen flex flex-col p-4 overflow-hidden ${isMonitorMode ? 'bg-slate-950' : 'bg-slate-100'}`}
    >
      <header className="flex justify-between items-center mb-4 px-4 py-2 bg-white rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <img
            src="/2mei.png"
            alt="Logo"
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-lg font-black italic tracking-tighter leading-none text-slate-800 uppercase">
              {isMonitorMode ? 'MONITORING' : 'ADMIN'} TIMER UKK
            </h1>
            <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-1">
              SMK 2 MEI 87 PRINGSEWU
            </p>
          </div>
        </div>

        {!isMonitorMode && (
          <div className="flex gap-2">
            <button
              onClick={fetchStudents}
              className="p-3 bg-slate-50 text-slate-600 rounded-2xl border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() =>
                window.open(
                  window.location.origin +
                    window.location.pathname +
                    '?view=monitor',
                  '_blank',
                )
              }
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-amber-100"
            >
              <Monitor size={16} /> MONITOR
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-3 bg-slate-100 rounded-2xl border border-slate-200"
            >
              <Settings size={20} className="text-slate-600" />
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-hidden">
        <div className="xl:col-span-2 grid grid-cols-2 grid-rows-2 gap-6 h-full">
          {activeSlots.map((s, i) => (
            <TimerCard
              key={s ? s.id : `empty-${i}`}
              student={s}
              onFinish={handleFinish}
              onSyncState={syncTimerState}
              savedState={s ? timerStates[s.id] : null}
              defaultTime={DEFAULT_TIME}
              isReadOnly={isMonitorMode}
            />
          ))}
        </div>
        <div className="h-full overflow-hidden">
          <Sidebar
            finishedStudents={finishedStudents}
            waitingList={waitingList}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onStart={startFromQueue}
            isReadOnly={isMonitorMode}
          />
        </div>
      </main>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onExport={exportToPDF}
          onReset={() => {
            if (
              confirm(
                'Hapus semua data sesi? Data di Supabase tidak akan terhapus.',
              )
            ) {
              localStorage.clear();
              window.location.reload();
            }
          }}
        />
      )}
    </div>
  );
}
