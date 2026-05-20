import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Star,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Power,
  MapPin,
  Phone,
  Zap,
  Award,
  Activity,
  User,
  Sliders,
  Wallet,
  MessageSquare,
  Send,
  Upload,
  Layers,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { QuickFixStore, UserProfile, Booking, ChatMessage } from '../../lib/store';
import { t, LangType } from '../../lib/translations';
import { getCurrentGPSLocation, INDIAN_CITIES } from '../../lib/location';

interface WorkerDashboardProps {
  onBack?: () => void; // Optional if navigated via App.tsx routing
  lang: LangType;
}

export function WorkerDashboard({ onBack, lang }: WorkerDashboardProps) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'packages' | 'profile' | 'wallet' | 'chat'>('requests');
  
  // Profile settings
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('Mumbai');
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
  const [experience, setExperience] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');

  // Packages settings
  const [basicPrice, setBasicPrice] = useState('');
  const [basicDesc, setBasicDesc] = useState('');
  const [basicDur, setBasicDur] = useState('');
  
  const [standardPrice, setStandardPrice] = useState('');
  const [standardDesc, setStandardDesc] = useState('');
  const [standardDur, setStandardDur] = useState('');

  const [premiumPrice, setPremiumPrice] = useState('');
  const [premiumDesc, setPremiumDesc] = useState('');
  const [premiumDur, setPremiumDur] = useState('');

  // Chat settings
  const [chatWithId, setChatWithId] = useState<string | null>(null);
  const [chatWithName, setChatWithName] = useState('');
  const [chatMessageText, setChatMessageText] = useState('');

  // Payout withdrawal
  const [withdrawAmt, setWithdrawAmt] = useState('');

  // Reactive state hook trigger
  const [refreshSeed, setRefreshSeed] = useState(0);

  useEffect(() => {
    const user = QuickFixStore.getCurrentUser();
    if (user && user.role === 'worker') {
      setCurrentUser(user);
      
      // Initialize profile fields
      setName(user.name);
      setDescription(user.description);
      setHourlyRate(String(user.hourlyRate));
      setSkills(user.skills.join(', '));
      setLocation(user.location);
      setExperience(String(user.experience));
      setAvatarPreview(user.avatar);

      // Initialize customizable packages fields
      const p = user.packages || {
        basic: { name: 'Basic', price: 300, description: 'Basic checkup service', duration: '1 Hour', features: [] },
        standard: { name: 'Standard', price: 900, description: 'Standard detailed repair', duration: '3 Hours', features: [] },
        premium: { name: 'Premium', price: 2500, description: 'Complete installation support', duration: '1 Day', features: [] },
      };
      setBasicPrice(String(p.basic.price));
      setBasicDesc(p.basic.description);
      setBasicDur(p.basic.duration);

      setStandardPrice(String(p.standard.price));
      setStandardDesc(p.standard.description);
      setStandardDur(p.standard.duration);

      setPremiumPrice(String(p.premium.price));
      setPremiumDesc(p.premium.description);
      setPremiumDur(p.premium.duration);
    }
  }, [refreshSeed]);

  // Reactive state listener
  useEffect(() => {
    const unsub = QuickFixStore.subscribeToStore(() => {
      setRefreshSeed(prev => prev + 1);
    });
    return unsub;
  }, []);

  if (!currentUser) return null;

  // Active bookings received
  const allBookings = QuickFixStore.getBookings();
  const workerBookings = allBookings.filter((b) => b.workerId === currentUser.id);
  const pendingRequests = workerBookings.filter((b) => b.status === 'pending');
  const activeJobs = workerBookings.filter((b) => b.status === 'accepted' || b.status === 'in-progress');
  const finishedJobs = workerBookings.filter((b) => b.status === 'completed');

  const transactions = QuickFixStore.getTransactions(currentUser.id);
  const walletBalance = QuickFixStore.getWalletBalance(currentUser.id);

  const handleToggleAvailability = () => {
    const nextAvail = !currentUser.availability;
    QuickFixStore.updateUserProfile(currentUser.id, { availability: nextAvail });
    alert(`Status updated! You are now ${nextAvail ? 'ONLINE' : 'OFFLINE'}.`);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    QuickFixStore.updateUserProfile(currentUser.id, {
      name,
      description,
      hourlyRate: Number(hourlyRate) || 200,
      skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      location,
      experience: Number(experience) || 1,
      avatar: avatarPreview
    });
    alert('Profile configurations updated successfully!');
  };

  const handlePackagesSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      basic: {
        name: 'Basic',
        price: Number(basicPrice) || 300,
        description: basicDesc,
        duration: basicDur,
        features: ['Consultation', 'Minor troubleshooting', 'Quick Fixes']
      },
      standard: {
        name: 'Standard',
        price: Number(standardPrice) || 900,
        description: standardDesc,
        duration: standardDur,
        features: ['Detailed diagnostic', 'Complete replacement repair', 'Parts fittings assistance']
      },
      premium: {
        name: 'Premium',
        price: Number(premiumPrice) || 2500,
        description: premiumDesc,
        duration: premiumDur,
        features: ['Full scale project overhaul', 'Premium hardware layout', '30-day extended warrantee']
      }
    };
    QuickFixStore.updateWorkerPackages(currentUser.id, updated);
    alert('Custom packages configured successfully! Customers will see updated price listings.');
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(withdrawAmt);
    if (!amt || amt <= 0) return;
    if (walletBalance < amt) {
      alert('Insufficient wallet funds.');
      return;
    }

    QuickFixStore.debitWallet(currentUser.id, amt, `Withdrawal to bank account (UPI Instant payout)`);
    setWithdrawAmt('');
    alert('Withdrawal request approved! Credited to your bank.');
  };

  const handleAcceptJob = (bookingId: string) => {
    QuickFixStore.updateBookingStatus(bookingId, 'accepted');
  };

  const handleRejectJob = (bookingId: string) => {
    QuickFixStore.updateBookingStatus(bookingId, 'cancelled');
  };

  const handleStartWorking = (bookingId: string) => {
    QuickFixStore.updateBookingStatus(bookingId, 'in-progress');
  };

  const handleCompleteJob = (bookingId: string) => {
    QuickFixStore.updateBookingStatus(bookingId, 'completed');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatWithId || !chatMessageText.trim()) return;

    QuickFixStore.sendMessage(currentUser.id, chatWithId, chatMessageText);
    setChatMessageText('');
  };

  const startChat = (id: string, name: string) => {
    setChatWithId(id);
    setChatWithName(name);
    setActiveSubTab('chat');
  };

  const handleAvatarChange = () => {
    const list = ['Suresh', 'Amit', 'Rajesh', 'Priya', 'Vikram', 'Anjali', 'Karan'];
    const random = list[Math.floor(Math.random() * list.length)];
    const seed = `https://api.dicebear.com/7.x/avataaars/svg?seed=${random}${Date.now()}`;
    setAvatarPreview(seed);
  };

  const chatMessages = chatWithId ? QuickFixStore.getMessages(currentUser.id, chatWithId) : [];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      
      {/* Sidebar controls panel */}
      <div className="w-full md:w-80 glass-strong border-b md:border-b-0 md:border-r border-slate-200/60 p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Worker profile visual */}
          <div className="flex items-center gap-4 mb-8 bg-white/70 p-4 rounded-2xl border border-white">
            <div className="w-14 h-14 rounded-2xl overflow-hidden relative shadow icon-3d">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 leading-tight">{currentUser.name}</h3>
              <p className="text-xs font-semibold text-purple-600 bg-purple-100/60 px-2.5 py-1 rounded-full mt-1.5 inline-block">
                {t('workerRole', lang)}
              </p>
            </div>
          </div>

          {/* Sub Navigation Links */}
          <div className="space-y-2">
            {[
              { id: 'requests', label: t('pendingBookings', lang), icon: Calendar, badge: pendingRequests.length },
              { id: 'packages', label: t('managePackages', lang), icon: Sliders },
              { id: 'profile', label: 'Edit Profile & Uploads', icon: User },
              { id: 'wallet', label: t('myWallet', lang), icon: Wallet, badge: `₹${walletBalance}` },
              { id: 'chat', label: t('activeChats', lang), icon: MessageSquare },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeSubTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSubTab(item.id as any);
                    if (item.id === 'chat' && !chatWithId) {
                      setChatWithId('admin');
                      setChatWithName(t('supportChatTitle', lang));
                    }
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold text-sm transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20 border-transparent'
                      : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      isActive ? 'bg-white text-purple-600' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick controls help */}
        <div className="mt-8 pt-6 border-t border-slate-200/50 space-y-4">
          <button
            onClick={() => startChat('admin', t('supportChatTitle', lang))}
            className="w-full py-3.5 rounded-2xl glass-strong border border-slate-200 hover:bg-slate-100/50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer icon-3d"
          >
            <Zap className="w-4 h-4 text-purple-600" />
            <span>Chat Support</span>
          </button>

          <div className="bg-gradient-to-tr from-slate-800 to-slate-900 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-300 font-medium">Availability</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 ${
                  currentUser.availability ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {currentUser.availability ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <button
                onClick={handleToggleAvailability}
                className={`w-11 h-6 rounded-full relative transition-all border-0 cursor-pointer ${
                  currentUser.availability ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow ${
                  currentUser.availability ? 'left-5.5' : 'left-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Contents Panel */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
        
        {/* Banner header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200/60">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Worker Dashboard
            </h2>
            <p className="text-slate-500 font-medium">Manage and configure your service offerings in {currentUser.location}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 font-bold text-sm">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
              <span>{currentUser.rating}★ ({currentUser.reviewsCount} reviews)</span>
            </div>

            <button
              onClick={() => QuickFixStore.logout()}
              className="px-5 py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm border border-red-100 cursor-pointer transition-colors"
            >
              {t('logout', lang)}
            </button>
          </div>
        </div>

        {/* Rendering Sub-Tabs */}
        <AnimatePresence mode="wait">
          
          {/* SUBTAB 1: BOOKING REQUESTS AND LIFECYCLE */}
          {activeSubTab === 'requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Stats overview */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Pending Requests', value: pendingRequests.length, color: 'text-purple-600 bg-purple-50 border-purple-100' },
                  { label: 'Active Jobs', value: activeJobs.length, color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
                  { label: 'Completed Jobs', value: finishedJobs.length, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                ].map((stat, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border ${stat.color}`}>
                    <span className="text-[11px] font-bold block">{stat.label}</span>
                    <span className="text-2xl font-black block mt-1">{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Pending booking requests */}
              <div className="space-y-4">
                <h3 className="text-xl font-extrabold text-slate-800">New Booking Requests ({pendingRequests.length})</h3>
                
                {pendingRequests.length === 0 ? (
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-12 text-center text-slate-500">
                    <Clock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-semibold">No pending service requests received. Make sure your availability toggle is ON!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="bg-white border border-slate-200/60 rounded-3xl p-6 relative card-3d shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-xs font-bold text-purple-600 bg-purple-100/50 px-2.5 py-1 rounded-full">
                              New Request #{req.id}
                            </span>
                            <h4 className="text-lg font-black text-slate-800 mt-2">{req.customerName}</h4>
                            <p className="text-xs text-slate-400 font-bold mt-1">📞 {req.customerPhone} • Scheduled: {req.date} at {req.time}</p>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-2xl font-black text-slate-900">₹{req.amount}</span>
                            <div className="text-[10px] text-cyan-600 font-bold mt-1 bg-cyan-50 px-2 py-0.5 rounded-full inline-block">
                              {req.packageName} Package
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700 font-medium mb-5">
                          📝 {req.description}
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                          <button
                            onClick={() => handleAcceptJob(req.id)}
                            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow hover:brightness-105 cursor-pointer border-0 icon-3d"
                          >
                            Accept Request
                          </button>
                          <button
                            onClick={() => handleRejectJob(req.id)}
                            className="px-6 py-3.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs cursor-pointer border border-red-100 transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Confirmations stepper */}
              <div className="space-y-4 pt-4">
                <h3 className="text-xl font-extrabold text-slate-800">Ongoing Confirmed Work ({activeJobs.length})</h3>
                
                {activeJobs.length === 0 ? (
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-8 text-center text-slate-500 text-sm font-semibold">
                    No ongoing jobs currently.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeJobs.map((job) => (
                      <div key={job.id} className="bg-white border border-slate-200/60 rounded-3xl p-6 hover:shadow-md transition-all">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                          <div>
                            <h4 className="text-base font-extrabold text-slate-800">{job.customerName}</h4>
                            <p className="text-[11px] text-slate-400 font-bold mt-0.5">🗓 {job.date} at {job.time} • Amount: ₹{job.amount}</p>
                          </div>
                          
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            job.status === 'in-progress' ? 'bg-cyan-100 text-cyan-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {job.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Lifecycle buttons */}
                        <div className="flex justify-between items-center pt-4 mt-2">
                          <button
                            onClick={() => startChat(job.customerId, job.customerName)}
                            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1 transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>Message Customer</span>
                          </button>

                          <div className="flex gap-2">
                            {job.status === 'accepted' && (
                              <button
                                onClick={() => handleStartWorking(job.id)}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow hover:brightness-105 cursor-pointer border-0 icon-3d"
                              >
                                Start Work Stepper
                              </button>
                            )}
                            
                            {job.status === 'in-progress' && (
                              <button
                                onClick={() => handleCompleteJob(job.id)}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow hover:brightness-105 cursor-pointer border-0 icon-3d"
                              >
                                Mark Completed (Payout release)
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* SUBTAB 2: CUSTOMIZABLE SERVICE PACKAGES */}
          {activeSubTab === 'packages' && (
            <motion.div
              key="packages"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8"
            >
              <h3 className="text-xl font-extrabold text-slate-800 mb-2">{t('managePackages', lang)}</h3>
              <p className="text-xs text-slate-400 font-bold mb-6">Configure the exact pricing and description details for your service tier slots:</p>

              <form onSubmit={handlePackagesSave} className="space-y-6">
                
                {/* 3 Package blocks */}
                {['Basic', 'Standard', 'Premium'].map((key) => {
                  const isBasic = key === 'Basic';
                  const isStd = key === 'Standard';
                  
                  const priceVal = isBasic ? basicPrice : isStd ? standardPrice : premiumPrice;
                  const setPrice = isBasic ? setBasicPrice : isStd ? setStandardPrice : setPremiumPrice;
                  
                  const descVal = isBasic ? basicDesc : isStd ? standardDesc : premiumDesc;
                  const setDesc = isBasic ? setBasicDesc : isStd ? setStandardDesc : setPremiumDesc;

                  const durVal = isBasic ? basicDur : isStd ? standardDur : premiumDur;
                  const setDur = isBasic ? setBasicDur : isStd ? setStandardDur : setPremiumDur;

                  return (
                    <div key={key} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-sm text-slate-800">{key} tier package</span>
                        <span className="text-[10px] text-slate-400 font-bold">Configured Slot</span>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 block mb-1.5">Package Price (₹)</label>
                          <input
                            type="number"
                            required
                            value={priceVal}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-bold text-slate-500 block mb-1.5">Duration / Speed</label>
                          <input
                            type="text"
                            required
                            value={durVal}
                            onChange={(e) => setDur(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs"
                            placeholder="e.g. 2 Hours, 1 Day"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Detailed Description</label>
                        <textarea
                          required
                          value={descVal}
                          onChange={(e) => setDesc(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs"
                          placeholder="e.g. Cleans, checks leaks, seals screws and thread tapes."
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-xs shadow hover:brightness-105 cursor-pointer border-0 flex items-center gap-2 icon-3d"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Packages Setup</span>
                  </button>
                </div>

              </form>
            </motion.div>
          )}

          {/* SUBTAB 3: EDIT PROFILE WITH FILE PICTURE PREVIEW */}
          {activeSubTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8"
            >
              <h3 className="text-xl font-extrabold text-slate-800 mb-2">Edit Profile Credentials</h3>
              <p className="text-xs text-slate-400 font-bold mb-6">Customize details visible to customers seeking services:</p>

              <form onSubmit={handleProfileSave} className="space-y-6">
                
                {/* Visual Avatar File upload block */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col md:flex-row items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md shrink-0 bg-white">
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block mb-1">Profile Photo Upload Sandbox</span>
                    <p className="text-[10px] text-slate-400 leading-normal mb-3">Instant previewing system simulating native filesystem uploads.</p>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAvatarChange}
                        className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 font-bold text-xs cursor-pointer border border-purple-100 flex items-center gap-1.5 transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Select Photo</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs"
                    />
                  </div>

                  <div className="relative">
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Location City</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                          className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs"
                        />

                        {/* Search dropdown suggestions */}
                        <AnimatePresence>
                          {showLocationSuggestions && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200/60 rounded-2xl shadow-xl max-h-56 overflow-y-auto"
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
                                    className="w-full px-4 py-3 text-left font-bold text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-600 border-0 bg-transparent cursor-pointer flex items-center justify-between transition-colors"
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
                        className={`px-4 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all border duration-300 shadow-sm ${
                          gpsStatus === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : gpsStatus === 'error'
                            ? 'bg-red-50 border-red-200 text-red-600'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <MapPin className={`w-4 h-4 ${gpsLoading ? 'animate-bounce text-purple-600' : ''}`} />
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
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Hourly Base Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Years of Experience</label>
                    <input
                      type="number"
                      required
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Skills (comma-separated list)</label>
                  <input
                    type="text"
                    required
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs"
                    placeholder="e.g. Pipe Repair, Tap replacement, Bathroom overhaul"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Profile Bio / Description</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-xs shadow hover:brightness-105 cursor-pointer border-0 flex items-center gap-2 icon-3d"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </button>
                </div>

              </form>
            </motion.div>
          )}

          {/* SUBTAB 4: WALLET CREDITS AND LEDGER */}
          {activeSubTab === 'wallet' && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-3 gap-6">
                
                {/* Ledger card */}
                <div className="md:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">QuickFix Worker Payout Balance</span>
                      <h3 className="text-4xl font-black mt-2">
                        ₹{walletBalance}
                      </h3>
                    </div>
                    <DollarSign className="w-10 h-10 text-purple-400" />
                  </div>

                  <div className="relative z-10 pt-8 flex justify-between items-end">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">RECIPIENT NAME</span>
                      <span className="text-sm font-bold tracking-wide">{currentUser.name}</span>
                    </div>
                    <span className="text-xs font-bold text-purple-400">INSTANT UPI PAYOUT</span>
                  </div>

                  <div className="absolute -right-24 -bottom-24 w-64 h-64 bg-purple-500/20 blur-3xl rounded-full" />
                </div>

                {/* Withdraw Cash */}
                <div className="glass-strong border border-slate-200/60 rounded-3xl p-6">
                  <h4 className="font-extrabold text-slate-800 text-sm mb-4">Request Withdrawal</h4>
                  <form onSubmit={handleWithdraw} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1.5">Payout Amount (₹)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-slate-500">₹</span>
                        <input
                          type="number"
                          required
                          value={withdrawAmt}
                          onChange={(e) => setWithdrawAmt(e.target.value)}
                          placeholder="e.g. 5000"
                          className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500/50 text-slate-900 font-bold text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-xs shadow hover:brightness-105 cursor-pointer border-0 icon-3d"
                    >
                      Instant bank withdrawal
                    </button>
                  </form>
                </div>
              </div>

              {/* Transactions logs */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6">
                <h4 className="font-extrabold text-slate-800 text-lg mb-4">Transactions Log</h4>
                
                {transactions.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-sm font-semibold">
                    No transactions recorded. Complete jobs to receive client escrows.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">{tx.description}</span>
                          <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">
                            {new Date(tx.date).toLocaleDateString()} at {new Date(tx.date).toLocaleTimeString()}
                          </span>
                        </div>
                        <span className={`font-black text-sm ${
                          tx.type === 'credit' ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* SUBTAB 5: REAL-TIME MESSAGING INBOX */}
          {activeSubTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid md:grid-cols-3 gap-6 bg-white border border-slate-200/60 rounded-3xl overflow-hidden min-h-[480px] shadow-sm"
            >
              {/* Inbox lists */}
              <div className="border-r border-slate-200/60 p-4 space-y-4">
                <h4 className="font-extrabold text-slate-800 text-sm px-2">Active Conversation</h4>
                
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setChatWithId('admin');
                      setChatWithName(t('supportChatTitle', lang));
                    }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left border cursor-pointer ${
                      chatWithId === 'admin'
                        ? 'bg-purple-50 border-purple-100 text-purple-800'
                        : 'border-transparent text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center font-bold text-purple-700">
                      🛠
                    </div>
                    <div>
                      <span className="text-xs font-extrabold block">Admin Helpdesk</span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Platform Customer Care</span>
                    </div>
                  </button>

                  {workerBookings.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setChatWithId(b.customerId);
                        setChatWithName(b.customerName);
                      }}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left border cursor-pointer ${
                        chatWithId === b.customerId
                          ? 'bg-purple-50 border-purple-100 text-purple-800'
                          : 'border-transparent text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                        👤
                      </div>
                      <div>
                        <span className="text-xs font-extrabold block">{b.customerName}</span>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Booking ID #{b.id}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Messaging workspace */}
              <div className="md:col-span-2 flex flex-col justify-between h-[480px]">
                
                <div className="bg-slate-50/70 p-4 border-b border-slate-200/60">
                  <span className="text-xs font-extrabold text-slate-800 block">{chatWithName}</span>
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Secure SSL Chat Logs</span>
                </div>

                {/* Messages stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/20">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs font-semibold">
                      <MessageSquare className="w-8 h-8 mb-2 text-slate-300" />
                      <span>No messages logs. Select a conversation to start chatting.</span>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.senderId === currentUser.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-normal font-semibold ${
                            isMe
                              ? 'bg-gradient-to-tr from-purple-500 to-indigo-600 text-white rounded-tr-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                          }`}>
                            <span>{msg.text}</span>
                            <span className={`text-[9px] mt-1.5 block text-right font-normal ${
                              isMe ? 'text-purple-100' : 'text-slate-400'
                            }`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200/60 bg-white flex gap-2">
                  <input
                    type="text"
                    required
                    value={chatMessageText}
                    onChange={(e) => setChatMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500/50 text-slate-900 font-bold text-xs"
                  />
                  <button
                    type="submit"
                    className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white cursor-pointer shadow border-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
