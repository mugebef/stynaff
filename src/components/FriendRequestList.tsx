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
        <h2 className="text-3xl font-bold text-neutral-900">Friend Requests</h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder="Search requests..."
            className="rounded-full border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-600"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {requests.length === 0 ? (
          <div className="col-span-2 py-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
              <UserPlus size={40} />
            </div>
            <p className="text-neutral-500">No pending friend requests.</p>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.uid} className="flex items-center justify-between gap-4 rounded-3xl border border-neutral-200 bg-white p-4 shadow-xl ring-1 ring-neutral-200 transition-all hover:shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 shadow-lg">
                  {req.photoURL ? (
                    <img src={req.photoURL} alt={req.displayName} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">{req.displayName}</h4>
                  <p className="text-xs text-neutral-500">2 mutual friends</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onAccept(req.uid)}
                  className="rounded-full bg-orange-600 p-2 text-white shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95"
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={() => onDecline(req.uid)}
                  className="rounded-full bg-neutral-100 p-2 text-neutral-500 hover:bg-neutral-200 transition-all active:scale-95"
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
