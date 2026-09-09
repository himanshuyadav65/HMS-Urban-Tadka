import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Star, MessageSquare, Trash2, Send, Eye, Filter, BarChart3, StarHalf, X, ChevronDown, CalendarPlus } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Reviews = () => {
  const { showToast } = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCustomer = user?.role === 'Customer';

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState(0);
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [user]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const endpoint = isCustomer ? '/reviews/my' : '/reviews';
      const { data } = await api.get(endpoint);
      setReviews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/reviews/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await api.put(`/reviews/${replyModal.id}/reply`, { adminReply: replyText });
      showToast('Reply sent successfully!', 'success');
      setReplyModal(null);
      setReplyText('');
      fetchReviews();
    } catch (err) {
      showToast('Failed to send reply', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      showToast('Review deleted', 'success');
      fetchReviews();
      fetchStats();
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };

  const filtered = filterRating > 0 ? reviews.filter(r => r.rating === filterRating) : reviews;

  const renderStars = (rating, size = 'w-4 h-4') => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`${size} ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
    ));
  };

  const ratingColors = {
    5: 'bg-emerald-500',
    4: 'bg-lime-500',
    3: 'bg-amber-500',
    2: 'bg-orange-500',
    1: 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/30">
            <Star className="w-5 h-5" />
          </div>
          Guest Reviews & Ratings
        </h1>
        <p className="text-xs text-slate-400/90 mt-1">
          Monitor guest satisfaction, respond to feedback, and track overall hotel ratings for Urban Tadka.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Average Rating Card */}
          <div className="bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 rounded-2xl p-5 text-white shadow-xl shadow-amber-500/20 col-span-1">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-100/80">Overall Rating</p>
            <div className="flex items-end gap-3 mt-2">
              <span className="text-5xl font-black leading-none">{stats.averageRating}</span>
              <div className="pb-1">
                <div className="flex gap-0.5">{renderStars(Math.round(stats.averageRating), 'w-4 h-4')}</div>
                <p className="text-xs text-amber-100 mt-1 font-semibold">{stats.totalReviews} total reviews</p>
              </div>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm col-span-1">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Rating Breakdown</p>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 w-3 font-bold">{star}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${ratingColors[star]} transition-all duration-500`}
                      style={{ width: `${stats.percentages[star] || 0}%` }}
                    />
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 w-8 text-right font-mono">{stats.percentages[star] || 0}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Averages */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm col-span-1">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">By Category</p>
            <div className="space-y-2.5">
              {Object.entries(stats.categoryAverages || {}).map(([cat, avg]) => (
                <div key={cat} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">{cat}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">{renderStars(Math.round(avg), 'w-3 h-3')}</div>
                    <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">{avg}</span>
                  </div>
                </div>
              ))}
              {Object.keys(stats.categoryAverages || {}).length === 0 && (
                <p className="text-slate-400 text-xs italic">No category data yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-semibold">Filter:</span>
        </div>
        <button
          onClick={() => setFilterRating(0)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filterRating === 0
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All ({reviews.length})
        </button>
        {[5, 4, 3, 2, 1].map(star => (
          <button
            key={star}
            onClick={() => setFilterRating(star)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              filterRating === star
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {star} <Star className="w-3 h-3 fill-current" />
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Star className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">No reviews found</p>
          <p className="text-xs text-slate-400 mt-1">Guest reviews will appear here after checkout</p>
          {isCustomer && (
            <button
              onClick={() => navigate('/my-bookings')}
              className="mt-4 inline-flex items-center gap-2 py-2.5 px-5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md hover:scale-105 cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Go to My Bookings to Rate a Stay</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(review => (
            <div key={review.id} className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Customer Info */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                      {review.customer?.name?.charAt(0)?.toUpperCase() || 'G'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-white">{review.customer?.name || 'Guest'}</p>
                      <p className="text-[10px] text-slate-400">
                        {review.customer?.email} • Booking #{review.booking?.bookingId || '—'}
                        {review.booking?.room && ` • Room ${review.booking.room.roomNumber}`}
                      </p>
                    </div>
                  </div>

                  {/* Rating & Category */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ratingColors[review.rating]} text-white`}>
                      {review.rating}.0
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {review.category}
                    </span>
                  </div>

                  {/* Review Text */}
                  {review.reviewText && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                      "{review.reviewText}"
                    </p>
                  )}

                  {/* Admin Reply */}
                  {review.adminReply && (
                    <div className="mt-3 ml-4 pl-3 border-l-2 border-amber-400">
                      <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Management Reply</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{review.adminReply}</p>
                      {review.adminReplyAt && (
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(review.adminReplyAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}

                  {/* Date */}
                  <p className="text-[10px] text-slate-400 mt-2">
                    Reviewed on {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Actions (Staff Only) */}
                {!isCustomer ? (
                  <div className="flex flex-col gap-2 shrink-0">
                    {!review.adminReply && (
                      <button
                        onClick={() => { setReplyModal(review); setReplyText(''); }}
                        className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer"
                        title="Reply to guest"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
                      title="Delete review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="shrink-0">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Verified Stay
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {replyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4 animate-scale-up">
            <button
              onClick={() => setReplyModal(null)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reply to Review</h3>
              <p className="text-xs text-slate-400 mt-1">Respond to {replyModal.customer?.name || 'Guest'}'s feedback</p>
            </div>

            {/* Review Preview */}
            <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <div className="flex gap-0.5 mb-1">{renderStars(replyModal.rating, 'w-3 h-3')}</div>
              <p className="text-xs text-slate-600 dark:text-slate-300">"{replyModal.reviewText || 'No text review'}"</p>
            </div>

            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your management reply..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none transition-all"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setReplyModal(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={submitting || !replyText.trim()}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
