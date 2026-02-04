
import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, HelpCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { hashPassword } from '../utils/security';
import { useApp } from '../context/AppContext';

export const LoginScreen: React.FC = () => {
  const { db, login, setDb } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  
  // Recovery State
  const [isRecovery, setIsRecovery] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<1|2>(1); // 1: identify, 2: answer
  const [recoveryUser, setRecoveryUser] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = db[username.toLowerCase().trim()];
    if (!user) {
      setError(true);
      return;
    }

    const hashedInput = await hashPassword(password);
    if (user.password === password || user.password === hashedInput) {
       login(user.username);
    } else {
       setError(true);
    }
  };

  const handleRecoveryCheckUser = () => {
    const user = db[recoveryUser.toLowerCase().trim()];
    if (user && user.securityQuestion) {
        setRecoveryStep(2);
        setRecoveryError('');
    } else {
        setRecoveryError('Usuario no encontrado o sin seguridad configurada.');
    }
  };

  const handleRecoveryReset = async () => {
      const userKey = recoveryUser.toLowerCase().trim();
      const user = db[userKey];
      const hashedAnswer = await hashPassword(securityAnswer.trim().toLowerCase());
      
      if (user && user.securityAnswerHash === hashedAnswer) {
          const newPassHash = await hashPassword(newPassword);
          setDb(prev => ({
              ...prev,
              [userKey]: {
                  ...prev[userKey],
                  password: newPassHash
              }
          }));
          alert("Contraseña restablecida exitosamente.");
          setIsRecovery(false);
          setRecoveryStep(1);
          setRecoveryUser('');
          setSecurityAnswer('');
          setNewPassword('');
      } else {
          setRecoveryError('Respuesta incorrecta.');
      }
  };

  if (isRecovery) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-800 animate-view">
                <div className="bg-slate-800 p-6 flex items-center gap-4">
                    <button onClick={() => setIsRecovery(false)} className="text-white hover:text-indigo-400"><ArrowLeft/></button>
                    <h2 className="text-xl font-black text-white uppercase">Recuperar Cuenta</h2>
                </div>
                <div className="p-8 space-y-6">
                    {recoveryStep === 1 ? (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-400">Ingrese su nombre de usuario para buscar su pregunta de seguridad.</p>
                            <input type="text" placeholder="Usuario" value={recoveryUser} onChange={e => setRecoveryUser(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl text-white font-bold"/>
                            {recoveryError && <p className="text-red-400 text-xs font-bold">{recoveryError}</p>}
                            <button onClick={handleRecoveryCheckUser} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl uppercase">Buscar</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/30">
                                <p className="text-[10px] text-indigo-400 font-black uppercase">Pregunta de Seguridad</p>
                                <p className="text-white font-bold mt-1">{db[recoveryUser.toLowerCase().trim()]?.securityQuestion}</p>
                            </div>
                            <input type="text" placeholder="Su Respuesta" value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl text-white font-bold"/>
                            <input type="password" placeholder="Nueva Contraseña" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl text-white font-bold"/>
                            {recoveryError && <p className="text-red-400 text-xs font-bold">{recoveryError}</p>}
                            <button onClick={handleRecoveryReset} className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl uppercase">Restablecer</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-800 animate-view">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 text-center text-white">
            <ShieldCheck size={48} className="mx-auto mb-4" />
            <h2 className="text-3xl font-black uppercase tracking-tighter">Control de Horas</h2>
            <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mt-2">Seguridad AES-GCM &bull; Multi-Año</p>
          </div>
          <form onSubmit={handleSubmit} className="p-10 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase px-2">Nombre de Usuario</label>
              <input type="text" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-5 rounded-2xl outline-none text-white focus:ring-2 ring-indigo-500 font-bold" required/>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase px-2">Contraseña</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-5 rounded-2xl outline-none text-white focus:ring-2 ring-indigo-500 font-bold" required/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                </button>
              </div>
            </div>
            {error && <p className="text-red-400 text-center font-bold text-xs bg-red-400/10 py-3 rounded-xl">Credenciales Inválidas</p>}
            <button className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest shadow-xl shadow-indigo-600/20">Entrar al Sistema</button>
            
            <button type="button" onClick={() => setIsRecovery(true)} className="w-full text-slate-500 hover:text-white text-xs font-bold flex items-center justify-center gap-2 py-2">
                <HelpCircle size={14}/> Olvidé mi contraseña
            </button>
          </form>
          <p className="text-center pb-8 text-[10px] text-slate-600 font-bold uppercase tracking-widest">© 2026 Payroll Systems Inc.</p>
        </div>
      </div>
  );
};
