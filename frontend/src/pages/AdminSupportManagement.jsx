import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, Search, Filter, Eye, AlertCircle, 
  BarChart3, RefreshCw, Layers, Calendar, CalendarDays, Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../services/api';

const AdminSupportManagement = () => {
  const { showToast } = useOutletContext();
  const navigate = useNavigate();

  // Status Filter tab selection
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Open', 'In Progress', 'Resolved', 'Closed'
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Search & Filter options
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const CHART_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#eab308', '#06b6d4', '#10b981'];

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
      setLoadingList(true);
      const params = {};
      if (search) params.search = search;
      if (priorityFilter) params.priority = priorityFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (dateFilter) params.dateRange = dateFilter;
      
      // Map frontend tab to status parameter
      if (activeTab !== 'All') {
        params.status = activeTab;
      }

      const response = await api.get('/support/admin/all', { params });
      if (response.data.success) {
        setTickets(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
      showToast('Error loading support tickets list', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const response = await api.get('/support/admin/analytics');
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [activeTab, search, priorityFilter, categoryFilter, dateFilter]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/50';
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50';
      case 'Closed':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-305 border border-slate-200/20';
      default:
        return 'bg-slate-100 text-slate-750';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
      case 'High':
        return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
      case 'Medium':
        return 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20';
      case 'Low':
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
      default:
        return 'bg-slate-100 text-slate-750';
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
                  Support Ticket Management
                </h1>
                <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-widest mt-0.5">
                  Guest Helpdesk · Ticket Audit · Resolution Cockpit
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400/90 max-w-xl leading-relaxed mt-1">
              Reply and resolve hospitality support issues raised by guests for Urban Tadka.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => { fetchTickets(); fetchAnalytics(); }}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer border border-emerald-400/30 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-emerald-200" />
              <span>Refresh Tickets</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      {loadingAnalytics ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-6 h-24 animate-pulse"></div>
          ))}
        </div>
      ) : analytics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-card p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tickets</span>
            <h3 className="text-xl font-black text-slate-850 dark:text-slate-50 mt-1">{analytics.cards.totalTickets}</h3>
          </div>
          <div className="glass-card p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-blue-500">Open Tickets</span>
            <h3 className="text-xl font-black text-blue-500 mt-1">{analytics.cards.openTickets}</h3>
          </div>
          <div className="glass-card p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-amber-500">Pending Today</span>
            <h3 className="text-xl font-black text-amber-500 mt-1">{analytics.cards.pendingToday}</h3>
          </div>
          <div className="glass-card p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-emerald-500">Resolved Today</span>
            <h3 className="text-xl font-black text-emerald-500 mt-1">{analytics.cards.resolvedToday}</h3>
          </div>
          <div className="glass-card p-4 flex flex-col justify-between col-span-2 md:col-span-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Response Time</span>
            <h3 className="text-xl font-black text-indigo-500 mt-1">{analytics.cards.averageResponseTime}</h3>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      {!loadingAnalytics && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-5 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tickets By Status</h3>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.charts.ticketsByStatus.filter(s => s.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {analytics.charts.ticketsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Tickets`]} />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-5 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tickets By Category</h3>
            <div className="h-48 flex items-center justify-center">
              {analytics.charts.ticketsByCategory.length === 0 ? (
                <span className="text-xs text-slate-500">No category statistics available.</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.charts.ticketsByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {analytics.charts.ticketsByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Tickets`]} />
                    <Legend verticalAlign="bottom" iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 9, overflowY: 'auto', maxHeight: '50px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs list bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer
              ${activeTab === tab
                ? 'border-indigo-650 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {tab} Tickets
          </button>
        ))}
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
            placeholder="Search by ID, Name, Booking or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/20 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-200 placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950/20 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-250 focus:outline-none text-xs"
          >
            <option value="" className="text-slate-900 bg-white">All Priorities</option>
            <option value="Low" className="text-slate-900 bg-white">Low</option>
            <option value="Medium" className="text-slate-900 bg-white">Medium</option>
            <option value="High" className="text-slate-900 bg-white">High</option>
            <option value="Urgent" className="text-slate-900 bg-white">Urgent</option>
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950/20 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-250 focus:outline-none text-xs"
          >
            <option value="" className="text-slate-900 bg-white">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat} className="text-slate-900 bg-white">{cat}</option>
            ))}
          </select>

          {/* Date range filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950/20 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-250 focus:outline-none text-xs"
          >
            <option value="" className="text-slate-900 bg-white">All Dates</option>
            <option value="today" className="text-slate-900 bg-white">Raised Today</option>
            <option value="week" className="text-slate-900 bg-white">Past 7 Days</option>
            <option value="month" className="text-slate-900 bg-white">Past 30 Days</option>
          </select>
        </div>
      </div>

      {/* Ticket List Table */}
      {loadingList ? (
        <div className="flex h-[25vh] items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-650 rounded-full animate-spin"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-4">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 text-slate-400 rounded-full border border-slate-200 dark:border-slate-800">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">No support tickets</h3>
            <p className="text-xs text-slate-500 mt-1">There are no customer inquiries matching your selections.</p>
          </div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-900/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800/40">
                <tr>
                  <th className="p-4">Ticket ID</th>
                  <th className="p-4">Guest Details</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Assigned To</th>
                  <th className="p-4">Last Updated</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/10">
                    <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-350">{ticket.ticketId}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-850 dark:text-slate-200">{ticket.customer?.name}</div>
                      <div className="text-xs text-slate-400">{ticket.customer?.email}</div>
                    </td>
                    <td className="p-4 max-w-xs truncate">
                      <div className="font-medium text-slate-800 dark:text-slate-300 truncate">{ticket.subject}</div>
                    </td>
                    <td className="p-4 text-xs font-medium text-slate-650 dark:text-slate-350">{ticket.category}</td>
                    <td className="p-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-650 dark:text-slate-400">
                      {ticket.assignedAdmin?.name || <span className="italic text-slate-400">Unassigned</span>}
                    </td>
                    <td className="p-4 text-xs text-slate-450">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => navigate(`/admin/support/${ticket._id}`)}
                        className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
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

export default AdminSupportManagement;
