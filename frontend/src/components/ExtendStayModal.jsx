import React, { useState, useEffect } from 'react';
import { 
  CalendarPlus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  DollarSign, 
  Sparkles, 
  Bed, 
  Loader2,
  Receipt,
  CreditCard,
  Info,
  ShieldCheck,
  Banknote
} from 'lucide-react';
import api from '../services/api';

const ExtendStayModal = ({ booking, isOpen, onClose, onSuccess, showToast }) => {
  if (!isOpen || !booking) return null;

  const [selectedDays, setSelectedDays] = useState(1);
  const [customDate, setCustomDate] = useState('');
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payingOldBalance, setPayingOldBalance] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const currentCheckIn = new Date(booking.checkIn);
  const currentCheckOut = new Date(booking.checkOut);
  const originalCheckOut = booking.originalCheckOut ? new Date(booking.originalCheckOut) : currentCheckOut;
  const minCustomDate = new Date(currentCheckOut.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Financial calculations of existing booking
  const originalTotalAmount = parseFloat(booking.totalAmount || 0);
  const advancePaid = parseFloat(
    booking.paidAmount || 
    booking.advancePayment || 
    booking.advanceAmount || 
    (booking.paymentStatus === 'Paid' ? originalTotalAmount : 0)
  );
  const currentRemainingDue = Math.max(0, originalTotalAmount - advancePaid);

  const fetchPreview = async (days, customDateVal) => {
    try {
      setLoadingPreview(true);
      setErrorMsg('');
      const payload = customDateVal 
        ? { newCheckOutDate: customDateVal }
        : { additionalDays: days };

      const bId = booking._id || booking.id;
      const res = await api.post(`/bookings/${bId}/preview-extension`, payload);
      
      if (res.data?.success) {
        setPreviewData(res.data.data);
      }
    } catch (err) {
      console.error('Preview extension error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to calculate stay extension');
      setPreviewData(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (isCustomDate && customDate) {
      fetchPreview(null, customDate);
    } else if (!isCustomDate) {
      fetchPreview(selectedDays, null);
    }
  }, [selectedDays, customDate, isCustomDate, booking]);

  const handleSelectPill = (days) => {
    setIsCustomDate(false);
    setSelectedDays(days);
  };

  // 1. Regular Extend (Add to Room Folio / Pay at Check-out)
  const handleConfirmExtend = async () => {
    try {
      setSubmitting(true);
      const bId = booking._id || booking.id;
      const payload = isCustomDate
        ? { newCheckOutDate: customDate, paymentOption: 'AddToFolio' }
        : { additionalDays: selectedDays, paymentOption: 'AddToFolio' };

      const res = await api.post(`/bookings/${bId}/extend`, payload);
      
      if (res.data?.success) {
        if (showToast) {
          showToast(res.data.message || 'Stay extended successfully!', 'success');
        }
        if (onSuccess) {
          onSuccess(res.data.data);
        }
        onClose();
      }
    } catch (err) {
      console.error('Confirm extension error:', err);
      const msg = err.response?.data?.message || 'Failed to extend stay';
      setErrorMsg(msg);
      if (showToast) {
        showToast(msg, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Pay Old Check-Out Due First via Razorpay & Then Extend Stay
  const handlePayOldBalanceAndExtend = async () => {
    try {
      setPayingOldBalance(true);
      setErrorMsg('');

      // Step A: Load Razorpay Checkout SDK
      const isLoaded = await new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!isLoaded) {
        setErrorMsg('Failed to initialize Razorpay payment gateway');
        setPayingOldBalance(false);
        return;
      }

      // Step B: Create Razorpay order for current remaining due
      const bId = booking._id || booking.id;
      const orderRes = await api.post('/payments/razorpay/order', {
        bookingId: bId,
        advanceAmount: currentRemainingDue
      });

      if (!orderRes.data?.success) {
        throw new Error('Could not initialize payment order');
      }

      const orderData = orderRes.data.data;

      // Step C: Open Razorpay checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Urban Tadka',
        description: `Old Check-out Settlement (BK: ${booking.bookingId || bId})`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            if (showToast) showToast('Verifying payment...', 'info');
            
            // Verify payment
            const verifyRes = await api.post('/payments/razorpay/verify', {
              bookingId: bId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              advanceAmount: currentRemainingDue
            });

            if (verifyRes.data?.success) {
              if (showToast) showToast('Old check-out balance cleared! Extending stay...', 'success');
              
              // Extend stay after payment cleared
              const payload = isCustomDate
                ? { newCheckOutDate: customDate, paymentOption: 'Paid' }
                : { additionalDays: selectedDays, paymentOption: 'Paid' };

              const extRes = await api.post(`/bookings/${bId}/extend`, payload);
              if (extRes.data?.success) {
                if (showToast) showToast('Stay extended successfully!', 'success');
                if (onSuccess) onSuccess(extRes.data.data);
                onClose();
              }
            }
          } catch (vErr) {
            console.error('Payment verification failed:', vErr);
            setErrorMsg(vErr.response?.data?.message || 'Payment verification failed');
          } finally {
            setPayingOldBalance(false);
          }
        },
        prefill: {
          name: booking.customer?.name || 'Guest',
          email: booking.customer?.email || '',
          contact: booking.customer?.phone || ''
        },
        theme: {
          color: '#059669'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (payErr) {
      console.error('Pay Old Balance Error:', payErr);
      setErrorMsg(payErr.response?.data?.message || payErr.message || 'Payment initiation failed');
      setPayingOldBalance(false);
    }
  };

  // Safe numerical calculations for preview
  const extraSubtotal = previewData ? parseFloat(previewData.extraSubtotal || 0) : 0;
  const extraTax = previewData ? parseFloat(previewData.extraTax || 0) : 0;
  const additionalAmount = previewData ? parseFloat(previewData.additionalAmount || 0) : 0;
  const newTotalStayAmount = originalTotalAmount + additionalAmount;
  const grandTotalDueAtCheckout = currentRemainingDue + additionalAmount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="bg-[#0b1322] text-white rounded-3xl border border-slate-800 w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-up overflow-hidden">
        
        {/* ── STICKY HEADER (Always Visible at Top) ── */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-black text-white tracking-wide">
                Extend Stay Reservation
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Room {booking.room?.roomNumber || 'N/A'} • {booking.room?.roomType || 'Deluxe Suite'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── SCROLLABLE BODY (Scrolls cleanly if height is small) ── */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* 1. CURRENT BOOKING & OLD CHECKOUT SUMMARY (Purane Checkout Ka Hisab) */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-900/70 rounded-2xl border border-slate-800/80 text-xs">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Old Check-Out (Initial)</span>
              <span className="font-extrabold text-white text-xs sm:text-sm block">
                {currentCheckOut.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-[9px] text-slate-500 font-medium">
                Check-in: {currentCheckIn.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div className="space-y-0.5 border-x border-slate-800 px-2.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Advance Paid</span>
              <span className="font-extrabold text-emerald-400 text-xs sm:text-sm block">
                ₹{advancePaid.toFixed(2)}
              </span>
              <span className="text-[9px] text-slate-500 font-medium">
                Total Stay: ₹{originalTotalAmount.toFixed(2)}
              </span>
            </div>

            <div className="space-y-0.5 text-right">
              <span className="text-[9px] font-bold text-amber-400/90 uppercase tracking-wider block">Old Check-out Due</span>
              <span className={`font-extrabold text-xs sm:text-sm block ${currentRemainingDue > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                ₹{currentRemainingDue.toFixed(2)}
              </span>
              <span className="text-[9px] text-slate-500 font-medium">
                {currentRemainingDue > 0 ? 'Purana Baaki Paisa' : 'Fully Paid'}
              </span>
            </div>
          </div>

          {/* 2. DURATION SELECTOR (Kitne Din Badhane Hain) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                Select Extension Duration:
              </label>
              <span className="text-xs font-bold text-amber-400">
                Tariff: ₹{booking.pricePerNight || booking.room?.pricePerNight || 0} / night
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 7].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleSelectPill(days)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                    !isCustomDate && selectedDays === days
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 scale-[1.02]'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80'
                  }`}
                >
                  +{days} {days === 1 ? 'Night' : 'Nights'}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsCustomDate(true)}
                className={`col-span-2 py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                  isCustomDate
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Custom Date</span>
              </button>
            </div>

            {/* Custom Date Input */}
            {isCustomDate && (
              <div className="pt-1 animate-in fade-in duration-200">
                <input
                  type="date"
                  min={minCustomDate}
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* 3. LIVE ITEMIZATION & TOTAL CHECKOUT SETTLEMENT */}
          {loadingPreview ? (
            <div className="p-5 bg-slate-900/40 rounded-2xl text-center text-xs text-slate-400 flex items-center justify-center gap-2 border border-slate-800/60">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Calculating live tariff & checking room availability...</span>
            </div>
          ) : errorMsg ? (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-bold text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : previewData ? (
            <div className="p-3.5 sm:p-4 bg-gradient-to-br from-slate-900 via-slate-900/90 to-[#0c1b30] border border-emerald-500/30 rounded-2xl space-y-3 shadow-inner">
              
              {/* Room Availability Badge & New Date */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">New Extended Check-Out Date</span>
                  <span className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    {new Date(previewData.newCheckOut).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div>
                  {previewData.isAvailable ? (
                    <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[11px] font-black flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Room Available
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-full text-[11px] font-black flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Room Occupied
                    </span>
                  )}
                </div>
              </div>

              {/* Itemized Extension Charges */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Extra Stay Charges ({previewData.addedDays} {previewData.addedDays === 1 ? 'night' : 'nights'} @ ₹{previewData.pricePerNight}):</span>
                  <span className="font-bold text-white">₹{extraSubtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>Goods & Service Tax (18% GST):</span>
                  <span className="font-bold text-white">₹{extraTax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xs font-bold text-emerald-400 pt-1 border-t border-slate-800/80">
                  <span>Total Extension Charges (Naye Dino Ka Paisa):</span>
                  <span>₹{additionalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* FINAL SETTLEMENT SUMMARY BOX (Check-out Total Due) */}
              <div className="p-3 bg-slate-950/85 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>1. Old Check-out Due (Purana Baaki Paisa):</span>
                  <span className={`font-bold ${currentRemainingDue > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                    ₹{currentRemainingDue.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>2. Extension Charges (Naye {previewData.addedDays} dino ka):</span>
                  <span className="font-bold text-slate-200">₹{additionalAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-black text-white pt-1.5 border-t border-slate-800">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Receipt className="w-4 h-4" />
                    <span>Total Due at Final Check-Out:</span>
                  </div>
                  <span className="text-base text-amber-400 font-extrabold">
                    ₹{grandTotalDueAtCheckout.toFixed(2)}
                  </span>
                </div>

                <p className="text-[9px] text-slate-500 text-right pt-0.5">
                  (New Total Stay Value: ₹{newTotalStayAmount.toFixed(2)} • Advance Paid Earlier: ₹{advancePaid.toFixed(2)})
                </p>
              </div>
            </div>
          ) : null}

        </div>

        {/* ── STICKY FOOTER ACTIONS (Always Pinned at Bottom) ── */}
        <div className="p-4 sm:px-6 sm:py-3.5 border-t border-slate-800/90 bg-slate-900/95 shrink-0 space-y-2.5">
          {currentRemainingDue > 0 ? (
            <>
              {/* Row 1: Equal Split (Cancel on Left, Pay Old Due on Right) */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-700/50 flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cancel</span>
                </button>

                <button
                  type="button"
                  onClick={handlePayOldBalanceAndExtend}
                  disabled={payingOldBalance || submitting || loadingPreview || (previewData && !previewData.isAvailable) || !!errorMsg}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-95 border border-emerald-500/30"
                >
                  {payingOldBalance ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay Old Due (₹{currentRemainingDue.toFixed(2)}) & Extend</span>
                    </>
                  )}
                </button>
              </div>

              {/* Row 2: Bottom Full-Width Center Action */}
              <button
                type="button"
                onClick={handleConfirmExtend}
                disabled={submitting || payingOldBalance || loadingPreview || (previewData && !previewData.isAvailable) || !!errorMsg}
                className="w-full py-2.5 px-5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    <span>Confirming Extension...</span>
                  </>
                ) : (
                  <>
                    <CalendarPlus className="w-4 h-4 text-slate-950" />
                    <span>Add to Final Check-out Bill (Pay Total at Desk)</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* When there is no old due, show Cancel Left and Confirm Right */
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-700/50 flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmExtend}
                disabled={submitting || loadingPreview || (previewData && !previewData.isAvailable) || !!errorMsg}
                className="col-span-2 py-2 px-5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    <span>Confirming Extension...</span>
                  </>
                ) : (
                  <>
                    <CalendarPlus className="w-4 h-4 text-slate-950" />
                    <span>Confirm & Extend Stay</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtendStayModal;
