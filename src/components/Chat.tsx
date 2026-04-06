import React from 'react';
import { Search, Send, User, MoreVertical, Phone, Video, Check, CheckCheck, ArrowLeft, MessageSquare, CheckCircle } from 'lucide-react';
import { User as UserType, Message as MessageType } from '../types';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, or, and, updateDoc, doc } from 'firebase/firestore';
import { motion } from 'framer-motion';

interface ChatProps {
  currentUser: UserType;
  users: UserType[];
}

export const Chat: React.FC<ChatProps> = ({ currentUser, users }) => {
  const [selectedUser, setSelectedUser] = React.useState<UserType | null>(null);
  const [messages, setMessages] = React.useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Filter out current user and apply search
  const chatUsers = users.filter(u => 
    u.uid !== currentUser.uid && 
    (u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
      
      // Mark received messages as read
      msgs.forEach(m => {
        if (m.receiverId === currentUser.uid && !m.read) {
          updateDoc(doc(db, 'messages', m.id), { read: true });
        }
      });
    });

    return () => unsubscribe();
  }, [selectedUser, currentUser.uid]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const msg = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: currentUser.uid,
        receiverId: selectedUser.uid,
        content: msg,
        createdAt: serverTimestamp(),
        read: false
      });
    } catch (err) {
      console.error(err);
    }
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
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500"></div>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`text-sm font-bold truncate ${selectedUser?.uid === user.uid ? 'text-orange-600' : 'text-neutral-900'}`}>
                    {user.displayName}
                  </h4>
                  {user.isVerified && <CheckCircle size={14} className="fill-blue-500 text-white shrink-0" />}
                </div>
                <p className="line-clamp-1 text-xs text-neutral-500 font-medium">{user.bio || 'Available'}</p>
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
                  <p className="text-xs font-bold text-green-600 uppercase tracking-widest">Online</p>
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
                  <div
                    className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${
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
                        msg.read ? <CheckCheck size={12} /> : <Check size={12} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="bg-white p-4 border-t border-neutral-200">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-3 text-sm font-bold text-neutral-900 focus:border-orange-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-600/10"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
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
