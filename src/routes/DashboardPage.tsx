import { useEffect, useMemo, useState } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { addDays, subDays } from 'date-fns';
import AbsenceManager from '../components/board/AbsenceManager';
import BoardActions from '../components/board/BoardActions';
import RidersBoard from '../components/board/RidersBoard';
import DateNavigator from '../components/layout/DateNavigator';
import { mockDuties, mockEvents, mockPeople, mockVehicles } from '../data/mockBoardData';
import { confirmBoardByDate, getAssignmentHistory, getBoardAssignments, getBoardByDate, getBoardDutyAssignments, getPersonTotalRides, getPersonRidesForDate, getRosterAssignments, getStandbyAssignments, saveDutyAssignment, saveRosterAssignment, saveSeatAssignment, saveStandbyAssignment } from '../services/boardService';
import { createCalendarEvent, deleteCalendarEvent } from '../services/eventService';
import { getDashboardData, getEventsByDate } from '../services/dashboardDataService';
import { buildMockHistory, generateBoardAssignments, generateDutyAssignments } from '../services/seatAssignmentService';
import { getShiftForDate, getShiftLabel } from '../services/shiftPatternService';
import type { CalendarEvent, Duty, Person, Vehicle } from '../types/board';

function formatDateForSupabase(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [people, setPeople] = useState<Person[]>(mockPeople);
  const [duties, setDuties] = useState<Duty[]>(mockDuties);
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [dataSource, setDataSource] = useState<'mock' | 'supabase' | 'loading'>('loading');
  const [historicalRides, setHistoricalRides] = useState<Record<string, number>>({});
  const [confirmationStatus, setConfirmationStatus] = useState('');
  const [boardStatus, setBoardStatus] = useState('');
  const [shift, setShift] = useState<'Day' | 'Night'>('Day');
  const [isOffDuty, setIsOffDuty] = useState(false);
  const [standbyAssignments, setStandbyAssignments] = useState<(string | undefined)[]>(new Array(16).fill(undefined));

  // Auto-calculate shift from the 4-on-4-off pattern whenever date changes
  useEffect(() => {
    const calculated = getShiftForDate(selectedDate);
    if (calculated === 'Off') {
      setIsOffDuty(true);
    } else {
      setIsOffDuty(false);
      setShift(calculated);
    }
  }, [selectedDate]);

  const statusText = useMemo(() => {
    if (confirmationStatus) {
      return confirmationStatus;
    }

    if (dataSource === 'loading') {
      return 'Loading Riders Board data from Supabase';
    }

    if (dataSource === 'supabase') {
      return boardStatus
        ? `Live prototype: using Supabase database data - Board ${boardStatus}`
        : 'Live prototype: using Supabase database data';
    }

    return 'Prototype mode: using fallback mock rota and Outlook notes';
  }, [boardStatus, confirmationStatus, dataSource]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const dashboardData = await getDashboardData();

        if (!isMounted) {
          return;
        }

        console.log('[DashboardPage] Setting people:', dashboardData.people.length);
        setVehicles(dashboardData.vehicles.length > 0 ? dashboardData.vehicles : mockVehicles);
        setPeople(dashboardData.people.length > 0 ? dashboardData.people : mockPeople);
        setDuties(dashboardData.duties.length > 0 ? dashboardData.duties : mockDuties);
        setEvents(dashboardData.events.length > 0 ? dashboardData.events : mockEvents);
        setDataSource('supabase');
      } catch (error) {
        console.error('Failed to load Supabase dashboard data', error);

        if (!isMounted) {
          return;
        }

        setVehicles(mockVehicles);
        setPeople(mockPeople);
        setDuties(mockDuties);
        setEvents(mockEvents);
        setDataSource('mock');
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load saved board state for selected date
  useEffect(() => {
    let isMounted = true;

    async function loadSavedBoardState() {
      if (dataSource === 'loading') {
        return;
      }

      try {
        const boardDate = formatDateForSupabase(selectedDate);
        const [board, seatAssignments, dutyAssignments, savedStandby, totalRides, rosterAssignments] = await Promise.all([
          getBoardByDate(boardDate, shift),
          getBoardAssignments(boardDate, shift),
          getBoardDutyAssignments(boardDate, shift),
          getStandbyAssignments(boardDate, shift),
          getPersonTotalRides(), // Get total historical rides for all people
          getRosterAssignments(boardDate), // Get availability for this date
        ]);

        if (!isMounted) {
          return;
        }

        if (board) {
          setBoardStatus(board.status === 'Confirmed' ? 'Confirmed' : 'Draft');
        } else {
          setBoardStatus('');
        }

        // Apply seat assignments to vehicles
        setVehicles((current) =>
          current.map((v) => ({
            ...v,
            seats: v.seats.map((s) => ({
              ...s,
              personId: ((seatAssignments as unknown) as Record<string, string>)[s.id],
            })),
          })),
        );

        // Apply duty assignments
        setDuties((current) =>
          current.map((duty) => ({
            ...duty,
            personId: ((dutyAssignments as unknown) as Record<string, string>)[duty.id],
          })),
        );

        setStandbyAssignments(savedStandby);

        // Store historical rides count from database
        console.log('[loadSavedBoardState] Storing historical rides count:', totalRides);
        setHistoricalRides(totalRides);

        // Apply roster/availability assignments to people
        setPeople((current) =>
          current.map((p) => {
            const status = rosterAssignments[p.id];
            return {
              ...p,
              availability: status ?? 'On Duty',
              dutyStatus: status ?? 'On Duty',
            };
          }),
        );
      } catch (error) {
        console.error('Failed to load saved board state', error);
      }
    }

    loadSavedBoardState();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, shift, dataSource]);

  // Track people rides in current view
  useEffect(() => {
    const currentAssignments = new Map<string, number>();

    vehicles.forEach((vehicle) => {
      vehicle.seats.forEach((seat) => {
        if (seat.personId) {
          currentAssignments.set(seat.personId, (currentAssignments.get(seat.personId) ?? 0) + 1);
        }
      });
    });

    duties.forEach((duty) => {
      if (duty.personId) {
        currentAssignments.set(duty.personId, (currentAssignments.get(duty.personId) ?? 0) + 1);
      }
    });

    setPeople((currentPeople) =>
      currentPeople.map((person) => {
        const history = historicalRides[person.id] ?? 0;
        const current = currentAssignments.get(person.id) ?? 0;
        return {
          ...person,
          rides: history + current,
        };
      })
    );
  }, [vehicles, duties, historicalRides]);


  useEffect(() => {
    let isMounted = true;

    async function loadEventsForDate() {
      if (dataSource === 'loading') {
        return;
      }

      try {
        const boardDate = formatDateForSupabase(selectedDate);
        const dateEvents = await getEventsByDate(boardDate);

        if (!isMounted) {
          return;
        }

        setEvents(dateEvents.length > 0 ? dateEvents : mockEvents);
      } catch (error) {
        console.error('Failed to load events for date', error);
        setEvents(mockEvents);
      }
    }

    loadEventsForDate();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, dataSource]);

  // Auto-generate board assignments following all rules
  async function handleAutoGenerate() {
    console.log('[handleAutoGenerate] Starting generation...');
    setConfirmationStatus('Generating optimal board...');
    
    try {
      const history = await getAssignmentHistory();
      
      // Generate seat assignments
      const seatAssignments = generateBoardAssignments(vehicles, people, history);
      console.log('[handleAutoGenerate] seatAssignments:', seatAssignments);

      const updatedVehicles = vehicles.map((vehicle) => ({
        ...vehicle,
        seats: vehicle.seats.map((seat) => ({
          ...seat,
          personId: seatAssignments[seat.id],
        })),
      }));

      setVehicles(updatedVehicles);

      // Generate duty assignments (Rule 6: rotate fairly between FF rank)
      const dutyAssignments = generateDutyAssignments(duties, people, history);
      console.log('[handleAutoGenerate] dutyAssignments:', dutyAssignments);

      const updatedDuties = duties.map((duty) => ({
        ...duty,
        personId: dutyAssignments[duty.id],
      }));

      setDuties(updatedDuties);

      // Update rides count visually for immediate feedback
      const currentViewRides = new Map<string, number>();
      updatedVehicles.forEach(v => v.seats.forEach(s => { if(s.personId) currentViewRides.set(s.personId, (currentViewRides.get(s.personId) || 0) + 1); }));
      updatedDuties.forEach(d => { if(d.personId) currentViewRides.set(d.personId, (currentViewRides.get(d.personId) || 0) + 1); });

      setPeople(prev => prev.map(p => ({
        ...p,
        rides: (historicalRides[p.id] || 0) + (currentViewRides.get(p.id) || 0)
      })));

      setConfirmationStatus('Board auto-generated. Click Confirm Board to save.');
    } catch (err) {
      console.error('Failed to auto-generate board', err);
      setConfirmationStatus('Error generating board. Please try again.');
    }
  }

  // Save current board assignments (after editing or auto-generating)
  async function handleConfirmBoard() {
    console.log('[handleConfirmBoard] Saving current assignments...');
    setConfirmationStatus('Saving board...');

    try {
      const boardDate = formatDateForSupabase(selectedDate);
      
      // 1. Confirm the board (sets confirmed=true)
      await confirmBoardByDate(boardDate, shift);
      
      // 2. Clear then Save all seat assignments
      for (const vehicle of vehicles) {
        for (const seat of vehicle.seats) {
          await saveSeatAssignment(boardDate, seat.id, seat.personId, shift);
        }
      }

      // 3. Save all duty assignments
      for (const duty of duties) {
        await saveDutyAssignment(boardDate, duty.id, duty.personId, shift);
      }

      // 4. Update local state to reflect confirmation
      setBoardStatus('Confirmed');
      
      // 5. Refresh historical rides count
      const updatedTotalRides = await getPersonTotalRides();
      setHistoricalRides(updatedTotalRides);

      setConfirmationStatus('Board saved and confirmed successfully!');
      setTimeout(() => setConfirmationStatus(''), 3000);
    } catch (error) {
      console.error('Failed to confirm board', error);
      setConfirmationStatus('Failed to save board. Check console for errors.');
    }
  }

  function handlePrint() {
    window.print();
  }

  async function handleUpdateAvailability(personId: string, status: any) {
    try {
      const boardDate = formatDateForSupabase(selectedDate);
      await saveRosterAssignment(boardDate, personId, status);
      
      // Refresh people list from DB
      const rosterAssignments = await getRosterAssignments(boardDate);
      setPeople((current) =>
        current.map((p) => {
          const status = rosterAssignments[p.id];
          return {
            ...p,
            availability: status ?? 'On Duty',
            dutyStatus: status ?? 'On Duty',
          };
        }),
      );
    } catch (error) {
      console.error('Failed to update availability', error);
    }
  }

  function handleRegenerateBoard() {
    handleAutoGenerate();
  }

  async function handleAddEvent(time: string, title: string) {
    try {
      const boardDate = formatDateForSupabase(selectedDate);
      const newEvent = await createCalendarEvent(boardDate, time, title);
      setEvents((current) => [...current, newEvent]);
      setConfirmationStatus('Note added.');
      setTimeout(() => setConfirmationStatus(''), 2000);
    } catch (error) {
      console.error('Failed to add event', error);
      setConfirmationStatus('Failed to add note.');
    }
  }

  async function handleDeleteEvent(eventId: string) {
    try {
      await deleteCalendarEvent(eventId);
      setEvents((current) => current.filter((e) => e.id !== eventId));
      setConfirmationStatus('Note deleted.');
      setTimeout(() => setConfirmationStatus(''), 2000);
    } catch (error) {
      console.error('Failed to delete event', error);
      setConfirmationStatus('Failed to delete note.');
    }
  }

  const [activePerson, setActivePerson] = useState<Person | null>(null);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const person = people.find((p) => p.id === active.id);
    if (person) setActivePerson(person);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActivePerson(null);

    if (!over) return;

    const draggedPersonId = (active.id as string).replace('person:', '');
    const overId = over.id as string;

    console.log(`[handleDragEnd] Dragged ${draggedPersonId} over ${overId}`);

    if (overId.startsWith('seat:')) {
      const seatId = overId.replace('seat:', '');
      
      setVehicles((currentVehicles) =>
        currentVehicles.map((vehicle) => ({
          ...vehicle,
          seats: vehicle.seats.map((seat) => {
            if (seat.id === seatId) {
              return { ...seat, personId: draggedPersonId };
            }
            return seat;
          }),
        })),
      );

      try {
        const boardDate = formatDateForSupabase(selectedDate);
        await saveSeatAssignment(boardDate, seatId, draggedPersonId, shift);
      } catch (err) {
        console.error('Failed to save seat assignment', err);
      }
      setConfirmationStatus('');

    } else if (overId.startsWith('duty:')) {
      const dutyId = overId.replace('duty:', '');

      setDuties((currentDuties) =>
        currentDuties.map((duty) => {
          if (duty.id === dutyId) {
            return { ...duty, personId: draggedPersonId };
          }
          return duty;
        }),
      );

      try {
        const boardDate = formatDateForSupabase(selectedDate);
        await saveDutyAssignment(boardDate, dutyId, draggedPersonId, shift);
      } catch (err) {
        console.error('Failed to save duty assignment', err);
      }
      setConfirmationStatus('');
    } else if (overId.startsWith('standby:')) {
      const index = parseInt(overId.replace('standby:', ''), 10);
      setStandbyAssignments((current) => {
        const next = [...current];
        next[index] = draggedPersonId;
        return next;
      });
      try {
        const boardDate = formatDateForSupabase(selectedDate);
        await saveStandbyAssignment(boardDate, index, draggedPersonId, shift);
      } catch (err) {
        console.error('Failed to save standby assignment', err);
      }
      setConfirmationStatus('');
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.35),rgba(2,6,23,0.95)),url('https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center blur-sm scale-105" />
      <div className="fixed inset-0 bg-slate-950/45" />

      <div className="relative z-10">
        <DateNavigator
          selectedDate={selectedDate}
          onPrevious={() => setSelectedDate((date) => subDays(date, 1))}
          onNext={() => setSelectedDate((date) => addDays(date, 1))}
        />

        <div className="no-print mx-auto max-w-5xl px-4 pt-5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
          {statusText}
        </div>

        <AbsenceManager
          people={people}
          onUpdateAvailability={handleUpdateAvailability}
          onRegenerateBoard={handleRegenerateBoard}
        />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <div className="px-4 py-8 sm:py-12">
            <RidersBoard
              selectedDate={selectedDate}
              shift={shift}
              vehicles={vehicles}
              people={people}
              duties={duties}
              events={events}
              standbyAssignments={standbyAssignments}
              onAddEvent={handleAddEvent}
              onDeleteEvent={handleDeleteEvent}
            />
            <BoardActions
              onAutoGenerate={handleAutoGenerate}
              onConfirmBoard={handleConfirmBoard}
              onPrint={handlePrint}
              isBoardEmpty={!vehicles.some((v) => v.seats.some((s) => s.personId)) && !duties.some((d) => d.personId)}
            />
          </div>

          <DragOverlay zIndex={1000}>
            {activePerson ? (
              <div className="bg-white text-slate-900 px-3 py-2 border-2 border-ink shadow-xl font-black uppercase text-[11px] pointer-events-none">
                {activePerson.name}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
