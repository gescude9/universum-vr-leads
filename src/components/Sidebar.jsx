const ITEMS = [
  { id: 'dashboard', label: 'Dashboard', ic: '◎' },
  { id: 'leads', label: 'Leads', ic: '★' },
  { id: 'vendedores', label: 'Vendedores', ic: '⬡' },
  { id: 'calendario', label: 'Calendario', ic: '▦' },
]

export default function Sidebar({ view, setView, email, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="orb"></div>
        <div>
          <b>Universum VR</b>
          <br />
          <small>Leads · Cumpleaños</small>
        </div>
      </div>

      {ITEMS.map((it) => (
        <button
          key={it.id}
          className={`nav-btn ${view === it.id ? 'active' : ''}`}
          onClick={() => setView(it.id)}
        >
          <span className="ic">{it.ic}</span> {it.label}
        </button>
      ))}

      <div className="spacer"></div>
      {email && (
        <div className="user-chip">
          Sesión: <b>{email}</b>
        </div>
      )}
      <button className="logout" onClick={onLogout}>
        Cerrar sesión
      </button>
    </aside>
  )
}
