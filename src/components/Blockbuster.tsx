import React from 'react';
import { Play, Search, Filter, Star, Clock, User, Plus, Film } from 'lucide-react';
import { UploadMovie } from './UploadMovie';

interface BlockbusterProps {
  onUpload?: (data: any) => Promise<void>;
}

export const Blockbuster: React.FC<BlockbusterProps> = ({ onUpload }) => {
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);

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
        <img
          src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=2000"
          alt="Featured Movie"
          className="h-full w-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-12 text-white">
          <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-orange-500">
            <Star size={16} fill="currentColor" />
            Featured Today
          </div>
          <h3 className="mt-4 text-6xl font-bold leading-tight">The African Dream</h3>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-neutral-300">
            An epic journey across the continent, exploring the beauty, culture, and resilience of the African spirit.
          </p>
          <div className="mt-10 flex gap-6">
            <button className="flex items-center gap-3 rounded-full bg-orange-600 px-10 py-5 text-xl font-bold text-white shadow-xl shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95">
              <Play size={24} fill="currentColor" />
              Watch Now
            </button>
            <button className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-10 py-5 text-xl font-bold text-white backdrop-blur-md hover:bg-white/10 transition-all active:scale-95">
              More Info
            </button>
          </div>
        </div>
      </div>

      {/* Movie Grid */}
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="group cursor-pointer">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-3xl bg-neutral-900 shadow-xl transition-all hover:shadow-2xl border border-white/5 group-hover:border-orange-600/30">
              <img
                src={`https://images.unsplash.com/photo-${1485846234645 + i * 1000000}?auto=format&fit=crop&q=80&w=800`}
                alt="Movie Poster"
                className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="rounded-full bg-orange-600 p-6 text-white shadow-xl shadow-orange-900/40 transform scale-75 group-hover:scale-100 transition-transform duration-500">
                  <Play size={32} fill="currentColor" />
                </div>
              </div>
              <div className="absolute right-4 top-4 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/10">
                HD
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors">Movie Title {i}</h4>
                <div className="flex items-center gap-1 text-sm font-bold text-orange-500">
                  <Star size={14} fill="currentColor" />
                  4.8
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm text-neutral-500">
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  2h 15m
                </div>
                <div className="flex items-center gap-1">
                  <User size={14} />
                  Action
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Button - Fixed + Button Lower Right */}
      <div className="fixed bottom-10 right-10 z-50">
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-600 text-white shadow-[0_20px_50px_rgba(234,88,12,0.3)] hover:scale-110 transition-all active:scale-95 ring-4 ring-neutral-950"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      </div>

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
