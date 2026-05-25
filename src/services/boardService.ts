import { supabase } from './supabaseClient';

export type BoardAssignment = {
  seat_id: string;
  person_id: string | null;
};

export type SupabaseBoardSeatAssignment = {
  id: string;
  board_id: string;
  seat_id: string;
  person_id: string | null;
  assignment_source: string;
  created_at: string;
  updated_at: string;
};

export type SupabaseBoard = {
  id: string;
  date: string;
  station_id: string;
  watch_group_id: string | null;
  shift: string;
  status: 'Draft' | 'Confirmed';
  confirmation_source: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  board_seat_assignments: SupabaseBoardSeatAssignment[];
};

export async function getBoardByDate(date: string, shift: string = 'Day'): Promise<SupabaseBoard | null> {
  const { data, error } = await supabase
    .from('boards')
    .select('*, board_seat_assignments(*)')
    .eq('date', date)
    .eq('shift', shift)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as SupabaseBoard | null;
}

export async function getOrCreateBoard(date: string, shift: string = 'Day'): Promise<SupabaseBoard> {
  const existingBoard = await getBoardByDate(date, shift);

  if (existingBoard) {
    return existingBoard;
  }

  const { data: station, error: stationError } = await supabase
    .from('stations')
    .select('id')
    .eq('location_code', 'GREEN-WATCH')
    .single();

  if (stationError) {
    throw stationError;
  }

  const stationId = (station as { id: string }).id;

  const { data: watchGroup, error: watchGroupError } = await supabase
    .from('watch_groups')
    .select('id')
    .eq('station_id', stationId)
    .eq('name', 'Green Watch')
    .single();

  if (watchGroupError) {
    throw watchGroupError;
  }

  const watchGroupId = (watchGroup as { id: string }).id;

  const { data, error } = await (supabase.from('boards') as any)
    .insert({
      date,
      station_id: stationId,
      watch_group_id: watchGroupId,
      shift,
      status: 'Draft',
    })
    .select('*, board_seat_assignments(*)')
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseBoard;
}

export async function getBoardAssignments(date: string, shift: string = 'Day'): Promise<BoardAssignment[]> {
  const board = await getOrCreateBoard(date, shift);
  return board.board_seat_assignments ?? [];
}

export async function saveSeatAssignment(date: string, seatId: string, personId?: string, shift: string = 'Day') {
  const board = await getOrCreateBoard(date, shift);

  const { data, error } = await (supabase.from('board_seat_assignments') as any)
    .upsert(
      {
        board_id: board.id,
        seat_id: seatId,
        person_id: personId ?? null,
        assignment_source: 'Manual',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'board_id,seat_id' },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function confirmBoard(boardId: string, confirmedBy?: string) {
  const { data, error } = await (supabase.from('boards') as any)
    .update({
      status: 'Confirmed',
      confirmation_source: 'Manual',
      confirmed_by: confirmedBy ?? null,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', boardId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseBoard;
}

export type DutyAssignment = {
  duty_id: string;
  person_id: string | null;
};

export async function getBoardDutyAssignments(date: string, shift: string = 'Day'): Promise<DutyAssignment[]> {
  const board = await getOrCreateBoard(date, shift);

  const { data, error } = await supabase
    .from('board_duty_assignments')
    .select('duty_id, person_id')
    .eq('board_id', board.id);

  if (error) {
    throw error;
  }

  return (data ?? []) as DutyAssignment[];
}

export async function saveDutyAssignment(date: string, dutyId: string, personId?: string, shift: string = 'Day') {
  const board = await getOrCreateBoard(date, shift);

  const { data, error } = await (supabase.from('board_duty_assignments') as any)
    .upsert(
      {
        board_id: board.id,
        duty_id: dutyId,
        person_id: personId ?? null,
        assignment_source: 'Manual',
      },
      { onConflict: 'board_id,duty_id' },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function confirmBoardByDate(date: string, shift: string = 'Day') {
  const board = await getOrCreateBoard(date, shift);
  return confirmBoard(board.id);
}

// Get total ride count for each person across all historical board assignments
export async function getPersonTotalRides(): Promise<Record<string, number>> {
  try {
    console.log('[getPersonTotalRides] Fetching all historical assignments...');

    // Get all seat assignments from all boards (excluding null person_id)
    const { data: seatData, error: seatError } = await (supabase
      .from('board_seat_assignments') as any)
      .select('person_id')
      .not('person_id', 'is', null);

    if (seatError) {
      console.error('[getPersonTotalRides] Error fetching seat assignments:', seatError);
      return {};
    }

    // Get all duty assignments from all boards (excluding null person_id)
    const { data: dutyData, error: dutyError } = await (supabase
      .from('board_duty_assignments') as any)
      .select('person_id')
      .not('person_id', 'is', null);

    if (dutyError) {
      console.error('[getPersonTotalRides] Error fetching duty assignments:', dutyError);
      return {};
    }

    console.log('[getPersonTotalRides] Seat assignments count:', seatData?.length ?? 0);
    console.log('[getPersonTotalRides] Duty assignments count:', dutyData?.length ?? 0);

    // Count rides per person
    const ridesCount: Record<string, number> = {};

    const seatAssignments = (seatData ?? []) as Array<{ person_id: string }>;
    const dutyAssignments = (dutyData ?? []) as Array<{ person_id: string }>;

    seatAssignments.forEach((assignment) => {
      ridesCount[assignment.person_id] = (ridesCount[assignment.person_id] ?? 0) + 1;
    });

    dutyAssignments.forEach((assignment) => {
      ridesCount[assignment.person_id] = (ridesCount[assignment.person_id] ?? 0) + 1;
    });

    console.log('[getPersonTotalRides] Calculated rides count:', ridesCount);
    return ridesCount;
  } catch (error) {
    console.error('[getPersonTotalRides] Failed to get person total rides:', error);
    return {};
  }
}

