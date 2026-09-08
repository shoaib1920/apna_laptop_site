import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { auth } from '../services/firebase';

interface AdminLoginViewProps {
  navigateTo: (route: string, params?: any) => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ navigateTo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError('Invalid email or password. Contact the site owner if you need admin access.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-8 space-y-6">
        <div className="flex flex-col items-center text-center gap-2">
          <span className="w-12 h-12 rounded-full bg-graphite flex items-center justify-center text-white">
            <ShieldAlert className="w-6 h-6" />
          </span>
          <h1 className="text-xl font-extrabold font-display text-on-surface">Admin Sign In</h1>
          <p className="text-xs text-on-surface-variant">
            Restricted to Apna Laptop staff. Sign in with your admin account to manage inventory and orders.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-sm"
              placeholder="admin@apnalaptop.store"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-error bg-error-container/50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-steel hover:bg-steel-dark disabled:opacity-60 text-white font-bold text-sm px-4 py-2.5 rounded-lg shadow"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <button
          onClick={() => navigateTo('home')}
          className="w-full text-xs font-semibold text-on-surface-variant hover:text-on-surface text-center"
        >
          Back to homepage
        </button>
      </div>
    </div>
  );
};
