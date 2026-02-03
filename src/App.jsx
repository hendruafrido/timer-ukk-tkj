import React, { useState, useEffect, useCallback } from 'react';
import { Timer as TimerIcon, Settings, Monitor, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import TimerCard from './components/TimerCard';
import { supabase } from './lib/supabase';
import { DEFAULT_TIME } from './data/students';

export default function App() {
  const isMonitorMode =
    new URLSearchParams(window.location.search).get('view') === 'monitor';

  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // State Utama
  const [waitingList, setWaitingList] = useState([]);
  const [activeSlots, setActiveSlots] = useState([null, null, null, null]);
  const [finishedStudents, setFinishedStudents] = useState(
    () => JSON.parse(localStorage.getItem('finishedStudents')) || [],
  );
  const [timerStates, setTimerStates] = useState({});

  // --- Ambil Data dari Supabase ---

  const fetchActiveSlots = useCallback(async () => {
    const { data, error } = await supabase
      .from('active_slots')
      .select('id, student_id, students(*)')
      .order('id', { ascending: true });

    if (!error && data) {
      const slots = [null, null, null, null];
      data.forEach((item) => {
        if (item.student_id) slots[item.id] = item.students;
      });
      setActiveSlots(slots);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;

      const activeIds = activeSlots.filter((s) => s !== null).map((s) => s.id);
      const finishedIds = finishedStudents.map((s) => s.id);
      const filteredWaiting = data.filter(
        (s) => !activeIds.includes(s.id) && !finishedIds.includes(s.id),
      );

      setWaitingList(filteredWaiting);
    } catch (err) {
      console.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeSlots, finishedStudents]);

  const fetchTimerLogs = useCallback(async () => {
    const { data } = await supabase.from('timer_logs').select('*');
    if (data) {
      const logs = {};
      data.forEach((log) => {
        logs[log.id] = {
          isRunning: log.is_running,
          startTime: log.start_time,
          baseTime: log.base_time,
        };
      });
      setTimerStates(logs);
    }
  }, []);

  // --- Real-time Sync ---
  useEffect(() => {
    fetchActiveSlots();
    fetchStudents();
    fetchTimerLogs();

    const channel = supabase
      .channel('app-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'active_slots' },
        fetchActiveSlots,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'timer_logs' },
        fetchTimerLogs,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActiveSlots, fetchStudents, fetchTimerLogs]);

  // --- Handlers ---

  const syncTimerState = async (id, state) => {
    setTimerStates((prev) => ({ ...prev, [id]: state }));
    await supabase.from('timer_logs').upsert({
      id,
      is_running: state.isRunning,
      start_time: state.startTime,
      base_time: state.baseTime,
      updated_at: new Date(),
    });
  };

  const startFromQueue = async (studentId) => {
    const emptyIdx = activeSlots.findIndex((s) => s === null);
    if (emptyIdx === -1) return alert('Slot Penuh!');
    const student = waitingList.find((s) => s.id === studentId);

    await supabase
      .from('active_slots')
      .update({ student_id: student.id })
      .eq('id', emptyIdx);
    await syncTimerState(student.id, {
      isRunning: false,
      startTime: null,
      baseTime: DEFAULT_TIME,
    });
  };

  const handleFinish = async (student, remaining) => {
    const used = DEFAULT_TIME - remaining;
    setFinishedStudents((prev) =>
      [...prev, { ...student, timeUsed: used }].sort(
        (a, b) => a.timeUsed - b.timeUsed,
      ),
    );
    await supabase
      .from('active_slots')
      .update({ student_id: null })
      .eq('student_id', student.id);
    await supabase.from('timer_logs').delete().eq('id', student.id);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('LAPORAN UKK - SMK 2 MEI 87', 105, 15, { align: 'center' });
    autoTable(doc, {
      startY: 25,
      head: [['No', 'No Ujian', 'Nama', 'Waktu']],
      body: finishedStudents.map((s, i) => [
        i + 1,
        s.no_uji,
        s.name,
        Math.floor(s.timeUsed / 60) + 'm',
      ]),
    });
    doc.save('Laporan_UKK.pdf');
  };

  if (isLoading && waitingList.length === 0)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        Loading...
      </div>
    );

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
          <h1 className="text-lg font-black italic text-slate-800 uppercase leading-none">
            {isMonitorMode ? 'MONITORING' : 'ADMIN'} TIMER UKK
          </h1>
        </div>
        {!isMonitorMode && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                fetchActiveSlots();
                fetchStudents();
              }}
              className="p-3 bg-slate-50 text-slate-600 rounded-2xl border border-slate-200"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() =>
                window.open(window.location.origin + '?view=monitor', '_blank')
              }
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-2xl font-bold text-xs"
            >
              <Monitor size={16} /> MONITOR
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-3 bg-slate-100 rounded-2xl border border-slate-200"
            >
              <Settings size={20} />
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
            localStorage.clear();
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
