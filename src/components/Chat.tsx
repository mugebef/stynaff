import React from 'react';
import { Search, Send, User, MoreVertical, Phone, Video, Check, CheckCheck, ArrowLeft, MessageSquare, CheckCircle, Image as ImageIcon, Mic, Paperclip, Smile, Reply, Trash2, Heart, Users, Shield, Sparkles } from 'lucide-react';
import { User as UserType, Message as MessageType } from '../types';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, or, and, updateDoc, doc, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

interface ChatProps {
  currentUser: UserType;
  users: UserType[];
  initialSelectedUser?: UserType | null;
}

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
          updateDoc(doc(db, 'messages', m.id), { status: 'seen', read: true });
        }
      });

      // Generate smart replies if the last message is from the other user
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.senderId === selectedUser.uid) {
        generateSmartReplies(lastMsg.content);
      } else {
        setSmartReplies([]);
      }
    });

    return () => unsubscribe();
  }, [selectedUser, currentUser.uid]);

  const generateSmartReplies = async (text: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Given this message: "${text}", suggest 3 short, friendly, and relevant one-tap replies. Return only a JSON array of strings.`,
        config: { responseMimeType: "application/json" }
      });
      const replies = JSON.parse(response.text || "[]");
      setSmartReplies(replies);
    } catch (err) {
      console.error("AI Error:", err);
    }
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, otherUserTyping]);

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
    } catch (err) {
      console.error(err);
    }
  };

  const handleReaction = async (msgId: string, reaction: string) => {
    const msgRef = doc(db, 'messages', msgId);
    await updateDoc(msgRef, {
      [`reactions.${currentUser.uid}`]: reaction
    });
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-140px)] w-full max-w-none overflow-hidden rounded-none md:rounded-[2.5rem] border-none md:border md:border-white/5 bg-[#0b141a] shadow-2xl ring-0 md:ring-1 md:ring-white/5">
      {/* Sidebar - Chat List */}
      <div className={`w-full flex-col bg-[#111b21] md:flex md:w-80 lg:w-96 border-r border-white/5 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {/* Mobile-style Header */}
        <div className="bg-[#202c33] p-5 flex items-center justify-between text-[#aebac1]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-800 border border-white/10">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-500">
                  <User size={20} />
                </div>
              )}
            </div>
            <h2 className="text-xl font-black text-[#e9edef] tracking-tighter uppercase">STYN</h2>
          </div>
          <div className="flex gap-5">
            <button className="hover:text-white transition-colors"><Users size={20} /></button>
            <button className="hover:text-white transition-colors"><Sparkles size={20} className="text-orange-500" /></button>
            <button className="hover:text-white transition-colors"><MoreVertical size={20} /></button>
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
            chatUsers.map((user) => (
              <div
                key={user.uid}
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
                  {user.isOnline && (
                    <div className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#111b21] bg-[#00a884] shadow-lg"></div>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="truncate text-[16px] font-black text-[#e9edef] tracking-tight">
                      {user.displayName}
                    </h4>
                    <span className="text-[11px] font-black text-[#8696a0] uppercase">12:45 PM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="truncate text-[13px] font-medium text-[#8696a0]">
                      {user.typingTo === currentUser.uid ? (
                        <span className="text-[#00a884] font-black italic">typing...</span>
                      ) : (
                        user.bio || 'Available'
                      )}
                    </p>
                  </div>
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
      <div className={`flex flex-1 flex-col bg-[#0b141a] relative ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="relative z-10 flex items-center justify-between bg-[#202c33] p-3 shadow-xl text-[#aebac1] border-b border-white/5">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedUser(null)} className="md:hidden p-2 text-[#e9edef] hover:bg-white/5 rounded-full transition-colors">
                  <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-4 cursor-pointer group">
                  <div className="h-11 w-11 overflow-hidden rounded-full bg-neutral-800 border border-white/10 group-hover:scale-105 transition-transform">
                    {selectedUser.photoURL ? (
                      <img src={selectedUser.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-neutral-500">
                        <User size={24} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-[17px] font-black text-[#e9edef] leading-tight tracking-tight">{selectedUser.displayName}</h4>
                    <p className="text-[11px] font-black text-[#8696a0] uppercase tracking-widest">
                      {selectedUser.isOnline ? (
                        <span className="text-[#00a884]">online</span>
                      ) : (
                        'last seen recently'
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="hover:bg-white/5 p-3 rounded-full text-[#8696a0] hover:text-white transition-all"><Video size={22} /></button>
                <button className="hover:bg-white/5 p-3 rounded-full text-[#8696a0] hover:text-white transition-all"><Phone size={22} /></button>
                <button className="hover:bg-white/5 p-3 rounded-full text-[#8696a0] hover:text-white transition-all"><Search size={22} /></button>
                <button className="hover:bg-white/5 p-3 rounded-full text-[#8696a0] hover:text-white transition-all"><MoreVertical size={22} /></button>
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
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-4' : 'mt-1'}`}
                  >
                    <div className={`relative max-w-[85%] md:max-w-[60%] px-4 py-2 shadow-2xl ${
                      msg.senderId === currentUser.uid
                        ? 'bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-none'
                        : 'bg-[#202c33] text-[#e9edef] rounded-2xl rounded-tl-none'
                    }`}>
                      {/* Bubble Tail */}
                      {isFirstInGroup && (
                        <div className={`absolute top-0 h-4 w-4 ${
                          msg.senderId === currentUser.uid 
                            ? '-right-2 bg-[#005c4b]' 
                            : '-left-2 bg-[#202c33]'
                        }`} 
                        style={{ clipPath: msg.senderId === currentUser.uid ? 'polygon(0 0, 0 100%, 100% 0)' : 'polygon(100% 0, 100% 100%, 0 0)' }}
                        />
                      )}
                      
                      <div className="flex flex-col">
                        <p className="text-[15px] font-medium leading-relaxed pr-14 whitespace-pre-wrap">{msg.content}</p>
                        <div className="self-end mt-1 flex items-center gap-1.5 min-w-[70px] justify-end">
                          <span className="text-[10px] font-black text-[#8696a0] uppercase">
                            {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                          </span>
                          {msg.senderId === currentUser.uid && (
                            msg.status === 'seen' ? <CheckCheck size={14} className="text-[#53bdeb]" /> : <Check size={14} className="text-[#8696a0]" />
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
                    key={i}
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
            <div className="relative z-10 bg-[#202c33] p-3 md:p-4 flex items-center gap-3 border-t border-white/5">
              <div className="flex-1 flex items-center gap-3 bg-[#2a3942] rounded-[2rem] px-5 py-2.5 shadow-inner">
                <button type="button" className="text-[#8696a0] hover:text-white transition-all hover:scale-110"><Smile size={26} /></button>
                <input
                  type="text"
                  value={newMessage}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    setIsTyping(true);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e as any)}
                  placeholder="Type a message"
                  className="flex-1 bg-transparent py-1 text-[16px] text-[#e9edef] focus:outline-none placeholder:text-[#8696a0]/50"
                />
                <button type="button" className="text-[#8696a0] hover:text-white transition-all hover:scale-110"><Paperclip size={24} className="-rotate-45" /></button>
                {!newMessage.trim() && (
                  <button type="button" className="text-[#8696a0] hover:text-white transition-all hover:scale-110"><ImageIcon size={24} /></button>
                )}
              </div>
              
              {newMessage.trim() ? (
                <button 
                  onClick={(e) => handleSendMessage(e)}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-[0_10px_20px_rgba(234,88,12,0.3)] active:scale-90 transition-all shrink-0"
                >
                  <Send size={24} />
                </button>
              ) : (
                <button className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-[0_10px_20px_rgba(234,88,12,0.3)] active:scale-90 transition-all shrink-0">
                  <Mic size={24} />
                </button>
              )}
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
