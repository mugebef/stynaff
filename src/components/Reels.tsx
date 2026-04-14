import React from 'react';
import { Heart, MessageCircle, Share2, Music, User as UserIcon, CheckCircle, Volume2, VolumeX, MoreVertical, Bookmark, Send, Plus, Video, Upload } from 'lucide-react';
import { Post, User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadReel } from './UploadReel';

interface ReelsProps {
  posts: Post[];
  currentUser: User;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onUpload: (file: File, caption: string) => Promise<void>;
}

export const Reels: React.FC<ReelsProps> = ({ posts, currentUser, onLike, onComment, onUpload }) => {
  const reels = posts.filter(p => p.isReel && p.mediaType === 'video');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(true);
  const [showHeart, setShowHeart] = React.useState<{ x: number, y: number } | null>(null);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoRefs = React.useRef<{ [key: string]: HTMLVideoElement | null }>({});

  const handleScroll = () => {
    if (containerRef.current) {
      const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
      if (index !== activeIndex) {
        setActiveIndex(index);
        // Pause other videos
        Object.values(videoRefs.current).forEach((v, i) => {
          const video = v as HTMLVideoElement | null;
          if (video && i !== index) video.pause();
          if (video && i === index) video.play().catch(() => {});
        });
      }
    }
  };

  const handleDoubleTap = (e: React.MouseEvent, postId: string) => {
    if (e.detail === 2) {
      const rect = e.currentTarget.getBoundingClientRect();
      setShowHeart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      onLike(postId);
      setTimeout(() => setShowHeart(null), 1000);
    }
  };

  if (reels.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center rounded-3xl bg-neutral-900 text-white">
        <div className="text-center">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10"
          >
            <Video size={40} className="text-orange-500" />
          </motion.div>
          <p className="text-xl font-bold">No Reels yet.</p>
          <p className="text-sm text-neutral-400">Be the first to post a short video!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[85vh] w-full max-w-md mx-auto">
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="relative h-full w-full snap-y snap-mandatory overflow-y-scroll rounded-3xl bg-black shadow-2xl no-scrollbar"
      >
        {reels.map((reel, index) => (
          <div 
            key={reel.id} 
            className="relative h-full w-full snap-start overflow-hidden"
            onClick={(e) => handleDoubleTap(e, reel.id)}
          >
            {/* Video Player */}
            <video
              ref={el => videoRefs.current[index] = el}
              src={reel.mediaUrl}
              autoPlay={index === activeIndex}
              loop
              muted={isMuted}
              playsInline
              className="h-full w-full object-cover"
            />

            {/* Double Tap Heart Animation */}
            <AnimatePresence>
              {showHeart && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  style={{ left: showHeart.x - 40, top: showHeart.y - 40 }}
                  className="pointer-events-none absolute z-50 text-white"
                >
                  <Heart size={80} className="fill-current text-red-500 drop-shadow-2xl" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80"></div>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 text-white">
              {/* Author Avatar */}
              <div className="relative mb-4">
                <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-neutral-800 shadow-xl">
                  {reel.authorPhoto ? <img src={reel.authorPhoto} alt="" className="h-full w-full object-cover" /> : <UserIcon className="m-2" />}
                </div>
                <button className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-orange-600 p-1 text-white shadow-lg">
                  <Plus size={12} />
                </button>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); onLike(reel.id); }}
                className="flex flex-col items-center gap-1 group"
              >
                <motion.div 
                  whileTap={{ scale: 0.8 }}
                  className={`rounded-full p-3 transition-all ${reel.likes.includes(currentUser.uid) ? 'text-red-500' : 'text-white'}`}
                >
                  <Heart size={32} className={reel.likes.includes(currentUser.uid) ? 'fill-current' : ''} />
                </motion.div>
                <span className="text-xs font-bold drop-shadow-md">{reel.likes.length}</span>
              </button>

              <button className="flex flex-col items-center gap-1 group">
                <div className="rounded-full p-3 text-white transition-all">
                  <MessageCircle size={32} className="fill-transparent" />
                </div>
                <span className="text-xs font-bold drop-shadow-md">{reel.comments.length}</span>
              </button>

              <button className="flex flex-col items-center gap-1 group">
                <div className="rounded-full p-3 text-white transition-all">
                  <Bookmark size={32} className="fill-transparent" />
                </div>
                <span className="text-xs font-bold drop-shadow-md">Save</span>
              </button>

              <button className="flex flex-col items-center gap-1 group">
                <div className="rounded-full p-3 text-white transition-all">
                  <Send size={32} className="fill-transparent" />
                </div>
                <span className="text-xs font-bold drop-shadow-md">{reel.shares || 0}</span>
              </button>

              {/* Rotating Music Disc */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="mt-4 h-12 w-12 rounded-full border-4 border-neutral-800 bg-neutral-900 p-2 shadow-2xl"
              >
                <div className="h-full w-full rounded-full bg-gradient-to-tr from-orange-600 to-pink-600 flex items-center justify-center">
                  <Music size={16} className="text-white" />
                </div>
              </motion.div>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-16 p-6 text-white">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">@{reel.authorName.toLowerCase().replace(/\s/g, '')}</span>
                  {reel.authorVerified && <CheckCircle size={16} className="fill-blue-500 text-white" />}
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase backdrop-blur-md">Follow</span>
                </div>
                <p className="text-sm line-clamp-2 font-medium leading-relaxed text-white/90">{reel.content}</p>
                <div className="flex items-center gap-2 overflow-hidden">
                  <Music size={14} className="shrink-0" />
                  <div className="overflow-hidden whitespace-nowrap">
                    <motion.p 
                      animate={{ x: [0, -100, 0] }}
                      transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                      className="text-xs font-bold text-neutral-200"
                    >
                      Original Audio • {reel.authorName} • Trending Music • STYN
                    </motion.p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mute Toggle Overlay */}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
              className="absolute top-6 right-6 rounded-full bg-black/20 p-2 text-white backdrop-blur-md hover:bg-black/40 transition-all"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
        ))}
      </div>

      {/* Upload Button */}
      <button
        onClick={() => setIsUploadOpen(true)}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-neutral-900 shadow-2xl hover:scale-105 transition-all active:scale-95"
      >
        <Upload size={18} className="text-orange-600" />
        Upload Reel
      </button>

      <UploadReel 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUpload={onUpload}
      />
    </div>
  );
};
