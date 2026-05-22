import { supabase } from './supabaseClient';

export async function getVehiclesWithSeats() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, seats(*)')
    .eq('active', true)
    .order('display_order', { ascending: true })
    .order('display_order', { referencedTable: 'seats', ascending: true });

  if (error) {
    throw error;
  }

  return data;
}
