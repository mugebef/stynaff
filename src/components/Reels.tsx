import React from 'react';
import { Heart, MessageCircle, Share2, Music, User as UserIcon, CheckCircle, Volume2, VolumeX, MoreVertical, Bookmark, Send, Plus, Video, Upload, Play, X } from 'lucide-react';
import { Post, User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadReel } from './UploadReel';

interface ReelsProps {
  posts: Post[];
  currentUser: User;
  users: User[];
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onUpload: (file: File, caption: string) => Promise<void>;
  onFollow: (uid: string) => void;
  onShare: (postId: string) => void;
  onChat: (targetUser: User) => void;
}

export const Reels: React.FC<ReelsProps> = ({ 
  posts, 
  currentUser, 
  users,
  onLike, 
  onComment, 
  onUpload,
  onFollow,
  onShare,
  onChat
}) => {
  const [reels, setReels] = React.useState<Post[]>(posts.filter(p => p.isReel && p.mediaType === 'video'));
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(true);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [showHeart, setShowHeart] = React.useState<{ x: number, y: number } | null>(null);
  const [likedMessage, setLikedMessage] = React.useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [showComments, setShowComments] = React.useState<string | null>(null);
  const [newComment, setNewComment] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoRefs = React.useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // Intersection Observer for auto-play/pause
  React.useEffect(() => {
    const options = {
      root: containerRef.current,
      rootMargin: '0px',
      threshold: 0.8 
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          setIsPlaying(true);
          const index = Object.values(videoRefs.current).indexOf(video);
          if (index !== -1) setActiveIndex(index);
        } else {
          video.pause();
        }
      });
    }, options);

    const currentVideos = Object.values(videoRefs.current) as (HTMLVideoElement | null)[];
    currentVideos.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => {
      currentVideos.forEach((video) => {
        if (video) observer.unobserve(video);
      });
    };
  }, [reels]);

  // Infinity Scroll Logic
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, clientHeight, scrollHeight } = containerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        setReels(prev => [...prev, ...posts.filter(p => p.isReel && p.mediaType === 'video')]);
      }
    }
  };

  React.useEffect(() => {
    setReels(posts.filter(p => p.isReel && p.mediaType === 'video'));
  }, [posts]);

  const handleLikeWithFeedback = (postId: string) => {
    onLike(postId);
    const reel = reels.find(r => r.id === postId);
    if (reel && !reel.likes.includes(currentUser.uid)) {
      setLikedMessage('Liked!');
      setTimeout(() => setLikedMessage(null), 1500);
    }
  };

  const handleDoubleTap = (e: React.MouseEvent, postId: string) => {
    if (e.detail === 2) {
      const rect = e.currentTarget.getBoundingClientRect();
      setShowHeart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      handleLikeWithFeedback(postId);
      setTimeout(() => setShowHeart(null), 1000);
    } else {
      // Single tap to play/pause
      const video = videoRefs.current[activeIndex];
      if (video) {
        if (video.paused) {
          video.play();
          setIsPlaying(true);
        } else {
          video.pause();
          setIsPlaying(false);
        }
      }
    }
  };

  return (
    <div className="relative h-[85vh] w-full max-w-md mx-auto">
      {reels.length === 0 ? (
        <div className="flex h-full items-center justify-center rounded-3xl bg-neutral-950 text-white border border-white/5 shadow-2xl">
          <div className="text-center">
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-600/10"
            >
              <Video size={40} className="text-orange-500" />
            </motion.div>
            <p className="text-xl font-bold">No Reels yet.</p>
            <p className="text-sm text-neutral-500">Be the first to post a short video!</p>
          </div>
        </div>
      ) : (
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="relative h-full w-full snap-y snap-mandatory overflow-y-scroll rounded-3xl bg-black shadow-2xl no-scrollbar border border-white/5"
        >
          {reels.map((reel, index) => (
            <div 
              key={`${reel.id}-${index}`} 
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

              {/* Play/Pause Indicator Overlay */}
              <AnimatePresence>
                {!isPlaying && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="rounded-full bg-black/40 p-6 backdrop-blur-md">
                      <Play size={48} className="text-white fill-current" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Double Tap Heart Animation */}
              <AnimatePresence>
                {showHeart && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.5, 1.2], opacity: [0, 1, 1] }}
                    exit={{ scale: 2, opacity: 0 }}
                    style={{ left: showHeart.x - 40, top: showHeart.y - 40 }}
                    className="pointer-events-none absolute z-50 text-white"
                  >
                    <Heart size={80} className="fill-current text-orange-500 drop-shadow-2xl" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Liked Confirmation Message */}
              <AnimatePresence>
                {likedMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none"
                  >
                    <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl">
                      <p className="text-white font-black uppercase tracking-[0.2em] text-sm">Liked!</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90"></div>

              {/* Right Side Actions */}
              <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 text-white">
                {/* Author Avatar */}
                <div className="relative mb-4">
                  <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-orange-600 bg-neutral-900 shadow-xl">
                    {reel.authorPhoto ? <img src={reel.authorPhoto} alt="" className="h-full w-full object-cover" /> : <UserIcon className="m-2" />}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onFollow(reel.authorId);
                    }}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-orange-600 p-1 text-white shadow-lg hover:scale-110 transition-all"
                  >
                    <Plus size={12} strokeWidth={3} />
                  </button>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); handleLikeWithFeedback(reel.id); }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <motion.div 
                    animate={reel.likes.includes(currentUser.uid) ? { scale: [1, 1.4, 1] } : {}}
                    whileTap={{ scale: 0.8 }}
                    className={`rounded-full p-3 transition-all ${reel.likes.includes(currentUser.uid) ? 'text-orange-500' : 'text-white'}`}
                  >
                    <Heart size={32} className={reel.likes.includes(currentUser.uid) ? 'fill-current' : ''} />
                  </motion.div>
                  <span className="text-xs font-black drop-shadow-md">{reel.likes.length}</span>
                </button>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowComments(reel.id);
                  }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="rounded-full p-3 text-white transition-all hover:text-orange-500">
                    <MessageCircle size={32} className="fill-transparent" />
                  </div>
                  <span className="text-xs font-black drop-shadow-md">{reel.comments.length}</span>
                </button>

                <button className="flex flex-col items-center gap-1 group">
                  <div className="rounded-full p-3 text-white transition-all hover:text-orange-500">
                    <Bookmark size={32} className="fill-transparent" />
                  </div>
                  <span className="text-xs font-black drop-shadow-md">Save</span>
                </button>

                <button 
                  onClick={(e) => { e.stopPropagation(); onShare(reel.id); }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="rounded-full p-3 text-white transition-all hover:text-orange-500">
                    <Share2 size={32} className="fill-transparent" />
                  </div>
                  <span className="text-xs font-black drop-shadow-md">{reel.shares || 0}</span>
                </button>

                {/* Rotating Music Disc */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="mt-4 h-12 w-12 rounded-full border-4 border-neutral-900 bg-neutral-950 p-2 shadow-2xl"
                >
                  <div className="h-full w-full rounded-full bg-gradient-to-tr from-orange-600 to-orange-400 flex items-center justify-center">
                    <Music size={16} className="text-white" />
                  </div>
                </motion.div>
              </div>

              {/* Bottom Info */}
              <div className="absolute bottom-0 left-0 right-16 p-6 text-white">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-tight">@{reel.authorName.toLowerCase().replace(/\s/g, '')}</span>
                    {reel.authorVerified && <CheckCircle size={16} className="fill-blue-500 text-white" />}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onFollow(reel.authorId);
                      }}
                      className="rounded-md bg-orange-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-md hover:bg-orange-700 transition-all"
                    >
                      {currentUser.following?.includes(reel.authorId) ? 'Following' : 'Follow'}
                    </button>
                  </div>
                  <p className="text-sm line-clamp-2 font-medium leading-relaxed text-white/90 drop-shadow-sm">{reel.content}</p>
                  <div className="flex items-center gap-2 overflow-hidden bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 w-fit">
                    <Music size={14} className="shrink-0 text-orange-500" />
                    <div className="overflow-hidden whitespace-nowrap">
                      <motion.p 
                        animate={{ x: [0, -100, 0] }}
                        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                        className="text-[10px] font-black uppercase tracking-widest text-neutral-200"
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
                className="absolute top-6 right-6 rounded-full bg-black/40 p-2 text-white backdrop-blur-md hover:bg-black/60 transition-all border border-white/10"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button - Fixed + Button Lower Right */}
      <div className="absolute bottom-10 right-10 z-50">
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-600 text-white shadow-[0_20px_50px_rgba(234,88,12,0.4)] hover:scale-110 transition-all active:scale-95 ring-4 ring-black/20"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      </div>

      <UploadReel 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUpload={onUpload}
      />

      {/* Comments Drawer */}
      <AnimatePresence>
        {showComments && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowComments(null)}
              className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm rounded-3xl"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="absolute bottom-0 left-0 right-0 z-[70] h-[60%] rounded-t-[2.5rem] bg-neutral-900 p-6 shadow-2xl border-t border-white/5"
            >
              <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-neutral-800" />
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black uppercase tracking-widest text-white">Comments</h3>
                <button onClick={() => setShowComments(null)} className="text-neutral-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="h-[calc(100%-120px)] overflow-y-auto space-y-4 pr-2 no-scrollbar">
                {reels.find(r => r.id === showComments)?.comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-2">
                    <MessageCircle size={40} className="opacity-20" />
                    <p className="text-sm font-bold">No comments yet</p>
                    <p className="text-xs">Start the conversation!</p>
                  </div>
                ) : (
                  reels.find(r => r.id === showComments)?.comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-neutral-800 border border-white/10">
                        {users.find(u => u.uid === comment.authorId)?.photoURL && (
                          <img src={users.find(u => u.uid === comment.authorId)?.photoURL} className="h-full w-full rounded-full object-cover" alt="" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-white">{comment.authorName}</span>
                          <span className="text-[10px] text-neutral-600">2h ago</span>
                        </div>
                        <p className="text-sm text-neutral-300 leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-neutral-900 border-t border-white/5">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newComment.trim()) return;
                    onComment(showComments, newComment);
                    setNewComment('');
                  }}
                  className="flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 rounded-xl border border-white/5 bg-neutral-950 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={!newComment.trim()}
                    className="rounded-full bg-orange-600 p-2.5 text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700 disabled:opacity-50 transition-all active:scale-95"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
