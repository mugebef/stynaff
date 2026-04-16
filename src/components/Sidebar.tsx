import React from 'react';
import { User, UserPlus, Check, X, Flag, Users, Heart, Video, Wallet, MessageSquare, Globe, LayoutDashboard, Shield, Award, Medal, Trophy, Crown, CheckCircle, ShoppingBag, Calendar, Briefcase, Sparkles, Radio, Play } from 'lucide-react';
import { User as UserType } from '../types';
import { motion } from 'motion/react';

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
        className="group cursor-pointer overflow-hidden rounded-[2rem] border border-white/5 bg-neutral-900/50 p-5 shadow-2xl ring-1 ring-white/5 transition-all hover:bg-neutral-800/80 active:scale-[0.98] backdrop-blur-xl"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 overflow-hidden rounded-2xl bg-neutral-800 ring-2 ring-orange-500/20 transition-all group-hover:ring-orange-500/50">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-500">
                  <User size={28} />
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-neutral-900 bg-green-500 shadow-lg"></div>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-[15px] font-black text-white tracking-tight">{user?.displayName}</h3>
              {user?.isVerified && <CheckCircle size={14} className="fill-blue-500 text-white shrink-0" />}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 border border-orange-500/20">
                <TierIcon tier={user?.tier || 'General'} size={10} />
                <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{user?.tier}</p>
              </div>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{user?.points || 0} Pts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="rounded-[2rem] border border-white/5 bg-neutral-900/50 p-2 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onMenuClick(item.id)}
              className="flex w-full items-center gap-4 rounded-2xl px-5 py-3.5 text-sm font-black uppercase tracking-widest text-neutral-500 transition-all hover:bg-orange-600/10 hover:text-orange-500 group"
            >
              <div className="transition-transform group-hover:scale-110 group-hover:rotate-6">
                {item.icon}
              </div>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* STYN Premium Card */}
      <div className="relative group overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-600 via-orange-500 to-orange-700 p-8 text-white shadow-[0_20px_40px_-10px_rgba(234,88,12,0.3)] transition-all hover:scale-[1.02]">
        <div className="relative z-10">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xl shadow-inner">
            <Sparkles size={24} className="text-yellow-300" />
          </div>
          <h4 className="mb-2 text-xl font-black uppercase tracking-tighter">STYN Premium</h4>
          <p className="mb-6 text-xs font-bold text-orange-100/80 leading-relaxed">Unlock exclusive features, boost your profile, and more!</p>
          <button 
            onClick={() => onMenuClick('upgrade')}
            className="w-full rounded-2xl bg-white py-3.5 text-xs font-black uppercase tracking-widest text-orange-600 shadow-2xl transition-all hover:bg-neutral-50 active:scale-95"
          >
            Upgrade Now
          </button>
        </div>
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-3xl transition-transform group-hover:scale-150 duration-700"></div>
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-black/10 blur-3xl"></div>
      </div>

      {/* Suggested Friends */}
      <div className="rounded-[2rem] border border-white/5 bg-neutral-900/50 p-6 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between">
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500">Suggested</h4>
          <div className="h-px flex-1 bg-white/5 ml-4"></div>
        </div>
        <div className="space-y-5">
          {suggestedFriends.map((sUser) => (
            <div key={sUser.uid} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-neutral-800 ring-2 ring-orange-900/20">
                  {sUser.photoURL ? (
                    <img src={sUser.photoURL} alt={sUser.displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-500">
                      <User size={22} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-black text-white tracking-tight">{sUser.displayName}</span>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{sUser.location?.city || 'Africa'}</span>
                </div>
              </div>
              <button 
                onClick={() => onSendFriendRequest(sUser.uid)}
                className="rounded-xl bg-orange-600/10 p-2 text-orange-500 hover:bg-orange-600 hover:text-white transition-all active:scale-90"
              >
                <UserPlus size={16} />
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
