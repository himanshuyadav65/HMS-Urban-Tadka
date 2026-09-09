import React, { useEffect, useState, useRef } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { Send, User, MessageSquare, RefreshCw, Loader2, Trash2 } from 'lucide-react';
import api from '../services/api';
import { getAssetUrl } from '../utils/url';
import { useAuth } from '../context/AuthContext';

const InternalChat = () => {
  const { showToast } = useOutletContext();
  const { user } = useAuth();
  const location = useLocation();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const activeContactRef = useRef(null);

  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);

  const getAvatarSrc = (cObj) => {
    const img = cObj?.avatar || cObj?.profileImage;
    if (!img) return null;
    return getAssetUrl(img);
  };

  const handleClearChat = async () => {
    if (!activeContact) return;
    const contactId = activeContact.id || activeContact._id;
    if (!window.confirm(`Clear all chat history with ${activeContact.name}?`)) return;
    try {
      await api.delete('/messages/' + contactId);
      setMessages([]);
      showToast?.('Chat history cleared', 'info');
    } catch (err) {
      console.error(err);
      showToast?.('Failed to clear chat', 'error');
    }
  };

  const handleUnsendMessage = async (msgId) => {
    if (!msgId) return;
    try {
      await api.delete(`/messages/single/${msgId}`);
      setMessages(prev => prev.filter(m => String(m._id || m.id) !== String(msgId)));
      showToast?.('Message unsent', 'info');
    } catch (err) {
      console.error(err);
      showToast?.('Failed to unsend message', 'error');
    }
  };

  const fetchContacts = async (isInitial = false) => {
    try {
      if (isInitial) setLoadingContacts(true);
      const activeUserId = String(user?.id || user?._id || '').trim();
      const currentUserName = (user?.name || '').toLowerCase();

      const res = await api.get('/messages/contacts');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const list = res.data.data.filter(c => {
          const cId = String(c.id || c._id || '').trim();
          const cName = (c.name || '').toLowerCase();
          return cId !== activeUserId && cName !== currentUserName;
        });

        setContacts(list);

        // ONLY set activeContact on initial page load if no contact is selected yet!
        if (isInitial && !activeContactRef.current) {
          const navigatedContact = location.state?.selectedContact;
          if (navigatedContact) {
            const contactId = String(navigatedContact._id || navigatedContact.id);
            const found = list.find(c => String(c.id || c._id) === contactId);
            setActiveContact(found || navigatedContact);
          } else if (list.length > 0) {
            setActiveContact(list[0]);
          }
        }
      }
    } catch (err) {
      console.error('Fetch contacts failed:', err);
    } finally {
      if (isInitial) setLoadingContacts(false);
    }
  };

  const handleSelectContact = (contact) => {
    setActiveContact(contact);
    // Clear unread count for selected contact (Instagram seen style)
    const cId = contact.id || contact._id;
    setContacts(prev => prev.map(c => 
      String(c.id || c._id) === String(cId) ? { ...c, unreadCount: 0 } : c
    ));
  };

  const fetchChatHistory = async (contactId) => {
    if (!contactId) return;
    try {
      const res = await api.get(`/messages/${contactId}`);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContacts(true);
    const interval = setInterval(() => {
      fetchContacts(false);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Poll for new messages every 4 seconds
  useEffect(() => {
    if (!activeContact) return;
    
    // Initial load
    setLoadingChat(true);
    fetchChatHistory(activeContact.id).finally(() => setLoadingChat(false));

    const interval = setInterval(() => {
      fetchChatHistory(activeContact.id);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeContact]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeContact) return;

    setSending(true);
    const text = messageText;
    setMessageText('');

    try {
      const res = await api.post('/messages', {
        receiverId: activeContact.id,
        message: text
      });
      if (res.data.success) {
        setMessages(prev => [...prev, res.data.data]);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-[78vh] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-500" />
            <span>Staff Messages</span>
          </h1>
          <p className="text-xs text-slate-500">
            {user?.role === 'Housekeeping'
              ? 'Send and receive messages from the Reception desk.'
              : 'Internal communication desk between SuperAdmin and Receptionists.'}
          </p>
        </div>
        <button
          onClick={fetchContacts}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-slate-500"
          title="Refresh Contacts"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 border border-slate-200/60 dark:border-neutral-900 rounded-2xl overflow-hidden bg-white dark:bg-[#121319] shadow-sm">
        {/* Left pane: Contacts List */}
        <div className="md:col-span-4 border-r border-slate-200/60 dark:border-neutral-900 flex flex-col h-full bg-slate-50/50 dark:bg-neutral-950/20">
          <div className="p-4 border-b border-slate-200/60 dark:border-neutral-900">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Contacts</h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-150/45 dark:divide-slate-900/30">
            {loadingContacts ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading contacts list...</div>
            ) : contacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No staff contacts available.</div>
            ) : (
              contacts.map(c => {
                const cId = c.id || c._id;
                const activeId = activeContact?.id || activeContact?._id;
                const isSelected = activeId && String(activeId) === String(cId);
                const hasUnread = c.unreadCount > 0 && !isSelected;

                return (
                  <button
                    key={cId}
                    onClick={() => handleSelectContact(c)}
                    className={`w-full text-left p-4 flex items-center gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-l-4 border-indigo-500'
                        : 'hover:bg-slate-100/50 dark:hover:bg-neutral-900/40 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {getAvatarSrc(c) ? (
                        <img
                          src={getAvatarSrc(c)}
                          alt={c.name}
                          style={{ width: '40px', height: '40px', maxWidth: '40px', maxHeight: '40px', objectFit: 'cover' }}
                          className="w-10 h-10 rounded-full border border-slate-200 dark:border-neutral-800 shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 font-bold text-sm">
                          {c.name ? c.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                        </div>
                      )}
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-md shadow-rose-500/40 animate-pulse border-2 border-white dark:border-neutral-900">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className={`block text-xs font-bold truncate ${hasUnread ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-neutral-250'}`}>
                          {c.name}
                        </span>
                        {c.lastMessageTime && (
                          <span className={`text-[10px] shrink-0 ml-1 font-semibold ${hasUnread ? 'text-pink-600 dark:text-pink-400 font-extrabold' : 'text-slate-400'}`}>
                            {c.lastMessageTime}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center mt-0.5">
                        <p className={`text-[11px] truncate max-w-[180px] ${hasUnread ? 'font-extrabold text-slate-900 dark:text-slate-100' : 'text-slate-400 font-normal'}`}>
                          {c.lastMessage ? c.lastMessage : c.role}
                        </p>
                        {hasUnread && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-pink-600 dark:text-pink-400 shrink-0">
                            {c.unreadCount} Unread
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right pane: Chat Area */}
        <div className="md:col-span-8 flex flex-col h-full bg-white dark:bg-[#121319]">
          {activeContact ? (
            <>
              {/* Active Chat Header */}
              <div className="p-4 border-b border-slate-200/60 dark:border-neutral-900 flex items-center justify-between bg-slate-50/30 dark:bg-neutral-950/10">
                <div className="flex items-center gap-3">
                  {getAvatarSrc(activeContact) ? (
                    <img
                      src={getAvatarSrc(activeContact)}
                      alt={activeContact.name}
                      style={{ width: '36px', height: '36px', maxWidth: '36px', maxHeight: '36px', objectFit: 'cover' }}
                      className="w-9 h-9 rounded-full border border-slate-200 dark:border-neutral-800 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-slate-850 dark:text-neutral-200">{activeContact.name}</h3>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{activeContact.role}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {loadingChat && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
                  <button
                    onClick={handleClearChat}
                    title="Clear Chat History"
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-2 bg-slate-50/30 dark:bg-neutral-950/5">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-1 py-12">
                    <MessageSquare className="w-8 h-8 opacity-40 text-indigo-500" />
                    <p className="text-xs font-medium">No message thread history. Say Hello!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const getIdStr = (val) => {
                      if (!val) return '';
                      if (typeof val === 'object') return String(val._id || val.id || '').trim().toLowerCase();
                      return String(val).trim().toLowerCase();
                    };

                    const myUserId = getIdStr(user?.id || user?._id);
                    const contactUserId = getIdStr(activeContact?.id || activeContact?._id);

                    const msgSenderId = getIdStr(msg.senderId);
                    const msgReceiverId = getIdStr(msg.receiverId);

                    let isSent = false;
                    if (msgSenderId && myUserId && msgSenderId === myUserId) {
                      // Sent BY me -> OUTGOING (Right side)
                      isSent = true;
                    } else if (msgReceiverId && myUserId && msgReceiverId === myUserId) {
                      // Sent TO me -> INCOMING (Left side)
                      isSent = false;
                    } else if (msgSenderId && contactUserId && msgSenderId === contactUserId) {
                      // Sent BY contact -> INCOMING (Left side)
                      isSent = false;
                    } else if (msgReceiverId && contactUserId && msgReceiverId === contactUserId) {
                      // Sent TO contact -> OUTGOING (Right side)
                      isSent = true;
                    } else {
                      // Default fallback to INCOMING (Left side)
                      isSent = false;
                    }

                    return (
                      <div
                        key={msg.id || msg._id || index}
                        className={`group flex items-center gap-2 my-1 ${isSent ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Left side: Avatar for incoming message */}
                        {!isSent && (
                          getAvatarSrc(activeContact) ? (
                            <img
                              src={getAvatarSrc(activeContact)}
                              alt={activeContact?.name}
                              style={{ width: '32px', height: '32px', maxWidth: '32px', maxHeight: '32px', objectFit: 'cover' }}
                              className="w-8 h-8 rounded-full border border-slate-300/40 dark:border-neutral-700 shadow-xs shrink-0 mb-0.5"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 flex items-center justify-center font-bold text-xs shrink-0 mb-0.5 border border-slate-300/40 dark:border-neutral-700 shadow-xs">
                              {activeContact?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )
                        )}

                        {/* Unsend Button for sent messages (Instagram style hover option) */}
                        {isSent && (
                          <button
                            onClick={() => handleUnsendMessage(msg._id || msg.id)}
                            title="Unsend message"
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 rounded-full transition-all duration-200 cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`max-w-[70%] px-4 py-2.5 shadow-sm text-xs transition-all ${
                            isSent
                              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-[20px] rounded-br-[4px] shadow-purple-500/10'
                              : 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 rounded-[20px] rounded-bl-[4px] border border-slate-200/50 dark:border-neutral-750'
                          }`}
                        >
                          <p className="leading-relaxed font-normal whitespace-pre-wrap">{msg.message}</p>
                          <span className={`block text-[8.5px] mt-1 ${isSent ? 'text-purple-100/90 text-right font-medium' : 'text-slate-400 dark:text-neutral-400 text-left font-medium'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Instagram style */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200/60 dark:border-neutral-900 bg-white dark:bg-[#121319]">
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-purple-500/40 transition-all">
                  <input
                    type="text"
                    required
                    placeholder={`Message ${activeContact.name}...`}
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-xs text-slate-800 dark:text-white placeholder-slate-400 py-1.5 px-1"
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageText.trim()}
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer border border-transparent shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
              <MessageSquare className="w-10 h-10 opacity-30 text-indigo-500 animate-pulse" />
              <p className="text-xs font-semibold">Select a staff contact to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternalChat;
