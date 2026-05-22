import { supabase } from './supabaseClient';

export async function getPeople() {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('active', true)
    .order('rank', { ascending: true })
    .order('full_name', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}
