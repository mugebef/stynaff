import React from 'react';
import { Users, FileText, CheckCircle, TrendingUp, DollarSign, Award, Edit, Trash2, Search, Settings, Zap } from 'lucide-react';
import { User, Post, Transaction } from '../types';
import { db } from '../firebase';
import { collection, query, getDocs, updateDoc, doc, deleteDoc, onSnapshot, setDoc } from 'firebase/firestore';

interface AdminDashboardProps {
  currentUser: User;
  onUpdateUser: (uid: string, updates: Partial<User>) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onUpdateUser }) => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [appConfig, setAppConfig] = React.useState<any>(null);
  const [isSavingConfig, setIsSavingConfig] = React.useState(false);

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
    return () => unsubConfig();
  }, []);

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
  ];

  if (loading) return <div className="p-12 text-center">Loading Admin Dashboard...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
        <div className="flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm font-bold text-white">
          <TrendingUp size={18} />
          Super Admin Access
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-50 shadow-inner">
              {stat.icon}
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">{stat.label}</p>
            <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* App Configuration */}
      {appConfig && (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-xl ring-1 ring-neutral-200">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Settings size={20} />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">App Configuration</h2>
          </div>
          <form onSubmit={handleUpdateConfig} className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-400">Point Conversion Rate ($ per point)</label>
              <input 
                type="number" 
                step="0.001"
                value={appConfig.pointsToCashRate || 0.01}
                onChange={(e) => setAppConfig({ ...appConfig, pointsToCashRate: parseFloat(e.target.value) })}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-bold focus:border-orange-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-400">Post Boost Price ($)</label>
              <input 
                type="number" 
                step="0.01"
                value={appConfig.boostPricePerDay || 5.00}
                onChange={(e) => setAppConfig({ ...appConfig, boostPricePerDay: parseFloat(e.target.value) })}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-bold focus:border-orange-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-400">Verification Fee ($)</label>
              <input 
                type="number" 
                step="0.01"
                value={appConfig.verificationPrice || 10.00}
                onChange={(e) => setAppConfig({ ...appConfig, verificationPrice: parseFloat(e.target.value) })}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-bold focus:border-orange-600 focus:outline-none"
              />
            </div>
            <div className="md:col-span-3">
              <button 
                type="submit"
                disabled={isSavingConfig}
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSavingConfig ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Management */}
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-xl ring-1 ring-neutral-200">
        <div className="border-b border-neutral-100 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900">User Management</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-full border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm focus:border-orange-600 focus:outline-none"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 text-xs font-bold uppercase tracking-widest text-neutral-400">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Tier</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Wallet</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-100">
                        {user.photoURL ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" /> : <Users className="m-2 text-neutral-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-900">{user.displayName}</p>
                        <p className="text-xs text-neutral-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.tier}
                      onChange={(e) => onUpdateUser(user.uid, { tier: e.target.value as any })}
                      className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-bold text-neutral-700"
                    >
                      {['General', 'Bronze', 'Silver', 'Gold', 'Platinum'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => onUpdateUser(user.uid, { role: e.target.value as any })}
                      className={`rounded-lg border px-2 py-1 text-xs font-bold ${
                        user.role === 'admin' ? 'border-orange-200 bg-orange-50 text-orange-600' : 'border-neutral-200 bg-white text-neutral-700'
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.isVerified ? (
                        <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 ring-1 ring-inset ring-blue-600/20">
                          <CheckCircle size={10} /> VERIFIED
                        </span>
                      ) : user.verificationRequested ? (
                        <button 
                          onClick={() => onUpdateUser(user.uid, { isVerified: true, verificationRequested: false })}
                          className="rounded-full bg-orange-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-orange-700"
                        >
                          APPROVE
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-neutral-400">UNVERIFIED</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-400">$</span>
                        <input 
                          type="number"
                          value={user.walletBalance || 0}
                          onChange={(e) => onUpdateUser(user.uid, { walletBalance: parseFloat(e.target.value) })}
                          className="w-16 rounded border border-neutral-200 bg-transparent px-1 py-0.5 text-xs font-bold text-neutral-900 focus:border-orange-600 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Award size={10} className="text-neutral-400" />
                        <input 
                          type="number"
                          value={user.points || 0}
                          onChange={(e) => onUpdateUser(user.uid, { points: parseInt(e.target.value) })}
                          className="w-16 rounded border border-neutral-200 bg-transparent px-1 py-0.5 text-[10px] font-bold text-neutral-500 focus:border-orange-600 focus:outline-none"
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
                        className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-orange-600 transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-all">
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

      {/* Post Management */}
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-xl ring-1 ring-neutral-200">
        <div className="border-b border-neutral-100 p-6">
          <h2 className="text-xl font-bold text-neutral-900">Recent Posts Moderation</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 text-xs font-bold uppercase tracking-widest text-neutral-400">
              <tr>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Content</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {posts.slice(0, 10).map((post) => (
                <tr key={post.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-neutral-900">{post.authorName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="line-clamp-1 text-sm text-neutral-600">{post.content}</p>
                  </td>
                  <td className="px-6 py-4">
                    {post.isBoosted && (
                      <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-600 ring-1 ring-inset ring-orange-600/20">
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
                      className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-all"
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
