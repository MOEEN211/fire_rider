import type { CalendarEvent, Duty, Person, RankCode, SkillCode, Vehicle } from '../types/board';
import { supabase } from './supabaseClient';

type SupabaseSeat = {
  id: string;
  label: string;
  display_order: number;
};

type SupabaseVehicle = {
  id: string;
  name: string;
  registration: string | null;
  display_order: number;
  seats: SupabaseSeat[];
};

type SupabasePerson = {
  id: string;
  full_name: string;
  rank: string | null;
  staff_number: string | null;
  active: boolean | null;
};

type SupabasePersonSkill = {
  person_id: string;
  skills: {
    code: string;
  } | null;
};

type SupabaseDuty = {
  id: string;
  label: string;
  display_order: number;
};

type SupabaseCalendarEvent = {
  id: string;
  title: string;
  start_time: string | null;
};

export type DashboardData = {
  vehicles: Vehicle[];
  people: Person[];
  duties: Duty[];
  events: CalendarEvent[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const [vehiclesResult, peopleResult, dutiesResult, eventsResult] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, name, registration, display_order, seats(id, label, display_order)')
      .eq('active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('people')
      .select('id, full_name, rank, staff_number, active')
      .order('full_name', { ascending: true }),
    supabase
      .from('duties')
      .select('id, label, display_order')
      .eq('active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('calendar_events')
      .select('id, title, start_time')
      .order('start_time', { ascending: true }),
  ]);

  const { data: personSkillsResult, error: personSkillsError } = await supabase
    .from('person_skills')
    .select('person_id, skills(code)');

  if (personSkillsError) {
    throw personSkillsError;
  }

  const skillMap = new Map<string, string[]>();
  ((personSkillsResult ?? []) as SupabasePersonSkill[]).forEach((row) => {
    if (!row.skills?.code) {
      return;
    }
    const existing = skillMap.get(row.person_id) ?? [];
    existing.push(row.skills.code);
    skillMap.set(row.person_id, existing);
  });

  const firstError = vehiclesResult.error || peopleResult.error || dutiesResult.error || eventsResult.error;

  if (firstError) {
    throw firstError;
  }

  const rawPeople = (peopleResult.data ?? []) as SupabasePerson[];
  console.log('[DashboardData] people count from Supabase:', rawPeople.length);
  console.log('[DashboardData] people:', rawPeople.map((p) => `${p.full_name} (active=${p.active})`).join(', '));

  const vehicles = ((vehiclesResult.data ?? []) as SupabaseVehicle[]).map((vehicle) => ({
    id: vehicle.id,
    name: vehicle.name,
    registration: vehicle.registration ?? '',
    seats: [...(vehicle.seats ?? [])]
      .sort((a, b) => a.display_order - b.display_order)
      .map((seat) => ({
        id: seat.id,
        label: seat.label,
      })),
  }));

  const people: Person[] = ((peopleResult.data ?? []) as SupabasePerson[]).map((person, index) => ({
    id: person.id,
    marker: index < 2 ? 'O/T/H/O' : '',
    rank: (person.rank as RankCode) || 'FF',
    name: person.full_name ?? '',
    staffNumber: person.staff_number ?? '',
    skills: (skillMap.get(person.id) ?? []) as SkillCode[],
    dutyStatus: 'On Duty',
    rides: 0,
    availability: 'On Duty',
  }));

  const duties = ((dutiesResult.data ?? []) as SupabaseDuty[]).map((duty) => ({
    id: duty.id,
    label: duty.label,
  }));

  const events = ((eventsResult.data ?? []) as SupabaseCalendarEvent[]).map((event) => ({
    id: event.id,
    time: event.start_time
      ? new Date(event.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : '',
    title: event.title,
  }));

  return { vehicles, people, duties, events };
}

export async function getEventsByDate(date: string): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('id, title, start_time')
    .eq('date', date)
    .order('start_time', { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as SupabaseCalendarEvent[]).map((event) => ({
    id: event.id,
    time: event.start_time
      ? new Date(event.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : '',
    title: event.title,
  }));
}
