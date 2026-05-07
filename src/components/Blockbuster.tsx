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
        <div className="h-full w-full flex flex-col items-center justify-center text-center p-10 mt-[-84px]">
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
            className="relative h-full w-full snap-start overflow-hidden flex flex-col bg-neutral-950"
          >
            {/* Background Content */}
            <div className="absolute inset-0 z-0">
              <img
                src={getMediaSource(movie.thumbnailUrl)}
                alt={movie.title}
                className="h-full w-full object-cover opacity-40 blur-0"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
            </div>

            {/* Movie Content UI */}
            <div className="relative z-10 h-full w-full flex flex-col justify-end p-6 md:p-16 pb-24 md:pb-32">
              <div className="max-w-4xl space-y-4 md:space-y-8">
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-4"
                >
                  <div className="h-1 w-12 md:w-24 bg-orange-600 rounded-full"></div>
                  <span className="text-[10px] md:text-xl font-black text-orange-500 uppercase tracking-[0.2em] md:tracking-[0.4em]">
                    {movie.genre || 'Epic Feature'}
                  </span>
                </motion.div>

                <motion.h2 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl md:text-7xl lg:text-8xl font-black leading-[1.1] md:leading-[0.9] tracking-tighter uppercase italic text-white drop-shadow-2xl"
                >
                  {movie.title}
                </motion.h2>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap items-center gap-3 md:gap-8 text-[10px] md:text-lg font-bold uppercase tracking-widest text-neutral-400"
                >
                  <div className="flex items-center gap-2">
                    <Star size={14} className="md:w-5 md:h-5 text-yellow-400" fill="currentColor" />
                    <span className="text-white">{movie.rating || '4.9'}</span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-neutral-800"></div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="md:w-5 md:h-5" />
                    <span>{movie.duration || '2h 15m'}</span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-neutral-800"></div>
                  <div className="flex items-center gap-2">
                    <DollarSign size={14} className="md:w-5 md:h-5" />
                    <span>$0.00 FREE</span>
                  </div>
                </motion.div>

                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="max-w-2xl text-[12px] md:text-xl leading-relaxed text-neutral-300 font-medium line-clamp-3 md:line-clamp-4"
                >
                  {movie.description || "An epic cinematic journey into the unknown. Witness the unfolding of an extraordinary tale that challenges everything you thought you knew."}
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap items-center gap-3 md:gap-6 pt-4 md:pt-10"
                >
                  <button 
                    onClick={() => {
                      if (hasAccess(movie)) {
                        openPlayer(movie, false);
                      } else {
                        handlePurchaseClick(movie);
                      }
                    }}
                    className="group relative flex items-center gap-3 md:gap-6 overflow-hidden rounded-2xl md:rounded-[40px] bg-white px-6 py-4 md:px-16 md:py-8 text-sm md:text-3xl font-black text-black shadow-[0_20px_60px_rgba(255,255,255,0.3)] hover:scale-105 transition-all active:scale-95"
                  >
                    <Play size={18} className="md:w-8 md:h-8" fill="currentColor" />
                    <span>{hasAccess(movie) ? 'Watch Now' : `Unlock for $${movie.price}`}</span>
                  </button>

                  {movie.trailerUrl && (
                    <button 
                      onClick={() => openPlayer(movie, true)}
                      className="flex items-center gap-3 md:gap-6 rounded-2xl md:rounded-[40px] border-2 border-white/20 bg-white/5 px-6 py-4 md:px-16 md:py-8 text-sm md:text-3xl font-black text-white backdrop-blur-3xl hover:bg-white/10 transition-all active:scale-95"
                    >
                      <PlayCircle size={18} className="md:w-8 md:h-8" />
                      Trailer
                    </button>
                  )}

                  <div className="flex gap-3">
                    {isAdmin && (
                      <>
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
                          className="flex h-12 w-12 md:h-20 md:w-20 items-center justify-center rounded-2xl md:rounded-[40px] bg-neutral-900 border border-white/10 text-white hover:bg-orange-600 transition-all active:scale-95 shadow-2xl"
                        >
                          <Pencil size={18} className="md:w-8 md:h-8" />
                        </button>
                        <button 
                          onClick={() => onDeleteMovie?.(movie.id)}
                          className="flex h-12 w-12 md:h-20 md:w-20 items-center justify-center rounded-2xl md:rounded-[40px] bg-red-600/20 border border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-2xl"
                        >
                          <Trash2 size={18} className="md:w-8 md:h-8" />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Scroll Indicator */}
            {index < movies.length - 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-bounce">
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Next Feature</span>
                <Clock size={20} />
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
