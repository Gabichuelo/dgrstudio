
import React, { useState, useEffect, useRef } from 'react';
import { ViewType, Booking, Pack, HomeContent } from './types';
import { INITIAL_PACKS, INITIAL_HOME_CONTENT } from './constants';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import BookingView from './components/BookingView';
import AdminDashboard from './components/AdminDashboard';

export function App() {
  const [view, setView] = useState<ViewType>('home');
  
  // Estados de React (para renderizar la UI)
  const [packs, setPacks] = useState<Pack[]>(INITIAL_PACKS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [homeContent, setHomeContent] = useState<HomeContent>(INITIAL_HOME_CONTENT);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'idle'>('idle');
  const [preselectedPackId, setPreselectedPackId] = useState<string | null>(null);

  // Referencia mutable para mantener el estado "real" y actual accesible instantáneamente
  const stateRef = useRef({ packs, bookings, homeContent });

  // Mantenemos la referencia sincronizada con el estado cada vez que cambia
  useEffect(() => {
    stateRef.current = { packs, bookings, homeContent };
  }, [packs, bookings, homeContent]);

  // Cargamos datos iniciales
  useEffect(() => {
    const savedPacks = localStorage.getItem('dj_packs');
    const savedBookings = localStorage.getItem('dj_bookings');
    const savedHome = localStorage.getItem('dj_home');
    
    let loadedPacks = INITIAL_PACKS;
    let loadedBookings: Booking[] = [];
    let loadedHome = INITIAL_HOME_CONTENT;

    if (savedPacks) {
        try { loadedPacks = JSON.parse(savedPacks); } catch(e) {}
    }
    if (savedBookings) {
        try { loadedBookings = JSON.parse(savedBookings); } catch(e) {}
    }
    if (savedHome) {
        try { 
            const parsed = JSON.parse(savedHome);
            // Mezcla robusta:
            loadedHome = {
                ...INITIAL_HOME_CONTENT,
                ...parsed,
                payments: { ...INITIAL_HOME_CONTENT.payments, ...(parsed.payments || {}) },
                availability: { ...INITIAL_HOME_CONTENT.availability, ...(parsed.availability || {}) }
            };
        } catch(e) { console.error("Error leyendo configuración local", e); }
    }

    setPacks(loadedPacks);
    setBookings(loadedBookings);
    setHomeContent(loadedHome);
    
    // Actualizamos la ref inmediatamente tras la carga inicial
    stateRef.current = { packs: loadedPacks, bookings: loadedBookings, homeContent: loadedHome };

    const initialUrl = loadedHome.apiUrl || INITIAL_HOME_CONTENT.apiUrl;
    
    // Sincronización inicial con el servidor
    fetch(`${initialUrl.replace(/\/$/, '')}/api/sync`)
      .then(res => res.json())
      .then(result => {
        const updates: any = {};
        if (result.packs) updates.packs = result.packs;
        if (result.bookings) updates.bookings = result.bookings;
        // Al recibir del servidor, también hacemos merge seguro
        if (result.homeContent) {
             updates.homeContent = { 
                ...loadedHome, 
                ...result.homeContent
            };
        }
        
        if (Object.keys(updates).length > 0) {
            if(updates.packs) setPacks(updates.packs);
            if(updates.bookings) setBookings(updates.bookings);
            if(updates.homeContent) setHomeContent(updates.homeContent);
            setServerStatus('online');
        }
      })
      .catch(() => setServerStatus('offline'));
  }, []);

  // Función de sincronización con la nube
  const syncToCloud = async (currentPacks: Pack[], currentBookings: Booking[], currentHome: HomeContent) => {
    setIsSyncing(true);
    try {
      const apiUrl = currentHome.apiUrl || INITIAL_HOME_CONTENT.apiUrl;
      const url = `${apiUrl.replace(/\/$/, '')}/api/sync`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packs: currentPacks,
          bookings: currentBookings,
          homeContent: currentHome
        }),
      });

      if (response.ok) setServerStatus('online');
      else setServerStatus('offline');
    } catch (e) {
      setServerStatus('offline');
    } finally {
      setIsSyncing(false);
    }
  };

  // Guardado centralizado ROBUSTO usando Refs
  const performSave = (updates: { packs?: Pack[], bookings?: Booking[], home?: HomeContent }) => {
    const current = stateRef.current;

    const nextPacks = updates.packs || current.packs;
    const nextBookings = updates.bookings || current.bookings;
    const nextHome = updates.home || current.homeContent;

    if (updates.packs) setPacks(nextPacks);
    if (updates.bookings) setBookings(nextBookings);
    if (updates.home) setHomeContent(nextHome);

    if (updates.packs) localStorage.setItem('dj_packs', JSON.stringify(nextPacks));
    if (updates.bookings) localStorage.setItem('dj_bookings', JSON.stringify(nextBookings));
    if (updates.home) localStorage.setItem('dj_home', JSON.stringify(nextHome));

    stateRef.current = { packs: nextPacks, bookings: nextBookings, homeContent: nextHome };

    syncToCloud(nextPacks, nextBookings, nextHome);
  };

  const handleAddBooking = (newBooking: Booking) => {
    const currentHome = stateRef.current.homeContent;
    const currentBookings = stateRef.current.bookings;

    const updatedBookings = [...currentBookings, newBooking];
    let updatedHome = { ...currentHome };

    // Manejo de bonos
    if (newBooking.appliedBonoCode) {
      const bonoIndex = (updatedHome.hourBonos || []).findIndex(b => b.code === newBooking.appliedBonoCode);
      if (bonoIndex !== -1) {
        const updatedBonos = [...updatedHome.hourBonos];
        updatedBonos[bonoIndex] = { 
          ...updatedBonos[bonoIndex], 
          remainingHours: Math.max(0, updatedBonos[bonoIndex].remainingHours - newBooking.duration) 
        };
        updatedHome.hourBonos = updatedBonos;
      }
    }

    performSave({ bookings: updatedBookings, home: updatedHome });
    setPreselectedPackId(null);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-600">
      <Navbar currentView={view} setView={setView} homeContent={homeContent} />
      
      <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-zinc-900/95 border border-zinc-800 p-4 rounded-2xl shadow-2xl backdrop-blur-xl transition-all hover:scale-105">
        <div className={`w-3 h-3 rounded-full transition-all ${isSyncing ? 'bg-blue-500 animate-ping' : serverStatus === 'online' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse'}`}></div>
        <div className="flex flex-col">
          <span className={`text-[9px] font-black uppercase tracking-widest ${isSyncing ? 'text-blue-400' : 'text-zinc-500'}`}>
            {isSyncing ? 'Sincronizando...' : 'Estado Nube'}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-tighter transition-colors">
            {serverStatus === 'online' ? 'Conectado' : 'Modo Local'}
          </span>
        </div>
      </div>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        {view === 'home' && (
            <HomeView 
                onBookNow={() => setView('booking')} 
                onSelectPack={(id) => { setPreselectedPackId(id); setView('booking'); }} 
                packs={packs} 
                content={homeContent} 
            />
        )}
        {view === 'booking' && (
            <BookingView 
                packs={packs} 
                bookings={bookings} 
                homeContent={homeContent} 
                onSubmit={handleAddBooking} 
                onReturnHome={() => setView('home')}
                initialPackId={preselectedPackId} 
            />
        )}
        {view === 'admin' && (
          <AdminDashboard 
            packs={packs} 
            bookings={bookings} 
            homeContent={homeContent}
            onUpdatePacks={(p) => performSave({ packs: p })}
            onUpdateHome={(h) => performSave({ home: h })}
            onUpdateBookings={(b) => performSave({ bookings: b })}
            onForceSync={() => window.location.reload()}
            onPushToCloud={() => performSave({})}
          />
        )}
      </main>
    </div>
  );
}
