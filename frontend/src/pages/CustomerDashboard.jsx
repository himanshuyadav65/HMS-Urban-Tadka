import React, { useEffect, useState } from 'react';
import { RefreshCw, Bed, ShieldCheck, ShieldAlert, IndianRupee, Sparkles, CalendarPlus, ArrowRightLeft, ArrowRight, CreditCard, FileText, ChevronLeft, ChevronRight, User, Upload, CalendarCheck, LifeBuoy, Award, CheckCircle2, QrCode, Star } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { getAssetUrl } from '../utils/url';
import { useAuth } from '../context/AuthContext';
import DocumentUploader from '../components/DocumentUploader';
import HotelGallery from '../components/HotelGallery';
import GrandHorizonLogo from '../components/GrandHorizonLogo';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const showToast = outletContext?.showToast || ((msg) => console.log(msg));
  const { user } = useAuth();
  const isSimulation = user?.role === 'SuperAdmin';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [customerBookings, setCustomerBookings] = useState([]);
  const [customerProfile, setCustomerProfile] = useState(null);

  const [simulationUsers, setSimulationUsers] = useState([]);
  const [selectedSimId, setSelectedSimId] = useState(sessionStorage.getItem('simulated_customer_id') || localStorage.getItem('simulated_customer_id') || '');

  const fetchStats = async () => {
    try {
      setLoading(true);
      if (isSimulation) {
        const [bookingsRes, usersRes] = await Promise.all([
          api.get('/bookings').catch(() => null),
          api.get('/users').catch(() => null)
        ]);

        const allUsers = usersRes?.data?.data || [];
        const customers = allUsers.filter(u => u.role === 'Customer');
        setSimulationUsers(customers);

        let activeCustomer = customers.find(u => u.id === selectedSimId);
        if (!activeCustomer && customers.length > 0) {
          activeCustomer = customers.find(u => u.email === 'alice@guest.com') || customers[0];
        }

        if (activeCustomer) {
          setSelectedSimId(activeCustomer.id);
          sessionStorage.setItem('simulated_customer_id', activeCustomer.id);
        }

        setCustomerProfile(activeCustomer || { name: 'Alice Guest', email: 'alice@guest.com', role: 'Customer' });

        const activeBookings = bookingsRes?.data?.data?.filter(b => b.customer === activeCustomer?.id || b.customer?.id === activeCustomer?.id || b.customer?.email === activeCustomer?.email) || [];
        setCustomerBookings(activeBookings);
      } else {
        const [bookingRes, profileRes] = await Promise.all([
          api.get('/bookings').catch(() => null),
          api.get('/users/profile').catch(() => null)
        ]);
        if (bookingRes?.data?.success) setCustomerBookings(bookingRes.data.data);
        if (profileRes?.data?.success) setCustomerProfile(profileRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedSimId]);

  const handleSync = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) return <div className="p-6 text-slate-500 font-semibold animate-pulse">Loading Luxury Customer Portal...</div>;

  const bookingsArray = Array.isArray(customerBookings) ? customerBookings : [];
  const activeStays = bookingsArray.filter(b => b && (b.bookingStatus === 'Confirmed' || b.bookingStatus === 'CheckedIn'));
  const documentsArray = Array.isArray(customerProfile?.documents) ? customerProfile.documents : [];
  const totalSpend = bookingsArray.filter(b => b && b.paymentStatus === 'Paid').reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const nextStay = bookingsArray.filter(b => b && b.bookingStatus === 'Confirmed' && b.checkIn && new Date(b.checkIn) >= new Date()).sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {isSimulation && (
        <div className="p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold">Simulated Customer View</h4>
              <p className="text-xs text-indigo-100 mt-0.5">
                Viewing portal as <span className="font-bold underline">{customerProfile?.name}</span> ({customerProfile?.email})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="simCustomerSelect" className="text-[10px] uppercase font-black tracking-wider text-indigo-200">Select Customer:</label>
            <select
              id="simCustomerSelect"
              value={selectedSimId}
              onChange={e => {
                const newId = e.target.value;
                setSelectedSimId(newId);
                sessionStorage.setItem('simulated_customer_id', newId);
              }}
              className="bg-indigo-950/80 border border-white/30 rounded-xl px-3 py-1.5 text-xs outline-none cursor-pointer font-bold"
            >
              {simulationUsers.map(u => (
                <option key={u.id} value={u.id} className="text-slate-900 bg-white">
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── 🌟 Luxury Customer VIP Portal Banner (Rich Royal Midnight Gold) ── */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#180E09] via-[#2A180F] to-[#120A06] p-6 sm:p-8 border border-amber-500/40 shadow-2xl text-white">
        {/* Ambient Gold Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/20 via-yellow-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-amber-600/15 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Award className="w-3.5 h-3.5 text-amber-400" /> 5-Star Luxury VIP Guest Portal
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Concierge 24/7 Live
              </span>
            </div>

            <GrandHorizonLogo size="large" variant="gold" />

            <p className="text-xs sm:text-sm text-slate-300 font-light max-w-xl leading-relaxed">
              Welcome back, <strong className="text-white font-bold">{customerProfile?.name || 'Valued Guest'}</strong>. Experience world-class hospitality, beachfront presidential suites, signature Michelin dining, and express digital check-ins.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/book-room')}
              className="flex items-center gap-2 py-3.5 px-6 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black rounded-2xl transition-all text-xs shadow-xl shadow-amber-500/25 hover:shadow-amber-500/45 cursor-pointer active:scale-95"
            >
              <CalendarPlus className="w-4 h-4 text-slate-950" />
              <span>Book Luxury Suite</span>
            </button>
            <button
              onClick={handleSync}
              disabled={refreshing}
              className="p-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all cursor-pointer backdrop-blur-md shadow-sm"
              title="Sync Dashboard"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 💎 3 Luxury Customer Stats Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Active Reservations', value: `${activeStays.length} Stays`, icon: Bed, iconBg: 'bg-blue-500/15 border-blue-500/30', iconColor: 'text-blue-500', subtext: 'Upcoming & current suites' },
          { label: 'Express Verification', value: `${documentsArray.length} Documents`, icon: FileText, iconBg: 'bg-indigo-500/15 border-indigo-500/30', iconColor: 'text-indigo-500', subtext: 'Aadhaar / ID checked in' },
          { label: 'Total Settled Spend', value: `₹${totalSpend.toLocaleString('en-IN')}`, icon: IndianRupee, iconBg: 'bg-amber-500/15 border-amber-500/30', iconColor: 'text-amber-500', subtext: 'Completed payments' },
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

      {/* Hotel Photo Showcase Gallery (Placed Near Top) */}
      <div className="bg-white dark:bg-neutral-900/60 p-6 border border-slate-200/80 dark:border-neutral-800 rounded-[28px] shadow-sm dark:shadow-xl">
        <HotelGallery />
      </div>

      {/* Symmetric 2-Column Dashboard Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Columns Width: lg:col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current / Next Stay Card */}
          <div className="bg-white dark:bg-neutral-900/60 p-6 space-y-5 border border-slate-200/80 dark:border-neutral-800 rounded-[24px] shadow-sm dark:shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-neutral-800/80 pb-3.5">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                <CalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 
                Current / Next Hotel Stay
              </h3>
              {nextStay && (
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/20">
                  Confirmed Booking
                </span>
              )}
            </div>

            {nextStay ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-neutral-950/60 rounded-2xl border border-slate-200/60 dark:border-neutral-800">
                  <div>
                    <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">Room {nextStay.room?.roomNumber}</h4>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mt-0.5 block">{nextStay.room?.roomType}</span>
                  </div>
                  <div className="sm:text-right">
                    <strong className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">₹{nextStay.room?.pricePerNight?.toFixed(2)}</strong>
                    <span className="text-xs text-slate-400 block font-semibold">per night</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center text-sm bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40 gap-4">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-extrabold tracking-widest mb-1">Check-In</span>
                    <strong className="text-slate-900 dark:text-white font-extrabold">{nextStay.checkIn ? new Date(nextStay.checkIn).toLocaleDateString('en-IN') : 'N/A'}</strong>
                  </div>
                  <div className="flex justify-center text-blue-600 dark:text-blue-400"><ArrowRightLeft className="w-5 h-5" /></div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-extrabold tracking-widest mb-1">Check-Out</span>
                    <strong className="text-slate-900 dark:text-white font-extrabold">{nextStay.checkOut ? new Date(nextStay.checkOut).toLocaleDateString('en-IN') : 'N/A'}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button 
                    onClick={() => navigate('/my-bookings')} 
                    className="flex-1 py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-extrabold text-xs shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>View Booking Pass & Extend Stay</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 dark:text-neutral-400 space-y-4 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-neutral-950/40 dark:to-neutral-900/20 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
                  <Bed className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">No Upcoming Stays Booked</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">Plan your next luxury escape with beachfront views, oceanfront infinity pools, and Michelin dining.</p>
                </div>
                <button 
                  onClick={() => navigate('/book-room')} 
                  className="inline-flex items-center gap-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Book Luxury Room Now</span>
                </button>
              </div>
            )}
          </div>

          {/* Identity Documents Upload Section */}
          {!isSimulation && (
            <div className="bg-white dark:bg-neutral-900/60 p-6 border border-slate-200/80 dark:border-neutral-800 rounded-[24px] shadow-sm dark:shadow-xl">
              <DocumentUploader
                documents={customerProfile?.documents}
                onUploadSuccess={(updatedDocs) => {
                  setCustomerProfile(prev => prev ? { ...prev, documents: updatedDocs } : null);
                }}
                showToast={showToast}
              />
            </div>
          )}
        </div>

        {/* Right Column (1 Column Width: lg:col-span-1) */}
        <div className="space-y-6">
          {/* Customer Profile Details Card */}
          <div className="bg-white dark:bg-neutral-900/60 p-6 space-y-5 border border-slate-200/80 dark:border-neutral-800 rounded-[24px] shadow-sm dark:shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800/80 pb-3.5">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Profile Details
              </h3>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold rounded-md uppercase">
                Active Member
              </span>
            </div>

            <div className="flex items-center gap-3.5 p-3 bg-slate-50 dark:bg-neutral-950/50 rounded-2xl border border-slate-200/50 dark:border-neutral-800">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md">
                {(customerProfile?.name || 'G')[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{customerProfile?.name || 'N/A'}</h4>
                <p className="text-xs text-slate-400 truncate">{customerProfile?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div className="flex justify-between border-b border-slate-100 dark:border-neutral-800/60 pb-2">
                <span className="text-slate-400">Phone Number</span>
                <span className="text-slate-900 dark:text-white font-extrabold">{customerProfile?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-neutral-800/60 pb-2">
                <span className="text-slate-400">Role / Account</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{customerProfile?.role || 'Customer'}</span>
              </div>
            </div>

            {/* Verification Documents Summary */}
            <div className="pt-2">
              <h4 className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 mb-2.5">Document Verification Status</h4>
              {documentsArray.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No verification documents uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {documentsArray.map((doc, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-neutral-950/60 border border-slate-200/60 dark:border-neutral-800 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900 dark:text-white block">{doc.docType}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider ${
                          doc.status === 'Verified' ? 'text-emerald-600' : doc.status === 'Rejected' ? 'text-rose-500' : 'text-amber-500'
                        }`}>{doc.status}</span>
                      </div>
                      {doc.docPath && (
                        <a 
                          href={getAssetUrl(doc.docPath)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-2.5 py-1 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-[10px] rounded-lg font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm"
                        >
                          View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-neutral-900/60 p-6 space-y-4 border border-slate-200/80 dark:border-neutral-800 rounded-[24px] shadow-sm dark:shadow-xl">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-neutral-800/80 pb-3 uppercase tracking-wider">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              <button 
                onClick={() => navigate('/book-room')} 
                className="w-full p-3.5 bg-slate-50 dark:bg-neutral-950/60 hover:bg-emerald-50 dark:hover:bg-neutral-900 rounded-xl border border-slate-200/80 dark:border-neutral-800 flex items-center justify-between group cursor-pointer text-xs font-bold text-slate-800 dark:text-white transition-all duration-200"
              >
                <span className="flex items-center gap-2.5">
                  <CalendarPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Book Luxury Room</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => navigate('/my-bookings')} 
                className="w-full p-3.5 bg-slate-50 dark:bg-neutral-950/60 hover:bg-indigo-50 dark:hover:bg-neutral-900 rounded-xl border border-slate-200/80 dark:border-neutral-800 flex items-center justify-between group cursor-pointer text-xs font-bold text-slate-800 dark:text-white transition-all duration-200"
              >
                <span className="flex items-center gap-2.5">
                  <CalendarCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>My Bookings & QR</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => navigate('/invoices')} 
                className="w-full p-3.5 bg-slate-50 dark:bg-neutral-950/60 hover:bg-blue-50 dark:hover:bg-neutral-900 rounded-xl border border-slate-200/80 dark:border-neutral-800 flex items-center justify-between group cursor-pointer text-xs font-bold text-slate-800 dark:text-white transition-all duration-200"
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Invoices & Receipts</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => navigate('/reviews')} 
                className="w-full p-3.5 bg-slate-50 dark:bg-neutral-950/60 hover:bg-amber-50 dark:hover:bg-neutral-900 rounded-xl border border-slate-200/80 dark:border-neutral-800 flex items-center justify-between group cursor-pointer text-xs font-bold text-slate-800 dark:text-white transition-all duration-200"
              >
                <span className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>Guest Reviews & Ratings</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => navigate('/contact-support')} 
                className="w-full p-3.5 bg-slate-50 dark:bg-neutral-950/60 hover:bg-purple-50 dark:hover:bg-neutral-900 rounded-xl border border-slate-200/80 dark:border-neutral-800 flex items-center justify-between group cursor-pointer text-xs font-bold text-slate-800 dark:text-white transition-all duration-200"
              >
                <span className="flex items-center gap-2.5">
                  <LifeBuoy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>24/7 Concierge Support</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* VIP Hotel Privileges Callout */}
          <div className="bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-indigo-500/10 border border-amber-500/30 p-5 rounded-[24px] space-y-3">
            <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Hotel VIP Privileges</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
              Enjoy 10% instant discount on room extensions, free express check-in, and 24/7 infinity pool access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;

