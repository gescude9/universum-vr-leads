import { useState } from 'react'
import { supabase, supabaseConfigurado } from '../supabaseClient'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!supabaseConfigurado) {
      setError('Falta configurar Supabase. Crea el archivo .env con tu URL y clave.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError('No se pudo iniciar sesión. Revisa el correo y la contraseña.')
  }

  return (
    <div className="center-screen">
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="brand">
          <div className="orb"></div>
          <div>
            <b>Universum VR</b>
            <br />
            <small>Leads · Cumpleaños</small>
          </div>
        </div>
        <h1>Iniciar sesión</h1>
        <p>Accede con tu cuenta de equipo para gestionar los leads.</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="field">
          <label>Correo</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <div className="auth-note">
          Las cuentas se crean desde el panel de Supabase
          (Authentication → Users) o habilitando el registro.
        </div>
      </form>
    </div>
  )
}
