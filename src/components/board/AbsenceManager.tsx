import type { AvailabilityCode, Person } from '../../types/board';
import { AVAILABILITY_CODES } from '../../services/seatAssignmentService';

type AbsenceManagerProps = {
  people: Person[];
  onUpdateAvailability: (personId: string, availability: AvailabilityCode) => void;
  onRegenerateBoard: () => void;
};

export default function AbsenceManager({ people, onUpdateAvailability, onRegenerateBoard }: AbsenceManagerProps) {
  const unavailablePeople = people.filter((p) => p.availability !== 'On Duty');

  return (
    <div className="no-print mx-auto max-w-5xl px-4 py-3">
      <div className="rounded border-2 border-ink bg-board p-3 text-ink shadow-paper">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase">Personnel Availability</h3>
          <button
            type="button"
            onClick={onRegenerateBoard}
            className="border-2 border-ink bg-ink px-3 py-1 text-[10px] font-black uppercase text-board hover:bg-ink/80"
          >
            Regenerate Board
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {people.map((person) => (
            <div key={person.id} className="flex items-center gap-1 text-[10px]">
              <span className="font-black truncate">
                {person.rank} {person.name}
              </span>
              <select
                value={person.availability}
                onChange={(e) => onUpdateAvailability(person.id, e.target.value as AvailabilityCode)}
                className={`min-w-0 border border-ink px-1 py-0.5 text-[9px] font-bold ${
                  person.availability === 'On Duty'
                    ? 'bg-emerald-100'
                    : 'bg-red-100'
                }`}
              >
                {AVAILABILITY_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        {unavailablePeople.length > 0 && (
          <div className="mt-2 border-t border-ink/30 pt-2 text-[9px] font-semibold text-red-700">
            Absent: {unavailablePeople.map((p) => `${p.rank} ${p.name}`).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}
