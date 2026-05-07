import React from 'react';
import { Play, Search, Filter, Star, Clock, User, Plus, Film, Lock, CreditCard, PlayCircle, Info, Pencil, Trash2, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadMovie } from './UploadMovie';
import { MoviePlayer } from './MoviePlayer';
import { User as UserType } from '../types';
import { getMediaSource } from '../utils';

interface BlockbusterProps {
  movies: any[];
  currentUser: UserType | null;
  onUpload?: (data: any) => Promise<void>;
  onUpdateMovie?: (movieId: string, updates: any) => Promise<void>;
  onDeleteMovie?: (movieId: string) => Promise<void>;
  onPurchase?: (movieId: string, price: number) => Promise<void>;
  onDeposit?: () => void;
}

export const Blockbuster: React.FC<BlockbusterProps> = ({ movies, currentUser, onUpload, onUpdateMovie, onDeleteMovie, onPurchase, onDeposit }) => {
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [editingMovie, setEditingMovie] = React.useState<any | null>(null);
  const [selectedMovie, setSelectedMovie] = React.useState<any | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = React.useState(false);
  const [isTrailerMode, setIsTrailerMode] = React.useState(false);
  const [activeReelIndex, setActiveReelIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const isAdmin = currentUser?.role === 'admin';

  const hasAccess = (movie: any) => {
    if (!currentUser) return false;
    if (isAdmin) return true;
    if (!movie.price || movie.price === 0) return true;
    return currentUser.purchasedMovies?.includes(movie.id);
  };

  const handlePurchaseClick = (movie: any) => {
    if (!currentUser) return;
    if ((currentUser.points || 0) < movie.price) {
      if (window.confirm(`You need ${movie.price} points to watch this movie. You currently have ${currentUser.points || 0} points. Would you like to deposit points now?`)) {
        onDeposit?.();
      }
      return;
    }
    onPurchase?.(movie.id, movie.price);
  };

  const openPlayer = (movie: any, trailer: boolean) => {
    setSelectedMovie(movie);
    setIsTrailerMode(trailer);
    setIsPlayerOpen(true);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const height = e.currentTarget.clientHeight;
    const index = Math.round(scrollTop / height);
    if (index !== activeReelIndex) {
      setActiveReelIndex(index);
    }
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black"
    >
      {movies.length === 0 ? (
        <div className="h-full w-full flex flex-col items-center justify-center text-center p-10">
          <Film size={80} className="mb-8 text-neutral-800" />
          <h2 className="text-4xl font-black text-neutral-700 uppercase italic tracking-tighter">Cinema Is Empty</h2>
          <p className="mt-4 text-neutral-500 max-w-xs font-bold uppercase tracking-widest text-xs">Our directors are busy working on new masterpieces. Check back soon!</p>
          {isAdmin && (
            <button 
              onClick={() => setIsUploadOpen(true)}
              className="mt-10 flex items-center gap-3 rounded-full bg-orange-600 px-10 py-5 text-xl font-black text-white shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={24} strokeWidth={4} />
              Release Movie
            </button>
          )}
        </div>
      ) : (
        movies.map((movie, index) => (
          <section 
            key={`blockbuster-movie-${movie.id || index}-${index}`}
            className="relative h-full w-full snap-start overflow-hidden flex flex-col bg-black"
          >
            {/* Background Content */}
            <div className="absolute inset-0 z-0">
              <img
                src={getMediaSource(movie.thumbnailUrl)}
                alt={movie.title}
                className={`h-full w-full object-cover transition-all duration-[2s] ${activeReelIndex === index ? 'opacity-60 scale-110' : 'opacity-100 scale-100'}`}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            </div>

            {/* Content Overlay - Only fully seen when active */}
            <AnimatePresence>
              {activeReelIndex === index && (
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="relative z-10 h-full w-full flex flex-col justify-end p-8 md:p-16 pb-24 md:pb-32"
                >
                  <div className="space-y-6 md:space-y-8 max-w-5xl">
                    <div className="flex items-center gap-4">
                      <div className="h-[3px] w-12 bg-orange-600 rounded-full"></div>
                      <div className="flex items-center gap-2 rounded-full bg-orange-600 px-4 py-1.5 shadow-lg shadow-orange-900/40">
                        <Star size={14} className="text-white" fill="currentColor" />
                        <span className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] text-white">
                          GLOBAL PREMIERE
                        </span>
                      </div>
                    </div>

                    <h2 
                      className="text-4xl md:text-7xl font-black italic uppercase leading-[0.85] tracking-tighter text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                      style={{ fontStretch: 'extra-condensed' }}
                    >
                      {movie.title}
                    </h2>

                    <p className="text-base md:text-2xl font-bold text-neutral-300 tracking-tight max-w-2xl">
                      {movie.genre || 'Epic Feature Presentation'}
                    </p>

                    <div className="flex items-center gap-3 md:gap-6 pt-3 md:pt-4">
                      <button 
                        onClick={() => {
                          if (hasAccess(movie)) {
                            openPlayer(movie, false);
                          } else {
                            handlePurchaseClick(movie);
                          }
                        }}
                        className="flex items-center gap-3 md:gap-4 rounded-xl md:rounded-[1.5rem] bg-white px-5 py-3 md:px-10 md:py-5 text-xs md:text-lg font-black text-black hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.2)]"
                      >
                        <Play size={16} className="md:w-6 md:h-6" fill="currentColor" />
                        <span>Play Now</span>
                      </button>

                      <button 
                        onClick={() => openPlayer(movie, true)}
                        className="flex items-center gap-3 md:gap-4 rounded-xl md:rounded-[1.5rem] bg-neutral-950/60 backdrop-blur-2xl border border-white/10 px-5 py-3 md:px-8 md:py-5 text-xs md:text-lg font-black text-white hover:bg-neutral-900 transition-all active:scale-95 shadow-2xl"
                      >
                        <Info size={16} className="md:w-6 md:h-6" />
                        <span>Info</span>
                      </button>

                      {isAdmin && (
                        <div className="flex gap-2 md:gap-3">
                           <button 
                              onClick={() => setEditingMovie(movie)}
                              className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-lg md:rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all shadow-xl"
                            >
                              <Pencil size={14} className="md:w-6 md:h-6" />
                            </button>
                            <button 
                              onClick={() => onDeleteMovie?.(movie.id)}
                              className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-lg md:rounded-2xl bg-red-600/20 border border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-xl"
                            >
                              <Trash2 size={14} className="md:w-6 md:h-6" />
                            </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title overlay for inactive items (cleaner look when below) */}
            <AnimatePresence>
              {activeReelIndex !== index && (
                <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="absolute inset-x-0 bottom-0 z-10 p-12 bg-gradient-to-t from-black via-black/40 to-transparent"
                >
                  <h3 className="text-3xl md:text-6xl font-black italic uppercase tracking-tighter text-white opacity-60">
                    {movie.title}
                  </h3>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Premium Badge */}
            {movie.price > 0 && (
              <div className="absolute top-10 right-10 z-20 rounded-[1.5rem] bg-black/80 backdrop-blur-xl px-6 py-3 border border-white/20 shadow-2xl">
                <span className="text-[12px] md:text-lg font-black uppercase tracking-[0.3em] text-white">PREMIUM</span>
              </div>
            )}
          </section>
        ))
      )}

      {/* Global Controls Overlay */}
      <div className="fixed top-24 left-6 md:top-32 md:left-16 z-50 pointer-events-none">
        <h1 className="text-2xl md:text-6xl font-black italic uppercase tracking-tighter text-white/50 leading-none">
          STYN <span className="text-orange-600/50">Cinema</span>
        </h1>
      </div>

      <div className="fixed top-24 right-6 md:top-32 md:right-16 z-50 flex gap-4">
        {isAdmin && (
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="flex h-12 w-12 md:h-20 md:w-20 items-center justify-center rounded-2xl md:rounded-[32px] bg-orange-600 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all ring-4 ring-black"
          >
            <Plus size={24} className="md:w-10 md:h-10" strokeWidth={4} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {(isUploadOpen || !!editingMovie) && (
          <UploadMovie 
            isOpen={true} 
            onClose={() => {
              setIsUploadOpen(false);
              setEditingMovie(null);
            }} 
            onUpload={onUpload || (async () => {})}
            onUpdate={onUpdateMovie}
            initialData={editingMovie || undefined}
          />
        )}
      </AnimatePresence>

      <MoviePlayer
        movie={selectedMovie}
        isTrailer={isTrailerMode}
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
        onPurchase={handlePurchaseClick}
        hasAccess={selectedMovie ? hasAccess(selectedMovie) : false}
      />
    </div>
  );
};
