import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  MapPin,
  Star,
  Phone,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Wallet,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Send,
  X,
  CreditCard,
  Bell,
  Clock,
  ThumbsUp,
} from 'lucide-react';
import { QuickFixStore, UserProfile, Booking, ChatMessage, Review } from '../../lib/store';
import { t, LangType } from '../../lib/translations';
import { getCurrentGPSLocation, INDIAN_CITIES, dijkstraShortestPath } from '../../lib/location';

interface CustomerDashboardProps {
  lang: LangType;
}

export function CustomerDashboard({ lang }: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'bookings' | 'wallet' | 'chat'>('browse');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const handleGPSDetect = async () => {
    setGpsLoading(true);
    setGpsStatus('idle');
    try {
      const res = await getCurrentGPSLocation();
      setSelectedLocation(res.location);
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
  
  // Modals / Intermediates
  const [bookingWorker, setBookingWorker] = useState<UserProfile | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<'Basic' | 'Standard' | 'Premium'>('Standard');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingDesc, setBookingDesc] = useState('');
  
  // Review flow
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Wallet
  const [addFundsAmount, setAddFundsAmount] = useState('');

  // Active Chats
  const [chatWithId, setChatWithId] = useState<string | null>(null); // worker ID or "admin"
  const [chatWithName, setChatWithName] = useState('');
  const [chatMessageText, setChatMessageText] = useState('');

  // Local reactive triggers
  const [refreshSeed, setRefreshSeed] = useState(0);

  useEffect(() => {
    setCurrentUser(QuickFixStore.getCurrentUser());
  }, [refreshSeed]);

  // Reactive subscription
  useEffect(() => {
    const unsub = QuickFixStore.subscribeToStore(() => {
      setRefreshSeed(prev => prev + 1);
    });
    return unsub;
  }, []);

  if (!currentUser) return null;

  // Filter Categories
  const categories = QuickFixStore.getCategories();
  
  // Filter Workers list
  const allWorkers = QuickFixStore.getAllUsers().filter((u) => u.role === 'worker');
  const baseFilteredWorkers = allWorkers.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesLocation = (() => {
      if (!selectedLocation || selectedLocation === 'All') return true;
      const filterLoc = selectedLocation.toLowerCase().replace(/\(gps\)/g, '').trim();
      const workerLoc = w.location.toLowerCase().replace(/\(gps\)/g, '').trim();
      
      if (workerLoc.includes(filterLoc) || filterLoc.includes(workerLoc)) return true;
      
      const filterWords = filterLoc.split(/[\s,]+/).filter(w => w.length >= 3);
      const workerWords = workerLoc.split(/[\s,]+/).filter(w => w.length >= 3);
      return filterWords.some(fW => workerWords.some(wW => fW.includes(wW) || wW.includes(fW)));
    })();

    const matchesCategory =
      selectedCategory === 'All' ||
      w.skills.some((s) => s.toLowerCase().includes(selectedCategory.toLowerCase())) ||
      w.description.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesLocation && matchesCategory;
  });

  const searchReferenceLocation = (!selectedLocation || selectedLocation === 'All')
    ? (currentUser.location || 'Mumbai')
    : selectedLocation;

  // Sort filtered workers by Dijkstra shortest highway route distance
  const filteredWorkers = [...baseFilteredWorkers].sort((a, b) => {
    const distA = dijkstraShortestPath(searchReferenceLocation, a.location).distance;
    const distB = dijkstraShortestPath(searchReferenceLocation, b.location).distance;
    
    // Verified first
    if (a.verified && !b.verified) return -1;
    if (!a.verified && b.verified) return 1;
    
    if (distA !== distB) {
      return distA - distB;
    }
    return b.rating - a.rating;
  });

  const aiRecs = QuickFixStore.getAIRecommendations(currentUser.id);
  const bookings = QuickFixStore.getBookings().filter((b) => b.customerId === currentUser.id);
  const transactions = QuickFixStore.getTransactions(currentUser.id);
  const notifications = QuickFixStore.getNotifications(currentUser.id);
  const activeUnreadNotifications = notifications.filter(n => !n.read).length;

  const handleBookingConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingWorker || !bookingDate || !bookingTime) return;

    const pack = bookingWorker.packages?.[selectedPackage.toLowerCase() as 'basic' | 'standard' | 'premium'] || {
      name: selectedPackage,
      price: selectedPackage === 'Basic' ? 300 : selectedPackage === 'Standard' ? 900 : 2500,
      description: 'Standard Service Package'
    };

    QuickFixStore.createBooking({
      customerId: currentUser.id,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      workerId: bookingWorker.id,
      workerName: bookingWorker.name,
      category: bookingWorker.skills[0] || 'General',
      packageName: selectedPackage,
      amount: pack.price,
      date: bookingDate,
      time: bookingTime,
      location: currentUser.location,
      description: bookingDesc || pack.description
    });

    setBookingWorker(null);
    setBookingDate('');
    setBookingTime('');
    setBookingDesc('');
    setActiveTab('bookings');
  };

  const handlePayBooking = (bookingId: string) => {
    const res = QuickFixStore.payForBooking(bookingId);
    if (!res.success) {
      alert(res.error || 'Payment failed');
    } else {
      alert('Payment settled from Wallet! Released/held securely.');
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;
    
    QuickFixStore.addReview(
      reviewBooking.workerId,
      currentUser.name,
      reviewRating,
      reviewComment || 'Excellent, highly professional service!'
    );

    // Update status to complete if needed
    setReviewBooking(null);
    setReviewComment('');
    setReviewRating(5);
    alert('Thank you for rating! Updated worker profile scorecards.');
  };

  const handleAddFunds = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(addFundsAmount);
    if (!amt || amt <= 0) return;

    QuickFixStore.creditWallet(currentUser.id, amt, 'Deposited cash via secure UPI interface');
    setAddFundsAmount('');
    alert('Money loaded successfully to your wallet!');
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
    setActiveTab('chat');
  };

  const chatMessages = chatWithId ? QuickFixStore.getMessages(currentUser.id, chatWithId) : [];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      
      {/* Side Navigation panel */}
      <div className="w-full md:w-80 glass-strong border-b md:border-b-0 md:border-r border-slate-200/60 p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* User Profile display */}
          <div className="flex items-center gap-4 mb-8 bg-white/70 p-4 rounded-2xl border border-white">
            <div className="w-14 h-14 rounded-2xl overflow-hidden relative shadow icon-3d">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 leading-tight">{currentUser.name}</h3>
              <p className="text-xs font-semibold text-cyan-600 bg-cyan-100/60 px-2.5 py-1 rounded-full mt-1.5 inline-block">
                {t('customerRole', lang)}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
            {[
              { id: 'browse', label: t('search', lang) + ' Workers', icon: Search },
              { id: 'bookings', label: t('activeBookings', lang), icon: Calendar, badge: bookings.length },
              { id: 'wallet', label: t('myWallet', lang), icon: Wallet, badge: `₹${QuickFixStore.getWalletBalance(currentUser.id)}` },
              { id: 'chat', label: t('activeChats', lang), icon: MessageSquare },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    if (item.id === 'chat' && !chatWithId) {
                      setChatWithId('admin');
                      setChatWithName(t('supportChatTitle', lang));
                    }
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold text-sm transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 border-transparent'
                      : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      isActive ? 'bg-white text-cyan-600' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick info support */}
        <div className="mt-8 pt-6 border-t border-slate-200/50 space-y-4">
          <button
            onClick={() => startChat('admin', t('supportChatTitle', lang))}
            className="w-full py-3.5 rounded-2xl glass-strong border border-slate-200 hover:bg-slate-100/50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer icon-3d"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-600" />
            <span>{t('contactSupport', lang)}</span>
          </button>

          {/* Wallet Balance widget */}
          <div className="bg-gradient-to-tr from-slate-800 to-slate-900 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-xs text-slate-300 font-medium">{t('walletBalance', lang)}</span>
              <h4 className="text-2xl font-extrabold mt-1">
                ₹{QuickFixStore.getWalletBalance(currentUser.id)}
              </h4>
            </div>
            <Wallet className="w-20 h-20 text-white/5 absolute -right-4 -bottom-4 rotate-12" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
        
        {/* Header toolbar */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200/60">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              {t('welcome', lang)}, {currentUser.name}!
            </h2>
            <p className="text-slate-500 font-medium">Find skilled verified professionals near {currentUser.location}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification alert bell */}
            <div className="relative cursor-pointer" onClick={() => {
              QuickFixStore.markNotificationsAsRead(currentUser.id);
              alert(notifications.map(n => `🔔 ${n.title}\n${n.message}`).join('\n\n') || t('noNotifications', lang));
            }}>
              <motion.div
                className="w-12 h-12 rounded-2xl bg-white border border-slate-200/60 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                <Bell className="w-5 h-5 text-slate-600" />
              </motion.div>
              {activeUnreadNotifications > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {activeUnreadNotifications}
                </span>
              )}
            </div>

            <button
              onClick={() => QuickFixStore.logout()}
              className="px-5 py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm border border-red-100 cursor-pointer transition-colors"
            >
              {t('logout', lang)}
            </button>
          </div>
        </div>

        {/* Tab switcher viewports */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: BROWSE WORKERS */}
          {activeTab === 'browse' && (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Search Toolbar */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('locationSearchPlaceholder', lang)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl glass-strong border-0 focus:ring-2 focus:ring-cyan-500/50 text-slate-900 font-semibold text-sm"
                  />
                </div>

                {/* Searchable custom location input + GPS button */}
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-600 animate-pulse" />
                      <input
                        type="text"
                        placeholder={t('locationPlaceholder', lang)}
                        value={selectedLocation === 'All' ? '' : selectedLocation}
                        onChange={(e) => {
                          setSelectedLocation(e.target.value || 'All');
                          setShowLocationSuggestions(true);
                        }}
                        onFocus={() => setShowLocationSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl glass-strong border-0 focus:ring-2 focus:ring-cyan-500/50 text-slate-900 font-semibold text-sm"
                      />

                      {/* Autocomplete dropdown list */}
                      <AnimatePresence>
                        {showLocationSuggestions && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-xl max-h-56 overflow-y-auto"
                          >
                            <button
                              type="button"
                              onMouseDown={() => {
                                setSelectedLocation('All');
                                setShowLocationSuggestions(false);
                              }}
                              className="w-full px-4 py-3 text-left font-bold text-xs text-cyan-600 hover:bg-cyan-50 border-0 bg-transparent cursor-pointer flex items-center justify-between transition-colors"
                            >
                              <span>★ {t('allLocations', lang)}</span>
                              <span className="text-[10px] text-slate-400 font-medium">India</span>
                            </button>

                            {INDIAN_CITIES.filter(
                              (c) =>
                                c.name.toLowerCase().includes((selectedLocation === 'All' ? '' : selectedLocation).toLowerCase()) ||
                                c.state.toLowerCase().includes((selectedLocation === 'All' ? '' : selectedLocation).toLowerCase())
                            )
                              .slice(0, 6)
                              .map((city) => (
                                <button
                                  key={`${city.name}-${city.state}`}
                                  type="button"
                                  onMouseDown={() => {
                                    setSelectedLocation(city.name);
                                    setShowLocationSuggestions(false);
                                  }}
                                  className="w-full px-4 py-3 text-left font-bold text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-600 border-0 bg-transparent cursor-pointer flex items-center justify-between transition-colors"
                                >
                                  <span>{city.name}</span>
                                  <span className="text-[10px] text-slate-400 font-medium">{city.state}</span>
                                </button>
                              ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Geolocation Button */}
                    <button
                      type="button"
                      onClick={handleGPSDetect}
                      disabled={gpsLoading}
                      className={`px-4 rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all border duration-300 shadow-sm shrink-0 ${
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
              </div>

              {/* AI-Powered Smart Recommendation Widget */}
              {aiRecs.length > 0 && (
                <div className="p-6 rounded-3xl bg-gradient-to-tr from-cyan-50/70 via-blue-50/50 to-purple-50/70 border border-cyan-100 shadow-sm relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 mb-1">
                      <Sparkles className="w-5 h-5 text-cyan-600 animate-bounce" />
                      {t('aiRecommendations', lang)}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mb-5">{t('aiRecSub', lang)}</p>

                    <div className="grid md:grid-cols-3 gap-4">
                      {aiRecs.map((rec) => (
                        <div
                          key={rec.id}
                          className="bg-white/80 border border-cyan-100 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer card-3d"
                          onClick={() => setBookingWorker(rec)}
                        >
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
                                <img src={rec.avatar} alt={rec.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800 text-xs">{rec.name}</h4>
                                <span className="text-[10px] font-semibold text-purple-600 bg-purple-100/50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                  {rec.skills[0] || 'Handyman'}
                                </span>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-500 leading-normal line-clamp-2 mb-3">
                              {rec.description}
                            </p>
                            {(() => {
                              const route = dijkstraShortestPath(currentUser.location || 'Mumbai', rec.location);
                              return (
                                <div className="mt-2 py-1.5 px-2.5 rounded-xl bg-cyan-50/40 border border-cyan-100/50 text-[10px] font-semibold text-cyan-800 flex items-center gap-1.5 truncate">
                                  <Sparkles className="w-3 h-3 text-cyan-600 shrink-0" />
                                  <span className="truncate font-bold">{route.formattedPath}</span>
                                </div>
                              );
                            })()}
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                            <span className="text-[11px] font-extrabold text-slate-700">₹{rec.hourlyRate}/hr</span>
                            <span className="text-[11px] font-extrabold text-amber-500 flex items-center gap-0.5">
                              ★ {rec.rating} ({rec.reviewsCount})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Workers Lists */}
              <div className="space-y-5">
                <h3 className="text-xl font-extrabold text-slate-800">Verified Local Workers ({filteredWorkers.length})</h3>
                
                {filteredWorkers.length === 0 ? (
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-12 text-center text-slate-500">
                    <MapPin className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-semibold">No workers match your search query. Try switching city locations or keywords.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {filteredWorkers.map((worker) => (
                      <motion.div
                        key={worker.id}
                        layout
                        className="bg-white border border-slate-200/60 rounded-3xl p-6 flex flex-col justify-between hover:shadow-lg transition-all card-3d relative"
                        whileHover={{ y: -4 }}
                      >
                        <div>
                          {/* Worker details */}
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm shrink-0">
                                <img src={worker.avatar} alt={worker.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                                  {worker.name}
                                  {worker.verified && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  )}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {worker.location}
                                  </span>
                                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                    {worker.experience} yrs exp
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-lg font-black text-cyan-600">₹{worker.hourlyRate}/hr</span>
                              <div className="text-[11px] font-bold text-amber-500 flex items-center justify-end gap-0.5 mt-0.5">
                                ★ {worker.rating} ({worker.reviewsCount})
                              </div>
                            </div>
                          </div>

                          <p className="text-slate-600 text-xs leading-normal mb-4 line-clamp-2">
                            {worker.description}
                          </p>

                          {/* Skill badges */}
                          <div className="flex flex-wrap gap-1.5 mb-6">
                            {worker.skills.map((skill) => (
                              <span key={skill} className="text-[10px] font-bold text-slate-600 bg-slate-100/80 border border-slate-200/30 px-2 py-1 rounded-lg">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                          <button
                            onClick={() => setBookingWorker(worker)}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow hover:brightness-105 cursor-pointer icon-3d"
                          >
                            {t('bookWorker', lang)}
                          </button>
                          <button
                            onClick={() => startChat(worker.id, worker.name)}
                            className="w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                          >
                            {t('send', lang) + ' Message'}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: ACTIVE BOOKINGS & STEPPER STATUS */}
          {activeTab === 'bookings' && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-extrabold text-slate-800">{t('activeBookings', lang)} ({bookings.length})</h3>

              {bookings.length === 0 ? (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-12 text-center text-slate-500">
                  <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold">No active bookings found. Book a verified worker today!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {bookings.map((booking) => {
                    const statusSteps = ['pending', 'accepted', 'in-progress', 'completed'];
                    const currentStepIdx = statusSteps.indexOf(booking.status);
                    return (
                      <div key={booking.id} className="bg-white border border-slate-200/60 rounded-3xl p-6 hover:shadow-md transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                          <div>
                            <span className="text-xs font-bold text-cyan-600 bg-cyan-100/60 px-2.5 py-1 rounded-full">
                              Booking #{booking.id}
                            </span>
                            <h4 className="text-lg font-black text-slate-800 mt-2">{booking.workerName}</h4>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                              📅 {booking.date} at {booking.time} • Inclusions: {booking.packageName} Package
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-2xl font-black text-slate-900">₹{booking.amount}</span>
                            <div className="flex items-center justify-end gap-2 mt-1">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {booking.paymentStatus === 'paid' ? t('paymentPaid', lang) : t('paymentUnpaid', lang)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="py-4 text-xs text-slate-700 font-medium leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100/60 mt-4">
                          📝 {booking.description}
                        </div>

                        {/* Real-time Tracking Stepper */}
                        <div className="py-6">
                          <div className="flex items-center justify-between max-w-xl mx-auto relative">
                            {/* Connector line */}
                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 -z-0" />
                            <div
                              className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-cyan-500 to-emerald-500 -translate-y-1/2 -z-0 transition-all duration-500"
                              style={{ width: `${currentStepIdx >= 0 ? (currentStepIdx / (statusSteps.length - 1)) * 100 : 0}%` }}
                            />

                            {statusSteps.map((step, idx) => {
                              const isCompleted = currentStepIdx >= idx;
                              const isActive = currentStepIdx === idx;
                              return (
                                <div key={step} className="flex flex-col items-center z-10 relative">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all duration-300 ${
                                    isCompleted
                                      ? 'bg-gradient-to-tr from-cyan-500 to-emerald-500 text-white scale-110 shadow-md'
                                      : 'bg-slate-200 text-slate-500'
                                  }`}>
                                    {isCompleted ? '✓' : idx + 1}
                                  </div>
                                  <span className={`text-[10px] font-bold mt-2 capitalize ${
                                    isActive ? 'text-cyan-600 scale-105' : 'text-slate-500'
                                  }`}>
                                    {step === 'pending' ? t('statusPending', lang) :
                                     step === 'accepted' ? t('statusAccepted', lang) :
                                     step === 'in-progress' ? t('statusInProgress', lang) :
                                     t('statusCompleted', lang)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Dynamic actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
                          <button
                            onClick={() => startChat(booking.workerId, booking.workerName)}
                            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>Chat with Worker</span>
                          </button>

                          <div className="flex gap-2">
                            {booking.paymentStatus === 'unpaid' && (
                              <button
                                onClick={() => handlePayBooking(booking.id)}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow hover:brightness-105 cursor-pointer icon-3d"
                              >
                                {t('payNow', lang)} (₹{booking.amount})
                              </button>
                            )}

                            {booking.status === 'completed' && (
                              <button
                                onClick={() => setReviewBooking(booking)}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-xs shadow hover:brightness-105 cursor-pointer icon-3d"
                              >
                                {t('ratingReviewTitle', lang)}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: WALLET ENGINE */}
          {activeTab === 'wallet' && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-3 gap-6">
                
                {/* Visual Debit card details */}
                <div className="md:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px] border border-slate-800">
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">QuickFix Virtual Escrow Wallet</span>
                      <h3 className="text-4xl font-black mt-2">
                        ₹{QuickFixStore.getWalletBalance(currentUser.id)}
                      </h3>
                    </div>
                    <CreditCard className="w-10 h-10 text-cyan-400" />
                  </div>

                  <div className="relative z-10 pt-8 flex justify-between items-end">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">CARD OWNER</span>
                      <span className="text-sm font-bold tracking-wide">{currentUser.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block text-right">SECURE UPI</span>
                      <span className="text-xs font-bold text-emerald-400">ACTIVE WALLET</span>
                    </div>
                  </div>
                  
                  {/* Decorative glowing gradient inside card */}
                  <div className="absolute -right-24 -bottom-24 w-64 h-64 bg-cyan-500/20 blur-3xl rounded-full" />
                </div>

                {/* Add cash controller */}
                <div className="glass-strong border border-slate-200/60 rounded-3xl p-6">
                  <h4 className="font-extrabold text-slate-800 text-sm mb-4">{t('addMoney', lang)}</h4>
                  <form onSubmit={handleAddFunds} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1.5">{t('amountLabel', lang)}</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-slate-500">₹</span>
                        <input
                          type="number"
                          required
                          value={addFundsAmount}
                          onChange={(e) => setAddFundsAmount(e.target.value)}
                          placeholder="e.g. 1000"
                          className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/50 text-slate-900 font-bold text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow hover:brightness-105 cursor-pointer border-0 icon-3d"
                    >
                      Instant UPI Load
                    </button>
                  </form>
                </div>
              </div>

              {/* Transactions log table */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6">
                <h4 className="font-extrabold text-slate-800 text-lg mb-4">{t('transactionHistory', lang)}</h4>
                
                {transactions.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-sm font-semibold">
                    {t('noTransactions', lang)}
                  </div>
                ) : (
                  <div className="space-y-3.5">
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

          {/* TAB 4: REAL-TIME MESSAGING BOARDS */}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid md:grid-cols-3 gap-6 bg-white border border-slate-200/60 rounded-3xl overflow-hidden min-h-[480px] shadow-sm"
            >
              {/* Chat Inboxes List */}
              <div className="border-r border-slate-200/60 p-4 space-y-4">
                <h4 className="font-extrabold text-slate-800 text-sm px-2">Active Recipient</h4>
                
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setChatWithId('admin');
                      setChatWithName(t('supportChatTitle', lang));
                    }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left border cursor-pointer ${
                      chatWithId === 'admin'
                        ? 'bg-cyan-50 border-cyan-100 text-cyan-800'
                        : 'border-transparent text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center font-bold text-cyan-700">
                      🛠
                    </div>
                    <div>
                      <span className="text-xs font-extrabold block">Admin Helpdesk</span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Platform Customer Care</span>
                    </div>
                  </button>

                  {bookings.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setChatWithId(b.workerId);
                        setChatWithName(b.workerName);
                      }}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left border cursor-pointer ${
                        chatWithId === b.workerId
                          ? 'bg-purple-50 border-purple-100 text-purple-800'
                          : 'border-transparent text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center font-bold text-purple-700">
                        👤
                      </div>
                      <div>
                        <span className="text-xs font-extrabold block">{b.workerName}</span>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Job Provider ({b.packageName})</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Messages Workspace */}
              <div className="md:col-span-2 flex flex-col justify-between h-[480px]">
                
                {/* Chat header banner */}
                <div className="bg-slate-50/70 p-4 border-b border-slate-200/60 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 block">{chatWithName}</span>
                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Secure platform SSL chat logs</span>
                  </div>
                </div>

                {/* Chat window body list */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/20">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs font-semibold">
                      <MessageSquare className="w-8 h-8 mb-2 text-slate-300" />
                      <span>Start conversation by sending a text below.</span>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.senderId === currentUser.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-normal font-semibold ${
                            isMe
                              ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white rounded-tr-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                          }`}>
                            <span>{msg.text}</span>
                            <span className={`text-[9px] mt-1.5 block text-right font-normal ${
                              isMe ? 'text-cyan-100' : 'text-slate-400'
                            }`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message input bar */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200/60 bg-white flex gap-2">
                  <input
                    type="text"
                    required
                    value={chatMessageText}
                    onChange={(e) => setChatMessageText(e.target.value)}
                    placeholder={t('typeMessage', lang)}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/50 text-slate-900 font-bold text-xs"
                  />
                  <button
                    type="submit"
                    className="w-12 h-12 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white cursor-pointer shadow border-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* MODAL 1: SERVICE CUSTOM PACKAGE SELECTION OVERLAY */}
      <AnimatePresence>
        {bookingWorker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateX: -15 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateX: 15 }}
              className="bg-white max-w-2xl w-full rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto card-3d border border-slate-200"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div style={{ transform: 'translateZ(30px)' }}>
                
                {/* Close modal */}
                <button
                  onClick={() => setBookingWorker(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-2xl font-black text-slate-800 mb-2">{t('packageSelection', lang)}</h3>
                <p className="text-xs text-slate-400 font-bold mb-6">Choose custom package configurations configured by {bookingWorker.name}:</p>

                {/* Customizable Service Packages Carousel (Basic, Standard, Premium) */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {['Basic', 'Standard', 'Premium'].map((key) => {
                    const pack = bookingWorker.packages?.[key.toLowerCase() as 'basic' | 'standard' | 'premium'] || {
                      name: key,
                      price: key === 'Basic' ? 300 : key === 'Standard' ? 900 : 2500,
                      duration: key === 'Basic' ? '1 Hr' : key === 'Standard' ? '3 Hrs' : '1 Day',
                      description: 'Custom Service package layout',
                      features: ['Inspection', 'Assembly details', 'Consultation support']
                    };
                    const isSelected = selectedPackage === key;
                    return (
                      <div
                        key={key}
                        onClick={() => setSelectedPackage(key as any)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[220px] ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-50/50 shadow shadow-cyan-500/10'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-black text-slate-800">{pack.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{pack.duration}</span>
                          </div>
                          
                          <h4 className="text-2xl font-extrabold text-cyan-600 mb-2">₹{pack.price}</h4>
                          <p className="text-[10px] text-slate-500 leading-normal mb-3">{pack.description}</p>
                        </div>

                        {/* List inclusions */}
                        <div className="space-y-1 pt-2 border-t border-slate-100">
                          {pack.features.slice(0, 3).map((f) => (
                            <div key={f} className="flex items-center gap-1.5 text-[9px] text-slate-600 font-bold">
                              <CheckCircle2 className="w-2.5 h-2.5 text-cyan-500" />
                              <span className="truncate">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Booking Scheduling Form details */}
                <form onSubmit={handleBookingConfirm} className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1.5">Schedule Date</label>
                      <input
                        type="date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1.5">Preferred Time</label>
                      <input
                        type="time"
                        required
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Describe Work Required</label>
                    <textarea
                      value={bookingDesc}
                      onChange={(e) => setBookingDesc(e.target.value)}
                      placeholder="e.g. Shower tap leakage in the second floor bathroom. Please bring Teflon tape."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow hover:brightness-105 cursor-pointer border-0 icon-3d"
                    >
                      {t('confirmBooking', lang)} (₹{
                        bookingWorker.packages?.[selectedPackage.toLowerCase() as 'basic' | 'standard' | 'premium']?.price ||
                        (selectedPackage === 'Basic' ? 300 : selectedPackage === 'Standard' ? 900 : 2500)
                      })
                    </button>
                  </div>
                </form>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: RATING & REVIEW FORM */}
      <AnimatePresence>
        {reviewBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl relative border border-slate-200"
            >
              <button
                onClick={() => setReviewBooking(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-black text-slate-800 mb-2">{t('ratingReviewTitle', lang)}</h3>
              <p className="text-xs text-slate-400 font-bold mb-4">Leave a public scorecard review for {reviewBooking.workerName}:</p>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-2">{t('stars', lang)}</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="cursor-pointer"
                      >
                        <Star className={`w-8 h-8 ${
                          reviewRating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Review Comment</label>
                  <textarea
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={t('reviewCommentPlaceholder', lang)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow hover:brightness-105 cursor-pointer border-0 icon-3d"
                  >
                    {t('submitReview', lang)}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
