import React from 'react';
import { Crown, Zap, Shield, Award, CheckCircle, Star, Sparkles, TrendingUp } from 'lucide-react';
import { User } from '../types';
import { motion } from 'framer-motion';

interface UpgradeProps {
  user: User;
  onUpgrade: (tier: string) => void;
}

export const Upgrade: React.FC<UpgradeProps> = ({ user, onUpgrade }) => {
  const tiers = [
    {
      name: 'Bronze',
      price: 4.99,
      icon: <Award className="text-orange-400" size={32} />,
      color: 'from-orange-400 to-orange-600',
      features: ['Bronze Badge', '5 Boosts/Month', 'Basic Analytics', 'Priority Support'],
    },
    {
      name: 'Silver',
      price: 9.99,
      icon: <Zap className="text-neutral-400" size={32} />,
      color: 'from-neutral-400 to-neutral-600',
      features: ['Silver Badge', '15 Boosts/Month', 'Advanced Analytics', 'Ad-Free Experience', 'Profile Customization'],
    },
    {
      name: 'Gold',
      price: 19.99,
      icon: <Trophy className="text-yellow-500" size={32} />,
      color: 'from-yellow-400 to-yellow-600',
      features: ['Gold Badge', 'Unlimited Boosts', 'Full Analytics', 'Verified Status', 'Exclusive Content Access', 'Direct Admin Support'],
    },
    {
      name: 'Platinum',
      price: 49.99,
      icon: <Crown className="text-indigo-400" size={32} />,
      color: 'from-indigo-400 to-indigo-600',
      features: ['Platinum Badge', 'Everything in Gold', 'Revenue Sharing', 'Custom Domain', 'Beta Feature Access', 'VIP Event Invites'],
    },
  ];

  return (
    <div className="space-y-12 pb-12">
      <div className="text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-600/10 px-4 py-2 text-sm font-bold text-orange-500 ring-1 ring-orange-500/20"
        >
          <Sparkles size={18} />
          STYN PREMIUM ACCESS
        </motion.div>
        <h1 className="mb-4 text-4xl font-black tracking-tight text-white md:text-5xl">
          Elevate Your <span className="text-orange-600">Experience</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-neutral-400">
          Choose the perfect tier to unlock exclusive features and boost your presence across Africa's leading social super-app.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier, i) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative flex flex-col overflow-hidden rounded-[2.5rem] border border-white/5 bg-neutral-900 p-8 shadow-xl ring-1 ring-white/5 transition-all hover:shadow-2xl hover:border-orange-600/30 ${user.tier === tier.name ? 'ring-4 ring-orange-600' : ''}`}
          >
            {user.tier === tier.name && (
              <div className="absolute -right-12 top-6 rotate-45 bg-orange-600 px-12 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                Current
              </div>
            )}
            
            <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${tier.color} text-white shadow-lg`}>
              {tier.icon}
            </div>

            <h3 className="mb-1 text-2xl font-black text-white">{tier.name}</h3>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">${tier.price}</span>
              <span className="text-sm font-bold text-neutral-500">/month</span>
            </div>

            <ul className="mb-8 flex-1 space-y-4">
              {tier.features.map((feature, j) => (
                <li key={j} className="flex items-start gap-3 text-sm font-medium text-neutral-400">
                  <CheckCircle size={18} className="mt-0.5 shrink-0 text-orange-500" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => onUpgrade(tier.name)}
              disabled={user.tier === tier.name}
              className={`w-full rounded-2xl py-4 text-sm font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${
                user.tier === tier.name 
                ? 'bg-neutral-800 text-neutral-500 cursor-default' 
                : 'bg-orange-600 text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700'
              }`}
            >
              {user.tier === tier.name ? 'Active Plan' : `Upgrade to ${tier.name}`}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Comparison Section */}
      <div className="rounded-[3rem] border border-white/5 bg-neutral-900 p-12 shadow-2xl ring-1 ring-white/5">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-black text-white">Why Go Premium?</h2>
          <p className="text-neutral-400">Premium members get 10x more engagement on average.</p>
        </div>
        <div className="grid gap-12 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-neutral-950 text-orange-500 shadow-inner border border-white/5">
              <TrendingUp size={32} />
            </div>
            <h4 className="mb-2 text-xl font-bold text-white">Boost Visibility</h4>
            <p className="text-sm text-neutral-400 leading-relaxed">Your posts appear higher in the feed and are recommended to more users across the platform.</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-neutral-950 text-orange-500 shadow-inner border border-white/5">
              <Star size={32} />
            </div>
            <h4 className="mb-2 text-xl font-bold text-white">Exclusive Badges</h4>
            <p className="text-sm text-neutral-400 leading-relaxed">Stand out with a unique badge that shows your commitment to the STYN community.</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-neutral-950 text-orange-500 shadow-inner border border-white/5">
              <Shield size={32} />
            </div>
            <h4 className="mb-2 text-xl font-bold text-white">Priority Support</h4>
            <p className="text-sm text-neutral-400 leading-relaxed">Get faster responses from our moderation team and dedicated account assistance.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Trophy = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);
