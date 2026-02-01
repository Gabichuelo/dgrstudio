
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'idle'>('idle');

  // Usamos una ref para el apiUrl para que syncWithServer sea estable y no entre en bucle
  const apiUrlRef = useRef(homeContent.apiUrl);
  useEffect(() => {
    apiUrlRef.current = homeContent.apiUrl;
  }, [homeContent.apiUrl]);

  const syncWithServer = useCallback(async (action: 'fetch' | 'push', data?: any) => {
    const currentApiUrl = apiUrlRef.current;
    if (!currentApiUrl) {
      setServerStatus('idle');
      return null;
    }
    
    setIsSyncing(true);
    try {
      const url = `${currentApiUrl.replace(/\/$/, '')}/api/sync`;
      const response = await fetch(url, {
        method: action === 'push' ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'push' ? JSON.stringify(data) : undefined,
      });

      if (response.ok) {
        const result = await response.json();
        if (action === 'fetch' && result) {
          if (result.packs?.length > 0) setPacks(result.packs);
          if (result.bookings) setBookings(result.bookings);
          // Solo actualizamos homeContent si el servidor devuelve algo válido y evitamos sobreescribir el apiUrl local si el del servidor está vacío
          if (result.homeContent?.studioName) {
            setHomeContent(prev => ({
              ...result.homeContent,
              apiUrl: prev.apiUrl // Mantenemos nuestra URL actual para evitar loops si el servidor tiene una distinta o vacía
            }));
          }
        }
        setServerStatus('online');
        return result;
      } else {
        setServerStatus('offline');
      }
    } catch (e) {
      setServerStatus('offline');
      console.warn("Servidor no disponible.");
    } finally {
      setIsSyncing(false);
    }
    return null;
  }, []); // Dependencias vacías porque usamos Refs para los valores cambiantes

  // Efecto de carga inicial (solo una vez al montar el componente)
  useEffect(() => {
    const loadInitialData = async () => {
      const savedPacks = localStorage.getItem('dj_packs');
      const savedBookings = localStorage.getItem('dj_bookings');
      const savedHome = localStorage.getItem('dj_home');
      
      if (savedPacks) setPacks(JSON.parse(savedPacks));
      if (savedBookings) setBookings(JSON.parse(savedBookings));
      if (savedHome) {
        const parsedHome = JSON.parse(savedHome);
        setHomeContent(parsedHome);
        // Actualizamos la ref inmediatamente para el primer fetch
        apiUrlRef.current = parsedHome.apiUrl;
      }

      // Intentamos sincronizar con el servidor tras cargar lo local
      await syncWithServer('fetch');
    };
    
    loadInitialData();
  }, [syncWithServer]);

  // Guardar en LocalStorage cada vez que algo cambie localmente
  useEffect(() => {
    localStorage.setItem('dj_packs', JSON.stringify(packs));
    localStorage.setItem('dj_bookings', JSON.stringify(bookings));
    localStorage.setItem('dj_home', JSON.stringify(homeContent));
  }, [packs, bookings, homeContent]);

  const handleAddBooking = async (newBooking: Booking) => {
    const updated = [...bookings, newBooking];
    setBookings(updated);
    await syncWithServer('push', { bookings: updated });
    setView('home');
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-600">
      <Navbar currentView={view} setView={setView} homeContent={homeContent} />
      
      {/* Indicador de Estado del Servidor */}
      <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl shadow-2xl backdrop-blur-xl">
        <div className={`w-2 h-2 rounded-full ${
          serverStatus === 'online' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 
          serverStatus === 'offline' ? 'bg-red-500 animate-pulse' : 'bg-zinc-700'
        }`}></div>
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Servidor Cloud</span>
          <span className="text-[9px] font-bold uppercase tracking-tighter">
            {serverStatus === 'online' ? 'Conectado' : serverStatus === 'offline' ? 'Desconectado' : 'Modo Local'}
          </span>
        </div>
        {isSyncing && <div className="ml-2 w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>}
      </div>

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
