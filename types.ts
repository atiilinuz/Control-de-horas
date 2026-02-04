
export type DayType = 'WORK' | 'SICK' | 'VACATION' | 'LICENSE' | 'HOLIDAY_WORK';
export type ThemeMode = 'light' | 'dark';

export interface DayLog {
  date: string; // ISO format YYYY-MM-DD
  regularHours: number;
  nightHours?: number; // Nuevas horas nocturnas
  extraHours: number;
  notes: string;
  type: DayType;
  isSaturdayAfter13?: boolean; 
  checkIn?: string; // HH:MM
  checkOut?: string; // HH:MM
  breakMinutes?: number;
}

export interface RateHistoryItem {
  date: string; 
  hourlyRate: number;
}

export interface NonRemunerativeConcept {
  id: string;
  name: string;
  amount: number;
}

export interface Settings {
  hourlyRate: number; 
  rateHistory: RateHistoryItem[]; 
  hourlyRate50: number; // Deprecated
  hourlyRate100: number; // Deprecated
  
  multiplier50: number; 
  multiplier100: number; 
  multiplierNight: number; // Nuevo multiplicador nocturno
  
  standardWorkDay: number;
  employeeName: string;
  monthlyIncomeGoal?: number; // Nuevo objetivo financiero
  
  themeColor: string;
  themeMode: ThemeMode;
  deductionJub: number;
  deductionLey: number;
  deductionOS: number;
  attendanceBonus: number; 
  customHolidays: string[]; 
  signatureImg?: string;
  nonRemunerativeConcepts: NonRemunerativeConcept[];
  onboardingSeen?: boolean;
}

export interface UserProfile {
  username: string;
  password: string; 
  securityQuestion?: string; 
  securityAnswerHash?: string; 
  settings: Settings;
  logs: Record<string, DayLog>;
}

export interface PeriodStats {
  netoFinal: number;
  hasData: boolean;
  bruto: number;
  regHours: number;
  nightHours: number; // Stats nocturnas
  ext50Hours: number;
  ext100Hours: number;
  basico: number;
  plusNocturnidad: number; // Dinero nocturnidad
  extras50: number;
  extras100: number;
  asistencia: number;
  jub: number;
  ley19032: number;
  obraSocial: number;
  nonRemunerativeTotal: number;
  nonRemunerativeList: {name: string, amount: number}[];
  sacEstimado: number;
}
