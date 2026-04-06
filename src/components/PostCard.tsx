import React from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, User } from 'lucide-react';
import { Post } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post;
  currentUser: any;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, currentUser, onLike, onDelete, onComment }) => {
  const [commentText, setCommentText] = React.useState('');
  const [showComments, setShowComments] = React.useState(false);

  const isLiked = post.likes.includes(currentUser?.uid || '');
  const isAuthor = post.authorId === currentUser?.uid;
  const isAdmin = currentUser?.role === 'admin';

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
    }
  };

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {post.authorPhoto ? (
            <img src={post.authorPhoto} alt={post.authorName} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
              <User size={20} />
            </div>
          )}
          <div>
            <h4 className="text-sm font-bold text-neutral-900">{post.authorName}</h4>
            <p className="text-xs text-neutral-500">
              {post.createdAt ? formatDistanceToNow(post.createdAt.toDate()) + ' ago' : 'Just now'}
            </p>
          </div>
        </div>
        {(isAuthor || isAdmin) && (
          <button
            onClick={() => onDelete(post.id)}
            className="rounded-full p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-all"
            title="Delete Post"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{post.content}</p>
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
      <div className="flex items-center gap-6 border-t border-neutral-100 p-3 px-4">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-2 text-sm font-medium transition-all ${
            isLiked ? 'text-red-600' : 'text-neutral-500 hover:text-red-600'
          }`}
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          {post.likes.length > 0 && <span>{post.likes.length}</span>}
          <span className="hidden sm:inline">Like</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-orange-600 transition-all"
        >
          <MessageCircle size={20} />
          {post.comments.length > 0 && <span>{post.comments.length}</span>}
          <span className="hidden sm:inline">Comment</span>
        </button>
        <button className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-blue-600 transition-all">
          <Share2 size={20} />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-neutral-100 bg-neutral-50 p-4">
          {/* Comment List */}
          <div className="mb-4 space-y-3">
            {post.comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-500">
                  <User size={14} />
                </div>
                <div className="rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-neutral-200">
                  <p className="text-xs font-bold text-neutral-900">{comment.authorName}</p>
                  <p className="text-sm text-neutral-700">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm focus:border-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-600"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
