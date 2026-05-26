import type { Person, Vehicle } from '../../types/board';
import DroppableSeat from '../dragdrop/DroppableSeat';
import DraggablePerson from '../dragdrop/DraggablePerson';
import { getPersonName } from '../../utils/people';

type VehicleBlockProps = {
  vehicle: Vehicle;
  people: Person[];
};

export default function VehicleBlock({ vehicle, people }: VehicleBlockProps) {
  return (
    <section className="border-2 border-ink">
      <div className="border-b-2 border-ink text-center text-[10px] font-black leading-5">
        {vehicle.name}
      </div>

      <div>
        {(() => {
          const groups: { label: string; seats: any[] }[] = [];
          [...vehicle.seats]
            .sort((a, b) => (a as any).display_order - (b as any).display_order)
            .forEach((seat) => {
              const displayLabel = seat.label.replace(/\s?\d+$/, '');
              if (groups.length > 0 && groups[groups.length - 1].label === displayLabel) {
                groups[groups.length - 1].seats.push(seat);
              } else {
                groups.push({ label: displayLabel, seats: [seat] });
              }
            });

          return groups.map((group, gIdx) => (
            <div key={gIdx} className="grid grid-cols-[78px_1fr] border-b border-ink last:border-b-0">
              <div className="flex items-center justify-center border-r border-ink p-1 text-center text-[10px] font-black uppercase leading-[1.2]">
                {group.label}
              </div>
              <div className="flex flex-col">
                {group.seats.map((seat, sIdx) => (
                  <div
                    key={seat.id}
                    className="flex min-h-[32px] items-center border-b border-ink last:border-b-0 px-1 py-1"
                  >
                    <DroppableSeat seatId={seat.id}>
                      {seat.personId ? (
                        <DraggablePerson personId={seat.personId}>
                          <span className="truncate">{getPersonName(people, seat.personId)}</span>
                        </DraggablePerson>
                      ) : (
                        <span className="text-ink/60 font-black">
                          {seat.label === 'ECO' ? '' : 'SBY'}
                        </span>
                      )}
                    </DroppableSeat>
                  </div>
                ))}
              </div>
            </div>
          ));
        })()}
      </div>
    </section>
  );
}
