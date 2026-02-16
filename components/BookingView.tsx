
import React, { useState, useMemo, useEffect } from 'react';
import { Pack, Booking, HomeContent, DaySchedule, Extra, Coupon, HourBono } from '../types';

interface BookingViewProps {
  packs: Pack[];
  bookings: Booking[];
  homeContent: HomeContent;
  onSubmit: (booking: Booking) => void;
  onReturnHome: () => void;
  initialPackId?: string | null;
  initialSuccessBooking?: Booking | null;
}

const BookingView: React.FC<BookingViewProps> = ({ packs, bookings, homeContent, onSubmit, onReturnHome, initialPackId, initialSuccessBooking }) => {
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

  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [lastPaymentMethod, setLastPaymentMethod] = useState<string | null>(null);
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);

  // Efecto para manejar el retorno exitoso de Mollie
  useEffect(() => {
    if (initialSuccessBooking) {
      setLastBooking(initialSuccessBooking);
      setLastPaymentMethod('mollie');
      setPaymentStatus('success');
    }
  }, [initialSuccessBooking]);

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
      const hourlyBase = selectedPack.pricePerHour + extrasPricePerHour;
      return (hourlyBase * bonoSize) * (1 - discount);
    }

    if (appliedBono) {
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

  const getStudioWhatsAppLink = (booking: Booking) => {
    const studioPhone = homeContent.payments.bizumPhone.replace(/\D/g, ''); 
    if (!studioPhone) return null;

    const extrasNames = booking.selectedExtrasIds.map(id => homeContent.extras.find(e => e.id === id)?.name).join(', ');
    
    let text = '';
    if (bookingMode === 'bono') {
        text = `👋 Hola, he comprado un *BONO de ${bonoSize} HORAS* en ${homeContent.studioName}.\n\n👤 *${booking.customerName}*\n💰 Total: ${booking.totalPrice}€\n📧 ${booking.customerEmail}\n\nEspero confirmación.`;
    } else {
        text = `👋 Hola, he realizado una reserva en ${homeContent.studioName}.\n\n📅 *${booking.date}*\n⏰ *${booking.startTime}:00* (${booking.duration}h)\n📦 ${selectedPack.name}\n👤 *${booking.customerName}*\n💰 Total: ${booking.totalPrice}€\n${extrasNames ? `➕ Extras: ${extrasNames}\n` : ''}\nEspero confirmación.`;
    }

    return `https://wa.me/34${studioPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleFinalSubmit = async (method: 'bizum' | 'revolut' | 'mollie' | 'bono') => {
    if (bookingMode === 'session' && (selectedHour === null || errorMsg)) return;
    if (bookingMode === 'bono' && (!customerName || !customerEmail)) return;
    
    // Objeto Booking preliminar
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
      status: (method === 'bono' || method === 'mollie') ? 'confirmed' : 'pending_verification',
      paymentMethod: method === 'revolut' ? 'revolut' : method === 'bizum' ? 'bizum' : method === 'bono' ? 'bono' : 'mollie',
      appliedCouponCode: appliedCoupon?.code,
      appliedBonoCode: appliedBono?.code,
      createdAt: Date.now()
    };

    if (method === 'mollie') {
      try {
        setPaymentStatus('processing');
        const apiUrl = homeContent.apiUrl || 'https://estudio-dj-api-2.onrender.com';
        
        const description = bookingMode === 'bono' 
          ? `Bono ${bonoSize} Horas - ${customerName}`
          : `Reserva ${selectedDate} ${selectedPack.name} - ${customerName}`;

        // Guardamos la reserva pendiente temporalmente
        sessionStorage.setItem('pending_mollie_booking', JSON.stringify(newBooking));

        // URL actual limpia + parámetro de retorno
        const currentUrl = window.location.href.split('?')[0];
        const redirectUrl = `${currentUrl}?payment_return=true`;

        const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/create-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalPrice,
            description: description,
            redirectUrl: redirectUrl
          })
        });

        const data = await response.json();
        
        if (data.checkoutUrl && data.paymentId) {
          // SEGURIDAD: Guardamos el Payment ID real de Mollie para verificarlo luego
          sessionStorage.setItem('mollie_payment_id', data.paymentId);
          window.location.href = data.checkoutUrl;
          return;
        } else {
          alert('Error al iniciar el pago: ' + (data.error || 'No se recibió ID de pago'));
          setPaymentStatus('idle');
          return;
        }
      } catch (error) {
        console.error(error);
        alert('Error de conexión con el servidor de pagos.');
        setPaymentStatus('idle');
        return;
      }
    }

    // Para métodos manuales
    onSubmit(newBooking);
    
    // ENVIAR EMAIL DE NOTIFICACIÓN (RESEND) - MÉTODOS MANUALES
    const apiUrl = homeContent.apiUrl || 'https://estudio-dj-api-2.onrender.com';
    fetch(`${apiUrl.replace(/\/$/, '')}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cliente: newBooking.customerName,
            servicio: bookingMode === 'bono' ? 'Compra de Bono (Manual)' : `Reserva ${selectedPack.name} (Manual)`,
            fecha: newBooking.date
        })
    }).catch(console.error);

    setLastBooking(newBooking);
    setLastPaymentMethod(method);
    setPaymentStatus('success');
  };

  if (paymentStatus === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-pulse">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-orbitron font-bold uppercase text-white tracking-widest">Conectando con Pasarela Segura...</h2>
        <p className="text-zinc-500 text-xs mt-2 uppercase font-black">Serás redirigido en unos segundos</p>
      </div>
    );
  }

  if (paymentStatus === 'success' && lastBooking) {
    const isManualPayment = lastPaymentMethod === 'bizum' || lastPaymentMethod === 'revolut';
    const waLink = getStudioWhatsAppLink(lastBooking);
    
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-in zoom-in duration-500 px-6">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-10 shadow-2xl ${isManualPayment ? 'bg-blue-500' : 'bg-green-500'}`}>
            {isManualPayment ? 'ℹ️' : '✓'}
        </div>
        <h2 className="text-4xl font-orbitron font-bold mb-6 uppercase tracking-tighter">
            {isManualPayment ? 'Reserva Registrada' : 'Reserva Confirmada'}
        </h2>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-10 shadow-inner">
            {isManualPayment ? (
                <>
                    <p className="text-white text-lg font-bold mb-4 uppercase">Siguiente paso: Realizar Pago</p>
                    <p className="text-zinc-400 font-light leading-relaxed mb-6">
                        Para confirmar tu reserva, envía el importe de <strong className="text-white">{totalPrice.toFixed(0)}€</strong> mediante:
                    </p>
                    
                    {lastPaymentMethod === 'bizum' && (
                       <a href={`tel:${homeContent.payments.bizumPhone.replace(/\s/g, '')}`} className="block bg-blue-600/10 border border-blue-500/30 p-6 rounded-2xl mb-6 hover:bg-blue-600/20 transition-all cursor-pointer group text-decoration-none">
                          <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-2">Pulsar para hacer Bizum a</p>
                          <p className="text-3xl font-mono font-bold text-white tracking-wider group-hover:scale-105 transition-transform">{homeContent.payments.bizumPhone}</p>
                          <span className="text-[9px] text-zinc-500 uppercase font-black mt-2 block">Abre la agenda de tu teléfono</span>
                       </a>
                    )}

                    {lastPaymentMethod === 'revolut' && (
                       <div className="bg-white/10 border border-white/20 p-6 rounded-2xl mb-6">
                          <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Enviar Revolut al usuario</p>
                          <p className="text-3xl font-mono font-bold text-white tracking-wider mb-2">{homeContent.payments.revolutTag}</p>
                          {homeContent.payments.revolutLink && (
                            <a href={homeContent.payments.revolutLink} target="_blank" rel="noreferrer" className="inline-block bg-white text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:scale-105 transition-transform shadow-lg">Pagar en Revolut.me →</a>
                          )}
                       </div>
                    )}
                </>
            ) : (
                <p className="text-zinc-400 text-lg font-light leading-relaxed">
                    ¡Tu pago se ha recibido y verificado correctamente! Te esperamos en el estudio.
                </p>
            )}

            <div className="mt-8 border-t border-zinc-800 pt-8">
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-4">ÚLTIMO PASO OBLIGATORIO</p>
                {waLink && (
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="block w-full bg-[#25D366] text-white py-5 rounded-2xl font-black text-[14px] uppercase shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-105 transition-transform flex items-center justify-center gap-3">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                        Enviar Confirmación por WhatsApp
                    </a>
                )}
                <p className="text-[8px] text-zinc-600 mt-2 uppercase font-black">Esto abrirá tu WhatsApp con los detalles del pedido</p>
            </div>
        </div>

        <button 
            onClick={onReturnHome} 
            className="bg-white text-black py-4 px-16 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-purple-600 hover:text-white transition-all shadow-xl"
        >
            Volver al Inicio
        </button>
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
               {homeContent.payments.revolutEnabled && <button onClick={() => handleFinalSubmit('revolut')} disabled={!customerName || (bookingMode === 'session' && !selectedHour)} className="w-full bg-white text-black py-5 rounded-2xl font-black text-[12px] uppercase shadow-2xl disabled:opacity-20 transform hover:scale-105 transition-all">Pagar con Revolut</button>}
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
