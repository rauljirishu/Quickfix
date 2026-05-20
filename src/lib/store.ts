// QuickFix Local-First Reactive State Store
// Backed by LocalStorage & Cookies with seamless data binding

import { dijkstraShortestPath } from './location';

export type UserRole = 'customer' | 'worker' | 'admin';

export interface ServicePackage {
  name: string; // "Basic" | "Standard" | "Premium"
  price: number;
  description: string;
  duration: string; // e.g. "2 hours", "1 day"
  features: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  role: UserRole;
  avatar: string;
  skills: string[];
  description: string;
  location: string;
  experience: number;
  verified: boolean;
  availability: boolean;
  hourlyRate: number;
  rating: number;
  reviewsCount: number;
  packages?: {
    basic: ServicePackage;
    standard: ServicePackage;
    premium: ServicePackage;
  };
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  workerId: string;
  workerName: string;
  category: string;
  packageName: 'Basic' | 'Standard' | 'Premium';
  amount: number;
  date: string;
  time: string;
  location: string;
  description: string;
  status: 'pending' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string; // Can be workerId, customerId, or "admin"
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Review {
  id: string;
  workerId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  date: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

// Cookie Helper Utilities (App Cookies requirement)
export const getCookie = (name: string): string => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() ?? '';
  return '';
};

export const setCookie = (name: string, value: string, days = 7) => {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// Listeners collection for lightweight reactive state
type ListenerFn = () => void;
const listeners = new Set<ListenerFn>();

export const subscribeToStore = (listener: ListenerFn) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyStoreChange = () => {
  listeners.forEach((fn) => fn());
};

// Initial Seed Data
const defaultCategories = [
  { id: 'plumbing', name: 'Plumbing', icon: 'Wrench', description: 'Leaking taps, pipes, bathroom fittings' },
  { id: 'electrical', name: 'Electrical', icon: 'Zap', description: 'Wiring, switches, lighting & repairs' },
  { id: 'carpentry', name: 'Carpentry', icon: 'Hammer', description: 'Furniture repair, door fittings, shelves' },
  { id: 'painting', name: 'Painting', icon: 'Paintbrush', description: 'Wall painting, textures, wall waterproofing' },
  { id: 'cleaning', name: 'Cleaning', icon: 'Sparkles', description: 'Deep house cleaning, kitchen & bathroom deep sanitization' },
];

const seedWorkers: UserProfile[] = [
  {
    id: 'worker-1',
    name: 'Rajesh Kumar',
    age: 34,
    gender: 'Male',
    phone: '+91 98765 43210',
    email: 'rajesh@quickfix.in',
    role: 'worker',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh',
    skills: ['Pipe Repair', 'Bathroom Fitting', 'Water Heater'],
    description: 'Expert plumber with 8 years of experience. Specialized in residential and commercial plumbing repairs.',
    location: 'Mumbai',
    experience: 8,
    verified: true,
    availability: true,
    hourlyRate: 350,
    rating: 4.8,
    reviewsCount: 156,
    packages: {
      basic: { name: 'Basic', price: 500, description: 'Minor tap leakage repair & cleaning', duration: '1 Hour', features: ['Tap inspection', 'Thread sealing', 'Single tap fix'] },
      standard: { name: 'Standard', price: 1200, description: 'Kitchen sink pipe clog & leak repair', duration: '2 Hours', features: ['Pipe replacement', 'Sealant application', 'Under-sink inspection'] },
      premium: { name: 'Premium', price: 3500, description: 'Complete bathroom sanitary fitting overhaul', duration: '1 Day', features: ['Shower installation', 'Commode fixture repair', 'Grouting lines check', '30-day warranty'] },
    }
  },
  {
    id: 'worker-2',
    name: 'Amit Sharma',
    age: 41,
    gender: 'Male',
    phone: '+91 98765 43211',
    email: 'amit@quickfix.in',
    role: 'worker',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit',
    skills: ['Wiring', 'Panel Installation', 'Lighting'],
    description: 'Licensed electrician with extensive expertise in residential house electrical wiring and industrial panels.',
    location: 'Delhi NCR',
    experience: 12,
    verified: true,
    availability: true,
    hourlyRate: 400,
    rating: 4.9,
    reviewsCount: 203,
    packages: {
      basic: { name: 'Basic', price: 400, description: 'Switchboard installation & bulb sockets', duration: '1 Hour', features: ['Switch replacement', 'Voltage testing', 'Socket replacement'] },
      standard: { name: 'Standard', price: 1500, description: 'Inverter connection & home circuit check', duration: '3 Hours', features: ['Inverter wiring', 'Fuse box check', 'Short-circuit fixing'] },
      premium: { name: 'Premium', price: 4500, description: 'Complete flat modular wiring overhaul', duration: '2 Days', features: ['Modular switches layout', 'Concealed wiring install', 'MCB safety checks'] },
    }
  },
  {
    id: 'worker-3',
    name: 'Suresh Patel',
    age: 29,
    gender: 'Male',
    phone: '+91 98765 43212',
    email: 'suresh@quickfix.in',
    role: 'worker',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh',
    skills: ['Furniture Making', 'Door Repair', 'Custom Carpentry'],
    description: 'Skilled furniture craftsman specializing in modern engineered wood wardrobes, cabinets, and kitchen carpentry.',
    location: 'Bangalore',
    experience: 6,
    verified: true,
    availability: true,
    hourlyRate: 320,
    rating: 4.7,
    reviewsCount: 89,
    packages: {
      basic: { name: 'Basic', price: 600, description: 'Door alignment and lock installation', duration: '2 Hours', features: ['Hinge tightening', 'Lock lubrication', 'Handle replacement'] },
      standard: { name: 'Standard', price: 1800, description: 'Wardrobe hinges & drawer channel repair', duration: '4 Hours', features: ['Channel sliding setup', 'Plywood strength check', 'Hinge replacement'] },
      premium: { name: 'Premium', price: 6000, description: 'Custom modular TV console assembly', duration: '1 Day', features: ['Engineered wood assembly', 'Wall mounting', 'Wire cutouts', 'Level calibration'] },
    }
  },
  {
    id: 'worker-4',
    name: 'Priya Desai',
    age: 26,
    gender: 'Female',
    phone: '+91 98765 43214',
    email: 'priya@quickfix.in',
    role: 'worker',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    skills: ['Deep Cleaning', 'Office Cleaning', 'Sanitization'],
    description: 'Professional cleaning manager. Uses eco-friendly high-grade products for deep sanitization and dusting.',
    location: 'Mumbai',
    experience: 5,
    verified: true,
    availability: true,
    hourlyRate: 250,
    rating: 5.0,
    reviewsCount: 287,
    packages: {
      basic: { name: 'Basic', price: 999, description: '1 BHK standard kitchen & bathroom dusting', duration: '3 Hours', features: ['Floor scrubbing', 'Counter dusting', 'Toilet sanitizing'] },
      standard: { name: 'Standard', price: 2499, description: '2 BHK complete deep cleaning & vacuuming', duration: '6 Hours', features: ['Window cleaning', 'Balcony wash', 'Upholstery vacuum', 'Tile polishing'] },
      premium: { name: 'Premium', price: 4999, description: '3 BHK complete sanitization + sofa dry clean', duration: '1 Day', features: ['Sofa steam clean', 'Carpet shampooing', 'Deep grease removal', 'Eco-friendly scent spray'] },
    }
  }
];

const defaultReviews: Review[] = [
  { id: 'rev-1', workerId: 'worker-1', customerName: 'Anjali Verma', rating: 5, comment: 'Very professional. Fixed the kitchen leak under 20 minutes!', date: '2026-05-18' },
  { id: 'rev-2', workerId: 'worker-1', customerName: 'Rahul Mehta', rating: 4, comment: 'Good quality fittings, arrived slightly late but completed well.', date: '2026-05-16' },
  { id: 'rev-3', workerId: 'worker-2', customerName: 'Sneha Kapoor', rating: 5, comment: 'Amit knows his circuits. Outstanding lighting layout work.', date: '2026-05-19' },
];

const defaultBookings: Booking[] = [
  {
    id: 'b-1',
    customerId: 'cust-demo',
    customerName: 'Karan Malhotra',
    customerPhone: '+91 99999 88888',
    workerId: 'worker-1',
    workerName: 'Rajesh Kumar',
    category: 'plumbing',
    packageName: 'Standard',
    amount: 1200,
    date: '2026-05-20',
    time: '10:00 AM',
    location: 'Andheri West, Mumbai',
    description: 'Kitchen sink pipe replacement and sealant layout.',
    status: 'pending',
    paymentStatus: 'unpaid'
  },
  {
    id: 'b-2',
    customerId: 'cust-demo',
    customerName: 'Karan Malhotra',
    customerPhone: '+91 99999 88888',
    workerId: 'worker-2',
    workerName: 'Amit Sharma',
    category: 'electrical',
    packageName: 'Basic',
    amount: 400,
    date: '2026-05-21',
    time: '02:00 PM',
    location: 'Connaught Place, Delhi',
    description: 'Fixing double modular switches in the living room.',
    status: 'accepted',
    paymentStatus: 'paid'
  }
];

const defaultChats: ChatMessage[] = [
  { id: 'msg-1', senderId: 'cust-demo', receiverId: 'worker-1', text: 'Hi Rajesh, are you available around 10 AM?', timestamp: '2026-05-20T09:00:00.000Z', read: true },
  { id: 'msg-2', senderId: 'worker-1', receiverId: 'cust-demo', text: 'Yes Karan, I have accepted your request. See you soon!', timestamp: '2026-05-20T09:05:00.000Z', read: true },
  { id: 'msg-3', senderId: 'cust-demo', receiverId: 'admin', text: 'Hi, I need support with my wallet payment confirmation.', timestamp: '2026-05-19T14:00:00.000Z', read: true },
  { id: 'msg-4', senderId: 'admin', receiverId: 'cust-demo', text: 'Hello Karan! Your transaction was approved. Let us know if you need anything else.', timestamp: '2026-05-19T14:10:00.000Z', read: true },
];

const defaultWalletTransactions: WalletTransaction[] = [
  { id: 't-1', userId: 'cust-demo', amount: 5000, type: 'credit', description: 'Added money using UPI Gateway', date: '2026-05-19T10:00:00.000Z' },
  { id: 't-2', userId: 'cust-demo', amount: 400, type: 'debit', description: 'Paid Amit Sharma for Booking #b-2', date: '2026-05-21T14:30:00.000Z' },
  { id: 't-3', userId: 'worker-2', amount: 400, type: 'credit', description: 'Received payment for Booking #b-2', date: '2026-05-21T14:30:00.000Z' },
];

// Helper to access LocalStorage with fallback
const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
};

// Central Store Manager Singleton
export const QuickFixStore = {
  subscribeToStore: (listener: ListenerFn) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  // Getters
  getLanguage: (): 'en' | 'hi' => {
    return getStorageItem<'en' | 'hi'>('qf_lang', 'en');
  },

  setLanguage: (lang: 'en' | 'hi') => {
    setStorageItem('qf_lang', lang);
    notifyStoreChange();
  },

  getCookieConsent: (): boolean => {
    return getCookie('qf_cookie_consent') === 'true';
  },

  setCookieConsent: (consent: boolean) => {
    setCookie('qf_cookie_consent', String(consent), 30);
    notifyStoreChange();
  },

  getManualAcknowledged: (): boolean => {
    return getStorageItem('qf_manual_ack', false);
  },

  setManualAcknowledged: (ack: boolean) => {
    setStorageItem('qf_manual_ack', ack);
    notifyStoreChange();
  },

  // Auth Operations
  getCurrentUser: (): UserProfile | null => {
    const session = getCookie('qf_session_user');
    if (!session) return null;
    const users = QuickFixStore.getAllUsers();
    return users.find((u) => u.id === session) || null;
  },

  getAllUsers: (): UserProfile[] => {
    const localUsers = getStorageItem<UserProfile[]>('qf_users', []);
    // Concat seed workers if they aren't already registered
    const all = [...localUsers];
    seedWorkers.forEach((w) => {
      if (!all.some((x) => x.id === w.id)) {
        all.push(w);
      }
    });
    return all;
  },

  signup: (details: {
    name: string;
    age: number;
    gender: string;
    phone: string;
    email: string;
    role: UserRole;
    skills?: string[];
    hourlyRate?: number;
    location: string;
  }): { success: boolean; error?: string; user?: UserProfile } => {
    const users = QuickFixStore.getAllUsers();
    
    if (users.some((u) => u.email.toLowerCase() === details.email.toLowerCase())) {
      return { success: false, error: 'Email ID already registered' };
    }

    const newId = `user-${Date.now()}`;
    const newProfile: UserProfile = {
      id: newId,
      name: details.name,
      age: Number(details.age),
      gender: details.gender,
      phone: details.phone,
      email: details.email,
      role: details.role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${details.name.replace(/\s+/g, '')}`,
      skills: details.skills || [],
      description: details.role === 'worker' ? 'Skilled professional ready to offer services.' : 'QuickFix customer.',
      location: details.location,
      experience: details.role === 'worker' ? 1 : 0,
      verified: details.role === 'worker' ? false : true,
      availability: true,
      hourlyRate: details.hourlyRate || 200,
      rating: details.role === 'worker' ? 5.0 : 0,
      reviewsCount: 0,
      packages: details.role === 'worker' ? {
        basic: { name: 'Basic', price: 300, description: 'Basic checkup and quick repair service', duration: '1 Hour', features: ['Consultation', 'Minor tightening', 'Diagnose fault'] },
        standard: { name: 'Standard', price: 900, description: 'Detailed repair and parts assembly', duration: '3 Hours', features: ['Full diagnostics', 'Fault repair', 'Replacement assistance'] },
        premium: { name: 'Premium', price: 2500, description: 'Full installation, service warrant, priority support', duration: '1 Day', features: ['Complete assembly', 'System configuration', 'Clean up after work', '30-day warranty'] }
      } : undefined
    };

    const localUsers = getStorageItem<UserProfile[]>('qf_users', []);
    localUsers.push(newProfile);
    setStorageItem('qf_users', localUsers);

    // Initialize clean wallet balance
    QuickFixStore.updateWalletBalance(newId, 0);

    // Auto sign in
    setCookie('qf_session_user', newId, 7);
    
    // Add Welcome Notification
    QuickFixStore.addNotification(
      newId,
      'Welcome to QuickFix!',
      `Dear ${details.name}, thank you for registering as a ${details.role}. Your account is fully active.`
    );

    notifyStoreChange();
    return { success: true, user: newProfile };
  },

  login: (email: string): { success: boolean; error?: string; user?: UserProfile } => {
    // Treat as passwordless high-fidelity demo
    const users = QuickFixStore.getAllUsers();
    
    // Create demo customer account if entering as KARAN (mock seed customer)
    let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user && email.toLowerCase() === 'karan@quickfix.in') {
      const karan = {
        id: 'cust-demo',
        name: 'Karan Malhotra',
        age: 28,
        gender: 'Male',
        phone: '+91 99999 88888',
        email: 'karan@quickfix.in',
        role: 'customer' as const,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karan',
        skills: [],
        description: 'Premium customer in Mumbai.',
        location: 'Mumbai',
        experience: 0,
        verified: true,
        availability: true,
        hourlyRate: 0,
        rating: 0,
        reviewsCount: 0
      };
      const localUsers = getStorageItem<UserProfile[]>('qf_users', []);
      localUsers.push(karan);
      setStorageItem('qf_users', localUsers);
      QuickFixStore.updateWalletBalance('cust-demo', 4500); // give mock user wallet cash
      user = karan;
    }

    if (!user && email.toLowerCase() === 'admin@quickfix.in') {
      const admin = {
        id: 'admin',
        name: 'QuickFix Admin',
        age: 35,
        gender: 'Male',
        phone: '+91 90000 12345',
        email: 'admin@quickfix.in',
        role: 'admin' as const,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        skills: [],
        description: 'QuickFix Super Administrator',
        location: 'Mumbai',
        experience: 10,
        verified: true,
        availability: true,
        hourlyRate: 0,
        rating: 5,
        reviewsCount: 0
      };
      const localUsers = getStorageItem<UserProfile[]>('qf_users', []);
      localUsers.push(admin);
      setStorageItem('qf_users', localUsers);
      user = admin;
    }

    if (!user) {
      return { success: false, error: 'Email ID not found. Please Sign Up first.' };
    }

    setCookie('qf_session_user', user.id, 7);
    notifyStoreChange();
    return { success: true, user };
  },

  logout: () => {
    deleteCookie('qf_session_user');
    notifyStoreChange();
  },

  updateUserProfile: (userId: string, updates: Partial<UserProfile>) => {
    const localUsers = getStorageItem<UserProfile[]>('qf_users', []);
    const userIndex = localUsers.findIndex((u) => u.id === userId);
    
    if (userIndex !== -1) {
      localUsers[userIndex] = { ...localUsers[userIndex], ...updates };
      setStorageItem('qf_users', localUsers);
    } else {
      // It might be a seed worker that needs to be copied to local store first
      const seed = seedWorkers.find((w) => w.id === userId);
      if (seed) {
        localUsers.push({ ...seed, ...updates });
        setStorageItem('qf_users', localUsers);
      }
    }
    notifyStoreChange();
  },

  updateWorkerPackages: (userId: string, packages: UserProfile['packages']) => {
    QuickFixStore.updateUserProfile(userId, { packages });
  },

  // Service Categories
  getCategories: () => {
    return getStorageItem('qf_categories', defaultCategories);
  },

  addCategory: (name: string, description: string) => {
    const cats = QuickFixStore.getCategories();
    const newId = name.toLowerCase().replace(/\s+/g, '-');
    if (cats.some((c) => c.id === newId)) return;
    cats.push({ id: newId, name, icon: 'Briefcase', description });
    setStorageItem('qf_categories', cats);
    notifyStoreChange();
  },

  // Booking Engine
  getBookings: (): Booking[] => {
    return getStorageItem<Booking[]>('qf_bookings', defaultBookings);
  },

  createBooking: (bookingData: Omit<Booking, 'id' | 'status' | 'paymentStatus'>): Booking => {
    const bookings = QuickFixStore.getBookings();
    const newBooking: Booking = {
      ...bookingData,
      id: `b-${Date.now()}`,
      status: 'pending',
      paymentStatus: 'unpaid'
    };
    bookings.push(newBooking);
    setStorageItem('qf_bookings', bookings);

    // Notify Worker
    QuickFixStore.addNotification(
      bookingData.workerId,
      'New Service Booking Request!',
      `Customer ${bookingData.customerName} has requested a ${bookingData.packageName} package for ${bookingData.date} at ${bookingData.time}.`
    );

    notifyStoreChange();
    return newBooking;
  },

  updateBookingStatus: (bookingId: string, status: Booking['status']) => {
    const bookings = QuickFixStore.getBookings();
    const bIndex = bookings.findIndex((b) => b.id === bookingId);
    if (bIndex !== -1) {
      const b = bookings[bIndex];
      bookings[bIndex].status = status;
      setStorageItem('qf_bookings', bookings);

      // Notify customer
      QuickFixStore.addNotification(
        b.customerId,
        `Booking ${status.toUpperCase()}!`,
        `Worker ${b.workerName} has marked your booking as ${status}.`
      );

      // Trigger automatic payroll transfer on completion if already paid
      if (status === 'completed' && b.paymentStatus === 'paid') {
        // Transfer cash from system holding to worker wallet
        QuickFixStore.creditWallet(b.workerId, b.amount, `Earnings for completed Booking ID ${b.id}`);
        QuickFixStore.addNotification(
          b.workerId,
          'Payment Credited!',
          `₹${b.amount} has been credited to your wallet for completing Booking ID ${b.id}.`
        );
      }

      notifyStoreChange();
    }
  },

  payForBooking: (bookingId: string): { success: boolean; error?: string } => {
    const bookings = QuickFixStore.getBookings();
    const bIndex = bookings.findIndex((b) => b.id === bookingId);
    if (bIndex === -1) return { success: false, error: 'Booking not found' };

    const b = bookings[bIndex];
    if (b.paymentStatus === 'paid') return { success: false, error: 'Already paid' };

    const walletBalance = QuickFixStore.getWalletBalance(b.customerId);
    if (walletBalance < b.amount) {
      return { success: false, error: 'Insufficient wallet balance. Please add money to your wallet first!' };
    }

    // Debit customer
    QuickFixStore.debitWallet(b.customerId, b.amount, `Paid for Booking ID ${b.id} with ${b.workerName}`);
    
    // Update booking payment status
    bookings[bIndex].paymentStatus = 'paid';
    setStorageItem('qf_bookings', bookings);

    // If job is already marked completed, transfer money instantly
    if (b.status === 'completed') {
      QuickFixStore.creditWallet(b.workerId, b.amount, `Earnings for completed Booking ID ${b.id}`);
      QuickFixStore.addNotification(
        b.workerId,
        'Payment Credited!',
        `₹${b.amount} has been credited to your wallet for completing Booking ID ${b.id}.`
      );
    } else {
      // Admin escrow notification
      QuickFixStore.addNotification(
        b.workerId,
        'Payment Secured in Escrow!',
        `Customer paid ₹${b.amount} for Booking ID ${b.id}. Money will be released to your wallet once job is completed.`
      );
    }

    notifyStoreChange();
    return { success: true };
  },

  // Ratings & Reviews
  getReviews: (workerId?: string): Review[] => {
    const reviews = getStorageItem<Review[]>('qf_reviews', defaultReviews);
    if (workerId) {
      return reviews.filter((r) => r.workerId === workerId);
    }
    return reviews;
  },

  addReview: (workerId: string, customerName: string, rating: number, comment: string) => {
    const reviews = QuickFixStore.getReviews();
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      workerId,
      customerName,
      rating,
      comment,
      date: new Date().toISOString().split('T')[0]
    };
    reviews.push(newReview);
    setStorageItem('qf_reviews', reviews);

    // Update worker rating
    const workerReviews = reviews.filter((r) => r.workerId === workerId);
    const avgRating = Number((workerReviews.reduce((sum, r) => sum + r.rating, 0) / workerReviews.length).toFixed(1));
    QuickFixStore.updateUserProfile(workerId, {
      rating: avgRating,
      reviewsCount: workerReviews.length
    });

    // Notify Worker
    QuickFixStore.addNotification(
      workerId,
      'New Customer Review!',
      `${customerName} rated you ${rating}★: "${comment.substring(0, 40)}..."`
    );

    notifyStoreChange();
  },

  // Real-time Chat
  getMessages: (userA: string, userB: string): ChatMessage[] => {
    const allMsgs = getStorageItem<ChatMessage[]>('qf_chats', defaultChats);
    return allMsgs.filter(
      (m) =>
        (m.senderId === userA && m.receiverId === userB) ||
        (m.senderId === userB && m.receiverId === userA)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  sendMessage: (senderId: string, receiverId: string, text: string) => {
    const allMsgs = getStorageItem<ChatMessage[]>('qf_chats', defaultChats);
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId,
      receiverId,
      text,
      timestamp: new Date().toISOString(),
      read: false
    };
    allMsgs.push(newMsg);
    setStorageItem('qf_chats', allMsgs);

    // Trigger local audio alert or micro notification if needed
    notifyStoreChange();
    return newMsg;
  },

  // Support messages (User A <-> Admin)
  getAdminMessages: (userId: string): ChatMessage[] => {
    return QuickFixStore.getMessages(userId, 'admin');
  },

  sendAdminMessage: (senderId: string, text: string) => {
    return QuickFixStore.sendMessage(senderId, 'admin', text);
  },

  // Wallet Management
  getWalletBalance: (userId: string): number => {
    const wallets = getStorageItem<Record<string, number>>('qf_wallets', {
      'cust-demo': 4500,
      'worker-1': 14800,
      'worker-2': 18600,
      'worker-3': 6400,
      'worker-4': 5480,
    });
    return wallets[userId] || 0;
  },

  updateWalletBalance: (userId: string, newBalance: number) => {
    const wallets = getStorageItem<Record<string, number>>('qf_wallets', {
      'cust-demo': 4500,
      'worker-1': 14800,
      'worker-2': 18600,
      'worker-3': 6400,
      'worker-4': 5480,
    });
    wallets[userId] = newBalance;
    setStorageItem('qf_wallets', wallets);
    notifyStoreChange();
  },

  creditWallet: (userId: string, amount: number, description: string) => {
    const current = QuickFixStore.getWalletBalance(userId);
    QuickFixStore.updateWalletBalance(userId, current + amount);
    
    // Log Transaction
    const txs = getStorageItem<WalletTransaction[]>('qf_transactions', defaultWalletTransactions);
    txs.push({
      id: `tx-${Date.now()}`,
      userId,
      amount,
      type: 'credit',
      description,
      date: new Date().toISOString()
    });
    setStorageItem('qf_transactions', txs);
    notifyStoreChange();
  },

  debitWallet: (userId: string, amount: number, description: string) => {
    const current = QuickFixStore.getWalletBalance(userId);
    QuickFixStore.updateWalletBalance(userId, Math.max(0, current - amount));

    // Log Transaction
    const txs = getStorageItem<WalletTransaction[]>('qf_transactions', defaultWalletTransactions);
    txs.push({
      id: `tx-${Date.now()}`,
      userId,
      amount,
      type: 'debit',
      description,
      date: new Date().toISOString()
    });
    setStorageItem('qf_transactions', txs);
    notifyStoreChange();
  },

  getTransactions: (userId: string): WalletTransaction[] => {
    const txs = getStorageItem<WalletTransaction[]>('qf_transactions', defaultWalletTransactions);
    return txs.filter((t) => t.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  // Notifications
  getNotifications: (userId: string): Notification[] => {
    const notifs = getStorageItem<Notification[]>('qf_notifications', [
      { id: 'n-1', userId: 'cust-demo', title: 'Payment Confirmed', message: 'Your wallet has been credited with ₹5000 successfully.', date: '2026-05-19T10:01:00.000Z', read: true },
      { id: 'n-2', userId: 'cust-demo', title: 'Welcome Back!', message: 'Explore local plumbers, painters, and sanitizers instantly.', date: '2026-05-20T08:00:00.000Z', read: false },
    ]);
    return notifs.filter((n) => n.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addNotification: (userId: string, title: string, message: string) => {
    const notifs = getStorageItem<Notification[]>('qf_notifications', []);
    notifs.push({
      id: `n-${Date.now()}`,
      userId,
      title,
      message,
      date: new Date().toISOString(),
      read: false
    });
    setStorageItem('qf_notifications', notifs);
    notifyStoreChange();
  },

  markNotificationsAsRead: (userId: string) => {
    const notifs = getStorageItem<Notification[]>('qf_notifications', []);
    const updated = notifs.map((n) => n.userId === userId ? { ...n, read: true } : n);
    setStorageItem('qf_notifications', updated);
    notifyStoreChange();
  },

  // AI Service Recommendations Heuristic using Dijkstra road network distance
  getAIRecommendations: (customerId: string): UserProfile[] => {
    const user = QuickFixStore.getAllUsers().find((u) => u.id === customerId);
    const userLoc = user?.location || 'Mumbai';
    
    // Fetch all active/available workers
    const workers = QuickFixStore.getAllUsers().filter((u) => u.role === 'worker' && u.availability);
    
    // Map workers with Dijkstra path routing metrics
    const workersWithDistance = workers.map((w) => {
      const routeResult = dijkstraShortestPath(userLoc, w.location);
      return {
        worker: w,
        distance: routeResult.distance,
        routeResult
      };
    });

    // Sort: Verified workers first, then by shortest road distance, then by highest ratings
    workersWithDistance.sort((a, b) => {
      // 1. Verified status
      if (a.worker.verified && !b.worker.verified) return -1;
      if (!a.worker.verified && b.worker.verified) return 1;
      
      // 2. Shortest highway routing distance
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      
      // 3. Rating descent
      if (b.worker.rating !== a.worker.rating) {
        return b.worker.rating - a.worker.rating;
      }
      
      // 4. Review count descent
      return b.worker.reviewsCount - a.worker.reviewsCount;
    });

    // Return the top 3 best-suited local/regional professionals
    return workersWithDistance.map((wd) => wd.worker).slice(0, 3);
  }
};
