type BoardActionsProps = {
  onGenerate: () => void;
  onConfirmPrint: () => void;
};

export default function BoardActions({ onGenerate, onConfirmPrint }: BoardActionsProps) {
  return (
    <div className="no-print flex items-center justify-center gap-0 pt-8 text-sm font-black uppercase tracking-wide text-white sm:text-base">
      <button
        type="button"
        onClick={onGenerate}
        className="bg-red-600 px-8 py-4 shadow-xl transition hover:bg-red-700 sm:px-12"
      >
        Generate Board
      </button>
      <button
        type="button"
        onClick={onConfirmPrint}
        className="bg-slate-600 px-8 py-4 shadow-xl transition hover:bg-slate-700 sm:px-12"
      >
        Confirm & Print
      </button>
    </div>
  );
}
