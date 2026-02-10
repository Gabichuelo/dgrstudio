
import React, { useState, useMemo } from 'react';
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  packs, bookings, homeContent, onUpdatePacks, onUpdateHome, onUpdateBookings, onForceSync, onPushToCloud 
}) => {
  const [isAuthorized, setIsAuthorized] = useState(sessionStorage.getItem('admin_session') === 'true');
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState<'bookings' | 'calendar' | 'packs' | 'schedule' | 'home' | 'config'>('bookings');
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date().toISOString().split('T')[0]);
  const [newOverrideDate, setNewOverrideDate] = useState('');

  const stats = useMemo(() => {
    const confirmed = bookings.filter(b => b.status === 'confirmed');
    const pending = bookings.filter(b => b.status === 'pending_verification');
    const totalRevenue = confirmed.reduce((acc, b) => acc + b.totalPrice, 0);
    const pendingRevenue = pending.reduce((acc, b) => acc + b.totalPrice, 0);
    const now = new Date();
    const monthlyRevenue = confirmed.filter(b => {
      const d = new Date(b.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((acc, b) => acc + b.totalPrice, 0);
    return { totalRevenue, pendingRevenue, monthlyRevenue, count: confirmed.length };
  }, [bookings]);

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto py-32 text-center">
        <h1 className="text-3xl font-orbitron font-bold mb-8 uppercase tracking-widest text-purple-500">DGR Admin</h1>
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          if(passwordInput === 'admin123') { setIsAuthorized(true); sessionStorage.setItem('admin_session', 'true'); }
        }} className="space-y-4">
          <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 outline-none text-center font-orbitron text-purple-400" placeholder="PASSWORD" />
          <button className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-[10px]">ENTRAR</button>
        </form>
      </div>
    );
  }

  const handleUpdateSchedule = (day: string, updates: Partial<DaySchedule>) => {
    const newAvailability = { ...homeContent.availability, [day]: { ...(homeContent.availability as any)[day], ...updates } };
    onUpdateHome({ ...homeContent, availability: newAvailability as any });
  };

  const handleUpdatePayment = (key: string, value: any) => {
    onUpdateHome({ ...homeContent, payments: { ...homeContent.payments, [key]: value } });
  };

  const handleAddPack = () => {
    const newPack: Pack = { id: Math.random().toString(36).substr(2, 9), name: 'NUEVO PACK', description: 'Descripción...', pricePerHour: 20, features: ['Nueva característica'], icon: '✨', isActive: false };
    onUpdatePacks([...packs, newPack]);
  };

  const handleUpdateFeature = (packId: string, idx: number, val: string) => {
    onUpdatePacks(packs.map(p => p.id === packId ? { ...p, features: p.features.map((f, i) => i === idx ? val : f) } : p));
  };

  const handleAddFeature = (packId: string) => {
    onUpdatePacks(packs.map(p => p.id === packId ? { ...p, features: [...p.features, 'Nueva característica'] } : p));
  };

  const formatTime = (decimalHour: number) => {
    const h = Math.floor(decimalHour);
    const m = Math.round((decimalHour % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div onClick={() => {sessionStorage.removeItem('admin_session'); setIsAuthorized(false);}} className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center cursor-pointer hover:bg-red-500/20 transition-colors">🚪</div>
          <h1 className="text-xl font-orbitron font-bold uppercase text-white">DGR Dashboard</h1>
        </div>
        <div className="flex flex-wrap justify-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
          {['bookings', 'calendar', 'packs', 'schedule', 'home', 'config'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>{tab}</button>
          ))}
        </div>
      </header>

      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 text-center"><span className="text-[8px] font-black text-zinc-500 uppercase block mb-1">Total Cobrado</span><div className="text-2xl font-orbitron font-bold">{stats.totalRevenue}€</div></div>
            <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 text-center"><span className="text-[8px] font-black text-zinc-500 uppercase block mb-1">Este Mes</span><div className="text-2xl font-orbitron font-bold text-green-500">{stats.monthlyRevenue}€</div></div>
            <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 text-center"><span className="text-[8px] font-black text-zinc-500 uppercase block mb-1">Pendiente</span><div className="text-2xl font-orbitron font-bold text-yellow-500">{stats.pendingRevenue}€</div></div>
            <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 text-center"><span className="text-[8px] font-black text-zinc-500 uppercase block mb-1">Sesiones</span><div className="text-2xl font-orbitron font-bold text-purple-500">{stats.count}</div></div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-white/5 text-[9px] uppercase font-black text-zinc-500 tracking-widest border-b border-zinc-800"><tr className="px-8"><th className="p-6">Cliente</th><th>Fecha / Hora</th><th className="text-right p-6">Acción</th></tr></thead>
                <tbody className="divide-y divide-zinc-800/50">
                   {bookings.sort((a,b) => b.createdAt - a.createdAt).map(b => (
                     <tr key={b.id} className="text-xs hover:bg-white/[0.01]">
                       <td className="p-6">
                         <div className="font-bold uppercase text-white">{b.customerName}</div>
                         <div className="text-[9px] text-zinc-500 font-bold">{b.customerPhone}</div>
                       </td>
                       <td>
                         <div className="font-bold text-purple-400">{b.date}</div>
                         <div className="text-[9px] font-black text-zinc-600 uppercase">{formatTime(b.startTime)} - {formatTime(b.startTime + b.duration)}</div>
                       </td>
                       <td className="p-6 text-right">
                         {b.status === 'pending_verification' ? (
                           <button onClick={() => onUpdateBookings(bookings.map(x => x.id === b.id ? {...x, status: 'confirmed'} : x))} className="bg-yellow-500 text-black px-4 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-white transition-all">Validar Pago</button>
                         ) : <span className="text-green-500 font-black text-[9px] uppercase">Confirmada ✓</span>}
                       </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {activeTab === 'packs' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center"><h3 className="text-lg font-orbitron font-bold uppercase text-white">Edición de Ofertas</h3><button onClick={handleAddPack} className="bg-purple-600 text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase">+ Nuevo Pack</button></div>
          <div className="grid lg:grid-cols-2 gap-6">
            {packs.map(p => (
              <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6 group relative">
                <button onClick={() => onUpdatePacks(packs.filter(x => x.id !== p.id))} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100">✕</button>
                <div className="flex justify-between">
                  <input value={p.icon} onChange={e => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, icon: e.target.value} : x))} className="text-4xl bg-transparent w-16" />
                  <div className="text-right"><span className="text-[8px] font-black text-zinc-500 uppercase block">Precio/H</span><input type="number" value={p.pricePerHour} onChange={e => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, pricePerHour: Number(e.target.value)} : x))} className="bg-black border border-zinc-800 rounded-xl px-4 py-2 text-xl font-bold w-20 text-right text-purple-400" /></div>
                </div>
                <input value={p.name} onChange={e => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, name: e.target.value} : x))} className="w-full bg-transparent text-lg font-bold uppercase text-white border-b border-white/5 pb-2" />
                <div className="space-y-3">
                   <div className="flex justify-between items-center"><label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Características pequeñas</label><button onClick={() => handleAddFeature(p.id)} className="text-[9px] font-black text-purple-500 hover:text-white uppercase">+ Añadir</button></div>
                   <div className="grid gap-2">
                      {p.features.map((f, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input value={f} onChange={e => handleUpdateFeature(p.id, i, e.target.value)} className="flex-1 bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-[10px] text-zinc-400" />
                          <button onClick={() => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, features: p.features.filter((_, idx) => idx !== i)} : x))} className="text-zinc-700 hover:text-red-500">✕</button>
                        </div>
                      ))}
                   </div>
                </div>
                <button onClick={() => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, isActive: !p.isActive} : x))} className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest ${p.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{p.isActive ? 'VISIBLE' : 'OCULTO'}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'home' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 space-y-10">
          <h3 className="text-lg font-orbitron font-bold uppercase text-white border-b border-white/5 pb-4">Personalización Web</h3>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Nombre Estudio</label>
              <input value={homeContent.studioName} onChange={e => onUpdateHome({...homeContent, studioName: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-purple-400 font-bold" />
            </div>
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Banner Imagen Título</label>
              <input value={homeContent.bannerTitle} onChange={e => onUpdateHome({...homeContent, bannerTitle: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-white font-bold" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Descripción del Estudio (Banner Inferior)</label>
              <textarea value={homeContent.studioDescription} onChange={e => onUpdateHome({...homeContent, studioDescription: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-zinc-400 h-32 resize-none" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 space-y-10">
          <div className="grid sm:grid-cols-2 gap-4"><button onClick={onPushToCloud} className="bg-white text-black py-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-purple-600 hover:text-white transition-all">Subir a la Nube ↑</button><button onClick={onForceSync} className="bg-zinc-800 text-zinc-400 py-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-zinc-700 hover:text-white transition-all">Descargar cambios ↓</button></div>
          
          <div className="space-y-8">
             <h3 className="text-lg font-orbitron font-bold uppercase text-white border-b border-white/5 pb-4">Ajustes de Pagos</h3>
             <div className="grid lg:grid-cols-2 gap-6">
                <div className="p-8 bg-black/40 border border-zinc-800 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center"><span className="text-sm font-bold">Mollie API</span><button onClick={() => handleUpdatePayment('mollieEnabled', !homeContent.payments.mollieEnabled)} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase ${homeContent.payments.mollieEnabled ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>{homeContent.payments.mollieEnabled ? 'On' : 'Off'}</button></div>
                  <input type="password" value={homeContent.payments.mollieApiKey} onChange={e => handleUpdatePayment('mollieApiKey', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-[10px] font-mono text-zinc-400" placeholder="live_xxxxxxxx" />
                </div>
                <div className="p-8 bg-black/40 border border-zinc-800 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center"><span className="text-sm font-bold">Bizum / WhatsApp</span><button onClick={() => handleUpdatePayment('bizumEnabled', !homeContent.payments.bizumEnabled)} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase ${homeContent.payments.bizumEnabled ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>{homeContent.payments.bizumEnabled ? 'On' : 'Off'}</button></div>
                  <input value={homeContent.payments.bizumPhone} onChange={e => handleUpdatePayment('bizumPhone', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-[10px] font-bold text-zinc-400" placeholder="600 000 000" />
                </div>
                <div className="p-8 bg-black/40 border border-zinc-800 rounded-3xl space-y-4 lg:col-span-2">
                  <span className="text-sm font-bold block mb-2">Revolut Link</span>
                  <input value={homeContent.payments.revolutLink} onChange={e => handleUpdatePayment('revolutLink', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-[10px] text-zinc-400" placeholder="https://revolut.me/tu-link" />
                </div>
             </div>
          </div>
        </div>
      )}

      <footer className="text-center pt-10 opacity-20"><div className="text-[7px] font-black uppercase tracking-[0.6em]">Secure Studio Terminal v2.9</div></footer>
    </div>
  );
};

export default AdminDashboard;
