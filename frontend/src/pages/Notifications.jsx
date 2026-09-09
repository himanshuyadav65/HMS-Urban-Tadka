import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bell, ShieldCheck, ShieldAlert, CreditCard, CalendarDays, Key, Trash2, ArrowRight } from 'lucide-react';
import api from '../services/api';

const Notifications = () => {
  const { showToast } = useOutletContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const generateNotifications = async () => {
    try {
      setLoading(true);
      const items = [];

      // 1. Fetch user profile for KYC notifications
      const profileRes = await api.get('/users/profile');
      if (profileRes.data.success) {
        const u = profileRes.data.data;
        let docs = [];
        if (u.documents) {
          if (Array.isArray(u.documents)) {
            docs = u.documents;
          } else if (typeof u.documents === 'string') {
            try {
              docs = JSON.parse(u.documents);
            } catch (e) {
              docs = [];
            }
          }
        }
        const aadhaarDoc = Array.isArray(docs) ? docs.find(d => d && d.docType === 'Aadhaar Card') : null;
        
        if (aadhaarDoc) {
          if (aadhaarDoc.status === 'Verified') {
            items.push({
              id: 'kyc-approved',
              type: 'kyc_approved',
              title: 'Document Approved',
              message: 'Your identity document has been verified successfully by our front desk.',
              date: aadhaarDoc.uploadedAt || new Date(),
              read: false,
              icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
              bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
            });
          } else if (aadhaarDoc.status === 'Rejected') {
            items.push({
              id: 'kyc-rejected',
              type: 'kyc_rejected',
              title: 'Document Needs Re-upload',
              message: 'Your uploaded document was rejected. Please re-upload a clear copy from your profile or dashboard.',
              date: aadhaarDoc.uploadedAt || new Date(),
              read: false,
              icon: <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-450" />,
              bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30'
            });
          } else {
            items.push({
              id: 'kyc-pending',
              type: 'kyc_pending',
              title: 'Document Under Review',
              message: 'Your uploaded identity document is currently under review by front desk staff.',
              date: aadhaarDoc.uploadedAt || new Date(),
              read: false,
              icon: <Bell className="w-5 h-5 text-amber-600 dark:text-amber-450" />,
              bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
            });
          }
        }
      }

      // 2. Fetch bookings for booking and payment status alerts
      const bookingsRes = await api.get('/bookings');
      if (bookingsRes.data.success) {
        const bookings = bookingsRes.data.data;
        
        bookings.forEach(b => {
          const formattedDate = new Date(b.createdAt).toLocaleString();
          
          // Booking Cancellations
          if (b.bookingStatus === 'Cancelled') {
            items.push({
              id: `cancel-${b._id}`,
              type: 'booking_cancel',
              title: 'Booking Cancelled',
              message: `Your reservation ${b.bookingId} for Room ${b.room?.roomNumber || 'N/A'} has been cancelled successfully.`,
              date: b.updatedAt || b.createdAt,
              read: false,
              icon: <Trash2 className="w-5 h-5 text-rose-650 dark:text-rose-400" />,
              bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30'
            });
          }

          // Booking Confirmation & Payment success
          if (b.bookingStatus === 'Confirmed') {
            items.push({
              id: `confirm-${b._id}`,
              type: 'booking_success',
              title: 'Booking Confirmed!',
              message: `Congratulations! Your booking ${b.bookingId} for Room ${b.room?.roomNumber || 'N/A'} is confirmed for ${b.totalDays} night(s).`,
              date: b.createdAt,
              read: false,
              icon: <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
              bg: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30'
            });

            if (b.paymentStatus === 'Paid') {
              items.push({
                id: `pay-success-${b._id}`,
                type: 'payment_success',
                title: 'Payment Successful',
                message: `We received a payment of ₹${b.totalAmount.toFixed(2)} for reservation ${b.bookingId}. Your room is locked!`,
                date: b.updatedAt || b.createdAt,
                read: false,
                icon: <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
                bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
              });
            }
          }

          // Payment Failures
          if (b.paymentStatus === 'Failed') {
            items.push({
              id: `pay-failed-${b._id}`,
              type: 'payment_failure',
              title: 'Payment Failed',
              message: `The payment transaction for booking ${b.bookingId} has failed. The room was not reserved. Please retry checkout.`,
              date: b.updatedAt || b.createdAt,
              read: false,
              icon: <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
              bg: 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-200/40 dark:border-rose-900/20'
            });
          }

          // Room Ready (Checked-In)
          if (b.bookingStatus === 'CheckedIn') {
            items.push({
              id: `checkedin-${b._id}`,
              type: 'room_ready',
              title: 'Room Assigned & Ready',
              message: `Welcome to Urban Tadka! Your key has been assigned for Room ${b.room?.roomNumber}. Enjoy your stay!`,
              date: b.updatedAt || b.createdAt,
              read: false,
              icon: <Key className="w-5 h-5 text-teal-650 dark:text-teal-400" />,
              bg: 'bg-teal-50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/30'
            });
          }
        });
      }

      // Sort by date descending
      items.sort((a, b) => new Date(b.date) - new Date(a.date));
      setNotifications(items);
    } catch (error) {
      console.error('Failed to generate notifications:', error);
      showToast('Error syncing notifications inbox feed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateNotifications();
  }, []);

  if (loading) {
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
                <Bell className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent font-serif">
                  Notifications Inbox
                </h1>
                <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-widest mt-0.5">
                  Live Feed · Document Verification Updates · Reservations
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400/90 max-w-xl leading-relaxed mt-1">
              View real-time updates about your document verifications, booking reservations, and payments.
            </p>
          </div>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-full border border-slate-200 dark:border-slate-800">
            <Bell className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-150">Inbox Empty</h3>
            <p className="text-xs text-slate-500 mt-1">You have no notification logs at the moment.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 w-full">
          {notifications.map((n) => (
            <div key={n.id} className={`p-4 rounded-2xl border ${n.bg} flex items-start gap-4 transition-all duration-200 hover:-translate-y-px`}>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-800/50">
                {n.icon}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-150">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 font-semibold">{new Date(n.date).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
