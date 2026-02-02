
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

  const daysLabels: Record<string, string> = { 
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', 
    thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' 
  };

  const handleUpdateSchedule = (day: string, updates: Partial<DaySchedule>) => {
    const newAvailability = { ...homeContent.availability, [day]: { ...homeContent.availability[day as keyof typeof homeContent.availability], ...updates } };
    onUpdateHome({ ...homeContent, availability: newAvailability as any });
  };

  const handleAddOverride = () => {
    if (!newOverrideDate) return;
    const newOverrides = [...homeContent.availability.overrides, { date: newOverrideDate, schedule: { isOpen: false, start: 10, end: 22 } }];
    onUpdateHome({ ...homeContent, availability: { ...homeContent.availability, overrides: newOverrides } });
    setNewOverrideDate('');
  };

  const handleUpdatePack = (id: string, updates: Partial<Pack>) => {
    onUpdatePacks(packs.map(p => p.id === id ? { ...p, ...updates } : p));
  };

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
                    <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{b.date} &bull; {b.startTime}:00 ({b.duration}h)</div>
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

      {/* TAB: HORARIOS */}
      {activeTab === 'schedule' && (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-8 border-b border-zinc-800 pb-4">Horario Semanal</h2>
            <div className="space-y-6">
              {Object.entries(daysLabels).map(([key, label]) => {
                const day = homeContent.availability[key as keyof typeof homeContent.availability] as DaySchedule;
                return (
                  <div key={key} className="flex items-center justify-between gap-4 p-4 bg-black/20 rounded-2xl border border-zinc-800/50">
                    <div className="w-24 font-bold text-xs uppercase">{label}</div>
                    <div className="flex items-center gap-2">
                      <input type="number" value={day.start} onChange={(e) => handleUpdateSchedule(key, { start: Number(e.target.value) })} className="w-16 bg-zinc-800 border-none rounded-lg p-2 text-xs text-center" min="0" max="23" />
                      <span className="text-zinc-600">-</span>
                      <input type="number" value={day.end} onChange={(e) => handleUpdateSchedule(key, { end: Number(e.target.value) })} className="w-16 bg-zinc-800 border-none rounded-lg p-2 text-xs text-center" min="0" max="23" />
                    </div>
                    <button 
                      onClick={() => handleUpdateSchedule(key, { isOpen: !day.isOpen })}
                      className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${day.isOpen ? 'bg-green-600/20 text-green-500 border border-green-500/30' : 'bg-red-600/20 text-red-500 border border-red-500/30'}`}
                    >
                      {day.isOpen ? 'Abierto' : 'Cerrado'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-8 border-b border-zinc-800 pb-4">Cierres Especiales</h2>
            <div className="flex gap-2 mb-6">
              <input type="date" value={newOverrideDate} onChange={(e) => setNewOverrideDate(e.target.value)} className="flex-1 bg-zinc-800 border-none rounded-xl p-3 text-xs" />
              <button onClick={handleAddOverride} className="bg-purple-600 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest">Añadir</button>
            </div>
            <div className="space-y-2">
              {homeContent.availability.overrides.map((ov, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                  <span className="font-mono text-xs">{ov.date}</span>
                  <button 
                    onClick={() => {
                      const updated = homeContent.availability.overrides.filter((_, i) => i !== idx);
                      onUpdateHome({ ...homeContent, availability: { ...homeContent.availability, overrides: updated } });
                    }} 
                    className="text-red-500 text-[10px] font-black uppercase"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: SERVICIOS (PACKS) */}
      {activeTab === 'packs' && (
        <div className="grid md:grid-cols-2 gap-6">
          {packs.map(pack => (
            <div key={pack.id} className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex justify-between items-start">
                <input value={pack.icon} onChange={(e) => handleUpdatePack(pack.id, { icon: e.target.value })} className="text-4xl bg-transparent border-none w-16" />
                <button onClick={() => handleUpdatePack(pack.id, { isActive: !pack.isActive })} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest ${pack.isActive ? 'bg-green-500/20 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                  {pack.isActive ? 'Activo' : 'Pausado'}
                </button>
              </div>
              <input value={pack.name} onChange={(e) => handleUpdatePack(pack.id, { name: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-tight focus:border-purple-500 outline-none" placeholder="Nombre del Pack" />
              <textarea value={pack.description} onChange={(e) => handleUpdatePack(pack.id, { description: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-400 h-24 resize-none outline-none focus:border-purple-500" placeholder="Descripción" />
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-[8px] font-black uppercase text-zinc-600 mb-1 ml-2">Precio/Hora</label>
                  <input type="number" value={pack.pricePerHour} onChange={(e) => handleUpdatePack(pack.id, { pricePerHour: Number(e.target.value) })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold font-orbitron text-purple-400 outline-none" />
                </div>
              </div>
            </div>
          ))}
          <button className="bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4 text-zinc-600 hover:text-purple-500 hover:border-purple-500/50 transition-all group">
            <span className="text-4xl group-hover:scale-110 transition-transform">+</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Añadir Nuevo Servicio</span>
          </button>
        </div>
      )}

      {/* TAB: CMS (WEB) */}
      {activeTab === 'cms' && (
        <div className="max-w-4xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-12 space-y-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest ml-1">Nombre del Estudio</label>
              <input value={homeContent.studioName} onChange={(e) => onUpdateHome({ ...homeContent, studioName: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-purple-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest ml-1">Email de Contacto</label>
              <input value={homeContent.adminEmail} onChange={(e) => onUpdateHome({ ...homeContent, adminEmail: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none focus:border-purple-500 transition-all" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest ml-1">Título Principal (Hero)</label>
            <textarea value={homeContent.heroTitle} onChange={(e) => onUpdateHome({ ...homeContent, heroTitle: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-2xl font-orbitron font-bold outline-none focus:border-purple-500 transition-all h-32" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest ml-1">Subtítulo Hero</label>
            <textarea value={homeContent.heroSubtitle} onChange={(e) => onUpdateHome({ ...homeContent, heroSubtitle: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-zinc-400 outline-none focus:border-purple-500 transition-all h-24" />
          </div>
        </div>
      )}

      {/* TAB: PAGOS */}
      {activeTab === 'payments' && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Bizum</h3>
              <input type="checkbox" checked={homeContent.payments.bizumEnabled} onChange={(e) => onUpdateHome({ ...homeContent, payments: { ...homeContent.payments, bizumEnabled: e.target.checked } })} className="w-5 h-5 accent-purple-600" />
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase text-zinc-600 tracking-widest">Número de Teléfono</label>
              <input value={homeContent.payments.bizumPhone} onChange={(e) => onUpdateHome({ ...homeContent, payments: { ...homeContent.payments, bizumPhone: e.target.value } })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500" />
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Revolut</h3>
              <input type="checkbox" checked={homeContent.payments.revolutEnabled} onChange={(e) => onUpdateHome({ ...homeContent, payments: { ...homeContent.payments, revolutEnabled: e.target.checked } })} className="w-5 h-5 accent-purple-600" />
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-zinc-600 tracking-widest">Enlace (Revolut.me)</label>
                <input value={homeContent.payments.revolutLink} onChange={(e) => onUpdateHome({ ...homeContent, payments: { ...homeContent.payments, revolutLink: e.target.value } })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-purple-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-zinc-600 tracking-widest">Tag (@usuario)</label>
                <input value={homeContent.payments.revolutTag} onChange={(e) => onUpdateHome({ ...homeContent, payments: { ...homeContent.payments, revolutTag: e.target.value } })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-purple-500" />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6 border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.05)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-purple-400">Mollie Pro</h3>
              <input type="checkbox" checked={homeContent.payments.mollieEnabled} onChange={(e) => onUpdateHome({ ...homeContent, payments: { ...homeContent.payments, mollieEnabled: e.target.checked } })} className="w-5 h-5 accent-purple-600" />
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase text-zinc-600 tracking-widest">API Key (Live/Test)</label>
              <input type="password" value={homeContent.payments.mollieApiKey} onChange={(e) => onUpdateHome({ ...homeContent, payments: { ...homeContent.payments, mollieApiKey: e.target.value } })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-purple-500 text-purple-400" />
              <p className="text-[7px] uppercase font-black tracking-tighter text-zinc-600 mt-2">Usado para Tarjeta, Apple Pay y Google Pay.</p>
            </div>
          </div>
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
    </div>
  );
};

export default AdminDashboard;
