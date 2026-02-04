
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { DayLog } from './types';
import { MONTH_NAMES } from './utils/calendar';
import { Settings as SettingsIcon, LogOut, Briefcase, Loader2, Eye, EyeOff } from 'lucide-react';
import { LoginScreen } from './components/LoginScreen';
import { DayModal } from './components/DayModal';
import { SettingsView } from './components/SettingsView';
import { Onboarding } from './components/Onboarding';
import { usePayroll } from './hooks/usePayroll';
import { AppProvider, useApp } from './context/AppContext';

// Lazy loading components for performance
const CalendarView = React.lazy(() => import('./components/CalendarView').then(module => ({ default: module.CalendarView })));
const YearView = React.lazy(() => import('./components/YearView').then(module => ({ default: module.YearView })));
const ReportsView = React.lazy(() => import('./components/ReportsView').then(module => ({ default: module.ReportsView })));
const StatsView = React.lazy(() => import('./components/StatsView').then(module => ({ default: module.StatsView })));

type ViewMode = 'calendar' | 'year' | 'reports' | 'stats';

const MainLayout: React.FC = () => {
  const { user, logs, settings, isLoading, logout, updateUser, year, setYear } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [isDiscrete, setIsDiscrete] = useState(false);

  // Sync context year with calendar date
  useEffect(() => {
    if (currentDate.getFullYear() !== year) {
        setYear(currentDate.getFullYear());
    }
  }, [currentDate, year, setYear]);

  // Router hash logic
  useEffect(() => {
    const handleHashChange = () => {
        const hash = window.location.hash.slice(1) as ViewMode;
        if (['calendar', 'year', 'reports', 'stats'].includes(hash)) {
            setViewMode(hash);
        }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); 
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const setViewModeWithHash = (mode: ViewMode) => {
      window.location.hash = mode;
      setViewMode(mode);
  };

  const { calculatePeriod } = usePayroll(logs, settings);

  // Aplicar tema
  useEffect(() => {
     document.body.className = settings.themeMode === 'light' ? 'light' : 'dark';
  }, [settings.themeMode]);

  const handleDaySave = (data: Partial<DayLog>) => {
      if(!editingDay) return;
      const newLogs = { 
          ...logs, 
          [editingDay]: { 
              date: editingDay, 
              regularHours: data.regularHours || 0, 
              extraHours: data.extraHours || 0, 
              notes: data.notes || '',
              type: data.type || 'WORK',
              isSaturdayAfter13: data.isSaturdayAfter13,
              checkIn: data.checkIn,
              checkOut: data.checkOut,
              breakMinutes: data.breakMinutes
          } 
      };
      updateUser(undefined, newLogs);
      setEditingDay(null);
  };

  const handleDayDelete = () => {
      if(!editingDay) return;
      const newLogs = { ...logs };
      delete newLogs[editingDay];
      updateUser(undefined, newLogs);
      setEditingDay(null);
  };

  const currentMonthStats = useMemo(() => calculatePeriod(currentDate.getMonth(), currentDate.getFullYear(), () => true), [logs, settings, currentDate, calculatePeriod]);

  const themeClass = settings.themeColor === 'emerald' ? 'bg-emerald-600' : settings.themeColor === 'rose' ? 'bg-rose-600' : settings.themeColor === 'amber' ? 'bg-amber-600' : settings.themeColor === 'sky' ? 'bg-sky-600' : 'bg-indigo-600';
  const themeText = settings.themeColor === 'emerald' ? 'text-emerald-400' : settings.themeColor === 'rose' ? 'text-rose-400' : settings.themeColor === 'amber' ? 'text-amber-400' : settings.themeColor === 'sky' ? 'text-sky-400' : 'text-indigo-400';

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className={`min-h-screen ${settings.themeMode === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'} pb-20 selection:bg-indigo-500/30 transition-colors duration-300`}>
      {!settings.onboardingSeen && (
         <Onboarding onComplete={() => updateUser({ ...settings, onboardingSeen: true })} />
      )}
      <header className={`${settings.themeMode === 'light' ? 'bg-white/80 border-slate-200' : 'bg-slate-900/80 border-slate-800'} backdrop-blur-xl border-b sticky top-0 z-40 px-4 py-3 print:hidden transition-colors`}>
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`${themeClass} p-2.5 rounded-xl text-white shadow-lg transition-colors`}><Briefcase size={22} /></div>
            <div>
              <h1 className={`font-bold tracking-tight hidden sm:block ${settings.themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>Control {year}</h1>
              <p className="text-[8px] font-black text-slate-500 uppercase leading-none hidden sm:block">{settings.employeeName}</p>
            </div>
          </div>
          <nav className={`flex border p-1 rounded-2xl ${settings.themeMode === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/50 border-slate-800'}`}>
            {['calendar', 'year', 'reports', 'stats'].map((mode) => (
              <button key={mode} onClick={() => setViewModeWithHash(mode as ViewMode)} className={`relative px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === mode ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}>
                {viewMode === mode && <span className={`absolute inset-0 ${themeClass} rounded-xl -z-10 shadow-lg`} />}
                {mode === 'calendar' && <span>Mes</span>}
                {mode === 'year' && <span>Año</span>}
                {mode === 'reports' && <span className="hidden sm:inline">Recibos</span>}
                {mode === 'reports' && <span className="sm:hidden">Doc</span>}
                {mode === 'stats' && <span className="hidden sm:inline">Stats</span>}
                {mode === 'stats' && <span className="sm:hidden">Data</span>}
              </button>
            ))}
          </nav>
          <div className="flex gap-1">
            <button onClick={() => setIsDiscrete(!isDiscrete)} className={`p-2.5 ${isDiscrete ? 'text-emerald-500' : 'text-slate-400'} hover:text-emerald-400 rounded-xl transition-all`} title="Modo Discreto">
                {isDiscrete ? <EyeOff size={20}/> : <Eye size={20}/>}
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className={`p-2.5 text-slate-400 hover:${themeText} rounded-xl transition-all`} title="Ajustes"><SettingsIcon size={20}/></button>
            <button onClick={logout} className="p-2.5 text-slate-400 hover:text-red-500 rounded-xl transition-all" title="Salir"><LogOut size={20}/></button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className={`animate-spin ${themeText}`} size={32} /></div>}>
            {viewMode === 'calendar' && (
            <CalendarView 
                currentDate={currentDate} 
                setCurrentDate={setCurrentDate} 
                logs={logs} 
                currentMonthStats={currentMonthStats}
                onDayClick={setEditingDay}
                themeClass={themeClass}
                isDiscrete={isDiscrete}
            />
            )}

            {viewMode === 'year' && (
                <YearView 
                    logs={logs}
                    onDayClick={setEditingDay}
                    year={year}
                    onYearChange={(y) => { setYear(y); setCurrentDate(new Date(y, 0, 1)); }}
                />
            )}
            
            {viewMode === 'reports' && (
                <ReportsView 
                onCalculate={calculatePeriod}
                settings={settings}
                themeText={themeText}
                logs={logs}
                isDiscrete={isDiscrete}
                year={year}
                />
            )}

            {viewMode === 'stats' && (
                <StatsView 
                    themeText={themeText}
                    isDiscrete={isDiscrete}
                />
            )}
        </Suspense>
      </main>

      {editingDay && (
        <DayModal 
            dateStr={editingDay} 
            initialData={logs[editingDay]}
            onClose={() => setEditingDay(null)}
            onSave={handleDaySave}
            onDelete={handleDayDelete}
            themeClass={themeClass}
            themeText={themeText}
            settings={settings}
        />
      )}

      {isSettingsOpen && (
        <SettingsView 
            onClose={() => setIsSettingsOpen(false)}
            themeText={themeText}
            themeClass={themeClass}
        />
      )}
    </div>
  );
}

const App: React.FC = () => {
    return (
        <AppProvider>
            <MainLayout />
        </AppProvider>
    );
};

export default App;
