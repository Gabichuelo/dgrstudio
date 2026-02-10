
import React, { useState, useMemo } from 'react';
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
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'methods' | 'manual_instructions'>('methods');
  const [selectedMethod, setSelectedMethod] = useState<'bizum' | 'revolut' | 'mollie' | null>(null);

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
    
    const COURTESY_BUFFER = 0.5; // 30 minutos
    const slots = [];
    const dayBookings = bookings.filter(b => b.date === selectedDate && b.status !== 'cancelled');

    for (let h = currentDaySchedule.start; h < currentDaySchedule.end; h += 0.5) {
      const slotStart = h;
      const slotEnd = h + duration;

      // Buscamos si hay una reserva que bloquee este hueco
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

  const handleManualSubmit = () => {
    if (selectedHour === null) return;
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
      status: selectedMethod === 'mollie' ? 'confirmed' : 'pending_verification',
      paymentMethod: selectedMethod as any,
      createdAt: Date.now()
    };
    onSubmit(newBooking);
  };

  const handleMolliePayment = () => {
    if (selectedHour === null || isRedirecting) return;
    setIsRedirecting(true);
    setTimeout(() => {
      handleManualSubmit();
      setIsRedirecting(false);
    }, 1500);
  };

  const morningSlots = availableSlots.filter(s => s.hour < 14);
  const afternoonSlots = availableSlots.filter(s => s.hour >= 14 && s.hour < 19);
  const eveningSlots = availableSlots.filter(s => s.hour >= 19);

  return (
    <div className="grid lg:grid-cols-3 gap-12 animate-in fade-in duration-500">
      <div className="lg:col-span-2 space-y-12">
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3 font-orbitron">
            <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-xs text-white">01</span>
            ELIGE TU PACK
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {activePacks.map(p => (
              <button key={p.id} onClick={() => setSelectedPack(p)} className={`p-6 rounded-3xl border text-left transition-all ${selectedPack.id === p.id ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/5' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'}`}>
                <span className="text-3xl">{p.icon}</span>
                <h4 className="font-bold mt-2 uppercase tracking-tight">{p.name}</h4>
                <div className="text-xl font-bold mt-4 text-white font-orbitron">{p.pricePerHour}€<span className="text-zinc-600 text-[10px] ml-1">/H</span></div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3 font-orbitron">
            <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-xs text-white">02</span>
            DÍA Y DURACIÓN
          </h2>
          <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800">
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-zinc-500 ml-2">Fecha</label>
                <input type="date" value={selectedDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => {setSelectedDate(e.target.value); setSelectedHour(null);}} className="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-zinc-500 ml-2">¿Cuántas horas?</label>
                <select value={duration} onChange={(e) => {setDuration(Number(e.target.value)); setSelectedHour(null);}} className="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors">
                  {[1, 1.5, 2, 2.5, 3, 4, 5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Hora' : 'Horas'}</option>)}
                </select>
              </div>
            </div>

            <h3 className="text-[10px] font-black uppercase text-zinc-500 mb-6 tracking-widest ml-1 border-b border-white/5 pb-2">Selecciona tu hora de inicio</h3>
            
            {!currentDaySchedule.isOpen ? (
              <div className="py-12 text-center text-red-500 bg-red-500/5 border border-red-500/20 rounded-xl font-black text-[10px] uppercase tracking-[0.2em]">Estudio cerrado este día</div>
            ) : (
              <div className="space-y-8">
                {[['Mañana', morningSlots], ['Tarde', afternoonSlots], ['Noche', eveningSlots]].map(([title, slots]: any) => slots.length > 0 && (
                  <div key={title} className="space-y-3">
                    <span className="text-[8px] font-black uppercase text-zinc-600 tracking-[0.3em]">{title}</span>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((slot: any) => (
                        <button 
                          key={slot.hour} 
                          disabled={slot.isOccupied} 
                          onClick={() => setSelectedHour(slot.hour)} 
                          className={`px-5 py-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                            slot.isOccupied 
                              ? slot.status === 'pending_verification' 
                                ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500/40 cursor-not-allowed'
                                : 'opacity-10 cursor-not-allowed bg-transparent border-zinc-800 text-zinc-800' 
                              : selectedHour === slot.hour 
                                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20 scale-105' 
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
            <div className="mt-8 flex gap-4 text-[8px] font-black uppercase tracking-widest text-zinc-600">
               <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-zinc-800"></span> Disponible</div>
               <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500/40"></span> Pendiente Pago</div>
               <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-zinc-900"></span> Ocupado</div>
            </div>
          </div>
        </section>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 h-fit sticky top-24 shadow-2xl overflow-hidden">
        <h3 className="font-bold mb-6 uppercase tracking-widest text-[10px] text-zinc-500 font-orbitron">Resumen Reserva</h3>
        <div className="space-y-4 mb-8 p-6 bg-black/40 rounded-3xl border border-zinc-800/50">
          <div className="flex justify-between items-center"><span className="text-[9px] text-zinc-500 uppercase font-black">Sesión</span><span className="text-xs font-bold text-white uppercase">{selectedDate}</span></div>
          <div className="flex justify-between items-center"><span className="text-[9px] text-zinc-500 uppercase font-black">Horario</span><span className="text-xs font-bold text-purple-400">{selectedHour !== null ? `${formatTime(selectedHour)} - ${formatTime(selectedHour + duration)}` : 'No seleccionada'}</span></div>
          <div className="pt-4 border-t border-zinc-800 flex justify-between items-end"><span className="text-[9px] text-zinc-500 uppercase font-black">Total</span><span className="text-3xl font-orbitron font-bold text-white">{selectedPack.pricePerHour * duration}€</span></div>
        </div>
        <div className="space-y-3 mb-8">
          <input placeholder="Nombre Completo" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-800 rounded-xl px-4 py-3 outline-none text-sm focus:border-purple-500" />
          <input placeholder="Tu Email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-800 rounded-xl px-4 py-3 outline-none text-sm focus:border-purple-500" />
          <input placeholder="Tu Teléfono" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-800 rounded-xl px-4 py-3 outline-none text-sm focus:border-purple-500" />
        </div>
        {paymentStep === 'methods' ? (
          <button onClick={handleMolliePayment} disabled={selectedHour === null || !customerName || !customerEmail || !customerPhone || isRedirecting} className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-purple-600 hover:text-white transition-all disabled:opacity-20 shadow-xl mb-4">
            {isRedirecting ? 'Procesando...' : `Reservar por ${selectedPack.pricePerHour * duration}€`}
          </button>
        ) : (
          <div className="space-y-4 animate-in slide-in-from-bottom-4">
             <div className="p-4 bg-zinc-800/30 rounded-2xl text-[10px] text-zinc-400 leading-relaxed">
                {selectedMethod === 'bizum' ? `Bizum al ${homeContent.payments.bizumPhone}` : `Revolut a ${homeContent.payments.revolutTag}`}
             </div>
             <button onClick={handleManualSubmit} className="w-full bg-purple-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-600/20">Confirmar Envío</button>
             <button onClick={() => setPaymentStep('methods')} className="w-full text-zinc-500 text-[9px] uppercase font-black tracking-widest hover:text-white">Volver</button>
          </div>
        )}
        <div className="flex gap-2">
           <button onClick={() => { setSelectedMethod('bizum'); setPaymentStep('manual_instructions'); }} className="flex-1 bg-[#00AAFF] text-white py-2 rounded-lg font-black text-[8px] uppercase tracking-widest">Bizum</button>
           <button onClick={() => { setSelectedMethod('revolut'); setPaymentStep('manual_instructions'); }} className="flex-1 bg-zinc-100 text-black py-2 rounded-lg font-black text-[8px] uppercase tracking-widest">Revolut</button>
        </div>
        <p className="mt-6 text-[8px] text-zinc-600 uppercase text-center font-black tracking-[0.2em]">Margen de 30 min aplicado automáticamente tras cada sesión.</p>
      </div>
    </div>
  );
};

export default BookingView;
