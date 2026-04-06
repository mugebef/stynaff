import React from 'react';
import { Flag, Plus, Users, CheckCircle, Search, MoreHorizontal } from 'lucide-react';
import { Page, User as UserType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface PagesProps {
  pages: Page[];
  currentUser: UserType | null;
}

export const Pages: React.FC<PagesProps> = ({ pages, currentUser }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newDesc, setNewDesc] = React.useState('');
  const [newCategory, setNewCategory] = React.useState('Entertainment');

  const handleCreatePage = async () => {
    if (!currentUser || !newName) return;
    try {
      await addDoc(collection(db, 'pages'), {
        name: newName,
        description: newDesc,
        category: newCategory,
        ownerId: currentUser.uid,
        isVerified: false,
        followers: [],
        createdAt: serverTimestamp()
      });
      setIsCreateModalOpen(false);
      setNewName('');
      setNewDesc('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-4xl pb-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Pages</h1>
          <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Discover and connect with brands</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95"
        >
          <Plus size={20} />
          Create Page
        </button>
      </div>

      <div className="mb-8 flex items-center gap-4 rounded-3xl border border-neutral-200 bg-white p-4 shadow-xl ring-1 ring-neutral-200">
        <Search className="text-neutral-400" size={20} />
        <input 
          type="text" 
          placeholder="Search pages..." 
          className="flex-1 bg-transparent text-sm font-bold text-neutral-900 focus:outline-none"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {pages.map((page) => (
          <motion.div
            key={page.id}
            whileHover={{ y: -5 }}
            className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl ring-1 ring-neutral-200 transition-all"
          >
            <div className="h-32 w-full bg-gradient-to-r from-orange-600 to-orange-400">
              {page.coverURL && <img src={page.coverURL} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="relative px-6 pb-6 pt-12">
              <div className="absolute -top-10 left-6 h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-neutral-100 shadow-lg">
                {page.photoURL ? (
                  <img src={page.photoURL} alt={page.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-400">
                    <Flag size={32} />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-neutral-900">{page.name}</h3>
                    {page.isVerified && <CheckCircle size={18} className="fill-blue-500 text-white" />}
                  </div>
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">{page.category}</p>
                </div>
                <button className="rounded-full bg-neutral-100 p-2 text-neutral-500 hover:bg-neutral-200 transition-all">
                  <MoreHorizontal size={20} />
                </button>
              </div>
              <p className="mt-4 line-clamp-2 text-sm text-neutral-600">{page.description}</p>
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-neutral-500">
                  <Users size={16} />
                  <span>{page.followers?.length || 0} Followers</span>
                </div>
                <button className="rounded-xl bg-orange-50 px-6 py-2 text-sm font-bold text-orange-600 hover:bg-orange-100 transition-all active:scale-95">
                  Follow
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-8 shadow-2xl"
            >
              <h2 className="mb-6 text-2xl font-bold text-neutral-900">Create New Page</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-500">Page Name</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-bold text-neutral-900 focus:border-orange-600 focus:outline-none"
                    placeholder="Enter page name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-500">Description</label>
                  <textarea 
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="h-32 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-bold text-neutral-900 focus:border-orange-600 focus:outline-none resize-none"
                    placeholder="What is your page about?"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-500">Category</label>
                  <select 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-bold text-neutral-900 focus:border-orange-600 focus:outline-none"
                  >
                    <option>Entertainment</option>
                    <option>Business</option>
                    <option>Technology</option>
                    <option>Community</option>
                    <option>Education</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={handleCreatePage}
                    className="flex-1 rounded-2xl bg-orange-600 py-3 text-sm font-bold text-white shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95"
                  >
                    Create Page
                  </button>
                  <button 
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 rounded-2xl bg-neutral-100 py-3 text-sm font-bold text-neutral-600 hover:bg-neutral-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
