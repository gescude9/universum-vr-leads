import { useTranslation } from 'react-i18next'
import LanguageToggle from './LanguageToggle'

export default function Sidebar({ view, setView, email, onLogout }) {
  const { t } = useTranslation()

  const ITEMS = [
    { id: 'dashboard', label: t('nav.dashboard'), ic: '◎' },
    { id: 'leads', label: t('nav.leads'), ic: '★' },
    { id: 'vendedores', label: t('nav.vendedores'), ic: '⬡' },
    { id: 'calendario', label: t('nav.calendario'), ic: '▦' },
  ]

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="orb"></div>
        <div><b>Universum VR</b><br /><small>Leads · Cumpleaños</small></div>
      </div>
      {ITEMS.map(it => (
        <button key={it.id} className={`nav-btn ${view === it.id ? 'active' : ''}`}
          onClick={() => setView(it.id)}>
          <span className="ic">{it.ic}</span> {it.label}
        </button>
      ))}
      <div className="spacer"></div>
      <LanguageToggle />
      {email && <div className="user-chip">{t('nav.sesion')}: <b>{email}</b></div>}
      <button className="logout" onClick={onLogout}>{t('nav.cerrarSesion')}</button>
    </aside>
  )
}
