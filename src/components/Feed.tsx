import React from 'react';
import { Image, Video, Send, Loader2, User } from 'lucide-react';
import { PostCard } from './PostCard';
import { Post } from '../types';

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Create Post */}
      <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm ring-1 ring-neutral-200">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt={currentUser.displayName} className="h-full w-full rounded-full" />
            ) : (
              <User size={20} />
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex-1 space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's on your mind, ${currentUser?.displayName?.split(' ')[0]}?`}
              className="w-full resize-none border-none bg-transparent text-lg placeholder-neutral-400 focus:outline-none focus:ring-0"
              rows={3}
            />
            
            {mediaPreview && (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-100">
                {mediaFile?.type.startsWith('image') ? (
                  <img src={mediaPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <video src={mediaPreview} className="h-full w-full object-cover" />
                )}
                <button
                  onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                >
                  <Send size={16} className="rotate-45" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
              <div className="flex gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-all">
                  <Image size={20} className="text-green-600" />
                  Photo
                  <input type="file" accept="image/*" className="hidden" onChange={handleMediaChange} />
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-all">
                  <Video size={20} className="text-blue-600" />
                  Video
                  <input type="file" accept="video/*" className="hidden" onChange={handleMediaChange} />
                </label>
              </div>
              <button
                type="submit"
                disabled={loading || (!content.trim() && !mediaFile)}
                className="flex items-center gap-2 rounded-full bg-orange-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-200 hover:bg-orange-700 disabled:opacity-50 active:scale-95 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Post'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Post List */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-500">No posts yet. Be the first to share something!</p>
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
