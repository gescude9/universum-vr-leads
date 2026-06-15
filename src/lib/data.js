import { supabase } from '../supabaseClient'

// ============================================================
//  Capa de datos — todas las operaciones contra Supabase.
//  Las columnas usan snake_case (monto_estimado, monto_cerrado...).
// ============================================================

// ---------- Vendedores ----------
export async function getVendedores() {
  const { data, error } = await supabase
    .from('vendedores')
    .select('*')
    .order('nombre', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createVendedor(v) {
  const { data, error } = await supabase
    .from('vendedores')
    .insert(v)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateVendedor(id, patch) {
  const { data, error } = await supabase
    .from('vendedores')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteVendedor(id) {
  const { error } = await supabase.from('vendedores').delete().eq('id', id)
  if (error) throw error
}

// ---------- Leads ----------
export async function getLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createLead(lead) {
  const { data, error } = await supabase
    .from('leads')
    .insert(lead)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateLead(id, patch) {
  const { data, error } = await supabase
    .from('leads')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteLead(id) {
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) throw error
}
