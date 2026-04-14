import React from 'react';
import { Plus, User, Camera, Loader2, X } from 'lucide-react';
import { User as UserType, Status as StatusType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, deleteDoc, doc } from 'firebase/firestore';

interface StatusProps {
  user: UserType | null;
}

export const Status: React.FC<StatusProps> = ({ user }) => {
  const [statuses, setStatuses] = React.useState<StatusType[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [mediaFile, setMediaFile] = React.useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = React.useState<string | null>(null);
  const [content, setContent] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const now = new Date();
    const q = query(
      collection(db, 'statuses'),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const statusData = snap.docs.map(d => ({ id: d.id, ...d.data() } as StatusType));
      // Group by user to show only the latest status per user
      const uniqueStatuses: StatusType[] = [];
      const userIds = new Set();
      statusData.forEach(s => {
        if (!userIds.has(s.userId)) {
          userIds.add(s.userId);
          uniqueStatuses.push(s);
        }
      });
      setStatuses(uniqueStatuses);
    });
    return () => unsubscribe();
  }, []);

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

  const handleCreateStatus = async () => {
    if (!user || (!mediaFile && !content.trim())) return;
    setLoading(true);
    setError(null);
    try {
      let mediaUrl = null;
      let mediaType: 'image' | 'video' | undefined = undefined;

      if (mediaFile) {
        if (mediaFile.size > 10000000) { // 10MB limit
          throw new Error('File size too large. Please upload a file smaller than 10MB.');
        }

        const formData = new FormData();
        formData.append('file', mediaFile);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!res.ok) {
          throw new Error('Upload failed. Please try again.');
        }

        const data = await res.json();
        mediaUrl = data.url;
        mediaType = mediaFile.type.startsWith('image') ? 'image' : 'video';
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await addDoc(collection(db, 'statuses'), {
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL || null,
        mediaUrl: mediaUrl,
        mediaType: mediaType || 'image',
        content: content.trim() || null,
        createdAt: serverTimestamp(),
        expiresAt: expiresAt
      });
      setIsModalOpen(false);
      setMediaFile(null);
      setMediaPreview(null);
      setContent('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong during upload.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {/* Add Status */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { setIsModalOpen(true); setError(null); }}
        className="relative h-48 w-32 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-neutral-900 shadow-lg ring-1 ring-white/5"
      >
        <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-800">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="h-full w-full object-cover brightness-50" />
          ) : (
            <div className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${user?.gender === 'Female' ? 'bg-pink-500' : 'bg-blue-500'}`}>
              <User size={24} />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 p-2 text-center border-t border-white/5">
            <div className="mx-auto -mt-6 mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white ring-4 ring-neutral-900">
              <Plus size={16} />
            </div>
            <span className="text-[10px] font-bold text-white">Create Story</span>
          </div>
        </div>
      </motion.div>

      {/* Real Statuses */}
      {statuses.map((status) => (
        <motion.div
          key={status.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative h-48 w-32 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-neutral-900 shadow-lg ring-1 ring-white/5"
        >
          {status.mediaUrl ? (
            <img 
              src={status.mediaUrl} 
              alt={status.userName} 
              className="h-full w-full object-cover brightness-75 transition-all hover:brightness-100"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-600 to-orange-800 p-4 text-center">
              <p className="text-[10px] font-bold text-white line-clamp-6">{status.content}</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          
          <div className="absolute left-3 top-3 h-8 w-8 overflow-hidden rounded-full border-2 border-orange-600 bg-neutral-900 ring-2 ring-neutral-900">
            {status.userPhoto ? (
              <img src={status.userPhoto} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-800 text-neutral-500">
                <User size={14} />
              </div>
            )}
          </div>
          
          <span className="absolute bottom-3 left-3 right-3 text-[10px] font-bold text-white truncate">
            {status.userName}
          </span>
          {status.mediaUrl && status.content && (
            <div className="absolute bottom-8 left-3 right-3">
              <p className="text-[8px] font-medium text-white/90 line-clamp-2">{status.content}</p>
            </div>
          )}
        </motion.div>
      ))}

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-neutral-900 p-6 shadow-2xl border border-white/5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Create Story</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {error && (
                  <div className="rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-500 border border-red-500/20">
                    {error}
                  </div>
                )}
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-neutral-800 ring-1 ring-white/5">
                  {mediaPreview ? (
                    mediaFile?.type.startsWith('image') ? (
                      <img src={mediaPreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <video src={mediaPreview} className="h-full w-full object-cover" />
                    )
                  ) : (
                    <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-neutral-500 hover:bg-neutral-700 transition-all">
                      <Camera size={40} />
                      <span className="text-xs font-bold">Select Photo or Video</span>
                      <input type="file" className="hidden" accept="image/*,video/*" onChange={handleMediaChange} />
                    </label>
                  )}
                  {mediaPreview && (
                    <button 
                      onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                      className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full resize-none rounded-xl border border-white/5 bg-neutral-800 p-3 text-sm text-white focus:border-orange-600 focus:outline-none placeholder-neutral-600"
                  rows={3}
                />

                <button 
                  onClick={handleCreateStatus}
                  disabled={loading || (!mediaFile && !content.trim())}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-bold text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'Share Story'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
