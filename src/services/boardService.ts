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

export type SupabaseRosterAssignment = {
  person_id: string;
  availability: string;
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

export async function getOrCreateRosterDay(date: string): Promise<string> {
  // First check if it exists
  const { data: existing, error: findError } = await supabase
    .from('roster_days')
    .select('id')
    .eq('date', date)
    .maybeSingle();

  if (existing) return (existing as any).id;

  // Need station_id for new roster_day
  const { data: station } = await supabase
    .from('stations')
    .select('id')
    .eq('location_code', 'GREEN-WATCH')
    .single();

  if (!station) throw new Error('Station not found');

  const { data: newDay, error: insertError } = await (supabase.from('roster_days') as any)
    .insert({
      date,
      station_id: (station as any).id,
      source_system: 'Manual',
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[getOrCreateRosterDay] Error:', insertError);
    throw insertError;
  }

  return (newDay as any).id;
}

export async function getRosterAssignments(date: string): Promise<Record<string, string>> {
  const { data: rosterDay } = await supabase
    .from('roster_days')
    .select('id')
    .eq('date', date)
    .maybeSingle();

  if (!rosterDay) return {};

  const { data, error } = await supabase
    .from('roster_assignments')
    .select('person_id, duty_status')
    .eq('roster_day_id', (rosterDay as any).id);

  if (error) {
    console.error('[getRosterAssignments] Error:', error);
    return {};
  }

  const map: Record<string, string> = {};
  (data ?? []).forEach((row: any) => {
    map[row.person_id] = row.duty_status;
  });
  return map;
}

export async function saveRosterAssignment(date: string, personId: string, availability: string) {
  const rosterDayId = await getOrCreateRosterDay(date);

  const { error } = await (supabase.from('roster_assignments') as any)
    .upsert(
      {
        roster_day_id: rosterDayId,
        person_id: personId,
        duty_status: availability,
        available_for_seating: availability === 'On Duty',
      },
      { onConflict: 'roster_day_id,person_id' }
    );

  if (error) {
    console.error(`[saveRosterAssignment] Failed for person ${personId}:`, error);
    throw error;
  }
}

// Get total ride count for each person across all historical board assignments
export async function getPersonTotalRides(): Promise<Record<string, number>> {
  try {
    console.log('[getPersonTotalRides] Fetching all historical assignments...');

    // First get all boards to check what we have access to
    const { data: boardsData, error: boardsError } = await (supabase.from('boards') as any)
      .select('id');

    if (boardsError) {
      console.error('[getPersonTotalRides] Error fetching boards:', boardsError);
      return {};
    }

    const boardIds = (boardsData ?? []).map((b: { id: string }) => b.id);
    console.log('[getPersonTotalRides] Available board IDs:', boardIds.length);

    if (boardIds.length === 0) {
      console.log('[getPersonTotalRides] No boards found, returning empty counts');
      return {};
    }

    // Get seat assignments for all accessible boards
    const { data: seatData, error: seatError } = await (supabase
      .from('board_seat_assignments') as any)
      .select('person_id, board_id')
      .in('board_id', boardIds)
      .not('person_id', 'is', null);

    if (seatError) {
      console.error('[getPersonTotalRides] Error fetching seat assignments:', seatError);
    }

    // Get duty assignments for all accessible boards
    const { data: dutyData, error: dutyError } = await (supabase
      .from('board_duty_assignments') as any)
      .select('person_id, board_id')
      .in('board_id', boardIds)
      .not('person_id', 'is', null);

    if (dutyError) {
      console.error('[getPersonTotalRides] Error fetching duty assignments:', dutyError);
    }

    console.log('[getPersonTotalRides] Seat assignments found:', seatData?.length ?? 0);
    console.log('[getPersonTotalRides] Duty assignments found:', dutyData?.length ?? 0);

    // Count rides per person
    const ridesCount: Record<string, number> = {};

    const seatAssignments = (seatData ?? []) as Array<{ person_id: string }>;
    const dutyAssignments = (dutyData ?? []) as Array<{ person_id: string }>;

    seatAssignments.forEach((assignment) => {
      if (assignment.person_id) {
        ridesCount[assignment.person_id] = (ridesCount[assignment.person_id] ?? 0) + 1;
      }
    });

    dutyAssignments.forEach((assignment) => {
      if (assignment.person_id) {
        ridesCount[assignment.person_id] = (ridesCount[assignment.person_id] ?? 0) + 1;
      }
    });

    console.log('[getPersonTotalRides] Final calculated rides count:', ridesCount);
    return ridesCount;
  } catch (error) {
    console.error('[getPersonTotalRides] Failed to get person total rides:', error);
    return {};
  }
}

export async function getPersonRidesForDate(date: string): Promise<Record<string, number>> {
  try {
    const { data: boardsData } = await (supabase.from('boards') as any)
      .select('id')
      .eq('date', date);

    const boardIds = (boardsData ?? []).map((b: { id: string }) => b.id);
    if (boardIds.length === 0) return {};

    const [seatRes, dutyRes] = await Promise.all([
      supabase.from('board_seat_assignments').select('person_id').in('board_id', boardIds).not('person_id', 'is', null),
      supabase.from('board_duty_assignments').select('person_id').in('board_id', boardIds).not('person_id', 'is', null),
    ]);

    const counts: Record<string, number> = {};
    [...(seatRes.data ?? []), ...(dutyRes.data ?? [])].forEach((a: any) => {
      if (a.person_id) counts[a.person_id] = (counts[a.person_id] ?? 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error('[getPersonRidesForDate] Error:', error);
    return {};
  }
}
