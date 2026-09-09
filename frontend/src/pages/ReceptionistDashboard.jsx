import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  RefreshCw, Bed, CalendarDays, LogIn, LogOut, User, Users,
  Hotel, CheckCircle2, Clock, Sparkles, ChevronRight, Search,
  ArrowUpRight, Wifi, PhoneCall, FileText, X
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const bookingStatusConfig = {
  Confirmed: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-400', label: 'Confirmed' },
  CheckedIn: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400', label: 'Checked In' },
  CheckedOut: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', dot: 'bg-slate-400', label: 'Checked Out' },
  Pending: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400', label: 'Pending' },
  Cancelled: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', dot: 'bg-rose-400', label: 'Cancelled' },
};

const roomStatusConfig = {
  Available: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  Booked: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', dot: 'bg-indigo-400' },
  Occupied: { color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', dot: 'bg-sky-400' },
  Cleaning: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400' },
  Maintenance: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', dot: 'bg-rose-400' },
};

const ReceptionistDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSimulation = user?.role === 'SuperAdmin';

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const [simulationUsers, setSimulationUsers] = useState([]);
  const [selectedSimId, setSelectedSimId] = useState(sessionStorage.getItem('simulated_receptionist_id') || localStorage.getItem('simulated_receptionist_id') || '');
  const [receptionistProfile, setReceptionistProfile] = useState(null);

  // Check-In & Check-Out modal state variables
  const [checkInBooking, setCheckInBooking] = useState(null);
  const [checkInAdvanceAmount, setCheckInAdvanceAmount] = useState('');
  const [checkInPayMethod, setCheckInPayMethod] = useState('Cash');

  const [checkOutBooking, setCheckOutBooking] = useState(null);
  const [checkOutSettleAmount, setCheckOutSettleAmount] = useState('');
  const [checkOutPayMethod, setCheckOutPayMethod] = useState('Cash');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [roomsRes, bookingsRes, usersRes] = await Promise.all([
        api.get('/rooms?limit=100').catch(() => null),
        api.get('/bookings?limit=100').catch(() => null),
        isSimulation ? api.get('/users').catch(() => null) : Promise.resolve(null)
      ]);

      if (roomsRes?.data?.success && Array.isArray(roomsRes.data.data)) {
        setRooms(roomsRes.data.data);
      } else if (Array.isArray(roomsRes?.data)) {
        setRooms(roomsRes.data);
      }

      if (bookingsRes?.data?.success && Array.isArray(bookingsRes.data.data)) {
        setBookings(bookingsRes.data.data);
      } else if (Array.isArray(bookingsRes?.data)) {
        setBookings(bookingsRes.data);
      }

      if (usersRes?.data?.success && Array.isArray(usersRes.data.data)) {
        const recs = usersRes.data.data.filter(u => u?.role === 'Receptionist');
        setSimulationUsers(recs);

        const curId = selectedSimId || (recs[0] ? (recs[0].id || recs[0]._id) : '');
        const match = recs.find(u => (u.id || u._id) === curId);
        setReceptionistProfile(match || recs[0] || null);
      }
    } catch (err) {
      console.error('Error loading receptionist dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, [selectedSimId]);

  const handleSync = () => { setRefreshing(true); fetchStats(); };

  const handleOpenCheckIn = (booking) => {
    setCheckInBooking(booking);
    setCheckInAdvanceAmount('');
    setCheckInPayMethod('Cash');
  };

  const submitCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInBooking) return;
    try {
      const payload = {
        advanceAmount: parseFloat(checkInAdvanceAmount || 0),
        paymentMethod: checkInPayMethod,
      };
      await api.post(`/bookings/${checkInBooking.id || checkInBooking._id}/checkin`, payload);
      setCheckInBooking(null);
      fetchStats();
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  const handleOpenCheckOut = (booking) => {
    setCheckOutBooking(booking);
    const paid = booking.paidAmount || (booking.paymentStatus === 'Paid' ? booking.totalAmount : 0);
    const due = Math.max(0, (booking.totalAmount || 0) - paid);
    setCheckOutSettleAmount((Math.round(due * 100) / 100).toFixed(2));
    setCheckOutPayMethod('Cash');
  };

  const submitCheckOut = async (e) => {
    e.preventDefault();
    if (!checkOutBooking) return;
    try {
      const payload = {
        settlementAmount: parseFloat(checkOutSettleAmount || 0),
        paymentMethod: checkOutPayMethod,
      };
      await api.post(`/bookings/${checkOutBooking.id || checkOutBooking._id}/checkout`, payload);
      setCheckOutBooking(null);
      fetchStats();
    } catch (error) {
      console.error('Check-out failed:', error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-semibold animate-pulse">Loading Reception Desk...</p>
      </div>
    </div>
  );

  const safeRooms = Array.isArray(rooms) ? rooms : [];
  const safeBookings = Array.isArray(bookings) ? bookings : [];

  const totalBookings = safeBookings.length;
  const availableRoomsCount = safeRooms.filter(r => r && r.status === 'Available').length;
  const checkedInCount = safeBookings.filter(b => b && b.bookingStatus === 'CheckedIn').length;
  const checkedOutCount = safeBookings.filter(b => b && b.bookingStatus === 'CheckedOut').length;

  const isTodayDate = (dStr) => {
    if (!dStr) return false;
    const today = new Date();
    const d = new Date(dStr);
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const todaysBookings = safeBookings.filter(b => {
    if (!b) return false;
    const checkInToday = isTodayDate(b.checkIn);
    const checkOutToday = isTodayDate(b.checkOut);
    const createdToday = isTodayDate(b.createdAt);
    const isCurrentlyCheckedIn = b.bookingStatus === 'CheckedIn';
    const isConfirmedToday = b.bookingStatus === 'Confirmed' && (checkInToday || createdToday);

    return checkInToday || checkOutToday || createdToday || isCurrentlyCheckedIn || isConfirmedToday;
  });

  const filteredBookings = todaysBookings.filter(b => {
    if (!b) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const roomStr = b.room?.roomNumber?.toString() || '';
    const statusStr = b.bookingStatus?.toLowerCase() || '';
    const custStr = b.customer?.name?.toLowerCase() || '';
    return roomStr.includes(q) || statusStr.includes(q) || custStr.includes(q);
  });

  return (
    <div className="space-y-6 max-w-[1450px] mx-auto pb-12">

      {/* Simulation Banner */}
      {isSimulation && (
        <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl"><User className="w-5 h-5 text-white" /></div>
            <div>
              <h4 className="text-sm font-bold">Simulated Portal View</h4>
              <p className="text-[11px] text-indigo-100 mt-0.5">
                Viewing as <span className="font-bold underline">{receptionistProfile?.name}</span> ({receptionistProfile?.email})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] uppercase font-black tracking-wider text-indigo-100">Select Receptionist:</label>
            <select
              value={selectedSimId}
              onChange={e => { const id = e.target.value; setSelectedSimId(id); sessionStorage.setItem('simulated_receptionist_id', id); }}
              className="bg-indigo-600 text-white border border-white/20 rounded-lg px-2 py-1 text-xs outline-none cursor-pointer"
            >
              {simulationUsers.map(u => <option key={u.id} value={u.id} className="text-slate-800">{u.name} ({u.email})</option>)}
            </select>
          </div>
        </div>
      )}

      {/* ── 🌟 Luxury Reception Command Deck Banner ── */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/25 shadow-2xl relative overflow-hidden">
        {/* Ambient Gold Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/15 via-yellow-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/15 text-amber-500 dark:text-[#f2ca50] border border-amber-500/30">
                <Hotel className="w-3.5 h-3.5 text-amber-500" /> Front Desk Operations
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Desk Sync
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif text-slate-900 dark:text-[#d4e4fa] tracking-tight font-bold">
              Urban Tadka Reception Desk
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#d0c5af] font-light max-w-2xl">
              Express check-ins, advance settlements, digital keycards, and live room matrix management for Urban Tadka.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/kyc-requests')}
              className="flex items-center gap-2 py-3 px-5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold rounded-2xl transition-all text-xs shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 cursor-pointer active:scale-95"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              <span>Verify Guest Identity</span>
            </button>
            <button
              onClick={handleSync}
              disabled={refreshing}
              className="p-3 bg-white dark:bg-[#0b1526] border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 text-slate-800 dark:text-[#d4e4fa] rounded-2xl transition-all text-xs font-semibold shadow-sm hover:shadow-amber-500/10 cursor-pointer active:scale-95"
              title="Refresh Desk"
            >
              <RefreshCw className={`w-4 h-4 text-amber-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 💎 4 Luxury Desk KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Available Suites', value: availableRoomsCount, icon: Bed, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-500/15 border-emerald-500/30', subtext: 'Ready for check-in' },
          { label: 'Checked-In Guests', value: checkedInCount, icon: LogIn, iconColor: 'text-blue-500', iconBg: 'bg-blue-500/15 border-blue-500/30', subtext: 'Currently in-house' },
          { label: 'Checked-Out Today', value: checkedOutCount, icon: LogOut, iconColor: 'text-amber-500', iconBg: 'bg-amber-500/15 border-amber-500/30', subtext: 'Rooms sent to cleaning' },
          { label: 'Total Reservations', value: totalBookings, icon: CalendarDays, iconColor: 'text-purple-500', iconBg: 'bg-purple-500/15 border-purple-500/30', subtext: 'Confirmed journals' },
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
              <span className="text-emerald-500 font-bold">● Active</span>
              <span className="text-slate-400 dark:text-slate-500">{subtext}</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-transparent" />
          </div>
        ))}
      </div>

      {/* ── 2-col: Room Status + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Room Status Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900/50 border border-slate-200/50 dark:border-neutral-800/80 rounded-[24px] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                <Bed className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white">Live Room Status</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{rooms.length} rooms total</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-[9px] font-bold uppercase tracking-wider">
              {Object.entries(roomStatusConfig).map(([status, cfg]) => (
                <span key={status} className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {status}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {rooms.map(room => {
              const cfg = roomStatusConfig[room.status] || roomStatusConfig['Maintenance'];
              return (
                <div key={room.id} className={`p-4 border ${cfg.border} ${cfg.bg} rounded-2xl text-center hover:scale-[1.02] transition-all duration-200`}>
                  <strong className="block text-sm font-bold text-slate-800 dark:text-slate-100">Room {room.roomNumber}</strong>
                  <span className={`inline-flex items-center gap-1 mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border} uppercase tracking-wider`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                    {room.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white dark:bg-neutral-900/50 border border-slate-200/50 dark:border-neutral-800/80 rounded-[24px] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-neutral-800 pb-4">
            <div className="w-8 h-8 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">Quick Actions</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Front desk shortcuts</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              { icon: FileText, label: 'Guest Document Check', desc: 'Verify guest KYC & ID documents', color: 'text-amber-500', bg: 'bg-amber-500/10', href: '/kyc-requests' },
              { icon: CalendarDays, label: 'View All Bookings', desc: 'Manage all reservations', color: 'text-blue-500', bg: 'bg-blue-500/10', href: '/bookings' },
              { icon: Users, label: 'Guest Directory', desc: 'Browse all registered guests', color: 'text-purple-500', bg: 'bg-purple-500/10', href: '/customers' },
              { icon: Bed, label: 'Room Inventory', desc: 'View and manage all rooms', color: 'text-emerald-500', bg: 'bg-emerald-500/10', href: '/rooms' },
            ].map(({ icon: Icon, label, desc, color, bg, href }) => (
              <button
                key={label}
                onClick={() => navigate(href)}
                className="w-full flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-neutral-950/50 border border-slate-200/60 dark:border-neutral-800/80 rounded-2xl hover:scale-[1.01] hover:shadow-sm transition-all duration-200 cursor-pointer text-left group"
              >
                <div className={`w-9 h-9 ${bg} ${color} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{label}</p>
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5 truncate">{desc}</p>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 ${color} opacity-0 group-hover:opacity-100 transition-opacity shrink-0`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Today's Arrivals & Express Desk Checklist ── */}
      <div className="bg-white dark:bg-neutral-900/50 border border-slate-200/50 dark:border-neutral-800/80 rounded-[24px] p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">Today's Bookings & Arrivals (Today Only)</h3>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">{todaysBookings.length} bookings for today</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search room or guest..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-48 font-medium"
              />
            </div>
            <button
              onClick={() => navigate('/bookings')}
              className="px-3.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <span>Full Bookings List</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-16 h-16 bg-slate-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center">
              <CalendarDays className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-neutral-400">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-neutral-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 pr-4">Room</th>
                  <th className="pb-3 pr-4">Guest</th>
                  <th className="pb-3 pr-4">Check-In</th>
                  <th className="pb-3 pr-4">Check-Out</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80">
                {filteredBookings.map(b => {
                  const cfg = bookingStatusConfig[b.bookingStatus] || bookingStatusConfig['Pending'];
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-neutral-950/20 transition-colors">
                      <td className="py-3.5 pr-4">
                        <span className="px-2.5 py-1 bg-slate-900 dark:bg-black/40 text-white text-[10px] font-black rounded-lg border border-white/10">
                          {b.room?.roomNumber ? `Room ${b.room.roomNumber}` : '—'}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 font-bold text-slate-700 dark:text-neutral-200">
                        {b.customer?.name || 'Guest'}
                      </td>
                      <td className="py-3.5 pr-4 text-slate-500 dark:text-neutral-400">
                        {b.checkIn ? new Date(b.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                      </td>
                      <td className="py-3.5 pr-4 text-slate-500 dark:text-neutral-400">
                        {b.checkOut ? new Date(b.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        {b.bookingStatus === 'Confirmed' && (
                          <button
                            onClick={() => handleOpenCheckIn(b)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-[10px] font-bold shadow-sm shadow-emerald-500/15 cursor-pointer active:scale-95 transition-all inline-flex items-center gap-1"
                          >
                            <LogIn className="w-3 h-3" /> Check In
                          </button>
                        )}
                        {b.bookingStatus === 'CheckedIn' && (
                          <button
                            onClick={() => handleOpenCheckOut(b)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl text-[10px] font-bold shadow-sm shadow-rose-500/15 cursor-pointer active:scale-95 transition-all inline-flex items-center gap-1"
                          >
                            <LogOut className="w-3 h-3" /> Check Out
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Check-In Advance Modal ── */}
      {checkInBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Guest Check-In & Advance</h3>
                <p className="text-xs text-slate-500">Room {checkInBooking.room?.roomNumber} · {checkInBooking.customer?.name}</p>
              </div>
              <button onClick={() => setCheckInBooking(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={submitCheckIn} className="p-6 space-y-4">
              <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Stay Amount:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">₹{(Math.round((checkInBooking.totalAmount || 0) * 100) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Already Paid:</span>
                  <span className="font-bold text-emerald-600">₹{(Math.round((checkInBooking.paidAmount || 0) * 100) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-blue-200/30 pt-1">
                  <span className="text-slate-600 font-medium">Balance Remaining:</span>
                  <span className="font-extrabold text-indigo-600">₹{(Math.round(Math.max(0, checkInBooking.totalAmount - (checkInBooking.paidAmount || 0)) * 100) / 100).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Advance Payment Collected (₹)</label>
                {Math.max(0, (checkInBooking.totalAmount || 0) - (checkInBooking.paidAmount || 0)) <= 0 ? (
                  <div className="px-3 py-2 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Full payment already completed (Balance: ₹0.00). No advance required.
                  </div>
                ) : (
                  <>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      max={(Math.round(Math.max(0, (checkInBooking.totalAmount || 0) - (checkInBooking.paidAmount || 0)) * 100) / 100).toFixed(2)}
                      value={checkInAdvanceAmount}
                      onChange={(e) => setCheckInAdvanceAmount(e.target.value)}
                      placeholder="Enter advance amount (e.g. 500 or 1000)"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <p className="text-[11px] text-slate-400">Guest can pay advance now and settle remaining balance at check-out.</p>
                  </>
                )}
              </div>

              {parseFloat(checkInAdvanceAmount) > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Method</label>
                  <select
                    value={checkInPayMethod}
                    onChange={(e) => setCheckInPayMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card / POS</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckInBooking(null)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 active:scale-95 transition-all"
                >
                  Confirm Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Check-Out Settlement Modal ── */}
      {checkOutBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Guest Check-Out & Settlement</h3>
                <p className="text-xs text-slate-500">Room {checkOutBooking.room?.roomNumber} · {checkOutBooking.customer?.name}</p>
              </div>
              <button onClick={() => setCheckOutBooking(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={submitCheckOut} className="p-6 space-y-4">
              <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Stay Charges:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{(Math.round((checkOutBooking.totalAmount || 0) * 100) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Advance / Paid Previously:</span>
                  <span className="font-bold text-emerald-600">₹{(Math.round((checkOutBooking.paidAmount || (checkOutBooking.paymentStatus === 'Paid' ? checkOutBooking.totalAmount : 0)) * 100) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-amber-200/40 pt-1.5 text-sm">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Balance Due Now:</span>
                  <span className="font-extrabold text-rose-600 dark:text-rose-400">
                    ₹{(Math.round(Math.max(0, checkOutBooking.totalAmount - (checkOutBooking.paidAmount || (checkOutBooking.paymentStatus === 'Paid' ? checkOutBooking.totalAmount : 0))) * 100) / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {Math.max(0, checkOutBooking.totalAmount - (checkOutBooking.paidAmount || (checkOutBooking.paymentStatus === 'Paid' ? checkOutBooking.totalAmount : 0))) > 0 && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Remaining Settlement Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={checkOutSettleAmount}
                      onChange={(e) => setCheckOutSettleAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Settlement Payment Method</label>
                    <select
                      value={checkOutPayMethod}
                      onChange={(e) => setCheckOutPayMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card / POS</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckOutBooking(null)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-extrabold text-xs shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-orange-700 active:scale-95 transition-all"
                >
                  Settle & Check Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;
