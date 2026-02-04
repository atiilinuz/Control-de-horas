
import { useCallback } from 'react';
import { DayLog, Settings, PeriodStats } from '../types';
import { isHolidayOrSunday } from '../utils/calendar';

export const usePayroll = (logs: Record<string, DayLog>, settings: Settings) => {
  
  const getRateForDate = useCallback((dateStr: string): number => {
    if (!settings.rateHistory || settings.rateHistory.length === 0) {
      return settings.hourlyRate;
    }
    const applicable = settings.rateHistory
      .filter(r => r.date <= dateStr)
      .sort((a, b) => b.date.localeCompare(a.date));
    return applicable.length > 0 ? applicable[0].hourlyRate : settings.hourlyRate;
  }, [settings.rateHistory, settings.hourlyRate]);

  const calculatePeriod = useCallback((month: number, year: number, filter: (d: Date) => boolean): PeriodStats => {
    let regHours = 0, nightHours = 0, ext50Hours = 0, ext100Hours = 0, hasData = false;
    let basico = 0, plusNocturnidad = 0, extras50 = 0, extras100 = 0;

    // Default multipliers fallback
    const mul50 = settings.multiplier50 || 1.5;
    const mul100 = settings.multiplier100 || 2.0;
    const mulNight = settings.multiplierNight || 1.15; // 15% extra por defecto

    Object.values(logs).forEach((log) => {
      const d = new Date(log.date + "T00:00:00");
      if (d.getMonth() === month && d.getFullYear() === year && filter(d)) {
        hasData = true;
        const rate = getRateForDate(log.date);
        const rate50 = rate * mul50;
        const rate100 = rate * mul100;
        const rateNightDiff = rate * (mulNight - 1); // El plus solamente
        const isSaturday = d.getDay() === 6;

        if (log.type === 'WORK' || log.type === 'HOLIDAY_WORK') {
           regHours += log.regularHours;
           basico += log.regularHours * rate;
           
           // Cálculo de Nocturnidad (si existe)
           if (log.nightHours && log.nightHours > 0) {
               nightHours += log.nightHours;
               plusNocturnidad += log.nightHours * rateNightDiff;
           }
           
           if (log.type === 'HOLIDAY_WORK' || isHolidayOrSunday(d) || (isSaturday && log.isSaturdayAfter13)) {
              ext100Hours += log.extraHours;
              extras100 += log.extraHours * rate100;
           } else {
              ext50Hours += log.extraHours;
              extras50 += log.extraHours * rate50;
           }
        } else {
           regHours += log.regularHours;
           basico += log.regularHours * rate;
        }
      }
    });

    const asistencia = hasData ? (basico + plusNocturnidad + extras50 + extras100) * (settings.attendanceBonus / 100) : 0;
    const bruto = basico + plusNocturnidad + extras50 + extras100 + asistencia;
    
    const jub = bruto * (settings.deductionJub / 100);
    const ley19032 = bruto * (settings.deductionLey / 100);
    const obraSocial = bruto * (settings.deductionOS / 100);
    const totalDeductions = jub + ley19032 + obraSocial;

    const nonRemunerativeTotal = (settings.nonRemunerativeConcepts || []).reduce((acc, curr) => acc + curr.amount, 0);
    const netoFinal = (bruto - totalDeductions) + (hasData ? nonRemunerativeTotal : 0);

    const sacEstimado = (bruto / 2) * (1 - (settings.deductionJub + settings.deductionLey + settings.deductionOS)/100);

    return { 
      netoFinal, hasData, bruto, regHours, nightHours, ext50Hours, ext100Hours, 
      basico, plusNocturnidad, extras50, extras100, asistencia, 
      jub, ley19032, obraSocial,
      nonRemunerativeTotal: hasData ? nonRemunerativeTotal : 0,
      nonRemunerativeList: hasData ? (settings.nonRemunerativeConcepts || []) : [],
      sacEstimado
    };
  }, [logs, settings, getRateForDate]);

  return { calculatePeriod, getRateForDate };
};
