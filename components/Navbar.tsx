
import React from 'react';
import { ViewType, HomeContent } from '../types';

interface NavbarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  homeContent: HomeContent;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, homeContent }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setView('home')}
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center font-black text-white group-hover:rotate-12 transition-all shadow-lg shadow-purple-600/20">
            {homeContent.studioName.charAt(0)}
          </div>
          <span className="font-orbitron text-xl font-bold tracking-tighter hidden sm:block uppercase">
            {homeContent.studioName}
          </span>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setView('home')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              currentView === 'home' ? 'text-white' : 'text-zinc-500 hover:text-white'
            }`}
          >
            Inicio
          </button>
          <button 
            onClick={() => setView('booking')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              currentView === 'booking' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-zinc-500 hover:text-white'
            }`}
          >
            Reservar
          </button>
          <button 
            onClick={() => setView('admin')}
            className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              currentView === 'admin' ? 'text-white bg-zinc-800' : 'text-zinc-600 hover:text-white'
            }`}
          >
            Admin
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
