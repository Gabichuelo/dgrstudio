
import React, { useState, useMemo, useEffect } from 'react';
import { Pack, Booking, HomeContent, DaySchedule, Extra, Coupon, HourBono } from '../types';

interface BookingViewProps {
  packs: Pack[];
  bookings: Booking[];
  homeContent: HomeContent;
  onSubmit: (booking: Booking) => void;
  initialPackId?: string | null;
}

const BookingView: React.FC<BookingViewProps> = ({ packs, bookings, homeContent, onSubmit, initialPackId }) => {
  const activePacks = useMemo(() => packs.filter(p => p.isActive), [packs]);
  
  const [bookingMode, setBookingMode] = useState<'session' | 'bono'>('session');
  const [selectedPack, setSelectedPack] = useState<Pack>(() => {
    if (initialPackId) {
      const p = activePacks.find(x => x.id === initialPackId);
      if (p) return p;
    }
    return activePacks[0] || packs[0];
  });

  const [selectedExtrasIds, setSelectedExtrasIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(1);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  const [bonoSize, setBonoSize] = useState<3 | 5 | 10>(3);
  const [bonoInput, setBonoInput] = useState('');
  const [appliedBono, setAppliedBono] = useState<HourBono | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success'>('idle');

  useEffect(() => {
    if (initialPackId) {
      const p = activePacks.find(x => x.id === initialPackId);
      if (p) setSelectedPack(p);
    }
  }, [initialPackId, activePacks]);

  const currentDaySchedule = useMemo(() => {
    const override = homeContent.availability.overrides.find(o => o.date === selectedDate);
    if (override) return override as any as DaySchedule;

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = new Date(selectedDate).getDay();
    const dayName = days[dayIndex] as keyof typeof homeContent.availability;
    return (homeContent.availability as any)[dayName] as DaySchedule;
  }, [selectedDate, homeContent.availability]);

  const handleApplyCode = () => {
    setErrorMsg('');
    setAppliedBono(null);
    setAppliedCoupon(null);

    const input = bonoInput.trim().toUpperCase();
    if (!input) return;

    const coupon = (homeContent.coupons || []).find(c => c.code === input);
    if (coupon) {
      if (!coupon.isActive) { setErrorMsg('CUPÓN INACTIVO'); return; }
      setAppliedCoupon(coupon);
      return;
    }

    const bono = (homeContent.hourBonos || []).find(b => b.code === input);
    if (bono) {
      if (!bono.isActive) { setErrorMsg('BONO DESACTIVADO'); return; }
      if (bono.remainingHours < duration) { setErrorMsg(`SALDO INSUFICIENTE (${bono.remainingHours}H)`); return; }
      
      setAppliedBono(bono);
      const customerRecord = bookings.find(b => b.appliedBonoCode === bono.code || b.customerName === bono.customerName);
      if (customerRecord) {
        setCustomerName(customerRecord.customerName);
        setCustomerEmail(customerRecord.customerEmail);
        setCustomerPhone(customerRecord.customerPhone || '');
      } else {
        setCustomerName(bono.customerName);
      }
      return;
    }

    setErrorMsg('CÓDIGO NO VÁLIDO');
  };

  const totalPrice = useMemo(() => {
    const extrasPricePerHour = selectedExtrasIds.reduce((acc, id) => {
      const extra = (homeContent.extras || []).find(e => e.id === id);
      return acc + (extra?.price || 0);
    }, 0);

    if (bookingMode === 'bono') {
      const discount = bonoSize === 3 ? 0.05 : bonoSize === 5 ? 0.10 : 0.20;
      // Los extras en los bonos se cobran por hora dentro del bono y se aplica el descuento del bono al total
      const hourlyBase = selectedPack.pricePerHour + extrasPricePerHour;
      return (hourlyBase * bonoSize) * (1 - discount);
    }

    if (appliedBono) {
      // Si usa bono, solo paga los extras de esta sesión específica (se asume precio por hora de extra * duración)
      return extrasPricePerHour * duration;
    }

    let base = selectedPack.pricePerHour * duration;
    let extrasTotal = extrasPricePerHour * duration;
    let total = base + extrasTotal;
    
    if (appliedCoupon) total = total * (1 - appliedCoupon.discountPercentage / 100);
    return total;
  }, [selectedPack, duration, selectedExtrasIds, homeContent.extras, bookingMode, bonoSize, appliedCoupon, appliedBono]);

  const availableSlots = useMemo(() => {
    if (bookingMode !== 'session' || !currentDaySchedule || !currentDaySchedule.isOpen) return [];
    const slots = [];
    const dayBookings = (bookings || []).filter(b => b.date === selectedDate && b.status !== 'cancelled');
    for (let h = currentDaySchedule.start; h < currentDaySchedule.end; h += 0.5) {
      const fitsInSchedule = (h + duration) <= currentDaySchedule.end;
      const isOccupied = dayBookings.some(b => {
          const bEnd = b.startTime + b.duration + 0.5;
          return h < bEnd && (h + duration) > b.startTime;
      });
      slots.push({ 
        hour: h, 
        label: `${Math.floor(h)}:${h % 1 === 0 ? '00' : '30'}`, 
        isOccupied: isOccupied || !fitsInSchedule 
      });
    }
    return slots;
  }, [currentDaySchedule, bookings, selectedDate, duration, bookingMode]);

  const toggleExtra = (id: string) => {
    setSelectedExtrasIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleFinalSubmit = (method: 'bizum' | 'revolut' | 'mollie' | 'bono') => {
    if (bookingMode === 'session' && (selectedHour === null || errorMsg)) return;
    if (bookingMode === 'bono' && (!customerName || !customerEmail)) return;
    
    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      date: bookingMode === 'bono' ? 'COMPRA_BONO' : selectedDate,
      startTime: bookingMode === 'bono' ? 0 : selectedHour!,
      duration: bookingMode === 'bono' ? bonoSize : duration,
      packId: selectedPack.id,
      selectedExtrasIds,
      customerName,
      customerEmail,
      customerPhone,
      totalPrice,
      status: (method === 'mollie' || method === 'bono') ? 'confirmed' : 'pending_verification',
      paymentMethod: method === 'mollie' || method === 'bono' ? method : 'bizum',
      appliedCouponCode: appliedCoupon?.code,
      appliedBonoCode: appliedBono?.code,
      createdAt: Date.now()
    };

    onSubmit(newBooking);
    setPaymentStatus('success');
  };

  if (paymentStatus === 'success') {
    return (
      <div className="max-w-xl mx-auto py-20 text-center animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-10 shadow-2xl">✓</div>
        <h2 className="text-4xl font-orbitron font-bold mb-4 uppercase tracking-tighter">Reserva Realizada</h2>
        <p className="text-zinc-500 mb-12 text-lg font-light leading-relaxed">Tu solicitud ha sido enviada con éxito. Revisa tu email para los detalles finales.</p>
        <button onClick={() => window.location.reload()} className="bg-white text-black py-4 px-16 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-purple-600 hover:text-white transition-all shadow-xl">Entendido</button>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <div className="lg:col-span-2 space-y-10">
        <div className="flex bg-zinc-900/50 p-2 rounded-[2rem] border border-zinc-800 backdrop-blur-xl">
          <button onClick={() => { setBookingMode('session'); setSelectedExtrasIds([]); }} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${bookingMode === 'session' ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20' : 'text-zinc-500 hover:text-white'}`}>Sesión Individual</button>
          <button onClick={() => { setBookingMode('bono'); setSelectedExtrasIds([]); }} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${bookingMode === 'bono' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-zinc-500 hover:text-white'}`}>Comprar Bono Ahorro</button>
        </div>

        {/* Paso 1: Pack */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-[12px] font-black text-white shadow-lg">1</span>
            <h2 className="text-xl font-bold font-orbitron uppercase tracking-widest">
              {bookingMode === 'session' ? 'Selecciona tu Pack' : 'Pack para el Bono'}
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-5">
            {activePacks.map(p => (
              <button key={p.id} onClick={() => setSelectedPack(p)} className={`p-7 rounded-[2.5rem] border text-left transition-all relative overflow-hidden group ${selectedPack.id === p.id ? 'border-purple-500 bg-purple-500/5 shadow-2xl shadow-purple-500/10' : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700'}`}>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{p.icon}</div>
                <h4 className="font-black text-xs uppercase text-white tracking-widest">{p.name}</h4>
                <div className="text-2xl font-orbitron font-bold mt-2 text-white">{p.pricePerHour}€<span className="text-zinc-600 text-[10px] ml-1 font-black">/H</span></div>
              </button>
            ))}
          </div>
        </section>

        {/* Paso 2: Extras (Ahora antes de elegir horas en Bono) */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-[12px] font-black text-white shadow-lg">2</span>
            <h2 className="text-xl font-bold font-orbitron uppercase tracking-widest">Servicios Extra</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
             {(homeContent.extras || []).map(extra => (
               <button key={extra.id} onClick={() => toggleExtra(extra.id)} className={`p-5 rounded-[2rem] border transition-all flex flex-col items-center group ${selectedExtrasIds.includes(extra.id) ? 'border-blue-500 bg-blue-500/5' : 'bg-zinc-900/20 border-zinc-800'}`}>
                 <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">{extra.icon}</span>
                 <span className="text-[10px] font-black text-white uppercase">{extra.name}</span>
                 <span className="text-[10px] font-bold text-zinc-500">+{extra.price}€/H</span>
               </button>
             ))}
          </div>
        </section>

        {/* Paso 3: Horas Bono o Agenda Sesión */}
        {bookingMode === 'bono' ? (
          <section className="space-y-6 animate-in slide-in-from-right duration-500">
             <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-[12px] font-black text-white shadow-lg">3</span>
                <h2 className="text-xl font-bold font-orbitron uppercase tracking-widest text-blue-500">Horas del Bono</h2>
             </div>
             <div className="grid grid-cols-3 gap-4">
               {[
                 { h: 3, d: '5%' },
                 { h: 5, d: '10%' },
                 { h: 10, d: '20%' }
               ].map(item => (
                 <button key={item.h} onClick={() => setBonoSize(item.h as 3|5|10)} className={`p-8 rounded-[2rem] border text-center transition-all ${bonoSize === item.h ? 'bg-blue-600/10 border-blue-500 shadow-2xl shadow-blue-500/10' : 'bg-zinc-900/20 border-zinc-800'}`}>
                   <div className="text-3xl font-orbitron font-bold text-white mb-1">{item.h}H</div>
                   <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Dto. {item.d}</div>
                 </button>
               ))}
             </div>
          </section>
        ) : (
          <section className="space-y-6 animate-in slide-in-from-left duration-500">
             <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-[12px] font-black text-white shadow-lg">3</span>
                <h2 className="text-xl font-bold font-orbitron uppercase tracking-widest">Reserva el Momento</h2>
             </div>
             <div className="bg-zinc-900/30 p-10 rounded-[2.5rem] border border-zinc-800/60 backdrop-blur-sm space-y-10">
               <div className="grid sm:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Día de la sesión</label>
                    <input type="date" value={selectedDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-purple-600 transition-colors" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Sesión de...</label>
                    <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-purple-600 transition-colors">
                      {[1, 1.5, 2, 2.5, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}h</option>)}
                    </select>
                 </div>
               </div>
               
               <div className="space-y-4">
                 <label className="text-[9px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Horarios Disponibles</label>
                 <div className="flex flex-wrap gap-2.5">
                   {availableSlots.length > 0 ? availableSlots.map(slot => (
                     <button key={slot.hour} disabled={slot.isOccupied} onClick={() => setSelectedHour(slot.hour)} className={`px-6 py-3 rounded-xl border text-[11px] font-bold transition-all ${slot.isOccupied ? 'opacity-10 grayscale cursor-not-allowed' : selectedHour === slot.hour ? 'bg-purple-600 border-purple-500 text-white shadow-xl shadow-purple-600/20' : 'bg-black/40 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'}`}>{slot.label}</button>
                   )) : <div className="w-full py-10 text-center bg-black/40 rounded-3xl border border-zinc-800 text-zinc-600 font-black uppercase text-[10px]">Estudio Cerrado o Sin Huecos</div>}
                 </div>
               </div>
             </div>
          </section>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 h-fit sticky top-28 shadow-2xl space-y-8 backdrop-blur-3xl">
        <div className="text-center space-y-2 border-b border-zinc-800 pb-6">
          <h3 className="font-orbitron font-bold uppercase text-[11px] text-purple-500 tracking-[0.3em]">Resumen de Pedido</h3>
          <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">{bookingMode === 'session' ? 'Alquiler Estudio' : 'Compra Bono Prepago'}</p>
        </div>
        
        <div className="space-y-5">
           <div className="bg-black/50 p-6 rounded-3xl border border-zinc-800 space-y-4 shadow-inner">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-white font-black text-[11px] uppercase tracking-widest">{selectedPack.name}</div>
                  {bookingMode === 'session' ? (
                    <div className="text-zinc-500 text-[10px] mt-1">{duration} horas @ {selectedHour ? `${Math.floor(selectedHour)}:${selectedHour % 1 === 0 ? '00' : '30'}` : '--:--'}</div>
                  ) : (
                    <div className="text-blue-500 text-[10px] mt-1 font-bold">BONO {bonoSize} HORAS</div>
                  )}
                </div>
                <div className="text-white font-orbitron font-bold text-sm">
                   {bookingMode === 'session' ? `${selectedPack.pricePerHour}€/H` : `${(((selectedPack.pricePerHour + selectedExtrasIds.reduce((acc, id) => acc + (homeContent.extras.find(e => e.id === id)?.price || 0), 0)) * bonoSize) * (1 - (bonoSize === 3 ? 0.05 : bonoSize === 5 ? 0.10 : 0.20)) / bonoSize).toFixed(1)}€/H`}
                </div>
              </div>

              {selectedExtrasIds.length > 0 && (
                <div className="pt-2 space-y-1 border-t border-zinc-800/50 mt-2">
                  {selectedExtrasIds.map(id => {
                    const ex = homeContent.extras.find(e => e.id === id);
                    return <div key={id} className="flex justify-between text-[9px] text-zinc-500 font-black uppercase tracking-widest"><span>+ {ex?.name}</span><span>{ex?.price}€/H</span></div>;
                  })}
                </div>
              )}

              {appliedBono && (
                <div className="pt-4 border-t border-zinc-800 space-y-2">
                  <div className="flex justify-between text-[11px] text-green-500 font-bold uppercase"><span>Saldo actual bono:</span><span>{appliedBono.remainingHours}H</span></div>
                  <div className="flex justify-between text-[11px] text-blue-400 font-bold uppercase"><span>Saldo final:</span><span>{(appliedBono.remainingHours - duration).toFixed(1)}H</span></div>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-800 flex justify-between items-end">
                <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Importe Total</span>
                <span className="text-4xl font-orbitron font-bold text-white leading-none">{totalPrice.toFixed(0)}€</span>
              </div>
           </div>

           <div className="space-y-3 pt-4">
              <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-2 mb-1">Datos de Contacto</h4>
              <input placeholder="NOMBRE ARTÍSTICO / COMPLETO" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-[11px] font-bold text-white focus:border-purple-600 uppercase transition-all" />
              <input placeholder="EMAIL" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-[11px] font-bold text-white focus:border-purple-600 uppercase transition-all" />
              <input placeholder="WHATSAPP / TELÉFONO" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-[11px] font-bold text-white focus:border-purple-600 uppercase transition-all" />
           </div>

           {bookingMode === 'session' && (
             <div className="space-y-3">
                <div className="flex gap-2">
                  <input placeholder="BONO O CUPÓN?" value={bonoInput} onChange={e => setBonoInput(e.target.value.toUpperCase())} className="flex-1 bg-black/40 border border-zinc-800 rounded-2xl px-5 py-4 text-[10px] font-black text-white focus:border-purple-600 transition-all" />
                  <button onClick={handleApplyCode} className="bg-zinc-800 px-6 rounded-2xl text-[9px] font-black uppercase hover:bg-purple-600 transition-all border border-zinc-700">OK</button>
                </div>
                {errorMsg && <div className="text-[8px] text-red-500 font-black uppercase tracking-widest px-2 animate-pulse">{errorMsg}</div>}
             </div>
           )}
        </div>

        <div className="pt-6 flex flex-col gap-3">
           {appliedBono ? (
             <button onClick={() => handleFinalSubmit('bono')} disabled={!customerName || !selectedHour || (appliedBono.remainingHours < duration)} className="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-[12px] uppercase shadow-2xl disabled:opacity-20 transform hover:scale-105 transition-all">Usar mi Bono</button>
           ) : (
             <>
               {homeContent.payments.bizumEnabled && <button onClick={() => handleFinalSubmit('bizum')} disabled={!customerName || (bookingMode === 'session' && !selectedHour)} className="w-full bg-[#00AAFF] text-white py-5 rounded-2xl font-black text-[12px] uppercase shadow-2xl disabled:opacity-20 transform hover:scale-105 transition-all">Pagar con Bizum</button>}
               {homeContent.payments.mollieEnabled && <button onClick={() => handleFinalSubmit('mollie')} disabled={!customerName || (bookingMode === 'session' && !selectedHour)} className="w-full bg-purple-600 text-white py-5 rounded-2xl font-black text-[12px] uppercase shadow-2xl disabled:opacity-20 transform hover:scale-105 transition-all">Pago con Tarjeta</button>}
             </>
           )}
           <p className="text-[7px] text-zinc-700 uppercase font-black text-center tracking-[0.2em] mt-2">Reserva segura. Al continuar aceptas las políticas de uso.</p>
        </div>
      </div>
    </div>
  );
};

export default BookingView;
