import { supabase } from '../supabaseClient'

export async function getPrereservas() {
  const { data, error } = await supabase
    .from('prereservas')
    .select('*, vendedores(nombre)')
    .order('ano', { ascending: false })
    .order('mes', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createPrereserva(payload) {
  const { data, error } = await supabase
    .from('prereservas')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePrereserva(id, patch) {
  const { data, error } = await supabase
    .from('prereservas')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePrereserva(id) {
  const { error } = await supabase.from('prereservas').delete().eq('id', id)
  if (error) throw error
}
