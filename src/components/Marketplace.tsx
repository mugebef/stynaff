import React from 'react';
import { ShoppingBag, Search, Filter, Plus, Tag, MapPin, Sparkles, TrendingUp, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export const Marketplace: React.FC = () => {
  const categories = ['Electronics', 'Fashion', 'Home', 'Vehicles', 'Property', 'Services'];
  
  const items = [
    { id: '1', title: 'iPhone 15 Pro Max', price: 999, location: 'Lagos, Nigeria', image: 'https://picsum.photos/seed/iphone/400/300' },
    { id: '2', title: 'Modern Sofa Set', price: 450, location: 'Nairobi, Kenya', image: 'https://picsum.photos/seed/sofa/400/300' },
    { id: '3', title: 'Toyota Corolla 2022', price: 15000, location: 'Accra, Ghana', image: 'https://picsum.photos/seed/car/400/300' },
    { id: '4', title: 'Designer Sneakers', price: 120, location: 'Johannesburg, SA', image: 'https://picsum.photos/seed/shoes/400/300' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-neutral-900">STYN Marketplace</h1>
          <p className="text-neutral-500">Buy and sell across the continent.</p>
        </div>
        <button className="flex items-center gap-2 rounded-2xl bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95">
          <Plus size={20} />
          List Item
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button key={cat} className="shrink-0 rounded-full bg-white px-6 py-2 text-sm font-bold text-neutral-600 shadow-sm ring-1 ring-neutral-200 hover:bg-orange-50 hover:text-orange-600 transition-all">
            {cat}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
        <input 
          type="text" 
          placeholder="Search for items, cars, houses..." 
          className="w-full rounded-3xl border border-neutral-200 bg-white py-4 pl-12 pr-4 text-lg shadow-xl ring-1 ring-neutral-200 focus:border-orange-600 focus:outline-none"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group cursor-pointer overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-lg ring-1 ring-neutral-200 transition-all hover:shadow-2xl"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute right-3 top-3 rounded-full bg-white/80 p-2 text-neutral-900 backdrop-blur-md hover:bg-white transition-all">
                <Heart size={18} />
              </div>
              <div className="absolute bottom-3 left-3 rounded-lg bg-orange-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                ${item.price}
              </div>
            </div>
            <div className="p-4">
              <h3 className="mb-1 text-sm font-bold text-neutral-900 group-hover:text-orange-600 transition-colors">{item.title}</h3>
              <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                <MapPin size={10} />
                {item.location}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const Jobs: React.FC = () => {
  const jobs = [
    { title: 'Senior React Developer', company: 'TechAfrica', location: 'Remote', salary: '$3k - $5k', type: 'Full-time' },
    { title: 'Marketing Manager', company: 'Global Connect', location: 'Nairobi', salary: '$2k - $3k', type: 'Contract' },
    { title: 'UI/UX Designer', company: 'Creative Studio', location: 'Lagos', salary: '$2.5k - $4k', type: 'Full-time' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-neutral-900">STYN Jobs</h1>
          <p className="text-neutral-500">Find your next career move in Africa.</p>
        </div>
        <button className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
          <Plus size={20} />
          Post a Job
        </button>
      </div>

      <div className="grid gap-6">
        {jobs.map((job, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group cursor-pointer rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-xl ring-1 ring-neutral-200 transition-all hover:border-blue-200 hover:bg-blue-50/30"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-neutral-900 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                  <p className="text-sm font-bold text-neutral-500">{job.company} • {job.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
                  {job.type}
                </span>
                <span className="text-lg font-black text-neutral-900">{job.salary}</span>
                <button className="rounded-xl bg-blue-600 px-6 py-2 text-xs font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const Events: React.FC = () => {
  const events = [
    { title: 'Tech Summit 2026', date: 'May 15', location: 'Lagos', price: 'Free', image: 'https://picsum.photos/seed/tech/800/400' },
    { title: 'Afrobeat Festival', date: 'June 20', location: 'Accra', price: '$25', image: 'https://picsum.photos/seed/music/800/400' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-neutral-900">STYN Events</h1>
          <p className="text-neutral-500">Discover what's happening around you.</p>
        </div>
        <button className="flex items-center gap-2 rounded-2xl bg-red-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-200 hover:bg-red-600 transition-all active:scale-95">
          <Plus size={20} />
          Create Event
        </button>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {events.map((event, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group cursor-pointer overflow-hidden rounded-[2.5rem] border border-neutral-200 bg-white shadow-xl ring-1 ring-neutral-200 transition-all hover:shadow-2xl"
          >
            <div className="relative aspect-video overflow-hidden">
              <img src={event.image} alt={event.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute left-6 top-6 rounded-2xl bg-white/90 p-3 text-center backdrop-blur-md shadow-lg">
                <p className="text-xs font-black uppercase tracking-widest text-red-500">{event.date.split(' ')[0]}</p>
                <p className="text-xl font-black text-neutral-900">{event.date.split(' ')[1]}</p>
              </div>
            </div>
            <div className="p-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-2xl font-black text-neutral-900 group-hover:text-red-500 transition-colors">{event.title}</h3>
                <span className="rounded-full bg-red-50 px-4 py-1 text-xs font-black text-red-600 ring-1 ring-red-200">
                  {event.price}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-neutral-500 uppercase tracking-widest">
                <MapPin size={16} className="text-red-500" />
                {event.location}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
