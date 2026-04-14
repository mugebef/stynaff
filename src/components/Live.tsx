import React from 'react';
import { Radio, Users, MessageCircle, Heart, Share2, MoreHorizontal, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export const Live: React.FC = () => {
  const liveStreams = [
    { id: 1, title: 'Morning Vibes with DJ STYN', viewers: '1.2k', category: 'Music', thumbnail: 'https://picsum.photos/seed/music/800/600' },
    { id: 2, title: 'Tech Talk: Africa Future', viewers: '850', category: 'Tech', thumbnail: 'https://picsum.photos/seed/tech/800/600' },
    { id: 3, title: 'Cooking Traditional Dishes', viewers: '2.4k', category: 'Lifestyle', thumbnail: 'https://picsum.photos/seed/food/800/600' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-neutral-900">Live Streams</h1>
          <p className="text-neutral-500">Watch and interact with live content from across the continent.</p>
        </div>
        <button className="flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 active:scale-95">
          <Radio size={18} />
          Go Live
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {liveStreams.map((stream) => (
          <motion.div 
            key={stream.id}
            whileHover={{ y: -5 }}
            className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl transition-all hover:shadow-2xl"
          >
            <div className="relative aspect-video overflow-hidden">
              <img src={stream.thumbnail} alt={stream.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"></span>
                Live
              </div>
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                <Users size={12} />
                {stream.viewers} Viewers
              </div>
            </div>
            <div className="p-6">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600 uppercase tracking-widest">
                  {stream.category}
                </span>
              </div>
              <h3 className="mb-4 line-clamp-1 text-lg font-bold text-neutral-900">{stream.title}</h3>
              <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-neutral-100 ring-2 ring-white"></div>
                  <span className="text-xs font-bold text-neutral-600">Streamer Name</span>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-full p-2 text-neutral-400 hover:bg-neutral-50 hover:text-red-500 transition-all">
                    <Heart size={18} />
                  </button>
                  <button className="rounded-full p-2 text-neutral-400 hover:bg-neutral-50 hover:text-blue-500 transition-all">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
