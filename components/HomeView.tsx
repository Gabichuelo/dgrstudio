
import React from 'react';
import { Pack, HomeContent } from '../types';

interface HomeViewProps {
  onBookNow: () => void;
  packs: Pack[];
  content: HomeContent;
}

const HomeView: React.FC<HomeViewProps> = ({ onBookNow, packs, content }) => {
  const activePacks = packs.filter(p => p.isActive);

  return (
    <div className="space-y-24">
      <section className="text-center py-12 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/20 blur-[150px] -z-10 rounded-full animate-pulse"></div>
        <h1 className="text-5xl md:text-8xl font-orbitron font-bold mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent tracking-tighter uppercase whitespace-pre-line">
          {content.heroTitle}
        </h1>
        <p className="text-zinc-400 text-lg md:text-2xl max-w-3xl mx-auto mb-12 font-light leading-relaxed">
          {content.heroSubtitle}
        </p>
        <button 
            onClick={onBookNow}
            className="bg-purple-600 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:bg-purple-500 transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-purple-600/30"
        >
            Reservar Mi Sesión
        </button>
      </section>

      <section id="packs">
        <h2 className="text-4xl font-orbitron font-bold mb-12">NUESTROS PACKS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activePacks.map((pack) => (
            <div key={pack.id} className="bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] p-10 hover:border-purple-500/50 transition-all flex flex-col h-full group backdrop-blur-sm">
              <div className="text-5xl mb-6 group-hover:scale-125 transition-transform duration-500 origin-left">{pack.icon}</div>
              <h3 className="text-2xl font-bold mb-3">{pack.name}</h3>
              <p className="text-zinc-500 text-sm mb-8 leading-relaxed">{pack.description}</p>
              <div className="mb-10 space-y-3">
                {pack.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                    {feature}
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-8 border-t border-zinc-800/50 flex items-center justify-between">
                <div className="text-3xl font-orbitron font-bold">{pack.pricePerHour}€<span className="text-xs text-zinc-600 font-bold ml-1">/H</span></div>
                <button onClick={onBookNow} className="p-3 bg-zinc-800 rounded-xl group-hover:bg-purple-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative h-[500px] rounded-[3rem] overflow-hidden group">
        <img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=2000" alt="Studio" className="absolute inset-0 w-full h-full object-cover grayscale opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-12 md:p-20">
            <h2 className="text-4xl md:text-6xl font-orbitron font-bold max-w-2xl mb-6 uppercase">{content.bannerTitle}</h2>
            <p className="text-zinc-400 max-w-xl text-lg">{content.studioDescription}</p>
        </div>
      </section>
    </div>
  );
};

export default HomeView;
