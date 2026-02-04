
import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  isDiscrete?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, colorClass, isDiscrete }) => {
  const displayValue = isDiscrete && typeof value === 'string' && value.includes('$') 
    ? '••••••' 
    : value;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{displayValue}</p>
      </div>
    </div>
  );
};
