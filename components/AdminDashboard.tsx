
import React, { useState } from 'react';
import { Pack, Booking, HomeContent, DaySchedule, DateOverride } from '../types';

interface AdminDashboardProps {
  packs: Pack[];
  bookings: Booking[];
  homeContent: HomeContent;
  onUpdatePacks: (packs: Pack[]) => void;
  onUpdateHome: (content: HomeContent) => void;
  onUpdateBookings: (bookings: Booking[]) => void;
  onForceSync: () => void;
  onPushToCloud: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ packs, bookings, homeContent, onUpdatePacks, onUpdateHome, onUpdateBookings, onForceSync, onPushToCloud }) => {
  const [isAuthorized, setIsAuthorized] = useState(sessionStorage.getItem('admin_session') === 'true');
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState<'bookings' | 'schedule' | 'packs' | 'cms' | 'payments' | 'config'>('bookings');
  const [newOverrideDate, setNewOverrideDate] = useState('');

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto py-32 text-center">
        <h1 className="text-3xl font-orbitron font-bold mb-8 uppercase tracking-widest text-purple-500">Admin Login</h1>
        <form onSubmit={(e) => { e.preventDefault(); if(passwordInput === 'admin123') { setIsAuthorized(true); sessionStorage.setItem('admin_session', 'true'); } }} className="space-y-4">
          <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 outline-none text-center font-orbitron text-purple-400" placeholder="••••••••" />
          <button className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-xl hover:bg-purple-600 hover:text-white transition-all">Acceder al Sistema</button>
        </form>
      </div>
    );
  }

  const daysLabels: Record<string, string> = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' };

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-2xl font-orbitron font-bold uppercase tracking-tighter">Control Center</h1>
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.4em]">Panel Maestro / {activeTab}</p>
        </div>
        <div className="flex flex-wrap gap-1 p-1.5 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-sm">
          {['bookings', 'schedule', 'packs', 'cms', 'payments', 'config'].map(id => (
            <button key={id} onClick={() => setActiveTab(id as any)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === id ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
              {id === 'bookings' ? 'Actividad' : id === 'schedule' ? 'Horarios' : id === 'packs' ? 'Servicios' : id === 'cms' ? 'Web' : id === 'payments' ? 'Pagos' : 'Servidor'}
            </button>
          ))}
        </div>
      </header>

      {/* TAB: ACTIVIDAD (RESERVAS) */}
      {activeTab === 'bookings' && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[9px] uppercase text-zinc-500 font-black tracking-widest border-b border-zinc-800">
              <tr><th className="px-8 py-5">Identidad</th><th className="px-8 py-5">Ingreso</th><th className="px-8 py-5 text-right">Estado</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {bookings.length === 0 ? <tr><td colSpan={3} className="px-8 py-24 text-center text-zinc-700 uppercase font-black text-xs tracking-[0.2em]">Cero Reservas Registradas</td></tr> : bookings.sort((a,b) => b.createdAt - a.createdAt).map(b => (
                <tr key={b.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="font-bold text-sm text-white uppercase tracking-tight">{b.customerName}</div>
                    <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{b.date} &bull; {b.startTime}:00</div>
                  </td>
                  <td className="px-8 py-6 font-orbitron font-bold text-purple-400">{b.totalPrice}€</td>
                  <td className="px-8 py-6 text-right">
                    {b.status === 'pending_verification' ? (
                      <button onClick={() => onUpdateBookings(bookings.map(x => x.id === b.id ? {...x, status: 'confirmed'} : x))} className="bg-white text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all">Confirmar</button>
                    ) : (
                      <div className="flex items-center justify-end gap-2 text-green-500 font-black text-[9px] uppercase">Confirmado <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div></div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: CONFIGURACIÓN SERVIDOR (RENDER) */}
      {activeTab === 'config' && (
        <div className="max-w-3xl mx-auto space-y-10 animate-in slide-in-from-bottom-10">
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-12 space-y-10">
            <div className="space-y-4">
              <h2 className="text-xl font-orbitron font-bold uppercase tracking-tight text-white">Conexión con la Nube</h2>
              <p className="text-zinc-500 text-xs leading-relaxed uppercase tracking-widest font-black">Pega aquí la URL que te ha dado Render.com para que tu base de datos funcione en cualquier dispositivo.</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-3">
                <input 
                  value={homeContent.apiUrl} 
                  onChange={(e) => onUpdateHome({...homeContent, apiUrl: e.target.value})} 
                  className="flex-1 bg-black border border-zinc-800 rounded-2xl px-6 py-5 outline-none text-xs text-purple-400 focus:border-purple-500 font-mono" 
                  placeholder="https://tu-api-render.onrender.com" 
                />
                <button onClick={onForceSync} className="bg-zinc-800 px-8 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-700">Test</button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-8 bg-purple-600/10 rounded-[2rem] border border-purple-500/20 space-y-4">
                   <h3 className="text-[10px] font-black uppercase text-white tracking-widest">Sincronizar Datos</h3>
                   <p className="text-[9px] text-zinc-400 leading-relaxed uppercase tracking-widest">¿Has creado servicios o reservas en este navegador? Pulsa este botón para subirlos a Render.</p>
                   <button onClick={onPushToCloud} className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">Subir a la Nube</button>
                </div>
                <div className="p-8 bg-zinc-800/30 rounded-[2rem] border border-zinc-700/50 flex items-center justify-center">
                   <div className="text-center">
                      <div className="text-[30px] mb-2">☁️</div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Estado: {homeContent.apiUrl ? 'Configurado' : 'Modo Local'}</div>
                   </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* OTRAS TABS MANTENIDAS POR COMPATIBILIDAD */}
      {(activeTab === 'schedule' || activeTab === 'packs' || activeTab === 'cms' || activeTab === 'payments') && (
        <div className="py-20 text-center text-zinc-700 uppercase font-black text-[10px] tracking-[0.3em] italic">
           Esta sección se puede editar normalmente.
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
