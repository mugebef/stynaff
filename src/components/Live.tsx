import React from 'react';
import { Radio, Users, MessageCircle, Heart, Share2, MoreHorizontal, Shield, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Live: React.FC = () => {
  const [selectedStream, setSelectedStream] = React.useState<any>(null);
  const [isGoingLive, setIsGoingLive] = React.useState(false);
  const [streamTitle, setStreamTitle] = React.useState('');
  const [streamCategory, setStreamCategory] = React.useState('General');
  const [myStream, setMyStream] = React.useState<any>(null);
  
  const [comments, setComments] = React.useState<any[]>([
    { id: 1, user: 'Kojo', text: 'This is fire! 🔥', time: '2m ago' },
    { id: 2, user: 'Amara', text: 'Love from Lagos! 🇳🇬', time: '1m ago' },
    { id: 3, user: 'Zaid', text: 'Africa to the world!', time: 'Just now' },
  ]);
  const [newComment, setNewComment] = React.useState('');

  const liveStreams = [
    ...(myStream ? [myStream] : []),
    { id: 1, title: 'Morning Vibes with DJ STYN', viewers: '1.2k', category: 'Music', thumbnail: 'https://picsum.photos/seed/music/800/600' },
    { id: 2, title: 'Tech Talk: Africa Future', viewers: '850', category: 'Tech', thumbnail: 'https://picsum.photos/seed/tech/800/600' },
    { id: 3, title: 'Cooking Traditional Dishes', viewers: '2.4k', category: 'Lifestyle', thumbnail: 'https://picsum.photos/seed/food/800/600' },
  ];

  const handleStartStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamTitle) return;
    const newStream = {
      id: Date.now(),
      title: streamTitle,
      viewers: '0',
      category: streamCategory,
      thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000',
      isMine: true
    };
    setMyStream(newStream);
    setIsGoingLive(false);
    setSelectedStream(newStream);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Go Live Modal */}
      <AnimatePresence>
        {isGoingLive && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsGoingLive(false)} 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-md bg-neutral-900 rounded-[40px] p-8 border border-white/5 shadow-2xl"
            >
              <h2 className="text-3xl font-black text-white italic mb-6">Start Live Stream</h2>
              <form onSubmit={handleStartStream} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Stream Title</label>
                  <input 
                    type="text" 
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    placeholder="Enter a catchy title..."
                    className="w-full rounded-2xl bg-neutral-950 border border-white/5 px-6 py-4 text-white focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Category</label>
                  <select 
                    value={streamCategory}
                    onChange={(e) => setStreamCategory(e.target.value)}
                    className="w-full rounded-2xl bg-neutral-950 border border-white/5 px-6 py-4 text-white focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all font-bold appearance-none"
                  >
                    <option>General</option>
                    <option>Music</option>
                    <option>Tech</option>
                    <option>Lifestyle</option>
                    <option>Gaming</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full rounded-2xl bg-orange-600 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-orange-700 transition-all shadow-xl shadow-orange-900/20"
                >
                  Go Live Now
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedStream ? (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Stream Player */}
          <div className="lg:col-span-2">
            <div className="relative aspect-video overflow-hidden rounded-3xl bg-black shadow-2xl border border-white/5">
              <img src={selectedStream.thumbnail} className="h-full w-full object-cover opacity-50" alt="" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-600/20 text-red-500">
                    <Radio size={40} className="animate-pulse" />
                  </div>
                  <p className="text-xl font-black text-white">Live Stream Playing</p>
                </div>
              </div>
              <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-red-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-lg">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white"></span>
                Live
              </div>
              <div className="absolute bottom-6 left-6 flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-xs font-bold text-white backdrop-blur-md border border-white/10">
                  <Users size={14} />
                  {selectedStream.viewers}
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">{selectedStream.title}</h1>
                <p className="text-neutral-500">Streaming in {selectedStream.category}</p>
              </div>
              <button 
                onClick={() => {
                  if (selectedStream.isMine) {
                    setMyStream(null);
                  }
                  setSelectedStream(null);
                }}
                className={`rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all ${selectedStream.isMine ? 'bg-red-600 hover:bg-red-700' : 'bg-neutral-900 hover:bg-neutral-800'}`}
              >
                {selectedStream.isMine ? 'End Stream' : 'Back to Streams'}
              </button>
            </div>
          </div>

          {/* Live Chat */}
          <div className="flex h-[600px] flex-col rounded-3xl border border-white/5 bg-neutral-900 shadow-2xl">
            <div className="border-b border-white/5 p-6">
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white">
                <MessageCircle size={18} className="text-orange-500" />
                Live Chat
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-neutral-800 border border-white/10" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-orange-500">{comment.user}</span>
                      <span className="text-[10px] text-neutral-600">{comment.time}</span>
                    </div>
                    <p className="text-sm text-neutral-300 leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-white/5">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newComment.trim()) return;
                  setComments([...comments, { id: Date.now(), user: 'You', text: newComment, time: 'Just now' }]);
                  setNewComment('');
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Say something..."
                  className="flex-1 rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all"
                />
                <button 
                  type="submit"
                  className="rounded-xl bg-orange-600 p-2 text-white hover:bg-orange-700 transition-all"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white">Live Streams</h1>
              <p className="text-neutral-500">Watch and interact with live content from across the continent.</p>
            </div>
            <button 
              onClick={() => setIsGoingLive(true)}
              className="flex items-center gap-2 rounded-2xl bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-900/20 transition-all hover:bg-orange-700 active:scale-95"
            >
              <Radio size={18} />
              Go Live
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {liveStreams.map((stream) => (
              <motion.div 
                key={stream.id}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedStream(stream)}
                className="group cursor-pointer overflow-hidden rounded-3xl border border-white/5 bg-neutral-900 shadow-xl transition-all hover:shadow-2xl hover:border-orange-600/30"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img src={stream.thumbnail} alt={stream.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"></span>
                    Live
                  </div>
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md border border-white/10">
                    <Users size={12} />
                    {stream.viewers} Viewers
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-orange-600/10 px-2 py-0.5 text-[10px] font-bold text-orange-500 uppercase tracking-widest border border-orange-600/20">
                      {stream.category}
                    </span>
                  </div>
                  <h3 className="mb-4 line-clamp-1 text-lg font-bold text-white">{stream.title}</h3>
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-neutral-800 ring-2 ring-white/5"></div>
                      <span className="text-xs font-bold text-neutral-400">Streamer Name</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-full p-2 text-neutral-500 hover:bg-red-500/10 hover:text-red-500 transition-all">
                        <Heart size={18} />
                      </button>
                      <button className="rounded-full p-2 text-neutral-500 hover:bg-orange-600/10 hover:text-orange-500 transition-all">
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
