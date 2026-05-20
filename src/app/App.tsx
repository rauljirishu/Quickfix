import { useState, useEffect } from 'react';
import { UserManual } from './components/UserManual';
import { AuthScreen } from './components/AuthScreen';
import { CustomerDashboard } from './components/CustomerDashboard';
import { WorkerDashboard } from './components/WorkerDashboard';
import { AdminPanel } from './components/AdminPanel';
import { QuickFixStore, UserProfile } from '../lib/store';
import { LangType } from '../lib/translations';
import { motion } from 'motion/react';
import { Languages, Wrench, Sparkles, LogOut, UserCheck } from 'lucide-react';

export default function App() {
  const [manualAcknowledged, setManualAcknowledged] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [lang, setLang] = useState<LangType>('en');
  const [refreshSeed, setRefreshSeed] = useState(0);

  // Sync state initially
  useEffect(() => {
    setManualAcknowledged(QuickFixStore.getManualAcknowledged());
    setCurrentUser(QuickFixStore.getCurrentUser());
    setLang(QuickFixStore.getLanguage());
  }, [refreshSeed]);

  // Set up store reactive listener subscription
  useEffect(() => {
    const unsubscribe = QuickFixStore.subscribeToStore(() => {
      setRefreshSeed((prev) => prev + 1);
    });
    return unsubscribe;
  }, []);

  const handleManualAck = () => {
    setManualAcknowledged(true);
  };

  const handleLoginSuccess = () => {
    setCurrentUser(QuickFixStore.getCurrentUser());
  };

  const toggleLanguageGlobal = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
    QuickFixStore.setLanguage(nextLang);
  };

  // 1. Force Introductory User Manual as first page
  if (!manualAcknowledged) {
    return (
      <div className="min-h-screen bg-slate-50">
        <UserManual
          onAcknowledge={handleManualAck}
          lang={lang}
          setLang={setLang}
        />
      </div>
    );
  }

  // 2. Force Authentication sheet if no active user session
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 relative">
        {/* Simple floating language toggle on auth page */}
        <div className="absolute top-6 right-6 z-50">
          <button
            onClick={toggleLanguageGlobal}
            className="glass-strong px-4 py-2.5 rounded-xl flex items-center gap-2 shadow text-xs font-bold text-slate-800 border cursor-pointer icon-3d"
          >
            <Languages className="w-4 h-4 text-cyan-600" />
            <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>
        </div>
        
        <AuthScreen
          onLoginSuccess={handleLoginSuccess}
          lang={lang}
        />
      </div>
    );
  }

  // 3. Render Dashboard based on logged-in role
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Universal Floating Header for Logged-In Users */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4.5 flex items-center justify-between shadow-sm">
        
        {/* Premium Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow icon-3d">
            <Wrench className="w-5 h-5 text-white" style={{ transform: 'rotate(-45deg)' }} />
          </div>
          <div>
            <h1 className="text-xl font-black bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
              QuickFix
            </h1>
            <span className="text-[9px] font-bold text-slate-400 block tracking-widest leading-none mt-0.5">
              INDIA MARKETPLACE
            </span>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-4">
          
          {/* Floating Language Toggler */}
          <button
            onClick={toggleLanguageGlobal}
            className="glass-strong px-3 py-2 rounded-xl flex items-center gap-2 shadow-sm text-xs font-bold text-slate-800 border border-slate-200/40 cursor-pointer icon-3d"
          >
            <Languages className="w-3.5 h-3.5 text-cyan-600" />
            <span>{lang === 'en' ? 'हिन्दी (Hindi)' : 'English'}</span>
          </button>

          {/* User Profile Quick tag */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/20">
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">{currentUser.name}</span>
          </div>

          {/* Quick manual overlay link */}
          <button
            onClick={() => {
              QuickFixStore.setManualAcknowledged(false);
              setManualAcknowledged(false);
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer bg-transparent border-0"
          >
            User Guide
          </button>
        </div>
      </header>

      {/* Main dashboard screens */}
      <main className="flex-1 flex flex-col">
        {currentUser.role === 'customer' && (
          <CustomerDashboard lang={lang} />
        )}
        
        {currentUser.role === 'worker' && (
          <WorkerDashboard lang={lang} />
        )}

        {currentUser.role === 'admin' && (
          <AdminPanel lang={lang} />
        )}
      </main>
    </div>
  );
}