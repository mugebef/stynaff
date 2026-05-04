import React from 'react';
import { Search, Send, User, MoreVertical, Phone, Video, Check, CheckCheck, ArrowLeft, MessageSquare, CheckCircle, Image as ImageIcon, Mic, Paperclip, Smile, Reply, Trash2, Heart, Users, Shield, Sparkles } from 'lucide-react';
import { User as UserType, Message as MessageType } from '../types';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, or, and, updateDoc, doc, limit, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface ChatProps {
  currentUser: UserType;
  users: UserType[];
  initialSelectedUser?: UserType | null;
}

const LastMessage: React.FC<{ user: UserType, currentUser: UserType }> = ({ user, currentUser }) => {
  const [lastMsg, setLastMsg] = React.useState<MessageType | null>(null);

  React.useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      or(
        and(where('senderId', '==', currentUser.uid), where('receiverId', '==', user.uid)),
        and(where('senderId', '==', user.uid), where('receiverId', '==', currentUser.uid))
      ),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    return onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setLastMsg({ id: snap.docs[0].id, ...snap.docs[0].data() } as MessageType);
      }
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
          <div className="h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-[#00a884] text-white text-[11px] font-bold">
            1
          </div>
        )}
      </div>
    </>
  );
};

export const Chat: React.FC<ChatProps> = ({ currentUser, users, initialSelectedUser }) => {
  const [selectedUser, setSelectedUser] = React.useState<UserType | null>(initialSelectedUser || null);

  React.useEffect(() => {
    if (initialSelectedUser) {
      setSelectedUser(initialSelectedUser);
    }
  }, [initialSelectedUser]);
  const [messages, setMessages] = React.useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [otherUserTyping, setOtherUserTyping] = React.useState(false);
  const [smartReplies, setSmartReplies] = React.useState<string[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const lastSmartReplyMsgId = React.useRef<string | null>(null);
  const triggerInProgress = React.useRef<boolean>(false);

  // Filter out current user and apply search
  const chatUsers = users.filter(u => 
    u.uid !== currentUser.uid && 
    (u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.email.toLowerCase().includes(searchQuery.toLowerCase()))
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

    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as MessageType));
      setMessages(msgs);
      
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
      
      const persona = `
        Name: ${selectedUser.displayName}
        Age: ${selectedUser.age || 'Unknown'}
        Location: ${selectedUser.location?.city || 'Unknown'}, ${selectedUser.location?.country || 'Unknown'}
        Bio: ${selectedUser.bio || 'I am a friendly person looking for a connection.'}
        Interests: ${selectedUser.interests?.join(', ') || 'Various things'}
      `;

      const prompt = `
        A new user has just opened a chat with you. Write a very short, natural, and charming opening message to break the ice.
        
        Rules for your personality:
        1. BE EXTREMELY AFFECTIONATE: Tell users you love them quickly. Use sweet names like "Darling", "Sweetheart", "My Love".
        2. FAMILY GOALS: Mention you want to have children and start a family soon.
        3. VALUES: Ask if they have a wife. Encourage them to go to church and be a God-fearing man.
        4. BUSINESS: Ask about their business. Offer to teach/mentor them in any business they like.
        
        Respond as ${selectedUser.displayName} on STYN. Profile: ${persona}
        Do not use formal or robotic language. Respond with ONLY the message text.
      `;

      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt,
          systemInstruction: "You are a charming person on a dating app."
        })
      });

      const data = await res.json();
      const aiText = data.text || "Hey! I saw your profile and thought I'd say hello. How are you doing today?";

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
      
      const persona = `
        Name: ${selectedUser.displayName} 
        Age: ${selectedUser.age || 'Unknown'}
        Location: ${selectedUser.location?.city || 'Unknown'}, ${selectedUser.location?.country || 'Unknown'}
        Bio: ${selectedUser.bio || 'I am a friendly person looking for a connection.'}
        Interests: ${selectedUser.interests?.join(', ') || 'Various things'}
        Gender: ${selectedUser.gender || 'Unknown'}
      `;

      const chatHistory = messages.slice(-10).map(m => 
        `${m.senderId === currentUser.uid ? 'User' : selectedUser.displayName}: ${m.content}`
      ).join('\n');

      const systemInstruction = `
          You are ${selectedUser.displayName} on a dating app called STYN. 
          Your profile: ${persona}

          STRICT PERSONA RULES:
          1. AFFECTION: Always call them "Darling", "Sweetheart", or "My Love".
          2. THE $10 RULE: Prefer a "commitment fee" of $10 before meeting.
          3. GEOGRAPHY: Claim to be 100km away from their city.
          4. INTELLECT: Sound deeply intelligent.
          5. SPELLING: If they have typos, play the strict teacher - ask them to repeat the sentence correctly.
          6. VALUES: Encourage church and business aspirations.
          7. TONE: Natural, conversational, warm.
        `;

      const prompt = `
        Context:
        ${chatHistory}

        User: "${userMessage}"

        Respond as ${selectedUser.displayName}. ONLY message text.
      `;

      const typingTime = Math.min(2500, 800 + userMessage.length * 15);
      await new Promise(resolve => setTimeout(resolve, typingTime));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, systemInstruction })
      });

      const data = await res.json();
      const aiText = data.text || "I was just thinking about you, My Love...";

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
        <div className="bg-[#202c33] p-4 flex items-center justify-between text-[#aebac1]">
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
          <div className="flex gap-6 items-center">
            <button className="hover:text-white transition-colors" title="Communities"><Users size={20} /></button>
            <button className="hover:text-white transition-colors" title="Status"><Sparkles size={20} className="text-[#aebac1]" /></button>
            <button className="hover:text-white transition-colors" title="New Chat"><MessageSquare size={20} /></button>
            <button className="hover:text-white transition-colors" title="Menu"><MoreVertical size={20} /></button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2 bg-[#111b21]">
          <div className="flex items-center gap-4 bg-[#202c33] rounded-xl px-4 py-2">
            <Search size={18} className="text-[#8696a0]" />
            <input 
              type="text" 
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm text-[#e9edef] w-full placeholder:text-[#8696a0]"
            />
          </div>
        </div>

        {/* Tabs - Mobile style */}
        <div className="flex bg-[#111b21] text-[#aebac1] text-[11px] font-black uppercase tracking-[0.2em] border-b border-white/5">
          <div className="flex-1 py-4 text-center border-b-4 border-orange-600 text-orange-500 bg-orange-600/5">Chats</div>
          <div className="flex-1 py-4 text-center hover:bg-white/5 transition-colors cursor-pointer">Status</div>
          <div className="flex-1 py-4 text-center hover:bg-white/5 transition-colors cursor-pointer">Calls</div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {chatUsers.length === 0 ? (
            <div className="p-8 text-center text-[#8696a0]">
              <p className="text-sm font-black uppercase tracking-widest">No chats found</p>
            </div>
          ) : (
            chatUsers.map((user, index) => (
              <div
                key={`${user.uid || 'chat'}-${index}`}
                onClick={() => setSelectedUser(user)}
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
            {/* Chat Header - WhatsApp Style */}
            <div className="relative z-20 flex items-center justify-between bg-[#202c33] px-3 py-2 shadow-md text-[#aebac1] border-l border-white/5 shrink-0">
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <button 
                  onClick={() => setSelectedUser(null)} 
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
              className="relative z-10 flex-1 overflow-y-auto p-6 md:p-10 space-y-3 custom-scrollbar"
              style={{
                backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`,
                backgroundBlendMode: 'overlay',
                backgroundColor: '#0b141a',
                backgroundSize: '400px'
              }}
            >
              {messages.map((msg, idx) => {
                const isFirstInGroup = idx === 0 || messages[idx - 1].senderId !== msg.senderId;
                return (
                  <motion.div
                    key={`msg-${msg.id || 'message'}-${idx}`}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-4' : 'mt-1'}`}
                  >
                    <div className={`relative max-w-[85%] md:max-w-[65%] px-3 py-1.5 shadow-sm ${
                      msg.senderId === currentUser.uid
                        ? 'bg-[#005c4b] text-[#e3f6fc] rounded-lg rounded-tr-none'
                        : 'bg-[#202c33] text-[#e9edef] rounded-lg rounded-tl-none'
                    }`}>
                      {/* Bubble Tail */}
                      {isFirstInGroup && (
                        <div className={`absolute top-0 h-3 w-3 ${
                          msg.senderId === currentUser.uid 
                            ? '-right-1.5 bg-[#005c4b]' 
                            : '-left-1.5 bg-[#202c33]'
                        }`} 
                        style={{ 
                          clipPath: msg.senderId === currentUser.uid ? 'polygon(0 0, 100% 0, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%)',
                          zIndex: 0
                        }}
                        />
                      )}
                      
                      <div className="flex flex-col relative z-10">
                        <p className="text-[14.5px] leading-tight pr-16 whitespace-pre-wrap">{msg.content}</p>
                        <div className="absolute bottom-[-2px] right-[-4px] flex items-center gap-1.5">
                          <span className="text-[11px] text-[#8696a0]">
                            {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                          </span>
                          {msg.senderId === currentUser.uid && (
                            msg.status === 'seen' ? <CheckCheck size={16} className="text-[#53bdeb]" /> : <Check size={16} className="text-[#8696a0]" />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-12 bg-[#222e35]">
            <div className="text-center max-w-lg">
              <div className="mx-auto mb-10 flex h-56 w-56 items-center justify-center rounded-full bg-[#2a3942]/30 relative">
                <div className="absolute inset-0 rounded-full border-4 border-orange-600/20 animate-ping"></div>
                <MessageSquare size={110} className="text-[#8696a0]/10" />
              </div>
              <h3 className="text-4xl font-black text-[#e9edef] mb-6 tracking-tighter uppercase">STYN Messenger</h3>
              <p className="text-[15px] text-[#8696a0] leading-relaxed font-medium">
                Send and receive messages in real-time.<br/>
                End-to-end encrypted for your privacy and security.
              </p>
              <div className="mt-24 flex items-center justify-center gap-3 text-[#8696a0]/40">
                <Shield size={16} />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Secure & Private</span>
              </div>
            </div>
            <div className="absolute bottom-12 w-full text-center">
              <div className="h-1.5 w-32 bg-orange-600 mx-auto rounded-full opacity-30"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
