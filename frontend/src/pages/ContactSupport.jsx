import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Sparkles, MessageSquare, AlertCircle, Send, Paperclip, Loader2, Calendar } from 'lucide-react';
import api from '../services/api';

const ContactSupport = () => {
  const { showToast } = useOutletContext();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const categories = [
    'Room Booking',
    'Payment',
    'Refund',
    'Check-in',
    'Check-out',
    'Documents',
    'Complaint',
    'Technical Issue',
    'Suggestion',
    'Other'
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      bookingId: ''
    }
  });

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get('/bookings');
        if (response.data.success) {
          // Filter to non-cancelled bookings for convenience
          setBookings(response.data.data.filter(b => b.bookingStatus !== 'Cancelled'));
        }
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchBookings();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Maximum attachment size is 5MB', 'error');
        e.target.value = null;
        setSelectedFile(null);
        return;
      }
      const fileExt = file.name.split('.').pop().toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'pdf'].includes(fileExt)) {
        showToast('Only JPG, JPEG, PNG, and PDF files are allowed', 'error');
        e.target.value = null;
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const onSubmit = async (data) => {
    setLoadingSubmit(true);
    try {
      const formData = new FormData();
      formData.append('subject', data.subject);
      formData.append('category', data.category);
      formData.append('description', data.description);
      if (data.bookingId) {
        formData.append('bookingId', data.bookingId);
      }
      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }

      const response = await api.post('/support', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        showToast('Support ticket submitted successfully! Our team will review it.', 'success');
        reset();
        setSelectedFile(null);
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to submit support ticket';
      showToast(errMsg, 'error');
    } finally {
      setLoadingSubmit(false);
    }
  };

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
                <MessageSquare className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent font-serif">
                  Contact Customer Support
                </h1>
                <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-widest mt-0.5">
                  Helpdesk · Guest Assistance · Ticket Resolution
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400/90 max-w-xl leading-relaxed mt-1">
              Have an issue with your stay, payment, or documents? Raise a ticket and our hospitality support team will resolve it.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Subject */}
            <div className="space-y-1.5">
              <label htmlFor="subject" className="block text-xs font-semibold text-slate-450 dark:text-slate-455 uppercase tracking-wider">
                Subject <span className="text-rose-500">*</span>
              </label>
              <input
                id="subject"
                type="text"
                placeholder="Brief summary of the issue"
                className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950/40 border rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors text-sm
                  ${errors.subject ? 'border-rose-500/50 focus:ring-rose-500/50' : 'border-slate-250 dark:border-neutral-900 focus:ring-emerald-500/50'}`}
                {...register('subject', { required: 'Subject is required' })}
              />
              {errors.subject && (
                <span className="text-xs text-rose-455 font-medium">{errors.subject.message}</span>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label htmlFor="category" className="block text-xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="category"
                className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950/40 border rounded-xl text-slate-700 dark:text-neutral-350 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors text-sm
                  ${errors.category ? 'border-rose-500/50 focus:ring-rose-500/50' : 'border-slate-250 dark:border-neutral-900 focus:ring-emerald-500/50'}`}
                {...register('category', { required: 'Category is required' })}
              >
                <option value="" className="text-slate-900 bg-white dark:bg-neutral-900 dark:text-neutral-250">Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat} className="text-slate-900 bg-white dark:bg-neutral-900 dark:text-neutral-250">{cat}</option>
                ))}
              </select>
              {errors.category && (
                <span className="text-xs text-rose-455 font-medium">{errors.category.message}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Booking Linkage (Optional) */}
            <div className="space-y-1.5">
              <label htmlFor="bookingId" className="block text-xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">
                Associated Booking (Optional)
              </label>
              {loadingBookings ? (
                <div className="flex items-center gap-2 h-9 text-xs text-slate-405">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading your reservations...</span>
                </div>
              ) : (
                <select
                  id="bookingId"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950/40 border border-slate-250 dark:border-neutral-900 rounded-xl text-slate-700 dark:text-neutral-350 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors text-sm"
                  {...register('bookingId')}
                >
                  <option value="" className="text-slate-900 bg-white dark:bg-neutral-900 dark:text-neutral-250">Not linked to a specific booking</option>
                  {bookings.map(b => (
                    <option key={b._id} value={b._id} className="text-slate-900 bg-white dark:bg-neutral-900 dark:text-neutral-250">
                      {b.bookingId} - Room {b.room?.roomNumber} ({new Date(b.checkIn).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* File Attachment */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">
                Attachment (Optional, Max 5MB)
              </label>
              <div className="relative">
                <input
                  id="attachment"
                  type="file"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                />
                <label
                  htmlFor="attachment"
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-neutral-950/40 hover:bg-slate-100 dark:hover:bg-neutral-900 border border-slate-250 dark:border-neutral-900 rounded-xl cursor-pointer transition-colors text-sm text-slate-700 dark:text-neutral-300 font-semibold"
                >
                  <Paperclip className="w-4 h-4 text-emerald-650 dark:text-emerald-500" />
                  <span>{selectedFile ? selectedFile.name : 'Upload image / PDF'}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">
              Describe your issue <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="description"
              rows={6}
              placeholder="Please describe your problem or question in detail (minimum 20 characters)..."
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-950/40 border rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors text-sm
                ${errors.description ? 'border-rose-500/50 focus:ring-rose-500/50' : 'border-slate-250 dark:border-neutral-900 focus:ring-emerald-500/50'}`}
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 20, message: 'Message must be at least 20 characters long' }
              })}
            />
            {errors.description && (
              <span className="text-xs text-rose-455 font-medium">{errors.description.message}</span>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-2 justify-end">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="py-2.5 px-6 border border-slate-250 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-900 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer text-slate-700 dark:text-neutral-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loadingSubmit}
              className="flex items-center gap-1.5 py-2.5 px-6 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/10 transition-all duration-200 cursor-pointer active:scale-95 disabled:scale-100"
            >
              {loadingSubmit ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Submit Ticket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactSupport;
