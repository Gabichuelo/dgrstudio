
import React from 'react';
import { Pack, HomeContent } from '../types';

interface HomeViewProps {
  onBookNow: () => void;
  onSelectPack: (packId: string) => void;
  packs: Pack[];
  content: HomeContent;
}

const HomeView: React.FC<HomeViewProps> = ({ onBookNow, onSelectPack, packs, content }) => {
  const activePacks = packs.filter(p => p.isActive);

  const scrollToBonos = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('bonos');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-20 -mt-4 pb-12">
      {/* Hero Section */}
      <section className="relative h-[50vh] flex flex-col items-center justify-center text-center px-6 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 -z-10">
          <img 
            src={content.heroImageUrl} 
            alt="Studio Background" 
            className="w-full h-full object-cover grayscale-[0.3] brightness-[0.25]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black"></div>
        </div>

        <div className="relative z-10 animate-in fade-in zoom-in duration-700 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-orbitron font-bold mb-4 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent tracking-tighter uppercase leading-none whitespace-pre-line">
            {content.heroTitle}
          </h1>
          <p className="text-zinc-500 text-[10px] md:text-sm mb-10 font-medium max-w-md mx-auto leading-relaxed uppercase tracking-[0.1em]">
            {content.heroSubtitle}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
                onClick={onBookNow}
                className="bg-purple-600 text-white px-10 py-4 rounded-2xl font-black text-[11px] hover:bg-purple-500 transition-all transform hover:scale-105 shadow-2xl shadow-purple-600/30 uppercase tracking-[0.2em]"
            >
                Reservar Ahora
            </button>
            <button 
                onClick={scrollToBonos}
                className="bg-white/5 border border-white/10 text-white px-10 py-4 rounded-2xl font-black text-[11px] hover:bg-white/10 transition-all uppercase tracking-[0.2em] backdrop-blur-md"
            >
                Pack de Horas
            </button>
          </div>
        </div>
      </section>

      {/* Sección de Bonos Ahorro */}
      <section id="bonos" className="scroll-mt-32">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-orbitron font-bold uppercase tracking-tighter inline-block border-b-2 border-blue-600 pb-2">
            Bonos de Ahorro
          </h2>
          <p className="text-zinc-600 text-[10px] uppercase font-black tracking-[0.3em] mt-3">Maximiza tus sesiones pagando menos por hora</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { id: 'b3', name: 'Lite Session', hours: 3, icon: '⚡', color: 'blue' },
            { id: 'b5', name: 'Pro Session', hours: 5, icon: '🔥', color: 'purple' },
            { id: 'b10', name: 'Elite Master', hours: 10, icon: '👑', color: 'amber' }
          ].map((bono) => (
            <div key={bono.id} className="relative p-10 rounded-[3rem] bg-zinc-950/50 border border-zinc-900 hover:border-zinc-800 transition-all backdrop-blur-sm group overflow-hidden shadow-xl text-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">{bono.icon}</div>
              <h3 className="text-xs font-black mb-1 uppercase tracking-[0.2em] text-zinc-500">{bono.name}</h3>
              <div className="text-3xl font-orbitron font-bold text-white mb-8">
                {bono.hours} HORAS
              </div>
              <button onClick={onBookNow} className="w-full bg-blue-600/10 border border-blue-500/30 text-blue-400 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all shadow-lg">Comprar Bono</button>
            </div>
          ))}
        </div>
      </section>

      {/* Sección de Equipamiento / Packs */}
      <section id="packs">
        <div className="mb-10">
          <h2 className="text-xl font-orbitron font-bold flex items-center gap-4 uppercase tracking-tighter">
            <span className="w-10 h-1 bg-purple-600 rounded-full"></span>
            Equipamiento y Packs
          </h2>
          <p className="text-zinc-600 text-[9px] uppercase font-black tracking-[0.2em] ml-14 mt-1">Configura tu sesión con lo mejor de Pioneer DJ y Sony</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {activePacks.map((pack) => (
            <div key={pack.id} className="bg-zinc-900/20 border border-zinc-900 rounded-[3rem] p-10 hover:border-purple-600/20 transition-all flex flex-col group backdrop-blur-sm shadow-2xl">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform origin-left">{pack.icon}</div>
              <h3 className="text-lg font-black mb-2 uppercase tracking-tight text-white">{pack.name}</h3>
              <p className="text-zinc-500 text-[11px] mb-8 leading-relaxed font-medium uppercase tracking-widest">{pack.description}</p>
              <div className="mb-10 space-y-3">
                {pack.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-[9px] text-zinc-400 font-bold uppercase tracking-[0.1em]">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full shadow-[0_0_5px_rgba(168,85,247,0.5)]"></div>
                    {feature}
                  </div>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-8">
                <div className="text-2xl font-orbitron font-bold text-white">{pack.pricePerHour}€<span className="text-[10px] text-zinc-700 font-black ml-1 uppercase">/hora</span></div>
                <button onClick={() => onSelectPack(pack.id)} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl group-hover:bg-purple-600 group-hover:border-purple-500 transition-all shadow-xl hover:scale-110">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Banner Informativo / Configurar */}
      <section className="relative h-[280px] rounded-[3rem] overflow-hidden group shadow-2xl">
        <img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=1500" alt="Studio" className="absolute inset-0 w-full h-full object-cover grayscale opacity-20 transition-all duration-1000 group-hover:scale-110 group-hover:opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-10 md:p-14">
            <h2 className="text-2xl md:text-4xl font-orbitron font-bold mb-4 uppercase tracking-tighter leading-none">{content.bannerTitle}</h2>
            <p className="text-zinc-400 text-xs font-medium max-w-2xl leading-relaxed uppercase tracking-widest">
              {content.studioDescription}
            </p>
        </div>
      </section>

      {/* Footer Final */}
      <footer className="pt-20 border-t border-zinc-900">
        <div className="grid md:grid-cols-3 gap-12 items-start mb-20">
          <div className="space-y-6">
            <h2 className="text-4xl font-orbitron font-black text-white uppercase tracking-tighter">{content.studioName}</h2>
            <div className="w-20 h-1 bg-purple-600 rounded-full"></div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed max-w-xs whitespace-pre-line">
              {content.footerText}
            </p>
          </div>
          <div className="space-y-6">
            <h4 className="text-xs font-orbitron font-bold text-white uppercase tracking-widest">Navegación</h4>
            <ul className="space-y-3 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
              <li className="hover:text-purple-500 transition-colors cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>Volver Arriba</li>
              <li className="hover:text-purple-500 transition-colors cursor-pointer" onClick={onBookNow}>Reservar Sesión</li>
              <li className="hover:text-purple-500 transition-colors cursor-pointer" onClick={scrollToBonos}>Bonos Ahorro</li>
            </ul>
          </div>
          <div className="space-y-6 md:text-right">
            <h4 className="text-xs font-orbitron font-bold text-white uppercase tracking-widest">Legal y Soporte</h4>
            <p className="text-zinc-700 text-[9px] font-black uppercase tracking-[0.3em] leading-loose">
              {content.footerSecondaryText}
            </p>
          </div>
        </div>
        <div className="text-center pt-10 border-t border-zinc-900/50">
          <p className="text-[8px] font-black text-zinc-800 uppercase tracking-[0.5em]">Powered by StreamPulse Technology © 2025</p>
        </div>
      </footer>
    </div>
  );
};

export default HomeView;
