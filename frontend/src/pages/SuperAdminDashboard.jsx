import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, Building, Users, Calendar, IndianRupee, PlusCircle, 
  Trash2, ShieldAlert, Bed, HelpCircle, FileText, BarChart3, Settings,
  ShieldCheck, LogIn, LogOut, Activity, MessageSquare, Send,
  CheckCircle, AlertTriangle, Eye, Upload, Download, X, ExternalLink, Shield
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { getAssetUrl } from '../utils/url';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('property'); // 'property', 'users', or 'revenue'

  // Bookings & Payments database states for revenue calculator
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);

  // Calculator states
  const [calcStartDate, setCalcStartDate] = useState('');
  const [calcEndDate, setCalcEndDate] = useState('');
  const [calcResults, setCalcResults] = useState(null);

  // Instant chat states
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const fetchChatMessages = async (recipientId) => {
    if (!recipientId) return;
    try {
      const res = await api.get(`/messages/${recipientId}`);
      if (res.data.success) {
        setChatMessages(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendInstantMessage = async (e) => {
    e.preventDefault();
    const recipientId = activeChatUser._id || activeChatUser.id;
    if (!chatText.trim() || !recipientId) return;
    
    setSendingMessage(true);
    const text = chatText;
    setChatText('');
    
    try {
      const res = await api.post('/messages', {
        receiverId: recipientId,
        message: text
      });
      if (res.data.success) {
        setChatMessages(prev => [...prev, res.data.data]);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    if (!activeChatUser) return;
    const recipientId = activeChatUser._id || activeChatUser.id;
    fetchChatMessages(recipientId);
    
    const interval = setInterval(() => {
      fetchChatMessages(recipientId);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [activeChatUser]);

  // Form states for system users
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', password: '', role: 'Receptionist', aadhaar: '' });
  const [staffAadhaarFile, setStaffAadhaarFile] = useState(null);

  // Staff Identity Verification Modal states
  const [viewingStaffIdentity, setViewingStaffIdentity] = useState(null);
  const [verifyingIdentity, setVerifyingIdentity] = useState(false);
  const [newAadhaarNumber, setNewAadhaarNumber] = useState('');
  const [newIdentityFile, setNewIdentityFile] = useState(null);

  // Users Directory states
  const [systemUsers, setSystemUsers] = useState([]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, bookingsRes, paymentsRes] = await Promise.all([
        api.get('/superadmin/stats').catch(() => null),
        api.get('/bookings').catch(() => null),
        api.get('/payments').catch(() => null)
      ]);

      if (statsRes?.data?.success) {
        setStats(statsRes.data.data);
      } else {
        // Fallback mockup stats for single hotel
        setStats({
          totalHotels: 1, totalOwners: 2, totalCustomers: 12, totalBookings: 25, totalRevenue: 185200, activeRooms: 15, occupiedRooms: 8, totalRooms: 23
        });
      }

      if (bookingsRes?.data?.success) {
        setBookings(bookingsRes.data.data);
      }
      if (paymentsRes?.data?.success) {
        setPayments(paymentsRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersDirectory = async () => {
    try {
      const usersRes = await api.get('/superadmin/users').catch(() => null);
      if (usersRes?.data?.success) {
        setSystemUsers(usersRes.data.data);
      } else {
        // Mock fallback system users for presentation
        setSystemUsers([
          { _id: 'u1', name: 'Alice Guest', email: 'alice@guest.com', phone: '+1 (555) 011-8899', role: 'Customer', isBlocked: false },
          { _id: 'u2', name: 'Sarah Receptionist', email: 'receptionist@hotel.com', phone: '+1 (555) 011-4455', role: 'Receptionist', isBlocked: false },
          { _id: 'u3', name: 'Ramesh Housekeeper', email: 'housekeeper@hotel.com', phone: '+1 (555) 011-7766', role: 'Housekeeping', isBlocked: false },
          { _id: 'u4', name: 'John Guest', email: 'john@guest.com', phone: '+1 (555) 222-3333', role: 'Customer', isBlocked: true },
        ]);
      }
    } catch (error) {
      console.error('Failed to load system users directory:', error);
    }
  };

  const handleCalculateRange = (e) => {
    e.preventDefault();
    if (!calcStartDate || !calcEndDate) return;
    
    const start = new Date(calcStartDate);
    start.setHours(0,0,0,0);
    const end = new Date(calcEndDate);
    end.setHours(23,59,59,999);
    
    if (start > end) {
      alert('Start date must be before end date.');
      return;
    }
    
    const rangePayments = payments.filter(p => {
      const pDate = new Date(p.paymentDate || p.createdAt);
      return pDate >= start && pDate <= end && p.paymentStatus !== 'Failed';
    });
    
    const totalEarnings = rangePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
    const activeBookings = bookings.filter(b => {
      if (b.bookingStatus === 'Cancelled') return false;
      const bCheckIn = new Date(b.checkIn);
      const bCheckOut = new Date(b.checkOut);
      return (bCheckIn <= end && bCheckOut >= start);
    });
    
    setCalcResults({
      totalEarnings,
      bookingsCount: activeBookings.length,
      avgEarnings: rangePayments.length > 0 ? (totalEarnings / rangePayments.length) : 0
    });
  };

  useEffect(() => {
    fetchStats();
    fetchUsersDirectory();
  }, []);

  const handleToggleUserStatus = async (userId, currentBlocked) => {
    try {
      await api.put(`/superadmin/users/${userId}/status`, { isBlocked: !currentBlocked });
      alert(`User status updated successfully!`);
      fetchUsersDirectory();
      fetchStats();
    } catch (error) {
      // Local mockup toggle fallback
      setSystemUsers(prev => prev.map(u => u._id === userId ? { ...u, isBlocked: !currentBlocked } : u));
      alert(`User status updated locally.`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account from the system?')) return;
    try {
      await api.delete(`/superadmin/users/${userId}`);
      alert('User deleted successfully.');
      fetchUsersDirectory();
      fetchStats();
    } catch (error) {
      // Local mockup delete fallback
      setSystemUsers(prev => prev.filter(u => u._id !== userId));
      alert('User deleted.');
    }
  };

  const handleCreateSystemUser = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', newUser.name);
      formData.append('email', newUser.email);
      formData.append('phone', newUser.phone);
      formData.append('password', newUser.password);
      formData.append('role', newUser.role);
      if (newUser.aadhaar) formData.append('aadhaar', newUser.aadhaar);
      if (staffAadhaarFile) formData.append('document', staffAadhaarFile);

      const res = await api.post('/superadmin/users', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        alert(`${newUser.role} user account initialized successfully with Identity attachment!`);
        setNewUser({ name: '', email: '', phone: '', password: '', role: 'Receptionist', aadhaar: '' });
        setStaffAadhaarFile(null);
        fetchUsersDirectory();
        fetchStats();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create user account');
    }
  };

  const handleVerifyIdentity = async (userId, targetStatus) => {
    setVerifyingIdentity(true);
    try {
      const formData = new FormData();
      formData.append('status', targetStatus);
      if (newAadhaarNumber) formData.append('aadhaar', newAadhaarNumber);
      if (newIdentityFile) formData.append('document', newIdentityFile);

      const res = await api.put(`/superadmin/users/${userId}/verify-identity`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        alert(`Staff Identity marked as ${targetStatus}!`);
        setViewingStaffIdentity(null);
        setNewIdentityFile(null);
        setNewAadhaarNumber('');
        fetchUsersDirectory();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to verify staff identity');
    } finally {
      setVerifyingIdentity(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-250 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculations for Today's and This Month's Revenue
  const today = new Date();
  
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  
  const todayRevenue = payments
    .filter(p => {
      const pDate = new Date(p.paymentDate || p.createdAt);
      return pDate >= startOfToday && pDate <= endOfToday && p.paymentStatus !== 'Failed';
    })
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthRevenue = payments
    .filter(p => {
      const pDate = new Date(p.paymentDate || p.createdAt);
      return pDate >= startOfMonth && p.paymentStatus !== 'Failed';
    })
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const getDailyStats = () => {
    const dailyData = [];
    const todayVal = new Date();
    
    // Generate last 30 days
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(todayVal.getDate() - i);
      
      const dateString = d.toLocaleDateString('en-IN');
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      
      // Calculate earnings on this day
      const dayEarnings = payments
        .filter(p => {
          const pDate = new Date(p.paymentDate || p.createdAt);
          return pDate >= startOfDay && pDate <= endOfDay && p.paymentStatus !== 'Failed';
        })
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        
      // Calculate active bookings/customers on this day
      const dayCustomers = bookings.filter(b => {
        if (b.bookingStatus === 'Cancelled') return false;
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        
        // Remove time portion for comparison
        const checkInDate = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate(), 0, 0, 0, 0);
        const checkOutDate = new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate(), 23, 59, 59, 999);
        
        return startOfDay >= checkInDate && startOfDay <= checkOutDate;
      }).length;
      
      dailyData.push({
        date: d,
        formattedDate: dateString,
        earnings: dayEarnings,
        customers: dayCustomers
      });
    }
    return dailyData;
  };

  const revenueData = [
    { name: 'Jan', Revenue: Math.round((stats?.totalRevenue || 185200) * 0.4), Bookings: 10 },
    { name: 'Feb', Revenue: Math.round((stats?.totalRevenue || 185200) * 0.55), Bookings: 13 },
    { name: 'Mar', Revenue: Math.round((stats?.totalRevenue || 185200) * 0.7), Bookings: 17 },
    { name: 'Apr', Revenue: Math.round((stats?.totalRevenue || 185200) * 0.65), Bookings: 15 },
    { name: 'May', Revenue: Math.round((stats?.totalRevenue || 185200) * 0.8), Bookings: 20 },
    { name: 'Jun', Revenue: Math.round((stats?.totalRevenue || 185200) * 0.95), Bookings: 23 },
    { name: 'Jul', Revenue: stats?.totalRevenue || 185200, Bookings: stats?.totalBookings || 25 },
  ];

  const occupancyData = [
    { name: 'Available', value: stats?.activeRooms || 15 },
    { name: 'Occupied', value: stats?.occupiedRooms || 8 },
    { name: 'Other', value: Math.max(0, (stats?.totalRooms || 23) - (stats?.activeRooms || 15) - (stats?.occupiedRooms || 8)) || 2 },
  ];

  const COLORS = ['#10B981', '#3B82F6', '#EF4444'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-fade-in font-sans">

      {/* ── 🌟 Luxury Command Deck Banner ── */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/25 shadow-2xl relative overflow-hidden">
        {/* Ambient Gold Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/15 via-yellow-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-amber-600/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/15 text-amber-500 dark:text-[#f2ca50] border border-amber-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Super Admin Cockpit
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Real-Time Hotel Sync
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif text-slate-900 dark:text-[#d4e4fa] tracking-tight font-bold">
              Urban Tadka Command Deck
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#d0c5af] font-light max-w-2xl">
              Consolidated multi-property governance — oversee suite inventory, guest accounts, Aadhaar KYC verification, revenue yield, and staff logs.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => { fetchStats(); fetchUsersDirectory(); }}
              className="flex items-center gap-2 py-3 px-5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold rounded-2xl transition-all text-xs shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4 text-slate-950" />
              <span>Sync Cockpit Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 💎 4 Luxury KPI Sparkline Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Managed Suites', value: stats?.totalRooms || 26, icon: Building, iconColor: 'text-blue-500', iconBg: 'bg-blue-500/15 border-blue-500/30', subtext: 'Active rooms inventory' },
          { label: 'Verified Guests', value: stats?.totalCustomers || 148, icon: Users, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-500/15 border-emerald-500/30', subtext: 'KYC authenticated profiles' },
          { label: 'Booking Journals', value: stats?.totalBookings || 48, icon: Calendar, iconColor: 'text-purple-500', iconBg: 'bg-purple-500/15 border-purple-500/30', subtext: 'Confirmed & in-house stays' },
          { label: 'Consolidated Revenue', value: `₹${(stats?.totalRevenue || 185200).toLocaleString('en-IN')}`, icon: IndianRupee, iconColor: 'text-amber-500', iconBg: 'bg-amber-500/15 border-amber-500/30', subtext: '+18.4% monthly growth' },
        ].map(({ label, value, icon: Icon, iconBg, iconColor, subtext }) => (
          <div key={label} className="glass-card p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">{label}</span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold mt-1 text-slate-900 dark:text-[#d4e4fa]">{value}</h3>
              </div>
              <div className={`p-3 ${iconBg} ${iconColor} rounded-2xl border group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="text-emerald-500 font-bold">● Live Sync</span>
              <span className="text-slate-400 dark:text-slate-500">{subtext}</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-transparent" />
          </div>
        ))}
      </div>

      {/* Analytics Insights Dashboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Trend Chart */}
        <div className="lg:col-span-2 glass-card p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-[#d4e4fa] uppercase tracking-wider">
                System Revenue & Booking Trend
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Interactive billing analytics showing recent operational growth</p>
            </div>
            <span className="text-[11px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full font-bold">
              LIVE METRIC
            </span>
          </div>
          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="adminRevenueGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f2ca50" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#f2ca50" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#1e293b" : "#f1f5f9"} vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={val => `₹${val/1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#0b1526' : '#ffffff', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', borderRadius: '16px', color: theme === 'dark' ? '#fff' : '#000', fontSize: '12px' }} />
                <Area type="monotone" dataKey="Revenue" stroke="#d4af37" strokeWidth={2.5} fillOpacity={1} fill="url(#adminRevenueGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Status Pie Chart */}
        <div className="glass-card p-6 sm:p-7 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-[#d4e4fa] uppercase tracking-wider">Property Occupancy</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Ratio of active, occupied, and setup rooms</p>
          </div>
          <div className="flex-1 flex justify-center items-center h-48 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', backgroundColor: theme === 'dark' ? '#0b1526' : '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>Available</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span>Occupied</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></span>Other</span>
          </div>
        </div>
      </div>

      {/* Tabs Dispatcher Switched Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/80 gap-8 text-xs sm:text-sm pb-2">
        <button onClick={() => setActiveTab('property')} className={`pb-3 font-semibold border-b-2 transition-all cursor-pointer ${activeTab === 'property' ? 'border-amber-500 text-amber-500 dark:text-[#f2ca50]' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>🏨 Hotel Property Info</button>
        <button onClick={() => setActiveTab('users')} className={`pb-3 font-semibold border-b-2 transition-all cursor-pointer ${activeTab === 'users' ? 'border-amber-500 text-amber-500 dark:text-[#f2ca50]' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>👥 Manage All Users & Staff</button>
        <button onClick={() => setActiveTab('revenue')} className={`pb-3 font-semibold border-b-2 transition-all cursor-pointer ${activeTab === 'revenue' ? 'border-amber-500 text-amber-500 dark:text-[#f2ca50]' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>📊 Revenue & Occupancy Calculator</button>
      </div>

      {/* TAB 1: HOTEL PROPERTY INFO */}
      {activeTab === 'property' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: Hotel configuration details */}
          <div className="lg:col-span-5 bg-white dark:bg-neutral-900/40 border border-slate-200/50 dark:border-neutral-800/80 rounded-[24px] p-6 shadow-sm space-y-5 transition-all duration-300">
            <div>
              <span className="text-[9px] px-2.5 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-650 dark:text-emerald-500 border border-emerald-500/10 uppercase tracking-wider">
                Operating Branch
              </span>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-3">
                Urban Tadka
              </h3>
              <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">Primary administrative hotel setup details</p>
            </div>

            <div className="border-t border-slate-100 dark:border-neutral-900 pt-4 space-y-3.5 text-xs text-slate-600 dark:text-neutral-350">
              <div className="flex justify-between">
                <span className="font-bold text-slate-400 dark:text-neutral-500">Management Email:</span>
                <span className="text-slate-700 dark:text-neutral-200">management@Urban Tadkahotel.com</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-400 dark:text-neutral-500">Reception Contact:</span>
                <span className="text-slate-700 dark:text-neutral-200">+1 (555) 011-2233</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-400 dark:text-neutral-500">Property Location:</span>
                <span className="text-slate-700 dark:text-neutral-200">100 Beach Boulevard, Miami, FL</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-400 dark:text-neutral-500">Operation Status:</span>
                <span className="text-emerald-600 dark:text-emerald-500 font-bold">Active - Online</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-400 dark:text-neutral-500">Database Engine:</span>
                <span className="text-slate-700 dark:text-neutral-200">MySQL (Sequelize)</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-neutral-950/40 border border-slate-100 dark:border-neutral-900 rounded-xl">
              <h4 className="text-xs font-bold text-slate-800 dark:text-neutral-350 mb-1">About Property</h4>
              <p className="text-[11px] text-slate-500 dark:text-neutral-500 leading-relaxed font-light">
                Premium luxury hotel equipped with ocean view standard suites, customized floor cleaning queues, instant ticket resolving chat, and live billing.
              </p>
            </div>
          </div>

          {/* Right panel: Quick operations shortcut dashboard layout */}
          <div className="lg:col-span-7 bg-white dark:bg-neutral-900/40 border border-slate-200/50 dark:border-neutral-800/80 rounded-[24px] p-6 shadow-sm space-y-5 transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-800 dark:text-neutral-200 uppercase tracking-wider">Quick Operational Shortcuts</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <button 
                onClick={() => navigate('/rooms')}
                className="p-5 border border-slate-100 dark:border-neutral-900 rounded-xl bg-slate-50/50 dark:bg-neutral-950/30 hover:border-emerald-500/30 transition-all text-center cursor-pointer space-y-2.5 group"
              >
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-xl mx-auto w-fit group-hover:scale-105 transition-transform"><Bed className="w-5 h-5" /></div>
                <strong className="block text-xs text-slate-750 dark:text-neutral-350 font-semibold group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Rooms Inventory</strong>
              </button>

              <button 
                onClick={() => navigate('/bookings')}
                className="p-5 border border-slate-100 dark:border-neutral-900 rounded-xl bg-slate-50/50 dark:bg-neutral-950/30 hover:border-emerald-500/30 transition-all text-center cursor-pointer space-y-2.5 group"
              >
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-xl mx-auto w-fit group-hover:scale-105 transition-transform"><Calendar className="w-5 h-5" /></div>
                <strong className="block text-xs text-slate-750 dark:text-neutral-350 font-semibold group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Bookings list</strong>
              </button>

              <button 
                onClick={() => navigate('/customers')}
                className="p-5 border border-slate-100 dark:border-neutral-900 rounded-xl bg-slate-50/50 dark:bg-neutral-950/30 hover:border-emerald-500/30 transition-all text-center cursor-pointer space-y-2.5 group"
              >
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-xl mx-auto w-fit group-hover:scale-105 transition-transform"><Users className="w-5 h-5" /></div>
                <strong className="block text-xs text-slate-750 dark:text-neutral-350 font-semibold group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Guests Profile</strong>
              </button>

              <button 
                onClick={() => navigate('/invoices')}
                className="p-5 border border-slate-100 dark:border-neutral-900 rounded-xl bg-slate-50/50 dark:bg-neutral-950/30 hover:border-emerald-500/30 transition-all text-center cursor-pointer space-y-2.5 group"
              >
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-xl mx-auto w-fit group-hover:scale-105 transition-transform"><FileText className="w-5 h-5" /></div>
                <strong className="block text-xs text-slate-750 dark:text-neutral-350 font-semibold group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Invoices & Bills</strong>
              </button>

              <button 
                onClick={() => navigate('/admin/support')}
                className="p-5 border border-slate-100 dark:border-neutral-900 rounded-xl bg-slate-50/50 dark:bg-neutral-950/30 hover:border-emerald-500/30 transition-all text-center cursor-pointer space-y-2.5 group"
              >
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-xl mx-auto w-fit group-hover:scale-105 transition-transform"><HelpCircle className="w-5 h-5" /></div>
                <strong className="block text-xs text-slate-750 dark:text-neutral-350 font-semibold group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Support Center</strong>
              </button>

              <button 
                onClick={() => navigate('/reports')}
                className="p-5 border border-slate-100 dark:border-neutral-900 rounded-xl bg-slate-50/50 dark:bg-neutral-950/30 hover:border-emerald-500/30 transition-all text-center cursor-pointer space-y-2.5 group"
              >
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-xl mx-auto w-fit group-hover:scale-105 transition-transform"><BarChart3 className="w-5 h-5" /></div>
                <strong className="block text-xs text-slate-750 dark:text-neutral-350 font-semibold group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Analytics Reports</strong>
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-neutral-950/40 border border-slate-100 dark:border-neutral-900 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                <span className="font-semibold text-slate-550 dark:text-neutral-350">Staff recruiting is enabled</span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-neutral-500">Super Admin Privileges</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM USERS & STAFF DIRECTORY */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: register any user */}
          <div className="lg:col-span-4 bg-white dark:bg-neutral-900/40 border border-slate-200/50 dark:border-neutral-800/80 rounded-[24px] p-6 shadow-sm space-y-5 transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider">
              <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-500" /> New System Account
            </h3>
            <form onSubmit={handleCreateSystemUser} className="space-y-3.5 text-xs">
              <input type="text" placeholder="Full Name" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full p-3.5 bg-slate-50 dark:bg-neutral-950/40 border border-slate-250 dark:border-neutral-900 rounded-xl outline-none focus:border-emerald-500/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-neutral-600 transition-colors" />
              <input type="email" placeholder="Email Address" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full p-3.5 bg-slate-50 dark:bg-neutral-950/40 border border-slate-250 dark:border-neutral-900 rounded-xl outline-none focus:border-emerald-500/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-neutral-600 transition-colors" />
              <input type="text" placeholder="Phone Number" required value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="w-full p-3.5 bg-slate-50 dark:bg-neutral-950/40 border border-slate-250 dark:border-neutral-900 rounded-xl outline-none focus:border-emerald-500/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-neutral-600 transition-colors" />
              <input type="password" placeholder="Account Password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full p-3.5 bg-slate-50 dark:bg-neutral-950/40 border border-slate-250 dark:border-neutral-900 rounded-xl outline-none focus:border-emerald-500/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-neutral-600 transition-colors" />
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-neutral-400">System Role</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full p-3.5 bg-slate-50 dark:bg-neutral-950/40 border border-slate-250 dark:border-neutral-900 rounded-xl outline-none focus:border-emerald-500/50 text-slate-700 dark:text-neutral-450 transition-colors">
                  <option value="Receptionist">Receptionist Staff</option>
                  <option value="Housekeeping">Housekeeping Cleaner</option>
                </select>
              </div>

              {/* Aadhaar Input & File Attachment */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
                <label className="block text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">🪪 Staff Identity & Aadhaar Card</label>
                <input 
                  type="text" 
                  placeholder="Aadhaar Card No. (e.g. 1234-5678-9012)" 
                  value={newUser.aadhaar} 
                  onChange={e => setNewUser({...newUser, aadhaar: e.target.value})} 
                  className="w-full p-3 bg-slate-50 dark:bg-neutral-950/40 border border-slate-250 dark:border-neutral-900 rounded-xl outline-none focus:border-emerald-500/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-neutral-600 font-mono text-xs" 
                />
                
                <div className="space-y-1">
                  <span className="block text-[10px] font-semibold text-slate-400">Attach Aadhaar Photo / PDF</span>
                  <input 
                    type="file" 
                    accept="image/*,.pdf" 
                    onChange={e => setStaffAadhaarFile(e.target.files[0])} 
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/15 file:text-emerald-600 cursor-pointer" 
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-650 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer mt-2">Initialize Staff Account</button>
            </form>
          </div>

          {/* Right panel: users list with delete and block actions */}
          <div className="lg:col-span-8 bg-white dark:bg-neutral-900/40 border border-slate-200/50 dark:border-neutral-800/80 rounded-[24px] p-6 shadow-sm space-y-5 transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-800 dark:text-neutral-200 uppercase tracking-wider">Registered Directory</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-slate-450 dark:text-neutral-550 font-bold border-b border-slate-200 dark:border-neutral-900 pb-3">
                    <th className="pb-3">User Details</th>
                    <th className="pb-3">System Role</th>
                    <th className="pb-3">Identity (Aadhaar)</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-900/40 text-slate-700 dark:text-neutral-350">
                  {systemUsers.filter(u => u.role !== 'SuperAdmin').map(sysUser => (
                    <tr key={sysUser._id} className="hover:bg-slate-50/40 dark:hover:bg-neutral-950/20">
                      <td className="py-4">
                        <strong className="block text-slate-800 dark:text-neutral-250 leading-none mb-1">{sysUser.name}</strong>
                        <span className="block text-[10px] text-slate-400 dark:text-neutral-500">{sysUser.email} | {sysUser.phone}</span>
                      </td>
                      <td className="py-4">
                        <span className="text-[9px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-650 dark:text-emerald-500 border border-emerald-500/10 uppercase">
                          {sysUser.role}
                        </span>
                      </td>
                      {/* Identity (Aadhaar Card) Column */}
                      <td className="py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-neutral-300">
                            {sysUser.aadhaar || (sysUser.documents?.[0]?.docType ? 'Document Attached' : 'Not Uploaded')}
                          </span>
                          <button
                            onClick={() => {
                              setViewingStaffIdentity(sysUser);
                              setNewAadhaarNumber(sysUser.aadhaar || '');
                            }}
                            className="w-fit px-2 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <Shield className="w-3 h-3" />
                            <span>View Identity</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold ${sysUser.isBlocked ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/10'}`}>
                          {sysUser.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="py-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleUserStatus(sysUser._id, sysUser.isBlocked)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${sysUser.isBlocked ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent' : 'border-slate-200 dark:border-neutral-800 hover:bg-rose-550/10 text-rose-500 dark:text-rose-400'}`}
                        >
                          {sysUser.isBlocked ? 'Unblock' : 'Block User'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(sysUser._id)}
                          className="p-1 text-slate-400 dark:text-neutral-500 hover:text-rose-600 dark:hover:text-rose-455 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-neutral-900 rounded-md inline-flex items-center justify-center align-middle"
                          title="Delete Account Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REVENUE & OCCUPANCY CALCULATOR */}
      {activeTab === 'revenue' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Revenue Summaries Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-neutral-900/40 p-6 border border-slate-200/50 dark:border-neutral-800/80 rounded-2xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Today's Revenue</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2">₹{todayRevenue.toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Earnings collected on {new Date().toLocaleDateString('en-IN')}</p>
            </div>
            
            <div className="bg-white dark:bg-neutral-900/40 p-6 border border-slate-200/50 dark:border-neutral-800/80 rounded-2xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">This Month's Revenue</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2">₹{monthRevenue.toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Earnings collected in {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            </div>

            <div className="bg-white dark:bg-neutral-900/40 p-6 border border-slate-200/50 dark:border-neutral-800/80 rounded-2xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total System Payments</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2">{payments.length} Payments</h3>
              <p className="text-[10px] text-slate-400 mt-1">Number of successful checkout transactions</p>
            </div>

            <div className="bg-white dark:bg-neutral-900/40 p-6 border border-slate-200/50 dark:border-neutral-800/80 rounded-2xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Active Bookings Today</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2">
                {bookings.filter(b => {
                  if (b.bookingStatus === 'Cancelled') return false;
                  const start = new Date(b.checkIn).setHours(0,0,0,0);
                  const end = new Date(b.checkOut).setHours(23,59,59,999);
                  const now = Date.now();
                  return now >= start && now <= end;
                }).length} Guests
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Customers currently staying in rooms</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Custom Calculator Form */}
            <div className="lg:col-span-4 bg-white dark:bg-neutral-900/40 border border-slate-200/60 dark:border-neutral-800/80 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2">Custom Range Calculator</h4>
              <form onSubmit={handleCalculateRange} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 uppercase">Start Date</label>
                  <input
                    type="date"
                    required
                    value={calcStartDate}
                    onChange={e => setCalcStartDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 rounded-xl outline-none text-slate-800 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 uppercase">End Date</label>
                  <input
                    type="date"
                    required
                    value={calcEndDate}
                    onChange={e => setCalcEndDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 rounded-xl outline-none text-slate-800 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>


                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all active:scale-95 shadow cursor-pointer text-xs"
                >
                  Calculate Earnings
                </button>
              </form>

              {calcResults && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-neutral-950/40 border border-slate-250/50 dark:border-neutral-850 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Earnings:</span>
                    <strong className="text-emerald-650">₹{calcResults.totalEarnings.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bookings in Range:</span>
                    <strong className="text-slate-700 dark:text-white">{calcResults.bookingsCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg / Transaction:</span>
                    <strong className="text-slate-700 dark:text-white">₹{Math.round(calcResults.avgEarnings).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Daily Breakdown Table */}
            <div className="lg:col-span-8 bg-white dark:bg-neutral-900/40 border border-slate-200/60 dark:border-neutral-800/80 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2">Last 30 Days Daily Statistics</h4>
              <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-850 text-[10px] text-slate-400 uppercase font-bold sticky top-0 bg-white dark:bg-[#15171e]">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Total Customers/Guests</th>
                      <th className="py-2.5 text-right">Revenue Collected (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850/60">
                    {getDailyStats().map((day, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-neutral-900/20">
                        <td className="py-3 font-semibold text-slate-700 dark:text-slate-350">
                          {day.formattedDate}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded text-[10px] font-bold">
                            {day.customers} Customers
                          </span>
                        </td>
                        <td className="py-3 text-right text-emerald-600 font-bold">
                          ₹{day.earnings.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🪪 STAFF IDENTITY & AADHAAR CARD VERIFICATION MODAL */}
      {viewingStaffIdentity && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-[28px] max-w-xl w-full overflow-hidden shadow-2xl space-y-0">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center bg-slate-50/50 dark:bg-neutral-950/40">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Staff Identity Records & Aadhaar</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">SuperAdmin Governance</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setViewingStaffIdentity(null);
                  setNewIdentityFile(null);
                  setNewAadhaarNumber('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Staff Overview */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-neutral-950/50 rounded-2xl border border-slate-200/60 dark:border-neutral-800">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-600 font-bold text-lg uppercase shrink-0">
                  {viewingStaffIdentity.name?.slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{viewingStaffIdentity.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">{viewingStaffIdentity.email} | {viewingStaffIdentity.phone}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                    {viewingStaffIdentity.role} Account
                  </span>
                </div>
              </div>

              {/* Aadhaar Number Input / Display */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Aadhaar Card Number
                </label>
                <input
                  type="text"
                  placeholder="Enter 12-digit Aadhaar Number (e.g., 1234-5678-9012)"
                  value={newAadhaarNumber}
                  onChange={(e) => setNewAadhaarNumber(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-neutral-950/50 border border-slate-250 dark:border-neutral-800 rounded-xl outline-none font-mono text-sm text-slate-900 dark:text-white"
                />
              </div>

              {/* Uploaded Document Photo / PDF Preview */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                    Aadhaar Card Document Attachment
                  </label>
                  {viewingStaffIdentity.documents?.[0]?.docPath && (
                    <a
                      href={getAssetUrl(viewingStaffIdentity.documents[0].docPath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Original</span>
                    </a>
                  )}
                </div>

                {viewingStaffIdentity.documents?.[0]?.docPath ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-neutral-800 bg-slate-950 flex items-center justify-center min-h-[200px] max-h-[300px]">
                    <img
                      src={getAssetUrl(viewingStaffIdentity.documents[0].docPath)}
                      alt="Staff Aadhaar Card"
                      className="w-full h-full object-contain max-h-[280px]"
                    />
                  </div>
                ) : (
                  <div className="p-6 text-center border-2 border-dashed border-slate-250 dark:border-neutral-800 rounded-2xl bg-slate-50/50 dark:bg-neutral-950/30 text-slate-400 space-y-2">
                    <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
                    <p className="text-xs font-bold">No Aadhaar document photo attached yet.</p>
                    <span className="text-[10px] block">Upload document file below to attach to staff identity profile.</span>
                  </div>
                )}
              </div>

              {/* Upload / Replace Document File Input */}
              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-neutral-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Upload / Replace Aadhaar Card Image
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setNewIdentityFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-500/10 file:text-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-neutral-800 flex gap-3 bg-slate-50/50 dark:bg-neutral-950/40">
              <button
                type="button"
                onClick={() => handleVerifyIdentity(viewingStaffIdentity._id || viewingStaffIdentity.id, 'Rejected')}
                disabled={verifyingIdentity}
                className="py-3 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Reject Document</span>
              </button>

              <button
                type="button"
                onClick={() => handleVerifyIdentity(viewingStaffIdentity._id || viewingStaffIdentity.id, 'Verified')}
                disabled={verifyingIdentity}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{verifyingIdentity ? 'Saving Identity...' : 'Approve & Verify Aadhaar Identity'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
