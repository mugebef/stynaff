import React from 'react';
import { MessageSquare, Search, User, Send, Phone, Video, MoreVertical, Check, CheckCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const Chat: React.FC = () => {
  const [activeChat, setActiveChat] = React.useState<number | null>(null);
  const [message, setMessage] = React.useState('');

  const chats = [
    { id: 1, name: 'John Doe', lastMsg: 'Hey, how are you?', time: '12:45 PM', unread: 2, online: true },
    { id: 2, name: 'Jane Smith', lastMsg: 'See you tomorrow!', time: '11:20 AM', unread: 0, online: false },
    { id: 3, name: 'Alex Mugebe', lastMsg: 'The project is ready.', time: 'Yesterday', unread: 0, online: true },
    { id: 4, name: 'Sarah Wilson', lastMsg: 'Thanks for the help!', time: 'Monday', unread: 5, online: false },
  ];

  return (
    <div className="mx-auto flex h-[calc(100vh-140px)] max-w-6xl overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl ring-1 ring-neutral-200">
      {/* Sidebar */}
      <div className="hidden w-96 flex-col border-r border-neutral-200 md:flex">
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
              className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-12 pr-4 text-sm font-bold text-neutral-900 focus:border-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-600/10"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.map((chat) => (
            <div 
              key={chat.id} 
              onClick={() => setActiveChat(chat.id)}
              className={`flex cursor-pointer items-center gap-4 rounded-2xl p-4 transition-all ${
                activeChat === chat.id ? 'bg-orange-50' : 'hover:bg-neutral-50'
              }`}
            >
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500 ring-2 ring-white shadow-sm">
                  <User size={28} />
                </div>
                {chat.online && (
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500"></div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`text-sm font-bold truncate ${activeChat === chat.id ? 'text-orange-600' : 'text-neutral-900'}`}>
                    {chat.name}
                  </h4>
                  <span className="text-[10px] font-bold text-neutral-400">{chat.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="line-clamp-1 text-xs text-neutral-500 font-medium">{chat.lastMsg}</p>
                  {chat.unread > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col bg-[#f0f2f5]">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500 shadow-sm">
                  <User size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">{chats.find(c => c.id === activeChat)?.name}</h4>
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
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex justify-start">
                <div className="max-w-[70%] rounded-2xl rounded-tl-none bg-white p-4 shadow-sm ring-1 ring-neutral-200">
                  <p className="text-sm text-neutral-800">Hey! Did you see the new reels on STYN AFRICA?</p>
                  <div className="mt-1 flex items-center justify-end gap-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">12:45 PM</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[70%] rounded-2xl rounded-tr-none bg-orange-600 p-4 text-white shadow-xl shadow-orange-200">
                  <p className="text-sm">Yes! They are amazing. The scroll is so smooth now! 🚀</p>
                  <div className="mt-1 flex items-center justify-end gap-1">
                    <span className="text-[10px] font-bold text-orange-100 uppercase">12:46 PM</span>
                    <CheckCheck size={12} />
                  </div>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="bg-white p-4 border-t border-neutral-200">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-3 text-sm font-bold text-neutral-900 focus:border-orange-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-600/10"
                />
                <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95">
                  <Send size={20} />
                </button>
              </div>
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
