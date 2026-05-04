import React from 'react';
import { UserPlus, Check, X, User, Search, Users, UserMinus, Clock } from 'lucide-react';
import { User as UserType } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface FriendsPageProps {
  currentUser: UserType;
  users: UserType[];
  onAcceptFriend: (uid: string) => void;
  onDeclineFriend: (uid: string) => void;
  onCancelFriendRequest: (uid: string) => void;
  onSendFriendRequest: (uid: string) => void;
  onUnfriend: (uid: string) => void;
  onViewProfile: (uid: string) => void;
}

export const FriendsPage: React.FC<FriendsPageProps> = ({
  currentUser,
  users,
  onAcceptFriend,
  onDeclineFriend,
  onCancelFriendRequest,
  onSendFriendRequest,
  onUnfriend,
  onViewProfile
}) => {
  const [activeTab, setActiveTab] = React.useState<'friends' | 'requests' | 'suggestions'>('friends');
  const [searchQuery, setSearchQuery] = React.useState('');

  const friends = users.filter(u => currentUser.friends?.includes(u.uid));
  const incomingRequests = users.filter(u => currentUser.friendRequests?.includes(u.uid));
  const outgoingRequests = users.filter(u => currentUser.sentRequests?.includes(u.uid));
  
  // Suggestions: Users who are not friends, not requested, and not self
  // Sorted by mutual friends count
  const suggestions = users
    .filter(u => 
      u.uid !== currentUser.uid && 
      !currentUser.friends?.includes(u.uid) && 
      !currentUser.friendRequests?.includes(u.uid) && 
      !currentUser.sentRequests?.includes(u.uid)
    )
    .map(u => ({
      ...u,
      mutualCount: (u.friends || []).filter(f => (currentUser.friends || []).includes(f)).length
    }))
    .sort((a, b) => b.mutualCount - a.mutualCount)
    .slice(0, 20);

  const filteredFriends = friends.filter(f => 
    f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMutualFriends = (otherUser: UserType) => {
    return (otherUser.friends || []).filter(f => (currentUser.friends || []).includes(f));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Friends</h1>
          <p className="text-neutral-500">Manage your connections and find new people.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input 
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-white/5 bg-neutral-900 py-3 pl-12 pr-4 text-sm font-bold text-white shadow-sm focus:border-orange-600 focus:outline-none md:w-64 placeholder-neutral-600"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'friends', label: 'All Friends', count: friends.length, icon: <Users size={18} /> },
          { id: 'requests', label: 'Requests', count: incomingRequests.length + outgoingRequests.length, icon: <Clock size={18} /> },
          { id: 'suggestions', label: 'Suggestions', count: suggestions.length, icon: <UserPlus size={18} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 text-sm font-bold transition-all border border-white/5 ${
              activeTab === tab.id 
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' 
                : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${activeTab === tab.id ? 'bg-white text-orange-600' : 'bg-orange-600/20 text-orange-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'friends' && (
          <motion.div 
            key="friends"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            {filteredFriends.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 text-neutral-600 border border-white/5">
                  <Users size={40} />
                </div>
                <h3 className="text-lg font-bold text-white">No friends found</h3>
                <p className="text-neutral-500">Try searching for someone else or find new friends in suggestions.</p>
              </div>
            ) : (
              filteredFriends.map((friend, index) => (
                <div key={`friend-${friend.uid || 'friend'}-${index}`} className="flex items-center justify-between rounded-3xl border border-white/5 bg-neutral-900 p-4 shadow-sm transition-all hover:shadow-md hover:border-orange-600/30">
                  <div 
                    onClick={() => onViewProfile(friend.uid)}
                    className="flex cursor-pointer items-center gap-3 overflow-hidden"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-neutral-800 ring-2 ring-orange-900/20">
                      {friend.photoURL ? (
                        <img src={friend.photoURL} alt={friend.displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-500">
                          <User size={24} />
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="truncate text-sm font-bold text-white">{friend.displayName}</h4>
                      <p className="text-xs text-neutral-500">@{friend.username || 'user'}</p>
                      <p className="mt-1 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                        {getMutualFriends(friend).length} Mutual Friends
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onUnfriend(friend.uid)}
                    className="rounded-xl bg-neutral-800 p-3 text-neutral-500 hover:bg-red-500/10 hover:text-red-500 transition-all border border-white/5"
                    title="Unfriend"
                  >
                    <UserMinus size={20} />
                  </button>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'requests' && (
          <motion.div 
            key="requests"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Incoming */}
            <section>
              <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-neutral-600">Incoming Requests ({incomingRequests.length})</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {incomingRequests.length === 0 ? (
                  <p className="text-sm text-neutral-500">No incoming friend requests.</p>
                ) : (
                  incomingRequests.map((req, index) => (
                    <div key={`incoming-${req.uid || 'req'}-${index}`} className="flex items-center justify-between rounded-3xl border border-white/5 bg-neutral-900 p-4 shadow-sm hover:border-orange-600/30">
                      <div 
                        onClick={() => onViewProfile(req.uid)}
                        className="flex cursor-pointer items-center gap-3 overflow-hidden"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-neutral-800">
                          {req.photoURL ? (
                            <img src={req.photoURL} alt={req.displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-neutral-500">
                              <User size={20} />
                            </div>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="truncate text-sm font-bold text-white">{req.displayName}</h4>
                          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{getMutualFriends(req).length} Mutual</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onAcceptFriend(req.uid)}
                          className="rounded-xl bg-orange-600 p-2.5 text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700 transition-all"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => onDeclineFriend(req.uid)}
                          className="rounded-xl bg-neutral-800 p-2.5 text-neutral-400 hover:bg-neutral-700 transition-all border border-white/5"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Outgoing */}
            <section>
              <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-neutral-600">Sent Requests ({outgoingRequests.length})</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {outgoingRequests.length === 0 ? (
                  <p className="text-sm text-neutral-500">No sent requests.</p>
                ) : (
                  outgoingRequests.map((req, index) => (
                    <div key={`outgoing-${req.uid || 'req'}-${index}`} className="flex items-center justify-between rounded-3xl border border-white/5 bg-neutral-900 p-4 shadow-sm hover:border-orange-600/30">
                      <div 
                        onClick={() => onViewProfile(req.uid)}
                        className="flex cursor-pointer items-center gap-3 overflow-hidden"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-neutral-800">
                          {req.photoURL ? (
                            <img src={req.photoURL} alt={req.displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-neutral-500">
                              <User size={20} />
                            </div>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="truncate text-sm font-bold text-white">{req.displayName}</h4>
                          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Pending Approval</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => onCancelFriendRequest(req.uid)}
                        className="rounded-xl bg-neutral-800 px-4 py-2 text-xs font-bold text-neutral-400 hover:bg-red-500/10 hover:text-red-500 transition-all border border-white/5"
                      >
                        Cancel
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'suggestions' && (
          <motion.div 
            key="suggestions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            {suggestions.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <p className="text-neutral-500">No suggestions available at the moment.</p>
              </div>
            ) : (
              suggestions.map((sUser, index) => (
                <div key={`suggestion-${sUser.uid || 'user'}-${index}`} className="flex items-center justify-between rounded-3xl border border-white/5 bg-neutral-900 p-4 shadow-sm transition-all hover:shadow-md hover:border-orange-600/30">
                  <div 
                    onClick={() => onViewProfile(sUser.uid)}
                    className="flex cursor-pointer items-center gap-3 overflow-hidden"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-neutral-800 ring-2 ring-orange-900/20">
                      {sUser.photoURL ? (
                        <img src={sUser.photoURL} alt={sUser.displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-500">
                          <User size={24} />
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="truncate text-sm font-bold text-white">{sUser.displayName}</h4>
                      <p className="text-xs text-neutral-500">{sUser.location?.city || 'Africa'}</p>
                      <p className="mt-1 text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                        {sUser.mutualCount} Mutual Friends
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onSendFriendRequest(sUser.uid)}
                    className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95"
                  >
                    <UserPlus size={16} />
                    Add
                  </button>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
