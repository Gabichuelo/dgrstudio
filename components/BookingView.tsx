
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
    const isAutoConfirmed = method === 'mollie'; // Mollie se confirma solo si el pago es OK
    
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
    
    // Simulación de pasarela de pago segura
    setTimeout(() => {
      setPaymentStatus('verifying');
      setTimeout(() => {
        handleFinalSubmit('mollie');
      }, 2000); // 2 segundos de verificación con Mollie
    }, 1500); // 1.5 segundos de redirección
  };

  if (paymentStatus === 'redirecting') {
    return (
      <div className="max-w-md mx-auto py-32 text-center animate-pulse">
        <div className="w-20 h-20 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
        <h2 className="text-2xl font-orbitron font-bold uppercase tracking-widest">Conectando con Mollie</h2>
        <p className="text-zinc-500 mt-4 text-xs font-black uppercase tracking-[0.2em]">No cierres esta ventana...</p>
      </div>
    );
  }

  if (paymentStatus === 'verifying') {
    return (
      <div className="max-w-md mx-auto py-32 text-center">
        <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-2xl font-orbitron font-bold uppercase tracking-widest">Verificando Pago</h2>
        <p className="text-zinc-500 mt-4 text-xs font-black uppercase tracking-[0.2em]">Confirmando transacción con tu banco...</p>
      </div>
    );
  }

  if (paymentStatus === 'success' && lastBooking) {
    const isManual = selectedMethod === 'bizum' || selectedMethod === 'revolut';
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-8 shadow-lg shadow-green-500/20">✓</div>
        <h2 className="text-4xl font-orbitron font-bold mb-4 uppercase">¡Reserva Exitosa!</h2>
        <p className="text-zinc-500 mb-10 text-lg">
          {isManual 
            ? "Tu plaza está bloqueada. Envía el comprobante para confirmarla." 
            : "Pago verificado. ¡Nos vemos en el estudio!"}
        </p>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8 text-left space-y-4">
           <div className="flex justify-between border-b border-zinc-800 pb-4">
              <span className="text-zinc-500 font-black uppercase text-[10px]">Ref. de Reserva</span>
              <span className="font-mono text-purple-400 font-bold">{lastBooking.id}</span>
           </div>
           <p className="text-xs text-zinc-400 leading-relaxed">
             Hemos enviado un email de confirmación a <span className="text-white">{lastBooking.customerEmail}</span>.
           </p>
        </div>

        <div className="flex flex-col gap-4">
           {isManual && (
             <a 
               href={`https://wa.me/${homeContent.payments.bizumPhone.replace(/\s/g, '')}?text=${encodeURIComponent(`Hola, envío comprobante de la reserva ${lastBooking.id}`)}`} 
               target="_blank" rel="noopener noreferrer"
               className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-105 transition-all"
             >
               Enviar Comprobante WhatsApp
             </a>
           )}
           <button onClick={() => window.location.reload()} className="bg-zinc-800 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-700 transition-all">Volver al Inicio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2 space-y-12">
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3 font-orbitron text-purple-500">
            <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-xs text-white italic">01</span>
            SELECCIONA EQUIPO
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {activePacks.map(p => (
              <button key={p.id} onClick={() => setSelectedPack(p)} className={`p-8 rounded-[2rem] border text-left transition-all ${selectedPack.id === p.id ? 'border-purple-500 bg-purple-500/10 shadow-2xl' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'}`}>
                <span className="text-4xl block mb-4">{p.icon}</span>
                <h4 className="font-black text-sm uppercase tracking-wider">{p.name}</h4>
                <div className="text-2xl font-orbitron font-bold mt-4">{p.pricePerHour}€<span className="text-zinc-600 text-[10px] ml-1">/H</span></div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3 font-orbitron text-purple-500">
            <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-xs text-white italic">02</span>
            CALENDARIO
          </h2>
          <div className="bg-zinc-900/50 p-10 rounded-[3rem] border border-zinc-800">
            <div className="grid sm:grid-cols-2 gap-6 mb-10">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Día de la sesión</label>
                <input type="date" value={selectedDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => {setSelectedDate(e.target.value); setSelectedHour(null);}} className="w-full bg-zinc-800 border-zinc-700 rounded-2xl px-6 py-4 outline-none focus:border-purple-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Duración (Horas)</label>
                <select value={duration} onChange={(e) => {setDuration(Number(e.target.value)); setSelectedHour(null);}} className="w-full bg-zinc-800 border-zinc-700 rounded-2xl px-6 py-4 outline-none focus:border-purple-500 appearance-none">
                  {[1, 1.5, 2, 2.5, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Hora' : 'Horas'}</option>)}
                </select>
              </div>
            </div>

            <h3 className="text-[10px] font-black uppercase text-zinc-500 mb-6 tracking-[0.3em] ml-2">Selecciona horario de inicio</h3>
            
            {!currentDaySchedule.isOpen ? (
              <div className="py-20 text-center text-red-500 bg-red-500/5 border border-red-500/10 rounded-3xl font-black text-xs uppercase tracking-widest">Estudio Cerrado este día</div>
            ) : (
              <div className="space-y-10">
                {[['Mañana', morningSlots], ['Tarde', afternoonSlots], ['Noche', eveningSlots]].map(([title, slots]: any) => slots.length > 0 && (
                  <div key={title} className="space-y-4">
                    <span className="text-[8px] font-black uppercase text-zinc-600 tracking-[0.4em] ml-2">{title}</span>
                    <div className="flex flex-wrap gap-2.5">
                      {slots.map((slot: any) => (
                        <button 
                          key={slot.hour} 
                          disabled={slot.isOccupied} 
                          onClick={() => setSelectedHour(slot.hour)} 
                          className={`px-6 py-3.5 rounded-2xl border text-[11px] font-bold transition-all ${
                            slot.isOccupied 
                              ? 'opacity-10 cursor-not-allowed bg-transparent border-zinc-800 text-zinc-800' 
                              : selectedHour === slot.hour 
                                ? 'bg-purple-600 border-purple-500 text-white shadow-xl scale-110 z-10' 
                                : 'bg-zinc-800 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
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

      <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 h-fit sticky top-24 shadow-2xl space-y-8">
        <h3 className="font-orbitron font-bold uppercase tracking-widest text-xs text-purple-500">Resumen</h3>
        
        <div className="space-y-4 p-8 bg-black/40 rounded-[2rem] border border-zinc-800/50">
          <div className="flex justify-between items-center"><span className="text-[9px] text-zinc-500 uppercase font-black">Día</span><span className="text-xs font-bold">{selectedDate}</span></div>
          <div className="flex justify-between items-center"><span className="text-[9px] text-zinc-500 uppercase font-black">Horas</span><span className="text-xs font-bold text-purple-400">{selectedHour !== null ? `${formatTime(selectedHour)} - ${formatTime(selectedHour + duration)}` : '--:--'}</span></div>
          <div className="pt-6 border-t border-zinc-800 flex justify-between items-end"><span className="text-[9px] text-zinc-500 uppercase font-black">Precio</span><span className="text-4xl font-orbitron font-bold">{selectedPack.pricePerHour * duration}€</span></div>
        </div>

        <div className="space-y-4">
          <input placeholder="Nombre" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-800 rounded-2xl px-6 py-4 outline-none text-sm focus:border-purple-500" />
          <input placeholder="Email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-800 rounded-2xl px-6 py-4 outline-none text-sm focus:border-purple-500" />
          <input placeholder="WhatsApp" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-800 rounded-2xl px-6 py-4 outline-none text-sm focus:border-purple-500" />
        </div>
        
        <div className="space-y-3 pt-4">
          <button 
            onClick={startMolliePayment} 
            disabled={selectedHour === null || !customerName || !customerEmail} 
            className="w-full bg-white text-black py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-purple-600 hover:text-white transition-all disabled:opacity-10 shadow-2xl"
          >
            Pagar con Tarjeta (Mollie)
          </button>
          <div className="flex gap-2">
             <button onClick={() => { setSelectedMethod('bizum'); handleFinalSubmit('bizum'); }} disabled={selectedHour === null || !customerName} className="flex-1 bg-zinc-800 text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-[#00AAFF]">Bizum</button>
             <button onClick={() => { setSelectedMethod('revolut'); handleFinalSubmit('revolut'); }} disabled={selectedHour === null || !customerName} className="flex-1 bg-zinc-800 text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-white hover:text-black">Revolut</button>
          </div>
        </div>
        <p className="text-[8px] text-zinc-600 text-center uppercase font-black tracking-widest">Pago 100% seguro a través de pasarela cifrada</p>
      </div>
    </div>
  );
};

export default BookingView;
