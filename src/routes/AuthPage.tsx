import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { signUp, signIn } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'signup') {
      const result = await signUp(email, password);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage('Account created! Please check your email to confirm, then sign in.');
        setMode('login');
      }
    } else {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.35),rgba(2,6,23,0.95)),url('https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center blur-sm scale-105" />
      <div className="fixed inset-0 bg-slate-950/45" />

      <div className="relative z-10 w-full max-w-sm p-6">
        <h1 className="text-2xl font-black text-center mb-6">Green Watch Riders</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-2 border-white/20 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-white/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border-2 border-white/20 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-white/40"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 font-semibold">{error}</div>
          )}

          {message && (
            <div className="text-xs text-green-400 font-semibold">{message}</div>
          )}

          <button
            type="submit"
            className="w-full border-2 border-white/20 bg-white/10 py-2 text-sm font-black uppercase hover:bg-white/20 transition-colors"
          >
            {mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
              setMessage('');
            }}
            className="text-xs font-semibold text-white/60 hover:text-white underline"
          >
            {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
