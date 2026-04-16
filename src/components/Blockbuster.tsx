import React from 'react';
import { Play, Search, Filter, Star, Clock, User, Plus, Film, Lock, CreditCard } from 'lucide-react';
import { UploadMovie } from './UploadMovie';
import { User as UserType } from '../types';

interface BlockbusterProps {
  movies: any[];
  currentUser: UserType | null;
  onUpload?: (data: any) => Promise<void>;
  onPurchase?: (movieId: string, price: number) => Promise<void>;
  onDeposit?: () => void;
}

export const Blockbuster: React.FC<BlockbusterProps> = ({ movies, currentUser, onUpload, onPurchase, onDeposit }) => {
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [selectedMovie, setSelectedMovie] = React.useState<any | null>(null);
  const [showTrailer, setShowTrailer] = React.useState(true);

  const isAdmin = currentUser?.role === 'admin';
  const featuredMovie = movies.length > 0 ? movies[0] : null;
  
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 relative">
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white">Blockbuster</h2>
        </div>
        <div className="flex gap-4">
          <button className="rounded-full bg-neutral-900 p-4 text-neutral-500 hover:bg-orange-600/10 hover:text-orange-500 transition-all border border-white/5">
            <Search size={24} />
          </button>
          <button className="rounded-full bg-neutral-900 p-4 text-neutral-500 hover:bg-orange-600/10 hover:text-orange-500 transition-all border border-white/5">
            <Filter size={24} />
          </button>
        </div>
      </div>

      {/* Featured Movie */}
      <div className="group relative mb-16 aspect-[21/9] w-full overflow-hidden rounded-[40px] bg-neutral-950 shadow-2xl border border-white/5">
        {featuredMovie?.trailerUrl && showTrailer ? (
          <video
            src={featuredMovie.trailerUrl}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover opacity-60 transition-all duration-1000"
            onEnded={() => setShowTrailer(false)}
          />
        ) : (
          <img
            src={featuredMovie?.thumbnailUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=2000"}
            alt="Featured Movie"
            className="h-full w-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-1000"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-12 text-white">
          <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-orange-500">
            <Star size={16} fill="currentColor" />
            {featuredMovie ? 'Featured Today' : 'Coming Soon'}
          </div>
          <h3 className="mt-4 text-6xl font-bold leading-tight">
            {featuredMovie?.title || "The African Dream"}
          </h3>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-neutral-300">
            {featuredMovie?.description || "An epic journey across the continent, exploring the beauty, culture, and resilience of the African spirit."}
          </p>
          <div className="mt-10 flex gap-6">
            {featuredMovie && (
              hasAccess(featuredMovie) ? (
                <button 
                  onClick={() => window.open(featuredMovie.videoUrl, '_blank')}
                  className="flex items-center gap-3 rounded-full bg-orange-600 px-10 py-5 text-xl font-bold text-white shadow-xl shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95"
                >
                  <Play size={24} fill="currentColor" />
                  Watch Full Movie
                </button>
              ) : (
                <button 
                  onClick={() => handlePurchaseClick(featuredMovie)}
                  className="flex items-center gap-3 rounded-full bg-orange-600 px-10 py-5 text-xl font-bold text-white shadow-xl shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95"
                >
                  <CreditCard size={24} />
                  Unlock Full Movie for {featuredMovie.price} Points
                </button>
              )
            )}
            <button className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-10 py-5 text-xl font-bold text-white backdrop-blur-md hover:bg-white/10 transition-all active:scale-95">
              More Info
            </button>
          </div>
        </div>
      </div>

      {/* Movie Grid */}
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {movies.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <Film size={48} className="mx-auto mb-4 text-neutral-700" />
            <p className="text-xl font-bold text-neutral-500">No movies found.</p>
          </div>
        ) : (
          movies.map((movie) => (
            <div 
              key={movie.id} 
              className="group cursor-pointer" 
              onClick={() => {
                if (hasAccess(movie)) {
                  window.open(movie.videoUrl, '_blank');
                } else {
                  handlePurchaseClick(movie);
                }
              }}
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-3xl bg-neutral-900 shadow-xl transition-all hover:shadow-2xl border border-white/5 group-hover:border-orange-600/30">
                <img
                  src={movie.thumbnailUrl}
                  alt={movie.title}
                  className={`h-full w-full object-cover transition-all duration-700 ${hasAccess(movie) ? 'grayscale group-hover:grayscale-0' : 'blur-sm grayscale'}`}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="rounded-full bg-orange-600 p-6 text-white shadow-xl shadow-orange-900/40 transform scale-75 group-hover:scale-100 transition-transform duration-500">
                    {hasAccess(movie) ? <Play size={32} fill="currentColor" /> : <Lock size={32} />}
                  </div>
                </div>
                {!hasAccess(movie) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <div className="rounded-2xl bg-orange-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-2xl">
                      {movie.price} Points
                    </div>
                  </div>
                )}
                <div className="absolute right-4 top-4 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/10">
                  {movie.price > 0 ? 'PREMIUM' : 'FREE'}
                </div>
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors">{movie.title}</h4>
                  <div className="flex items-center gap-1 text-sm font-bold text-orange-500">
                    <Star size={14} fill="currentColor" />
                    {movie.rating || '0.0'}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-neutral-500">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {movie.duration || '2h 15m'}
                  </div>
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    {movie.genre || 'Action'}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Button - Only for Admins */}
      {isAdmin && (
        <div className="fixed bottom-10 right-10 z-50">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-600 text-white shadow-[0_20px_50px_rgba(234,88,12,0.3)] hover:scale-110 transition-all active:scale-95 ring-4 ring-neutral-950"
          >
            <Plus size={32} strokeWidth={3} />
          </button>
        </div>
      )}

      {onUpload && (
        <UploadMovie 
          isOpen={isUploadOpen} 
          onClose={() => setIsUploadOpen(false)} 
          onUpload={onUpload} 
        />
      )}
    </div>
  );
};
