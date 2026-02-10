
import React, { useState } from 'react';
import { Pack, Booking, HomeContent, DaySchedule } from '../types';

interface AdminDashboardProps {
  packs: Pack[];
  bookings: Booking[];
  homeContent: HomeContent;
  onUpdatePacks: (packs: Pack[]) => void;
  onUpdateHome: (content: HomeContent) => void;
  onUpdateBookings: (bookings: Booking[]) => void;
  onForceSync: () => void;
  onPushToCloud: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  packs, bookings, homeContent, onUpdatePacks, onUpdateHome, onUpdateBookings, onForceSync, onPushToCloud 
}) => {
  const [isAuthorized, setIsAuthorized] = useState(sessionStorage.getItem('admin_session') === 'true');
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState<'bookings' | 'schedule' | 'packs' | 'cms' | 'payments' | 'config'>('bookings');
  const [dbPassword, setDbPassword] = useState('TU_PASSWORD_AQUI');

  // Construimos la URI dinámicamente
  const mongoUri = `mongodb+srv://gabry87_db_user:${dbPassword}@dgrstudio.ognbwwb.mongodb.net/?appName=DGRStudio`;

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto py-32 text-center">
        <h1 className="text-3xl font-orbitron font-bold mb-8 uppercase tracking-widest text-purple-500">DGR Admin</h1>
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          if(passwordInput === 'admin123') { 
            setIsAuthorized(true); 
            sessionStorage.setItem('admin_session', 'true'); 
          } else {
            alert("Contraseña incorrecta");
          }
        }} className="space-y-4 text-center">
          <input 
            type="password" 
            value={passwordInput} 
            onChange={(e) => setPasswordInput(e.target.value)} 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 outline-none text-center font-orbitron text-purple-400 focus:border-purple-500 transition-all" 
            placeholder="CONTRASEÑA" 
          />
          <button className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-xl hover:bg-purple-600 hover:text-white transition-all">
            ENTRAR AL SISTEMA
          </button>
        </form>
      </div>
    );
  }

  const serverJsCode = `const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Configuración de Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// URL de conexión (Hardcoded para facilitar el primer despliegue)
const MONGODB_URI = "${mongoUri}";

console.log('🚀 Iniciando servidor DGR Studio...');

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log('✅ MongoDB Conectado con éxito'))
.catch(err => {
  console.error('❌ ERROR CRÍTICO DE CONEXIÓN DB:', err.message);
  console.log('👉 Tip: Revisa si has permitido el acceso desde cualquier IP (0.0.0.0/0) en MongoDB Atlas.');
});

const State = mongoose.model('State', {
  id: { type: String, default: 'main' },
  packs: Array,
  bookings: Array,
  homeContent: Object
});

// Ruta de salud para Render
app.get('/', (req, res) => res.status(200).send('DGR Studio API is LIVE 🚀'));

app.get('/api/sync', async (req, res) => {
  try {
    const state = await State.findOne({ id: 'main' });
    res.json(state || { packs: [], bookings: [], homeContent: {} });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/sync', async (req, res) => {
  try {
    await State.findOneAndUpdate({ id: 'main' }, req.body, { upsert: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Servidor escuchando en puerto ' + PORT);
});`;

  const packageJsonCode = `{
  "name": "dgr-studio-api",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": { 
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "mongoose": "^8.0.0"
  }
}`;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-2xl font-orbitron font-bold uppercase tracking-tighter text-white">Panel de Control</h1>
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.4em]">DGR Studio / {activeTab}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-1 p-1.5 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-sm">
          {['bookings', 'schedule', 'config'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
              {tab === 'bookings' ? 'Reservas' : tab === 'schedule' ? 'Horarios' : 'Nube/Despliegue'}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'config' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-500">
          {/* SECCIÓN DE SOLUCIÓN DE PROBLEMAS */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-[2.5rem] p-8 lg:p-12">
            <h2 className="text-xl font-orbitron font-bold text-red-500 mb-6 uppercase">¿El despliegue ha fallado? Revisa esto:</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center font-bold text-red-500">1</div>
                <h3 className="font-black text-[10px] uppercase tracking-widest">Network Access (Atlas)</h3>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  En MongoDB Atlas, ve a <b>Network Access</b> (menú lateral), haz clic en <b>Add IP Address</b> y elige <b>"Allow Access from Anywhere"</b> (IP 0.0.0.0/0). Si no haces esto, Render no podrá entrar.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center font-bold text-red-500">2</div>
                <h3 className="font-black text-[10px] uppercase tracking-widest">Pestaña "Logs" en Render</h3>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Entra en tu proyecto de Render y haz clic en la pestaña <b>"Logs"</b>. Si ves un error de <b>"authentication failed"</b>, es que la contraseña de MongoDB está mal escrita arriba.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center font-bold text-red-500">3</div>
                <h3 className="font-black text-[10px] uppercase tracking-widest">Raíz del Repositorio</h3>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Asegúrate de que <code>server.js</code> y <code>package.json</code> están en la carpeta principal de tu GitHub. No los metas en carpetas.
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-[3rem] p-10 space-y-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500">Tu Password de MongoDB:</label>
                <input 
                  type="text"
                  value={dbPassword} 
                  onChange={(e) => setDbPassword(e.target.value)} 
                  className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-xs font-mono text-purple-400 focus:border-purple-500 transition-all" 
                  placeholder="Pega la contraseña aquí"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500">URL del Servidor (Render):</label>
                <input 
                  value={homeContent.apiUrl} 
                  onChange={(e) => onUpdateHome({...homeContent, apiUrl: e.target.value})} 
                  className="w-full bg-zinc-800/30 border border-zinc-800 rounded-2xl px-6 py-4 text-xs font-mono text-zinc-400" 
                  placeholder="https://tu-api.onrender.com"
                />
                <button onClick={onPushToCloud} className="w-full mt-4 bg-purple-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] hover:bg-purple-500 transition-all shadow-xl shadow-purple-600/20">
                  Guardar configuración y subir datos ↑
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 space-y-6">
              <h3 className="text-xl font-orbitron font-bold uppercase text-white">Código para GitHub</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black uppercase text-purple-400">server.js</span>
                  <button onClick={() => {navigator.clipboard.writeText(serverJsCode); alert("Copiado!");}} className="text-[9px] text-zinc-600 hover:text-white uppercase font-bold">Copiar</button>
                </div>
                <div className="p-4 bg-black rounded-xl border border-zinc-800 max-h-48 overflow-y-auto">
                  <pre className="text-[9px] text-zinc-500 font-mono leading-relaxed">{serverJsCode}</pre>
                </div>

                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black uppercase text-purple-400">package.json</span>
                  <button onClick={() => {navigator.clipboard.writeText(packageJsonCode); alert("Copiado!");}} className="text-[9px] text-zinc-600 hover:text-white uppercase font-bold">Copiar</button>
                </div>
                <div className="p-4 bg-black rounded-xl border border-zinc-800">
                  <pre className="text-[9px] text-zinc-500 font-mono">{packageJsonCode}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[9px] uppercase text-zinc-500 font-black tracking-widest border-b border-zinc-800">
              <tr><th className="px-8 py-5">Cliente</th><th className="px-8 py-5">Sesión</th><th className="px-8 py-5 text-right">Estado</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {bookings.length === 0 ? (
                <tr><td colSpan={3} className="px-8 py-24 text-center text-zinc-700 uppercase font-black text-xs tracking-[0.2em]">No hay reservas todavía</td></tr>
              ) : bookings.sort((a,b) => b.createdAt - a.createdAt).map(b => (
                <tr key={b.id} className="hover:bg-white/[0.01]">
                  <td className="px-8 py-6">
                    <div className="font-bold text-sm text-white uppercase">{b.customerName}</div>
                    <div className="text-[9px] text-zinc-500 font-black uppercase">{b.customerEmail}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs font-bold text-purple-400 uppercase">{b.date}</div>
                    <div className="text-[9px] text-zinc-600 font-black uppercase">{b.startTime}:00 ({b.duration}h)</div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {b.status === 'pending_verification' ? (
                      <button onClick={() => onUpdateBookings(bookings.map(x => x.id === b.id ? {...x, status: 'confirmed'} : x))} className="bg-white text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-green-600 hover:text-white">Confirmar</button>
                    ) : (
                      <span className="text-green-500 font-black text-[9px] uppercase">Confirmado ✓</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
