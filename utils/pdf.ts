
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PeriodStats, Settings } from '../types';
import { formatCurrency } from './calendar';

export const generateReceiptPDF = (
  stats: PeriodStats, 
  settings: Settings, 
  periodName: string,
  returnFile: boolean = false
): File | void => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.text("RECIBO DE HABERES", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.text(`Período: ${periodName}`, 105, 28, { align: "center" });
  
  // Empleado info
  doc.setDrawColor(200);
  doc.line(14, 35, 196, 35);
  doc.setFontSize(10);
  doc.text(`Empleado: ${settings.employeeName}`, 14, 42);
  doc.text(`Generado: ${new Date().toLocaleDateString()}`, 150, 42);
  doc.line(14, 46, 196, 46);

  // Tabla
  const tableBody = [
    ["Sueldo Básico", formatCurrency(stats.basico), ""],
    [`Extras (${stats.ext50Hours}h al ${settings.multiplier50}x)`, formatCurrency(stats.extras50), ""],
    [`Extras (${stats.ext100Hours}h al ${settings.multiplier100}x)`, formatCurrency(stats.extras100), ""],
    [`Presentismo (${settings.attendanceBonus}%)`, formatCurrency(stats.asistencia), ""],
  ];

  stats.nonRemunerativeList.forEach(nr => {
     tableBody.push([`${nr.name} (No Rem.)`, formatCurrency(nr.amount), ""]);
  });

  tableBody.push(
    ["Jubilación", "", formatCurrency(stats.jub)],
    ["Ley 19032", "", formatCurrency(stats.ley19032)],
    ["Obra Social", "", formatCurrency(stats.obraSocial)]
  );

  autoTable(doc, {
    startY: 55,
    head: [['Concepto', 'Haberes', 'Deducciones']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] },
    columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'right' },
        2: { halign: 'right' }
    }
  });

  // Totales
  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("NETO A PERCIBIR:", 14, finalY);
  doc.text(formatCurrency(stats.netoFinal), 196, finalY, { align: "right" });

  // Firma
  if (settings.signatureImg) {
      doc.addImage(settings.signatureImg, 'PNG', 140, finalY + 10, 50, 20);
      doc.setFontSize(8);
      doc.text("Firma del Empleado", 165, finalY + 35, { align: "center" });
  }

  const filename = `Recibo_${periodName.replace(' ', '_')}.pdf`;

  if (returnFile) {
      const blob = doc.output('blob');
      return new File([blob], filename, { type: 'application/pdf' });
  }

  doc.save(filename);
};
