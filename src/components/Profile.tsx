import React from 'react';
import { Camera, MapPin, Briefcase, Calendar, Edit3, Loader2, User as UserIcon, CheckCircle, Wallet as WalletIcon, Shield, Award, Medal, Trophy, Crown, ShieldAlert, UserPlus, MessageSquare, Lock, Settings, Star, Info, Trash2, Heart } from 'lucide-react';
import { User as UserType, Post } from '../types';
import { PostCard } from './PostCard';
import { COUNTRIES_AND_CITIES, RELATIONSHIP_STATUSES } from '../constants';

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
  onUnfriend
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
      console.error(err);
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
              <h1 className="text-3xl font-bold text-neutral-900">{user.displayName}</h1>
              {user.isVerified && <CheckCircle size={24} className="fill-blue-500 text-white" />}
            </div>
            <div className="flex items-center gap-4 text-sm font-bold text-neutral-500">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-xs text-neutral-400 uppercase tracking-widest">User ID</span>
                <span className="text-lg text-neutral-900">{user.uid.slice(0, 8)}</span>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-xs text-neutral-400 uppercase tracking-widest">Friends</span>
                <span className="text-lg text-neutral-900">{user.friends?.length || 0}</span>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-xs text-neutral-400 uppercase tracking-widest">Followers</span>
                <span className="text-lg text-neutral-900">{user.followers?.length || 0}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2 md:mb-4 md:justify-start">
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95"
              >
                <Edit3 size={18} />
                Edit Profile
              </button>
            )}
            {!isOwnProfile && !isEditing && (
              <div className="flex flex-wrap gap-2">
                {currentUser.friends?.includes(user.uid) ? (
                  <button 
                    onClick={() => onUnfriend(user.uid)}
                    className="flex items-center gap-2 rounded-xl bg-green-50 px-6 py-2.5 text-sm font-bold text-green-600 ring-1 ring-inset ring-green-600/20 hover:bg-red-50 hover:text-red-600 hover:ring-red-600/20 transition-all"
                  >
                    <CheckCircle size={18} />
                    Friends
                  </button>
                ) : currentUser.sentRequests?.includes(user.uid) ? (
                  <button 
                    onClick={() => onCancelFriendRequest(user.uid)}
                    className="flex items-center gap-2 rounded-xl bg-neutral-100 px-6 py-2.5 text-sm font-bold text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <Loader2 className="animate-spin" size={18} />
                    Cancel Request
                  </button>
                ) : currentUser.friendRequests?.includes(user.uid) ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onAcceptFriend(user.uid)}
                      className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95"
                    >
                      <UserPlus size={18} />
                      Accept
                    </button>
                    <button 
                      onClick={() => onDeclineFriend(user.uid)}
                      className="flex items-center gap-2 rounded-xl bg-neutral-100 px-6 py-2.5 text-sm font-bold text-neutral-900 hover:bg-neutral-200 transition-all active:scale-95"
                    >
                      Decline
                    </button>
                  </div>
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

        {isEditing ? (
          <div className="mt-8 space-y-6">
            {/* Stats Boxes */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm ring-1 ring-neutral-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-50 pb-2">
                    <span className="text-xs font-bold text-neutral-500">User ID</span>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-600">{user.uid.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-neutral-50 pb-2">
                    <span className="text-xs font-bold text-neutral-500">Joined</span>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-600">8 July 2025</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-500">Last Login</span>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-600">9 March 2026</span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm ring-1 ring-neutral-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-50 pb-2">
                    <span className="text-xs font-bold text-neutral-500">Friends</span>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-600">{user.friends?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-neutral-50 pb-2">
                    <span className="text-xs font-bold text-neutral-500">Followings</span>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-600">{user.following?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-500">Followers</span>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-600">{user.followers?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white shadow-xl ring-1 ring-neutral-200 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-neutral-100 bg-neutral-50/50 overflow-x-auto scrollbar-hide">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'border-b-2 border-orange-600 bg-white text-orange-600' 
                        : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
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
                          <span className="text-sm font-bold text-neutral-700">Verified User</span>
                          <button 
                            onClick={() => setEditVerified(!editVerified)}
                            className={`relative h-6 w-11 rounded-full transition-colors ${editVerified ? 'bg-orange-600' : 'bg-neutral-200'}`}
                          >
                            <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${editVerified ? 'translate-x-5' : ''}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-neutral-700">Banned</span>
                          <button 
                            onClick={() => setEditBanned(!editBanned)}
                            className={`relative h-6 w-11 rounded-full transition-colors ${editBanned ? 'bg-red-600' : 'bg-neutral-200'}`}
                          >
                            <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${editBanned ? 'translate-x-5' : ''}`} />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Ban Message</label>
                          <textarea 
                            value={editBanMessage}
                            onChange={(e) => setEditBanMessage(e.target.value)}
                            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm focus:border-orange-600 focus:outline-none"
                            rows={2}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-neutral-700">Account Activated</span>
                          <button 
                            onClick={() => setEditActivated(!editActivated)}
                            className={`relative h-6 w-11 rounded-full transition-colors ${editActivated ? 'bg-orange-600' : 'bg-neutral-200'}`}
                          >
                            <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${editActivated ? 'translate-x-5' : ''}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-neutral-700">Getting Started</span>
                          <button 
                            onClick={() => setEditGettingStarted(!editGettingStarted)}
                            className={`relative h-6 w-11 rounded-full transition-colors ${editGettingStarted ? 'bg-orange-600' : 'bg-neutral-200'}`}
                          >
                            <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${editGettingStarted ? 'translate-x-5' : ''}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-neutral-700">Demo Account</span>
                          <button 
                            onClick={() => setEditDemo(!editDemo)}
                            className={`relative h-6 w-11 rounded-full transition-colors ${editDemo ? 'bg-orange-600' : 'bg-neutral-200'}`}
                          >
                            <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${editDemo ? 'translate-x-5' : ''}`} />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">User Group</label>
                          <select 
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as any)}
                            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-orange-600 focus:outline-none"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Username</label>
                      <input 
                        type="text" 
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-orange-600 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Email Address</label>
                      <input 
                        type="email" 
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-orange-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'Profile' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Display Name</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-orange-600 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Bio</label>
                      <textarea 
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm focus:border-orange-600 focus:outline-none"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Age</label>
                        <input 
                          type="number" 
                          value={editAge}
                          onChange={(e) => setEditAge(e.target.value)}
                          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-orange-600 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Gender</label>
                        <select 
                          value={editGender}
                          onChange={(e) => setEditGender(e.target.value as any)}
                          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-orange-600 focus:outline-none"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Relationship Status</label>
                      <select 
                        value={editRelationship}
                        onChange={(e) => setEditRelationship(e.target.value as any)}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-orange-600 focus:outline-none"
                      >
                        {RELATIONSHIP_STATUSES.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Country</label>
                        <select 
                          value={editCountry}
                          onChange={(e) => {
                            setEditCountry(e.target.value);
                            setEditCity(COUNTRIES_AND_CITIES[e.target.value]?.[0] || '');
                          }}
                          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-orange-600 focus:outline-none"
                        >
                          <option value="">Select Country</option>
                          {Object.keys(COUNTRIES_AND_CITIES).map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">City</label>
                        <select 
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-orange-600 focus:outline-none"
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
                        <h4 className="text-sm font-bold text-neutral-900">Anonymous Mode</h4>
                        <p className="text-xs text-neutral-500">Browse profiles without letting them know.</p>
                      </div>
                      <button className="relative h-6 w-11 rounded-full bg-neutral-200">
                        <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white" />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'Security' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">New Password</label>
                      <input 
                        type="password" 
                        placeholder="Leave blank to keep current"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-orange-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'Membership' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl bg-orange-50 p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg">
                          <TierIcon tier={user.tier} size={24} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-neutral-900">Current Tier: {user.tier}</h4>
                          <p className="text-sm text-neutral-600">You have {user.points} points in your wallet.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Extra' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Interests</label>
                      <div className="flex flex-wrap gap-2">
                        {user.interests?.map(interest => (
                          <span key={interest} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600">
                            {interest}
                          </span>
                        ))}
                        <button className="rounded-full border border-dashed border-neutral-300 px-3 py-1 text-xs font-bold text-neutral-400 hover:border-orange-600 hover:text-orange-600">
                          + Add Interest
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/50 p-6">
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 rounded-xl bg-red-50 px-6 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 transition-all">
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
                    className="rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-orange-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
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
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm ring-1 ring-neutral-200">
                <h3 className="mb-4 text-lg font-bold text-neutral-900">Intro</h3>
                <p className="mb-4 text-sm text-neutral-700">
                  {user.bio || "No bio yet. Add one to tell people about yourself!"}
                </p>
                
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
                    <span>Gender: <span className="font-bold text-neutral-900">{user.gender || 'Not set'}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-600">
                    <Heart size={18} className="text-neutral-400" />
                    <span>Status: <span className="font-bold text-neutral-900">{user.relationshipStatus || 'Not set'}</span></span>
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
