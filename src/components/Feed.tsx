import React from 'react';
import { Image, Video, Send, Loader2, User, Plus, Sparkles, TrendingUp } from 'lucide-react';
import { PostCard } from './PostCard';
import { Post } from '../types';
import { motion } from 'motion/react';

interface FeedProps {
  posts: Post[];
  currentUser: any;
  users: any[];
  onPost: (content: string, mediaFile?: File) => Promise<void>;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onBoost?: (postId: string, price: number, duration: number) => void;
  onFollow: (uid: string) => void;
  onShare: (postId: string) => void;
  onReelUploadClick?: () => void;
  ads?: any[];
}

export const Feed: React.FC<FeedProps> = ({ posts, currentUser, users, onPost, onLike, onDelete, onComment, onBoost, onFollow, onShare, onReelUploadClick, ads = [] }) => {
  const [content, setContent] = React.useState('');
  const [mediaFile, setMediaFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [mediaPreview, setMediaPreview] = React.useState<string | null>(null);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) return;
    setLoading(true);
    try {
      await onPost(content, mediaFile || undefined);
      setContent('');
      setMediaFile(null);
      setMediaPreview(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Sponsored Section */}
      {ads.length > 0 ? (
        ads.map((ad) => (
          <div key={ad.id} className="mb-8 rounded-[2rem] border border-white/5 bg-neutral-900 p-6 shadow-xl ring-1 ring-white/5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white shadow-lg shadow-orange-900/20">
                  <Sparkles size={16} />
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-white">Sponsored Content</span>
              </div>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Ad</span>
            </div>
            <div className="flex gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-neutral-800 shadow-inner">
                <img src={ad.imageUrl} alt={ad.title} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="text-sm font-bold text-white">{ad.title}</h4>
                <p className="text-xs leading-relaxed text-neutral-400">{ad.description}</p>
                <a 
                  href={ad.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full bg-orange-600 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="mb-8 rounded-[2rem] border border-white/5 bg-neutral-900 p-6 shadow-xl ring-1 ring-white/5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white shadow-lg shadow-orange-900/20">
                <Sparkles size={16} />
              </div>
              <span className="text-sm font-black uppercase tracking-widest text-white">Sponsored Content</span>
            </div>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Ad</span>
          </div>
          <div className="flex gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-neutral-800 shadow-inner">
              <img src="https://picsum.photos/seed/ad/200/200" alt="Ad" className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-bold text-white">Upgrade to STYN Platinum Today!</h4>
              <p className="text-xs leading-relaxed text-neutral-400">Get verified, boost your posts, and reach millions across Africa. Limited time offer: 50% off your first month.</p>
              <button 
                onClick={() => onBoost?.('upgrade')}
                className="rounded-full bg-orange-600 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Post */}
      <div className="mb-8 rounded-2xl border border-white/5 bg-neutral-900 p-4 shadow-sm ring-1 ring-white/5">
        <div className="flex gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-800 shadow-inner">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt={currentUser.displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-neutral-500">
                <User size={20} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div 
              onClick={() => {}} // Could open a full modal if needed
              className="flex h-10 w-full cursor-pointer items-center rounded-full bg-neutral-800 px-4 text-sm text-neutral-400 hover:bg-neutral-700 transition-all"
            >
              What's on your mind, {currentUser?.displayName?.split(' ')[0]}?
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-around border-t border-white/5 pt-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-neutral-400 hover:bg-neutral-800 transition-all">
            <Image size={20} className="text-green-500" />
            <span>Photo/video</span>
            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaChange} />
          </label>
          <button 
            onClick={() => onReelUploadClick?.()}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-neutral-400 hover:bg-neutral-800 transition-all"
          >
            <Video size={20} className="text-pink-500" />
            <span>Reel</span>
          </button>
          <button className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-neutral-400 hover:bg-neutral-800 transition-all">
            <Video size={20} className="text-red-500" />
            <span>Live video</span>
          </button>
        </div>

        {/* Hidden Form for actual submission if media is selected or user starts typing */}
        {(content || mediaFile) && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-white/5 pt-4">
            <textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell us more..."
              className="w-full resize-none border-none bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-0"
              rows={3}
            />
            
            {mediaPreview && (
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-neutral-800 shadow-inner">
                {mediaFile?.type.startsWith('image') ? (
                  <img src={mediaPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <video src={mediaPreview} className="h-full w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                  className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white backdrop-blur-md hover:bg-black/70 transition-all"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || (!content.trim() && !mediaFile)}
                className="flex items-center gap-2 rounded-full bg-orange-600 px-8 py-2 text-sm font-bold text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700 disabled:opacity-50 active:scale-95 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Post'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Trending Section */}
      <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/5 bg-neutral-900 shadow-xl ring-1 ring-white/5">
        <div className="flex items-center gap-3 border-b border-white/5 bg-neutral-950/50 px-6 py-4">
          <TrendingUp size={20} className="text-orange-500" />
          <h3 className="text-sm font-black uppercase tracking-widest text-white">Viral Hashtags</h3>
        </div>
        <div className="flex flex-wrap gap-2 p-6">
          {['#STYN', '#SocialSuperApp', '#Viral', '#TrendingNow', '#TechInnovation', '#AfricaRising', '#UniqueExperience'].map((tag) => (
            <button 
              key={tag}
              onClick={() => setContent(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + tag)}
              className="rounded-full bg-neutral-800 px-4 py-2 text-xs font-bold text-neutral-400 transition-all hover:bg-orange-600 hover:text-white active:scale-95"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Post List */}
      <div className="space-y-8">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 text-neutral-700 border border-white/5">
              <Sparkles size={40} />
            </div>
            <h3 className="text-lg font-bold text-white">Your feed is empty</h3>
            <p className="text-neutral-500">Follow more people to see what's happening!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              users={users}
              onLike={onLike}
              onDelete={onDelete}
              onComment={onComment}
              onBoost={onBoost}
              onFollow={onFollow}
              onShare={onShare}
            />
          ))
        )}
      </div>
    </div>
  );
};
