import React from 'react';
import { Globe, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { APP_NAME } from '../constants';

interface AuthProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  onSignup: (email: string, pass: string, name: string, gender: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onSignup, onGoogleLogin, onResetPassword }) => {
  const [isLogin, setIsLogin] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [gender, setGender] = React.useState('Male');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await onLogin(email, password);
      } else {
        await onSignup(email, password, `${firstName} ${lastName}`, gender);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await onResetPassword(email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-neutral-900 p-8 shadow-xl ring-1 ring-white/5 border border-white/5">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-white">
            {isLogin ? 'Welcome Back' : 'Join ' + APP_NAME}
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            {isLogin ? 'Log in to connect' : 'Create an account to start your journey'}
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="block w-full rounded-xl border border-white/5 bg-neutral-800 py-3 pl-10 pr-3 text-sm text-white placeholder-neutral-600 focus:border-orange-600 focus:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all"
                  placeholder="Name"
                />
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="block w-full rounded-xl border border-white/5 bg-neutral-800 py-3 pl-10 pr-3 text-sm text-white placeholder-neutral-600 focus:border-orange-600 focus:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all"
                  placeholder="Surname"
                />
              </div>
            </div>
          )}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
              <Mail size={20} />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-xl border border-white/5 bg-neutral-800 py-3 pl-10 pr-3 text-sm text-white placeholder-neutral-600 focus:border-orange-600 focus:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all"
              placeholder="Email address"
            />
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
              <Lock size={20} />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-xl border border-white/5 bg-neutral-800 py-3 pl-10 pr-3 text-sm text-white placeholder-neutral-600 focus:border-orange-600 focus:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all"
              placeholder="Password"
            />
          </div>

          {!isLogin && (
            <div className="relative">
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-600">Gender</label>
              <div className="flex gap-4">
                {['Male', 'Female'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all border border-white/5 ${
                      gender === g 
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' 
                        : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLogin && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {error && <p className="text-xs font-medium text-red-500">{error}</p>}
          {message && <p className="text-xs font-medium text-green-500">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-900/20 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-neutral-900 px-2 text-neutral-600">Or continue with</span>
          </div>
        </div>

        {/* Google Login */}
        <button
          onClick={onGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/5 bg-neutral-800 py-3 text-sm font-semibold text-white hover:bg-neutral-700 transition-all active:scale-95 shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" alt="Google" className="h-5 w-5" />
          Google Account
        </button>

        {/* Toggle */}
        <p className="text-center text-sm text-neutral-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-bold text-orange-500 hover:text-orange-400"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};
