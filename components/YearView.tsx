
import React from 'react';
import { MONTH_NAMES, getDaysInMonth, isHolidayOrSunday } from '../utils/calendar';
import { DayLog } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface YearViewProps {
  logs: Record<string, DayLog>;
  onDayClick: (dateStr: string) => void;
  year: number;
  onYearChange?: (y: number) => void;
}

export const YearView: React.FC<YearViewProps> = ({ logs, onDayClick, year, onYearChange }) => {
  return (
    <div className="space-y-6 animate-view">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
                Vista Anual {year}
            </h2>
            {onYearChange && (
                <div className="flex gap-2">
                    <button onClick={() => onYearChange(year - 1)} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700"><ChevronLeft size={16}/></button>
                    <button onClick={() => onYearChange(year + 1)} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700"><ChevronRight size={16}/></button>
                </div>
            )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {MONTH_NAMES.map((monthName, monthIdx) => {
            const days = getDaysInMonth(monthIdx, year);
            // Padding for start of month
            const startPadding = Array.from({ length: (days[0].getDay() + 6) % 7 });

            return (
              <div key={monthName} className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50 hover:border-slate-700 transition-colors">
                <h3 className="text-[10px] font-black uppercase text-slate-500 mb-3 text-center">{monthName}</h3>
                <div className="grid grid-cols-7 gap-1">
                  {/* Headers */}
                  {['L','M','M','J','V','S','D'].map(d => (
                    <div key={d} className="text-[8px] font-bold text-slate-700 text-center">{d}</div>
                  ))}
                  
                  {/* Empty slots */}
                  {startPadding.map((_, i) => <div key={`empty-${i}`} />)}

                  {/* Days */}
                  {days.map(date => {
                    const monthStr = String(date.getMonth() + 1).padStart(2, '0');
                    const dayStr = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${monthStr}-${dayStr}`;
                    const log = logs[dateStr];
                    const isSpecial = isHolidayOrSunday(date);
                    
                    let bgClass = "bg-slate-800 hover:bg-slate-700"; // Default empty day
                    
                    if (log) {
                        if (log.type === 'WORK' || log.type === 'HOLIDAY_WORK') {
                            if (log.extraHours > 0) bgClass = "bg-emerald-500"; // Extras
                            else if (log.regularHours >= 9) bgClass = "bg-indigo-500"; // Full day
                            else bgClass = "bg-indigo-500/50"; // Part time
                        } else if (log.type === 'VACATION') {
                            bgClass = "bg-blue-500";
                        } else if (log.type === 'SICK') {
                            bgClass = "bg-orange-500";
                        } else {
                            bgClass = "bg-purple-500";
                        }
                    } else if (isSpecial) {
                        bgClass = "bg-red-900/20";
                    }

                    return (
                      <div 
                        key={dateStr}
                        onClick={() => onDayClick(dateStr)}
                        className={`aspect-square rounded-md cursor-pointer transition-all ${bgClass} flex items-center justify-center group relative`}
                      >
                         <span className={`text-[8px] font-bold ${log ? 'text-white' : 'text-slate-600'}`}>{date.getDate()}</span>
                         
                         {/* Tooltip */}
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-[8px] font-bold py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                            {date.getDate()} {monthName} {log ? `- ${log.type === 'WORK' ? (log.regularHours + log.extraHours)+'h' : log.type}` : ''}
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
