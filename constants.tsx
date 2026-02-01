
import { Pack, HomeContent } from './types';

export const INITIAL_PACKS: Pack[] = [
  {
    id: 'basic',
    name: 'Estudio Solo',
    description: 'Uso del espacio sin equipamiento técnico.',
    pricePerHour: 15,
    features: ['Insonorización', 'Aire Acondicionado', 'WiFi Alta Velocidad'],
    icon: '🏠',
    isActive: true
  },
  {
    id: 'streaming',
    name: 'Pack Streaming Pro',
    description: 'Incluye cámaras 4K y PC de alto rendimiento configurado para OBS.',
    pricePerHour: 35,
    features: ['2x Cámaras 4K Sony', 'PC i9/RTX 4080', 'Focos LED Elgato'],
    icon: '🎥',
    isActive: true
  }
];

const DEFAULT_SCHEDULE = { isOpen: true, start: 10, end: 22 };

export const INITIAL_HOME_CONTENT: HomeContent = {
  studioName: "STREAMPULSE",
  heroTitle: "TU SET DE DJ\nAL NIVEL MUNDIAL",
  heroSubtitle: "Reserva el estudio de streaming más avanzado para DJs. Equipamiento Pioneer DJ Pro, Cámaras 4K y acústica perfecta.",
  bannerTitle: "TECNOLOGÍA PUNTA",
  studioDescription: "No es solo un estudio, es tu marca personal. Grabamos y streameamos tu sesión con calidad televisiva mientras tú te centras en la mezcla.",
  adminEmail: "info@tu-estudio.com",
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
  emailConfig: {
    smtpHost: "smtp.gmail.com",
    smtpUser: "",
    useAppPassword: true
  },
  payments: {
    mollieEnabled: true,
    mollieApiKey: "",
    bizumEnabled: true,
    bizumPhone: "600 000 000",
    revolutEnabled: true,
    revolutLink: "https://revolut.me/tuusuario",
    revolutTag: "@tuusuario"
  },
  // Added missing apiUrl property required by HomeContent interface
  apiUrl: ""
};
