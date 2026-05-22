import type { Person } from '../../types/board';
import DraggablePerson from '../dragdrop/DraggablePerson';

type PersonnelTableProps = {
  people: Person[];
};

export default function PersonnelTable({ people }: PersonnelTableProps) {
  return (
    <section className="border-2 border-ink border-r-0 bg-board">
      <div className="grid grid-cols-[38px_42px_1fr_54px] border-b-2 border-ink text-center text-[10px] font-black leading-5">
        <div className="border-r border-ink"> </div>
        <div className="border-r border-ink"> </div>
        <div className="border-r border-ink">PERSONNEL</div>
        <div> </div>
      </div>
      {people.map((person) => (
        <DraggablePerson key={person.id} personId={person.id}>
          <div className="grid min-h-7 grid-cols-[38px_42px_1fr_54px] border-b border-ink text-[10px] font-black uppercase leading-6 last:border-b-0 hover:bg-white/25">
            <div className="border-r border-ink px-1">{person.marker}</div>
            <div className="border-r border-ink px-1">{person.rank}</div>
            <div className="border-r border-ink px-1 tracking-tight">{person.name}</div>
            <div className="px-1 text-center">{person.staffNumber}</div>
          </div>
        </DraggablePerson>
      ))}
    </section>
  );
}
