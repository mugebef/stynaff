import React from 'react';
import { Play, Search, Filter, Star, Clock, User, Plus, Film, Lock, CreditCard, PlayCircle, Info, Pencil, Trash2 } from 'lucide-react';
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
  const [showTrailer, setShowTrailer] = React.useState(true);
  const [mediaError, setMediaError] = React.useState(false);
  const [featuredMediaError, setFeaturedMediaError] = React.useState(false);

  if (mediaError) return null; // Avoid crashing if parent is mapped and child fails

  const isAdmin = currentUser?.role === 'admin';
  const featuredMovie = movies.length > 0 ? movies[0] : null;
  
  // Get recently added movies (limit to 8, sorted by createdAt)
  const recentlyAdded = [...movies].sort((a, b) => {
    const dateA = a.createdAt?.seconds || 0;
    const dateB = b.createdAt?.seconds || 0;
    return dateB - dateA;
  }).slice(0, 8);

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
    <div className="mx-auto max-w-[1400px] px-6 py-6 md:py-12 relative overflow-hidden">
      <div className="mb-8 md:mb-16 flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tighter text-white italic">Blockbuster Cinema</h2>
          <div className="h-1 w-12 bg-orange-600 rounded-full"></div>
        </div>
        <div className="flex gap-3 md:gap-5">
          <button className="rounded-2xl bg-neutral-900 p-3.5 md:p-5 text-neutral-400 hover:bg-orange-600/10 hover:text-orange-500 transition-all border border-white/5 active:scale-95">
            <Search size={22} className="md:w-8 md:h-8" />
          </button>
          <button className="rounded-2xl bg-neutral-900 p-3.5 md:p-5 text-neutral-400 hover:bg-orange-600/10 hover:text-orange-500 transition-all border border-white/5 active:scale-95">
            <Filter size={22} className="md:w-8 md:h-8" />
          </button>
        </div>
      </div>

      {/* Featured Movie */}
      <div className="group relative mb-8 md:mb-24 aspect-video md:aspect-[21/9] w-full overflow-hidden rounded-[24px] md:rounded-[60px] bg-neutral-950 shadow-2xl border border-white/5 ring-1 ring-white/10">
        {featuredMovie?.trailerUrl && showTrailer ? (
          <video
            src={getMediaSource(featuredMovie.trailerUrl)}
            autoPlay
            loop
            muted
            playsInline
            crossOrigin="anonymous"
            className="h-full w-full object-cover opacity-60 transition-all duration-1000 scale-105 group-hover:scale-100"
            onEnded={() => setShowTrailer(false)}
            onError={(e) => {
              const video = e.currentTarget;
              if (!video.dataset.retried) {
                video.dataset.retried = 'true';
                setTimeout(() => {
                  video.load();
                }, 2000);
              } else {
                setFeaturedMediaError(true);
              }
            }}
          >
          </video>
        ) : (
          <img
            src={getMediaSource(featuredMovie?.thumbnailUrl) || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=2000"}
            alt="Featured Movie"
            className="h-full w-full object-cover opacity-80 transition-all duration-1000 scale-105 group-hover:scale-100"
            referrerPolicy="no-referrer"
            onError={() => setFeaturedMediaError(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-transparent to-transparent hidden md:block"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-20 text-white z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-orange-500 mb-1 md:mb-8"
          >
            <div className="h-1 w-6 md:w-16 bg-orange-600 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Star size={10} className="md:w-5 md:h-5 text-yellow-400" fill="currentColor" />
              {featuredMovie ? 'Global Premiere' : 'Coming Soon'}
            </div>
          </motion.div>
          
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-7xl lg:text-9xl font-black leading-[1.1] md:leading-[0.9] tracking-tighter uppercase italic"
          >
            {featuredMovie?.title || "The African Dream"}
          </motion.h3>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-1 md:mt-12 max-w-xl md:max-w-3xl text-[10px] md:text-2xl leading-relaxed text-neutral-300 font-medium line-clamp-2 md:line-clamp-none"
          >
            {featuredMovie?.description || "An epic journey across the continent, exploring the beauty, culture, and resilience of the African spirit."}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-3 md:mt-16 flex flex-wrap items-center gap-2 md:gap-8"
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
                  className="group relative flex items-center gap-2 md:gap-6 overflow-hidden rounded-xl md:rounded-[32px] bg-white px-4 py-2 md:px-16 md:py-8 text-[10px] md:text-2xl font-black text-black shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:scale-105 transition-all active:scale-95"
                >
                  <Play size={14} className="md:w-9 md:h-9" fill="currentColor" />
                  <span>{hasAccess(featuredMovie) ? 'Play' : `Unlock $${featuredMovie.price}`}</span>
                </button>
                
                {featuredMovie.trailerUrl && (
                  <button 
                    onClick={() => openPlayer(featuredMovie, true)}
                    className="flex items-center gap-2 md:gap-6 rounded-xl md:rounded-[32px] border border-white/20 bg-white/5 px-4 py-2 md:px-16 md:py-8 text-[10px] md:text-2xl font-black text-white backdrop-blur-3xl hover:bg-white/10 transition-all active:scale-95"
                  >
                    <PlayCircle size={14} className="md:w-9 md:h-9" />
                    Trailer
                  </button>
                )}

                {isAdmin && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMovie?.(featuredMovie.id);
                    }}
                    className="flex h-8 w-8 md:h-20 md:w-20 items-center justify-center rounded-lg md:rounded-[32px] bg-red-600/20 text-red-500 border border-red-500/30 hover:bg-red-600 hover:text-white transition-all active:scale-95"
                  >
                    <Trash2 size={14} className="md:w-9 md:h-9" />
                  </button>
                )}
              </>
            )}
            <button className="flex items-center gap-2 md:gap-6 rounded-xl md:rounded-[32px] border border-white/20 bg-white/5 px-4 py-2 md:px-16 md:py-8 text-[10px] md:text-2xl font-black text-white backdrop-blur-3xl hover:bg-white/10 transition-all active:scale-95">
              <Info size={14} className="md:w-9 md:h-9" />
              Info
            </button>
          </motion.div>
        </div>
      </div>
      
      {/* Recently Added Section */}
      <div className="mb-16 md:mb-32">
        <div className="flex items-center gap-4 mb-8 md:mb-14 px-2">
          <div className="h-3 w-3 rounded-full bg-orange-600 animate-pulse outline outline-4 outline-orange-600/30"></div>
          <h3 className="text-xl md:text-3xl font-black uppercase tracking-[0.2em] text-white">Latest Releases</h3>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-orange-600/30 to-transparent"></div>
        </div>
        
        <div className="grid grid-cols-2 md:flex md:flex-row md:overflow-x-auto gap-4 md:gap-10 pb-10 md:pb-16 no-scrollbar -mx-2 md:-mx-6 px-2 md:px-6">
          {recentlyAdded.map((movie) => (
            <motion.div
              key={movie.id}
              whileHover={{ y: -12 }}
              className="relative min-w-0 md:min-w-[400px] group cursor-pointer"
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
              <div className="aspect-[3/4] md:aspect-[16/9] w-full overflow-hidden rounded-[16px] md:rounded-[40px] bg-neutral-900 border border-white/5 group-hover:border-orange-600/50 transition-all shadow-xl group-hover:shadow-orange-600/20">
                <img
                  src={getMediaSource(movie.thumbnailUrl)}
                  alt={movie.title}
                  className="h-full w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60" />
                
                {/* Status Badge */}
                <div className="absolute top-2 left-2 md:top-6 md:left-6 rounded-full bg-orange-600 px-2 py-1 md:px-4 md:py-1.5 text-[7px] md:text-[11px] font-black text-white uppercase tracking-[0.1em] md:tracking-[0.2em] shadow-lg">
                  Blockbuster
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center gap-2 md:gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                  <div className="rounded-full bg-white p-2 md:p-6 text-black shadow-2xl">
                    <Play size={16} className="md:w-10 md:h-10" fill="currentColor" />
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1.5 md:gap-3">
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
                        className="rounded-full bg-neutral-800 p-2 md:p-6 text-white hover:bg-orange-600 transition-all shadow-2xl"
                      >
                        <Pencil size={14} className="md:w-10 md:h-10" />
                      </div>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMovie?.(movie.id);
                        }}
                        className="rounded-full bg-red-600 p-2 md:p-6 text-white hover:bg-red-700 transition-all shadow-2xl"
                      >
                        <Trash2 size={14} className="md:w-10 md:h-10" />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="absolute bottom-3 left-3 right-3 md:bottom-10 md:left-10 md:right-10">
                  <h4 className="text-sm md:text-3xl font-black text-white leading-tight mb-1 md:mb-2 truncate italic uppercase">{movie.title}</h4>
                  <div className="flex items-center gap-2 md:gap-4 text-[8px] md:text-sm text-neutral-300 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1 md:gap-2"><div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-orange-600"></div> {movie.genre || 'Epic'}</span>
                    <span className="text-orange-500">${movie.price}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Movie Grid */}
      <div className="mb-6 md:mb-16 flex items-center gap-4 px-1">
        <h3 className="text-lg md:text-3xl font-black uppercase tracking-[0.2em] text-white">Movie Archive</h3>
        <div className="h-[1px] flex-1 bg-neutral-800/50"></div>
      </div>
      <div className="grid gap-4 md:gap-12 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {movies.length === 0 ? (
          <div className="col-span-full py-32 text-center">
            <Film size={60} className="mx-auto mb-6 text-neutral-800" />
            <p className="text-xl md:text-3xl font-black text-neutral-600 uppercase tracking-tighter">Your Cinema awaits new entries</p>
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
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[24px] md:rounded-[40px] bg-neutral-900 shadow-2xl transition-all duration-500 hover:shadow-orange-600/10 border-2 border-white/5 group-hover:border-orange-600/40">
                <img
                  src={getMediaSource(movie.thumbnailUrl)}
                  alt={movie.title}
                  className={`h-full w-full object-cover transition-all duration-1000 ${hasAccess(movie) ? 'group-hover:scale-110' : 'group-hover:scale-105'}`}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                
                <div className="absolute inset-0 flex items-center justify-center gap-2 md:gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/40 backdrop-blur-[4px]">
                  <div className="rounded-full bg-orange-600 p-4 md:p-8 text-white shadow-2xl shadow-orange-900/60 transform scale-75 group-hover:scale-100 transition-transform duration-500">
                    {hasAccess(movie) ? <Play size={20} className="md:w-10 md:h-10" fill="currentColor" /> : (movie.trailerUrl ? <PlayCircle size={20} className="md:w-10 md:h-10" /> : <Lock size={20} className="md:w-10 md:h-10" />)}
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
                        className="rounded-full bg-neutral-800 p-4 md:p-8 text-white shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-500 hover:bg-orange-600"
                      >
                        <Pencil size={20} className="md:w-10 md:h-10" />
                      </div>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMovie?.(movie.id);
                        }}
                        className="rounded-full bg-red-600 p-4 md:p-8 text-white shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-500 hover:bg-red-700"
                      >
                        <Trash2 size={20} className="md:w-10 md:h-10" />
                      </div>
                    </div>
                  )}
                </div>
                
                {!hasAccess(movie) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-end p-4 md:p-10">
                    <div className="w-full space-y-2 md:space-y-3">
                      {movie.trailerUrl && (
                        <div className="flex items-center justify-center gap-2 rounded-xl md:rounded-[20px] bg-white/10 py-2 md:py-3 text-[9px] md:text-sm font-black uppercase tracking-widest text-white backdrop-blur-3xl border border-white/20">
                          <PlayCircle size={12} className="md:w-5 md:h-5" />
                          Trailer
                        </div>
                      )}
                      <div className="flex items-center justify-center gap-2 rounded-xl md:rounded-[20px] bg-orange-600 py-3 md:py-6 text-[11px] md:text-lg font-black uppercase tracking-widest text-white shadow-2xl">
                        <CreditCard size={12} className="md:w-6 md:h-6" />
                        ${movie.price}
                      </div>
                    </div>
                  </div>
                )}
                <div className="absolute right-3 top-3 md:right-8 md:top-8 rounded-full bg-black/60 px-3 py-1 text-[8px] md:text-sm font-black text-white backdrop-blur-3xl border border-white/10 tracking-widest uppercase">
                  {movie.price > 0 ? 'PREMIUM' : 'FREE'}
                </div>
              </div>
              <div className="mt-4 md:mt-10 px-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm md:text-3xl font-black text-white group-hover:text-orange-500 transition-colors uppercase italic truncate tracking-tighter">{movie.title}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] md:text-lg font-black text-orange-500 mt-1">
                    <Star size={10} className="md:w-5 md:h-5" fill="currentColor" />
                    {movie.rating || '4.8'}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 md:gap-4 text-[9px] md:text-base font-bold text-neutral-500 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <Clock size={10} className="md:w-4 md:h-4 text-orange-600/50" />
                    <span>{movie.duration || '2h 15m'}</span>
                  </div>
                  <div className="h-0.5 w-0.5 md:h-1 md:w-1 rounded-full bg-neutral-800"></div>
                  <div className="flex items-center gap-1.5">
                    <Film size={10} className="md:w-4 md:h-4 text-orange-600/50" />
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
        <div className="fixed bottom-8 right-8 md:bottom-12 md:right-12 z-50">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="group relative flex h-14 w-14 md:h-20 md:w-20 items-center justify-center rounded-[24px] md:rounded-[32px] bg-orange-600 text-white shadow-[0_20px_60px_rgba(234,88,12,0.5)] hover:scale-110 transition-all active:scale-95 ring-4 ring-neutral-950 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Plus size={28} className="md:w-10 md:h-10" strokeWidth={4} />
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
