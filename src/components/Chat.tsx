import React from 'react';
import { Search, Send, User, MoreVertical, Phone, Video, Check, CheckCheck, ArrowLeft, MessageSquare, CheckCircle, Image as ImageIcon, Mic, Paperclip, Smile, Reply, Trash2, Heart, Users, Shield, Sparkles, Plus } from 'lucide-react';
import { User as UserType, Message as MessageType } from '../types';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, or, and, updateDoc, doc, limit, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface ChatProps {
  currentUser: UserType;
  users: UserType[];
  selectedUser: UserType | null;
  onSelectUser: (user: UserType | null) => void;
}

const LastMessage: React.FC<{ user: UserType, currentUser: UserType }> = ({ user, currentUser }) => {
  const [lastMsg, setLastMsg] = React.useState<MessageType | null>(null);

  React.useEffect(() => {
    if (!user?.uid || !currentUser?.uid) return;
    const q = query(
      collection(db, 'messages'),
      or(
        and(where('senderId', '==', currentUser.uid), where('receiverId', '==', user.uid)),
        and(where('senderId', '==', user.uid), where('receiverId', '==', currentUser.uid))
      ),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setLastMsg({ id: snap.docs[0].id, ...snap.docs[0].data() } as MessageType);
      }
    }, (error) => {
      console.error("LastMessage onSnapshot error:", error);
    });
  }, [user.uid, currentUser.uid]);

  const getTime = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date();
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return d.toLocaleDateString();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-2 overflow-hidden">
          <h4 className="truncate text-[17px] text-[#e9edef] leading-none">
            {user.displayName}
          </h4>
          {user.uid.startsWith('fake_') && <Sparkles size={14} className="text-orange-500 shrink-0" />}
        </div>
        {lastMsg && (
          <span className={`text-[12px] shrink-0 ${lastMsg.receiverId === currentUser.uid && lastMsg.status !== 'seen' ? 'text-[#00a884] font-medium' : 'text-[#8696a0]'}`}>
            {getTime(lastMsg.createdAt)}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-hidden flex-1">
          {lastMsg && lastMsg.senderId === currentUser.uid && (
            <span className="shrink-0">
              {lastMsg.status === 'seen' ? <CheckCheck size={16} className="text-[#53bdeb]" /> : <Check size={16} className="text-[#8696a0]" />}
            </span>
          )}
          <p className="truncate text-[14px] text-[#8696a0] flex-1">
            {user.typingTo === currentUser.uid ? (
              <span className="text-[#00a884]">typing...</span>
            ) : (
              lastMsg ? lastMsg.content : (user.bio || 'Available')
            )}
          </p>
        </div>
        {lastMsg && lastMsg.receiverId === currentUser.uid && lastMsg.status !== 'seen' && (
          <div className="h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-[#25d366] text-[#0b141a] text-[11px] font-bold">
            1
          </div>
        )}
      </div>
    </>
  );
};

const DateSeparator: React.FC<{ date: Date }> = ({ date }) => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  let label = date.toLocaleDateString();
  if (date.toDateString() === now.toDateString()) label = 'TODAY';
  else if (date.toDateString() === yesterday.toDateString()) label = 'YESTERDAY';

  return (
    <div className="my-6 flex justify-center">
      <div className="rounded-lg bg-[#182229] px-3 py-1.5 text-[11.5px] font-medium uppercase tracking-wider text-[#8696a0] shadow-sm">
        {label}
      </div>
    </div>
  );
};

export const Chat: React.FC<ChatProps> = ({ currentUser, users, selectedUser, onSelectUser }) => {
  if (!currentUser) return null;

  const [messages, setMessages] = React.useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [otherUserTyping, setOtherUserTyping] = React.useState(false);
  const [smartReplies, setSmartReplies] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const lastSmartReplyMsgId = React.useRef<string | null>(null);
  const triggerInProgress = React.useRef<boolean>(false);

  // Filter out current user and apply search
  const chatUsers = users.filter(u => 
    u.uid && currentUser?.uid && u.uid !== currentUser.uid && 
    ((u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
     (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle typing indicator
  React.useEffect(() => {
    if (!selectedUser) return;
    
    const userRef = doc(db, 'users', currentUser.uid);
    updateDoc(userRef, { typingTo: isTyping ? selectedUser.uid : null });
  }, [isTyping, selectedUser, currentUser.uid]);

  // Listen for other user typing
  React.useEffect(() => {
    if (!selectedUser) return;
    
    const unsub = onSnapshot(doc(db, 'users', selectedUser.uid), (snap) => {
      const data = snap.data() as UserType;
      setOtherUserTyping(data?.typingTo === currentUser.uid);
    });
    
    return () => unsub();
  }, [selectedUser, currentUser.uid]);

  // Fetch messages
  React.useEffect(() => {
    if (!selectedUser) return;

    const q = query(
      collection(db, 'messages'),
      or(
        and(where('senderId', '==', currentUser.uid), where('receiverId', '==', selectedUser.uid)),
        and(where('senderId', '==', selectedUser.uid), where('receiverId', '==', currentUser.uid))
      ),
      orderBy('createdAt', 'asc')
    );

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as MessageType));
      setMessages(msgs);
      setLoading(false);
      
      // Mark received messages as seen
      msgs.forEach(m => {
        if (m.receiverId === currentUser.uid && m.status !== 'seen') {
          updateDoc(doc(db, 'messages', m.id), { status: 'seen', read: true }).catch(() => {});
        }
      });

      // Icebreaker logic for fake users
      if (msgs.length === 0 && selectedUser?.uid.startsWith('fake_')) {
        setTimeout(() => {
          triggerIcebreaker();
        }, 1500);
      }

      // Generate smart replies if the last message is from the other user
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.senderId === selectedUser.uid) {
        if (lastSmartReplyMsgId.current !== lastMsg.id) {
          lastSmartReplyMsgId.current = lastMsg.id;
          generateSmartReplies(lastMsg.content);
        }
      } else {
        lastSmartReplyMsgId.current = null;
        setSmartReplies([]);
      }
    }, (err) => {
      console.error("Messages onSnapshot error:", err);
      setError("Failed to load messages. This might be due to a missing database index.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedUser, currentUser.uid]);

  const triggerIcebreaker = async () => {
    if (!selectedUser || !selectedUser.uid.startsWith('fake_') || triggerInProgress.current) return;
    
    // Check if we still have 0 messages to avoid double triggers
    const q = query(
      collection(db, 'messages'),
      or(
        and(where('senderId', '==', currentUser.uid), where('receiverId', '==', selectedUser.uid)),
        and(where('senderId', '==', selectedUser.uid), where('receiverId', '==', currentUser.uid))
      ),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) return;

    triggerInProgress.current = true;
    const userRef = doc(db, 'users', selectedUser.uid);
    try {
      await updateDoc(userRef, { typingTo: currentUser.uid });
      
      const aiText = "am not available now try others";

      await new Promise(resolve => setTimeout(resolve, 1500));

      await addDoc(collection(db, 'messages'), {
        senderId: selectedUser.uid,
        receiverId: currentUser.uid,
        content: aiText,
        type: 'text',
        createdAt: serverTimestamp(),
        read: false,
        status: 'sent'
      });
    } catch (err) {
      console.error("Icebreaker Error:", err);
    } finally {
      await updateDoc(userRef, { typingTo: null }).catch(() => {});
    }
  };

  const generateSmartReplies = async (text: string) => {
    try {
      const res = await fetch("/api/ai/generate-replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      const replies = await res.json();
      setSmartReplies(Array.isArray(replies) ? replies : []);
    } catch (err) {
      console.error("AI Error:", err);
    }
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, otherUserTyping]);

  const handleAIResponse = async (userMessage: string) => {
    if (!selectedUser || !selectedUser.uid.startsWith('fake_')) return;

    // Simulate typing
    const userRef = doc(db, 'users', selectedUser.uid);
    try {
      await updateDoc(userRef, { typingTo: currentUser.uid });
      
      const aiText = "am not available now try others";

      const typingTime = 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, typingTime));

      await addDoc(collection(db, 'messages'), {
        senderId: selectedUser.uid,
        receiverId: currentUser.uid,
        content: aiText,
        type: 'text',
        createdAt: serverTimestamp(),
        read: false,
        status: 'sent'
      });

    } catch (err: any) {
      console.error("AI Chat Error:", err);
    } finally {
      await updateDoc(userRef, { typingTo: null }).catch(() => {});
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, content?: string) => {
    if (e) e.preventDefault();
    const msgContent = content || newMessage;
    if (!msgContent.trim() || !selectedUser) return;

    setNewMessage('');
    setIsTyping(false);

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: currentUser.uid,
        receiverId: selectedUser.uid,
        content: msgContent,
        type: 'text',
        createdAt: serverTimestamp(),
        read: false,
        status: 'sent'
      });

      // AI Response for seeded profiles
      if (selectedUser.uid.startsWith('fake_')) {
        handleAIResponse(msgContent);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(msg);
    }
  };

  const handleReaction = async (msgId: string, reaction: string) => {
    const msgRef = doc(db, 'messages', msgId);
    await updateDoc(msgRef, {
      [`reactions.${currentUser.uid}`]: reaction
    });
  };

  return (
    <div className={`mx-auto flex h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] w-full max-w-none overflow-hidden rounded-none md:rounded-[2.5rem] border-none md:border md:border-white/5 bg-[#0b141a] shadow-2xl ring-0 md:ring-1 md:ring-white/5 ${selectedUser ? 'fixed inset-0 z-[110] md:relative md:inset-auto md:z-0' : ''}`}>
      {/* Sidebar - Chat List */}
      <div className={`w-full flex-col bg-[#111b21] md:flex md:w-80 lg:w-96 border-r border-white/5 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {/* Mobile-style Header */}
        <div className="bg-[#202c33] px-4 py-2.5 flex items-center justify-between text-[#aebac1]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-800 border border-white/10 cursor-pointer">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-500">
                  <User size={20} />
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1 items-center">
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors" title="Communities"><Users size={20} /></button>
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors" title="Status"><Sparkles size={20} className="text-[#aebac1]" /></button>
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors" title="Channels"><MessageSquare size={20} /></button>
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors" title="New Chat"><Plus size={20} /></button>
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors" title="Menu"><MoreVertical size={20} /></button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-1.5 bg-[#111b21] border-b border-white/5">
          <div className="flex items-center gap-3 bg-[#202c33] rounded-lg px-3 py-1.5 ring-1 ring-[#e9edef1a] transition-all focus-within:ring-orange-600/50">
            <Search size={16} className="text-[#8696a0]" />
            <input 
              type="text" 
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-[14px] text-[#e9edef] w-full placeholder:text-[#8696a0]"
            />
          </div>
        </div>

        {/* Filters - STYN style */}
        <div className="flex gap-2 px-3 py-2 bg-[#111b21]">
          <button className="rounded-full bg-[#1e2a30] px-3 py-1 text-[13px] font-medium text-[#8696a0] hover:bg-[#202c33] transition-all">All</button>
          <button className="rounded-full bg-[#1e2a30] px-3 py-1 text-[13px] font-medium text-[#8696a0] hover:bg-[#202c33] transition-all">Unread</button>
          <button className="rounded-full bg-[#1e2a30] px-3 py-1 text-[13px] font-medium text-[#8696a0] hover:bg-[#202c33] transition-all">Groups</button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {chatUsers.length === 0 ? (
            <div className="p-8 text-center text-[#8696a0]">
              <p className="text-sm font-black uppercase tracking-widest">No chats found</p>
            </div>
          ) : (
            chatUsers.map((user, index) => (
              <div
                key={`chat-user-${user.uid || index}-${currentUser.uid}-${index}`}
                onClick={() => onSelectUser(user)}
                className={`flex cursor-pointer items-center gap-4 px-4 py-4 transition-all hover:bg-[#202c33] border-b border-white/5 ${
                  selectedUser?.uid === user.uid ? 'bg-[#2a3942]' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <div className="h-14 w-14 overflow-hidden rounded-full bg-neutral-800 border border-white/5">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-neutral-500">
                        <User size={28} />
                      </div>
                    )}
                  </div>
                  {(user.isOnline || user.uid.startsWith('fake_')) && (
                    <div className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#111b21] bg-[#00a884] shadow-lg"></div>
                  )}
                </div>
                  <div className="flex-1 overflow-hidden">
                    <LastMessage user={user} currentUser={currentUser} />
                  </div>
              </div>
            ))
          )}
        </div>

        {/* FAB - Floating Action Button for New Chat */}
        <div className="absolute bottom-8 right-8 md:hidden">
          <button className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-600 text-white shadow-[0_15px_30px_rgba(234,88,12,0.4)] active:scale-95 transition-all ring-4 ring-black/20">
            <MessageSquare size={28} />
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex flex-1 flex-col bg-[#0b141a] relative ${!selectedUser ? 'hidden md:flex' : 'fixed inset-0 z-[110] md:relative md:inset-auto md:z-0 flex'}`}>
        {selectedUser ? (
          <>
            {/* Chat Header - STYN Style */}
            <div className="relative z-20 flex items-center justify-between bg-[#202c33] px-3 py-2 shadow-md text-[#aebac1] border-l border-white/5 shrink-0">
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <button 
                  onClick={() => onSelectUser(null)} 
                  className="md:hidden p-2 text-[#e9edef] hover:bg-neutral-800 rounded-full transition-colors shrink-0"
                >
                  <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-3 cursor-pointer overflow-hidden flex-1">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-800 border border-white/10 hidden sm:block">
                    {selectedUser.photoURL ? (
                      <img src={selectedUser.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-neutral-500">
                        <User size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="truncate text-[15px] font-black text-[#e9edef] leading-tight">
                      {selectedUser.displayName} 
                      {selectedUser.uid.startsWith('fake_') && <CheckCircle size={10} className="inline ml-1 fill-[#53bdeb] text-white" />}
                    </h3>
                    <p className="text-[11px] font-bold text-[#00a884]">
                      {(selectedUser.isOnline || selectedUser.uid.startsWith('fake_')) ? 'online' : 'offline'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0 px-2 lg:gap-6">
                <button className="hover:text-white transition-all hidden sm:block"><Video size={20} /></button>
                <button className="hover:text-white transition-all hidden sm:block"><Phone size={20} /></button>
                <button className="hover:text-white transition-all"><Search size={20} /></button>
                <button className="hover:text-white transition-all"><MoreVertical size={20} /></button>
              </div>
            </div>
            
            {/* Messages Area */}
            <div 
              ref={scrollRef} 
              className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6 space-y-1 custom-scrollbar"
              style={{
                backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`,
                backgroundBlendMode: 'overlay',
                backgroundColor: '#0b141a',
                backgroundSize: '400px'
              }}
            >
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-8 w-8 rounded-full border-2 border-[#00a884] border-t-transparent"
                    />
                    <p className="text-xs font-bold uppercase tracking-widest text-[#8696a0]">Loading messages...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex h-full items-center justify-center p-8 text-center text-[#ea580c]">
                  <div className="max-w-xs">
                    <p className="mb-2 text-sm font-black uppercase tracking-widest">Error</p>
                    <p className="text-xs leading-relaxed opacity-80">{error}</p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="mt-4 rounded-full bg-orange-600 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center opacity-50">
                  <MessageSquare size={48} className="mb-4 text-[#8696a0]" />
                  <p className="text-sm font-bold uppercase tracking-widest text-[#8696a0]">No messages yet</p>
                  <p className="text-xs text-[#8696a0] mt-1">Start a conversation with {selectedUser.displayName}</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isFirstInGroup = idx === 0 || messages[idx - 1].senderId !== msg.senderId;
                  const msgDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date();
                  const prevMsgDate = idx > 0 && messages[idx - 1].createdAt?.toDate ? messages[idx - 1].createdAt.toDate() : null;
                  const showDateSeparator = !prevMsgDate || msgDate.toDateString() !== prevMsgDate.toDateString();

                  return (
                    <React.Fragment key={`chat-msg-wrapper-${msg.id || idx}-${currentUser.uid}-${selectedUser.uid}-${idx}`}>
                      {showDateSeparator && <DateSeparator date={msgDate} />}
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-3' : 'mt-0.5'}`}
                      >
                        <div className={`relative max-w-[85%] md:max-w-[65%] px-2.5 py-1.5 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] ${
                          msg.senderId === currentUser.uid
                            ? 'bg-[#005c4b] text-[#e3f6fc] rounded-lg rounded-tr-none'
                            : 'bg-[#202c33] text-[#e9edef] rounded-lg rounded-tl-none'
                        }`}>
                          {/* Bubble Tail */}
                          {isFirstInGroup && (
                            <div className={`absolute top-0 h-4 w-4 ${
                              msg.senderId === currentUser.uid 
                                ? '-right-2 bg-[#005c4b]' 
                                : '-left-2 bg-[#202c33]'
                            }`} 
                            style={{ 
                              clipPath: msg.senderId === currentUser.uid ? 'polygon(0 0, 0 100%, 100% 0)' : 'polygon(0 0, 100% 0, 100% 100%)',
                              zIndex: 0
                            }}
                            />
                          )}
                          
                          <div className="flex flex-col relative z-10 min-w-[60px]">
                            <p className="text-[14.2px] leading-[1.4] pr-14 whitespace-pre-wrap">{msg.content}</p>
                            <div className="absolute bottom-[-2px] right-[-4px] flex items-center gap-1">
                              <span className="text-[11px] text-[#8696a0cc] font-medium leading-none mb-0.5">
                                {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                              </span>
                              {msg.senderId === currentUser.uid && (
                                msg.status === 'seen' ? <CheckCheck size={15} className="text-[#53bdeb] mb-0.5" strokeWidth={2.5} /> : <Check size={15} className="text-[#8696a0cc] mb-0.5" strokeWidth={2.5} />
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </React.Fragment>
                  );
                })
              )}
              {otherUserTyping && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-start mt-4"
                >
                  <div className="rounded-2xl bg-[#202c33] px-5 py-2 text-[13px] text-[#8696a0] shadow-xl italic font-black">
                    typing...
                  </div>
                </motion.div>
              )}
            </div>

            {/* Smart Replies */}
            {smartReplies.length > 0 && (
              <div className="relative z-20 bg-[#0b141a]/80 backdrop-blur-md px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-t border-white/5">
                {smartReplies.map((reply, i) => (
                  <button
                    key={`reply-${i}-${reply}`}
                    onClick={() => {
                      setNewMessage(reply);
                      handleSendMessage(new Event('submit') as any);
                    }}
                    className="whitespace-nowrap rounded-full bg-[#202c33] px-5 py-2 text-xs font-black text-orange-500 border border-orange-500/20 hover:bg-orange-500/10 transition-all active:scale-95"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="relative z-10 bg-[#202c33] p-2 md:p-3 flex items-center gap-2 border-t border-white/5 pb-[env(safe-area-inset-bottom,8px)]">
              <div className="flex-1 flex items-center gap-2 bg-[#2a3942] rounded-[1.5rem] px-2 md:px-3 py-1.5 shadow-inner">
                <button type="button" className="text-[#8696a0] hover:text-white transition-all shrink-0 hidden sm:block"><Smile size={24} /></button>
                <input
                  type="text"
                  value={newMessage}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    setIsTyping(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e as any);
                    }
                  }}
                  placeholder="Type a message"
                  className="flex-1 bg-transparent py-1 md:py-1.5 text-sm md:text-[15px] text-[#e9edef] focus:outline-none placeholder:text-[#8696a0]/50"
                  autoComplete="off"
                />
                <button type="button" className="text-[#8696a0] hover:text-white transition-all shrink-0"><Paperclip size={20} md:size={22} className="-rotate-45" /></button>
                {!newMessage.trim() && (
                  <button type="button" className="text-[#8696a0] hover:text-white transition-all shrink-0"><ImageIcon size={20} md:size={22} /></button>
                )}
              </div>
              
              <button 
                onClick={(e) => {
                  if (newMessage.trim()) {
                    handleSendMessage(e);
                  } else {
                    // Logic for Mic could go here
                  }
                }}
                className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full transition-all shrink-0 active:scale-95 shadow-lg ${
                  newMessage.trim() 
                    ? 'bg-[#00a884] text-white' 
                    : 'bg-[#00a884] text-white'
                }`}
              >
                {newMessage.trim() ? <Send size={18} md:size={20} /> : <Mic size={18} md:size={20} />}
              </button>
            </div>
          </>
        ) : (
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-12 bg-[#222e35] border-b-[6px] border-orange-600">
            <div className="text-center max-w-lg">
              <div className="mx-auto mb-10 flex h-64 w-64 items-center justify-center rounded-full bg-[#2a3942]/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/20 to-transparent animate-pulse"></div>
                <MessageSquare size={120} className="text-[#8696a0]/20 relative z-10" />
                <Sparkles size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500 animate-bounce" />
              </div>
              <h3 className="text-[32px] font-black text-[#e9edef] mb-4 tracking-tighter uppercase">STYN Messenger</h3>
              <p className="text-[14px] text-[#8696a0] leading-relaxed mb-10 font-medium">
                Connect with people across the globe in real-time.<br/>
                Experience the next generation of social interaction on STYN.
              </p>
              <div className="flex items-center justify-center gap-2 text-orange-500 opacity-60">
                <Shield size={14} />
                <span className="text-[12px] font-bold uppercase tracking-widest">Secure & End-to-End Encrypted</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
