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
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black pb-[10dvh]"
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
            className="relative h-[90dvh] w-full snap-center overflow-hidden flex flex-col items-center justify-center p-4 md:p-8"
          >
            <div className="relative h-full w-full max-w-5xl rounded-[3rem] md:rounded-[4rem] overflow-hidden bg-neutral-900 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
              {/* Background Content */}
              <div className="absolute inset-0 z-0">
                <img
                  src={getMediaSource(movie.thumbnailUrl)}
                  alt={movie.title}
                  className="h-full w-full object-cover transition-transform duration-[2s] hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
              </div>

              {/* Top Badges */}
              <div className="absolute top-8 left-8 right-8 flex items-start justify-between z-20">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 drop-shadow-md">
                    {movie.genre || 'Epic Feature'}
                  </span>
                  {movie.isGlobalPremiere !== false && (
                    <div className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-3 py-1 border border-white/10 w-fit">
                      <Star size={10} className="text-yellow-400" fill="currentColor" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-white">Global Premiere</span>
                    </div>
                  )}
                </div>
                
                {movie.price > 0 && (
                  <div className="rounded-2xl bg-neutral-950/80 backdrop-blur-xl px-5 py-2.5 border border-white/20 shadow-2xl">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Premium</span>
                  </div>
                )}
              </div>

              {/* Movie Content UI */}
              <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 md:p-16 pb-12 md:pb-20">
                <div className="max-w-4xl space-y-6 md:space-y-10">
                  <motion.h2 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-8xl lg:text-9xl font-black leading-[0.85] tracking-tighter uppercase italic text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                    style={{ fontFamily: 'var(--font-sans)', fontStretch: 'extra-condensed' }}
                  >
                    {movie.title}
                  </motion.h2>

                  <div className="flex flex-wrap items-center gap-4 md:gap-8 pt-2">
                    <button 
                      onClick={() => {
                        if (hasAccess(movie)) {
                          openPlayer(movie, false);
                        } else {
                          handlePurchaseClick(movie);
                        }
                      }}
                      className="group flex items-center justify-center gap-4 rounded-[1.5rem] md:rounded-[2rem] bg-white px-8 py-4 md:px-14 md:py-6 text-sm md:text-2xl font-black uppercase tracking-widest text-black hover:scale-105 transition-all active:scale-95 shadow-xl"
                    >
                      <Play size={20} className="md:w-8 md:h-8" fill="currentColor" />
                      <span>Play</span>
                    </button>

                    <button 
                      onClick={() => openPlayer(movie, true)}
                      className="flex items-center justify-center gap-4 rounded-[1.5rem] md:rounded-[2rem] bg-neutral-950/50 backdrop-blur-xl border border-white/10 px-8 py-4 md:px-14 md:py-6 text-sm md:text-2xl font-black uppercase tracking-widest text-white hover:bg-neutral-900 transition-all active:scale-95 shadow-xl"
                    >
                      <Info size={20} className="md:w-8 md:h-8" />
                      <span>Info</span>
                    </button>

                    {isAdmin && (
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setEditingMovie({ 
                            id: movie.id, 
                            title: movie.title, 
                            description: movie.description, 
                            price: movie.price,
                            thumbnailUrl: movie.thumbnailUrl,
                            videoUrl: movie.videoUrl,
                            trailerUrl: movie.trailerUrl,
                            genre: movie.genre,
                            duration: movie.duration
                          })}
                          className="flex h-12 w-12 md:h-20 md:w-20 items-center justify-center rounded-2xl md:rounded-[2rem] bg-white/5 border border-white/10 text-white hover:bg-orange-600 transition-all active:scale-95"
                        >
                          <Pencil size={20} className="md:w-8 md:h-8" />
                        </button>
                        <button 
                          onClick={() => onDeleteMovie?.(movie.id)}
                          className="flex h-12 w-12 md:h-20 md:w-20 items-center justify-center rounded-2xl md:rounded-[2rem] bg-red-600 border border-red-500 shadow-lg shadow-red-900/20 text-white hover:bg-red-700 transition-all active:scale-95"
                        >
                          <Trash2 size={20} className="md:w-8 md:h-8" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full text-center">
                   <span className="text-[14px] md:text-2xl font-black uppercase tracking-[0.5em] text-white/50 drop-shadow-md italic">
                     Coming Soon
                   </span>
                </div>
              </div>
            </div>
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
