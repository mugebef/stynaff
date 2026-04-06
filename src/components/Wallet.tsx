import React from 'react';
import { Wallet as WalletIcon, DollarSign, Award, TrendingUp, ArrowUpRight, ArrowDownLeft, Clock, CreditCard, Plus, Loader2 } from 'lucide-react';
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

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsProcessing(true);
    try {
      // Create a pending transaction for manual payment
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: amount,
        type: 'deposit',
        status: 'pending',
        method: 'manual',
        createdAt: serverTimestamp()
      });
      
      alert('Manual deposit request submitted! Please send the payment and wait for admin approval.');
      setShowDeposit(false);
      setDepositAmount('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvertPoints = async () => {
    if (user.points < 100) {
      alert('Minimum 100 points required to convert.');
      return;
    }

    setIsProcessing(true);
    try {
      const conversionRate = 0.01; // 100 points = $1
      const amount = user.points * conversionRate;
      
      await onUpdateUser({
        points: 0,
        walletBalance: (user.walletBalance || 0) + amount
      });

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: amount,
        type: 'points_conversion',
        status: 'completed',
        method: 'wallet',
        createdAt: serverTimestamp()
      });

      alert(`Successfully converted ${user.points} points to $${amount.toFixed(2)}!`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">Wallet & Points</h1>
        <div className="flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-bold text-neutral-600">
          <Clock size={18} />
          Last updated: Just now
        </div>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 to-orange-500 p-8 text-white shadow-2xl shadow-orange-200">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
          <div className="relative z-10">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                <WalletIcon size={24} />
              </div>
              <CreditCard size={24} className="opacity-50" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-white/70">Wallet Balance</p>
            <h2 className="text-5xl font-bold tracking-tight">${user.walletBalance?.toFixed(2) || '0.00'}</h2>
            <div className="mt-8 flex gap-4">
              <button 
                onClick={() => setShowDeposit(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-orange-600 shadow-lg hover:bg-neutral-50 transition-all active:scale-95"
              >
                <Plus size={18} />
                Deposit
              </button>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/20 px-4 py-3 text-sm font-bold text-white backdrop-blur-md hover:bg-white/30 transition-all active:scale-95">
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Points Card */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-xl ring-1 ring-neutral-200">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <Award size={24} />
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-green-600">
              <TrendingUp size={16} />
              +12% this week
            </div>
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">Total Points</p>
          <h2 className="text-5xl font-bold tracking-tight text-neutral-900">{user.points || 0}</h2>
          <div className="mt-8">
            <button 
              onClick={handleConvertPoints}
              disabled={isProcessing || (user.points || 0) < 100}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <DollarSign size={18} />}
              Convert to Cash
            </button>
            <p className="mt-2 text-center text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              100 points = $1.00
            </p>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-neutral-900">Manual Deposit</h3>
            <p className="mb-6 text-sm text-neutral-500">
              Enter the amount you wish to deposit. After submitting, you will need to send the payment manually and an admin will verify it.
            </p>
            <div className="mb-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-400">Amount ($)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-2xl font-bold focus:border-orange-600 focus:outline-none"
              />
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleDeposit}
                disabled={isProcessing}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-orange-700 transition-all disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : 'Submit Request'}
              </button>
              <button 
                onClick={() => setShowDeposit(false)}
                className="flex-1 rounded-xl bg-neutral-100 px-4 py-3 text-sm font-bold text-neutral-600 hover:bg-neutral-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-xl ring-1 ring-neutral-200">
        <div className="border-b border-neutral-100 p-6">
          <h2 className="text-xl font-bold text-neutral-900">Recent Transactions</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="py-8 text-center text-neutral-400">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-neutral-400">No transactions yet.</div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      tx.type === 'deposit' ? 'bg-green-100 text-green-600' : 
                      tx.type === 'withdrawal' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {tx.type === 'deposit' ? <ArrowDownLeft size={20} /> : 
                       tx.type === 'withdrawal' ? <ArrowUpRight size={20} /> : <Award size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 uppercase tracking-tight">
                        {tx.type.replace('_', ' ')}
                      </p>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase">
                        {tx.method} • {tx.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      tx.type === 'deposit' || tx.type === 'points_conversion' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'deposit' || tx.type === 'points_conversion' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </p>
                    <p className="text-[10px] font-bold text-neutral-400">
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
