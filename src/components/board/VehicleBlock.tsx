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
        {vehicle.seats.map((seat) => (
          <div key={seat.id} className="grid min-h-8 grid-cols-[78px_1fr] border-b border-ink last:border-b-0">
            <div className="border-r border-ink px-1 py-1 text-[10px] font-black uppercase leading-5">
              {seat.label}
            </div>
            <DroppableSeat seatId={seat.id}>
              {seat.personId ? (
                <DraggablePerson personId={seat.personId}>
                  <span>{getPersonName(people, seat.personId)}</span>
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
    </section>
  );
}
