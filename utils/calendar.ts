
export const getDaysInMonth = (month: number, year: number): Date[] => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  }).format(amount);
};

// Lista de feriados inamovibles y trasladables 2026 (Argentina)
export const HOLIDAYS_2026 = [
  "2026-01-01", // Año Nuevo
  "2026-02-16", // Carnaval
  "2026-02-17", // Carnaval
  "2026-03-24", // Memoria
  "2026-04-02", // Malvinas
  "2026-04-03", // Viernes Santo
  "2026-05-01", // Trabajo
  "2026-05-25", // Rev. Mayo
  "2026-06-20", // Belgrano
  "2026-07-09", // Independencia
  "2026-08-17", // San Martín
  "2026-10-12", // Diversidad
  "2026-11-20", // Soberanía
  "2026-12-08", // Inmaculada
  "2026-12-25", // Navidad
];

export const isHolidayOrSunday = (date: Date): boolean => {
  if (date.getDay() === 0) return true;
  const dateStr = date.toISOString().split('T')[0];
  return HOLIDAYS_2026.includes(dateStr);
};

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
