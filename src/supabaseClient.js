import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  // Aviso útil durante el desarrollo si falta el archivo .env
  console.warn(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
      'Copia .env.example como .env y rellena tus datos de Supabase.'
  )
}

export const supabase = createClient(url || '', key || '')
export const supabaseConfigurado = Boolean(url && key)
