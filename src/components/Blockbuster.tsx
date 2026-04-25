import React from 'react';
import { Play, Search, Filter, Star, Clock, User, Plus, Film, Lock, CreditCard, PlayCircle, Info, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadMovie } from './UploadMovie';
import { MoviePlayer } from './MoviePlayer';
import { User as UserType } from '../types';

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
  const [showTrailer, setShowTrailer] = React.useState(true);

  const isAdmin = currentUser?.role === 'admin';
  const featuredMovie = movies.length > 0 ? movies[0] : null;
  
  // Get recently added movies (limit to 6, sorted by createdAt)
  const recentlyAdded = [...movies].sort((a, b) => {
    const dateA = a.createdAt?.seconds || 0;
    const dateB = b.createdAt?.seconds || 0;
    return dateB - dateA;
  }).slice(0, 6);

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:py-8 relative">
      <div className="mb-6 md:mb-12 flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white">Cinema</h2>
        </div>
        <div className="flex gap-2 md:gap-4">
          <button className="rounded-full bg-neutral-900 p-2.5 md:p-4 text-neutral-500 hover:bg-orange-600/10 hover:text-orange-500 transition-all border border-white/5">
            <Search size={20} className="md:w-6 md:h-6" />
          </button>
          <button className="rounded-full bg-neutral-900 p-2.5 md:p-4 text-neutral-500 hover:bg-orange-600/10 hover:text-orange-500 transition-all border border-white/5">
            <Filter size={20} className="md:w-6 md:h-6" />
          </button>
        </div>
      </div>

      {/* Featured Movie */}
      <div className="group relative mb-8 md:mb-16 aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden rounded-2xl md:rounded-[40px] bg-neutral-950 shadow-2xl border border-white/5">
        {featuredMovie?.trailerUrl && showTrailer ? (
          <video
            src={featuredMovie.trailerUrl}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover opacity-60 transition-all duration-1000 scale-105 group-hover:scale-100"
            onEnded={() => setShowTrailer(false)}
          />
        ) : (
          <img
            src={featuredMovie?.thumbnailUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=2000"}
            alt="Featured Movie"
            className="h-full w-full object-cover opacity-80 transition-all duration-1000 scale-105 group-hover:scale-100"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/80 via-transparent to-transparent hidden md:block"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-12 text-white z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-orange-500 mb-2 md:mb-6"
          >
            <div className="h-1 w-8 md:w-12 bg-orange-600 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Star size={12} className="md:w-4 md:h-4" fill="currentColor" />
              {featuredMovie ? 'Featured Movie' : 'Coming Soon'}
            </div>
          </motion.div>
          
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-5xl lg:text-7xl font-black leading-tight md:leading-none tracking-tighter uppercase italic"
          >
            {featuredMovie?.title || "The African Dream"}
          </motion.h3>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-2 md:mt-8 max-w-2xl text-xs md:text-lg leading-relaxed text-neutral-400 font-medium line-clamp-2 md:line-clamp-none"
          >
            {featuredMovie?.description || "An epic journey across the continent, exploring the beauty, culture, and resilience of the African spirit."}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 md:mt-12 flex flex-wrap gap-2 md:gap-6"
          >
            {featuredMovie && (
              <>
                <button 
                  onClick={() => {
                    if (hasAccess(featuredMovie)) {
                      openPlayer(featuredMovie, false);
                    } else {
                      handlePurchaseClick(featuredMovie);
                    }
                  }}
                  className="group relative flex items-center gap-2 md:gap-4 overflow-hidden rounded-full bg-orange-600 px-4 py-2 md:px-12 md:py-6 text-xs md:text-xl font-black text-white shadow-[0_20px_50px_rgba(234,88,12,0.4)] hover:bg-orange-700 transition-all active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  <Play size={16} className="md:w-7 md:h-7" fill="currentColor" />
                  <span className="hidden md:inline">{hasAccess(featuredMovie) ? 'Watch Full Movie' : `Unlock for $${featuredMovie.price}`}</span>
                  <span className="md:hidden">{hasAccess(featuredMovie) ? 'Watch' : `$${featuredMovie.price}`}</span>
                </button>
                
                {featuredMovie.trailerUrl && (
                  <button 
                    onClick={() => openPlayer(featuredMovie, true)}
                    className="flex items-center gap-2 md:gap-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 md:px-12 md:py-6 text-xs md:text-xl font-black text-white backdrop-blur-xl hover:bg-white/10 transition-all active:scale-95"
                  >
                    <PlayCircle size={16} className="md:w-7 md:h-7" />
                    Trailer
                  </button>
                )}
              </>
            )}
            <button className="flex items-center gap-2 md:gap-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 md:px-12 md:py-6 text-xs md:text-xl font-black text-white backdrop-blur-xl hover:bg-white/10 transition-all active:scale-95">
              <Info size={16} className="md:w-7 md:h-7" />
              Info
            </button>
          </motion.div>
        </div>
      </div>
      
      {/* Recently Added Section */}
      <div className="mb-12 md:mb-20">
        <div className="flex items-center gap-2 md:gap-4 mb-6 md:mb-10">
          <div className="h-2 w-2 rounded-full bg-orange-600 animate-pulse"></div>
          <h3 className="text-lg md:text-2xl font-black uppercase tracking-widest text-white">Recently Added</h3>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-orange-600/50 to-transparent"></div>
        </div>
        
        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 md:pb-8 no-scrollbar -mx-4 px-4">
          {recentlyAdded.map((movie) => (
            <motion.div
              key={`recent-${movie.id}`}
              whileHover={{ y: -5 }}
              className="relative min-w-[200px] md:min-w-[280px] group cursor-pointer"
              onClick={() => {
                if (hasAccess(movie)) {
                  openPlayer(movie, false);
                } else if (movie.trailerUrl) {
                  openPlayer(movie, true);
                } else {
                  handlePurchaseClick(movie);
                }
              }}
            >
              <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl bg-neutral-900 border border-white/5 group-hover:border-orange-600/50 transition-all">
                <img
                  src={movie.thumbnailUrl}
                  alt={movie.title}
                  className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3 rounded-lg bg-orange-600 px-2 py-1 text-[8px] font-black text-white uppercase tracking-widest">
                  New Release
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="rounded-full bg-orange-600 p-3 text-white">
                    <Play size={20} fill="currentColor" />
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingMovie({
                            id: movie.id,
                            title: movie.title,
                            description: movie.description,
                            price: movie.price
                          });
                        }}
                        className="rounded-full bg-neutral-800 p-3 text-white hover:bg-orange-600 transition-all shadow-xl"
                      >
                        <Pencil size={20} />
                      </div>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMovie?.(movie.id);
                        }}
                        className="rounded-full bg-red-600 p-3 text-white hover:bg-red-700 transition-all shadow-xl"
                      >
                        <Trash2 size={20} />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="absolute bottom-4 left-4 right-4">
                  <h4 className="text-lg font-bold text-white leading-tight mb-1 truncate">{movie.title}</h4>
                  <div className="flex items-center gap-3 text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                    <span>{movie.genre || 'Action'}</span>
                    <span className="h-1 w-1 rounded-full bg-orange-600"></span>
                    <span>${movie.price}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Movie Grid */}
      <div className="mb-6 md:mb-10 flex items-center gap-4">
        <h3 className="text-xl md:text-2xl font-black uppercase tracking-widest text-white">Full Library</h3>
        <div className="h-[1px] flex-1 bg-neutral-800"></div>
      </div>
      <div className="grid gap-4 md:gap-10 grid-cols-2 lg:grid-cols-4">
        {movies.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <Film size={40} className="mx-auto mb-4 text-neutral-700 md:w-12 md:h-12" />
            <p className="text-lg md:text-xl font-bold text-neutral-500">No movies found.</p>
          </div>
        ) : (
          movies.map((movie) => (
            <div 
              key={movie.id} 
              className="group cursor-pointer" 
              onClick={() => {
                if (hasAccess(movie)) {
                  openPlayer(movie, false);
                } else if (movie.trailerUrl) {
                  openPlayer(movie, true);
                } else {
                  handlePurchaseClick(movie);
                }
              }}
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl md:rounded-3xl bg-neutral-900 shadow-xl transition-all hover:shadow-2xl border border-white/5 group-hover:border-orange-600/30">
                <img
                  src={movie.thumbnailUrl}
                  alt={movie.title}
                  className={`h-full w-full object-cover transition-all duration-700 ${hasAccess(movie) ? 'group-hover:scale-110' : 'group-hover:scale-105'}`}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                
                <div className="absolute inset-0 flex items-center justify-center gap-2 md:gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-black/20 backdrop-blur-[2px]">
                  <div className="rounded-full bg-orange-600 p-2.5 md:p-6 text-white shadow-xl shadow-orange-900/40 transform scale-75 group-hover:scale-100 transition-transform duration-500">
                    {hasAccess(movie) ? <Play size={16} className="md:w-8 md:h-8" fill="currentColor" /> : (movie.trailerUrl ? <PlayCircle size={16} className="md:w-8 md:h-8" /> : <Lock size={16} className="md:w-8 md:h-8" />)}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingMovie({
                            id: movie.id,
                            title: movie.title,
                            description: movie.description,
                            price: movie.price
                          });
                        }}
                        className="rounded-full bg-neutral-800 p-2.5 md:p-6 text-white shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-500 hover:bg-orange-600"
                      >
                        <Pencil size={16} className="md:w-8 md:h-8" />
                      </div>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMovie?.(movie.id);
                        }}
                        className="rounded-full bg-red-600 p-2.5 md:p-6 text-white shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-500 hover:bg-red-700"
                      >
                        <Trash2 size={16} className="md:w-8 md:h-8" />
                      </div>
                    </div>
                  )}
                </div>
                
                {!hasAccess(movie) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-end p-2 md:p-6">
                    <div className="w-full space-y-1 md:space-y-2">
                      {movie.trailerUrl && (
                        <div className="flex items-center justify-center gap-1 md:gap-2 rounded-lg md:rounded-xl bg-white/10 py-1 md:py-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md border border-white/10">
                          <PlayCircle size={10} className="md:w-3.5 md:h-3.5" />
                          Trailer
                        </div>
                      )}
                      <div className="flex items-center justify-center gap-1 md:gap-2 rounded-lg md:rounded-xl bg-orange-600 py-1.5 md:py-3 text-[10px] md:text-xs font-black uppercase tracking-widest text-white shadow-2xl">
                        <CreditCard size={10} className="md:w-3.5 md:h-3.5" />
                        Price: ${movie.price}
                      </div>
                    </div>
                  </div>
                )}
                <div className="absolute right-2 top-2 md:right-4 md:top-4 rounded-full bg-black/50 px-2 py-0.5 md:px-3 md:py-1 text-[8px] md:text-[10px] font-black text-white backdrop-blur-md border border-white/10 tracking-widest uppercase">
                  {movie.price > 0 ? 'PREMIUM' : 'FREE'}
                </div>
              </div>
              <div className="mt-2 md:mt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-2">
                  <h4 className="text-[10px] md:text-xl font-bold text-white group-hover:text-orange-500 transition-colors truncate">{movie.title}</h4>
                  <div className="flex items-center gap-1 text-[8px] md:text-sm font-bold text-orange-500 shrink-0">
                    <Star size={8} className="md:w-3.5 md:h-3.5" fill="currentColor" />
                    {movie.rating || '0.0'}
                  </div>
                </div>
                <div className="mt-0.5 md:mt-2 flex items-center gap-1.5 md:gap-4 text-[8px] md:text-sm text-neutral-500">
                  <div className="flex items-center gap-0.5 md:gap-1">
                    <Clock size={8} className="md:w-3.5 md:h-3.5" />
                    <span>{movie.duration || '2h 15m'}</span>
                  </div>
                  <div className="flex items-center gap-0.5 md:gap-1">
                    <Film size={8} className="md:w-3.5 md:h-3.5" />
                    <span className="truncate">{movie.genre || 'Action'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Button - Only for Admins */}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-orange-600 text-white shadow-[0_20px_50px_rgba(234,88,12,0.3)] hover:scale-110 transition-all active:scale-95 ring-4 ring-neutral-950"
          >
            <Plus size={24} className="md:w-8 md:h-8" strokeWidth={3} />
          </button>
        </div>
      )}

      {(onUpload || onUpdateMovie) && (
        <UploadMovie 
          isOpen={isUploadOpen || !!editingMovie} 
          onClose={() => {
            setIsUploadOpen(false);
            setEditingMovie(null);
          }} 
          onUpload={onUpload || (async () => {})}
          onUpdate={onUpdateMovie}
          initialData={editingMovie || undefined}
        />
      )}

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
