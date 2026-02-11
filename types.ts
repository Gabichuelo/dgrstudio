
export interface DaySchedule {
  isOpen: boolean;
  start: number; 
  end: number;   
}

export interface DateOverride {
  id: string;
  date: string; 
  isOpen: boolean;
  start?: number;
  end?: number;
  reason?: string;
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

// Configuración de email opcional/deprecada
export interface EmailConfig {
  smtpHost?: string;
  smtpUser?: string;
  smtpPassword?: string;
  useAppPassword?: boolean;
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

export interface Extra {
  id: string;
  name: string;
  price: number;
  icon: string;
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

export interface BonoPack {
  id: string;
  hours: number;
  discountPercentage: number;
  name: string;
  description: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  isActive: boolean;
}

export interface HourBono {
  id: string;
  code: string;
  customerName: string;
  totalHours: number;
  remainingHours: number;
  isActive: boolean;
}

export interface HomeContent {
  studioName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  bannerTitle: string;
  studioDescription: string;
  adminEmail: string;
  footerText: string;
  footerSecondaryText: string;
  availability: Availability;
  emailConfig?: EmailConfig; // Ahora es opcional
  payments: PaymentConfig;
  extras: Extra[];
  coupons: Coupon[];
  hourBonos: HourBono[];
  bonoPacks: BonoPack[];
  apiUrl: string;
  seasonalDiscount?: number;
}

export interface Booking {
  id: string;
  date: string;
  startTime: number; 
  duration: number;  
  packId: string;
  selectedExtrasIds: string[];
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  totalPrice: number;
  status: 'confirmed' | 'pending_verification' | 'cancelled';
  paymentMethod: 'revolut' | 'stripe' | 'bizum' | 'mollie' | 'bono';
  appliedCouponCode?: string;
  appliedBonoCode?: string;
  createdAt: number;
}

export type ViewType = 'home' | 'booking' | 'admin';
