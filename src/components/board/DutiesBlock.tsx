import { X } from 'lucide-react';
import type { Duty, Person } from '../../types/board';
import DroppableDuty from '../dragdrop/DroppableDuty';
import DraggablePerson from '../dragdrop/DraggablePerson';
import { getPersonName } from '../../utils/people';

type DutiesBlockProps = {
  duties: Duty[];
  people: Person[];
  onClearDuty?: (dutyId: string) => void;
};

export default function DutiesBlock({ duties, people, onClearDuty }: DutiesBlockProps) {
  return (
    <section className="border-2 border-ink border-r">
      <div className="border-b-2 border-ink text-center text-[10px] font-black leading-5">Duties</div>
      {duties.map((duty) => (
        <div key={duty.id} className="group grid min-h-9 grid-cols-[88px_1fr] border-b border-ink last:border-b-0">
          <div className="border-r border-ink px-1 py-1 text-[10px] font-black leading-6">{duty.label}</div>
          <div className="flex items-center">
            <DroppableDuty dutyId={duty.id}>
              {duty.personId ? (
                <DraggablePerson personId={duty.personId}>
                  <span>{getPersonName(people, duty.personId)}</span>
                </DraggablePerson>
              ) : (
                <span className="text-ink/40">Drop crew here</span>
              )}
            </DroppableDuty>
            {duty.personId && onClearDuty && (
              <button
                onClick={() => onClearDuty(duty.id)}
                className="ml-1 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 shrink-0 no-print"
                title="Clear duty"
              >
                <X size={12} className="text-red-600" />
              </button>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
