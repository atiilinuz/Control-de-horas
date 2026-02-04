
import React, { useState } from 'react';
import { ArrowLeft, FileText, Printer, FileDown, Table, Share2 } from 'lucide-react';
import { MONTH_NAMES, formatCurrency } from '../utils/calendar';
import { Settings, PeriodStats, DayLog } from '../types';
import { exportToExcel } from '../utils/export';
import { generateReceiptPDF } from '../utils/pdf';

interface ReportsViewProps {
  onCalculate: (month: number, year: number, filter: (d: Date) => boolean) => PeriodStats;
  settings: Settings;
  themeText: string;
  logs: Record<string, DayLog>;
  isDiscrete: boolean;
  year: number;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onCalculate, settings, themeText, logs, isDiscrete, year }) => {
  const [selectedQuincena, setSelectedQuincena] = useState<{month: number, q: 1|2} | null>(null);

  if (!selectedQuincena) {
    return (
        <div className="space-y-6 animate-view">
            <div className="bg-slate-900 dark:bg-slate-900 bg-white p-10 rounded-[3rem] border border-slate-800 shadow-xl print:hidden">
            <h2 className="text-xl font-black uppercase dark:text-white text-slate-900 mb-8 tracking-tighter flex items-center gap-3"><FileText className={themeText}/> Historial de Liquidaciones {year}</h2>
            <div className="grid gap-4">
                {MONTH_NAMES.map((name, idx) => {
                const s1 = onCalculate(idx, year, d => d.getDate() <= 15);
                const s2 = onCalculate(idx, year, d => d.getDate() > 15);
                if (!s1.hasData && !s2.hasData) return null;
                return (
                    <div key={name} className="bg-slate-800/20 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <p className="text-[12px] font-black dark:text-white text-slate-900 uppercase">{name} {year}</p>
                    <div className="flex gap-2">
                        <button disabled={!s1.hasData} onClick={() => setSelectedQuincena({month: idx, q: 1})} className="px-6 py-3 rounded-xl border border-slate-700 bg-slate-900 dark:bg-slate-900 bg-slate-100 font-bold text-[10px] uppercase hover:bg-slate-800 disabled:opacity-20 transition-all dark:text-white text-slate-900">1° Quincena</button>
                        <button disabled={!s2.hasData} onClick={() => setSelectedQuincena({month: idx, q: 2})} className="px-6 py-3 rounded-xl border border-slate-700 bg-slate-900 dark:bg-slate-900 bg-slate-100 font-bold text-[10px] uppercase hover:bg-slate-800 disabled:opacity-20 transition-all dark:text-white text-slate-900">2° Quincena</button>
                    </div>
                    </div>
                );
                })}
            </div>
            </div>
        </div>
    );
  }

  const s = onCalculate(selectedQuincena.month, year, d => selectedQuincena.q === 1 ? d.getDate() <= 15 : d.getDate() > 15);
  const periodName = `${selectedQuincena.q}° Quincena ${MONTH_NAMES[selectedQuincena.month]} ${year}`;
  const renderValue = (val: number) => isDiscrete ? '••••••' : formatCurrency(val);

  const handleExport = () => {
    const relevantLogs = (Object.values(logs) as DayLog[]).filter(l => {
        const d = new Date(l.date + "T00:00:00");
        const inMonth = d.getMonth() === selectedQuincena.month && d.getFullYear() === year;
        const inQ = selectedQuincena.q === 1 ? d.getDate() <= 15 : d.getDate() > 15;
        return inMonth && inQ;
    });
    exportToExcel(s, settings, MONTH_NAMES[selectedQuincena.month], year, relevantLogs);
  };

  const handlePDF = () => {
      generateReceiptPDF(s, settings, periodName);
  };

  const handleShare = async () => {
      // Nota: jspdf generatePDF devuelve un blob si se configura, aquí usamos una lógica simulada para Web Share
      // En una implementación real se debe cambiar utils/pdf.ts para retornar el Blob
      try {
          const doc = generateReceiptPDF(s, settings, periodName, true); // Assume true returns blob/file
          if (doc instanceof File && navigator.share) {
              await navigator.share({
                  files: [doc],
                  title: `Recibo ${periodName}`,
                  text: `Adjunto recibo de haberes ${periodName}`
              });
          } else {
              alert("Tu dispositivo no soporta compartir archivos directamente. Usa la opción PDF para descargar.");
          }
      } catch (e) {
         // Fallback manual
         handlePDF();
      }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-view">
        <button onClick={() => setSelectedQuincena(null)} className="flex items-center gap-2 text-slate-500 hover:text-white font-black text-[10px] uppercase print:hidden"><ArrowLeft size={14}/> Volver</button>
        <div id="payroll-receipt" className="bg-white p-12 text-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden print:shadow-none print:p-0 print:m-0 print:w-full print:rounded-none">
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-6 mb-8">
            <div><h3 className="text-2xl font-black uppercase text-slate-900">Recibo de Haberes</h3><p className="text-[10px] font-bold text-slate-700">LIQUIDACIÓN DIGITAL {year}</p></div>
            <div className="text-right"><p className="font-black uppercase text-xs text-slate-900">{periodName}</p></div>
            </div>
            <div className="mb-10 font-black text-sm uppercase text-slate-900">EMPLEADO: {settings.employeeName}</div>
            
            <table className="w-full text-xs mb-10 border-collapse">
            <thead className="bg-slate-100 font-black uppercase text-[10px] text-slate-900">
                <tr><th className="p-4 text-left border-b border-slate-300">Concepto</th><th className="p-4 text-right border-b border-slate-300">Haberes</th><th className="p-4 text-right border-b border-slate-300">Deducciones</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-900">
                <tr><td className="p-4 font-bold text-slate-900">Básico ({s.regHours}h)</td><td className="p-4 text-right font-black text-slate-900">{renderValue(s.basico)}</td><td className="p-4 text-right text-slate-400">-</td></tr>
                {s.ext50Hours > 0 && <tr><td className="p-4 font-bold text-slate-900">Extras ({s.ext50Hours}h al {settings.multiplier50 || 1.5}x)</td><td className="p-4 text-right font-black text-slate-900">{renderValue(s.extras50)}</td><td className="p-4 text-right text-slate-400">-</td></tr>}
                {s.ext100Hours > 0 && <tr><td className="p-4 font-bold text-slate-900">Extras ({s.ext100Hours}h al {settings.multiplier100 || 2.0}x)</td><td className="p-4 text-right font-black text-slate-900">{renderValue(s.extras100)}</td><td className="p-4 text-right text-slate-400">-</td></tr>}
                <tr><td className="p-4 font-bold text-slate-900">Presentismo ({settings.attendanceBonus}%)</td><td className="p-4 text-right font-black text-slate-900">{renderValue(s.asistencia)}</td><td className="p-4 text-right text-slate-400">-</td></tr>
                
                {s.nonRemunerativeList.map((concept, i) => (
                   <tr key={i} className="bg-slate-50">
                     <td className="p-4 font-bold text-slate-700">{concept.name} (No Rem.)</td>
                     <td className="p-4 text-right font-black text-slate-700">{renderValue(concept.amount)}</td>
                     <td className="p-4 text-right text-slate-400">-</td>
                   </tr>
                ))}

                <tr className="bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">Jubilación ({settings.deductionJub}%)</td>
                    <td className="p-4 text-right text-slate-400">-</td>
                    <td className="p-4 text-right font-black text-slate-900">{renderValue(s.jub)}</td>
                </tr>
                <tr className="bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">Ley 19032 ({settings.deductionLey}%)</td>
                    <td className="p-4 text-right text-slate-400">-</td>
                    <td className="p-4 text-right font-black text-slate-900">{renderValue(s.ley19032)}</td>
                </tr>
                <tr className="bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">Obra Social ({settings.deductionOS}%)</td>
                    <td className="p-4 text-right text-slate-400">-</td>
                    <td className="p-4 text-right font-black text-slate-900">{renderValue(s.obraSocial)}</td>
                </tr>

                <tr className="bg-slate-900 text-white font-black text-xl print:text-slate-900 print:bg-transparent print:border-t-2 print:border-slate-900"><td className="p-6 uppercase">Neto Final</td><td colSpan={2} className="p-6 text-right">{renderValue(s.netoFinal)}</td></tr>
            </tbody>
            </table>
            {settings.signatureImg && (
            <div className="mt-10 flex flex-col items-end">
                <img src={settings.signatureImg} alt="Firma" className="h-16 mb-2 grayscale" style={{ filter: 'contrast(1.2) brightness(0.6)' }} />
                <div className="w-48 border-t border-slate-900 pt-1 text-center">
                <p className="text-[10px] font-black uppercase text-slate-900">Firma del Empleado</p>
                </div>
            </div>
            )}
            <div className="flex gap-4 mt-8 print:hidden">
            <button onClick={handleShare} className="flex-1 bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95"><Share2 size={16}/> Enviar</button>
            <button onClick={handlePDF} className="flex-1 bg-indigo-600 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95"><FileDown size={16}/> PDF</button>
            <button onClick={handleExport} className="flex-1 bg-emerald-600 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg active:scale-95"><Table size={16}/> Excel</button>
            </div>
        </div>
    </div>
  );
};
