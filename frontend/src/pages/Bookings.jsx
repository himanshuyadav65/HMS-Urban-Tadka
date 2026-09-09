import React, { useEffect, useState } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Check, 
  X, 
  ArrowRight, 
  CreditCard,
  Download,
  Info,
  CalendarDays,
  CalendarPlus
} from 'lucide-react';
import api from '../services/api';
import { TableSkeleton } from '../components/Skeletons';
import DatePicker from '../components/DatePicker';
import ExtendStayModal from '../components/ExtendStayModal';

const Bookings = () => {
  const { showToast } = useOutletContext();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTimeRange, setFilterTimeRange] = useState('all');

  // Auto-open reservation modal when redirected with a customer ID
  useEffect(() => {
    if (location.state?.selectedCustomerId) {
      setSelectedCustomerId(location.state.selectedCustomerId);
      setIsCreateOpen(true);
    }
  }, [location.state]);

  // Dropdowns for booking creation
  const [customers, setCustomers] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);

  // Create booking states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [discount, setDiscount] = useState('0');

  // Preview totals before saving
  const [previewTotals, setPreviewTotals] = useState(null);

  // Payment popup state
  const [payingBooking, setPayingBooking] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');

  // Check-In Advance Modal State
  const [checkInBooking, setCheckInBooking] = useState(null);
  const [checkInAdvanceAmount, setCheckInAdvanceAmount] = useState('');
  const [checkInPayMethod, setCheckInPayMethod] = useState('Cash');

  // Check-Out Settlement Modal State
  const [checkOutBooking, setCheckOutBooking] = useState(null);
  const [checkOutSettleAmount, setCheckOutSettleAmount] = useState('');
  const [checkOutPayMethod, setCheckOutPayMethod] = useState('Cash');

  // Extend Stay Modal State
  const [extendStayBooking, setExtendStayBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.customerName = search;
      if (filterStatus) params.status = filterStatus;

      const response = await api.get('/bookings', { params });
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showToast('Failed to load bookings list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCreateData = async () => {
    try {
      // Fetch customers for search/dropdown
      const custRes = await api.get('/customers');
      if (custRes.data.success) {
        setCustomers(custRes.data.data);
      }

      // Fetch available rooms
      const roomRes = await api.get('/rooms?status=Available');
      if (roomRes.data.success) {
        setAvailableRooms(roomRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load auxiliary data', error);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [search, filterStatus]);

  useEffect(() => {
    if (isCreateOpen) {
      loadCreateData();
    }
  }, [isCreateOpen]);

  // Billing Preview Logic (calculates nights and pricing dynamically)
  useEffect(() => {
    if (selectedRoomId && checkIn && checkOut) {
      const room = availableRooms.find(r => r._id === selectedRoomId);
      if (!room) return;

      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);

      if (inDate < outDate) {
        const diffDays = Math.ceil(Math.abs(outDate - inDate) / (1000 * 60 * 60 * 24)) || 1;
        const subtotal = room.pricePerNight * diffDays;
        const tax = parseFloat((subtotal * 0.18).toFixed(2));
        const disc = parseFloat(discount) || 0;
        const total = parseFloat((subtotal + tax - disc).toFixed(2));

        setPreviewTotals({
          nights: diffDays,
          pricePerNight: room.pricePerNight,
          subtotal,
          tax,
          discount: disc,
          total
        });
      } else {
        setPreviewTotals(null);
      }
    } else {
      setPreviewTotals(null);
    }
  }, [selectedRoomId, checkIn, checkOut, discount, availableRooms]);

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedRoomId || !checkIn || !checkOut) {
      showToast('Please fill all booking parameters', 'warning');
      return;
    }

    try {
      const response = await api.post('/bookings', {
        customerId: selectedCustomerId,
        roomId: selectedRoomId,
        checkIn,
        checkOut,
        discount: parseFloat(discount) || 0
      });

      if (response.data.success) {
        showToast('Booking and Invoice created successfully', 'success');
        setIsCreateOpen(false);
        // Reset fields
        setSelectedCustomerId('');
        setSelectedRoomId('');
        setCheckIn('');
        setCheckOut('');
        setDiscount('0');
        fetchBookings();
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Double booking overlapping error detected';
      showToast(errMsg, 'error');
    }
  };

  const handleOpenCheckIn = (booking) => {
    setCheckInBooking(booking);
    const suggestedAdvance = booking.paymentStatus === 'Unpaid' ? Math.round(booking.totalAmount / 2) : 0;
    setCheckInAdvanceAmount(suggestedAdvance > 0 ? (Math.round(suggestedAdvance * 100) / 100).toFixed(2) : '0');
    setCheckInPayMethod('Cash');
  };

  const submitCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInBooking) return;
    try {
      const response = await api.post(`/bookings/${checkInBooking._id}/checkin`, {
        advanceAmount: parseFloat(checkInAdvanceAmount || 0),
        paymentMethod: checkInPayMethod,
      });
      if (response.data.success) {
        showToast(response.data.message || 'Guest checked in successfully', 'success');
        setCheckInBooking(null);
        fetchBookings();
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Check-in failed', 'error');
    }
  };

  const handleOpenCheckOut = (booking) => {
    setCheckOutBooking(booking);
    const paid = booking.paidAmount || (booking.paymentStatus === 'Paid' ? booking.totalAmount : 0);
    const due = Math.max(0, booking.totalAmount - paid);
    setCheckOutSettleAmount((Math.round(due * 100) / 100).toFixed(2));
    setCheckOutPayMethod('Cash');
  };

  const submitCheckOut = async (e) => {
    e.preventDefault();
    if (!checkOutBooking) return;
    try {
      const response = await api.post(`/bookings/${checkOutBooking._id}/checkout`, {
        settlementAmount: parseFloat(checkOutSettleAmount || 0),
        paymentMethod: checkOutPayMethod,
      });
      if (response.data.success) {
        showToast('Guest checked out successfully! Downloading invoice...', 'success');
        const targetBId = checkOutBooking._id;
        setCheckOutBooking(null);
        fetchBookings();
        handleDownloadInvoice(targetBId);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Check-out failed', 'error');
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This will free the room.')) {
      return;
    }
    try {
      const response = await api.post(`/bookings/${id}/cancel`);
      if (response.data.success) {
        showToast('Booking cancelled successfully', 'success');
        fetchBookings();
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Cancellation failed', 'error');
    }
  };

  // Open Payment form
  const handleOpenPayment = (booking) => {
    setPayingBooking(booking);
    setPayAmount((booking.totalAmount - (booking.paymentStatus === 'Paid' ? booking.totalAmount : 0)).toString());
    setPayMethod('Cash');
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/payments', {
        bookingId: payingBooking._id,
        paymentMethod: payMethod,
        amount: parseFloat(payAmount)
      });

      if (response.data.success) {
        showToast('Payment processed successfully. Customer notified.', 'success');
        setPayingBooking(null);
        fetchBookings();
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Payment registration failed', 'error');
    }
  };

  const handleDownloadInvoice = async (bookingId) => {
    try {
      showToast('Downloading invoice PDF...', 'info');
      
      const response = await api.get(`/invoices/${bookingId}/download`, {
        responseType: 'blob'
      });
      
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `invoice-${bookingId.toString().slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        link.remove();
        URL.revokeObjectURL(fileURL);
      }, 1000);
      
      showToast('Invoice PDF downloaded successfully', 'success');
    } catch (error) {
      console.error(error);
      showToast('Error downloading invoice PDF', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50';
      case 'CheckedIn':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/50';
      case 'CheckedOut':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border border-slate-200/20';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/50';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'PartiallyPaid':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Unpaid':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getFilteredBookings = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    return bookings.filter(b => {
      // 1. Status Filter
      if (filterStatus && b.bookingStatus !== filterStatus) return false;

      // 2. Search filter
      if (search) {
        const q = search.toLowerCase();
        const custName = b.customer?.name?.toLowerCase() || '';
        const roomNum = b.room?.roomNumber?.toString() || '';
        const status = b.bookingStatus?.toLowerCase() || '';
        if (!custName.includes(q) && !roomNum.includes(q) && !status.includes(q)) {
          return false;
        }
      }

      // 3. Time Range / Month Filter
      if (filterTimeRange !== 'all') {
        const checkInDate = b.checkIn ? new Date(b.checkIn) : null;
        const createdDate = b.createdAt ? new Date(b.createdAt) : checkInDate;

        if (!createdDate) return true;

        if (filterTimeRange === 'today') {
          const isCheckInToday = checkInDate && checkInDate.toDateString() === today.toDateString();
          const isCreatedToday = createdDate.toDateString() === today.toDateString();
          if (!isCheckInToday && !isCreatedToday) return false;
        } else if (filterTimeRange === 'this_month') {
          if (createdDate.getMonth() !== currentMonth || createdDate.getFullYear() !== currentYear) {
            return false;
          }
        } else if (filterTimeRange === 'last_month') {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          if (createdDate.getMonth() !== lastMonth || createdDate.getFullYear() !== lastMonthYear) {
            return false;
          }
        } else if (filterTimeRange === 'this_year') {
          if (createdDate.getFullYear() !== currentYear) return false;
        }
      }

      return true;
    });
  };

  const displayBookings = getFilteredBookings();

  return (
    <div className="space-y-6 max-w-[1450px] mx-auto pb-12">
      {/* ── Premium Hero Banner ── */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 sm:p-8 border border-blue-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/10 via-indigo-500/8 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/6 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-300 via-indigo-200 to-white bg-clip-text text-transparent font-serif">
                  Guest Bookings Directory
                </h1>
                <p className="text-[10px] text-blue-400/70 font-bold uppercase tracking-widest mt-0.5">
                  Complete Booking History · Past Months · Live Filters
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400/90 max-w-xl leading-relaxed mt-1">
              Browse all historical and current reservations, audit past monthly bookings, process check-ins, and generate invoices.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-3 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer border border-blue-400/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-blue-200" />
              <span>New Reservation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search row */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 inset-y-0 my-auto w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Month / History Range Selector */}
          <select
            value={filterTimeRange}
            onChange={(e) => setFilterTimeRange(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-700 dark:text-slate-300"
          >
            <option value="all">📅 All Time (Complete History)</option>
            <option value="this_month">🗓️ This Month (August)</option>
            <option value="last_month">⏮️ Previous Month (July)</option>
            <option value="today">⚡ Today Only</option>
            <option value="this_year">📆 This Year (2026)</option>
          </select>

          {/* Booking State Selector */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-700 dark:text-slate-300"
          >
            <option value="">All Booking States</option>
            <option value="Confirmed">Confirmed</option>
            <option value="CheckedIn">Checked In</option>
            <option value="CheckedOut">Checked Out</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings Table list */}
      {loading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : displayBookings.length > 0 ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Ref ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Room</th>
                  <th className="p-4">Stay Dates</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                {displayBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{booking.bookingId}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{booking.customer?.name}</div>
                      <div className="text-xs text-slate-400">{booking.customer?.phone}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">Room {booking.room?.roomNumber}</div>
                      <div className="text-xs text-slate-400 uppercase">{booking.room?.roomType}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                        <span>{new Date(booking.checkIn).toLocaleDateString()}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span>{new Date(booking.checkOut).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{booking.totalDays} Night(s)</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">₹{Number(booking.totalAmount || 0).toFixed(2)}</div>
                      {booking.paymentStatus === 'PartiallyPaid' ? (
                        <div className="mt-1 flex flex-col items-start gap-0.5">
                          <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-500/30">
                            Adv: ₹{booking.paidAmount || 0}
                          </span>
                          <span className="text-[10px] font-bold text-rose-500">
                            Due: ₹{Math.max(0, booking.totalAmount - (booking.paidAmount || 0))}
                          </span>
                        </div>
                      ) : (
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 mt-1 rounded-full ${getPaymentStatusBadge(booking.paymentStatus)}`}>
                          {booking.paymentStatus}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusBadge(booking.bookingStatus)}`}>
                        {booking.bookingStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {/* Check In Action */}
                        {['Confirmed', 'Pending'].includes(booking.bookingStatus) && (
                          <button
                            onClick={() => handleOpenCheckIn(booking)}
                            className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-emerald-500/20"
                            title="Guest Check-In (Advance Payment)"
                          >
                            Check In
                          </button>
                        )}

                        {/* Check Out Action */}
                        {booking.bookingStatus === 'CheckedIn' && (
                          <button
                            onClick={() => handleOpenCheckOut(booking)}
                            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-amber-500/20"
                            title="Guest Check-Out & Final Settlement"
                          >
                            Check Out
                          </button>
                        )}

                        {/* Extend Stay Action */}
                        {['CheckedIn', 'Confirmed'].includes(booking.bookingStatus) && (
                          <button
                            onClick={() => setExtendStayBooking(booking)}
                            className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 border border-amber-500/30 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1"
                            title="Extend Guest Stay / Add Nights"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                            <span>Extend</span>
                          </button>
                        )}

                        {/* Process payment button if unpaid */}
                        {booking.paymentStatus !== 'Paid' && booking.bookingStatus !== 'Cancelled' && (
                          <button
                            onClick={() => handleOpenPayment(booking)}
                            className="p-1.5 text-slate-500 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Register Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}

                        {/* Invoice download link */}
                        {booking.bookingStatus !== 'Cancelled' && (
                          <button
                            onClick={() => handleDownloadInvoice(booking._id)}
                            className="p-1.5 text-slate-500 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Download Invoice PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}

                        {/* Cancel Booking Action */}
                        {['Confirmed', 'Pending'].includes(booking.bookingStatus) && (
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Cancel Booking"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-slate-400 text-sm">No reservations matching criteria.</div>
      )}

      {/* Slide-over/Modal Form: Create Booking */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-2xl overflow-hidden animate-slide-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Create New Booking</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateBooking}>
              <div className="p-6 space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                
                {/* Customer Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Select Guest</label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>

                {/* Available Rooms Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Select Room</label>
                  <select
                    required
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                  >
                    <option value="">-- Choose Available Room --</option>
                    {availableRooms.map(r => (
                      <option key={r._id} value={r._id}>Room {r.roomNumber} - {r.roomType} (₹{r.pricePerNight}/night)</option>
                    ))}
                  </select>
                </div>

                {/* Check In Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Check-In Date</label>
                  <DatePicker
                    value={checkIn}
                    onChange={(date) => setCheckIn(date)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none text-slate-850 dark:text-slate-100"
                  />
                </div>

                {/* Check Out Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Check-Out Date</label>
                  <DatePicker
                    value={checkOut}
                    onChange={(date) => setCheckOut(date)}
                    min={checkIn || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none text-slate-850 dark:text-slate-100"
                  />
                </div>

                {/* Discount */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none text-slate-850 dark:text-slate-100"
                  />
                </div>

                {/* Dynamic pricing preview pane */}
                {previewTotals && (
                  <div className="md:col-span-2 p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200/50 dark:border-slate-800/50 space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-primary-500" />
                      <span>Billing Calculation Preview</span>
                    </h4>
                    <div className="grid grid-cols-2 text-sm gap-y-1 text-slate-650 dark:text-slate-350">
                      <div>Stay Duration:</div>
                      <div className="font-semibold text-right">{previewTotals.nights} Night(s)</div>
                      
                      <div>Subtotal ({previewTotals.nights} × ₹{previewTotals.pricePerNight}):</div>
                      <div className="font-semibold text-right">₹{previewTotals.subtotal.toFixed(2)}</div>
                      
                      <div>GST (18%):</div>
                      <div className="font-semibold text-right">₹{previewTotals.tax.toFixed(2)}</div>
                      
                      {previewTotals.discount > 0 && (
                        <>
                          <div className="text-rose-500">Discount Amount:</div>
                          <div className="font-semibold text-rose-500 text-right">-₹{previewTotals.discount.toFixed(2)}</div>
                        </>
                      )}
                    </div>
                    
                    <div className="border-t border-slate-200 dark:border-slate-800/50 pt-2 mt-2 flex justify-between items-baseline">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Estimated Total:</span>
                      <span className="text-lg font-extrabold text-primary-600 dark:text-primary-400">₹{previewTotals.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons footer */}
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-md shadow-primary-600/10"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Settlement popup dialog */}
      {payingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md overflow-hidden animate-slide-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Record Guest Payment</h3>
              <button onClick={() => setPayingBooking(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {/* Form */}
            <form onSubmit={handleProcessPayment} className="p-6 space-y-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-850 dark:text-indigo-300 text-xs rounded-xl border border-indigo-150/50 dark:border-indigo-900/30 flex gap-2">
                <Info className="w-5 h-5 shrink-0" />
                <div>
                  <div className="font-bold">Booking Ref: {payingBooking.bookingId}</div>
                  <div>Outstanding balance due: <strong className="text-sm font-extrabold">₹{payingBooking.totalAmount.toFixed(2)}</strong></div>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  max={payingBooking.totalAmount.toString()}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Method */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="UPI">UPI Transfer</option>
                  <option value="Razorpay">Razorpay Online Gateway</option>
                  <option value="Other">Direct Bank Deposit</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                <button
                  type="button"
                  onClick={() => setPayingBooking(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  Process Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                {Math.max(0, checkInBooking.totalAmount - (checkInBooking.paidAmount || 0)) <= 0 ? (
                  <div className="px-3 py-2 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Full payment already completed (Balance: ₹0.00). No advance required.
                  </div>
                ) : (
                  <>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      max={(Math.round(Math.max(0, checkInBooking.totalAmount - (checkInBooking.paidAmount || 0)) * 100) / 100).toFixed(2)}
                      value={checkInAdvanceAmount}
                      onChange={(e) => setCheckInAdvanceAmount(e.target.value)}
                      placeholder="Enter advance amount (e.g. 1000)"
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
                    <option value="Razorpay">Razorpay Online Gateway</option>
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
                      <option value="Razorpay">Razorpay Online Gateway</option>
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

      {/* Extend Stay Modal */}
      <ExtendStayModal
        booking={extendStayBooking}
        isOpen={!!extendStayBooking}
        onClose={() => setExtendStayBooking(null)}
        onSuccess={fetchBookings}
        showToast={showToast}
      />
    </div>
  );
};

export default Bookings;
