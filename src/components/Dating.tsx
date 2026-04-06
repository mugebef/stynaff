import React from 'react';
import { Heart, X, MapPin, User as UserIcon, CheckCircle, Info, Star, ShieldCheck, Loader2 } from 'lucide-react';
import { User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface DatingProps {
  currentUser: User;
}

export const Dating: React.FC<DatingProps> = ({ currentUser }) => {
  const [matches, setMatches] = React.useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [direction, setDirection] = React.useState<null | 'left' | 'right'>(null);

  React.useEffect(() => {
    const fetchMatches = async () => {
      try {
        // Simple matching logic: different gender, similar age, nearby (if location exists)
        const q = query(
          collection(db, 'users'),
          where('uid', '!=', currentUser.uid),
          limit(20)
        );
        const snap = await getDocs(q);
        const potentialMatches = snap.docs.map(d => d.data() as User)
          .filter(u => {
            // Basic filtering
            const genderMatch = !currentUser.interestedIn || u.gender === currentUser.interestedIn;
            const ageMatch = !currentUser.age || !u.age || Math.abs(u.age - currentUser.age) <= 10;
            return genderMatch && ageMatch;
          });
        setMatches(potentialMatches);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [currentUser]);

  const handleSwipe = (dir: 'left' | 'right') => {
    setDirection(dir);
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setDirection(null);
    }, 300);
  };

  if (loading) return <div className="p-12 text-center">Finding your matches...</div>;

  if (currentIndex >= matches.length) {
    return (
      <div className="flex h-[80vh] items-center justify-center rounded-3xl bg-white p-12 text-center shadow-xl ring-1 ring-neutral-200">
        <div className="max-w-sm">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <Heart size={48} className="animate-pulse" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-neutral-900">No more matches!</h2>
          <p className="text-neutral-500">Check back later or expand your search criteria to find more people nearby.</p>
          <button 
            onClick={() => setCurrentIndex(0)}
            className="mt-8 rounded-xl bg-orange-600 px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-orange-700 transition-all active:scale-95"
          >
            Refresh Matches
          </button>
        </div>
      </div>
    );
  }

  const currentMatch = matches[currentIndex];

  return (
    <div className="mx-auto max-w-md space-y-8 pb-12">
      <div className="flex items-center justify-between px-4">
        <h1 className="text-3xl font-bold text-neutral-900">Dating</h1>
        <div className="flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-600">
          <Star size={18} />
          Premium Match
        </div>
      </div>

      {/* Tinder Card */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2.5rem] bg-neutral-100 shadow-2xl ring-1 ring-neutral-200">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMatch.uid}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              x: direction === 'left' ? -500 : direction === 'right' ? 500 : 0,
              rotate: direction === 'left' ? -20 : direction === 'right' ? 20 : 0
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {currentMatch.photoURL ? (
              <img src={currentMatch.photoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-200 text-neutral-400">
                <UserIcon size={120} />
              </div>
            )}

            {/* Info Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold">{currentMatch.displayName}, {currentMatch.age || '??'}</h2>
                {currentMatch.isVerified && <CheckCircle size={24} className="fill-blue-500 text-white" />}
                {currentMatch.tier === 'Platinum' && <ShieldCheck size={24} className="text-orange-400" />}
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-white/80">
                <MapPin size={16} />
                <span>{currentMatch.location?.city || 'Nearby'}, {currentMatch.location?.country || 'SA'}</span>
              </div>
              <p className="mt-4 text-sm line-clamp-2 text-white/90">{currentMatch.bio || "No bio provided."}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-6">
        <button 
          onClick={() => handleSwipe('left')}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-red-500 shadow-xl ring-1 ring-neutral-200 hover:bg-red-50 transition-all active:scale-90"
        >
          <X size={32} />
        </button>
        <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-400 shadow-xl ring-1 ring-neutral-200 hover:bg-blue-50 transition-all active:scale-90">
          <Info size={24} />
        </button>
        <button 
          onClick={() => handleSwipe('right')}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-green-500 shadow-xl ring-1 ring-neutral-200 hover:bg-green-50 transition-all active:scale-90"
        >
          <Heart size={32} className="fill-current" />
        </button>
      </div>
    </div>
  );
};
