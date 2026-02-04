
import React from 'react';
import { Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-6 animate-in fade-in">
        <div className="max-w-md w-full space-y-8 text-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.5)]">
                <span className="text-3xl">🚀</span>
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Bienvenido a <br/><span className="text-indigo-500">Control 2026</span></h2>
            <div className="space-y-4 text-sm text-slate-400 font-medium">
                <p>1. Toca cualquier día para cargar horas.</p>
                <p>2. Ve a "Recibos" para ver tu liquidación quincenal.</p>
                <p>3. Usa "Ajustes" para configurar tu valor hora.</p>
            </div>
            <button onClick={onComplete} className="w-full py-4 bg-white text-black font-black uppercase rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2">
                <Check size={20}/> Entendido
            </button>
        </div>
    </div>
  );
};
