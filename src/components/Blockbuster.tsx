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
            className="relative h-full w-full snap-start overflow-hidden flex flex-col items-center justify-center p-3 md:p-10"
          >
            {/* Background Parallax-like Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={getMediaSource(movie.thumbnailUrl)}
                alt=""
                className={`h-full w-full object-cover transition-opacity duration-1000 ${activeReelIndex === index ? 'opacity-30 scale-110' : 'opacity-10 scale-100'}`}
                style={{ filter: 'blur(40px)' }}
              />
              <div className="absolute inset-0 bg-black/60"></div>
            </div>

            {/* The Movie Card */}
            <motion.div 
              style={{
                scale: activeReelIndex === index ? 1 : 0.9,
                opacity: activeReelIndex === index ? 1 : 0.5,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative h-[85%] w-full max-w-4xl rounded-[2.5rem] md:rounded-[4rem] overflow-hidden bg-neutral-900 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] flex flex-col group"
            >
              {/* Poster Image */}
              <div className="absolute inset-0 z-0">
                <img
                  src={getMediaSource(movie.thumbnailUrl)}
                  alt={movie.title}
                  className="h-full w-full object-cover transition-transform duration-[3s] group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
              </div>

              {/* Card Header Labels */}
              <div className="absolute top-6 left-6 right-6 flex items-start justify-between z-20">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md px-3 py-1 border border-white/10 w-fit">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                      {movie.genre || 'Exclusive'}
                    </span>
                  </div>
                  {movie.isGlobalPremiere !== false && (
                    <div className="flex items-center gap-1.5 rounded-full bg-orange-600 px-3 py-1 shadow-lg shadow-orange-900/40 w-fit">
                      <Star size={10} className="text-white" fill="currentColor" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-white">Global Premiere</span>
                    </div>
                  )}
                </div>
                
                {movie.price > 0 && (
                  <div className="rounded-2xl bg-neutral-950/90 backdrop-blur-xl px-4 py-2 border border-white/20 shadow-2xl">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Premium</span>
                  </div>
                )}
              </div>

              {/* Bottom Content Area */}
              <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 md:p-12 pb-8 md:pb-16 bg-gradient-to-t from-black via-transparent to-transparent">
                <div className="space-y-4 md:space-y-6">
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={activeReelIndex === index ? { opacity: 1, y: 0 } : {}}
                    className="text-4xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter uppercase italic text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                    style={{ fontStretch: 'condensed' }}
                  >
                    {movie.title}
                  </motion.h2>

                  <div className="flex flex-wrap items-center gap-3 md:gap-6 pt-2">
                    <button 
                      onClick={() => {
                        if (hasAccess(movie)) {
                          openPlayer(movie, false);
                        } else {
                          handlePurchaseClick(movie);
                        }
                      }}
                      className="group flex items-center justify-center gap-3 md:gap-4 rounded-2xl md:rounded-[2.5rem] bg-white px-6 py-3.5 md:px-12 md:py-5 text-sm md:text-xl font-black uppercase tracking-widest text-black hover:scale-105 transition-all active:scale-95 shadow-xl"
                    >
                      <Play size={18} className="md:w-6 md:h-6" fill="currentColor" />
                      <span>{hasAccess(movie) ? 'Play Now' : `Unlock for $${movie.price}`}</span>
                    </button>

                    <button 
                      onClick={() => openPlayer(movie, true)}
                      className="flex items-center justify-center gap-3 md:gap-4 rounded-2xl md:rounded-[2.5rem] bg-neutral-900/60 backdrop-blur-xl border border-white/10 px-6 py-3.5 md:px-12 md:py-5 text-sm md:text-xl font-black uppercase tracking-widest text-white hover:bg-neutral-900 transition-all active:scale-95 shadow-xl"
                    >
                      <Info size={18} className="md:w-6 md:h-6" />
                      <span className="hidden md:inline">Information</span>
                      <span className="md:hidden">Info</span>
                    </button>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-orange-500" />
                      <span>{movie.duration || '2h 15m'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star size={12} className="text-yellow-500" fill="currentColor" />
                      <span className="text-white">4.9 Rating</span>
                    </div>
                  </div>
                </div>

                {/* Coming Soon / Release Info */}
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Available in HD</span>
                   </div>
                   {isAdmin && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingMovie(movie)}
                          className="p-2 rounded-xl bg-white/5 text-white hover:bg-orange-600 transition-all border border-white/10"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => onDeleteMovie?.(movie.id)}
                          className="p-2 rounded-xl bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all border border-red-500/20"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                </div>
              </div>
            </motion.div>
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
