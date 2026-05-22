import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

type DateNavigatorProps = {
  selectedDate: Date;
  onPrevious: () => void;
  onNext: () => void;
};

export default function DateNavigator({ selectedDate, onPrevious, onNext }: DateNavigatorProps) {
  const { signOut } = useAuth();

  return (
    <div className="no-print flex h-20 items-center justify-between bg-slate-950/90 px-4 text-white shadow-2xl sm:px-8">
      <button
        type="button"
        onClick={onPrevious}
        className="flex items-center gap-2 text-lg font-bold uppercase tracking-wide text-white/80 transition hover:text-white"
      >
        <ChevronLeft className="h-12 w-12 text-red-600" strokeWidth={4} />
        Back
      </button>

      <h1 className="text-center text-xl font-black uppercase tracking-wider sm:text-3xl">
        {format(selectedDate, 'EEEE, MMM d, yyyy')}
      </h1>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-white/60 transition hover:text-white"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 text-lg font-bold uppercase tracking-wide text-white/80 transition hover:text-white"
        >
          Next
          <ChevronRight className="h-12 w-12 text-red-600" strokeWidth={4} />
        </button>
      </div>
    </div>
  );
}
