import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, CheckCircle, Edit2, Lock } from 'lucide-react';

const TimerCard = ({
  student,
  onFinish,
  onSyncState,
  savedState,
  defaultTime,
  isReadOnly,
}) => {
  const [timeLeft, setTimeLeft] = useState(defaultTime);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (savedState) {
      if (savedState.isRunning && savedState.startTime) {
        const elapsed = Math.floor((Date.now() - savedState.startTime) / 1000);
        setTimeLeft(savedState.baseTime - elapsed);
        setIsRunning(true);
      } else {
        setTimeLeft(savedState.baseTime);
        setIsRunning(false);
      }
    }
  }, [savedState]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const format = (s) => {
    const isOver = s < 0;
    const abs = Math.abs(s);
    const h = Math.floor(abs / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((abs % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const sec = (abs % 60).toString().padStart(2, '0');
    return { h, m, sec, isOver };
  };

  const toggleTimer = () => {
    const nextState = !isRunning;
    setIsRunning(nextState);
    onSyncState(student.id, {
      isRunning: nextState,
      startTime: nextState ? Date.now() : null,
      baseTime: timeLeft,
    });
  };

  if (!student)
    return (
      <div
        className={`rounded-4xl border-2 border-dashed flex items-center justify-center h-full min-h-60 ${isReadOnly ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/50'}`}
      >
        <span className="text-[10px] font-black opacity-20 uppercase tracking-[0.4em] text-slate-400 italic">
          Slot Kosong
        </span>
      </div>
    );

  const t = format(timeLeft);

  return (
    <div
      className={`rounded-[3rem] shadow-xl border p-7 flex flex-col justify-between h-full transition-all ${isReadOnly ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100'}`}
    >
      {/* Profil Siswa & Logo Sekolah */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 overflow-hidden">
          {/* Foto Siswa dengan Fallback jika URL salah atau kosong */}
          <div className="w-20 h-20 rounded-[1.8rem] overflow-hidden border-4 border-slate-50 shadow-md shrink-0 bg-slate-100">
            <img
              src={student.photo_url || student.photo}
              className="w-full h-full object-cover"
              alt={student.name}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/150?text=Siswa';
              }}
            />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h3 className="font-black text-lg uppercase leading-tight line-clamp-1">
              {student.name}
            </h3>
            {/* Mendukung nama kolom no_uji dari Supabase */}
            <p className="text-indigo-500 font-bold text-xs mt-1 bg-indigo-50 px-3 py-1 rounded-full w-fit border border-indigo-100">
              {student.no_uji || student.noUji}
            </p>
          </div>
        </div>
        {/* Logo SMK 2 MEI 87 di Ujung Kanan */}
        <img
          src="/2mei.png"
          alt="Logo SMK 2 MEI"
          className="w-12 h-12 object-contain opacity-90"
        />
      </div>

      {/* Tampilan Timer: Rounded Sempurna */}
      <div
        className={`w-full rounded-[2.5rem] py-10 my-4 flex flex-col items-center justify-center shadow-inner ${
          t.isOver
            ? 'bg-red-600 text-white animate-pulse'
            : isReadOnly
              ? 'bg-slate-800 text-white'
              : 'bg-slate-900 text-white'
        }`}
      >
        <div className="text-7xl font-mono font-black italic tracking-tighter flex items-baseline">
          {t.isOver && '-'}
          {t.h}:{t.m}
          <span className="text-3xl opacity-40 ml-1">:{t.sec}</span>
        </div>
        {!isReadOnly && (
          <span className="text-[9px] font-bold uppercase tracking-widest mt-2 opacity-30 flex items-center gap-2">
            <Edit2 size={10} /> Klik untuk edit waktu
          </span>
        )}
      </div>

      {/* Tombol Kontrol */}
      {isReadOnly ? (
        <div className="py-4 bg-slate-800/50 rounded-3xl flex items-center justify-center gap-2 opacity-40 italic text-[10px] font-bold uppercase tracking-widest">
          <Lock size={14} /> Sesi Sedang Berlangsung
        </div>
      ) : (
        <div className="flex gap-4">
          <button
            onClick={toggleTimer}
            className={`flex-3 py-5 rounded-3xl font-black text-xs tracking-widest transition-all active:scale-95 ${
              isRunning
                ? 'bg-slate-100 text-slate-500 border border-slate-200'
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
            }`}
          >
            {isRunning ? 'PAUSE SESSION' : 'START SESSION'}
          </button>

          <button
            onClick={() => onFinish(student, timeLeft)}
            className="flex-1 bg-emerald-500 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-100 active:scale-95 transition-all"
          >
            <CheckCircle size={32} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TimerCard;
