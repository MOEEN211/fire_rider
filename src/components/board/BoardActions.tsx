type BoardActionsProps = {
  onAutoGenerate?: () => void;
  onConfirmBoard: () => void;
  onPrint: () => void;
  isBoardEmpty?: boolean;
};

export default function BoardActions({ onAutoGenerate, onConfirmBoard, onPrint, isBoardEmpty = false }: BoardActionsProps) {
  const handleConfirmClick = () => {
    if (isBoardEmpty) {
      window.alert('Cannot confirm an empty board. Please add at least one assignment first.');
      return;
    }
    const confirmed = window.confirm('Are you sure you want to confirm and save this board?');
    if (confirmed) {
      onConfirmBoard();
    }
  };

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
        onClick={handleConfirmClick}
        disabled={isBoardEmpty}
        className={`px-8 py-4 shadow-xl transition sm:px-12 ${
          isBoardEmpty
            ? 'cursor-not-allowed bg-gray-500 opacity-50'
            : 'bg-red-600 hover:bg-red-700'
        }`}
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
