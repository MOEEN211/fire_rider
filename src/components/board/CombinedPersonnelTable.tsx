import type { Person } from '../../types/board';
import DraggablePerson from '../dragdrop/DraggablePerson';
import GenericDroppable from '../dragdrop/GenericDroppable';
import { getPersonName } from '../../utils/people';

type CombinedPersonnelTableProps = {
  people: Person[];
  standbyAssignments: (string | undefined)[];
};

export default function CombinedPersonnelTable({ people, standbyAssignments }: CombinedPersonnelTableProps) {
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
        <div key={person.id} className="grid min-h-7 grid-cols-[32px_1fr_40px_40px_1fr] border-b border-ink text-[10px] font-black uppercase leading-6 last:border-b-0 hover:bg-white/25">
          <div className="border-r border-ink px-1"> </div>
          <DraggablePerson personId={person.id}>
            <div className="border-r border-ink px-1 tracking-tight h-full flex items-center">
              {person.rank} {person.name}
            </div>
          </DraggablePerson>
          <div className="border-r border-ink px-1 text-center flex items-center justify-center">{person.rides}</div>
          <div className="border-r border-ink px-1 text-center flex items-center justify-center">{index + 1}</div>
          <GenericDroppable id={`standby:${index}`} className="px-1 min-h-[1.5rem] flex items-center">
            {standbyAssignments[index] && (
              <DraggablePerson personId={standbyAssignments[index]!}>
                <span className="uppercase text-blue-300">
                  {getPersonName(people, standbyAssignments[index]!)}
                </span>
              </DraggablePerson>
            )}
          </GenericDroppable>
        </div>
      ))}
    </section>
  );
}
