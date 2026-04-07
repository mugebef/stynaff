import React from 'react';
import { Camera, MapPin, Briefcase, Calendar, Edit3, Loader2, User as UserIcon, CheckCircle, Wallet as WalletIcon, Shield, Award, Medal, Trophy, Crown, ShieldAlert, UserPlus, MessageSquare } from 'lucide-react';
import { User as UserType, Post } from '../types';
import { PostCard } from './PostCard';

const TierIcon = ({ tier, size = 16 }: { tier: string, size?: number }) => {
  switch (tier) {
    case 'Bronze': return <Award size={size} className="text-orange-400" />;
    case 'Silver': return <Medal size={size} className="text-neutral-400" />;
    case 'Gold': return <Trophy size={size} className="text-yellow-500" />;
    case 'Platinum': return <Crown size={size} className="text-indigo-400" />;
    default: return <Shield size={size} className="text-neutral-400" />;
  }
};

interface ProfileProps {
  user: UserType;
  currentUser: UserType;
  posts: Post[];
  onUpdateProfile: (updates: Partial<UserType>) => Promise<void>;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onSendFriendRequest: (targetUid: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ 
  user, 
  currentUser, 
  posts, 
  onUpdateProfile,
  onLike,
  onDelete,
  onComment,
  onSendFriendRequest
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(user.displayName);
  const [editBio, setEditBio] = React.useState(user.bio || '');
  const [editAge, setEditAge] = React.useState(user.age || '');
  const [editCity, setEditCity] = React.useState(user.location?.city || '');
  const [editCountry, setEditCountry] = React.useState(user.location?.country || '');
  const [editGender, setEditGender] = React.useState(user.gender || 'Male');
  const [loading, setLoading] = React.useState(false);
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);

  const isOwnProfile = user.uid === currentUser.uid;
  const isAdmin = currentUser.role === 'admin';
  const canEdit = isOwnProfile || isAdmin;
  const userPosts = posts.filter(p => p.authorId === user.uid);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
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
      let finalPhotoURL = user.photoURL;

      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        finalPhotoURL = data.url;
      }

      await onUpdateProfile({
        displayName: editName,
        bio: editBio,
        age: Number(editAge),
        gender: editGender as any,
        location: {
          city: editCity,
          country: editCountry
        },
        photoURL: finalPhotoURL
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
        {canEdit && (
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
              <div className={`flex h-full w-full items-center justify-center ${user.gender === 'Female' ? 'bg-pink-50 text-pink-400' : 'bg-blue-50 text-blue-400'}`}>
                <UserIcon size={80} />
              </div>
            )}
            {canEdit && isEditing && (
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 text-white opacity-0 transition-opacity hover:opacity-100">
                <Camera size={32} />
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
              </label>
            )}
          </div>

          {/* Name & Actions */}
          <div className="mt-4 flex flex-1 flex-col items-center text-center md:mb-4 md:items-start md:text-left">
            <div className="flex items-center gap-2">
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
              {user.isVerified && <CheckCircle size={24} className="fill-blue-500 text-white" />}
            </div>
            <div className="flex items-center gap-4 text-sm font-bold text-neutral-500">
              <span>{user.friends?.length || 0} Friends</span>
              <span>•</span>
              <span>{user.followers?.length || 0} Followers</span>
              <span>•</span>
              <span>{userPosts.length} Posts</span>
              <span>•</span>
              <div className="flex items-center gap-1 text-orange-600">
                <TierIcon tier={user.tier} size={14} />
                <span>{user.tier}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2 md:mb-4 md:justify-start">
            {canEdit ? (
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
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 rounded-xl bg-neutral-100 px-6 py-2.5 text-sm font-bold text-neutral-900 hover:bg-neutral-200 transition-all active:scale-95"
                  >
                    <Edit3 size={18} />
                    Edit Profile
                  </button>
                  {isOwnProfile && (
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('changeMenu', { detail: 'wallet' }))}
                      className="flex items-center gap-2 rounded-xl bg-orange-50 px-6 py-2.5 text-sm font-bold text-orange-600 hover:bg-orange-100 transition-all active:scale-95"
                    >
                      <WalletIcon size={18} />
                      Wallet
                    </button>
                  )}
                  {isAdmin && !isOwnProfile && (
                    <>
                      <button
                        onClick={() => onUpdateProfile({ isVerified: !user.isVerified })}
                        className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all active:scale-95 ${
                          user.isVerified 
                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                            : 'bg-neutral-900 text-white hover:bg-black'
                        }`}
                      >
                        <CheckCircle size={18} />
                        {user.isVerified ? 'Unverify' : 'Verify User'}
                      </button>
                      <button
                        onClick={() => onUpdateProfile({ role: user.role === 'admin' ? 'user' : 'admin' })}
                        className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all active:scale-95 ${
                          user.role === 'admin' 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {user.role === 'admin' ? <ShieldAlert size={18} /> : <UserPlus size={18} />}
                        {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    </>
                  )}
                </div>
              )
            ) : (
              <div className="flex flex-wrap gap-2">
                {currentUser.friends?.includes(user.uid) ? (
                  <button className="flex items-center gap-2 rounded-xl bg-green-50 px-6 py-2.5 text-sm font-bold text-green-600 ring-1 ring-inset ring-green-600/20">
                    <CheckCircle size={18} />
                    Friends
                  </button>
                ) : user.friendRequests?.includes(currentUser.uid) ? (
                  <button className="flex items-center gap-2 rounded-xl bg-neutral-100 px-6 py-2.5 text-sm font-bold text-neutral-500">
                    <Loader2 className="animate-spin" size={18} />
                    Request Sent
                  </button>
                ) : (
                  <button 
                    onClick={() => onSendFriendRequest(user.uid)}
                    className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95"
                  >
                    <UserPlus size={18} />
                    Add Friend
                  </button>
                )}
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('changeMenu', { 
                    detail: 'chat',
                    targetUser: user 
                  } as any))}
                  className="flex items-center gap-2 rounded-xl bg-neutral-100 px-6 py-2.5 text-sm font-bold text-neutral-900 hover:bg-neutral-200 transition-all active:scale-95"
                >
                  <MessageSquare size={18} />
                  Message
                </button>
              </div>
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
                  <Calendar size={18} className="text-neutral-400" />
                  <span>Age: <span className="font-bold text-neutral-900">{user.age || 'Not set'}</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <UserIcon size={18} className="text-neutral-400" />
                  <span>Gender: {isEditing ? (
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value as any)}
                      className="ml-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-bold text-neutral-900 focus:border-orange-600 focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <span className="font-bold text-neutral-900">{user.gender || 'Not set'}</span>
                  )}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <MapPin size={18} className="text-neutral-400" />
                  <span>Lives in <span className="font-bold text-neutral-900">{user.location?.city || 'City'}, {user.location?.country || 'Country'}</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <Calendar size={18} className="text-neutral-400" />
                  <span>Joined <span className="font-bold text-neutral-900">April 2026</span></span>
                </div>
              </div>
              {isEditing && (
                <div className="mt-4 space-y-4 border-t border-neutral-100 pt-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-500">Age</label>
                    <input 
                      type="number" 
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-orange-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-500">City</label>
                    <input 
                      type="text" 
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-orange-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-500">Country</label>
                    <input 
                      type="text" 
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-orange-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}
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
