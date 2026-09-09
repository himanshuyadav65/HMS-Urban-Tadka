import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Shield, Eye, Calendar, CalendarDays, Loader2, IndianRupee, Sparkles, LayoutGrid, List, XCircle, CheckCircle2, CreditCard, X, Bed } from 'lucide-react';
import api from '../services/api';
import { getAssetUrl } from '../utils/url';
import { useAuth } from '../context/AuthContext';
import { GridSkeleton, TableSkeleton } from '../components/Skeletons';
import DatePicker from '../components/DatePicker';
import UrbanTadkaLogo from '../assets/urban-tadka-hotel-logo.jpg';

const Rooms = () => {
  const { user } = useAuth();
  const { showToast } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // View mode & file uploads
  const [viewMode, setViewMode] = useState(user?.role === 'Customer' ? 'grid' : 'table');
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Customer booking states
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [showDocUploadPromptModal, setShowDocUploadPromptModal] = useState(false);
  const [bookingRoom, setBookingRoom] = useState(null);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [bookingPaymentType, setBookingPaymentType] = useState('advance'); // 'advance' | 'full'
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState('Online'); // 'Online' | 'UPI' | 'NetBanking' | 'Cash'
  const [customAdvanceAmount, setCustomAdvanceAmount] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Customer KYC and Direct Payment states
  const [userProfile, setUserProfile] = useState(null);
  const [aadhaarStatus, setAadhaarStatus] = useState('');
  const [showMockPaymentModal, setShowMockPaymentModal] = useState(false);
  const [mockOrderDetails, setMockOrderDetails] = useState(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  // Form states
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('Single');
  const [floor, setFloor] = useState('1');
  const [pricePerNight, setPricePerNight] = useState('');
  const [capacity, setCapacity] = useState('1');
  const [amenities, setAmenities] = useState('');
  const [description, setDescription] = useState('');
  const [roomStatus, setRoomStatus] = useState('Available');
  const [isCustomType, setIsCustomType] = useState(false);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (filterType) params.roomType = filterType;
      if (filterStatus) params.status = filterStatus;

      const response = await api.get('/rooms', { params });
      if (response.data.success) {
        setRooms(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      showToast('Failed to load rooms list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [search, filterType, filterStatus]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.role === 'Customer') {
        try {
          const res = await api.get('/users/profile');
          if (res.data.success) {
            setUserProfile(res.data.data);
            const doc = res.data.data.documents?.find(d => d.docType === 'Aadhaar Card');
            setAadhaarStatus(doc ? doc.status : '');
          }
        } catch (err) {
          console.error('Error fetching user profile in Rooms:', err);
        }
      }
    };
    fetchUserProfile();
  }, [user]);

  const resetForm = () => {
    setRoomNumber('');
    setRoomType('Single');
    setFloor('1');
    setPricePerNight('');
    setCapacity('1');
    setAmenities('');
    setDescription('');
    setRoomStatus('Available');
    setSelectedFiles([]);
    setIsCustomType(false);
    setEditingRoom(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (location.state?.openCreateModal) {
      handleOpenCreateModal();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const handleOpenBookingModal = (room) => {
    let docs = [];
    const rawDocs = userProfile?.documents || user?.documents;
    if (rawDocs) {
      if (Array.isArray(rawDocs)) docs = rawDocs;
      else if (typeof rawDocs === 'string') {
        try { docs = JSON.parse(rawDocs); } catch (e) { docs = []; }
      }
    }

    if (user?.role === 'Customer' && (!docs || docs.length === 0)) {
      showToast('❌ Document Not Uploaded! Please upload your Government ID document before booking a room.', 'error');
      setShowDocUploadPromptModal(true);
      return;
    }

    setBookingRoom(room);
    setCheckInDate('');
    setCheckOutDate('');
    setBookingPaymentType('advance');
    setCustomAdvanceAmount('');
    setIsBookingModalOpen(false);
    setIsBookingModalOpen(true);
  };

  const calculateStayNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = end - start;
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateStayNights();
  const subtotal = bookingRoom ? bookingRoom.pricePerNight * nights : 0;
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  // Calculate default advance (e.g. 1 night charge with tax or 30% of total)
  const defaultMinAdvance = bookingRoom && nights > 0 ? Math.round(Math.min(total, bookingRoom.pricePerNight * 1.18)) : 100;
  
  // Set default initial advance when nights/room change if field is empty
  useEffect(() => {
    if (bookingRoom && nights > 0 && customAdvanceAmount === '') {
      setCustomAdvanceAmount(defaultMinAdvance.toString());
    }
  }, [nights, bookingRoom, defaultMinAdvance]);

  const parsedCustom = parseFloat(customAdvanceAmount);
  const payableAmountNow = bookingPaymentType === 'full' 
    ? total 
    : (isNaN(parsedCustom) ? 0 : Math.min(total, Math.max(0, parsedCustom)));
  const remainingBalanceAtCheckIn = Math.max(0, total - payableAmountNow);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSimulatePayment = async (statusType) => {
    setShowMockPaymentModal(false);
    setBookingLoading(true);
    try {
      if (statusType === 'success') {
        showToast('Simulating Payment Success...', 'info');
        const verifyRes = await api.post('/payments/razorpay/verify', {
          bookingId: mockOrderDetails.bookingId,
          razorpay_order_id: mockOrderDetails.orderId,
          razorpay_payment_id: `pay_mock_${Math.floor(100000 + Math.random() * 900000)}`,
          razorpay_signature: 'mock_signature_verified',
          advanceAmount: mockOrderDetails.advanceAmount
        });

        if (verifyRes.data.success) {
          showToast('Mock Payment Approved! Booking Confirmed.', 'success');
          setIsBookingModalOpen(false);
          fetchRooms();
          navigate('/my-bookings');
        } else {
          showToast('Mock verification rejected.', 'error');
        }
      } else {
        showToast('Simulating Payment Failure...', 'warning');
        await api.post('/payments/razorpay/verify', {
          bookingId: mockOrderDetails.bookingId,
          status: 'failed',
          razorpay_order_id: mockOrderDetails.orderId,
          razorpay_payment_id: `pay_failed_mock`
        });
        showToast('Mock Payment Failed. Booking set to Pending/Failed.', 'error');
      }
    } catch (error) {
      console.error('Mock simulator verify hook failed:', error);
      showToast('Error validating simulation result.', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (nights <= 0) {
      showToast('Please select valid check-in and check-out dates (check-out must be after check-in)', 'error');
      return;
    }
    
    try {
      setBookingLoading(true);
      const advanceToPay = payableAmountNow;

      const payload = {
        roomId: bookingRoom._id || bookingRoom.id,
        checkIn: new Date(checkInDate).toISOString(),
        checkOut: new Date(checkOutDate).toISOString(),
      };
      
      const response = await api.post('/bookings', payload);
      if (!response.data.success) {
        throw new Error(response.data?.message || 'Failed to create pending booking');
      }

      const bookingData = response.data.data.booking;
      const bookingId = bookingData._id || bookingData.id;

      // Handle Cash Desk Payment
      if (bookingPaymentMethod === 'Cash' || user?.role !== 'Customer') {
        if (advanceToPay > 0) {
          try {
            await api.post('/payments', {
              bookingId,
              paymentMethod: 'Cash',
              amount: advanceToPay,
              transactionId: `CSH-${Math.floor(10000000 + Math.random() * 90000000)}`
            });
          } catch (pErr) {
            console.error('Cash payment ledger log error:', pErr);
          }
        }

        showToast(
          bookingPaymentMethod === 'Cash'
            ? 'Booking confirmed! Please pay cash at front desk.'
            : 'Booking created successfully!',
          'success'
        );
        setIsBookingModalOpen(false);
        fetchRooms();
        navigate(user?.role === 'Customer' ? '/my-bookings' : '/bookings');
        return;
      }

      // Otherwise Online / UPI / NetBanking via Razorpay Gateway
      const orderRes = await api.post('/payments/razorpay/order', { 
        bookingId,
        advanceAmount: advanceToPay
      });
      if (!orderRes.data.success) {
        throw new Error(orderRes.data?.message || 'Failed to initiate transaction');
      }

      const orderData = orderRes.data.data;

      // Mock checkout
      if (orderData.isMock) {
        setMockOrderDetails({
          bookingId,
          orderId: orderData.orderId,
          amount: orderData.amount / 100,
          advanceAmount: advanceToPay
        });
        setShowMockPaymentModal(true);
      } else {
        // Real Razorpay checkout
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          showToast('Failed to load Razorpay Payment Gateway.', 'error');
          setBookingLoading(false);
          return;
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Urban Tadka',
          description: `Room Booking for Room ${bookingRoom.roomNumber} (${bookingPaymentType === 'advance' ? 'Advance Payment' : 'Full Payment'} - ${bookingPaymentMethod})`,
          order_id: orderData.orderId,
          handler: async function (paymentResponse) {
            try {
              showToast('Verifying payment signature...', 'info');
              const verifyRes = await api.post('/payments/razorpay/verify', {
                bookingId,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                advanceAmount: advanceToPay
              });

              if (verifyRes.data.success) {
                showToast('Payment successful! Booking confirmed & registered.', 'success');
                setIsBookingModalOpen(false);
                fetchRooms();
                navigate('/my-bookings');
              } else {
                showToast('Verification failed. Room is released.', 'error');
              }
            } catch (err) {
              console.error(err);
              showToast('Payment verification failed.', 'error');
            }
          },
          prefill: {
            name: userProfile?.name,
            email: userProfile?.email,
            contact: userProfile?.phone,
            method: bookingPaymentMethod === 'UPI' ? 'upi' : bookingPaymentMethod === 'NetBanking' ? 'netbanking' : 'card'
          },
          theme: {
            color: '#10b981'
          },
          modal: {
            ondismiss: async function () {
              try {
                // User exited Razorpay without paying -> delete the unconfirmed draft booking completely!
                await api.delete(`/bookings/${bookingId}`);
                showToast('Payment window closed. Booking cancelled & room released.', 'info');
              } catch (err) {
                console.error('Error discarding unconfirmed booking:', err);
              }
              setBookingLoading(false);
              setIsBookingModalOpen(false);
              fetchRooms();
            }
          }
        };


        const rzp = new window.Razorpay(options);

        // Record failed payment ONLY when an actual payment attempt failed (e.g. bank decline, network error, invalid OTP)
        rzp.on('payment.failed', async function (response) {
          try {
            await api.post('/payments/razorpay/verify', {
              bookingId,
              status: 'failed',
              razorpay_payment_id: response.error?.metadata?.payment_id || '',
              razorpay_order_id: response.error?.metadata?.order_id || '',
              reason: response.error?.description || 'Transaction declined'
            });
            showToast(`Payment attempt failed: ${response.error?.description || 'Transaction declined'}`, 'error');
          } catch (err) {
            console.error('Failed to register failed payment:', err);
          }
          setBookingLoading(false);
        });

        rzp.open();
      }
    } catch (error) {
      console.error('Booking/Payment workflow failed:', error);
      showToast(error.response?.data?.message || error.message || 'Failed to initialize booking payment process', 'error');
      setBookingLoading(false);
    }

  };


  const handleOpenEditModal = (room) => {
    setEditingRoom(room);
    setRoomNumber(room.roomNumber);
    setRoomType(room.roomType);
    setFloor(room.floor.toString());
    setPricePerNight(room.pricePerNight.toString());
    setCapacity(room.capacity.toString());
    setAmenities(Array.isArray(room.amenities) ? room.amenities.join(', ') : (typeof room.amenities === 'string' ? room.amenities : ''));
    setDescription(room.description || '');
    setRoomStatus(room.status);

    const defaultTypes = ['Single', 'Double', 'Deluxe', 'Suite'];
    if (!defaultTypes.includes(room.roomType)) {
      setIsCustomType(true);
    } else {
      setIsCustomType(false);
    }

    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      roomNumber,
      roomType,
      floor: parseInt(floor),
      pricePerNight: parseFloat(pricePerNight),
      capacity: parseInt(capacity),
      amenities: amenities.split(',').map(a => a.trim()).filter(Boolean),
      description,
      status: roomStatus
    };

    try {
      let roomId = null;
      if (editingRoom) {
        // Update room endpoint
        const response = await api.put(`/rooms/${editingRoom._id}`, payload);
        if (response.data.success) {
          roomId = editingRoom._id;
          showToast('Room details updated successfully', 'success');
        }
      } else {
        // Create room endpoint
        const response = await api.post('/rooms', payload);
        if (response.data.success) {
          roomId = response.data.data._id;
          showToast('Room created successfully', 'success');
        }
      }

      // If we have selectedFiles and a valid roomId, upload them
      if (roomId && selectedFiles.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append('images', selectedFiles[i]);
        }
        await api.post(`/rooms/${roomId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Images uploaded successfully', 'success');
      }

      setIsModalOpen(false);
      resetForm();
      fetchRooms();
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Error occurred while saving room';
      showToast(errMsg, 'error');
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await api.delete(`/rooms/${id}`);
      if (response.data.success) {
        showToast('Room deleted successfully', 'success');
        fetchRooms();
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to delete room';
      showToast(errMsg, 'error');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30';
      case 'Booked':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30';
      case 'Maintenance':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30';
      case 'Cleaning':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const defaultTypes = ['Single', 'Double', 'Deluxe', 'Suite'];
  const uniqueRoomTypes = Array.from(new Set([
    ...defaultTypes,
    ...(Array.isArray(rooms) ? rooms.map(r => r.roomType) : [])
  ])).filter(Boolean);

  const isAdmin = user?.role === 'Admin' || user?.role === 'Receptionist';

  const availableCount = rooms.filter(r => r.status === 'Available').length;
  const bookedCount = rooms.filter(r => r.status === 'Booked').length;
  const cleaningCount = rooms.filter(r => r.status === 'Cleaning').length;
  const maintenanceCount = rooms.filter(r => r.status === 'Maintenance').length;

  return (
    <div className="space-y-6 max-w-[1450px] mx-auto pb-12">

      {/* ── Premium Hero Banner ── */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 sm:p-8 border border-indigo-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-blue-500/8 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/6 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Bed className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-blue-200 to-white bg-clip-text text-transparent font-serif">
                  Hotel Rooms
                </h1>
                <p className="text-[10px] text-indigo-400/70 font-bold uppercase tracking-widest mt-0.5">
                  Room Inventory · Pricing · Status Management
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400/90 max-w-xl leading-relaxed mt-1">
              Configure room types, pricing rates, availability status, and amenities for Urban Tadka.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-5 py-3 bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-600 hover:from-indigo-400 hover:to-blue-500 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer border border-indigo-400/30 flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-indigo-200" />
                <span>Add New Room</span>
              </button>
            )}
            <button
              onClick={fetchRooms}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all cursor-pointer backdrop-blur-md"
              title="Refresh Rooms"
            >
              <Search className="w-4 h-4 text-indigo-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Available', value: availableCount, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/30', sparkColor: 'text-emerald-500', dot: 'bg-emerald-400', path: 'M5 25 Q15 5, 25 20 T45 10 T55 5' },
          { label: 'Booked', value: bookedCount, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-950/30', sparkColor: 'text-indigo-500', dot: 'bg-indigo-400', path: 'M5 20 L15 10 L25 18 L35 8 L45 15 L55 5' },
          { label: 'Cleaning', value: cleaningCount, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/30', sparkColor: 'text-amber-500', dot: 'bg-amber-400', path: 'M5 15 Q15 25, 25 12 T45 18 T55 10' },
          { label: 'Maintenance', value: maintenanceCount, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-950/30', sparkColor: 'text-rose-500', dot: 'bg-rose-400', path: 'M5 10 L15 22 L25 5 L35 18 L45 8 L55 25' },
        ].map(({ label, value, color, bg, sparkColor, dot, path }) => (
          <div key={label} className="bg-white dark:bg-neutral-900/50 border border-slate-200/50 dark:border-neutral-800/80 rounded-[22px] p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
            <div className="flex justify-between items-center">
              <div className={`w-10 h-10 ${bg} ${color} rounded-full flex items-center justify-center`}>
                <span className={`w-3 h-3 rounded-full ${dot} animate-pulse`} />
              </div>
              <svg className={`w-16 h-8 ${sparkColor}`} viewBox="0 0 60 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d={path} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{value}</h3>
              <span className="block text-xs font-semibold text-slate-400 dark:text-neutral-500 mt-1">{label} Rooms</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter and Search Bar ── */}
      <div className="bg-white dark:bg-neutral-900/50 border border-slate-200/50 dark:border-neutral-800/80 rounded-[22px] p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 inset-y-0 my-auto w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search room number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 dark:text-slate-200"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Filter className="w-4 h-4" />
            <span>Filters:</span>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <option value="">All Categories</option>
            {uniqueRoomTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Available">🟢 Available</option>
            <option value="Booked">🔵 Booked</option>
            <option value="Cleaning">🟡 Cleaning</option>
            <option value="Maintenance">🔴 Maintenance</option>
          </select>

          {/* View Toggle */}
          {(user?.role === 'Admin' || user?.role === 'Receptionist') && (
            <div className="flex items-center border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden p-0.5 bg-slate-50 dark:bg-neutral-950/60">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid or Table listing rooms */}
      {loading ? (
        viewMode === 'table' && (user?.role === 'Admin' || user?.role === 'Receptionist') ? (
          <TableSkeleton rows={5} cols={9} />
        ) : (
          <GridSkeleton />
        )
      ) : rooms.length > 0 ? (
        viewMode === 'table' && (user?.role === 'Admin' || user?.role === 'Receptionist') ? (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4">Image</th>
                    <th className="p-4">Room No.</th>
                    <th className="p-4">Room Type</th>
                    <th className="p-4">Floor</th>
                    <th className="p-4">Price/Night</th>
                    <th className="p-4">Max Guests</th>
                    <th className="p-4">Facilities / Amenities</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {rooms.map((room) => (
                    <tr key={room._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors text-sm text-slate-700 dark:text-slate-300">
                      <td className="p-4">
                        {room.images && room.images.length > 0 ? (
                          <img
                            src={getAssetUrl(room.images[0])}
                            alt={`Room ${room.roomNumber}`}
                            className="w-12 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-850"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&auto=format&fit=crop';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-10 bg-slate-100 dark:bg-slate-850 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-800">
                            <Eye className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-850 dark:text-slate-150">
                        Room {room.roomNumber}
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-semibold px-2 py-1 bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200/20 dark:border-indigo-900/30 rounded-lg">
                          {room.roomType}
                        </span>
                      </td>
                      <td className="p-4 font-medium">{room.floor}</td>
                      <td className="p-4 font-extrabold text-slate-850 dark:text-slate-100">
                        ₹{room.pricePerNight}
                      </td>
                      <td className="p-4 font-medium">{room.capacity} Guest(s)</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(Array.isArray(room.amenities) ? room.amenities : []).map((amenity, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200/20 dark:border-slate-700/20">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${getStatusBadgeClass(room.status)}`}>
                          {room.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(room)}
                            className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Room Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room._id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Delete Room"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => {
              const hasImage = room.images && room.images.length > 0;
              return (
                <div key={room._id} className="glass-card overflow-hidden flex flex-col justify-between hover:shadow-lg dark:hover:shadow-black/20 hover:scale-[1.01] transition-all duration-300">
                  <div>
                    {/* Header Title with image/fallback */}
                    <div className={`h-44 w-full relative flex items-center justify-center border-b border-slate-100 dark:border-slate-850/80 overflow-hidden ${
                      hasImage 
                        ? 'bg-slate-950' 
                        : 'bg-gradient-to-br from-emerald-500/[0.04] via-teal-500/[0.02] to-emerald-500/[0.07] dark:from-emerald-950/15 dark:to-neutral-950'
                    }`}>
                      {hasImage ? (
                        <img
                          src={getAssetUrl(room.images[0])}
                          alt={`Room ${room.roomNumber}`}
                          className="absolute inset-0 w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-emerald-500/10 dark:from-emerald-950/5 dark:to-neutral-950" />
                      )}
                      
                      <div className={`absolute top-4 left-4 font-extrabold text-lg tracking-tight ${
                        hasImage ? 'text-white drop-shadow-md' : 'text-slate-800 dark:text-white'
                      }`}>
                        Room {room.roomNumber}
                      </div>
                      
                      <span className={`absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${getStatusBadgeClass(room.status)}`}>
                        {room.status}
                      </span>
                      
                      {/* Category overlay */}
                      <span className={`absolute bottom-4 left-4 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-lg backdrop-blur-sm border ${
                        hasImage 
                          ? 'text-blue-100 bg-indigo-950/60 border-white/10' 
                          : 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      }`}>
                        {room.roomType}
                      </span>
                    </div>

                    {/* Details list */}
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">₹{room.pricePerNight}</span>
                      <span className="text-xs text-slate-400 font-medium">per night</span>
                    </div>

                    <p className="text-sm text-slate-500 line-clamp-2">{room.description || 'No description specified for this premium room category.'}</p>

                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                        <span>Floor: {room.floor}</span>
                        <span>Capacity: {room.capacity} Guests</span>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {(Array.isArray(room.amenities) ? room.amenities : []).map((amenity, index) => (
                        <span key={index} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md border border-slate-200/20 dark:border-slate-700/20">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons footer */}
                <div className="bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/80 px-5 py-3.5 flex justify-end gap-2">
                  {isAdmin ? (
                    <>
                      <button
                        onClick={() => handleOpenEditModal(room)}
                        className="p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Room Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room._id)}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Delete Room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : user?.role === 'Customer' ? (
                    room.status === 'Available' ? (
                      <button
                        onClick={() => handleOpenBookingModal(room)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer shadow-md shadow-blue-500/10 hover:shadow-lg active:scale-95"
                      >
                        <span>Book Room</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold py-1">
                        Currently {room.status}
                      </span>
                    )
                  ) : (
                    <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 py-1">
                      <Shield className="w-3.5 h-3.5" />
                      <span>View Only Access</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )
      ) : (
        <div className="glass-card p-12 text-center text-slate-400 text-sm">No rooms match the filters or search parameters.</div>
      )}

      {/* CRUD Add/Edit modal form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg overflow-hidden animate-slide-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {editingRoom ? `Edit Room Details - Room ${editingRoom.roomNumber}` : 'Create New Room'}
              </h3>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {/* Room Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Room Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 101"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Room Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Room Type</label>
                    <select
                      value={isCustomType ? 'Custom' : roomType}
                      onChange={(e) => {
                        if (e.target.value === 'Custom') {
                          setIsCustomType(true);
                          setRoomType('');
                        } else {
                          setIsCustomType(false);
                          setRoomType(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                    >
                      {uniqueRoomTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                      <option value="Custom">+ Add Custom Room Type...</option>
                    </select>
                    {isCustomType && (
                      <input
                        type="text"
                        required
                        placeholder="Enter custom room type (e.g. Penthouse)"
                        value={roomType}
                        onChange={(e) => setRoomType(e.target.value)}
                        className="w-full mt-2 px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100 animate-fade-in"
                      />
                    )}
                  </div>

                  {/* Floor */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Floor Number</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Price per night */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Price per Night (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="e.g. 150"
                      value={pricePerNight}
                      onChange={(e) => setPricePerNight(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Capacity */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Guest Capacity</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Room Status</label>
                    <select
                      value={roomStatus}
                      onChange={(e) => setRoomStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                    >
                      <option value="Available">Available</option>
                      <option value="Booked">Booked</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                {/* Amenities */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Amenities (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Free WiFi, TV, AC, Minibar"
                    value={amenities}
                    onChange={(e) => setAmenities(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Images */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Upload Images {selectedFiles.length > 0 && `(${selectedFiles.length} selected)`}
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100 file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  {editingRoom && editingRoom.images && editingRoom.images.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Current Images:</span>
                      <div className="flex flex-wrap gap-2">
                        {editingRoom.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={getAssetUrl(img)}
                            alt={`Preview ${idx + 1}`}
                            className="w-12 h-10 object-cover rounded-md border border-slate-200 dark:border-slate-850"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Description</label>
                  <textarea
                    rows="3"
                    placeholder="Enter room descriptions..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                  ></textarea>
                </div>
              </div>

              {/* Form Footer */}
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-md shadow-primary-600/10"
                >
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Customer Room Booking Modal */}
      {isBookingModalOpen && bookingRoom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#11131a] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-slide-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>Book Room {bookingRoom.roomNumber}</span>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
                    {bookingRoom.roomType}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">₹{bookingRoom.pricePerNight} / Night</p>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateBooking} className="flex flex-col flex-1 overflow-hidden">
              {/* Scrollable Body */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Date Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Check-In Date</label>
                    <input
                      type="date"
                      value={checkInDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Check-Out Date</label>
                    <input
                      type="date"
                      value={checkOutDate}
                      min={checkInDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>

                </div>

                {/* Stay Price Preview Summary & Advance Payment Selector */}
                {nights > 0 ? (
                  <div className="space-y-4 animate-fade-in">
                    {/* Stay Summary Card */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs space-y-2">
                      <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                        <span>Stay Duration ({nights} night{nights > 1 ? 's' : ''}):</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                        <span>GST Tax (18%):</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">₹{tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100">
                        <span>Total Stay Charges:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base">₹{total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Payment Method & Advance/Full Options */}
                    <div className="space-y-4 pt-1">
                      {/* 1. Payment Method Selection */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Choose Payment Method
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setBookingPaymentMethod('Online')}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                              bookingPaymentMethod === 'Online'
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/40 font-bold shadow-sm'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs font-bold">
                                <CreditCard className="w-4 h-4 text-emerald-500" />
                                <span>Online Payment</span>
                              </div>
                              {bookingPaymentMethod === 'Online' && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">UPI, Credit/Debit Cards, Net Banking, QR</p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setBookingPaymentMethod('Cash')}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                              bookingPaymentMethod === 'Cash'
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/40 font-bold shadow-sm'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs font-bold">
                                <span className="text-base leading-none">💵</span>
                                <span>Cash Desk</span>
                              </div>
                              {bookingPaymentMethod === 'Cash' && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Pay with Cash at Front Desk Counter</p>
                          </button>
                        </div>

                      </div>

                      {/* 2. Payment Portion (Advance vs Full) */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Payment Amount Portion
                        </label>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setBookingPaymentType('advance')}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              bookingPaymentType === 'advance'
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Pay Advance</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">Pay partial advance amount</p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setBookingPaymentType('full')}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              bookingPaymentType === 'full'
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Pay Full Amount</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">100% upfront (₹{total.toFixed(0)})</p>
                          </button>
                        </div>

                        {/* Advance Amount Customization */}
                        {bookingPaymentType === 'advance' && (
                          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">Enter Advance Amount (₹):</span>
                              <span className="text-[10px] text-slate-400">Total: ₹{total.toFixed(2)}</span>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                              <input
                                type="number"
                                min="1"
                                max={total}
                                step="1"
                                placeholder="e.g. 250"
                                value={customAdvanceAmount}
                                onChange={(e) => setCustomAdvanceAmount(e.target.value)}
                                className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                              />
                            </div>

                            {/* Quick Preset Chips */}
                            <div className="flex flex-wrap gap-1.5">
                              {[250, 500, Math.round(total * 0.3), Math.round(total * 0.5)].filter((amt, idx, self) => amt > 0 && amt < total && self.indexOf(amt) === idx).map((amt) => (
                                <button
                                  key={amt}
                                  type="button"
                                  onClick={() => setCustomAdvanceAmount(amt.toString())}
                                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                    customAdvanceAmount === amt.toString()
                                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-600'
                                  }`}
                                >
                                  ₹{amt}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => setCustomAdvanceAmount(total.toFixed(0))}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                  customAdvanceAmount === total.toFixed(0)
                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-600'
                                }`}
                              >
                                Full (₹{total.toFixed(0)})
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Live Settlement Breakdown */}
                        <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs space-y-1.5">
                          <div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-300">
                            <span>
                              {bookingPaymentMethod === 'Cash' ? '💵 Payable in Cash at Desk:' : '🟢 Payable Now Online:'}
                            </span>
                            <span className="text-sm">₹{payableAmountNow.toFixed(2)}</span>
                          </div>
                          {remainingBalanceAtCheckIn > 0 ? (
                            <div className="flex justify-between font-semibold text-amber-700 dark:text-amber-400 border-t border-emerald-500/10 pt-1">
                              <span>🟠 Balance Due at Check-Out:</span>
                              <span>₹{remainingBalanceAtCheckIn.toFixed(2)}</span>
                            </div>
                          ) : (
                            <div className="flex justify-between font-semibold text-emerald-600 dark:text-emerald-400 border-t border-emerald-500/10 pt-1">
                              <span>✓ Fully Paid (100%)</span>
                              <span>₹0.00 Balance Due</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-1.5 bg-slate-50/50 dark:bg-slate-900/30 text-slate-400">
                    <Calendar className="w-8 h-8 mx-auto text-emerald-500/50" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Select Check-In & Check-Out dates above
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Pricing summary and advance payment options will appear here.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer - Inside the modal card */}
              <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {bookingPaymentMethod === 'Cash' ? 'Cash Amount' : 'Payable Now'}
                  </span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">₹{payableAmountNow.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading || nights <= 0 || payableAmountNow <= 0}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>
                        {bookingPaymentMethod === 'Cash' 
                          ? `Book Room (Cash ₹${payableAmountNow.toFixed(2)})`
                          : `Confirm & Pay ₹${payableAmountNow.toFixed(2)}`}
                      </span>
                    )}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}



      {/* Razorpay Sandbox Mock Modal */}
      {showMockPaymentModal && mockOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-fade-in">
          <div className="max-w-md w-full bg-white dark:bg-[#0A0B10] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6 text-slate-700 dark:text-slate-200 relative">
            <div className="text-center space-y-2">
              <div className="p-3.5 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-full w-14 h-14 mx-auto border border-emerald-500/20 dark:border-emerald-500/10 flex items-center justify-center">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-850 dark:text-slate-100 font-sans">Razorpay Payment Simulator</h3>
              <p className="text-xs text-slate-400">Simulate checkout responses to test the booking workflow without real gateway keys.</p>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl text-xs border border-slate-150 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-450">Order ID</span>
                <span className="font-mono font-bold text-slate-650 dark:text-slate-350">{mockOrderDetails.orderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-450">Hotel Name</span>
                <span className="flex items-center gap-2 font-semibold text-slate-650 dark:text-slate-350 font-sans">
                  <img src={UrbanTadkaLogo} alt="Urban Tadka" className="w-6 h-6 rounded-full object-cover ring-1 ring-amber-400/40" />
                  Urban Tadka
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 mt-1 text-sm font-semibold">
                <span className="text-slate-450 text-xs">Simulated Amount</span>
                <span className="text-base text-emerald-600 dark:text-emerald-400 font-extrabold">₹{mockOrderDetails.amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              {/* Simulate Failure */}
              <button
                onClick={() => handleSimulatePayment('failed')}
                className="flex-1 py-3 px-4 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Simulate Failure</span>
              </button>

              {/* Simulate Success */}
              <button
                onClick={() => handleSimulatePayment('success')}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulate Success</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Required Prompt Modal (RED ALERT THEME) */}
      {showDocUploadPromptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E0B12] border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl shadow-rose-500/10 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-500/15 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <span className="inline-block px-3 py-1 bg-rose-500/15 text-rose-500 border border-rose-500/30 text-[10px] font-black uppercase tracking-widest rounded-full mb-2">
                ❌ Action Required
              </span>
              <h3 className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-serif">
                Document Upload Required
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed font-medium">
                You cannot book a room without uploading your Government ID document (Aadhaar Card, Passport, etc.). Please upload your document first!
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDocUploadPromptModal(false)}
                className="w-1/2 py-3 bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDocUploadPromptModal(false);
                  navigate('/book-room', { state: { autoOpenUpload: true } });
                }}
                className="w-1/2 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-600/30 cursor-pointer transition-all active:scale-95"
              >
                Upload Document Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
