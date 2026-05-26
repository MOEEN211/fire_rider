import type { CalendarEvent, Duty, Person, Vehicle } from '../../types/board';
import CombinedPersonnelTable from './CombinedPersonnelTable';
import DutiesBlock from './DutiesBlock';
import NotesBlock from './NotesBlock';
import VehicleBlock from './VehicleBlock';

type RidersBoardProps = {
  selectedDate: Date;
  shift: 'Day' | 'Night';
  isOffDuty?: boolean;
  shiftLabel?: string;
  vehicles: Vehicle[];
  people: Person[];
  duties: Duty[];
  events: CalendarEvent[];
  standbyAssignments: (string | undefined)[];
  onAddEvent: (time: string, title: string) => void;
  onDeleteEvent?: (eventId: string) => void;
};

export default function RidersBoard({ selectedDate, shift, isOffDuty = false, shiftLabel, vehicles, people, duties, events, standbyAssignments, onAddEvent, onDeleteEvent }: RidersBoardProps) {
  return (
    <main className="riders-board relative mx-auto w-[min(94vw,760px)] border-4 border-ink bg-board p-5 text-ink shadow-paper print:shadow-none sm:p-7">
      {isOffDuty && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-ink/80 text-board">
          <h2 className="text-3xl font-black uppercase tracking-widest">Off Duty</h2>
          <p className="mt-2 text-sm font-bold uppercase tracking-widest opacity-80">Check tomorrow's rota</p>
        </div>
      )}

      <header className="mb-4 text-center">
        <h2 className="text-xl font-black uppercase">Green Watch Riders</h2>
        <div className="mt-5 flex items-center justify-between text-xs font-black">
          <div className="flex items-center gap-3 pl-14">
            <span>Date:</span>
            <span className="inline-block min-w-44 border-b-2 border-ink pb-1">
              {selectedDate.toLocaleDateString('en-GB')}
            </span>
          </div>
          <div className="flex items-center gap-2 pr-4">
            <span className="text-[10px] font-bold uppercase tracking-wide text-ink/70">
              {shiftLabel ?? 'Shift'}
            </span>
            <div className="flex items-center gap-1 pointer-events-none opacity-80">
              <span
                className={`text-[12px] font-black uppercase border-2 px-3 py-0.5 min-w-[70px] text-center transition-colors ${
                  shift === 'Day'
                    ? 'border-ink bg-ink text-board'
                    : 'border-ink/40 bg-transparent text-ink/40'
                }`}
              >
                DAY
              </span>
              <span className="text-ink/40 text-[10px]">/</span>
              <span
                className={`text-[12px] font-black uppercase border-2 px-3 py-0.5 min-w-[70px] text-center transition-colors ${
                  shift === 'Night'
                    ? 'border-ink bg-ink text-board'
                    : 'border-ink/40 bg-transparent text-ink/40'
                }`}
              >
                NIGHT
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-0 items-start">
        {/* Left column */}
        <div>
          <VehicleBlock vehicle={vehicles[0]} people={people} />
          <div className="mt-3">
            <VehicleBlock vehicle={vehicles[2]} people={people} />
          </div>
          <div className="mt-3">
            <DutiesBlock duties={duties} people={people} />
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col h-full">
          <VehicleBlock vehicle={vehicles[1]} people={people} />
          <div className="mt-3 flex-1">
            <NotesBlock events={events} onAddEvent={onAddEvent} onDeleteEvent={onDeleteEvent} />
          </div>
        </div>
      </div>

      <div className="mt-3">
        <CombinedPersonnelTable people={people} standbyAssignments={standbyAssignments} />
      </div>
    </main>
  );
}
