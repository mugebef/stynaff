import React from 'react';
import { Wallet as WalletIcon, DollarSign, Award, TrendingUp, ArrowUpRight, ArrowDownLeft, Clock, CreditCard, Plus, Loader2, Smartphone, ExternalLink, Sparkles, Zap, Star, Shield, Info, ArrowRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Transaction } from '../types';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';

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
        balance: (user.balance || 0) + amount,
        walletBalance: (user.walletBalance || 0) + amount
      });

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'conversion',
        amount: amount,
        points: pointsToDeduct,
        status: 'completed',
        method: 'wallet',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error converting points:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const [pendingTx, setPendingTx] = React.useState<{
    reference: string;
    amount: number;
    redirectUrl?: string;
    pollUrl?: string;
    status: 'initiated' | 'verifying' | 'completed' | 'failed';
    message?: string;
  } | null>(null);
  const [verifyingRef, setVerifyingRef] = React.useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(15)
      );
      const snap = await getDocs(q);
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTransactions();
  }, [user.uid]);

  // Server-side Paynow payment status verification
  const verifyPaynowPayment = async (reference: string, expectedAmount?: number) => {
    setVerifyingRef(reference);
    try {
      const res = await fetch('/api/payments/paynow/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, userId: user.uid }),
      });

      const data = await res.json();

      if (data.status === 'completed') {
        const verifiedAmount = data.amount || expectedAmount || 0;
        
        // Find corresponding transaction in Firestore and update
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', user.uid),
          where('reference', '==', reference)
        );
        const snap = await getDocs(q);
        for (const docSnap of snap.docs) {
          if (docSnap.data().status !== 'completed') {
            await updateDoc(docSnap.ref, {
              status: 'completed',
              paynowReference: data.paynowReference || 'VERIFIED-PN',
              paidAt: serverTimestamp(),
            });
          }
        }

        // Credit user wallet only after server-verified confirmation
        if (data.credited) {
          await onUpdateUser({
            walletBalance: (user.walletBalance || 0) + verifiedAmount,
          });
        }

        if (pendingTx && pendingTx.reference === reference) {
          setPendingTx({
            ...pendingTx,
            status: 'completed',
            message: `Payment of $${verifiedAmount.toFixed(2)} verified and credited successfully!`,
          });
        }

        alert(`Paynow Payment Verified! $${verifiedAmount.toFixed(2)} added to your wallet. Ref: ${reference}`);
        await fetchTransactions();
      } else if (data.status === 'failed' || data.status === 'cancelled') {
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', user.uid),
          where('reference', '==', reference)
        );
        const snap = await getDocs(q);
        for (const docSnap of snap.docs) {
          await updateDoc(docSnap.ref, { status: 'failed' });
        }

        if (pendingTx && pendingTx.reference === reference) {
          setPendingTx({
            ...pendingTx,
            status: 'failed',
            message: 'Transaction failed or was cancelled on Paynow.',
          });
        }

        alert(`Paynow payment ${data.status}. No funds were credited.`);
        await fetchTransactions();
      } else {
        // Still pending
        if (pendingTx && pendingTx.reference === reference) {
          setPendingTx(prev => prev ? {
            ...prev,
            message: 'Payment is still awaiting confirmation from Paynow. If you have completed checkout, please wait a moment and click Verify.',
          } : null);
        }
        alert('Payment is still pending on Paynow. Please complete your checkout, then click Verify.');
      }
    } catch (err: any) {
      console.error('Error verifying Paynow status:', err);
      alert('Unable to reach server to verify Paynow status. Please try again.');
    } finally {
      setVerifyingRef(null);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 1) {
      alert('Please enter a valid deposit amount (minimum $1.00 USD).');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Call server-side Paynow integration to initiate official transaction
      const res = await fetch('/api/payments/paynow/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email || `${user.uid}@styn.app`,
          amount: amount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate Paynow payment');
      }

      const reference = data.reference;
      
      // 2. Record initial PENDING transaction in Firestore (NEVER marked completed until verified)
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: amount,
        type: 'deposit',
        status: 'pending',
        method: 'paynow',
        reference: reference,
        pollUrl: data.pollUrl || '',
        redirectUrl: data.redirectUrl || '',
        createdAt: serverTimestamp(),
      });

      // 3. Set active pending tracker in UI
      setPendingTx({
        reference: reference,
        amount: amount,
        redirectUrl: data.redirectUrl,
        pollUrl: data.pollUrl,
        status: 'initiated',
        message: 'Paynow checkout initialized. Please complete payment on Paynow.',
      });

      // 4. Open Paynow redirect URL
      if (data.redirectUrl) {
        window.open(data.redirectUrl, '_blank');
      }

      setDepositAmount('');
      await fetchTransactions();
    } catch (err: any) {
      console.error('Paynow initiation error:', err);
      alert(`Paynow error: ${err.message || 'Payment initiation failed'}`);
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Add Funds</h3>
                  <p className="text-neutral-400 font-medium text-xs mt-1">Payment Method: <span className="text-orange-500 font-black">Pay Now</span> (Sole Payment Gateway)</p>
                </div>
                <div className="h-10 px-3 rounded-xl bg-orange-600/10 border border-orange-500/30 flex items-center gap-1.5 text-orange-400 text-xs font-black uppercase tracking-wider">
                  <Shield size={14} className="text-orange-500" />
                  Pay Now
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Pay Now Gateway Card */}
              <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-neutral-900 to-neutral-950 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-950 font-black text-xs tracking-tighter">
                      PN
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-white uppercase tracking-wide">Pay Now</h4>
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/30">
                          Active Only
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">Official Zimbabwe & Global Payment Provider</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                  <span className="text-[10px] font-bold text-neutral-400 bg-neutral-800/80 px-2.5 py-1 rounded-lg">EcoCash</span>
                  <span className="text-[10px] font-bold text-neutral-400 bg-neutral-800/80 px-2.5 py-1 rounded-lg">OneMoney</span>
                  <span className="text-[10px] font-bold text-neutral-400 bg-neutral-800/80 px-2.5 py-1 rounded-lg">InnBucks</span>
                  <span className="text-[10px] font-bold text-neutral-400 bg-neutral-800/80 px-2.5 py-1 rounded-lg">Visa / Mastercard</span>
                  <span className="text-[10px] font-bold text-neutral-400 bg-neutral-800/80 px-2.5 py-1 rounded-lg">Zimswitch</span>
                </div>
              </div>

              {pendingTx ? (
                <div className="rounded-2xl border border-orange-500/40 bg-neutral-950 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-orange-400">Active Paynow Session</span>
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded ${
                      pendingTx.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {pendingTx.status}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-900 border border-white/5 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500 font-bold">Transaction Ref:</span>
                      <span className="text-white font-mono font-bold">{pendingTx.reference}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500 font-bold">Amount:</span>
                      <span className="text-emerald-400 font-black">${pendingTx.amount.toFixed(2)} USD</span>
                    </div>
                    {pendingTx.message && (
                      <p className="text-xs text-neutral-400 mt-2 pt-2 border-t border-white/5 leading-relaxed">
                        {pendingTx.message}
                      </p>
                    )}
                  </div>

                  {pendingTx.redirectUrl && pendingTx.status !== 'completed' && (
                    <a
                      href={pendingTx.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 p-3.5 text-xs font-black uppercase tracking-wider text-white transition-all shadow-lg shadow-orange-950/30"
                    >
                      <ExternalLink size={16} />
                      <span>Open Paynow Checkout</span>
                    </a>
                  )}

                  {pendingTx.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => verifyPaynowPayment(pendingTx.reference, pendingTx.amount)}
                      disabled={verifyingRef === pendingTx.reference}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-neutral-800 hover:bg-neutral-700 p-3.5 text-xs font-black uppercase tracking-wider text-white transition-all disabled:opacity-50"
                    >
                      {verifyingRef === pendingTx.reference ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-orange-500" />
                          <span>Verifying with Paynow...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} className="text-orange-500" />
                          <span>Verify Payment with Paynow</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setPendingTx(null)}
                    className="w-full text-center text-xs font-bold text-neutral-500 hover:text-neutral-400 pt-1"
                  >
                    Start a New Deposit
                  </button>
                </div>
              ) : (
                <>
                  {/* Amount Input */}
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">
                      Amount to Deposit ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-neutral-500">$</span>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-2xl border border-white/10 bg-neutral-950 p-5 pl-12 text-3xl font-black text-white focus:border-orange-500 focus:outline-none transition-all placeholder:text-neutral-700"
                      />
                    </div>
                  </div>

                  {/* Quick Select Amounts */}
                  <div className="grid grid-cols-5 gap-2">
                    {['5', '10', '25', '50', '100'].map((preset) => (
                      <button
                        key={`preset-${preset}`}
                        type="button"
                        onClick={() => setDepositAmount(preset)}
                        className={`py-2 rounded-xl text-xs font-black transition-all border ${
                          depositAmount === preset
                            ? 'bg-orange-600 text-white border-orange-500 shadow-md'
                            : 'bg-neutral-800/60 text-neutral-400 border-white/5 hover:bg-neutral-800 hover:text-white'
                        }`}
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>

                  {/* Pay Now Button */}
                  <button 
                    type="button"
                    onClick={handleDeposit}
                    disabled={isProcessing || !depositAmount || parseFloat(depositAmount) < 1}
                    className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 p-5 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-orange-950/40 hover:from-orange-500 hover:to-orange-600 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>Creating Paynow Session...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={18} className="fill-current" />
                        <span>Pay Now {depositAmount && parseFloat(depositAmount) > 0 ? `• $${parseFloat(depositAmount).toFixed(2)}` : ''}</span>
                      </>
                    )}
                  </button>
                </>
              )}

              <button 
                type="button"
                onClick={() => { setShowDeposit(false); setPendingTx(null); }}
                className="w-full rounded-2xl bg-neutral-800/80 py-3.5 text-xs font-black uppercase tracking-widest text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all"
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
          <button onClick={fetchTransactions} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors">
            <RefreshCw size={12} />
            Refresh
          </button>
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
              {transactions.map((tx, idx) => (
                <div key={`wallet-tx-item-${tx.id}-${user.uid}-${idx}`} className="group flex items-center justify-between rounded-2xl bg-neutral-950/50 p-5 border border-white/5 hover:border-orange-500/30 transition-all">
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
                      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-0.5">
                        <span className={tx.method === 'paynow' ? 'text-orange-400 font-black' : ''}>
                          {tx.method === 'paynow' ? 'Pay Now' : tx.method}
                        </span>
                        {' '}• <span className={tx.status === 'completed' ? 'text-green-500' : 'text-orange-500'}>{tx.status}</span>
                      </p>
                      {tx.method === 'paynow' && tx.status === 'pending' && tx.reference && (
                        <button
                          type="button"
                          onClick={() => verifyPaynowPayment(tx.reference!, tx.amount)}
                          disabled={verifyingRef === tx.reference}
                          className="mt-1.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-orange-400 hover:text-orange-300 bg-orange-600/10 hover:bg-orange-600/20 px-2 py-0.5 rounded-lg border border-orange-500/30 transition-all"
                        >
                          {verifyingRef === tx.reference ? (
                            <Loader2 size={10} className="animate-spin text-orange-400" />
                          ) : (
                            <RefreshCw size={10} className="text-orange-400" />
                          )}
                          <span>Verify with Paynow</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black tracking-tighter ${
                      tx.type === 'deposit' || tx.type === 'points_conversion' || tx.type === 'points_purchase' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {tx.type === 'deposit' || tx.type === 'points_conversion' || tx.type === 'points_purchase' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </p>
                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mt-0.5">
                      {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString() : 'Recent'}
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
