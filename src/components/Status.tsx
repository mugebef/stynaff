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
    if (!user || !mediaFile) return;
    setLoading(true);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await addDoc(collection(db, 'statuses'), {
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL || null,
        mediaUrl: mediaPreview, // Simulated upload
        mediaType: mediaFile.type.startsWith('image') ? 'image' : 'video',
        createdAt: serverTimestamp(),
        expiresAt: expiresAt
      });
      setIsModalOpen(false);
      setMediaFile(null);
      setMediaPreview(null);
    } catch (err) {
      console.error(err);
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
        onClick={() => setIsModalOpen(true)}
        className="relative h-48 w-32 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg ring-1 ring-neutral-200"
      >
        <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-50">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="h-full w-full object-cover brightness-75" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 text-neutral-400">
              <User size={24} />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-white p-2 text-center">
            <div className="mx-auto -mt-6 mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white ring-4 ring-white">
              <Plus size={16} />
            </div>
            <span className="text-[10px] font-bold text-neutral-900">Create Story</span>
          </div>
        </div>
      </motion.div>

      {/* Real Statuses */}
      {statuses.map((status) => (
        <motion.div
          key={status.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative h-48 w-32 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg ring-1 ring-neutral-200"
        >
          <img 
            src={status.mediaUrl} 
            alt={status.userName} 
            className="h-full w-full object-cover brightness-75 transition-all hover:brightness-100"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          <div className="absolute left-3 top-3 h-8 w-8 overflow-hidden rounded-full border-2 border-orange-600 bg-white ring-2 ring-white">
            {status.userPhoto ? (
              <img src={status.userPhoto} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
                <User size={14} />
              </div>
            )}
          </div>
          
          <span className="absolute bottom-3 left-3 right-3 text-[10px] font-bold text-white truncate">
            {status.userName}
          </span>
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
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neutral-900">Create Story</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-neutral-200">
                  {mediaPreview ? (
                    mediaFile?.type.startsWith('image') ? (
                      <img src={mediaPreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <video src={mediaPreview} className="h-full w-full object-cover" />
                    )
                  ) : (
                    <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-neutral-400 hover:bg-neutral-200 transition-all">
                      <Camera size={48} />
                      <span className="text-sm font-bold">Select Photo or Video</span>
                      <input type="file" className="hidden" accept="image/*,video/*" onChange={handleMediaChange} />
                    </label>
                  )}
                  {mediaPreview && (
                    <button 
                      onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                      className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                <button 
                  onClick={handleCreateStatus}
                  disabled={loading || !mediaFile}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 text-sm font-bold text-white shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Share to Story'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
