
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
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'methods' | 'manual_instructions'>('methods');
  const [selectedMethod, setSelectedMethod] = useState<'bizum' | 'revolut' | 'mollie' | null>(null);

  // Detectar si estamos en localhost o en un entorno de pruebas (simulación)
  const isSimulationMode = window.location.hostname === 'localhost' || !homeContent.payments.mollieApiKey;

  const currentDaySchedule = useMemo(() => {
    const override = homeContent.availability.overrides.find(o => o.date === selectedDate);
    if (override) return override.schedule;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[new Date(selectedDate).getDay()] as keyof typeof homeContent.availability;
    // @ts-ignore
    return homeContent.availability[dayName] as DaySchedule;
  }, [selectedDate, homeContent.availability]);

  const availableHours = useMemo(() => {
    if (!currentDaySchedule || !currentDaySchedule.isOpen) return [];
    const occupied = bookings
      .filter(b => b.date === selectedDate && b.status !== 'cancelled')
      .flatMap(b => Array.from({length: b.duration}, (_, i) => b.startTime + i));
    const hours = [];
    for (let h = currentDaySchedule.start; h < currentDaySchedule.end; h++) {
      hours.push({ hour: h, label: `${h < 10 ? '0' : ''}${h}:00`, isOccupied: occupied.includes(h) });
    }
    return hours;
  }, [currentDaySchedule, bookings, selectedDate]);

  const handleManualSubmit = async () => {
    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      date: selectedDate,
      startTime: selectedHour!,
      duration,
      packId: selectedPack.id,
      customerName,
      customerEmail,
      totalPrice: selectedPack.pricePerHour * duration,
      status: selectedMethod === 'mollie' ? 'confirmed' : 'pending_verification',
      paymentMethod: selectedMethod as any,
      createdAt: Date.now()
    };
    onSubmit(newBooking);
  };

  const handleMolliePayment = async () => {
    setIsRedirecting(true);
    
    if (isSimulationMode) {
      setTimeout(() => {
        setIsRedirecting(false);
        alert("MODO PRUEBA: El sistema ha simulado la redirección a Mollie. En un entorno real, aquí verías la pasarela de pago.");
        handleManualSubmit();
      }, 1500);
      return;
    }

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: Math.random().toString(36).substr(2, 6).toUpperCase(),
          amount: selectedPack.pricePerHour * duration,
          description: `${selectedPack.name} - ${selectedDate}`,
          email: customerEmail,
          name: customerName
        })
      });
      const data = await response.json();
      window.location.href = data.checkoutUrl;
    } catch (e) {
      alert("Error contactando con el servidor de pagos real.");
      setIsRedirecting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-12 animate-in fade-in duration-500">
      <div className="lg:col-span-2 space-y-12">
        {isSimulationMode && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl flex items-center gap-4">
             <span className="text-xl">🧪</span>
             <p className="text-[10px] uppercase font-black tracking-widest text-yellow-500">Entorno de Pruebas: Los pagos son simulados.</p>
          </div>
        )}
        
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
            <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-sm">1</span>
            Elige tu Pack
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
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
            <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-sm">2</span>
            Día y Hora
          </h2>
          <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800">
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <input type="date" value={selectedDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setSelectedDate(e.target.value)} className="bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors" />
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors">
                {[1,2,3,4].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Hora' : 'Horas'}</option>)}
              </select>
            </div>
            {!currentDaySchedule.isOpen ? (
              <div className="py-12 text-center text-red-500 bg-red-500/5 border border-red-500/20 rounded-xl font-black text-[10px] uppercase tracking-[0.2em]">Estudio cerrado este día</div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {availableHours.map(slot => (
                  <button key={slot.hour} disabled={slot.isOccupied} onClick={() => setSelectedHour(slot.hour)} className={`py-3 rounded-xl border text-[10px] font-bold transition-all ${slot.isOccupied ? 'opacity-10 cursor-not-allowed grayscale' : selectedHour === slot.hour ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20' : 'bg-zinc-800 border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}>
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 h-fit sticky top-24 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl -z-10"></div>
        <h3 className="font-bold mb-6 uppercase tracking-widest text-[10px] text-zinc-500">Checkout</h3>
        <div className="space-y-3 mb-8">
          <input placeholder="Nombre Completo" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-800 rounded-xl px-4 py-3 outline-none text-sm focus:border-purple-500 transition-colors" />
          <input placeholder="Tu Email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-800 rounded-xl px-4 py-3 outline-none text-sm focus:border-purple-500 transition-colors" />
        </div>

        <div className="bg-black/40 p-6 rounded-2xl mb-8 border border-zinc-800/50 text-center">
           <div className="text-[10px] font-black text-zinc-600 uppercase mb-1 tracking-widest">A pagar ahora</div>
           <div className="text-5xl font-orbitron font-bold text-white leading-none">{selectedPack.pricePerHour * duration}€</div>
        </div>

        {paymentStep === 'methods' ? (
          <div className="space-y-2">
            {homeContent.payments.mollieEnabled && (
              <button 
                onClick={handleMolliePayment} 
                disabled={!selectedHour || !customerName || !customerEmail || isRedirecting} 
                className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-purple-600 hover:text-white transition-all disabled:opacity-20 shadow-xl"
              >
                {isRedirecting ? 'Procesando...' : 'Tarjeta / Apple / Google Pay'}
              </button>
            )}
            <div className="flex gap-2">
              {homeContent.payments.bizumEnabled && (
                <button onClick={() => { setSelectedMethod('bizum'); setPaymentStep('manual_instructions'); }} disabled={!selectedHour || !customerName} className="flex-1 bg-[#00AAFF] text-white py-4 rounded-xl font-black text-[9px] uppercase tracking-widest">Bizum</button>
              )}
              {homeContent.payments.revolutEnabled && (
                <button onClick={() => { setSelectedMethod('revolut'); setPaymentStep('manual_instructions'); }} disabled={!selectedHour || !customerName} className="flex-1 bg-zinc-100 text-black py-4 rounded-xl font-black text-[9px] uppercase tracking-widest">Revolut</button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-5 bg-zinc-800/30 border border-zinc-700/50 rounded-2xl text-[11px] leading-relaxed">
              <p className="font-black text-purple-400 uppercase tracking-widest text-[9px] mb-2 border-b border-purple-500/20 pb-2">Instrucciones Pago Manual</p>
              {selectedMethod === 'bizum' ? (
                <p>Realiza un Bizum de <b>{selectedPack.pricePerHour * duration}€</b> al número <b>{homeContent.payments.bizumPhone}</b> e incluye tu nombre en el concepto.</p>
              ) : (
                <p>Usa este enlace <a href={homeContent.payments.revolutLink} target="_blank" className="underline text-blue-400">Revolut.me</a> o busca el usuario <b>{homeContent.payments.revolutTag}</b>.</p>
              )}
            </div>
            <button onClick={handleManualSubmit} className="w-full bg-purple-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-600/20">Confirmar Envío</button>
            <button onClick={() => setPaymentStep('methods')} className="w-full text-zinc-500 text-[9px] uppercase font-black tracking-widest hover:text-white transition-colors">Volver atrás</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingView;
