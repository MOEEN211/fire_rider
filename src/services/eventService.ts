import { supabase } from './supabaseClient';
import type { CalendarEvent } from '../types/board';

type CalendarEventRow = {
  id: string;
  title: string;
  start_time: string | null;
};

export async function createCalendarEvent(
  date: string,
  title: string,
  startTime?: string
): Promise<CalendarEvent> {
  const { data, error } = await (supabase.from('calendar_events') as any)
    .insert({
      date,
      title,
      start_time: startTime ? `${date}T${startTime}:00` : null,
    })
    .select('id, title, start_time');

  if (error) {
    console.error('Supabase insert error:', error);
    throw error;
  }

  const row = (data as CalendarEventRow[] | null)?.[0];

  if (!row) {
    throw new Error('No row returned after insert');
  }

  return {
    id: row.id,
    time: row.start_time
      ? new Date(row.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : '',
    title: row.title,
  };
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId);

  if (error) {
    console.error('Supabase delete error:', error);
    throw error;
  }
}
