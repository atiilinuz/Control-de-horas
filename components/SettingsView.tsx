
import React, { useState, useRef, useEffect } from 'react';
import { z } from 'zod';
import { 
  X, User, Palette, Calculator, Percent, Download, UserCog, UserPlus, Sun, Moon, Gauge, Trash2, Edit2, Save, Plus, Coins, Shield, Target, Moon as MoonIcon
} from 'lucide-react';
import { Settings, UserProfile, NonRemunerativeConcept } from '../types';
import { formatCurrency } from '../utils/calendar';
import { validateBackup, hashPassword } from '../utils/security';
import { useApp } from '../context/AppContext';

interface SettingsViewProps {
  onClose: () => void;
  themeText: string;
  themeClass: string;
}

const SmartInput = ({ value, onChange, className, ...props }: any) => {
  const [localVal, setLocalVal] = useState(value?.toString() || '');
  
  useEffect(() => {
    if (Number(value) !== Number(localVal)) {
        setLocalVal(value?.toString() || '');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalVal(newVal);
    onChange(newVal);
  };

  return <input {...props} value={localVal} onChange={handleChange} className={className} />;
};

const SettingsSchema = z.object({
  hourlyRate: z.number().min(0),
  attendanceBonus: z.number().min(0).max(100),
  deductionJub: z.number().min(0).max(50),
  deductionLey: z.number().min(0).max(50),
  deductionOS: z.number().min(0).max(50),
  employeeName: z.string().min(1),
  multiplier50: z.number().min(1).max(5),
  multiplier100: z.number().min(1).max(5),
  multiplierNight: z.number().min(1).max(3),
  monthlyIncomeGoal: z.number().min(0)
});

export const SettingsView: React.FC<SettingsViewProps> = ({ 
    onClose, themeText, themeClass 
}) => {
    const { settings, updateUser, isAdmin, db, setDb, user } = useApp();

    const [newUsername, setNewUsername] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    
    const [editingTarget, setEditingTarget] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editPass, setEditPass] = useState('');

    const [newConceptName, setNewConceptName] = useState('');
    const [newConceptAmount, setNewConceptAmount] = useState('');

    const [securityQ, setSecurityQ] = useState(db[user!]?.securityQuestion || '');
    const [securityA, setSecurityA] = useState('');

    const [errors, setErrors] = useState<Record<string,string>>({});
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNumericInput = (field: keyof Settings, value: string) => {
        const num = Number(value);
        if (value !== '' && isNaN(num)) return;
        
        const valToTest = value === '' ? 0 : num;
        const result = SettingsSchema.safeParse({ ...settings, [field]: valToTest });
        
        if (!result.success) {
            const fieldError = result.error.formErrors.fieldErrors[field as any];
            if (fieldError) setErrors(prev => ({...prev, [field]: fieldError[0]}));
        } else {
             setErrors(prev => ({...prev, [field]: ''}));
        }

        if (value === '') return;

        if (field === 'hourlyRate') {
            const today = new Date().toISOString().split('T')[0];
            const newHistory = [...(settings.rateHistory || [])];
            const existingIdx = newHistory.findIndex(h => h.date === today);
            if (existingIdx >= 0) {
                newHistory[existingIdx].hourlyRate = num;
            } else {
                newHistory.push({ date: today, hourlyRate: num });
            }
            updateUser({...settings, hourlyRate: num, rateHistory: newHistory });
        } else {
            updateUser({...settings, [field]: num});
        }
    };

    const handleUpdateSecurity = async () => {
        if (!securityQ.trim() || !securityA.trim()) return;
        const hashedA = await hashPassword(securityA.trim().toLowerCase());
        updateUser(undefined, undefined, { q: securityQ, a: hashedA });
        alert("Seguridad actualizada correctamente.");
        setSecurityA('');
    };

    const handleAddConcept = () => {
        if (!newConceptName.trim() || !newConceptAmount) return;
        const amount = Number(newConceptAmount);
        if (isNaN(amount) || amount <= 0) return;

        const newConcept: NonRemunerativeConcept = {
            id: Date.now().toString(),
            name: newConceptName.trim(),
            amount: amount
        };

        const currentConcepts = settings.nonRemunerativeConcepts || [];
        updateUser({ ...settings, nonRemunerativeConcepts: [...currentConcepts, newConcept] });
        setNewConceptName('');
        setNewConceptAmount('');
    };

    const handleRemoveConcept = (id: string) => {
        const currentConcepts = settings.nonRemunerativeConcepts || [];
        const filtered = currentConcepts.filter(c => c.id !== id);
        updateUser({ ...settings, nonRemunerativeConcepts: filtered });
    };

    const exportBackup = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db));
        const anchor = document.createElement('a');
        anchor.href = dataStr;
        anchor.download = `control_horas_backup_${new Date().toISOString().split('T')[0]}.json`;
        anchor.click();
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const importedDb = JSON.parse(e.target?.result as string);
              // Validación Zod más estricta para backups
              if (validateBackup(importedDb)) {
                 setDb(importedDb);
                 alert("Backup cargado exitosamente.");
              } else {
                 alert("Error: El archivo de backup no tiene el formato válido.");
              }
            } catch (err) {
              alert("Error al procesar el archivo.");
            }
          };
          reader.readAsText(file);
        }
    };

    const handleAddNewUser = async () => {
        if (!newUsername.trim() || !newUserPassword.trim()) return;
        const lowerUser = newUsername.toLowerCase().trim();
        if (db[lowerUser]) { alert("Usuario existente"); return; }
        
        const hashedPassword = await hashPassword(newUserPassword);
        
        setDb(prev => ({
          ...prev,
          [lowerUser]: {
            username: lowerUser,
            password: hashedPassword,
            settings: { ...settings, employeeName: newUsername.toUpperCase() }, 
            logs: {}
          }
        }));
        setNewUsername(''); setNewUserPassword(''); setIsCreatingUser(false);
    };

    const handleStartEdit = (user: UserProfile) => {
        setEditingTarget(user.username);
        setEditName(user.settings.employeeName);
        setEditPass('');
        setIsCreatingUser(false);
    };

    const handleSaveEdit = async () => {
        if (!editingTarget) return;
        
        let finalPassword = db[editingTarget].password;
        if (editPass.trim().length > 0) {
            finalPassword = await hashPassword(editPass);
        }

        setDb(prev => ({
            ...prev,
            [editingTarget]: {
                ...prev[editingTarget],
                password: finalPassword,
                settings: {
                    ...prev[editingTarget].settings,
                    employeeName: editName.toUpperCase()
                }
            }
        }));
        setEditingTarget(null);
    };

    const handleDeleteUser = (username: string) => {
        if (username === 'admin') return;
        if (window.confirm(`¿Está seguro de eliminar al usuario ${username}? Esta acción no se puede deshacer.`)) {
            setDb(prev => {
                const next = { ...prev };
                delete next[username];
                return next;
            });
        }
    };

    const toggleTheme = () => {
        const newTheme = settings.themeMode === 'light' ? 'dark' : 'light';
        updateUser({...settings, themeMode: newTheme});
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in">
          <div className="bg-slate-900 dark:bg-slate-900 bg-white p-10 rounded-[3.5rem] w-full max-w-6xl border border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar relative transition-colors duration-300">
            <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={32}/></button>
            <h2 className="text-2xl font-black uppercase dark:text-white text-slate-900 mb-10 flex items-center gap-3">Configuración Avanzada</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              
              {/* --- COL 1: Datos y Seguridad --- */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><User size={14}/> Perfil</h3>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase">Nombre</label>
                    <input type="text" value={settings.employeeName} onChange={e => updateUser({...settings, employeeName: e.target.value.toUpperCase()})} className="w-full bg-slate-800 dark:bg-slate-800 bg-slate-100 border border-slate-700 dark:text-white text-slate-900 p-4 rounded-xl font-bold" />
                  </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Shield size={14}/> Recuperación</h3>
                    <div className="bg-slate-950/50 dark:bg-slate-950/50 bg-slate-50 p-4 rounded-2xl border border-slate-800 space-y-3">
                        <input type="text" placeholder="Pregunta (ej: Nombre primer mascota)" value={securityQ} onChange={e => setSecurityQ(e.target.value)} className="w-full bg-slate-800 dark:bg-slate-800 bg-white border border-slate-700 rounded-lg p-2 text-xs dark:text-white text-slate-900"/>
                        <input type="password" placeholder="Respuesta Secreta" value={securityA} onChange={e => setSecurityA(e.target.value)} className="w-full bg-slate-800 dark:bg-slate-800 bg-white border border-slate-700 rounded-lg p-2 text-xs dark:text-white text-slate-900"/>
                        <button onClick={handleUpdateSecurity} className="w-full bg-indigo-600 text-white text-[9px] font-bold p-2 rounded-lg uppercase">Guardar Seguridad</button>
                    </div>
                </div>
                
                <div className="space-y-4">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Palette size={14}/> Tema</h3>
                   <button onClick={toggleTheme} className="w-full flex items-center justify-between bg-slate-800 dark:bg-slate-800 bg-slate-100 p-4 rounded-xl border border-slate-700">
                      <span className="text-xs font-bold dark:text-white text-slate-900 uppercase">Modo {settings.themeMode === 'light' ? 'Claro' : 'Oscuro'}</span>
                      {settings.themeMode === 'light' ? <Sun size={18} className="text-amber-500"/> : <Moon size={18} className="text-indigo-400"/>}
                   </button>
                </div>
              </div>

              {/* --- COL 2: Tasas y Reglas --- */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Calculator size={14}/> Valores</h3>
                  <div className="space-y-4 bg-slate-950/50 dark:bg-slate-950/50 bg-slate-50 p-6 rounded-2xl border border-slate-800">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-600 uppercase">Hora ($)</label>
                      <SmartInput type="number" min="0" value={settings.hourlyRate} onChange={(val: string) => handleNumericInput('hourlyRate', val)} className="w-full bg-slate-800 dark:bg-slate-800 bg-white border border-slate-700 p-3 rounded-lg dark:text-white text-slate-900 font-bold"/>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-600 uppercase flex items-center gap-1"><Target size={10} /> Meta Mensual ($)</label>
                        <SmartInput type="number" min="0" value={settings.monthlyIncomeGoal || 0} onChange={(val: string) => handleNumericInput('monthlyIncomeGoal', val)} className="w-full bg-slate-800 dark:bg-slate-800 bg-white border border-slate-700 p-3 rounded-lg dark:text-white text-slate-900 font-bold border-l-4 border-l-emerald-500"/>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2"><Gauge size={14}/> Multiplicadores</h3>
                  <div className="flex gap-4">
                    <div className="space-y-1 flex-1">
                      <label className="text-[8px] font-black text-slate-600 uppercase">Extras Comunes</label>
                      <SmartInput type="number" step="0.1" value={settings.multiplier50 || 1.5} onChange={(val: string) => handleNumericInput('multiplier50', val)} className="w-full bg-slate-800 dark:bg-slate-800 bg-white border border-slate-700 p-2 rounded-lg dark:text-white text-slate-900 font-bold text-center"/>
                    </div>
                    <div className="space-y-1 flex-1">
                      <label className="text-[8px] font-black text-slate-600 uppercase">Feriado/Sáb</label>
                      <SmartInput type="number" step="0.1" value={settings.multiplier100 || 2.0} onChange={(val: string) => handleNumericInput('multiplier100', val)} className="w-full bg-slate-800 dark:bg-slate-800 bg-white border border-slate-700 p-2 rounded-lg dark:text-white text-slate-900 font-bold text-center"/>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2 border-t border-slate-800">
                      <div className="space-y-1 flex-1">
                          <label className="text-[8px] font-black text-indigo-400 uppercase flex items-center gap-1"><MoonIcon size={8}/> Nocturnidad</label>
                          <SmartInput type="number" step="0.05" value={settings.multiplierNight || 1.15} onChange={(val: string) => handleNumericInput('multiplierNight', val)} className="w-full bg-slate-800 dark:bg-slate-800 bg-white border border-slate-700 p-2 rounded-lg dark:text-white text-slate-900 font-bold text-center"/>
                      </div>
                  </div>
                </div>
              </div>

              {/* --- COL 3: Deducciones y Adicionales --- */}
              <div className="space-y-8">
                 <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2"><Percent size={14}/> Deducciones Ley</h3>
                  <div className="space-y-3 bg-slate-950/50 dark:bg-slate-950/50 bg-slate-50 p-6 rounded-2xl border border-slate-800">
                    <div className="flex justify-between items-center gap-4">
                      <label className="text-[8px] font-black text-slate-600 uppercase">Jubilación</label>
                      <SmartInput type="number" step="0.1" value={settings.deductionJub} onChange={(val: string) => handleNumericInput('deductionJub', val)} className="w-16 bg-slate-800 dark:bg-slate-800 bg-white border border-slate-700 p-2 rounded-lg dark:text-white text-slate-900 font-bold text-center"/>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <label className="text-[8px] font-black text-slate-600 uppercase">Ley 19032</label>
                      <SmartInput type="number" step="0.1" value={settings.deductionLey} onChange={(val: string) => handleNumericInput('deductionLey', val)} className="w-16 bg-slate-800 dark:bg-slate-800 bg-white border border-slate-700 p-2 rounded-lg dark:text-white text-slate-900 font-bold text-center"/>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <label className="text-[8px] font-black text-slate-600 uppercase">Obra Social</label>
                      <SmartInput type="number" step="0.1" value={settings.deductionOS} onChange={(val: string) => handleNumericInput('deductionOS', val)} className="w-16 bg-slate-800 dark:bg-slate-800 bg-white border border-slate-700 p-2 rounded-lg dark:text-white text-slate-900 font-bold text-center"/>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><Coins size={14}/> Conceptos No Rem.</h3>
                    <div className="space-y-2 bg-slate-950/50 dark:bg-slate-950/50 bg-slate-50 p-4 rounded-2xl border border-slate-800">
                         {settings.nonRemunerativeConcepts?.map((concept) => (
                             <div key={concept.id} className="flex justify-between items-center bg-slate-800 dark:bg-slate-800 bg-white p-2 rounded-lg border border-slate-700">
                                 <div className="flex flex-col">
                                     <span className="text-[9px] font-black text-slate-300 dark:text-slate-300 text-slate-900 uppercase">{concept.name}</span>
                                     <span className="text-[10px] font-bold text-emerald-400">{formatCurrency(concept.amount)}</span>
                                 </div>
                                 <button onClick={() => handleRemoveConcept(concept.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={12}/></button>
                             </div>
                         ))}
                         <div className="flex gap-2 mt-2">
                             <input type="text" placeholder="Concepto" value={newConceptName} onChange={e => setNewConceptName(e.target.value)} className="flex-[2] bg-slate-800 dark:bg-slate-800 bg-white border border-slate-700 rounded-lg px-2 py-1 text-[9px] dark:text-white text-slate-900 font-bold"/>
                             <input type="number" placeholder="$" value={newConceptAmount} onChange={e => setNewConceptAmount(e.target.value)} className="flex-1 bg-slate-800 dark:bg-slate-800 bg-white border border-slate-700 rounded-lg px-2 py-1 text-[9px] dark:text-white text-slate-900 font-bold"/>
                             <button onClick={handleAddConcept} className="bg-indigo-600 text-white rounded-lg p-1.5 hover:bg-indigo-500"><Plus size={14}/></button>
                         </div>
                    </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2"><Download size={14}/> Backup Base</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={exportBackup} className="bg-slate-800 border border-slate-700 text-[8px] p-3 rounded-xl font-black uppercase hover:bg-slate-700 text-white">Exportar</button>
                    <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 border border-slate-700 text-[8px] p-3 rounded-xl font-black uppercase hover:bg-slate-700 text-white">Importar</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
                  </div>
                </div>
              </div>

              {/* --- COL 4 --- */}
              <div className="space-y-8">
                {isAdmin && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><UserCog size={14}/> Usuarios</h3>
                    {!isCreatingUser ? (
                        <button onClick={() => { setIsCreatingUser(true); setEditingTarget(null); }} className="w-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white p-4 rounded-2xl font-black text-[10px] uppercase gap-2 flex justify-center"><UserPlus size={16}/> Nuevo Usuario</button>
                    ) : (
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2 animate-in fade-in">
                          <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Usuario" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-lg text-xs text-white"/>
                          <input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Pass" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-lg text-xs text-white"/>
                          <div className="flex gap-2">
                              <button onClick={() => setIsCreatingUser(false)} className="flex-1 bg-slate-800 text-slate-400 p-2 rounded-lg text-[9px] font-bold">Cancelar</button>
                              <button onClick={handleAddNewUser} className="flex-1 bg-indigo-600 text-white p-2 rounded-lg text-[9px] font-bold">Crear</button>
                          </div>
                        </div>
                    )}

                    {/* LISTA DE USUARIOS */}
                    <div className="space-y-2 mt-4 max-h-60 overflow-y-auto no-scrollbar">
                        {Object.values(db).map((user: UserProfile) => {
                            if (editingTarget === user.username) {
                                return (
                                    <div key={user.username} className="bg-slate-950/50 p-3 rounded-xl border border-indigo-500 space-y-2 animate-in fade-in">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] font-black text-indigo-400 uppercase">Editando: {user.username}</span>
                                            <button onClick={() => setEditingTarget(null)} className="text-slate-500 hover:text-white"><X size={12}/></button>
                                        </div>
                                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre Empleado" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-lg text-xs text-white font-bold"/>
                                        <input type="password" value={editPass} onChange={e => setEditPass(e.target.value)} placeholder="Nueva Pass (Opcional)" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-lg text-xs text-white"/>
                                        <button onClick={handleSaveEdit} className="w-full bg-indigo-600 text-white p-2 rounded-lg text-[9px] font-bold uppercase flex items-center justify-center gap-2"><Save size={12}/> Guardar</button>
                                    </div>
                                );
                            }

                            return (
                                <div key={user.username} className="flex items-center justify-between bg-slate-800/50 border border-slate-800 p-3 rounded-xl group hover:bg-slate-800 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 font-bold uppercase text-xs">
                                            {user.username.substring(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-200">{user.username}</p>
                                            <p className="text-[8px] font-black text-slate-500 uppercase">{user.settings.employeeName}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleStartEdit(user)} className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-700 rounded-lg transition-all" title="Editar"><Edit2 size={14}/></button>
                                        {user.username !== 'admin' && (
                                            <button onClick={() => handleDeleteUser(user.username)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-all" title="Eliminar"><Trash2 size={14}/></button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                  </div>
                )}
                
                <button onClick={onClose} className={`w-full ${themeClass} text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4`}>Cerrar y Guardar</button>
              </div>
            </div>
          </div>
        </div>
    );
};
