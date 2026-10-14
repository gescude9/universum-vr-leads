import { supabase } from '../supabaseClient'

export async function getExtras() {
  const { data, error } = await supabase
    .from('extras')
    .select('*, vendedores(nombre)')
    .order('ano', { ascending: false })
    .order('mes', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createExtra(payload) {
  const { data, error } = await supabase
    .from('extras')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateExtra(id, patch) {
  const { data, error } = await supabase
    .from('extras')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteExtra(id) {
  const { error } = await supabase.from('extras').delete().eq('id', id)
  if (error) throw error
}
