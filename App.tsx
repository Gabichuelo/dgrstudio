
import React, { useState, useEffect, useCallback } from 'react';
import { ViewType, Booking, Pack, HomeContent } from './types';
import { INITIAL_PACKS, INITIAL_HOME_CONTENT } from './constants';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import BookingView from './components/BookingView';
import AdminDashboard from './components/AdminDashboard';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('home');
  const [packs, setPacks] = useState<Pack[]>(INITIAL_PACKS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [homeContent, setHomeContent] = useState<HomeContent>(INITIAL_HOME_CONTENT);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sincronización con el servidor remoto
  const syncWithServer = useCallback(async (action: 'fetch' | 'push', data?: any) => {
    if (!homeContent.apiUrl) return null;
    
    setIsSyncing(true);
    try {
      const url = `${homeContent.apiUrl.replace(/\/$/, '')}/api/sync`;
      const response = await fetch(url, {
        method: action === 'push' ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'push' ? JSON.stringify(data) : undefined,
      });

      if (response.ok) {
        const result = await response.json();
        if (action === 'fetch' && result) {
          if (result.packs) setPacks(result.packs);
          if (result.bookings) setBookings(result.bookings);
          if (result.homeContent) setHomeContent(result.homeContent);
        }
        return result;
      }
    } catch (e) {
      console.warn("Servidor no disponible. Trabajando en modo local.");
    } finally {
      setIsSyncing(false);
    }
    return null;
  }, [homeContent.apiUrl]);

  // Cargar datos al inicio
  useEffect(() => {
    const load = async () => {
      const savedPacks = localStorage.getItem('streampulse_packs');
      const savedBookings = localStorage.getItem('streampulse_bookings');
      const savedHome = localStorage.getItem('streampulse_home');
      
      if (savedPacks) setPacks(JSON.parse(savedPacks));
      if (savedBookings) setBookings(JSON.parse(savedBookings));
      if (savedHome) setHomeContent(JSON.parse(savedHome));

      await syncWithServer('fetch');
    };
    load();
  }, [syncWithServer]);

  // Guardar en LocalStorage cada vez que algo cambie
  useEffect(() => {
    localStorage.setItem('streampulse_packs', JSON.stringify(packs));
    localStorage.setItem('streampulse_bookings', JSON.stringify(bookings));
    localStorage.setItem('streampulse_home', JSON.stringify(homeContent));
  }, [packs, bookings, homeContent]);

  const handleAddBooking = async (newBooking: Booking) => {
    const updated = [...bookings, newBooking];
    setBookings(updated);
    await syncWithServer('push', { bookings: updated });
    setView('home');
    alert("¡Reserva guardada con éxito!");
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-600">
      <Navbar currentView={view} setView={setView} homeContent={homeContent} />
      
      {isSyncing && (
        <div className="fixed bottom-8 right-8 z-[100] flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full shadow-2xl">
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping"></div>
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Sync...</span>
        </div>
      )}

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        {view === 'home' && <HomeView onBookNow={() => setView('booking')} packs={packs} content={homeContent} />}
        {view === 'booking' && <BookingView packs={packs} bookings={bookings} homeContent={homeContent} onSubmit={handleAddBooking} />}
        {view === 'admin' && (
          <AdminDashboard 
            packs={packs} bookings={bookings} homeContent={homeContent}
            onUpdatePacks={(p) => { setPacks(p); syncWithServer('push', { packs: p }); }}
            onUpdateHome={(h) => { setHomeContent(h); syncWithServer('push', { homeContent: h }); }}
            onUpdateBookings={(b) => { setBookings(b); syncWithServer('push', { bookings: b }); }}
            onForceSync={() => syncWithServer('fetch')}
            onPushToCloud={() => syncWithServer('push', { packs, bookings, homeContent })}
          />
        )}
      </main>
    </div>
  );
};

export default App;
