/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Paperclip, Minimize2, Check, Star, Loader2, Eye, Download, FileUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, supportChatsCol, createDbNotification } from '../lib/firebase';
import { onSnapshot, doc, setDoc } from 'firebase/firestore';
import { useToast } from './Toast';

export const LiveChatWidget: React.FC = () => {
  const { toast } = useToast();
  
  // Widget Open/Closed state
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Chat Identity states
  const [chatId, setChatId] = useState<string>('');
  const [chatUser, setChatUser] = useState<{ id: string; name: string; isGuest: boolean } | null>(null);
  const [guestNameInput, setGuestNameInput] = useState('');
  
  // Message composition states
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachmentBase64, setAttachmentBase64] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const [lastViewed, setLastViewed] = useState<number>(Date.now());
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Resolve Active Customer or Guest Identity
  useEffect(() => {
    const resolveIdentity = () => {
      // Check for logged in customer session
      const activeSession = localStorage.getItem('jkm_active_customer_session');
      if (activeSession) {
        try {
          const parsed = JSON.parse(activeSession);
          if (parsed && parsed.id) {
            setChatId(parsed.id);
            setChatUser({ id: parsed.id, name: parsed.name, isGuest: false });
            return;
          }
        } catch (e) {
          console.warn('Stale customer session, clearing.');
        }
      }

      // Check for existing guest chat session
      const guestSession = localStorage.getItem('jkm_guest_chat_session');
      if (guestSession) {
        try {
          const parsed = JSON.parse(guestSession);
          if (parsed && parsed.id) {
            setChatId(parsed.id);
            setChatUser({ id: parsed.id, name: parsed.name, isGuest: true });
            
            // Ensure guest is registered in customer accounts so admin can load them
            registerGuestInCustomerList(parsed.id, parsed.name);
            return;
          }
        } catch (e) {
          console.warn('Stale guest session.');
        }
      }

      // Reset if neither
      setChatId('');
      setChatUser(null);
    };

    resolveIdentity();

    // Listen to session changes locally
    const handleStorageChange = () => {
      resolveIdentity();
    };
    window.addEventListener('storage', handleStorageChange);
    // Also periodic poll as fallback
    const interval = setInterval(resolveIdentity, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Helper to register guest in local customers ledger for admin portal visibility
  const registerGuestInCustomerList = (gId: string, gName: string) => {
    try {
      const rawAccounts = localStorage.getItem('jkm_customer_accounts_v2');
      const accounts = rawAccounts ? JSON.parse(rawAccounts) : [];
      const exists = accounts.some((a: any) => a.id === gId);
      if (!exists) {
        const guestAccount = {
          id: gId,
          username: `guest_${gId.substring(6).toLowerCase()}`,
          name: `${gName} (Guest)`,
          email: 'guest@jkmprime.com',
          phone: 'N/A',
          address: 'Online Support Visitor',
          points: 0,
          isVIP: false,
          birthday: ''
        };
        const updated = [...accounts, guestAccount];
        localStorage.setItem('jkm_customer_accounts_v2', JSON.stringify(updated));
        // Trigger storage event so admin modules reload if open in another tab
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.error('Guest registration failure:', err);
    }
  };

  // 2. Load Chat History from Firestore in real-time
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    const unsub = onSnapshot(supportChatsCol, (snapshot) => {
      const feed: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.chatId === chatId) {
          feed.push({ id: docSnap.id, ...data });
        }
      });
      // Sort by timestamp ascending
      feed.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(feed);

      // Manage unread messages count
      if (!isOpen) {
        const unreads = feed.filter(msg => msg.senderId === 'admin' && msg.timestamp > lastViewed).length;
        setUnreadCount(unreads);
      } else {
        setUnreadCount(0);
        const now = Date.now();
        setLastViewed(now);
      }
    }, (err) => {
      console.error('LiveChatWidget Firestore error:', err);
    });

    return () => unsub();
  }, [chatId, isOpen, lastViewed]);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Reset unread count when opening chat
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      const now = Date.now();
      setLastViewed(now);
    }
  }, [isOpen]);

  // Start Guest Session Handler
  const handleStartGuestChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestNameInput.trim()) {
      toast.error('Please enter your name to start.');
      return;
    }

    const gId = `GUEST-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const name = guestNameInput.trim();
    
    const guestObj = { id: gId, name, isGuest: true };
    localStorage.setItem('jkm_guest_chat_session', JSON.stringify(guestObj));
    
    registerGuestInCustomerList(gId, name);
    setChatId(gId);
    setChatUser(guestObj);
    toast.success(`Welcome, ${name}! Start chatting with our representative.`);
  };

  // Base64 Attachment Helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size exceeds the 2MB attachment limit.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachmentBase64(reader.result as string);
      setAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  // Send Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatUser || (!newMessage.trim() && !attachmentBase64)) return;

    setIsSending(true);
    const messageId = `MSG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const currentText = newMessage.trim();

    const msgDoc: any = {
      id: messageId,
      chatId: chatUser.id,
      senderId: chatUser.id,
      senderName: chatUser.name,
      message: currentText,
      timestamp: Date.now(),
    };

    if (attachmentBase64) {
      msgDoc.fileAttachment = {
        name: attachmentName,
        url: attachmentBase64,
        type: attachmentBase64.startsWith('data:image/') ? 'image' : 'file'
      };
    }

    try {
      // Write to Firestore support_chats
      await setDoc(doc(db, 'support_chats', messageId), msgDoc);

      // Clean composing states immediately
      setNewMessage('');
      setAttachmentBase64(null);
      setAttachmentName('');

      // Create Admin Notification
      await createDbNotification({
        recipientId: 'admin',
        title: 'New Support Inquiry',
        message: `${chatUser.name} sent a message: "${currentText || 'Sent a file attachment'}"`,
        type: 'chat',
        linkId: chatUser.id
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Message failed to send. Please check your internet connection.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="w-80 sm:w-96 h-[500px] bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col mb-4"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center text-xs font-black">
                    JKM
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
                </div>
                <div>
                  <h4 className="font-sans font-bold text-xs block leading-none">JKM Live Chat Helpdesk</h4>
                  <span className="text-[9px] text-sky-400 font-medium mt-1 block">Typically replies in a few minutes</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
              {!chatUser ? (
                /* Registration Screen for Unauthenticated Visitors */
                <div className="flex-1 p-6 flex flex-col justify-center items-center text-center space-y-5">
                  <div className="w-14 h-14 bg-sky-550/10 rounded-full flex items-center justify-center text-sky-600">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h5 className="font-sans font-bold text-slate-800 text-sm">Chat with JKM Prints Support</h5>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                      Inquire about turnaround times, print finishes, materials, or order statuses in real-time.
                    </p>
                  </div>
                  
                  <form onSubmit={handleStartGuestChat} className="w-full space-y-3">
                    <input
                      type="text"
                      placeholder="Enter your name to start..."
                      value={guestNameInput}
                      onChange={(e) => setGuestNameInput(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-semibold"
                    />
                    <button
                      type="submit"
                      className="w-full bg-sky-500 hover:bg-sky-600 text-white py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Start Live Chat
                    </button>
                  </form>
                </div>
              ) : (
                /* Chat Feed and Composition Workspace */
                <>
                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-slate-400 p-6">
                        <MessageSquare className="w-10 h-10 text-slate-300" />
                        <h5 className="font-bold text-slate-700 text-xs">Start the Conversation</h5>
                        <p className="text-[10px] max-w-xs leading-normal">
                          Ask for design updates, pricing inquiries, production timelines, or custom specifications right here.
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, i) => {
                        const isAdmin = msg.senderId === 'admin';
                        return (
                          <div key={msg.id || i} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                            <div className="max-w-[85%] space-y-0.5">
                              <div className={`text-[10px] font-extrabold text-slate-500 px-1 ${isAdmin ? 'text-left' : 'text-right'}`}>
                                {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className={`rounded-2xl p-3 text-xs leading-relaxed ${
                                isAdmin 
                                  ? 'bg-slate-200 text-slate-900 border border-slate-300 rounded-tl-none shadow-xs' 
                                  : 'bg-sky-600 text-white rounded-tr-none shadow-xs'
                              }`}>
                                <p className="whitespace-pre-wrap font-medium">{msg.message}</p>
                                
                                {msg.fileAttachment && (
                                  <div className="mt-2 pt-2 border-t border-slate-300/30 text-left">
                                    {msg.fileAttachment.type === 'image' ? (
                                      <a href={msg.fileAttachment.url} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg border border-slate-200">
                                        <img src={msg.fileAttachment.url} alt="Attachment" className="max-h-[140px] w-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                                        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold gap-1">
                                          <Eye className="w-3.5 h-3.5" /> View Full Image
                                        </span>
                                      </a>
                                    ) : (
                                      <a href={msg.fileAttachment.url} download={msg.fileAttachment.name} target="_blank" rel="noreferrer" className={`px-2 py-1.5 rounded-lg flex items-center gap-1.5 text-[9px] font-bold truncate ${
                                        isAdmin ? 'bg-slate-300/50 text-slate-800' : 'bg-white/10 hover:bg-white/20 text-white'
                                      }`}>
                                        <FileUp className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate flex-1">{msg.fileAttachment.name}</span>
                                        <Download className="w-3 h-3 shrink-0" />
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendMessage} className="bg-white border-t border-slate-100 p-3 space-y-2 shrink-0">
                    {attachmentBase64 && (
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-150 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px]">
                          {attachmentBase64.startsWith('data:image/') ? (
                            <img src={attachmentBase64} alt="Attachment" className="w-7 h-7 object-cover rounded-lg border border-slate-200" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-7 h-7 bg-sky-100 rounded-lg flex items-center justify-center text-[7px] font-bold text-sky-700">FILE</div>
                          )}
                          <span className="font-bold text-slate-700 truncate max-w-[150px]">{attachmentName}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => { setAttachmentBase64(null); setAttachmentName(''); }} 
                          className="text-[9px] text-rose-600 font-bold px-2 py-0.5 hover:bg-rose-50 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <div className="relative flex items-center shrink-0">
                        <input
                          type="file"
                          id="widget-chat-file"
                          className="absolute inset-0 opacity-0 cursor-pointer w-8"
                          onChange={handleFileChange}
                        />
                        <button
                          type="button"
                          className="bg-slate-100 hover:bg-slate-200 p-2.5 rounded-xl text-slate-550 transition-all cursor-pointer"
                          title="Attach Image / Doc (Max 2MB)"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-semibold"
                      />

                      <button
                        type="submit"
                        disabled={isSending || (!newMessage.trim() && !attachmentBase64)}
                        className="bg-sky-600 hover:bg-sky-700 text-white p-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-sky-600/10 flex items-center justify-center shrink-0"
                      >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-sky-500 hover:bg-sky-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 relative cursor-pointer group"
        title="Chat with Customer Support"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageSquare className="w-6 h-6 shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread badge notifications */}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black w-5.5 h-5.5 rounded-full flex items-center justify-center animate-bounce border-2 border-white shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};
