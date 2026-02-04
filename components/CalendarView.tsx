
import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, Copy } from 'lucide-react';
import { getDaysInMonth, MONTH_NAMES, WEEK_DAYS, formatCurrency, isHolidayOrSunday } from '../utils/calendar';
import { DayLog, PeriodStats } from '../types';
import { useApp } from '../context/AppContext';

interface CalendarViewProps {
  currentDate: Date;
  setCurrentDate: (d: Date) => void;
  logs: Record<string, DayLog>;
  currentMonthStats: PeriodStats;
  onDayClick: (dateStr: string) => void;
  themeClass: string;
  isDiscrete: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
    currentDate, setCurrentDate, logs, currentMonthStats, onDayClick, themeClass, isDiscrete 
}) => {
    
    const { updateUser } = useApp();

    // Swipe logic
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);

    const onTouchStart = (e: React.TouchEvent) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientX;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        touchEnd.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1));
        if (isRightSwipe) setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1));
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1));
            if (e.key === 'ArrowRight') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentDate, setCurrentDate]);

    // Copy previous week logic
    const handleCopyPreviousWeek = () => {
        if (!window.confirm("¿Deseas copiar los horarios y tipos de jornada de la semana pasada a la semana actual? Esto sobrescribirá datos existentes.")) return;

        const today = new Date();
        const startOfCurrentWeek = new Date(today);
        startOfCurrentWeek.setDate(today.getDate() - today.getDay() + 1); // Lunes actual

        const startOfPrevWeek = new Date(startOfCurrentWeek);
        startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7); // Lunes pasado

        const newLogs = { ...logs };
        let copiedCount = 0;

        for (let i = 0; i < 7; i++) {
            const prevDate = new Date(startOfPrevWeek);
            prevDate.setDate(prevDate.getDate() + i);
            const prevDateStr = prevDate.toISOString().split('T')[0];
            
            const targetDate = new Date(startOfCurrentWeek);
            targetDate.setDate(targetDate.getDate() + i);
            const targetDateStr = targetDate.toISOString().split('T')[0];

            if (logs[prevDateStr]) {
                newLogs[targetDateStr] = {
                    ...logs[prevDateStr],
                    date: targetDateStr
                };
                copiedCount++;
            }
        }
        
        if (copiedCount > 0) {
            updateUser(undefined, newLogs);
            alert(`Se copiaron ${copiedCount} registros de la semana anterior.`);
        } else {
            alert("No se encontraron registros en la semana anterior.");
        }
    };

    const year = currentDate.getFullYear();
    const days = getDaysInMonth(currentDate.getMonth(), year);

    return (
        <div className="space-y-8 animate-view">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Neto Acumulado</p>
                <p className="text-3xl font-black text-white">{isDiscrete ? '••••••' : formatCurrency(currentMonthStats.netoFinal)}</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Horas</p>
                <p className="text-3xl font-black text-emerald-400">{currentMonthStats.regHours + currentMonthStats.ext50Hours + currentMonthStats.ext100Hours}h</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Bruto Proyectado</p>
                <p className="text-3xl font-black text-amber-400">{isDiscrete ? '••••••' : formatCurrency(currentMonthStats.bruto)}</p>
              </div>
            </div>

            <div 
              className="bg-slate-900 rounded-[3rem] border border-slate-800 overflow-hidden shadow-2xl touch-pan-y"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h2 className="text-2xl font-black uppercase text-white tracking-tighter select-none">{MONTH_NAMES[currentDate.getMonth()]} {year}</h2>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentDate(new Date(year, currentDate.getMonth()-1, 1))} className="p-3 bg-slate-800 border border-slate-700 rounded-2xl hover:bg-slate-700 transition-colors" title="Mes Anterior"><ChevronLeft size={18}/></button>
                  <button onClick={() => setCurrentDate(new Date(year, currentDate.getMonth()+1, 1))} className="p-3 bg-slate-800 border border-slate-700 rounded-2xl hover:bg-slate-700 transition-colors" title="Mes Siguiente"><ChevronRight size={18}/></button>
                </div>
              </div>
              
              {/* Pattern Action Bar */}
              <div className="bg-slate-950/30 px-4 py-2 flex justify-end">
                  <button onClick={handleCopyPreviousWeek} className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-1 hover:text-white transition-colors">
                      <Copy size={12}/> Copiar Semana Anterior
                  </button>
              </div>

              <div className="grid grid-cols-7 border-b border-slate-800 text-[10px] font-black text-slate-600 uppercase text-center py-4 bg-slate-950/40 select-none">
                {WEEK_DAYS.map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => <div key={i} className="aspect-square bg-slate-950/20 border-r border-b border-slate-800/50" />)}
                {days.map(date => {
                  const mStr = String(date.getMonth() + 1).padStart(2, '0');
                  const dStr = String(date.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${mStr}-${dStr}`;

                  const log = logs[dateStr];
                  const isSpecial = isHolidayOrSunday(date);
                  
                  let badgeColor = themeClass;
                  if (log?.type === 'SICK') badgeColor = 'bg-orange-600';
                  if (log?.type === 'VACATION') badgeColor = 'bg-blue-600';
                  if (log?.type === 'LICENSE') badgeColor = 'bg-purple-600';

                  return (
                    <div key={dateStr} onClick={() => onDayClick(dateStr)} className={`min-h-[100px] border-r border-b border-slate-800/50 p-4 cursor-pointer hover:bg-white/[0.03] transition-all relative group ${isSpecial ? 'bg-red-500/10' : ''}`}>
                      <span className={`text-xs font-bold ${isSpecial ? 'text-red-400' : 'text-slate-600'}`}>{date.getDate()}</span>
                      {log && (
                        <div className="mt-2 space-y-1">
                          <div className={`${badgeColor} text-white text-[8px] font-black px-1.5 py-0.5 rounded-md inline-block`}>
                            {log.type === 'WORK' || log.type === 'HOLIDAY_WORK' ? `${log.regularHours}H` : log.type.substring(0,3)}
                          </div>
                          {log.extraHours > 0 && <div className="bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md block">+{log.extraHours}H</div>}
                          {log.checkIn && log.checkOut && (
                             <div className="flex items-center gap-1 text-[8px] text-slate-500 font-bold mt-1">
                                <Clock size={8} /> {log.checkIn}-{log.checkOut}
                             </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
        </div>
    );
};
