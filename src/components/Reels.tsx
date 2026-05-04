import React from 'react';
import { Heart, MessageCircle, Share2, Music, User as UserIcon, CheckCircle, Volume2, VolumeX, MoreVertical, Bookmark, Send, Plus, Video, Upload, Play, Pause, X, Film, Search, Eye, Shield, Zap } from 'lucide-react';
import { Post, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { UploadReel } from './UploadReel';
import { getMediaSource } from '../utils';

interface ReelsProps {
  posts: Post[];
  currentUser: User;
  users: User[];
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onUpload: (file: File, caption: string) => Promise<void>;
  onUpdateReel?: (reelId: string, updates: { content: string }) => Promise<void>;
  onFollow: (uid: string) => void;
  onShare: (postId: string) => void;
  onView?: (postId: string) => void;
  onPinReel?: (postId: string, isPinned: boolean) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
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
  onUpdateReel,
  onFollow,
  onShare,
  onPinReel,
  onDelete,
  onView,
  onChat,
  onPurchaseMovie
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSearch, setShowSearch] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [showMoreMenu, setShowMoreMenu] = React.useState<string | null>(null);
  const [editingReel, setEditingReel] = React.useState<{ id: string; content: string } | null>(null);
  
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

      // 0. Pinned (Absolute priority)
      if (a.isPinned) scoreA += 1000000;
      if (b.isPinned) scoreB += 1000000;

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
      const now = Math.floor(Date.now() / 600000) * 600; // Round to 10 min
      const recencyA = a.createdAt?.seconds ? (now - a.createdAt.seconds) / 3600 : 0;
      const recencyB = b.createdAt?.seconds ? (now - b.createdAt.seconds) / 3600 : 0;
      scoreA -= Math.min(recencyA, 1000); // Penalty for age, capped
      scoreB -= Math.min(recencyB, 1000);

      return scoreB - scoreA;
    });
  }, [posts, searchQuery, currentUser]);

  const [isMuted, setIsMuted] = React.useState(true);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [videoError, setVideoError] = React.useState<Set<string>>(new Set());
  const [showHeart, setShowHeart] = React.useState<{ x: number, y: number } | null>(null);
  const [likedMessage, setLikedMessage] = React.useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [showComments, setShowComments] = React.useState<string | null>(null);
  const [newComment, setNewComment] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoRefs = React.useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const viewedReels = React.useRef<Set<string>>(new Set());
  const onViewRef = React.useRef(onView);
  onViewRef.current = onView;

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
        const reelId = video.dataset.reelId;
        
        if (entry.isIntersecting) {
          const index = reels.findIndex(r => r.id === reelId);
          
          video.play()
            .then(() => {
              if (index !== -1) {
                // If it's the one we just played, we are playing
                setIsPlaying(true);
              }
            })
            .catch((err) => {
              console.warn("Autoplay blocked or failed:", err);
              setIsPlaying(false);
            });
          
          if (reelId && index !== -1) {
            setActiveIndex(index);
              
            // Track view
            const currentReel = reels[index];
            if (currentReel && onViewRef.current && !viewedReels.current.has(currentReel.id)) {
              onViewRef.current(currentReel.id);
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
  }, [reels]); // Removed onView as a dependency to prevent churn

  // Sync active video playback
  React.useEffect(() => {
    const activeReel = reels[activeIndex];
    const video = activeReel ? videoRefs.current[activeReel.id] : null;
    if (video) {
      if (isPlaying) {
        video.play().catch((err) => {
          console.warn("Manual play failed:", err);
          // If play failed (e.g. user hasn't interacted), we might stay in "paused" state visually
          // but we don't want to force setIsPlaying(false) if it was an autoplay block
        });
      } else {
        video.pause();
      }
    }
    
    // Pause all other videos
    Object.entries(videoRefs.current).forEach(([id, v]) => {
      const videoEl = v as HTMLVideoElement | null;
      if (videoEl && id !== activeReel?.id) {
        videoEl.pause();
      }
    });
  }, [activeIndex, isPlaying, reels]);

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
      const currentReel = reels[activeIndex];
      const video = currentReel ? videoRefs.current[currentReel.id] : null;
      if (video) {
        if (video.paused) {
          video.play().catch(() => {});
          setIsPlaying(true);
        } else {
          video.pause();
          setIsPlaying(false);
        }
      }
    }
  };

  return (
    <div className="relative h-[88vh] w-full max-w-[450px] mx-auto overflow-hidden sm:rounded-[32px] bg-black shadow-2xl">
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
          className="relative h-full w-full snap-y snap-mandatory overflow-y-scroll bg-black no-scrollbar"
        >
          {reels.map((reel, index) => (
            <div 
              key={reel.id || `reel-${index}`} 
              className="relative h-full w-full snap-start overflow-hidden"
              onClick={(e) => handleDoubleTap(e, reel.id)}
            >
              {/* Video Player */}
                {videoError.has(reel.id) ? (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-900 border border-white/5 px-8 text-center">
                    <div>
                      <Video size={48} className="mx-auto mb-4 text-neutral-600" />
                      <p className="text-white font-bold mb-1">Video Unavailable</p>
                      <p className="text-xs text-neutral-500">This content could not be loaded or has been moved.</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoError(prev => {
                            const next = new Set(prev);
                            next.delete(reel.id);
                            return next;
                          });
                          const v = videoRefs.current[reel.id];
                          if (v) {
                            v.dataset.retried = '';
                            v.load();
                          }
                        }}
                        className="mt-6 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-white/20 transition-all"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : (
                  <video
                    ref={el => videoRefs.current[reel.id] = el}
                    data-reel-id={reel.id}
                    src={getMediaSource(reel.mediaUrl)}
                    autoPlay={index === activeIndex}
                    loop
                    muted={isMuted}
                    playsInline
                    preload="auto"
                    crossOrigin="anonymous"
                    className="h-full w-full object-cover cursor-pointer"
                    onLoadedMetadata={(e) => {
                      const video = e.currentTarget;
                      if (index === activeIndex && !video.paused) {
                        setIsPlaying(true);
                      }
                    }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onError={(e) => {
                      const video = e.currentTarget;
                      console.error(`Video load failed for reel ${reel.id}:`, video.error?.code, video.error?.message, getMediaSource(reel.mediaUrl));
                      
                      // Try to reload once if it fails
                      if (!video.dataset.retried) {
                        video.dataset.retried = 'true';
                        setTimeout(() => { 
                          video.load();
                        }, 2000);
                      } else {
                        setVideoError(prev => new Set(prev).add(reel.id));
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const v = videoRefs.current[reel.id];
                      if (v) {
                        if (v.paused) {
                          v.play().catch(err => console.error("Play error:", err));
                        } else {
                          v.pause();
                        }
                      }
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}

              {/* Pin Indicator */}
              {reel.isPinned && (
                <div className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-full bg-orange-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg border border-white/20">
                  <Zap size={12} fill="currentColor" />
                  <span>Pinned on Top</span>
                </div>
              )}

              {/* Mute/Play Overlays */}
              <AnimatePresence>
                {isMuted && activeIndex === index && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(false);
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-black/60 backdrop-blur-xl rounded-2xl p-4 cursor-pointer border border-white/10 shadow-2xl"
                  >
                    <div className="flex flex-col items-center gap-2">
                       <VolumeX size={24} className="text-white" />
                       <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white whitespace-nowrap">Tap for Sound</span>
                    </div>
                  </motion.div>
                )}
                {!isPlaying && activeIndex === index && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
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

      {/* Right Side Actions - Positioned vertically along the bottom right */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-6 text-white z-50">
        <button 
          onClick={(e) => { e.stopPropagation(); handleLikeWithFeedback(reel.id); }}
          className="flex flex-col items-center gap-1 group"
        >
          <motion.div 
            animate={reel.likes.includes(currentUser.uid) ? { scale: [1, 1.4, 1] } : {}}
            whileTap={{ scale: 0.8 }}
            className={`transition-all ${reel.likes.includes(currentUser.uid) ? 'text-orange-500' : 'text-white'}`}
          >
            <Heart size={32} className={reel.likes.includes(currentUser.uid) ? 'fill-current' : ''} />
          </motion.div>
          <span className="text-xs font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {reel.likes.length > 999 ? (reel.likes.length/1000).toFixed(1) + 'K' : reel.likes.length}
          </span>
        </button>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowComments(reel.id);
          }}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="text-white transition-all hover:text-orange-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            <MessageCircle size={32} />
          </div>
          <span className="text-xs font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {reel.comments.length > 999 ? (reel.comments.length/1000).toFixed(1) + 'K' : reel.comments.length}
          </span>
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); onShare(reel.id); }}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="text-white transition-all hover:text-orange-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            <Share2 size={32} />
          </div>
          <span className="text-xs font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{reel.shares || 0}</span>
        </button>

        <button className="flex flex-col items-center gap-1 group">
          <div className="text-white transition-all hover:text-orange-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            <Bookmark size={32} />
          </div>
          <span className="text-xs font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Save</span>
        </button>

        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMoreMenu(showMoreMenu === reel.id ? null : reel.id); }}
            className="text-white hover:text-orange-500 transition-all drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
          >
            <MoreVertical size={32} />
          </button>
          <AnimatePresence>
            {showMoreMenu === reel.id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                className="absolute right-full mr-2 bottom-0 bg-neutral-900/95 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-2xl min-w-[140px]"
              >
                {reel.authorId === currentUser.uid && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingReel({ id: reel.id, content: reel.content });
                        setShowMoreMenu(null);
                      }}
                      className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white hover:bg-orange-600 transition-all border-b border-white/5"
                    >
                      Edit Post
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this reel forever?')) {
                          onDelete?.(reel.id);
                        }
                        setShowMoreMenu(null);
                      }}
                      className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all border-b border-white/5"
                    >
                      Delete Reel
                    </button>
                  </>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onShare(reel.id); setShowMoreMenu(null); }}
                  className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white hover:bg-orange-600 transition-all border-b border-white/5"
                >
                  Share Link
                </button>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPinReel?.(reel.id, !reel.isPinned);
                      setShowMoreMenu(null);
                    }}
                    className={`w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest transition-all ${reel.isPinned ? 'text-red-500 hover:bg-red-500/10' : 'text-white hover:bg-orange-600'}`}
                  >
                    {reel.isPinned ? 'Unpin Reel' : 'Pin Reel'}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Info - Instagram/TikTok Style */}
      <div className="absolute bottom-0 left-0 right-14 p-4 md:p-6 text-white z-40 bg-gradient-to-t from-black/80 via-transparent to-transparent">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div 
              onClick={(e) => { e.stopPropagation(); onChat(users.find(u => u.uid === reel.authorId) || reel as any); }}
              className="h-10 w-10 overflow-hidden rounded-full border border-white/50 shadow-lg cursor-pointer hover:scale-105 transition-transform"
            >
              {reel.authorPhoto ? (
                <img src={reel.authorPhoto} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral-800">
                  <UserIcon size={20} className="text-neutral-500" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight drop-shadow-md hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); onChat(users.find(u => u.uid === reel.authorId) || reel as any); }}>
                  {reel.authorName}
                </span>
                {reel.authorVerified && <CheckCircle size={14} className="fill-blue-500 text-white" />}
                {reel.authorId !== currentUser.uid && !currentUser.following?.includes(reel.authorId) && (
                  <>
                    <span className="text-white/40 font-bold">•</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onFollow(reel.authorId); }}
                      className="text-xs font-black text-white hover:text-orange-500 transition-all drop-shadow-md"
                    >
                      Follow
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <p className="text-sm font-medium leading-relaxed drop-shadow-md line-clamp-3">
            {reel.content}
          </p>
          
          <div className="flex items-center gap-2 group cursor-pointer w-fit">
            <Music size={14} className="shrink-0 text-white animate-pulse" />
            <div className="overflow-hidden w-40">
              <motion.p 
                animate={{ x: [0, -200] }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap drop-shadow-md"
              >
                {reel.authorName} • Original Audio • STYN Music Africa
              </motion.p>
            </div>
          </div>

          {reel.isMovieTrailer && reel.authorId !== currentUser.uid && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                if (reel.movieId && onPurchaseMovie) {
                  onPurchaseMovie(reel.movieId, reel.moviePrice || 0);
                }
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600/90 backdrop-blur-md py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl border border-orange-400/20"
            >
              <Film size={18} />
              Full Movie Access
            </motion.button>
          )}
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

      {/* Upload Button - Visible on all devices within the reels container */}
      <div className="absolute bottom-6 right-6 z-50 md:bottom-10 md:right-10">
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-orange-600 text-white shadow-[0_20px_50px_rgba(234,88,12,0.4)] hover:scale-110 transition-all active:scale-95 ring-4 ring-black/20"
          title="Upload Video"
        >
          <Plus size={24} strokeWidth={3} className="md:w-8 md:h-8" />
        </button>
      </div>

      <UploadReel 
        isOpen={isUploadOpen || !!editingReel} 
        onClose={() => {
          setIsUploadOpen(false);
          setEditingReel(null);
        }} 
        onUpload={onUpload}
        onUpdate={onUpdateReel}
        initialData={editingReel || undefined}
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
