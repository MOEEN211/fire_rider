import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './routes/AuthPage';
import DashboardPage from './routes/DashboardPage';
import { isSupabaseConfigured } from './services/supabaseClient';

function AppContent() {
  const { user, loading } = useAuth();

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-xl border-2 border-white/20 bg-white/5 p-6 text-center">
          <h1 className="mb-4 text-2xl font-black">Supabase is not configured</h1>
          <p className="text-sm font-semibold text-white/80">
            Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your Vercel project environment variables, then redeploy.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-sm font-semibold uppercase tracking-wider">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <DashboardPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
