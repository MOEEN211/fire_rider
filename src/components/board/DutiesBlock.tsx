import type { Duty, Person } from '../../types/board';
import DroppableDuty from '../dragdrop/DroppableDuty';
import DraggablePerson from '../dragdrop/DraggablePerson';
import { getPersonName } from '../../utils/people';

type DutiesBlockProps = {
  duties: Duty[];
  people: Person[];
};

export default function DutiesBlock({ duties, people }: DutiesBlockProps) {
  return (
    <section className="border-2 border-ink border-r">
      <div className="border-b-2 border-ink text-center text-[10px] font-black leading-5">Duties</div>
      {duties.map((duty) => (
        <div key={duty.id} className="grid min-h-9 grid-cols-[88px_1fr] border-b border-ink last:border-b-0">
          <div className="border-r border-ink px-1 py-1 text-[10px] font-black leading-6">{duty.label}</div>
          <DroppableDuty dutyId={duty.id}>
            {duty.personId ? (
              <DraggablePerson personId={duty.personId}>
                <span>{getPersonName(people, duty.personId)}</span>
              </DraggablePerson>
            ) : (
              <span className="text-ink/40">Drop crew here</span>
            )}
          </DroppableDuty>
        </div>
      ))}
    </section>
  );
}
