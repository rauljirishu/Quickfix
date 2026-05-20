import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Wrench,
  Mail,
  Lock,
  Phone,
  Briefcase,
  Calendar,
  Layers,
  MapPin,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { QuickFixStore, UserRole } from '../../lib/store';
import { t, LangType } from '../../lib/translations';
import { getCurrentGPSLocation, INDIAN_CITIES } from '../../lib/location';

interface AuthScreenProps {
  onLoginSuccess: () => void;
  lang: LangType;
}

export function AuthScreen({ onLoginSuccess, lang }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('customer');
  
  // Fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Worker-specific
  const [skills, setSkills] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [location, setLocation] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const handleGPSDetect = async () => {
    setGpsLoading(true);
    setGpsStatus('idle');
    try {
      const res = await getCurrentGPSLocation();
      setLocation(res.location);
      setGpsStatus('success');
      setTimeout(() => setGpsStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setGpsStatus('error');
      setTimeout(() => setGpsStatus('idle'), 4000);
    } finally {
      setGpsLoading(false);
    }
  };

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isLogin) {
      // Login flow
      if (!email) {
        setErrorMsg('Please enter your email ID');
        return;
      }
      const res = QuickFixStore.login(email);
      if (res.success) {
        setSuccessMsg(t('loginSuccess', lang));
        setTimeout(() => {
          onLoginSuccess();
        }, 1000);
      } else {
        setErrorMsg(res.error || 'Authentication failed');
      }
    } else {
      // Register flow
      if (!name || !age || !phone || !email || !password) {
        setErrorMsg('Please fill in all details');
        return;
      }
      
      const details = {
        name,
        age: Number(age),
        gender,
        phone,
        email,
        role,
        location,
        skills: role === 'worker' ? skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        hourlyRate: role === 'worker' ? Number(hourlyRate) || 200 : 0
      };

      const res = QuickFixStore.signup(details);
      if (res.success) {
        setSuccessMsg(t('registerSuccess', lang));
        setTimeout(() => {
          onLoginSuccess();
        }, 1200);
      } else {
        setErrorMsg(res.error || 'Registration failed');
      }
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
            top: '5%',
            left: '10%',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, transparent 70%)',
            bottom: '10%',
            right: '15%',
          }}
        />
      </div>

      <motion.div
        className="max-w-2xl w-full glass-strong rounded-3xl p-8 md:p-10 shadow-2xl relative border border-white/80 card-3d"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div style={{ transform: 'translateZ(30px)' }}>
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {isLogin ? t('loginHeader', lang) : t('registerHeader', lang)}
            </h2>
            <p className="text-slate-600 font-medium">
              {isLogin ? 'Access your dashboard securely' : 'Join India\'s highest trust worker network'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error and Success alerts */}
            <AnimatePresence mode="popLayout">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-red-100 text-red-700 text-sm font-semibold border border-red-200"
                >
                  {errorMsg}
                </motion.div>
              )}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-green-100 text-green-700 text-sm font-semibold border border-green-200"
                >
                  {successMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login fields */}
            {isLogin ? (
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder={t('emailPlaceholder', lang)}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl glass-strong border-0 focus:ring-2 focus:ring-cyan-500/50 text-slate-900 font-semibold"
                  />
                  <div className="text-xs text-slate-500 mt-1.5 px-2">
                    💡 Hint: Log in as <span className="font-bold text-cyan-600">karan@quickfix.in</span> (Customer demo) or <span className="font-bold text-purple-600">admin@quickfix.in</span> (Admin demo)
                  </div>
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    placeholder={`${t('passwordPlaceholder', lang)} (Any for demo)`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl glass-strong border-0 focus:ring-2 focus:ring-cyan-500/50 text-slate-900 font-semibold"
                  />
                </div>
              </div>
            ) : (
              // SignUp Fields
              <div className="space-y-4">
                {/* Role Switcher */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 px-1">
                    {t('roleLabel', lang)}
                  </label>
                  <div className="grid grid-cols-2 gap-3 bg-slate-100/60 p-1.5 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setRole('customer')}
                      className={`py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all ${
                        role === 'customer'
                          ? 'bg-white shadow text-cyan-600'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>{t('customerRole', lang)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('worker')}
                      className={`py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all ${
                        role === 'worker'
                          ? 'bg-white shadow text-purple-600'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Wrench className="w-4 h-4" />
                      <span>{t('workerRole', lang)}</span>
                    </button>
                  </div>
                </div>

                {/* Core Profile Inputs */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder={t('fullNamePlaceholder', lang)}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-strong border-0 focus:ring-2 focus:ring-cyan-500/50 text-slate-900 font-semibold text-sm"
                    />
                  </div>

                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      required
                      min="18"
                      max="100"
                      placeholder={t('agePlaceholder', lang)}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-strong border-0 focus:ring-2 focus:ring-cyan-500/50 text-slate-900 font-semibold text-sm"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Gender Selector (Graceful spelling matching "zender") */}
                  <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-strong border-0 focus:ring-2 focus:ring-cyan-500/50 text-slate-900 font-semibold text-sm cursor-pointer appearance-none"
                    >
                      <option value="Male">{t('genderMale', lang)}</option>
                      <option value="Female">{t('genderFemale', lang)}</option>
                      <option value="Other">{t('genderOther', lang)}</option>
                    </select>
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder={t('phonePlaceholder', lang)}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-strong border-0 focus:ring-2 focus:ring-cyan-500/50 text-slate-900 font-semibold text-sm"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder={t('emailPlaceholder', lang)}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-strong border-0 focus:ring-2 focus:ring-cyan-500/50 text-slate-900 font-semibold text-sm"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder={t('passwordPlaceholder', lang)}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-strong border-0 focus:ring-2 focus:ring-cyan-500/50 text-slate-900 font-semibold text-sm"
                    />
                  </div>
                </div>

                {/* Custom searchable location autocomplete + GPS button */}
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder={t('locationPlaceholder', lang)}
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value);
                          setShowLocationSuggestions(true);
                        }}
                        onFocus={() => setShowLocationSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-strong border-0 focus:ring-2 focus:ring-cyan-500/50 text-slate-900 font-semibold text-sm"
                      />

                      {/* Search dropdown suggestions */}
                      <AnimatePresence>
                        {showLocationSuggestions && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-xl max-h-56 overflow-y-auto"
                          >
                            {INDIAN_CITIES.filter(
                              (c) =>
                                c.name.toLowerCase().includes(location.toLowerCase()) ||
                                c.state.toLowerCase().includes(location.toLowerCase())
                            )
                              .slice(0, 6)
                              .map((city) => (
                                <button
                                  key={`${city.name}-${city.state}`}
                                  type="button"
                                  onMouseDown={() => {
                                    setLocation(`${city.name}, ${city.state}`);
                                    setShowLocationSuggestions(false);
                                  }}
                                  className="w-full px-4 py-3 text-left font-bold text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-600 border-0 bg-transparent cursor-pointer flex items-center justify-between transition-colors"
                                >
                                  <span>{city.name}</span>
                                  <span className="text-[10px] text-slate-400 font-medium">{city.state}</span>
                                </button>
                              ))}
                            {INDIAN_CITIES.filter(
                              (c) =>
                                c.name.toLowerCase().includes(location.toLowerCase()) ||
                                c.state.toLowerCase().includes(location.toLowerCase())
                            ).length === 0 && (
                              <div className="p-4 text-xs font-semibold text-slate-500 text-center">
                                Custom location will be saved
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Geolocation Button */}
                    <button
                      type="button"
                      onClick={handleGPSDetect}
                      disabled={gpsLoading}
                      className={`px-4 rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all border duration-300 shadow-sm ${
                        gpsStatus === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : gpsStatus === 'error'
                          ? 'bg-red-50 border-red-200 text-red-600'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <MapPin className={`w-4 h-4 ${gpsLoading ? 'animate-bounce text-cyan-600' : ''}`} />
                      <span className="hidden sm:inline">
                        {gpsLoading
                          ? t('gpsDetecting', lang)
                          : gpsStatus === 'success'
                          ? t('gpsSuccess', lang)
                          : gpsStatus === 'error'
                          ? t('gpsError', lang)
                          : t('useGPS', lang)}
                      </span>
                      <span className="sm:hidden">
                        {gpsLoading ? '...' : gpsStatus === 'success' ? '✓' : gpsStatus === 'error' ? '✗' : 'GPS'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Worker Specific Skill Fields */}
                {role === 'worker' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-2 border-t border-slate-200/50"
                  >
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                      <input
                        type="text"
                        placeholder={t('skillsLabel', lang)}
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-strong border-0 focus:ring-2 focus:ring-purple-500/50 text-slate-900 font-semibold text-sm"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-purple-600">₹</div>
                      <input
                        type="number"
                        placeholder={t('hourlyRateLabel', lang)}
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-strong border-0 focus:ring-2 focus:ring-purple-500/50 text-slate-900 font-semibold text-sm"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03, y: -2, boxShadow: '0 20px 40px rgba(139, 92, 246, 0.25)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer border-0 mt-4"
            >
              <span>{isLogin ? t('signInBtn', lang) : t('signUpBtn', lang)}</span>
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </form>

          {/* Footer switcher */}
          <div className="text-center mt-6">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-sm font-bold text-cyan-600 hover:text-cyan-800 transition-colors cursor-pointer bg-transparent border-0"
            >
              {isLogin ? t('dontHaveAccount', lang) : t('alreadyHaveAccount', lang)}{' '}
              <span className="underline ml-1">
                {isLogin ? t('signUpBtn', lang) : t('signInBtn', lang)}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
