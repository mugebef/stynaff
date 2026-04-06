import React from 'react';
import { MessageSquare, Search, User, Send } from 'lucide-react';

export const Chat: React.FC = () => {
  return (
    <div className="mx-auto flex h-[calc(100vh-120px)] max-w-6xl overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl ring-1 ring-neutral-200">
      {/* Sidebar */}
      <div className="hidden w-80 flex-col border-r border-neutral-200 md:flex">
        <div className="p-4">
          <h2 className="text-xl font-bold text-neutral-900">Chats</h2>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm focus:border-orange-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-600"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex cursor-pointer items-center gap-3 rounded-xl p-3 hover:bg-neutral-50 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                <User size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-neutral-900">User {i}</h4>
                  <span className="text-[10px] text-neutral-400">12:45 PM</span>
                </div>
                <p className="line-clamp-1 text-xs text-neutral-500">Hey, how are you doing today?</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
              <User size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900">Select a chat</h4>
              <p className="text-xs text-green-600">Online</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-1 items-center justify-center bg-neutral-50 p-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
              <MessageSquare size={40} className="text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900">Your Messages</h3>
            <p className="mt-2 text-neutral-500">Send private photos and messages to a friend or group.</p>
            <button className="mt-6 rounded-full bg-orange-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95">
              Send Message
            </button>
          </div>
        </div>

        <div className="border-t border-neutral-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-6 py-3 text-sm focus:border-orange-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-600"
            />
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95">
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
