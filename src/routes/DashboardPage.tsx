import { useEffect, useMemo, useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { addDays, subDays } from 'date-fns';
import AbsenceManager from '../components/board/AbsenceManager';
import BoardActions from '../components/board/BoardActions';
import RidersBoard from '../components/board/RidersBoard';
import DateNavigator from '../components/layout/DateNavigator';
import { mockDuties, mockEvents, mockPeople, mockVehicles } from '../data/mockBoardData';
import { confirmBoardByDate, getBoardAssignments, getBoardByDate, getBoardDutyAssignments, getPersonTotalRides, saveDutyAssignment, saveSeatAssignment } from '../services/boardService';
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
  const [dataSource, setDataSource] = useState<'loading' | 'supabase' | 'mock'>('loading');
  const [confirmationStatus, setConfirmationStatus] = useState('');
  const [boardStatus, setBoardStatus] = useState('');
  const [shift, setShift] = useState<'Day' | 'Night'>('Day');
  const [isOffDuty, setIsOffDuty] = useState(false);

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

  useEffect(() => {
    let isMounted = true;

    async function loadSavedBoardState() {
      if (dataSource === 'loading') {
        return;
      }

      try {
        const boardDate = formatDateForSupabase(selectedDate);
        const [board, seatAssignments, dutyAssignments, totalRides] = await Promise.all([
          getBoardByDate(boardDate, shift),
          getBoardAssignments(boardDate, shift),
          getBoardDutyAssignments(boardDate, shift),
          getPersonTotalRides(), // Get total historical rides for all people
        ]);

        if (!isMounted) {
          return;
        }

        setBoardStatus(board?.status ?? 'Draft');

        // Reset all assignments to empty first, then load saved data for this date
        setVehicles((currentVehicles) =>
          currentVehicles.map((vehicle) => ({
            ...vehicle,
            seats: vehicle.seats.map((seat) => {
              // Only assign if there's a saved assignment for THIS date
              const savedAssignment = seatAssignments.find((assignment) => assignment.seat_id === seat.id);
              return {
                ...seat,
                personId: savedAssignment?.person_id ?? undefined,
              };
            }),
          })),
        );

        // Reset duties to empty first, then load saved data for this date
        setDuties((currentDuties) =>
          currentDuties.map((duty) => {
            const saved = dutyAssignments.find((a) => a.duty_id === duty.id);
            return {
              ...duty,
              personId: saved?.person_id ?? undefined,
            };
          }),
        );

        // Set rides count to TOTAL historical rides from database (not just today)
        setPeople((currentPeople) =>
          currentPeople.map((person) => ({
            ...person,
            rides: totalRides[person.id] ?? 0,
          })),
        );
      } catch (error) {
        console.error('Failed to load saved board assignments', error);
      }
    }

    loadSavedBoardState();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, dataSource, shift]);

  useEffect(() => {
    // Recalculate rides count from current vehicle assignments
    const ridesCount = new Map<string, number>();
    vehicles.forEach((vehicle) => {
      vehicle.seats.forEach((seat) => {
        if (seat.personId) {
          ridesCount.set(seat.personId, (ridesCount.get(seat.personId) ?? 0) + 1);
        }
      });
    });

    setPeople((currentPeople) =>
      currentPeople.map((person) => ({
        ...person,
        rides: ridesCount.get(person.id) ?? 0,
      })),
    );
  }, [vehicles]);

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
  function handleAutoGenerate() {
    console.log('[handleAutoGenerate] people:', people);
    console.log('[handleAutoGenerate] vehicles:', vehicles);
    const history = buildMockHistory(people, vehicles, duties);

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

    // Calculate rides count for each person from both seats and duties
    const ridesCount = new Map<string, number>();
    updatedVehicles.forEach((vehicle) => {
      vehicle.seats.forEach((seat) => {
        if (seat.personId) {
          ridesCount.set(seat.personId, (ridesCount.get(seat.personId) ?? 0) + 1);
        }
      });
    });
    updatedDuties.forEach((duty) => {
      if (duty.personId) {
        ridesCount.set(duty.personId, (ridesCount.get(duty.personId) ?? 0) + 1);
      }
    });

    setPeople((currentPeople) =>
      currentPeople.map((person) => ({
        ...person,
        rides: ridesCount.get(person.id) ?? 0,
      })),
    );

    setConfirmationStatus('Board auto-generated. Click Confirm Board to save.');
  }

  // Save current board assignments (after editing or auto-generating)
  async function handleConfirmBoard() {
    console.log('[handleConfirmBoard] Saving current assignments...');
    setConfirmationStatus('Saving board...');

    // Calculate rides count from current state
    const ridesCount = new Map<string, number>();
    vehicles.forEach((vehicle) => {
      vehicle.seats.forEach((seat) => {
        if (seat.personId) {
          ridesCount.set(seat.personId, (ridesCount.get(seat.personId) ?? 0) + 1);
        }
      });
    });
    duties.forEach((duty) => {
      if (duty.personId) {
        ridesCount.set(duty.personId, (ridesCount.get(duty.personId) ?? 0) + 1);
      }
    });

    setPeople((currentPeople) =>
      currentPeople.map((person) => ({
        ...person,
        rides: ridesCount.get(person.id) ?? 0,
      })),
    );

    // Save all assignments to database
    const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const boardDate = formatDateForSupabase(selectedDate);

    const savePromises: Promise<unknown>[] = [];

    // Save seat assignments from current state
    vehicles.forEach((vehicle) => {
      vehicle.seats.forEach((seat) => {
        if (!isUuid(seat.id)) {
          console.log('[handleConfirmBoard] Skipping mock seatId save:', seat.id);
          return;
        }
        if (seat.personId && !isUuid(seat.personId)) {
          console.log('[handleConfirmBoard] Skipping mock personId save:', seat.personId);
          return;
        }
        savePromises.push(
          saveSeatAssignment(boardDate, seat.id, seat.personId, shift).catch((err) => {
            console.error('[handleConfirmBoard] Error saving seat assignment', { seatId: seat.id, personId: seat.personId, err });
          })
        );
      });
    });

    // Save duty assignments from current state
    duties.forEach((duty) => {
      if (!isUuid(duty.id)) {
        console.log('[handleConfirmBoard] Skipping mock dutyId save:', duty.id);
        return;
      }
      if (duty.personId && !isUuid(duty.personId)) {
        console.log('[handleConfirmBoard] Skipping mock personId save for duty:', duty.personId);
        return;
      }
      savePromises.push(
        saveDutyAssignment(boardDate, duty.id, duty.personId, shift).catch((err) => {
          console.error('[handleConfirmBoard] Error saving duty assignment', { dutyId: duty.id, personId: duty.personId, err });
        })
      );
    });

    try {
      await Promise.all(savePromises);
      setConfirmationStatus('Board confirmed and saved successfully.');
    } catch (error) {
      console.error('Failed to save board', error);
      setConfirmationStatus('Some assignments could not be saved.');
    }
  }

  function handleUpdateAvailability(personId: string, availability: Person['availability']) {
    setPeople((currentPeople) =>
      currentPeople.map((person) =>
        person.id === personId ? { ...person, availability } : person
      )
    );
  }

  function handleRegenerateBoard() {
    console.log('[DashboardPage] Regenerate board clicked');
    
    // Clear existing assignments first, then regenerate with updated availability
    setVehicles((currentVehicles) =>
      currentVehicles.map((vehicle) => ({
        ...vehicle,
        seats: vehicle.seats.map((seat) => ({ ...seat, personId: undefined })),
      }))
    );

    // Clear duties too
    setDuties((currentDuties) =>
      currentDuties.map((duty) => ({ ...duty, personId: undefined }))
    );

    // Use a small timeout to let state update, then regenerate
    setTimeout(() => {
      console.log('[DashboardPage] Running handleAutoGenerate after clear');
      handleAutoGenerate();
    }, 0);
  }

  async function handleAddEvent(time: string, title: string) {
    try {
      const boardDate = formatDateForSupabase(selectedDate);
      const newEvent = await createCalendarEvent(boardDate, title, time || undefined);
      setEvents((current) => [...current, newEvent]);
      setConfirmationStatus('Note added');
    } catch (error) {
      console.error('Failed to add note', error);
      setConfirmationStatus('Could not add note to Supabase');
    }
  }

  async function handleDeleteEvent(eventId: string) {
    try {
      await deleteCalendarEvent(eventId);
      setEvents((current) => current.filter((e) => e.id !== eventId));
      setConfirmationStatus('Note deleted');
    } catch (error) {
      console.error('Failed to delete note', error);
      setConfirmationStatus('Could not delete note');
    }
  }

  // Just print the current board
  function handlePrint() {
    window.print();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : '';

    if (!activeId.startsWith('person:')) {
      return;
    }

    const draggedPersonId = activeId.replace('person:', '');

    if (overId.startsWith('seat:')) {
      const targetSeatId = overId.replace('seat:', '');
      const allSeats = vehicles.flatMap((vehicle) => vehicle.seats);
      const sourceSeat = allSeats.find((seat) => seat.personId === draggedPersonId);
      const targetSeat = allSeats.find((seat) => seat.id === targetSeatId);

      setVehicles((currentVehicles) => {
        let sourceSeatPersonId: string | undefined;

        const clearedVehicles = currentVehicles.map((vehicle) => ({
          ...vehicle,
          seats: vehicle.seats.map((seat) => {
            if (seat.id === targetSeatId) {
              sourceSeatPersonId = seat.personId;
            }

            if (seat.personId === draggedPersonId) {
              return { ...seat, personId: undefined };
            }

            return seat;
          }),
        }));

        return clearedVehicles.map((vehicle) => ({
          ...vehicle,
          seats: vehicle.seats.map((seat) => {
            if (seat.id === targetSeatId) {
              return { ...seat, personId: draggedPersonId };
            }

            if (sourceSeatPersonId && seat.personId === undefined) {
              const wasDraggedFromThisSeat = currentVehicles
                .flatMap((currentVehicle) => currentVehicle.seats)
                .some((currentSeat) => currentSeat.id === seat.id && currentSeat.personId === draggedPersonId);

              if (wasDraggedFromThisSeat) {
                return { ...seat, personId: sourceSeatPersonId };
              }
            }

            return seat;
          }),
        }));
      });

      // Clear from duties when dropped into a seat
      const sourceDuty = duties.find((duty) => duty.personId === draggedPersonId);
      setDuties((currentDuties) =>
        currentDuties.map((duty) =>
          duty.personId === draggedPersonId ? { ...duty, personId: undefined } : duty
        )
      );

      try {
        const boardDate = formatDateForSupabase(selectedDate);

        await saveSeatAssignment(boardDate, targetSeatId, draggedPersonId, shift);
        setConfirmationStatus('');

        if (sourceSeat && sourceSeat.id !== targetSeatId) {
          await saveSeatAssignment(boardDate, sourceSeat.id, targetSeat?.personId, shift);
        }

        // Clear duty assignment in DB if dragged from a duty
        if (sourceDuty) {
          await saveDutyAssignment(boardDate, sourceDuty.id, undefined, shift);
        }
      } catch (error) {
        console.error('Failed to save seat assignment', error);
        setDataSource('mock');
      }
    } else if (overId.startsWith('duty:')) {
      const targetDutyId = overId.replace('duty:', '');

      // Clear person from any seat
      setVehicles((currentVehicles) =>
        currentVehicles.map((vehicle) => ({
          ...vehicle,
          seats: vehicle.seats.map((seat) =>
            seat.personId === draggedPersonId ? { ...seat, personId: undefined } : seat
          ),
        }))
      );

      // Assign to target duty and clear from any other duty
      setDuties((currentDuties) =>
        currentDuties.map((duty) => {
          if (duty.id === targetDutyId) {
            return { ...duty, personId: draggedPersonId };
          }
          if (duty.personId === draggedPersonId) {
            return { ...duty, personId: undefined };
          }
          return duty;
        })
      );

      // Also clear the seat assignment in the database
      const allSeats = vehicles.flatMap((vehicle) => vehicle.seats);
      const sourceSeat = allSeats.find((seat) => seat.personId === draggedPersonId);
      if (sourceSeat) {
        try {
          const boardDate = formatDateForSupabase(selectedDate);
          await saveSeatAssignment(boardDate, sourceSeat.id, undefined, shift);
        } catch (error) {
          console.error('Failed to clear seat assignment', error);
        }
      }

      // Save duty assignment to database
      try {
        const boardDate = formatDateForSupabase(selectedDate);
        await saveDutyAssignment(boardDate, targetDutyId, draggedPersonId, shift);
      } catch (error) {
        console.error('Failed to save duty assignment', error);
      }

      setConfirmationStatus('');
    }
  }

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

        <DndContext onDragEnd={handleDragEnd}>
          <section className="px-4 py-8 sm:py-12">
            <RidersBoard
              selectedDate={selectedDate}
              shift={shift}
              onShiftChange={setShift}
              isOffDuty={isOffDuty}
              shiftLabel={getShiftLabel(selectedDate)}
              vehicles={vehicles}
              people={people}
              duties={duties}
              events={events}
              onAddEvent={handleAddEvent}
              onDeleteEvent={handleDeleteEvent}
            />
            <BoardActions onAutoGenerate={handleAutoGenerate} onConfirmBoard={handleConfirmBoard} onPrint={handlePrint} />
          </section>
        </DndContext>
      </div>
    </div>
  );
}
