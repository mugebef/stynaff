import React from 'react';
import { Wallet as WalletIcon, DollarSign, Award, TrendingUp, ArrowUpRight, ArrowDownLeft, Clock, CreditCard, Plus, Loader2, Smartphone, ExternalLink, Sparkles, Zap, Star, Shield, Info, ArrowRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Transaction } from '../types';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';

interface WalletProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => Promise<void>;
}

export const Wallet: React.FC<WalletProps> = ({ user, onUpdateUser }) => {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showDeposit, setShowDeposit] = React.useState(false);
  const [depositAmount, setDepositAmount] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const snap = await getDocs(q);
        setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [user.uid]);

  const handleConvertPoints = async () => {
    if ((user.points || 0) < 100) return;
    setIsProcessing(true);
    try {
      const amount = Math.floor((user.points || 0) / 100);
      const pointsToDeduct = amount * 100;
      
      await onUpdateUser({
        points: (user.points || 0) - pointsToDeduct,
        balance: (user.balance || 0) + amount
      });

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'conversion',
        amount: amount,
        points: pointsToDeduct,
        status: 'completed',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error converting points:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeposit = async (method: 'ecocash' | 'paypal' | 'manual') => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsProcessing(true);
    try {
      // Create a pending transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: amount,
        type: 'deposit',
        status: 'pending',
        method: method,
        createdAt: serverTimestamp()
      });
      
      let message = '';
      if (method === 'ecocash') {
        message = `EcoCash request for $${amount} submitted! Please check your phone for the USSD prompt or send to merchant 123456.`;
      } else if (method === 'paypal') {
        message = `PayPal request for $${amount} submitted! Redirecting to PayPal... (Demo: Request logged as pending)`;
      } else {
        message = 'Manual deposit request submitted! Please send the payment and wait for admin approval.';
      }

      alert(message);
      setShowDeposit(false);
      setDepositAmount('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const buyPoints = async (points: number, price: number) => {
    if ((user.walletBalance || 0) < price) {
      alert('Insufficient wallet balance. Please deposit funds first.');
      return;
    }

    setIsProcessing(true);
    try {
      await onUpdateUser({
        walletBalance: (user.walletBalance || 0) - price,
        points: (user.points || 0) + points
      });

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: price,
        type: 'points_purchase',
        status: 'completed',
        method: 'wallet',
        createdAt: serverTimestamp()
      });

      alert(`Successfully purchased ${points} points for $${price.toFixed(2)}!`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12 px-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">My Wallet</h1>
          <p className="text-neutral-500 font-medium">Manage your balance and points</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-neutral-900/50 px-4 py-2 text-xs font-black uppercase tracking-widest text-neutral-500 border border-white/5 backdrop-blur-md">
          <Clock size={14} />
          Last updated: Just now
        </div>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Balance Card */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-600 via-orange-500 to-orange-700 p-10 text-white shadow-[0_30px_60px_-15px_rgba(234,88,12,0.3)]">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="mb-12 flex items-center justify-between">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xl shadow-inner">
                <WalletIcon size={32} />
              </div>
              <div className="flex flex-col items-end">
                <CreditCard size={32} className="opacity-30 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Premium Member</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-white/60">Available Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white/50">$</span>
                <h2 className="text-7xl font-black tracking-tighter">{user.walletBalance?.toFixed(2) || '0.00'}</h2>
              </div>
            </div>

            <div className="mt-12 flex flex-wrap gap-4">
              <button 
                onClick={() => setShowDeposit(true)}
                className="flex flex-1 min-w-[140px] items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-sm font-black uppercase tracking-widest text-orange-600 shadow-2xl hover:bg-neutral-50 transition-all active:scale-95"
              >
                <Plus size={20} strokeWidth={3} />
                Deposit
              </button>
              <button className="flex flex-1 min-w-[140px] items-center justify-center gap-3 rounded-2xl bg-black/20 px-6 py-4 text-sm font-black uppercase tracking-widest text-white backdrop-blur-xl hover:bg-black/30 transition-all active:scale-95 border border-white/10">
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Points Card */}
        <div className="rounded-[2.5rem] border border-white/5 bg-neutral-900/50 p-10 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="mb-8 flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600/10 text-orange-500">
                <Award size={32} />
              </div>
              <div className="flex items-center gap-1 text-xs font-black text-green-500 uppercase tracking-widest">
                <TrendingUp size={16} />
                Active
              </div>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-neutral-500 mb-2">My Points</p>
            <h2 className="text-6xl font-black tracking-tighter text-white">{user.points || 0}</h2>
          </div>

          <div className="mt-10 space-y-4">
            <button 
              onClick={handleConvertPoints}
              disabled={isProcessing || (user.points || 0) < 100}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-orange-600 px-6 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <DollarSign size={20} strokeWidth={3} />}
              Convert
            </button>
            <p className="text-center text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em]">
              100 pts = $1.00
            </p>
          </div>
        </div>
      </div>

      {/* Points Store */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Points Store</h2>
          <div className="h-px flex-1 bg-white/5"></div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { points: 500, price: 5, label: 'Starter Pack', icon: '🔥' },
            { points: 1200, price: 10, label: 'Popular', icon: '💎', popular: true },
            { points: 3000, price: 25, label: 'Pro Bundle', icon: '🚀' },
            { points: 7000, price: 50, label: 'Whale Deal', icon: '👑' }
          ].map((pack) => (
            <div 
              key={pack.points}
              className={`relative group overflow-hidden rounded-3xl border ${pack.popular ? 'border-orange-500/50 bg-orange-500/5' : 'border-white/5 bg-neutral-900/50'} p-6 transition-all hover:scale-[1.02]`}
            >
              {pack.popular && (
                <div className="absolute -right-8 top-4 rotate-45 bg-orange-600 px-10 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                  Best Value
                </div>
              )}
              <div className="text-4xl mb-4">{pack.icon}</div>
              <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-1">{pack.label}</h4>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black text-white">{pack.points}</span>
                <span className="text-xs font-bold text-neutral-500 uppercase">Pts</span>
              </div>
              <button 
                onClick={() => buyPoints(pack.points, pack.price)}
                disabled={isProcessing}
                className={`w-full rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${
                  pack.popular 
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700' 
                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                }`}
              >
                Buy for ${pack.price}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg rounded-[2.5rem] bg-neutral-900 p-10 shadow-2xl border border-white/10"
          >
            <div className="mb-8">
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Add Funds</h3>
              <p className="text-neutral-500 font-medium">Choose your preferred payment method</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Amount to Deposit ($)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-neutral-600">$</span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-2xl border border-white/5 bg-neutral-950 p-6 pl-12 text-4xl font-black text-white focus:border-orange-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <button 
                  onClick={() => handleDeposit('ecocash')}
                  disabled={isProcessing || !depositAmount}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#005c4b]/10 border border-[#005c4b]/20 p-6 hover:bg-[#005c4b]/20 transition-all group disabled:opacity-50"
                >
                  <div className="h-12 w-12 rounded-full bg-[#005c4b] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <span className="font-black text-xs">Eco</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#005c4b]">EcoCash</span>
                </button>

                <button 
                  onClick={() => handleDeposit('paypal')}
                  disabled={isProcessing || !depositAmount}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#003087]/10 border border-[#003087]/20 p-6 hover:bg-[#003087]/20 transition-all group disabled:opacity-50"
                >
                  <div className="h-12 w-12 rounded-full bg-[#003087] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <span className="font-black text-xs">PP</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#003087]">PayPal</span>
                </button>

                <button 
                  onClick={() => handleDeposit('manual')}
                  disabled={isProcessing || !depositAmount}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-neutral-800 border border-white/5 p-6 hover:bg-neutral-700 transition-all group disabled:opacity-50"
                >
                  <div className="h-12 w-12 rounded-full bg-neutral-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <CreditCard size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Manual</span>
                </button>
              </div>

              <button 
                onClick={() => setShowDeposit(false)}
                className="w-full rounded-2xl bg-neutral-800 py-4 text-sm font-black uppercase tracking-widest text-neutral-400 hover:bg-neutral-700 transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="rounded-[2.5rem] border border-white/5 bg-neutral-900/30 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl overflow-hidden">
        <div className="border-b border-white/5 p-8 flex items-center justify-between">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Activity</h2>
          <button className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors">View All</button>
        </div>
        <div className="p-8">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="animate-spin mx-auto mb-4 text-orange-600" size={32} />
              <p className="text-sm font-black uppercase tracking-widest text-neutral-600">Syncing Transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center">
              <div className="h-20 w-20 rounded-full bg-neutral-800/50 flex items-center justify-center mx-auto mb-6">
                <Clock size={32} className="text-neutral-700" />
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-neutral-600">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="group flex items-center justify-between rounded-2xl bg-neutral-950/50 p-5 border border-white/5 hover:border-orange-500/30 transition-all">
                  <div className="flex items-center gap-5">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-lg ${
                      tx.type === 'deposit' || tx.type === 'points_purchase' ? 'bg-green-500/10 text-green-500' : 
                      tx.type === 'withdrawal' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {tx.type === 'deposit' ? <ArrowDownLeft size={24} /> : 
                       tx.type === 'withdrawal' ? <ArrowUpRight size={24} /> : 
                       tx.type === 'points_purchase' ? <Plus size={24} /> : <Award size={24} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-widest">
                        {tx.type.replace('_', ' ')}
                      </p>
                      <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mt-0.5">
                        {tx.method} • <span className={tx.status === 'completed' ? 'text-green-500' : 'text-orange-500'}>{tx.status}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black tracking-tighter ${
                      tx.type === 'deposit' || tx.type === 'points_conversion' || tx.type === 'points_purchase' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {tx.type === 'deposit' || tx.type === 'points_conversion' || tx.type === 'points_purchase' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </p>
                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mt-0.5">
                      {tx.createdAt?.toDate().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
