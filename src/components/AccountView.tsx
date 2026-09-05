import React, { useState } from 'react';
import { UserCircle2, Loader2, LogOut, Package } from 'lucide-react';
import { User } from '../types';
import { SERVICE_AREA_CITIES } from '../services/pricingEngine';

interface AccountViewProps {
  currentUser: User | null;
  authError: string | null;
  signUp: (email: string, password: string, name: string, phone: string, city: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => void;
  navigateTo: (route: string, params?: any) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  currentUser,
  authError,
  signUp,
  signIn,
  logout,
  navigateTo,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(SERVICE_AREA_CITIES[0]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-8 space-y-6 text-center">
          <span className="w-14 h-14 rounded-full bg-steel-tint text-steel-dark flex items-center justify-center mx-auto">
            <UserCircle2 className="w-8 h-8" />
          </span>
          <div>
            <h1 className="text-lg font-extrabold font-display text-on-surface">{currentUser.name}</h1>
            <p className="text-xs text-on-surface-variant mt-1">{currentUser.email}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigateTo('dashboard')}
              className="w-full flex items-center justify-center gap-2 bg-steel hover:bg-steel-dark text-white font-bold text-sm px-4 py-2.5 rounded-lg shadow"
            >
              <Package className="w-4 h-4" />
              <span>My Orders</span>
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container text-on-surface font-bold text-sm px-4 py-2.5 rounded-lg border border-outline-variant"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password, name.trim(), phone.trim(), city);
      } else {
        await signIn(email.trim(), password);
      }
      navigateTo('dashboard');
    } catch {
      // authError is surfaced below from store state
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-8 space-y-6">
        <div className="flex flex-col items-center text-center gap-2">
          <span className="w-12 h-12 rounded-full bg-steel-tint text-steel-dark flex items-center justify-center">
            <UserCircle2 className="w-6 h-6" />
          </span>
          <h1 className="text-xl font-extrabold font-display text-on-surface">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="text-xs text-on-surface-variant">
            Optional — you can also check out as a guest without an account.
          </p>
        </div>

        <div className="flex bg-surface-container-low p-1 rounded-lg text-xs font-bold">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 rounded-md transition-colors ${mode === 'signin' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-md transition-colors ${mode === 'signup' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant'}`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <>
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-sm"
                  placeholder="e.g. Bilal Ahmed"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant block mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-sm"
                    placeholder="03001234567"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant block mb-1">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-sm"
                  >
                    {SERVICE_AREA_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-sm"
              placeholder="••••••••"
            />
          </div>

          {authError && (
            <p className="text-xs font-semibold text-error bg-error-container/50 rounded-lg px-3 py-2">{authError}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-steel hover:bg-steel-dark disabled:opacity-60 text-white font-bold text-sm px-4 py-2.5 rounded-lg shadow"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
          </button>
        </form>

        <button
          onClick={() => navigateTo('home')}
          className="w-full text-xs font-semibold text-on-surface-variant hover:text-on-surface text-center"
        >
          Continue as guest
        </button>
      </div>
    </div>
  );
};
