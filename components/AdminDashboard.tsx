
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  packs, bookings, homeContent, onUpdatePacks, onUpdateHome, onUpdateBookings, onForceSync, onPushToCloud 
}) => {
  const [isAuthorized, setIsAuthorized] = useState(sessionStorage.getItem('admin_session') === 'true');
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState<'bookings' | 'calendar' | 'packs' | 'schedule' | 'home' | 'config'>('bookings');
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date().toISOString().split('T')[0]);
  const [newOverrideDate, setNewOverrideDate] = useState('');
  const [newOverrideReason, setNewOverrideReason] = useState('');

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto py-32 text-center">
        <h1 className="text-3xl font-orbitron font-bold mb-8 uppercase tracking-widest text-purple-500">DGR Admin</h1>
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          if(passwordInput === 'admin123') { 
            setIsAuthorized(true); 
            sessionStorage.setItem('admin_session', 'true'); 
          } else { alert("Error"); }
        }} className="space-y-4">
          <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 outline-none text-center font-orbitron text-purple-400" placeholder="CONTRASEÑA" />
          <button className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px]">ENTRAR</button>
        </form>
      </div>
    );
  }

  const formatTime = (decimalHour: number) => {
    const h = Math.floor(decimalHour);
    const m = Math.round((decimalHour % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleUpdateSchedule = (day: string, updates: Partial<DaySchedule>) => {
    const newAvailability = { 
      ...homeContent.availability, 
      [day]: { ...(homeContent.availability as any)[day], ...updates } 
    };
    onUpdateHome({ ...homeContent, availability: newAvailability as any });
  };

  const addOverride = () => {
    if (!newOverrideDate) return;
    const newOverride: DateOverride = {
      id: Math.random().toString(36).substr(2, 5),
      date: newOverrideDate,
      isOpen: false,
      reason: newOverrideReason
    };
    onUpdateHome({
      ...homeContent,
      availability: {
        ...homeContent.availability,
        overrides: [...(homeContent.availability.overrides || []), newOverride]
      }
    });
    setNewOverrideDate('');
    setNewOverrideReason('');
  };

  // Lógica del nuevo calendario mensual
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderMonthCalendar = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = (getFirstDayOfMonth(year, month) + 6) % 7; // Ajuste para que empiece en lunes
    const days = [];

    // Celdas vacías al inicio
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square bg-white/[0.02] border border-zinc-800/30 rounded-2xl opacity-20"></div>);
    }

    // Días del mes
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const dayBookings = bookings.filter(b => b.date === dateStr && b.status !== 'cancelled');
      const hasPending = dayBookings.some(b => b.status === 'pending_verification');
      const isSelected = selectedCalendarDate === dateStr;

      days.push(
        <button 
          key={d} 
          onClick={() => setSelectedCalendarDate(dateStr)}
          className={`aspect-square relative rounded-2xl border flex flex-col items-center justify-center transition-all group overflow-hidden ${
            isSelected ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-800 bg-black/40 hover:border-zinc-600'
          }`}
        >
          <span className={`text-[8px] font-black uppercase mb-1 ${isSelected ? 'text-purple-400' : 'text-zinc-600'}`}>Día</span>
          <span className="text-lg font-bold">{d}</span>
          {dayBookings.length > 0 && (
            <div className="absolute bottom-2 flex gap-0.5">
               {dayBookings.map((b, i) => (
                 <span key={i} className={`w-1.5 h-1.5 rounded-full ${b.status === 'pending_verification' ? 'bg-yellow-500' : 'bg-purple-500'}`}></span>
               ))}
            </div>
          )}
        </button>
      );
    }
    return days;
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(calendarViewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCalendarViewDate(newDate);
  };

  const monthName = calendarViewDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col xl:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div onClick={() => {sessionStorage.removeItem('admin_session'); setIsAuthorized(false);}} className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center cursor-pointer hover:bg-red-500/20 transition-colors" title="Salir">🚪</div>
          <div>
            <h1 className="text-2xl font-orbitron font-bold uppercase tracking-tighter text-white">Administración</h1>
            <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.4em]">{activeTab}</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-1 p-1.5 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-sm overflow-x-auto max-w-full">
          {['bookings', 'calendar', 'packs', 'schedule', 'home', 'config'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-zinc-500 hover:text-white'}`}>{tab}</button>
          ))}
        </div>
      </header>

      {/* TAB: RESERVAS */}
      {activeTab === 'bookings' && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[9px] uppercase text-zinc-500 font-black tracking-widest border-b border-zinc-800">
              <tr><th className="px-8 py-5">Cliente / Contacto</th><th className="px-8 py-5">Sesión</th><th className="px-8 py-5 text-right">Estado / Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {bookings.sort((a,b) => b.createdAt - a.createdAt).map(b => (
                <tr key={b.id} className="hover:bg-white/[0.01]">
                  <td className="px-8 py-6">
                    <div className="font-bold text-sm text-white uppercase">{b.customerName}</div>
                    <div className="text-[9px] text-zinc-500 font-black uppercase flex flex-col gap-1">
                       <span>{b.customerEmail}</span>
                       {b.customerPhone && <a href={`tel:${b.customerPhone}`} className="text-purple-400 hover:underline">☏ {b.customerPhone}</a>}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs font-bold text-purple-400 uppercase">{b.date}</div>
                    <div className="text-[9px] text-zinc-600 font-black uppercase">{formatTime(b.startTime)} - {formatTime(b.startTime + b.duration)}</div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end items-center gap-3">
                      {b.status === 'pending_verification' ? (
                        <button onClick={() => onUpdateBookings(bookings.map(x => x.id === b.id ? {...x, status: 'confirmed'} : x))} className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-white transition-all">Verificar Pago</button>
                      ) : (
                        <span className="text-green-500 font-black text-[9px] uppercase tracking-widest">Confirmada ✓</span>
                      )}
                      <button onClick={() => { if(confirm('¿Seguro que quieres ANULAR esta reserva?')) onUpdateBookings(bookings.filter(x => x.id !== b.id)) }} className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Anular</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: CALENDARIO (REDISEÑADO) */}
      {activeTab === 'calendar' && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-lg font-orbitron font-bold uppercase text-white tracking-widest capitalize">{monthName}</h3>
               <div className="flex gap-2">
                  <button onClick={() => changeMonth(-1)} className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors">←</button>
                  <button onClick={() => changeMonth(1)} className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors">→</button>
               </div>
            </div>
            <div className="grid grid-cols-7 gap-3 text-center mb-4">
               {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(day => <span key={day} className="text-[10px] font-black text-zinc-600 uppercase">{day}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
               {renderMonthCalendar()}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 space-y-4">
            <div className="border-b border-zinc-800 pb-4">
              <h4 className="text-[10px] font-black uppercase text-zinc-500">Sesiones: {selectedCalendarDate}</h4>
            </div>
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
               {bookings.filter(b => b.date === selectedCalendarDate && b.status !== 'cancelled').length === 0 ? (
                 <div className="text-center py-20">
                    <div className="text-4xl opacity-20 mb-4">✨</div>
                    <div className="text-[9px] uppercase font-black text-zinc-700">Día libre</div>
                 </div>
               ) : (
                 bookings.filter(b => b.date === selectedCalendarDate && b.status !== 'cancelled').sort((a,b) => a.startTime - b.startTime).map(b => (
                   <div key={b.id} className={`p-5 rounded-3xl border transition-all ${b.status === 'pending_verification' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-black/40 border-zinc-800'}`}>
                     <div className="flex justify-between items-start mb-3">
                        <div className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${b.status === 'pending_verification' ? 'bg-yellow-500 text-black' : 'bg-purple-600 text-white'}`}>
                          {b.status === 'pending_verification' ? 'Pendiente' : 'Confirmada'}
                        </div>
                        <div className="text-xs font-bold text-white">{formatTime(b.startTime)} - {formatTime(b.startTime + b.duration)}</div>
                     </div>
                     <div className="text-[10px] font-black uppercase text-white truncate">{b.customerName}</div>
                     <div className="text-[8px] text-zinc-500 uppercase font-black mt-1 flex justify-between">
                       <span>{b.customerPhone}</span>
                       <span className="text-zinc-600">{b.totalPrice}€</span>
                     </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}

      {/* Otras pestañas (Packs, Horarios, Web, Config) mantienen su lógica funcional previa pero con visual mejorada */}
      {activeTab === 'packs' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">
          {packs.map(p => (
            <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex justify-between items-center">
                <input value={p.icon} onChange={e => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, icon: e.target.value} : x))} className="text-4xl bg-transparent w-16" />
                <div className="text-right">
                  <span className="text-[8px] font-black text-zinc-500 uppercase block">€ / HORA</span>
                  <input type="number" value={p.pricePerHour} onChange={e => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, pricePerHour: Number(e.target.value)} : x))} className="bg-black border border-zinc-800 rounded-xl px-4 py-2 text-xl font-bold w-24 text-right text-purple-400" />
                </div>
              </div>
              <input value={p.name} onChange={e => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, name: e.target.value} : x))} className="w-full bg-transparent text-xl font-bold uppercase tracking-tight text-white outline-none border-b border-white/5 pb-2" />
              <textarea value={p.description} onChange={e => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, description: e.target.value} : x))} className="w-full bg-zinc-800/30 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-500 h-24 outline-none resize-none" />
              <button onClick={() => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, isActive: !p.isActive} : x))} className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${p.isActive ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                {p.isActive ? 'PACK VISIBLE' : 'PACK OCULTO'}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="grid lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 space-y-6">
            <h3 className="text-lg font-orbitron font-bold uppercase text-white mb-6">Horario Semanal</h3>
            <div className="grid gap-4">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                const sched = (homeContent.availability as any)[day] as DaySchedule;
                return (
                  <div key={day} className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                    <span className="w-20 text-[10px] font-black uppercase text-zinc-500">{day.substr(0,3)}</span>
                    <button onClick={() => handleUpdateSchedule(day, { isOpen: !sched.isOpen })} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase ${sched.isOpen ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                      {sched.isOpen ? 'Abierto' : 'Cerrado'}
                    </button>
                    {sched.isOpen && (
                      <div className="flex items-center gap-2 ml-auto">
                        <input type="number" step="0.5" value={sched.start} onChange={e => handleUpdateSchedule(day, {start: Number(e.target.value)})} className="bg-zinc-800 w-12 text-center py-1 rounded text-[10px] font-bold text-white outline-none" />
                        <span className="text-zinc-700">-</span>
                        <input type="number" step="0.5" value={sched.end} onChange={e => handleUpdateSchedule(day, {end: Number(e.target.value)})} className="bg-zinc-800 w-12 text-center py-1 rounded text-[10px] font-bold text-white outline-none" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 space-y-6">
            <h3 className="text-lg font-orbitron font-bold uppercase text-white mb-2">Días Especiales</h3>
            <div className="flex gap-2 mb-8">
              <input type="date" value={newOverrideDate} onChange={e => setNewOverrideDate(e.target.value)} className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white" />
              <button onClick={addOverride} className="bg-purple-600 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-purple-500 transition-colors">AÑADIR</button>
            </div>
            <div className="space-y-3">
              {homeContent.availability.overrides?.map(o => (
                <div key={o.id} className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                  <div className="text-xs font-bold text-white uppercase">{o.date}</div>
                  <button onClick={() => onUpdateHome({...homeContent, availability: {...homeContent.availability, overrides: homeContent.availability.overrides.filter(x => x.id !== o.id)}})} className="text-red-500">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'home' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 space-y-10">
          <h3 className="text-xl font-orbitron font-bold uppercase text-white tracking-widest border-b border-white/5 pb-4">Personalización Web</h3>
          <div className="grid md:grid-cols-2 gap-8">
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500">Nombre del Estudio</label>
                  <input value={homeContent.studioName} onChange={e => onUpdateHome({...homeContent, studioName: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-purple-400 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500">Título Principal</label>
                  <textarea value={homeContent.heroTitle} onChange={e => onUpdateHome({...homeContent, heroTitle: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-white font-black h-32 uppercase tracking-tighter" />
                </div>
             </div>
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500">Subtítulo Hero</label>
                  <textarea value={homeContent.heroSubtitle} onChange={e => onUpdateHome({...homeContent, heroSubtitle: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-zinc-400 h-32 outline-none focus:border-purple-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500">Email Contacto</label>
                  <input value={homeContent.adminEmail} onChange={e => onUpdateHome({...homeContent, adminEmail: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-zinc-400" />
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 space-y-8 animate-in slide-in-from-bottom-4">
          <div className="grid sm:grid-cols-2 gap-4">
              <button onClick={onPushToCloud} className="bg-white text-black py-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-purple-600 hover:text-white transition-all shadow-2xl">Subir a la Nube ↑</button>
              <button onClick={onForceSync} className="bg-zinc-800 text-zinc-400 py-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-zinc-700 hover:text-white transition-all">Descargar cambios ↓</button>
          </div>
          <div className="pt-8 border-t border-zinc-800">
             <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-zinc-600">Endpoint API</label>
                <input value={homeContent.apiUrl} onChange={e => onUpdateHome({...homeContent, apiUrl: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-[10px] font-mono text-zinc-500" />
             </div>
          </div>
        </div>
      )}
      
      <footer className="mt-20 pt-10 border-t border-zinc-800 text-center">
         <div onClick={() => setActiveTab('config')} className="text-[8px] font-black uppercase text-zinc-800 hover:text-purple-900 cursor-pointer transition-colors tracking-[0.5em]">Sistema DGR v2.4 Admin Access Secured</div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
