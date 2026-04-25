import React from 'react';
import { Camera, MapPin, Briefcase, Calendar, Edit3, Loader2, User as UserIcon, CheckCircle, Wallet as WalletIcon, Shield, Award, Medal, Trophy, Crown, ShieldAlert, UserPlus, MessageSquare, Lock, Settings, Star, Info, Trash2, Heart, X, Maximize2, Zap, ArrowLeft } from 'lucide-react';
import { User as UserType, Post } from '../types';
import { PostCard } from './PostCard';
import { COUNTRIES_AND_CITIES, RELATIONSHIP_STATUSES } from '../constants';
import { ImageCropper } from './ImageCropper';
import { getCroppedImg } from '../lib/canvasUtils';
import { motion, AnimatePresence } from 'motion/react';

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
  users: UserType[];
  posts: Post[];
  onUpdateProfile: (updates: Partial<UserType>) => Promise<void>;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onBoost?: (postId: string, price: number, duration: number) => void;
  onSendFriendRequest: (targetUid: string) => void;
  onAcceptFriend: (uid: string) => void;
  onDeclineFriend: (uid: string) => void;
  onCancelFriendRequest: (uid: string) => void;
  onUnfriend: (uid: string) => void;
  onFollow: (uid: string) => void;
  onBack?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ 
  user, 
  currentUser, 
  users,
  posts, 
  onUpdateProfile,
  onLike,
  onDelete,
  onComment,
  onBoost,
  onSendFriendRequest,
  onAcceptFriend,
  onDeclineFriend,
  onCancelFriendRequest,
  onUnfriend,
  onFollow,
  onBack
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'Account' | 'Profile' | 'Privacy' | 'Security' | 'Membership' | 'Extra'>('Account');
  
  // Form state
  const [editName, setEditName] = React.useState(user.displayName);
  const [editUsername, setEditUsername] = React.useState(user.username || '');
  const [editEmail, setEditEmail] = React.useState(user.email);
  const [editBio, setEditBio] = React.useState(user.bio || '');
  const [editAge, setEditAge] = React.useState(user.age || '');
  const [editCity, setEditCity] = React.useState(user.location?.city || '');
  const [editCountry, setEditCountry] = React.useState(user.location?.country || '');
  const [editGender, setEditGender] = React.useState(user.gender || 'Male');
  const [editRelationship, setEditRelationship] = React.useState(user.relationshipStatus || 'Single');
  
  // Admin fields (if current user is admin)
  const [editVerified, setEditVerified] = React.useState(user.isVerified);
  const [editBanned, setEditBanned] = React.useState(user.banned || false);
  const [editBanMessage, setEditBanMessage] = React.useState(user.banMessage || '');
  const [editActivated, setEditActivated] = React.useState(user.isActivated ?? true);
  const [editGettingStarted, setEditGettingStarted] = React.useState(user.gettingStarted || false);
  const [editDemo, setEditDemo] = React.useState(user.isDemo || false);
  const [editRole, setEditRole] = React.useState(user.role);
  
  const [loading, setLoading] = React.useState(false);
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [isCropping, setIsCropping] = React.useState(false);
  const [isPhotoZoomed, setIsPhotoZoomed] = React.useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<any>(null);

  const isOwnProfile = user.uid === currentUser.uid;
  const isAdmin = currentUser.role === 'admin';
  const isFollowing = currentUser.following?.includes(user.uid);
  const canEdit = isOwnProfile || isAdmin;
  const userPosts = posts.filter(p => p.authorId === user.uid);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
      setIsCropping(true);
    }
  };

  const handleCropComplete = async () => {
    if (photoPreview && croppedAreaPixels) {
      try {
        const croppedBlob = await getCroppedImg(photoPreview, croppedAreaPixels);
        if (croppedBlob) {
          const croppedFile = new File([croppedBlob], photoFile?.name || 'profile.jpg', { type: 'image/jpeg' });
          setPhotoFile(croppedFile);
          setPhotoPreview(URL.createObjectURL(croppedBlob));
          setIsCropping(false);
        }
      } catch (e) {
        console.error(e);
      }
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

      const updates: Partial<UserType> = {
        displayName: editName,
        username: editUsername,
        email: editEmail,
        bio: editBio,
        age: Number(editAge),
        gender: editGender as any,
        relationshipStatus: editRelationship as any,
        location: {
          city: editCity,
          country: editCountry
        },
        photoURL: finalPhotoURL
      };

      if (isAdmin) {
        updates.isVerified = editVerified;
        updates.banned = editBanned;
        updates.banMessage = editBanMessage;
        updates.isActivated = editActivated;
        updates.gettingStarted = editGettingStarted;
        updates.isDemo = editDemo;
        updates.role = editRole;
      }

      await onUpdateProfile(updates);
      setIsEditing(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'Account', icon: <Settings size={16} /> },
    { id: 'Profile', icon: <UserIcon size={16} /> },
    { id: 'Privacy', icon: <Lock size={16} /> },
    { id: 'Security', icon: <Shield size={16} /> },
    { id: 'Membership', icon: <Star size={16} /> },
    { id: 'Extra', icon: <Info size={16} /> },
  ];

  return (
    <div className="mx-auto max-w-4xl pb-12 relative">
      <AnimatePresence>
        {isCropping && photoPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-10"
          >
            <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-neutral-900 shadow-2xl border border-white/5">
              <div className="flex items-center justify-between border-b border-white/5 p-6">
                <h3 className="text-xl font-black text-white">Adjust Photo Zoom</h3>
                <button onClick={() => setIsCropping(false)} className="text-neutral-500 hover:text-white transition-all">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <ImageCropper 
                  image={photoPreview} 
                  aspect={1}
                  onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                />
                <button
                  type="button"
                  onClick={handleCropComplete}
                  className="mt-6 w-full rounded-2xl bg-orange-600 py-4 font-black uppercase tracking-widest text-white shadow-xl shadow-orange-900/40 hover:bg-orange-700 transition-all active:scale-95"
                >
                  Save Selection
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPhotoZoomed && (user.photoURL || photoPreview) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-10"
            onClick={() => setIsPhotoZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-h-full max-w-full overflow-hidden rounded-[3rem] shadow-2xl ring-1 ring-white/10"
            >
              <img 
                src={photoPreview || user.photoURL} 
                alt={user.displayName} 
                className="max-h-[80vh] w-auto rounded-[3rem] object-contain shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={(e) => { e.stopPropagation(); setIsPhotoZoomed(false); }}
                className="absolute right-6 top-6 rounded-full bg-black/60 p-4 text-white backdrop-blur-md hover:bg-white/10 transition-all border border-white/10"
              >
                <X size={28} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Cover Photo */}
      <div className="relative h-48 w-full overflow-hidden rounded-b-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 shadow-lg md:h-64">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-all border border-white/10 shadow-2xl"
          >
            <ArrowLeft size={20} strokeWidth={3} />
          </button>
        )}
        {canEdit && (
          <button className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-black/50 px-4 py-2 text-sm font-bold text-white backdrop-blur-md hover:bg-black/70 transition-all">
            <Camera size={18} />
            Edit Cover
          </button>
        )}
      </div>

      {/* Profile Info Header */}
      <div className="relative px-4 md:px-10">
        <div className="flex flex-col items-center md:flex-row md:items-end md:gap-8">
          {/* Profile Photo */}
          <div 
            className="relative -mt-16 h-32 w-32 md:-mt-32 md:h-56 md:w-56 overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border-4 md:border-8 border-neutral-950 bg-neutral-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] group cursor-pointer"
            onClick={() => !isEditing && setIsPhotoZoomed(true)}
          >
            {photoPreview || user.photoURL ? (
              <img 
                src={photoPreview || user.photoURL} 
                alt={user.displayName} 
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`flex h-full w-full items-center justify-center ${user.gender === 'Female' ? 'bg-pink-500/10 text-pink-500' : 'bg-blue-500/10 text-blue-500'}`}>
                <UserIcon size={100} />
              </div>
            )}
            {canEdit && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 size={32} className="text-white" />
              </div>
            )}
            {canEdit && isEditing && (
              <label 
                className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/60 text-white opacity-0 transition-opacity hover:opacity-100 backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Camera size={40} />
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
              </label>
            )}
          </div>

          {/* Name & Actions */}
          <div className="mt-4 flex flex-1 flex-col items-center text-center md:mt-6 md:mb-6 md:items-start md:text-left">
            <div className="flex items-center gap-3 mb-1 md:mb-2">
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase">{user.displayName}</h1>
              {user.isVerified && <CheckCircle size={20} md:size={24} className="fill-blue-500 text-white shrink-0" />}
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-[10px] md:text-sm font-black text-neutral-500 uppercase tracking-widest leading-none">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-[8px] md:text-[10px] text-neutral-600 mb-0.5 md:mb-1">STYN ID</span>
                <span className="text-white tracking-tighter">#{user.uid.slice(0, 8)}</span>
              </div>
              <div className="h-6 w-px bg-white/5 hidden md:block"></div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-[8px] md:text-[10px] text-neutral-600 mb-0.5 md:mb-1">Friends</span>
                <span className="text-white tracking-tighter">{user.friends?.length || 0}</span>
              </div>
              <div className="h-6 w-px bg-white/5 hidden md:block"></div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-[8px] md:text-[10px] text-neutral-600 mb-0.5 md:mb-1">Followers</span>
                <span className="text-white tracking-tighter">{user.followers?.length || 0}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3 md:mb-6 md:justify-start">
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-3 rounded-2xl bg-orange-600 px-10 py-4 text-xs font-black uppercase tracking-widest text-white shadow-[0_20px_40px_-10px_rgba(234,88,12,0.4)] hover:bg-orange-700 transition-all active:scale-95"
              >
                <Edit3 size={18} strokeWidth={3} />
                Edit Profile
              </button>
            )}
            {!isOwnProfile && !isEditing && (
              <div className="flex flex-wrap justify-center gap-3">
                {!isFollowing && (
                  <button 
                    onClick={() => onFollow(user.uid)}
                    className="flex items-center gap-3 rounded-2xl bg-orange-600 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-[0_20px_40px_-10px_rgba(234,88,12,0.4)] hover:bg-orange-700 transition-all active:scale-95"
                  >
                    <UserPlus size={18} strokeWidth={3} />
                    Follow
                  </button>
                )}
                {currentUser.friends?.includes(user.uid) ? (
                  <button 
                    onClick={() => onUnfriend(user.uid)}
                    className="flex items-center gap-3 rounded-2xl bg-green-500/10 px-8 py-4 text-xs font-black uppercase tracking-widest text-green-500 border border-green-500/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all"
                  >
                    <CheckCircle size={18} strokeWidth={3} />
                    Friends
                  </button>
                ) : currentUser.sentRequests?.includes(user.uid) ? (
                  <button 
                    onClick={() => onCancelFriendRequest(user.uid)}
                    className="flex items-center gap-3 rounded-2xl bg-neutral-900 px-8 py-4 text-xs font-black uppercase tracking-widest text-neutral-400 border border-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all"
                  >
                    <Loader2 className="animate-spin" size={18} strokeWidth={3} />
                    Pending
                  </button>
                ) : currentUser.friendRequests?.includes(user.uid) ? (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => onAcceptFriend(user.uid)}
                      className="flex items-center gap-3 rounded-2xl bg-orange-600 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-[0_20px_40px_-10px_rgba(234,88,12,0.4)] hover:bg-orange-700 transition-all active:scale-95"
                    >
                      <UserPlus size={18} strokeWidth={3} />
                      Accept
                    </button>
                    <button 
                      onClick={() => onDeclineFriend(user.uid)}
                      className="flex items-center gap-3 rounded-2xl bg-neutral-900 px-8 py-4 text-xs font-black uppercase tracking-widest text-neutral-400 border border-white/5 hover:bg-neutral-800 transition-all active:scale-95"
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => onSendFriendRequest(user.uid)}
                    className="flex items-center gap-3 rounded-2xl bg-orange-600 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-[0_20px_40px_-10px_rgba(234,88,12,0.4)] hover:bg-orange-700 transition-all active:scale-95"
                  >
                    <UserPlus size={18} strokeWidth={3} />
                    Add Friend
                  </button>
                )}
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('changeMenu', { 
                    detail: { menu: 'chat', targetUser: user }
                  }))}
                  className="flex items-center gap-3 rounded-2xl bg-neutral-900 px-8 py-4 text-xs font-black uppercase tracking-widest text-neutral-200 border border-white/5 hover:bg-neutral-800 transition-all active:scale-95"
                >
                  <MessageSquare size={18} strokeWidth={3} />
                  {user.uid.startsWith('fake_') ? 'Chat with AI' : 'Message'}
                </button>
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="mt-8 space-y-6">
            {/* Stats Boxes */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/5 bg-neutral-900 p-4 shadow-sm ring-1 ring-white/5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-neutral-500">User ID</span>
                    <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-black text-neutral-400">{user.uid.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-neutral-500">Joined</span>
                    <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-black text-neutral-400">
                      {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : '8 July 2025'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-500">Last Login</span>
                    <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-black text-neutral-400">
                      {user.lastLoginAt ? new Date(user.lastLoginAt.toDate()).toLocaleDateString() : '9 March 2026'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-neutral-900 p-4 shadow-sm ring-1 ring-white/5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-neutral-500">Friends</span>
                    <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-black text-neutral-400">{user.friends?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-neutral-500">Followings</span>
                    <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-black text-neutral-400">{user.following?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-500">Followers</span>
                    <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-black text-neutral-400">{user.followers?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-neutral-900 shadow-xl ring-1 ring-white/5 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-white/5 bg-neutral-950/50 overflow-x-auto scrollbar-hide">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'border-b-2 border-orange-600 bg-neutral-900 text-orange-500' 
                        : 'text-neutral-500 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    {tab.id}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-8 space-y-6">
                {activeTab === 'Account' && (
                  <div className="space-y-6">
                    {isAdmin && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-neutral-300">Verified User</span>
                          <button 
                            onClick={() => setEditVerified(!editVerified)}
                            className={`relative h-6 w-11 rounded-full transition-colors ${editVerified ? 'bg-orange-600' : 'bg-neutral-800'}`}
                          >
                            <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${editVerified ? 'translate-x-5' : ''}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-neutral-300">Banned</span>
                          <button 
                            onClick={() => setEditBanned(!editBanned)}
                            className={`relative h-6 w-11 rounded-full transition-colors ${editBanned ? 'bg-red-600' : 'bg-neutral-800'}`}
                          >
                            <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${editBanned ? 'translate-x-5' : ''}`} />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Ban Message</label>
                          <textarea 
                            value={editBanMessage}
                            onChange={(e) => setEditBanMessage(e.target.value)}
                            className="w-full rounded-xl border border-white/5 bg-neutral-950 p-3 text-sm text-white focus:border-orange-600 focus:outline-none"
                            rows={2}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-neutral-300">Account Activated</span>
                          <button 
                            onClick={() => setEditActivated(!editActivated)}
                            className={`relative h-6 w-11 rounded-full transition-colors ${editActivated ? 'bg-orange-600' : 'bg-neutral-800'}`}
                          >
                            <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${editActivated ? 'translate-x-5' : ''}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-neutral-300">Getting Started</span>
                          <button 
                            onClick={() => setEditGettingStarted(!editGettingStarted)}
                            className={`relative h-6 w-11 rounded-full transition-colors ${editGettingStarted ? 'bg-orange-600' : 'bg-neutral-800'}`}
                          >
                            <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${editGettingStarted ? 'translate-x-5' : ''}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-neutral-300">Demo Account</span>
                          <button 
                            onClick={() => setEditDemo(!editDemo)}
                            className={`relative h-6 w-11 rounded-full transition-colors ${editDemo ? 'bg-orange-600' : 'bg-neutral-800'}`}
                          >
                            <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${editDemo ? 'translate-x-5' : ''}`} />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">User Group</label>
                          <select 
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as any)}
                            className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm text-white focus:border-orange-600 focus:outline-none"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Username</label>
                      <input 
                        type="text" 
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm text-white focus:border-orange-600 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Email Address</label>
                      <input 
                        type="email" 
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm text-white focus:border-orange-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'Profile' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Display Name</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm text-white focus:border-orange-600 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Bio</label>
                      <textarea 
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        className="w-full rounded-xl border border-white/5 bg-neutral-950 p-3 text-sm text-white focus:border-orange-600 focus:outline-none"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Age</label>
                        <input 
                          type="number" 
                          value={editAge}
                          onChange={(e) => setEditAge(e.target.value)}
                          className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm text-white focus:border-orange-600 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Gender</label>
                        <select 
                          value={editGender}
                          onChange={(e) => setEditGender(e.target.value as any)}
                          className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm text-white focus:border-orange-600 focus:outline-none"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Relationship Status</label>
                      <select 
                        value={editRelationship}
                        onChange={(e) => setEditRelationship(e.target.value as any)}
                        className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm text-white focus:border-orange-600 focus:outline-none"
                      >
                        {RELATIONSHIP_STATUSES.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Country</label>
                        <select 
                          value={editCountry}
                          onChange={(e) => {
                            setEditCountry(e.target.value);
                            setEditCity(COUNTRIES_AND_CITIES[e.target.value]?.[0] || '');
                          }}
                          className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm text-white focus:border-orange-600 focus:outline-none"
                        >
                          <option value="">Select Country</option>
                          {Object.keys(COUNTRIES_AND_CITIES).map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">City</label>
                        <select 
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm text-white focus:border-orange-600 focus:outline-none"
                          disabled={!editCountry}
                        >
                          <option value="">Select City</option>
                          {editCountry && COUNTRIES_AND_CITIES[editCountry]?.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Privacy' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">Anonymous Mode</h4>
                        <p className="text-xs text-neutral-500">Browse profiles without letting them know.</p>
                      </div>
                      <button className="relative h-6 w-11 rounded-full bg-neutral-800">
                        <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white" />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'Security' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">New Password</label>
                      <input 
                        type="password" 
                        placeholder="Leave blank to keep current"
                        className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm text-white focus:border-orange-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'Membership' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl bg-orange-600/10 p-6 border border-orange-600/20">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg shadow-orange-900/20">
                          <TierIcon tier={user.tier} size={24} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">Current Tier: {user.tier}</h4>
                          <p className="text-sm text-neutral-400">You have {user.points} points in your wallet.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Extra' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Interests</label>
                      <div className="flex flex-wrap gap-2">
                        {user.interests?.map(interest => (
                          <span key={interest} className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-bold text-neutral-400">
                            {interest}
                          </span>
                        ))}
                        <button className="rounded-full border border-dashed border-white/10 px-3 py-1 text-xs font-bold text-neutral-500 hover:border-orange-600 hover:text-orange-600">
                          + Add Interest
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between border-t border-white/5 bg-neutral-950/50 p-6">
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 rounded-xl bg-red-500/10 px-6 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/20 transition-all">
                    <Trash2 size={18} />
                    Delete Posts
                  </button>
                  {isAdmin && (
                    <button className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-all">
                      Delete User
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl bg-neutral-800 px-6 py-2.5 text-sm font-bold text-neutral-300 border border-white/5 hover:bg-neutral-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-orange-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Intro Sidebar */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/5 bg-neutral-900 p-6 shadow-sm ring-1 ring-white/5">
                <h3 className="mb-4 text-lg font-bold text-white">Intro</h3>
                {user.uid?.startsWith('fake_') && (
                  <div className="mb-4 rounded-xl bg-orange-600/10 p-3 border border-orange-600/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={14} className="text-orange-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">AI Intellect</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-tight italic">
                      This profile is powered by STYN's advanced AI Assistant (Powered by GPT).
                    </p>
                  </div>
                )}
                <p className="mb-4 text-sm text-neutral-400">
                  {user.bio || "No bio yet. Add one to tell people about yourself!"}
                </p>
                
                <div className="space-y-3 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-3 text-sm text-neutral-400">
                    <Briefcase size={18} className="text-neutral-500" />
                    <span>Role: <span className="font-bold text-white uppercase tracking-widest text-[10px]">{user.role || 'User'}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-400">
                    <Calendar size={18} className="text-neutral-500" />
                    <span>Age: <span className="font-bold text-white">{user.age || 'Not set'}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-400">
                    <UserIcon size={18} className="text-neutral-500" />
                    <span>Gender: <span className="font-bold text-white">{user.gender || 'Not set'}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-400">
                    <Heart size={18} className="text-neutral-500" />
                    <span>Status: <span className="font-bold text-white">{user.relationshipStatus || 'Not set'}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-400">
                    <MapPin size={18} className="text-neutral-500" />
                    <span>Lives in <span className="font-bold text-white">{user.location?.city || 'City'}, {user.location?.country || 'Country'}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-400">
                    <Calendar size={18} className="text-neutral-500" />
                    <span>Joined <span className="font-bold text-white">
                      {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'April 2026'}
                    </span></span>
                  </div>
                </div>
              </div>

              {/* Photos Grid */}
              <div className="rounded-2xl border border-white/5 bg-neutral-900 p-6 shadow-sm ring-1 ring-white/5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Photos</h3>
                  <button className="text-sm font-bold text-orange-500 hover:underline">See all</button>
                </div>
                <div className="grid grid-cols-3 gap-2 overflow-hidden rounded-xl">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-square bg-neutral-800 transition-all hover:opacity-80">
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
                  <div className="rounded-2xl border border-white/5 bg-neutral-900 p-12 text-center shadow-sm">
                    <p className="text-neutral-500">No posts on this timeline yet.</p>
                  </div>
                ) : (
                  userPosts.map(post => (
                    <PostCard 
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      users={users}
                      onLike={onLike}
                      onDelete={onDelete}
                      onComment={onComment}
                      onBoost={onBoost}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
