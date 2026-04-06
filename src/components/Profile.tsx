import React from 'react';
import { Camera, MapPin, Briefcase, Calendar, Edit3, Loader2, User as UserIcon } from 'lucide-react';
import { User as UserType, Post } from '../types';
import { PostCard } from './PostCard';

interface ProfileProps {
  user: UserType;
  currentUser: UserType;
  posts: Post[];
  onUpdateProfile: (updates: Partial<UserType>) => Promise<void>;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ 
  user, 
  currentUser, 
  posts, 
  onUpdateProfile,
  onLike,
  onDelete,
  onComment
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(user.displayName);
  const [editBio, setEditBio] = React.useState(user.bio || '');
  const [loading, setLoading] = React.useState(false);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);

  const isOwnProfile = user.uid === currentUser.uid;
  const userPosts = posts.filter(p => p.authorId === user.uid);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdateProfile({
        displayName: editName,
        bio: editBio,
        photoURL: photoPreview || user.photoURL
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl pb-12">
      {/* Cover Photo */}
      <div className="relative h-48 w-full overflow-hidden rounded-b-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 shadow-lg md:h-64">
        {isOwnProfile && (
          <button className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-black/50 px-4 py-2 text-sm font-bold text-white backdrop-blur-md hover:bg-black/70 transition-all">
            <Camera size={18} />
            Edit Cover
          </button>
        )}
      </div>

      {/* Profile Info Header */}
      <div className="relative px-4 md:px-8">
        <div className="flex flex-col items-center md:flex-row md:items-end md:gap-6">
          {/* Profile Photo */}
          <div className="relative -mt-20 h-40 w-40 overflow-hidden rounded-full border-4 border-white bg-neutral-100 shadow-2xl md:-mt-24 md:h-48 md:w-48">
            {photoPreview || user.photoURL ? (
              <img 
                src={photoPreview || user.photoURL} 
                alt={user.displayName} 
                className="h-full w-full object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-neutral-400">
                <UserIcon size={80} />
              </div>
            )}
            {isOwnProfile && isEditing && (
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 text-white opacity-0 transition-opacity hover:opacity-100">
                <Camera size={32} />
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
              </label>
            )}
          </div>

          {/* Name & Actions */}
          <div className="mt-4 flex flex-1 flex-col items-center text-center md:mb-4 md:items-start md:text-left">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mb-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1 text-2xl font-bold text-neutral-900 focus:border-orange-600 focus:outline-none"
              />
            ) : (
              <h1 className="text-3xl font-bold text-neutral-900">{user.displayName}</h1>
            )}
            <p className="text-sm font-medium text-neutral-500">{user.friends.length} Friends</p>
          </div>

          <div className="mt-6 flex gap-2 md:mb-4">
            {isOwnProfile ? (
              isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setPhotoPreview(null); }}
                    className="rounded-xl bg-neutral-100 px-6 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-200 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 rounded-xl bg-neutral-100 px-6 py-2.5 text-sm font-bold text-neutral-900 hover:bg-neutral-200 transition-all active:scale-95"
                >
                  <Edit3 size={18} />
                  Edit Profile
                </button>
              )
            ) : (
              <button className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95">
                Add Friend
              </button>
            )}
          </div>
        </div>

        {/* Bio & Details */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Intro Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <h3 className="mb-4 text-lg font-bold text-neutral-900">Intro</h3>
              {isEditing ? (
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Describe yourself..."
                  className="mb-4 w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm focus:border-orange-600 focus:outline-none"
                  rows={3}
                />
              ) : (
                <p className="mb-4 text-center text-sm text-neutral-700 md:text-left">
                  {user.bio || "No bio yet. Add one to tell people about yourself!"}
                </p>
              )}
              
              <div className="space-y-3 border-t border-neutral-100 pt-4">
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <Briefcase size={18} className="text-neutral-400" />
                  <span>Works at <span className="font-bold text-neutral-900">STYN AFRICA</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <MapPin size={18} className="text-neutral-400" />
                  <span>Lives in <span className="font-bold text-neutral-900">Johannesburg, SA</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <Calendar size={18} className="text-neutral-400" />
                  <span>Joined <span className="font-bold text-neutral-900">April 2026</span></span>
                </div>
              </div>
            </div>

            {/* Photos Grid */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-900">Photos</h3>
                <button className="text-sm font-bold text-orange-600 hover:underline">See all</button>
              </div>
              <div className="grid grid-cols-3 gap-2 overflow-hidden rounded-xl">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-square bg-neutral-100 transition-all hover:opacity-80">
                    <img 
                      src={`https://picsum.photos/seed/${user.uid + i}/200`} 
                      alt="Gallery" 
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Posts */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {userPosts.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
                  <p className="text-neutral-500">No posts on this timeline yet.</p>
                </div>
              ) : (
                userPosts.map(post => (
                  <PostCard 
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onLike={onLike}
                    onDelete={onDelete}
                    onComment={onComment}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
