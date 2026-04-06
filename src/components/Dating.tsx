import React from 'react';
import { Heart, User, MapPin, Search, Filter, X, Check } from 'lucide-react';

export const Dating: React.FC = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900">Find Your Match</h2>
          <p className="mt-2 text-neutral-600">Connect with people who share your passions.</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full bg-neutral-100 p-3 text-neutral-500 hover:bg-orange-50 hover:text-orange-600 transition-all">
            <Search size={20} />
          </button>
          <button className="rounded-full bg-neutral-100 p-3 text-neutral-500 hover:bg-orange-50 hover:text-orange-600 transition-all">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="group relative overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-neutral-200 transition-all hover:shadow-2xl">
            <div className="aspect-[3/4] w-full overflow-hidden bg-neutral-200">
              <img
                src={`https://images.unsplash.com/photo-${1500000000000 + i * 1000000}?auto=format&fit=crop&q=80&w=800`}
                alt="Profile"
                className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="absolute bottom-0 left-0 w-full p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">User {i}, 24</h3>
                  <div className="mt-1 flex items-center gap-1 text-sm text-neutral-300">
                    <MapPin size={14} />
                    Nairobi, Kenya
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-full bg-white/20 p-2 backdrop-blur-md hover:bg-red-500 transition-all">
                    <X size={20} />
                  </button>
                  <button className="rounded-full bg-orange-600 p-2 shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all">
                    <Heart size={20} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
