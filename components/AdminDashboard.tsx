
import React, { useState } from 'react';
import { Pack, Booking, HomeContent, DaySchedule } from '../types';

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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  packs, bookings, homeContent, onUpdatePacks, onUpdateHome, onUpdateBookings, onForceSync, onPushToCloud 
}) => {
  const [isAuthorized, setIsAuthorized] = useState(sessionStorage.getItem('admin_session') === 'true');
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState<'bookings' | 'schedule' | 'packs' | 'cms' | 'payments' | 'config'>('bookings');
  const [newOverrideDate, setNewOverrideDate] = useState('');

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto py-32 text-center">
        <h1 className="text-3xl font-orbitron font-bold mb-8 uppercase tracking-widest text-purple-500">Admin Login</h1>
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          if(passwordInput === 'admin123') { 
            setIsAuthorized(true); 
            sessionStorage.setItem('admin_session', 'true'); 
          } else {
            alert("Contraseña incorrecta");
          }
        }} className="space-y-4">
          <input 
            type="password" 
            value={passwordInput} 
            onChange={(e) => setPasswordInput(e.target.value)} 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 outline-none text-center font-orbitron text-purple-400" 
            placeholder="••••••••" 
          />
          <button className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-xl hover:bg-purple-600 hover:text-white transition-all">
            Acceder al Sistema
          </button>
        </form>
      </div>
    );
  }

  const daysLabels: Record<string, string> = { 
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', 
    thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' 
  };

  const handleUpdateSchedule = (day: string, updates: Partial<DaySchedule>) => {
    const currentDay = homeContent.availability[day as keyof typeof homeContent.availability] as DaySchedule;
    const newAvailability = { 
      ...homeContent.availability, 
      [day]: { ...currentDay, ...updates } 
    };
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

  const handleAddNewPack = () => {
    const newPack: Pack = {
      id: 'pack-' + Date.now(),
      name: 'Nuevo Servicio',
      description: 'Descripción del servicio...',
      pricePerHour: 20,
      features: ['Característica 1'],
      icon: '🎵',
      isActive: true
    };
    onUpdatePacks([...packs, newPack]);
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-2xl font-orbitron font-bold uppercase tracking-tighter">Panel de Control</h1>
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.4em]">Gestión de Estudio / {activeTab}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-1 p-1.5 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-sm">
          <button onClick={() => setActiveTab('bookings')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'bookings' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-white'}`}>Reservas</button>
          <button onClick={() => setActiveTab('schedule')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'schedule' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-white'}`}>Horarios</button>
          <button onClick={() => setActiveTab('packs')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'packs' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-white'}`}>Servicios</button>
          <button onClick={() => setActiveTab('cms')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'cms' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-white'}`}>Web</button>
          <button onClick={() => setActiveTab('payments')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'payments' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-white'}`}>Pagos</button>
          <button onClick={() => setActiveTab('config')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-white'}`}>Servidor</button>
        </div>
      </header>

      {activeTab === 'bookings' && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[9px] uppercase text-zinc-500 font-black tracking-widest border-b border-zinc-800">
              <tr><th className="px-8 py-5">Cliente</th><th className="px-8 py-5">Precio</th><th className="px-8 py-5 text-right">Estado</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {bookings.length === 0 ? (
                <tr><td colSpan={3} className="px-8 py-24 text-center text-zinc-700 uppercase font-black text-xs tracking-[0.2em]">No hay reservas aún</td></tr>
              ) : bookings.sort((a,b) => b.createdAt - a.createdAt).map(b => (
                <tr key={b.id} className="hover:bg-white/[0.01]">
                  <td className="px-8 py-6">
                    <div className="font-bold text-sm text-white uppercase">{b.customerName}</div>
                    <div className="text-[9px] text-zinc-600 font-black uppercase">{b.date} &bull; {b.startTime}:00 ({b.duration}h)</div>
                  </td>
                  <td className="px-8 py-6 font-orbitron font-bold text-purple-400">{b.totalPrice}€</td>
                  <td className="px-8 py-6 text-right">
                    {b.status === 'pending_verification' ? (
                      <button onClick={() => onUpdateBookings(bookings.map(x => x.id === b.id ? {...x, status: 'confirmed'} : x))} className="bg-white text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-green-600 hover:text-white">Confirmar Pago</button>
                    ) : (
                      <span className="text-green-500 font-black text-[9px] uppercase">Confirmado ✓</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-8 border-b border-zinc-800 pb-4">Horario Semanal</h2>
            <div className="space-y-4">
              {Object.entries(daysLabels).map(([key, label]) => {
                const day = homeContent.availability[key as keyof typeof homeContent.availability] as DaySchedule;
                return (
                  <div key={key} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-zinc-800/50">
                    <div className="w-24 font-bold text-xs uppercase">{label}</div>
                    <div className="flex items-center gap-2">
                      <input type="number" value={day.start} onChange={(e) => handleUpdateSchedule(key, { start: Number(e.target.value) })} className="w-14 bg-zinc-800 rounded-lg p-2 text-xs text-center" />
                      <span className="text-zinc-600">-</span>
                      <input type="number" value={day.end} onChange={(e) => handleUpdateSchedule(key, { end: Number(e.target.value) })} className="w-14 bg-zinc-800 rounded-lg p-2 text-xs text-center" />
                    </div>
                    <button onClick={() => handleUpdateSchedule(key, { isOpen: !day.isOpen })} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase ${day.isOpen ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'}`}>
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
                <input type="date" value={newOverrideDate} onChange={(e) => setNewOverrideDate(e.target.value)} className="flex-1 bg-zinc-800 rounded-xl p-3 text-xs" />
                <button onClick={handleAddOverride} className="bg-purple-600 px-6 rounded-xl text-[9px] font-black uppercase">Añadir</button>
             </div>
             {homeContent.availability.overrides.map((ov, idx) => (
                <div key={idx} className="flex justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-2xl mb-2">
                   <span className="font-mono text-xs">{ov.date}</span>
                   <button onClick={() => {
                      const updated = homeContent.availability.overrides.filter((_, i) => i !== idx);
                      onUpdateHome({ ...homeContent, availability: { ...homeContent.availability, overrides: updated } });
                   }} className="text-red-500 text-[9px] font-black uppercase">Eliminar</button>
                </div>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'packs' && (
        <div className="grid md:grid-cols-2 gap-6">
          {packs.map(pack => (
            <div key={pack.id} className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-4">
              <div className="flex justify-between">
                <input value={pack.icon} onChange={(e) => handleUpdatePack(pack.id, { icon: e.target.value })} className="text-3xl bg-transparent w-12" />
                <button onClick={() => handleUpdatePack(pack.id, { isActive: !pack.isActive })} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase ${pack.isActive ? 'bg-green-500/20 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                  {pack.isActive ? 'Activo' : 'Oculto'}
                </button>
              </div>
              <input value={pack.name} onChange={(e) => handleUpdatePack(pack.id, { name: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold uppercase" />
              <textarea value={pack.description} onChange={(e) => handleUpdatePack(pack.id, { description: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-400 h-20 resize-none" />
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-zinc-600">Precio/Hora:</span>
                <input type="number" value={pack.pricePerHour} onChange={(e) => handleUpdatePack(pack.id, { pricePerHour: Number(e.target.value) })} className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm font-bold text-purple-400 w-24" />
              </div>
            </div>
          ))}
          <button onClick={handleAddNewPack} className="bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-[2.5rem] p-12 text-zinc-600 hover:text-purple-500 hover:border-purple-500/50 transition-all font-black uppercase text-[10px]">
             + Añadir Nuevo Servicio
          </button>
        </div>
      )}

      {activeTab === 'cms' && (
        <div className="max-w-4xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-10 space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Nombre del Estudio</label>
              <input value={homeContent.studioName} onChange={(e) => onUpdateHome({ ...homeContent, studioName: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Email de Administración</label>
              <input value={homeContent.adminEmail} onChange={(e) => onUpdateHome({ ...homeContent, adminEmail: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Título de la Web (Hero)</label>
            <textarea value={homeContent.heroTitle} onChange={(e) => onUpdateHome({ ...homeContent, heroTitle: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xl font-bold h-24" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Subtítulo de la Web</label>
            <textarea value={homeContent.heroSubtitle} onChange={(e) => onUpdateHome({ ...homeContent, heroSubtitle: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-400 h-24" />
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-white">Bizum</h3>
              <input type="checkbox" checked={homeContent.payments.bizumEnabled} onChange={(e) => onUpdateHome({ ...homeContent, payments: { ...homeContent.payments, bizumEnabled: e.target.checked } })} />
            </div>
            <input value={homeContent.payments.bizumPhone} onChange={(e) => onUpdateHome({ ...homeContent, payments: { ...homeContent.payments, bizumPhone: e.target.value } })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm" placeholder="Teléfono Bizum" />
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-white">Revolut</h3>
              <input type="checkbox" checked={homeContent.payments.revolutEnabled} onChange={(e) => onUpdateHome({ ...homeContent, payments: { ...homeContent.payments, revolutEnabled: e.target.checked } })} />
            </div>
            <input value={homeContent.payments.revolutLink} onChange={(e) => onUpdateHome({ ...homeContent, payments: { ...homeContent.payments, revolutLink: e.target.value } })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs mb-2" placeholder="Enlace Revolut.me" />
            <input value={homeContent.payments.revolutTag} onChange={(e) => onUpdateHome({ ...homeContent, payments: { ...homeContent.payments, revolutTag: e.target.value } })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs" placeholder="Tag @usuario" />
          </div>
          <div className="bg-zinc-900/50 border border-purple-500/20 rounded-[2.5rem] p-8 space-y-4 shadow-[0_0_20px_rgba(168,85,247,0.05)]">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-purple-400">Mollie (Tarjetas)</h3>
              <input type="checkbox" checked={homeContent.payments.mollieEnabled} onChange={(e) => onUpdateHome({ ...homeContent, payments: { ...homeContent.payments, mollieEnabled: e.target.checked } })} />
            </div>
            <input type="password" value={homeContent.payments.mollieApiKey} onChange={(e) => onUpdateHome({ ...homeContent, payments: { ...homeContent.payments, mollieApiKey: e.target.value } })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs text-purple-400" placeholder="Mollie API Key" />
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="max-w-2xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-10 space-y-8">
           <h3 className="text-xl font-orbitron font-bold uppercase text-white">Servidor de Datos</h3>
           <div className="space-y-4">
              <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">URL actual del backend (Render):</p>
              <input value={homeContent.apiUrl} onChange={(e) => onUpdateHome({...homeContent, apiUrl: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-6 py-4 text-xs font-mono text-purple-400" />
              <div className="grid grid-cols-2 gap-4 pt-4">
                 <button onClick={onForceSync} className="bg-zinc-800 text-white py-4 rounded-xl font-black uppercase text-[10px]">Descargar Nube ↓</button>
                 <button onClick={onPushToCloud} className="bg-purple-600 text-white py-4 rounded-xl font-black uppercase text-[10px]">Subir a la Nube ↑</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
