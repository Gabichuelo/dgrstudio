
export interface DaySchedule {
  isOpen: boolean;
  start: number; // 0-23
  end: number;   // 0-23
}

export interface DateOverride {
  date: string; // "YYYY-MM-DD"
  schedule: DaySchedule;
}

export interface Availability {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
  overrides: DateOverride[];
}

export interface EmailConfig {
  smtpHost: string;
  smtpUser: string;
  useAppPassword: boolean;
}

export interface PaymentConfig {
  mollieEnabled: boolean;
  mollieApiKey: string;
  bizumEnabled: boolean;
  bizumPhone: string;
  revolutEnabled: boolean;
  revolutLink: string;
  revolutTag: string;
}

export interface Pack {
  id: string;
  name: string;
  description: string;
  pricePerHour: number;
  features: string[];
  icon: string;
  isActive: boolean;
}

export interface HomeContent {
  studioName: string;
  heroTitle: string;
  heroSubtitle: string;
  bannerTitle: string;
  studioDescription: string;
  adminEmail: string;
  availability: Availability;
  emailConfig: EmailConfig;
  payments: PaymentConfig;
  apiUrl: string; // URL del servidor Node.js en el VPS
}

export interface Booking {
  id: string;
  date: string;
  startTime: number;
  duration: number;
  packId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  totalPrice: number;
  status: 'confirmed' | 'pending_verification' | 'cancelled';
  paymentMethod: 'revolut' | 'stripe' | 'bizum' | 'mollie';
  createdAt: number;
}

export type ViewType = 'home' | 'booking' | 'admin';
