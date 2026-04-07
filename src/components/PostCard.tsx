import React from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, User, Zap, CheckCircle, X } from 'lucide-react';
import { Post, User as UserType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface PostCardProps {
  post: Post;
  currentUser: UserType | null;
  users: UserType[];
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onBoost?: (postId: string, price: number, duration: number) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, currentUser, users, onLike, onDelete, onComment, onBoost }) => {
  const [commentText, setCommentText] = React.useState('');
  const [showComments, setShowComments] = React.useState(false);
  const [showBoostModal, setShowBoostModal] = React.useState(false);
  const [boostPrice, setBoostPrice] = React.useState(5);
  const [boostDuration, setBoostDuration] = React.useState(24); // hours

  const author = users.find(u => u.uid === post.authorId);
  const authorPhoto = author?.photoURL || post.authorPhoto;
  const authorName = author?.displayName || post.authorName;
  const authorVerified = author?.isVerified || post.authorVerified;

  const isLiked = currentUser && post.likes.includes(currentUser.uid);
  const isAuthor = currentUser && post.authorId === currentUser.uid;
  const isAdmin = currentUser?.role === 'admin';

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
    }
  };

  const handleProfileClick = () => {
    window.dispatchEvent(new CustomEvent('viewProfile', { detail: post.authorId }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl ring-1 ring-neutral-200 transition-all hover:shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div 
            onClick={handleProfileClick}
            className="h-10 w-10 cursor-pointer overflow-hidden rounded-full bg-neutral-100 ring-2 ring-orange-100 transition-all hover:ring-orange-200"
          >
            {authorPhoto ? (
              <img src={authorPhoto} alt={authorName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-neutral-400">
                <User size={20} />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 
                onClick={handleProfileClick}
                className="cursor-pointer text-sm font-bold text-neutral-900 hover:text-orange-600 transition-colors"
              >
                {authorName}
              </h4>
              {authorVerified && <CheckCircle size={14} className="fill-blue-500 text-white" />}
              {(post.isSponsored || post.isBoosted) && (
                <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600 ring-1 ring-inset ring-orange-600/20">
                  <Zap size={10} fill="currentColor" />
                  {post.isSponsored ? 'SPONSORED' : 'BOOSTED'}
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              {post.createdAt ? formatDistanceToNow(post.createdAt.toDate()) + ' ago' : 'Just now'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAuthor && onBoost && !post.isBoosted && (
            <button 
              onClick={() => setShowBoostModal(true)}
              className="flex items-center gap-1.5 rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all active:scale-95"
            >
              <Zap size={12} fill="currentColor" />
              Boost
            </button>
          )}
          {(isAuthor || isAdmin) && (
            <button
              onClick={() => onDelete(post.id)}
              className="rounded-full p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 md:px-6 md:pb-6">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{post.content}</p>
      </div>

      {/* Media */}
      {post.mediaUrl && (
        <div className="relative aspect-video w-full overflow-hidden bg-neutral-100">
          {post.mediaType === 'image' ? (
            <img src={post.mediaUrl} alt="Post content" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <video src={post.mediaUrl} controls className="h-full w-full object-cover" />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-neutral-100 p-2 md:p-4">
        <div className="flex items-center gap-1 md:gap-2">
          <button 
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              isLiked ? 'bg-red-50 text-red-600' : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <Heart size={20} className={isLiked ? 'fill-current' : ''} />
            <span>{post.likes.length}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-neutral-600 transition-all hover:bg-neutral-50"
          >
            <MessageCircle size={20} />
            <span>{post.comments.length}</span>
          </button>
          <button className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-neutral-600 transition-all hover:bg-neutral-50">
            <Share2 size={20} />
            <span>{post.shares}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-neutral-100 bg-neutral-50/50"
          >
            <div className="p-4 md:p-6">
              <form onSubmit={handleCommentSubmit} className="mb-6 flex gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-neutral-200"></div>
                <input 
                  type="text" 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..." 
                  className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-900 focus:border-orange-600 focus:outline-none"
                />
              </form>
              <div className="space-y-4">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-neutral-200"></div>
                    <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-neutral-200">
                      <h5 className="mb-1 text-xs font-bold text-neutral-900">{comment.authorName}</h5>
                      <p className="text-xs leading-relaxed text-neutral-600">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Boost Modal */}
      <AnimatePresence>
        {showBoostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="bg-orange-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                      <Zap size={20} fill="currentColor" />
                    </div>
                    <h3 className="text-xl font-bold">Boost Your Post</h3>
                  </div>
                  <button onClick={() => setShowBoostModal(false)} className="rounded-full p-2 hover:bg-white/10 transition-all">
                    <X size={20} />
                  </button>
                </div>
                <p className="mt-2 text-sm text-orange-100">Reach more people and grow your audience.</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Suggest Price ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
                    <input 
                      type="number" 
                      value={boostPrice}
                      onChange={(e) => setBoostPrice(Number(e.target.value))}
                      className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3 pl-8 pr-4 text-sm font-bold focus:border-orange-600 focus:outline-none"
                      min="1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Duration (Hours)</label>
                  <select 
                    value={boostDuration}
                    onChange={(e) => setBoostDuration(Number(e.target.value))}
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-bold focus:border-orange-600 focus:outline-none"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={6}>6 Hours</option>
                    <option value={12}>12 Hours</option>
                    <option value={24}>24 Hours (1 Day)</option>
                    <option value={48}>48 Hours (2 Days)</option>
                    <option value={72}>72 Hours (3 Days)</option>
                    <option value={168}>168 Hours (1 Week)</option>
                  </select>
                </div>
                <div className="rounded-2xl bg-orange-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-neutral-600">Total Cost:</span>
                    <span className="text-lg font-black text-orange-600">${boostPrice.toFixed(2)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (onBoost) onBoost(post.id, boostPrice, boostDuration);
                    setShowBoostModal(false);
                  }}
                  className="w-full rounded-2xl bg-orange-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all active:scale-95"
                >
                  Confirm Boost
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
