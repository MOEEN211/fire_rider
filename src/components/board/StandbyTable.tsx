import type { Person } from '../../types/board';
import GenericDroppable from '../dragdrop/GenericDroppable';
import DraggablePerson from '../dragdrop/DraggablePerson';
import { getPersonName } from '../../utils/people';

type StandbyTableProps = {
  rows?: number;
  people: Person[];
  assignments: (string | undefined)[];
};

export default function StandbyTable({ rows = 12, people, assignments }: StandbyTableProps) {
  return (
    <section className="border-2 border-ink">
      <div className="grid grid-cols-[42px_1fr] border-b-2 border-ink text-center text-[10px] font-black leading-5">
        <div className="border-r border-ink"> </div>
        <div>Standby</div>
      </div>
      {Array.from({ length: rows }, (_, index) => {
        const personId = assignments[index];
        return (
          <div key={index} className="grid min-h-6 grid-cols-[42px_1fr] border-b border-ink text-[10px] font-black last:border-b-0">
            <div className="flex items-center justify-center border-r border-ink text-center">{index + 1}</div>
            <GenericDroppable id={`standby:${index}`} className="flex items-center px-1">
              {personId ? (
                <DraggablePerson personId={personId}>
                  <span className="leading-6 uppercase">{getPersonName(people, personId)}</span>
                </DraggablePerson>
              ) : (
                <div className="h-6 w-full" />
              )}
            </GenericDroppable>
          </div>
        );
      })}
    </section>
  );
}
