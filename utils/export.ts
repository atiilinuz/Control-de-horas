
import { utils, writeFile } from 'xlsx';
import { PeriodStats, Settings, DayLog } from '../types';

export const exportToExcel = (
  stats: PeriodStats, 
  settings: Settings, 
  monthName: string, 
  year: number,
  logs: DayLog[]
) => {
  const wb = utils.book_new();
  
  // Hoja de Resumen
  const summaryData = [
    ["Concepto", "Valor"],
    ["Empleado", settings.employeeName],
    ["Período", `${monthName} ${year}`],
    ["Sueldo Bruto", stats.bruto],
    ["Deducciones de Ley", stats.jub + stats.ley19032 + stats.obraSocial],
    ["Conceptos No Remunerativos", stats.nonRemunerativeTotal],
    ["Neto A Percibir", stats.netoFinal],
    ["", ""],
    ["Detalle Horas", ""],
    ["Horas Regulares", stats.regHours],
    ["Extras 50%", stats.ext50Hours],
    ["Extras 100%", stats.ext100Hours],
  ];
  const wsSummary = utils.aoa_to_sheet(summaryData);
  utils.book_append_sheet(wb, wsSummary, "Recibo");

  // Hoja de Detalle Diario
  const detailData = logs.map(l => ({
    Fecha: l.date,
    Tipo: l.type,
    "Horas Reg": l.regularHours,
    "Horas Ext": l.extraHours,
    "Nota": l.notes
  }));
  const wsDetail = utils.json_to_sheet(detailData);
  utils.book_append_sheet(wb, wsDetail, "Detalle Diario");

  writeFile(wb, `Liquidacion_${monthName}_${year}.xlsx`);
};
