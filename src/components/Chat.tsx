import React from 'react';
import { Search, Send, User, MoreVertical, Phone, Video, Check, CheckCheck, ArrowLeft, MessageSquare, CheckCircle, Image as ImageIcon, Mic, Paperclip, Smile, Reply, Trash2, Heart, Users, Shield } from 'lucide-react';
import { User as UserType, Message as MessageType } from '../types';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, or, and, updateDoc, doc, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="mx-auto flex h-[calc(100vh-140px)] max-w-6xl overflow-hidden rounded-3xl border border-white/5 bg-neutral-950 shadow-2xl ring-1 ring-white/5">
      {/* Sidebar */}
      <div className={`w-full flex-col border-r border-white/5 bg-neutral-900 md:flex md:w-80 lg:w-96 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="bg-neutral-950 p-4 flex items-center justify-between border-b border-white/5">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-800 border border-white/10">
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-neutral-500">
                <User size={20} />
              </div>
            )}
          </div>
          <div className="flex gap-4 text-neutral-400">
            <button className="hover:text-orange-500 transition-colors"><Users size={20} /></button>
            <button className="hover:text-orange-500 transition-colors"><MessageSquare size={20} /></button>
            <button className="hover:text-orange-500 transition-colors"><MoreVertical size={20} /></button>
          </div>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-4 top-2.5 text-neutral-500" size={16} />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/5 bg-neutral-950 py-2 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatUsers.map((user) => (
            <div
              key={user.uid}
              onClick={() => setSelectedUser(user)}
              className={`flex cursor-pointer items-center gap-3 border-b border-white/5 px-4 py-3 transition-all ${
                selectedUser?.uid === user.uid ? 'bg-neutral-800' : 'hover:bg-neutral-800/50'
              }`}
            >
              <div className="relative shrink-0">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-neutral-800 border border-white/10">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-500">
                      <User size={24} />
                    </div>
                  )}
                </div>
                {user.isOnline && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-neutral-900 bg-orange-500"></div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <h4 className="truncate text-sm font-bold text-white">
                    {user.displayName}
                  </h4>
                  <span className="text-[10px] text-neutral-500">12:45 PM</span>
                </div>
                <p className="truncate text-xs text-neutral-400">
                  {user.typingTo === currentUser.uid ? (
                    <span className="text-orange-500 font-bold">typing...</span>
                  ) : (
                    user.bio || 'Available'
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex flex-1 flex-col bg-neutral-950 relative ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {/* Background Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]"></div>

        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="relative z-10 flex items-center justify-between bg-neutral-900 p-3 shadow-sm border-b border-white/5">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedUser(null)} className="md:hidden text-neutral-400">
                  <ArrowLeft size={20} />
                </button>
                <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-800 border border-white/10">
                  {selectedUser.photoURL ? (
                    <img src={selectedUser.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-500">
                      <User size={20} />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedUser.displayName}</h4>
                  <p className="text-[10px] text-neutral-500">
                    {selectedUser.isOnline ? 'online' : 'last seen recently'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-5 text-neutral-400">
                <button className="hover:text-orange-500 transition-colors"><Video size={20} /></button>
                <button className="hover:text-orange-500 transition-colors"><Phone size={20} /></button>
                <button className="hover:text-orange-500 transition-colors"><Search size={20} /></button>
                <button className="hover:text-orange-500 transition-colors"><MoreVertical size={20} /></button>
              </div>
            </div>
            
            {/* Messages Area */}
            <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`relative max-w-[85%] md:max-w-[65%] rounded-2xl px-4 py-2 shadow-lg ${
                    msg.senderId === currentUser.uid
                      ? 'bg-orange-600 text-white rounded-tr-none'
                      : 'bg-neutral-800 text-white rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed pr-12">{msg.content}</p>
                    <div className="absolute bottom-1 right-3 flex items-center gap-1">
                      <span className="text-[9px] text-white/60">
                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                      </span>
                      {msg.senderId === currentUser.uid && (
                        msg.status === 'seen' ? <CheckCheck size={14} className="text-orange-200" /> : <Check size={14} className="text-white/40" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {otherUserTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-neutral-800 px-4 py-2 text-xs text-neutral-400 shadow-sm italic">
                    typing...
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="relative z-10 bg-neutral-900 p-4 border-t border-white/5">
              <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center gap-3">
                <div className="flex gap-3 text-neutral-400">
                  <button type="button" className="hover:text-orange-500 transition-colors"><Smile size={24} /></button>
                  <button type="button" className="hover:text-orange-500 transition-colors"><Paperclip size={24} /></button>
                </div>
                <input
                  type="text"
                  value={newMessage}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    setIsTyping(true);
                  }}
                  placeholder="Type a message"
                  className="flex-1 rounded-xl border border-white/5 bg-neutral-950 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all"
                />
                {newMessage.trim() ? (
                  <button 
                    type="submit"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg shadow-orange-900/20 transition-all active:scale-95"
                  >
                    <Send size={20} />
                  </button>
                ) : (
                  <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg shadow-orange-900/20 transition-all">
                    <Mic size={20} />
                  </button>
                )}
              </form>
            </div>
          </>
        ) : (
          <div className="relative z-10 flex flex-1 items-center justify-center p-8 bg-neutral-950 border-b-4 border-orange-600">
            <div className="text-center max-w-md">
              <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-neutral-900 border border-white/5">
                <MessageSquare size={64} className="text-neutral-700" />
              </div>
              <h3 className="text-3xl font-light text-white mb-4">STYN Chat</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Send and receive messages in real-time.<br/>
                Connect with your friends and share your moments.
              </p>
              <div className="mt-12 flex items-center justify-center gap-2 text-neutral-600">
                <Shield size={14} />
                <span className="text-xs">End-to-end encrypted</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
