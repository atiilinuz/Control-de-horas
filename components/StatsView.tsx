
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { TrendingUp, BarChart3, Clock, Wallet, Target } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { formatCurrency, MONTH_NAMES } from '../utils/calendar';
import { usePayroll } from '../hooks/usePayroll';
import { useApp } from '../context/AppContext';

interface StatsViewProps {
  themeText: string;
  isDiscrete: boolean;
}

export const StatsView: React.FC<StatsViewProps> = ({ themeText, isDiscrete }) => {
    const { logs, settings } = useApp();
    const { calculatePeriod } = usePayroll(logs, settings);

    const annualStats = useMemo(() => MONTH_NAMES.map((name, idx) => ({
        name: name.substring(0,3),
        ...calculatePeriod(idx, 2026, () => true)
    })), [logs, settings, calculatePeriod]);
    
    const sacDetails = useMemo(() => {
        const firstHalf = annualStats.slice(0, 6);
        const secondHalf = annualStats.slice(6, 12);
        
        const maxBruto1 = Math.max(...firstHalf.map(s => s.bruto), 0);
        const maxBruto2 = Math.max(...secondHalf.map(s => s.bruto), 0);
        
        const deductionsRatio = (settings.deductionJub + settings.deductionLey + settings.deductionOS) / 100;
        const sac1Neto = (maxBruto1 / 2) * (1 - deductionsRatio);
        const sac2Neto = (maxBruto2 / 2) * (1 - deductionsRatio);

        return { best1: maxBruto1, sac1: sac1Neto, best2: maxBruto2, sac2: sac2Neto };
    }, [annualStats, settings]);

    const totalAnnualNeto = useMemo(() => annualStats.reduce((acc, curr) => acc + curr.netoFinal, 0), [annualStats]);
    const totalAnnualHours = useMemo(() => annualStats.reduce((acc, curr) => acc + curr.regHours + curr.ext50Hours + curr.ext100Hours, 0), [annualStats]);
    
    // Financial Goal Calc (Monthly Avg vs Target)
    const currentMonthStats = annualStats[new Date().getMonth()];
    const goalPercentage = settings.monthlyIncomeGoal && settings.monthlyIncomeGoal > 0 
        ? Math.min(100, (currentMonthStats.netoFinal / settings.monthlyIncomeGoal) * 100) 
        : 0;

    return (
        <div className="space-y-6 animate-view">
            <h2 className="text-xl font-black uppercase dark:text-white text-slate-900 mb-8 tracking-tighter flex items-center gap-3"><TrendingUp className={themeText}/> Estadísticas 2026</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Ingreso Anual (Neto)" value={formatCurrency(totalAnnualNeto)} icon={<Wallet size={24} className="text-emerald-500"/>} colorClass="bg-emerald-500/10" isDiscrete={isDiscrete} />
                <StatsCard title="Horas Totales" value={`${totalAnnualHours}h`} icon={<Clock size={24} className="text-blue-500"/>} colorClass="bg-blue-500/10" />
                <StatsCard title="Mejor Bruto (Sem. 1)" value={formatCurrency(sacDetails.best1)} icon={<TrendingUp size={24} className="text-amber-500"/>} colorClass="bg-amber-500/10" isDiscrete={isDiscrete} />
                <StatsCard title="Mejor Bruto (Sem. 2)" value={formatCurrency(sacDetails.best2)} icon={<BarChart3 size={24} className="text-purple-500"/>} colorClass="bg-purple-500/10" isDiscrete={isDiscrete} />
            </div>

            {settings.monthlyIncomeGoal && settings.monthlyIncomeGoal > 0 && (
                 <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
                     <div className="relative z-10 flex justify-between items-center mb-2">
                         <div className="flex items-center gap-2">
                            <Target size={20} className="text-emerald-400" />
                            <span className="text-sm font-bold text-white uppercase">Meta Mensual (Este Mes)</span>
                         </div>
                         <span className="text-xl font-black text-white">{goalPercentage.toFixed(1)}%</span>
                     </div>
                     <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700">
                         <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-1000" style={{ width: `${goalPercentage}%` }}></div>
                     </div>
                     <p className="text-xs text-slate-400 mt-2 font-medium">
                         Has generado {isDiscrete ? '••••••' : formatCurrency(currentMonthStats.netoFinal)} de tu objetivo de {isDiscrete ? '••••••' : formatCurrency(settings.monthlyIncomeGoal)}
                     </p>
                 </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                {/* Recharts: Evolución Mensual */}
                <div className="lg:col-span-2 bg-slate-900 dark:bg-slate-900 bg-white p-8 rounded-[2.5rem] border border-slate-800 shadow-xl min-h-[400px]">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Evolución Ingresos</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={annualStats}>
                            <defs>
                                <linearGradient id="colorNeto" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => isDiscrete ? '***' : `$${v/1000}k`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                formatter={(val: number) => isDiscrete ? '••••••' : formatCurrency(val)}
                            />
                            <Area type="monotone" dataKey="netoFinal" stroke="#10b981" fillOpacity={1} fill="url(#colorNeto)" strokeWidth={3} name="Neto" />
                            <Area type="monotone" dataKey="bruto" stroke="#6366f1" fill="transparent" strokeDasharray="5 5" strokeWidth={2} name="Bruto" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                </div>

                <div className="bg-slate-900 dark:bg-slate-900 bg-white p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Proyección SAC</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
                        <div>
                            <p className="text-xs font-bold dark:text-white text-slate-900">Junio (Est.)</p>
                            <p className="text-[10px] text-slate-500">1° Medio Aguinaldo</p>
                        </div>
                        <p className="text-xl font-black text-emerald-400">{isDiscrete ? '••••••' : formatCurrency(sacDetails.sac1)}</p>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
                        <div>
                            <p className="text-xs font-bold dark:text-white text-slate-900">Diciembre (Est.)</p>
                            <p className="text-[10px] text-slate-500">2° Medio Aguinaldo</p>
                        </div>
                        <p className="text-xl font-black text-emerald-400">{isDiscrete ? '••••••' : formatCurrency(sacDetails.sac2)}</p>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-slate-800">
                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={annualStats}>
                                <XAxis dataKey="name" hide />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none' }} formatter={(val: number) => [val + 'h', 'Horas']} />
                                <Bar dataKey="regHours" stackId="a" fill="#6366f1" radius={[0,0,4,4]} />
                                <Bar dataKey="ext50Hours" stackId="a" fill="#10b981" />
                                <Bar dataKey="ext100Hours" stackId="a" fill="#f59e0b" radius={[4,4,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-center text-[9px] text-slate-500 uppercase font-bold mt-2">Distribución de Horas</p>
                </div>
                </div>
            </div>
        </div>
    );
};
