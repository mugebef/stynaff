import React from 'react';
import { Users, FileText, CheckCircle, TrendingUp, DollarSign, Award, Edit, Trash2, Search, Settings, Zap, Megaphone, Plus, X } from 'lucide-react';
import { User, Post, Transaction } from '../types';
import { db } from '../firebase';
import { collection, query, getDocs, updateDoc, doc, deleteDoc, onSnapshot, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';

interface SponsoredAd {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  active: boolean;
  createdAt: any;
}

interface AdminDashboardProps {
  currentUser: User;
  onUpdateUser: (uid: string, updates: Partial<User>) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onUpdateUser }) => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [ads, setAds] = React.useState<SponsoredAd[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [appConfig, setAppConfig] = React.useState<any>(null);
  const [isSavingConfig, setIsSavingConfig] = React.useState(false);
  
  const [isAdModalOpen, setIsAdModalOpen] = React.useState(false);
  const [isSeeding, setIsSeeding] = React.useState(false);
  const [isClearing, setIsClearing] = React.useState(false);
  const [newAd, setNewAd] = React.useState({ title: '', description: '', imageUrl: '', link: '' });

  const clearFakeUsers = async () => {
    if (!confirm('Delete all mock profiles? This cannot be undone.')) return;
    setIsClearing(true);
    try {
      const mockUsers = users.filter(u => u.uid.startsWith('fake_'));
      for (const u of mockUsers) {
        await deleteDoc(doc(db, 'users', u.uid));
      }
      alert(`${mockUsers.length} mock profiles cleared.`);
      // Refresh
      const usersSnap = await getDocs(collection(db, 'users'));
      setUsers(usersSnap.docs.map(d => d.data() as User));
    } catch (err) {
      console.error(err);
      alert('Failed to clear users');
    } finally {
      setIsClearing(false);
    }
  };
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = React.useState(false);

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    // Limit size to 500KB to stay safe within Firestore's 1MB limit
    if (file.size > 500 * 1024) {
      alert('File is too large. Please use an image under 500KB.');
      return;
    }

    if (type === 'logo') setIsUploadingLogo(true);
    else setIsUploadingFavicon(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        const updatedConfig = { ...appConfig, [type + 'Url']: base64String };
        setAppConfig(updatedConfig);
        await setDoc(doc(db, 'appConfig', 'main'), updatedConfig);
        
        alert(`${type === 'logo' ? 'Logo' : 'Favicon'} updated successfully!`);
        if (type === 'logo') setIsUploadingLogo(false);
        else setIsUploadingFavicon(false);
      };
      
      reader.onerror = () => {
        alert('Failed to read file');
        if (type === 'logo') setIsUploadingLogo(false);
        else setIsUploadingFavicon(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Upload Error:', err);
      alert(`Upload failed: ${err.message}`);
      if (type === 'logo') setIsUploadingLogo(false);
      else setIsUploadingFavicon(false);
    }
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const postsSnap = await getDocs(collection(db, 'posts'));
        
        setUsers(usersSnap.docs.map(d => d.data() as User));
        setPosts(postsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const unsubConfig = onSnapshot(doc(db, 'appConfig', 'main'), (snap) => {
      if (snap.exists()) setAppConfig(snap.data());
    });

    const unsubAds = onSnapshot(collection(db, 'sponsoredContent'), (snap) => {
      setAds(snap.docs.map(d => ({ id: d.id, ...d.data() } as SponsoredAd)));
    });

    return () => {
      unsubConfig();
      unsubAds();
    };
  }, []);

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'sponsoredContent'), {
        ...newAd,
        active: true,
        createdAt: serverTimestamp()
      });
      setIsAdModalOpen(false);
      setNewAd({ title: '', description: '', imageUrl: '', link: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const seedFakeUsers = async () => {
    if (!confirm('Add 10 mock female users from Zim & SA?')) return;
    setIsSeeding(true);
    
    const fakeData = [
      { name: 'Lerato', age: 24, city: 'Johannesburg', country: 'South Africa', bio: 'Living my best life in Joburg ✨ Love travel and tech.' },
      { name: 'Sarah', age: 22, city: 'Harare', country: 'Zimbabwe', bio: 'Architecture student 🏛️ Nature lover.' },
      { name: 'Zandile', age: 26, city: 'Cape Town', country: 'South Africa', bio: 'Ocean vibes only 🌊 Graphic designer.' },
      { name: 'Tendai', age: 23, city: 'Bulawayo', country: 'Zimbabwe', bio: 'Coffee explorer ☕ Fitness enthusiast.' },
      { name: 'Naledi', age: 25, city: 'Pretoria', country: 'South Africa', bio: 'Lawyer in the making ⚖️ Fashion addict.' },
      { name: 'Ruvimbo', age: 21, city: 'Harare', country: 'Zimbabwe', bio: 'Dancing is my soul 💃 Aspiring model.' },
      { name: 'Thando', age: 27, city: 'Durban', country: 'South Africa', bio: 'Foodie and digital nomad 🥘✈️' },
      { name: 'Kudzai', age: 24, city: 'Victoria Falls', country: 'Zimbabwe', bio: 'Living where the mist meets the sky 🌈 Adventure seeker.' },
      { name: 'Amogelang', age: 23, city: 'Soweto', country: 'South Africa', bio: 'Soulful music and deep conversations 🎶' },
      { name: 'Nyasha', age: 22, city: 'Mutare', country: 'Zimbabwe', bio: 'Mountains and peace 🏔️ Bookworm.' },
    ];

    try {
      for (const item of fakeData) {
        const uid = 'fake_' + Math.random().toString(36).substr(2, 9);
        const newUser: User = {
          uid,
          displayName: item.name,
          username: item.name.toLowerCase() + Math.floor(Math.random() * 1000),
          email: `${item.name.toLowerCase()}@example.com`,
          photoURL: `https://picsum.photos/seed/${item.name}/600/800`,
          gender: 'Female',
          role: 'user',
          tier: Math.random() > 0.5 ? 'Platinum' : 'General',
          isVerified: true,
          verificationRequested: false,
          location: { city: item.city, country: item.country },
          age: item.age,
          bio: item.bio,
          interests: ['Music', 'Travel', 'Art', 'Tech', 'Cooking', 'Hiking', 'Dancing', 'Fitness', 'Photography', 'Movies'].sort(() => 0.5 - Math.random()).slice(0, 3),
          interestedIn: 'Male',
          friends: [],
          friendRequests: [],
          sentRequests: [],
          followers: [],
          following: [],
          walletBalance: 0,
          points: 500,
          profileViews: Math.floor(Math.random() * 1000),
          swipedLeft: [],
          swipedRight: [],
          matches: [],
          createdAt: serverTimestamp(),
          isOnline: Math.random() > 0.5,
        };
        await setDoc(doc(db, 'users', uid), newUser);
      }
      alert('10 Fake users added successfully!');
      // Refresh user list
      const usersSnap = await getDocs(collection(db, 'users'));
      setUsers(usersSnap.docs.map(d => d.data() as User));
    } catch (err) {
      console.error(err);
      alert('Failed to seed users');
    } finally {
      setIsSeeding(false);
    }
  };

  const toggleAdStatus = async (adId: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'sponsoredContent', adId), { active: !currentStatus });
  };

  const deleteAd = async (adId: string) => {
    if (confirm('Delete this ad?')) {
      await deleteDoc(doc(db, 'sponsoredContent', adId));
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      await setDoc(doc(db, 'appConfig', 'main'), appConfig);
      alert('Configuration updated successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total Users', value: users.length, icon: <Users className="text-blue-600" /> },
    { label: 'Total Posts', value: posts.length, icon: <FileText className="text-green-600" /> },
    { label: 'Verification Requests', value: users.filter(u => u.verificationRequested).length, icon: <CheckCircle className="text-orange-600" /> },
    { label: 'Platform Points', value: users.reduce((acc, u) => acc + (u.points || 0), 0), icon: <Award className="text-purple-600" /> },
    { label: 'Mock Accounts', value: users.filter(u => u.uid.startsWith('fake_')).length, icon: <Zap className="text-yellow-500" /> },
  ];

  if (loading) return <div className="p-12 text-center">Loading Admin Dashboard...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <div className="flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-orange-900/20">
          <TrendingUp size={18} />
          Super Admin Access
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-3xl border border-white/5 bg-neutral-900 p-6 shadow-sm ring-1 ring-white/5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-950 shadow-inner border border-white/5">
              {stat.icon}
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
        
        {/* Seed Data Button */}
        <button 
          onClick={seedFakeUsers}
          disabled={isSeeding || isClearing}
          className="flex flex-col items-start justify-between rounded-3xl border-2 border-orange-600/30 bg-orange-600/10 p-6 shadow-xl transition-all hover:bg-orange-600/20 active:scale-95 disabled:opacity-50 group hover:border-orange-500"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-900/40 group-hover:scale-110 transition-transform ring-4 ring-orange-600/20">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-orange-500">{isSeeding ? 'Seeding...' : 'Populate'}</p>
            <p className="text-[10px] font-bold text-neutral-400 mt-1 uppercase tracking-tight">Add 10 Zim/SA</p>
          </div>
        </button>

        {/* Clear Data Button */}
        <button 
          onClick={clearFakeUsers}
          disabled={isSeeding || isClearing}
          className="flex flex-col items-start justify-between rounded-3xl border-2 border-neutral-800 bg-neutral-900 p-6 shadow-xl transition-all hover:bg-red-500/10 active:scale-95 disabled:opacity-50 group hover:border-red-500/50"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-800 text-neutral-400 shadow-lg group-hover:bg-red-500 group-hover:text-white transition-all ring-4 ring-neutral-800">
            <Trash2 size={24} />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-neutral-400 group-hover:text-red-500 transition-colors">{isClearing ? 'Clearing...' : 'Clear Mocks'}</p>
            <p className="text-[10px] font-bold text-neutral-600 mt-1 uppercase tracking-tight">Remove all fakes</p>
          </div>
        </button>

      </div>

      {/* Site Identity */}
      <div className="rounded-3xl border border-white/5 bg-neutral-900 p-8 shadow-xl ring-1 ring-white/5">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600/10 text-orange-500">
            <Zap size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">Site Identity</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {/* Logo Upload */}
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500">Site Logo</label>
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 overflow-hidden rounded-2xl bg-neutral-950 border border-white/5 flex items-center justify-center">
                {appConfig?.logoUrl ? (
                  <img src={appConfig.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-2xl font-black italic text-orange-500">S</span>
                )}
              </div>
              <div className="flex-1">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')}
                  className="hidden" 
                  id="logo-upload"
                />
                <label 
                  htmlFor="logo-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-neutral-800 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700 transition-all"
                >
                  {isUploadingLogo ? 'Processing...' : 'Change Logo'}
                </label>
                <p className="mt-2 text-[10px] text-neutral-500">Recommended size: 200x200px. PNG or SVG.</p>
              </div>
            </div>
          </div>

          {/* Favicon Upload */}
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500">Site Favicon</label>
            <div className="flex items-center gap-6">
              <div className="h-12 w-12 overflow-hidden rounded-xl bg-neutral-950 border border-white/5 flex items-center justify-center">
                {appConfig?.faviconUrl ? (
                  <img src={appConfig.faviconUrl} alt="Favicon" className="h-8 w-8 object-contain" />
                ) : (
                  <div className="h-6 w-6 rounded bg-orange-600"></div>
                )}
              </div>
              <div className="flex-1">
                <input 
                  type="file" 
                  accept="image/x-icon,image/png,image/svg+xml"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'favicon')}
                  className="hidden" 
                  id="favicon-upload"
                />
                <label 
                  htmlFor="favicon-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-neutral-800 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700 transition-all"
                >
                  {isUploadingFavicon ? 'Processing...' : 'Change Favicon'}
                </label>
                <p className="mt-2 text-[10px] text-neutral-500">Recommended size: 32x32px. ICO, PNG or SVG.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Configuration */}
      {appConfig && (
        <div className="rounded-3xl border border-white/5 bg-neutral-900 p-8 shadow-xl ring-1 ring-white/5">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600/10 text-orange-500">
              <Settings size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">App Configuration</h2>
          </div>
          <form onSubmit={handleUpdateConfig} className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-500">Point Conversion Rate ($ per point)</label>
              <input 
                type="number" 
                step="0.001"
                value={appConfig.pointsToCashRate || 0.01}
                onChange={(e) => setAppConfig({ ...appConfig, pointsToCashRate: parseFloat(e.target.value) })}
                className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm font-bold text-white focus:border-orange-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-500">Post Boost Price ($)</label>
              <input 
                type="number" 
                step="0.01"
                value={appConfig.boostPricePerDay || 5.00}
                onChange={(e) => setAppConfig({ ...appConfig, boostPricePerDay: parseFloat(e.target.value) })}
                className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm font-bold text-white focus:border-orange-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-500">Verification Fee ($)</label>
              <input 
                type="number" 
                step="0.01"
                value={appConfig.verificationPrice || 10.00}
                onChange={(e) => setAppConfig({ ...appConfig, verificationPrice: parseFloat(e.target.value) })}
                className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm font-bold text-white focus:border-orange-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-500">Points per Post</label>
              <input 
                type="number" 
                value={appConfig.pointsPerPost || 10}
                onChange={(e) => setAppConfig({ ...appConfig, pointsPerPost: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm font-bold text-white focus:border-orange-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-500">Points per Like</label>
              <input 
                type="number" 
                value={appConfig.pointsPerLike || 1}
                onChange={(e) => setAppConfig({ ...appConfig, pointsPerLike: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm font-bold text-white focus:border-orange-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-500">Premium Monthly Price ($)</label>
              <input 
                type="number" 
                step="0.01"
                value={appConfig.premiumMonthlyPrice || 9.99}
                onChange={(e) => setAppConfig({ ...appConfig, premiumMonthlyPrice: parseFloat(e.target.value) })}
                className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm font-bold text-white focus:border-orange-600 focus:outline-none"
              />
            </div>
            <div className="md:col-span-3">
              <button 
                type="submit"
                disabled={isSavingConfig}
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSavingConfig ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Management */}
      <div className="rounded-3xl border border-white/5 bg-neutral-900 shadow-xl ring-1 ring-white/5">
        <div className="border-b border-white/5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">User Management</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-full border border-white/5 bg-neutral-950 py-2 pl-10 pr-4 text-sm text-white focus:border-orange-600 focus:outline-none"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-950 text-xs font-bold uppercase tracking-widest text-neutral-500">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Tier</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Wallet</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-neutral-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-800 border border-white/10">
                        {user.photoURL ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" /> : <Users className="m-2 text-neutral-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{user.displayName}</p>
                        <p className="text-xs text-neutral-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.tier}
                      onChange={(e) => onUpdateUser(user.uid, { tier: e.target.value as any })}
                      className="rounded-lg border border-white/5 bg-neutral-950 px-2 py-1 text-xs font-bold text-neutral-300 focus:outline-none focus:ring-1 focus:ring-orange-600"
                    >
                      {['General', 'Bronze', 'Silver', 'Gold', 'Platinum'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => onUpdateUser(user.uid, { role: e.target.value as any })}
                      className={`rounded-lg border px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-600 ${
                        user.role === 'admin' ? 'border-orange-600/20 bg-orange-600/10 text-orange-500' : 'border-white/5 bg-neutral-950 text-neutral-300'
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onUpdateUser(user.uid, { isVerified: !user.isVerified, verificationRequested: false })}
                        className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ring-1 ring-inset transition-all ${
                          user.isVerified 
                            ? 'bg-orange-600/10 text-orange-500 ring-orange-600/20' 
                            : 'bg-neutral-800 text-neutral-500 ring-white/5 hover:bg-orange-600/10 hover:text-orange-500 hover:ring-orange-600/20'
                        }`}
                      >
                        <CheckCircle size={10} /> {user.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                      </button>
                      {user.verificationRequested && !user.isVerified && (
                        <span className="animate-pulse rounded-full bg-orange-600 px-2 py-1 text-[10px] font-bold text-white">
                          PENDING
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-500">$</span>
                        <input 
                          type="number"
                          value={user.walletBalance || 0}
                          onChange={(e) => onUpdateUser(user.uid, { walletBalance: parseFloat(e.target.value) })}
                          className="w-16 rounded border border-white/5 bg-neutral-950 px-1 py-0.5 text-xs font-bold text-white focus:border-orange-600 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Award size={10} className="text-neutral-500" />
                        <input 
                          type="number"
                          value={user.points || 0}
                          onChange={(e) => onUpdateUser(user.uid, { points: parseInt(e.target.value) })}
                          className="w-16 rounded border border-white/5 bg-neutral-950 px-1 py-0.5 text-[10px] font-bold text-neutral-400 focus:border-orange-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => {
                          const newName = prompt('Enter new display name:', user.displayName);
                          if (newName) onUpdateUser(user.uid, { displayName: newName });
                        }}
                        className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-800 hover:text-orange-500 transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button className="rounded-lg p-2 text-neutral-500 hover:bg-red-500/10 hover:text-red-500 transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ads & Sponsored Content Management */}
      <div className="rounded-3xl border border-white/5 bg-neutral-900 shadow-xl ring-1 ring-white/5">
        <div className="border-b border-white/5 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600/10 text-orange-500">
                <Megaphone size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">Ads & Sponsored Content</h2>
            </div>
            <button 
              onClick={() => setIsAdModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95"
            >
              <Plus size={18} />
              Create New Ad
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ads.map((ad) => (
              <div key={ad.id} className="relative overflow-hidden rounded-2xl border border-white/5 bg-neutral-950 p-4 transition-all hover:shadow-md hover:border-orange-600/30">
                <div className="mb-4 aspect-video w-full overflow-hidden rounded-xl bg-neutral-900 border border-white/5">
                  <img src={ad.imageUrl} alt={ad.title} className="h-full w-full object-cover" />
                </div>
                <h3 className="mb-1 text-sm font-bold text-white">{ad.title}</h3>
                <p className="mb-4 line-clamp-2 text-xs text-neutral-400">{ad.description}</p>
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => toggleAdStatus(ad.id, ad.active)}
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all ${
                      ad.active ? 'bg-orange-600/10 text-orange-500 ring-1 ring-orange-600/20' : 'bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {ad.active ? 'Active' : 'Inactive'}
                  </button>
                  <button 
                    onClick={() => deleteAd(ad.id)}
                    className="rounded-full bg-red-500/10 p-2 text-red-500 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ad Creation Modal */}
      {isAdModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAdModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-neutral-900 p-8 shadow-2xl border border-white/5">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Create Sponsored Ad</h2>
              <button onClick={() => setIsAdModalOpen(false)} className="text-neutral-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateAd} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-500">Ad Title</label>
                <input 
                  type="text" 
                  required
                  value={newAd.title}
                  onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                  className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm text-white focus:border-orange-600 focus:outline-none"
                  placeholder="e.g. Upgrade to Platinum"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-500">Description</label>
                <textarea 
                  required
                  value={newAd.description}
                  onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                  className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm text-white focus:border-orange-600 focus:outline-none"
                  rows={3}
                  placeholder="Describe your ad..."
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-500">Image URL</label>
                <input 
                  type="url" 
                  required
                  value={newAd.imageUrl}
                  onChange={(e) => setNewAd({ ...newAd, imageUrl: e.target.value })}
                  className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm text-white focus:border-orange-600 focus:outline-none"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-500">Destination Link</label>
                <input 
                  type="url" 
                  required
                  value={newAd.link}
                  onChange={(e) => setNewAd({ ...newAd, link: e.target.value })}
                  className="w-full rounded-xl border border-white/5 bg-neutral-950 px-4 py-2 text-sm text-white focus:border-orange-600 focus:outline-none"
                  placeholder="https://example.com"
                />
              </div>
              <button 
                type="submit"
                className="w-full rounded-xl bg-orange-600 py-3 text-sm font-bold text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95"
              >
                Create Ad
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Post Management */}
      <div className="rounded-3xl border border-white/5 bg-neutral-900 shadow-xl ring-1 ring-white/5">
        <div className="border-b border-white/5 p-6">
          <h2 className="text-xl font-bold text-white">Recent Posts Moderation</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-950 text-xs font-bold uppercase tracking-widest text-neutral-500">
              <tr>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Content</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {posts.slice(0, 10).map((post) => (
                <tr key={post.id} className="hover:bg-neutral-800 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-white">{post.authorName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="line-clamp-1 text-sm text-neutral-400">{post.content}</p>
                  </td>
                  <td className="px-6 py-4">
                    {post.isBoosted && (
                      <span className="rounded-full bg-orange-600/10 px-2 py-1 text-[10px] font-bold text-orange-500 ring-1 ring-inset ring-orange-600/20">
                        BOOSTED
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={async () => {
                        if (confirm('Delete this post?')) {
                          await deleteDoc(doc(db, 'posts', post.id));
                          setPosts(posts.filter(p => p.id !== post.id));
                        }
                      }}
                      className="rounded-lg p-2 text-neutral-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
