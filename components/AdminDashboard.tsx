
import React, { useState, useMemo, useEffect } from 'react';
import { Pack, Booking, HomeContent, DaySchedule, Extra, Coupon, HourBono, DateOverride } from '../types';

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
  
  // Estado para seguridad de login
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  const [activeTab, setActiveTab] = useState<'calendar' | 'bookings' | 'marketing' | 'inventory' | 'schedule' | 'home' | 'config'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Efecto para el temporizador de bloqueo
  useEffect(() => {
    let interval: any;
    if (isLocked && lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer((prev) => prev - 1);
      }, 1000);
    } else if (lockTimer === 0) {
      setIsLocked(false);
      setLoginAttempts(0);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockTimer]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    if (passwordInput === 'admin123') {
      setIsAuthorized(true);
      sessionStorage.setItem('admin_session', 'true');
      setLoginAttempts(0);
    } else {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      if (newAttempts >= 3) {
        setIsLocked(true);
        setLockTimer(30); // 30 segundos de bloqueo
      } else {
        alert(`Contraseña incorrecta. Intentos restantes: ${3 - newAttempts}`);
      }
    }
  };
  
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(getLocalDateString(new Date()));

  const handleUpdateHome = (updates: Partial<HomeContent>) => {
    onUpdateHome({ ...homeContent, ...updates });
  };

  const handleConfirmBooking = (booking: Booking) => {
    if (booking.date === 'COMPRA_BONO') {
      const newBono: HourBono = {
        id: Math.random().toString(36).substr(2, 5),
        code: `BONO-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        customerName: booking.customerName,
        totalHours: booking.duration,
        remainingHours: booking.duration,
        isActive: true
      };
      onUpdateHome({ ...homeContent, hourBonos: [...(homeContent.hourBonos || []), newBono] });
    }
    const newList = bookings.map(b => b.id === booking.id ? { ...b, status: 'confirmed' as const } : b);
    onUpdateBookings(newList);
  };

  const handleDeleteBooking = (id: string) => {
    if (window.confirm("¿Seguro que quieres eliminar esta reserva? Esta acción no se puede deshacer.")) {
      onUpdateBookings(bookings.filter(b => b.id !== id));
    }
  };

  // Generador de enlace WhatsApp con confirmación de pago
  const getWhatsAppLink = (booking: Booking) => {
    if (!booking.customerPhone) return null;
    const phone = booking.customerPhone.replace(/\D/g, ''); 
    if (phone.length < 9) return null; 

    const msg = `Hola ${booking.customerName}, confirmamos la recepción de tu pago. Tu sesión en ${homeContent.studioName} para el día ${booking.date} a las ${booking.startTime}:00h queda confirmada. ¡Te esperamos!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const days = [];
    for (let i = 0; i < offset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentMonth]);

  const getPackName = (packId: string) => {
    return packs.find(p => p.id === packId)?.name || 'Pack Desconocido';
  };

  // Helper para obtener nombres de extras
  const getExtrasNames = (ids: string[]) => {
    if (!ids || ids.length === 0) return null;
    return ids.map(id => homeContent.extras.find(e => e.id === id)?.name).filter(Boolean).join(', ');
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto py-40 text-center px-6">
        <h1 className="text-3xl font-orbitron font-bold mb-10 uppercase text-purple-600">Acceso Admin</h1>
        <form onSubmit={handleLogin} className="space-y-5">
          <input 
            type="password" 
            value={passwordInput} 
            onChange={(e) => setPasswordInput(e.target.value)} 
            disabled={isLocked}
            className={`w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 text-center text-white outline-none focus:border-purple-600 text-lg font-mono transition-all ${isLocked ? 'opacity-50 cursor-not-allowed border-red-900' : ''}`} 
            placeholder={isLocked ? `BLOQUEADO (${lockTimer}s)` : "PASSWORD"} 
          />
          <button 
            disabled={isLocked}
            className={`w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest text-white transition-all ${isLocked ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500'}`}
          >
            {isLocked ? `Espera ${lockTimer}s` : 'Entrar'}
          </button>
          {isLocked && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">Demasiados intentos fallidos</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto">
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center font-black text-white shadow-xl">A</div>
          <div>
            <h1 className="text-2xl font-orbitron font-bold uppercase text-white tracking-tighter">Control Center</h1>
            <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest mt-1">Gestión del Estudio</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
          {['calendar', 'bookings', 'marketing', 'inventory', 'schedule', 'home', 'config'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>{tab}</button>
          ))}
        </div>
      </header>
      
      {activeTab === 'calendar' && (
        <div className="grid lg:grid-cols-4 gap-8">
           <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1))} className="text-zinc-400 p-2 hover:bg-white/5 rounded-full transition-all">←</button>
                <h2 className="font-orbitron font-bold uppercase text-sm tracking-widest text-white">{currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h2>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1))} className="text-zinc-400 p-2 hover:bg-white/5 rounded-full transition-all">→</button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'].map(d => <div key={d} className="text-center text-[9px] font-black text-zinc-600 uppercase mb-5">{d}</div>)}
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={idx} className="h-20" />;
                  const dateStr = getLocalDateString(day);
                  const dayBookings = (bookings || []).filter(b => b.date === dateStr);
                  const isSelected = selectedCalendarDate === dateStr;
                  const isClosed = homeContent.availability.overrides.some(o => o.date === dateStr && !o.isOpen);
                  return (
                    <div key={idx} onClick={() => setSelectedCalendarDate(dateStr)} className={`h-20 border rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${isSelected ? 'bg-purple-600 border-purple-500 shadow-xl z-10 scale-105' : isClosed ? 'bg-red-950/20 border-red-900/40 text-red-500' : 'bg-black/40 border-zinc-800 hover:border-zinc-700'}`}>
                      <span className="text-xs font-bold text-white">{day.getDate()}</span>
                      <div className="flex gap-0.5 mt-1">
                        {dayBookings.slice(0, 3).map((b, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${b.status === 'confirmed' ? 'bg-green-500' : 'bg-orange-500'}`} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
           </div>
           <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-4 shadow-2xl overflow-y-auto max-h-[70vh]">
              <h3 className="text-[11px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-800 pb-4">Eventos {selectedCalendarDate}</h3>
              {bookings.filter(b => b.date === selectedCalendarDate).length > 0 ? bookings.filter(b => b.date === selectedCalendarDate).map(b => (
                <div key={b.id} className="p-4 bg-black border border-zinc-800 rounded-2xl space-y-3 shadow-xl hover:border-zinc-700 transition-all">
                  <div className="flex justify-between items-start">
                     <div className="text-[11px] font-bold text-white uppercase truncate">{b.customerName}</div>
                     <div className="text-[9px] font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded uppercase">{b.startTime}:00h</div>
                  </div>
                  <div className="text-[9px] text-zinc-400 font-medium uppercase tracking-wide">
                     {b.date === 'COMPRA_BONO' ? 'Compra Bono Horas' : getPackName(b.packId)}
                  </div>
                  
                  {/* EXTRAS EN CALENDARIO */}
                  {b.selectedExtrasIds && b.selectedExtrasIds.length > 0 && (
                    <div className="text-[8px] text-zinc-500 font-black uppercase mt-1 tracking-widest border-t border-zinc-800 pt-2">
                        + {getExtrasNames(b.selectedExtrasIds)}
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    {b.status === 'pending_verification' && <button onClick={() => handleConfirmBooking(b)} className="flex-1 bg-green-600 py-2 rounded-xl text-[8px] font-black uppercase text-white">Validar</button>}
                    <button onClick={() => handleDeleteBooking(b.id)} className="bg-zinc-800 px-3 py-2 rounded-xl text-white text-[8px] font-black uppercase hover:bg-red-600 transition-colors">Borrar</button>
                  </div>
                </div>
              )) : <p className="text-center py-20 text-[9px] uppercase text-zinc-700 font-black">Sin eventos</p>}
           </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-white/5 font-black uppercase text-zinc-600 tracking-widest border-b border-zinc-800">
              <tr><th className="p-6">Cliente</th><th>Detalles</th><th>Importe</th><th>Estado</th><th className="text-right p-6">Acciones</th></tr>
            </thead>
            <tbody>
              {[...bookings].sort((a,b) => b.createdAt - a.createdAt).map(b => {
                const waLink = getWhatsAppLink(b);
                const packName = getPackName(b.packId);
                const extrasText = getExtrasNames(b.selectedExtrasIds);

                return (
                  <tr key={b.id} className="border-b border-zinc-800/50 hover:bg-white/[0.02] transition-all">
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                          <div className="font-bold text-white uppercase">{b.customerName}</div>
                          {waLink && (
                              <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-400" title="Confirmar Pago por WhatsApp">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                              </a>
                          )}
                      </div>
                      <div className="text-[8px] text-zinc-600 mt-1 font-black">{b.customerEmail}</div>
                    </td>
                    <td>
                      <div className={`font-orbitron font-bold uppercase ${b.date === 'COMPRA_BONO' ? 'text-blue-500' : 'text-purple-500'}`}>{b.date === 'COMPRA_BONO' ? 'BONO' : b.date}</div>
                      {b.date !== 'COMPRA_BONO' && (
                         <div className="space-y-1 mt-1">
                            <div className="text-[9px] text-zinc-500 font-black uppercase">{b.startTime}:00 ({b.duration}H)</div>
                            <div className="text-[9px] text-zinc-300 font-bold uppercase bg-zinc-800 px-1.5 py-0.5 rounded w-fit">{packName}</div>
                            {extrasText && (
                                <div className="text-[8px] text-blue-400 font-bold uppercase tracking-wider mt-1">
                                    + {extrasText}
                                </div>
                            )}
                         </div>
                      )}
                    </td>
                    <td className="font-orbitron font-bold text-white text-lg">{b.totalPrice}€</td>
                    <td><span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${b.status === 'confirmed' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>{b.status}</span></td>
                    <td className="p-6 text-right flex justify-end gap-2">
                        {b.status === 'pending_verification' && <button onClick={() => handleConfirmBooking(b)} className="bg-green-600 text-white px-4 py-2 rounded-xl text-[8px] font-black uppercase shadow-lg hover:bg-green-500 transition-all">Validar</button>}
                        <button onClick={() => handleDeleteBooking(b.id)} className="bg-zinc-800 text-zinc-500 px-4 py-2 rounded-xl text-[8px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">Borrar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'marketing' && (
        <div className="grid md:grid-cols-2 gap-10">
          <section className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] shadow-2xl">
            <h3 className="text-sm font-orbitron font-black uppercase text-white tracking-widest border-b border-zinc-800 pb-4 mb-6">Bonos Activos</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {(homeContent.hourBonos || []).map(b => (
                <div key={b.id} className="p-6 bg-black border border-zinc-800 rounded-[2rem] flex items-center justify-between group">
                  <div>
                    <div className="text-blue-500 font-orbitron font-bold text-lg">{b.code}</div>
                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{b.customerName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-500 leading-none mb-1">{b.remainingHours}H / {b.totalHours}H</div>
                    <button onClick={() => handleUpdateHome({ hourBonos: homeContent.hourBonos.filter(x => x.id !== b.id) })} className="text-[8px] text-zinc-700 uppercase font-black hover:text-red-500 transition-colors">Eliminar</button>
                  </div>
                </div>
              ))}
              {(homeContent.hourBonos || []).length === 0 && <p className="text-center py-20 text-[9px] font-black text-zinc-800 uppercase">Sin bonos activos</p>}
            </div>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-6">
              <h3 className="text-sm font-orbitron font-black uppercase text-white tracking-widest">Cupones</h3>
              <button onClick={() => handleUpdateHome({ coupons: [...(homeContent.coupons || []), { id: Math.random().toString(36).substr(2, 5), code: 'PROMO20', discountPercentage: 20, isActive: true }] })} className="bg-purple-600 px-5 py-2 rounded-xl text-[9px] font-black uppercase text-white shadow-xl">+ Crear</button>
            </div>
            <div className="space-y-4">
               {(homeContent.coupons || []).map(c => (
                 <div key={c.id} className="p-5 bg-black rounded-[2rem] flex gap-4 items-center border border-zinc-800">
                    <input value={c.code} onChange={e => handleUpdateHome({ coupons: homeContent.coupons.map(x => x.id === c.id ? {...x, code: e.target.value.toUpperCase()} : x) })} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-[11px] text-white font-black w-32 outline-none focus:border-purple-600" />
                    <input type="number" value={c.discountPercentage} onChange={e => handleUpdateHome({ coupons: homeContent.coupons.map(x => x.id === c.id ? {...x, discountPercentage: Number(e.target.value)} : x) })} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-[11px] text-purple-400 font-bold w-16" />
                    <button onClick={() => handleUpdateHome({ coupons: homeContent.coupons.filter(x => x.id !== c.id) })} className="text-zinc-700 hover:text-red-500 font-bold ml-auto transition-colors">✕</button>
                 </div>
               ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="grid md:grid-cols-2 gap-10">
          <section className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] shadow-2xl">
             <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-6">
                <h3 className="text-sm font-orbitron font-black uppercase text-white tracking-widest">Configuración de Packs</h3>
                <button onClick={() => onUpdatePacks([...packs, { id: Math.random().toString(36).substr(2, 5), name: 'Nuevo Pack', description: 'Uso del espacio...', pricePerHour: 20, features: [], icon: '🎧', isActive: true }])} className="text-[9px] font-black text-purple-600 uppercase tracking-widest">+ Añadir</button>
             </div>
             <div className="space-y-8 max-h-[75vh] overflow-y-auto pr-3 scrollbar-thin">
                {packs.map(p => (
                  <div key={p.id} className="bg-black/40 border border-zinc-800 p-6 rounded-[2.5rem] space-y-5 group">
                    <div className="flex items-center gap-4">
                      <input value={p.icon} onChange={e => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, icon: e.target.value} : x))} className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl text-center outline-none" title="Emoji/Icono" />
                      <input value={p.name} onChange={e => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, name: e.target.value} : x))} className="flex-1 bg-transparent text-white font-bold uppercase outline-none focus:border-purple-600" title="Nombre del Pack" />
                      <button onClick={() => onUpdatePacks(packs.filter(x => x.id !== p.id))} className="text-zinc-800 hover:text-red-500 transition-colors">✕</button>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-1">Descripción (subtítulo)</label>
                       <textarea 
                         value={p.description} 
                         onChange={e => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, description: e.target.value} : x))}
                         className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-[10px] text-zinc-400 h-16 outline-none focus:border-blue-600 shadow-inner resize-none"
                         placeholder="Ej: Solo uso de sala..."
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-1">Incluye (una característica por línea)</label>
                       <textarea 
                         value={p.features.join('\n')} 
                         onChange={e => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, features: e.target.value.split('\n').filter(f => f.trim() !== '')} : x))}
                         className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-[10px] text-white h-24 outline-none focus:border-purple-600 shadow-inner"
                         placeholder="Insonorización&#10;Aire acondicionado..."
                       />
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                       <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Precio/H</span>
                        <input type="number" value={p.pricePerHour} onChange={e => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, pricePerHour: Number(e.target.value)} : x))} className="w-16 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-purple-400 font-bold" />
                       </div>
                       <button onClick={() => onUpdatePacks(packs.map(x => x.id === p.id ? {...x, isActive: !p.isActive} : x))} className={`ml-auto px-5 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest ${p.isActive ? 'bg-green-600/10 text-green-500 border border-green-500/20' : 'bg-red-600/10 text-red-500 border border-red-500/20'}`}>{p.isActive ? 'Público' : 'Oculto'}</button>
                    </div>
                  </div>
                ))}
             </div>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl">
             <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-6">
                <h3 className="text-sm font-orbitron font-black uppercase text-white tracking-widest">Servicios Extra</h3>
                <button onClick={() => handleUpdateHome({ extras: [...(homeContent.extras || []), { id: Math.random().toString(36).substr(2, 5), name: 'Extra', price: 5, icon: '✨' }] })} className="text-[9px] font-black text-blue-600 uppercase tracking-widest">+ Añadir</button>
             </div>
             <div className="grid grid-cols-2 gap-4">
                {(homeContent.extras || []).map(e => (
                  <div key={e.id} className="bg-black/40 border border-zinc-800 p-5 rounded-[2rem] relative group">
                    <button onClick={() => handleUpdateHome({ extras: homeContent.extras.filter(x => x.id !== e.id) })} className="absolute top-4 right-4 text-zinc-800 hover:text-red-500">✕</button>
                    <input value={e.icon} onChange={v => handleUpdateHome({ extras: homeContent.extras.map(x => x.id === e.id ? {...x, icon: v.target.value} : x) })} className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl text-center mb-2 mx-auto block outline-none" />
                    <input value={e.name} onChange={v => handleUpdateHome({ extras: homeContent.extras.map(x => x.id === e.id ? {...x, name: v.target.value} : x) })} className="bg-transparent text-center font-bold text-[9px] text-white uppercase w-full outline-none" />
                    <div className="flex items-center gap-1 justify-center">
                       <input type="number" value={e.price} onChange={v => handleUpdateHome({ extras: homeContent.extras.map(x => x.id === e.id ? {...x, price: Number(v.target.value)} : x) })} className="w-12 bg-zinc-900 border border-zinc-800 rounded text-center text-xs text-blue-400 font-bold" />
                       <span className="text-[9px] text-zinc-600 font-black">€</span>
                    </div>
                  </div>
                ))}
             </div>
          </section>
        </div>
      )}

      {/* HORARIOS */}
      {activeTab === 'schedule' && (
        <div className="grid lg:grid-cols-2 gap-10">
          <section className="bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-sm font-orbitron font-black uppercase text-white border-b border-zinc-800 pb-4 mb-6 tracking-widest">Horario Semanal</h3>
            <div className="space-y-4">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((dayKey) => {
                const day = (homeContent.availability as any)[dayKey] as DaySchedule;
                const esDays: any = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' };
                return (
                  <div key={dayKey} className="flex items-center gap-4 bg-black/40 border border-zinc-800 p-4 rounded-xl">
                    <div className="w-24 text-[10px] font-black uppercase text-zinc-500 tracking-widest">{esDays[dayKey]}</div>
                    <button 
                      onClick={() => {
                        const newAv = { ...homeContent.availability };
                        (newAv as any)[dayKey].isOpen = !day.isOpen;
                        handleUpdateHome({ availability: newAv });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase ${day.isOpen ? 'bg-green-600/10 text-green-500' : 'bg-red-600/10 text-red-500'}`}
                    >
                      {day.isOpen ? 'Abierto' : 'Cerrado'}
                    </button>
                    {day.isOpen && (
                      <div className="flex items-center gap-2 ml-auto">
                        <input type="number" value={day.start} onChange={(e) => {
                           const newAv = { ...homeContent.availability };
                           (newAv as any)[dayKey].start = Number(e.target.value);
                           handleUpdateHome({ availability: newAv });
                        }} className="w-12 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white text-center" />
                        <span className="text-zinc-600">-</span>
                        <input type="number" value={day.end} onChange={(e) => {
                           const newAv = { ...homeContent.availability };
                           (newAv as any)[dayKey].end = Number(e.target.value);
                           handleUpdateHome({ availability: newAv });
                        }} className="w-12 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white text-center" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-sm font-orbitron font-black uppercase text-white border-b border-zinc-800 pb-4 mb-6 tracking-widest">Excepciones y Festivos</h3>
            <div className="mb-6 flex gap-2">
               <input type="date" id="newOverrideDate" className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-purple-600" />
               <button onClick={() => {
                  const input = document.getElementById('newOverrideDate') as HTMLInputElement;
                  if (input.value) {
                    const overrides = [...homeContent.availability.overrides, { id: Math.random().toString(36).substr(2), date: input.value, isOpen: false }];
                    handleUpdateHome({ availability: { ...homeContent.availability, overrides } });
                    input.value = '';
                  }
               }} className="bg-purple-600 text-white px-4 rounded-xl text-[9px] font-black uppercase">Añadir Fecha</button>
            </div>
            <div className="space-y-3">
              {homeContent.availability.overrides.map(ov => (
                <div key={ov.id} className="flex items-center justify-between bg-black/40 border border-zinc-800 p-4 rounded-xl">
                   <div>
                     <div className="text-white font-bold text-xs">{ov.date}</div>
                     <div className="text-[9px] text-red-500 font-black uppercase mt-1">{ov.isOpen ? 'Horario Especial' : 'Cerrado Todo el Día'}</div>
                   </div>
                   <button onClick={() => {
                      const overrides = homeContent.availability.overrides.filter(x => x.id !== ov.id);
                      handleUpdateHome({ availability: { ...homeContent.availability, overrides } });
                   }} className="text-zinc-600 hover:text-red-500">✕</button>
                </div>
              ))}
              {homeContent.availability.overrides.length === 0 && <p className="text-zinc-700 text-[9px] uppercase font-black text-center py-10">No hay excepciones configuradas</p>}
            </div>
          </section>
        </div>
      )}

      {/* DISEÑO HOME */}
      {activeTab === 'home' && (
        <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3.5rem] shadow-2xl space-y-12">
           <h3 className="text-xl font-orbitron font-black uppercase text-white border-b border-zinc-800 pb-6 tracking-widest">Edición de Contenidos</h3>
           <div className="grid lg:grid-cols-2 gap-16">
              <div className="space-y-8">
                 <div className="space-y-4">
                    <label className="text-[8px] font-black text-zinc-600 uppercase ml-2 tracking-widest">Título Principal (Hero)</label>
                    <textarea value={homeContent.heroTitle} onChange={e => handleUpdateHome({ heroTitle: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-2xl p-6 text-xl font-bold text-white h-40 outline-none focus:border-purple-600 shadow-inner" />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[8px] font-black text-zinc-600 uppercase ml-2 tracking-widest">Subtítulo (Hero)</label>
                    <textarea value={homeContent.heroSubtitle} onChange={e => handleUpdateHome({ heroSubtitle: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-2xl p-6 text-sm text-zinc-400 h-24 outline-none focus:border-purple-600 shadow-inner" />
                 </div>
                 <div className="space-y-4 p-8 bg-black/40 border border-blue-900/20 rounded-[2.5rem]">
                    <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Sección Banner Informativo</h4>
                    <div className="space-y-4">
                      <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-2">Título Banner</label>
                      <input value={homeContent.bannerTitle} onChange={e => handleUpdateHome({ bannerTitle: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-4 text-xs font-bold text-white outline-none focus:border-blue-600 shadow-inner" />
                      
                      <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-2">Descripción Banner</label>
                      <textarea value={homeContent.studioDescription} onChange={e => handleUpdateHome({ studioDescription: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-xs text-zinc-400 h-40 outline-none focus:border-blue-600 shadow-inner" />
                    </div>
                 </div>
              </div>
              <div className="space-y-8">
                 <div className="space-y-4">
                    <label className="text-[8px] font-black text-zinc-600 uppercase ml-2 tracking-widest">Imagen de Fondo (Hero URL)</label>
                    <input value={homeContent.heroImageUrl} onChange={e => handleUpdateHome({ heroImageUrl: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-5 py-4 text-[10px] text-blue-500 font-mono shadow-inner outline-none" />
                    <div className="w-full h-32 rounded-2xl overflow-hidden border border-zinc-800 mt-2">
                      <img src={homeContent.heroImageUrl} className="w-full h-full object-cover opacity-50" alt="Preview" />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[8px] font-black text-zinc-600 uppercase ml-2 tracking-widest">Textos de Pie (Footer)</label>
                    <input value={homeContent.footerText} onChange={e => handleUpdateHome({ footerText: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-5 py-4 text-[10px] text-white outline-none mb-2" placeholder="Dirección / Contacto" />
                    <textarea value={homeContent.footerSecondaryText} onChange={e => handleUpdateHome({ footerSecondaryText: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-[10px] text-zinc-500 h-24 outline-none resize-none" placeholder="Legal / Derechos" />
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="space-y-10">
          <div className="grid lg:grid-cols-2 gap-8">
            <section className="bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl space-y-6">
               <h3 className="text-sm font-orbitron font-black uppercase text-white border-b border-zinc-800 pb-4 tracking-widest">Métodos de Pago</h3>
               <div className="space-y-5">
                  <div className="p-5 bg-black/40 rounded-2xl border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Bizum & WhatsApp Contact</span>
                      <button onClick={() => handleUpdateHome({ payments: { ...homeContent.payments, bizumEnabled: !homeContent.payments.bizumEnabled } })} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase ${homeContent.payments.bizumEnabled ? 'bg-blue-600 text-white shadow-lg' : 'bg-zinc-800 text-zinc-500'}`}>{homeContent.payments.bizumEnabled ? 'Activo' : 'Inactivo'}</button>
                    </div>
                    <input value={homeContent.payments.bizumPhone} onChange={e => handleUpdateHome({ payments: { ...homeContent.payments, bizumPhone: e.target.value } })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-600" placeholder="Teléfono (también para recibir reservas WhatsApp)" />
                    <p className="text-[8px] text-zinc-600 italic">Este número recibirá los mensajes de confirmación de reserva.</p>
                  </div>
                  <div className="p-5 bg-black/40 rounded-2xl border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Revolut</span>
                      <button onClick={() => handleUpdateHome({ payments: { ...homeContent.payments, revolutEnabled: !homeContent.payments.revolutEnabled } })} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase ${homeContent.payments.revolutEnabled ? 'bg-purple-600 text-white shadow-lg' : 'bg-zinc-800 text-zinc-500'}`}>{homeContent.payments.revolutEnabled ? 'Activo' : 'Inactivo'}</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <input value={homeContent.payments.revolutTag} onChange={e => handleUpdateHome({ payments: { ...homeContent.payments, revolutTag: e.target.value } })} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-purple-600" placeholder="@usuario (Tag)" />
                        <input value={homeContent.payments.revolutLink} onChange={e => handleUpdateHome({ payments: { ...homeContent.payments, revolutLink: e.target.value } })} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-blue-400 font-mono outline-none focus:border-blue-600" placeholder="https://revolut.me/..." />
                    </div>
                  </div>
                  <div className="p-5 bg-black/40 rounded-2xl border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tarjeta (Mollie)</span>
                      <button onClick={() => handleUpdateHome({ payments: { ...homeContent.payments, mollieEnabled: !homeContent.payments.mollieEnabled } })} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase ${homeContent.payments.mollieEnabled ? 'bg-amber-600 text-white shadow-lg' : 'bg-zinc-800 text-zinc-500'}`}>{homeContent.payments.mollieEnabled ? 'Activo' : 'Inactivo'}</button>
                    </div>
                    <input value={homeContent.payments.mollieApiKey} onChange={e => handleUpdateHome({ payments: { ...homeContent.payments, mollieApiKey: e.target.value } })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-[9px] text-amber-500 font-mono outline-none focus:border-amber-600" placeholder="live_xxxxxxxxxxxxxxxxxxxxxxxxxx" type="password" />
                  </div>
               </div>
            </section>

            <section className="bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl space-y-6">
               <h3 className="text-sm font-orbitron font-black uppercase text-white border-b border-zinc-800 pb-4 tracking-widest">Sincronización Cloud</h3>
               <div className="flex flex-col gap-4">
                <input value={homeContent.apiUrl} onChange={e => handleUpdateHome({ apiUrl: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-6 py-4 text-[10px] text-blue-500 font-mono tracking-widest" placeholder="https://..." />
                <button onClick={onPushToCloud} className="w-full bg-white text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-xl">Empujar Datos</button>
               </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
