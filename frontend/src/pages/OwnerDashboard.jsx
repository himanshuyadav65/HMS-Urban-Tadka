import React, { useEffect, useState } from 'react';
import { 
  RefreshCw, Building, Users, Calendar, IndianRupee, PlusCircle, 
  Star, Sparkles, TrendingUp, ShieldCheck, CheckCircle2, 
  Clock, ArrowUpRight, BedDouble, Key, Coffee, Sparkle, AlertCircle, ChevronRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFloor, setSelectedFloor] = useState('all');

  const [newStaff, setNewStaff] = useState({ name: '', email: '', phone: '', password: '', role: 'Receptionist', hotelId: '' });
  const [newCategory, setNewCategory] = useState({ name: '', basePrice: '', capacity: '2', amenities: '', description: '', hotelId: '' });
  const [staffMembers, setStaffMembers] = useState([]);

  const myHotels = [
    { id: 'h1', name: 'Urban Tadka', location: 'Paradise Valley, Luxury Coast', rating: 4.9, rooms: 26, email: 'concierge@Urban Tadkahotel.com', phone: '+1 (555) 019-2834', desc: 'A flagship 5-star luxury experience featuring signature suites and personalized 24/7 concierge.' },
    { id: 'h2', name: 'Oasis Bay Boutique Inn', location: 'Goa Coastline, India', rating: 4.8, rooms: 14, email: 'contact@oasisbay.com', phone: '+91 98765 43210', desc: 'A serene boutique retreat located along tranquil coastal waves with authentic luxury heritage suites.' }
  ];

  const inventoryRooms = [
    { id: 'r1', roomNumber: '101', type: 'Presidential Suite', floor: 1, price: 15500, status: 'VIP Reserved', guest: 'Lady Eleanor Vance' },
    { id: 'r2', roomNumber: '102', type: 'Executive Suite', floor: 1, price: 9200, status: 'Occupied', guest: 'Dr. Harrison Wells' },
    { id: 'r3', roomNumber: '103', type: 'Deluxe Ocean View', floor: 1, price: 6500, status: 'Cleaning', guest: 'Departed (11:00 AM)' },
    { id: 'r4', roomNumber: '104', type: 'Royal King Suite', floor: 1, price: 8200, status: 'Available', guest: 'Ready for check-in' },
    { id: 'r5', roomNumber: '201', type: 'Deluxe Suite', floor: 2, price: 5800, status: 'Available', guest: 'Ready for check-in' },
    { id: 'r6', roomNumber: '202', type: 'Executive Suite', floor: 2, price: 9200, status: 'Occupied', guest: 'Marcus Aurelius Sterling' },
    { id: 'r7', roomNumber: '203', type: 'Standard Luxury', floor: 2, price: 4200, status: 'Occupied', guest: 'Sophia & Liam Dubois' },
    { id: 'r8', roomNumber: '301', type: 'Presidential Penthouse', floor: 3, price: 24000, status: 'Occupied', guest: 'Sheikh Al-Maktoum' },
    { id: 'r9', roomNumber: '302', type: 'Premium Suite', floor: 3, price: 11500, status: 'Maintenance', guest: 'A/C Filtration Check' },
  ];

  const dynamicStaff = staffMembers.length > 0 ? staffMembers : [
    { id: 's1', name: 'Priya Nair', email: 'priya@Urban Tadkahotel.com', phone: '+91 91234 56789', role: 'Head Concierge & Reception' },
    { id: 's2', name: 'Ramesh Kumar', email: 'ramesh@Urban Tadkahotel.com', phone: '+91 92234 56789', role: 'Lead Housekeeper' },
    { id: 's3', name: 'Amit Sharma', email: 'amit@oasisbay.com', phone: '+91 93234 56789', role: 'Front Desk Lead' },
    { id: 's4', name: 'Elena Rostova', email: 'elena@Urban Tadkahotel.com', phone: '+91 94555 12345', role: 'Guest Experience Executive' }
  ];

  const ownerBookings = [
    { id: 'b1', guestName: 'Lady Eleanor Vance', roomNumber: '101', checkIn: '2026-08-08', checkOut: '2026-08-14', amount: 93000, status: 'CheckedIn', isVip: true, keycard: 'Active #089' },
    { id: 'b2', guestName: 'Marcus Aurelius Sterling', roomNumber: '202', checkIn: '2026-08-07', checkOut: '2026-08-11', amount: 36800, status: 'Confirmed', isVip: true, keycard: 'Active #112' },
    { id: 'b3', guestName: 'Sophia & Liam Dubois', roomNumber: '203', checkIn: '2026-08-06', checkOut: '2026-08-09', amount: 16800, status: 'CheckedIn', isVip: false, keycard: 'Active #045' },
    { id: 'b4', guestName: 'Dr. Harrison Wells', roomNumber: '102', checkIn: '2026-08-08', checkOut: '2026-08-12', amount: 36800, status: 'CheckedIn', isVip: false, keycard: 'Active #091' },
    { id: 'b5', guestName: 'Kris Black & Family', roomNumber: '104', checkIn: '2026-08-05', checkOut: '2026-08-08', amount: 24600, status: 'CheckedOut', isVip: false, keycard: 'Returned' }
  ];

  const revenueData = [
    { name: 'Mon', Revenue: 82000, Occupancy: 84, Bookings: 14 },
    { name: 'Tue', Revenue: 94000, Occupancy: 88, Bookings: 18 },
    { name: 'Wed', Revenue: 118000, Occupancy: 91, Bookings: 22 },
    { name: 'Thu', Revenue: 145000, Occupancy: 94, Bookings: 28 },
    { name: 'Fri', Revenue: 182000, Occupancy: 98, Bookings: 34 },
    { name: 'Sat', Revenue: 215000, Occupancy: 100, Bookings: 38 },
    { name: 'Sun', Revenue: 168000, Occupancy: 95, Bookings: 30 }
  ];

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, staffRes] = await Promise.all([
        api.get('/owner/stats').catch(() => null),
        api.get('/owner/staff').catch(() => null)
      ]);
      if (statsRes?.data?.success) setStats(statsRes.data.data);
      if (staffRes?.data?.success) setStaffMembers(staffRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const amenitiesArr = newCategory.amenities.split(',').map(a => a.trim());
      await api.post('/owner/room-categories', {
        ...newCategory,
        basePrice: parseFloat(newCategory.basePrice),
        capacity: parseInt(newCategory.capacity),
        amenities: amenitiesArr
      });
      alert('Room category added successfully!');
      setNewCategory({ name: '', basePrice: '', capacity: '2', amenities: '', description: '', hotelId: '' });
    } catch (error) {
      alert('Failed to create category');
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/owner/staff', newStaff);
      if (res.data.success) {
        alert('Staff user registered successfully!');
        setNewStaff({ name: '', email: '', phone: '', password: '', role: 'Receptionist', hotelId: '' });
        fetchStats();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create staff user');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="relative flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-amber-500 tracking-widest uppercase animate-pulse">Syncing Palace Data...</span>
        </div>
      </div>
    );
  }

  const filteredRooms = selectedFloor === 'all' 
    ? inventoryRooms 
    : inventoryRooms.filter(r => r.floor.toString() === selectedFloor);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-fade-in">
      
      {/* 🌟 Luxury Command Bar & Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-amber-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/15 text-amber-500 dark:text-[#f2ca50] border border-amber-500/30">
                <Sparkles className="w-3 h-3 animate-spin" /> Executive Luxury Deck
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Real-Time Sync
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-serif text-slate-900 dark:text-[#d4e4fa] tracking-tight font-bold">
              Urban Tadka Owner Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#d0c5af] font-light max-w-2xl">
              Consolidated luxury analytics, active suite matrix, VIP guest logs, and high-fidelity staff administration.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={fetchStats} 
              className="flex items-center gap-2 py-3 px-5 bg-white dark:bg-[#0b1526] border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 text-slate-800 dark:text-[#d4e4fa] rounded-2xl transition-all text-xs font-semibold shadow-sm hover:shadow-amber-500/10 cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4 text-amber-500" />
              <span>Refresh Metrics</span>
            </button>
            <button 
              onClick={() => setActiveTab('rooms')}
              className="flex items-center gap-2 py-3 px-5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold rounded-2xl transition-all text-xs shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>Add Room / Category</span>
            </button>
          </div>
        </div>
      </div>

      {/* 💎 KPI Performance Metrics Cards with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Consolidated Revenue */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Consolidated Revenue</span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold mt-1 text-slate-900 dark:text-[#d4e4fa]">
                ₹{(stats?.totalRevenue || 148920).toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/15 text-amber-500 rounded-2xl border border-amber-500/30 group-hover:scale-110 transition-transform">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center text-emerald-500 font-bold">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +18.4%
            </span>
            <span className="text-slate-400 dark:text-slate-500">vs previous period</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-transparent" />
        </div>

        {/* Metric 2: Live Room Occupancy */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Live Suite Occupancy</span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold mt-1 text-slate-900 dark:text-[#d4e4fa]">
                92.5%
              </h3>
            </div>
            <div className="p-3 bg-blue-500/15 text-blue-500 rounded-2xl border border-blue-500/30 group-hover:scale-110 transition-transform">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-blue-500 font-bold">24 / 26 Suites</span>
            <span className="text-slate-400 dark:text-slate-500">currently filled</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-transparent" />
        </div>

        {/* Metric 3: Active In-House Guests */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">In-House Guests</span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold mt-1 text-slate-900 dark:text-[#d4e4fa]">
                {stats?.totalBookings ? stats.totalBookings * 2 : 48} Guests
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/15 text-emerald-500 rounded-2xl border border-emerald-500/30 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-emerald-500 font-bold">100% Verified KYC</span>
            <span className="text-slate-400 dark:text-slate-500">identity secured</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-transparent" />
        </div>

        {/* Metric 4: Housekeeping & Turnaround Index */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Staff Efficiency</span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold mt-1 text-slate-900 dark:text-[#d4e4fa]">
                98.2%
              </h3>
            </div>
            <div className="p-3 bg-purple-500/15 text-purple-500 rounded-2xl border border-purple-500/30 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-purple-500 font-bold">24 min avg</span>
            <span className="text-slate-400 dark:text-slate-500">suite turnover rate</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-400 to-transparent" />
        </div>
      </div>

      {/* 🧭 Luxury Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/80 gap-8 text-xs sm:text-sm overflow-x-auto pb-2">
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`pb-3 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'overview' 
              ? 'border-amber-500 text-amber-500 dark:text-[#f2ca50]' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>📊 Weekly Revenue Matrix</span>
        </button>
        <button 
          onClick={() => setActiveTab('matrix')} 
          className={`pb-3 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'matrix' 
              ? 'border-amber-500 text-amber-500 dark:text-[#f2ca50]' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>🗝️ Live Suite Floor Matrix</span>
        </button>
        <button 
          onClick={() => setActiveTab('hotels')} 
          className={`pb-3 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'hotels' 
              ? 'border-amber-500 text-amber-500 dark:text-[#f2ca50]' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>🏨 Hotel Properties Registry</span>
        </button>
        <button 
          onClick={() => setActiveTab('rooms')} 
          className={`pb-3 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'rooms' 
              ? 'border-amber-500 text-amber-500 dark:text-[#f2ca50]' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>🔑 Manage Room Inventory</span>
        </button>
        <button 
          onClick={() => setActiveTab('staff')} 
          className={`pb-3 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'staff' 
              ? 'border-amber-500 text-amber-500 dark:text-[#f2ca50]' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>👥 Hotel Staff Administration</span>
        </button>
        <button 
          onClick={() => setActiveTab('bookings')} 
          className={`pb-3 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'bookings' 
              ? 'border-amber-500 text-amber-500 dark:text-[#f2ca50]' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>📅 VIP Booking Timeline</span>
        </button>
      </div>

      {/* 📈 TAB 1: OVERVIEW & REVENUE ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Revenue Trend Area Chart */}
            <div className="lg:col-span-2 glass-card p-6 sm:p-7 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-[#d4e4fa] uppercase tracking-wider">
                    Weekly Revenue & Yield Performance
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Live booking yield across all suites</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <TrendingUp className="w-3.5 h-3.5" /> High Demand Peak
                </div>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="luxuryGoldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f2ca50" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f2ca50" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#1e293b" : "#e2e8f0"} vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#0b1526' : '#ffffff', 
                        borderColor: theme === 'dark' ? '#334155' : '#cbd5e1', 
                        borderRadius: '16px', 
                        color: theme === 'dark' ? '#fff' : '#000',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                      }} 
                    />
                    <Area type="monotone" dataKey="Revenue" stroke="#d4af37" strokeWidth={3} fillOpacity={1} fill="url(#luxuryGoldGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Occupancy Donut Breakdown */}
            <div className="glass-card p-6 sm:p-7 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-[#d4e4fa] uppercase tracking-wider">
                  Live Suite Distribution
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Real-time room occupancy state</p>
              </div>

              <div className="flex-1 flex justify-center items-center h-48 relative">
                <PieChart width={220} height={170}>
                  <Pie 
                    data={[
                      { name: 'Available', value: 12 },
                      { name: 'Occupied', value: 9 },
                      { name: 'Cleaning', value: 3 },
                      { name: 'Maintenance', value: 2 },
                    ]} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={50} 
                    outerRadius={75} 
                    dataKey="value" 
                    stroke="none"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#3b82f6" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Total</span>
                  <span className="text-xl font-bold font-serif text-slate-900 dark:text-[#d4e4fa]">26 Suites</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available (12)</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Occupied (9)</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Cleaning (3)</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Maintenance (2)</div>
              </div>
            </div>
          </div>

          {/* Quick VIP Arrival Summary Table */}
          <div className="glass-card p-6 sm:p-7 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-[#d4e4fa] uppercase tracking-wider">
                  Recent High-Value VIP Check-Ins
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Keycard access and hospitality timeline</p>
              </div>
              <button 
                onClick={() => setActiveTab('bookings')}
                className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
              >
                View Full Journals <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase pb-3">
                    <th className="pb-3">Guest Profile</th>
                    <th className="pb-3">Suite #</th>
                    <th className="pb-3">Stay Timeline</th>
                    <th className="pb-3">Amount Settled</th>
                    <th className="pb-3">Digital Keycard</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {ownerBookings.slice(0, 3).map(ob => (
                    <tr key={ob.id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="py-4 font-semibold text-slate-900 dark:text-[#d4e4fa] flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-bold flex items-center justify-center text-xs">
                          {ob.guestName.charAt(0)}
                        </span>
                        <div>
                          <div>{ob.guestName}</div>
                          {ob.isVip && <span className="text-[10px] text-amber-500 font-bold">★ VIP Tier 1</span>}
                        </div>
                      </td>
                      <td className="py-4 font-bold text-amber-500 dark:text-[#f2ca50]">Suite {ob.roomNumber}</td>
                      <td className="py-4 text-slate-500 dark:text-slate-400">{ob.checkIn} → {ob.checkOut}</td>
                      <td className="py-4 font-mono font-bold text-emerald-500">₹{ob.amount.toLocaleString('en-IN')}</td>
                      <td className="py-4 font-mono text-xs">{ob.keycard}</td>
                      <td className="py-4 text-right">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {ob.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 🗝️ TAB 2: LIVE SUITE FLOOR MATRIX (Stitch Design Feature) */}
      {activeTab === 'matrix' && (
        <div className="glass-card p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-serif font-bold text-slate-900 dark:text-[#d4e4fa]">
                Interactive Suite Matrix & Live Floor Plan
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Real-time occupancy status, room types, and keycard availability across all levels.
              </p>
            </div>

            {/* Floor Filter Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#060e1a] p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setSelectedFloor('all')} 
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedFloor === 'all' 
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Floors
              </button>
              <button 
                onClick={() => setSelectedFloor('1')} 
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedFloor === '1' 
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Floor 1
              </button>
              <button 
                onClick={() => setSelectedFloor('2')} 
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedFloor === '2' 
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Floor 2
              </button>
              <button 
                onClick={() => setSelectedFloor('3')} 
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedFloor === '3' 
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Floor 3 (Penthouse)
              </button>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map(room => {
              const isAvailable = room.status === 'Available';
              const isOccupied = room.status === 'Occupied';
              const isVip = room.status === 'VIP Reserved';
              const isCleaning = room.status === 'Cleaning';
              const isMaintenance = room.status === 'Maintenance';

              return (
                <div 
                  key={room.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group hover:scale-[1.02] ${
                    isVip 
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10' 
                      : isOccupied 
                      ? 'bg-blue-500/10 border-blue-500/30' 
                      : isAvailable 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : isCleaning 
                      ? 'bg-amber-500/10 border-amber-500/30' 
                      : 'bg-rose-500/10 border-rose-500/30'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Floor {room.floor}</span>
                      <h4 className="text-xl font-serif font-bold text-slate-900 dark:text-[#d4e4fa]">Suite {room.roomNumber}</h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{room.type}</span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                      isVip ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 animate-pulse' :
                      isOccupied ? 'bg-blue-500/20 text-blue-500 border-blue-500/40' :
                      isAvailable ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40' :
                      isCleaning ? 'bg-amber-500/20 text-amber-500 border-amber-500/40' :
                      'bg-rose-500/20 text-rose-500 border-rose-500/40'
                    }`}>
                      {room.status}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/60 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Current Assignment</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{room.guest}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Nightly Rate</span>
                      <span className="font-mono font-bold text-amber-500">₹{room.price.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🏨 TAB 3: RESORTS REGISTRY */}
      {activeTab === 'hotels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myHotels.map(h => (
            <div key={h.id} className="glass-card p-7 space-y-5 relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-2xl font-serif font-bold text-slate-900 dark:text-[#d4e4fa]">{h.name}</h4>
                  <span className="text-xs text-amber-500 font-semibold">{h.location}</span>
                </div>
                <span className="flex items-center gap-1 text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 px-3 py-1 rounded-full text-xs font-bold shadow-md shadow-amber-500/20">
                  <Star className="w-3.5 h-3.5 fill-current" /> {h.rating}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-light">{h.desc}</p>
              
              <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-5 text-slate-600 dark:text-slate-300">
                <div className="p-3 rounded-xl bg-slate-500/5">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Active Inventory</span>
                  <strong className="text-amber-500 text-sm">{h.rooms} Luxury Suites</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-500/5">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">VIP Concierge Desk</span>
                  <strong className="text-slate-800 dark:text-slate-200 text-xs">{h.phone}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🔑 TAB 4: ROOM CATEGORIES & INVENTORY */}
      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 glass-card p-6 sm:p-7 space-y-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-[#d4e4fa] flex items-center gap-2 uppercase tracking-wider">
              <PlusCircle className="w-4 h-4 text-amber-500" /> New Room Category
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Category Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Royal Ocean Penthouse" 
                  required 
                  value={newCategory.name} 
                  onChange={e => setNewCategory({...newCategory, name: e.target.value})} 
                  className="w-full p-3.5 bg-slate-50 dark:bg-[#060e1a] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-amber-500 text-slate-800 dark:text-white transition-colors" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Base Price Per Night (₹)</label>
                <input 
                  type="number" 
                  placeholder="12500" 
                  required 
                  value={newCategory.basePrice} 
                  onChange={e => setNewCategory({...newCategory, basePrice: e.target.value})} 
                  className="w-full p-3.5 bg-slate-50 dark:bg-[#060e1a] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-amber-500 text-slate-800 dark:text-white transition-colors" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Standard Capacity</label>
                <input 
                  type="number" 
                  placeholder="2 Guests" 
                  required 
                  value={newCategory.capacity} 
                  onChange={e => setNewCategory({...newCategory, capacity: e.target.value})} 
                  className="w-full p-3.5 bg-slate-50 dark:bg-[#060e1a] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-amber-500 text-slate-800 dark:text-white transition-colors" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Amenities (Comma-separated)</label>
                <input 
                  type="text" 
                  placeholder="Jacuzzi, Ocean Balcony, Butler Service" 
                  value={newCategory.amenities} 
                  onChange={e => setNewCategory({...newCategory, amenities: e.target.value})} 
                  className="w-full p-3.5 bg-slate-50 dark:bg-[#060e1a] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-amber-500 text-slate-800 dark:text-white transition-colors" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Target Hotel</label>
                <select 
                  value={newCategory.hotelId} 
                  onChange={e => setNewCategory({...newCategory, hotelId: e.target.value})} 
                  className="w-full p-3.5 bg-slate-50 dark:bg-[#060e1a] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-amber-500 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <option value="">Select Target Hotel</option>
                  <option value="h1">Urban Tadka</option>
                  <option value="h2">Oasis Bay Boutique Inn</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 cursor-pointer active:scale-95"
              >
                Initialize Luxury Category
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 glass-card p-6 sm:p-7 space-y-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-[#d4e4fa] uppercase tracking-wider">
              Active Managed Suites Directory
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {inventoryRooms.map(room => (
                <div key={room.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-[#060e1a]/40 space-y-1.5 text-center group hover:border-amber-500/40 transition-all">
                  <strong className="block text-base font-serif font-bold text-slate-900 dark:text-[#d4e4fa]">Suite {room.roomNumber}</strong>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{room.type}</span>
                  <strong className="block text-xs font-mono text-amber-500">₹{room.price.toLocaleString('en-IN')}/night</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 👥 TAB 5: STAFF ADMINISTRATION */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 glass-card p-6 sm:p-7 space-y-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-[#d4e4fa] flex items-center gap-2 uppercase tracking-wider">
              <PlusCircle className="w-4 h-4 text-amber-500" /> Register Staff Account
            </h3>
            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Full Legal Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Priya Nair" 
                  required 
                  value={newStaff.name} 
                  onChange={e => setNewStaff({...newStaff, name: e.target.value})} 
                  className="w-full p-3.5 bg-slate-50 dark:bg-[#060e1a] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-amber-500 text-slate-800 dark:text-white transition-colors" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Staff Work Email</label>
                <input 
                  type="email" 
                  placeholder="priya@Urban Tadkahotel.com" 
                  required 
                  value={newStaff.email} 
                  onChange={e => setNewStaff({...newStaff, email: e.target.value})} 
                  className="w-full p-3.5 bg-slate-50 dark:bg-[#060e1a] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-amber-500 text-slate-800 dark:text-white transition-colors" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Direct Phone</label>
                <input 
                  type="text" 
                  placeholder="+91 91234 56789" 
                  required 
                  value={newStaff.phone} 
                  onChange={e => setNewStaff({...newStaff, phone: e.target.value})} 
                  className="w-full p-3.5 bg-slate-50 dark:bg-[#060e1a] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-amber-500 text-slate-800 dark:text-white transition-colors" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Access Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  value={newStaff.password} 
                  onChange={e => setNewStaff({...newStaff, password: e.target.value})} 
                  className="w-full p-3.5 bg-slate-50 dark:bg-[#060e1a] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-amber-500 text-slate-800 dark:text-white transition-colors" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Designation & Role</label>
                <select 
                  value={newStaff.role} 
                  onChange={e => setNewStaff({...newStaff, role: e.target.value})} 
                  className="w-full p-3.5 bg-slate-50 dark:bg-[#060e1a] border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-amber-500 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <option value="Receptionist">Head Receptionist / Front Desk</option>
                  <option value="Housekeeping">Housekeeping Supervisor</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 cursor-pointer active:scale-95"
              >
                Register & Issue Credentials
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 glass-card p-6 sm:p-7 space-y-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-[#d4e4fa] uppercase tracking-wider">
              Hotel Staff Directory
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase pb-3">
                    <th className="pb-3">Staff Profile</th>
                    <th className="pb-3">Contact Details</th>
                    <th className="pb-3">Role Designation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {dynamicStaff.map(st => (
                    <tr key={st.id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="py-4 font-semibold text-slate-900 dark:text-[#d4e4fa] flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-amber-500">
                          {st.name.charAt(0)}
                        </div>
                        <div>
                          <div>{st.name}</div>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {st.id}</span>
                        </div>
                      </td>
                      <td className="py-4 text-slate-600 dark:text-slate-300">
                        <div>{st.email}</div>
                        <span className="text-[10px] text-slate-400">{st.phone}</span>
                      </td>
                      <td className="py-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          {st.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 📅 TAB 6: VIP BOOKINGS TIMELINE */}
      {activeTab === 'bookings' && (
        <div className="glass-card p-6 sm:p-7 space-y-5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-[#d4e4fa] uppercase tracking-wider">
            Consolidated Luxury Booking Journals
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase pb-3">
                  <th className="pb-3">Guest Name</th>
                  <th className="pb-3">Assigned Suite</th>
                  <th className="pb-3">Duration Dates</th>
                  <th className="pb-3">Total Amount Settled</th>
                  <th className="pb-3">Digital Keycard</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {ownerBookings.map(ob => (
                  <tr key={ob.id} className="hover:bg-slate-500/5 transition-colors">
                    <td className="py-4 font-semibold text-slate-900 dark:text-[#d4e4fa]">
                      <div>{ob.guestName}</div>
                      {ob.isVip && <span className="text-[10px] text-amber-500 font-bold">★ VIP Tier 1</span>}
                    </td>
                    <td className="py-4 font-bold text-amber-500 dark:text-[#f2ca50]">Suite {ob.roomNumber}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">{ob.checkIn} → {ob.checkOut}</td>
                    <td className="py-4 font-mono font-semibold text-emerald-500">₹{ob.amount.toLocaleString('en-IN')}</td>
                    <td className="py-4 font-mono text-xs">{ob.keycard}</td>
                    <td className="py-4 text-right">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        {ob.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default OwnerDashboard;
