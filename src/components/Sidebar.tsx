import React from 'react';
import { User, UserPlus, Check, X, Flag, Users, Heart, Video, Wallet, MessageSquare, Globe, LayoutDashboard, Shield, Award, Medal, Trophy, Crown, CheckCircle, ShoppingBag, Calendar, Briefcase, Sparkles, Radio, Play } from 'lucide-react';
import { User as UserType } from '../types';
import { motion } from 'framer-motion';

const TierIcon = ({ tier, size = 16 }: { tier: string, size?: number }) => {
  switch (tier) {
    case 'Bronze': return <Award size={size} className="text-orange-400" />;
    case 'Silver': return <Medal size={size} className="text-neutral-400" />;
    case 'Gold': return <Trophy size={size} className="text-yellow-500" />;
    case 'Platinum': return <Crown size={size} className="text-indigo-400" />;
    default: return <Shield size={size} className="text-neutral-400" />;
  }
};

interface SidebarProps {
  user: UserType | null;
  users: UserType[];
  friendRequests: any[];
  onAcceptFriend: (uid: string) => void;
  onDeclineFriend: (uid: string) => void;
  onSendFriendRequest: (uid: string) => void;
  onProfileClick: () => void;
  onMenuClick: (menu: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  user, 
  users,
  friendRequests, 
  onAcceptFriend, 
  onDeclineFriend, 
  onSendFriendRequest,
  onProfileClick,
  onMenuClick
}) => {
  const suggestedFriends = users
    .filter(u => u.uid !== user?.uid && !user?.friends?.includes(u.uid) && !user?.friendRequests?.includes(u.uid))
    .slice(0, 3);
  const menuItems = [
    { id: 'reels', label: 'Reels', icon: <Video size={20} className="text-pink-500" /> },
    { id: 'blockbuster', label: 'Blockbuster', icon: <Play size={20} className="text-red-600" /> },
    { id: 'dating', label: 'Dating', icon: <Heart size={20} className="text-red-500" /> },
    { id: 'chat', label: 'Messenger', icon: <MessageSquare size={20} className="text-indigo-500" /> },
    { id: 'live', label: 'Live', icon: <Radio size={20} className="text-red-500" /> },
    { id: 'friends', label: 'Friends', icon: <UserPlus size={20} className="text-green-600" /> },
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
        className="group cursor-pointer overflow-hidden rounded-3xl border border-white/5 bg-neutral-900 p-4 shadow-xl ring-1 ring-white/5 transition-all hover:shadow-2xl active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-2xl bg-neutral-800 ring-2 ring-orange-900/20 transition-all group-hover:ring-orange-500/30">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-neutral-500">
                <User size={24} />
              </div>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-1">
              <h3 className="truncate text-sm font-bold text-white">{user?.displayName}</h3>
              {user?.isVerified && <CheckCircle size={14} className="fill-blue-500 text-white shrink-0" />}
            </div>
            <div className="flex items-center gap-1">
              <TierIcon tier={user?.tier || 'General'} size={12} />
              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{user?.tier}</p>
              <span className="text-[10px] font-bold text-neutral-600">•</span>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{user?.points || 0} Points</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="rounded-3xl border border-white/5 bg-neutral-900 p-2 shadow-xl ring-1 ring-white/5">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onMenuClick(item.id)}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-neutral-400 transition-all hover:bg-neutral-800 hover:text-white"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* STYN Premium Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 to-orange-800 p-6 text-white shadow-xl shadow-orange-900/20">
        <div className="relative z-10">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
            <Sparkles size={20} className="text-yellow-300" />
          </div>
          <h4 className="mb-1 text-lg font-bold">STYN Premium</h4>
          <p className="mb-4 text-xs font-medium text-orange-100">Unlock exclusive features, boost your profile, and more!</p>
          <button 
            onClick={() => onMenuClick('upgrade')}
            className="w-full rounded-xl bg-white py-2.5 text-xs font-bold text-orange-600 shadow-lg transition-all hover:bg-orange-50 active:scale-95"
          >
            Upgrade Now
          </button>
        </div>
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-orange-400/20 blur-3xl"></div>
      </div>

      {/* Suggested Friends */}
      <div className="rounded-3xl border border-white/5 bg-neutral-900 p-6 shadow-xl ring-1 ring-white/5">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-widest text-white">Suggested Friends</h4>
        </div>
        <div className="space-y-4">
          {suggestedFriends.map((sUser) => (
            <div key={sUser.uid} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-800 ring-2 ring-orange-900/20">
                  {sUser.photoURL ? (
                    <img src={sUser.photoURL} alt={sUser.displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-500">
                      <User size={20} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-xs font-bold text-white">{sUser.displayName}</span>
                  <span className="text-[10px] text-neutral-500">{sUser.location?.city || 'Africa'}</span>
                </div>
              </div>
              <button 
                onClick={() => onSendFriendRequest(sUser.uid)}
                className="rounded-full bg-orange-600/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-500 hover:bg-orange-600 hover:text-white transition-all active:scale-95"
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="rounded-3xl border border-white/5 bg-neutral-900 p-6 shadow-xl ring-1 ring-white/5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-widest text-white">Friend Requests</h4>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
              {friendRequests.length}
            </span>
          </div>
          <div className="space-y-4">
            {Array.from(new Set(friendRequests.map(r => r.uid))).map((uid) => {
              const req = friendRequests.find(r => r.uid === uid);
              if (!req) return null;
              return (
                <div key={uid} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-neutral-800"></div>
                    <span className="truncate text-xs font-bold text-neutral-300">{req.displayName}</span>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => onAcceptFriend(uid)}
                      className="rounded-full bg-orange-600 p-1.5 text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700 transition-all"
                    >
                      <Check size={14} />
                    </button>
                    <button 
                      onClick={() => onDeclineFriend(uid)}
                      className="rounded-full bg-neutral-800 p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
