import React from 'react';
import { Heart, MessageCircle, Share2, Music, User as UserIcon, CheckCircle, Volume2, VolumeX } from 'lucide-react';
import { Post, User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ReelsProps {
  posts: Post[];
  currentUser: User;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
}

export const Reels: React.FC<ReelsProps> = ({ posts, currentUser, onLike, onComment }) => {
  const reels = posts.filter(p => p.isReel && p.mediaType === 'video');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(true);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (containerRef.current) {
      const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
      setActiveIndex(index);
    }
  };

  if (reels.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center rounded-3xl bg-neutral-900 text-white">
        <div className="text-center">
          <p className="text-xl font-bold">No Reels yet.</p>
          <p className="text-sm text-neutral-400">Be the first to post a short video!</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="relative h-[85vh] w-full max-w-md mx-auto snap-y snap-mandatory overflow-y-scroll rounded-3xl bg-black shadow-2xl no-scrollbar"
    >
      {reels.map((reel, index) => (
        <div key={reel.id} className="relative h-full w-full snap-start overflow-hidden">
          {/* Video Player */}
          <video
            src={reel.mediaUrl}
            autoPlay={index === activeIndex}
            loop
            muted={isMuted}
            playsInline
            className="h-full w-full object-cover"
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>

          {/* Controls & Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-end justify-between">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-neutral-800">
                    {reel.authorPhoto ? <img src={reel.authorPhoto} alt="" className="h-full w-full object-cover" /> : <UserIcon className="m-2" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold">{reel.authorName}</span>
                      {reel.authorVerified && <CheckCircle size={14} className="fill-blue-500 text-white" />}
                    </div>
                    <button className="text-xs font-bold text-orange-500 hover:underline">Follow</button>
                  </div>
                </div>
                <p className="text-sm line-clamp-2">{reel.content}</p>
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-300">
                  <Music size={14} />
                  <span>Original Audio • {reel.authorName}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col items-center gap-6 pb-4">
                <button 
                  onClick={() => onLike(reel.id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className={`rounded-full p-3 transition-all ${reel.likes.includes(currentUser.uid) ? 'bg-red-500 text-white' : 'bg-white/10 backdrop-blur-md text-white group-hover:bg-white/20'}`}>
                    <Heart size={24} className={reel.likes.includes(currentUser.uid) ? 'fill-current' : ''} />
                  </div>
                  <span className="text-xs font-bold">{reel.likes.length}</span>
                </button>

                <button className="flex flex-col items-center gap-1 group">
                  <div className="rounded-full bg-white/10 p-3 backdrop-blur-md text-white transition-all group-hover:bg-white/20">
                    <MessageCircle size={24} />
                  </div>
                  <span className="text-xs font-bold">{reel.comments.length}</span>
                </button>

                <button className="flex flex-col items-center gap-1 group">
                  <div className="rounded-full bg-white/10 p-3 backdrop-blur-md text-white transition-all group-hover:bg-white/20">
                    <Share2 size={24} />
                  </div>
                  <span className="text-xs font-bold">{reel.shares || 0}</span>
                </button>

                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="rounded-full bg-white/10 p-3 backdrop-blur-md text-white transition-all hover:bg-white/20"
                >
                  {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
