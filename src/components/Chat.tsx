import React from 'react';
import { Search, Send, User, MoreVertical, Phone, Video, Check, CheckCheck, ArrowLeft, MessageSquare, CheckCircle, Image as ImageIcon, Mic, Paperclip, Smile, Reply, Trash2, Heart } from 'lucide-react';
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
    <div className="mx-auto flex h-[calc(100vh-140px)] max-w-6xl overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl ring-1 ring-neutral-200">
      {/* Sidebar */}
      <div className={`w-full flex-col border-r border-neutral-200 md:flex md:w-80 lg:w-96 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="bg-neutral-50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-900">Messenger</h2>
            <button className="rounded-full bg-orange-100 p-2 text-orange-600 hover:bg-orange-200 transition-all">
              <MessageSquare size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-12 pr-4 text-sm font-bold text-neutral-900 focus:border-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-600/10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chatUsers.map((user) => (
            <div
              key={user.uid}
              onClick={() => setSelectedUser(user)}
              className={`flex cursor-pointer items-center gap-4 rounded-2xl p-4 transition-all ${
                selectedUser?.uid === user.uid ? 'bg-orange-50' : 'hover:bg-neutral-50'
              }`}
            >
              <div className="relative">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ring-2 ring-white shadow-sm overflow-hidden ${user.photoURL ? 'bg-neutral-100' : (user.gender === 'Female' ? 'bg-pink-50 text-pink-400' : 'bg-blue-50 text-blue-400')}`}>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={28} />
                  )}
                </div>
                {user.isOnline && (
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500"></div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`text-sm font-bold truncate ${selectedUser?.uid === user.uid ? 'text-orange-600' : 'text-neutral-900'}`}>
                    {user.displayName}
                  </h4>
                  {user.isVerified && <CheckCircle size={14} className="fill-blue-500 text-white shrink-0" />}
                </div>
                <p className="line-clamp-1 text-xs text-neutral-500 font-medium">
                  {user.typingTo === currentUser.uid ? (
                    <span className="text-orange-600 font-bold animate-pulse italic">Typing...</span>
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
      <div className={`flex flex-1 flex-col bg-[#f0f2f5] ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedUser(null)} className="md:hidden text-neutral-500">
                  <ArrowLeft size={24} />
                </button>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm overflow-hidden ${selectedUser.photoURL ? 'bg-neutral-100' : (selectedUser.gender === 'Female' ? 'bg-pink-50 text-pink-400' : 'bg-blue-50 text-blue-400')}`}>
                  {selectedUser.photoURL ? (
                    <img src={selectedUser.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h4 className="text-sm font-bold text-neutral-900">{selectedUser.displayName}</h4>
                    {selectedUser.isVerified && <CheckCircle size={14} className="fill-blue-500 text-white" />}
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedUser.isOnline ? 'text-green-600' : 'text-neutral-400'}`}>
                    {selectedUser.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-full p-2.5 text-neutral-500 hover:bg-neutral-100 transition-all">
                  <Phone size={20} />
                </button>
                <button className="rounded-full p-2.5 text-neutral-500 hover:bg-neutral-100 transition-all">
                  <Video size={20} />
                </button>
                <button className="rounded-full p-2.5 text-neutral-500 hover:bg-neutral-100 transition-all">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
            
            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="group relative max-w-[75%]">
                    <div
                      className={`rounded-2xl p-4 shadow-sm ${
                        msg.senderId === currentUser.uid
                          ? 'bg-orange-600 text-white rounded-tr-none shadow-xl shadow-orange-200'
                          : 'bg-white text-neutral-800 rounded-tl-none ring-1 ring-neutral-200'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] font-bold uppercase ${
                        msg.senderId === currentUser.uid ? 'text-orange-100' : 'text-neutral-400'
                      }`}>
                        <span>
                          {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                        </span>
                        {msg.senderId === currentUser.uid && (
                          msg.status === 'seen' ? <CheckCheck size={12} className="text-blue-300" /> : <Check size={12} />
                        )}
                      </div>
                      
                      {/* Reactions Display */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="absolute -bottom-2 right-2 flex gap-1 rounded-full bg-white px-1.5 py-0.5 shadow-sm ring-1 ring-neutral-200">
                          {Object.values(msg.reactions).map((r, i) => (
                            <span key={i} className="text-xs">{r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Hover Actions */}
                    <div className={`absolute top-0 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 ${msg.senderId === currentUser.uid ? 'right-full mr-2' : 'left-full ml-2'}`}>
                      <button onClick={() => handleReaction(msg.id, '❤️')} className="rounded-full bg-white p-1.5 shadow-sm ring-1 ring-neutral-200 hover:bg-neutral-50">
                        <Heart size={14} className="text-red-500" />
                      </button>
                      <button className="rounded-full bg-white p-1.5 shadow-sm ring-1 ring-neutral-200 hover:bg-neutral-50">
                        <Reply size={14} className="text-neutral-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {otherUserTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white p-4 text-neutral-400 ring-1 ring-neutral-200 shadow-sm">
                    <div className="flex gap-1">
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Smart Replies */}
            <AnimatePresence>
              {smartReplies.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex gap-2 p-4 bg-transparent overflow-x-auto no-scrollbar"
                >
                  {smartReplies.map((reply, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(undefined, reply)}
                      className="whitespace-nowrap rounded-full bg-white px-4 py-2 text-xs font-bold text-orange-600 shadow-sm ring-1 ring-neutral-200 hover:bg-orange-50 transition-all"
                    >
                      {reply}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="bg-white p-4 border-t border-neutral-200">
              <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center gap-3">
                <div className="flex gap-1">
                  <button type="button" className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100">
                    <Paperclip size={20} />
                  </button>
                  <button type="button" className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100">
                    <ImageIcon size={20} />
                  </button>
                </div>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newMessage}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      setIsTyping(true);
                    }}
                    placeholder="Type a message..."
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-3 text-sm font-bold text-neutral-900 focus:border-orange-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-600/10"
                  />
                  <button type="button" className="absolute right-4 top-3 text-neutral-400 hover:text-orange-600">
                    <Smile size={20} />
                  </button>
                </div>
                {newMessage.trim() ? (
                  <button 
                    type="submit"
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95"
                  >
                    <Send size={20} />
                  </button>
                ) : (
                  <button type="button" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-all">
                    <Mic size={20} />
                  </button>
                )}
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="text-center">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-2xl ring-1 ring-neutral-200"
              >
                <MessageSquare size={48} className="text-orange-600" />
              </motion.div>
              <h3 className="text-2xl font-bold text-neutral-900">Select a conversation</h3>
              <p className="mt-3 text-sm font-bold text-neutral-500 uppercase tracking-widest">Connect with your friends instantly</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
