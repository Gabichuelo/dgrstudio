
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
  
  // Estado para confirmación de borrado sin usar window.confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
          else { alert('Contraseña incorrecta'); }
        }} className="space-y-4">
          <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 outline-none text-center font-orbitron text-purple-400" placeholder="PASSWORD" />
          <button className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">ENTRAR</button>
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
    const newPack: Pack = { id: Math.random().toString(36).substr(2, 9), name: 'NUEVO PACK', description: 'Nueva descripción...', pricePerHour: 20, features: ['Nueva característica'], icon: '✨', isActive: false };
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

  const executeDelete = (id: string) => {
    onUpdateBookings(bookings.filter(b => b.id !== id));
    setConfirmDeleteId(null);
  };

  const renderMonthCalendar = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; 
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="aspect-square bg-white/[0.02] border border-zinc-800/30 rounded-2xl opacity-20"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const dayBookings = bookings.filter(b => b.date === dateStr && b.status !== 'cancelled');
      const isSelected = selectedCalendarDate === dateStr;
      days.push(
        <button key={d} onClick={() => setSelectedCalendarDate(dateStr)} className={`aspect-square relative rounded-2xl border flex flex-col items-center justify-center transition-all group overflow-hidden ${isSelected ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-800 bg-black/40 hover:border-zinc-600'}`}>
          <span className={`text-[8px] font-black uppercase mb-1 ${isSelected ? 'text-purple-400' : 'text-zinc-600'}`}>Día</span>
          <span className="text-lg font-bold">{d}</span>
          {dayBookings.length > 0 && <div className="absolute bottom-2 flex gap-0.5">{dayBookings.map((b, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full ${b.status === 'pending_verification' ? 'bg-yellow-500' : 'bg-purple-500'}`}></span>)}</div>}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div onClick={() => {sessionStorage.removeItem('admin_session'); setIsAuthorized(false);}} className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center cursor-pointer hover:bg-red-500/20 transition-colors">🚪</div>
          <h1 className="text-xl font-orbitron font-bold uppercase text-white tracking-tighter">Administración DGR</h1>
        </div>
        <div className="flex flex-wrap justify-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
          {['bookings', 'calendar', 'packs', 'schedule', 'home', 'config'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-zinc-500 hover:text-white'}`}>{tab}</button>
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
                <thead className="bg-white/5 text-[9px] uppercase font-black text-zinc-500 tracking-widest border-b border-zinc-800">
                  <tr className="px-8"><th className="p-6">Cliente / Ref</th><th>Fecha / Hora</th><th className="text-right p-6">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                   {bookings.sort((a,b) => b.createdAt - a.createdAt).map(b => (
                     <tr key={b.id} className="text-xs hover:bg-white/[0.01]">
                       <td className="p-6">
                         <div className="font-bold uppercase text-white">{b.customerName}</div>
                         <div className="text-[9px] text-zinc-600 font-bold tracking-widest">{b.id}</div>
                         <div className="text-[9px] text-zinc-500">{b.customerPhone}</div>
                       </td>
                       <td>
                         <div className="font-bold text-purple-400">{b.date}</div>
                         <div className="text-[9px] font-black text-zinc-600 uppercase">{formatTime(b.startTime)} - {formatTime(b.startTime + b.duration)}</div>
                         <div className="text-[9px] text-zinc-500 uppercase mt-1">{b.paymentMethod} · {b.totalPrice}€</div>
                       </td>
                       <td className="p-6 text-right">
                         <div className="flex justify-end items-center gap-3">
                            {b.status === 'pending_verification' ? (
                              <button onClick={() => onUpdateBookings(bookings.map(x => x.id === b.id ? {...x, status: 'confirmed'} : x))} className="bg-yellow-500 text-black px-4 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-white transition-all">Validar Pago</button>
                            ) : <span className="text-green-500 font-black text-[9px] uppercase tracking-widest">Confirmada ✓</span>}
                            
                            {confirmDeleteId === b.id ? (
                                <button 
                                    onClick={() => executeDelete(b.id)}
                                    className="bg-red-600 text-white px-3 py-2 rounded-lg text-[8px] font-black uppercase animate-pulse shadow-lg shadow-red-600/20"
                                >
                                    ¡BORRAR YA!
                                </button>
                            ) : (
                                <button 
                                    onClick={() => { setConfirmDeleteId(b.id); setTimeout(() => setConfirmDeleteId(null), 3000); }} 
                                    className="w-8 h-8 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                >
                                    ✕
                                </button>
                            )}
                         </div>
                       </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="grid lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-lg font-orbitron font-bold uppercase text-white tracking-widest capitalize">{calendarViewDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h3>
               <div className="flex gap-2">
                  <button onClick={() => { const d = new Date(calendarViewDate); d.setMonth(d.getMonth() - 1); setCalendarViewDate(d); }} className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors">←</button>
                  <button onClick={() => { const d = new Date(calendarViewDate); d.setMonth(d.getMonth() + 1); setCalendarViewDate(d); }} className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors">→</button>
               </div>
            </div>
            <div className="grid grid-cols-7 gap-3 text-center mb-4">
               {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(day => <span key={day} className="text-[10px] font-black text-zinc-600 uppercase">{day}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-2">{renderMonthCalendar()}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 space-y-4 h-fit">
            <div className="border-b border-zinc-800 pb-4"><h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{selectedCalendarDate}</h4></div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
               {bookings.filter(b => b.date === selectedCalendarDate && b.status !== 'cancelled').length === 0 ? <div className="text-center py-20 text-[9px] uppercase font-black text-zinc-700 tracking-widest">Sin sesiones</div> : bookings.filter(b => b.date === selectedCalendarDate && b.status !== 'cancelled').sort((a,b) => a.startTime - b.startTime).map(b => (
                 <div key={b.id} className="p-5 rounded-2xl bg-black border border-zinc-800 space-y-3 relative group overflow-hidden">
                   <div className="absolute inset-y-0 right-0 w-1 bg-purple-500 opacity-30"></div>
                   <div className="flex justify-between items-start">
                      <div>
                         <div className="text-xs font-bold text-white uppercase truncate max-w-[130px]">{b.customerName}</div>
                         <div className="text-[9px] font-black text-zinc-600 uppercase">{formatTime(b.startTime)} - {formatTime(b.startTime + b.duration)}</div>
                      </div>
                      
                      {confirmDeleteId === b.id ? (
                        <button onClick={() => executeDelete(b.id)} className="text-white bg-red-600 rounded px-2 py-1 text-[8px] font-black uppercase animate-pulse">CONFIRMAR</button>
                      ) : (
                        <button 
                            onClick={() => { setConfirmDeleteId(b.id); setTimeout(() => setConfirmDeleteId(null), 3000); }} 
                            className="text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-500/10 rounded"
                        >
                            ✕
                        </button>
                      )}
                   </div>
                   <div className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter flex justify-between">
                     <span>{b.packId}</span>
                     <span>{b.totalPrice}€</span>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'packs' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center"><h3 className="text-lg font-orbitron font-bold uppercase text-white tracking-widest">Packs y Precios</h3><button onClick={handleAddPack} className="bg-purple-600 text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20">+ Nuevo Pack</button></div>
          <div className="grid lg:grid-cols-2 gap-6">
            {packs.map(p => (
              <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6 group relative">
                <button onClick={() => onUpdatePacks(packs.filter(x => x.id !== p.id))} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                <div className="flex justify-between">
                  <input value={p.icon} onChange={e => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, icon: e.target.value} : x))} className="text-4xl bg-transparent w-16 outline-none" />
                  <div className="text-right"><span className="text-[8px] font-black text-zinc-500 uppercase block mb-1 tracking-widest">Precio / H</span><input type="number" value={p.pricePerHour} onChange={e => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, pricePerHour: Number(e.target.value)} : x))} className="bg-black border border-zinc-800 rounded-xl px-4 py-2 text-xl font-bold w-20 text-right text-purple-400 outline-none" /></div>
                </div>
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-1">Título del Pack</label>
                      <input value={p.name} onChange={e => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, name: e.target.value} : x))} className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-lg font-bold uppercase text-white outline-none" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-1">Descripción Breve</label>
                      <textarea value={p.description} onChange={e => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, description: e.target.value} : x))} className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-[10px] text-zinc-400 outline-none resize-none h-20" />
                   </div>
                </div>
                <div className="space-y-3">
                   <div className="flex justify-between items-center"><label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Características pequeñas</label><button onClick={() => handleAddFeature(p.id)} className="text-[9px] font-black text-purple-500 hover:text-white uppercase">+ Añadir</button></div>
                   <div className="grid gap-2">
                      {p.features.map((f, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input value={f} onChange={e => handleUpdateFeature(p.id, i, e.target.value)} className="flex-1 bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-[10px] text-zinc-400 outline-none" />
                          <button onClick={() => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, features: p.features.filter((_, idx) => idx !== i)} : x))} className="text-zinc-700 hover:text-red-500">✕</button>
                        </div>
                      ))}
                   </div>
                </div>
                <button onClick={() => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, isActive: !p.isActive} : x))} className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${p.isActive ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>{p.isActive ? 'VISIBLE EN WEB ✓' : 'OCULTO EN WEB'}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="grid lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 space-y-6">
            <h3 className="text-lg font-orbitron font-bold uppercase text-white tracking-widest">Horario Base Semanal</h3>
            <div className="grid gap-4">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                const sched = (homeContent.availability as any)[day] as DaySchedule;
                return (
                  <div key={day} className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-zinc-800/50">
                    <span className="w-16 text-[10px] font-black uppercase text-zinc-500 tracking-widest">{day.substr(0,3)}</span>
                    <button onClick={() => handleUpdateSchedule(day, { isOpen: !sched.isOpen })} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase ${sched.isOpen ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{sched.isOpen ? 'On' : 'Off'}</button>
                    {sched.isOpen && <div className="flex items-center gap-2 ml-auto"><input type="number" step="0.5" value={sched.start} onChange={e => handleUpdateSchedule(day, {start: Number(e.target.value)})} className="bg-zinc-800 w-12 text-center py-1 rounded text-[10px] font-bold outline-none" /><span className="text-zinc-700">-</span><input type="number" step="0.5" value={sched.end} onChange={e => handleUpdateSchedule(day, {end: Number(e.target.value)})} className="bg-zinc-800 w-12 text-center py-1 rounded text-[10px] font-bold outline-none" /></div>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 space-y-6">
            <h3 className="text-lg font-orbitron font-bold uppercase text-white tracking-widest">Bloqueo de Días</h3>
            <div className="flex gap-2">
              <input type="date" value={newOverrideDate} onChange={e => setNewOverrideDate(e.target.value)} className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white outline-none" />
              <button onClick={() => { if(!newOverrideDate) return; const o: DateOverride = { id: Math.random().toString(36).substr(2,5), date: newOverrideDate, isOpen: false }; onUpdateHome({...homeContent, availability: {...homeContent.availability, overrides: [...homeContent.availability.overrides, o]}}); setNewOverrideDate(''); }} className="bg-purple-600 text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all">Bloquear</button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
               {homeContent.availability.overrides.map(o => (
                 <div key={o.id} className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                    <span className="text-xs font-bold text-white tracking-widest">{o.date}</span>
                    <button onClick={() => onUpdateHome({...homeContent, availability: {...homeContent.availability, overrides: homeContent.availability.overrides.filter(x => x.id !== o.id)}})} className="text-red-500 hover:scale-125 transition-transform">✕</button>
                 </div>
               ))}
               {homeContent.availability.overrides.length === 0 && <div className="text-center py-10 text-[9px] font-black uppercase text-zinc-700 tracking-widest">No hay bloqueos activos</div>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'home' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 space-y-10 animate-in slide-in-from-bottom-4">
          <h3 className="text-lg font-orbitron font-bold uppercase text-white border-b border-white/5 pb-4 tracking-widest">Personalización Web</h3>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Nombre Estudio</label>
              <input value={homeContent.studioName} onChange={e => onUpdateHome({...homeContent, studioName: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-purple-400 font-bold outline-none focus:border-purple-500 transition-all" />
            </div>
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Banner Imagen Título</label>
              <input value={homeContent.bannerTitle} onChange={e => onUpdateHome({...homeContent, bannerTitle: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-white font-bold outline-none focus:border-purple-500 transition-all" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Descripción del Estudio (Banner Inferior)</label>
              <textarea value={homeContent.studioDescription} onChange={e => onUpdateHome({...homeContent, studioDescription: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-zinc-400 h-32 resize-none outline-none focus:border-purple-500 transition-all" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 space-y-10 animate-in slide-in-from-bottom-4">
          <div className="grid sm:grid-cols-2 gap-4"><button onClick={onPushToCloud} className="bg-white text-black py-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-purple-600 hover:text-white transition-all shadow-xl">Subir a la Nube ↑</button><button onClick={onForceSync} className="bg-zinc-800 text-zinc-400 py-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-zinc-700 hover:text-white transition-all">Sincronizar Datos ↓</button></div>
          
          <div className="space-y-8">
             <h3 className="text-lg font-orbitron font-bold uppercase text-white border-b border-white/5 pb-4 tracking-widest">Configuración de Pagos</h3>
             <div className="grid lg:grid-cols-2 gap-6">
                <div className="p-8 bg-black/40 border border-zinc-800 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center"><span className="text-sm font-bold uppercase tracking-widest text-white">Mollie Checkout</span><button onClick={() => handleUpdatePayment('mollieEnabled', !homeContent.payments.mollieEnabled)} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase ${homeContent.payments.mollieEnabled ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>{homeContent.payments.mollieEnabled ? 'Activado' : 'Desactivado'}</button></div>
                  <input type="password" value={homeContent.payments.mollieApiKey} onChange={e => handleUpdatePayment('mollieApiKey', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-[10px] font-mono text-zinc-400 outline-none" placeholder="live_xxxxxxxx" />
                </div>
                <div className="p-8 bg-black/40 border border-zinc-800 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center"><span className="text-sm font-bold uppercase tracking-widest text-white">Bizum / WhatsApp</span><button onClick={() => handleUpdatePayment('bizumEnabled', !homeContent.payments.bizumEnabled)} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase ${homeContent.payments.bizumEnabled ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>{homeContent.payments.bizumEnabled ? 'Activado' : 'Desactivado'}</button></div>
                  <input value={homeContent.payments.bizumPhone} onChange={e => handleUpdatePayment('bizumPhone', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-[10px] font-bold text-zinc-400 outline-none" placeholder="600 000 000" />
                </div>
                <div className="p-8 bg-black/40 border border-zinc-800 rounded-3xl space-y-4 lg:col-span-2">
                  <span className="text-sm font-bold block mb-2 uppercase tracking-widest text-white">Enlace de Pago Revolut</span>
                  <input value={homeContent.payments.revolutLink} onChange={e => handleUpdatePayment('revolutLink', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-[10px] text-zinc-400 outline-none" placeholder="https://revolut.me/tu-link" />
                </div>
             </div>
          </div>
        </div>
      )}

      <footer className="text-center pt-10 opacity-20"><div className="text-[7px] font-black uppercase tracking-[0.6em]">Secure Studio Terminal v3.0 · Powered by StreamPulse</div></footer>
    </div>
  );
};

export default AdminDashboard;
