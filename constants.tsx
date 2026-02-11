
import { Pack, HomeContent, BonoPack } from './types';

export const INITIAL_PACKS: Pack[] = [
  {
    id: 'basic',
    name: 'Estudio Solo',
    description: 'Uso del espacio con tu propio equipo.',
    pricePerHour: 15,
    features: ['Insonorización', 'Aire Acondicionado', 'WiFi Alta Velocidad'],
    icon: '🏠',
    isActive: true
  },
  {
    id: 'streaming',
    name: 'Pack Streaming Pro',
    description: 'Incluye cámaras 4K y PC configurado para OBS.',
    pricePerHour: 35,
    features: ['2x Cámaras 4K Sony', 'PC i9/RTX 4080', 'Focos LED Elgato'],
    icon: '🎥',
    isActive: true
  }
];

export const BONO_PACKS: BonoPack[] = [
  { id: 'b3', name: 'Bono Lite', hours: 3, discountPercentage: 5, description: 'Ideal para sesiones cortas' },
  { id: 'b5', name: 'Bono Pro', hours: 5, discountPercentage: 10, description: 'Nuestra opción más popular' },
  { id: 'b10', name: 'Bono Elite', hours: 10, discountPercentage: 20, description: 'Máximo ahorro para profesionales' }
];

const DEFAULT_SCHEDULE = { isOpen: true, start: 10, end: 22 };

export const INITIAL_HOME_CONTENT: HomeContent = {
  studioName: "STREAMPULSE",
  heroTitle: "TU SET DE DJ\nAL NIVEL MUNDIAL",
  heroSubtitle: "Reserva el estudio de streaming más avanzado. Equipamiento Pioneer DJ Pro, Cámaras 4K y acústica perfecta.",
  heroImageUrl: "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&q=80&w=2000",
  bannerTitle: "TECNOLOGÍA PUNTA",
  studioDescription: "No es solo un estudio, es tu marca personal. Grabamos y streameamos tu sesión con calidad televisiva mientras tú te centras en la mezcla.",
  adminEmail: "info@tu-estudio.com",
  footerText: "Calle del Ritmo 12, 28001 Madrid | +34 600 000 000",
  footerSecondaryText: "© 2025 STREAMPULSE DJ STUDIO. Todos los derechos reservados. Las cancelaciones deben realizarse con 24h de antelación.",
  availability: {
    monday: DEFAULT_SCHEDULE,
    tuesday: DEFAULT_SCHEDULE,
    wednesday: DEFAULT_SCHEDULE,
    thursday: DEFAULT_SCHEDULE,
    friday: DEFAULT_SCHEDULE,
    saturday: { isOpen: true, start: 12, end: 20 },
    sunday: { isOpen: false, start: 0, end: 0 },
    overrides: []
  },
  // Email config eliminado para priorizar WhatsApp
  payments: {
    mollieEnabled: false,
    mollieApiKey: "",
    bizumEnabled: true,
    bizumPhone: "600 000 000",
    revolutEnabled: true,
    revolutLink: "https://revolut.me/tuusuario",
    revolutTag: "@tuusuario"
  },
  extras: [
    { id: 'ext1', name: 'Grabación 4K', price: 10, icon: '📼' },
    { id: 'ext2', name: 'Humo / FX', price: 5, icon: '💨' },
    { id: 'ext3', name: 'Bebida Energética', price: 3, icon: '⚡' }
  ],
  coupons: [
    { id: 'c1', code: 'BIENVENIDA10', discountPercentage: 10, isActive: true }
  ],
  hourBonos: [], 
  bonoPacks: BONO_PACKS,
  apiUrl: "https://estudio-dj-api-2.onrender.com" 
};
