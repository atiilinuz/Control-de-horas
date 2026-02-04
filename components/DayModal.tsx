
import React, { useState, useEffect } from 'react';
import { X, Trash2, Clock, ArrowRight, Moon } from 'lucide-react';
import { DayLog, DayType, Settings } from '../types';

interface DayModalProps {
  dateStr: string;
  initialData?: DayLog;
  onClose: () => void;
  onSave: (data: Partial<DayLog>) => void;
  onDelete: () => void;
  themeClass: string;
  themeText: string;
  settings: Settings;
}

export const DayModal: React.FC<DayModalProps> = ({ dateStr, initialData, onClose, onSave, onDelete, themeClass, themeText, settings }) => {
  const [reg, setReg] = useState(initialData?.regularHours || settings.standardWorkDay);
  const [ext, setExt] = useState(initialData?.extraHours || 0);
  const [night, setNight] = useState(initialData?.nightHours || 0);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [type, setType] = useState<DayType>(initialData?.type || 'WORK');
  const [isSatAfter13, setIsSatAfter13] = useState(initialData?.isSaturdayAfter13 || false);
  
  // Time Management States
  const [checkIn, setCheckIn] = useState(initialData?.checkIn || '');
  const [checkOut, setCheckOut] = useState(initialData?.checkOut || '');
  const [breakMinutes, setBreakMinutes] = useState(initialData?.breakMinutes || 0);

  const dateObj = new Date(dateStr + "T00:00:00");
  const isSaturday = dateObj.getDay() === 6;

  useEffect(() => {
    if (type === 'SICK' || type === 'VACATION' || type === 'LICENSE') {
      if (!initialData) {
          setReg(settings.standardWorkDay);
          setExt(0);
          setNight(0);
      }
    }
  }, [type, settings.standardWorkDay, initialData]);

  // Auto-calculate hours (including night shift logic)
  useEffect(() => {
    if (checkIn && checkOut) {
        const [h1, m1] = checkIn.split(':').map(Number);
        const [h2, m2] = checkOut.split(':').map(Number);
        
        let start = new Date(2000, 0, 1, h1, m1);
        let end = new Date(2000, 0, 1, h2, m2);
        
        // Handle overnight
        if (end < start) {
            end.setDate(2);
        }

        const diffMs = end.getTime() - start.getTime();
        const totalMinutes = (diffMs / (1000 * 60)) - breakMinutes;
        const totalHours = Math.max(0, totalMinutes / 60);

        // Night Logic: 21:00 to 06:00
        let nightMins = 0;
        let current = new Date(start);
        
        // Iterar minuto a minuto para precisión (optimizable pero efectivo para rangos cortos)
        while (current < end) {
            const h = current.getHours();
            // Noche es de 21 a 06
            if (h >= 21 || h < 6) {
                nightMins++;
            }
            current.setMinutes(current.getMinutes() + 1);
        }
        
        // Descontar break de la noche proporcionalmente o simple? 
        // Simplificación: si la mayoría es noche, el break es noche.
        const ratioNight = totalMinutes > 0 ? nightMins / (totalMinutes + breakMinutes) : 0;
        const netNightMinutes = Math.max(0, nightMins - (breakMinutes * ratioNight));
        const netNightHours = Number((netNightMinutes / 60).toFixed(1));

        setNight(netNightHours);

        if (totalHours > settings.standardWorkDay) {
            setReg(settings.standardWorkDay);
            setExt(Number((totalHours - settings.standardWorkDay).toFixed(1)));
        } else {
            setReg(Number(totalHours.toFixed(1)));
            setExt(0);
        }
    }
  }, [checkIn, checkOut, breakMinutes, settings.standardWorkDay]);

  const handleSave = () => {
      onSave({ 
          date: dateStr, 
          regularHours: reg, 
          extraHours: ext, 
          nightHours: night,
          notes, 
          type, 
          isSaturdayAfter13: isSatAfter13,
          checkIn,
          checkOut,
          breakMinutes
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in">
      <div className="bg-slate-900 dark:bg-slate-900 bg-white rounded-[3rem] w-full max-w-md p-10 border border-slate-800 animate-in zoom-in-95 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className={`text-[10px] font-black ${themeText} uppercase tracking-widest`}>Control Jornada</p>
            <h3 className="text-2xl font-black dark:text-white text-slate-900">{dateStr.split('-').reverse().join('/')}</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Jornada</label>
            <select value={type} onChange={(e) => setType(e.target.value as DayType)} className="w-full bg-slate-800 dark:bg-slate-800 bg-slate-100 border border-slate-700 p-3 rounded-xl dark:text-white text-slate-900 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="WORK">Laborable Normal</option>
                <option value="HOLIDAY_WORK">Feriado Trabajado</option>
                <option value="SICK">Enfermedad (Pago)</option>
                <option value="VACATION">Vacaciones</option>
                <option value="LICENSE">Licencia Especial</option>
            </select>
          </div>

          {(type === 'WORK' || type === 'HOLIDAY_WORK') && (
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                    <Clock size={14} className={themeText}/>
                    <span className="text-[10px] font-black text-slate-400 uppercase">Cálculo por Horario</span>
                 </div>
                 <div className="flex gap-2 items-center">
                    <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase block">Entrada</label>
                        <input type="time" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold text-center"/>
                    </div>
                    <ArrowRight size={14} className="text-slate-600 mt-4"/>
                    <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase block">Salida</label>
                        <input type="time" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold text-center"/>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Descanso (Minutos)</label>
                    <input type="number" min="0" step="15" value={breakMinutes} onChange={e => setBreakMinutes(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold text-center"/>
                 </div>
                 {night > 0 && (
                     <div className="flex items-center gap-2 bg-indigo-900/30 p-2 rounded-lg border border-indigo-500/30">
                         <Moon size={12} className="text-indigo-400"/>
                         <span className="text-[9px] text-indigo-300 font-bold">Detectadas {night}h nocturnas (21:00-06:00)</span>
                     </div>
                 )}
              </div>
          )}

          {isSaturday && type === 'WORK' && (
             <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl">
                <input type="checkbox" checked={isSatAfter13} onChange={e => setIsSatAfter13(e.target.checked)} className="w-5 h-5 accent-indigo-500"/>
                <label className="text-xs font-bold text-slate-400">¿Sábado después de 13hs? (100%)</label>
             </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-end">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Horas a Pagar</label>
                <input type="number" min="0" max="24" step="0.5" value={reg} onChange={e => setReg(Number(e.target.value))} className="w-20 bg-slate-800 dark:bg-slate-800 bg-slate-100 border border-slate-700 rounded-lg text-center dark:text-white text-slate-900 font-black p-1"/>
            </div>
            <input type="range" min="0" max="15" step="0.5" value={reg} onChange={e => setReg(Number(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg accent-indigo-500 appearance-none cursor-pointer"/>
          </div>

          {(type === 'WORK' || type === 'HOLIDAY_WORK') && (
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Extras {isSatAfter13 ? '(100%)' : ''}</label>
                    <input type="number" min="0" max="24" step="0.5" value={ext} onChange={e => setExt(Number(e.target.value))} className="w-20 bg-slate-800 dark:bg-slate-800 bg-slate-100 border border-slate-700 rounded-lg text-center text-emerald-400 font-black p-1"/>
                </div>
                <input type="range" min="0" max="10" step="0.5" value={ext} onChange={e => setExt(Number(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg accent-emerald-500 appearance-none cursor-pointer"/>
            </div>
          )}

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notas</label>
             <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-800 dark:bg-slate-800 bg-slate-100 border border-slate-700 p-3 rounded-xl dark:text-white text-slate-900 text-xs resize-none h-20" placeholder="Detalles opcionales..."></textarea>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onDelete} className="p-5 bg-slate-800 text-slate-400 hover:text-red-500 rounded-2xl transition-all"><Trash2 size={20} /></button>
            <button onClick={handleSave} className={`flex-1 ${themeClass} text-white font-black py-5 rounded-2xl uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all`}>Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
};
