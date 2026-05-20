import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  BookOpen,
  User,
  Wrench,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  FileText,
  Cookie,
  Languages,
} from 'lucide-react';
import { QuickFixStore } from '../../lib/store';
import { t, LangType } from '../../lib/translations';

interface UserManualProps {
  onAcknowledge: () => void;
  lang: LangType;
  setLang: (lang: LangType) => void;
}

export function UserManual({ onAcknowledge, lang, setLang }: UserManualProps) {
  const [activeTab, setActiveTab] = useState<'customer' | 'worker' | 'admin'>('customer');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedCookies, setAcceptedCookies] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleEnterApp = () => {
    if (acceptedTerms && acceptedCookies) {
      QuickFixStore.setCookieConsent(true);
      QuickFixStore.setManualAcknowledged(true);
      onAcknowledge();
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
    QuickFixStore.setLanguage(nextLang);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4 md:p-8">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <motion.div
          className="absolute w-[700px] h-[700px] rounded-full opacity-35"
          style={{
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.45) 0%, transparent 70%)',
            top: '-10%',
            right: '-5%',
          }}
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
            bottom: '-15%',
            left: '-10%',
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Floating Language Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <motion.button
          onClick={toggleLanguage}
          className="glass-strong px-5 py-3 rounded-2xl flex items-center gap-3 shadow-lg hover:shadow-cyan-500/20 text-slate-800 font-semibold border border-white/60 cursor-pointer icon-3d"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <Languages className="w-5 h-5 text-cyan-600" />
          <span>{lang === 'en' ? 'हिन्दी (Hindi)' : 'English'}</span>
        </motion.button>
      </div>

      {/* Manual Content Card */}
      <motion.div
        className="max-w-4xl w-full glass-strong rounded-3xl p-6 md:p-10 shadow-2xl relative border border-white/80 card-3d"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div style={{ transform: 'translateZ(30px)' }}>
          {/* Brand Logo & Name */}
          <div className="text-center mb-8">
            <motion.div
              className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center mb-4 relative shadow-xl icon-3d floating"
              whileHover={{ rotateY: 180 }}
              transition={{ duration: 0.8 }}
            >
              <Wrench className="w-12 h-12 text-white absolute" style={{ transform: 'rotate(-45deg)' }} />
              <Sparkles className="w-6 h-6 text-yellow-300 absolute top-2 right-2 animate-pulse" />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-cyan-400 to-purple-500 opacity-40 blur-xl -z-10" />
            </motion.div>
            
            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {t('appName', lang)}
            </h1>
            <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest mb-3">
              {t('tagline', lang)}
            </p>
            <div className="h-0.5 w-32 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto rounded-full mb-4" />
            <p className="text-slate-600 max-w-xl mx-auto text-base">
              {t('welcomeMessage', lang)}
            </p>
          </div>

          {/* Interactive User Manual Tabs */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100/60 p-2 rounded-2xl mb-6">
            {[
              { id: 'customer', label: t('customerRole', lang), icon: User, color: 'text-cyan-600 bg-cyan-100/70 border-cyan-200' },
              { id: 'worker', label: t('workerRole', lang), icon: Wrench, color: 'text-purple-600 bg-purple-100/70 border-purple-200' },
              { id: 'admin', label: t('admin', lang), icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-100/70 border-emerald-200' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-3 rounded-xl font-semibold text-sm transition-all border cursor-pointer ${
                    isActive
                      ? `${tab.color} shadow-sm scale-102`
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-center sm:text-left">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Description Cards */}
          <div className="min-h-[220px] bg-white/50 border border-white/60 rounded-2xl p-6 mb-8 relative overflow-hidden">
            {activeTab === 'customer' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-600" />
                  {t('customerManualTitle', lang)}
                </h3>
                <ul className="space-y-2.5">
                  {(t('customerManualSteps', lang) as string[]).map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-700 text-sm">
                      <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-xs">
                        {idx + 1}
                      </div>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {activeTab === 'worker' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-purple-600" />
                  {t('workerManualTitle', lang)}
                </h3>
                <ul className="space-y-2.5">
                  {(t('workerManualSteps', lang) as string[]).map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-700 text-sm">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-xs">
                        {idx + 1}
                      </div>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {activeTab === 'admin' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  {t('adminManualTitle', lang)}
                </h3>
                <ul className="space-y-2.5">
                  {(t('adminManualSteps', lang) as string[]).map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-700 text-sm">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-xs">
                        {idx + 1}
                      </div>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>

          {/* Cookies & Terms Acceptance Boxes */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-slate-100/40 border border-slate-200/50 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                  <Cookie className="w-4 h-4 text-cyan-600" />
                  {t('cookieTitle', lang)}
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                  {t('cookieDesc', lang)}
                </p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptedCookies}
                  onChange={(e) => setAcceptedCookies(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700">
                  {t('acceptCookies', lang)}
                </span>
              </label>
            </div>

            <div className="p-5 rounded-2xl bg-slate-100/40 border border-slate-200/50 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  {t('termsTitle', lang)}
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                  {t('termsDesc', lang)}
                </p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700">
                  {t('acceptTerms', lang)}
                </span>
              </label>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="text-center">
            {showError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 text-sm font-semibold text-red-500 flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Please accept both Cookies & Terms to proceed.</span>
              </motion.div>
            )}

            <motion.button
              onClick={handleEnterApp}
              whileHover={{ scale: 1.05, y: -4, boxShadow: '0 20px 45px rgba(14, 165, 233, 0.45)' }}
              whileTap={{ scale: 0.95 }}
              className={`px-10 py-4.5 rounded-2xl font-bold text-white shadow-xl flex items-center gap-2 mx-auto cursor-pointer transition-all ${
                acceptedCookies && acceptedTerms
                  ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 shadow-cyan-500/25 hover:brightness-105'
                  : 'bg-slate-300 shadow-none text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>{t('enterApp', lang)}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
