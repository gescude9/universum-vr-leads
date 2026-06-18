import { supabase } from '../supabaseClient'

export async function getLeadsSheet() {
  const { data, error } = await supabase
    .from('leads_sheet')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function upsertLeadSheet(lead) {
  // Si tiene fila_sheet, actualiza por fila; si no, inserta
  if (lead.fila_sheet) {
    const { data, error } = await supabase
      .from('leads_sheet')
      .upsert(lead, { onConflict: 'fila_sheet' })
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('leads_sheet')
      .insert(lead)
      .select()
      .single()
    if (error) throw error
    return data
  }
}

export async function updateLeadSheet(id, patch) {
  const { data, error } = await supabase
    .from('leads_sheet')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteLeadSheet(id) {
  const { error } = await supabase.from('leads_sheet').delete().eq('id', id)
  if (error) throw error
}
