import type { Person } from '../../types/board';
import DraggablePerson from '../dragdrop/DraggablePerson';

type CombinedPersonnelTableProps = {
  people: Person[];
};

export default function CombinedPersonnelTable({ people }: CombinedPersonnelTableProps) {
  console.log('[CombinedPersonnelTable] Received people count:', people.length);
  return (
    <section className="border-2 border-ink relative isolate">
      <div className="grid grid-cols-[32px_1fr_40px_40px_1fr] border-b-2 border-ink text-center text-[10px] font-black leading-5">
        <div className="border-r border-ink"> </div>
        <div className="border-r border-ink"> </div>
        <div className="border-r border-ink">c</div>
        <div className="border-r border-ink"> </div>
        <div>Standby</div>
      </div>
      {people.map((person, index) => (
        <DraggablePerson key={person.id} personId={person.id}>
          <div className="grid min-h-7 grid-cols-[32px_1fr_40px_40px_1fr] border-b border-ink text-[10px] font-black uppercase leading-6 last:border-b-0 hover:bg-white/25">
            <div className="border-r border-ink px-1"> </div>
            <div className="border-r border-ink px-1 tracking-tight">
              {person.rank} {person.name}
            </div>
            <div className="border-r border-ink px-1 text-center">{person.rides}</div>
            <div className="border-r border-ink px-1 text-center">{index + 1}</div>
            <div className="px-1"> </div>
          </div>
        </DraggablePerson>
      ))}
    </section>
  );
}
