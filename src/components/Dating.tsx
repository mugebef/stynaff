import React from 'react';
import { Heart, X, MapPin, User as UserIcon, CheckCircle, Info, Star, ShieldCheck, Loader2, MessageSquare, Sparkles } from 'lucide-react';
import { User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface DatingProps {
  currentUser: User;
  onSwipe: (targetUid: string, direction: 'left' | 'right') => Promise<boolean>;
}

export const Dating: React.FC<DatingProps> = ({ currentUser, onSwipe }) => {
  const [matches, setMatches] = React.useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [direction, setDirection] = React.useState<null | 'left' | 'right'>(null);
  const [showMatchModal, setShowMatchModal] = React.useState<User | null>(null);

  React.useEffect(() => {
    const fetchMatches = async () => {
      try {
        // Filter out users already swiped
        const swiped = [...(currentUser.swipedLeft || []), ...(currentUser.swipedRight || [])];
        
        const q = query(
          collection(db, 'users'),
          where('uid', '!=', currentUser.uid),
          limit(50)
        );
        const snap = await getDocs(q);
        const potentialMatches = snap.docs
          .map(d => d.data() as User)
          .filter(u => !swiped.includes(u.uid))
          .filter(u => {
            // Strict gender matching: Male <-> Female
            if (currentUser.gender === 'Male') {
              return u.gender === 'Female';
            } else if (currentUser.gender === 'Female') {
              return u.gender === 'Male';
            }
            // If user gender is not set or 'Other', show based on interestedIn or everyone
            const genderMatch = !currentUser.interestedIn || currentUser.interestedIn === 'Everyone' || u.gender === currentUser.interestedIn;
            return genderMatch;
          })
          .filter(u => {
            const ageMatch = !currentUser.age || !u.age || Math.abs(u.age - currentUser.age) <= 15;
            return ageMatch;
          })
          .filter(u => {
            // Match by city and country if set
            if (currentUser.location?.country && u.location?.country) {
              if (currentUser.location.country !== u.location.country) return false;
            }
            if (currentUser.location?.city && u.location?.city) {
              if (currentUser.location.city !== u.location.city) return false;
            }
            return true;
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

  const handleSwipeAction = async (dir: 'left' | 'right') => {
    const target = matches[currentIndex];
    if (!target) return;

    setDirection(dir);
    const isMatch = await onSwipe(target.uid, dir);
    
    if (isMatch) {
      setShowMatchModal(target);
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setDirection(null);
    }, 300);
  };

  if (loading) return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">Finding your perfect match...</p>
    </div>
  );

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
          <Sparkles size={18} />
          AI Compatibility
        </div>
      </div>

      {/* Tinder Card */}
      <div 
        onClick={() => window.dispatchEvent(new CustomEvent('viewProfile', { detail: currentMatch.uid }))}
        className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-[2.5rem] bg-neutral-100 shadow-2xl ring-1 ring-neutral-200"
      >
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
              <img src={currentMatch.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
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
              
              {/* Interests */}
              {currentMatch.interests && currentMatch.interests.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {currentMatch.interests.slice(0, 3).map((interest, i) => (
                    <span key={i} className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase backdrop-blur-md">
                      {interest}
                    </span>
                  ))}
                </div>
              )}
              
              <p className="mt-4 text-sm line-clamp-2 text-white/90">{currentMatch.bio || "No bio provided."}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-6">
        <button 
          onClick={() => handleSwipeAction('left')}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-red-500 shadow-xl ring-1 ring-neutral-200 hover:bg-red-50 transition-all active:scale-90"
        >
          <X size={32} />
        </button>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('changeMenu', { 
            detail: { menu: 'chat', targetUser: currentMatch }
          }))}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#00a884] shadow-xl ring-1 ring-neutral-200 hover:bg-green-50 transition-all active:scale-90"
        >
          <MessageSquare size={28} />
        </button>
        <button 
          onClick={() => handleSwipeAction('right')}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-green-500 shadow-xl ring-1 ring-neutral-200 hover:bg-green-50 transition-all active:scale-90"
        >
          <Heart size={32} className="fill-current" />
        </button>
      </div>

      {/* Match Modal */}
      <AnimatePresence>
        {showMatchModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm text-center"
            >
              <div className="mb-8 flex justify-center -space-x-8">
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-2xl">
                  <img src={currentUser.photoURL} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-2xl">
                  <img src={showMatchModal.photoURL} alt="" className="h-full w-full object-cover" />
                </div>
              </div>
              
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mb-6 inline-block rounded-full bg-orange-600 px-6 py-2 text-sm font-bold text-white shadow-xl shadow-orange-600/20"
              >
                IT'S A MATCH!
              </motion.div>
              
              <h2 className="mb-4 text-3xl font-bold text-white">You and {showMatchModal.displayName} liked each other!</h2>
              <p className="mb-8 text-white/60">Start a conversation now and see where it leads.</p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    setShowMatchModal(null);
                    // Trigger menu change to chat with target user
                    window.dispatchEvent(new CustomEvent('changeMenu', { 
                      detail: { menu: 'chat', targetUser: showMatchModal }
                    }));
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 text-sm font-bold text-white shadow-xl shadow-orange-600/20 hover:bg-orange-700 transition-all active:scale-95"
                >
                  <MessageSquare size={20} />
                  Send a Message
                </button>
                <button 
                  onClick={() => setShowMatchModal(null)}
                  className="w-full rounded-2xl bg-white/10 py-4 text-sm font-bold text-white hover:bg-white/20 transition-all"
                >
                  Keep Swiping
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
