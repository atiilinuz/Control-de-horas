
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile, Settings, DayLog } from '../types';
import { saveDB, loadDB } from '../utils/storage';
import { HOLIDAYS_2026 } from '../utils/calendar';

const APP_SECRET = 'static-secret-key-2026-aes-gcm'; 

export const DEFAULT_SETTINGS: Settings = {
  hourlyRate: 5000,
  rateHistory: [],
  hourlyRate50: 7500,
  hourlyRate100: 10000,
  multiplier50: 1.5,
  multiplier100: 2.0,
  multiplierNight: 1.15, // Por defecto 15% recargo nocturno
  standardWorkDay: 9,
  monthlyIncomeGoal: 0,
  employeeName: 'NUEVO USUARIO',
  themeColor: 'indigo',
  themeMode: 'dark',
  deductionJub: 11,
  deductionLey: 3,
  deductionOS: 3,
  attendanceBonus: 20,
  customHolidays: [...HOLIDAYS_2026],
  nonRemunerativeConcepts: [],
  onboardingSeen: false
};

interface AppContextType {
  user: string | null;
  db: Record<string, UserProfile>;
  settings: Settings;
  logs: Record<string, DayLog>;
  isLoading: boolean;
  year: number;
  setYear: (y: number) => void;
  login: (username: string) => void;
  logout: () => void;
  updateUser: (newSettings?: Settings, newLogs?: Record<string, DayLog>, security?: {q: string, a: string}) => void;
  setDb: React.Dispatch<React.SetStateAction<Record<string, UserProfile>>>;
  isAdmin: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [db, setDb] = useState<Record<string, UserProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [year, setYear] = useState(2026);

  // Cargar DB al inicio
  useEffect(() => {
    const initDB = async () => {
      setIsLoading(true);
      const loaded = await loadDB(APP_SECRET);
      if (loaded) {
        setDb(loaded);
      } else {
        const initialDb: Record<string, UserProfile> = {
          'admin': {
            username: 'admin',
            password: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', // 1234 hashed
            settings: { ...DEFAULT_SETTINGS, employeeName: 'ADMINISTRADOR' },
            logs: {}
          }
        };
        setDb(initialDb);
      }
      setIsLoading(false);
    };
    initDB();
  }, []);

  // Guardar DB cuando cambia
  useEffect(() => {
    if (Object.keys(db).length > 0 && !isLoading) {
      saveDB(db, APP_SECRET).catch(err => console.error("Error saving DB", err));
    }
  }, [db, isLoading]);

  // Auto Logout
  const logout = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    if (!user) return;
    let timeout: number;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = window.setTimeout(logout, 5 * 60 * 1000); // 5 min
    };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    resetTimer();
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      clearTimeout(timeout);
    };
  }, [user, logout]);

  const login = (username: string) => setUser(username);

  const updateUser = (newSettings?: Settings, newLogs?: Record<string, DayLog>, security?: {q: string, a: string}) => {
    if (!user) return;
    setDb(prev => ({
      ...prev,
      [user]: {
        ...prev[user],
        settings: newSettings || prev[user].settings,
        logs: newLogs || prev[user].logs,
        securityQuestion: security ? security.q : prev[user].securityQuestion,
        securityAnswerHash: security ? security.a : prev[user].securityAnswerHash
      }
    }));
  };

  const activeProfile = user ? db[user] : null;
  const settings = activeProfile?.settings || DEFAULT_SETTINGS;
  const logs = activeProfile?.logs || {};
  const isAdmin = user === 'admin';

  return (
    <AppContext.Provider value={{ 
      user, db, settings, logs, isLoading, year, setYear, login, logout, updateUser, setDb, isAdmin 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
