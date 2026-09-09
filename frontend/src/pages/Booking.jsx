import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Clock,
  ShieldAlert, 
  ShieldCheck, 
  CalendarPlus, 
  Building, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Upload, 
  Loader2, 
  ArrowRight, 
  Users, 
  Baby, 
  Ticket, 
  CreditCard, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import api from '../services/api';
import { getAssetUrl } from '../utils/url';
import DatePicker from '../components/DatePicker';
import UrbanTadkaLogo from '../assets/urban-tadka-hotel-logo.jpg';

const Booking = () => {
  const { showToast } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Booking details
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, type, value }
  const [couponError, setCouponError] = useState('');

  // Advance Payment state
  const [paymentType, setPaymentType] = useState('advance'); // 'advance' or 'full'
  const [customAdvance, setCustomAdvance] = useState('1000');

  // Customer KYC details
  const [userProfile, setUserProfile] = useState(null);
  const [hasKycDoc, setHasKycDoc] = useState(false);
  const [aadhaarStatus, setAadhaarStatus] = useState('');
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDocUploadPromptModal, setShowDocUploadPromptModal] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mock Payment Simulator states
  const [showMockPaymentModal, setShowMockPaymentModal] = useState(false);
  const [mockOrderDetails, setMockOrderDetails] = useState(null); // { bookingId, orderId, amount }

  const fetchBookingData = async () => {
    try {
      setIsLoading(true);
      // Fetch available rooms
      const roomRes = await api.get('/rooms');
      if (roomRes.data.success) {
        // filter for available rooms
        const available = roomRes.data.data.filter(r => r.roomStatus === 'Available' || r.status === 'Available');
        setRooms(available);
      }

      // Fetch user profile for KYC check & autofill
      const profileRes = await api.get('/users/profile');
      if (profileRes.data.success) {
        const profile = profileRes.data.data;
        setUserProfile(profile);

        // Check if Aadhaar Card exists in documents
        let docs = [];
        if (profile.documents) {
          if (Array.isArray(profile.documents)) {
            docs = profile.documents;
          } else if (typeof profile.documents === 'string') {
            try {
              docs = JSON.parse(profile.documents);
            } catch (e) {
              docs = [];
            }
          }
        }
        const aadhaarDoc = Array.isArray(docs) ? docs.find(d => d && d.docType === 'Aadhaar Card') : null;
        if (aadhaarDoc) {
          setHasKycDoc(aadhaarDoc.status === 'Verified');
          setAadhaarStatus(aadhaarDoc.status);
        } else {
          setHasKycDoc(false);
          setAadhaarStatus('');
        }
      }
    } catch (error) {
      console.error('Failed to load booking page details:', error);
      showToast('Error loading page details. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingData();
    if (location.state?.autoOpenUpload) {
      setTimeout(() => {
        document.getElementById('book-room-doc-file-input')?.click();
      }, 400);
    }
  }, [location.state]);

  // Handle inline Aadhaar Card upload
  const handleAadhaarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Document size must be less than 10MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('docType', 'Aadhaar Card');
    formData.append('document', file);

    setIsUploadingDoc(true);
    try {
      const response = await api.post('/users/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(pct);
        },
      });

      if (response.data.success) {
        showToast('Aadhaar Card uploaded successfully for KYC verification', 'success');
        
        // Refresh local states
        const updatedDocs = response.data.data;
        setUserProfile(prev => prev ? { ...prev, documents: updatedDocs } : null);
        
        const aadhaarDoc = updatedDocs.find(d => d.docType === 'Aadhaar Card');
        if (aadhaarDoc) {
          setHasKycDoc(aadhaarDoc.status === 'Verified');
          setAadhaarStatus(aadhaarDoc.status);
        }
      }
    } catch (error) {
      console.error('KYC upload failed:', error);
      showToast(error.response?.data?.message || 'Failed to upload identity proof', 'error');
    } finally {
      setIsUploadingDoc(false);
      setUploadProgress(0);
    }
  };

  const handleRoomSelect = (e) => {
    const roomId = e.target.value;
    const room = rooms.find(r => r._id === roomId);
    setSelectedRoom(room || null);
  };

  // Helper to calculate pricing details locally
  const getBilling = () => {
    if (!selectedRoom || !checkIn || !checkOut) return null;
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime()) || inDate >= outDate) return null;

    const diffDays = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24)) || 1;
    const roomCharges = selectedRoom.pricePerNight * diffDays;
    
    // Apply discount
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percent') {
        discount = roomCharges * (appliedCoupon.value / 100);
      } else if (appliedCoupon.type === 'flat') {
        discount = appliedCoupon.value;
      }
      discount = Math.min(discount, roomCharges);
    }

    const gst = Math.round((roomCharges * 0.18) * 100) / 100;
    const grandTotal = Math.round((roomCharges + gst - discount) * 100) / 100;

    return {
      nights: diffDays,
      roomCharges,
      gst,
      discount,
      grandTotal
    };
  };

  const billing = getBilling();

  const applyCouponCode = () => {
    setCouponError('');
    if (!coupon) return;
    
    const code = coupon.toUpperCase().trim();
    if (code === 'Urban Tadka10' || code === 'HORIZON10') {
      setAppliedCoupon({ code, type: 'percent', value: 10 });
      showToast('Coupon Urban Tadka10 applied! (10% off room charges)', 'success');
    } else if (code === 'Urban Tadka20' || code === 'GRAND20') {
      setAppliedCoupon({ code, type: 'percent', value: 20 });
      showToast('Coupon Urban Tadka20 applied! (20% off room charges)', 'success');
    } else if (code === 'WELCOME') {
      setAppliedCoupon({ code, type: 'flat', value: 500 });
      showToast('Coupon WELCOME applied! (Flat ₹500 discount)', 'success');
    } else {
      setCouponError('Invalid coupon code');
      setAppliedCoupon(null);
    }
  };

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

  const handleProceedToPayment = async (e) => {
    e.preventDefault();

    if (!selectedRoom) {
      showToast('Please select a room', 'error');
      return;
    }

    if (!checkIn || !checkOut) {
      showToast('Please enter both Check-In and Check-Out dates', 'error');
      return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      showToast('Check-Out date must be after Check-In date', 'error');
      return;
    }

    // Check if customer has uploaded documents
    let docs = [];
    const rawDocs = userProfile?.documents;
    if (rawDocs) {
      if (Array.isArray(rawDocs)) docs = rawDocs;
      else if (typeof rawDocs === 'string') {
        try { docs = JSON.parse(rawDocs); } catch(e) { docs = []; }
      }
    }

    if (!docs || docs.length === 0) {
      showToast('❌ Document Not Uploaded! Please upload your Government ID document before booking a room.', 'error');
      setShowDocUploadPromptModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create a Pending Booking
      const payload = {
        roomId: selectedRoom._id,
        checkIn,
        checkOut,
        discount: billing ? billing.discount : 0
      };

      const response = await api.post('/bookings', payload);
      if (!response.data.success) {
        throw new Error('Failed to create pending booking');
      }

      const bookingData = response.data.data.booking;
      const bookingId = bookingData._id;

      const advanceToPay = paymentType === 'advance' ? parseFloat(customAdvance || 0) : null;

      // 2. Generate Razorpay Order
      const orderRes = await api.post('/payments/razorpay/order', { 
        bookingId,
        advanceAmount: advanceToPay
      });
      if (!orderRes.data.success) {
        throw new Error('Failed to initiate Razorpay transaction');
      }

      const orderData = orderRes.data.data;

      // 3. Check for Sandbox/Mock Mode
      if (orderData.isMock) {
        setMockOrderDetails({
          bookingId,
          orderId: orderData.orderId,
          amount: orderData.amount / 100,
          advanceAmount: advanceToPay
        });
        setShowMockPaymentModal(true);
      } else {
        // Real Razorpay integration
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          showToast('Failed to load Razorpay Payment Gateway.', 'error');
          setIsSubmitting(false);
          return;
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Urban Tadka',
          description: `Room Booking for Room ${selectedRoom.roomNumber}`,
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
                showToast('Payment successful! Booking confirmed.', 'success');
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
            contact: userProfile?.phone
          },
          theme: {
            color: '#6366f1'
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
              setIsSubmitting(false);
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
          setIsSubmitting(false);
        });

        rzp.open();
      }

    } catch (error) {
      console.error('Booking/Payment workflow failed:', error);
      showToast(error.response?.data?.message || 'Failed to initialize payment process', 'error');
      setIsSubmitting(false);
    }

  };

  const handleSimulatePayment = async (statusType) => {
    setShowMockPaymentModal(false);
    setIsSubmitting(true);
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
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1450px] mx-auto pb-12">
      {/* ── Premium Hero Banner ── */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 sm:p-8 border border-emerald-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/10 via-teal-500/8 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-500/6 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CalendarPlus className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent font-serif">
                  Book a Room
                </h1>
                <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-widest mt-0.5">
                  Instant Reservations · Live Pricing · Instant Confirmation
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400/90 max-w-xl leading-relaxed mt-1">
              Reserve custom room stays instantly with seamless booking experience for Urban Tadka.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Booking Entry fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Upload status banner */}
          {aadhaarStatus || (userProfile?.documents && (Array.isArray(userProfile.documents) ? userProfile.documents.length > 0 : String(userProfile.documents).length > 2)) ? (
            <div className="p-4 border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center transition-all duration-300 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-emerald-700 dark:text-emerald-300">✅ Document Uploaded</h4>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {aadhaarStatus === 'Verified' ? 'Verified ✓' : 'Uploaded'}
                    </span>
                  </div>
                  <p className="text-xs opacity-90 mt-0.5 font-medium">Your identity document is uploaded. You can proceed to reserve your room.</p>
                </div>
              </div>
              <label className="py-2 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-600/20 active:scale-95">
                <Upload className="w-4 h-4" />
                <span>Update Document</span>
                <input type="file" onChange={handleAadhaarUpload} accept="image/*,.pdf" className="hidden" />
              </label>
            </div>
          ) : (
            <div className="p-4 border-2 border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-300 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center transition-all duration-300 shadow-md shadow-rose-500/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-6 h-6 text-rose-500 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-rose-600 dark:text-rose-400">❌ Document Not Uploaded</h4>
                    <span className="text-[10px] bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Required to Book Room
                    </span>
                  </div>
                  <p className="text-xs text-rose-600/90 dark:text-rose-300/90 mt-0.5 font-semibold">
                    Please upload your Government ID document (Aadhaar, Passport, DL) before booking a room!
                  </p>
                </div>
              </div>
              {isUploadingDoc ? (
                <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading {uploadProgress}%</span>
                </div>
              ) : (
                <label className="py-2.5 px-4 text-xs font-extrabold bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-lg shadow-rose-600/20 active:scale-95">
                  <Upload className="w-4 h-4" />
                  <span>Upload Document Now</span>
                  <input id="book-room-doc-file-input" type="file" onChange={handleAadhaarUpload} accept="image/*,.pdf" className="hidden" />
                </label>
              )}
            </div>
          )}

          {/* Form */}
          <div className="glass-card p-6">
            <form onSubmit={handleProceedToPayment} className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                Booking Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Choose Room */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    <span>Select Room</span>
                  </label>
                  <select
                    required
                    onChange={handleRoomSelect}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100 dark:bg-slate-900"
                  >
                    <option value="">Select an available room</option>
                    {rooms.map(room => (
                      <option key={room._id} value={room._id}>
                        Room {room.roomNumber} - {room.roomType} (₹{room.pricePerNight}/night)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Check In */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Check-In Date</span>
                  </label>
                  <DatePicker
                    value={checkIn}
                    onChange={(date) => setCheckIn(date)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Check Out */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Check-Out Date</span>
                  </label>
                  <DatePicker
                    value={checkOut}
                    onChange={(date) => setCheckOut(date)}
                    min={checkIn || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Guests */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Adult Guests</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Children */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Baby className="w-3.5 h-3.5" />
                    <span>Children</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    required
                    value={childrenCount}
                    onChange={(e) => setChildrenCount(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Coupon Code */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Promo Coupon Code</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Urban Tadka10, WELCOME, Urban Tadka20"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-855 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={applyCouponCode}
                      className="px-4 py-2 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-[11px] text-rose-500 font-medium">{couponError}</p>}
                  {appliedCoupon && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <span>✓ Coupon '{appliedCoupon.code}' applied!</span>
                      <span>({appliedCoupon.type === 'percent' ? `${appliedCoupon.value}% off` : `₹${appliedCoupon.value} flat discount`})</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Option: Full vs Advance */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Payment Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentType('advance')}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      paymentType === 'advance'
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>Pay Advance Only</span>
                      {paymentType === 'advance' && <span className="w-2 h-2 rounded-full bg-indigo-500"></span>}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Pay small token now, balance at check-out</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('full')}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      paymentType === 'full'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>Pay Full Amount</span>
                      {paymentType === 'full' && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      ₹{billing ? billing.grandTotal.toFixed(2) : '0.00'} (Fully Settled)
                    </div>
                  </button>
                </div>

                {paymentType === 'advance' && (
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/40 rounded-2xl space-y-2">
                    <label className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Advance Amount to Pay Now (₹)</label>
                    <input
                      type="number"
                      min="100"
                      max={billing ? billing.grandTotal : 50000}
                      value={customAdvance}
                      onChange={e => setCustomAdvance(e.target.value)}
                      placeholder="Enter advance amount (e.g. 500 or 1000)"
                      className="w-full px-3.5 py-2 border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-extrabold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 pt-0.5">
                      <span>Remaining Balance at Check-Out:</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        ₹{billing ? Math.max(0, billing.grandTotal - (parseFloat(customAdvance) || 0)).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action trigger button */}
              <div className="flex justify-end pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 py-3 px-6 bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-850 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-semibold rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-md active:scale-95 disabled:scale-100 disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Proceed To Payment</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Room Details and Invoice Summary preview */}
        <div className="space-y-6">
          {/* Selected Room Metadata card */}
          {selectedRoom && (
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800/80 pb-2">
                Selected Room
              </h3>
              
              {/* Room images preview */}
              {selectedRoom.images?.length > 0 ? (
                <div className="w-full h-32 rounded-xl overflow-hidden">
                  <img
                    src={getAssetUrl(selectedRoom.images[0])}
                    alt="Room Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-32 rounded-xl bg-slate-100 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 text-xs">
                  No Room Images Available
                </div>
              )}

              <div className="space-y-1">
                <span className="font-bold text-slate-850 dark:text-slate-100 text-base">
                  Room {selectedRoom.roomNumber}
                </span>
                <p className="text-xs text-slate-400 font-medium">Type: {selectedRoom.roomType}</p>
              </div>

              {/* Room amenities */}
              {selectedRoom.amenities?.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amenities Included</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRoom.amenities.map((amenity, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-500 rounded-md">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Guest Details Autofilled */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800/80 pb-2">
              Billed Guest details
            </h3>

            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Full Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{userProfile?.name || 'Loading...'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Email</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{userProfile?.email || 'Loading...'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Phone Number</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{userProfile?.phone || 'Loading...'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Address</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{userProfile?.address || 'Not Provided'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Billing Preview Summary */}
          {billing && (
            <div className="glass-card p-6 bg-primary-50/10 dark:bg-primary-950/5 border-primary-100/50 dark:border-primary-900/10 space-y-4">
              <h4 className="text-sm font-bold text-primary-800 dark:text-primary-300 uppercase tracking-wide border-b border-primary-100/30 dark:border-primary-900/30 pb-2">
                Booking Cost Breakdown
              </h4>
              <div className="space-y-2.5 text-xs text-slate-650 dark:text-slate-350">
                <div className="flex justify-between">
                  <span>Price Per Night</span>
                  <span className="font-semibold">₹{selectedRoom.pricePerNight}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Stay</span>
                  <span className="font-semibold">{billing.nights} Night(s)</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal Room Charges</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">₹{billing.roomCharges.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span className="font-semibold">₹{billing.gst.toFixed(2)}</span>
                </div>
                
                {billing.discount > 0 && (
                  <div className="flex justify-between text-rose-500 font-semibold">
                    <span>Discount Applied</span>
                    <span>-₹{billing.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-dashed border-slate-250 dark:border-slate-800 pt-3 mt-1 text-sm font-bold text-slate-850 dark:text-slate-100">
                  <span className="uppercase text-xs font-black">Grand Total</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    ₹{billing.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Razorpay Sandbox Mock Modal */}
      {showMockPaymentModal && mockOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-6 animate-scale-up text-slate-800 dark:text-slate-200">
            <div className="text-center space-y-2">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-full w-14 h-14 mx-auto border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold">Razorpay Payment Simulator</h3>
              <p className="text-xs text-slate-500">Simulate checkout responses to test the booking workflow without real gateway keys.</p>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-950/25 p-4 rounded-xl text-xs border border-slate-100 dark:border-slate-850/50">
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{mockOrderDetails.orderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Hotel Name</span>
                <span className="flex items-center gap-2 font-semibold text-slate-750 dark:text-slate-350">
                  <img src={UrbanTadkaLogo} alt="Urban Tadka" className="w-6 h-6 rounded-full object-cover ring-1 ring-amber-400/40" />
                  Urban Tadka
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 mt-1 text-sm font-bold">
                <span className="text-slate-400 text-xs">Simulated Amount</span>
                <span className="text-base text-emerald-600 dark:text-emerald-400 font-extrabold">₹{mockOrderDetails.amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              {/* Simulate Failure */}
              <button
                onClick={() => handleSimulatePayment('failed')}
                className="flex-1 py-3 px-4 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-450 font-bold rounded-xl text-xs transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Simulate Failure</span>
              </button>

              {/* Simulate Success */}
              <button
                onClick={() => handleSimulatePayment('success')}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/10 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
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
                  document.getElementById('book-room-doc-file-input')?.click();
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

export default Booking;
