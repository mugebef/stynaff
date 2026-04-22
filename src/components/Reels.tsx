import React from 'react';
import { Heart, MessageCircle, Share2, Music, User as UserIcon, CheckCircle, Volume2, VolumeX, MoreVertical, Bookmark, Send, Plus, Video, Upload, Play, X, Film, Search, Eye } from 'lucide-react';
import { Post, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
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
  onView?: (postId: string) => void;
  onChat: (targetUser: User) => void;
  onPurchaseMovie?: (movieId: string, price: number) => Promise<void>;
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
  onView,
  onChat,
  onPurchaseMovie
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSearch, setShowSearch] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  
  // Recommendation & Filtering Logic
  const reels = React.useMemo(() => {
    let list = posts.filter(p => (
      p.isReel || 
      p.mediaType === 'video' || 
      (p.mediaUrl && (p.mediaUrl.toLowerCase().endsWith('.mp4') || p.mediaUrl.toLowerCase().endsWith('.mov')))
    ));
    
    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => 
        r.content.toLowerCase().includes(q) || 
        r.hashtags?.some(h => h.toLowerCase().includes(q)) ||
        r.authorName.toLowerCase().includes(q)
      );
    }
    
    // Recommendation Algorithm
    return [...list].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // 1. Followed accounts (Strong boost)
      if (currentUser.following?.includes(a.authorId)) scoreA += 5000;
      if (currentUser.following?.includes(b.authorId)) scoreB += 5000;

      // 2. Interests (matching hashtags)
      const userInterests = currentUser.interests || [];
      const hashtagsA = a.hashtags || [];
      const hashtagsB = b.hashtags || [];
      scoreA += hashtagsA.filter(h => userInterests.some(i => i.toLowerCase() === h.toLowerCase())).length * 500;
      scoreB += hashtagsB.filter(h => userInterests.some(i => i.toLowerCase() === h.toLowerCase())).length * 500;

      // 3. Interaction History (Authors of previously liked content)
      const likedAuthorIds = new Set(posts.filter(p => p.likes.includes(currentUser.uid)).map(p => p.authorId));
      if (likedAuthorIds.has(a.authorId)) scoreA += 1000;
      if (likedAuthorIds.has(b.authorId)) scoreB += 1000;

      // 4. Boosted/Sponsored
      if (a.isBoosted || a.isSponsored) scoreA += 10000;
      if (b.isBoosted || b.isSponsored) scoreB += 10000;

      // 5. Popularity
      scoreA += (a.views || 0) * 0.1;
      scoreB += (b.views || 0) * 0.1;

      // 6. Recency (Favor newer content)
      const now = Date.now() / 1000;
      const recencyA = a.createdAt?.seconds ? (now - a.createdAt.seconds) / 3600 : 0;
      const recencyB = b.createdAt?.seconds ? (now - b.createdAt.seconds) / 3600 : 0;
      scoreA -= Math.min(recencyA, 1000); // Penalty for age, capped
      scoreB -= Math.min(recencyB, 1000);

      return scoreB - scoreA;
    });
  }, [posts, searchQuery, currentUser]);

  const [isMuted, setIsMuted] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [showHeart, setShowHeart] = React.useState<{ x: number, y: number } | null>(null);
  const [likedMessage, setLikedMessage] = React.useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [showComments, setShowComments] = React.useState<string | null>(null);
  const [newComment, setNewComment] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoRefs = React.useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const viewedReels = React.useRef<Set<string>>(new Set());

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
          if (index !== -1) {
            setActiveIndex(index);
            // Track view
            const currentReel = reels[index];
            if (currentReel && onView && !viewedReels.current.has(currentReel.id)) {
              onView(currentReel.id);
              viewedReels.current.add(currentReel.id);
            }
          }
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
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setShowHeart({ x, y });
      handleLikeWithFeedback(postId);
      
      // Haptic feedback
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }

      setTimeout(() => setShowHeart(null), 1000);
    } else {
      // Single tap to play/pause with a small overlay feedback
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
      {/* Search Header */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-2">
        <AnimatePresence>
          {showSearch ? (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex items-center overflow-hidden rounded-full bg-black/40 backdrop-blur-md border border-white/10"
            >
              <input 
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Videos..."
                className="w-full bg-transparent px-4 py-2 text-sm text-white focus:outline-none"
              />
              <button 
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="p-2 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </motion.div>
          ) : (
            <motion.button 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => setShowSearch(true)}
              className="rounded-full bg-black/40 p-3 text-white backdrop-blur-md border border-white/10 hover:bg-black/60 transition-all"
            >
              <Search size={20} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

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
            <p className="text-xl font-bold">No Videos yet.</p>
            <p className="text-sm text-neutral-500">Be the first to post a short video!</p>
          </div>
        </div>
      ) : (
        <div 
          ref={containerRef}
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
                    initial={{ scale: 0, opacity: 0, rotate: -15 }}
                    animate={{ 
                      scale: [0, 1.2, 1], 
                      opacity: [0, 1, 1],
                      rotate: [-15, 0, 0]
                    }}
                    exit={{ 
                      scale: 2.5, 
                      opacity: 0,
                      filter: "blur(20px)"
                    }}
                    transition={{ 
                      duration: 0.6,
                      ease: "backOut",
                      times: [0, 0.7, 1]
                    }}
                    style={{ left: showHeart.x - 40, top: showHeart.y - 40 }}
                    className="pointer-events-none absolute z-50 text-white"
                  >
                    <Heart size={80} className="fill-current text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]" />
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-white blur-3xl"
                    />
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
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-3.5 text-white z-50">
        {/* Author Avatar */}
        <div className="relative mb-2">
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-orange-600 bg-neutral-900 shadow-xl">
            {reel.authorPhoto ? <img src={reel.authorPhoto} alt="" className="h-full w-full object-cover" /> : <UserIcon className="m-2" size={20} />}
          </div>
          {reel.authorId !== currentUser.uid && !currentUser.following?.includes(reel.authorId) && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onFollow(reel.authorId);
              }}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-orange-600 p-0.5 text-white shadow-lg hover:scale-110 transition-all"
            >
              <Plus size={10} strokeWidth={3} />
            </button>
          )}
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); handleLikeWithFeedback(reel.id); }}
          className="flex flex-col items-center gap-0.5 group"
        >
          <motion.div 
            animate={reel.likes.includes(currentUser.uid) ? { scale: [1, 1.4, 1] } : {}}
            whileTap={{ scale: 0.8 }}
            className={`rounded-full p-2 transition-all ${reel.likes.includes(currentUser.uid) ? 'text-orange-500' : 'text-white'}`}
          >
            <Heart size={26} className={reel.likes.includes(currentUser.uid) ? 'fill-current' : ''} />
          </motion.div>
          <span className="text-[10px] font-black drop-shadow-md">{reel.likes.length}</span>
        </button>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowComments(reel.id);
          }}
          className="flex flex-col items-center gap-0.5 group"
        >
          <div className="rounded-full p-2 text-white transition-all hover:text-orange-500">
            <MessageCircle size={26} className="fill-transparent" />
          </div>
          <span className="text-[10px] font-black drop-shadow-md">{reel.comments.length}</span>
        </button>

        <button className="flex flex-col items-center gap-0.5 group">
          <div className="rounded-full p-2 text-white transition-all hover:text-orange-500">
            <Bookmark size={26} className="fill-transparent" />
          </div>
          <span className="text-[10px] font-black drop-shadow-md">Save</span>
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); onShare(reel.id); }}
          className="flex flex-col items-center gap-0.5 group"
        >
          <div className="rounded-full p-2 text-white transition-all hover:text-orange-500">
            <Share2 size={26} className="fill-transparent" />
          </div>
          <span className="text-[10px] font-black drop-shadow-md">{reel.shares || 0}</span>
        </button>

        <div className="flex flex-col items-center gap-0.5">
          <div className="rounded-full p-2 text-white">
            <Eye size={24} />
          </div>
          <span className="text-[10px] font-black drop-shadow-md">
            {reel.views > 999 ? (reel.views / 1000).toFixed(1) + 'K' : reel.views || 0}
          </span>
        </div>

        {/* Rotating Music Disc */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="mt-2 h-10 w-10 rounded-full border-4 border-neutral-900 bg-neutral-950 p-1.5 shadow-2xl"
        >
          <div className="h-full w-full rounded-full bg-gradient-to-tr from-orange-600 to-orange-400 flex items-center justify-center">
            <Music size={14} className="text-white" />
          </div>
        </motion.div>
      </div>

              {/* Bottom Info */}
              <div className="absolute bottom-0 left-0 right-16 p-6 text-white">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div 
                      onClick={(e) => { e.stopPropagation(); onChat(users.find(u => u.uid === reel.authorId) || reel as any); }}
                      className="h-10 w-10 overflow-hidden rounded-full border-2 border-white/50 shadow-lg cursor-pointer hover:scale-110 transition-transform"
                    >
                      {reel.authorPhoto ? (
                        <img src={reel.authorPhoto} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-neutral-800">
                          <UserIcon size={20} className="text-neutral-500" />
                        </div>
                      )}
                    </div>
                    <span className="text-lg font-black tracking-tight" onClick={(e) => { e.stopPropagation(); onChat(users.find(u => u.uid === reel.authorId) || reel as any); }}>@{reel.authorName.toLowerCase().replace(/\s/g, '')}</span>
                    {reel.authorVerified && <CheckCircle size={16} className="fill-blue-500 text-white" />}
                    {reel.authorId !== currentUser.uid && !currentUser.following?.includes(reel.authorId) && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onFollow(reel.authorId);
                        }}
                        className="rounded-md bg-orange-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-md hover:bg-orange-700 transition-all"
                      >
                        Follow
                      </button>
                    )}
                  </div>
                  <p className="text-sm line-clamp-2 font-medium leading-relaxed text-white/90 drop-shadow-sm">{reel.content}</p>
                  
                  {reel.isMovieTrailer && reel.authorId !== currentUser.uid && (
                    <div className="flex flex-wrap gap-2">
                      <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (reel.movieId && onPurchaseMovie) {
                            onPurchaseMovie(reel.movieId, reel.moviePrice || 0);
                          }
                        }}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-2xl shadow-orange-900/40 border border-orange-400/20"
                      >
                        <Film size={18} />
                        Pay to see full movie
                      </motion.button>
                      
                      {!currentUser.following?.includes(reel.authorId) && (
                        <motion.button
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onFollow(reel.authorId);
                          }}
                          className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-6 py-3 text-sm font-black uppercase tracking-widest text-white border border-white/20 hover:bg-white/20 transition-all font-mono"
                        >
                          <Plus size={18} />
                          Follow Studio
                        </motion.button>
                      )}
                    </div>
                  )}

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
                className="absolute top-6 right-6 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-white backdrop-blur-xl border border-white/20 shadow-2xl active:scale-95 transition-all group"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                <span className="text-[10px] font-black uppercase tracking-widest">{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button - Hidden on mobile, visible on desktop within the reels container */}
      <div className="hidden md:flex md:absolute md:bottom-10 md:right-10 md:z-50">
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-600 text-white shadow-[0_20px_50px_rgba(234,88,12,0.4)] hover:scale-110 transition-all active:scale-95 ring-4 ring-black/20"
          title="Upload Video"
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
