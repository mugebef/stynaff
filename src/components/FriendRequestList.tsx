import React from 'react';
import { User, UserPlus, Check, X, Search } from 'lucide-react';

interface FriendRequestListProps {
  requests: any[];
  onAccept: (uid: string) => void;
  onDecline: (uid: string) => void;
}

export const FriendRequestList: React.FC<FriendRequestListProps> = ({ requests, onAccept, onDecline }) => {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Friend Requests</h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-neutral-500" size={18} />
          <input
            type="text"
            placeholder="Search requests..."
            className="rounded-full border border-white/5 bg-neutral-900 py-2 pl-10 pr-4 text-sm text-white focus:border-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-600 placeholder-neutral-600"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {requests.length === 0 ? (
          <div className="col-span-2 py-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 text-neutral-600 border border-white/5">
              <UserPlus size={40} />
            </div>
            <p className="text-neutral-500">No pending friend requests.</p>
          </div>
        ) : (
          requests.map((req, index) => (
            <div key={`friend-request-item-${req.uid || index}-${index}`} className="flex items-center justify-between gap-4 rounded-3xl border border-white/5 bg-neutral-900 p-4 shadow-xl ring-1 ring-white/5 transition-all hover:shadow-2xl hover:border-orange-600/30">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800 text-neutral-500 shadow-lg border border-white/5">
                  {req.photoURL ? (
                    <img src={req.photoURL} alt={req.displayName} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{req.displayName}</h4>
                  <p className="text-xs text-neutral-500">2 mutual friends</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onAccept(req.uid)}
                  className="rounded-full bg-orange-600 p-2 text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95"
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={() => onDecline(req.uid)}
                  className="rounded-full bg-neutral-800 p-2 text-neutral-400 hover:bg-neutral-700 transition-all active:scale-95 border border-white/5"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
