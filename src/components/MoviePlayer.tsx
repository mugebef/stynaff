import React from 'react';
import { X, Play, CreditCard, Lock, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MoviePlayerProps {
  movie: any;
  isTrailer: boolean;
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (movie: any) => void;
  hasAccess: boolean;
}

export const MoviePlayer: React.FC<MoviePlayerProps> = ({ 
  movie, 
  isTrailer, 
  isOpen, 
  onClose, 
  onPurchase,
  hasAccess
}) => {
  if (!movie) return null;

  const videoUrl = isTrailer ? movie.trailerUrl : movie.videoUrl;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-8"
        >
          <button
            onClick={onClose}
            className="absolute right-6 top-6 z-[110] rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-all"
          >
            <X size={32} />
          </button>

          <div className="relative aspect-video w-full max-w-6xl overflow-hidden rounded-[32px] bg-neutral-900 shadow-2xl ring-1 ring-white/10">
            {videoUrl ? (
              <video
                src={videoUrl}
                controls
                autoPlay
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-neutral-500">
                <Info size={64} className="mb-4" />
                <p className="text-xl font-bold">Video not available</p>
              </div>
            )}

            {isTrailer && !hasAccess && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px]">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="flex flex-col items-center gap-6 text-center p-8 rounded-[40px] bg-neutral-900/80 border border-white/10 shadow-2xl max-w-md mx-4"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-600/20 text-orange-500 ring-4 ring-orange-600/10">
                    <Lock size={40} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white mb-2">Want the Full Story?</h3>
                    <p className="text-neutral-400 leading-relaxed">
                      You're watching the trailer. Unlock the full blockbuster experience and support African cinema!
                    </p>
                  </div>
                  <button
                    onClick={() => onPurchase(movie)}
                    className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-orange-600 px-10 py-5 text-xl font-black text-white shadow-[0_20px_50px_rgba(234,88,12,0.4)] hover:bg-orange-700 transition-all active:scale-95"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <CreditCard size={24} />
                    Unlock for {movie.price} Points
                  </button>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    One-time purchase • Lifetime access
                  </p>
                </motion.div>
              </div>
            )}
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
            <h2 className="text-3xl font-black text-white mb-2">{movie.title}</h2>
            <p className="text-neutral-400 max-w-xl line-clamp-2">{movie.description}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
