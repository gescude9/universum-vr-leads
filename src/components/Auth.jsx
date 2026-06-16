import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase, supabaseConfigurado } from '../supabaseClient'
import LanguageToggle from './LanguageToggle'

export default function Auth() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!supabaseConfigurado) { setError(t('auth.errorConfig')); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(t('auth.error'))
  }

  return (
    <div className="center-screen">
      <div style={{ position: 'fixed', top: 16, right: 16 }}><LanguageToggle /></div>
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="brand">
          <div className="orb"></div>
          <div><b>Universum VR</b><br /><small>Leads · Cumpleaños</small></div>
        </div>
        <h1>{t('auth.titulo')}</h1>
        <p>{t('auth.subtitulo')}</p>
        {error && <div className="auth-error">{error}</div>}
        <div className="field">
          <label>{t('auth.correo')}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="tu@correo.com" autoComplete="email" required />
        </div>
        <div className="field">
          <label>{t('auth.contrasena')}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" autoComplete="current-password" required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? t('auth.entrando') : t('auth.entrar')}
        </button>
        <div className="auth-note">{t('auth.nota')}</div>
      </form>
    </div>
  )
}
