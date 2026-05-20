import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  CheckCircle,
  PlusCircle,
  MessageSquare,
  Activity,
  Layers,
  Send,
  AlertCircle,
  Search,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { QuickFixStore, UserProfile, Booking, WalletTransaction, ChatMessage } from '../../lib/store';
import { t, LangType } from '../../lib/translations';

interface AdminPanelProps {
  lang: LangType;
}

export function AdminPanel({ lang }: AdminPanelProps) {
  const [refreshSeed, setRefreshSeed] = useState(0);
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'analytics' | 'workers' | 'categories' | 'support'>('analytics');
  
  // Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Support Chats state
  const [activeSupportUserId, setActiveSupportUserId] = useState<string | null>(null);
  const [supportMessageText, setSupportMessageText] = useState('');

  // Sync state reactively
  useEffect(() => {
    const unsub = QuickFixStore.subscribeToStore(() => {
      setRefreshSeed((prev) => prev + 1);
    });
    return unsub;
  }, []);

  const users = QuickFixStore.getAllUsers();
  const workers = users.filter((u) => u.role === 'worker');
  const customers = users.filter((u) => u.role === 'customer');
  const bookings = QuickFixStore.getBookings();
  const categories = QuickFixStore.getCategories();

  // Financial aggregates
  const completedBookings = bookings.filter((b) => b.status === 'completed');
  const totalVolume = bookings.reduce((sum, b) => sum + b.amount, 0);
  const totalCompletedVolume = completedBookings.reduce((sum, b) => sum + b.amount, 0);
  const commissionVolume = Math.round(totalCompletedVolume * 0.1); // 10% platform cuts

  // Dynamic Chart Data Formulations
  const bookingChartData = [
    { name: 'Pending', count: bookings.filter((b) => b.status === 'pending').length },
    { name: 'Accepted', count: bookings.filter((b) => b.status === 'accepted').length },
    { name: 'In Progress', count: bookings.filter((b) => b.status === 'in-progress').length },
    { name: 'Completed', count: bookings.filter((b) => b.status === 'completed').length },
    { name: 'Cancelled', count: bookings.filter((b) => b.status === 'cancelled').length },
  ];

  const financialChartData = [
    { date: 'May 16', Revenue: 500, Commission: 50 },
    { date: 'May 17', Revenue: 1800, Commission: 180 },
    { date: 'May 18', Revenue: 3400, Commission: 340 },
    { date: 'May 19', Revenue: 6200, Commission: 620 },
    { date: 'May 20', Revenue: totalCompletedVolume, Commission: commissionVolume },
  ];

  const handleVerifyWorker = (workerId: string) => {
    QuickFixStore.updateUserProfile(workerId, { verified: true });
    alert('Worker verification approved! Seal added to their profile.');
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatDesc) return;
    
    QuickFixStore.addCategory(newCatName, newCatDesc);
    setNewCatName('');
    setNewCatDesc('');
    alert('Service Category added and successfully published live!');
  };

  const handleSendSupportMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSupportUserId || !supportMessageText.trim()) return;

    QuickFixStore.sendMessage('admin', activeSupportUserId, supportMessageText);
    setSupportMessageText('');
  };

  // Find all users who sent messages to Admin
  const allChats = JSON.parse(localStorage.getItem('qf_chats') || '[]');
  const chatUserIds = Array.from(
    new Set(
      allChats
        .filter((c: any) => c.senderId === 'admin' || c.receiverId === 'admin')
        .map((c: any) => (c.senderId === 'admin' ? c.receiverId : c.senderId))
    )
  ).filter((id) => id !== 'admin') as string[];

  const chatUsers = users.filter((u) => chatUserIds.includes(u.id));
  const activeChatMessages = activeSupportUserId
    ? QuickFixStore.getMessages('admin', activeSupportUserId)
    : [];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100">
      
      {/* Sidebar navigation */}
      <div className="w-full md:w-80 glass-strong border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8 bg-white/70 p-4 rounded-2xl border border-white">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 flex items-center justify-center font-bold text-white text-lg">
              🛡
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm leading-tight">Admin Console</h3>
              <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-wider">Super Administrator</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { id: 'analytics', label: t('adminDashboard', lang), icon: TrendingUp },
              { id: 'workers', label: t('workersApprovals', lang), icon: Award, badge: workers.filter(w => !w.verified).length },
              { id: 'categories', label: 'Categories Desk', icon: Layers },
              { id: 'support', label: t('supportChats', lang), icon: MessageSquare, badge: chatUsers.length },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    if (item.id === 'support' && chatUsers.length > 0 && !activeSupportUserId) {
                      setActiveSupportUserId(chatUsers[0].id);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold text-sm border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-md border-transparent'
                      : 'border-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white text-slate-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
          <div className="bg-slate-800 rounded-2xl p-4 text-white">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Admin Commission Earned</span>
            <h4 className="text-2xl font-black mt-1 text-emerald-400">₹{commissionVolume}</h4>
          </div>
          <button
            onClick={() => QuickFixStore.logout()}
            className="w-full py-3.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-100 cursor-pointer text-center block"
          >
            {t('logout', lang)}
          </button>
        </div>
      </div>

      {/* Workspace panel */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
        
        {/* Banner header */}
        <div className="mb-8 pb-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">{t('adminDashboard', lang)}</h2>
            <p className="text-slate-500 font-medium">Evaluate analytics, manage service categories, and coordinate support tickets.</p>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-200/50 px-4 py-2 rounded-xl">
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>PLATFORM LIVE ONLINE</span>
          </div>
        </div>

        {/* Tab content viewports */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            
            {/* Top stats aggregate cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: t('totalRevenue', lang), value: `₹${totalVolume}`, icon: DollarSign, color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
                { label: t('adminCommission', lang) + ' (10%)', value: `₹${commissionVolume}`, icon: TrendingUp, color: 'text-purple-600 bg-purple-50 border-purple-100' },
                { label: t('activeUsers', lang), value: users.length, icon: Users, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                { label: 'Booking Success Rate', value: '94%', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className={`p-5 rounded-3xl border ${stat.color} card-3d shadow-sm`}>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold block">{stat.label}</span>
                      <Icon className="w-5 h-5 shrink-0" />
                    </div>
                    <span className="text-3xl font-black block mt-2.5">{stat.value}</span>
                  </div>
                );
              })}
            </div>

            {/* Recharts Analytics Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Financial growth Area chart */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h4 className="font-extrabold text-slate-800 text-sm mb-4">Financial Escrow & Commission Aggregates</h4>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financialChartData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip />
                      <Area type="monotone" dataKey="Revenue" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorRev)" />
                      <Area type="monotone" dataKey="Commission" stroke="#8b5cf6" fill="#c084fc" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Booking status distribution chart */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h4 className="font-extrabold text-slate-800 text-sm mb-4">Service Bookings Status Distribution</h4>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bookingChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Financial transaction audit sheet logs */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h4 className="font-extrabold text-slate-800 text-base mb-4">Multi-vendor Transaction Auditing Ledger</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold text-slate-400">
                      <th className="py-3 px-2">Transaction ID</th>
                      <th className="py-3 px-2">Type</th>
                      <th className="py-3 px-2">Total Amount</th>
                      <th className="py-3 px-2">Admin Cut (10%)</th>
                      <th className="py-3 px-2">Worker Earnings</th>
                      <th className="py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {completedBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-2 text-cyan-600">tx-b-{b.id}</td>
                        <td className="py-3.5 px-2">{b.category.toUpperCase()} ({b.packageName})</td>
                        <td className="py-3.5 px-2">₹{b.amount}</td>
                        <td className="py-3.5 px-2 text-purple-600">₹{Math.round(b.amount * 0.1)}</td>
                        <td className="py-3.5 px-2 text-emerald-600">₹{Math.round(b.amount * 0.9)}</td>
                        <td className="py-3.5 px-2">
                          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            RELEASED
                          </span>
                        </td>
                      </tr>
                    ))}
                    {completedBookings.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No paid/completed bookings transactions audit records available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: WORKER APPROVALS PIPELINE */}
        {activeTab === 'workers' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="text-xl font-extrabold text-slate-800">Worker Verification Pipelines</h3>
            <p className="text-xs text-slate-400 font-bold">Approve background checks and verified badges for local service providers:</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400">
                    <th className="py-3 px-2">Worker Name</th>
                    <th className="py-3 px-2">Details (Age/Gender/City)</th>
                    <th className="py-3 px-2">Core Skills</th>
                    <th className="py-3 px-2">Phone / Email</th>
                    <th className="py-3 px-2">Verifications</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {workers.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <img src={w.avatar} className="w-7 h-7 rounded-lg" alt="" />
                          <span>{w.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        {w.age} yrs • {w.gender} • <span className="text-cyan-600 font-bold">{w.location}</span>
                      </td>
                      <td className="py-4 px-2">
                        {w.skills.join(', ') || 'General Repair'}
                      </td>
                      <td className="py-4 px-2">
                        {w.phone} <br />
                        <span className="text-[10px] text-slate-400 font-bold">{w.email}</span>
                      </td>
                      <td className="py-4 px-2">
                        {w.verified ? (
                          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => handleVerifyWorker(w.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] shadow cursor-pointer border-0"
                          >
                            Approve Verify
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES DESK */}
        {activeTab === 'categories' && (
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Create Category form */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h4 className="font-extrabold text-slate-800 text-sm mb-4">Append Service Category</h4>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Category Name</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Gardening, Pest Control"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Description details</label>
                  <textarea
                    required
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="e.g. Local organic pruning and landscaping"
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold text-xs shadow hover:bg-slate-700 cursor-pointer border-0 icon-3d flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Publish Service live</span>
                </button>
              </form>
            </div>

            {/* List existing categories */}
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h4 className="font-extrabold text-slate-800 text-base mb-4">Service Offerings Portfolio ({categories.length})</h4>
              
              <div className="space-y-4">
                {categories.map((c) => (
                  <div key={c.id} className="flex justify-between items-start p-4 rounded-2xl bg-slate-50 border border-slate-150">
                    <div>
                      <span className="text-sm font-extrabold text-slate-800 block">{c.name}</span>
                      <span className="text-xs text-slate-500 font-medium block mt-1 leading-normal">{c.description}</span>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-600 bg-cyan-100/50 px-2.5 py-0.5 rounded-full uppercase shrink-0">
                      Active category
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: PLATFORM MASTER SUPPORT CHATS */}
        {activeTab === 'support' && (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden grid md:grid-cols-3 min-h-[480px]">
            
            {/* Chats list */}
            <div className="border-r border-slate-150 p-4 space-y-4">
              <h4 className="font-extrabold text-slate-800 text-sm px-2">Support Conversations</h4>
              
              <div className="space-y-1.5">
                {chatUsers.map((cu) => (
                  <button
                    key={cu.id}
                    onClick={() => {
                      setActiveSupportUserId(cu.id);
                    }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left border cursor-pointer ${
                      activeSupportUserId === cu.id
                        ? 'bg-slate-800 text-white border-transparent'
                        : 'border-transparent text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0 shadow-sm">
                      👤
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-extrabold block truncate">{cu.name}</span>
                      <span className={`text-[9px] font-bold block mt-0.5 truncate ${
                        activeSupportUserId === cu.id ? 'text-slate-300' : 'text-slate-400'
                      }`}>
                        {cu.role.toUpperCase()} • {cu.email}
                      </span>
                    </div>
                  </button>
                ))}

                {chatUsers.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                    No support tickets active.
                  </div>
                )}
              </div>
            </div>

            {/* Messaging stream */}
            <div className="md:col-span-2 flex flex-col justify-between h-[480px]">
              {activeSupportUserId ? (
                <>
                  <div className="bg-slate-50 p-4 border-b border-slate-150">
                    <span className="text-xs font-extrabold text-slate-800 block">
                      Support ticket stream for: {users.find(u => u.id === activeSupportUserId)?.name}
                    </span>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/20">
                    {activeChatMessages.map((msg) => {
                      const isMe = msg.senderId === 'admin';
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-normal font-semibold ${
                            isMe
                              ? 'bg-slate-800 text-white rounded-tr-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                          }`}>
                            <span>{msg.text}</span>
                            <span className={`text-[9px] mt-1.5 block text-right font-normal ${
                              isMe ? 'text-slate-400' : 'text-slate-400'
                            }`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={handleSendSupportMessage} className="p-4 border-t border-slate-150 bg-white flex gap-2">
                    <input
                      type="text"
                      required
                      value={supportMessageText}
                      onChange={(e) => setSupportMessageText(e.target.value)}
                      placeholder="Type official support message..."
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-500/50 text-slate-900 font-bold text-xs"
                    />
                    <button
                      type="submit"
                      className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-white cursor-pointer shadow border-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs font-semibold">
                  <MessageSquare className="w-8 h-8 mb-2 text-slate-300" />
                  <span>Select a ticket convo on the left to start support chat.</span>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
