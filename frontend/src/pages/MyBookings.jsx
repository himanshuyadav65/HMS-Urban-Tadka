import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  CreditCard, 
  Download, 
  Info, 
  CalendarDays, 
  X, 
  HelpCircle, 
  Bed, 
  QrCode, 
  FileText, 
  Star, 
  CheckCircle, 
  CheckCircle2, 
  Eye,
  DollarSign,
  Users,
  Loader2,
  IndianRupee,
  CalendarPlus
} from 'lucide-react';
import api from '../services/api';
import { TableSkeleton } from '../components/Skeletons';
import UrbanTadkaLogo from '../assets/urban-tadka-hotel-logo.jpg';
import ExtendStayModal from '../components/ExtendStayModal';

const MyBookings = () => {
  const outletContext = useOutletContext();
  const showToast = outletContext?.showToast || ((msg) => console.log(msg));
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  // Modals state
  const [selectedQr, setSelectedQr] = useState(null); // booking for QR
  const [selectedReview, setSelectedReview] = useState(null); // booking for review
  const [selectedReceipt, setSelectedReceipt] = useState(null); // payment for receipt view
  const [selectedExtendBooking, setSelectedExtendBooking] = useState(null); // booking to extend stay
  
  // Review form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('Overall');
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings');
      if (response.data.success) {
        setBookings(response.data.data);
      }

      // Fetch payments to match payment details (method, transaction ID)
      const payRes = await api.get('/payments');
      if (payRes.data.success) {
        setPayments(payRes.data.data);
      }

      // Fetch invoices
      const invRes = await api.get('/invoices');
      if (invRes.data.success) {
        setInvoices(invRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings details:', error);
      showToast('Failed to load your reservations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }
    
    try {
      setCancellingId(bookingId);
      const response = await api.post(`/bookings/${bookingId}/cancel`);
      if (response.data.success) {
        showToast('Booking cancelled successfully', 'success');
        fetchData();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showToast(error.response?.data?.message || 'Failed to cancel booking', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const handleDownloadInvoice = async (bookingId) => {
    try {
      showToast('Searching invoice details...', 'info');
      const invoice = invoices.find(inv => (inv.booking?._id || inv.booking) === bookingId);
      const targetId = invoice ? invoice._id : bookingId;
      const invoiceNum = invoice ? invoice.invoiceNumber : 'pdf';
      
      showToast('Downloading invoice PDF...', 'info');
      const response = await api.get(`/invoices/${targetId}/download`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `invoice-${invoiceNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showToast('Invoice PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showToast('Failed to download invoice', 'error');
    }
  };

  const handlePayBookingRazorpay = async (booking) => {
    try {
      const remainingAmount = Math.max(0, booking.totalAmount - (booking.paidAmount || booking.advanceAmount || 0));
      if (remainingAmount <= 0) {
        showToast('This booking is already fully paid.', 'info');
        return;
      }

      showToast('Initiating Razorpay checkout...', 'info');
      const orderRes = await api.post('/payments/razorpay/order', {
        bookingId: booking._id,
        advanceAmount: remainingAmount
      });

      if (!orderRes.data.success) {
        throw new Error('Could not create payment order');
      }

      const orderData = orderRes.data.data;

      // Load checkout.js
      const isLoaded = await new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!isLoaded) {
        showToast('Failed to load Razorpay SDK', 'error');
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Urban Tadka',
        description: `Settlement for Booking ${booking.bookingId}`,
        order_id: orderData.orderId,
        handler: async function (paymentResponse) {
          try {
            showToast('Verifying payment signature...', 'info');
            const verifyRes = await api.post('/payments/razorpay/verify', {
              bookingId: booking._id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              advanceAmount: booking.totalAmount
            });

            if (verifyRes.data.success) {
              showToast('Payment successful! Booking updated to Paid.', 'success');
              fetchData();
            } else {
              showToast('Payment verification failed.', 'error');
            }
          } catch (err) {
            console.error(err);
            showToast('Verification failed.', 'error');
          }
        },
        theme: {
          color: '#6366f1'
        },
        modal: {
          ondismiss: function () {
            showToast('Payment window closed.', 'info');
          }
        }
      };

      const rzp = new window.Razorpay(options);

      // Record failed payment ONLY when an actual payment attempt failed (e.g. bank decline, network error, invalid OTP)
      rzp.on('payment.failed', async function (response) {
        try {
          await api.post('/payments/razorpay/verify', {
            bookingId: booking._id,
            status: 'failed',
            razorpay_payment_id: response.error?.metadata?.payment_id || '',
            razorpay_order_id: response.error?.metadata?.order_id || '',
            reason: response.error?.description || 'Transaction declined'
          });
          showToast(`Payment attempt failed: ${response.error?.description || 'Transaction declined'}`, 'error');
          fetchData();
        } catch (err) {
          console.error('Failed to log failed payment:', err);
        }
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Payment initiation failed', 'error');
    }

  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedReview) return;
    
    setSubmittingReview(true);
    try {
      const bookingTargetId = selectedReview.id || selectedReview._id;
      const res = await api.post('/reviews', {
        bookingId: bookingTargetId,
        rating: Number(rating),
        reviewText: comment,
        category
      });
      showToast(res.data?.message || 'Review submitted successfully! Thank you for your feedback.', 'success');
      setSelectedReview(null);
      setComment('');
      setRating(5);
      setCategory('Overall');
      fetchData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/30';
      case 'CheckedIn':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30';
      case 'CheckedOut':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-400 border border-slate-200/30 dark:border-slate-700/30';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/30';
      case 'Pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200/50 dark:border-amber-850/30';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getPaymentBadgeClass = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30';
      case 'Unpaid':
        return 'bg-slate-100 text-slate-650 dark:bg-slate-800/40 dark:text-slate-400 border border-slate-250/30 dark:border-slate-800/30';
      case 'Failed':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/30';
      case 'PartiallyPaid':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/30';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

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
                  My Bookings
                </h1>
                <p className="text-[10px] text-blue-400/70 font-bold uppercase tracking-widest mt-0.5">
                  Reservations · Digital Check-In · Invoice Receipts
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400/90 max-w-xl leading-relaxed mt-1">
              Track and manage your hotel reservations, digital check-in passes, and invoice receipts.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/book-room')}
              className="px-5 py-3 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer border border-blue-400/30 flex items-center gap-2"
            >
              <Bed className="w-4 h-4 text-blue-200" />
              <span>Book a New Room</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <TableSkeleton columns={5} rows={3} />
      ) : bookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((booking) => {
            // Find completed payment
            const completedPayment = payments.find(p => p.booking?._id === booking._id && p.paymentStatus === 'Completed');
            // Find invoice
            const invoice = invoices.find(inv => inv.booking?._id === booking._id);

            return (
              <div key={booking._id} className="glass-card overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                
                {/* Card Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100">
                      Room {booking.room?.roomNumber || 'N/A'}
                    </h3>
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                      {booking.room?.roomType || 'Category N/A'}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getStatusBadgeClass(booking.bookingStatus)}`}>
                      {booking.bookingStatus}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPaymentBadgeClass(booking.paymentStatus)}`}>
                      Payment: {booking.paymentStatus === 'PartiallyPaid' ? 'Advance Paid (Partial)' : booking.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4 text-slate-705 dark:text-slate-350">
                  {/* Booking Metadata */}
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Booking ID: <strong className="font-mono text-slate-600 dark:text-slate-300">{booking.bookingId}</strong></span>
                    {invoice && <span>Invoice: <strong className="font-mono text-slate-600 dark:text-slate-300">{invoice.invoiceNumber}</strong></span>}
                  </div>

                  {/* Stay Dates */}
                  <div className="flex justify-between items-center text-sm bg-slate-950/5 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                    <div className="text-center">
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Check-in</span>
                      <span className="font-bold text-slate-750 dark:text-slate-200">
                        {new Date(booking.checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <CalendarDays className="w-5 h-5 text-indigo-400" />
                    <div className="text-center">
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Check-out</span>
                      <span className="font-bold text-slate-750 dark:text-slate-200">
                        {new Date(booking.checkOut).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Advance Payment Breakdown Box */}
                  <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span className="font-medium">Total Booking Charge:</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">₹{Number(booking.totalAmount || 0).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>🟢 Advance Paid at Check-In / Booking:</span>
                      <span className="font-extrabold">
                        ₹{Number(booking.paidAmount ?? booking.advanceAmount ?? (booking.paymentStatus === 'Paid' ? booking.totalAmount : 0) ?? 0).toFixed(2)}
                      </span>
                    </div>

                    {(Number(booking.totalAmount || 0) > Number(booking.paidAmount || booking.advanceAmount || 0)) && booking.paymentStatus !== 'Paid' ? (
                      <div className="flex justify-between items-center border-t border-blue-200/40 pt-1.5 text-rose-600 dark:text-rose-400 font-extrabold">
                        <span>Remaining Balance at Check-Out:</span>
                        <span className="text-sm">
                          ₹{Math.max(0, Number(booking.totalAmount || 0) - Number(booking.paidAmount || booking.advanceAmount || 0)).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center border-t border-blue-200/40 pt-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <span>Settlement Status:</span>
                        <span className="font-extrabold text-xs">✓ Fully Settled (₹0.00 Balance Due)</span>
                      </div>
                    )}
                  </div>

                  {/* Booking details list */}
                  <div className="grid grid-cols-2 gap-y-2 text-xs border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Guest Count:</span>
                    </div>
                    <div className="text-right font-bold text-slate-800 dark:text-slate-200">
                      {booking.guestsCount || 1} Adult {booking.childrenCount > 0 ? `, ${booking.childrenCount} Child` : ''}
                    </div>

                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Total Nights:</span>
                    </div>
                    <div className="text-right font-bold text-slate-800 dark:text-slate-200">{booking.totalDays || 1} night(s)</div>

                    {completedPayment && (
                      <>
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          <span>Paid Via:</span>
                        </div>
                        <div className="text-right font-bold text-slate-800 dark:text-slate-200">
                          {completedPayment.paymentMethod || 'Online'} (Ref: {String(completedPayment.transactionId || '').slice(0,12)}...)
                        </div>
                      </>
                    )}
                  </div>

                  {/* Pricing Total */}
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grand Total Charged:</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{Number(booking.totalAmount || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 flex flex-wrap gap-2 justify-between">
                  <div className="flex gap-2 w-full sm:w-auto">
                    {/* QR Code button */}
                    {booking.bookingStatus !== 'Cancelled' && (
                      <button
                        onClick={() => setSelectedQr(booking)}
                        className="p-2 bg-slate-100 hover:bg-slate-250 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 text-xs font-bold"
                        title="Show check-in QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>QR Code</span>
                      </button>
                    )}

                    {/* View Invoice button */}
                    {invoice && (
                      <button
                        onClick={() => handleDownloadInvoice(booking._id)}
                        className="p-2 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-250 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 text-xs font-bold"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Invoice</span>
                      </button>
                    )}

                    {/* View Receipt button */}
                    {completedPayment && (
                      <button
                        onClick={() => setSelectedReceipt(completedPayment)}
                        className="p-2 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-250 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 text-xs font-bold"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Receipt</span>
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 flex-1 sm:flex-initial">
                    {/* Extend Stay Button */}
                    {['CheckedIn', 'Confirmed'].includes(booking.bookingStatus) && (
                      <button
                        onClick={() => setSelectedExtendBooking(booking)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 rounded-xl font-extrabold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                        title="Extend your stay / add more nights"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        <span>Extend Stay</span>
                      </button>
                    )}

                    {/* Pay Now Button (if not fully paid) */}
                    {booking.paymentStatus !== 'Paid' && booking.bookingStatus !== 'Cancelled' && (
                      <button
                        onClick={() => handlePayBookingRazorpay(booking)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                        title="Pay remaining amount securely with Razorpay"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay with Razorpay</span>
                      </button>
                    )}

                    {/* Review Button */}
                    {booking.bookingStatus === 'CheckedOut' && (
                      <button
                        onClick={() => setSelectedReview(booking)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-900/30 border border-amber-200/50 dark:border-amber-900/30 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>Leave Review</span>
                      </button>
                    )}

                    {/* Cancel Button */}
                    {['Pending', 'Confirmed'].includes(booking.bookingStatus) && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        disabled={cancellingId === booking._id}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1 py-2 px-3 border border-rose-200 hover:border-rose-500 dark:border-rose-900/30 dark:hover:border-rose-500/50 text-rose-500 hover:bg-rose-500/5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{cancellingId === booking._id ? 'Cancelling...' : 'Cancel'}</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-16 text-center space-y-4">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <div className="text-slate-400 text-sm">You haven't made any reservations yet.</div>
          <button
            onClick={() => navigate('/rooms')}
            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer inline-flex items-center gap-2"
          >
            <Bed className="w-4 h-4" />
            <span>Browse Available Rooms</span>
          </button>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="relative max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4 text-slate-800 dark:text-slate-200 text-center animate-scale-up">
            <button
              onClick={() => setSelectedQr(null)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pt-2">
              <h3 className="text-lg font-bold">Booking QR Check-In</h3>
              <p className="text-xs text-slate-400">Present this QR Code to the receptionist desk on check-in.</p>
            </div>

            {/* QR Code generator */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 w-44 h-44 mx-auto flex items-center justify-center shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(selectedQr.bookingId)}`}
                alt="Booking Check-In QR"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-lg text-slate-700 dark:text-slate-300">
                {selectedQr.bookingId}
              </span>
              <p className="text-[10px] text-slate-400">Room Number: {selectedQr.room?.roomNumber} | Check-in: {new Date(selectedQr.checkIn).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Leave Review Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity">
          <form onSubmit={handleSubmitReview} className="relative max-w-md w-full bg-white dark:bg-[#071322] border border-amber-500/20 dark:border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-7 space-y-5 text-slate-800 dark:text-slate-200 animate-scale-up">
            <button
              type="button"
              onClick={() => setSelectedReview(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 text-center">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase tracking-widest mb-1">
                ⭐ Urban Tadka Guest Rating
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">Rate Your Stay</h3>
              <p className="text-xs text-slate-400">
                Booking #{selectedReview.bookingId} {selectedReview.room?.roomNumber ? `· Room ${selectedReview.room.roomNumber}` : ''}
              </p>
            </div>

            {/* Interactive Stars Selector */}
            <div className="flex flex-col items-center gap-1.5 py-1">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'text-slate-200 dark:text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-500 mt-1">
                {rating === 5 ? '⭐⭐⭐⭐⭐ Exceptional (5.0)' :
                 rating === 4 ? '⭐⭐⭐⭐ Very Good (4.0)' :
                 rating === 3 ? '⭐⭐⭐ Average (3.0)' :
                 rating === 2 ? '⭐⭐ Poor (2.0)' : '⭐ Terrible (1.0)'}
              </span>
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rating Focus</label>
              <div className="flex flex-wrap gap-1.5">
                {['Overall', 'Room', 'Service', 'Food', 'Cleanliness', 'Staff'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      category === cat
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Your Experience</label>
              <textarea
                required
                rows="3"
                placeholder="How was your stay at Urban Tadka? Tell us about the amenities, staff hospitality, and room comfort..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs transition-all duration-200 cursor-pointer shadow-lg shadow-amber-500/25 active:scale-95"
            >
              {submittingReview ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Submit Guest Rating</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Selected Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="relative max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-6 text-slate-800 dark:text-slate-200 animate-scale-up print:shadow-none">
            
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 cursor-pointer print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="flex justify-center mb-2">
                <img src={UrbanTadkaLogo} alt="Urban Tadka" className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400/50 shadow-lg print:ring-amber-600" />
              </div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white print:text-black">Urban Tadka</h2>
              <p className="text-xs text-slate-400">Transaction Payment Receipt</p>
              <div className="pt-2 border-b border-dashed border-slate-200 dark:border-slate-800 w-2/3 mx-auto"></div>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-950/25 p-4 rounded-xl text-xs border border-slate-100 dark:border-slate-850/50 print:bg-transparent print:border-none print:p-0">
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction Ref</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedReceipt.transactionId || 'N/A'}</span>
              </div>
              {selectedReceipt.paymentId && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Gateway ID</span>
                  <span className="font-mono font-semibold text-slate-600 dark:text-slate-400">{selectedReceipt.paymentId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedReceipt.paymentStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Method Type</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Paid Timestamp</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{new Date(selectedReceipt.paidAt || selectedReceipt.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-dashed border-slate-200 dark:border-slate-800 pt-4">
              <span className="font-bold text-slate-900 dark:text-white uppercase text-xs">Total Amount</span>
              <div className="flex items-center text-xl font-black text-emerald-600 dark:text-emerald-400">
                <IndianRupee className="w-4 h-4 mt-0.5" />
                <span>{Number(selectedReceipt?.amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extend Stay Modal */}
      <ExtendStayModal
        booking={selectedExtendBooking}
        isOpen={!!selectedExtendBooking}
        onClose={() => setSelectedExtendBooking(null)}
        onSuccess={fetchData}
        showToast={showToast}
      />
    </div>
  );
};

export default MyBookings;
