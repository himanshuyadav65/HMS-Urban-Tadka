import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { 
  ArrowLeft, MessageSquare, Send, Paperclip, Loader2, Download, 
  ShieldCheck, ShieldAlert, User, Clock, AlertCircle, FileText
} from 'lucide-react';
import api from '../services/api';
import { getAssetUrl } from '../utils/url';

const TicketDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useOutletContext();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sendingReply, setSendingReply] = useState(false);
  const chatEndRef = useRef(null);

  const fetchTicketDetails = async () => {
    try {
      const response = await api.get(`/support/${ticketId}`);
      if (response.data.success) {
        setTicket(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load support ticket details:', error);
      showToast('Error loading support ticket details', 'error');
      navigate('/my-tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  // Scroll to bottom of chat when new message is loaded
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
    if (!replyText.trim() && !selectedFile) {
      return;
    }
    setSendingReply(true);
    try {
      const formData = new FormData();
      formData.append('message', replyText);
      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }

      const response = await api.post(`/support/${ticketId}/reply`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setReplyText('');
        setSelectedFile(null);
        // Reset file input element
        const fileInput = document.getElementById('reply-attachment');
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

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-650 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!ticket) return null;

  const isClosed = ticket.status === 'Closed';

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-50 text-blue-750 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/50';
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 flex flex-col h-[calc(100vh-8.5rem)]">
      {/* Top Header Card */}
      <div className="glass-card p-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/my-tickets')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-500">{ticket.ticketId}</span>
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusBadge(ticket.status)}`}>
                {ticket.status}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-850 dark:text-slate-100 mt-0.5 line-clamp-1">{ticket.subject}</h2>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs">
          <div className="text-right">
            <span className="block text-[10px] text-slate-400 uppercase font-bold">Category</span>
            <strong className="text-slate-700 dark:text-slate-300">{ticket.category}</strong>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
          <div className="text-right">
            <span className="block text-[10px] text-slate-400 uppercase font-bold">Priority</span>
            <strong className="text-indigo-500">{ticket.priority}</strong>
          </div>
        </div>
      </div>

      {/* Main Conversation Chat Box Area */}
      <div className="flex-1 glass-card p-6 overflow-y-auto space-y-4 flex flex-col min-h-0 bg-slate-900/5 dark:bg-slate-950/10">
        <div className="space-y-4 flex-1">
          {/* Initial Ticket Description Card */}
          <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/5 border border-indigo-100/50 dark:border-indigo-950/20 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-450">
              <span className="font-bold flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>Ticket Raised Description</span>
              </span>
              <span>{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
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

          {/* Conversation list */}
          <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
            {/* Skip first message since it is description itself */}
            {ticket.messages.slice(1).map((msg, index) => {
              const isAdmin = msg.senderType === 'Admin';
              return (
                <div
                  key={msg._id || index}
                  className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl p-4 space-y-1.5 shadow-sm border ${
                      isAdmin
                        ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200/60 dark:border-slate-800/60 rounded-tl-none'
                        : 'bg-indigo-600 text-white border-indigo-650 rounded-tr-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-8 text-[9px] opacity-75 font-semibold">
                      <span>{msg.senderId?.name || (isAdmin ? 'Support Team' : 'You')}</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    
                    {msg.attachment && (
                      <div className={`pt-1.5 mt-1.5 border-t flex justify-end ${
                        isAdmin ? 'border-slate-100 dark:border-slate-850' : 'border-indigo-500'
                      }`}>
                        <a
                          href={getAssetUrl(msg.attachment)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                            isAdmin ? 'text-indigo-500' : 'text-indigo-200 hover:text-white'
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

      {/* Reply Section Box at Bottom */}
      <div className="shrink-0">
        {isClosed ? (
          <div className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl flex items-center gap-3 text-sm text-slate-500">
            <AlertCircle className="w-5 h-5 text-slate-400" />
            <span>This ticket has been marked as <strong>Closed</strong>. Replies and update notes are disabled for finalized inquiries.</span>
          </div>
        ) : (
          <form onSubmit={handleSendReply} className="glass-card p-4 space-y-3">
            {/* Attachment preview / select */}
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
              {/* Attachment selector icon */}
              <div className="relative">
                <input
                  id="reply-attachment"
                  type="file"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                />
                <label
                  htmlFor="reply-attachment"
                  className="p-3 bg-slate-950/10 dark:bg-slate-950/50 hover:bg-slate-950/30 dark:hover:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer transition-colors flex items-center justify-center text-slate-400 hover:text-slate-200"
                  title="Upload attachment (Max 5MB)"
                >
                  <Paperclip className="w-5 h-5" />
                </label>
              </div>

              {/* TextInput */}
              <div className="flex-1">
                <textarea
                  rows={1}
                  placeholder="Type your reply message..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/20 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-250 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply(e);
                    }
                  }}
                />
              </div>

              {/* Send Button */}
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
  );
};

export default TicketDetails;
