import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Store, User, Lock, ArrowRight, Delete } from 'lucide-react';
import { NEGOCIO } from '@/data/seed';
import { playBeep, playErrorSound } from '@/utils';
import type { Usuario } from '@/types';

interface LoginScreenProps {
  onLogin: (usuario: Usuario) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { usuarios, setUsuarioActual } = useApp();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    const user = usuarios.find((u) => u.id === selectedUser);
    if (user && user.pin === pin) {
      playBeep(1000, 100);
      setUsuarioActual(user);
      onLogin(user);
    } else {
      playErrorSound();
      setError(true);
      setTimeout(() => {
        setError(false);
        setPin('');
      }, 800);
    }
  };

  const handleDigit = (d: string) => {
    if (pin.length < 4) {
      playBeep(900, 50);
      setPin(pin + d);
    }
  };

  const handleDelete = () => {
    playBeep(500, 50);
    setPin(pin.slice(0, -1));
  };

  const selectedUserObj = usuarios.find((u) => u.id === selectedUser);

  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500 mb-4 shadow-lg shadow-emerald-500/30">
              <Store size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">{NEGOCIO.nombre}</h1>
            <p className="text-slate-400 mt-2">Sistema de Punto de Venta</p>
            <p className="text-slate-500 text-sm mt-1">RUC: {NEGOCIO.ruc}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <p className="text-white text-center mb-5 font-semibold">Seleccione su usuario</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {usuarios.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    playBeep(800, 60);
                    setSelectedUser(user.id);
                  }}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500/20 hover:border-emerald-400/50 transition-all duration-200 group"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User size={26} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">{user.nombre}</p>
                    <p className="text-slate-400 text-xs uppercase tracking-wide mt-1">{user.rol}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 mb-4 shadow-lg shadow-emerald-500/30">
            <Lock size={30} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">{selectedUserObj?.nombre}</h2>
          <p className="text-slate-400 text-sm mt-1">Ingrese su PIN de 4 dígitos</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
          <div className={`flex justify-center gap-3 mb-6 ${error ? 'animate-shake' : ''}`}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all ${
                  error
                    ? 'bg-red-500'
                    : i < pin.length
                    ? 'bg-emerald-400 scale-110'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-center text-sm mb-4 font-semibold">PIN incorrecto</p>
          )}

          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button
                key={d}
                onClick={() => handleDigit(d)}
                className="h-16 rounded-xl bg-white/10 border border-white/10 text-white text-2xl font-bold hover:bg-white/20 active:scale-95 transition-all"
              >
                {d}
              </button>
            ))}
            <button
              onClick={handleDelete}
              className="h-16 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all"
            >
              <Delete size={24} />
            </button>
            <button
              onClick={() => handleDigit('0')}
              className="h-16 rounded-xl bg-white/10 border border-white/10 text-white text-2xl font-bold hover:bg-white/20 active:scale-95 transition-all"
            >
              0
            </button>
            <button
              onClick={handleSubmit}
              disabled={pin.length !== 4}
              className="h-16 rounded-xl bg-emerald-500 border border-emerald-400 text-white flex items-center justify-center hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowRight size={26} />
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedUser(null);
              setPin('');
              setError(false);
            }}
            className="w-full mt-5 text-slate-400 hover:text-white text-sm transition-colors"
          >
            Volver
          </button>
        </div>

        <p className="text-slate-500 text-xs text-center mt-6">
          PIN de demo: Admin 1234 | Cajero 0000 | Supervisor 4321
        </p>
      </div>
    </div>
  );
}
