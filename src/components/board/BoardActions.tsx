type BoardActionsProps = {
  onAutoGenerate?: () => void;
  onConfirmBoard: () => void;
  onPrint: () => void;
};

export default function BoardActions({ onAutoGenerate, onConfirmBoard, onPrint }: BoardActionsProps) {
  return (
    <div className="no-print flex items-center justify-center gap-0 pt-8 text-sm font-black uppercase tracking-wide text-white sm:text-base">
      {onAutoGenerate && (
        <button
          type="button"
          onClick={onAutoGenerate}
          className="bg-blue-600 px-6 py-4 shadow-xl transition hover:bg-blue-700 sm:px-10"
        >
          Auto-Generate
        </button>
      )}
      <button
        type="button"
        onClick={onConfirmBoard}
        className="bg-red-600 px-8 py-4 shadow-xl transition hover:bg-red-700 sm:px-12"
      >
        Confirm Board
      </button>
      <button
        type="button"
        onClick={onPrint}
        className="bg-slate-600 px-8 py-4 shadow-xl transition hover:bg-slate-700 sm:px-12"
      >
        Print
      </button>
    </div>
  );
}
