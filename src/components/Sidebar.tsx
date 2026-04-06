import React from 'react';
import { User, UserPlus, Check, X, Flag, Users, Heart, Video, Wallet, MessageSquare, Globe, LayoutDashboard } from 'lucide-react';
import { User as UserType } from '../types';

interface SidebarProps {
  user: UserType | null;
  friendRequests: any[];
  onAcceptFriend: (uid: string) => void;
  onDeclineFriend: (uid: string) => void;
  onProfileClick: () => void;
  onMenuClick: (menu: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  user, 
  friendRequests, 
  onAcceptFriend, 
  onDeclineFriend, 
  onProfileClick,
  onMenuClick
}) => {
  const menuItems = [
    { id: 'feed', label: 'News Feed', icon: <Globe size={20} className="text-blue-500" /> },
    { id: 'reels', label: 'Reels', icon: <Video size={20} className="text-pink-500" /> },
    { id: 'dating', label: 'Dating', icon: <Heart size={20} className="text-red-500" /> },
    { id: 'pages', label: 'Pages', icon: <Flag size={20} className="text-orange-500" /> },
    { id: 'groups', label: 'Groups', icon: <Users size={20} className="text-blue-600" /> },
    { id: 'chat', label: 'Messenger', icon: <MessageSquare size={20} className="text-indigo-500" /> },
    { id: 'wallet', label: 'Wallet & Points', icon: <Wallet size={20} className="text-green-500" /> },
  ];

  if (user?.role === 'admin') {
    menuItems.splice(1, 0, { id: 'admin', label: 'Admin Dashboard', icon: <LayoutDashboard size={20} className="text-orange-600" /> });
  }

  return (
    <div className="hidden w-80 flex-col gap-6 lg:flex">
      {/* User Profile Card */}
      <div 
        onClick={onProfileClick}
        className="group cursor-pointer overflow-hidden rounded-3xl border border-neutral-200 bg-white p-4 shadow-xl ring-1 ring-neutral-200 transition-all hover:shadow-2xl active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-2xl bg-neutral-100 ring-2 ring-orange-100 transition-all group-hover:ring-orange-200">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-neutral-400">
                <User size={24} />
              </div>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="truncate text-sm font-bold text-neutral-900">{user?.displayName}</h3>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">{user?.tier} Tier</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-2 shadow-xl ring-1 ring-neutral-200">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onMenuClick(item.id)}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-neutral-600 transition-all hover:bg-neutral-50 hover:text-neutral-900"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl ring-1 ring-neutral-200">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-widest text-neutral-900">Friend Requests</h4>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
              {friendRequests.length}
            </span>
          </div>
          <div className="space-y-4">
            {friendRequests.map((req) => (
              <div key={req.uid} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-neutral-100"></div>
                  <span className="truncate text-xs font-bold text-neutral-700">{req.displayName}</span>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => onAcceptFriend(req.uid)}
                    className="rounded-full bg-orange-600 p-1.5 text-white shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all"
                  >
                    <Check size={14} />
                  </button>
                  <button 
                    onClick={() => onDeclineFriend(req.uid)}
                    className="rounded-full bg-neutral-100 p-1.5 text-neutral-500 hover:bg-neutral-200 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Pages */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl ring-1 ring-neutral-200">
        <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-900">Suggested Pages</h4>
        <div className="space-y-4 text-sm font-bold text-neutral-600">
          <div className="flex items-center gap-3 cursor-pointer hover:text-orange-600 transition-colors" onClick={() => onMenuClick('pages')}>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
              <Flag size={16} />
            </div>
            <span>STYN News</span>
          </div>
          <div className="flex items-center gap-3 cursor-pointer hover:text-orange-600 transition-colors" onClick={() => onMenuClick('pages')}>
            <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
              <Flag size={16} />
            </div>
            <span>Africa Tech</span>
          </div>
        </div>
      </div>
    </div>
  );
};
