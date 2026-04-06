import React from 'react';
import { Image, Video, Send, Loader2, User, Plus, Sparkles, TrendingUp } from 'lucide-react';
import { PostCard } from './PostCard';
import { Post } from '../types';
import { motion } from 'framer-motion';

interface FeedProps {
  posts: Post[];
  currentUser: any;
  onPost: (content: string, mediaFile?: File) => Promise<void>;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onBoost?: (postId: string) => void;
}

export const Feed: React.FC<FeedProps> = ({ posts, currentUser, onPost, onLike, onDelete, onComment, onBoost }) => {
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Mock stories for UI demonstration
  const stories = [
    { id: '1', name: 'Your Story', image: currentUser?.photoURL, isUser: true },
    { id: '2', name: 'Sarah', image: 'https://picsum.photos/seed/sarah/200/300' },
    { id: '3', name: 'John', image: 'https://picsum.photos/seed/john/200/300' },
    { id: '4', name: 'Emma', image: 'https://picsum.photos/seed/emma/200/300' },
    { id: '5', name: 'Mike', image: 'https://picsum.photos/seed/mike/200/300' },
    { id: '6', name: 'Anna', image: 'https://picsum.photos/seed/anna/200/300' },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Stories Bar */}
      <div className="mb-8 flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {stories.map((story) => (
          <div key={story.id} className="flex flex-col items-center gap-2 shrink-0">
            <div className={`relative h-16 w-16 rounded-full p-0.5 ${story.isUser ? 'bg-neutral-200' : 'bg-gradient-to-tr from-orange-500 to-pink-500'}`}>
              <div className="h-full w-full overflow-hidden rounded-full border-2 border-white bg-neutral-100">
                {story.image ? (
                  <img src={story.image} alt={story.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-400">
                    <User size={24} />
                  </div>
                )}
              </div>
              {story.isUser && (
                <div className="absolute bottom-0 right-0 rounded-full bg-orange-600 p-1 text-white ring-2 ring-white">
                  <Plus size={12} />
                </div>
              )}
            </div>
            <span className="text-[10px] font-bold text-neutral-600">{story.name}</span>
          </div>
        ))}
      </div>

      {/* Create Post */}
      <div className="mb-8 rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-xl ring-1 ring-neutral-200">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 shadow-inner">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt={currentUser.displayName} className="h-full w-full rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={24} />
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex-1 space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's on your mind, ${currentUser?.displayName?.split(' ')[0]}?`}
              className="w-full resize-none border-none bg-transparent text-lg placeholder-neutral-400 focus:outline-none focus:ring-0"
              rows={2}
            />
            
            {mediaPreview && (
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-neutral-100 shadow-inner">
                {mediaFile?.type.startsWith('image') ? (
                  <img src={mediaPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <video src={mediaPreview} className="h-full w-full object-cover" />
                )}
                <button
                  onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                  className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white backdrop-blur-md hover:bg-black/70 transition-all"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
              <div className="flex gap-1">
                <label className="flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all">
                  <Image size={20} className="text-green-500" />
                  <span className="hidden sm:inline">Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleMediaChange} />
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all">
                  <Video size={20} className="text-blue-500" />
                  <span className="hidden sm:inline">Video</span>
                  <input type="file" accept="video/*" className="hidden" onChange={handleMediaChange} />
                </label>
              </div>
              <button
                type="submit"
                disabled={loading || (!content.trim() && !mediaFile)}
                className="flex items-center gap-2 rounded-full bg-orange-600 px-8 py-2.5 text-sm font-bold text-white shadow-xl shadow-orange-600/20 hover:bg-orange-700 disabled:opacity-50 active:scale-95 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Post Now'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Trending Section (Optional UI element) */}
      <div className="mb-8 flex items-center gap-4 rounded-2xl bg-orange-50 p-4 text-orange-700">
        <TrendingUp size={20} />
        <span className="text-sm font-bold">Trending in Africa: #STYN #SocialSuperApp #TechInnovation</span>
      </div>

      {/* Post List */}
      <div className="space-y-8">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
              <Sparkles size={40} />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Your feed is empty</h3>
            <p className="text-neutral-500">Follow more people to see what's happening!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onLike={onLike}
              onDelete={onDelete}
              onComment={onComment}
              onBoost={onBoost}
            />
          ))
        )}
      </div>
    </div>
  );
};
