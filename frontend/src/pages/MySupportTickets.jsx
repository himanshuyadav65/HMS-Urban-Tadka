import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Search, Filter, MessageSquare, AlertCircle, Eye, Calendar, Sparkles, ChevronRight } from 'lucide-react';
import api from '../services/api';

const MySupportTickets = () => {
  const { showToast } = useOutletContext();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

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

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;

      const response = await api.get('/support/my-tickets', { params });
      if (response.data.success) {
        setTickets(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch support tickets:', error);
      showToast('Failed to load support tickets list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [search, filterStatus, filterCategory]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/50';
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50';
      case 'Closed':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-350 border border-slate-200/20';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
      case 'High':
        return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
      case 'Medium':
        return 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20';
      case 'Low':
        return 'bg-slate-500/10 text-slate-400 border border-slate-550/20';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-[1450px] mx-auto pb-12">
      {/* ── Premium Hero Banner ── */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 sm:p-8 border border-indigo-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-purple-500/8 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/6 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-purple-200 to-white bg-clip-text text-transparent font-serif">
                  My Support Tickets
                </h1>
                <p className="text-[10px] text-indigo-400/70 font-bold uppercase tracking-widest mt-0.5">
                  Guest Desk · Active Tickets · Support Tracking
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400/90 max-w-xl leading-relaxed mt-1">
              Track and manage your customer support inquiries and ticket responses.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/contact-support')}
              className="px-5 py-3 bg-gradient-to-r from-indigo-500 via-purple-600 to-blue-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer border border-indigo-400/30 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>New Support Ticket</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by Ticket ID or Subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/20 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-200 placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Filter Status */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950/20 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-200 focus:outline-none text-xs"
            >
              <option value="" className="text-slate-900 bg-white">All Statuses</option>
              <option value="Open" className="text-slate-900 bg-white">Open</option>
              <option value="In Progress" className="text-slate-900 bg-white">In Progress</option>
              <option value="Resolved" className="text-slate-900 bg-white">Resolved</option>
              <option value="Closed" className="text-slate-900 bg-white">Closed</option>
            </select>
          </div>

          {/* Filter Category */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950/20 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-200 focus:outline-none text-xs"
          >
            <option value="" className="text-slate-900 bg-white">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat} className="text-slate-900 bg-white">{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-650 rounded-full animate-spin"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-4">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 text-slate-400 rounded-full border border-slate-200 dark:border-slate-800">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">No Tickets Found</h3>
            <p className="text-xs text-slate-500 mt-1">You haven't submitted any support requests matching these criteria.</p>
          </div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-900/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800/40">
                <tr>
                  <th className="p-4">Ticket ID</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Booking ID</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Updated</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    className={`hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-colors ${
                      ticket.isReadByCustomer === false
                        ? 'bg-indigo-50/30 dark:bg-indigo-950/10 border-l-2 border-indigo-500'
                        : ''
                    }`}
                  >
                    <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-350">
                      <div className="flex items-center gap-2">
                        {ticket.isReadByCustomer === false && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 animate-pulse" title="New reply from support team" />
                        )}
                        {ticket.ticketId}
                      </div>
                    </td>
                    <td className="p-4 max-w-xs truncate">
                      <div className={`font-semibold ${ticket.isReadByCustomer === false ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-850 dark:text-slate-200'}`}>
                        {ticket.subject}
                        {ticket.isReadByCustomer === false && (
                          <span className="ml-2 text-[9px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded-full align-middle">NEW REPLY</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{ticket.description}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium text-slate-650 dark:text-slate-350">{ticket.category}</span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500">
                      {ticket.booking?.bookingId || '-'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${getStatusBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-450">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => navigate(`/my-tickets/${ticket._id}`)}
                        className="inline-flex items-center gap-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySupportTickets;
