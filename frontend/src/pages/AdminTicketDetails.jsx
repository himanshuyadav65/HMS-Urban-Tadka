import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { 
  ArrowLeft, MessageSquare, Send, Paperclip, Loader2, Download, 
  ShieldCheck, ShieldAlert, User, Clock, AlertCircle, FileText, 
  Save, Trash2, CheckCircle2, ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { getAssetUrl } from '../utils/url';
import { useAuth } from '../context/AuthContext';

const AdminTicketDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useOutletContext();
  const { user: currentUser } = useAuth();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Management States
  const [ticketStatus, setTicketStatus] = useState('');
  const [ticketPriority, setTicketPriority] = useState('');
  const [assignedAdminId, setAssignedAdminId] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [savingInternal, setSavingInternal] = useState(false);

  // Conversation States
  const [replyText, setReplyText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sendingReply, setSendingReply] = useState(false);

  // Staff members list
  const [staffList, setStaffList] = useState([]);
  const chatEndRef = useRef(null);

  const fetchTicketDetails = async () => {
    try {
      const response = await api.get(`/support/admin/${ticketId}`);
      if (response.data.success) {
        const ticketData = response.data.data;
        setTicket(ticketData);
        
        // Initialize management states
        setTicketStatus(ticketData.status);
        setTicketPriority(ticketData.priority);
        setAssignedAdminId(ticketData.assignedAdmin?._id || '');
        setInternalNotes(ticketData.internalNotes || '');
      }
    } catch (error) {
      console.error('Failed to load ticket details:', error);
      showToast('Error loading support ticket details', 'error');
      navigate('/admin/support');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    if (currentUser?.role !== 'Admin') return;
    try {
      const response = await api.get('/users');
      if (response.data.success) {
        // Filter to admin and receptionists
        const staff = response.data.data.filter(u => ['Admin', 'Receptionist'].includes(u.role));
        setStaffList(staff);
      }
    } catch (error) {
      console.error('Failed to fetch staff members:', error);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
    fetchStaff();
  }, [ticketId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

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

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() && !selectedFile) return;
    setSendingReply(true);
    try {
      const formData = new FormData();
      formData.append('message', replyText);
      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }

      const response = await api.post(`/support/admin/${ticketId}/reply`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setReplyText('');
        setSelectedFile(null);
        const fileInput = document.getElementById('admin-reply-attachment');
        if (fileInput) fileInput.value = '';

        await fetchTicketDetails();
        showToast('Reply sent successfully', 'success');
      }
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || 'Failed to send reply', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  const handleSaveChanges = async () => {
    setSavingInternal(true);
    try {
      // 1. Update Status
      await api.put(`/support/admin/${ticketId}/status`, { status: ticketStatus });
      // 2. Update Priority
      await api.put(`/support/admin/${ticketId}/priority`, { priority: ticketPriority });
      // 3. Update Assignee & Notes
      await api.put(`/support/admin/${ticketId}/internal`, {
        assignedAdminId: assignedAdminId,
        internalNotes: internalNotes
      });

      showToast('Support ticket parameters updated successfully', 'success');
      navigate('/admin/support');
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || 'Failed to update ticket parameters', 'error');
    } finally {
      setSavingInternal(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!window.confirm('Are you sure you want to close this ticket? Customer will no longer be able to reply.')) {
      return;
    }
    try {
      const response = await api.put(`/support/admin/${ticketId}/status`, { status: 'Closed' });
      if (response.data.success) {
        showToast('Support ticket closed successfully', 'success');
        await fetchTicketDetails();
      }
    } catch (error) {
      showToast('Failed to close ticket', 'error');
    }
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm('WARNING: Are you sure you want to permanently delete this support ticket? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await api.delete(`/support/admin/${ticketId}`);
      if (response.data.success) {
        showToast('Support ticket deleted permanently', 'success');
        navigate('/admin/support');
      }
    } catch (error) {
      showToast('Failed to delete ticket. Only Admins can delete tickets.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-250 border-t-indigo-650 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!ticket) return null;

  const isClosed = ticket.status === 'Closed';

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-50 text-blue-750 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/50';
      case 'In Progress':
        return 'bg-amber-50 text-amber-750 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50';
      case 'Closed':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-350 border border-slate-200/20';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top bar header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/support')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-500">{ticket.ticketId}</span>
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                {ticket.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-850 dark:text-slate-100 mt-1">{ticket.subject}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Messages Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 flex flex-col h-[55vh] overflow-y-auto space-y-4 bg-slate-900/5 dark:bg-slate-950/10">
            <div className="space-y-4">
              {/* Customer description card */}
              <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/5 border border-indigo-100/50 dark:border-indigo-950/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-450">
                  <span className="font-bold flex items-center gap-1 text-indigo-500">
                    <User className="w-3.5 h-3.5" />
                    <span>Customer Issue Description</span>
                  </span>
                  <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-750 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {ticket.description}
                </p>
                {ticket.attachment && (
                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/40 flex justify-end">
                    <a
                      href={getAssetUrl(ticket.attachment)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-500 hover:underline font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Attachment</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Chat replies list */}
              <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
                {ticket.messages.slice(1).map((msg, idx) => {
                  const isCustomer = msg.senderType === 'Customer';
                  return (
                    <div
                      key={msg._id || idx}
                      className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl p-4 space-y-1.5 shadow-sm border ${
                          isCustomer
                            ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200/60 dark:border-slate-800/60 rounded-tl-none'
                            : 'bg-indigo-650 text-white border-indigo-700 rounded-tr-none'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-8 text-[9px] opacity-75 font-semibold">
                          <span>{isCustomer ? (ticket.customer?.name || 'Customer') : (msg.senderId?.name || 'Support Agent')}</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        
                        {msg.attachment && (
                          <div className={`pt-1.5 mt-1.5 border-t flex justify-end ${
                            isCustomer ? 'border-slate-100 dark:border-slate-850' : 'border-indigo-500'
                          }`}>
                            <a
                              href={getAssetUrl(msg.attachment)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                                isCustomer ? 'text-indigo-500' : 'text-indigo-200 hover:text-white'
                              }`}
                            >
                              <Download className="w-3 h-3" />
                              <span>Download File</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            </div>
          </div>

          {/* Admin Reply Box */}
          <div>
            {isClosed ? (
              <div className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl flex items-center gap-3 text-sm text-slate-500">
                <AlertCircle className="w-5 h-5 text-slate-400" />
                <span>This ticket is <strong>Closed</strong>. Reopen it to compose new replies or save adjustments.</span>
              </div>
            ) : (
              <form onSubmit={handleSendReply} className="glass-card p-4 space-y-3">
                {/* Selected attachment preview */}
                {selectedFile && (
                  <div className="flex items-center justify-between p-2 bg-slate-950/20 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>{selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-3">
                  <div className="relative">
                    <input
                      id="admin-reply-attachment"
                      type="file"
                      onChange={handleFileChange}
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                    />
                    <label
                      htmlFor="admin-reply-attachment"
                      className="p-3 bg-slate-950/10 dark:bg-slate-950/50 hover:bg-slate-950/30 dark:hover:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer transition-colors flex items-center justify-center text-slate-400 hover:text-slate-200"
                      title="Upload attachment (Max 5MB)"
                    >
                      <Paperclip className="w-5 h-5" />
                    </label>
                  </div>

                  <div className="flex-1">
                    <textarea
                      rows={1}
                      placeholder="Write support response..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950/20 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-250 placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply(e);
                        }
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingReply || (!replyText.trim() && !selectedFile)}
                    className="p-3 bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-900 text-white rounded-xl shadow-lg transition-all active:scale-95 disabled:scale-100 disabled:opacity-50 flex items-center justify-center cursor-pointer shrink-0"
                  >
                    {sendingReply ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Ticket Controls & Metadata */}
        <div className="space-y-6">
          {/* Customer & Booking Details Card */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 pb-2">
              Guest Details
            </h3>
            <div className="text-xs space-y-2">
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Name</span>
                <strong className="text-slate-800 dark:text-slate-200">{ticket.customer?.name}</strong>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Email</span>
                <span className="text-slate-700 dark:text-slate-350">{ticket.customer?.email}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Phone</span>
                <span className="text-slate-700 dark:text-slate-350">{ticket.customer?.phone}</span>
              </div>
            </div>

            {ticket.booking && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Linked Booking</h3>
                <div className="text-xs space-y-1.5">
                  <p><strong>Ref ID:</strong> <span className="font-mono text-indigo-500 font-bold">{ticket.booking.bookingId}</span></p>
                  <p><strong>Check-In:</strong> {new Date(ticket.booking.checkIn).toLocaleDateString()}</p>
                  <p><strong>Check-Out:</strong> {new Date(ticket.booking.checkOut).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Ticket Parameter Controls */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 pb-2">
              Support Management
            </h3>

            {/* Status Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="status" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</label>
              <select
                id="status"
                value={ticketStatus}
                onChange={(e) => setTicketStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950/20 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-200 focus:outline-none text-xs"
              >
                <option value="Open" className="text-slate-900 bg-white">Open</option>
                <option value="In Progress" className="text-slate-900 bg-white">In Progress</option>
                <option value="Resolved" className="text-slate-900 bg-white">Resolved</option>
                <option value="Closed" className="text-slate-900 bg-white">Closed</option>
              </select>
            </div>

            {/* Priority Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="priority" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Priority</label>
              <select
                id="priority"
                value={ticketPriority}
                onChange={(e) => setTicketPriority(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950/20 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-200 focus:outline-none text-xs"
              >
                <option value="Low" className="text-slate-900 bg-white">Low</option>
                <option value="Medium" className="text-slate-900 bg-white">Medium</option>
                <option value="High" className="text-slate-900 bg-white">High</option>
                <option value="Urgent" className="text-slate-900 bg-white">Urgent</option>
              </select>
            </div>

            {/* Assign Admin (Only visible to Admin role users) */}
            {currentUser?.role === 'Admin' && (
              <div className="space-y-1.5">
                <label htmlFor="assignee" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assign Staff Agent</label>
                <select
                  id="assignee"
                  value={assignedAdminId}
                  onChange={(e) => setAssignedAdminId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950/20 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-200 focus:outline-none text-xs"
                >
                  <option value="" className="text-slate-900 bg-white">Unassigned</option>
                  {staffList.map(s => (
                    <option key={s._id} value={s._id} className="text-slate-900 bg-white">
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Internal Notes */}
            <div className="space-y-1.5">
              <label htmlFor="notes" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Internal Notes (Staff Only)</label>
              <textarea
                id="notes"
                rows={4}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Log internal observations about this inquiry here..."
                className="w-full px-3 py-2 bg-slate-950/20 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-colors resize-none"
              />
            </div>

            {/* Actions list */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={savingInternal}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:scale-100 cursor-pointer"
              >
                {savingInternal ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Parameters</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCloseTicket}
                  disabled={isClosed}
                  className="flex-1 flex items-center justify-center gap-1 py-2 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Close Ticket</span>
                </button>

                {currentUser?.role === 'Admin' && (
                  <button
                    type="button"
                    onClick={handleDeleteTicket}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 border border-rose-200 hover:bg-rose-50 dark:border-rose-950/30 dark:hover:bg-rose-950/20 text-rose-500 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTicketDetails;
