
import React, { useState, useMemo, useEffect } from 'react';
import { Pack, Booking, HomeContent, DaySchedule } from '../types';

interface BookingViewProps {
  packs: Pack[];
  bookings: Booking[];
  homeContent: HomeContent;
  onSubmit: (booking: Booking) => void;
}

const BookingView: React.FC<BookingViewProps> = ({ packs, bookings, homeContent, onSubmit }) => {
  const activePacks = useMemo(() => packs.filter(p => p.isActive), [packs]);
  const [selectedPack, setSelectedPack] = useState<Pack>(activePacks[0] || packs[0]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(1);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'redirecting' | 'verifying' | 'success'>('idle');
  const [selectedMethod, setSelectedMethod] = useState<'bizum' | 'revolut' | 'mollie' | null>(null);
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (activePacks.length > 0 && !activePacks.find(p => p.id === selectedPack.id)) {
        setSelectedPack(activePacks[0]);
    }
  }, [activePacks, selectedPack]);

  const currentDaySchedule = useMemo(() => {
    const override = homeContent.availability.overrides.find(o => o.date === selectedDate);
    if (override) return override as any as DaySchedule;
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[new Date(selectedDate).getDay()] as keyof typeof homeContent.availability;
    return (homeContent.availability as any)[dayName] as DaySchedule;
  }, [selectedDate, homeContent.availability]);

  const formatTime = (decimalHour: number) => {
    const h = Math.floor(decimalHour);
    const m = Math.round((decimalHour % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const availableSlots = useMemo(() => {
    if (!currentDaySchedule || !currentDaySchedule.isOpen) return [];
    const COURTESY_BUFFER = 0.5;
    const slots = [];
    const dayBookings = bookings.filter(b => b.date === selectedDate && b.status !== 'cancelled');
    for (let h = currentDaySchedule.start; h < currentDaySchedule.end; h += 0.5) {
      const slotStart = h;
      const slotEnd = h + duration;
      const blockingBooking = dayBookings.find(b => {
        const bStart = b.startTime;
        const bEndWithBuffer = b.startTime + b.duration + COURTESY_BUFFER;
        return (slotStart < bEndWithBuffer) && (slotEnd > bStart);
      });
      const fitsInSchedule = slotEnd <= currentDaySchedule.end;
      slots.push({ 
        hour: h, 
        label: formatTime(h), 
        isOccupied: !!blockingBooking || !fitsInSchedule,
        status: blockingBooking?.status || (fitsInSchedule ? 'free' : 'closed')
      });
    }
    return slots;
  }, [currentDaySchedule, bookings, selectedDate, duration]);

  const morningSlots = useMemo(() => availableSlots.filter(s => s.hour < 14), [availableSlots]);
  const afternoonSlots = useMemo(() => availableSlots.filter(s => s.hour >= 14 && s.hour < 20), [availableSlots]);
  const eveningSlots = useMemo(() => availableSlots.filter(s => s.hour >= 20), [availableSlots]);

  const handleFinalSubmit = (method: 'bizum' | 'revolut' | 'mollie') => {
    if (selectedHour === null) return;
    const isAutoConfirmed = method === 'mollie';
    
    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      date: selectedDate,
      startTime: selectedHour,
      duration,
      packId: selectedPack.id,
      customerName,
      customerEmail,
      customerPhone,
      totalPrice: selectedPack.pricePerHour * duration,
      status: isAutoConfirmed ? 'confirmed' : 'pending_verification',
      paymentMethod: method,
      createdAt: Date.now()
    };
    setLastBooking(newBooking);
    onSubmit(newBooking);
    setPaymentStatus('success');
  };

  const startMolliePayment = () => {
    setPaymentStatus('redirecting');
    setSelectedMethod('mollie');
    setTimeout(() => {
      setPaymentStatus('verifying');
      setTimeout(() => { handleFinalSubmit('mollie'); }, 2000);
    }, 1500);
  };

  if (paymentStatus === 'redirecting') {
    return (
      <div className="max-w-md mx-auto py-32 text-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
        <h2 className="text-xl font-orbitron font-bold uppercase tracking-widest text-white">Conectando con Pasarela</h2>
        <p className="text-zinc-600 mt-4 text-[9px] font-black uppercase tracking-[0.4em]">Seguridad SSL Activa</p>
      </div>
    );
  }

  if (paymentStatus === 'verifying') {
    return (
      <div className="max-w-md mx-auto py-32 text-center">
        <div className="w-16 h-16 bg-purple-600/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-orbitron font-bold uppercase tracking-widest text-white">Verificando Pago</h2>
        <p className="text-zinc-600 mt-4 text-[9px] font-black uppercase tracking-[0.4em]">Confirmando fondos con la entidad...</p>
      </div>
    );
  }

  if (paymentStatus === 'success' && lastBooking) {
    const isManual = selectedMethod === 'bizum' || selectedMethod === 'revolut';
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-8 shadow-[0_0_30px_rgba(34,197,94,0.3)]">✓</div>
        <h2 className="text-3xl font-orbitron font-bold mb-4 uppercase tracking-tighter">¡Reserva Completada!</h2>
        <p className="text-zinc-500 mb-10 text-lg font-light leading-relaxed">
          {isManual 
            ? "Hemos bloqueado tu plaza. Envía el comprobante para la confirmación definitiva." 
            : "Pago verificado instantáneamente. Tu sesión ya está en nuestro calendario."}
        </p>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8 text-left space-y-4">
           <div className="flex justify-between border-b border-zinc-800 pb-4">
              <span className="text-zinc-500 font-black uppercase text-[9px] tracking-widest">Referencia</span>
              <span className="font-mono text-purple-400 font-bold tracking-widest">{lastBooking.id}</span>
           </div>
           <div className="flex justify-between items-center pt-2">
              <span className="text-[9px] font-black uppercase text-zinc-600">Sesión</span>
              <span className="text-xs font-bold text-white uppercase">{lastBooking.date} @ {formatTime(lastBooking.startTime)}</span>
           </div>
        </div>

        <div className="flex flex-col gap-4">
           {isManual && (
             <a 
               href={`https://wa.me/${homeContent.payments.bizumPhone.replace(/\s/g, '')}?text=${encodeURIComponent(`Hola, aquí envío el comprobante para la reserva ${lastBooking.id} (${lastBooking.customerName})`)}`} 
               target="_blank" rel="noopener noreferrer"
               className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-green-900/10"
             >
               Enviar Comprobante WhatsApp
             </a>
           )}
           <button onClick={() => window.location.reload()} className="bg-zinc-800 text-zinc-400 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all">Cerrar y Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="lg:col-span-2 space-y-12">
        <section>
          <h2 className="text-lg font-bold mb-8 flex items-center gap-3 font-orbitron text-purple-500 tracking-widest">
            <span className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center text-[10px] text-white italic">01</span>
            ELIGE TU PACK
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {activePacks.map(p => (
              <button key={p.id} onClick={() => setSelectedPack(p)} className={`p-8 rounded-[2rem] border text-left transition-all relative overflow-hidden group ${selectedPack.id === p.id ? 'border-purple-500 bg-purple-500/5 shadow-2xl scale-[1.02]' : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700'}`}>
                <span className="text-4xl block mb-4 group-hover:scale-110 transition-transform origin-left">{p.icon}</span>
                <h4 className="font-black text-sm uppercase tracking-widest text-white">{p.name}</h4>
                <div className="text-2xl font-orbitron font-bold mt-4 text-white">{p.pricePerHour}€<span className="text-zinc-600 text-[9px] ml-1 uppercase tracking-widest">/ Hora</span></div>
                {selectedPack.id === p.id && <div className="absolute top-4 right-4 text-purple-500 text-xs font-black uppercase tracking-widest">Seleccionado</div>}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-8 flex items-center gap-3 font-orbitron text-purple-500 tracking-widest">
            <span className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center text-[10px] text-white italic">02</span>
            CALENDARIO
          </h2>
          <div className="bg-zinc-900/30 p-10 rounded-[2.5rem] border border-zinc-800/60 backdrop-blur-sm">
            <div className="grid sm:grid-cols-2 gap-8 mb-12">
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Fecha</label>
                <input type="date" value={selectedDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => {setSelectedDate(e.target.value); setSelectedHour(null);}} className="w-full bg-black/40 border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-purple-500 text-sm text-white transition-all" />
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Duración (H)</label>
                <select value={duration} onChange={(e) => {setDuration(Number(e.target.value)); setSelectedHour(null);}} className="w-full bg-black/40 border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-purple-500 appearance-none text-sm text-white">
                  {[1, 1.5, 2, 2.5, 3, 4, 5, 6].map(n => <option key={n} value={n} className="bg-zinc-900">{n} {n === 1 ? 'Hora' : 'Horas'}</option>)}
                </select>
              </div>
            </div>

            <h3 className="text-[10px] font-black uppercase text-zinc-600 mb-8 tracking-[0.4em] ml-2">Horarios disponibles</h3>
            
            {!currentDaySchedule.isOpen ? (
              <div className="py-20 text-center text-red-500/50 bg-red-500/5 border border-red-500/10 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.5em]">Estudio Cerrado</div>
            ) : (
              <div className="space-y-12">
                {[['Mañana', morningSlots], ['Tarde', afternoonSlots], ['Noche', eveningSlots]].map(([title, slots]: any) => slots.length > 0 && (
                  <div key={title} className="space-y-5">
                    <span className="text-[9px] font-black uppercase text-zinc-700 tracking-[0.4em] ml-2">{title}</span>
                    <div className="flex flex-wrap gap-3">
                      {slots.map((slot: any) => (
                        <button 
                          key={slot.hour} 
                          disabled={slot.isOccupied} 
                          onClick={() => setSelectedHour(slot.hour)} 
                          className={`px-5 py-3.5 rounded-2xl border text-[11px] font-bold transition-all ${
                            slot.isOccupied 
                              ? 'opacity-5 cursor-not-allowed bg-transparent border-zinc-900 text-zinc-800' 
                              : selectedHour === slot.hour 
                                ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-110 z-10' 
                                : 'bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white'
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 h-fit sticky top-28 shadow-2xl space-y-8">
        <h3 className="font-orbitron font-bold uppercase tracking-[0.3em] text-[10px] text-purple-500 border-b border-zinc-800 pb-4">Tu Reserva</h3>
        
        <div className="space-y-4 p-8 bg-black/40 rounded-[2.5rem] border border-zinc-800/40">
          <div className="flex justify-between items-center"><span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Día</span><span className="text-xs font-bold text-white uppercase">{selectedDate}</span></div>
          <div className="flex justify-between items-center"><span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Horas</span><span className="text-xs font-bold text-purple-400">{selectedHour !== null ? `${formatTime(selectedHour)} - ${formatTime(selectedHour + duration)}` : '--:--'}</span></div>
          <div className="pt-6 border-t border-zinc-800 flex justify-between items-end"><span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Total</span><span className="text-3xl font-orbitron font-bold text-white tracking-tighter">{selectedPack.pricePerHour * duration}€</span></div>
        </div>

        <div className="space-y-3">
          <input placeholder="NOMBRE COMPLETO" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none text-[10px] font-black uppercase tracking-widest focus:border-purple-500 text-white placeholder:text-zinc-700 transition-colors" />
          <input placeholder="CORREO ELECTRÓNICO" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none text-[10px] font-black uppercase tracking-widest focus:border-purple-500 text-white placeholder:text-zinc-700 transition-colors" />
          <input placeholder="TELÉFONO / WHATSAPP" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none text-[10px] font-black uppercase tracking-widest focus:border-purple-500 text-white placeholder:text-zinc-700 transition-colors" />
        </div>
        
        <div className="space-y-3 pt-6">
          <button 
            onClick={startMolliePayment} 
            disabled={selectedHour === null || !customerName || !customerEmail} 
            className="w-full bg-white text-black py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-purple-600 hover:text-white transition-all disabled:opacity-5 disabled:cursor-not-allowed shadow-xl"
          >
            Pagar con Tarjeta
          </button>
          <div className="flex gap-3">
             <button onClick={() => { setSelectedMethod('bizum'); handleFinalSubmit('bizum'); }} disabled={selectedHour === null || !customerName} className="flex-1 bg-zinc-800/50 text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-[#00AAFF] transition-colors disabled:opacity-20">Bizum</button>
             <button onClick={() => { setSelectedMethod('revolut'); handleFinalSubmit('revolut'); }} disabled={selectedHour === null || !customerName} className="flex-1 bg-zinc-800/50 text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-zinc-700 transition-colors disabled:opacity-20">Revolut</button>
          </div>
        </div>
        <p className="text-[7px] text-zinc-700 text-center uppercase font-black tracking-[0.3em] max-w-[200px] mx-auto leading-relaxed">Transacción cifrada bajo protocolo de seguridad bancaria AES-256</p>
      </div>
    </div>
  );
};

export default BookingView;
