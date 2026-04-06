import React from 'react';
import { Plus, User } from 'lucide-react';
import { User as UserType } from '../types';
import { motion } from 'framer-motion';

interface StatusProps {
  user: UserType | null;
}

export const Status: React.FC<StatusProps> = ({ user }) => {
  const statuses = [
    { id: 1, name: 'Your Story', image: user?.photoURL, isUser: true },
    { id: 2, name: 'John Doe', image: 'https://picsum.photos/seed/john/200/300' },
    { id: 3, name: 'Jane Smith', image: 'https://picsum.photos/seed/jane/200/300' },
    { id: 4, name: 'Alex Mugebe', image: 'https://picsum.photos/seed/alex/200/300' },
    { id: 5, name: 'Sarah Wilson', image: 'https://picsum.photos/seed/sarah/200/300' },
  ];

  return (
    <div className="mb-8 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {statuses.map((status) => (
        <motion.div
          key={status.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative h-48 w-32 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg ring-1 ring-neutral-200"
        >
          <img 
            src={status.image || 'https://picsum.photos/seed/default/200/300'} 
            alt={status.name} 
            className="h-full w-full object-cover brightness-75 transition-all hover:brightness-100"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          {status.isUser ? (
            <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white ring-2 ring-white">
              <Plus size={16} />
            </div>
          ) : (
            <div className="absolute left-3 top-3 h-8 w-8 overflow-hidden rounded-full border-2 border-orange-600 bg-white ring-2 ring-white">
              <img src={status.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            </div>
          )}
          
          <span className="absolute bottom-3 left-3 right-3 text-[10px] font-bold text-white truncate">
            {status.name}
          </span>
        </motion.div>
      ))}
    </div>
  );
};
