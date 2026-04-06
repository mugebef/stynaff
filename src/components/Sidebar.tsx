import React from 'react';
import { User, UserPlus, Check, X, Shield, Settings, HelpCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface SidebarProps {
  user: UserType;
  friendRequests: any[];
  onAcceptFriend: (uid: string) => void;
  onDeclineFriend: (uid: string) => void;
  onProfileClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  user, 
  friendRequests, 
  onAcceptFriend, 
  onDeclineFriend,
  onProfileClick
}) => {
  return (
    <div className="hidden w-80 flex-col gap-6 lg:flex">
      {/* Profile Card */}
      <div 
        onClick={onProfileClick}
        className="group cursor-pointer overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl ring-1 ring-neutral-200 transition-all hover:shadow-2xl hover:ring-orange-600/20"
      >
        <div className="h-24 w-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all group-hover:scale-105"></div>
        <div className="relative -mt-12 flex flex-col items-center px-6 pb-6">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-neutral-100 text-neutral-500 shadow-lg transition-transform group-hover:scale-105">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="h-full w-full rounded-full object-cover" />
            ) : (
              <User size={48} />
            )}
          </div>
          <h3 className="text-xl font-bold text-neutral-900 group-hover:text-orange-600 transition-colors">{user.displayName}</h3>
          <p className="mt-1 text-sm text-neutral-500">{user.email}</p>
          
          {user.role === 'admin' && (
            <div className="mt-3 flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600 ring-1 ring-inset ring-orange-600/20">
              <Shield size={14} fill="currentColor" />
              SUPER USER
            </div>
          )}

          <div className="mt-6 grid w-full grid-cols-2 gap-4 border-t border-neutral-100 pt-6">
            <div className="text-center">
              <p className="text-lg font-bold text-neutral-900">{user.friends.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Friends</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-neutral-900">12</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Posts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Friend Requests */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl ring-1 ring-neutral-200">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-widest text-neutral-900">Friend Requests</h4>
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600">
            {friendRequests.length}
          </span>
        </div>
        
        <div className="space-y-4">
          {friendRequests.length === 0 ? (
            <p className="text-center text-xs text-neutral-500 py-4">No pending requests</p>
          ) : (
            friendRequests.map((req) => (
              <div key={req.uid} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                    <User size={20} />
                  </div>
                  <h5 className="text-sm font-bold text-neutral-900">{req.displayName}</h5>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onAcceptFriend(req.uid)}
                    className="rounded-full bg-orange-600 p-1.5 text-white shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => onDeclineFriend(req.uid)}
                    className="rounded-full bg-neutral-100 p-1.5 text-neutral-500 hover:bg-neutral-200 transition-all active:scale-95"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl ring-1 ring-neutral-200">
        <div className="space-y-2">
          <button className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-bold text-neutral-600 hover:bg-neutral-50 hover:text-orange-600 transition-all">
            <Settings size={20} />
            Settings
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-bold text-neutral-600 hover:bg-neutral-50 hover:text-orange-600 transition-all">
            <HelpCircle size={20} />
            Help & Support
          </button>
        </div>
      </div>
    </div>
  );
};
